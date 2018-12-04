/**
 * ClientEditor
 *
 * @module activities/client-editor
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import { item as clientItem, publicSearch } from '../../data/clients';
import Activity from '../../components/Activity';
import Client from '../../models/Client';
import { RouteParser } from '../../utils/Router.js';
import ServicesSummaryPresenter from '../../viewmodels/presenters/ServicesSummaryPresenter';
import UserType from '../../enums/UserType';
import is from 'is_js';
import ko from 'knockout';
import pricingTypes from '../../data/pricingTypes';
import serviceProfessionalServices from '../../data/serviceProfessionalServices';
import shell from '../../app.shell';
import { show as showConfirm } from '../../modals/confirm';
import { show as showError } from '../../modals/error';
import template from './template.html';
import { list as userListings } from '../../data/userListings';

const ROUTE_NAME = 'client-editor';

export default class ClientEditor extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.helpLink = '/help/relatedArticles/201152639-managing-clients';
        this.navBar = Activity.createSubsectionNavBar('Clients', {
            backLink: 'clients',
            helpLink: this.helpLink
        });
        this.title = ko.pureComputed(() => this.header());

        // View members
        this.__defViewProperties();
        this.__defBirthMembers();
        this.__defViewMethods();
        // Special treatment of the save operation
        this.onSave = (clientID) => {
            if (this.requestData.returnNewAsSelected === true) {
                // Go to previous activity that required
                // to select a client
                this.requestData.clientID = clientID;
                app.shell.goBack(this.requestData);
            }
            else {
                // Regular save
                app.successSave();
            }
        };

        this.__connectPublicSearch();
        this.__connectHandlers();
    }

    __defViewProperties() {
        this.clientID = ko.observable(0);
        this.dataTimestamp = ko.observable(null);
        this.client = ko.observable(null);
        this.state = {
            isLoading: ko.observable(false),
            isSaving: ko.observable(false),
            isDeleting: ko.observable(false),
        };
        this.state.isLocked = ko.pureComputed(() => this.state.isLoading() && this.state.isSaving() && this.state.isDeleting());
        this.header = ko.observable('');
        this.isLoadingServices = ko.observable(false);
        this.isLoading = ko.pureComputed(() => this.state.isLoading() || this.isLoadingServices());
        this.isSyncing = this.state.isSyncing;
        this.isSaving = this.state.isSaving;
        this.isLocked = ko.pureComputed(() => this.state.isLocked() || this.isDeleting());
        this.isReadOnly = ko.pureComputed(() => {
            var c = this.client();
            return c && !c.editable();
        });
        this.isDeleting = this.state.isDeleting;
        this.wasRemoved = ko.observable(false);
        this.isNew = ko.pureComputed(() => {
            var c = this.client();
            return !c || !c.updatedDate();
        });
        this.serviceSummaries = ko.observable([]);
        this.submitText = ko.pureComputed(() => {
            var c = this.client();
            var hasChanges = c && this.dataTimestamp() !== c.model.dataTimestamp();
            return (
                this.isLoading() ?
                    'Loading...' :
                    this.isSaving() ?
                        'Saving changes' :
                        this.isNew() ?
                            'Add client' :
                            hasChanges ?
                                'Save changes to client' :
                                'Client saved'
            );
        });
        this.unsavedChanges = ko.pureComputed(() => {
            var c = this.client();
            return c && this.dataTimestamp() !== c.model.dataTimestamp();
        });
        this.deleteText = ko.pureComputed(() => {
            var itIs = this.isDeleting() ?
                'Deleting client...' :
                'Delete client';
            return itIs;
        });
        this.showServices = ko.pureComputed(() => !this.isNew() && this.client());
        // Extra for button addons
        this.validEmail = ko.pureComputed(() => {
            var c = this.client();
            if (c) {
                var e = c.email();
                return is.email(e) ? e : '';
            }
            return '';
        });
        this.validPhone = ko.pureComputed(() => {
            var c = this.client();
            if (c) {
                var e = c.phone();
                return seemsAPhoneNumber(e) ? e : '';
            }
            return '';
        });
    }

    __defViewMethods() {
        this.loadServices = function(clientID) {
            this.isLoadingServices(true);
            const tasks = [
                serviceProfessionalServices.getClientSpecificServices(clientID),
                userListings.onceLoaded(),
                pricingTypes.getList()
            ];

            Promise.all(tasks)
            .then(([ rawServices, listings, observableTypes ]) => {
                var services = serviceProfessionalServices.asModel(rawServices);
                var pricingTypes = observableTypes();
                var summaries = ServicesSummaryPresenter
                .summaries(listings, services, pricingTypes)
                .sort(ServicesSummaryPresenter.sortByJobTitle);
                this.serviceSummaries(summaries);
            })
            .catch((error) => {
                var messagePrefix = 'Unable to load special pricings';
                var messageName = this.client() ? ' for ' + this.client().firstName() : '';
                var message = messagePrefix + messageName + '.';
                showError({
                    title: message,
                    error: error
                });
            })
            .then(() => {
                this.isLoadingServices(false);
            });
        };

        this.save = () => {
            clientItem(this.client().clientUserID())
            .save(this.client().model.toPlainObject())
            .then((serverData) => {
                this.client().model.updateWith(serverData);
                this.dataTimestamp(this.client().model.dataTimestamp());
                // Special save, function provided by the activity on set-up
                this.onSave(serverData.clientUserID);
            })
            .catch((err) => {
                showError({
                    title: 'There was an error while saving.',
                    error: err
                });
            });
        };

        this.confirmRemoval = () => {
            showConfirm({
                title: 'Delete client',
                message: 'Are you sure? The operation cannot be undone.',
                yes: 'Delete',
                no: 'Keep'
            })
            .then(() => {
                this.remove();
            });
        };

        this.remove = () => {
            clientItem(this.clientID())
            .delete()
            .then(() => {
                this.wasRemoved(true);
                // Go out the deleted location
                shell.goBack();
            })
            .catch((err) => {
                showError({
                    title: 'There was an error while deleting.',
                    error: err
                });
            });
        };

        this.tapServiceSummary = (serviceSummary, event) => {
            var route = new RouteParser('#!service-professional-services/:jobTitleID/client/:clientID?mustReturn=#!client-editor/:clientID');
            var url = route.reverse({
                jobTitleID: serviceSummary.jobTitleID(),
                clientID: this.clientID()
            });

            shell.go(url);

            event.preventDefault();
            event.stopImmediatePropagation();
        };

        this.tapServiceSummaryNew = (serviceSummary, event) => {
            var route = new RouteParser('#!service-professional-services/:jobTitleID/client/:clientID/new');
            var url = route.reverse({
                jobTitleID: serviceSummary.jobTitleID(),
                clientID: this.clientID()
            });

            shell.go(url, null);

            event.preventDefault();
            event.stopImmediatePropagation();
        };
    }

    __defBirthMembers() {
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
            read: () => {
                var c = this.client();
                if (c) {
                    var birthMonth = c.birthMonth();
                    return birthMonth ? this.months()[birthMonth - 1] : null;
                }
                return null;
            },
            write: (month) => {
                var c = this.client();
                if (c) {
                    c.birthMonth(month && month.id || null);
                }
            }
        });
        this.monthDays = ko.observableArray([]);
        for (var iday = 1; iday <= 31; iday++) {
            this.monthDays.push(iday);
        }
    }

    __connectPublicSearch() {
        var foundPublicUser = (user) => {
            // Only if still matches current view data
            var c = this.client();
            if (!c) return;

            // Don't offer if is already that user!
            if (c.clientUserID() === user.clientUserID) return;

            // NOTE: avoiding use fullName because it can make more than one conflicting
            // results, being not enough the name to confirm the user (use the search for that)
            //  c.fullName() === user.fullName ||
            if (c.email() === user.email ||
                c.phone() === user.phone) {

                // Notify user
                var msg = 'We`ve found an existing record for {0}. Would you like to add him to your clients?'.replace(/\{0\}/g, user.firstName);
                showConfirm({
                    title: 'client found at loconomics.com',
                    message: msg
                })
                .then(() => {
                    // Acepted
                    // Replace current user data
                    // but keep notesAboutClient
                    var notes = c.notesAboutClient();
                    c.model.updateWith(user);
                    c.notesAboutClient(notes);
                    this.clientID(user.clientUserID);
                })
                .catch(() => {
                    // Discarded, do nothing
                });
            }
        };

        // When filering has no results:
        this.observeChanges(() => {
            var c = this.client();
            if (!c) return;

            // NOTE: discarded the fullName because several results can be retrieved,
            // better use the search for that and double check entries

            var email = c.email();
            var phone = c.phone();
            if (!email && !phone) return;

            publicSearch({
                email: email,
                phone: phone
            })
            .then((r) => {
                if (r && r[0]) foundPublicUser(r[0]);
            })
            .catch(function() {
                // Doesn't matters
            });
        })
        // Avoid excessive request by setting a timeout since the latest change
        .extend({ rateLimit: { timeout: 400, method: 'notifyWhenChangesStop' } });
    }

    __connectHandlers() {
        // If there is a change on the clientID, the URL must match
        // that (if is not already that).
        // NOTE: Except for call from another activity with returning, to avoid bug trying to do a goBack
        this.registerHandler({
            target: this.clientID,
            handler: function (clientID) {
                if (!clientID)
                    return;

                var nope = this.requestData.returnNewAsSelected === true;
                if (nope) return;

                var found = /client-editor\/(\-?\d+)/i.exec(window.location);
                var urlID = found && found[1] |0;

                // If is different URL and current ID
                if (!found ||
                    urlID !== clientID) {
                    // Replace URL
                    this.app.shell.replaceState(null, null, 'client-editor/' + clientID);
                }
            }.bind(this)
        });

        this.registerHandler({
            target: this.clientID,
            handler: function (clientID) {
                this.serviceSummaries([]);

                if (clientID) {
                    this.loadServices(clientID);
                }
            }.bind(this)
        });
    }

    updateNavBarState() {
        var referrerRoute = shell.referrerRoute;
        var referrer = this.clientID() === 0 ? referrerRoute && referrerRoute.url : null;
        var link = this.requestData.cancelLink || referrer || '/clients';

        this.convertToCancelAction(this.navBar.leftAction(), link);
    }

    show(state) {
        super.show(state);

        // reset
        this.clientID(0);

        // params
        var params = state.route.segments || [];
        var clientID = params[0] |0;

        if (clientID) {
            this.clientID(clientID);

            clientItem(clientID).onceLoaded()
            .then((client) => {
                if (client) {
                    this.client(new Client(client));
                    this.dataTimestamp(this.client().model.dataTimestamp());
                    this.header('Edit client');
                } else {
                    this.client(null);
                    this.dataTimestamp(null);
                    this.header('Deleted or unknown client');
                }
            })
            .catch((err) => {
                showError({
                    title: 'Error loading client data',
                    error: err
                });
            });
        }
        else {
            // Check request parameters that allow preset client information
            // (used when the client is created based on an existent marketplace user)
            var presetData = this.requestData.presetData || {};
            // If there is not set an explicit 'false' value on editable
            // field (as when there is not data given), set to true so can be edited
            // NOTE: This is because a given marketplace user will come with editable:false
            // and need to be preserved, while on regular 'new client' all data is set by
            // the service professional.
            if (presetData.editable !== false) {
                presetData.editable = true;
            }

            // New client
            this.client(new Client(presetData));
            this.dataTimestamp(this.client().model.dataTimestamp());
            this.header('Add a client');

            // Extra preset data
            if (this.requestData.newForSearchText) {
                clientDataFromSearchText(this.requestData.newForSearchText || '', this.client());
            }
        }

        this.updateNavBarState();
    }
}

activities.register(ROUTE_NAME, ClientEditor);

/// Some internal utils
/**
    Small utility that just returns true if the given
    string seems a possible phone number, false otherwise.
    NOTE: Is NOT an exaustive phone validation check, just
    checks is there are several numbers so there is a chance
    to be a phone. There are stricker checks (annotated) but
    can fail on some situations (switchboard numbers) or in
    different locales.
**/
function seemsAPhoneNumber(str) {
    // Possible stricker comparision
    // return is.nanpPhone(str) || is.eppPhone(str);

    // Just if there are more than three consecutive numbers,
    // then 'may' be a phone number (may be anything else, but
    // since some special phone numbers can have letters or signs,
    // this is just a very lax and conservative (to avoid false negatives) check.
    return (/\d{3,}/).test(str || '');
}

/**
    Use the provided search text as the initial value
    for: name, email or phone (what fits better)
**/
function clientDataFromSearchText(txt, client) {
    if (is.email(txt)) {
        client.email(txt);
    }
    else if (seemsAPhoneNumber(txt)) {
        client.phone(txt);
    }
    else {
        // Otherwise, think is the fullname, spliting by white space
        var nameParts = txt.split(' ', 2);
        client.firstName(nameParts[0]);
        if (nameParts.length > 1) {
            client.lastName(nameParts[1]);
            // TODO For spanish (or any locale with secondLastName)
            // must try to detect the second last name?
        }
    }
}
