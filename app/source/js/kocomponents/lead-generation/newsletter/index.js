/**
 * Captures a user's email address and adds them to our newsletter list.
 * @module kocomponents/lead-generation-newsletter
 */
'use strict';

var TAG_NAME = 'lead-generation-newsletter';
var template = require('./template.html');

var ko = require('knockout');
require('../../../utils/autofocusBindingHandler');
var leadGenerationApi = require('../../../data/leadGeneration');
var showError = require('../../../modals/error').show;
var user = require('../../../data/userProfile').data;

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
    /**
     * @member {KnockoutObservable<boolean>}
     */
    this.isAnonymous = user.isAnonymous;

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
     * When edition must be locked because of in progress operations,
     * and too after isDone.
     * @member {KnockoutComputed<boolean>}
     */
    this.isLocked = ko.pureComputed(function() {
        return this.isSaving() || this.isDone();
    }, this);
    /**
     * Whether the email has a valid format
     * @member {KnockoutComputed<boolean>}
     */
    this.isEmailValid = ko.pureComputed(function() {
        var emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
        return emailRegex.test(this.email());
    }, this);

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
        }.bind(this));
    }.bind(this);
}

ko.components.register(TAG_NAME, {
    template: template,
    viewModel: ViewModel
});
