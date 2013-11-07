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
public static class LcPayment
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
                // It doesn't exists, 'refunded' ;)
                return null;

            if (transaction.Amount > 0)
            {
                // There is something to refund:
                if (transaction.Status == TransactionStatus.SETTLED ||
                    transaction.Status == TransactionStatus.SETTLING)
                {
                    // Partial refund transaction.
                    r = gateway.Transaction.Refund(transactionID, amount);
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
                        Amount = transaction.Amount.Value - amount
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
                        LcData.Booking.UpdateBookingTransactionID(transactionID, newTransactionID);

                        // Void original transaction
                        r = gateway.Transaction.Void(transactionID);

                        // Check error on Void, because if failed it means that more money was charged
                        // to customer instead of refunded!
                        if (!r.IsSuccess())
                        {
                            // Try to void new transaction
                            gateway.Transaction.Void(newTransactionID);
                        }
                    }
                    else
                    {
                        return newResult.Message;
                    }
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
    #endregion

    #region Marketplace

    public const decimal MarketplaceProviderFee = 2.9m;

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
            return CreateProviderPaymentAccount(provider, address, bank, gateway);
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
            Ssn = tin,
            AccountNumber = accountNumber
        };

        return CreateProviderPaymentAccount(user, address, bank, DateTime.Today.AddYears(-30));
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
    public static Result<MerchantAccount> CreateProviderPaymentAccount(dynamic user, LcData.Address address, dynamic bank, DateTime BirthDate, BraintreeGateway gateway = null) {
        gateway = NewBraintreeGateway(gateway);
        
        MerchantAccountRequest request = new MerchantAccountRequest
        {
            ApplicantDetails = new ApplicantDetailsRequest
            {
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Phone = user.MobilePhone,
                Address = new AddressRequest
                {
                    StreetAddress = address.AddressLine1,
                    PostalCode = address.PostalCode,
                    Locality = address.City,
                    Region = address.StateProvinceCode,
                },
                DateOfBirth = BirthDate.ToString("yyyy-MM-dd"),
                Ssn = bank.Ssn,
                RoutingNumber = bank.RoutingNumber,
                AccountNumber = bank.AccountNumber
          },
          TosAccepted = true,
          MasterMerchantAccountId = BraintreeMerchantAccountId,
          Id = LcPayment.GetProviderPaymentAccountId(user.UserID)
        };

        try{
            var ret = gateway.MerchantAccount.Create(request);

            // All Ok, register on database
            if (ret.IsSuccess())
                LcData.SetProviderPaymentAccount(
                    user.UserID,
                    request.Id,
                    "pending",
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
        public string Ssn;
        public string RoutingNumber;
        public string AccountNumber;
    }
    #endregion

    #endregion

    #endregion
}