import * as vscode from 'vscode'
const { window } = vscode

interface statusIconOptions {
  position: string,
  priority: number,
  tooltip: string,
  command: string,
  text: string
}

const StatusIcon = class StatusIcon {
  defaultText: string
  ref: vscode.StatusBarItem
  cycleInterval?: NodeJS.Timer

  constructor(options: statusIconOptions) {
    let pos
    if (options.position === 'right') {
      pos = vscode.StatusBarAlignment.Right
    } else {
      pos = vscode.StatusBarAlignment.Left
    }

    this.ref = window.createStatusBarItem(pos, options.priority)

    if (options.text) {
      this.setText(options.text)
      this.defaultText = options.text
    }

    if (options.tooltip) {
      this.setTooltip(options.tooltip)
    }

    if (options.command) {
      this.setCommand(options.command)
    }

    return this
  }

  startProcessing () {
    this.cycle(['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'], 200)

    return this
  }

  stopProcessing () {
    this.stopCycle()
    if (this.defaultText) {
      this.setText(this.defaultText)
    }
    
    return this
  }

  setText(text: string) {
    this.ref.text = text

    return this
  }

  setTooltip(tooltip: string) {
    this.ref.tooltip = tooltip

    return this
  }

  setCommand(command: string) {
    this.ref.command = command

    return this
  }

  cycle(states: string[], interval: number = 700) {
    let idx = 0
    this.cycleInterval = setInterval(() => {
      this.setText(states[idx])
      if (++idx === states.length) {
        idx = 0
      }
    }, interval)

    return this
  }

  stopCycle() {
    clearInterval(this.cycleInterval)

    return this
  }

  show() {
    this.ref.show()

    return this
  }

  hide() {
    this.ref.hide()

    return this
  }
}

export const statusIcon =
  new StatusIcon({
    position: 'left',
    priority: 0,
    text: '↑',
    tooltip: 'Sync down remote folder structure',
    command: 'remoteeditor.sync' // todo: change to something that shows a dropdown
  })
  .show()