---
name: flowise-icons
description: |
    AgentFlow vs ChatFlow icon rendering differences in Flowise frontend.
    AgentFlow nodes use SVG icons from @tabler/icons-react mapped by data.name.
    ChatFlow nodes use PNG icons loaded from server via /api/v1/node-icon/{name}.
    When creating/modifying nodes via API, data.icon must be null (falsy) for AgentFlow
    SVGs to render. Setting data.icon to any string disables SVG rendering.
---

# Flowise Icons — AgentFlow vs ChatFlow

## The Core Difference

| | AgentFlow | ChatFlow |
|---|---|---|
| **Icon source** | SVG via `AGENTFLOW_ICONS` registry | PNG via server API |
| **Key field** | `data.name` (maps to SVG component) | `data.icon` (URL path) |
| **Frontend file** | `packages/ui/src/views/agentflowsv2/AgentFlowNode.jsx` | `packages/ui/src/views/canvas/NodeInputHandler.jsx` |
| **Registry** | `packages/ui/src/store/constant.js` → `AGENTFLOW_ICONS` (line 40) | Server endpoint `/api/v1/node-icon/{name}` |
| **SVG lib** | `@tabler/icons-react` | N/A (PNG images) |

## AgentFlow Icon Rendering Logic

In `AgentFlowNode.jsx:355-389`, the icon rendering path is gated on one condition:

```jsx
<Box item style={{ width: 50 }}>
    {data.color && !data.icon ? (
        // ─── SVG PATH ───────────────────────────────────
        // Condition: data.icon is FALSY (null, undefined, "")
        // Renders SVG component from AGENTFLOW_ICONS registry
        <div style={{ borderRadius: '15px', backgroundColor: data.color }}>
            {renderIcon(data)}
        </div>
    ) : (
        // ─── IMG PATH ───────────────────────────────────
        // Condition: data.icon is TRUTHY ("LLM.png", etc.)
        // Tries to load PNG from server
        <div style={{ borderRadius: '50%', backgroundColor: 'white' }}>
            <img src={`/api/v1/node-icon/${data.name}`} />
        </div>
    )}
</Box>
```

The `renderIcon()` function (line 127-132) does the SVG lookup:

```jsx
const renderIcon = (node) => {
    const foundIcon = AGENTFLOW_ICONS.find((icon) => icon.name === node.name)
    if (!foundIcon) return null
    return <foundIcon.icon size={24} color={'white'} />
}
```

## Complete SVG Icon Registry

Defined in `packages/ui/src/store/constant.js:40-116`. All icons are from `@tabler/icons-react`.

| `data.name` | Tabler Icon | Visual | Color | Hex |
|---|---|---|---|---|
| `startAgentflow` | `IconPlayerPlayFilled` | ▶️ Filled play button | green | `#7EE787` |
| `llmAgentflow` | `IconSparkles` | ✨ Sparkles / stars | blue | `#64B5F6` |
| `agentAgentflow` | `IconRobot` | 🤖 Robot head | cyan | `#4DD0E1` |
| `conditionAgentflow` | `IconArrowsSplit` | 🔀 Arrows branching | orange | `#FFB938` |
| `customFunctionAgentflow` | `IconFunctionFilled` | ƒ Function / fx | purple | `#E4B7FF` |
| `directReplyAgentflow` | `IconMessageCircleFilled` | 💬 Filled message bubble | teal | `#4DDBBB` |
| `toolAgentflow` | `IconTools` | 🔧 Cross wrench & hammer | brown | `#d4a373` |
| `retrieverAgentflow` | `IconLibrary` | 📚 Books on shelf | lavender | `#b8bedd` |
| `humanInputAgentflow` | `IconReplaceUser` | 👤 User with replace arrow | indigo | `#6E6EFD` |
| `loopAgentflow` | `IconRepeat` | 🔄 Circular arrows | salmon | `#FFA07A` |
| `conditionAgentAgentflow` | `IconSubtask` | 📋 Checklist subtask | pink | `#ff8fab` |
| `stickyNoteAgentflow` | `IconNote` | 📝 Sticky note | yellow | `#fee440` |
| `httpAgentflow` | `IconWorld` | 🌐 Globe / world | red | `#FF7F7F` |
| `iterationAgentflow` | `IconRelationOneToManyFilled` | 🔁 One-to-many relation | mauve | `#9C89B8` |
| `executeFlowAgentflow` | `IconVectorBezier2` | ➡️ Flow / connection | olive | `#a3b18a` |

## How Node ID Maps to Icon

The icon is determined by `data.name`, NOT by the node ID prefix.

**Example**: A node with `id: "agentAgentflow_0"` but `data.name: "llmAgentflow"` will render the `IconSparkles` sparkles icon (LLM), NOT the `IconRobot` robot icon (Agent).

This means you can visually convert node types by changing three fields:
1. `data.name` → e.g., `"llmAgentflow"` (controls SVG icon lookup)
2. `data.color` → e.g., `"#64B5F6"` (controls background)
3. `data.baseClasses` → e.g., `["LLM"]` (controls runtime behavior)

## Common Bug: Setting `data.icon` Disables SVGs

### Root Cause
When creating/modifying AgentFlow nodes via API, it's tempting to set `data.icon: "LLM.png"` thinking the frontend needs it. **This breaks icon rendering.**

The condition `data.color && !data.icon` means:
- `data.icon = "LLM.png"` → **truthy** → IMG path (broken in AgentFlow)
- `data.icon = null` → **falsy** → SVG path (correct)

### Fix
```diff
- "icon": "LLM.png",
+ "icon": null,
```

The API may persist `null` as `""` (empty string), which is still falsy in JS — works fine.

### Verification
In browser DevTools, inspect the node's icon area:
- `<img>` tag → wrong (PNG path, icon was truthy)
- `<svg>` element → correct (SVG from registry, icon was falsy)

## Migration Checklist

To fix a flow where all nodes have `data.icon` set to PNG strings:

1. **Read the full flow** via `flow-control_get_chatflow`
2. For **every node** in the `nodes` array:
   ```js
   node.data.icon = null
   ```
3. **Update the flow** via `flow-control_update_chatflow` with `mode: "full-replace"`
4. **Verify** in browser — all nodes should show their correct SVG icons

Do NOT change `data.name`, `data.color`, or `data.baseClasses` unless you intend to change the node type.

## Source Files

| File | Purpose |
|---|---|
| `packages/ui/src/views/agentflowsv2/AgentFlowNode.jsx` | AgentFlow node rendering (lines 127-132 renderIcon, 355-389 icon display) |
| `packages/ui/src/store/constant.js` | `AGENTFLOW_ICONS` registry (lines 40-116) |
| `packages/ui/src/views/canvas/CanvasNode.jsx` | ChatFlow node rendering (uses PNG/icon) |
