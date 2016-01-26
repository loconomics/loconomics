using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Configuration;
using Braintree;
using System.Web.WebPages;

/// <summary>
/// Descripción breve de LcPayment
/// </summary>
public static partial class LcPayment
{
    #region Gateway and config
    public static BraintreeGateway NewBraintreeGateway(BraintreeGateway gateway)
    {
        return gateway == null ? NewBraintreeGateway() : gateway;
    }
    public static BraintreeGateway NewBraintreeGateway()
    {
        BraintreeGateway gateway;
        if (ConfigurationManager.AppSettings["Braintree.InSandbox"].AsBool()) {
            //SandBox API keys for testing
            gateway = new BraintreeGateway 
            {
                Environment = Braintree.Environment.SANDBOX,
                MerchantId = ConfigurationManager.AppSettings["Braintree.Sandbox.MerchantId"], 
                PublicKey = ConfigurationManager.AppSettings["Braintree.Sandbox.PublicKey"],
                PrivateKey = ConfigurationManager.AppSettings["Braintree.Sandbox.PrivateKey"]
            };
        } else {
            gateway = new BraintreeGateway
            {
                Environment = Braintree.Environment.PRODUCTION,
                MerchantId = ConfigurationManager.AppSettings["Braintree.Production.MerchantId"],
                PublicKey = ConfigurationManager.AppSettings["Braintree.Production.PublicKey"],
                PrivateKey = ConfigurationManager.AppSettings["Braintree.Production.PrivateKey"]
            };
        }
        return gateway;
    }
    public static string BraintreeJsEnvironment
    {
        get
        {
            return ConfigurationManager.AppSettings["Braintree.InSandbox"].AsBool()
                ? "sandbox"
                : "production";
        }
    }
    public static string BraintreeMerchantId
    {
        get
        {
            return ConfigurationManager.AppSettings["Braintree.InSandbox"].AsBool()
                ? ConfigurationManager.AppSettings["Braintree.Sandbox.MerchantId"]
                : ConfigurationManager.AppSettings["Braintree.Production.MerchantId"];
        }
    }
    public static string BraintreeMerchantAccountId
    {
        get
        {
            return ConfigurationManager.AppSettings["Braintree.InSandbox"].AsBool()
                ? ConfigurationManager.AppSettings["Braintree.Sandbox.MerchantAccountId"]
                : ConfigurationManager.AppSettings["Braintree.Production.MerchantAccountId"];
        }
    }
    public static bool BraintreeFraudProtectionToolsEnabled
    {
        get
        {
            return ConfigurationManager.AppSettings["Braintree.FraudProtectionTools.Enabled"].AsBool();
        }
    }
    #endregion

    #region Actions: Create or prepare transactions and cards

