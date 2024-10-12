'use strict'
const fs = require('fs')
const path = require('path')

const defaultConfigFile = path.join(
  __dirname,
  '../../../../',
  'ryunix.config.js',
)

const CommonConfigFile = path.join(
  __dirname,
  '../../../../',
  'ryunix.config.cjs',
)

let config = {}

if (fs.existsSync(defaultConfigFile)) {
  config = require('../../../../ryunix.config.js')
} else if (fs.existsSync(CommonConfigFile)) {
  config = require('../../../../ryunix.config.cjs')
}

const configFileExist = () => {
  if (fs.existsSync(defaultConfigFile)) {
    return true
  } else if (fs.existsSync(CommonConfigFile)) {
    return true
  }

  return false
}

module.exports = {
  config,
  configFileExist,
}
