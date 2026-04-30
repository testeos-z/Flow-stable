# Agent Creation Workflow — Guía Completa

Workflow completo para crear agentes modulares en Flowise que se importan en flujos FACTUM.

---

## Quick Start

```bash
# 1. Ver el template y entender los pasos
opencode /create-agent health_agent_core

# 2. Ejecutar la creación real
opencode /create-agent-execute health_agent_core

# 3. Verificar documentación
opencode /update-agent-skills
```

---

## Archivos Clave

| Archivo                           | Ubicación                                           | Propósito                            |
| --------------------------------- | --------------------------------------------------- | ------------------------------------ |
| **AGENT_CREATION_TEMPLATE.md**    | `.agents/prompts/`                                  | Template maestro de 9 secciones      |
| **05-node-flow-compatibility.md** | `.agents/skills/flowise-node-reference/references/` | Compatibilidad CHATFLOW vs AGENTFLOW |
| **/create-agent**                 | `.opencode/command/`                                | Mostrar template y pasos             |
| **/create-agent-execute**         | `.opencode/command/`                                | Ejecutar creación                    |
| **/update-agent-skills**          | `.opencode/command/`                                | Verificar documentación              |

---

## Workflow Completo

### Paso 1: Entender el Template

```bash
opencode /create-agent health_agent_core
```

**Output esperado:**

-   Path al template
-   9 secciones principales explicadas
-   Referencia a § 8 para health_agent_core
-   Next steps

### Paso 2: Llenar Información del Agente

Ir a `.agents/prompts/AGENT_CREATION_TEMPLATE.md` y completar:

```
§ 2.1: Nombre, Provider, Modelo, Credential
§ 2.2: Rol, Especialización, Indicadores
§ 2.3: Contexto (conexiones, herramientas, memoria)
§ 3  : Sistema Prompt (completo, 15 secciones)
```

Para **health_agent_core**: ya está en § 8, copiar directamente.

### Paso 3: Validar Compatibilidad

**Siempre verificar**:

```
Lee: flowise-node-reference/references/05-node-flow-compatibility.md
✅ Tipo de flujo: CHATFLOW
✅ Nodo final: Tool Agent (NO LLM node)
✅ Nodos: ChatModel, ToolAgent, BufferMemory, (Tools)
```

### Paso 4: Ejecutar Creación

```bash
opencode /create-agent-execute health_agent_core
```

**Output incluye:**

-   Configuración del agente (provider, model, credential)
-   6 pasos de ejecución
-   Checklist de validación
-   Warnings sobre errores comunes

### Paso 5: Crear en Flowise

Ejecutar en OpenCode:

```python
flow-control_create_chatflow(
    name="health_agent_core",
    type="CHATFLOW",
    flowData={
        "nodes": [
            # Chat Model node (OpenRouter)
            # Tool Agent node (system message = prompt completo)
            # Buffer Memory node
            # Calculator node (opcional)
        ],
        "edges": [
            # Chat Model → Tool Agent (model)
            # Buffer Memory → Tool Agent (memory)
            # Calculator → Tool Agent (tools)
        ]
    }
)
```

Ver template § 4 para estructura exacta de flowData.

### Paso 6: Validar

Checklist de § 6:

-   [ ] Sin error "Ending node must be..."
-   [ ] Nodo final = Tool Agent ✅
-   [ ] System message = prompt completo ✅
-   [ ] Memoria conectada ✅
-   [ ] Chat Model conectado ✅
-   [ ] Credential válida ✅

### Paso 7: Probar

Enviar mensaje de prueba al agente.

### Paso 8: Documentar

```python
engram_mem_save(
    title="health_agent_core creado en Flowise",
    type="decision",
    content="""
**What**: Chatflow health_agent_core creado con Tool Agent + OpenRouter
**Why**: Agente modular para importar en FACTUM
**Where**:
  - Chatflow ID: [ID]
  - Provider: OpenRouter
  - Model: nvidia/nemotron-...
  - Credential: 2c5d28de...
**Learned**: Health agent funciona con Buffer Memory, 0.7 temp, 4096 tokens
    """
)
```

---

## Estructura del Template (§ 9 en AGENT_CREATION_TEMPLATE.md)

```
§ 1  Pre-requisites (4 checks)
§ 2  Agent Information (Identity, Purpose, Context — 3 subsecciones)
§ 3  System Prompt (15 secciones: Rol, Specialización, Indicadores, Comparables, etc.)
§ 4  Flowise Configuration (Nodos, parámetros, edges, validación)
§ 5  Execution Plan (6 pasos)
§ 6  Checklist (13 items)
§ 7  Troubleshooting (5 errores comunes)
§ 8  Case: health_agent_core (COMPLETAMENTE DESARROLLADO)
§ 9  Referencias
```

---

## health_agent_core — Ejemplo Completo

### Identidad (§ 8.1)

