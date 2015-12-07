/**
    datetimePicker activity
**/
'use strict';

var ko = require('knockout'),
    getDateWithoutTime = require('../utils/getDateWithoutTime');

var Activity = require('../components/Activity');

var A = Activity.extend(function DatetimePickerActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new ViewModel();    
    // Defaults settings for navBar.
    this.navBar = Activity.createSubsectionNavBar('');
    // Save defaults to restore on updateNavBarState when needed:
    this.defaultLeftAction = this.navBar.leftAction().model.toPlainObject();

    // Return the selected date-time
    ko.computed(function() {
    
        var datetime = this.viewModel.component() && this.viewModel.component().selectedDatetime();
        
        if (datetime) {
            // Pass the selected datetime in the info
            this.requestData.selectedDatetime = datetime;
            this.requestData.allowBookUnavailableTime = this.viewModel.component().allowBookUnavailableTime();
            // And go back
            this.app.shell.goBack(this.requestData);
        }
    }, this);
    
    this.returnRequest = function returnRequest() {
        this.app.shell.goBack(this.requestData);
    }.bind(this);
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {
    
    var header = this.requestData.headerText;
    this.viewModel.headerText(header || 'Select date and time');

    if (this.requestData.title) {
        // Replace title
        this.navBar.title(this.requestData.title);
    }
    else {
        // Title must be empty
        this.navBar.title('');
        this.navBar.leftAction().text(this.requestData.navTitle || '');
    }
    
    if (this.requestData.cancelLink) {
        this.convertToCancelAction(this.navBar.leftAction(), this.requestData.cancelLink);
    }
    else {
        // Reset to defaults, or given title:
        this.navBar.leftAction().model.updateWith(this.defaultLeftAction);
        if (this.requestData.navTitle)
            this.navBar.leftAction().text(this.requestData.navTitle);
        // Uses a custom handler so it returns keeping the given state:
        this.navBar.leftAction().handler(this.returnRequest);
    }
};

A.prototype.show = function show(state) {
    // Reset
    if (this.viewModel.component())
        this.viewModel.component().reset();
    
    Activity.prototype.show.call(this, state);
    
    // Parameters: pass a required duration
    this.viewModel.component().requiredDurationMinutes(this.requestData.requiredDuration |0);

    // Preselect userID and a date, or current date
    this.viewModel.component().userID(this.app.model.user().userID());
    var selDate = getDateWithoutTime(this.requestData.selectedDatetime);
    this.viewModel.component().selectedDate(selDate);
    
    this.updateNavBarState();
};

function ViewModel() {
    this.headerText = ko.observable('Select a time');
    this.component = ko.observable(null);
}
