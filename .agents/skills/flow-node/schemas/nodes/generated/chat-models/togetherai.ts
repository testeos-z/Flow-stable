/**
 * togetherai.ts — Schema for TogetherAI
 *
 * Auto-generated from node catalogue.
 * Category: Chat Models
 * Provider: TogetherAI
 * Notes: Muchos modelos open-source hosteados
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const TogetherAISchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateTogetherAI(node: unknown): FlowNodeIssue[] {
    const result = TogetherAISchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('TogetherAI', 'TogetherAI'))
    }
    return issues
}
