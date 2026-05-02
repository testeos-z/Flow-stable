# Tasks: Flow Creation Agent Pipeline with Zod Validation

## Phase 1: Foundation (Infrastructure)

### 1.1 Create shared schemas and types

**Priority**: P0 (blocks everything)
**Files**:

-   `.agents/schemas/shared-node-fields.ts`
-   `.agents/schemas/flow-data.ts`
-   `.agents/schemas/index.ts`

**Details**:

-   Define `PositionSchema`, `InputParamSchema`, `InputAnchorSchema`, `OutputAnchorSchema`
-   Define `IReactFlowNodeSchema`, `IReactFlowEdgeSchema`, `IReactFlowObjectSchema`
-   Export types derivados de Zod (`type IReactFlowNode = z.infer<typeof IReactFlowNodeSchema>`)

**Acceptance Criteria**:

-   [ ] Schemas compilan sin errores
-   [ ] Validación de un flowData real pasa (`IReactFlowObjectSchema.safeParse(existingFlowData)`)

---

### 1.2 Create registry modules

**Priority**: P0
**Files**:

-   `.agents/registry/model-capabilities.ts`
-   `.agents/registry/credential-uuids.ts`
-   `.agents/registry/index.ts`

**Details**:

-   Model registry con al menos 10 modelos free de OpenRouter verificados manualmente
-   Credential registry con UUIDs reales del entorno dev (extraídos de Flowise UI)
-   Funciones helper: `getCompatibleModels()`, `getCredentialUuid()`, `validateModelForRequirements()`

**Acceptance Criteria**:

-   [ ] `getCompatibleModels({ toolCalling: true, free: true })` retorna modelos que realmente soportan tools
-   [ ] `getCredentialUuid("openRouterApi", "dev")` retorna UUID correcto

---

### 1.3 Create golden template extraction script

**Priority**: P1
**Files**:

-   `.agents/scripts/extract-golden-templates.ts`

**Details**:

-   Script que se conecta a Flowise API, crea un flow con un nodo de cada tipo, extrae el JSON exacto
-   Guarda templates en `.agents/schemas/golden-templates/{nodeName}.json`
-   Documentar cómo ejecutarlo

**Acceptance Criteria**:

-   [ ] Script puede extraer al menos 5 nodos diferentes
-   [ ] Los templates extraídos se pueden comparar con la UI (match exacto)

---

## Phase 2: Node Specialists (Skills)

### 2.1 Create node-specialist-chat-models skill

**Priority**: P0
**Files**:

-   `.agents/skills/node-specialist-chat-models/SKILL.md`
-   `.agents/skills/node-specialist-chat-models/schemas/chatOpenRouter.ts`
-   `.agents/skills/node-specialist-chat-models/schemas/chatAnthropic.ts`
-   `.agents/skills/node-specialist-chat-models/schemas/index.ts`

**Details**:

-   SKILL.md con reglas del specialist (qué modelos soporta, cómo validar)
-   Zod schema para `chatOpenRouter` basado en golden template
-   Zod schema para `chatAnthropic`
-   Validación de `credential` como UUID
-   Validación de que el modelo soporta `toolCalling` si el requirement lo pide

**Acceptance Criteria**:

-   [ ] Schema valida un nodo `chatOpenRouter` real correctamente
-   [ ] Schema rechaza `credential: "openRouterApi"` (no es UUID)
-   [ ] Schema rechaza modelo `minimax/minimax-m2.5:free` cuando `toolCalling: true`

---

### 2.2 Create node-specialist-vector-stores skill

**Priority**: P0
**Files**:

-   `.agents/skills/node-specialist-vector-stores/SKILL.md`
-   `.agents/skills/node-specialist-vector-stores/schemas/supabase.ts`
-   `.agents/skills/node-specialist-vector-stores/schemas/index.ts`

**Details**:

-   Schema para nodo `supabase` (vector store)
-   Validación de campos específicos: `tableName`, `queryName`, `contentColumnName`, etc.
-   Validación de que `queryName` apunta a una función RPC existente

**Acceptance Criteria**:

-   [ ] Schema valida nodo Supabase con `queryName: "match_nyc_flowise"`
-   [ ] Schema rechaza `queryName` vacío

---

### 2.3 Create node-specialist-embeddings skill

**Priority**: P1
**Files**:

-   `.agents/skills/node-specialist-embeddings/SKILL.md`
-   `.agents/skills/node-specialist-embeddings/schemas/huggingFace.ts`
-   `.agents/skills/node-specialist-embeddings/schemas/index.ts`

**Details**:

-   Schema para `huggingFaceInferenceEmbeddings`
-   Schema para `openAIEmbeddings`
-   Validación de `model` y `endpoint` para HuggingFace

**Acceptance Criteria**:

-   [ ] Schema valida embedding con `model: "intfloat/multilingual-e5-large-instruct"`

---

### 2.4 Create node-specialist-tools skill

