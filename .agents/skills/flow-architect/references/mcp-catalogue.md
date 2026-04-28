# MCP Catalogue

**Registry**: `src/utils/agent/data/mcp/McpRegistry/McpRegistry.ts`
**Factory**: `src/utils/agent/data/mcp/McpClientFactory/index.ts`

All MCPs are lazy — they connect only when first requested via `mcpRegistry.getMcp(name)`.

## Registered MCPs

| Name                | Transport      | URL                                            | Native lang |
| ------------------- | -------------- | ---------------------------------------------- | ----------- |
| `INTERNAL_RESEARCH` | stdio (local)  | —                                              | Spanish     |
| `OPENALEX_PROD`     | HTTP (Railway) | `https://open-alex-mcp-dev.up.railway.app/mcp` | English     |
| `PT_DATA`           | HTTP (Railway) | `https://pt-data.up.railway.app/mcp`           | Portuguese  |
| `MADEIRA_DATA`      | HTTP (Railway) | `https://madeira-data.up.railway.app/mcp`      | Portuguese  |
| `UE_DATA_DEV`       | HTTP (Railway) | `https://ue-data-dev.up.railway.app/mcp`       | English     |

**Timeout**: 60,000ms for all HTTP MCPs.

## McpToolProvider interface

Every MCP client implements:

```typescript
interface McpToolProvider {
    getOpenAITools(): Tool[]
    executeTool(name: string, params: Record<string, unknown>): Promise<any>
    getMcpName(): string
}
```

Call via factory: `mcpClientFactory.callMcpTool('MCP_NAME', 'tool_name', params)`

## INTERNAL_RESEARCH — tools

Client: `src/utils/agent/data/mcp/internal_research/InternalResearchClient/`

| Method                   | Params                                                                 | Description                      |
| ------------------------ | ---------------------------------------------------------------------- | -------------------------------- |
| `searchKnowledge`        | `query, namespace?, matchCount?, matchThreshold?`                      | Vector similarity search         |
| `combinedSearch`         | `query, includeOpenAlex?, namespace?, matchCount?`                     | Vector + OpenAlex in one call    |
| `combinedAcademicSearch` | `query, openAlexType?: 'works'\|'authors'\|'institutions'\|'concepts'` | Academic-focused combined search |
| `getDocumentContent`     | `id: number`                                                           | Fetch full document by ID        |
| `getSimulationData`      | `simulation_id: string`                                                | Previous simulation data         |

## OPENALEX_PROD — tools

| Tool                  | Key params               | Description           |
| --------------------- | ------------------------ | --------------------- |
| `search_works`        | `query, perPage?, sort?` | Academic papers       |
| `search_authors`      | `query, perPage?`        | Researchers           |
| `search_institutions` | `query, perPage?`        | Academic institutions |
| `search_concepts`     | `query, perPage?`        | Research concepts     |

## PT_DATA / MADEIRA_DATA / UE_DATA_DEV — tools

| Tool             | Description                       |
| ---------------- | --------------------------------- |
| `data_query`     | Query territory-specific datasets |
| `dataset_search` | Search available datasets         |

## Query language rule — MANDATORY

Each MCP must receive queries in its native language. Translate before calling.

```typescript
// ❌ Wrong
callMcpTool('OPENALEX_PROD', 'search_works', { query: 'inflación Nueva York' })

// ✅ Correct
callMcpTool('OPENALEX_PROD', 'search_works', { query: 'inflation New York' })
```
