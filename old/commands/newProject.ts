import * as vscode from 'vscode'
import { statusIcon } from '../statusIcon'
import { LocalController } from '../lib/localController'
import * as path from 'path'

const localController = new LocalController()

export const addNew = function addNew () {
  statusIcon.startProcessing()

  vscode.window.showInputBox({
    prompt: 'Where do you want to create this project?'
  })
  .then(async function createLocalDir (dir) {
    if (!dir) return

    localController.createConfigFile(dir)

    vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse(dir), true)
  })

}