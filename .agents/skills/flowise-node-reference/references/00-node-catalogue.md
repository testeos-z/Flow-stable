# Node Catalogue — 302 nodos

## Chat Models (36)

| Nodo                  | Provider     | ¿Cuándo usarlo?                                          |
| --------------------- | ------------ | -------------------------------------------------------- |
| OpenAI ×2             | OpenAI       | Default. GPT-4, GPT-4o-mini. Razonamiento o-series       |
| Azure OpenAI ×2       | Azure OpenAI | Si usás Azure. Misma API que OpenAI                      |
| Anthropic Claude ×2   | Anthropic    | Claude 4 Opus/Sonnet, Haiku. Mejor en razonamiento largo |
| Google Gemini ×2      | Google       | Gemini 2.5 Pro/Flash. Gratuito vía API key. Multimodal   |
| Google VertexAI       | GCP          | Si estás en GCP. Gemini via Vertex                       |
| Ollama ×2             | Local        | Modelos locales open-source. Sin dep. externa            |
| AWS Bedrock           | AWS          | Si ya estás en AWS. Claude via Bedrock                   |
| MistralAI ×2          | Mistral      | Mistral Large, Small. Bueno código y multilingüe         |
| Groq                  | Groq         | Inferencia ultrarrápida. Llama, Mixtral                  |
| Deepseek              | DeepSeek     | DeepSeek R1/V3. Razonamiento. Muy económico              |
| xAI Grok              | xAI          | Grok. Alternativa                                        |
| Cohere                | Cohere       | Command R/R+. Enfoque empresarial                        |
| TogetherAI ×2         | TogetherAI   | Muchos modelos open-source hosteados                     |
| Fireworks AI          | Fireworks    | Modelos open-source optimizados                          |
| HuggingFace           | HuggingFace  | Cualquier modelo de HF (con provider o endpoint propio)  |
| OpenRouter            | OpenRouter   | Gateway a múltiples providers. Unifica APIs              |
| Perplexity            | Perplexity   | Modelos de Perplexity con búsqueda integrada             |
| Cerebras              | Cerebras     | Inferencia ultrarrápida                                  |
| LocalAI               | LocalAI      | APIs estilo OpenAI con modelos locales                   |
| LiteLLM               | LiteLLM      | Proxy unificado a 100+ providers                         |
| SambaNova             | SambaNova    | Modelos open-source acelerados                           |
| Nvidia NIM            | Nvidia       | Modelos optimizados en GPUs Nvidia                       |
| Comet                 | CometAPI     | Gateway multi-provider                                   |
| IBM Watsonx           | IBM          | Modelos de watsonx.ai                                    |
| Alibaba Tongyi        | Alibaba      | Modelos Qwen                                             |
| Baidu Wenxin          | Baidu        | Modelos ERNIE                                            |
| Cloudflare Workers AI | Cloudflare   | Edge inference. Modelos via CF Workers                   |
| Nemo Guardrails       | Nvidia       | Modelos con guardrails de seguridad                      |

## Embeddings (18)

| Nodo                            | ¿Cuándo usarlo?                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------- |
| OpenAI Embedding ×2             | Default. text-embedding-ada-002, text-embedding-3-\*. Calidad/precio balanceado |
| Azure OpenAI Embedding ×2       | Si usás Azure OpenAI                                                            |
| Google Gemini Embedding         | Gratis. gemini-embedding-exp                                                    |
| Google VertexAI Embedding       | Si estás en GCP                                                                 |
| Ollama Embedding                | Local. Sin API key. Ideal para dev/testing                                      |
| Cohere Embedding                | Embeddings multilingües. Bueno para RAG empresarial                             |
| MistralAI Embedding             | Mistral Embed. Buen rendimiento                                                 |
| AWS Bedrock Embedding           | Si estás en AWS. Titan                                                          |
| HuggingFace Inference Embedding | Modelos open-source de HF                                                       |
| Jina Embedding                  | Jina embeddings v3. Late chunking                                               |
| VoyageAI Embedding              | Voyage. Optimizado para RAG                                                     |
| TogetherAI Embedding            | Modelos open-source hosteados                                                   |
| LocalAI Embedding               | Local. APIs estilo OpenAI                                                       |
| IBM Watsonx Embedding           | Si usás IBM                                                                     |
| Baidu Qianfan Embedding         | Si usás Baidu                                                                   |

