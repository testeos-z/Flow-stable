/**
 * token-text-splitter.ts — Schema for Token Text Splitter
 *
 * Auto-generated from node catalogue.
 * Category: Text Splitters
 * Provider: Divide por tokens. Predecible para LLM context
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const TokenTextSplitterSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateTokenTextSplitter(node: unknown): FlowNodeIssue[] {
    const result = TokenTextSplitterSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('TokenTextSplitter', 'Divide por tokens. Predecible para LLM context'))
    }
    return issues
}
