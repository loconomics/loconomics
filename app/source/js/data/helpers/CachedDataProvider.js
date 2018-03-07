/**
 * Cached Data Provider class, it let's to load, save, delete remote data keeping
 * a local cache for faster loads or even to enable working offline.
 * The basic tasks against remote are pretty straightforward: just make
 * requests for 'get, post, put, delete' with given data/query and return the
 * result.
 * But keeping a local cache, updated and invalidated properly, enforcing
 * a caching strategy is a bit more complicated.
 * For this class doesn't matters if the data is an object/item or an array/list,
 * doesn't expect something specific, is managed as a single thing without
 * making assumptions on content or doing more advanced things like indexing,
 * still allows to be used in APIs like 'fetch item by ID' or 'pull a list of
 * items, full or filtered by query', and not just for 'singleton, simple objects',
 * by accepting the implementation calls to both remote and local where that
 * logic is implemented and that ones are really simple to implement.
 *
 * All elements are documented and annotated, but more relevant API for usage are:
 * - onLoad
 * - onceLoaded
 * - save
 * - delete
 * - constructor: {
 *   ttl: number // of milliseconds
 *   remote: { fetch(), push(data), delete() } // returning Promises.
 *   local: { fetch(), push(data), delete() } // returning Promises
 * }
 *
 * Check IDataProviderDriver type definition at separated file.
 *
 * Not all cases where this class is used need to allow all the methods provided: not
 * allowing 'delete' is common for lists APIs, same with `save` for queries or prefixed/enforced
 * data. That's fine, and the remote/local implementations don't need to include them;
 * use the data module docs to specify which APIs are possible. But take care that
 * the local 'delete' method is needed for cache removal, even if the related
 * remote API does not allows deleting the data.
 *
 * IMPORTANT: Never use externally members prefixed with underscore, are expected to be
 * private and can change/break at any point because of implementation details.
 *
 * NOTE: At the bottom are some inlined utilities and type definitions, plus
 * some IDEAs.
 *
 * @example Example with simple inlined providers, usually utilities for them
 * are created to reuse on different data modules.
 * ```
 * const api = new CachedDataProvider({
 *    // 1 minute
 *    ttl: 1 * 60 * 1000,
 *    // basic example with jQuery, preferible using 'fetch' or a specialized class for the app REST API.
 *    remote: {
 *        fetch: () => Promise.resolve(jQuery.get('url')),
 *        push: (data) => Promise.resolve(jQuery.ajax({ method: 'put', url: 'url', data: data })),
 *        delete: () => Promise.resolve(jQuery.ajax({ method: 'delete', url: 'url' }))
 *    },
 *    // needs to fix: parse/stringify should happen inside a promise to reject properly on error
 *    local: {
 *        fetch: () => localStorage.cachedDataName && Promise.resolve(JSON.parse(localStorage.cachedDataName)),
 *        push: (data) => (localStorage.cachedDataName = JSON.stringify(data)) && Promise.resolve(),
 *        delete: () => (delete localStorage.cachedDataName) && Promise.resolve()
 *    }
 * });
 * ```
 */

import AggregatedEvent from '../../utils/SingleEvent/AggregatedEvent';
import ReactiveEvent from '../../utils/SingleEvent/ReactiveEvent';
import SingleEvent from '../../utils/SingleEvent';

