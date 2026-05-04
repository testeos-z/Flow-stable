/**
 * multi-query-retriever.ts — Schema for Multi Query Retriever
 *
 * Auto-generated from node catalogue.
 * Category: Retrievers
 * Provider: Genera múltiples queries para mejor recall
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const MultiQueryRetrieverSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateMultiQueryRetriever(node: unknown): FlowNodeIssue[] {
    const result = MultiQueryRetrieverSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('MultiQueryRetriever', 'Genera múltiples queries para mejor recall'))
    }
    return issues
}
