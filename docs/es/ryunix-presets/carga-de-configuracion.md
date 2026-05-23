# Ryunix Presets: Arquitectura de configuración

Ryunix restringe fuertemente la mutación directa de su capa Webpack fundamental.
En su lugar, expone una puerta de validación explícita controlada vía
`ryunix.config.js`.

---

## Índice

- [Ryunix Presets: Arquitectura de configuración](#ryunix-presets-arquitectura-de-configuración)
  - [Índice](#índice)
  - [1. Descubrimiento (`settingfile.cjs`)](#1-descubrimiento-settingfilecjs)
  - [2. Pipeline de extracción (`config.cjs`)](#2-pipeline-de-extracción-configcjs)

---

## 1. Descubrimiento (`settingfile.cjs`)

Cuando arranca el CLI, inspecciona estrictamente la ruta de terminal de
ejecución `process.cwd()`.

1. Sondea de inmediato de forma secuencial `ryunix.config.js` y

   `ryunix.config.cjs`.

2. Utilizando `require()` dinámico CommonJS de Node, extrae por completo el

   payload del objeto JavaScript en bruto.

3. Si no se detecta archivo de forma natural, captura la excepción del sistema

   de archivos con seguridad y provisiona silenciosamente un objeto `{}` vacío,
   asegurando que el bucle de arranque del compilador no colapse
   catastróficamente.

---

## 2. Pipeline de extracción (`config.cjs`)

La configuración cruda del usuario se evalúa estrictamente contra el mapa de
esquema arquitectónico de Ryunix.

### Normalización de datos

Una función de utilidad dedicada `getConfigValue(path, defaultValue)` evalúa
localizadores de cadena en notación punto internamente
(`webpack.output.buildDirectory`).

1. Divide la cadena en claves distintas manejando con seguridad intersecciones

   de árbol undefined o null.

2. Si la estructura del objeto usuario carece del dato, aplica ferozmente el

   fallback por defecto de Ryunix (p. ej. builds por defecto a `.ryunix`).

### Consolidación del árbol

Los usuarios proporcionan frecuentemente parámetros fragmentados de ESLint o
plugins HTML. `mergeDefaults()` aprovecha spreading de objetos para mezclar sin
fricción `overrides` del usuario de forma destructiva sobre la lógica baseline
protegida `defaults`, manteniendo presets esenciales del framework mientras
ofrece ganchos de inyección de configuración específicos a los desarrolladores.

### Manejadores de configuración legacy

A medida que Ryunix evolucionó de rutas estáticas conceptualmente hacia un
diseño «App Router», numerosas variables de configuración (`experimental.ssr`,
`static.seo.title`, `experimental.mdx`) quedaron físicamente deprecadas.

El cargador incorpora un escáner rígido `warnDeprecated(path, message)`
internamente:

1. Ryunix inspecciona la configuración importada del usuario buscando

   exclusivamente las etiquetas del esquema antiguo.

2. Si se marca, la terminal intercepta la secuencia inyectando específicamente

   una alerta en texto amarillo en negrita (`\x1b[33m`) informando físicamente
   al desarrollador exactamente qué regla de configuración sustituir de ahora en
   adelante.

3. Además, hooks internos mutan dinámicamente `defaultSettings` convirtiendo

   valores legacy directamente en la forma modernizada implícitamente entre
   bastidores.
