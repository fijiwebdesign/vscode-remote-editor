import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { promisify } from '../util'

/**
 * Returns an array of all directories inside a directory
 *
 * @async
 * @param {string} baseDir the directory to search in
 * @returns {string[]} An array of directory names
 */
const getDirectories = async function getDirectories (baseDir:string) {
  return (await promisify(fs.readdir)(baseDir))
    .filter((filePath) => {
      try {
        return fs.statSync(path.join(baseDir, filePath)).isDirectory()
      } catch (ex) {
        return false
      }
    })
}

export {
  getDirectories
}