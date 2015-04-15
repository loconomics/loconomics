/**
    ClientEdition activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function ClientEditionActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    
    this.accessLevel = this.app.UserType.LoggedUser;
    
    this.navBar = Activity.createSubsectionNavBar('clients');
});

exports.init = A.init;

var ko = require('knockout');

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    // reset
    this.viewModel.clientID(0);

    // params
    var params = state && state.route && state.route.segments || [];
    
    var clientID = params[0] |0;
    
    if (clientID) {
        this.viewModel.clientID(clientID);
        
        /*this.viewModel.client.sync(clientID)
        .catch(function (err) {
            this.app.modals.showError({
                title: 'Error loading client data',
                error: err
            });
        }.bind(this));*/

        this.app.model.customers.createItemVersion(clientID)
        .then(function (clientVersion) {
            if (clientVersion) {
                this.viewModel.clientVersion(clientVersion);
                this.viewModel.header('Edit Client');
            } else {
                this.viewModel.clientVersion(null);
                this.viewModel.header('Unknow client or was deleted');
            }
        }.bind(this))
        .catch(function (err) {
            this.app.modals.showError({
                title: 'Error loading client data',
                error: err
            });
        }.bind(this));
    }
    else {
        /*this.viewModel.client.newItem({
            editable: true
        });*/
        // New client
        this.viewModel.clientVersion(this.app.model.customers.newItem({
            editable: true
        }));
        this.viewModel.header('Add a Client');
    }
};

function ViewModel(app) {
    /*jshint maxstatements:80 */
    
    this.clientID = ko.observable(0);
    
    this.clientVersion = ko.observable(null);
    this.client = ko.pureComputed(function() {
        var v = this.clientVersion();
        if (v) {
            return v.version;
        }
        return null;
    }, this);
    //this.client = app.model.customers.createWildcardItem();

    this.header = ko.observable('');
    
    this.isLoading = app.model.customers.state.isLoading;
    this.isSyncing = app.model.customers.state.isSyncing;
    this.isSaving = app.model.customers.state.isSaving;
    this.isLocked = ko.pureComputed(function() {
        return (
            app.model.customers.state.isLocked() ||
            this.isDeleting()
        );
    }, this);
    this.isReadOnly = ko.pureComputed(function() {
        var c = this.client();
        return c && !c.editable();
    }, this);

    this.isDeleting = app.model.customers.state.isDeleting;

    this.wasRemoved = ko.observable(false);

    this.isNew = ko.pureComputed(function() {
        return !this.client().updatedDate();
    }, this);

    this.submitText = ko.pureComputed(function() {
        var v = this.clientVersion();
        return (
            this.isLoading() ? 
                'Loading...' : 
                this.isSaving() ? 
                    'Saving changes' : 
                    v && v.areDifferent() ?
                        'Save changes' :
                        'Saved'
        );
    }, this);

    this.unsavedChanges = ko.pureComputed(function() {
        var v = this.clientVersion();
        return v && v.areDifferent();
    }, this);
    
    this.deleteText = ko.pureComputed(function() {
        return (
            this.isDeleting() ? 
                'Deleting...' : 
                'Delete'
        );
    }, this);

    this.save = function() {

        app.model.customers.setItem(this.client().model.toPlainObject())
        .then(function(serverData) {
            // Update version with server data.
            this.client().model.updateWith(serverData);
            // Push version so it appears as saved
            this.clientVersion().push({ evenIfObsolete: true });
        }.bind(this))
        .catch(function(err) {
            app.modals.showError({
                title: 'There was an error while saving.',
                error: err
            });
        });

    }.bind(this);
    
    this.confirmRemoval = function() {
        app.modals.confirm({
            title: 'Delete client',
            message: 'Are you sure? The operation cannot be undone.',
            yes: 'Delete',
            no: 'Keep'
        })
        .then(function() {
            this.remove();
        }.bind(this));
    }.bind(this);

    this.remove = function() {

        app.model.customers.delItem(this.clientID())
        .then(function() {
            this.wasRemoved(true);
            // Go out the deleted location
            app.shell.goBack();
        }.bind(this))
        .catch(function(err) {
            app.modals.showError({
                title: 'There was an error while deleting.',
                error: err
            });
        });
    }.bind(this);
    
    // Birth month day
    // TODO l10n
    this.months = ko.observableArray([
        { id: 1, name: 'January'},
        { id: 2, name: 'February'},
        { id: 3, name: 'March'},
        { id: 4, name: 'April'},
        { id: 5, name: 'May'},
        { id: 6, name: 'June'},
        { id: 7, name: 'July'},
        { id: 8, name: 'August'},
        { id: 9, name: 'September'},
        { id: 10, name: 'October'},
        { id: 11, name: 'November'},
        { id: 12, name: 'December'}
    ]);
    // We need to use a special observable in the form, that will
    // update the back-end profile.birthMonth
    this.selectedBirthMonth = ko.computed({
        read: function() {
            var c = this.client();
            if (c) {
                var birthMonth = c.birthMonth();
                return birthMonth ? this.months()[birthMonth - 1] : null;
            }
            return null;
        },
        write: function(month) {
            var c = this.client();
            if (c)
                c.birthMonth(month && month.id || null);
        },
        owner: this
    });
    
    this.monthDays = ko.observableArray([]);
    for (var iday = 1; iday <= 31; iday++) {
        this.monthDays.push(iday);
    }
    
    // Extra for button addons
    var is = require('is_js');
    this.validEmail = ko.pureComputed(function() {
        var c = this.client();
        if (c) {
            var e = c.email();
            return is.email(e) ? e : '';
        }
        return '';
    }, this);
    this.validPhone = ko.pureComputed(function() {
        var c = this.client();
        if (c) {
            var e = c.phone();
            return is.nanpPhone(e) || is.eppPhone(e) ? e : '';
        }
        return '';
    }, this);
}
