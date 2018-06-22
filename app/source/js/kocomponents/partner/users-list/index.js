/**
 * Diplays a list of users allowing to select one, with built-in filtering.
 *
 * @module kocomponents/partner/users-list
 */

import '../../utilities/icon-dec';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'partner-users-list';

/**
 * Component
 */
export default class PartnerUsersList extends Komponent {

    static get template() { return template; }

     /**
     * @param {object} params
     * @param {Array<rest/User>|KnockoutObservable<Array<rest/User>>} params.data
     * Source data with the list of users to display.
     * @param {Function<rest/User>} [params.selectItem] Callback with the data
     * of the selected user
     */
    constructor(params) {
        super();

        /**
         * @method selectItem
         */
        this.selectItem = params.selectItem;

        /**
         * Users list.
         * @member {KnockoutObservable<Array<Object>>}
         */
        this.list = getObservable(params.data);
    }
}

ko.components.register(TAG_NAME, PartnerUsersList);
