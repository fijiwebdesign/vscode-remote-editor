import { config } from '../lib/config'
import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import * as mkdirp from 'mkdirp'
import * as localMethods from './localMethods'

/**
 * @class LocalController
 */
const LocalController = class LocalController {
  /**
   * @method getNewDirPath
   * @summary gets a dir from the user which doesn't yet exist
   * @memberOf LocalController
   * @returns {Promise<string>} A promise which resolves into
   * the path for the new directory
   */
  getNewDirPath () : Promise<string> {
    return new Promise((resolve, reject) => {
      // Show the user a quickpick to get the base path
      const params = {
        dir: config.rootDir,
        placeHolder: 'Where would you like to create the project?',
        currentDirLabel: 'Create the project here'
      }

      localMethods.showDirPicker(params, function afterFolderSelected (err, res) {
        if (err || !res) {
          reject(err || new Error('No path selected'))
        } else {
          // Now get the new folder name from them
          vscode.window
            .showInputBox({
              prompt: 'Enter the name of the new project',
              placeHolder: 'e.g. myApp'
            })
            .then(function afterGotFolderName (name) {
              if (!name) {
                return reject(new Error('No path selected'))
              }

              // Join the base path and new folder name
              const fullPath = path.join(res, name)
              if (fs.existsSync(fullPath)) {
                reject('Folder exists')
              } else {
                // Folder doesn't exist - return the full path
                resolve(fullPath)
              }
            }, function onError (error) {
              reject(error)
            })
        }
      })
    })
  }

  /**
   * @method mkdir
   * @summary creates a directory
   * @memberOf LocalController
   * @param {string} absPath the absolute path to the directory to create
   */
  mkdir (absPath:string) : void {
    mkdirp(absPath)
  }

  /**
   * @method createPlaceholderFile
   * @summary creates a placeholder file in a .vscode
   * directory in the supplied dir
   * @memberOf LocalController
   * @param {string} dirPath the project folder
   */
  createPlaceholderFile (dirPath:string) : void {
    const vscodeDir = path.join(dirPath, '.vscode')
    if (!fs.existsSync(vscodeDir)) {
      this.mkdir(vscodeDir)
    }
    fs.writeFileSync(path.join(vscodeDir, config.placeholderFileName), '')
  }

  /**
   * @method processPlaceholderFile
   * @summary removes a placeholder file and creates
   * a remote config file in its place
   * @memberOf LocalController
   */
  processPlaceholderFile () : void {
    if (localMethods.doesPlaceholderExist()) {
      // Remove the placeholder
      fs.unlink(path.join(config.configDir, config.placeholderFileName))
      
      const configFilePath = path.join(config.configDir, config.configFileName)

      // Create the config file
      fs.writeFile(configFilePath, config.getDefaultConfigString(), function onAfterWriteConfig (err) {
        if (err) {
          throw new Error('Unable to write config file')
        }

        vscode.workspace
          .openTextDocument(vscode.Uri.file(configFilePath))
          .then(function onAfterFileLoad (file) {
            vscode.window.showTextDocument(file)
          })
      })
    }
  }

  handleChangesToConfigFile (fileContents:string) : void {
    try {
      const configuration = JSON.parse(fileContents)

    } catch (ex) {
      vscode.window.showErrorMessage('Configuration is not valid JSON')
    }
  }

  listenForChangesToConfigFile () : void {
    vscode.workspace.onDidSaveTextDocument((textDocument: vscode.TextDocument) => {
      if (textDocument.fileName === config.configFileName) {
        this.handleChangesToConfigFile(textDocument.getText())
      }
    })
  }
}

const localController = new LocalController()
export {
  localController
}
