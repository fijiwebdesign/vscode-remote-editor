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