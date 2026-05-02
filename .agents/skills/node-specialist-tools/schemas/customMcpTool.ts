/**
 * Custom MCP Tool Node Schema
 */

import { z } from 'zod'
import { PositionSchema, InputParamSchema, InputAnchorSchema, OutputAnchorSchema } from '../../../schemas/shared-node-fields'

export const CustomMcpToolInputSchema = z.object({
    mcpServer: z.string().min(1),
    toolName: z.string().min(1),
    description: z.string().min(1).optional()
})

export const CustomMcpToolNodeSchema = z.object({
    id: z.string(),
    position: PositionSchema,
    positionAbsolute: PositionSchema,
    type: z.literal('customNode'),
    width: z.number().default(300),
    height: z.number().default(380),
    selected: z.boolean().default(false),
    dragging: z.boolean().default(false),
    z: z.number().default(0),
    data: z.object({
        id: z.string(),
        label: z.literal('Custom MCP Tool'),
        name: z.literal('customMcpTool'),
        version: z.literal(1),
        type: z.literal('CustomMcpTool'),
        baseClasses: z.array(z.string()).default(['Tool']),
        category: z.literal('Tools'),
        description: z.string().default('Use a tool from a connected MCP server'),
        filePath: z.string(),
        icon: z.string().default('/mcp.svg'),
        credential: z.literal(''),
        inputs: CustomMcpToolInputSchema,
        inputParams: z.array(InputParamSchema).min(1),
        inputAnchors: z.array(InputAnchorSchema),
        outputAnchors: z.array(OutputAnchorSchema),
        outputs: z.object({}).default({})
    })
})

export type CustomMcpToolNode = z.infer<typeof CustomMcpToolNodeSchema>

export function validateCustomMcpToolNode(node: unknown): {
    valid: boolean
    errors: string[]
    data?: CustomMcpToolNode
} {
    const result = CustomMcpToolNodeSchema.safeParse(node)

    if (result.success) {
        return { valid: true, errors: [], data: result.data }
    }

    return {
        valid: false,
        errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
    }
}
