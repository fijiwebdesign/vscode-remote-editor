import { getRemoteController } from '../lib/remoteController'

export const uploadLocalDoc = async function uploadLocalDoc (doc) {
  const remoteController = await getRemoteController()
  if (remoteController) {
    if (doc.fileName.slice(-7) !== '.remote') {
      remoteController.putFileContents(doc.fileName)
    }
  } else {
    // todo: do something
  }
}