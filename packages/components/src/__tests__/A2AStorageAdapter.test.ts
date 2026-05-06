import {
    AgentCardSchema,
    A2ATaskSchema,
    A2AMessageSchema,
    A2AArtifactSchema,
    A2ASessionSchema,
    A2AClaimSchema,
    A2ADecisionSchema,
    A2AObservationSchema,
    A2AFilterSchema
} from '../A2AStorageAdapter'

// ---------------------------------------------------------------------------
// Shared test helpers
// ---------------------------------------------------------------------------

const UUID_A = '550e8400-e29b-41d4-a716-446655440000'
const UUID_B = '123e4567-e89b-12d3-a456-426614174000'
const UUID_C = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const VALID_DATETIME = '2026-05-06T12:00:00.000Z'

const label = (description: string): string => description

// ---------------------------------------------------------------------------
// AgentCardSchema
// ---------------------------------------------------------------------------

const validAgentCard = {
    id: UUID_A,
    name: 'Agent Smith',
    description: 'A helpful agent for testing, fact-checking and summarization.',
    capabilities: ['fact-checking', 'summarization'],
    mcpEndpoints: ['https://mcp.example.com/a2a'],
    artifactTypes: ['report', 'analysis'],
    ownerId: UUID_B,
    status: 'active',
    metadata: { version: '1.0', customField: true }
}

describe('AgentCardSchema', () => {
    describe('valid cards', () => {
        it('should parse a fully populated agent card', () => {
            const result = AgentCardSchema.safeParse(validAgentCard)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.id).toBe(UUID_A)
                expect(result.data.name).toBe('Agent Smith')
                expect(result.data.status).toBe('active')
                expect(result.data.capabilities).toEqual(['fact-checking', 'summarization'])
                expect(result.data.mcpEndpoints).toEqual(['https://mcp.example.com/a2a'])
                expect(result.data.metadata).toEqual({ version: '1.0', customField: true })
            }
        })

        it('should apply defaults for optional fields', () => {
            const minimal = {
                id: UUID_A,
                name: 'Minimal Agent',
                description: 'Bare minimum.',
                capabilities: ['ping'],
                ownerId: UUID_B,
                status: 'idle'
            }
            const result = AgentCardSchema.safeParse(minimal)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.mcpEndpoints).toEqual([])
                expect(result.data.artifactTypes).toEqual([])
                expect(result.data.metadata).toEqual({})
            }
        })

        it('should silently ignore extra unknown fields', () => {
            const enriched = { ...validAgentCard, extraField: 'should-be-ignored', foo: 42 }
            const result = AgentCardSchema.safeParse(enriched)
            expect(result.success).toBe(true)
        })
    })

    describe('invalid cards', () => {
        it.each([
            [label('missing id'), { ...validAgentCard, id: undefined }],
            [label('empty string id'), { ...validAgentCard, id: '' }],
            [label('non-uuid id'), { ...validAgentCard, id: 'not-a-uuid' }],
            [label('missing name'), { ...validAgentCard, name: undefined }],
            [label('empty name'), { ...validAgentCard, name: '' }],
            [label('name exceeds 128 chars'), { ...validAgentCard, name: 'A'.repeat(129) }],
            [label('description exceeds 1024 chars'), { ...validAgentCard, description: 'D'.repeat(1025) }],
            [label('invalid status'), { ...validAgentCard, status: 'running' }],
            [label('missing capabilities'), { ...validAgentCard, capabilities: undefined }],
            [label('capabilities not an array'), { ...validAgentCard, capabilities: 'fact-checking' }],
            [label('missing ownerId'), { ...validAgentCard, ownerId: undefined }],
            [label('non-uuid ownerId'), { ...validAgentCard, ownerId: 'bad-uuid' }],
            [label('mcpEndpoints with non-url string'), { ...validAgentCard, mcpEndpoints: ['not-a-url'] }]
        ])('should reject %s', (_desc, input) => {
            const result = AgentCardSchema.safeParse(input)
            expect(result.success).toBe(false)
        })
    })
})

