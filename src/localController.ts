import { workspace } from 'vscode'
import * as mkdirp from 'mkdirp'
import * as fs from 'fs'
import * as EventEmitter from 'events'

export const LocalController = class LocalController extends EventEmitter {
  rootPath: string

  constructor() {
    super()

    this.rootPath = workspace.rootPath + '/'

    if (!this.rootPath) {
      this.error(new Error('no workspace found'))
    }
  }

  createLocalFileStructure(fileTree) {
    this.traverseFileTree(fileTree, this.rootPath)
  }

  async traverseFileTree(fileTree, path) {
    for (let key in fileTree) {
      const absFilePath = path + key
      if (fileTree[key] === null) {
        // is a file
        if (!fs.existsSync(absFilePath)) {
          await this.makeBlankFile(absFilePath)
        }
      } else if (typeof fileTree[key] === 'object') {
        // is a folder
        mkdirp(absFilePath)
        await this.traverseFileTree(fileTree[key], absFilePath + '/')
      }
    }
  }

  makeBlankFile(absolutePath: string) {
    return new Promise((resolve, reject) => {
      fs.appendFile(absolutePath, '', (err, res) => {
        if (err) {
          this.error(err)
          reject(err)
        } else {
          resolve(absolutePath)
        }
      })
    })
  }

  error(error: Error) {
    console.error(error)
    this.emit('error', error)
  }
}