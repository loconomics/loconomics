using Braintree;
using System;

public partial class LcPayment
{
    /// <summary>
    /// Utility class to hold common useful information for 
    /// a payment method, independent of the underlying type
    /// (credit card, paypal, ...)
    /// </summary>
    public class PaymentMethodInfo
    {
        #region Fields
        public DateTimeOffset? ExpirationDate;
        /// <summary>
        /// A short description to identify the payment method,
        /// as type of credit card and last numbers.
        /// </summary>
        public string Description;
        #endregion

        public static PaymentMethodInfo Get(string paymentMethodToken)
        {
            // Give fake info
            if (IsFakePaymentMethod(paymentMethodToken))
            {
                return new PaymentMethodInfo
                {
                    ExpirationDate = null,
                    Description = "FakeCard ending in 6789"
                };
            }

            var gateway = NewBraintreeGateway();

            if (String.IsNullOrWhiteSpace(paymentMethodToken)) return null;
            try
            {
                var saved = gateway.PaymentMethod.Find(paymentMethodToken);
                var info = new PaymentMethodInfo();
                if (saved is CreditCard)
                {
                    var card = saved as CreditCard;
                    info.ExpirationDate = DateTimeOffset.Parse(card.ExpirationDate);
                    info.Description = string.Format("{0} ends in {1}", card.CardType.ToString(), card.LastFour);
                }
                else if (saved is ApplePayCard)
                {
                    var apple = saved as ApplePayCard;
                    info.ExpirationDate = DateTimeOffset.Parse(apple.ExpirationYear + "/" + apple.ExpirationMonth + "/01");
                    info.Description = string.Format("{0} ends in {1}", apple.CardType, apple.Last4);
                }
                else if (saved is PayPalAccount)
                {
                    var paypal = saved as PayPalAccount;
                    info.ExpirationDate = null;
                    info.Description = string.Format("Paypal account for {0}", paypal.Email);
                }
                else if (saved is AndroidPayCard)
                {
                    var android = saved as AndroidPayCard;
                    info.ExpirationDate = DateTimeOffset.Parse(android.ExpirationYear + "/" + android.ExpirationMonth + "/01");
                    info.Description = string.Format("{0} ends in {1}", android.CardType, android.Last4);
                }
                else
                {
                    info.Description = saved.ToString();
                }

                return info;
            }
            catch (Braintree.Exceptions.NotFoundException)
            {
                return null;
            }
        }
    }
}