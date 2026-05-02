# Proposal: Flow Creation Agent Pipeline with Zod Validation

## Intent

Eliminar errores sistemáticos en la creación de chatflows en Flowise (nodos incompletos, modelos sin tool-calling, credenciales mal asignadas, template syntax incorrecta) mediante una arquitectura de agentes con separación estricta de responsabilidades, validación con Zod schemas por nodo, y testing pipeline automatizado.

## Scope

### In Scope

-   Refactorear `flow-architect` como **orquestador READ-ONLY** (sin acceso a MCPs de escritura en Flowise)
-   Crear **agentes especialistas por categoría de nodo** (chat-models, vector-stores, embeddings, memory, tools, agents)
-   Cada specialist entrega JSON de nodo validado con Zod schema específico
-   Refactorear `flow-ing` como **único agente con permiso de escritura** en Flowise
-   Implementar **Zod schemas** para cada tipo de nodo basados en "golden templates" extraídos de la UI
-   Implementar **testing pipeline**: validación per-node + validación de graph + test prediction
-   Catálogo de modelos con capabilities (toolCalling, streaming, free tier)
-   Registry de credenciales (`credentialType → UUID`)
-   Template syntax validator (`{{nodeId.data.instance}}`)

### Out of Scope

-   Cambios al backend de Flowise (`packages/server`)
-   Cambios al MCP server de Flowise (`packages/flowise-mcp-server`)
-   Modificación de la UI de Flowise
-   Migración de flows existentes (solo nuevos flows usan el pipeline)

## Capabilities

### New Capabilities

-   `node-specialist-chat-models`: Crea/valida nodos de chat models (OpenRouter, Anthropic, Google, etc.)
-   `node-specialist-vector-stores`: Crea/valida nodos de vector stores (Supabase, Pinecone, etc.)
-   `node-specialist-embeddings`: Crea/valida nodos de embeddings (HuggingFace, OpenAI, etc.)
-   `node-specialist-memory`: Crea/valida nodos de memory (Buffer, Window, etc.)
-   `node-specialist-tools`: Crea/valida nodos de tools (Retriever, MCP, Custom, etc.)
-   `node-specialist-agents`: Crea/valida nodos de agents (Tool Agent, Conversational, etc.)
-   `flow-assembler`: Ensambla nodes + edges en flowData completo validado
-   `flow-testing-pipeline`: Ejecuta tests de validación y prediction antes de guardar

### Modified Capabilities

-   `flow-architect`: Pasa de "planificador con acceso a escritura" a "orquestador READ-ONLY". Solo diseña estructura y delega a specialists.
-   `flow-ing`: Pasa de "agente que ejecuta todo" a "único executor con monopolio de escritura + testing pipeline"

## Approach

### 1. Golden Templates Extraction

Drag cada tipo de nodo en la UI de Flowise, capturar el JSON exacto via API (`get_chatflow` de un flow con ese nodo). Ese JSON es la base del Zod schema.

### 2. Node Specialist Agents

Cada specialist es un skill con:

-   Conocimiento profundo de su categoría de nodos
-   Zod schema para validar estructura completa del nodo
-   Reglas de negocio (ej: "si el flow requiere toolCalling, rechazar modelos que no lo soporten")
-   Retorna: JSON del nodo listo para insertar en flowData

### 3. Flow Architect (Orquestador)

-   Recibe requerimiento del usuario
-   Diseña QUÉ nodos se necesitan y CÓMO se conectan
-   Solicita cada nodo al specialist correspondiente
-   Recibe JSONs validados
-   Ensambla flowData con edges automáticos
-   Valida graph completo (sin huérfanos, sin ciclos)
-   Pasa flowData + test plan a flow-ing

### 4. Flow-Ing (Executor)

-   Recibe flowData validado de flow-architect
-   Ejecuta testing pipeline:
    1. Zod validation per node
    2. Full flowData schema validation
    3. Graph validation
    4. Create/update via API
    5. Test prediction (smoke test)
    6. Test tool invocation (integration test)
-   Si pasa todos los tests → guarda en Flowise
-   Si falla → reporta error detallado, NO guarda

### 5. Testing Pipeline

```
Diseño → Specialist validation (Zod per node) → Graph validation →
→ flow-ing: Create → Smoke test → Integration test → ✅ Done
```

## Affected Areas

| Area                                            | Impact   | Description                                           |
| ----------------------------------------------- | -------- | ----------------------------------------------------- |
| `.agents/skills/flow-architect/SKILL.md`        | Modified | Quitar acceso a escritura, agregar orquestación       |
| `.agents/skills/flow-ing/`                      | Modified | Agregar testing pipeline, monopolio de escritura      |
| `.agents/skills/node-specialist-chat-models/`   | New      | Skill + Zod schema para chat models                   |
| `.agents/skills/node-specialist-vector-stores/` | New      | Skill + Zod schema para vector stores                 |
| `.agents/skills/node-specialist-embeddings/`    | New      | Skill + Zod schema para embeddings                    |
| `.agents/skills/node-specialist-memory/`        | New      | Skill + Zod schema para memory                        |
| `.agents/skills/node-specialist-tools/`         | New      | Skill + Zod schema para tools                         |
| `.agents/skills/node-specialist-agents/`        | New      | Skill + Zod schema para agent nodes                   |
| `.agents/schemas/`                              | New      | Zod schemas golden templates por nodo                 |
| `.agents/registry/`                             | New      | Model capabilities registry, credential UUID registry |

## Risks

| Risk                                                | Likelihood | Mitigation                                             |
| --------------------------------------------------- | ---------- | ------------------------------------------------------ |
| Golden templates se desfasan con updates de Flowise | Medium     | Script de extracción automatizada + tests de regresión |
| Specialist agent genera nodo incompatible           | Low        | Zod schema strict + golden template comparison         |
| Over-engineering para flows simples                 | Medium     | Pipeline opcional para flows < 3 nodos                 |
| Latencia: muchos agents en serie                    | Medium     | Specialists pueden ejecutarse en paralelo              |
| flow-ing como único punto de fallo                  | Low        | Tests exhaustivos antes de escritura                   |

## Rollback Plan

Los skills nuevos se agregan sin borrar los existentes. Si hay problemas:

1. flow-architect vuelve a tener acceso a escritura (revertir skill)
2. flow-ing vuelve a ejecutar sin testing pipeline
3. Los skills de specialists quedan disponibles pero no son obligatorios

## Dependencies

-   `zod` ya está en el proyecto (flowise-mcp-server lo usa)
-   MCP server de Flowise funciona (ya operativo)
-   API de Flowise accesible
-   Necesitamos: scripts para extraer golden templates de la UI

## Success Criteria

-   [ ] flow-architect NO puede crear/modificar flows en Flowise (solo leer/planificar)
-   [ ] Cada specialist entrega nodo JSON que pasa Zod validation 100% de las veces
-   [ ] flow-ing es el único agente que ejecuta `create_chatflow` / `update_chatflow`
-   [ ] Testing pipeline ejecuta antes de cualquier escritura
-   [ ] Flows creados con el pipeline tienen 0 errores de estructura de nodo
-   [ ] Tiempo de creación de flow no aumenta más de 30% vs método anterior
