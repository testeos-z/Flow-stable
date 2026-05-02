/**
 * Shared Zod schemas for Flowise node validation
 * These are the building blocks used by all node specialists
 */

import { z } from 'zod'

// ============================================================================
// Canvas / Position schemas
// ============================================================================

export const PositionSchema = z.object({
    x: z.number(),
    y: z.number()
})

export type Position = z.infer<typeof PositionSchema>

// ============================================================================
// Node field schemas
// ============================================================================

export const InputParamSchema = z.object({
    label: z.string(),
    name: z.string(),
    type: z.string(), // 'asyncOptions' | 'options' | 'string' | 'number' | 'boolean' | 'json' | 'code' | etc.
    id: z.string(),
    description: z.string().optional(),
    placeholder: z.string().optional(),
    default: z.any().optional(),
    options: z
        .array(
            z.object({
                label: z.string(),
                name: z.string()
            })
        )
        .optional(),
    optional: z.boolean().optional(),
    additionalParams: z.boolean().optional(),
    loadMethod: z.string().optional(),
    fileType: z.string().optional()
})

export type InputParam = z.infer<typeof InputParamSchema>

export const InputAnchorSchema = z.object({
    label: z.string(),
    name: z.string(),
    type: z.string(), // 'ChatOpenAI' | 'Embeddings' | 'VectorStore' | etc.
    id: z.string(),
    description: z.string().optional()
})

export type InputAnchor = z.infer<typeof InputAnchorSchema>

export const OutputAnchorSchema = z.object({
    label: z.string(),
    name: z.string(),
    type: z.string(),
    id: z.string(),
    description: z.string().optional(),
    baseClasses: z.array(z.string()).optional()
})

export type OutputAnchor = z.infer<typeof OutputAnchorSchema>

// ============================================================================
// Handle bounds (canvas rendering)
// ============================================================================

export const HandleBoundsSchema = z
    .object({
        source: z.array(z.any()),
        target: z.array(z.any())
    })
    .optional()

export type HandleBounds = z.infer<typeof HandleBoundsSchema>

// ============================================================================
// Template syntax validator
// ============================================================================

/**
 * Validates Flowise template syntax: {{nodeId.data.instance}}
 * Used in node inputs that reference other nodes
 */
export const TemplateSyntaxSchema = z
    .string()
    .regex(/^\{\{[a-zA-Z0-9_]+\.data\.instance\}\}$/, 'Must use Flowise template syntax: {{nodeId.data.instance}}')

export type TemplateSyntax = z.infer<typeof TemplateSyntaxSchema>

/**
 * More lenient template that allows empty strings or template syntax
 */
export const TemplateOrEmptySchema = z.union([z.literal(''), TemplateSyntaxSchema])

export type TemplateOrEmpty = z.infer<typeof TemplateOrEmptySchema>

// ============================================================================
// Credential validator
// ============================================================================

/**
 * Validates that credential is either a valid UUID or empty string
 * Rejects credential type names like "openRouterApi"
 */
export const CredentialSchema = z.union([z.string().uuid(), z.literal('')]).refine(
    (val) => {
        if (val === '') return true
        // Additional check: ensure it's not a camelCase type name
        return !/^[a-z]+[A-Z]/.test(val)
    },
    {
        message:
            "credential must be a UUID, not a credential type name (e.g., 'openRouterApi'). Use the credential registry to get the UUID."
    }
)

export type Credential = z.infer<typeof CredentialSchema>
