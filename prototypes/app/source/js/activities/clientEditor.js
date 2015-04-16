/**
    ClientEdition activity
**/
'use strict';

var Activity = require('../components/Activity');
var is = require('is_js');

var A = Activity.extends(function ClientEditionActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    
    this.accessLevel = this.app.UserType.LoggedUser;
    
    this.navBar = Activity.createSubsectionNavBar('clients', {
        backLink: 'clients'
    });
    
    // If there is a change on the clientID, the updates must match
    // that (if is not already that)
    this.registerHandler({
        target: this.viewModel.clientID,
        handler: function (clientID) {
            if (!clientID)
                return;

            var found = /clientEditor\/(\-?\d+)/i.exec(window.location),
                urlID = found && found[1] |0;

            // If is different URL and current ID
            if (!found ||
                urlID !== clientID) {
                // Replace URL
                this.app.shell.history.replaceState(null, null, 'clientEditor/' + clientID);
            }
        }.bind(this)
    });
});

exports.init = A.init;

var ko = require('knockout');

A.prototype.show = function show(state) {
    /*jshint maxcomplexity: 8*/
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
        
        // Check request parameters that allow preset customer information
        // (used when the customer is created based on an existent marketplace user)
        var presetData = this.requestData.presetData || {};
        // If there is not set an explicit 'false' value on editable
        // field (as when there is not data given), set to true so can be edited
        // NOTE: This is because a given marketplace user will come with editable:false
        // and need to be preserved, while on regular 'new client' all data is set by 
        // the freelancer.
        if (presetData.editable !== false) {
            presetData.editable = true;
        }

        /*this.viewModel.client.newItem(presetData);*/
        // New client
        this.viewModel.clientVersion(this.app.model.customers.newItem(presetData));
        this.viewModel.header('Add a Client');
        
        // Extra preset data
        if (this.requestData.newForSearchText) {
            clientDataFromSearchText(this.requestData.newForSearchText || '', this.viewModel.client());
        }
    }
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
                    this.isNew() ?
                        'Add client' :
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
        if (c.customerUserID() === user.customerUserID) return;
        
        // NOTE: avoiding use fullName because it can make more than one conflicting
        // results, being not enough the name to confirm the user (use the search for that)
        //  c.fullName() === user.fullName ||
        if (c.email() === user.email ||
            c.phone() === user.phone) {

            // Notify user
            var msg = 'We`ve found an existing record for {0}. Would you like to add him to your clients?'.replace(/\{0\}/g, user.firstName);
            app.modals.confirm({
                title: 'Customer found at loconomics.com',
                message: msg
            })
            .then(function() {
                // Acepted
                // Replace current user data
                // but keep notesAboutCustomer
                var notes = c.notesAboutCustomer();
                c.model.updateWith(user);
                c.notesAboutCustomer(notes);
                this.clientID(user.customerUserID);
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
        
        var email = c.email(),
            //fullName = c.fullName(),
            phone = c.phone();
        if (!email && !phone /*!fullName && */) return;

        app.model.customers.publicSearch({
            //fullName: fullName,
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
