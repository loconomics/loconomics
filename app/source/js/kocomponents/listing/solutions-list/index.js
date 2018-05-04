/**
 * It display the solutions attached to a specific user listing.
 * @module kocomponents/listing/solutions-list
 *
 */
import Komponent from '../../helpers/KnockoutComponent';
import { byUserListing } from '../../../data/userSolutions';
import ko from 'knockout';
import { show as showError } from '../../../modals/error';
import template from './template.html';

const TAG_NAME = 'listing-solutions-list';

/**
 * Component
 */
export default class ListingSolutionsList extends Komponent {

    static get template() { return template; }

    /**
     * Both ID parameters are input only, immutable for the component instance.
     * @param {object} params
     * @param {(number|KnockoutObservable<number>)} params.userListingID
     */
    constructor(params) {
        super();

         /**
         * @member {number}
         */
        this.userListingID = ko.unwrap(params.userListingID);

        /**
         * List of solutions attached to the user listing
         * @member {KnockoutObservableArray<rest/Solution>}
         */
        this.listingSolutions = ko.observableArray([]);

        this.__setupStatusFlags();

        this.__connectData();
    }

    /**
     * Define members for all the status flags needed.
     * @private
     */
    __setupStatusFlags() {
        /**
         * When a loading request it's on the works
         * @member {KnockoutObservable<boolean>}
         */
        this.isLoading = ko.observable(false);
    }

    __connectData() {

        this.isLoading(true);
        byUserListing(this.userListingID)
        .onceLoaded()
        .then((data) => {
            this.isLoading(false);
            this.listingSolutions(data);
        })
        .catch((error) => {
            this.isLoading(false);
            showError({
                title: 'There was an error loading your search categories',
                error
            });
        });
    }
}

ko.components.register(TAG_NAME, ListingSolutionsList);
