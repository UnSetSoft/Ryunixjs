import { spinner, outro } from "@clack/prompts";
import fs from "fs";

import colors from "picocolors";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";

import cmd from "command-exists-promise";

const Vscode = async () => {
  return await cmd("code")
    .then((exists) => {
      if (exists) {
        // The command exists
        return true;
      } else {
        // The command doesn't exist
        return false;
      }
    })
    .catch((err) => {
      // Should never happen but better handle it just in case
      return false;
    });
};

const hasVscode = Vscode();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templateFolder = path.join(__dirname, "..", "..", "templates");
const dependencies = [];
function getPackageManager() {
  const agent = process.env.npm_config_user_agent;

  if (!agent) {
    const parent = process.env._;

    if (!parent) {
      return "npm";
    }

    if (parent.endsWith("pnpx") || parent.endsWith("pnpm")) return "pnpm";
    if (parent.endsWith("bunx") || parent.endsWith("bun")) return "bun";
    if (parent.endsWith("yarn")) return "yarn";

    return "npm";
  }

  const [program] = agent.split("/");

  if (program === "yarn") return "yarn";
  if (program === "pnpm") return "pnpm";
  if (program === "bun") return "bun";

  return "npm";
}

const manager = getPackageManager();
const s = spinner();
const Init = async (
  name,
  template,
  projectAddons,
  projectVersion,
  addAddons
) => {
  if (!template)
    return console.log(
      colors.bold(colors.red("[Internal Error]")),
      colors.italic(colors.red("The template is not defined"))
    );
  try {
    if (fs.existsSync(template) || fs.existsSync(name)) {
      console.log(
        colors.bold(colors.red("[Error]")),
        colors.italic(
          colors.red(
            "There is a folder with the same name in this path, so no action can be taken."
          )
        )
      );

      return process.exit(0);
    }

    s.start(colors.white("Copying the template and Configuring the name"));
    await fs.cp(
      `${templateFolder}/${template}`,
      `./${name}`,
      { recursive: true },
      async (err) => {
        if (err) {
          s.stop();
          return console.log(
            colors.bold(colors.red("[Internal Error]")),
            colors.italic(colors.red(err.message))
          );
        }

        // ...

        s.stop(
          colors.green(
            "The template was successfully copied and now has a new name..."
          )
        );
        if (addAddons !== "no") {
          await cmd("code")
            .then(async (exists) => {
              if (exists && projectAddons.includes("unsetsoft.ryunixjs")) {
                // The command exists
                await InstallVsocodeAddon();
              } else {
                // The command doesn't exist
                return console.log(
                  colors.bold(colors.red("[Error]")),
                  colors.italic(colors.red("Vscode is not installed"))
                );
              }
            })
            .catch((err) => {
              // Should never happen but better handle it just in case
              return false;
            });
          if (projectVersion === "nightly") {
            dependencies.push(`@unsetsoft/ryunixjs@${projectVersion}`);
            dependencies.push(`@unsetsoft/ryunix-webpack@${projectVersion}`);
            
            if (template === "ryunix-jsx-api") {
              dependencies.push("express");
              dependencies.push("cors");
              dependencies.push("nodemon");
            }
            await Install(name, dependencies);
          } else {
            dependencies.push(`@unsetsoft/ryunixjs@${projectVersion}`);
            dependencies.push(`@unsetsoft/ryunix-webpack@${projectVersion}`);
            if (template === "ryunix-jsx-api") {
              dependencies.push("express");
              dependencies.push("cors");
              dependencies.push("nodemon");
            }
            await Install(name, dependencies);
          }
        } else {
          if (projectVersion === "nightly") {
            dependencies.push(`@unsetsoft/ryunixjs@${projectVersion}`);
            dependencies.push(`@unsetsoft/ryunix-webpack@${projectVersion}`);
            if (template === "ryunix-jsx-api") {
              dependencies.push("express");
              dependencies.push("cors");
              dependencies.push("nodemon");
            }
            await Install(name, dependencies);
          } else {
            dependencies.push(`@unsetsoft/ryunixjs@${projectVersion}`);
            dependencies.push(`@unsetsoft/ryunix-webpack@${projectVersion}`);
            if (template === "ryunix-jsx-api") {
              dependencies.push("express");
              dependencies.push("cors");
              dependencies.push("nodemon");
            }
            await Install(name, dependencies);
          }
        }
      }
    );
  } catch (error) {
    s.stop();
    console.log(
      colors.bold(colors.red("[Internal Error]")),
      colors.italic(colors.red(error.message))
    );
  }
};

const InstallVsocodeAddon = async () => {
  s.start(colors.white("Installing addon, this may take a few minutes"));
  return await new Promise((resolve, reject) => {
    exec(
      "code --ms-enable-electron-run-as-node --install-extension unsetsoft.ryunixjs --force",
      {
        stdio: "inherit",
      },
      (error) => {
        if (error) {
          reject({
            err: error,
          });
          return console.log(
            colors.bold(colors.red("[Internal Error]")),
            colors.italic(colors.red(error.message))
          );
        }
        s.stop(colors.green("The addon were installed correctly!"));

        resolve();
      }
    );
  });
};

const Install = async (name, addonsArr) => {
  const dep = addonsArr.join(" ");
  let installMethod;
  if (manager === "npm") {
    installMethod = "npm i";
  } else {
    installMethod = `${manager} add`;
  }
  s.start(colors.white("Installing packages, this may take a few minutes"));
  return await new Promise((resolve, reject) => {
    exec(
      `${installMethod} ${dep}`,
      {
        cwd: path.join(name),
        stdio: "inherit",
      },
      (error) => {
        if (error) {
          reject({
            err: error,
          });
          console.log(
            colors.bold(colors.red("[Internal Error]")),
            colors.italic(colors.red(error.message))
          );

          return process.exit(0);
        }
        s.stop(colors.green("The dependencies were installed correctly!"));

        resolve();
        const command = `${manager} ${
          manager === "npm" || manager === "bun" ? "run dev" : "dev"
        }`;
        const message = `Everything is ready,${colors.italic(
          `cd ${name}`
        )} and ${colors.italic(command)}`;

        outro(colors.bold(colors.italic(colors.magenta(message))));
      }
    );
  });
};

export { Init, Install };
