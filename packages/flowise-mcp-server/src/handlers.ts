/**
 * Tool handlers for Flowise MCP operations
 */

import type { FlowiseApiClient } from './flowise-api.js'

// Response type for MCP tools - uses index signature for compatibility with MCP SDK
export interface ToolResponse {
    [key: string]: unknown
    content: Array<{ type: 'text'; text: string }>
    isError?: boolean
}

// Flowise SDK client interface (subset we use)
export interface FlowiseSdkClient {
    createPrediction: (params: {
        chatflowId: string
        question: string
        chatId?: string
        overrideConfig?: Record<string, unknown>
        streaming?: boolean
        history?: Array<{ message: string; type: 'apiMessage' | 'userMessage' }>
        uploads?: Array<{ data?: string; type: string; name: string; mime: string }>
        leadEmail?: string
    }) => Promise<unknown>
}

/**
 * Helper to create a successful tool response
 */
export function successResponse(data: unknown): ToolResponse {
    return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
    }
}

/**
 * Helper to create an error tool response
 */
export function errorResponse(message: string): ToolResponse {
    return {
        content: [{ type: 'text', text: message }],
        isError: true
    }
}

/**
 * Create prediction handler
 */
export async function handleCreatePrediction(
    client: FlowiseSdkClient,
    params: {
        chatflowId: string
        question: string
        chatId?: string
        overrideConfig?: Record<string, unknown>
    }
): Promise<ToolResponse> {
    try {
        const response = await client.createPrediction({
            ...params,
            streaming: false
        })
        return successResponse(response)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error running chatflow: ${message}`)
    }
}

/**
 * Create prediction with history handler
 */
export async function handleCreatePredictionWithHistory(
    client: FlowiseSdkClient,
    params: {
        chatflowId: string
        question: string
        history: Array<{ message: string; type: 'apiMessage' | 'userMessage' }>
        chatId?: string
        overrideConfig?: Record<string, unknown>
    }
): Promise<ToolResponse> {
    try {
        const response = await client.createPrediction({
            ...params,
            streaming: false
        })
        return successResponse(response)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error running chatflow: ${message}`)
    }
}

/**
 * Create prediction with files handler
 */
export async function handleCreatePredictionWithFiles(
    client: FlowiseSdkClient,
    params: {
        chatflowId: string
        question: string
        uploads: Array<{ data?: string; type: string; name: string; mime: string }>
        chatId?: string
        overrideConfig?: Record<string, unknown>
    }
): Promise<ToolResponse> {
    try {
        const response = await client.createPrediction({
            ...params,
            streaming: false
        })
        return successResponse(response)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error running chatflow: ${message}`)
    }
}

/**
 * Create prediction with lead handler
 */
export async function handleCreatePredictionWithLead(
    client: FlowiseSdkClient,
    params: {
        chatflowId: string
        question: string
        leadEmail: string
        chatId?: string
        overrideConfig?: Record<string, unknown>
    }
): Promise<ToolResponse> {
    try {
        const response = await client.createPrediction({
            ...params,
            streaming: false
        })
        return successResponse(response)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error running chatflow: ${message}`)
    }
}

/**
 * List chatflows handler
 */
export async function handleListChatflows(api: FlowiseApiClient): Promise<ToolResponse> {
    try {
        const chatflows = await api.request('GET', '/chatflows')
        return successResponse(chatflows)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error listing chatflows: ${message}`)
    }
}

/**
 * Get chatflow handler
 */
export async function handleGetChatflow(api: FlowiseApiClient, chatflowId: string): Promise<ToolResponse> {
    try {
        const chatflow = await api.request('GET', `/chatflows/${chatflowId}`)
        return successResponse(chatflow)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error getting chatflow: ${message}`)
    }
}

/**
 * Create chatflow handler
 */
export async function handleCreateChatflow(
    api: FlowiseApiClient,
    params: {
        name: string
        flowData: { nodes: unknown[]; edges: unknown[] }
        type?: 'CHATFLOW' | 'AGENTFLOW' | 'MULTIAGENT' | 'ASSISTANT'
        chatbotConfig?: Record<string, unknown>
    }
): Promise<ToolResponse> {
    try {
        const chatflow = await api.request('POST', '/chatflows', {
            name: params.name,
            flowData: JSON.stringify(params.flowData),
            type: params.type || 'CHATFLOW',
            chatbotConfig: params.chatbotConfig ? JSON.stringify(params.chatbotConfig) : undefined
        })
        return successResponse(chatflow)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error creating chatflow: ${message}`)
    }
}

/**
 * Update chatflow handler
 */
export async function handleUpdateChatflow(
    api: FlowiseApiClient,
    params: {
        chatflowId: string
        name?: string
        flowData?: { nodes: unknown[]; edges: unknown[] }
        chatbotConfig?: Record<string, unknown>
    }
): Promise<ToolResponse> {
    try {
        const updateData: Record<string, unknown> = {}
        if (params.name) updateData.name = params.name
        if (params.flowData) updateData.flowData = JSON.stringify(params.flowData)
        if (params.chatbotConfig) updateData.chatbotConfig = JSON.stringify(params.chatbotConfig)

        const chatflow = await api.request('PUT', `/chatflows/${params.chatflowId}`, updateData)
        return successResponse(chatflow)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error updating chatflow: ${message}`)
    }
}

/**
 * Delete chatflow handler
 */
export async function handleDeleteChatflow(api: FlowiseApiClient, chatflowId: string): Promise<ToolResponse> {
    try {
        const result = await api.request('DELETE', `/chatflows/${chatflowId}`)
        return successResponse({ success: true, deleted: chatflowId, result })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error deleting chatflow: ${message}`)
    }
}

/**
 * List nodes handler
 */
export async function handleListNodes(api: FlowiseApiClient): Promise<ToolResponse> {
    try {
        const nodes = await api.request('GET', '/nodes')
        return successResponse(nodes)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error listing nodes: ${message}`)
    }
}

/**
 * Get nodes by category handler
 */
export async function handleGetNodesByCategory(api: FlowiseApiClient, category: string): Promise<ToolResponse> {
    try {
        const nodes = await api.request('GET', `/nodes/category/${encodeURIComponent(category)}`)
        return successResponse(nodes)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error getting nodes by category: ${message}`)
    }
}

/**
 * Get node handler
 */
export async function handleGetNode(api: FlowiseApiClient, nodeName: string): Promise<ToolResponse> {
    try {
        const node = await api.request('GET', `/nodes/${encodeURIComponent(nodeName)}`)
        return successResponse(node)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error getting node: ${message}`)
    }
}
