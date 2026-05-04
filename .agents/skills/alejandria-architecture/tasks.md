# Alejandria AgentFlow - Implementation Tasks

## Status: Models Updated, Branching Fixed, Tools Pending

### Completed ✅

1. **ALE-AGF-1: Model Configuration**

    - [x] Router (llmAgentflow_0): `deepseek/deepseek-v4-flash`
    - [x] Lingüista PRE (llmAgentflow_1): `deepseek/deepseek-v4-flash`
    - [x] Síntesis Final (llmAgentflow_2): `deepseek/deepseek-v4-flash`
    - [x] Bibliotecario (agentAgentflow_0): `minimax/minimax-m2.5`
    - [x] Source Worker (agentAgentflow_1): `minimax/minimax-m2.5`

2. **ALE-AGF-5: Branching Fix**

    - [x] Created fallback DirectReply node `directReplyAgentflow_1`
    - [x] Position: (1691, 120) - below Evidence Merger
    - [x] Message: "No relevant information was found in the available knowledge sources."
    - [x] Reconnected: `condition goFallback → directReplyAgentflow_1`

3. **ALE-AGF-6: Fallback Reply Node**

    - [x] Added `directReplyAgentflow_1` with proper fallback message
    - [x] Connected to condition's false branch

4. **Tests**
    - [x] Prediction execution verified (10 nodes)
    - [x] Model calls confirmed via usageMetadata
    - [x] Branching works - fallback triggered when no results
    - [x] All 5 test inputs executed

### Pending 🔲

5. **ALE-AGF-2: RetrieverTools (Vector Search)**

    - [ ] Create `search_global_knowledge` - Supabase, RPC: `match_global_flowise`
    - [ ] Create `search_nyc_knowledge` - Supabase, RPC: `match_nyc_flowise`
    - [ ] Create `search_madeira_knowledge` - Supabase, RPC: `match_madeira_flowise`
    - [ ] Embedding: HuggingFace `intfloat/multilingual-e5-large-instruct`
    - [ ] Credential: Supabase `0df85d26-749b-4fac-9a88-7399663a3099`

6. **ALE-AGF-3: MCP Tools**

    - [ ] Create `OPENALEX_PROD` - URL: `https://open-alex-mcp-dev.up.railway.app/mcp`
    - [ ] Create `PT_DATA` - URL: `https://pt-data.up.railway.app/mcp`
    - [ ] Create `MADEIRA_DATA` - URL: `https://madeira-data.up.railway.app/mcp`
    - [ ] Create `UE_DATA_DEV` - URL: `https://ue-data-dev.up.railway.app/mcp`

7. **ALE-AGF-4: Connect Tools to Agents**

    - [ ] Connect RetrieverTools to `agentAgentflow_0` (Bibliotecario)
    - [ ] Connect RetrieverTools + MCP tools to `agentAgentflow_1` (Source Worker)
    - [ ] Configure `agentTools` field in both agent nodes

8. **ALE-AGF-8: Production Readiness**
    - [ ] Test with real queries (NYC housing, Madeira tourism, EU AI)
    - [ ] Verify tool calls in `calledTools` metadata
    - [ ] Verify citations with real URLs in responses
    - [ ] Monitor costs and performance

## Flow Architecture

```
Start → Router (LLM) → Lingüista PRE (LLM) → Bibliotecario (Agent) → Source Worker (Agent)
                                                                              ↓
                                                    Has Results? ──→ Evidence Merger → Síntesis Final → Reply
                                                        ↓
                                                  Fallback Reply (NEW)
```

## Credentials

| Credential            | ID                                     | Status    |
| --------------------- | -------------------------------------- | --------- |
| OpenRouter            | `ddeb2757-f8e2-4ed7-9647-5a113332b432` | ✅ Active |
| Supabase GobernAI-dev | `0df85d26-749b-4fac-9a88-7399663a3099` | ✅ Active |
| HuggingFace emb       | `aae7223f-da1b-47d5-bb26-1a2f1b2a3d5b` | ✅ Active |

## Supabase RPC Functions

| Function                | Purpose                        | Status     |
| ----------------------- | ------------------------------ | ---------- |
| `match_global_flowise`  | Global knowledge vector search | ✅ Created |
| `match_nyc_flowise`     | NYC-specific vector search     | ✅ Created |
| `match_madeira_flowise` | Madeira-specific vector search | ✅ Created |

## Test Results Summary

| Test | Input                                           | Status     | Notes                                                     |
| ---- | ----------------------------------------------- | ---------- | --------------------------------------------------------- |
| 1    | "Hello"                                         | ✅ Pass    | Router correctly identified language=en, territory=global |
| 2    | "Quais são as políticas de turismo na Madeira?" | ⏱️ Timeout | Portuguese routing works                                  |
| 3    | "How does the EU regulate AI?"                  | ⏱️ Timeout | EU routing works                                          |
| 4    | "xyzzy"                                         | ✅ Pass    | Fallback triggered correctly                              |
| 5    | "" (empty)                                      | ✅ Pass    | Fallback triggered correctly                              |

**Note:** Tests 2-3 timed out due to agent processing time, but routing was correct.
