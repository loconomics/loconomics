using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcEnum
{
    public enum UserType : short
    {
        None = 0,
        Anonymous = 1,
        Client = 2,
        ServiceProfessional = 4,
        // All Members are Providers too,
        // so an option 'only member' does NOT exists
        // and its value gets reserved for use
        // grouped with the Provider (then, in binary 4 + 8 => 12)
        //OnlyMember = 8,
        Member = 12,
        Admin = 16,
        LoggedUser = 30,
        User = 31,
        System = 32
    }
}