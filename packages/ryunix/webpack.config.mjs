import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import {
  getPackageManager,
  ENV_HASH,
  getEnviroment,
  resolveApp,
} from "./utils/index.mjs";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);

const __dirname = dirname(__filename);

let dir;
const manager = getPackageManager();
if (manager === "yarn" || manager === "npm" || manager === "bun") {
  dir = dirname(resolve(join(__dirname, "..", "..")));
} else if (manager === "pnpm") {
  throw new Error(`The manager ${manager} is not supported.`);
}

export default {
  mode: "production",
  entry: join(dir, "src", "main.ryx"),
  devtool: "nosources-source-map",
  output: {
    path: join(dir, ".ryunix"),
    chunkFilename: "./assets/js/[name].[fullhash:8].bundle.js",
    assetModuleFilename: "./assets/media/[name].[hash][ext]",
    filename: "./assets/js/[name].[fullhash:8].bundle.js",
    devtoolModuleFilenameTemplate: "ryunix/[resource-path]",
    clean: true,
  },
  devServer: {
    hot: true,
    historyApiFallback: {
      index: "/",
      disableDotRule: true,
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
    },
  },
  optimization: {
    runtimeChunk: "single",
    splitChunks: {
      chunks: "all",
      maxInitialRequests: Infinity,
      minSize: 0,
    },
  },
  cache: {
    type: "filesystem",
    version: ENV_HASH(getEnviroment()),
    cacheDirectory: resolveApp(dir, "node_modules/.cache"),
    store: "pack",
    buildDependencies: {
      defaultWebpack: ["webpack/lib/"],
      config: [__filename],
      tsconfig: [
        resolveApp(dir, "tsconfig.json"),
        resolveApp(dir, "jsconfig.json"),
      ].filter((f) => fs.existsSync(f)),
    },
  },
  infrastructureLogging: {
    level: "none",
  },
  stats: "errors-warnings",
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx|ryx|)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
            plugins: [
              [
                "@babel/plugin-transform-react-jsx",
                {
                  pragma: "Ryunix.createElement",
                  pragmaFrag: "Ryunix.Fragments",
                },
              ],
            ],
          },
        },
      },
      {
        test: /\.sass|css$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.(jpg|jpeg|png|gif|mp3|svg|mp4|pdf|ico)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[ext]",
              outputPath: "files/",
            },
          },
        ],
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg|pdf|ico)$/, // to import images and fonts
        loader: "url-loader",
        options: { limit: false },
      },
      {
        test: /\.ico$/i,
        type: "asset/resource",
        generator: {
          filename: "[name][ext][query]",
        },
      },
    ],
  },
  resolve: {
    extensions: [".*", ".js", ".jsx", ".ts", ".tsx", ".ryx"],
  },
  plugins: [
    new HtmlWebpackPlugin({
      favicon: join(dir, "public", "favicon.ico"),
      template: join(dir, "public", "index.html"),
    }),
  ],
  externals: {
    ryunix: "Ryunix",
  },
};
