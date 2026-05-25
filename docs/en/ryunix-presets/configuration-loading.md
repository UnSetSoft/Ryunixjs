# Ryunix Presets: Configuration Architecture

Ryunix heavily restricts direct mutation of its foundational Webpack layer.
Instead, it exposes an explicit validation gateway controlled via
`ryunix.config.js`.

---

## Table of contents

- [Ryunix Presets: Configuration Architecture](#ryunix-presets-configuration-architecture)
  - [Table of contents](#table-of-contents)
  - [1. Discovery (`settingfile.cjs`)](#1-discovery-settingfilecjs)
  - [2. Extraction Pipeline (`config.cjs`)](#2-extraction-pipeline-configcjs)

---

## 1. Discovery (`settingfile.cjs`)

When the CLI boots up, it strictly inspects the `process.cwd()` execution
terminal path.

1. It immediately probes sequentially for `ryunix.config.js` and

   `ryunix.config.cjs`.

2. Utilizing Node's dynamic CommonJS `require()`, it extracts the raw JavaScript

   object payload entirely.

3. If no file is detected naturally, it catches the file-system exception safely

   and quietly provisions an empty `{}` object, assuring the compiler Boot loop
   doesn't catastrophically crash.

---

## 2. Extraction Pipeline (`config.cjs`)

The raw user Configuration is strictly evaluated against Ryunix's architectural
schema map.

### Data Normalization

A dedicated utility function `getConfigValue(path, defaultValue)` evaluates
dot-notation string locators internally (`webpack.output.buildDirectory`).

1. Splits the string into distinct keys safely handling undefined or null tree

   intersections.

2. If the user object structure is lacking the data, it fiercely applies the

   Ryunix Default fallback (e.g. defaulting builds to `.ryunix`).

### Tree Consolidation

Users frequently provide fragmented ESLint or HTML plugin parameters.
`mergeDefaults()` leverages object spreading to seamlessly blend user
`overrides` destructively across the protected `defaults` baseline logic,
maintaining essential framework presets while affording developers specific
configuration injection hooks.

### Legacy Configuration Handlers

As Ryunix evolved from static routes conceptually towards an "App Router"
design, numerous configuration variables (`experimental.ssr`,
`static.seo.title`, `experimental.mdx`) were physically deprecated.

The loader incorporates a rigid `warnDeprecated(path, message)` scanner
internally:

1. Ryunix inspects the imported user configuration exclusively searching for the

   old schema tags.

2. If flagged, the terminal intercepts the sequence specifically injecting a

   bold yellow text (`\x1b[33m`) alert physically informing the developer
   exactly what configuration rule to substitute it with moving onward.

3. Furthermore, internal hooks dynamically mutate `defaultSettings` converting

   legacy values directly into the modernized shape implicitly behind the
   scenes.
