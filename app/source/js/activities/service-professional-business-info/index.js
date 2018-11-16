/**
 * ServiceProfessionalBusinessInfo
 *
 * @module activities/service-professional-business-info
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import ListingVM from '../../viewmodels/ListingVM';
import UserType from '../../enums/UserType';
import template from './template.html';

const ROUTE_NAME = 'service-professional-business-info';

export default class ServiceProfessionalBusinessInfo extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.helpLink = '/help/relatedArticles/201967756-telling-the-community-about-yourself';
        this.navBar = Activity.createSubsectionNavBar('Edit listing', {
            backLink: '/listing-editor',
            helpLink: this.helpLink
        });
        this.title = 'Your business info';

        // TODO: Refactor, this should not be implemented this way, picking members of a shared view model.
        const vm = new ListingVM(this.app);
        this.data = vm;
        this.save = vm.save.bind(vm);
    }

    show(state) {
        super.show(state);

        // Keep data updated:
        this.data.sync();
    }
}

activities.register(ROUTE_NAME, ServiceProfessionalBusinessInfo);
