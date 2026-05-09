import { getCredentialData, getCredentialParam, getBaseClasses } from '../../../src/utils'
import { DeleteTool } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class SupabaseDelete implements INode {
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
        this.label = 'Supabase Delete'
        this.name = 'supabaseDelete'
        this.version = 1.0
        this.type = 'SupabaseDelete'
        this.icon = 'supabase-storage.svg'
        this.category = 'Tools'
        this.description =
            'Delete rows from a Supabase table that match the provided filters. Requires a non-empty filters array for safety — prevents accidental table truncation. Use this tool to remove records from a pre-configured table.'
        this.baseClasses = [this.type, ...getBaseClasses(DeleteTool), 'Tool']
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
                description: 'Name of the Supabase table to delete from. Immutable at runtime — the LLM cannot change this.'
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const supabaseApiKey = getCredentialParam('supabaseApiKey', credentialData, nodeData)

        const supabaseProjUrl = nodeData.inputs?.supabaseProjUrl as string
        const tableName = nodeData.inputs?.tableName as string

        return new DeleteTool({
            url: supabaseProjUrl,
            apiKey: supabaseApiKey,
            tableName
        })
    }
}

module.exports = { nodeClass: SupabaseDelete }
