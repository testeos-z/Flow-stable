# Design: Alejandría AgentFlow v2

## Technical Approach

AgentFlow v2 pipeline (9 nodes + 1 Start) with mixed free models: Llama-4-Maverick for LLM-only nodes (no tool calling needed), Gemma-4-26B for Agent nodes (only free OpenRouter model with `toolCalling`). Flow State (`$flow.state`) passes data between nodes — all 10 keys pre-declared in Start. Vector search via RetrieverTool (NOT direct `Knowledge/Vector Embeddings`) because RPC wrappers (`match_global_flowise`, `match_madeira_flowise`) are Supabase-side and the Agent Node's direct attach requires Flowise-managed Vector Store + Embedding nodes which we cannot configure offline. RetrieverTool is simpler: one node, query string input, RPC function name.

No MCP stdio (INTERNAL_RESEARCH excluded — Flowise CustomMcpTool only supports HTTP/SSE transport). MCPs OPENALEX, PT_DATA, MADEIRA_DATA, UE_DATA available via HTTP.

## Architecture Decisions

### Decision 1: RetrieverTool vs Agent Node direct Vector Embeddings

| Option                                       | Pros                                                                                       | Cons                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Agent Node + `Knowledge / Vector Embeddings` | Native, declarative, no LLM reasoning overhead                                             | Requires Vector Store node + Embedding node connected; RPC must match Flowise internal expectations; harder to debug |
| **Agent Node + RetrieverTool** (chosen)      | One tool per store; explicit query string; easier to reason about; works with any RPC name | Adds LLM reasoning step (Agent decides when to call); slightly higher latency                                        |
| **Tool Node** (deterministic)                | No LLM overhead; fastest                                                                   | Cannot coordinate multi-store search plan; hard-coded call sequence                                                  |

**Rationale**: RetrieverTool is the reliable path. We have 3 vector stores (global 435K, nyc 18K, madeira 164K) and need coordinated search — Agent Bibliotecario plans, Agent Source Worker executes. The LLM reasoning overhead is acceptable because we WANT the Agent to decide territory-primary vs fallback.

### Decision 2: Two Agents sharing Gemma vs separate models

**Choice**: Both Agent Bibliotecario and Agent Source Worker use `google/gemma-4-26b-a4b-it:free`.

**Rationale**: It's the ONLY free OpenRouter model with `toolCalling: true` (confirmed in `/model-capabilities.ts`). Rate limiting risk exists (acknowledged) but there's no free alternative. If rate-limited at runtime, the non-Agent nodes (Router, Lingüista, Síntesis) remain unaffected — they use different models.

### Decision 3: Condition Node (string comparison) vs Condition Agent Node (LLM branching)

**Choice**: Condition Node with `{{$flow.state.search_results}}` length check.

**Rationale**: Checking "is array empty?" is deterministic — no LLM needed. Condition Agent adds latency and cost for a boolean check. If the string comparison doesn't handle arrays natively, the fallback is a CustomFunction that returns a string flag: `return searchResults.length > 0 ? "has_results" : "empty"`.

### Decision 4: Lingüista POST skipped (MVP)

**Choice**: No Lingüista POST node. Síntesis Final handles target-language output directly via its system prompt.

**Rationale**: The Síntesis node already reads `router_result.language` from flow state and is instructed to respond in user language. A separate post-translation step adds latency and an extra LLM call for minimal gain. If citation fidelity matters later, add Lingüista POST as a future iteration.

### Decision 5: INTERNAL_RESEARCH MCP excluded

**Choice**: Do NOT include INTERNAL_RESEARCH (stdio transport) in the flow.

**Rationale**: Flowise `CustomMcpTool` node connects to MCP servers via HTTP/SSE transport only. INTERNAL_RESEARCH is `stdio` (local process), which cannot be reached from Flowise's Node.js runtime. The four HTTP MCPs (OPENALEX_PROD, PT_DATA, MADEIRA_DATA, UE_DATA_DEV) remain available as tools on the Agent Source Worker.

## Real AgentFlow v2 Schema Reference

This design is validated against a real working AGENTFLOW `agentflow-nemotron-minimal` on the live Flowise server. The schema was discovered by inspecting the `/chatflows` endpoint and fetching the full node+edge configuration. AgentFlow v2 uses fundamentally different node types and edge wiring than CHATFLOW.

### Key Differences from CHATFLOW

| Aspect                               | CHATFLOW                                                                          | AgentFlow v2                                                                        |
| ------------------------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Node `type`                          | `"customNode"`                                                                    | `"agentFlow"`                                                                       |
| Edge `type`                          | `"buttonedge"`                                                                    | `"agentFlow"`                                                                       |
| Edge `sourceHandle` / `targetHandle` | Typically `source` / `target` node IDs only                                       | Full anchor ID: `startAgentflow_0-output-startAgentflow` → `agentAgentflow_0`       |
| Edge `id`                            | Auto-generated by UI                                                              | Compound: `{source}-{sourceHandle}-{target}-{targetHandle}`                         |
| Node `data.type`                     | `"Start"`, `"LLM"`, `"Agent"`, `"Condition"`, `"CustomFunction"`, `"DirectReply"` | Same values                                                                         |
| Node `data.category`                 | N/A or `"Custom Nodes"`                                                           | `"Agent Flows"`                                                                     |
| Model config                         | Referenced via `credentialId` separate field                                      | Embedded in `agentModelConfig`/`llmModelConfig` with `FLOWISE_CREDENTIAL_ID`        |
| Flow State in Start                  | Configurable as separate `inputs.startState` array                                | `inputs.startState` array of `{key, value}` pairs                                   |
| Node `inputs`                        | Flat `inputs` object                                                              | Flat `inputs` object with field prefixes (`agent*`, `llm*`, `start*`, `condition*`) |
| Node `inputParams`                   | Optional                                                                          | Present on all nodes — defines the UI form schema                                   |
| Node `outputAnchors`                 | Optional                                                                          | Present on all nodes — defines output connection points                             |
| Node `inputAnchors`                  | Optional                                                                          | Empty array `[]` for Start/Agent/LLM nodes                                          |

### Edge Format (AGENTFLOW)

```json
{
    "source": "startAgentflow_0",
    "sourceHandle": "startAgentflow_0-output-startAgentflow",
    "target": "agentAgentflow_0",
    "targetHandle": "agentAgentflow_0",
    "data": {
        "isHumanInput": false,
        "sourceColor": "#7EE787",
        "targetColor": "#4DD0E1"
    },
    "type": "agentFlow",
    "id": "startAgentflow_0-startAgentflow_0-output-startAgentflow-agentAgentflow_0-agentAgentflow_0"
}
```

### Node ID Convention (discovered + inferred)

All nodes in the same agentflow share the sequential numbering scope within their node type:

| Role                           | Node ID                     | `data.type`        | `data.category` | `baseClasses`        |
| ------------------------------ | --------------------------- | ------------------ | --------------- | -------------------- |
| Start                          | `startAgentflow_0`          | `"Start"`          | `"Agent Flows"` | `["Start"]`          |
| LLM Router                     | `llmAgentflow_0`            | `"LLM"`            | `"Agent Flows"` | `["LLM"]`            |
| LLM Lingüista PRE              | `llmAgentflow_1`            | `"LLM"`            | `"Agent Flows"` | `["LLM"]`            |
| Agent Bibliotecario            | `agentAgentflow_0`          | `"Agent"`          | `"Agent Flows"` | `["Agent"]`          |
| Agent Source Worker            | `agentAgentflow_1`          | `"Agent"`          | `"Agent Flows"` | `["Agent"]`          |
| Condition                      | `conditionAgentflow_0`      | `"Condition"`      | `"Agent Flows"` | `["Condition"]`      |
| CustomFunction Evidence Merger | `customFunctionAgentflow_0` | `"CustomFunction"` | `"Agent Flows"` | `["CustomFunction"]` |
| LLM Síntesis                   | `llmAgentflow_2`            | `"LLM"`            | `"Agent Flows"` | `["LLM"]`            |
| Direct Reply                   | `directReplyAgentflow_0`    | `"DirectReply"`    | `"Agent Flows"` | `["DirectReply"]`    |

Tool nodes (RetrieverTool, CustomMcpTool) are separate nodes connected to the Agent's tool input anchor. They use their own node types (`"RetrieverTool"`, `"CustomMcpTool"`) and are NOT `type: "agentFlow"` — they are wired as tool resources, not flow sequence nodes.

## Data Flow

```
User Query
    │
    ▼
[Start]  ── declares 12 flow state keys (startState with key/value pairs)
    │
    ▼
[LLM Router]  ── JSON output: {language, territory, intent, query_normalized, recommended_sources}
    │              └─ Update Flow State: router_result = {{output}}
    ▼
[LLM Lingüista PRE]  ── reads router_result, translates per territory if needed
    │                     └─ Update Flow State: search_queries = {{output}}
    ▼
[Agent Bibliotecario]  ── reads search_queries, creates search plan (RetrieverTool selection)
    │                       └─ Update Flow State: search_plan = {{output}}
    ▼
[Agent Source Worker]  ── executes plan: RetrieverTools + MCP HTTP tools
    │                       └─ Update Flow State: search_results = <aggregated array>
    ▼
[Condition]  ── search_results is empty?
    │
    ├── false (has results) ──→ [CustomFunction Evidence Merger]
    │                               │  dedup by URL, rank, validate citations
    │                               │  └─ Update Flow State: evidence
    │                               ▼
    │                           [LLM Síntesis Final] ── reads evidence + original_query + language
    │                               │                     └─ Update Flow State: final_answer
    │                               ▼
    │                           [Direct Reply]  ── {{$flow.state.final_answer}}
    │
    └── true (empty) ──→ [Direct Reply]  ── "No hay información relevante..." (static)
```

