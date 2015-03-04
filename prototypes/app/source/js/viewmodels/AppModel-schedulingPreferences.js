/**
    Model API to fetch and update the user
    Scheduling Preferences:
    - advanceTime:decimal Hours
    - betweenTime:decimal Hours
    - incrementsSizeInMinutes:int
**/
'use strict';

exports.plugIn = function (AppModel) {
    
    /**
        Get preferences object
    **/
    AppModel.prototype.getSchedulingPreferences = function () {
        return this.rest.get('scheduling-preferences');
    };
    
    /**
        Set preferences object
    **/
    AppModel.prototype.setSchedulingPreferences = function (preferences) {
        return this.rest.put('scheduling-preferences', preferences);
    };
};
