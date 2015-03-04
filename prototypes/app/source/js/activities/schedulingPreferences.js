/**
    SchedulingPreferences activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');

var A = Activity.extends(function SchedulingPreferencesActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.Provider;

    this.navBar = Activity.createSubsectionNavBar('Scheduling');
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    this.viewModel.load();
};

var SchedulingPreferences = require('../models/SchedulingPreferences');

function ViewModel(app) {
    this.prefs = new SchedulingPreferences();
    
    this.isLoading = ko.observable(false);
    this.isSaving = ko.observable(false);
    
    this.load = function load() {
        
        this.isLoading(true);
        
        app.model.getSchedulingPreferences()
        .then(function (prefs) {
            this.prefs.model.updateWith(prefs);
            this.isLoading(false);
        }.bind(this));
    }.bind(this);

    this.save = function save() {
        
        this.isSaving(true);
        
        app.model.setSchedulingPreferences(this.prefs.model.toPlainObject())
        .then(function (prefs) {
            this.prefs.model.updateWith(prefs);
            this.isSaving(false);
        }.bind(this));
    }.bind(this);
}
