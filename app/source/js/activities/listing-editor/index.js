/**
 * ListingEditor
 * Visualizes and allow edition of a listing of the current user
 *
 * TODO: create components and combine with listing activity
 *
 * @module activities/listing-editor
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import '../../kocomponents/badge/viewer';
import * as activities from '../index';
import { byListing as badgesByListing, expandUserBadges } from '../../data/userBadges';
import $ from 'jquery';
import Activity from '../../components/Activity';
import AlertLink from '../../viewmodels/AlertLink';
import PublicUser from '../../models/PublicUser';
import PublicUserJobTitle from '../../models/PublicUserJobTitle';
import UserJobTitle from '../../models/UserJobTitle';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import shell from '../../app.shell';
import { show as showConfirm } from '../../modals/confirm';
import { show as showError } from '../../modals/error';
import { show as showNotification } from '../../modals/notification';
import style from './style.styl';
import template from './template.html';
import { data as user } from '../../data/userProfile';
import userLicensesCertifications from '../../data/userLicensesCertifications';
import { item as userListingItem } from '../../data/userListings';
import users from '../../data/users';

const ROUTE_NAME = 'listing-editor';

export default class ListingEditor extends Activity {

    static get template() { return template; }

    static get style() { return style; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.helpLink = '/help/relatedArticles/202034083-managing-your-marketplace-profile';
        this.navBar = Activity.createSubsectionNavBar('Your listings', {
            backLink: '/listings',
            helpLink: this.helpLink
        });
        this.title = ko.pureComputed(() => {
            const user = this.user();
            if (user) {
                const title = user.selectedJobTitle() && user.selectedJobTitle().title();
                return `Edit your ${title} listing`;
            }
            else {
                return 'Edit your listing';
            }
        });

        this.__defViewProperties();
        this.__defViewMethods();

        // DOM Event handler
        this.registerHandler({
            event: 'layoutUpdate',
            target: $(window),
            handler: () => this.refreshTs(new Date())
        });
    }

    __defViewProperties() {
        this.isLoading = ko.observable(false);
        this.user = ko.observable(null);
        this.jobTitleID = ko.observable(0);
        this.userJobTitle = ko.observable(null);
        this.userBadges = ko.observableArray([]);
        this.listingTitle = ko.observable();
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
        this.returnLinkGeneralActivity = ko.pureComputed(() => {
            const jobTitleID = this.user() && this.selectedJobTitle() && this.selectedJobTitle().jobTitleID();
            if (jobTitleID) {
                return `?mustReturn=listing-editor/${jobTitleID}&returnText=Edit listing`;
            }
            else {
                return '';
            }
        });
        /**
         * Generates the final path to link a jobTitleID based URL, adding parameters
         * for the 'return back' link so points to this activity with proper labeling.
         * @member {KnockoutComputed<string>}
         */
        this.returnLinkJobTitleActivity = ko.pureComputed(() => {
            const jobTitleID = this.user() && this.selectedJobTitle() && this.selectedJobTitle().jobTitleID();
            if (jobTitleID) {
                return `${jobTitleID}?mustReturn=listing-editor/${jobTitleID}&returnText=Edit listing`;
            }
            else {
                return '';
            }
        }, this);
         /// Related models information
         this.submittedUserLicensesCertifications = ko.observableArray([]);

         this.hasServicesOverview = ko.pureComputed(() => {
            var jobTitle = this.user() && this.user().selectedJobTitle();
            var hasIntro = jobTitle && jobTitle.hasIntro();
            var hasAttributes = jobTitle && jobTitle.serviceAttributes().hasAttributes();
            return hasIntro || hasAttributes;
        });
        this.selectedJobTitle = ko.pureComputed(() => this.user() && this.user().selectedJobTitle() || new PublicUserJobTitle());
        this.isToggleReady = ko.pureComputed(() => this.userJobTitle() && this.userJobTitle().isComplete());
        this.isActiveStatus = ko.pureComputed({
            read: () => {
                var j = this.userJobTitle();
                return j && j.statusID() === UserJobTitle.status.on || false;
            },
            write: (v) => {
                var status = this.userJobTitle() && this.userJobTitle().statusID();
                if (v === true && status === UserJobTitle.status.off) {
                    this.userJobTitle().statusID(UserJobTitle.status.on);
                    // Push change to back-end
                    userListingItem(this.jobTitleID()).reactivate()
                    .catch((error) => {
                        showError({
                            title: 'Error enabling your listing',
                            error
                        });
                    });
                }
                else if (v === false && status === UserJobTitle.status.on) {
                    this.userJobTitle().statusID(UserJobTitle.status.off);
                    // Push change to back-end
                    userListingItem(this.jobTitleID()).deactivate()
                    .catch((error) => {
                        showError({
                            title: 'Error disabling your listing',
                            error
                        });
                    });
                    // Per #1001, notify user about availability of bookMeNow button even with public marketplace profile
                    // disabled/hidden
                    showNotification({
                        message: 'Clients will no longer be able to find you in the marketplace. However, any "book me now" links you have posted will still be active.',
                        buttonText: 'Got it!'
                    });
                }
            }
        });
        this.statusLabel = ko.pureComputed(() => {
            var statusID = this.userJobTitle() && this.userJobTitle().statusID();
            switch (statusID) {
                case UserJobTitle.status.on:
                    return 'This listing is active';
                case UserJobTitle.status.off:
                    return 'This listing is inactive';
                //case UserJobTitle.status.incomplete:
                default:
                    return "You're almost there!";
            }
        });
        this.requiredAlertLinks = ko.pureComputed(() => {
            var userJobTitle = this.userJobTitle();
            var jobTitleID = userJobTitle && userJobTitle.jobTitleID();
            var requiredAlerts = (userJobTitle && userJobTitle.requiredAlerts()) || [];
            return requiredAlerts.map((profileAlert) => AlertLink.fromProfileAlert(profileAlert, { jobTitleID: jobTitleID }));
        });

         this.__defWorkPhotosMembers();
         this.__defAddressMembers();
         this.__defSocialLinksMembers();
    }

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
                ph.some((p, i) => {
                    if (i > DEFAULT_WORKPHOTOS_LIMIT - 1) {
                        return true;
                    }
                    firsts.push(p);
                });
                return firsts;
            }
        });
        this.viewMoreWorkPhotosLabel = ko.pureComputed(() => {
            var imgCount = this.user() && this.user().selectedJobTitle() && this.user().selectedJobTitle().workPhotos();
            imgCount = imgCount && imgCount.length || 0;
            if (this.isShowingAllPhotos() || imgCount === 0 || imgCount <= DEFAULT_WORKPHOTOS_LIMIT) {
                return '';
            }
            else {
                return 'View all ' + imgCount + ' images';
            }
        });
        this.viewAllPhotos = () => {
            this.isShowingAllPhotos(true);
        };
    }

    __defAddressMembers() {
        this.serviceAddresses = ko.pureComputed(() => {
            var u = this.user();
            var adds = u && u.selectedJobTitle() && u.selectedJobTitle().serviceAddresses();
            return adds || [];
        });
        this.changeJobTitle = (jobTitle, event) => {
            this.user().selectedJobTitleID(jobTitle.jobTitleID());
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
            this.listingTitle('Job Title');
        };
        this.deleteJobTitle = () => {
            var jid = this.jobTitleID();
            var jname = this.listingTitle();
            if (jid) {
                showConfirm({
                    title: 'Delete ' + jname + ' listing',
                    message: 'Are you sure you really want to delete your ' + jname +' listing?',
                    yes: 'Delete',
                    no: 'Keep'
                })
                .then(() => userListingItem(jid).delete())
                .then(() => shell.go('/listings'))
                .catch((error) => {
                    if (error) {
                        showError({
                            error,
                            title: 'Error while deleting your listing'
                        });
                    }
                });
            }
        };
        /**
         * Returns a URL to where to edit the badge assigned to the user, with a return
         * link to the listing editor.
         * @param {rest/UserBadge} userBadge record for a badge assigned to a user (AKA 'assertion' in OpenBadges naming)
         * @returns {string}
         */
        this.getBadgeEditURL = (userBadge) => {
            if (userBadge.createdBy !== 'user') return null;
            else return `/badge-edit/${userBadge.userBadgeID}?jobTitleID=${this.jobTitleID()}&mustReturn=listing-editor/${this.jobTitleID()}&returnText=${encodeURIComponent('Listing Editor')}`;
        };
        /**
         * Returns a URL to where to view details of the badge assigned to the user, with a return
         * link to the listing editor.
         * @param {OpenBadgesV2/Assertion} assertion data for an assertion
         * @returns {string}
         */
        this.getBadgeDetailsURL = (assertion) => `/badge-view/${encodeURIComponent(assertion.id)}?mustReturn=listing-editor/${this.jobTitleID()}&returnText=${encodeURIComponent('Listing Editor')}`;
    }

    loadData(jobTitleID) {
        this.reset();
        if (user.userID()) {
            this.isLoading(true);
            users.getUser(user.userID(), { includeFullJobTitleID: -1 })
            .then((data) => {
                var pu = new PublicUser(data);
                this.user(pu);
                if (!jobTitleID) {
                    return pu.jobProfile() && pu.jobProfile()[0] && pu.jobProfile()[0].jobTitleID();
                }
                else {
                    return jobTitleID;
                }
            })
            .then((jobTitleID) => {
                // For service professionals:
                if (jobTitleID) {
                    ////////////
                    // User Job Title
                    userListingItem(jobTitleID)
                    .onceLoaded()
                    .then((listing) => {
                        // Fill the job title record
                        this.listingTitle(listing.title);
                        this.userJobTitle(new UserJobTitle(listing));
                        // Load badges
                        return badgesByListing(listing.userListingID)
                        .onceLoaded()
                        .then(expandUserBadges)
                        .then(this.userBadges);
                    })
                    .catch((error) => {
                        showError({
                            title: 'There was an error loading your listing.',
                            error
                        });
                    });
                    ////////////
                    // Submitted Licenses
                    userLicensesCertifications.getList(jobTitleID)
                    .then((list) => {
                        // Save for use in the view
                        this.submittedUserLicensesCertifications(userLicensesCertifications.asModel(list));
                    })
                    .catch((error) => {
                        showError({
                            title: 'There was an error while loading.',
                            error
                        });
                    });
                    ////////////
                    // Active title
                    this.user().selectedJobTitleID(jobTitleID);
                }
            })
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
     * URL segments template: /{jobTitleID:int}
     * If not jobTitleID, the first one is returned
     * TODO: Is automatic jobTitleID still valid? wasn't buggy? Review and
     * clarify previous comment
     * @param {Object} state
     * @param {Object} state.route
     * @param {Array<string>} state.route.segments Contains per position:
     * - {number} segments[0] jobTitleID
     */
    show(state) {
        super.show(state);

        var params = state.route.segments;
        var jobTitleID = params[0] |0;
        this.loadData(jobTitleID);
        this.jobTitleID(jobTitleID);
        this.refreshTs(new Date());
    }
}

activities.register(ROUTE_NAME, ListingEditor);
