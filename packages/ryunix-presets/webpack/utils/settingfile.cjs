'use strict'

const settingFile = require('./settingfile.js')

module.exports = {
  getConfig: settingFile.getConfig,
  configFileExist: settingFile.configFileExist,
}
