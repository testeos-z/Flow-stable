/**
 * state.ts — Schema for State
 *
 * Auto-generated from node catalogue.
 * Category: Sequential Agents
 * Provider: Define schema de estado custom
 * Notes: Cuando necesitás estado compartido entre nodos
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const StateSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateState(node: unknown): FlowNodeIssue[] {
    const result = StateSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('State', 'Define schema de estado custom'))
    }
    return issues
}
