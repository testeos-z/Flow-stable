/**
 * hyde-retriever.ts — Schema for HyDE Retriever
 *
 * Auto-generated from node catalogue.
 * Category: Retrievers
 * Provider: Genera un doc hipotético y busca similares
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const HyDERetrieverSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateHyDERetriever(node: unknown): FlowNodeIssue[] {
    const result = HyDERetrieverSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('HyDERetriever', 'Genera un doc hipotético y busca similares'))
    }
    return issues
}
