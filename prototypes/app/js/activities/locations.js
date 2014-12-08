/**
    locations activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout');

exports.init = function initLocations($activity) {
    new LocationsActivity($activity);
};

function LocationsActivity($activity) {

    this.$activity = $activity;
    this.$listView = $activity.find('#locationsListView');

    var dataView = this.dataView = new ViewModel();
    ko.applyBindings(dataView, $activity.get(0));

    // TestingData
    dataView.locations(require('../testdata/locations').locations);

    // TODO: in observable? passed as parameter? Localizable?
    if (dataView.isSelectionMode()) {
        dataView.headerText('Select/Add location');
    }
}

function ViewModel() {

    this.headerText = ko.observable('Locations');

    // Full list of locations
    this.locations = ko.observableArray([]);

    // Especial mode when instead of pick and edit we are just selecting
    // (when editing an appointment)
    this.isSelectionMode = ko.observable(true);

    this.selectLocation = function(selectedLocation) {
        
        // TODO: communicate with other activities to return the 
        // selected location
        history.go(-1);

    }.bind(this);
}
