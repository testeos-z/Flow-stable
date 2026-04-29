# Flowise Flow Types — Reference Guide

Guía para decidir qué tipo de flow usar según el caso de uso. Cubre los 5 tipos disponibles en Flowise: CHATFLOW, AGENTFLOW V2, MULTIAGENT, SEQUENTIAL AGENTS y ASSISTANT.

---

## 1. CHATFLOW

**Qué es**: El tipo original de Flowise. Canvas libre donde arrastrás nodos de Categorías como Chains, Chat Models, Tools, Embeddings, Vector Stores, etc. No hay estructura forzada — conectás nodos y el framework resuelve el camino de ejecución.

**Internamente**: Usa `RunnableSequence` y cadenas de LangChain. La API de Prediction invoca la cadena con la pregunta del usuario como input. Sin workflow engine — flujo de datos nodo a nodo vía LangChain.

**Mejor para**:

-   RAG (Document Loader → Splitter → Embeddings → Vector Store → Retriever → LLM)
-   Operaciones simples de cadena (LLM Chain, Conversation Chain, SQL Chain)
-   File uploads a vector stores (Pinecone, Milvus, Postgres, Qdrant, Upstash)
-   API chains (GET/POST, OpenAPI)
-   Cuando necesitás algo rápido, simple, sin agentes ni routing complejo

**NO usar cuando**: Necesitás selección autónoma de tools por un LLM, razonamiento multi-step, ejecución paralela, branching condicional con loops, Human-in-the-Loop, o estado compartido entre agentes.

### Nodos disponibles

| Categoría              | Disponible       | Notas                                                        |
| ---------------------- | ---------------- | ------------------------------------------------------------ |
| Chat Models (36)       | ✅ Todos         | OpenAI, Anthropic, Gemini, Ollama, OpenRouter, etc.          |
| Embeddings (18)        | ✅ Todos         | OpenAI, Cohere, HuggingFace, Ollama, etc.                    |
| Memory (15)            | ✅ Todos         | Buffer, Window, Summary, Redis, Postgres, etc.               |
| Chains (13)            | ✅ Todos         | LLM Chain, Retrieval QA, SQL Chain, API Chain, etc.          |
| Tools (39)             | ✅ Todos         | Calculator, Serper, Tavily, Chatflow Tool, Custom Tool, etc. |
| MCP Tools (11)         | ✅ Todos         | Custom MCP, GitHub, Slack, PostgreSQL, etc.                  |
| Vector Stores (26)     | ✅ Todos         | Supabase, Pinecone, Qdrant, Chroma, etc.                     |
| Document Loaders (41)  | ✅ Todos         | PDF, CSV, Web, GitHub, Notion, Confluence, etc.              |
| Text Splitters (6)     | ✅ Todos         | Recursive Character, Markdown, Code, etc.                    |
| Retrievers (15)        | ✅ Todos         | Vector Store Retriever, Multi Query, Cohere Rerank, etc.     |
| Output Parsers (4)     | ✅ Todos         | CSV, List, Structured                                        |
| Cache (5)              | ✅ Todos         | In-Memory, Redis, Momento                                    |
| Moderation (2)         | ✅ Todos         | OpenAI Moderation, Simple Prompt                             |
| Prompts (3)            | ✅ Todos         | Chat Prompt, Few Shot, Prompt Template                       |
| Utilities (5)          | ✅ Todos         | JS Function, Variables, IfElse                               |
| Sequential Agents (11) | ❌ No disponible |                                                              |
| Multi Agents (2)       | ❌ No disponible |                                                              |
| Agent Flows V2 (10)    | ❌ No disponible |                                                              |

### Cómo invocar otros flujos

-   **Chatflow Tool**: Seleccioná cualquier CHATFLOW deployado y llamalo como tool. El LLM decide cuándo usarlo.
-   **Agent as Tool**: Usá un agentflow como tool (dentro de Tool Agent).
-   **Custom Tool**: JS para llamar `/api/v1/prediction/<flow-id>`.

### Cómo ser invocado

-   Prediction API: `POST /api/v1/prediction/{id}` con `{question: "..."}`
-   Embed widget: `<script>` con `Chatbot.init()`
-   MCP tools si está configurado

---

## 2. AGENTFLOW (V2)

**Qué es**: La nueva arquitectura. Superset de Chatflow + Assistant. Usa nodos nativos de Flowise (no cadenas LangChain). Todo flujo tiene un nodo `Start` obligatorio, fluye por nodos especializados, y termina en `Direct Reply`. Ejecución con cola de dependencias explícita.

**Internamente**: Workflow engine custom con dependency tracking, execution queue y `$flow.state` como key-value store en runtime. Soporta Server-Sent Events para streaming. Checkpoint-based persistence para agentes de larga duración.

**Mejor para**:

