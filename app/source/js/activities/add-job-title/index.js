/**
 * AddJobTitle activity
 *
 * @module activities/add-job-title
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import { ActionForValue } from '../../kocomponents/job-title-autocomplete';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import onboarding from '../../data/onboarding';
import { show as showError } from '../../modals/error';
import template from './template.html';
import { item as userListingItem } from '../../data/userListings';
import userProfile from '../../data/userProfile';

const ROUTE_NAME = 'add-job-title';
const user = userProfile.data;

export default class AddJobTitleActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.helpLink = '/help/relatedArticles/201211055-adding-job-profiles';
        this.navBar = Activity.createSubsectionNavBar('Scheduler', {
            backLink: '/listings' ,
            helpLink: this.helpLink
        });
        this.title('Create a new listing');

        // TODO: Refactor old ViewModel members following:
        this.isInOnboarding = onboarding.inProgress;

        this.isSaving = ko.observable(false);
        this.isLocked = this.isSaving;

        this.selectedJobTitle = ko.observable(null);

        this.onSelectJobTitle = (value, jobTitle) => {
            var item = null;
            if (jobTitle && jobTitle.jobTitleID) {
                // Add to the list, if is not already in it
                item = {
                    value: jobTitle.jobTitleID(),
                    label: jobTitle.singularName()
                };
            }
            else {
                item = {
                    value: 0,
                    label: value
                };
            }
            this.selectedJobTitle(item);
            // Auto save on selection (https://github.com/loconomics/loconomics/issues/832#issuecomment-372696848)
            this.save();

            return {
                value: ActionForValue.copySelected
            };
        };

        this.submitText = ko.pureComputed(() => {
            const text = onboarding.inProgress() ?
                'Create and continue' :
                this.isSaving() ?
                    'Creating...' :
                    'Create';
            return text;
        });

        this.save = () => {
            if (!this.selectedJobTitle()) return;
            this.isSaving(true);

            // We need to do different stuff if user is not a proffesional when requesting this
            var becomingProfessional = !user.isServiceProfessional();
            var jobTitle = this.selectedJobTitle();

            return userListingItem().save({
                jobTitleID: jobTitle.value,
                jobTitleName: jobTitle.label
            })
            .then((result) => {
                var onEnd = () => {
                    this.isSaving(false);
                    if (onboarding.inProgress()) {
                        onboarding.selectedJobTitleID(result.jobTitleID);
                        onboarding.goNext();
                    }
                    else {
                        // Go to edit the just added listing
                        app.shell.go('/listingEditor/' + result.jobTitleID);
                    }
                };
                if (becomingProfessional) {
                    return userProfile
                    .load({ forceRemoteUpdate: true })
                    .then(function() {
                        onEnd();
                    });
                }
                else {
                    onEnd();
                }
            })
            .catch((error) => {
                this.isSaving(false);
                showError({
                    title: 'Unable to create your listing',
                    error: error
                });
            });
        };
    }

    /**
     * Analize the route params for optional preset values and prepare the view.
     * @param {Object} state
     * @param {Object} state.route
     * @param {Object} state.route.query
     * @param {string} [state.route.query.s] Proposed name of a job title
     * @param {(string|number)} [state.route.query.id] A valid jobTitleID
     * @param {(string|boolean)} [state.route.query.autoAddNew] Must be true in order to
     * allow an 's' and 'id', it makes the form to auto submit with the given
     * values without wait for user interaction.
     */
    show(state) {
        super.show(state);

        // Check if we are in onboarding and a jobTitle was already added in the sign-up
        // then we can skip this step
        if (onboarding.inProgress() && onboarding.selectedJobTitleID()) {
            setTimeout(function() {
                onboarding.goNext();
            }, 10);
            return;
        }
        // Reset
        this.updateNavBarState();

        // Allow to preset an incoming value
        const {
            s,
            autoAddNew,
            id
         } = state.route.query;
        if (s && (autoAddNew + '') === 'true') {
            // Add to the form
            this.selectedJobTitle({
                value: id |0,
                label: s
            });
            // and submit it
            this.save();
        }
    }

    updateNavBarState() {
        var referrer = this.app.shell.referrerRoute;
        referrer = referrer && referrer.url || '/listings';
        var link = this.requestData.cancelLink || referrer;

        if (!onboarding.updateNavBar(this.navBar)) {
            this.convertToCancelAction(this.navBar.leftAction(), link);
        }
    }
}

activities.register(ROUTE_NAME, AddJobTitleActivity);