    /// <summary>
    /// Performs a transaction to authorize the transaction on the client payment method, but
    /// not charging still, using the data from the given booking and the saved paymentMethodID.
    /// Booking is NOT checked before perform the task, use the LcRest.Booking API to securely run pre-condition
    /// checks before authorize transaction. The booking must have the data loaded for the pricingSummary.
    /// It returns the transactionID generated, original booking object is not updated.
    /// Errors in the process are throwed.
    /// </summary>
    /// <param name="booking"></param>
    /// <param name="paymentMethodID">AKA creditCardToken</param>
    public static string AuthorizeBookingTransaction(LcRest.Booking booking, string paymentMethodID)
    {
        if (booking.pricingSummary == null ||
            !booking.pricingSummary.totalPrice.HasValue ||
            booking.pricingSummary.totalPrice.Value <= 0)
        {
            throw new ConstraintException("To authorize a booking payment is required a price to charge.");
        }

        var gateway = NewBraintreeGateway();

        TransactionRequest request = new TransactionRequest
        {
            Amount = booking.pricingSummary.totalPrice.Value,
            CustomerId = GetCustomerId(booking.clientUserID),
            PaymentMethodToken = paymentMethodID,
            // Now, with Marketplace #408, the receiver of the money for each transaction is
            // the provider through account at Braintree, and not the Loconomics account:
            //MerchantAccountId = LcPayment.BraintreeMerchantAccountId,
            MerchantAccountId = GetProviderPaymentAccountId(booking.serviceProfessionalUserID),
            // Marketplace #408: since provider receive the money directly, Braintree must discount
            // the next amount in concept of fees and pay that to the Marketplace Owner (us, Loconomics ;-)
            ServiceFeeAmount = booking.pricingSummary.feePrice.Value,
            Options = new TransactionOptionsRequest
            {
                // Marketplace #408: don't pay provider still, wait for the final confirmation 'release scrow'
                HoldInEscrow = true,
                // Do not submit, just authorize:
                SubmitForSettlement = false
            }
        };

        var r = gateway.Transaction.Sale(request);

        // Everything goes fine
        if (r.IsSuccess())
        {
            // Save the transactionID
            if (r.Target != null
                && !String.IsNullOrEmpty(r.Target.Id))
            {
                // If the card is a TEMPorarly card (just to perform this transaction)
                // it must be removed now since was successful used
                // IMPORTANT: Since an error on this subtask is not important to the
                // user and will break a success process creating a new problem if throwed (because transactionID
                // gets lost),
                // is catched and managed internally by Loconomics stuff that can check and fix transparentely
                // this minor error.
                try
                {
                    if (paymentMethodID.StartsWith(TempSavedCardPrefix))
                        gateway.CreditCard.Delete(paymentMethodID);
                }
                catch (Exception ex)
                {
                    try
                    {
                        LcMessaging.NotifyError("LcPayment.AuthorizeBookingTransaction..DeleteBraintreeTempCard(" + paymentMethodID + ");bookingID=" + booking.bookingID, "", ex.Message);
                        LcLogger.LogAspnetError(ex);
                    }
                    catch { }
                }

                // r.Target.Id => transactionID
                return r.Target.Id;
            }
            else
            {
                // Transaction worked but impossible to know the transactionID (weird, is even possible?),
                // recommended to do not touch the DB (to still know the credit card token) and notify error
                throw new Exception("Impossible to know transaction details, please contact support. BookingID #" + booking.bookingID.ToString());
            }
        }
        else
        {
            throw new Exception(r.Message);
        }
    }

    /// <summary>
    /// Do a transaction ('sale') to be submitted and payed now for the cancellation fee
    /// of a booking. If as result of the booking internal rules the fee is zero, then
    /// no payment is needed (is like a 'full refund')...???
    /// The removal of a temporary card is performed on any case (with or without transaction because of total refund)
    /// </summary>
    /// <param name="creditCardToken"></param>
    /// <param name="refund"></param>
    /// <param name="customerID"></param>
    /// <param name="providerID"></param>
    /// <returns></returns>
    public static string DoTransactionToRefundFromCard(string creditCardToken, LcRest.PricingSummary pricing, int customerID, int providerID)
    {
        string result = null;

        try
        {
            var gateway = NewBraintreeGateway();

            if (pricing.cancellationFeeCharged.HasValue && pricing.cancellationFeeCharged > 0)
            {
                TransactionRequest request = new TransactionRequest
                {
                    Amount = pricing.cancellationFeeCharged.Value + (pricing.feePrice ?? 0),
                    CustomerId = GetCustomerId(customerID),
                    PaymentMethodToken = creditCardToken,
                    // Now, with Marketplace #408, the receiver of the money for each transaction is
                    // the provider through account at Braintree, and not the Loconomics account:
                    //MerchantAccountId = LcPayment.BraintreeMerchantAccountId,
                    MerchantAccountId = GetProviderPaymentAccountId(providerID),
                    // Marketplace #408: since provider receive the money directly, Braintree must discount
                    // the next amount in concept of fees and pay that to the Marketplace Owner (us, Loconomics)
                    ServiceFeeAmount = pricing.feePrice,
                    Options = new TransactionOptionsRequest
                    {
                        // Marketplace #408: we normally hold it, but we are refunding so don't hold, pay at the moment
                        HoldInEscrow = false,
                        // Submit now
                        SubmitForSettlement = true
                    }
                };

                var r = gateway.Transaction.Sale(request);

                result = r.IsSuccess() ? null : r.Message;
            }

            // Everything goes fine
            if (result == null)
            {
                // If the card is a TEMPorarly card (just to perform this transaction)
                // it must be removed now since was successful used
                if (creditCardToken.StartsWith(TempSavedCardPrefix))
                    gateway.CreditCard.Delete(creditCardToken);
            }
        }
        catch (Exception ex)
        {
            return ex.Message;
        }

        return result;
    }

