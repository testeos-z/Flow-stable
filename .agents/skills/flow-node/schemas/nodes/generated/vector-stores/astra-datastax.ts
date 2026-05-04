/**
 * astra-datastax.ts — Schema for Astra (DataStax)
 *
 * Auto-generated from node catalogue.
 * Category: Vector Stores
 * Provider: Cloud
 * Notes: Cassandra-based. Serverless
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const AstraDataStaxSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateAstraDataStax(node: unknown): FlowNodeIssue[] {
    const result = AstraDataStaxSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('AstraDataStax', 'Cloud'))
    }
    return issues
}
