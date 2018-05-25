/**
 * Represents the specializations attached to an user posting
 */
import Model from './Model';

export default class UserPostingSpecialization {
    constructor(values) {
        Model(this);

        this.model.defProperties({
            specializationID: 0,
            name: ''
        }, values);
    }
}
