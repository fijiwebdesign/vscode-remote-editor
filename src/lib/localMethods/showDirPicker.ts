/// <reference path="../../../typings/localMethods.d.ts" />
/// <reference path="../../../typings/index.d.ts" />

import { getDirectories } from './getDirectories'
import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

/**
 * @function showDirPicker
 * @summary Shows a quickpicker, calling `callback` once the
 * user has selected a folder
 * @param {LocalMethods.dirPickerParams} params the context
 * of this quickpicker
 * @param {callback<string>} callback a node-style callback
 * which supplies the chosen directory name
 */
const showDirPicker = async function showDirPicker (params:LocalMethods.dirPickerParams, callback:callback<string>) {
  const isRootDir = (params.dir === path.resolve(params.dir, '..'))

  try {
    // Get an array of directory names
    let directories = await getDirectories(params.dir)

    // Convert the directory names into quickpick options
    const dirOptions = directories.map((directoryName) => {
      return {
        label: directoryName,
        description: path.resolve(params.dir, directoryName)
      }
    })

    // Create a list of options to show in the quickpick
    // (include a '.' current folder option)
    const options = [
      {label: '.', description: params.currentDirLabel || 'Use this directory'},
      {label: '..', description: params.upperDirLabel || 'Move up a level'},
      ...dirOptions
    ]

    // Pull the "up a folder" option out again if the
    // user can't go up a folder
    if (isRootDir) {
      options.splice(1,1)
    }

    // Show the quickpick and wait for the user's selection
    const selectedOption = await vscode.window.showQuickPick(options, {
      placeHolder: params.placeHolder || 'Select a folder'
    })

    const selectedPath = path.resolve(params.dir, path.basename(selectedOption.label))
    if (selectedOption.label === '.') {
      // The user has selected the current folder
      callback(null, selectedPath)
    } else {
      // The user has selected another folder, show a new quickpick
      // for that folder
      showDirPicker(Object.assign(params, {dir: selectedPath}), callback)
    }
  } catch (ex) {
    callback(ex, null)
  }
}

export {
  showDirPicker
}