**Priority**: P1
**Files**:

-   `.agents/skills/node-specialist-tools/SKILL.md`
-   `.agents/skills/node-specialist-tools/schemas/retrieverTool.ts`
-   `.agents/skills/node-specialist-tools/schemas/customMcpTool.ts`
-   `.agents/skills/node-specialist-tools/schemas/index.ts`

**Details**:

-   Schema para `retrieverTool`
-   Schema para `customMcpTool`
-   Validación de template syntax en `description` y `name`

**Acceptance Criteria**:

-   [ ] Schema valida retrieverTool con conexión a vector store

---

### 2.5 Create node-specialist-agents skill

**Priority**: P1
**Files**:

-   `.agents/skills/node-specialist-agents/SKILL.md`
-   `.agents/skills/node-specialist-agents/schemas/toolAgent.ts`
-   `.agents/skills/node-specialist-agents/schemas/index.ts`

**Details**:

-   Schema para `toolAgent`
-   Validación crítica de template syntax en `inputs.systemMessage`, `input.model`, `input.tools`
-   Validación de que `model` usa sintaxis `{{nodeId.data.instance}}`

**Acceptance Criteria**:

-   [ ] Schema valida toolAgent con `model: "{{chatOpenRouter_0.data.instance}}"`
-   [ ] Schema rechaza `model: "chatOpenRouter_0"` (sin template syntax)

---

### 2.6 Create node-specialist-memory skill

**Priority**: P2 (menos crítico)
**Files**:

-   `.agents/skills/node-specialist-memory/SKILL.md`
-   `.agents/skills/node-specialist-memory/schemas/bufferMemory.ts`
-   `.agents/skills/node-specialist-memory/schemas/index.ts`

**Details**:

-   Schema para `bufferMemory` y `windowMemory`

**Acceptance Criteria**:

-   [ ] Schema valida bufferMemory correctamente

---

## Phase 3: Flow Assembler & Testing Pipeline

### 3.1 Create flow assembler module

**Priority**: P0
**Files**:

-   `.agents/skills/flow-architect/orchestrator.md` (nuevo)
-   `.agents/skills/flow-architect/assembler.ts` (o módulo)

**Details**:

-   Función `assembleFlowData(nodes: any[], connections: ConnectionSpec[]): IReactFlowObject`
-   Genera edges automáticamente basado en connections
-   Inyecta viewport default
-   Valida graph (huérfanos, ciclos)

**Acceptance Criteria**:

-   [ ] Assembler genera flowData válido para un flow de 5 nodos
-   [ ] Detecta y reporta nodos huérfanos
-   [ ] Detecta ciclos en el graph

---

### 3.2 Create testing pipeline module

**Priority**: P0
**Files**:

-   `.agents/skills/flow-ing/testing-pipeline.ts`

**Details**:

-   Implementar `runTestingPipeline()` según design.md
-   Stage 1: Per-node Zod (usa schemas de specialists)
-   Stage 2: Full flowData schema
-   Stage 3: Graph validation
-   Stage 4: Smoke test via API (crear temp flow, predict, borrar)
-   Stage 5: Integration test (forzar tool invocation si aplica)
-   Cleanup garantizado (finally block)

**Acceptance Criteria**:

-   [ ] Pipeline detecta un nodo con inputParams incompleto
-   [ ] Pipeline detecta un graph con nodos huérfanos
-   [ ] Pipeline ejecuta smoke test en un flow existente y pasa
-   [ ] Pipeline borra el temp flow incluso si falla

---

### 3.3 Create flow-ing executor rules

**Priority**: P0
**Files**:

-   `.agents/skills/flow-ing/SKILL.md`
-   `.agents/skills/flow-ing/executor-rules.md`

**Details**:

-   SKILL.md con instrucciones claras: "Solo vos podés escribir en Flowise"
-   Reglas de cuándo aceptar/rechazar un flowData de flow-architect
-   Integración con testing pipeline

**Acceptance Criteria**:

-   [ ] SKILL.md documenta claramente el monopolio de escritura
-   [ ] Reglas definen que flowData debe pasar testing pipeline antes de guardar

---

### 3.4 Create `/flow-diagnose` command handler

**Priority**: P1
**Files**:

-   `.agents/skills/flow-ing/diagnostic-command.md`
-   Integration in flow-ing SKILL.md

**Details**:

-   Parse command: `/flow-diagnose <chatflowId> [--draft] [--full]`
-   Fetch flowData from Flowise API (if existing flow)
-   Run testing pipeline
-   Format output report with per-stage results
-   Suggest specific fixes for failures

**Acceptance Criteria**:

-   [ ] `/flow-diagnose <id>` runs full pipeline on existing flow
-   [ ] `/flow-diagnose --draft` validates flowData without saving
-   [ ] Output shows ✅/❌ per stage with actionable error messages
-   [ ] Suggests fixes (e.g., "Add edge from node X to node Y")

