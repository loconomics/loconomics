/**
 * Account activity
 *
 * @module activities/account
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import '../../kocomponents/utilities/icon-dec';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import paymentPlans from '../../data/paymentPlans';
import template from './template.html';
import { data as user } from '../../data/userProfile';
import userPaymentPlan from '../../data/userPaymentPlan';

const ROUTE_NAME = 'account';

export default class AccountActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.navBar = Activity.createSectionNavBar(null);
        this.title = 'Your Account';

        this.isServiceProfessional = user.isServiceProfessional;
        this.activeUserPaymentPlan = userPaymentPlan.data;
        this.activePaymentPlan = ko.pureComputed(() => {
            var id = this.activeUserPaymentPlan.paymentPlan();
            if (id) {
                return paymentPlans.getObservableItem(id)();
            }
            else {
                return null;
            }
        });
    }

    show(state) {
        super.show(state);

        // Request to sync plans, just in case there are remote changes
        paymentPlans.sync();
        // Load active plan, if any
        userPaymentPlan.sync();
    }
}

activities.register(ROUTE_NAME, AccountActivity);
