---
name: dialog
description: 'Skill for the Dialog area of Flow-stable. 92 symbols across 21 files.'
---

# Dialog

92 symbols | 21 files | Cohesion: 81%

## When to Use

-   Working with code in `packages/`
-   Understanding how ViewMessagesDialog, onDeleteMessages, getChatType work
-   Modifying dialog-related functionality

## Key Files

| File                                                               | Symbols                                                                                                        |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `packages/ui/src/ui-component/dialog/ViewMessagesDialog.jsx`       | ViewMessagesDialog, onDeleteMessages, getChatType, getChatMessages, getChatPK (+22)                            |
| `packages/ui/src/ui-component/dialog/InviteUsersDialog.jsx`        | InviteUsersDialog, fetchInitialData, getWorkspaceValue, getRoleValue, checkDisabled (+6)                       |
| `packages/ui/src/ui-component/dialog/PromptLangsmithHubDialog.jsx` | PromptLangsmithHubDialog, handleAccordionChange, handleListItemClick, removeDuplicates, handleModelChange (+2) |
| `packages/ui/src/ui-component/dialog/NvidiaNIMDialog.jsx`          | preload, handlePullImage, handleStartContainer, startNewContainer, handleNext (+2)                             |
| `packages/ui/src/ui-component/dialog/ManageScrapedLinksDialog.jsx` | enqueueSnackbar, closeSnackbar, handleFetchLinks, ManageScrapedLinksDialog, handleChangeLink (+2)              |
| `packages/ui/src/ui-component/dialog/AgentflowGeneratorDialog.jsx` | AgentflowGeneratorDialog, enqueueSnackbar, closeSnackbar, isMissingRequiredValue, displayWarning (+1)          |
| `packages/ui/src/ui-component/dialog/ExportAsTemplateDialog.jsx`   | ExportAsTemplateDialog, enqueueSnackbar, closeSnackbar, handleUsecaseDelete, onConfirm                         |
| `packages/ui/src/ui-component/dialog/PromptGeneratorDialog.jsx`    | AssistantPromptGenerator, enqueueSnackbar, closeSnackbar, onGenerate                                           |
| `packages/ui/src/ui-component/dialog/TagDialog.jsx`                | handleSubmit, TagDialog, handleDeleteTag                                                                       |
| `packages/ui/src/ui-component/dialog/ShareWithWorkspaceDialog.jsx` | enqueueSnackbar, closeSnackbar, shareItemRequest                                                               |

## Key Symbols

| Symbol                        | Type     | File                                                         | Line |
| ----------------------------- | -------- | ------------------------------------------------------------ | ---- |
| `ViewMessagesDialog`          | Function | `packages/ui/src/ui-component/dialog/ViewMessagesDialog.jsx` | 177  |
| `onDeleteMessages`            | Function | `packages/ui/src/ui-component/dialog/ViewMessagesDialog.jsx` | 275  |
| `getChatType`                 | Function | `packages/ui/src/ui-component/dialog/ViewMessagesDialog.jsx` | 344  |
| `getChatMessages`             | Function | `packages/ui/src/ui-component/dialog/ViewMessagesDialog.jsx` | 476  |
| `getChatPK`                   | Function | `packages/ui/src/ui-component/dialog/ViewMessagesDialog.jsx` | 533  |
| `transformChatPKToParams`     | Function | `packages/ui/src/ui-component/dialog/ViewMessagesDialog.jsx` | 540  |
| `processChatLogs`             | Function | `packages/ui/src/ui-component/dialog/ViewMessagesDialog.jsx` | 553  |
| `handleItemClick`             | Function | `packages/ui/src/ui-component/dialog/ViewMessagesDialog.jsx` | 605  |
| `onURLClick`                  | Function | `packages/ui/src/ui-component/dialog/ViewMessagesDialog.jsx` | 617  |
| `downloadFile`                | Function | `packages/ui/src/ui-component/dialog/ViewMessagesDialog.jsx` | 621  |
| `onSourceDialogClick`         | Function | `packages/ui/src/ui-component/dialog/ViewMessagesDialog.jsx` | 641  |
| `handleClose`                 | Function | `packages/ui/src/ui-component/dialog/ViewMessagesDialog.jsx` | 650  |
| `renderFileUploads`           | Function | `packages/ui/src/ui-component/dialog/ViewMessagesDialog.jsx` | 654  |
| `agentReasoningArtifacts`     | Function | `packages/ui/src/ui-component/dialog/ViewMessagesDialog.jsx` | 792  |
| `renderArtifacts`             | Function | `packages/ui/src/ui-component/dialog/ViewMessagesDialog.jsx` | 806  |
| `getAllUsersByOrganizationId` | Function | `packages/ui/src/api/user.js`                                | 7    |
| `getAllUsersByWorkspaceId`    | Function | `packages/ui/src/api/user.js`                                | 29   |
| `InviteUsersDialog`           | Function | `packages/ui/src/ui-component/dialog/InviteUsersDialog.jsx`  | 92   |
| `fetchInitialData`            | Function | `packages/ui/src/ui-component/dialog/InviteUsersDialog.jsx`  | 247  |
| `getWorkspaceValue`           | Function | `packages/ui/src/ui-component/dialog/InviteUsersDialog.jsx`  | 594  |

## Execution Flows

| Flow                                   | Type            | Steps |
| -------------------------------------- | --------------- | ----- |
| `ViewMessagesDialog → RemoveDisplayed` | cross_community | 3     |
| `ViewMessagesDialog → StoreDisplayed`  | cross_community | 3     |
| `ViewMessagesDialog → IsArray`         | cross_community | 3     |
| `ViewMessagesDialog → GetChatPK`       | intra_community | 3     |

## Connected Areas

| Area        | Connections |
| ----------- | ----------- |
| Docstore    | 8 calls     |
| Extended    | 6 calls     |
| Json        | 5 calls     |
| Custom      | 3 calls     |
| Evaluations | 2 calls     |
| Tools       | 1 calls     |
| ApiChain    | 1 calls     |

## How to Explore

1. `gitnexus_context({name: "ViewMessagesDialog"})` — see callers and callees
2. `gitnexus_query({query: "dialog"})` — find related execution flows
3. Read key files listed above for implementation details
