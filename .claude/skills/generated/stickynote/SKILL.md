---
name: stickynote
description: 'Skill for the StickyNote area of Flow-stable. 323 symbols across 322 files.'
---

# StickyNote

323 symbols | 322 files | Cohesion: 100%

## When to Use

-   Working with code in `packages/`
-   Understanding how INode work
-   Modifying stickynote-related functionality

## Key Files

| File                                                                | Symbols                    |
| ------------------------------------------------------------------- | -------------------------- |
| `packages/components/nodes/utilities/StickyNote/StickyNote.ts`      | StickyNote, init           |
| `packages/components/src/Interface.ts`                              | INode                      |
| `packages/components/nodes/vectorstores/ZepCloud/ZepCloud.ts`       | Zep_CloudVectorStores      |
| `packages/components/nodes/vectorstores/Zep/Zep.ts`                 | Zep_VectorStores           |
| `packages/components/nodes/vectorstores/Weaviate/Weaviate.ts`       | Weaviate_VectorStores      |
| `packages/components/nodes/vectorstores/Vectara/Vectara_Upload.ts`  | VectaraUpload_VectorStores |
| `packages/components/nodes/vectorstores/Vectara/Vectara.ts`         | Vectara_VectorStores       |
| `packages/components/nodes/vectorstores/Upstash/Upstash.ts`         | Upstash_VectorStores       |
| `packages/components/nodes/vectorstores/Supabase/Supabase.ts`       | Supabase_VectorStores      |
| `packages/components/nodes/vectorstores/Singlestore/Singlestore.ts` | SingleStore_VectorStores   |

## Entry Points

Start here when exploring this area:

-   **`INode`** (Interface) — `packages/components/src/Interface.ts:147`

## Key Symbols

| Symbol                                      | Type      | File                                                                     | Line |
| ------------------------------------------- | --------- | ------------------------------------------------------------------------ | ---- |
| `INode`                                     | Interface | `packages/components/src/Interface.ts`                                   | 147  |
| `Zep_CloudVectorStores`                     | Class     | `packages/components/nodes/vectorstores/ZepCloud/ZepCloud.ts`            | 10   |
| `Zep_VectorStores`                          | Class     | `packages/components/nodes/vectorstores/Zep/Zep.ts`                      | 9    |
| `Weaviate_VectorStores`                     | Class     | `packages/components/nodes/vectorstores/Weaviate/Weaviate.ts`            | 81   |
| `VectaraUpload_VectorStores`                | Class     | `packages/components/nodes/vectorstores/Vectara/Vectara_Upload.ts`       | 5    |
| `Vectara_VectorStores`                      | Class     | `packages/components/nodes/vectorstores/Vectara/Vectara.ts`              | 15   |
| `Upstash_VectorStores`                      | Class     | `packages/components/nodes/vectorstores/Upstash/Upstash.ts`              | 14   |
| `Supabase_VectorStores`                     | Class     | `packages/components/nodes/vectorstores/Supabase/Supabase.ts`            | 12   |
| `SingleStore_VectorStores`                  | Class     | `packages/components/nodes/vectorstores/Singlestore/Singlestore.ts`      | 7    |
| `SimpleStoreUpsert_LlamaIndex_VectorStores` | Class     | `packages/components/nodes/vectorstores/SimpleStore/SimpleStore.ts`      | 6    |
| `Redis_VectorStores`                        | Class     | `packages/components/nodes/vectorstores/Redis/Redis.ts`                  | 9    |
| `Qdrant_VectorStores`                       | Class     | `packages/components/nodes/vectorstores/Qdrant/Qdrant.ts`                | 18   |
| `Postgres_VectorStores`                     | Class     | `packages/components/nodes/vectorstores/Postgres/Postgres.ts`            | 34   |
| `PineconeLlamaIndex_VectorStores`           | Class     | `packages/components/nodes/vectorstores/Pinecone/Pinecone_LlamaIndex.ts` | 20   |
| `Pinecone_VectorStores`                     | Class     | `packages/components/nodes/vectorstores/Pinecone/Pinecone.ts`            | 11   |
| `OpenSearch_VectorStores`                   | Class     | `packages/components/nodes/vectorstores/OpenSearch/OpenSearch.ts`        | 8    |
| `MongoDBAtlas_VectorStores`                 | Class     | `packages/components/nodes/vectorstores/MongoDBAtlas/MongoDBAtlas.ts`    | 9    |
| `Milvus_VectorStores`                       | Class     | `packages/components/nodes/vectorstores/Milvus/Milvus.ts`                | 13   |
| `MeilisearchRetriever_node`                 | Class     | `packages/components/nodes/vectorstores/Meilisearch/Meilisearch.ts`      | 9    |
| `Kendra_VectorStores`                       | Class     | `packages/components/nodes/vectorstores/Kendra/Kendra.ts`                | 10   |

## How to Explore

1. `gitnexus_context({name: "INode"})` — see callers and callees
2. `gitnexus_query({query: "stickynote"})` — find related execution flows
3. Read key files listed above for implementation details
