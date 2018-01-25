/**
 * A list of the external listings a professional has created.
 *
 * @module kocomponents/external-listing/list
 *
 */

import '../../utilities/icon-dec.js';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'external-listing-list';
const dummyData = {};
dummyData[540] =
[
  {
    'externalListingID': 214,
    'PlatformID': 2,
    'PlatformName': 'Upwork',
    'JobTitles': ["Graphic Designer", "Graphic Artist", "Front-end Developer"]
  },
  {
    'externalListingID': 215,
    'PlatformID': 3,
    'PlatformName': '99designs',
    'JobTitles': ["Graphic Designer", "Graphic Artist", "Front-end Developer"]
  }
];

/**
 * Component
 */
export default class ExternalListingList extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {(number|KnockoutObservable<number>)} 
     * [params.userID]
     */
    constructor(params) {
        super();

        /**
         * The user's ID whom we're getting a list for.
         * @member {KnockoutObservable<number>}
         */
        this.userID = getObservable(params.userID || -1);

        /**
         * An array containing the external listings for the
         * speciic user.
         * @member {KnockoutObservable<array>}
         */
        this.externalListing = ko.observableArray();

        this.observeChanges(() => {
            const data = dummyData[this.userID()];
            this.externalListing(data);
        });
    }
}

ko.components.register(TAG_NAME, ExternalListingList);
