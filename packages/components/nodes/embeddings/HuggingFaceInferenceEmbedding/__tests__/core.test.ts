import { HuggingFaceInferenceEmbeddings } from '../core'

describe('HuggingFaceInferenceEmbeddings router path', () => {
    const routerEndpoint = 'https://router.huggingface.co/hf-inference/models/intfloat/multilingual-e5-large-instruct'
    const privateEndpoint = 'https://my-private-endpoint.com'
    const model = 'intfloat/multilingual-e5-large-instruct'

    let fetchSpy: jest.SpyInstance

    beforeEach(() => {
        fetchSpy = jest
            .spyOn(global, 'fetch')
            .mockImplementation(
                async () =>
                    new Response(JSON.stringify([[0.1, 0.2, 0.3]]), { status: 200, headers: { 'Content-Type': 'application/json' } })
            )
    })

    afterEach(() => {
        fetchSpy.mockRestore()
    })

    it('detects router endpoint by router.huggingface.co substring', async () => {
        const embeddings = new HuggingFaceInferenceEmbeddings({ endpoint: routerEndpoint, model })
        await embeddings.embedDocuments(['hello'])
        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('detects router endpoint by hf-inference/models/ substring', async () => {
        const altRouter = 'https://my-proxy.com/hf-inference/models/foo/bar'
        const embeddings = new HuggingFaceInferenceEmbeddings({ endpoint: altRouter, model })
        await embeddings.embedDocuments(['hello'])
        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('posts to /pipeline/feature-extraction with inputs and model', async () => {
        const embeddings = new HuggingFaceInferenceEmbeddings({ endpoint: routerEndpoint, model })
        await embeddings.embedDocuments(['hello', 'world'])
        expect(fetchSpy).toHaveBeenCalledTimes(1)
        const [url, init] = fetchSpy.mock.calls[0]
        expect(url.toString()).toBe(`${routerEndpoint}/pipeline/feature-extraction`)
        const body = JSON.parse(init.body as string)
        expect(body.inputs).toEqual(['hello', 'world'])
        expect(body.model).toBe(model)
        expect(init.method).toBe('POST')
        expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })
    })

    it('flattens nested response [{"embedding": [...]}] to number[][]', async () => {
        fetchSpy.mockImplementation(
            async () =>
                new Response(JSON.stringify([{ embedding: [0.1, 0.2, 0.3] }]), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                })
        )
        const embeddings = new HuggingFaceInferenceEmbeddings({ endpoint: routerEndpoint, model })
        const result = await embeddings.embedDocuments(['hello'])
        expect(result).toEqual([[0.1, 0.2, 0.3]])
    })

    it('flattens nested response for multiple texts', async () => {
        fetchSpy.mockImplementation(
            async () =>
                new Response(JSON.stringify([{ embedding: [0.1] }, { embedding: [0.2] }]), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                })
        )
        const embeddings = new HuggingFaceInferenceEmbeddings({ endpoint: routerEndpoint, model })
        const result = await embeddings.embedDocuments(['hello', 'world'])
        expect(result).toEqual([[0.1], [0.2]])
    })

    it('leaves flat response [[...]] unchanged', async () => {
        fetchSpy.mockImplementation(
            async () => new Response(JSON.stringify([[0.1, 0.2, 0.3]]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        )
        const embeddings = new HuggingFaceInferenceEmbeddings({ endpoint: routerEndpoint, model })
        const result = await embeddings.embedDocuments(['hello'])
        expect(result).toEqual([[0.1, 0.2, 0.3]])
    })

    it('throws on non-OK router response', async () => {
        fetchSpy.mockImplementation(async () => new Response('Internal Server Error', { status: 500, statusText: 'Internal Server Error' }))
        const embeddings = new HuggingFaceInferenceEmbeddings({ endpoint: routerEndpoint, model })
        await expect(embeddings.embedDocuments(['hello'])).rejects.toThrow('Router embedding request failed: 500 Internal Server Error')
    })

    it('embedQuery uses router path for single document', async () => {
        fetchSpy.mockImplementation(
            async () => new Response(JSON.stringify([[0.1, 0.2, 0.3]]), { status: 200, headers: { 'Content-Type': 'application/json' } })
        )
        const embeddings = new HuggingFaceInferenceEmbeddings({ endpoint: routerEndpoint, model })
        const result = await embeddings.embedQuery('hello')
        expect(result).toEqual([0.1, 0.2, 0.3])
        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })
})

describe('HuggingFaceInferenceEmbeddings legacy path', () => {
    const model = 'sentence-transformers/distilbert-base-nli-mean-tokens'

    it('private endpoint uses HfInference.endpoint() and does NOT call fetch', async () => {
        const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response(JSON.stringify([[0.1]]), { status: 200 }))
        const embeddings = new HuggingFaceInferenceEmbeddings({ endpoint: 'https://my-private-endpoint.com', model })
        // We can't easily spy on HfInference.endpoint internals without heavy mocking,
        // but we can assert fetch is NOT called for private endpoints.
        try {
            await embeddings.embedDocuments(['hello'])
        } catch {
            // private endpoint will fail because we have no real backend — that's fine
        }
        expect(fetchSpy).not.toHaveBeenCalled()
        fetchSpy.mockRestore()
    })

    it('no endpoint uses HfInference with model in body and does NOT call fetch', async () => {
        const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () => new Response(JSON.stringify([[0.1]]), { status: 200 }))
        const embeddings = new HuggingFaceInferenceEmbeddings({ model })
        try {
            await embeddings.embedDocuments(['hello'])
        } catch {
            // will fail without real backend — that's fine
        }
        expect(fetchSpy).not.toHaveBeenCalled()
        fetchSpy.mockRestore()
    })
})
