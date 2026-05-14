# Exploration: Alejandria AGENTFLOW Smoke Test Failure — CustomFunction Variable Naming

**Date**: 2026-05-14
**Context**: Flow `a6228a84-c8b7-449b-b484-7ae942cc0386` ("Alejandria v1.1.0") smoke test fails with `ReferenceError: input_text is not defined` after anchor/edge fix was applied.

## Current State

The flow `a6228a84` has 10 nodes (1 Start + 9 non-Start) with proper anchors and edges (fixed via forceOverwrite on 2026-05-14). The flow is an `AGENTFLOW` executing the pipeline:

```
Start → Simulation Context Detector (CustomFunction) → Router → Bibliotecario → Source Worker → Condition → Síntesis → Reply
                                                                                                       → Fallback i18n (CustomFunction) → Fallback Reply
```

The **Simulation Context Detector** (`customFunctionAgentflow_simdetect`) is the first node after Start. Its purpose is to detect the `[SIMULATION: uuid]` prefix in the user's question and set flow state flags accordingly.

The **Fallback i18n** (`customFunctionAgentflow_i18n`) generates an internationalized fallback message when the condition `Has Results?` is `False`.

Both nodes are `CustomFunction` type and share the same variable injection mechanism.

## Root Cause Analysis

### The Bug in Simulation Context Detector

The node's `customFunctionInputVariables` is configured as:

```json
[{ "variableName": "input_text", "variableValue": "{{question}}" }]
```

The JS function body is:

```javascript
// line 1
const input = input_text || ''
```

The error `ReferenceError: input_text is not defined` occurs because of a **sandbox variable naming mismatch**.

### How CustomFunction Variable Injection Works

In `CustomFunction_Agentflow.run()` (`packages/components/nodes/agentflow/CustomFunction/CustomFunction.ts`, line 164-168):

```typescript
const additionalSandbox: ICommonObject = {}
for (const item of functionInputVariables) {
    const variableName = item.variableName // "input_text"
    const variableValue = item.variableValue // "Hello, are you working?" (resolved)
    additionalSandbox[`$${variableName}`] = variableValue // "$input_text" key
}
```

The `$` prefix is ALWAYS prepended: `"input_text"` → `"$input_text"`.

Then `createCodeExecutionSandbox()` (`packages/components/src/utils.ts`, line 1820-1840) builds the sandbox object. In both execution paths (E2B sandbox and NodeVM), the variable is available as `$input_text`:

-   **E2B path** (line 1642): `const $input_text = "Hello, are you working?";`
-   **NodeVM path** (line 1772): sandbox property `$input_text` is a global

But the JS function references `input_text` **without the `$` prefix** — which is undefined in both environments. The CustomFunction component definition explicitly documents this: "Input variables can be used in the function with prefix $. For example: $foo".

### Template Resolution Works Correctly

The `{{question}}` template IS correctly resolved by `buildAgentflow.ts:resolveVariables()` (line 271-273):

```typescript
if (variableFullPath === QUESTION_VAR_PREFIX) {
    // "question"
    resolvedValue = resolvedValue.replace(match, question)
}
```

This happens during node initialization, BEFORE `run()` is called. So the resolved value (e.g., `"Hello, are you working?"`) IS available — it's just stored under the wrong name.

### Smoke Test Infrastructure

The smoke test (`packages/flowise-mcp-server/src/testing.ts`, line 82-110) sends a standard prediction via `POST /prediction/{flowId}` with `question: "Hello, are you working?"`. This goes through the full AgentFlow pipeline. The error occurs at the very first node after Start (Simulation Context Detector), so the flow never reaches subsequent nodes.

### Same Bug in Fallback i18n Node

The Fallback i18n node (`customFunctionAgentflow_i18n`) has the SAME pattern:

```
Input Variables: user_language, original_query, router_result
JS references: user_language (should be $user_language)
```

Additionally, these variables map to `{{$flow.state.user_language}}` etc., which are build-time resolved values (likely empty strings at initialization time). The runtime `$flow.state.*` values ARE available in the sandbox via `$flow.state`, so the JS code should access them as `$flow.state.user_language` directly rather than relying on the stale build-time resolved variable.

## Affected Areas

