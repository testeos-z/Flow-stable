---
name: documentstore
description: 'Skill for the Documentstore area of Flow-stable. 360 symbols across 104 files.'
---

# Documentstore

360 symbols | 104 files | Cohesion: 75%

## When to Use

-   Working with code in `packages/`
-   Understanding how convertTextToSpeechStream, getFileFromStorage, removeSpecificFileFromStorage work
-   Modifying documentstore-related functionality

## Key Files

| File                                                                   | Symbols                                                                                                                                    |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/server/src/services/documentstore/index.ts`                  | createDocumentStore, deleteLoaderFromDocumentStore, getDocumentStoreById, getUsedChatflowNames, getDocumentStoreFileChunks (+37)           |
| `packages/server/src/controllers/documentstore/index.ts`               | createDocumentStore, getDocumentStoreById, getDocumentStoreFileChunks, deleteDocumentStoreFileChunk, editDocumentStoreFileChunk (+15)      |
| `packages/server/src/services/chatflows/index.ts`                      | validateChatflowType, checkIfChatflowIsValidForUploads, deleteChatflow, getAllChatflowsCountByOrganization, getAllChatflowsCount (+8)      |
| `packages/server/src/services/assistants/index.ts`                     | createAssistant, deleteAssistant, getAssistantsCountByOrganization, getAllAssistantsCount, getAssistantById (+6)                           |
| `packages/server/src/services/mcp-server/index.ts`                     | validateWithZod, generateToken, parseMcpConfig, getMcpServerConfig, createMcpServerConfig (+4)                                             |
| `packages/server/src/controllers/chatflows/index.ts`                   | checkIfChatflowIsValidForStreaming, checkIfChatflowIsValidForUploads, deleteChatflow, getChatflowByApiKey, getChatflowById (+4)            |
| `packages/server/src/Interface.DocumentStore.ts`                       | IDocumentStore, toEntity, DocumentStoreDTO, fromEntity, fromEntities (+3)                                                                  |
| `packages/server/src/controllers/evaluations/index.ts`                 | createEvaluation, runAgain, getEvaluation, deleteEvaluation, getAllEvaluations (+3)                                                        |
| `packages/server/src/controllers/custom-mcp-servers/index.ts`          | assertValidAuthType, createCustomMcpServer, getAllCustomMcpServers, getCustomMcpServerById, updateCustomMcpServer (+3)                     |
| `packages/server/src/services/openai-assistants-vector-store/index.ts` | getAssistantVectorStore, listAssistantVectorStore, createAssistantVectorStore, updateAssistantVectorStore, deleteAssistantVectorStore (+2) |

## Entry Points

Start here when exploring this area:

-   **`convertTextToSpeechStream`** (Function) — `packages/components/src/textToSpeech.ts:12`
-   **`getFileFromStorage`** (Function) — `packages/components/src/storageUtils.ts:36`
-   **`removeSpecificFileFromStorage`** (Function) — `packages/components/src/storageUtils.ts:76`
-   **`removeFolderFromStorage`** (Function) — `packages/components/src/storageUtils.ts:81`
-   **`validateFlowAPIKey`** (Function) — `packages/server/src/utils/validateKey.ts:11`

## Key Symbols

| Symbol                          | Type     | File                                                       | Line |
| ------------------------------- | -------- | ---------------------------------------------------------- | ---- |
| `InternalFlowiseError`          | Class    | `packages/server/src/errors/internalFlowiseError/index.ts` | 0    |
| `Variable`                      | Class    | `packages/server/src/database/entities/Variable.ts`        | 5    |
| `Lead`                          | Class    | `packages/server/src/database/entities/Lead.ts`            | 5    |
| `DocumentStore`                 | Class    | `packages/server/src/database/entities/DocumentStore.ts`   | 4    |
| `CustomTemplate`                | Class    | `packages/server/src/database/entities/CustomTemplate.ts`  | 4    |
| `ChatFlow`                      | Class    | `packages/server/src/database/entities/ChatFlow.ts`        | 12   |
| `Assistant`                     | Class    | `packages/server/src/database/entities/Assistant.ts`       | 5    |
| `UpsertHistory`                 | Class    | `packages/server/src/database/entities/UpsertHistory.ts`   | 5    |
| `DocumentStoreDTO`              | Class    | `packages/server/src/Interface.DocumentStore.ts`           | 227  |
| `convertTextToSpeechStream`     | Function | `packages/components/src/textToSpeech.ts`                  | 12   |
| `getFileFromStorage`            | Function | `packages/components/src/storageUtils.ts`                  | 36   |
| `removeSpecificFileFromStorage` | Function | `packages/components/src/storageUtils.ts`                  | 76   |
| `removeFolderFromStorage`       | Function | `packages/components/src/storageUtils.ts`                  | 81   |
| `validateFlowAPIKey`            | Function | `packages/server/src/utils/validateKey.ts`                 | 11   |
| `validateAPIKey`                | Function | `packages/server/src/utils/validateKey.ts`                 | 44   |
| `getPageAndLimitParams`         | Function | `packages/server/src/utils/pagination.ts`                  | 9    |
| `getEndingNodes`                | Function | `packages/server/src/utils/index.ts`                       | 294  |
| `parsePrompt`                   | Function | `packages/server/src/utils/hub.ts`                         | 0    |
| `utilGetUploadsConfig`          | Function | `packages/server/src/utils/getUploadsConfig.ts`            | 19   |
| `buildAgentGraph`               | Function | `packages/server/src/utils/buildAgentGraph.ts`             | 35   |

## Execution Flows

| Flow                                | Type            | Steps |
| ----------------------------------- | --------------- | ----- |
| `TestConfig → InternalFlowiseError` | cross_community | 6     |
| `Create → InternalFlowiseError`     | cross_community | 6     |
| `Register → InternalFlowiseError`   | cross_community | 6     |
| `GenerateTextToSpeech → Sleep`      | cross_community | 6     |
| `Create → InternalFlowiseError`     | cross_community | 6     |
| `Update → InternalFlowiseError`     | cross_community | 6     |
| `Delete → InternalFlowiseError`     | cross_community | 6     |
| `Create → InternalFlowiseError`     | cross_community | 6     |
| `Update → InternalFlowiseError`     | cross_community | 6     |
| `Invite → InternalFlowiseError`     | cross_community | 6     |

## Connected Areas

| Area            | Connections |
| --------------- | ----------- |
| Json            | 7 calls     |
| Storage         | 6 calls     |
| Metrics         | 4 calls     |
| Dataset         | 4 calls     |
| Get-upload-file | 2 calls     |
| Atoms           | 2 calls     |
| Services        | 2 calls     |
| Cluster_105     | 1 calls     |

## How to Explore

1. `gitnexus_context({name: "convertTextToSpeechStream"})` — see callers and callees
2. `gitnexus_query({query: "documentstore"})` — find related execution flows
3. Read key files listed above for implementation details
