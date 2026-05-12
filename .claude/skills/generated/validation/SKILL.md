---
name: validation
description: 'Skill for the Validation area of Flow-stable. 60 symbols across 26 files.'
---

# Validation

60 symbols | 26 files | Cohesion: 68%

## When to Use

-   Working with code in `packages/`
-   Understanding how isValidConnectionAgentflowV2, validateFlowGraph, detectCycle work
-   Modifying validation-related functionality

## Key Files

| File                                                             | Symbols                                                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `packages/agentflow/src/core/validation/flowValidation.ts`       | validateFlow, detectCycle, dfs, detectHangingEdges, isEmptyValue (+1)                                                          |
| `packages/agentflow/src/core/utils/fieldVisibility.ts`           | hasNestedQuantifier, safeRegexTest, conditionMatches, resolveGroundValue, evaluateParamVisibility (+1)                         |
| `packages/server/src/utils/index.ts`                             | getAllConnectedNodes, checkIfDocLoaderShouldBeIgnored, buildFlow, calculateNodesDepth, getAllNodesInPath                       |
| `packages/agentflow/src/core/validation/constraintValidation.ts` | checkSingleStartNode, checkNestedIteration, checkHumanInputInIteration, checkNodePlacementConstraints, findParentIterationNode |
| `packages/ui/src/utils/genericHelper.js`                         | isValidConnectionAgentflowV2, wouldCreateCycle, hasPath                                                                        |
| `packages/flowise-mcp-server/src/flow-validation.ts`             | validateFlowGraph, detectCycle, traverse                                                                                       |
| `packages/server/src/utils/buildAgentflow.ts`                    | getNodeInputConnections, setupNodeDependencies, findConditionParent                                                            |
| `packages/components/nodes/chains/VectaraChain/VectaraChain.ts`  | reorderCitations, applyCitationOrder, run                                                                                      |
| `packages/agentflow/src/core/validation/connectionValidation.ts` | isValidConnectionAgentflowV2, wouldCreateCycle, hasPath                                                                        |
| `packages/agentflow/src/core/utils/variableUtils.ts`             | getUpstreamNodes, collect, getDefinedStateKeys                                                                                 |

## Entry Points

Start here when exploring this area:

-   **`isValidConnectionAgentflowV2`** (Function) — `packages/ui/src/utils/genericHelper.js:450`
-   **`validateFlowGraph`** (Function) — `packages/flowise-mcp-server/src/flow-validation.ts:404`
-   **`detectCycle`** (Function) — `packages/flowise-mcp-server/src/flow-validation.ts:444`
-   **`traverse`** (Function) — `packages/flowise-mcp-server/src/flow-validation.ts:479`
-   **`getAllConnectedNodes`** (Function) — `packages/server/src/utils/index.ts:265`

## Key Symbols

| Symbol                         | Type     | File                                                                       | Line |
| ------------------------------ | -------- | -------------------------------------------------------------------------- | ---- |
| `isValidConnectionAgentflowV2` | Function | `packages/ui/src/utils/genericHelper.js`                                   | 450  |
| `validateFlowGraph`            | Function | `packages/flowise-mcp-server/src/flow-validation.ts`                       | 404  |
| `detectCycle`                  | Function | `packages/flowise-mcp-server/src/flow-validation.ts`                       | 444  |
| `traverse`                     | Function | `packages/flowise-mcp-server/src/flow-validation.ts`                       | 479  |
| `getAllConnectedNodes`         | Function | `packages/server/src/utils/index.ts`                                       | 265  |
| `buildFlow`                    | Function | `packages/server/src/utils/index.ts`                                       | 515  |
| `calculateNodesDepth`          | Function | `packages/server/src/utils/index.ts`                                       | 2009 |
| `getAllNodesInPath`            | Function | `packages/server/src/utils/index.ts`                                       | 2053 |
| `validateFlowData`             | Function | `packages/server/src/services/validation/index.ts`                         | 19   |
| `useAvailableVariables`        | Function | `packages/agentflow/src/features/node-editor/useAvailableVariables.ts`     | 65   |
| `isValidConnectionAgentflowV2` | Function | `packages/agentflow/src/core/validation/connectionValidation.ts`           | 5    |
| `getUpstreamNodes`             | Function | `packages/agentflow/src/core/utils/variableUtils.ts`                       | 38   |
| `collect`                      | Function | `packages/agentflow/src/core/utils/variableUtils.ts`                       | 43   |
| `getDefinedStateKeys`          | Function | `packages/agentflow/src/core/utils/variableUtils.ts`                       | 85   |
| `handleSelectId`               | Function | `packages/observe/src/features/executions/components/ExecutionsViewer.tsx` | 101  |
| `useAgentflow`                 | Function | `packages/agentflow/src/useAgentflow.ts`                                   | 37   |
| `useAgentflowContext`          | Function | `packages/agentflow/src/infrastructure/store/AgentflowContext.tsx`         | 352  |
| `validateFlow`                 | Function | `packages/agentflow/src/core/validation/flowValidation.ts`                 | 11   |
| `resolveNodeType`              | Function | `packages/agentflow/src/core/utils/nodeFactory.ts`                         | 17   |
| `useFlowHandlers`              | Function | `packages/agentflow/src/features/canvas/hooks/useFlowHandlers.ts`          | 23   |

## Execution Flows

| Flow                                    | Type            | Steps |
| --------------------------------------- | --------------- | ----- |
| `AgentflowCanvas → HasNestedQuantifier` | cross_community | 8     |
| `AgentflowCanvas → IsArray`             | cross_community | 7     |
| `AgentFlowNode → GetDb`                 | cross_community | 6     |
| `IterationNode → GetDb`                 | cross_community | 6     |
| `AgentflowCanvas → GetDb`               | cross_community | 6     |
| `AgentflowCanvas → ResolveGroundValue`  | cross_community | 6     |
| `APICodeDialog → GetDb`                 | cross_community | 5     |
| `AgentFlowNode → SaveChunk`             | cross_community | 5     |
| `ExecutionDetails → GetDb`              | cross_community | 5     |
| `IterationNode → SaveChunk`             | cross_community | 5     |

## Connected Areas

| Area        | Connections |
| ----------- | ----------- |
| Components  | 5 calls     |
| Json        | 5 calls     |
| Cluster_717 | 1 calls     |
| Demos       | 1 calls     |
| Cluster_34  | 1 calls     |
| Atoms       | 1 calls     |
| Pinecone    | 1 calls     |
| Node-editor | 1 calls     |

## How to Explore

1. `gitnexus_context({name: "isValidConnectionAgentflowV2"})` — see callers and callees
2. `gitnexus_query({query: "validation"})` — find related execution flows
3. Read key files listed above for implementation details
