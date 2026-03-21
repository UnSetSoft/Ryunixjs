# Create Ryunix App: Template Topologies

Instead of building massive monolithic boilerplate generators mutating hundreds of files procedurally, Ryunix leverages atomic physical snapshot directories.

---

## Pre-compiled Skeletons (`templates/*`)

The CLI engine physically maps the developer's CLI choices directly to explicit template folders inside the CRA package.

1. **`ryunix-base`**: The stripped-down minimum viable Ryunix application. Contains identical App Router configurations devoid of external CSS configurations.
2. **`ryunix-tailwind`**: Pre-configured strictly mapping the `postcss.config.js` pipeline into `globals.css` natively utilizing the `@tailwindcss/postcss` integration correctly.
3. **`ryunix-eslint`**: Imports `eslint.config.mjs` bridging the strict framework conventions seamlessly. 
4. **`ryunix-all`**: The comprehensive amalgamation merging everything natively.

### Architectural Copying Mechanism
- **`copyRecursiveSync`**: The generator recursively traverses the template structure mapping it 1:1 onto the target shell executing standard file-system allocations internally.
- **Gitignore Bypass**: Standard `npm publish` explicitly strips `.gitignore` files actively from physical NPM packages natively. To bypass this restriction, Ryunix templates are shipped physically containing a file literally named `gitignore` exclusively. Upon physical compilation inside `create-app.js`, it violently renames it back safely to `.gitignore` successfully tricking the NPM registry.
