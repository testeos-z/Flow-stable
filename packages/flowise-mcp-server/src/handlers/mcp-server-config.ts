/**
 * MCP Server Config handlers — manage the built-in MCP server token lifecycle
 *
 * MSC-001: GET  /mcp-server          → get config
 * MSC-002: POST /mcp-server/enable   → enable server
 * MSC-003: POST /mcp-server          → update config
 * MSC-004: POST /mcp-server/disable  → disable server
 * MSC-005: POST /mcp-server/token    → refresh token
 */

import type { FlowiseApiClient } from '../flowise-api.js'
import { successResponse, errorResponse } from './handler-helpers.js'
import type { ToolResponse } from './handler-helpers.js'

/** MSC-001: Get current MCP server configuration */
export async function handleGetMcpServerConfig(api: FlowiseApiClient): Promise<ToolResponse> {
    try {
        const data = await api.request('GET', '/mcp-server')
        return successResponse(data)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error getting MCP server config: ${message}`)
    }
}

/** MSC-002: Enable the built-in MCP server */
export async function handleEnableMcpServer(api: FlowiseApiClient): Promise<ToolResponse> {
    try {
        const data = await api.request('POST', '/mcp-server/enable')
        return successResponse(data)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error enabling MCP server: ${message}`)
    }
}

/** MSC-003: Update MCP server configuration (transport, port, baseUrl all optional) */
export async function handleUpdateMcpServerConfig(
    api: FlowiseApiClient,
    params: { transport?: string; port?: number; baseUrl?: string }
): Promise<ToolResponse> {
    try {
        const data = await api.request('POST', '/mcp-server', params)
        return successResponse(data)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error updating MCP server config: ${message}`)
    }
}

/** MSC-004: Disable the MCP server */
export async function handleDisableMcpServer(api: FlowiseApiClient): Promise<ToolResponse> {
    try {
        const data = await api.request('POST', '/mcp-server/disable')
        return successResponse(data)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error disabling MCP server: ${message}`)
    }
}

/** MSC-005: Generate/rotate MCP server token */
export async function handleRefreshMcpToken(api: FlowiseApiClient): Promise<ToolResponse> {
    try {
        const data = await api.request('POST', '/mcp-server/token')
        return successResponse(data)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error refreshing MCP token: ${message}`)
    }
}
