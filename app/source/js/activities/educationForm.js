/**
    EducationForm activity
**/
'use strict';

var Activity = require('../components/Activity'),
    ko = require('knockout');

var A = Activity.extends(function EducationFormActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.loggedUser;

    this.navBar = Activity.createSubsectionNavBar('Education');
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {

    var link = this.requestData.cancelLink || '/education/';
    
    this.convertToCancelAction(this.navBar.leftAction(), link);
};

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    // Reset
    this.viewModel.version(null);

    // Params
    var params = state && state.route && state.route.segments || [];
    
    this.viewModel.educationID(params[0] |0);
    
    this.updateNavBarState();
    
    if (this.viewModel.educationID() === 0) {
        // NEW one
        this.viewModel.version(this.app.model.education.newItem());
    }
    else {
        // LOAD
        this.app.model.education.createItemVersion(this.viewModel.educationID())
        .then(function (educationVersion) {
            if (educationVersion) {
                this.viewModel.version(educationVersion);
            } else {
                throw new Error('No data');
            }
        }.bind(this))
        .catch(function (err) {
            this.app.modals.showError({
                title: 'There was an error while loading.',
                error: err
            })
            .then(function() {
                // On close modal, go back
                this.app.shell.goBack();
            }.bind(this));
        }.bind(this));
    }
};

function ViewModel(app) {

    this.educationID = ko.observable(0);
    this.isLoading = app.model.education.state.isLoading;
    this.isSaving = app.model.education.state.isSaving;
    this.isSyncing = app.model.education.state.isSyncing;
    this.isDeleting = app.model.education.state.isDeleting;
    this.isLocked = ko.computed(function() {
        return this.isDeleting() || app.model.education.state.isLocked();
    }, this);
    
    this.version = ko.observable(null);
    this.item = ko.pureComputed(function() {
        var v = this.version();
        if (v) {
            return v.version;
        }
        return null;
    }, this);
    
    this.isNew = ko.pureComputed(function() {
        var p = this.item();
        return p && !p.updatedDate();
    }, this);

    this.submitText = ko.pureComputed(function() {
        var v = this.version();
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
        var v = this.version();
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
        app.model.education.setItem(this.item().model.toPlainObject())
        .then(function(serverData) {
            // Update version with server data.
            this.item().model.updateWith(serverData);
            // Push version so it appears as saved
            this.version().push({ evenIfObsolete: true });
            // Go out
            app.successSave();
        }.bind(this))
        .catch(function(err) {
            app.modals.showError({
                title: 'There was an error while saving.',
                error: err
            });
        });

    }.bind(this);
    
    this.confirmRemoval = function() {
        // L18N
        app.modals.confirm({
            title: 'Delete',
            message: 'Are you sure? The operation cannot be undone.',
            yes: 'Delete',
            no: 'Keep'
        })
        .then(function() {
            this.remove();
        }.bind(this));
    }.bind(this);

    this.remove = function() {
        app.model.education.delItem(this.educationID())
        .then(function() {
            // Go out
            // TODO: custom message??
            app.successSave();
        }.bind(this))
        .catch(function(err) {
            app.modals.showError({
                title: 'There was an error while deleting.',
                error: err
            });
        });
    }.bind(this);
    
    this.yearsOptions = ko.computed(function() {
        var l = [];
        for (var i = new Date().getFullYear(); i > 1900; i--) {
            l.push(i);
        }
        return l;
    });
}
