import * as vscode from 'vscode'
import * as path from 'path'
import * as mkdirp from 'mkdirp'
import { config } from '../lib/config'

/**
 * @function createNewProject
 * @summary Makes a new directory, creates a placeholder
 * file in it, then opens the folder in vscode & removes
 * the placeholder, creates a config file & opens it
 */
const createNewProject = function (localController) {
  return async function createNewProject () {
    let dirPath = await localController.getNewDirectoryPath()
    if (!dirPath) {
      console.error(`No path supplied`)
      return false
    }

    dirPath = path.join(dirPath, config.configDirName)
    mkdirp(dirPath)

    localController.createPlaceholderFile(path.join(dirPath, config.placeholderFileName))
    vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse(dirPath), true)
  }
}

export {
  createNewProject
}