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
public static partial class LcPricingModel
{
    #region Utilities
    private static HttpRequest Request
    {
        get
        {
            return HttpContext.Current.Request;
        }
    }
    #endregion

    #region Price and fees
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
        // Calculating price and fees, for hourly prices only 1 decimal
        var hourPriceWithFees = new Price(hourPrice, fee, 1);
        var subtotal = timeInHours * hourPriceWithFees.BasePrice;
        var feePrice = timeInHours * hourPriceWithFees.FeePrice;
        var total = timeInHours * hourPriceWithFees.TotalPrice;

        return new PricingSummaryData{
            ServiceDuration = timeInHours,
            FirstSessionDuration = timeInHours,
            SubtotalPrice = subtotal,
            FeePrice = feePrice,
            TotalPrice = total
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
        // Calculating price and fees, for options only 1 decimal
        var priceWithFees = new Price(unitprice, fee, 1);

        return new PricingSummaryData{
            ServiceDuration = timeInHours,
            SubtotalPrice = priceWithFees.BasePrice,
            FeePrice = priceWithFees.FeePrice,
            TotalPrice = priceWithFees.TotalPrice
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
                        // Price with fees for packages are calculated without decimals
                        // (decission at Barcelona 2013-06-02)
                        var fixedPrice = new Price(thePackage.Price, fee, 0);
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
                        var hourPrice = new Price(thePackage.PriceRate ?? 0, fee, 1);

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
                    ,{ "PricingTypeID", (int)thePackage.PricingTypeID }
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
            string provInput = Json.Encode(modelData.ProviderInput ?? "");
            string custInput = "";

            // Supporting PackageVariables, saving that in its own place on database
            // and too as customerInput
            if (modelData.CustomerInput is PackageVariables)
            {
                custInput = modelData.CustomerInput.ToString();
                ((PackageVariables)modelData.CustomerInput).Save(estimateID, revisionID, WebMatrix.WebData.WebSecurity.CurrentUserId);
            }
            else
            {
                custInput = Json.Encode(modelData.CustomerInput ?? "");
            }

            // TODO Reimplement sqlInsEstimateDetails SQL AND DATA
            // Inserting details of package selected by customer
            db.Execute(LcData.Booking.sqlInsEstimateDetails, 
                estimateID,
                revisionID,
                4, // PricingGroupID:4 for packages
                0, 0, 0, 0,
                packageID,
                provInput,
                custInput,
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

                    var price = new Price(Math.Round(addonData.Price, 2), fee, 0);
                    modelData.SummaryTotal.SubtotalPrice += price.BasePrice;
                    modelData.SummaryTotal.FeePrice += price.FeePrice;
                    modelData.SummaryTotal.TotalPrice += price.TotalPrice;

                    // Concept, html text for Pricing summary detail, update? (already set in controller page):
                    //modelData.SummaryTotal.Concept = "Add-on services";

                    selectedAddonsData.Add(new {
                        addonID = addonID
                        ,sesHours = sesHours
                        ,pakHours = pakHours
                        ,subtotalPrice = price.BasePrice
                        ,feePrice = price.FeePrice
                        ,addonPrice = price.TotalPrice
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