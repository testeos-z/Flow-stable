/**
 * Flowise API client for making HTTP requests to the Flowise API
 */

export interface FlowiseApiConfig {
    baseUrl: string
    apiKey: string
}

export interface FlowiseApiClient {
    request: <T = unknown>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, body?: unknown) => Promise<T>
}

/**
 * Creates a Flowise API client with the given configuration
 */
export function createFlowiseApiClient(config: FlowiseApiConfig): FlowiseApiClient {
    const { baseUrl, apiKey } = config

    return {
        async request<T = unknown>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, body?: unknown): Promise<T> {
            const url = `${baseUrl}/api/v1${endpoint}`
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            }

            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`
            }

            const response = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Flowise API error (${response.status}): ${errorText}`)
            }

            return response.json() as Promise<T>
        }
    }
}

/**
 * Default configuration from environment variables
 */
export function getDefaultConfig(): FlowiseApiConfig {
    return {
        baseUrl: process.env.FLOWISE_BASE_URL || 'http://localhost:3000',
        apiKey: process.env.FLOWISE_API_KEY || ''
    }
}
