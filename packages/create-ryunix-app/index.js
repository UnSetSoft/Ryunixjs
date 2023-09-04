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
import spawn from "cross-spawn";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const __isUsingYarn = () =>
  (process.env.npm_config_user_agent || "").indexOf("yarn") === 0;

const templateFolder = "cra-templates";

const dependencies = ["@unsetsoft/ryunixjs"];

const validateRepoFolder = async (template, branch) => {
  await new Octokit().repos.getContent({
    owner: "UnSetSoft",
    repo: "Ryunixjs",
    ref: branch,
    path: `${templateFolder}/${template}/package.json`,
  });
};

const Install = (root) => {
  return new Promise((resolve, reject) => {
    let command;
    let args;
    if (__isUsingYarn()) {
      command = "yarnpkg";
      args = ["add", "--exact"];
      [].push.apply(args, dependencies);

      args.push("--cwd");
      args.push(root);
    } else {
      command = "npm";
      args = [
        "install",
        "--no-audit",
        "--save",
        "--save-exact",
        "--loglevel",
        "error",
      ].concat(dependencies);

      args.push(root);
    }

    const child = spawn(command, args, { stdio: "inherit" });
    child.on("close", (code) => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(" ")}`,
        });
        return;
      }
      resolve();
    });
  });
};

const extractAndMove = async (dirname, template, branch) => {
  await zip(
    path.join(__dirname + "/temp", `Ryunixjs-${branch}.zip`),
    { dir: __dirname + "/temp" },
    function (err) {
      logger.error(err);
    }
  );

  await fse.move(
    __dirname + `/temp/Ryunixjs-${branch}/${templateFolder}/${template}`,
    `${template}`,
    async (err) => {
      if (err) return logger.error(err);

      logger.ok("the directory was moved!");

      await fs.renameSync(`${template}`, `${dirname}`, async (error) => {
        if (error) {
          return logger.error(err);
        }
      });

      await fs.rmSync(__dirname + "/temp", {
        recursive: true,
        force: true,
      });

      await Install(dirname)
        .then(() => {
          if (branch !== "master") {
            logger.ok(
              "Everything is ready!",
              ```
              Info: You downloaded from the "${branch}" branch, not from the "master" branch, which means that the files are probably not stable.

              $ cd ${dirname} | yarn dev / npm run dev
              ```
            );
          } else {
            logger.ok(
              "Everything is ready!",
              `$ cd ${dirname} | yarn dev / npm run dev`
            );
          }
        })
        .catch((err) => {
          logger.error("Error", err.message);
        });
    }
  );
};

const downloadAndExtract = async (dirname, template, branch) => {
  const mainUrl = `https://codeload.github.com/UnSetSoft/Ryunixjs/zip/${branch}`;
  const dl = new DownloaderHelper(mainUrl, __dirname + "/temp");
  dl.on("end", async () => extractAndMove(dirname, template, branch));
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

      const branch = arg.branch || "master";

      await validateRepoFolder(template, branch);
      await makeDir(__dirname + "/temp");
      await downloadAndExtract(dirname, template, branch);
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
