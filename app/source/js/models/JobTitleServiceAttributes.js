/** JobTitleServiceAttributes model.
 **/
'use strict';

var Model = require('./Model');
var ServiceAttributeCategory = require('./ServiceAttributeCategory');
var ExperienceLevel = require('./ExperienceLevel');

function JobTitleServiceAttributes(values) {

    Model(this);

    this.model.defProperties({
        jobTitleID: 0,
        serviceAttributes: {
            isArray: true,
            Model: ServiceAttributeCategory
        },
        experienceLevels: {
            isArray: true,
            Model: ExperienceLevel
        },
        language: '',
        //createdDate: null,
        //updatedDate: null
    }, values);
}

module.exports = JobTitleServiceAttributes;
