# Credential Map — 100 credenciales

## AI Providers

| Credencial           | Nodos que la requieren                                                |
| -------------------- | --------------------------------------------------------------------- |
| `openAIApi`          | ChatOpenAI (×2), OpenAI Embedding (×2), OpenAI Custom Embedding       |
| `anthropicApi`       | ChatAnthropic (×2)                                                    |
| `googleGenerativeAI` | ChatGoogleGemini, Google Gemini Embedding                             |
| `googleVertexAuth`   | ChatGoogleVertexAI, Google VertexAI Embedding                         |
| `mistralAIApi`       | ChatMistralAI (×2), MistralAI Embedding                               |
| `cohereApi`          | ChatCohere, Cohere Embedding, Cohere Rerank Retriever                 |
| `huggingFaceApi`     | ChatHuggingFace, HuggingFace Inference Embedding                      |
| `deepseekApi`        | ChatDeepseek                                                          |
| `groqApi`            | ChatGroq                                                              |
| `fireworksApi`       | ChatFireworks                                                         |
| `togetherAIApi`      | ChatTogetherAI (×2), TogetherAI Embedding                             |
| `perplexityApi`      | ChatPerplexity                                                        |
| `sambanovaApi`       | ChatSambaNova                                                         |
| `xaiApi`             | ChatXAI (Grok)                                                        |
| `cerebrasAIApi`      | ChatCerebras                                                          |
| `litellmApi`         | ChatLiteLLM                                                           |
| `localAIApi`         | ChatLocalAI, LocalAI Embedding                                        |
| `cometApi`           | ChatComet                                                             |
| `nvidiaNIMApi`       | ChatNvidiaNIM                                                         |
| `openRouterApi`      | ChatOpenRouter                                                        |
| `ollamaApi`          | ChatOllama (opcional — no necesita si es local)                       |
| `replicateApi`       | LLM Replicate                                                         |
| `azureOpenAIApi`     | AzureChatOpenAI (×2), Azure OpenAI Embedding (×2)                     |
| `awsApi`             | AWSChatBedrock, AWSBedrock Embedding, AWSDynamoDB KV Storage, AWS SNS |
| `azureFoundryApi`    | AzureFoundry (Azure AI Studio)                                        |
| `ibmWatsonx`         | ChatIBMWatsonx, IBM Watsonx Embedding                                 |
| `baiduQianfanApi`    | ChatBaiduWenxin, Baidu Qianfan Embedding                              |
| `cloudflareApi`      | ChatCloudflareWorkersAI                                               |
| `AlibabaApi`         | ChatAlibabaTongyi                                                     |

## Vector Stores & Databases

| Credencial         | Nodos                                                 |
| ------------------ | ----------------------------------------------------- |
| `supabaseApi`      | Supabase Vector Store                                 |
| `pineconeApi`      | Pinecone Vector Store (×2)                            |
| `qdrantApi`        | Qdrant Vector Store                                   |
| `weaviateApi`      | Weaviate Vector Store                                 |
| `chromaApi`        | Chroma Vector Store                                   |
| `milvusAuth`       | Milvus Vector Store                                   |
| `couchbaseApi`     | Couchbase Vector Store                                |
| `elasticsearchApi` | Elasticsearch Vector Store                            |
| `openSearchUrl`    | OpenSearch Vector Store                               |
| `vectaraApi`       | Vectara (×2: chain + vector store)                    |
| `upstashVectorApi` | Upstash Vector Store                                  |
| `singleStoreApi`   | SingleStore Vector Store                              |
| `meilisearchApi`   | Meilisearch Vector Store                              |
| `astraDBApi`       | Astra (DataStax) Vector Store                         |
| `mongoDBUrlApi`    | MongoDB Atlas Chat Memory, MongoDB Atlas Vector Store |
| `neo4jApi`         | Neo4j (Graph)                                         |

## Search & Web APIs

| Credencial          | Nodos                                     |
| ------------------- | ----------------------------------------- |
| `braveSearchApi`    | BraveSearch API Tool, Brave Search MCP    |
| `serperApi`         | Serper Tool                               |
| `serpApi`           | Serp API Tool                             |
| `searchApi`         | SearchApi Tool, SearchApi Document Loader |
| `tavilyApi`         | Tavily API Tool                           |
| `exaSearchApi`      | Exa Search Tool                           |
| `spiderApi`         | Spider Document Loaders                   |
| `fireCrawlApi`      | FireCrawl Document Loader                 |
| `oxylabsApi`        | Oxylabs Document Loader                   |
| `wolframAlphaAppId` | WolframAlpha Tool                         |
| `browserlessApi`    | Browserless MCP                           |

