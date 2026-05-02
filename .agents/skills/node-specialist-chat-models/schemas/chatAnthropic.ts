/**
 * ChatAnthropic Node Schema
 */

import { z } from 'zod'
import {
    PositionSchema,
    InputParamSchema,
    InputAnchorSchema,
    OutputAnchorSchema,
    CredentialSchema
} from '../../../schemas/shared-node-fields'

export const ChatAnthropicInputSchema = z.object({
    modelName: z.string().min(1),
    temperature: z.number().min(0).max(1).optional().default(0.7),
    maxTokens: z.number().positive().optional(),
    topP: z.number().min(0).max(1).optional(),
    topK: z.number().positive().optional(),
    streaming: z.boolean().optional().default(true),
    cache: z.boolean().optional().default(false)
})

export const ChatAnthropicNodeSchema = z.object({
    id: z.string(),
    position: PositionSchema,
    positionAbsolute: PositionSchema,
    type: z.literal('customNode'),
    width: z.number().default(300),
    height: z.number().default(600),
    selected: z.boolean().default(false),
    dragging: z.boolean().default(false),
    z: z.number().default(0),
    data: z.object({
        id: z.string(),
        label: z.literal('ChatAnthropic'),
        name: z.literal('chatAnthropic'),
        version: z.literal(1),
        type: z.literal('ChatAnthropic'),
        baseClasses: z.array(z.string()).default(['ChatAnthropic', 'BaseChatModel', 'BaseLanguageModel', 'Runnable']),
        category: z.literal('Chat Models'),
        description: z.string().default('Chat models from Anthropic'),
        filePath: z.string(),
        icon: z.string().default('/anthropic.svg'),
        credential: CredentialSchema,
        inputs: ChatAnthropicInputSchema,
        inputParams: z.array(InputParamSchema).min(1),
        inputAnchors: z.array(InputAnchorSchema),
        outputAnchors: z.array(OutputAnchorSchema),
        outputs: z.object({}).default({})
    })
})

export type ChatAnthropicNode = z.infer<typeof ChatAnthropicNodeSchema>

export function validateChatAnthropicNode(node: unknown): {
    valid: boolean
    errors: string[]
    data?: ChatAnthropicNode
} {
    const result = ChatAnthropicNodeSchema.safeParse(node)

    if (result.success) {
        return { valid: true, errors: [], data: result.data }
    }

    return {
        valid: false,
        errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
    }
}
