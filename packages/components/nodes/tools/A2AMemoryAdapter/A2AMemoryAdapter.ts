import { ICommonObject, INode, INodeData, INodeParams, IDatabaseEntity } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { DataSource } from 'typeorm'
import { createAdapter } from '../A2AStorage/A2AStorageFactory'
import { A2AStorageMemory } from './core'
import type { A2AStorageAdapter } from '../../../src/A2AStorageAdapter'

class A2AMemoryAdapter_Tools implements INode {
    label = 'A2A Memory Adapter'
    name = 'a2aMemoryAdapter'
    version = 1.0
    type = 'A2AMemoryAdapter'
    icon = 'a2amemory.svg'
    category = 'Memory'
    description = 'Hybrid memory bridging Flowise conversation history with A2A structured context (claims, decisions, observations)'
    baseClasses = [this.type, ...getBaseClasses(A2AStorageMemory)]
    badge = ''

    loadMethods = {}

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
            label: 'Session Id',
            name: 'sessionId',
            type: 'string',
            description: 'If not specified, the default session will be used',
            default: '',
            additionalParams: true,
            optional: true
        },
        {
            label: 'Memory Key',
            name: 'memoryKey',
            type: 'string',
            default: 'a2a_context',
            additionalParams: true
        },
        {
            label: 'Supabase Project URL',
            name: 'supabaseProjUrl',
            type: 'string',
            optional: true,
            additionalParams: true
        }
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
        const sessionId = (nodeData.inputs?.sessionId as string) || options.sessionId || options.chatId || ''
        const memoryKey = (nodeData.inputs?.memoryKey as string) || 'a2a_context'

        const config: Record<string, unknown> = {}
        if (nodeData.inputs?.supabaseProjUrl) config.supabaseProjUrl = nodeData.inputs.supabaseProjUrl
        if (options) Object.assign(config, options)

        const adapter: A2AStorageAdapter = await createAdapter(storageBackend, config)

        const appDataSource = options.appDataSource as DataSource
        const databaseEntities = options.databaseEntities as IDatabaseEntity
        const chatflowid = options.chatflowid as string
        const orgId = options.orgId as string

        return new A2AStorageMemory({
            sessionId,
            memoryKey,
            returnMessages: true,
            appDataSource,
            databaseEntities,
            chatflowid,
            orgId,
            adapter
        })
    }
}

module.exports = { nodeClass: A2AMemoryAdapter_Tools }
