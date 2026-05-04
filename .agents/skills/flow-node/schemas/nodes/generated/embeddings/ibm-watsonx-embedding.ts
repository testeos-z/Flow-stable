/**
 * ibm-watsonx-embedding.ts — Schema for IBM Watsonx Embedding
 *
 * Auto-generated from node catalogue.
 * Category: Embeddings
 * Provider: Si usás IBM
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const IBMWatsonxEmbeddingSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateIBMWatsonxEmbedding(node: unknown): FlowNodeIssue[] {
    const result = IBMWatsonxEmbeddingSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('IBMWatsonxEmbedding', 'Si usás IBM'))
    }
    return issues
}
