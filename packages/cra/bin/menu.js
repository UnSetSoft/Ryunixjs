import { text, select, group, cancel, multiselect } from "@clack/prompts";
import colors from "picocolors";

 
const MENU = async () =>
  await group(
    {
      projectName: () =>
        text({
          message: colors.cyan("Project Name"),
          placeholder: "ryunix-project",
          validate(value) {
            if (value.length === 0) return `Name is required!`;
          },
        }),
      projectTemplate: () =>
        select({
          message: colors.cyan("Choose your template"),
          options: [
            { value: "ryunix-ryx", label: "ryx" },
            { value: "ryunix-js", label: "js" },
            { value: "ryunix-jsx", label: "jsx" },
            { value: "ryunix-jsx-api", label: "jsx (FS)" },
          ],
        }),
      projectVersion: () =>
        select({
          message:
            colors.cyan("Which version do you want to use?") +
            "  Please note that, the nightly version may not work.",
          options: [
            { value: "latest", label: colors.green("Latest") },
            { value: "nightly", label: colors.red("Nightly") },
          ],
        }),
      installManager: () =>
        select({
          message:
            colors.cyan("Which manager do you want to use?") +
            " Remember that it must be installed to be used.",
          options: [
            { value: "npm", label: "npm" },
            { value: "yarn", label: "yarn" },
          ],
        }),
      addAddons: () =>
        select({
          message: colors.cyan("Do you want to add an addon?"),
          options: [
            { value: "no", label: colors.red("No") },
            { value: "yes", label: colors.green("Yes") },
          ],
        }),
      projectAddons: ({ results }) =>
        results.addAddons === "yes"
          ? multiselect({
              message: colors.cyan("Do you want to add an addon?"),
              options: [
                {
                  value: "unsetsoft.ryunixjs",
                  label: "Vscode Extension (Beta)",
                },
              ],
            })
          : cancel(),
    },
    {
      onCancel: ({ results }) => {
        process.exit(0);
      },
    }
  );

export default MENU;
