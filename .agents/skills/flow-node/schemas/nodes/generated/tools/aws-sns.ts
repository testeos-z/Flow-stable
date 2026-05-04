/**
 * aws-sns.ts — Schema for AWS SNS
 *
 * Auto-generated from node catalogue.
 * Category: Tools
 * Provider: Notificaciones SNS
 * Notes: ✅ awsApi
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const AWSSNSSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateAWSSNS(node: unknown): FlowNodeIssue[] {
    const result = AWSSNSSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('AWSSNS', 'Notificaciones SNS'))
    }
    return issues
}
