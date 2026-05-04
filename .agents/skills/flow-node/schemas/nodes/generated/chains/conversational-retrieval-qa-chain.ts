/**
 * conversational-retrieval-qa-chain.ts — Schema for Conversational Retrieval QA Chain
 *
 * Auto-generated from node catalogue.
 * Category: Chains
 * Provider: RAG con historial de chat
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const ConversationalRetrievalQAChainSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateConversationalRetrievalQAChain(node: unknown): FlowNodeIssue[] {
    const result = ConversationalRetrievalQAChainSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('ConversationalRetrievalQAChain', 'RAG con historial de chat'))
    }
    return issues
}
