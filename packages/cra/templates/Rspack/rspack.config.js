'use strict'
const rspack = require('@rspack/core')
const isDev = process.env.NODE_ENV === 'development'
/**
 * @type {import('@rspack/cli').Configuration}
 */

module.exports = {
  mode: isDev ? 'development' : 'production',
  context: __dirname,
  entry: {
    main: './main.ryx',
  },
  experiments: {
    rspackFuture: {
      disableTransformByDefault: true,
      css: true,
    },
  },
  output: {
    publicPath: '/',
  },
  devServer: {
    hot: isDev,
    historyApiFallback: {
      index: '/',
      disableDotRule: true,
    },
  },
  module: {
    rules: [
      {
        test: /\.svg$/,
        type: 'asset',
      },
      {
        test: /\.css$/i,
        use: [rspack.CssExtractRspackPlugin.loader, 'css-loader'],
        type: 'javascript/auto',
      },
      {
        test: /\.module\.css$/i,
        type: 'css/module',
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /^BUILD_ID$/,
        type: 'asset/source',
      },
      {
        test: /\.jsx|.ryx$/,
        exclude: [/[\\/]node_modules[\\/]/],
        use: {
          loader: 'builtin:swc-loader',
          options: {
            sourceMap: true,
            jsc: {
              parser: {
                syntax: 'ecmascript',
                jsx: true,
              },
              transform: {
                react: {
                  pragma: 'Ryunix.createElement',
                  pragmaFrag: 'Ryunix.Fragment',
                },
              },
            },
          },
        },
        type: 'javascript/auto',
      },
    ],
  },
  resolve: {
    extensions: ['.*', '.js', '.jsx', '.ryx'],
  },
  plugins: [
    new rspack.CssExtractRspackPlugin({}),
    new rspack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
    new rspack.ProgressPlugin({}),
    new rspack.HtmlRspackPlugin({
      template: './index.html',
    }),
  ].filter(Boolean),
}
