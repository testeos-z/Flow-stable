# Design: Flow Creation Agent Pipeline with Zod Validation

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                                  │
│  "Creá un chatflow RAG con OpenRouter, Supabase pgvector, y MCP"     │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    flow-architect (Orquestador)                       │
│  • Analiza requerimiento                                              │
│  • Decide qué nodos y conexiones                                      │
│  • Solicita nodos a specialists (paralelo cuando sea posible)        │
│  • Ensambla flowData completo                                         │
│  • Valida graph (huérfanos, ciclos)                                   │
│  • Delega a flow-ing para ejecución                                   │
│  ─────────────────────────────────                                    │
│  READ-ONLY: puede listar/leer de Flowise, NO escribe                  │
└──────────────────┬───────────────────────────────────────────────────┘
                   │
       ┌───────────┼───────────┬──────────────┬──────────────┐
       ▼           ▼           ▼              ▼              ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ chat-    │ │ vector-  │ │ embed-   │ │ memory-  │ │ tool-    │
│ model    │ │ store    │ │ dings    │ │ spec     │ │ spec     │
│ spec     │ │ spec     │ │ spec     │ │          │ │          │
└────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │            │            │
     └────────────┴────────────┴────────────┴────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    flow-ing (Único Executor)                          │
│  • Recibe flowData validado de flow-architect                         │
│  • Ejecuta Testing Pipeline:                                          │
│    1. Zod per-node validation                                         │
│    2. Full flowData schema validation                                 │
│    3. Graph connectivity validation                                   │
│    4. Create temp flow → Smoke test prediction                        │
│    5. Integration test (force tool invocation)                        │
│  • Si pasa todo: guarda en Flowise                                    │
│  • Si falla: reporta error, NO guarda                                 │
│  ─────────────────────────────────                                    │
│  WRITE-ACCESS: único con permiso de escritura en Flowise              │
└──────────────────────────────────────────────────────────────────────┘
```

## Key Technical Decisions

### Decision 1: Especialistas como Skills independientes (NO subagents)

**Context**: Podríamos implementar specialists como subagents (`task(subagent_type: "node-chat-model")`) o como módulos de código con Zod schemas.

**Decision**: Skills independientes con SKILL.md + schemas en código.

**Rationale**:

-   Los specialists no necesitan LLM inference para generar el JSON — es determinístico dado el input
-   Un skill con Zod schema + template es más rápido y barato que lanzar un subagent LLM
-   Más fácil de testear (unit tests puros sobre Zod schemas)
-   Menor latencia (no hay llamada a LLM por nodo)

**Tradeoff**: Menos flexible si Flowise agrega un nodo completamente nuevo. Mitigación: script de extracción automática.

### Decision 2: Zod schemas basados en golden templates

**Context**: Los nodos de Flowise tienen estructuras muy específicas que cambian entre versiones.

**Decision**: Extraer JSON "golden" de la UI para cada nodo, convertirlo a Zod schema con campos opcionales para los valores dinámicos.

**Rationale**:

-   Ground truth inmutable: lo que la UI genera es lo que Flowise espera
-   Permite detectar breaking changes cuando Flowise actualiza
-   Los schemas pueden auto-generarse parcialmente

**Formato del schema**:

```typescript
const ChatOpenRouterSchema = z.object({
    id: z.string(),
    position: PositionSchema,
    positionAbsolute: PositionSchema,
    type: z.literal('customNode'),
    data: z.object({
        id: z.string(),
        label: z.literal('OpenRouter'),
        name: z.literal('chatOpenRouter'),
        version: z.literal(1),
        type: z.literal('ChatOpenRouter'),
        credential: z.string().uuid().or(z.literal('')), // UUID o vacío
        inputs: z.object({
            modelName: z.string(),
            temperature: z.number().min(0).max(1)
            // ... etc
        }),
        inputParams: z.array(InputParamSchema), // Schema completo con TODOS los campos
        inputAnchors: z.array(InputAnchorSchema),
        outputAnchors: z.array(OutputAnchorSchema)
        // ... resto de campos fijos
    })
    // ... metadata del canvas
})
```

### Decision 3: flow-ing monopolio de escritura

**Context**: Actualmente flow-architect y flow-ing pueden ambos escribir en Flowise.

**Decision**: Quitar TODAS las tools de escritura del contexto de flow-architect. flow-ing es el único que recibe `flow-validation_create_chatflow`, `flow-validation_update_chatflow`, `flow-validation_delete_chatflow`.

**Implementación**:

-   En `flow-architect/SKILL.md`: eliminar cualquier referencia a tools de escritura
-   En `flow-ing/SKILL.md` (cuando exista): documentar explícitamente que es el único con permiso de escritura
-   En la práctica: flow-architect NO tiene las tools de Flowise disponibles en su contexto

### Decision 4: Testing pipeline como función pura

**Context**: Necesitamos validar antes de guardar.

**Decision**: Implementar la testing pipeline como un módulo de código con funciones puras, no como un agente.

**Pipeline stages**:

```typescript
async function runTestingPipeline(flowData: IReactFlowObject): Promise<TestResult> {
    // Stage 1: Per-node Zod validation
    const nodeResults = flowData.nodes.map((node) => validateNodeWithZod(node))

    // Stage 2: Full flowData schema
    const flowResult = FullFlowDataSchema.safeParse(flowData)

    // Stage 3: Graph validation
    const graphResult = validateGraph(flowData.nodes, flowData.edges)

    // Stage 4: Create temp flow (via API)
    const tempFlow = await createTempFlow(flowData)

    // Stage 5: Smoke test
    const smokeResult = await runPrediction(tempFlow.id, 'Hello')

    // Stage 6: Integration test (if tools present)
    const integrationResult = flowHasTools(flowData)
        ? await runPrediction(tempFlow.id, 'Trigger tool X')
        : { passed: true, reason: 'No tools to test' }

    // Cleanup temp flow
    await deleteTempFlow(tempFlow.id)

    return aggregateResults(nodeResults, flowResult, graphResult, smokeResult, integrationResult)
}
```

## Data Flow

### 1. User Request → flow-architect

```
Input: "Quiero un chatflow RAG con OpenRouter free, Supabase pgvector knowledge.nyc, y MCP nyc-data"

