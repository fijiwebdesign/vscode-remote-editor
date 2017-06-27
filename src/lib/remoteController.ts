import * as SSH from 'node-ssh'
import * as EventEmitter from 'events'
import * as path from 'path'
import { workspace, window } from 'vscode'

const RemoteController = class RemoteController extends EventEmitter {
  connectionInfo: {
    host: string,
    username: string,
    password?: string,
    port?: string | number,
    keyFile?: string
  }
  basePath: string
  ignore: string[]
  ssh: SSH
  isConnected: boolean
  sftp: any
  hasSFTP: boolean

  constructor(config) {
    super()

    const mappedIgnores = this.getMappedIgnores(config.basePath, config.ignore)
    const basePath = config.basePath && config.basePath.slice(config.basePath.length - 1) !== '/'
      ? config.basePath += '/'
      : config.basePath

    this.connectionInfo = config.connection
    this.basePath = basePath || './'
    this.ignore = mappedIgnores || []

    this.ssh = new SSH
    this.isConnected = false
    this.hasSFTP = false

    return this
  }

  checkConfig(config) {
    const conforms =
      'host' in config &&
      'username' in config &&
      ('password' in config || 'keyFile' in config) &&
      config.host &&
      config.username &&
      (config.password || config.keyFile)

    return conforms
  }

  getIsConnected() {
    return this.isConnected
  }

  connect(): Promise<{}> {
    return new Promise((resolve, reject) => {
      this.ssh
        .connect(this.connectionInfo)
        .then(() => {
          this.isConnected = true
          this.ssh
            .requestSFTP()
            .then((sftp) => {
              this.sftp = sftp
              this.hasSFTP = true
              resolve()
            })
            .catch((err) => {
              setTimeout(() => this.error(err), 10)
              reject(`SFTP unavailable: ${err.message}`)
            })
        })
        .catch((err) => {
          setTimeout(() => this.error(err), 10)
          reject(`Unable to connect: ${err.message}`)
        })
    })
  }

  error(error: Error): void {
    this.emit('error', error)
  }

  getMappedIgnores(basePath: string, ignores: string[]): string[] {
    return ignores.map(ignore => basePath + ignore)
  }

  enumerateRemoteFiles(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sftp.readdir(path, {}, (err, filelist) => {
        if (err) {
          setTimeout(() => this.error(err), 10)
          reject(err)
        } else {
          resolve(filelist)
        }
      })
    })
  }

  async processFile(fileOrFolder, path: string): Promise<{}> {
    if (fileOrFolder &&
      fileOrFolder.attrs &&
      'function' === typeof fileOrFolder.attrs.isDirectory &&
      fileOrFolder.attrs.isDirectory()) {
      const newPath = path + fileOrFolder.filename + '/'
      const filelist = await this.enumerateRemoteFiles(newPath)
      return await this.processFilelist(filelist, newPath)
    } else {
      return null
    }
  }

  async processFilelist(filelist, path: string): Promise<{}> {
    const levelRes = {}

    for (let i = 0; i < filelist.length; i++) {
      let shouldIgnore = this.ignore.indexOf(path + filelist[i].filename) !== -1
      // console.log(`is ${path + filelist[i].filename} in the ignore list? ${shouldIgnore ? 'yes' : 'no'}`)
      if (shouldIgnore) {
        continue
      } else {
        levelRes[filelist[i].filename] = await this.processFile(filelist[i], path)
      }
    }

    return levelRes
  }

  getFileTree(path: string = this.basePath): Promise<{}> {
    return new Promise((resolve, reject) => {
      this.enumerateRemoteFiles(path)
        .then((filelist) => {
          try {
            const filetree = this.processFilelist(filelist, path)
            resolve(filetree)
          } catch (ex) {
            setTimeout(() => this.error(ex), 10)
            reject(ex)
          }
        })
    })
  }

  getFileContents(localPath: string): Promise<string> {
    let remotePath =
      localPath
        .replace(workspace.rootPath, '')
        .replace(/^[\/\\]/, '')
        .replace(/[\/\\]/g, '/')
    remotePath = this.basePath + remotePath

    return this.ssh.getFile(localPath, remotePath)
  }

  putFileContents(localPath: string): Promise<string> {
    let remotePath =
      localPath
        .replace(workspace.rootPath, '')
        .replace(/^[\/\\]/, '')
        .replace(/[\/\\]/g, '/')
    remotePath = this.basePath + remotePath

    return this.ssh.putFile(localPath, remotePath)
  }
}

let remoteController = null
export const getRemoteController = function getRemoteController(displayErrors = true) {
  return new Promise((resolve, reject) => {
    if (
      remoteController &&
      typeof remoteController.getIsConnected === 'function' &&
      remoteController.getIsConnected()
    ) {
      resolve(remoteController)
    } else {
      workspace.openTextDocument(path.join(workspace.rootPath, '/.remote'))
        .then(function afterOpenTextDocument(configFile) {
          const configString = configFile.getText()
          const configJSON = JSON.parse(configString)

          if (configJSON.privateKey) {
            configJSON.privateKey = path.resolve(configJSON.privateKey)
          }

          return new RemoteController(configJSON)
        })
        .then((remoteController) => remoteController.connect())
        .then(resolve,
        (err: Error) => {
          if (displayErrors) {
            window.showErrorMessage(err.message)
          }
          reject(err)
        })
    }
  })
}
