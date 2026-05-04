/**
 * custom-tool.ts — Schema for Custom Tool
 *
 * Auto-generated from node catalogue.
 * Category: Tools
 * Provider: Tool creada por el usuario en Flowise
 * Notes: ❌
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const CustomToolSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateCustomTool(node: unknown): FlowNodeIssue[] {
    const result = CustomToolSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('CustomTool', 'Tool creada por el usuario en Flowise'))
    }
    return issues
}
