var getObservable = require('../../utils/getObservable');

'use strict';

var TAG_NAME = 'icon-radio';
var template = require('./template.html');

var ko = require('knockout');

function ViewModel(params) {

    this.value = getObservable(params.value);
    this.selected = getObservable(params.selected);
    this.label = params.label;

    this.iconClass = ko.pureComputed(function() {
        var icon = 'fa ion ion-android-radio-button-';
        if (this.value() == this.selected())
            icon += '-on';
        else
            icon += '-off';
        return icon;
    }, this);

}

ko.components.register(TAG_NAME, {
    template: template,
    viewModel: ViewModel
});
