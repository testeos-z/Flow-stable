# MCP Server Config Specification

## Purpose

Manage native MCP server token lifecycle in Flowise: inspect config, enable/disable, update configuration, and refresh/rotate tokens. Maps to Flowise's built-in MCP server endpoints.

## Requirements

### MSC-001: Get Server Config

The system MUST return the current MCP server configuration via `get_mcp_server_config`.

**API**: `GET /api/v1/mcp-server`

#### Scenario: Get config

-   WHEN `get_mcp_server_config()` is called
-   THEN response includes `{ enabled, token, transport, port, baseUrl }`

### MSC-002: Enable Server

The system MUST enable the built-in MCP server via `enable_mcp_server`.

**API**: `POST /api/v1/mcp-server/enable`

#### Scenario: Enable disabled server

-   GIVEN MCP server is disabled
-   WHEN `enable_mcp_server()` is called
-   THEN server is enabled and response confirms state change

#### Scenario: Enable already enabled

-   WHEN server is already enabled
-   THEN response indicates no state change needed (idempotent)

### MSC-003: Update Config

The system MUST update MCP server configuration via `update_mcp_server_config`.

**API**: `POST /api/v1/mcp-server`

**Contract**: `transport`, `port`, `baseUrl` all optional.

#### Scenario: Change port

-   WHEN `update_mcp_server_config({ port: 3001 })` is called
-   THEN only port is changed; server may restart

### MSC-004: Disable Server

The system MUST disable the MCP server via `disable_mcp_server`.

**API**: `POST /api/v1/mcp-server/disable`

#### Scenario: Disable active server

-   GIVEN MCP server is enabled
-   WHEN `disable_mcp_server()` is called
-   THEN server is disabled and flows using it will lose MCP access

### MSC-005: Refresh Token

The system MUST generate/rotate the MCP server token via `refresh_mcp_token`.

**API**: `POST /api/v1/mcp-server/token`

#### Scenario: Regenerate token

-   WHEN `refresh_mcp_token()` is called
-   THEN new token is generated, old token invalidated, response includes new token

### Error Handling (all tools)

-   All API errors (4xx, 5xx) MUST be caught and returned as error responses
-   401 errors MUST indicate insufficient API key permissions
-   Token refresh errors MUST report clearly if token generation endpoint fails
