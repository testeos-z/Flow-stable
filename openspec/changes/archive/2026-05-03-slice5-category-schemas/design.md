# Design: Slice 5 — Category Schemas

## Technical Approach

Agregar una capa de validación intermedia entre `ChatFlowNodeSchema` (Layer 3) y el resultado final. Esta capa valida que los nodos ChatFlow cumplan con las expectativas específicas de su categoría: campos obligatorios, estructura de `inputAnchors`/`outputAnchors`, y reglas semánticas propias de cada tipo de nodo.

## Architecture Decisions

| Decision            | Choice                                                                                 | Rationale                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Location            | `schemas/categories.ts` (nuevo)                                                        | Separa la lógica de categorías del esquema base de ChatFlow; facilita mantenimiento y testing. |
| Enum Category       | 5 valores: `CHAT_MODELS`, `MEMORY`, `VECTOR_STORES`, `EMBEDDINGS`, `TOOLS`             | Alineado con las 5 categorías presentes en los 8 templates ChatFlow de Slice 4.                |
| CategorySchema      | Objeto con `requiredInputParams`, `requiredAnchors`, `optionalParams`, `semanticRules` | Permite validación estática (presencia de campos) y validación semántica (reglas de negocio).  |
| getCategorySchema() | Devuelve null para categorías unknown                                                  | Graceful degradation; la capa siguiente (per-node) puede rechazar nodos no reconocidos.        |
| validateCategory()  | Devuelve array de FlowNodeIssue[]                                                      | Mantiene el patrón de issues existente; errores categorizados por severidad.                   |
| Integración         | Layer 4 en validateNodeImpl.ts después de ChatFlowNodeSchema                           | Sigue la secuencia: estructura base → tipo de flow → categoría → nodo específico.              |

## Data Flow

```
validateNode() en validateNodeImpl.ts
    │
    ├─ Layer 1: ReactFlowNodeSchema
    ├─ Layer 2: NodeDataSchema
    ├─ Layer 3: ChatFlowNodeSchema
    │
    ▼ Layer 4: Category Schema (NUEVO)
    getCategorySchema(data.category)
        │
        ├─ Chat Models → validar credential, modelName, inputAnchors: [source]
        ├─ Memory → validar sessionId/memoryKey opcionales, outputAnchors: [source]
        ├─ Vector Stores → validar tableName, inputAnchors: [target, source], outputAnchors: [source]
        ├─ Embeddings → validar credential, inputAnchors: [target], outputAnchors: [source]
        └─ Tools → validar name, inputAnchors: [target], outputAnchors: [source]
    │
    ▼
    validateCategory(node, category) → FlowNodeIssue[]
    │
    ▼ FlowNodeResponse
```

## File Changes

| File                                     | Action | Description                                                                            |
| ---------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `schemas/categories.ts`                  | Create | Enum Category + Type CategorySchema + getCategorySchema() + validateCategory()         |
| `schemas/index.ts`                       | Modify | Re-exportar Category, getCategorySchema, validateCategory                              |
| `schemas/validateNodeImpl.ts`            | Modify | Integrar validateCategory() como Layer 4 post-ChatFlowNodeSchema                       |
| `schemas/__tests__/categories.test.ts`   | Create | Tests: enum coverage, getCategorySchema null/undefined, validateCategory por categoría |
| `schemas/__tests__/validateNode.test.ts` | Modify | Agregar tests de integración Layer 4                                                   |

## Interfaces / Contracts

### Category Enum

```typescript
export enum Category {
    CHAT_MODELS = 'Chat Models',
    MEMORY = 'Memory',
    VECTOR_STORES = 'Vector Stores',
    EMBEDDINGS = 'Embeddings',
    TOOLS = 'Tools'
}
```

### CategorySchema Type

```typescript
export interface CategorySchema {
    category: Category
    requiredInputParams: string[] // Nombres de params obligatorios
    optionalInputParams: string[] // Nombres de params opcionales
    minInputAnchors: number // Mínimo de anclas de entrada
    maxInputAnchors: number // Máximo de anclas de entrada
    minOutputAnchors: number // Mínimo de anclas de salida
    maxOutputAnchors: number // Máximo de anclas de salida
    semanticRules?: (node: Record<string, unknown>) => FlowNodeIssue[]
}
```

### getCategorySchema()

```typescript
export function getCategorySchema(category: string): CategorySchema | null
```

-   Input: `data.category` del nodo (string)
-   Output: `CategorySchema` correspondiente o `null` si no se reconoce

### validateCategory()

```typescript
export function validateCategory(node: Record<string, unknown>, category: string): FlowNodeIssue[]
```

-   Input: nodo parseado + category
-   Output: array de issues (vacío si todo OK)
-   Valida:
    1. Required inputParams presentes
    2. inputAnchors count dentro de los límites
    3. outputAnchors count dentro de los límites
    4. Reglas semánticas específicas de la categoría

## Category Rules (Initial Set)

| Category      | Required Params                | Anchors (in/out) | Semantic Rules                                                         |
| ------------- | ------------------------------ | ---------------- | ---------------------------------------------------------------------- |
| Chat Models   | `credential`, `modelName`      | 0-1 / 1          | credential type debe ser 'credential', modelName no vacío              |
| Memory        | ninguno obligatorio            | 0 / 1            | sessionId o memoryKey debe estar presente si hay más de 1 outputAnchor |
| Vector Stores | `supabaseProjUrl`, `tableName` | 1-2 / 1          | tableName no vacío, queryName opcional                                 |
| Embeddings    | `credential`                   | 1 / 1            | credential type debe ser 'credential'                                  |
| Tools         | `name`                         | 1 / 1            | name no vacío                                                          |

## Omitted for Slice 5

-   ❌ Credential UUID validation (Slice 8)
-   ❌ Per-node schemas (Slice 6-7)
-   ❌ Full coverage generator para todas las categorías de Flowise (fuera de scope, ~302 nodes)
-   ❌ Agents validation (excluido explícitamente)
