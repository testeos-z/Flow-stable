# Exploration: Slice 3 — AgentFlow Template Validation Gap

## Current State

The `flow-node` skill implements a two-phase validation pipeline in `validateNodeImpl.ts`:

1. **Phase 1 (auto-fix)**: Injects defaults for missing position, width, height, selected, dragging, handleBounds, z.
2. **Phase 1b (PLACEHOLDER_ID check)**: Short-circuits with `valid: false` if `node.id` or `data.id` contains `PLACEHOLDER_ID`.
3. **Phase 2 (schema layers)**: ReactFlowNodeSchema → NodeDataSchema → AgentFlowNodeSchema/ChatFlowNodeSchema.

The 15 templates in `templates/` are **never directly validated by `validateNode()`**. They serve as ground-truth blueprints. The flow-ing agent substitutes real IDs (replacing `PLACEHOLDER_ID`), then calls `validateNode()`. The schemas are **correctly designed for post-substitution validation** — `PLACEHOLDER_ID` is a hard failure because it means `flow-ing` didn't do its job.

## Template Inventory

All 15 templates have structurally complete nodes. Every template has:

| Field                | Status                                      |
| -------------------- | ------------------------------------------- |
| `id`                 | Present (all = `"PLACEHOLDER_ID"`)          |
| `position`           | Present `{x:0, y:0}`                        |
| `positionAbsolute`   | Present (mirrors position)                  |
| `width`              | Present (120–500 depending on node)         |
| `height`             | Present (100–500)                           |
| `selected`           | `false`                                     |
| `dragging`           | `false`                                     |
| `data.id`            | Present (all = `"PLACEHOLDER_ID"`)          |
| `data.name`          | Present, all in `AGENTFLOW_ALLOWLIST`       |
| `data.label`         | Present                                     |
| `data.category`      | Correct (14× "Agent Flows", 1× "Utilities") |
| `data.inputs`        | Present `{}`                                |
| `data.inputParams`   | Present (arrays, 1–16 items)                |
| `data.inputAnchors`  | Present (arrays, all 0)                     |
| `data.outputAnchors` | Present (arrays, 0–2 items)                 |

### Per-template details

| Template                | data.name               | data.category | inputParams | outAnchors |
| ----------------------- | ----------------------- | ------------- | ----------- | ---------- |
| agentAgentflow          | agentAgentflow          | Agent Flows   | 16          | 1          |
| llmAgentflow            | llmAgentflow            | Agent Flows   | 10          | 1          |
| startAgentflow          | startAgentflow          | Agent Flows   | 7           | 1          |
| conditionAgentflow      | conditionAgentflow      | Agent Flows   | 1           | 2          |
| conditionAgentAgentflow | conditionAgentAgentflow | Agent Flows   | 10          | 2          |
| customFunctionAgentflow | customFunctionAgentflow | Agent Flows   | 3           | 1          |
| directReplyAgentflow    | directReplyAgentflow    | Agent Flows   | 1           | 1          |
| executeFlowAgentflow    | executeFlowAgentflow    | Agent Flows   | 6           | 1          |
| humanInputAgentflow     | humanInputAgentflow     | Agent Flows   | 5           | 2          |
| httpAgentflow           | httpAgentflow           | Agent Flows   | 8           | 1          |
| iterationAgentflow      | iterationAgentflow      | Agent Flows   | 1           | 1          |
| loopAgentflow           | loopAgentflow           | Agent Flows   | 4           | 1          |
| retrieverAgentflow      | retrieverAgentflow      | Agent Flows   | 4           | 1          |
| stickyNoteAgentflow     | stickyNoteAgentflow     | Utilities     | 1           | 0          |
| toolAgentflow           | toolAgentflow           | Agent Flows   | 3           | 1          |

## Pass/Fail Matrix

Running the full `AgentFlowNodeSchema` (with auto-fix + PLACEHOLDER_ID check) against raw templates:

