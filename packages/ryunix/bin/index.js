#! /usr/bin/env node
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
const { server } = require("./serve");
const serv = {
  command: "server",
  describe: "Run server",
  handler: async (arg) => {
    await server.start();
  },
};
yargs(hideBin(process.argv)).command(serv).parse();
