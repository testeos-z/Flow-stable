import { A2AStorageAdapter } from '../../../../src/A2AStorageAdapter'

export class SupabaseAdapter implements A2AStorageAdapter {
    readonly backend = 'supabase' as const
    constructor(_config: Record<string, unknown>) {}
    async initialize(_config: Record<string, unknown>): Promise<void> {}

    private ni(method: string): never {
        throw new Error(`A2A SupabaseAdapter.${method}: not yet implemented. Use LocalJsonAdapter for development.`)
    }

    async registerAgent(_card: any): Promise<string> {
        this.ni('registerAgent')
        return ''
    }
    async getAgent(_agentId: string): Promise<any> {
        this.ni('getAgent')
        return null
    }
    async findAgents(_filter: any): Promise<any[]> {
        this.ni('findAgents')
        return []
    }
    async updateAgentStatus(_agentId: string, _status: any): Promise<void> {
        this.ni('updateAgentStatus')
    }
    async createTask(_task: any): Promise<string> {
        this.ni('createTask')
        return ''
    }
    async getTask(_taskId: string): Promise<any> {
        this.ni('getTask')
        return null
    }
    async updateTaskStatus(_taskId: string, _status: any, _metadata?: any): Promise<void> {
        this.ni('updateTaskStatus')
    }
    async listTasks(_filter: any): Promise<any[]> {
        this.ni('listTasks')
        return []
    }
    async sendMessage(_message: any): Promise<string> {
        this.ni('sendMessage')
        return ''
    }
    async getMessages(_taskId: string, _limit?: number): Promise<any[]> {
        this.ni('getMessages')
        return []
    }
    async registerArtifact(_artifact: any): Promise<string> {
        this.ni('registerArtifact')
        return ''
    }
    async getArtifact(_artifactId: string): Promise<any> {
        this.ni('getArtifact')
        return null
    }
    async listArtifacts(_taskId?: string, _ownerId?: string): Promise<any[]> {
        this.ni('listArtifacts')
        return []
    }
    async grantAccess(_artifactId: string, _agentId: string, _permission: any, _grantedBy: string): Promise<void> {
        this.ni('grantAccess')
    }
    async revokeAccess(_artifactId: string, _agentId: string): Promise<void> {
        this.ni('revokeAccess')
    }
    async checkAccess(_artifactId: string, _agentId: string): Promise<any> {
        this.ni('checkAccess')
        return null
    }
    async createSession(_session: any): Promise<string> {
        this.ni('createSession')
        return ''
    }
    async getSession(_sessionId: string): Promise<any> {
        this.ni('getSession')
        return null
    }
    async addClaim(_sessionId: string, _claim: any): Promise<string> {
        this.ni('addClaim')
        return ''
    }
    async getClaims(_sessionId: string): Promise<any[]> {
        this.ni('getClaims')
        return []
    }
    async addObservation(_sessionId: string, _obs: any): Promise<string> {
        this.ni('addObservation')
        return ''
    }
    async addDecision(_sessionId: string, _decision: any): Promise<string> {
        this.ni('addDecision')
        return ''
    }
    async getDecisions(_sessionId: string): Promise<any[]> {
        this.ni('getDecisions')
        return []
    }
    async saveContext(_agentId: string, _key: string, _value: unknown): Promise<void> {
        this.ni('saveContext')
    }
    async loadContext(_agentId: string, _key: string): Promise<unknown | null> {
        this.ni('loadContext')
        return null
    }
}