-   Orquestación de workflows complejos (loops, condiciones, branching)
-   Colaboración multi-agente con estado compartido
-   Human-in-the-Loop (approval gates, feedback)
-   Ejecución paralela de nodos (múltiples ramas simultáneas)
-   Pipelines de transformación de datos
-   Cualquier caso que requiera control de flujo explícito

**NO usar cuando**: RAG extremadamente simple o single LLM call — un Chatflow es más rápido de armar.

### Nodos (14 especializados)

| Nodo                | Categoría   | Propósito                                                             |
| ------------------- | ----------- | --------------------------------------------------------------------- |
| **Start**           | Core        | Punto de entrada. Define Flow State inicial, input type (chat o form) |
| **LLM Node**        | Core        | Llamada LLM con JSON Structured Output opcional                       |
| **Agent Node**      | Core        | Agente autónomo con tools, knowledge stores, memory                   |
| **Tool Node**       | Core        | Ejecución determinística de tool (sin selección del LLM)              |
| **Retriever Node**  | Core        | Consulta Document Stores directamente                                 |
| **HTTP Node**       | Core        | Requests HTTP (GET/POST/PUT/DELETE/PATCH)                             |
| **Condition**       | Logic       | Branching por reglas (comparaciones string/number/boolean)            |
| **Condition Agent** | Logic       | Branching por LLM vía clasificación de escenarios                     |
| **Iteration**       | Logic       | For-each loop sobre arrays                                            |
| **Loop**            | Logic       | Redirige a nodo anterior (max loop count limit)                       |
| **Human Input**     | HITL        | Pausa para aprobación/feedback humano con proceed/reject              |
| **Direct Reply**    | Output      | Envía mensaje final al usuario, termina rama                          |
| **Custom Function** | Logic       | Ejecuta JavaScript server-side                                        |
| **Execute Flow**    | Integration | Invoca otro Chatflow/AgentFlow como sub-workflow                      |

**Tools**: Las 39 Tools + 11 MCP Tools se adjuntan a Agent Nodes. Tools built-in (Calculator, CurrentDateTime) no requieren credenciales. Un Agent Node también puede acceder a Document Stores y Vector Stores como knowledge sources (configurado directamente en el Agent Node, no como nodos separados).

**Memory**: Configurado por nodo vía parámetro `Memory` (no como nodo separado). Soporta Buffer, Window, Summary Buffer.

### Cómo invocar otros flujos

-   **Execute Flow Node**: Seleccioná cualquier Chatflow o AgentFlow. Pasá input, config overrides opcionales, recibí el output.
-   **Agent Node + Tools**: El Agent Node puede usar Tools (incluyendo Chatflow Tool, Agent as Tool, MCP tools).

### Cómo ser invocado

-   Prediction API: Mismo endpoint (`POST /api/v1/prediction/{id}`)
-   Embed widget: Igual que Chatflow
-   MCP tools: Igual que Chatflow

---

## 3. MULTIAGENT (Agentflow V1 — Deprecating)

**Qué es**: Sistema de agentes jerárquico sobre LangGraph. Dos tipos de nodo: `Supervisor` (orquestador) + `Worker` (agentes especializados). El Supervisor analiza, descompone en sub-tareas, delega a Workers, agrega resultados, y presenta output final.

**Internamente**: LangGraph con supervisor loop. Workers heredan el Chat Model del Supervisor salvo asignación explícita. Usa Agent Memory (SQLite) para checkpoints. El Supervisor usa `{team_members}` y keyword `FINISH` en su prompt.

**Limitaciones**:

-   Una tarea a la vez (delegación secuencial, sin paralelismo)
-   Un Supervisor por flujo (sin jerarquías anidadas)
-   Sin Human-in-the-Loop

**Mejor para**:

-   Automatizar procesos multi-step lineales (extracción → enriquecimiento → generación)
-   Descomposición simple de tareas secuenciales
-   Setup rápido de team-of-agents sin configurar condition nodes

**NO usar cuando**: Necesitás paralelismo, branching dinámico, HITL, state management custom, o loops.

### Nodos

| Nodo             | Propósito                                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Supervisor**   | Orquestador. Requiere Chat Model (con function calling). Agent Memory opcional. System Prompt configurable con `{team_members}` y `FINISH`. Recursion Limit configurable. |
| **Worker** (× N) | Agentes especializados. Cada uno con System Prompt definiendo su expertise. Puede tener su propio Chat Model. Puede acceder a Tools. Max Iteration configurable.          |

**Tools**: Cada Worker puede tener asignadas cualquiera de las 39 Tools.

**Memory**: Agent Memory (SQLite) conectado al Supervisor.

### Cómo invocar otros flujos

-   Workers pueden usar **Chatflow Tool** o **Agent as Tool** desde su panel de tools.

