import { z } from 'zod'
import { ICommonObject } from './Interface'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type AgentStatus = 'active' | 'idle' | 'offline'
export type TaskStatus = 'submitted' | 'working' | 'completed' | 'failed' | 'canceled'
export type ArtifactPermission = 'read' | 'write' | 'admin'

// ---------------------------------------------------------------------------
// A2AStorageAdapter — interface all backends must implement
// ---------------------------------------------------------------------------

export interface A2AStorageAdapter {
    readonly backend: 'supabase' | 'localjson' | 'postgres' | 'sqlite'
    initialize(config: ICommonObject): Promise<void>

    // Registry (4 methods)
    registerAgent(card: AgentCard): Promise<string>
    getAgent(agentId: string): Promise<AgentCard | null>
    findAgents(filter: A2AFilter): Promise<AgentCard[]>
    updateAgentStatus(agentId: string, status: AgentStatus): Promise<void>

    // Task (4 methods)
    createTask(task: A2ATask): Promise<string>
    getTask(taskId: string): Promise<A2ATask | null>
    updateTaskStatus(taskId: string, status: TaskStatus, metadata?: ICommonObject): Promise<void>
    listTasks(filter: A2AFilter): Promise<A2ATask[]>

    // Message (2 methods)
    sendMessage(message: A2AMessage): Promise<string>
    getMessages(taskId: string, limit?: number): Promise<A2AMessage[]>

    // Artifact (6 methods)
    registerArtifact(artifact: A2AArtifact): Promise<string>
    getArtifact(artifactId: string): Promise<A2AArtifact | null>
    listArtifacts(taskId?: string, ownerId?: string): Promise<A2AArtifact[]>
    grantAccess(artifactId: string, agentId: string, permission: ArtifactPermission, grantedBy: string): Promise<void>
    revokeAccess(artifactId: string, agentId: string): Promise<void>
    checkAccess(artifactId: string, agentId: string): Promise<ArtifactPermission | null>

    // Shared Context (7 methods)
    createSession(session: A2ASession): Promise<string>
    getSession(sessionId: string): Promise<A2ASession | null>
    addClaim(sessionId: string, claim: A2AClaim): Promise<string>
    getClaims(sessionId: string): Promise<A2AClaim[]>
    addObservation(sessionId: string, obs: A2AObservation): Promise<string>
    addDecision(sessionId: string, decision: A2ADecision): Promise<string>
    getDecisions(sessionId: string): Promise<A2ADecision[]>

    // Memory (2 methods)
    saveContext(agentId: string, key: string, value: unknown): Promise<void>
    loadContext(agentId: string, key: string): Promise<unknown | null>
}

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

export const AgentCardSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(128),
    description: z.string().max(1024),
    capabilities: z.array(z.string()),
    mcpEndpoints: z.array(z.string().url()).optional().default([]),
    artifactTypes: z.array(z.string()).optional().default([]),
    ownerId: z.string().uuid(),
    status: z.enum(['active', 'idle', 'offline']),
    metadata: z.record(z.string(), z.unknown()).optional().default({})
})

export const A2ATaskSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(256),
    description: z.string().max(4096),
    status: z.enum(['submitted', 'working', 'completed', 'failed', 'canceled']),
    requesterId: z.string().uuid(),
    assigneeId: z.string().uuid().optional(),
    artifactIds: z.array(z.string().uuid()).optional().default([]),
    sessionId: z.string().uuid().optional(),
    result: z.unknown().optional(),
    error: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional().default({})
})

export const A2AMessageSchema = z.object({
    id: z.string().uuid(),
    taskId: z.string().uuid(),
    senderId: z.string().uuid(),
    content: z.string().max(32768),
    role: z.enum(['instruction', 'query', 'response', 'status', 'error']),
    timestamp: z.string().datetime()
})

export const A2AArtifactSchema = z.object({
    id: z.string().uuid(),
    taskId: z.string().uuid().optional(),
    name: z.string().min(1).max(256),
    type: z.string(),
    content: z.unknown(),
    ownerId: z.string().uuid(),
    permissions: z
        .record(z.string(), z.enum(['read', 'write', 'admin']))
        .optional()
        .default({})
})

export const A2ASessionSchema = z.object({
    id: z.string().uuid(),
    topic: z.string().min(1).max(512),
    participants: z.array(z.string().uuid()),
    status: z.enum(['open', 'deliberating', 'decided', 'closed']),
    decision: z.string().optional()
})

export const A2AClaimSchema = z.object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    agentId: z.string().uuid(),
    claim: z.string().max(4096),
    evidence: z.array(z.string()).optional().default([]),
    confidence: z.number().min(0).max(1)
})

export const A2ADecisionSchema = z.object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    decision: z.string().max(4096),
    rationale: z.string().min(1).max(8192),
    basedOnClaims: z.array(z.string().uuid()).min(1),
    agreedBy: z.array(z.string().uuid()),
    timestamp: z.string().datetime()
})

export const A2AObservationSchema = z.object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    agentId: z.string().uuid(),
    observation: z.string().min(1).max(4096),
    timestamp: z.string().datetime()
})

export const A2AFilterSchema = z.object({
    capability: z.string().optional(),
    status: z.string().optional(),
    agentId: z.string().uuid().optional(),
    taskId: z.string().uuid().optional(),
    ownerId: z.string().uuid().optional(),
    mcpEndpoint: z.string().optional(),
    artifactType: z.string().optional(),
    limit: z.number().min(1).max(100).optional().default(20),
    offset: z.number().min(0).optional().default(0)
})

// ---------------------------------------------------------------------------
// TypeScript types inferred from Zod schemas
// ---------------------------------------------------------------------------

export type AgentCard = z.infer<typeof AgentCardSchema>
export type A2ATask = z.infer<typeof A2ATaskSchema>
export type A2AMessage = z.infer<typeof A2AMessageSchema>
export type A2AArtifact = z.infer<typeof A2AArtifactSchema>
export type A2ASession = z.infer<typeof A2ASessionSchema>
export type A2AClaim = z.infer<typeof A2AClaimSchema>
export type A2ADecision = z.infer<typeof A2ADecisionSchema>
export type A2AObservation = z.infer<typeof A2AObservationSchema>
export type A2AFilter = z.infer<typeof A2AFilterSchema>
