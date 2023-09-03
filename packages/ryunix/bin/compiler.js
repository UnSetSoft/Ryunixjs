// Can be imported from webpack package
const webpack = require("webpack");
const webpackConfig = require("../webpack.config.js");
const compiler = webpack(webpackConfig);

module.exports = { compiler };
