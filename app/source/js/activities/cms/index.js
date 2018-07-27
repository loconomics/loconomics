/**
 * CMS Activity: Client Management System index
 *
 * @module activities/cms
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import { list as clientsList } from '../../data/clients';
import ko from 'knockout';
import numeral from 'numeral';
import { show as showError } from'../../modals/error';
import template from './template.html';

const ROUTE_NAME = 'cms';

export default class CmsActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.navBar = Activity.createSectionNavBar(null);
        this.title = 'Client manager';

        this.totalClients = ko.observable(0);

        this.clientsCount = ko.pureComputed(() => {
            var cs = this.totalClients();
            if (cs <= 0)
                return '0 clients';
            else if (cs === 1)
                return '1 client';
            else
                return numeral(cs |0).format('0,0') + ' clients';
        });
    }

    show(state) {
        super.show(state);

        // Keep data updated:
        this.subscribeTo(clientsList.onData, (data) => {
            this.viewModel.totalClients(data.length);
        });
        this.subscribeTo(clientsList.onDataError, (err) => {
            showError({
                title: 'Error loading the clients list',
                error: err
            });
        });
    }
}

activities.register(ROUTE_NAME, CmsActivity);
