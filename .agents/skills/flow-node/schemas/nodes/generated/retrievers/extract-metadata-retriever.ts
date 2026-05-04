/**
 * extract-metadata-retriever.ts — Schema for Extract Metadata Retriever
 *
 * Auto-generated from node catalogue.
 * Category: Retrievers
 * Provider: Extrae metadata de las queries
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const ExtractMetadataRetrieverSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateExtractMetadataRetriever(node: unknown): FlowNodeIssue[] {
    const result = ExtractMetadataRetrieverSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('ExtractMetadataRetriever', 'Extrae metadata de las queries'))
    }
    return issues
}
