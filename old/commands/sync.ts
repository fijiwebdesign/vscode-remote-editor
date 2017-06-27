import * as vscode from 'vscode'
import { statusIcon } from '../statusIcon'
import { getRemoteController } from '../lib/remoteController'
import { LocalController } from '../lib/localController'

export const syncDown = async function syncDown () {
  statusIcon.startProcessing()
  
  let remoteController = await getRemoteController()
  if (remoteController) {
    const filetree = await remoteController.getFileTree()
    const localController = new LocalController()
    localController.createLocalFileStructure(filetree)

    statusIcon
      .stopProcessing()
      .setText('↑ done')
    setTimeout(function () {
      statusIcon.setText('↑')
    }, 3000)
  } else {
    // todo: something!
  }
}