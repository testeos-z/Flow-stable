# Design: Slice 7 — Full-Coverage Metadata-Driven Generator

## Technical Approach

Generator script que lee 00-node-catalogue.md + 01-credential-map.md, extrae metadata de templates existentes, y genera Zod schemas + wiring code para los 302 nodos. Hybrid model: developer corre `generate-node-schemas.ts` → CI verifica drift con `check-drift.ts`.

## Architecture Decisions

### Decision 1: Generator Location

**Choice**: `.agents/skills/flow-node/scripts/generate-node-schemas.ts`
**Alternatives considered**: Standalone `scripts/` en repo root, dentro de `schemas/`
**Rationale**: Cohesión con skill actual de flow-node. Templates y schemas ya viven ahí.

### Decision 2: Output Structure

**Choice**: `schemas/nodes/generated/{category}/` con 8 carpetas paralelas a templates
**Alternatives considered**: Todo en un solo archivo, generación por-nodo individual
**Rationale**: Mantiene la estructura por categoría ya establecida (chatModels, embeddings, memory, etc). each file manageable (~30-50 nodos).

### Decision 3: Drift Detection Strategy

**Choice**: `_version.json` con checksums + `check-drift.ts` que exit(1) si drift
**Alternatives considered**: Git diff-based, timestamp comparison
**Rationale**: Checksums capturan contenido real, no solo timestamps. Immune tofilesystem quirks. CI-safe.

### Decision 4: Schema Coverage Strategy

**Choice**: Todos los nodos con graceful degradation (unknown → warning)
**Alternatives considered**: Solo generar para nodos con templates existentes
**Rationale**: 302 nodos catálogo vs templates existentes (15 agentflows + 8 chatflows). Gap significativo. Graceful degradation evita romper flujos existentes.

## Data Flow

```
00-node-catalogue.md ──┐
                      ├──► generate-node-schemas.ts ──► schemas/nodes/generated/{cat}/*.ts
01-credential-map.md ──┘                              └──► _version.json (checksums)
                                                      │
                          templates/* ──► check-drift.ts ──► exit(1) si drift
```

## File Changes

| File                                                             | Action | Description                                     |
| ---------------------------------------------------------------- | ------ | ----------------------------------------------- |
| `.agents/skills/flow-node/scripts/generate-node-schemas.ts`      | Create | Generator script. Lee catálogos, genera schemas |
| `.agents/skills/flow-node/scripts/check-drift.ts`                | Create | Drift detector. Compara checksums vs templates  |
| `.agents/skills/flow-node/schemas/nodes/generated/`              | Create | 8 carpetas por categoría. ~250 node schemas     |
| `.agents/skills/flow-node/schemas/nodes/generated/_version.json` | Create | Checksums manifest                              |
| `.agents/skills/flow-node/schemas/nodes/index.ts`                | Modify | Agregar exports + wiring para los 302 nodos     |
| `.agents/skills/flow-node/schemas/nodes/chatModels.ts`           | Modify | Mantener existentes, append generated           |
| `.agents/skills/flow-node/schemas/nodes/embeddings.ts`           | Modify | Same                                            |
| `.agents/skills/flow-node/schemas/nodes/memory.ts`               | Modify | Same                                            |
| `.agents/skills/flow-node/schemas/nodes/vectorStores.ts`         | Modify | Same                                            |
| `.agents/skills/flow-node/schemas/nodes/tools.ts`                | Modify | Same                                            |
| `.agents/skills/flow-node/schemas/nodes/agents.ts`               | Modify | Same                                            |
| `.agents/skills/flow-node/schemas/nodes/chains.ts`               | Create | Chains, retrievers, text splitters, etc         |
| `.agents/skills/flow-node/schemas/nodes/documentLoaders.ts`      | Create | 41 document loaders                             |
| `.agents/skills/flow-node/schemas/nodes/cache.ts`                | Create | Cache nodes                                     |
| `.agents/skills/flow-node/schemas/nodes/outputParsers.ts`        | Create | Output parsers                                  |
| `.agents/skills/flow-node/schemas/nodes/prompts.ts`              | Create | Prompt templates                                |
| `.agents/skills/flow-node/schemas/nodes/moderation.ts`           | Create | Moderation nodes                                |
| `.agents/skills/flow-node/schemas/nodes/recordManagers.ts`       | Create | Record managers                                 |
| `.agents/skills/flow-node/schemas/nodes/engine.ts`               | Create | Engine nodes                                    |
| `.agents/skills/flow-node/schemas/nodes/analytics.ts`            | Create | Analytics nodes                                 |
| `.agents/skills/flow-node/schemas/nodes/synthesizers.ts`         | Create | Response synthesizers                           |
| `.agents/skills/flow-node/schemas/nodes/graph.ts`                | Create | Graph nodes                                     |
| `.agents/skills/flow-node/schemas/nodes/utilities.ts`            | Create | Utilities                                       |

## Interfaces / Contracts

### Generator Output Contract

Cada schema generado sigue el patrón existente:

```typescript
export const {nodeName}Schema = z.object({ ...fields })
export function validate{NodeName}(node: unknown): FlowNodeIssue[] { ... }
```

### NODE_SCHEMA_MAP Entry

```typescript
// Generated entry
{nodeName}: validate{NodeName}
```

### \_version.json Contract

```json
{
  "version": "1.0",
  "generatedAt": "ISO timestamp",
  "nodeCount": 302,
  "checksums": {
    "{category}": "sha256...",
    ...
  }
}
```

## Testing Strategy

| Layer       | What to Test                                 | Approach                            |
| ----------- | -------------------------------------------- | ----------------------------------- |
| Unit        | Generator script parses catalogues correctly | Vitest unit test                    |
| Unit        | Generated schemas parse valid nodes          | Snapshot tests                      |
| Integration | validatePerNode for all 302 node types       | Vitest with mock data               |
| Integration | check-drift detects real drift               | Test fixture with modified template |

## Migration / Rollout

No migration required — generated code only. CI gate prevents drift from entering codebase.

## Open Questions

-   [ ] ¿Include 12 deprecated LLMs nodes from catalogue? (decision: exclude, add TODO)
-   [ ] ¿Merge generated files into existing category files or keep separate? (decision: merge into existing category files per TDD pattern)
-   [ ] ¿Include credential validation for optional credentials? (decision: yes, validate when present)
