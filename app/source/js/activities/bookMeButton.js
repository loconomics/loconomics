/**
    BookMeButton activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout'),
    $ = require('jquery');

var A = Activity.extend(function BookMeButtonActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.serviceProfessional;

    this.navBar = Activity.createSubsectionNavBar('Scheduling');
    
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
            this.get(0).setSelectionRange(0, 99999);
        }
    });
    
    this.registerHandler({
        target: this.app.model.marketplaceProfile,
        event: 'error',
        handler: function(err) {
            if (err && err.task === 'save') return;
            var msg = 'Error loading data to build the Button.';
            this.app.modals.showError({
                title: msg,
                error: err && err.task && err.error || err
            });
        }.bind(this)
    });
    
    var $code = this.$activity.find('textarea');
    this.viewModel.copyCode = function() {
        var errMsg;
        try {
            // If Cordova Plugin available, use that
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.clipboard) {
                window.cordova.plugins.clipboard.copy(this.viewModel.buttonHtmlCode());
            }
            else {
                // Web standard version: will not work on old Firefox and current Safari (as of 2015-11-26)
                // using setSelectionRange rather than select since seems more compatible (with Safari, but copy does not works
                // there so...maybe for the future I hope :-)
                $code
                .select()
                .get(0).setSelectionRange(0, 99999);
                if (!document.execCommand('copy')) {
                    errMsg = 'Impossible to copy text.';
                }
            }
        } catch(err) {
            errMsg = 'Impossible to copy text.';
        }
        if (errMsg) {
            this.app.modals.showError({ error: errMsg });
        }
        else {
            this.viewModel.copyText('Copied!');
        }
    }.bind(this);
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    // Keep data updated:
    this.app.model.marketplaceProfile.sync();
    
    // Set the job title
    var jobID = state.route.segments[0] |0;
    this.viewModel.jobTitleID(jobID);
    this.viewModel.copyText('Copy');
};

function ViewModel(app) {

    var marketplaceProfile = app.model.marketplaceProfile;
    
    // Actual data for the form:
    
    // Read-only bookCode
    this.bookCode = ko.computed(function() {
        return marketplaceProfile.data.bookCode();
    });
    
    this.jobTitleID = ko.observable(0);
    
    this.copyText = ko.observable('Copy');
    
    // Button type, can be: 'icon', 'link'
    this.type = ko.observable('icon');

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
            var type = this.type(),
                tpl = buttonTemplate;

            if (type === 'link')
                tpl = linkTemplate;

            var siteUrl = $('html').attr('data-site-url'),
                linkUrl = siteUrl + '/book/' + this.bookCode() + '/' + this.jobTitleID() + '/',
                imgUrl = siteUrl + '/img/extern/book-me-now-button.svg';

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
