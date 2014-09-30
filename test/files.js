/// <reference path="./boot.ts" />
var path = require('path');

var fs = require('q-io/fs');
var Q = require('q');

var Files = require('../src/files');
var Promise = require('./util/promise');

require('should');

describe('Files', function () {
    describe('Files.Folder', function () {
        /**
        * Path to our temporary working directory
        */
        var dir = path.join(__dirname, 'wk.tmp');

        /**
        * Helper function to wait for a certain amount of ms
        */
        function wait(ms) {
            if (typeof ms === "undefined") { ms = 1000; }
            return Q.promise(function (resolve) {
                setTimeout(function () {
                    return resolve(Q(true));
                }, ms);
            });
        }

        /**
        * Helper function to create our working directory
        */
        function createDirectory() {
            return fs.makeDirectory(dir);
        }

        /**
        * Helper function to remove our working directory
        */
        function removeDirectory() {
            return fs.exists(dir).then(function (exists) {
                return exists ? fs.removeTree(dir) : undefined;
            });
        }

        /**
        * Function to get an instance of the folder that works on
        * our working directory.
        */
        function getFolder() {
            return new Files.Folder(dir);
        }

        // Should delete the working directory before and after
        // each test
        beforeEach(function (d) {
            return removeDirectory().nodeify(d);
        });
        afterEach(function (d) {
            return removeDirectory().nodeify(d);
        });

        /**
        * Test the Files.Folder#exists method
        */
        describe('Files.Folder#exists', function () {
            it('should return false for not existing', function (done) {
                getFolder().exists().then(function (exists) {
                    exists.should.eql(false, 'Temp directory should not exist');
                    done();
                }).done();
            });

            it('should return true when existing', function (done) {
                createDirectory().then(function () {
                    return getFolder().exists();
                }).then(function (exists) {
                    exists.should.eql(true, 'Temp directory should exist');
                    done();
                }).done();
            });
        });

        /**
        * Test the Files.Folder#watchForChanges method
        */
        describe('Files.Folder#watchForChanges', function () {
            /**
            * Get an instance of Files.WatchForChanges to test with
            */
            function getWatcher(exts) {
                if (typeof exts === "undefined") { exts = ['scss']; }
                return getFolder().watchForChanges(exts);
            }

            /**
            * Get a changes promise
            */
            function getChanges(watcher) {
                if (typeof watcher === "undefined") { watcher = null; }
                if (!watcher) {
                    watcher = getWatcher();
                }

                return watcher.hasChanged();
            }

            /**
            * Helper function for creating a file
            */
            function createFile(ext, content) {
                if (typeof ext === "undefined") { ext = 'scss'; }
                if (typeof content === "undefined") { content = 'SomeContent'; }
                return fs.write(path.join(dir, 'file.' + ext), content);
            }

            /**
            * Helper function to rename file
            */
            function renameFile(ext) {
                if (typeof ext === "undefined") { ext = 'scss'; }
                return fs.move(path.join(dir, 'file.' + ext), path.join(dir, 'other.' + ext));
            }

            /**
            * Helper function to modify file
            */
            function modifyFile(ext) {
                if (typeof ext === "undefined") { ext = 'scss'; }
                return createFile(ext, 'SomeOtherContent');
            }

            it('should throw an error when directory does not exist', function (done) {
                Promise.TestPromise.make().test(getChanges()).shouldNotResolve().then(null, function (err) {
                    // Check that error is correct error
                    if (err instanceof Files.DoesNotExistError) {
                        return done();
                    }

                    throw err;
                }).done();
            });

            it('should not error for existing folders', function (done) {
                createDirectory().then(function () {
                    return getChanges();
                }).then(function () {
                    return done();
                }).done();
            });

            it('should detect new files being created', function (done) {
                var watcher;

                createDirectory().then(function () {
                    return watcher = getWatcher();
                }).then(function () {
                    return createFile();
                }).then(function () {
                    return getChanges(watcher);
                }).then(function (hasChanges) {
                    hasChanges.should.be.equal(true, 'Did not detect a change when adding a file');
                }).then(function () {
                    return done();
                }).done();
            });

            it('should ignore subsequent change calls', function (done) {
                var watcher;

                createDirectory().then(function () {
                    watcher = getWatcher();
                }).then(function () {
                    return createFile();
                }).then(function () {
                    return getChanges(watcher);
                }).then(function (hasChanges) {
                    hasChanges.should.be.equal(true, 'Did not detect a change when creating file');
                }).then(function () {
                    return getChanges(watcher);
                }).then(function (hasChanges) {
                    hasChanges.should.be.equal(false, 'Should not detect a change');
                }).then(function () {
                    return done();
                }).done();
            });

            it('should ignore creating files with wrong extension', function (done) {
                var watcher;

                createDirectory().then(function () {
                    watcher = getWatcher();
                }).then(function () {
                    return getChanges(watcher);
                }).then(function () {
                    return createFile('txt');
                }).then(function () {
                    return getChanges(watcher);
                }).then(function (hasChanges) {
                    hasChanges.should.be.equal(false, 'Did not ignore change to irrelevant file');
                }).then(function () {
                    return done();
                }).done();
            });

            it('should detect removing files', function (done) {
                var watcher;

                createDirectory().then(function () {
                    watcher = getWatcher();
                }).then(function () {
                    return createFile();
                }).then(function () {
                    return getChanges(watcher);
                }).then(function () {
                    return removeDirectory();
                }).then(function () {
                    return createDirectory();
                }).then(function () {
                    return getChanges(watcher);
                }).then(function (result) {
                    result.should.be.equal(true, 'Did not detect removing file');
                }).then(function () {
                    return done();
                }).done();
            });

            it('should detect renaming files', function (done) {
                var watcher;

                createDirectory().then(function () {
                    watcher = getWatcher();
                }).then(function () {
                    return createFile();
                }).then(function () {
                    return getChanges(watcher);
                }).then(function () {
                    return renameFile();
                }).then(function () {
                    return getChanges(watcher);
                }).then(function (result) {
                    result.should.be.equal(true, 'Did not detect renaming file');
                }).then(function () {
                    return done();
                }).done();
            });

            it('should detect modifying a file', function (done) {
                var watcher;

                createDirectory().then(function () {
                    watcher = getWatcher();
                }).then(function () {
                    return createFile();
                }).then(function () {
                    return getChanges(watcher);
                }).then(function () {
                    return wait();
                }).then(function () {
                    return modifyFile();
                }).then(function () {
                    return getChanges(watcher);
                }).then(function (result) {
                    result.should.be.equal(true, 'Did not detect changing file');
                }).then(function () {
                    return done();
                }).done();
            });
        });
    });
});
