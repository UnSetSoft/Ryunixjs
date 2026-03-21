# RyunixJS Internal Documentation

Welcome to the internal documentation for **RyunixJS**. This repository of technical documents is specifically designed for maintainers, core contributors, and curious developers. It meticulously details the internal architecture, abstraction boundaries, and design decisions powering the framework.

---

## Directory Structure

The internal documentation is strictly divided by the physical packages it describes:

### 1. `packages/core` ([/docs/core](/docs/core))
Details the fundamental logic and algorithmic mechanics of the frontend runtime system.
- **Virtual DOM & Reconciliation**: How Ryunix efficiently updates the UI, creates DOM nodes, and traverses the Fiber tree concurrently.
- **Hooks Internal Engine**: The underlying architecture for state management, memoization, and complex side-effects inherently.
- **Rendering Mechanism**: Client-Side Rendering (CSR), Server-Side stream capabilities, and Hydration bridging natively.
- **State & Priority Queue**: The batching and idle callback prioritization pipelines safely.
- **Advanced Components**: The mechanics behind `Lazy`, `Memo`, `Portal`, and `ForwardRef`.
- **Server Features**: Server boundaries and synchronous module execution logic strictly separated.
- **Error Handling**: Declarative error boundaries gracefully catching asynchronous tree panics.
- **DevTools & Profiler**: In-memory microsecond statistics and developer warning interrogations.

### 2. `packages/ryunix-presets` ([/docs/ryunix-presets](/docs/ryunix-presets))
Details the comprehensive CLI engine and the underlying dual-compiler infrastructure mapping the frontend natively with the backend environments implicitly.
- **CLI & Bootstrapping**: Exploring the `dev`, `build`, and native Node `start` server engines comprehensively.
- **Configuration Loading**: Reliable extraction and normalization of `ryunix.config.js` with legacy warning systems inherently.
- **Routing & SSG Architecture**: The automated AST `AppRouterPlugin` AST builder and legacy SSG generator plugins strictly avoiding manual string routing.
- **API Routing Infrastructure**: Out-of-band isolated SWC compiling and native API Server Hot-Reloading safely.
- **Webpack Loaders**: The Island Architecture logic (`ryunix-rsc-loader.mjs`) and secure backend bindings via Server Actions (`ryunix-server-action-loader.mjs`).
- **File-Based Error Interception**: How `error.ryx` boundaries natively trap segmented crashes globally across development overlays natively.

### 3. `packages/cra` ([/docs/cra](/docs/cra))
Details the project scaffolding gateway ecosystems (`create-ryunix-app`).
- **CLI Engine & Helpers**: The interactive prompt interfaces, Git bypass features, and dynamic NPM registry dependency mappings natively updating versions transparently.
- **Template Topologies**: Foundational boilerplate structures (`ryunix-base`, `ryunix-tailwind`, etc.) and the precise filesystem replicating algorithms reliably.
 
 