flow-architect:
1. Parsea requerimiento
2. Identifica nodos necesarios:
   - chatOpenRouter (Chat Model)
   - huggingFaceInferenceEmbeddings (Embeddings)
   - supabase (Vector Store)
   - toolAgent (Agent)
   - customMcpTool (Tool)
   - retrieverTool (Tool)
3. Identifica conexiones:
   - chatOpenRouter → toolAgent (model)
   - huggingFaceInferenceEmbeddings → supabase (embeddings)
   - supabase → retrieverTool (vectorStore)
   - retrieverTool → toolAgent (tools)
   - customMcpTool → toolAgent (tools)
```

### 2. flow-architect → Node Specialists (paralelo)

```
Para cada nodo, crea un request:

{
  nodeType: "chatOpenRouter",
  params: {
    modelName: "google/gemma-4-26b-a4b-it:free",
    credential: "ddeb2757-f8e2-4ed7-9647-5a113332b432", // del registry
    temperature: 0.7,
    streaming: true
  },
  requirements: ["toolCalling"] // capabilities requeridas
}

Specialist response:
{
  valid: true,
  node: { /* JSON completo del nodo */ },
  warnings: []
}
```

### 3. Specialists → flow-architect (ensamblaje)

```
flow-architect recibe todos los nodos validados:
- Genera edges basándose en las conexiones declaradas
- Asegura que cada edge tiene sourceHandle/targetHandle correctos
- Inyecta viewport
- Valida graph completo

