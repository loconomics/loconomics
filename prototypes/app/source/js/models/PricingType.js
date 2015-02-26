/**
    Pricing Type model
**/
'use strict';

var Model = require('./Model');

function PricingType(values) {
    
    Model(this);
    
    this.model.defProperties({
        pricingTypeID: 0,
        singularName: '',
        pluralName: '',
        slugName: '',
        addNewLabel: null,
        providerDescription: null,
        // PriceCalculationType enumeration value:
        priceCalculation: null,
        isAddon: false,
        
        // Form Texts
        namePlaceHolder: null,
        suggestedName: null,
        fixedName: null,
        durationLabel: null,
        priceLabel: null,
        priceNote: null,
        firstTimeClientsOnlyLabel: null,
        dDescriptionPlaceHolder: null,
        priceRateQuantityLabel: null,
        priceRateUnitLabel: null,
        noPriceRateLabel: null,
        numberOfSessionsLabel: null,
        inPersonPhoneLabel: null,
        
        // Action And Validation Texts
        successOnDelete: null,
        errorOnDelete: null,
        successOnSave: null,
        errorOnSave: null,
        priceRateIsRequiredValidationError: null,
        priceRateUnitIsRequiredValidationError: null,
        
        // Help Texts
        learnMoreLabel: null,
        learnMoreText: null,
        priceRateLearnMoreLabel: null,
        priceRateLearnMoreText: null,
        noPriceRateLearnMoreLabel: null,
        noPriceRateLearnMoreText: null,
        
        // Additional configuration
        requireDuration: false,
        includeServiceAttributes: false,
        includeSpecialPromotion: false,
        
        // List Texts
        /// SummaryFormat is the default format for summaries (required),
        /// other formats are good for better detail, but depends
        /// on other options configured per type.
        /// Wildcards:
        /// {0}: duration
        /// {1}: sessions
        /// {2}: inperson/phone
        summaryFormat: null,
        summaryFormatMultipleSessions: null,
        summaryFormatNoDuration: null,
        summaryFormatMultipleSessionsNoDuration: null,
        withoutServiceAttributesCustomerMessage: null,
        withoutServiceAttributesProviderMessage: null,
        firstTimeClientsOnlyListText: null,
        priceRateQuantityListLabel: null,
        priceRateUnitListLabel: null,
        noPriceRateListMessage: null,
        
        // Booking/PricingEstimate Texts
        /// NameAndSummaryFormat is the default format for summaries with package name (required),
        /// other formats are good for better detail, but depends
        /// on other options configured per type.
        /// Wildcards:
        /// {0}: package name
        /// {1}: duration
        /// {2}: sessions
        /// {3}: inperson/phone
        nameAndSummaryFormat: null,
        nameAndSummaryFormatMultipleSessions: null,
        nameAndSummaryFormatNoDuration: null,
        nameAndSummaryFormatMultipleSessionsNoDuration: null,
        
        // Record maintenance
        createdDate: null,
        updatedDate: null
    }, values);
    
    this.model.defID(['pricingTypeID']);
}

module.exports = PricingType;

// Enumeration:
var PriceCalculationType = {
    FixedPrice: 1,
    HourlyPrice: 2
};

PricingType.PriceCalculationType = PriceCalculationType;
