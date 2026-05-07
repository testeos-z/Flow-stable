import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { createAdapter } from '../A2AStorage/A2AStorageFactory'
import {
    SessionCreateTool,
    SessionGetTool,
    ClaimAddTool,
    ClaimsGetTool,
    ObservationAddTool,
    DecisionAddTool,
    DecisionsGetTool
} from './core'
import type { A2AStorageAdapter } from '../../../src/A2AStorageAdapter'

class A2ASharedContext_Tools implements INode {
    label = 'A2A Shared Context'
    name = 'a2aSharedContext'
    version = 1.0
    type = 'A2ASharedContext'
    icon = 'a2asharedcontext.svg'
    category = 'Tools'
    description = 'Create deliberation sessions with claims, observations, and decisions. Preserves full provenance chain.'
    baseClasses = [this.type, ...getBaseClasses(SessionCreateTool)]
    badge = ''
    loadMethods: Record<string, (nodeData: INodeData, options?: ICommonObject) => Promise<INodeOptionsValue[]>> = {}
    inputs: INodeParams[] = [
        {
            label: 'Storage Backend',
            name: 'storageBackend',
            type: 'options',
            options: [
                { label: 'Local JSON', name: 'localjson' },
                { label: 'Supabase', name: 'supabase' },
                { label: 'PostgreSQL', name: 'postgres' },
                { label: 'SQLite', name: 'sqlite' }
            ],
            default: 'localjson'
        },
        {
            label: 'Operation',
            name: 'operation',
            type: 'options',
            options: [
                { label: 'Create Session', name: 'createSession' },
                { label: 'Get Session', name: 'getSession' },
                { label: 'Add Claim', name: 'addClaim' },
                { label: 'Get Claims', name: 'getClaims' },
                { label: 'Add Observation', name: 'addObservation' },
                { label: 'Add Decision', name: 'addDecision' },
                { label: 'Get Decisions', name: 'getDecisions' }
            ],
            default: 'getClaims'
        },
        { label: 'Supabase Project URL', name: 'supabaseProjUrl', type: 'string', optional: true, additionalParams: true }
    ]
    credential: INodeParams = {
        label: 'Connect Credential',
        name: 'credential',
        type: 'credential',
        credentialNames: ['supabaseApi'],
        optional: true
    }

    async init(nodeData: INodeData, _input: string, options: ICommonObject): Promise<any> {
        const storageBackend = (nodeData.inputs?.storageBackend as string) || 'localjson'
        const operation = (nodeData.inputs?.operation as string) || 'getClaims'
        const config: Record<string, unknown> = {}
        if (nodeData.inputs?.supabaseProjUrl) config.supabaseProjUrl = nodeData.inputs.supabaseProjUrl
        if (options) Object.assign(config, options)
        const adapter: A2AStorageAdapter = await createAdapter(storageBackend, config)
        switch (operation) {
            case 'createSession':
                return new SessionCreateTool(adapter)
            case 'getSession':
                return new SessionGetTool(adapter)
            case 'addClaim':
                return new ClaimAddTool(adapter)
            case 'getClaims':
                return new ClaimsGetTool(adapter)
            case 'addObservation':
                return new ObservationAddTool(adapter)
            case 'addDecision':
                return new DecisionAddTool(adapter)
            case 'getDecisions':
                return new DecisionsGetTool(adapter)
            default:
                throw new Error(`Unknown operation: ${operation}`)
        }
    }
}

module.exports = { nodeClass: A2ASharedContext_Tools }
