---
name: agent
description: 'Skill for the Agent area of Flow-stable. 135 symbols across 36 files.'
---

# Agent

135 symbols | 36 files | Cohesion: 89%

## When to Use

-   Working with code in `packages/`
-   Understanding how generateAgentflowv2, getSessionChatHistory, streamResponse work
-   Modifying agent-related functionality

## Key Files

| File                                                                   | Symbols                                                                                                        |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `packages/components/src/handler.ts`                                   | handleLLMNewToken, handleLLMEnd, handleChainEnd, AnalyticHandler, getInstance (+12)                            |
| `packages/components/src/Interface.ts`                                 | init, getChatMessages, addChatMessages, streamStartEvent, streamTokenEvent (+9)                                |
| `packages/components/nodes/agentflow/Agent/Agent.ts`                   | sanitizeToolName, run, handleMemory, handleSummaryBuffer, handleStreamingResponse (+6)                         |
| `packages/server/src/queue/RedisEventPublisher.ts`                     | streamStartEvent, streamTokenEvent, streamThinkingEvent, streamSourceDocumentsEvent, streamArtifactsEvent (+5) |
| `packages/components/src/agentflowv2Generator.ts`                      | generateAgentflowv2, updateEdges, isMultiOutput, findNodeColor, generateSelectedTools (+3)                     |
| `packages/server/src/utils/SSEStreamer.ts`                             | streamStartEvent, streamTokenEvent, streamThinkingEvent, streamSourceDocumentsEvent, streamArtifactsEvent (+3) |
| `packages/components/nodes/agentflow/LLM/LLM.ts`                       | run, handleMemory, handleSummaryBuffer, handleStreamingResponse, calculateUsageCost (+2)                       |
| `packages/components/nodes/tools/OpenAPIToolkit/core.ts`               | removeNulls, getUrl, ToolInputParsingException, call, \_call (+1)                                              |
| `packages/components/nodes/agents/OpenAIAssistant/OpenAIAssistant.ts`  | run, promise, downloadImg, downloadFile, handleToolSubmission (+1)                                             |
| `packages/components/nodes/agentflow/ConditionAgent/ConditionAgent.ts` | parseJsonMarkdown, run, handleMemory, handleSummaryBuffer, calculateUsageCost                                  |

## Entry Points

Start here when exploring this area:

-   **`generateAgentflowv2`** (Function) — `packages/components/src/agentflowv2Generator.ts:150`
-   **`getSessionChatHistory`** (Function) — `packages/server/src/utils/index.ts:1839`
-   **`streamResponse`** (Function) — `packages/components/nodes/moderation/Moderation.ts:15`
-   **`AnalyticHandler`** (Class) — `packages/components/src/handler.ts:690`
-   **`CustomStreamingHandler`** (Class) — `packages/components/src/handler.ts:1950`

## Key Symbols

| Symbol                   | Type     | File                                                 | Line |
| ------------------------ | -------- | ---------------------------------------------------- | ---- |
| `AnalyticHandler`        | Class    | `packages/components/src/handler.ts`                 | 690  |
| `CustomStreamingHandler` | Class    | `packages/components/src/handler.ts`                 | 1950 |
| `generateAgentflowv2`    | Function | `packages/components/src/agentflowv2Generator.ts`    | 150  |
| `getSessionChatHistory`  | Function | `packages/server/src/utils/index.ts`                 | 1839 |
| `streamResponse`         | Function | `packages/components/nodes/moderation/Moderation.ts` | 15   |
| `handleLLMNewToken`      | Method   | `packages/components/src/handler.ts`                 | 365  |
| `handleLLMEnd`           | Method   | `packages/components/src/handler.ts`                 | 395  |
| `handleChainEnd`         | Method   | `packages/components/src/handler.ts`                 | 401  |
| `getInstance`            | Method   | `packages/components/src/handler.ts`                 | 708  |
| `resetInstance`          | Method   | `packages/components/src/handler.ts`                 | 724  |
| `cleanup`                | Method   | `packages/components/src/handler.ts`                 | 729  |
| `_endOtelSpan`           | Method   | `packages/components/src/handler.ts`                 | 742  |
| `onChainEnd`             | Method   | `packages/components/src/handler.ts`                 | 1130 |
| `onChainError`           | Method   | `packages/components/src/handler.ts`                 | 1221 |
| `onLLMStart`             | Method   | `packages/components/src/handler.ts`                 | 1304 |
| `onLLMEnd`               | Method   | `packages/components/src/handler.ts`                 | 1437 |
| `onLLMError`             | Method   | `packages/components/src/handler.ts`                 | 1594 |
| `onToolStart`            | Method   | `packages/components/src/handler.ts`                 | 1668 |
| `onToolEnd`              | Method   | `packages/components/src/handler.ts`                 | 1797 |
| `onToolError`            | Method   | `packages/components/src/handler.ts`                 | 1871 |

## Execution Flows

| Flow                           | Type            | Steps |
| ------------------------------ | --------------- | ----- |
| `Run → IsArray`                | cross_community | 6     |
| `Run → IsArray`                | cross_community | 6     |
| `Run → IsArray`                | cross_community | 6     |
| `Run → IsArray`                | cross_community | 6     |
| `Run → Set`                    | cross_community | 5     |
| `Run → HandleEscapesJSONParse` | cross_community | 5     |
| `Run → Set`                    | cross_community | 5     |
| `Run → Set`                    | cross_community | 5     |
| `Run → Set`                    | cross_community | 5     |
| `Run → Set`                    | cross_community | 5     |

## Connected Areas

| Area                | Connections |
| ------------------- | ----------- |
| Queue               | 20 calls    |
| Json                | 18 calls    |
| ApiChain            | 9 calls     |
| ConversationalAgent | 4 calls     |
| Worker              | 3 calls     |
| Evaluation          | 2 calls     |
| Mysql               | 2 calls     |
| Atoms               | 1 calls     |

## How to Explore

1. `gitnexus_context({name: "generateAgentflowv2"})` — see callers and callees
2. `gitnexus_query({query: "agent"})` — find related execution flows
3. Read key files listed above for implementation details
