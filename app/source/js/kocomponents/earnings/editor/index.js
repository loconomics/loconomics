
/**
 * Example of a basic Knockout Component that uses the helper KnockoutComponent
 * and ES6 class syntax to define it.
 *
 * @module kocomponents/_examples/b-basic-komponent
 *
 * FIXME: Update this component description
 * FIXME: Document parameters allowed using jsdoc syntax in the constructor,
 * or if there is no one, at this initial commit
 * FIXME: Keep code, members, methods documented, using jsdoc and inline comments
 * so code keeps clear; but code that just overwrite an inherit member (like
 * template) does not need a comment except some additional thing should be
 * noted; same if some comment looks repeatitive or not helpfull (like the
 * register line).
 */

import '../../../utils/autofocusBindingHandler';
import Komponent from '../../helpers/KnockoutComponent';
// import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import template from './template.html';
// FIXME: If the component uses in the template other components, you need
// to import them from here, like
// import '../another/component';

const TAG_NAME = 'earnings-editor';
const dummyData = {};
dummyData[0] ={
    'total': null,
    'date': null,
    'duration': null,
    'platformID': null,
    'jobTitleID': null,
    'notes': null,
    'clientID': null,
    'clientFirstName': null,
    'clientLastName': null,
    'clientEmail': null,
    'clientPhoneNumber': null
};
dummyData[123] ={
    'total': 320.00,
    'date': '1/15/2018', 
    'duration': 180,
    'platformID': 2,
    'jobTitleID': 106,
    'notes': 'Really enjoyed meeting Kyra and hope to work with her again.',
    'clientID': 141,
    'clientFirstName': 'Kyra',
    'clientLastName': 'Harrington',
    'clientEmail': 'kyra@loconomics.com',
    'clientPhoneNumber': '4159026022'
};


/**
 * Component
 */
export default class EarningsEditor extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {(string|KnockoutObservable<string>)} [params.name=World] A name for the greating.
     * @param {function<number,void>} [params.onCount] Callback executed each time the 'count'
     * button is executed with the current counter.
     */
    constructor(params) {
        super();
    
        /// Form data
        /**
         * Holds the ID generated for the current anonymous user after register
         * itself at Step One
         * @member {KnockoutObservable<number>}
         */
        this.earningsEntryID = ko.observable(0);
        /**
         * Holds the email user to register the current anonymous user after at
         * Step One
         * @member {KnockoutObservable<number>}
         */
        this.total = ko.observable(null);
        /**
         * @member {KnockoutObservable<date>}
         */                 
        this.date = ko.observable('');
        /**
         * @member {KnockoutObservable<number>}
         */
        this.duration = ko.observable(0);
        /**
         * @member {KnockoutObservable<number>}
         */
        this.platformID = ko.observable(0);
        /**
         * @member {KnockoutObservable<string>}
         */
        this.notes = ko.observable('');
        /**
         * @member {KnockoutObservable<number>}
         */
        this.clientID = ko.observable(0);
        /**
         * @member {KnockoutObservable<string>}
         */
        this.clientFirstName = ko.observable('');
        /**
         * @member {KnockoutObservable<string>}
         */
        this.clientLastName = ko.observable('');
        /**
         * @member {KnockoutObservable<string>}
         */
        this.clientEmail = ko.observable('');
        /**
         * @member {KnockoutObservable<string>}
         */
        this.clientPhoneNumber = ko.observable('');

        /**
         * Earnings summary returned given query parameters.
         * @member {KnockoutObservable<array>}
         */
        this.earningsEntry = ko.observableArray();

        /// Steps management
        /**
         * Keep track of current step being displayed
         * @member {KnockoutObservable<number>}
         */
        this.currentStep = ko.observable(1);
        /**
         * Whether current step is 1
         * @member {KnockoutComputed<boolean>}
         */
        this.isAtStep = function(number) {
            return ko.pureComputed( () => this.currentStep() === number);
        }; 
        /**
         * Whether current step is 1
         * @member {KnockoutComputed<boolean>}
         */
        this.goNextStep = function() {
            this.currentStep(this.currentStep() + 1);
        }; 
        /// Statuses
        /**
         * Whether a subscription request was already and successfully sent
         * @member {KnockoutObservable<boolean>}
         */
        this.isDone = ko.observable(false);
        /**
         * Error message from last 'save' operation
         * @member {KnockoutObservable<string>}
         */
        this.errorMessage = ko.observable('');
        /**
         * When a saving request it's on the works
         * @member {KnockoutObservable<boolean>}
         */
        this.isSaving = ko.observable(false);
        /**
         * When edition must be locked because of in progress operations.
         * Just an alias for saving in this case, but expected to be used properly
         * at the data-binds
         * @member {KnockoutComputed<boolean>}
         */
        this.isLocked = this.isSaving;
        /**
         * Internal counter for how many times pressed the button
         * @member {KnockoutObservable<number>}
         */
        this.counter = ko.observable(0);
        /**
         * Optional callback for external notifications on clicking 'count'
         */
        this.onCount = params.onCount || undefined;

        // FIXME: A callback is usual to notify some event, but on this case
        // we could allow the 'counter' being provided externally as an
        // observable (like the 'name') and reset the number at constructor.
        this.observeChanges(() => {
            const data = dummyData[0];
            this.earningsEntry(data);
        });
    }

    /**
     * Increases the counter and notify through callback
     */
    count() {
        this.counter(this.counter() + 1);
        if (this.onCount) {
            this.onCount(this.counter());
        }
    }
}

// FIXME: Just reminder that EVER should register the component with this line
// at the end, but don't need a comment (remove me!)
ko.components.register(TAG_NAME, EarningsEditor);

