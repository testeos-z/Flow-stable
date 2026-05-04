## Exploration: MCP Tool Coverage Gap

### Current State

The `packages/flowise-mcp-server` exposes **19 MCP tools** against Flowise's ~60 route groups / 150+ endpoints. The server communicates with Flowise via two clients: `FlowiseClient` (SDK, for predictions) and `FlowiseApiClient` (HTTP fetch wrapper, for CRUD). The API client prefixes all requests with `/api/v1` and authenticates via Bearer token from `FLOWISE_API_KEY`.

**Architecture pattern** (in `src/index.ts`):

```
server.tool(name, description, ZodSchema, async (params) => handler(client, params))
```

Each tool has: (1) Zod schema for input validation, (2) async handler function that catches errors and returns `ToolResponse { content: [{ type: 'text', text: JSON }], isError? }`. Handlers live in `handlers.ts` using two helpers: `successResponse(data)` and `errorResponse(message)`.

**Existing 19 tools** break down into 4 categories:

-   **Predictions** (4): create_prediction, create_prediction_with_history, create_prediction_with_files, create_prediction_with_lead — use Flowise SDK
-   **Chatflow CRUD** (5): list/get/create/update/delete — use FlowiseApiClient
-   **Node inspection** (3): list_nodes, get_nodes_by_category, get_node — use FlowiseApiClient
-   **Validation/testing** (5): diagnose_chatflow, repair_chatflow (DB direct), test_chatflow, validate_chatflow, validate_agentflow — use local logic + DB + API
-   **Credentials** (2): list_credentials, resolve_credential — use local hardcoded registry (NOT the Flowise API)

**Test framework**: Vitest 3.x, strict TDD. Tests are co-located `*.test.ts`. Pattern: mock the API/SDK client with `vi.fn()`, call handler, assert `ToolResponse` shape. No integration/E2E tests exist in this package.

### Affected Areas

All new tools follow the same file structure:

-   `packages/flowise-mcp-server/src/index.ts` — register tool with Zod schema + handler binding
-   `packages/flowise-mcp-server/src/handlers.ts` — handler function per tool
-   `packages/flowise-mcp-server/src/handlers.test.ts` — unit tests per handler
-   `packages/flowise-mcp-server/src/flowise-api.ts` — HTTP client (no changes needed; covers all CRUD via `request(method, endpoint, body)`)

For tools requiring additional logic (authorization flows, quota checks, token rotation), new modules may be warranted:

-   `src/mcp-servers.ts` / `src/credentials-api.ts` (if validation/complexity warrants separation)

Additionally:

-   `packages/server/src/routes/*/index.ts` — the Express routes define URL paths, RBAC guards, and controller bindings (read-only reference, no modification)
-   `packages/server/src/controllers/*/index.ts` — define request body shape and service calls (read-only reference)
-   `.opencode/opencode.json` — already lists custom MCP server tools in `flow-architect`'s tool permissions (line 27-33), indicating they were PLANNED but not yet implemented

### Approaches

Only one viable approach: **add new `server.tool()` registrations following the exact existing pattern**. There is no alternative architecture — this is a straightforward expansion.

However, implementation _order_ matters. Two sub-approaches:

1. **All at once** — add all 38 tools in a single batch

    - Pros: Maximum coverage, one change
    - Cons: Large PR (will trigger 400-line review budget guard), harder to review, harder to test exhaustively
    - Effort: High (38 tools × handler + tests)

2. **Phased by priority group** — add one group at a time, from highest impact to lowest
    - Pros: Reviewable slices, incremental value delivery, lower risk of breaking the existing MCP server
    - Cons: Multiple PRs/cycles
    - Effort: Same total, spread across phases

**Recommendation**: Approach 2 (phased). The groups are independent and can be delivered in separate PRs.

### Priority Grouping Recommendation

| #   | Group               | Tools | Complexity  | Rationale                                                                                                    |
| --- | ------------------- | ----- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| P1  | custom-mcp-servers  | 7     | Medium      | Listed in opencode.json — agents already expect these tools. `authorize` is multi-step (connect + discover). |
| P2  | tools + credentials | 10    | Simple      | Pure CRUD passthrough. Highest reuse value — agents need these daily.                                        |
| P3  | variables + apikey  | 8     | Simple      | Pure CRUD passthrough. Lower urgency but foundational.                                                       |
| P4  | mcp-server          | 5     | Medium      | Token management (generate, rotate, disable). Needs careful error handling.                                  |
| P5  | assistants          | 9     | Medium-High | Most complex: quota checks, AI-generated instructions, component lists. 8 distinct endpoints.                |

**Total new tools across all priority groups: 38** (7 + 5+5 + 4+4 + 5 + 8) plus one rename needed for existing `list_credentials` (currently uses local registry vs. Flowise API — these serve different purposes; keep both with distinct names like `list_credential_types` vs `list_credentials`).

### Estimated Complexity per Group

**Simple (CRUD passthrough)** — 6 groups, 28 tools:

-   tools (5), credentials (4, excluding existing local-registry tools), variables (4), apikey (4)
-   **Pattern**: `handleXxx(api, params) → api.request(METHOD, '/endpoint', body)` wrapped in try/catch with successResponse/errorResponse
-   **Tests**: mock api.request, verify called with correct method/endpoint/body, verify error handling
-   **Estimate**: ~20 lines per handler, ~30 lines per test case

**Medium (needs validation/stateful)** — 2 groups, 12 tools:

