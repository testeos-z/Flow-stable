import { createSupabaseClient, handleStorageError, handleDbError, applyFilters, FilterSchema } from '../SupabaseCommon'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Mock @supabase/supabase-js
// ---------------------------------------------------------------------------
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({ mocked: true }))
}))

// ---------------------------------------------------------------------------
// Mock query builder for applyFilters tests
// ---------------------------------------------------------------------------
class MockQueryBuilder {
    _calls: { method: string; args: any[] }[] = []

    private record(method: string, args: any[]): this {
        this._calls.push({ method, args })
        return this
    }

    eq(column: string, value: any) {
        return this.record('eq', [column, value])
    }
    neq(column: string, value: any) {
        return this.record('neq', [column, value])
    }
    gt(column: string, value: any) {
        return this.record('gt', [column, value])
    }
    lt(column: string, value: any) {
        return this.record('lt', [column, value])
    }
    gte(column: string, value: any) {
        return this.record('gte', [column, value])
    }
    lte(column: string, value: any) {
        return this.record('lte', [column, value])
    }
    in(column: string, value: any) {
        return this.record('in', [column, value])
    }
    is(column: string, value: any) {
        return this.record('is', [column, value])
    }
    like(column: string, value: any) {
        return this.record('like', [column, value])
    }
    ilike(column: string, value: any) {
        return this.record('ilike', [column, value])
    }
}

// ---------------------------------------------------------------------------
// createSupabaseClient tests (ported from SupabaseStorageCommon.test.ts)
// ---------------------------------------------------------------------------
describe('createSupabaseClient', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should call createClient with url and key', () => {
        createSupabaseClient('https://test.supabase.co', 'test-key')
        expect(createClient).toHaveBeenCalledWith('https://test.supabase.co', 'test-key')
    })

    it('should return the client instance', () => {
        const client = createSupabaseClient('https://test.supabase.co', 'test-key')
        expect(client).toEqual({ mocked: true })
    })

    it('should throw when url is empty', () => {
        expect(() => createSupabaseClient('', 'test-key')).toThrow('Missing Supabase API credential')
    })

    it('should throw when apiKey is empty', () => {
        expect(() => createSupabaseClient('https://test.supabase.co', '')).toThrow('Missing Supabase API credential')
    })

    it('should throw when url is invalid', () => {
        expect(() => createSupabaseClient('not-a-url', 'test-key')).toThrow('Invalid Supabase project URL')
    })
})

// ---------------------------------------------------------------------------
// handleStorageError tests (ported from SupabaseStorageCommon.test.ts)
// ---------------------------------------------------------------------------
describe('handleStorageError', () => {
    it('should throw wrapped error when error is present', () => {
        expect(() => handleStorageError({ message: 'Bucket not found' })).toThrow('Supabase Storage error: Bucket not found')
    })

    it('should not throw when error is null', () => {
        expect(() => handleStorageError(null)).not.toThrow()
    })
})

// ---------------------------------------------------------------------------
// handleDbError tests
// ---------------------------------------------------------------------------
describe('handleDbError', () => {
    it('should return JSON.stringify(data) on success', () => {
        const result = handleDbError({ data: { id: 1, name: 'Ada' }, error: null })
        expect(result).toBe('{"id":1,"name":"Ada"}')
    })

    it('should wrap error message when error is present', () => {
        const result = handleDbError({ data: null, error: { message: 'Permission denied' } })
        const parsed = JSON.parse(result)
        expect(parsed).toEqual({ error: 'Permission denied' })
    })

    it('should handle empty array data (empty select result)', () => {
        const result = handleDbError({ data: [], error: null })
        expect(result).toBe('[]')
    })

    it('should handle array data with multiple rows', () => {
        const data = [{ id: 1 }, { id: 2 }]
        const result = handleDbError({ data, error: null })
        expect(JSON.parse(result)).toEqual(data)
    })

    it('should handle single object data (insert/update result)', () => {
        const result = handleDbError({ data: { id: 1, title: 'Task' }, error: null })
        const parsed = JSON.parse(result)
        expect(parsed).toEqual({ id: 1, title: 'Task' })
    })

    it('should return stringified null when both data and error are null', () => {
        const result = handleDbError({ data: null, error: null })
        expect(result).toBe('null')
    })
})

