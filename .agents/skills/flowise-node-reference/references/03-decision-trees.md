# Decision Trees

## 1. ¿Qué tipo de flow usar?

```
❓ ¿Qué necesito construir?
│
├── Un chat que responda sobre documentos → CHATFLOW (RAG)
│   └── Usá: Document Loader → Splitter → Embeddings → Vector Store → Retriever → LLM
│
├── Un agente que decida qué herramientas usar → AGENTFLOW
│   └── Usá: Agent Node (con Tools) + Memory
│
├── Un flujo paso a paso con múltiples agentes → SEQUENTIAL AGENTS
│   └── Usá: Start → Agent/LLM/Condition → ... → End
│
├── Un supervisor que delega tareas → MULTI AGENTS
│   └── Usá: Supervisor + Workers
│
└── Una transformación simple de datos → CHATFLOW (LLM Chain)
    └── Usá: LLM Chain o Custom JS Function
```

## 2. ¿Qué Chat Model elegir?

```
❓ ¿Qué modelo de chat usar?
│
├── ¿Querés algo que ande ya, sin configurar?
│   ├── ¿Tenés API key de OpenAI? → ChatOpenAI (GPT-4o-mini)
│   └── ¿No tenés nada? → Ollama (local, gratis)
│
├── ¿Necesitás razonamiento profundo?
│   ├── ¿Presupuesto alto? → Anthropic Claude Opus 4
│   ├── ¿Económico y capaz? → Deepseek R1/V3
│   └── ¿Balance? → OpenAI o1 / Claude Sonnet 4
│
├── ¿Multimodal (imágenes)?
│   ├── ¿Google? → Google Gemini 2.5 Pro
│   ├── ¿OpenAI? → ChatOpenAI (GPT-4o)
│   └── ¿Anthropic? → ChatAnthropic Claude 3.5 Sonnet+
│
├── ¿Velocidad > calidad?
│   ├── Groq (Llama 3) → Ultrarrápido
│   └── Cerebras → También muy rápido
│
├── ¿Sin costo de API?
│   └── Ollama (local) → Cualquier modelo open-source
│
├── ¿Enterprise / GCP? → Google VertexAI
├── ¿Enterprise / AWS? → AWS Bedrock (Claude)
├── ¿Enterprise / Azure? → Azure OpenAI
└── ¿Querés un proxy unificado? → LiteLLM u OpenRouter
```

## 3. ¿Qué Embeddings elegir?

```
❓ ¿Qué embeddings usar?
│
├── ¿Querés lo más simple?
│   └── OpenAI Embedding (text-embedding-3-small)
│
├── ¿Sin costo de API? → Ollama Embedding (local)
├── ¿Gratis pero cloud? → Google Gemini Embedding
├── ¿Multilingüe? → Cohere Embedding
├── ¿Open-source hosteado? → TogetherAI / Jina
├── ¿Late chunking para mejor precisión? → Jina Embedding v3
├── ¿Alta calidad? → VoyageAI / OpenAI text-embedding-3-large
└── ¿Ya estás en un cloud?
    ├── AWS → Bedrock (Titan)
    ├── GCP → VertexAI
    ├── Azure → Azure OpenAI
    └── IBM → Watsonx
```

## 4. ¿Qué Vector Store elegir?

```
❓ ¿Dónde guardar los vectores?
│
├── ¿Ya usás Supabase?
│   └── Supabase Vector Store (gratis hasta 500MB, pgvector)
│
├── ¿Prototipado / Dev local?
│   ├── In-Memory Vector Store (no persiste)
│   └── Chroma (simple, persiste)
│
├── ¿Producción cloud?
│   ├── Pinecone → Escalable, fácil, caro
│   ├── Qdrant → Rápido, buenos filtros
│   ├── Weaviate → Híbrido vector + objeto
│   └── Supabase → Económico, si ya lo tenés
│
├── ¿Serverless / sin operar?
│   ├── Astra (DataStax) → Cassandra-based
│   ├── Upstash Vector → Redis serverless
│   └── Vectara → Search as a Service
│
├── ¿Ya tenés Postgres? → pgvector
├── ¿Ya tenés MongoDB? → MongoDB Atlas
├── ¿Ya tenés Elasticsearch? → Elasticsearch
├── ¿Ya tenés Redis? → Redis (con Redisearch)
├── ¿Alta escala? → Milvus (GPU accelerated)
└── ¿Solo búsqueda full-text + vector? → Meilisearch
```

## 5. ¿Qué Memory elegir?

