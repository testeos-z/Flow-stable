---
name: adapters
description: 'Skill for the Adapters area of Flow-stable. 185 symbols across 14 files.'
---

# Adapters

185 symbols | 14 files | Cohesion: 68%

## When to Use

-   Working with code in `packages/`
-   Understanding how validateTaskTransition, createAdapter, A2AStorageMemory work
-   Modifying adapters-related functionality

## Key Files

| File                                                                      | Symbols                                                                                  |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `packages/components/nodes/tools/A2AStorage/adapters/PostgresAdapter.ts`  | getTask, listTasks, rowToTask, toJson, fromJson (+31)                                    |
| `packages/components/nodes/tools/A2AStorage/adapters/SQLiteAdapter.ts`    | fromJsonArray, getTask, getDecisions, SQLiteAdapter, toJson (+26)                        |
| `packages/components/nodes/tools/A2AStorage/adapters/SupabaseAdapter.ts`  | getTask, updateTaskStatus, listTasks, rowToTask, revokeAccess (+25)                      |
| `packages/components/nodes/tools/A2AStorage/adapters/LocalJsonAdapter.ts` | getTask, updateTaskStatus, uuid, getFilePath, readTable (+25)                            |
| `packages/components/src/A2AStorageAdapter.ts`                            | validateTaskTransition, getTask, updateTaskStatus, revokeAccess, A2AStorageAdapter (+22) |
| `packages/components/nodes/tools/A2ASharedContext/core.ts`                | \_call, \_call, \_call, \_call, \_call (+2)                                              |
| `packages/components/nodes/tools/A2ATask/core.ts`                         | \_call, \_call, \_call, \_call, \_call (+1)                                              |
| `packages/components/nodes/tools/A2AArtifact/core.ts`                     | \_call, \_call, \_call, \_call, \_call (+1)                                              |
| `packages/components/nodes/tools/A2ARegistry/core.ts`                     | \_call, \_call, \_call, \_call                                                           |
| `packages/components/nodes/tools/A2AMemoryAdapter/core.ts`                | A2AStorageMemory, loadA2AContext, saveA2AContext                                         |

## Entry Points

Start here when exploring this area:

-   **`validateTaskTransition`** (Function) — `packages/components/src/A2AStorageAdapter.ts:23`
-   **`createAdapter`** (Function) — `packages/components/nodes/tools/A2AStorage/A2AStorageFactory.ts:17`
-   **`A2AStorageMemory`** (Class) — `packages/components/nodes/tools/A2AMemoryAdapter/core.ts:21`
-   **`SupabaseAdapter`** (Class) — `packages/components/nodes/tools/A2AStorage/adapters/SupabaseAdapter.ts:28`
-   **`SQLiteAdapter`** (Class) — `packages/components/nodes/tools/A2AStorage/adapters/SQLiteAdapter.ts:151`

## Key Symbols

| Symbol                   | Type      | File                                                                      | Line |
| ------------------------ | --------- | ------------------------------------------------------------------------- | ---- |
| `A2AStorageMemory`       | Class     | `packages/components/nodes/tools/A2AMemoryAdapter/core.ts`                | 21   |
| `SupabaseAdapter`        | Class     | `packages/components/nodes/tools/A2AStorage/adapters/SupabaseAdapter.ts`  | 28   |
| `SQLiteAdapter`          | Class     | `packages/components/nodes/tools/A2AStorage/adapters/SQLiteAdapter.ts`    | 151  |
| `PostgresAdapter`        | Class     | `packages/components/nodes/tools/A2AStorage/adapters/PostgresAdapter.ts`  | 148  |
| `LocalJsonAdapter`       | Class     | `packages/components/nodes/tools/A2AStorage/adapters/LocalJsonAdapter.ts` | 18   |
| `validateTaskTransition` | Function  | `packages/components/src/A2AStorageAdapter.ts`                            | 23   |
| `createAdapter`          | Function  | `packages/components/nodes/tools/A2AStorage/A2AStorageFactory.ts`         | 17   |
| `A2AStorageAdapter`      | Interface | `packages/components/src/A2AStorageAdapter.ts`                            | 36   |
| `getTask`                | Method    | `packages/components/src/A2AStorageAdapter.ts`                            | 48   |
| `updateTaskStatus`       | Method    | `packages/components/src/A2AStorageAdapter.ts`                            | 49   |
| `_call`                  | Method    | `packages/components/nodes/tools/A2ATask/core.ts`                         | 61   |
| `_call`                  | Method    | `packages/components/nodes/tools/A2ATask/core.ts`                         | 90   |
| `getTask`                | Method    | `packages/components/nodes/tools/A2AStorage/adapters/SupabaseAdapter.ts`  | 140  |
| `updateTaskStatus`       | Method    | `packages/components/nodes/tools/A2AStorage/adapters/SupabaseAdapter.ts`  | 146  |
| `listTasks`              | Method    | `packages/components/nodes/tools/A2AStorage/adapters/SupabaseAdapter.ts`  | 160  |
| `rowToTask`              | Method    | `packages/components/nodes/tools/A2AStorage/adapters/SupabaseAdapter.ts`  | 182  |
| `getTask`                | Method    | `packages/components/nodes/tools/A2AStorage/adapters/SQLiteAdapter.ts`    | 281  |
| `getDecisions`           | Method    | `packages/components/nodes/tools/A2AStorage/adapters/SQLiteAdapter.ts`    | 534  |
| `getTask`                | Method    | `packages/components/nodes/tools/A2AStorage/adapters/PostgresAdapter.ts`  | 279  |
| `listTasks`              | Method    | `packages/components/nodes/tools/A2AStorage/adapters/PostgresAdapter.ts`  | 304  |

## Connected Areas

| Area  | Connections |
| ----- | ----------- |
| Mysql | 1 calls     |

## How to Explore

1. `gitnexus_context({name: "validateTaskTransition"})` — see callers and callees
2. `gitnexus_query({query: "adapters"})` — find related execution flows
3. Read key files listed above for implementation details
