/**
 * vectara.ts — Schema for Vectara
 *
 * Auto-generated from node catalogue.
 * Category: Vector Stores
 * Provider: Cloud (managed)
 * Notes: Search-as-a-service. Sin operar
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const VectaraSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateVectara(node: unknown): FlowNodeIssue[] {
    const result = VectaraSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('Vectara', 'Cloud (managed)'))
    }
    return issues
}
