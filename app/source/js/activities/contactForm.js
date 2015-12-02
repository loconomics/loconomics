/**
    ContactForm activity
**/
'use strict';

var Activity = require('../components/Activity'),
    VocElementEnum = require('../models/VocElementEnum');

var A = Activity.extend(function ContactFormActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    
    this.accessLevel = this.app.UserType.loggedUser;
    
    this.navBar = Activity.createSubsectionNavBar('Talk to us');
    this.navBar.rightAction(null);
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    var params = this.requestData.route.segments || [];
    var elementName = params[0] || '',
        elementID = VocElementEnum[elementName] |0;
    
    if (!elementName) {
        console.log('Feedback Support: Accessing without specify an element, using General (0)');
    }
    else if (!VocElementEnum.hasOwnProperty(elementName)) {
        console.error('Feedback Support: given a bad VOC Element name:', elementName);
    }

    this.viewModel.vocElementID(elementID);
};

var ko = require('knockout');
function ViewModel(app) {
    
    this.message = ko.observable('');
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
        app.model.feedback.postSupport({
            message: this.message(),
            vocElementID: this.vocElementID()
        })
        .then(function() {
            // Success
            app.successSave({
                message: 'Thank you, we\'ll be in touch soon!'
            });
            // Reset after being sent
            this.message('');
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
