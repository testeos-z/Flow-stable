/**
 * upstash-vector.ts — Schema for Upstash Vector
 *
 * Auto-generated from node catalogue.
 * Category: Vector Stores
 * Provider: Cloud (serverless)
 * Notes: Redis serverless. Sin infra
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const UpstashVectorSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateUpstashVector(node: unknown): FlowNodeIssue[] {
    const result = UpstashVectorSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('UpstashVector', 'Cloud (serverless)'))
    }
    return issues
}
