import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsxFactory: 'Ryunix.createElement',
    jsxFragment: 'Ryunix.Fragment',
  },
})
