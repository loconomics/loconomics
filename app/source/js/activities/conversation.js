/**
    Conversation activity
**/
'use strict';

var Activity = require('../components/Activity');
var user = require('../data/userProfile').getData();

var A = Activity.extend(function ConversationActivity() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);

    var serviceProfessionalNavBar = Activity.createSubsectionNavBar('Inbox', {
        backLink: '/inbox' , helpLink: this.viewModel.helpLinkProfessionals
    });
    this.serviceProfessionalNavBar = serviceProfessionalNavBar.model.toPlainObject(true);
    var clientNavBar = Activity.createSubsectionNavBar('Inbox', {
        backLink: '/inbox', helpLink: this.viewModel.helpLinkClients
    });
    this.clientNavBar = serviceProfessionalNavBar.model.toPlainObject(true);
    this.navBar = this.viewModel.user.isServiceProfessional() ? serviceProfessionalNavBar : clientNavBar;
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {

    if (!this.app.model.onboarding.updateNavBar(this.navBar)) {
        // Reset
        var nav = this.viewModel.user.isServiceProfessional() ? this.serviceProfessionalNavBar : this.clientNavBar;
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
            this.app.modals.showError({
                title: 'Error loading conversation',
                error: err
            }).then(function() {
                this.app.shell.goBack();
            }.bind(this));
        }.bind(this));
    }
    else {
        this.app.modals.showError({
            title: 'Conversation Not Found'
        }).then(function() {
            this.app.shell.goBack();
        }.bind(this));
    }
};

var ko = require('knockout');

function ViewModel(app) {

    this.user = user;
    this.helpLinkProfessionals = '/help/relatedArticles/201966986-sending-and-receiving-messages';
    this.helpLinkClients = '/help/relatedArticles/201966996-sending-and-receiving-messages';
    this.helpLink = ko.pureComputed(function() {
        return this.user.isServiceProfessional() ? this.helpLinkProfessionals : this.helpLinkClients ;
    }, this);

    this.isLoading = app.model.messaging.state.isLoading;
    this.isSyncing = app.model.messaging.state.isSyncing;
    this.isSaving = app.model.messaging.state.isSaving;

    this.threadID = ko.observable(null);
    this.thread = app.model.messaging.createWildcardItem();

    this.subject = ko.pureComputed(function() {
        var m = this.thread();
        return (
            this.isLoading() ?
                'Loading...' :
                m && (m.subject() || '').replace(/^\s+|\s+$/g, '') || 'Conversation without subject'
        );
    }, this);
    // User Profile
    var userProfile = app.model.userProfile;
    var profileVersion = userProfile.newVersion();
    profileVersion.isObsolete.subscribe(function(itIs) {
        if (itIs) {
            // new version from server while editing
            // FUTURE: warn about a new remote version asking
            // confirmation to load them or discard and overwrite them;
            // the same is need on save(), and on server response
            // with a 509:Conflict status (its body must contain the
            // server version).
            // Right now, just overwrite current changes with
            // remote ones:
            profileVersion.pull({ evenIfNewer: true });
        }
    });

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
