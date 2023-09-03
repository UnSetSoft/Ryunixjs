const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ErrorOverlayPlugin = require("error-overlay-webpack-plugin");

const dir = path.dirname(path.resolve(path.join(__dirname, "..", "..")));
console.log(path.join(dir, "src", "main.ryx"));
module.exports = {
  mode: process.env.NODE_ENV !== "production" ? "development" : "production",
  entry: path.join(dir, "src", "main.ryx"),
  output: {
    path: path.join(dir, ".ryunix"),

    filename: "./assets/js/[chunkhash].bundle.js",
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
      //favicon: path.join(dir, "public", "favicon.ico"),
    }),
    new ErrorOverlayPlugin(),
  ],
};
