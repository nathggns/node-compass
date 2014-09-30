/// <reference path="references/tsd.d.ts" />
import Q             = require('q');
import child_process = require('child_process');
import _             = require('lodash');
import fs            = require('fs');
import path          = require('path');

import Options       = require('./options');
import Logger        = require('./logger');
import util          = require('./util');
import Files         = require('./files');

/**
 * A map of boolean flags to their name in Options.Options
 */
var booleanFlags = {
    '--no-line-comments' : 'comments',
    '--relative-assets'  : 'relative'
};

/**
 * A map of string flags to their name in Options.Options
 * @type {Object}
 */
var stringFlags = {
    '-c'             : 'config_file',
    '-I'             : 'import_path',
    '--output-style' : 'mode',
    '--css-dir'      : 'css',
    '--sass-dir'     : 'sass',
    '--images-dir'   : 'img'
};

export interface Compiler {
    /**
     * Runs the compile operation
     */
    compile(overwrites ?: Object) : Q.Promise<number>;
}


/**
 * Compile a Compass Project
 */
export class CompassCompiler implements Compiler {

    /**
     * Stores the options we're provided with at compile time
     */
    private options : Options.Options;

    /**
     * Store the logger we're provided  
     */
    private logger : Logger.Logger;

    /**
     * List of Sass files we're tracking
     */
    private sassFiles : Files.File[] = [];

    /**
     * Configures the compiler with the passed options
     */
    constructor(options : Options.Options, logger : Logger.Logger = null) {

        if (!logger) {
            logger = new Logger.FakeLogger();
        }

        _.extend(this, {
            options : options,
            logger  : logger
        });
    }

    /**
     * Compile a compass project
     */
    compile(overwrites : Object = {}) : Q.Promise<number> {
        /**
         * Stored options extended with provided overwrites
         */
        var options = this.extendOptions(overwrites);

        /**
         * Should we compile the project?
         */
        var shouldCompile = this.shouldCompile(overwrites);

        return shouldCompile.then<number>((shouldCompile : boolean) : Q.Promise<number> => {
            // If we should compile, spawnCompass
            if (shouldCompile) {
                return this.spawnCompass();
            }

            if (options.logging) {
                this.logger.info('No changes. Skipping compilation');
            }

            // Return -1 if we didn't compile
            return Q(-1);
        });
    }

    /**
     * Return copy of stored options with provided overwrites
     * @param  {Object}          overwrites The overwrites you wish to apply
     * @return {Options.Options}            Stored options overwritten with
     *                                      provided overwrites
     */
    private extendOptions(overwrites : Object = {}) : Options.Options {
        return <Options.Options> _.extend({}, this.options, overwrites);
    }

    /**
     * Decides if we should compile the project or not based on a few conditions
     */
    private shouldCompile(overwrites : Object = {}) : Q.Promise<boolean> {

        /**
         * Stored options extended with provided overwrites
         */
        var options = this.extendOptions(overwrites);

        // If we don't want to cache the files, we should always compile
        if (!options.cache) {
            return Q(true);
        }

        return this.findSassFiles().then<boolean>((names : string[]) : Q.Promise<boolean> => {

            // If there is a different number of files then what we know about
            // something has definitely changed, so we can shortcut
            // the cache checking
            if (this.sassFiles.length !== names.length) {
                return Q(true);
            }

            // Array of promises representing if each file has changed
            var promises = this.sassFiles.map<Q.Promise<boolean>>(this.hasChanged);

            // Promise representing if anything has changed
            return Q.all<boolean>(promises).then(function(results) {
                return results.indexOf(true) > -1;
            });
        });
    }

    /**
     * Alias for Files.File#modified
     */
    private hasChanged(entry : Files.File) : Q.Promise<boolean> {
        return entry.modified();
    }

