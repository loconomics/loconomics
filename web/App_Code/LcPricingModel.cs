using System;
using System.Collections.Generic;
using WebMatrix.Data;
using System.Web;
using System.Web.WebPages;
using System.Web.Helpers;
using System.Text;

/// <summary>
/// Models for LcPricingView views
/// </summary>
public static class LcPricingModel
{
    #region Usefull properties, classes and methods
    private static HttpRequest Request
    {
        get
        {
            return HttpContext.Current.Request;
        }
    }

    public class PricingModelData {
        public bool Success = false;
        public dynamic Data = null;
        public dynamic ProviderInput = null;
        public dynamic CustomerInput = null;
        public PricingSummaryData SummaryTotal = new PricingSummaryData();
    }

    public class Price
    {
        int roundedDecimals;
        decimal feeRate;
        decimal basePrice;
        decimal totalPrice;
        decimal feePrice;
        /// <summary>
        /// Giving a base price (no fees) the fees rate (from 0 to 1) and 
        /// number of decimal to round up, it calculates the total price
        /// (price with fees) and the fee amount.
        /// Rounding is done on the Total Price, and fee amount updated
        /// to match the rounded price and base price.
        /// </summary>
        /// <param name="basePrice">No fees price</param>
        /// <param name="feeRate">Number between 0 and 1. Its percentage / 100.</param>
        /// <param name="roundedDecimals">Number of decimals to round up from the final price (TotalPrice)</param>
        public Price(decimal basePrice, decimal feeRate, int roundedDecimals)
        {
            this.basePrice = Math.Round(basePrice, 2);
            this.feeRate = feeRate;
            this.roundedDecimals = roundedDecimals;
            Calculate();
        }
        private void Calculate()
        {
            totalPrice = Math.Round(basePrice * (1 + feeRate), roundedDecimals);
            feePrice = totalPrice - basePrice;
        }
        public decimal BasePrice
        {
            get
            {
                return this.basePrice;
            }
            set
            {
                this.basePrice = value;
                Calculate();
            }
        }
        public decimal FeeRate
        {
            get
            {
                return this.feeRate;
            }
            set
            {
                this.feeRate = value;
                Calculate();
            }
        }
        public decimal TotalPrice
        {
            get
            {
                return this.totalPrice;
            }
        }
        public decimal FeePrice
        {
            get
            {
                return this.feePrice;
            }
        }
    }
    public class PricingSummaryData
    {
        public decimal SubtotalPrice = 0M;
        public decimal FeePrice = 0M;
        public decimal TotalPrice = 0M;
        public decimal PFeePrice = 0M;
        /// <summary>
        /// Duration in Hours
        /// </summary>
        public decimal ServiceDuration = 0M;
        public decimal FirstSessionDuration = 0M;
        public string Concept = "";
        public PricingSummaryData()
        {
        }
        public PricingSummaryData(string concept)
        {
            this.Concept = concept;
        }
        public PricingSummaryData(decimal subtotalPrice, decimal feePrice, decimal totalPrice, decimal serviceDuration, decimal firstSessionDuration, decimal pFeePrice = 0)
        {
            this.SubtotalPrice = subtotalPrice;
            this.FeePrice = feePrice;
            this.TotalPrice = totalPrice;
            this.PFeePrice = pFeePrice;
            this.ServiceDuration = serviceDuration;
            this.FirstSessionDuration = firstSessionDuration;
        }
        public static PricingSummaryData operator + (PricingSummaryData one, PricingSummaryData add)
        {
            return new PricingSummaryData(
                one.SubtotalPrice + add.SubtotalPrice,
                one.FeePrice + add.FeePrice,
                one.TotalPrice + add.TotalPrice,
                one.ServiceDuration + add.ServiceDuration,
                one.FirstSessionDuration + add.FirstSessionDuration,
                one.PFeePrice + add.PFeePrice
            );
        }
        public void Add(PricingSummaryData add)
        {
            this.ServiceDuration += add.ServiceDuration;
            this.FirstSessionDuration += add.FirstSessionDuration;
            this.SubtotalPrice += add.SubtotalPrice;
            this.FeePrice += add.FeePrice;
            this.TotalPrice += add.TotalPrice;
            this.PFeePrice += add.PFeePrice;
            if (!String.IsNullOrEmpty(add.Concept))
                this.Concept = add.Concept;
        }
    }

    public class FeeRate
    {
        public decimal Percentage;
        public decimal Currency;
    }

