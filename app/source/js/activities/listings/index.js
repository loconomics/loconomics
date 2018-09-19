/**
 * Displays user listings (both at Loconomics and externally), to pick for
 * edition or add new ones, plus access to some common settings.
 *
 * @module activities/listings
 */

import '../../kocomponents/external-listing/list';
import '../../kocomponents/utilities/icon-dec.js';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserJobProfileViewModel from '../../viewmodels/UserJobProfile';
import UserType from '../../enums/UserType';
import template from './template.html';

const ROUTE_NAME = 'listings';

export default class ListingsActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.navBar = Activity.createSectionNavBar(null);
        this.title('Your Listings');

        this.viewModel = new UserJobProfileViewModel(app);

        this.viewModel.showMarketplaceInfo(true);
        this.viewModel.baseUrl('/listing-editor');
    }
}

activities.register(ROUTE_NAME, ListingsActivity);
