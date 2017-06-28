import { getDirectories } from './getDirectories'
import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

interface dirPickerParams {
  dir: string,
  currentDirLabel?: string,
  upperDirLabel?: string,
  placeholder?: string
}

/**
 * Shows a quickpicker, returning once the user has selected a folder
 *
 * @async
 * @param {LocalMethods.dirPickerParams} params the context
 * of this quickpicker
 */
const showDirPicker = async function showDirPicker (
  params: dirPickerParams
) {
  params.dir = params.dir || './'
  const isRootDir = (params.dir === path.resolve(params.dir, '..'))

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
    {label: '.', description: params.currentDirLabel || 'use this directory'},
    {label: '..', description: params.upperDirLabel || 'move up a level'},
    ...dirOptions
  ]

  // Pull the "up a folder" option out again if the
  // user can't go up a folder
  if (isRootDir) {
    options.splice(1,1)
  }

  // Show the quickpick and wait for the user's selection
  const { label } = await vscode.window.showQuickPick(options, {
    placeHolder: params.placeholder || 'Select a folder'
  })

  const selectedPath = path.resolve(params.dir, path.basename(label))
  if (label === '.') {
    // The user has selected the current folder
    return selectedPath
  } else {
    // The user has selected another folder, show a new quickpick
    // for that folder
    return await showDirPicker(Object.assign(params, {dir: selectedPath}))
  }
}

export {
  showDirPicker
}
