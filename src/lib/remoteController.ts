import * as SSH from 'node-ssh'
import * as EventEmitter from 'events'
import * as path from 'path'
import * as fs from 'fs'
import * as vscode from 'vscode'
import { promisify, join } from './util'
import { config } from './config'
const { workspace, window } = vscode

const RemoteController = class RemoteController extends EventEmitter {
  private connectionInfo ?: {
    host       :  string
    username   :  string
    password   ?: string
    port       ?: string|number
    privateKey ?: string
    passphrase ?: string
  }

  disposables     : vscode.Disposable[]
  eventListeners  : any
  remoteBase      : string
  ignore          : string[]
  localIgnores    : string[]
  ssh             : SSH
  connected       : boolean
  sftp            : any
  hasSFTP         : boolean
  localController : any
  downloadOnOpen  : boolean
  uploadOnSave    : boolean

  constructor (disposables, localController) {
    if (!disposables || !(disposables instanceof Array)) {
      throw new ReferenceError('An array for disposables is required')
    }

    if (!localController) {
      throw new ReferenceError('Missing LocalController instance')
    }

    super()
    this.disposables = disposables
    this.eventListeners = {}
    this.ssh = new SSH()
    this.connected = false
    this.hasSFTP = false
    this.localController = localController

    this.listenForConfigChanges()
    this.init()
    this.listenForFileOpens()
    this.listenForFileSaves()
  }

  async init () {
    if (await this.localController.configIsValid()) {
      this.processConfig(await this.localController.getConfigJSON())
      await this.connect()
    }
  }

  processConfig (config) {
    if (config.remotePath) {
      const remoteBase = config.remotePath[config.remotePath.length - 1] !== '/'
        ? config.remotePath + '/'
        : config.remotePath
      this.remoteBase = remoteBase || './'
    } else {
      this.remoteBase = './'
    }
    this.connectionInfo = config.connection
    const mappedIgnores = this.getMappedIgnores(config.remotePath, config.ignore)
    this.ignore = mappedIgnores || []
    this.localIgnores = config.ignore || []
    this.uploadOnSave = 'uploadOnSave' in config ? config.uploadOnSave : true
    this.downloadOnOpen = 'downloadOnOpen' in config ? config.downloadOnOpen : true
  }

  clearConfig () {
    this.remoteBase = './'
    this.connectionInfo = null
    this.ignore = []
  }

  listenForConfigChanges () {
    // on good config, store & connect
    this.localController.on('validConfigUpdate', (configJSON) => {
      console.log(`Got a valid config incoming: ${JSON.stringify(configJSON)}`)
      if (JSON.stringify(this.connectionInfo) !== JSON.stringify(configJSON.connection)) {
        this.processConfig(configJSON)
        this.connect()
      } else {
        this.processConfig(configJSON)        
        console.log('Incoming connection details were the same as current')
      }
    })
    
    // on bad config, disconnect
    this.localController.on('invalidConfigUpdate', () => {
      this.clearConfig()
      this.disconnect()
    })
  }

  listenForFileOpens () {
    this.localController.on('fileOpened', async (textDocument: vscode.TextDocument) => {
      if (!this.isIgnored(join(textDocument.fileName), true) && this.downloadOnOpen) {
        if (!this.isConnected()) {
          await this.connect()
        }
        await this.getFileContents(textDocument.fileName)
      }
    })
  }

  listenForFileSaves () {
    this.localController.on('fileSaved', async (textDocument) => {
      if (!this.isIgnored(join(textDocument.fileName), true) && this.uploadOnSave) {
        if (!this.isConnected()) {
          await this.connect()
        }
        await this.putFileContents(textDocument.fileName)
      }
    })
  }

  isConnected () {
    return this.connected
  }

  async fetchPassphrase () {
    if ('privateKey' in this.connectionInfo) {
      const key = await promisify(fs.readFile)(this.connectionInfo.privateKey)
      if (
        (/encrypted/i).test(key) &&
        (!('passphrase' in this.connectionInfo) || !this.connectionInfo.passphrase)
      ) {
        this.connectionInfo.passphrase = await window.showInputBox({
          prompt: 'Enter the passphrase for your private key'
        })
      } 
    }
  }

  async connect () {
    if (await this.localController.configIsValid()) {
      try {
        await this.fetchPassphrase()
        await this.ssh.connect(this.connectionInfo)
        console.log('Connected via SSH')
        this.connected = true
      } catch (ex) {
        console.error(`Unable to create SSH connection to server`)
        console.error(ex)
        this.resetConnection()
        return false
      }

      try {
        const sftp = await this.ssh.requestSFTP()
        console.log('Established SFTP connection')
        this.sftp = sftp
        this.hasSFTP = true
      } catch (ex) {
        console.error(`Unable to establish SFTP connection`)
        console.error(ex)
        this.resetConnection()
        return false
      }

      await this.onConnect()
      return true
    }

    this.resetConnection()
    return false
  }

  async onConnect () {
    this.localController.createLocalFileStructure(await this.getFileTree())
  }

  resetConnection () {
    this.connected = false
    this.sftp = null        
    this.hasSFTP = false
  }

  disconnect () {
    try {
      this.resetConnection()
      this.ssh.disconnect()
      return true
    } catch (ex) {
      console.error('Unable to disconnect SSH')
      console.error(ex)
    }
  }

  getMappedIgnores(remoteBase: string, ignores: string[]): string[] {
    return ignores.map(ignore => join(remoteBase, ignore))
  }

  async enumerateRemoteFiles(remotePath: string) {
    if (!this.isConnected()) {
      throw new Error('Not connected')
    }

    return await promisify(this.sftp.readdir.bind(this.sftp))(remotePath, {})
  }

  async processFile(fileOrFolder, filePath: string) {
    try {
      if (fileOrFolder.attrs.isDirectory()) {
        const newPath = join(filePath, fileOrFolder.filename, '/')
        const filelist = await this.enumerateRemoteFiles(newPath)
        return await this.processFilelist(filelist, newPath)
      }
    } catch (ex) {
      console.error(`Unable to process file "${JSON.stringify(fileOrFolder)}"`)
      console.error(ex)
    }

    return null
  }

  isIgnored (fileName, localFile = false) {
    if (fileName.indexOf(config.configFileName) !== -1 ||
        fileName.indexOf(config.placeholderFileName) !== -1) {
      return true
    }

    const shouldIgnore = (localFile
      ? (this.localIgnores as any)
      : (this.ignore as any)
    ).includes(fileName)

    console.log(`is ${fileName} in the ignore list? ${shouldIgnore ? 'yes' : 'no'}`)
    return shouldIgnore
  }

  async processFilelist(filelist, currentPath: string) {
    const levelRes = {}

    console.log(`The ignored files are: ${JSON.stringify(this.ignore)}`)
    for (let file of filelist) {
      const normalizedFileName = join(currentPath, file.filename)
    
      if (this.isIgnored(normalizedFileName)) {
        continue
      } else {
        levelRes[file.filename] = await this.processFile(file, currentPath)
      }
    }

    return levelRes
  }

  async getFileTree(remoteBase: string = this.remoteBase) {
    try {
      const filelist = await this.enumerateRemoteFiles(remoteBase)
      return await this.processFilelist(filelist, remoteBase)
    } catch (ex) {
      console.error(`Unable to retrieve file tree for "${remoteBase}"`)
      console.error(ex)
    }

    return null
  }

  async getFileContents(localPath: string) {
    let remotePath = localPath
      .replace(workspace.rootPath, '')
      .replace(/^[\/\\]/, '')
      .replace(/[\/\\]/g, '/')

    remotePath = this.remoteBase + remotePath

    return await this.ssh.getFile(localPath, remotePath)
  }

  async putFileContents(localPath: string) {
    let remotePath = localPath
      .replace(workspace.rootPath, '')
      .replace(/^[\/\\]/, '')
      .replace(/[\/\\]/g, '/')

    remotePath = this.remoteBase + remotePath

    return await this.ssh.putFile(localPath, remotePath)
  }
}

export {
  RemoteController
}
