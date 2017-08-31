/**
    Access to use global App Modals
**/
'use strict';

exports.showError = require('./modals/error').show;

exports.confirm = require('./modals/confirm').show;

exports.showNotification = require('./modals/notification').show;

exports.showTimePicker = require('./modals/timePicker').show;

exports.showTextEditor = require('./modals/textEditor').show;

exports.showAnnouncement = require('./modals/announcementModal').show;
