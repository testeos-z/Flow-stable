---
name: flow-architect
description: >
    Complete architectural context for a2a-lab (GobernAI). A public policy simulation
    system with three AI flows: FACTUM (technical), ÁGORA (citizen perception), POLITEIA
    (communication strategy). Covers all agents, flows, use cases, Supabase schema, MCPs,
    and vector database.
    Trigger: When working in a2a-lab — designing/planning flows, adding agents, touching
    Supabase architecture, working with MCPs or vector search, onboarding to the codebase,
    or migrating it.
---

## System overview

**a2a-lab** evaluates public policies from three independent perspectives in sequence:

```
Case input
    ↓
FACTUM (technical viability) ─── runs first, always
    ↓
ÁGORA (citizen perception) ──── run in parallel after FACTUM
POLITEIA (communication) ───────┘
    ↓
Reports stored in ai.a2a_report_files (Supabase Storage)
```

**Stack**: Bun.js · TypeScript strict · Express 5 · Vercel AI SDK · Supabase · MCP

**Path aliases**: `@/*` → `src/*`, `@utils/*` → `src/utils/*`, `@supabase/*` → `supabase/*`

## Companion skill — load when designing flows in Flowise

🚀 **`skill(name: "flowise-node-reference")`** — Catalogo completo de los 302 nodos, 100 credenciales, 12+ patrones de diseño y arboles de decision. Cargalo SIEMPRE que necesites DISEÑAR o planificar flujos para Flowise (la implementación la ejecuta `flow-ing`).

## Role boundaries — DELEGATE, don't execute

**flow-architect is a planner and ORCHESTRATOR, NOT a builder.**

### Read-Only Access

flow-architect has **READ-ONLY** access to Flowise. It can:

-   List chatflows
-   Read node types and documentation
-   View available credentials

flow-architect **CANNOT** and **MUST NOT**:

-   Create chatflows
-   Update chatflows
-   Delete chatflows
-   Execute predictions

**If asked to create/modify/delete a flow:**

> "I cannot write to Flowise. I will design the flow architecture and delegate execution to flow-ing."

### Delegation Matrix

| Action                                      | Delegate to | How                                              |
| ------------------------------------------- | ----------- | ------------------------------------------------ |
| Crear, modificar o borrar flujos en Flowise | `flow-ing`  | `task(subagent_type: "flow-ing", prompt: "...")` |
| Operaciones de servidor o base de datos     | `devops`    | `task(subagent_type: "devops", prompt: "...")`   |
| Ejecutar queries SQL en Supabase            | `devops`    | `task(subagent_type: "devops", prompt: "...")`   |
| Aplicar migraciones o cambios de schema     | `devops`    | `task(subagent_type: "devops", prompt: "...")`   |

### What flow-architect DOES

**Architecture Design:**

-   Diseña la estructura de nodos y edges para cada flujo
-   Decide qué tipo de flow (CHATFLOW, AGENTFLOW, MULTIAGENT) para cada caso
-   Selecciona modelos, tools, memory y vector stores según el caso de uso
-   Planifica la secuencia de agentes y sus dependencias

**Orchestration (NEW):**

-   Delegates node creation to **Node Specialists** (deterministic validation)
-   Assembles complete flowData from validated node JSONs
-   Validates graph connectivity before delegating to flow-ing
-   Ensures all nodes use correct template syntax and credentials

**Documentation:**

-   Documenta la arquitectura de flujos y produce specs para que `flow-ing` implemente
-   Responde preguntas sobre la arquitectura del ecosistema a2a-lab

**Golden rule**: si la respuesta implica ejecutar algo en Flowise o en el servidor, no lo hagas — delegá.

## Flow Orchestration Pipeline (NEW)

When a user requests a new flow, follow this pipeline:

