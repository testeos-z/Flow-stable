/**
 * categories.ts — Category Schema + getCategorySchema() + validateCategory()
 *
 * Phase 1 (T1-T4): Category Schemas Core
 *
 * Provides validation layer for ChatFlow node categories:
 * Chat Models, Memory, Vector Stores, Embeddings, Tools
 */

import { FlowNodeIssue, ErrorCodes } from './issues.js'

// ============================================================================
// Category Enum
// ============================================================================

/**
 * Category values matching Flowise template categories.
 * Using string values directly (not enum keys) for template compatibility.
 */
export enum Category {
    CHAT_MODELS = 'Chat Models',
    MEMORY = 'Memory',
    VECTOR_STORES = 'Vector Stores',
    EMBEDDINGS = 'Embeddings',
    TOOLS = 'Tools'
}

// Reverse lookup: string → Category
const CATEGORY_MAP: Record<string, Category> = {
    'Chat Models': Category.CHAT_MODELS,
    Memory: Category.MEMORY,
    'Vector Stores': Category.VECTOR_STORES,
    Embeddings: Category.EMBEDDINGS,
    Tools: Category.TOOLS
}

// ============================================================================
// CategorySchema Type
// ============================================================================

export interface CategorySchema {
    /** Category enum value */
    category: Category
    /** Parameter names that must be present in node's inputParams */
    requiredInputParams: string[]
    /** Parameter names that are optional */
    optionalInputParams: string[]
    /** Minimum number of input anchors */
    minInputAnchors: number
    /** Maximum number of input anchors */
    maxInputAnchors: number
    /** Minimum number of output anchors */
    minOutputAnchors: number
    /** Maximum number of output anchors */
    maxOutputAnchors: number
    /** Optional semantic validation rules specific to this category */
    semanticRules?: (node: Record<string, unknown>) => FlowNodeIssue[]
}

// ============================================================================
// Category Definitions
// ============================================================================

/**
 * Category definitions based on Slice 5 design.
 * Each category defines its required params, anchor constraints, and semantic rules.
 */
