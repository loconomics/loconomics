/**
    clients activity
**/
'use strict';

var ko = require('knockout'),
    Activity = require('../components/Activity'),
    textSearch = require('../utils/textSearch');

var A = Activity.extends(function ClientsActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.Freelancer;
    this.viewModel = new ViewModel(this.app);    
    this.navBar = Activity.createSubsectionNavBar('Clients');
    
    // Getting elements
    this.$index = this.$activity.find('#clientsIndex');
    this.$listView = this.$activity.find('#clientsListView');
    
    // Handler to update header based on a mode change:
    this.registerHandler({
        target: this.viewModel.isSelectionMode,
        handler: function (itIs) {
            this.viewModel.headerText(itIs ? 'Select a client' : '');
        }.bind(this)
    });

    // Handler to go back with the selected client when 
    // there is one selected and requestData is for
    // 'select mode'
    this.registerHandler({
        target: this.viewModel.selectedClient,
        handler: function (theSelectedClient) {
            // We have a request and
            // it requested to select a client,
            // and a selected client
            if (this.requestData &&
                this.requestData.selectClient === true &&
                theSelectedClient) {

                // Pass the selected client in the info
                this.requestData.selectedClient = theSelectedClient;
                // And go back
                this.app.shell.goBack(this.requestData);
                // Last, clear requestData
                this.requestData = null;
            }
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    // On every show, search gets reseted
    this.viewModel.searchText('');
    
    // Set selection:
    this.viewModel.isSelectionMode(state.selectClient === true);
    
    // Keep data updated:
    this.app.model.customers.sync()
    .catch(function(err) {
        this.app.modals.showError({
            title: 'Error loading the clients list',
            error: err
        });
    }.bind(this));
};

function ViewModel(app) {

    this.headerText = ko.observable('');

    // Especial mode when instead of pick and edit we are just selecting
    // (when editing an appointment)
    this.isSelectionMode = ko.observable(false);

    // Full list of clients
    this.clients = app.model.customers.list;
    
    // Search text, used to filter 'clients'
    this.searchText = ko.observable('');
    
    // Utility to get a filtered list of clients based on clients
    this.getFilteredList = function getFilteredList() {
        var s = (this.searchText() || '').toLowerCase();
        // Search the client by:
        // - full name
        // - (else) email
        // - (else) phone
        return this.clients().filter(function(client) {
            if (!client) return false;
            var found = textSearch(s, client.fullName());
            if (found) return true;
            found = textSearch(s, client.email());
            if (found) return true;
            found = textSearch(s, client.phone());
            return found;
        });
    };

    // Filtered list of clients
    this.filteredClients = ko.computed(function() {
        return this.getFilteredList();
    }, this);
    
    // Grouped list of filtered clients
    this.groupedClients = ko.computed(function(){

        var clients = this.filteredClients().sort(function(clientA, clientB) {
            return clientA.firstName() > clientB.firstName();
        });
        
        var groups = [],
            latestGroup = null,
            latestLetter = null;

        clients.forEach(function(client) {
            var letter = (client.firstName()[0] || '').toUpperCase();
            if (letter !== latestLetter) {
                latestGroup = {
                    letter: letter,
                    clients: [client]
                };
                groups.push(latestGroup);
                latestLetter = letter;
            }
            else {
                latestGroup.clients.push(client);
            }
        });

        return groups;

    }, this);
    
    this.selectedClient = ko.observable(null);
    
    this.selectClient = function(selectedClient) {
        
        this.selectedClient(selectedClient);
    }.bind(this);
}
