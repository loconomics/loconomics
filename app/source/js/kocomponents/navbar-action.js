/**
 * An action button inside a NavBar.
 * @module kocomponents/navbar-action
 */
'use strict';

var TAG_NAME = 'app-navbar-action';
var template = require('../../html/kocomponents/navbar-action.html');

var ko = require('knockout');
var propTools = require('../utils/jsPropertiesTools');

/**
 * The viewModel for the navbar-action rather than being just a
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
 * @param {string} [params.action]
 * @param {KnockoutObservable<viewmodels/NavBar>} [params.navBar]
 */
function ViewModel(params) {
    /**
     * @member {viewmodels/NavAction} [action]
     * @readonly
     */
    propTools.defineGetter(this, 'action', function() {
        return (
            params.action && params.navBar() ?
            params.navBar()[params.action]() :
            null
        );
    });
}

ko.components.register(TAG_NAME, {
    template: template,
    viewModel: ViewModel
});
