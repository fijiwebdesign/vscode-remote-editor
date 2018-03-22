'use strict';

import * as vscode from 'vscode';
import { StatusIcon } from './statusIcon'
import { RemoteController } from './remoteController'
import { LocalController } from './localController'
import * as fs from 'fs'
import * as lang from './int8n/en'

//const extensionConfig = vscode.workspace.getConfiguration('remote.editor')
let statusBarItem
let remoteController

function getStatusBarItem() {
  if (statusBarItem) return statusBarItem
  statusBarItem = new StatusIcon({
    position: 'left',
    priority: 0,
    text: '⇅',
    tooltip: lang.syncFolderStructure,
    command: 'remote.editor.connectRemote'
  })
  .show()
  return statusBarItem
}

async function getRemoteController() {
  if (remoteController) return remoteController
  const path = vscode.workspace.rootPath + '/.remote'
  if (!fs.existsSync(vscode.workspace.rootPath + '/.remote')) {
    return vscode.window.showErrorMessage(lang.createRemoteEditor)
  }
  const configFile = await vscode.workspace.openTextDocument(path)
  const configString = configFile.getText()
  const configJSON = JSON.parse(configString)
  remoteController =  new RemoteController(configJSON)
  return remoteController
}

async function connectRemoteEditor() {
  getStatusBarItem().cycle(createCycleDots('⇅ ' + lang.connecting))

  try {
    const remoteController = await getRemoteController()
    await remoteController.connect()
      .then(async () => {

        getStatusBarItem()
          .stopCycle()
          .cycle(createCycleDots('⇅ ' + lang.syncing))

        const filetree = await remoteController.getFileTree()

        const localController = new LocalController()
        localController.createLocalRootFileTree(filetree)

        getStatusBarItem().stopCycle().setText('⇅ done')

        setTimeout(function () {
          getStatusBarItem().setText('⇅')
        }, 3000)
      })
  } catch (ex) {
    console.error(ex)
    /* TODO: Error! */
  }
}

function createCycleDots(msg) {
  return [msg + '   ', msg + '.  ', msg + '.. ', msg + '...']
}

export function activate(context: vscode.ExtensionContext) {

  getStatusBarItem()

  vscode.workspace.onDidOpenTextDocument(async function onDocOpen(doc) {
    console.log('open doc', doc)
    if (!doc.isDirty) {
      const remoteController = await getRemoteController()
      remoteController.getFileContents(doc.fileName)
    }
  })

  vscode.workspace.onDidSaveTextDocument(async function onDocSave(doc) {
    console.log('save doc', doc)
    if (!doc.isDirty) {
      const remoteController = await getRemoteController()
      remoteController.putFileContents(doc.fileName)
    }
  })

  context.subscriptions.push(
    vscode.commands.registerCommand('remote.editor.connectRemote', connectRemoteEditor)
  )
}

// this method is called when your extension is deactivated
export function deactivate() {

}

