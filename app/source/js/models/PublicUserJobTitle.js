/**
    PublicUserJobTitle model, relationship between an user and a
    job title and the main data attached to that relation for
    public access (internal fields avoided) and additional
    useful job title info (shortcut to job title names for convenience).
    
    The model has optional properties that link
    to other model information related to a specific jobTitle
    for convenience when querying a wider set of information
    and keep it organized under this model instances.
**/
'use strict';

var ko = require('knockout');
var numeral = require('numeral');
var Model = require('./Model'),
    PublicUserRating = require('./PublicUserRating'),
    PublicUserVerificationsSummary = require('./PublicUserVerificationsSummary'),
    Address = require('./Address'),
    WorkPhoto = require('./WorkPhoto'),
    PublicUserJobTitleServiceAttributes = require('./PublicUserJobTitleServiceAttributes'),
    ServiceProfessionalService = require('./ServiceProfessionalService'),
    UserVerification = require('./UserVerification'),
    UserLicenseCertification = require('./UserLicenseCertification');

function PublicUserJobTitle(values) {
    
    Model(this);
    
    this.model.defProperties({
        userID: 0,
        jobTitleID: 0,
        intro: null,
        cancellationPolicyID: 0,
        instantBooking: false,
        jobTitleSingularName: '',
        jobTitlePluralName: '',

        rating: { Model: PublicUserRating },
        verificationsSummary: { Model: PublicUserVerificationsSummary },
        serviceAddresses: {
            Model: Address,
            isArray: true
        },
        services: {
            Model: ServiceProfessionalService,
            isArray: true
        },
        serviceAttributes: {
            Model: PublicUserJobTitleServiceAttributes
        },
        workPhotos: {
            Model: WorkPhoto,
            isArray: true
        },
        verifications: {
            Model: UserVerification,
            isArray: true
        },
        licensesCertifications: {
            Model: UserLicenseCertification,
            isArray: true
        }
    }, values);

    this.model.defID(['userID', 'jobTitleID']);
    
    var findMinValue = function(services) {
        var s = services,
            maxValue = { price: Number.MAX_VALUE };

        if (s.length === 0) return null;

        var minValue = s.reduce(function(last, serv) {
            return ((serv.priceRate() !== null) && serv.priceRate() < last.price) ? {
                price: serv.priceRate(),
                unit: serv.priceRateUnit()
            } : ((serv.price() !== null) && serv.price() < last.price) ? {
                price: serv.price(),
                unit: null
            } : last;
        }, maxValue);

        return minValue === maxValue ? null : minValue;
    };

    this.minServiceValue = ko.pureComputed(function() {
        var price = findMinValue(this.services());
        if (!price) {
            return '';
        }
        else if (price.unit) {
            return numeral(price.price).format('$0') + '/' + price.unit;
        }
        else {
            return numeral(price.price).format('$0.00');
        }
    }, this);

    this.clientSpecificServices = function() {
        return this.services().filter(function(service) {
            return service.isClientSpecific();
        });
    };

    this.publicServices = function() {
        return this.services().filter(function(service) {
            return !service.isClientSpecific();
        });
    };

    /**
     * @returns true if there are any service attributes with this job title 
     */
    this.hasServiceAttributes = function() {
        return !!(this.serviceAttributes() && this.serviceAttributes().hasAttributes());
    };

    /**
     * @returns true if there is any intro text
     */
    this.hasIntro = function() {
        return !!this.intro();
    };
}

module.exports = PublicUserJobTitle;
