/**
 * Allows the user to add an external listing.
 *
 * @module activities/external-listing-add
*/
import '../../kocomponents/external-listing/editor';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = 'external-listing-add';

export default class ExternalListingAddActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;

        this.navBar = Activity.createSectionNavBar(null);
        this.navBar.rightAction(null);
        // ASKIAGO this.externalListing.PlatformName 
        this.title = 'Add ' + '99 Designs' + ' listing';
        this.platformID = ko.observable();
    }

    /*
     * Document platformID
     * @param {Object} state
     */
    show(state) {
        super.show(state);
        // Check other examples for some code using 'state'
        var params = state.route && state.route.segments;
        this.platformID(params[0] || 0);
    }
}

activities.register(ROUTE_NAME, ExternalListingAddActivity);
