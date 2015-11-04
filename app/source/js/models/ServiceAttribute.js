/** ServiceAttribute model.
 **/
'use strict';

var Model = require('./Model');

function ServiceAttribute(values) {
    
    Model(this);

    this.model.defProperties({
        serviceAttributeID: 0,
        name: '',
        description: null
        //createdDate: null,
        //updatedDate: null
    }, values);
}

module.exports = ServiceAttribute;
