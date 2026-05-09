import { getCredentialData, getCredentialParam, getBaseClasses } from '../../../src/utils'
import { InsertTool } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class SupabaseInsert implements INode {
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
        this.label = 'Supabase Insert'
        this.name = 'supabaseInsert'
        this.version = 1.0
        this.type = 'SupabaseInsert'
        this.icon = 'supabase-storage.svg'
        this.category = 'Tools'
        this.description =
            'Insert one or more rows into a Supabase table. Pass column:value pairs as the data argument. Use this tool to create new records in a pre-configured table.'
        this.baseClasses = [this.type, ...getBaseClasses(InsertTool), 'Tool']
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
                description: 'Name of the Supabase table to insert into. Immutable at runtime — the LLM cannot change this.'
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const supabaseApiKey = getCredentialParam('supabaseApiKey', credentialData, nodeData)

        const supabaseProjUrl = nodeData.inputs?.supabaseProjUrl as string
        const tableName = nodeData.inputs?.tableName as string

        return new InsertTool({
            url: supabaseProjUrl,
            apiKey: supabaseApiKey,
            tableName
        })
    }
}

module.exports = { nodeClass: SupabaseInsert }
