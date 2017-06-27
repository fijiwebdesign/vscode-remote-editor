import * as vscode from 'vscode'
import { localController } from '../lib/localController'

/**
 * @function createNewProject
 * @summary Makes a new directory, creates a placeholder
 * file in it, then opens the folder in vscode & removes
 * the placeholder, creates a config file & opens it
 */
const createNewProject = async function createNewProject () {
  const dirPath = await localController.getNewDirPath()
  localController.mkdir(dirPath)
  localController.createPlaceholderFile(dirPath)
  vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse(dirPath), true)
}

export {
  createNewProject
}