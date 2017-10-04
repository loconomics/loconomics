/**
 * A selectable list of available payment preferences options.
 * @module kocomponents/payout-preferences-list
 */
'use strict';

var TAG_NAME = 'payout-preferences-list';
var template = require('./template.html');

var ko = require('knockout');
var PaymentPreferenceOption = require('../../../models/PaymentPreferenceOption');

/**
 *
 * @class
 * @param {Object} params
 * @param {Function<models/PaymentPreferenceOption,void>} params.selectItem Callback to execute when a item is
 * selected, passing it as parameter the option instance.
 */
function ViewModel(params) {
    if (typeof(params.selectItem) !== 'function') {
        throw new Error('A selectItem callback is required');
    }
    /**
     * @method selectItem
     */
    this.selectItem = params.selectItem;
    /**
     * @member {Array<models/PaymentPreferenceOption>}
     */
    this.list = PaymentPreferenceOption.optionsList;
}

ko.components.register(TAG_NAME, {
    template: template,
    viewModel: ViewModel
});
