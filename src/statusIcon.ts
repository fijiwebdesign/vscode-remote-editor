interface statusIconOptions {
  position: string,
  priority: number,
  tooltip: string,
  command: string,
  text: string
}

import * as vscode from 'vscode'
const { window } = vscode

export const StatusIcon = class StatusIcon {
  ref: vscode.StatusBarItem
  cycleInterval?: NodeJS.Timer
  waitInterval

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
    }

    if (options.tooltip) {
      this.setTooltip(options.tooltip)
    }

    if (options.command) {
      this.setCommand(options.command)
    }

    return this
  }

  setText(text: string) {
    this.ref.text = text

    return this
  }

  setTextWait(text: string, timeout: number = 1000) {
    clearInterval(this.waitInterval)
    this.waitInterval = setTimeout(() => this.setText(text), timeout)

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

  cycleDots(msg: string, interval: number = 700) {
    this.cycle([msg + '   ', msg + '.  ', msg + '.. ', msg + '...'])

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
