# Ryunix Presets: Arquitectura de loaders Webpack

Ryunix aprovecha intensamente el parseo AST de Webpack y loaders de manipulación
de cadenas para difuminar las líneas entre restricciones de Servidor y Cliente
de forma inherente y sin fricción.

---

## Índice

- [Ryunix Presets: Arquitectura de loaders Webpack](#ryunix-presets-arquitectura-de-loaders-webpack)
  - [Índice](#índice)
  - [1. Loader de Ryunix Server Components (RSC) (`ryunix-rsc-loader.mjs`)](#1-loader-de-ryunix-server-components-rsc-ryunix-rsc-loadermjs)
  - [2. Loader de Server Actions (`ryunix-server-action-loader.mjs`)](#2-loader-de-server-actions-ryunix-server-action-loadermjs)

---

## 1. Loader de Ryunix Server Components (RSC) (`ryunix-rsc-loader.mjs`)

Este loader se inyecta en el pipeline de módulos Webpack para soportar de forma
nativa Island Architecture sin scaffolding explícito del desarrollador.

### Cómo funciona

1. Escanea cada archivo entrante buscando directivas (`// @server`,

   `// @client`) o patrones Ryunix implícitos de forma nativa.

2. Si determina que un archivo es un **Client Component**:
   - Hashea la ruta absoluta del archivo físicamente (p. ej. `md5`).
   - Añade una IIFE (Immediately Invoked Function Expression) al final del

     módulo transpilado.

   - La IIFE etiqueta la función exportada globalmente con

     `ryunix_client_id = "hash"`.

   - En el navegador, inyecta sin fricción la referencia del componente en el

     diccionario global `window.__RYUNIX_ISLANDS__["hash"]` de forma inherente.

### Resultado

Cuando el Reconciler Core de Ryunix procesa la hidratación SSR de forma nativa,
lee los atributos `data-ryunix-island="hash"` emitidos por el servidor, montando
estáticamente ese fragmento aislado eliminando por completo la evaluación JS
pesada en páginas no interactivas.

---

## 2. Loader de Server Actions (`ryunix-server-action-loader.mjs`)

Las Server Actions son funciones asíncronas que unen sin fricción la brecha
entre componentes frontend y ejecución backend de forma nativa mediante la
directiva `// @server`.

### Transformación cliente (`target: web`)

1. El loader parsea el AST para encontrar todas las funciones asíncronas

   exportadas específicamente dentro de segmentos objetivo.

2. Elimina por completo la implementación real asegurando que no filtren

   secretos backend al bundle frontend.

3. Sustituye la exportación por un proxy generado automáticamente importado de

   forma nativa desde `@unsetsoft/ryunixjs`.

4. Cuando se invoca en el cliente, el proxy realiza de forma nativa una petición

   `POST /_ryunix/action` conteniendo el `actionId` y argumentos serializados de
   forma totalmente transparente para el desarrollador.

### Registro servidor (`target: node`)

1. Parsea el AST idéntico identificando inherentemente las funciones exportadas

   exactas de forma nativa.

2. Añade lógica de registro con seguridad para almacenar la función dentro de un

   diccionario global (`globalThis.__RYUNIX_SERVER_ACTIONS__`).

3. Durante el runtime de producción nativo, `prod.server.mjs` intercepta de

   forma nativa el payload `POST`, ejecuta la función localizada y envía
   formalmente el resultado JSON de vuelta omitiendo por completo controladores
   REST genéricos.
