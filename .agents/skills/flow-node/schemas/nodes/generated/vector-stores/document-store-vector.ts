/**
 * document-store-vector.ts — Schema for Document Store (Vector)
 *
 * Auto-generated from node catalogue.
 * Category: Vector Stores
 * Provider: Flowise DB
 * Notes: Documentos upserteados en Flowise
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const DocumentStoreVectorSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateDocumentStoreVector(node: unknown): FlowNodeIssue[] {
    const result = DocumentStoreVectorSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('DocumentStoreVector', 'Flowise DB'))
    }
    return issues
}
