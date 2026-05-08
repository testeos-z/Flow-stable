import { createSupabaseClient, handleStorageError } from './SupabaseStorageCommon'
import { createClient } from '@supabase/supabase-js'

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({ mocked: true }))
}))

describe('SupabaseStorageCommon', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('createSupabaseClient', () => {
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

    describe('handleStorageError', () => {
        it('should throw wrapped error when error is present', () => {
            expect(() => handleStorageError({ message: 'Bucket not found' })).toThrow('Supabase Storage error: Bucket not found')
        })

        it('should not throw when error is null', () => {
            expect(() => handleStorageError(null)).not.toThrow()
        })
    })
})
