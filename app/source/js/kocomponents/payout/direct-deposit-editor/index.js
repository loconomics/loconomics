/**
 * Lets edit info about the user set-up for payment 'direct deposit'.
 * @module kocomponents/payout-direct-deposit-editor
 */
'use strict';

var TAG_NAME = 'payout-direct-deposit-editor';
var template = require('./template.html');

var ko = require('knockout');
var PostalCodeVM = require('../../../viewmodels/PostalCode');
var paymentAccount = require('../../../data/paymentAccount');
var showError = require('../../../modals/error').show;

/**
 *
 * @class
 * @param {Object} params
 * @param {models/PaymentAccount} params.data Data to display
 */
function ViewModel(params) {
    /**
     * Component was disposed (removed and waiting from GC)
     * @member {KnockoutObservable<boolean>}
     */
    this.isDisposed = ko.observable(false);
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
        return this.isSaving() ?
            'saving...' :
            'Save';
    }, this);

    /**
     * Tag instance as disposed to prevent pending async task from wasting time.
     * Is called automatically by KO
     */
    this.dispose = function() {
        this.isDisposed(true);
    };

    this.onSaved = ko.unwrap(params.onSaved);

    this.save = function save() {
        // Quick validation
        if (!this.data.areAccountNumbersEquals()) {
            showError({
                title: 'Review your account number',
                message: '"Account number" and "Confirm account number" fields do not match.'
            });
            return;
        }
        this.isSaving(true);
        // Save
        var data = this.data.model.toPlainObject();
        data.isVenmo = false;
        paymentAccount.save(data)
        .then(function() {
            this.isSaving(false);
            if (this.isDisposed()) return;

            if (this.onSaved) {
                this.onSaved();
            }
        }.bind(this))
        .catch(function(error) {
            this.isSaving(false);

            if (this.isDisposed()) return;

            showError({
                title: 'Error saving your payout preference',
                error: error
            });
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