Output: flowData completo (IReactFlowObject)
```

### 4. flow-architect → flow-ing (ejecución)

```
{
  flowData: IReactFlowObject,
  testPlan: {
    smokeTest: { question: "Hello" },
    integrationTest: flowHasTools ? { question: "Search for NYC data" } : null
  }
}
```

### 5. flow-ing → Testing Pipeline → Flowise

```
Si tests pasan → create_chatflow / update_chatflow
Si tests fallan → report error → NO guardar
```

## Directory Structure

```
.agents/
├── skills/
│   ├── flow-architect/           # MODIFIED: read-only orquestador
│   │   ├── SKILL.md
│   │   ├── references/
│   │   └── orchestrator.md       # NEW: reglas de orquestación
│   │
│   ├── flow-ing/                 # NEW/REFACTORED: único executor
│   │   ├── SKILL.md
│   │   ├── testing-pipeline.md   # NEW: documentación de tests
│   │   └── executor-rules.md     # NEW: reglas de ejecución
│   │
│   ├── node-specialist-chat-models/      # NEW
│   │   ├── SKILL.md
│   │   ├── schemas/
│   │   │   ├── chatOpenRouter.ts
│   │   │   ├── chatAnthropic.ts
│   │   │   └── index.ts
│   │   └── registry/
│   │       └── model-capabilities.ts
│   │
│   ├── node-specialist-vector-stores/    # NEW
│   │   ├── SKILL.md
│   │   ├── schemas/
│   │   │   ├── supabase.ts
│   │   │   ├── pinecone.ts
│   │   │   └── index.ts
│   │   └── registry/
│   │       └── credential-uuids.ts
│   │
│   ├── node-specialist-embeddings/       # NEW
│   │   ├── SKILL.md
│   │   └── schemas/
│   │       ├── huggingFace.ts
│   │       └── openAI.ts
│   │
│   ├── node-specialist-memory/           # NEW
│   │   ├── SKILL.md
│   │   └── schemas/
│   │       ├── bufferMemory.ts
│   │       └── windowMemory.ts
│   │
│   ├── node-specialist-tools/            # NEW
│   │   ├── SKILL.md
│   │   └── schemas/
│   │       ├── retrieverTool.ts
│   │       ├── customMcpTool.ts
│   │       └── customTool.ts
│   │
│   └── node-specialist-agents/           # NEW
│       ├── SKILL.md
│       └── schemas/
│           ├── toolAgent.ts
│           └── conversationalAgent.ts
│
├── schemas/                      # NEW: schemas compartidos
│   ├── flow-data.ts              # IReactFlowObject, IReactFlowNode, IReactFlowEdge
│   ├── shared-node-fields.ts     # InputParam, InputAnchor, OutputAnchor, Position
│   └── index.ts
│
├── registry/                     # NEW: registries compartidos
│   ├── model-capabilities.ts     # Mapa de modelos con features
│   ├── credential-uuids.ts       # Mapa credentialType → UUID por entorno
│   └── index.ts
│
└── scripts/                      # NEW: utilidades
    ├── extract-golden-templates.ts   # Extrae JSON de nodos desde Flowise API
    └── generate-zod-schemas.ts       # Genera schemas desde golden templates
```

## Zod Schema Structure

### Shared Schemas (`.agents/schemas/`)

```typescript
// shared-node-fields.ts
export const PositionSchema = z.object({
    x: z.number(),
    y: z.number()
})

export const InputParamSchema = z.object({
    label: z.string(),
    name: z.string(),
    type: z.string(), // 'asyncOptions' | 'options' | 'string' | 'number' | 'boolean' | 'json' | 'code' | etc.
    id: z.string(),
    description: z.string().optional(),
    placeholder: z.string().optional(),
    default: z.any().optional(),
    options: z.array(z.object({ label: z.string(), name: z.string() })).optional(),
    optional: z.boolean().optional(),
    additionalParams: z.boolean().optional(),
    loadMethod: z.string().optional(),
    fileType: z.string().optional()
})

export const InputAnchorSchema = z.object({
    label: z.string(),
    name: z.string(),
    type: z.string(), // 'ChatOpenAI' | 'Embeddings' | 'VectorStore' | etc.
    id: z.string(),
    description: z.string().optional()
})

export const OutputAnchorSchema = z.object({
    label: z.string(),
    name: z.string(),
    type: z.string(),
    id: z.string(),
    description: z.string().optional(),
    baseClasses: z.array(z.string()).optional()
})

