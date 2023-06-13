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
import fse from "fs-extra";
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
    __dirname + `/temp/Ryunixjs-master/templates/${template}`,
    async (err) => {
      if (error) {
        extractAndMove(dirname, template);
      }

      await fse.move(
        __dirname + `/temp/Ryunixjs-master/templates/${template}`,
        dirname`/${template}`,
        (err) => {
          if (err) return console.error(err);
          logger.ok("the directory was moved!");
        }
      );
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

const SUPPORTED_TEMPLATES = [
  "ryunix-ts",
  "ryunix-tsx",
  "ryunix-jsx",
  "ryunix-js",
  "ryunix-ryx",
];

const version = {
  command: "get",
  describe: "Get the template",
  handler: async (arg) => {
    let sub_title;
    try {
      if (arg.template && !SUPPORTED_TEMPLATES.includes(arg.template)) {
        sub_title =
          "Supported templates [ryunix-ts|ryunix-tsx|ryunix-js|ryunix-jsx|ryunix-ryx]";
        throw Error("This template is not supported");
      }

      const template = arg.template || "ryunix-ryx";

      const dirname = arg.dirname || "ryunix-project";

      await validateRepoFolder(template);
      await makeDir(__dirname + "/temp");
      await downloadAndExtract(dirname, template);
    } catch (error) {
      if (sub_title) {
        logger.error(error);
      } else {
        logger.error(error, sub_title);
      }
    }
  },
};

const argv = yargs(hideBin(process.argv)).command(version).parse();
