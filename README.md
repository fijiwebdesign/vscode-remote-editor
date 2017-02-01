# vscode-remote-editor
Grab files on-the-fly from a remote fs over SSH
(__WIP__)


## Getting Started

Create a new folder and create a `.remote` file inside it.
```json
{
  "connection": {
    "host": "xxx.xxx.xxx.xxx",
    "username": "example",
    "password": "letmein",
    "port": "22"
  },
  "basePath": "./path/to/remote/project/",
  "ignore": [".git", "src/node_modules"]
}
```

- `port` is optional
- either `password` or `keyFile` should be supplied. (`keyFile` must be a string containing the contents of your keyFile for now. In the future, the field will accept a `/path/to/keyfile` syntax too)
- `basePath` can be either absolute or relative to entrypoint of the connection (usually the user's home dir. e.g. `/home/example/` or `/Users/example/` or `c:\Users\example\`)
- `ignore` is optional. It is an array of paths, relative to the `basePath` which should be ignored and _not_ synced down.


Click the two arrows in the status bar or `ctrl+shift+p` / `cmd+shift+p` -> 'connectRemote'.
The remote folder structure will be replicated locally

### That's it!
From now on, when you open a file, the contents will be brought in from the server on-the-fly. 

Over the next few days, extra core functionality will be added. Such as pushing changes back up to the remote fs on save, extension startup improvements & other bits.



