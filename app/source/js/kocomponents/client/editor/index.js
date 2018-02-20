/**
 * Allows a professional to add or edit a client's information.
 *
 * @module kocomponents/client/editor
 * TODO: services/offerings, validations and public search (migrate from original
 * clientEditor.js activity, and replace that code with an instance of this)
 */

import '../../utilities/icon-dec';
import Client from '../../../models/Client';
import Komponent from '../../helpers/KnockoutComponent';
import { item as clientsDataItem } from '../../../data/clients';
import ko from 'knockout';
import { show as showConfirm } from '../../../modals/confirm';
import { show as showError } from '../../../modals/error';
import template from './template.html';

const TAG_NAME = 'client-editor';

/**
 * Component
 */
export default class ClientEditor extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param  {KnockoutObservable<integer>} [params.clientUserID] ID to edit or
     * zero for new.
     * @param {function} [params.onSaved] Callback to notify after save the item, with the updated data included
     * @param {function} [params.onDeleted] Callback to notify after delete the item
     */
    constructor(params) {
        super();

        /**
         * Editable client model.
         * Same instance is used all the time, just
         * updating content, simplifying working with the form and summary.
         * @member {Client}
         */
        this.client = new Client({
            clientUserID: ko.unwrap(params.clientUserID) || 0
        });

        /**
         * Callback executed when the form is saved successfully, giving
         * a copy of the server data
         * @member {function}
         */
        this.onSaved = params.onSaved;

        /**
         * Callback executed when the entry was deleted successfully
         * @member {function}
         */
        this.onDeleted = params.onDeleted;

        /**
         * Keeps a timestamp of the loaded data, allowing to track when there
         * are changes.
         * @member {Date}
         */
        this.dataTimestamp = ko.observable(this.client.model.dataTimestamp());

        this.__setupBirthMembers();

        this.__setupStatusFlags();

        /**
         * Whether there are changes not saved.
         * @member {KnockoutComputed<boolean>}
         */
        this.hasUnsavedChanges = ko.pureComputed(() => {
            var c = this.client;
            return c && this.dataTimestamp() !== c.model.dataTimestamp();
        });

        /**
         * Label for the 'save' button.
         * It's dynamic depending on current status an available changes.
         * @member {KnockoutComputed<string>}
         */
        this.saveButtonText = ko.pureComputed(() => {
            const text = (
                this.isLoading() ?
                    'Loading...' :
                    this.isSaving() ?
                        'Saving changes' :
                        this.isNew() ?
                            'Add client' :
                            this.hasUnsavedChanges() ?
                                'Save changes to client' :
                                'Client saved'
            );
            return text;
        });

        /**
         * Label for the 'delete' button
         * @member {KnockoutComputed<string>}
         */
        this.deleteButtonText = ko.pureComputed(() => {
            const text = (
                this.isDeleting() ?
                    'Deleting client...' :
                    'Delete client'
            );
            return text;
        });

        /**
         * Dynamic label for the legend grouping contact information fields
         * (basic fields)
         * @member {KnockoutComputed<string>}
         */
        this.contactInfoLegend = ko.pureComputed(() => {
            var name = this.client.firstName() || 'Client';
            return `${name}'s contact information`;
        });

        /**
         * Dynamic label for the legend grouping additional information fields
         * (expanded fields)
         * @member {KnockoutComputed<string>}
         */
        this.moreInfoLegend = ko.pureComputed(() => {
            var name = this.client.firstName() || 'Client';
            return `${name}'s additional information`;
        });

        /**
         * Dynamic label for the group of fields 'birthday'
         * @member {KnockoutComputed<string>}
         */
        this.birthdayGroupLabel = ko.pureComputed(() => {
            var name = this.client.firstName() || 'Client';
            return `${name}'s birthday`;
        });

        /**
         * Dynamic label for the notes fields
         * @member {KnockoutComputed<string>}
         */
        this.notesLabel = ko.pureComputed(() => {
            var name = this.client.firstName() || 'client';
            return `Notes about ${name}`;
        });

        /**
         * Whether the 'additional information' section should be displayed.
         * By default is hidden for new users, visible for existent users.
         * Reasoning: hidden when adding allows for a quick-add of a client
         * without distractions, specially when is being used just to create
         * a user that is being selected at another entity, as an earnings entry
         * or a service professional appointment.
         * @member {KnockoutObservable<boolean>}
         */
        this.isMoreVisible = ko.observable(params.clientUserID > 0);

        /**
         * Let's switch the isMoreVisible flag in order to display the
         * 'additional information' fields.
         * @method
         */
        this.showMore = () => {
            this.isMoreVisible(true);
        };

        this.__setupDataOperations();
    }

    /**
     * Define members for data, display and management of Birth month and day
     * @private
     */
    __setupBirthMembers() {
        /**
         * @typedef Month
         * @member {number} id Month number from 1 to 12
         * @member {string} name Month full name
         */

        /**
         * All months, as id and name objects.
         * @member {KnockoutObservableArray<Month>}
         * TODO: l10n
         */
        this.months = ko.observableArray([
            { id: 1, name: 'January'},
            { id: 2, name: 'February'},
            { id: 3, name: 'March'},
            { id: 4, name: 'April'},
            { id: 5, name: 'May'},
            { id: 6, name: 'June'},
            { id: 7, name: 'July'},
            { id: 8, name: 'August'},
            { id: 9, name: 'September'},
            { id: 10, name: 'October'},
            { id: 11, name: 'November'},
            { id: 12, name: 'December'}
        ]);

        /**
         * Give us which month is selected and let us change it.
         * @member {KnockoutComputed<Month>}
         */
        this.selectedBirthMonth = ko.computed({
            read: () => {
                var birthMonth = this.client.birthMonth();
                return birthMonth ? this.months()[birthMonth - 1] : null;
            },
            write: (month) => {
                this.client.birthMonth(month && month.id || null);
            }
        });

        /**
         * All month days (numbers from 1 to 31)
         * @member {KnockoutObservableArray<number>}
         */
        this.monthDays = ko.observableArray([]);
        // Filling automatically the month days
        for (var iday = 1; iday <= 31; iday++) {
            this.monthDays.push(iday);
        }
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
         * When a deletion request it's on the works
         * @member {KnockoutObservable<boolean>}
         */
        this.isDeleting = ko.observable(false);

        /**
         * Whether edition must be locked because of in progress
         * operations.
         * @member {KnockoutComputed<boolean>}
         */
        this.isLocked = ko.pureComputed(() => this.isSaving() || this.isLoading() || this.isDeleting());

        /**
         * Whether the item is a new record or is being edited.
         * @member {KnockoutObservable<boolean>}
         */
        this.isNew = ko.pureComputed(() => this.client.clientUserID() === 0);

        /**
         * Whether edition must be locked because the client data is read-only;
         * this excludes fields that are only for the service-professional
         * about the client.
         * @member {KnockoutComputed<boolean>}
         */
        this.isReadOnly = ko.pureComputed(() => !!(this.client.clientUserID() && !this.client.editable()));
    }

    /**
     * Define members, prepare subscriptions to work with the code
     * and start any initial request for data
     * @private
     */
    __setupDataOperations() {
        /**
         * We create an item manager to operate on the data for the requested ID
         * (allows to load, save, delete).
         */
        this.dataManager = clientsDataItem(this.client.clientUserID());

        // When we have an ID, we need to load it first
        if (this.client.clientUserID()) {
            this.isLoading(true);

            this.dataManager.onceLoaded()
            .then((data) => {
                this.isLoading(false);
                this.client.model.updateWith(data);
                this.dataTimestamp(this.client.model.dataTimestamp());
            })
            .catch((error) => {
                this.isLoading(false);
                showError({
                    title: 'There was an error loading the client data',
                    error
                });
            });
        }
    }

    /**
     * Save data in the server
     * @returns {Promise<object>}
     */
    save() {
        if (this.isSaving()) return Promise.reject();

        this.isSaving(true);

        const data = this.client.model.toPlainObject(true);

        return this.dataManager
        .save(data)
        .then((freshData) => {
            this.isSaving(false);
            if (this.onSaved) {
                // Notify
                this.onSaved(freshData);
            }
            else {
                // Use updated/created data
                this.client.model.updateWith(freshData);
                this.dataTimestamp(this.client.model.dataTimestamp());
            }
        })
        .catch((error) => {
            this.isSaving(false);
            showError({
                title: 'There was an error saving the client details',
                error
            });
        });
    }

    /**
     * Delete the entry being edited after confirmation
     * @returns {Promise}
     */
    confirmDelete() {
        if (this.isDeleting()) return Promise.reject();

        this.isDeleting(true);

        return showConfirm({
            title: 'Are you sure?',
            message: `Delete client ${this.client.fullName()}`,
            yes: 'Delete',
            no: 'Keep'
        })
        .then(() =>  this.dataManager.delete())
        .then(() => {
            this.isDeleting(false);
            if (this.onDeleted) {
                // Notify
                this.onDeleted();
            }
            else {
                // Reset to new item
                this.client.model.reset();
                this.dataManager = clientsDataItem(0);
            }
        })
        .catch((error) => {
            this.isDeleting(false);
            if (error) {
                showError({
                    title: 'There was an error deleting the client entry',
                    error
                });
            }
        });
    }
}

ko.components.register(TAG_NAME, ClientEditor);
