import {
    A2AStorageAdapter,
    AgentCard,
    A2ATask,
    A2AMessage,
    A2AArtifact,
    ArtifactPermission,
    A2AFilter,
    A2ASession,
    A2AClaim,
    A2ADecision,
    A2AObservation,
    AgentStatus,
    TaskStatus
} from '../../../../src/A2AStorageAdapter'

// ---------------------------------------------------------------------------
// Contract test harness
// ---------------------------------------------------------------------------
// This function validates that ANY A2AStorageAdapter implementation satisfies
// the interface contract. Each adapter test file calls runContractTests with
// its own factory. The contract tests themselves are validated using a simple
// in-memory mock adapter (MockA2AAdapter) to prove the harness works.

export function runContractTests(name: string, adapterFactory: () => Promise<A2AStorageAdapter>): void {
    describe(`A2AStorageAdapter contract: ${name}`, () => {
        let adapter: A2AStorageAdapter

        // Use deterministic UUIDs that are still valid UUIDs
        const AGENT_A_ID = '550e8400-e29b-41d4-a716-446655440000'
        const AGENT_B_ID = '123e4567-e89b-12d3-a456-426614174000'
        const TASK_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
        const MSG_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
        const ARTIFACT_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012'
        const SESSION_ID = 'd4e5f6a7-b8c9-0123-defa-234567890123'
        const CLAIM_ID = 'e5f6a7b8-c9d0-1234-efab-345678901234'
        const DECISION_ID = 'f6a7b8c9-d0e1-2345-fabc-456789012345'

        async function initAdapter(): Promise<void> {
            adapter = await adapterFactory()
            await adapter.initialize({})
        }

        // ------------------------------------------------------------------
        // Registry
        // ------------------------------------------------------------------
        describe('Registry', () => {
            const agentCardA: AgentCard = {
                id: AGENT_A_ID,
                name: 'Agent Alpha',
                description: 'Fact-checking and summarization agent',
                capabilities: ['fact-checking', 'summarization'],
                mcpEndpoints: ['https://mcp.example.com/a2a'],
                artifactTypes: ['report', 'analysis'],
                ownerId: AGENT_B_ID,
                status: 'active',
                metadata: {}
            }

            beforeEach(initAdapter)

            it('registerAgent returns a string UUID', async () => {
                const id = await adapter.registerAgent(agentCardA)
                expect(typeof id).toBe('string')
                expect(id.length).toBeGreaterThan(0)
            })

            it('getAgent retrieves a registered agent', async () => {
                const id = await adapter.registerAgent(agentCardA)
                const card = await adapter.getAgent(id)
                expect(card).not.toBeNull()
                expect(card!.name).toBe('Agent Alpha')
                expect(card!.capabilities).toEqual(['fact-checking', 'summarization'])
            })

            it('getAgent returns null for unknown id', async () => {
                const card = await adapter.getAgent('00000000-0000-0000-0000-000000000000')
                expect(card).toBeNull()
            })

            it('findAgents filters by capability', async () => {
                await adapter.registerAgent(agentCardA)

                const agentCardB: AgentCard = {
                    id: AGENT_B_ID,
                    name: 'Agent Beta',
                    description: 'Translation agent',
                    capabilities: ['translation'],
                    mcpEndpoints: [],
                    artifactTypes: [],
                    ownerId: AGENT_A_ID,
                    status: 'idle',
                    metadata: {}
                }
                await adapter.registerAgent(agentCardB)

                const matches = await adapter.findAgents({ capability: 'fact-checking', limit: 20, offset: 0 })
                expect(matches).toHaveLength(1)
                expect(matches[0].name).toBe('Agent Alpha')
            })

            it('findAgents returns empty array when no match', async () => {
                const matches = await adapter.findAgents({ capability: 'nonexistent', limit: 20, offset: 0 })
                expect(matches).toEqual([])
            })

            it('findAgents filters by status', async () => {
                await adapter.registerAgent(agentCardA)
                const matches = await adapter.findAgents({ status: 'active', limit: 20, offset: 0 })
                expect(matches).toHaveLength(1)
                expect(matches[0].id).toBe(AGENT_A_ID)
            })

            it('updateAgentStatus changes agent status', async () => {
                const id = await adapter.registerAgent(agentCardA)
                await adapter.updateAgentStatus(id, 'offline')
                const card = await adapter.getAgent(id)
                expect(card!.status).toBe('offline')
            })
        })

        // ------------------------------------------------------------------
        // Task
        // ------------------------------------------------------------------
        describe('Task', () => {
            const taskA: A2ATask = {
                id: TASK_ID,
                title: 'Research housing policy',
                description: 'Analyze current housing policies',
                status: 'submitted',
                requesterId: AGENT_A_ID,
                assigneeId: AGENT_B_ID,
                artifactIds: [],
                metadata: {}
            }

            beforeEach(initAdapter)

            it('createTask returns a UUID', async () => {
                const id = await adapter.createTask(taskA)
                expect(typeof id).toBe('string')
                expect(id.length).toBeGreaterThan(0)
            })

            it('getTask retrieves a created task', async () => {
                const id = await adapter.createTask(taskA)
                const task = await adapter.getTask(id)
                expect(task).not.toBeNull()
                expect(task!.title).toBe('Research housing policy')
                expect(task!.status).toBe('submitted')
            })

            it('getTask returns null for unknown id', async () => {
                const task = await adapter.getTask('00000000-0000-0000-0000-000000000000')
                expect(task).toBeNull()
            })

            it('updateTaskStatus transitions submitted→working', async () => {
                const id = await adapter.createTask(taskA)
                await adapter.updateTaskStatus(id, 'working')
                const task = await adapter.getTask(id)
                expect(task!.status).toBe('working')
            })

            it('updateTaskStatus transitions working→completed', async () => {
                const id = await adapter.createTask(taskA)
                await adapter.updateTaskStatus(id, 'working')
                await adapter.updateTaskStatus(id, 'completed')
                const task = await adapter.getTask(id)
                expect(task!.status).toBe('completed')
            })

            it('updateTaskStatus transitions working→failed', async () => {
                const id = await adapter.createTask(taskA)
                await adapter.updateTaskStatus(id, 'working')
                await adapter.updateTaskStatus(id, 'failed')
                const task = await adapter.getTask(id)
                expect(task!.status).toBe('failed')
            })

            it('updateTaskStatus transitions submitted→canceled', async () => {
                const id = await adapter.createTask(taskA)
                await adapter.updateTaskStatus(id, 'canceled')
                const task = await adapter.getTask(id)
                expect(task!.status).toBe('canceled')
            })

            it('updateTaskStatus rejects completed→working (state machine)', async () => {
                const id = await adapter.createTask(taskA)
                await adapter.updateTaskStatus(id, 'working')
                await adapter.updateTaskStatus(id, 'completed')
                await expect(adapter.updateTaskStatus(id, 'working')).rejects.toThrow()
            })

            it('updateTaskStatus rejects failed→working (state machine)', async () => {
                const id = await adapter.createTask(taskA)
                await adapter.updateTaskStatus(id, 'working')
                await adapter.updateTaskStatus(id, 'failed')
                await expect(adapter.updateTaskStatus(id, 'working')).rejects.toThrow()
            })

            it('updateTaskStatus rejects canceled→working (state machine)', async () => {
                const id = await adapter.createTask(taskA)
                await adapter.updateTaskStatus(id, 'canceled')
                await expect(adapter.updateTaskStatus(id, 'working')).rejects.toThrow()
            })

            it('listTasks filters by status', async () => {
                await adapter.createTask(taskA)

                const taskB: A2ATask = {
                    id: 'd4e5f6a7-b8c9-0123-dead-beef45678901',
                    title: 'Second task',
                    description: 'Another task',
                    status: 'submitted',
                    requesterId: AGENT_A_ID,
                    artifactIds: [],
                    metadata: {}
                }
                const idB = await adapter.createTask(taskB)
                await adapter.updateTaskStatus(idB, 'working')
                await adapter.updateTaskStatus(idB, 'completed')

                const submitted = await adapter.listTasks({ status: 'submitted', limit: 20, offset: 0 })
                expect(submitted).toHaveLength(1)
                expect(submitted[0].title).toBe('Research housing policy')

                const completed = await adapter.listTasks({ status: 'completed', limit: 20, offset: 0 })
                expect(completed).toHaveLength(1)
                expect(completed[0].title).toBe('Second task')
            })
        })

        // ------------------------------------------------------------------
        // Message
        // ------------------------------------------------------------------
        describe('Message', () => {
            beforeEach(initAdapter)

            it('sendMessage returns a UUID', async () => {
                const msg: A2AMessage = {
                    id: MSG_ID,
                    taskId: TASK_ID,
                    senderId: AGENT_A_ID,
                    content: 'Please analyze the report.',
                    role: 'instruction',
                    timestamp: '2026-05-06T12:00:00.000Z'
                }
                const id = await adapter.sendMessage(msg)
                expect(typeof id).toBe('string')
                expect(id.length).toBeGreaterThan(0)
            })

            it('getMessages returns ordered messages', async () => {
                const task: A2ATask = {
                    id: TASK_ID,
                    title: 'Task with messages',
                    description: 'Test',
                    status: 'submitted',
                    requesterId: AGENT_A_ID,
                    artifactIds: [],
                    metadata: {}
                }
                await adapter.createTask(task)

                const msg1: A2AMessage = {
                    id: MSG_ID,
                    taskId: TASK_ID,
                    senderId: AGENT_A_ID,
                    content: 'First message',
                    role: 'instruction',
                    timestamp: '2026-05-06T12:00:00.000Z'
                }
                const msg2: A2AMessage = {
                    id: 'd9e8f7a6-b5c4-3210-fedc-ba9876543210',
                    taskId: TASK_ID,
                    senderId: AGENT_B_ID,
                    content: 'Second message',
                    role: 'response',
                    timestamp: '2026-05-06T12:01:00.000Z'
                }

                await adapter.sendMessage(msg1)
                await adapter.sendMessage(msg2)

                const messages = await adapter.getMessages(TASK_ID)
                expect(messages).toHaveLength(2)
                expect(messages[0].content).toBe('First message')
                expect(messages[1].content).toBe('Second message')
            })

            it('getMessages returns empty array for task with no messages', async () => {
                const messages = await adapter.getMessages('00000000-0000-0000-0000-000000000000')
                expect(messages).toEqual([])
            })
        })

        // ------------------------------------------------------------------
        // Artifact
        // ------------------------------------------------------------------
        describe('Artifact', () => {
            const artifact: A2AArtifact = {
                id: ARTIFACT_ID,
                taskId: TASK_ID,
                name: 'Policy Analysis v2',
                type: 'application/json',
                content: { sections: ['intro', 'analysis'] },
                ownerId: AGENT_A_ID,
                permissions: {}
            }

            beforeEach(initAdapter)

            it('registerArtifact returns a UUID', async () => {
                const id = await adapter.registerArtifact(artifact)
                expect(typeof id).toBe('string')
                expect(id.length).toBeGreaterThan(0)
            })

            it('getArtifact retrieves a registered artifact', async () => {
                const id = await adapter.registerArtifact(artifact)
                const art = await adapter.getArtifact(id)
                expect(art).not.toBeNull()
                expect(art!.name).toBe('Policy Analysis v2')
                expect(art!.ownerId).toBe(AGENT_A_ID)
            })

            it('getArtifact returns null for unknown id', async () => {
                const art = await adapter.getArtifact('00000000-0000-0000-0000-000000000000')
                expect(art).toBeNull()
            })

            it('grantAccess sets permission on artifact', async () => {
                const id = await adapter.registerArtifact(artifact)
                await adapter.grantAccess(id, AGENT_B_ID, 'read', AGENT_A_ID)
                const perm = await adapter.checkAccess(id, AGENT_B_ID)
                expect(perm).toBe('read')
            })

            it('checkAccess returns null for non-granted agent', async () => {
                const id = await adapter.registerArtifact(artifact)
                const perm = await adapter.checkAccess(id, AGENT_B_ID)
                expect(perm).toBeNull()
            })

            it('checkAccess returns owner-level access for owner', async () => {
                // Owner has implicit access; if the adapter tracks permissions,
                // the owner should have 'admin' by default or permissions[ownerId]='admin'
                const id = await adapter.registerArtifact({
                    ...artifact,
                    permissions: { [AGENT_A_ID]: 'admin' }
                })
                const perm = await adapter.checkAccess(id, AGENT_A_ID)
                expect(perm).not.toBeNull()
            })

            it('revokeAccess removes permission', async () => {
                const id = await adapter.registerArtifact(artifact)
                await adapter.grantAccess(id, AGENT_B_ID, 'read', AGENT_A_ID)
                await adapter.revokeAccess(id, AGENT_B_ID)
                const perm = await adapter.checkAccess(id, AGENT_B_ID)
                expect(perm).toBeNull()
            })

            it('listArtifacts filters by owner', async () => {
                await adapter.registerArtifact(artifact)

                const artifactB: A2AArtifact = {
                    id: 'd4e5f6a7-b8c9-0123-dead-beef45678901',
                    name: 'Owner B Artifact',
                    type: 'text/plain',
                    content: 'data',
                    ownerId: AGENT_B_ID,
                    permissions: {}
                }
                await adapter.registerArtifact(artifactB)

                const ownedByA = await adapter.listArtifacts(undefined, AGENT_A_ID)
                expect(ownedByA).toHaveLength(1)
                expect(ownedByA[0].name).toBe('Policy Analysis v2')

                const ownedByB = await adapter.listArtifacts(undefined, AGENT_B_ID)
                expect(ownedByB).toHaveLength(1)
                expect(ownedByB[0].name).toBe('Owner B Artifact')
            })

            it('listArtifacts filters by task', async () => {
                await adapter.registerArtifact(artifact)
                const byTask = await adapter.listArtifacts(TASK_ID, undefined)
                expect(byTask).toHaveLength(1)
                expect(byTask[0].taskId).toBe(TASK_ID)
            })
        })

        // ------------------------------------------------------------------
        // Shared Context
        // ------------------------------------------------------------------
        describe('Shared Context', () => {
            beforeEach(initAdapter)

            it('createSession returns a UUID', async () => {
                const session: A2ASession = {
                    id: SESSION_ID,
                    topic: 'Housing policy deliberation',
                    participants: [AGENT_A_ID, AGENT_B_ID],
                    status: 'open'
                }
                const id = await adapter.createSession(session)
                expect(typeof id).toBe('string')
                expect(id.length).toBeGreaterThan(0)
            })

            it('getSession retrieves a created session', async () => {
                const session: A2ASession = {
                    id: SESSION_ID,
                    topic: 'Housing policy deliberation',
                    participants: [AGENT_A_ID, AGENT_B_ID],
                    status: 'open'
                }
                const id = await adapter.createSession(session)
                const s = await adapter.getSession(id)
                expect(s).not.toBeNull()
                expect(s!.topic).toBe('Housing policy deliberation')
                expect(s!.participants).toHaveLength(2)
            })

            it('getSession returns null for unknown id', async () => {
                const s = await adapter.getSession('00000000-0000-0000-0000-000000000000')
                expect(s).toBeNull()
            })

            it('addClaim returns a UUID', async () => {
                const session: A2ASession = {
                    id: SESSION_ID,
                    topic: 'Housing deliberation',
                    participants: [AGENT_A_ID],
                    status: 'open'
                }
                await adapter.createSession(session)

                const claim: A2AClaim = {
                    id: CLAIM_ID,
                    sessionId: SESSION_ID,
                    agentId: AGENT_A_ID,
                    claim: 'Housing policies disproportionately affect low-income residents.',
                    evidence: ['2025 census data'],
                    confidence: 0.85
                }
                const id = await adapter.addClaim(SESSION_ID, claim)
                expect(typeof id).toBe('string')
                expect(id.length).toBeGreaterThan(0)
            })

            it('getClaims returns the claim chain', async () => {
                const session: A2ASession = {
                    id: SESSION_ID,
                    topic: 'Housing deliberation',
                    participants: [AGENT_A_ID],
                    status: 'open'
                }
                await adapter.createSession(session)

                const claim: A2AClaim = {
                    id: CLAIM_ID,
                    sessionId: SESSION_ID,
                    agentId: AGENT_A_ID,
                    claim: 'Test claim',
                    evidence: [],
                    confidence: 0.9
                }
                await adapter.addClaim(SESSION_ID, claim)

                const claims = await adapter.getClaims(SESSION_ID)
                expect(claims).toHaveLength(1)
                expect(claims[0].claim).toBe('Test claim')
            })

            it('getClaims returns empty array for session with no claims', async () => {
                const session: A2ASession = {
                    id: SESSION_ID,
                    topic: 'Empty session',
                    participants: [AGENT_A_ID],
                    status: 'open'
                }
                await adapter.createSession(session)
                const claims = await adapter.getClaims(SESSION_ID)
                expect(claims).toEqual([])
            })

            it('addDecision references claims and returns a UUID', async () => {
                const session: A2ASession = {
                    id: SESSION_ID,
                    topic: 'Decision test',
                    participants: [AGENT_A_ID],
                    status: 'open'
                }
                await adapter.createSession(session)

                const claim: A2AClaim = {
                    id: CLAIM_ID,
                    sessionId: SESSION_ID,
                    agentId: AGENT_A_ID,
                    claim: 'Test claim for decision',
                    evidence: [],
                    confidence: 0.8
                }
                await adapter.addClaim(SESSION_ID, claim)

                const decision: A2ADecision = {
                    id: DECISION_ID,
                    sessionId: SESSION_ID,
                    decision: 'Increase housing density by 20%',
                    rationale: 'Evidence supports density increase.',
                    basedOnClaims: [CLAIM_ID],
                    agreedBy: [AGENT_A_ID],
                    timestamp: '2026-05-06T12:00:00.000Z'
                }
                const id = await adapter.addDecision(SESSION_ID, decision)
                expect(typeof id).toBe('string')
                expect(id.length).toBeGreaterThan(0)

                const decisions = await adapter.getDecisions(SESSION_ID)
                expect(decisions).toHaveLength(1)
                expect(decisions[0].basedOnClaims).toContain(CLAIM_ID)
            })

            it('getDecisions returns empty array for session with no decisions', async () => {
                const session: A2ASession = {
                    id: SESSION_ID,
                    topic: 'No decisions',
                    participants: [AGENT_A_ID],
                    status: 'open'
                }
                await adapter.createSession(session)
                const decisions = await adapter.getDecisions(SESSION_ID)
                expect(decisions).toEqual([])
            })

            it('addObservation returns a UUID', async () => {
                const session: A2ASession = {
                    id: SESSION_ID,
                    topic: 'Observation test',
                    participants: [AGENT_A_ID],
                    status: 'open'
                }
                await adapter.createSession(session)

                const obs: A2AObservation = {
                    id: 'aa11bb22-cc33-dd44-ee55-ff6677889900',
                    sessionId: SESSION_ID,
                    agentId: AGENT_A_ID,
                    observation: 'Census data confirms shortage of 50K units.',
                    timestamp: '2026-05-06T12:00:00.000Z'
                }
                const id = await adapter.addObservation(SESSION_ID, obs)
                expect(typeof id).toBe('string')
                expect(id.length).toBeGreaterThan(0)
            })
        })

        // ------------------------------------------------------------------
        // Memory
        // ------------------------------------------------------------------
        describe('Memory', () => {
            beforeEach(initAdapter)

            it('saveContext and loadContext round-trip values', async () => {
                await adapter.saveContext(AGENT_A_ID, 'policy_area', { name: 'housing', priority: 'high' })

                const value = await adapter.loadContext(AGENT_A_ID, 'policy_area')
                expect(value).not.toBeNull()
                expect(value).toEqual({ name: 'housing', priority: 'high' })
            })

            it('loadContext returns null for missing key', async () => {
                const value = await adapter.loadContext(AGENT_A_ID, 'nonexistent_key')
                expect(value).toBeNull()
            })

            it('saveContext for different agents does not collide', async () => {
                await adapter.saveContext(AGENT_A_ID, 'key', 'value_a')
                await adapter.saveContext(AGENT_B_ID, 'key', 'value_b')

                expect(await adapter.loadContext(AGENT_A_ID, 'key')).toBe('value_a')
                expect(await adapter.loadContext(AGENT_B_ID, 'key')).toBe('value_b')
            })
        })

        // ------------------------------------------------------------------
        // Initialization
        // ------------------------------------------------------------------
        describe('Initialization', () => {
            it('initialize can be called repeatedly without error', async () => {
                const a = await adapterFactory()
                await a.initialize({})
                await a.initialize({}) // second call
                await a.initialize({}) // third call
                // No error thrown = pass
            })

            it('backend property matches the adapter type', async () => {
                const a = await adapterFactory()
                expect(['supabase', 'localjson', 'postgres', 'sqlite']).toContain(a.backend)
            })
        })
    })
}