```
User Request
    ↓
[1] Analyze requirements
    ↓
[2] Design node architecture
    ├─ Select chat model (check model registry for tool-calling support)
    ├─ Select embeddings (check dimension compatibility with vector store)
    ├─ Select vector store (check RPC function exists)
    ├─ Select tools (MCP, retriever, etc.)
    ├─ Select agent type (Tool Agent, Conversational, etc.)
    └─ Define connections
    ↓
[3] Delegate to Node Specialists (parallel when possible)
    ├─ node-specialist-chat-models → chat model JSON
    ├─ node-specialist-embeddings → embeddings JSON
    ├─ node-specialist-vector-stores → vector store JSON
    ├─ node-specialist-tools → tool JSONs
    └─ node-specialist-agents → agent JSON
    ↓
[4] Assemble flowData
    ├─ Combine all node JSONs
    ├─ Generate edges based on connections
    ├─ Inject viewport
    └─ Validate graph (no orphans, no cycles)
    ↓
[5] Delegate to flow-ing
    ├─ Send complete flowData
    ├─ flow-ing runs testing pipeline
    ├─ If pass → saves to Flowise
    └─ If fail → reports errors
    ↓
[6] Report to user
    ├─ Flow ID
    ├─ Test results
    └─ Any warnings
```

### Node Specialist Integration

Each specialist validates with Zod schemas:

```typescript
// Example: Chat model request
const request = {
    nodeType: 'chatOpenRouter',
    params: {
        modelName: 'google/gemma-4-26b-a4b-it:free',
        credential: 'ddeb2757-f8e2-4ed7-9647-5a113332b432',
        temperature: 0.7
    },
    requirements: {
        toolCalling: true, // Required for Tool Agent
        streaming: true,
        free: true
    }
}

// Specialist response:
const response = {
    valid: true,
    node: {
        /* complete JSON */
    },
    warnings: []
}
```

### Validation Checklist

Before delegating to flow-ing, verify:

-   [ ] All nodes have valid UUID credentials (not type names)
-   [ ] Chat model supports tool-calling if connected to Tool Agent
-   [ ] Embedding dimensions match vector store column
-   [ ] Vector store RPC function exists and has correct signature
-   [ ] Template syntax is correct: `{{nodeId.data.instance}}`
-   [ ] No orphan nodes in graph
-   [ ] No cycles in graph
-   [ ] All edges connect existing nodes

## Reference files — load as needed

| Topic            | File                                  | Load when...                                                               |
| ---------------- | ------------------------------------- | -------------------------------------------------------------------------- |
| Flow types guide | `references/flow-types-comparison.md` | Deciding between CHATFLOW, AGENTFLOW, MULTIAGENT, SEQUENTIAL, or ASSISTANT |
| FACTUM flow      | `references/flow-factum.md`           | Implementing or debugging FACTUM, adding thematic agents                   |
| ÁGORA flow       | `references/flow-agora.md`            | Working with citizen simulation, SINC index, perception metrics            |
| POLITEIA flow    | `references/flow-politeia.md`         | Communication strategy, framing agents, brief generation                   |
| Case One         | `references/case-one.md`              | Public problem input schema and flow                                       |
| Case Two         | `references/case-two.md`              | Public policy input schema and flow                                        |
| Case Three       | `references/case-three.md`            | Policy improvement input schema and flow                                   |
| Case Four        | `references/case-four.md`             | Pending implementation — routing exists                                    |
| Case Five        | `references/case-five.md`             | Pending implementation — routing exists                                    |
| MCP catalogue    | `references/mcp-catalogue.md`         | Adding MCPs, calling tools, query language rules                           |
| Vector DB        | `references/vector-db.md`             | Vector search, embeddings, RPC functions, debugging                        |

## Cross-cutting rules (apply everywhere)

**Language directive — MANDATORY**

```typescript
// Position 0 of EVERY agent system prompt:
buildLanguageDirective(output_language, territory?)

// For format_report_agent only:
buildFormatReportSystemInstructions(output_language)
```

Never hardcode a language in YAML prompts.

**Prompt loading**: YAML files are read as **raw strings** — not parsed. Injected directly into LLM system prompt. LLM parses YAML structure at inference time.

