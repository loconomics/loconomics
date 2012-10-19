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

        var gateway = NewBraintreeGateway();

        // Check if the transaction has something to refund (was not refunded yet)
        Transaction transaction = gateway.Transaction.Find(transactionID);
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

        return (r == null || r.IsSuccess() ? null : r.Message);
    }
}