    /// <summary>
    /// Prefix for the ID/Token of temporarly saved credit cards on Braintree Vault,
    /// for transactions that doesn't want to save it permanently.
    /// </summary>
    public const string TempSavedCardPrefix = "TEMPCARD_";

    public const string TransactionIdIsCardPrefix = "CARD:";

    [Obsolete("Use LcPayment.InputPaymentMethod class, and SaveInVault method")]
    public static string SaveCardInVault(string customerIdOnBraintree, ref string creditCardToken,
        string nameOnCard, string cardNumber,
        string cardExpMonth, string cardExpYear, string cardCvv,
        LcData.Address address)
    {
        BraintreeGateway gateway = LcPayment.NewBraintreeGateway();

        var isTemp = creditCardToken != null && creditCardToken.StartsWith(TempSavedCardPrefix);

        var creditCardRequest = new CreditCardRequest
        {
            CustomerId = customerIdOnBraintree,
            CardholderName = nameOnCard,
            Number = cardNumber,
            ExpirationDate = cardExpMonth + "/" + cardExpYear,
            CVV = cardCvv,
            BillingAddress = new CreditCardAddressRequest
            {
                StreetAddress = address.AddressLine1,
                ExtendedAddress = address.AddressLine2,
                Locality = address.City,
                Region = address.StateProvinceCode,
                PostalCode = address.PostalCode,
                CountryCodeAlpha2 = address.CountryCodeAlpha2
            }
        };

        Result<CreditCard> resultCreditCard = null;

        // Find or create/update the payment method (credit card) for the customer
        try{
            // There is no card token, just throw to go on creation (no need to contact Braintree)
            if (String.IsNullOrEmpty(creditCardToken))
                throw new Braintree.Exceptions.NotFoundException("No card token");

            // Find the card
            gateway.CreditCard.Find(creditCardToken);
                                    
            // Update it:
            resultCreditCard = gateway.CreditCard.Update(creditCardToken, creditCardRequest);

        } catch (Braintree.Exceptions.NotFoundException ex) {
            // Credit card for customer doesn't exist, create it:
            if (isTemp)
                // We set the Token on temp cards
                creditCardRequest.Token = creditCardToken;

            resultCreditCard = gateway.CreditCard.Create(creditCardRequest);
        }
                                
        if (resultCreditCard.IsSuccess()) {
            // New Token
            creditCardToken = resultCreditCard.Target.Token;
            ASP.LcHelpers.DebugLogger.Log("Created card {0}", creditCardToken);
        }
        else {
            return resultCreditCard.Message;
        }

        // No error
        return null;
    }
    #endregion

