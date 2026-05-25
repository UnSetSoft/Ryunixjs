import webpack from 'webpack'
import webpackConfig from '../webpack.config.js'
;(webpackConfig as webpack.Configuration).mode = 'production'
const compiler = webpack(webpackConfig as webpack.Configuration)

export { compiler }
