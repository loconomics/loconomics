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
        public void CalculateCustomerData(PackageBaseData package, FeeRate fee, PricingModelData modelData, System.Web.WebPages.Html.ModelStateDictionary ModelState)
        {
            /* IMPORTANT: we set here the service duration for one session based on the customer value (from the form),
             * update the hourly-price from provider variable value
             * and the hourly-surcharge based on the variables.
             * Final price and fees are calculated in the standard code using the package Duration field and HourlySurcharge field, because of that
             * the final price is not calculated here. */

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
        public string GetCustomerHtml(PackageBaseData package, FeeRate fee)
        {
            // Get variables
            PricingVariables provars = PricingVariables.FromPackageBaseData(package);

            var sv = new StringBuilder();

            // Saving globally the hourly rate
            

            // Iterating customer variables:
            foreach (var provar in provars)
            {
                if (provar.Value.Def.IsCustomerVariable)
                {
                    var calculateWithVar = provars.GetCalculateWithVariableFor(provar.Value);
                    string sliderFootnote = String.Format(provar.Value.PricingVariableID == 1 ? "{0:C}" : "Adds {0:C} per each"
                        ,calculateWithVar.GetValue<decimal>(0));

                    sv.AppendFormat(@"
                        <div class='customer-slider' data-prov-value='{2}'
                            data-slider-value='{5}' data-slider-step='{6}' data-slider-footnote='{7}' data-slider-stype='hourly'
                            data-slider-min='{8}' data-slider-max='{9}' data-slider-number-included='{10}'>
                        <label><span class='has-tooltip' title='{4}'>{3}</span>: <input name='{1}[{0}]' type='text' /></label></div>"
                        ,package.ID
                        ,EncodeForHtml(provar.Key)
                        ,calculateWithVar.GetValue<decimal>(0)
                        ,EncodeForHtml(provar.Value.Def.VariableLabel)
                        ,EncodeForHtml(provar.Value.Def.VariableLabelPopUp)
                        ,provar.Value.Value
                        ,1 // slider step fixed to 1
                        ,EncodeForHtml(sliderFootnote)
                        ,calculateWithVar.ProviderMinNumberAllowed
                        ,calculateWithVar.ProviderMaxNumberAllowed
                        ,calculateWithVar.ProviderNumberIncluded);
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
                            EncodeForHtml(provar.Value.Def.HourlySurchargeLabelPopUp),
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
                    if (!String.IsNullOrEmpty(provar.Value.Def.MinNumberAllowedLabel))
                    {
                        hRestrictions.AppendFormat("<li><label><span class='has-tooltip' title='{2}'>{0}</span> <input type='text' name='{1}-minnumberallowed' value='{3}' /></label></li>",
                            EncodeForHtml(provar.Value.Def.MinNumberAllowedLabel),
                            EncodeForHtml(provar.Value.Def.InternalName), //==Key
                            EncodeForHtml(provar.Value.Def.MinNumberAllowedLabelPopUp),
                            (object)(Request[provar.Key + "-minnumberallowed"]) ?? provar.Value.ProviderMinNumberAllowed);
                    }
                    if (!String.IsNullOrEmpty(provar.Value.Def.MaxNumberAllowedLabel))
                    {
                        hRestrictions.AppendFormat("<li><label><span class='has-tooltip' title='{2}'>{0}</span> <input type='text' name='{1}-maxnumberallowed' value='{3}' /></label></li>",
                            EncodeForHtml(provar.Value.Def.MaxNumberAllowedLabel),
                            EncodeForHtml(provar.Value.Def.InternalName), //==Key
                            EncodeForHtml(provar.Value.Def.MaxNumberAllowedLabelPopUp),
                            (object)(Request[provar.Key + "-maxnumberallowed"]) ?? provar.Value.ProviderMaxNumberAllowed);
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
                    // Emit error if there is not a value or is not of the desired type
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
                    // Check the optional variable value properties (number, min, max)
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

                    // Detect pricing variable 'hourly rate' to copy the value to the standard field on package
                    // PricingVariableID:1 'hourly rate' for all positions and pricings.
                    if (provar.Value.PricingVariableID == 1)
                    {
                        package.PriceRate = provar.Value.Value;
                        package.PriceRateUnit = "hour";
                    }
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
    }
}