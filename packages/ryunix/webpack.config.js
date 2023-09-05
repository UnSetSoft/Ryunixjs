const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ErrorOverlayPlugin = require("error-overlay-webpack-plugin");

const dir = path.dirname(path.resolve(path.join(__dirname, "/../", "../")));
module.exports = {
  mode: "production",
  entry: path.join(dir, "src", "main.ryx"),
  output: {
    path: path.join(dir, ".ryunix"),

    filename: "./assets/js/[chunkhash].bundle.js",
    devtoolModuleFilenameTemplate: "ryunix/[resource-path]",
  },
  devServer: {
    historyApiFallback: { index: "/", disableDotRule: true },
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
        test: /\.(js|jsx|ts|tsx|ryx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.(jpg|jpeg|png|gif|mp3|svg|mp4)$/,
        use: ["file-loader"],
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/, // to import images and fonts
        loader: "url-loader",
        options: { limit: false },
      },
    ],
  },
  resolve: {
    extensions: ["*", ".js", ".jsx", ".ts", ".tsx", ".ryx"],
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
