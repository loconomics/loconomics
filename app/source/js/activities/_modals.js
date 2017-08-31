/**
    _modals activity
**/
'use strict';

var Activity = require('../components/Activity');
var showAnnouncement = require('../modals/announcement').show;
var showConfirm = require('../modals/confirm').show;
var showError = require('../modals/error').show;
var showNotification = require('../modals/notification').show;
var showTextEditor = require('../modals/textEditor').show;
var showTimePicker = require('../modals/timePicker').show;

var A = Activity.extend(function _modalsActivity() {

    Activity.apply(this, arguments);
    this.accessLevel = this.app.UserType.loggedUser;

    this.viewModel = {
        // ANNOUNCEMENT
        announcement1: function() {
            showAnnouncement();
        },
        announcement2: function() {
            // Content from home.js San Francisco Launch Popup
            showAnnouncement({
                message: 'We\'re an app for booking local services that\'s cooperatively owned by service professionals. Right now we\'re busy recruiting service professional owners in San Francisco and Oakland. Click below to learn more.',
                primaryButtonText: 'I\'m a service professional',
                primaryButtonLink: '#!/learnMoreProfessionals',
                secondaryButtonText: 'I\'m a potential client',
                secondaryButtonLink: '#!/'
            });
        },
        // CONFIRM
        confirm1: function() {
            showConfirm();
        },
        confirm2: function() {
            showConfirm({
                title: 'Cancel',
                message: 'Are you sure?',
                yes: 'Yes',
                no: 'No'
            });
        },
        confirm3: function() {
            showConfirm({
                title: 'Delete item',
                message: 'You will delete item 34',
                yes: 'Delete',
                no: 'Keep'
            });
        },
        // ERROR
        error1: function() {
            showError();
        },
        error2: function() {
            // Error object, with saving data example
            showConfirm({
                title: 'Unable so save data',
                error: new Error('Server Error: impossible to save item')
            });
        },
        error3: function() {
            // Exception object, with loading data example
            showConfirm({
                title: 'Unable so load your availability preferences',
                error: {
                    name: 'XMLHttpRequest Error',
                    message: 'No response from server'
                }
            });
        },
        // NOTIFICATION
        notification1: function() {
            showNotification();
        },
        notification2: function() {
            showNotification({
                title: 'Confirmation request',
                message: 'A message was sent to your inbox to confirm your email address. Click the link inside and you are done',
                buttonText: 'Got it!'
            });
        },
        // TEXT EDITOR
        textEditor1: function() {
            showTextEditor();
        },
        textEditor2: function() {
            showTextEditor({
                title: 'Add notes about the client',
                text: 'Previous typed notes'
            });
        },
        // TIME PICKER
        timePicker1: function() {
            showTimePicker();
        },
        timePicker2: function() {
            // Like in book unavailable time at dateTimePicker component
            showTimePicker({
                title: 'Book an unavailable time',
                selectedTime: null,
                unsetLabel: 'Cancel'
            });
        },
        timePicker3: function() {
            // Like in book unavailable time at dateTimePicker component
            showTimePicker({
                title: 'Change selected time',
                selectedTime: '11:40',
                stepInMinutes: 10,
                unsetLabel: 'Cancel',
                selectLabel: 'Update'
            });
        }
    };
 });

exports.init = A.init;
