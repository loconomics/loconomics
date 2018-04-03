/**
 * Allows the user to add an badge.
 *
 * @module activities/badge-add
*/
import '../../kocomponents/badge/editor';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';
import { item as userListing } from '../../data/userListings';

const ROUTE_NAME = 'badge-add';

export default class BadgeAddActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;

        this.navBar = Activity.createSubsectionNavBar(null);
        this.defaultNavBarSettings = this.navBar.model.toPlainObject(true);

        /**
         * Creates a placeholder for the jobTitle ID to be
         * populated using the show(state) method below.
        */
        this.jobTitleID = ko.observable();

        /**
         * Creates a placeholder for the listing title populated with the ID
        */
        this.listingTitle = ko.observable();

        /**
         * Title uses a pureComputed to ensure the listingTitle is updated.
        */
        this.title = ko.pureComputed( () => 'Add badge(s) to ' + this.listingTitle() + ' listing');

        /**
         * After data being saved, notice and go back to the
         * job title's listing editor
         */
        this.onSaved = () => {
            app.successSave({
                link: '/listingEditor/' + this.jobTitleID()
            });
        };

        this.__setupNavbar();
    }

    __setupNavbar() {
        // Use listing title and link to ID when both available
        this.observeChanges(() => {
            const text = this.listingTitle();
            const id = this.jobTitleID();
            let settings = this.defaultNavBarSettings;
            if (text && id) {
                settings = Object.assign({}, settings, {
                    leftAction: {
                        text: `${text} Listing`,
                        link: `/listingEditor/${id}?mustReturn=listings&returnText=Listings`,
                        isShell: false
                    }
                });
            }
            this.navBar.model.updateWith(settings, true);
        });
    }

    /**
      * @param {Object} state
     */
    show(state) {
        super.show(state);

        /**
         * In the query, the jobTitleID so we can link the listing
         */
        this.jobTitleID(state.route.query.jobTitleID);

        const provider = userListing(this.jobTitleID());
        this.subscribeTo(provider.onData, (listing) => this.listingTitle(listing.title));
    }
}

activities.register(ROUTE_NAME, BadgeAddActivity);
