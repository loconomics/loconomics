/**
 *   Show a modal that requires user to set-up a payout preference.
 *   @param {Object} options
 *   @param {Reason} options.reason A valid reason
 *   @returns {Promise<boolean>} It resolves when the modal is dismissed/closed
 *   with a value of was done or not
 */
// TODO jsdocs
'use strict';

var ariaHideElements = require('./utils/ariaHideElements');
var fixFocus = require('./utils/fixFocus');
var TEMPLATE = require('../../html/modals/payoutPreferenceRequired.html');
var createElement = require('./utils/createElement');
var ko = require('knockout');
require('../kocomponents/payout/preference-view');

exports.Reason = {
    enablingInstantBooking: 'enablingInstantBooking',
    acceptBookingRequest: 'acceptBookingRequest'
};

var getTextForReason = function(reason) {
    switch (reason) {
        case exports.Reason.enablingInstantBooking:
            return 'You need to enable payments to allow instant booking.';
        case exports.Reason.acceptBookingRequest:
            return 'You need to enable payments to accept this booking request';
        default:
            return 'This is required to start accepting payments.';
    }
};

exports.show = function (options) {
    return new Promise(function(resolve) {
        options = options || {};
        var modal = createElement(TEMPLATE);
        fixFocus(modal);
        // Increased accessibility:
        // NOTE: must be reverted BEFORE we fullfill
        var handle = ariaHideElements.keep(modal.get(0));

        var vm = {
            onSaved: function() {
                resolve(true);
                modal.modal('hide');
            }.bind(this),
            description: getTextForReason(options.reason)
        };
        ko.applyBindings(vm, modal.get(0));

        modal
        .off('hide.bs.modal')
        .one('hide.bs.modal', function() {
            handle.revert();
            resolve(false);
        });
        modal.modal('show');
    });
};
