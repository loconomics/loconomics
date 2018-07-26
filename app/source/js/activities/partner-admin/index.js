/**
 * Index of administrative tasks available for Partner administrator users.
 *
 * @module activities/partner-admin
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import { accessControl } from '../../utils/partnerAdminAccessControl';
import template from './template.html';

const ROUTE_NAME = 'partner-admin';

const REQUEST_REPORT_SUBJECT = `Request Custom Report`;
const REQUEST_REPORT_MESSAGE = `Please describe the data you're looking for, and we'll create a report for you.`;

export default class PartnerAdminActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.accessControl = accessControl;
        this.navBar = Activity.createSectionNavBar(null);
        this.navBar.rightAction(null);
        this.title = 'Admin';

        this.requestReportLink = `/contactForm?subject=${encodeURIComponent(REQUEST_REPORT_SUBJECT)}&message=${encodeURIComponent(REQUEST_REPORT_MESSAGE)}`;
    }
}

activities.register(ROUTE_NAME, PartnerAdminActivity);
