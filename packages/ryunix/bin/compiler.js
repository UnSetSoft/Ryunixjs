// Can be imported from webpack package
const webpack = require("webpack");
const config = require("../webpack.config.js");
const compiler = new webpack.Compiler();
new webpack.WebpackOptionsDefaulter().process(config);
compiler.options = config;

module.exports = { compiler };
