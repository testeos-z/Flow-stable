// ---------------------------------------------------------------------------
// Mock DynamicStructuredTool to avoid @langchain/core ESM import failures under Bun
// (Pre-existing infra issue: @langchain/core@1.1.20 ESM compat with Bun 1.3.13)
// ---------------------------------------------------------------------------
jest.mock('../../OpenAPIToolkit/core', () => ({
    DynamicStructuredTool: class MockDynamicStructuredTool {
        name: string
        description: string
        schema: any
        returnDirect: boolean
        constructor(fields: any) {
            this.name = fields?.name || ''
            this.description = fields?.description || ''
            this.schema = fields?.schema
            this.returnDirect = fields?.returnDirect ?? false
        }
        async _call(_arg: any, _runManager?: any): Promise<string> {
            return ''
        }
    }
}))

import { UpsertTool } from '../core'

// ---------------------------------------------------------------------------
// Globals for mock inspection
// ---------------------------------------------------------------------------
let mockQueryResult: { data: any; error: { message: string } | null } = { data: null, error: null }
let lastTableFrom: string = ''
let lastFilterBuilder: MockUpsertBuilder | null = null

// ---------------------------------------------------------------------------
// Mock supabase-js query builder for Upsert (thenable + chain recording)
// ---------------------------------------------------------------------------
class MockUpsertBuilder {
    _chain: { method: string; args: any[] }[] = []

    upsert(data: any, options?: { onConflict?: string; ignoreDuplicates?: boolean }) {
        this._chain.push({ method: 'upsert', args: [data, options || {}] })
        return this
    }
    select(columns?: string) {
        this._chain.push({ method: 'select', args: columns ? [columns] : [] })
        return this
    }

    // Thenable — makes `await query` return mockQueryResult
    then(resolve: (value: any) => any) {
        return Promise.resolve(mockQueryResult).then(resolve)
    }
}

class MockSupabaseClient {
    from(table: string) {
        lastTableFrom = table
        lastFilterBuilder = new MockUpsertBuilder()
        return lastFilterBuilder
    }
}

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => new MockSupabaseClient())
}))

// ---------------------------------------------------------------------------
// UpsertTool Tests
// ---------------------------------------------------------------------------

const defaultConstructorArgs = {
    url: 'https://test.supabase.co',
    apiKey: 'test-key',
    tableName: 'users'
}

