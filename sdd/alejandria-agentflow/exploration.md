## Exploration: Alejandría AgentFlow v2 Recreation

### Current State

**Existing flow**: Flow ID `e38d6b0d-f50f-40c4-a244-90c94be88cd8`, named "Alejandria (Multi-Agent Knowledge Pipeline)", 14 nodes, deployed at `https://flow-stable-flow.up.railway.app`. The Flowise server is **currently unreachable** — we cannot inspect the existing flow JSON, list chatflows, or validate against the running instance. There is **no local backup or copy** of this flow stored anywhere in the repo.

**SDD context**: No prior SDD change for Alejandria exists. Four SDD changes exist in the repo: `archive/agentflow-validation-tools`, `auto-fix-flowdata`, `chatflow-diagnostic-tools`, and `flow-creation-agent-pipeline` (the most architecturally relevant — defines the Zod schema + specialist agent pipeline for Flow creation, but focuses on CHATFLOW nodes, not AGENTFLOW).

**Known flow architecture (from session memory)**: The existing flow uses Flowise 3.1.2 AgentFlow v2 node format. Cross-node references use node ID strings (e.g., `"llmModel": "chatOpenRouter_0"`), NOT `{{}}` template syntax. CHATFLOW-style tool nodes (CustomMcpServerTool, RetrieverTool) CAN be embedded inside AGENTFLOWs. `agentKnowledgeVSEmbeddings` is the native way to connect vector stores. `Update Flow State` uses `{{ output }}` and `{{ $flow.state.key }}` syntax.

**Existing infrastructure available**:

| Resource                  | Details                                                             |
| ------------------------- | ------------------------------------------------------------------- |
| OpenRouter credential     | `ddeb2757-f8e2-4ed7-9647-5a113332b432`                              |
| Supabase credential       | `0df85d26-749b-4fac-9a88-7399663a3099`                              |
| HuggingFace credential    | `aae7223f-da1b-47d5-bb26-1a2f1b2a3d5b`                              |
| Supabase project          | `qklwlyoenlffxnwrkxuc` (GoberAI-dev)                                |
| Embedding model           | `intfloat/multilingual-e5-large-instruct` (1024 dims)               |
| Tool-calling model (free) | `google/gemma-4-26b-a4b-it:free` (ONLY free model with toolCalling) |

### Affected Areas

| Area                                     | Why affected                                                                        |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `sdd/alejandria-agentflow/`              | New SDD change directory (proposal, spec, design, tasks)                            |
| `.agents/skills/flow-architect/`         | Design AGENTFLOW node layout, delegate to `flow-ing`                                |
| `.agents/skills/flowise-node-reference/` | Consulted for AGENTFLOW node compatibility rules                                    |
| `.agents/registry/credential-uuids.ts`   | Credential UUIDs for OpenRouter, Supabase, HuggingFace                              |
| `.agents/registry/model-capabilities.ts` | Model capabilities (toolCalling, free tier, etc.)                                   |
| `.agents/schemas/flow-data.ts`           | IReactFlowObject schema — currently CHATFLOW-centric (`type: customNode`)           |
| Supabase `knowledge` schema              | Vector stores: global (435K), nyc (18K), madeira (164K), europa (300), portugal (0) |
| RPC functions                            | `match_knowledge_global`, `match_knowledge_madeira` — **NOT Flowise-compatible**    |
| MCP tools                                | INTERNAL_RESEARCH, OPENALEX_PROD, PT_DATA, MADEIRA_DATA, UE_DATA_DEV                |
| Existing flow `e38d6b0d`                 | Target for modification or reference — unreachable during exploration               |

### CRITICAL: RPC Function Signature Compatibility Gap

