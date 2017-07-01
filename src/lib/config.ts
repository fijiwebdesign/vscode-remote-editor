import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

declare namespace Config {
  export interface blank {
    connection: {
      host: string,
      username: string,
      password: string,
      privateKey: string,
      passphrase: string,
      port: string
    },
    remotePath: string,
    ignore: string[],
    uploadOnSave: boolean,
    downloadOnOpen: boolean
  }

  export interface live {
    connection: {
      host: string,
      username: string,
      password?: string,
      privateKey?: string,
      passphrase?: string,
      port?: string
    },
    remotePath?: string,
    ignore?: string[],
    uploadOnSave?: boolean,
    downloadOnOpen?: boolean
  }
}

const Config = class Config {
  public rootDir:string
  public configDir:string
  public configDirName:string
  public configDirExists:boolean
  public placeholderFileName:string
  public configFileName:string

  constructor () {
    this.placeholderFileName = '.remote-editor-project-placeholder'
    this.configFileName = '.remoteconfig'
    this.configDirName = '.vscode'

    this._init()
  }

  /**
   * Update environment paths to current
   * 
   */
  _init () {
    this.rootDir = this.getRootDir()
    this.configDir = this.getConfigDir()
    this.configDirExists = fs.existsSync(this.configDir)
  }

  /**
   * Get the project root dir
   * 
   * @returns {string} the root
   */
  getRootDir () {
    let { rootPath } = vscode.workspace
    if (!rootPath) {
      return './'
    }

    return rootPath[rootPath.length - 1] === '/'
      ? rootPath
      : rootPath + '/'
  }

  /**
   * Get the project config dir
   *
   * @returns {string} the config dir
   */
  getConfigDir () {
    return path.resolve(this.getRootDir(), this.configDirName)
  }

  /**
   * Get the path where the placeholder file will reside
   * 
   * @returns {string} the path
   */
  getPlaceholderPath () {
    return path.join(this.getConfigDir(), this.placeholderFileName)
  }

  /**
   * Get the path where the config file will reside
   *
   * @returns {string} the path
   */
  getConfigPath () {
    return path.join(this.getConfigDir(), this.configFileName)
  }

  getDefaultConfig () : Config.blank {
    return {
      connection: {
        host: '',
        username: '',
        password: '',
        privateKey: '',
        passphrase: '',
        port: ''
      },
      remotePath: './',
      ignore: ['.git', '.vscode', 'node_modules'],
      uploadOnSave: true,
      downloadOnOpen: true
    }
  }

  getDefaultConfigString () : string {
    this._init()
    return JSON.stringify(this.getDefaultConfig(), null, 2)
  }

  getLiveConfig () : Config.live {
    this._init()
    return JSON.parse(String(fs.readFileSync(path.join(this.configDir, this.configFileName))))
  }
}

const config = new Config()
export {
  config
}