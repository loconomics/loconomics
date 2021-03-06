/**
 * Edit the user contact information that is public through is profile address
 * or communication with other users.
 *
 * @module activities/public-contact-info
 */

import '../../kocomponents/profile/contact-info-editor';
import '../../kocomponents/utilities/icon-dec';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import onboarding from '../../data/onboarding';
import template from './template.html';
import { data as user } from '../../data/userProfile';

const ROUTE_NAME = 'public-contact-info';

export default class PublicContactInfoActivity extends Activity {

    static get template() { return template; }

    /**
     * @param {jQuery} $activity
     * @param {App} app
     */
    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;

        var backLink = user.isServiceProfessional() ? '/listing-editor' : '/user-profile';
        this.helpLink = '/help/relatedArticles/201967756-telling-the-community-about-yourself';
        this.navBar = Activity.createSubsectionNavBar('Edit listing', {
            backLink: backLink,
            helpLink: this.helpLink
        });
        this.title = 'Your contact info';

        this.isInOnboarding = onboarding.inProgress;

        this.onSave = () => {
            if (onboarding.inProgress()) {
                onboarding.goNext();
            }
            else {
                app.successSave();
            }
        };
    }

    /**
     * This activity can be used on onboarding so keep navbar connected to that
     * state when required
     * @param {Object} state
     */
    show(state) {
        super.show(state);

        onboarding.updateNavBar(this.navBar);
    }
}

activities.register(ROUTE_NAME, PublicContactInfoActivity);
