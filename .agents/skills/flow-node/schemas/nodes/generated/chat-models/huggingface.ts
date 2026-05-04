/**
 * huggingface.ts — Schema for HuggingFace
 *
 * Auto-generated from node catalogue.
 * Category: Chat Models
 * Provider: HuggingFace
 * Notes: Cualquier modelo de HF (con provider o endpoint propio)
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const HuggingFaceSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateHuggingFace(node: unknown): FlowNodeIssue[] {
    const result = HuggingFaceSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('HuggingFace', 'HuggingFace'))
    }
    return issues
}
