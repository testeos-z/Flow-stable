/**
 * Retriever Tool Node Schema
 */

import { z } from 'zod'
import {
    PositionSchema,
    InputParamSchema,
    InputAnchorSchema,
    OutputAnchorSchema,
    TemplateSyntaxSchema
} from '../../../schemas/shared-node-fields'

export const RetrieverToolInputSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    retriever: TemplateSyntaxSchema
})

export const RetrieverToolNodeSchema = z.object({
    id: z.string(),
    position: PositionSchema,
    positionAbsolute: PositionSchema,
    type: z.literal('customNode'),
    width: z.number().default(300),
    height: z.number().default(420),
    selected: z.boolean().default(false),
    dragging: z.boolean().default(false),
    z: z.number().default(0),
    data: z.object({
        id: z.string(),
        label: z.literal('Retriever Tool'),
        name: z.literal('retrieverTool'),
        version: z.literal(1),
        type: z.literal('RetrieverTool'),
        baseClasses: z.array(z.string()).default(['RetrieverTool', 'DynamicTool', 'Tool']),
        category: z.literal('Tools'),
        description: z.string().default('Use a retriever as a tool'),
        filePath: z.string(),
        icon: z.string().default('/retriever.svg'),
        credential: z.literal(''),
        inputs: RetrieverToolInputSchema,
        inputParams: z.array(InputParamSchema).min(1),
        inputAnchors: z.array(InputAnchorSchema),
        outputAnchors: z.array(OutputAnchorSchema),
        outputs: z.object({}).default({})
    })
})

export type RetrieverToolNode = z.infer<typeof RetrieverToolNodeSchema>

export function validateRetrieverToolNode(node: unknown): {
    valid: boolean
    errors: string[]
    data?: RetrieverToolNode
} {
    const result = RetrieverToolNodeSchema.safeParse(node)

    if (result.success) {
        return { valid: true, errors: [], data: result.data }
    }

    return {
        valid: false,
        errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
    }
}
