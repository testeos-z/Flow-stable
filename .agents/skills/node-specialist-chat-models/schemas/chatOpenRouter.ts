/**
 * ChatOpenRouter Node Schema
 *
 * Golden template extracted from Flowise UI.
 * This is the EXACT structure Flowise generates when dragging chatOpenRouter to canvas.
 */

import { z } from 'zod'
import {
    PositionSchema,
    InputParamSchema,
    InputAnchorSchema,
    OutputAnchorSchema,
    CredentialSchema
} from '../../../schemas/shared-node-fields'

// ============================================================================
// Inputs (dynamic values)
// ============================================================================

export const ChatOpenRouterInputSchema = z.object({
    modelName: z.string().min(1),
    temperature: z.number().min(0).max(2).optional().default(0.7),
    maxTokens: z.number().positive().optional(),
    topP: z.number().min(0).max(1).optional().default(1),
    frequencyPenalty: z.number().min(-2).max(2).optional().default(0),
    presencePenalty: z.number().min(-2).max(2).optional().default(0),
    timeout: z.number().positive().optional(),
    basePath: z.string().optional(),
    baseOptions: z.any().optional(),
    streaming: z.boolean().optional().default(true),
    cache: z.boolean().optional().default(false)
})

export type ChatOpenRouterInputs = z.infer<typeof ChatOpenRouterInputSchema>

// ============================================================================
// Complete Node Schema
// ============================================================================

export const ChatOpenRouterNodeSchema = z.object({
    id: z.string(),
    position: PositionSchema,
    positionAbsolute: PositionSchema,
    type: z.literal('customNode'),
    width: z.number().default(300),
    height: z.number().default(640),
    selected: z.boolean().default(false),
    dragging: z.boolean().default(false),
    z: z.number().default(0),
    data: z.object({
        id: z.string(),
        label: z.literal('OpenRouter'),
        name: z.literal('chatOpenRouter'),
        version: z.literal(1),
        type: z.literal('ChatOpenRouter'),
        baseClasses: z.array(z.string()).default(['ChatOpenAI', 'BaseChatModel', 'BaseLanguageModel', 'Runnable']),
        category: z.literal('Chat Models'),
        description: z.string().default('Wrapper around OpenAI Large Language Models with OpenRouter'),
        filePath: z
            .string()
            .default(
                '/usr/src/flowise/packages/server/node_modules/flowise-components/dist/nodes/chatmodels/ChatOpenRouter/ChatOpenRouter.js'
            ),
        icon: z.string().default('/OpenRouter.svg'),
        credential: CredentialSchema,
        inputs: ChatOpenRouterInputSchema,
        inputParams: z.array(InputParamSchema).min(1),
        inputAnchors: z.array(InputAnchorSchema),
        outputAnchors: z.array(OutputAnchorSchema),
        outputs: z.object({}).default({})
    })
})

export type ChatOpenRouterNode = z.infer<typeof ChatOpenRouterNodeSchema>

// ============================================================================
// Validation helper
// ============================================================================

export function validateChatOpenRouterNode(node: unknown): {
    valid: boolean
    errors: string[]
    data?: ChatOpenRouterNode
} {
    const result = ChatOpenRouterNodeSchema.safeParse(node)

    if (result.success) {
        return { valid: true, errors: [], data: result.data }
    }

    return {
        valid: false,
        errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
    }
}
