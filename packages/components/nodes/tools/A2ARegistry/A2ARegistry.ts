import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { createAdapter } from '../A2AStorage/A2AStorageFactory'
import { RegistryRegisterTool, RegistryGetTool, RegistryFindTool, RegistryUpdateTool } from './core'
import type { A2AStorageAdapter } from '../../../src/A2AStorageAdapter'

/**
 * A2A Registry — Register and discover agents with capabilities, MCP endpoints, and artifact types
 */
class A2ARegistry_Tools implements INode {
    label = 'A2A Registry'
    name = 'a2aRegistry'
    version = 1.0
    type = 'A2ARegistry'
    icon = 'a2aregistry.svg'
    category = 'Tools'
    description = 'Register and discover agents with capabilities, MCP endpoints, and artifact types'
    baseClasses = [this.type, ...getBaseClasses(RegistryRegisterTool)]
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
                { label: 'Register Agent', name: 'register' },
                { label: 'Get Agent', name: 'get' },
                { label: 'Find Agents', name: 'find' },
                { label: 'Update Status', name: 'updateStatus' }
            ],
            default: 'find'
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
        const operation = (nodeData.inputs?.operation as string) || 'find'

        // Build adapter config from node inputs
        const config: Record<string, unknown> = {}
        if (nodeData.inputs?.supabaseProjUrl) {
            config.supabaseProjUrl = nodeData.inputs.supabaseProjUrl
        }
        // Pass the credential (Supabase API key) if available
        if (options) {
            Object.assign(config, options)
        }

        const adapter: A2AStorageAdapter = await createAdapter(storageBackend, config)

        switch (operation) {
            case 'register':
                return new RegistryRegisterTool(adapter)
            case 'get':
                return new RegistryGetTool(adapter)
            case 'find':
                return new RegistryFindTool(adapter)
            case 'updateStatus':
                return new RegistryUpdateTool(adapter)
            default:
                throw new Error(`Unknown operation: ${operation}. Valid options: register, get, find, updateStatus`)
        }
    }
}

module.exports = { nodeClass: A2ARegistry_Tools }
