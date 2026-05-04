/**
 * groq.ts — Schema for Groq
 *
 * Auto-generated from node catalogue.
 * Category: Chat Models
 * Provider: Groq
 * Notes: Inferencia ultrarrápida. Llama, Mixtral
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const GroqSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateGroq(node: unknown): FlowNodeIssue[] {
    const result = GroqSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('Groq', 'Groq'))
    }
    return issues
}
