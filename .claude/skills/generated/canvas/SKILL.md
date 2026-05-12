---
name: canvas
description: 'Skill for the Canvas area of Flow-stable. 93 symbols across 20 files.'
---

# Canvas

93 symbols | 20 files | Cohesion: 80%

## When to Use

-   Working with code in `packages/`
-   Understanding how deleteNode, collectDescendants, duplicateNode work
-   Modifying canvas-related functionality

## Key Files

| File                                                      | Symbols                                                                                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/src/views/canvas/NodeInputHandler.jsx`       | NodeInputHandler, onInputHintDialogClicked, onExpandDialogClicked, onConditionDialogClicked, onShowPromptHubButtonClicked (+20) |
| `packages/ui/src/views/canvas/AddNodes.jsx`               | scrollTop, handleTabChange, addException, fuzzyScore, scoreAndSortNodes (+10)                                                   |
| `packages/ui/src/views/canvas/index.jsx`                  | Canvas, onConnect, handleLoadFlow, syncNodes, setDirty (+9)                                                                     |
| `packages/ui/src/store/context/ReactFlowContext.jsx`      | deleteNode, collectDescendants, duplicateNode, deleteEdge, deleteConnectedInput (+1)                                            |
| `packages/ui/src/views/canvas/CanvasNode.jsx`             | CanvasNode, getNodeInfoOpenStatus, nodeOutdatedMessage, nodeVersionEmptyMessage, getBorderColor                                 |
| `packages/ui/src/views/canvas/NodeOutputHandler.jsx`      | NodeOutputHandler, getAvailableOptions, getAnchorOptions, getAnchorPosition                                                     |
| `packages/ui/src/views/canvas/StickyNote.jsx`             | StickyNote, getBorderColor, getBackgroundColor                                                                                  |
| `packages/ui/src/views/agentflowsv2/StickyNote.jsx`       | StickyNote, getStateColor, getBackgroundColor                                                                                   |
| `packages/ui/src/views/canvas/CredentialInputHandler.jsx` | CredentialInputHandler, editCredential, addAsyncOption                                                                          |
| `packages/ui/src/views/canvas/CanvasHeader.jsx`           | enqueueSnackbar, closeSnackbar, onSettingsItemClick                                                                             |

## Entry Points

Start here when exploring this area:

-   **`deleteNode`** (Function) — `packages/ui/src/store/context/ReactFlowContext.jsx:92`
-   **`collectDescendants`** (Function) — `packages/ui/src/store/context/ReactFlowContext.jsx:99`
-   **`duplicateNode`** (Function) — `packages/ui/src/store/context/ReactFlowContext.jsx:177`
-   **`deleteEdge`** (Function) — `packages/ui/src/store/context/ReactFlowContext.jsx:131`
-   **`deleteConnectedInput`** (Function) — `packages/ui/src/store/context/ReactFlowContext.jsx:137`

## Key Symbols

| Symbol                         | Type     | File                                                 | Line |
| ------------------------------ | -------- | ---------------------------------------------------- | ---- |
| `deleteNode`                   | Function | `packages/ui/src/store/context/ReactFlowContext.jsx` | 92   |
| `collectDescendants`           | Function | `packages/ui/src/store/context/ReactFlowContext.jsx` | 99   |
| `duplicateNode`                | Function | `packages/ui/src/store/context/ReactFlowContext.jsx` | 177  |
| `deleteEdge`                   | Function | `packages/ui/src/store/context/ReactFlowContext.jsx` | 131  |
| `deleteConnectedInput`         | Function | `packages/ui/src/store/context/ReactFlowContext.jsx` | 137  |
| `onCustomDataChange`           | Function | `packages/ui/src/views/agentflowsv2/ConfigInput.jsx` | 39   |
| `onNodeDataChange`             | Function | `packages/ui/src/store/context/ReactFlowContext.jsx` | 50   |
| `NodeInputHandler`             | Function | `packages/ui/src/views/canvas/NodeInputHandler.jsx`  | 111  |
| `onInputHintDialogClicked`     | Function | `packages/ui/src/views/canvas/NodeInputHandler.jsx`  | 176  |
| `onExpandDialogClicked`        | Function | `packages/ui/src/views/canvas/NodeInputHandler.jsx`  | 184  |
| `onConditionDialogClicked`     | Function | `packages/ui/src/views/canvas/NodeInputHandler.jsx`  | 205  |
| `onShowPromptHubButtonClicked` | Function | `packages/ui/src/views/canvas/NodeInputHandler.jsx`  | 218  |
| `onManageLinksDialogClicked`   | Function | `packages/ui/src/views/canvas/NodeInputHandler.jsx`  | 231  |
| `getJSONValue`                 | Function | `packages/ui/src/views/canvas/NodeInputHandler.jsx`  | 250  |
| `getDataGridColDef`            | Function | `packages/ui/src/views/canvas/NodeInputHandler.jsx`  | 261  |
| `getDropdownOptions`           | Function | `packages/ui/src/views/canvas/NodeInputHandler.jsx`  | 406  |
| `getTabValue`                  | Function | `packages/ui/src/views/canvas/NodeInputHandler.jsx`  | 426  |
| `onEditJSONClicked`            | Function | `packages/ui/src/views/canvas/NodeInputHandler.jsx`  | 432  |
| `onExpandDialogSave`           | Function | `packages/ui/src/views/canvas/NodeInputHandler.jsx`  | 455  |
| `onExpandRichDialogSave`       | Function | `packages/ui/src/views/canvas/NodeInputHandler.jsx`  | 460  |

## Execution Flows

| Flow                                 | Type            | Steps |
| ------------------------------------ | --------------- | ----- |
| `AgentFlowNode → GetDb`              | cross_community | 6     |
| `IterationNode → GetDb`              | cross_community | 6     |
| `AgentFlowNode → SaveChunk`          | cross_community | 5     |
| `IterationNode → SaveChunk`          | cross_community | 5     |
| `AddNodes → FuzzyScore`              | cross_community | 5     |
| `NodeInputHandler → EnqueueSnackbar` | cross_community | 4     |
| `NodeInputHandler → CloseSnackbar`   | cross_community | 4     |
| `AddNodes → AddException`            | cross_community | 4     |
| `AddNodes → GroupByTags`             | cross_community | 4     |
| `NodeInputHandler → RemoveDisplayed` | cross_community | 3     |

## Connected Areas

| Area         | Connections |
| ------------ | ----------- |
| Docstore     | 4 calls     |
| Evaluations  | 3 calls     |
| Json         | 3 calls     |
| Validation   | 3 calls     |
| Extended     | 2 calls     |
| Components   | 2 calls     |
| Agentflowsv2 | 1 calls     |
| Button       | 1 calls     |

## How to Explore

1. `gitnexus_context({name: "deleteNode"})` — see callers and callees
2. `gitnexus_query({query: "canvas"})` — find related execution flows
3. Read key files listed above for implementation details
