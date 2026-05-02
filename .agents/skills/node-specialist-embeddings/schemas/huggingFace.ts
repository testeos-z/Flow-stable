/**
 * HuggingFace Inference Embeddings Node Schema
 */

import { z } from 'zod'
import {
    PositionSchema,
    InputParamSchema,
    InputAnchorSchema,
    OutputAnchorSchema,
    CredentialSchema
} from '../../../schemas/shared-node-fields'

export const HuggingFaceEmbeddingsInputSchema = z.object({
    model: z.string().min(1),
    endpoint: z.string().url().optional(),
    batchSize: z.number().positive().optional().default(512),
    stripNewLines: z.boolean().optional().default(true),
    timeout: z.number().positive().optional()
})

export const HuggingFaceEmbeddingsNodeSchema = z.object({
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
        label: z.literal('HuggingFace Inference Embeddings'),
        name: z.literal('huggingFaceInferenceEmbeddings'),
        version: z.literal(1),
        type: z.literal('HuggingFaceInferenceEmbeddings'),
        baseClasses: z.array(z.string()).default(['HuggingFaceInferenceEmbeddings', 'Embeddings']),
        category: z.literal('Embeddings'),
        description: z.string().default('Generate embeddings via HuggingFace Inference API'),
        filePath: z.string(),
        icon: z.string().default('/huggingface.png'),
        credential: CredentialSchema,
        inputs: HuggingFaceEmbeddingsInputSchema,
        inputParams: z.array(InputParamSchema).min(1),
        inputAnchors: z.array(InputAnchorSchema),
        outputAnchors: z.array(OutputAnchorSchema),
        outputs: z.object({}).default({})
    })
})

export type HuggingFaceEmbeddingsNode = z.infer<typeof HuggingFaceEmbeddingsNodeSchema>

export function validateHuggingFaceEmbeddingsNode(node: unknown): {
    valid: boolean
    errors: string[]
    data?: HuggingFaceEmbeddingsNode
} {
    const result = HuggingFaceEmbeddingsNodeSchema.safeParse(node)

    if (result.success) {
        return { valid: true, errors: [], data: result.data }
    }

    return {
        valid: false,
        errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
    }
}
