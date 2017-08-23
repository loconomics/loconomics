/**
 * Use for icons that use icon fonts. It adjusts for the slightly larger size of Font Awesome icons.
 * @module kocomponents/icon
 */
'use strict';

var TAG_NAME = 'icon';
var TEMPLATE = require('../../../html/kocomponents/utilities/icon.html');
var getObservable = require('../../utils/getObservable');

var ko = require('knockout');

function ViewModel(params) {
    // parameter "icon" for the selected font icon using the Ionicon or Font Awesome icon fonts.
    this.icon = getObservable(params.icon);
    // parameter "icon", string to fill icon class that adds the "fa" class if a Font Awesome icon.
    this.iconClass = ko.pureComputed(function() {
        if (this.icon().match(/^fa-.*$/))
        {
            return 'fa ' + this.icon();
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
