"use strict"
const rspack = require("@rspack/core")
const {dirname, join} = require("path")
const dir = dirname(join(__dirname, '..', '..', '..', '..'))

/**
 * @type {import('@rspack/cli').Configuration}
 */

module.exports = {
  context: dir,
  entry: {
    main: "./src/main.ryx",
  },
  experiments: {
    rspackFuture: {
      disableTransformByDefault: true,
    },
  },
  module: {
    rules: [
      {
        test: /\.svg$/,
        type: "asset",
      },
      {
        test: /\.css$/i,
        type: "css",
      },
      {
        test: /\.module\.css$/i,
        type: "css/module",
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        type: "asset/resource",
      },
      {
        test: /^BUILD_ID$/,
        type: "asset/source",
      },
      {
        test: /\.jsx|.ryx$/,
        exclude: [/[\\/]node_modules[\\/]/],
        use: {
          loader: "builtin:swc-loader",
          options: {
            sourceMap: true,
            jsc: {
              parser: {
                syntax: "ecmascript",
                jsx: true,
              },
              transform: {
                react: {
                  pragma: "Ryunix.createElement",
                  pragmaFrag: "Ryunix.Fragment",
                },
              },
            },
          },
        },
        type: "javascript/auto",
      },
    ],
  },
  plugins: [
    new rspack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    }),
    new rspack.ProgressPlugin({}),
    new rspack.HtmlRspackPlugin({
      template: "./index.html",
    }),
  ].filter(Boolean),
}