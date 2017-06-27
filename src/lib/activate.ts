import * as vscode from 'vscode'
import * as commands from '../commands'
import { localController } from './localController'

const activate = function activate (context:vscode.ExtensionContext) : void {
  const disposables = []
  // on activation, try load config
  // if there is a placeholder config file found, create a blank config file and open it
  localController.processPlaceholderFile()

  // register any commands that need registering
  disposables.push(vscode.commands.registerCommand('remoteeditor.createNewProject', commands.createNewProject))

  // add any listeners that need adding
  localController.handleChangesToConfigFile()

  context.subscriptions.concat(disposables)
}

export {
  activate
}
