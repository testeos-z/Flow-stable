/**
 * qdrant.ts — Schema for Qdrant
 *
 * Auto-generated from node catalogue.
 * Category: Vector Stores
 * Provider: Cloud/Self-hosted
 * Notes: Rápido. Filtros avanzados
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const QdrantSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateQdrant(node: unknown): FlowNodeIssue[] {
    const result = QdrantSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('Qdrant', 'Cloud/Self-hosted'))
    }
    return issues
}
