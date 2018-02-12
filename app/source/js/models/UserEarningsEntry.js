/**
    Represents an User Earnings Entry record
**/
'use strict';

import Model from './Model';
import ko from 'knockout';

class UserEarningsEntry {
    constructor(values) {
        Model(this);

        this.model.defProperties({
            userID: 0,
            earningsEntryID: 0,
            amount: null,
            paidDate: null,
            durationMinutes: 0,
            userExternalListingID: null,
            jobTitleID: null,
            clientUserID: null,
            notes: null,
            jobTitleName: null,
            listingTitle: null,
            createdDate: null,
            updatedDate: null
        }, values);

        /**
         * Display the duration in human friendly format
         * @returns {string}
         */
        this.displayDuration = ko.pureComputed(() => {
            const hours = Math.floor(this.durationMinutes() / 60);
            const minutes = this.durationMinutes() - (hours * 60);
            return `${hours} hours ${minutes} minutes`;
        });
    }
}

module.exports = UserEarningsEntry;