## Memory (15)

| Nodo                        | Persistencia | ¿Cuándo usarlo?                                              |
| --------------------------- | :----------: | ------------------------------------------------------------ |
| Buffer Memory               |  Flowise DB  | Default. Conversación simple sin expiración                  |
| Buffer Window Memory        |  Flowise DB  | Últimos N mensajes. Control de tokens                        |
| Conversation Summary Memory |     LLM      | Resumen automático. Ahorra tokens                            |
| Conversation Summary Buffer |     LLM      | Híbrido: últimos mensajes + resumen cuando excede límite     |
| Agent Memory (SQLite)       |    SQLite    | Memoria para Sequential Agents. Default                      |
| Agent Memory (Postgres)     |   Postgres   | Sequential Agents con Postgres. Escalable                    |
| Agent Memory (MySQL)        |    MySQL     | Sequential Agents con MySQL                                  |
| Mem0                        |  Mem0 Cloud  | Memoria con perfil de usuario. Personalización cross-session |
| Redis-Backed Chat Memory    |    Redis     | Memoria rápida. Bueno para alta concurrencia                 |
| Upstash Redis-Backed        |   Upstash    | Redis serverless. Sin infraestructura                        |
| MongoDB Atlas Chat Memory   |   MongoDB    | Si ya usás MongoDB                                           |
| DynamoDB Chat Memory        |   DynamoDB   | Si estás en AWS                                              |
| Zep Memory (OS)             |  Zep Server  | Memoria open-source con perfil de usuario                    |
| Zep Memory (Cloud)          |  Zep Cloud   | Versión cloud de Zep                                         |

## Chains (13)

| Nodo                              | ¿Cuándo usarlo?                                           |
| --------------------------------- | --------------------------------------------------------- |
| Conversation Chain                | Chat simple. Reemplazado por LLM Node/Agent en Agentflows |
| LLM Chain                         | Prompt → LLM. Útil para transformaciones simples          |
| Retrieval QA Chain                | RAG básico: recupera de vector store y responde           |
| Conversational Retrieval QA Chain | RAG con historial de chat                                 |
| Multi Retrieval QA Chain          | RAG con múltiples retrievers en paralelo                  |
| VectorDB QA Chain                 | QA directo desde vector store con chat history            |
| Multi Prompt Chain                | Enruta a diferentes prompts según input                   |
| Sql Database Chain                | Consultas SQL en lenguaje natural                         |
| Graph Cypher QA Chain             | Consultas a Neo4j en lenguaje natural                     |
| GET API Chain                     | LLM + llamada GET a API                                   |
| POST API Chain                    | LLM + llamada POST a API                                  |
| OpenAPI Chain                     | LLM + API completa documentada con OpenAPI                |
| Vectara QA Chain                  | RAG con Vectara (search-as-a-service)                     |

## Tools (39)

