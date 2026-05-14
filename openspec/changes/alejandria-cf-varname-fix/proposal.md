# Proposal: Alejandria CF Variable Name Fix

## Intent

Flowise CustomFunction sandbox injects input variables with `$` prefix (e.g., `$input_text`), but two nodes in AGENTFLOW `a6228a84` reference them without the prefix. This causes `ReferenceError: input_text is not defined` on smoke test, blocking all validation downstream.

## Scope

### In Scope

-   Fix `input_text` → `$input_text` in Simulation Context Detector (`customFunctionAgentflow_simdetect`) JS code
-   Fix `user_language` → `$flow.state.user_language` in Fallback i18n (`customFunctionAgentflow_i18n`) JS code
-   Run smoke test to verify the flow completes without reference errors

### Out of Scope

-   End-to-end FACTUM testing (deferred to `alejandria-hardening`)
-   ChatflowTool connectivity verification (deferred to hardening)
-   Resolving stale build-time variable values beyond the i18n node fix

## Capabilities

### New Capabilities

None — pure bugfix of existing JS code. No new features or behaviors.

### Modified Capabilities

None — no spec-level requirement changes. The `flow-node` spec covers template schemas, not runtime variable injection.

## Approach

Patch both CustomFunction nodes' `funcBody` via `flow-control_update_chatflow` in **patch mode**, preserving topology and all other node properties. Two lines of JS changed. The `$` prefix matches the sandbox injection contract in `CustomFunction_Agentflow.run()` (line 167). For Fallback i18n, `$flow.state.*` is directly available in the sandbox via `createCodeExecutionSandbox` (line 1837).

## Affected Areas

| Area                                                      | Impact   | Description                                               |
| --------------------------------------------------------- | -------- | --------------------------------------------------------- |
| Flow `a6228a84`, node `customFunctionAgentflow_simdetect` | Modified | `funcBody`: `input_text` → `$input_text`                  |
| Flow `a6228a84`, node `customFunctionAgentflow_i18n`      | Modified | `funcBody`: `user_language` → `$flow.state.user_language` |
| `openspec/changes/alejandria-hardening/`                  | Related  | Must execute AFTER this fix to pass phase validations     |

## Risks

| Risk                                   | Likelihood | Mitigation                                                                         |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| `$input_text` not populated at runtime | Low        | `resolveVariables` correctly resolves `{{question}}` before `run()`                |
| Hardening full-replace overwrites fix  | Low        | Apply this fix AFTER any hardening full-replace, or merge into hardening flowData  |
| Simulation Mode regex breaks           | Low        | Prefix detection regex reads from same value — variable name change is transparent |

## Rollback Plan

`flow-control_update_chatflow` in patch mode with original `funcBody` values. Re-run smoke test to confirm rollback restores previous (broken) state.

## Dependencies

-   `alejandria-hardening` exploration analysis (completed)
-   Flowise MCP server must be authorized for `update_chatflow` and `test_chatflow` operations

## Success Criteria

-   [ ] Smoke test on `a6228a84` passes without `ReferenceError`
-   [ ] Simulation Context Detector correctly detects `[SIMULATION: uuid]` prefix
-   [ ] Fallback i18n generates language-appropriate fallback message
