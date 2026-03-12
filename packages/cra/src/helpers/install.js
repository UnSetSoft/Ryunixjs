const spawn = require('cross-spawn')

function install(packageManager, cwd) {
  return new Promise((resolve, reject) => {
    const args = ['install']

    const child = spawn(packageManager, args, {
      cwd,
      stdio: 'inherit', // Important: inherit stdio so user sees progress
      env: { ...process.env, ADBLOCK: '1', DISABLE_OPENCOLLECTIVE: '1' },
    })

    child.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `${packageManager} ${args.join(' ')} failed with exit code ${code}`
          )
        )
        return
      }
      resolve()
    })
  })
}

module.exports = { install }
