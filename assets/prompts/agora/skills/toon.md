---
title: TOON Format Rules
description: Reglas completas para formatear respuestas en formato TOON
version: 1.5
---

# TOON Format Rules

## Data Model

TOON modela datos de la misma manera que JSON:

-   **Primitivos**: strings, números, booleanos y `null`
-   **Objetos**: mapeos de claves string a valores
-   **Arrays**: secuencias ordenadas de valores

### Root Forms

Un documento TOON puede representar diferentes formas raíz:

-   **Objeto raíz** (más común): Campos aparecen en profundidad 0 sin clave padre
-   **Array raíz**: Comienza con `[N]:` o `[N]{fields}:` en profundidad 0
-   **Primitivo raíz**: Un solo valor primitivo (string, número, booleano o null)

## Objects

### Simple Objects

Objetos con valores primitivos usan sintaxis `key: value`, con un campo por línea:

```yaml
id: 123
name: Ada
active: true
```

La indentación reemplaza las llaves. Un espacio sigue a los dos puntos.

### Nested Objects

Objetos anidados agregan un nivel de indentación (por defecto: 2 espacios):

```yaml
user:
    id: 123
    name: Ada
```

Cuando una clave termina con `:` y no tiene valor en la misma línea, abre un objeto anidado. Todas las líneas en el siguiente nivel de indentación pertenecen a ese objeto.

### Empty Objects

Un objeto vacío en la raíz produce un documento vacío (sin líneas). Un objeto anidado vacío es solo `key:`, sin hijos.

## Arrays

TOON detecta la estructura del array y elige la representación más eficiente. Los arrays siempre declaran su longitud en corchetes: `[N]`.

### Primitive Arrays (Inline)

Arrays de primitivos (strings, números, booleanos, null) se renderizan inline:

```yaml
tags[3]: admin,ops,dev
```

El delimitador (coma por defecto) separa valores. Strings que contienen el delimitador activo deben estar entre comillas.

### Arrays of Objects (Tabular)

Cuando todos los objetos en un array comparten el mismo conjunto de claves con valores primitivos, TOON usa formato tabular:

```yaml
items[2]{sku,qty,price}: A1,2,9.99
    B2,1,14.5
```

El encabezado `items[2]{sku,qty,price}:` declara:

-   **Longitud del array**: `[2]` significa 2 filas
-   **Nombres de campos**: `{sku,qty,price}` define las columnas
-   **Delimitador activo**: coma (por defecto)

Cada fila contiene valores en el mismo orden que la lista de campos. Los valores se codifican como primitivos (strings, números, booleanos, null) y se separan por el delimitador.

**Requisitos del formato tabular:**

-   Conjuntos de campos idénticos en todos los objetos (mismas claves, el orden por objeto puede variar)
-   Solo valores primitivos (sin arrays/objetos anidados)

### Mixed and Non-Uniform Arrays

Arrays que no cumplen los requisitos tabulares usan formato de lista con marcadores de guión:

```yaml
items[3]:
    - 1
    - a: 1
    - text
```

Cada elemento comienza con `- ` en un nivel de indentación más profundo que el encabezado del array padre.

### Objects as List Items

Cuando un elemento del array es un objeto, aparece como un elemento de lista:

```yaml
items[2]:
    - id: 1
      name: First
    - id: 2
      name: Second
      extra: true
```

### Arrays of Arrays

Cuando tienes arrays que contienen arrays primitivos internos:

```yaml
pairs[2]:
    - [2]: 1,2
    - [2]: 3,4
```

Cada array interno obtiene su propio encabezado en la línea del elemento de lista.

### Empty Arrays

Arrays vacíos tienen representaciones especiales:

```yaml
items[0]:
```

El encabezado declara longitud cero, sin elementos siguientes.

## Array Headers

### Header Syntax

Los encabezados de array siguen este patrón:

```
key[N<delimiter?>]<{fields}>:
```

Donde:

-   **N** es la longitud entera no negativa
-   **delimiter** (opcional) declara explícitamente el delimitador activo:
    -   Ausente → coma (`,`)
    -   `\t` (carácter tab) → delimitador tab
    -   `|` → delimitador pipe
-   **fields** (opcional) para arrays tabulares: `{field1,field2,field3}`

### Delimiter Options

TOON soporta tres delimitadores: coma (por defecto), tab y pipe. El delimitador está en el ámbito del encabezado del array que lo declara.

**Comma (default):**

```yaml
items[2]{sku,name,qty,price}: A1,Widget,2,9.99
    B2,Gadget,1,14.5
```

**Tab:**

```yaml
items[2	]{sku	name	qty	price}: A1	Widget	2	9.99
    B2	Gadget	1	14.5
```

**Pipe:**

```yaml
items[2|]{sku|name|qty|price}: A1|Widget|2|9.99
    B2|Gadget|1|14.5
```

## Key Folding (Optional)

Key folding es una característica opcional del encoder (desde spec v1.5) que colapsa cadenas de objetos de una sola clave en rutas punteadas, reduciendo tokens para datos profundamente anidados.

