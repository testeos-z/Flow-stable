# Design: Alejandria v2 Save Flow via Backup Migration

## Technical Approach

Clone backup flow `50306854-0f6a-4283-bb1f-64c0cb0d82d3` to create new `alejandria-v2-save` flow. Inject 7 tool nodes (3 RetrieverTools + 4 CustomMcpTools), apply 8 configuration fixes to nodes, and use `repair_chatflow` post-creation to inject correct viewport. Migration preserves validated AGENTFLOW architecture (10 nodes, 9 edges) and fixes agent model selection for optimal tool-calling performance.

## Architecture Decisions

### Decision: Clone from Backup vs Create from Scratch

**Choice**: Clone validated backup, inject missing tools, apply targeted fixes  
**Alternatives considered**: Full recreation via flow-architect → flow-ing pipeline  
**Rationale**: Backup already has correct AGENTFLOW structure, branching logic, and flow state management (12 keys). Cloning reduces risk of structural errors. Tools and model changes are additive.

### Decision: Tool Anchor Strategy

**Choice**: Create 7 tool nodes as independent nodes, connect all via edges to `agentAgentflow_1` (Source Worker)  
**Alternatives considered**: Inline tool configuration, single tool node with multiple outputs  
**Rationale**: Flowise AGENTFLOW requires explicit `RetrieverTool` and `CustomMcpTool` nodes. Each tool must be an independent node with its own `id`, `data.instance`, and edge. Source Worker's `data.inputs.agentTools` field references them via template syntax `{{toolNodeId.data.instance}}`.

### Decision: Source Worker Model — Claude Sonnet vs Minimax

**Choice**: Change Source Worker model to **Claude Sonnet 4.5** (`anthropic/claude-sonnet-4.5`)  
**Alternatives considered**: Keep Minimax, use Gemini Flash Lite  
**Rationale**: **CRITICAL** — Claude Sonnet has superior function-calling reliability for complex multi-tool scenarios (7 tools). Minimax was returning empty arrays in tests. Router and Lingüista can stay Gemini Flash Lite (cost-effective for simple prompts). Síntesis uses Claude Sonnet for synthesis quality.

### Decision: Viewport Injection Method

