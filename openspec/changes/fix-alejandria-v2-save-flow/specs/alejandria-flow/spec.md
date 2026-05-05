# Alejandria v2 Save Flow — Specification

## Purpose

Restore and fix the Alejandria AGENTFLOW from backup (ID: 50306854-0f6a-4283-bb1f-64c0cb0d82d3) to production flow (ID: 011c1e9d-a34c-433c-aead-ff0578dd54a9) using Option C (migration from backup). The flow MUST function as a multilingual knowledge hub that normalizes queries across heterogeneous sources (Supabase vector stores, MCPs) and returns results in the user's original language.

---

## Requirements

### Requirement: Language Detection and Preservation

The system MUST detect the input language at Router stage and preserve it through the entire pipeline.

#### Scenario: Spanish query preserves language through pipeline

-   GIVEN user sends query "¿Cuáles son las políticas de turismo en Madeira?"
-   WHEN Router (llmAgentflow_0) analyzes the query
-   THEN Router outputs `detectedLanguage: "es"`
-   AND Lingüista PRE receives `detectedLanguage: "es"`
-   AND Síntesis Final returns response in Spanish

#### Scenario: English query preserves language through pipeline

-   GIVEN user sends query "How does the EU regulate AI?"
-   WHEN Router analyzes the query
-   THEN Router outputs `detectedLanguage: "en"`
-   AND response is returned in English

#### Scenario: Portuguese query preserves language through pipeline

-   GIVEN user sends query "Quais são os dados demográficos de Lisboa?"
-   WHEN Router analyzes the query
-   THEN Router outputs `detectedLanguage: "pt"`
-   AND response is returned in Portuguese

---

### Requirement: Query Translation for Source-Specific Requirements

The system SHALL translate queries to the language(s) required by each knowledge source while preserving original language for response.

#### Scenario: Spanish query translated for NYC data source

-   GIVEN user query in Spanish about NYC housing
-   AND NYC MCP requires English queries
-   WHEN Source Worker routes to NYC MCP
-   THEN query is translated to English for MCP call
-   AND original Spanish is preserved for final response

#### Scenario: English query translated for Madeira data

-   GIVEN user query in English about Madeira tourism
-   AND Madeira vector store accepts Portuguese queries
-   WHEN Source Worker routes to Madeira vector store
-   THEN query MAY be translated to Portuguese for better results
-   AND original English is preserved for final response

---

### Requirement: Parallel Multi-Source Search

The system MUST search across multiple knowledge sources in parallel based on territory routing.

#### Scenario: Madeira query searches vector store AND MCP

-   GIVEN query about Madeira tourism policies
-   WHEN Source Worker (agentAgentflow_1) executes tools
-   THEN `search_madeira_knowledge` RetrieverTool is called
-   AND `MADEIRA_DATA` CustomMcpTool is called
-   AND both execute in parallel (Flowise agent behavior)

#### Scenario: NYC query uses NYC-specific sources

-   GIVEN query about NYC open data
-   WHEN Source Worker executes
-   THEN `search_nyc_knowledge` RetrieverTool is called
-   AND NYC MCP tools are called if configured

#### Scenario: EU policy query uses global sources

-   GIVEN query about EU AI regulations
-   WHEN Source Worker executes
-   THEN `search_global_knowledge` RetrieverTool is called
-   AND `UE_DATA_DEV` CustomMcpTool is called
-   AND `OPENALEX_PROD` MAY be called for academic sources

---

### Requirement: Response Normalization from Heterogeneous Sources

The system MUST normalize responses from different source formats (JSON, text, citations) into unified text format.

#### Scenario: Supabase vector store returns with citations

-   GIVEN Supabase RPC `match_madeira_flowise` returns structured results
-   WHEN Evidence Merger processes results
-   THEN content is extracted and normalized to plain text
-   AND citations are preserved with URLs

#### Scenario: MCP returns disparate JSON formats

-   GIVEN `MADEIRA_DATA` MCP returns JSON with custom schema
-   AND `UE_DATA_DEV` MCP returns different JSON schema
-   WHEN Evidence Merger normalizes both
-   THEN unified text format is created
-   AND source metadata is preserved

---

### Requirement: AGENTFLOW Structure Constraints

The flow MUST comply with Flowise AGENTFLOW requirements.

#### Scenario: Flow starts with Start node

-   GIVEN AGENTFLOW is being created/updated
-   THEN first node MUST be `startAgentflow_0` (Start node)
-   AND Start node MUST declare flow state schema

#### Scenario: Flow ends with terminal nodes

-   GIVEN AGENTFLOW execution completes
-   THEN flow MUST end with one of: DirectReply, ExecuteFlow, or HumanInput
-   AND in this flow: `directReplyAgentflow_0` (success) OR `directReplyAgentflow_1` (fallback)

#### Scenario: Source Worker uses Claude Sonnet for tool-calling

-   GIVEN Source Worker (agentAgentflow_1) needs tool-calling capability
-   THEN Source Worker MUST use model with tool-calling support
-   AND recommended: `anthropic/claude-sonnet-4.5` (OpenRouter)
-   AND fallback: `minimax/minimax-m2.5` IF tool-calling is verified

---

### Requirement: Credential Configuration

The system MUST use pre-configured credentials for all external services.

#### Scenario: OpenRouter credential for LLMs

-   GIVEN flow uses OpenRouter models (deepseek, anthropic)
-   THEN credential ID `ddeb2757-f8e2-4ed7-9647-5a113332b432` MUST be used

#### Scenario: Supabase credential for vector stores

-   GIVEN RetrieverTools access Supabase project `qklwlyoenlffxnwrkxuc`
-   THEN credential ID `0df85d26-749b-4fac-9a88-7399663a3099` MUST be used

