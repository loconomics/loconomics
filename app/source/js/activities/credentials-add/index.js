/**
 * Shows a professional what external platforms we suggest
 * they list their services on based on the job titles
 * they've already created.
 *
 * @module activities/credentials-add
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';
import { item as userListing } from '../../data/userListings';

const ROUTE_NAME = 'credentials-add';

export default class CredentialsAddActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;

        this.navBar = Activity.createSubsectionNavBar('Listings', {
            backLink: '/listings'
        });

        this.jobTitleID = ko.observable();
        this.jobTitleID.subscribe((id) => {
            this.navBar.leftAction().link(`/listingEditor/${id}`);
            this.navBar.leftAction().text('Listing Editor');
        });

        this.listingTitle = ko.observable();

        /**
         * Title uses a pureComputed to ensure the platformName
         * is updated.
         */
        this.title = ko.pureComputed(() => 'Add ' + this.listingTitle() + ' credentials');

        /**
         * Dynamic URL for the 'add badge' link
         */
        this.addBadgeURL = ko.pureComputed(() => {
            const jobTitleID = this.jobTitleID();
            return `/badge-add?jobTitleID=${jobTitleID}&mustReturn=credentials-add/${jobTitleID}&returnText=${encodeURIComponent('Add Credentials')}`;
        });

        /**
         * Dynamic URL for the 'add education' link
         */
        this.addEducationURL = ko.pureComputed(() => {
            const jobTitleID = this.jobTitleID();
            return `/education?mustReturn=credentials-add/${jobTitleID}&returnText=${encodeURIComponent('Add Credentials')}`;
        });

        /**
         * Dynamic URL for the 'add license/certifiation' link
         */
        this.addCertificationURL = ko.pureComputed(() => {
            const jobTitleID = this.jobTitleID();
            return `/licensesCertifications/${jobTitleID}?mustReturn=credentials-add/${jobTitleID}&returnText=${encodeURIComponent('Add Credentials')}`;
        });
    }

    /**
     * @param {Object} state
     */
    show(state) {
        super.show(state);

        /**
         * The jobTitleID we are adding credentials, from the first URL segment
         */
        this.jobTitleID(state.route.segments[0]);

        const provider = userListing(this.jobTitleID());
        this.subscribeTo(provider.onData, (listing) => this.listingTitle(listing.title));
    }
}

activities.register(ROUTE_NAME, CredentialsAddActivity);
