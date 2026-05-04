/**
 * tool-node.ts — Schema for Tool Node
 *
 * Auto-generated from node catalogue.
 * Category: Sequential Agents
 * Provider: Ejecuta UN tool específico
 * Notes: Cuando querés ejecutar un tool puntual
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const ToolNodeSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateToolNode(node: unknown): FlowNodeIssue[] {
    const result = ToolNodeSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('ToolNode', 'Ejecuta UN tool específico'))
    }
    return issues
}
