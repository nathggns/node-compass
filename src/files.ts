/// <reference path="references/tsd.d.ts" />

import Q    = require('q');
import fs   = require('q-io/fs');
import path = require('path');
import _    = require('lodash');

import util = require('./util');

export class DoesNotExistError extends util.ErrorClass {
    name    = 'DoesNotExistError';
    message = 'file or folder does not exist';
}

/**
 * A wrapper for a file, with a bunch of extra helpful utilities
 */
export class File {
    /**
     * The absolute path to the file
     * @type {string}
     */
    private _path : string;

    /**
     * Public accessor for File#_path
     */
    get path() : string {
        return this._path;
    }

    /**
     * The result of fs.stats
     */
    private stats : fs.Stats;

    constructor(file : string) {
        this._path = file;
    }

    init () : Q.Promise<fs.Stats> {
        return this.stat().then<fs.Stats>((stats : fs.Stats) : fs.Stats => {
            this.stats = stats;

            return stats;
        });
    }


    stat() : Q.Promise<fs.Stats> {
        return fs.stat(this._path);
    }


    /**
     * Has an entry has changed at all (contents, or if has been removed)
     * since this function (or File#init) was last called
     *
     * @todo Will always say the file has changed if it doesn't exist, even if
     *       it didn't exist when the object was created
     */
    modified() : Q.Promise<boolean> {
        // Start by checking if the file exists
        return this.exists().then<boolean>((exists : boolean) : Q.Promise<boolean> => {
            // If the file doesn't exist, we'll say it's been changed
            if (!exists) {
                return Q<boolean>(true);
            }

            // If the file exists, check if it has been changed
            return this.changed();
        });
    }

    /**
     * Has the content of a file has been changed
     */
    changed() : Q.Promise<boolean> {
        return this.stat().then<boolean>((stats : fs.Stats) : boolean => {
            /**
             * Has the file changed at all?
             */
            var changed : boolean;

            // If this function has never been called before, we'll say that
            // the file has changed
            changed = !this.stats;

            // If this function has been called before, check if the file
            // has been modified (by checking it's mtime)
            if (!changed) {
                changed = this.stats.node.mtime.getTime() !== stats.node.mtime.getTime();
            }

            // If the file has changed, set the new stats and return true
            if (changed) {
                this.stats = stats;

                return true;
            }

            // The file hasn't changed
            return false;
        });
    }

    /**
     * Check if the file exists or not
     */
    exists() : Q.Promise<boolean> {
        // We'll use that stat function as that throws a certain exception
        // if the file doesn't exist
        return this.stat().then<boolean>(() => true, (err : ErrnoException) => {
            // If it's the exception for the file not existing, return false
            if (err.errno === 34) {
                return false;
            }

            // Throw the exception again
            throw err;
        });
    }
}

/**
 * A class that handles watching for changes in a
 * folder
 */
export class WatchFolderForChanges {

    /**
     * The folder we're working on
     */
    private folder : Folder;

    /**
     * The extensions that we care about
     */
    private exts   : string[];

    /**
     * The list of files that we currently know about
     * @type {string[]}
     */
    private files  : File[];

    /**
     * Create a watcher for changes in a directory
     */
    constructor(folder : Folder, exts : string[]) {
        this.folder = folder;
        this.exts   = exts.map((ext) => ext.toLowerCase());
    }

    /**
     * Detect if there has been any changes since this method was last called
     * Will always return true the first time this method is called
     */
    hasChanged() : Q.Promise<boolean> {
        return this.errorIfNotExists()
            .then<string[]>(() => this.list())
            .then<boolean>((files : string[]) : Q.Promise<boolean> => {    

                // If the files arrays are not exactly the same, update
                // our internal files array and return true
                if (!this.files || files.length !== this.files.length) {
                    return this.update(files);
                }

                /**
                 * The paths to each file
                 */
                var paths : string[] = _.pluck<File>(this.files, 'path');

                // If the we don't have the same files, we've detected a change 
                if (!_.isEqual(files, paths)) {
                    return this.update(files);
                }

                return Q.all<boolean>(this.files.map((file) => file.changed()))
                    .then(hasChanged => hasChanged.indexOf(true) > -1);
            });
    }

    /**
     * Update the internal store of files
     */
    private update(files : string[]) : Q.Promise<boolean> {
        var instances = files.map<File>((file) => new File(file));
        var promises  = instances.map((file) => file.init().then<File>(() => file));

        var promise = Q.all<File>(promises);

        return promise.then<boolean>((files) => {
            this.files = files;

            return true;
        });
    }

    /**
     * Throw a DoesNotExistsError if the folder does not exist
     */
    private errorIfNotExists() : Q.Promise<void> {
        return this.folder.exists().then(function(exists) {
            if (!exists) {
                throw new DoesNotExistError();
            }
        });
    }

    /**
     * List files that match the extension we're working on
     */
    private list() : Q.Promise<string[]> {
        return this.folder.list().then((files) => files.filter(
            (file) => this.exts.indexOf(path.extname(file).substr(1).toLowerCase()) > -1
        ));
    }
}

export class Folder {

    /**
     * The instance of file for the folder we're working on
     */
    private file : File;

    /**
     * The path to the folder we're working on 
     */
    get path() : string {
        return this.file.path;
    }

    constructor(path : string) {
        this.file = new File(path);
    }

    /**
     * List files in the folder
     */
    list() : Q.Promise<string[]> {
        return fs.list(this.path)
            .then((names : string[]) => names.map((name) => path.join(this.path, name)))
            .then((files : string[]) => files.sort());
    }

    /**
     * Check to see if the folder exists
     */
    exists() : Q.Promise<boolean> {
        return this.file.exists();
    }

    /**
     * Return an instance of WatchFolderForChanges for this folder
     */
    watchForChanges(exts: string[]) : WatchFolderForChanges  {
        return new WatchFolderForChanges(this, exts);
    }

}