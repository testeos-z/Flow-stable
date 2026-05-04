/**
 * agent-memory-postgres.ts — Schema for Agent Memory (Postgres)
 *
 * Auto-generated from node catalogue.
 * Category: Memory
 * Provider: Postgres
 * Notes: Sequential Agents con Postgres. Escalable
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const AgentMemoryPostgresSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateAgentMemoryPostgres(node: unknown): FlowNodeIssue[] {
    const result = AgentMemoryPostgresSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('AgentMemoryPostgres', 'Postgres'))
    }
    return issues
}
