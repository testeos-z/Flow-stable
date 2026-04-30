# FlowData Schema — Anatomía del JSON de Chatflow

## Overview

El `flowData` es el JSON que define la estructura completa de un chatflow en Flowise. Se almacena en la base de datos y es interpretado por el frontend (ReactFlow) y el backend (Node.js) de Flowise.

```json
{
  "nodes": [ ... ],      // Array de nodos
  "edges": [ ... ],      // Array de conexiones
  "viewport": {           // Estado del canvas
    "x": 0,
    "y": 0,
    "zoom": 1
  }
}
```

---

## Anatomía de un Nodo

Cada nodo en el array `nodes` tiene esta estructura:

```typescript
{
  id: string,                    // ID único dentro del flow (ej: "chatOpenRouter_0")
  type: "customNode",           // Siempre "customNode" para nodos de chatflow
  position: { x: number, y: number },  // Posición en el canvas
  positionAbsolute?: { ... },   // Posición absoluta (copia de position)
  selected?: boolean,           // Si está seleccionado en el canvas
  dragging?: boolean,            // Si está siendo arrastrado
  width?: number,               // Ancho del nodo en pixels
  height?: number,              // Alto del nodo en pixels
  data: {
    // === Propiedades que vienen del código fuente del nodo (INode) ===

    // Metadatos del nodo
    name: string,               // Nombre técnico (ej: "chatOpenRouter")
    label: string,             // Etiqueta visible (ej: "OpenRouter")
    version: number,           // Versión del componente
    type: string,              // Tipo (ej: "ChatOpenRouter")
    category: string,          // Categoría (ej: "Chat Models")
    description: string,      // Descripción del nodo
    icon: string,              // Path al icono (ej: "/path/to/icon.svg")
    filePath: string,         // Path al archivo .js del nodo
    baseClasses: string[],     // Clases base para validación de conexiones

    // Credencial (solo si el nodo requiere API key)
    credential?: string,        // UUID de la credencial (ej: "2c5d28de-e4a1-4368-93ff-aa7233a9257e")

    // === Inputs: CONFIGURACIÓN del nodo ===
    inputs: {
      // Cada campo del formulario de configuración
      // Las keys son los `name` definidos en INodeParams del nodo
      // Los valores son los valores actuales
      [key: string]: any
    },

    // === InputAnchors: PUNTOS DE ENTRADA (sockets izquierdo) ===
    // Se generan automáticamente del nodo. Cada socket recibe una conexión de otro nodo.
    inputAnchors: [
      {
        label: string,         // Label visible del socket
        name: string,          // Nombre del campo (ej: "model", "memory")
        type: string,          // Tipo de dato esperado (ej: "BaseChatModel")
        list?: boolean,        // Si es una lista (multiple conexiones)
        id: string,           // ID único: "{nodeId}-input-{name}-{type}"
        display?: boolean,     // Si se muestra
        optional?: boolean     // Si es opcional
      }
    ],

    // === InputParams: CAMPOS DEL FORMULARIO (panel derecho) ===
    // Se usan para renderizar el formulario de configuración
    inputParams: [
      {
        label: string,         // Label visible en el form
        name: string,          // Nombre del campo (debe coincidir con inputs[key])
        type: string,          // Tipo del campo (string, number, boolean, credential, json, etc)
        default?: any,         // Valor por defecto
        description?: string, // Descripción/placeholder
        placeholder?: string,  // Placeholder
        optional?: boolean,    // Si es opcional
        additionalParams?: boolean,  // Si es un parámetro adicional
        step?: number,         // Para números: paso del spinner
        rows?: number,         // Para strings: altura del textarea
        list?: boolean,        // Si es una lista
        credentialNames?: string[], // Para tipo "credential": qué credenciales acepta
        type: string,           // Para inputs tipo options
        options?: Array<{      // Para inputs tipo "options" o "multiOptions"
          label: string,
          name: string,
          description?: string
        }>,
        show?: INodeDisplay,   // Mostrar conditionalmente
        hide?: INodeDisplay    // Ocultar conditionalmente
      }
    ],

    // === OutputAnchors: PUNTOS DE SALIDA (sockets derecho) ===
    // Se generan automáticamente del nodo. Otros nodos se conectan a estos sockets.
    outputAnchors: [
      {
        id: string,           // ID único: "{nodeId}-output-{name}|{baseClass1}|{baseClass2}|..."
        name: string,          // Nombre del output
        label: string,         // Label visible
        type: string,          // Tipo de dato que sale (string con | para múltiples)
        description?: string
      }
    ],

    // === Outputs: SALIDA (para algunos nodos) ===
    outputs?: Record<string, any>,  //罕用

    // === Para Tool Agent: las tools ===
    tools?: string[],  // Array de referencias a nodos de tool: ["{{calculator_0.data.instance}}"]
    memory?: string,    // Referencia al nodo de memory: "{{bufferMemory_0.data.instance}}"
    model?: string     // Referencia al nodo de modelo: "{{chatOpenRouter_0.data.instance}}"
  }
}
```

