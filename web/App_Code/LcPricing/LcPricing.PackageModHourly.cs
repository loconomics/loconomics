using System;
using System.Collections.Generic;
using WebMatrix.Data;
using System.Web;
using System.Web.WebPages;
using System.Web.Helpers;
using System.Text;

/// <summary>
/// Extension of LcPricingModel
/// </summary>
public static partial class LcPricingModel
{
    public class PackageModHourly : PackageMod
    {
        public PackageModHourly()
        {
        }
        #region Utilities
        private string EncodeForHtml(string s)
        {
            return HttpContext.Current.Server.HtmlEncode(s);
        }
        #endregion
        #region Customer form part
        public void CalculateCustomerData(int customerID, PackageBaseData package, FeeRate fee, PricingModelData modelData, System.Web.WebPages.Html.ModelStateDictionary ModelState)
        {
            /* IMPORTANT: we set here the service duration for one session based on the customer value (from the form),
             * update the hourly-price from provider variable value
             * and the hourly-surcharge based on the variables.
             * Final price and fees are calculated in the standard code using the package Duration field and HourlySurcharge field, because of that
             * the final price is not calculated here. */

            // TOREVIEW: Needs input data validation with ModelState and check ModelState.IsValid at LcPricingModel?

            // Getting variables
            PricingVariables pricingvars = PricingVariables.FromPackageBaseData(package);
            TimeSpan timeDuration = TimeSpan.Zero;
            decimal hourlySurcharge = 0;

            // Iterating customer variables:
            foreach (var pvar in pricingvars)
            {
                if (pvar.Value.Def.IsCustomerVariable)
                {
                    // Setting value from the form
                    pvar.Value.Value = LcUtils.GetTypedValue(Request[String.Format("{0}[{1}]", pvar.Key, package.ID)], null, pvar.Value.Def.DataType);
                    // For the 'Hours:2' customer variable, we get it form the form and set the duration with it.
                    if (pvar.Key == "Hours")
                    {
                        // Create time object from duration, rounded to quarter-hours (15 minutes blocks)
                        var duration = pvar.Value.GetValue<double>(0);
                        timeDuration = ASP.LcHelpers.RoundTimeToQuarterHour(TimeSpan.FromHours(duration), ASP.LcHelpers.RoundingType.Up);
                    }
                    else
                    {
                        // For other variables, we calculate it using the general formula and its added to the hourly surcharge
                        // Get the provider var, we need its values.
                        var provar = pricingvars.GetCalculateWithVariableFor(pvar.Value);
                        // General formula for 1 hour: (CustomerValueInputVariable - ProviderNumberIncludedVariable) * ProviderPriceVariable
                        // EXCEPT when CustomerValueInputVariable is equal or less than ProviderNumberIncludedVariable, then is 0
                        decimal amount = 0;
                        if (pvar.Value.GetValue<decimal>(0) > (provar.ProviderNumberIncluded ?? 0))
                            amount = (pvar.Value.GetValue<decimal>(0) - (provar.ProviderNumberIncluded ?? 0)) * provar.GetValue<decimal>(0);
                        // Add to the hourly surcharge
                        hourlySurcharge += amount;
                    }
                }
            }

            // Update package data:
            package.Duration = timeDuration;
            package.HourlySurcharge = hourlySurcharge;
            modelData.CustomerInput = pricingvars;
        }
        public string GetCustomerHtml(int customerID, PackageBaseData package, FeeRate fee)
        {
            // Get variables
            PricingVariables provars = PricingVariables.FromPackageBaseData(package);
            // Update vars with customers values from its last estimate/booking?
            PricingVariables.UpdateWithLastCustomerValues(provars, customerID);

            var sv = new StringBuilder();

            // Iterating customer variables:
            foreach (var custvar in provars)
            {
                if (custvar.Value.Def.IsCustomerVariable)
                {
                    var calculateWithVar = provars.GetCalculateWithVariableFor(custvar.Value);
                    var provPrice = new Price(calculateWithVar.GetValue<decimal>(0), fee, 1);
                    string footNoteFormat = calculateWithVar.PricingVariableID == 1 ? "Base rate is {0:C} per hour" : "Add {0:C} per hour is for each additional {2}";
                    // If package already include an amount, notify it
                    if ((calculateWithVar.ProviderNumberIncluded ?? 0) > 0)
                        footNoteFormat = "Includes {1:#,##0.##} {3}--add {0:C}/hr for each add'l {2}";
                    string sliderFootnote = String.Format(footNoteFormat, provPrice.TotalPrice,
                        calculateWithVar.ProviderNumberIncluded, calculateWithVar.Def.VariableNameSingular,
                        calculateWithVar.Def.VariableNamePlural);

                    // We set the customer value as
                    // - the posted-form value,
                    // - else the db saved value (it works when variables get updated with its last estimate/booking values)
                    // - else the ProviderNumberIncluded for the var
                    // - else defaulted to zero:
                    var custValue = Request[String.Format("{1}[{0}]", package.ID, EncodeForHtml(custvar.Key))]
                        .AsDecimal(custvar.Value.GetValue<decimal>(calculateWithVar.ProviderNumberIncluded ?? 0));

                    sv.AppendFormat(@"
                        <div class='customer-slider' data-prov-value='{2}'
                            data-slider-value='{5}' data-slider-step='{6}' data-slider-footnote='{7}' data-slider-stype='hourly'
                            data-slider-min='{8}' data-slider-max='{9}' data-slider-number-included='{10}' data-slider-labels-layout='{11}'>
                        <label><span class='has-tooltip' title='{4}'>{3}</span>: <input name='{1}[{0}]' type='text' value='{5}' /></label></div>"
                        ,package.ID
                        ,EncodeForHtml(custvar.Key)
                        ,provPrice.BasePrice // Gives to html the price without fees, that are calculated client-side
                        ,EncodeForHtml(custvar.Value.Def.VariableLabel)
                        ,EncodeForHtml(custvar.Value.Def.VariableLabelPopUp)
                        ,custValue
                        // slider step fixed to 1 for most cases, or .25 for Hours
                        ,custvar.Value.PricingVariableID == 2 ? .25 : 1
                        ,EncodeForHtml(sliderFootnote)
                        ,calculateWithVar.ProviderMinNumberAllowed
                        ,calculateWithVar.ProviderMaxNumberAllowed
                        ,calculateWithVar.ProviderNumberIncluded
                        // special labels for Hours
                        ,custvar.Key == "Hours" ? "hours" : "standard");
                }
            }

            // Create html
            var h = new StringBuilder();
            h.AppendFormat("<div class='hourly-pricing' data-fee-rate='{0}' data-fixed-fee-amount='{1}'>", fee.Percentage, fee.Currency);
            h.Append(sv);
            h.Append("</div>");

            return h.ToString();
        }
        #endregion
        #region Provider form part
        public string GetProviderHtml(PackageBaseData package)
        {
            // Get variables
            PricingVariables provars = PricingVariables.FromPackageBaseData(package);

            // Create html for form elements, variables values organized per sections
            var hValues = new StringBuilder();
            var hSurcharges = new StringBuilder();
            var hIncludes = new StringBuilder();
            var hRestrictions = new StringBuilder();
            // Iterating provider variables:
            foreach (var provar in provars)
            {
                if (provar.Value.Def.IsProviderVariable)
                {
                    if (!String.IsNullOrEmpty(provar.Value.Def.HourlySurchargeLabel))
                    {
                        hSurcharges.AppendFormat("<li><label>$ <input type='text' name='{1}-value' value='{3}' /> <span class='has-tooltip' title='{2}'>{0}</span></label></li>",
                            EncodeForHtml(provar.Value.Def.HourlySurchargeLabel),
                            EncodeForHtml(provar.Value.Def.InternalName), //==Key
                            EncodeForHtml(provar.Value.Def.VariableLabelPopUp),
                            Request[provar.Key + "-value"] ?? provar.Value.Value);
                    }
                    else
                    {
                        // Is not a surcharge, is a value
                        hValues.AppendFormat("<li><label><span class='has-tooltip' title='{2}'>{0}</span>: $ <input type='text' name='{1}-value' value='{3}' /></label></li>",
                            EncodeForHtml(provar.Value.Def.VariableLabel),
                            EncodeForHtml(provar.Value.Def.InternalName), //==Key
                            EncodeForHtml(provar.Value.Def.VariableLabelPopUp),
                            Request[provar.Key + "-value"] ?? provar.Value.Value);
                    }
                    if (!String.IsNullOrEmpty(provar.Value.Def.NumberIncludedLabel))
                    {
                        hIncludes.AppendFormat("<li><label>{0} <input type='text' name='{1}-numberincluded' value='{3}' /> <span class='has-tooltip' title='{2}'>{4}/{5}</span></label></li>",
                            EncodeForHtml(provar.Value.Def.NumberIncludedLabel),
                            EncodeForHtml(provar.Value.Def.InternalName), //==Key
                            EncodeForHtml(provar.Value.Def.NumberIncludedLabelPopUp),
                            (object)(Request[provar.Key + "-numberincluded"]) ?? provar.Value.ProviderNumberIncluded,
                            EncodeForHtml(provar.Value.Def.VariableNameSingular),
                            EncodeForHtml(provar.Value.Def.VariableNamePlural));
                    }
                    // Get min-max values list if available
                    var minMaxValuesList = String.IsNullOrWhiteSpace(provar.Value.Def.MinMaxValuesList)
                        ? null
                        : provar.Value.Def.GenerateMinMaxValuesCollection();
                    if (!String.IsNullOrEmpty(provar.Value.Def.MinNumberAllowedLabel))
                    {
                        string formControlHtml = "",
                            name = provar.Key + "-minnumberallowed"; //==Value.Def.InternalName
                        var selectedValue = (object)(Request[provar.Key + "-minnumberallowed"]) ?? provar.Value.ProviderMinNumberAllowed;

                        if (minMaxValuesList != null)
                        {
                            formControlHtml = LcUtils.BuildHtmlSelect(
                                name,
                                selectedValue,
                                minMaxValuesList);
                        }
                        else
                            formControlHtml = LcUtils.BuildHtmlInput(
                                name,
                                selectedValue);

                        hRestrictions.AppendFormat("<li><label><span class='has-tooltip' title='{2}'>{0}</span> {1}</label></li>",
                            EncodeForHtml(provar.Value.Def.MinNumberAllowedLabel),
                            formControlHtml,
                            EncodeForHtml(provar.Value.Def.MinNumberAllowedLabelPopUp));
                    }
                    if (!String.IsNullOrEmpty(provar.Value.Def.MaxNumberAllowedLabel))
                    {
                        string formControlHtml = "",
                            name = provar.Key + "-maxnumberallowed"; //==Value.Def.InternalName
                        var selectedValue = (object)(Request[provar.Key + "-maxnumberallowed"]) ?? provar.Value.ProviderMaxNumberAllowed;
                        if (minMaxValuesList != null)
                            formControlHtml = LcUtils.BuildHtmlSelect(
                                name,
                                selectedValue,
                                minMaxValuesList);
                        else
                            formControlHtml = LcUtils.BuildHtmlInput(
                                name,
                                selectedValue);

                        hRestrictions.AppendFormat("<li><label><span class='has-tooltip' title='{2}'>{0}</span> {1}</label></li>",
                            EncodeForHtml(provar.Value.Def.MaxNumberAllowedLabel),
                            formControlHtml,
                            EncodeForHtml(provar.Value.Def.MaxNumberAllowedLabelPopUp));
                    }
                }
            }

            // Creating HTML
            var s = new StringBuilder();
            s.Append("<div class='hourly-pricing'>");
            if (hValues.Length > 0)
            {
                s.Append("<ul class='var-values'>");
                s.Append(hValues);
                s.Append("</ul>");
            }
            if (hIncludes.Length > 0)
            {
                s.Append("<h5>Includes:</h5>");
                s.Append("<ul class='var-includes'>");
                s.Append(hIncludes);
                s.Append("</ul>");
            }
            if (hSurcharges.Length > 0)
            {
                s.Append("<h5>Hourly surcharge(s):</h5>");
                s.Append("<ul class='var-surcharges'>");
                s.Append(hSurcharges);
                s.Append("</ul>");
            }
            if (hRestrictions.Length > 0)
            {
                s.Append("<h5>Booking restrictions:</h5>");
                s.Append("<ul class='var-restrictions'>");
                s.Append(hRestrictions);
                s.Append("</ul>");
            }
            s.Append("</div>");

            return s.ToString();
        }
        public bool ValidateProviderData(PackageBaseData package, System.Web.WebPages.Html.ModelStateDictionary modelState)
        {
            var valid = true;
            PricingVariables provars = PricingVariables.FromPackageBaseData(package);
            foreach (var provar in provars)
            {
                if (provar.Value.Def.IsProviderVariable)
                {
                    // Validation: Emit error if there is not a value or is not of the desired type
                    if (String.IsNullOrWhiteSpace(Request[provar.Key + "-value"]))
                    {
                        modelState.AddError(provar.Key + "-value", LcRessources.RequiredField(provar.Value.Def.VariableLabel));
                        valid = false;
                    }
                    else if (!LcUtils.ValidateType(Request[provar.Key + "-value"], provar.Value.Def.DataType))
                    {
                        modelState.AddError(provar.Key + "-value", LcRessources.InvalidFieldValue(provar.Value.Def.VariableLabel));
                        valid = false;
                    }
                    // NO Validation: Detect pricing variable 'hourly rate' to copy the value to the standard field on package
                    // PricingVariableID:1 'hourly rate' for all positions and pricings.
                    // We need to do this data change on validation because the 'save' part happen after the package being saved (for good reasons)
                    if (provar.Value.PricingVariableID == 1)
                    {
                        package.PriceRate = Request[provar.Key + "-value"].AsDecimal();
                        package.PriceRateUnit = "hour";
                    }
                    // Validation: Check the optional variable value properties (number, min, max)
                    if (!String.IsNullOrWhiteSpace(Request[provar.Key + "-numberincluded"]) &&
                        !Request[provar.Key + "-numberincluded"].IsDecimal())
                    {
                        modelState.AddError(provar.Key + "-numberincluded", String.Format("Invalid number for included '{0}'", provar.Value.Def.VariableNameSingular));
                        valid = false;
                    }
                    if (!String.IsNullOrWhiteSpace(Request[provar.Key + "-minnumberallowed"]) &&
                        !Request[provar.Key + "-minnumberallowed"].IsDecimal())
                    {
                        modelState.AddError(provar.Key + "-minnumberallowed", String.Format("Invalid number for '{0}'", provar.Value.Def.MinNumberAllowedLabel));
                        valid = false;
                    }
                    if (!String.IsNullOrWhiteSpace(Request[provar.Key + "-maxnumberallowed"]) &&
                        !Request[provar.Key + "-maxnumberallowed"].IsDecimal())
                    {
                        modelState.AddError(provar.Key + "-maxnumberallowed", String.Format("Invalid number for '{0}'", provar.Value.Def.MaxNumberAllowedLabel));
                        valid = false;
                    }
                }
            }
            return valid;
        }
        public void SaveProviderData(PackageBaseData package, Database db)
        {
            PricingVariables provars = PricingVariables.FromPackageBaseData(package);
            // Get values from for per variable
            foreach (var provar in provars)
            {
                if (provar.Value.Def.IsProviderVariable)
                {
                    // Value
                    provar.Value.Value = LcUtils.GetTypedValue(Request[provar.Key + "-value"], null, provar.Value.Def.DataType);
                    // Number Included
                    provar.Value.ProviderNumberIncluded = LcUtils.GetTypedValue<decimal>(Request[provar.Key + "-numberincluded"], 0);
                    // Min/Max allowed
                    provar.Value.ProviderMinNumberAllowed = LcUtils.GetTypedValue<decimal>(Request[provar.Key + "-minnumberallowed"], 0);
                    provar.Value.ProviderMaxNumberAllowed = LcUtils.GetTypedValue<decimal>(Request[provar.Key + "-maxnumberallowed"], 0);
                }
            }
            provars.Save();
        }
        #endregion
        #region Pricing Summary
        /// <summary>
        /// It shows the customer variables values
        /// </summary>
        /// <param name="package"></param>
        /// <returns></returns>
        public string GetPackagePricingDetails(int packageID, int pricingEstimateID, int pricingEstimateRevision)
        {
            var pv = PricingVariables.FromPricingEstimatePackage(packageID, pricingEstimateID, pricingEstimateRevision);
            var res = new List<string>();
            var summaryFormat = "{0}: {1}";
            foreach (var v in pv)
            {
                // On pricing summary only customer values are showed,
                // and the special var 'Hours' is avoided since the package already shows its 'total duration'
                // as part of the generic information
                if (v.Value.Def.IsProviderVariable ||
                    v.Key == "Hours")
                    continue;

                // If value is a number
                var val = v.Value.GetValue<double?>(null);
                if (val.HasValue)
                {
                    // Show singular or plural depending on the value
                    if (val.Value == 1)
                    {
                        res.Add(String.Format(summaryFormat, v.Value.Def.VariableNameSingular, 1));
                    }
                    else
                    {
                        res.Add(String.Format(summaryFormat, v.Value.Def.VariableNamePlural, val.Value));
                    }
                }
                else
                {
                    // Is another kind of value (string, datetime, ...) use singular variable name
                    res.Add(String.Format(summaryFormat, v.Value.Def.VariableNameSingular, v.Value.Value));
                }
            }
            return ASP.LcHelpers.JoinNotEmptyStrings(", ", res);
        }
        #endregion
        #region Package View
        public string GetPackageViewHtml(PackageBaseData package, Dictionary<string, LcPricingModel.FeeRate> feesSet)
        {
            // NOTE: It follows the same base code than GetProviderHtml but replacing form elements by div/span and appling fees when customer

            // Get variables
            PricingVariables provars = PricingVariables.FromPackageBaseData(package);

            // Create html for form elements, variables values organized per sections
            var hValues = new StringBuilder();
            var hSurcharges = new StringBuilder();
            var hIncludes = new StringBuilder();
            var hRestrictions = new StringBuilder();
            // Iterating provider variables:
            foreach (var provar in provars)
            {
                // A listing view of *the package* only shows provider variables for any user, since there is no customer values!
                if (provar.Value.Def.IsProviderVariable)
                {
                    // Showing the variable value.
                    // Avoid the 'hourly-rate' variable value, thats is showed already in a special way 
                    // by the standard package code (using the copy at pak.PriceRate)
                    if (provar.Key != "HourlyRate")
                    {
                        // Provider variables *value*s are ever a price: if we have a feesSet, then
                        // we must apply fees because the view require show prices with fees (mostly when is
                        // the user who see the package, as in booking and public profile).
                        // To variables, we apply ever the standard fees, there is no chance for the flat ones.
                        // We follow the convention for hourly prices (since this are too per hour): 1 decimal position
                        var valuePrice = feesSet == null
                            // Without fees, we apply a fee-rate of 0, and rounding to 1 decimal
                            ? new Price(provar.Value.GetValue<decimal>(0), 0, 1)
                            // With fees, we apply that, rounding ever to 1 decimal
                            : new Price(provar.Value.GetValue<decimal>(0), feesSet["standard:customer"], 1);

                        if (!String.IsNullOrEmpty(provar.Value.Def.HourlySurchargeLabel))
                        {
                            hSurcharges.AppendFormat("<li>{1:c} {0}</li>",
                                EncodeForHtml(provar.Value.Def.HourlySurchargeLabel),
                                valuePrice.TotalPrice);
                        }
                        else
                        {
                            // Is not a surcharge, is a value
                            hValues.AppendFormat("<li>{0}: {1:c}</li>",
                                EncodeForHtml(provar.Value.Def.VariableLabel),
                                valuePrice.TotalPrice);
                        }
                    }
                    // Number Included
                    if (!String.IsNullOrEmpty(provar.Value.Def.NumberIncludedLabel) &&
                        provar.Value.ProviderNumberIncluded.HasValue &&
                        provar.Value.ProviderNumberIncluded.Value > 0)
                    {
                        hIncludes.AppendFormat("<li>{0} {1:#,##0.##} {2}</li>",
                            EncodeForHtml(provar.Value.Def.NumberIncludedLabel),
                            provar.Value.ProviderNumberIncluded.Value,
                            provar.Value.ProviderNumberIncluded.Value != 1
                            ? EncodeForHtml(provar.Value.Def.VariableNamePlural)
                            : EncodeForHtml(provar.Value.Def.VariableNameSingular));
                    }
                    // Minimum number
                    if (!String.IsNullOrEmpty(provar.Value.Def.MinNumberAllowedLabel) &&
                        provar.Value.ProviderMinNumberAllowed.HasValue)
                    {
                        hRestrictions.AppendFormat("<li>{0} {1:#,##0.##} {2}</li>",
                            EncodeForHtml(provar.Value.Def.MinNumberAllowedLabel),
                            provar.Value.ProviderMinNumberAllowed,
                            provar.Value.ProviderMinNumberAllowed.Value != 1
                            ? EncodeForHtml(provar.Value.Def.VariableNamePlural)
                            : EncodeForHtml(provar.Value.Def.VariableNameSingular));
                    }
                    // Maximum number
                    if (!String.IsNullOrEmpty(provar.Value.Def.MaxNumberAllowedLabel) &&
                        provar.Value.ProviderMaxNumberAllowed.HasValue)
                    {
                        hRestrictions.AppendFormat("<li>{0} {1:#,##0.##} {2}</li>",
                            EncodeForHtml(provar.Value.Def.MaxNumberAllowedLabel),
                            provar.Value.ProviderMaxNumberAllowed,
                            provar.Value.ProviderMaxNumberAllowed.Value != 1
                            ? EncodeForHtml(provar.Value.Def.VariableNamePlural)
                            : EncodeForHtml(provar.Value.Def.VariableNameSingular));
                    }
                }
            }

            // Creating HTML
            var s = new StringBuilder();
            s.Append("<div class='hourly-pricing'>");
            if (hValues.Length > 0)
            {
                s.Append("<ul class='var-values'>");
                s.Append(hValues);
                s.Append("</ul>");
            }
            if (hIncludes.Length > 0)
            {
                s.Append("<h5>Includes:</h5>");
                s.Append("<ul class='var-includes'>");
                s.Append(hIncludes);
                s.Append("</ul>");
            }
            if (hSurcharges.Length > 0)
            {
                s.Append("<h5>Hourly surcharge(s):</h5>");
                s.Append("<ul class='var-surcharges'>");
                s.Append(hSurcharges);
                s.Append("</ul>");
            }
            if (hRestrictions.Length > 0)
            {
                s.Append("<h5>Booking restrictions:</h5>");
                s.Append("<ul class='var-restrictions'>");
                s.Append(hRestrictions);
                s.Append("</ul>");
            }
            s.Append("</div>");

            return s.ToString();
        }
        #endregion
    }
}