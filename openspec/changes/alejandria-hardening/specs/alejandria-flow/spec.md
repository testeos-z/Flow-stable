# Delta for Alejandria Flow

## ADDED Requirements

### Requirement: AF-001 — Structured Output via JSON Schema

Los nodos que producen JSON para el pipeline MUST usar `llmStructuredOutput` o `agentStructuredOutput` con un JSON Schema válido. El pipeline NO DEBE depender de regex stripping de fences markdown.

| Nodo | Schema fields |
|------|--------------|
| Router | `language, territory, intent, query_normalized, recommended_sources[]` |
| Lingüista PRE | `translated_queries: {territory: query}` |
| Bibliotecario | `search_plan: [{step, source, query, priority, match_count, reasoning}]` |
| Source Worker | `results: [{source, content, metadata, citation}]` |

#### Scenario: Router produce JSON parseable sin fences

- GIVEN query "climate policy NYC"
- WHEN Router procesa con `llmStructuredOutput` activo
- THEN output es JSON parseable sin ` ```json ` fences
- AND contiene `language`, `territory`, `intent`

#### Scenario: Bibliotecario produce search_plan con schema estricto

- GIVEN `router_result` con territory="nyc", query_normalized="climate policy"
- WHEN Bibliotecario genera el plan con `agentStructuredOutput`
- THEN output es un array de pasos con `step, source, query, priority, match_count, reasoning`
- AND no requiere Markdown Stripper posterior

### Requirement: AF-002 — Límites operativos

Todo nodo LLM/Agent MUST tener configurados: `temperature ≤ 0.2` para nodos JSON, `timeout ≥ 30000ms`, `agentMaxIterations ≤ 8` en Agents.

#### Scenario: Source Worker no excede 6 iteraciones

- GIVEN 5 MCP tools disponibles
- WHEN Source Worker itera llamando tools
- THEN no supera 6 iteraciones aunque queden tools sin llamar

#### Scenario: Timeout evita request colgado

- GIVEN un MCP lento (>90s)
- WHEN Source Worker llama la tool
- THEN el request se cancela a los 90s
- AND el flujo continúa con resultados parciales

### Requirement: AF-003 — Branching robus	to por evidencia

La condición `Has Results?` MUST evaluar `evidence.length > 0` (array parseado), no `notContains "[]"` (string match).

#### Scenario: Evidence vacía → Fallback

- GIVEN `evidence = []`
- WHEN condición evalúa
- THEN flujo redirige a Fallback Reply

#### Scenario: Source Worker error → Fallback

- GIVEN Source Worker devuelve `null` o string de error
- WHEN Merger parsea y produce `evidence = []`
- THEN fallback se activa correctamente

### Requirement: AF-004 — Fallback Reply multilenguaje

El Fallback Reply MUST usar `router_result.language` para seleccionar el idioma del mensaje. Idiomas soportados: ES, EN, PT. Default: EN.

#### Scenario: Usuario inglés sin resultados

- GIVEN `router_result.language = "en"`
- WHEN fallback se activa
- THEN mensaje: "I couldn't find relevant information..."

#### Scenario: Usuario portugués sin resultados

- GIVEN `router_result.language = "pt"`
- WHEN fallback se activa
- THEN mensaje en portugués

### Requirement: AF-005 — Memoria conversacional

Síntesis Final MUST tener `agentMemory` tipo `bufferWindowMemory` con `k=5`. Las queries fresh (sin chatId previo) NO DEBEN recibir contexto espurio.

#### Scenario: Follow-up mantiene contexto

- GIVEN query 1: "políticas climáticas en Madeira"
- AND query 2: "y en Nueva York?" (mismo chatId)
- WHEN Síntesis responde query 2
- THEN respuesta referencia ambos territorios usando memoria de query 1

#### Scenario: Query fresh sin contaminación

- GIVEN nuevo chatId
- WHEN usuario pregunta "energía renovable en UE"
- THEN respuesta no contiene referencias a conversaciones anteriores

### Requirement: AF-006 — Streaming disciplinado

Streaming MUST estar activo solo en Síntesis Final. Router, Lingüista, Bibliotecario y Source Worker DEBEN tener `streaming: false`.

#### Scenario: Streaming solo en último nodo

- GIVEN pipeline ejecutándose
- WHEN Router, Lingüista, Bibliotecario, Source Worker procesan
- THEN no emiten streaming chunks
- AND Síntesis Final sí emite streaming

### Requirement: AF-007 — Observabilidad

El chatflow MUST tener `analytic` configurado para capturar latencia por nodo, tokens por modelo, fallos MCP, y queries sin resultados.

#### Scenario: Métricas capturadas por query

- GIVEN query "air quality NYC"
- WHEN pipeline completa
- THEN analytic registra: latency por nodo, tokens totales, tool calls, status

## MODIFIED Requirements

None — no existing `alejandria-flow` spec to modify.

## REMOVED Requirements

### Requirement: AF-R01 — Markdown Stripper node

(Reason: Structured Output AF-001 garantiza JSON parseable sin fences. El nodo `customFunctionAgentflow_1` ya no es necesario y se elimina de la topología.)
