/**
 * worker.ts — Schema for Worker
 *
 * Auto-generated from node catalogue.
 * Category: Multi Agents
 * Provider: Agente que ejecuta tasks asignadas por Supervisor
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const WorkerSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateWorker(node: unknown): FlowNodeIssue[] {
    const result = WorkerSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('Worker', 'Agente que ejecuta tasks asignadas por Supervisor'))
    }
    return issues
}
