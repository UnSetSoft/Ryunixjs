import Webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import webpackConfig from "../webpack.config.mjs";

const StartServer = async (cliSettings) => {
  const compiler = Webpack(webpackConfig);
  const devServerOptions = { ...webpackConfig.devServer, ...cliSettings };
  const server = new WebpackDevServer(devServerOptions, compiler);

  await server.start();
};

export { StartServer };