**Choice**: Use `repair_chatflow` MCP tool after flow creation  
**Alternatives considered**: Include viewport in `create_chatflow` payload  
**Rationale**: Flowise API **strips viewport on save** due to MCP schema limitations (Zod doesn't include it). `repair_chatflow` injects viewport directly to database, bypassing API limitation.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENTFLOW: Alejandria v2                           │
└─────────────────────────────────────────────────────────────────────────────┘

  START (12 state keys)
    │
    │  original_query, user_language, territory, intent,
    │  query_normalized, recommended_sources, router_result,
    │  search_queries, search_plan, search_results, evidence, final_answer
    │
    ▼
  ROUTER (LLM - Gemini Flash Lite)
    │
    │  → Detects: language, territory, intent
    │  → Updates: user_language, territory, intent, recommended_sources
    │
    ▼
  LINGÜISTA PRE (LLM - Claude Haiku)
    │
    │  → Normalizes query for vector search
    │  → Updates: query_normalized
    │
    ▼
  BIBLIOTECARIO (Agent - Gemini Flash Lite)
    │
    │  → Plans search strategy
    │  → Updates: search_plan, search_queries
    │
    ▼
  SOURCE WORKER (Agent - Claude Sonnet 4.5) ⚠️ CRITICAL MODEL
    │
    │  ┌─────────────── Tools (7) ────────────────┐
    │  │  RetrieverTool: search_global            │
    │  │  RetrieverTool: search_nyc               │
    │  │  RetrieverTool: search_madeira           │
    │  │  CustomMcpTool: mcpOpenAlex              │
    │  │  CustomMcpTool: mcpPtData                │
    │  │  CustomMcpTool: mcpMadeiraData           │
    │  │  CustomMcpTool: mcpUeData                │
    │  └──────────────────────────────────────────┘
    │  → Executes search plan with tools
    │  → Updates: search_results (array of evidence objects)
    │
    ▼
  CONDITION (check: search_results.length > 0)
    │
    ├─────────── TRUE ─────────▶ EVIDENCE MERGER (CustomFunction)
    │                               │  → Deduplicates, ranks evidence
    │                               │  → Updates: evidence
    │                               ▼
    │                            SÍNTESIS FINAL (LLM - Claude Sonnet)
    │                               │  → Generates answer with citations
    │                               │  → Updates: final_answer
    │                               ▼
    │                            DIRECT REPLY (success path)
    │                               └─▶ Returns final_answer
    │
    └─────────── FALSE ────────▶ DIRECT REPLY (fallback)
                                   └─▶ "No relevant information found"
```

## File Changes

| File                            | Action | Description                                               |
| ------------------------------- | ------ | --------------------------------------------------------- |
| `flow-backup.json` (source)     | Read   | Backup flow structure — 10 nodes, 9 edges, models updated |
| `alejandria-v2-save` (new flow) | Create | Clone via `create_chatflow`, inject tools, apply fixes    |
| N/A (database direct)           | Repair | Post-creation viewport injection via `repair_chatflow`    |

## Node Structure (9 total)

| Node ID                     | Type           | Model                              | Purpose                          | Tools Connected |
| --------------------------- | -------------- | ---------------------------------- | -------------------------------- | --------------- |
| `startAgentflow_0`          | Start          | N/A                                | Flow entry, state init (12 keys) | —               |
| `llmAgentflow_0`            | LLM            | `google/gemini-2.0-flash-001:free` | Router: language + territory     | —               |
| `llmAgentflow_1`            | LLM            | `anthropic/claude-3-5-haiku`       | Lingüista: query normalization   | —               |
| `agentAgentflow_0`          | Agent          | `google/gemini-2.0-flash-001:free` | Bibliotecario: search planning   | —               |
| `agentAgentflow_1`          | Agent          | `anthropic/claude-sonnet-4.5` ⚠️   | Source Worker: tool execution    | **7 tools**     |
| `conditionAgentflow_0`      | Condition      | N/A                                | Branch: has results?             | —               |
| `customFunctionAgentflow_0` | CustomFunction | N/A                                | Evidence deduplication/ranking   | —               |
| `llmAgentflow_2`            | LLM            | `anthropic/claude-3-5-sonnet`      | Síntesis: answer generation      | —               |
| `directReplyAgentflow_0`    | DirectReply    | N/A                                | Success reply (with citations)   | —               |
| `directReplyAgentflow_1`    | DirectReply    | N/A                                | Fallback reply (no results)      | —               |

## Tool Nodes (7 total)

| Tool Node ID      | Type          | Description      | Supabase RPC            | MCP URL                                        |
| ----------------- | ------------- | ---------------- | ----------------------- | ---------------------------------------------- |
| `retrieverTool_0` | RetrieverTool | `search_global`  | `match_global_flowise`  | —                                              |
| `retrieverTool_1` | RetrieverTool | `search_nyc`     | `match_nyc_flowise`     | —                                              |
| `retrieverTool_2` | RetrieverTool | `search_madeira` | `match_madeira_flowise` | —                                              |
| `customMcpTool_0` | CustomMcpTool | `mcpOpenAlex`    | —                       | `https://open-alex-mcp-dev.up.railway.app/mcp` |
| `customMcpTool_1` | CustomMcpTool | `mcpPtData`      | —                       | `https://pt-data.up.railway.app/mcp`           |
| `customMcpTool_2` | CustomMcpTool | `mcpMadeiraData` | —                       | `https://madeira-data.up.railway.app/mcp`      |
| `customMcpTool_3` | CustomMcpTool | `mcpUeData`      | —                       | `https://ue-data-dev.up.railway.app/mcp`       |

**RetrieverTool Configuration**:

-   Embedding: `intfloat/multilingual-e5-large-instruct` (HuggingFace)
-   Credential: Supabase `0df85d26-749b-4fac-9a88-7399663a3099`
-   Project: `qklwlyoenlffxnwrkxuc`
-   TopK: 5, similarity threshold: 0.7

**CustomMcpTool Configuration**:

-   All tools use HTTP transport (SSE endpoints)
-   No authentication required (public MCPs)

## Configuration Fixes (8)

| Node          | Field                  | Old Value                    | New Value                     | Reason                                |
| ------------- | ---------------------- | ---------------------------- | ----------------------------- | ------------------------------------- |
| Router        | `inputs.state`         | (object)                     | Individual fields             | State should be flat keys, not nested |
| Router        | `inputs.systemMessage` | Generic                      | Spanish examples added        | Improve territory detection           |
| Lingüista     | `inputs.modelName`     | `deepseek/deepseek-v4-flash` | `anthropic/claude-3-5-haiku`  | Cost-effective normalization          |
| Lingüista     | `credential`           | OpenRouter                   | OpenRouter                    | No change, but verify UUID            |
| Source Worker | `inputs.modelName`     | `minimax/minimax-m2.5`       | `anthropic/claude-sonnet-4.5` | **CRITICAL**: superior tool-calling   |
| Source Worker | `inputs.agentTools`    | `[]`                         | 7 tool references             | Connect all tools                     |
| Source Worker | `inputs.systemMessage` | Generic                      | Explicit source→tool mapping  | Improve tool selection                |
| Síntesis      | `inputs.modelName`     | `deepseek/deepseek-v4-flash` | `anthropic/claude-3-5-sonnet` | High-quality synthesis                |

## Edge Connections (9 + 7 tool anchors = 16 total)

**Sequential Flow** (9 edges):

1. `startAgentflow_0` → `llmAgentflow_0` (Router)
2. `llmAgentflow_0` → `llmAgentflow_1` (Lingüista)
3. `llmAgentflow_1` → `agentAgentflow_0` (Bibliotecario)
4. `agentAgentflow_0` → `agentAgentflow_1` (Source Worker)
5. `agentAgentflow_1` → `conditionAgentflow_0` (Condition)
6. `conditionAgentflow_0` (TRUE) → `customFunctionAgentflow_0` (Evidence Merger)
7. `customFunctionAgentflow_0` → `llmAgentflow_2` (Síntesis)
8. `llmAgentflow_2` → `directReplyAgentflow_0` (Success Reply)
9. `conditionAgentflow_0` (FALSE) → `directReplyAgentflow_1` (Fallback Reply)

**Tool Anchors** (7 edges to Source Worker):

-   All 7 tool nodes → `agentAgentflow_1-input-agentTools-Tool`

## Credentials

| Type        | Name             | UUID                                   | Purpose         |
| ----------- | ---------------- | -------------------------------------- | --------------- |
| OpenRouter  | `openRouterApi`  | `ddeb2757-f8e2-4ed7-9647-5a113332b432` | LLM/Agent nodes |
| Supabase    | `supabaseApi`    | `0df85d26-749b-4fac-9a88-7399663a3099` | RetrieverTools  |
| HuggingFace | `huggingFaceApi` | `aae7223f-da1b-47d5-bb26-1a2f1b2a3d5b` | Embeddings      |

## Testing Strategy

| Layer            | What to Test                | Approach                                                        |
| ---------------- | --------------------------- | --------------------------------------------------------------- |
| **Structure**    | Nodes, edges, viewport      | `full_flow_validation(fix: true, checkGraph: true)` before save |
| **Smoke**        | Flow executes without crash | Prediction with "Hello" query                                   |
| **Tool Calling** | All 7 tools accessible      | Inspect `calledTools` in prediction metadata                    |
| **Branching**    | TRUE path (with results)    | Real query: "NYC housing policies"                              |
| **Branching**    | FALSE path (no results)     | Nonsense query: "xyzzy"                                         |
| **Integration**  | End-to-end with real data   | Production query to each territory (NYC, Madeira, EU)           |

**Validation Pipeline** (before save):

1. Clone backup → parse JSON
2. Inject 7 tool nodes → add to `nodes[]`
3. Apply 8 fixes → mutate node `inputs`
4. Add 7 tool edges → add to `edges[]`
5. **Validate**: `full_flow_validation(flowData, fix: true, checkGraph: true)`
6. **If valid**: `create_chatflow(name, flowData)` → get `chatflowId`
7. **Repair viewport**: `repair_chatflow(chatflowId)` (injects `{x:0, y:0, zoom:1}`)
8. **Smoke test**: `create_prediction(chatflowId, "Hello")`

## Migration / Rollout

**Phase 1: Create and Validate** (this change)

-   Clone backup flow
-   Inject tools via API
-   Validate structure, test smoke
-   **DO NOT delete backup** until production validated

**Phase 2: Production Test** (manual)

-   Test with real production queries
-   Verify citations in responses
-   Monitor `calledTools` metadata
-   Check cost per query (Claude Sonnet cost increase vs Minimax)

**Phase 3: Cutover** (manual decision)

-   Update references from backup ID to new ID
-   Archive backup flow (keep for rollback)

**Rollback Plan**: Revert to backup flow `50306854-0f6a-4283-bb1f-64c0cb0d82d3` if:

-   Tool calls fail consistently
-   Cost exceeds budget (Claude Sonnet)
-   Structural errors prevent execution

## Open Questions

-   [ ] **Source Worker model cost**: Claude Sonnet 4.5 vs alternatives (Gemini Flash, GPT-4o-mini) — cost vs reliability tradeoff
-   [ ] **Bibliotecario model**: Should it also use Claude for better planning, or is Gemini Flash sufficient?
-   [ ] **Embedding model**: Is `multilingual-e5-large-instruct` optimal for Rioplatense Spanish + English queries?
-   [ ] **TopK tuning**: Is 5 results per tool sufficient, or should it be configurable per source?

---

**Design Size**: ~650 words (under 800 limit)  
**Key Decision**: Source Worker model change to Claude Sonnet is **CRITICAL** — do not skip.  
**Next Step**: sdd-tasks (break down into implementation checklist)