    private spawnCompass(overwrites : Object = {}) : Q.Promise<number> {
        /**
         * Stored options extended with provided overwrites
         */
        var options = this.extendOptions(overwrites);

        /**
         * Flags for the compass shell
         */
        var flags = this.buildFlags(overwrites);

        if (options.logging) {
            this.logger.info('Running command "' + options.command + ' ' + flags.join(' ') + '"');
        }

        /**
         * Deferred result of this function
         */
        var deferred = Q.defer<number>();

        /**
         * The spawned compass shell
         */
        var compass = child_process.spawn(
            options.command, flags, { cwd : options.project }
        );

        // If we want to do logging, start logging
        if (options.logging) {
            this.handleLogging(compass, overwrites);
        }

        // When compass exits, resolve the promise
        compass.on('exit', function(code : number) {
            deferred.resolve(code);
        });

        return deferred.promise.then<number>((code : number) : Q.Promise<number> => {

            // If we want to cache the files, cache them then return our result code
            if (options.cache) {
                return this.cacheFiles().then<number>(() : number => code);
            }

            return Q(code);
        });
    }

    private cacheFiles() : Q.Promise<void> {
        // First, empty our cache, we only want to store files that exist now
        this.sassFiles = [];

        /**
         * The folder in which sass files are stored
         */
        var parent = this.getSassPath();

        return this.findSassFiles().then((names : string[]) => {
            /**
             * Array of absolute paths to our css files
             */
            var files = names.map((name) => path.join(parent, name));

            /**
             * An array of promises containing a file object for each file
             */
            var promises = files.map<Q.Promise<Files.File>>(this.makeFile);

            /**
             * When we have the file objects, store them on the compiler
             */
            Q.all<Files.File>(promises)
                .then((fs) => this.sassFiles = fs)
                .done();
        });
    }

    /**
     * Convert an absolute path into an initiated file object
     */
    private makeFile(file : string) : Q.Promise<Files.File> {
        var entry = new Files.File(file);

        return entry.init().then(() => entry);
    }

    /**
     * Generate the path to the folder containing sass files
     * @return {string} The path to the folder containing sass files
     */
    private getSassPath(overwrites : Object = {}) : string {
        /**
         * Stored options extended with provided overwrites
         */
        var options = this.extendOptions(overwrites);

        return path.join(options.project, options.sass);
    }

    /**
     * Find the sass files in our project
     */
    private findSassFiles(overwrites : Object = {}) : Q.Promise<string[]> {
        /**
         * The path for the sass folder
         */
        var parent = this.getSassPath(overwrites);

        return Q<string[]>(util.findFilesWithExts(parent, ['scss', 'sass']));
    }

    /**
     * Builds flags for the compass shell
     * @param  {Object}   overwrites Any overwrites to the options
     *                               stored on the compiler
     * @return {string[]}            The array of flags
     */
    private buildFlags(overwrites : Object = {}) : string[] {
        /**
         * Stored options extended with provided overwrites
         */
        var options = this.extendOptions(overwrites);

        /**
         * Stores the flags that we're building
         * @type {string[]}
         */
        var flags : string[] = ['compile'];

        var flag;

        // Loop through our booleanFlags and append them to our flags array
        for (flag in booleanFlags) {
            if (!Object.prototype.hasOwnProperty.call(booleanFlags, flag)) {
                return;
            }

            if (options[booleanFlags[flag]]) {
                flags.push(flag);
            }
        }

        // Loop through our string flags and append them to our flags array
        for (flag in stringFlags) {
            if (!Object.prototype.hasOwnProperty.call(stringFlags, flag)) {
                return;
            }

            if (options[stringFlags[flag]]) {
                flags.push(flag, options[stringFlags[flag]]);
            }
        }

        return flags;
    }

    private handleLogging(compass : child_process.ChildProcess, overwrites : Object = {}) : void {

        // Set encodings so we know what we're dealing with
        compass.stdout.setEncoding('utf8');
        compass.stderr.setEncoding('utf8');

        // Redirect compass.stdout to the logger
        compass.stdout.on('data', this.logger.info.bind(this));

        // Redirect compass errors to the logger
        compass.stderr.on('data', function (data : string) {
            if (!data.match(/^\u001b\[\d+m$/)) {
                this.logger.error('\u001b[31mstderr:\u001b[0m ' + data);
            }
        });
    }
}