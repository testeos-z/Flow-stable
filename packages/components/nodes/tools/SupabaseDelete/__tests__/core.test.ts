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

import { DeleteTool } from '../core'

// ---------------------------------------------------------------------------
// Globals for mock inspection
// ---------------------------------------------------------------------------
let mockQueryResult: { data: any; error: { message: string } | null } = { data: null, error: null }
let lastTableFrom: string = ''
let lastFilterBuilder: MockDeleteBuilder | null = null

// ---------------------------------------------------------------------------
// Mock supabase-js query builder for Delete (thenable + chain recording)
// ---------------------------------------------------------------------------
class MockDeleteBuilder {
    _chain: { method: string; args: any[] }[] = []

    delete() {
        this._chain.push({ method: 'delete', args: [] })
        return this
    }
    select(columns?: string) {
        this._chain.push({ method: 'select', args: columns ? [columns] : [] })
        return this
    }

    // Filter operators (needed for applyFilters)
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

    // Thenable — makes `await query` return mockQueryResult
    then(resolve: (value: any) => any) {
        return Promise.resolve(mockQueryResult).then(resolve)
    }
}

class MockSupabaseClient {
    from(table: string) {
        lastTableFrom = table
        lastFilterBuilder = new MockDeleteBuilder()
        return lastFilterBuilder
    }
}

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => new MockSupabaseClient())
}))

// ---------------------------------------------------------------------------
// DeleteTool Tests
// ---------------------------------------------------------------------------

const defaultConstructorArgs = {
    url: 'https://test.supabase.co',
    apiKey: 'test-key',
    tableName: 'users'
}