### Cómo ser invocado

-   Prediction API: Mismo endpoint
-   Embed widget: Igual que Chatflow

---

## 4. SEQUENTIAL AGENTS (Agentflow V1 — Deprecating)

**Qué es**: Abstracción de más bajo nivel sobre LangGraph que Multi-Agent. Un grafo cíclico dirigido (DCG) de 11 nodos especializados. Datos fluyen secuencialmente con control explícito de branching, looping, state, y ejecución paralela.

**Internamente**: LangGraph con checkpoint persistence en SQLite (`checkpoints` table). Soporta ejecución paralela vía branching, State management custom, y HITL vía approval prompts.

**Mejor para**:

-   Sistemas conversacionales dinámicos con branching
-   Workflows complejos con ejecución paralela de nodos
-   Loops de refinamiento iterativo
-   Pipelines multi-agente stateful con estado compartido custom
-   Human-in-the-Loop (aprobar tool execution antes de ejecutar)

**NO usar cuando**: Descomposición simple sin branching — Multi-Agent es más simple. RAG o single LLM call — Chatflow es más simple.

### Nodos (11)

| Nodo                   | Propósito                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| **Start**              | Punto de entrada. Define LLM default, Agent Memory opcional, State Node, Input Moderation. |
| **Agent Memory**       | Memoria persistente (SQLite, Postgres o MySQL). Almacena checkpoints.                      |
| **State**              | Schema de estado custom (key-value con operaciones Replace/Append).                        |
| **Agent**              | LLM con tools. System Prompt, HITL (Require Approval), Update State, Max Iteration.        |
| **LLM Node**           | LLM sin tools. JSON Structured Output, System Prompt, Human Prompt.                        |
| **Tool Node**          | Ejecuta una tool específica de forma determinística.                                       |
| **Condition**          | Branching por reglas (14 operaciones de comparación).                                      |
| **Condition Agent**    | Branching por LLM con JSON Structured Output.                                              |
| **Custom JS Function** | Ejecuta JavaScript en Node.js server-side.                                                 |
| **Execute Flow**       | Invoca otro Chatflow/AgentFlow como sub-workflow.                                          |
| **Loop**               | Redirige ejecución a un nodo nombrado (max 5 loops default).                               |
| **End**                | Termina el camino de ejecución.                                                            |

**Tools**: Agent Nodes acceden a 39 Tools + 11 MCP Tools. Tool Node ejecuta una tool determinísticamente.

**Memory**: Agent Memory Node (SQLite, Postgres, MySQL). Almacena historial y estado custom como checkpoints.

### Cómo invocar otros flujos

-   **Execute Flow**: Seleccioná cualquier Chatflow o AgentFlow por nombre/ID.
-   **Agent Node + Chatflow Tool**
-   **Agent Node + Agent as Tool**

### Cómo ser invocado

-   Prediction API: Mismo endpoint
-   Embed widget: Igual que Chatflow

---

## 5. ASSISTANT

**Qué es**: El tipo más simple. Wraps la API de OpenAI Assistants. Configurás instrucciones, elegís modelo, habilitás tools, y subís archivos para RAG — todo por formulario, sin canvas de nodos.

**Internamente**: Usa OpenAI Assistants API. Archivos se almacenan en el vector store de OpenAI. Tools son nativas de OpenAI (Code Interpreter, File Search, Function Calling). Thread management y tool selection automáticos.

**Mejor para**:

-   Prototipado rápido sin armar grafos
-   Experiencia tipo OpenAI Assistant dentro de Flowise
-   Q&A simple sobre documentos
-   Cuando OpenAI es tu único provider (locked-in)

**NO usar cuando**: Necesitás modelos no-OpenAI, lógica custom de nodos, orquestación compleja, MCP tools, o RAG con vector stores externos.

### Configuración (no basada en nodos)

-   **Model**: Solo modelos OpenAI (GPT-4, GPT-4o, etc.)
-   **Instructions**: Instrucciones a nivel sistema
-   **Temperature / Top P**: Parámetros de generación
-   **Tools**: OpenAI built-in (Code Interpreter, File Search, Functions)
-   **Tool Resources**: Archivos adjuntos para RAG
-   **Credential**: OpenAI API key

### Cómo invocar otros flujos

-   **No puede**. El Assistant es autocontenido en el ecosistema OpenAI.

### Cómo ser invocado

-   Assistant API: `POST /api/v1/assistants/{id}` — endpoint separado del Prediction API
-   Embed widget: No directamente. Necesitás wrapper en Chatflow.

---

## Tabla comparativa

