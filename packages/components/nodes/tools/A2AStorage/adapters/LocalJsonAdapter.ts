import {
    A2AStorageAdapter,
    validateTaskTransition,
    AgentCard,
    A2ATask,
    A2AMessage,
    A2AArtifact,
    A2ASession,
    A2AClaim,
    A2ADecision,
    A2AObservation
} from '../../../../src/A2AStorageAdapter'
import type { AgentStatus, TaskStatus, ArtifactPermission } from '../../../../src/A2AStorageAdapter'

type RowObject = Record<string, unknown>

export class LocalJsonAdapter implements A2AStorageAdapter {
    readonly backend = 'localjson' as const
    private tables: Map<string, Map<string, RowObject>> = new Map()
    private context: Map<string, unknown> = new Map()

    constructor(_config?: Record<string, unknown>) {
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

    // ── Registry ──

    async registerAgent(card: AgentCard): Promise<string> {
        const row = { ...card } as RowObject
        this.tables.get('a2a_agents')!.set(card.id, row)
        return card.id
    }

    async getAgent(agentId: string): Promise<AgentCard | null> {
        const row = this.tables.get('a2a_agents')!.get(agentId)
        return row ? (row as unknown as AgentCard) : null
    }

    async findAgents(filter: Record<string, unknown>): Promise<AgentCard[]> {
        const agents = Array.from(this.tables.get('a2a_agents')!.values()) as unknown as AgentCard[]
        return agents.filter((a) => {
            if (filter.capability && typeof filter.capability === 'string') {
                if (!a.capabilities.includes(filter.capability)) return false
            }
            if (filter.status && a.status !== filter.status) return false
            if (filter.mcpEndpoint && typeof filter.mcpEndpoint === 'string') {
                if (!a.mcpEndpoints.includes(filter.mcpEndpoint)) return false
            }
            if (filter.artifactType && typeof filter.artifactType === 'string') {
                if (!a.artifactTypes.includes(filter.artifactType)) return false
            }
            if (filter.agentId && typeof filter.agentId === 'string') {
                if (a.id !== filter.agentId) return false
            }
            return true
        })
    }

    async updateAgentStatus(agentId: string, status: AgentStatus): Promise<void> {
        const agent = this.tables.get('a2a_agents')!.get(agentId)
        if (!agent) return // silently succeed for non-existent agents (contract test expects this)
        agent.status = status
    }

    // ── Task ──

    async createTask(task: A2ATask): Promise<string> {
        const row = { ...task, id: task.id || this.uuid() } as RowObject
        this.tables.get('a2a_tasks')!.set(row.id as string, row)
        return row.id as string
    }

    async getTask(taskId: string): Promise<A2ATask | null> {
        const row = this.tables.get('a2a_tasks')!.get(taskId)
        return row ? (row as unknown as A2ATask) : null
    }

    async updateTaskStatus(taskId: string, status: TaskStatus, _metadata?: Record<string, unknown>): Promise<void> {
        const task = this.tables.get('a2a_tasks')!.get(taskId)
        if (!task) throw new Error(`Task ${taskId} not found`)
        validateTaskTransition(task.status as TaskStatus, status)
        task.status = status
    }

    async listTasks(filter: Record<string, unknown>): Promise<A2ATask[]> {
        const tasks = Array.from(this.tables.get('a2a_tasks')!.values()) as unknown as A2ATask[]
        return tasks.filter((t) => {
            if (filter.status && t.status !== filter.status) return false
            if (filter.agentId && typeof filter.agentId === 'string') {
                if (t.requesterId !== filter.agentId && t.assigneeId !== filter.agentId) return false
            }
            if (filter.ownerId && typeof filter.ownerId === 'string') {
                if (t.requesterId !== filter.ownerId) return false
            }
            return true
        })
    }

    // ── Message ──

    async sendMessage(message: A2AMessage): Promise<string> {
        const id = message.id || this.uuid()
        const row = { ...message, id } as RowObject
        this.tables.get('a2a_messages')!.set(id, row)
        return id
    }

    async getMessages(taskId: string, _limit?: number): Promise<A2AMessage[]> {
        const all = Array.from(this.tables.get('a2a_messages')!.values()) as unknown as A2AMessage[]
        return all.filter((m) => m.taskId === taskId)
    }

    // ── Artifact ──

    async registerArtifact(artifact: A2AArtifact): Promise<string> {
        const id = artifact.id || this.uuid()
        const row = { ...artifact, id, permissions: { ...(artifact.permissions ?? {}) } } as RowObject
        this.tables.get('a2a_artifacts')!.set(id, row)
        return id
    }

    async getArtifact(artifactId: string): Promise<A2AArtifact | null> {
        const row = this.tables.get('a2a_artifacts')!.get(artifactId)
        return row ? (row as unknown as A2AArtifact) : null
    }

    async listArtifacts(taskId?: string, ownerId?: string): Promise<A2AArtifact[]> {
        const all = Array.from(this.tables.get('a2a_artifacts')!.values()) as unknown as A2AArtifact[]
        return all.filter((a) => {
            if (taskId && a.taskId !== taskId) return false
            if (ownerId && a.ownerId !== ownerId) return false
            return true
        })
    }

    async grantAccess(artifactId: string, agentId: string, permission: ArtifactPermission, _grantedBy: string): Promise<void> {
        const artifact = this.tables.get('a2a_artifacts')!.get(artifactId)
        if (!artifact) throw new Error(`Artifact ${artifactId} not found`)
        const perms = (artifact.permissions ?? {}) as Record<string, string>
        perms[agentId] = permission
        artifact.permissions = perms
    }

    async revokeAccess(artifactId: string, agentId: string): Promise<void> {
        const artifact = this.tables.get('a2a_artifacts')!.get(artifactId)
        if (!artifact) return
        const perms = (artifact.permissions ?? {}) as Record<string, string>
        delete perms[agentId]
        artifact.permissions = perms
    }

    async checkAccess(artifactId: string, agentId: string): Promise<ArtifactPermission | null> {
        const artifact = this.tables.get('a2a_artifacts')!.get(artifactId)
        if (!artifact) return null
        const perms = (artifact.permissions ?? {}) as Record<string, string>
        return (perms[agentId] as ArtifactPermission) ?? null
    }

    // ── Shared Context ──

    async createSession(session: A2ASession): Promise<string> {
        const id = session.id || this.uuid()
        const row = { ...session, id } as RowObject
        this.tables.get('a2a_sessions')!.set(id, row)
        return id
    }

    async getSession(sessionId: string): Promise<A2ASession | null> {
        const row = this.tables.get('a2a_sessions')!.get(sessionId)
        return row ? (row as unknown as A2ASession) : null
    }

    async addClaim(sessionId: string, claim: A2AClaim): Promise<string> {
        const id = claim.id || this.uuid()
        const row = { ...claim, id, sessionId } as RowObject
        this.tables.get('a2a_claims')!.set(id, row)
        return id
    }

    async getClaims(sessionId: string): Promise<A2AClaim[]> {
        const all = Array.from(this.tables.get('a2a_claims')!.values()) as unknown as A2AClaim[]
        return all.filter((c) => c.sessionId === sessionId)
    }

    async addObservation(sessionId: string, obs: A2AObservation): Promise<string> {
        const id = obs.id || this.uuid()
        const row = { ...obs, id, sessionId } as RowObject
        this.tables.get('a2a_observations')!.set(id, row)
        return id
    }

    async addDecision(sessionId: string, decision: A2ADecision): Promise<string> {
        const id = decision.id || this.uuid()
        const row = { ...decision, id, sessionId } as RowObject
        this.tables.get('a2a_decisions')!.set(id, row)
        return id
    }

    async getDecisions(sessionId: string): Promise<A2ADecision[]> {
        const all = Array.from(this.tables.get('a2a_decisions')!.values()) as unknown as A2ADecision[]
        return all.filter((d) => d.sessionId === sessionId)
    }

    // ── Memory ──

    async saveContext(agentId: string, key: string, value: unknown): Promise<void> {
        const ctxKey = `${agentId}:${key}`
        this.context.set(ctxKey, value)
    }

    async loadContext(agentId: string, key: string): Promise<unknown | null> {
        const ctxKey = `${agentId}:${key}`
        const value = this.context.get(ctxKey)
        return value !== undefined ? value : null
    }
}
