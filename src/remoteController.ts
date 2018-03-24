interface connectionInfo {
  host: string,
  username: string,
  password?: string,
  port?: string | number,
  keyFile?: string
}

import * as SSH from 'node-ssh'
import * as EventEmitter from 'events'
import { workspace } from 'vscode'
import * as Debug from 'debug'

const debug = Debug('remote-editor:remoteController')

export const RemoteController = class RemoteController extends EventEmitter {
  connectionInfo: connectionInfo
  basePath: string
  ignore: string[]
  ssh: SSH
  sftp: any
  hasSFTP: boolean

  get isConnected(): boolean {
      return this.ssh.connection
  }

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
    this.hasSFTP = false

    return this
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ssh
        .connect(this.connectionInfo)
        .then(() => {
          debug('connected', this.connectionInfo)
          return this.ssh
            .requestSFTP()
            .then((sftp) => {
              this.sftp = sftp
              this.hasSFTP = true
              resolve()
            })
            .catch((err) => {
              this.error(err)
              reject(err)
            })
        })
        .catch((err) => {
          debug('connection error', err)
          this.error(err)
          reject(err)
        })
    })
  }

  disconnect() {
    if (this.ssh.connection) {
      this.ssh.dispose()
    }
  }

  error(error: Error) {
    this.emit('error', error)
  }

  getMappedIgnores(basePath: string, ignores: string[]) {
    return ignores.map(ignore => basePath + ignore)
  }

  enumerateRemoteFiles(path: string) {
    return new Promise((resolve, reject) => {
      this.sftp.readdir(path, {}, (err, filelist) => {
        if (err) {
          this.error(err)
          reject(err)
        } else {
          resolve(filelist)
        }
      })
    })
  }

  async processFile(fileOrFolder, path: string) {
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

  async processFilelist(filelist, path: string) {
    const levelRes = {}

    for (let i = 0; i < filelist.length; i++) {
      let shouldIgnore = this.ignore && this.ignore.indexOf(path + filelist[i].filename) !== -1
      // debug(`is ${path + filelist[i].filename} in the ignore list? ${shouldIgnore ? 'yes' : 'no'}`)
      if (shouldIgnore) {
        continue
      } else {
        levelRes[filelist[i].filename] = await this.processFile(filelist[i], path)
      }
    }

    return levelRes
  }

  getFileTree(path: string = this.basePath) {
    return new Promise((resolve, reject) => {
      this.enumerateRemoteFiles(path)
        .then((filelist) => {
          try {
            const filetree = this.processFilelist(filelist, path)
            resolve(filetree)
          } catch (ex) {
            this.error(ex)
            reject(ex)
          }
        })
    })
  }

  getFileContents(localPath:string) {
    let remotePath = 
      localPath
        .replace(workspace.rootPath, '')
        .replace(/^[\/\\]/, '')
        .replace(/[\/\\]/g, '/')
    remotePath = this.basePath + remotePath
    return this.ssh.getFile(localPath, remotePath)
  }

  putFileContents(localPath:string) {
    let remotePath = 
      localPath
        .replace(workspace.rootPath, '')
        .replace(/^[\/\\]/, '')
        .replace(/[\/\\]/g, '/')
    remotePath = this.basePath + remotePath
    return this.ssh.putFile(localPath, remotePath)
  }
}