## Productivity & SaaS

| Credencial               | Nodos                                 |
| ------------------------ | ------------------------------------- |
| `gmailOAuth2`            | Gmail Tool                            |
| `googleCalendarOAuth2`   | Google Calendar Tool                  |
| `googleDocsOAuth2`       | Google Docs Tool                      |
| `googleDriveOAuth2`      | Google Drive Tool                     |
| `googleSheetsOAuth2`     | Google Sheets Tool                    |
| `googleCustomSearchApi`  | Google Custom Search Tool             |
| `notionApi`              | Notion (Database/Folder/Page) Loaders |
| `jiraApi`                | Jira Tool, Jira Document Loader       |
| `jiraApiBearerToken`     | Jira Tool (auth alternativa)          |
| `figmaApi`               | Figma Document Loader                 |
| `githubApi`              | Github Document Loader, Github MCP    |
| `slackApi`               | Slack MCP                             |
| `stripeApi`              | StripeAgentTool                       |
| `microsoftOutlookOAuth2` | Microsoft Outlook Tool                |
| `microsoftTeamsOAuth2`   | Microsoft Teams Tool                  |
| `composioApi`            | Composio Tool                         |
| `pipedreamOAuthApi`      | Pipedream MCP                         |
| `airtableApi`            | Airtable Document Loader              |
| `confluenceCloudApi`     | Confluence Loader (cloud)             |
| `confluenceServerDCApi`  | Confluence Loader (server/DC)         |

## Cache & Memory

| Credencial              | Nodos                                                         |
| ----------------------- | ------------------------------------------------------------- |
| `redisCacheApi`         | Redis Cache, Redis-Backed Chat Memory, Redis Embeddings Cache |
| `redisCacheUrlApi`      | Redis Cache (URL-based)                                       |
| `upstashRedisApi`       | Upstash Redis Cache                                           |
| `upstashRedisMemoryApi` | Upstash Redis-Backed Chat Memory                              |
| `momentoCacheApi`       | Momento Cache                                                 |
| `mem0MemoryApi`         | Mem0 Memory                                                   |
| `zepMemoryApi`          | Zep Memory (OS + Cloud)                                       |
| `dynamodbMemoryApi`     | DynamoDB Chat Memory                                          |

## Database Connectors

| Credencial      | Nodos                                                 |
| --------------- | ----------------------------------------------------- |
| `PostgresApi`   | Postgres Agent Memory                                 |
| `PostgresUrl`   | PostgreSQL MCP                                        |
| `MySQLApi`      | MySQL Agent Memory                                    |
| `mongoDBUrlApi` | MongoDB Atlas Chat Memory, MongoDB Atlas Vector Store |

## HTTP & Auth

| Credencial                  | Nodos                                          |
| --------------------------- | ---------------------------------------------- |
| `httpBasicAuth`             | HTTP Node (Agent Flows)                        |
| `httpBearerToken`           | HTTP Node (Agent Flows)                        |
| `httpApiKey`                | HTTP Node (Agent Flows)                        |
| `chatflowApi`               | Chatflow Tool, Execute Flow                    |
| `agentflowApi`              | Agent as Tool                                  |
| `E2BApi`                    | Code Interpreter by E2B                        |
| `unstructuredApi`           | Unstructured File Loader                       |
| `jinaAIApi`                 | Jina Embedding, Jina AI Rerank Retriever       |
| `voyageAIApi`               | VoyageAI Embedding, Voyage AI Rerank Retriever |
| `teradataTD2Auth`           | Teradata MCP                                   |
| `teradataBearerToken`       | Teradata MCP                                   |
| `elasticSearchUserPassword` | Elasticsearch (auth alternativa)               |

## Tips

-   **Credenciales opcionales**: `awsApi`, `localAIApi`, `ollamaApi`, `chatflowApi`, `agentflowApi`, `E2BApi`, `httpBasicAuth`/`httpBearerToken`/`httpApiKey`, `redisCacheApi`, `PostgresApi`, `MySQLApi`, `zepMemoryApi`, `googleVertexAuth`
-   **Sin credencial**: Calculator, CurrentDateTime, Web Browser, Custom Tool, Custom JS Function, Sticky Note, Ollama (local), Sequential Thinking MCP
-   **Múltiples opciones**: HTTP (3 tipos de auth), Elasticsearch (2 tipos), Jira (2 tipos), Teradata (2 tipos), Redis (2 tipos: API key o URL)
