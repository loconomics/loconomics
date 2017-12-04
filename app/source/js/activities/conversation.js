/**
    Conversation activity
**/
'use strict';

var Activity = require('../components/Activity');
var user = require('../data/userProfile').data;
var onboarding = require('../data/onboarding');
var messaging = require('../data/messaging');
var showError = require('../modals/error').show;

var A = Activity.extend(function ConversationActivity() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel();

    var serviceProfessionalNavBar = Activity.createSubsectionNavBar('Inbox', {
        backLink: '/inbox' , helpLink: this.viewModel.helpLinkProfessionals
    });
    this.serviceProfessionalNavBar = serviceProfessionalNavBar.model.toPlainObject(true);
    var clientNavBar = Activity.createSubsectionNavBar('Inbox', {
        backLink: '/inbox', helpLink: this.viewModel.helpLinkClients
    });
    this.clientNavBar = serviceProfessionalNavBar.model.toPlainObject(true);
    this.navBar = this.viewModel.user.isServiceProfessional() ? serviceProfessionalNavBar : clientNavBar;
    this.title('Conversation history');
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {

    if (!onboarding.updateNavBar(this.navBar)) {
        // Reset
        var nav = user.isServiceProfessional() ? this.serviceProfessionalNavBar : this.clientNavBar;
        this.navBar.model.updateWith(nav, true);
    }
};

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    // Reset
    this.viewModel.threadID(0);
    this.viewModel.thread(null);

    this.updateNavBarState();

    // Params
    var params = state && state.route && state.route.segments || [],
        threadID = params[0] |0;

    this.viewModel.threadID(threadID);

    // Load the data
    if (threadID) {
        this.viewModel.thread.sync(threadID)
        .catch(function(err) {
            showError({
                title: 'Error loading conversation',
                error: err
            }).then(function() {
                this.app.shell.goBack();
            }.bind(this));
        }.bind(this));
    }
    else {
        showError({
            title: 'Conversation Not Found'
        }).then(function() {
            this.app.shell.goBack();
        }.bind(this));
    }
};

var ko = require('knockout');

function ViewModel() {

    this.user = user;
    this.helpLinkProfessionals = '/help/relatedArticles/201966986-sending-and-receiving-messages';
    this.helpLinkClients = '/help/relatedArticles/201966996-sending-and-receiving-messages';
    this.helpLink = ko.pureComputed(function() {
        return user.isServiceProfessional() ? this.helpLinkProfessionals : this.helpLinkClients ;
    }, this);

    this.isLoading = messaging.state.isLoading;
    this.isSyncing = messaging.state.isSyncing;
    this.isSaving = messaging.state.isSaving;

    this.threadID = ko.observable(null);
    this.thread = messaging.createWildcardItem();

    this.subject = ko.pureComputed(function() {
        var m = this.thread();
        return (
            this.isLoading() ?
                'Loading...' :
                m && (m.subject() || '').replace(/^\s+|\s+$/g, '') || 'Conversation without subject'
        );
    }, this);

    // If the last message reference a booking, is
    // accessed with:
    this.bookingID = ko.pureComputed(function() {
        var msg = this.thread() && this.thread().messages()[0];
        if (msg &&
            (msg.auxT() || '').toLowerCase() === 'booking' &&
            msg.auxID()) {
            return msg.auxID();
        }
        else {
            return null;
        }
    }, this);

    this.linkToBooking = ko.pureComputed(function() {
        return '#!/viewBooking/' + this.bookingID();
    }, this);
}
