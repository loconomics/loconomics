/**
    ServicesOverview activity
**/
'use strict';

import UserJobTitle from '../models/UserJobTitle';
import { item as userListingItem } from '../data/userListings';

var Activity = require('../components/Activity');
var ko = require('knockout');
var serviceAttributes = require('../data/serviceAttributes');
var jobTitleServiceAttributes = require('../data/jobTitleServiceAttributes');
var DEFAULT_BACK_LINK = '/listingEditor';
var DEFAULT_BACK_TEXT = 'Back';
require('../kocomponents/servicesOverview/attributes-combobox');
var showError = require('../modals/error').show;

var A = Activity.extend(function ServicesOverviewActivity() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.loggedUser;
    this.title('Overview of your services');

    this.navBar = Activity.createSubsectionNavBar(DEFAULT_BACK_TEXT, {
        backLink: DEFAULT_BACK_LINK,
        helpLink: this.viewModel.helpLink
    });
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {
    // Must mustReturn logic takes precendence
    // NOTE: is applied globally by app.js too, but async task may
    // end replacing it:
    var done = this.app.applyNavbarMustReturn(this.requestData);
    if (!done) {
        var text = this.viewModel.listingTitle() || DEFAULT_BACK_TEXT;
        var id = this.viewModel.jobTitleID();
        var link = id ? DEFAULT_BACK_LINK + '/' + id : DEFAULT_BACK_LINK;
        // Use job title name and ID for back link
        this.navBar.leftAction().model.updateWith({
            text: text,
            link: link
        });
    }
};

A.prototype.show = function show(state) {

    Activity.prototype.show.call(this, state);

    var params = state && state.route && state.route.segments;
    var jobTitleID = params[0] |0;

    // Reset
    this.viewModel.jobTitleID(jobTitleID);
    this.viewModel.intro(null);
    this.viewModel.serviceAttributes.proposedServiceAttributes({});
    this.viewModel.listingTitle('Job Title');
    // nav bar depends on listingTitle
    this.updateNavBarState();

    if (jobTitleID) {
        // Listing with user data
        this.viewModel.isLoadingUserJobTitle(true);
        userListingItem(jobTitleID).onceLoaded()
        .then((listing) => {
            // Direct copy of listing values
            this.viewModel.listingTitle(listing.title);
            // local copy of intro
            this.viewModel.intro(listing.intro);
            this.viewModel.isLoadingUserJobTitle(false);
            // Save for use in the view
            this.viewModel.userJobTitle(new UserJobTitle(listing));
            this.viewModel.isLoadingUserJobTitle(false);
            // nav bar depends on listingTitle
            this.updateNavBarState();
        })
        .catch((error) => {
            this.viewModel.isLoadingUserJobTitle(false);
            showError({
                title: 'There was an error while loading.',
                error
            });
        });
        // Additional data, available to be chosen/selected
        Promise.all([
            this.viewModel.serviceAttributesControl.load(jobTitleID),
            this.viewModel.jobTitleServiceAttributesControl.load(jobTitleID)
        ])
        .catch((error) => {
            showError({
                title: 'There was an error while loading.',
                error
            });
        });
    }
    else {
        this.viewModel.serviceAttributesControl.reset();
        this.viewModel.jobTitleServiceAttributesControl.reset();
    }
};

var UserJobProfile = require('../viewmodels/UserJobProfile');

function ViewModel(app) {
    this.helpLink = '/help/relatedArticles/201967766-describing-your-services-to-clients';

    this.jobTitleID = ko.observable(0);

    this.isLoadingUserJobTitle = ko.observable(false);
    this.userJobTitle = ko.observable(null);
    this.listingTitle = ko.observable('Job Title');

    this.jobTitles = new UserJobProfile(app);
    this.jobTitles.baseUrl('/servicesOverview');

    // Local copy of the intro, rather than use
    // it directly from the userJobTitle to avoid that gets saved
    // in memory without press 'save'
    this.intro = ko.observable(null);

    this.serviceAttributesControl = serviceAttributes.newItemVersion();
    this.serviceAttributes = this.serviceAttributesControl.version;
    this.jobTitleServiceAttributesControl = jobTitleServiceAttributes.newItemVersion();
    this.jobTitleServiceAttributes = this.jobTitleServiceAttributesControl.original;

    this.isLoading = ko.pureComputed(function() {
        return (
            this.isLoadingUserJobTitle() ||
            this.serviceAttributesControl.state.isLoading() ||
            this.jobTitleServiceAttributesControl.state.isLoading()
        );
    }, this);
    this.isSaving = ko.observable(false);
    this.isLocked = ko.pureComputed(function() {
        return this.isLoading() || this.isSaving();
    }, this);

    // Combined array of service attribute categories for all the available and
    // information for the selected by the user, with methods modify and query the lists
    this.categoriesView = ko.pureComputed(function() {
        var userAtts = this.serviceAttributes;
        return this.jobTitleServiceAttributes.serviceAttributes().map(function(cat) {
            return new AttributesCategoryVM(cat, userAtts);
        });
    }, this);

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
        var ujt = this.userJobTitle();
        if (ujt) {
            this.isSaving(true);

            var plain = ujt.model.toPlainObject();
            plain.intro = this.intro();

            Promise.all([
                this.serviceAttributesControl.save(),
                userListingItem(this.jobTitleID()).save(plain)
            ])
            .then(function() {
                this.isSaving(false);

                // Force a background jobTitleAttributes refresh if new ones
                // where submitted for insertion.
                var props = this.serviceAttributes.proposedServiceAttributes();
                var propCats = props && Object.keys(props);
                if (propCats && propCats.length) {
                    var thereAreNews = propCats.reduce(function(sum, k) {
                        var cat = props[k];
                        return sum + (cat && cat.length || 0);
                    }, 0) > 0;
                    if (thereAreNews) {
                        this.jobTitleServiceAttributesControl.load(undefined, true);
                    }
                }

                // Cleanup
                this.serviceAttributes.proposedServiceAttributes({});

                app.successSave();
            }.bind(this))
            .catch(function(err) {
                this.isSaving(false);
                showError({ title: 'Error saving your Services Overview', error: err });
            }.bind(this));
        }
    }.bind(this);
}

