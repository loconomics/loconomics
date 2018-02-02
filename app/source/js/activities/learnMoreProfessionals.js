/**
    Home activity (aka Search)
    //used to get apisearch results by term, lat, long,
**/
'use strict';

import '../kocomponents/utilities/icon-dec';
var ko = require('knockout');
var Activity = require('../components/Activity');
var SignupVM = require('../viewmodels/Signup');
var user = require('../data/userProfile').data;
var ActionForValue = require('../kocomponents/job-title-autocomplete').ActionForValue;

var SIGNUP_ELEMENT_SELECTOR = '#learnMoreProfessionals-signup';

var A = Activity.extend(function LearnMoreProfessionalsActivity() {

    Activity.apply(this, arguments);
    this.navBar = Activity.createSectionNavBar(null);
    var navBar = this.navBar;
    navBar.additionalNavClasses('AppNav--home');
    this.title('List your services');
    this.accessLevel = null;
    this.viewModel = new ViewModel(this.app);
    this.viewModel.nav = this.app.navBarBinding;
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    this.viewModel.reset();
};

function ViewModel(app) {
    this.isServiceProfessional = user.isServiceProfessional;
    this.isClient = user.isClient;

    ///
    /// Signup
    // Component API entry point: expects SignupVM
    this.signup = ko.observable();
    this.resetSignup = function() {
        var signup = this.signup();
        if (signup instanceof SignupVM) {
            signup.reset();

            // Presets: settings we require to keep the same
            // like untouched by the reset
            signup.profile(SignupVM.profileType.serviceProfessional);
            // Hide and preset the country
            signup.isCountryVisible(false);
            // default preset is already united state in the VM
        }
    };
    this.signup.subscribe(this.resetSignup.bind(this));
    // Redirect on success signup
    this.signupRedirect = function() {
        app.goDashboard();
    };
    this.setSignupJobTitle = function(id, name) {
        var signup = this.signup();
        if (signup instanceof SignupVM) {
            signup.jobTitleID(id || undefined);
            signup.jobTitleName(name || undefined);
        }
    };

    // A static utility (currently only used to conditionally show/hide DownloadApp links)
    this.inApp = ko.observable(!!window.cordova);

    this.reset = function() {
        // Reset user values, no preset settings
        this.resetSignup();
    }.bind(this);

    /**
     * @member {KnockoutComputed<string>} suggestionButtonText Gives the text
     * for each suggestion button based on the action triggered after select
     * one
     */
    this.suggestionButtonText = ko.pureComputed(function() {
        var anon = user.isAnonymous();
        return anon ? 'Sign up' : 'Add';
    }, this);

    /**
     * @method onSelectJobTitle
     * Component event handler for selecting a suggested job-title:
     * - It moves anonymous users to the Sign-up form integrated on this
     *   activity, including the job-title for automatic addition.
     * - It moves non-anonymous users to dashboard 'add job title' activity
     *   to continue setting-up the selected one.
     * @param {string} jobTitleName As typed by the user or selected value
     * @param {Object} [jobTitle] Record for a selected job title; will be null
     * when no one exists and just a typed name is included.
     */
    this.onSelectJobTitle = function(jobTitleName, jobTitle) {
        var url;
        if (jobTitle && jobTitle.jobTitleID) {
            if (user.isAnonymous()) {
                this.setSignupJobTitle(jobTitle.jobTitleID());
                app.shell.scrollTo(SIGNUP_ELEMENT_SELECTOR, true);
            }
            else {
                // For logged users, assist them to add the job title:
                url = 'addJobTitle?s=' + encodeURIComponent(jobTitle.singularName()) +
                    '&id=' + encodeURIComponent(jobTitle.jobTitleID()) +
                    "&autoAddNew=true";
                app.shell.go(url);
            }
        }
        else {
            if (user.isAnonymous()) {
                this.setSignupJobTitle(null, jobTitleName);
                app.shell.scrollTo(SIGNUP_ELEMENT_SELECTOR, true);
            }
            else {
                // Go to addJobTitle
                url = 'addJobTitle?s=' + encodeURIComponent(jobTitleName) + '&autoAddNew=true';
                app.shell.go(url);
            }
        }
        return {
            value: ActionForValue.clear
        };
    }.bind(this);
}