export default class CachedDataProvider {
    /**
     *
     * @param {Object} settings
     * @param {number} settings.ttl Time-To-Life for the cached data, as milliseconds
     * Advice: to provide this value can be more expressive to use utils like momentjs 'duration'
     * type that let you specify time in units and convert it to milliseconds
     * as for example: `moment.duration({ hours: 1, minutes: 30 }).asMilliseconds()
     * @param {IDataProviderDriver} settings.remote Driver to interact with remote
     * data, that is expected to have the 'source of truth' regarding the valid
     * data (and slower than local data).
     * @param {IDataProviderDriver} settings.local Driver to interact with local
     * data, that is expected to be low latency, faster than remote and so
     * holding a cache. The driver provided doesn't need to know how is the
     * stored structure that includes both data and cache metadata, just
     * using it 'as is'.
     */
    constructor(settings) {
        /// Enforce required settings
        if (!settings.ttl) {
            throw new Error('Setting "ttl" is required');
        }
        if (!settings.remote) {
            throw new Error('Setting "remote" is required');
        }
        if (!settings.local) {
            throw new Error('Setting "local" is required');
        }

        /// Cache Events
        // (declared before __localCache so is available for the internal references)
        /**
         * Notification when data has being stored in the cache.
         * It includes the data.
         * NOTE: data is stored in the cache usually as a result of onRemoteLoaded
         * and onSaved; that's a write operation excluding removal.
         * @member {SingleEvent<any>}
         */
        this.onCachedData = new SingleEvent(this);
        /**
         * Notification when the content of the cache has changed, any write
         * operation on the data, but not on metadata, meaning that some
         * data was stored or removed.
         * It includes the data except when is a removal that is null.
         * NOTE: the cache changes usually as a result of onRemoteLoaded,
         * onSaved, onDeleted, or a cache clearing operation.
         * NOTE: invalidating the cache is not notified, since only the metadata
         * and not the content data has changed.
         * @member {SingleEvent<any>}
         */
        this.onCacheChanged = new SingleEvent(this);
        /**
         * Notification when the content of the cache has being marked
         * as invalid.
         * Does not receive parameters.
         * NOTE: invalidation means the data has not changed, but marked as
         * requires an update on next use. Use onCacheChanged or onCachedData
         * to get actual updates on data.
         * @member {SingleEvent}
         */
        this.onCacheInvalidated = new SingleEvent(this);

        /// Private fields
        /**
         * Remote provider driver
         */
        this.__remote = settings.remote;

        /**
         * Wrapper around the given local provider driver, so it properly manages
         * the data as a CachedData object.
         * This allows the implementation for the local provider driver to keep
         * simple, moving the 'cache' responsability here and being the same
         * for any implementation.
         * @private
         */
        this.__localCache = {
            /// Internal references to cache events, same documentation applies
            onCachedData: this.onCachedData,
            onCacheChanged: this.onCacheChanged,
            onCacheInvalidated: this.onCacheInvalidated,
            /**
             * Loads data from local storage, returning the cache object,
             * with `cache.data` holding the data or empty if nothing stored.
             * @returns {Promise<CachedData,Error>}
             */
            fetch() {
                // Get cached data from local,
                return settings.local.fetch()
                // check if needs revalidation
                // and return it when done
                .then((dataCache) => ({
                    // Be careful: the cache may not exist, on that cases just
                    // let every field being undefined
                    data: dataCache && dataCache.data,
                    latest: dataCache && dataCache.latest,
                    // Again: cache may not exist, be careful too to validate some 'latest' exist
                    // and fallback as 'true' (if no data, no time of latest copy, then sure needs revalidation)
                    mustRevalidate: dataCache ? mustRevalidate(dataCache.latest, settings.ttl) : true
                }));
            },
            /**
             * Saves data locally along with caching information (it stores
             * a CachedData object with the given data and current time
             * -does not need mustRevalidate as value matches the default, falsy).
             * @param {Object} data The plain object representing the data model
             * to be locally stored.
             * @returns {Promise<CachedData,Error>} Stored
             */
            push(data) {
                // Prepare cache info
                var cachedData = {
                    data: data,
                    latest: new Date().toJSON()
                };
                // Replace cached data
                return settings.local.push(cachedData)
                .then(() => {
                    // Notify the change
                    this.onCachedData.emit(cachedData);
                    this.onCacheChanged.emit(cachedData);
                    // and return it when done
                    return cachedData;
                });
            },
            /**
             * Deletes local cached data.
             * @returns {Promise<CachedData,Error>} Empty cache
             */
            delete() {
                // Delete cached data from local
                return settings.local.delete()
                // and return and empty cached data
                .then(() => ({
                    // null means data don't exists (was deleted; undefined means not loaded still)
                    data: null,
                    // null means no data to check, undefined means not loaded still
                    latest: null
                }))
                .then(() => {
                    // Notify the change
                    this.onCacheChanged.emit(null);
                });
            },
            /**
             * Marks cached data as invalid by touching a flag, while keeping
             * the stored data.
             * Soft alternative to 'delete'
             * @returns {Promise<Error>}
             */
            invalidate() {
                // Get current cache
                return settings.local.fetch()
                .then((dataCache) => settings.local.push({
                        // Be careful: the cache may not exist and we need to keep the data!
                        data: dataCache && dataCache.data,
                        // reset mark, will force 'mustRevalidate' to calculate as 'true'
                        // next time
                        latest: null
                    })
                )
                .then(() => {
                    this.onCacheInvalidated.emit();
                });
            }
        };

        // We replace the instance __sync method by wrapping it in a 'just one task at a time'
        // logic. The running task (promise) is saved, returned if in progress and clearer
        // at the end (succes or error).
        // The method signature and documentation remains the same, check it in the
        // source implementation below.
        // We don't implement this in the method itself to keep implementation more clear,
        // focused on it's goal.
        this.__syncTask = null;
        const __syncOriginal = this.__sync.bind(this);
        this.__sync = () => {
            // Only one task at a time: check if there is a running task and return that
            if (this.__syncTask) {
                return this.__syncTask;
            }
            else {
                this.__syncTask = __syncOriginal()
                .then((data) => {
                    // Clear running task
                    this.__syncTask = null;
                    // pass-through data
                    return data;
                }, (error) => {
                    // On error, we need to clear running task too
                    this.__syncTask = null;
                    // and relay the error
                    throw error;
                });
                // Return the running task
                return this.__syncTask;
            }
        };

        /// Events
        /**
         * Notification when data was loaded, independently of the storage it comes from
         * (can be local or remote), including a copy of the data.
         * @member {SingleEvent<any>}
         */
        this.onLoaded = new SingleEvent(this);
        /**
         * Notification when data was loaded from remote, including a copy of the
         * data.
         * This event is emitted just before onLoaded.
         * Using this is not recommended for getting updated of data, since there
         * are loading/synching requests that don't hit the network if valid
         * local data is found; is expected for some advanced uses.
         * @member {SingleEvent<any>}
         */
        this.onRemoteLoaded = new SingleEvent(this);
        /**
         * Notification when data was saved on remote storage, including a copy
         * of the data after being saved (can includes server changes to the data
         * given to be saved, like timestamps, autogenerated IDs or computed values).
         * @member {SingleEvent<any>}
         */
        this.onSaved = new SingleEvent(this);
        /**
         * Notificaton when data was deleted on remote storage.
         * @member {SingleEvent}
         */
        this.onDeleted = new SingleEvent(this);
        /**
         * Notification when an error happens at a sync operation that is
         * triggered as a result of subscribe to the onData event
         * @member {SingleEvent}
         */
        this.onDataError = new SingleEvent(this);
        /**
         * Reactive notification of incoming data.
         * It notifies of both onLoaded and onSaved events, including a copy of the data,
         * and reacts to subscriptions by requesting data synchronization/loading.
         * This is recommended over explicitly listening to that other events
         * and manually triggering sync; too, in the future could include
         * reactions to other data changes.
         * @member {ReactiveEvent<any>}
         */
        this.onData = ReactiveEvent.convert(
            new AggregatedEvent([this.onLoaded, this.onSaved], this), {
                afterSubscribe: () => {
                    // Notify errors through specific onDataError event.
                    this.__sync()
                    .catch((error) => {
                        // We emit the error, with care of if any subscriber
                        // exists...
                        if (this.onDataError.count) {
                            this.onDataError.emit(error);
                        }
                        else {
                            // ...otherwise, we log an error since is important
                            // that errors get explictly managed
                            console.error('Unhandled onDataError', error, this);
                        }
                    });
                }
            }
        );
    }

