/**
 * azure-rerank.ts — Schema for Azure Rerank
 *
 * Auto-generated from node catalogue.
 * Category: Retrievers
 * Provider: Rerank con Azure AI
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const AzureRerankSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateAzureRerank(node: unknown): FlowNodeIssue[] {
    const result = AzureRerankSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('AzureRerank', 'Rerank con Azure AI'))
    }
    return issues
}
