'use strict'

const fs = require('fs')
const path = require('path')

const defaultConfigFile = path.join(process.cwd(), 'ryunix.config.js')
const commonConfigFile = path.join(process.cwd(), 'ryunix.config.cjs')

const configFileExist = () => {
  return fs.existsSync(defaultConfigFile) || fs.existsSync(commonConfigFile)
}

const getConfig = () => {
  try {
    if (fs.existsSync(defaultConfigFile)) {
      const { default: config } = require(defaultConfigFile)

      return config
    } else if (fs.existsSync(commonConfigFile)) {
      const config = require(commonConfigFile)
      return config
    }

    return {}
  } catch (error) {
    console.error(error)
  }
}

module.exports = {
  getConfig,
  configFileExist,
}