    /// <summary>
    /// Small utility, convert database scheme data about
    /// fee to apply into an easy struct with Percentage
    /// and Currency fee to be applied, with default to 0
    /// when no apply one of them
    /// </summary>
    /// <param name="feeData"></param>
    /// <returns></returns>
    public static FeeRate GetFee(dynamic feeData)
    {
        decimal feePercentage = 0M, feeCurrency = 0M;
        if (feeData.ServiceFeeCurrency)
        {
            feeCurrency = feeData.ServiceFeeAmount;
        }
        if (feeData.ServiceFeePercentage)
        {
            feePercentage = feeData.ServiceFeeAmount;
        }
        return new FeeRate {
            Percentage = feePercentage,
            Currency = feeCurrency
        };
    }
    /// <summary>
    /// As GetFee, returns the same structure for 
    /// payment-processing fee percentage, with 
    /// a fixed Currency of 0 for compatibility.
    /// </summary>
    /// <param name="feeData"></param>
    /// <returns></returns>
    public static FeeRate GetPFee(dynamic feeData)
    {
        return new FeeRate {
            Percentage = feeData.PaymentProcessingFee,
            Currency = 0
        };
    }

    /// <summary>
    /// Calculate and returns the fee price for the given price and fee data,
    /// rounded up to integer (no decimals)
    /// </summary>
    /// <param name="fee"></param>
    /// <param name="price"></param>
    /// <returns></returns>
    public static decimal ApplyFeeAndRound(dynamic fee, decimal price)
    {
        return Math.Ceiling(ApplyFee(fee, price));
    }
    /// <summary>
    /// Calculate and returns the fee price for the given price and fee data,
    /// rounded to 2 decimals
    /// </summary>
    /// <param name="fee"></param>
    /// <param name="price"></param>
    /// <returns></returns>
    public static decimal ApplyFee(dynamic fee, decimal price)
    {
        return Math.Round((fee.Percentage * price) + fee.Currency, 2);
    }
    #endregion