const CATEGORY_SCHEMAS: Record<Category, CategorySchema> = {
    [Category.CHAT_MODELS]: {
        category: Category.CHAT_MODELS,
        requiredInputParams: ['credential', 'modelName'],
        optionalInputParams: ['temperature', 'maxTokens', 'topP'],
        minInputAnchors: 0,
        maxInputAnchors: 1,
        minOutputAnchors: 1,
        maxOutputAnchors: 1,
        semanticRules: (node) => {
            const issues: FlowNodeIssue[] = []
            const data = node.data as Record<string, unknown>
            const inputParams = (data.inputParams ?? []) as Array<{ name?: string }>

            // Check that modelName is not empty
            const modelNameParam = inputParams.find((p) => p.name === 'modelName')
            if (!modelNameParam) {
                issues.push({
                    path: 'data.inputParams',
                    code: ErrorCodes.MISSING_MODEL_NAME,
                    message: 'Chat Models must have modelName parameter',
                    severity: 'error'
                })
            }

            // Check credential type
            const credentialParam = inputParams.find((p) => p.name === 'credential')
            if (credentialParam) {
                const credentialValue = (data.inputs as Record<string, unknown>)?.credential
                if (!credentialValue || credentialValue === '') {
                    issues.push({
                        path: 'data.inputs.credential',
                        code: ErrorCodes.INVALID_CREDENTIAL_FORMAT,
                        message: 'credential must be set to a valid API key',
                        severity: 'error'
                    })
                }
            }

            return issues
        }
    },

    [Category.MEMORY]: {
        category: Category.MEMORY,
        requiredInputParams: [],
        optionalInputParams: ['sessionId', 'memoryKey', 'windowSize'],
        minInputAnchors: 0,
        maxInputAnchors: 0, // Memory nodes typically don't have input anchors
        minOutputAnchors: 1,
        maxOutputAnchors: 1,
        semanticRules: (node) => {
            const issues: FlowNodeIssue[] = []
            const data = node.data as Record<string, unknown>
            const inputs = (data.inputs ?? {}) as Record<string, unknown>
            const outputAnchors = (data.outputAnchors ?? []) as Array<unknown>

            // If there are output anchors, sessionId or memoryKey should be present
            if (outputAnchors.length > 0) {
                const hasSessionId = inputs.sessionId && inputs.sessionId !== ''
                const hasMemoryKey = inputs.memoryKey && inputs.memoryKey !== ''

                if (!hasSessionId && !hasMemoryKey) {
                    issues.push({
                        path: 'data.inputs',
                        code: ErrorCodes.MISSING_REQUIRED_FIELD,
                        message: 'Memory with output anchors should have sessionId or memoryKey',
                        severity: 'warning'
                    })
                }
            }

            return issues
        }
    },

    [Category.VECTOR_STORES]: {
        category: Category.VECTOR_STORES,
        requiredInputParams: ['supabaseProjUrl', 'tableName'],
        optionalInputParams: ['queryName', 'searchParams'],
        minInputAnchors: 1,
        maxInputAnchors: 2,
        minOutputAnchors: 1,
        maxOutputAnchors: 1,
        semanticRules: (node) => {
            const issues: FlowNodeIssue[] = []
            const data = node.data as Record<string, unknown>
            const inputs = (data.inputs ?? {}) as Record<string, unknown>
            const inputParams = (data.inputParams ?? []) as Array<{ name?: string }>

            // Check tableName is not empty
            const tableNameParam = inputParams.find((p) => p.name === 'tableName')
            if (tableNameParam) {
                const tableNameValue = inputs.tableName
                if (!tableNameValue || tableNameValue === '') {
                    issues.push({
                        path: 'data.inputs.tableName',
                        code: ErrorCodes.EMPTY_REQUIRED_PARAM,
                        message: 'tableName must not be empty',
                        severity: 'error'
                    })
                }
            }

            // Check supabaseProjUrl is not empty
            const supabaseParam = inputParams.find((p) => p.name === 'supabaseProjUrl')
            if (supabaseParam) {
                const supabaseValue = inputs.supabaseProjUrl
                if (!supabaseValue || supabaseValue === '') {
                    issues.push({
                        path: 'data.inputs.supabaseProjUrl',
                        code: ErrorCodes.EMPTY_REQUIRED_PARAM,
                        message: 'supabaseProjUrl must not be empty',
                        severity: 'error'
                    })
                }
            }

            return issues
        }
    },

    [Category.EMBEDDINGS]: {
        category: Category.EMBEDDINGS,
        requiredInputParams: ['credential'],
        optionalInputParams: ['modelName', 'batchSize'],
        minInputAnchors: 1,
        maxInputAnchors: 1,
        minOutputAnchors: 1,
        maxOutputAnchors: 1,
        semanticRules: (node) => {
            const issues: FlowNodeIssue[] = []
            const data = node.data as Record<string, unknown>
            const inputParams = (data.inputParams ?? []) as Array<{ name?: string }>

            // Check credential type
            const credentialParam = inputParams.find((p) => p.name === 'credential')
            if (credentialParam) {
                const credentialValue = (data.inputs as Record<string, unknown>)?.credential
                if (!credentialValue || credentialValue === '') {
                    issues.push({
                        path: 'data.inputs.credential',
                        code: ErrorCodes.INVALID_CREDENTIAL_FORMAT,
                        message: 'credential must be set to a valid API key',
                        severity: 'error'
                    })
                }
            }

            return issues
        }
    },

    [Category.TOOLS]: {
        category: Category.TOOLS,
        requiredInputParams: ['name'],
        optionalInputParams: ['description', 'returnDirect'],
        minInputAnchors: 1,
        maxInputAnchors: 1,
        minOutputAnchors: 1,
        maxOutputAnchors: 1,
        semanticRules: (node) => {
            const issues: FlowNodeIssue[] = []
            const data = node.data as Record<string, unknown>
            const inputs = (data.inputs ?? {}) as Record<string, unknown>
            const inputParams = (data.inputParams ?? []) as Array<{ name?: string }>

            // Check name is not empty
            const nameParam = inputParams.find((p) => p.name === 'name')
            if (nameParam) {
                const nameValue = inputs.name
                if (!nameValue || nameValue === '') {
                    issues.push({
                        path: 'data.inputs.name',
                        code: ErrorCodes.EMPTY_REQUIRED_PARAM,
                        message: 'Tool name must not be empty',
                        severity: 'error'
                    })
                }
            }

            return issues
        }
    }
}

