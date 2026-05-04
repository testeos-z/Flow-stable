/**
 * deepseek.ts — Schema for Deepseek
 *
 * Auto-generated from node catalogue.
 * Category: Chat Models
 * Provider: DeepSeek
 * Notes: DeepSeek R1/V3. Razonamiento. Muy económico
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const DeepseekSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateDeepseek(node: unknown): FlowNodeIssue[] {
    const result = DeepseekSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('Deepseek', 'DeepSeek'))
    }
    return issues
}
