import Q  = require('q');
import fs = require('fs');

/**
 * A wrapper for a file, with a bunch of extra helpful utilities
 */
export class File {
    /**
     * The absolute path to the file
     * @type {string}
     */
    private file : string;

    /**
     * The result og fs.stats
     * @type {fs.Stats}
     */
    private stats : fs.Stats;

    constructor(file : string) {
        this.file = file;
    }

    init () : Q.Promise<fs.Stats> {
        return this.stat().then<fs.Stats>((stats : fs.Stats) : fs.Stats => {
            this.stats = stats;

            return stats;
        });
    }


    stat() : Q.Promise<fs.Stats> {
        var deferredEntry = Q.defer<fs.Stats>();

        fs.stat(this.file, (err : ErrnoException, stats : fs.Stats) => {
            if (err) {
                return deferredEntry.reject(err);
            }

            deferredEntry.resolve(stats);
        });

        return deferredEntry.promise;
    }


    /**
     * Decerns if an entry has changed at all (contents, or if has been removed)
     * since this function (or File#init) was last called
     *
     * @return {Q.Promise<boolean>} Has the file changed or been removed since
     *                              this function or File#init was last called
     *
     * @todo Will always say the file has changed if it doesn't exist, even if
     *       it didn't exist when the object was created
     */
    modified() : Q.Promise<boolean> {
        // Start by checking if the file exists
        return this.exists().then<boolean>((exists : boolean) : Q.Promise<boolean> => {
            // If the file doesn't exist, we'll say it's been changed
            if (!exists) {
                return Q(true);
            }

            // If the file exists, check if it has been changed
            return this.changed();
        });
    }

    /**
     * Decerns if the content of a file has been changed
     * @return {Q.Promise<boolean>} Has the contents of the file between changed
     */
    changed() : Q.Promise<boolean> {
        return this.stat().then<boolean>((stats : fs.Stats) : boolean => {
            /**
             * Has the file changed at all?
             * @type {Boolean}
             */
            var changed : boolean;

            // If this function has never been called before, we'll say that
            // the file has changed
            changed = !this.stats;

            // If this function has been called before, check if the file
            // has been modified (by checking it's mtime)
            if (!changed) {
                changed = this.stats.mtime.getTime() !== stats.mtime.getTime();
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
     * @return {Q.Promise<boolean>} Does the file exist
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