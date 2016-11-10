using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcEnum
{
    /// <summary>
    /// 
    /// </summary>
    public enum BookingStatus : short
    {
        incomplete = 1,
        request = 2,
        cancelled = 3,
        denied = 4,
        requestExpired = 5,
        confirmed = 6,
        servicePerformed = 7,
        completed = 8,
        dispute = 9
    }
}