---

## Phase 4: Refactor Existing Skills

### 4.1 Refactor flow-architect to read-only orquestador

**Priority**: P0
**Files**:

-   `.agents/skills/flow-architect/SKILL.md` (modificar)

**Details**:

-   Quitar TODAS las referencias a tools de escritura en Flowise
-   Agregar sección de orquestación: cómo delegar a specialists
-   Agregar flujo de trabajo: recibir requerimiento → diseñar → delegar a specialists → ensamblar → delegar a flow-ing
-   Mantener referencias existentes (FACTUM, ÁGORA, etc.)

**Acceptance Criteria**:

-   [ ] SKILL.md no tiene instrucciones de crear/modificar/borrar flows en Flowise
-   [ ] SKILL.md tiene sección clara de "Cómo orquestar la creación de flows"
-   [ ] Referencias existentes se mantienen intactas

---

### 4.2 Verify flow-architect cannot write to Flowise

**Priority**: P0
**Files**: N/A (prueba manual)

**Details**:

-   Verificar que flow-architect no tiene acceso a `flow-validation_create_chatflow`, `update_chatflow`, `delete_chatflow`
-   Si las tools están disponibles en el entorno, asegurar que el SKILL.md prohíba explícitamente su uso

**Acceptance Criteria**:

-   [ ] Si se le pide a flow-architect "creá un flow", debe responder "Delego a flow-ing" en vez de ejecutar

---

## Phase 5: Integration & Validation

### 5.1 End-to-end test: Create NYC Knowledge Agent with new pipeline

**Priority**: P0
**Files**: N/A (prueba de integración)

**Details**:

-   Usar el pipeline completo para recrear el flow `NYC Knowledge Agent`
-   Comparar resultado con el flow existente (debe ser igual o mejor)
-   Verificar que pasa todos los tests

**Acceptance Criteria**:

-   [ ] Flow creado con pipeline funciona correctamente
-   [ ] Vector store retorna chunks (no vacío)
-   [ ] MCP tool responde
-   [ ] Testing pipeline pasa al 100%

---

### 5.2 Regression test: Existing flows still work

**Priority**: P1
**Files**: N/A (prueba de regresión)

**Details**:

-   Verificar que flows existentes (FACTUM, ÁGORA, POLITEIA) siguen funcionando
-   Los skills nuevos no deben afectar operaciones existentes

**Acceptance Criteria**:

-   [ ] Flows existentes no se rompen
-   [ ] No hay cambios en la DB de Flowise no intencionales

---

### 5.3 Document the new architecture

**Priority**: P1
**Files**:

-   `.agents/skills/flow-architect/orchestrator.md`
-   `.agents/skills/flow-ing/README.md` (o similar)
-   `.agents/skills/README.md` (índice de todos los skills)

**Details**:

-   Diagrama de arquitectura
-   Flujo de trabajo paso a paso
-   Cómo agregar un nuevo tipo de nodo (nuevo specialist)
-   Troubleshooting común

**Acceptance Criteria**:

-   [ ] Documentación permite a un nuevo dev entender el pipeline en 10 minutos

---

## Task Dependencies Graph

```
Phase 1:
  1.1 Shared Schemas ──────┬──→ Phase 2 (todos los specialists)
  1.2 Registry ────────────┤
  1.3 Extraction Script ───┘ (P1, no bloquea)

Phase 2:
  2.1 Chat Models ─────────┐
  2.2 Vector Stores ───────┼──→ Phase 3 (assembler usa schemas)
  2.3 Embeddings ──────────┤
  2.4 Tools ───────────────┤
  2.5 Agents ──────────────┤
  2.6 Memory ──────────────┘ (P2, no bloquea)

Phase 3:
  3.1 Assembler ───────────┐
  3.2 Testing Pipeline ────┼──→ Phase 5 (integración)
  3.3 Executor Rules ──────┘

Phase 4:
  4.1 Refactor architect ──┐
  4.2 Verify read-only ────┼──→ Phase 5 (integración)
                           │
Phase 5:                   │
  5.1 E2E Test ────────────┘
  5.2 Regression Test
  5.3 Documentation
```

## Estimated Effort

| Phase                | Tasks  | Est. Effort | Risk                                   |
| -------------------- | ------ | ----------- | -------------------------------------- |
| Phase 1: Foundation  | 3      | 1 día       | Bajo                                   |
| Phase 2: Specialists | 6      | 3 días      | Medio (schemas pueden ser complejos)   |
| Phase 3: Pipeline    | 3      | 2 días      | Medio (tests con API pueden ser flaky) |
| Phase 4: Refactor    | 2      | 0.5 días    | Bajo                                   |
| Phase 5: Integration | 3      | 1.5 días    | Medio                                  |
| **Total**            | **17** | **~8 días** |                                        |

## Next Action

Ready to start **Phase 1.1** (Shared Schemas) when approved.