### Flow State Keys Lifecycle

| Key                   | Writer              | Reader(s)                          | Lifecycle                     |
| --------------------- | ------------------- | ---------------------------------- | ----------------------------- |
| `original_query`      | Start (user input)  | LLM Router, LLM Síntesis           | Persists entire flow          |
| `user_language`       | Start (empty)       | —                                  | Declared for future use       |
| `territory`           | Start (empty)       | —                                  | Declared for future use       |
| `intent`              | Start (empty)       | —                                  | Declared for future use       |
| `query_normalized`    | Start (empty)       | —                                  | Declared for future use       |
| `recommended_sources` | Start (empty)       | —                                  | Declared for future use       |
| `router_result`       | LLM Router          | Lingüista PRE, Síntesis (language) | Written once, read downstream |
| `search_queries`      | Lingüista PRE       | Agent Bibliotecario                | Written once                  |
| `search_plan`         | Agent Bibliotecario | Agent Source Worker                | Written once                  |
| `search_results`      | Agent Source Worker | Condition, Evidence Merger         | Written once                  |
| `evidence`            | CustomFunction      | LLM Síntesis                       | Written once                  |
| `final_answer`        | LLM Síntesis        | Direct Reply                       | Written once                  |

## Node-by-Node Design

### 1. Start Node

```json
{
    "id": "startAgentflow_0",
    "type": "agentFlow",
    "data": {
        "type": "Start",
        "category": "Agent Flows",
        "baseClasses": ["Start"],
        "label": "Start",
        "name": "startAgentflow",
        "version": 1.1,
        "description": "Starting point of the agentflow",
        "color": "#7EE787",
        "hideInput": true,
        "inputs": {
            "startInputType": "chatInput",
            "startEphemeralMemory": "",
            "startState": [
                { "key": "original_query", "value": "" },
                { "key": "user_language", "value": "" },
                { "key": "territory", "value": "" },
                { "key": "intent", "value": "" },
                { "key": "query_normalized", "value": "" },
                { "key": "recommended_sources", "value": "[]" },
                { "key": "router_result", "value": "{}" },
                { "key": "search_queries", "value": "{}" },
                { "key": "search_plan", "value": "{}" },
                { "key": "search_results", "value": "[]" },
                { "key": "evidence", "value": "[]" },
                { "key": "final_answer", "value": "" }
            ],
            "startPersistState": ""
        },
        "inputAnchors": [],
        "inputParams": [
            {
                "label": "Input Type",
                "name": "startInputType",
                "type": "options",
                "options": [{ "label": "Chat Input", "name": "chatInput" }],
                "default": "chatInput"
            },
            { "label": "Ephemeral Memory", "name": "startEphemeralMemory", "type": "boolean", "optional": true },
            {
                "label": "Flow State",
                "name": "startState",
                "type": "array",
                "optional": true,
                "array": [
                    { "label": "Key", "name": "key", "type": "string", "placeholder": "Foo" },
                    { "label": "Value", "name": "value", "type": "string", "placeholder": "Bar", "optional": true }
                ]
            },
            { "label": "Persist State", "name": "startPersistState", "type": "boolean", "optional": true }
        ],
        "outputAnchors": [{ "id": "startAgentflow_0-output-startAgentflow", "label": "Start", "name": "startAgentflow" }],
        "outputs": {}
    },
    "width": 104,
    "height": 66,
    "position": { "x": -125, "y": 31.5 },
    "selected": false
}
```

**Flow State keys** (12 keys, all pre-declared in `startState` as `{key, value}` pairs):

| Key                   | Initial Value | Purpose                    |
| --------------------- | ------------- | -------------------------- |
| `original_query`      | `""`          | User's raw input           |
| `user_language`       | `""`          | Reserved for future use    |
| `territory`           | `""`          | Reserved for future use    |
| `intent`              | `""`          | Reserved for future use    |
| `query_normalized`    | `""`          | Reserved for future use    |
| `recommended_sources` | `"[]"`        | Reserved for future use    |
| `router_result`       | `"{}"`        | Written by LLM Router      |
| `search_queries`      | `"{}"`        | Written by Lingüista       |
| `search_plan`         | `"{}"`        | Written by Bibliotecario   |
| `search_results`      | `"[]"`        | Written by Source Worker   |
| `evidence`            | `"[]"`        | Written by Evidence Merger |
| `final_answer`        | `""`          | Written by Síntesis        |

**Input Type**: `"Chat Input"`

### 2. LLM Router

```json
{
    "id": "llmAgentflow_0",
    "type": "agentFlow",
    "data": {
        "type": "LLM",
        "category": "Agent Flows",
        "baseClasses": ["LLM"],
        "label": "Router",
        "name": "llmAgentflow",
        "version": 1.1,
        "description": "Classify user query: language, territory, intent, source recommendations",
        "color": "#22D3EE",
        "hideInput": false,
        "inputs": {
            "llmModel": "chatOpenRouter",
            "llmMessages": [
                { "role": "system", "content": "You are a multilingual query router for a knowledge retrieval system..." },
                { "role": "user", "content": "{{input}}" }
            ],
            "llmEnableMemory": false,
            "llmMemoryType": "",
            "llmStructuredOutput": [
                { "key": "language", "type": "string" },
                { "key": "territory", "type": "string" },
                { "key": "intent", "type": "string" },
                { "key": "query_normalized", "type": "string" },
                { "key": "recommended_sources", "type": "jsonArray" }
            ],
            "llmUpdateState": [{ "key": "router_result", "value": "{{output}}" }],
            "llmReturnResponseAs": "userMessage",
            "llmModelConfig": {
                "modelName": "meta-llama/llama-4-maverick:free",
                "temperature": 0.3,
                "streaming": true,
                "basepath": "https://openrouter.ai/api/v1",
                "baseOptions": "",
                "FLOWISE_CREDENTIAL_ID": "ddeb2757-f8e2-4ed7-9647-5a113332b432"
            }
        },
        "inputAnchors": [],
        "inputParams": [
            { "label": "Model", "name": "llmModel", "type": "asyncOptions", "loadMethod": "listModels", "loadConfig": true },
            {
                "label": "Messages",
                "name": "llmMessages",
                "type": "array",
                "optional": true,
                "acceptVariable": true,
                "array": [
                    {
                        "label": "Role",
                        "name": "role",
                        "type": "options",
                        "options": [
                            { "label": "System", "name": "system" },
                            { "label": "Assistant", "name": "assistant" },
                            { "label": "Developer", "name": "developer" },
                            { "label": "User", "name": "user" }
                        ]
                    },
                    {
                        "label": "Content",
                        "name": "content",
                        "type": "string",
                        "acceptVariable": true,
                        "generateInstruction": true,
                        "rows": 4
                    }
                ]
            },
            { "label": "Enable Memory", "name": "llmEnableMemory", "type": "boolean", "default": false, "optional": true },
            {
                "label": "Memory Type",
                "name": "llmMemoryType",
                "type": "options",
                "options": [
                    { "label": "All Messages", "name": "allMessages" },
                    { "label": "Window Size", "name": "windowSize" },
                    { "label": "Conversation Summary", "name": "conversationSummary" },
                    { "label": "Conversation Summary Buffer", "name": "conversationSummaryBuffer" }
                ]
            },
            {
                "label": "JSON Structured Output",
                "name": "llmStructuredOutput",
                "type": "array",
                "optional": true,
                "acceptVariable": true,
                "array": [
                    { "label": "Key", "name": "key", "type": "string" },
                    {
                        "label": "Type",
                        "name": "type",
                        "type": "options",
                        "options": [
                            { "label": "String", "name": "string" },
                            { "label": "String Array", "name": "stringArray" },
                            { "label": "Number", "name": "number" },
                            { "label": "Boolean", "name": "boolean" },
                            { "label": "Enum", "name": "enum" },
                            { "label": "JSON Array", "name": "jsonArray" }
                        ]
                    }
                ]
            },
            {
                "label": "Update Flow State",
                "name": "llmUpdateState",
                "type": "array",
                "optional": true,
                "acceptVariable": true,
                "array": [
                    { "label": "Key", "name": "key", "type": "asyncOptions", "loadMethod": "listRuntimeStateKeys" },
                    { "label": "Value", "name": "value", "type": "string", "acceptVariable": true, "acceptNodeOutputAsVariable": true }
                ]
            },
            {
                "label": "Return Response As",
                "name": "llmReturnResponseAs",
                "type": "options",
                "options": [
                    { "label": "User Message", "name": "userMessage" },
                    { "label": "Assistant Message", "name": "assistantMessage" }
                ],
                "default": "userMessage"
            }
        ],
        "outputAnchors": [{ "id": "llmAgentflow_0-output-llmAgentflow", "label": "LLM", "name": "llmAgentflow" }],
        "outputs": {}
    },
    "width": 260,
    "height": 72,
    "position": { "x": 57.75, "y": 30 },
    "selected": false
}
```

