---
name: credentials
description: 'Skill for the Credentials area of Flow-stable. 136 symbols across 119 files.'
---

# Credentials

136 symbols | 119 files | Cohesion: 97%

## When to Use

-   Working with code in `packages/`
-   Understanding how INodeCredential work
-   Modifying credentials-related functionality

## Key Files

| File                                                            | Symbols                                                                                        |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `packages/ui/src/views/credentials/index.jsx`                   | Credentials, enqueueSnackbar, closeSnackbar, edit, share (+4)                                  |
| `packages/ui/src/views/credentials/AddEditCredentialDialog.jsx` | AddEditCredentialDialog, enqueueSnackbar, closeSnackbar, addNewCredential, saveCredential (+2) |
| `packages/ui/src/views/credentials/CredentialInputHandler.jsx`  | CredentialInputHandler, onExpandDialogClicked, onExpandDialogSave                              |
| `packages/ui/src/views/credentials/CredentialListDialog.jsx`    | CredentialListDialog, filterSearch                                                             |
| `packages/components/src/Interface.ts`                          | INodeCredential                                                                                |
| `packages/components/credentials/ZepMemoryApi.credential.ts`    | ZepMemoryApi                                                                                   |
| `packages/components/credentials/XaiApi.credential.ts`          | XaiApi                                                                                         |
| `packages/components/credentials/WolframAlphaApp.credential.ts` | WolframAlphaApp                                                                                |
| `packages/components/credentials/WeaviateApi.credential.ts`     | WeaviateApi                                                                                    |
| `packages/components/credentials/VoyageAIApi.credential.ts`     | VoyageAIApi                                                                                    |

## Entry Points

Start here when exploring this area:

-   **`INodeCredential`** (Interface) — `packages/components/src/Interface.ts:172`

## Key Symbols

| Symbol                              | Type      | File                                                                   | Line |
| ----------------------------------- | --------- | ---------------------------------------------------------------------- | ---- |
| `INodeCredential`                   | Interface | `packages/components/src/Interface.ts`                                 | 172  |
| `ZepMemoryApi`                      | Class     | `packages/components/credentials/ZepMemoryApi.credential.ts`           | 2    |
| `XaiApi`                            | Class     | `packages/components/credentials/XaiApi.credential.ts`                 | 2    |
| `WolframAlphaApp`                   | Class     | `packages/components/credentials/WolframAlphaApp.credential.ts`        | 2    |
| `WeaviateApi`                       | Class     | `packages/components/credentials/WeaviateApi.credential.ts`            | 2    |
| `VoyageAIApi`                       | Class     | `packages/components/credentials/VoyageAIApi.credential.ts`            | 2    |
| `VectaraAPI`                        | Class     | `packages/components/credentials/VectaraApi.credential.ts`             | 2    |
| `UpstashVectorApi`                  | Class     | `packages/components/credentials/UpstashVectorApi.credential.ts`       | 2    |
| `UpstashRedisMemoryApi`             | Class     | `packages/components/credentials/UpstashRedisMemoryApi.credential.ts`  | 2    |
| `UpstashRedisApi`                   | Class     | `packages/components/credentials/UpstashRedisApi.credential.ts`        | 2    |
| `UnstructuredApi`                   | Class     | `packages/components/credentials/UnstructuredApi.credential.ts`        | 2    |
| `TogetherAIApi`                     | Class     | `packages/components/credentials/TogetherAIApi.credential.ts`          | 2    |
| `TeradataVectorStoreApiCredentials` | Class     | `packages/components/credentials/TeradataVectorStoreApi.credential.ts` | 2    |
| `TeradataTD2Credential`             | Class     | `packages/components/credentials/TeradataTD2.credential.ts`            | 2    |
| `TeradataBearerTokenCredential`     | Class     | `packages/components/credentials/TeradataBearerToken.credential.ts`    | 2    |
| `TavilyApi`                         | Class     | `packages/components/credentials/TavilyApi.credential.ts`              | 2    |
| `SupabaseApi`                       | Class     | `packages/components/credentials/SupabaseApi.credential.ts`            | 2    |
| `StripeApi`                         | Class     | `packages/components/credentials/StripeApi.credential.ts`              | 2    |
| `SpiderApiCredential`               | Class     | `packages/components/credentials/SpiderApi.credential.ts`              | 2    |
| `SlackApi`                          | Class     | `packages/components/credentials/SlackApi.credential.ts`               | 2    |

## Connected Areas

| Area          | Connections |
| ------------- | ----------- |
| Docstore      | 3 calls     |
| Extended      | 2 calls     |
| Evaluations   | 2 calls     |
| Custom        | 2 calls     |
| MongoDBMemory | 2 calls     |

## How to Explore

1. `gitnexus_context({name: "INodeCredential"})` — see callers and callees
2. `gitnexus_query({query: "credentials"})` — find related execution flows
3. Read key files listed above for implementation details