    #region Package Base
    public interface PackageMod
    {
        /// <summary>
        /// It calculates the package duration and price (maybe other parameters as modelData.ProviderInput) before pass
        /// the standard calculation of total price for pricingestimate.
        /// Thats need for packages with special requirements on calculation based on additional
        /// parameters with not a package price or package duration.
        /// </summary>
        /// <param name="package"></param>
        /// <param name="ModelState"></param>
        void CalculateCustomerData(PackageBaseData package, FeeRate fee, PricingModelData modelData, System.Web.WebPages.Html.ModelStateDictionary ModelState);
        string GetCustomerHtml(PackageBaseData package, FeeRate fee);
        string GetProviderHtml(PackageBaseData package);
        bool ValidateProviderData(PackageBaseData package, System.Web.WebPages.Html.ModelStateDictionary modelState);
        void SaveProviderData(PackageBaseData package, Database db);
    }
    public class PackageModHousekeeper : PackageMod
    {
        double formulaA, formulaB, formulaC;
        string type;
        int sliderStep = 20;
        public PackageModHousekeeper(string type)
        {
            this.type = type;
            switch (type)
            {
                case "light":
                    formulaA = 20.4;
                    formulaB = 30.6;
                    formulaC = 68.34;
                    break;
                case "routine":
                    formulaA = 24;
                    formulaB = 36;
                    formulaC = 80.4;
                    break;
                case "deep":
                    formulaA = 48;
                    formulaB = 72;
                    formulaC = 160.8;
                    break;
            }
        }
        /// <summary>
        /// Calculate and returns the time in minutes for the given values
        /// </summary>
        /// <param name="numbedrooms"></param>
        /// <param name="numbathrooms"></param>
        /// <returns></returns>
        private double ApplyFormula(int numbedrooms = 2, int numbathrooms = 2)
        {
            return (formulaA * numbedrooms + formulaB * numbathrooms + formulaC);
        }
        #region Customer form part
        public void CalculateCustomerData(PackageBaseData package, FeeRate fee, PricingModelData modelData, System.Web.WebPages.Html.ModelStateDictionary ModelState)
        {
            /* IMPORTANT: we calculate here the service duration for one session based on some custom variables for housekeeper pricing,
             * final price and fees are calculated in the standard code using the package Duration field, because of that
             * we only update package.Duration here for later complete price calculation */

            // Get customer input
            var nbeds = Request["bedrooms-number"].AsInt();
            var nbaths = Request["bathrooms-number"].AsInt();
            // TODO get provider input
            var providerRate = .8; // 140.34 / formulaAverageT;
            // Apply formula, changed by the providerRate (variation from the average)
            var duration = ApplyFormula(nbeds, nbaths) * providerRate;
            // Change package with the information:
            package.Duration = ASP.LcHelpers.RoundTimeToMinutes(TimeSpan.FromMinutes(duration));
            modelData.ProviderInput = providerRate;
            modelData.CustomerInput = new { BedroomsNumber = nbeds, BathroomsNumber = nbaths };
        }
        public string GetCustomerHtml(PackageBaseData package, FeeRate fee)
        {
            // TODO get provider input
            var providerRate = .8; // 140.34 / formulaAverageT;
            // Get HourlyRate for client-side calculation, and fees CONTINUE
            var price = new Price(package.PriceRate ?? 0M, fee.Percentage, 1);
            var hourlyFee = price.FeePrice;
            var hourlyRate = price.TotalPrice;

            var s = new StringBuilder();

            s.AppendFormat("<div class='housekeeper-pricing' data-formula-a='{0}' data-formula-b='{1}' data-formula-c='{2}' data-hourly-rate='{3}' data-hourly-fee='{4}' data-provider-rate='{5}'>", formulaA, formulaB, formulaC, hourlyRate, hourlyFee, providerRate);
            s.Append(@"<div>Help us determine an accurate 
                <span class='has-tooltip' title='LJDI: This is an estimate, you will need review it with the provider.'>
                price estimate</span></div>");

            s.Append(@"<div data-slider-value='3' data-slider-step='1' class='housekeeper-pricing-bedrooms customer-slider'><label>Bedrooms: <input name='bedrooms-number' type='text' /></label></div>");
            s.Append(@"<div data-slider-value='3' data-slider-step='1' class='housekeeper-pricing-bathrooms customer-slider'><label>Bathrooms: <input name='bathrooms-number' type='text' /></label></div>");
            s.Append("</div>");

            return s.ToString();
        }
        #endregion
        #region Provider form part
        public string GetProviderHtml(PackageBaseData package)
        {
            var s = new StringBuilder();

            // TODO Get saved value for provider average-ratio
            var ratio = 0.76517553129036045555946929670072;
            // Calculate time for the ratio
            var time = ratio * ApplyFormula();

            s.AppendFormat("<div class='housekeeper-pricing' data-slider-value='{0}' data-slider-step='{1}'>", ApplyFormula(), sliderStep);
            s.AppendFormat("<div class='label'>Average time to {0} clean a 2 bedroom/2 bathroom home: <span class='note has-tooltip' title='LJDI: To create an estimate pricing for your customers.'>Why are we asking this?</span></div>", type);
            s.AppendFormat(@"<div class='input'><input name='provider-average-time' type='text' value='{0}' />
                    <div class='provider-average-time'>
			            <div class='provider-average-time-slider'></div>
			            <label class='below-average-label'>Below average</label>
			            <label class='average-label'>Average</label>
			            <label class='above-average-label'>Above average</label>
		            </div>
                </div>", time);
            s.Append("<div class='preview'><span class='time'></span> (approximately)</div>");
            s.Append("</div>");

            return s.ToString();
        }
        public bool ValidateProviderData(PackageBaseData package, System.Web.WebPages.Html.ModelStateDictionary modelState)
        {
            // TODO
            return true;
        }
        public void SaveProviderData(PackageBaseData package, Database db)
        {
            var provTime = Request["provider-average-time"].AsInt();
            var provRate = provTime / ApplyFormula();
            // TODO Save rate on DB
        }
        #endregion
    }
    public enum PriceCalculationType : short
    {
        FixedPrice,
        HourlyPrice
    }
    public class PackageBaseConfig
    {
        #region About Pricing Type
        public int PricingTypeID;
        public string SingularName;
        public string PluralName;
        public string SlugName;
        public string AddNewLabel;
        public string ProviderDescription;
        public PriceCalculationType PriceCalculation;
        /// <summary>
        /// NOT IN USE (future?): IsAddon flag is used as the simplest way to define this.
        /// It defines group names in that only one element can be selected
        /// from all that are in the group. This means that a pricing with a group
        /// will only allow select one element from that pricing type, affected too
        /// by any other pricing type that share the same group name;
        /// for pricing types that allows select several elements, the collection will
        /// be null or empty.
        /// </summary>
        public string[] SelectionGroups;
        /// <summary>
        /// NOT IN USE (future?): IsAddon flag is used as the simplest way to define this.
        /// List of selection groups used in other pricing types that will cause that
        /// elements of this type cannot be selected (because you cannot select one of
        /// this when one element of that group is selected, not because are the same
        /// group else because are incompatible and create mutual exclusion.
        /// </summary>
        public string[] SelectionExclusionGroups;
        /// <summary>
        /// For now, we preserve IsAddon additionaly to the pricing-type:addon as a way
        /// to know what packages must be showed in the 'addons' section in booking that
        /// allow multi-selecting. The 'selection*groups' fields are a concept, not uset
        /// still, for now IsAddon works for that use, more simple and enough for now.
        /// </summary>
        public bool IsAddon;
        #endregion
        #region Form Texts
        public string NamePlaceHolder;
        public string SuggestedName;
        public string DurationLabel;
        public string PriceLabel;
        public string PriceNote;
        public string FirstTimeClientsOnlyLabel;
        public string DescriptionPlaceHolder;
        public string PriceRateQuantityLabel;
        public string PriceRateUnitLabel;
        public string NoPriceRateLabel;
        public string NumberOfSessionsLabel;
        public string InPersonPhoneLabel;
        /// <summary>
        /// A CSS class name for the element containing the pricing details
        /// </summary>
        public string ClassName;
        #endregion
        #region Action And Validation Texts
        public string SuccessOnDelete;
        public string ErrorOnDelete;
        public string SuccessOnSave;
        public string ErrorOnSave;
        public string PriceRateIsRequiredValidationError;
        public string PriceRateUnitIsRequiredValidationError;
        #endregion
        #region Help Texts
        public string LearnMoreLabel;
        public string LearnMoreText;
        public string PriceRateLearnMoreLabel;
        public string PriceRateLearnMoreText;
        public string NoPriceRateLearnMoreLabel;
        public string NoPriceRateLearnMoreText;
        #endregion
        #region Additional configuration
        public bool RequireDuration;
        public bool IncludeServiceAttributes;
        public bool IncludeSpecialPromotion;
        #endregion
        #region List Texts
        /// <summary>
        /// SummaryFormat is the default format for summaries (required),
        /// other formats are good for better detail, but depends
        /// on other options configured per type.
        /// Wildcards:
        /// {0}: duration
        /// {1}: sessions
        /// {2}: inperson/phone
        /// </summary>
        public string SummaryFormat;
        public string SummaryFormatMultipleSessions;
        public string SummaryFormatNoDuration;
        public string SummaryFormatMultipleSessionsNoDuration;
        public string WithoutServiceAttributesCustomerMessage;
        public string WithoutServiceAttributesProviderMessage;
        public string FirstTimeClientsOnlyListText;
        public string PriceRateQuantityListLabel;
        public string PriceRateUnitListLabel;
        public string NoPriceRateListMessage;
        #endregion
        #region Booking/PricingEstimate Texts
        /// <summary>
        /// NameAndSummaryFormat is the default format for summaries with package name (required),
        /// other formats are good for better detail, but depends
        /// on other options configured per type.
        /// Wildcards:
        /// {0}: package name
        /// {1}: duration
        /// {2}: sessions
        /// {3}: inperson/phone
        /// </summary>
        public string NameAndSummaryFormat;
        public string NameAndSummaryFormatMultipleSessions;
        public string NameAndSummaryFormatNoDuration;
        public string NameAndSummaryFormatMultipleSessionsNoDuration;
        #endregion
        #region Modification from the base package pricing and out of common things
        public PackageMod Mod;
        #endregion
    }
    #region Pricing Types Configuration
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
                LearnMoreText = "We'll show this as a 'from' rate on your profile to give your potential clients an idea of the costs of your services. You can discuss your full pricing during the estimate and add any materials/parts required to get the job done right.",

                ClassName = "housekeeperservices lightcleaningservices",
                Mod = new PackageModHousekeeper("light")
            }
        }
    };
    #endregion
    public class PackageBaseData
    {
        public int ID;
        public int PricingTypeID;
        public int ProviderUserID;
        public int PositionID;
        public string Name;
        public string Description;
        public decimal Price;
        public TimeSpan Duration;
        public bool FirstTimeClientsOnly;
        public int NumberOfSessions;
        public decimal? PriceRate;
        public string PriceRateUnit;
        public bool IsPhone;
        public int LanguageID;
        public int CountryID;
        public bool Active;
        public List<int> ServiceAttributes = new List<int>();
        public PackageBaseData()
        {
        }
        /// <summary>
        /// Create a package object using a database
        /// dynamic record
        /// </summary>
        /// <param name="package"></param>
        public PackageBaseData(dynamic package)
        {
            ID = package.ProviderPackageID;
            PricingTypeID = package.PricingTypeID;
            ProviderUserID = package.ProviderUserID;
            PositionID = package.PositionID;
            Name = package.Name;
            Description = package.Description;
            Price = package.Price;
            Duration = TimeSpan.FromMinutes(package.ServiceDuration);
            FirstTimeClientsOnly = package.FirstTimeClientsOnly;
            NumberOfSessions = package.NumberOfSessions;
            PriceRate = package.PriceRate;
            PriceRateUnit = package.PriceRateUnit;
            IsPhone = package.IsPhone;
            LanguageID = package.LanguageID;
            CountryID = package.CountryID;
            Active = package.Active;
        }
    }
    #endregion

    #region Variables
    public static PricingSummaryData GetVariableItemNumbers(dynamic pvar, decimal hourPrice, dynamic fee)
    {
        // Get provider value for this pricing variable
        string providerValue = pvar.ProviderDataInputValue;
        decimal timeInHours = 0;

        decimal provValueAsDecimal = 0;
        switch ((string)pvar.ProviderDataInputUnit)
        {
            case "minutes":
                decimal.TryParse(providerValue, out provValueAsDecimal);
                // Getting the provider Item Time in Hours
                timeInHours = provValueAsDecimal / 60;
                break;
            case "hours":
                decimal.TryParse(providerValue, out provValueAsDecimal);
                // Provider value are just in hours:
                timeInHours = provValueAsDecimal;
                break;
            default:
                break;
        }

        timeInHours = Math.Round(timeInHours, 2);

        // Numbers are per item:
        var subtotal = timeInHours * hourPrice;
        var feePrice = ApplyFee(fee, subtotal);

        return new PricingSummaryData{
            ServiceDuration = timeInHours,
            FirstSessionDuration = timeInHours,
            SubtotalPrice = subtotal,
            FeePrice = feePrice,
            TotalPrice = subtotal + feePrice
        };
    }
    /// <summary>
    /// Calculate fees and summary for pricing variables, returning it
    /// </summary>
    /// <param name="pvars"></param>
    /// <param name="hourPrice"></param>
    /// <param name="feeData"></param>
    /// <returns></returns>
    public static PricingModelData CalculateVariables(dynamic pvars, decimal hourPrice, dynamic fee)
    {
        var modelData = new PricingModelData();

        // Collection to save time and price for each pricing variable item
        // Key will be VariableID
        var pricingVariablesNumbers = new Dictionary<int, PricingSummaryData>();

        // Calculate time required per Pricing Variables
        foreach (var pvar in pvars)
        {
            var itemVarSummary = GetVariableItemNumbers(pvar, hourPrice, fee);

            // Analizing the customer value depending on the data-type ('unit' field in the database)
            string customerValue = Request[pvar.PricingVariableName];
            decimal customerQuantity = 0;
            switch ((string)pvar.CustomerDataInputUnit)
            {
                case "number":
                case "times":
                case "quantity":
                    // Customer value is the quantity of items or times item value is repeated.
                    // To get the final time value, multiply by item time in hours
                    // (no on timeInHours, reusing this local var to save total time after this:)
                    decimal.TryParse(customerValue, out customerQuantity);
                    break;
                default:
                    break;
            }

            // Get calculated data for customer selection
            var timeInHours = Math.Round(itemVarSummary.ServiceDuration * customerQuantity, 2);
            var subtotal = Math.Round(itemVarSummary.SubtotalPrice * customerQuantity, 2);
            var feePrice = Math.Round(itemVarSummary.FeePrice * customerQuantity, 2);

            // Create summary object for calculated customer selection
            var customerVarSummary = new PricingSummaryData{
                ServiceDuration = timeInHours,
                FirstSessionDuration = timeInHours,
                SubtotalPrice = subtotal,
                FeePrice = feePrice,
                TotalPrice = subtotal + feePrice
            };

            // Add calculations to Variables Summary:
            modelData.SummaryTotal.Add(customerVarSummary);

            // Add to the returned data collection for Save proccess:
            pricingVariablesNumbers[pvar.PricingVariableID] = customerVarSummary;
        }
        
        // Concept, html text, for pricing summary detail:
        modelData.SummaryTotal.Concept = String.Format(
            "<span class='time-required'>{0:c} hour(s)</span> @ <span class='hour-price'>{1:c}</span>",
            modelData.SummaryTotal.ServiceDuration,
            hourPrice
        );

        // Success:
        modelData.Success = true;
        modelData.Data = new Dictionary<string, object>()
        {
            { "PricingVariablesNumbers", pricingVariablesNumbers }
        };
        return modelData;
    }
    /// <summary>
    /// Save Pricing Variables in customer preferences and as pricing estimate details
    /// </summary>
    /// <param name="estimateID"></param>
    /// <param name="revisionID"></param>
    /// <param name="pvars"></param>
    /// <param name="customerUserID"></param>
    /// <param name="hourPrice"></param>
    /// <param name="pricingVariablesNumbers"></param>
    public static void SaveVariables(
        int estimateID,
        int revisionID,
        dynamic pvars,
        int customerUserID,
        decimal hourPrice,
        Dictionary<int, PricingSummaryData> pricingVariablesNumbers)
    {

        using (var db = Database.Open("sqlloco"))
        {
            // Save data into pricingwizard tables to remember customer preferences
            foreach (var pvar in pvars)
            {
                db.Execute(LcData.sqlSetCustomerPricingVariable, Request[pvar.PricingVariableName], customerUserID, pvar.PricingVariableID);
            }

            // Creating Estimate details: every variable
            foreach (var pvar in pvars)
            {
                // Get numbers per item
                var itemNumbers = pricingVariablesNumbers[pvar.PricingVariableID];
                // Insert data:
                db.Execute(LcData.Booking.sqlInsEstimateDetails, estimateID, revisionID,
                    2, // PricingGroupID:2 for variables
                    pvar.PricingVariableID,
                    0, 0, 0, 0,
                    pvar.ProviderDataInputValue,
                    Request[pvar.PricingVariableName],
                    0, // systemPricingDataInput
                    itemNumbers.ServiceDuration,
                    itemNumbers.FirstSessionDuration,
                    hourPrice,
                    itemNumbers.SubtotalPrice,
                    itemNumbers.FeePrice,
                    itemNumbers.TotalPrice);
            }
        }
    }
    #endregion

    #region Services (attributes)
    public static void SaveServices(
        int estimateID,
        int revisionID)
    {
        var attributes = Request.Form.GetValues("positionservices-attributes");
        if (attributes != null)
        {
            using (var db = Database.Open("sqlloco"))
            {
                /*
                * Save selected services in the Pricing Wizard tables (pricingEstimateDetail)
                */
                foreach (var att in attributes)
                {
                    // Set record (insert or update)
                    db.Execute(LcData.Booking.sqlInsEstimateDetails, estimateID, revisionID,
                        1, // PricingGroupID:1 for services
                        0, 0, 0,
                        att.AsInt(),
                        0,
                        null, null, 0, // There is no input data
                        0, 0, 0, 0, 0, 0); // Calculation fields are ever 0 for selected Regular Services
                }
            }
        }
    }
    #endregion

    #region Options
    public static PricingSummaryData GetOptionItemNumbers(dynamic popt, dynamic fee)
    {
        // Get provider value for this pricing variable
        decimal unitprice = ASP.LcHelpers.GetMoneyNumber(popt.ProviderDataInputValue);

        // Get the equivalent time required from table
        decimal timeInHours = 0;
        if (popt.ProviderTimeRequired is int) {
            timeInHours = (int)popt.ProviderTimeRequired;
        }
        // it's in minutes, we use hours:
        timeInHours = Math.Round(timeInHours / 60, 2);

        // Numbers are per item:
        var subtotal = unitprice;
        var feePrice = ApplyFee(fee, subtotal);

        return new PricingSummaryData{
            ServiceDuration = timeInHours,
            SubtotalPrice = subtotal,
            FeePrice = feePrice,
            TotalPrice = subtotal + feePrice
        };
    }
    public static PricingModelData CalculateOptions(dynamic poptions, dynamic fee)
    {
        var modelData = new PricingModelData();
        // Collection to save time and price for each pricing option item to be used on Save.
        // Key will be OptionID
        var pricingOptionsNumbers = new Dictionary<int, PricingSummaryData>();

        foreach (var popt in poptions){
   
            if (Request[(string)popt.PricingOptionName + "-check"] == "true") {

                var unitNumbers = GetOptionItemNumbers(popt, fee);

                // Get Customer input value: Quantity
                decimal customerQuantity = 0;
                switch ((string)popt.CustomerDataInputUnit) {
                    case "number":
                    case "times":
                    case "quantity":
                        customerQuantity = Request[(string)popt.PricingOptionName].AsDecimal();
                        break;
                    case "":
                    default:
                        customerQuantity = 1;
                        break;
                }

                // Get calculated data for customer selection
                var timeInHours = Math.Round(unitNumbers.ServiceDuration * customerQuantity, 2);
                var subtotal = Math.Round(unitNumbers.SubtotalPrice * customerQuantity, 2);
                var feePrice = Math.Round(unitNumbers.FeePrice * customerQuantity, 2);

                // Create summary object for calculated customer selection
                var customerNumbers = new PricingSummaryData{
                    ServiceDuration = timeInHours,
                    FirstSessionDuration = timeInHours,
                    SubtotalPrice = subtotal,
                    FeePrice = feePrice,
                    TotalPrice = subtotal + feePrice
                };

                // Add calculations to Options Summary:
                modelData.SummaryTotal.Add(customerNumbers);

                // Add to the returned data collection for Save proccess and View:
                pricingOptionsNumbers[popt.PricingOptionID] = customerNumbers;
            }
        }

        // Concept, html text for Pricing summary detail, update? (already set in controller page):
        //modelData.SummaryTotal.Concept = "Optional Services";

        // Success:
        modelData.Success = true;
        modelData.Data = new Dictionary<string, object>(){
            { "PricingOptionsNumbers", pricingOptionsNumbers }
        };
        return modelData;
    }

    public static void SaveOptions(
        int estimateID,
        int revisionID,
        dynamic poptions,
        int customerUserID,
        Dictionary<int, PricingSummaryData> pricingOptionsNumbers)
    {
        using (var db = Database.Open("sqlloco"))
        {
            // Iterate all options and save into customerpricingoptioninputs
            foreach (var popt in poptions) {
                if (Request[popt.PricingOptionName + "-check"] == "true") {
                    // Value to set can be null for options without quantity/value (only check), that cases
                    // we set value '1'
                    db.Execute(LcData.sqlSetCustomerPricingOption, Request[popt.PricingOptionName] ?? 1, customerUserID, popt.PricingOptionID);
                } else {
                    db.Execute(LcData.sqlDelCustomerPricingOption, customerUserID, popt.PricingOptionID);
                }
            }

            // Creating Estimate details: every option checked
            foreach (var popt in poptions) {
                if (Request[popt.PricingOptionName + "-check"] == "true") {
                    // Get time and pricing numbers
                    var itemNumbers = pricingOptionsNumbers[popt.PricingOptionID];
                    // Insert data:
                    db.Execute(LcData.Booking.sqlInsEstimateDetails, 
                        estimateID,
                        revisionID,
                        3, // PricingGroupID:3 for options
                        0, 0,
                        popt.PricingOptionID,
                        popt.ServiceAttributeID,
                        0,
                        popt.ProviderDataInputValue,
                        Request[popt.PricingOptionName] ?? 1,
                        0, // systemPricingDataInput
                        itemNumbers.ServiceDuration,
                        itemNumbers.FirstSessionDuration,
                        0, // hourlyRate (options are not calculated based on a hourly rate, save 0)
                        itemNumbers.SubtotalPrice,
                        itemNumbers.FeePrice,
                        itemNumbers.TotalPrice);
                }
            }
        }
    }
    #endregion

    #region Packages
    public static PricingModelData CalculatePackages(dynamic packages, FeeRate fee, System.Web.WebPages.Html.ModelStateDictionary ModelState)
    {
        var modelData = new PricingModelData();

        var selectedPackage = Request["provider-package"];
        if (!selectedPackage.IsInt()) {
            ModelState.AddFormError("Package selected is not valid");
        }

        if (ModelState.IsValid)
        {
            PackageBaseData thePackage = null;
            // Get database data for selected package
            //var paksAndDetails = LcData.GetProviderPackageByProviderPosition(pos.UserID, pos.PositionID, selectedPackage.AsInt());
            var packageID = selectedPackage.AsInt();

            if (!packages.PackagesByID.ContainsKey(packageID))
            {
                ModelState.AddFormError("Package selected is not valid");
            }
            else
            {
                thePackage = new PackageBaseData(packages.PackagesByID[selectedPackage.AsInt()]);
                var config = LcPricingModel.PackageBasePricingTypeConfigs[(int)thePackage.PricingTypeID];

                // Calculate time and price required for selected package
                if (config.Mod != null)
                {
                    // Applying calculation from the PackageMod
                    config.Mod.CalculateCustomerData(thePackage, fee, modelData, ModelState);
                }

                /* Calculation of ServiceDuration */
                // We get the time of one service - one session:
                decimal sessionTimeInHours = Math.Round((decimal)thePackage.Duration.TotalHours, 2);
                modelData.SummaryTotal.FirstSessionDuration += sessionTimeInHours;
                // Total sessions duration
                int sesNumber = thePackage.NumberOfSessions < 1 ? 1 : thePackage.NumberOfSessions;
                decimal packageTimeInHours = Math.Round(sessionTimeInHours * sesNumber, 2);
                modelData.SummaryTotal.ServiceDuration += packageTimeInHours;

                /* Calculation of price, depending on type */
                switch (config.PriceCalculation)
                {
                    default:
                    case PriceCalculationType.FixedPrice:
                        /* OLD WAY
                        modelData.SummaryTotal.SubtotalPrice += Math.Round(thePackage.Price, 2);
                        modelData.SummaryTotal.FeePrice = LcPricingModel.ApplyFeeAndRound(fee, modelData.SummaryTotal.SubtotalPrice);
                        modelData.SummaryTotal.TotalPrice = modelData.SummaryTotal.SubtotalPrice + modelData.SummaryTotal.FeePrice;
                         */
                        // Price with fees for packages are calculated without decimals
                        // (decission at Barcelona 2013-06-02)
                        var fixedPrice = new Price(thePackage.Price, fee.Percentage, 0);
                        modelData.SummaryTotal.SubtotalPrice += fixedPrice.BasePrice;
                        modelData.SummaryTotal.FeePrice = fixedPrice.FeePrice;
                        modelData.SummaryTotal.TotalPrice = fixedPrice.TotalPrice;
                        break;
                    case PriceCalculationType.HourlyPrice:
                        // For hourly prices we get the provider hourly price defined in the package (PriceRate field)
                        // that is considered to be ever in hours for this kind of pricing-package
                        // and we calculate the fees and total price (customer price) for one hour.
                        // Price with fees for hourly prices are calculated with only one decimal
                        // (decission at Barcelona 2013-06-02)
                        var hourPrice = new Price(thePackage.PriceRate ?? 0, fee.Percentage, 1);

                        // Final price is the result of multiply total duration of the service by the hourly rate
                        // of the package.
                        // Maybe the duration for one session of the package required a custom calculation, using 
                        // a package Mod, called previous to this code (config.Mod.CalculateCustomerData line),
                        // then the common calculation of duration for all sessions was applied and now we get the
                        // final price.
                        // ServiceDuration is in hours and PriceRate is price per hour ever on this cases
                        modelData.SummaryTotal.SubtotalPrice += hourPrice.BasePrice * modelData.SummaryTotal.ServiceDuration;
                        modelData.SummaryTotal.FeePrice += hourPrice.FeePrice * modelData.SummaryTotal.ServiceDuration;
                        modelData.SummaryTotal.TotalPrice += hourPrice.TotalPrice * modelData.SummaryTotal.ServiceDuration;
                        break;
                }
                

                // Concept, html text for Pricing summary detail, update it with package name:
                modelData.SummaryTotal.Concept = "<strong>" + thePackage.Name + "</strong>";

                // Save in session the information that a location is not need for the booking because of the selected package
                System.Web.HttpContext.Current.Session["BookingWithoutLocation"] = thePackage.IsPhone;

                // Packages can contain a price rate, only if its unit is 'hour' we sent it back as HourlyRate to be used
                // on saving
                decimal hourlyRate = 0;
                if (!String.IsNullOrEmpty(thePackage.PriceRateUnit) &&
                    thePackage.PriceRateUnit.ToUpper() == "HOUR")
                    hourlyRate = thePackage.PriceRate ?? 0;

                modelData.Data = new Dictionary<string, object>(){
                    { "SelectedPackageID", packageID }
                    ,{ "HourlyRate", hourlyRate }
                };
            }
        }

        return modelData;
    }
    public static void SavePackages(
        int estimateID,
        int revisionID,
        PricingModelData modelData,
        System.Web.WebPages.Html.ModelStateDictionary ModelState,
        decimal hourPrice)
    {
        int packageID = (int)modelData.Data["SelectedPackageID"];
        using (var db = Database.Open("sqlloco"))
        {
            // TODO Reimplement sqlInsEstimateDetails SQL AND DATA
            // Inserting details of package selected by customer
            db.Execute(LcData.Booking.sqlInsEstimateDetails, 
                estimateID,
                revisionID,
                4, // PricingGroupID:4 for packages
                0, 0, 0, 0,
                packageID,
                Json.Encode(modelData.ProviderInput ?? ""),
                Json.Encode(modelData.CustomerInput ?? ""),
                0, // systemPricingDataInput
                modelData.SummaryTotal.ServiceDuration,
                modelData.SummaryTotal.FirstSessionDuration,
                modelData.Data["HourlyRate"], // hourPrice,
                modelData.SummaryTotal.SubtotalPrice,
                modelData.SummaryTotal.FeePrice,
                modelData.SummaryTotal.TotalPrice);
        }
    }
    #endregion

    #region Addons
    public static PricingModelData CalculateAddons(dynamic addons, dynamic fee, System.Web.WebPages.Html.ModelStateDictionary ModelState)
    {
        var modelData = new PricingModelData();

        // Calculate time and price for selected addons packages
        var selectedAddonsData = new List<dynamic>();
        var selectedAddons = Request.Form.GetValues("provider-package-addons");
        if (selectedAddons == null) {
            selectedAddons = new string[0];
        }

        if (selectedAddons.Length > 0) {
            foreach (var addon in selectedAddons) {
                var addonID = addon.AsInt();
                if (addonID > 0) {
                    //var addonData = LcData.GetProviderPackageByProviderPosition(pos.UserID, pos.PositionID, addonID).Packages[0];
                    var addonData = addons.PackagesByID[addonID];

                    decimal sesHours = Math.Round((decimal)addonData.ServiceDuration / 60, 2);
                    modelData.SummaryTotal.FirstSessionDuration += sesHours;

                    int sesNumber = addonData.NumberOfSessions < 1 ? 1 : addonData.NumberOfSessions;
                    decimal pakHours = Math.Round(sesHours * sesNumber, 2);
                    modelData.SummaryTotal.ServiceDuration += pakHours;
            
                    decimal addonPrice = Math.Round(addonData.Price, 2);
                    modelData.SummaryTotal.SubtotalPrice += addonPrice;

                    decimal addonFee = ApplyFeeAndRound(fee, addonPrice);
                    modelData.SummaryTotal.FeePrice += addonFee;
                    modelData.SummaryTotal.TotalPrice += addonPrice + addonFee;

                    // Concept, html text for Pricing summary detail, update? (already set in controller page):
                    //modelData.SummaryTotal.Concept = "Add-on services";

                    selectedAddonsData.Add(new {
                        addonID = addonID
                        ,sesHours = sesHours
                        ,pakHours = pakHours
                        ,subtotalPrice = addonPrice
                        ,feePrice = addonFee
                        ,addonPrice = addonPrice + addonFee //addonPrice
                    });
                }
            }
        }

        modelData.Data = new Dictionary<string, object>(){
            { "SelectedAddonsData", selectedAddonsData }
        };

        return modelData;
    }
    public static void SaveAddons(
        int estimateID,
        int revisionID,
        PricingModelData modelData,
        System.Web.WebPages.Html.ModelStateDictionary ModelState,
        decimal hourPrice)
    {
        var selectedAddonsData = modelData.Data["SelectedAddonsData"];
        using (var db = Database.Open("sqlloco")) { 
            // Inserting details of addons packages selected by customer
            foreach (var addon in selectedAddonsData)
            {
                db.Execute(LcData.Booking.sqlInsEstimateDetails, estimateID, revisionID,
                    5, // PricingGroupID:5 for addons
                    0, 0, 0, 0,
                    addon.addonID,
                    null, // there is no provider value
                    1, // ever quantity 1
                    0, // systemPricingDataInput
                    addon.pakHours,
                    addon.sesHours,
                    hourPrice,
                    addon.subtotalPrice,
                    addon.feePrice,
                    addon.addonPrice);
            }
        }
    }
    #endregion
}