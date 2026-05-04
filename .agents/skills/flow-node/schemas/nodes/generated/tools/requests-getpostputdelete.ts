/**
 * requests-getpostputdelete.ts — Schema for Requests (GET/POST/PUT/DELETE)
 *
 * Auto-generated from node catalogue.
 * Category: Tools
 * Provider: HTTP requests
 * Notes: ❌ (opcional: auth)
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const RequestsGETPOSTPUTDELETESchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateRequestsGETPOSTPUTDELETE(node: unknown): FlowNodeIssue[] {
    const result = RequestsGETPOSTPUTDELETESchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('RequestsGETPOSTPUTDELETE', 'HTTP requests'))
    }
    return issues
}
