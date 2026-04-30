# Node Flow Compatibility — ¿Dónde puedo usar cada nodo?

Este documento aclara **explícitamente** en qué tipos de flujos Flowise puedes usar cada nodo. Resuelve el error "Ending node must be either a Chain or Agent or Engine".

## Tipos de flujos en Flowise

| Tipo de flujo | Propósito                                                       | Nodo final requerido                                            | Ejemplo                             |
| ------------- | --------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------- |
| **CHATFLOW**  | Chat simple + herramientas. Interfaz web. Llamadas API.         | **Chain** o **Agent** o **Engine**                              | Chatbot, RAG, Customer support      |
| **AGENTFLOW** | Flujos complejos multi-paso. Bifurcaciones, condiciones, loops. | **Agent Flows nodes** (Agent, Condition, LLM, Tool, Loop, etc.) | Orquestación, multi-agent, procesos |

---

## Chat Models — Compatibilidad

| Nodo                                 | CHATFLOW | AGENTFLOW | Notas                                                                                    |
| ------------------------------------ | :------: | :-------: | ---------------------------------------------------------------------------------------- |
| OpenAI / Azure OpenAI / Anthropic    |    ✅    |    ✅     | Input a `Tool Agent`, `Conversational Agent` (CHATFLOW) o nodo `Agent`/`LLM` (AGENTFLOW) |
| Google Gemini / VertexAI             |    ✅    |    ✅     | Ídem                                                                                     |
| Ollama / MistralAI / Groq            |    ✅    |    ✅     | Ídem                                                                                     |
| **OpenRouter**                       |    ✅    |    ✅     | Gateway. Úsalo como Chat Model estándar                                                  |
| HuggingFace / TogetherAI / Fireworks |    ✅    |    ✅     | Ídem                                                                                     |

**Regla**: Chat Models son **inputs** a nodos que generan cadenas. NUNCA son nodo final por sí solos.

---

## Embeddings — Compatibilidad

| Nodo                                  | CHATFLOW | AGENTFLOW | Uso                                                        |
| ------------------------------------- | :------: | :-------: | ---------------------------------------------------------- |
| OpenAI Embedding / Cohere / Mistral   |    ✅    |    ✅     | Input a `Document Upserter` + `Vector Store` o `Retriever` |
| Google Gemini / VertexAI Embedding    |    ✅    |    ✅     | Ídem                                                       |
| Local: Ollama / HuggingFace Embedding |    ✅    |    ✅     | Ídem                                                       |

**Regla**: Embeddings son **inputs** a pipelines RAG. Nunca son nodo final.

---

## Memory — Compatibilidad

| Nodo                                      | CHATFLOW | AGENTFLOW | Uso                                                            |
| ----------------------------------------- | :------: | :-------: | -------------------------------------------------------------- |
| **Buffer Memory**                         |    ✅    |    ✅     | Conectar a `Tool Agent` (CHATFLOW) o `Agent`/`LLM` (AGENTFLOW) |
| **Buffer Window Memory**                  |    ✅    |    ✅     | Ídem. Controla últimos N mensajes                              |
| **Conversation Summary**                  |    ✅    |    ✅     | Ídem. Resumen automático                                       |
| **Conversation Summary Buffer**           |    ✅    |    ✅     | Híbrido: recomendado para contextos largos (atlas, reportes)   |
| **Agent Memory (SQLite/Postgres/MySQL)**  |    ❌    |    ✅     | SOLO para `Sequential Agent` o nodos de AGENTFLOW              |
| **Redis / Upstash / MongoDB Chat Memory** |    ✅    |    ✅     | Persisten. Para producción                                     |
| **Zep Memory**                            |    ✅    |    ✅     | Con perfil de usuario                                          |
| **Mem0**                                  |    ✅    |    ✅     | Memoria con aprendizaje                                        |

**Regla**: Memory es **input** a agentes/chains. Nunca es nodo final.

---

## Chains — Compatibilidad

