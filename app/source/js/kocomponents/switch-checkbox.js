/**
 * An action button inside a smart-nav-bar.
 * @module kocomponents/switch-checkbox
 */
'use strict';

var TAG_NAME = 'switch-checkbox';
var TEMPLATE = require('../../html/kocomponents/switch-checkbox.html');
var CSS_CLASS = 'SwitchCheckbox';
//require-styl '../../css/components/SwitchCheckbox.styl'

var ko = require('knockout');
var getObservable = require('../utils/getObservable');

/**
 * The viewModel rather than being just a
 * viewmodels/NavAction it returns that as a property ('action') computed
 * from a provided observable navBar and action name ('left', 'right');
 * the set-up is more complex but let the 'action' to change as a result
 * of change in the observable navBar value.
 * NOTE: the defined 'action' member is a readonly property not a knockout
 * computed so will not get notified of a change in the navBar value in order
 * to get the new NavAction instance (it will read it on new calls to the
 * property thought, that may happens if the code is re-executed, for example as
 * per a 'with' or 'if' binding in a parent, but on that cases would be possible
 * to pass in the NavAction instance at constructor with same results -- it
 * seems, need confirmation and refactoring if is the case).
 * @class
 * @param {Object} params
 * @param {KnockoutObservable<boolean>} [params.disabled]
 * @param {KnockoutObservable<boolean>} [params.checked]
 * @param {KnockoutObservable<string>} [params.id]
 */
function ViewModel(params) {
    /**
     * @member {KnockoutObservable<boolean>} [disabled]
     * @readonly
     */
    this.disabled = getObservable(params.disabled);
    /**
     * @member {KnockoutObservable<boolean>} [checked]
     * @readonly
     */
    this.checked = getObservable(params.checked);
    /**
     * @member {KnockoutObservable<string>} [id]
     * @readonly
     */
    this.id = getObservable(params.id);
}

/**
 * Factory for the component view model instances that has access
 * to the component instance DOM elements.
 * @param {object} params Component parameters to pass it to ViewModel
 * @param {object} componentInfo Instance DOM elements
 * @param {DOMElement} componentInfo.element
 */
var create = function(params, componentInfo) {
    // We set the class name directly in the component
    componentInfo.element.classList.add(CSS_CLASS);
    return new ViewModel(params);
};

ko.components.register(TAG_NAME, {
    template: TEMPLATE,
    viewModel: { createViewModel: create }
});
