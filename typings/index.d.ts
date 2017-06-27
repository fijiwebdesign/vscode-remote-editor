/// <reference path="globals/node/index.d.ts" />

declare type callback<T> = (err:NodeJS.ErrnoException, res:T) => any