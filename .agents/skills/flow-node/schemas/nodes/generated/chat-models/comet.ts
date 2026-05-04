/**
 * comet.ts — Schema for Comet
 *
 * Auto-generated from node catalogue.
 * Category: Chat Models
 * Provider: CometAPI
 * Notes: Gateway multi-provider
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const CometSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateComet(node: unknown): FlowNodeIssue[] {
    const result = CometSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('Comet', 'CometAPI'))
    }
    return issues
}
