import { HfInference } from '@huggingface/inference'
import { Embeddings, EmbeddingsParams } from '@langchain/core/embeddings'
import { getEnvironmentVariable } from '../../../src/utils'

export interface HuggingFaceInferenceEmbeddingsParams extends EmbeddingsParams {
    apiKey?: string
    model?: string
    endpoint?: string
}

export class HuggingFaceInferenceEmbeddings extends Embeddings implements HuggingFaceInferenceEmbeddingsParams {
    apiKey?: string

    endpoint?: string

    model: string

    client: HfInference

    constructor(fields?: HuggingFaceInferenceEmbeddingsParams) {
        super(fields ?? {})

        this.model = fields?.model ?? 'sentence-transformers/distilbert-base-nli-mean-tokens'
        this.apiKey = fields?.apiKey ?? getEnvironmentVariable('HUGGINGFACEHUB_API_KEY')
        this.endpoint = fields?.endpoint ?? ''
        const hf = new HfInference(this.apiKey)
        // v4 uses Inference Providers by default; only override if custom endpoint provided
        this.client = this.endpoint ? hf.endpoint(this.endpoint) : hf
    }

    private isRouterEndpoint(): boolean {
        if (!this.endpoint) return false
        return this.endpoint.includes('router.huggingface.co') || this.endpoint.includes('hf-inference/models/')
    }

    private normalizeRouterResponse(raw: unknown): number[][] {
        if (!Array.isArray(raw)) return []
        if (raw.length === 0) return []
        const first = (raw as any[])[0]
        if (first && typeof first === 'object' && 'embedding' in first) {
            return (raw as Array<{ embedding: number[] }>).map((item) => item.embedding)
        }
        return raw as number[][]
    }

    private async fetchRouterEmbeddings(texts: string[]): Promise<number[][]> {
        const clean = texts.map((text) => text.replace(/\n/g, ' '))
        const body = JSON.stringify({
            inputs: clean,
            model: this.model
        })
        const url = `${this.endpoint}/pipeline/feature-extraction`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey ?? ''}`
            },
            body
        })
        if (!response.ok) {
            throw new Error(`Router embedding request failed: ${response.status} ${response.statusText}`)
        }
        const raw = await response.json()
        return this.normalizeRouterResponse(raw)
    }

    async _embed(texts: string[]): Promise<number[][]> {
        if (this.isRouterEndpoint()) {
            return this.fetchRouterEmbeddings(texts)
        }

        // replace newlines, which can negatively affect performance.
        const clean = texts.map((text) => text.replace(/\n/g, ' '))
        const obj: any = {
            inputs: clean
        }
        if (!this.endpoint) {
            obj.model = this.model
        }

        const res = await this.caller.callWithOptions({}, this.client.featureExtraction.bind(this.client), obj)
        return res as number[][]
    }

    async embedQuery(document: string): Promise<number[]> {
        const res = await this._embed([document])
        return res[0]
    }

    async embedDocuments(documents: string[]): Promise<number[][]> {
        return this._embed(documents)
    }
}
