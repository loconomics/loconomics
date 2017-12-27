/**
 * Captures a user's email address and adds them to our newsletter list and
 * allows to refer service professionals.
 * @module kocomponents/lead-generation-refer
 */
'use strict';

import '../../../utils/autofocusBindingHandler';
import Komponent from '../../helpers/KnockoutComponent';
import STYLE from '../LeadGeneration.styl';
import TEMPLATE from './template.html';
import ko from 'knockout';
import leadGenerationApi from '../../../data/leadGeneration';
import { show as showError } from '../../../modals/error';
import { data as user } from '../../../data/userProfile';

const TAG_NAME = 'lead-generation-refer';

/**
 * Latest step in the process. That one can be repeated endlessly to refer
 * new professionals.
 * @const {number}
 */
var LAST_STEP = 3;

/**
 * Component view model
 */
class ViewModel extends Komponent {

    static get style() { return STYLE; }

    static get template() { return TEMPLATE; }

    constructor() {
        /* eslint max-statements:"off" */
        super();

        /**
         * Holds a list of objects with a 'dispose' methods that need to be called
         * when disposing the component (see `dispose` method).
         * @member {Array}
         */
        this.disposables = [];

        /// Form data
        /**
         * Holds the ID generated for the current anonymous user after register
         * itself at Step One
         * @member {KnockoutObservable<number>}
         */
        this.referredByUserID = ko.observable(0);
        /**
         * Holds the email user to register the current anonymous user after at
         * Step One
         * @member {KnockoutObservable<string>}
         */
        this.referredByEmail = ko.observable('');
        /**
         * @member {KnockoutObservable<string>}
         */
        this.email = ko.observable('');
        /**
         * @member {KnockoutObservable<boolean>}
         */
        this.isServiceProfessional = ko.observable(false);
        /**
         * @member {KnockoutObservable<string>}
         */
        this.firstName = ko.observable('');
        /**
         * @member {KnockoutObservable<string>}
         */
        this.lastName = ko.observable('');
        /**
         * @member {KnockoutObservable<string>}
         */
        this.phone = ko.observable('');

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
        this.isAtStepOne = ko.pureComputed(function() {
            return this.currentStep() === 1;
        }, this);
        /**
         * Whether current step is 2
         * @member {KnockoutComputed<boolean>}
         */
        this.isAtStepTwo = ko.pureComputed(function() {
            return this.currentStep() === 2;
        }, this);
        /**
         * Whether current step is 3
         * @member {KnockoutComputed<boolean>}
         */
        this.isAtStepThree = ko.pureComputed(function() {
            return this.currentStep() === 3;
        }, this);

        /// Statuses
        /**
         * @member {KnockoutObservable<boolean>}
         */
        this.isAnonymous = user.isAnonymous;
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
         * Whether the email has a valid format
         * @member {KnockoutComputed<boolean>}
         */
        this.isEmailValid = ko.pureComputed(function() {
            var emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
            return emailRegex.test(this.email());
        }, this);
        /// Manage data
        this.resetForm = function() {
            this.email('');
            this.firstName('');
            this.lastName('');
            this.phone('');
            this.isServiceProfessional(false);
        }.bind(this);
        /**
         * Automatically sets the 'isDone' flag to false whenever the form data
         * for last step is changed (after success request, the flag is set to
         * true, but needs to be reset so user can see the notification again next
         * time refers another professional)
         * @private
         */
        this.disposables.push(ko.computed(function() {
            // Detect changes to this fields:
            this.email();
            this.firstName();
            this.lastName();
            this.phone();
            // Reset flag
            this.isDone(false);
        }, this));
        /**
         * Automatically fills in the name of the logged user when reaching the
         * step 2; nothing for anonymous users
         * @private.
         */
        this.disposables.push(ko.computed(function() {
            // Detect when goes to step two being a logged use
            if (!user.isAnonymous() && this.currentStep() === 2) {
                // Fill in name, if any
                this.firstName(user.firstName());
                this.lastName(user.lastName());
            }
        }, this));

        /// Save methods and common utilities
        /**
         * Set-up values just before send a request
         * @private
         */
        var prepareSave = function() {
            this.isSaving(true);
            this.errorMessage(null);
        }.bind(this);
        /**
         * Perform common set-up after success saving and manage
         * the progress between steps
         * @private
         */
        var onSuccessSave = function() {
            this.isSaving(false);
            // Move next step
            var step = this.currentStep();
            if (step === LAST_STEP) {
                // Last step ('refer professional') can be repeated endlessly,
                // but need to reset current values
                this.resetForm();
                // Communicate that it ended successfully but can repeat
                this.isDone(true);
            }
            else {
                // Next step
                this.resetForm();
                this.currentStep(step + 1);
            }
        }.bind(this);
        /**
         * Manage an error throw by a save request attempt
         * @private
         */
        var onSaveError = function(err) {
            this.isSaving(false);
            return showError({
                error: err
            })
            .then(function(errorMessage) {
                this.errorMessage(errorMessage);
            }.bind(this));
        }.bind(this);
        /**
         * Sends the subscription request, step 1
         */
        this.saveStepOne = function() {
            // Prevent unwanted repeatitions:
            if (!this.isAtStepOne()) return;

            prepareSave();
            var data = {
                email: this.email(),
                isServiceProfessional: this.isServiceProfessional()
            };
            return leadGenerationApi.subscribeReferral(data)
            .then(function(data) {
                // Save the generated ID and the email used as 'referred'
                this.referredByEmail(this.email());
                this.referredByUserID(data.userID);
                // Clean-up and next step:
                onSuccessSave();
            }.bind(this))
            .catch(onSaveError);
        }.bind(this);
        /**
         * Sends an optional subscription update, step 2
         */
        this.saveStepTwo = function() {
            // Prevent unwanted repeatitions:
            if (!this.isAtStepTwo()) return;

            prepareSave();
            var data = {
                userID: this.referredByUserID(),
                email: this.referredByEmail(),
                firstName: this.firstName(),
                lastName: this.lastName()
            };
            return leadGenerationApi.updateSubscription(data)
            .then(onSuccessSave)
            .catch(onSaveError);
        }.bind(this);
        /**
         * Refer a professional, step 3 (repeatable)
         */
        this.saveStepThree = function() {
            // Prevent bad order:
            if (!this.isAtStepThree()) return;

            prepareSave();
            var data = {
                referredByUserID: this.referredByUserID(),
                referredByEmail: this.referredByEmail(),
                email: this.email(),
                firstName: this.firstName(),
                lastName: this.lastName(),
                phone: this.phone()
            };
            return leadGenerationApi.referAServiceProfessional(data)
            .then(onSuccessSave)
            .catch(onSaveError);
        }.bind(this);
        /**
         * Allows to move to second step without completing the first one, only
         * for logged users that actually don't need to first step.
         */
        this.goStepTwo = function() {
            if (!user.isAnonymous()) {
                this.currentStep(2);
            }
        }.bind(this);
    }

    /**
     * Performs clean-up of observables subscriptions and other used objects that
     * need disposal when the component instance is deleted
     * @member
     */
    dispose() {
        super.dispose();
        this.disposables.forEach(function(value) {
            try {
                value.dispose();
            }
            catch(ex) { }
        });
    }
}

ko.components.register(TAG_NAME, {
    template: TEMPLATE,
    viewModel: ViewModel
});
