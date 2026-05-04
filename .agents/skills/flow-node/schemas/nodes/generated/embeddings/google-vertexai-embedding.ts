/**
 * google-vertexai-embedding.ts — Schema for Google VertexAI Embedding
 *
 * Auto-generated from node catalogue.
 * Category: Embeddings
 * Provider: Si estás en GCP
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const GoogleVertexAIEmbeddingSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateGoogleVertexAIEmbedding(node: unknown): FlowNodeIssue[] {
    const result = GoogleVertexAIEmbeddingSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('GoogleVertexAIEmbedding', 'Si estás en GCP'))
    }
    return issues
}
