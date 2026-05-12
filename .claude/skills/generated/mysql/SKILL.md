---
name: mysql
description: 'Skill for the Mysql area of Flow-stable. 463 symbols across 232 files.'
---

# Mysql

463 symbols | 232 files | Cohesion: 98%

## When to Use

-   Working with code in `packages/`
-   Understanding how encrypt, decrypt, fixOpenSourceAssistantTable work
-   Modifying mysql-related functionality

## Key Files

| File                                                                                                      | Symbols                                                                     |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `packages/server/src/enterprise/database/migrations/sqlite/1737076223692-RefactorEnterpriseDatabase.ts`   | modifyTable, deleteWorkspaceWithoutUser, populateTable, deleteTempTable, up |
| `packages/server/src/enterprise/database/migrations/postgres/1737076223692-RefactorEnterpriseDatabase.ts` | modifyTable, deleteWorkspaceWithoutUser, populateTable, deleteTempTable, up |
| `packages/server/src/enterprise/database/migrations/mysql/1737076223692-RefactorEnterpriseDatabase.ts`    | modifyTable, deleteWorkspaceWithoutUser, populateTable, deleteTempTable, up |
| `packages/server/src/enterprise/database/migrations/mariadb/1737076223692-RefactorEnterpriseDatabase.ts`  | modifyTable, deleteWorkspaceWithoutUser, populateTable, deleteTempTable, up |
| `packages/components/nodes/vectorstores/Pinecone/Pinecone_LlamaIndex.ts`                                  | query, textFromResultRow, metaWithoutText                                   |
| `packages/server/src/database/migrations/sqlite/1743758056188-FixOpenSourceAssistantTable.ts`             | fixOpenSourceAssistantTable, up, down                                       |
| `packages/server/src/enterprise/database/migrations/sqlite/1729130948686-LinkWorkspaceId.ts`              | linkWorkspaceId, up, down                                                   |
| `packages/server/src/enterprise/utils/encryption.util.ts`                                                 | encrypt, decrypt                                                            |
| `packages/server/src/database/migrations/sqlite/1767000000000-AddMcpServerConfigToChatFlow.ts`            | up, down                                                                    |
| `packages/server/src/database/migrations/sqlite/1766000000000-AddCustomMcpServer.ts`                      | up, down                                                                    |

## Entry Points

Start here when exploring this area:

-   **`encrypt`** (Function) — `packages/server/src/enterprise/utils/encryption.util.ts:40`
-   **`decrypt`** (Function) — `packages/server/src/enterprise/utils/encryption.util.ts:45`
-   **`fixOpenSourceAssistantTable`** (Function) — `packages/server/src/database/migrations/sqlite/1743758056188-FixOpenSourceAssistantTable.ts:3`
-   **`ensureColumnExists`** (Function) — `packages/server/src/enterprise/database/migrations/sqlite/sqlliteCustomFunctions.ts:2`
-   **`linkWorkspaceId`** (Function) — `packages/server/src/enterprise/database/migrations/sqlite/1729130948686-LinkWorkspaceId.ts:2`

## Key Symbols

| Symbol                        | Type     | File                                                                                            | Line |
| ----------------------------- | -------- | ----------------------------------------------------------------------------------------------- | ---- |
| `encrypt`                     | Function | `packages/server/src/enterprise/utils/encryption.util.ts`                                       | 40   |
| `decrypt`                     | Function | `packages/server/src/enterprise/utils/encryption.util.ts`                                       | 45   |
| `fixOpenSourceAssistantTable` | Function | `packages/server/src/database/migrations/sqlite/1743758056188-FixOpenSourceAssistantTable.ts`   | 3    |
| `ensureColumnExists`          | Function | `packages/server/src/enterprise/database/migrations/sqlite/sqlliteCustomFunctions.ts`           | 2    |
| `linkWorkspaceId`             | Function | `packages/server/src/enterprise/database/migrations/sqlite/1729130948686-LinkWorkspaceId.ts`    | 2    |
| `ensureColumnExists`          | Function | `packages/server/src/enterprise/database/migrations/mysql/mysqlCustomFunctions.ts`              | 2    |
| `ensureColumnExists`          | Function | `packages/server/src/enterprise/database/migrations/mariadb/mariaDbCustomFunctions.ts`          | 2    |
| `getSafeConfig`               | Method   | `packages/server/src/enterprise/controllers/login-method.controller.ts`                         | 31   |
| `up`                          | Method   | `packages/server/src/database/migrations/sqlite/1767000000000-AddMcpServerConfigToChatFlow.ts`  | 3    |
| `down`                        | Method   | `packages/server/src/database/migrations/sqlite/1767000000000-AddMcpServerConfigToChatFlow.ts`  | 7    |
| `up`                          | Method   | `packages/server/src/database/migrations/sqlite/1766000000000-AddCustomMcpServer.ts`            | 3    |
| `down`                        | Method   | `packages/server/src/database/migrations/sqlite/1766000000000-AddCustomMcpServer.ts`            | 12   |
| `up`                          | Method   | `packages/server/src/database/migrations/sqlite/1764759496768-AddReasonContentToChatMessage.ts` | 3    |
| `down`                        | Method   | `packages/server/src/database/migrations/sqlite/1764759496768-AddReasonContentToChatMessage.ts` | 7    |
| `up`                          | Method   | `packages/server/src/database/migrations/sqlite/1759424923093-AddChatFlowNameIndex.ts`          | 5    |
| `down`                        | Method   | `packages/server/src/database/migrations/sqlite/1759424923093-AddChatFlowNameIndex.ts`          | 9    |
| `up`                          | Method   | `packages/server/src/database/migrations/sqlite/1759419136055-AddTextToSpeechToChatFlow.ts`     | 3    |
| `down`                        | Method   | `packages/server/src/database/migrations/sqlite/1759419136055-AddTextToSpeechToChatFlow.ts`     | 11   |
| `up`                          | Method   | `packages/server/src/database/migrations/sqlite/1755066758601-ModifyChatflowType.ts`            | 4    |
| `up`                          | Method   | `packages/server/src/database/migrations/sqlite/1754986486669-AddTextToSpeechToChatFlow.ts`     | 3    |

## Execution Flows

| Flow                      | Type            | Steps |
| ------------------------- | --------------- | ----- |
| `TestConfig → Decrypt`    | cross_community | 4     |
| `Run → GetDb`             | cross_community | 4     |
| `Run → GetDb`             | cross_community | 4     |
| `Run → TextFromResultRow` | cross_community | 3     |
| `Run → MetaWithoutText`   | cross_community | 3     |
| `Run → TextFromResultRow` | cross_community | 3     |
| `Run → MetaWithoutText`   | cross_community | 3     |

## Connected Areas

| Area     | Connections |
| -------- | ----------- |
| Pinecone | 1 calls     |

## How to Explore

1. `gitnexus_context({name: "encrypt"})` — see callers and callees
2. `gitnexus_query({query: "mysql"})` — find related execution flows
3. Read key files listed above for implementation details
