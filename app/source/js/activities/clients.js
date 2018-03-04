/**
    clients activity
**/
'use strict';

import { list as clientsList, publicSearch as clientsPublicSearch } from '../data/clients';
import $ from 'jquery';
import Activity from '../components/Activity';
import Client from '../models/Client';
import ko from 'knockout';
import { show as showError } from'../modals/error';
import textSearch from '../utils/textSearch';

var A = Activity.extend(function ClientsActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);
    // Defaults settings for navBar.
    this.navBar = Activity.createSubsectionNavBar('Clients', {
        backLink: 'cms' , helpLink: this.viewModel.helpLink
    });
    this.title('Your clients');
    // Save defaults to restore on updateNavBarState when needed:
    this.defaultLeftAction = this.navBar.leftAction().model.toPlainObject();

    // Getting elements
    this.$index = this.$activity.find('#clientsIndex');
    this.$listView = this.$activity.find('#clientsListView');

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
                this.requestData.selectedClientID = theSelectedClient.clientUserID();
                // And go back
                this.app.shell.goBack(this.requestData);
                // Last, clear requestData
                this.requestData = null;
            }
        }.bind(this)
    });

    this.returnRequest = function returnRequest() {
        this.app.shell.goBack(this.requestData);
    }.bind(this);
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {
    /* eslint complexity:"off" */

    var itIs = this.viewModel.isSelectionMode();

    this.viewModel.headerText(itIs ? 'Select a client' : 'My clients');

    if (this.requestData.title) {
        // Replace title by title if required
        this.navBar.title(this.requestData.title);
    }
    else {
        // Title must be empty
        this.navBar.title('');
    }

    if (this.requestData.cancelLink) {
        this.convertToCancelAction(this.navBar.leftAction(), this.requestData.cancelLink);
    }
    else {
        // Reset to defaults, or given title:
        this.navBar.leftAction().model.updateWith(this.defaultLeftAction);
        if (this.requestData.navTitle)
            this.navBar.leftAction().text(this.requestData.navTitle);
    }

    if (itIs && !this.requestData.cancelLink) {
        // Uses a custom handler so it returns keeping the given state:
        this.navBar.leftAction().handler(this.returnRequest);
    }
    else if (!itIs) {
        this.navBar.leftAction().handler(null);
    }
};

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    // On every show, search gets reseted
    this.viewModel.searchText('');
    this.viewModel.selectedClient(null);
    this.viewModel.requestData = this.requestData;

    // Check if it comes from a clientEditor that
    // received the flag 'returnNewAsSelected' and a
    // clientID: we were in selection mode->creating client->must
    // return the just created client to the previous page
    if (state.returnNewAsSelected === true &&
        state.clientID) {

        // perform an activity change but allow the current
        // to stop first
        setTimeout(function() {
            delete state.returnNewAsSelected;
            this.requestData.selectedClientID = state.clientID;
            // And go back
            this.app.shell.goBack(this.requestData);
        }.bind(this), 1);

        // avoid the rest operations
        return;
    }

    // Set selection:
    this.viewModel.isSelectionMode(state.selectClient === true);

    this.updateNavBarState();

    // Keep data updated:
    this.viewModel.isLoading(true);
    this.subscribeTo(clientsList.onData, (data) => {
        this.viewModel.clients(data.map((raw) => new Client(raw)));
        this.viewModel.isLoading(false);
    });
    this.subscribeTo(clientsList.onDataError, (error) => {
        this.viewModel.isLoading(false);
        showError({
            title: 'Error loading the clients list',
            error
        });
    });
};

function ViewModel(app) {
    this.helpLink = '/help/relatedArticles/201966046-adding-new-clients';

    this.headerText = ko.observable('');

    // Especial mode when instead of pick and edit we are just selecting
    // (when editing an appointment)
    this.isSelectionMode = ko.observable(false);

    // Full list of clients
    this.clients = ko.observableArray([]);
    this.isLoading = ko.observable(false);
    this.isSyncing = ko.observable(false);

    // Search text, used to filter 'clients'
    this.searchText = ko.observable('');

    // Utility to get a filtered list of clients based on search and deleted property
    this.getFilteredList = function getFilteredList() {
        var s = (this.searchText() || '').toLowerCase();
        // Search the client by:
        // - full name
        // - (else) email
        // - (else) phone
        return this.clients().filter(function(client) {
            if (!client) return false;
            if (client.deleted()) return false;
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

        // Sorting list, in a cross browser way (in Firefox, just A > B works, but not on webkit/blink)
        var clients = this.filteredClients().sort(function(clientA, clientB) {
            var a = clientA.firstName().toLowerCase();
            var b = clientB.firstName().toLowerCase();
            if (a === b)
                return 0;
            else if (a > b)
                return 1;
            else
                return -1;
        });

        var groups = [];
        var latestGroup = null;
        var latestLetter = null;

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


    /// Public search
    this.publicSearchResults = ko.observableArray([]);
    this.publicSearchRunning = ko.observable(null);
    // When filering has no results:
    ko.computed(function() {
        var filtered = this.filteredClients();
        var searchText = this.searchText();
        var request = null;

        // If there is search text and no results from local filtering
        if (filtered.length === 0 && searchText) {

            // Remove previous results
            this.publicSearchResults([]);

            request = clientsPublicSearch({
                fullName: searchText,
                email: searchText,
                phone: searchText
            });
            this.publicSearchRunning(request);
            request.then(function(r) {
                this.publicSearchResults(r);
            }.bind(this))
            .catch(function(err) {
                showError({
                    title: 'There was an error when on remote clients search',
                    error: err
                });
            })
            .then(function() {
                // Always:
                // if still the same, it ended then remove
                if (this.publicSearchRunning() === request)
                    this.publicSearchRunning(null);
            }.bind(this));
        }
        else {
            this.publicSearchResults([]);
            // Cancelling any pending request, to avoid
            // anwanted results when finish
            request = this.publicSearchRunning();
            if (request &&
                request.xhr &&
                request.xhr.abort) {
                request.xhr.abort();
                this.publicSearchRunning(null);
            }
        }
    }, this)
    // Avoid excessive request by setting a timeout since the latest change
    .extend({ rateLimit: { timeout: 400, method: 'notifyWhenChangesStop' } });

    /**
        Add a client from the public/remote search results
    **/
    this.addRemoteClient = function(client, event) {
        var data = client.model && client.model.toPlainObject() || client;
        var request = $.extend({}, this.requestData, {
            presetData: data,
            returnNewAsSelected: this.isSelectionMode()
        });
        app.shell.go('clientEditor', request);

        event.preventDefault();
        event.stopImmediatePropagation();
    }.bind(this);

    /**
        Call the activity to add a new client, passing the current
        search text so can be used as initial name/email/phone
    **/
    this.addNew = function(data, event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        var request = $.extend({}, this.requestData, {
            newForSearchText: this.searchText(),
            returnNewAsSelected: this.isSelectionMode()
        });
        app.shell.go('clientEditor', request);
    }.bind(this);

    /// Selections

    this.selectedClient = ko.observable(null);

    this.selectClient = function(selectedClient, event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        this.selectedClient(selectedClient);
    }.bind(this);
}
