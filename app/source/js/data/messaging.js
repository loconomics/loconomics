/**
 * Management of the user messages by threads,
 * used for communication client--service-professional,
 * local and remote.
 *
 * NOTE: Initial basic implementation
 * TODO: Require advanced implementation, loading a limited
 *      amount of records for threads and messages per thread
 *      using the cursor parameters of the REST API to manage
 *      paging load.
 */
// TODO store-jsdocs
'use strict';

var Thread = require('../models/Thread');
var CacheControl = require('../utils/CacheControl');
var ListRemoteModel = require('../utils/ListRemoteModel');
var session = require('./session');
var remote = require('./drivers/restClient');

var api = new ListRemoteModel({
    listTtl: { minutes: 1 },
    itemIdField: 'threadID',
    Model: Thread
});
module.exports = api;

api.addLocalforageSupport('messaging');
api.addRestSupport(remote, 'me/messaging');

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});

// Basic support is fetching all threads with the latest message of each one.
// Replace getItem built-in to do non locally saved, fetch for all messages in
// a thread (the thread is the item)
var fullThreadsCache = {/*
    threadID: { control: CacheControl, thread: Thread }
*/};
var fetchThreadRemote = function(threadID) {
    return remote.get('me/messaging/' + threadID, {
        limit: 1000 /* max messages in the thread */
    })
    .then(function(thread) {
        if (thread) {
            thread = new Thread(thread);
            var cached = fullThreadsCache[threadID];
            if (cached) {
                cached.control.latest = new Date();
                cached.thread = thread;
            } else {
                fullThreadsCache[threadID] = {
                    control: new CacheControl({ ttl: { minutes: 1 } }),
                    thread: thread
                };
                fullThreadsCache[threadID].control.latest = new Date();
            }
            return thread;
        }
        else {
            throw new Error('Not Found');
        }
    });
};
var markAsEndedAndFollowUp = function(any) {
    api.state.isSyncing(false);
    api.state.isLoading(false);
    return any;
};
api.getItem = function getItem(threadID) {
    var cached = fullThreadsCache[threadID];
    if (cached && cached.thread) {
        if (cached.control.mustRevalidate()) {
            api.state.isSyncing(true);
            return fetchThreadRemote(threadID)
            .then(markAsEndedAndFollowUp, markAsEndedAndFollowUp);
        }
        else
            return Promise.resolve(cached.thread);
    } else {
        api.state.isLoading(true);
        return fetchThreadRemote(threadID)
        .then(markAsEndedAndFollowUp, markAsEndedAndFollowUp);
    }
};
