/**
 * Manages users under a partnership, available for partner 'admin' users only.
 *
 * @module activities/partner-users
 */

import '../../kocomponents/partner/users-list';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import { accessControl } from '../../utils/partnerAdminAccessControl';
import ko from 'knockout';
import { listByPartner } from '../../data/adminPartnerUsers';
import { show as showError } from '../../modals/error';
import template from './template.html';

const ROUTE_NAME = 'partner-users';

export default class PartnerUsersActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.accessControl = accessControl;
        this.navBar = Activity.createSectionNavBar(null);
        this.navBar.rightAction(null);
        this.title = 'Manage users';

        this.usersList = ko.observableArray();
        this.selectedClient = ko.observable();
    }

    __connectData() {
        // IMPORTANT: Prefixed the unique partner available right now
        const list = listByPartner('ccc');
        this.subscribeTo(list.onData, this.usersList);
        this.subscribeTo(list.onDataError, (error) => {
            showError({
                title: 'There was an error loading the users list',
                error
            });
        });
    }

    show(state) {
        super.show(state);

        this.__connectData();
    }
}

activities.register(ROUTE_NAME, PartnerUsersActivity);
