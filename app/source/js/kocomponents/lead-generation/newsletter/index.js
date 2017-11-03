/**
 * Captures a user's email address and adds them to our newsletter list.
 * @module kocomponents/lead-generation-newsletter
 */
'use strict';

var TAG_NAME = 'lead-generation-newsletter';
var template = require('./template.html');

var ko = require('knockout');

ko.components.register(TAG_NAME, {
    template: template
});
