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

                // TODO Apply new calculation per element, retrieving on pricingVariablesNumbers the item price with fee included
                modelData.SummaryTotal.SubtotalPrice += Math.Round(thePackage.Price, 2);
                modelData.SummaryTotal.FeePrice = Math.Round((fee.Percentage * modelData.SummaryTotal.SubtotalPrice) + fee.Currency, 2);
                modelData.SummaryTotal.TotalPrice = modelData.SummaryTotal.SubtotalPrice + modelData.SummaryTotal.FeePrice;
                // TODO TimeFirstSession in modelData?

                // Concept, html text for Pricing summary detail, update it with package name:
                modelData.SummaryTotal.Concept = "<strong>" + thePackage.Name + "</strong>";

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