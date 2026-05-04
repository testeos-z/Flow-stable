/**
 * Custom MCP Servers handlers — CRUD + authorize for custom MCP server configs
 *
 * CMS-001: GET    /custom-mcp-servers            → list all servers
 * CMS-002: GET    /custom-mcp-servers/:id        → get one server
 * CMS-003: POST   /custom-mcp-servers             → create server
 * CMS-004: PUT    /custom-mcp-servers/:id        → update server
 * CMS-005: DELETE /custom-mcp-servers/:id        → delete server
 * CMS-006: GET    /custom-mcp-servers/:id/tools  → get discovered tools
 * CMS-007: POST   /custom-mcp-servers/:id/authorize → authorize server (connect + discover tools)
 */

import type { FlowiseApiClient } from '../flowise-api.js'
import { passthroughHandler } from './handler-helpers.js'
import type { ToolResponse } from './handler-helpers.js'

/** CMS-001: List all custom MCP servers in the workspace */
export async function handleCustomMcpList(api: FlowiseApiClient): Promise<ToolResponse> {
    return passthroughHandler(api, 'GET', '/custom-mcp-servers', undefined, 'Error listing custom MCP servers')
}

/** CMS-002: Get a single custom MCP server by ID */
export async function handleCustomMcpGet(api: FlowiseApiClient, id: string): Promise<ToolResponse> {
    return passthroughHandler(api, 'GET', `/custom-mcp-servers/${id}`, undefined, 'Error getting custom MCP server')
}

/**
 * CMS-003: Create a new custom MCP server
 *
 * @param params.name Required — display name for the server
 * @param params.command Optional — command to run (for stdio transport)
 * @param params.args Optional — array of command arguments
 * @param params.env Optional — environment variables for the server process
 * @param params.description Optional — human-readable description
 */
export async function handleCustomMcpCreate(
    api: FlowiseApiClient,
    params: {
        name: string
        command?: string
        args?: string[]
        env?: Record<string, string>
        description?: string
    }
): Promise<ToolResponse> {
    return passthroughHandler(api, 'POST', '/custom-mcp-servers', params, 'Error creating custom MCP server')
}

/** CMS-004: Update an existing custom MCP server. All fields optional — only provided fields are changed. */
export async function handleCustomMcpUpdate(
    api: FlowiseApiClient,
    id: string,
    params: {
        name?: string
        command?: string
        args?: string[]
        env?: Record<string, string>
        description?: string
    }
): Promise<ToolResponse> {
    return passthroughHandler(api, 'PUT', `/custom-mcp-servers/${id}`, params, 'Error updating custom MCP server')
}

/** CMS-005: Delete a custom MCP server */
export async function handleCustomMcpDelete(api: FlowiseApiClient, id: string): Promise<ToolResponse> {
    return passthroughHandler(api, 'DELETE', `/custom-mcp-servers/${id}`, undefined, 'Error deleting custom MCP server')
}

/** CMS-006: Get discovered tools from an authorized custom MCP server */
export async function handleCustomMcpGetTools(api: FlowiseApiClient, id: string): Promise<ToolResponse> {
    return passthroughHandler(api, 'GET', `/custom-mcp-servers/${id}/tools`, undefined, 'Error getting custom MCP server tools')
}

/**
 * CMS-007: Authorize a custom MCP server — connects to the external server and discovers tools.
 *
 * **Note**: This is a long-running operation (5–15s) because it makes a live connection
 * to the external MCP server. Agents should allow sufficient timeout.
 */
export async function handleCustomMcpAuthorize(api: FlowiseApiClient, id: string): Promise<ToolResponse> {
    return passthroughHandler(api, 'POST', `/custom-mcp-servers/${id}/authorize`, undefined, 'Error authorizing custom MCP server')
}
