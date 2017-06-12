using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcEnum
{
    public enum OwnerStatus : short
    {
        notYetAnOwner = 0,
        trialEnded = 1,
        active = 2,
        inactive = 3,
        // Note about the gap: value 4 was initially 'inDefault' but removed
        cancelled = 5,
        suspended = 6
    }
}