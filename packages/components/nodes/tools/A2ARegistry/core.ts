import { z } from 'zod/v3'
import { StructuredTool } from '@langchain/core/tools'
import { A2AStorageAdapter, AgentCardSchema, A2AFilterSchema } from '../../../src/A2AStorageAdapter'
import type { AgentCard, AgentStatus, A2AFilter } from '../../../src/A2AStorageAdapter'

// ---------------------------------------------------------------------------
// RegistryRegisterTool
// ---------------------------------------------------------------------------

export class RegistryRegisterTool extends StructuredTool {
    name = 'a2a_registry_register'
    description =
        'Register a new agent in the A2A registry with its Agent Card. ' +
        'The card must include id (UUID), name, description, capabilities (string array), ' +
        'ownerId (UUID), and optionally mcpEndpoints, artifactTypes, and metadata. ' +
        'Returns the agent ID on success.'

    schema = AgentCardSchema

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof AgentCardSchema>): Promise<string> {
        return this.adapter.registerAgent(input as AgentCard)
    }
}

// ---------------------------------------------------------------------------
// RegistryGetTool
// ---------------------------------------------------------------------------

export class RegistryGetTool extends StructuredTool {
    name = 'a2a_registry_get'
    description =
        'Retrieve an agent from the A2A registry by its UUID. ' +
        'Returns the full AgentCard if found, or null if the agent is not registered.'

    schema = z.object({
        agentId: z.string().uuid().describe('The UUID of the agent to retrieve')
    })

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof this.schema>): Promise<AgentCard | null> {
        return this.adapter.getAgent(input.agentId)
    }
}

// ---------------------------------------------------------------------------
// RegistryFindTool
// ---------------------------------------------------------------------------

export class RegistryFindTool extends StructuredTool {
    name = 'a2a_registry_find'
    description =
        'Find agents in the A2A registry matching the given filters. ' +
        'You can filter by capability (string match in capabilities array), ' +
        'status (active|idle|offline), mcpEndpoint (URL), or artifactType. ' +
        'Returns an array of matching AgentCards (empty array if none match).'

    schema = A2AFilterSchema

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof A2AFilterSchema>): Promise<AgentCard[]> {
        return this.adapter.findAgents(input as A2AFilter)
    }
}

// ---------------------------------------------------------------------------
// RegistryUpdateTool
// ---------------------------------------------------------------------------

export class RegistryUpdateTool extends StructuredTool {
    name = 'a2a_registry_update'
    description =
        'Update the status of an agent in the A2A registry. ' +
        'Valid statuses: active, idle, offline. ' +
        'This is used by agents to signal their availability.'

    schema = z.object({
        agentId: z.string().uuid().describe('The UUID of the agent to update'),
        status: z.enum(['active', 'idle', 'offline']).describe('The new status for the agent')
    })

    private adapter: A2AStorageAdapter

    constructor(adapter: A2AStorageAdapter) {
        super()
        this.adapter = adapter
    }

    async _call(input: z.input<typeof this.schema>): Promise<string> {
        await this.adapter.updateAgentStatus(input.agentId, input.status as AgentStatus)
        return `Agent ${input.agentId} status updated to ${input.status}`
    }
}