-   **Model credential**: `FLOWISE_CREDENTIAL_ID: "ddeb2757-f8e2-4ed7-9647-5a113332b432"` inside `llmModelConfig`
-   **Model name**: `"meta-llama/llama-4-maverick:free"`
-   **JSON Structured Output**: Enabled. Schema (inferred from `llmStructuredOutput` array):

```json
{
    "type": "object",
    "properties": {
        "language": { "type": "string", "enum": ["es", "en", "pt", "fr", "de", "it", "other"] },
        "territory": { "type": "string", "enum": ["nyc", "madeira", "europa", "global"] },
        "intent": { "type": "string", "enum": ["knowledge_search", "policy_analysis", "data_query", "general_question"] },
        "query_normalized": { "type": "string", "description": "Cleaned and deduplicated user query" },
        "recommended_sources": {
            "type": "array",
            "items": {
                "type": "string",
                "enum": ["knowledge.global", "knowledge.nyc", "knowledge.madeira", "openalex", "pt_data", "madeira_data", "ue_data"]
            }
        }
    },
    "required": ["language", "territory", "intent", "query_normalized", "recommended_sources"]
}
```

-   **System Prompt**:

```
You are a multilingual query router for a knowledge retrieval system. Your job is to classify the user's question and determine the best sources to search.

## Task
Analyze the user's message and extract:
1. **language**: The ISO 639-1 code of the user's language (es, en, pt, fr, de, it). Default to "en" if unsure.
2. **territory**: The geographic focus — "nyc" for New York City topics, "madeira" for Madeira/Portugal topics, "europa" for EU/Europe-wide topics, "global" for everything else or when ambiguous.
3. **intent**: "knowledge_search" for factual questions, "policy_analysis" for policy/program evaluation, "data_query" for statistics/data requests, "general_question" as default.
4. **query_normalized**: The user's original query with typos fixed, redundant words removed, and formatted as a clean search string.
5. **recommended_sources**: An array of knowledge sources to search, selected from: "knowledge.global" (general documents 435K records), "knowledge.nyc" (NYC-specific documents 18K records), "knowledge.madeira" (Madeira-specific documents 164K records), "openalex" (academic papers), "pt_data" (Portugal datasets), "madeira_data" (Madeira local data), "ue_data" (EU data).

## Rules
- If territory is "nyc", primary source MUST be "knowledge.nyc" with "knowledge.global" as fallback.
- If territory is "madeira", primary source MUST be "knowledge.madeira" with "knowledge.global" as fallback and "madeira_data" for local data.
- If territory is "europa", include "ue_data" and "knowledge.global".
- If territory is "global", use "knowledge.global" with "openalex" for academic questions.
- Always include "knowledge.global" as a fallback source unless territory is unambiguously specific.
- For empty or nonsensical input: language="en", territory="global", intent="general_question".

## Output
Return ONLY valid JSON matching the schema. No explanations, no markdown fences.
```

-   **Messages configuration**: `[{"role": "system", "content": "<system_prompt>"}, {"role": "user", "content": "{{input}}"}]` (reads user input from Start)
-   **Update Flow State**: `llmUpdateState: [{"key": "router_result", "value": "{{output}}"}]`

### 3. LLM Lingüista PRE

```json
{
    "id": "llmAgentflow_1",
    "type": "agentFlow",
    "data": {
        "type": "LLM",
        "category": "Agent Flows",
        "baseClasses": ["LLM"],
        "label": "Lingüista PRE",
        "name": "llmAgentflow",
        "version": 1.1,
        "description": "Translate queries for territory-specific vector search",
        "color": "#22D3EE",
        "hideInput": false,
        "inputs": {
            "llmModel": "chatOpenRouter",
            "llmMessages": [
                { "role": "system", "content": "You are a multilingual query translator..." },
                { "role": "user", "content": "{{$flow.state.router_result}}" }
            ],
            "llmEnableMemory": false,
            "llmMemoryType": "",
            "llmStructuredOutput": [
                { "key": "original_language", "type": "string" },
                { "key": "translations", "type": "jsonArray" }
            ],
            "llmUpdateState": [{ "key": "search_queries", "value": "{{output}}" }],
            "llmReturnResponseAs": "userMessage",
            "llmModelConfig": {
                "modelName": "meta-llama/llama-4-maverick:free",
                "temperature": 0.3,
                "streaming": true,
                "basepath": "https://openrouter.ai/api/v1",
                "baseOptions": "",
                "FLOWISE_CREDENTIAL_ID": "ddeb2757-f8e2-4ed7-9647-5a113332b432"
            }
        },
        "inputAnchors": [],
        "inputParams": [
            { "label": "Model", "name": "llmModel", "type": "asyncOptions", "loadMethod": "listModels", "loadConfig": true },
            {
                "label": "Messages",
                "name": "llmMessages",
                "type": "array",
                "optional": true,
                "acceptVariable": true,
                "array": [
                    {
                        "label": "Role",
                        "name": "role",
                        "type": "options",
                        "options": [
                            { "label": "System", "name": "system" },
                            { "label": "Assistant", "name": "assistant" },
                            { "label": "Developer", "name": "developer" },
                            { "label": "User", "name": "user" }
                        ]
                    },
                    {
                        "label": "Content",
                        "name": "content",
                        "type": "string",
                        "acceptVariable": true,
                        "generateInstruction": true,
                        "rows": 4
                    }
                ]
            },
            { "label": "Enable Memory", "name": "llmEnableMemory", "type": "boolean", "default": false, "optional": true },
            {
                "label": "Memory Type",
                "name": "llmMemoryType",
                "type": "options",
                "options": [
                    { "label": "All Messages", "name": "allMessages" },
                    { "label": "Window Size", "name": "windowSize" },
                    { "label": "Conversation Summary", "name": "conversationSummary" },
                    { "label": "Conversation Summary Buffer", "name": "conversationSummaryBuffer" }
                ]
            },
            {
                "label": "JSON Structured Output",
                "name": "llmStructuredOutput",
                "type": "array",
                "optional": true,
                "acceptVariable": true,
                "array": [
                    { "label": "Key", "name": "key", "type": "string" },
                    {
                        "label": "Type",
                        "name": "type",
                        "type": "options",
                        "options": [
                            { "label": "String", "name": "string" },
                            { "label": "String Array", "name": "stringArray" },
                            { "label": "Number", "name": "number" },
                            { "label": "Boolean", "name": "boolean" },
                            { "label": "Enum", "name": "enum" },
                            { "label": "JSON Array", "name": "jsonArray" }
                        ]
                    }
                ]
            },
            {
                "label": "Update Flow State",
                "name": "llmUpdateState",
                "type": "array",
                "optional": true,
                "acceptVariable": true,
                "array": [
                    { "label": "Key", "name": "key", "type": "asyncOptions", "loadMethod": "listRuntimeStateKeys" },
                    { "label": "Value", "name": "value", "type": "string", "acceptVariable": true, "acceptNodeOutputAsVariable": true }
                ]
            },
            {
                "label": "Return Response As",
                "name": "llmReturnResponseAs",
                "type": "options",
                "options": [
                    { "label": "User Message", "name": "userMessage" },
                    { "label": "Assistant Message", "name": "assistantMessage" }
                ],
                "default": "userMessage"
            }
        ],
        "outputAnchors": [{ "id": "llmAgentflow_1-output-llmAgentflow", "label": "LLM", "name": "llmAgentflow" }],
        "outputs": {}
    },
    "width": 260,
    "height": 72,
    "position": { "x": 400, "y": 30 },
    "selected": false
}
```

-   **Model credential**: `FLOWISE_CREDENTIAL_ID: "ddeb2757-f8e2-4ed7-9647-5a113332b432"` inside `llmModelConfig`
-   **Model name**: `"meta-llama/llama-4-maverick:free"`
-   **JSON Structured Output**: Enabled. Schema:

```json
{
    "type": "object",
    "properties": {
        "original_language": { "type": "string" },
        "translations": {
            "type": "object",
            "patternProperties": {
                ".*": { "type": "string" }
            },
            "description": "Map of territory/source language to translated query. Keys: 'en', 'pt', 'es', etc."
        }
    },
    "required": ["original_language", "translations"]
}
```

-   **System Prompt**:

```
You are a multilingual query translator for a multi-territory knowledge system. Your job is to prepare search queries in source languages so vector search works correctly.

## Task
Given the router analysis (router_result), produce translated search queries for each territory that needs them:

1. **original_language**: The user's detected language from router_result.
2. **translations**: Object mapping target language codes to translated queries.

## Translation Rules
- If user language IS the source language: passthrough the original query (no translation needed).
- If user language DIFFERS from source: translate the query_normalized into the source language.
- Source languages by territory:
  - "nyc", "europa", "global" → English ("en")
  - "madeira" → Portuguese ("pt")
  - "pt_data", "madeira_data" → Portuguese ("pt")
  - "ue_data" → English ("en")
  - "openalex" → English ("en")
- If translation fails or is uncertain: keep the original query.

## Input
Router result: {{$flow.state.router_result}}

## Output
Return ONLY valid JSON matching the schema. No explanations. If no translation needed, return {"original_language": "<lang>", "translations": {}}.
```

