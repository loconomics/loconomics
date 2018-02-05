/**
    AddJobTitle activity

    As incoming params, accepts a route.query with
    - s {string} Proposed name of a job title
    - [id] {number} A valid jobTitleID
    - autoAddNew {boolean} Must be true in order to allow an 's' and 'id', it
    makes the form to auto submit with the given values.
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
        backLink: '/listings' , helpLink: this.viewModel.helpLink
    });
    this.title('Create a new listing');
    this.helpLink = '/help/relatedArticles/201211055-adding-job-profiles';
    this.viewModel.helpLink = this.helpLink;
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {
    var referrer = this.app.shell.referrerRoute;
    referrer = referrer && referrer.url || '/listings';
    var link = this.requestData.cancelLink || referrer;

    if (!onboarding.updateNavBar(this.navBar)) {
        this.convertToCancelAction(this.navBar.leftAction(), link);
    }
};

A.prototype.show = function show(options) {

    Activity.prototype.show.call(this, options);

    // Check if we are in onboarding and a jobTitle was already added in the sign-up
    // then we can skip this step
    if (onboarding.inProgress() && onboarding.selectedJobTitleID()) {
        setTimeout(function() {
            onboarding.goNext();
        }, 10);
        return;
    }
    // Reset
    this.updateNavBarState();

    // Allow to preset an incoming value
    var s = options.route.query.s;
    if (s && options.route.query.autoAddNew === 'true') {
        // Add to the form
        this.viewModel.selectedJobTitle({
            value: options.route.query.id |0,
            label: s
        });
        // and submit it
        this.viewModel.save();
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
                    // Go to edit the just added listing
                    app.shell.go('/listingEditor/' + result.jobTitleID());
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
