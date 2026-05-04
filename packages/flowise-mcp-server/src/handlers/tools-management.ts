/**
 * Tools Management handlers — CRUD for Flowise tools (Child Process, Custom Tool, etc.)
 *
 * TLM-001: GET    /tools           → list tools
 * TLM-002: GET    /tools/:id       → get tool
 * TLM-003: POST   /tools           → create tool
 * TLM-004: PUT    /tools/:id       → update tool
 * TLM-005: DELETE /tools/:id       → delete tool
 *
 * All tool names prefixed with `flow_` to avoid collision with MCP built-in `list_tools`.
 */

import type { FlowiseApiClient } from '../flowise-api.js'
import { successResponse, errorResponse } from './handler-helpers.js'
import type { ToolResponse } from './handler-helpers.js'

/** TLM-001: List all tools in the workspace */
export async function handleFlowListTools(api: FlowiseApiClient, params?: { page?: number; limit?: number }): Promise<ToolResponse> {
    try {
        const queryParts: string[] = []
        if (params?.page !== undefined) queryParts.push(`page=${params.page}`)
        if (params?.limit !== undefined) queryParts.push(`limit=${params.limit}`)
        const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''
        const data = await api.request('GET', `/tools${queryString}`)
        return successResponse(data)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error listing tools: ${message}`)
    }
}

/** TLM-002: Get a single tool by ID */
export async function handleFlowGetTool(api: FlowiseApiClient, id: string): Promise<ToolResponse> {
    try {
        const data = await api.request('GET', `/tools/${id}`)
        return successResponse(data)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error getting tool: ${message}`)
    }
}

/** TLM-003: Create a new tool */
export async function handleFlowCreateTool(
    api: FlowiseApiClient,
    params: {
        name: string
        type: string
        iconSrc?: string
        funcBody?: string
        description?: string
    }
): Promise<ToolResponse> {
    try {
        const data = await api.request('POST', '/tools', params)
        return successResponse(data)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error creating tool: ${message}`)
    }
}

/** TLM-004: Update an existing tool */
export async function handleFlowUpdateTool(
    api: FlowiseApiClient,
    id: string,
    params: {
        name?: string
        type?: string
        iconSrc?: string
        funcBody?: string
        description?: string
    }
): Promise<ToolResponse> {
    try {
        const data = await api.request('PUT', `/tools/${id}`, params)
        return successResponse(data)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error updating tool: ${message}`)
    }
}

/** TLM-005: Delete a tool */
export async function handleFlowDeleteTool(api: FlowiseApiClient, id: string): Promise<ToolResponse> {
    try {
        const result = await api.request('DELETE', `/tools/${id}`)
        return successResponse({ success: true, deleted: id, result })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error deleting tool: ${message}`)
    }
}
