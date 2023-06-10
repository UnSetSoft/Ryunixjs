#!/usr/bin/env node
import path from "path";
import logger from "terminal-log";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { fileURLToPath } from "url";
import { Octokit } from "@octokit/rest";
import makeDir from "make-dir";
import zip from "extract-zip";
import fs from "fs";
 
import { DownloaderHelper } from "node-downloader-helper";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const validateRepoFolder = async (template) => {
  await new Octokit().repos.getContent({
    owner: "UnSetSoft",
    repo: "Ryunixjs",
    ref: "master",
    path: `templates/${template}/package.json`,
  });
};

const extractAndMove = async (dirname, template) => {
  await zip(
    path.join(__dirname + "/temp", "Ryunixjs-master.zip"),
    { dir: __dirname + "/temp" },
    function (err) {
      logger.error(err);
    }
  );

  await fs.renameSync(
    __dirname + `/temp/Ryunixjs-master/templates/${template}`,
    dirname,
    async (err) => {
      if (error) {
        extractAndMove(dirname, template);
      }
    }
  );

  await fs.rmSync(__dirname + "/temp", {
    recursive: true,
    force: true,
  });

  logger.ok(
    "Everything is ready!",
    `$ cd ${dirname} | yarn install && yarn dev / npm install && npm run dev`
  );
};

const downloadAndExtract = async (dirname, template) => {
  const mainUrl = `https://codeload.github.com/UnSetSoft/Ryunixjs/zip/master`;
  const dl = new DownloaderHelper(mainUrl, __dirname + "/temp");
  dl.on("end", async () => extractAndMove(dirname, template));
  dl.on("error", (err) => logger.error("Download Failed", err));
  await dl.start().catch((err) => logger.error(err));
};

const version = {
  command: "get",
  describe: "Get the template",
  handler: async (arg) => {
    const template = "ryunix-vanilla";
    const dirname = arg.dirname || "ryunix-project";

    try {
      await validateRepoFolder(template);
      await makeDir(__dirname + "/temp");
      await downloadAndExtract(dirname, template);
    } catch (error) {
      logger.error(error);
    }
  },
};

const argv = yargs(hideBin(process.argv)).command(version).parse();
