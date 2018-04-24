/**
 * Allows a professional to register or manage a badge.
 *
 * @module kocomponents/badge/editor
 */

import '../../utilities/icon-dec.js';
import Komponent from '../../helpers/KnockoutComponent';
import UserBadge from '../../../models/UserBadge';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
import { show as showConfirm } from '../../../modals/confirm';
import { show as showError } from '../../../modals/error';
import template from './template.html';
import { item as userBadgeItem } from '../../../data/userBadges';

const TAG_NAME = 'badge-editor';

/**
 * Component
 */
export default class BadgeEditor extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     * @param {(number|KnockoutObservable<number>)}
     * [params.jobTitleID]
     * @param {(number|KnockoutObservable<number>)}
     * [params.userBadgeID]
     * @param {function} [params.onSaved] Callback triggered after succesfull save operation.
     * @param {function} [params.onDeleted] Callback triggered after succesfull delete operation.
     */
    constructor(params) {
        super();

        /**
         * Editable userBadge model.
         * Same instance is used all the time, just
         * updating content, simplifying working with the form and summary.
         * @member {UserBadge}
         */
        this.userBadge = new UserBadge({
            userBadgeID: ko.unwrap(params.userBadgeID) || 0
        });

        /**
         * Holds the ID for the job title of the badge being
         * added.
         * NOTE: This happens indirectly, no jobTitleID field exist at the
         * userBadge, but this is used to being able to display info about the
         * listing where the user wants to add/edit this badge
         * @member {KnockoutObservable<number>}
         */
        this.jobTitleID = getObservable(params.jobTitleID);

        /**
         * Callback executed after a succesfully 'save' task, providing
         * the updated data.
         * When there is no one, the data returned by the server is used to
         * update currently displayed data.
         * @member {Function<rest/userBadge>}
         */
        this.onSaved = ko.unwrap(params.onSaved);

        /**
         * Callback executed after a succesfully 'delete' task.
         * When there is no one, the current data and ID are cleared.
         * @member {Function}
         */
        this.onDeleted = ko.unwrap(params.onDeleted);

        /**
         * Keeps a timestamp of the loaded data, allowing to track when there
         * are changes.
         * @member {Date}
         */
        this.dataTimestamp = ko.observable(this.userBadge.model.dataTimestamp());

        this.__setupStatusFlags();

        /**
         * Whether there are changes not saved.
         * @member {KnockoutComputed<boolean>}
         */
        this.hasUnsavedChanges = ko.pureComputed(() => {
            var c = this.userBadge;
            return c && this.dataTimestamp() !== c.model.dataTimestamp();
        });

        /**
         * Dynamic label text for the 'save' button
         * @member {KnockoutComputed<string>}
         */
        this.saveButtonLabel = ko.pureComputed(() => {
            const text = this.isSaving() ? 'Saving...' : 'Save';
            return text;
        });

        /**
         * Dynamic label text for the 'delete' button
         * @member {KnockoutComputed<string>}
         */
        this.deleteButtonLabel = ko.pureComputed(() => {
            const text = this.isDeleting() ? 'Deleting...' : 'Delete';
            return text;
        });

        this.__connectData();
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
        this.isNew = ko.pureComputed(() => this.userBadge.userBadgeID() === 0);
    }

    /**
     * Define members, prepare subscriptions to work with the code
     * and start any initial request for data
     * @private
     */
    __connectData() {
        /**
         * Displays the error returned while loading the data
         * @param {Error} err
         */
        const loadingError = function(error) {
            showError({
                title: 'There was an error loading the badge/collection',
                error
            });
        };

        /**
         * We create an item manager to operate on the data for the requested ID
         * (allows to load, save, delete).
         */
        this.dataManager = userBadgeItem(this.userBadge.userBadgeID());

        // When we have an ID, we need to load it first
        if (this.userBadge.userBadgeID()) {
            this.isLoading(true);

            this.dataManager.onceLoaded()
            .then((data) => {
                this.isLoading(false);
                this.userBadge.model.updateWith(data);
                this.dataTimestamp(this.userBadge.model.dataTimestamp());
            })
            .catch((error) => {
                this.isLoading(false);
                loadingError(error);
            });
        }
    }

    /**
     * Save current form data
     */
    save() {
        // Prevent twice execution
        if (this.isSaving()) return Promise.reject();

        this.isSaving(true);

        const data = this.userBadge.model.toPlainObject(true);

        /// IMPORTANT: Bagdr.io specific set-up
        // TODO: Make code service provider independent (other OpenBadges services rather than Badgr.io)
        // That can involve to, rather than analyze the URL, fetch it and check the version and type of
        // the result.

        // Convert badgr URL to v 2.0 and assign type based on URL
        let src = this.userBadge.badgeURL();
        if(src && src.match(/\/assertions\//i)) {
            src = src.replace(/\?v=.+$/, '?v=2_0');
            data.type = 'badge';
        }
        else if (src && src.match(/\/collections\//i)) {
            data.type = 'collection';
        }
        else {
            this.isSaving(false);
            showError({
                title: 'Invalid data',
                error: 'Please enter a valid Badgr URL'
            });
            return Promise.reject();
        }
        data.badgeURL = src;

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
                this.userBadge.model.updateWith(freshData);
                this.dataTimestamp(this.userBadge.model.dataTimestamp());
            }
        })
        .catch((error) => {
            this.isSaving(false);
            showError({
                title: 'There was an error saving your changes',
                error
            });
        });
    }

    /**
     * Request to delete the current entry, with user confirmation.
     * It triggers 'onDeleted' param, or remove current data and ID.
     * @returns {Promise}
     */
    confirmDelete() {
        if (this.isDeleting() || this.isNew()) return Promise.reject();

        this.isDeleting(true);

        return showConfirm({
            title: 'Are you sure?',
            message: `Delete ${this.userBadge.type()}`,
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
                this.userBadge.model.reset();
                this.dataManager = userBadgeItem(0);
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

ko.components.register(TAG_NAME, BadgeEditor);
