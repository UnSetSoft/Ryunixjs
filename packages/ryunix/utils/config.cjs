"use strict";
const fs = require("fs");
const path = require("path");
const configFile = path.join(__dirname, "../../../../", "ryunix.config.js");

let config = {};

if (fs.existsSync(configFile)) {
  config = require("../../../../ryunix.config.js");
  console.log("[info] configuration file was found.");
}

const defaultSettings = {
  production: config?.production ? config.production : true,
  buildDirectory: config?.buildDirectory ? config.buildDirectory : ".ryunix",
  appDirectory: config?.appDirectory ? config.appDirectory : "src",
  publicDirectory: config?.publicDirectory ? config.publicDirectory : "public",
};

module.exports = defaultSettings;
