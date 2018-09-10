/**
 * DatetimePicker
 *
 * @module activities/datetime-picker
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import getDateWithoutTime from '../../utils/getDateWithoutTime';
import ko from 'knockout';
import template from './template.html';
import { data as user } from '../../data/userProfile';

const ROUTE_NAME = 'datetime-picker';

export default class DatetimePicker extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.loggedUser;
        this.navBar = Activity.createSectionNavBar(null);
        this.title('Chosse an appointment time');
        // Save defaults to restore on updateNavBarState when needed:
        this.defaultLeftAction = this.navBar.leftAction().model.toPlainObject();

        // View properties
        this.headerText = ko.observable('Select a time');
        this.component = ko.observable(null);

        // Return the selected date-time
        ko.computed(() => {
            var datetime = this.component() && this.component().selectedDatetime();
            if (datetime) {
                // Pass the selected datetime in the info
                this.requestData.selectedDatetime = datetime;
                this.requestData.allowBookUnavailableTime = this.component().allowBookUnavailableTime();
                // And go back
                app.shell.goBack(this.requestData);
            }
        });
        this.returnRequest = () => {
            app.shell.goBack(this.requestData);
        };
    }

    updateNavBarState() {
        var header = this.requestData.headerText;
        this.headerText(header || 'Select date and time');

        if (this.requestData.title) {
            // Replace title
            this.navBar.title(this.requestData.title);
        }
        else {
            // Title must be empty
            this.navBar.title('');
            this.navBar.leftAction().text(this.requestData.navTitle || '');
        }

        if (this.requestData.cancelLink) {
            this.convertToCancelAction(this.navBar.leftAction(), this.requestData.cancelLink);
        }
        else {
            // Reset to defaults, or given title:
            this.navBar.leftAction().model.updateWith(this.defaultLeftAction);
            if (this.requestData.navTitle)
                this.navBar.leftAction().text(this.requestData.navTitle);
            // Uses a custom handler so it returns keeping the given state:
            this.navBar.leftAction().handler(this.returnRequest);
        }
    }

    show(state) {
        super.show(state);

        // Reset
        if (this.component()) {
            this.component().reset();
        }

        // Parameters: pass a required duration
        this.component().requiredDurationMinutes(this.requestData.requiredDuration |0 || 15);
        this.component().includeEndTime(!!this.requestData.includeEndTime);

        // Preselect userID and a date, or current date
        this.component().userID(user.userID());
        var selDate = getDateWithoutTime(this.requestData.selectedDatetime);
        this.component().selectedDate(selDate);

        this.updateNavBarState();
    }
}

activities.register(ROUTE_NAME, DatetimePicker);