| File / Resource                                                                   | Why Affected                                                                                         |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Flowise flow `a6228a84`, node `customFunctionAgentflow_simdetect`                 | JS code uses `input_text` instead of `$input_text`                                                   |
| Flowise flow `a6228a84`, node `customFunctionAgentflow_i18n`                      | JS code uses `user_language` instead of `$flow.state.user_language` (or `$user_language` at minimum) |
| `packages/components/nodes/agentflow/CustomFunction/CustomFunction.ts` (line 167) | Reference: where `$${variableName}` prefix is applied                                                |
| `packages/components/src/utils.ts` (line 1820-1840)                               | Reference: `createCodeExecutionSandbox` — sandbox construction                                       |
| `packages/server/src/utils/buildAgentflow.ts` (line 215-417)                      | Reference: `resolveVariables` — template resolution (works correctly)                                |
| `packages/flowise-mcp-server/src/testing.ts` (line 82-110)                        | Reference: smoke test sends prediction → blocked by this error                                       |
| `openspec/changes/alejandria-hardening/`                                          | Existing change scope — does NOT cover this bug                                                      |

## Approaches

### 1. Fix Simulation Context Detector JS Code (`$input_text`)

Change the JS function in node `customFunctionAgentflow_simdetect` from `input_text` to `$input_text`.

```javascript
// Before:
const input = input_text || ''

// After:
const input = $input_text || ''
```

-   **Pros**: Minimal change, direct fix, fixes the smoke test
-   **Cons**: Also need to fix Fallback i18n node (secondary bug)
-   **Effort**: Low (1 node, 1 line)

### 2. Fix Both CustomFunction Nodes (Recommended)

Fix Simulation Context Detector AND Fallback i18n in one change:

**Simulation Context Detector**: `input_text` → `$input_text`

**Fallback i18n**: Access `$flow.state.*` directly instead of relying on stale build-time resolved input variables:

```javascript
// Before:
const msg = langMessages[user_language] || langMessages.en

// After:
const lang = $flow.state.user_language || 'en'
const msg = langMessages[lang] || langMessages.en
```

This avoids the dual issue of (a) missing `$` prefix on variable names AND (b) build-time staleness of `$flow.state.*` resolved values.

-   **Pros**: Fixes both bugs, ensures fallback i18n actually uses the correct runtime language
-   **Cons**: Slightly more changes
-   **Effort**: Low (2 nodes, ~5 lines total)

### 3. Don't Fix, Merge into Hardening Change

Wait for the `alejandria-hardening` change to complete (which would replace both nodes anyway via full-replace in Phase 2) — the hardening change rewrites the flow with Structured Output and removes the Stripper node. But the hardening change does NOT modify the CustomFunction JS code of either node.

-   **Pros**: None (hardening doesn't touch these JS functions)
-   **Cons**: Smoke test remains broken, blocks validation between hardening phases
-   **Effort**: N/A (wouldn't work)

## Recommendation

**Approach 2 — Fix Both CustomFunction Nodes**. This should be a NEW change (`alejandria-cf-varname-fix`) that runs BEFORE the hardening change, because:

1. The smoke test MUST pass before hardening validation phases (1.5, 2.6, 3.2, 4.5, 5.2, 6.3)
2. The hardening change doesn't touch the Simulation Context Detector or Fallback i18n JS code
3. The fix is minimal (2 nodes, <5 lines of JS) and low-risk
4. The Fallback i18n secondary bug (runtime language resolution) would otherwise remain undetected

**Execution order**: `alejandria-cf-varname-fix` → `alejandria-hardening` (or merge the fix as Phase 0 of hardening).

## Risks

| Risk                                                       | Likelihood | Mitigation                                                                                                                                                                                                                       |
| ---------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$input_text` value not resolved at runtime                | Low        | Verified: `resolveVariables` in `buildAgentflow.ts` resolves `{{question}}` to actual question string. Only concern is if state carries the resolved value; the Start node initializes `question` and `original_query` in state. |
| `$flow.state.*` not available in sandbox for Fallback i18n | None       | `createCodeExecutionSandbox` line 1837 sets `$flow` with full `state` object from `options.agentflowRuntime?.state`                                                                                                              |
| Fix breaks something in the Simulation Mode path           | Low        | The Simulation Mode prefix `[SIMULATION: uuid]` is detected via regex on `$input_text` (the question string). Using `$input_text` instead of `input_text` doesn't change behavior                                                |
| Race condition with hardening full-replace                 | Medium     | If hardening Phase 2 (full-replace) is applied first, it would overwrite the fix. Ensure fix is applied last or merged into hardening flowData                                                                                   |

## Ready for Proposal

**Yes**. Recommend creating a new change `alejandria-cf-varname-fix` with:

-   Fix Simulation Context Detector: `input_text` → `$input_text`
-   Fix Fallback i18n: use `$flow.state.user_language` directly instead of stale input variable
-   Apply via `update_chatflow(patch)` to avoid topology changes
-   Validation: smoke test + verify simulation mode detection still works
