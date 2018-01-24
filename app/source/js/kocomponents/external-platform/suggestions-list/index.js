/**
 * A list of suggested external platforms for a 
 * professional to list themselves on based on their job 
 * titles. It lists only platforms they don't already have 
 * an external listing created.
 *
 * @module kocomponents/external-platform/suggestions-list
 *
 */

import '../../utilities/icon-dec.js';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'external-platform-suggestions-list';
const dummyData = {};
dummyData[540] =
[
  {
    'PlatformID': 1,
    'PlatformName': '99designs',
    'ShortDescription': 'Marketplace for freelance designers.'
  },
  {
    'PlatformID': 2,
    'PlatformName': 'TaskRabbit',
    'ShortDescription': 'Marketplace for freelance gigs.'
  }
];

/**
 * Component
 */
export default class ExternalPlatformSuggestionsList extends Komponent {

     static get template() { return template; }

    /**
     * @param {object} params
     * @param {(number|KnockoutObservable<number>)} [params.userID] The user's ID that enables us to query suggested platforms specifically for them.
     */
    constructor(params) {
        super();

        /**
         * The userID the suggestions list is created for.
         * @member {KnockoutObservable<string>}
         */
        this.userID = getObservable(params.userID || -1);

        /**
         * An array of the platforms suggested.
         * @member {KnockoutObservable<array>}
         */
        this.suggestedPlatform = ko.observableArray();

        /**
         * When the userID changes, the information is 
         * updated for the specific user.
         */
        this.observeChanges(() => {
            const data = dummyData[this.userID()];
            this.suggestedPlatform(data);
        });
    }
}

ko.components.register(TAG_NAME, ExternalPlatformSuggestionsList);