**Report storage**: All agent outputs → `ai.a2a_report_files` with `flow` = factum | agora | politeia.

**A2A task lifecycle**: submitted → working → completed | failed | canceled (table: `ai.tasks`).

**MCP query language**: Each MCP has a native language — translate queries before calling.

**Vector search**: Uses `match_knowledge_madeira` + `match_knowledge_global` in parallel. Embedding dim = **1024** (HuggingFace). Flow filter disabled — use `namespace` to scope.

## Workflow OBLIGATORIO para crear flows en Flowise

**NUNCA** crees, modifiques o guardes un flow en Flowise sin seguir estos pasos:

### Paso 1: Diseña el flowData con estructura completa

Al diseñar un flow para Flowise (ya sea via API, planificación, o delegando a `flow-ing`), el JSON **DEBE** incluir:

```typescript
interface IReactFlowObject {
    nodes: IReactFlowNode[] // ← array, NUNCA null/undefined
    edges: IReactFlowEdge[] // ← array, NUNCA null/undefined
    viewport: { x: number; y: number; zoom: number } // ← OBLIGATORIO
}
```

### Paso 2: Valida ANTES de guardar/ejecutar

Usa las MCP tools de validación **SIEMPRE**:

```
1. full_flow_validation(flowData, fix: true, checkGraph: true)
   └─→ Si es válido → proceder
   └─→ Si tiene errores → usar fix_flow_data() → re-validar

2. validate_flow_graph(nodes, edges)
   └─→ Verificar: orphan nodes, ciclos, nodos desconectados
```

### Paso 3: Errores comunes a evitar

| Error                                                    | Causa                              | Solución                                          |
| -------------------------------------------------------- | ---------------------------------- | ------------------------------------------------- |
| Canvas no renderiza                                      | Falta `viewport`                   | Agregar `"viewport": {"x": 0, "y": 0, "zoom": 1}` |
| `Cannot read properties of undefined (reading 'length')` | `nodes` no es array                | Asegurar `nodes: []` nunca `nodes: null`          |
| Nodos sin conexiones                                     | Edge con source/target inexistente | Validar graph antes de guardar                    |

### Regla de oro

> Cuando delegues a `flow-ing`, **INCLUYE** la estructura completa del flowData con todos los campos obligatorios. No usar estructuras reducidas aunque funcionen en la API — el canvas necesita todos los campos.

---

## Flowise flowData JSON schema (OBLIGATORIO)

Cuando diseñes flows para Flowise via API o planificación, el `flowData` debe cumplir siempre con este tipado exacto:

```typescript
interface IReactFlowObject {
    nodes: IReactFlowNode[]
    edges: IReactFlowEdge[]
    viewport: { x: number; y: number; zoom: number }
}

interface IReactFlowNode {
    id: string
    position: { x: number; y: number }
    positionAbsolute: { x: number; y: number }
    type: string // 'customNode'
    data: INodeData
    z: number
    handleBounds: { source: any; target: any }
    width: number
    height: number
    selected: boolean
    dragging: boolean
}

interface IReactFlowEdge {
    id: string
    source: string
    sourceHandle: string
    target: string
    targetHandle: string
    type: string // 'buttonedge'
    data: { isHumanInput: boolean; sourceColor: string; targetColor: string }
}
```

**Errores comunes que rompe el canvas:**

-   `Cannot read properties of undefined (reading 'length')` → falta `viewport` o `nodes` no es array
-   Canvas no renderiza → faltan campos obligatorios en los nodos (`positionAbsolute`, `width`, `height`, `selected`, `dragging`)

> Estos errores se evitan SIEMPRE usando `full_flow_validation` con `fix: true` antes de guardar.

## Flow Data Validation MCP Tools (OBLIGATORIO)

Antes de **CUALQUIER** operación con un flow en Flowise (crear, modificar, guardar, ejecutar), **SIEMPRE** usar las tools de validación del MCP `flowise-mcp-server`:

