/**
 * Captures a user's email address and adds them to our newsletter list.
 * @module kocomponents/lead-generation-refer
 */
'use strict';

var TAG_NAME = 'lead-generation-refer';
var template = require('./template.html');

var ko = require('knockout');

ko.components.register(TAG_NAME, {
    template: template
});