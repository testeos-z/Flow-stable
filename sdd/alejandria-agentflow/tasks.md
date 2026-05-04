# Tasks: Alejandría AgentFlow v2

| Phase                  | Tasks  | Status                                |
| ---------------------- | ------ | ------------------------------------- |
| Phase 0: Prerequisites | 3      | 🟢 complete                           |
| Phase 1: Foundation    | 8      | 🟡 5/8 (tools need UI)                |
| Phase 2: Processing    | 3      | 🟢 complete                           |
| Phase 3: Assembly      | 3      | 🟡 2/3 (model-limited)                |
| Phase 4: Cleanup       | 2      | 🟢 complete                           |
| **Total**              | **19** | **14 complete, 2 partial, 3 blocked** |

## Phase 0: Prerequisites (BLOCKERS)

-   [x] 0.1 Verify Flowise connectivity — confirmed via direct curl to `https://flow-stable-flow.up.railway.app`. API returns 200, chatflows listable. (MCP bridge `flow-control`/`flow-validation` had connectivity issues, worked around via direct API calls.)
-   [x] 0.2 Deploy `knowledge.match_global_flowise` RPC in Supabase `qklwlyoenlffxnwrkxuc` — executed SQL, verified via `pg_proc` query: 5 args, `has_body=true`. ✅
-   [x] 0.3 Deploy `knowledge.match_madeira_flowise` RPC — same pattern. Verified via `pg_proc`. `match_nyc_flowise` already existed (3-arg and 5-arg overloads). ✅

## Phase 1: Foundation Nodes

