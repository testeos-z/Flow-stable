# Design Patterns

## Patrón 1: RAG Básico (Chatflow)

```
Document Loader → Text Splitter → Embeddings → Vector Store
                                                            ↓
User Question ────────────────────────────────────────→ Retriever
                                                            ↓
                                                       Chat Model → Response
```

**Cuándo**: Tenés documentos y querés preguntar sobre su contenido.
**Nodos clave**: PDF/Csv/Web Loader → Recursive Character Text Splitter → OpenAI Embedding → Supabase/Pinecone → Vector Store Retriever → ChatOpenAI
**Memory opcional**: Buffer Memory para historial de chat.

---

## Patrón 2: Agente con Herramientas (Sequential)

```
Start (model: ChatOpenAI, memory: AgentMemory)
  │
  ▼
Agent (system prompt + tools: Tavily, Calculator)
  │
  ├── Condition (si necesita más info) ──→ Loop ──→ Agent
  │
  └── End
```

**Cuándo**: El LLM necesita elegir qué herramienta usar según el contexto.
**Nodos clave**: Start → Agent (con Tools) → Condition → Loop → End
**Tools típicas**: Tavily/Serper (web), Calculator, CurrentDateTime, Chatflow Tool

---

## Patrón 3: RAG con Agente (Sequential + RAG)

```
Start
  │
  ▼
Agent (system: "Usá la retriever tool para buscar info")
  │
  ├── Tool: Retriever Tool (conectado a Vector Store)
  │         └─ Chat Model responde con contexto
  │
  └── End
```

**Cuándo**: El agente debe decidir CUÁNDO buscar en la base de conocimiento.
**Ventaja**: El agente decide si necesita RAG o puede responder directamente.
**Nodos clave**: Start → Agent + Retriever Tool → End

---

## Patrón 4: Agente Supervisor + Workers (Multi Agents)

```
Supervisor (planifica, delega, sintetiza)
  │
  ├── Worker 1 (investiga tema A)
  ├── Worker 2 (investiga tema B)
  └── Worker 3 (investiga tema C)
```

**Cuándo**: Tareas complejas que requieren múltiples perspectivas o paralelismo.
**Nodos clave**: Supervisor → Worker × N
**Nota**: Los Workers pueden ser otros chatflows/agentflows via Chatflow Tool.

---

## Patrón 5: Ejecución de Flujos Anidados

```
Chatflow Padre
  │
  ├── Chatflow Tool → "Analizar documento"
  ├── Chatflow Tool → "Extraer metadatos"
  └── Chatflow Tool → "Generar resumen"
```

**Cuándo**: Querés modularizar flujos complejos en sub-flujos reutilizables.
**Nodos clave**: Chatflow Tool / Execute Flow (Seleccionar flujo destino)
**Beneficio**: Cada sub-flujo es independiente y testeable.

---

## Patrón 6: Búsqueda Web con Agente

```
Start
  │
  ▼
Agent (system: "Buscá info actualizada en la web")
  │
  ├── Tool: BraveSearch / Tavily / Serper
  │
  └── End
```

**Cuándo**: El usuario pregunta sobre info actualizada (noticias, clima, precios).
**Tool recomendada**: Tavily (optimizada para AI) > Serper (Google results) > BraveSearch (gratis)
**Memory**: Buffer Window Memory (últimos N mensajes para contexto)

---

## Patrón 7: Flujo con Aprobación Humana

```
Start → Agent (con tools + Require Approval: true)
           │
           ├── Human: Aprueba → Continúa con tool
           └── Human: Rechaza → Responde sin ejecutar
```

**Cuándo**: Acciones críticas que requieren validación humana antes de ejecutarse (enviar emails, modificar datos, pagos).
**Nodos clave**: Start → Agent (interrupt: true, approval prompt configurado)
**Requiere**: Agent Memory configurado (SQLite mínimo)

---

## Patrón 8: Clasificación y Enrutamiento con Condition Agent

```
Start
  │
  ▼
Condition Agent ("Clasificá la intención del usuario")
  │
  ├── "soporte técnico" → Agent Técnico
  ├── "ventas" → Agent Ventas
  └── "general" → Agent General
```

**Cuándo**: El flujo debe bifurcarse según la intención del usuario.
**Nodos clave**: Start → Condition Agent (con scenarios) → Agent/LLM por cada ruta
**Ventaja**: El LLM decide la ruta, no reglas fijas.

---

## Patrón 9: Loop de Refinamiento

```
Start → Agent → Condition (¿respuesta completa?) → Loop ──┐
                                      │                   │
                                      └── End             │
                                        ^                 │
                                        └─────────────────┘
```

**Cuándo**: El agente necesita iterar hasta producir una respuesta de calidad.
**Nodos clave**: Start → Agent/LLM → Condition → Loop (back a Agent)
**Cuidado**: Max Loop Count (default 5) para evitar loops infinitos.

---

## Patrón 10: MCP Tools Externas

```
Start
  │
  ▼
Agent
  │
  ├── GitHub MCP (issues, PRs, repos)
  ├── Slack MCP (mensajes, canales)
  └── PostgreSQL MCP (consultas SQL)
```

**Cuándo**: Necesitás integrar herramientas externas vía MCP (Model Context Protocol).
**Nodos clave**: Agent → MCP Tool (Custom/GitHub/Slack/PostgreSQL)
**Beneficio**: Acceso a APIs sin necesidad de custom tools.

---

## Patrón 11: Resumen de Conversación con Memoria

```
Start → Agent (memory: Conversation Summary Buffer)
         │
         └── Usuario sigue conversando...
              │
              └── LLM resume automáticamente cuando
                  se excede el token limit
```

**Cuándo**: Conversaciones largas que necesitan resumen automático.
**Memory**: Conversation Summary Buffer Memory (maxTokenLimit configurable)
**Alternativa**: Buffer Window Memory si solo querés últimos N mensajes.

---

## Patrón 12: Estado Compartido entre Múltiples Agentes (Sequential + State)

```
Start (State: { report: "", findings: [] })
  │
  ▼
Agent 1 (investiga y actualiza state.findings)
  │
  ▼
Custom JS Function (procesa findings)
  │
  ▼
Agent 2 (genera report con state.report)
  │
  ▼
End (devuelve state completo)
```

**Cuándo**: Múltiples agentes necesitan compartir y modificar estado.
**Nodos clave**: Start (con State schema) → Agent/LLM → Custom Function → Agent/LLM → End
**State ops**: Replace (default), Append, Remove
