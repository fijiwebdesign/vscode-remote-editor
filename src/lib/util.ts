import * as path from 'path'

/**
 * Convert an async function into one which returns a promise instead
 * 
 * @param {Function} func The function to convert
 * @returns {Function} The promisified function
 */
function promisify (func: Function) {
  return function promisified (...args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      func(...args, (err, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    })
  }
}

/**
 * Path.join but always using forward-slashes
 *
 * @param {string[]} args 
 * @returns 
 */
function join (...args: string[]) {
  return path.join(...args).replace(/\\/g, '/')
}

export {
  promisify,
  join
}