-   custom-mcp-servers (7): `authorize` requires two-step flow (connect to MCP server → discover tools); others are simple CRUD but with explicit allowlist for body fields
-   mcp-server (5): token generation, rotation, disable flow — stateless but needs careful error handling for not-found, already-enabled, already-disabled states
-   **Pattern**: Same CRUD base + additional validation logic
-   **Estimate**: ~35-50 lines per handler, ~50 lines per test case

**Complex (multi-step workflows)** — 1 group, 9 tools:

-   assistants (9): quota usage check (`checkUsageLimit`), AI-generated instruction (calls LLM internally), component lists, and the assistant creation has org/subscription checks
-   **Pattern**: May need to POST to `/generate/instruction` which itself triggers an AI call — potential timeouts with 30s MCP timeout
-   **Risks**: Long-running operations (`generate_assistant_instruction`), quota errors need clear error messages
-   **Estimate**: ~60-100 lines per handler, ~80 lines per test case

### Design Considerations

#### 1. RBAC / Workspace Context (CRITICAL)

All Flowise API endpoints require:

-   **RBAC permissions** checked via Express middleware (e.g., `checkPermission('tools:create')`)
-   **Workspace context** from `req.user.activeWorkspaceId` and `req.user.activeOrganizationId`

The MCP server authenticates via a single `FLOWISE_API_KEY`. This means the API key MUST have all required permissions for the tools being exposed. For example, to call `POST /api/v1/tools`, the key needs `tools:create`. This is a **documentation and configuration concern**, not a code concern — but tools should clearly document which permissions the API key needs.

Additionally, `workspaceId` is inferred server-side from the API key's owner. If the key belongs to a user in multiple workspaces, the active workspace context is used. The MCP server cannot explicitly select a workspace — this is transparently handled by the Flowise API.

#### 2. Credential Security

The `credentials` endpoints expose sensitive data (API keys, tokens). The Flowise API already masks credential values in GET responses (returns `*****` for secret fields), so the MCP server inherits this. However, `create_credential` and `update_credential` tools MUST warn users that credential values are stored as plaintext input — agents should never log or persist credential parameters.

#### 3. Tool Naming Collision

-   Existing `list_credentials` tool uses a LOCAL hardcoded registry (reads from `credentials.ts`). The new API-based credentials tool needs a distinct name. Recommendation: rename existing to `list_credential_types` (or `list_registered_credentials`) and create new `list_credentials` calling `GET /api/v1/credentials`. Or: prefix with `api_`: `api_list_credentials`, `api_create_credential`, etc.
-   Similarly, existing `list_nodes`, `get_nodes_by_category`, `get_node` are already taken — the new tools for custom-mcp-servers and tools CRUD are in different domains and won't collide.

#### 4. opencode.json Pre-configuration

`opencode.json` already has tool entries for custom-mcp-servers (lines 27-33) with `flow-control_` prefix. The tool names registered in `index.ts` become the MCP tool names. The naming convention must match: `server.tool('create_custom_mcp_server', ...)` → `flow-control_create_custom_mcp_server` in opencode.json. This MUST be consistent — any mismatch means the tool won't be discoverable by agents.

#### 5. Timeouts for Long-Running Tools

-   `authorize_custom_mcp_server`: connects to an external MCP server and discovers tools — could take 5-15 seconds
-   `generate_assistant_instruction`: calls an LLM internally — could take 10-30 seconds
-   Default MCP timeout is typically 30 seconds. Consider documenting expected latency.
-   Consider adding a `timeout` parameter to relevant tools (or using `AbortController` like `testing.ts` does).

#### 6. Pagination

Several list endpoints support pagination (`/api/v1/tools?page=1&limit=50`). The existing handlers hardcode page/limit. New list tools should either:

-   Accept optional `page`/`limit` params (consistent UX)
-   Default to reasonable values (e.g., page 1, limit 50)

The `getPageAndLimitParams` utility in the server extracts page/limit from query params. The MCP tools can pass these as optional Zod parameters.

#### 7. Testing Scope

All 19 existing tools have unit tests with mocked clients. New tools follow the same pattern. However, note:

-   No integration tests exist in the MCP server (tests never hit a real Flowise instance)
-   The `test_chatflow` tool IS an integration test, but the MCP server's own test suite is purely unit-level
-   For tools like `authorize_custom_mcp_server` that have multi-step workflows, unit tests should mock the API at each step

### Risks

1. **API key permissions mismatch** — if the configured API key lacks required permissions, all new CRUD tools will fail with 403. Documentation must clearly state required permissions per tool group.
2. **Workspace isolation** — all operations are scoped to the API key owner's active workspace. Cross-workspace operations are not supported via MCP.
3. **Tool name divergence from opencode.json** — if names don't match what opencode.json expects (e.g., `create_custom_mcp_server` vs `create_custom_mcp_server`), agents won't see the tool even though it's registered.
4. **Breaking existing credential tools** — if we rename `list_credentials` and `resolve_credential`, any agents relying on those names will break. Need a deprecation period or keep both.
5. **Large PR risk** — even phased, the full set is 38 tools with tests. Each PR must stay within the 400-line review budget. See chained PR recommendation below.

### Ready for Proposal

**Yes.** The exploration confirms:

-   Architecture is clear and extensible (add tool registrations, no refactoring needed)
-   All priority endpoints are HTTP-friendly CRUD (no WebSocket, no streaming — pure REST)
-   Existing flowise-api.ts client already supports all HTTP methods needed (GET, POST, PUT, DELETE)
-   Test patterns are well-established and straightforward to replicate
-   The main design decision is implementation PHASING, not architecture

**Recommendation to orchestrator**: create the proposal with phased delivery (P1→P5 as separate PRs), explicitly noting the 400-line review budget constraint and the need for chained PRs.
