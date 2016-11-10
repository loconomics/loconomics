/**
    Helper class CachedData.
    
    It manages loading data that is cached in memory, executing
    secuentally any 'loadSource' provided to load the
    data; the first source that returns data uses that
    ends the loading task.
**/

var CacheControl = require('./CacheControl');

function CachedData(settings) {
    var control = new CacheControl(settings);
    
    this.data = null;
    this.loadSources = settings.loadSources || [];
    
    this.getData = function() {
       if (control.mustRevalidate()) {
          this.load();
       }
        else {
            return this.data;
        }
    };
    
    this.setData = function(newData, updateTimestamp) {
        this.data = newData;
        // Mark as updated now, or the given one:
        control.latest = updateTimestamp || new Date();
    };
    
    this.load = function(params) {
        this.loadSources.reduce(function(cur, next) {
            // Execute current loadSource in the list that
            // returns a promise.
            // If success and there is data, stops there and returns the data.
            // If no data or error, just go next.
            // NOTE: each loadSource function executes in the context
            // of this CachedData instance.
            // NOTE2: reduce receive as second parameter a resolved promise
            // since that is the first 'cur' received by the callback, starting
            // with that 'next' is the first loadSource to be executed.
            return cur.then(function(data) {
                if (data)
                    return data;
                return next.call(this, params);
            }.bind(this), next.bind(this, params));
        }, Promise.resolve())
        .then(function(data) {
            // Almost one source fetched data successfully
            if (data) {
               this.setData(data);
            }
            else {
                // A success not returning data must be considered:
                // TODO: not-found? deleted? throw error?
                // Just log to notify and set null for now:
                if (console) console.log('CachedData: revalidated data returns NULL as success; replaced data:', this.data);
                this.setData(null);
            }
        }.bind(this));
    };
}

module.exports = CachedData;
