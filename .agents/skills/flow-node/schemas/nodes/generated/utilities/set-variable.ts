/**
 * set-variable.ts — Schema for Set Variable
 *
 * Auto-generated from node catalogue.
 * Category: Utilities
 * Provider: Persiste valores en variables globales
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const SetVariableSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateSetVariable(node: unknown): FlowNodeIssue[] {
    const result = SetVariableSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('SetVariable', 'Persiste valores en variables globales'))
    }
    return issues
}
