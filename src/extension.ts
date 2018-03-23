'use strict';

import * as vscode from 'vscode'
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

function isDocIgnored(path: string) {
  const ignoredDocs = [
    /.remote$/,
    ///Code\/User\/settings.json$/
  ]
  return ignoredDocs.map(doc => path.match(doc)).filter(match => match).length > 0
}

function isDocInWorkspace(path: string) {
  console.log('isDocInWorkspace', path, vscode.workspace.rootPath)
  return path.indexOf(vscode.workspace.rootPath) === 0
}

export function activate(context: vscode.ExtensionContext) {

  const statusBarItem = getStatusBarItem()

  vscode.workspace.onDidOpenTextDocument(async function onDocOpen(doc) {
    const path = doc.fileName
    if (!doc.isDirty && !isDocIgnored(path) && isDocInWorkspace(path)) {
      console.log('open doc', doc)
      statusBarItem.stopCycle().cycleDots('⇅ ' + lang.syncing)
      const remoteController = await getRemoteController()
      if (!remoteController.isConnected) {
        await remoteController.connect()
      }
      await remoteController.getFileContents(path)
      statusBarItem.stopCycle().setText('⇅')
    }
  })

  vscode.workspace.onDidSaveTextDocument(async function onDocSave(doc) {
    const path = doc.fileName
    if (!doc.isDirty && !isDocIgnored(path)&& isDocInWorkspace(path)) {
      console.log('save doc', doc)
      statusBarItem.stopCycle().cycleDots('⇅ ' + lang.syncing)
      const remoteController = await getRemoteController()
      if (!remoteController.isConnected) {
        await remoteController.connect()
      }
      await remoteController.putFileContents(path)
      statusBarItem.stopCycle().setText('⇅')
    }
  })

  async function connectRemoteEditor() {
    statusBarItem.stopCycle().cycleDots('⇅ ' + lang.connecting)
  
    try {
      const remoteController = await getRemoteController()
      await remoteController.connect()
  
      statusBarItem.stopCycle().cycleDots('⇅ ' + lang.syncing)
  
      const filetree = await remoteController.getFileTree()
      const localController = new LocalController()
      localController.createLocalRootFileTree(filetree)
  
      statusBarItem.stopCycle().setText('⇅ ' + lang.done).setTextWait('⇅', 3000)
  
    } catch (error) {
      console.error(error)
      return vscode.window.showErrorMessage(lang.errorMsg.replace('%s', error.message))
    }
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('remote.editor.connectRemote', connectRemoteEditor)
  )
}

export function deactivate() {

}