| Nodo                           | Función                               |    Requiere credencial?    |
| ------------------------------ | ------------------------------------- | :------------------------: |
| BraveSearch API                | Búsqueda web tiempo real              |     ✅ braveSearchApi      |
| Tavily API                     | Búsqueda web optimizada para AI       |        ✅ tavilyApi        |
| SearchApi                      | Motor de búsqueda unificado           |        ✅ searchApi        |
| Serp API                       | Google Search API                     |         ✅ serpApi         |
| Serper                         | Google Search API (rápido)            |        ✅ serperApi        |
| Exa Search                     | Search engine para LLMs               |      ✅ exaSearchApi       |
| SearXNG                        | Búsqueda auto-hosteada                |             ❌             |
| Calculator                     | Operaciones matemáticas               |             ❌             |
| CurrentDateTime                | Fecha/hora actual                     |             ❌             |
| Web Browser                    | Navegación web scrape                 |             ❌             |
| JSON Path Extractor            | Extrae campos de JSON                 |             ❌             |
| Chatflow Tool                  | Ejecuta otro chatflow                 | ✅ chatflowApi (opcional)  |
| Agent as Tool                  | Ejecuta otro agentflow                | ✅ agentflowApi (opcional) |
| Custom Tool                    | Tool creada por el usuario en Flowise |             ❌             |
| Chain Tool                     | Usa una chain como tool               |             ❌             |
| Retriever Tool                 | Recupera desde vector store           |             ❌             |
| QueryEngine Tool               | Motor de consultas (LlamaIndex)       |             ❌             |
| OpenAPI Toolkit                | Consume APIs documentadas             |             ❌             |
| Code Interpreter E2B           | Ejecuta Python en sandbox             |    ✅ E2BApi (opcional)    |
| Composio                       | 250+ apps integradas                  |       ✅ composioApi       |
| Gmail                          | Opera drafts, messages, labels        |       ✅ gmailOAuth2       |
| Google Calendar                | Eventos, freebusy                     |  ✅ googleCalendarOAuth2   |
| Google Custom Search           | Búsqueda Google                       |  ✅ googleCustomSearchApi  |
| Google Docs                    | Documentos                            |    ✅ googleDocsOAuth2     |
| Google Drive                   | Archivos                              |    ✅ googleDriveOAuth2    |
| Google Sheets                  | Spreadsheets                          |   ✅ googleSheetsOAuth2    |
| Jira                           | Issues y proyectos                    |         ✅ jiraApi         |
| Microsoft Outlook              | Correo y calendario                   | ✅ microsoftOutlookOAuth2  |
| Microsoft Teams                | Mensajes y canales                    |  ✅ microsoftTeamsOAuth2   |
| StripeAgentTool                | Operaciones Stripe                    |        ✅ stripeApi        |
| Arxiv                          | Busca papers académicos               |             ❌             |
| WolframAlpha                   | Conocimiento computacional            |    ✅ wolframAlphaAppId    |
| Requests (GET/POST/PUT/DELETE) | HTTP requests                         |    ❌ (opcional: auth)     |
| AWSDynamoDB KV Storage         | Key-value en DynamoDB                 |         ✅ awsApi          |
| AWS SNS                        | Notificaciones SNS                    |         ✅ awsApi          |

## Tools (MCP) — 11

| Nodo                    | Función                           | Requiere credencial? |
| ----------------------- | --------------------------------- | :------------------: |
| Custom MCP              | Cualquier MCP server configurable |    ❌ (usa vars)     |
| Custom MCP Server       | MCP servers del workspace         |          ❌          |
| Brave Search MCP        | Búsqueda web vía MCP              |  ✅ braveSearchApi   |
| Browserless MCP         | Scraping, screenshots             |  ✅ browserlessApi   |
| Github MCP              | GitHub API vía MCP                |     ✅ githubApi     |
| Pipedream MCP           | 1000+ apps vía Pipedream          | ✅ pipedreamOAuthApi |
| PostgreSQL MCP          | Consultas SQL read-only           |    ✅ PostgresUrl    |
| Sequential Thinking MCP | Razonamiento estructurado         |          ❌          |
| Slack MCP               | Slack API vía MCP                 |     ✅ slackApi      |
| Supergateway MCP        | Convierte MCP stdio a SSE/WS      |          ❌          |
| Teradata MCP            | Teradata database                 |  ✅ teradataTD2Auth  |

## Sequential Agents (11)

