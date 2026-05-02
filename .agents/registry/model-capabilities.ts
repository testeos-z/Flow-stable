/**
 * Model Capabilities Registry
 *
 * Single source of truth for which models support what features.
 * This prevents the #1 error we saw: assigning a model that doesn't support
 * tool-calling to a Tool Agent.
 */

export interface ModelCapability {
    id: string // Model ID in provider (e.g., "google/gemma-4-26b-a4b-it:free")
    name: string // Human-readable name
    provider: string // openrouter, anthropic, google, openai, etc.
    toolCalling: boolean // Supports bindTools() / function calling
    streaming: boolean // Supports streaming responses
    free: boolean // Has a free tier available
    maxTokens?: number // Context window size
    recommended: boolean // Team-recommended for production
    notes?: string // Caveats or special instructions
}

export const MODEL_REGISTRY: ModelCapability[] = [
    // OpenRouter Free Tier — Verified Working
    {
        id: 'google/gemma-4-26b-a4b-it:free',
        name: 'Gemma 4 26B A4B IT',
        provider: 'openrouter',
        toolCalling: true,
        streaming: true,
        free: true,
        maxTokens: 32768,
        recommended: true,
        notes: 'Currently the only free model on OpenRouter that correctly implements bindTools() with Flowise'
    },

    // OpenRouter Free Tier — Tool Calling FALSE
    {
        id: 'minimax/minimax-m2.5:free',
        name: 'MiniMax M2.5',
        provider: 'openrouter',
        toolCalling: false,
        streaming: true,
        free: true,
        maxTokens: 8192,
        recommended: false,
        notes: "Does NOT support tool-calling. Will fail with 'bindTools is not a function' in Tool Agent."
    },
    {
        id: 'meta-llama/llama-4-maverick:free',
        name: 'Llama 4 Maverick',
        provider: 'openrouter',
        toolCalling: false,
        streaming: true,
        free: true,
        maxTokens: 32768,
        recommended: false,
        notes: 'Free tier does not support function calling'
    },
    {
        id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',
        name: 'Llama 3.1 Nemotron Ultra',
        provider: 'openrouter',
        toolCalling: false,
        streaming: true,
        free: true,
        maxTokens: 131072,
        recommended: false,
        notes: 'Does not support tool-calling in free tier'
    },

    // Paid / Other Providers
    {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        toolCalling: true,
        streaming: true,
        free: false,
        maxTokens: 200000,
        recommended: true,
        notes: 'Excellent tool-calling reliability'
    },
    {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        toolCalling: true,
        streaming: true,
        free: false,
        maxTokens: 128000,
        recommended: true
    },
    {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'google',
        toolCalling: true,
        streaming: true,
        free: false,
        maxTokens: 2000000,
        recommended: true
    }
]

// ============================================================================
// Helper functions
// ============================================================================

export function getCompatibleModels(requirements: { toolCalling?: boolean; streaming?: boolean; free?: boolean }): ModelCapability[] {
    return MODEL_REGISTRY.filter(
        (m) =>
            (requirements.toolCalling === undefined || m.toolCalling === requirements.toolCalling) &&
            (requirements.streaming === undefined || m.streaming === requirements.streaming) &&
            (requirements.free === undefined || m.free === requirements.free)
    )
}

export function getModelById(id: string): ModelCapability | undefined {
    return MODEL_REGISTRY.find((m) => m.id === id)
}

export function validateModelForRequirements(
    modelId: string,
    requirements: {
        toolCalling?: boolean
        streaming?: boolean
        free?: boolean
    }
): { valid: boolean; errors: string[]; model?: ModelCapability } {
    const model = getModelById(modelId)
    const errors: string[] = []

    if (!model) {
        errors.push(`Model "${modelId}" not found in registry.`)
        return { valid: false, errors }
    }

    if (requirements.toolCalling && !model.toolCalling) {
        errors.push(
            `Model "${model.name}" does not support tool-calling. ` +
                `Compatible alternatives: ${getCompatibleModels({ toolCalling: true, free: model.free })
                    .map((m) => m.id)
                    .join(', ')}`
        )
    }

    if (requirements.streaming && !model.streaming) {
        errors.push(`Model "${model.name}" does not support streaming.`)
    }

    if (requirements.free && !model.free) {
        errors.push(`Model "${model.name}" is not available on the free tier.`)
    }

    return {
        valid: errors.length === 0,
        errors,
        model
    }
}

export function getRecommendedModels(requirements: { toolCalling?: boolean; streaming?: boolean; free?: boolean }): ModelCapability[] {
    return getCompatibleModels(requirements).filter((m) => m.recommended)
}
