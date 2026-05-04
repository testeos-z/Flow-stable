/**
 * get-variable.ts — Schema for Get Variable
 *
 * Auto-generated from node catalogue.
 * Category: Utilities
 * Provider: Lee variables globales
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const GetVariableSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateGetVariable(node: unknown): FlowNodeIssue[] {
    const result = GetVariableSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('GetVariable', 'Lee variables globales'))
    }
    return issues
}
