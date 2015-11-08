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
    
    // Indexed list of observers to detect changes in categories values, allowing
    // the cat-atts observers to recompute only on changes on its categories, being more
    // optimal.
    var catsObs = {};

    // Gets an observable for array that keeps in sync with source changes
    // DO NOT PUSH/REMOVE data to the resulting array, use the obs.push and obs.remove methods for data changes
    obs.getServiceCategoryAttributes = function(catID) {
        var catObs = catsObs[catID] = catsObs[catID] || ko.observable({});
        return ko.computed(function() {
            // Recompute when source value changed for the cateogry
            var base = obs.peek();
            // access notifier observable so this recomputes on changes detected:
            catObs();
            // Get category data:
            return base && base[catID] || [];
        });
    };
    
    // On a real bulk change, trigger al cats observers
    var prevValue = obs();
    obs.subscribe(function(v) {
        // really changed?
        if (v !== prevValue) {
            prevValue = v;
            Object.keys(catsObs).forEach(function(a) {
                // notify changes
                a.valueHasMutated && a.valueHasMutated();
            });
        }
    });

    obs.push = function(catID, attID) {
        var v = obs();
        if (!v) {
            // No value at all! Create object, and first category with this first attribute
            v = {};
            v[catID] = [attID];
            obs(v);
            if (catsObs[catID]) catsObs[catID].valueHasMutated();
        }
        else {
            var cat = v[catID] || (v[catID] = []);
            // Double check it does not exists already
            if (cat.indexOf(attID) === -1) {
                cat.push(attID);
                // changes on all the data
                obs.notifyChanges();
                // changes on this category
                if (catsObs[catID]) catsObs[catID].valueHasMutated();
            }
        }
    };

    obs.remove = function(catID, attID) {
        var v = obs(),
            cat = v && v[catID];
        if (cat) {
            var i = cat.indexOf(attID);
            if (i > -1) {
                cat.splice(i, 1);
                obs.notifyChanges();
                if (catsObs[catID]) catsObs[catID].valueHasMutated();
            }
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
