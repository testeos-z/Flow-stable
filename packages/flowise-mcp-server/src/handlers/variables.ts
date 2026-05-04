/**
 * Variables handlers — CRUD for Flowise workspace variables
 *
 * VAR-001: GET  /variables     → list all variables
 * VAR-002: POST /variables     → create variable
 * VAR-003: PUT  /variables/:id → update variable
 * VAR-004: DELETE /variables/:id → delete variable
 */

import type { FlowiseApiClient } from '../flowise-api.js'
import { passthroughHandler } from './handler-helpers.js'
import type { ToolResponse } from './handler-helpers.js'

/** VAR-001: List all variables in the workspace */
export async function handleListVariables(api: FlowiseApiClient): Promise<ToolResponse> {
    return passthroughHandler(api, 'GET', '/variables', undefined, 'Error listing variables')
}

/** VAR-002: Create a new variable */
export async function handleCreateVariable(
    api: FlowiseApiClient,
    params: { variableName: string; value: string; type?: 'static' | 'runtime' }
): Promise<ToolResponse> {
    return passthroughHandler(api, 'POST', '/variables', params, 'Error creating variable')
}

/** VAR-003: Update an existing variable */
export async function handleUpdateVariable(
    api: FlowiseApiClient,
    id: string,
    params: { variableName?: string; value?: string; type?: 'static' | 'runtime' }
): Promise<ToolResponse> {
    return passthroughHandler(api, 'PUT', `/variables/${id}`, params, 'Error updating variable')
}

/** VAR-004: Delete a variable */
export async function handleDeleteVariable(api: FlowiseApiClient, id: string): Promise<ToolResponse> {
    return passthroughHandler(api, 'DELETE', `/variables/${id}`, undefined, 'Error deleting variable')
}
