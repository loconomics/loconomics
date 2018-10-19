/**
 * Verifications
 *
 * @module activities/verifications
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import { show as showError } from '../../modals/error';
import { show as showNotification } from '../../modals/notification';
import template from './template.html';
import { data as user } from '../../data/userProfile';
import userVerifications from '../../data/userVerifications';

const ROUTE_NAME = 'verifications';

export default class Verifications extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.helpLink = '/help/relatedArticles/201967776-adding-verifications-to-your-profile';
        this.navBar = Activity.createSubsectionNavBar('Marketplace profile', {
            backLink: '/listings',
            helpLink: this.helpLink
        });
        this.title = 'Verifications';

        this.__defViewProperties();
        this.__connectHandlers();
    }

    __defViewProperties() {
        this.isSyncing = userVerifications.state.isSyncing;
        this.isLoading = userVerifications.state.isLoading;
        this.isSaving = userVerifications.state.isSaving;
        this.userVerifications = ko.observableArray();
        this.emailInfo = ko.observable('Please click on "Verify my account" in the e-mail we sent you to verify your address. <a class="btn btn-link btn-block" href="#resendEmailConfirmation">Click here to resend.</a>');
        this.facebookInfo = ko.pureComputed(() => {
            const kind = user.isServiceProfessional() ? 'clients' : 'service professionals';
            return `Letting potential ${kind} know you have a trusted online presence helps them know you\'re real. <a class="btn btn-link btn-block" href="#connectWithFacebook">Click here to connect your account.</a>`;
        });
    }

    __connectHandlers() {
        // Setup special links behavior to add/perform specific verifications
        this.registerHandler({
            target: this.$activity,
            event: 'click',
            selector: '[href="#resendEmailConfirmation"]',
            handler: () => {
                showNotification({
                    message: 'TO-DO: resend email confirmation'
                });
            }
        });
        this.registerHandler({
            target: this.$activity,
            event: 'click',
            selector: '[href="#connectWithFacebook"]',
            handler: () => {
                showNotification({
                    message: 'TO-DO: ask for connect with Facebook API'
                });
            }
        });
    }

    show(state) {
        super.show(state);

        userVerifications.getList()
        .then((list) => {
            this.userVerifications(list());
        })
        .catch((error) => {
            showError({
                title: 'Error loading your verifications',
                error
            });
        });
    }
}

activities.register(ROUTE_NAME, Verifications);

/*
var UserVerification = require('../models/UserVerification'),
    Verification = require('../models/Verification');

function testdata() {

    var verA = new Verification({
            name: 'Email'
        }),
        verB = new Verification({
            name: 'Facebook'
        }),
        verC = new Verification({
            name: 'Loconomic\'s user-reviewed'
        });

    return [
        new UserVerification({
            statusID: Verification.status.confirmed,
            lastVerifiedDate: new Date(2015, 1, 12, 10, 23, 32),
            verification: verA
        }),
        new UserVerification({
            statusID: Verification.status.revoked,
            lastVerifiedDate: new Date(2015, 5, 20, 16, 4, 0),
            verification: verB
        }),
        new UserVerification({
            statusID: Verification.status.pending,
            lastVerifiedDate: new Date(2014, 11, 30, 19, 54, 4),
            verification: verC
        })
    ];
}
*/
