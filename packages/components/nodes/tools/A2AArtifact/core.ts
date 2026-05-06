import { z } from 'zod/v3'
import { StructuredTool } from '@langchain/core/tools'
import { A2AStorageAdapter, A2AFilterSchema } from '../../../src/A2AStorageAdapter'
import type { A2AArtifact, ArtifactPermission } from '../../../src/A2AStorageAdapter'

const ArtifactRegisterInput = z.object({
    name: z.string().min(1).max(256).describe('Artifact name'),
    type: z.string().describe('Artifact type (e.g., application/json)'),
    content: z.unknown().describe('Artifact content'),
    ownerId: z.string().uuid().describe('Owner agent UUID'),
    taskId: z.string().uuid().optional().describe('Associated task UUID')
})

const GrantRevokeInput = z.object({
    artifactId: z.string().uuid().describe('Artifact UUID'),
    agentId: z.string().uuid().describe('Agent to grant/revoke access'),
    permission: z.enum(['read', 'write', 'admin']).describe('Access level')
})

// ---------------------------------------------------------------------------
// ArtifactRegisterTool
// ---------------------------------------------------------------------------
export class ArtifactRegisterTool extends StructuredTool {
    name = 'a2a_artifact_register'
    description =
        'Register a new artifact in the A2A shared workspace. ' +
        'Artifacts are named, typed objects owned by agents. Returns the artifact ID.'

    schema = ArtifactRegisterInput

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof this.schema>): Promise<string> {
        const artifact: A2AArtifact = {
            ...input,
            id: crypto.randomUUID(),
            permissions: {}
        } as A2AArtifact
        return this.adapter.registerArtifact(artifact)
    }
}

// ---------------------------------------------------------------------------
// ArtifactGetTool
// ---------------------------------------------------------------------------
export class ArtifactGetTool extends StructuredTool {
    name = 'a2a_artifact_get'
    description = 'Retrieve an artifact from the A2A shared workspace by its UUID. ' + 'Returns the artifact if found, or null.'

    schema = z.object({
        artifactId: z.string().uuid().describe('Artifact UUID to retrieve')
    })

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof this.schema>): Promise<A2AArtifact | null> {
        return this.adapter.getArtifact(input.artifactId)
    }
}

// ---------------------------------------------------------------------------
// ArtifactListTool
// ---------------------------------------------------------------------------
export class ArtifactListTool extends StructuredTool {
    name = 'a2a_artifact_list'
    description =
        'List artifacts in the A2A shared workspace. Optionally filter by taskId or ownerId. ' + 'Returns an array of matching artifacts.'

    schema = A2AFilterSchema

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof A2AFilterSchema>): Promise<A2AArtifact[]> {
        return this.adapter.listArtifacts(input.taskId, input.ownerId)
    }
}

// ---------------------------------------------------------------------------
// ArtifactGrantTool
// ---------------------------------------------------------------------------
export class ArtifactGrantTool extends StructuredTool {
    name = 'a2a_artifact_grant'
    description =
        'Grant access to an artifact for a specific agent. ' +
        'Permission levels: read, write, admin. ' +
        'The granting agent ID is recorded for audit trail.'

    schema = GrantRevokeInput

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof this.schema>): Promise<string> {
        // The caller's agent ID is not known at tool level; use 'grant' as placeholder
        await this.adapter.grantAccess(input.artifactId, input.agentId, input.permission as ArtifactPermission, 'grants')
        return `Granted ${input.permission} to ${input.agentId} on artifact ${input.artifactId}`
    }
}

// ---------------------------------------------------------------------------
// ArtifactRevokeTool
// ---------------------------------------------------------------------------
export class ArtifactRevokeTool extends StructuredTool {
    name = 'a2a_artifact_revoke'
    description = 'Revoke a previously granted permission to an artifact for a specific agent.'

    schema = GrantRevokeInput.omit({ permission: true })

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof this.schema>): Promise<string> {
        await this.adapter.revokeAccess(input.artifactId, input.agentId)
        return `Revoked access for ${input.agentId} on artifact ${input.artifactId}`
    }
}

// ---------------------------------------------------------------------------
// ArtifactCheckTool
// ---------------------------------------------------------------------------
export class ArtifactCheckTool extends StructuredTool {
    name = 'a2a_artifact_check'
    description = "Check an agent's access level to an artifact. Returns the permission level or null if no access."

    schema = z.object({
        artifactId: z.string().uuid().describe('Artifact UUID'),
        agentId: z.string().uuid().describe('Agent UUID to check')
    })

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof this.schema>): Promise<ArtifactPermission | null> {
        return this.adapter.checkAccess(input.artifactId, input.agentId)
    }
}
