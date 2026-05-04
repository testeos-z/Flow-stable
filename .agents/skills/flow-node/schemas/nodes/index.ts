/**
 * index.ts — Unified Per-node schema registry + validation entry point.
 *
 * PR 2 (T2.3): Unified index that combines:
 * - 8 hand-crafted MVP schemas from `chatModels.js`, `memory.js`, `embeddings.js`,
 *   `vectorStores.js`, `tools.js`, `agents.js` (Slice 6 PR 2)
 * - 171 auto-generated schemas from `generated/` (Slice 7 PR 1)
 *
 * Strategy:
 * - Hand-crafted schemas win (full business logic, range validation, etc.)
 * - Generated schemas fill gaps (credential-only validation)
 * - Graceful degradation for unknown node types
 *
 * NOTE: The generated schemas are NOT eagerly imported at module level because
 * esbuild has issues bundling them in this nested directory structure. Instead,
 * generated validators are collected lazily and the NODE_SCHEMA_MAP is built
 * without directly importing from generated/index.js at the top level.
 */
import { ErrorCodes } from '../issues.js'
import type { FlowNodeIssue } from '../issues.js'

// Type for validation functions
type PerNodeValidator = (node: unknown) => FlowNodeIssue[]

// ─────────────────────────────────────────────────────────────────────────────
// Hand-crafted schemas (Slice 6 PR 2 — full fidelity validation)
// ─────────────────────────────────────────────────────────────────────────────
import {
    validateChatOpenRouter,
    validateChatOpenAI,
    validateChatAnthropic,
    chatOpenRouterSchema,
    chatOpenAISchema,
    chatAnthropicSchema
} from './chatModels.js'

import { validateBufferMemory, bufferMemorySchema } from './memory.js'

import { validateHuggingFaceInferenceEmbedding, huggingFaceInferenceEmbeddingSchema } from './embeddings.js'

import { validateSupabase, supabaseSchema } from './vectorStores.js'

import { validateRetrieverTool, retrieverToolSchema } from './tools.js'

import { validateToolAgent, toolAgentSchema } from './agents.js'

// ─────────────────────────────────────────────────────────────────────────────
// Build NODE_SCHEMA_MAP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lazy-builder for generated validator map.
 * This avoids importing the entire generated module at module level,
 * which causes esbuild bundling issues in the nested directory structure.
 */
let _generatedValidatorMap: Record<string, PerNodeValidator> | null = null

async function getGeneratedValidators(): Promise<Record<string, PerNodeValidator>> {
    if (_generatedValidatorMap) return _generatedValidatorMap

    // Lazily import and build the generated validator map
    try {
        // Use dynamic import to avoid esbuild bundling issues
        const generatedModule = await import('./generated/index.js')
        const map: Record<string, PerNodeValidator> = {}
        const keys = Object.keys(generatedModule)

        for (const key of keys) {
            if (key.startsWith('validate') && typeof generatedModule[key] === 'function') {
                const nodeName = key.slice(8) // remove 'validate' prefix
                if (nodeName) {
                    map[nodeName] = generatedModule[key]
                }
            }
        }

        _generatedValidatorMap = map
        return map
    } catch (err) {
        console.warn('Failed to load generated validators:', err)
        return {}
    }
}

/**
 * Maps node names to their validation functions.
 *
 * Hand-crafted schemas take precedence over generated ones.
 * Unknown node types → graceful warning via validatePerNode.
 *
 * Coverage:
 * - 8 hand-crafted schemas (full fidelity)
 * - 171 generated schemas (credential-only)
 */
export const NODE_SCHEMA_MAP: Record<string, PerNodeValidator> = {
    // Hand-crafted schemas FIRST (full business logic wins)
    chatOpenRouter: validateChatOpenRouter,
    chatOpenAI: validateChatOpenAI,
    chatAnthropic: validateChatAnthropic,
    bufferMemory: validateBufferMemory,
    huggingFaceInferenceEmbedding: validateHuggingFaceInferenceEmbedding,
    supabase: validateSupabase,
    retrieverTool: validateRetrieverTool,
    toolAgent: validateToolAgent
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-export schemas (hand-crafted only to avoid duplicate exports)
// ─────────────────────────────────────────────────────────────────────────────

// Chat Models
export { chatOpenRouterSchema, validateChatOpenRouter } from './chatModels.js'
export { chatOpenAISchema, validateChatOpenAI } from './chatModels.js'
export { chatAnthropicSchema, validateChatAnthropic } from './chatModels.js'

// Memory
export { bufferMemorySchema, validateBufferMemory } from './memory.js'

// Embeddings
export { huggingFaceInferenceEmbeddingSchema, validateHuggingFaceInferenceEmbedding } from './embeddings.js'

// Vector Stores
export { supabaseSchema, validateSupabase } from './vectorStores.js'

// Tools
export { retrieverToolSchema, validateRetrieverTool } from './tools.js'

// Agents
export { toolAgentSchema, validateToolAgent } from './agents.js'

// ─────────────────────────────────────────────────────────────────────────────
// getPerNodeSchema
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gets the validation function for a specific node type.
 * Returns undefined if the node type is not registered.
 */
export async function getPerNodeSchema(name: string): Promise<PerNodeValidator | undefined> {
    // Check hand-crafted first
    const handCrafted = NODE_SCHEMA_MAP[name]
    if (handCrafted) return handCrafted

    // Fall back to generated validators
    const generated = await getGeneratedValidators()
    return generated[name]
}

// ─────────────────────────────────────────────────────────────────────────────
// validatePerNode
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a node using its per-node schema.
 * Returns issues if validation fails, or if node type is unknown.
 *
 * @param nodeType  The node name (e.g., 'chatOpenRouter')
 * @param nodeData  The node's data object
 * @returns Array of FlowNodeIssue
 */
export async function validatePerNode(nodeType: string, nodeData: unknown): Promise<FlowNodeIssue[]> {
    const validator = await getPerNodeSchema(nodeType)

    if (!validator) {
        return [
            {
                path: 'nodeType',
                code: ErrorCodes.UNKNOWN_NODE_TYPE,
                message: `Unknown node type: ${nodeType}`,
                severity: 'warning'
            }
        ]
    }

    return validator(nodeData)
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadata helpers
// ─────────────────────────────────────────────────────────────────────────────

const HAND_CRAFTED_COUNT = 8 // hand-crafted schemas always win

/**
 * Returns the total count of registered node schemas.
 * Useful for debugging and reporting.
 */
export async function getSchemaCount(): Promise<number> {
    const generated = await getGeneratedValidators()
    return HAND_CRAFTED_COUNT + Object.keys(generated).length
}

/**
 * Returns breakdown of schema sources.
 */
export async function getSchemaStats(): Promise<{ handCrafted: number; generated: number; total: number }> {
    const generated = await getGeneratedValidators()
    const genCount = Object.keys(generated).length
    return {
        handCrafted: HAND_CRAFTED_COUNT,
        generated: genCount,
        total: HAND_CRAFTED_COUNT + genCount
    }
}
