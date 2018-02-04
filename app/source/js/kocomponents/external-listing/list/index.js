/**
 * A list of the external listings a professional has created.
 *
 * @module kocomponents/external-listing/list
 *
 */
import '../../utilities/icon-dec.js';
import Komponent from '../../helpers/KnockoutComponent';
import ko from 'knockout';
import template from './template.html';
import { list as userExternalListingsList } from '../../../data/userExternalListings';

const TAG_NAME = 'external-listing-list';

/**
 * Component
 */
export default class ExternalListingList extends Komponent {

    static get template() { return template; }

    constructor() {
        super();

        /**
         * An array containing the external listings for the
         * speciic user.
         * @member {KnockoutObservable<array>}
         */
        this.externalListing = ko.observableArray();

        /**
         * For a userExternalListing (an item in the array), returns a string
         * with all the job titles in one line, comma separated.
         * @param {rest/UserExternalListing} listingItem
         */
        this.getJobTitlesLine = (listingItem) => Object.values(listingItem.jobTitles).join(', ');

        /**
         * Suscribe to data coming for the list and put them in our
         * externalListing propery.
         */
        this.subscribeTo(userExternalListingsList.onData, this.externalListing);
    }
}

ko.components.register(TAG_NAME, ExternalListingList);
