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
            /* IMPORTANT: we calculate here the service duration for one session based on some custom variables for housekeeper pricing,
             * final price and fees are calculated in the standard code using the package Duration field, because of that
             * we only update package.Duration here for later complete price calculation */

            // Get customer input
            /*var nbeds = Request[String.Format("bedrooms-number[{0}]", package.ID)].AsInt();
            var nbaths = Request[String.Format("bathrooms-number[{0}]", package.ID)].AsInt();
            // get provider rate
            var providerRate = GetProviderCleaningRate(package);
            // Apply formula, changed by the providerRate (variation from the average)
            var duration = ApplyFormula(nbeds, nbaths) * providerRate;
            // Create time object from duration, rounded to quarter-hours (15 minutes blocks)
            var timeDuration = ASP.LcHelpers.RoundTimeToQuarterHour(TimeSpan.FromMinutes(duration), ASP.LcHelpers.RoundingType.Up);
            // Create variables object with the specific data used in this calculation (will be saved later by the normal packages process)
            // Provider values get included in the object, something that is wanted for historic purposes on database.
            var vars = new PackageVariables(package.ProviderUserID, package.ID);
            vars["BathsNumber"] = nbaths;
            vars["BedsNumber"] = nbeds;
            // Change package with the information:
            package.Duration = timeDuration;
            modelData.ProviderInput = providerRate;
            modelData.CustomerInput = vars;*/
        }
        public string GetCustomerHtml(PackageBaseData package, FeeRate fee)
        {
            // Get variables
            PricingVariables provars = PricingVariables.FromPackageBaseData(package);

            var sv = new StringBuilder();

            // Iterating customer variables:
            foreach (var provar in provars)
            {
                if (provar.Value.Def.IsCustomerVariable)
                {
                    var calculateWithVar = provars.GetCalculateWithVariableFor(provar.Value);
                    var provPrice = new Price(calculateWithVar.GetValue<decimal>(0), fee, 1);
                    var unitPrice = provPrice.TotalPrice;
                    var unitFee = provPrice.FeePrice;
                    string sliderFootnote = String.Format(provar.Value.PricingVariableID == 1 ? "{0:C}" : "Adds {0:C} per each"
                        ,calculateWithVar.GetValue<decimal>(0));

                    sv.AppendFormat(@"
                        <div class='customer-slider' data-unit-price='{2}' data-unit-fee='{3}'
                            data-slider-value='{6}' data-slider-step='{7}' data-slider-footnote='{8}' data-slider-stype='hourly'
                            data-slider-min='{9}' data-slider-max='{10}' data-slider-number-included='{11}'>
                        <label><span class='has-tooltip' title='{5}'>{4}</span>: <input name='{1}[{0}]' type='text' /></label></div>"
                        ,package.ID
                        ,EncodeForHtml(provar.Key)
                        ,unitPrice
                        ,unitFee
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
            h.AppendFormat("<div class='hourly-pricing'>");
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