/** UserJobTitleServiceAttributes model.
 **/
'use strict';

var Model = require('./Model'),
    ko = require('knockout');

// Needed utility to extend with methods the observable
// properties that holds a plain object as dictionary
// of attributes per category.
// It's useful for attIDs and attNames.
function extendValuesByCategory(obs) {
    // Alias to notify changes, if change a source plain value is needed, this must
    // be manually called to ensure updates.
    obs.notifyChanges = obs.valueHasMutated;

    obs.serviceAttributeCategoriesIDs = ko.pureComputed(function() {
        return Object.keys(obs() || {}).filter(function(key) {
            return (key |0) === 0;
        });
    });

    // Gets an observable for array that keeps in sync with source changes
    obs.getServiceCategoryAttributes = function(catID) {
        return ko.pureComputed(function() {
            // Recompute when source value changed, get
            // category content.
            return obs() && obs()[catID] || [];
        });
    };

    obs.push = function(catID, attID) {
        var v = obs();
        if (!v) {
            v = {};
            v[catID] = [attID];
            obs(v);
        }
        else {
            var cat = v[catID] || (v[catID] = []);
            cat.push(attID);
            obs.notifyChanges();
        }
    };

    obs.remove = function(catID, attID) {
        var v = obs(),
            cat = v && v[catID];
        if (cat) {
            var i = cat.indexOf(attID);
            if (i > -1) {
                cat.splice(i, 1);
            }
            obs.notifyChanges();
        }
    };
}

// Public Model
function UserJobTitleServiceAttributes(values) {
    
    Model(this);

    this.model.defProperties({
        userID: 0,
        jobTitleID: 0,
        serviceAttributes: {},
        proposedServiceAttributes: {},
        experienceLevelID: false,
        languageID: 0,
        countryID: 0
        //createdDate: null,
        //updatedDate: null
    }, values);
    
    extendValuesByCategory(this.serviceAttributes);
    extendValuesByCategory(this.proposedServiceAttributes);
}

module.exports = UserJobTitleServiceAttributes;
