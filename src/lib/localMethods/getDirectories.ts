import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

/**
 * @function getDirectories
 * @summary returns an array of all directories inside a directory
 * @param {string} baseDir the directory to search in
 * @returns {Promise<string[]>} A promise which resolves to an array
 * of directory names
 */
const getDirectories = function getDirectories (baseDir:string) : Promise<string[]> {
  return new Promise((resolve, reject) => {
    fs.readdir(baseDir, function onReadDir (err, fileList:string[]) : any {
      if (err) {
        return reject(err)
      }

      // Filter out any files, keeping only dirs
      fileList = fileList.filter(function filterFiles (filePath) {
        return fs.statSync(path.join(baseDir, filePath)).isDirectory()
      })
      resolve(fileList)
    })
  })
}

export {
  getDirectories
}