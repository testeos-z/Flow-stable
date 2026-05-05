# Tasks: MCP Update Chatflow Patch-Safe

## Review Workload Forecast

| Field                   | Value      |
| ----------------------- | ---------- |
| Estimated changed lines | ~240 lines |
| 400-line budget risk    | Low        |
| Chained PRs recommended | No         |
| Suggested split         | Single PR  |
| Delivery strategy       | auto-chain |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal                      | Likely PR | Notes                          |
| ---- | ------------------------- | --------- | ------------------------------ |
| 1    | Core fix + schema + tests | PR 1      | All in one PR - self-contained |

---

## Phase 0: Restore (ONE-TIME, Operational)

-   [ ] 0.1 Restore AGENTFLOW c7a2f9be-07e9-4703-ac66-a3cecf60a9a6 to original 10-node state using `mode: "full-replace"` with known-good flowData (user must provide original flowData or find in git history)
    -   **Verification**: GET chatflow returns 10 nodes with full node configs
    -   **Note**: Requires MCP server redeployment with new code before execution

---

## Phase 1: Core Fix — handlers.ts

-   [x] 1.1 Add `getExistingFlow(api, chatflowId)` helper function in handlers.ts to fetch existing flowData via GET `/chatflows/{id}`

    -   **Files**: `packages/flowise-mcp-server/src/handlers.ts`
    -   **Verification**: Returns parsed flowData or throws clear error

-   [x] 1.2 Add `mergeFlowData(existing, incoming)` function for deep merge by node.id / edge.id

    -   **Files**: `packages/flowise-mcp-server/src/handlers.ts`
    -   **Verification**: Unit tests pass - incoming nodes override existing by ID, existing nodes preserved when not in incoming

-   [x] 1.3 Modify `handleUpdateChatflow` to use GET → merge → validate → PUT in patch mode (default)

    -   **Files**: `packages/flowise-mcp-server/src/handlers.ts`
    -   **Verification**: Partial flowData update preserves existing nodes

-   [x] 1.4 Add node-count guardrail: block if node reduction > 30% in patch mode (unless forceOverwrite)

    -   **Files**: `packages/flowise-mcp-server/src/handlers.ts`
    -   **Verification**: 50% reduction returns error, 20% reduction succeeds

-   [x] 1.5 Add `mode` parameter support: "patch" (default) vs "full-replace"

    -   **Files**: `packages/flowise-mcp-server/src/handlers.ts`
    -   **Verification**: full-replace skips GET, sends payload as-is

-   [x] 1.6 Add `forceOverwrite` / `allowDestructiveUpdate` flags to bypass guardrail
    -   **Files**: `packages/flowise-mcp-server/src/handlers.ts`
    -   **Verification**: forceOverwrite: true with 70% reduction succeeds with warning

---

## Phase 2: Schema Update — index.ts

-   [x] 2.1 Add `mode` param to update_chatflow tool schema (patch | full-replace, default patch)

    -   **Files**: `packages/flowise-mcp-server/src/index.ts`
    -   **Verification**: Tool accepts mode parameter

-   [x] 2.2 Add `forceOverwrite` param to update_chatflow tool schema

    -   **Files**: `packages/flowise-mcp-server/src/index.ts`
    -   **Verification**: Tool accepts forceOverwrite parameter

-   [x] 2.3 Add `allowDestructiveUpdate` as alias param

    -   **Files**: `packages/flowise-mcp-server/src/index.ts`
    -   **Verification**: allowDestructiveUpdate works as alias for forceOverwrite

-   [x] 2.4 Update tool descriptions to explain patch vs replace modes
    -   **Files**: `packages/flowise-mcp-server/src/index.ts`
    -   **Verification**: Tool description explains new behavior

---

## Phase 3: Tests

-   [x] 3.1 Write unit tests for `mergeFlowData()` function - covers node override, edge merge, config preservation

    -   **Files**: `packages/flowise-mcp-server/src/__tests__/handlers.test.ts`
    -   **Verification**: All test cases pass

-   [x] 3.2 Write unit tests for node-count guardrail - 30% threshold, forceOverwrite bypass

    -   **Files**: `packages/flowise-mcp-server/src/__tests__/handlers.test.ts`
    -   **Verification**: All threshold tests pass

-   [ ] 3.3 Write integration tests for patch vs replace behavior

    -   **Files**: `packages/flowise-mcp-server/src/__tests__/update-chatflow.test.ts`
    -   **Verification**: Patch preserves existing nodes, replace overwrites

-   [ ] 3.4 Add AGENTFLOW restoration verification test - verify all 10 nodes + configs after restore
    -   **Files**: `packages/flowise-mcp-server/src/__tests__/agentflow-restore.test.ts`
    -   **Verification**: Restore verification passes

---

## Dependencies & Order

1. Phase 0 (restore) - can run anytime, operational task
2. Phase 1.1-1.2 (helpers) must complete before 1.3
3. Phase 1.3-1.6 after helpers, before Phase 2
4. Phase 2 after handlers changes, uses new handler params
5. Phase 3 after all code changes, tests the implementation

---

## Next Step

Ready for implementation (sdd-apply). This is a self-contained change that fits in a single PR.
