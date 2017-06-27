import { config } from '../../lib/config'
import * as fs from 'fs'
import * as path from 'path'

/**
 * @function doesPlaceholderExist
 * @summary determines whether a remote-editor placeholder
 * file exists
 * @returns {Boolean} whether the placeholder exists
 */
const doesPlaceholderExist = function doesPlaceholderExist () {
  return fs.existsSync(path.join(config.configDir, config.placeholderFileName))
}

export {
  doesPlaceholderExist
}