// ============================================================================
// getCategorySchema()
// ============================================================================

/**
 * Get the CategorySchema for a given category string.
 *
 * @param category - Category string from node.data.category (e.g., "Chat Models")
 * @returns CategorySchema or null if category is not recognized
 */
export function getCategorySchema(category: string): CategorySchema | null {
    if (!category) {
        return null
    }

    const normalized = CATEGORY_MAP[category]
    if (!normalized) {
        return null
    }

    return CATEGORY_SCHEMAS[normalized] ?? null
}

// ============================================================================
// validateCategory()
// ============================================================================

/**
 * Validate a node against its category schema.
 *
 * @param node - The node object (with data containing inputParams, inputAnchors, outputAnchors)
 * @param category - The category string (e.g., "Chat Models")
 * @returns Array of issues (empty if validation passes)
 */
export function validateCategory(node: Record<string, unknown>, category: string): FlowNodeIssue[] {
    const issues: FlowNodeIssue[] = []

    // Get category schema
    const schema = getCategorySchema(category)
    if (!schema) {
        // Unknown category - return empty (graceful degradation)
        // Per-node validation will catch unrecognized categories later
        return issues
    }

    const data = node.data as Record<string, unknown>
    const inputParams = (data.inputParams ?? []) as Array<{ name?: string }>
    const inputAnchors = (data.inputAnchors ?? []) as Array<unknown>
    const outputAnchors = (data.outputAnchors ?? []) as Array<unknown>
    const inputs = (data.inputs ?? {}) as Record<string, unknown>

    // 1. Validate required inputParams are present
    for (const requiredParam of schema.requiredInputParams) {
        const paramExists = inputParams.some((p) => p.name === requiredParam)
        if (!paramExists) {
            issues.push({
                path: 'data.inputParams',
                code: ErrorCodes.MISSING_REQUIRED_FIELD,
                message: `Missing required parameter: ${requiredParam}`,
                severity: 'error'
            })
        }
    }

    // 2. Validate required params have values (not empty)
    for (const requiredParam of schema.requiredInputParams) {
        const paramValue = inputs[requiredParam]
        if (paramValue === undefined || paramValue === '' || paramValue === null) {
            issues.push({
                path: `data.inputs.${requiredParam}`,
                code: ErrorCodes.EMPTY_REQUIRED_PARAM,
                message: `Parameter ${requiredParam} must have a value`,
                severity: 'error'
            })
        }
    }

    // 3. Validate inputAnchors count
    const inputAnchorCount = inputAnchors.length
    if (inputAnchorCount < schema.minInputAnchors) {
        issues.push({
            path: 'data.inputAnchors',
            code: ErrorCodes.INVALID_ANCHOR_SHAPE,
            message: `Too few input anchors: got ${inputAnchorCount}, expected at least ${schema.minInputAnchors}`,
            severity: 'error'
        })
    }
    if (inputAnchorCount > schema.maxInputAnchors) {
        issues.push({
            path: 'data.inputAnchors',
            code: ErrorCodes.INVALID_ANCHOR_SHAPE,
            message: `Too many input anchors: got ${inputAnchorCount}, expected at most ${schema.maxInputAnchors}`,
            severity: 'error'
        })
    }

    // 4. Validate outputAnchors count
    const outputAnchorCount = outputAnchors.length
    if (outputAnchorCount < schema.minOutputAnchors) {
        issues.push({
            path: 'data.outputAnchors',
            code: ErrorCodes.INVALID_ANCHOR_SHAPE,
            message: `Too few output anchors: got ${outputAnchorCount}, expected at least ${schema.minOutputAnchors}`,
            severity: 'error'
        })
    }
    if (outputAnchorCount > schema.maxOutputAnchors) {
        issues.push({
            path: 'data.outputAnchors',
            code: ErrorCodes.INVALID_ANCHOR_SHAPE,
            message: `Too many output anchors: got ${outputAnchorCount}, expected at most ${schema.maxOutputAnchors}`,
            severity: 'error'
        })
    }

    // 5. Apply semantic rules if defined
    if (schema.semanticRules) {
        const semanticIssues = schema.semanticRules(node)
        issues.push(...semanticIssues)
    }

    return issues
}
