const ryunixPlugin = () => {
  const jsxPlugin = {
    name: 'vite:ryunix-jsx',
    config() {
      return {
        esbuild: {
          jsxFactory: 'Ryunix.createElement',
          jsxFragment: 'Ryunix.Fragment',
        },
      }
    },
  }

  return [jsxPlugin]
}

export default ryunixPlugin
export { ryunixPlugin as ryunixVite }
