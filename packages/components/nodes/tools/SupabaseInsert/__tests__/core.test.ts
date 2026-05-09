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

import { InsertTool } from '../core'

// ---------------------------------------------------------------------------
// Globals for mock inspection
// ---------------------------------------------------------------------------
let mockQueryResult: { data: any; error: { message: string } | null } = { data: null, error: null }
let lastTableFrom: string = ''
let lastFilterBuilder: MockInsertBuilder | null = null

// ---------------------------------------------------------------------------
// Mock supabase-js query builder for Insert (thenable + chain recording)
// ---------------------------------------------------------------------------
class MockInsertBuilder {
    _chain: { method: string; args: any[] }[] = []

    insert(data: any) {
        this._chain.push({ method: 'insert', args: [data] })
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
        lastFilterBuilder = new MockInsertBuilder()
        return lastFilterBuilder
    }
}

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => new MockSupabaseClient())
}))

// ---------------------------------------------------------------------------
// InsertTool Tests
// ---------------------------------------------------------------------------

const defaultConstructorArgs = {
    url: 'https://test.supabase.co',
    apiKey: 'test-key',
    tableName: 'users'
}

describe('InsertTool', () => {
    beforeEach(() => {
        mockQueryResult = { data: null, error: null }
        lastTableFrom = ''
        lastFilterBuilder = null
    })

    // --- Happy path ---

    it('should build insert chain (insert + select) and return inserted row', async () => {
        const tool = new InsertTool(defaultConstructorArgs)
        const row = { id: 1, name: 'Ada', email: 'ada@example.com' }
        mockQueryResult = { data: [row], error: null }

        const result = await tool._call({
            data: { name: 'Ada', email: 'ada@example.com' },
            returning: 'representation'
        })

        // Verify table name baked in
        expect(lastTableFrom).toBe('users')
        // Verify chain order
        expect(lastFilterBuilder!._chain).toEqual([
            { method: 'insert', args: [{ name: 'Ada', email: 'ada@example.com' }] },
            { method: 'select', args: [] }
        ])
        // Verify output
        expect(JSON.parse(result)).toEqual([row])
    })

    it('should use a different table when tableName is different', async () => {
        const tool = new InsertTool({ ...defaultConstructorArgs, tableName: 'products' })
        mockQueryResult = { data: [{ sku: 'A1', name: 'Widget' }], error: null }

        await tool._call({
            data: { sku: 'A1', name: 'Widget' },
            returning: 'representation'
        })

        expect(lastTableFrom).toBe('products')
    })

    // --- Returning mode ---

    it('should include .select() when returning is "representation"', async () => {
        const tool = new InsertTool(defaultConstructorArgs)
        mockQueryResult = { data: [{ id: 1 }], error: null }

        await tool._call({
            data: { name: 'Test' },
            returning: 'representation'
        })

        const methods = lastFilterBuilder!._chain.map((c) => c.method)
        expect(methods).toEqual(['insert', 'select'])
    })

    it('should skip .select() when returning is "minimal"', async () => {
        const tool = new InsertTool(defaultConstructorArgs)
        mockQueryResult = { data: [], error: null }

        await tool._call({
            data: { name: 'Test' },
            returning: 'minimal'
        })

        const methods = lastFilterBuilder!._chain.map((c) => c.method)
        expect(methods).toEqual(['insert'])
        expect(methods).not.toContain('select')
    })

    // --- Data types ---

    it('should handle record with mixed value types (strings, numbers, booleans, null)', async () => {
        const tool = new InsertTool(defaultConstructorArgs)
        mockQueryResult = { data: [{ id: 1, name: 'Ada', age: 30, active: true, deleted_at: null }], error: null }

        const result = await tool._call({
            data: { name: 'Ada', age: 30, active: true, deleted_at: null },
            returning: 'representation'
        })

        const insertArgs = lastFilterBuilder!._chain.find((c) => c.method === 'insert')
        expect(insertArgs!.args[0]).toEqual({ name: 'Ada', age: 30, active: true, deleted_at: null })
        expect(JSON.parse(result)).toEqual([{ id: 1, name: 'Ada', age: 30, active: true, deleted_at: null }])
    })

    it('should handle empty data record', async () => {
        const tool = new InsertTool(defaultConstructorArgs)
        mockQueryResult = { data: [{ id: 1 }], error: null }

        await tool._call({
            data: {},
            returning: 'representation'
        })

        expect(lastFilterBuilder!._chain[0]).toEqual({ method: 'insert', args: [{}] })
    })

    // --- Error handling ---

    it('should return JSON error string when supabase returns error', async () => {
        const tool = new InsertTool(defaultConstructorArgs)
        mockQueryResult = { data: null, error: { message: 'null value in column "name" violates not-null constraint' } }

        const result = await tool._call({
            data: { name: null },
            returning: 'representation'
        })

        expect(JSON.parse(result)).toEqual({
            error: 'null value in column "name" violates not-null constraint'
        })
    })

    it('should return JSON error string for unique constraint violation', async () => {
        const tool = new InsertTool(defaultConstructorArgs)
        mockQueryResult = { data: null, error: { message: 'duplicate key value violates unique constraint "users_email_key"' } }

        const result = await tool._call({
            data: { email: 'ada@example.com' },
            returning: 'representation'
        })

        expect(JSON.parse(result)).toEqual({
            error: 'duplicate key value violates unique constraint "users_email_key"'
        })
    })

    // --- Credential failures (constructor) ---

    it('should throw when URL is empty', () => {
        expect(() => new InsertTool({ ...defaultConstructorArgs, url: '' })).toThrow('Missing Supabase API credential')
    })

    it('should throw when apiKey is empty', () => {
        expect(() => new InsertTool({ ...defaultConstructorArgs, apiKey: '' })).toThrow('Missing Supabase API credential')
    })

    // --- Tool name and description ---

    it('should use snake_case tool name "supabase_insert"', () => {
        const tool = new InsertTool(defaultConstructorArgs)
        expect((tool as any).name).toBe('supabase_insert')
    })

    it('should include tableName in tool description', () => {
        const tool = new InsertTool(defaultConstructorArgs)
        expect((tool as any).description).toContain('users')
    })

    it('should include tableName in tool description for different table', () => {
        const tool = new InsertTool({ ...defaultConstructorArgs, tableName: 'orders' })
        expect((tool as any).description).toContain('orders')
    })

    // --- Zod schema: tableName NOT exposed ---

    it('should NOT expose tableName in the Zod schema', () => {
        const tool = new InsertTool(defaultConstructorArgs)
        const schemaShape = (tool as any).schema?.shape
        expect(schemaShape?.tableName).toBeUndefined()
        expect(schemaShape?.table).toBeUndefined()
    })

    // --- Returning default ---

    it('should default returning to "representation" when not provided', async () => {
        const tool = new InsertTool(defaultConstructorArgs)
        mockQueryResult = { data: [{ id: 1 }], error: null }

        // Call without returning field — Zod default should kick in
        await tool._call({ data: { name: 'Test' } } as any)

        const methods = lastFilterBuilder!._chain.map((c) => c.method)
        expect(methods).toContain('select')
    })
})
