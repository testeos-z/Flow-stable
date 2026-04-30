---
name: flowise-node-reference
description: >
    Comprehensive reference catalogue of all 302 Flowise nodes, 100 credentials,
    39 tools, 11 MCP tools, and design patterns for building flows.
    Covers Chat Models, Embeddings, Memory, Vector Stores, Document Loaders,
    Tools, Sequential Agents, Agent Flows, Chains, Retrievers, and more.

    RESTRICTED ACCESS: Solo para agentes flow-ing y flow-architect.
    Otros agentes no deben cargar ni consultar este skill.

    Trigger: When flow-ing or flow-architect agents are designing, creating, updating,
    or inspecting flows in Flowise. When selecting nodes, understanding credential
    requirements, choosing the right tool/model/vector store, or deciding between
    flow architectures (RAG, Agent, Sequential, etc.).
---

# Flowise Node Reference

Guía completa para diseñar flujos en Flowise. Este skill cataloga TODOS los nodos disponibles (302), sus credenciales, y patrones de diseño.

## Reference files — load as needed

| File                                       | Contents                                                                                                          | Load when...                                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `references/00-node-catalogue.md`          | Catálogo completo: 302 nodos por categoría con descripción y cuándo usarlos                                       | Necesitás saber qué nodos existen en una categoría o entender qué hace un nodo específico                      |
| `references/01-credential-map.md`          | Mapa completo: 100 credenciales, qué nodos las requieren, cuáles son opcionales                                   | Estás diseñando un flujo y necesitás saber qué credenciales configurar                                         |
| `references/02-design-patterns.md`         | 12+ patrones de diseño: RAG, Agent, Sequential, MCP, búsqueda web, etc.                                           | Necesitás armar un flujo para un caso de uso concreto                                                          |
| `references/03-decision-trees.md`          | Árboles de decisión para elegir modelos, tools, memory, vector stores                                             | Estás indeciso entre varias opciones y querés la mejor según el caso                                           |
| `references/04-flowdata-schema.md`         | Anatomía del flowData: nodes, edges, viewport, handle IDs, inputParams, inputAnchors, outputAnchors               | Necesitás crear o editar un flow por API y entender la estructura JSON del canvas                              |
| `references/05-node-flow-compatibility.md` | **Compatibilidad de nodos con tipos de flujos**: CHATFLOW vs AGENTFLOW. Resuelve errores "Ending node must be..." | ⚠️ **ANTES DE CREAR UN FLOW** — identifica qué tipo de flujo necesitás y qué nodos son válidos como nodo final |

## Quick start — cómo usar este skill

**🔴 ANTES QUE NADA**: Si estás recibiendo errores como `"Ending node must be either a Chain or Agent or Engine"`, lee `references/05-node-flow-compatibility.md` PRIMERO.

1. **Identificá qué tipo de flujo necesitás** → cargá `references/05-node-flow-compatibility.md` (CHATFLOW vs AGENTFLOW)
2. **Elegí el patrón de diseño** → cargá `references/02-design-patterns.md`
3. **Seleccioná nodos específicos** → cargá `references/00-node-catalogue.md`
4. **Verificá credenciales** → cargá `references/01-credential-map.md`
5. **Entendé la estructura del flowData** → cargá `references/04-flowdata-schema.md` (antes de crear/editar un flow por API)
6. **Validá con MCP tools** → usá `flow-control_get_node()` para ver detalles en tiempo real

## Dynamic MCP tools complementarias

Siempre que diseñes un flujo, combiná este skill con las herramientas MCP:

| Tool                                           | Para qué                                            |
| ---------------------------------------------- | --------------------------------------------------- |
| `flow-control_list_nodes()`                    | Listar todos los nodos del servidor actual          |
| `flow-control_get_nodes_by_category(category)` | Filtrar nodos por categoría                         |
| `flow-control_get_node(nodeName)`              | Ver detalles de un nodo específico (inputs, params) |

## Categorías disponibles en el servidor

| Categoría            | Nodos | Propósito                                                       |
| -------------------- | :---: | --------------------------------------------------------------- |
| Chat Models          |  36   | Modelos de lenguaje para chat (OpenAI, Anthropic, local, etc.)  |
| Embeddings           |  18   | Generación de vectores/embeddings                               |
| Memory               |  15   | Memoria de conversación (buffer, ventana, resumen, persistente) |
| Chains               |  13   | Cadenas de procesamiento (RAG, QA, SQL, Graph)                  |
| Tools                |  39   | Herramientas para agentes (búsqueda web, APIs, etc.)            |
| Tools (MCP)          |  11   | Tools via Model Context Protocol (GitHub, Slack, etc.)          |
| Sequential Agents    |  11   | Flujos paso a paso (Start → Agent → Condition → End)            |
| Agent Flows          |  10   | Nodos internos de agentflows (no secuenciales)                  |
| Document Loaders     |  41   | Carga de documentos (PDF, web, GitHub, Notion, etc.)            |
| Vector Stores        |  26   | Almacenes vectoriales (Supabase, Pinecone, Qdrant, etc.)        |
| Retrievers           |  15   | Recuperación desde vector stores                                |
| LLMs                 |  12   | Modelos LLM vía LlamaIndex (deprecating)                        |
| Text Splitters       |   6   | División de texto en chunks                                     |
| Output Parsers       |   4   | Parseo de salida estructurada                                   |
| Prompts              |   3   | Templates de prompts                                            |
| Cache                |   5   | Cache de respuestas y embeddings                                |
| Moderation           |   2   | Moderación de contenido                                         |
| Multi Agents         |   2   | Supervisor + Worker                                             |
| Utilities            |   5   | JS Function, Variables, IfElse, Sticky Note                     |
| Engine               |   4   | Motores de consulta LlamaIndex                                  |
| Graph                |   1   | Neo4j                                                           |
| Analytics            |   1   | LangFuse (tracing)                                              |
| Record Manager       |   3   | Gestión de documentos                                           |
| Response Synthesizer |   4   | Síntesis de respuestas LlamaIndex                               |
