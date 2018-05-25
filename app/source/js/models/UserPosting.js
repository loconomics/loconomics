/**
 * Represents a GIG Posting made by a client user.
 */
import Model from './Model';
import PublicUserProfile from './PublicUserProfile';
import QuestionResponse from './QuestionResponse';
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

/**
 * Represents the response given to a question of a posting, by the user
 * author of the posting.
 * Even if is 'a response', it actually contains a set of responses, depending
 * on the question just one or more than one are allowed.
 * It references the answered question by ID.
 */
export class UserPostingQuestionResponse {
    constructor(values) {
        Model(this);

        this.model.defProperties({
            questionID: 0,
            responses: {
                isArray: true,
                Model: QuestionResponse
            }
        }, values);
    }
}

export const UserPostingStatus = {
    incomplete: 0,
    active: 1,
    expired: 2,
    closed: 3
};

export const UserPostingReactionType = {
    applied: 1,
    discarded: 2
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
            questionsResponses: {
                isArray: true,
                Model: UserPostingQuestionResponse
            },
            client: {
                Model: PublicUserProfile
            },
            /**
             * @member {KnockoutObservable<UserPostingReactionType?>}
             */
            reactionTypeID: null,
            reactionDate: null,
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
         * The display name for the reaction type
         * @member {KnockoutComputed<string>}
         */
        this.reactionTypeName = ko.pureComputed(() => getReactionTypeNameFor(this.reactionTypeID()));
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

/**
 * Gives the display name for the given user posting reaction type ID, or empty
 * if source is null
 * @param {number} postingReactionTypeID
 * @returns {string}
 */
export function getReactionTypeNameFor(postingReactionTypeID) {
    switch (postingReactionTypeID) {
        case UserPostingReactionType.applied: return 'Applied';
        case UserPostingReactionType.discarded: return 'Discarded';
        default: return '';
    }
}