// ---------------------------------------------------------------------------
// A2ATaskSchema
// ---------------------------------------------------------------------------

const validTask = {
    id: UUID_A,
    title: 'Research housing policy',
    description: 'Analyze current housing policies and provide recommendations.',
    status: 'submitted',
    requesterId: UUID_B,
    assigneeId: UUID_C,
    artifactIds: [UUID_A],
    sessionId: UUID_B,
    result: { recommendation: 'Increase density' },
    metadata: { priority: 'high' }
}

describe('A2ATaskSchema', () => {
    describe('valid tasks', () => {
        it('should parse a fully populated task', () => {
            const result = A2ATaskSchema.safeParse(validTask)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.title).toBe('Research housing policy')
                expect(result.data.status).toBe('submitted')
                expect(result.data.requesterId).toBe(UUID_B)
            }
        })

        it('should apply defaults for optional fields', () => {
            const minimal = { id: UUID_A, title: 'Minimal', description: 'Test', status: 'submitted', requesterId: UUID_B }
            const result = A2ATaskSchema.safeParse(minimal)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.artifactIds).toEqual([])
                expect(result.data.metadata).toEqual({})
            }
        })

        it('should accept all valid statuses', () => {
            for (const status of ['submitted', 'working', 'completed', 'failed', 'canceled']) {
                const result = A2ATaskSchema.safeParse({ ...validTask, status })
                expect(result.success).toBe(true)
            }
        })
    })

    describe('invalid tasks', () => {
        it.each([
            [label('missing title'), { ...validTask, title: undefined }],
            [label('empty title'), { ...validTask, title: '' }],
            [label('title exceeds 256 chars'), { ...validTask, title: 'T'.repeat(257) }],
            [label('description exceeds 4096 chars'), { ...validTask, description: 'D'.repeat(4097) }],
            [label('invalid status'), { ...validTask, status: 'paused' }],
            [label('missing requesterId'), { ...validTask, requesterId: undefined }],
            [label('non-uuid requesterId'), { ...validTask, requesterId: 'nope' }],
            [label('non-uuid assigneeId'), { ...validTask, assigneeId: 'nope' }]
        ])('should reject %s', (_desc, input) => {
            const result = A2ATaskSchema.safeParse(input)
            expect(result.success).toBe(false)
        })
    })
})

// ---------------------------------------------------------------------------
// A2AMessageSchema
// ---------------------------------------------------------------------------

const validMessage = {
    id: UUID_A,
    taskId: UUID_B,
    senderId: UUID_C,
    content: 'Please analyze the attached report for policy compliance.',
    role: 'instruction',
    timestamp: VALID_DATETIME
}

describe('A2AMessageSchema', () => {
    describe('valid messages', () => {
        it('should parse a valid message', () => {
            const result = A2AMessageSchema.safeParse(validMessage)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.content).toBe(validMessage.content)
                expect(result.data.role).toBe('instruction')
                expect(result.data.timestamp).toBe(VALID_DATETIME)
            }
        })

        it('should accept all valid roles', () => {
            for (const role of ['instruction', 'query', 'response', 'status', 'error']) {
                const result = A2AMessageSchema.safeParse({ ...validMessage, role })
                expect(result.success).toBe(true)
            }
        })
    })

    describe('invalid messages', () => {
        it.each([
            [label('content exceeds 32768 chars'), { ...validMessage, content: 'C'.repeat(32769) }],
            [label('invalid role'), { ...validMessage, role: 'feedback' }],
            [label('non-uuid senderId'), { ...validMessage, senderId: 'nope' }],
            [label('non-uuid taskId'), { ...validMessage, taskId: 'nope' }],
            [label('missing timestamp'), { ...validMessage, timestamp: undefined }],
            [label('non-datetime timestamp'), { ...validMessage, timestamp: 'yesterday' }]
        ])('should reject %s', (_desc, input) => {
            const result = A2AMessageSchema.safeParse(input)
            expect(result.success).toBe(false)
        })
    })
})

