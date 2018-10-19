/**
 * PublicProfilePicture
 *
 * @module activities/public-profile-picture
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import ProfilePictureBioVM from '../../viewmodels/ProfilePictureBioVM';
import UserType from '../../enums/UserType';
import template from './template.html';

const ROUTE_NAME = 'public-profile-picture';

export default class PublicProfilePicture extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.helpLink = '/help/relatedArticles/201967756-telling-the-community-about-yourself';
        this.navBar = Activity.createSubsectionNavBar('Edit listing', {
            backLink: '/listing-editor',
            helpLink: this.helpLink
        });
        this.title = 'Your profile picture';

        // TODO: Refactor, this should not be implemented this way, picking members of a shared view model.
        this.profilePicture = new ProfilePictureBioVM(app);
        this.sync = this.profilePicture.sync.bind(this.profilePicture);
        this.save = this.profilePicture.save.bind(this.profilePicture);
    }

    show(state) {
        super.show(state);

        // Keep data updated:
        this.sync();
    }
}

activities.register(ROUTE_NAME, PublicProfilePicture);
