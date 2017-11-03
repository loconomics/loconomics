'use strict';

var TAG_NAME = 'icon-checkbox';
var template = require('./template.html');

var ko = require('knockout');

function ViewModel(params) {

    this.value = params.value;
    this.label = params.label;

    this.iconClass = ko.pureComputed(function() {
        return 'icon';
    }, this);

}

ko.components.register(TAG_NAME, {
    template: template,
    viewModel: ViewModel
});
