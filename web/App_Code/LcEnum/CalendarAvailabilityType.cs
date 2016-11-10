using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcEnum
{
    /// <summary>
    /// 
    /// </summary>
    public enum CalendarAvailabilityType : short
    {
        unavailable = 0,
        free = 1,
        busy = 2,
        tentative = 3
    }
}