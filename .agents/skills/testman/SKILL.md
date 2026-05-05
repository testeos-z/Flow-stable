---
name: testman
description: >
    Testing orchestrator for Flow-stable. Detects test type (flow validation, 
    UI/Playwright, API), delegates to specialized sub-agents, and integrates 
    into the flow-architect build cycle.
    Trigger: When user requests testing, flow validation, UI testing, or 
    mentions "test", "testing", "tests", "validar", "probar", "diagnosticar".
license: Apache-2.0
metadata:
    author: gentleman-programming
    version: '2.0'
    project: Flow-stable
---

## When to Use

Use this skill when:

-   User asks to "testear", "validar", "probar" a flow
-   Running smoke tests on a Flowise chatflow or agentflow
-   Running Playwright UI tests on the Flowise canvas
-   Diagnosing flow execution issues
-   Integrating validation into the flow-architect build cycle

## Architecture: Three Test Layers

```
Layer 1: Flow Validation (MCP)
├── validate_chatflow / validate_agentflow
├── Structure, viewport, edges, nodes
├── Fast, no execution needed
└── Used BEFORE saving to Flowise

Layer 2: Smoke Test (API)
├── flow-control_test_chatflow
├── Creates temp copy, sends test message, validates response
├── No browser needed, pure API
└── Used AFTER saving to verify basic functionality

Layer 3: UI Validation (Playwright)
├── playwright-cli browser automation
├── Opens canvas, sends message, checks response rendering
├── Catches "undefinedundefined" issues, rendering bugs
└── Used AFTER smoke test passes for visual verification
```

## Decision Tree

```
User asks for testing?
├── "validar estructura" / "validate flow" / "structure check"
│   └── → Layer 1: flow-control_validate_chatflow / validate_agentflow
├── "smoke test" / "probar el flow" / "does it respond?"
│   └── → Layer 2: flow-control_test_chatflow
├── "UI test" / "probar el canvas" / "browser test" / "Playwright"
│   └── → Layer 3: Playwright automation
├── "test completo" / "full validation" / "diagnosticar"
│   └── → Run ALL 3 layers sequentially
├── Flow-architect delegation (auto):
│   └── → Layer 1 → Layer 2 → Layer 3 (if Smoke passes)
└── Ambiguous? → Ask: "¿Validación de estructura, smoke test, o UI con Playwright?"
```

## Flow Validation Protocol (Layer 1)

Used by flow-architect BEFORE delegating to flow-ing.

```bash
# Validate structure without saving
flow-control_validate_chatflow(flowData: {...})
flow-control_validate_agentflow(flowData: {...})

# For existing flows with issues
flow-control_diagnose_chatflow(chatflowId: "...")
flow-control_repair_chatflow(chatflowId: "...")
```

**Checks**: viewport, node metadata, edges, orphan nodes, cycles.

## Smoke Test Protocol (Layer 2)

Used AFTER saving a flow to verify basic functionality.

```bash
# Run smoke test via API
flow-control_test_chatflow(chatflowId: "...")

# Or test a specific prompt
flow-control_create_prediction(
  chatflowId: "...",
  question: "Hello, this is a test"
)
```

**Validation**:

-   Response is NOT empty
-   Response does NOT contain "undefined" or "undefinedundefined"
-   Response is relevant to the prompt
-   Flow state variables are populated correctly

## UI Validation Protocol (Layer 3)

Used AFTER smoke test passes, to verify visual rendering.

### Prerequisites

```bash
# Ensure browser is available
playwright-cli open https://flow-stable-flow.up.railway.app

# Login if needed (saves state)
playwright-cli fill "input[type=email]" "bryandavidaaa@gmail.com"
playwright-cli fill "input[type=password]" "Bryansanabria21="
playwright-cli click "button[type=submit]"
playwright-cli state-save auth.json
```

### Canvas Test Sequence

