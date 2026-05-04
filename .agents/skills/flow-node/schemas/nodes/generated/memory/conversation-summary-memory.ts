/**
 * conversation-summary-memory.ts — Schema for Conversation Summary Memory
 *
 * Auto-generated from node catalogue.
 * Category: Memory
 * Provider: LLM
 * Notes: Resumen automático. Ahorra tokens
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const ConversationSummaryMemorySchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateConversationSummaryMemory(node: unknown): FlowNodeIssue[] {
    const result = ConversationSummaryMemorySchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('ConversationSummaryMemory', 'LLM'))
    }
    return issues
}
