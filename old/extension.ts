'use strict'

import * as vscode from 'vscode';
import { getRemoteController } from './lib/remoteController'
import { LocalController } from './lib/localController'
import { cloneRemoteDoc } from './commands/cloneRemoteDoc'
import { uploadLocalDoc } from './commands/uploadLocalDoc'
import { syncDown } from './commands/sync'
import { addNew } from './commands/addNew'

// let extensionConfig = vscode.workspace.getConfiguration('remote.editor')
const localController = new LocalController()

export async function activate(context: vscode.ExtensionContext) {
  // XXX: this await will prevent the extension from activating
  // when the config file is incomplete. Change it to a "hasRemoteConfig"
  // call instead, then if we dont have one, and there are no other files
  // in the workspace than ".remote", and ".remote" === the default, open
  // ".remote" automatically for the uswr. also, still register the commands
  // below, but in the handlers, add checks for "hasRemoteConfig" and show a
  // connection error if one cant be found.

  // it may be an idea to _not_ autoconnect on startup, instead doing so every
  // time it is required.
  
  getRemoteController(false)
    .then(function gotRemoteController (remoteController) {
      vscode.workspace.onDidOpenTextDocument(cloneRemoteDoc)
      vscode.workspace.onDidSaveTextDocument(uploadLocalDoc)
    })
    .catch(function remoteControllerError (err) {
      if (localController.localConfigIsDefault()) {
        vscode.workspace.openTextDocument(localController.getLocalConfigFilePath())
          .then(function afterOpenDocument (document) {
            vscode.window.showTextDocument(document)
            vscode.window.showInformationMessage('Unable to connect: please enter SSH connection details')
          })
      } else {
        vscode.window.showErrorMessage(`Unable to connect: check your SSH connection details are correct. (${err})`)
      }
    })

  let disposable
  disposable = vscode.commands.registerCommand('remoteeditor.addNew', addNew)
  context.subscriptions.push(disposable)

  disposable = vscode.commands.registerCommand('remoteeditor.sync', syncDown)
  context.subscriptions.push(disposable)
vscode.workspace.findFiles
  console.log(vscode)
}

// this method is called when your extension is deactivated
export function deactivate() {
 console.log(vscode)
}

