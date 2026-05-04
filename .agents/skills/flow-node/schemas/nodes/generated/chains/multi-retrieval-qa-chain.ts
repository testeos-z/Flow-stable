/**
 * multi-retrieval-qa-chain.ts — Schema for Multi Retrieval QA Chain
 *
 * Auto-generated from node catalogue.
 * Category: Chains
 * Provider: RAG con múltiples retrievers en paralelo
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const MultiRetrievalQAChainSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateMultiRetrievalQAChain(node: unknown): FlowNodeIssue[] {
    const result = MultiRetrievalQAChainSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('MultiRetrievalQAChain', 'RAG con múltiples retrievers en paralelo'))
    }
    return issues
}