#### Scenario: HuggingFace credential for embeddings

-   GIVEN embeddings use `intfloat/multilingual-e5-large-instruct`
-   THEN credential ID `aae7223f-da1b-47d5-bb26-1a2f1b2a3d5b` MUST be used

---

### Requirement: Fallback Handling for Empty Results

The system SHALL provide meaningful fallback response when no sources return results.

#### Scenario: Query with no matching results triggers fallback

-   GIVEN user query "xyzzy" (nonsense input)
-   WHEN Source Worker returns empty results
-   AND Condition node evaluates `hasResults === false`
-   THEN flow routes to `directReplyAgentflow_1` (fallback node)
-   AND response is "No relevant information was found in the available knowledge sources."

#### Scenario: Empty/greeting query triggers fallback

-   GIVEN user input is "Hola" OR "" (empty)
-   WHEN Router identifies as greeting/empty
-   THEN flow MAY short-circuit to fallback
-   OR proceed and trigger fallback at Condition node

---

### Requirement: Tool Creation and Connection

The system MUST create and connect all required tools to agent nodes.

#### Scenario: Three RetrieverTools for vector search

| Tool Name                  | Type          | RPC Function            | Embedding Model                           | Credential                             | Status    |
| -------------------------- | ------------- | ----------------------- | ----------------------------------------- | -------------------------------------- | --------- |
| `search_global_knowledge`  | RetrieverTool | `match_global_flowise`  | `intfloat/multilingual-e5-large-instruct` | `0df85d26-749b-4fac-9a88-7399663a3099` | To create |
| `search_nyc_knowledge`     | RetrieverTool | `match_nyc_flowise`     | `intfloat/multilingual-e5-large-instruct` | `0df85d26-749b-4fac-9a88-7399663a3099` | To create |
| `search_madeira_knowledge` | RetrieverTool | `match_madeira_flowise` | `intfloat/multilingual-e5-large-instruct` | `0df85d26-749b-4fac-9a88-7399663a3099` | To create |

#### Scenario: Four MCP Tools for external data

| Tool Name       | Type          | MCP URL                                        | Status    |
| --------------- | ------------- | ---------------------------------------------- | --------- |
| `OPENALEX_PROD` | CustomMcpTool | `https://open-alex-mcp-dev.up.railway.app/mcp` | To create |
| `PT_DATA`       | CustomMcpTool | `https://pt-data.up.railway.app/mcp`           | To create |
| `MADEIRA_DATA`  | CustomMcpTool | `https://madeira-data.up.railway.app/mcp`      | To create |
| `UE_DATA_DEV`   | CustomMcpTool | `https://ue-data-dev.up.railway.app/mcp`       | To create |

#### Scenario: Tools connected to agents

-   GIVEN tools are created
-   WHEN agents are configured
-   THEN Bibliotecario (agentAgentflow_0) receives RetrieverTools only
-   AND Source Worker (agentAgentflow_1) receives ALL tools (RetrieverTools + MCP)

---

### Requirement: Migration from Backup Using Option C

The system MUST restore flow using backup ID 50306854-0f6a-4283-bb1f-64c0cb0d82d3.

#### Scenario: Backup flow data is source of truth

-   GIVEN backup flow exists with 10 nodes and 9 edges
-   AND backup status: "models_updated_branching_fixed_tools_pending"
-   WHEN migration executes
-   THEN backup flowData (nodes + edges) is used as base
-   AND tools are ADDED (not in backup yet)
-   AND flow is saved to production ID `011c1e9d-a34c-433c-aead-ff0578dd54a9`

#### Scenario: Backup models are preserved

-   GIVEN backup specifies models for each node
-   WHEN migration executes
-   THEN Router/Lingüista/Síntesis use `deepseek/deepseek-v4-flash`
-   AND Bibliotecario/Source Worker use `minimax/minimax-m2.5`
-   UNLESS Source Worker requires upgrade to Claude Sonnet (decision pending)

---

### Requirement: Flow Validation Before Save

The system MUST validate flowData before saving to Flowise.

#### Scenario: Viewport is present

-   GIVEN flowData is assembled
-   THEN `viewport: { x: 0, y: 0, zoom: 1 }` MUST be present
-   AND if missing, use `repair_chatflow` after save

#### Scenario: No orphan nodes

-   GIVEN flowData has nodes and edges
-   THEN every node (except Start) MUST have incoming edge
-   AND every node (except terminal nodes) SHOULD have outgoing edge

#### Scenario: No cycles in graph

-   GIVEN AGENTFLOW type (directed acyclic graph expected)
-   THEN no cycles SHOULD exist in edge connections
-   AND validation SHOULD detect and warn about cycles

---

## Coverage Summary

| Category      | Happy Paths | Edge Cases | Error States |
| ------------- | ----------- | ---------- | ------------ |
| Language      | 3           | 1          | 0            |
| Translation   | 2           | 0          | 0            |
| Multi-source  | 3           | 0          | 0            |
| Normalization | 2           | 0          | 0            |
| Structure     | 3           | 0          | 0            |
| Credentials   | 3           | 0          | 0            |
| Fallback      | 2           | 0          | 0            |
| Tools         | 3           | 0          | 0            |
| Migration     | 2           | 0          | 0            |
| Validation    | 3           | 0          | 0            |
| **TOTAL**     | **26**      | **1**      | **0**        |

---

## Next Steps

This specification is ready for:

1. **Design phase** (sdd-design) — Architecture decisions, sequence diagrams, approach
2. **Tasks phase** (sdd-tasks) — Breakdown into implementation checklist

**Artifact store mode**: hybrid (filesystem + Engram)
**Estimated complexity**: Medium (AGENTFLOW restore + tool creation + validation pipeline)
