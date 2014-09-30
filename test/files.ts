/// <reference path="./boot.ts" />

import path   = require('path');
import should = require('should');
import fs     = require('q-io/fs');
import Q      = require('q');

import Files   = require('../src/files');
import Promise = require('./util/promise');

require('should');

describe('Files', function() {
    describe('Files.Folder', function() {

        /**
         * Path to our temporary working directory
         */
        var dir = path.join(__dirname, 'wk.tmp');

        /**
         * Helper function to wait for a certain amount of ms
         */
        function wait(ms = 1000) : Q.Promise<boolean> {
            return Q.promise<boolean>(resolve => {
                setTimeout(() => resolve(Q(true)), ms);
            });
        }

        /**
         * Helper function to create our working directory
         */
        function createDirectory() : Q.Promise<void> {
            return fs.makeDirectory(dir);
        }

        /**
         * Helper function to remove our working directory
         */
        function removeDirectory() : Q.Promise<void> {
            return fs.exists(dir)
                .then<void>(
                    (exists) => exists ? fs.removeTree(dir) : undefined
                );
        }

        /**
         * Function to get an instance of the folder that works on
         * our working directory.
         */
        function getFolder() : Files.Folder {
            return new Files.Folder(dir);
        }

        // Should delete the working directory before and after
        // each test
        beforeEach((d) => removeDirectory().nodeify(d));
        afterEach((d) => removeDirectory().nodeify(d));

        /**
         * Test the Files.Folder#exists method
         */
        describe('Files.Folder#exists', function() {

            it('should return false for not existing', function(done) {
                getFolder().exists()
                    .then(function(exists) {
                        exists.should.eql(false, 'Temp directory should not exist');
                        done();
                    })
                    .done();
            });


            it('should return true when existing', function(done) {
                createDirectory()
                    .then(() => getFolder().exists())
                    .then(function(exists) {
                        exists.should.eql(true, 'Temp directory should exist');
                        done();
                    })
                    .done();
            });

        });

        /**
         * Test the Files.Folder#watchForChanges method
         */
        describe('Files.Folder#watchForChanges', function() {

            /**
             * Get an instance of Files.WatchForChanges to test with
             */
            function getWatcher(exts : string[] = ['scss']) {
                return getFolder().watchForChanges(exts);
            }

            /**
             * Get a changes promise
             */
            function getChanges(watcher : Files.WatchFolderForChanges = null) : Q.Promise<boolean> {

                if (!watcher) {
                    watcher = getWatcher();
                }

                return watcher.hasChanged();
            }

            /**
             * Helper function for creating a file
             */
            function createFile(ext = 'scss', content = 'SomeContent') : Q.Promise<void> {
                return fs.write(path.join(dir, 'file.' + ext), content);
            }


            /**
             * Helper function to rename file
             */
            function renameFile(ext = 'scss') : Q.Promise<void> {
                return fs.move(
                    path.join(dir, 'file.' + ext),
                    path.join(dir, 'other.' + ext)
                );
            }

            /**
             * Helper function to modify file
             */
            function modifyFile(ext = 'scss') : Q.Promise<void> {
                return createFile(ext, 'SomeOtherContent');
            }

            it('should throw an error when directory does not exist', function(done) {

                 Promise.TestPromise.make<boolean>()
                     .test(getChanges())
                     // Should not resolve, as we're expecting an error
                     .shouldNotResolve()
                     .then<void>(null, function(err) {
                         // Check that error is correct error
                         if (err instanceof Files.DoesNotExistError) {
                             return done();
                         }

                         throw err;
                     })
                     .done();
            });

            it('should not error for existing folders', function(done) {

                 createDirectory()
                     .then(() => getChanges())
                     .then(() => done())
                     .done();

            });

            it('should detect new files being created', function(done) {

                 var watcher : Files.WatchFolderForChanges;

                 createDirectory()
                     .then(() => watcher = getWatcher())
                     .then(() => createFile())
                     .then<boolean>(() => getChanges(watcher))
                     .then<void>(function(hasChanges) {
                         hasChanges.should.be.equal(
                             true, 'Did not detect a change when adding a file'
                         );
                     })
                     .then(() => done())
                     .done();
            });

            it('should ignore subsequent change calls', function(done) {
                 var watcher : Files.WatchFolderForChanges;

                 createDirectory()
                     .then(() => { watcher = getWatcher(); })
                     .then(() => createFile())
                     .then(() => getChanges(watcher))
                     .then(function(hasChanges) {
                         hasChanges.should.be.equal(
                             true, 'Did not detect a change when creating file'
                         );
                     })
                     .then(() => getChanges(watcher))
                     .then(function(hasChanges) {
                         hasChanges.should.be.equal(
                             false, 'Should not detect a change'
                         );
                     })
                     .then(() => done())
                     .done();
            });

            it('should ignore creating files with wrong extension', function(done) {
                 var watcher : Files.WatchFolderForChanges;

                 createDirectory()
                     .then(() => { watcher = getWatcher(); })
                     .then(() => getChanges(watcher))
                     .then(() => createFile('txt'))
                     .then(() => getChanges(watcher))
                     .then((hasChanges) => {
                         hasChanges.should.be.equal(
                             false, 'Did not ignore change to irrelevant file'
                         );
                     })
                     .then(() => done())
                     .done();
            });

            it('should detect removing files', function(done) {
                 var watcher : Files.WatchFolderForChanges;

                 createDirectory()
                     .then(() => { watcher = getWatcher(); })
                     .then(() => createFile())
                     .then(() => getChanges(watcher))
                     .then(() => removeDirectory())
                     .then(() => createDirectory())
                     .then(() => getChanges(watcher))
                     .then((result) => {
                         result.should.be.equal(
                             true, 'Did not detect removing file'
                         );
                     })
                     .then(() => done())
                     .done();
            });

            it('should detect renaming files', function(done) {
                 var watcher : Files.WatchFolderForChanges;

                 createDirectory()
                     .then(() => { watcher = getWatcher(); })
                     .then(() => createFile())
                     .then(() => getChanges(watcher))
                     .then(() => renameFile())
                     .then(() => getChanges(watcher))
                     .then((result) => {
                         result.should.be.equal(
                             true, 'Did not detect renaming file'
                         );
                     })
                     .then(() => done())
                     .done();
            });

            it('should detect modifying a file', function(done) {
                var watcher : Files.WatchFolderForChanges;

                createDirectory()
                    .then(() => { watcher = getWatcher(); })
                    .then(() => createFile())
                    .then(() => getChanges(watcher))
                    .then(() => wait())
                    .then(() => modifyFile())
                    .then(() => getChanges(watcher))
                    .then((result) => {
                        result.should.be.equal(
                            true, 'Did not detect changing file'
                        );
                    })
                    .then(() => done())
                    .done();
            });
        });

    });
});