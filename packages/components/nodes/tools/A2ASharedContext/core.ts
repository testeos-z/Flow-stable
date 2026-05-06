import { z } from 'zod/v3'
import { StructuredTool } from '@langchain/core/tools'
import { A2AStorageAdapter } from '../../../src/A2AStorageAdapter'
import type { A2ASession, A2AClaim, A2ADecision, A2AObservation } from '../../../src/A2AStorageAdapter'

const SessionInput = z.object({
    topic: z.string().min(1).max(512).describe('Deliberation session topic'),
    participants: z.array(z.string().uuid()).describe('Agent UUIDs participating')
})

const ClaimInput = z.object({
    sessionId: z.string().uuid().describe('Session UUID'),
    agentId: z.string().uuid().describe('Claiming agent UUID'),
    claim: z.string().max(4096).describe('The claim text'),
    evidence: z.array(z.string()).optional().default([]).describe('Supporting evidence'),
    confidence: z.number().min(0).max(1).optional().default(1.0).describe('Confidence 0-1')
})

const DecisionInput = z.object({
    sessionId: z.string().uuid().describe('Session UUID'),
    decision: z.string().max(4096).describe('The decision text'),
    rationale: z.string().max(8192).optional().default('').describe('Decision rationale'),
    basedOnClaims: z.array(z.string().uuid()).min(1).describe('Claim UUIDs this decision resolves'),
    agreedBy: z.array(z.string().uuid()).optional().default([]).describe('Agent UUIDs agreeing')
})

const ObservationInput = z.object({
    sessionId: z.string().uuid().describe('Session UUID'),
    agentId: z.string().uuid().describe('Observing agent UUID'),
    observation: z.string().max(4096).describe('The observation text')
})

// ---------------------------------------------------------------------------
// SessionCreateTool
// ---------------------------------------------------------------------------
export class SessionCreateTool extends StructuredTool {
    name = 'a2a_session_create'
    description = 'Create a new A2A deliberation session. Sessions track multi-agent discussions with claims, observations, and decisions.'

    schema = SessionInput

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof this.schema>): Promise<string> {
        const session: A2ASession = {
            ...input,
            id: crypto.randomUUID(),
            status: 'open'
        } as A2ASession
        return this.adapter.createSession(session)
    }
}

// ---------------------------------------------------------------------------
// SessionGetTool
// ---------------------------------------------------------------------------
export class SessionGetTool extends StructuredTool {
    name = 'a2a_session_get'
    description = 'Retrieve an A2A deliberation session by UUID.'

    schema = z.object({
        sessionId: z.string().uuid().describe('Session UUID')
    })

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof this.schema>): Promise<A2ASession | null> {
        return this.adapter.getSession(input.sessionId)
    }
}

// ---------------------------------------------------------------------------
// ClaimAddTool
// ---------------------------------------------------------------------------
export class ClaimAddTool extends StructuredTool {
    name = 'a2a_claim_add'
    description = 'Add a claim to an A2A deliberation session. Claims are statements made by agents during deliberation.'

    schema = ClaimInput

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof this.schema>): Promise<string> {
        const claim: A2AClaim = {
            ...input,
            id: crypto.randomUUID()
        } as A2AClaim
        return this.adapter.addClaim(input.sessionId, claim)
    }
}

// ---------------------------------------------------------------------------
// ClaimsGetTool
// ---------------------------------------------------------------------------
export class ClaimsGetTool extends StructuredTool {
    name = 'a2a_claim_get'
    description = 'Retrieve all claims for an A2A deliberation session.'

    schema = z.object({
        sessionId: z.string().uuid().describe('Session UUID')
    })

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof this.schema>): Promise<A2AClaim[]> {
        return this.adapter.getClaims(input.sessionId)
    }
}

// ---------------------------------------------------------------------------
// ObservationAddTool
// ---------------------------------------------------------------------------
export class ObservationAddTool extends StructuredTool {
    name = 'a2a_observation_add'
    description = 'Add an observation to an A2A deliberation session. Observations are evidence or perspectives linked to claims.'

    schema = ObservationInput

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof this.schema>): Promise<string> {
        const obs: A2AObservation = {
            ...input,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString()
        } as A2AObservation
        return this.adapter.addObservation(input.sessionId, obs)
    }
}

// ---------------------------------------------------------------------------
// DecisionAddTool
// ---------------------------------------------------------------------------
export class DecisionAddTool extends StructuredTool {
    name = 'a2a_decision_add'
    description = 'Record a decision in an A2A deliberation session. Decisions resolve one or more claims and include a rationale.'

    schema = DecisionInput

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof this.schema>): Promise<string> {
        const decision: A2ADecision = {
            ...input,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString()
        } as A2ADecision
        return this.adapter.addDecision(input.sessionId, decision)
    }
}

// ---------------------------------------------------------------------------
// DecisionsGetTool
// ---------------------------------------------------------------------------
export class DecisionsGetTool extends StructuredTool {
    name = 'a2a_decision_get'
    description = 'Retrieve all decisions for an A2A deliberation session.'

    schema = z.object({
        sessionId: z.string().uuid().describe('Session UUID')
    })

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof this.schema>): Promise<A2ADecision[]> {
        return this.adapter.getDecisions(input.sessionId)
    }
}
