/**
 * Show a modal with 'next steps' for users that finished onboarding successfully.
 * @param {Object} options
 * @param {boolean} options.isServiceProfessional Whether display message for
 * service professionals or for clients.
 * @returns {Promise<boolean>} It resolves when the modal is dismissed/closed
 * with a value of was done or not
 */
'use strict';

var ariaHideElements = require('./utils/ariaHideElements');
var fixFocus = require('./utils/fixFocus');
var TEMPLATE = require('../../html/modals/onboardingSuccess.html');
var createElement = require('./utils/createElement');
var ko = require('knockout');

exports.show = function (options) {
    return new Promise(function(resolve) {
        options = options || {};
        var modal = createElement(TEMPLATE);
        fixFocus(modal);
        // Increased accessibility:
        // NOTE: must be reverted BEFORE we fullfill
        var handle = ariaHideElements.keep(modal.get(0));

        var vm = {
            isServiceProfessional: options.isServiceProfessional,
            title: options.isServiceProfessional ? 'What\'s next?' : 'Thank you!'
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
