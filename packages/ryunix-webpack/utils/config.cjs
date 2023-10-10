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
};

module.exports = defaultSettings;
