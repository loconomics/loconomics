/** PublicUserJobTitleServiceAttributes model.
 **/
'use strict';

var Model = require('./Model');
var ServiceAttributeCategory = require('./ServiceAttributeCategory');
var ExperienceLevel = require('./ExperienceLevel');

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
        language: '',
        //createdDate: null,
        //updatedDate: null
    }, values);
}

/**
 * @returns true if there are either service attributes or an experience level with this job title
 */
PublicUserJobTitleServiceAttributes.prototype.hasAttributes = function() {
    return this.hasExperienceLevel() || (this.serviceAttributes().length > 0);
};

/**
 * @returns true if an experience level has been set for this job title
 */
PublicUserJobTitleServiceAttributes.prototype.hasExperienceLevel = function() {
    return this.experienceLevel() && this.experienceLevel().hasExperienceLevel();
};


module.exports = PublicUserJobTitleServiceAttributes;