    /**
     * Request to load data from remote and update the cache with the result
     * when successfully, notifying events.
     * @returns {Promise<any,Error>}
     */
    refresh() {
        return this.__remote.fetch()
        // Update local cache
        .then((remoteData) => this.__localCache.push(remoteData))
        .then((freshCache) => {
            // notify load with the 'fresh' remote data already saved in the cache
            // NOTE: remoteData at previous promise and freshCache.data are
            // currently the same object instance
            this.onRemoteLoaded.emit(freshCache.data);
            this.onLoaded.emit(freshCache.data);
            // return the data
            return freshCache.data;
        });
        // NOTE: it's important to prevent race conditions, unstable state
        // and to make the code more predictable, because of that we notify
        // the remoteData after successfully store it in the cache and not
        // immediatly after receive it
    }

    /**
     * Request to sync local-remote data, by getting the local copy, checking
     * it has an up-to-date data, otherwise gets the remote data, storing
     * a copy it in the local with cache info.
     * On both cases, data being read is notified through onLoaded event.
     * The promise resolves after all work is done: just loaded from valid
     * cache or fresh copy from remote when needed.
     * @returns {Promise<any, Error>}
     * @private
     * NOTE: it's a private utility right now even if an 'alias' is exposed
     * publicly ('onceLoaded') and can get extra features in the future that
     * can make it different from that alias, like being able to store a 'draft'
     * of the data in the cache when offline and doing actual synchronization
     * of that against remote if is online again (anyway, is just an idea).
     */
    __sync() {
        // Get local copy with cache info
        return this.__localCache.fetch()
        .then((cache) => {
            // Check if something cached
            if (cache.latest && cache.data) {
                // There is data
                // notify any loaded data
                this.onLoaded.emit(cache.data);
                // NOTE: we notify it independently of whether must be revalidated or not,
                // so some subscribers can get data ASAP (it allows for more responsive
                // interface; keep in mind that the data can still be valid,
                // the cache TTL just enforce us to double check it against the remote
                // storage given a reasonable time frame for the kind of data).

                // if is up-to-date, does not need to be revalidated, just give it
                if (!cache.mustRevalidate) {
                    // return it
                    return cache.data;
                }
            }
            // "else" no data
            // or local data must be revalidated:
            // enforces a remote load and wait for it
            return this.refresh();
        })
        .catch((err) => {
            // In case of error with local cache (that must happens only on
            // implementation bugs, NOT by design --if there is no cache, must
            // success with empty info), we register it
            console.error('localCache.fetch error', err);
            // and AUTORECOVER by requesting remote data,
            // this way the user don't get stucked without being able to get
            // data because the cache is corrupt or the implementation (mostly
            // fault of the driver containing a bug)
            return this.refresh();
        });
    }

