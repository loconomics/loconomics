/**
 * Displays a list of suggested GIG postings for the user.
 *
 * @module activities/suggested-postings
 *
 */

import '../../utils/activeViewBindingHandler';
import '../../kocomponents/posting/list';
import '../../kocomponents/posting/viewer';
import * as activities from '../index';
import { applyToPoster, discardPoster, list as suggestedPostings } from '../../data/suggestedPostings';
import Activity from '../../components/Activity';
import UserPosting from '../../models/UserPosting';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import shell from '../../app.shell';
import { show as showConfirm } from '../../modals/confirm';
import { show as showError } from '../../modals/error';
import { show as showTextInput } from '../../modals/textInput';
import template from './template.html';

const ROUTE_NAME = 'suggested-postings';

export default class SuggestedPostingsActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {

        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        
        this.navBar = Activity.createSubsectionNavBar('Suggested Projects');

        this.isLoading = ko.observable(false);
        this.list = ko.observableArray();
        this.userPostingID = ko.observable(null);

        /**
         * Creates link to where to view the posting details
         * @param {rest/UserPosting} item An user posting plain object
         * @returns {string}
         */
        this.linkToViewItem = (item) => `/suggested-postings/${item.userPostingID}`;

        /**
         * Gives null or the posting selected by the instance ID, by filtering
         * the full list.
         * @member {KnockoutComputed<rest/UserPosting>}
         */
        this.selectedPosting = ko.pureComputed(() => {
            const ready = !this.isLoading();
            const id = this.userPostingID();
            if (ready && id) {
                const list = this.list();
                const item = list.find((item) => item.userPostingID === id);
                return new UserPosting(item);
            }
            return null;
        });
        /**
         * Returns the active view
         * @member {KnockoutComputed<string>}
         */
        this.view = ko.pureComputed(() => {
            const id = this.userPostingID();
            return id ? 'item' : 'list';
        });

        this.title = ko.pureComputed(() => {
            switch (this.view()) {
                default:
                case 'list':
                    return 'Clients that need your help';
                case 'item':
                    return 'Project details';
            }
        });

        this.view.subscribe((view) => {
            switch (view) {
                default:
                case 'list':
                    this.navBar.model.updateWith({
                        title: null,
                        leftAction: {
                            link: 'menuIn',
                            icon: 'menu',
                            isMenu: true
                        }
                    });
                    break;
                case 'item':
                    this.navBar.model.updateWith({
                        title: null,
                        leftAction: {
                            link: '/suggested-postings',
                            text: 'Suggested projects',
                            icon: 'fa ion ion-ios-arrow-left',
                            isMenu: false,
                            isShell: false
                        }
                    });
                    break;
            }
        });
    }

    onSelect(item) {
        shell.go(this.linkToViewItem(item));
    }

    show(state) {
        super.show(state);

        this.isLoading(true);
        this.subscribeTo(suggestedPostings.onData, (data) => {
            this.list(data);
            this.isLoading(false);
        });
        this.subscribeTo(suggestedPostings.onDataError, (error) => {
            this.isLoading(false);
            showError({
                title: 'There was an error loading suggested clients',
                error
            });
        });

        // if ID given
        this.userPostingID(state.route.segments[0] |0);
    }

    applyPosting() {
        const post = this.selectedPosting();
        const name = post && post.client() && post.client().publicName();
        if (name) {
            showTextInput({
                submitLabel: 'Apply',
                title: `Message to ${name}`,
                required: true,
                // Notes/Help:
                description: 'We will send your email, name, phone number and ' +
                'a link to your public listing on your behalf. Personalize a note to ' +
                'your potential client below:',
                // Template:
                text: `Hi ${name}, \r\n` + 
                `\r\n` +
                `I'd like to help you with your project and feel my experience ` + 
                `will allow me to do a great job. Please get in touch so we can ` +
                `get going on next steps. \r\n` +
                `\r\n` +
                `Thank you!`,
            })
            // Submit to server
            .then((message) => {
                if (message !== null) {
                    return applyToPoster(post.userPostingID(), {
                        message
                    })
                    .then((updatedPosting) => {
                        // Update posting copy with new data
                        post.model.updateWith(updatedPosting, true);
                    });
                }
            })
            .catch((error) => {
                showError({
                    title: 'There was an error sending your application',
                    error
                });
            });
        }
    }

    discardPosting() {
        const post = this.selectedPosting();
        const name = post && post.client() && post.client().publicName();
        if (name) {
            showConfirm({
                title: 'Discard this project',
                message: `Since you're not interested in "${post.title()}", let's hide it for you`,
                yes: 'Discard project',
                no: 'Keep'
            })
            // Submit to server
            .then(() => discardPoster(post.userPostingID()))
            .then(() => shell.go('/suggested-postings'))
            .catch((error) => {
                if (!error) return; // just answered no
                showError({
                    title: 'There was an error sending your request',
                    error
                });
            });
        }
    }
}

activities.register(ROUTE_NAME, SuggestedPostingsActivity);
