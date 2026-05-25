<!-- markdownlint-disable MD033 MD041 MD013 -->

> **Language / Idioma:** [English](./README.md) · [Español](./README.es.md)

<p align="center">
  <img src="https://raw.githubusercontent.com/UnSetSoft/Ryunixjs/canary/assets/logo.png" width="200" height="200" alt="RyunixJS Logo" />
</p>

<h1 align="center">@unsetsoft/cra</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@unsetsoft/cra">
    <img src="https://img.shields.io/npm/v/@unsetsoft/cra.svg?style=flat-square" alt="versión npm" />
  </a>
</p>

## <!-- markdownlint-enable MD013 -->

## 🚀 Create Ryunix App

El andamiaje oficial para aplicaciones RyunixJS. Crea aplicaciones web modernas y de
alto rendimiento con una experiencia interactiva guiada y configuraciones predeterminadas
optimizadas.

## 🛠️ Uso

Puedes iniciar la configuración interactiva ejecutando:

```bash
npx @unsetsoft/cra@latest
```

O indicar el nombre del proyecto directamente:

```bash
npx @unsetsoft/cra@latest my-ryunix-app
```

## ✨ Experiencia interactiva

El CLI te guiará por varias opciones para personalizar el proyecto:

1. **Nombre del proyecto**: directorio de la nueva aplicación.
2. **Canal de release**: elige entre **Latest** (estable) o **Canary**

   (últimas novedades / funciones experimentales).

3. **Tailwind CSS**: inicialización y configuración opcional automática de Tailwind CSS.

4. **ESLint**: reglas de linting preconfiguradas para desarrollo Ryunix.
5. **Integración VS Code**: con `--vscode` escribe `.vscode/extensions.json`
   (Ryunix + ESLint, y Prettier si `--eslint`) y `settings.json` (Emmet,
   asociación de archivos, probe ESLint, anidado opcional de rutas).

## 🚩 Flags de línea de comandos

Para más control, puedes usar estos flags:

| Flag            | Descripción                                                                                    |
| :-------------- | :--------------------------------------------------------------------------------------------- |
| `-v, --version` | Muestra la versión actual del CLI.                                                             |
| `-h, --help`    | Muestra el mensaje de ayuda.                                                                   |
| `--canary`      | Usa el canal Canary para las dependencias Ryunix.                                              |
| `--latest`      | Usa el canal Latest (predeterminado).                                                          |
| `--tailwind`    | Inicializa con configuración de Tailwind CSS.                                                  |
| `--eslint`      | Inicializa con configuración de ESLint.                                                        |
| `--vscode`      | Añade `.vscode/` recomendando extensiones Ryunix + ESLint (instálalas cuando VS Code lo pida). |

## 🏗️ ¿Qué incluye?

Cada proyecto generado con `cra` viene preconfigurado con:

- **Optimización**: sistema de build basado en Webpack con bundles optimizados.
- **Listo para SSR**: bases para Server-Side Rendering.
- **Estructura modular**: organización clara (`app/`, `src/`, `public/`).
- **Configuración**: `ryunix.config.js` listo para usar.

## 📄 Licencia

RyunixJS tiene [licencia MIT](../../LICENSE).
