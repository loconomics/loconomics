/**
 * Edit the user profile picture, that is available publicly.
 *
 * @module kocomponents/profile/profile-picture-editor
 */
import Komponent from '../../helpers/KnockoutComponent';
import User from '../../../models/User';
import ko from 'knockout';
import { show as showError } from '../../../modals/error';
import template from './template.html';
import userData from '../../../data/userProfile';
import marketplaceProfile from '../../../data/marketplaceProfile';

const TAG_NAME = 'profile-picture-editor';

/**
 * Component
 */
export default class ProfilePictureEditor extends Komponent {

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

        const profile = marketplaceProfile.data;

        this.photoPickerSettings = {
            // The profile has ever a photo URL, but is not ensured to be an user
            // photo, when is flagged as not uploaded still that URL resolves
            // to a fallback, generic image. Then, we provide it only when uploaded,
            // and on any case because the 'fallback' image used for the
            // placehoder/preview
            photoUrl: profile.hasUploadedPhoto() ? profile.photoUrl : '',
            fallbackPhotoUrl: profile.data.photoUrl(),
            uploadUrl: 'me/profile-picture',
            editUrl: 'me/profile-picture/edit',
            uploadFieldName: 'profilePicture',
            cameraSettings: {
                targetWidth: 600,
                targetHeight: 600,
                quality: 90
            }
        };

        this.__setupStatusFlags();

        this.submitText = ko.pureComputed(() => {
            const isLoading = this.isLoading();
            return isLoading ?
                'Loading...' :
                this.isSaving() ?
                    'Saving...' :
                    'Save';
        });

        this.__connectData();
    }

    __connectData() {
        // Request to load data, in case the initial one is empty or require cache revalidation
        this.isLoading(true);
        userData.load()
        .then((data) => {
            this.data.model.updateWith(data, true);
        })
        .catch((error) => showError({
            title: 'Unable to load your contact info',
            error
        }))
        .then(() => this.isLoading(false));
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

    save() {
        this.isSaving(true);
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
        })
        .then(() => this.isSaving(false));
    }
}

ko.components.register(TAG_NAME, ProfilePictureEditor);
