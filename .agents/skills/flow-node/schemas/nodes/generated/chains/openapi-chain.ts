/**
 * openapi-chain.ts — Schema for OpenAPI Chain
 *
 * Auto-generated from node catalogue.
 * Category: Chains
 * Provider: LLM + API completa documentada con OpenAPI
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const OpenAPIChainSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateOpenAPIChain(node: unknown): FlowNodeIssue[] {
    const result = OpenAPIChainSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('OpenAPIChain', 'LLM + API completa documentada con OpenAPI'))
    }
    return issues
}
