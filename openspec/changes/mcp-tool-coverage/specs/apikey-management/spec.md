# API Key Management Specification

## Purpose

CRUD management of Flowise API keys. Enables agents to programmatically create, list, update, and revoke API keys for programmatic access to Flowise.

## Requirements

### APK-001: List API Keys

The system MUST return all API keys in the workspace via `list_api_keys`.

**API**: `GET /api/v1/apikeys`

#### Scenario: List API keys

-   WHEN `list_api_keys()` is called
-   THEN response returns keys with id, name, and creation date (key value is masked)

### APK-002: Create API Key

The system MUST create an API key via `create_api_key`.

**API**: `POST /api/v1/apikeys`

**Contract**: `keyName` (string, required)

#### Scenario: Create API key

-   WHEN `create_api_key({ keyName: "ci-deploy-key" })` is called
-   THEN key is created; response includes the full key value (shown ONCE)

**CRITICAL**: Agents MUST capture and store the returned key value immediately — it cannot be retrieved again.

### APK-003: Update API Key

The system MUST update an API key via `update_api_key`.

**API**: `PUT /api/v1/apikeys/{id}`

**Contract**: `keyName` (string, required)

#### Scenario: Rename key

-   WHEN `update_api_key({ id, keyName: "new-name" })` is called
-   THEN key name is updated; key value unchanged

### APK-004: Delete API Key

The system MUST delete an API key via `delete_api_key`.

**API**: `DELETE /api/v1/apikeys/{id}`

#### Scenario: Delete API key

-   WHEN `delete_api_key({ id })` is called
-   THEN key is revoked immediately; any client using it loses access

### Error Handling

-   All API errors (4xx, 5xx) MUST be caught and returned as error responses
-   Deleting the last active key MUST warn (may lock out API access)
-   403 MUST indicate RBAC permission missing
