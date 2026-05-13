import { INodeParams, INodeCredential } from '../src/Interface'

class SupabaseUserAuth implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Supabase User Auth'
        this.name = 'supabaseUserAuth'
        this.version = 1.0
        this.inputs = [
            {
                label: 'Supabase Project URL',
                name: 'supabaseProjUrl',
                type: 'string'
            },
            {
                label: 'Supabase Anon Key',
                name: 'supabaseAnonKey',
                type: 'password'
            },
            {
                label: 'User Email',
                name: 'supabaseUserEmail',
                type: 'string'
            },
            {
                label: 'User Password',
                name: 'supabaseUserPassword',
                type: 'password'
            }
        ]
    }
}

module.exports = { credClass: SupabaseUserAuth }
