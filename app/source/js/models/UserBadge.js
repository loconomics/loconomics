/**
 * Represents a user-badge entry
 */
'use strict';

import Model from './Model';

export default class UserBadge {
    constructor(values) {
        Model(this);

        this.model.defProperties({
            userBadgeID: 0,
            userID: 0,
            solutionID: null,
            badgeURL: '',
            type: '',
            category: '',
            expiryDate: { isDate: true },
            createdDate: { isDate: true },
            updatedDate: { isDate: true },
            createdBy: null,
            modifiedBy: null
        }, values);
    }
}
