using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.WebPages;

namespace LcRest
{
    /// <summary>
    /// Manages the Braintree Merchant Account that enable Payments for Service Professionals.
    /// </summary>
    public class PaymentAccount
    {
        #region Fields
        public int userID;
        public string firstName;
        public string lastName;
        public string phone;
        public string streetAddress;
        // Braintree is not storing the ExtendedAddress right now (confirmed by their support
        // on 2014-03-12, logged at issues #454), so keeps commented and unused.
        //public string extendedAddress;
        public string city;
        public string postalCode;
        public string routingNumber;
        public string accountNumber;
        public string ssn;
        public string stateProvinceCode;
        public DateTime? birthDate;
        public bool? isVenmo;
        /// <summary>
        /// Status as notified by Braintree
        /// </summary>
        public string status;
        public IEnumerable<string> errors;
        #endregion

        #region Fetch
        public static PaymentAccount Get(int userID)
        {
            var btAccount = LcPayment.GetProviderPaymentAccount(userID);
            if (btAccount != null)
            {
                var acc = new PaymentAccount
                {
                    userID = userID,
                    firstName = btAccount.IndividualDetails.FirstName,
                    lastName = btAccount.IndividualDetails.LastName,
                    phone = btAccount.IndividualDetails.Phone,
                    streetAddress = btAccount.IndividualDetails.Address.StreetAddress,
                    //extendedAddress = btAccount.IndividualDetails.Address.ExtendedAddress,
                    city = btAccount.IndividualDetails.Address.Locality,
                    postalCode = btAccount.IndividualDetails.Address.PostalCode,
                    stateProvinceCode = btAccount.IndividualDetails.Address.Region,
                    birthDate = btAccount.IndividualDetails.DateOfBirth.IsDateTime() ?
                        (DateTime?)btAccount.IndividualDetails.DateOfBirth.AsDateTime() :
                        null,
                    ssn = String.IsNullOrEmpty(btAccount.IndividualDetails.SsnLastFour) ? "" : btAccount.IndividualDetails.SsnLastFour.PadLeft(10, '*'),
                    status = btAccount.Status.ToString().ToLower()
                };
                // IMPORTANT: We need to strictly check for the null value of IndividualDetails and FundingDetails
                // since errors can arise, see #554
                if (btAccount.FundingDetails != null)
                {
                    acc.routingNumber = btAccount.FundingDetails.RoutingNumber;
                    acc.accountNumber = String.IsNullOrEmpty(btAccount.FundingDetails.AccountNumberLast4) ? "" : btAccount.FundingDetails.AccountNumberLast4.PadLeft(10, '*');
                    // Is Venmo account if there is no bank informatino
                    acc.isVenmo = String.IsNullOrEmpty(acc.accountNumber) && String.IsNullOrEmpty(acc.routingNumber);
                }
                if (btAccount.Status == Braintree.MerchantAccountStatus.SUSPENDED)
                {
                    var dbAccount = LcData.GetProviderPaymentAccount(userID);
                    var gw = LcPayment.NewBraintreeGateway();
                    var notification = gw.WebhookNotification.Parse((string)dbAccount.bt_signature, (string)dbAccount.bt_payload);
                    var errors = new List<string>();
                    errors.Add(notification.Message);
                    notification.Errors.All().Select(x => x.Code + ": " + x.Message);
                    acc.errors = errors;
                }
                return acc;
            }
            else {
                return new PaymentAccount {
                    userID = userID
                };
            }
        }
        #endregion

        #region Update
        public static void Set(PaymentAccount data)
        {
            // Gathering state and postal IDs and verifying they match
            var stateId = LcData.GetStateFromZipCode(data.postalCode);
            var add = new LcRest.Address {
                postalCode = data.postalCode,
                countryID = LcRest.Locale.Current.countryID
            };
            if (!LcRest.Address.AutosetByCountryPostalCode(add))
            {
                throw new ValidationException("Postal Code is not valid.", "postalcode");
            }
            else
            {
                data.city = add.city;
                data.stateProvinceCode = add.stateProvinceCode;
            }

            var emulateBraintree = ASP.LcHelpers.Channel == "localdev";
            if (emulateBraintree)
            {
                LcData.SetProviderPaymentAccount(
                    data.userID,
                    "FAIK REQUEST ID: " + Guid.NewGuid(),
                    "pending",
                    null,
                    null,
                    null
                );
            }
            else
            {
                var email = LcRest.UserProfile.GetEmail(data.userID);
                var result = LcPayment.CreateProviderPaymentAccount(
                    new LcData.UserInfo
                    {
                        UserID = data.userID,
                        FirstName = data.firstName,
                        LastName = data.lastName,
                        Email = email,
                        MobilePhone = data.phone
                    }, new LcData.Address
                    {
                        AddressLine1 = data.streetAddress,
                        PostalCode = data.postalCode,
                        City = data.city,
                        StateProvinceCode = data.stateProvinceCode
                    }, new LcPayment.BankInfo
                    {
                        RoutingNumber = data.routingNumber,
                        AccountNumber = data.accountNumber
                    },
                    data.birthDate.Value,
                    data.ssn
                );
                
                if (result == null)
                {
                    throw new ValidationException("It looks like you already have an account set up with Braintree. Please contact us, and we can help.");
                }
                else if (!result.IsSuccess())
                {
                    throw new ValidationException(result.Message);
                    //foreach (var err in result.Errors.All()) { }
                }
            }
        }
        #endregion
    }
}