### Basic Folding

Anidación estándar:

```yaml
data:
    metadata:
        items[2]: a,b
```

Con key folding (`keyFolding: 'safe'`):

```yaml
data.metadata.items[2]: a,b
```

Los tres objetos anidados se colapsan en una sola clave punteada `data.metadata.items`.

### When Folding Applies

Una cadena de objetos es plegable cuando:

-   Cada objeto en la cadena tiene exactamente una clave (que lleva al siguiente objeto o a un valor hoja)
-   El valor hoja es un primitivo, array u objeto vacío
-   Todos los segmentos son segmentos de identificador válidos (solo letras, dígitos, guiones bajos; sin puntos dentro de los segmentos)
-   La clave plegada resultante no colisiona con claves existentes

## Quoting and Types

### When Strings Need Quotes

TOON cita strings **solo cuando es necesario** para maximizar la eficiencia de tokens. Un string debe estar entre comillas si:

-   Está vacío (`""`)
-   Tiene espacios en blanco iniciales o finales
-   Es igual a `true`, `false`, o `null` (sensible a mayúsculas)
-   Parece un número (ej., `"42"`, `"-3.14"`, `"1e-6"`, o `"05"` con ceros iniciales)
-   Contiene caracteres especiales: dos puntos (`:`), comilla (`"`), barra invertida (`\`), corchetes, llaves, o caracteres de control (nueva línea, tab, retorno de carro)
-   Contiene el delimitador relevante (el delimitador activo dentro de un ámbito de array, o el delimitador del documento en otro lugar)
-   Es igual a `"-"` o comienza con `"-"` seguido de cualquier carácter

De lo contrario, los strings pueden estar sin comillas. Unicode, emoji y strings con espacios internos (no iniciales/finales) son seguros sin comillas:

```yaml
message: Hello 世界 👋
note: This has inner spaces
```

### Escape Sequences

En strings y claves entre comillas, solo cinco secuencias de escape son válidas:

| Carácter                 | Escape |
| ------------------------ | ------ |
| Backslash (`\`)          | `\\`   |
| Double quote (`"`)       | `\"`   |
| Newline (U+000A)         | `\n`   |
| Carriage return (U+000D) | `\r`   |
| Tab (U+0009)             | `\t`   |

Todas las demás secuencias de escape (ej., `\x`, `\u`) son inválidas y causarán un error en modo estricto.

### Type Conversions

Los números se emiten en forma decimal canónica (sin notación exponencial, sin ceros finales). Los tipos no JSON se normalizan antes de la codificación:

| Input                              | Output                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------- |
| Número finito                      | Decimal canónico (ej., `1e6` → `1000000`, `1.5000` → `1.5`, `-0` → `0`) |
| `NaN`, `Infinity`, `-Infinity`     | `null`                                                                  |
| `BigInt` (dentro del rango seguro) | Number                                                                  |
| `BigInt` (fuera de rango)          | String decimal entre comillas (ej., `"9007199254740993"`)               |
| `Date`                             | String ISO entre comillas (ej., `"2025-01-01T00:00:00.000Z"`)           |
| `undefined`, `function`, `symbol`  | `null`                                                                  |

Los decodificadores aceptan tanto formas decimales como exponenciales en la entrada (ej., `42`, `-3.14`, `1e-6`), y tratan tokens con ceros iniciales prohibidos (ej., `"05"`) como strings, no números.

## Critical Formatting Rules

### DO NOT USE

❌ **NO uses:**

-   Markdown (no `#`, no ` ``` `, no bloques de código)
-   Emojis (no 🎯, 📍, 🚨, etc.)
-   Texto explicativo antes del TOON
-   YAML puro (arrays SIN `[N]`)
-   Líneas en blanco dentro de arrays

### DO USE

✅ **SÍ usa:**

-   Arrays de strings: `campo[N]: "valor1","valor2"`
-   Arrays de objetos: `campo[N]:` seguido de elementos con `-`
-   Formato tabular cuando todos los objetos comparten las mismas claves primitivas
-   Comienza DIRECTAMENTE con la primera declaración de campo TOON

### Example Structure

**Correcto:**

```yaml
response[1]:
    - id: 123
      name: Example
      tags[2]: admin,user
```

**Incorrecto:**

```yaml
# Esto es una respuesta TOON
response:
    - id: 123
      name: Example
      tags: [admin, user] # ❌ No uses formato YAML estándar
```

## Validation Checklist

Antes de generar TOON, verifica:

-   [ ] Todos los arrays declaran su longitud `[N]`
-   [ ] Arrays de primitivos usan formato inline: `campo[N]: val1,val2`
-   [ ] Arrays de objetos con claves uniformes usan formato tabular: `campo[N]{key1,key2}:`
-   [ ] Arrays mixtos usan formato de lista con `-`
-   [ ] No hay markdown, emojis o texto explicativo
-   [ ] Strings solo están entre comillas cuando es necesario
-   [ ] La indentación es consistente (2 espacios por nivel)
-   [ ] El documento comienza directamente con la primera declaración de campo
