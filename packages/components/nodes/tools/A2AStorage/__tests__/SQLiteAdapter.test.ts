import { runContractTests } from './contract.test'
import { SQLiteAdapter } from '../adapters/SQLiteAdapter'

runContractTests('SQLiteAdapter', async () => {
    const adapter = new SQLiteAdapter()
    await adapter.initialize({})
    return adapter
})
