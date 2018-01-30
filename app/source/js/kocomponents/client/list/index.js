/**
 * Diplays a list of a professional's clients, and, depending on the 
 * mode, allows the ability to select a client to be used in other 
 * activities.
 *
 * @module kocomponents/client/list
 *
 */

import '../../utilities/icon-dec';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'client-list';
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
  },
  {
    'clientUserID': 2,  
    'firstName': 'Kyra',
    'lastName': 'Harrington',
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
  },
  {
    'clientUserID': 3,  
    'firstName': 'Iago',
    'lastName': 'Lorenzo',
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
export default class ClientList extends Komponent {

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

        if (typeof(params.selectItem) !== 'function') {
          throw new Error('A selectItem callback is required');
        }
        
        /**
         * @method selectItem
         */
        this.selectItem = params.selectItem;

        /**
         * Earnings summary returned given query parameters.
         * @member {KnockoutObservable<array>}
         */
        this.clientList = ko.observableArray();

        this.observeChanges(() => {
            const data = dummyData[0];
            this.clientList(data);
        });
    }
}

ko.components.register(TAG_NAME, ClientList);
