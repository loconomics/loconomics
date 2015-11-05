/**
    FeedbackForm activity
**/
'use strict';

var Activity = require('../components/Activity'),
    VocElementEnum = require('../models/VocElementEnum');

var A = Activity.extends(function FeedbackFormActivity() {
    
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
    this.wasSent = ko.observable(false);
    this.isSending = ko.observable(false);
    this.vocElementID = ko.observable(0);

    var updateWasSent = function() {
        this.wasSent(false);
    }.bind(this);
    this.message.subscribe(updateWasSent);
    this.becomeCollaborator.subscribe(updateWasSent);
    
    this.submitText = ko.pureComputed(function() {
        return this.isSending() ? 'Sending..' : this.wasSent() ? 'Sent' : 'Send';
    }, this);
    
    this.send = function send() {
        this.isSending(true);
        app.model.feedback.postIdea({
            message: this.message(),
            becomeCollaborator: this.becomeCollaborator(),
            vocElementID: this.vocElementID()
        })
        .then(function() {
            // Reset after being sent
            this.message('');
            this.becomeCollaborator(false);
            this.wasSent(true);
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
