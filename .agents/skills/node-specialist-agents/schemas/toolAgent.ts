/**
 * Tool Agent Node Schema
 *
 * THE MOST CRITICAL NODE — orchestrates all other nodes
 */

import { z } from 'zod'
import {
    PositionSchema,
    InputParamSchema,
    InputAnchorSchema,
    OutputAnchorSchema,
    TemplateSyntaxSchema
} from '../../../schemas/shared-node-fields'

export const ToolAgentInputSchema = z.object({
    systemMessage: z.string().optional(),
    model: TemplateSyntaxSchema,
    tools: z.array(TemplateSyntaxSchema).min(1, 'Tool Agent requires at least one tool'),
    memory: z.string().optional(),
    maxIterations: z.number().positive().optional().default(5),
    verbose: z.boolean().optional().default(false)
})

export const ToolAgentNodeSchema = z.object({
    id: z.string(),
    position: PositionSchema,
    positionAbsolute: PositionSchema,
    type: z.literal('customNode'),
    width: z.number().default(300),
    height: z.number().default(520),
    selected: z.boolean().default(false),
    dragging: z.boolean().default(false),
    z: z.number().default(0),
    data: z.object({
        id: z.string(),
        label: z.literal('Tool Agent'),
        name: z.literal('toolAgent'),
        version: z.literal(1),
        type: z.literal('Agent'),
        baseClasses: z.array(z.string()).default(['AgentExecutor', 'BaseChain', 'Runnable']),
        category: z.literal('Agents'),
        description: z.string().default('Agent that uses tools to answer questions'),
        filePath: z.string(),
        icon: z.string().default('/agent.svg'),
        credential: z.literal(''), // No credential needed for agent itself
        inputs: ToolAgentInputSchema,
        inputParams: z.array(InputParamSchema).min(1),
        inputAnchors: z.array(InputAnchorSchema),
        outputAnchors: z.array(OutputAnchorSchema),
        outputs: z.object({}).default({})
    })
})

export type ToolAgentNode = z.infer<typeof ToolAgentNodeSchema>

export function validateToolAgentNode(node: unknown): {
    valid: boolean
    errors: string[]
    data?: ToolAgentNode
} {
    const result = ToolAgentNodeSchema.safeParse(node)

    if (result.success) {
        return { valid: true, errors: [], data: result.data }
    }

    return {
        valid: false,
        errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
    }
}
