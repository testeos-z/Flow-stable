# Spec: Flow Creation Agent Pipeline with Zod Validation

## Requirements

### Functional Requirements

#### FR1: flow-architect como Orquestador READ-ONLY

-   **FR1.1**: flow-architect DEBE poder leer información de Flowise (listar chatflows, obtener nodo types, ver credenciales disponibles)
-   **FR1.2**: flow-architect NO DEBE poder ejecutar `create_chatflow`, `update_chatflow`, `delete_chatflow`, ni ninguna operación de escritura en Flowise
-   **FR1.3**: flow-architect DEBE diseñar la estructura del flow (lista de nodos requeridos y conexiones entre ellos)
-   **FR1.4**: flow-architect DEBE delegar la creación de cada nodo al specialist correspondiente
-   **FR1.5**: flow-architect DEBE ensamblar el flowData completo a partir de los JSONs retornados por los specialists

#### FR2: Node Specialist Agents

-   **FR2.1**: Cada specialist DEBE conocer en profundidad los nodos de su categoría
-   **FR2.2**: Cada specialist DEBE recibir: tipo de nodo + parámetros dinámicos (modelo, credencial, etc.)
-   **FR2.3**: Cada specialist DEBE retornar un JSON de nodo que cumpla EXACTAMENTE con la estructura que Flowise genera al arrastrar el nodo desde la UI
-   **FR2.4**: Cada specialist DEBE validar su output con un Zod schema específico antes de retornarlo
-   **FR2.5**: Cada specialist DEBE rechazar configuraciones inválidas (ej: modelo sin tool-calling para un Tool Agent)
-   **FR2.6**: Los specialists DEBEN poder ejecutarse en paralelo cuando no hay dependencias entre ellos

#### FR3: Zod Schemas por Nodo

-   **FR3.1**: Cada tipo de nodo DEBE tener un Zod schema derivado de un "golden template"
-   **FR3.2**: El golden template DEBE ser el JSON exacto que Flowise genera cuando se arrastra el nodo a un canvas vacío
-   **FR3.3**: El schema DEBE incluir TODOS los campos: `inputParams`, `inputAnchors`, `outputAnchors`, `inputs`, `credential`, etc.
-   **FR3.4**: El schema DEBE validar la template syntax en `inputs` (`{{nodeId.data.instance}}`)
-   **FR3.5**: El schema DEBE validar que `credential` sea un UUID válido (no un nombre de tipo)

#### FR4: flow-ing como Único Executor

-   **FR4.1**: flow-ing DEBE ser el único agente con acceso a las tools de escritura del MCP de Flowise
-   **FR4.2**: flow-ing DEBE ejecutar el testing pipeline ANTES de cualquier operación de escritura
-   **FR4.3**: flow-ing DEBE rechazar flowData que no pase la validación completa
-   **FR4.4**: flow-ing DEBE reportar errores detallados cuando un test falle

#### FR5: Testing Pipeline

-   **FR5.1**: La pipeline DEBE ejecutar validación Zod per-node para cada nodo en el flow
-   **FR5.2**: La pipeline DEBE ejecutar validación de graph (huérfanos, ciclos, conectividad)
-   **FR5.3**: La pipeline DEBE ejecutar validación de flowData completo (viewport, estructura)
-   **FR5.4**: La pipeline DEBE ejecutar un smoke test (crear flow temporal y hacer una prediction simple)
-   **FR5.5**: La pipeline DEBE ejecutar un integration test (forzar invocación de tools si el flow las tiene)
-   **FR5.6**: Si cualquier test falla, el flow NO DEBE guardarse en Flowise

#### FR6: Diagnostic Command

-   **FR6.1**: El sistema DEBE soportar el comando `/flow-diagnose <chatflowId>` para validar flows existentes
-   **FR6.2**: El comando DEBE ejecutar la testing pipeline completa y reportar resultado por stage
-   **FR6.3**: El comando DEBE soportar flag `--draft` para validar flowData sin guardar
-   **FR6.4**: El comando DEBE sugerir fixes específicos cuando detecta errores

