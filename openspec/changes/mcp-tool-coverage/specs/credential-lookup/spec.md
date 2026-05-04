# Delta for Credential Lookup

## MODIFIED Requirements

### Requirement: List Credential Types (renamed from List Credentials)

The system MUST list available credential types from the local hardcoded registry via `list_credential_types`. This tool replaces the previous `list_credentials` which used the same local registry.

(Previously: tool was named `list_credentials`. Renamed to `list_credential_types` to distinguish local registry lookup from API-based credential management.)

#### Scenario: List dev credentials

-   GIVEN local registry with 3 credential types
-   WHEN `list_credential_types({ env: "dev" })` is called
-   THEN response returns credential type names, descriptions, and UUIDs from local registry

#### Scenario: Legacy name removed

-   GIVEN the MCP server has started
-   WHEN agent attempts to call `list_credentials` (old name)
-   THEN tool is not found; agent should use `list_credential_types` instead

**Note**: `resolve_credential` is UNCHANGED (still resolves local registry types to UUIDs).

## ADDED Requirements

### Requirement: List API Credentials

The system MUST list credentials managed via the Flowise API (NOT the local registry) via `list_credentials`.

**API**: `GET /api/v1/credentials`

**Naming**: `list_credentials` is now API-based, distinct from `list_credential_types` (local registry).

#### Scenario: List with pagination

-   WHEN `list_credentials({ page: 1, limit: 50 })` is called
-   THEN response includes credentials from Flowise API with pagination metadata

**Security**: Credential values are masked (**\***) by the Flowise API; the MCP tool transparently inherits this.

### Requirement: Get Credential

The system MUST return a single credential via `get_credential`.

**API**: `GET /api/v1/credentials/{id}`

#### Scenario: Get credential

-   WHEN `get_credential({ id: "cred-123" })` is called
-   THEN response includes credential type, name, and masked value

#### Scenario: Get non-existent credential

-   WHEN called with invalid ID
-   THEN error response with "Credential not found"

### Requirement: Create Credential

The system MUST create a credential via `create_credential`.

**API**: `POST /api/v1/credentials`

**Contract**: `name` (string, required), `credentialName` (string, required, e.g. "openRouterApi"), `plainDataEnv` (object, required, key-value pairs for the credential)

**CRITICAL**: Agents MUST NOT log or persist `plainDataEnv` values — they contain plaintext API keys and tokens.

#### Scenario: Create openRouter credential

-   WHEN `create_credential({ name: "my-key", credentialName: "openRouterApi", plainDataEnv: { openRouterApiKey: "sk-..." } })` is called
-   THEN credential is stored in Flowise; response returns ID and metadata (value masked)

### Requirement: Update Credential

The system MUST update a credential via `update_credential`.

**API**: `PUT /api/v1/credentials/{id}`

#### Scenario: Update credential value

-   WHEN `update_credential({ id, plainDataEnv: { openRouterApiKey: "new-key" } })` is called
-   THEN credential is updated; old value replaced

### Requirement: Delete Credential

The system MUST delete a credential via `delete_credential`.

**API**: `DELETE /api/v1/credentials/{id}`

#### Scenario: Delete unused credential

-   WHEN `delete_credential({ id })` is called
-   THEN credential is removed

#### Scenario: Delete credential in use

-   WHEN credential is referenced by flows or nodes
-   THEN error response warning of dependencies

### Error Handling

-   All API errors (4xx, 5xx) MUST be caught and returned as error responses
-   401/403 MUST indicate RBAC permission requirements for credential management
-   Creating duplicate credentials MUST return clear conflict error
