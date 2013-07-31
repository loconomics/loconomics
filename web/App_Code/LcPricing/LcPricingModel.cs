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
                        modelData.SummaryTotal.SubtotalPrice += fixedPrice.BasePrice;
                        modelData.SummaryTotal.FeePrice = fixedPrice.FeePrice;
                        modelData.SummaryTotal.TotalPrice = fixedPrice.TotalPrice;

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

                        // We get as hourlyRate the hourPrice without fees
                        hourlyRate = hourPrice.BasePrice;
                        break;
                }
                
                // Concept, html text for Pricing summary detail, update it with package name:
                modelData.SummaryTotal.Concept = "<strong>" + thePackage.Name + "</strong>";

                // Save in session the information that a location is not need for the booking because of the selected package
                System.Web.HttpContext.Current.Session["BookingWithoutLocation"] = thePackage.IsPhone;

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
        System.Web.WebPages.Html.ModelStateDictionary ModelState)
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