---

## Anatomía de un Edge

```typescript
{
  source: string,           // ID del nodo origen (ej: "chatOpenRouter_0")
  target: string,           // ID del nodo destino (ej: "toolAgent_0")
  sourceHandle: string,    // ID del socket de salida (debe matchear un outputAnchor del nodo origen)
  targetHandle: string,    // ID del socket de entrada (debe matchear un inputAnchor del nodo destino)
  type: string,            // Tipo de edge: "buttonedge" (default en Flowise)
  id: string,              // ID único del edge
  data?: {
    sourceColor?: string,   // Color de la línea desde el origen
    targetColor?: string,  // Color de la línea hacia el destino
    isHumanInput?: boolean // Si este edge representa input humano
  }
}
```

### Cómo se forman los handle IDs

**Input Handle** (socket izquierdo):

```
{nodeId}-input-{name}-{type}
Ejemplo: toolAgent_0-input-model-BaseChatModel
```

**Output Handle** (socket derecho):

```
{nodeId}-output-{outputName}|{BaseClass1}|{BaseClass2}|...
Ejemplo: chatOpenRouter_0-output-chatOpenRouter-ChatOpenRouter|BaseChatOpenAI|BaseChatModel|BaseLanguageModel|Runnable
```

---

## INodeParams — Tipos de Campo

Los campos posibles en `inputParams` y los tipos correspondientes:

| Type                 | Descripción            | Ejemplo                    |
| -------------------- | ---------------------- | -------------------------- |
| `string`             | Input de texto         | Model name, system message |
| `number`             | Input numérico         | Temperature, maxTokens     |
| `boolean`            | Toggle                 | Streaming, enableDetailed  |
| `credential`         | Selector de credencial | OpenRouter API key         |
| `json`               | JSON object/textarea   | BaseOptions                |
| `password`           | Campo de contraseña    | (raro)                     |
| `options`            | Dropdown single        | Model selection            |
| `multiOptions`       | Dropdown multiple      | (raro)                     |
| `BaseCache`          | Cache selector         | Redis cache                |
| `Tool`               | Tool node              | Calculator, search         |
| `BaseChatMemory`     | Memory node            | Buffer Memory              |
| `BaseChatModel`      | Chat model             | OpenRouter                 |
| `ChatPromptTemplate` | Prompt template        | (para override)            |
| `Moderation`         | Moderation node        | (opcional)                 |

---

## Referencia: Nodos Comunes

### 1. ChatOpenRouter

**Archivo fuente**: `packages/components/nodes/chatmodels/ChatOpenRouter/ChatOpenRouter.ts`

**Credential**: `openRouterApi`

