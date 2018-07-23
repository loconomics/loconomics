/**
 * Client Model
 */

import Model from './Model';
import { pureComputed } from 'knockout';

export default class Client {
    constructor(values) {
        Model(this);

        this.model.defProperties({
            clientUserID: 0,
            firstName: '',
            lastName: '',
            secondLastName: '',
            email: '',
            phone: null,
            canReceiveSms: false,
            birthMonthDay: null,
            birthMonth: null,
            notesAboutClient: null,
            createdDate: null,
            updatedDate: null,
            editable: false,
            deleted: false
        }, values);

        /**
         * Full name composed of the parts available at the record.
         * @member {KnockoutComputed<string>}
         */
        this.fullName = pureComputed(() => [this.firstName(), this.lastName()].filter((a) => !!a).join(' '));

        /**
         * Formatted birth month and day.
         * @member {KnockoutComputed<string>}
         */
        this.birthDay = pureComputed(() => {
            if (this.birthMonthDay() &&
                this.birthMonth()) {
                // TODO i10n
                return this.birthMonth() + '/' + this.birthMonthDay();
            }
            else {
                return null;
            }
        });

        /**
         * Whethersome contact data is available (email or phone almost)
         * @member {KnockoutComputed<boolean>}
         */
        this.hasContactDetails = pureComputed(() => this.email() || this.phone());
    }
}
