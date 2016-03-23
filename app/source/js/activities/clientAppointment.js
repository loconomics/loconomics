/**
    Client Appointment activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var EditClientBookingCardVM = require('../viewmodels/EditClientBookingCardVM');

var A = Activity.extend(function ClientAppointmentActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new ViewModel(this.app);
    this.navBar = new Activity.NavBar({
        title: 'Upcoming',
        leftAction: Activity.NavAction.goBack.model.clone(),
        rightAction: {}
    });
    var nav = this.navBar;
    ko.computed(function() {
        var itCan = this.canCancel() || this.canEdit();
        var isEdit = this.isEditMode() || this.isCancelMode();
        var settings = isEdit ? {
            text: 'Cancel',
            handler: this.cancel.bind(this.viewModel)
        } : itCan ? {
            text: 'Edit',
            handler: this.edit.bind(this.viewModel)
        } : {
            text: '',
            handler: function() {}
        };
        nav.rightAction().model.updateWith(settings);
    }, this.viewModel.currentItem);
});

exports.init = A.init;

A.prototype.show = function show(options) {

    Activity.prototype.show.call(this, options);
    
    var params = options && options.route && options.route.segments;
    var id = params[0] |0;
    if (id) {
        this.viewModel.currentItem.load(id);
    }
    else {
        this.viewModel.currentItem.reset();
    }
};

function ViewModel(app) {
    /*this.list = ko.observableArray([]);
    this.currentIndex = ko.observable(0);
    
    this.currentItem = ko.pureComputed(function() {
        return this.list()[this.currentIndex()];
    }, this);*/

    this.currentItem = new EditClientBookingCardVM(app);
    
    // TODO
    this.goNext = function() {};
    this.goPrevious = function() {};
}
