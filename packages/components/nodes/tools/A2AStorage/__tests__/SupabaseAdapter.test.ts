import { runContractTests } from './contract.test'
import { SupabaseAdapter } from '../adapters/SupabaseAdapter'

runContractTests('SupabaseAdapter', async () => {
    const adapter = new SupabaseAdapter()
    await adapter.initialize({})
    return adapter
})
