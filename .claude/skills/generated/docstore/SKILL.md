---
name: docstore
description: 'Skill for the Docstore area of Flow-stable. 170 symbols across 54 files.'
---

# Docstore

170 symbols | 54 files | Cohesion: 68%

## When to Use

-   Working with code in `packages/`
-   Understanding how request, refreshFlows, handleError work
-   Modifying docstore-related functionality

## Key Files

| File                                                                   | Symbols                                                                                                            |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `packages/ui/src/views/docstore/VectorStoreConfigure.jsx`              | onSelectHistoryDetails, VectorStoreConfigure, enqueueSnackbar, closeSnackbar, onEmbeddingsSelected (+13)           |
| `packages/ui/src/views/docstore/DocumentStoreDetail.jsx`               | onDocLoaderSelected, DocumentStoreDetails, openPreviewSettings, showStoredChunks, showVectorStoreQuery (+10)       |
| `packages/ui/src/views/docstore/index.jsx`                             | getDocStoreActionButtonSx, Documents, goToDocumentStore, onConfirm, handleActionMenuOpen (+9)                      |
| `packages/ui/src/views/docstore/VectorStoreQuery.jsx`                  | handleEnter, doQuery, VectorStoreQuery, chunkSelected, fetchVectorStoreDetails (+3)                                |
| `packages/ui/src/api/documentstore.js`                                 | deleteChunkFromStore, editChunkFromStore, deleteDocumentStore, deleteLoaderFromStore, previewChunks (+2)           |
| `packages/ui/src/views/docstore/ShowStoredChunks.jsx`                  | ShowStoredChunks, enqueueSnackbar, closeSnackbar, chunkSelected, onChunkEdit (+2)                                  |
| `packages/ui/src/views/docstore/LoaderConfigPreviewChunks.jsx`         | LoaderConfigPreviewChunks, onSplitterChange, onChunkClick, enqueueSnackbar, closeSnackbar (+2)                     |
| `packages/ui/src/views/docstore/DocStoreInputHandler.jsx`              | DocStoreInputHandler, handleDataChange, onExpandDialogClicked, onManageLinksDialogClicked, onExpandDialogSave (+1) |
| `packages/ui/src/views/assistants/openai/OpenAIAssistantLayout.jsx`    | OpenAIAssistantLayout, onAssistantSelected, addNew, edit, onConfirm                                                |
| `packages/ui/src/layout/MainLayout/Header/WorkspaceSwitcher/index.jsx` | WorkspaceSwitcher, handleClick, switchWorkspace, handleLogout, sortWorkspaces                                      |

## Entry Points

Start here when exploring this area:

-   **`request`** (Function) — `packages/ui/src/hooks/useApi.jsx:9`
-   **`refreshFlows`** (Function) — `packages/ui/src/ui-component/button/FlowListMenu.jsx:104`
-   **`handleError`** (Function) — `packages/ui/src/store/context/ErrorContext.jsx:15`
-   **`hasAssignedWorkspace`** (Function) — `packages/ui/src/hooks/useAuth.jsx:22`
-   **`setErrorMessage`** (Method) — `packages/components/nodes/moderation/OpenAIModeration/OpenAIModerationRunner.ts:30`

## Key Symbols

| Symbol                               | Type     | File                                                                              | Line |
| ------------------------------------ | -------- | --------------------------------------------------------------------------------- | ---- |
| `request`                            | Function | `packages/ui/src/hooks/useApi.jsx`                                                | 9    |
| `refreshFlows`                       | Function | `packages/ui/src/ui-component/button/FlowListMenu.jsx`                            | 104  |
| `handleError`                        | Function | `packages/ui/src/store/context/ErrorContext.jsx`                                  | 15   |
| `hasAssignedWorkspace`               | Function | `packages/ui/src/hooks/useAuth.jsx`                                               | 22   |
| `setErrorMessage`                    | Method   | `packages/components/nodes/moderation/OpenAIModeration/OpenAIModerationRunner.ts` | 30   |
| `getWorkspacesByUserId`              | Function | `packages/ui/src/api/user.js`                                                     | 32   |
| `UpsertHistoryDialog`                | Function | `packages/ui/src/views/vectorstore/UpsertHistoryDialog.jsx`                       | 187  |
| `onStartDateSelected`                | Function | `packages/ui/src/views/vectorstore/UpsertHistoryDialog.jsx`                       | 212  |
| `onEndDateSelected`                  | Function | `packages/ui/src/views/vectorstore/UpsertHistoryDialog.jsx`                       | 222  |
| `ViewPermissionsDrawer`              | Function | `packages/ui/src/views/roles/index.jsx`                                           | 72   |
| `handleTabChange`                    | Function | `packages/ui/src/views/marketplaces/index.jsx`                                    | 142  |
| `onSelected`                         | Function | `packages/ui/src/views/evaluators/SamplePromptDialog.jsx`                         | 43   |
| `onConfirm`                          | Function | `packages/ui/src/views/evaluations/index.jsx`                                     | 233  |
| `EvaluationResultVersionsSideDrawer` | Function | `packages/ui/src/views/evaluations/EvaluationResultVersionsSideDrawer.jsx`        | 20   |
| `navigateToEvaluationResult`         | Function | `packages/ui/src/views/evaluations/EvaluationResultVersionsSideDrawer.jsx`        | 38   |
| `handleEnter`                        | Function | `packages/ui/src/views/docstore/VectorStoreQuery.jsx`                             | 107  |
| `doQuery`                            | Function | `packages/ui/src/views/docstore/VectorStoreQuery.jsx`                             | 122  |
| `onSelectHistoryDetails`             | Function | `packages/ui/src/views/docstore/VectorStoreConfigure.jsx`                         | 187  |
| `UpsertHistorySideDrawer`            | Function | `packages/ui/src/views/docstore/UpsertHistorySideDrawer.jsx`                      | 20   |
| `onDocLoaderSelected`                | Function | `packages/ui/src/views/docstore/DocumentStoreDetail.jsx`                          | 171  |

## Execution Flows

| Flow                                     | Type            | Steps |
| ---------------------------------------- | --------------- | ----- |
| `ExecutionDetails → HandleError`         | cross_community | 4     |
| `EvalDatasetRows → HandleError`          | cross_community | 4     |
| `ChatMessage → HandleError`              | cross_community | 3     |
| `APICodeDialog → HandleError`            | cross_community | 3     |
| `VectorStoreConfigure → RemoveDisplayed` | cross_community | 3     |
| `VectorStoreConfigure → StoreDisplayed`  | cross_community | 3     |
| `VectorStoreConfigure → HandleError`     | cross_community | 3     |
| `DocumentStoreDetails → RemoveDisplayed` | cross_community | 3     |
| `DocumentStoreDetails → StoreDisplayed`  | cross_community | 3     |
| `DocumentStoreDetails → HandleError`     | cross_community | 3     |

## Connected Areas

| Area        | Connections |
| ----------- | ----------- |
| Extended    | 8 calls     |
| Json        | 5 calls     |
| Evaluations | 4 calls     |
| Custom      | 3 calls     |
| Button      | 2 calls     |
| Api         | 1 calls     |
| Workspace   | 1 calls     |
| Canvas      | 1 calls     |

## How to Explore

1. `gitnexus_context({name: "request"})` — see callers and callees
2. `gitnexus_query({query: "docstore"})` — find related execution flows
3. Read key files listed above for implementation details
