# Proposal: Alejandría AgentFlow v2 Recreation

## Intent

Recrear "Alejandría" — el pipeline multi-agente de búsqueda de conocimiento — como un AgentFlow v2 completo en Flowise 3.1.2, usando arquitectura **Option B: Multi-Agent Complete**. El flow existente (`e38d6b0d-f50f-40c4-a244-90c94be88cd8`) se mantiene como referencia; se construye desde cero con búsqueda vectorial multi-territorio (global, nyc, madeira), detección de idioma, traducción, merge de evidencia con citas, y paso de estado entre nodos vía `$flow.state`.

## Scope

### In Scope

-   Nuevo AgentFlow de 9 nodos: Router → Lingüista PRE → Bibliotecario → Source Worker → Evidence Merger → Síntesis Final, con UpdateFlowState y Condition nodes
-   RPCs Flowise-compatible: `match_global_flowise` y `match_madeira_flowise` (wrappers sobre knowledge.global y knowledge.madeira)
-   Estrategia de modelos mixta: modelos gratuitos sin toolCalling para Router/Lingüista/Síntesis; `google/gemma-4-26b-a4b-it:free` (único gratuito con toolCalling) para Agent nodes
-   Paso de estado entre nodos: `router_result`, `search_queries`, `search_plan`, `search_results`, `evidence`, `final_answer`
-   CustomFunction Evidence Merger: deduplicación por URL, ranking por relevance, validación de citas
-   Verificación de compatibilidad MCP stdio (INTERNAL_RESEARCH) antes de integrar

### Out of Scope

-   Memoria multi-turno (MVP: single query/response)
-   Autenticación de usuarios / sesiones
-   Búsqueda paralela multi-territorio en una sola llamada
-   Streaming SSE (DirectReply puede soportarlo nativamente)
-   Modificación del flow `e38d6b0d`

## Capabilities

### New Capabilities

-   `alejandria-agentflow`: Pipeline AgentFlow v2 — detección de idioma/territorio/intent, traducción de queries, búsqueda vectorial multi-store coordinada por agents, merge de evidencia con citas, síntesis final en idioma del usuario
-   `flowise-rpc-global`: RPC `match_global_flowise` con firma Flowise-compatible para Supabase knowledge.global
-   `flowise-rpc-madeira`: RPC `match_madeira_flowise` con firma Flowise-compatible para Supabase knowledge.madeira

### Modified Capabilities

-   None (nuevo flow, nuevos RPCs; nada existente se modifica)

## Approach

**Create from scratch** (Approach 2/3 hybrid). El servidor Flowise está inaccesible — las fases SDD (proposal → spec → design → tasks) avanzan offline. La implementación se ejecuta cuando el servidor esté disponible.

**AgentFlow v2 pipeline (9 nodos)**:

```
Start (input: user query)
  → LLM Router (JSON output: language, territory, intent, query_normalized, recommended_sources)
  → UpdateFlowState (router_result)
  → LLM Lingüista PRE (translate to source languages if needed)
  → UpdateFlowState (search_queries)
  → Agent Bibliotecario (coordinador: plan de búsqueda via vector stores)
  → UpdateFlowState (search_plan)
  → Agent Source Worker (ejecución: RetrieverTools + MCP tools)
  → UpdateFlowState (search_results)
  → Condition (isNotEmpty → Evidence Merger | isEmpty → "no data found")
  → CustomFunction Evidence Merger (dedup, rank, validate citations)
  → UpdateFlowState (evidence)
  → LLM Síntesis Final (synthesize with citations, in user language)
  → DirectReply
```

**Modelos por nodo**:

| Node                | Model                              | Reason                        |
| ------------------- | ---------------------------------- | ----------------------------- |
| LLM Router          | `meta-llama/llama-4-maverick:free` | No tools, classification only |
| LLM Lingüista PRE   | `meta-llama/llama-4-maverick:free` | No tools, translation only    |
| Agent Bibliotecario | `google/gemma-4-26b-a4b-it:free`   | Tool calling required         |
| Agent Source Worker | `google/gemma-4-26b-a4b-it:free`   | Tool calling required         |
| LLM Síntesis Final  | `meta-llama/llama-4-maverick:free` | No tools, synthesis only      |

