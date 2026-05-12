---
name: queue
description: 'Skill for the Queue area of Flow-stable. 91 symbols across 17 files.'
---

# Queue

91 symbols | 17 files | Cohesion: 71%

## When to Use

-   Working with code in `packages/`
-   Understanding how MCPTool, initAuthSecrets, UpsertQueue work
-   Modifying queue-related functionality

## Key Files

| File                                                    | Symbols                                                                                                               |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `packages/server/src/utils/SSEStreamer.ts`              | safeWrite, streamCalledToolsEvent, streamToolEvent, streamAgentReasoningEvent, streamNextAgentEvent (+19)             |
| `packages/server/src/queue/RedisEventPublisher.ts`      | safePublish, streamToolEvent, streamAgentReasoningEvent, streamAgentFlowEvent, streamAgentFlowExecutedDataEvent (+15) |
| `packages/server/src/queue/RedisEventSubscriber.ts`     | handleEvent, constructor, setupEventListeners, unsubscribe, startPeriodicCleanup (+3)                                 |
| `packages/components/src/Interface.ts`                  | streamCustomEvent, streamTTSStartEvent, streamTTSDataEvent, streamTTSEndEvent, IServerSideEventStreamer               |
| `packages/server/src/queue/QueueManager.ts`             | registerQueue, setupAllQueues, QueueManager, getInstance, getAllJobCounts                                             |
| `packages/server/src/queue/PredictionQueue.ts`          | PredictionQueue, getQueueName, getQueue, constructor, processJob                                                      |
| `packages/server/src/queue/BaseQueue.ts`                | BaseQueue, getWorker, getJobCounts, getJobs, getJobByName                                                             |
| `packages/components/src/handler.ts`                    | handleToolStart, handleToolEnd, handleToolError, handleAgentAction                                                    |
| `packages/components/nodes/vectorstores/Redis/Redis.ts` | init, buildQuery, similaritySearchVectorWithScore                                                                     |
| `packages/components/nodes/tools/MCP/core.ts`           | createClient, get_tools, MCPTool                                                                                      |

## Entry Points

Start here when exploring this area:

-   **`MCPTool`** (Function) — `packages/components/nodes/tools/MCP/core.ts:143`
-   **`initAuthSecrets`** (Function) — `packages/server/src/enterprise/utils/authSecrets.ts:27`
-   **`UpsertQueue`** (Class) — `packages/server/src/queue/UpsertQueue.ts:26`
-   **`PredictionQueue`** (Class) — `packages/server/src/queue/PredictionQueue.ts:33`
-   **`BaseQueue`** (Class) — `packages/server/src/queue/BaseQueue.ts:11`

## Key Symbols

| Symbol                             | Type      | File                                                  | Line |
| ---------------------------------- | --------- | ----------------------------------------------------- | ---- |
| `UpsertQueue`                      | Class     | `packages/server/src/queue/UpsertQueue.ts`            | 26   |
| `PredictionQueue`                  | Class     | `packages/server/src/queue/PredictionQueue.ts`        | 33   |
| `BaseQueue`                        | Class     | `packages/server/src/queue/BaseQueue.ts`              | 11   |
| `SSEStreamer`                      | Class     | `packages/server/src/utils/SSEStreamer.ts`            | 12   |
| `RedisEventPublisher`              | Class     | `packages/server/src/queue/RedisEventPublisher.ts`    | 4    |
| `RedisEventSubscriber`             | Class     | `packages/server/src/queue/RedisEventSubscriber.ts`   | 4    |
| `QueueManager`                     | Class     | `packages/server/src/queue/QueueManager.ts`           | 19   |
| `MCPTool`                          | Function  | `packages/components/nodes/tools/MCP/core.ts`         | 143  |
| `initAuthSecrets`                  | Function  | `packages/server/src/enterprise/utils/authSecrets.ts` | 27   |
| `IServerSideEventStreamer`         | Interface | `packages/components/src/Interface.ts`                | 431  |
| `safeWrite`                        | Method    | `packages/server/src/utils/SSEStreamer.ts`            | 32   |
| `streamCalledToolsEvent`           | Method    | `packages/server/src/utils/SSEStreamer.ts`            | 122  |
| `streamToolEvent`                  | Method    | `packages/server/src/utils/SSEStreamer.ts`            | 136  |
| `streamAgentReasoningEvent`        | Method    | `packages/server/src/utils/SSEStreamer.ts`            | 143  |
| `streamNextAgentEvent`             | Method    | `packages/server/src/utils/SSEStreamer.ts`            | 150  |
| `streamAgentFlowEvent`             | Method    | `packages/server/src/utils/SSEStreamer.ts`            | 157  |
| `streamAgentFlowExecutedDataEvent` | Method    | `packages/server/src/utils/SSEStreamer.ts`            | 164  |
| `streamNextAgentFlowEvent`         | Method    | `packages/server/src/utils/SSEStreamer.ts`            | 171  |
| `streamActionEvent`                | Method    | `packages/server/src/utils/SSEStreamer.ts`            | 178  |
| `streamAbortEvent`                 | Method    | `packages/server/src/utils/SSEStreamer.ts`            | 186  |

## Execution Flows

| Flow                               | Type            | Steps |
| ---------------------------------- | --------------- | ----- |
| `InitDatabase → UsageCacheManager` | cross_community | 7     |
| `InitDatabase → Initialize`        | cross_community | 7     |
| `InitDatabase → StripeManager`     | cross_community | 5     |
| `InitDatabase → GetFiles`          | cross_community | 5     |
| `Run → Set`                        | cross_community | 4     |
| `InitDatabase → Permissions`       | cross_community | 4     |
| `HandleChainEnd → SafeWrite`       | cross_community | 3     |
| `HandleChainEnd → SafePublish`     | cross_community | 3     |
| `HandleEvent → SafeWrite`          | cross_community | 3     |
| `Run → SafeWrite`                  | cross_community | 3     |

## Connected Areas

| Area          | Connections |
| ------------- | ----------- |
| Commands      | 7 calls     |
| Agent         | 7 calls     |
| Documentstore | 2 calls     |
| Atoms         | 2 calls     |
| Rbac          | 1 calls     |
| Cluster_45    | 1 calls     |
| Vectors       | 1 calls     |
| Cluster_262   | 1 calls     |

## How to Explore

1. `gitnexus_context({name: "MCPTool"})` — see callers and callees
2. `gitnexus_query({query: "queue"})` — find related execution flows
3. Read key files listed above for implementation details