// ---------------------------------------------------------------------------
// Self-validation: run the contract suite against an inline mock adapter
// to prove the harness validates real behavior (not just passes trivially).
// ---------------------------------------------------------------------------

class MockA2AAdapter implements A2AStorageAdapter {
    readonly backend: 'supabase' | 'localjson' | 'postgres' | 'sqlite' = 'localjson'

    private agents = new Map<string, AgentCard>()
    private tasks = new Map<string, A2ATask>()
    private messages: A2AMessage[] = []
    private artifacts = new Map<string, A2AArtifact>()
    private sessions = new Map<string, A2ASession>()
    private sessionClaims = new Map<string, A2AClaim[]>()
    private sessionDecisions = new Map<string, A2ADecision[]>()
    private sessionObservations = new Map<string, A2AObservation[]>()
    private context = new Map<string, Map<string, unknown>>()

    async initialize(_config: Record<string, unknown>): Promise<void> {
        // noop — in-memory is always initialized
    }

    // Registry
    async registerAgent(card: AgentCard): Promise<string> {
        this.agents.set(card.id, { ...card })
        return card.id
    }

    async getAgent(agentId: string): Promise<AgentCard | null> {
        return this.agents.get(agentId) ?? null
    }

    async findAgents(filter: A2AFilter): Promise<AgentCard[]> {
        let results = Array.from(this.agents.values())
        if (filter.capability) {
            results = results.filter((a) => a.capabilities.includes(filter.capability!))
        }
        if (filter.status) {
            results = results.filter((a) => a.status === filter.status)
        }
        return results
    }

