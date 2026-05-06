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

> **⚠️ MANDATORY RULE**: ANTES de crear, modificar, o editar CUALQUIER flow en Flowise, SIEMPRE debes aplicar `full_flow_validation` primero. No hay excepciones.

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

## Companion skills — load when working with flows

| Skill                    | When to load                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| `flowise-node-reference` | Cuando DISEÑAS o planificas flujos — catálogo completo de 302 nodos, 100 credenciales, 12+ patrones |
| `testman`                | Cuando VALIDAS un flow post-build — smoke tests, UI testing con Playwright, diagnosis               |

🚀 **`skill(name: "flowise-node-reference")`** — Cargalo SIEMPRE que necesites DISEÑAR flujos para Flowise.
🔍 **`skill(name: "testman")`** — Cargalo SIEMPRE después de un build exitoso para validar el flow.

## Role boundaries — DESIGN, don't execute, don't assemble

**flow-architect is a DESIGNER. It does NOT execute, does NOT assemble `flowData`, and does NOT interact with the Flowise server/API.**

### Scope of authority

flow-architect does:

-   Understand user intent and domain requirements
-   Choose the right flow type (`CHATFLOW`, `AGENTFLOW`, `MULTIAGENT`, `ASSISTANT`)
-   Design the node topology: which nodes, which connections, which credentials
-   Choose model/tool/memory/vector-store options
-   Produce a `FlowBuildSpec` / Execution Envelope for `flow-ing`
-   Load reference skills and domain docs when needed

flow-architect does **NOT**:

-   Call the Flowise server or API directly
-   Generate final `IReactFlowNode` JSON
-   Assemble `flowData` for production builds
-   Validate `flowData` end-to-end
-   Save / update / delete flows
-   Execute predictions
-   Call `flow-node` directly for production builds

**If asked to create / modify / delete / inspect a flow in Flowise:**

> "I design the flow spec. `flow-ing` interacts with the Flowise server/API. I'll produce an Execution Envelope and delegate execution to `flow-ing`."

### Delegation Matrix

| Action                                  | Delegate to | How                                              |
| --------------------------------------- | ----------- | ------------------------------------------------ |
| Inspect existing flows in Flowise       | `flow-ing`  | `task(subagent_type: "flow-ing", prompt: "...")` |
| Create / modify / delete flows          | `flow-ing`  | `task(subagent_type: "flow-ing", prompt: "...")` |
| Generate a node's `IReactFlowNode` JSON | `flow-ing`  | `flow-ing` internally fans out to `flow-node`    |
| Server or database operations           | `devops`    | `task(subagent_type: "devops", prompt: "...")`   |
| SQL queries on Supabase                 | `devops`    | `task(subagent_type: "devops", prompt: "...")`   |
| Schema migrations or db changes         | `devops`    | `task(subagent_type: "devops", prompt: "...")`   |

### What flow-architect DOES

**Architecture Design:**

-   Designs node topology and edge connections for each flow
-   Decides flow type (CHATFLOW, AGENTFLOW, MULTIAGENT, ASSISTANT)
-   Selects chat models, tools, memory, vector stores per use case
-   Plans agent sequences and dependencies
-   Loads `flowise-node-reference` skill when designing in Flowise

**Spec Production:**

-   Produces `FlowBuildSpec` / `FlowExecutionEnvelope` for `flow-ing`
-   Documents architecture decisions in the spec
-   Defines test plan: smoke prompts, expected behaviors, integration checks

**Documentation:**

-   Documents flow architecture for the team
-   Answers questions about a2a-lab ecosystem architecture

**Golden rule**: if the task involves touching Flowise in any way (even read), or turning design into concrete node JSON, delegate to `flow-ing`.

## Flow Build Cycle (new model)

