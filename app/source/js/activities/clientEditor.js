/**
    ClientEditor activity

    IMPORTANT: A client/editor component is on the works, used already but without
    all the needed options. It lacks: services/offerings, validations and public search
    TODO: Complete the component and use it here.
**/
'use strict';

var Activity = require('../components/Activity');
var is = require('is_js');
var ServicesSummaryPresenter = require('../viewmodels/presenters/ServicesSummaryPresenter');
var RouteParser = require('../utils/Router.js').RouteParser;
var clients = require('../data/clients');
var serviceProfessionalServices = require('../data/serviceProfessionalServices');
var userJobProfile = require('../data/userJobProfile');
var pricingTypes = require('../data/pricingTypes');
var ko = require('knockout');
var showConfirm = require('../modals/confirm').show;
var showError = require('../modals/error').show;
var Client = require('../models/Client');

var A = Activity.extend(function ClientEditionActivity() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);

    this.accessLevel = this.app.UserType.loggedUser;
    this.navBar = Activity.createSubsectionNavBar('Clients', {
        backLink: 'clients' , helpLink: this.viewModel.helpLink
    });
    this.title = ko.pureComputed(function() {
        return this.header();
    }, this.viewModel);

    // If there is a change on the clientID, the URL must match
    // that (if is not already that).
    // NOTE: Except for call from another activity with returning, to avoid bug trying to do a goBack
    this.registerHandler({
        target: this.viewModel.clientID,
        handler: function (clientID) {
            if (!clientID)
                return;

            var nope = this.requestData.returnNewAsSelected === true;
            if (nope) return;

            var found = /clientEditor\/(\-?\d+)/i.exec(window.location);
            var urlID = found && found[1] |0;

            // If is different URL and current ID
            if (!found ||
                urlID !== clientID) {
                // Replace URL
                this.app.shell.replaceState(null, null, 'clientEditor/' + clientID);
            }
        }.bind(this)
    });

    this.registerHandler({
        target: this.viewModel.clientID,
        handler: function (clientID) {
            this.viewModel.serviceSummaries([]);

            if (clientID) {
                this.viewModel.loadServices(clientID);
            }
        }.bind(this)
    });

    // Special treatment of the save operation
    this.viewModel.onSave = function(clientID) {
        if (this.requestData.returnNewAsSelected === true) {
            // Go to previous activity that required
            // to select a client
            this.requestData.clientID = clientID;
            this.app.shell.goBack(this.requestData);
        }
        else {
            // Regular save
            this.app.successSave();
        }
    }.bind(this);
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {
    var referrerRoute = this.app.shell.referrerRoute;
    var referrer = this.viewModel.clientID() === 0 ? referrerRoute && referrerRoute.url : null;
    var link = this.requestData.cancelLink || referrer || '/clients';

    this.convertToCancelAction(this.navBar.leftAction(), link);
};

