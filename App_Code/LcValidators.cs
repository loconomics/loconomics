using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.WebPages;
using System.Web.WebPages.Html;
using WebMatrix.Data;
using System.Text.RegularExpressions;

/// <summary>
/// Descripción breve de LcValidators
/// </summary>
public static class LcValidators
{
    public static int ValidateZipCode(string zipcode, int provinceStateID)
    {
        // Validate that Zip Postal Code is valid, and get the matching ID to be used later
        var sqlGetPostalCodeID = @"
            SELECT  PostalCodeID
            FROM    PostalCode As PC
            WHERE   PC.PostalCode = @0
                        AND
                    CountryID = @1
                        AND
                    StateProvinceID = @2
        ";
        using (var db = Database.Open("sqlloco"))
        {
            var postalCodeID = db.QueryValue(sqlGetPostalCodeID, zipcode, 1, provinceStateID);
            return postalCodeID == null ? 0 : (int)postalCodeID;
        }
    }
    public static bool IsEmailAdress(string sEmail){
            if(sEmail!=""){
                var sRegex = new Regex(@"\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*");
                return sRegex.IsMatch(sEmail) ?true:false ;
        }else{
                return false ;
            }
    }
}