#### FR6: Registries de Soporte

-   **FR6.1**: Model Registry: mapeo de modelos free/paid con capabilities (toolCalling, streaming, maxTokens)
-   **FR6.2**: Credential Registry: mapeo de `credentialType → UUID` para cada entorno (dev, qa, prod)
-   **FR6.3**: Los registries DEBEN ser fáciles de actualizar sin modificar código

### Non-Functional Requirements

#### NFR1: Performance

-   **NFR1.1**: El pipeline completo (diseño + validación + tests) DEBE completarse en menos de 2 minutos para un flow de 5 nodos
-   **NFR1.2**: Los specialists DEBEN responder en menos de 30 segundos cada uno

#### NFR2: Maintainability

-   **NFR2.1**: Los Zod schemas DEBEN estar en archivos separados por categoría de nodo
-   **NFR2.2**: Los golden templates DEBEN poder re-extraerse de Flowise con un script
-   **NFR2.3**: Cada skill DEBE tener su propio SKILL.md con instrucciones claras

#### NFR3: Reliability

-   **NFR3.1**: El pipeline DEBE tener 0 falsos positivos (nunca decir que un flow es válido si no lo es)
-   **NFR3.2**: El pipeline PUEDE tener falsos negativos tolerables (rechazar un flow que funcionaría, con justificación clara)

## Scenarios

### Scenario 1: Crear un RAG Chatflow exitosamente

```gherkin
Given el usuario quiere crear un chatflow RAG con OpenRouter + Supabase pgvector + MCP
And flow-architect diseña la estructura: Chat Model → Embeddings → Vector Store → Tool Agent → MCP Tool
When flow-architect delega cada nodo al specialist correspondiente
Then cada specialist retorna un JSON válido según su Zod schema
And flow-architect ensambla el flowData con edges correctos
And flow-ing ejecuta la testing pipeline
And todos los tests pasan
And flow-ing guarda el chatflow en Flowise
And el chatflow funciona correctamente al probarlo
```

### Scenario 2: Rechazar modelo incompatible

```gherkin
Given el usuario quiere usar "minimax/minimax-m2.5:free" en un Tool Agent
And el flow requiere tool-calling
When el node-specialist-chat-models recibe la solicitud
Then el specialist DEBE rechazar el modelo
And reportar: "Este modelo no soporta tool-calling. Modelos compatibles: google/gemma-4-26b-a4b-it:free, ..."
And flow-architect DEBE solicitar un modelo alternativo al usuario
```

### Scenario 3: Detectar credencial mal asignada

```gherkin
Given un nodo de vector store tiene credential = "supabaseApi" (nombre de tipo)
And no es un UUID válido
When el node-specialist-vector-stores valida con Zod
Then la validación DEBE fallar
And reportar: "credential debe ser un UUID, no un nombre de tipo. UUIDs disponibles: supabaseApi → 0df85d26-..."
```

### Scenario 4: Testing pipeline rechaza flow roto

```gherkin
Given un flowData tiene un nodo con inputParams incompletos
When flow-ing ejecuta la testing pipeline
Then la validación Zod per-node DEBE fallar
And flow-ing NO DEBE guardar el flow en Flowise
And flow-ing DEBE reportar el error exacto y sugerir fix
```

### Scenario 5: Especialistas en paralelo

```gherkin
Given un flow requiere 3 nodos: Chat Model, Vector Store, Embeddings
And no hay dependencias entre los nodos (cada uno es independiente)
When flow-architect solicita los 3 nodos
Then los 3 specialists DEBEN poder ejecutarse en paralelo
And el tiempo total DEBE ser ~max(tiempo_individual), no la suma
```

### Scenario 6: Actualización de golden template

```gherkin
Given Flowise actualiza un nodo y cambia su estructura de inputParams
When el administrador ejecuta el script de extracción de golden templates
Then el Zod schema correspondiente DEBE actualizarse automáticamente
And los tests existentes DEBEN seguir pasando (o fallar con mensaje claro si hay breaking change)
```
