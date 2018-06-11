/**
 * Edit the user basic contact information, that may be available publicly.
 *
 * @module kocomponents/profile/contact-info-editor
 */
import Komponent from '../../helpers/KnockoutComponent';
import User from '../../../models/User';
import countriesOptions from '../../../viewmodels/CountriesOptions';
import ko from 'knockout';
import onboarding from '../../../data/onboarding';
import phoneValidationRegex from '../../../utils/phoneValidationRegex';
import { show as showError } from '../../../modals/error';
import template from './template.html';
import userData from '../../../data/userProfile';

const TAG_NAME = 'profile-contact-info-editor';

/**
 * Component
 */
export default class ProfileContactInfoEditor extends Komponent {

    static get template() { return template; }

    /**
     *
     * @param {Object} params
     * @param {Function<rest/User>} [params.onSaved] Callback executed once
     * changes are saved successfully, with plain copy of the data
     */
    constructor(params) {
        super();

        /**
         * Holds an editable copy of the user data.
         * It's initialized with the currently cached information for the user,
         * but at '__connect' we will ensure we have up-to-date data.
         * @member {User}
         */
        this.data = new User(userData.data.model.toPlainObject(true));

        /**
         * Optional callback to communicate when the changes where successfully
         * saved, receiving a plain copy of the data as single parameter
         * @member {Function}
         */
        this.onSave = params.onSave;

        this.__setupStatusFlags();

        this.submitText = ko.pureComputed(() => {
            const inProgress = onboarding.inProgress();
            return inProgress ?
                'Save and continue' :
                this.isSaving() ?
                    'Saving...' :
                    'Save';
        });

        this.__setupValidations();
        this.__connectData();
    }

    __connectData() {
        // Request to load data, in case the initial one is empty or require cache revalidation
        userData.load()
        .then((data) => {
            this.data.model.updateWith(data, true);
        })
        .catch((error) => showError({
            title: 'Unable to load your contact info',
            error
        }));
    }

    /**
     * Define members for all the status flags needed.
     * @private
     */
    __setupStatusFlags() {
        /**
         * When a loading request it's on the works
         * @member {KnockoutObservable<boolean>}
         */
        this.isLoading = ko.observable(false);

        /**
         * When a saving request it's on the works
         * @member {KnockoutObservable<boolean>}
         */
        this.isSaving = ko.observable(false);

        /**
         * When edition must be locked because of in progress
         * operations.
         * @member {KnockoutComputed<boolean>}
         */
        this.isLocked = ko.pureComputed(() => this.isSaving() || this.isLoading());
    }

    /**
     * Set-up members and triggers related to validate the form fields
     */
    __setupValidations() {
        /**
         * Whether validation was already run almost once. Helps prevent displaying
         * error messages too early (when still starting to input data) while
         * allowing for instant feedback once is fixing any highlighted errors.
         * @member {KnockoutObservable<boolean>}
         */
        this.isFormValidated = ko.observable(false);
        /**
         * Whether the typed first name is valid
         * @member {KnockoutComputed<boolean>}
         */
        this.isFirstNameValid = ko.pureComputed(() => {
            // \p{L} the Unicode Characterset not supported by JS
            var firstNameRegex = /^(\S{2,}\s*)+$/;
            return firstNameRegex.test(this.data.firstName());
        });
        /**
         * Whether the typed last name is valid
         * @member {KnockoutComputed<boolean>}
         */
        this.isLastNameValid = ko.pureComputed(() => {
            var lastNameRegex = /^(\S{2,}\s*)+$/;
            return lastNameRegex.test(this.data.lastName());
        });
        /**
         * Whether the typed phone is valid
         * @member {KnockoutComputed<boolean>}
         */
        this.isPhoneValid = ko.pureComputed(() => {
            var isUSA = this.data.countryID() === countriesOptions.unitedStates.id;
            var phoneRegex = isUSA ? phoneValidationRegex.NORTH_AMERICA_PATTERN : phoneValidationRegex.GENERAL_VALID_CHARS;
            return phoneRegex.test(this.data.phone());
        });
    }

    /**
     * Checks validation rules for each field, returning the list of errors
     * per field in the same format as a server 'Bad Request' or null if success
     * @returns {BadRequestResult}
     */
    validate() {
        var errors = {};
        if (!this.isFirstNameValid()) {
            errors.firstName = 'First name is two short';
        }
        if (!this.isLastNameValid()) {
            errors.lastName = 'Last name is too short';
        }
        if (!this.isPhoneValid()) {
            errors.phone = this.data.phone() ? 'Given phone is not valid' : 'Phone is required';
        }
        this.isFormValidated(true);
        if (Object.keys(errors).length === 0) {
            return null;
        }
        else {
            return {
                errorMessage: 'Please fix these issues and try again:',
                errorSource: 'validation',
                errors: errors
            };
        }
    }

    save() {
        var errors = this.validate();
        if (!errors) {
            return userData.save(this.data.model.toPlainObject(true))
            .then((updatedData) => {
                if (this.onSave) {
                    this.onSave(updatedData.model.toPlainObject(true));
                }
                else {
                    this.data.model.updateWith(updatedData, true);
                }
            })
            .catch(function(err) {
                return showError({
                    title: 'Unable to save your contact info',
                    error: err
                });
            });
        }
        else {
            return showError({
                title: 'Unable to save your contact info',
                error: errors
            });
        }
    }
}

ko.components.register(TAG_NAME, ProfileContactInfoEditor);

/**
 * @typedef {Object} ValidationErrorsDictionary
 * @property {Array<string>} FieldKey Every property matches a field name and
 * contains all errors for it, then there is not a list of properties since
 * is dynamic
 */
/**
 * @typedef BadRequesResult
 * @property {string} errorMessage
 * @property {string} errorSource
 * @property {Array<ValidationErrorsDictionary>} errors
 */
