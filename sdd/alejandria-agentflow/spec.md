# Alejandría AgentFlow v3 Specification

## Purpose

Multi-source knowledge retrieval AgentFlow (Flowise 3.1.2): receives user questions, routes to 5 Custom MCP servers + 3 Supabase vector stores, searches with MCP tools and pgvector similarity, synthesizes responses with source citations.

**Architecture**: Single Agent monolith — the LLM handles language detection, query routing, tool selection, and synthesis natively via function calling. Simplified from v2's 10-node pipeline to 3 nodes.

## Flow Architecture

```
Start → Agent (gemini-2.5-flash-lite + 5 MCP + 3 vector stores) → DirectReply
```

| Node  | ID         | Type                   | Role                          |
| ----- | ---------- | ---------------------- | ----------------------------- |
| Start | `start_v3` | `startAgentflow`       | Receives user question        |
| Agent | `agent_v3` | `agentAgentflow`       | Routes, searches, synthesizes |
| Reply | `reply_v3` | `directReplyAgentflow` | Sends response to user        |

**Flow ID**: `22c88a76-c742-4be1-a0d3-1777369fc46b`  
**Canvas**: `https://flow-stable-flow.up.railway.app/canvas/22c88a76-c742-4be1-a0d3-1777369fc46b`  
**Previous versions**: v1 (`50306854`), v2 (`c7a2f9be`) — preserved, never modified

## ADDED Requirements

### ALE-V3-001: Multi-MCP Tool Selection

Agent MUST have access to 5 Custom MCP servers and automatically select appropriate tools based on user query semantics.

-   GIVEN "attractions in Madeira" → THEN calls MADEIRA_DATA tools
-   GIVEN "EU climate policy" → THEN calls UE_DATA_DEV tools
-   GIVEN "Portugal labor statistics" → THEN calls PT_DATA tools
-   GIVEN "academic papers on machine learning" → THEN calls OpenAlex tools
-   GIVEN "NYC 311 complaints" → THEN calls nyc-data tools
-   GIVEN ambiguous query → THEN may call multiple servers

### ALE-V3-002: Supabase Vector Search

Agent MUST search 3 vector stores via `agentKnowledgeVSEmbeddings` using Supabase pgvector.

-   GIVEN general knowledge query → THEN searches `knowledge.global` (435K docs)
-   GIVEN Madeira-specific query → THEN searches `knowledge.madeira` (164K docs) primarily
-   GIVEN NYC-specific query → THEN searches `knowledge.nyc` (18K docs) primarily
-   GIVEN multiple territories → THEN searches all relevant stores

**Vector store config (correct Flowise node names)**:

```json
{
    "vectorStore": {
        "name": "supabase",
        "type": "Supabase",
        "credential": "0df85d26-749b-4fac-9a88-7399663a3099",
        "tableName": "knowledge.{namespace}",
        "queryName": "match_{namespace}_flowise",
        "contentColumn": "content"
    },
    "embeddingModel": {
        "name": "huggingFaceInferenceEmbeddings",
        "type": "HuggingFaceInferenceEmbeddings",
        "credential": "aae7223f-da1b-47d5-bb26-1a2f1b2a3d5b",
        "modelName": "intfloat/multilingual-e5-large"
    }
}
```

### ALE-V3-003: RPC Compatibility (Supabase pgvector)

RPC functions MUST use standard Flowise 4-param signature.

| RPC                     | Table               | Records |
| ----------------------- | ------------------- | ------- |
| `match_global_flowise`  | `knowledge.global`  | 435,267 |
| `match_madeira_flowise` | `knowledge.madeira` | 164,330 |
| `match_nyc_flowise`     | `knowledge.nyc`     | 18,834  |

**Signature**: `(query_embedding vector, match_threshold double precision, match_count integer, filter jsonb DEFAULT '{}')`  
**Returns**: `TABLE(id bigint, content text, metadata jsonb, similarity double precision)`  
**Embedding dim**: 1024 (HuggingFace `intfloat/multilingual-e5-large`)

### ALE-V3-004: Source Citation

