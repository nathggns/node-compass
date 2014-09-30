/// <reference path="references/tsd.d.ts" />

import Q    = require('q');
import fs   = require('fs');
import path = require('path');

/**
 * A class for easily extending exceptions
 */
export class ErrorClass {

    name : string;
    message : string;

    constructor(message : string = null) {
        this.message = message || this.message;
    }
}

/**
 * Find files in a directory that match a set of extensions
 */
export function findFilesWithExts(dir : string, exts : string[]) : Q.Promise<string[]> {
    /**
     * Deferred list of files that match the passed extensions
     */
    var deferredFiles = Q.defer<string[]>();

    // Format the exts properly due to how path.extname works
    exts = exts.map(function(ext : string) {
        return ext.substr(0, 1) === '.' ? ext.toLowerCase() : '.' + ext.toLowerCase();
    });

    fs.readdir(dir, function(err : ErrnoException, files : string[]) {
        if (err) {
            return deferredFiles.reject(err);
        }

        // Filter files to only include the files with the correct extensions
        files = files.filter(function(file : string) {
            return exts.indexOf(path.extname(file)) !== -1;
        });

        // Resolve the promise
        deferredFiles.resolve(files);
    });

    return deferredFiles.promise;
}