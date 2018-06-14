/**
 * Allows a professional to add earnings they recieve that
 * weren't received through a Loconomics booking, including
 * external platform earnings.
 *
 * @module activities/earnings-add
 *
 */

import '../../kocomponents/earnings/editor';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = 'earnings-add';

export default class EarningsAddActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.navBar = Activity.createSubsectionNavBar('Earnings', {
            backLink: '/earnings'
        });
        this.title = 'Add earnings';
        /**
         * Creates a placeholder for the external listing ID
         * to be populated using the show(state) method below.
         */
        this.userExternalListingID = ko.observable(null);

        /**
         * After data being saved, notice and go back
         */
        this.onSaved = () => {
            app.successSave();
        };
    }

    show(state) {
        super.show(state);
        var params = state.route && state.route.segments;
        /**
         * userExternalListingID as the first segment in the activity URL,
         * allowing to preset that value in the new earnings entry.
         */
        this.userExternalListingID(params[0] |0);
    }
}

activities.register(ROUTE_NAME, EarningsAddActivity);