// ---------------------------------------------------------------------------
// A2AArtifactSchema
// ---------------------------------------------------------------------------

const validArtifact = {
    id: UUID_A,
    taskId: UUID_B,
    name: 'Policy Analysis v2',
    type: 'application/json',
    content: { sections: ['intro', 'analysis', 'conclusion'] },
    ownerId: UUID_C,
    permissions: { [UUID_B]: 'read', [UUID_C]: 'admin' }
}

describe('A2AArtifactSchema', () => {
    describe('valid artifacts', () => {
        it('should parse a valid artifact', () => {
            const result = A2AArtifactSchema.safeParse(validArtifact)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.name).toBe('Policy Analysis v2')
                expect(result.data.type).toBe('application/json')
                expect(result.data.permissions).toEqual(validArtifact.permissions)
            }
        })

        it('should apply defaults for optional fields', () => {
            const minimal = { id: UUID_A, name: 'Minimal', type: 'text', content: 'data', ownerId: UUID_B }
            const result = A2AArtifactSchema.safeParse(minimal)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.permissions).toEqual({})
            }
        })

        it('should accept valid permission values', () => {
            const perms = { [UUID_B]: 'read', [UUID_C]: 'write', [UUID_A]: 'admin' }
            const result = A2AArtifactSchema.safeParse({ ...validArtifact, permissions: perms })
            expect(result.success).toBe(true)
            if (result.success) expect(result.data.permissions).toEqual(perms)
        })

        it('should silently ignore extra unknown fields', () => {
            const result = A2AArtifactSchema.safeParse({ ...validArtifact, color: 'blue' })
            expect(result.success).toBe(true)
        })
    })

    describe('invalid artifacts', () => {
        it.each([
            [label('missing name'), { ...validArtifact, name: undefined }],
            [label('empty name'), { ...validArtifact, name: '' }],
            [label('name exceeds 256 chars'), { ...validArtifact, name: 'A'.repeat(257) }],
            [label('missing ownerId'), { ...validArtifact, ownerId: undefined }],
            [label('non-uuid ownerId'), { ...validArtifact, ownerId: 'bad' }],
            [label('invalid permission value'), { ...validArtifact, permissions: { [UUID_B]: 'execute' } }]
        ])('should reject %s', (_desc, input) => {
            const result = A2AArtifactSchema.safeParse(input)
            expect(result.success).toBe(false)
        })
    })
})

// ---------------------------------------------------------------------------
// A2ASessionSchema
// ---------------------------------------------------------------------------

const validSession = {
    id: UUID_A,
    topic: 'Housing policy deliberation',
    participants: [UUID_A, UUID_B, UUID_C],
    status: 'open',
    decision: 'Increase density by 20%'
}

describe('A2ASessionSchema', () => {
    describe('valid sessions', () => {
        it('should parse a valid session', () => {
            const result = A2ASessionSchema.safeParse(validSession)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.topic).toBe('Housing policy deliberation')
                expect(result.data.participants).toHaveLength(3)
                expect(result.data.status).toBe('open')
            }
        })

        it('should accept all valid statuses', () => {
            for (const status of ['open', 'deliberating', 'decided', 'closed']) {
                const result = A2ASessionSchema.safeParse({ ...validSession, status })
                expect(result.success).toBe(true)
            }
        })

        it('should silently ignore extra unknown fields', () => {
            const result = A2ASessionSchema.safeParse({ ...validSession, notes: 'test notes' })
            expect(result.success).toBe(true)
        })
    })

    describe('invalid sessions', () => {
        it.each([
            [label('empty topic'), { ...validSession, topic: '' }],
            [label('topic exceeds 512 chars'), { ...validSession, topic: 'T'.repeat(513) }],
            [label('invalid status'), { ...validSession, status: 'archived' }],
            [label('missing participants'), { ...validSession, participants: undefined }],
            [label('participant with non-uuid'), { ...validSession, participants: [UUID_A, 'not-uuid'] }]
        ])('should reject %s', (_desc, input) => {
            const result = A2ASessionSchema.safeParse(input)
            expect(result.success).toBe(false)
        })
    })
})

