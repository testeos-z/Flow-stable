/**
 * mistralai-embedding.ts — Schema for MistralAI Embedding
 *
 * Auto-generated from node catalogue.
 * Category: Embeddings
 * Provider: Mistral Embed. Buen rendimiento
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const MistralAIEmbeddingSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateMistralAIEmbedding(node: unknown): FlowNodeIssue[] {
    const result = MistralAIEmbeddingSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('MistralAIEmbedding', 'Mistral Embed. Buen rendimiento'))
    }
    return issues
}
