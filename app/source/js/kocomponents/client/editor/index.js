/**
 * Allows a professional to add or edit a client's information.
 *
 * @module kocomponents/client/editor
 *
 */

import '../../utilities/icon-dec';
import Komponent from '../../helpers/KnockoutComponent';
import { item as clientsDataItem } from '../../../data/clients';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import { show as showError } from '../../../modals/error';
import template from './template.html';

const TAG_NAME = 'client-editor';

/**
 * Component
 */
export default class ClientEditor extends Komponent {

    static get template() { return template; }


    /**
     * @param {object} params
     * @param  {KnockoutObservable<string>}
     * [params.editorMode]
     * @param  {KnockoutObservable<integer>}
     * [params.clientID]
     */

    constructor(params) {
        super();

        /**
         * Captures from the activity which "mode" the editor
         * component is to be used.
         * add:
         * edit:
         * quickAdd:
         * @member {KnockoutObservable<string>}
         */
        this.editorMode = getObservable(params.editorMode);

        /**
         * Captures the clientID to edit.
         * @member {KnockoutObservable<object>}
         */
        this.clientID = ko.unwrap(params.clientID || 0);

        // Birth month day
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
        this.selectedBirthMonth = ko.computed({
            read: function() {
                var c = this.client();
                if (c) {
                    var birthMonth = c.birthMonth();
                    return birthMonth ? this.months()[birthMonth - 1] : null;
                }
                return null;
            },
            write: function(month) {
                var c = this.client();
                if (c)
                    c.birthMonth(month && month.id || null);
            },
            owner: this
        });

        this.monthDays = ko.observableArray([]);
        for (var iday = 1; iday <= 31; iday++) {
            this.monthDays.push(iday);
        }

        // Access the client data
        var item = clientsDataItem(this.clientID);

        // Start-up load of data
        item.onceLoaded
        .then(this.client)
        .catch((error) => {
            showError({
                title: 'There was an error loading the client data',
                error
            });
        });

        /**
         * Save changes to the client
         * @returns {Promise}
         */
        this.save = () => item.save(this.client());
    }
}

ko.components.register(TAG_NAME, ClientEditor);
