---
name: json
description: 'Skill for the Json area of Flow-stable. 93 symbols across 43 files.'
---

# Json

93 symbols | 43 files | Cohesion: 53%

## When to Use

-   Working with code in `packages/`
-   Understanding how updateOutdatedNodeData, generateExportFlowData, showHideInputs work
-   Modifying json-related functionality

## Key Files

| File                                                        | Symbols                                                                                                                      |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `packages/components/src/utils.ts`                          | extractTextFromChunk, \_transform, serializeChatHistory, extractOutputFromArray, resolveFlowObjValue (+2)                    |
| `packages/server/src/utils/index.ts`                        | getParamValues, isParameterEnabled, findAvailableConfigs, getAllValuesFromJson, extractValues (+2)                           |
| `packages/components/nodes/documentloaders/Json/Json.ts`    | constructor, parse, extractContent, extractMetadata, formatObjectAsKeyValue (+2)                                             |
| `packages/ui/src/utils/genericHelper.js`                    | updateOutdatedNodeData, \_removeCredentialId, generateExportFlowData, \_showHideOperation, showHideInputs                    |
| `packages/components/nodes/agentflow/utils.ts`              | revertBase64ImagesToFileRefs, normalizeMessagesForStorage, replaceInlineDataWithFileReferences, extractArtifactsFromResponse |
| `packages/ui/src/ui-component/json/JsonEditor.jsx`          | JsonEditorInput, handleClosePopOver, setNewVal, onClipboardCopy                                                              |
| `packages/ui/src/ui-component/json/JsonViewer.jsx`          | JsonToken, getTokenStyle, parseJsonToElements, JSONViewer                                                                    |
| `packages/components/nodes/sequentialagents/commonUtils.ts` | transformObjectPropertyToFunction, customGet, checkMessageHistory                                                            |
| `packages/ui/src/views/chatmessage/ChatMessage.jsx`         | isFileAllowedForUpload, handleDrop, handleFileChange                                                                         |
| `packages/ui/src/ui-component/extended/OverrideConfig.jsx`  | OverrideConfigTable, handleChange, renderCellContent                                                                         |

## Entry Points

Start here when exploring this area:

-   **`updateOutdatedNodeData`** (Function) — `packages/ui/src/utils/genericHelper.js:228`
-   **`generateExportFlowData`** (Function) — `packages/ui/src/utils/genericHelper.js:574`
-   **`showHideInputs`** (Function) — `packages/ui/src/utils/genericHelper.js:1279`
-   **`filterAllowedUploadMimeTypes`** (Function) — `packages/components/src/validator.ts:173`
-   **`serializeChatHistory`** (Function) — `packages/components/src/utils.ts:862`

## Key Symbols

| Symbol                                     | Type     | File                                                         | Line |
| ------------------------------------------ | -------- | ------------------------------------------------------------ | ---- |
| `updateOutdatedNodeData`                   | Function | `packages/ui/src/utils/genericHelper.js`                     | 228  |
| `generateExportFlowData`                   | Function | `packages/ui/src/utils/genericHelper.js`                     | 574  |
| `showHideInputs`                           | Function | `packages/ui/src/utils/genericHelper.js`                     | 1279 |
| `filterAllowedUploadMimeTypes`             | Function | `packages/components/src/validator.ts`                       | 173  |
| `serializeChatHistory`                     | Function | `packages/components/src/utils.ts`                           | 862  |
| `extractOutputFromArray`                   | Function | `packages/components/src/utils.ts`                           | 1326 |
| `resolveFlowObjValue`                      | Function | `packages/components/src/utils.ts`                           | 1342 |
| `normalizeKeysRecursively`                 | Function | `packages/components/src/utils.ts`                           | 1436 |
| `createZodSchemaFromJSON`                  | Function | `packages/components/src/utils.ts`                           | 2180 |
| `extractText`                              | Function | `packages/components/evaluation/EvaluationRunTracerLlama.ts` | 171  |
| `sanitizeFlowDataForPublicEndpoint`        | Function | `packages/server/src/utils/sanitizeFlowData.ts`              | 10   |
| `getParamValues`                           | Function | `packages/server/src/utils/index.ts`                         | 1037 |
| `isParameterEnabled`                       | Function | `packages/server/src/utils/index.ts`                         | 1097 |
| `findAvailableConfigs`                     | Function | `packages/server/src/utils/index.ts`                         | 1332 |
| `getAllValuesFromJson`                     | Function | `packages/server/src/utils/index.ts`                         | 1894 |
| `extractValues`                            | Function | `packages/server/src/utils/index.ts`                         | 1897 |
| `_removeCredentialId`                      | Function | `packages/server/src/utils/index.ts`                         | 2070 |
| `validateHistorySchema`                    | Function | `packages/server/src/utils/index.ts`                         | 2090 |
| `sanitizeAllowedUploadMimeTypesFromConfig` | Function | `packages/server/src/utils/fileValidation.ts`                | 36   |
| `sanitizeMiddleware`                       | Function | `packages/server/src/utils/XSS.ts`                           | 4    |

## Execution Flows

| Flow                           | Type            | Steps |
| ------------------------------ | --------------- | ----- |
| `AgentflowCanvas → IsArray`    | cross_community | 7     |
| `Run → IsArray`                | cross_community | 6     |
| `Run → IsArray`                | cross_community | 6     |
| `Run → IsArray`                | cross_community | 6     |
| `Run → IsArray`                | cross_community | 6     |
| `Run → IsArray`                | cross_community | 4     |
| `Run → IsArray`                | cross_community | 4     |
| `ViewMessagesDialog → IsArray` | cross_community | 3     |
| `AgentFlowNode → IsArray`      | cross_community | 3     |

## Connected Areas

| Area          | Connections |
| ------------- | ----------- |
| Documentstore | 4 calls     |

## How to Explore

1. `gitnexus_context({name: "updateOutdatedNodeData"})` — see callers and callees
2. `gitnexus_query({query: "json"})` — find related execution flows
3. Read key files listed above for implementation details