    #region Actions: Refund
    /// <summary>
    /// Full refund a transaction ensuring that will be no charge to the customer
    /// or will be refunded if there was.
    /// If the transaction is invalid, was not accepted or another state that says that
    /// no charge happens, 'null' will be returned, just the same as if the refund operation
    /// was success.
    /// If there is an error, the error message will be returned.
    /// </summary>
    /// <param name="transactionID"></param>
    /// <returns></returns>
    public static string RefundTransaction(string transactionID)
    {
        if (IsFakeTransaction(transactionID))
            return null;

        Result<Transaction> r = null;

        try
        {
            var gateway = NewBraintreeGateway();

            // Check if the transaction has something to refund (was not refunded yet)
            Transaction transaction = null;
            try
            {
                transaction = gateway.Transaction.Find(transactionID);
            }
            catch (Braintree.Exceptions.NotFoundException ex) { }
            if (transaction == null)
                // It doesn't exists, 'refunded' ;)
                return null;

            if (transaction.Amount > 0)
            {
                // There is something to refund:
                if (transaction.Status == TransactionStatus.SETTLED ||
                    transaction.Status == TransactionStatus.SETTLING)
                {
                    // Full refund transaction.
                    r = gateway.Transaction.Refund(transactionID);
                }
                else if (transaction.Status == TransactionStatus.AUTHORIZED ||
                    transaction.Status == TransactionStatus.AUTHORIZING ||
                    transaction.Status == TransactionStatus.SUBMITTED_FOR_SETTLEMENT)
                {
                    // Void transaction:
                    r = gateway.Transaction.Void(transactionID);
                }
                else
                {
                    // No transaction, no accepted, no charge, nothing to refund
                    return null;
                }
            }
        }
        catch (Exception ex)
        {
            return ex.Message;
        }
        return (r == null || r.IsSuccess() ? null : r.Message);
    }
    /// <summary>
    /// Partial refund a transaction ensuring that customer will be charged only for the
    /// difference or will be refunded for that amount.
    /// If transaction was not settled still (will happen most time), original transaction
    /// will be cloned by the different of amount (total less refunded), voiding original transaction.
    /// </summary>
    /// <param name="transactionID"></param>
    /// <param name="amount"></param>
    /// <returns></returns>
    public static string RefundTransaction(string transactionID, decimal amount)
    {
        if (IsFakeTransaction(transactionID))
            return null;

        Result<Transaction> r = null;

        try
        {
            var gateway = NewBraintreeGateway();

            // Check if the transaction has something to refund (was not full refunded yet)
            Transaction transaction = null;
            try
            {
                transaction = gateway.Transaction.Find(transactionID);
            }
            catch (Braintree.Exceptions.NotFoundException ex) { }

            if (transaction == null)
                return "Payment transaction doesn't exists, impossible to perform the refund.";

            if (transaction.Amount > 0)
            {
                // There is something to refund:
                if (transaction.Status == TransactionStatus.SETTLED ||
                    transaction.Status == TransactionStatus.SETTLING)
                {
                    // Partial refund transaction.
                    r = gateway.Transaction.Refund(transactionID, amount);

                    // Marketplace #408: just after refund to the customer its amount, pay the rest amount
                    // to the provider (and fees to us)
                    if (r.IsSuccess())
                        r = gateway.Transaction.ReleaseFromEscrow(transactionID);
                }
                else if (transaction.Status == TransactionStatus.AUTHORIZED ||
                    transaction.Status == TransactionStatus.AUTHORIZING ||
                    transaction.Status == TransactionStatus.SUBMITTED_FOR_SETTLEMENT)
                {
                    // Cannot be partial refunded if not settled, we
                    // clone the transaction to include (total - refunded) amount
                    // and void original transation

                    var request = new TransactionCloneRequest
                    {
                        // Total original amount less refunded amount
                        Amount = transaction.Amount.Value - amount,
                        Options = new TransactionOptionsCloneRequest
                        {
                            SubmitForSettlement = true
                        }
                    };
                    Result<Transaction> newResult = gateway.Transaction.
                      CloneTransaction(transactionID, request);

                    // Check that all was fine in this subtask
                    if (newResult.IsSuccess()
                        && newResult.Target != null
                        && !String.IsNullOrEmpty(newResult.Target.Id))
                    {
                        // A new transactionID is given, update it in database
                        var newTransactionID = newResult.Target.Id;
                        LcRest.Booking.UpdateBookingTransactionID(transactionID, newTransactionID);

                        // Void original transaction
                        r = gateway.Transaction.Void(transactionID);

                        // Check error on Void, because if failed it means that more money was charged
                        // to customer instead of refunded!
                        if (!r.IsSuccess())
                        {
                            // Try to void new transaction
                            gateway.Transaction.Void(newTransactionID);
                        }
                        else
                        {
                            // Marketplace #408: just after refund to the customer its amount, pay the rest amount
                            // to the provider (and fees to us)
                            r = gateway.Transaction.ReleaseFromEscrow(newTransactionID);
                        }
                    }
                    else
                    {
                        return newResult.Message;
                    }
                }
                else
                {
                    return "Impossible to refund payment: unknow transaction status.";
                }
            }
        }
        catch (Exception ex)
        {
            return ex.Message;
        }

        return (r == null || r.IsSuccess() ? null : r.Message);
    }
    #endregion

