/**
    List of activities to preload in the App (at main entry point 'app'),
    as an object with the activity name as the key
    and the controller as value.
**/
'use strict';

module.exports = {
    'serviceProfessionalCustomURL': require('./activities/serviceProfessionalCustomURL'),
    'serviceProfessionalBusinessInfo': require('./activities/serviceProfessionalBusinessInfo'),
};
