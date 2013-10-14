using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;
using WebMatrix.WebData;
using System.Web.WebPages;

public static partial class LcData
{
    /// <summary>
    /// Define an Address data model.
    /// Is not a complete version from database (still almost).
    /// </summary>
    public class Address
    {
        public Address(){}
        public Address(DynamicRecord dbdata)
        {
            if (dbdata.Columns.Contains("Name"))
                Name = (string)dbdata["Name"];
            if (dbdata.Columns.Contains("AddressLine1"))
                AddressLine1 = (string)dbdata["AddressLine1"];
            if (dbdata.Columns.Contains("AddressLine2"))
                AddressLine2 = (string)dbdata["AddressLine2"];
            if (dbdata.Columns.Contains("City"))
                City = (string)dbdata["City"];
            if (dbdata.Columns.Contains("StateProvinceCode"))
                StateProvinceCode = (string)dbdata["StateProvinceCode"];
            if (dbdata.Columns.Contains("PostalCode"))
                PostalCode = (string)dbdata["PostalCode"];
            if (dbdata.Columns.Contains("LocationSpecialInstructions"))
                SpecialInstructions = (string)dbdata["LocationSpecialInstructions"];
            else if (dbdata.Columns.Contains("SpecialInstructions"))
                SpecialInstructions = (string)dbdata["SpecialInstructions"];
            if (dbdata.Columns.Contains("CountryID"))
                CountryID = (int)(dbdata["CountryID"] ?? 1);
        }

        public string Name;
        public string AddressLine1;
        public string AddressLine2;
        public string City;
        public string StateProvinceCode;
        public string PostalCode;
        public string SpecialInstructions;
        public int CountryID;
        /// <summary>
        /// Get the country name.
        /// TODO: Need to be localizable, and cached table lookup instead of hardcoded.
        /// </summary>
        public string Country
        {
            get
            {
                switch (CountryID)
                {
                    case 1:
                        return "United States";
                    case 2:
                        return "Spain";
                    default:
                        return "";
                }
            }
        }
    }
}
