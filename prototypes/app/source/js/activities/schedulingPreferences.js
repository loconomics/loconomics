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
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    this.viewModel.load();
};

var SchedulingPreferences = require('../models/SchedulingPreferences');

function ViewModel(app) {
    this.prefs = new SchedulingPreferences();
    this.latestLoad = null;
    this.cacheTTL = moment.duration(10, 'seconds').asMilliseconds();

    this.isLoading = ko.observable(false);
    this.isSaving = ko.observable(false);
    
    this.load = function load() {
        
        var tdiff = this.latestLoad && new Date() - this.latestLoad || Number.POSITIVE_INFINITY;
        if (tdiff <= this.cacheTTL) {
            // Cache still valid, do nothing
            return;
        }
        
        this.isLoading(true);

        app.model.getSchedulingPreferences()
        .then(function (prefs) {
            this.prefs.model.updateWith(prefs);
            this.isLoading(false);
            this.latestLoad = new Date();
        }.bind(this));
    }.bind(this);

    this.save = function save() {
        
        this.isSaving(true);
        
        app.model.setSchedulingPreferences(this.prefs.model.toPlainObject())
        .then(function (prefs) {
            this.prefs.model.updateWith(prefs);
            this.isSaving(false);
            this.latestLoad = new Date();
        }.bind(this));
    }.bind(this);
}
