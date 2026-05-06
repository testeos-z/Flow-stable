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
// import Database from 'better-sqlite3' // requires native build

type RowObject = Record<string, unknown>

const DDL = [
    `CREATE TABLE IF NOT EXISTS a2a_agents (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, capabilities TEXT DEFAULT '[]', mcp_endpoints TEXT DEFAULT '[]', artifact_types TEXT DEFAULT '[]', owner_id TEXT NOT NULL, status TEXT DEFAULT 'idle', metadata TEXT DEFAULT '{}', created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS a2a_tasks (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, status TEXT NOT NULL DEFAULT 'submitted', requester_id TEXT NOT NULL, assignee_id TEXT, artifact_ids TEXT DEFAULT '[]', session_id TEXT, result TEXT, error TEXT, metadata TEXT DEFAULT '{}', created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE INDEX IF NOT EXISTS idx_a2a_tasks_status ON a2a_tasks(status)`,
    `CREATE TABLE IF NOT EXISTS a2a_messages (id TEXT PRIMARY KEY, task_id TEXT NOT NULL, sender_id TEXT NOT NULL, content TEXT NOT NULL, role TEXT NOT NULL, timestamp TEXT DEFAULT (datetime('now')))`,
    `CREATE INDEX IF NOT EXISTS idx_a2a_messages_task ON a2a_messages(task_id)`,
    `CREATE TABLE IF NOT EXISTS a2a_artifacts (id TEXT PRIMARY KEY, task_id TEXT, name TEXT NOT NULL, type TEXT NOT NULL, content TEXT NOT NULL, owner_id TEXT NOT NULL, permissions TEXT DEFAULT '{}', created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS a2a_sessions (id TEXT PRIMARY KEY, topic TEXT NOT NULL, participants TEXT DEFAULT '[]', status TEXT DEFAULT 'open', decision TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS a2a_claims (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, agent_id TEXT NOT NULL, claim TEXT NOT NULL, evidence TEXT DEFAULT '[]', confidence REAL DEFAULT 1.0, timestamp TEXT DEFAULT (datetime('now')))`,
    `CREATE INDEX IF NOT EXISTS idx_a2a_claims_session ON a2a_claims(session_id)`,
    `CREATE TABLE IF NOT EXISTS a2a_decisions (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, decision TEXT NOT NULL, rationale TEXT, based_on_claims TEXT DEFAULT '[]', agreed_by TEXT DEFAULT '[]', timestamp TEXT DEFAULT (datetime('now')))`,
    `CREATE INDEX IF NOT EXISTS idx_a2a_decisions_session ON a2a_decisions(session_id)`,
    `CREATE TABLE IF NOT EXISTS a2a_observations (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, agent_id TEXT NOT NULL, observation TEXT NOT NULL, timestamp TEXT DEFAULT (datetime('now')))`,
    `CREATE INDEX IF NOT EXISTS idx_a2a_observations_session ON a2a_observations(session_id)`
]

export class SQLiteAdapter implements A2AStorageAdapter {
    readonly backend = 'sqlite' as const
    // In production: private db: Database
    private tables: Map<string, Map<string, RowObject>> = new Map()
    private context: Map<string, unknown> = new Map()
    private _dbPath: string

    constructor(config?: Record<string, unknown>) {
        this._dbPath = (config?.dbPath as string) || ':memory:'
        // In production: this.db = new Database(this._dbPath)
        //               this.db.exec(DDL.join(';\n'))
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
        // In production: this.db.exec(DDL.join(';\n'))
    }

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

    // ── Task ──
    async createTask(task: A2ATask): Promise<string> {
        const row = { ...task, id: task.id || this.uuid() } as RowObject
        this.tables.get('a2a_tasks')!.set(row.id as string, row)
        return row.id as string
    }
    async getTask(taskId: string): Promise<A2ATask | null> {
        return (this.tables.get('a2a_tasks')!.get(taskId) as unknown as A2ATask) ?? null
    }
    async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
        const task = this.tables.get('a2a_tasks')!.get(taskId)
        if (!task) throw new Error(`Task ${taskId} not found`)
        validateTaskTransition(task.status as TaskStatus, status)
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

    // ── Message ──
    async sendMessage(message: A2AMessage): Promise<string> {
        const id = message.id || this.uuid()
        this.tables.get('a2a_messages')!.set(id, { ...message, id } as RowObject)
        return id
    }
    async getMessages(taskId: string, _limit?: number): Promise<A2AMessage[]> {
        const all = Array.from(this.tables.get('a2a_messages')!.values()) as unknown as A2AMessage[]
        return all.filter((m) => m.taskId === taskId)
    }

    // ── Artifact ──
    async registerArtifact(artifact: A2AArtifact): Promise<string> {
        const id = artifact.id || this.uuid()
        this.tables.get('a2a_artifacts')!.set(id, { ...artifact, id, permissions: { ...(artifact.permissions ?? {}) } } as RowObject)
        return id
    }
    async getArtifact(artifactId: string): Promise<A2AArtifact | null> {
        return (this.tables.get('a2a_artifacts')!.get(artifactId) as unknown as A2AArtifact) ?? null
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
        this.tables.get('a2a_sessions')!.set(id, { ...session, id } as RowObject)
        return id
    }
    async getSession(sessionId: string): Promise<A2ASession | null> {
        return (this.tables.get('a2a_sessions')!.get(sessionId) as unknown as A2ASession) ?? null
    }
    async addClaim(sessionId: string, claim: A2AClaim): Promise<string> {
        const id = claim.id || this.uuid()
        this.tables.get('a2a_claims')!.set(id, { ...claim, id, sessionId } as RowObject)
        return id
    }
    async getClaims(sessionId: string): Promise<A2AClaim[]> {
        return Array.from(this.tables.get('a2a_claims')!.values()).filter(
            (c) => (c as RowObject).sessionId === sessionId
        ) as unknown as A2AClaim[]
    }
    async addObservation(sessionId: string, obs: A2AObservation): Promise<string> {
        const id = obs.id || this.uuid()
        this.tables.get('a2a_observations')!.set(id, { ...obs, id, sessionId } as RowObject)
        return id
    }
    async addDecision(sessionId: string, decision: A2ADecision): Promise<string> {
        const id = decision.id || this.uuid()
        this.tables.get('a2a_decisions')!.set(id, { ...decision, id, sessionId } as RowObject)
        return id
    }
    async getDecisions(sessionId: string): Promise<A2ADecision[]> {
        return Array.from(this.tables.get('a2a_decisions')!.values()).filter(
            (d) => (d as RowObject).sessionId === sessionId
        ) as unknown as A2ADecision[]
    }

    // ── Memory ──
    async saveContext(agentId: string, key: string, value: unknown): Promise<void> {
        this.context.set(`${agentId}:${key}`, value)
    }
    async loadContext(agentId: string, key: string): Promise<unknown | null> {
        return this.context.get(`${agentId}:${key}`) ?? null
    }
}
