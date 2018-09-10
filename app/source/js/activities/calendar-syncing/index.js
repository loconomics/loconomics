/**
 * CalendarSyncing
 *
 * @module activities/calendar-syncing
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import $ from 'jquery';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import calendarSyncing from '../../data/calendarSyncing';
import ko from 'knockout';
import { show as showError } from '../../modals/error';
import template from './template.html';

const ROUTE_NAME = 'calendar-syncing';

export default class CalendarSyncing extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.helpLink = '/help/relatedArticles/201959953-syncing-your-existing-calendar';
        this.navBar = Activity.createSubsectionNavBar('Calendar', {
            backLink: 'calendar',
            helpLink: this.helpLink
        });
        this.title('Syncing your calendars');

        /// View members
        var syncVersion = calendarSyncing.newVersion();
        syncVersion.isObsolete.subscribe(function(itIs) {
            if (itIs) {
                // new version from server while editing
                // FUTURE: warn about a new remote version asking
                // confirmation to load them or discard and overwrite them;
                // the same is need on save(), and on server response
                // with a 509:Conflict status (its body must contain the
                // server version).
                // Right now, just overwrite current changes with
                // remote ones:
                syncVersion.pull({ evenIfNewer: true });
            }
        });

        // Actual data for the form:
        this.sync = syncVersion.version;

        this.isLocked = ko.pureComputed(function() {
            return this.isLocked() || this.isReseting();
        }, calendarSyncing);

        this.submitText = ko.pureComputed(function() {
            return (
                this.isLoading() ?
                    'loading...' :
                    this.isSaving() ?
                        'saving...' :
                        'Save'
            );
        }, calendarSyncing);

        this.resetText = ko.pureComputed(function() {
            return (
                this.isReseting() ?
                    'reseting...' :
                    'Reset Private URL'
            );
        }, calendarSyncing);

        this.discard = function discard() {
            syncVersion.pull({ evenIfNewer: true });
        };

        this.save = function save() {
            syncVersion.pushSave()
            .then(function() {
                app.successSave();
            })
            .catch(function() {
                // catch error, managed on event
            });
        };

        this.reset = function reset() {
            calendarSyncing.resetExportUrl();
        };

        /// Event handlers
        // Adding auto-select behavior to the export URL
        this.registerHandler({
            target: $activity.find('#calendarSync-icalExportUrl'),
            event: 'click',
            handler: function() {
                $(this).select();
            }
        });

        this.registerHandler({
            target: calendarSyncing,
            event: 'error',
            handler: function(err) {
                var msg = err.task === 'save' ? 'Error saving calendar syncing settings.' : 'Error loading calendar syncing settings.';
                showError({
                    title: msg,
                    error: err && err.task && err.error || err
                });
            }
        });
    }

    show(state) {
        super.show(state);

        // Keep data updated:
        calendarSyncing.sync();
        // Discard any previous unsaved edit
        this.discard();
    }
}

activities.register(ROUTE_NAME, CalendarSyncing);