```bash
# 1. Navigate to flow canvas
playwright-cli goto "https://flow-stable-flow.up.railway.app/v2/agentcanvas/{FLOW_ID}"
playwright-cli snapshot

# 2. Open chat panel
playwright-cli click "button[ref=e1303]"  # "chat" button

# 3. Send test message
playwright-cli fill "textarea" "¿Cuáles son las políticas de vivienda en Nueva York?"
playwright-cli press Enter

# 4. Wait for response (up to 60 seconds for complex flows)
sleep 30

# 5. Capture response
playwright-cli snapshot

# 6. Validate response
# - Check that response text does NOT contain "undefined"
# - Check that response text has actual content (length > 20)
# - Check that no error messages appear in console
playwright-cli console

# 7. Close
playwright-cli close
```

### Response Validation Checks

```python
# Pseudo-code for validation logic
response_text = extract_from_snapshot(snapshot)

checks = {
    "no_undefined": "undefined" not in response_text,
    "has_content": len(response_text) > 20,
    "no_error": no_console_errors_related_to_flow,
    "matches_prompt": response_addresses_query(response_text, test_prompt)
}

if all(checks.values()):
    return "✅ UI validation passed"
else:
    return f"❌ UI validation failed: {failed_checks}"
```

## Integration with Flow-Architect Build Cycle

When flow-architect completes a build cycle, testman runs automatically:

```
[5] flow-ing reports result
    ↓
[6] testman: POST-BUILD VALIDATION
    ├─ 6a. Layer 1: Structure validation (already done by flow-ing)
    ├─ 6b. Layer 2: Smoke test via API
    │   └─ flow-control_test_chatflow → verify response
    ├─ 6c. Layer 3: UI validation via Playwright (if 6a + 6b pass)
    │   └─ Open canvas → send prompt → check response
    └─ Report: ✅ All layers passed | ❌ Layer X failed: [diagnosis]
```

### Auto-Invocation from flow-architect

The `flow-architect` SKILL.md includes a post-build step that invokes testman:

```
After flow-ing reports success:
1. Run smoke test (Layer 2)
2. If smoke test passes → run UI validation (Layer 3)
3. Report results to user
```

## @-Invocation (Flowise Custom Tool)

testman can be invoked from Flowise chat via a Custom Tool endpoint:

**Tool Configuration**:

-   Name: `testman`
-   Description: "Run tests on Flowise flows — structure validation, smoke tests, or UI/Playwright checks"
-   Type: Custom Tool (API call)

**Input Schema**:

```json
{
    "flow_id": "ID del flow a testear",
    "test_type": "smoke | ui | full",
    "test_prompt": "Prompt para el smoke test (opcional)"
}
```

**Implementation**: Custom Tool that calls a local API endpoint or Lambda function.

> Note: The @-invocation requires a Custom Tool in Flowise + an external endpoint. This is a future enhancement — currently testman runs from OpenCode agents only.

## Commands Quick Reference

```bash
# Layer 1: Validate flow structure
flow-control_validate_chatflow(flowData)
flow-control_validate_agentflow(flowData)

# Layer 2: Smoke test
flow-control_test_chatflow(chatflowId)

# Layer 3: UI test
playwright-cli open https://flow-stable-flow.up.railway.app
playwright-cli goto "https://flow-stable-flow.up.railway.app/v2/agentcanvas/{FLOW_ID}"
# ... (see Canvas Test Sequence above)

# Diagnosis
flow-control_diagnose_chatflow(chatflowId)
playwright-cli console  # check for browser errors
```

## Critical Rules

-   ALWAYS run Layer 1 before Layer 2, and Layer 2 before Layer 3
-   NEVER skip structure validation to jump to UI testing
-   If Layer 2 fails, do NOT proceed to Layer 3 — the flow has functional issues
-   ALWAYS save browser auth state before running UI tests
-   ALWAYS report which layer failed and what the diagnosis is
-   For flow-architect integration, run all 3 layers sequentially after a build
