/** UserJobTitleServiceAttributes model.
 **/
'use strict';

var Model = require('./Model'),
    ko = require('knockout');

// Private utility models
function valuesByCategory(values) {
    // Creating observable with source values;
    var m = ko.observable(values || {});
    
    // Alias to notify changes, if change a source plain value is needed, this must
    // be manually called to ensure updates.
    m.notifyChanges = m.valueHasMutated;

    m.serviceAttributeCategoriesIDs = ko.pureComputed(function() {
        return Object.keys(m()).filter(function(key) {
            return (key |0) === 0;
        });
    }, m);
    
    // Gets an observableArray that keeps in sync with source changes
    m.getServiceCategoryAttributes = function(catID) {
        return ko.pureComputed(function() {
            // Recompute when source value changed, get
            // category content.
            return m()[catID];
        });
    };

    return m;
}

// Public Model
function UserJobTitleServiceAttributes(values) {
    
    Model(this);

    this.model.defProperties({
        userID: 0,
        jobTitleID: 0,
        serviceAttributes: valuesByCategory(values && values.serviceAttributes),
        proposedServiceAttributes: valuesByCategory(values && values.proposedServiceAttributes),
        experienceLevelID: false,
        languageID: 0,
        countryID: 0
        //createdDate: null,
        //updatedDate: null
    }, values);
}

module.exports = UserJobTitleServiceAttributes;
