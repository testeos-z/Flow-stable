/**
 * anthropic-claude.ts — Schema for Anthropic Claude
 *
 * Auto-generated from node catalogue.
 * Category: Chat Models
 * Provider: Anthropic
 * Notes: Claude 4 Opus/Sonnet, Haiku. Mejor en razonamiento largo
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const AnthropicClaudeSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateAnthropicClaude(node: unknown): FlowNodeIssue[] {
    const result = AnthropicClaudeSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('AnthropicClaude', 'Anthropic'))
    }
    return issues
}
