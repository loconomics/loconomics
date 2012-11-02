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
    private static HttpRequest Request
    {
        get
        {
            return HttpContext.Current.Request;
        }
    }

    public class PricingModelData {
        public bool Success = false;
        public decimal SubtotalPrice = 0M;
        public decimal FeePrice = 0M;
        public decimal TotalPrice = 0M;
        public decimal ServiceDuration = 0M;
        public dynamic Data = null;
    }

    /// <summary>
    /// Small utility, convert database scheme data about
    /// fee to apply into an easy struct with Percentage
    /// and Currency fee to be applied, with default to 0
    /// when no apply one of them
    /// </summary>
    /// <param name="feeData"></param>
    /// <returns></returns>
    static dynamic GetFee(dynamic feeData)
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

    #region Variables
    /// <summary>
    /// Calculate fees and summary for pricing variables, returning it
    /// </summary>
    /// <param name="pvars"></param>
    /// <param name="hourPrice"></param>
    /// <param name="feeData"></param>
    /// <returns></returns>
    public static PricingModelData CalculateVariables(dynamic pvars, decimal hourPrice, dynamic feeData)
    {
        var modelData = new PricingModelData();

        // Collection to save time and price for each pricing variable item
        // Key will be VariableID, first decimal is time required for the item
        // and second is calculated price for this item
        var pricingVariablesNumbers = new Dictionary<int, decimal[]>();

        // Calculate time required per Pricing Variables
        foreach (var pvar in pvars)
        {
            string customerValue = Request[pvar.PricingVariableName];

            // Get provider value for this pricing variable
            string providerValue = pvar.ProviderDataInputValue;
            decimal timeInHours = 0;

            // Analizing the provider value depending on the data-type ('unit' field in the database)
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
            // Analizing the customer value depending on the data-type ('unit' field in the database)
            decimal custValueAsDecimal = 0;
            switch ((string)pvar.CustomerDataInputUnit)
            {
                case "number":
                case "times":
                case "quantity":
                    decimal.TryParse(customerValue, out custValueAsDecimal);
                    // Customer value is the quantity of items or times item value is repeated.
                    // To get the final time value, multiply by item time in hours
                    // (no on timeInHours, reusing this local var to save total time after this:)
                    timeInHours = timeInHours * custValueAsDecimal;
                    break;
                default:
                    break;
            }

            timeInHours = Math.Round(timeInHours, 2);
            modelData.ServiceDuration += timeInHours;
            pricingVariablesNumbers[pvar.PricingVariableID] = new decimal[] { timeInHours, Math.Round(hourPrice * timeInHours, 2) };
        }

        var fee = GetFee(feeData);
        // TODO Apply new calculation per element, retrieving on pricingVariablesNumbers the item price with fee included
        modelData.SubtotalPrice = Math.Round(modelData.ServiceDuration * hourPrice, 2);
        modelData.FeePrice = Math.Round((fee.Percentage * modelData.SubtotalPrice) + fee.Currency, 2);
        modelData.TotalPrice = modelData.SubtotalPrice + modelData.FeePrice;

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
        Dictionary<int, decimal[]> pricingVariablesNumbers)
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
                // Get pair time and price
                decimal[] timeprice = pricingVariablesNumbers[pvar.PricingVariableID];
                // Insert data:
                db.Execute(LcData.Booking.sqlInsEstimateDetails, estimateID, revisionID,
                    pvar.PricingVariableID,
                    0, 0, 0, 0,
                    pvar.ProviderDataInputValue,
                    Request[pvar.PricingVariableName],
                    0, // systemPricingDataInput
                    hourPrice,
                    timeprice[0], timeprice[1]);
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
                    db.Execute(LcData.Booking.sqlInsEstimateDetails, estimateID,
                        revisionID,
                        0, 0, 0,
                        att.AsInt(),
                        0, null, null, // There is no input data
                        0, 0, 0, 0); // Calculation fields are ever 0 for selected Regular Services
                }
            }
        }
    }
    #endregion

    #region Options
    public static PricingModelData CalculateOptions(dynamic poptions, dynamic feeData)
    {
        var modelData = new PricingModelData();
        // Collection of prices per option to use when restoring the view with post data
        var optionalServicesPrices = new Dictionary<int,decimal>();
        // Collection to save time and price for each pricing option item to be used on Save.
        // Key will be OptionID, first decimal is time required for the item
        // and second is calculated price for this item
        var pricingOptionsNumbers = new Dictionary<int,decimal[]>();

        foreach (var popt in poptions){
            decimal optPrice = 0;
                
            if (Request[(string)popt.PricingOptionName + "-check"] == "true") {
                // TODO Must replace € simbol too, better as an utility function (in file or LcHelper)
                string strprice = popt.ProviderDataInputValue.Replace("$", "");
                decimal unitprice = 0;
                decimal.TryParse(strprice, out unitprice);
                decimal quantity = 0;
                switch ((string)popt.CustomerDataInputUnit) {
                    case "number":
                    case "times":
                    case "quantity":
                        quantity = Request[(string)popt.PricingOptionName].AsDecimal();
                        break;
                    case "":
                    default:
                        quantity = 1;
                        break;
                }
                optPrice = Math.Round(quantity * unitprice, 2);
                // Get the equivalent time required from table
                decimal timeVar = 0;
                if (popt.ProviderTimeRequired is decimal) {
                    timeVar = (decimal)popt.ProviderTimeRequired;
                }
                // Add pricing option estimate time to the total time,
                // it's in minutes, we use hours for timeRequired:
                modelData.ServiceDuration += Math.Round(timeVar / 60, 2);
                pricingOptionsNumbers[popt.PricingOptionID] = new decimal[]{timeVar, optPrice};
            }
            optionalServicesPrices.Add(popt.PricingOptionID, optPrice);
            modelData.SubtotalPrice += optPrice;
        }

        var fee = GetFee(feeData);
        // TODO: apply new calculation of fee per element, with optionPrice+fee on optionalServicesPrices instead optionSubtotal
        modelData.FeePrice = Math.Round((fee.Percentage * modelData.SubtotalPrice) + fee.Currency, 2);
        modelData.TotalPrice = modelData.SubtotalPrice + modelData.FeePrice;

        // Success:
        modelData.Success = true;
        modelData.Data = new Dictionary<string, object>(){
            { "OptionalServicesPrices", optionalServicesPrices }
            ,{ "PricingOptionsNumbers", pricingOptionsNumbers }
        };
        return modelData;
    }

    public static void SaveOptions(
        int estimateID,
        int revisionID,
        dynamic poptions,
        int customerUserID,
        Dictionary<int,decimal[]> pricingOptionsNumbers)
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
                    // Get pair time and price
                    decimal[] timeprice = pricingOptionsNumbers[popt.PricingOptionID];
                    // Insert data:
                    db.Execute(LcData.Booking.sqlInsEstimateDetails, 
                        estimateID,
                        revisionID,
                        0, 0,
                        popt.PricingOptionID,
                        popt.ServiceAttributeID,
                        0,
                        popt.ProviderDataInputValue,
                        Request[popt.PricingOptionName] ?? 1,
                        0, // systemPricingDataInput
                        0, // hourlyRate (options are not calculated based on a hourly rate, save 0)
                        timeprice[0], timeprice[1]);
                }
            }
        }
    }
    #endregion

    #region Packages
    public static PricingModelData CalculatePackages(dynamic packages, dynamic feeData, System.Web.WebPages.Html.ModelStateDictionary ModelState)
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
                modelData.ServiceDuration += packageTimeInHours;

                var fee = GetFee(feeData);
                // TODO Apply new calculation per element, retrieving on pricingVariablesNumbers the item price with fee included
                modelData.SubtotalPrice += Math.Round(thePackage.Price, 2);
                modelData.FeePrice = Math.Round((fee.Percentage * modelData.SubtotalPrice) + fee.Currency, 2);
                modelData.TotalPrice = modelData.SubtotalPrice + modelData.FeePrice;
                // TODO TimeFirstSession in modelData?

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
                0, 0, 0, 0,
                packageID,
                null, // there is no provider value
                1, // ever quantity 1
                0, // systemPricingDataInput
                hourPrice,
                modelData.ServiceDuration,
                modelData.TotalPrice);
        }
    }
    #endregion

    #region Addons
    public static PricingModelData CalculateAddons(dynamic addons, dynamic feeData, System.Web.WebPages.Html.ModelStateDictionary ModelState)
    {
        var modelData = new PricingModelData();

        // Calculate time and price for selected addons packages
        var selectedAddonsData = new List<dynamic>();
        var selectedAddons = Request.Form.GetValues("provider-package-addons");
        if (selectedAddons == null) {
            selectedAddons = new string[0];
        }
        decimal timeFirstSession = 0;
        var fee = GetFee(feeData);

        if (selectedAddons.Length > 0) {
            foreach (var addon in selectedAddons) {
                var addonID = addon.AsInt();
                if (addonID > 0) {
                    //var addonData = LcData.GetProviderPackageByProviderPosition(pos.UserID, pos.PositionID, addonID).Packages[0];
                    var addonData = addons.PackagesByID[addonID];

                    decimal sesHours = Math.Round((decimal)addonData.ServiceDuration / 60, 2);
                    timeFirstSession += sesHours;
            
                    decimal pakHours = Math.Round(sesHours * addonData.NumberOfSessions, 2);
                    modelData.ServiceDuration += pakHours;
            
                    decimal addonPrice = Math.Round(addonData.Price, 2);
                    modelData.SubtotalPrice += addonPrice;

                    decimal addonFee = Math.Round((fee.Percentage * addonPrice) + fee.Currency, 2);
                    modelData.FeePrice += addonFee;
                    modelData.TotalPrice += addonPrice + addonFee;

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
                    0, 0, 0, 0,
                    addon.addonID,
                    null, // there is no provider value
                    1, // ever quantity 1
                    0, // systemPricingDataInput
                    hourPrice,
                    addon.pakHours, addon.addonPrice);
            }
        }
    }
    #endregion
}