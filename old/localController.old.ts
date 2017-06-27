import { workspace } from 'vscode'
import * as mkdirp from 'mkdirp'
import * as fs from 'fs'
import * as EventEmitter from 'events'
import * as path from 'path'

export const LocalController = class LocalController extends EventEmitter {
  rootPath: string

  constructor () {
    super()

    this.rootPath = workspace.rootPath + '/'

    if (!this.rootPath) {
      this.error(new Error('no workspace found'))
    }
  }

  createLocalFileStructure (fileTree: {}): void {
    this.traverseFileTree(fileTree, this.rootPath)
  }

  async traverseFileTree (fileTree: {}, path: string): Promise<void> {
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

  makeBlankFile (absolutePath: string): Promise<string> {
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

  exists (absolutePath: string): boolean {
    return fs.existsSync(path.resolve(absolutePath))
  }

  createConfigFile (absolutePath: string): void {
    if (this.exists(absolutePath) && this.exists(path.join(absolutePath, '.remote'))) {
      this.error(new Error('File/Folder already exists'))
    } else {
      mkdirp(path.resolve(absolutePath))
      fs.appendFileSync(path.join(absolutePath, '.remote'), this.getDefaultConfigString())
    }
  }

  error (error: Error): void {
    console.error(error)
    this.emit('error', error)
  }

  getLocalConfigFilePath (): string {
    return path.join(this.rootPath, '.remote')
  }

  localConfigIsDefault (): boolean {
    const defaultConfig = this.getDefaultConfig()
    const configFilePath = this.getLocalConfigFilePath()

    if (this.exists(configFilePath)) {
      try {
        const userConfigString = String(fs.readFileSync(configFilePath))
        const userConfig = JSON.parse(userConfigString)
        return JSON.stringify(defaultConfig) === JSON.stringify(userConfig)
      } catch (ex) {
        return false
      }
    } else {
      return false
    }
  }

  getDefaultConfig () {
    return {
      connection: {
        host: '',
        username: '',
        password: '',
        privateKey: '',
        port: ''
      },
      basePath: './',
      ignore: ['.git', 'node_modules']
    }
  }

  getDefaultConfigString () {
    return JSON.stringify(this.getDefaultConfig(), null, 2)
  }
}