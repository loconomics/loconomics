
/**
 * Used for adding, editing, and copying earnings entries.
 * @module kocomponents/earnings/editor
 *
 */

import '../../client/editor';
import '../../client/list';
import '../../utilities/icon-dec';
import '../../input/duration';
import '../../../utils/autofocusBindingHandler';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import template from './template.html';

const TAG_NAME = 'earnings-editor';
const dummyData = {};
dummyData[0] =
{
    'Total': 0.00,
    'PaidDate': null,
    'Duration': 60,
    'PlatformID': null,
    'JobTitleID': null,
    'Notes': null,
    'ClientID': null,
    'ClientFirstName': null,
    'ClientLastName': null,
    'ClientEmail': null,
    'ClientPhoneNumber': null
};
dummyData[1] =
{
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
export default class EarningsEditor extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {KnockoutObservable<string>}
     * [params.editorMode]
     * @param {KnockoutObservable<integer>}
     * [params.earningsEntryID]
     * @param {KnockoutObservable<integer>}
     * [params.platformID]
     * @param {KnockoutObservable<integer>}
     * [params.startAtStep]
     */
    constructor(params) {
        super();
        
        /**
         * Captures from the activity which "mode" the editor
         * component is to be used. 
         * add: no values 
         * edit:
         * copy:
         * @member {KnockoutObservable<string>}
         */
        this.editorMode = getObservable(params.editorMode);
    
        /**
         * Holds the ID for an earnings entry if being edited or 
         * copied.
         * @member {KnockoutObservable<number>}
         */
        this.earningsEntryID = getObservable(params.earningsEntryID || 0);

        /**
         * @member {KnockoutObservable<number>}
         */
        this.clientID = ko.observable(0);
        
        /**
         * Holds the ID for a platform if being added from the
         * external-listing-view activity.
         * @member {KnockoutObservable<number>}
         */
        this.platformID = getObservable(params.platformID || null);

        /**
         * Client returned given query parameters.
         * @method
         */
        this.selectClient = function(client) {
            this.clientID(ko.unwrap(client.clientID));
            this.goToSummary();
        }.bind(this);

        /**
         * Earnings entry returned given query parameters.
         * @member {KnockoutObservable<object>}
         */
        this.earningsEntry = ko.observable(null);

        /// Steps management
        /**
         * Keeps track of the current step being displayed
         * @member {KnockoutObservable<integer>}
         */
        this.currentStep = getObservable(params.startAtStep || 1);

        /**
         * Returns which step the user is on in the form.
         * @member {KnockoutComputed<boolean>}
         */
        this.isAtStep = function(number) {
            return ko.pureComputed( () => this.currentStep() === number);
        }; 

        /**
         * Takes the user to the next step in the form.
         * @member {KnockoutComputed<number>}
         */
        this.goNextStep = function() {
            this.currentStep(this.currentStep() + 1);
        }; 

        this.goToStep = (step) => {
            this.currentStep(step);
        };

        this.goToSummary = function() {
            this.currentStep(0);
            this.editorMode('edit');
            this.stepButtonLabel = 'Save';
        }; 

         /**
         * Takes the user to the next step in the form.
         * @member {KnockoutComputed<string>}
         */
        this.stepButtonLabel = ko.pureComputed( () => {
            if (this.editorMode() == 'add') {
                return 'Save and Continue';
            }
            else {
                return 'Save';
            }
        }); 
        
        /**
         * Takes the user to the next step in the form.
         * @member {KnockoutComputed<number>}
         */
        this.saveStep = function() {
            if (this.editorMode() == 'add') {
                this.goNextStep();
            }
            else {
                this.currentStep(0);
            }
        }; 

        /// Statuses

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
         * When edition must be locked because of in progress 
         * operations. Just an alias for saving in this case, but 
         * expected to be used properly at the data-binds
         * @member {KnockoutComputed<boolean>}
         */
        this.isLocked = this.isSaving;
 
        this.observeChanges(() => {
            const data = dummyData[this.earningsEntryID()];
            this.earningsEntry(data);
        });
    }
}

ko.components.register(TAG_NAME, EarningsEditor);

