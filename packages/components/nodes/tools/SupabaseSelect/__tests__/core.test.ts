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

import { SelectTool } from '../core'

// ---------------------------------------------------------------------------
// Globals for mock inspection
// ---------------------------------------------------------------------------
let mockQueryResult: { data: any; error: { message: string } | null } = { data: null, error: null }
let lastTableFrom: string = ''
let lastFilterBuilder: MockFilterBuilder | null = null

// ---------------------------------------------------------------------------
// Mock supabase-js query builder (thenable + chain recording)
// ---------------------------------------------------------------------------
class MockFilterBuilder {
    _chain: { method: string; args: any[] }[] = []

    select(columns: string) {
        this._chain.push({ method: 'select', args: [columns] })
        return this
    }
    eq(column: string, value: any) {
        this._chain.push({ method: 'eq', args: [column, value] })
        return this
    }
    neq(column: string, value: any) {
        this._chain.push({ method: 'neq', args: [column, value] })
        return this
    }
    gt(column: string, value: any) {
        this._chain.push({ method: 'gt', args: [column, value] })
        return this
    }
    lt(column: string, value: any) {
        this._chain.push({ method: 'lt', args: [column, value] })
        return this
    }
    gte(column: string, value: any) {
        this._chain.push({ method: 'gte', args: [column, value] })
        return this
    }
    lte(column: string, value: any) {
        this._chain.push({ method: 'lte', args: [column, value] })
        return this
    }
    in(column: string, value: any) {
        this._chain.push({ method: 'in', args: [column, value] })
        return this
    }
    is(column: string, value: any) {
        this._chain.push({ method: 'is', args: [column, value] })
        return this
    }
    like(column: string, value: any) {
        this._chain.push({ method: 'like', args: [column, value] })
        return this
    }
    ilike(column: string, value: any) {
        this._chain.push({ method: 'ilike', args: [column, value] })
        return this
    }
    order(column: string, options: { ascending: boolean }) {
        this._chain.push({ method: 'order', args: [column, options] })
        return this
    }
    limit(n: number) {
        this._chain.push({ method: 'limit', args: [n] })
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
        lastFilterBuilder = new MockFilterBuilder()
        return lastFilterBuilder
    }
}

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => new MockSupabaseClient())
}))

// ---------------------------------------------------------------------------
// SelectTool Tests
// ---------------------------------------------------------------------------

const defaultConstructorArgs = {
    url: 'https://test.supabase.co',
    apiKey: 'test-key',
    tableName: 'users'
}

