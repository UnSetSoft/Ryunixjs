module.exports = {
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  // used in dev and build mode
  static: {
    favicon: true, // if is false the favicon is not mandatory
    seo: {
      title: 'Ryunix App',
      meta: {
        description: 'Web site created using @unsetsoft/cra',
      },
    },
  },
}
