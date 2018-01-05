/**
    RemoteModel class.

    It helps managing a model instance, model versions
    for in memory modification, and the process to
    receive or send the model data
    to a remote sources, with glue code for the tasks
    and state properties.

    Every instance or subclass must implement
    the fetch and pull methods that knows the specifics
    of the remotes.

    TODO Implement fix for Concurrent Requests. There are less chances
    to that happens with the uses of this class, but still good to have.
    Currently implemented in the others ListRemoteModel, GroupRemoteModel
    and GroupListRemoteModel, but there is some logic here to re-order before
    trying since seems easy to introduce a serious bug right now.
**/
'use strict';

var ModelVersion = require('../../utils/ModelVersion');
var CacheControl = require('./CacheControl');
var ko = require('knockout');
var localforage = require('../drivers/localforage');
var EventEmitter = require('events').EventEmitter;

function RemoteModel(options) {

    EventEmitter.call(this);

    options = options || {};

    var firstTimeLoad = true;

    // Marks a lock loading is happening, any user code
    // must wait for it
    this.isLoading = ko.observable(false);
    // Marks a lock saving is happening, any user code
    // must wait for it
    this.isSaving = ko.observable(false);
    // Marks a background synchronization: load or save,
    // user code knows is happening but can continue
    // using cached data
    this.isSyncing = ko.observable(false);
    // Utility to know whether any locking operation is
    // happening.
    // Just loading or saving
    this.isLocked = ko.pureComputed(function(){
        return this.isLoading() || this.isSaving();
    }, this);

    if (!options.data)
        throw new Error('RemoteModel data must be set on constructor and no changed later');
    this.data = options.data;

    this.cache = new CacheControl({
        ttl: options.ttl
    });

    this.clearCache = function clearCache() {
        this.cache.latest = null;
        this.data.model.reset();
        // A cache cleared must left a state of 'no previous load'
        // and that includes to force behave as 'is the first time'
        firstTimeLoad = true;
    };

    // Optional name used to persist a copy of the data as plain object
    // in the local storage on every successfully load/save operation.
    // With no name, no saved (default).
    // It uses 'localforage', so may be not saved using localStorage actually,
    // but any supported and initialized storage system, like WebSQL, IndexedDB or LocalStorage.
    // localforage must have a set-up previous use of this option.
    this.localStorageName = options.localStorageName || null;

    // Recommended way to get the instance data
    // since it ensures to launch a load of the
    // data each time is accessed this way.
    this.getData = function getData() {
        this.load();
        return this.data;
    };

    this.newVersion = function newVersion() {
        var v = new ModelVersion(this.data);

        // Update the version data with the original
        // after a lock load finish, like the first time,
        // since the UI to edit the version will be lock
        // in the middle.
        this.isLoading.subscribe(function (isIt) {
            if (!isIt) {
                v.pull({ evenIfNewer: true });
            }
        });

        // new method for push and remote same returning
        // the save promise to track immediate success or error,
        // with error auto recovering original data.
        v.pushSave = function pushSave() {
            var rollback = v.getRollback('original');
            v.push({ evenIfObsolete: true });

            return this.save()
            .then(function() {
                // Update the version data with the new one
                // from the remote, that may include remote computed
                // values:
                v.pull({ evenIfNewer: true });
            })
            .catch(function(error) {
                // Performs a rollback of the original model
                rollback();
                // The version data keeps untouched, user may want to retry
                // or made changes on its un-saved data.
                // rethrow error
                throw error;
            });
        }.bind(this);

        return v;
    };

    this.fetch = options.fetch || function fetch() { throw new Error('Not implemented'); };
    this.push = options.push || function push() { throw new Error('Not implementd'); };

    this.loadFromLocal = function loadFromLocal() {
        var data = this.data;
        return localforage.getItem(this.localStorageName)
        .then(function(localData) {
            if (localData) {
                data.model.updateWith(localData, true);
            }
            return localData;
        });
    };

    var loadFromRemote = function loadFromRemote() {
        return this.fetch()
        .then(function (serverData) {
            if (serverData) {
                // Ever deepCopy, since plain data from the server (and any
                // in between conversion on 'fecth') cannot have circular
                // references:
                this.data.model.updateWith(serverData, true);

                // persistent local copy?
                if (this.localStorageName) {
                    localforage.setItem(this.localStorageName, serverData);
                }
            }
            else {
                throw new Error('Remote model did not returned data, response must be a "Not Found"');
            }

            // Event
            if (this.isLoading()) {
                this.emit('loaded', serverData);
            }
            else {
                this.emit('synced', serverData);
            }

            // Finally: common tasks on success or error
            this.isLoading(false);
            this.isSyncing(false);

            this.cache.latest = new Date();
            return this.data;
        }.bind(this))
        .catch(function(err) {

            var wasLoad = this.isLoading();

            // Finally: common tasks on success or error
            this.isLoading(false);
            this.isSyncing(false);

            // Event
            var errPkg = {
                task: wasLoad ? 'load' : 'sync',
                error: err
            };
            // Be careful with 'error' event, is special and stops execution on emit
            // if no listeners attached: overwritting that behavior by just
            // print on console when nothing, or emit if some listener:
            if (EventEmitter.listenerCount(this, 'error') > 0) {
                this.emit('error', errPkg);
            }
            else {
                // Log it when not handled (even if the promise error is handled)
                console.error('RemoteModel Error', errPkg);
            }

            // Rethrow error
            throw err;
        }.bind(this));
    }.bind(this);

    this.load = function load(options /*{ forceRemoteUpdate:false }*/) {
        /* eslint complexity:"off" */
        options = options || {};
        if (options.forceRemoteUpdate || this.cache.mustRevalidate()) {

            if (firstTimeLoad)
                this.isLoading(true);
            else
                this.isSyncing(true);

            var promise = null;

            // If local storage is set for this, load first
            // from local, then follow with syncing from remote
            if (!options.forceRemoteUpdate &&
                firstTimeLoad &&
                this.localStorageName) {

                promise = this.loadFromLocal()
                .then(function(localData) {
                    if (localData) {
                        // Load done:
                        this.isLoading(false);
                        this.isSyncing(false);

                        // Local load done, do a background
                        // remote load.
                        loadFromRemote()
                        // Catch any promise-error on the remote, to avoid
                        // unexpected errors being uncatch, they still can be
                        // catch using the 'error' event on the RemoteModel instance.
                        .catch(function() { });
                        // just don't wait, return current
                        // data
                        return this.data;
                    }
                    else {
                        // When no data, perform a remote
                        // load and wait for it:
                        return loadFromRemote();
                    }
                }.bind(this));
            }
            else {
                // Perform the remote load:
                promise = loadFromRemote();
            }

            // First time, blocking load:
            // it returns when the load returns
            if (firstTimeLoad) {
                firstTimeLoad = false;
                // Returns the promise and will wait for the first load:
                return promise;
            }
            else {
                // Background load: is loading still
                // but we have cached data so we use
                // that for now.
                // Catch any promise-error on the remote, to avoid
                // unexpected errors being uncatch, they still can be
                // catch using the 'error' event on the RemoteModel instance.
                promise.catch(function() { });
                // If anything new from outside
                // versions will get notified with isObsolete()
                return Promise.resolve(this.data);
            }
        }
        else {
            // Return cached data, no need to load again for now.
            return Promise.resolve(this.data);
        }
    };

    this.saveLocal = function() {
        // persistent local copy?
        if (this.localStorageName) {
            return localforage.setItem(this.localStorageName, this.data.model.toPlainObject(true));
        }
        else {
            // No local enabled
            return Promise.resolve(null);
        }
    };

    /**
     * @param {Object} [data] Optional plain data that wants to be saved that
     * have proper structure; will default to the current copy of the data; must
     * be supported by the implementation of the 'push' function
     */
    this.save = function save(data) {
        this.isSaving(true);

        // Preserve the timestamp after being saved
        // to avoid false 'obsolete' warnings with
        // the version that created the new original
        var ts = this.data.model.dataTimestamp();

        return this.push(data)
        .then(function (serverData) {
            // Ever deepCopy, since plain data from the server
            // cannot have circular references:
            this.data.model.updateWith(serverData, true);
            this.data.model.dataTimestamp(ts);

            // persistent local copy?
            if (this.localStorageName) {
                localforage.setItem(this.localStorageName, serverData);
            }

            // Event
            this.emit('saved', serverData);

            // Finally: common tasks on success or error
            this.isSaving(false);

            this.cache.latest = new Date();
            return this.data;
        }.bind(this))
        .catch(function(err) {
            // Finally: common tasks on success or error
            this.isSaving(false);

            // Event
            var errPkg = {
                task: 'save',
                error: err
            };
            // Be careful with 'error' event, is special and stops execution on emit
            // if no listeners attached: overwritting that behavior by just
            // print on console when nothing, or emit if some listener:
            if (EventEmitter.listenerCount(this, 'error') > 0) {
                this.emit('error', errPkg);
            }
            else {
                // Log it when not handled (even if the promise error is handled)
                console.error('RemoteModel Error', errPkg);
            }

            // Rethrow error
            throw err;
        }.bind(this));
    };

    /**
        Launch a syncing request. Returns nothing, the
        way to track any result is with events or
        the instance observables.
        IMPORTANT: right now is just a request for 'load'
        that avoids promise errors from throwing.
    **/
    this.sync = function sync(options) {
        // Call for a load, that will be treated as 'syncing' after the
        // first load
        this.load(options)
        // Avoid errors from throwing in the console,
        // the 'error' event is there to track anyone.
        .catch(function() {});
    };

    /**
     * Provides a callback to receive plain data after any kind of update.
     * Allows to dispose/cancel the subscription with the returned object
     * @param {function<data, void>} cb
     * @returns {Object} The method 'dispose' cancels any notification of changes.
     */
    this.subscribeDataChanges = function(cb) {
        this.on('loaded', cb);
        this.on('synced', cb);
        this.on('saved', cb);
        return {
            dispose: function() {
                this.removeListener('loaded', cb);
                this.removeListener('synced', cb);
                this.removeListener('saved', cb);
            }.bind(this)
        };
    };

    /**
     * Returns a promise that resolves immediatelly if there is some content
     * loaded, waits to resolve when a pending loading ends or triggers a first
     * time load and resolves when ends.
     * Is a convenient and alternative API to load/sync that doesn't try to
     * load at any time, just having some data is enough.
     * @returns {Promise}
     */
    this.whenLoaded = function() {
        // Something loaded?
        if (this.cache.latest) {
            return Promise.resolve();
        }
        else if (this.isLoading()) {
            // Is on the works, wait for 'load' to be called
            return new Promise(function(resolve) {
                this.on('loaded', function() {
                    resolve();
                });
            }.bind(this));
        }
        else {
            // Request a load and wait for it (no returning data, just ending)
            return this.load().then(function() {});
        }
    };
}

module.exports = RemoteModel;

RemoteModel._inherits(EventEmitter);
