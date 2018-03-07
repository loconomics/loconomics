/**
 * A list of solutions for a user's listing.
 *
 * @module kocomponents/listing/solutions/suggestions-list
 *
 */
import '../../../utilities/icon-dec.js';
import '../../../solution/viewer';
import Komponent from '../../../helpers/KnockoutComponent';
import ko from 'knockout';
import { show as showError } from '../../../../modals/error';
import template from './template.html';
import { bySuggestedByJobTitle as userListingSolutionsSuggestionsList } from '../../../../data/userListingSolutions';

const TAG_NAME = 'listing-solutions-suggestions-list';

/**
 * Component
 */
export default class UserListingSolutionsSuggestionsList extends Komponent {

    static get template() { return template; }

    /**
    * @param {object} params
    * @param {KnockoutObservable<string>} [params.listMode]
    * @param {function} [params.selectItem] Callback to trigger when using
    * `ListMode.select` and an item is clicked. As parameter will get a reference
    * to the item object.
    *  @param {(number|KnockoutObservable<number>)} 
    * [params.jobTitleID] Input only ID to be 
    * edited or copied, or zero for new.
    */
    constructor(params) {
        super();
         /**
         * Captures the jobTitleID to identify 
         * which solutions to suggest.
         * @member {jobTitleID}
         */
        this.jobTitleID = ko.observable(ko.unwrap(params.jobTitleID));

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
        this.subscribeTo(userListingSolutionsSuggestionsList.onData, this.userListingSolution);

        /**
         * Notify data load errors
         */
        this.subscribeTo(userListingSolutionsSuggestionsList.onDataError, (err) => {
            showError({
                title: 'There was an error loading suggested search categories',
                error: err
            });
        });
    }
}

ko.components.register(TAG_NAME, UserListingSolutionsSuggestionsList);