    #region Actions: Confirming payment
    /// <summary>
    /// Submit to settlement a transaction to be full charged its authorized
    /// amount.
    /// </summary>
    /// <param name="transactionID"></param>
    /// <returns></returns>
    public static string SettleTransaction(string transactionID)
    {
        if (IsFakeTransaction(transactionID))
            return null;

        Result<Transaction> r = null;

        try
        {
            var gateway = NewBraintreeGateway();

            r = gateway.Transaction.SubmitForSettlement(transactionID);
        }
        catch (Exception ex)
        {
            return ex.Message;
        }

        return (r == null || r.IsSuccess() ? null : r.Message);
    }
    /// <summary>
    /// On Marketplace, this sends a request to pay the amount 
    /// in the transaction to the Merchant Account (Provider)
    /// and the fees to the Marketplace Owner (us).
    /// A call for SettleTransaction there was need previous to this with enough
    /// time in advance.
    /// </summary>
    /// <param name="transactionID"></param>
    /// <returns></returns>
    public static string ReleaseTransactionFromEscrow(string transactionID)
    {
        if (IsFakeTransaction(transactionID))
            return null;

        Result<Transaction> r = null;

        try
        {
            var gateway = NewBraintreeGateway();

            r = gateway.Transaction.ReleaseFromEscrow(transactionID);
        }
        catch (Exception ex)
        {
            return ex.Message;
        }

        return (r == null || r.IsSuccess() ? null : r.Message);
    }
    #endregion

    #region Customer information
    /// <summary>
    /// Get the payment gateway ID for a customer based on our userID
    /// </summary>
    /// <param name="userID"></param>
    /// <returns></returns>
    public static string GetCustomerId(int userID)
    {
        return ASP.LcHelpers.Channel + "_" + userID.ToString();
    }

    /// <summary>
    /// Returns the customer information on Braintree for the given userID,
    /// or null if not exists.
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="gateway">Optional, to reuse an opened gateway, else a new one is transparently created</param>
    /// <returns></returns>
    public static Braintree.Customer GetBraintreeCustomer(int userID, BraintreeGateway gateway = null) {
        gateway = LcPayment.NewBraintreeGateway(gateway);
        try{
            return gateway.Customer.Find(GetCustomerId(userID));
        } catch (Braintree.Exceptions.NotFoundException ex) {
        }
        return null;
    }

