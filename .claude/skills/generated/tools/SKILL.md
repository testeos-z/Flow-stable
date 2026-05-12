---
name: tools
description: 'Skill for the Tools area of Flow-stable. 63 symbols across 17 files.'
---

# Tools

63 symbols | 17 files | Cohesion: 86%

## When to Use

-   Working with code in `packages/`
-   Understanding how createSupabaseClient, handleDbError, applyFilters work
-   Modifying tools-related functionality

## Key Files

| File                                                     | Symbols                                                                                                                     |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/src/views/tools/index.jsx`                  | onAuthorize, Tools, onChange, refresh, onCustomMcpPageChange (+13)                                                          |
| `packages/ui/src/views/tools/CustomMcpServerDialog.jsx`  | CustomMcpServerDialog, enqueueSnackbar, closeSnackbar, validateServerUrl, showSnackbar (+5)                                 |
| `packages/ui/src/views/tools/ToolDialog.jsx`             | ToolDialog, enqueueSnackbar, closeSnackbar, onSaveAsTemplate, exportTool (+3)                                               |
| `packages/ui/src/api/custommcpservers.js`                | createCustomMcpServer, updateCustomMcpServer, deleteCustomMcpServer, authorizeCustomMcpServer, getCustomMcpServerTools (+1) |
| `packages/components/nodes/tools/SupabaseCommon.ts`      | createSupabaseClient, handleDbError, applyFilters                                                                           |
| `packages/components/nodes/tools/SupabaseUpsert/core.ts` | constructor, \_call                                                                                                         |
| `packages/components/nodes/tools/SupabaseUpdate/core.ts` | constructor, \_call                                                                                                         |
| `packages/components/nodes/tools/SupabaseSelect/core.ts` | constructor, \_call                                                                                                         |
| `packages/components/nodes/tools/SupabaseInsert/core.ts` | constructor, \_call                                                                                                         |
| `packages/components/nodes/tools/SupabaseDelete/core.ts` | constructor, \_call                                                                                                         |

## Entry Points

Start here when exploring this area:

-   **`createSupabaseClient`** (Function) — `packages/components/nodes/tools/SupabaseCommon.ts:7`
-   **`handleDbError`** (Function) — `packages/components/nodes/tools/SupabaseCommon.ts:47`
-   **`applyFilters`** (Function) — `packages/components/nodes/tools/SupabaseCommon.ts:62`
-   **`constructor`** (Method) — `packages/components/nodes/tools/SupabaseUpsert/core.ts:14`
-   **`constructor`** (Method) — `packages/components/nodes/tools/SupabaseUpdate/core.ts:21`

## Key Symbols

| Symbol                  | Type     | File                                                              | Line |
| ----------------------- | -------- | ----------------------------------------------------------------- | ---- |
| `createSupabaseClient`  | Function | `packages/components/nodes/tools/SupabaseCommon.ts`               | 7    |
| `handleDbError`         | Function | `packages/components/nodes/tools/SupabaseCommon.ts`               | 47   |
| `applyFilters`          | Function | `packages/components/nodes/tools/SupabaseCommon.ts`               | 62   |
| `constructor`           | Method   | `packages/components/nodes/tools/SupabaseUpsert/core.ts`          | 14   |
| `constructor`           | Method   | `packages/components/nodes/tools/SupabaseUpdate/core.ts`          | 21   |
| `constructor`           | Method   | `packages/components/nodes/tools/SupabaseStorageUpload/core.ts`   | 15   |
| `constructor`           | Method   | `packages/components/nodes/tools/SupabaseStorageRename/core.ts`   | 14   |
| `constructor`           | Method   | `packages/components/nodes/tools/SupabaseStorageMove/core.ts`     | 14   |
| `constructor`           | Method   | `packages/components/nodes/tools/SupabaseStorageDownload/core.ts` | 13   |
| `constructor`           | Method   | `packages/components/nodes/tools/SupabaseSelect/core.ts`          | 17   |
| `constructor`           | Method   | `packages/components/nodes/tools/SupabaseInsert/core.ts`          | 16   |
| `constructor`           | Method   | `packages/components/nodes/tools/SupabaseEdgeFunction/core.ts`    | 22   |
| `constructor`           | Method   | `packages/components/nodes/tools/SupabaseDelete/core.ts`          | 22   |
| `_call`                 | Method   | `packages/components/nodes/tools/SupabaseUpsert/core.ts`          | 27   |
| `_call`                 | Method   | `packages/components/nodes/tools/SupabaseUpdate/core.ts`          | 34   |
| `_call`                 | Method   | `packages/components/nodes/tools/SupabaseSelect/core.ts`          | 30   |
| `_call`                 | Method   | `packages/components/nodes/tools/SupabaseInsert/core.ts`          | 29   |
| `_call`                 | Method   | `packages/components/nodes/tools/SupabaseDelete/core.ts`          | 35   |
| `onConfirm`             | Function | `packages/ui/src/hooks/useConfirm.jsx`                            | 14   |
| `createCustomMcpServer` | Function | `packages/ui/src/api/custommcpservers.js`                         | 6    |

## Connected Areas

| Area        | Connections |
| ----------- | ----------- |
| Custom      | 8 calls     |
| Evaluations | 4 calls     |
| Json        | 4 calls     |
| Docstore    | 3 calls     |
| Extended    | 2 calls     |

## How to Explore

1. `gitnexus_context({name: "createSupabaseClient"})` — see callers and callees
2. `gitnexus_query({query: "tools"})` — find related execution flows
3. Read key files listed above for implementation details