| Nodo                            | CHATFLOW | AGENTFLOW | Es nodo final?                              |
| ------------------------------- | :------: | :-------: | ------------------------------------------- |
| **Conversation Chain**          |    ✅    |    ❌     | Sí (pero deprecado, usa Agents en CHATFLOW) |
| **LLM Chain**                   |    ✅    |    ❌     | Sí. Prompt simple → LLM                     |
| **Retrieval QA Chain**          |    ✅    |    ❌     | Sí. RAG básico                              |
| **Conversational Retrieval QA** |    ✅    |    ❌     | Sí. RAG + chat history                      |
| **Multi Retrieval QA**          |    ✅    |    ❌     | Sí. Múltiples retrievers                    |
| **SQL Database Chain**          |    ✅    |    ❌     | Sí. SQL en lenguaje natural                 |
| **Graph Cypher QA**             |    ✅    |    ❌     | Sí. Consultas Neo4j                         |
| **OpenAPI Chain**               |    ✅    |    ❌     | Sí. LLM + OpenAPI                           |

**Regla**: Chains son **SOLO para CHATFLOW**. Son nodos finales válidos.

---

## Agents — Compatibilidad

| Nodo                           | CHATFLOW | AGENTFLOW | Es nodo final?                                                          |
| ------------------------------ | :------: | :-------: | ----------------------------------------------------------------------- |
| **Tool Agent**                 |    ✅    |    ❌     | Sí. Agente con function calling + tools. Ideal para `environment_agent` |
| **Conversational Agent**       |    ✅    |    ❌     | Sí. Chat + tools                                                        |
| **Reaction Agent** (con tools) |    ✅    |    ❌     | Sí. ReAct pattern                                                       |
| **OpenAPI Agent**              |    ✅    |    ❌     | Sí. Agente para APIs OpenAPI                                            |
| **XML Agent**                  |    ✅    |    ❌     | Sí. XML parsing                                                         |
| **Structured Chat Agent**      |    ✅    |    ❌     | Sí. Output estructurado                                                 |
| **Zero-Shot React**            |    ✅    |    ❌     | Sí. Sin few-shot examples                                               |

**Regla**: Agents son **SOLO para CHATFLOW** (no existen como nodo independiente en AGENTFLOW). Son nodos finales válidos.

### Nota importante sobre "Agent" en AGENTFLOW

En AGENTFLOW existe un nodo llamado **"Agent"** (categoría Agent Flows) que es diferente. Es un nodo intermedio, no un nodo final. No es lo mismo que `Tool Agent` de CHATFLOW.

---

## Agent Flows Nodes — AGENTFLOW ONLY

Estos nodos **SOLO existen en AGENTFLOW** y **NO se pueden usar en CHATFLOW**.

| Nodo                   | ¿Nodo final? | Uso                                                                                    |
| ---------------------- | :----------: | -------------------------------------------------------------------------------------- |
| **Agent**              |      ❌      | Agente con tools en AGENTFLOW. Requiere conectar a otro nodo o ser entrada a condición |
| **LLM**                |      ❌      | LLM sin tools. Genera texto. Requiere conexión a siguiente nodo                        |
| **Tool Node**          |      ❌      | Ejecuta UN tool específico. Intermedio                                                 |
| **Condition**          |      ❌      | If/Else sobre variables. Bifurca el flujo                                              |
| **Condition Agent**    |      ❌      | LLM decide ruta. Bifurca semánticamente                                                |
| **Custom JS Function** |      ❌      | Código arbitrario. Intermedio                                                          |
| **HTTP / Requests**    |      ❌      | Llamada HTTP. Intermedio                                                               |
| **Direct Reply**       |      ✅      | Respuesta directo al usuario. **Nodo final válido**                                    |
| **Execute Flow**       |      ✅      | Ejecuta otro chatflow/agentflow. **Nodo final válido**                                 |
| **Loop**               |      ❌      | Vuelve atrás. Requiere estar antes de otro nodo                                        |
| **Human Input**        |      ✅      | Solicita aprobación humana. **Nodo final válido**                                      |
| **Iteration**          |      ❌      | Itera sobre array. Intermedio                                                          |

