/**
 * Captures a user's email address and adds them to our newsletter list.
 * @module kocomponents/lead-generation-newsletter
 */
'use strict';

var TAG_NAME = 'lead-generation-newsletter';
var template = require('./template.html');

var ko = require('knockout');
var leadGenerationApi = require('../../../data/leadGeneration');
var showError = require('../../../modals/error').show;

/**
 *
 * @class
 */
function ViewModel() {
    /// Form data
    /**
     * @member {KnockoutObservable<string>}
     */
    this.email = ko.observable('');
    /**
     * @member {KnockoutObservable<boolean>}
     */
    this.isServiceProfessional = ko.observable(false);

    /// Statuses
    /**
     * Whether a subscription request was already and successfully sent
     * @member {KnockoutObservable<boolean>}
     */
    this.isDone = ko.observable(false);
    /**
     * Error message from last 'save' operation
     * @member {KnockoutObservable<string>}
     */
    this.errorMessage = ko.observable('');
    /**
     * When a saving request it's on the works
     * @member {KnockoutObservable<boolean>}
     */
    this.isSaving = ko.observable(false);
    /**
     * When edition must be locked because of in progress operations.
     * Just an alias for saving in this case, but expected to be used properly
     * at the data-binds
     * @member {KnockoutComputed<boolean>}
     */
    this.isLocked = this.isSaving;

    /// Methods
    /**
     * Sends the subscription request
     */
    this.save = function() {
        // Prevent unwanted repeatitions:
        if (this.isDone()) return;

        this.isSaving(true);
        var data = {
            email: this.email(),
            isServiceProfessional: this.isServiceProfessional()
        };
        return leadGenerationApi.subscribeNewsletter(data)
        .then(function() {
            this.isSaving(false);
            this.errorMessage(null);
            this.isDone(true);
        }.bind(this))
        .catch(function(err) {
            this.isSaving(false);
            return showError({
                error: err
            })
            .then(function(errorMessage) {
                this.errorMessage(errorMessage);
            }.bind(this));
        });
    }.bind(this);
}

ko.components.register(TAG_NAME, {
    template: template,
    viewModel: ViewModel
});
