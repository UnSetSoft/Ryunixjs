// Can be imported from webpack package
import webpack from 'webpack'
import webpackConfig from '../webpack.config.mjs'
const compiler = webpack(webpackConfig)

export { compiler }