```json
{
    "name": "chatOpenRouter",
    "type": "ChatOpenRouter",
    "label": "OpenRouter",
    "category": "Chat Models",
    "version": 1,
    "baseClasses": ["ChatOpenRouter", "BaseChatOpenAI", "BaseChatModel", "BaseLanguageModel", "Runnable"],
    "credential": "2c5d28de-e4a1-4368-93ff-aa7233a9257e",

    "inputs": {
        "cache": "",
        "modelName": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        "temperature": 0.9,
        "streaming": true,
        "allowImageUploads": false,
        "maxTokens": "",
        "topP": "",
        "frequencyPenalty": "",
        "presencePenalty": "",
        "timeout": "",
        "basepath": "https://openrouter.ai/api/v1",
        "baseOptions": ""
    },

    "inputAnchors": [
        { "id": "chatOpenRouter_0-input-cache-BaseCache", "label": "Cache", "name": "cache", "type": "BaseCache", "optional": true }
    ],

    "outputAnchors": [
        {
            "id": "chatOpenRouter_0-output-chatOpenRouter-ChatOpenRouter|BaseChatOpenAI|BaseChatModel|BaseLanguageModel|Runnable",
            "name": "chatOpenRouter",
            "label": "ChatOpenRouter",
            "type": "ChatOpenRouter | BaseChatOpenAI | BaseChatModel | BaseLanguageModel | Runnable"
        }
    ],

    "inputParams": [
        {
            "label": "Connect Credential",
            "name": "credential",
            "type": "credential",
            "credentialNames": ["openRouterApi"],
            "optional": true
        },
        { "label": "Model Name", "name": "modelName", "type": "string", "placeholder": "openai/gpt-3.5-turbo" },
        { "label": "Temperature", "name": "temperature", "type": "number", "step": 0.1, "optional": true },
        { "label": "Streaming", "name": "streaming", "type": "boolean", "default": true, "additionalParams": true, "optional": true },
        { "label": "Allow Image Uploads", "name": "allowImageUploads", "type": "boolean", "default": false, "optional": true },
        { "label": "Max Tokens", "name": "maxTokens", "type": "number", "step": 1, "additionalParams": true, "optional": true },
        { "label": "Top Probability", "name": "topP", "type": "number", "step": 0.1, "additionalParams": true, "optional": true },
        {
            "label": "Frequency Penalty",
            "name": "frequencyPenalty",
            "type": "number",
            "step": 0.1,
            "additionalParams": true,
            "optional": true
        },
        {
            "label": "Presence Penalty",
            "name": "presencePenalty",
            "type": "number",
            "step": 0.1,
            "additionalParams": true,
            "optional": true
        },
        {
            "label": "Base Path",
            "name": "basepath",
            "type": "string",
            "default": "https://openrouter.ai/api/v1",
            "additionalParams": true,
            "optional": true
        },
        { "label": "Timeout", "name": "timeout", "type": "number", "step": 1, "additionalParams": true, "optional": true },
        { "label": "Base Options", "name": "baseOptions", "type": "json", "additionalParams": true, "optional": true }
    ]
}
```

---

### 2. Tool Agent

**Archivo fuente**: `packages/components/nodes/agents/ToolAgent/ToolAgent.ts`

```json
{
    "name": "toolAgent",
    "type": "AgentExecutor",
    "label": "Tool Agent",
    "category": "Agents",
    "version": 2,
    "baseClasses": ["AgentExecutor", "BaseChain", "Runnable"],
    "credential": "",

    "inputs": {
        "tools": ["{{calculator_0.data.instance}}"],
        "memory": "{{bufferMemory_0.data.instance}}",
        "model": "{{chatOpenRouter_0.data.instance}}",
        "chatPromptTemplate": "",
        "systemMessage": "Your system prompt here...",
        "inputModeration": "",
        "maxIterations": "",
        "enableDetailedStreaming": ""
    },

    "inputAnchors": [
        { "id": "toolAgent_0-input-tools-Tool", "label": "Tools", "name": "tools", "type": "Tool", "list": true },
        { "id": "toolAgent_0-input-memory-BaseChatMemory", "label": "Memory", "name": "memory", "type": "BaseChatMemory" },
        { "id": "toolAgent_0-input-model-BaseChatModel", "label": "Tool Calling Chat Model", "name": "model", "type": "BaseChatModel" }
    ],

    "outputAnchors": [
        {
            "id": "toolAgent_0-output-toolAgent-AgentExecutor|BaseChain|Runnable",
            "name": "toolAgent",
            "label": "AgentExecutor",
            "type": "AgentExecutor | BaseChain | Runnable"
        }
    ],

    "inputParams": [
        {
            "label": "System Message",
            "name": "systemMessage",
            "type": "string",
            "default": "You are a helpful AI assistant.",
            "rows": 4,
            "additionalParams": true,
            "optional": true
        }
    ]
}
```

