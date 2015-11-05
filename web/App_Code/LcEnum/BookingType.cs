using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcEnum
{
    /// <summary>
    /// 
    /// </summary>
    public enum BookingType : int
    {
        marketplaceBooking = 1,
        bookNowBooking = 2,
        serviceProfessionalBooking = 3,
        exchangeBooking = 4,
        partnerBooking = 5
    }
}