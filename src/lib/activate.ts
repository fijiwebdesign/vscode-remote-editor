import * as vscode from 'vscode'
import { LocalController } from './localController'
import { RemoteController } from './remoteController'
import * as commands from '../commands'

const activate = async function activate (context: vscode.ExtensionContext) {
  const disposables = []


  const localController = new LocalController(disposables)
  await localController.performStartupTasks()

  // const remoteController = new RemoteController(disposables, localController)
  // TODO: move below into remote controller
  if (await localController.configIsValid()) {
    localController.getConfigJSON()
  } else {
    // TODO: add listeners to local controller
  }

  commands.register(disposables, localController/*, remoteController*/)

  context.subscriptions.concat(disposables)
}

export {
  activate
}
