/**
 * Credentials API handlers — CRUD for Flowise API-managed credentials
 *
 * These are the NEW API-based credential tools, distinct from `list_credential_types`
 * which uses the local hardcoded registry. Names match the original `list_credentials`
 * tool name (now repurposed for API-based listing).
 *
 * CRD-001: GET    /credentials      → list credentials (API-based)
 * CRD-002: GET    /credentials/:id  → get credential
 * CRD-003: POST   /credentials      → create credential
 * CRD-004: PUT    /credentials/:id  → update credential
 * CRD-005: DELETE /credentials/:id  → delete credential
 */

import type { FlowiseApiClient } from '../flowise-api.js'
import { successResponse, errorResponse } from './handler-helpers.js'
import type { ToolResponse } from './handler-helpers.js'

/** List API-managed credentials with optional pagination */
export async function handleListCredentials(api: FlowiseApiClient, params?: { page?: number; limit?: number }): Promise<ToolResponse> {
    try {
        const queryParts: string[] = []
        if (params?.page !== undefined) queryParts.push(`page=${params.page}`)
        if (params?.limit !== undefined) queryParts.push(`limit=${params.limit}`)
        const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''
        const data = await api.request('GET', `/credentials${queryString}`)
        return successResponse(data)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error listing credentials: ${message}`)
    }
}

/** Get a single API-managed credential by ID */
export async function handleGetCredential(api: FlowiseApiClient, id: string): Promise<ToolResponse> {
    try {
        const data = await api.request('GET', `/credentials/${id}`)
        return successResponse(data)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error getting credential: ${message}`)
    }
}

/**
 * Create a new credential.
 * WARNING: plainDataEnv contains plaintext API keys — agents MUST NOT log or persist these values.
 */
export async function handleCreateCredential(
    api: FlowiseApiClient,
    params: {
        name: string
        credentialName: string
        plainDataEnv: Record<string, string>
    }
): Promise<ToolResponse> {
    try {
        const data = await api.request('POST', '/credentials', params)
        return successResponse(data)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error creating credential: ${message}`)
    }
}

/** Update an existing credential */
export async function handleUpdateCredential(
    api: FlowiseApiClient,
    id: string,
    params: {
        name?: string
        credentialName?: string
        plainDataEnv?: Record<string, string>
    }
): Promise<ToolResponse> {
    try {
        const data = await api.request('PUT', `/credentials/${id}`, params)
        return successResponse(data)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error updating credential: ${message}`)
    }
}

/** Delete a credential */
export async function handleDeleteCredential(api: FlowiseApiClient, id: string): Promise<ToolResponse> {
    try {
        const result = await api.request('DELETE', `/credentials/${id}`)
        return successResponse({ success: true, deleted: id, result })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return errorResponse(`Error deleting credential: ${message}`)
    }
}
