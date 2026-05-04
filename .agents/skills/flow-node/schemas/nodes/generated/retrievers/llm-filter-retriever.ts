/**
 * llm-filter-retriever.ts — Schema for LLM Filter Retriever
 *
 * Auto-generated from node catalogue.
 * Category: Retrievers
 * Provider: Usa LLM para filtrar resultados
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const LLMFilterRetrieverSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateLLMFilterRetriever(node: unknown): FlowNodeIssue[] {
    const result = LLMFilterRetrieverSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('LLMFilterRetriever', 'Usa LLM para filtrar resultados'))
    }
    return issues
}
