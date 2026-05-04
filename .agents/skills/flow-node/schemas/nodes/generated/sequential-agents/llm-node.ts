/**
 * llm-node.ts — Schema for LLM Node
 *
 * Auto-generated from node catalogue.
 * Category: Sequential Agents
 * Provider: LLM sin tools. Structured output
 * Notes: Cuando solo necesitás generar texto sin herramientas
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const LLMNodeSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateLLMNode(node: unknown): FlowNodeIssue[] {
    const result = LLMNodeSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('LLMNode', 'LLM sin tools. Structured output'))
    }
    return issues
}
