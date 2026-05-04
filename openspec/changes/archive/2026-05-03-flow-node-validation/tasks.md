# Tasks: flow-node-validation (Slice 2)

## Review Workload Forecast

| Field                   | Value                                |
| ----------------------- | ------------------------------------ |
| Estimated changed lines | ~1,180                               |
| 400-line budget risk    | High                                 |
| Chained PRs recommended | Yes                                  |
| Suggested split         | 3 PRs (infra → agentflow → chatflow) |
| Delivery strategy       | auto-chain                           |
| Chain strategy          | feature-branch-chain                 |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

---

## PR 1: Infrastructure + Common Schemas (~400 lines)

### T1 — Create schemas/ directory structure

-   **File**: `.agents/skills/flow-node/schemas/index.ts` (placeholder)
-   **File**: `.agents/skills/flow-node/schemas/vitest.config.ts`
-   **Action**: Create `schemas/` directory, `vitest.config.ts` with working directory pointing to schemas/, add `vitest` devDep reference note in comment
-   **Deps**: None
-   **Est. lines**: 30
-   **Test**: `vitest --version` passes

### T2 — issues.ts: FlowNodeIssue type + error codes

-   **File**: `.agents/skills/flow-node/schemas/issues.ts`
-   **Action**: Export `ErrorCodes` constant object (12 codes: MISSING_REQUIRED_FIELD, PLACEHOLDER_ID_REMAINING, INVALID_CREDENTIAL_FORMAT, UNSUPPORTED_NODE_TYPE, WRONG_FLOW_TYPE, EMPTY_REQUIRED_PARAM, MISSING_MODEL_NAME, INVALID_ANCHOR_SHAPE, UNKNOWN_NODE_NAME, STALE_CHECKSUM, MISSING_OPTIONAL_CREDENTIAL, EXTRA_UNKNOWN_FIELD, DEPRECATED_VERSION). Export `ErrorCode` type. Export `FlowNodeIssue` interface with `{ path, code, message, severity }`.
-   **Deps**: T1
-   **Est. lines**: 65
-   **Test**: None (type-only file)

### T3 — common.ts: ReactFlowNodeSchema + NodeDataSchema + autoFixNode() + validateNode()

-   **File**: `.agents/skills/flow-node/schemas/common.ts`
-   **Action**: Implement:
    -   `PositionSchema` — `z.object({ x: z.number(), y: z.number() })`
    -   `ReactFlowNodeSchema` — strict Zod object with `id`, `position`, `positionAbsolute` (required), `type`, `data: z.any()`, `width`, `height`, `selected`, `dragging`, plus optional `z`, `handleBounds`, `parentNode`, `extent`. All optional fields have defaults.
    -   `NodeDataSchema` — `z.object` with required `id`, `name`, `type`, `label`, `category`. Optional: `version`, `description`, `color`, `icon`, `baseClasses`, `filePath`, `hideInput`, `loadMethods`. Fields with defaults: `inputs: {}`, `inputParams: []`, `inputAnchors: []`, `outputAnchors: []`, `outputs: {}`. Use `.passthrough()` and a transform to validate `inputParams` is array.
    -   `autoFixNode(node)` — Phase 1 function: injects defaults for missing `position`, `positionAbsolute`, `width: 320`, `height: 200`, `selected: false`, `dragging: false`. Returns `{ node, fixes: FlowNodeIssue[] }`. Does NOT touch PLACEHOLDER_ID.
    -   `validateNode(request, templateName?)` — Phase 2 function: clone → auto-fix → PLACEHOLDER_ID check → ReactFlowNodeSchema → NodeDataSchema → flow-type schema → semantic checks. Returns `FlowNodeResponse`. Hard rule: errors.length > 0 → node: null.
    -   `FlowNodeRequest` and `FlowNodeResponse` interfaces
-   **Deps**: T2 (imports FlowNodeIssue, ErrorCodes)
-   **Est. lines**: 240
-   **Test**: Covered by T7

---

## PR 2: AgentFlow + ChatFlow Schemas (~420 lines)