    async updateAgentStatus(agentId: string, status: AgentStatus): Promise<void> {
        const agent = this.agents.get(agentId)
        if (agent) agent.status = status
    }

    // Task
    async createTask(task: A2ATask): Promise<string> {
        this.tasks.set(task.id, { ...task })
        return task.id
    }

    async getTask(taskId: string): Promise<A2ATask | null> {
        return this.tasks.get(taskId) ?? null
    }

    async updateTaskStatus(taskId: string, status: TaskStatus, _metadata?: Record<string, unknown>): Promise<void> {
        const task = this.tasks.get(taskId)
        if (!task) throw new Error(`Task ${taskId} not found`)

        const invalidTransitions: Record<string, TaskStatus[]> = {
            completed: ['working', 'submitted'],
            failed: ['working', 'submitted'],
            canceled: ['working']
        }

        if (invalidTransitions[task.status]?.includes(status)) {
            throw new Error(`Invalid transition: ${task.status} → ${status}`)
        }

        task.status = status
    }

    async listTasks(filter: A2AFilter): Promise<A2ATask[]> {
        let results = Array.from(this.tasks.values())
        if (filter.status) {
            results = results.filter((t) => t.status === filter.status)
        }
        return results
    }

    // Message
    async sendMessage(message: A2AMessage): Promise<string> {
        this.messages.push({ ...message })
        return message.id
    }

