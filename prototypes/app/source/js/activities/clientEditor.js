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
        this.viewModel.client.sync(clientID)
        .catch(function (err) {
            this.app.modals.showError({
                title: 'Error loading client data',
                error: err
            });
        }.bind(this));
    }
    else {
        this.viewModel.client.newItem({
            editable: true
        });
    }
};

function ViewModel(app) {
    
    this.clientID = ko.observable(0);
    this.client = app.model.customers.createWildcardItem();

    this.header = ko.pureComputed(function() {
        return this.clientID() ? 'Edit Client' : 'New Client';
    }, this);
    
    this.isLoading = app.model.customers.state.isLoading;
    this.isSyncing = app.model.customers.state.isSyncing;
    this.isSaving = app.model.customers.state.isSaving;
    this.isLocked = ko.pureComputed(function() {
        var c = this.client();
        return (
            app.model.customers.state.isLocked() ||
            c && !c.editable()
        );
    }, this);

    // TODO
    this.save = function() {};
    this.cancel = function() {};
}
