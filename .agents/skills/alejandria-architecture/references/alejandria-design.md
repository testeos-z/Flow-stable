# Referencias de Arquitectura - Aleksandria

Este archivo apunta a la documentación existente sobre Aleksandria.

## Documentación Principal

-   **Diseño Original**: `context/migration/packages/alejandria.md` — Especificación de responsabilidades y objetivos

## Legacy (para migración)

-   `apps/legacy/src/utils/agent/data/mcp/` — McpClientFactory, clientes MCP
-   `apps/legacy/src/utils/agent/factory/mcp-integration.ts` — Integración MCP
-   `apps/legacy/src/utils/questionFactory/edgeFactory.ts` — Edge data factories

## Paquete Actual

-   `apps/alejandria/` — Código fuente del paquete (@gbai/alejandria)
-   `apps/alejandria/README.md` — README del proyecto
-   `apps/alejandria/package.json` — Dependencias y scripts

## Ecosistema

-   `@gbai/nous` — Orquestador que consume a Aleksandria
-   `@gbai/tool-kit` — Utilidades compartidas (logger, config)
-   `@supabase/supabase-js` — Cliente de Supabase para vector store
