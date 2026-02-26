/** @type {import('@unsetsoft/ryunix-webpack/config').Setting} */

const RyunixSettings = {
  // used in dev and build mode
  static: {
    favicon: true, // if is false the favicon is not mandatory
  },
  webpack: {
    production: false, // use 'true' for production
  },
}

export default RyunixSettings
