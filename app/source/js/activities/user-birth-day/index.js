/**
 * UserBirthDay
 *
 * @module activities/user-birth-day
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
//import * as userProfile from '../../data/userProfile';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import template from './template.html';

// TODO: Remove this and uncomment the equivalent import line above ones the module
// gets completely converted to ES6, so the 'Prototype lost' bug gets fixed,
// check details at https://github.com/loconomics/loconomics/issues/744#issuecomment-423107797
const userProfile = require('../../data/userProfile');

const ROUTE_NAME = 'user-birth-day';
const user = userProfile.data;

export default class UserBirthDay extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.helpLink = '/help/relatedArticles/201967756-telling-the-community-about-yourself';
        // Defaults settings for navBar.
        var backLink = user.isServiceProfessional() ? '/listing-editor' : '/user-profile';
        this.navBar = Activity.createSubsectionNavBar('Edit listing', {
            backLink: backLink,
            helpLink: this.helpLink
        });
        this.title = 'Your birthday';

        this.__defViewProperties();
        this.__defMethodProperties();
    }

    __defViewProperties() {
        this.submitText = ko.pureComputed(() => {
            var r = this
                .isLoading() ?
                'Loading...' :
                this.isSaving() ?
                'Saving...' :
                'Save';
            return r;
        });
        /// States
        this.isLoading = userProfile.isLoading;
        this.isSaving = userProfile.isSaving;
        this.isSyncing = userProfile.isSyncing;
        this.isLocked = userProfile.isLocked;
        // User Profile
        var profileVersion = userProfile.newVersion();
        this.__profileVersion = profileVersion;
        profileVersion.isObsolete.subscribe((itIs) => {
            if (itIs) {
                // new version from server while editing
                // FUTURE: warn about a new remote version asking
                // confirmation to load them or discard and overwrite them;
                // the same is need on save(), and on server response
                // with a 509:Conflict status (its body must contain the
                // server version).
                // Right now, just overwrite current changes with
                // remote ones:
                profileVersion.pull({ evenIfNewer: true });
            }
        });
        // Actual data for the form:
        this.profile = profileVersion.version;

        /// Birth Day data and tools
        // TODO l10n
        this.months = ko.observableArray([
            { id: 1, name: 'January'},
            { id: 2, name: 'February'},
            { id: 3, name: 'March'},
            { id: 4, name: 'April'},
            { id: 5, name: 'May'},
            { id: 6, name: 'June'},
            { id: 7, name: 'July'},
            { id: 8, name: 'August'},
            { id: 9, name: 'September'},
            { id: 10, name: 'October'},
            { id: 11, name: 'November'},
            { id: 12, name: 'December'}
        ]);
        // We need to use a special observable in the form, that will
        // update the back-end profile.birthMonth
        this.selectedBirthMonth = ko.pureComputed({
            read: () => {
                var birthMonth = this.profile.birthMonth();
                return birthMonth ? this.months()[birthMonth - 1] : null;
            },
            write: (month) => {
                this.profile.birthMonth(month && month.id || null);
            }
        });

        this.monthDays = ko.observableArray([]);
        for (var iday = 1; iday <= 31; iday++) {
            this.monthDays.push(iday);
        }
    }

    __defMethodProperties() {
        this.save = function() {
            this.__profileVersion.pushSave()
            .then(() => {
                this.app.successSave();
            })
            .catch(() => {
                // catch error, managed on event
            });
        };
        this.discard = () => {
            this.__profileVersion.pull({ evenIfNewer: true });
        };
        this.sync = () => {
            userProfile.sync();
        };
    }

    show(state) {
        super.show(state);

        // Discard any previous unsaved edit
        this.discard();
        // Keep data updated:
        this.sync();
    }
}

activities.register(ROUTE_NAME, UserBirthDay);