    /**
     * Request a copy of the (up-to-date) data.
     * It searchs at the local store for valid data, falling back to remote
     * when local data looks obsolete or there is no one.
     *
     * The differences with subscribing to the onLoad event are:
     * - this returns a Promise so can resolve **only once** (versus multiple
     * events being emitted with newer copies of the data at onData)
     * - it returns only data that looks up-to-date (versus onLoad that emits
     * first any data stored locally, even if looks obsolete, an later emits
     * again with fresh remote data, so give you some data ASAP)
     * @returns {Promise<any, Error>}
     *
     * NOTE: Right now is just an alias for the private `__sync` method, check
     * comments there about how this can change in a future.
     */
    onceLoaded() {
        return this.__sync();
    }

    /**
     * Request to store in the cache the given data and notify the onSaved event
     * when finished.
     * This is used automatically by the 'save' method so no need to call it after it.
     * Use cases: more advanced managements as when using specialized remote
     * methods that perform data changes and the updated data must be locally
     * cached and notified as 'saved' (because is saved in the remote, even if
     * the common 'save' way of doing the task was not used).
     * @param {any} data Copy of the data
     * @returns {Promise<any, Error>} Returns the same given data as was stored
     * locally
     */
    pushSavedData(data) {
        return this.__localCache.push(data)
        // Notify it was saved, providing a copy of the data and returning it
        .then((cache) => {
            this.onSaved.emit(cache.data);
            return cache.data;
        });
    }

    /**
     * Save data in remote and locally.
     * It get's stored locally only if was saved succesffully at remote, notifying
     * after that with/returning data as sent back by the server.
     * @param {any} data Copy of the data
     * @returns {Promise<any, Error>} Returns data as given by the server (can
     * be different than given one for any server calculated value)
     */
    save(data) {
        // Push to remote store
        return this.__remote.push(data)
        // Store the returning data locally with cache info
        // (remote must send the data back, updating any server calculated value)
        .then(this.pushSavedData.bind(this));
    }

