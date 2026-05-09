# Supabase Edge Function Node Reference

Invoke any Supabase Edge Function with full HTTP control. Call GET endpoints, POST
JSON payloads, update via PUT/PATCH, delete resources, and pass custom headers —
similar to Postman or Bruno, but driven by an AI agent.

## Quick Path

1. Drag a **Supabase Edge Function** node onto the canvas.
2. Set your Supabase project URL (e.g., `https://your-project.supabase.co`).
3. Attach a `supabaseApi` credential.
4. Wire it as a tool to an Agent or Tool Agent node.
5. The LLM receives `supabase_invoke_edge_function` with typed args: `functionName`,
   `method`, `headers`, `requestBody`.

## Node Identity

| Property        | Value                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| Label           | Supabase Edge Function                                                    |
| Name            | `supabaseEdgeFunction`                                                    |
| Version         | `2.0`                                                                     |
| Category        | Tools                                                                     |
| Credential      | `supabaseApi` (uuid `0df85d26-749b-4fac-9a88-7399663a3099`)               |
| Tool name (LLM) | `supabase_invoke_edge_function`                                           |
| Base classes    | `SupabaseEdgeFunction`, `DynamicStructuredTool`, `StructuredTool`, `Tool` |

## Design-Time Inputs

These are set when building the flow. Every input marked `additionalParams: true` is
LLM-overridable at runtime.

| Input             | Type      | Default | LLM override? | Description                                                          |
| ----------------- | --------- | ------- | ------------- | -------------------------------------------------------------------- |
| Supabase Proj URL | `string`  | —       | No            | Supabase project URL (e.g., `https://your-project.supabase.co`).     |
| Function Name     | `string`  | —       | Yes           | Edge Function to call (e.g., `hello-world`).                         |
| Default Method    | `options` | `POST`  | Yes           | HTTP method: GET, POST, PUT, PATCH, DELETE.                          |
| Default Headers   | `string`  | —       | Yes           | JSON object with default headers (e.g., `{"Authorization": "..."}`). |
| Request Body      | `string`  | —       | Yes           | Default JSON body for POST/PUT/PATCH. Ignored for GET/DELETE.        |

If you leave `functionName` empty in the node config, the LLM MUST supply it per call
via the tool arg. This lets a single node call any edge function in the project.

## Tool Arguments (LLM-Facing)

The Zod schema exposed to the LLM agent as structured parameters:

| Argument       | Type                              | Default  | Description                                                                           |
| -------------- | --------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| `functionName` | `string`                          | required | Name of the Supabase Edge Function to invoke.                                         |
| `method`       | `enum(GET,POST,PUT,PATCH,DELETE)` | `POST`   | HTTP method for the request.                                                          |
| `headers`      | `Record<string, string>`          | `{}`     | Optional HTTP headers as key:value pairs (e.g., `{"Authorization": "Bearer token"}`). |
| `requestBody`  | `string` (optional)               | —        | JSON string to send as body. Required for POST/PUT/PATCH. Ignored for GET/DELETE.     |

## HTTP Method Behavior

| Method | Sends body? | Typical use case                                |
| ------ | ----------- | ----------------------------------------------- |
| GET    | No          | Fetch data, check status, read resources.       |
| POST   | Optional    | Create resources, trigger workflows, send data. |
| PUT    | Optional    | Full resource replacement (idempotent).         |
| PATCH  | Optional    | Partial resource update.                        |
| DELETE | No          | Remove resources.                               |

If `requestBody` is passed on GET or DELETE, it is silently ignored. The schema
validates JSON syntax only for POST/PUT/PATCH.

## Headers

Custom headers are passed directly to the Supabase Functions client. Common patterns:

-   **Authorization**: `{"Authorization": "Bearer eyJhbG..."}`
-   **Content-Type override**: `{"Content-Type": "application/xml"}`
-   **Custom metadata**: `{"X-Trace-Id": "abc123", "X-User-Role": "admin"}`

Empty `headers` (`{}`) are passed as-is but the Supabase client strips undefined
header objects. Explicitly empty `headers` (`{}`) do NOT add any header overhead.

## Response Handling

The tool always returns a JSON string to the LLM:

| Supabase response               | Tool output                                         |
| ------------------------------- | --------------------------------------------------- |
| `{ data: { key: "val" } }`      | `'{"key":"val"}'` (JSON-stringified object)         |
| `{ data: "plain text" }`        | `'plain text'` (string data returned as-is)         |
| `{ data: 0 }` or `false`        | `'{"result":0}'` / `'{"result":false}'`             |
| `{ data: null }` or `undefined` | Throws: "Supabase Edge Function X returned no data" |
| `{ error: { message } }`        | Throws: "Supabase Edge Function error: message"     |