```
Nombre: health_agent_core
Flujo: CHATFLOW
Provider: OpenRouter
Modelo: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free
Credential: 2c5d28de-e4a1-4368-93ff-aa7233a9257e
```

### Propósito (§ 8.2)

```
Rol: Evaluar políticas desde impacto en salud pública, cobertura, equidad
Especialización: 7 áreas (salud pública, acceso, calidad, financiamiento, RRHH, etc.)
Indicadores: 8 KPIs (mortalidad, cobertura, espera, gasto, personal, etc.)
```

### Sistema Prompt (§ 8.4)

```
- Rol completo (3 párrafos)
- Especialización (7 bullets)
- Problemas estructurales (8 bullets)
- Indicadores clave (8 bullets)
- Módulo de Comparables (instrucciones detalladas)
- Diagnóstico mínimo (6 capas)
- Funcionamiento (3 fases: antes/después/informe)
- Operadores de diseño (8 operadores)
- Reglas operativas (7 reglas con umbrales específicos)
- Evidencia & Citas (instrucciones RAG)
- Relaciones (agentes que colaboran)
- Estilo (tono y enfoque)
```

---

## Troubleshooting Common Errors

### ❌ "Ending node must be either a Chain or Agent or Engine"

**Causa**: Usaste nodo `LLM` (Agent Flows) como nodo final en CHATFLOW

**Solución**:

```
Reemplaza el nodo LLM con: Tool Agent
Tool Agent es válido como nodo final en CHATFLOW
```

Ref: 05-node-flow-compatibility.md § "Resolución"

### ❌ Credential inválida

**Causa**: ID de credential no existe

**Solución**:

```
1. Ir a Flowise UI → Credentials
2. Copiar ID exacto de la credencial
3. Verificar que sea tipo "openRouterApi"
4. Actualizar chatflow con ID correcto
```

### ❌ Agente responde genérico

**Causa**: System message incompleto o vago

**Solución**:

```
Copiar COMPLETO el sistema prompt desde § 8.4
No condensar ni parafrasear el prompt
```

### ❌ Salida truncada

**Causa**: Max Tokens muy bajo

**Solución**:

```
Aumentar Max Tokens de Chat Model a 4096+ según necesidad
Para reportes largos: 8192 o más
```

### ❌ Chat Model no conectado

**Causa**: Edge faltante

**Solución**:

```
Dibuja edge de: chatOpenRouter.output → toolAgent.input (model)
Ref: § 4.3 en template
```

---

## Agentes Disponibles

### health_agent_core ✅ COMPLETAMENTE DEFINIDO

-   Template: § 8 en AGENT_CREATION_TEMPLATE.md
-   Sistema prompt: § 8.4 (extenso, 12 secciones)
-   Comando: `opencode /create-agent-execute health_agent_core`
-   Status: Listo para crear

### environment_agent 📋 DEFINIDO (Usuario)

-   Template: User-provided (similar a health_agent_core)
-   Sistema prompt: Proporcionado por usuario
-   Comando: `opencode /create-agent-execute environment_agent`
-   Status: Ready

### Nuevos agentes 🚀

Para crear un nuevo agente:

1. Copiar template § 1-7
2. Llenar § 2-3 para tu agente
3. Crear § 8 específico con identidad, propósito, prompt
4. Agregar case en `/create-agent-execute`
5. Ejecutar: `opencode /create-agent-execute your_agent_name`

---

## Referencias Cruzadas

| Tema                    | Documento                                                         |
| ----------------------- | ----------------------------------------------------------------- |
| Compatibilidad de nodos | `flowise-node-reference/references/05-node-flow-compatibility.md` |
| Catálogo de 302 nodos   | `flowise-node-reference/references/00-node-catalogue.md`          |
| Patrones de diseño      | `flowise-node-reference/references/02-design-patterns.md`         |
| Árboles de decisión     | `flowise-node-reference/references/03-decision-trees.md`          |
| Estructura flowData     | `flowise-node-reference/references/04-flowdata-schema.md`         |

---

## Próximos Pasos

1. **Ejecutar**: `opencode /create-agent health_agent_core`
2. **Leer**: `.agents/prompts/AGENT_CREATION_TEMPLATE.md`
3. **Validar**: `flowise-node-reference/references/05-node-flow-compatibility.md`
4. **Crear**: `opencode /create-agent-execute health_agent_core`
5. **Implementar**: En OpenCode, llamar `flow-control_create_chatflow()`
6. **Documentar**: `engram_mem_save()` con ID y arquitectura

---

## Soporte

-   📚 Docs: `.agents/prompts/AGENT_CREATION_TEMPLATE.md`
-   🔧 Compatibilidad: `flowise-node-reference/references/05-node-flow-compatibility.md`
-   💬 Commands: `/create-agent`, `/create-agent-execute`, `/update-agent-skills`
-   🧠 Memory: Check `engram_mem_search("health_agent_core")` para ver agentes creados

---

**Version**: 1.0  
**Last Updated**: 2026-04-29  
**Status**: ✅ Production Ready
