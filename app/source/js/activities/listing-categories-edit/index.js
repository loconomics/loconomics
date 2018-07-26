/**
 * Let's a professional to edit the 'search categories' (AKA solutions) has
 * attached to a specific listing.
 *
 * @module activities/listing-categories-edit
 */

import '../../kocomponents/listing/solutions-editor';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';
import { item as userListing } from '../../data/userListings';

const ROUTE_NAME = 'listing-categories-edit';

export default class ListingCategoriesEditActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.navBar = Activity.createSubsectionNavBar('Listing Editor');

        /**
         * @member {KnockoutObservable<number>}
         */
        this.jobTitleID = ko.observable();
        /**
         * @member {KnockoutObservable<number>}
         */
        this.userListingID = ko.observable();
        /**
         * @member {KnockoutObservable<string>}
         */
        this.listingTitle = ko.observable('');

        /**
         * Title uses a pureComputed to ensure the platformName
         * is updated.
         */
        this.title = ko.pureComputed( () => 'Edit ' + this.listingTitle() + ' listing categories');
        /**
         * Automatic back link based on listing
         * @member {KnockoutComputed<string>}
         */
        this.navBackLink = ko.pureComputed(() => `/listingEditor/${this.jobTitleID()}`);
        // Connect back link and listingTitle to the navbar
        this.navBackLink.subscribe(this.navBar.leftAction().link);
        this.navBackLink.subscribe(() => this.navBar.leftAction().isShell(false));
        this.listingTitle.subscribe(this.navBar.leftAction().text);

        /**
         * After data being saved, notice and go back
         */
        this.onSaved = () => {
            app.successSave();
        };
    }

    /**
     * The route accepted is like `/${jobTitleID}`
     * @param {Object} state Parameter for the listing to load
     */
    show(state) {
        super.show(state);

        /**
         * The jobTitleID from the first URL segment
         */
        this.jobTitleID(state.route.segments[0]);

        // If no ID given, we cannot load anything, go back
        if (!state.route.segments[0]) {
            this.app.shell.goBack();
        }

        // Pull listing title and jobTitleID from the listing data
        const provider = userListing(this.jobTitleID());
        this.subscribeTo(provider.onData, (listing) => {
            this.listingTitle(listing.title);
            this.userListingID(listing.userListingID);
        });
    }
}

activities.register(ROUTE_NAME, ListingCategoriesEditActivity);
