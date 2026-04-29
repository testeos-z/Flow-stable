---
name: alejandria-architecture
description: >
    Guía de arquitectura para @gbai/alejandria — la fuente centralizada de conocimiento del ecosistema.
    Trigger: Cuando se menciona "alejandria", se pregunta sobre su arquitectura, conocimiento, MCPs, búsqueda vectorial,
    o cómo obtener documentos/datos de simulación desde el ecosistema.
license: Apache-2.0
metadata:
    author: gentleman-programming
    version: '1.0'
---

## Cuándo Usar Este Skill

Usa este skill cuando:

-   Necesites entender la arquitectura de @gbai/alejandria
-   Preguntes sobre cómo funciona la búsqueda de conocimiento
-   Necesites integrar con MCPs del ecosistema
-   Quieras entender cómo obtener datos de simulación (edge)
-   Preguntes sobre recursos estáticos o documentos
-   Diseñes nuevo código que interactúe con alejandria

---

## Propósito de Aleksandria

Aleksandria es la **única fuente de conocimiento** del ecosistema GobernAI. Su responsabilidad central es agregar y exponer:

-   **MCPs externos** (investigación, datos de Portugal, Madeira, UE, OpenAlex, NYC)
-   **Búsqueda vectorial** (embeddings, índice, búsqueda semántica)
-   **Datos de simulación** (edge cases de Supabase)
-   **Recursos estáticos** (documentos, plantillas, briefs)
-   **Caché** (políticas reutilizables)

> **IMPORTANTE**: Aleksandria NO ejecuta agentes ni LangGraph. Solo responde "dame contexto/documentos/datos" — la orquestación vive en @gbai/nous.

---

## Arquitectura de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                    @gbai/alejandria                              │
│              (Fuente centralizada de conocimiento)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │   MCP Client  │  │    Vector    │  │   Edge Data      │    │
│  │   Aggregator │  │    Store     │  │    Provider      │    │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘    │
│         │                 │                    │              │
│         ▼                 ▼                    ▼              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Knowledge & Data API Layer                   │  │
│  │   search() | getDocument() | getEdgeData() | getStatic() │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
   ┌───────────┐        ┌───────────┐         ┌───────────┐
   │ @gbai/nous │        │  Sim API  │         │  Agentes  │
   │ (orquest) │        │           │         │           │
   └───────────┘        └───────────┘         └───────────┘
```

---

## Componentes Principales

### 1. MCP Client Aggregator

**Responsabilidad**: Unificar el acceso a múltiples MCPs externos bajo una sola interfaz.

**MCPs que maneja** (migrar desde legacy):

-   `internal-research` — Búsqueda de conocimiento interno
-   `pt-data` — Datos de Portugal
-   `madeira-data` — Datos de Madeira
-   `eu-regulations` — Regulaciones europeas
-   `ue-data` — Datos de Unión Europea
-   `openalex` — Datos académicos
-   `nyc-open-data` — Datos abiertos de NYC

**Patrón de diseño**: Factory + Strategy

-   `McpClientFactory` — Crea el cliente correcto según configuración
-   Cada MCP tiene su cliente específico (Strategy)

**Firma típica**:

```typescript
// Lo que debería exponer
class McpAggregator {
    search(query: string, options?: SearchOptions): Promise<McpSearchResult[]>
    getDocument(source: string, docId: string): Promise<Document>
    getSimulationData(simId: string): Promise<SimulationData>
}
```

### 2. Vector Store (Búsqueda Semántica)

**Responsabilidad**: Abstracción sobre Supabase (u otro) para búsqueda vectorial.

**Patrón**: Repository abstraction

**Firma típica**:

```typescript
// Lo que debería exponer
interface VectorStore {
    searchKnowledge(query: string, options?: VectorSearchOptions): Promise<VectorSearchResult[]>
    indexDocument(doc: IndexedDocument): Promise<void>
}
```

**Detalles de implementación**:

-   Embeddings generados con modelo configurado (ej: OpenAI embeddings)
-   Índice en Supabase con pg_vector o similar
-   Búsqueda por similitud cosenoidal

### 3. Edge Data Provider

**Responsabilidad**: Abstraer el acceso a datos de edge de Supabase (form_case_one, form_case_three, bucket).

**Origen** (migrar desde legacy):

-   `EdgeFactory` + `CaseOneFactory` / `CaseThreeFactory`
-   Ubicado en `apps/legacy/src/utils/questionFactory/edgeFactory.ts`

**Patrón**: Factory + Repository

**Firma típica**:

```typescript
// Lo que debería exponer
interface EdgeDataProvider {
    getEdgeData(caseType: 'one' | 'three', simulationId: string): Promise<EdgeData>
    getFormData(formType: string, filter?: FilterOptions): Promise<FormData[]>
}
```

### 4. Static Resources Provider

**Responsabilidad**: Servir documentos, plantillas y archivos estáticos que agentes o flujos necesiten.

**Casos de uso**:

-   Contenido de briefs
-   Plantillas de informe
-   Documentos de referencia

**Patrón**: Content Repository

### 5. Cache Layer (opcional)

**Responsabilidad**: Gestionar caché para búsquedas y documentos.

**Patrón**: Decorator o Middleware

-   Aplicable a cualquier provider
-   Políticas configurables (TTL, invalidación)

---

## Flujos de Datos

### Flujo 1: Búsqueda de Conocimiento

```
Usuario/Agente
     │
     ▼