    /// <summary>
    /// Find or create Customer on Braintree
    /// </summary>
    /// <param name="userID"></param>
    /// <returns></returns>
    public static Braintree.Customer GetOrCreateBraintreeCustomer(int userID)
    {
        var gateway = NewBraintreeGateway();
        
        string customerIdOnBraintree = GetCustomerId(userID);

        try
        {
            return gateway.Customer.Find(customerIdOnBraintree);
        }
        catch (Braintree.Exceptions.NotFoundException ex)
        {
            // Customer doens't exist, create it:
            var gcr = new CustomerRequest{
                Id = customerIdOnBraintree
            };

            var r = gateway.Customer.Create(gcr);
            if (r.IsSuccess())
            {
                return r.Target;
            }
            else
            {
                throw new Braintree.Exceptions.BraintreeException("Impossible to create customer #" + customerIdOnBraintree + ":: " + r.Message);
            }
        }
    }
    #endregion

    #region Customer Payment Methods (saved cards)
    public static List<CreditCard> GetSavedCreditCards(int userID)
    {
        var gateway = NewBraintreeGateway();
        try
        {
            var gc = gateway.Customer.Find(GetCustomerId((int)userID));
            var savedCards = gc.CreditCards;
            
            // Filter credit cards to avoid the temporary ones
            var filteredCards = new List<CreditCard>();
            foreach(var card in savedCards) {
                if (card.Token != null && !card.Token.StartsWith(TempSavedCardPrefix)) {
                    filteredCards.Add(card);
                }
            }
            
            return filteredCards;
            //savedCards = filteredCards.ToArray<CreditCard>();
        }
        catch (Braintree.Exceptions.NotFoundException ex) {}

        return null;
    }
    #endregion

    #region Marketplace

    public const string MarketplaceProviderFee = "2.9% plus $0.30";

    #region Provider information
    /// <summary>
    /// Get the AccountId (where to pay) on the payment gateway
    /// for a provider user.
    /// </summary>
    /// <param name="userID"></param>
    /// <returns></returns>
    public static string GetProviderPaymentAccountId(int userID)
    {
        return "Marketplace_" + GetCustomerId(userID);
    }
    #endregion

    #region Create Payment Account (Merchant Account)
    /// <summary>
    /// Create the payment account for the provider at the payment gateway (Braintree) given
    /// its Loconomics UserID.
    /// On Braintree Marketplace, this is called 'Create a Sub Merchant'
    /// </summary>
    /// <param name="providerID"></param>
    /// <param name="gateway"></param>
    /// <returns>It returns the result of the Braintree transaction (check for IsSuccess to know the result),
    /// or null when there Braintree doesn't authorize the operation (AuthorizationException catched) or there is
    /// not enough information for that userID, both cases it means the details are not complete or malformed.</returns>
    public static Result<MerchantAccount> CreateProviderPaymentAccount(int providerID, BraintreeGateway gateway = null)
    {
        gateway = NewBraintreeGateway(gateway);
        var provider = LcData.UserInfo.GetUserRowWithContactData(providerID);
        var address = LcData.GetFirstUserAddressOfType(providerID, LcData.Address.AddressType.Billing);
        var bank = LcData.UserInfo.GetUserBankInfo(providerID);
        if (provider != null && address != null)
        {
            return CreateProviderPaymentAccount(provider, address, bank.ABANumber, gateway);
        }
        return null;
    }

    /// <summary>
    /// Create the payment account for the provider at the payment gateway (Braintree) given
    /// that user information.
    /// On Braintree Marketplace, this is called 'Create a Sub Merchant'
    /// </summary>
    /// <param name="user"></param>
    /// <param name="address"></param>
    /// <param name="bank"></param>
    /// <param name="gateway"></param>
    /// <returns>It returns the result of the Braintree transaction (check for IsSuccess to know the result),
    /// or null when there Braintree doesn't authorize the operation (AuthorizationException catched),
    /// it means the details are not complete or malformed.</returns>
    public static Result<MerchantAccount> CreateProviderPaymentAccount(dynamic user, LcData.Address address, string ABANumber, BraintreeGateway gateway = null) {
        gateway = NewBraintreeGateway(gateway);
        
        var braintreeCustomer = GetBraintreeCustomer((int)user.UserID, gateway);
        string tin = null;
        string accountNumber = null;
        if (braintreeCustomer != null) {
            tin = braintreeCustomer.CustomFields.ContainsKey("loco_tin")
                ? braintreeCustomer.CustomFields["loco_tin"]
                : null;
            accountNumber = braintreeCustomer.CustomFields.ContainsKey("loco_bank_account")
                ? braintreeCustomer.CustomFields["loco_bank_account"]
                : null;
        }

        dynamic bank = new {
            RoutingNumber = ABANumber,
            AccountNumber = accountNumber
        };

        return CreateProviderPaymentAccount(user, address, bank, DateTime.Today.AddYears(-30), tin);
    }