Agent MUST cite data sources in responses — both MCP server name AND vector store namespace.

-   GIVEN data from MADEIRA_DATA → THEN cites "MADEIRA_DATA MCP server"
-   GIVEN data from knowledge.global → THEN cites "knowledge.global vector store"
-   GIVEN mixed sources → THEN cites all used sources
-   GIVEN no data found → THEN honestly states "No information found" and suggests alternative sources

### ALE-V3-005: Multilingual Response

Agent MUST respond in the same language as the user's question, regardless of source language.

-   GIVEN Spanish question → THEN responds in Spanish
-   GIVEN English question → THEN responds in English
-   GIVEN Portuguese question → THEN responds in Portuguese

## Model & Credentials

| Resource        | Type                               | UUID                                   |
| --------------- | ---------------------------------- | -------------------------------------- |
| OpenRouter API  | Chat Model (gemini-2.5-flash-lite) | `ddeb2757-f8e2-4ed7-9647-5a113332b432` |
| Supabase API    | Vector Store                       | `0df85d26-749b-4fac-9a88-7399663a3099` |
| HuggingFace API | Embedding Model                    | `aae7223f-da1b-47d5-bb26-1a2f1b2a3d5b` |

## MCP Servers

| Server       | UUID                                   | Tools | Status     |
| ------------ | -------------------------------------- | ----- | ---------- |
| UE_DATA_DEV  | `6a41ee83-d05a-4ada-864a-f4deb7518e6c` | 4     | AUTHORIZED |
| MADEIRA_DATA | `02c92a00-a4d5-49fb-a422-6db30f690cbc` | 10    | AUTHORIZED |
| PT_DATA      | `7769853d-151c-4156-b56d-98bd9385b814` | 4     | AUTHORIZED |
| OpenAlex     | `bdc984ac-6d56-421c-b0a4-93b7ee59c14a` | 10    | AUTHORIZED |
| nyc-data     | `28b8c50b-9b39-42ef-805e-b79777988119` | 5     | AUTHORIZED |

## Critical Flowise Node Names (DO NOT GUESS)

| Purpose                | Correct `name`                   | Correct `type`                   | WRONG names                         |
| ---------------------- | -------------------------------- | -------------------------------- | ----------------------------------- |
| Supabase vector store  | `supabase`                       | `Supabase`                       | ~~supabaseVectorStore~~             |
| HuggingFace embeddings | `huggingFaceInferenceEmbeddings` | `HuggingFaceInferenceEmbeddings` | ~~huggingFaceApi~~, ~~HuggingFace~~ |
| OpenRouter chat        | `chatOpenRouter`                 | `ChatOpenRouter`                 | —                                   |
| Agent node             | `agentAgentflow`                 | `Agent`                          | —                                   |
| Start node             | `startAgentflow`                 | `Start`                          | —                                   |
| Direct Reply           | `directReplyAgentflow`           | `DirectReply`                    | —                                   |

## Edge Cases

-   Empty input → Agent responds asking for a question
-   MCP server unreachable → Agent uses available vector stores as fallback
-   Vector store timeout → Agent uses MCP tools only
-   All sources return empty → "No relevant information found in any source"
-   Token limit exceeded → Agent summarizes instead of full source listing

## Known Issues

1. **Template resolution**: `{{variable}}` templates in llmMessages/agentMessages may not resolve in AgentFlow — framework-dependent behavior
2. **MCP token expiry**: SSE tokens may expire, requiring re-authorization in Flowise UI
3. **Tool calling errors**: Complex multi-tool queries produce `finish_reason: "errorerror"` — under investigation
4. **API strips inputAnchors**: Flowise create/update API removes inputAnchors — must restore post-save

## Non-Functional

-   Latency: SHOULD respond <30s for MCP + vector search
-   Robustness: MUST complete on valid input; degrade gracefully on source failures
-   Model: gemini-2.5-flash-lite (confirmed tool-calling support, unlike MiniMax)
-   State: No flow state variables needed (v3 monolith — all reasoning in single Agent call)
