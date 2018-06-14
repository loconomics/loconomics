/**
 * Edit the user public picture, displayed at profile and/or listing areas,
 * at communications or attached as identification at some items related
 * with them (like in a booking information card or messages).
 *
 * @module activities/public-profile-picture
 */

import '../../kocomponents/profile/picture-editor';
import '../../kocomponents/utilities/icon-dec';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import template from './template.html';
import { data as user } from '../../data/userProfile';

const ROUTE_NAME = 'public-contact-info';

export default class PublicProfilePictureActivity extends Activity {

    static get template() { return template; }

    /**
     * @param {jQuery} $activity
     * @param {App} app
     */
    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;

        var backLink = user.isServiceProfessional() ? '/listingEditor' : '/userProfile';
        this.helpLink = '/help/relatedArticles/201967756-telling-the-community-about-yourself';
        this.navBar = Activity.createSubsectionNavBar('Edit listing', {
            backLink: backLink,
            helpLink: this.helpLink
        });
        this.title = 'Your profile picture';

        this.onSave = () => {
            app.successSave();
        };
    }
}

activities.register(ROUTE_NAME, PublicProfilePictureActivity);
