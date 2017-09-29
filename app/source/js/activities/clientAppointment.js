/**
    Client Appointment activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var EditClientBookingCardVM = require('../viewmodels/EditClientBookingCardVM');
var clientAppointments = require('../data/clientAppointments');
var showError = require('../modals/error').show;

var A = Activity.extend(function ClientAppointmentActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.loggedUser;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('', {
        backLink: '/myAppointments' , helpLink: this.viewModel.helpLink
    });
    this.title('Your appoiontments');
});

exports.init = A.init;

A.prototype.show = function show(options) {

    Activity.prototype.show.call(this, options);

    var params = options && options.route && options.route.segments;
    var id = params[0] |0;
    this.viewModel.load(id);

    //Get the return nav text
    var returnText = options && options.route && options.route.query.returnText || 'Back';
    this.viewModel.returnText(decodeURIComponent(returnText));
};

function ViewModel(app) {
    this.helpLink = '/help/relatedArticles/201983163-making-changes-canceling-appointments';
    this.list = clientAppointments.list;
    this.currentIndex = ko.observable(-1);
    this.currentItem = new EditClientBookingCardVM(app);
    this.isLoading = ko.observable(false);
    this.returnText = ko.observable('Back');

    this.isEditButtonVisible = ko.pureComputed(function() {
        return (this.canCancel() || this.canEdit()) && !this.isEditMode() && !this.isCancelMode();
    }, this.currentItem);
    this.isCancelEditButtonVisible = ko.pureComputed(function() {
        return (this.canCancel() || this.canEdit()) && (this.isEditMode() || this.isCancelMode());
    }, this.currentItem);

    this.isEmpty = ko.pureComputed(function() {
        return this.currentIndex() === -2;
    }, this);

    var updateListIndex = function() {
        if (this.list().length) {
            if (this.currentIndex() === -1) {
                // Single booking was selected, find in the list
                var bID = this.currentItem.booking().bookingID();
                this.list().some(function(b, i) {
                    if (b.bookingID() === bID) {
                        this.currentIndex(i);
                        return true;
                    }
                }.bind(this));
            }
        }
    }.bind(this);

    this.load = function(id) {
        if (id) {
            this.currentIndex(-1);
            this.currentItem.load(id)
            .then(function() {
                // Load the list in background
                clientAppointments.sync()
                .then(updateListIndex);
            })
            .catch(function(err) {
                showError({
                    title: 'Error loading the appointment',
                    error: err
                });
            });
        }
        else {
            this.isLoading(true);
            this.currentItem.reset();
            clientAppointments.sync()
            .then(function() {
                var first = this.list().length ? this.list()[0] : null;
                if (first) {
                    this.currentIndex(0);
                    this.currentItem.load(first);
                    updateListIndex();
                    // Update URL
                    app.shell.replaceState(null, null, '/clientAppointment/' + first.bookingID());
                }
                else {
                    this.currentIndex(-2);
                    // Update URL
                    app.shell.replaceState(null, null, '/clientAppointment');
                }
                this.isLoading(false);
            }.bind(this))
            .catch(function(err) {
                this.isLoading(false);
                showError({
                    title: 'Error loading appointments',
                    error: err
                });
            }.bind(this));
        }
    }.bind(this);

    // Control list movements
    var goToIndex = function(i) {
        var min = 0, max = this.list().length - 1;
        if (this.currentIndex() >= min) {
            var ni = Math.max(min, Math.min(max, i));
            this.currentIndex(ni);
            var b = this.list()[ni];
            this.currentItem.load(b);
            // Update URL
            app.shell.replaceState(null, null, '/clientAppointment/' + b.bookingID());
        }
    }.bind(this);
    this.goNext = function() {
        goToIndex(this.currentIndex() + 1);
    }.bind(this);
    this.goPrevious = function() {
        goToIndex(this.currentIndex() - 1);
    }.bind(this);
}
