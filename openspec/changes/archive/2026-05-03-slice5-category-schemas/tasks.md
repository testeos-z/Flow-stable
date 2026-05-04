# Tasks: Slice 5 — Category Schemas

## Review Workload Forecast

| Field                   | Value                                 |
| ----------------------- | ------------------------------------- |
| Estimated changed lines | ~450 (categories.ts + tests + wiring) |
| 400-line budget risk    | Medium                                |
| Chained PRs recommended | Optional (evaluar tras PR1)           |
| Suggested split         | 1 PR si < 400 líneas, 2 PRs si > 400  |
| Delivery strategy       | feature-branch                        |
| Chain strategy          | N/A (single or 2-PR max)              |

Decision needed before apply: No
Chained PRs recommended: Optional
Chain strategy: feature-branch
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal                                                  | Likely PR        | Notes                                                |
| ---- | ----------------------------------------------------- | ---------------- | ---------------------------------------------------- |
| 1    | categories.ts core + validateCategory() + basic tests | PR 1             | ~280 líneas; cubre estructura base y tests unitarios |
| 2    | Wiring en validateNodeImpl.ts + integration tests     | PR 2 (si needed) | ~170 líneas; integraciones + tests de capa           |

## Phase 1: Category Schemas Core

-   [ ] 1.1 Create `.agents/skills/flow-node/schemas/categories.ts` — Enum Category con 5 valores: CHAT_MODELS, MEMORY, VECTOR_STORES, EMBEDDINGS, TOOLS (~20 líneas, no deps).
-   [ ] 1.2 Add Type CategorySchema con requiredInputParams, optionalInputParams, min/maxInputAnchors, min/maxOutputAnchors, semanticRules (~15 líneas, deps: 1.1).
-   [ ] 1.3 Implement getCategorySchema(category: string): CategorySchema | null — map string a CategorySchema, devuelve null si no reconocido (~30 líneas, deps: 1.2).
-   [ ] 1.4 Implement validateCategory(node, category): FlowNodeIssue[] — valida required params, anchor counts, aplica semanticRules (~80 líneas, deps: 1.3).

## Phase 2: Tests Unitarios

-   [ ] 2.1 Create `.agents/skills/flow-node/schemas/__tests__/categories.test.ts` (~180 líneas, deps: 1.1–1.4):
    -   CT-001: Enum Category tiene los 5 valores correctos
    -   CT-002: getCategorySchema() devuelve null para category desconocida
    -   CT-003: getCategorySchema() devuelve null para category undefined/null
    -   CT-004: getCategorySchema('Chat Models') devuelve schema con CHAT_MODELS
    -   CT-005: validateCategory() devuelve array vacío para nodo válido de Chat Models
    -   CT-006: validateCategory() devuelve error si falta required param en Chat Models
    -   CT-007: validateCategory() devuelve error si inputAnchors fuera de rango
    -   CT-008: validateCategory() para Memory con outputAnchors válidos
    -   CT-009: validateCategory() para Vector Stores con required params
    -   CT-010: validateCategory() para Embeddings con credential
    -   CT-011: validateCategory() para Tools con name
    -   CT-012: semanticRules aplicado (ej: modelName no vacío para Chat Models)

## Phase 3: Wiring en validateNodeImpl

-   [ ] 3.1 Modificar `.agents/skills/flow-node/schemas/validateNodeImpl.ts` — agregar Layer 4: después de ChatFlowNodeSchema, llamar validateCategory() con node.data.category (~30 líneas, deps: 1.4, test: existe en validateNode.test.ts).
-   [ ] 3.2 Agregar imports de categories.ts en validateNodeImpl.ts (dynamic import pattern como AgentFlowNodeSchema/ChatFlowNodeSchema) (~5 líneas, deps: 3.1).

## Phase 4: Re-export en index.ts

-   [ ] 4.1 Modificar `.agents/skills/flow-node/schemas/index.ts` — agregar re-export de Category, getCategorySchema, validateCategory (~5 líneas, deps: 1.1).

## Phase 5: Integration Tests

-   [ ] 5.1 Agregar tests de integración en `.agents/skills/flow-node/schemas/__tests__/validateNode.test.ts` para Layer 4 (~50 líneas, deps: 3.1–3.2):
    -   VT-CAT-001: validateNode() pasa para nodo Chat Models válido
    -   VT-CAT-002: validateNode() falla con error de categoría si falta required param
    -   VT-CAT-003: validateNode() falla con error de categoría si inputAnchors fuera de rango
    -   VT-CAT-004: validateNode() pasa para nodo Memory válido
    -   VT-CAT-005: validateNode() pasa para nodo Vector Stores válido

## Phase 6: Optional — validateChatFlowTemplate() Wiring

-   [ ] 6.1 Opcional: agregar Layer 4 en validateChatFlowTemplate() de chatflow.ts (~20 líneas, deps: 3.1).

## Notes

-   NO incluir Agents en Slice 5 (excluido explícitamente por el usuario)
-   NO incluir credential UUID validation — eso es Slice 8
-   Los nombres de categoría en templates son strings: "Chat Models", "Memory", "Vector Stores", "Embeddings", "Tools"
-   Usar los templates existentes de Slice 4 como golden references para validaciones
-   Los tests siguen el patrón Vitest AAA (Arrange-Act-Assert)
