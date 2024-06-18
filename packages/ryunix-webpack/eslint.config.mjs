import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import config from "./utils/config.cjs"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dir = path.dirname(path.join(__dirname, '..', '..'))
const compat = new FlatCompat({
    baseDirectory: dir,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [...compat.extends("eslint:recommended"), {
    files: ["**/*.ryx", ...config?.eslint?.files],

    languageOptions: {
        ecmaVersion: 2021,
        sourceType: "module",

        parserOptions: {
            ecmaFeatures: {
                jsx: true,
            },
        },
    },
    plugins: config?.eslint?.plugins,
    rules: config?.eslint?.rules,
}, ...compat.extends("eslint:recommended").map(config => ({
    ...config,
    files: ["**/*.ryx"],
})), {
    files: ["**/*.ryx", ...config?.eslint?.files],

    languageOptions: {
        ecmaVersion: 2021,
        sourceType: "module",

        parserOptions: {
            ecmaFeatures: {
                jsx: true,
            },
        },
    },
    plugins: config?.eslint?.plugins,
    rules: config?.eslint?.rules,
}];