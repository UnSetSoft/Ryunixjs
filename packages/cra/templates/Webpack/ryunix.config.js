/** @type {import('@unsetsoft/ryunix-webpack/config').Setting} */

const RyunixSettings = {
  // used in dev and build mode
  static: {
    favicon: true, // if is false the favicon is not mandatory
    seo: {
      title: 'Ryunix App', // include a default title for the site
      meta: {
        description: 'Web site created using @unsetsoft/cra',
      },
    },
  },
  webpack: {
    production: false, // use 'true' for production
  },
}

export default RyunixSettings
