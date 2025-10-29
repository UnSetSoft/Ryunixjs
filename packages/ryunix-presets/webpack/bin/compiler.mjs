import webpack from 'webpack'
import webpackConfig from '../webpack.config.mjs'
webpackConfig.mode = 'production'
const compiler = webpack(webpackConfig)

export { compiler }
