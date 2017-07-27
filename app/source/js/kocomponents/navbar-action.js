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
 * @class
 * @param {Object} params
 * @param {string} params.action
 * @param {KnockoutObservable<viewmodels/NavBar>} params.navBar
 */
function ViewModel(params) {
    /**
     * @member {Function} action
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
