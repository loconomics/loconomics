using Braintree;
using System;

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

        #region Subscription
        public enum SubscriptionPlan
        {
			MonthlyLite,
			MonthlyFull,
			AnnualFull
        }

		public string GetSubscriptionPlanDescriptor(SubscriptionPlan plan)
        {
            switch (plan)
            {
                case SubscriptionPlan.AnnualFull:
                    return "Loconomics Annual Full Plan User Fees";
                case SubscriptionPlan.MonthlyFull:
                    return "Loconomics Monthly Full Plan User Fees";
                case SubscriptionPlan.MonthlyLite:
                    return "Loconomics Monthly Lite Plan User Fees";
                default:
                    throw new ArgumentException("Plan value unsupported");
            }
        }

        public Subscription CreateSubscription(int userID, SubscriptionPlan plan, string paymentMethodToken, DateTimeOffset trialEndDate)
        {
            var descriptor = new DescriptorRequest
            {
                Name = GetSubscriptionPlanDescriptor(plan)
            };

            var now = DateTimeOffset.Now;
            var trialDuration = now > trialEndDate ? trialEndDate - now : TimeSpan.Zero;
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
                return result.Subscription;
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

        #endregion
    }
}