**Regla**: En AGENTFLOW, el nodo final debe ser uno de: `Direct Reply`, `Execute Flow`, `Human Input`, o un nodo que tenga outputs y esté conectado a uno de estos.

---

## Tools — Compatibilidad

| Tipo          | Nodo                         | CHATFLOW | AGENTFLOW | Uso                                                   |
| ------------- | ---------------------------- | :------: | :-------: | ----------------------------------------------------- |
| **Search**    | Tavily, BraveSearch, Serper  |    ✅    |    ✅     | Input a `Tool Agent` (CHATFLOW) o `Agent` (AGENTFLOW) |
| **Math**      | Calculator                   |    ✅    |    ✅     | Ídem                                                  |
| **Web**       | Web Browser                  |    ✅    |    ✅     | Ídem                                                  |
| **API**       | Requests, OpenAPI Toolkit    |    ✅    |    ✅     | Ídem                                                  |
| **Data**      | Gmail, Google Drive, Jira    |    ✅    |    ✅     | Ídem                                                  |
| **Flow**      | Chatflow Tool, Agent as Tool |    ✅    |    ✅     | Delegar a otro flujo                                  |
| **Custom**    | Custom Tool, Chain Tool      |    ✅    |    ✅     | Tools personalizadas                                  |
| **Retriever** | Retriever Tool               |    ✅    |    ✅     | Búsqueda en vector store                              |
| **MCP Tools** | (todos)                      |    ✅    |    ✅     | Vía Model Context Protocol                            |

**Regla**: Tools son **inputs** a agentes. Nunca son nodos finales.

---

## Document Loaders — Compatibilidad

| Nodo                           | CHATFLOW | AGENTFLOW | Uso                                                      |
| ------------------------------ | :------: | :-------: | -------------------------------------------------------- |
| Todos (PDF, Web, GitHub, etc.) |    ✅    |    ✅     | Input a `Document Upserter` (para indexar) o `RAG chain` |

**Regla**: Document Loaders son **inputs** a pipelines de indexación. Nunca son nodos finales.

---

## Vector Stores — Compatibilidad

| Nodo                                     | CHATFLOW | AGENTFLOW | Uso                                                                                           |
| ---------------------------------------- | :------: | :-------: | --------------------------------------------------------------------------------------------- |
| Todos (Supabase, Pinecone, Qdrant, etc.) |    ✅    |    ✅     | Input a `Retriever` → luego a `RAG Chain` (CHATFLOW) o `Retriever Tool` → `Agent` (AGENTFLOW) |

**Regla**: Vector Stores son **inputs** a retrievers. Nunca son nodos finales.

---

## Retrievers — Compatibilidad

| Nodo  | CHATFLOW | AGENTFLOW | Uso                                                           |
| ----- | :------: | :-------: | ------------------------------------------------------------- |
| Todos |    ✅    |    ✅     | Input a `RAG Chain` (CHATFLOW) o `Retriever Tool` (AGENTFLOW) |

**Regla**: Retrievers son **inputs** a chains/tools. Nunca son nodos finales.

---

## Sequential Agents — AGENTFLOW ONLY

Estos nodos **SOLO existen en AGENTFLOW** tipo `SEQUENTIAL AGENT`.

| Nodo          | Uso                                     |
| ------------- | --------------------------------------- |
| **Start**     | Punto de entrada. Define modelo inicial |
| **Agent**     | Agente con tools en contexto secuencial |
| **LLM Node**  | LLM sin tools                           |
| **Tool Node** | Ejecuta un tool puntual                 |
| **Condition** | Bifurcación                             |
| **End**       | Fin del grafo secuencial                |

**Regla**: Estos nodos **SOLO para Sequential Agent type**, no para regular AGENTFLOW ni CHATFLOW.

---

## Utilities — Compatibilidad

