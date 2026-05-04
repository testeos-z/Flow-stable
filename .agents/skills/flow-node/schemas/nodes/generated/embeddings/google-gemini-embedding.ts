/**
 * google-gemini-embedding.ts — Schema for Google Gemini Embedding
 *
 * Auto-generated from node catalogue.
 * Category: Embeddings
 * Provider: Gratis. gemini-embedding-exp
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const GoogleGeminiEmbeddingSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateGoogleGeminiEmbedding(node: unknown): FlowNodeIssue[] {
    const result = GoogleGeminiEmbeddingSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('GoogleGeminiEmbedding', 'Gratis. gemini-embedding-exp'))
    }
    return issues
}