-   **Messages**: Reads `router_result` from `{{$flow.state.router_result}}` and appends it to the system context
-   **Update Flow State**: `llmUpdateState: [{"key": "search_queries", "value": "{{output}}"}]`

### 4. Agent Bibliotecario

```json
{
    "id": "agentAgentflow_0",
    "type": "agentFlow",
    "data": {
        "type": "Agent",
        "category": "Agent Flows",
        "baseClasses": ["Agent"],
        "label": "Bibliotecario",
        "name": "agentAgentflow",
        "version": 3.2,
        "description": "Create a search plan — which sources, in what order, with what queries",
        "color": "#4DD0E1",
        "hideInput": false,
        "inputs": {
            "agentModel": "chatOpenRouter",
            "agentMessages": [
                { "role": "system", "content": "You are the 'Bibliotecario' (Librarian)..." },
                { "role": "user", "content": "Router: {{$flow.state.router_result}}\nQueries: {{$flow.state.search_queries}}" }
            ],
            "agentTools": "",
            "agentKnowledgeDocumentStores": "",
            "agentKnowledgeVSEmbeddings": "",
            "agentEnableMemory": false,
            "agentMemoryType": "",
            "agentUserMessage": "",
            "agentReturnResponseAs": "userMessage",
            "agentStructuredOutput": "",
            "agentUpdateState": [{ "key": "search_plan", "value": "{{output}}" }],
            "agentModelConfig": {
                "modelName": "google/gemma-4-26b-a4b-it:free",
                "temperature": 0.9,
                "streaming": true,
                "basepath": "https://openrouter.ai/api/v1",
                "baseOptions": "",
                "FLOWISE_CREDENTIAL_ID": "ddeb2757-f8e2-4ed7-9647-5a113332b432"
            }
        },
        "inputAnchors": [],
        "inputParams": [
            { "label": "Model", "name": "agentModel", "type": "asyncOptions", "loadMethod": "listModels", "loadConfig": true },
            {
                "label": "Messages",
                "name": "agentMessages",
                "type": "array",
                "optional": true,
                "acceptVariable": true,
                "array": [
                    {
                        "label": "Role",
                        "name": "role",
                        "type": "options",
                        "options": [
                            { "label": "System", "name": "system" },
                            { "label": "Assistant", "name": "assistant" },
                            { "label": "Developer", "name": "developer" },
                            { "label": "User", "name": "user" }
                        ]
                    },
                    {
                        "label": "Content",
                        "name": "content",
                        "type": "string",
                        "acceptVariable": true,
                        "generateInstruction": true,
                        "rows": 4
                    }
                ]
            },
            {
                "label": "Tools",
                "name": "agentTools",
                "type": "array",
                "optional": true,
                "array": [
                    { "label": "Tool", "name": "agentSelectedTool", "type": "asyncOptions", "loadMethod": "listTools", "loadConfig": true },
                    { "label": "Require Human Input", "name": "agentSelectedToolRequiresHumanInput", "type": "boolean", "optional": true }
                ]
            },
            {
                "label": "Knowledge (Document Stores)",
                "name": "agentKnowledgeDocumentStores",
                "type": "array",
                "optional": true,
                "array": [
                    { "label": "Document Store", "name": "documentStore", "type": "asyncOptions", "loadMethod": "listStores" },
                    { "label": "Describe Knowledge", "name": "docStoreDescription", "type": "string", "rows": 4 },
                    { "label": "Return Source Documents", "name": "returnSourceDocuments", "type": "boolean", "optional": true }
                ]
            },
            {
                "label": "Knowledge (Vector Embeddings)",
                "name": "agentKnowledgeVSEmbeddings",
                "type": "array",
                "optional": true,
                "array": [
                    {
                        "label": "Vector Store",
                        "name": "vectorStore",
                        "type": "asyncOptions",
                        "loadMethod": "listVectorStores",
                        "loadConfig": true
                    },
                    {
                        "label": "Embedding Model",
                        "name": "embeddingModel",
                        "type": "asyncOptions",
                        "loadMethod": "listEmbeddings",
                        "loadConfig": true
                    },
                    { "label": "Knowledge Name", "name": "knowledgeName", "type": "string" },
                    { "label": "Describe Knowledge", "name": "knowledgeDescription", "type": "string", "rows": 4 },
                    { "label": "Return Source Documents", "name": "returnSourceDocuments", "type": "boolean", "optional": true }
                ]
            },
            { "label": "Enable Memory", "name": "agentEnableMemory", "type": "boolean", "default": false, "optional": true },
            {
                "label": "Memory Type",
                "name": "agentMemoryType",
                "type": "options",
                "options": [
                    { "label": "All Messages", "name": "allMessages" },
                    { "label": "Window Size", "name": "windowSize" },
                    { "label": "Conversation Summary", "name": "conversationSummary" },
                    { "label": "Conversation Summary Buffer", "name": "conversationSummaryBuffer" }
                ]
            },
            { "label": "Input Message", "name": "agentUserMessage", "type": "string", "rows": 4, "optional": true, "acceptVariable": true },
            {
                "label": "Return Response As",
                "name": "agentReturnResponseAs",
                "type": "options",
                "options": [
                    { "label": "User Message", "name": "userMessage" },
                    { "label": "Assistant Message", "name": "assistantMessage" }
                ],
                "default": "userMessage"
            },
            {
                "label": "JSON Structured Output",
                "name": "agentStructuredOutput",
                "type": "array",
                "optional": true,
                "acceptVariable": true,
                "array": [
                    { "label": "Key", "name": "key", "type": "string" },
                    {
                        "label": "Type",
                        "name": "type",
                        "type": "options",
                        "options": [
                            { "label": "String", "name": "string" },
                            { "label": "String Array", "name": "stringArray" },
                            { "label": "Number", "name": "number" },
                            { "label": "Boolean", "name": "boolean" },
                            { "label": "Enum", "name": "enum" },
                            { "label": "JSON Array", "name": "jsonArray" }
                        ]
                    }
                ]
            },
            {
                "label": "Update Flow State",
                "name": "agentUpdateState",
                "type": "array",
                "optional": true,
                "acceptVariable": true,
                "array": [
                    { "label": "Key", "name": "key", "type": "asyncOptions", "loadMethod": "listRuntimeStateKeys" },
                    { "label": "Value", "name": "value", "type": "string", "acceptVariable": true, "acceptNodeOutputAsVariable": true }
                ]
            }
        ],
        "outputAnchors": [{ "id": "agentAgentflow_0-output-agentAgentflow", "label": "Agent", "name": "agentAgentflow" }],
        "outputs": {}
    },
    "width": 260,
    "height": 72,
    "position": { "x": 742.75, "y": 30 },
    "selected": false
}
```

-   **Model credential**: `FLOWISE_CREDENTIAL_ID: "ddeb2757-f8e2-4ed7-9647-5a113332b432"` inside `agentModelConfig`
-   **Model name**: `"google/gemma-4-26b-a4b-it:free"`
-   **System Prompt**:

```
You are the "Bibliotecario" (Librarian) — the search coordinator for a multi-source knowledge retrieval system. Your job is to CREATE a search plan, NOT execute it. Do NOT call any tools. Just produce a structured JSON plan.

## Your Input
- router_result: {{$flow.state.router_result}}
- search_queries: {{$flow.state.search_queries}}

## Your Output (JSON only, no markdown)
Generate a search plan as a JSON array of search steps. Each step has:
- "step": integer (1-based order)
- "source": one of "knowledge_global", "knowledge_nyc", "knowledge_madeira", "openalex", "pt_data", "madeira_data", "ue_data"
- "query": the translated query string for this source
- "priority": "primary" | "secondary" | "fallback"
- "match_count": number of results to request (5-20, default 10)
- "reasoning": one sentence explaining why this source is included

## Strategy
1. Primary sources first: territory-matched vector store gets priority="primary" with higher match_count
2. Secondary: related data MCPs (openalex, territory datasets)
3. Fallback: knowledge.global when territory-specific search may miss results
4. If territory is "global", only knowledge.global + openalex (for academic questions)

## Rules
- For NYC: knowledge_nyc primary (15 results), knowledge_global fallback (5 results)
- For Madeira: knowledge_madeira primary (15 results), madeira_data secondary (10), knowledge_global fallback (5)
- For Europa: knowledge_global primary (10 results), ue_data secondary (10)
- Maximum 4 steps total. Do NOT include sources not in recommended_sources.
```

-   **Tools**: None. `agentTools` is `""` (empty). This Agent reasons, produces a plan, writes it to flow state via its final output.
-   **Knowledge / Vector Embeddings**: NOT configured (`agentKnowledgeDocumentStores = ""`, `agentKnowledgeVSEmbeddings = ""`). RetrieverTool approach — no vector store nodes attached directly to this Agent.
-   **Update Flow State**: `agentUpdateState: [{"key": "search_plan", "value": "{{output}}"}]`

