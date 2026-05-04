/**
 * conversation-summary-buffer.ts — Schema for Conversation Summary Buffer
 *
 * Auto-generated from node catalogue.
 * Category: Memory
 * Provider: LLM
 * Notes: Híbrido: últimos mensajes + resumen cuando excede límite
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const ConversationSummaryBufferSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateConversationSummaryBuffer(node: unknown): FlowNodeIssue[] {
    const result = ConversationSummaryBufferSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('ConversationSummaryBuffer', 'LLM'))
    }
    return issues
}