    public static MerchantAccount GetProviderPaymentAccount(int userId, BraintreeGateway gateway = null)
    {
        gateway = NewBraintreeGateway(gateway);

        var accountID = LcPayment.GetProviderPaymentAccountId(userId);
        MerchantAccount btAccount = null;

        // Find any existant one:
        try
        {
            btAccount = gateway.MerchantAccount.Find(accountID);
        }
        catch (Braintree.Exceptions.NotFoundException ex) { }

        return btAccount;
    }

    /// <summary>
    /// Create or update the payment account for the provider at the payment gateway (Braintree) given
    /// that user information.
    /// On Braintree Marketplace, this is called 'Create a Sub Merchant'
    /// </summary>
    /// <param name="user"></param>
    /// <param name="address"></param>
    /// <param name="bank"></param>
    /// <param name="gateway"></param>
    /// <returns>It returns the result of the Braintree transaction (check for IsSuccess to know the result),
    /// or null when there Braintree doesn't authorize the operation (AuthorizationException catched),
    /// it means the details are not complete or malformed.</returns>
    public static dynamic CreateProviderPaymentAccount(dynamic user, LcData.Address address, dynamic bank, DateTime BirthDate, string Ssn, BraintreeGateway gateway = null) {
        gateway = NewBraintreeGateway(gateway);

        // We need to detect what FundingDestination notify depending on the provided
        // information
        // Analizing source bank information: asterisks means 'not to set -- preseve previous value', other value is send being
        // null or empty to clear/remove previous value
        // Next variables will have null for 'not to set' or any other to be udpated.
        string routingNumber = null;
        string accountNumber = null;
        FundingDestination fundingDest = FundingDestination.EMAIL;
        if (bank != null)
        {
            // Null and asterisks values are not set
            if (bank.RoutingNumber != null && !bank.RoutingNumber.Contains("*"))
                routingNumber = bank.RoutingNumber;

            if (bank.AccountNumber != null && !bank.AccountNumber.Contains("*"))
                accountNumber = bank.AccountNumber;
            
            // We check against the bank object because has the original values.
            // Here, we allow an asterisks value as valid, because is a previous one
            // that will be preserved, or any new value to be set just different
            // from empty or null
            if (!String.IsNullOrEmpty(bank.AccountNumber) && !String.IsNullOrEmpty(bank.RoutingNumber))
            {
                fundingDest = FundingDestination.BANK;
            }
            else if (!String.IsNullOrWhiteSpace(user.MobilePhone))
            {
                fundingDest = FundingDestination.MOBILE_PHONE;
            }
        }

        var updateBankInfo = bank != null;
       
        var btAccount = GetProviderPaymentAccount((int)user.UserID);

        MerchantAccountRequest request = new MerchantAccountRequest
        {
            Individual = new IndividualRequest
            {
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Phone = user.MobilePhone,
                Address = new AddressRequest
                {
                    StreetAddress = address.AddressLine1,
                    // NOTE: We set the ExtendedAddress, but was communicated by Braintree on 2014-03-12
                    // that field is not being stored (support messages copies at #454).
                    // On the interface, we rely on our db for the copied version of that address part as fallback.
                    ExtendedAddress = address.AddressLine2,
                    PostalCode = address.PostalCode,
                    Locality = address.City,
                    Region = address.StateProvinceCode,
                },
                DateOfBirth = BirthDate.ToString("yyyy-MM-dd")
            },
            TosAccepted = true,
            MasterMerchantAccountId = BraintreeMerchantAccountId,
            Id = LcPayment.GetProviderPaymentAccountId((int)user.UserID)
        };

        if (btAccount == null || String.IsNullOrWhiteSpace(Ssn) || !Ssn.Contains("*"))
        {
            // Braintree require pass an empty string to remove the value of SSN in case of
            // user remove it from the form field:
            request.Individual.Ssn = String.IsNullOrWhiteSpace(Ssn) ? "" : Ssn;
        }

        // Set payment/funding information only on creation or explicitely
        // asked for update of its data
        if (btAccount == null || updateBankInfo)
        {
            request.Funding = new FundingRequest{
                Destination = fundingDest,
                Email = user.Email,
                MobilePhone = user.MobilePhone
            };

            // On null, we don't set the values, empty to remove or value to set

            if (routingNumber != null)
                request.Funding.RoutingNumber = routingNumber;

            if (accountNumber != null)
                request.Funding.AccountNumber = accountNumber;
        }

        try{
            Result<MerchantAccount> ret = null;
            if (btAccount == null)
                ret = gateway.MerchantAccount.Create(request);
            else
                ret = gateway.MerchantAccount.Update(request.Id, request);

            // All Ok, register on database
            if (ret.IsSuccess())
                LcData.SetProviderPaymentAccount(
                    user.UserID,
                    request.Id,
                    btAccount == null ? "pending" : null,
                    null,
                    null,
                    null
                );

            return ret;

        } catch (Braintree.Exceptions.AuthorizationException ex) {
            return null;
        }
    }

