/**
    FeedbackForm activity
**/
'use strict';

var Activity = require('../components/Activity'),
    VocElementEnum = require('../models/VocElementEnum');

var A = Activity.extend(function FeedbackFormActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    
    this.accessLevel = this.app.UserType.loggedUser;
    
    this.navBar = Activity.createSubsectionNavBar('Talk to us');
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    var params = this.requestData.route.segments || [];
    var elementName = params[0] || '',
        elementID = VocElementEnum[elementName] |0;
    
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
    
    this.message = ko.observable('');
    this.becomeCollaborator = ko.observable(false);
    // Get reference to know if is already a collaborator
    this.isCollaborator = app.model.userProfile.data.isCollaborator;
    this.isSending = ko.observable(false);
    this.vocElementID = ko.observable(0);

    this.submitText = ko.pureComputed(function() {
        return this.isSending() ? 'Sending..' : 'Send';
    }, this);
    
    this.isValid = ko.pureComputed(function() {
        var m = this.message();
        return m && !/^\s*$/.test(m);
    }, this);

    this.send = function send() {
        // Check is valid, and do nothing if not
        if (!this.isValid()) {
            return;
        }
        this.isSending(true);
        app.model.feedback.postIdea({
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
                app.model.userProfile.save();
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
