/**
 * Listing.
 * Visualizes a listing of a user, or current user
 *
 * @module activities/listing
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import $ from 'jquery';
import Activity from '../../components/Activity';
import MessageBar from '../../components/MessageBar';
import PublicUser from '../../models/PublicUser';
import PublicUserJobTitle from '../../models/PublicUserJobTitle';
import ReviewsVM from '../../viewmodels/ReviewsVM';
import { expandUserBadges } from '../../data/userBadges';
import ko from 'knockout';
import shell from '../../app.shell';
import { show as showError } from '../../modals/error';
import style from './style.styl';
import template from './template.html';
import { data as user } from '../../data/userProfile';
import users from '../../data/users';

const ROUTE_NAME = 'listing';

export default class Listing extends Activity {

    static get template() { return template; }

    static get style() { return style; }

    constructor($activity, app) {
        super($activity, app);

        // Everybody
        this.accessLevel = null;
        this.navBar = Activity.createSectionNavBar(null);
        this.title = ko.pureComputed(() => {
            const user = this.user();
            if (user) {
                const name = user.profile().firstNameLastInitial();
                const title = user.selectedJobTitle() && user.selectedJobTitle().title();
                return `${name}, ${title}`;
            }
            else {
                return 'Listing';
            }
        });

        this.__defViewProperties();
        this.__defViewMethods();

        // DOM Event Handler
        this.registerHandler({
            event: 'layoutUpdate',
            target: $(window),
            handler: () => this.refreshTs(new Date())
        });
    }

    __defViewProperties() {
        /**
         * @member {KnockoutObservable<PublicUser>}
         */
        this.user = ko.observable(null);
        this.isLoading = ko.observable(false);
        this.userID = ko.observable(null);
        this.reviews = new ReviewsVM();
        this.showMessageBar = ko.observable(false);
        /**
         * Time zone name displayed to the user.
         * We used the standard TZID with a special case for ones defined for
         * USA using the special prefix 'US/', where we strip that prefix.
         * @member {KnockoutComputed<string>}
         */
        this.timeZone = ko.pureComputed(() => {
            const tz = this.user() && this.user().weeklySchedule() &&
                this.user().weeklySchedule().timeZone();
            return tz && tz.replace('US/', '') || '';
        });
        // Just a timestamp to notice that a request to refresh UI happens
        // Is updated on 'show' and layoutUpdate (when inside this UI) currently
        // just to notify app-address-map elements
        this.refreshTs = ko.observable(new Date());

        this.hasServicesOverview = ko.pureComputed(() => {
            var jobTitle = this.user() && this.user().selectedJobTitle();
            var hasIntro = jobTitle && jobTitle.hasIntro();
            var hasAttributes = jobTitle && jobTitle.serviceAttributes().hasAttributes();
            return hasIntro || hasAttributes;
        });
        this.hasVIPOfferingsForClient = ko.pureComputed(() => this.selectedJobTitle() && this.selectedJobTitle().clientSpecificServices().length);
        this.hasCredentials = ko.pureComputed(() => {
            var hasEducation = this.user() && this.user().education().length;
            var hasLicenseCertification = this.selectedJobTitle() && this.selectedJobTitle().licensesCertifications().length;
            return hasEducation || hasLicenseCertification;
        });
        this.listingTitle = ko.pureComputed(() => this.selectedJobTitle().title());
        this.selectedJobTitle = ko.pureComputed(() => this.user() && this.user().selectedJobTitle() || new PublicUserJobTitle());
        this.listingIsActive = ko.pureComputed(() => this.selectedJobTitle().isActive());
        this.isOwnProfile = ko.pureComputed(() => {
            var profileOwnerUserID = this.userID();
            if(user.isAnonymous() || profileOwnerUserID === null) {
                return false;
            }
            else {
                return profileOwnerUserID == user.userID();
            }
        });
        this.isMessageBarVisible = ko.pureComputed(() => this.isOwnProfile() && this.showMessageBar());
        this.messageBarTone = ko.pureComputed(() => this.listingIsActive() && MessageBar.tones.success || MessageBar.tones.warning);
        /**
         * List of expanded user badges (are loaded from the activity, mixim profile data
         * and source data of each badge assertion)
         * @param {KnockoutObservableArray<data/userBadges/UserBadgeAssertion>}
         */
        this.userBadges = ko.observableArray([]);

        this.__defWorkPhotosMembers();
        this.__defAddressMembers();
        this.__defSocialLinksMembers();
    }

    /**
     * Work Photos utils
     */
    __defWorkPhotosMembers() {
        var DEFAULT_WORKPHOTOS_LIMIT = 2;
        this.isShowingAllPhotos = ko.observable(false);
        this.workPhotos = ko.pureComputed(() => {
            var u = this.user();
            var ph = u && u.selectedJobTitle() && u.selectedJobTitle().workPhotos();
            if (!ph) {
                return [];
            }
            else if (this.isShowingAllPhotos()) {
                return ph;
            }
            else {
                // Filter by 2 first photos:
                var firsts = [];
                ph.some(function(p, i) {
                    if (i > DEFAULT_WORKPHOTOS_LIMIT - 1)
                        return true;
                    firsts.push(p);
                });
                return firsts;
            }
        });
        this.viewMoreWorkPhotosLabel = ko.pureComputed(() => {
            let imgCount = this.user() && this.user().selectedJobTitle() &&
                this.user().selectedJobTitle().workPhotos();
            imgCount = imgCount && imgCount.length || 0;
            if (this.isShowingAllPhotos() || imgCount === 0 || imgCount <= DEFAULT_WORKPHOTOS_LIMIT)
                return '';
            else
                return 'View all ' + imgCount + ' images';
        });
        this.viewAllPhotos = () => {
            this.isShowingAllPhotos(true);
        };
    }

    /**
     * Managing Addresses
     */
    __defAddressMembers() {
        this.serviceAddresses = ko.pureComputed(() => {
            var u = this.user();
            var adds = u && u.selectedJobTitle() && u.selectedJobTitle().serviceAddresses();
            return adds || [];
        });
        this.changeJobTitle = (jobTitle, event) => {
            this.user().selectedJobTitleID(jobTitle.jobTitleID());
            this.reviews.reset(undefined, jobTitle.jobTitleID());
            this.reviews.load({ limit: 2 });
            if (event) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
            var url = event.target.getAttribute('href');
            shell.pushState(null, null, url);
        };
    }

    __defSocialLinksMembers() {
        this.getEmailLink = ko.pureComputed(() => {
            var u = this.user();
            if (!u) return '';
            var url = encodeURIComponent(u.profile().serviceProfessionalProfileUrl());
            return 'mailto:?body=' + encodeURIComponent(u.profile().fullName() + ': ') + url;
        });
        this.getFacebookLink = ko.pureComputed(() => {
            var u = this.user();
            if (!u) return '';
            var url = encodeURIComponent(u.profile().serviceProfessionalProfileUrl());
            return 'http://www.facebook.com/share.php?u=' + url + '&t=' + encodeURIComponent(u.profile().fullName());
        });
        this.getTwitterLink = ko.pureComputed(() => {
            var u = this.user();
            if (!u) return '';
            var url = encodeURIComponent(u.profile().serviceProfessionalProfileUrl());
            return 'http://twitter.com/intent/tweet?text=' + encodeURIComponent(u.profile().fullName() + ': ' + url);
        });
        this.getGooglePlusLink = ko.pureComputed(() => {
            var u = this.user();
            if (!u) return '';
            var url = encodeURIComponent(u.profile().serviceProfessionalProfileUrl());
            return 'https://plus.google.com/share?url=' + url;
        });
        this.getPinterestLink = ko.pureComputed(() => {
            var u = this.user();
            if (!u) return '';
            var url = encodeURIComponent(u.profile().serviceProfessionalProfileUrl());
            var photo = encodeURIComponent(u.profile().photoUrl());
            return 'http://pinterest.com/pin/create/button/?url=' + url + '&media=' + photo + '&description=' + encodeURIComponent(u.profile().fullName() + ': ' + url);
        });
        this.getBookLink = ko.pureComputed(() => {
            var u = this.user();
            if (!u) return '';
            return '#!booking/' + u.profile().userID() + '/' + u.selectedJobTitleID();
        });
        this.getSendMessageLink = ko.pureComputed(() => {
            var u = this.user();
            if (!u) return '';
            return '#!inbox/new/' + u.profile().userID();
        });
    }

    __defViewMethods() {
        this.reset = () => {
            this.user(null);
            this.userID(null);
            this.showMessageBar(false);
        };
        this.editListing = () => {
            shell.go('/listing-editor/' + this.selectedJobTitle().jobTitleID());
        };
        /**
         * Returns a URL to where to view details of the badge assigned to the user, with a return
         * link to the listing editor.
         * @param {OpenBadgesV2/Assertion} assertion data for an assertion
         * @returns {string}
         */
        this.getBadgeDetailsURL = (assertion) => {
            const id = encodeURIComponent(assertion.id);
            const jobTitleID = this.user() && this.user().selectedJobTitleID();
            const label = encodeURIComponent('Listing');
            return `/badge-view/${id}?mustReturn=listing/${this.userID()}/${jobTitleID}&returnText=${label}`;
        };
    }

    loadData(userID, jobTitleID) {
        this.reset();
        if (userID) {
            this.isLoading(true);
            users.getUser(userID, { includeFullJobTitleID: jobTitleID })
            .then(function(data) {
                var pu = new PublicUser(data);
                this.user(pu);
                this.user().selectedJobTitleID(jobTitleID);
                // Load extra job data (reviews)
                this.reviews.load({ limit: 2 });
            }.bind(this))
            .catch((error) => {
                showError({
                    error,
                    title: 'The user profile could not be loaded.'
                });
            })
            .then(() => {
                // always
                this.isLoading(false);
            });
        }
    }

    /**
     * URL segments template: /{userID:int}/{jobTitleID:int}
     * Both are optional.
     * If no userID, the current user profile is showed
     * If not jobTitleID, the first one is returned
     * TODO: Is automatic jobTitleID still valid? wasn't buggy? Review and
     * clarify previous comment
     * @param {Object} state
     * @param {Object} state.route
     * @param {Array<string>} state.route.segments Contains user and job title
     * parameters per position as:
     * - {number} segments[0] UserID
     * - {number} segments[1] jobTitleID
     */
    show(state) {
        super.show(state);

        const params = state.route.segments;
        // Get requested userID or the current user profile
        var userID = (params[0] |0) || user.userID();
        var jobTitleID = params[1] |0;

        this.loadData(userID, jobTitleID);
        this.reviews.reset(userID, jobTitleID);
        this.refreshTs(new Date());
        this.userID(userID);
        this.showMessageBar(true);

        /**
         * When badges for current profile are loaded, expand with the assertions data.
         */
        this.observeChanges(() => {
            const badges = this.user() &&
                this.user().selectedJobTitle() &&
                this.user().selectedJobTitle().badges();
            if (badges) {
                expandUserBadges(badges).then(this.userBadges);
            }
            else {
                return this.userBadges([]);
            }
        });
    }

    hide() {
        // We should explicitly hide the bar since it's attached to the document
        // outside of the activity html element, then is not removed with the
        // activity content.
        this.showMessageBar(false);
    }
}

activities.register(ROUTE_NAME, Listing);
