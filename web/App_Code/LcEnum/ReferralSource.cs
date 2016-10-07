using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcEnum
{
    /// <summary>
    /// 
    /// </summary>
    public enum ReferralSource : int
    {
        marketplace = 1,
        googleSearch = 2,
        bingSearch = 3,
        yahooSearch = 4,
        yelpListing = 5,
        friendCollege = 6,
        existingClient = 7,
        friendOfTheProfessional = 8,
        onlineAds = 9,
        offlineAds = 10,
        other = 11,
        serviceProfessionalExistingClient = 12,
        serviceProfessionalWebsite = 13
    }
}