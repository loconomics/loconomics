/**
 * A list of solutions for a user's listing.
 *
 * @module kocomponents/listing/solutions/list
 *
 */
import '../../../utilities/icon-dec.js';
import Komponent from '../../../helpers/KnockoutComponent';
import ko from 'knockout';
import { show as showError } from '../../../../modals/error';
import template from './template.html';
import { byUserListing as userListingSolutionsList } from '../../../../data/userListingSolutions';

const TAG_NAME = 'listing-solutions-list';

/**
 * Component
 */
export default class UserListingSolutionsList extends Komponent {

    static get template() { return template; }

    constructor() {
        super();

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
