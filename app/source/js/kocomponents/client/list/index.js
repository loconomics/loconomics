/**
 * Diplays a list of a professional's clients, and, depending on the
 * mode, allows the ability to select a client to be used in other
 * activities.
 *
 * @module kocomponents/client/list
 */

import '../../utilities/icon-dec';
import Komponent from '../../helpers/KnockoutComponent';
import clientsData from '../../../data/clients';
import ko from 'knockout';
import { show as showError } from '../../../modals/error';
import template from './template.html';

const TAG_NAME = 'client-list';

/**
 * Component
 */
export default class ClientList extends Komponent {

    static get template() { return template; }

     /**
     * @param {object} params
     * @param {Function<rest/Client>} [params.selectItem] Callback with the data for the client
     * selected by the user
     */
    constructor(params) {
        super();

        /**
         * @method selectItem
         */
        this.selectItem = params.selectItem;

        /**
         * Client list.
         * @member {KnockoutObservable<array>}
         */
        this.clientList = ko.observableArray();

        // Get and keep notified with clients data and any error
        this.subscribeTo(clientsData.list.onData, this.clientList);
        this.subscribeTo(clientsData.list.onDataError, (error) => {
            showError({
                title: 'There was an error loading clients',
                error
            });
        });
    }
}

ko.components.register(TAG_NAME, ClientList);
