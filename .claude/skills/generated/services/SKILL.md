---
name: services
description: 'Skill for the Services area of Flow-stable. 178 symbols across 32 files.'
---

# Services

178 symbols | 32 files | Cohesion: 82%

## When to Use

-   Working with code in `packages/`
-   Understanding how sanitizeUser, generateId, isInvalidEmail work
-   Modifying services-related functionality

## Key Files

| File                                                                   | Symbols                                                                                                                                                                                                    |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/server/src/enterprise/services/account.service.ts`           | AccountService, canSendTransactionalEmail, sendInviteEmailIfAllowed, assertNotEmailChangeJwt, initializeAccountDTO (+16)                                                                                   |
| `packages/server/src/enterprise/services/workspace-user.service.ts`    | WorkspaceUserService, validateWorkspaceUserStatus, validateWorkspaceUserLastLogin, readWorkspaceUserByWorkspaceIdUserId, readWorkspaceUserByWorkspaceId (+12)                                              |
| `packages/server/src/enterprise/services/login-method.service.ts`      | validateLoginMethodName, validateLoginMethodStatus, encryptLoginMethodConfig, saveLoginMethod, createLoginMethod (+9)                                                                                      |
| `packages/server/src/enterprise/services/user.service.ts`              | readUserById, validateUserName, validateUserEmail, readUserByEmail, readUserByToken (+8)                                                                                                                   |
| `packages/server/src/enterprise/services/role.service.ts`              | validateRoleId, readRoleById, validateRoleName, readRoleByOrganizationId, readRoleByRoleIdOrganizationId (+8)                                                                                              |
| `packages/server/src/enterprise/services/organization-user.service.ts` | validateOrganizationUserStatus, readOrganizationUserByOrganizationIdUserId, readOrganizationUserByWorkspaceIdUserId, readOrganizationUserByOrganizationId, readOrganizationUserByOrganizationIdRoleId (+8) |
| `packages/server/src/enterprise/services/workspace.service.ts`         | readWorkspaceById, validateWorkspaceName, readWorkspaceByOrganizationId, createNewWorkspace, saveWorkspace (+6)                                                                                            |
| `packages/server/src/enterprise/services/organization.service.ts`      | readOrganizationById, validateOrganizationName, readOrganizationByName, countOrganizations, createNewOrganization (+6)                                                                                     |
| `packages/server/src/enterprise/controllers/account.controller.ts`     | register, invite, login, verify, resendVerificationEmail (+4)                                                                                                                                              |
| `packages/server/src/enterprise/utils/validation.util.ts`              | isInvalidEmail, isInvalidName, isInvalidDateTime, isInvalidPassword, validatePasswordOrThrow (+1)                                                                                                          |

## Entry Points

Start here when exploring this area:

-   **`sanitizeUser`** (Function) — `packages/server/src/utils/sanitize.util.ts:36`
-   **`generateId`** (Function) — `packages/server/src/utils/index.ts:1994`
-   **`isInvalidEmail`** (Function) — `packages/server/src/enterprise/utils/validation.util.ts:5`
-   **`isInvalidName`** (Function) — `packages/server/src/enterprise/utils/validation.util.ts:10`
-   **`isInvalidDateTime`** (Function) — `packages/server/src/enterprise/utils/validation.util.ts:14`

## Key Symbols

| Symbol                    | Type     | File                                                                | Line |
| ------------------------- | -------- | ------------------------------------------------------------------- | ---- |
| `WorkspaceUserService`    | Class    | `packages/server/src/enterprise/services/workspace-user.service.ts` | 23   |
| `AccountService`          | Class    | `packages/server/src/enterprise/services/account.service.ts`        | 77   |
| `UserService`             | Class    | `packages/server/src/enterprise/services/user.service.ts`           | 30   |
| `RoleService`             | Class    | `packages/server/src/enterprise/services/role.service.ts`           | 18   |
| `OrganizationService`     | Class    | `packages/server/src/enterprise/services/organization.service.ts`   | 19   |
| `sanitizeUser`            | Function | `packages/server/src/utils/sanitize.util.ts`                        | 36   |
| `generateId`              | Function | `packages/server/src/utils/index.ts`                                | 1994 |
| `isInvalidEmail`          | Function | `packages/server/src/enterprise/utils/validation.util.ts`           | 5    |
| `isInvalidName`           | Function | `packages/server/src/enterprise/utils/validation.util.ts`           | 10   |
| `isInvalidDateTime`       | Function | `packages/server/src/enterprise/utils/validation.util.ts`           | 14   |
| `isInvalidPassword`       | Function | `packages/server/src/enterprise/utils/validation.util.ts`           | 19   |
| `validatePasswordOrThrow` | Function | `packages/server/src/enterprise/utils/validation.util.ts`           | 39   |
| `getSecureAppUrl`         | Function | `packages/server/src/enterprise/utils/url.util.ts`                  | 9    |
| `getSecureTokenLink`      | Function | `packages/server/src/enterprise/utils/url.util.ts`                  | 59   |
| `getPasswordSaltRounds`   | Function | `packages/server/src/enterprise/utils/encryption.util.ts`           | 4    |
| `getBcryptRoundsFromHash` | Function | `packages/server/src/enterprise/utils/encryption.util.ts`           | 12   |
| `hashNeedsUpgrade`        | Function | `packages/server/src/enterprise/utils/encryption.util.ts`           | 26   |
| `getHash`                 | Function | `packages/server/src/enterprise/utils/encryption.util.ts`           | 31   |
| `compareHash`             | Function | `packages/server/src/enterprise/utils/encryption.util.ts`           | 36   |
| `isEmailChangeJwtShape`   | Function | `packages/server/src/enterprise/utils/emailChangeJwt.util.ts`       | 25   |

## Execution Flows

| Flow                                                | Type            | Steps |
| --------------------------------------------------- | --------------- | ----- |
| `InitializeJwtCookieMiddleware → UsageCacheManager` | cross_community | 7     |
| `InitializeJwtCookieMiddleware → Initialize`        | cross_community | 7     |
| `Register → IsInvalidName`                          | intra_community | 7     |
| `TestConfig → IsInvalidUUID`                        | cross_community | 6     |
| `TestConfig → InternalFlowiseError`                 | cross_community | 6     |
| `Create → IsInvalidUUID`                            | cross_community | 6     |
| `Create → InternalFlowiseError`                     | cross_community | 6     |
| `Register → InternalFlowiseError`                   | cross_community | 6     |
| `Register → ReadOrganization`                       | cross_community | 6     |
| `Create → IsInvalidUUID`                            | cross_community | 6     |

## Connected Areas

| Area          | Connections |
| ------------- | ----------- |
| Documentstore | 83 calls    |
| Controllers   | 8 calls     |
| Marketplaces  | 5 calls     |
| Cluster_518   | 4 calls     |
| Json          | 4 calls     |
| Passport      | 4 calls     |
| Mysql         | 2 calls     |
| Cluster_33    | 2 calls     |

## How to Explore

1. `gitnexus_context({name: "sanitizeUser"})` — see callers and callees
2. `gitnexus_query({query: "services"})` — find related execution flows
3. Read key files listed above for implementation details
