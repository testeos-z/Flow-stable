/**
 * embeddings.ts — Per-node Zod schemas for Embeddings nodes.
 *
 * Slice 6 PR 2 (T5): 1 schema for:
 * - huggingFaceInferenceEmbedding (credentialNames: ['huggingFaceApi'])
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
// huggingFaceInferenceEmbedding Schema
// ============================================================

/**
 * Schema for huggingFaceInferenceEmbedding node validation.
 * credentialNames: ['huggingFaceApi']
 */
export const huggingFaceInferenceEmbeddingSchema = z.object({
    credential: z.string().uuid().optional(),
    modelName: z.string().optional(),
    endpoint: z.string().optional()
})

/**
 * Validates huggingFaceInferenceEmbedding node.
 * Checks credential provider matches huggingFaceApi.
 */
export function validateHuggingFaceInferenceEmbedding(node: unknown): FlowNodeIssue[] {
    const result = huggingFaceInferenceEmbeddingSchema.safeParse(node)
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

    // Validate credential if present
    if (data.credential) {
        issues.push(...validateCredential(data.credential))
        issues.push(...validateCredentialProvider('huggingFaceInferenceEmbedding', 'huggingFaceApi'))
    }

    // At least modelName or endpoint must be provided
    const modelName = getField<string>(data, 'modelName', '')
    const endpoint = getField<string>(data, 'endpoint', '')
    if (!modelName && !endpoint) {
        issues.push({
            path: 'modelName',
            code: ErrorCodes.INVALID_FIELD,
            message: 'Either modelName or endpoint must be provided',
            severity: 'error'
        })
    }

    return issues
}
