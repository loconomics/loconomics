/**
    CalendarSyncing activity
**/
'use strict';

var Activity = require('../components/Activity');
var $ = require('jquery');
var ko = require('knockout');
var calendarSyncing = require('../data/calendarSyncing');
var showError = require('../modals/error').show;

var A = Activity.extend(function CalendarSyncingActivity() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.serviceProfessional;

    this.navBar = Activity.createSubsectionNavBar('Calendar', {
        backLink: 'calendar' , helpLink: this.viewModel.helpLink
    });
    this.title('Syncing your calendars');

    // Adding auto-select behavior to the export URL
    this.registerHandler({
        target: this.$activity.find('#calendarSync-icalExportUrl'),
        event: 'click',
        handler: function() {
            $(this).select();
        }
    });

    this.registerHandler({
        target: calendarSyncing,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Error saving calendar syncing settings.' : 'Error loading calendar syncing settings.';
            showError({
                title: msg,
                error: err && err.task && err.error || err
            });
        }
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    // Keep data updated:
    calendarSyncing.sync();
    // Discard any previous unsaved edit
    this.viewModel.discard();
};

function ViewModel(app) {
    this.helpLink = '/help/relatedArticles/201959953-syncing-your-existing-calendar';

    var syncVersion = calendarSyncing.newVersion();
    syncVersion.isObsolete.subscribe(function(itIs) {
        if (itIs) {
            // new version from server while editing
            // FUTURE: warn about a new remote version asking
            // confirmation to load them or discard and overwrite them;
            // the same is need on save(), and on server response
            // with a 509:Conflict status (its body must contain the
            // server version).
            // Right now, just overwrite current changes with
            // remote ones:
            syncVersion.pull({ evenIfNewer: true });
        }
    });

    // Actual data for the form:
    this.sync = syncVersion.version;

    this.isLocked = ko.pureComputed(function() {
        return this.isLocked() || this.isReseting();
    }, calendarSyncing);

    this.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ?
                'loading...' :
                this.isSaving() ?
                    'saving...' :
                    'Save'
        );
    }, calendarSyncing);

    this.resetText = ko.pureComputed(function() {
        return (
            this.isReseting() ?
                'reseting...' :
                'Reset Private URL'
        );
    }, calendarSyncing);

    this.discard = function discard() {
        syncVersion.pull({ evenIfNewer: true });
    };

    this.save = function save() {
        syncVersion.pushSave()
        .then(function() {
            app.successSave();
        })
        .catch(function() {
            // catch error, managed on event
        });
    };

    this.reset = function reset() {
        calendarSyncing.resetExportUrl();
    };
}
