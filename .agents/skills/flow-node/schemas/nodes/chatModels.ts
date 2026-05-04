/**
 * chatModels.ts — Per-node Zod schemas for Chat Model nodes.
 *
 * Slice 6 PR 2 (T3): 3 schemas for:
 * - chatOpenRouter (credentialNames: ['openRouterApi'])
 * - chatOpenAI (credentialNames: ['openAIApi'])
 * - chatAnthropic (credentialNames: ['anthropicApi'])
 */
import z from 'zod'
import { ErrorCodes } from '../issues.js'
import type { FlowNodeIssue } from '../issues.js'
import { validateCredentialProvider, validateCredential } from '../credentials.js'

// Helper to extract typed field from unknown
function getField<T>(data: unknown, key: string, defaultVal: T): T {
    if (typeof data !== 'object' || data === null) return defaultVal
    const obj = data as Record<string, unknown>
    const val = obj[key]
    return val !== undefined ? (val as T) : defaultVal
}

// ============================================================
// chatOpenRouter Schema
// ============================================================

/**
 * Schema for chatOpenRouter node validation.
 * credentialNames: ['openRouterApi']
 */
export const chatOpenRouterSchema = z.object({
    credential: z.string().uuid().optional(),
    modelName: z.string().optional(),
    temperature: z.number().optional(),
    streaming: z.boolean().optional(),
    allowImageUploads: z.boolean().optional(),
    maxTokens: z.number().optional(),
    topP: z.number().optional(),
    frequencyPenalty: z.number().optional(),
    presencePenalty: z.number().optional(),
    timeout: z.number().optional(),
    basepath: z.string().optional(),
    baseOptions: z.unknown().optional()
})

/**
 * Validates chatOpenRouter node.
 * Checks credential provider matches openRouterApi.
 */
export function validateChatOpenRouter(node: unknown): FlowNodeIssue[] {
    const result = chatOpenRouterSchema.safeParse(node)
    if (!result.success) {
        return result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            code: ErrorCodes.INVALID_FIELD,
            message: issue.message,
            severity: 'error' as const
        }))
    }

    const data = result.data as unknown as Record<string, unknown>
    const issues: FlowNodeIssue[] = []
    if (data.credential) {
        issues.push(...validateCredential(data.credential))
        issues.push(...validateCredentialProvider('chatOpenRouter', 'openRouterApi'))
    }

    // Validate temperature range
    const temperature = getField<number>(data, 'temperature', 0.9)
    if (typeof temperature === 'number' && (temperature < 0 || temperature > 2)) {
        issues.push({
            path: 'temperature',
            code: ErrorCodes.INVALID_FIELD,
            message: 'Temperature must be between 0 and 2',
            severity: 'error'
        })
    }

    // Validate topP range
    const topP = getField<number>(data, 'topP', 1)
    if (typeof topP === 'number' && (topP < 0 || topP > 1)) {
        issues.push({
            path: 'topP',
            code: ErrorCodes.INVALID_FIELD,
            message: 'topP must be between 0 and 1',
            severity: 'error'
        })
    }

    return issues
}

// ============================================================
// chatOpenAI Schema
// ============================================================

/**
 * Schema for chatOpenAI node validation.
 * credentialNames: ['openAIApi']
 */
export const chatOpenAISchema = z.object({
    credential: z.string().uuid(),
    modelName: z.string().optional(),
    temperature: z.number().optional(),
    streaming: z.boolean().optional(),
    allowImageUploads: z.boolean().optional(),
    reasoning: z.boolean().optional(),
    reasoningEffort: z.string().optional(),
    reasoningSummary: z.string().optional(),
    maxTokens: z.number().optional(),
    topP: z.number().optional(),
    frequencyPenalty: z.number().optional(),
    presencePenalty: z.number().optional(),
    timeout: z.number().optional(),
    strictToolCalling: z.boolean().optional(),
    stopSequence: z.string().optional(),
    basepath: z.string().optional(),
    baseOptions: z.unknown().optional()
})

/**
 * Validates chatOpenAI node.
 * Checks credential provider matches openAIApi.
 */
