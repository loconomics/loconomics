/** ServiceAttributeCategory model.
 **/
'use strict';

var Model = require('./Model'),
    ServiceAttribute = require('./ServiceAttribute');

function ServiceAttributeCategory(values) {
    
    Model(this);

    this.model.defProperties({
        serviceAttributeCategoryID: 0,
        name: '',
        description: null,
        requiredInput: false,
        eligibleForPackages: false,
        serviceAttributes: {
            isArray: true,
            Model: ServiceAttribute
        }
        //createdDate: null,
        //updatedDate: null
    }, values);
}

module.exports = ServiceAttributeCategory;
