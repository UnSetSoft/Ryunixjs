const cmd = require('command-exists-promise')
const { exec } = require('child_process')
const hasVscode = async () => {
  return await cmd('code')
    .then((exists) => {
      if (exists) {
        // The command exists
        return true
      } else {
        // The command doesn't exist
        return false
      }
    })
    .catch((err) => {
      // Should never happen but better handle it just in case
      return false
    })
}

const InstallVsocodeAddon = async () => {
  return await exec(
    'code --ms-enable-electron-run-as-node --install-extension unsetsoft.ryunixjs --force',
    {
      stdio: 'inherit',
    },
    (error) => {
      if (error) {
        return console.error(error)
      }
    },
  )
}

module.exports = { hasVscode, InstallVsocodeAddon }
