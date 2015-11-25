/** StateProvince model.
 **/
'use strict';

var Model = require('./Model');

function StateProvince(values) {
    
    Model(this);

    this.model.defProperties({
        code: '',
        name: ''
    }, values);
}

module.exports = StateProvince;
