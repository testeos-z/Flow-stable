---
name: chatmessage
description: 'Skill for the Chatmessage area of Flow-stable. 100 symbols across 15 files.'
---

# Chatmessage

100 symbols | 15 files | Cohesion: 81%

## When to Use

-   Working with code in `packages/`
-   Understanding how stopAudioRecording, cancelAudioRecording, start work
-   Modifying chatmessage-related functionality

## Key Files

| File                                                          | Symbols                                                                                                                     |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/src/views/chatmessage/ChatMessage.jsx`           | clearPreviews, scrollToBottom, cleanupCalledTools, handleError, handlePromptClick (+49)                                     |
| `packages/ui/src/views/chatmessage/AgentExecutedDataCard.jsx` | getIconColor, CustomLabel, getIconFromStatus, AgentExecutedDataCard, getAllNodeIds (+5)                                     |
| `packages/ui/src/views/chatmessage/audio-recording.js`        | handleHidingRecordingControlButtons, stopAudioRecording, cancelAudioRecording, initializeControls, startAudioRecording (+5) |
| `packages/ui/src/views/chatmessage/ChatInputHistory.js`       | addToHistory, getPreviousInput, getNextInput, saveHistory, ChatInputHistory (+2)                                            |
| `packages/ui/src/views/chatmessage/ChatPopUp.jsx`             | enqueueSnackbar, closeSnackbar, resetChatDialog, clearChat                                                                  |
| `packages/ui/src/views/chatmessage/ThinkingCard.jsx`          | ThinkingCard, parseThinkingContent, getHeaderText                                                                           |
| `packages/server/src/index.ts`                                | App, start                                                                                                                  |
| `packages/ui/src/store/context/ReactFlowContext.jsx`          | clearAgentflowNodeStatus, onAgentflowNodeStatusUpdate                                                                       |
| `packages/ui/src/views/chatmessage/ValidationPopUp.jsx`       | enqueueSnackbar, validateFlow                                                                                               |
| `packages/ui/src/api/chatmessagefeedback.js`                  | addFeedback                                                                                                                 |

## Entry Points

Start here when exploring this area:

-   **`stopAudioRecording`** (Function) — `packages/ui/src/views/chatmessage/audio-recording.js:110`
-   **`cancelAudioRecording`** (Function) — `packages/ui/src/views/chatmessage/audio-recording.js:136`
-   **`start`** (Function) — `packages/server/src/index.ts:372`
-   **`startAudioRecording`** (Function) — `packages/ui/src/views/chatmessage/audio-recording.js:42`
-   **`clearAgentflowNodeStatus`** (Function) — `packages/ui/src/store/context/ReactFlowContext.jsx:37`

## Key Symbols

| Symbol                        | Type     | File                                                    | Line |
| ----------------------------- | -------- | ------------------------------------------------------- | ---- |
| `ChatInputHistory`            | Class    | `packages/ui/src/views/chatmessage/ChatInputHistory.js` | 0    |
| `App`                         | Class    | `packages/server/src/index.ts`                          | 60   |
| `stopAudioRecording`          | Function | `packages/ui/src/views/chatmessage/audio-recording.js`  | 110  |
| `cancelAudioRecording`        | Function | `packages/ui/src/views/chatmessage/audio-recording.js`  | 136  |
| `start`                       | Function | `packages/server/src/index.ts`                          | 372  |
| `startAudioRecording`         | Function | `packages/ui/src/views/chatmessage/audio-recording.js`  | 42   |
| `clearAgentflowNodeStatus`    | Function | `packages/ui/src/store/context/ReactFlowContext.jsx`    | 37   |
| `removeDuplicateURL`          | Function | `packages/ui/src/utils/genericHelper.js`                | 827  |
| `onAgentflowNodeStatusUpdate` | Function | `packages/ui/src/store/context/ReactFlowContext.jsx`    | 22   |
| `addToHistory`                | Method   | `packages/ui/src/views/chatmessage/ChatInputHistory.js` | 9    |
| `getPreviousInput`            | Method   | `packages/ui/src/views/chatmessage/ChatInputHistory.js` | 21   |
| `getNextInput`                | Method   | `packages/ui/src/views/chatmessage/ChatInputHistory.js` | 32   |
| `saveHistory`                 | Method   | `packages/ui/src/views/chatmessage/ChatInputHistory.js` | 43   |
| `run`                         | Method   | `packages/server/src/commands/start.ts`                 | 6    |
| `constructor`                 | Method   | `packages/ui/src/views/chatmessage/ChatInputHistory.js` | 1    |
| `loadHistory`                 | Method   | `packages/ui/src/views/chatmessage/ChatInputHistory.js` | 51   |
| `clearPreviews`               | Function | `packages/ui/src/views/chatmessage/ChatMessage.jsx`     | 554  |
| `scrollToBottom`              | Function | `packages/ui/src/views/chatmessage/ChatMessage.jsx`     | 585  |
| `cleanupCalledTools`          | Function | `packages/ui/src/views/chatmessage/ChatMessage.jsx`     | 785  |
| `handleError`                 | Function | `packages/ui/src/views/chatmessage/ChatMessage.jsx`     | 842  |

## Execution Flows

| Flow                                   | Type            | Steps |
| -------------------------------------- | --------------- | ----- |
| `HandleTTSClick → CleanupTTSStreaming` | cross_community | 4     |
| `ChatMessage → RemoveDisplayed`        | cross_community | 3     |
| `ChatMessage → StoreDisplayed`         | cross_community | 3     |
| `ChatMessage → HandleError`            | cross_community | 3     |

## Connected Areas

| Area            | Connections |
| --------------- | ----------- |
| Queue           | 1 calls     |
| Metrics         | 1 calls     |
| Evaluations     | 1 calls     |
| Dialog          | 1 calls     |
| Extended        | 1 calls     |
| Api             | 1 calls     |
| Agentexecutions | 1 calls     |
| Docstore        | 1 calls     |

## How to Explore

1. `gitnexus_context({name: "stopAudioRecording"})` — see callers and callees
2. `gitnexus_query({query: "chatmessage"})` — find related execution flows
3. Read key files listed above for implementation details