### T4 — agentflow.ts: AgentFlowNodeSchema + AGENTFLOW_ALLOWLIST + validateAgentFlowSemantics()

-   **File**: `.agents/skills/flow-node/schemas/agentflow.ts`
-   **Action**: Implement:
    -   `AGENTFLOW_ALLOWLIST` — const array of 15 strings: 'agentAgentflow', 'llmAgentflow', 'startAgentflow', 'conditionAgentflow', 'conditionAgentAgentflow', 'customFunctionAgentflow', 'directReplyAgentflow', 'executeFlowAgentflow', 'humanInputAgentflow', 'httpAgentflow', 'iterationAgentflow', 'loopAgentflow', 'retrieverAgentflow', 'stickyNoteAgentflow', 'toolAgentflow'
    -   `AgentFlowNodeSchema` — `ReactFlowNodeSchema.extend({ type: z.literal('agentFlow'), data: NodeDataSchema.extend({ type: z.enum([...14 types...]), category: z.string(), name: z.string() }) }).passthrough()`
    -   `AgentFlowValidationInput` interface
    -   `validateAgentFlowSemantics(input)` — checks: (1) data.name in allowlist → UNKNOWN_NODE_NAME, (2) stickyNote must be 'Utilities', others must be 'Agent Flows' → WRONG_FLOW_TYPE, (3) inputAnchors/outputAnchors must be arrays → MISSING_REQUIRED_FIELD
-   **Deps**: T3
-   **Est. lines**: 150
-   **Test**: Covered by T8

### T5 — chatflow.ts: ChatFlowNodeSchema + CHATFLOW_MVP_ALLOWLIST + validateChatFlowSemantics()

-   **File**: `.agents/skills/flow-node/schemas/chatflow.ts`
-   **Action**: Implement:
    -   `CHATFLOW_MVP_ALLOWLIST` — const array of 9 strings: 'chatOpenRouter', 'chatOpenAI', 'chatAnthropic', 'chatGoogleGenerativeAI', 'bufferMemory', 'huggingFaceEmbeddings', 'openAiEmbeddings', 'supabase', 'retrieverTool', 'toolAgent'
    -   `ChatFlowNodeSchema` — `ReactFlowNodeSchema.extend({ type: z.literal('customNode'), data: NodeDataSchema.extend({ type: z.string(), category: z.string(), name: z.string() }) }).passthrough()`
    -   `ChatFlowValidationInput` interface
    -   `validateChatFlowSemantics(input)` — checks: (1) category !== 'Agent Flows' → WRONG_FLOW_TYPE, (2) data.name in MVP allowlist → UNSUPPORTED_NODE_TYPE, (3) inputAnchors/outputAnchors present → MISSING_REQUIRED_FIELD, (4) inputParams present → MISSING_REQUIRED_FIELD
-   **Deps**: T3
-   **Est. lines**: 150
-   **Test**: Covered by T9

### T6 — index.ts: runValidation() + re-exports

-   **File**: `.agents/skills/flow-node/schemas/index.ts`
-   **Action**: Replace placeholder with full re-exports: `validateNode`, `FlowNodeRequest`, `FlowNodeResponse` from common; `ErrorCodes`, `FlowNodeIssue` from issues; `ReactFlowNodeSchema`, `NodeDataSchema`, `autoFixNode` from common; `AgentFlowNodeSchema`, `validateAgentFlowSemantics`, `AGENTFLOW_ALLOWLIST` from agentflow; `ChatFlowNodeSchema`, `validateChatFlowSemantics`, `CHATFLOW_MVP_ALLOWLIST` from chatflow. Implement `runValidation(request, template, versionInfo)` that calls `validateNode(request)` then attaches templateVersion + checksum to metadata.
-   **Deps**: T2, T3, T4, T5
-   **Est. lines**: 50
-   **Test**: Covered by T10

---

## PR 3: Tests + SKILL.md Update (~310 lines)

### T7 — **tests**/common.test.ts

