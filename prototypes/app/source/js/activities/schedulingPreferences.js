/**
    SchedulingPreferences activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var moment = require('moment');

var A = Activity.extends(function SchedulingPreferencesActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.Provider;

    this.navBar = Activity.createSubsectionNavBar('Scheduling');
//    
//    this.viewModel.prefsVersion.isObsolete.subscribe(function(itIs) {
//        if (itIs) {
//            // Notify newer that comes from the server
//            if(window.confirm('There was remote changes in the Scheduling Preferences' +
//                    '. Do you want to load them? (press No to discard them)')) {
//                
//                // Replace in edit data with the server updated data
//                this.viewModel.prefsVersion.pull();
//            }
//            else {
//                // Just nothing
//            }
//        }
//    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    this.viewModel.load();
};

function ViewModel(app) {

    var schedulingPreferences = this.schedulingPreferences = app.model.schedulingPreferences;

    this.prefsVersion = schedulingPreferences.newVersion();
    this.prefs = this.prefsVersion.version;

    this.isLoading = schedulingPreferences.isLoading;
    this.isSaving = schedulingPreferences.isSaving;

    this.load = function() {
        schedulingPreferences.load().then(function() {
            this.prefsVersion.pull({ evenIfNewer: true });
        }.bind(this));

    }.bind(this);
    
    this.save = function() {
        if (this.prefsVersion.push()) {
            schedulingPreferences.save()
            .then(function() {
                // Close activity?
            });
        }
        else if (this.prefsVersion.isObsolete()) {
            window.alert('Data conflict, is obsolete');
        }

    }.bind(this);
}