describe('UpsertTool', () => {
    beforeEach(() => {
        mockQueryResult = { data: null, error: null }
        lastTableFrom = ''
        lastFilterBuilder = null
    })

    // --- Happy path: insert path (no conflict) ---

    it('should insert new row when no conflict exists (insert path)', async () => {
        const tool = new UpsertTool(defaultConstructorArgs)
        const row = { id: 1, email: 'ada@example.com', name: 'Ada' }
        mockQueryResult = { data: [row], error: null }

        const result = await tool._call({
            data: { email: 'ada@example.com', name: 'Ada' },
            onConflict: 'email',
            ignoreDuplicates: false
        })

        // Verify table name baked in
        expect(lastTableFrom).toBe('users')
        // Verify chain: upsert(data, options) → select()
        expect(lastFilterBuilder!._chain).toEqual([
            {
                method: 'upsert',
                args: [
                    { email: 'ada@example.com', name: 'Ada' },
                    { onConflict: 'email', ignoreDuplicates: false }
                ]
            },
            { method: 'select', args: [] }
        ])
        // Verify output
        expect(JSON.parse(result)).toEqual([row])
    })

    // --- Happy path: update path (conflict matched) ---

    it('should update existing row when conflict matches (update path)', async () => {
        const tool = new UpsertTool(defaultConstructorArgs)
        // Simulate existing row updated with new name
        const updatedRow = { id: 1, email: 'ada@example.com', name: 'Ada Lovelace' }
        mockQueryResult = { data: [updatedRow], error: null }

        const result = await tool._call({
            data: { id: 1, email: 'ada@example.com', name: 'Ada Lovelace' },
            onConflict: 'email',
            ignoreDuplicates: false
        })

        expect(JSON.parse(result)).toEqual([{ id: 1, email: 'ada@example.com', name: 'Ada Lovelace' }])
        // Chain must still include upsert → select
        const methods = lastFilterBuilder!._chain.map((c) => c.method)
        expect(methods).toEqual(['upsert', 'select'])
    })

    // --- Different table ---

    it('should use a different table when tableName is different', async () => {
        const tool = new UpsertTool({ ...defaultConstructorArgs, tableName: 'products' })
        mockQueryResult = { data: [{ sku: 'A1' }], error: null }

        await tool._call({
            data: { sku: 'A1', name: 'Widget' },
            onConflict: 'sku',
            ignoreDuplicates: false
        })

        expect(lastTableFrom).toBe('products')
    })

    // --- onConflict default ---

    it('should default onConflict to "id" when not provided', async () => {
        const tool = new UpsertTool(defaultConstructorArgs)
        mockQueryResult = { data: [{ id: 1 }], error: null }

        // Call without onConflict — Zod default should kick in
        await tool._call({ data: { name: 'Test' }, ignoreDuplicates: false } as any)

        const upsertCall = lastFilterBuilder!._chain.find((c) => c.method === 'upsert')
        expect(upsertCall!.args[1]).toEqual({ onConflict: 'id', ignoreDuplicates: false })
    })

    it('should use custom onConflict column when specified', async () => {
        const tool = new UpsertTool(defaultConstructorArgs)
        mockQueryResult = { data: [{ id: 1 }], error: null }

        await tool._call({
            data: { email: 'test@example.com', name: 'Test' },
            onConflict: 'email',
            ignoreDuplicates: false
        })

        const upsertCall = lastFilterBuilder!._chain.find((c) => c.method === 'upsert')
        expect(upsertCall!.args[1].onConflict).toBe('email')
    })

    // --- ignoreDuplicates ---

    it('should set ignoreDuplicates to false by default', async () => {
        const tool = new UpsertTool(defaultConstructorArgs)
        mockQueryResult = { data: [{ id: 1 }], error: null }

        // Call without ignoreDuplicates — Zod default should be false
        await tool._call({ data: { name: 'Test' }, onConflict: 'id' } as any)

        const upsertCall = lastFilterBuilder!._chain.find((c) => c.method === 'upsert')
        expect(upsertCall!.args[1].ignoreDuplicates).toBe(false)
    })

    it('should set ignoreDuplicates to true when specified', async () => {
        const tool = new UpsertTool(defaultConstructorArgs)
        mockQueryResult = { data: [{ id: 1 }], error: null }

        await tool._call({
            data: { email: 'test@example.com', name: 'Test' },
            onConflict: 'email',
            ignoreDuplicates: true
        })

        const upsertCall = lastFilterBuilder!._chain.find((c) => c.method === 'upsert')
        expect(upsertCall!.args[1]).toEqual({ onConflict: 'email', ignoreDuplicates: true })
    })

    // --- Data types ---

    it('should handle record with mixed value types (strings, numbers, booleans, null)', async () => {
        const tool = new UpsertTool(defaultConstructorArgs)
        const row = { id: 1, name: 'Ada', age: 30, active: true, deleted_at: null }
        mockQueryResult = { data: [row], error: null }

        const result = await tool._call({
            data: { name: 'Ada', age: 30, active: true, deleted_at: null },
            onConflict: 'id',
            ignoreDuplicates: false
        })

        const upsertArgs = lastFilterBuilder!._chain.find((c) => c.method === 'upsert')
        expect(upsertArgs!.args[0]).toEqual({ name: 'Ada', age: 30, active: true, deleted_at: null })
        expect(JSON.parse(result)).toEqual([row])
    })

    it('should handle empty data record', async () => {
        const tool = new UpsertTool(defaultConstructorArgs)
        mockQueryResult = { data: [{ id: 1 }], error: null }

        await tool._call({
            data: {},
            onConflict: 'id',
            ignoreDuplicates: false
        })

        expect(lastFilterBuilder!._chain[0]).toEqual({ method: 'upsert', args: [{}, { onConflict: 'id', ignoreDuplicates: false }] })
    })

    // --- Error handling ---

    it('should return JSON error string when supabase returns error', async () => {
        const tool = new UpsertTool(defaultConstructorArgs)
        mockQueryResult = { data: null, error: { message: 'null value in column "name" violates not-null constraint' } }

        const result = await tool._call({
            data: { name: null },
            onConflict: 'id',
            ignoreDuplicates: false
        })

        expect(JSON.parse(result)).toEqual({
            error: 'null value in column "name" violates not-null constraint'
        })
    })

    it('should return JSON error string for unique constraint violation', async () => {
        const tool = new UpsertTool(defaultConstructorArgs)
        mockQueryResult = { data: null, error: { message: 'duplicate key value violates unique constraint "users_email_key"' } }

        const result = await tool._call({
            data: { email: 'ada@example.com' },
            onConflict: 'id',
            ignoreDuplicates: false
        })

        expect(JSON.parse(result)).toEqual({
            error: 'duplicate key value violates unique constraint "users_email_key"'
        })
    })

    // --- ignoreDuplicates with conflict (silent skip) ---

    it('should return empty array when ignoreDuplicates=true and conflict exists', async () => {
        const tool = new UpsertTool(defaultConstructorArgs)
        // When ignoreDuplicates=true and conflict → supabase returns empty data with no error
        mockQueryResult = { data: [], error: null }

        const result = await tool._call({
            data: { id: 1, email: 'ada@example.com', name: 'Ada' },
            onConflict: 'id',
            ignoreDuplicates: true
        })

        expect(result).toBe('[]')
        expect(JSON.parse(result)).toEqual([])
    })

    // --- Credential failures (constructor) ---

    it('should throw when URL is empty', () => {
        expect(() => new UpsertTool({ ...defaultConstructorArgs, url: '' })).toThrow('Missing Supabase API credential')
    })

    it('should throw when apiKey is empty', () => {
        expect(() => new UpsertTool({ ...defaultConstructorArgs, apiKey: '' })).toThrow('Missing Supabase API credential')
    })

    // --- Tool name and description ---

    it('should use snake_case tool name "supabase_upsert"', () => {
        const tool = new UpsertTool(defaultConstructorArgs)
        expect((tool as any).name).toBe('supabase_upsert')
    })

    it('should include tableName in tool description', () => {
        const tool = new UpsertTool(defaultConstructorArgs)
        expect((tool as any).description).toContain('users')
    })

    it('should include tableName in tool description for different table', () => {
        const tool = new UpsertTool({ ...defaultConstructorArgs, tableName: 'orders' })
        expect((tool as any).description).toContain('orders')
    })

    // --- Zod schema: tableName NOT exposed ---

    it('should NOT expose tableName in the Zod schema', () => {
        const tool = new UpsertTool(defaultConstructorArgs)
        const schemaShape = (tool as any).schema?.shape
        expect(schemaShape?.tableName).toBeUndefined()
        expect(schemaShape?.table).toBeUndefined()
    })
})
