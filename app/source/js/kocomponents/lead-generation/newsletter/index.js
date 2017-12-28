/**
 * Captures a user's email address and adds them to our newsletter list.
 * @module kocomponents/lead-generation-newsletter
 */
'use strict';

import '../../../utils/autofocusBindingHandler';
import Komponent from '../../helpers/KnockoutComponent';
import STYLE from '../LeadGeneration.styl';
import TEMPLATE from './template.html';
import ko from 'knockout';
import leadGenerationApi from '../../../data/leadGeneration';
import { show as showError } from '../../../modals/error';

const TAG_NAME = 'lead-generation-newsletter';

/**
 *
 * @class
 */
class ViewModel extends Komponent {
    constructor() {
        super();
        /**
         * CSS to style this component.
         * @member {string}
         */
        this.style = STYLE;
        /// Form data
        /**
         * @member {KnockoutObservable<string>}
         */
        this.email = ko.observable('');
        /**
         * @member {KnockoutObservable<boolean>}
         */
        this.isServiceProfessional = ko.observable(false);

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
         * When edition must be locked because of in progress operations,
         * and too after isDone.
         * @member {KnockoutComputed<boolean>}
         */
        this.isLocked = ko.pureComputed(function() {
            return this.isSaving() || this.isDone();
        }, this);
        /**
         * Whether the email has a valid format
         * @member {KnockoutComputed<boolean>}
         */
        this.isEmailValid = ko.pureComputed(function() {
            var emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
            return emailRegex.test(this.email());
        }, this);

        /// Methods
        /**
         * Sends the subscription request
         */
        this.save = function() {
            // Prevent unwanted repeatitions:
            if (this.isDone()) return;

            this.isSaving(true);
            var data = {
                email: this.email(),
                isServiceProfessional: this.isServiceProfessional()
            };
            return leadGenerationApi.subscribeNewsletter(data)
            .then(function() {
                this.isSaving(false);
                this.errorMessage(null);
                this.isDone(true);
            }.bind(this))
            .catch(function(err) {
                this.isSaving(false);
                return showError({
                    error: err
                })
                .then(function(errorMessage) {
                    this.errorMessage(errorMessage);
                }.bind(this));
            }.bind(this));
        }.bind(this);
    }
}

ko.components.register(TAG_NAME, {
    template: TEMPLATE,
    viewModel: ViewModel
});
