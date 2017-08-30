/**
    _modals activity
**/
'use strict';

var Activity = require('../components/Activity');
var showConfirm = require('../modals/confirm').show;

var A = Activity.extend(function _modalsActivity() {

    Activity.apply(this, arguments);
    this.accessLevel = this.app.UserType.loggedUser;

    this.viewModel = {
        confirm1: function() {
            showConfirm({});
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
        }
    };
 });

exports.init = A.init;
