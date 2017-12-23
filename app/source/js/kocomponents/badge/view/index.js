/**
 * Displays badges users have earned. Loconomics badges are currently issued through badgr.io
 * @module kocomponents/badge-view
 */
'use strict';

var TAG_NAME = 'badge-view';
var template = require('./template.html');

var ko = require('knockout');
var showError = require('../../../modals/error').show;