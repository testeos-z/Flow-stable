/**
 * Tool handlers for Flowise MCP operations
 */

import type { FlowiseApiClient } from './flowise-api.js'
import { fixFlowData } from './flow-validation.js'
import { diagnoseChatflow, repairChatflow } from './chatflow-db.js'
import { testChatflow, flowHasTools } from './testing.js'
import { listCredentials, validateCredential, resolveCredential } from './credentials.js'

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
 * Validates and fixes flowData before sending to Flowise backend.
 * Throws with clear error messages if flowData cannot be fixed.
 */
function validateAndFixFlowData(flowData: { nodes: unknown[]; edges: unknown[] }) {
    const result = fixFlowData(JSON.stringify(flowData))
    if (!result.valid) {
        const messages = result.errors.map((e) => `${e.path}: ${e.message}`).join('; ')
        throw new Error(`Invalid flowData: ${messages}`)
    }
    return result.data!
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
        const fixedFlowData = validateAndFixFlowData(params.flowData)
        const chatflow = await api.request('POST', '/chatflows', {
            name: params.name,
            flowData: JSON.stringify(fixedFlowData),
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
        if (params.flowData) {
            const fixedFlowData = validateAndFixFlowData(params.flowData)
            updateData.flowData = JSON.stringify(fixedFlowData)
        }
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

/**
 * Diagnose a chatflow by checking for missing fields in the database.
 * This bypasses the Flowise API and checks the raw database record.
 */
export async function handleDiagnoseChatflow(chatflowId: string): Promise<ToolResponse> {
    try {
        const result = await diagnoseChatflow(chatflowId)
        return successResponse(result)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error diagnosing chatflow: ${message}`)
    }
}

/**
 * Repair a chatflow by applying fixFlowData and updating the database directly.
 * This bypasses the Flowise API which strips viewport on save.
 */
export async function handleRepairChatflow(chatflowId: string): Promise<ToolResponse> {
    try {
        const result = await repairChatflow(chatflowId)
        return successResponse(result)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error repairing chatflow: ${message}`)
    }
}

/**
 * Test a chatflow by running smoke and integration tests.
 */
export async function handleTestChatflow(api: FlowiseApiClient, chatflowId: string): Promise<ToolResponse> {
    try {
        const result = await testChatflow(api, chatflowId)
        return successResponse(result)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error testing chatflow: ${message}`)
    }
}

/**
 * Validate flowData structure without saving.
 * Returns validation errors if any.
 */
export async function handleValidateChatflow(params: { flowData: { nodes: unknown[]; edges: unknown[] } }): Promise<ToolResponse> {
    try {
        const result = fixFlowData(JSON.stringify(params.flowData))

        if (!result.valid) {
            return successResponse({
                valid: false,
                errors: result.errors,
                message: 'flowData has structural issues'
            })
        }

        // Check for common credential issues
        const credentialErrors: string[] = []
        const nodes = result.data?.nodes || []

        for (const node of nodes) {
            const nodeData = (node as any)?.data
            if (nodeData?.credential) {
                const validation = validateCredential(nodeData.credential)
                if (!validation.valid) {
                    credentialErrors.push(`Node ${nodeData.name || nodeData.id}: ${validation.error}`)
                }
            }
        }

        if (credentialErrors.length > 0) {
            return successResponse({
                valid: false,
                errors: credentialErrors,
                message: 'Credential validation failed'
            })
        }

        return successResponse({
            valid: true,
            message: 'flowData is valid',
            nodeCount: nodes.length,
            edgeCount: result.data?.edges?.length || 0,
            hasTools: flowHasTools(result.data)
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error validating chatflow: ${message}`)
    }
}

/**
 * List available credentials in the registry.
 */
export async function handleListCredentials(env?: string): Promise<ToolResponse> {
    try {
        const credentials = listCredentials(env)
        return successResponse({
            environment: env || 'dev',
            count: credentials.length,
            credentials: credentials.map((c) => ({
                type: c.type,
                name: c.name,
                uuid: c.uuid,
                description: c.description
            }))
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error listing credentials: ${message}`)
    }
}

/**
 * Resolve a credential type to UUID.
 */
export async function handleResolveCredential(type: string, env?: string): Promise<ToolResponse> {
    try {
        const result = resolveCredential(type, env)

        if (result.error) {
            return errorResponse(result.error)
        }

        return successResponse({
            type,
            uuid: result.uuid,
            resolved: result.resolved,
            environment: env || 'dev'
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error resolving credential: ${message}`)
    }
}
