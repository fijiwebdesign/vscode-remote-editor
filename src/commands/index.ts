import * as vscode from 'vscode'
import { createNewProject } from './createNewProject'

function register (disposables, localController) {
  if (!disposables || !(disposables instanceof Array)) {
    throw new ReferenceError('Disposables required')
  }

  disposables.push(
    vscode.commands.registerCommand(
      'remoteeditor.createNewProject',
      createNewProject(localController)
    )
  )
}

export {
  register,
  createNewProject
}
