/**
 * agent.ts — Schema for Agent
 *
 * Auto-generated from node catalogue.
 * Category: Sequential Agents
 * Provider: Agente con tools. System prompt, tools, approvals
 * Notes: Cuando necesitás un agente autónomo con herramientas
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const AgentSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateAgent(node: unknown): FlowNodeIssue[] {
    const result = AgentSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('Agent', 'Agente con tools. System prompt, tools, approvals'))
    }
    return issues
}
