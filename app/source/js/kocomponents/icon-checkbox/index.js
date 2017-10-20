'use strict';

var TAG_NAME = 'icon-checkbox';
var template = require('./template.html');

var ko = require('knockout');

ko.components.register(TAG_NAME, {
    template: template
});
