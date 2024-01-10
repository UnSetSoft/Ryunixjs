module.exports = {
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
  webpack: {
    mode: true, // use 'false' for dev mode
  },
}
