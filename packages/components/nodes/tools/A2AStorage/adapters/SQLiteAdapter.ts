import { A2AStorageAdapter } from '../../../../src/A2AStorageAdapter'

export class SQLiteAdapter implements A2AStorageAdapter {
    readonly backend = 'sqlite' as const

    constructor(_config: Record<string, unknown>) {}

    async initialize(_config: Record<string, unknown>): Promise<void> {}
    async registerAgent(_card: any): Promise<string> {
        return ''
    }
    async getAgent(_agentId: string): Promise<any> {
        return null
    }
    async findAgents(_filter: any): Promise<any[]> {
        return []
    }
    async updateAgentStatus(_agentId: string, _status: any): Promise<void> {}
    async createTask(_task: any): Promise<string> {
        return ''
    }
    async getTask(_taskId: string): Promise<any> {
        return null
    }
    async updateTaskStatus(_taskId: string, _status: any, _metadata?: any): Promise<void> {}
    async listTasks(_filter: any): Promise<any[]> {
        return []
    }
    async sendMessage(_message: any): Promise<string> {
        return ''
    }
    async getMessages(_taskId: string, _limit?: number): Promise<any[]> {
        return []
    }
    async registerArtifact(_artifact: any): Promise<string> {
        return ''
    }
    async getArtifact(_artifactId: string): Promise<any> {
        return null
    }
    async listArtifacts(_taskId?: string, _ownerId?: string): Promise<any[]> {
        return []
    }
    async grantAccess(_artifactId: string, _agentId: string, _permission: any, _grantedBy: string): Promise<void> {}
    async revokeAccess(_artifactId: string, _agentId: string): Promise<void> {}
    async checkAccess(_artifactId: string, _agentId: string): Promise<any> {
        return null
    }
    async createSession(_session: any): Promise<string> {
        return ''
    }
    async getSession(_sessionId: string): Promise<any> {
        return null
    }
    async addClaim(_sessionId: string, _claim: any): Promise<string> {
        return ''
    }
    async getClaims(_sessionId: string): Promise<any[]> {
        return []
    }
    async addObservation(_sessionId: string, _obs: any): Promise<string> {
        return ''
    }
    async addDecision(_sessionId: string, _decision: any): Promise<string> {
        return ''
    }
    async getDecisions(_sessionId: string): Promise<any[]> {
        return []
    }
    async saveContext(_agentId: string, _key: string, _value: unknown): Promise<void> {}
    async loadContext(_agentId: string, _key: string): Promise<unknown | null> {
        return null
    }
}
