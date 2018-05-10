/**
 * Represents a GIG Posting made by a client user.
 */
import Model from './Model';
import ko from 'knockout';

export class UserPostingSpecialization {
    constructor(values) {
        Model(this);

        this.model.defProperties({
            specializationID: 0,
            name: ''
        }, values);
    }
}

export default class UserPosting {
    constructor(values) {
        Model(this);

        this.model.defProperties({
            userPostingID: 0,
            userID: 0,
            solutionID: 0,
            solutionName: '',
            postingTemplateID: null,
            statusID: 0,
            title: '',
            neededSpecializations: {
                isArray: true,
                Model: UserPostingSpecialization
            },
            desiredSpecializations: {
                isArray: true,
                Model: UserPostingSpecialization
            },
            languageID: null,
            countryID: null,
            createdDate: null,
            updatedDate: null
        }, values);

        /**
         * The display name for the status
         */
        this.statusName = ko.pureComputed(() => getStatusNameFor(this.statusID()));
    }
}

/**
 * Gives the display name for the given user posting status ID.
 * @param {number} postingStatusID
 * @returns {string}
 */
export function getStatusNameFor(postingStatusID) {
    switch (postingStatusID) {
        case 0: return 'Incomplete';
        case 1: return 'Active';
        case 2: return 'Expired';
        case 3: return 'Closed';
        default: return '';
    }
}
