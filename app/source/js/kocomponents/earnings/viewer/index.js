
/**
 * Used to view the details of an earnings entry.
 * 
 * @module kocomponents/earnings/viewer
 *
 */

import '../../../utils/autofocusBindingHandler';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'earnings-viewer';
const dummyData = {};
dummyData[123] ={
    'EarningsEntryID': 123,
    'Total': 320.00,
    'PaidDate': '1/15/2018', 
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

        this.observeChanges(() => {
            const data = dummyData[0];
            this.earningsEntry(data);
        });
    }
}

ko.components.register(TAG_NAME, EarningsViewer);

