/**
 * start.ts — Schema for Start
 *
 * Auto-generated from node catalogue.
 * Category: Sequential Agents
 * Provider: Punto de entrada. Define modelo + state + memoria
 * Notes: SIEMPRE es el primer nodo
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const StartSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateStart(node: unknown): FlowNodeIssue[] {
    const result = StartSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('Start', 'Punto de entrada. Define modelo + state + memoria'))
    }
    return issues
}
