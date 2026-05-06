import { A2AStorageAdapter, validateTaskTransition } from '../../../../src/A2AStorageAdapter'
import type {
    AgentCard,
    A2ATask,
    A2AMessage,
    A2AArtifact,
    A2ASession,
    A2AClaim,
    A2ADecision,
    A2AObservation,
    AgentStatus,
    TaskStatus,
    ArtifactPermission
} from '../../../../src/A2AStorageAdapter'
// import { createClient, SupabaseClient } from '@supabase/supabase-js'

type RowObject = Record<string, unknown>

export class SupabaseAdapter implements A2AStorageAdapter {
    readonly backend = 'supabase' as const
    // In production: private client: SupabaseClient
    private tables: Map<string, Map<string, RowObject>> = new Map()
    private context: Map<string, unknown> = new Map()

    constructor(_config?: Record<string, unknown>) {
        // In production:
        //   const url = config?.supabaseProjUrl as string || process.env.SUPABASE_URL
        //   const key = config?.supabaseApiKey as string || process.env.SUPABASE_API_KEY
        //   this.client = createClient(url, key)
        this.tables.set('a2a_agents', new Map())
        this.tables.set('a2a_tasks', new Map())
        this.tables.set('a2a_messages', new Map())
        this.tables.set('a2a_artifacts', new Map())
        this.tables.set('a2a_sessions', new Map())
        this.tables.set('a2a_claims', new Map())
        this.tables.set('a2a_decisions', new Map())
        this.tables.set('a2a_observations', new Map())
    }

    async initialize(_config: Record<string, unknown>): Promise<void> {
        // In production: nothing needed (client is ready)
    }

    private uuid(): string {
        return crypto.randomUUID()
    }

    // In production, all methods use: this.client.from(table).insert/select/update/delete
    // The Map-based implementation mirrors the Supabase REST API semantics.

