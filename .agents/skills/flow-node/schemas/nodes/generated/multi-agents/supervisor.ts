/**
 * supervisor.ts — Schema for Supervisor
 *
 * Auto-generated from node catalogue.
 * Category: Multi Agents
 * Provider: Agente que orquesta workers. Define tasks, asigna
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const SupervisorSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateSupervisor(node: unknown): FlowNodeIssue[] {
    const result = SupervisorSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('Supervisor', 'Agente que orquesta workers. Define tasks, asigna'))
    }
    return issues
}
