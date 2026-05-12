---
name: microsoftteams
description: 'Skill for the MicrosoftTeams area of Flow-stable. 65 symbols across 2 files.'
---

# MicrosoftTeams

65 symbols | 2 files | Cohesion: 76%

## When to Use

-   Working with code in `packages/`
-   Understanding how createTeamsTools work
-   Modifying microsoftteams-related functionality

## Key Files

| File                                                               | Symbols                                                                                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `packages/components/nodes/tools/MicrosoftTeams/core.ts`           | BaseTeamsTool, ListChannelsTool, GetChannelTool, CreateChannelTool, UpdateChannelTool (+58) |
| `packages/components/nodes/tools/MicrosoftTeams/MicrosoftTeams.ts` | init, transformNodeInputsToToolArgs                                                         |

## Entry Points

Start here when exploring this area:

-   **`createTeamsTools`** (Function) — `packages/components/nodes/tools/MicrosoftTeams/core.ts:1513`

## Key Symbols

| Symbol                    | Type     | File                                                     | Line |
| ------------------------- | -------- | -------------------------------------------------------- | ---- |
| `createTeamsTools`        | Function | `packages/components/nodes/tools/MicrosoftTeams/core.ts` | 1513 |
| `BaseTeamsTool`           | Class    | `packages/components/nodes/tools/MicrosoftTeams/core.ts` | 55   |
| `ListChannelsTool`        | Class    | `packages/components/nodes/tools/MicrosoftTeams/core.ts` | 79   |
| `GetChannelTool`          | Class    | `packages/components/nodes/tools/MicrosoftTeams/core.ts` | 126  |
| `CreateChannelTool`       | Class    | `packages/components/nodes/tools/MicrosoftTeams/core.ts` | 168  |
| `UpdateChannelTool`       | Class    | `packages/components/nodes/tools/MicrosoftTeams/core.ts` | 223  |
| `DeleteChannelTool`       | Class    | `packages/components/nodes/tools/MicrosoftTeams/core.ts` | 275  |
| `ArchiveChannelTool`      | Class    | `packages/components/nodes/tools/MicrosoftTeams/core.ts` | 317  |
| `UnarchiveChannelTool`    | Class    | `packages/components/nodes/tools/MicrosoftTeams/core.ts` | 359  |
| `ListChannelMembersTool`  | Class    | `packages/components/nodes/tools/MicrosoftTeams/core.ts` | 401  |
| `AddChannelMemberTool`    | Class    | `packages/components/nodes/tools/MicrosoftTeams/core.ts` | 444  |
| `RemoveChannelMemberTool` | Class    | `packages/components/nodes/tools/MicrosoftTeams/core.ts` | 492  |
| `ListChatsTool`           | Class    | `packages/components/nodes/tools/MicrosoftTeams/core.ts` | 546  |
| `GetChatTool`             | Class    | `packages/components/nodes/tools/MicrosoftTeams/core.ts` | 584  |
| `CreateChatTool`          | Class    | `packages/components/nodes/tools/MicrosoftTeams/core.ts` | 625  |
| `UpdateChatTool`          | Class    | `packages/components/nodes/tools/MicrosoftTeams/core.ts` | 684  |
| `DeleteChatTool`          | Class    | `packages/components/nodes/tools/MicrosoftTeams/core.ts` | 731  |
| `ListChatMembersTool`     | Class    | `packages/components/nodes/tools/MicrosoftTeams/core.ts` | 772  |
| `AddChatMemberTool`       | Class    | `packages/components/nodes/tools/MicrosoftTeams/core.ts` | 814  |
| `RemoveChatMemberTool`    | Class    | `packages/components/nodes/tools/MicrosoftTeams/core.ts` | 861  |

## How to Explore

1. `gitnexus_context({name: "createTeamsTools"})` — see callers and callees
2. `gitnexus_query({query: "microsoftteams"})` — find related execution flows
3. Read key files listed above for implementation details
