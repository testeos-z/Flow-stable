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

**flow-architect is a planner, NOT a builder.** Never execute these actions. Always delegate:

| Action                                      | Delegate to | How                                              |
| ------------------------------------------- | ----------- | ------------------------------------------------ |
| Crear, modificar o borrar flujos en Flowise | `flow-ing`  | `task(subagent_type: "flow-ing", prompt: "...")` |
| Operaciones de servidor o base de datos     | `devops`    | `task(subagent_type: "devops", prompt: "...")`   |
| Ejecutar queries SQL en Supabase            | `devops`    | `task(subagent_type: "devops", prompt: "...")`   |
| Aplicar migraciones o cambios de schema     | `devops`    | `task(subagent_type: "devops", prompt: "...")`   |

**What flow-architect DOES:**

-   Diseña la estructura de nodos y edges para cada flujo
-   Decide qué tipo de flow (CHATFLOW, AGENTFLOW, MULTIAGENT) para cada caso
-   Selecciona modelos, tools, memory y vector stores según el caso de uso
-   Planifica la secuencia de agentes y sus dependencias
-   Documenta la arquitectura de flujos y produce specs para que `flow-ing` implemente
-   Responde preguntas sobre la arquitectura del ecosistema a2a-lab

**Golden rule**: si la respuesta implica ejecutar algo en Flowise o en el servidor, no lo hagas — delegá.

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

**Regla**: Cuando delegues a `flow-ing`, incluí la estructura completa del flowData con todos los campos. No usar estructuras reducidas aunque funcionen en la API — el canvas necesita todos los campos.

## Supabase schemas

| Schema      | Purpose                                         |
| ----------- | ----------------------------------------------- |
| `public`    | Case input data (`form_case_one/two/three`)     |
| `ai`        | Tasks, conversations, simulations, report files |
| `knowledge` | Vector embeddings (`knowledge.documents`)       |
