/**
 * Access to use global App Modals
 * @deprecated Do require the modals directly on your module rather than use
 * this module; here all modals are preloaded, breaking multi-bundling
 * optimizations.
 * @see https://github.com/loconomics/loconomics/issues/490 Issue #490
 */
'use strict';

exports.showError = require('./modals/error').show;
exports.confirm = require('./modals/confirm').show;
exports.showNotification = require('./modals/notification').show;
exports.showTimePicker = require('./modals/timePicker').show;
exports.showTextEditor = require('./modals/textEditor').show;
exports.showAnnouncement = require('./modals/announcement').show;
