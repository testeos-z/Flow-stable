import { getCredentialData, getCredentialParam, getBaseClasses } from '../../../src/utils'
import { UpdateTool } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class SupabaseUpdate implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Supabase Update'
        this.name = 'supabaseUpdate'
        this.version = 1.0
        this.type = 'SupabaseUpdate'
        this.icon = 'supabase-storage.svg'
        this.category = 'Tools'
        this.description =
            'Update rows in a Supabase table that match the provided filters. Requires a non-empty filters array for safety — prevents accidental mass updates. Use this tool to modify existing records in a pre-configured table.'
        this.baseClasses = [this.type, ...getBaseClasses(UpdateTool), 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['supabaseApi']
        }
        this.inputs = [
            {
                label: 'Supabase Project URL',
                name: 'supabaseProjUrl',
                type: 'string',
                description: 'Supabase project URL (e.g., https://your-project.supabase.co)'
            },
            {
                label: 'Table Name',
                name: 'tableName',
                type: 'string',
                description: 'Name of the Supabase table to update. Immutable at runtime — the LLM cannot change this.'
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const supabaseApiKey = getCredentialParam('supabaseApiKey', credentialData, nodeData)

        const supabaseProjUrl = nodeData.inputs?.supabaseProjUrl as string
        const tableName = nodeData.inputs?.tableName as string

        return new UpdateTool({
            url: supabaseProjUrl,
            apiKey: supabaseApiKey,
            tableName
        })
    }
}

module.exports = { nodeClass: SupabaseUpdate }
