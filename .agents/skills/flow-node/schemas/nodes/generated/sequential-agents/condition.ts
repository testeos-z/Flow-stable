/**
 * condition.ts — Schema for Condition
 *
 * Auto-generated from node catalogue.
 * Category: Sequential Agents
 * Provider: If/Else sobre variables del state
 * Notes: Para bifurcar el flujo según condiciones
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const ConditionSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateCondition(node: unknown): FlowNodeIssue[] {
    const result = ConditionSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('Condition', 'If/Else sobre variables del state'))
    }
    return issues
}
