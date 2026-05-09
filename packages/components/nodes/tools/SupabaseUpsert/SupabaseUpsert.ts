import { getCredentialData, getCredentialParam, getBaseClasses } from '../../../src/utils'
import { UpsertTool } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class SupabaseUpsert implements INode {
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
        this.label = 'Supabase Upsert'
        this.name = 'supabaseUpsert'
        this.version = 1.0
        this.type = 'SupabaseUpsert'
        this.icon = 'supabase-storage.svg'
        this.category = 'Tools'
        this.description =
            "Insert or update rows in a Supabase table. Upserts a row: inserts if the onConflict column doesn't exist, updates if it does. Use this tool to create or modify records in a pre-configured table without checking existence first."
        this.baseClasses = [this.type, ...getBaseClasses(UpsertTool), 'Tool']
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
                description: 'Name of the Supabase table to upsert into. Immutable at runtime — the LLM cannot change this.'
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const supabaseApiKey = getCredentialParam('supabaseApiKey', credentialData, nodeData)

        const supabaseProjUrl = nodeData.inputs?.supabaseProjUrl as string
        const tableName = nodeData.inputs?.tableName as string

        return new UpsertTool({
            url: supabaseProjUrl,
            apiKey: supabaseApiKey,
            tableName
        })
    }
}

module.exports = { nodeClass: SupabaseUpsert }
