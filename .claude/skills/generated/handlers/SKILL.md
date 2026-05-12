---
name: handlers
description: 'Skill for the Handlers area of Flow-stable. 72 symbols across 14 files.'
---

# Handlers

72 symbols | 14 files | Cohesion: 94%

## When to Use

-   Working with code in `packages/`
-   Understanding how runSmokeTest, runIntegrationTest, flowHasTools work
-   Modifying handlers-related functionality

## Key Files

| File                                                             | Symbols                                                                                                                                               |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/flowise-mcp-server/src/handlers.ts`                    | handleCreatePrediction, handleCreatePredictionWithHistory, handleCreatePredictionWithFiles, handleCreatePredictionWithLead, handleListChatflows (+13) |
| `packages/flowise-mcp-server/src/handlers/assistants.ts`         | handleListAssistants, handleGetAssistant, handleCreateAssistant, handleUpdateAssistant, handleDeleteAssistant (+3)                                    |
| `packages/flowise-mcp-server/src/handlers/custom-mcp-servers.ts` | handleCustomMcpList, handleCustomMcpGet, handleCustomMcpCreate, handleCustomMcpUpdate, handleCustomMcpDelete (+2)                                     |
| `packages/flowise-mcp-server/src/testing.ts`                     | runPrediction, runSmokeTest, runIntegrationTest, flowHasTools, testChatflow                                                                           |
| `packages/flowise-mcp-server/src/handlers/tools-management.ts`   | handleFlowListTools, handleFlowGetTool, handleFlowCreateTool, handleFlowUpdateTool, handleFlowDeleteTool                                              |
| `packages/flowise-mcp-server/src/handlers/mcp-server-config.ts`  | handleGetMcpServerConfig, handleEnableMcpServer, handleUpdateMcpServerConfig, handleDisableMcpServer, handleRefreshMcpToken                           |
| `packages/flowise-mcp-server/src/handlers/credentials-api.ts`    | handleListCredentials, handleGetCredential, handleCreateCredential, handleUpdateCredential, handleDeleteCredential                                    |
| `packages/flowise-mcp-server/src/handlers/handler-helpers.ts`    | successResponse, errorResponse, wrapHandler, passthroughHandler                                                                                       |
| `packages/flowise-mcp-server/src/handlers/variables.ts`          | handleListVariables, handleCreateVariable, handleUpdateVariable, handleDeleteVariable                                                                 |
| `packages/flowise-mcp-server/src/handlers/apikey-management.ts`  | handleListApiKeys, handleCreateApiKey, handleUpdateApiKey, handleDeleteApiKey                                                                         |

## Entry Points

Start here when exploring this area:

-   **`runSmokeTest`** (Function) — `packages/flowise-mcp-server/src/testing.ts:81`
-   **`runIntegrationTest`** (Function) — `packages/flowise-mcp-server/src/testing.ts:114`
-   **`flowHasTools`** (Function) — `packages/flowise-mcp-server/src/testing.ts:158`
-   **`testChatflow`** (Function) — `packages/flowise-mcp-server/src/testing.ts:169`
-   **`handleCreatePrediction`** (Function) — `packages/flowise-mcp-server/src/handlers.ts:146`

## Key Symbols

| Symbol                              | Type     | File                                          | Line |
| ----------------------------------- | -------- | --------------------------------------------- | ---- |
| `runSmokeTest`                      | Function | `packages/flowise-mcp-server/src/testing.ts`  | 81   |
| `runIntegrationTest`                | Function | `packages/flowise-mcp-server/src/testing.ts`  | 114  |
| `flowHasTools`                      | Function | `packages/flowise-mcp-server/src/testing.ts`  | 158  |
| `testChatflow`                      | Function | `packages/flowise-mcp-server/src/testing.ts`  | 169  |
| `handleCreatePrediction`            | Function | `packages/flowise-mcp-server/src/handlers.ts` | 146  |
| `handleCreatePredictionWithHistory` | Function | `packages/flowise-mcp-server/src/handlers.ts` | 170  |
| `handleCreatePredictionWithFiles`   | Function | `packages/flowise-mcp-server/src/handlers.ts` | 195  |
| `handleCreatePredictionWithLead`    | Function | `packages/flowise-mcp-server/src/handlers.ts` | 220  |
| `handleListChatflows`               | Function | `packages/flowise-mcp-server/src/handlers.ts` | 245  |
| `handleGetChatflow`                 | Function | `packages/flowise-mcp-server/src/handlers.ts` | 258  |
| `handleCreateChatflow`              | Function | `packages/flowise-mcp-server/src/handlers.ts` | 271  |
| `handleDeleteChatflow`              | Function | `packages/flowise-mcp-server/src/handlers.ts` | 358  |
| `handleListNodes`                   | Function | `packages/flowise-mcp-server/src/handlers.ts` | 371  |
| `handleGetNodesByCategory`          | Function | `packages/flowise-mcp-server/src/handlers.ts` | 384  |
| `handleGetNode`                     | Function | `packages/flowise-mcp-server/src/handlers.ts` | 397  |
| `handleDiagnoseChatflow`            | Function | `packages/flowise-mcp-server/src/handlers.ts` | 411  |
| `handleRepairChatflow`              | Function | `packages/flowise-mcp-server/src/handlers.ts` | 425  |
| `handleTestChatflow`                | Function | `packages/flowise-mcp-server/src/handlers.ts` | 438  |
| `handleValidateChatflow`            | Function | `packages/flowise-mcp-server/src/handlers.ts` | 452  |
| `handleValidateAgentflow`           | Function | `packages/flowise-mcp-server/src/handlers.ts` | 505  |

## Connected Areas

| Area       | Connections |
| ---------- | ----------- |
| Cluster_71 | 3 calls     |
| Cluster_64 | 2 calls     |
| Atoms      | 1 calls     |
| Json       | 1 calls     |

## How to Explore

1. `gitnexus_context({name: "runSmokeTest"})` — see callers and callees
2. `gitnexus_query({query: "handlers"})` — find related execution flows
3. Read key files listed above for implementation details
