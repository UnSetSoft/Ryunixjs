#! /usr/bin/env node
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
const { server } = require("./serve");
const { compiler } = require("./compiler");
const logger = require("terminal-log");
const serv = {
  command: "server",
  describe: "Run server",
  handler: async (arg) => {
    await server.start();
  },
};

const build = {
  command: "build",
  describe: "Run builder",
  handler: async (arg) => {
    compiler.run((err, stats) => {
      if (err || stats.hasErrors()) {
        // ...
        logger.error(err);
      }

      logger.ok("Deployment completed");

      compiler.close((closeErr) => {
        if (closeErr) {
          // ...
          logger.error(closeErr);
        }
      });
    });
  },
};

yargs(hideBin(process.argv)).command(serv).command(build).parse();