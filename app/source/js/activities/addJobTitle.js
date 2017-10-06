/**
    AddJobTitle activity
**/
'use strict';

var Activity = require('../components/Activity');
var userProfile = require('../data/userProfile');
var user = userProfile.data;
var onboarding = require('../data/onboarding');
var userJobProfile = require('../data/userJobProfile');
var ActionForValue = require('../kocomponents/job-title-autocomplete').ActionForValue;
var showError = require('../modals/error').show;
var ko = require('knockout');

var A = Activity.extend(function AddJobTitleActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Scheduler', {
        backLink: '/marketplaceProfile' , helpLink: this.viewModel.helpLink
    });
    this.title('Create a new listing');
    this.helpLink = '/help/relatedArticles/201211055-adding-job-profiles';
    this.viewModel.helpLink = this.helpLink;
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {
    var referrer = this.app.shell.referrerRoute;
    referrer = referrer && referrer.url || '/marketplaceProfile';
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
    this.updateNavBarState();

    // Allow auto add the search text as new proposed job-title
    if (options.route.query.autoAddNew === 'true') {
        this.viewModel.selectedJobTitle({
            value: 0,
            label: s
        });
    }
    else if (options.route.query.id) {
        // An ID is passed in and added with the text (if any)
        // as a valid presset job-title ID/name (is not validated at frontend
        // to don't delay, server will double check anyway).
        if (s) {
            this.viewModel.selectedJobTitle({
                value: +options.route.query.id,
                label: s
            });
        }
    }
};

function ViewModel(app) {

    this.isInOnboarding = onboarding.inProgress;

    this.isSaving = ko.observable(false);
    this.isLocked = this.isSaving;

    this.selectedJobTitle = ko.observable(null);

    this.onSelectJobTitle = function(value, jobTitle) {
        var item = null;
        if (jobTitle && jobTitle.jobTitleID) {
            // Add to the list, if is not already in it
            item = {
                value: jobTitle.jobTitleID(),
                label: jobTitle.singularName()
            };
        }
        else {
            item = {
                value: 0,
                label: value
            };
        }
        this.selectedJobTitle(item);
        return {
            value: ActionForValue.copySelected
        };
    }.bind(this);

    this.submitText = ko.pureComputed(function() {
        return (
            onboarding.inProgress() ?
                'Create and continue' :
                this.isSaving() ?
                    'Creating...' :
                    'Create'
        );
    }, this);

    this.save = function save() {
        if (!this.selectedJobTitle()) return;
        this.isSaving(true);

        // We need to do different stuff if user is not a proffesional when requesting this
        var becomingProfessional = !user.isServiceProfessional();
        var jobTitle = this.selectedJobTitle();

        return userJobProfile.createUserJobTitle({
            jobTitleID: jobTitle.value,
            jobTitleName: jobTitle.label
        })
        .then(function(result) {
            var onEnd = function onEnd() {
                this.isSaving(false);
                if (onboarding.inProgress()) {
                    onboarding.selectedJobTitleID(result.jobTitleID());
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
                    onEnd();
                });
            }
            else {
                onEnd();
            }
        }.bind(this))
        .catch(function(error) {
            this.isSaving(false);
            showError({
                title: 'Unable to create your listing',
                error: error
            });
        }.bind(this));
    }.bind(this);
}
