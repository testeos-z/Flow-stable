# Factum Agents - Datos y Hechos Objetivos

Esta carpeta contiene agentes del flujo **FACTUM** que se especializan en proporcionar datos objetivos, hechos verificables y evidencia empírica.

## Tipos de Archivos Soportados

### 1. Archivos YAML (.yaml, .yml)

Agentes predefinidos con prompts específicos.

**Formato del nombre:** `{nombre_agente}_core.yaml`

**Ejemplo:** `estadisticas_core.yaml`, `datos_demograficos_core.yaml`

### 2. Archivos XLSX (.xlsx)

Agentes dinámicos generados desde datos tabulares.

**Estructura sugerida:**

-   Tipo de Dato
-   Fuente
-   Fecha
-   Valor/Métrica
-   Confiabilidad
-   Contexto
-   Perfil generado (prompt)

## Carga Automática

El sistema carga automáticamente:

-   ✅ Todos los archivos `.yaml` o `.yml` → Agentes con `flow: 'factum'`
-   ✅ Todos los archivos `.xlsx` → Agentes con `flow: 'factum'`

## Ejemplos de Agentes FACTUM

### Agentes que podrías agregar:

1. **estadisticas_core.yaml** - Especialista en análisis estadístico
2. **datos_demograficos_core.yaml** - Experto en demografía
3. **indicadores_economicos_core.yaml** - Analista de indicadores económicos
4. **datos_ambientales_core.yaml** - Datos sobre medio ambiente
5. **metricas_transporte_core.yaml** - Métricas de movilidad y transporte
6. **estudios_cientificos_core.yaml** - Referencias a estudios científicos
7. **benchmarking_core.yaml** - Comparativas con otras ciudades
8. **censo_datos_core.yaml** - Datos censales
9. **presupuesto_fiscal_core.yaml** - Datos presupuestarios
10. **infraestructura_datos_core.yaml** - Datos de infraestructura

## Estado Actual

-   **Archivos YAML:** 0
-   **Archivos XLSX:** 0
-   **Agentes cargados:** 0

Para verificar: `bun run examples/verify-flows.ts`