// flow-data.ts
export const IReactFlowNodeSchema = z.object({
    id: z.string(),
    position: PositionSchema,
    positionAbsolute: PositionSchema,
    type: z.literal('customNode'),
    data: z.any(), // Validado por specialist específico
    z: z.number().default(0),
    handleBounds: z
        .object({
            source: z.array(z.any()),
            target: z.array(z.any())
        })
        .optional(),
    width: z.number().default(300),
    height: z.number().default(500),
    selected: z.boolean().default(false),
    dragging: z.boolean().default(false)
})

export const IReactFlowEdgeSchema = z.object({
    id: z.string(),
    source: z.string(),
    sourceHandle: z.string(),
    target: z.string(),
    targetHandle: z.string(),
    type: z.literal('buttonedge'),
    data: z.object({
        isHumanInput: z.boolean().default(false),
        sourceColor: z.string().optional(),
        targetColor: z.string().optional()
    })
})

export const IReactFlowObjectSchema = z.object({
    nodes: z.array(IReactFlowNodeSchema),
    edges: z.array(IReactFlowEdgeSchema),
    viewport: z.object({
        x: z.number(),
        y: z.number(),
        zoom: z.number()
    })
})
```

### Node-Specific Schemas

Cada specialist tiene un schema que extiende la estructura base. Ejemplo para chatOpenRouter:

```typescript
// schemas/chatOpenRouter.ts
import { IReactFlowNodeSchema, PositionSchema, InputParamSchema, InputAnchorSchema, OutputAnchorSchema } from '../shared-node-fields'

const ChatOpenRouterInputSchema = z.object({
    modelName: z.string(),
    temperature: z.number().min(0).max(2).optional().default(0.7),
    maxTokens: z.number().optional(),
    topP: z.number().min(0).max(1).optional(),
    frequencyPenalty: z.number().optional(),
    presencePenalty: z.number().optional(),
    timeout: z.number().optional(),
    basePath: z.string().optional(),
    baseOptions: z.any().optional(),
    streaming: z.boolean().optional().default(true),
    cache: z.boolean().optional()
})

export const ChatOpenRouterNodeSchema = z.object({
    id: z.string(),
    position: PositionSchema,
    positionAbsolute: PositionSchema,
    type: z.literal('customNode'),
    width: z.number().default(300),
    height: z.number().default(640),
    selected: z.boolean().default(false),
    dragging: z.boolean().default(false),
    z: z.number().default(0),
    data: z.object({
        id: z.string(),
        label: z.literal('OpenRouter'),
        name: z.literal('chatOpenRouter'),
        version: z.literal(1),
        type: z.literal('ChatOpenRouter'),
        baseClasses: z.array(z.string()),
        category: z.literal('Chat Models'),
        description: z.string(),
        filePath: z.string(),
        icon: z.string(),
        credential: z.string().uuid().or(z.literal('')), // UUID o vacío
        inputs: ChatOpenRouterInputSchema,
        inputParams: z.array(InputParamSchema),
        inputAnchors: z.array(InputAnchorSchema),
        outputAnchors: z.array(OutputAnchorSchema),
        outputs: z.object({})
    })
})
```

## Registry: Model Capabilities

```typescript
// registry/model-capabilities.ts
export interface ModelCapability {
    id: string // ID del modelo en OpenRouter / provider
    name: string // Nombre legible
    provider: string // openrouter, anthropic, google, etc.
    toolCalling: boolean // Soporta bindTools() / function calling
    streaming: boolean // Soporta streaming
    free: boolean // Tier free disponible
    maxTokens?: number // Context window
    recommended: boolean // Recomendado por el equipo
}

export const MODEL_REGISTRY: ModelCapability[] = [
    {
        id: 'google/gemma-4-26b-a4b-it:free',
        name: 'Gemma 4 26B A4B IT',
        provider: 'openrouter',
        toolCalling: true,
        streaming: true,
        free: true,
        maxTokens: 32768,
        recommended: true
    },
    {
        id: 'minimax/minimax-m2.5:free',
        name: 'MiniMax M2.5',
        provider: 'openrouter',
        toolCalling: false, // ← CRÍTICO
        streaming: true,
        free: true,
        recommended: false
    }
    // ... más modelos
]

