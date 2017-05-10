using Braintree;
using System;
using LcEnum;

public partial class LcPayment
{
    public class Membership
    {
        #region Gateway
        private BraintreeGateway _gateway;

        private BraintreeGateway Gateway
        {
			get {
				if (_gateway == null) {
					_gateway = NewBraintreeGateway();
				}
                return _gateway;
			}
        }
        #endregion

        #region Class
        public Membership() { }
        #endregion

        #region IDs
        /// <summary>
        /// Get the payment gateway ID for a customer based in our userID
        /// with a specific format to use for 'fee payments'; this
        /// allow us to easy distinguish transactions of the user made
        /// to pay membership/ownership fees and payments to other professionals
        /// as a marketplace client (as of LcPayemnt.GetCustomerId)
        /// </summary>
        /// <param name="userID"></param>
        /// <returns></returns>
        public static string GetFeePaymentUserId(int userID)
        {
            return ASP.LcHelpers.Channel + "_fee_" + userID.ToString();
        }
        #endregion

        #region Subscription

        /// <summary>
        /// Returns the correct descriptor name for the given plan,
        /// following gateway naming restrictions.
        /// </summary>
        /// <param name="plan"></param>
        /// <returns></returns>
        public string GetSubscriptionPlanDescriptor(SubscriptionPlan plan)
        {
            // IMPORTANT: Braintree restricts the naming possibilities
            // as described at https://developers.braintreepayments.com/reference/request/transaction/sale/dotnet#descriptor.name
            // Copied: Company name/DBA section must be either 3, 7 or 12 characters
            // and the product descriptor can be up to 18, 14, or 9 characters respectively (with an * in between
            // for a total descriptor name of 22 characters)
            // NOTE: We choose 12 chars for 'Loconomics  ' (double white space in the end
            // to match twelve) plus short plan name ('ProAnnual' fits exactly, 9)
            switch (plan)
            {
                case SubscriptionPlan.Free:
                    throw new ArgumentException("A free plan don't need a paid subscription");
                case SubscriptionPlan.OwnerProAnnual:
                    return "Loconomics  *ProAnnual";
                case SubscriptionPlan.OwnerPro:
                    return "Loconomics  *Pro";
                case SubscriptionPlan.OwnerGrowth:
                    return "Loconomics  *Growth";
                default:
                    throw new ArgumentException("Plan value unsupported");
            }
        }

        public Subscription CreateSubscription(SubscriptionPlan plan, string paymentMethodToken, DateTimeOffset trialEndDate)
        {
            var descriptor = new DescriptorRequest
            {
                Name = GetSubscriptionPlanDescriptor(plan)
            };

            var now = DateTimeOffset.Now;
            var trialDuration = now > trialEndDate ? TimeSpan.Zero : trialEndDate - now;
            var trialDurationDays = trialDuration > TimeSpan.Zero ? (int)Math.Floor(trialDuration.TotalDays) : 0;

            var request = new SubscriptionRequest
            {
				PaymentMethodToken = paymentMethodToken,
				PlanId = plan.ToString(),
				Descriptor = descriptor,
				TrialDuration = trialDurationDays,
				TrialDurationUnit = SubscriptionDurationUnit.DAY,
				HasTrialPeriod = trialDurationDays > 0
			};

			var result = Gateway.Subscription.Create(request);

			if (result.IsSuccess())
            {
                return result.Target;
            }
			else
            {
                throw new Exception(result.Message);
            }
		}

        public Subscription GetSubscription(string subscriptionID)
        {
            try
            {
                return Gateway.Subscription.Find(subscriptionID);
            }
			catch (Braintree.Exceptions.NotFoundException)
            {
                return null;
            }
        }

        /// <summary>
        /// Cancel and return a subscription by ID.
        /// Returns null if not found.
        /// </summary>
        /// <param name="subscriptionID"></param>
        /// <returns></returns>
        public Subscription CancelSubscription(string subscriptionID)
        {
            try
            {
                var result = Gateway.Subscription.Cancel(subscriptionID);
                return result.Subscription;
            }
            catch (Braintree.Exceptions.NotFoundException)
            {
                return null;
            }
        }

        #endregion
    }
}