var ServiceAttribute = require('../models/ServiceAttribute');

function AttributesCategoryVM(cat, userAtts) {

    var catID = cat.serviceAttributeCategoryID();
    var selectedAttsIds = userAtts.serviceAttributes.getServiceCategoryAttributes(catID);
    this.category = ko.observable(cat);

    // An array of models for visualization from the list of proposed names for addition
    this.proposedServiceAttributes = ko.pureComputed(function() {
        var props = userAtts.proposedServiceAttributes();
        if (props && props[catID] && props[catID].length) {
            return props[catID].map(function(name) {
                return new ServiceAttribute({ name: name });
            });
        }
        else {
            return [];
        }
    }, this);

    this.selectedAttributes = ko.pureComputed(function() {
        var atts = cat.serviceAttributes().filter(function(att) {
            return selectedAttsIds().indexOf(att.serviceAttributeID()) > -1;
        });

        return atts.concat.apply(atts, this.proposedServiceAttributes());
    }, this);

    // Available, not selected, list of attributes
    this.availableAttributes = ko.computed(function() {
        var props = this.proposedServiceAttributes();
        var atts = selectedAttsIds();
        return cat.serviceAttributes().filter(function(att) {
            var toInclude = atts.indexOf(att.serviceAttributeID()) === -1;
            if (toInclude === false) return false;

            // Not found in IDs, try with proposed Names:
            return props.every(function(propAtt) {
                return att.name() !== propAtt.name();
            });
        });
    }, this);

    var foundAttItem = function(att, item) {
        return item.name() === att.name;
    };

    this.pushAttributeName = function(attName) {
        var newOne = attName || '';
        var isEmpty = /^\s*$/.test(newOne);
        var wasFound = this.selectedAttributes().some(foundAttItem.bind(null, { name: newOne }));
        if (!isEmpty && !wasFound) {
            userAtts.proposedServiceAttributes.push(catID, newOne);
        }
    }.bind(this);

    this.pushAttribute = function(att) {
        if (att.serviceAttributeID()) {
            userAtts.serviceAttributes.push(catID, att.serviceAttributeID());
        }
    };

    this.removeAttribute = function(att) {
        var id = att.serviceAttributeID();
        if (id)
            userAtts.serviceAttributes.remove(catID, id);
        else
            userAtts.proposedServiceAttributes.remove(catID, att.name());
    }.bind(this);
}
