/**
 * Conversation
 *
 * @module activities/conversation
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import messaging from '../../data/messaging';
import onboarding from '../../data/onboarding';
import shell from '../../app.shell';
import { show as showError } from '../../modals/error';
import template from './template.html';
import { data as user } from '../../data/userProfile';

const ROUTE_NAME = 'conversation';

const helpLinkProfessionals = '/help/relatedArticles/201966986-sending-and-receiving-messages';
const helpLinkClients = '/help/relatedArticles/201966996-sending-and-receiving-messages';

export default class Conversation extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.navBar = new Activity.NavBar(getNavBar());
        this.title('Conversation history');

        // View properties
        this.isServiceProfessional = user.isServiceProfessional;
        this.helpLink = ko.pureComputed(() => {
            const link = user.isServiceProfessional() ?
                helpLinkProfessionals :
                helpLinkClients;
            return link;
        });
        this.isLoading = messaging.state.isLoading;
        this.isSyncing = messaging.state.isSyncing;
        this.isSaving = messaging.state.isSaving;

        this.threadID = ko.observable(null);
        this.thread = messaging.createWildcardItem();
        const trim = (t) => (t || '').replace(/^\s+|\s+$/g, '');
        this.subject = ko.pureComputed(() => {
            var m = this.thread();
            if (this.isLoading()) {
                return 'Loading...';
            }
            else {
                return m && trim(m.subject()) ||
                    'Conversation without subject';
            }
        });
        // If the last message reference a booking, is
        // accessed with a bookingID:
        const isBooking = (msg) => (msg.auxT() || '').toLowerCase() === 'booking';
        this.bookingID = ko.pureComputed(() => {
            var msg = this.thread() && this.thread().messages()[0];
            if (msg && isBooking(msg) && msg.auxID()) {
                // The auxID is a bookingID
                return msg.auxID();
            }
            else {
                return null;
            }
        });
        this.linkToBooking = ko.pureComputed(() => '#!/viewBooking/' + this.bookingID());
    }

    updateNavBarState() {
        if (!onboarding.updateNavBar(this.navBar)) {
            // Reset
            this.navBar.model.updateWith(getNavBar(), true);
        }
    }

    show(state) {
        super.show(state);

        // Reset
        this.threadID(0);
        this.thread(null);

        this.updateNavBarState();

        // Params
        var params = state.route.segments || [];
        var threadID = params[0] |0;

        this.threadID(threadID);

        // Load the data
        if (threadID) {
            this.thread.sync(threadID)
            .catch((err) => {
                showError({
                    title: 'Error loading conversation',
                    error: err
                }).then(function() {
                    shell.goBack();
                }.bind(this));
            });
        }
        else {
            showError({
                title: 'Conversation Not Found'
            }).then(function() {
                shell.goBack();
            }.bind(this));
        }
    }
}

activities.register(ROUTE_NAME, Conversation);

// Utils
const serviceProfessionalNavBar = Activity.createSubsectionNavBar('Inbox', {
    backLink: '/inbox',
    helpLink: helpLinkProfessionals
}).model.toPlainObject(true);
const clientNavBar = Activity.createSubsectionNavBar('Inbox', {
    backLink: '/inbox',
    helpLink: helpLinkClients
}).model.toPlainObject(true);

function getNavBar() {
    return user.isServiceProfessional() ? serviceProfessionalNavBar : clientNavBar;
}
