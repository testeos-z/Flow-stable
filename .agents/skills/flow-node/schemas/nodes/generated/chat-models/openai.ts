/**
 * openai.ts — Schema for OpenAI
 *
 * Auto-generated from node catalogue.
 * Category: Chat Models
 * Provider: OpenAI
 * Notes: Default. GPT-4, GPT-4o-mini. Razonamiento o-series
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const OpenAISchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateOpenAI(node: unknown): FlowNodeIssue[] {
    const result = OpenAISchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('OpenAI', 'OpenAI'))
    }
    return issues
}