The LLM agent reads these strings and decides how to handle errors (retry, report to
user, etc.). Errors are thrown, not returned as JSON, so the agent framework can
catch and respond to them.

## Architecture

```
SupabaseEdgeFunction.ts (node class)
  └─ init(nodeData) → fetches supabaseApi credential, extracts supabaseProjUrl
       └─ returns InvokeEdgeFunctionTool instance (core.ts)
            └─ constructor: wires supabase client into the tool
            └─ _call(arg): validates with Zod, calls supabase.functions.invoke(),
                           returns JSON response
```

Shared utility from `SupabaseCommon.ts`:

-   `createSupabaseClient(url, apiKey)` — creates a Supabase client, validates URL

The tool extends `DynamicStructuredTool<ZodSchema>` which makes the Zod schema
visible to the LLM agent as structured tool parameters.

## Common Patterns

### Pattern 1: GET with authorization

```
LLM tool call:
  supabase_invoke_edge_function({
    functionName: "get-user-profile",
    method: "GET",
    headers: { "Authorization": "Bearer eyJhb..." }
  })

No body needed for GET. The tool sends a GET request with the Authorization header.
```

### Pattern 2: POST with JSON body

```
LLM tool call:
  supabase_invoke_edge_function({
    functionName: "create-order",
    method: "POST",
    headers: { "X-Idempotency-Key": "req-001" },
    requestBody: '{"productId": "abc", "quantity": 2}'
  })
```

### Pattern 3: DELETE a resource

```
LLM tool call:
  supabase_invoke_edge_function({
    functionName: "delete-user",
    method: "DELETE",
    headers: { "Authorization": "Bearer eyJhb..." }
  })

Body is ignored for DELETE. Only functionName, method, and headers are sent.
```

### Pattern 4: Multiple edge functions from one node

Leave `functionName` empty in the node config. The LLM supplies it at runtime:

```
Call 1: supabase_invoke_edge_function({ functionName: "search-products", method: "GET" })
Call 2: supabase_invoke_edge_function({ functionName: "create-order", method: "POST", requestBody: '{"id": 1}' })
```

One node, many functions, no duplicate wiring.

## Security

| Concern              | Enforcement                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| Credential isolation | `supabaseApiKey` is extracted from the credential via `getCredentialParam`, never visible to LLM. |
| URL validation       | `createSupabaseClient` validates the URL via `new URL()` before creating the client.              |
| Function binding     | `functionName` can be locked at design-time OR left open for LLM control — your choice.           |
| Function isolation   | Each call uses `supabase.functions.invoke()` which respects Supabase RLS + Edge Function auth.    |
| Method safety        | GET and DELETE requests silently strip body payloads.                                             |

## Error Messages

| Error thrown                                     | Cause                                                        |
| ------------------------------------------------ | ------------------------------------------------------------ |
| `Missing Supabase API credential`                | Credential not provided or `supabaseApiKey` is empty.        |
| `Invalid Supabase project URL`                   | `supabaseProjUrl` doesn't parse as a valid URL.              |
| `requestBody is not valid JSON: <message>`       | Body string fails `JSON.parse()`.                            |
| `requestBody must be a JSON object, got <type>`  | Body parsed to array, null, or primitive (not an object).    |
| `Supabase Edge Function error: <message>`        | Supabase returned an error object.                           |
| `Supabase Edge Function <name> returned no data` | Supabase returned successfully but `data` is null/undefined. |

All errors are thrown, not swallowed. The agent framework catches them and surfaces
them to the LLM for handling.

## Testing

Tests in `__tests__/core.test.ts` cover:

-   Basic invocation (POST with body)
-   All five HTTP methods (GET, POST, PUT, PATCH, DELETE)
-   Method selection and default (POST)
-   Custom headers (passed correctly to Supabase client)
-   Empty headers (not passed to client)
-   requestBody JSON validation (invalid JSON throws)
-   requestBody type validation (array/null/primitive throws)
-   GET ignoring body
-   POST without body (optional)
-   Supabase error propagation
-   Null/undefined data handling
-   Primitive response wrapping (zero, false, empty string)
-   Credential validation (empty, invalid URL)

Run with:

```bash
pnpm test -- --testPathPattern="SupabaseEdgeFunction"
```
