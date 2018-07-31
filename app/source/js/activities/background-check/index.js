/**
 * backgroundCheck activity
 *
 * @module activities/background-check
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import Model from '../../models/Model';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';

const ROUTE_NAME = 'background-check';

export default class BackgroundCheckActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.navBar = Activity.createSubsectionNavBar('Marketplace Profile', {
            backLink: '/listings'
        });
        this.title(' Your background checks');

        //this.isSyncing = backgroundCheck.state.isSyncing;
        this.isSyncing = ko.observable(false);
        this.isLoading = ko.observable(false);
        this.isSaving = ko.observable(false);

        this.list = ko.observableArray(testdata());
    }
}

activities.register(ROUTE_NAME, BackgroundCheckActivity);

/// Auxiliar inlined code
// IMPORTANT Background Check uses verification statuses
var Verification = function() {};
Verification.status = {
    confirmed: 1,
    pending: 2,
    revoked: 3,
    obsolete: 4
};

function testdata() {

    var verA = new BackgroundCheck({
        name: 'Database Search'
    });
    var verB = new BackgroundCheck({
        name: 'Basic Criminal'
    });
    var verC = new BackgroundCheck({
        name: 'Risk Adverse'
    });
    var verD = new BackgroundCheck({
        name: 'Healthcare Check'
    });

    return [
        new UserBackgroundCheck({
            statusID: Verification.status.confirmed,
            lastVerifiedDate: new Date(2015, 1, 12, 10, 23, 32),
            backgroundCheck: verA
        }),
        new UserBackgroundCheck({
            statusID: Verification.status.revoked,
            lastVerifiedDate: new Date(2015, 5, 20, 16, 4, 0),
            backgroundCheck: verB
        }),
        new UserBackgroundCheck({
            statusID: Verification.status.pending,
            lastVerifiedDate: new Date(2014, 11, 30, 19, 54, 4),
            backgroundCheck: verC
        }),
        new UserBackgroundCheck({
            statusID: Verification.status.obsolete,
            lastVerifiedDate: new Date(2014, 11, 30, 19, 54, 4),
            backgroundCheck: verD
        })
    ];
}

// TODO Incomplete Model for UI mockup
function UserBackgroundCheck(values) {
    Model(this);

    this.model.defProperties({
        statusID: 0,
        lastVerifiedDate: null,
        backgroundCheck: {
            Model: BackgroundCheck
        }
    }, values);

    // Same as in UserVerifications
    this.statusText = ko.pureComputed(function() {
        // L18N
        var statusTextsenUS = {
            'verification.status.confirmed': 'Confirmed',
            'verification.status.pending': 'Pending',
            'verification.status.revoked': 'Revoked',
            'verification.status.obsolete': 'Obsolete'
        };
        var statusCode = enumGetName(this.statusID(), Verification.status);
        return statusTextsenUS['verification.status.' + statusCode];
    }, this);

    /**
        Check if verification has a given status by name
    **/
    this.isStatus = function (statusName) {
        var id = this.statusID();
        return Verification.status[statusName] === id;
    }.bind(this);
}
function BackgroundCheck(values) {
    Model(this);

    this.model.defProperties({
        name: ''
    }, values);
}

// Become shared util; it is on Verifications too:
function enumGetName(value, enumList) {
    var found = null;
    Object.keys(enumList).some(function(k) {
        if (enumList[k] === value) {
            found = k;
            return true;
        }
    });
    return found;
}
