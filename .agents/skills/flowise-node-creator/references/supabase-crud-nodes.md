# Supabase CRUD Nodes Reference

Reference for the five Supabase CRUD tool nodes available in Flowise. These
nodes use the `supabaseApi` credential to perform typed database operations
via structured tool calls. Each node's `tableName` is a design-time input —
the LLM cannot change it at runtime.

## Node Inventory

| Node name        | Label           | Operation                        |
| ---------------- | --------------- | -------------------------------- |
| `supabaseSelect` | Supabase Select | Query rows with filters & order  |
| `supabaseInsert` | Supabase Insert | Insert new rows                  |
| `supabaseUpdate` | Supabase Update | Update rows matching filters     |
| `supabaseDelete` | Supabase Delete | Delete rows matching filters     |
| `supabaseUpsert` | Supabase Upsert | Insert or update via conflict ID |

All five nodes share these properties:

-   **Category**: `Tools`
-   **Version**: `1.0`
-   **Credential**: `supabaseApi` (uuid `0df85d26-749b-4fac-9a88-7399663a3099`)
-   **Common inputs** (design-time, hardcoded at flow creation):
    -   `supabaseProjUrl` — Supabase project URL (e.g., `https://your-project.supabase.co`)
    -   `tableName` — Name of the Supabase table to operate on. Immutable at runtime.

## Filter Reference

Nodes that accept filters (Select, Update, Delete) use a shared `FilterSchema`:

```typescript
{
    column: string // Column name to filter on
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'is' | 'like' | 'ilike'
    value: any // Comparison value
}
```

Filters are applied in array order. The Zod schema validates operators at call-time, rejecting unknown operators before the query executes.

## `returning` Parameter

Insert, Update, and Delete nodes accept a `returning` parameter controlling how much data comes back:

| Value              | Behavior                        |
| ------------------ | ------------------------------- |
| `"representation"` | Returns the affected row(s)     |
| `"minimal"`        | Returns no data (empty or null) |

Default is `"representation"` on all three nodes.

## Per-Node Detail

### 1. Supabase Select (`supabaseSelect`)

Queries rows with optional column selection, filters, ordering, and limit.

**Tool name exposed to LLM**: `supabase_select`

**Tool arguments (LLM-facing)**:

| Argument         | Type                  | Default | Description                                            |
| ---------------- | --------------------- | ------- | ------------------------------------------------------ |
| `columns`        | `string[]`            | `["*"]` | Columns to return. Use `["*"]` for all columns.        |
| `filters`        | `Filter[]`            | `[]`    | Array of `{column, operator, value}` objects.          |
| `orderBy`        | `string \| null`      | `null`  | Column to sort results by. Omit for no ordering.       |
| `orderDirection` | `"asc" \| "desc"`     | `"asc"` | Sort direction.                                        |
| `limit`          | `number` (int, min 1) | `100`   | Maximum rows to return. **Capped at 1000** at runtime. |

**Core file**: `packages/components/nodes/tools/SupabaseSelect/core.ts:6-11`

### 2. Supabase Insert (`supabaseInsert`)

Inserts one or more rows into the pre-configured table.

**Tool name exposed to LLM**: `supabase_insert`

**Tool arguments (LLM-facing)**:

| Argument    | Type                            | Default            | Description                            |
| ----------- | ------------------------------- | ------------------ | -------------------------------------- |
| `data`      | `Record<string, unknown>`       | _(required)_       | Column:value pairs for the new row(s). |
| `returning` | `"representation" \| "minimal"` | `"representation"` | Return the inserted row, or no data.   |

**Core file**: `packages/components/nodes/tools/SupabaseInsert/core.ts:5-11`

### 3. Supabase Update (`supabaseUpdate`)

Updates rows that match the provided filters. **Requires a non-empty filters array** for safety — prevents accidental mass updates.

**Tool name exposed to LLM**: `supabase_update`

**Tool arguments (LLM-facing)**:

| Argument    | Type                            | Default             | Description                                      |
| ----------- | ------------------------------- | ------------------- | ------------------------------------------------ |
| `filters`   | `Filter[]`                      | _(required, min 1)_ | Filter objects identifying which rows to update. |
| `data`      | `Record<string, unknown>`       | _(required)_        | Column:value pairs to set on matching rows.      |
| `returning` | `"representation" \| "minimal"` | `"representation"`  | Return the updated rows, or no data.             |

**Core file**: `packages/components/nodes/tools/SupabaseUpdate/core.ts:6-16`

