const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ErrorOverlayPlugin = require("error-overlay-webpack-plugin");

const dir = path.dirname(require.main.filename);

module.exports = {
  mode: process.env.NODE_ENV !== "production" ? "development" : "production",
  entry: path.join(dir, "src", "main.ryx"),
  output: {
    path: path.resolve(dir, ".ryunix"),
    filename: "./assets/js/[chunkhash].bundle.js",
  },
  devServer: {
    port: 3000,
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
        test: /\.(css|scss)$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(jpg|jpeg|png|gif|mp3|svg|mp4)$/,
        use: ["file-loader"],
      },
    ],
  },
  resolve: {
    extensions: ["*", ".js", ".jsx", ".ts", ".tsx", ".ryx"],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(dir, "public", "index.html"),
      //favicon: path.join(dir, "public", "favicon.ico"),
    }),
    new ErrorOverlayPlugin(),
  ],
};
