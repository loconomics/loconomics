/**
 * TextIput Modal.
 *
 * Let's request a text to the user in a more 'imperative' or 'focused' way,
 * like when needing some comment to perform a task.
 */

var ariaHideElements = require('./utils/ariaHideElements');
var fixFocus = require('./utils/fixFocus');
var TEMPLATE = require('./textInput.html');
var createElement = require('./utils/createElement');
var ko = require('knockout');

/**
 * Display the modal to request text
 * @param {Object} options
 * @param {string} options.submitLabel Text for the 'submit/save' button (confirms
 * the user input)
 * @param {Duration} [options.text] Default text in the textarea
 * @param {string} options.title Title of the modal.
 * @param {boolean} [options.required=false] Whether the text is required (no
 * empty, no white characters). Submitting will not allowed if not given.
 * @param {string} [options.description] Larger description, clarifing the
 * purpose, the task to run on submit or some help. Are displayed before the
 * textarea.
 * @returns {Promise<string,Error>} Resolves with the user input text (or default
 * entered), or null if closed without submit (dismissed). Can be empty text
 * when required=false.
 */
exports.show = function(options) {
    return new Promise(function(resolve) {
        options = options || {};
        var modal = createElement(TEMPLATE);
        fixFocus(modal);
        // Increased accessibility:
        // NOTE: must be reverted BEFORE we fullfill
        var handle = ariaHideElements.keep(modal.get(0));
        var reverted = false;

        var vm = {
            title: options.title,
            description: options.description,
            submitLabel: options.submitLabel,
            text: ko.observable(ko.unwrap(options.text) || ''),
            submit: function() {
                handle.revert();
                reverted = true;
                modal.modal('hide');
                resolve(vm.text());
            }.bind(this)
        };
        vm.isValid = ko.pureComputed(function() {
            return !options.required || !/^\s*$/g.test(this.text());
        }, vm);
        ko.applyBindings(vm, modal.get(0));

        modal
        .off('hidden.bs.modal')
        .one('hidden.bs.modal', function() {
            if (!reverted) handle.revert();
            resolve(null);
        });
        modal.modal('show');
    });
};
