/**
 * Shared handler helpers and types for Flowise MCP tools
 */

import type { FlowiseApiClient } from '../flowise-api.js'

// Response type for MCP tools — uses index signature for compatibility with MCP SDK
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
 * Passthrough handler: direct API call wrapper with error handling.
 * Takes the API client, HTTP method, endpoint, optional body, and error prefix.
 * Returns successResponse(data) on success or errorResponse(message) on failure.
 */
export async function passthroughHandler<T = unknown>(
    api: FlowiseApiClient,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: unknown,
    errorPrefix?: string
): Promise<ToolResponse> {
    try {
        const data = await api.request<T>(method, endpoint, body)
        return successResponse(data)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`${errorPrefix ? `${errorPrefix}: ` : ''}${message}`)
    }
}

/**
 * Wrap a handler function with top-level error catching.
 * If the handler throws unexpectedly, returns an errorResponse instead of crashing.
 */
export function wrapHandler<Args extends unknown[]>(
    handler: (...args: Args) => Promise<ToolResponse>
): (...args: Args) => Promise<ToolResponse> {
    return async (...args: Args): Promise<ToolResponse> => {
        try {
            return await handler(...args)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            return errorResponse(`Unexpected error: ${message}`)
        }
    }
}