export function getCompatibleModels(requirements: { toolCalling?: boolean; streaming?: boolean; free?: boolean }): ModelCapability[] {
    return MODEL_REGISTRY.filter(
        (m) =>
            (requirements.toolCalling === undefined || m.toolCalling === requirements.toolCalling) &&
            (requirements.streaming === undefined || m.streaming === requirements.streaming) &&
            (requirements.free === undefined || m.free === requirements.free)
    )
}
```

## Registry: Credential UUIDs

```typescript
// registry/credential-uuids.ts
export interface CredentialEntry {
    type: string // Nombre del tipo de credencial (ej: "openRouterApi")
    name: string // Nombre legible
    env: 'dev' | 'qa' | 'prod'
    uuid: string // UUID en Flowise
}

export const CREDENTIAL_REGISTRY: Record<string, CredentialEntry[]> = {
    dev: [
        { type: 'openRouterApi', name: 'OpenRouter API', env: 'dev', uuid: 'ddeb2757-f8e2-4ed7-9647-5a113332b432' },
        { type: 'supabaseApi', name: 'Supabase API', env: 'dev', uuid: '0df85d26-749b-4fac-9a88-7399663a3099' },
        { type: 'huggingFaceApi', name: 'HuggingFace API', env: 'dev', uuid: 'aae7223f-da1b-47d5-bb26-1a2f1b2a3d5b' }
    ],
    qa: [
        /* ... */
    ],
    prod: [
        /* ... */
    ]
}

export function getCredentialUuid(type: string, env: string = 'dev'): string | undefined {
    return CREDENTIAL_REGISTRY[env]?.find((c) => c.type === type)?.uuid
}
```

## Testing Pipeline Implementation

```typescript
// testing-pipeline.ts
import { z } from 'zod'
import { IReactFlowObjectSchema } from '../schemas/flow-data'

interface TestResult {
    stage: string
    passed: boolean
    errors: string[]
    durationMs: number
}

interface PipelineResult {
    overall: boolean
    stages: TestResult[]
    flowId?: string // Si se creó un flow temporal
}

export async function runTestingPipeline(
    flowData: any,
    nodeValidators: Map<string, z.ZodSchema>,
    options: { skipSmokeTest?: boolean; skipIntegrationTest?: boolean } = {}
): Promise<PipelineResult> {
    const stages: TestResult[] = []
    let tempFlowId: string | undefined

    // Stage 1: Per-node Zod validation
    const nodeStart = Date.now()
    const nodeErrors: string[] = []

    for (const node of flowData.nodes) {
        const schema = nodeValidators.get(node.data?.name)
        if (!schema) {
            nodeErrors.push(`Nodo ${node.id} (${node.data?.name}): no hay schema registrado`)
            continue
        }
        const result = schema.safeParse(node)
        if (!result.success) {
            nodeErrors.push(`Nodo ${node.id} (${node.data?.name}): ${result.error.message}`)
        }
    }

    stages.push({
        stage: 'per-node-zod',
        passed: nodeErrors.length === 0,
        errors: nodeErrors,
        durationMs: Date.now() - nodeStart
    })

    // Stage 2: Full flowData schema
    const flowStart = Date.now()
    const flowResult = IReactFlowObjectSchema.safeParse(flowData)
    stages.push({
        stage: 'full-flowdata',
        passed: flowResult.success,
        errors: flowResult.success ? [] : [flowResult.error.message],
        durationMs: Date.now() - flowStart
    })

    // Stage 3: Graph validation
    const graphStart = Date.now()
    const graphErrors = validateGraph(flowData.nodes, flowData.edges)
    stages.push({
        stage: 'graph-connectivity',
        passed: graphErrors.length === 0,
        errors: graphErrors,
        durationMs: Date.now() - graphStart
    })

    // Si falla cualquiera de las primeras 3, no seguimos
    if (stages.some((s) => !s.passed)) {
        return { overall: false, stages }
    }

    // Stage 4 & 5: Smoke + Integration tests (requieren API de Flowise)
    if (!options.skipSmokeTest) {
        try {
            const apiStart = Date.now()
            // Crear flow temporal
            tempFlowId = await createTempFlow(flowData)

            // Smoke test
            const smokeResult = await runPrediction(tempFlowId, 'Hello, are you working?')
            stages.push({
                stage: 'smoke-test',
                passed: smokeResult.success,
                errors: smokeResult.success ? [] : [smokeResult.error],
                durationMs: Date.now() - apiStart
            })

            // Integration test
            if (!options.skipIntegrationTest && flowHasTools(flowData)) {
                const integResult = await runPrediction(tempFlowId, 'Trigger tool invocation')
                stages.push({
                    stage: 'integration-test',
                    passed: integResult.success,
                    errors: integResult.success ? [] : [integResult.error],
                    durationMs: Date.now() - apiStart
                })
            }
        } catch (e) {
            stages.push({
                stage: 'api-tests',
                passed: false,
                errors: [`API error: ${e.message}`],
                durationMs: 0
            })
        } finally {
            if (tempFlowId) {
                await deleteTempFlow(tempFlowId).catch(() => {})
            }
        }
    }

    const overall = stages.every((s) => s.passed)
    return { overall, stages, flowId: tempFlowId }
}