describe('SelectTool', () => {
    beforeEach(() => {
        mockQueryResult = { data: null, error: null }
        lastTableFrom = ''
        lastFilterBuilder = null
    })

    // --- Happy path ---

    it('should build full chain (filters + order + limit) and return rows', async () => {
        const tool = new SelectTool(defaultConstructorArgs)
        const rows = [
            { id: 1, name: 'Ada' },
            { id: 2, name: 'Bob' }
        ]
        mockQueryResult = { data: rows, error: null }

        const result = await tool._call({
            columns: ['id', 'name'],
            filters: [{ column: 'status', operator: 'eq', value: 'active' }],
            orderBy: 'name',
            orderDirection: 'asc',
            limit: 10
        })

        // Verify table name baked in
        expect(lastTableFrom).toBe('users')
        // Verify chain order
        expect(lastFilterBuilder!._chain).toEqual([
            { method: 'select', args: ['id,name'] },
            { method: 'eq', args: ['status', 'active'] },
            { method: 'order', args: ['name', { ascending: true }] },
            { method: 'limit', args: [10] }
        ])
        // Verify output
        expect(JSON.parse(result)).toEqual(rows)
    })

    it('should query a different table when tableName is different', async () => {
        const tool = new SelectTool({ ...defaultConstructorArgs, tableName: 'products' })
        mockQueryResult = { data: [{ sku: 'A1' }], error: null }

        await tool._call({
            columns: ['sku'],
            filters: [],
            orderBy: null,
            orderDirection: 'asc',
            limit: 10
        })

        expect(lastTableFrom).toBe('products')
    })

    // --- Columns ---

    it("should use * when columns is ['*']", async () => {
        const tool = new SelectTool(defaultConstructorArgs)
        mockQueryResult = { data: [], error: null }

        await tool._call({
            columns: ['*'],
            filters: [],
            orderBy: null,
            orderDirection: 'asc',
            limit: 100
        })

        expect(lastFilterBuilder!._chain[0]).toEqual({ method: 'select', args: ['*'] })
    })

    it('should comma-join multiple columns', async () => {
        const tool = new SelectTool(defaultConstructorArgs)
        mockQueryResult = { data: [], error: null }

        await tool._call({
            columns: ['id', 'name', 'email'],
            filters: [],
            orderBy: null,
            orderDirection: 'asc',
            limit: 100
        })

        expect(lastFilterBuilder!._chain[0]).toEqual({ method: 'select', args: ['id,name,email'] })
    })

    // --- Filters ---

    it('should apply multiple filters via applyFilters', async () => {
        const tool = new SelectTool(defaultConstructorArgs)
        mockQueryResult = { data: [], error: null }

        await tool._call({
            columns: ['*'],
            filters: [
                { column: 'status', operator: 'eq', value: 'active' },
                { column: 'age', operator: 'gte', value: 18 }
            ],
            orderBy: null,
            orderDirection: 'asc',
            limit: 100
        })

        // applyFilters is called between select and limit
        const chain = lastFilterBuilder!._chain
        expect(chain[0]).toEqual({ method: 'select', args: ['*'] })
        expect(chain[1]).toEqual({ method: 'eq', args: ['status', 'active'] })
        expect(chain[2]).toEqual({ method: 'gte', args: ['age', 18] })
        expect(chain[chain.length - 1]).toEqual({ method: 'limit', args: [100] })
    })

    it('should skip filters when filters array is empty', async () => {
        const tool = new SelectTool(defaultConstructorArgs)
        mockQueryResult = { data: [], error: null }

        await tool._call({
            columns: ['*'],
            filters: [],
            orderBy: null,
            orderDirection: 'asc',
            limit: 100
        })

        const methods = lastFilterBuilder!._chain.map((c) => c.method)
        expect(methods).not.toContain('eq')
        expect(methods).not.toContain('gt')
    })

    // --- Ordering ---

    it('should apply ascending order', async () => {
        const tool = new SelectTool(defaultConstructorArgs)
        mockQueryResult = { data: [], error: null }

        await tool._call({
            columns: ['*'],
            filters: [],
            orderBy: 'created_at',
            orderDirection: 'asc',
            limit: 100
        })

        const orderCall = lastFilterBuilder!._chain.find((c) => c.method === 'order')
        expect(orderCall).toEqual({ method: 'order', args: ['created_at', { ascending: true }] })
    })

    it('should apply descending order', async () => {
        const tool = new SelectTool(defaultConstructorArgs)
        mockQueryResult = { data: [], error: null }

        await tool._call({
            columns: ['*'],
            filters: [],
            orderBy: 'created_at',
            orderDirection: 'desc',
            limit: 100
        })

        const orderCall = lastFilterBuilder!._chain.find((c) => c.method === 'order')
        expect(orderCall).toEqual({ method: 'order', args: ['created_at', { ascending: false }] })
    })

    it('should skip order when orderBy is null', async () => {
        const tool = new SelectTool(defaultConstructorArgs)
        mockQueryResult = { data: [], error: null }

        await tool._call({
            columns: ['*'],
            filters: [],
            orderBy: null,
            orderDirection: 'asc',
            limit: 100
        })

        const methods = lastFilterBuilder!._chain.map((c) => c.method)
        expect(methods).not.toContain('order')
    })

    // --- Limit ---

    it('should apply default limit of 100 when limit is 100', async () => {
        const tool = new SelectTool(defaultConstructorArgs)
        mockQueryResult = { data: [], error: null }

        await tool._call({
            columns: ['*'],
            filters: [],
            orderBy: null,
            orderDirection: 'asc',
            limit: 100
        })

        expect(lastFilterBuilder!._chain[lastFilterBuilder!._chain.length - 1]).toEqual({ method: 'limit', args: [100] })
    })

    it('should clamp limit to 1000 when LLM requests more', async () => {
        const tool = new SelectTool(defaultConstructorArgs)
        mockQueryResult = { data: [], error: null }

        await tool._call({
            columns: ['*'],
            filters: [],
            orderBy: null,
            orderDirection: 'asc',
            limit: 5000
        })

        expect(lastFilterBuilder!._chain[lastFilterBuilder!._chain.length - 1]).toEqual({ method: 'limit', args: [1000] })
    })

    it('should allow custom limit within cap', async () => {
        const tool = new SelectTool(defaultConstructorArgs)
        mockQueryResult = { data: [], error: null }

        await tool._call({
            columns: ['*'],
            filters: [],
            orderBy: null,
            orderDirection: 'asc',
            limit: 50
        })

        expect(lastFilterBuilder!._chain[lastFilterBuilder!._chain.length - 1]).toEqual({ method: 'limit', args: [50] })
    })

    // --- Error handling ---

    it('should return JSON error string when supabase returns error', async () => {
        const tool = new SelectTool(defaultConstructorArgs)
        mockQueryResult = { data: null, error: { message: 'relation "users" does not exist' } }

        const result = await tool._call({
            columns: ['*'],
            filters: [],
            orderBy: null,
            orderDirection: 'asc',
            limit: 100
        })

        expect(JSON.parse(result)).toEqual({ error: 'relation "users" does not exist' })
    })

    it('should return empty array string for no matching rows', async () => {
        const tool = new SelectTool(defaultConstructorArgs)
        mockQueryResult = { data: [], error: null }

        const result = await tool._call({
            columns: ['*'],
            filters: [{ column: 'id', operator: 'eq', value: 999 }],
            orderBy: null,
            orderDirection: 'asc',
            limit: 100
        })

        expect(result).toBe('[]')
        expect(JSON.parse(result)).toEqual([])
    })

    it('should preserve null values in result rows', async () => {
        const tool = new SelectTool(defaultConstructorArgs)
        const row = { id: 1, name: 'Ada', deleted_at: null }
        mockQueryResult = { data: [row], error: null }

        const result = await tool._call({
            columns: ['*'],
            filters: [],
            orderBy: null,
            orderDirection: 'asc',
            limit: 100
        })

        expect(JSON.parse(result)).toEqual([{ id: 1, name: 'Ada', deleted_at: null }])
    })

    // --- Credential failures (constructor) ---

    it('should throw when URL is empty', () => {
        expect(() => new SelectTool({ ...defaultConstructorArgs, url: '' })).toThrow('Missing Supabase API credential')
    })

    it('should throw when apiKey is empty', () => {
        expect(() => new SelectTool({ ...defaultConstructorArgs, apiKey: '' })).toThrow('Missing Supabase API credential')
    })
})
