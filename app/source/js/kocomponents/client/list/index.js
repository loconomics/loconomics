/**
 * Diplays a list of a professional's clients, and, depending on the
 * mode, allows the ability to select a client to be used in other
 * activities.
 *
 * @module kocomponents/client/list
 */

import '../../utilities/icon-dec';
import Komponent from '../../helpers/KnockoutComponent';
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
     * @param {Function<rest/Client>} [params.selectItem] Callback with the data for the client
     * selected by the user
     */
    constructor(params) {
        super();

        /**
         * @method selectItem
         */
        this.selectItem = params.selectItem;

        /**
         * Client list.
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
