/**
 * condition-agent.ts — Schema for Condition Agent
 *
 * Auto-generated from node catalogue.
 * Category: Sequential Agents
 * Provider: Usa un LLM para decidir ruta
 * Notes: Cuando la condición es difusa o semántica
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const ConditionAgentSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateConditionAgent(node: unknown): FlowNodeIssue[] {
    const result = ConditionAgentSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('ConditionAgent', 'Usa un LLM para decidir ruta'))
    }
    return issues
}
