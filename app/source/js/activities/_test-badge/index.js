/**
 * Testing activity '_test-badge' to manually try badge components and visualization,
 * with dummy data.
 *
 * IMPORTANT: Any activity starting with underscore must not being published.
 */
'use strict';

import '../../kocomponents/badge/view';
import '../../kocomponents/badge/viewer';
import * as activities from '../index';
import Activity from '../../components/Activity';
import template from './template.html';

const ROUTE_NAME = '_test-badge';

const dummyData =
[
  {
    'userBadgeID': 2,
    'solutionID': 275,
    'jobTitleID': 106,
    'badgeURL': 'https://api.badgr.io/public/assertions/ZwxV7sqTTqa-r_vK51VsdA.json?v=2_0',
    'type': 'badge',
    'createdBy': 'user'
  },
  {
    'userBadgeID': 3,
    'solutionID': 275,
    'jobTitleID': 106,
    'badgeURL': 'https://api.badgr.io/public/assertions/ZwxV7sqTTqa-r_vK51VsdA.json?v=2_0',
    'type': 'badge',
    'createdBy': 'user'
  },
  {
    'userBadgeID': 4,
    'solutionID': 275,
    'jobTitleID': 106,
    'badgeURL': 'https://api.badgr.io/public/assertions/ZwxV7sqTTqa-r_vK51VsdA.json?v=2_0',
    'type': 'badge',
    'createdBy': 'user'
  },
  {
    'userBadgeID': 5,
    'solutionID': 275,
    'jobTitleID': 106,
    'badgeURL': 'https://api.badgr.io/public/assertions/ZwxV7sqTTqa-r_vK51VsdA.json?v=2_0',
    'type': 'badge',
    'createdBy': 'staff'
  }
];

export default class _TestBadgeActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);
        this.accessLevel = null;
        this.title = 'Testing badges';

        this.userBadges = dummyData;
    }

    /**
     * Returns a URL to where to edit the badge assigned to the user, with a return
     * link to the listing editor.
     * @param {rest/UserBadge} userBadge record for a badge assigned to a user (AKA 'assertion' in OpenBadges naming)
     * @returns {string}
     */
    getBadgeEditURL(userBadge) {
        return `/badge-edit/${userBadge.userBadgeID}?mustReturn=listingEditor/${userBadge.jobTitleID}&returnText=${encodeURIComponent('Listing Editor')}`;
    }

    /**
     * Returns a URL to where to view details of the badge assigned to the user, with a return
     * link to the listing editor.
     * @param {rest/UserBadge} userBadge record for a badge assigned to a user (AKA 'assertion' in OpenBadges naming)
     * @returns {string}
     */
    getBadgeDetailsURL(userBadge) {
        return `/badge-view/${userBadge.userBadgeID}?mustReturn=listingEditor/${userBadge.jobTitleID}&returnText=${encodeURIComponent('Listing Editor')}`;
    }
}

activities.register(ROUTE_NAME, _TestBadgeActivity);
