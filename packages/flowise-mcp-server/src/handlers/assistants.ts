/**
 * Assistants handlers — CRUD + component lists + AI instruction generation
 *
 * AST-001: GET    /assistants                       → list all assistants
 * AST-002: GET    /assistants/:id                   → get one assistant
 * AST-003: POST   /assistants                       → create assistant
 * AST-004: PUT    /assistants/:id                   → update assistant
 * AST-005: DELETE /assistants/:id                   → delete assistant
 * AST-006: GET    /assistants/components/chatmodels → list available chat models
 * AST-007: GET    /assistants/components/docstores  → list available doc stores
 * AST-008: GET    /assistants/components/tools      → list available tools
 * AST-009: POST   /assistants/generate/instruction  → AI-generated instruction
 */

import type { FlowiseApiClient } from '../flowise-api.js'
import { passthroughHandler, wrapHandler } from './handler-helpers.js'
import type { ToolResponse } from './handler-helpers.js'

/** AST-001: List all assistants in the workspace */
export async function handleListAssistants(api: FlowiseApiClient): Promise<ToolResponse> {
    return passthroughHandler(api, 'GET', '/assistants', undefined, 'Error listing assistants')
}

/** AST-002: Get a single assistant by ID with full configuration */
export async function handleGetAssistant(api: FlowiseApiClient, id: string): Promise<ToolResponse> {
    return passthroughHandler(api, 'GET', `/assistants/${id}`, undefined, 'Error getting assistant')
}

/** AST-003: Create a new assistant */
export async function handleCreateAssistant(api: FlowiseApiClient, params: Record<string, unknown>): Promise<ToolResponse> {
    return passthroughHandler(api, 'POST', '/assistants', params, 'Error creating assistant')
}

/** AST-004: Update an existing assistant */
export async function handleUpdateAssistant(api: FlowiseApiClient, id: string, params: Record<string, unknown>): Promise<ToolResponse> {
    return passthroughHandler(api, 'PUT', `/assistants/${id}`, params, 'Error updating assistant')
}

/** AST-005: Delete an assistant */
export async function handleDeleteAssistant(api: FlowiseApiClient, id: string): Promise<ToolResponse> {
    return passthroughHandler(api, 'DELETE', `/assistants/${id}`, undefined, 'Error deleting assistant')
}

/** AST-006: Get available chat models for assistants */
export async function handleGetAssistantChatModels(api: FlowiseApiClient): Promise<ToolResponse> {
    return passthroughHandler(api, 'GET', '/assistants/components/chatmodels', undefined, 'Error getting assistant chat models')
}

/** AST-007: Get available document stores for assistants */
export async function handleGetAssistantDocStores(api: FlowiseApiClient): Promise<ToolResponse> {
    return passthroughHandler(api, 'GET', '/assistants/components/docstores', undefined, 'Error getting assistant doc stores')
}

/** AST-008: Get available tools for assistants */
export async function handleGetAssistantTools(api: FlowiseApiClient): Promise<ToolResponse> {
    return passthroughHandler(api, 'GET', '/assistants/components/tools', undefined, 'Error getting assistant tools')
}

/** AST-009: Generate AI-powered assistant instructions (long-running, 10-30s) */
export const handleGenerateAssistantInstruction = wrapHandler(
    async (api: FlowiseApiClient, params: Record<string, unknown>): Promise<ToolResponse> => {
        return passthroughHandler(api, 'POST', '/assistants/generate/instruction', params, 'Error generating assistant instruction')
    }
)
