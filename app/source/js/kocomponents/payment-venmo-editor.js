/**
 * Lets edit info about the user set-up for payment 'venmo'.
 * @module kocomponents/payment-venmo-editor
 */
'use strict';

var TAG_NAME = 'payment-venmo-editor';
var template = require('../../html/kocomponents/payment-venmo-editor.html');

var ko = require('knockout');
var PostalCodeVM = require('../viewmodels/PostalCode');
var paymentAccount = require('../data/paymentAccount');

/**
 *
 * @class
 * @param {Object} params
 * @param {models/PaymentAccount} params.data Data to display
 */
function ViewModel(params) {
    /**
     * Data to edit
     * @member {models/PaymentAccount}
     */
    this.data = ko.unwrap(params.data);
    /**
     * Holds latest postal code validation error
     * @member {KnockoutObservable<string>}
     */
    this.postalCodeErrorMessage = ko.observable();
    /**
     * Lets validate a postal code and fetch related info
     * @member {viewmodels/PostalCode}
     */
    this.postalCodeVM = new PostalCodeVM({
        address: this.data,
        postalCodeError: this.postalCodeErrorMessage
    });
    /**
     * When a saving request it's on the works
     * @member {KnockoutObservable<boolean>}
     */
    this.isSaving = ko.observable(false);

    /**
     * When edition must be locked because of in progress operations
     * @member {KnockoutComputed<boolean>}
     */
    this.isLocked = ko.pureComputed(function() {
        return this.isSaving();
    }, this);
    /**
     * Label for the submit/save button; it changes based on state.
     * @member {KnockoutComputed<string>}
     */
    this.submitText = ko.pureComputed(function() {
        return (
            this.isSaving() ?
                'saving...' :
                'Save'
        );
    });

    this.save = function save() {
        this.isSaving(true);
        // Save
        var rollbackData = paymentAccount.data.model.toPlainObject();
        paymentAccount.data.model.updateWith(this.data);
        paymentAccount.save()
        .then(function() {
            //app.successSave();
            // TODO manage save, propagate
            this.isSaving(false);
        }.bind(this))
        .catch(function() {
            // Not saved, restore in memory data to the actually saved one
            paymentAccount.data.model.updateWith(rollbackData);
            // TODO manage event, propagate
            this.isSaving(false);
        }.bind(this));
    }.bind(this);

    /// Init
    // This component is implemented so it gets a loaded copy of the data,
    // then the postalCode lookup can be enabled right now at init
    this.postalCodeVM.onFormLoaded();
}

ko.components.register(TAG_NAME, {
    template: template,
    viewModel: ViewModel
});
