/**
 * Shows the user the information about the listing they 
 * created on an external platform.
 * 
 * @module activities/external-listing-view
 *
 */

import '../../kocomponents/external-listing/viewer';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = 'external-listing-view';

export default class ExternalListingViewActivity extends Activity {

    static get template() { return template; }
 
    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.navBar = Activity.createSectionNavBar(null);
        this.navBar.rightAction(null);

        // Creates a placeholder for an "out" parameter to be populated by the component.
        this.platformName = ko.observable('');
        
        // Creates a placeholder for the external listing ID to be populated using the show(state) method below.
        this.externalListingID = ko.observable();
        
        // Title uses a pureComputed to ensure the platformName is updated.
        this.title = ko.pureComputed( () => 'My ' + this.platformName() + ' listing');
    }

    /**
     * @param {Object} state
     */
    show(state) {
        super.show(state);
        var params = state.route && state.route.segments;
        // externalListingID is the first segment in the activity URL 
        this.externalListingID(params[0] |0);
    }
}

activities.register(ROUTE_NAME, ExternalListingViewActivity);
