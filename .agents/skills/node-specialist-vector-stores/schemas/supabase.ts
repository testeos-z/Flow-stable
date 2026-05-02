/**
 * Supabase Vector Store Node Schema
 *
 * For Supabase pgvector integration
 */

import { z } from 'zod'
import {
    PositionSchema,
    InputParamSchema,
    InputAnchorSchema,
    OutputAnchorSchema,
    CredentialSchema,
    TemplateOrEmptySchema
} from '../../../schemas/shared-node-fields'

export const SupabaseInputSchema = z.object({
    tableName: z.string().min(1),
    queryName: z.string().min(1),
    contentColumnName: z.string().min(1),
    vectorColumnName: z.string().min(1),
    embeddings: TemplateOrEmptySchema,
    recordManager: TemplateOrEmptySchema,
    supabaseMetadataFilter: z.string().optional(),
    supabaseFilter: z.any().optional(),
    topK: z.number().positive().optional().default(4)
})

export const SupabaseNodeSchema = z.object({
    id: z.string(),
    position: PositionSchema,
    positionAbsolute: PositionSchema,
    type: z.literal('customNode'),
    width: z.number().default(300),
    height: z.number().default(580),
    selected: z.boolean().default(false),
    dragging: z.boolean().default(false),
    z: z.number().default(0),
    data: z.object({
        id: z.string(),
        label: z.literal('Supabase'),
        name: z.literal('supabase'),
        version: z.literal(1),
        type: z.literal('Supabase_VectorStore'),
        baseClasses: z.array(z.string()).default(['VectorStore', 'BaseRetriever']),
        category: z.literal('Vector Stores'),
        description: z.string().default('Upsert embedded data and perform similarity search upon query using Supabase with pgvector'),
        filePath: z.string(),
        icon: z.string().default('/supabase.svg'),
        credential: CredentialSchema,
        inputs: SupabaseInputSchema,
        inputParams: z.array(InputParamSchema).min(1),
        inputAnchors: z.array(InputAnchorSchema),
        outputAnchors: z.array(OutputAnchorSchema),
        outputs: z.object({}).default({})
    })
})

export type SupabaseNode = z.infer<typeof SupabaseNodeSchema>

export function validateSupabaseNode(node: unknown): {
    valid: boolean
    errors: string[]
    data?: SupabaseNode
} {
    const result = SupabaseNodeSchema.safeParse(node)

    if (result.success) {
        return { valid: true, errors: [], data: result.data }
    }

    return {
        valid: false,
        errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
    }
}
