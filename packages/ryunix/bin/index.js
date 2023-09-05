#! /usr/bin/env node
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
const { StartServer } = require("./serve");
const { compiler } = require("./compiler");
const logger = require("terminal-log");
const serv = {
  command: "server",
  describe: "Run server",
  handler: async (arg) => {
    const port = arg.port || 3000;
    const open = Boolean(arg.browser) || false;
    const settings = {
      port: port,
      open,
    };

    StartServer(settings);
  },
};

const build = {
  command: "build",
  describe: "Run builder",
  handler: async (arg) => {
    compiler.run((err, stats) => {
      if (err || stats.hasErrors()) {
        // ...
        console.error(err);
      }

      console.log("Deployment completed");

      compiler.close((closeErr) => {
        if (closeErr) {
          // ...
          console.error(closeErr);
        }
      });
    });
  },
};

yargs(hideBin(process.argv)).command(serv).command(build).parse();