function validateGraph(nodes: any[], edges: any[]): string[] {
    const errors: string[] = []
    const nodeIds = new Set(nodes.map((n) => n.id))

    // Check orphan nodes
    const connectedNodes = new Set<string>()
    for (const edge of edges) {
        connectedNodes.add(edge.source)
        connectedNodes.add(edge.target)
    }

    for (const node of nodes) {
        if (!connectedNodes.has(node.id)) {
            errors.push(`Nodo huérfano: ${node.id} (${node.data?.label || node.data?.name})`)
        }
    }

    // Check invalid edge references
    for (const edge of edges) {
        if (!nodeIds.has(edge.source)) {
            errors.push(`Edge inválido: source ${edge.source} no existe`)
        }
        if (!nodeIds.has(edge.target)) {
            errors.push(`Edge inválido: target ${edge.target} no existe`)
        }
    }

    // Check cycles (simplified DFS)
    // ... implementación de detección de ciclos

    return errors
}
```

## Edge Generation Rules

Los edges se generan automáticamente basándose en la compatibilidad de tipos entre outputAnchors e inputAnchors:

```typescript
function generateEdges(nodes: any[]): any[] {
    const edges: any[] = []

    // Mapear outputs disponibles por nodo
    const outputs = new Map<string, { nodeId: string; anchorId: string; type: string }[]>()
    for (const node of nodes) {
        outputs.set(
            node.id,
            node.data.outputAnchors.map((oa: any) => ({
                nodeId: node.id,
                anchorId: oa.id,
                type: oa.type
            }))
        )
    }

    // Para cada inputAnchor, buscar un output compatible
    for (const targetNode of nodes) {
        for (const inputAnchor of targetNode.data.inputAnchors || []) {
            // Buscar un nodo que tenga output del tipo requerido
            for (const [sourceId, sourceOutputs] of outputs) {
                if (sourceId === targetNode.id) continue // No self-loops

                const match = sourceOutputs.find((o) => o.type === inputAnchor.type || isCompatibleType(o.type, inputAnchor.type))

                if (match) {
                    edges.push({
                        id: `e-${match.nodeId}-${targetNode.id}`,
                        source: match.nodeId,
                        sourceHandle: match.anchorId,
                        target: targetNode.id,
                        targetHandle: inputAnchor.id,
                        type: 'buttonedge',
                        data: { isHumanInput: false }
                    })
                }
            }
        }
    }

    return edges
}
```

**Nota**: En la práctica, flow-architect define las conexiones manualmente (no auto-genera) porque conoce la semántica del flow. Pero las reglas de compatibilidad de tipos validan que las conexiones sean válidas.

## Communication Protocol between Agents

### flow-architect → Specialist

```typescript
interface NodeRequest {
    nodeType: string // ej: "chatOpenRouter"
    params: Record<string, any> // Valores dinámicos (modelName, credential, etc.)
    requirements: {
        toolCalling?: boolean
        streaming?: boolean
        free?: boolean
    }
    context: {
        flowName: string
        flowType: 'CHATFLOW' | 'AGENTFLOW' | 'MULTIAGENT'
    }
}

