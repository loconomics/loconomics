/**
    Owner Acknowledgment activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var ownerAcknowledgment = require('../data/ownerAcknowledgment');

var A = Activity.extend(function OwnerAcknowledgmentActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.isServiceProfessional;
    this.viewModel = new ViewModel(this.app);

    this.navBar = Activity.createSubsectionNavBar('Cooperative', {
        backLink: '/ownerInfo', helpLink: '/help/relatedArticles/201964153-how-owner-user-fees-work'
    });
    this.title('Cooperative Owner Disclosure');
});

module.exports = A;

A.prototype.show = function show(state) {
    // Reset
    this.viewModel.reset();

    Activity.prototype.show.call(this, state);

    // Load data, if any
    ownerAcknowledgment.sync();
};

function ViewModel(app) {

    this.isLoading = ownerAcknowledgment.isLoading;
    this.isSaving = ownerAcknowledgment.isSaving;

    this.acknowledgment = ownerAcknowledgment.data;

    this.ownerFullName = ko.observable('');

    this.reset = function() {
        this.ownerFullName('');
    };

    this.acknowledge = function() {
        ownerAcknowledgment.acknowledge({ ownerFullName: this.ownerFullName() })
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