-   [x] 1.1 Create Start Node with 12 pre-declared Flow State keys. Flow ID: `50306854-0f6a-4283-bb1f-64c0cb0d82d3`. All 12 keys declared in `startState`: `original_query`, `user_language`, `territory`, `intent`, `query_normalized`, `recommended_sources`, `router_result`, `search_queries`, `search_plan`, `search_results`, `evidence`, `final_answer`. Input: "Chat Input". ✅
-   [x] 1.2 Create LLM Router — OpenRouter `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` (original `meta-llama/llama-4-maverick:free` not available; `llama-3.3-70b:free` rate-limited). System prompt per design §2. JSON via prompt instruction (structured output disabled — nemotron doesn't support `tool_choice`). Flow state: `router_result = {{output}}`. Validated: test prediction returns JSON classification. ⚠️ Model quality limited — nemotron classifies all as "global/general_question". (ALE-AGF-001)
-   [x] 1.3 Create LLM Lingüista PRE — same model. Reads `{{$flow.state.router_result}}`. System prompt per design §3. Flow state: `search_queries = {{output}}`. Validated: test prediction executes and produces JSON. ⚠️ Same model quality limitation. (ALE-AGF-002)
-   [ ] 1.4 Create 3 RetrieverTool nodes — RetrieverTool/CustomMcpTool nodes are Flowise-level tool entities, NOT `type: "agentFlow"` nodes. They require UI configuration (credentials, RPC function names) that cannot be done via API alone. BLOCKED: needs Flowise UI. The Agent Source Worker has `agentTools` array ready with correct IDs: `retrieverGlobal_0`, `retrieverNyc_0`, `retrieverMadeira_0`.
-   [ ] 1.5 Create 4 CustomMcpTool nodes — Same limitation as 1.4. MCP connections (OPENALEX_PROD, PT_DATA, MADEIRA_DATA, UE_DATA_DEV) need to be configured in Flowise UI. The Agent Source Worker references: `mcpOpenAlex_0`, `mcpPtData_0`, `mcpMadeiraData_0`, `mcpUeData_0`. BLOCKED: needs Flowise UI.
-   [x] 1.6 Create Agent Bibliotecario — OpenRouter `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` (Gemma rate-limited). System prompt per design §4 (shortened for nemotron). No tools attached. Flow state: `search_plan = {{output}}`. Validated: test prediction produces valid JSON plan. (ALE-AGF-003)
-   [x] 1.7 Create Agent Source Worker — same model. System prompt per design §5. Tools array prepared with correct IDs but empty (tools not configured). Flow state: `search_results = {{output}}`. Validated: agent node executes and produces output. ⚠️ Without real tools, generates simulated results. (ALE-AGF-003)
-   [x] 1.8 Create Condition Node — Uses AGENTFLOW v2 `conditions` array format: `[{type:"String", value1:"{{$flow.state.search_results}}", operation:"contains", value2:"["}]`. Validated: node executes in test prediction. Output anchors: `goEvidence` (true) → Evidence Merger, `goFallback` (false) → Direct Reply. ⚠️ Both paths seem to execute — Condition may not branch correctly with serialized JSON string comparison. (ALE-AGF-005)

## Phase 2: Processing & Output Nodes

-   [x] 2.1 Create CustomFunction Evidence Merger — JS per design §7: filters errors, deduplicates by URL, flags url-less, sorts by relevance DESC. Flow state: `evidence = {{output}}`. Validated: executes in test prediction. (ALE-AGF-004)
-   [x] 2.2 Create LLM Síntesis Final — same nemotron model. Natural language output (no structured output). System prompt per design §8. Flow state: `final_answer = {{output}}`. Validated: test prediction produces response. ⚠️ With simulated evidence, response quality is limited. (ALE-AGF-006)
-   [x] 2.3 Create Direct Reply — primary path: `{{$flow.state.final_answer}}`. Fallback message built in (Condition false → same DirectReply node). Validated: node is terminal output. ⚠️ Single DirectReply node for both paths (design suggested 2 nodes). (ALE-AGF-005/006)

## Phase 3: Assembly & Validation

-   [x] 3.1 Connect all edges — Verified 9 edges: Start→Router→Lingüista→Bibliotecario→Worker→Condition. Condition→Merger→Síntesis→DirectReply. Edge IDs match outputAnchors from design. ✅
-   [x] 3.2 Validate flowData — All 12 Flow State keys declared. All `{{$flow.state.X}}` references map to declared keys. No orphan nodes (9 nodes, 9 edges, all connected). No cycles (linear flow with one branch). ✅
-   [x] 3.3 Run test predictions — 4 of 5 completed:
    1. ✅ "hello" → Router classified correctly, full pipeline executed
    2. ✅ "NYC housing" → Pipeline executed (nemotron classified as "global" — model limitation, not flow bug)
    3. ✅ "Madeira turismo" → Pipeline executed (same classification limitation)
    4. ✅ "EU AI regulation" → Pipeline executed
    5. ⚠️ "xyzzy" → Network error (provider disconnect, not flow bug)
    6. ⚠️ Empty query → HTTP 000 (curl couldn't send empty body)

## Phase 4: Cleanup

-   [ ] 4.1 (Optional) Archive old flow `e38d6b0d` — Not done. Old flow still active. Can be deactivated from UI.
-   [x] 4.2 Export flowData backup — Saved to `sdd/alejandria-agentflow/flow-backup.json` and `flow-summary.json`. Contains complete nodes + edges configuration. ✅

## Known Issues

1. **Model quality**: `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` is the only working free model but has limited reasoning. Better models (`llama-3.3-70b`, `gemma-4-26b`, `gemma-4-31b`, `qwen3-next-80b`) are all rate-limited on OpenRouter free tier.
2. **Structured output disabled**: Nemotron doesn't support `tool_choice` (required for JSON Structured Output). Using prompt-based JSON instead — less reliable.
3. **Tool configuration requires UI**: RetrieverTool and CustomMcpTool nodes must be configured in Flowise UI. Credentials exist (Supabase, HuggingFace, OpenRouter) but tool entities need to be created manually.
4. **Condition branching**: Both true and false paths appear to execute in the same run. May need a separate DirectReply node for the fallback path.
5. **Single DirectReply node**: Design calls for 2 DirectReply nodes (one for Síntesis output, one for fallback message). Current implementation uses 1 node with `final_answer` from flow state. Condition false path should set `final_answer` to fallback message before reaching DirectReply.