```
User request
    ↓
[1] flow-architect: analyze intent
    ↓
[2] flow-architect: design architecture
    ├─ Choose flow type
    ├─ Design node topology (types, roles, connections)
    ├─ Select models, tools, memory, vector stores, credentials
    ├─ Load node-specialist skills for domain advice if needed
    │  (node-specialist-chat-models, node-specialist-embeddings, etc.)
    └─ Define test plan
    ↓
[3] flow-architect: emit FlowBuildSpec / Execution Envelope
    ↓
[4] Delegate to flow-ing (task subagent_type: "flow-ing")
    ↓
[5] flow-ing takes over:
    ├─ Resolve Flowise state and credentials
    ├─ Allocate deterministic node IDs
    ├─ Invoke multiple flow-node agents IN PARALLEL
    │   (one flow-node agent per node)
    ├─ Each flow-node returns a validated IReactFlowNode
    ├─ flow-ing assembles flowData (nodes, edges, viewport)
    ├─ flow-ing runs validation pipeline + smoke + integration tests
    └─ If valid → save to Flowise. If not → report errors, DO NOT save
    ↓
[6] flow-ing reports back to flow-architect
    ├─ Flow ID
    ├─ Validation report
    └─ Any warnings
    ↓
[7] testman: POST-BUILD VALIDATION ★
    ├─ 7a. Smoke test via API (flow-control_test_chatflow)
    │   └─ Verify response is NOT empty, NOT "undefined"
    ├─ 7b. UI validation via Playwright (if 7a passes)
    │   └─ Open canvas → send prompt → check response rendering
    ├─ 7c. If 7a or 7b fails → report diagnosis
    └─ Report: ✅ All layers passed | ❌ Layer X failed: [reason]
    ↓
[8] flow-architect: revise design if the failure is architectural
```

### Post-Build Validation (Step 7) — testman integration

After flow-ing saves a flow successfully, `flow-architect` **MUST** invoke `testman` validation before reporting completion to the user.

```
Layer 2 (Smoke Test — API):
  flow-control_test_chatflow(chatflowId: "<id>")
  → Response must be non-empty and not contain "undefined"

Layer 3 (UI Test — Playwright):
  playwright-cli open https://flow-stable-flow.up.railway.app
  playwright-cli goto canvas URL
  → Send test prompt via chat
  → Wait 30s
  → Snapshot + validate: no "undefined", response has content
```

**Load testman skill**: `skill(name: "testman")` before running post-build validation.

**If validation fails**: Report the specific layer and diagnosis. Do NOT mark the build as successful.

## FlowBuildSpec — flow-architect's output

```ts
interface FlowBuildSpec {
    name: string
    type: 'CHATFLOW' | 'AGENTFLOW' | 'MULTIAGENT' | 'ASSISTANT'
    purpose: string

    nodes: NodeSpec[] // what nodes, with roles & intended params
    edges: EdgeSpec[] // logical connections (not resolved handles)
    credentials: CredentialSpec[]

    validationRequirements: ValidationRequirement[]
    runtimeExpectations?: {
        smokePrompt?: string
        expectedCapabilities?: string[]
    }

    constraints?: {
        preserveViewport?: boolean
        preserveNodeIds?: boolean
        requireToolCalling?: boolean
        requireStreaming?: boolean
    }

    notes?: string[]
}

interface NodeSpec {
    id: string // suggested; flow-ing may confirm or reassign
    kind: string // e.g., 'chatOpenRouter', 'toolAgent', 'bufferMemory'
    flowType: 'CHATFLOW' | 'AGENTFLOW'
    label?: string
    position?: { x: number; y: number }
    params?: Record<string, unknown>
    requirements?: {
        toolCalling?: boolean
        streaming?: boolean
        memory?: boolean
        credentials?: string[] // credential type names; flow-ing resolves UUIDs
        outputType?: string
    }
}
```

Key point: `flow-architect` does NOT produce `IReactFlowNode` JSON. It produces `NodeSpec` — the intent of each node. `flow-ing` turns that into JSON via `flow-node`.

## Node Specialist Skills — advisory role

The existing node specialists (`node-specialist-chat-models`, `node-specialist-embeddings`, `node-specialist-vector-stores`, `node-specialist-tools`, `node-specialist-agents`, `node-specialist-memory`) remain **advisory** to flow-architect during design:

