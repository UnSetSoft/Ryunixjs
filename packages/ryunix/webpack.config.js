const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ErrorOverlayPlugin = require("error-overlay-webpack-plugin");
const { getPackageManager } = require("./utils");

let dir;
const manager = getPackageManager();
if (manager === "yarn" || manager === "npm" || manager === "bun") {
  dir = path.dirname(path.resolve(path.join(__dirname, "..", "..")));
} else if (manager === "pnpm") {
  throw new Error(`The manager ${manager} is not supported.`);
}

module.exports = {
  mode: "production",
  entry: path.join(dir, "src", "main.ryx"),
  devtool: "nosources-source-map",
  output: {
    path: path.join(dir, ".ryunix"),
    chunkFilename: "./assets/js/[name].[fullhash:8].bundle.js",
    filename: "./assets/js/[name].[fullhash:8].bundle.js",
    devtoolModuleFilenameTemplate: "ryunix/[resource-path]",
    clean: true,
  },
  devServer: {
    hot: true,
    historyApiFallback: { index: "/", disableDotRule: true },
  },
  optimization: {
    runtimeChunk: "single",
    splitChunks: {
      chunks: "all",
      maxInitialRequests: Infinity,
      minSize: 0,
    },
  },
  stats: {
    assets: false,
    children: false,
    chunks: false,
    chunkModules: false,
    colors: true,
    entrypoints: false,
    hash: false,
    modules: false,
    timings: false,
    version: false,
  },
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
        test: /\.(jpg|jpeg|png|gif|mp3|svg|mp4|pdf)$/,
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
        test: /\.(png|woff|woff2|eot|ttf|svg|pdf)$/, // to import images and fonts
        loader: "url-loader",
        options: { limit: false },
      },
    ],
  },
  resolve: {
    extensions: [".*", ".js", ".jsx", ".ts", ".tsx", ".ryx"],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(dir, "public", "index.html"),
    }),
    new ErrorOverlayPlugin(),
  ],
  externals: {
    ryunix: "Ryunix",
  },
};
