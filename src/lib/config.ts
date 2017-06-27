/// <reference path="../../typings/config.d.ts" />

import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

const Config = class Config {
  public rootDir:string
  public configDir:string
  public configDirExists:boolean
  public placeholderFileName:string
  public configFileName:string

  constructor () {
    this.rootDir = vscode.workspace.rootPath
    this.placeholderFileName = '.remote-editor-project-placeholder'
    this.configDir = this.rootDir + '/.vscode'
    this.configFileName = '.remoteconfig'
    this.configDirExists = fs.existsSync(this.configDir)
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
      ignore: ['.git', 'node_modules'],
      uploadOnSave: true,
      downloadOnOpen: true
    }
  }

  getDefaultConfigString () : string {
    return JSON.stringify(this.getDefaultConfig(), null, 2)
  }

  getLiveConfig () : Config.live {
    return JSON.parse(String(fs.readFileSync(path.join(this.configDir, this.configFileName))))
  }
}

const config = new Config()
export {
  config
}