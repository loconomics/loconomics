/**
 * Professionals Payout Preference activity.
 *
 * Through the main component, preference-view, let's user to pick a payout
 * option and set it up, or change it later (the settings and the selected
 * option) displaying the active one.
 *
 * @module activities/payout-preference
 */

import '../../kocomponents/payout/preference-view';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import template from './template.html';

const ROUTE_NAME = 'payout-preference';

export default class PayoutPreference extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.helpLink = '/help/relatedArticles/201967096-accepting-and-receiving-payments';
        this.navBar = Activity.createSubsectionNavBar('Account', {
            backLink: '/account',
            helpLink: this.helpLink
        });
        this.title = 'Payout preferences';
        this.onSaved = () => this.app.successSave();
    }
}

activities.register(ROUTE_NAME, PayoutPreference);
