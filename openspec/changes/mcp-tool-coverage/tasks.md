# Tasks: MCP Tool Coverage

## Review Workload Forecast

| Field                   | Value                                                   |
| ----------------------- | ------------------------------------------------------- |
| Estimated changed lines | ~1,800 (P1: ~1,073, P2: ~725)                           |
| 400-line budget risk    | **High** — both P1 and P2 individually exceed 400 lines |
| Chained PRs recommended | **Yes**                                                 |
| Suggested split         | P1a→P1b→P2a→P2b (4 PRs in feature-branch chain)         |
| Delivery strategy       | auto-chain                                              |
| Chain strategy          | feature-branch-chain                                    |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit  | Goal                                                  | Lines | PR   | Notes                            |
| ----- | ----------------------------------------------------- | ----- | ---- | -------------------------------- |
| P1a   | Shared helper + credential delta + mcp-server + tools | ~535  | PR 1 | Foundation for all other domains |
| P1b   | Custom MCP servers + opencode.json + skill updates    | ~538  | PR 2 | Depends on P1a                   |
| P2a   | Variables + apikey management (8 tools)               | ~350  | PR 3 | Depends on P1b                   |
| P2b   | Assistants (9 tools)                                  | ~375  | PR 4 | Depends on P2a                   |
| P3-P5 | Future phases (placeholder)                           | TBD   | —    | Deferred                         |

## Phase P1: Foundation + Credential Delta + MCP Config + Tools + Custom MCP Servers

### P1a — Infrastructure + Credentials + MCP Server Config + Tools

-   [x] **P1-01** `handler-helpers` — Create `packages/flowise-mcp-server/src/handlers/handler-helpers.ts` with `ToolResponse`, `successResponse`, `errorResponse`, `FlowiseSdkClient`, `passthroughHandler()`, `wrapHandler()`. Move `ToolResponse`, `successResponse`, `errorResponse`, `FlowiseSdkClient` from `handlers.ts`. Re-export from `handlers.ts` for backwards compatibility. (~75 lines, 0 deps)
-   [x] **P1-02** `handlers` refactor — Rename `handleListCredentials`→`handleListCredentialTypes` in `handlers.ts`. Rename tool registration `list_credentials`→`list_credential_types` in `index.ts`. Update imports. Keep existing `successResponse`/`errorResponse` tests in `handlers.test.ts` (still pass via re-exports). (~10 lines changed)
-   [x] **P1-03** `mcp-server-config` handlers — Create `packages/flowise-mcp-server/src/handlers/mcp-server-config.ts` with 5 handlers: `handleGetMcpServerConfig`, `handleEnableMcpServer`, `handleUpdateMcpServerConfig`, `handleDisableMcpServer`, `handleRefreshMcpToken` (MSC-001–005). Create `handlers/mcp-server-config.test.ts` with 10 tests (2 per handler). Deps: P1-01. (~70 src + ~125 test)
-   [x] **P1-04** `tools-management` handlers — Create `packages/flowise-mcp-server/src/handlers/tools-management.ts` with 5 handlers: `handleFlowListTools`, `handleFlowGetTool`, `handleFlowCreateTool`, `handleFlowUpdateTool`, `handleFlowDeleteTool` (TLM-001–005). All `flow_` prefixed. Create `handlers/tools-management.test.ts` with 12 tests. Deps: P1-01. (~85 src + ~150 test)
-   [x] **P1-05** `credentials-api` handlers — Create `packages/flowise-mcp-server/src/handlers/credentials-api.ts` with 5 handlers: `handleListCredentials`, `handleGetCredential`, `handleCreateCredential`, `handleUpdateCredential`, `handleDeleteCredential`. These are the NEW API-based credential tools, distinct from `list_credential_types` (local registry). Create `handlers/credentials-api.test.ts` with 12 tests. Deps: P1-01. (~90 src + ~150 test)
-   [x] **P1-06** `index.ts` P1a registration — Register 15 tools in `packages/flowise-mcp-server/src/index.ts`: 5 mcp-server + 5 tools (`flow_` prefixed) + 5 credential API. Import from domain handler files. Rename `list_credentials`→`list_credential_types` (keep same handler, same params). Create `handlers/handler-helpers.test.ts` with 9 tests. Deps: P1-02, P1-03, P1-04, P1-05. (~175 lines)

### P1b — Custom MCP Servers + Wiring