// ---------------------------------------------------------------------------
// A2AClaimSchema
// ---------------------------------------------------------------------------

const validClaim = {
    id: UUID_A,
    sessionId: UUID_B,
    agentId: UUID_C,
    claim: 'Current housing policies disproportionately affect low-income residents.',
    evidence: ['2025 census data', 'HUD report Q3'],
    confidence: 0.85
}

describe('A2AClaimSchema', () => {
    describe('valid claims', () => {
        it('should parse a valid claim', () => {
            const result = A2AClaimSchema.safeParse(validClaim)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.claim).toBe(validClaim.claim)
                expect(result.data.confidence).toBe(0.85)
                expect(result.data.evidence).toEqual(validClaim.evidence)
            }
        })

        it('should apply defaults for evidence (empty array)', () => {
            const result = A2AClaimSchema.safeParse({ ...validClaim, evidence: undefined })
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.evidence).toEqual([])
            }
        })

        it('should accept boundary confidence values 0 and 1', () => {
            expect(A2AClaimSchema.safeParse({ ...validClaim, confidence: 0 }).success).toBe(true)
            expect(A2AClaimSchema.safeParse({ ...validClaim, confidence: 1 }).success).toBe(true)
        })
    })

    describe('invalid claims', () => {
        it.each([
            [label('confidence > 1'), { ...validClaim, confidence: 1.01 }],
            [label('confidence < 0'), { ...validClaim, confidence: -0.01 }],
            [label('confidence negative'), { ...validClaim, confidence: -5 }],
            [label('missing agentId'), { ...validClaim, agentId: undefined }],
            [label('non-uuid agentId'), { ...validClaim, agentId: 'nope' }],
            [label('missing sessionId'), { ...validClaim, sessionId: undefined }],
            [label('claim exceeds 4096 chars'), { ...validClaim, claim: 'C'.repeat(4097) }]
        ])('should reject %s', (_desc, input) => {
            const result = A2AClaimSchema.safeParse(input)
            expect(result.success).toBe(false)
        })
    })
})

// ---------------------------------------------------------------------------
// A2ADecisionSchema
// ---------------------------------------------------------------------------

const validDecision = {
    id: UUID_A,
    sessionId: UUID_B,
    decision: 'Increase housing density by 20% in urban zones.',
    rationale:
        'Evidence shows increased density lowers per-unit costs and improves affordability. Census data confirms current shortage of 50K units.',
    basedOnClaims: [UUID_A, UUID_B],
    agreedBy: [UUID_A, UUID_B, UUID_C],
    timestamp: VALID_DATETIME
}

describe('A2ADecisionSchema', () => {
    describe('valid decisions', () => {
        it('should parse a valid decision', () => {
            const result = A2ADecisionSchema.safeParse(validDecision)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.decision).toBe(validDecision.decision)
                expect(result.data.basedOnClaims).toHaveLength(2)
                expect(result.data.agreedBy).toHaveLength(3)
            }
        })

        it('should silently ignore extra unknown fields', () => {
            const result = A2ADecisionSchema.safeParse({ ...validDecision, notes: 'test' })
            expect(result.success).toBe(true)
        })
    })

    describe('invalid decisions', () => {
        it.each([
            [label('missing basedOnClaims'), { ...validDecision, basedOnClaims: undefined }],
            [label('empty basedOnClaims array'), { ...validDecision, basedOnClaims: [] }],
            [label('basedOnClaims with non-uuid'), { ...validDecision, basedOnClaims: ['not-uuid'] }],
            [label('empty rationale'), { ...validDecision, rationale: '' }],
            [label('rationale exceeds 8192 chars'), { ...validDecision, rationale: 'R'.repeat(8193) }],
            [label('missing decision text'), { ...validDecision, decision: undefined }],
            [label('decision exceeds 4096 chars'), { ...validDecision, decision: 'D'.repeat(4097) }],
            [label('missing timestamp'), { ...validDecision, timestamp: undefined }],
            [label('non-uuid sessionId'), { ...validDecision, sessionId: 'bad' }]
        ])('should reject %s', (_desc, input) => {
            const result = A2ADecisionSchema.safeParse(input)
            expect(result.success).toBe(false)
        })
    })
})