```
❓ ¿Qué tipo de memoria necesito?
│
├── ¿Solo la conversación actual?
│   ├── ¿Los últimos N mensajes bastan?
│   │   ├── Sí → Buffer Window Memory (k=10 default)
│   │   └── No → Buffer Memory (todo el historial)
│   └── ¿Querés resumir cuando se alarga?
│       └── Conversation Summary Buffer (maxTokenLimit)
│
├── ¿Necesito memoria entre sesiones (perfil de usuario)?
│   └── Mem0 / Zep Memory
│
├── ¿Estoy usando Sequential Agents?
│   ├── ¿SQLite basta? → Agent Memory (SQLite)
│   ├── ¿Postgres? → Postgres Agent Memory
│   └── ¿MySQL? → MySQL Agent Memory
│
├── ¿Alta concurrencia?
│   ├── Redis-Backed Chat Memory
│   └── Upstash Redis-Backed (serverless)
│
└── ¿Ya tenés una DB?
    ├── MongoDB → MongoDB Atlas Chat Memory
    ├── DynamoDB → DynamoDB Chat Memory
    └── Postgres → Postgres Agent Memory
```

## 6. ¿Qué Tool de búsqueda web usar?

```
❓ ¿Necesito buscar en internet?
│
├── ¿Quiero algo simple y gratuito?
│   └── BraveSearch API (gratis 2000 req/mes)
│
├── ¿Quiero resultados optimizados para AI?
│   └── Tavily API (optimizado para LLMs, incluye contenido)
│
├── ¿Quiero resultados de Google?
│   ├── Serper (rápido, 2500 gratis/mes)
│   └── Serp API (más control, 100 gratis/mes)
│
├── ¿Necesito search engine para LLMs avanzado?
│   └── Exa Search (búsqueda semántica + keyword)
│
├── ¿Quiero un search engine auto-hosteado?
│   └── SearXNG (self-hosted, privado)
│
└── ¿Ya uso MCP? → Brave Search MCP
```

## 7. ¿Qué Document Loader usar?

```
❓ ¿De dónde vienen los datos?
│
├── ¿Archivos locales?
│   ├── PDF → PDF File
│   ├── Word → Microsoft Word / Docx File
│   ├── Excel → Microsoft Excel
│   ├── PowerPoint → Microsoft PowerPoint
│   ├── CSV → Csv File
│   ├── JSON → Json File / Json Lines File
│   ├── EPUB → Epub File
│   └── Varios → File Loader / Folder with Files
│
├── ¿Web?
│   ├── Simple → Cheerio Web Scraper
│   ├── Con JS → Playwright / Puppeteer
│   └── Profesional → FireCrawl / Apify / Spider
│
├── ¿Cloud/SaaS?
│   ├── Documentación → Confluence / GitBook / Notion
│   ├── Código → GitHub
│   ├── Diseño → Figma
│   └── Proyectos → Jira
│
└── ¿API? → API Loader / Custom Document Loader
```

## 8. ¿Qué tipo de nodo usar en Sequential Agents?

```
❓ ¿Qué nodo de Sequential Agents necesito?
│
├── ¿Es el punto de entrada? → Start
├── ¿Necesito un agente con herramientas? → Agent
├── ¿Solo generar texto sin tools? → LLM Node
├── ¿Ejecutar un tool específico? → Tool Node
├── ¿Bifurcar según condición?
│   ├── ¿Reglas fijas? → Condition
│   └── ¿Decisión del LLM? → Condition Agent
├── ¿Código custom? → Custom JS Function
├── ¿Ejecutar otro flujo? → Execute Flow
├── ¿Iterar/refinar? → Loop
├── ¿Terminar? → End
└── ¿Estado compartido custom? → State (en Start)
```

## 9. ¿Cache o no cache?

```
❓ ¿Necesito cache?
│
├── ¿Respuestas repetitivas?
│   └── In-Memory Cache (dev) / Redis Cache (prod)
│
├── ¿Embeddings caros de regenerar?
│   └── Redis Embeddings Cache (cachea vectores)
│
├── ¿Serverless? → Momento / Upstash Redis
└── ¿Ya tengo Redis? → Redis Cache
```

## 10. ¿Rerank o no rerank?

```
❓ Mi RAG necesita mejorar precisión?
│
├── ¿Resultados relevantes pero no exactos?
│   └── Añadí Cohere Rerank / Jina Rerank / Voyage Rerank
│
├── ¿Necesito combinar múltiples fuentes?
│   └── Reciprocal Rank Fusion Retriever
│
└── ¿Los resultados son pobres porque la query es mala?
    └── Multi Query Retriever (genera queries alternativas)
```
