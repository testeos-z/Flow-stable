# Guía de Integración: Alejandría v1.1.0 Simulation Context

> **Versión**: 1.1.0  
> **Fecha**: 2026-05-13  
> **Flujo objetivo**: `a6228a84-c8b7-449b-b484-7ae942cc0386` (Alejandria v1.1.0)  

---

## 1. Propósito

Esta guía documenta cómo los agentes de **FACTUM** y **POLITEIA** consumen **Alejandría** como herramienta de conocimiento, incluyendo el nuevo soporte para **contexto de simulación** (datos del frontend).

---

## 2. Contrato de llamada a Alejandría

### 2.1 Prefijo de simulación

Cuando un agente necesita consultar datos específicos del caso de la simulación actual, **DEBE** anteponer el prefijo:

```
[SIMULATION: {simulation_id}] {pregunta}
```

Ejemplo:
```
[SIMULATION: 550e8400-e29b-41d4-a716-446655440000] ¿Cuál es el presupuesto de salud?
```

### 2.2 Consulta general (sin simulación)

Para consultas de conocimiento general que **no** estén relacionadas con el caso del usuario:

```
{pregunta_normal}
```

Ejemplo:
```
¿Cuál es el PBI de Argentina en 2023?
```

### 2.3 Cómo decide el agente

El agente **NO** maneja el `simulation_id` directamente. La descripción de la herramienta (variable `alejandria_tool_description`) le instruye:

> "Si tu consulta está relacionada con el caso específico de la simulación activa, DEBES anteponer el prefijo `[SIMULATION: id_simulacion]` al inicio de tu pregunta. Para consultas de conocimiento general que no involucren el caso del usuario, NO uses el prefijo."

---

## 3. Arquitectura del flujo

### 3.1 Alejandría v1.1.0 (AGENTFLOW)

```
Start → Context Detector → Router → Bibliotecario → Source Worker → Condition → Síntesis Final → Reply
                                    ↓ (fallback)
                               Fallback i18n → Fallback Reply
```

**Nodos**:
- **Context Detector**: Extrae `[SIMULATION: id]` del input, setea `$flow.state.simulation_id`
- **Router**: Analiza intención, idioma, territorio, y enruta a fuentes
- **Bibliotecario**: Crea plan de búsqueda usando fuentes MCP + vector stores de simulación
- **Source Worker**: Ejecuta tools (MCPs + vector search sobre `document_simulation`)
- **Síntesis Final**: Sintetiza respuesta con citas

### 3.2 Vector Stores de simulación

Conectados a **Bibliotecario** y **Source Worker**:

| Tabla | Descripción |
|-------|-------------|
| `knowledge.document_simulation` | Documentos adjuntos a la simulación (vector search) |
| `knowledge.simulations` | Datos estructurados del formulario de la simulación |

Filtro automático por `simulation_id` (inyectado por Flowise en runtime).

---

## 4. Variables estáticas de Flowise

### 4.1 Variables base (compartidas)

| Variable | ID | Propósito |
|----------|-----|-----------|
| `alejandria_tool_description` | `2a2e6482...` | Instrucciones para agentes sobre cómo usar Alejandría |
| `factum_prompt_base` | `8ed3ab04...` | Prompt base para todos los agentes FACTUM |
| `politeia_prompt_base` | `de40ce16...` | Prompt base para todos los agentes POLITEIA |

### 4.2 Variables específicas por agente

Cada agente tiene su propia variable (36 en total):

```
prompt_factum_{especialidad}     (24 variables)
prompt_politeia_{especialidad}   (12 variables)
```

Ejemplos:
- `prompt_factum_security_national`
- `prompt_politeia_audiovisual`

### 4.3 Estructura final del System Prompt

```
{{$vars.factum_prompt_base}}
{{$vars.prompt_factum_security_national}}
Territorio: {{$flow.state.territorio}}
```

El territorio es dinámico (viene del frontend). El resto es estático (variables).

---

## 5. Supabase — Tablas de simulación

### 5.1 Esquema

| Tabla | Columnas clave |
|-------|---------------|
| `knowledge.simulations` | `simulation_id` (uuid), `content` (text), `metadata` (jsonb), `embedding` (vector 1024d) |
| `knowledge.document_simulation` | `simulation_id` (uuid), `content` (text), `embedding` (vector 1024d), `metadata` (jsonb) |

### 5.2 RPC para búsqueda vectorial

- `match_simulation_search_flowise`: Búsqueda en `document_simulation` filtrada por `simulation_id`

---

## 6. Agente consumidor — Estructura típica

### 6.1 Nodos

```
ChatOpenRouter (modelo)
  ↓
Buffer Memory
  ↓
ChatPromptTemplate (systemMessagePrompt con {{$vars}})
  ↓
Tool Agent
  ← ChatflowTool (Alejandría, description = {{$vars.alejandria_tool_description}})
```

### 6.2 ChatflowTool configuración

- **selectedChatflow**: `a6228a84-c8b7-449b-b484-7ae942cc0386`
- **description**: `{{$vars.alejandria_tool_description}}`
- **startNewSession**: `true`
- **useQuestionFromChat**: `true`

---

## 7. Testing

### 7.1 Smoke test Alejandría

```bash
# Modo general
curl -X POST /api/v1/prediction/a6228a84-c8b7-449b-b484-7ae942cc0386 \
  -d '{"question": "¿Capital de Francia?"}'

# Modo simulación
curl -X POST /api/v1/prediction/a6228a84-c8b7-449b-b484-7ae942cc0386 \
  -d '{"question": "[SIMULATION: test-123] ¿Qué presupuesto hay?"}'
```

### 7.2 Test end-to-end

```bash
# Security National Agent → Alejandría con simulación
curl -X POST /api/v1/prediction/3e0308a0-48b6-4bfc-a674-8d20bcbd119f \
  -d '{"question": "[SIMULATION: 550e8400-e29b-41d4-a716-446655440000] ¿Cuál es el presupuesto?"}'
```

---

## 8. Troubleshooting

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Contexto de simulación no se activa | Detector no recibe input | Verificar que el prefijo `[SIMULATION: id]` está presente |
| Timeout en agente FACTUM/POLITEIA | Alejandría tarda >10s | Reducir complejidad de query o aumentar timeout |
| Vector store no encuentra resultados | `simulation_id` vacío en metadata filter | Verificar que el Context Detector seteó `$flow.state.simulation_id` |
| "No se encontraron resultados" | Sin datos en `document_simulation` para ese ID | Poblar la tabla con datos de prueba o reales |

---

## 9. Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-05-13 | v1.1.0 — Context Detector + Vector Stores + Variables estáticas + Optimización (12→10 nodos) |

---

## Contacto

Para dudas sobre la integración, consultar la memoria del proyecto (`architecture/alejandria-simulation-context`).