| Template                | Pass? | Failure reason                                                                                                            |
| ----------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------- |
| agentAgentflow          | ❌    | PLACEHOLDER_ID in id + data.id                                                                                            |
| llmAgentflow            | ❌    | PLACEHOLDER_ID in id + data.id                                                                                            |
| startAgentflow          | ❌    | PLACEHOLDER_ID in id + data.id                                                                                            |
| conditionAgentflow      | ❌    | PLACEHOLDER_ID in id + data.id                                                                                            |
| conditionAgentAgentflow | ❌    | PLACEHOLDER_ID in id + data.id                                                                                            |
| customFunctionAgentflow | ❌    | PLACEHOLDER_ID in id + data.id                                                                                            |
| directReplyAgentflow    | ❌    | PLACEHOLDER_ID in id + data.id                                                                                            |
| executeFlowAgentflow    | ❌    | PLACEHOLDER_ID in id + data.id                                                                                            |
| humanInputAgentflow     | ❌    | PLACEHOLDER_ID in id + data.id                                                                                            |
| httpAgentflow           | ❌    | PLACEHOLDER_ID in id + data.id                                                                                            |
| iterationAgentflow      | ❌    | PLACEHOLDER_ID in id + data.id                                                                                            |
| loopAgentflow           | ❌    | PLACEHOLDER_ID in id + data.id                                                                                            |
| retrieverAgentflow      | ❌    | PLACEHOLDER_ID in id + data.id                                                                                            |
| **stickyNoteAgentflow** | ❌    | **3 failures**: PLACEHOLDER_ID (id + data.id) **+ `type` mismatch** (`"stickyNote"` vs schema's `z.literal("agentFlow")`) |
| toolAgentflow           | ❌    | PLACEHOLDER_ID in id + data.id                                                                                            |

**Result: 0/15 pass, 15/15 fail.** Without PLACEHOLDER_ID, 14/15 would pass schema validation. The 15th (stickyNoteAgentflow) would still fail on `type`.

## Common Gaps

### 1. PLACEHOLDER_ID — Universal (15/15, by design)

All templates intentionally use `PLACEHOLDER_ID` for `node.id` and `data.id`. These are NEVER validated directly by `validateNode()` — they are templates meant for ID substitution BEFORE validation. The test suite (`agentflow.test.ts`) confirms: "fails hard when PLACEHOLDER_ID remains" is expected. The `validateNode()` function short-circuits at lines 73–84 BEFORE reaching schema validation when PLACEHOLDER_ID is present.

**This is NOT a bug — it's the intended contract.** Templates hold `PLACEHOLDER_ID`, flow-ing substitutes real IDs, `validateNode()` enforces no remaining placeholders.

### 2. stickyNoteAgentflow `type` mismatch (1/15 — real gap)

`stickyNoteAgentflow.json` has `"type": "stickyNote"` but `AgentFlowNodeSchema` line 53 uses `type: z.literal('agentFlow')`. In Flowise's AgentFlow system, sticky notes use `type: "stickyNote"` — this is the actual value the Flowise canvas assigns.

The SKILL.md line 195 says `node.type === 'agentFlow'` for AgentFlow nodes, with stickyNote being the exception (categorized as Utilities). But the strict Zod schema doesn't accommodate this exception. The existing test (`agentflow.test.ts` line 58-62) tests stickyNote with `type: "agentFlow"` and passes — but that contradicts what Flowise actually uses.

**This is a real schema bug.** The schema needs to allow `type: "stickyNote"` for nodes where `data.name === 'stickyNoteAgentflow'`.

### 3. No inputAnchors on any template (15/15)

All 15 templates have `inputAnchors: []`. This is correct — in AgentFlow, most nodes receive input via the flow graph edge system, not via explicit input anchors. Only some nodes (agents with tool inputs) would have them.

### 4. Template quality — all structurally sound

All templates are well-formed. No missing fields. No invalid data types. No orphans in the template structure itself. The auto-fix function would have zero work to do on these templates (position, width, height, selected, dragging are all present).

## PLACEHOLDER_ID Strategy

### How the system works today

```
Template (PLACEHOLDER_ID in id, data.id)
    ↓
flow-ing substitutes real IDs (R1 from SKILL.md)
    ↓
validateNode() checks for remaining PLACEHOLDER_ID → hard fail if any
    ↓
Schema validation (ReactFlowNode → NodeData → AgentFlowNode)
    ↓
valid: true → node returned to flow-ing
```

### Three options evaluated

| Option                                                 | Description                                                                                                                                    | Pros                                                                                               | Cons                                                                                                      | Effort |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------ |
| **A: Templates ARE validated only after substitution** | No change. Templates are never validated directly. Only the post-substitution node is validated.                                               | Zero code changes. Clean separation: templates are blueprints, validation is for production nodes. | No way to validate template structural integrity without manually substituting IDs.                       | None   |
| **B: Remove PLACEHOLDER_ID from all templates**        | Every `"PLACEHOLDER_ID"` → real-looking dummy ID like `"__template_agent_0"`.                                                                  | Templates pass schema directly.                                                                    | Defeats purpose of templates. Makes it harder to detect unsubstituted IDs. Must rewrite all 15 templates. | High   |
| **C: Add `isTemplate: true` flag**                     | `validateNode(req, { isTemplate: true })` skips PLACEHOLDER_ID check.                                                                          | Templates can be validated. Keeps PLACEHOLDER_ID as placeholder.                                   | Requires schema + function changes. Additional complexity.                                                | Medium |
| **D: Template validation as a separate function**      | Add `validateTemplate(template: obj)` that runs ReactFlowNodeSchema + NodeDataSchema + AgentFlowNodeSchema but skips the PLACEHOLDER_ID check. | Clean API separation. Production path unchanged.                                                   | New function to maintain + test.                                                                          | Low    |

### Recommendation: Option D — separate template validation

Option A is the current state and works fine for production. But for Slice 3, we need to ensure templates are structurally valid BEFORE they're used. Option D adds a lightweight `validateTemplate()` function that:

1. Runs auto-fix (same as production)
2. Runs ReactFlowNodeSchema
3. Runs NodeDataSchema
4. Runs AgentFlowNodeSchema (but with PLACEHOLDER_ID check relaxed to a **warning**, not error)
5. Returns pass/fail with structured issues

This keeps the production `validateNode()` unchanged (PLACEHOLDER_ID = hard failure) while allowing us to validate template integrity during development and CI.

## Key Finding: stickyNoteAgentflow `type` bug

**File**: `templates/stickyNoteAgentflow.json` line 5
**Current value**: `"type": "stickyNote"`
**Schema expects**: `"agentFlow"` per `AgentFlowNodeSchema` line 53

**Root cause**: In Flowise's actual AgentFlow canvas, sticky notes have `type: "stickyNote"` — they're a special canvas element, not a flow-execution node. The schema is correct that stickyNoteAgentflow should be in the AgentFlow allowlist, but wrong to require `type: "agentFlow"` for it.

**Fix needed**: Either:

-   Relax `AgentFlowNodeSchema.type` to `z.union([z.literal('agentFlow'), z.literal('stickyNote')])`, with a refine that `'stickyNote'` is only allowed when `data.name === 'stickyNoteAgentflow'`. OR
-   Change the template to use `type: "agentFlow"` and let Flowise handle the display type internally. (But this could break the Flowise canvas UI.)

**Preferred fix**: Relax the schema (union type) because it reflects the reality of Flowise's data model.

## Recommendation for Slice 3

### What to implement

1. **Add `validateTemplate()` function** — a new export in `schemas/agentflow.ts` (or `schemas/common.ts`) that validates a raw template node against the structural schemas but downgrades PLACEHOLDER_ID to a warning or skips it entirely. This validates: ReactFlowNode shape, NodeData shape, category correct, name in allowlist.

2. **Fix stickyNoteAgentflow `type`** — change `AgentFlowNodeSchema.type` to accept `"stickyNote"` when `data.name === 'stickyNoteAgentflow'`. Alternatively, update the template to use `"agentFlow"` if that's compatible with Flowise's rendering.

3. **Write template validation tests** — iterate all 15 templates through `validateTemplate()`. Verify 14/15 pass structural validation. Verify stickyNoteAgentflow passes after the type fix.

4. **Update SKILL.md** — document the `validateTemplate()` function and clarify that `validateNode()` is for post-substitution production use only.

### Scope

-   **Files to modify**: `schemas/agentflow.ts` (type relaxation + new function), `schemas/index.ts` (re-export)
-   **Files to create**: `schemas/__tests__/template-validation.test.ts`
-   **Templates to fix**: `templates/stickyNoteAgentflow.json` (only if we fix the template side, not the schema side)
-   **Templates to NOT modify**: All 14 non-stickyNote templates are structurally perfect.

### Risks

-   **Low risk** — The production `validateNode()` path is unchanged. PLACEHOLDER_ID check remains a hard failure. Only the new `validateTemplate()` function would skip it.
-   **Medium risk** — Changing stickyNote's type handling must not break the existing test suite (`agentflow.test.ts` already tests stickyNote with `type: "agentFlow"` and passes).
-   **No risk to Flowise integration** — Templates are never sent to Flowise directly; flow-ing always substitutes IDs first.

## Ready for Proposal

**Yes.** The exploration confirms:

-   Templates are structurally sound (all required fields present)
-   The only "failures" are intentional PLACEHOLDER_ID usage (correct behavior for templates)
-   One real bug: stickyNoteAgentflow's `type: "stickyNote"` vs schema's `type: "agentFlow"`
-   Slice 3 should add template validation (separate from production validation) + fix the stickyNote type constraint
