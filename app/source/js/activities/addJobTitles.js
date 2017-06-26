/**
    AddJobTitles activity
**/
'use strict';

var Activity = require('../components/Activity');
var SearchJobTitlesVM = require('../viewmodels/SearchJobTitlesVM');
var userProfile = require('../data/userProfile');
var user = userProfile.data;
var onboarding = require('../data/onboarding');
var userJobProfile = require('../data/userJobProfile');

var A = Activity.extend(function AddJobTitlesActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Scheduler', {
        backLink: '/scheduling' , helpLink: this.viewModel.helpLink
    });
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {
    var referrer = this.app.shell.referrerRoute;
    referrer = referrer && referrer.url || '/scheduling';
    var link = this.requestData.cancelLink || referrer;

    if (!onboarding.updateNavBar(this.navBar)) {
        this.convertToCancelAction(this.navBar.leftAction(), link);
    }
};

A.prototype.show = function show(options) {

    Activity.prototype.show.call(this, options);

    // Allow to preset an incoming value
    var s = options.route.query.s;

    // Reset
    this.viewModel.searchText(s);
    this.viewModel.jobTitles.removeAll();

    this.updateNavBarState();

    // Allow auto add the search text as new proposed job-title
    if (options.route.query.autoAddNew === 'true') {
        this.viewModel.addNewItem(s);
    }
    else if (options.route.query.id) {
        // An ID is passed in and added with the text (if any)
        // as a valid presset job-title ID/name (is not validated at frontend
        // to don't delay, server will double check anyway).
        if (s) {
            this.viewModel.addItem({
                value: +options.route.query.id,
                label: s
            });
            this.viewModel.searchText('');
        }
    }
};

var ko = require('knockout');
function ViewModel(app) {

    this.helpLink = '/help/relatedArticles/201211055-adding-job-profiles';

    this.isInOnboarding = onboarding.inProgress;

    this.isSaving = ko.observable(false);
    this.isLocked = this.isSaving;
    this.jobTitles = ko.observableArray([]);

    this.addItem = function(item) {
        var foundIndex = this.findItem(item);
        if (foundIndex === -1) {
            this.jobTitles.push(item);
        }
    };
    this.addNewItem = function(jobTitleName) {
        if (jobTitleName) {
            this.addItem({
                value: 0,
                label: jobTitleName
            });
        }
    };

    // API entry-point for search component
    this.search = ko.observable(new SearchJobTitlesVM(app));
    this.search().onClickJobTitle = function(jobTitle) {
        // Add to the list, if is not already in it
        var item = {
            value: jobTitle.jobTitleID(),
            label: jobTitle.singularName()
        };
        this.addItem(item);
    }.bind(this);
    this.search().onClickNoJobTitle = function(jobTitleName) {
        this.addNewItem(jobTitleName);
    }.bind(this);
    this.search().customResultsButtonText('Add');
    this.searchText = this.search().searchTerm;

    this.submitText = ko.pureComputed(function() {
        return (
            onboarding.inProgress() ?
                'Save and continue' :
                this.isSaving() ?
                    'Saving...' :
                    'Save'
        );
    }, this);

    this.unsavedChanges = ko.pureComputed(function() {
        return !!this.jobTitles().length;
    }, this);

    /**
        Look for an item in the current list, returning
        its index in the list or -1 if nothing.
    **/
    this.findItem = function findItem(jobTitle) {
        var foundIndex = -1;
        this.jobTitles().some(function(item, index) {
            if (jobTitle.value !== 0 &&
                item.value === jobTitle.value ||
                item.label === jobTitle.label) {
                foundIndex = index;
                return true;
            }
        });
        return foundIndex;
    };

    this.remove = function remove(jobTitle) {
        var removeIndex = this.findItem(jobTitle);
        if (removeIndex > -1) {
            this.jobTitles.splice(removeIndex, 1);
        }
    }.bind(this);

    this.save = function save() {
        if (this.jobTitles().length === 0) return;
        this.isSaving(true);

        // We need to do different stuff if user is not a proffesional when requesting this
        var becomingProfessional = !user.isServiceProfessional();
        var firstJobID = this.jobTitles()[0].value;

        Promise.all(this.jobTitles().map(function(jobTitle) {
            return userJobProfile.createUserJobTitle({
                jobTitleID: jobTitle.value,
                jobTitleName: jobTitle.label
            });
        }))
        .then(function(/*results*/) {
            var onEnd = function onEnd() {
                this.isSaving(false);
                // Reset UI list
                this.searchText('');
                this.jobTitles.removeAll();
                if (onboarding.inProgress()) {
                    onboarding.selectedJobTitleID(firstJobID);
                    onboarding.goNext();
                }
                else {
                    app.successSave();
                }
            }.bind(this);
            if (becomingProfessional) {
                return userProfile
                .load({ forceRemoteUpdate: true })
                .then(function() {
                    // Start onboarding
                    if (onboarding) {
                        onboarding.skipToAddJobTitles();
                    }
                    onEnd();
                });
            }
            else {
                onEnd();
            }
        }.bind(this))
        .catch(function(error) {
            this.searchText('');
            this.isSaving(false);
            app.modals.showError({
                title: 'Unable to add one or more job titles',
                error: error
            });
        }.bind(this));
    }.bind(this);
}
