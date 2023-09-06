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
import { exec } from "child_process";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getPackageManager() {
  const agent = process.env.npm_config_user_agent;

  if (!agent) {
    const parent = process.env._;

    if (!parent) {
      return "npm";
    }

    if (parent.endsWith("pnpx") || parent.endsWith("pnpm")) return "pnpm";
    if (parent.endsWith("yarn")) return "yarn";

    return "npm";
  }

  const [program] = agent.split("/");

  if (program === "yarn") return "yarn";
  if (program === "pnpm") return "pnpm";

  return "npm";
}

const manager = getPackageManager();

const templateFolder = "cra-templates";

const validateRepoFolder = async (template, branch) => {
  await new Octokit().repos.getContent({
    owner: "UnSetSoft",
    repo: "Ryunixjs",
    ref: branch,
    path: `${templateFolder}/${template}/package.json`,
  });
};

const Install = async (root, branch) => {
  const dep =
    branch === "dev"
      ? "@unsetsoft/ryunixjs@nightly"
      : "@unsetsoft/ryunixjs@latest";
  return await new Promise((resolve, reject) => {
    exec(
      `npm i ${dep}`,
      {
        cwd: path.join(root),
        stdio: "inherit",
      },
      (error) => {
        if (error) {
          reject({
            err: error,
          });
          return error;
        }
        resolve();
      }
    );
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

      logger.ok("The directory was moved!", path.join(template));

      if (fs.existsSync(dirname)) {
        logger.info(
          `Error: The folder "${template}" could not be renamed, as the folder "${dirname}" exists and may have content inside.`,
          `${path.join(template)}`
        );
      } else {
        await fs.renameSync(`${template}`, `${dirname}`, async (error) => {
          if (error) {
            return logger.error(err);
          }
        });
      }

      await fs.rmSync(
        __dirname + "/temp",
        {
          recursive: true,
          force: true,
        },
        (err) => {
          if (err) {
            return logger.error(err);
          }

          logger.ok("Temporary folder deleted");
        }
      );

      logger.ok(
        "Installing packages, this may take a few minutes",
        `Using the ${manager} manager`
      );

      await Install(dirname, branch)
        .then(() => {
          if (branch !== "master") {
            logger.info(
              "Info",
              `You downloaded from the "${branch}" branch, not from the "master" branch, which means that the files are probably not stable.`
            );
            logger.ok(
              "Everything is ready!",
              `$ cd ${dirname} | yarn dev / npm run dev`
            );
          } else {
            logger.ok(
              "Everything is ready!",
              `$ cd ${dirname} | yarn dev / npm run dev`
            );
          }
        })
        .catch((err) => {
          logger.error("Error installing required packages", err);
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

const SUPPORTED_TEMPLATES = ["ryunix-jsx", "ryunix-js", "ryunix-ryx"];
const SUPPORTED_BRANCHS = ["historical/0.2.24"];

const version = {
  command: "get",
  describe: "Get the template",
  handler: async (arg) => {
    let sub_title;

    if (manager === "pnpm") {
      return logger.error(
        "Manager not supported",
        "pnpm is not supported, use 'npx' instead."
      );
    } else if (manager === "yarn") {
      return logger.error(
        "Manager not supported",
        "yarn is not supported, use 'npx' instead."
      );
    }

    try {
      if (arg.template && !SUPPORTED_TEMPLATES.includes(arg.template)) {
        sub_title = "Supported templates [ryunix-js|ryunix-jsx|ryunix-ryx]";
        throw Error("This template is not supported");
      }

      if (arg.branch && !SUPPORTED_BRANCHS.includes(arg.branch)) {
        throw Error("This branch is not supported");
      }

      const branch = arg.branch || "historical/0.2.24";

      const template = arg.template || "ryunix-ryx";

      const dirname = arg.dirname || "ryunix-project";

      await validateRepoFolder(template, branch);
      await makeDir(__dirname + "/temp");
      await downloadAndExtract(dirname, template, branch);
    } catch (error) {
      if (!sub_title) {
        logger.error(error);
      } else {
        logger.error(error, sub_title);
      }
    }
  },
};

const argv = yargs(hideBin(process.argv)).command(version).parse();
