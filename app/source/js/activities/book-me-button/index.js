/**
 * BookMeButton
 *
 * @module activities/book-me-button
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import $ from 'jquery';
import Activity from '../../components/Activity';
import UserJobTitle from '../../models/UserJobTitle';
import UserType from '../../enums/UserType';
import clipboard from '../../utils/clipboard';
import ko from 'knockout';
import marketplaceProfile from '../../data/marketplaceProfile';
import { show as showError } from '../../modals/error';
import template from './template.html';
import { item as userListingItem } from '../../data/userListings';

const ROUTE_NAME = 'book-me-button';

export default class BookMeButton extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.helpLink = '/help/relatedArticles/201959943-add-scheduling-to-your-website';
        this.navBar = Activity.createSubsectionNavBar('Website scheduling', {
            backLink: 'scheduling',
            helpLink: this.helpLink
        });
        this.title('Add scheduling to your website');

        // TODO: Refactor from old activity
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
            handler: (err) => {
                if (err && err.task === 'save') return;
                var msg = 'Error loading data to build the Button.';
                showError({
                    title: msg,
                    error: err && err.task && err.error || err
                });
            }
        });

        this.listingTitle = ko.observable('Job Title');

        // Actual data for the form:

        // Read-only bookCode
        this.bookCode = ko.computed(() => marketplaceProfile.data.bookCode());

        this.jobTitleID = ko.observable(0);

        this.copyText = ko.observable('Copy');

        // Button type, can be: 'icon', 'link'
        this.type = ko.observable('icon');

        this.type.subscribe(() => {
            // On any change, restore copy label
            this.copyText('Copy');
        });

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

        this.buttonHtmlCode = ko.pureComputed(() => {

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
        });

        // Send email is disabled on html because on Android most of the code is cut (maybe is trying to be used as html?)
        // and iOS simply do nothing (almost on WkWebView and iOS 9.1).
        // AND NOT SO IMPORTANT
        this.sendByEmailURL = ko.pureComputed(() => {
            var btn = this.buttonHtmlCode().replace(/\n+/, '');
            return 'mailto:?body=' + encodeURIComponent('Loconomics Book Me Now Button HTML code: ' + btn);
        });

        this.userJobTitle = ko.observable(null);
        this.bookMeButtonReady = ko.pureComputed(() => {
            var j = this.userJobTitle();
            return j && j.bookMeButtonReady() || false;
        });
        this.collectPaymentAtBookMeButtonString = ko.pureComputed({
            read: () => {
                var j = this.userJobTitle();
                return j && j.collectPaymentAtBookMeButton() && 'true' || 'false';
            },
            write: (val) => {
                var j = this.userJobTitle();
                if (!j) return;
                if (val === 'true') {
                    j.collectPaymentAtBookMeButton(true);
                }
                else {
                    j.collectPaymentAtBookMeButton(false);
                }
            }
        });

        this.copyCode = () => {
            var text = this.buttonHtmlCode();
            var errMsg = clipboard.copy(text);
            if (errMsg) {
                showError({ error: errMsg });
            }
            else {
                this.copyText('Copied!');
            }
        };

        this.save = () => {
            var ujt = this.userJobTitle();
            if (ujt) {
                //this.isSaving(true);

                var plain = ujt.model.toPlainObject();
                plain.collectPaymentAtBookMeButton = ujt.collectPaymentAtBookMeButton();

                userListingItem(this.jobTitleID())
                .save(plain)
                .then(function() {
                    //this.isSaving(false);
                    //app.successSave();
                }.bind(this))
                .catch(function(err) {
                    //this.isSaving(false);
                    showError({ title: 'Error saving your "collect payment" preference', error: err });
                }.bind(this));
            }
        };
    }

    /**
     *
     * @param {Object} state
     * @param {Object} state.route
     * @param {Array} state.route.segments Job Title is specified in the URL
     * as first segment:
     * {(string|number)} segments[0]
     */
    show(state) {
        super.show(state);

        // Keep data updated:
        marketplaceProfile.sync();

        // Set the job title
        var jobTitleID = state.route.segments[0] |0;
        this.__connectJobTitle(jobTitleID);
    }

    __connectJobTitle(jobTitleID) {
        this.copyText('Copy');
        this.jobTitleID(jobTitleID);
        this.listingTitle('Job Title');
        this.userJobTitle(null);
        // Load data by the listing job title
        if (jobTitleID) {
            const listingDataProvider = userListingItem(jobTitleID);
            this.subscribeTo(listingDataProvider.onData, (listing) => {
                // Direct copy of listing values
                this.listingTitle(listing.title);
                // Save for use in the view
                this.userJobTitle(new UserJobTitle(listing));
            });
            this.subscribeTo(listingDataProvider.onDataError, (error) => {
                showError({
                    title: 'There was an error while loading booking policies.',
                    error
                });
            });
        }
    }
}

activities.register(ROUTE_NAME, BookMeButton);

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
