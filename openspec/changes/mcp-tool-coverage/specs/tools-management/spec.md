# Tools Management Specification

## Purpose

CRUD management of Flowise tools (Child Process, Custom Tool, etc.) via the API. Enables agents to programmatically create, read, update, and delete tool definitions.

## Requirements

### TLM-001: List Tools

The system MUST return all tools in the workspace via `flow_list_tools`.

**API**: `GET /api/v1/tools`

**Contract**:

-   Params: `page` (number, optional, default 1), `limit` (number, optional, default 50)
-   Response: `{ tools: [{ id, name, description, type, ... }], pagination: { total, page, limit } }`

#### Scenario: List with pagination

-   WHEN `flow_list_tools({ page: 1, limit: 20 })` is called
-   THEN response paginates results and includes total count

#### Scenario: List empty

-   WHEN workspace has no tools
-   THEN response contains empty array, total=0

### TLM-002: Get Tool

The system MUST return a single tool by ID via `flow_get_tool`.

**API**: `GET /api/v1/tools/{id}`

#### Scenario: Get tool with config

-   GIVEN tool `tool-456` exists with custom JavaScript
-   WHEN `flow_get_tool({ id: "tool-456" })` is called
-   THEN response includes full tool definition (name, type, icon, funcBody, etc.)

### TLM-003: Create Tool

The system MUST create a tool via `flow_create_tool`.

**API**: `POST /api/v1/tools`

**Contract**: `name` (string, required), `type` (string, required), `iconSrc` (string, optional), `funcBody` (string, optional), `description` (string, optional)

#### Scenario: Create custom tool

-   WHEN `flow_create_tool({ name: "my-tool", type: "CustomTool", funcBody: "..." })` is called
-   THEN tool is created with new ID; agent receives confirmation

### TLM-004: Update Tool

The system MUST update a tool via `flow_update_tool`.

**API**: `PUT /api/v1/tools/{id}`

#### Scenario: Update tool body

-   WHEN `flow_update_tool({ id, funcBody: "new code" })` is called
-   THEN only funcBody changes; other fields preserved

### TLM-005: Delete Tool

The system MUST delete a tool via `flow_delete_tool`.

**API**: `DELETE /api/v1/tools/{id}`

#### Scenario: Delete unused tool

-   WHEN `flow_delete_tool({ id })` is called
-   THEN tool is removed

#### Scenario: Delete tool referenced by flows

-   WHEN tool is referenced by active flows
-   THEN error response with dependency warning (HTTP 409)

### Naming

All tool management tools are prefixed `flow_` to avoid collision with generic MCP tool names: `flow_list_tools`, `flow_get_tool`, `flow_create_tool`, `flow_update_tool`, `flow_delete_tool`.

### Error Handling

-   All API errors (4xx, 5xx) MUST be caught and returned as error responses
-   Missing tool ID MUST return "Tool not found" via errorResponse
