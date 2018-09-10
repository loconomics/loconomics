/**
 * Clients
 *
 * @module activities/clients
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import * as textSearch from '../../utils/textSearch';
import { list as clientsList, publicSearch as clientsPublicSearch } from '../../data/clients';
import $ from 'jquery';
import Activity from '../../components/Activity';
import Client from '../../models/Client';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import shell from '../../app.shell';
import { show as showError } from '../../modals/error';
import style from './style.styl';
import template from './template.html';

const ROUTE_NAME = 'clients';

export default class Clients extends Activity {

    static get template() { return template; }

    static get style() { return style; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.helpLink = '/help/relatedArticles/201966046-adding-new-clients';
        // Defaults settings for navBar.
        this.navBar = Activity.createSubsectionNavBar('Clients', {
            backLink: 'cms',
            helpLink: this.helpLink
        });
        this.title('Your clients');
        // Save defaults to restore on updateNavBarState when needed:
        this.defaultLeftAction = this.navBar.leftAction().model.toPlainObject();

        this.__defViewProperties();
        this.__defViewMethods();
        this.__connectPublicSearch();

        this.returnRequest = () => {
            shell.goBack(this.requestData);
        };
        this.__connectAutoReturn();
    }

    /**
     * Utility to get a filtered list of clients based on search and
     * deleted property
     * @returns {Promise<Array<models/Client>>}
     */
    getFilteredList() {
        var s = (this.searchText() || '').toLowerCase();
        // Prepare search term
        const doSearch = textSearch.searchFor(s);
        // Search the client by:
        // - full name
        // - (else) email
        // - (else) phone
        return this.clients().filter(function(client) {
            if (!client) return false;
            if (client.deleted()) return false;
            var found = doSearch.allAtWords(client.fullName());
            if (found) return true;
            found = doSearch.allAt([client.email()]);
            if (found) return true;
            found = doSearch.allAt([client.phone()]);
            return found;
        });
    }

    __defViewProperties() {
        this.headerText = ko.observable('');
        // Especial mode when instead of pick and edit we are just selecting
        // (when editing an appointment)
        this.isSelectionMode = ko.observable(false);
        this.selectedClient = ko.observable(null);

        // Full list of clients
        this.clients = ko.observableArray([]);
        this.isLoading = ko.observable(false);
        this.isSyncing = ko.observable(false);

        // Search text, used to filter 'clients'
        this.searchText = ko.observable('');

        // Filtered list of clients
        this.filteredClients = ko.computed(() => this.getFilteredList());

        // Grouped list of filtered clients
        this.groupedClients = ko.computed(() => {
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
        });
    }

    __defViewMethods() {
        /**
            Add a client from the public/remote search results
        **/
        this.addRemoteClient = (client, event) => {
            var data = client.model && client.model.toPlainObject() || client;
            var request = $.extend({}, this.requestData, {
                presetData: data,
                returnNewAsSelected: this.isSelectionMode()
            });
            shell.go('clientEditor', request);

            event.preventDefault();
            event.stopImmediatePropagation();
        };

        /**
            Call the activity to add a new client, passing the current
            search text so can be used as initial name/email/phone
        **/
        this.addNew = (data, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();

            var request = $.extend({}, this.requestData, {
                newForSearchText: this.searchText(),
                returnNewAsSelected: this.isSelectionMode()
            });
            shell.go('clientEditor', request);
        };

        this.selectClient = (selectedClient, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();

            this.selectedClient(selectedClient);
        };
    }

    __connectPublicSearch() {
        /// Public search
        this.publicSearchResults = ko.observableArray([]);
        this.publicSearchRunning = ko.observable(null);
        // When filering has no results:
        ko.computed(() => {
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
        })
        // Avoid excessive request by setting a timeout since the latest change
        .extend({ rateLimit: { timeout: 400, method: 'notifyWhenChangesStop' } });
    }

    __connectAutoReturn() {
        // Handler to go back with the selected client when
        // there is one selected and requestData is for
        // 'select mode'
        this.registerHandler({
            target: this.selectedClient,
            handler: (theSelectedClient) => {
                // We have a request and
                // it requested to select a client,
                // and a selected client
                if (this.requestData &&
                    this.requestData.selectClient === true &&
                    theSelectedClient) {

                    // Pass the selected client in the info
                    this.requestData.selectedClientID = theSelectedClient.clientUserID();
                    // And go back
                    shell.goBack(this.requestData);
                    // Last, clear requestData
                    this.requestData = null;
                }
            }
        });
    }

    updateNavBarState() {
        /* eslint complexity:"off" */
        var itIs = this.isSelectionMode();

        this.headerText(itIs ? 'Select a client' : '');

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
    }

    show(state) {
        super.show(state);

        // On every show, search gets reseted
        this.searchText('');
        this.selectedClient(null);

        // Check if it comes from a clientEditor that
        // received the flag 'returnNewAsSelected' and a
        // clientID: we were in selection mode->creating client->must
        // return the just created client to the previous page
        if (state.returnNewAsSelected === true &&
            state.clientID) {

            // perform an activity change but allow the current
            // to stop first
            setTimeout(() => {
                delete state.returnNewAsSelected;
                this.requestData.selectedClientID = state.clientID;
                // And go back
                shell.goBack(this.requestData);
            }, 1);

            // avoid the rest operations
            return;
        }

        // Set selection:
        this.isSelectionMode(state.selectClient === true);

        this.updateNavBarState();

        // Keep data updated:
        this.isLoading(true);
        this.subscribeTo(clientsList.onData, (data) => {
            this.clients(data.map((raw) => new Client(raw)));
            this.isLoading(false);
        });
        this.subscribeTo(clientsList.onDataError, (error) => {
            this.isLoading(false);
            showError({
                title: 'Error loading the clients list',
                error
            });
        });
    }
}

activities.register(ROUTE_NAME, Clients);