| Nodo                   | CHATFLOW | AGENTFLOW | Es nodo final?           |
| ---------------------- | :------: | :-------: | ------------------------ |
| **Custom JS Function** |    ❌    |    ✅     | No, intermedio           |
| **IfElse Function**    |    ✅    |    ✅     | No, intermedio (bifurca) |
| **Set/Get Variable**   |    ✅    |    ✅     | No, intermedios          |
| **Sticky Note**        |    ✅    |    ✅     | No, solo documentación   |

---

## Resolución: Error "Ending node must be either a Chain or Agent or Engine"

### Síntomas

```
Error: Ending node must be either a Chain or Agent or Engine
```

### Causas

1. Estás usando un nodo `LLM` (de Agent Flows) como **nodo final en CHATFLOW**
2. Estás usando un nodo intermedio (Condition, Custom Function, etc.) como nodo final
3. El nodo final no está conectado a nada o es un tipo inválido

### Solución

**Si querés un CHATFLOW simple:**

-   ✅ Usa `Tool Agent` (con Chat Model + Memory + Tools)
-   ✅ Usa `Conversational Agent` (con Chat Model + Memory)
-   ✅ Usa `Retrieval QA Chain` (RAG)
-   ❌ NO uses nodo `LLM` (ese es para AGENTFLOW)

**Si querés un AGENTFLOW complejo:**

-   ✅ Usa nodos `Agent`, `Condition`, `Direct Reply`, `Execute Flow`, etc.
-   ✅ El nodo **final** debe ser `Direct Reply`, `Execute Flow`, o `Human Input`
-   ❌ NO uses `Chain` nodes (esos son para CHATFLOW)

---

## Matriz Rápida de Compatibilidad

```
┌─────────────────────────────────────────────────────────────────┐
│ CHATFLOW (Nodo final requerido: Chain o Agent o Engine)         │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Tool Agent                                                   │
│ ✅ Conversational Agent                                         │
│ ✅ LLM Chain / Retrieval QA Chain / SQL Chain                   │
│ ❌ LLM Node (del Agent Flows)                                   │
│ ❌ Condition / Custom Function                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ AGENTFLOW (Nodo final: Direct Reply / Execute Flow / Human Input│
├─────────────────────────────────────────────────────────────────┤
│ ✅ Agent + Condition + Direct Reply                             │
│ ✅ LLM + Loop + Direct Reply                                    │
│ ✅ Execute Flow → otro flujo                                    │
│ ❌ Tool Agent (eso es para CHATFLOW)                            │
│ ❌ LLM/Agent sin conexión a nodo final                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Casos de uso prácticos

### Caso 1: `environment_agent` (Agente de Ambiente)

**Tipo de flujo**: CHATFLOW

**Nodos**:

```
ChatOpenRouter (nvidia/nemotron...)
  ↓
Tool Agent [system message = prompt del agente]
  ↓ (inputs)
Buffer Memory
Calculator (tool)
```

**Por qué**: Tool Agent es nodo final válido en CHATFLOW.

---

### Caso 2: Flujo FACTUM principal con múltiples agentes

**Tipo de flujo**: AGENTFLOW

**Nodos**:

```
Start [modelo, memoria]
  ↓
Agent [routing: ¿qué agente?]
  ↓
Condition [según resultado]
  ├─→ Execute Flow [environment_agent]
  ├─→ Execute Flow [economía_agent]
  └─→ Execute Flow [educación_agent]
  ↓
Direct Reply
```

**Por qué**: AGENTFLOW permite bifurcaciones complejas. Nodo final es `Direct Reply`.

---

### Caso 3: RAG + Chat simple

**Tipo de flujo**: CHATFLOW

**Nodos**:

```
[Documents] → Document Loader → Vector Store
                                    ↓
                                Retriever
                                    ↓
ChatOpenAI ----→ Conversational Retrieval QA Chain ← Buffer Memory
```

**Por qué**: Conversational Retrieval QA Chain es nodo final válido.

---

## Referencias

-   [Flowise Docs: CHATFLOW vs AGENTFLOW](https://docs.flowiseai.com/)
-   [Node Catalogue](./00-node-catalogue.md)
-   [Design Patterns](./02-design-patterns.md)
