const Webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const webpackConfig = require("../webpack.config.js");


const StartServer = async (cliSettings) => {
  const compiler = Webpack(webpackConfig);
  const devServerOptions = { ...webpackConfig.devServer, ...cliSettings };
  const server = new WebpackDevServer(devServerOptions, compiler);

  await server.start();
};

module.exports = { StartServer };
