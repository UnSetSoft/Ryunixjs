# Create Ryunix App: Topologías de plantillas

En lugar de construir generadores boilerplate monolíticos masivos que mutan
cientos de archivos de forma procedural, Ryunix aprovecha directorios snapshot
físicos atómicos.

---

## Índice

- [Create Ryunix App: Topologías de plantillas](#create-ryunix-app-topologías-de-plantillas)
  - [Índice](#índice)
  - [Esqueletos precompilados (`templates/*`)](#esqueletos-precompilados-templates)

---

## Esqueletos precompilados (`templates/*`)

El motor CLI mapea físicamente las elecciones CLI del desarrollador directamente
a carpetas de plantilla explícitas dentro del paquete CRA.

1. **`ryunix-base`**: La aplicación Ryunix mínima viable reducida. Contiene

   configuraciones idénticas de App Router sin configuraciones CSS externas.

2. **`ryunix-tailwind`**: Preconfigurado mapeando estrictamente el pipeline

   `postcss.config.js` en `globals.css` utilizando correctamente la integración
   `@tailwindcss/postcss` de forma nativa.

3. **`ryunix-eslint`**: Importa `eslint.config.mjs` enlazando las convenciones

   estrictas del framework sin fricción.

4. **`ryunix-all`**: La amalgama comprehensiva que fusiona todo de forma nativa.

### Mecanismo de copia arquitectónica

- **`copyRecursiveSync`**: El generador recorre recursivamente la estructura de

  plantilla mapeándola 1:1 sobre el shell objetivo ejecutando asignaciones
  estándar del sistema de archivos internamente.

- **Bypass de Gitignore**: `npm publish` estándar elimina explícitamente

  archivos `.gitignore` de paquetes NPM físicos de forma nativa. Para sortear
  esta restricción, las plantillas Ryunix se envían físicamente conteniendo un
  archivo literalmente llamado `gitignore` exclusivamente. Tras la compilación
  física dentro de `create-app.js`, lo renombra violentamente de vuelta a
  `.gitignore` engañando con éxito al registro NPM.
