/**
 * Represents a GIG Posting made by a client user.
 */
import Model from './Model';

export default class UserPosting {
    constructor(values) {
        Model(this);

        this.model.defProperties({
            userPostingID: 0,
            userID: 0,
            solutionID: 0,
            postingTemplateID: null,
            statusID: 0,
            title: '',
            neededSpecializationIds: null,
            desiredSpecializationIds: null,
            languageID: null,
            countryID: null,
            createdDate: null,
            updatedDate: null
        }, values);
    }
}
