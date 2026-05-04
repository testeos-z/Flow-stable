# Tasks: AgentFlow Template Validation

## Review Workload Forecast

| Field                   | Value     |
| ----------------------- | --------- |
| Estimated changed lines | ~100      |
| 400-line budget risk    | Low       |
| Chained PRs recommended | No        |
| Suggested split         | Single PR |
| Delivery strategy       | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Schema Fix + Template Validation

-   [x] 1.1 `schemas/agentflow.ts`: Relax `AgentFlowNodeSchema.type` from `z.literal('agentFlow')` to `z.enum(['agentFlow', 'stickyNote'])` with refine that `'stickyNote'` only when `data.name === 'stickyNoteAgentflow'`. (~8 lines)

-   [x] 1.2 `schemas/agentflow.ts`: Add `validateTemplate()` — mirrors `validateNodeImpl` structure: autoFix → ReactFlowNodeSchema → NodeDataSchema → AgentFlowNodeSchema. PLACEHOLDER_ID emits warnings instead of short-circuiting. (~40 lines)

-   [x] 1.3 `schemas/index.ts`: Re-export `validateTemplate` alongside existing `validateNode`. (~3 lines)

## Phase 2: Tests

-   [x] 2.1 `schemas/__tests__/template-integrity.test.ts`: New test file — iterates all 15 template JSONs, calls `validateTemplate()`, asserts `valid: true` for each. Verifies stickyNoteAgentflow passes after type fix. (~45 lines)

-   [x] 2.2 `schemas/__tests__/agentflow.test.ts`: Update stickyNote-type test — change `type:'agentFlow'` to `type:'stickyNote'` in the `buildMinimalAgentNode` call for the stickyNote tests to match Flowise's actual type value. (~5 lines)

## Phase 3: Verify

-   [x] 3.1 Run `npx vitest run` in `schemas/` — confirm all existing tests pass plus new `template-integrity.test.ts` passes.
-   [x] 3.2 Verify `validateNode()` still rejects PLACEHOLDER_ID as hard error (existing `validateNode.test.ts` unchanged).
