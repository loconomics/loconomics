/**
    AddJobTitles activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extend(function AddJobTitlesActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Scheduling');
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {

    var referrer = this.app.shell.referrerRoute;
    referrer = referrer && referrer.url || '/scheduling';
    var link = this.requestData.cancelLink || referrer;
    
    if (!this.app.model.onboarding.updateNavBar(this.navBar)) {
        this.convertToCancelAction(this.navBar.leftAction(), link);
    }
};

A.prototype.show = function show(options) {

    Activity.prototype.show.call(this, options);
    
    // Reset
    this.viewModel.searchText('');
    this.viewModel.jobTitles.removeAll();
    
    this.updateNavBarState();
};

var ko = require('knockout');
function ViewModel(app) {
    
    this.isSearching = ko.observable(false);
    this.isSaving = ko.observable(false);
    this.isLocked = this.isSaving;
    this.searchText = ko.observable('');
    this.jobTitles = ko.observableArray([]);
    
    this.submitText = ko.pureComputed(function() {
        return (
            app.model.onboarding.inProgress() ?
                'Save and continue' :
                this.isSaving() ? 
                    'saving...' : 
                    'Save'
        );
    }, this);
    
    this.unsavedChanges = ko.pureComputed(function() {
        return !!this.jobTitles().length;
    }, this);

    this.searchBy = function searchBy(text) {
        return app.model.rest.get('job-titles/autocomplete', { search: text })
        .catch(function (err) {
            app.modals.showError({ error: err });
        });
    }.bind(this);
    
    this.search = function search() {
        this.searchBy(this.searchText());
    }.bind(this);
    
    this.addItem = function addItem(item) {
        // Add to the list, if is not already in it
        var foundIndex = this.findItem(item);
        if (foundIndex === -1) {
            this.jobTitles.push(item);
        }
        // Clear search, closing suggestions too
        this.searchText('');
    }.bind(this);

    this.add = function add() {
        var s = this.searchText();
        if (s) {
            this.addItem({
                value: 0,
                label: s
            });
            this.searchText('');
        }
    }.bind(this);
    
    /**
        Look for an item in the current list, returning
        its index in the list or -1 if nothing.
    **/
    this.findItem = function findItem(jobTitle) {
        var foundIndex = -1;
        this.jobTitles().some(function(item, index) {
            if (jobTitle.value !== 0 &&
                item.value === jobTitle.value ||
                item.label === jobTitle.label) {
                foundIndex = index;
                return true;
            }
        });
        return foundIndex;
    };
    
    this.remove = function remove(jobTitle) {
        var removeIndex = this.findItem(jobTitle);
        if (removeIndex > -1) {
            this.jobTitles.splice(removeIndex, 1);
        }
    }.bind(this);
    
    this.save = function save() {
        this.isSaving(true);

        Promise.all(this.jobTitles().map(function(jobTitle) {
            return app.model.userJobProfile.createUserJobTitle({
                jobTitleID: jobTitle.value,
                jobTitleName: jobTitle.label
            });
        }))
        .then(function(/*results*/) {
            this.searchText('');
            this.isSaving(false);
            // Reset list
            this.jobTitles.removeAll();
            
            if (app.model.onboarding.inProgress()) {
                app.model.onboarding.goNext();
            }
            else {
                app.successSave();
            }
            
        }.bind(this))
        .catch(function(error) {
            this.searchText('');
            this.isSaving(false);
            app.modals.showError({
                title: 'Impossible to add one or more job titles',
                error: error
            });
        }.bind(this));
    }.bind(this);
    
    // Autocomplete suggestions
    this.autocompleteSuggestions = ko.observableArray();
    this.searchText.subscribe(function(text) {
        if (text) {
            // Server search
            this.searchBy(text)
            .then(function(results) {
                // Avoid race conditions: double check the search is still the same
                // text checked with the server
                if (this.searchText() === text) {
                    this.autocompleteSuggestions(results);
                }
            }.bind(this));
        }
        else {
            this.autocompleteSuggestions([]);
        }
    }, this);
    
    // TODO: Implement a local search with a local copy of all available job-titles (if is not too much data)
    // rather than the previous server search on each typing
    // Next suggestion code based on servicesOverview attributes search
    /*var textSearch = require('../utils/textSearch');
    this.autocompleteSuggestions = ko.computed(function() {
        var s = this.searchText(),
            a = this.availableJobTitles();
        return a.filter(function(jt) {
            return textSearch(s, jt.singularName());
        });
    }, this);*/
}