**Security**: Zod enforces `.min(1)` on `filters`. A runtime guard also blocks empty arrays as belt-and-suspenders.

### 4. Supabase Delete (`supabaseDelete`)

Deletes rows that match the provided filters. **Requires a non-empty filters array** for safety — prevents accidental table truncation.

**Tool name exposed to LLM**: `supabase_delete`

**Tool arguments (LLM-facing)**:

| Argument    | Type                            | Default             | Description                                      |
| ----------- | ------------------------------- | ------------------- | ------------------------------------------------ |
| `filters`   | `Filter[]`                      | _(required, min 1)_ | Filter objects identifying which rows to delete. |
| `returning` | `"representation" \| "minimal"` | `"representation"`  | Return the deleted rows, or no data.             |

**Core file**: `packages/components/nodes/tools/SupabaseDelete/core.ts:6-17`

**Security**: Same dual enforcement as Update — Zod `.min(1)` plus a runtime check.

### 5. Supabase Upsert (`supabaseUpsert`)

Inserts a row if the `onConflict` column doesn't exist, updates if it does.
No need to check existence first.

**Tool name exposed to LLM**: `supabase_upsert`

**Tool arguments (LLM-facing)**:

| Argument           | Type                      | Default      | Description                                                     |
| ------------------ | ------------------------- | ------------ | --------------------------------------------------------------- |
| `data`             | `Record<string, unknown>` | _(required)_ | Column:value pairs for the row(s) to insert or update.          |
| `onConflict`       | `string`                  | `"id"`       | Column(s) that trigger an update on conflict (e.g., `"email"`). |
| `ignoreDuplicates` | `boolean`                 | `false`      | If `true`, skip conflicting rows instead of updating them.      |

**Core file**: `packages/components/nodes/tools/SupabaseUpsert/core.ts:5-9`

## Architecture

All five nodes follow the same architecture pattern:

```
Node class (.ts)
  └─ init(nodeData) → fetches credential, extracts url + tableName from inputs
       └─ returns Tool class instance (core.ts)
            └─ constructor: wires supabase client, tableName into tool description
            └─ _call(arg): validates with Zod, executes query, returns JSON
```

They share utilities from `SupabaseCommon.ts`:

-   `createSupabaseClient(url, apiKey)` — creates a Supabase client, validates URL
-   `handleDbError({ data, error })` — returns `JSON.stringify(data)` or `{ error: message }`
-   `applyFilters(query, filters)` — chains filter operators onto a query builder
-   `FilterSchema` — Zod schema shared by Select, Update, Delete

Each tool extends `DynamicStructuredTool<ZodSchema>` which makes the Zod schema
visible to the LLM agent as structured tool parameters.

## Error Handling

Tools never throw exceptions back to the agent. All responses are JSON strings:

-   **Success**: `JSON.stringify(data)` — the returned rows/array
-   **Error**: `JSON.stringify({ error: "message" })` — the error message

The LLM agent reads these strings and decides how to handle errors (retry, report to user, etc.).

## Security

| Concern           | Enforcement                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Table lock-in     | `tableName` is a design-time string input, never exposed as an LLM tool arg. Hardcoded into the tool description at init. |
| Mass update guard | `filters` on Update/Delete requires `.min(1)` via Zod, plus a runtime `if (filters.length === 0)` check.                  |
| Mass delete guard | Same as Update — dual enforcement.                                                                                        |
| Select row cap    | `limit` is clamped to `Math.min(arg.limit, 1000)` at runtime.                                                             |
| Credential auth   | `supabaseApiKey` is extracted from the credential via `getCredentialParam`, never transmitted to the LLM.                 |
| URL validation    | `createSupabaseClient` validates the URL via `new URL()` before creating the client.                                      |

## Example: Select + Insert Flow

A common pattern: use Select to check if a record exists, then Insert if not.

```
[Chat Model / Agent]
    │
    ├── tool: supabase_select
    │     tableName: "users"
    │
    ├── tool: supabase_insert
    │     tableName: "users"
    │
    ▼
LLM tool calls:
  1. supabase_select({ columns: ["id"], filters: [{column:"email", operator:"eq", value:"john@example.com"}] })
  2. If empty → supabase_insert({ data: { email: "john@example.com", name: "John" } })
```

In an AgentFlow, wire both nodes as tool outputs from an Agent node.
In a CHATFLOW, connect them via edges to a Tool Agent.
