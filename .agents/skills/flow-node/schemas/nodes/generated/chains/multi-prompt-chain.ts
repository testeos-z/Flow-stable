/**
 * multi-prompt-chain.ts — Schema for Multi Prompt Chain
 *
 * Auto-generated from node catalogue.
 * Category: Chains
 * Provider: Enruta a diferentes prompts según input
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const MultiPromptChainSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateMultiPromptChain(node: unknown): FlowNodeIssue[] {
    const result = MultiPromptChainSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('MultiPromptChain', 'Enruta a diferentes prompts según input'))
    }
    return issues
}
