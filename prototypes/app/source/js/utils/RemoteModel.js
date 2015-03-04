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
**/
'use strict';

var ModelVersion = require('../utils/ModelVersion'),
    CacheControl = require('../utils/CacheControl'),
    ko = require('knockout');

function RemoteModel(options) {

    options = options || {};
    
    this.isLoading = ko.observable(false);
    this.isSaving = ko.observable(false);
    this.data = options.data || null;
    
    this.cache = new CacheControl({
        ttl: options.ttl
    });

    this.newVersion = function newVersion() {
        return new ModelVersion(this.data);
    };
    
    this.fetch = options.fetch || function fetch() { throw new Error('Not implemented'); };
    this.push = options.push || function push() { throw new Error('Not implementd'); };

    this.load = function load() {
        if (this.cache.mustRevalidate()) {
            this.isLoading(true);
            
            return this.fetch()
            .then(function (serverData) {
                this.data.model.updateWith(serverData);
                this.isLoading(false);
                this.cache.latest = new Date();
                return this.data;
            }.bind(this));
        }
        else {
            return Promise.resolve(this.data);
        }
    };

    this.save = function save() {
        this.isSaving(true);
        
        // Preserve the timestamp after being saved
        // to avoid false 'obsolete' warnings with
        // the version that created the new original
        var ts = this.data.model.dataTimestamp();
        
        return this.push()
        .then(function (serverData) {
            this.data.model.updateWith(serverData);
            this.data.model.dataTimestamp(ts);

            this.isSaving(false);
            this.cache.latest = new Date();
            return this.data;
        }.bind(this));
    };
}

module.exports = RemoteModel;
