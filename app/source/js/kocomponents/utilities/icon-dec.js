/**
 * @module kocomponents/icon-dec
 * @author joshdanielson
 * @overview A decorative icon. It adds detects which icon font is being used 
 * and adds it as an extra class. Additionaly, it sets aria-hidden 
 * to "true" so that it is hidden from screen readers.
 * @param {string} icon - The icon class from either the Ionicon or 
 * Font Awesome icon fonts.
 * @function [<iconClass>] - This function takes icon parameter and adds 
 * the 'fa' or 'ion' to the icon's class depending on the icon's font 
 * to enable targeting via CSS.
 * @example 
 * <icon-dec params="icon: 'ion-edit'"><icon-dec>
 * // returns <i data-bind="css: 'ion ion-edit'" aria-hidden="true"></i>
 * <icon-dec params="icon: 'fa-cash'"><icon-dec>
 * // returns <i data-bind="css: 'fa fa-cash'" aria-hidden="true"></i>
 */
'use strict';

var TAG_NAME = 'icon-dec';
var TEMPLATE = require('../../../html/kocomponents/utilities/icon-dec.html');
var getObservable = require('../../utils/getObservable');

var ko = require('knockout');

function ViewModel(params) {
    this.icon = getObservable(params.icon);
    this.iconClass = ko.pureComputed(function() {
        if (this.icon().match(/^fa-.*$/))
        {
            return 'fa ' + this.icon();
        }
        else if (this.icon().match(/^ion-.*$/))
        {
            return 'ion ' + this.icon();
        }
        else {
            return this.icon();
        }
    }, this);
}

ko.components.register(TAG_NAME, {
    template: TEMPLATE,
    viewModel: ViewModel
});
