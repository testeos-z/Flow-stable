# Tasks: Fix Alejandria v2 Save Flow

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

| Field                   | Value                                       |
| ----------------------- | ------------------------------------------- |
| Estimated changed lines | ~150-200 (mostly JSON config, minimal code) |
| 400-line budget risk    | Low                                         |
| Chained PRs recommended | No                                          |
| Suggested split         | Single PR                                   |
| Delivery strategy       | auto-chain                                  |
| Chain strategy          | single-pr                                   |

### Suggested Work Units

| Unit | Goal                                            | Likely PR | Notes                           |
| ---- | ----------------------------------------------- | --------- | ------------------------------- |
| 1    | Clone backup, inject tools, validate, save flow | PR 1      | Complete restoration with tests |

---

## Phase 1: Foundation — Backup Clone & Structure Validation

-   [x] 1.1 Read backup flow `50306854-0f6a-4283-bb1f-64c0cb0d82d3` via `flow-control_get_chatflow`
-   [x] 1.2 Extract `flowData.nodes` (10 nodes) and `flowData.edges` (9 edges) from backup JSON
-   [x] 1.3 Validate backup structure: Start node present, DirectReply nodes present, no orphans
-   [x] 1.4 Parse all node IDs and identify: Router, Lingüista, Bibliotecario, Source Worker, Síntesis

---

## Phase 2: Tool Creation — 7 Tool Nodes

### RetrieverTools (3)

-   [ ] 2.1 Create `retrieverTool_0` (search_global_knowledge) with RPC `match_global_flowise`, embedding `intfloat/multilingual-e5-large-instruct`, Supabase credential `0df85d26`, topK=5
-   [ ] 2.2 Create `retrieverTool_1` (search_nyc_knowledge) with RPC `match_nyc_flowise`, same embedding/credential
-   [ ] 2.3 Create `retrieverTool_2` (search_madeira_knowledge) with RPC `match_madeira_flowise`, same embedding/credential

### CustomMcpTools (4)

-   [ ] 2.4 Create `customMcpTool_0` (OPENALEX_PROD) with URL `https://open-alex-mcp-dev.up.railway.app/mcp`
-   [ ] 2.5 Create `customMcpTool_1` (PT_DATA) with URL `https://pt-data.up.railway.app/mcp`
-   [ ] 2.6 Create `customMcpTool_2` (MADEIRA_DATA) with URL `https://madeira-data.up.railway.app/mcp`
-   [ ] 2.7 Create `customMcpTool_3` (UE_DATA_DEV) with URL `https://ue-data-dev.up.railway.app/mcp`

### Tool Edges (7)

-   [ ] 2.8 Create 7 edges from all tool nodes → `agentAgentflow_1-input-agentTools-Tool`

---

## Phase 3: Configuration Fixes — 8 Fixes to Existing Nodes

### Router (llmAgentflow_0)

-   [ ] 3.1 Fix `inputs.state`: flatten nested object to individual keys (original_query, user_language, territory, intent, etc.)
-   [ ] 3.2 Update `inputs.systemMessage`: add Spanish territory detection examples ("Madrid" → ES, "Funchal" → Madeira)

### Lingüista (llmAgentflow_1)

-   [ ] 3.3 Change `inputs.modelName` from `deepseek/deepseek-v4-flash` to `anthropic/claude-3-5-haiku`
-   [ ] 3.4 Verify `credential` field points to OpenRouter UUID `ddeb2757-f8e2-4ed7-9647-5a113332b432`

### Source Worker (agentAgentflow_1) ⚠️ CRITICAL

-   [ ] 3.5 Change `inputs.modelName` from `minimax/minimax-m2.5` to `anthropic/claude-sonnet-4.5`
-   [ ] 3.6 Update `inputs.agentTools` from `[]` to array of 7 tool references: `{{retrieverTool_0.data.instance}}`, ..., `{{customMcpTool_3.data.instance}}`
-   [ ] 3.7 Update `inputs.systemMessage`: add source→tool mapping table (NYC → search_nyc + mcpPtData, Madeira → search_madeira + mcpMadeiraData, etc.)

### Síntesis (llmAgentflow_2)

-   [ ] 3.8 Change `inputs.modelName` from `deepseek/deepseek-v4-flash` to `anthropic/claude-3-5-sonnet`

---

## Phase 4: Integration — Assemble & Validate flowData

-   [ ] 4.1 Merge backup nodes (10) + tool nodes (7) → 17 nodes total
-   [ ] 4.2 Merge backup edges (9) + tool edges (7) → 16 edges total
-   [ ] 4.3 Add viewport `{x: 0, y: 0, zoom: 1}` to flowData
-   [ ] 4.4 Run `flow-control_validate_agentflow(flowData)` — must pass structure + graph checks
-   [ ] 4.5 If validation fails → fix errors (orphan nodes, missing edges, credential UUIDs)

---

## Phase 5: Deployment — Save & Repair

-   [ ] 5.1 Create new flow via `flow-control_create_chatflow(name: "alejandria-v2-save", flowData, type: "AGENTFLOW")`
-   [ ] 5.2 Capture returned `chatflowId`
-   [ ] 5.3 Run `flow-control_repair_chatflow(chatflowId)` to inject viewport directly to database
-   [ ] 5.4 Verify flow in Flowise UI: check canvas loads without errors

---

## Phase 6: Testing — 6-Layer Validation Pipeline

### Structural Validation (already done in 4.4)

-   [ ] 6.1 Confirm no validation errors from Phase 4

### Smoke Test

-   [ ] 6.2 Run `flow-control_create_prediction(chatflowId, question: "Hello")` — must return 200 without crash
-   [ ] 6.3 Verify response contains fallback message OR router acknowledgment (no empty/error response)

### Tool Calling Test

-   [ ] 6.4 Run prediction with real query: "What are NYC housing policies?"
-   [ ] 6.5 Inspect prediction metadata → verify `calledTools` array contains at least one RetrieverTool or MCP tool
-   [ ] 6.6 Verify response is not empty and contains citations or source references

### Branching Test (TRUE path)

-   [ ] 6.7 Use query from 6.4 → verify flow reached `directReplyAgentflow_0` (success path with evidence)

### Branching Test (FALSE path)

-   [ ] 6.8 Run prediction with nonsense query: "xyzzy" → verify fallback message "No relevant information found"
-   [ ] 6.9 Verify flow reached `directReplyAgentflow_1` (fallback path)

### Integration Test (Multi-Territory)

-   [ ] 6.10 Test Madeira query (Spanish): "¿Cuáles son las políticas de turismo en Madeira?"
-   [ ] 6.11 Verify response in Spanish, contains Madeira-specific data
-   [ ] 6.12 Test EU query (English): "How does the EU regulate AI?" — verify EU sources used

---

## Phase 7: Production Cutover (Manual Decision)

-   [ ] 7.1 Document new flow ID in project README or flow registry
-   [ ] 7.2 Update references from backup ID `50306854` to new production ID
-   [ ] 7.3 Archive backup flow (keep for rollback) — DO NOT delete
-   [ ] 7.4 Monitor first 10 production queries for errors, cost, and quality

---

**Total Tasks**: 41  
**Estimated Time**: 2-3 sessions (most time in tool creation + testing)  
**Critical Path**: Phase 3 (Source Worker model change) → Phase 6 (tool calling test)