**Fases**:

1. Proposal → Spec → Design → Tasks (ahora, offline)
2. Crear RPCs Flowise-compatible para global + madeira (bloqueante)
3. Implementar flow vía flow-ing agent (cuando servidor accesible)
4. Validar, test prediction, verificar
5. (Opcional) Deprecar `e38d6b0d`

## Affected Areas

| Area                                     | Impact    | Description                                          |
| ---------------------------------------- | --------- | ---------------------------------------------------- |
| `sdd/alejandria-agentflow/`              | New       | SDD change artifacts                                 |
| Supabase `knowledge` schema              | New       | RPCs `match_global_flowise`, `match_madeira_flowise` |
| `.agents/registry/model-capabilities.ts` | Reference | Model selection constraints                          |
| `.agents/registry/credential-uuids.ts`   | Reference | UUIDs: OpenRouter, Supabase, HuggingFace             |
| `.agents/skills/flow-architect/`         | Reference | AGENTFLOW design patterns                            |
| Flowise (remote)                         | New       | AgentFlow creation via API                           |

## Risks

| Risk                                                               | Likelihood | Mitigation                                                                                         |
| ------------------------------------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------- |
| RPC incompatibility — stores global/madeira no usables por Flowise | High       | Crear wrappers como Phase 2 (task de implementación)                                               |
| Servidor Flowise inaccesible                                       | High       | Fases 1–2 completadas offline; implementación cuando servidor vuelva                               |
| Único modelo gratuito con toolCalling — rate limiting en Gemma     | Medium     | Nodos sin tools usan modelos alternativos; considerar tier pago si rate-limited                    |
| MCP stdio no soportado en Flowise (INTERNAL_RESEARCH)              | Medium     | Verificar compatibilidad antes de integrar; HTTP MCPs (OPENALEX, PT_DATA, etc.) deberían funcionar |
| AGENTFLOW node schemas no cubiertos por Zod validators             | Low        | Extraer golden templates de AgentFlow existente                                                    |
| Viewport stripped por MCP al crear vía API                         | Low        | `fixFlowData` injecta viewport default; no bloqueante                                              |

## Rollback Plan

1. Eliminar el nuevo flow de Flowise vía API (no afecta `e38d6b0d`)
2. Eliminar RPC wrappers: `DROP FUNCTION match_global_flowise`, `DROP FUNCTION match_madeira_flowise`
3. Revertir archivos SDD si es necesario
   Sin pérdida de datos — los RPCs legacy (`match_knowledge_global`, `match_knowledge_madeira`) permanecen intactos.

## Dependencies

-   Servidor Flowise accesible (fase 3+)
-   Supabase project `qklwlyoenlffxnwrkxuc` accesible (fase 2)
-   Credenciales confirmadas: OpenRouter (`ddeb2757-...`), Supabase (`0df85d26-...`), HuggingFace (`aae7223f-...`)
-   Modelo de embeddings: `intfloat/multilingual-e5-large-instruct` (1024 dims) — debe coincidir con dimensión de los RPCs
-   `google/gemma-4-26b-a4b-it:free` disponible en OpenRouter para tool calling

## Success Criteria

-   [ ] AgentFlow creado con 9+ nodos funcionales, pipeline ejecuta end-to-end
-   [ ] `match_global_flowise` y `match_madeira_flowise` creados y verificados en Supabase
-   [ ] Búsqueda vectorial funciona en los 3 stores (global 435K, nyc 18K, madeira 164K)
-   [ ] LLM Router detecta correctamente idioma, territorio e intent
-   [ ] Lingüista PRE traduce queries al idioma de las fuentes cuando necesario
-   [ ] Agent Bibliotecario genera plan de búsqueda coherente con fuentes relevantes
-   [ ] Agent Source Worker recupera resultados con source name, title, URL, excerpt, relevance score
-   [ ] Evidence Merger deduplica por URL, rankea por relevance, valida citas
-   [ ] Síntesis Final responde en el idioma del usuario con citas verificables
-   [ ] Condition node muestra mensaje claro cuando no hay resultados
-   [ ] Test prediction exitoso (smoke test de query real)
