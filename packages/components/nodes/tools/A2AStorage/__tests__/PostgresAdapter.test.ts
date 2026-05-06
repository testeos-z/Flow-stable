import { runContractTests } from './contract.test'
import { PostgresAdapter } from '../adapters/PostgresAdapter'

runContractTests('PostgresAdapter', async () => {
    const adapter = new PostgresAdapter()
    await adapter.initialize({})
    return adapter
})
