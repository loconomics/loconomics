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

    #region Fees
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
        return FeeRate.FromDatabaseCustomerFees(feeData);
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
        return FeeRate.FromDatabaseProviderFees(feeData);
    }
    /// <summary>
    /// Gets a set of fees that can be applied to the given parameters,
    /// depending on the target user and package/price.
    /// It ever returns the elements:
    /// "standard:customer" only for customers, applied most of the time (it gets the first-time booking, repeat-booking or book-me-button depending on parameters).
    /// "standard:provider" only for providers, same conditions than for the standard:customer but with the provider fees.
    /// "flat:customer" only for customers, applied on packages that are given for free by providers (most times estimates and consultations).
    /// "flat:provider" only for provider, same conditions than for the standard:customer but with the provider fees.
    /// </summary>
    /// <param name="customerUserID"></param>
    /// <param name="providerUserID"></param>
    /// <param name="pricingTypeID"></param>
    /// <param name="positionID"></param>
    /// <param name="bookCode"></param>
    /// <returns></returns>
    public static Dictionary<string, LcPricingModel.FeeRate> GetFeesSetFor(int customerUserID, int providerUserID, int pricingTypeID, int positionID, string bookCode = null)
    {
        var ret = new Dictionary<string, LcPricingModel.FeeRate>();

        // Get standard fees, that depends on customer and provider relationship and bookCode.
        var standard = LcData.Booking.GetFeeFor(customerUserID, providerUserID, pricingTypeID, positionID, bookCode);
        ret["standard:customer"] = LcPricingModel.GetFee(standard);
        ret["standard:provider"] = LcPricingModel.GetPFee(standard);

        // Get the flat fees that apply most of times to 'free packages'.
        // For the case the 'book-me button :7' fees were apply to standard,
        // use that as 'flat' too (we never will charge to bookings from book-me buttons).
        var flat = standard.BookingTypeID == 7
            ? standard
            : LcData.Booking.GetFeeForFreePackages(customerUserID, providerUserID, pricingTypeID, positionID, bookCode);
        ret["flat:customer"] = LcPricingModel.GetFee(flat);
        ret["flat:provider"] = LcPricingModel.GetPFee(flat);

        return ret;
    }
    /// <summary>
    /// Get the appropiated fees for the user and package price from the given set.
    /// </summary>
    /// <param name="feesSet"></param>
    /// <param name="packagePrice"></param>
    /// <param name="userType"></param>
    /// <returns></returns>
    public static LcPricingModel.FeeRate GetFeeByPackagePrice(Dictionary<string, LcPricingModel.FeeRate> feesSet, decimal packagePrice, LcData.UserInfo.UserType userType)
    {
        string type = packagePrice <= 0 ? "flat:" : "standard:";
        return feesSet[type + userType.ToString().ToLower()];
    }
    #endregion

    #region Packages
    public static PricingModelData CalculatePackages(int customerID, dynamic packages, Dictionary<string, LcPricingModel.FeeRate> feesSet, System.Web.WebPages.Html.ModelStateDictionary ModelState, List<LcPricingModel.PricingSummaryData> detailItems)
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

                // Getting the correct fees for the package
                FeeRate fee = null;
                // Use the package price on FixedPrice packages to get the fees that fit better:
                if (config.PriceCalculation == PriceCalculationType.FixedPrice)
                    fee = LcPricingModel.GetFeeByPackagePrice(feesSet, thePackage.Price, LcData.UserInfo.UserType.Customer);
                else
                    // Else, get the standard ones
                    fee = feesSet["standard:customer"];

                // Calculate time and price required for selected package
                if (config.Mod != null)
                {
                    // Applying calculation from the PackageMod
                    config.Mod.CalculateCustomerData(customerID, thePackage, fee, modelData, ModelState);
                }

                var pakSummary = new PricingSummaryData();
                pakSummary.Concept = thePackage.Name;

                /* Calculation of ServiceDuration */
                // We get the time of one service - one session:
                decimal sessionTimeInHours = Math.Round((decimal)thePackage.Duration.TotalHours, 2);
                pakSummary.FirstSessionDuration = sessionTimeInHours;
                // Total sessions duration
                int sesNumber = thePackage.NumberOfSessions < 1 ? 1 : thePackage.NumberOfSessions;
                decimal packageTimeInHours = Math.Round(sessionTimeInHours * sesNumber, 2);
                pakSummary.ServiceDuration = packageTimeInHours;

                // Packages can contain an hourly rate (its set or left zero depending on calculation type)
                // We sent it back as HourlyRate on modelData to be used on saving.
                decimal hourlyRate = 0;

                /* Calculation of price, depending on type */
                switch (config.PriceCalculation)
                {
                    default:
                    case PriceCalculationType.FixedPrice:
                        // Price with fees for packages are calculated without decimals
                        // (decission at Barcelona 2013-06-02)
                        var fixedPrice = new Price(thePackage.Price, fee, 0);
                        pakSummary.SubtotalPrice = fixedPrice.BasePrice;
                        pakSummary.FeePrice = fixedPrice.FeePrice;
                        pakSummary.TotalPrice = fixedPrice.TotalPrice;

                        // Packages with fixed price set price rate only if
                        // its unit is 'hour'.
                        if (!String.IsNullOrEmpty(thePackage.PriceRateUnit) &&
                            thePackage.PriceRateUnit.ToUpper() == "HOUR")
                            hourlyRate = thePackage.PriceRate ?? 0;
                        break;
                    case PriceCalculationType.HourlyPrice:
                        // For hourly prices we get the provider hourly price defined in the package (PriceRate field)
                        // that is considered to be ever in hours for this kind of pricing-package
                        // and we calculate the fees and total price (customer price) for one hour.
                        // Price with fees for hourly prices are calculated with only one decimal
                        // (decission at Barcelona 2013-06-02)
                        var hourPrice = new Price(thePackage.PriceRate ?? 0, fee, 1);

                        // Hourly pricing could include a 'surcharge price', that gets calculated in the Mod (normally using variables)
                        // and set in the 'HourlySurcharge' field at thePackage: here we need to apply the rounding and fees rules
                        // and then the price is added to the final price mutiplied by the hours, like the hourPrice.
                        // Note: because is a an hourly calculated price, we use the same rule for decimals
                        // as for the hourPrice: only one decimal.
                        var hourlySurchargePrice = new Price(thePackage.HourlySurcharge, fee, 1);

                        // Final price is the result of multiply total duration of the service by the hourly rate
                        // of the package and adding the surchargePrice.
                        // Maybe the duration for one session of the package required a custom calculation, using 
                        // a package Mod, called previous to this code (config.Mod.CalculateCustomerData line),
                        // then the common calculation of duration for all sessions was applied and now we get the
                        // final price; same for the 'surchargeHourPrice'.
                        pakSummary.SubtotalPrice = (hourPrice.BasePrice * packageTimeInHours) + (hourlySurchargePrice.BasePrice * packageTimeInHours);
                        pakSummary.FeePrice = (hourPrice.FeePrice * packageTimeInHours) + (hourlySurchargePrice.FeePrice * packageTimeInHours);
                        pakSummary.TotalPrice = (hourPrice.TotalPrice * packageTimeInHours) + (hourlySurchargePrice.TotalPrice * packageTimeInHours);

                        // We get as hourlyRate the hourPrice without fees
                        hourlyRate = hourPrice.BasePrice;
                        break;
                }
                
                // Update totals and detailed list
                modelData.SummaryTotal.Add(pakSummary);
                detailItems.Add(pakSummary);

                // Concept, html text for Pricing summary detail, update it with package name:
                //modelData.SummaryTotal.Concept = "<strong>" + thePackage.Name + "</strong>";

                // Save in session the information that a location is not need for the booking because of the selected package
                System.Web.HttpContext.Current.Session["BookingWithoutLocation"] = thePackage.IsPhone;

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
        System.Web.WebPages.Html.ModelStateDictionary ModelState)
    {
        int packageID = (int)modelData.Data["SelectedPackageID"];
        using (var db = Database.Open("sqlloco"))
        {
            string provInput = Json.Encode(modelData.ProviderInput ?? "");
            string custInput = "";

            // Supporting PricingVariables
            if (modelData.CustomerInput is PricingVariables)
            {
                custInput = modelData.CustomerInput.ToString();
                ((PricingVariables)modelData.CustomerInput).Save(estimateID, revisionID, WebMatrix.WebData.WebSecurity.CurrentUserId);
            }
            else
            {
                custInput = Json.Encode(modelData.CustomerInput ?? "");
            }

            // Inserting details of package selected by customer
            db.Execute(LcData.Booking.sqlInsEstimateDetails, 
                estimateID,
                revisionID,
                4, // PricingGroupID:4 for packages
                packageID,
                provInput,
                custInput,
                modelData.SummaryTotal.ServiceDuration,
                modelData.SummaryTotal.FirstSessionDuration,
                modelData.Data["HourlyRate"],
                modelData.SummaryTotal.SubtotalPrice,
                modelData.SummaryTotal.FeePrice,
                modelData.SummaryTotal.TotalPrice);
        }
    }
    #endregion

    #region Addons
    public static PricingModelData CalculateAddons(int customerID, dynamic addons, Dictionary<string, LcPricingModel.FeeRate> feesSet, System.Web.WebPages.Html.ModelStateDictionary ModelState, List<LcPricingModel.PricingSummaryData> detailItems)
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

                    // Getting the correct fees for the package
                    // IMPORTANT: Ever get standard fees for add-ons, including price-less addons
                    //var fee = LcPricingModel.GetFeeByPackagePrice(feesSet, addonData.Price, LcData.UserInfo.UserType.Customer);
                    var fee = feesSet["standard:customer"];

                    var pakSummary = new PricingSummaryData();
                    pakSummary.Concept = addonData.Name;

                    decimal sesHours = Math.Round((decimal)addonData.ServiceDuration / 60, 2);
                    pakSummary.FirstSessionDuration = sesHours;

                    int sesNumber = addonData.NumberOfSessions < 1 ? 1 : addonData.NumberOfSessions;
                    decimal pakHours = Math.Round(sesHours * sesNumber, 2);
                    pakSummary.ServiceDuration = pakHours;

                    var price = new Price(Math.Round(addonData.Price, 2), fee, 0);
                    pakSummary.SubtotalPrice = price.BasePrice;
                    pakSummary.FeePrice = price.FeePrice;
                    pakSummary.TotalPrice = price.TotalPrice;

                    modelData.SummaryTotal.Add(pakSummary);
                    detailItems.Add(pakSummary);

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
        System.Web.WebPages.Html.ModelStateDictionary ModelState)
    {
        var selectedAddonsData = modelData.Data["SelectedAddonsData"];
        using (var db = Database.Open("sqlloco")) { 
            // Inserting details of addons packages selected by customer
            foreach (var addon in selectedAddonsData)
            {
                db.Execute(LcData.Booking.sqlInsEstimateDetails, estimateID, revisionID,
                    5, // PricingGroupID:5 for addons
                    addon.addonID,
                    null, // there is no provider value
                    1, // ever quantity 1
                    addon.pakHours,
                    addon.sesHours,
                    0, // Add-ons are ever a fixed price, there is no hourly-rate
                    addon.subtotalPrice,
                    addon.feePrice,
                    addon.addonPrice);
            }
        }
    }
    #endregion
}