-   [x] **P1-07** `custom-mcp-servers` handlers — Create `packages/flowise-mcp-server/src/handlers/custom-mcp-servers.ts` with 7 handlers: `handleCustomMcpList`, `handleCustomMcpGet`, `handleCustomMcpCreate`, `handleCustomMcpUpdate`, `handleCustomMcpDelete`, `handleCustomMcpGetTools`, `handleCustomMcpAuthorize` (CMS-001–007). Create `handlers/custom-mcp-servers.test.ts` with 2 cases per handler. Deps: P1-01. (~110 src + ~120 test)
-   [x] **P1-08** `index.ts` P1b registration — Register 7 custom-mcp-server tools in `index.ts`. Import from `handlers/custom-mcp-servers.ts`. Deps: P1-06, P1-07. (~55 lines)
-   [x] **P1-09** `opencode.json` P1 updates — For flow-architect: add `list_*`, `get_*` for all P1 domains; remove pre-configured custom-mcp entries (lines 27–33). For flow-ing: add all 22 P1 tools; rename `list_credentials`→`list_credential_types`. Deps: P1-08. (~65 lines)
-   [x] **P1-10** `flow-ing` skill — Update `.agents/skills/flow-ing/SKILL.md`: replace `list_credentials`→`list_credential_types` in Available Tools section (line 93) and prompt string (line 60). Add new credential tools. Deps: P1-08. (~10 lines)
-   [x] **P1-11** Verify — Run `pnpm test` in `packages/flowise-mcp-server`. All 38 new + existing tests pass. Smoke: start server, call `list_custom_mcp_servers`. Deps: P1-09, P1-10.

## Phase P2: Variables + Assistants + API Key Management

### P2a — Variables + API Keys

-   [x] **P2-01** `variables` handlers — Create `packages/flowise-mcp-server/src/handlers/variables.ts` with 4 handlers: `handleVariablesList`, `handleVariablesCreate`, `handleVariablesUpdate`, `handleVariablesDelete` (VAR-001–004). Create `handlers/variables.test.ts` with 2 cases per handler. Deps: P1-01. (~60 src + ~80 test)
-   [x] **P2-02** `apikeys` handlers — Create `packages/flowise-mcp-server/src/handlers/apikeys.ts` with 4 handlers: `handleApiKeysList`, `handleApiKeysCreate`, `handleApiKeysUpdate`, `handleApiKeysDelete` (APK-001–004). Create `handlers/apikeys.test.ts` with 2 cases per handler. Deps: P1-01. (~60 src + ~80 test)
-   [x] **P2-03** `index.ts` P2a registration — Register 8 tools (4 variables + 4 apikeys) in `index.ts`. Deps: P2-01, P2-02. (~60 lines)

### P2b — Assistants

-   [x] **P2-04** `assistants` handlers — Create `packages/flowise-mcp-server/src/handlers/assistants.ts` with 9 handlers: `handleListAssistants`, `handleGetAssistant`, `handleCreateAssistant`, `handleUpdateAssistant`, `handleDeleteAssistant`, `handleGetAssistantChatModels`, `handleGetAssistantDocStores`, `handleGetAssistantTools`, `handleGenerateAssistantInstruction` (AST-001–009). Create `handlers/assistants.test.ts` with 22 tests (2+ cases per handler). Deps: P1-01. (~80 src + ~340 test)
-   [x] **P2-05** `index.ts` P2b registration — Register 9 assistant tools in `index.ts`. Deps: P2-03, P2-04. (~100 lines)
-   [ ] **P2-06** `opencode.json` P2 updates — Add all 17 P2 tools to flow-ing and read-only tools to flow-architect. Deps: P2-05. (~30 lines)
-   [x] **P2-07** Verify — `pnpm test`: 167/167 passing. `tsc --noEmit`: zero errors. Deps: P2-05.

## Phase P3-P5: Future Phases (Placeholder)

| Phase | Domains                               | Tools | Est. Lines | Status   |
| ----- | ------------------------------------- | ----- | ---------- | -------- |
| P3    | Upsert vector stores, document stores | 6     | ~400       | Deferred |
| P4    | Components credentials, feedback      | 5     | ~350       | Deferred |
| P5    | Webhook management, leads             | 4     | ~300       | Deferred |

**Total future**: ~15 tools, ~1,050 lines across 2-3 additional PRs.

Note: P3-P5 domain specs and design are not yet written. These are placeholder estimates.

## Cross-Cutting Tasks

-   [x] **X-01** `handlers.test.ts` cleanup — Remove successResponse/errorResponse unit tests (moved to handler-helpers). Adjust imports. Done in P1-02. → Kept existing tests (they pass via re-exports), added handler-helpers.test.ts with additional tests.
-   [x] **X-02** Verify no `list_credentials` references remain — grep verified. `list_credentials` now correctly used as NEW API-based tool name only. `list_credential_types` is the renamed local registry tool.
-   [x] **X-03** Build check — `tsc --noEmit` passes with no errors after P1a.