    async getMessages(taskId: string, _limit?: number): Promise<A2AMessage[]> {
        return this.messages.filter((m) => m.taskId === taskId)
    }

    // Artifact
    async registerArtifact(artifact: A2AArtifact): Promise<string> {
        // Deep copy permissions to avoid shared references between tests
        const permissions = artifact.permissions ? { ...artifact.permissions } : {}
        this.artifacts.set(artifact.id, { ...artifact, permissions })
        return artifact.id
    }

    async getArtifact(artifactId: string): Promise<A2AArtifact | null> {
        return this.artifacts.get(artifactId) ?? null
    }

    async listArtifacts(taskId?: string, ownerId?: string): Promise<A2AArtifact[]> {
        let results = Array.from(this.artifacts.values())
        if (taskId) {
            results = results.filter((a) => a.taskId === taskId)
        }
        if (ownerId) {
            results = results.filter((a) => a.ownerId === ownerId)
        }
        return results
    }

    async grantAccess(artifactId: string, agentId: string, permission: ArtifactPermission, _grantedBy: string): Promise<void> {
        const art = this.artifacts.get(artifactId)
        if (!art) throw new Error(`Artifact ${artifactId} not found`)
        if (!art.permissions) art.permissions = {}
        art.permissions[agentId] = permission
    }