| Nodo               | ¿Qué hace?                                        | ¿Cuándo usarlo?                                        |
| ------------------ | ------------------------------------------------- | ------------------------------------------------------ |
| Start              | Punto de entrada. Define modelo + state + memoria | SIEMPRE es el primer nodo                              |
| Agent              | Agente con tools. System prompt, tools, approvals | Cuando necesitás un agente autónomo con herramientas   |
| LLM Node           | LLM sin tools. Structured output                  | Cuando solo necesitás generar texto sin herramientas   |
| Tool Node          | Ejecuta UN tool específico                        | Cuando querés ejecutar un tool puntual                 |
| Condition          | If/Else sobre variables del state                 | Para bifurcar el flujo según condiciones               |
| Condition Agent    | Usa un LLM para decidir ruta                      | Cuando la condición es difusa o semántica              |
| Custom JS Function | Código JS arbitrario                              | Para transformaciones custom que no cubren otros nodos |
| Execute Flow       | Ejecuta otro chatflow/agentflow                   | Para delegar a otro flujo                              |
| Loop               | Loop hacia atrás a un nodo específico             | Para iterar hasta cumplir condición                    |
| End                | Termina la ejecución                              | Siempre al final del grafo                             |
| State              | Define schema de estado custom                    | Cuando necesitás estado compartido entre nodos         |

## Document Loaders (41)

| Categoría     | Nodos                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------- |
| **Web**       | Cheerio Web Scraper, Playwright, Puppeteer, FireCrawl, Apify, Spider, Oxylabs                  |
| **Cloud**     | GitHub, GitBook, Figma, Confluence, Notion (DB/Folder/Page), Jira, Google Drive, Google Sheets |
| **Files**     | PDF, CSV, JSON, JSONL, DOCX, EPUB, PPTX, XLSX, TXT, Plain Text, File Loader, Folder with Files |
| **Databases** | Airtable, S3, S3 Directory, BraveSearch API Doc Loader, SearchApi, SerpApi                     |
| **Other**     | API Loader, Custom Document Loader, Document Store, Unstructured, VectorStore To Document      |

## Vector Stores (26)

| Nodo                      | Tipo                | ¿Cuándo usarlo?                               |
| ------------------------- | ------------------- | --------------------------------------------- |
| **Supabase**              | Cloud (Postgres)    | Si ya usás Supabase. Gratuito hasta 500MB     |
| Pinecone ×2               | Cloud (managed)     | Escalable, fácil setup. Bueno para producción |
| Qdrant                    | Cloud/Self-hosted   | Rápido. Filtros avanzados                     |
| Weaviate                  | Cloud/Self-hosted   | Híbrido vector + objeto                       |
| Chroma                    | Self-hosted (local) | Dev/testing. Muy simple                       |
| Milvus                    | Self-hosted         | Alta escala. GPU accelerated                  |
| MongoDB Atlas             | Cloud               | Si ya usás MongoDB                            |
| Elasticsearch             | Self-hosted/Cloud   | Búsqueda híbrida (keyword + vector)           |
| OpenSearch                | Self-hosted         | Similar a Elasticsearch. Open source          |
| Postgres (pgvector)       | Self-hosted         | Si tenés Postgres. Extensión pgvector         |
| Redis                     | Self-hosted/Cloud   | Cache + vector search                         |
| Faiss                     | Local               | En memoria. Dev/prototipado                   |
| Astra (DataStax)          | Cloud               | Cassandra-based. Serverless                   |
| Couchbase                 | Self-hosted/Cloud   | NoSQL + vector                                |
| Meilisearch               | Self-hosted/Cloud   | Búsqueda full-text + vector                   |
| SingleStore               | Cloud/Self-hosted   | SQL + vector. Tiempo real                     |
| Upstash Vector            | Cloud (serverless)  | Redis serverless. Sin infra                   |
| Vectara                   | Cloud (managed)     | Search-as-a-service. Sin operar               |
| AWS Kendra                | AWS                 | Indexado inteligente AWS                      |
| In-Memory                 | Local               | Testing. No persiste                          |
| SimpleStore               | Local               | Dev básico                                    |
| Zep Collection (OS/Cloud) | Zep                 | Memoria + vectores                            |
| Document Store (Vector)   | Flowise DB          | Documentos upserteados en Flowise             |

## Retrievers (15)

