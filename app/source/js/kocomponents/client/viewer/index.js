/**
 * Allows a professional to add or edit a client's information.
 *
 * @module kocomponents/client/viewer
 *
 */

import '../../utilities/icon-dec';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'client-viewer';
const dummyData = {};
dummyData[0] =
[
  {
    'clientUserID': 1,  
    'firstName': 'Joshua',
    'lastName': 'Danielson',
    'secondLastName': '',
    'email': 'joshdanielson@gmail.com',
    'phone': 4159026025,
    'canReceiveSms': true,
    'birthMonthDay': 10,
    'birthMonth': 12,
    'notesAboutClient': 'tall and detail-oriented', 
    'createdDate': '12/10/2017',
    'updatedDate': '12/10/2017',
    'editable': false,
    'deleted': false
  }
];


/**
 * Component
 */
export default class ClientViewer extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {(string|KnockoutObservable<string>)} [params.name=World] A name for the greating.
     * @param {function<number,void>} [params.onCount] Callback executed each time the 'count'
     * button is executed with the current counter.
     */
    constructor(params) {
        super();

        /**
         * A job title for the summary query. Defualt value is all job titles.
         * @member {KnockoutObservable<integer>}
         */
        this.userID = getObservable(params.userID);

        /**
         * Captures from the activity which "mode" the editor
         * component is to be used. 
         * View: 
         * Select:
         * Summary:
         * @member {KnockoutObservable<string>}
         */
        this.listMode = getObservable(params.listMode || 'View');

        /**
         * Earnings summary returned given query parameters.
         * @member {KnockoutObservable<object>}
         */
        this.client = ko.observable([]);

        this.observeChanges(() => {
            const data = dummyData[0];
            this.client(data);
        });
    }
}

ko.components.register(TAG_NAME, ClientViewer);
