'use strict';

import * as vscode from 'vscode';
import { StatusIcon } from './statusIcon'
import { RemoteController } from './remoteController'
import { LocalController } from './localController'

// let extensionConfig = vscode.workspace.getConfiguration('remote.editor')

export function activate(context: vscode.ExtensionContext) {
  let remoteController

  const statusBarItem =
    new StatusIcon({
      position: 'left',
      priority: 0,
      text: '⇅',
      tooltip: 'Sync down remote folder structure',
      command: 'extension.connectRemote'
    })
      .show()

  vscode.workspace.onDidOpenTextDocument(function onDocOpen(doc) {
    console.log(vscode)
    if (!doc.isDirty) {
      let filename = doc.fileName
      remoteController
        .getFileContents(doc.fileName, filename)
    }
  })

  let disposable = vscode.commands.registerCommand('remote.editor.connectRemote', async function () {
    statusBarItem.cycle(['⇅ working   ', '⇅ working.  ', '⇅ working.. ', '⇅ working...'])

    try {
      const configFile = await vscode.workspace.openTextDocument(vscode.workspace.rootPath + '/.remote')
      const configString = configFile.getText()
      const configJSON = JSON.parse(configString)
      remoteController = new RemoteController(configJSON)
      remoteController
        .connect()
        .then(async () => {
          const filetree = await remoteController.getFileTree()

          const localController = new LocalController()
          localController.createLocalFileStructure(filetree)

          statusBarItem
            .stopCycle()
            .setText('⇅ done')

          setTimeout(function () {
            statusBarItem.setText('⇅')
          }, 3000)
        })
    } catch (ex) {
      console.error(ex)
      /* TODO: Error! */
    }
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {

}

