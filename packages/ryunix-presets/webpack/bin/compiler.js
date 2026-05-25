import webpack from 'webpack'
import webpackConfig from '../webpack.config.js'
webpackConfig.mode = 'production'
const compiler = webpack(webpackConfig)
export { compiler }
