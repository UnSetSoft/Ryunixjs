#! /usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { StartServer } from "./serve.mjs";
import { compiler } from "./compiler.mjs";
const serv = {
  command: "server",
  describe: "Run server",
  handler: async (arg) => {
    const open = Boolean(arg.browser) || false;
    const settings = {
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
