using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Extension of LcPricingModel
/// </summary>
public static partial class LcPricingModel
{
    public readonly static Dictionary<int, PackageBaseConfig> PackageBasePricingTypeConfigs = new Dictionary<int,PackageBaseConfig>
    {
        // Package Pricing Type
        {
            3,
            new PackageBaseConfig {
                PricingTypeID = 3,
                SingularName = "Package",
                PluralName = "Packages",
                SlugName = "package",
                AddNewLabel = "Add a package",
                ProviderDescription = "Describe to your potential clients in detail the service(s) you provide and include a description of any products included (if applicable).",
                PriceCalculation = PriceCalculationType.FixedPrice,
                SelectionGroups = new string[]{"package"},
        
                NamePlaceHolder = "Type the name of the package (be descriptive and creative)",
                NumberOfSessionsLabel = "Number of appointments included:",
                PriceLabel = "Price for package:",
                PriceNote = "(this should be all-inclusive)",
                DurationLabel = "Duration (per appointment):",
                RequireDuration = true,
                DescriptionPlaceHolder = "Describe to your potential clients in detail the service(s) you provide and include a description of any products included (if applicable)",
                FirstTimeClientsOnlyLabel = "This package is available to first-time clients only",
                FirstTimeClientsOnlyListText = "This package is available to first-time clients only",

                SuccessOnDelete = "Package removed succesfully",
                SuccessOnSave = "Add/Edit packages",

                SummaryFormat = "{0}",
                SummaryFormatMultipleSessions = "{1} appointments - {0} each",
                NameAndSummaryFormat = "{0}, {1}",
                NameAndSummaryFormatMultipleSessions = "{0}, {2} appointments - {1} each",

                IncludeServiceAttributes = true,

                LearnMoreLabel = "Learn more about package pricing",
                LearnMoreText =  "Here you can communicate a bundle of services that occur in a single appointment or multiple appointments of a service. For example, you could offer six appointments for a discounted price.",
            }
        },
        // Add-on Pricing Type
        {
            7,
            new PackageBaseConfig {
                PricingTypeID = 7,
                SingularName = "Add-On",
                PluralName = "Add-Ons",
                SlugName = "addon",
                AddNewLabel = "Add an add-on service",
                ProviderDescription = "Describe to your potential clients in detail the add-on service they'll receive and include a description of any products included (if applicable).",
                PriceCalculation = PriceCalculationType.FixedPrice,
                IsAddon = true,

                NamePlaceHolder = "Type the name of the add-on service (be descriptive and creative)",
                PriceLabel = "Price for add-on service:",
                PriceNote = "(this should be all-inclusive)",
                DurationLabel = "Length of service:",
                RequireDuration = false,
                DescriptionPlaceHolder = "Describe to your potential clients in detail the add-on service they'll receive and include a description of any products included (if applicable)",

                SuccessOnDelete = "Add-on removed succesfully",
                SuccessOnSave = "Add/Edit add-ons",

                SummaryFormat = "{0}",
                // Left a white space to avoid the default SummaryFormat be used instead:
                SummaryFormatNoDuration = " ",
                NameAndSummaryFormat = "{0}, {1}",
                NameAndSummaryFormatNoDuration = "{0}",

                IncludeServiceAttributes = false,

                LearnMoreLabel = "Learn more about add-on pricing",
                LearnMoreText =  "Here you can add additional services that clients can request with a service allowing them to customize their experience with you.",
            }
        },
        // Estimate Pricing Type
        {
            4,
            new PackageBaseConfig {
                PricingTypeID = 4,
                SingularName = "Estimate",
                PluralName = "Estimates",
                SlugName = "estimate",
                AddNewLabel = "Add an estimate visit",
                ProviderDescription = "We know you're psychic (or are you?) and probably need to visit the client and review the work before determining a price. We'll help facilitate.",
                PriceCalculation = PriceCalculationType.FixedPrice,
                SelectionGroups = new string[]{"package"},

                NamePlaceHolder = "Type the name of the estimate visit, e.g. \"Work assessment visit\", \"Pricing estimate visit\"",
                DurationLabel = "Approximate length of visit:",
                RequireDuration = true,
                PriceLabel = "Price for estimate:",
                PriceNote = "(enter 0.00 if free)",
                DescriptionPlaceHolder = "Tell your clients what they can expect when you speak with them and what to prepare.",
                PriceRateQuantityLabel = "My rates start at:",
                PriceRateUnitLabel = "per",
                NoPriceRateLabel = "I prefer not to state",
                PriceRateQuantityListLabel = "My rates start at:",
                PriceRateUnitListLabel = "per",
                NoPriceRateListMessage = "Pricing will be disclosed during consultation.",
                InPersonPhoneLabel = "Estimation type:",

                SuccessOnDelete = "Estimate removed succesfully",
                SuccessOnSave = "Add/Edit estimates",

                SummaryFormat = "{0} ({2} estimate)",
                NameAndSummaryFormat = "{0}, {1} ({3} estimation)",

                LearnMoreLabel = "Learn more about estimate pricing",
                LearnMoreText =  "Here you can discuss with clients your services and assess an accurate price estimate for their individual needs. You and your client will then determine next steps together (we're currently working on ways to help you out with this).",
                PriceRateLearnMoreLabel = "learn more",
                PriceRateLearnMoreText = @"We'll show this as a 'from' rate on your profile to give your potential clients an idea of the costs of your services.
                    You can discuss your full pricing when you speak and add any materials/parts required to get the job done right.",
                NoPriceRateLearnMoreLabel = "not recommended",
                NoPriceRateLearnMoreText = @"If you decline to state your hourly rate, we'll display this as 'Pricing will be disclosed during consultation'.
                    We recommended giving clients a 'from' rate to ensure you attract the clients that can afford your services."
            }
        },
        // Consultation Pricing Type
        {
            5,
            new PackageBaseConfig {
                PricingTypeID = 5,
                SingularName = "Consultation",
                PluralName = "Consultations",
                SlugName = "consultation",
                AddNewLabel = "Add a consultation",
                ProviderDescription = "Need to speak or meet with your client before determining a price? We'll help you facilitate an in-person meeting or phone call to discuss your services.",
                PriceCalculation = PriceCalculationType.FixedPrice,
                SelectionGroups = new string[]{"package"},

                NamePlaceHolder = "Type the name of the consultation, e.g. \"Initial consultation\", \"Introductory meeting\".",
                DurationLabel = "Approx. length of consultation:",
                RequireDuration = true,
                PriceLabel = "Price for consultation:",
                PriceNote = "(enter 0.00 if free)",
                DescriptionPlaceHolder = "Tell your clients what they can expect during the consultation and what to prepare.",
                PriceRateQuantityLabel = "My rates start at:",
                PriceRateUnitLabel = "per",
                NoPriceRateLabel = "I prefer not to state",
                PriceRateQuantityListLabel = "My rates start at:",
                PriceRateUnitListLabel = "per",
                NoPriceRateListMessage = "Pricing will be disclosed during consultation.",
                InPersonPhoneLabel = "Consultation type:",
                FirstTimeClientsOnlyLabel = "This consultation is available to first-time clients only",
                FirstTimeClientsOnlyListText = "This consultation is available to first-time clients only",

                PriceRateIsRequiredValidationError = "You must specify a starting rate or check 'I prefer not to state'",
                PriceRateUnitIsRequiredValidationError = "You need to specify a price unit along with your rate or mark 'I prefer not to state'",
                SuccessOnDelete = "Consultation removed succesfully",
                SuccessOnSave = "Add/Edit consultations",

                SummaryFormat = "{0} ({2} consultation)",
                NameAndSummaryFormat = "{0}, {1} ({3} consultation)",

                LearnMoreLabel = "Learn more about consultation pricing",
                LearnMoreText = "Here you can discuss with clients your services and work with them to decide next steps and pricing (we're currently working on ways to help you out with this).",
                PriceRateLearnMoreLabel = "learn more",
                PriceRateLearnMoreText = @"We'll show this as a 'from' rate on your profile to give your potential clients an idea of the costs of your services.
                    You can discuss your full pricing during the consultation and add any materials/parts required to get the job done right.",
                NoPriceRateLearnMoreLabel = "not recommended",
                NoPriceRateLearnMoreText = @"If you decline to state your hourly rate, we'll display this as 'Pricing will be disclosed during consultation'.
                    We recommended giving clients a 'from' rate to ensure you attract the clients that can afford your services."
            }
        },
        // Service Pricing Type
        {
            6,
            new PackageBaseConfig {
                PricingTypeID = 6,
                SingularName = "Service",
                PluralName = "Services",
                SlugName = "service",
                AddNewLabel = "Add a service",
                ProviderDescription = "Describe the service you offer, the price, and the time it'll take, and we'll do the rest to get you clients. Please include any products that come with the service.",
                PriceCalculation = PriceCalculationType.FixedPrice,
                SelectionGroups = new string[]{"package"},

                NamePlaceHolder = "Type the name of the service (be descriptive and creative)",
                DurationLabel = "Length of service:",
                RequireDuration = true,
                PriceLabel = "Price for service:",
                PriceNote = "(this should be all-inclusive)",
                DescriptionPlaceHolder = "Describe to your potential clients in detail the service you provide and include a description of any products included (if applicable).",
                FirstTimeClientsOnlyLabel = "This service is available to first-time clients only",
                FirstTimeClientsOnlyListText = "This service is available to first-time clients only",

                SuccessOnDelete = "Service removed succesfully",
                SuccessOnSave = "Add/Edit services",

                SummaryFormat = "{0}",
                NameAndSummaryFormat = "{0}, {1}",

                IncludeServiceAttributes = true,

                LearnMoreLabel = "Learn more about service pricing",
                LearnMoreText = "Here you can add each individual service you provide and communicate to clients the time you'll need and the price you charge. Add a package if you'd also like to bundle services or offer discounts for multiple appointments.",
            }
        },
        // Light Cleaning Service Pricing Type
        {
            9,
            new PackageBaseConfig {
                PricingTypeID = 9,
                SingularName = "Light cleaning service",
                PluralName = "Light cleaning services",
                SlugName = "lightcleaningservice",
                AddNewLabel = "Add light cleaning services",
                ProviderDescription = "Describe to your potential clients in detail the light cleaning services you provide and include what makes your services unique.",
                PriceCalculation = PriceCalculationType.HourlyPrice,
                SelectionGroups = new string[]{"package"},

                NamePlaceHolder = "Light cleaning services",
                SuggestedName = "Light cleaning services",
                DescriptionPlaceHolder = "Describe to your potential clients in detail the light cleaning services you provide and include what makes your services unique.",
                PriceRateQuantityLabel = "Hourly rate",
                PriceRateIsRequiredValidationError = "You must set your hourly rate",

                SuccessOnDelete = "Service removed succesfully",
                SuccessOnSave = "Add/Edit pricings",

                SummaryFormat = "{0}",
                NameAndSummaryFormat = "{0}, {1}",

                IncludeServiceAttributes = true,

                LearnMoreLabel = "Learn more about light cleaning services pricing",
                LearnMoreText = "Price and list your services for what you consider a light cleaning of a home. Some clients just want a quick clean and aren't too concerned about spring cleaning. Customize by selecting attributes above.",

                ClassName = "housekeeperservices lightcleaningservices",
                Mod = new PackageModHousekeeper("light")
            }
        },
        // Routine Cleaning Service Pricing Type
        {
            10,
            new PackageBaseConfig {
                PricingTypeID = 10,
                SingularName = "Routine cleaning service",
                PluralName = "Routine cleaning services",
                SlugName = "routinecleaningservice",
                AddNewLabel = "Add routine cleaning services",
                ProviderDescription = "Describe to your potential clients in detail the routine cleaning services you provide and include what makes your services unique.",
                PriceCalculation = PriceCalculationType.HourlyPrice,
                SelectionGroups = new string[]{"package"},

                NamePlaceHolder = "Routine cleaning services",
                SuggestedName = "Routine cleaning services",
                DescriptionPlaceHolder = "Describe to your potential clients in detail the routine cleaning services you provide and include what makes your services unique.",
                PriceRateQuantityLabel = "Hourly rate",
                PriceRateIsRequiredValidationError = "You must set your hourly rate",

                SuccessOnDelete = "Service removed succesfully",
                SuccessOnSave = "Add/Edit pricings",

                SummaryFormat = "{0}",
                NameAndSummaryFormat = "{0}, {1}",

                IncludeServiceAttributes = true,

                LearnMoreLabel = "Learn more about routine cleaning services pricing",
                LearnMoreText = "Price and list your services for what you consider a routine cleaning of a home. It's more than making the beds but isn't a spring cleaning either. Customize by selecting attributes above.",

                ClassName = "housekeeperservices routinecleaningservices",
                Mod = new PackageModHousekeeper("routine")
            }
        },
        // Deep Cleaning Service Pricing Type
        {
            11,
            new PackageBaseConfig {
                PricingTypeID = 11,
                SingularName = "Deep cleaning service",
                PluralName = "Deep cleaning services",
                SlugName = "deepcleaningservice",
                AddNewLabel = "Add deep cleaning services",
                ProviderDescription = "Describe to your potential clients in detail the deep cleaning services you provide and include what makes your services unique.",
                PriceCalculation = PriceCalculationType.HourlyPrice,
                SelectionGroups = new string[]{"package"},

                NamePlaceHolder = "Deep cleaning services",
                SuggestedName = "Deep cleaning services",
                DescriptionPlaceHolder = "Describe to your potential clients in detail the deep cleaning services you provide and include what makes your services unique.",
                PriceRateQuantityLabel = "Hourly rate",
                PriceRateIsRequiredValidationError = "You must set your hourly rate",

                SuccessOnDelete = "Service removed succesfully",
                SuccessOnSave = "Add/Edit pricings",

                SummaryFormat = "{0}",
                NameAndSummaryFormat = "{0}, {1}",

                IncludeServiceAttributes = true,

                LearnMoreLabel = "Learn more about deep cleaning services pricing",
                LearnMoreText = "Price and list your services for what you consider a deep cleaning of a home. We're talking about the client's mother coming to visit or a spring cleaning. Customize by selecting attributes above.",

                ClassName = "housekeeperservices deepcleaningservices",
                Mod = new PackageModHousekeeper("deep")
            }
        }
    };
}