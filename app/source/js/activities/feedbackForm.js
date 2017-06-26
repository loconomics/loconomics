/**
    FeedbackForm activity
**/
'use strict';

var Activity = require('../components/Activity'),
    VocElementEnum = require('../models/VocElementEnum');
var userProfile = require('../data/userProfile');
var user = userProfile.getData();
var onboarding = require('../data/onboarding');
var feedback = require('../data/feedback');

var A = Activity.extend(function FeedbackFormActivity() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);

    this.accessLevel = null;

    var serviceProfessionalNavBar = Activity.createSubsectionNavBar('Back', {
        helpLink: this.viewModel.helpLinkProfessionals
    });
    this.serviceProfessionalNavBar = serviceProfessionalNavBar.model.toPlainObject(true);
    var clientNavBar = Activity.createSubsectionNavBar('Back', {
        helpLink: this.viewModel.helpLinkClients
    });
    this.clientNavBar = serviceProfessionalNavBar.model.toPlainObject(true);
    this.navBar = this.viewModel.user.isServiceProfessional() ? serviceProfessionalNavBar : clientNavBar;
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {

    if (!onboarding.updateNavBar(this.navBar)) {
        // Reset
        var nav = this.viewModel.user.isServiceProfessional() ? this.serviceProfessionalNavBar : this.clientNavBar;
        this.navBar.model.updateWith(nav, true);
    }
};

A.prototype.show = function show(options) {
    //jshint maxcomplexity:10
    Activity.prototype.show.call(this, options);

    this.updateNavBarState();

    var params = this.requestData.route.segments || [];
    var elementName = params[0] || '',
        elementID = VocElementEnum[elementName] |0;

    this.viewModel.message(this.requestData.route.query.body || this.requestData.route.query.message || '');

    if (!elementName) {
        console.log('Feedback Ideas: Accessing feedback without specify an element, using General (0)');
    }
    else if (!VocElementEnum.hasOwnProperty(elementName)) {
        console.error('Feedback Ideas: given a bad VOC Element name:', elementName);
    }

    this.viewModel.vocElementID(elementID);
};

var ko = require('knockout');
function ViewModel(app) {

    this.isInOnboarding = onboarding.inProgress;
    this.user = user;
    this.helpLinkProfessionals = '/help/relatedArticles/201960863-providing-feedback-to-us';
    this.helpLinkClients = '/help/relatedArticles/202894686-providing-feedback-to-us';
    this.helpLink = ko.pureComputed(function() {
        return this.user.isServiceProfessional() ? this.helpLinkProfessionals : this.helpLinkClients ;
    }, this);
    this.message = ko.observable('');
    this.becomeCollaborator = ko.observable(false);
    // Get reference to know if is already a collaborator
    this.isCollaborator = user.isCollaborator;
    this.isSending = ko.observable(false);
    this.vocElementID = ko.observable(0);
    this.emailSubject = ko.observable('');

    this.submitText = ko.pureComputed(function() {
        return this.isSending() ? 'Sending..' : 'Send';
    }, this);

    this.isValid = ko.pureComputed(function() {
        var m = this.message();
        return m && !/^\s*$/.test(m);
    }, this);

    this.anonymousButtonUrl = ko.pureComputed(function() {
        if (!user.isAnonymous()) return '';

        var subject = encodeURIComponent('Feedback');
        var body = encodeURIComponent(this.message());
        var url = 'mailto:support@loconomics.com?subject=' + subject + '&body=' + body;
        return url;
    }, this);

    this.send = function send() {
        // Check is valid, and do nothing if not
        if (!this.isValid() || user.isAnonymous()) {
            return;
        }
        this.isSending(true);
        feedback.postIdea({
            message: this.message(),
            becomeCollaborator: this.becomeCollaborator(),
            vocElementID: this.vocElementID()
        })
        .then(function() {
            // Update local profile in case marked becameCollaborator and was not already
            if (!this.isCollaborator() && this.becomeCollaborator()) {
                // Tag locally already
                this.isCollaborator(true);
                // But ask the profile to update, by request a 'save' even if
                // will not save the flag but will get it updated from database and will cache it
                userProfile.save();
            }
            // Success
            app.successSave({
                message: 'Sent! Thank you for your input.'
            });
            // Reset after being sent
            this.message('');
            this.becomeCollaborator(false);
        }.bind(this))
        .catch(function(err) {
            app.modals.showError({
                title: 'There was an error sending your feedback',
                error: err
            });
        })
        .then(function() {
            // Always
            this.isSending(false);
        }.bind(this));
    }.bind(this);
}