    /**
     * Delete the data or ressource from remote and local stores.
     * It get's deleted locally only if was deleted successfully at remote, notifying
     * after that and returning the result given by the remote
     * NOTE: the result notified can be empty, some metadata or
     * a copy of the removed data, depending on the remote implementation.
     * @returns {Promise<any, Error>}
     */
    delete() {
        // Delete from remote store
        return this.__remote.delete()
        // Delete from local,
        .then((remoteResultOrCopy) => this.__localCache.delete()
            // Notify it was deleted,
            // providing the result given by the remote and return that result
            .then(() => {
                this.onDeleted.emit(remoteResultOrCopy);
                return remoteResultOrCopy;
            })
        );
    }

    /**
     * Request to clear the locally stored cache.
     *
     * NOTE: Can include removal of in-memory cache info too, even currently
     * there is nothing there to clean-up, and is just a request for local deletion
     *
     * @returns {Promise}
     */
    clearCache() {
        return this.__localCache.delete();
    }

    /**
     * Request to state that the cache is invalid, that will enforce to update
     * with content from remote.
     *
     * In details:
     * If there are listeners for new data ('onLoaded'), a remote load is triggered
     * immediately so we store latest data and notify them. If fails for any reason
     * (like no connection), fallbacks to mark the cache as invalid.
     * Otherwise, we just mark current cached data as no
     * valid enforcing that next time is accessed, a remote load will be triggered;
     * in opposite to clearCache, we keep the outdated data, this way we have
     * still some data for quick usage.
     *
     * @returns {Promise} When it ends refreshing the cache or marking the cache as invalid.
     */
    invalidateCache() {
        // If someone subscribed to new data
        if (this.onLoaded.count) {
            // Trigger a remote load immediately,
            return this.refresh()
            // no data expected as a result of this method.
            .then(() => {})
            // fallback to just mark the cache as invalid in any error
            .catch(() => this.__localCache.invalidate());
        }
        else {
            return this.__localCache.invalidate();
        }
    }
}

/**
 * Check if a cache must be revalidated based on the time of latest copy and
 * the wanted TTL for the data.
 * @param {string} latest A date-time as an ISO8601 string, as from Date..toJSON
 * @param {number} ttl Time-To-Live specified in milliseconds.
 * @returns {boolean} Returns true when the time is too older, given latest
 * plus TTL is smaller than current time, or latest is empty.
 */
function mustRevalidate(latest, ttl) {
    // If no 'latest' value, then must revalidate
    if (!latest) {
        return true;
    }
    // Build a date for 'latest', using ISO8601 is standard and well supported
    // cross browser. We needed to be able to get a diff value.
    latest = new Date(latest);
    const now = new Date();
    // Calculate diff in milliseconds
    var tdiff = now - latest;
    // When bigger diff than TTL, must revalidate
    return tdiff > ttl;
}

/**
 * @typedef {Object} CachedData Holds data and information about it's cached
 * time. That information is immutable, so don't expect `latest` or `mustRevalidate`
 * to be up-to-date, they are expected to be checked soon after or may be
 * obsolete.
 * @member {any} data Any cached data. Can be null or undefined; usually a
 * plain object describing a data model.
 * @member {string} latest A date-time as an ISO8601, as from Date..toJSON
 * @member {boolean} mustRevalidate Whether the data looks like obsolete
 * and must be revalidated.
 */

// IDEA: An event 'onFreshData' that filters notifications from 'onData' based
// on a 'comparer setting'. Details
// - `settings.comparer` is a function that compares latest notified data
// and incoming one, only emitting if is different; can use all-props comparision or
// serialization comparision as a generic, opt-in method or a timestamp field,
// recommended way that should be provided by implementer).
// - One caveat: needs to keep an in memory copy of last value and may enable
// a subscription to onData all the time even if unused; same problems to the
// idea of a PersistentSingleEvent class.
// - without this: user code needs to do its comparision or trust any notified
// data as different and newer. That's important to prevent doing extra work,
// trashing and redoing UI, or more important replacing form data for an item
// being edited with newer data (onData should be not used for that cases
// anyway because of that problem, except it includes a mechanism to manage
// this).

// IDEA: rather that just use a TTL as caching strategy, a class can be defined
// for a common interface (a base CachedData with data and mustRevalidate members,
// later extended with anything else the implemented strategy needs to persist,
// like the 'latest' field for TTL). That way the strategy is provided at constructor
// like the implementations for remote and local calls, and moving out some
// details like mustRevalidate utility while letting other strategies to be
// implemented.
