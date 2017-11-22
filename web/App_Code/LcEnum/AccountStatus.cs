using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcEnum
{
    public enum AccountStatus : short
    {
        cancelled = 0,
        active = 1,
        inactive = 2,
        suspended = 3,
        unauthorized = 4,
        revoked = 5,
        serviceProfessionalClient = 6,
        subscriber = -1
    }
}