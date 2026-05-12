import axios, { AxiosInstance, AxiosError } from 'axios'
import logger from '../utils/logger'
import { EngramMemory, EngramSession, EngramSearchResult, EngramContextResult, EngramStats, EngramConflict } from '../types/engram'

class EngramClient {
    private client: AxiosInstance
    private baseUrl: string

    constructor() {
        this.baseUrl = process.env.ENGRAM_URL || 'http://localhost:7437'
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        })

        // Request interceptor for auth token if configured
        this.client.interceptors.request.use((config) => {
            const token = process.env.ENGRAM_API_TOKEN
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
            return config
        })

        // Response interceptor for logging
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                logger.error('Engram request failed', {
                    url: error.config?.url,
                    method: error.config?.method,
                    status: error.response?.status,
                    data: error.response?.data
                })
                return Promise.reject(error)
            }
        )
    }

    // Memories
    async saveMemory(memory: EngramMemory): Promise<EngramMemory> {
        const { data } = await this.client.post<EngramMemory>('/memories', memory)
        return data
    }

    async getMemory(id: number): Promise<EngramMemory | null> {
        try {
            const { data } = await this.client.get<EngramMemory>(`/memories/${id}`)
            return data
        } catch (error) {
            if ((error as AxiosError).response?.status === 404) return null
            throw error
        }
    }

    async updateMemory(id: number, memory: Partial<EngramMemory>): Promise<EngramMemory> {
        const { data } = await this.client.put<EngramMemory>(`/memories/${id}`, memory)
        return data
    }

    async deleteMemory(id: number): Promise<void> {
        await this.client.delete(`/memories/${id}`)
    }

    // Search
    async searchMemories(query: string, project?: string, limit?: number): Promise<EngramSearchResult> {
        const { data } = await this.client.get<EngramSearchResult>('/memories', {
            params: { q: query, project, limit }
        })
        return data
    }

    // Context
    async getContext(project?: string, limit?: number): Promise<EngramContextResult> {
        const { data } = await this.client.get<EngramContextResult>('/context', {
            params: { project, limit }
        })
        return data
    }

    // Timeline
    async getTimeline(observationId: number): Promise<EngramMemory[]> {
        const { data } = await this.client.get<EngramMemory[]>(`/timeline/${observationId}`)
        return data
    }

    // Sessions
    async startSession(session: EngramSession): Promise<EngramSession> {
        const { data } = await this.client.post<EngramSession>('/sessions/start', session)
        return data
    }

    async endSession(sessionId: string): Promise<EngramSession> {
        const { data } = await this.client.post<EngramSession>('/sessions/end', { id: sessionId })
        return data
    }

    async saveSessionSummary(sessionId: string, summary: string): Promise<void> {
        await this.client.post('/sessions/summary', { id: sessionId, summary })
    }

    // Stats
    async getStats(project?: string): Promise<EngramStats> {
        const { data } = await this.client.get<EngramStats>('/stats', {
            params: { project }
        })
        return data
    }

    // Conflicts
    async listConflicts(project?: string, status?: string): Promise<EngramConflict[]> {
        const { data } = await this.client.get<EngramConflict[]>('/conflicts', {
            params: { project, status }
        })
        return data
    }

    async scanConflicts(
        project: string,
        options?: { dryRun?: boolean; semantic?: boolean; maxInsert?: number }
    ): Promise<EngramConflict[]> {
        const { data } = await this.client.post<EngramConflict[]>('/conflicts/scan', {
            project,
            ...options
        })
        return data
    }

    // Cloud sync
    async syncToCloud(project: string): Promise<{ synced: number }> {
        const { data } = await this.client.post<{ synced: number }>('/sync/cloud', { project })
        return data
    }

    async getCloudStatus(project: string): Promise<{ status: string; lastSync?: string }> {
        const { data } = await this.client.get<{ status: string; lastSync?: string }>('/cloud/status', {
            params: { project }
        })
        return data
    }
}

export default new EngramClient()
