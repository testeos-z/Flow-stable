---
name: extended
description: 'Skill for the Extended area of Flow-stable. 113 symbols across 30 files.'
---

# Extended

113 symbols | 30 files | Cohesion: 77%

## When to Use

-   Working with code in `packages/`
-   Understanding how useNotifier, storeDisplayed, removeDisplayed work
-   Modifying extended-related functionality

## Key Files

| File                                                        | Symbols                                                                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `packages/ui/src/ui-component/extended/TextToSpeech.jsx`    | TextToSpeech, resetTestAudio, setValue, handleProviderChange, loadVoicesForProvider (+6)                     |
| `packages/ui/src/ui-component/extended/OverrideConfig.jsx`  | OverrideConfig, handleAccordionChange, onNodeOverrideToggle, onVariableOverrideToggle, groupByNodeLabel (+5) |
| `packages/ui/src/ui-component/extended/McpServer.jsx`       | McpServer, enqueueSnackbar, closeSnackbar, validateToolName, handleToolNameChange (+4)                       |
| `packages/ui/src/ui-component/extended/FollowUpPrompts.jsx` | FollowUpPrompts, handleChange, handleSelectedProviderChange, setValue, checkDisabled (+3)                    |
| `packages/ui/src/ui-component/extended/RateLimit.jsx`       | RateLimit, checkDisabled, onTextChanged, textField, enqueueSnackbar (+3)                                     |
| `packages/ui/src/ui-component/extended/StarterPrompts.jsx`  | StarterPrompts, removeInputFields, handleChange, enqueueSnackbar, closeSnackbar (+1)                         |
| `packages/ui/src/ui-component/extended/AnalyseFlow.jsx`     | AnalyseFlow, setValue, handleAccordionChange, enqueueSnackbar, closeSnackbar (+1)                            |
| `packages/ui/src/ui-component/extended/AllowedDomains.jsx`  | AllowedDomains, removeInputFields, handleChange, enqueueSnackbar, closeSnackbar (+1)                         |
| `packages/ui/src/ui-component/extended/PostProcessing.jsx`  | PostProcessing, onExpandDialogClicked, enqueueSnackbar, closeSnackbar, onSave                                |
| `packages/ui/src/ui-component/extended/Leads.jsx`           | Leads, handleChange, enqueueSnackbar, closeSnackbar, onSave                                                  |

## Key Symbols

| Symbol                  | Type     | File                                                       | Line |
| ----------------------- | -------- | ---------------------------------------------------------- | ---- |
| `useNotifier`           | Function | `packages/ui/src/utils/useNotifier.js`                     | 7    |
| `storeDisplayed`        | Function | `packages/ui/src/utils/useNotifier.js`                     | 14   |
| `removeDisplayed`       | Function | `packages/ui/src/utils/useNotifier.js`                     | 18   |
| `OrganizationSetupPage` | Function | `packages/ui/src/views/organization/index.jsx`             | 49   |
| `signInWithSSO`         | Function | `packages/ui/src/views/organization/index.jsx`             | 201  |
| `ValidationPopUp`       | Function | `packages/ui/src/views/chatmessage/ValidationPopUp.jsx`    | 26   |
| `getNodeIcon`           | Function | `packages/ui/src/views/chatmessage/ValidationPopUp.jsx`    | 94   |
| `SignInPage`            | Function | `packages/ui/src/views/auth/signIn.jsx`                    | 39   |
| `signInWithSSO`         | Function | `packages/ui/src/views/auth/signIn.jsx`                    | 163  |
| `ResetPasswordPage`     | Function | `packages/ui/src/views/auth/resetPassword.jsx`             | 29   |
| `RegisterPage`          | Function | `packages/ui/src/views/auth/register.jsx`                  | 64   |
| `signInWithSSO`         | Function | `packages/ui/src/views/auth/register.jsx`                  | 178  |
| `ForgotPasswordPage`    | Function | `packages/ui/src/views/auth/forgotPassword.jsx`            | 28   |
| `StarterPrompts`        | Function | `packages/ui/src/ui-component/extended/StarterPrompts.jsx` | 18   |
| `removeInputFields`     | Function | `packages/ui/src/ui-component/extended/StarterPrompts.jsx` | 42   |
| `handleChange`          | Function | `packages/ui/src/ui-component/extended/StarterPrompts.jsx` | 48   |
| `PostProcessing`        | Function | `packages/ui/src/ui-component/extended/PostProcessing.jsx` | 46   |
| `onExpandDialogClicked` | Function | `packages/ui/src/ui-component/extended/PostProcessing.jsx` | 66   |
| `Leads`                 | Function | `packages/ui/src/ui-component/extended/Leads.jsx`          | 25   |
| `handleChange`          | Function | `packages/ui/src/ui-component/extended/Leads.jsx`          | 36   |

## Execution Flows

| Flow                                     | Type            | Steps |
| ---------------------------------------- | --------------- | ----- |
| `NodeInputHandler → RemoveDisplayed`     | cross_community | 3     |
| `NodeInputHandler → StoreDisplayed`      | cross_community | 3     |
| `ChatMessage → RemoveDisplayed`          | cross_community | 3     |
| `ChatMessage → StoreDisplayed`           | cross_community | 3     |
| `ViewMessagesDialog → RemoveDisplayed`   | cross_community | 3     |
| `ViewMessagesDialog → StoreDisplayed`    | cross_community | 3     |
| `AssistantDialog → RemoveDisplayed`      | cross_community | 3     |
| `AssistantDialog → StoreDisplayed`       | cross_community | 3     |
| `VectorStoreConfigure → RemoveDisplayed` | cross_community | 3     |
| `VectorStoreConfigure → StoreDisplayed`  | cross_community | 3     |

## Connected Areas

| Area        | Connections |
| ----------- | ----------- |
| Docstore    | 6 calls     |
| Validation  | 2 calls     |
| Evaluations | 2 calls     |
| Atoms       | 1 calls     |
| Api         | 1 calls     |

## How to Explore

1. `gitnexus_context({name: "useNotifier"})` — see callers and callees
2. `gitnexus_query({query: "extended"})` — find related execution flows
3. Read key files listed above for implementation details