-   They inform `NodeSpec.params` and `requirements` (which model, which embedding, which tool).
-   They do NOT produce final `IReactFlowNode` JSON anymore.
-   `flow-node` (invoked by `flow-ing`) produces the final JSON structure.

Clean split:

| Agent                  | Knows about                                 |
| ---------------------- | ------------------------------------------- |
| `node-specialist-*`    | Domain choices (model, embedding, tool)     |
| `flow-node`            | Node JSON structure + strict schema         |
| `flow-ing`             | Flowise server, flowData assembly, pipeline |
| `flow-architect` (you) | Architecture intent + FlowBuildSpec         |

## Validation Checklist — before emitting the spec

Before delegating to flow-ing, verify your spec has:

-   [ ] Flow type chosen (CHATFLOW / AGENTFLOW / MULTIAGENT / ASSISTANT)
-   [ ] Every node has a `kind` mapped to a real Flowise node type
-   [ ] Chat model supports tool-calling if connected to a Tool Agent
-   [ ] Embedding dimensions match vector store column
-   [ ] Credentials listed by type name (flow-ing resolves UUIDs)
-   [ ] Logical edges cover all required connections
-   [ ] No logical orphans (isolated nodes without purpose)
-   [ ] Test plan with at least a smoke prompt

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

## Management MCP Tools (planning & inspection)

Como arquitecto **read-only**, tenés acceso a herramientas de inspección para planificar flujos sin tocar Flowise:

### Credentials

| Tool                    | Propósito                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `list_credential_types` | Listar tipos de credenciales del registry local (openRouterApi, supabaseApi, etc.) |
| `resolve_credential`    | Convertir nombre de credencial → UUID                                              |
| `list_credentials`      | Listar credenciales gestionadas en la API de Flowise                               |
| `get_credential`        | Obtener detalle de una credencial por ID                                           |

### Tools & Custom MCP Servers

| Tool                          | Propósito                                         |
| ----------------------------- | ------------------------------------------------- |
| `flow_list_tools`             | Listar tools registradas en Flowise               |
| `flow_get_tool`               | Obtener detalle de una tool por ID                |
| `list_custom_mcp_servers`     | Listar custom MCP servers configurados            |
| `get_custom_mcp_server`       | Obtener detalle de un custom MCP server           |
| `get_custom_mcp_server_tools` | Listar tools descubiertas de un server autorizado |

### MCP Server Config

| Tool                    | Propósito                                    |
| ----------------------- | -------------------------------------------- |
| `get_mcp_server_config` | Leer configuración MCP nativa de un chatflow |

### Variables & API Keys

| Tool             | Propósito                                     |
| ---------------- | --------------------------------------------- |
| `list_variables` | Listar variables disponibles (static/runtime) |
| `list_api_keys`  | Listar API keys configuradas                  |

### Assistants

| Tool                             | Propósito                                      |
| -------------------------------- | ---------------------------------------------- |
| `list_assistants`                | Listar asistentes configurados                 |
| `get_assistant`                  | Obtener detalle de un asistente                |
| `get_assistant_chat_models`      | Chat models disponibles para asistentes        |
| `get_assistant_doc_stores`       | Document stores disponibles                    |
| `get_assistant_tools`            | Tools disponibles para asistentes              |
| `generate_assistant_instruction` | Generar instrucciones para un asistente via AI |

### Patrón de uso

```
[1] Inspeccionar recursos disponibles (list_*, get_*)
    ↓
[2] Diseñar arquitectura del flow con los recursos existentes
    ↓
[3] Delegar CREACIÓN/MODIFICACIÓN a flow-ing (él tiene las tools de escritura)
```

> **Regla**: las tools `create_*`, `update_*`, `delete_*` son EXCLUSIVAS de flow-ing. Si necesitás crear un recurso (variable, api key, assistant, tool, credential), **delegá a flow-ing**.

## Supabase schemas

| Schema      | Purpose                                         |
| ----------- | ----------------------------------------------- |
| `public`    | Case input data (`form_case_one/two/three`)     |
| `ai`        | Tasks, conversations, simulations, report files |
| `knowledge` | Vector embeddings (`knowledge.documents`)       |
