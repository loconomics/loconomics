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
            route: new RouteParser('/servicesOverview/:jobTitleID')
        },
        availability: {
            label: 'What hours do you work?',
            route: new RouteParser('/scheduling-preferences?mustReturn=listing-editor/:jobTitleID')
        },
        personalinfo: {
            label: 'How do clients reach you?',
            route: new RouteParser('/public-contact-info?mustReturn=listing-editor/:jobTitleID')
        },
        photo: {
            label: 'Add your profile photo',
            route: new RouteParser('/publicProfilePicture?mustReturn=listing-editor/:jobTitleID')
        },
        payment: {
            label: 'How do you want to be paid?',
            route: new RouteParser('/payoutPreference?mustReturn=listing-editor/:jobTitleID')
        },
        pricingdetails: {
            label: 'Create a bookable offering',
            route: new RouteParser('/service-professional-services/:jobTitleID')
        },
        publicbio: {
            label: 'Add a personal bio',
            route: new RouteParser('/publicBio?mustReturn=listing-editor/:jobTitleID')
        },
        professionallicense: {
            label: 'Submit required credentials',
            route: new RouteParser('/licenses-certifications/:jobTitleID')
        },
        location: {
            label: 'Where do you work?',
            route: new RouteParser('/serviceAddresses/:jobTitleID')
        },
        'add-education': {
            label: 'Add training or education',
            route: new RouteParser('/education?mustReturn=listing-editor/:jobTitleID')
        },
        verifyemail: {
              label: 'Verify your account (check your e-mail)',
              route: new RouteParser('/verifications?mustReturn=listing-editor/:jobTitleID')
        },
        showcasework: {
            label: 'Add photos of your work',
            route: new RouteParser('/workPhotos/:jobTitleID')
        },
        'required-professionallicense': {
              label: 'Verify your professional license or certification',
              route: new RouteParser('/licenses-certifications/:jobTitleID')
        }
    };
var undefinedPreset = { label: '', route: { reverse: function() { return ''; } } };

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
