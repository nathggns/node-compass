import Q    = require('q');
import fs   = require('fs');
import path = require('path');

/**
 * A class for easily extending exceptions
 */
export class ErrorClass {

    name : string;
    message : string;

    construct(message : string) {
        this.message = message;
    }
}

/**
 * Implementing this interface will allow you to loop over an object
 * more easily
 */
export interface ObjectWithIndexer {
    [index : string] : any;
}

/**
 * Cast an object to ObjectWithIndexer type
 *
 * NOTE This will do nothing in the JS runtime, as it is a cast
 * in the typescript run time.
 */
export function addIndexer(object : Object) {
    return <ObjectWithIndexer> object;
}

/**
 * Find files in a directory that match a set of extensions
 * @param {string}   dir  The directory to look in
 * @param {string[]} exts The extensions to look for
 * @return {Q.Promise<string[]>} File names that match extensions
 */
export function findFilesWithExts(dir : string, exts : string[]) : Q.Promise<string[]> {
    /**
     * Deferred list of files that match the passed extensions
     * @type {Q.Deferred<string[]>}
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