    /// <summary>
    /// Saves on database the updated information for a payment account with the notified information that
    /// means an change on the payment gateway for that object.
    /// Braintree sends notifications through Webhooks to a configured URL, our page at that address
    /// manage it and call this when matched the Kind of notification related to the creation request
    /// for a Sub-merchant or Merchant account (aka provider payment account).
    /// </summary>
    /// <param name="notification"></param>
    public static void RegisterProviderPaymentAccountCreationNotification(WebhookNotification notification, string signature, string payload)
    {
        // If is not a SubMerchant creation, skip (maybe a new main merchant account was created)
        if (!notification.MerchantAccount.IsSubMerchant)
            return;

        var providerID = LcUtils.ExtractInt(notification.MerchantAccount.Id, 0);
        // Is not valid user
        if (providerID == 0)
        {
            using (var logger = new LcLogger("PaymentGatewayWebhook"))
            {
                logger.Log("SubMerchantAccount:: Impossible to get the provider UserID from next MerchantAccountID: {0}", notification.MerchantAccount.Id);
                logger.Log("SubMerchantAccount:: Follows signature and payload");
                logger.LogData(signature);
                logger.LogData(payload);
                logger.Save();
            }
            return;
        }

        LcData.SetProviderPaymentAccount(
            providerID,
            notification.MerchantAccount.Id,
            notification.MerchantAccount.Status.ToString(),
            notification.Message,
            signature,
            payload
        );
    }

    #region BankInfo Class
    public class BankInfo
    {
        public BankInfo() { }
        public string RoutingNumber;
        public string AccountNumber;
    }
    #endregion

    #endregion

    #endregion

    #region Fake, testing transactions that avoid Braintree
    public const string FakeTransactionPrefix = "TEST:";
    public static string CreateFakeTransactionId()
    {
        return FakeTransactionPrefix + Guid.NewGuid().ToString();
    }
    public static bool IsFakeTransaction(string transactionId)
    {
        return String.IsNullOrEmpty(transactionId) || transactionId.StartsWith(FakeTransactionPrefix);
    }
    #endregion
}