┌─────────────────┐
│ Knowledge API   │ ◄── search(query, options)
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌─────────┐
│  MCP  │ │ Vector  │ (búsqueda en paralelo o fallbacks)
│Aggregator│ Store  │
└───────┘ └─────────┘
         │
         ▼
┌─────────────────┐
│   Resultados    │
│ (rankeados,     │
│  enriquecidos)  │
└─────────────────┘
```

### Flujo 2: Obtener Datos de Simulación

```
Usuario/Agente
     │
     ▼
┌─────────────────┐
│   Edge Data     │ ◄── getEdgeData(caseType, simulationId)
│    Provider    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase      │
│  (form_case_*  │
│   + bucket)    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Datos de Edge  │
│  formateados    │
└─────────────────┘
```

---

## Dependencias del Ecosistema

```
@gbai/alejandria
    │
    ├── @gbai/tool-kit (logger, config)
    ├── @supabase/supabase-js (vector store + storage)
    └── [Clients HTTP para MCPs externos]
              │
              ▼
    ┌─────────────────┐
    │  MCPs externos  │
    │ (no son parte   │
    │  del repo)      │
    └─────────────────┘
```

---

## Migración desde Legacy

Estos componentes vienen de `apps/legacy/`:

| Componente Legacy                               | Ubicación Original                       | Va a Aleksandria       |
| ----------------------------------------------- | ---------------------------------------- | ---------------------- |
| `McpClientFactory`                              | `utils/agent/data/mcp/`                  | ✅ MCP Aggregator      |
| Clientes MCP (internal_research, pt_data, etc.) | `utils/agent/data/mcp/`                  | ✅ MCP Aggregator      |
| `InternalResearchClient`                        | `utils/agent/data/mcp/`                  | ✅ MCP Aggregator      |
| `EdgeFactory` + factories                       | `utils/questionFactory/edgeFactory.ts`   | ✅ Edge Data Provider  |
| `formatKnowledgeForPrompt`                      | `utils/agent/factory/mcp-integration.ts` | ⚠️ maybe (es genérico) |

---

## Patterns de Diseño a Usar

| Patrón         | Dónde Aplicarlo                | Propósito                                  |
| -------------- | ------------------------------ | ------------------------------------------ |
| **Factory**    | MCP clients, Edge factories    | Crear instancias según configuración       |
| **Repository** | Vector store, Static resources | Abstraer acceso a datos                    |
| **Strategy**   | Diferentes MCPs                | Intercambiar comportamiento                |
| **Adapter**    | Clientes HTTP externos         | Normalizar interfaces de terceros          |
| **Decorator**  | Cache, Logging                 | Añadir comportamiento sin modificar origen |

---

## Estado Actual del Paquete

El paquete `@gbai/alejandria` está en desarrollo:

-   **Versión**: 0.0.1 (skeleton inicial)
-   **Ubicación**: `apps/alejandria/`
-   **Runtime**: Bun
-   **Tipo**: Paquete privado (@gbai/)

El código actual es mínimo — la arquitectura показывает lo que DEBERÍA construirse.

---

## Recursos

-   **Documentación de diseño**: Ver [references/](references/) para documentación adicional
-   **Specs existentes**: En `context/migration/packages/alejandria.md`
-   **Legacy code** (referencia para migración):
    -   `apps/legacy/src/utils/agent/data/mcp/`
    -   `apps/legacy/src/utils/questionFactory/edgeFactory.ts`

---

##Commands Útiles

```bash
# Instalar dependencias
cd apps/alejandria && bun install

# Dev mode con watch
bun run dev

# Build
bun run build
```

---

## Errores Comunes a Evitar

1. **No ejecutar agentes** — Aleksandria solo provee datos, no orquestar
2. **No duplicar lógica** — Si algo ya existe en tool-kit, reutilizarlo (logger, config)
3. **No hardcodear MCPs** — Usar configuración para agregar nuevos MCPs
4. **No acoplar a Supabase** — Abstraer el storage para poder cambiar después
5. **No olvidar tipos** — Mantener tipos compartidos para el ecosistema
