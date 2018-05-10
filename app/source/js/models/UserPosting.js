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

export const UserPostingStatus = {
    incomplete: 0,
    active: 1,
    expired: 2,
    closed: 3
};

export default class UserPosting {
    constructor(values) {
        Model(this);

        this.model.defProperties({
            userPostingID: 0,
            userID: 0,
            solutionID: 0,
            solutionName: '',
            postingTemplateID: null,
            statusID: UserPostingStatus.incomplete,
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
         * @member {KnockoutComputed<string>}
         */
        this.statusName = ko.pureComputed(() => getStatusNameFor(this.statusID()));
        /**
         * Whether the posting is editable per its status
         * @member {KnockoutComputed<boolean>}
         */
        this.isEditable = ko.pureComputed(() => [UserPostingStatus.incomplete, UserPostingStatus.active].includes(this.statusID()));
    }
}

/**
 * Gives the display name for the given user posting status ID.
 * @param {number} postingStatusID
 * @returns {string}
 */
export function getStatusNameFor(postingStatusID) {
    switch (postingStatusID) {
        case UserPostingStatus.incomplete: return 'Incomplete';
        case UserPostingStatus.active: return 'Active';
        case UserPostingStatus.expired: return 'Expired';
        case UserPostingStatus.closed: return 'Closed';
        default: return '';
    }
}