| Criterio                  | CHATFLOW                   | AGENTFLOW V2                    | MULTIAGENT V1                 | SEQUENTIAL V1                  | ASSISTANT                                |
| ------------------------- | -------------------------- | ------------------------------- | ----------------------------- | ------------------------------ | ---------------------------------------- |
| **Arquitectura**          | LangChain chains           | Engine nativo Flowise           | LangGraph (alto nivel)        | LangGraph (bajo nivel)         | OpenAI Assistants API                    |
| **Entry point**           | Libre                      | Start (obligatorio)             | Supervisor                    | Start (obligatorio)            | Formulario                               |
| **Paralelismo**           | ❌                         | ✅                              | ❌ (secuencial)               | ✅                             | N/A (OpenAI)                             |
| **Branching condicional** | Limitado (IfElse)          | ✅ Condition + Condition Agent  | ❌ (implícito vía Supervisor) | ✅ Condition + Condition Agent | ❌                                       |
| **Loops**                 | ❌                         | ✅ Loop + Iteration             | ❌                            | ✅ Loop                        | ❌                                       |
| **Human-in-the-Loop**     | ❌                         | ✅ Human Input + Agent approval | ❌                            | ✅ AgentTool approval          | ❌                                       |
| **Shared State**          | ❌ Solo variables          | ✅ `$flow.state`                | ❌ Solo implícito             | ✅ Custom State                | ❌                                       |
| **Memory**                | 15 tipos (nodo externo)    | Per-node (3 tipos)              | Agent Memory (SQLite)         | Agent Memory (3 DBs)           | Thread-based (OpenAI)                    |
| **Chat Models**           | 36 (todos)                 | 36 (todos)                      | 36 (todos)                    | 36 (todos)                     | Solo OpenAI                              |
| **Tools**                 | 39 + 11 MCP                | 39 + 11 MCP (vía Agent Node)    | 39 (vía Workers)              | 39 + 11 MCP                    | Code Interpreter, File Search, Functions |
| **Vector Stores**         | 26 (todos)                 | Vía Agent Node knowledge        | Vía Worker tools              | Vía Agent/Tool Node            | Solo OpenAI                              |
| **Invocar otros flows**   | Chatflow Tool, Custom Tool | Execute Flow node               | Chatflow Tool (vía Worker)    | Execute Flow, Chatflow Tool    | ❌ No puede                              |
| **Complejidad**           | Baja                       | Alta                            | Media                         | Alta                           | Muy baja                                 |
| **Streaming**             | ✅ SSE                     | ✅ SSE + updates                | ✅                            | ✅                             | ✅ (OpenAI)                              |
| **Prediction API**        | Mismo endpoint             | Mismo endpoint                  | Mismo endpoint                | Mismo endpoint                 | Endpoint separado                        |
| **Embed widget**          | ✅                         | ✅                              | ✅                            | ✅                             | ❌ (necesita wrapper)                    |
| **Estado**                | Stable                     | Activo (futuro)                 | Deprecating                   | Deprecating                    | Entry-level                              |

---

## Árbol de decisión

```
¿Qué necesito construir?
│
├── ¿Solo OpenAI, sin lógica custom, rápido de prototipar?
│   └── ASSISTANT
│       └── Limitado a OpenAI, sin tools externas, sin invocar otros flujos
│
├── ¿RAG simple, single LLM call, o cadena lineal?
│   └── CHATFLOW
│       └── Usá Chatflow Tool para invocar otros flujos
│
├── ¿Agentes con tools, pero sin branching/loops/estado complejo?
│   └── CHATFLOW (Tool Agent) o AGENTFLOW (Agent Node)
│       └── AGENTFLOW si necesitás paralelismo o estado compartido
│
├── ¿Delegación secuencial multi-agente con supervisor?
│   └── MULTIAGENT (Deprecating)
│       └── Una tarea a la vez, sin paralelismo, sin HITL
│
├── ¿Orquestación compleja con paralelismo, branching, loops, HITL, estado custom?
│   └── AGENTFLOW V2 ← RECOMENDADO
│       └── Usá Execute Flow node para componer flujos anidados
│
└── ¿Ya tenés Sequential Agents V1 y necesitás compatibilidad?
    └── SEQUENTIAL AGENTS (Deprecating)
        └── Migrá a AGENTFLOW V2 cuando sea posible
```

---

## Regla práctica para GobernAI

| Agente/Flujo                               | Tipo recomendado | Por qué                                                     |
| ------------------------------------------ | ---------------- | ----------------------------------------------------------- |
| Agentes temáticos (economic, health, etc.) | **CHATFLOW**     | Single-pass, sin tools, invocables como Chatflow Tool       |
| Orquestador (government_master)            | **AGENTFLOW**    | Paralelismo, branching, Execute Flow para invocar temáticos |
| Formateador (format_report_agent)          | **CHATFLOW**     | Single-pass, transformación de texto                        |
| Pipeline completo FACTUM                   | **AGENTFLOW**    | Ejecución secuencial de fases con estado compartido         |
