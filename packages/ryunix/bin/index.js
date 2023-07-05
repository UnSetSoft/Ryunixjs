#! /usr/bin/env node
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
const runServer = require("./serve");
const serv = {
  command: "server",
  describe: "Run server",
  handler: async (arg) => {
    runServer();
  },
};
yargs(hideBin(process.argv)).command(serv).parse();
