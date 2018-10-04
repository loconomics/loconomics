/**
 * SchedulingPreferences
 *
 * @module activities/scheduling-preferences
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import '../../kocomponents/switch-checkbox';
import '../../kocomponents/utilities/icon-dec';
import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import ko from 'knockout';
import schedulingPreferences from '../../data/schedulingPreferences';
import { show as showError } from '../../modals/error';
import template from './template.html';
import timeZoneList from '../../utils/timeZoneList';
import weeklySchedule from '../../data/weeklySchedule';

const ROUTE_NAME = 'scheduling-preferences';

export default class SchedulingPreferences extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.helpLink = '/help/relatedArticles/201961423-setting-your-scheduling-preferences';
        this.navBar = Activity.createSubsectionNavBar('Calendar', {
            backLink: '/calendar',
            helpLink: this.helpLink
        });
        this.defaultNavBar = this.navBar.model.toPlainObject(true);
        this.title('Availability settings');

        this.__defViewProperties();
        this.__defViewMethods();
        this.__connectErrorHandlers();
    }

    __defViewProperties() {
        this.goBackLink = ko.observable('');
        this.goBackLabel = ko.observable('');

        this.schedulingPreferences = new SchedulingPreferencesVM();
        this.weeklySchedule = new WeeklyScheduleVM();

        this.isLoading = ko.pureComputed(() => this.schedulingPreferences.isLoading() || this.weeklySchedule.isLoading());
        this.isSaving = ko.pureComputed(() => this.schedulingPreferences.isSaving() || this.weeklySchedule.isSaving());
        this.isLocked = ko.pureComputed(() => this.schedulingPreferences.isLocked() || this.weeklySchedule.isLocked());

        this.submitText = ko.pureComputed(() => {
            if (this.isLoading()) {
                return 'loading...';
            }
            else if (this.isSaving()) {
                return 'Saving...';
            }
            else {
                return 'Save';
            }
        });
    }

    __defViewMethods() {
        this.save = () => Promise.all([
            this.schedulingPreferences.save(),
            this.weeklySchedule.save()
        ])
        .then(() => {
            this.app.successSave();
        })
        .catch(() => {
            // catch error, managed on event
        });

        this.discard = () => {
            this.schedulingPreferences.discard();
            this.weeklySchedule.discard();
        };
    }

    __connectErrorHandlers() {
        this.registerHandler({
            target: weeklySchedule,
            event: 'error',
            handler: (err) => {
                var msg = err.task === 'save' ? 'Unable to save your weekly schedule.' : 'Unable to load your weekly schedule.';
                showError({
                    title: msg,
                    error: err && err.task && err.error || err
                });
            }
        });

        this.registerHandler({
            target: schedulingPreferences,
            event: 'error',
            handler: (err) => {
                var msg = err.task === 'save' ? 'Unable to save scheduling preferences.' : 'Unable to load scheduling preferences.';
                showError({
                    title: msg,
                    error: err && err.task && err.error || err
                });
            }
        });
    }

    updateNavBarState() {
        // Touch desktop navigation too
        var info = this.app.getReturnRequestInfo(this.requestData);
        this.goBackLink(info && info.link || '/calendar');
        this.goBackLabel(info && info.label || 'Calendar');
        // Does not support the info.isGoBack option
    }

    show(state) {
        super.show(state);

        this.updateNavBarState();

        // Keep data updated:
        schedulingPreferences.sync();
        weeklySchedule.sync();
        // Discard any previous unsaved edit
        this.discard();
    }
}

activities.register(ROUTE_NAME, SchedulingPreferences);

/// ViewModels specific for both kind of info managed here, would be better
/// this becomes attached to a component used at the activity as of a full refactor

function SchedulingPreferencesVM() {
    var prefsVersion = schedulingPreferences.newVersion();
    prefsVersion.isObsolete.subscribe((itIs) => {
        if (itIs) {
            // new version from server while editing
            // FUTURE: warn about a new remote version asking
            // confirmation to load them or discard and overwrite them;
            // the same is need on save(), and on server response
            // with a 509:Conflict status (its body must contain the
            // server version).
            // Right now, just overwrite current changes with
            // remote ones:
            prefsVersion.pull({ evenIfNewer: true });
        }
    });

    // Actual data for the form:
    this.prefs = prefsVersion.version;

    this.isLoading = schedulingPreferences.isLoading;
    this.isSaving = schedulingPreferences.isSaving;
    this.isLocked = schedulingPreferences.isLocked;

    this.discard = () => {
        prefsVersion.pull({ evenIfNewer: true });
    };

    this.save = () => prefsVersion.pushSave();
}

function WeeklyScheduleVM() {
    var scheduleVersion = weeklySchedule.newVersion();
    scheduleVersion.isObsolete.subscribe((itIs) => {
        if (itIs) {
            // new version from server while editing
            // FUTURE: warn about a new remote version asking
            // confirmation to load them or discard and overwrite them;
            // the same is need on save(), and on server response
            // with a 509:Conflict status (its body must contain the
            // server version).
            // Right now, just overwrite current changes with
            // remote ones:
            scheduleVersion.pull({ evenIfNewer: true });
        }
    });

    // Actual data for the form:
    this.schedule = scheduleVersion.version;

    this.isLoading = weeklySchedule.isLoading;
    this.isSaving = weeklySchedule.isSaving;
    this.isLocked = weeklySchedule.isLocked;

    this.discard = () => {
        scheduleVersion.pull({ evenIfNewer: true });
    };

    this.save = () => scheduleVersion.pushSave();

    var autoTz = timeZoneList.getUsAliasWhenPossible(timeZoneList.getLocalTimeZone());
    var autoLabel = 'Auto (' + timeZoneList.timeZoneToDisplayFormat(autoTz) + ')';
    this.autoTimeZone = ko.observable({
        id: autoTz,
        label: autoLabel
    });
    this.timeZonesList = ko.observable(timeZoneList.getUserList());
    this.topUsTimeZones = ko.observable(timeZoneList.getTopUsZones());
}
