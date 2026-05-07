import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { createAdapter } from '../A2AStorage/A2AStorageFactory'
import { ArtifactRegisterTool, ArtifactGetTool, ArtifactListTool, ArtifactGrantTool, ArtifactRevokeTool, ArtifactCheckTool } from './core'
import type { A2AStorageAdapter } from '../../../src/A2AStorageAdapter'

class A2AArtifact_Tools implements INode {
    label = 'A2A Artifact'
    name = 'a2aArtifact'
    version = 1.0
    type = 'A2AArtifact'
    icon = 'a2aartifact.svg'
    category = 'Tools'
    description = 'Register, share, and control access to A2A artifacts with ownership and permission grants'
    baseClasses = [this.type, ...getBaseClasses(ArtifactRegisterTool)]
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
                { label: 'Register', name: 'register' },
                { label: 'Get', name: 'get' },
                { label: 'List', name: 'list' },
                { label: 'Grant Access', name: 'grant' },
                { label: 'Revoke Access', name: 'revoke' },
                { label: 'Check Access', name: 'check' }
            ],
            default: 'list'
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
        const operation = (nodeData.inputs?.operation as string) || 'list'
        const config: Record<string, unknown> = {}
        if (nodeData.inputs?.supabaseProjUrl) config.supabaseProjUrl = nodeData.inputs.supabaseProjUrl
        if (options) Object.assign(config, options)
        const adapter: A2AStorageAdapter = await createAdapter(storageBackend, config)
        switch (operation) {
            case 'register':
                return new ArtifactRegisterTool(adapter)
            case 'get':
                return new ArtifactGetTool(adapter)
            case 'list':
                return new ArtifactListTool(adapter)
            case 'grant':
                return new ArtifactGrantTool(adapter)
            case 'revoke':
                return new ArtifactRevokeTool(adapter)
            case 'check':
                return new ArtifactCheckTool(adapter)
            default:
                throw new Error(`Unknown operation: ${operation}`)
        }
    }
}

module.exports = { nodeClass: A2AArtifact_Tools }