**Importante**: Los 3 inputs (`tools`, `memory`, `model`) son **inputAnchors** (sockets), no campos del formulario. No necesitan `inputParams` porque no son configurables — se conectan via edges.

**Referencias entre nodos**: Se usan templates `{{nodeId.data.instance}}`:

-   `{{calculator_0.data.instance}}` — referencia a un nodo tool
-   `{{bufferMemory_0.data.instance}}` — referencia a un nodo memory
-   `{{chatOpenRouter_0.data.instance}}` — referencia a un nodo chat model

---

### 3. Buffer Memory

**Archivo fuente**: `packages/components/nodes/memory/BufferMemory/BufferMemory.ts`

```json
{
    "name": "bufferMemory",
    "type": "BufferMemory",
    "label": "Buffer Memory",
    "category": "Memory",
    "version": 2,
    "baseClasses": ["BufferMemory", "BaseChatMemory", "BaseMemory"],

    "inputs": {
        "sessionId": "",
        "memoryKey": "chat_history"
    },

    "inputAnchors": [],

    "outputAnchors": [
        {
            "id": "bufferMemory_0-output-bufferMemory-BufferMemory|BaseChatMemory|BaseMemory",
            "name": "bufferMemory",
            "label": "BufferMemory",
            "type": "BufferMemory | BaseChatMemory | BaseMemory"
        }
    ],

    "inputParams": [
        {
            "label": "Session Id",
            "name": "sessionId",
            "type": "string",
            "default": "",
            "description": "If not specified, a random id will be used.",
            "additionalParams": true,
            "optional": true
        },
        {
            "label": "Memory Key",
            "name": "memoryKey",
            "type": "string",
            "default": "chat_history",
            "additionalParams": true
        }
    ]
}
```

---

### 4. Calculator

**Archivo fuente**: `packages/components/nodes/tools/Calculator/Calculator.ts`

```json
{
    "name": "calculator",
    "type": "Calculator",
    "label": "Calculator",
    "category": "Tools",
    "version": 1,
    "baseClasses": ["Calculator", "Tool", "StructuredTool", "Runnable"],

    "inputs": {},

    "inputAnchors": [],

    "outputAnchors": [
        {
            "id": "calculator_0-output-calculator-Calculator|Tool|StructuredTool|Runnable",
            "name": "calculator",
            "label": "Calculator",
            "type": "Calculator | Tool | StructuredTool | Runnable"
        }
    ],

    "inputParams": []
}
```

**Nota**: Calculator es el nodo más simple — no tiene inputs configurables ni credentials. Solo tiene un outputAnchor que se conecta a Tool Agent.

---

## Validador Visual de Templates

Para crear un nodo en un flow nuevo, necesitás:

### Mínimo para que el canvas lo renderice

```json
{
    "id": "unique_node_id",
    "type": "customNode",
    "position": { "x": 100, "y": 200 },
    "data": {
        "name": "nodeTypeName",
        "label": "Display Label",
        "version": 1,
        "type": "NodeType",
        "category": "Category",
        "baseClasses": ["NodeType"],
        "inputs": {}
    }
}
```

### Mínimo para que el backend lo ejecute

Agregar `credential` (si requiere), `inputs` con valores por defecto, y `outputAnchors`.

---

## Errores Comunes y Soluciones

### Error: "Cannot read 'image' (this model does not support image input)"

**Causa**: `allowImageUploads` estaba en `""` (string vacío) en lugar de `false` (booleano).

**Solución**: Asegurar que en `inputs` el valor sea booleano:

```json
"inputs": {
  "allowImageUploads": false
}
```

### Error: "Cannot connect to credential"

**Causa**: Falta el campo `credential` en `data` del nodo, o el ID no corresponde a una credencial válida en el workspace.

**Solución**: Verificar que `data.credential` contenga el UUID correcto de la credencial.

### Error: El campo de configuración no aparece en el panel derecho

**Causa**: Falta la definición correspondiente en `inputParams`.

**Solución**: Incluir el `inputParams` completo para cada campo que se quiere configurar en la UI:

```json
"inputParams": [
  { "label": "Model Name", "name": "modelName", "type": "string" }
]
```

### Error: La conexión no se ve en el canvas pero el flow funciona

**Causa**: Los `handle` IDs del edge no matchean exactamente con los `inputAnchors`/`outputAnchors` del nodo.

**Solución**: Los IDs deben ser exactamente:

-   Input: `{nodeId}-input-{name}-{type}`
-   Output: `{nodeId}-output-{name}|{baseClass1}|{baseClass2}...`

### Error: Nodo no conecta a otro nodo que debería ser compatible

**Causa**: Los `baseClasses` del nodo destino no incluyen la clase del nodo origen.

**Solución**: Flowise valida que la conexión sea válida comparando `baseClasses`. Si el modelo es `BaseChatModel` y el agente espera `BaseChatModel`, debe matchear.

---

## Criterios para Render vs Ejecución

| Campo           | UI (Canvas)                                              | Backend (Ejecución)               |
| --------------- | -------------------------------------------------------- | --------------------------------- |
| `inputParams`   | ✅ Necesario para que el campo aparezca en el formulario | ❌ Ignorado                       |
| `inputs`        | ❌ No se usa para render                                 | ✅ Se usa para ejecución          |
| `baseClasses`   | ❌ No se usa para render                                 | ✅ Se usa para validar conexiones |
| `outputAnchors` | ✅ Necesario para que aparezcan los sockets derechos     | ✅ Se usa para validar conexiones |
| `credential`    | ✅ Se muestra el selector                                | ✅ Se resuelve la credencial      |
| `inputs[name]`  | Solo se muestra si hay `inputParams` correspondiente     | ✅ Se lee en `init()` del nodo    |

---

## Cómo Investigar un Nodo Desconocido

Para obtener el JSON default de cualquier nodo:

1. **Leer el archivo fuente**: `packages/components/nodes/{category}/{NodeName}/{NodeName}.ts`
2. **Buscar en el constructor**: `this.inputs = [...]` — ahí están los defaults
3. **Buscar `this.credential`**: define la credencial requerida
4. **Buscar `this.baseClasses`**: define las clases para validación de conexiones
5. **Generar `inputAnchors`/`outputAnchors`**: estos se generan dinámicamente en el servidor (ver `packages/server/src/utils/genericHelpers.ts`)

Para los nodos estándar (los que vienen con Flowise), el path es:

```
/usr/src/flowise/packages/server/node_modules/flowise-components/dist/nodes/{category}/{NodeName}/{NodeName}.js
```

---

## Viewport — Estado del Canvas

```json
{
    "x": 412, // Offset X del viewport
    "y": 51, // Offset Y del viewport
    "zoom": 1.02 // Zoom actual (1 = 100%)
}
```

Valores razonables para flows nuevos: `"zoom": 1.0` y `"x": 0, "y": 0`.

---

## Resumen: Pasos para Crear un Nodo Completo

1. **Determinar el `name`** desde el archivo fuente del nodo
2. **Copiar `baseClasses`** del constructor
3. **Copiar `inputs`** con defaults del `this.inputs[]`
4. **Agregar `credential`** si existe `this.credential`
5. **Generar `outputAnchors`** con el patrón `id: "{name}-output-{name}|{baseClass1}|{baseClass2}..."`
6. **Generar `inputAnchors`** desde los inputs que tienen tipo (model, memory, tools)
7. **Copiar `inputParams`** del constructor para cada campo configurable
8. **Asignar `id`** único y `position` en el canvas
