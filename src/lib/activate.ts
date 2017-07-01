import * as vscode from 'vscode'
import { LocalController } from './localController'
import { RemoteController } from './remoteController'
import * as commands from '../commands'

const activate = async function activate (context: vscode.ExtensionContext) {
  const disposables = []

  const localController = new LocalController(disposables)
  await localController.performStartupTasks()

  const remoteController = new RemoteController(disposables, localController)

  commands.register(disposables, localController/*, remoteController*/)

  context.subscriptions.concat(disposables)
}

export {
  activate
}
