var getObservable = require('../../utils/getObservable');

'use strict';

var TAG_NAME = 'icon-checkbox';
var template = require('./template.html');

var ko = require('knockout');

function ViewModel(params) {

    this.value = getObservable(params.value);
    this.label = params.label;

    this.iconClass = ko.pureComputed(function() {
        var icon = 'fa ion ion-android-checkbox-outline';
        if (!this.value())
            icon += '-blank';
        return icon;
    }, this);

}

ko.components.register(TAG_NAME, {
    template: template,
    viewModel: ViewModel
});