// ---------------------------------------------------------------------------
// applyFilters tests
// ---------------------------------------------------------------------------
describe('applyFilters', () => {
    it('should apply eq filter', () => {
        const query = new MockQueryBuilder()
        const result = applyFilters(query, [{ column: 'name', operator: 'eq', value: 'Ada' }])
        expect(query._calls).toEqual([{ method: 'eq', args: ['name', 'Ada'] }])
        expect(result).toBe(query) // returns same instance for chaining
    })

    it('should apply neq filter', () => {
        const query = new MockQueryBuilder()
        applyFilters(query, [{ column: 'status', operator: 'neq', value: 'deleted' }])
        expect(query._calls).toEqual([{ method: 'neq', args: ['status', 'deleted'] }])
    })

    it('should apply gt filter', () => {
        const query = new MockQueryBuilder()
        applyFilters(query, [{ column: 'age', operator: 'gt', value: 18 }])
        expect(query._calls).toEqual([{ method: 'gt', args: ['age', 18] }])
    })

    it('should apply lt filter', () => {
        const query = new MockQueryBuilder()
        applyFilters(query, [{ column: 'score', operator: 'lt', value: 100 }])
        expect(query._calls).toEqual([{ method: 'lt', args: ['score', 100] }])
    })

    it('should apply gte filter', () => {
        const query = new MockQueryBuilder()
        applyFilters(query, [{ column: 'age', operator: 'gte', value: 21 }])
        expect(query._calls).toEqual([{ method: 'gte', args: ['age', 21] }])
    })

    it('should apply lte filter', () => {
        const query = new MockQueryBuilder()
        applyFilters(query, [{ column: 'price', operator: 'lte', value: 500 }])
        expect(query._calls).toEqual([{ method: 'lte', args: ['price', 500] }])
    })

    it('should apply in filter', () => {
        const query = new MockQueryBuilder()
        applyFilters(query, [{ column: 'role', operator: 'in', value: ['admin', 'mod'] }])
        expect(query._calls).toEqual([{ method: 'in', args: ['role', ['admin', 'mod']] }])
    })

    it('should apply is filter', () => {
        const query = new MockQueryBuilder()
        applyFilters(query, [{ column: 'deleted_at', operator: 'is', value: null }])
        expect(query._calls).toEqual([{ method: 'is', args: ['deleted_at', null] }])
    })

    it('should apply like filter', () => {
        const query = new MockQueryBuilder()
        applyFilters(query, [{ column: 'title', operator: 'like', value: '%flow%' }])
        expect(query._calls).toEqual([{ method: 'like', args: ['title', '%flow%'] }])
    })

    it('should apply ilike filter', () => {
        const query = new MockQueryBuilder()
        applyFilters(query, [{ column: 'email', operator: 'ilike', value: '%@test.com' }])
        expect(query._calls).toEqual([{ method: 'ilike', args: ['email', '%@test.com'] }])
    })

    it('should apply multiple filters in order', () => {
        const query = new MockQueryBuilder()
        applyFilters(query, [
            { column: 'status', operator: 'eq', value: 'active' },
            { column: 'age', operator: 'gte', value: 18 },
            { column: 'name', operator: 'like', value: 'A%' }
        ])
        expect(query._calls).toEqual([
            { method: 'eq', args: ['status', 'active'] },
            { method: 'gte', args: ['age', 18] },
            { method: 'like', args: ['name', 'A%'] }
        ])
    })

    it('should return query unchanged when filters array is empty', () => {
        const query = new MockQueryBuilder()
        const result = applyFilters(query, [])
        expect(query._calls).toEqual([])
        expect(result).toBe(query)
    })

    it('should return the same query instance for further chaining', () => {
        const query = new MockQueryBuilder()
        const result = applyFilters(query, [{ column: 'id', operator: 'eq', value: 1 }])
        // The result should be the same object, allowing .order().limit() to chain
        expect(result).toBe(query)
    })
})

// ---------------------------------------------------------------------------
// FilterSchema validation tests
// ---------------------------------------------------------------------------
describe('FilterSchema', () => {
    it('should accept a valid filter', () => {
        const result = FilterSchema.safeParse({ column: 'name', operator: 'eq', value: 'Ada' })
        expect(result.success).toBe(true)
    })

    it('should reject an empty column', () => {
        const result = FilterSchema.safeParse({ column: '', operator: 'eq', value: 'x' })
        expect(result.success).toBe(false)
    })

    it('should reject an unknown operator', () => {
        const result = FilterSchema.safeParse({ column: 'name', operator: 'contains', value: 'x' })
        expect(result.success).toBe(false)
    })

    it('should accept all valid operators', () => {
        const operators = ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'is', 'like', 'ilike']
        for (const op of operators) {
            const result = FilterSchema.safeParse({ column: 'col', operator: op, value: 1 })
            expect(result.success).toBe(true)
        }
    })

    it('should accept any value type', () => {
        const values = ['string', 42, true, null, ['a', 'b'], { nested: true }]
        for (const v of values) {
            const result = FilterSchema.safeParse({ column: 'col', operator: 'eq', value: v })
            expect(result.success).toBe(true)
        }
    })
})
