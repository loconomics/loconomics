/**
 * UserFeePayments
 *
 * @module activities/user-fee-payments
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import ko from 'knockout';
import { show as showError } from '../../modals/error';
import template from './template.html';
import userFeePayments from '../../data/userFeePayments';

const ROUTE_NAME = 'user-fee-payments';

export default class UserFeePayments extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = null;
        this.helpLink = '/help/relatedArticles/201964153-how-owner-user-fees-work';
        this.navBar = Activity.createSubsectionNavBar('Account', {
            backLink: '/account',
            helpLink: this.helpLink
        });
        this.title = 'Payment history';

        this.isLoading = userFeePayments.state.isLoading;
        this.isSyncing = userFeePayments.state.isSyncing;
        this.payments = ko.observableArray([]);
    }

    show(state) {
        super.show(state);

        // Payments
        userFeePayments
        .getList()
        .then((threads) => {
            this.payments(threads());
        })
        .catch((error) => {
            showError({
                title: 'Error loading payments',
                error
            });
        });
    }
}

activities.register(ROUTE_NAME, UserFeePayments);
