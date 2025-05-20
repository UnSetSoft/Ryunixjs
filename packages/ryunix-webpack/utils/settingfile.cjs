'use strict'

const fs = require('fs')
const path = require('path')

const defaultConfigFile = path.join(process.cwd(), 'ryunix.config.js')
const commonConfigFile = path.join(process.cwd(), 'ryunix.config.cjs')

let config = {}

if (fs.existsSync(defaultConfigFile)) {
  config = require(defaultConfigFile)
} else if (fs.existsSync(commonConfigFile)) {
  config = require(commonConfigFile)
}

const configFileExist = () => {
  return fs.existsSync(defaultConfigFile) || fs.existsSync(commonConfigFile)
}

module.exports = {
  config,
  configFileExist,
}