### 5. Agent Source Worker

```json
{
    "id": "agentAgentflow_1",
    "type": "agentFlow",
    "data": {
        "type": "Agent",
        "category": "Agent Flows",
        "baseClasses": ["Agent"],
        "label": "Source Worker",
        "name": "agentAgentflow",
        "version": 3.2,
        "description": "Execute search plan: call RetrieverTools and MCP tools per plan steps",
        "color": "#4DD0E1",
        "hideInput": false,
        "inputs": {
            "agentModel": "chatOpenRouter",
            "agentMessages": [
                { "role": "system", "content": "You are the 'Source Worker' — the execution agent..." },
                { "role": "user", "content": "Search plan: {{$flow.state.search_plan}}" }
            ],
            "agentTools": [
                "retrieverGlobal_0",
                "retrieverNyc_0",
                "retrieverMadeira_0",
                "mcpOpenAlex_0",
                "mcpPtData_0",
                "mcpMadeiraData_0",
                "mcpUeData_0"
            ],
            "agentKnowledgeDocumentStores": "",
            "agentKnowledgeVSEmbeddings": "",
            "agentEnableMemory": false,
            "agentMemoryType": "",
            "agentUserMessage": "",
            "agentReturnResponseAs": "userMessage",
            "agentStructuredOutput": "",
            "agentUpdateState": [{ "key": "search_results", "value": "{{output}}" }],
            "agentModelConfig": {
                "modelName": "google/gemma-4-26b-a4b-it:free",
                "temperature": 0.9,
                "streaming": true,
                "basepath": "https://openrouter.ai/api/v1",
                "baseOptions": "",
                "FLOWISE_CREDENTIAL_ID": "ddeb2757-f8e2-4ed7-9647-5a113332b432"
            }
        },
        "inputAnchors": [],
        "inputParams": [
            { "label": "Model", "name": "agentModel", "type": "asyncOptions", "loadMethod": "listModels", "loadConfig": true },
            {
                "label": "Messages",
                "name": "agentMessages",
                "type": "array",
                "optional": true,
                "acceptVariable": true,
                "array": [
                    {
                        "label": "Role",
                        "name": "role",
                        "type": "options",
                        "options": [
                            { "label": "System", "name": "system" },
                            { "label": "Assistant", "name": "assistant" },
                            { "label": "Developer", "name": "developer" },
                            { "label": "User", "name": "user" }
                        ]
                    },
                    {
                        "label": "Content",
                        "name": "content",
                        "type": "string",
                        "acceptVariable": true,
                        "generateInstruction": true,
                        "rows": 4
                    }
                ]
            },
            {
                "label": "Tools",
                "name": "agentTools",
                "type": "array",
                "optional": true,
                "array": [
                    { "label": "Tool", "name": "agentSelectedTool", "type": "asyncOptions", "loadMethod": "listTools", "loadConfig": true },
                    { "label": "Require Human Input", "name": "agentSelectedToolRequiresHumanInput", "type": "boolean", "optional": true }
                ]
            },
            {
                "label": "Knowledge (Document Stores)",
                "name": "agentKnowledgeDocumentStores",
                "type": "array",
                "optional": true,
                "array": [
                    { "label": "Document Store", "name": "documentStore", "type": "asyncOptions", "loadMethod": "listStores" },
                    { "label": "Describe Knowledge", "name": "docStoreDescription", "type": "string", "rows": 4 },
                    { "label": "Return Source Documents", "name": "returnSourceDocuments", "type": "boolean", "optional": true }
                ]
            },
            {
                "label": "Knowledge (Vector Embeddings)",
                "name": "agentKnowledgeVSEmbeddings",
                "type": "array",
                "optional": true,
                "array": [
                    {
                        "label": "Vector Store",
                        "name": "vectorStore",
                        "type": "asyncOptions",
                        "loadMethod": "listVectorStores",
                        "loadConfig": true
                    },
                    {
                        "label": "Embedding Model",
                        "name": "embeddingModel",
                        "type": "asyncOptions",
                        "loadMethod": "listEmbeddings",
                        "loadConfig": true
                    },
                    { "label": "Knowledge Name", "name": "knowledgeName", "type": "string" },
                    { "label": "Describe Knowledge", "name": "knowledgeDescription", "type": "string", "rows": 4 },
                    { "label": "Return Source Documents", "name": "returnSourceDocuments", "type": "boolean", "optional": true }
                ]
            },
            { "label": "Enable Memory", "name": "agentEnableMemory", "type": "boolean", "default": false, "optional": true },
            {
                "label": "Memory Type",
                "name": "agentMemoryType",
                "type": "options",
                "options": [
                    { "label": "All Messages", "name": "allMessages" },
                    { "label": "Window Size", "name": "windowSize" },
                    { "label": "Conversation Summary", "name": "conversationSummary" },
                    { "label": "Conversation Summary Buffer", "name": "conversationSummaryBuffer" }
                ]
            },
            { "label": "Input Message", "name": "agentUserMessage", "type": "string", "rows": 4, "optional": true, "acceptVariable": true },
            {
                "label": "Return Response As",
                "name": "agentReturnResponseAs",
                "type": "options",
                "options": [
                    { "label": "User Message", "name": "userMessage" },
                    { "label": "Assistant Message", "name": "assistantMessage" }
                ],
                "default": "userMessage"
            },
            {
                "label": "JSON Structured Output",
                "name": "agentStructuredOutput",
                "type": "array",
                "optional": true,
                "acceptVariable": true,
                "array": [
                    { "label": "Key", "name": "key", "type": "string" },
                    {
                        "label": "Type",
                        "name": "type",
                        "type": "options",
                        "options": [
                            { "label": "String", "name": "string" },
                            { "label": "String Array", "name": "stringArray" },
                            { "label": "Number", "name": "number" },
                            { "label": "Boolean", "name": "boolean" },
                            { "label": "Enum", "name": "enum" },
                            { "label": "JSON Array", "name": "jsonArray" }
                        ]
                    }
                ]
            },
            {
                "label": "Update Flow State",
                "name": "agentUpdateState",
                "type": "array",
                "optional": true,
                "acceptVariable": true,
                "array": [
                    { "label": "Key", "name": "key", "type": "asyncOptions", "loadMethod": "listRuntimeStateKeys" },
                    { "label": "Value", "name": "value", "type": "string", "acceptVariable": true, "acceptNodeOutputAsVariable": true }
                ]
            }
        ],
        "outputAnchors": [{ "id": "agentAgentflow_1-output-agentAgentflow", "label": "Agent", "name": "agentAgentflow" }],
        "outputs": {}
    },
    "width": 260,
    "height": 72,
    "position": { "x": 1085.5, "y": 30 },
    "selected": false
}
```

-   **Model credential**: `FLOWISE_CREDENTIAL_ID: "ddeb2757-f8e2-4ed7-9647-5a113332b432"` inside `agentModelConfig`
-   **Model name**: `"google/gemma-4-26b-a4b-it:free"`
-   **System Prompt**:

```
You are the "Source Worker" — the execution agent. Your job is to FOLLOW the search plan and retrieve actual documents. You MUST call the provided tools according to the plan. Do NOT skip steps. Do NOT fabricate results.

## Your Input
- search_plan: {{$flow.state.search_plan}}

## Your Tools
You have access to RetrieverTools for vector search and MCP tools for live data. Call each tool with the query and match_count specified in the plan step.

## Output
Aggregate ALL tool results into a single JSON array of results. Each result object:
{
  "source": "knowledge_nyc" | "knowledge_global" | "knowledge_madeira" | "openalex" | "pt_data" | "madeira_data" | "ue_data",
  "title": "Document title or first 100 chars of content",
  "url": "Source URL if available (empty string if none)",
  "excerpt": "Relevant excerpt (max 300 chars)",
  "relevance": number 0-1 (similarity score where available, estimate if not),
  "language": "en" | "pt" | "es" | "other",
  "step": plan step number that produced this result
}

## Rules
- Execute steps in order. For each step, call the appropriate tool with the step's query and match_count.
- If a tool returns no results, note it but continue to next step.
- If a tool errors, include an error result: {"source": "<name>", "error": "<message>", "step": N}
- Return the aggregated array. If ALL steps fail, return [].
```

-   **Tools configuration** (`agentTools` array — node ID references to RetrieverTool and CustomMcpTool nodes):

| Tool Node ID         | Type          | Config                                                                       |
| -------------------- | ------------- | ---------------------------------------------------------------------------- |
| `retrieverGlobal_0`  | RetrieverTool | Name: `search_global`, Vector Store: Supabase, RPC: `match_global_flowise`   |
| `retrieverNyc_0`     | RetrieverTool | Name: `search_nyc`, Vector Store: Supabase, RPC: `match_nyc_flowise`         |
| `retrieverMadeira_0` | RetrieverTool | Name: `search_madeira`, Vector Store: Supabase, RPC: `match_madeira_flowise` |
| `mcpOpenAlex_0`      | CustomMcpTool | MCP: OPENALEX_PROD, Tool: `search_works`                                     |
| `mcpPtData_0`        | CustomMcpTool | MCP: PT_DATA, Tool: `data_query`                                             |
| `mcpMadeiraData_0`   | CustomMcpTool | MCP: MADEIRA_DATA, Tool: `data_query`                                        |
| `mcpUeData_0`        | CustomMcpTool | MCP: UE_DATA_DEV, Tool: `data_query`                                         |