-   **File**: `.agents/skills/flow-node/schemas/__tests__/common.test.ts`
-   **Action**: Vitest test file with `describe` blocks for `ReactFlowNodeSchema` and `autoFixNode`:
    -   `ReactFlowNodeSchema`: (a) valid minimal node passes, (b) missing positionAbsolute → error
    -   `autoFixNode`: (a) missing position gets default `{ x: 0, y: 0 }`, (b) missing positionAbsolute mirrors position, (c) PLACEHOLDER_ID in id NOT auto-fixed (returns node unchanged, zero fixes for id path)
-   **Deps**: T3
-   **Est. lines**: 90
-   **Test**: `vitest run schemas/__tests__/common.test.ts`

### T8 — **tests**/agentflow.test.ts

-   **File**: `.agents/skills/flow-node/schemas/__tests__/agentflow.test.ts`
-   **Action**: Vitest test file:
    -   `AgentFlowNodeSchema`: (a) valid agentAgentflow template node passes (load from `../../templates/agentAgentflow.json` after ID substitution), (b) type: 'customNode' → fails with WRONG_FLOW_TYPE
    -   `validateAgentFlowSemantics`: (a) unknown node name → UNKNOWN_NODE_NAME, (b) stickyNoteAgentflow with category 'Agent Flows' → WRONG_FLOW_TYPE
-   **Deps**: T4
-   **Est. lines**: 120
-   **Test**: `vitest run schemas/__tests__/agentflow.test.ts`

### T9 — **tests**/chatflow.test.ts

-   **File**: `.agents/skills/flow-node/schemas/__tests__/chatflow.test.ts`
-   **Action**: Vitest test file:
    -   `ChatFlowNodeSchema`: (a) valid chatOpenRouter-like node passes, (b) type: 'agentFlow' → fails with WRONG_FLOW_TYPE
    -   `validateChatFlowSemantics`: (a) unknown node name → UNSUPPORTED_NODE_TYPE, (b) category 'Agent Flows' → WRONG_FLOW_TYPE
-   **Deps**: T5
-   **Est. lines**: 110
-   **Test**: `vitest run schemas/__tests__/chatflow.test.ts`

### T10 — **tests**/validateNode.test.ts

-   [x] **File**: `.agents/skills/flow-node/schemas/__tests__/validateNode.test.ts`
-   [x] **Action**: Full pipeline integration tests for runValidation() covering all 10 scenarios
-   [x] **Deps**: T6
-   [x] **Est. lines**: 130
-   [x] **Test**: `vitest run schemas/__tests__/validateNode.test.ts`

### T11 — Update SKILL.md to reference schemas/

-   [x] **File**: `.agents/skills/flow-node/SKILL.md`
-   [x] **Action**: Added "Schema Validation (implemented)" section referencing schemas/ directory
-   [x] **Deps**: T1–T10
-   [x] **Est. lines**: 30
-   [x] **Test**: None (docs only)

### T12 — Verify: run tests + tsc --noEmit

-   [x] **Action**: All tests pass (69 total), tsc --noEmit passes
-   [x] **Deps**: T7, T8, T9, T10, T11
-   [x] **Est. lines**: 0 (verification only)
-   [x] **Test**: Run verification commands

---

## Summary

| PR        | Tasks                     | Focus                           | Est. Lines |
| --------- | ------------------------- | ------------------------------- | ---------- |
| PR 1      | T1, T2, T3                | Infrastructure + common schemas | ~400       |
| PR 2      | T4, T5, T6                | AgentFlow + ChatFlow schemas    | ~420       |
| PR 3      | T7, T8, T9, T10, T11, T12 | Tests + docs + verification     | ~310       |
| **Total** | **12**                    |                                 | **~1,180** |

### Implementation Order

PR 1 must land before PR 2 starts (T4/T5 depend on T3 types). PR 3 can start after PR 2 lands.

**PR 1**: Directory + issues.ts + common.ts (schemas, autoFixNode, validateNode)
**PR 2**: agentflow.ts + chatflow.ts + index.ts (extension schemas, runValidation)
**PR 3**: All test files + SKILL.md update + verify

### Next Step

Ready for sdd-apply. PR chain: `feature-branch-chain` with auto-chain delivery.
