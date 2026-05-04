/**
 * ollama-embedding.ts — Schema for Ollama Embedding
 *
 * Auto-generated from node catalogue.
 * Category: Embeddings
 * Provider: Local. Sin API key. Ideal para dev/testing
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const OllamaEmbeddingSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateOllamaEmbedding(node: unknown): FlowNodeIssue[] {
    const result = OllamaEmbeddingSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('OllamaEmbedding', 'Local. Sin API key. Ideal para dev/testing'))
    }
    return issues
}
