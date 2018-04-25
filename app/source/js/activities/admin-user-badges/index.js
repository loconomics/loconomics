/**
 * Let's administrators to manage assigned user badges.
 *
 * @module activities/admin-user-badges
 */

import '../../utils/activeViewBindingHandler';
import '../../kocomponents/badge/admin-editor';
import * as activities from '../index';
import { Route, RouteMatcher } from '../../utils/Router';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import { getBadges } from '../../data/adminUsers';
import ko from 'knockout';
import shell from '../../app.shell';
import { show as showError } from '../../modals/error';
import template from './template.html';

const ROUTE_NAME = 'admin-user-badges';

export default class AdminUserBadgesActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.admin;
        this.navBar = Activity.createSubsectionNavBar('Admin', {
            backLink: '/admin'
        });
        this.title = 'Manage user badges';

        this.userID = ko.observable();
        this.loadedUserID = ko.observable();
        this.userBadgeID = ko.observable();
        this.isLoading = ko.observable(false);

        this.routes = {
            index: new Route('/'),
            list: new Route('/:userID'),
            edit: new Route('/:userID/:userBadgeID'),
        };

        this.view = ko.pureComputed(() => {
            if (this.userBadgeID()) {
                return 'edit';
            }
            else if (this.isLoading() || this.loadedUserID()) {
                return 'list';
            }
            else {
                return 'index';
            }
        });

        this.userBadges = ko.observableArray();

        /**
         * Returns a URL to where to edit the badge assigned to the user.
         * @param {rest/UserBadge} userBadge record for a badge assigned to a user (AKA 'assertion' in OpenBadges naming)
         * @returns {string}
         */
        this.getBadgeEditURL = (userBadge) => `/admin-user-badges/${this.userID()}/${userBadge.userBadgeID}`;

        /**
         * Returns a URL to where to view details of the badge assigned to the user, with a return
         * link to the listing editor.
         * @param {OpenBadgesV2/Assertion} assertion data for an assertion
         * @returns {string}
         */
        this.getBadgeDetailsURL = (assertion) => `/badge-view/${encodeURIComponent(assertion.id)}?mustReturn=admin-user-badges/${this.userID()}&returnText=${encodeURIComponent('Admin user badges')}`;
    }

    __loadUserBadges(userID) {
        this.isLoading(true);
        return getBadges(userID)
        .then(this.userBadges)
        .then(() => this.loadedUserID(userID))
        .catch((error) => {
            showError({
                title: 'Error loading badges',
                error
            });
        })
        .then(() => this.isLoading(false));
    }

    parseRoute(url) {
        var paramsDefaults = {
            userID: null,
            userBadgeID: null
        };
        var matcher = new RouteMatcher([
            this.routes.index,
            this.routes.list,
            this.routes.edit,
        ], paramsDefaults);

        return matcher.match(url) || paramsDefaults;
    }

    replaceUrlAs(routeName, values) {
        const url = '/' + this.requestData.route.name + this.routes[routeName].reverse(values);
        shell.replaceState(undefined, undefined, url);
    }

    go(routeName, values) {
        const url = '/' + this.requestData.route.name + this.routes[routeName].reverse(values);
        shell.go(url);
    }

    /**
     * @param {Object} state
     */
    show(state) {
        super.show(state);

        const params = this.parseRoute(state.route.path);
        this.userID(params.userID);
        this.userBadgeID(params.userBadgeID);
        if (this.loadedUserID() !== params.userID) {
            this.loadedUserID(null);
            if (params.userID && !params.userBadgeID) {
                this.__loadUserBadges(params.userID);
            }
        }
    }

    /**
     * Redirect back to the list mode with already loaded data
     */
    backToList() {
        this.go('list', { userID: this.userID() });
    }

    /**
     * Update list with saved data and show list
     * @param {rest/UserBadge} badgeData Copy of the badge added/edited
     */
    onSaved(badgeData) {
        const old = this.userBadges().find((badge) => badge.userBadgeID === badgeData.userBadgeID);
        if (old) {
            this.userBadges.replace(old, badgeData);
        }
        this.backToList();
    }

    /**
     * Update list with removed data and show list
     * @param {rest/UserBadge} badgeData Copy of the badge deleted
     */
    onDeleted(badgeData) {
        this.userBadges.remove(((badge) => badge.userBadgeID === badgeData.userBadgeID));
        this.backToList();
    }

    /**
     * Load the list of user badges for the selected user
     */
    load() {
        this.replaceUrlAs('list', { userID: this.userID() });
        this.__loadUserBadges(this.userID());
    }

}

activities.register(ROUTE_NAME, AdminUserBadgesActivity);
