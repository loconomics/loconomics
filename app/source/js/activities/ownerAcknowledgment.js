/**
    Owner Acknowledgment activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');

var A = Activity.extend(function OwnerAcknowledgmentActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.isServiceProfessional;
    this.viewModel = new ViewModel(this.app);

    this.navBar = Activity.createSubsectionNavBar('Owner information', {
        backLink: '/ownerInfo', helpLink: '/help/relatedArticles/201964153-how-owner-user-fees-work'
    });
});

module.exports = A;

A.prototype.show = function show(state) {
    // Reset
    this.viewModel.reset();

    Activity.prototype.show.call(this, state);

    // Load data, if any
    this.app.model.ownerAcknowledgment.sync();
};

function ViewModel(app) {

    this.isLoading = app.model.ownerAcknowledgment.isLoading;
    this.isSaving = app.model.ownerAcknowledgment.isSaving;

    this.acknowledgment = app.model.ownerAcknowledgment.data;

    this.ownerFullName = ko.observable('');

    this.reset = function() {
        this.ownerFullName('');
    };

    this.acknowledge = function() {
        app.model.ownerAcknowledgment.acknowledge({ ownerFullName: this.ownerFullName() })
        .then(function() {
            app.successSave();
        })
        .catch(function(err) {
            app.modals.showError({
                title: 'Error saving',
                error: err
            });
        });
    };
}
