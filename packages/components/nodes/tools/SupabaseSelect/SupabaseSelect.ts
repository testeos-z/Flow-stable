import { getCredentialData, getCredentialParam, getBaseClasses } from '../../../src/utils'
import { SelectTool } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class SupabaseSelect implements INode {
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
        this.label = 'Supabase Select'
        this.name = 'supabaseSelect'
        this.version = 1.0
        this.type = 'SupabaseSelect'
        this.icon = 'supabase-storage.svg'
        this.category = 'Tools'
        this.description =
            'Query rows from a Supabase table with optional column selection, filters, ordering, and limit. Use this tool to read or search data from a pre-configured table.'
        this.baseClasses = [this.type, ...getBaseClasses(SelectTool), 'Tool']
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
                description: 'Name of the Supabase table to query. Immutable at runtime — the LLM cannot change this.'
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const supabaseApiKey = getCredentialParam('supabaseApiKey', credentialData, nodeData)

        const supabaseProjUrl = nodeData.inputs?.supabaseProjUrl as string
        const tableName = nodeData.inputs?.tableName as string

        return new SelectTool({
            url: supabaseProjUrl,
            apiKey: supabaseApiKey,
            tableName
        })
    }
}

module.exports = { nodeClass: SupabaseSelect }
