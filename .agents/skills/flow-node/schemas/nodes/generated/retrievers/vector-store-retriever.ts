/**
 * vector-store-retriever.ts — Schema for Vector Store Retriever
 *
 * Auto-generated from node catalogue.
 * Category: Retrievers
 * Provider: Default. Recupera chunks similares
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const VectorStoreRetrieverSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateVectorStoreRetriever(node: unknown): FlowNodeIssue[] {
    const result = VectorStoreRetrieverSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('VectorStoreRetriever', 'Default. Recupera chunks similares'))
    }
    return issues
}
