/**
 * code-interpreter-e2b.ts — Schema for Code Interpreter E2B
 *
 * Auto-generated from node catalogue.
 * Category: Tools
 * Provider: Ejecuta Python en sandbox
 * Notes: ✅ E2BApi (opcional)
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const CodeInterpreterE2BSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateCodeInterpreterE2B(node: unknown): FlowNodeIssue[] {
    const result = CodeInterpreterE2BSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('CodeInterpreterE2B', 'Ejecuta Python en sandbox'))
    }
    return issues
}
