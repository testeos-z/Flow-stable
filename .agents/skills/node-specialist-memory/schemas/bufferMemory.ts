/**
 * Buffer Memory Node Schema
 */

import { z } from 'zod'
import { PositionSchema, InputParamSchema, InputAnchorSchema, OutputAnchorSchema } from '../../../schemas/shared-node-fields'

export const BufferMemoryInputSchema = z.object({
    sessionId: z.string().optional(),
    memoryKey: z.string().optional().default('chat_history'),
    inputKey: z.string().optional().default('input'),
    outputKey: z.string().optional().default('output')
})

export const BufferMemoryNodeSchema = z.object({
    id: z.string(),
    position: PositionSchema,
    positionAbsolute: PositionSchema,
    type: z.literal('customNode'),
    width: z.number().default(300),
    height: z.number().default(360),
    selected: z.boolean().default(false),
    dragging: z.boolean().default(false),
    z: z.number().default(0),
    data: z.object({
        id: z.string(),
        label: z.literal('Buffer Memory'),
        name: z.literal('bufferMemory'),
        version: z.literal(1),
        type: z.literal('BufferMemory'),
        baseClasses: z.array(z.string()).default(['BufferMemory', 'BaseChatMemory', 'BaseMemory']),
        category: z.literal('Memory'),
        description: z.string().default('Summarizes the conversation and stores the current summary in memory'),
        filePath: z.string(),
        icon: z.string().default('/memory.svg'),
        credential: z.literal(''),
        inputs: BufferMemoryInputSchema,
        inputParams: z.array(InputParamSchema).min(1),
        inputAnchors: z.array(InputAnchorSchema),
        outputAnchors: z.array(OutputAnchorSchema),
        outputs: z.object({}).default({})
    })
})

export type BufferMemoryNode = z.infer<typeof BufferMemoryNodeSchema>

export function validateBufferMemoryNode(node: unknown): {
    valid: boolean
    errors: string[]
    data?: BufferMemoryNode
} {
    const result = BufferMemoryNodeSchema.safeParse(node)

    if (result.success) {
        return { valid: true, errors: [], data: result.data }
    }

    return {
        valid: false,
        errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
    }
}
