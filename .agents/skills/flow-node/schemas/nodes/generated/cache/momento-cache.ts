/**
 * momento-cache.ts — Schema for Momento Cache
 *
 * Auto-generated from node catalogue.
 * Category: Cache
 * Provider: Cache serverless. Sin infra
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const MomentoCacheSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateMomentoCache(node: unknown): FlowNodeIssue[] {
    const result = MomentoCacheSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('MomentoCache', 'Cache serverless. Sin infra'))
    }
    return issues
}
