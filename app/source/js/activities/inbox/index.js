/**
 * Inbox
 *
 * @module activities/inbox
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import MessageView from '../../models/MessageView';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import messaging from '../../data/messaging';
import { searchFor } from '../../utils/textSearch';
import { show as showError } from '../../modals/error';
import template from './template.html';

const ROUTE_NAME = 'inbox';

export default class Inbox extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.navBar = Activity.createSectionNavBar(null);
        this.title = 'Your Inbox';

        // TODO: Refactor old ViewModel members
        this.isLoading = messaging.state.isLoading;
        this.isSyncing = messaging.state.isSyncing;
        this.sourceThreads = ko.observableArray([]);
        this.searchText = ko.observable('');
        // NOTE: since current API-connection implementation only gets
        // the latest message with getList, the search is done in the
        // bodyText of the last message (additionally to the thread subject)
        // even if this implementation try to iterate all messages.
        this.threads = ko.pureComputed(() => {
            var t = this.sourceThreads();
            var s = this.searchText();

            if (!t) {
                return [];
            }
            else if (!s) {
                return t.map(MessageView.fromThread.bind(null, app));
            }
            else {
                // Prepare search term
                const doSearch = searchFor(s);
                return t.filter((thread) => {
                    var found = false;

                    // Check subject
                    found = doSearch.allAtWords(thread.subject());

                    if (!found) {
                        // Try content of messages
                        // It stops on first 'true' result
                        thread.messages().some((msg) => {
                            found = doSearch.allAt([msg.bodyText()]);
                            return found;
                        });
                    }

                    return found;
                }).map(MessageView.fromThread.bind(null, app));
            }
        });
    }

    show(state) {
        super.show(state);

        messaging.getList()
        .then((threads) => {
            this.sourceThreads(threads());
        })
        .catch((err) => {
            showError({
                title: 'Error loading messages',
                error: err
            });
        });
    }
}

activities.register(ROUTE_NAME, Inbox);
