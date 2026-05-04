/**
 * elasticsearch.ts — Schema for Elasticsearch
 *
 * Auto-generated from node catalogue.
 * Category: Vector Stores
 * Provider: Self-hosted/Cloud
 * Notes: Búsqueda híbrida (keyword + vector)
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const ElasticsearchSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateElasticsearch(node: unknown): FlowNodeIssue[] {
    const result = ElasticsearchSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('Elasticsearch', 'Self-hosted/Cloud'))
    }
    return issues
}
