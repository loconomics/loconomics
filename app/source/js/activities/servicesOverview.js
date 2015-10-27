/**
    ServicesOverview activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');

var A = Activity.extends(function ServicesOverviewActivity() {
    
    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.loggedUser;
    
    this.navBar = Activity.createSubsectionNavBar('Job Title');
    
    // On changing jobTitleID:
    // - load addresses
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {
            if (jobTitleID) {
                this.viewModel.isLoading(true);
                // Get data for the Job title ID
                this.app.model.userJobProfile.getUserJobTitle(jobTitleID)
                .then(function(userJobTitle) {
                    // Save for use in the view
                    this.viewModel.userJobTitle(userJobTitle);
                    this.viewModel.intro(userJobTitle.intro());
                }.bind(this))
                .catch(function (err) {
                    this.app.modals.showError({
                        title: 'There was an error while loading.',
                        error: err
                    });
                }.bind(this))
                .then(function() {
                    // Finally
                    this.viewModel.isLoading(false);
                }.bind(this));
            }
            else {
                this.viewModel.userJobTitle(null);
            }
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    // Reset
    this.viewModel.jobTitleID(null);
    this.viewModel.intro(null);
    
    Activity.prototype.show.call(this, state);
    
    var params = state && state.route && state.route.segments;
    this.viewModel.jobTitleID(params[0] |0);
};

function ViewModel(app) {
    this.jobTitleID = ko.observable(0);
    this.userJobTitle = ko.observable(null);
    // Local copy of the intro, rather than use
    // it directly from the userJobTitle to avoid that gets saved
    // in memory without press 'save'
    this.intro = ko.observable(null);
    
    this.isLoading = ko.observable(false);
    this.isSaving = ko.observable(false);
    this.isLocked = ko.pureComputed(function() {
        return this.isLoading() || this.isSaving();
    }, this);
    
    var sampleDataList = [{
        name: ko.observable('Window cleaning')
    }, {
        name: ko.observable('Self-cleaning oven')
    }, {
        name: ko.observable('Cabinet cleaning')
    }];
    
    // TODO: Must be a component, with one instance per service attribute category, and being completed
    this.list = ko.observableArray(sampleDataList);
    this.attributeSearch = ko.observable('');
    var foundAttItem = function(att, item) {
        return item.name === att.name;
    };
    this.addAttribute = function() {
        var newOne = this.attributeSearch() || '';
        if (!/^\s*$/.test(newOne) &&
            !this.list().some(foundAttItem.bind(null, { name: newOne }))) {
            this.list.push({
                name: newOne
            });
        }
    };
    this.removeAttribute = function(att) {
        // ko array: remove
        this.list.remove(foundAttItem.bind(null, att));
    }.bind(this);
    
    this.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ? 
                'loading...' : 
                this.isSaving() ? 
                    'saving...' : 
                    'Save'
        );
    }, this);
    
    this.save = function() {
        console.log('TODO Save attributes..');
        var ujt = this.userJobTitle();
        if (ujt) {
            this.isSaving(true);

            var plain = ujt.model.toPlainObject();
            plain.intro = this.intro();

            app.model.userJobProfile.setUserJobTitle(plain)
            .then(function() {
                this.isSaving(false);
                app.successSave();
            }.bind(this))
            .catch(function(err) {
                this.isSaving(false);
                app.modals.showError({ title: 'Error saving your Services Overview', error: err });
            }.bind(this));
        }
    }.bind(this);
}
