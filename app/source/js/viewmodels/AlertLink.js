/**
  * AlertLink objects are view models for buttons or links representing profile alerts
  *
  * Do not create AlertLink objects directly, but use the factory function fromProfileAlert.
  * Some AlertLink objects require additional objects beyond ProfileAlerts to build
  * their properties. See documentation for fromProfileAlert below.
  *
  * @module
  */
'use strict';

var RouteParser = require('../utils/Router').RouteParser;

/**
 * Mapping of ProfileAlert alertName values to the properties specific to them used
 * in initializing an AlertLink.
 *
 * @private
 **/
var alertPresets = {
        positionservices: {
            label: 'Add details to your listing',
            route: new RouteParser('/servicesOverview/:jobTitleID&returnText=Back to listing')
        },
        availability: {
            label: 'What hours do you work?',
            route: new RouteParser('/schedulingPreferences?mustReturn=listingEditor/:jobTitleID&returnText=Back to listing')
        },
        personalinfo: {
            label: 'How do clients reach you?',
            route: new RouteParser('/publicContactInfo?mustReturn=listingEditor/:jobTitleID&returnText=Back to listing')
        },
        photo: {
            label: 'Add your profile photo',
            route: new RouteParser('/publicProfilePicture?mustReturn=listingEditor/:jobTitleID&returnText=Back to listing')
        },
        payment: {
            label: 'How do you want to be paid?',
            route: new RouteParser('/payoutPreference?mustReturn=listingEditor/:jobTitleID&returnText=Back to listing')
        },
        pricingdetails: {
            label: 'Create a bookable offering',
            route: new RouteParser('/serviceProfessionalService/:jobTitleID&returnText=Back to listing')
        },
        publicbio: {
            label: 'Add a personal bio',
            route: new RouteParser('/publicBio?mustReturn=listingEditor/:jobTitleID&returnText=Back to listing&returnText=Back to listing')
        },
        professionallicense: {
            label: 'Submit required credentials',
            route: new RouteParser('/licensesCertifications/:jobTitleID&returnText=Back to listing')
        },
        location: {
            label: 'Where do you work?',
            route: new RouteParser('/serviceAddresses/:jobTitleID&returnText=Back to listing')
        },
        'add-education': {
            label: 'Add training or education',
            route: new RouteParser('/education?mustReturn=listingEditor/:jobTitleID&returnText=Back to listing')
        },
        verifyemail: {
              label: 'Verify your account (check your e-mail)',
              route: new RouteParser('/verifications?mustReturn=listingEditor/:jobTitleID&returnText=Back to listing')
        },
        showcasework: {
            label: 'Add photos of your work',
            route: new RouteParser('/workPhotos/:jobTitleID&returnText=Back to listing')
        },
        'required-professionallicense': {
              label: 'Verify your professional license or certification',
              route: new RouteParser('/licensesCertifications/:jobTitleID&returnText=Back to listing')
        }
    },
    undefinedPreset = { label: '', route: { reverse: function() { return ''; } } };

/*
 * Creates an AlertLink. Do not initialize directly.
 *
 * @class
 */
var AlertLink = function(label, href) {
    this._label = label;
    this._href = href;
};

AlertLink.prototype.href = function() {
    return this._href;
};

AlertLink.prototype.label = function() {
    return this._label;
};

/**
 * Factory function for creating AlertLink objects from ProfileAlerts. Some
 * types of ProfileAlerts require additional information to build their properties.
 * These are passed via options.
 *
 * @param {Object} options object with additional data used to create AlertLinks.
 * @param {string} options.jobTitleID the job title ID pertinent to the corresponding profile alert
 **/
AlertLink.fromProfileAlert = function(profileAlert, options) {
    var preset = alertPresets[profileAlert.alertName()] || undefinedPreset;

    return new AlertLink(preset.label, preset.route.reverse({ jobTitleID: options.jobTitleID }));
};

module.exports = AlertLink;
