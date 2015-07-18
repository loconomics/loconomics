/**
    WorkPhotos activity
**/
'use strict';

var ko = require('knockout'),
    Activity = require('../components/Activity');

var A = Activity.extends(function WorkPhotosActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.Freelancer;
    this.viewModel = new ViewModel(this.app);
    // Defaults settings for navBar.
    this.navBar = Activity.createSubsectionNavBar('Job Title');

    // On changing jobTitleID:
    // - load photos
    /* TODO Uncomment and update on implementing REST API AppModel
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {
            if (jobTitleID) {
                // Get data for the Job title ID
                this.app.model.workphotos.getList(jobTitleID)
                .then(function(list) {
                    // Save for use in the view
                    this.viewModel.list(list);
                }.bind(this))
                .catch(function (err) {
                    this.app.modals.showError({
                        title: 'There was an error while loading.',
                        error: err
                    });
                }.bind(this));
            }
            else {
                this.viewModel.list([]);
            }
        }.bind(this)
    });*/
    // TODO Remove on implemented REST API
    this.viewModel.list(testdata());
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    var params = options && options.route && options.route.segments;
    this.viewModel.jobTitleID(params[0] |0);
};

function ViewModel(app) {

    this.jobTitleID = ko.observable(0);
    this.list = ko.observableArray([]);
    
    this.isSyncing = app.model.licensesCertifications.state.isSyncing();
    this.isLoading = app.model.licensesCertifications.state.isLoading();

    this.addNew = function() {
        /*
        var url = '#!licensesCertificationsForm/' + this.jobTitleID(),
            cancelUrl = 'licensesCertifications/' + this.jobTitleID();
        var request = $.extend({}, this.requestData, {
            cancelLink: cancelUrl
        });
        app.shell.go(url, request);
        */
    }.bind(this);
    
    this.selectItem = function(/*item*/) {
        /*
        var url = '/licensesCertificationsForm/' + this.jobTitleID() + '/' +
            item.licenseCertificationID(),
            cancelUrl = 'licensesCertifications/' + this.jobTitleID();
        var request = $.extend({}, this.requestData, {
            cancelLink: cancelUrl
        });
        app.shell.go(url, request);*/
    }.bind(this);
}



/// TESTDATA

function testdata() {
    return [
        { url: 'https://loconomics.com/img/userphotos/u296/0c95dbccafd14953a94bde86eff4d34a-442x332.jpg', title: 'Testing photo 1' },
        { url: 'https://loconomics.com/img/userphotos/u296/3eb14073cb6a45138b6fd96b459bf3a1-442x332.jpg', title: 'Testing photo 2' },
        { url: 'https://loconomics.com/img/userphotos/u296/0c95dbccafd14953a94bde86eff4d34a-442x332.jpg', title: 'Testing photo 3' },
        { url: 'https://loconomics.com/img/userphotos/u296/3eb14073cb6a45138b6fd96b459bf3a1-442x332.jpg', title: 'Testing photo 4' }
    ];
}