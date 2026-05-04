# Tasks: Slice 6 — Per-node Schemas + Credential Validation

## Review Workload Forecast

| Field                   | Value                                                                           |
| ----------------------- | ------------------------------------------------------------------------------- |
| Estimated changed lines | ~600 (6 node schema files + credentials.ts + wiring + 2 test files + issues.ts) |
| 400-line budget risk    | Medium                                                                          |
| Chained PRs recommended | Yes                                                                             |
| Suggested split         | PR 1 → PR 2 → PR 3                                                              |
| Delivery strategy       | ask-on-risk                                                                     |

Decision needed before apply: No
Chained PRs recommended: Yes
400-line budget risk: Medium

## Fases

### Fase 1: Infra + Credential Validation (PR 1 — ~150 lines)

**T1** — Agregar error codes en `schemas/issues.ts`

-   Agregar `CREDENTIAL_NOT_FOUND`, `CREDENTIAL_PROVIDER_MISMATCH`, `INVALID_PER_NODE_PARAM`
-   Files: `schemas/issues.ts`

**T2** — Crear `schemas/credentials.ts`

-   `CREDENTIAL_PROVIDER_MAP`: `Record<string, CredentialProvider>` mapeando 8 nodos a su provider
-   `validateCredential(credentialId): boolean` — `z.string().uuid().safeParse(credentialId).success`
-   `validateCredentialProvider(nodeName, credentialId): FlowNodeIssue[]` — busca en el map, retorna issues si mismatch
-   Tests: `schemas/__tests__/credentials.test.ts` (6 tests min: UUID valid, empty, invalid format, provider match, provider mismatch, unknown node)

### Fase 2: Per-node Schemas (PR 2 — ~350 lines)

**T3** — Crear `schemas/nodes/chatModels.ts`

-   `chatOpenRouterSchema`: credential (uuid, optional), modelName (string, default "openai/gpt-3.5-turbo"), temperature, maxTokens, topP, frequencyPenalty, presencePenalty, streaming, allowImageUploads, timeout, basepath, baseOptions
-   `chatOpenAISchema`: credential (uuid, optional), modelName, reasoning, reasoningEffort, reasoningSummary, strictToolCalling, stopSequence, basepath, baseOptions
-   `chatAnthropicSchema`: credential (uuid, optional), modelName, extendedThinking, budgetTokens, adaptiveThinking, thinkingEffort, maxTokensToSample, topP, topK
-   All schemas use `.passthrough()` para tolerar campos desconocidos

**T4** — Crear `schemas/nodes/memory.ts`

-   `bufferMemorySchema`: sessionId (string, optional), memoryKey (string, optional, default "chat_history")
-   `.passthrough()`

**T5** — Crear `schemas/nodes/embeddings.ts`

-   `huggingFaceInferenceEmbeddingSchema`: credential (uuid), modelName (string, optional), endpoint (string, optional)
-   `.passthrough()`

**T6** — Crear `schemas/nodes/vectorStores.ts`

-   `supabaseSchema`: supabaseProjUrl (string), tableName (string), queryName (string, optional), supabaseMetadataFilter, supabaseRPCFilter, topK, searchType, fetchK, lambda, recordManager
-   `.passthrough()`

**T7** — Crear `schemas/nodes/tools.ts`

-   `retrieverToolSchema`: name (string), description (string, optional), returnSourceDocuments (boolean), retrieverToolMetadataFilter (object, optional)
-   `.passthrough()`

**T8** — Crear `schemas/nodes/agents.ts`

-   `toolAgentSchema`: systemMessage (string, optional), maxIterations (number, optional, default 5), returnDirect (boolean, optional)
-   `.passthrough()`

**T9** — Crear `schemas/nodes/index.ts`

-   Re-export all node schemas
-   `NODE_SCHEMA_MAP: Record<string, ZodObject>` — mapea node name → schema
-   `getPerNodeSchema(nodeName: string): ZodObject | null`
-   `validatePerNode(node: Record<string, unknown>): FlowNodeIssue[]` — busca schema, safeParse, retorna issues

### Fase 3: Layer 5 Wiring + Integration Tests (PR 3 — ~100 lines)

**T10** — Agregar Layer 5 en `schemas/validateNodeImpl.ts`

-   Agregar dynamic import de `./nodes/index.js` en `_ensureCache`
-   Llamar `validatePerNode(node)` después de Layer 4
-   Si hay errores → `valid: false, node: null`
-   Mantener compatibilidad: nodos sin per-node schema pasan (skip)

**T11** — Actualizar re-exports en `schemas/index.ts`

-   Re-export `validatePerNode`, `getPerNodeSchema`, `validateCredential`, `validateCredentialProvider`
-   Re-export `CREDENTIAL_PROVIDER_MAP`

**T12** — Crear `schemas/__tests__/perNode.test.ts`

-   3 tests por nodo (24 tests): válido → 0 issues, required param faltante → error, required param vacío → error
-   2 tests de validatePerNode: nodo sin schema → [ ], nodo con schema roto → errores

**T13** — Actualizar `schemas/__tests__/validateNode.test.ts`

-   Modificar Test 7 (credential UUID inválido): cambiar de `expect(result.valid).toBe(true)` a `expect(result.valid).toBe(false)` con error code esperado
-   Agregar test: per-node validation rechaza nodo conocido con campo roto
-   Agregar test: nodo sin per-node schema pasa (regression)

**T14** — Ejecutar suite completa (`vitest run --config schemas/vitest.config.ts`)

-   Verificar que todos los tests existentes + nuevos pasan (target: ~165 tests)