-   **Update Flow State**: `agentUpdateState: [{"key": "search_results", "value": "{{output}}"}]`

### 6. Condition Node (Fallback)

```json
{
    "id": "conditionAgentflow_0",
    "type": "agentFlow",
    "data": {
        "type": "Condition",
        "category": "Agent Flows",
        "baseClasses": ["Condition"],
        "label": "Has Results?",
        "name": "conditionAgentflow",
        "version": 1.1,
        "description": "Check if search_results has any items; route to Evidence Merger or fallback Direct Reply",
        "color": "#F59E0B",
        "hideInput": false,
        "inputs": {
            "conditionVariable": "{{$flow.state.search_results}}",
            "conditionOperation": "contains",
            "conditionValue": "[",
            "conditionOutputTrue": "goEvidence",
            "conditionOutputFalse": "goFallback"
        },
        "inputAnchors": [],
        "inputParams": [
            { "label": "Variable", "name": "conditionVariable", "type": "string", "acceptVariable": true },
            {
                "label": "Operation",
                "name": "conditionOperation",
                "type": "options",
                "options": [
                    { "label": "Contains", "name": "contains" },
                    { "label": "Not Contains", "name": "notContains" },
                    { "label": "Equals", "name": "equals" },
                    { "label": "Not Equals", "name": "notEquals" },
                    { "label": "Is Empty", "name": "isEmpty" },
                    { "label": "Is Not Empty", "name": "isNotEmpty" }
                ]
            },
            { "label": "Value", "name": "conditionValue", "type": "string" }
        ],
        "outputAnchors": [
            { "id": "conditionAgentflow_0-output-goEvidence", "label": "True (goEvidence)", "name": "goEvidence" },
            { "id": "conditionAgentflow_0-output-goFallback", "label": "False (goFallback)", "name": "goFallback" }
        ],
        "outputs": {}
    },
    "width": 180,
    "height": 72,
    "position": { "x": 1428.25, "y": 30 },
    "selected": false
}
```

-   **Condition type**: String comparison — checks if `{{$flow.state.search_results}}` contains `[` (i.e., non-empty array serialized as JSON string).
-   **If the Condition node cannot inspect array content natively**: Use a CustomFunction BEFORE the Condition that sets a string flag:
    -   CustomFunction `customFunctionFlag_0`:
        ```javascript
        const results = $flow.state.search_results
        return Array.isArray(results) && results.length > 0 ? 'has_results' : 'empty'
        ```
        -   Update Flow State: `result_flag` = `{{output}}`
    -   Then Condition checks `{{$flow.state.result_flag}} == "has_results"`.

**Edges from Condition**:

-   `goEvidence` (true) → `customFunctionAgentflow_0` (Evidence Merger)
-   `goFallback` (false) → `directReplyAgentflow_0` (static "no data" message)

### 7. CustomFunction Evidence Merger

```json
{
    "id": "customFunctionAgentflow_0",
    "type": "agentFlow",
    "data": {
        "type": "CustomFunction",
        "category": "Agent Flows",
        "baseClasses": ["CustomFunction"],
        "label": "Evidence Merger",
        "name": "customFunctionAgentflow",
        "version": 1.1,
        "description": "Deduplicate by URL, rank by relevance, validate citations",
        "color": "#A78BFA",
        "hideInput": false,
        "inputs": {
            "customFunctionFunctionCode": "const results = $flow.state.search_results;\n\n// If empty or not an array, return empty evidence\nif (!Array.isArray(results) || results.length === 0) {\n    return [];\n}\n\n// Step 1: Filter out error entries\nconst validResults = results.filter(r => !r.error);\n\n// Step 2: Deduplicate by URL — keep highest relevance\nconst seenUrls = new Map();\nfor (const r of validResults) {\n    const url = (r.url || '').trim();\n    if (!url) continue;\n    const existing = seenUrls.get(url);\n    if (!existing || (r.relevance || 0) > (existing.relevance || 0)) {\n        seenUrls.set(url, r);\n    }\n}\n\n// Step 3: Separate url-less entries (add confidence flag)\nconst urlLess = validResults.filter(r => !(r.url || '').trim())\n    .map(r => ({ ...r, confidence: \"low\" }));\n\n// Step 4: Merge deduplicated + url-less, sort by relevance DESC\nconst merged = [\n    ...Array.from(seenUrls.values()).map(r => ({ ...r, confidence: \"high\" })),\n    ...urlLess\n].sort((a, b) => (b.relevance || 0) - (a.relevance || 0));\n\n// Step 5: Return merged array\nreturn merged;",
            "customFunctionJavaScriptFunctionName": "mergeEvidence",
            "customFunctionOutputToFlowState": [{ "key": "evidence", "value": "{{output}}" }]
        },
        "inputAnchors": [],
        "inputParams": [
            { "label": "Function Name", "name": "customFunctionJavaScriptFunctionName", "type": "string" },
            { "label": "Code", "name": "customFunctionFunctionCode", "type": "code", "rows": 20 },
            {
                "label": "Update Flow State",
                "name": "customFunctionOutputToFlowState",
                "type": "array",
                "optional": true,
                "array": [
                    { "label": "Key", "name": "key", "type": "asyncOptions", "loadMethod": "listRuntimeStateKeys" },
                    { "label": "Value", "name": "value", "type": "string", "acceptVariable": true }
                ]
            }
        ],
        "outputAnchors": [
            {
                "id": "customFunctionAgentflow_0-output-customFunctionAgentflow",
                "label": "CustomFunction",
                "name": "customFunctionAgentflow"
            }
        ],
        "outputs": {}
    },
    "width": 200,
    "height": 72,
    "position": { "x": 1691, "y": -60 },
    "selected": false
}
```

-   **Input Variables**: Reads `search_results` from `{{$flow.state.search_results}}` (accessed in JS via `$flow.state.search_results`)
-   **JavaScript code** (same logic, stored in `customFunctionFunctionCode`):

```javascript
const results = $flow.state.search_results

// If empty or not an array, return empty evidence
if (!Array.isArray(results) || results.length === 0) {
    return []
}

// Step 1: Filter out error entries
const validResults = results.filter((r) => !r.error)

// Step 2: Deduplicate by URL — keep highest relevance
const seenUrls = new Map()
for (const r of validResults) {
    const url = (r.url || '').trim()
    if (!url) continue // url-less handled separately
    const existing = seenUrls.get(url)
    if (!existing || (r.relevance || 0) > (existing.relevance || 0)) {
        seenUrls.set(url, r)
    }
}

// Step 3: Separate url-less entries (add confidence flag)
const urlLess = validResults.filter((r) => !(r.url || '').trim()).map((r) => ({ ...r, confidence: 'low' }))

// Step 4: Merge deduplicated + url-less, sort by relevance DESC
const merged = [...Array.from(seenUrls.values()).map((r) => ({ ...r, confidence: 'high' })), ...urlLess].sort(
    (a, b) => (b.relevance || 0) - (a.relevance || 0)
)

// Step 5: Group by source type for traceability
return merged
```

-   **Update Flow State**: `customFunctionOutputToFlowState: [{"key": "evidence", "value": "{{output}}"}]`

### 8. LLM Síntesis Final

