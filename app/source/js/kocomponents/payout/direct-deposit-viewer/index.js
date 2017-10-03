/**
 * Displays info about the user set-up for payment 'direct deposit'.
 * @module kocomponents/payout-direct-deposit-viewer
 */
'use strict';

var TAG_NAME = 'payout-direct-deposit-viewer';
var template = require('./template.html');

var ko = require('knockout');

/**
 *
 * @class
 * @param {Object} params
 * @param {(models/PaymentAccount|KnockoutObservable<models/PaymentAccount>)} params.data Data to display
 * @param {function} [params.requestEdit] Callback that request to open an
 * editor for the data; will show up a button only if a callback is provided.
 * @param {KnockoutComputed<boolean>} params.isEditorOpened Let's notify externally
 * if the editor has opened or not.
 */
function ViewModel(params) {
    /**
     * Data to display
     * @member {models/PaymentAccount}
     */
    this.data = ko.unwrap(params.data);
    /**
     * Callback to request open an editor for current data
     * @member {function}
     */
    this.requestEdit = params.requestEdit || null;
    /**
     * When external editor is opened
     * @member {(KnockoutComputed<boolean>|KnockoutObservable<boolean>)}
     */
    this.isEditorOpened = ko.isObservable(params.isEditorOpened) ? params.isEditorOpened : ko.observable(false);
}

ko.components.register(TAG_NAME, {
    template: template,
    viewModel: ViewModel
});
