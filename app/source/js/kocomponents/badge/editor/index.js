/**
 * Allows a professional to add or edit information about a
 * listing on an external platform.
 *
 * @module kocomponents/badge/editor
 */

import '../../utilities/icon-dec.js';
import Komponent from '../../helpers/KnockoutComponent';
import getObservable from '../../../utils/getObservable';
import ko from 'knockout';
// import { show as showConfirm } from '../../../modals/confirm';
import { show as showError } from '../../../modals/error';
import template from './template.html';
// import { item as userBadgeItem } from '../../../data/userBadges';

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
     */

    constructor(params) {
        super();
        /// Form data
        /**
         * Holds the ID for the badge being
         * edited.
         * @member {KnockoutObservable<number>}
         */
        this.userBadgeID = getObservable(params.userBadgeID);

        /**
         * Holds the ID for the job title of the badge being 
         * added.
         * @member {KnockoutObservable<number>}
         */
        this.jobTitleID = getObservable(params.jobTitleID);


        /**
         * Holds the data of the badge or collection.
         * @member {KnockoutObservable<object>}
         */
        this.userBadge = ko.observable(null);
 
        /**
         * Holds the data of the badgr source – can be 
         * either a badge or collection.
         * @member {KnockoutObservable<string>}
         */
        this.badgrURL = ko.observable(null);

        /**
         * Holds the type of URL being input – could be a 
         * badge or collection.
         * @member {KnockoutObservable<string>}
         */
        this.type = ko.observable('badge');

        /**
         * Callback executed after a succesfully 'save' task, providing
         * the updated data.
         * When there is no one, the data returned by the server is used to
         * update currently displayed data.
         * @member {Function<rest/userBadge>}
         */
        this.onSaved = ko.unwrap(params.onSaved);

        /**
         * State flag for the 'save' task
         * @member {KnockoutObservable<boolean>}
         */
        this.isSaving = ko.observable(false);

        /**
         * Dynamic label text for the 'save' button
         * @member {KnockoutComputed<string>}
         */
        this.saveButtonLabel = ko.pureComputed(() => {
            const text = this.isSaving() ? 'Saving...' : 'Save';
            return text;
        });

        /**
         * Callback executed after a succesfully 'delete' task.
         * When there is no one, the current data and ID are cleared.
         * @member {Function}
         */
        this.onDeleted = ko.unwrap(params.onDeleted);

        /**
         * State flag for the 'delete' task
         * @member {KnockoutObservable<boolean>}
         */
        this.isDeleting = ko.observable(false);

        /**
         * Dynamic label text for the 'delete' button
         * @member {KnockoutComputed<string>}
         */
        this.deleteButtonLabel = ko.pureComputed(() => {
            const text = this.isDeleting() ? 'Deleting...' : 'Delete';
            return text;
        });

        /**
         * State flag. Whether a task is in progress, then user editing should
         * not be allowed.
         * @member {KnockoutComputed<boolean>}
         */
        this.isWorking = ko.pureComputed(() => this.isSaving() || this.isDeleting());

        /**
         * Displays the error returned while loading the data
         * @param {Error} err
         */
        // const loadingError = function(error) {
        //     showError({
        //         title: 'There was an error loading the badge/collection',
        //         error
        //     });
        // };

        /**
         * When the given listing ID changes, load the data or set-up a new
         * entry for a platformID specified.
         */
    //     this.observeChanges(() => {
    //         const id = this.userBadgeID();
    //         if (id) {
    //             userBadgeItem(id)
    //             .onceLoaded()
    //             .then((data) => {
    //                 this.userBadge(data);
    //             })
    //             .catch(loadingError);
    //         }
    //         else {
    //             (() => {
    //                 this.userBadge({
    //                     userBadgeID: 0,
    //                     jobTitleID: this.jobTitleID(),
    //                     badgrURL: this.badgrURL(),
    //                     type: this.type(),
    //                     modifiedDate: false,
    //                     modifiedBy: 'User'
    //                 });
    //             })
    //             .catch(loadingError);
    //         }
    //     });
    // }

    /**
     * Save current form data
     */
    // save() {
    //     // Prevent twice execution
    //     if (this.isSaving()) return;
    //     // Convert badgr URL to v 2.0 and assign type based on URL
    //     var src = this.badgrURL();
    //     if(src && src.match(/^assertions.*$/)) {
    //       src = src.replace(/\?v=.+$/, '?v=2_0');
    //       this.badgrURL = src;
    //       this.type = 'badge';
    //     }
    //     else if (src && src.match(/^collections.*$/)) {
    //       this.type = 'collection';
    //     }
    //     else {
    //           showError({
    //               title: 'Please enter a valid Badgr URL'
    //           });
    //     }
    //     // Initial sync code wrappein a promise, so in case of error we
    //     // catch it later.
    //     return new Promise((resolve, reject) => {
    //         this.isSaving(true);
    //         // Copy data to send
    //         const data = Object.assign({}, this.userBadge());
    //         // Sent data
    //         const item = userBadgeItem(this.userBadgeID());
    //         item.save(data).then(resolve, reject);
    //     })
    //     // Update with server data
    //     .then((serverData) => {
    //         this.isSaving(false);
    //         if (this.onSaved) {
    //             this.onSaved(serverData);
    //         }
    //         else {
    //             this.userBadge(serverData);
    //             this.userBadgeID(serverData.userBadgeID);
    //         }
    //     })
    //     .catch((error) => {
    //         this.isSaving(false);
    //         showError({
    //             title: 'There was an error saving your changes',
    //             error
    //         });
    //     });
    // }


    /**
     * Request to delete a listing, with user confirmation.
     * It triggers 'onDeleted' param, or remove current data and ID.
     * @returns {Promise}
     */
    // deleteBadge() {
    //     // Only a deletion task at a time
    //     if (this.isDeleting()) return;
    //     // Only do something if data loaded
    //     const badge = this.userBadgeID();
    //     if (badge && badge.userBadgeID) {
    //         return showConfirm({
    //             title: 'Delete badge',
    //             message: `Are you sure to delete this '${badge.type}'?`,
    //             yes: 'Delete',
    //             no: 'Keep'
    //         })
    //         .then(() => {
    //             this.isDeleting(true);
    //             return userBadgeItem(badge.userBadgeID)
    //             .delete()
    //             .then(() => {
    //                 this.isDeleting(false);
    //                 if (this.onDeleted) {
    //                     this.onDeleted();
    //                 }
    //                 else {
    //                     this.userBadge(null);
    //                     this.userBadgeID(null);
    //                 }
    //             });
    //         })
    //         .catch((error) => {
    //             // Only on error; error is undefined when user declined
    //             if (error) {
    //                 showError({
    //                     title: 'There was an error when deleting your badge/collection',
    //                     error
    //                 });
    //             }
    //         });
    //     }
    //     else {
    //         return Promise.resolve();
    //     }
    }
}

ko.components.register(TAG_NAME, BadgeEditor);
