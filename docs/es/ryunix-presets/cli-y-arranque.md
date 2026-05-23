# Ryunix Presets: Arquitectura de CLI y arranque

El paquete `@unsetsoft/ryunix-presets` ofrece un motor CLI altamente opinado que abstrae por completo el cableado boilerplate estándar de Webpack.

Está mapeado físicamente al comando bash genérico `ryunix` mediante la exportación del directorio `"bin"` de `package.json`.

---

## 1. Enrutamiento CLI de nivel superior (`bin/index.mjs`)

Ryunix utiliza `yargs` para analizar argumentos de línea de comandos con seguridad. Expone cinco comandos de ejecución nativos:

1. **`lint`**: Invoca una instancia personalizada de ESLint sobrescribiendo la configuración cruda del desarrollador con el `eslintConfig` por defecto fuertemente opinado incluido en `ryunix-presets`.
2. **`dev`**: Muta la variable de entorno activa `process.env.RYUNIX_MODE = 'development'` y delega la ejecución a `dev.server.mjs`.
3. **`start`**: Muta `process.env.RYUNIX_MODE = 'production'` y provisiona directamente la aplicación node interna `prod.server.mjs`. Valida el directorio `build/static` para garantizar que existe un objetivo compilado.
4. **`build`**: Elimina agresivamente artefactos de build obsoletos `.ryunix/static` y `.ryunix/server` asegurando un estado limpio totalmente reproducible. Dispara el evento de compilación Webpack. Tras el éxito, ejecuta adicionalmente una función de mapeo SSG `Prerender` de forma concurrente.
5. **`customHtml`**: Extrae la estructura baseline interna `index.html` del framework directamente al directorio `public/` del usuario, exponiendo pipelines de personalización explícitos.

---

## 2. Motor de desarrollo (`bin/dev.server.mjs`)

Cuando los desarrolladores invocan `npx ryunix dev`, este runtime arranca la arquitectura de hot-reloading.

- **Limpiezas automáticas de directorios**: Limpia dinámicamente particiones de `cache` obsoletas de Webpack.
- **Emparejamiento estricto de arrays**: Como RyunixJS ejecuta una arquitectura Dual-Compiler (generando bundles Cliente y Servidor de forma concurrente), el script `dev.server.mjs` escanea inteligentemente los arrays exportados en `webpack.config.mjs`, extrae la configuración etiquetada estrictamente con `name === 'client'` y la enlaza exclusivamente a `WebpackDevServer()`.
- **Enlace inteligente de puertos**: Interroga el sistema operativo explícitamente usando red TCP nativa de Node.js (`net.createServer`) sondeando secuencialmente aperturas de puerto disponibles en lugar de colapsar sin gracia cuando `localhost:3000` está obstinadamente bloqueado por otra aplicación Node.

---

## 3. Servidor web de producción nativo (`bin/prod.server.mjs`)

A diferencia de frameworks tradicionales que dictan binarios de dependencia externa (p. ej. `serve`) para previsualizar builds, Ryunix incluye un servidor runtime de producción `<http>` ferozmente optimizado de forma nativa, adaptado explícitamente a su topología de carpetas específica.

- **Buffering dinámico por rangos**: Intercepta de forma nativa peticiones HTTP `Range: bytes=` canalizando streams estáticos pesados (como blobs `.mp4` o volúmenes `.pdf`) de forma progresiva en lugar de agotar memoria del servidor intentando serializar gigabytes de forma idéntica.
- **Capa de caché**: Arranca una configuración LRU embebida (`fileCache: Map`). Retiene estrictamente hasta `50MB` (`MAX_CACHE_SIZE`) de archivos de texto compilados muy accedidos dentro de asignaciones RAM físicas evitando bloquear constantemente operaciones `fs.readFile` de E/S.
- **Motores de compresión al vuelo**: Evalúa agresivamente la especificación HTTP `Accept-Encoding` de la petición cliente. Si el archivo es textual (HTML, JS, CSS, JSON), activa capacidades `zlib` integradas de Node para transpilar estáticamente arrays cacheando pipelines `.gzipped` y `.brotliCompress` (`br`) fuertemente reducidos lado a lado en memoria para siempre.
- **Interceptación de peticiones API**: Inspecciona `req.url`. Si una petición coincide con la firma de payload estático `/_ryunix/action` o apunta explícitamente a un archivo aislado dentro del directorio de compilación `server/api`, abandona los bucles de distribución de archivos estáticos y recorre en su lugar estrictamente los endpoints `.mjs` del lado servidor ejecutando con seguridad y omitiendo implícitamente el bucle fallback de layout de Single Page Application estándar.
