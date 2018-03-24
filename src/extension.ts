'use strict';

const isDebug = process.env.NODE_ENV === 'debug'
const isDev = process.env.NODE_ENV === 'development' || isDebug

import * as vscode from 'vscode'
import { StatusIcon } from './statusIcon'
import { RemoteController } from './remoteController'
import { LocalController } from './localController'
import * as fs from 'fs'
import * as lang from './lang/en'
import * as Debug from 'debug'

const debug = isDev ? console.log.bind(console) : () => {} //Debug('remote-editor:extension')

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
  remoteController.config = configJSON
  return remoteController
}

function isDocIgnored(path: string) {
  const ignoredDocs = [
    /.remote$/
  ]
  return ignoredDocs.map(pattern => pattern.test(path)).filter(result => result === true).length
}

function isDocInWorkspace(path: string) {
  debug('isDocInWorkspace', path, vscode.workspace.rootPath)
  return path.indexOf(vscode.workspace.rootPath) === 0
}

export async function activate(context: vscode.ExtensionContext) {

  const statusBarItem = getStatusBarItem()

  await getRemoteController()
  if (remoteController.config.autoConnect) await connectRemoteEditor()
  

  vscode.workspace.onDidOpenTextDocument(async function onDocOpen(doc) {
    const path = doc.fileName
    if (!doc.isDirty && !isDocIgnored(path) && isDocInWorkspace(path)) {
      debug('open doc', doc)
      statusBarItem.stopCycle().cycleDots('⇅ ' + lang.syncing)
      try {
        const remoteController = await getRemoteController()
        if (!remoteController.isConnected) {
          await remoteController.connect()
        }
        await remoteController.getFileContents(path)
      } catch(e) {
        debug('Open document error', e)
      }
      statusBarItem.stopCycle().setText('⇅')
    }
  })

  vscode.workspace.onDidSaveTextDocument(async function onDocSave(doc) {
    const path = doc.fileName
    if (!doc.isDirty && !isDocIgnored(path)&& isDocInWorkspace(path)) {
      debug('save doc', doc)
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

    if (!fs.existsSync(vscode.workspace.rootPath + '/.remote')) {
      return vscode.window.showErrorMessage(lang.createRemoteEditor)
    }

    try {
      statusBarItem.stopCycle().cycleDots('⇅ ' + lang.connecting)

      //const remoteController = await getRemoteController()
      debug('Connecting...')
      remoteController.connect()
        .then(() => {
          statusBarItem.stopCycle().cycleDots('⇅ ' + lang.syncing)

          return remoteController.getFileTree()
            .then(filetree => {
              const localController = new LocalController()
              localController.createLocalRootFileTree(filetree)

              statusBarItem.stopCycle().setText('⇅ ' + lang.done).setTextWait('⇅', 5000)
            })
            .catch(error => console.log(error))
        })
        .catch(error => {
          console.error('Error connecting', error)
          vscode.window.showErrorMessage(lang.errorMsg.replace('%s', error.message))
          //throw new Error(lang.errorConnectionFailed)
        })
    } catch (error) {
      console.error(error)
      statusBarItem.stopCycle().setText('⇅ ' + lang.error).setTextWait('⇅', 5000)
      vscode.window.showErrorMessage(lang.errorMsg.replace('%s', error.message))
    }
  }

  async function disconnectRemoteEditor() {
    try {
      if (remoteController && remoteController.isConnected) {
        statusBarItem.stopCycle().cycleDots('⇅ ' + lang.disconnecting)
        await remoteController.disconnect()
        statusBarItem.stopCycle().setText('⇅ ' + lang.done).setTextWait('⇅', 3000)
      }
    } catch (error) {
      console.error(error)
      return vscode.window.showErrorMessage(lang.errorMsg.replace('%s', error.message))
    }
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('remote.editor.connectRemote', connectRemoteEditor)
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('remote.editor.disconnectRemote', disconnectRemoteEditor)
  )
}

export async function deactivate() {
  if (remoteController && remoteController.isConnected) {
    await remoteController.disconnect()
  }
}

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  promise.catch(() => {
    if (isDev) {
      debug('Promise rejection unhandled', reason)
    }
  })
})
