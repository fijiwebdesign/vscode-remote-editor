import { getRemoteController } from '../lib/remoteController'

export const cloneRemoteDoc = async function cloneRemoteDoc (doc) {
  const remoteController = await getRemoteController()
  if (remoteController) {
    if (!doc.isDirty && doc.fileName.slice(-7) !== '.remote') {
      let filename = doc.fileName
      remoteController.getFileContents(doc.fileName, filename)
    }
  } else {
    // todo: do something
  }
}