    async registerAgent(card: AgentCard): Promise<string> {
        // Production: await this.client.from('a2a_agents').insert(card).select('id').single()
        this.tables.get('a2a_agents')!.set(card.id, { ...card })
        return card.id
    }
    async getAgent(agentId: string): Promise<AgentCard | null> {
        // Production: await this.client.from('a2a_agents').select().eq('id', agentId).single()
        return (this.tables.get('a2a_agents')!.get(agentId) as unknown as AgentCard) ?? null
    }
    async findAgents(filter: Record<string, unknown>): Promise<AgentCard[]> {
        const agents = Array.from(this.tables.get('a2a_agents')!.values()) as unknown as AgentCard[]
        return agents.filter((a) => {
            if (filter.capability && typeof filter.capability === 'string' && !a.capabilities.includes(filter.capability)) return false
            if (filter.status && a.status !== filter.status) return false
            if (filter.mcpEndpoint && typeof filter.mcpEndpoint === 'string' && !a.mcpEndpoints.includes(filter.mcpEndpoint)) return false
            if (filter.artifactType && typeof filter.artifactType === 'string' && !a.artifactTypes.includes(filter.artifactType))
                return false
            if (filter.agentId && typeof filter.agentId === 'string' && a.id !== filter.agentId) return false
            return true
        })
    }
    async updateAgentStatus(agentId: string, status: AgentStatus): Promise<void> {
        const a = this.tables.get('a2a_agents')!.get(agentId)
        if (a) a.status = status
    }
    async createTask(task: A2ATask): Promise<string> {
        const id = task.id || this.uuid()
        this.tables.get('a2a_tasks')!.set(id, { ...task, id })
        return id
    }
    async getTask(taskId: string): Promise<A2ATask | null> {
        return (this.tables.get('a2a_tasks')!.get(taskId) as unknown as A2ATask) ?? null
    }
    async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
        const t = this.tables.get('a2a_tasks')!.get(taskId)
        if (!t) throw new Error(`Task ${taskId} not found`)
        validateTaskTransition(t.status as TaskStatus, status)
        t.status = status
    }
    async listTasks(filter: Record<string, unknown>): Promise<A2ATask[]> {
        return Array.from(this.tables.get('a2a_tasks')!.values()).filter((t) => {
            if (filter.status && t.status !== filter.status) return false
            if (filter.agentId && typeof filter.agentId === 'string' && t.requesterId !== filter.agentId && t.assigneeId !== filter.agentId)
                return false
            if (filter.ownerId && typeof filter.ownerId === 'string' && t.requesterId !== filter.ownerId) return false
            return true
        }) as unknown as A2ATask[]
    }
    async sendMessage(message: A2AMessage): Promise<string> {
        const id = message.id || this.uuid()
        this.tables.get('a2a_messages')!.set(id, { ...message, id })
        return id
    }
    async getMessages(taskId: string, _limit?: number): Promise<A2AMessage[]> {
        return Array.from(this.tables.get('a2a_messages')!.values()).filter((m) => m.taskId === taskId) as unknown as A2AMessage[]
    }
    async registerArtifact(artifact: A2AArtifact): Promise<string> {
        const id = artifact.id || this.uuid()
        this.tables.get('a2a_artifacts')!.set(id, { ...artifact, id, permissions: { ...(artifact.permissions ?? {}) } })
        return id
    }
    async getArtifact(artifactId: string): Promise<A2AArtifact | null> {
        return (this.tables.get('a2a_artifacts')!.get(artifactId) as unknown as A2AArtifact) ?? null
    }
    async listArtifacts(taskId?: string, ownerId?: string): Promise<A2AArtifact[]> {
        return Array.from(this.tables.get('a2a_artifacts')!.values()).filter((a) => {
            if (taskId && a.taskId !== taskId) return false
            if (ownerId && a.ownerId !== ownerId) return false
            return true
        }) as unknown as A2AArtifact[]
    }
    async grantAccess(artifactId: string, agentId: string, permission: ArtifactPermission, _grantedBy: string): Promise<void> {
        const a = this.tables.get('a2a_artifacts')!.get(artifactId)
        if (!a) throw new Error(`Artifact ${artifactId} not found`)
        const perms = (a.permissions ?? {}) as Record<string, string>
        perms[agentId] = permission
        a.permissions = perms
    }
    async revokeAccess(artifactId: string, agentId: string): Promise<void> {
        const a = this.tables.get('a2a_artifacts')!.get(artifactId)
        if (!a) return
        const perms = (a.permissions ?? {}) as Record<string, string>
        delete perms[agentId]
    }
    async checkAccess(artifactId: string, agentId: string): Promise<ArtifactPermission | null> {
        const a = this.tables.get('a2a_artifacts')!.get(artifactId)
        if (!a) return null
        return (((a.permissions ?? {}) as Record<string, string>)[agentId] as ArtifactPermission) ?? null
    }
    async createSession(session: A2ASession): Promise<string> {
        const id = session.id || this.uuid()
        this.tables.get('a2a_sessions')!.set(id, { ...session, id })
        return id
    }
    async getSession(sessionId: string): Promise<A2ASession | null> {
        return (this.tables.get('a2a_sessions')!.get(sessionId) as unknown as A2ASession) ?? null
    }
    async addClaim(sessionId: string, claim: A2AClaim): Promise<string> {
        const id = claim.id || this.uuid()
        this.tables.get('a2a_claims')!.set(id, { ...claim, id, sessionId })
        return id
    }
    async getClaims(sessionId: string): Promise<A2AClaim[]> {
        return Array.from(this.tables.get('a2a_claims')!.values()).filter((c) => c.sessionId === sessionId) as unknown as A2AClaim[]
    }
    async addObservation(sessionId: string, obs: A2AObservation): Promise<string> {
        const id = obs.id || this.uuid()
        this.tables.get('a2a_observations')!.set(id, { ...obs, id, sessionId })
        return id
    }
    async addDecision(sessionId: string, decision: A2ADecision): Promise<string> {
        const id = decision.id || this.uuid()
        this.tables.get('a2a_decisions')!.set(id, { ...decision, id, sessionId })
        return id
    }
    async getDecisions(sessionId: string): Promise<A2ADecision[]> {
        return Array.from(this.tables.get('a2a_decisions')!.values()).filter((d) => d.sessionId === sessionId) as unknown as A2ADecision[]
    }
    async saveContext(agentId: string, key: string, value: unknown): Promise<void> {
        this.context.set(`${agentId}:${key}`, value)
    }
    async loadContext(agentId: string, key: string): Promise<unknown | null> {
        return this.context.get(`${agentId}:${key}`) ?? null
    }
}
