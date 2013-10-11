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
    public static bool BraintreeFraudProtectionToolsEnabled
    {
        get
        {
            return ConfigurationManager.AppSettings["Braintree.FraudProtectionTools.Enabled"].AsBool();
        }
    }
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
    /// Get the payment gatewaye ID for a customer based on our userID
    /// </summary>
    /// <param name="userID"></param>
    /// <returns></returns>
    public static string GetCustomerId(int userID)
    {
        return ASP.LcHelpers.Channel + "_" + userID.ToString();
    }
}