```json
{
    "id": "llmAgentflow_2",
    "type": "agentFlow",
    "data": {
        "type": "LLM",
        "category": "Agent Flows",
        "baseClasses": ["LLM"],
        "label": "Síntesis Final",
        "name": "llmAgentflow",
        "version": 1.1,
        "description": "Synthesize evidence into natural-language response with inline citations",
        "color": "#22D3EE",
        "hideInput": false,
        "inputs": {
            "llmModel": "chatOpenRouter",
            "llmMessages": [
                {
                    "role": "system",
                    "content": "You are the 'Síntesis Final' — the response synthesizer for a multi-source knowledge system. Your job is to produce a coherent, well-cited answer using ONLY the evidence provided. Do NOT use your own training knowledge.\n\n## Input\n- Original query: {{$flow.state.original_query}}\n- User language: {{$flow.state.router_result.language}}\n- Evidence: {{$flow.state.evidence}}\n\n## Instructions\n1. Read the original query. Understand what the user is asking.\n2. Review ALL evidence items. Ignore nothing relevant.\n3. Synthesize a coherent answer that addresses the query directly.\n4. Format citations inline as [Source: Title](URL) or [Source: Title] if no URL.\n5. Respond in the user's language ({{$flow.state.router_result.language}}). If language detection failed, default to English.\n6. Be honest about limitations:\n   - If evidence is partial: \"Based on available sources, [answer]. Note: [source] data was unavailable.\"\n   - If evidence contradicts: present both views with sources.\n   - If only one evidence item: state the key finding with its citation.\n   - For yes/no questions: direct answer first, then supporting evidence.\n\n## Citation Format\n- Use [N] numbering for inline: \"According to NYC housing data [1], ...\"\n- At the end, list all citations:\n  References:\n  [1] Title — URL\n  [2] Title — URL\n\n## Output Format\nWrite in natural paragraphs. Do NOT output JSON. The response goes directly to the user."
                },
                { "role": "user", "content": "Original query: {{$flow.state.original_query}}\n\nEvidence:\n{{$flow.state.evidence}}" }
            ],
            "llmEnableMemory": false,
            "llmMemoryType": "",
            "llmStructuredOutput": "",
            "llmUpdateState": [{ "key": "final_answer", "value": "{{output}}" }],
            "llmReturnResponseAs": "userMessage",
            "llmModelConfig": {
                "modelName": "meta-llama/llama-4-maverick:free",
                "temperature": 0.3,
                "streaming": true,
                "basepath": "https://openrouter.ai/api/v1",
                "baseOptions": "",
                "FLOWISE_CREDENTIAL_ID": "ddeb2757-f8e2-4ed7-9647-5a113332b432"
            }
        },
        "inputAnchors": [],
        "inputParams": [
            { "label": "Model", "name": "llmModel", "type": "asyncOptions", "loadMethod": "listModels", "loadConfig": true },
            {
                "label": "Messages",
                "name": "llmMessages",
                "type": "array",
                "optional": true,
                "acceptVariable": true,
                "array": [
                    {
                        "label": "Role",
                        "name": "role",
                        "type": "options",
                        "options": [
                            { "label": "System", "name": "system" },
                            { "label": "Assistant", "name": "assistant" },
                            { "label": "Developer", "name": "developer" },
                            { "label": "User", "name": "user" }
                        ]
                    },
                    {
                        "label": "Content",
                        "name": "content",
                        "type": "string",
                        "acceptVariable": true,
                        "generateInstruction": true,
                        "rows": 4
                    }
                ]
            },
            { "label": "Enable Memory", "name": "llmEnableMemory", "type": "boolean", "default": false, "optional": true },
            {
                "label": "Memory Type",
                "name": "llmMemoryType",
                "type": "options",
                "options": [
                    { "label": "All Messages", "name": "allMessages" },
                    { "label": "Window Size", "name": "windowSize" },
                    { "label": "Conversation Summary", "name": "conversationSummary" },
                    { "label": "Conversation Summary Buffer", "name": "conversationSummaryBuffer" }
                ]
            },
            {
                "label": "JSON Structured Output",
                "name": "llmStructuredOutput",
                "type": "array",
                "optional": true,
                "acceptVariable": true,
                "array": [
                    { "label": "Key", "name": "key", "type": "string" },
                    {
                        "label": "Type",
                        "name": "type",
                        "type": "options",
                        "options": [
                            { "label": "String", "name": "string" },
                            { "label": "String Array", "name": "stringArray" },
                            { "label": "Number", "name": "number" },
                            { "label": "Boolean", "name": "boolean" },
                            { "label": "Enum", "name": "enum" },
                            { "label": "JSON Array", "name": "jsonArray" }
                        ]
                    }
                ]
            },
            {
                "label": "Update Flow State",
                "name": "llmUpdateState",
                "type": "array",
                "optional": true,
                "acceptVariable": true,
                "array": [
                    { "label": "Key", "name": "key", "type": "asyncOptions", "loadMethod": "listRuntimeStateKeys" },
                    { "label": "Value", "name": "value", "type": "string", "acceptVariable": true, "acceptNodeOutputAsVariable": true }
                ]
            },
            {
                "label": "Return Response As",
                "name": "llmReturnResponseAs",
                "type": "options",
                "options": [
                    { "label": "User Message", "name": "userMessage" },
                    { "label": "Assistant Message", "name": "assistantMessage" }
                ],
                "default": "userMessage"
            }
        ],
        "outputAnchors": [{ "id": "llmAgentflow_2-output-llmAgentflow", "label": "LLM", "name": "llmAgentflow" }],
        "outputs": {}
    },
    "width": 260,
    "height": 72,
    "position": { "x": 1973.75, "y": -60 },
    "selected": false
}
```

-   **Model credential**: `FLOWISE_CREDENTIAL_ID: "ddeb2757-f8e2-4ed7-9647-5a113332b432"` inside `llmModelConfig`
-   **Model name**: `"meta-llama/llama-4-maverick:free"`
-   **JSON Structured Output**: Disabled (`llmStructuredOutput = ""`) — natural language response with citations
-   **System Prompt**:

```
You are the "Síntesis Final" — the response synthesizer for a multi-source knowledge system. Your job is to produce a coherent, well-cited answer using ONLY the evidence provided. Do NOT use your own training knowledge.

## Input
- Original query: {{$flow.state.original_query}}
- User language: {{$flow.state.router_result.language}}
- Evidence: {{$flow.state.evidence}}

## Instructions
1. Read the original query. Understand what the user is asking.
2. Review ALL evidence items. Ignore nothing relevant.
3. Synthesize a coherent answer that addresses the query directly.
4. Format citations inline as [Source: Title](URL) or [Source: Title] if no URL.
5. Respond in the user's language ({{$flow.state.router_result.language}}). If language detection failed, default to English.
6. Be honest about limitations:
   - If evidence is partial: "Based on available sources, [answer]. Note: [source] data was unavailable."
   - If evidence contradicts: present both views with sources.
   - If only one evidence item: state the key finding with its citation.
   - For yes/no questions: direct answer first, then supporting evidence.

## Citation Format
- Use [N] numbering for inline: "According to NYC housing data [1], ..."
- At the end, list all citations:
  References:
  [1] Title — URL
  [2] Title — URL

## Output Format
Write in natural paragraphs. Do NOT output JSON. The response goes directly to the user.
```

-   **Messages**: Reads `evidence` and `original_query` from flow state
-   **Update Flow State**: `llmUpdateState: [{"key": "final_answer", "value": "{{output}}"}]`

### 9. Direct Reply

```json
{
    "id": "directReplyAgentflow_0",
    "type": "agentFlow",
    "data": {
        "type": "DirectReply",
        "category": "Agent Flows",
        "baseClasses": ["DirectReply"],
        "label": "Reply",
        "name": "directReplyAgentflow",
        "version": 1.1,
        "description": "Return final answer or fallback message to user",
        "color": "#F87171",
        "hideInput": false,
        "inputs": {
            "replyMessage": "{{$flow.state.final_answer}}"
        },
        "inputAnchors": [],
        "inputParams": [{ "label": "Message", "name": "replyMessage", "type": "string", "rows": 4, "acceptVariable": true }],
        "outputAnchors": [],
        "outputs": {}
    },
    "width": 200,
    "height": 72,
    "position": { "x": 2316.5, "y": -60 },
    "selected": false
}
```

-   **Message** (primary path, from Síntesis): `{{$flow.state.final_answer}}`
-   **Fallback message** (from Condition false branch): `"No relevant information was found in available knowledge sources for your query. Please try rephrasing or narrowing your search."`

**Note on fallback**: AgentFlow v2 DirectReply can have only ONE `replyMessage`. When the Condition's false branch routes directly to DirectReply, two separate DirectReply nodes may be needed (one for Síntesis output, one for static fallback message), or the false branch can go through a SetState/Assign node first that sets `final_answer` to the static fallback string.

## Edges (Complete Graph)

All edges use `type: "agentFlow"` with `sourceHandle`/`targetHandle` matching `outputAnchors` IDs:

| Edge ID                                                                                                            | Source                      | Source Handle                                              | Target                      | Target Handle               | Description                            |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------- | ---------------------------------------------------------- | --------------------------- | --------------------------- | -------------------------------------- |
| `startAgentflow_0-startAgentflow_0-output-startAgentflow-llmAgentflow_0-llmAgentflow_0`                            | `startAgentflow_0`          | `startAgentflow_0-output-startAgentflow`                   | `llmAgentflow_0`            | `llmAgentflow_0`            | User input → Router                    |
| `llmAgentflow_0-llmAgentflow_0-output-llmAgentflow-llmAgentflow_1-llmAgentflow_1`                                  | `llmAgentflow_0`            | `llmAgentflow_0-output-llmAgentflow`                       | `llmAgentflow_1`            | `llmAgentflow_1`            | Router → Lingüista                     |
| `llmAgentflow_1-llmAgentflow_1-output-llmAgentflow-agentAgentflow_0-agentAgentflow_0`                              | `llmAgentflow_1`            | `llmAgentflow_1-output-llmAgentflow`                       | `agentAgentflow_0`          | `agentAgentflow_0`          | Lingüista → Bibliotecario              |
| `agentAgentflow_0-agentAgentflow_0-output-agentAgentflow-agentAgentflow_1-agentAgentflow_1`                        | `agentAgentflow_0`          | `agentAgentflow_0-output-agentAgentflow`                   | `agentAgentflow_1`          | `agentAgentflow_1`          | Bibliotecario → Source Worker          |
| `agentAgentflow_1-agentAgentflow_1-output-agentAgentflow-conditionAgentflow_0-conditionAgentflow_0`                | `agentAgentflow_1`          | `agentAgentflow_1-output-agentAgentflow`                   | `conditionAgentflow_0`      | `conditionAgentflow_0`      | Source Worker → Condition              |
| `conditionAgentflow_0-conditionAgentflow_0-output-goEvidence-customFunctionAgentflow_0-customFunctionAgentflow_0`  | `conditionAgentflow_0`      | `conditionAgentflow_0-output-goEvidence`                   | `customFunctionAgentflow_0` | `customFunctionAgentflow_0` | True: has results → Evidence Merger    |
| `conditionAgentflow_0-conditionAgentflow_0-output-goFallback-directReplyAgentflow_0-directReplyAgentflow_0`        | `conditionAgentflow_0`      | `conditionAgentflow_0-output-goFallback`                   | `directReplyAgentflow_0`    | `directReplyAgentflow_0`    | False: empty → Direct Reply (fallback) |
| `customFunctionAgentflow_0-customFunctionAgentflow_0-output-customFunctionAgentflow-llmAgentflow_2-llmAgentflow_2` | `customFunctionAgentflow_0` | `customFunctionAgentflow_0-output-customFunctionAgentflow` | `llmAgentflow_2`            | `llmAgentflow_2`            | Evidence Merger → Síntesis             |
| `llmAgentflow_2-llmAgentflow_2-output-llmAgentflow-directReplyAgentflow_0-directReplyAgentflow_0`                  | `llmAgentflow_2`            | `llmAgentflow_2-output-llmAgentflow`                       | `directReplyAgentflow_0`    | `directReplyAgentflow_0`    | Síntesis → Direct Reply                |

