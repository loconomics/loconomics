/**
 * Edit the user organization information, that may be available publicly.
 *
 * @module kocomponents/profile/organization-info-editor
 */
import Komponent from '../../helpers/KnockoutComponent';
import User from '../../../models/User';
import ko from 'knockout';
import onboarding from '../../../data/onboarding';
import { show as showError } from '../../../modals/error';
import template from './template.html';
import userData from '../../../data/userProfile';

const TAG_NAME = 'organization-info-editor';

/**
 * Component
 */
export default class OrganizationInfoEditor extends Komponent {

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
            title: 'Unable to load your organization info',
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
        return userData.saveOrganizationInfo(this.data.model.toPlainObject(true))
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
                title: 'Unable to save your organization info',
                error: err
            });
        })
        .then(() => this.isSaving(false));
    }
}

ko.components.register(TAG_NAME, OrganizationInfoEditor);
