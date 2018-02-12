/**
    Represents an User Earnings Entry record
**/
'use strict';

var Model = require('./Model');

class UserEarningsEntry {
    constructor(values) {
        Model(this);

        this.model.defProperties({
            userID: 0,
            earningsEntryID: 0,
            amount: 0,
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
    }
}

module.exports = UserEarningsEntry;
