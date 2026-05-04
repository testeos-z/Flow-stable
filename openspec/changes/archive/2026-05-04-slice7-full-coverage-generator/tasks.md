# Tasks: Slice 7 — Full-Coverage Metadata-Driven Generator

## Review Workload Forecast

| Field                   | Value                                           |
| ----------------------- | ----------------------------------------------- |
| Estimated changed lines | ~2000 (700 reviewed + 1300 generated)           |
| 400-line budget risk    | Medium (generated code offsets review load)     |
| Chained PRs recommended | Yes                                             |
| Suggested split         | PR 1 (generator) → PR 2 (wiring) → PR 3 (tests) |
| Delivery strategy       | ask-on-risk                                     |
| Chain strategy          | stacked-to-main                                 |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal                                     | Likely PR | Notes                        |
| ---- | ---------------------------------------- | --------- | ---------------------------- |
| 1    | Generator script + drift checker         | PR 1      | Core infrastructure          |
| 2    | Generated schemas + wiring into index.ts | PR 2      | Depends on PR 1              |
| 3    | Tests for generator + drift checker      | PR 3      | Independent, can parallelize |

## Phase 1: Generator Infrastructure (PR 1)

-   [ ] 1.1 Create `.agents/skills/flow-node/scripts/generate-node-schemas.ts` with TypeScript
-   [ ] 1.2 Parse 00-node-catalogue.md extracting node names + categories
-   [ ] 1.3 Parse 01-credential-map.md extracting credential requirements per node
-   [ ] 1.4 Read existing templates for field metadata (inputParams types)
-   [ ] 1.5 Generate Zod schemas por categoría (chatModels, embeddings, memory, etc.)
-   [ ] 1.6 Output `_version.json` con checksums de archivos generados
-   [ ] 1.7 Create `check-drift.ts` que lee `_version.json` y compara vs templates reales
-   [ ] 1.8 Exit(1) si drift detectado en check-drift.ts

## Phase 2: Schema Generation + Wiring (PR 2)

-   [ ] 2.1 Generate `schemas/nodes/generated/chatModels/` (~36 nodes)
-   [ ] 2.2 Generate `schemas/nodes/generated/embeddings/` (~18 nodes)
-   [ ] 2.3 Generate `schemas/nodes/generated/memory/` (~15 nodes)
-   [ ] 2.4 Generate `schemas/nodes/generated/chains/` (~13 nodes)
-   [ ] 2.5 Generate `schemas/nodes/generated/tools/` (39 tools + 11 MCP = 50 nodes)
-   [ ] 2.6 Generate `schemas/nodes/generated/vectorStores/` (~26 nodes)
-   [ ] 2.7 Generate `schemas/nodes/generated/retrievers/` (~15 nodes)
-   [ ] 2.8 Generate `schemas/nodes/generated/documentLoaders/` (~41 nodes)
-   [ ] 2.9 Generate misc categories (cache, outputParsers, prompts, moderation, recordManagers, engine, graph, analytics, synthesizers, utilities) — ~52 nodes
-   [ ] 2.10 Update `schemas/nodes/index.ts` para exportar todos los schemas generados y agregarlos al NODE_SCHEMA_MAP

## Phase 3: Testing + CI Gate (PR 3)

-   [ ] 3.1 Write unit tests para generate-node-schemas.ts (parsing logic)
-   [ ] 3.2 Write unit tests para check-drift.ts (drift detection)
-   [ ] 3.3 Write integration tests para validatePerNode con todos los 302 node types (mock data)
-   [ ] 3.4 Configure CI to run `tsx scripts/check-drift.ts` as safety gate
-   [ ] 3.5 Add generated schemas to Vitest coverage

## Phase 4: Cleanup

-   [ ] 4.1 Remove PLACEHOLDER_ID comments from generated code
-   [ ] 4.2 Verify graceful degradation (unknown nodes → warning, not error)
-   [ ] 4.3 Update skill registry entry for flow-node skill

## Implementation Order

1. **PR 1 first**: Generator and drift checker are independent. No generated schemas exist yet, so wiring can't happen.
2. **PR 2 second**: Run generator → produces schemas → wire into index.ts → verify validatePerNode works for generated nodes.
3. **PR 3 third**: Tests for generator (needs generator to exist), tests for drift checker, integration tests for all 302 nodes.

Note: PR 3 can start in parallel with PR 2 once generator exists — write tests without generated output to validate generator itself.
