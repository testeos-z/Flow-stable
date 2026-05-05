# Alejandria v2 Save Flow - Implementation Notes

## Context

-   Broken flow: 011c1e9d-a34c-433c-aead-ff0578dd54a9 (missing tools, wrong models)
-   Backup source: 50306854-0f6a-4283-bb1f-64c0cb0d82d3 (validated structure)
-   New flow target: "alejandria-v2-save" (17 nodes, 16 edges, updated models)

## Current Status

✅ **Phase 1: Foundation** - COMPLETE

-   Backup flow fetched and validated
-   10 nodes + 9 edges confirmed
-   12 state keys verified

⏳ **Phases 2-7: Ready for Execution**

-   Task structure: 44 total tasks documented
-   Model changes: 5 nodes requiring model updates
-   Tools: 7 tool nodes defined (3 Retriever + 4 MCP)
-   Tests: 11 test cases defined with Gemini→Sonnet escalation path

## Execution Path (Phases 2-7)

### Phase 2: Tool Creation

Build 7 tool node definitions and create edges to Source Worker

### Phase 3: Configuration Fixes

Apply model changes:

-   Router: Gemini 2.0 Flash
-   Lingüista: Claude Haiku
-   Bibliotecario: Gemini 2.0 Flash
-   **Source Worker: Claude Sonnet 4.5** ⚠️ CRITICAL
-   Síntesis: Claude Sonnet

### Phase 4-5: Assembly & Deployment

-   Merge 10+7 nodes, 9+7 edges
-   Add viewport
-   Validate with flow-control_validate_agentflow
-   Create with flow-control_create_chatflow
-   Repair viewport with flow-control_repair_chatflow

### Phase 6: Testing

11 tests including Gemini tool-calling escalation path:

-   If Gemini works → Continue
-   If Gemini fails → Switch to Sonnet, re-test

### Phase 7: Production Cutover

-   Report results to user
-   Ask approval to replace broken flow
-   Delete old flow if approved

## Key Decisions

1. **Source Worker Model**: Trying Gemini 2.0 Flash first (cost), escalate to Sonnet if tool-calling fails
2. **Viewport Injection**: Using repair_chatflow after creation (API limitation)
3. **Rollback**: Backup untouched, new flow can be deleted if tests fail

## Next Action

Execute Phases 2-7 implementation script to build and deploy flow.
