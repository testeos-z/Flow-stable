# Proposal: AgentFlow Template Validation

## Intent

The 15 AgentFlow templates in `templates/` lack structural integrity validation. `validateNode()` rejects all 15 on PLACEHOLDER_ID by design — templates are blueprints, not production nodes. One template (`stickyNoteAgentflow`) also has a `type` mismatch: `"stickyNote"` vs schema's `z.literal('agentFlow')`. Add template-specific validation to detect structural regressions without breaking the production contract.

## Scope

### In Scope

-   `validateTemplate()` function: schema validation that downgrades PLACEHOLDER_ID to warning
-   Fix `AgentFlowNodeSchema.type` to accept `'stickyNote'` for stickyNoteAgentflow nodes
-   Template integrity tests: iterate all 15 templates through `validateTemplate()`

### Out of Scope

-   Modifying any template JSON files (zero template changes)
-   Changing production `validateNode()` behavior (PLACEHOLDER_ID remains hard failure)
-   ChatFlow template validation (AgentFlow only)

## Capabilities

### New Capabilities

-   `template-validation`: validates AgentFlow template structural integrity independently of production node validation

### Modified Capabilities

-   None (schema type relaxation is an implementation detail — no spec-level behavior change)

## Approach

1. Add `validateTemplate()` to `agentflow.ts` — clones `validateNodeImpl` flow but skips PLACEHOLDER_ID hard-fail, emitting warnings. Runs: autoFix → ReactFlowNodeSchema → NodeDataSchema → AgentFlowNodeSchema.
2. Fix `AgentFlowNodeSchema.type`: change `z.literal('agentFlow')` to `z.enum(['agentFlow', 'stickyNote'])` with refine that `'stickyNote'` only allowed when `data.name === 'stickyNoteAgentflow'`.
3. Add `__tests__/template-integrity.test.ts` — reads all 15 template JSONs, calls `validateTemplate()`, asserts all pass.
4. Re-export `validateTemplate` from `schemas/index.ts`.

## Affected Areas

| Area                                           | Impact   | Description                                     |
| ---------------------------------------------- | -------- | ----------------------------------------------- |
| `schemas/agentflow.ts`                         | Modified | Add `validateTemplate()`, relax stickyNote type |
| `schemas/index.ts`                             | Modified | Re-export `validateTemplate`                    |
| `schemas/__tests__/template-integrity.test.ts` | New      | 15-template integrity suite                     |
| `schemas/__tests__/agentflow.test.ts`          | Modified | Update stickyNote type test assertions          |

## Risks

| Risk                                           | Likelihood | Mitigation                                                                |
| ---------------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| Relaxing stickyNote type breaks existing tests | Low        | Existing tests use `type:'agentFlow'` — union type is backward-compatible |

## Rollback Plan

Revert `agentflow.ts` to pre-change state. Remove `template-integrity.test.ts`. Revert `index.ts` re-export. No templates changed.

## Dependencies

-   `schemas/validateNodeImpl.ts` — `validateTemplate()` mirrors its structure

## Success Criteria

-   [ ] `validateTemplate()` passes all 15 templates (including stickyNoteAgentflow)
-   [ ] All existing tests (agentflow, chatflow, common, validateNode) pass unchanged
-   [ ] Production `validateNode()` still rejects PLACEHOLDER_ID as hard error