### Edge Data Format

```json
{
    "source": "startAgentflow_0",
    "sourceHandle": "startAgentflow_0-output-startAgentflow",
    "target": "llmAgentflow_0",
    "targetHandle": "llmAgentflow_0",
    "data": {
        "isHumanInput": false,
        "sourceColor": "#7EE787",
        "targetColor": "#22D3EE"
    },
    "type": "agentFlow",
    "id": "startAgentflow_0-startAgentflow_0-output-startAgentflow-llmAgentflow_0-llmAgentflow_0"
}
```

The `sourceColor` and `targetColor` in edge `data` match the node's `color` field. The `id` is the compound string `{source}-{sourceHandle}-{target}-{targetHandle}`.

### Tool Connections (Agent Source Worker)

Tool nodes are NOT sequential edges. They're wired as input references on the Agent node's `agentTools` array:

```
retrieverGlobal_0  ──┐
retrieverNyc_0     ──┤
retrieverMadeira_0 ──┤
mcpOpenAlex_0      ──┼── [agentAgentflow_1].inputs.agentTools
mcpPtData_0        ──┤
mcpMadeiraData_0   ──┤
mcpUeData_0        ──┘
```

The Agent node's `agentTools` field contains the node IDs of all connected tool nodes. Flowise resolves the wiring internally when rendering the canvas.

## Credentials & Infrastructure

| Resource                     | Value                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| OpenRouter API               | `ddeb2757-f8e2-4ed7-9647-5a113332b432` (stored as `FLOWISE_CREDENTIAL_ID` inside `agentModelConfig`/`llmModelConfig`) |
| Supabase API                 | `0df85d26-749b-4fac-9a88-7399663a3099`                                                                                |
| HuggingFace API (Embeddings) | `aae7223f-da1b-47d5-bb26-1a2f1b2a3d5b`                                                                                |
| Supabase Project             | `qklwlyoenlffxnwrkxuc` (GoberAI-dev)                                                                                  |
| Embedding Model              | `intfloat/multilingual-e5-large-instruct` (1024 dims)                                                                 |
| OpenRouter Base URL          | `https://openrouter.ai/api/v1`                                                                                        |

### RPC Functions (DDL to be applied to Supabase)

```sql
-- Wrapper for knowledge.global (435K docs)
CREATE OR REPLACE FUNCTION knowledge.match_global_flowise(
    query_embedding vector,
    match_threshold double precision DEFAULT 0.0,
    match_count integer DEFAULT 10,
    filter_document_id text DEFAULT NULL,
    filter jsonb DEFAULT '{}'
) RETURNS TABLE (
    id integer,
    content text,
    metadata jsonb,
    similarity double precision
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.content,
        d.metadata,
        1 - (d.embedding <=> query_embedding) AS similarity
    FROM knowledge.documents d
    WHERE d.embedding IS NOT NULL
      AND d.namespace NOT IN ('madeira')
      AND (filter_document_id IS NULL OR d.id::text = filter_document_id)
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Wrapper for knowledge.madeira (164K docs)
CREATE OR REPLACE FUNCTION knowledge.match_madeira_flowise(
    query_embedding vector,
    match_threshold double precision DEFAULT 0.0,
    match_count integer DEFAULT 10,
    filter_document_id text DEFAULT NULL,
    filter jsonb DEFAULT '{}'
) RETURNS TABLE (
    id integer,
    content text,
    metadata jsonb,
    similarity double precision
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.content,
        d.metadata,
        1 - (d.embedding <=> query_embedding) AS similarity
    FROM knowledge.documents d
    WHERE d.embedding IS NOT NULL
      AND d.namespace = 'madeira'
      AND (filter_document_id IS NULL OR d.id::text = filter_document_id)
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

**Note**: `match_nyc_flowise` already exists with the correct Flowise-compatible signature. The two above are NEW wrappers.

## Error Handling Strategy

| Node                           | Failure Mode                    | Handling                                                                                                               |
| ------------------------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| LLM Router                     | Model unavailable / timeout     | Flow State `router_result` stays `{}`; Lingüista defaults to `en/global/general_question`                              |
| LLM Lingüista PRE              | Translation fails               | Passthrough: `search_queries.translations` = `{}`; Bibliotecario uses original query normalized                        |
| Agent Bibliotecario            | Model rate-limited              | Retry once (built into Agent node); if still fails, flow state written with error → Condition routes to empty fallback |
| Agent Source Worker            | Tool errors / no results        | Aggregates partial results; error entries flagged; empty array `[]` triggers fallback path                             |
| Condition                      | State key missing               | Defaults to `false` branch (empty → fallback message)                                                                  |
| CustomFunction Evidence Merger | JS execution error              | Returns `[]` → Síntesis sees empty evidence → generates "no data" response in user language                            |
| LLM Síntesis                   | Model unavailable               | Direct Reply outputs raw evidence array as fallback (via fallback path)                                                |
| Direct Reply                   | Always succeeds (static output) | N/A                                                                                                                    |

**Propagation**: Errors write error objects to state keys. Downstream nodes check for error flags before processing. All paths converge at Direct Reply — user always gets a message.

## Implementation Order

Priority sequence for `flow-ing` agent when Flowise server is available:

1. **RPC Functions** (blocking prerequisite) — `match_global_flowise`, `match_madeira_flowise` on Supabase
2. **Start Node** (`startAgentflow_0`) — declare all 12 flow state keys in `startState`
3. **LLM Router** (`llmAgentflow_0`) — JSON classification (can test independently)
4. **LLM Lingüista PRE** (`llmAgentflow_1`) — translation (depends on Router output, testable standalone)
5. **RetrieverTool nodes** (3x) + **CustomMcpTool nodes** (4x) — tool infrastructure
6. **Agent Bibliotecario** (`agentAgentflow_0`) — plan generation (needs flow state from Lingüista)
7. **Agent Source Worker** (`agentAgentflow_1`) — execution (needs tools + plan; most complex node)
8. **Condition Node** (`conditionAgentflow_0`) — fallback branching
9. **CustomFunction Evidence Merger** (`customFunctionAgentflow_0`) — dedup + validate
10. **LLM Síntesis Final** (`llmAgentflow_2`) — response generation
11. **Direct Reply** (`directReplyAgentflow_0`) — terminal node
12. **End-to-end Test Prediction** — smoke test with real queries

## Trade-offs Summary

| Trade-off                        | Decision                    | Why                                                                                                       |
| -------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------- |
| Agent Knowledge vs RetrieverTool | RetrieverTool               | Works with Supabase RPC wrappers; explicit query control; easier debugging                                |
| One Agent model vs two           | One (Gemma for both Agents) | Only free tool-calling model available; non-Agent nodes use different models so rate limiting is isolated |
| Condition vs Condition Agent     | Condition (deterministic)   | Empty-array check is boolean logic, not AI reasoning                                                      |
| Lingüista POST                   | Skipped (MVP)               | Síntesis handles target language directly; reduces latency by one LLM call                                |
| INTERNAL_RESEARCH MCP            | Excluded                    | stdio transport unsupported by Flowise CustomMcpTool; HTTP MCPs retained                                  |
| Parallel vs Sequential search    | Sequential (MVP)            | AgentFlow v2 supports parallelism but sequential simplifies debugging; parallel is future enhancement     |

## Testing Strategy

| Layer                  | What                                            | How                                                                           |
| ---------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| Unit (node)            | Each LLM/Agent prompt produces correct JSON     | Test Prediction with single-node queries                                      |
| Integration (pipeline) | Full flow end-to-end                            | Test Prediction with real queries: es→nyc, pt→madeira, en→global, empty input |
| RPC                    | `match_global_flowise`, `match_madeira_flowise` | Supabase SQL test: call with known embedding, verify results                  |
| Fallback               | Empty results → user message                    | Test Prediction with impossible query, verify fallback message                |
| Edge case              | Empty input, >1000 chars, unsupported language  | Test Prediction per spec scenarios                                            |
