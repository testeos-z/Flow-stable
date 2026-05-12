---
name: gmail
description: 'Skill for the Gmail area of Flow-stable. 54 symbols across 2 files.'
---

# Gmail

54 symbols | 2 files | Cohesion: 70%

## When to Use

-   Working with code in `packages/`
-   Understanding how createGmailTools work
-   Modifying gmail-related functionality

## Key Files

| File                                             | Symbols                                                |
| ------------------------------------------------ | ------------------------------------------------------ |
| `packages/components/nodes/tools/Gmail/core.ts`  | makeGmailRequest, \_call, \_call, \_call, \_call (+47) |
| `packages/components/nodes/tools/Gmail/Gmail.ts` | init, transformNodeInputsToToolArgs                    |

## Entry Points

Start here when exploring this area:

-   **`createGmailTools`** (Function) — `packages/components/nodes/tools/Gmail/core.ts:978`

## Key Symbols

| Symbol              | Type     | File                                            | Line |
| ------------------- | -------- | ----------------------------------------------- | ---- |
| `createGmailTools`  | Function | `packages/components/nodes/tools/Gmail/core.ts` | 978  |
| `BaseGmailTool`     | Class    | `packages/components/nodes/tools/Gmail/core.ts` | 70   |
| `GetDraftTool`      | Class    | `packages/components/nodes/tools/Gmail/core.ts` | 190  |
| `SendDraftTool`     | Class    | `packages/components/nodes/tools/Gmail/core.ts` | 265  |
| `ListMessagesTool`  | Class    | `packages/components/nodes/tools/Gmail/core.ts` | 334  |
| `SendMessageTool`   | Class    | `packages/components/nodes/tools/Gmail/core.ts` | 402  |
| `TrashMessageTool`  | Class    | `packages/components/nodes/tools/Gmail/core.ts` | 478  |
| `DeleteMessageTool` | Class    | `packages/components/nodes/tools/Gmail/core.ts` | 546  |
| `GetLabelTool`      | Class    | `packages/components/nodes/tools/Gmail/core.ts` | 608  |
| `UpdateLabelTool`   | Class    | `packages/components/nodes/tools/Gmail/core.ts` | 687  |
| `ListThreadsTool`   | Class    | `packages/components/nodes/tools/Gmail/core.ts` | 766  |
| `ModifyThreadTool`  | Class    | `packages/components/nodes/tools/Gmail/core.ts` | 834  |
| `UntrashThreadTool` | Class    | `packages/components/nodes/tools/Gmail/core.ts` | 910  |
| `DeleteThreadTool`  | Class    | `packages/components/nodes/tools/Gmail/core.ts` | 944  |
| `ListDraftsTool`    | Class    | `packages/components/nodes/tools/Gmail/core.ts` | 120  |
| `CreateDraftTool`   | Class    | `packages/components/nodes/tools/Gmail/core.ts` | 154  |
| `UpdateDraftTool`   | Class    | `packages/components/nodes/tools/Gmail/core.ts` | 224  |
| `DeleteDraftTool`   | Class    | `packages/components/nodes/tools/Gmail/core.ts` | 299  |
| `GetMessageTool`    | Class    | `packages/components/nodes/tools/Gmail/core.ts` | 368  |
| `ModifyMessageTool` | Class    | `packages/components/nodes/tools/Gmail/core.ts` | 436  |

## How to Explore

1. `gitnexus_context({name: "createGmailTools"})` — see callers and callees
2. `gitnexus_query({query: "gmail"})` — find related execution flows
3. Read key files listed above for implementation details
