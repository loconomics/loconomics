
/**
 * Used to view the details of an earnings entry.
 * 
 * @module kocomponents/earnings/viewer
 *
 */

import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'earnings-viewer';
const dummyData = {};
dummyData[1] ={
    'EarningsEntryID': 1,
    'PaidDate': '12/31/2017',
    'Total': 320.00,
    'Duration': 180,
    'PlatformID': 2,
    'JobTitleID': 106,
    'Notes': 'Really enjoyed meeting Kyra and hope to work with her again.',
    'ClientID': 141,
    'ClientFirstName': 'Kyra',
    'ClientLastName': 'Harrington',
    'ClientEmail': 'kyra@loconomics.com',
    'ClientPhoneNumber': '4159026022'
};


/**
 * Component
 */
export default class EarningsViewer extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {(number|KnockoutObservable<number>)} 
     * [params.earningsEntryID]
     */
    constructor(params) {
        super();

        /**
         * Holds the ID for the earnings entry being viewed.
         * @member {KnockoutObservable<number>}
         */
        this.earningsEntryID = getObservable(params.earningsEntryID || null);

        /**
         * Earnings entry returned for a given ID.
         * @member {KnockoutObservable<object>}
         */
        this.earningsEntry = ko.observable();

        this.observeChanges(() => {
            const data = dummyData[this.earningsEntryID()];
            this.earningsEntry(data);
        });
    }
}

ko.components.register(TAG_NAME, EarningsViewer);

