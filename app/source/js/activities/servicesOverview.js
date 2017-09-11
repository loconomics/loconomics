/**
    ServicesOverview activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var jobTitles = require('../data/jobTitles');
var userJobProfile = require('../data/userJobProfile');
var serviceAttributes = require('../data/serviceAttributes');
var jobTitleServiceAttributes = require('../data/jobTitleServiceAttributes');
var DEFAULT_BACK_LINK = '/marketplaceJobtitles';
var DEFAULT_BACK_TEXT = 'Back';
require('../kocomponents/servicesOverview/attributes-combobox');

var A = Activity.extend(function ServicesOverviewActivity() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.loggedUser;
    this.title('Overview of your services');

    this.navBar = Activity.createSubsectionNavBar(DEFAULT_BACK_TEXT, {
        backLink: DEFAULT_BACK_LINK,
        helpLink: this.viewModel.helpLink
    });

    // On changing jobTitleID:
    // - load job title name
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {

            if (jobTitleID) {

                ////////////
                // Job Title
                // Get data for the Job title ID
                jobTitles.getJobTitle(jobTitleID)
                .then(function(jobTitle) {

                    // Fill in job title name
                    this.viewModel.jobTitleName(jobTitle.singularName());
                    this.updateNavBarState();
                }.bind(this))
                .catch(function(err) {
                    this.app.modals.showError({
                        title: 'There was an error while loading the job title.',
                        error: err
                    });
                }.bind(this));


                // Services data
                this.viewModel.isLoadingUserJobTitle(true);
                Promise.all([
                    userJobProfile.getUserJobTitle(jobTitleID),
                    this.viewModel.serviceAttributesControl.load(jobTitleID),
                    this.viewModel.jobTitleServiceAttributesControl.load(jobTitleID)
                ])
                .then(function(datas) {
                    var userJobTitle = datas && datas[0];
                    // we need the full record for the saving
                    this.viewModel.userJobTitle(userJobTitle);
                    // local copy of intro
                    this.viewModel.intro(userJobTitle.intro());
                    this.viewModel.isLoadingUserJobTitle(false);
                }.bind(this))
                .catch(function(err) {
                    this.app.modals.showError({
                        title: 'There was an error while loading.',
                        error: err
                    });
                    this.viewModel.isLoadingUserJobTitle(false);
                }.bind(this));

                // Fix URL
                // If the URL didn't included the jobTitleID, or is different,
                // we put it to avoid reload/resume problems
                var found = /servicesOverview\/(\d+)/i.exec(window.location);
                var urlID = found && found[1] |0;
                if (urlID !== jobTitleID) {
                    var url = '/servicesOverview/' + jobTitleID;
                    this.app.shell.replaceState(null, null, url);
                }
            }
            else {
                this.viewModel.jobTitleName('Job Title');
                this.viewModel.serviceAttributesControl.reset();
                this.viewModel.jobTitleServiceAttributesControl.reset();
                this.updateNavBarState();
            }
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.updateNavBarState = function updateNavBarState() {
    // Must mustReturn logic takes precendence
    // NOTE: is applied globally by app.js too, but async task may
    // end replacing it:
    var done = this.app.applyNavbarMustReturn(this.requestData);
    if (!done) {
        var text = this.viewModel.jobTitleName() || DEFAULT_BACK_TEXT;
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
    // Reset
    this.viewModel.jobTitleID(null);
    this.viewModel.intro(null);
    this.viewModel.serviceAttributes.proposedServiceAttributes({});

    Activity.prototype.show.call(this, state);

    var params = state && state.route && state.route.segments;
    var jid = params[0] |0;
    this.viewModel.jobTitleID(jid);

    if (!jid) {
        // Load titles to display for selection
        this.viewModel.jobTitles.sync();
    }
};

var UserJobProfile = require('../viewmodels/UserJobProfile');

function ViewModel(app) {
    this.helpLink = '/help/relatedArticles/201967766-describing-your-services-to-clients';

    this.jobTitleID = ko.observable(0);

    this.isLoadingUserJobTitle = ko.observable(false);
    this.userJobTitle = ko.observable(null);
    this.jobTitleName = ko.observable('Job Title');

    this.jobTitles = new UserJobProfile(app);
    this.jobTitles.baseUrl('/servicesOverview');
    this.jobTitles.selectJobTitle = function(jobTitle) {

        this.jobTitleID(jobTitle.jobTitleID());

        return false;
    }.bind(this);

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
                userJobProfile.setUserJobTitle(plain)
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
                app.modals.showError({ title: 'Error saving your Services Overview', error: err });
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
        var props = this.proposedServiceAttributes(),
            atts = selectedAttsIds();
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
        var newOne = attName || '',
            isEmpty = /^\s*$/.test(newOne),
            wasFound = this.selectedAttributes().some(foundAttItem.bind(null, { name: newOne }));
        if (!isEmpty && !wasFound) {
            userAtts.proposedServiceAttributes.push(catID, newOne);
        }
    };

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
