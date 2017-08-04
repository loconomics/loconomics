/**
 * A view showing the user payment preference and letting him to select
 * and set-up a preference option.
 * @module kocomponents/payment-preferences-view
 */
'use strict';

var TAG_NAME = 'payment-preference-view';
var template = require('../../html/kocomponents/payment-preference-view.html');

var ko = require('knockout');
require('./payment-preferences-list');
require('./payment-direct-deposit-viewer');
require('./payment-direct-deposit-editor');
require('./payment-venmo-viewer');
require('./payment-venmo-editor');
var paymentAccount = require('../data/paymentAccount');
var PaymentPreferenceOption = require('../models/PaymentPreferenceOption');
var AvailableOptions = PaymentPreferenceOption.AvailableOptions;

/**
 *
 * @class
 */
function ViewModel() {
    /**
     * Component is ready (initialized and with data)
     * @member {KnockoutObservable<boolean>}
     */
    this.isReady = ko.observable(false);
    /**
     * Preference Option ID selected to make available in the editor component.
     * If null, no editor is displayed
     * @member {KnockoutObservable<string>}
     */
    this.editorPreferenceID = ko.observable(null);
    /**
     * Holds the stored data for the saved user payment preference option
     * @member {KnockoutObservable<model/PaymentAccount>}
     */
    this.paymentOptionData = ko.observable(null);
    /**
     * When the selector/list component must be opened, allowing user to pick
     * up a preference to edit.
     * @member {KnockoutObservable<boolean>}
     */
    this.isSelectorOpened = ko.observable(true);

    /**
     * The ID of the preference stored to be displayed in the viewer component.
     * If null, no viewer is displayed
     * @member {KnockoutComputed<string>}
     */
    this.viewerPreferenceID = ko.pureComputed(function() {
        // Infered from the stored data model
        var data = this.paymentOptionData();

        if(data && data.status()) {
            var isVenmo = !data.accountNumber() || !data.routingNumber();
            return isVenmo ? AvailableOptions.venmo : AvailableOptions.directDeposit;
        }
        else {
            return null;
        }
    }, this);
    /**
     * When the viewer component for Venmo preference must be opened.
     * @member {KnockoutComputed<boolean>}
     */
    this.isVenmoViewerOpened = ko.pureComputed(function() {
        return this.viewerPreferenceID() === AvailableOptions.venmo;
    }, this);
    /**
     * When the viewer component for Direct Deposit preference must be opened.
     * @member {KnockoutComputed<boolean>}
     */
    this.isDirectDepositViewerOpened = ko.pureComputed(function() {
        return this.viewerPreferenceID() === AvailableOptions.directDeposit;
    }, this);
    /**
     * When the editor component for Venmo preference must be opened.
     * @member {KnockoutComputed<boolean>}
     */
    this.isVenmoEditorOpened = ko.pureComputed(function() {
        return this.editorPreferenceID() === AvailableOptions.venmo;
    }, this);
    /**
     * When the viewer component for Direct Deposit preference must be opened.
     * @member {KnockoutComputed<boolean>}
     */
    this.isDirectDepositEditorOpened = ko.pureComputed(function() {
        return this.editorPreferenceID() === AvailableOptions.directDeposit;
    }, this);

    /**
     * Select a preference for set-up.
     * @method
     * @param {model/PaymentPreferenceOption} prefOption
     */
    this.selectPreference = function(prefOption) {
        // Save the selected option as the one to edit
        this.editorPreferenceID(prefOption.paymentPreferenceOptionID());
        // and hide the selector list
        this.isSelectorOpened(false);
    }.bind(this);
    /**
     * Open the editor component for Direct Deposit preference
     * @method
     */
    this.openDirectDepositEditor = function() {
        this.editorPreferenceID(AvailableOptions.directDeposit);
        // and hide the selector list
        this.isSelectorOpened(false);
    }.bind(this);
    /**
     * Open the editor component for Venmo preference
     * @method
     */
    this.openVenmoEditor = function() {
        this.editorPreferenceID(AvailableOptions.venmo);
        // and hide the selector list
        this.isSelectorOpened(false);
    }.bind(this);
    /**
     * Open the selector component, hidden active editor if any
     * @method
     */
    this.openSelector = function() {
        this.editorPreferenceID(null);
        this.isSelectorOpened(true);
    }.bind(this);

    /**
     * Request to load the stored user data for current payment preference
     * @private
     * // TODO Manage/notify errors
     */
    var load = function() {
        paymentAccount.load()
        .then(function(data) {
            this.paymentOptionData(data.model.clone());
            // If there is data with an active record, selector is hidden
            if (data && data.status()) {
                this.isSelectorOpened(false);
            }
            this.isReady(true);
        }.bind(this));
    }.bind(this);

    /// Init
    load();
}

ko.components.register(TAG_NAME, {
    template: template,
    viewModel: ViewModel
});
