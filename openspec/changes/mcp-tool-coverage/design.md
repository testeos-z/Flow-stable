# Design: MCP Tool Coverage

## Technical Approach

Add 38 MCP tools following the existing `server.tool(name, desc, ZodSchema, handler)` pattern. All tools use `FlowiseApiClient.request()` — no SDK changes. Rename existing `list_credentials` → `list_credential_types`. New tools grouped by domain matching Flowise API route groups, delivered in 5 chained PRs (P1–P5).

## Architecture Decisions

### Decision: File Organization

| Option          | Tradeoff                                                 | Chosen |
| --------------- | -------------------------------------------------------- | ------ |
| A: Flat         | handlers.ts → ~1300 lines, tests → ~1500 lines           |        |
| B: Domain files | 7 handler files + 7 test files, independently reviewable | ✅     |
| C: Mixed        | Domain handlers + flat registration                      |        |

**Choice**: Option B — domain handler files (`handlers/custom-mcp-servers.ts`, etc.) with co-located tests. Tool registration stays flat in `index.ts`.

**Rationale**: 503 → ~1300 lines is unwieldy. Domain files map 1:1 to specs and PR phases. Each phase is reviewable under 400-line budget. `index.ts` stays flat for discoverability.

### Decision: `flow_` Prefix

| Domain           | Prefixed? | Why                                                                  |
| ---------------- | --------- | -------------------------------------------------------------------- |
| tools-management | `flow_`   | Avoids collision with MCP built-in `list_tools`                      |
| All others       | None      | Domain-qualified names unique (`list_assistants`, `create_variable`) |

**Rationale**: MCP servers expose `tools/list` built-in — a tool named `list_tools` would shadow it. Other domain names (assistants, variables, credentials, apikeys) don't collide with MCP primitives.

### Decision: Handler Pattern

**Choice**: Explicit handlers per tool. Add `passthroughHandler(fn, errorPrefix)` wrapper eliminating 6 lines of try/catch boilerplate per handler. Reject CRUD factory.

**Rationale**: Explicit handlers remain grep-able. A factory (`createCrudHandlers(domain)`) hides endpoint paths. The wrapper keeps handlers self-documenting while cutting boilerplate.

### Decision: Testing Strategy

**Choice**: One test file per domain handler file. Mock `api.request` with `vi.fn()`. Minimum 2 cases per handler: happy path + error path.

**Rationale**: Matches existing pattern. Domain test files stay within review budget. Passthrough CRUD tests are mechanically identical — no integration testing needed.

## Data Flow

```
Agent → MCP server (index.ts) → Zod validates params
         → handler (handlers/domain.ts)
              → passthroughHandler wrapper (handler-helpers.ts)
                   → flowiseApi.request(METHOD, '/endpoint', body)
                        → successResponse(data) | errorResponse(message)
```

34 of 38 tools are pure passthrough. Four add local logic:

-   `authorize_custom_mcp_server`: documented as 5–15s (long-running)
-   `generate_assistant_instruction`: documented as 10–30s (LLM-backed)
-   `create_chatflow` / `update_chatflow`: use existing `validateAndFixFlowData` (unchanged)

## File Changes

| File                                 | Action | Description                                                                                                           |
| ------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------- |
| `src/handler-helpers.ts`             | Create | `passthroughHandler()` wrapper, `ToolResponse` type                                                                   |
| `src/handlers/custom-mcp-servers.ts` | Create | 7 handlers (CMS-001–007)                                                                                              |
| `src/handlers/tools.ts`              | Create | 5 handlers (TLM-001–005)                                                                                              |
| `src/handlers/credentials-api.ts`    | Create | 5 handlers (API credential CRUD)                                                                                      |
| `src/handlers/variables.ts`          | Create | 4 handlers (VAR-001–004)                                                                                              |
| `src/handlers/apikeys.ts`            | Create | 4 handlers (APK-001–004)                                                                                              |
| `src/handlers/mcp-server.ts`         | Create | 5 handlers (MSC-001–005)                                                                                              |
| `src/handlers/assistants.ts`         | Create | 9 handlers (AST-001–009)                                                                                              |
| `src/handlers/*.test.ts`             | Create | Co-located tests per domain (7 files)                                                                                 |
| `src/handlers.ts`                    | Modify | Extract `successResponse`, `errorResponse` to handler-helpers.ts; keep prediction handlers + `validateAndFixFlowData` |
| `src/handlers.test.ts`               | Modify | Remove moved tests; keep prediction + helpers tests                                                                   |
| `src/index.ts`                       | Modify | Register 38 tools; rename `list_credentials` → `list_credential_types`; import from domain handler files              |
| `.opencode/opencode.json`            | Modify | Remove pre-configured custom-mcp-server entries; add tools to model assignments                                       |

## Key Contracts

```typescript
// handler-helpers.ts — eliminates 6 lines of boilerplate per handler
export function passthroughHandler<T>(
    fn: (api: FlowiseApiClient, params: T) => Promise<unknown>,
    errorPrefix: string // e.g. "Error listing assistants"
): (api: FlowiseApiClient, params: T) => Promise<ToolResponse>

// Domain handler file pattern (handlers/variables.ts)
export async function handleVariablesList(api: FlowiseApiClient): Promise<ToolResponse> {
    return passthroughHandler((api) => api.request('GET', '/variables'), 'Error listing variables')(api, undefined as any)
}
```

## Backwards Compatibility: `list_credentials` → `list_credential_types`

1. Old tool registration removed from `index.ts`
2. New name registered (same handler, same params)
3. `opencode.json`: references updated
4. `flow-ing` skill prompt updated
5. Rollback: temporarily register both names for transition if needed

## opencode.json Model Assignments

**flow-architect** (read-only): Add `list_*`, `get_*` for all new domains. Remove pre-configured custom-mcp-server entries (lines 27–33) — now provided by flow-validation.

**flow-ing** (full CRUD): Add all 38 tools. Update `list_credentials` → `list_credential_types`.

**Default permissions**: `flow-validation_*` is already allow-all — no change needed.

## Naming Conventions

| Rule                                        | Example                    |
| ------------------------------------------- | -------------------------- |
| Tool names: `snake_case`                    | `create_custom_mcp_server` |
| `flow_` prefix: tools-management only       | `flow_list_tools`          |
| Handler files: kebab-case                   | `custom-mcp-servers.ts`    |
| Handler functions: `handle` + Domain + Verb | `handleAssistantsList`     |
| Endpoint paths: `/api/v1/{route-group}`     | `/api/v1/variables`        |

## Unified Error Handling

All handlers follow this single pattern — never crash the MCP server:

```typescript
try {
    const data = await api.request('METHOD', '/endpoint', body)
    return successResponse(data)
} catch (error) {
    return errorResponse(`Error {verb} {domain}: ${error.message}`)
}
```

API errors (4xx, 5xx) bubble through `flowiseApi.request()` which throws on non-200 status.

## Open Questions

None — all decisions resolved.