The Flowise Supabase Vector Store node (used via Agent Node's `knowledge` config in AGENTFLOW) expects a specific named-parameter signature. From the previous bugfix (observation #704):

**Flowise-compatible signature**:

```sql
match_nyc_flowise(
    query_embedding vector,
    match_threshold double precision DEFAULT 0.0,
    match_count integer DEFAULT NULL,
    filter_document_id text DEFAULT NULL,
    filter jsonb DEFAULT '{}'
)
```

**Legacy signatures — NOT Flowise-compatible**:

```sql
-- These use positional params, different names
match_knowledge_global(match_count int, match_threshold float, metric text, query_embedding vector, filter_flow text)
match_knowledge_madeira(match_count int, match_threshold float, metric text, query_embedding vector, filter_flow text)
```

**Impact**: The `match_knowledge_global` and `match_knowledge_madeira` RPCs **cannot be used directly by Flowise**. The Flowise node will silently fail with empty results when connected to these RPCs. We MUST create Flowise-compatible wrapper RPCs (e.g., `match_global_flowise`, `match_madeira_flowise`) before those vector stores can be used in the AgentFlow.

### Approaches

#### 1. Modify existing flow `e38d6b0d` in-place

Update the existing 14-node flow with the target architecture (Option B: Multi-Agent Complete).

-   **Pros**: Preserves flow ID and history, no duplicate flows, incremental change
-   **Cons**: Cannot inspect current flow to understand what to keep/discard, risk of breaking existing flow during migration, server unreachable prevents validation
-   **Effort**: Low-Medium (once server is reachable)

#### 2. Create a NEW flow from scratch, keep existing as reference

Build the complete target architecture as a new AGENTFLOW `type` flow with 12 nodes. Keep `e38d6b0d` as a fallback/reference.

-   **Pros**: Clean start, full control over architecture, no risk of breaking existing, can develop spec/design independently of server availability
-   **Cons**: Two Alejandria flows may confuse users, need to validate entirely new flow on create
-   **Effort**: Medium (12 nodes, complex graph, but all from golden templates)

#### 3. Hybrid: Create new flow, migrate when server available

Create the AGENTFLOW design and spec now (while server is down). When server is accessible, inspect `e38d6b0d`, decide whether to migrate it or create new, then execute.

-   **Pros**: Progresses SDD phases (spec, design, tasks) independently of server, defers the migrate-vs-create decision until we have real data
-   **Cons**: May do duplicate work if existing flow is close to target; delays implementation
-   **Effort**: Medium (spec/design now, implementation later)

### Recommendation

**Approach 2 — Create from scratch** is recommended, with the following rationale:

1. **Server is unreachable**: We cannot inspect or modify `e38d6b0d` right now. Proceeding with SDD phases (proposal → spec → design → tasks) lets us make progress without blocking.

2. **The target architecture (Option B) is significantly different** from any plausible 14-node AgentFlow v2. The target has 9 dedicated processing nodes (Router, State, Lingüista PRE, Bibliotecario, Source Worker, Evidence Merger, Síntesis, Lingüista POST, DirectReply) plus Start, Update State, and potentially multiple MCP tool connections. The existing flow's 14 nodes may include CHATFLOW-style nodes that don't map cleanly to the new architecture.

3. **RPC gap MUST be solved first**: Before any flow can use `knowledge.global` or `knowledge.madeira` vector stores, we need Flowise-compatible RPC wrappers. This is a **blocker** that should be part of the implementation tasks (see Risks).

4. **Clean AGENTFLOW node set**: The target architecture uses AgentFlow-native nodes exclusively (Start, Agent, LLM, CustomFunction, Condition, DirectReply) — a clean, maintainable graph. Modifying an existing flow risks carrying over CHATFLOW compatibility workarounds.

**Recommended SDD phases**:

```
Phase 1 (now):    Proposal → Spec → Design → Task breakdown
Phase 2 (blocker): Create Flowise-compatible RPCs for global + madeira vector stores
Phase 3 (server):  Implement flow via flow-ing agent
Phase 4 (server):  Validate, test prediction, verify
Phase 5 (server):  (Optional) Deprecate/archive e38d6b0d if new flow succeeds
```

### Risks

| Risk                                                                                                                                                                                               | Impact                                                     | Mitigation                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RPC incompatibility** — match_knowledge_global and match_knowledge_madeira cannot be used by Flowise                                                                                             | BLOCKER — vector search broken for 2 of 3 stores           | Create `match_global_flowise` and `match_madeira_flowise` RPCs matching `match_nyc_flowise` signature. This is a Supabase migration task.                       |
| **Server unreachable** — cannot validate, create, or test flows                                                                                                                                    | Delays implementation indefinitely                         | Spec + design + tasks can be completed offline. Implementation executes when server is reachable.                                                               |
| **AGENTFLOW node schemas unknown** — Zod schemas and golden templates only cover CHATFLOW nodes (customNode type). AGENTFLOW nodes use different `type` values (e.g., "agentFlow" vs "customNode") | Zod validation may reject valid AGENTFLOW nodes            | The `agentflow-validation-tools` SDD change (archived) partially addresses this. Need to extract AGENTFLOW golden templates from an existing working AgentFlow. |
| **Embedding dimension mismatch** — HuggingFace `intfloat/multilingual-e5-large-instruct` produces 1024-dim vectors. Legacy RPCs (match_knowledge_v2, v3) may use different dimensions              | Search returns empty or wrong results                      | Stick to known-good RPCs (match_nyc_flowise, match_knowledge_global, match_knowledge_madeira). Verify dimensions before connecting.                             |
| **Only 1 free tool-calling model** — gemma-4-26b-a4b-it:free. If rate-limited or unavailable, agents with tools break                                                                              | Agent Nodes (Bibliotecario, Source Worker) fail at runtime | Keep non-tool nodes (LLM Router, Lingüista, Síntesis) on separate models; consider paid tier if free model is insufficient.                                     |
| **MCP tool transport** — INTERNAL_RESEARCH uses stdio (local process), other MCPs use HTTP. Flowise MCP tool nodes may not support stdio transport                                                 | INTERNAL_RESEARCH tools not available in Flowise           | Verify MCP transport compatibility before integrating. The CustomMcpTool node may only support HTTP/SSE transports.                                             |
| **Viewport stripped by MCP** — per flow-architect skill, the MCP server's Zod schema strips `viewport` from flowData when creating via API                                                         | Canvas may fail to render with default viewport            | Accept the workaround: `fixFlowData` injects default viewport. Not a blocking issue.                                                                            |

### Ready for Proposal

**Yes** — pending agreement on: (1) Create from scratch vs modify existing flow, (2) Whether to include RPC creation as part of this change or as a separate blocking task, (3) Confirmation that `google/gemma-4-26b-a4b-it:free` is acceptable as the primary tool-calling model.

### Key Decisions Needed Before Proceeding

1. **New flow vs modify**: Confirm Approach 2 (create from scratch). The target architecture is substantially different and server is down.
2. **RPC fix scope**: Should creating `match_global_flowise` and `match_madeira_flowise` be part of this SDD change (implementation task) or a separate prerequisite?
3. **Model strategy**: Mixed models for different nodes? Router/Lingüista/Síntesis (no tools) can use cheaper models; Bibliotecario/Source Worker (tools required) MUST use gemma-4-26b-a4b-it:free.
4. **MCP tool transport**: Verify that stdio-based MCPs (INTERNAL_RESEARCH) work with Flowise AgentFlow. HTTP-based MCPs (OPENALEX_PROD, PT_DATA, MADEIRA_DATA, UE_DATA_DEV) should work via CustomMcpTool nodes.
5. **Language directive**: The target architecture includes Lingüista PRE/POST and language detection. Should this use Update Flow State (`$flow.state`) to pass detected language through the pipeline?