A.prototype.show = function show(state) {
    /* eslint complexity:"off" */
    Activity.prototype.show.call(this, state);

    // reset
    this.viewModel.clientID(0);

    // params
    var params = state && state.route && state.route.segments || [];

    var clientID = params[0] |0;

    if (clientID) {
        this.viewModel.clientID(clientID);

        clients.item(clientID).onceLoaded()
        .then(function (client) {
            if (client) {
                this.viewModel.client(new Client(client));
                this.viewModel.dataTimestamp(this.viewModel.client().model.dataTimestamp());
                this.viewModel.header('Edit client');
            } else {
                this.viewModel.client(null);
                this.viewModel.dataTimestamp(null);
                this.viewModel.header('Deleted or unknown client');
            }
        }.bind(this))
        .catch(function (err) {
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
        this.viewModel.client(new Client(presetData));
        this.viewModel.dataTimestamp(this.viewModel.client().model.dataTimestamp());
        this.viewModel.header('Add a client');

        // Extra preset data
        if (this.requestData.newForSearchText) {
            clientDataFromSearchText(this.requestData.newForSearchText || '', this.viewModel.client());
        }
    }

    this.updateNavBarState();
};

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

function ViewModel(app) {
    /* eslint max-statements:"off" */
    this.helpLink = '/help/relatedArticles/201152639-managing-clients';

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
    this.isLoading = ko.pureComputed(function() {
        return (
            this.state.isLoading() ||
            this.isLoadingServices()
        );
    }, this);

    this.isSyncing = this.state.isSyncing;
    this.isSaving = this.state.isSaving;
    this.isLocked = ko.pureComputed(function() {
        return (
            this.state.isLocked() ||
            this.isDeleting()
        );
    }, this);
    this.isReadOnly = ko.pureComputed(function() {
        var c = this.client();
        return c && !c.editable();
    }, this);

    this.isDeleting = this.state.isDeleting;

    this.wasRemoved = ko.observable(false);

    this.isNew = ko.pureComputed(function() {
        var c = this.client();
        return !c || !c.updatedDate();
    }, this);

    this.serviceSummaries = ko.observable([]);

    this.loadServices = function(clientID) {
        var view = this;

        this.isLoadingServices(true);

        Promise.all([serviceProfessionalServices.getClientSpecificServices(clientID),
                     userJobProfile.getJobTitles(),
                     pricingTypes.getList()])
        .then(function(models) {
            var services = serviceProfessionalServices.asModel(models[0]);
            var jobTitles = models[1];
            var pricingTypes = models[2]();
            var summaries = ServicesSummaryPresenter.summaries(jobTitles, services, pricingTypes).sort(ServicesSummaryPresenter.sortByJobTitle);

            view.serviceSummaries(summaries);
        })
        .catch(function(error) {
            var messagePrefix = 'Unable to load special pricings';
            var messageName = view.client() ? ' for ' + view.client().firstName() : '';
            var message = messagePrefix + messageName + '.';

            showError({
                title: message,
                error: error
            });
        })
        .then(function() {
            view.isLoadingServices(false);
        });
    };

    this.submitText = ko.pureComputed(function() {
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
    }, this);

    this.unsavedChanges = ko.pureComputed(() => {
        var c = this.client();
        return c && this.dataTimestamp() !== c.model.dataTimestamp();
    });

    this.deleteText = ko.pureComputed(function() {
        return (
            this.isDeleting() ?
                'Deleting client...' :
                'Delete client'
        );
    }, this);

    this.showServices = ko.pureComputed(function() {
        return !this.isNew() && this.client();
    }, this);

    this.save = function() {

        clients
        .item(this.client().clientUserID())
        .save(this.client().model.toPlainObject())
        .then(function(serverData) {
            this.client().model.updateWith(serverData);
            this.dataTimestamp(this.client().model.dataTimestamp());
            // Special save, function provided by the activity on set-up
            this.onSave(serverData.clientUserID);
        }.bind(this))
        .catch(function(err) {
            showError({
                title: 'There was an error while saving.',
                error: err
            });
        });

    }.bind(this);

    this.confirmRemoval = function() {
        showConfirm({
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

        clients
        .item(this.clientID())
        .delete()
        .then(function() {
            this.wasRemoved(true);
            // Go out the deleted location
            app.shell.goBack();
        }.bind(this))
        .catch(function(err) {
            showError({
                title: 'There was an error while deleting.',
                error: err
            });
        });
    }.bind(this);

    this.tapServiceSummary = function(serviceSummary, event) {
        var route = new RouteParser('#!serviceProfessionalService/:jobTitleID/client/:clientID?mustReturn=#!clientEditor/:clientID');
        var url = route.reverse({ jobTitleID : serviceSummary.jobTitleID(), clientID : this.clientID() });

        app.shell.go(url);

        event.preventDefault();
        event.stopImmediatePropagation();
    }.bind(this);

    this.tapServiceSummaryNew = function(serviceSummary, event) {
        var route = new RouteParser('#!serviceProfessionalService/:jobTitleID/client/:clientID/new');
        var url = route.reverse({ jobTitleID : serviceSummary.jobTitleID(), clientID : this.clientID() });

        app.shell.go(url, null);

        event.preventDefault();
        event.stopImmediatePropagation();
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
            return seemsAPhoneNumber(e) ? e : '';
        }
        return '';
    }, this);

    // Public Search

    var foundPublicUser = function foundPublicUser(user) {
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
            .then(function() {
                // Acepted
                // Replace current user data
                // but keep notesAboutClient
                var notes = c.notesAboutClient();
                c.model.updateWith(user);
                c.notesAboutClient(notes);
                this.clientID(user.clientUserID);
            }.bind(this))
            .catch(function() {
                // Discarded, do nothing
            });
        }

    }.bind(this);

    // When filering has no results:
    ko.computed(function() {
        var c = this.client();
        if (!c) return;

        // NOTE: discarded the fullName because several results can be retrieved,
        // better use the search for that and double check entries

        var email = c.email();
        var phone = c.phone();
        if (!email && !phone) return;

        clients.publicSearch({
            email: email,
            phone: phone
        })
        .then(function(r) {
            if (r && r[0]) foundPublicUser(r[0]);
        }.bind(this))
        .catch(function() {
            // Doesn't matters
        });
    }, this)
    // Avoid excessive request by setting a timeout since the latest change
    .extend({ rateLimit: { timeout: 400, method: 'notifyWhenChangesStop' } });
}
