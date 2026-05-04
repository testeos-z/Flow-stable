/**
 * API Key Management handlers — CRUD for Flowise API keys
 *
 * APK-001: GET    /apikey     → list all API keys
 * APK-002: POST   /apikey     → create API key
 * APK-003: PUT    /apikey/:id → update API key
 * APK-004: DELETE /apikey/:id → delete API key
 */

import type { FlowiseApiClient } from '../flowise-api.js'
import { passthroughHandler } from './handler-helpers.js'
import type { ToolResponse } from './handler-helpers.js'

/** APK-001: List all API keys in the workspace */
export async function handleListApiKeys(api: FlowiseApiClient): Promise<ToolResponse> {
    return passthroughHandler(api, 'GET', '/apikey', undefined, 'Error listing API keys')
}

/** APK-002: Create a new API key */
export async function handleCreateApiKey(api: FlowiseApiClient, params: { apiKeyName: string }): Promise<ToolResponse> {
    return passthroughHandler(api, 'POST', '/apikey', params, 'Error creating API key')
}

/** APK-003: Update an existing API key (rename) */
export async function handleUpdateApiKey(api: FlowiseApiClient, id: string, params: { apiKeyName?: string }): Promise<ToolResponse> {
    return passthroughHandler(api, 'PUT', `/apikey/${id}`, params, 'Error updating API key')
}

/** APK-004: Delete (revoke) an API key */
export async function handleDeleteApiKey(api: FlowiseApiClient, id: string): Promise<ToolResponse> {
    return passthroughHandler(api, 'DELETE', `/apikey/${id}`, undefined, 'Error deleting API key')
}
