/**
    clients activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout');

exports.init = function initClients($activity) {
    new ClientsActivity($activity);
};

function ClientsActivity($activity) {

    this.$activity = $activity;
    this.$index = $activity.find('#clientsIndex');
    this.$listView = $activity.find('#clientsListView');

    var dataView = this.dataView = new ViewModel();
    ko.applyBindings(dataView, $activity.get(0));

    // TestingData
    dataView.clients(require('../testdata/clients').clients);

    // TODO: in observable? passed as parameter? Localizable?
    if (dataView.isSelectionMode()) {
        dataView.headerText('Select a client');
    }
}

function ViewModel() {

    this.headerText = ko.observable('Clients');

    // Especial mode when instead of pick and edit we are just selecting
    // (when editing an appointment)
    this.isSelectionMode = ko.observable(true);

    // Full list of clients
    this.clients = ko.observableArray([]);
    
    // Search text, used to filter 'clients'
    this.searchText = ko.observable('');
    
    // Utility to get a filtered list of clients based on clients
    this.getFilteredList = function getFilteredList() {
        var s = (this.searchText() || '').toLowerCase();

        return this.clients().filter(function(client) {
            var n = client && client.fullName() && client.fullName() || '';
            n = n.toLowerCase();
            return n.indexOf(s) > -1;
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
    
    this.selectClient = function(selectedClient) {
        
        // TODO: communicate with other activities to return the 
        // selected client
        history.go(-1);

    }.bind(this);
}