| Nodo                        | ¿Cuándo usarlo?                            |
| --------------------------- | ------------------------------------------ |
| Vector Store Retriever      | Default. Recupera chunks similares         |
| Multi Query Retriever       | Genera múltiples queries para mejor recall |
| Similarity Score Threshold  | Solo resultados por encima de un threshold |
| HyDE Retriever              | Genera un doc hipotético y busca similares |
| Embeddings Filter Retriever | Filtra metadata antes de buscar            |
| LLM Filter Retriever        | Usa LLM para filtrar resultados            |
| Extract Metadata Retriever  | Extrae metadata de las queries             |
| Prompt Retriever            | Recupera prompts en lugar de docs          |
| Reciprocal Rank Fusion      | Combina múltiples retrievers (RAG fusion)  |
| Cohere Rerank               | Rerank con Cohere. Mejora precisión        |
| Azure Rerank                | Rerank con Azure AI                        |
| Jina AI Rerank              | Rerank con Jina                            |
| Voyage AI Rerank            | Rerank con VoyageAI                        |
| AWS Bedrock KB Retriever    | Recupera de Knowledge Base de AWS Bedrock  |
| Custom Retriever            | Retriever custom codeado                   |

## Text Splitters (6)

| Nodo                              | ¿Cuándo usarlo?                                       |
| --------------------------------- | ----------------------------------------------------- |
| Recursive Character Text Splitter | **Default**. Inteligente: respeta párrafos, oraciones |
| Character Text Splitter           | Simple. Divide por caracteres. Rápido                 |
| Token Text Splitter               | Divide por tokens. Predecible para LLM context        |
| Markdown Text Splitter            | Respeta estructura Markdown. Para docs formateados    |
| HtmlToMarkdown Text Splitter      | Convierte HTML a MD y divide. Para web scraping       |
| Code Text Splitter                | Divide código respetando sintaxis. Para codebases     |

## Utilities (5)

| Nodo               | ¿Cuándo usarlo?                            |
| ------------------ | ------------------------------------------ |
| Custom JS Function | Ejecuta JS arbitrario en el flujo          |
| Set Variable       | Persiste valores en variables globales     |
| Get Variable       | Lee variables globales                     |
| IfElse Function    | Condicional simple (no requiere agente)    |
| Sticky Note        | Solo documentación visual. No ejecuta nada |

## Cache (5)

| Nodo                   | ¿Cuándo usarlo?               |
| ---------------------- | ----------------------------- |
| In-Memory Cache        | Dev/testing. Sin persistencia |
| Momento Cache          | Cache serverless. Sin infra   |
| Redis Cache            | Cache rápida compartida       |
| Redis Embeddings Cache | Cachea embeddings en Redis    |
| Upstash Redis Cache    | Redis serverless              |

## Multi Agents (2)

| Nodo       | ¿Cuándo usarlo?                                   |
| ---------- | ------------------------------------------------- |
| Supervisor | Agente que orquesta workers. Define tasks, asigna |
| Worker     | Agente que ejecuta tasks asignadas por Supervisor |

## Otros

| Categoría            | Nodos | Nota                                                              |
| -------------------- | :---: | ----------------------------------------------------------------- |
| Output Parsers       |   4   | CSV, List, Structured, Advanced Structured                        |
| Prompts              |   3   | Chat Prompt, Few Shot, Prompt Template                            |
| Moderation           |   2   | OpenAI Moderation, Simple Prompt                                  |
| Record Manager       |   3   | MySQL, Postgres, SQLite (deduplicación)                           |
| Engine               |   4   | Context Chat, Simple Chat, Query, Sub Question Query (LlamaIndex) |
| Graph                |   1   | Neo4j (graph database)                                            |
| Analytics            |   1   | LangFuse (tracing y monitoreo)                                    |
| Response Synthesizer |   4   | Compact&Refine, Refine, Simple, TreeSummarize (LlamaIndex)        |
| LLMs                 |  12   | Versión LlamaIndex (DEPRECATING)                                  |
