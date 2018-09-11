/**
 * LicensesCertifications
 *
 * @module activities/licenses-certifications
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import $ from 'jquery';
import Activity from '../../components/Activity';
import UserJobProfile from '../../viewmodels/UserJobProfile';
import UserType from '../../enums/UserType';
import { item as getUserListing } from '../../data/userListings';
import jobTitleLicenses from '../../data/jobTitleLicenses';
import ko from 'knockout';
import onboarding from '../../data/onboarding';
import shell from '../../app.shell';
import { show as showError } from '../../modals/error';
import template from './template.html';
import userLicensesCertifications from '../../data/userLicensesCertifications';

const ROUTE_NAME = 'licenses-certifications';
const DEFAULT_BACK_LINK = '/listingEditor';
const DEFAULT_BACK_TEXT = 'Back';

export default class LicensesCertifications extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.helpLink = '/help/relatedArticles/201967966-adding-credentials';
        this.navBar = Activity.createSubsectionNavBar(DEFAULT_BACK_TEXT, {
            backLink: DEFAULT_BACK_LINK,
            helpLink: this.helpLink
        });
        this.defaultNavBar = this.navBar.model.toPlainObject(true);
        this.title = 'Professional credentials';

        this.__defViewProperties();
        this.__defViewMethods();
        this.__connectData();
    }

    __defViewProperties() {
        this.isInOnboarding = onboarding.inProgress;
        this.jobTitleID = ko.observable(0);
        this.submittedUserLicensesCertifications = ko.observableArray([]);
        //is an object that happens to have arrays
        this.jobTitleApplicableLicences = ko.observable(null);
        this.listingTitle = ko.observable('Job Title');

        this.isSyncing = userLicensesCertifications.state.isSyncing();
        this.isLoading = userLicensesCertifications.state.isLoading();

        this.jobTitles = new UserJobProfile(this.app);
        this.jobTitles.baseUrl('/licenses-certifications');

        /**
         * Special license ID that indicates a required license
         * @const {boolean}
         */
        this.REQUIRED_LICENSE_SPECIAL_ID = -1;
        /**
         * Special license ID that indicates an optional license
         * @const {boolean}
         */
        this.OPTIONAL_LICENSE_SPECIAL_ID = 0;

        /**
         * Whether there are required licenses for this user and job title.
         * @member {KnockoutObservable<boolean>}
         */
        this.hasRequiredLicenses = ko.pureComputed(() => {
            var applicable = this.jobTitleApplicableLicences();
            if (applicable && applicable.country && applicable.country()) {
                return !!applicable.country().some((item) => item.licenseCertificationID() === this.REQUIRED_LICENSE_SPECIAL_ID);
            }
            else {
                return false;
            }
        });

        /**
         * Whether there are explicitly optional licenses for this user and job title.
         * NOTE: is not enough to check the opposite of hasRequiredLicenses because that one
         * is false too when no records, and a explicit record for 'optional' must exist.
         * @member {KnockoutObservable<boolean>}
         */
        this.hasOptionalLicenses = ko.pureComputed(() => {
            var applicable = this.jobTitleApplicableLicences();
            if (applicable && applicable.country && applicable.country()) {
                return !!applicable.country().some((item) => item.licenseCertificationID() === this.OPTIONAL_LICENSE_SPECIAL_ID);
            }
            else {
                return false;
            }
        });

        this.onboardingNextReady = ko.computed(() => {
            if (!onboarding.inProgress()) return false;
            var groups = this.jobTitleApplicableLicences();
            if (!groups) return false;

            //If at some point the user credential status need to be checked, this
            // utility can be used (lines commented inside the other function too
            //var userCredentials = this.submittedUserLicensesCertifications();
            /*var findUserCredential = function(credentialID) {
                var found = null;
                userCredentials.some(function(uc) {
                    if (uc.licenseCertificationID() == credentialID) {
                        found = uc;
                        // stop loop
                        return true;
                    }
                });
                return found;
            };*/
            var hasAllRequiredOfGroup = function(group) {
                if (!group || !group.length) return true;
                var allAccomplished = !group.some(function(credential) {
                    // IMPORTANT: The credential record holds a special field, 'submitted',
                    // that tell us already if the userCredential for that was submitted and then pass
                    // the requirement, so we do not need to search and check the userCredential.
                    // Still, sample code was wrote for that if in a future something more like the status
                    // needs to be checked (but the status, initially -in the onboarding- will be not-reviewed)
                    /*if (credential.required()) {
                        var userCredential = findUserCredential(credential.licenseCertificationID());
                        return (userCredential && userCredential.statusID() === ???);
                    }*/

                    if (credential.required()) {
                        // NOTE: It returns the negated result, that means that when a required credential
                        // is not fullfilled, returning true we stop immediately the loop and know the requirements
                        // are not accomplished.
                        return !credential.submitted();
                    }
                });
                return allAccomplished;
            };

            return (
                hasAllRequiredOfGroup(groups.municipality()) &&
                hasAllRequiredOfGroup(groups.county()) &&
                hasAllRequiredOfGroup(groups.stateProvince()) &&
                hasAllRequiredOfGroup(groups.country())
            );
        });
    }

    __defViewMethods() {
        this.addNew = (item) => {
            var url = '#!licensesCertificationsForm/' + this.jobTitleID() + '/0?licenseCertificationID=' + item.licenseCertificationID();
            var cancelUrl = shell.currentRoute.url;
            var request = $.extend({}, this.requestData, {
                cancelLink: cancelUrl
            });
            shell.go(url, request);
        };

        this.selectItem = (item) => {
            var url = '/licensesCertificationsForm/' + this.jobTitleID() + '/' +
                item.userLicenseCertificationID() + '?mustReturn=' +
                encodeURIComponent(shell.currentRoute.url) +
                '&returnText=' + encodeURIComponent('Licenses/certifications');
            shell.go(url, this.requestData);
        };

        this.goNext = () => {
            if (onboarding.inProgress()) {
                // Ensure we keep the same jobTitleID in next steps as here:
                onboarding.selectedJobTitleID(this.jobTitleID());
                onboarding.goNext();
            }
        };
    }

    __connectData() {
        // On changing jobTitleID:
        // - user licenses
        // - jobTitle/listing required licenses
        // - update navbar
        this.subscribeTo(this.jobTitleID, (jobTitleID) => {
            if (jobTitleID) {
                // Get data for the Job title ID
                userLicensesCertifications.getList(jobTitleID)
                .then((list) => {
                    // Save for use in the view
                    this.submittedUserLicensesCertifications(userLicensesCertifications.asModel(list));
                })
                .catch((error) => {
                    showError({
                        title: 'Unable to load submitted licenses and credentials.',
                        error
                    });
                });

                // Get required licenses for the Job title ID - an object, not a list
                jobTitleLicenses.getItem(jobTitleID)
                .then((item) => {
                    // Save for use in the view
                    this.jobTitleApplicableLicences(item);
                    // SPECIAL CASE:
                    // If we are in onboarding and there are no required licenses applicable to the job title,
                    // we automatically jump to next step (we just check if the condition to continue is matched)
                    if (this.onboardingNextReady()) {
                        this.goNext();
                    }
                })
                .catch((error) => {
                    showError({
                        title: 'Unable to load license requirements.',
                        error
                    });
                });
            }
            else {
                this.submittedUserLicensesCertifications([]);
                this.jobTitleApplicableLicences(null);
                this.updateNavBarState();
            }
        });
    }

    useJobTitleInNavBar() {
        // First, reset
        this.navBar.model.updateWith(this.defaultNavBar, true);

        // Apply job title name and link
        var text = this.listingTitle() || DEFAULT_BACK_TEXT;
        var id = this.jobTitleID();
        var link = id ? DEFAULT_BACK_LINK + '/' + id : DEFAULT_BACK_LINK;
        // Use job title name and ID for back link
        this.navBar.leftAction().model.updateWith({
            text: text,
            link: link
        });
    }

    updateNavBarState() {
        // Onboarding takes precence, then mustReturn, then default
        // navbar with jobtitle
        var done = onboarding.updateNavBar(this.navBar);
        if (!done) {
            done = this.app.applyNavbarMustReturn(this.requestData);
        }
        if (!done) {
            this.useJobTitleInNavBar();
        }
    }

    show(state) {
        super.show(state);

        this.updateNavBarState();

        var params = state.route.segments;
        var jobTitleID = params[0] |0;

        // Resets
        this.jobTitleID(jobTitleID);
        this.listingTitle('Job Title');
        // Data for listing
        if (jobTitleID) {
            const listingDataProvider = getUserListing(jobTitleID);
            this.subscribeTo(listingDataProvider.onData, (listing) => {
                this.listingTitle(listing.title);
            });
            this.subscribeTo(listingDataProvider.onDataError, (error) => {
                showError({
                    title: 'Unable to load listing details.',
                    error
                });
            });
        }
        else {
            // Load titles to display for selection
            this.jobTitles.sync();
        }
    }
}

activities.register(ROUTE_NAME, LicensesCertifications);
