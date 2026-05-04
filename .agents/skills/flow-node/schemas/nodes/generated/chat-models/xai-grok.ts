/**
 * xai-grok.ts — Schema for xAI Grok
 *
 * Auto-generated from node catalogue.
 * Category: Chat Models
 * Provider: xAI
 * Notes: Grok. Alternativa
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const xAIGrokSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validatexAIGrok(node: unknown): FlowNodeIssue[] {
    const result = xAIGrokSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('xAIGrok', 'xAI'))
    }
    return issues
}
