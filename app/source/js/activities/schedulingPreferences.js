/**
    SchedulingPreferences activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var onboarding = require('../data/onboarding');
var weeklySchedule = require('../data/weeklySchedule');
var schedulingPreferences = require('../data/schedulingPreferences');
var userJobProfile = require('../data/userJobProfile');

var A = Activity.extend(function SchedulingPreferencesActivity() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.serviceProfessional;

    this.navBar = Activity.createSubsectionNavBar('Calendar', {
        backLink: '/calendar',
        helpLink: this.viewModel.helpLink
    });

    this.defaultNavBar = this.navBar.model.toPlainObject(true);

    this.registerHandler({
        target: weeklySchedule,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Unable to save your weekly schedule.' : 'Unable to load your weekly schedule.';
            this.app.modals.showError({
                title: msg,
                error: err && err.task && err.error || err
            });
        }.bind(this)
    });

    this.registerHandler({
        target: schedulingPreferences,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Unable to save scheduling preferences.' : 'Unable to load scheduling preferences.';
            this.app.modals.showError({
                title: msg,
                error: err && err.task && err.error || err
            });
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {

    if (!onboarding.updateNavBar(this.navBar)) {
        // Reset
        this.navBar.model.updateWith(this.defaultNavBar, true);
    }

    // Touch desktop navigation too
    var info = this.app.getReturnRequestInfo(this.requestData);
    this.viewModel.goBackLink(info && info.link || '/calendar');
    this.viewModel.goBackLabel(info && info.label || 'Calendar');
    // Does not support the info.isGoBack option
};

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    this.updateNavBarState();

    // Keep data updated:
    schedulingPreferences.sync();
    weeklySchedule.sync();
    // Discard any previous unsaved edit
    this.viewModel.discard();
};

/// View Models

function ViewModel(app) {
    this.helpLink = '/help/relatedArticles/201961423-setting-your-scheduling-preferences';

    this.goBackLink = ko.observable('');
    this.goBackLabel = ko.observable('');

    this.isInOnboarding = onboarding.inProgress;

    this.schedulingPreferences = new SchedulingPreferencesVM();
    this.weeklySchedule = new WeeklyScheduleVM();

    this.save = function save() {
        return Promise.all([
            this.schedulingPreferences.save(),
            this.weeklySchedule.save()
        ])
        .then(function() {
            // A weekly schedule change may change the status of userJobTitles and bookMeButtonReady, so
            // force a refresh of that data
            userJobProfile.clearCache();
            userJobProfile.syncList();
            // Move forward:
            if (onboarding.inProgress()) {
                onboarding.goNext();
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
            onboarding.inProgress() ?
                'Save and continue' :
                this.isLoading() ?
                    'loading...' :
                    this.isSaving() ?
                        'Saving...' :
                        'Save'
        );
    }, this);
}

function SchedulingPreferencesVM() {

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
}

var timeZoneList = require('../utils/timeZoneList');

function WeeklyScheduleVM() {

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

    var autoTz = timeZoneList.getUsAliasWhenPossible(timeZoneList.getLocalTimeZone());
    var autoLabel = 'Auto (' + timeZoneList.timeZoneToDisplayFormat(autoTz) + ')';
    this.autoTimeZone = ko.observable({
        id: autoTz,
        label: autoLabel
    });
    this.timeZonesList = ko.observable(timeZoneList.getUserList());
    this.topUsTimeZones = ko.observable(timeZoneList.getTopUsZones());
}

