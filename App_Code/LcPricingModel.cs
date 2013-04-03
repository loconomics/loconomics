using System;
using System.Collections.Generic;
using WebMatrix.Data;
using System.Web;
using System.Web.WebPages;

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
        public PricingSummaryData SummaryTotal = new PricingSummaryData();
    }

    public class PricingSummaryData
    {
        public decimal SubtotalPrice = 0M;
        public decimal FeePrice = 0M;
        public decimal TotalPrice = 0M;
        public decimal PFeePrice = 0M;
        public decimal ServiceDuration = 0M;
        public string Concept = "";
        public PricingSummaryData()
        {
        }
        public PricingSummaryData(string concept)
        {
            this.Concept = concept;
        }
        public PricingSummaryData(decimal subtotalPrice, decimal feePrice, decimal totalPrice, decimal serviceDuration, decimal pFeePrice = 0)
        {
            this.SubtotalPrice = subtotalPrice;
            this.FeePrice = feePrice;
            this.TotalPrice = totalPrice;
            this.PFeePrice = pFeePrice;
            this.ServiceDuration = serviceDuration;
        }
        public static PricingSummaryData operator + (PricingSummaryData one, PricingSummaryData add)
        {
            return new PricingSummaryData(
                one.SubtotalPrice + add.SubtotalPrice,
                one.FeePrice + add.FeePrice,
                one.TotalPrice + add.TotalPrice,
                one.ServiceDuration + add.ServiceDuration,
                one.PFeePrice + add.PFeePrice
            );
        }
        public void Add(PricingSummaryData add)
        {
            this.ServiceDuration += add.ServiceDuration;
            this.SubtotalPrice += add.SubtotalPrice;
            this.FeePrice += add.FeePrice;
            this.TotalPrice += add.TotalPrice;
            this.PFeePrice += add.PFeePrice;
            if (!String.IsNullOrEmpty(add.Concept))
                this.Concept = add.Concept;
        }
    }

    /// <summary>
    /// Small utility, convert database scheme data about
    /// fee to apply into an easy struct with Percentage
    /// and Currency fee to be applied, with default to 0
    /// when no apply one of them
    /// </summary>
    /// <param name="feeData"></param>
    /// <returns></returns>
    public static dynamic GetFee(dynamic feeData)
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
        return new {
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
    public static dynamic GetPFee(dynamic feeData)
    {
        return new {
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
    public class PackageBaseConfig
    {
        #region About Pricing Type
        public int PricingTypeID;
        public string SingularName;
        public string PluralName;
        public string SlugName;
        public string AddNewLabel;
        public string ProviderDescription;
        /// <summary>
        /// It defines group names in that only one element can be selected
        /// from all that are in the group. This means that a pricing with a group
        /// will only allow select one element from that pricing type, affected too
        /// by any other pricing type that share the same group name;
        /// for pricing types that allows select several elements, the collection will
        /// be null or empty.
        /// </summary>
        public string[] SelectionGroups;
        /// <summary>
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
        public bool IncludeServiceAttributes;
        public bool IncludeSpecialPromotion;
        #endregion
        #region List Texts
        /// <summary>
        /// Wildcards:
        /// {0}: number of sessions
        /// {1}: duration in minutes
        /// </summary>
        public string SummaryFormat;
        public string SummaryFormatUniqueSession;
        public string WithoutServiceAttributesCustomerMessage;
        public string WithoutServiceAttributesProviderMessage;
        public string FirstTimeClientsOnlyListText;
        public string PriceRateQuantityListLabel;
        public string PriceRateUnitListLabel;
        public string NoPriceRateListMessage;
        #endregion
        #region Booking/PricingEstimate Texts
        public string NameAndSummaryFormat;
        public string NameAndSummaryFormatUniqueSession;
        #endregion
    }
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
                SelectionGroups = new string[]{"package"},
        
                NamePlaceHolder = "Type the name of the package (be descriptive and creative)",
                NumberOfSessionsLabel = "Number of appointments included:",
                PriceLabel = "Price for package:",
                PriceNote = "(this should be all-inclusive)",
                DurationLabel = "Duration (per appointment):",
                DescriptionPlaceHolder = "Describe to your potential clients in detail the service(s) you provide and include a description of any products included (if applicable)",
                FirstTimeClientsOnlyLabel = "This package is available to first-time clients only",
                FirstTimeClientsOnlyListText = "This package is available to first-time clients only",

                SuccessOnDelete = "Package removed succesfully",
                SuccessOnSave = "Add/Edit packages",

                SummaryFormat = "{1} appointments - {0} minutes each",
                SummaryFormatUniqueSession = "{0} minutes",
                NameAndSummaryFormat = "{0}, {2} appointments - {1} minutes each",
                NameAndSummaryFormatUniqueSession = "{0}, {1} minutes",

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
                IsAddon = true,

                NamePlaceHolder = "Type the name of the add-on service (be descriptive and creative)",
                PriceLabel = "Price for add-on service:",
                PriceNote = "(this should be all-inclusive)",
                DurationLabel = "Length of service:",
                DescriptionPlaceHolder = "Describe to your potential clients in detail the add-on service they'll receive and include a description of any products included (if applicable)",

                SuccessOnDelete = "Add-on removed succesfully",
                SuccessOnSave = "Add/Edit add-ons",

                SummaryFormatUniqueSession = "{0} minutes",
                NameAndSummaryFormat = "{0}, {2} appointments - {1} minutes each",
                NameAndSummaryFormatUniqueSession = "{0}, {1} minutes",

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
                SelectionGroups = new string[]{"package"},

                NamePlaceHolder = "Type the name of the estimate visit, e.g. \"Work assessment visit\", \"Pricing estimate visit\"",
                DurationLabel = "Approximate length of visit:",
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

                SummaryFormatUniqueSession = "{0} minutes ({2} estimate)",
                NameAndSummaryFormat = "{0}, {2} appointments - {1} minutes each ({3} estimation)",
                NameAndSummaryFormatUniqueSession = "{0}, {1} minutes ({3} estimation)",

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
                SelectionGroups = new string[]{"package"},

                NamePlaceHolder = "Type the name of the consultation, e.g. \"Initial consultation\", \"Introductory meeting\".",
                DurationLabel = "Approx. length of consultation:",
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

                SummaryFormatUniqueSession = "{0} minutes ({2} consultation)",
                NameAndSummaryFormat = "{0}, {2} appointments - {1} minutes each ({3} consultation)",
                NameAndSummaryFormatUniqueSession = "{0}, {1} minutes ({3} consultation)",

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
                SelectionGroups = new string[]{"package"},

                NamePlaceHolder = "Type the name of the service (be descriptive and creative)",
                DurationLabel = "Length of service:",
                PriceLabel = "Price for service:",
                PriceNote = "(this should be all-inclusive)",
                DescriptionPlaceHolder = "Describe to your potential clients in detail the service you provide and include a description of any products included (if applicable).",
                FirstTimeClientsOnlyLabel = "This service is available to first-time clients only",
                FirstTimeClientsOnlyListText = "This service is available to first-time clients only",

                SuccessOnDelete = "Service removed succesfully",
                SuccessOnSave = "Add/Edit services",

                SummaryFormatUniqueSession = "{0} minutes",
                NameAndSummaryFormat = "{0}, {2} appointments - {1} minutes each",
                NameAndSummaryFormatUniqueSession = "{0}, {1} minutes",

                IncludeServiceAttributes = true,

                LearnMoreLabel = "Learn more about service pricing",
                LearnMoreText = "Here you can add each individual service you provide and communicate to clients the time you'll need and the price you charge. Add a package if you'd also like to bundle services or offer discounts for multiple appointments.",
            }
        }
    };
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
                        0, 0, 0, 0, 0); // Calculation fields are ever 0 for selected Regular Services
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
    public static PricingModelData CalculatePackages(dynamic packages, dynamic fee, System.Web.WebPages.Html.ModelStateDictionary ModelState)
    {
        var modelData = new PricingModelData();

        var selectedPackage = Request["provider-package"];
        if (!selectedPackage.IsInt()) {
            ModelState.AddFormError("Package selected is not valid");
        }

        if (ModelState.IsValid)
        {
            dynamic thePackage = null;
            decimal timeFirstSession = 0;
            // Get database data for selected package
            //var paksAndDetails = LcData.GetProviderPackageByProviderPosition(pos.UserID, pos.PositionID, selectedPackage.AsInt());
            var packageID = selectedPackage.AsInt();

            if (!packages.PackagesByID.ContainsKey(packageID))
            {
                ModelState.AddFormError("Package selected is not valid");
            }
            else
            {
                thePackage = packages.PackagesByID[selectedPackage.AsInt()];

                // Calculate time and price required for selected package

                // We get the time of one service - one session. ServiceDuration is in Minutes ever, convert to hours:
                decimal sessionTimeInHours = Math.Round((decimal)thePackage.ServiceDuration / 60, 2);
                timeFirstSession += sessionTimeInHours;

                decimal packageTimeInHours = Math.Round(sessionTimeInHours * thePackage.NumberOfSessions, 2);
                modelData.SummaryTotal.ServiceDuration += packageTimeInHours;

                modelData.SummaryTotal.SubtotalPrice += Math.Round(thePackage.Price, 2);
                modelData.SummaryTotal.FeePrice = LcPricingModel.ApplyFeeAndRound(fee, modelData.SummaryTotal.SubtotalPrice);
                modelData.SummaryTotal.TotalPrice = modelData.SummaryTotal.SubtotalPrice + modelData.SummaryTotal.FeePrice;
                // TODO TimeFirstSession in modelData?

                // Concept, html text for Pricing summary detail, update it with package name:
                modelData.SummaryTotal.Concept = "<strong>" + thePackage.Name + "</strong>";

                // Save in session the information that a location is not need for the booking because of the selected package
                System.Web.HttpContext.Current.Session["BookingWithoutLocation"] = thePackage.IsPhone;

                modelData.Data = new Dictionary<string, object>(){
                    { "SelectedPackageID", packageID }
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
                null, // there is no provider value
                1, // ever quantity 1
                0, // systemPricingDataInput
                modelData.SummaryTotal.ServiceDuration,
                hourPrice,
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
        decimal timeFirstSession = 0;

        if (selectedAddons.Length > 0) {
            foreach (var addon in selectedAddons) {
                var addonID = addon.AsInt();
                if (addonID > 0) {
                    //var addonData = LcData.GetProviderPackageByProviderPosition(pos.UserID, pos.PositionID, addonID).Packages[0];
                    var addonData = addons.PackagesByID[addonID];

                    decimal sesHours = Math.Round((decimal)addonData.ServiceDuration / 60, 2);
                    timeFirstSession += sesHours;
            
                    decimal pakHours = Math.Round(sesHours * addonData.NumberOfSessions, 2);
                    modelData.SummaryTotal.ServiceDuration += pakHours;
            
                    decimal addonPrice = Math.Round(addonData.Price, 2);
                    modelData.SummaryTotal.SubtotalPrice += addonPrice;

                    decimal addonFee = ApplyFeeAndRound(fee, addonPrice);
                    modelData.SummaryTotal.FeePrice += addonFee;
                    modelData.SummaryTotal.TotalPrice += addonPrice + addonFee;

                    // Concept, html text for Pricing summary detail, update? (already set in controller page):
                    //modelData.SummaryTotal.Concept = "Add-on services";

                    // TODO TimeFirstSession in modelData?

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
                    hourPrice,
                    addon.subtotalPrice,
                    addon.feePrice,
                    addon.addonPrice);
            }
        }
    }
    #endregion
}