export function validateChatOpenAI(node: unknown): FlowNodeIssue[] {
    const result = chatOpenAISchema.safeParse(node)
    if (!result.success) {
        return result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            code: ErrorCodes.INVALID_FIELD,
            message: issue.message,
            severity: 'error' as const
        }))
    }

    const data = result.data as unknown as Record<string, unknown>

    const issues: FlowNodeIssue[] = []

    // Credential is required for chatOpenAI
    if (!data.credential) {
        issues.push({
            path: 'credential',
            code: ErrorCodes.CREDENTIAL_NOT_FOUND,
            message: 'Credential is required for chatOpenAI',
            severity: 'error'
        })
    } else {
        issues.push(...validateCredential(data.credential))
        issues.push(...validateCredentialProvider('chatOpenAI', 'openAIApi'))
    }

    // Validate temperature range
    const temperature = getField<number>(data, 'temperature', 0.9)
    if (typeof temperature === 'number' && (temperature < 0 || temperature > 2)) {
        issues.push({
            path: 'temperature',
            code: ErrorCodes.INVALID_FIELD,
            message: 'Temperature must be between 0 and 2',
            severity: 'error'
        })
    }

    // Validate topP range
    const topP = getField<number>(data, 'topP', 1)
    if (typeof topP === 'number' && (topP < 0 || topP > 1)) {
        issues.push({
            path: 'topP',
            code: ErrorCodes.INVALID_FIELD,
            message: 'topP must be between 0 and 1',
            severity: 'error'
        })
    }

    return issues
}

// ============================================================
// chatAnthropic Schema
// ============================================================

/**
 * Schema for chatAnthropic node validation.
 * credentialNames: ['anthropicApi']
 */
export const chatAnthropicSchema = z.object({
    credential: z.string().uuid(),
    modelName: z.string().optional(),
    temperature: z.number().optional(),
    streaming: z.boolean().optional(),
    allowImageUploads: z.boolean().optional(),
    extendedThinking: z.boolean().optional(),
    budgetTokens: z.number().optional(),
    adaptiveThinking: z.boolean().optional(),
    thinkingEffort: z.string().optional(),
    maxTokensToSample: z.number().optional(),
    topP: z.number().optional(),
    topK: z.number().optional()
})

/**
 * Validates chatAnthropic node.
 * Checks credential provider matches anthropicApi.
 */
export function validateChatAnthropic(node: unknown): FlowNodeIssue[] {
    const result = chatAnthropicSchema.safeParse(node)
    if (!result.success) {
        return result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            code: ErrorCodes.INVALID_FIELD,
            message: issue.message,
            severity: 'error' as const
        }))
    }

    const data = result.data as unknown as Record<string, unknown>

    const issues: FlowNodeIssue[] = []

    // Credential is required for chatAnthropic
    if (!data.credential) {
        issues.push({
            path: 'credential',
            code: ErrorCodes.CREDENTIAL_NOT_FOUND,
            message: 'Credential is required for chatAnthropic',
            severity: 'error'
        })
    } else {
        issues.push(...validateCredential(data.credential))
        issues.push(...validateCredentialProvider('chatAnthropic', 'anthropicApi'))
    }

    // Validate temperature range
    const temperature = getField<number>(data, 'temperature', 0.9)
    if (typeof temperature === 'number' && (temperature < 0 || temperature > 1)) {
        issues.push({
            path: 'temperature',
            code: ErrorCodes.INVALID_FIELD,
            message: 'Temperature must be between 0 and 1',
            severity: 'error'
        })
    }

    // Validate topP range
    const topP = getField<number>(data, 'topP', 1)
    if (typeof topP === 'number' && (topP < 0 || topP > 1)) {
        issues.push({
            path: 'topP',
            code: ErrorCodes.INVALID_FIELD,
            message: 'topP must be between 0 and 1',
            severity: 'error'
        })
    }

    // Validate budgetTokens is required if extendedThinking is true
    const extendedThinking = getField<boolean>(data, 'extendedThinking', false)
    if (extendedThinking === true && !data.budgetTokens) {
        issues.push({
            path: 'budgetTokens',
            code: ErrorCodes.INVALID_FIELD,
            message: 'budgetTokens is required when extendedThinking is enabled',
            severity: 'error'
        })
    }

    return issues
}
