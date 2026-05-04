/**
 * simplestore.ts — Schema for SimpleStore
 *
 * Auto-generated from node catalogue.
 * Category: Vector Stores
 * Provider: Local
 * Notes: Dev básico
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const SimpleStoreSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateSimpleStore(node: unknown): FlowNodeIssue[] {
    const result = SimpleStoreSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('SimpleStore', 'Local'))
    }
    return issues
}
