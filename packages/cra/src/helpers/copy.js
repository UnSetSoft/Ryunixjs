const fs = require('fs')

const copyRecursiveSync = (src, dest) => {
  const exists = fs.existsSync(src)
  const stats = exists && fs.statSync(src)
  const isDirectory = exists && stats.isDirectory()
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest)
    }
    fs.readdirSync(src).forEach((childItemName) => {
      // Don't copy node_modules or output folders if they somehow exist in template
      if (childItemName === 'node_modules' || childItemName === 'dist' || childItemName === '.ryunix') {
        return
      }
      copyRecursiveSync(
        require('path').join(src, childItemName),
        require('path').join(dest, childItemName)
      )
    })
  } else {
    // Basic file copy
    fs.copyFileSync(src, dest)
  }
}

module.exports = { copyRecursiveSync }
