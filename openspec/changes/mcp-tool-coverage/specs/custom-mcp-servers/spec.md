# Custom MCP Servers Specification

## Purpose

Manage custom MCP server configurations in Flowise via the API. Enables agents to list, inspect, create, update, delete, discover tools, and authorize custom MCP servers without manual UI interaction.

## Requirements

### CMS-001: List Custom MCP Servers

The system MUST return all custom MCP servers configured in the current workspace via `list_custom_mcp_servers`.

**API**: `GET /api/v1/custom-mcp-servers`

**Contract**:

-   Params: none
-   Response: `{ servers: [{ id, name, transport, url, command, enabled, tools: [...] }] }`

#### Scenario: List with servers present

-   GIVEN 3 custom MCP servers configured in the workspace
-   WHEN `list_custom_mcp_servers` is called
-   THEN response contains 3 server objects with id, name, transport, enabled fields

#### Scenario: List empty workspace

-   WHEN called in a workspace with no custom MCP servers
-   THEN response contains empty array

### CMS-002: Get Custom MCP Server

The system MUST return a single custom MCP server by ID via `get_custom_mcp_server`.

**API**: `GET /api/v1/custom-mcp-servers/{id}`

#### Scenario: Get existing server

-   GIVEN server with id `abc-123` exists
-   WHEN `get_custom_mcp_server({ id: "abc-123" })` is called
-   THEN response contains full server config including transport, url/command, env vars, tools

#### Scenario: Get non-existent server

-   WHEN called with non-existent ID
-   THEN error response with message "Server not found" and HTTP 404

### CMS-003: Create Custom MCP Server

The system MUST create a custom MCP server via `create_custom_mcp_server`.

**API**: `POST /api/v1/custom-mcp-servers`

**Contract**:

-   Params: `name` (string), `transport` (string: "stdio"|"sse"), `url` (string, optional), `command` (string, optional), `env` (object, optional)
-   Response: created server object with ID

#### Scenario: Create stdio server

-   WHEN `create_custom_mcp_server({ name: "my-server", transport: "stdio", command: "node server.js" })` is called
-   THEN server is created and response includes new ID and full config

#### Scenario: Create SSE server

-   WHEN called with `transport: "sse"` and `url: "https://..."`
-   THEN server is created with SSE transport

#### Scenario: Duplicate name

-   WHEN called with name already existing in workspace
-   THEN error response with "Name already exists"

### CMS-004: Update Custom MCP Server

The system MUST update a custom MCP server via `update_custom_mcp_server`.

**API**: `PUT /api/v1/custom-mcp-servers/{id}`

**Contract**: All fields optional; omit to keep current value.

#### Scenario: Update command path

-   WHEN `update_custom_mcp_server({ id, command: "new-command" })` is called
-   THEN only command field is changed; other fields preserved

### CMS-005: Delete Custom MCP Server

The system MUST delete a custom MCP server via `delete_custom_mcp_server`.

**API**: `DELETE /api/v1/custom-mcp-servers/{id}`

#### Scenario: Delete existing server

-   WHEN `delete_custom_mcp_server({ id })` is called
-   THEN server is removed and response confirms deletion

#### Scenario: Delete in-use server

-   WHEN server is referenced by active flows
-   THEN error response warning of dependencies (HTTP 409)

### CMS-006: Get Server Tools

The system MUST return discovered tools from a custom MCP server via `get_custom_mcp_server_tools`.

**API**: `GET /api/v1/custom-mcp-servers/{id}/tools`

#### Scenario: Tools discovered

-   GIVEN enabled server that was authorized successfully
-   WHEN `get_custom_mcp_server_tools({ id })` is called
-   THEN response lists all tools with name, description, and input schema

### CMS-007: Authorize Server

The system MUST connect and discover tools on a custom MCP server via `authorize_custom_mcp_server`.

**API**: `POST /api/v1/custom-mcp-servers/{id}/authorize`

**Note**: This is a long-running operation (5-15s) — documented in tool description.

#### Scenario: Successful authorization

-   GIVEN server config with valid transport/command
-   WHEN `authorize_custom_mcp_server({ id })` is called
-   THEN server connects, discovers tools, and marks as authorized

#### Scenario: Authorization failure

-   WHEN server connection fails (wrong URL, port closed)
-   THEN error response with connection error details (not crash)

### Error Handling (all tools)

-   All API errors (4xx, 5xx) MUST be caught and returned as `errorResponse(message)` — never crash the MCP server
-   401/403 errors MUST include clear message about API key permissions
-   Network timeouts MUST return descriptive error after 30s
