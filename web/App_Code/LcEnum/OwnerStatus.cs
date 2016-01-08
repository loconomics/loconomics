using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcEnum
{
    public enum OwnerStatus : short
    {
        inTrial = 1,
        active = 2,
        inactive = 3,
        inDefault = 4,
        cancelled = 5,
        suspended = 6
    }
}