    async revokeAccess(artifactId: string, agentId: string): Promise<void> {
        const art = this.artifacts.get(artifactId)
        if (art?.permissions) {
            delete art.permissions[agentId]
        }
    }

    async checkAccess(artifactId: string, agentId: string): Promise<ArtifactPermission | null> {
        const art = this.artifacts.get(artifactId)
        if (!art) return null
        return art.permissions?.[agentId] ?? null
    }

    // Shared Context
    async createSession(session: A2ASession): Promise<string> {
        this.sessions.set(session.id, { ...session })
        return session.id
    }

    async getSession(sessionId: string): Promise<A2ASession | null> {
        return this.sessions.get(sessionId) ?? null
    }

    async addClaim(sessionId: string, claim: A2AClaim): Promise<string> {
        if (!this.sessionClaims.has(sessionId)) this.sessionClaims.set(sessionId, [])
        this.sessionClaims.get(sessionId)!.push({ ...claim })
        return claim.id
    }

    async getClaims(sessionId: string): Promise<A2AClaim[]> {
        return this.sessionClaims.get(sessionId) ?? []
    }

    async addObservation(sessionId: string, obs: A2AObservation): Promise<string> {
        if (!this.sessionObservations.has(sessionId)) this.sessionObservations.set(sessionId, [])
        this.sessionObservations.get(sessionId)!.push({ ...obs })
        return obs.id
    }

    async addDecision(sessionId: string, decision: A2ADecision): Promise<string> {
        if (!this.sessionDecisions.has(sessionId)) this.sessionDecisions.set(sessionId, [])
        this.sessionDecisions.get(sessionId)!.push({ ...decision })
        return decision.id
    }

    async getDecisions(sessionId: string): Promise<A2ADecision[]> {
        return this.sessionDecisions.get(sessionId) ?? []
    }

    // Memory
    async saveContext(agentId: string, key: string, value: unknown): Promise<void> {
        if (!this.context.has(agentId)) this.context.set(agentId, new Map())
        this.context.get(agentId)!.set(key, value)
    }

    async loadContext(agentId: string, key: string): Promise<unknown | null> {
        return this.context.get(agentId)?.get(key) ?? null
    }
}

// Self-validate the contract harness against the mock adapter
runContractTests('MockA2AAdapter', async () => new MockA2AAdapter())
