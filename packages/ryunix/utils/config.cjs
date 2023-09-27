const fs = require("fs");

let config = {};

if (fs.existsSync("../../../../ryunix.config.js")) {
  config = require("../../../../ryunix.config.js");
}

const defaultSettings = {
  production: config?.production ? config.production : true,
  buildDirectory: config?.buildDirectory ? config.buildDirectory : ".ryunix",
  appDirectory: config?.appDirectory ? config.appDirectory : "src",
  publicDirectory: config?.publicDirectory ? config.publicDirectory : "public",
};

module.exports = defaultSettings;
