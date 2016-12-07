/**
    SchedulingPreferences activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var moment = require('moment-timezone');

var A = Activity.extend(function SchedulingPreferencesActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.serviceProfessional;
    
    this.navBar = Activity.createSubsectionNavBar('Scheduler', {
        backLink: '/scheduling',
        helpLink: this.viewModel.helpLink
    });

    this.defaultNavBar = this.navBar.model.toPlainObject(true);

    this.registerHandler({
        target: this.app.model.weeklySchedule,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Error saving your weekly schedule.' : 'Error loading your weekly schedule.';
            this.app.modals.showError({
                title: msg,
                error: err && err.task && err.error || err
            });
        }.bind(this)
    });
    
    this.registerHandler({
        target: this.app.model.schedulingPreferences,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Error saving scheduling preferences.' : 'Error loading scheduling preferences.';
            this.app.modals.showError({
                title: msg,
                error: err && err.task && err.error || err
            });
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {
    
    if (!this.app.model.onboarding.updateNavBar(this.navBar)) {
        // Reset
        this.navBar.model.updateWith(this.defaultNavBar, true);
    }
};

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    this.updateNavBarState();
    
    // Keep data updated:
    this.app.model.schedulingPreferences.sync();
    this.app.model.weeklySchedule.sync();
    // Discard any previous unsaved edit
    this.viewModel.discard();
};

/// View Models

function ViewModel(app) {
    this.helpLink = '/help/relatedArticles/201961423-setting-your-scheduling-preferences';

    this.isInOnboarding = app.model.onboarding.inProgress;
    
    this.schedulingPreferences = new SchedulingPreferencesVM(app);
    this.weeklySchedule = new WeeklyScheduleVM(app);

    this.save = function save() {
        return Promise.all([
            this.schedulingPreferences.save(),
            this.weeklySchedule.save()
        ])
        .then(function() {
            // A weekly schedule change may change the status of userJobTitles and bookMeButtonReady, so
            // force a refresh of that data
            app.model.userJobProfile.clearCache();
            app.model.userJobProfile.syncList();
            // Move forward:
            if (app.model.onboarding.inProgress()) {
                app.model.onboarding.goNext();
            } else {
                app.successSave();
            }
        })
        .catch(function() {
            // catch error, managed on event
        });
    }.bind(this);
    
    this.discard = function discard() {
        this.schedulingPreferences.discard();
        this.weeklySchedule.discard();
    }.bind(this);
    
    this.isLoading = ko.pureComputed(function() {
        return this.schedulingPreferences.isLoading() || this.weeklySchedule.isLoading();
    }, this);
    this.isSaving = ko.pureComputed(function() {
        return this.schedulingPreferences.isSaving() || this.weeklySchedule.isSaving();
    }, this);
    this.isLocked = ko.pureComputed(function() {
        return this.schedulingPreferences.isLocked() || this.weeklySchedule.isLocked();
    }, this);
    
    this.submitText = ko.pureComputed(function() {
        return (
            app.model.onboarding.inProgress() ?
                'Save and continue' :
                this.isLoading() ? 
                    'loading...' : 
                    this.isSaving() ? 
                        'Saving...' : 
                        'Save'
        );
    }, this);
}

function SchedulingPreferencesVM(app) {

    var schedulingPreferences = app.model.schedulingPreferences;

    var prefsVersion = schedulingPreferences.newVersion();
    prefsVersion.isObsolete.subscribe(function(itIs) {
        if (itIs) {
            // new version from server while editing
            // FUTURE: warn about a new remote version asking
            // confirmation to load them or discard and overwrite them;
            // the same is need on save(), and on server response
            // with a 509:Conflict status (its body must contain the
            // server version).
            // Right now, just overwrite current changes with
            // remote ones:
            prefsVersion.pull({ evenIfNewer: true });
        }
    });
    
    // Actual data for the form:
    this.prefs = prefsVersion.version;

    this.isLoading = schedulingPreferences.isLoading;
    this.isSaving = schedulingPreferences.isSaving;
    this.isLocked = schedulingPreferences.isLocked;
    
    this.discard = function discard() {
        prefsVersion.pull({ evenIfNewer: true });
    }.bind(this);

    this.save = function save() {
        return prefsVersion.pushSave();
    }.bind(this);
    
    this.incrementsExample = ko.pureComputed(function() {
        
        var str = 'e.g. ',
            incSize = this.incrementsSizeInMinutes(),
            m = moment({ hour: 10, minute: 0 }),
            hours = [m.format('HH:mm')];
        
        for (var i = 1; i < 4; i++) {
            hours.push(
                m.add(incSize, 'minutes')
                .format('HH:mm')
            );
        }
        str += hours.join(', ');
        
        return str;
        
    }, this.prefs);
}

var timeZoneList = require('../utils/timeZoneList');

function WeeklyScheduleVM(app) {

    var weeklySchedule = app.model.weeklySchedule;

    var scheduleVersion = weeklySchedule.newVersion();
    scheduleVersion.isObsolete.subscribe(function(itIs) {
        if (itIs) {
            // new version from server while editing
            // FUTURE: warn about a new remote version asking
            // confirmation to load them or discard and overwrite them;
            // the same is need on save(), and on server response
            // with a 509:Conflict status (its body must contain the
            // server version).
            // Right now, just overwrite current changes with
            // remote ones:
            scheduleVersion.pull({ evenIfNewer: true });
        }
    });
    
    // Actual data for the form:
    this.schedule = scheduleVersion.version;

    this.isLoading = weeklySchedule.isLoading;
    this.isSaving = weeklySchedule.isSaving;
    this.isLocked = weeklySchedule.isLocked;
    
    this.discard = function discard() {
        scheduleVersion.pull({ evenIfNewer: true });
    };

    this.save = function save() {
        return scheduleVersion.pushSave();
    };

    var autoTz = timeZoneList.getLocalTimeZone();
    var autoLabel = 'Auto (' + timeZoneList.timeZoneToDisplayFormat(autoTz) + ')';
    this.autoTimeZone = ko.observable({
        id: autoTz,
        label: autoLabel
    });
    this.timeZonesList = ko.observable(timeZoneList.getUserList());
    this.topUsTimeZones = ko.observable(timeZoneList.getTopUsZones());
}

