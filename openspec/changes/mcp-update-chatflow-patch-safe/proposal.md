# Proposal: mcp-update-chatflow-patch-safe

## Intent

Fix a critical bug in the MCP tool `update_chatflow` where partial flowData payloads silently overwrite existing node configurations on the Flowise server, causing node loss during updates. The handler sends incomplete payloads without first fetching existing data and relies on `fixFlowData` to inject defaults that create false "complete" structures, overwriting nodes that weren't provided in the update.

## Scope

### In Scope

-   **Code fix**: Modify `handleUpdateChatflow` in `packages/flowise-mcp-server/src/handlers.ts` to fetch existing flow before updating
-   **Schema update**: Add a `mode` parameter to `update_chatflow` tool definition (`packages/flowise-mcp-server/src/index.ts`)
-   **Tests**: Add unit/integration tests in `packages/flowise-mcp-server/src/__tests__/`
-   **Restore AGENTFLOW**: Restore chatflow c7a2f9be-07e9-4703-ac66-a3cecf60a9a6 to its original 10-node state

### Out of Scope

-   Changes to Flowise server (`packages/server`) — server-side merge works correctly
-   Changes to `create_chatflow` — only `update` is affected
-   Auto-migration of existing flows — manual restore only

## Capabilities

### New Capabilities

-   `patch-safe-update`: Allows partial flowData updates by first fetching existing data and merging server-side
-   `full-replace-update`: Retains current behavior for callers who explicitly want full replacement
-   `dry-run`: Validates the update without persisting

### Modified Capabilities

-   `update_chatflow`: Now requires `mode` parameter to determine update strategy

## Approach

**GET → MERGE → PUT** (new architecture):

1. Fetch existing flow via GET `/chatflows/{id}`
2. If `mode: "patch"` (default), merge received payload with existing server-side
3. Send merged payload via PUT
4. If `mode: "full-replace"`, send as-is (current behavior for explicit full replacement)

Guardrails:

-   `dryRun: true` → validate only, no save
-   Warn if no changes detected between incoming and existing
-   Log before/after node counts for debugging

## Affected Areas

| Area                                                  | Impact   | Description                                   |
| ----------------------------------------------------- | -------- | --------------------------------------------- |
| `packages/flowise-mcp-server/src/handlers.ts:204-228` | Modified | `handleUpdateChatflow` adds GET before PUT    |
| `packages/flowise-mcp-server/src/index.ts:200-215`    | Modified | Add `mode` and `dryRun` params to tool schema |
| `packages/flowise-mcp-server/src/__tests__/`          | New      | Tests for merge behavior                      |

## Risks

| Risk                                                                | Likelihood | Mitigation                                                           |
| ------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------- |
| Breaking existing callers relying on current partial-write behavior | Med        | Default to `patch` mode, add `full-replace` for explicit full writes |
| Race condition if flow changes between GET and PUT                  | Low        | Use Optimistic Locking / ETag if Flowise supports, or warn user      |
| Test coverage gaps for merge edge cases                             | Med        | Add comprehensive test matrix (null/nodes/edges/cfg variations)      |

## Rollback Plan

1. Revert `handlers.ts` and `index.ts` to previous commits
2. Use Flowise UI or direct DB restore for corrupted AGENTFLOW
3. No database migrations required

## Dependencies

-   Flowise server GET endpoint must be functional (`/chatflows/{id}`)
-   Existing test fixtures for flowData structures

## Success Criteria

-   [ ] Partial update on test flow preserves existing nodes not in update payload
-   [ ] `update_chatflow` with `mode: "patch"` only sends changed fields
-   [ ] `update_chatflow` with `dryRun: true` returns validation without saving
-   [ ] c7a2f9be-07e9-4703-ac66-a3cecf60a9a6 restored to original 10-node state
-   [ ] All existing tests pass
