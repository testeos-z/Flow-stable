/**
 * Flowise API Integration Module
 *
 * Connects the testing pipeline to Flowise server for:
 * - Creating temporary flows
 * - Running predictions (smoke tests)
 * - Deleting temporary flows
 */

import { IReactFlowObject } from '../schemas/flow-data'

const FLOWISE_BASE_URL = process.env.FLOWISE_API_URL || 'http://localhost:3000'

interface FlowiseChatflow {
    id: string
    name: string
    flowData: string // JSON string
    deployed: boolean
    isPublic: boolean
    apikeyid: string
    chatbotConfig: string
    createdDate: string
    updatedDate: string
    category: string | null
    description: string | null
}

interface PredictionRequest {
    question: string
    history: Array<{ message: string; type: 'apiMessage' | 'userMessage' }>
    overrideConfig?: Record<string, any>
}

interface PredictionResponse {
    text?: string
    json?: any
    error?: string
    sourceDocuments?: any[]
}

// ============================================================================
// Chatflow CRUD Operations
// ============================================================================

export async function createTempFlow(flowData: IReactFlowObject, name: string = `Test Flow ${Date.now()}`): Promise<string> {
    const response = await fetch(`${FLOWISE_BASE_URL}/api/v1/chatflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name,
            flowData: JSON.stringify(flowData),
            deployed: false,
            isPublic: false
        })
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to create temp flow: ${error}`)
    }

    const result = await response.json()
    return result.id
}

export async function deleteTempFlow(flowId: string): Promise<void> {
    const response = await fetch(`${FLOWISE_BASE_URL}/api/v1/chatflow/${flowId}`, {
        method: 'DELETE'
    })

    if (!response.ok) {
        console.warn(`Failed to delete temp flow ${flowId}: ${await response.text()}`)
    }
}

export async function getChatflow(flowId: string): Promise<FlowiseChatflow | null> {
    try {
        const response = await fetch(`${FLOWISE_BASE_URL}/api/v1/chatflow/${flowId}`)
        if (!response.ok) return null
        return await response.json()
    } catch {
        return null
    }
}

// ============================================================================
// Prediction / Smoke Test
// ============================================================================

export async function runPrediction(
    flowId: string,
    question: string,
    options: { timeout?: number } = {}
): Promise<{ success: boolean; response?: PredictionResponse; error?: string }> {
    const timeout = options.timeout || 30000

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(`${FLOWISE_BASE_URL}/api/v1/prediction/${flowId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question,
                history: []
            } as PredictionRequest),
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            const errorText = await response.text()
            return {
                success: false,
                error: `HTTP ${response.status}: ${errorText}`
            }
        }

        const data = await response.json()

        // Check for execution errors in response
        if (data.error || (data.text && data.text.includes('Error:'))) {
            return {
                success: false,
                error: data.error || data.text,
                response: data
            }
        }

        return {
            success: true,
            response: data
        }
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return {
                success: false,
                error: `Prediction timed out after ${timeout}ms`
            }
        }

        return {
            success: false,
            error: error.message
        }
    }
}

// ============================================================================
// Full Pipeline Integration
// ============================================================================

export interface SmokeTestResult {
    passed: boolean
    error?: string
    response?: string
    durationMs: number
}

export interface IntegrationTestResult {
    passed: boolean
    error?: string
    toolCalls?: string[]
    durationMs: number
}

/**
 * Run smoke test: create flow, ask "Hello", verify response
 */
export async function runSmokeTest(
    flowData: IReactFlowObject,
    options: { cleanup?: boolean } = {}
): Promise<{ flowId: string; result: SmokeTestResult }> {
    const startTime = Date.now()
    let flowId: string

    try {
        // Create temporary flow
        flowId = await createTempFlow(flowData, `Smoke Test ${Date.now()}`)

        // Run prediction
        const prediction = await runPrediction(flowId, 'Hello, are you working?')

        const durationMs = Date.now() - startTime

        if (!prediction.success) {
            return {
                flowId,
                result: {
                    passed: false,
                    error: prediction.error,
                    durationMs
                }
            }
        }

        return {
            flowId,
            result: {
                passed: true,
                response: prediction.response?.text || JSON.stringify(prediction.response),
                durationMs
            }
        }
    } catch (error: any) {
        return {
            flowId: '',
            result: {
                passed: false,
                error: error.message,
                durationMs: Date.now() - startTime
            }
        }
    } finally {
        if (options.cleanup !== false && flowId!) {
            await deleteTempFlow(flowId).catch(() => {})
        }
    }
}

/**
 * Run integration test: force tool invocation
 */
export async function runIntegrationTest(flowId: string, flowHasTools: boolean): Promise<IntegrationTestResult> {
    if (!flowHasTools) {
        return {
            passed: true,
            toolCalls: [],
            durationMs: 0
        }
    }

    const startTime = Date.now()

    try {
        // Ask a question that should trigger tool usage
        const prediction = await runPrediction(flowId, 'Search for information about New York City and tell me what you find.', {
            timeout: 60000
        })

        const durationMs = Date.now() - startTime

        if (!prediction.success) {
            return {
                passed: false,
                error: prediction.error,
                durationMs
            }
        }

        // Check if sourceDocuments exist (indicates tool/retriever was used)
        const hasToolResults = prediction.response?.sourceDocuments && prediction.response.sourceDocuments.length > 0

        return {
            passed: prediction.success,
            toolCalls: hasToolResults ? ['retriever'] : [],
            durationMs
        }
    } catch (error: any) {
        return {
            passed: false,
            error: error.message,
            durationMs: Date.now() - startTime
        }
    }
}
