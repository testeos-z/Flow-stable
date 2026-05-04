# Variables Specification

## Purpose

CRUD management of Flowise workspace variables. Enables agents to programmatically store and retrieve shared configuration values (API endpoints, keys, feature flags) usable across flows.

## Requirements

### VAR-001: List Variables

The system MUST return all variables in the workspace via `list_variables`.

**API**: `GET /api/v1/variables`

#### Scenario: List variables

-   GIVEN workspace has "API_URL" and "MODEL_NAME" variables
-   WHEN `list_variables()` is called
-   THEN response returns both variables with name and value

### VAR-002: Create Variable

The system MUST create a variable via `create_variable`.

**API**: `POST /api/v1/variables`

**Contract**: `name` (string, required), `value` (string, required)

#### Scenario: Create variable

-   WHEN `create_variable({ name: "API_URL", value: "https://..." })` is called
-   THEN variable is created; response confirms with name and masked value

#### Scenario: Duplicate name

-   WHEN name already exists in workspace
-   THEN error response with "Variable name already exists"

### VAR-003: Update Variable

The system MUST update a variable via `update_variable`.

**API**: `PUT /api/v1/variables/{id}`

#### Scenario: Update value

-   WHEN `update_variable({ id, value: "new-value" })` is called
-   THEN value is updated

### VAR-004: Delete Variable

The system MUST delete a variable via `delete_variable`.

**API**: `DELETE /api/v1/variables/{id}`

#### Scenario: Delete variable

-   WHEN `delete_variable({ id })` is called
-   THEN variable is removed

### Error Handling

-   All API errors (4xx, 5xx) MUST be caught and returned as error responses
-   Duplicate names return 409 conflict
-   Missing variable returns 404
