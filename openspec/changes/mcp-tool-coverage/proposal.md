# Proposal: MCP Tool Coverage — Expand flow-validation to 57 tools

## Intent

The `flow-validation` MCP server exposes only 19 tools against Flowise's 150+ endpoints. Agents cannot manage custom MCP servers, tools, credentials, variables, API keys, or assistants programmatically. The pre-configured `opencode.json` already declares 7 custom-mcp-server tools that don't exist yet — agents attempt to call them and fail silently.

## Scope

### In Scope (phased delivery)

| Phase | Group                   | Tools | Complexity | Rationale                                                     |
| ----- | ----------------------- | ----- | ---------- | ------------------------------------------------------------- |
| P1    | custom-mcp-servers      | 7     | Medium     | Pre-configured in opencode.json — agents already expect these |
| P2    | tools + credentials     | 9     | Simple     | Pure CRUD passthrough, highest reuse value                    |
| P3    | variables + apikey      | 8     | Simple     | Foundational CRUD                                             |
| P4    | mcp-server (token mgmt) | 5     | Medium     | Generate/rotate/disable tokens                                |
| P5    | assistants              | 9     | Complex    | Quota checks, AI-generated instructions, multi-step           |

**Plus**: rename existing `list_credentials` → `list_credential_types` to resolve collision with new API-based `list_credentials` (local registry ≠ Flowise API).

### Out of Scope

-   Streaming prediction (`POST /api/v1/predictions/stream`)
-   Webhook management, document store management
-   Rate limiting, RBAC enforcement (handled server-side)
-   Integration/E2E tests (unit tests only, same as existing tools)

## Capabilities

### New Capabilities

-   `mcp-tool-coverage`: 38 new MCP tools across 5 domains (custom-mcp-servers, tools, credentials, variables, apikey, mcp-server token mgmt, assistants), enabling full Flowise programmatic management via MCP

### Modified Capabilities

-   `credential-lookup`: existing `list_credentials` (local registry) renamed to `list_credential_types`; new API-based `list_credentials`, `create_credential`, `update_credential`, `delete_credential` added as distinct tools

## Approach

Follow existing pattern exactly — no architectural changes:

```
server.tool(name, description, ZodSchema, async (params) => handler(client, params))
```

Each handler: `FlowiseApiClient.request(METHOD, '/endpoint', body)` → `successResponse(data)` or `errorResponse(message)`. All handlers in `handlers.ts`, Zod schemas inline in `index.ts`, tests in `handlers.test.ts` mocking `api.request`.

**Naming conflict**: rename existing `list_credentials` → `list_credential_types` (better describes local-registry behavior). New API tools use standard names: `list_credentials`, `create_credential`, `update_credential`, `delete_credential`. `resolve_credential` remains unchanged.

**Pagination**: list tools accept optional `page`/`limit` params (consistent with existing pattern). **Timeouts**: long-running tools (`authorize_custom_mcp_server`, `generate_assistant_instruction`) document expected latency in descriptions; no AbortController changes.

**Review budget**: each phase produces its own PR (chained) to stay within 400-line budget.

## Affected Areas

| Area                                               | Impact   | Description                                                                     |
| -------------------------------------------------- | -------- | ------------------------------------------------------------------------------- |
| `packages/flowise-mcp-server/src/index.ts`         | Modified | Register new tools + rename `list_credentials`                                  |
| `packages/flowise-mcp-server/src/handlers.ts`      | Modified | Add ~38 handler functions                                                       |
| `packages/flowise-mcp-server/src/handlers.test.ts` | Modified | Add unit tests per handler                                                      |
| `.opencode/opencode.json`                          | Modified | Drop pre-configured custom-mcp-server entries (now provided by flow-validation) |

## Risks

| Risk                                               | Likelihood | Mitigation                                                                           |
| -------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| API key lacks required RBAC permissions            | Medium     | Document required permissions per tool group in server README                        |
| Renaming `list_credentials` breaks existing agents | Low        | Only flow-ing uses it; update its skill + prompt simultaneously                      |
| 400-line budget exceeded in single PR              | High       | Chained PRs — one per phase — each independently reviewable                          |
| Tool name mismatch with opencode.json              | Low        | Names follow existing `snake_case` convention; verify against opencode.json after P1 |

## Rollback Plan

Each phase is independent. Revert any phase by reverting its PR. Old `list_credentials` name can be restored via alias if needed (temporarily register both names).

## Dependencies

-   `FLOWISE_API_KEY` with admin-level permissions (required for all CRUD tools)
-   Existing `FlowiseApiClient` — no changes needed (already covers all HTTP methods)

## Success Criteria

-   [ ] P1: `create_custom_mcp_server` and 6 sibling tools runnable, tests pass, opencode.json entries removed
-   [ ] P2: CRUD for tools + credentials operable via MCP
-   [ ] P3: Variables + API key management operable via MCP
-   [ ] P4: Token generate/rotate/disable operable via MCP
-   [ ] P5: Assistant CRUD + instruction generation operable via MCP
-   [ ] All 57 tools (19 existing + 38 new) have unit tests with mocked client
-   [ ] No existing tool breaks; `list_credentials` rename is backwards-compatible (old name removed, flow-ing updated)
