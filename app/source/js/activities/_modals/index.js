/**
 * Testing activity '_modals'.
 *
 * IMPORTANT: Any activity starting with underscore must not being published.
 */
'use strict';

import * as activities from '../index';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import { show as showConfirm } from '../../modals/confirm';
import { show as showError } from '../../modals/error';
import { show as showNotification } from '../../modals/notification';
import { show as showTextEditor } from '../../modals/textEditor';
import { show as showTimePicker } from '../../modals/timePicker';
import template from './template.html';

const ROUTE_NAME = '_modals';

export default class _ModalsActivity extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);
        this.accessLevel = UserType.loggedUser;
        this.title = 'Testing Modals';
    }

    /// CONFIRM
    confirm1() {
        showConfirm();
    }

    confirm2() {
        showConfirm({
            title: 'Cancel',
            message: 'Are you sure?',
            yes: 'Yes',
            no: 'No'
        });
    }

    confirm3() {
        showConfirm({
            title: 'Delete item',
            message: 'You will delete item 34',
            yes: 'Delete',
            no: 'Keep'
        });
    }

    /// ERROR
    error1() {
        showError();
    }

    error2() {
        // Error object, with saving data example
        showError({
            title: 'Unable so save data',
            error: new Error('Server Error: impossible to save item')
        });
    }

    error3() {
        // Exception object, with loading data example
        showError({
            title: 'Unable so load your availability preferences',
            error: {
                name: 'XMLHttpRequest Error',
                message: 'No response from server'
            }
        });
    }

    /// NOTIFICATION
    notification1() {
        showNotification();
    }

    notification2() {
        showNotification({
            title: 'Confirmation request',
            message: 'A message was sent to your inbox to confirm your email address. Click the link inside and you are done',
            buttonText: 'Got it!'
        });
    }

    // TEXT EDITOR
    textEditor1() {
        // A title is required, that's the minimum options can be set
        // at this modal
        showTextEditor({
            title: 'Text editor'
        });
    }

    textEditor2() {
        showTextEditor({
            title: 'Add notes about the client',
            text: 'Previous typed notes'
        });
    }

    /// TIME PICKER
    timePicker1() {
        showTimePicker();
    }

    timePicker2() {
        // Like in book unavailable time at dateTimePicker component
        showTimePicker({
            title: 'Schedule an unavailable time',
            selectedTime: null,
            unsetLabel: 'Cancel'
        });
    }

    timePicker3() {
        // Like in book unavailable time at dateTimePicker component
        showTimePicker({
            title: 'Change selected time',
            selectedTime: '11:40',
            stepInMinutes: 10,
            unsetLabel: 'Reset',
            selectLabel: 'Update'
        });
    }
}

activities.register(ROUTE_NAME, _ModalsActivity);
