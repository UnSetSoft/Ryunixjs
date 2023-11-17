"use strict";
const fs = require("fs");
const path = require("path");
const defaultConfigFile = path.join(
  __dirname,
  "../../../../",
  "ryunix.config.js"
);

const CommonConfigFile = path.join(
  __dirname,
  "../../../../",
  "ryunix.config.cjs"
);

let config = {};

if (fs.existsSync(defaultConfigFile)) {
  config = require("../../../../ryunix.config.js");
  console.log("[info] configuration file was found.");
} else if (fs.existsSync(CommonConfigFile)) {
  config = require("../../../../ryunix.config.cjs");
  console.log("[info] configuration file was found.");
}

const defaultSettings = {
  production: config?.production ? config.production : true,
  buildDirectory: config?.buildDirectory ? config.buildDirectory : ".ryunix",
  appDirectory: config?.appDirectory ? config.appDirectory : "src",
  publicDirectory: config?.publicDirectory ? config.publicDirectory : "public",
  server: {
    port: config?.server?.port ? config?.server?.port : 3000,
    proxy: config?.server?.proxy ? config?.server?.proxy : {},
  },
  static: {
    favicon: config?.static?.favicon ? config.static.favicon : false,
    seo: {
      title: config?.static?.seo?.title
        ? config.static.seo.title
        : "Ryunix App",
      meta: config?.static?.seo?.meta
        ? config.static.seo.meta
        : {
            description: "Web site created using @unsetsoft/cra",
          },
    },
  },
  webpack: {
    target: config?.webpack?.target ? config.webpack.target : "web",
    resolve: {
      alias: config?.webpack?.resolve?.alias
        ? config.webpack.resolve.alias
        : {},
      fallback: config?.webpack?.resolve?.fallback
        ? config.webpack.resolve.fallback
        : {},
    },
  },
};

module.exports = defaultSettings;
