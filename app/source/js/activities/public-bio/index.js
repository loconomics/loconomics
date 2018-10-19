/**
 * PublicBio
 *
 * @module activities/public-bio
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import ProfilePictureBioVM from '../../viewmodels/ProfilePictureBioVM';
import UserType from '../../enums/UserType';
import template from './template.html';

const ROUTE_NAME = 'public-bio';

export default class PublicBio extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.helpLink = '/help/relatedArticles/201967756-telling-the-community-about-yourself';
        this.navBar = Activity.createSubsectionNavBar('Edit listing', {
            backLink: '/listing-editor',
            helpLink: this.helpLink
        });
        this.title = 'Your public bio';

        // TODO: Refactor, this should not be implemented this way, picking members of a shared view model.
        const bioVM = new ProfilePictureBioVM(this.app);
        this.sync = bioVM.sync.bind(bioVM);
        this.save = bioVM.save.bind(bioVM);
        this.isServiceProfessional = bioVM.user.isServiceProfessional;
        this.isLocked = bioVM.isLocked;
        this.profile = bioVM.profile;
        this.submitText = bioVM.submitText;
    }

    show(state) {
        super.show(state);

        // Keep data updated:
        this.sync();
    }
}

activities.register(ROUTE_NAME, PublicBio);
