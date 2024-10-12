'use strict'
const fs = require('fs')
const path = require('path')

const envPath = path.join(
  __dirname,
  '../../../../',
  '.env',
)

const envExist = () => {
  if (fs.existsSync(envPath)) {
    return true
  }

  return false
}
module.exports = envExist