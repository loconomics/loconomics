/**
    ServiceProfessionalWebsite activity
**/
'use strict';

var Activity = require('../components/Activity'),
    ko = require('knockout');

var A = Activity.extend(function ServiceProfessionalWebsiteActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.serviceProfessional;
    
    this.navBar = Activity.createSubsectionNavBar('Marketplace profile', {
        backLink: '/marketplaceProfile' , helpLink: '/help/relatedArticles/201967756-listing-your-personal-or-business-website'
    });
    
    this.registerHandler({
        target: this.app.model.marketplaceProfile,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Error saving your website.' : 'Error loading your website.';
            this.app.modals.showError({
                title: msg,
                error: err && err.task && err.error || err
            });
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    // Discard any previous unsaved edit
    this.viewModel.discard();
    // Keep data updated:
    this.viewModel.sync();
};

var MarketplaceProfileVM = require('../viewmodels/MarketplaceProfileVM');

function ViewModel(app) {
    var t = new MarketplaceProfileVM(app);
    
    t.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ? 
                'loading...' : 
                this.isSaving() ? 
                    'saving...' : 
                    'Save'
        );
    }, t);
    
    var save = t.save;
    t.save = function() {
        save().then(function() {
            app.successSave();
        })
        .catch(function() {
            // catch error, managed on event
        });
    };
    
    return t;
}