interface NodeResponse {
    valid: boolean
    node?: any // JSON del nodo (si valid)
    errors?: string[] // Lista de errores (si !valid)
    warnings?: string[] // Advertencias no bloqueantes
}
```

### flow-architect → flow-ing

```typescript
interface FlowExecutionRequest {
    flowData: any // IReactFlowObject completo
    metadata: {
        name: string
        description?: string
        category?: string
    }
    testPlan: {
        smokeTest?: { question: string }
        integrationTest?: { question: string }
    }
}

interface FlowExecutionResponse {
    success: boolean
    chatflowId?: string
    testResults?: PipelineResult
    errors?: string[]
}
```

## Error Handling Strategy

| Error                      | Quién detecta                      | Acción                                |
| -------------------------- | ---------------------------------- | ------------------------------------- |
| Modelo sin tool-calling    | node-specialist-chat-models        | Rechazar + sugerir alternativas       |
| Credential no es UUID      | Zod schema en specialist           | Rechazar + mostrar UUID disponible    |
| inputParams incompleto     | Zod schema                         | Rechazar + especificar campo faltante |
| Template syntax incorrecta | Zod schema (regex)                 | Rechazar + mostrar formato correcto   |
| Nodo huérfano              | Graph validation en flow-architect | Reportar antes de delegar a flow-ing  |
| Ciclo en graph             | Graph validation en flow-architect | Reportar + pedir revisión             |
| Smoke test falla           | flow-ing testing pipeline          | NO guardar + log completo del error   |
| API de Flowise no responde | flow-ing                           | Retry 1x, luego reportar              |

## Performance Considerations

1. **Paralelismo**: Los specialists sin dependencias mutuas se ejecutan en paralelo. Ejemplo: Chat Model, Embeddings, y Vector Store pueden crearse simultáneamente.

2. **Caching**: Los golden templates se cargan una vez al inicio. No se re-parsean por request.

3. **Lazy loading**: Los Zod schemas se importan on-demand por categoría de nodo.

4. **Temp flow cleanup**: Siempre se borra el flow temporal después de los tests, incluso si fallan.

## User Interface — How the Pipeline is Triggered

### Automatic Mode (Default)

When the user requests a flow creation, the pipeline runs **automatically and transparently**:

```
User: "Create a RAG chatflow with OpenRouter and Supabase"
        ↓
flow-architect detects flow creation intent
        ↓
Runs the full pipeline internally (specialists → assembler → testing)
        ↓
Reports to user: "Created: NYC Knowledge Agent (ID: xxx). All tests passed ✅"
```

**The user does NOT need to know about the pipeline.** It's an implementation detail.

### Diagnostic Command (Manual)

For debugging or explicit validation, a diagnostic command is available:

| Command                       | Purpose                                   | When to use                             |
| ----------------------------- | ----------------------------------------- | --------------------------------------- |
| `/flow-diagnose <chatflowId>` | Runs testing pipeline on an existing flow | Flow is failing, need to understand why |
| `/flow-diagnose --draft`      | Validates a flowData before saving        | Preview validation without creating     |
| `/flow-diagnose --full`       | Runs all tests including integration      | Deep debugging                          |

Example:

```
User: "/flow-diagnose 9cfa4928-3770-4e07-8721-4f511b4efd21"
Agent:
  "Running diagnostic pipeline...
   Stage 1 (per-node-zod): ✅ PASS
   Stage 2 (full-flowdata): ✅ PASS
   Stage 3 (graph-connectivity): ❌ FAIL
     - Orphan node: retrieverTool_0 (no incoming/outgoing edges)
   Stage 4 (smoke-test): SKIPPED (graph invalid)

   Recommendation: Check edge connections for retrieverTool_0"
```

## Migration Path

Esta arquitectura NO rompe los flows existentes:

1. **Fase 1** (inmediata): Crear skills de specialists + schemas + registries. flow-architect y flow-ing siguen operando como antes.
2. **Fase 2**: flow-architect empieza a usar specialists opcionalmente (flag `useSpecialists: true`).
3. **Fase 3**: flow-ing empieza a ejecutar testing pipeline opcionalmente.
4. **Fase 4** (final): Hacer obligatorio el pipeline. Quitar acceso de escritura de flow-architect.

Cada fase es reversible sin afectar operaciones existentes.
