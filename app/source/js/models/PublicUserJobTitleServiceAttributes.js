/** PublicUserJobTitleServiceAttributes model.
 **/
'use strict';

var Model = require('./Model'),
    ServiceAttributeCategory = require('./ServiceAttributeCategory'),
    ExperienceLevel = require('./ExperienceLevel');

function PublicUserJobTitleServiceAttributes(values) {

    Model(this);

    this.model.defProperties({
        userID: 0,
        jobTitleID: 0,
        serviceAttributes: {
            isArray: true,
            Model: ServiceAttributeCategory
        },
        experienceLevel: {
            Model: ExperienceLevel
        },
        languageID: 0,
        countryID: 0
        //createdDate: null,
        //updatedDate: null
    }, values);
}

module.exports = PublicUserJobTitleServiceAttributes;