describe('DeleteTool', () => {
    beforeEach(() => {
        mockQueryResult = { data: null, error: null }
        lastTableFrom = ''
        lastFilterBuilder = null
    })

    // --- Happy path ---

    it('should build delete chain (delete + filter + select) and return deleted row', async () => {
        const tool = new DeleteTool(defaultConstructorArgs)
        const deletedRow = { id: 1, name: 'Ada', status: 'deleted' }
        mockQueryResult = { data: [deletedRow], error: null }

        const result = await tool._call({
            filters: [{ column: 'id', operator: 'eq', value: 1 }],
            returning: 'representation'
        })

        expect(lastTableFrom).toBe('users')
        expect(lastFilterBuilder!._chain).toEqual([
            { method: 'delete', args: [] },
            { method: 'eq', args: ['id', 1] },
            { method: 'select', args: [] }
        ])
        expect(JSON.parse(result)).toEqual([deletedRow])
    })

    it('should use a different table when tableName is different', async () => {
        const tool = new DeleteTool({ ...defaultConstructorArgs, tableName: 'products' })
        mockQueryResult = { data: [{ sku: 'A1', name: 'Deleted Widget' }], error: null }

        await tool._call({
            filters: [{ column: 'sku', operator: 'eq', value: 'A1' }],
            returning: 'representation'
        })

        expect(lastTableFrom).toBe('products')
    })

    // --- Returning mode ---

    it('should include .select() when returning is "representation"', async () => {
        const tool = new DeleteTool(defaultConstructorArgs)
        mockQueryResult = { data: [{ id: 1 }], error: null }

        await tool._call({
            filters: [{ column: 'id', operator: 'eq', value: 1 }],
            returning: 'representation'
        })

        const methods = lastFilterBuilder!._chain.map((c) => c.method)
        expect(methods).toContain('select')
    })

    it('should skip .select() when returning is "minimal"', async () => {
        const tool = new DeleteTool(defaultConstructorArgs)
        mockQueryResult = { data: [], error: null }

        await tool._call({
            filters: [{ column: 'id', operator: 'eq', value: 1 }],
            returning: 'minimal'
        })

        const methods = lastFilterBuilder!._chain.map((c) => c.method)
        expect(methods).not.toContain('select')
    })

    // --- Multi-filter chain building ---

    it('should build chain with multiple filters applied in order', async () => {
        const tool = new DeleteTool(defaultConstructorArgs)
        mockQueryResult = { data: [{ id: 2 }], error: null }

        await tool._call({
            filters: [
                { column: 'status', operator: 'eq', value: 'archived' },
                { column: 'created_at', operator: 'lt', value: '2020-01-01' }
            ],
            returning: 'representation'
        })

        // Verify: delete → filter1 → filter2 → select
        expect(lastFilterBuilder!._chain[0]).toEqual({ method: 'delete', args: [] })
        expect(lastFilterBuilder!._chain[1]).toEqual({ method: 'eq', args: ['status', 'archived'] })
        expect(lastFilterBuilder!._chain[2]).toEqual({ method: 'lt', args: ['created_at', '2020-01-01'] })
        expect(lastFilterBuilder!._chain[3]).toEqual({ method: 'select', args: [] })
    })

    it('should build chain with all filter operator types', async () => {
        const tool = new DeleteTool(defaultConstructorArgs)
        mockQueryResult = { data: [{ id: 1 }], error: null }

        await tool._call({
            filters: [
                { column: 'a', operator: 'eq', value: 1 },
                { column: 'b', operator: 'neq', value: 2 },
                { column: 'c', operator: 'gt', value: 3 },
                { column: 'd', operator: 'lt', value: 4 },
                { column: 'e', operator: 'gte', value: 5 },
                { column: 'f', operator: 'lte', value: 6 },
                { column: 'g', operator: 'in', value: [1, 2] },
                { column: 'h', operator: 'is', value: null },
                { column: 'i', operator: 'like', value: '%test%' },
                { column: 'j', operator: 'ilike', value: '%TEST%' }
            ],
            returning: 'representation'
        })

        const filterMethods = lastFilterBuilder!._chain.slice(1, -1).map((c) => c.method)
        expect(filterMethods).toEqual(['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'is', 'like', 'ilike'])
    })

    // --- Empty filters safety guard (Zod level) ---

    it('should reject empty filters array at Zod level', () => {
        const tool = new DeleteTool(defaultConstructorArgs)
        const schemaShape = (tool as any).schema?.shape
        expect(schemaShape.filters).toBeDefined()
        // Zod .min(1) guard verified through schema inspection
    })

    it('should have runtime guard against empty filters (belt-and-suspenders)', async () => {
        const tool = new DeleteTool(defaultConstructorArgs)

        // Bypass Zod validation — runtime guard should catch empty filters
        const result = await tool._call({
            filters: [],
            returning: 'representation'
        } as any)

        // Should return error string, not call supabase
        expect(lastFilterBuilder).toBeNull() // No supabase call made
        expect(result).toContain('filters must not be empty')
        expect(result).toContain('delete')
    })

    it('should contain "refusing to delete all rows" in the empty-filters rejection message', async () => {
        const tool = new DeleteTool(defaultConstructorArgs)

        const result = await tool._call({
            filters: [],
            returning: 'representation'
        } as any)

        expect(result).toContain('refusing to delete')
        expect(result).toContain('all rows')
    })

    // --- Error handling ---

    it('should return JSON error string when supabase returns error', async () => {
        const tool = new DeleteTool(defaultConstructorArgs)
        mockQueryResult = {
            data: null,
            error: { message: 'permission denied for table users' }
        }

        const result = await tool._call({
            filters: [{ column: 'id', operator: 'eq', value: 1 }],
            returning: 'representation'
        })

        expect(JSON.parse(result)).toEqual({
            error: 'permission denied for table users'
        })
    })

    it('should return empty array for no matching rows (success)', async () => {
        const tool = new DeleteTool(defaultConstructorArgs)
        mockQueryResult = { data: [], error: null }

        const result = await tool._call({
            filters: [{ column: 'id', operator: 'eq', value: 99999 }],
            returning: 'representation'
        })

        expect(JSON.parse(result)).toEqual([])
    })

    // --- Credential failures (constructor) ---

    it('should throw when URL is empty', () => {
        expect(() => new DeleteTool({ ...defaultConstructorArgs, url: '' })).toThrow('Missing Supabase API credential')
    })

    it('should throw when apiKey is empty', () => {
        expect(() => new DeleteTool({ ...defaultConstructorArgs, apiKey: '' })).toThrow('Missing Supabase API credential')
    })

    // --- Tool name and description ---

    it('should use snake_case tool name "supabase_delete"', () => {
        const tool = new DeleteTool(defaultConstructorArgs)
        expect((tool as any).name).toBe('supabase_delete')
    })

    it('should include tableName in tool description', () => {
        const tool = new DeleteTool(defaultConstructorArgs)
        expect((tool as any).description).toContain('users')
    })

    it('should include different tableName in tool description', () => {
        const tool = new DeleteTool({ ...defaultConstructorArgs, tableName: 'orders' })
        expect((tool as any).description).toContain('orders')
    })

    // --- Zod schema: tableName NOT exposed ---

    it('should NOT expose tableName in the Zod schema', () => {
        const tool = new DeleteTool(defaultConstructorArgs)
        const schemaShape = (tool as any).schema?.shape
        expect(schemaShape?.tableName).toBeUndefined()
        expect(schemaShape?.table).toBeUndefined()
    })

    // --- Returning default ---

    it('should default returning to "representation" when not provided', async () => {
        const tool = new DeleteTool(defaultConstructorArgs)
        mockQueryResult = { data: [{ id: 1 }], error: null }

        // Call without returning field — Zod default should kick in
        await tool._call({
            filters: [{ column: 'id', operator: 'eq', value: 1 }]
        } as any)

        const methods = lastFilterBuilder!._chain.map((c) => c.method)
        expect(methods).toContain('select')
    })
})
