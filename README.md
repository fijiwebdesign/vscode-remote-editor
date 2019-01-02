# vscode-remote-editor

This extension is no longer maintained. I would suggest using https://github.com/liximomo/vscode-sftp as it's more mature and achieves the same as this package.  I don't have the time to support this package anymore. 

## Visual Studio Remote Editor 

Allows editing remote files over SSH. 
Replicates the remote file structure locally and downloads, saves files on open, save in vscode. 

(__WIP__)

Please note this extension is very early and experimental. 

> *I strongly recommend creating adding your files to a git repo or backing them up before using this extension.*


## Bugs and Suggestions

Please report bugs or suggestion to: 
https://github.com/fijiwebdesign/vscode-remote-editor/issues


## Getting Started

Create a new folder and create a `.remote` file inside it.

### Example with password: 
```json
{
  "autoConnect": false,
  "connection": {
    "host": "xxx.xxx.xxx.xxx",
    "username": "neo",
    "password": "trinity",
    "port": "22"
  },
  "basePath": "./path/to/remote/project/",
  "ignore": [".git", "src/node_modules"]
}
```

### Example with privateKey
```json
{
  "autoConnect": true,
  "connection": {
    "host": "xxx.xxx.xxx.xxx",
    "username": "smith",
    "privateKey": "/Users/neo/.ssh/id_rsa",
    "passphrase": "mr anderson",
    "port": "22"
  },
  "basePath": "./path/to/remote/project/",
  "ignore": [".git", "src/node_modules"]
}
```

- `autoConnect` will automatically connect and sync the remote directory after loading the extension
- `port` is optional
- either `password` or `privateKey` and optional `passphrase` should be supplied. `privateKey` should be the absolute path to the privateKey. 
- `basePath` can be either absolute or relative to entrypoint of the connection (usually the user's home dir. e.g. `/home/example/` or `/Users/example/` or `c:\Users\example\`)
- `ignore` is optional. It is an array of paths, relative to the `basePath` which should be ignored and _not_ synced down.

For more `connection` options see `node-ssh` package on npm: https://www.npmjs.com/package/node-ssh

Click the ⇅ status bar icon or `ctrl+shift+p` / `cmd+shift+p` -> "Remote Editor > Connect remote SSH".

* The remote folder structure will be replicated locally (empty files).
* On opening a file the contents will be fetched from remote ssh connection on-the-fly
* On saving a file the contents will be saved to remote file

### Troubleshoot

* Look at the VSCode debug console for errors and debugging msgs. 

### Todo

* Show error modal or dialog when connection/transfer etc. errors 
* Rename directory/files locally renames remote file
* Move file locally moves remote
* Handle symbolic links
* Watch remote file changes
* Watch local file changes





