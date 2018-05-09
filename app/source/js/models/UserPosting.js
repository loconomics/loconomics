/**
 * Represents a GIG Posting made by a client user.
 */
import Model from './Model';

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
    }
}
