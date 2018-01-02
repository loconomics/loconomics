/**
    BookMeButton activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var $ = require('jquery');
var clipboard = require('../utils/clipboard');
var marketplaceProfile = require('../data/marketplaceProfile');
var userJobProfile = require('../data/userJobProfile');
var showError = require('../modals/error').show;

var A = Activity.extend(function BookMeButtonActivity() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.serviceProfessional;

    this.navBar = Activity.createSubsectionNavBar('Website scheduling', {
        backLink: 'scheduling' , helpLink: this.viewModel.helpLink
    });
    this.title('Add scheduling to your website');
    // Auto select text on textarea, for better 'copy'
    // NOTE: the 'select' must happen on click, no touch, not focus,
    // only 'click' is reliable and bug-free.
    this.registerHandler({
        target: this.$activity,
        event: 'click',
        selector: 'textarea',
        handler: function() {
            // Two versions, on Safari on setSelectionRange works
            $(this).select();
            this.setSelectionRange(0, 99999);
        }
    });

    this.registerHandler({
        target: marketplaceProfile,
        event: 'error',
        handler: function(err) {
            if (err && err.task === 'save') return;
            var msg = 'Error loading data to build the Button.';
            showError({
                title: msg,
                error: err && err.task && err.error || err
            });
        }.bind(this)
    });

    // On changing jobTitleID:
    // - load job title name
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {
            if (jobTitleID) {
                // User Job Title
                // Get data for the Job Title and User Profile
                userJobProfile.getUserJobTitleAndJobTitle(jobTitleID)
                //jobTitles.getJobTitle(jobTitleID)
                .then(function(job) {
                    this.viewModel.userJobTitle(job.userJobTitle);
                    // Fill in job title name
                    this.viewModel.jobTitleName(job.jobTitle.singularName());
                }.bind(this))
                .catch(function (err) {
                    showError({
                        title: 'There was an error while loading.',
                        error: err
                    });
                }.bind(this));
            }
            else {
                this.viewModel.jobTitleName('Job Title');
                this.viewModel.userJobTitle(null);
            }
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    // reset
    this.viewModel.jobTitleID(false);

    Activity.prototype.show.call(this, state);

    // Keep data updated:
    marketplaceProfile.sync();

    // Set the job title
    var jobID = state.route.segments[0] |0;
    this.viewModel.jobTitleID(jobID);
    this.viewModel.copyText('Copy');
};

function ViewModel() {
    this.helpLink = '/help/relatedArticles/201959943-add-scheduling-to-your-website';

    this.jobTitleName = ko.observable('Job Title');

    // Actual data for the form:

    // Read-only bookCode
    this.bookCode = ko.computed(function() {
        return marketplaceProfile.data.bookCode();
    });

    this.jobTitleID = ko.observable(0);

    this.copyText = ko.observable('Copy');

    // Button type, can be: 'icon', 'link'
    this.type = ko.observable('icon');

    this.type.subscribe(function() {
        // On any change, restore copy label
        this.copyText('Copy');
    }.bind(this));

    this.isLocked = marketplaceProfile.isLocked;

    // Generation of the button code

    var buttonTemplate =
        '<!-- begin Loconomics book-me-button -->' +
        '<a style="display:inline-block"><img alt="" style="border:none" width="200" height="50" /></a>' +
        '<!-- end Loconomics book-me-button -->';

    var linkTemplate =
        '<!-- begin Loconomics book-me-button -->' +
        '<a><span></span></a>' +
        '<!-- end Loconomics book-me-button -->';

    this.buttonHtmlCode = ko.pureComputed(function() {

        if (marketplaceProfile.isLoading()) {
            return 'loading...';
        }
        else {
            var type = this.type();
            var tpl = buttonTemplate;

            if (type === 'link')
                tpl = linkTemplate;

            var siteUrl = $('html').attr('data-site-url') || window.location.origin;
            var linkUrl = siteUrl + '/book/' + this.bookCode() + '/' + this.jobTitleID() + '/';
            var imgUrl = siteUrl + '/img/extern/book-me-now-button.svg';

            var code = generateButtonCode({
                tpl: tpl,
                label: 'Click here to book me now (on loconomics.com)',
                linkUrl: linkUrl,
                imgUrl: imgUrl
            });

            return code;
        }
    }, this);

    // Send email is disabled on html because on Android most of the code is cut (maybe is trying to be used as html?)
    // and iOS simply do nothing (almost on WkWebView and iOS 9.1).
    // AND NOT SO IMPORTANT
    this.sendByEmailURL = ko.pureComputed(function() {
        var btn = this.buttonHtmlCode().replace(/\n+/, '');
        return 'mailto:?body=' + encodeURIComponent('Loconomics Book Me Now Button HTML code: ' + btn);
    }, this);

    this.userJobTitle = ko.observable(null);
    this.bookMeButtonReady = ko.pureComputed(function() {
        var j = this.userJobTitle();
        return j && j.bookMeButtonReady() || false;
    }, this);
    this.collectPaymentAtBookMeButtonString = ko.pureComputed({
        read: function() {
            var j = this.userJobTitle();
            return j && j.collectPaymentAtBookMeButton() && 'true' || 'false';
        },
        write: function(val) {
            var j = this.userJobTitle();
            if (!j) return;
            if (val === 'true') {
                j.collectPaymentAtBookMeButton(true);
            }
            else {
                j.collectPaymentAtBookMeButton(false);
            }
        },
        owner: this
    });

    this.copyCode = function() {
        var text = this.buttonHtmlCode();
        var errMsg = clipboard.copy(text);
        if (errMsg) {
            showError({ error: errMsg });
        }
        else {
            this.copyText('Copied!');
        }
    }.bind(this);

    this.save = function() {
        var ujt = this.userJobTitle();
        if (ujt) {
            //this.isSaving(true);

            var plain = ujt.model.toPlainObject();
            plain.collectPaymentAtBookMeButton = ujt.collectPaymentAtBookMeButton();

            userJobProfile.setUserJobTitle(plain)
            .then(function() {
                //this.isSaving(false);
                //app.successSave();
            }.bind(this))
            .catch(function(err) {
                //this.isSaving(false);
                showError({ title: 'Error saving your "collect payment" preference', error: err });
            }.bind(this));
        }
    }.bind(this);
}

function generateButtonCode(options) {

    var $btn = $($.parseHTML('<div>' + options.tpl + '</div>'));

    $btn
    .find('a')
    .attr('href', options.linkUrl)
    .find('span')
    .text(options.label);
    $btn
    .find('img')
    .attr('src', options.imgUrl)
    .attr('alt', options.label);

    return $btn.html();
}
