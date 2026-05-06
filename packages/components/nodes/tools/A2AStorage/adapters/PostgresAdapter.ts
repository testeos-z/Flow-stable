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

type RowObject = Record<string, unknown>

export class PostgresAdapter implements A2AStorageAdapter {
    readonly backend = 'postgres' as const
    private tables: Map<string, Map<string, RowObject>> = new Map()
    private context: Map<string, unknown> = new Map()
    private dbPath: string

    constructor(_config?: Record<string, unknown>) {
        this.dbPath = '.'
        this.tables.set('a2a_agents', new Map())
        this.tables.set('a2a_tasks', new Map())
        this.tables.set('a2a_messages', new Map())
        this.tables.set('a2a_artifacts', new Map())
        this.tables.set('a2a_sessions', new Map())
        this.tables.set('a2a_claims', new Map())
        this.tables.set('a2a_decisions', new Map())
        this.tables.set('a2a_observations', new Map())
    }

    async initialize(_config: Record<string, unknown>): Promise<void> {}

    private uuid(): string {
        return crypto.randomUUID()
    }

    async registerAgent(card: AgentCard): Promise<string> {
        this.tables.get('a2a_agents')!.set(card.id, { ...card })
        return card.id
    }

    async getAgent(agentId: string): Promise<AgentCard | null> {
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
        const agent = this.tables.get('a2a_agents')!.get(agentId)
        if (agent) agent.status = status
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
        const task = this.tables.get('a2a_tasks')!.get(taskId)
        if (!task) throw new Error(`Task ${taskId} not found`)
        const current = task.status as TaskStatus
        validateTaskTransition(current, status)
        task.status = status
    }

    async listTasks(filter: Record<string, unknown>): Promise<A2ATask[]> {
        const tasks = Array.from(this.tables.get('a2a_tasks')!.values()) as unknown as A2ATask[]
        return tasks.filter((t) => {
            if (filter.status && t.status !== filter.status) return false
            if (filter.agentId && typeof filter.agentId === 'string' && t.requesterId !== filter.agentId && t.assigneeId !== filter.agentId)
                return false
            if (filter.ownerId && typeof filter.ownerId === 'string' && t.requesterId !== filter.ownerId) return false
            return true
        })
    }

    async sendMessage(message: A2AMessage): Promise<string> {
        const id = message.id || this.uuid()
        this.tables.get('a2a_messages')!.set(id, { ...message, id })
        return id
    }

    async getMessages(taskId: string, _limit?: number): Promise<A2AMessage[]> {
        return Array.from(this.tables.get('a2a_messages')!.values()).filter((m) => (m as any).taskId === taskId) as unknown as A2AMessage[]
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
            if (taskId && (a as any).taskId !== taskId) return false
            if (ownerId && (a as any).ownerId !== ownerId) return false
            return true
        }) as unknown as A2AArtifact[]
    }

    async grantAccess(artifactId: string, agentId: string, permission: ArtifactPermission, _grantedBy: string): Promise<void> {
        const artifact = this.tables.get('a2a_artifacts')!.get(artifactId)
        if (!artifact) throw new Error(`Artifact ${artifactId} not found`)
        const perms = ((artifact as any).permissions ?? {}) as Record<string, string>
        perms[agentId] = permission
        ;(artifact as any).permissions = perms
    }

    async revokeAccess(artifactId: string, agentId: string): Promise<void> {
        const artifact = this.tables.get('a2a_artifacts')!.get(artifactId)
        if (!artifact) return
        const perms = ((artifact as any).permissions ?? {}) as Record<string, string>
        delete perms[agentId]
    }

    async checkAccess(artifactId: string, agentId: string): Promise<ArtifactPermission | null> {
        const artifact = this.tables.get('a2a_artifacts')!.get(artifactId)
        if (!artifact) return null
        return ((((artifact as any).permissions ?? {}) as Record<string, string>)[agentId] as ArtifactPermission) ?? null
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
        return Array.from(this.tables.get('a2a_claims')!.values()).filter(
            (c) => (c as any).sessionId === sessionId
        ) as unknown as A2AClaim[]
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
        return Array.from(this.tables.get('a2a_decisions')!.values()).filter(
            (d) => (d as any).sessionId === sessionId
        ) as unknown as A2ADecision[]
    }

    async saveContext(agentId: string, key: string, value: unknown): Promise<void> {
        this.context.set(`${agentId}:${key}`, value)
    }

    async loadContext(agentId: string, key: string): Promise<unknown | null> {
        return this.context.get(`${agentId}:${key}`) ?? null
    }
}
