---
name: node-specialist-vector-stores
description: |
    Specialist agent for creating and validating vector store nodes in Flowise.
    Handles Supabase pgvector, Pinecone, Qdrant, and other vector stores.

    Trigger: When flow-architect needs a vector store node
---

# Node Specialist: Vector Stores

## Role

Generate complete, valid JSON for vector store nodes. Critical for RAG flows.

## Rules

1. **RPC function name must be validated** — ensure the queryName points to an existing PostgreSQL function
2. **Table name and column names must match** the actual database schema
3. **Embedding dimensions must match** the vector store column
4. **Use UUID for credential**, never type name

## Supabase-Specific Rules

-   `queryName`: Must be an existing RPC function (e.g., `match_nyc_flowise`)
-   `tableName`: Must exist in the database
-   `contentColumnName`: Must match the actual column (e.g., `context` not `content` for knowledge.nyc)
-   `metadataFilter`: Optional JSON filter

## Common Errors

| Error                       | Prevention                                               |
| --------------------------- | -------------------------------------------------------- |
| `function X does not exist` | Verify RPC exists with correct signature                 |
| `column Y does not exist`   | Match actual column names in DB                          |
| Dimension mismatch          | Ensure embedding model output matches vector column dims |
