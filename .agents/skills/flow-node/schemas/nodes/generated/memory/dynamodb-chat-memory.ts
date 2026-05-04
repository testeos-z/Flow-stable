/**
 * dynamodb-chat-memory.ts — Schema for DynamoDB Chat Memory
 *
 * Auto-generated from node catalogue.
 * Category: Memory
 * Provider: DynamoDB
 * Notes: Si estás en AWS
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const DynamoDBChatMemorySchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateDynamoDBChatMemory(node: unknown): FlowNodeIssue[] {
    const result = DynamoDBChatMemorySchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('DynamoDBChatMemory', 'DynamoDB'))
    }
    return issues
}
