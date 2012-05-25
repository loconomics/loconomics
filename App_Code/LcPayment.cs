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
}