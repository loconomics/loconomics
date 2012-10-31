using System;
using System.Collections.Generic;
using WebMatrix.Data;
using System.Web;

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

        decimal feePercentage = 0M, feeCurrency = 0M;
        if (feeData.ServiceFeeCurrency)
        {
            feeCurrency = feeData.ServiceFeeAmount;
        }
        if (feeData.ServiceFeePercentage)
        {
            feePercentage = feeData.ServiceFeeAmount;
        }

        modelData.SubtotalPrice = Math.Round(modelData.ServiceDuration * hourPrice, 2);
        modelData.FeePrice = Math.Round((feePercentage * modelData.SubtotalPrice) + feeCurrency, 2);
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

            /* Save data into pricingwizard tables to remember customer preferences
            */
            // Iterate all variables and save into customerpricingvariableinputs
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
        int revisionID,
        dynamic services)
    {
        using (var db = Database.Open("sqlloco"))
        {
            /*
            * Save selected services in the Pricing Wizard tables (pricingEstimateDetail)
            */
            foreach (var att in services) {
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
    #endregion
}