// ---------------------------------------------------------------------------
// A2AObservationSchema
// ---------------------------------------------------------------------------

const validObservation = {
    id: UUID_A,
    sessionId: UUID_B,
    agentId: UUID_C,
    observation: 'Census data confirms the housing unit shortage of approximately 50,000 units.',
    timestamp: VALID_DATETIME
}

describe('A2AObservationSchema', () => {
    describe('valid observations', () => {
        it('should parse a valid observation', () => {
            const result = A2AObservationSchema.safeParse(validObservation)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.observation).toBe(validObservation.observation)
                expect(result.data.agentId).toBe(UUID_C)
            }
        })
    })

    describe('invalid observations', () => {
        it.each([
            [label('missing agentId'), { ...validObservation, agentId: undefined }],
            [label('non-uuid agentId'), { ...validObservation, agentId: 'nope' }],
            [label('missing sessionId'), { ...validObservation, sessionId: undefined }],
            [label('empty observation text'), { ...validObservation, observation: '' }],
            [label('observation exceeds 4096 chars'), { ...validObservation, observation: 'O'.repeat(4097) }]
        ])('should reject %s', (_desc, input) => {
            const result = A2AObservationSchema.safeParse(input)
            expect(result.success).toBe(false)
        })
    })
})

// ---------------------------------------------------------------------------
// A2AFilterSchema
// ---------------------------------------------------------------------------

describe('A2AFilterSchema', () => {
    describe('valid filters', () => {
        it('should parse a fully populated filter', () => {
            const filter = {
                capability: 'fact-checking',
                status: 'active',
                agentId: UUID_A,
                taskId: UUID_B,
                ownerId: UUID_C,
                mcpEndpoint: 'https://mcp.example.com',
                artifactType: 'report',
                limit: 50,
                offset: 10
            }
            const result = A2AFilterSchema.safeParse(filter)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.limit).toBe(50)
                expect(result.data.offset).toBe(10)
            }
        })

        it('should parse an empty filter with defaults', () => {
            const result = A2AFilterSchema.safeParse({})
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.limit).toBe(20)
                expect(result.data.offset).toBe(0)
            }
        })

        it('should accept limit at boundary 100', () => {
            const result = A2AFilterSchema.safeParse({ limit: 100 })
            expect(result.success).toBe(true)
            if (result.success) expect(result.data.limit).toBe(100)
        })

        it('should accept limit at boundary 1', () => {
            const result = A2AFilterSchema.safeParse({ limit: 1 })
            expect(result.success).toBe(true)
            if (result.success) expect(result.data.limit).toBe(1)
        })

        it('should accept offset at boundary 0', () => {
            const result = A2AFilterSchema.safeParse({ offset: 0 })
            expect(result.success).toBe(true)
            if (result.success) expect(result.data.offset).toBe(0)
        })

        it('should silently ignore extra unknown fields', () => {
            const result = A2AFilterSchema.safeParse({ color: 'red', sortBy: 'name' })
            expect(result.success).toBe(true)
        })
    })

    describe('invalid filters', () => {
        it.each([
            [label('limit 0 (below min)'), { limit: 0 }],
            [label('limit 101 (above max)'), { limit: 101 }],
            [label('offset negative'), { offset: -1 }]
        ])('should reject %s', (_desc, input) => {
            const result = A2AFilterSchema.safeParse(input)
            expect(result.success).toBe(false)
        })
    })
})
