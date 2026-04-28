# Vector Database

**Table**: `knowledge.documents` (Supabase `knowledge` schema)
**Embedding model**: HuggingFace — `HuggingFaceEmbeddingsClient`
**Embedding dimension**: **1024** — migrations must use `vector(1024)`

## Table schema

| Column      | Type         | Description                                         |
| ----------- | ------------ | --------------------------------------------------- |
| `id`        | integer      | Primary key                                         |
| `content`   | text         | Document text                                       |
| `embedding` | vector(1024) | HuggingFace embedding                               |
| `flow`      | enum         | factum \| agora \| politeia                         |
| `namespace` | string       | Logical partition e.g. `"factum/housing_territory"` |
| `origin`    | string       | Data source identifier                              |
| `metadata`  | JSON         | Arbitrary metadata                                  |

## Two Supabase clients — never mix them

```typescript
supabaseClient // Regular operations: auth, public tables, storage
supabaseVectorClient // Vector search ONLY — schema('knowledge').rpc(...)
```

## How searchKnowledge works

File: `src/utils/agent/data/mcp/internal_research/InternalResearchClient/methods/searchKnowledge.ts`

```
1. Generate 1024-dim embedding from query text
2. Auth: supabaseVectorClient.auth.signInWithPassword() — REQUIRED before RPC
3. Call match_knowledge_madeira + match_knowledge_global IN PARALLEL
4. Merge arrays → sort by similarity DESC
5. Apply code-level threshold filter (default 0.1)
6. Apply namespace filter if provided (in code, after RPC)
```

## Active RPC functions

| RPC                       | Partition         | Dims |
| ------------------------- | ----------------- | ---- |
| `match_knowledge_madeira` | Madeira documents | 1024 |
| `match_knowledge_global`  | Global documents  | 1024 |

**Only use these two** for new code. Legacy RPCs (`match_knowledge_v2`, `match_knowledge_europa`, etc.) may have dimension mismatches.

## ⚠️ Flow filter is DISABLED

`filter_flow` is always sent as `null`. The `flow` param in search params is ignored at RPC level.
Use `namespace` to scope searches instead of `flow`.

## RPC params

```typescript
{
  match_count: 10,           // default
  match_threshold: 0.05,     // low for recall — real cutoff applied in code (default 0.1)
  metric: 'cosine',
  query_embedding: JSON.stringify(embedding),  // must be stringified array
  filter_flow: null,         // always null
}

// Call via:
supabaseVectorClient.schema('knowledge').rpc('match_knowledge_global', params)
```

## Namespace partitions

`"<flow>/<domain>"` — e.g. `"factum/housing_territory"`, `"politeia/mensajes_core"`

Query `SELECT DISTINCT namespace FROM knowledge.documents` for full list.

## VectorSearchResult shape

```typescript
interface VectorSearchResult {
    id: number
    content: string
    metadata: Record<string, unknown>
    similarity: number // 0–1 cosine similarity
    flow?: string
    origin?: string
}
```

## Debugging checklist

```
□ embedding.length === 1024  (not 768 or 1536)
□ query_embedding is JSON.stringify(array), not raw array
□ signInWithPassword() called before schema('knowledge').rpc()
□ Using supabaseVectorClient not supabaseClient for vector ops
□ filter_flow sent as null
□ namespace string matches exactly what's in DB (case sensitive)
□ match_knowledge_madeira/global migrations use vector(1024)
```
