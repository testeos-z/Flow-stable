# Tasks: Alejandria CF Variable Name Fix

## Implementation

-   [x] 1. Patch `customFunctionAgentflow_simdetect` (Simulation Context Detector): change `input_text` → `$input_text` in funcBody
-   [x] 2. Patch `customFunctionAgentflow_i18n` (Fallback i18n): change `user_language` usage to `$flow.state.user_language` in funcBody
-   [x] 3. Run smoke test on flow `a6228a84-c8b7-449b-b484-7ae942cc0386`
-   [x] 4. Verify smoke test passes without ReferenceError

## Notes

-   Smoke test no longer throws `ReferenceError: input_text is not defined` — fix confirmed.
-   Smoke test fails with a different error (`Cannot read properties of undefined (reading 'filePath')` in Agent node `agentAgentflow_1`) — this is a pre-existing infrastructure issue unrelated to the variable name fix, likely caused by the Agent node's self-referencing `selectedChatflow` tool in the test copy.
-   Two patches were needed: first for the funcBody fixes (accidentally wiped `inputParams`), second to restore `inputParams` UI metadata.
