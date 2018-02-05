namespace LcEnum
{
    /// <summary>
    /// Possible 'UserPaymentPlan' subscription plans.
    /// Values greater than 100 and less than 200 are special partnership subscriptions
    /// </summary>
    public enum SubscriptionPlan : short
    {
        Free = 0,
        OwnerGrowth,
        OwnerPro,
        OwnerProAnnual,
        CccPlan = 101
    }
}
