import fs from 'node:fs'
import path from 'node:path'

const envPath = path.join(process.cwd(), '.env')

const envExist = () => {
  if (fs.existsSync(envPath)) {
    return true
  }

  return false
}

export default envExist
