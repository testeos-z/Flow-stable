/**
 * Flowise Testing Module
 *
 * Provides smoke tests and integration tests for chatflows.
 * Used by the test_chatflow MCP tool.
 */

import type { FlowiseApiClient } from './flowise-api.js'

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

export interface TestChatflowResult {
    flowId: string
    smokeTest: SmokeTestResult
    integrationTest?: IntegrationTestResult
    overall: boolean
}

/**
 * Run a prediction on a chatflow
 */
async function runPrediction(
    api: FlowiseApiClient,
    flowId: string,
    question: string,
    timeout: number = 30000
): Promise<{ success: boolean; response?: unknown; error?: string }> {
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await api.request('POST', `/prediction/${flowId}`, {
            question,
            history: []
        })

        clearTimeout(timeoutId)

        // Check for execution errors in response
        const data = response as any
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

/**
 * Run smoke test on a chatflow
 */
export async function runSmokeTest(api: FlowiseApiClient, flowId: string): Promise<SmokeTestResult> {
    const startTime = Date.now()

    try {
        const prediction = await runPrediction(api, flowId, 'Hello, are you working?')
        const durationMs = Date.now() - startTime

        if (!prediction.success) {
            return {
                passed: false,
                error: prediction.error,
                durationMs
            }
        }

        const data = prediction.response as any
        return {
            passed: true,
            response: data.text || JSON.stringify(data),
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

/**
 * Run integration test on a chatflow
 */
export async function runIntegrationTest(api: FlowiseApiClient, flowId: string, flowHasTools: boolean): Promise<IntegrationTestResult> {
    if (!flowHasTools) {
        return {
            passed: true,
            toolCalls: [],
            durationMs: 0
        }
    }

    const startTime = Date.now()

    try {
        const prediction = await runPrediction(api, flowId, 'Search for information and tell me what you find.', 60000)

        const durationMs = Date.now() - startTime

        if (!prediction.success) {
            return {
                passed: false,
                error: prediction.error,
                durationMs
            }
        }

        const data = prediction.response as any
        const hasToolResults = data.sourceDocuments && data.sourceDocuments.length > 0

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

/**
 * Check if a chatflow has tool nodes
 */
export function flowHasTools(flowData: any): boolean {
    if (!flowData || !flowData.nodes) return false

    return flowData.nodes.some(
        (node: any) => node.data?.name?.includes('Tool') || node.data?.category === 'Tools' || node.data?.type?.includes('Tool')
    )
}

/**
 * Full test suite for a chatflow
 */
export async function testChatflow(api: FlowiseApiClient, flowId: string): Promise<TestChatflowResult> {
    // Get chatflow data first
    const chatflow = (await api.request('GET', `/chatflows/${flowId}`)) as any
    const flowData = typeof chatflow.flowData === 'string' ? JSON.parse(chatflow.flowData) : chatflow.flowData

    const hasTools = flowHasTools(flowData)

    // Run smoke test
    const smokeTest = await runSmokeTest(api, flowId)

    // Run integration test only if smoke test passes and flow has tools
    let integrationTest: IntegrationTestResult | undefined
    if (smokeTest.passed && hasTools) {
        integrationTest = await runIntegrationTest(api, flowId, hasTools)
    }

    const overall = smokeTest.passed && (!integrationTest || integrationTest.passed)

    return {
        flowId,
        smokeTest,
        integrationTest,
        overall
    }
}