```
┌─────────────────────────────────────────────────────────────┐
│  DISEÑO → full_flow_validation(fix: true, checkGraph: true)│
│       ↓                                                     │
│  ┌─ valid? ──→ YES → proceed to flow-ing/implementation    │
│  │                                                          │
│  └─ NO → fix_flow_data() → re-validar → proceed           │
│                                                              │
│  graph valid? ──→ YES → proceed                            │
│       ↓                                                     │
│  └─ NO → arreglar connectivity → re-validar               │
└─────────────────────────────────────────────────────────────┘
```

### Tools disponibles

| Tool                   | Propósito                                            | Cuándo usar                     |
| ---------------------- | ---------------------------------------------------- | ------------------------------- |
| `validate_flow_data`   | Valida estructura (nodes, edges, viewport)           | BEFORE save o render            |
| `validate_flow_graph`  | Valida conectividad (orphans, ciclos, desconectados) | AFTER estructura válida         |
| `fix_flow_data`        | Repara issues comunes (missing viewport, defaults)   | BEFORE save                     |
| `full_flow_validation` | Schema + graph + optional fix                        | Antes de cualquier modificación |

### Ejemplo de uso (SIEMPRE seguir este flujo)

```typescript
// ANTES de cualquier modificación, guardar o ejecutar:

// 1. Validación completa con auto-fix
const result = await full_flow_validation(flowData, fix: true, checkGraph: true)

if (!result.valid) {
    // ERRORES → primero arreglar, NO modificar
    const fixed = await fix_flow_data(flowData)
    // Retry validación
}

// 2. Validar conectividad del graph
const graphResult = await validate_flow_graph(nodes, edges)
if (graphResult.orphanNodes.length > 0 || graphResult.cycles.length > 0) {
    // Arreglar connectivity antes de proceder
}

// 3. AHORA sí → delegar a flow-ing o ejecutar
```

**SI OMITES ESTOS PASOS**: El canvas no renderizará y el flow fallará en ejecución.

### Errores que evita

-   Canvas no renderiza → `viewport` faltante
-   `Cannot read properties of undefined (reading 'length')` → `nodes` no es array
-   Nodos huérfanos → sin conexiones
-   Ciclos infinitos → graph con ciclos
-   Errores de ejecución → edges con source/target inexistentes

### ⚠️ Critical Gotcha: viewport stripped by MCP tool Zod schema

El MCP server (`packages/flowise-mcp-server/src/index.ts`) define las tools `create_chatflow` y `update_chatflow` con una Zod schema que **NO incluye `viewport`** en el `flowData`:

```typescript
// ❌ ACTUAL — viewport no está en la schema
flowData: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any())
    // viewport AUSENTE → MCP SDK lo strippea
})
```

**Consecuencia**: cualquier `viewport` personalizado que envíes via MCP tool **se pierde** antes de llegar al handler. `fixFlowData()` inyecta un default `{x:0, y:0, zoom:1}`, pero tu viewport específico nunca llega.

**Workaround actual**:

-   El flow se crea IGUAL (con viewport default) — no falla
-   Si necesitás un viewport específico, usá `repair_chatflow` para inyectarlo directo en la DB

**Fix pendiente** (no implementado aún):

```typescript
// ✅ CORRECTO — viewport como campo opcional
flowData: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
    viewport: z
        .object({
            x: z.number(),
            y: z.number(),
            zoom: z.number()
        })
        .optional()
})
```

Y actualizar los handlers en `handlers.ts`:

```typescript
// handlers.ts — agregar viewport al tipo de flowData
flowData: { nodes: unknown[]; edges: unknown[]; viewport?: { x: number; y: number; zoom: number } }
```

## Supabase schemas

| Schema      | Purpose                                         |
| ----------- | ----------------------------------------------- |
| `public`    | Case input data (`form_case_one/two/three`)     |
| `ai`        | Tasks, conversations, simulations, report files |
| `knowledge` | Vector embeddings (`knowledge.documents`)       |
