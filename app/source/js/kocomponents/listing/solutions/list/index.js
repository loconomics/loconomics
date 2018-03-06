/**
 * A list of solutions for a user's listing.
 *
 * @module kocomponents/listing/solutions/list
 *
 */
import '../../../utilities/icon-dec.js';
import '../../../solution/viewer';
import Komponent from '../../../helpers/KnockoutComponent';
import getObservable from '../../../../utils/getObservable';
import ko from 'knockout';
import { show as showError } from '../../../../modals/error';
import template from './template.html';
import { byUserListing as userListingSolutionsList } from '../../../../data/userListingSolutions';

const TAG_NAME = 'listing-solutions-list';

/**
 * @enum {string} Supported displaying modes
 */
const ListMode = {
    view: 'view',
    select: 'select'
};

/**
 * Component
 */
export default class UserListingSolutionsList extends Komponent {

    static get template() { return template; }

    /**
    * @param {object} params
    * @param {KnockoutObservable<string>} [params.listMode]
    * @param {function} [params.selectItem] Callback to trigger when using
    * `ListMode.select` and an item is clicked. As parameter will get a reference
    * to the item object.
    */
    constructor(params) {
        super();
      /**
         * Captures from the activity which "mode" the list
         * component is to be used.
         * view:
         * select:
         * @member {KnockoutObservable<string>}
         */
        this.listMode = getObservable(params.listMode || ListMode.view);

        /**
         * @method selectItem
         */
        this.selectItem = params.selectItem;

        /**
         * An array containing the solutions of a listing.
         * @member {KnockoutObservable<array>}
         */
        this.userListingSolution = ko.observableArray();


        /**
         * Suscribe to data coming for the list and put them in our
         * userListingSolution property.
         */
        this.subscribeTo(userListingSolutionsList.onData, this.userListingSolution);

        /**
         * Notify data load errors
         */
        this.subscribeTo(userListingSolutionsList.onDataError, (err) => {
            showError({
                title: 'There was an error loading search categories',
                error: err
            });
        });
    }
}

ko.components.register(TAG_NAME, UserListingSolutionsList);
/**
 * @enum {string} Public enumeration of supported displaying modes
 */
UserListingSolutionsList.ListMode = ListMode;