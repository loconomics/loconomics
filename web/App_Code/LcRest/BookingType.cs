using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Descripción breve de BookingType
/// </summary>
public class BookingType
{
    #region Fields
    public int bookingTypeID;
    public string name;
    public decimal firstTimeServiceFeeFixed;
    public decimal firstTimeServiceFeePercentage;
    public decimal paymentProcessingFeePercentage;
    public decimal paymentProcessingFeeFixed;
    public decimal firstTimeServiceFeeMaximum;
    public decimal firstTimeServiceFeeMinimum;
    public DateTime updatedDate;
    #endregion

    #region Instances
    public BookingType() { }

    public static BookingType FromDB(dynamic record)
    {
        if (record == null) return null;

        return new BookingType
        {
            bookingTypeID = record.bookingTypeID,
            name = record.name,
            firstTimeServiceFeeFixed = record.firstTimeServiceFeeFixed,
            firstTimeServiceFeePercentage = record.firstTimeServiceFeePercentage,
            paymentProcessingFeeFixed = record.paymentProcessingFeeFixed,
            paymentProcessingFeePercentage = record.paymentProcessingFeePercentage,
            firstTimeServiceFeeMaximum = record.firstTimeServiceFeeMaximum,
            firstTimeServiceFeeMinimum = record.firstTimeServiceFeeMinimum,
            updatedDate = record.updatedDate
        };
    }
    #endregion

    #region Fetch
    const string sqlGetItem = @"
        SELECT
            bookingTypeID,
            bookingTypeName As name,
            firstTimeServiceFeeFixed,
            firstTimeServiceFeePercentage,
            paymentProcessingFeeFixed,
            paymentProcessingFeePorcentage,
            firstTimeServiceFeeMaximum,
            firstTimeServiceFeeMinimum,
            updatedDate
        FROM
            BookingType
        WHERE
            BookingTypeID = @0
            AND Active = 1
    ";
    public static BookingType Get(int id)
    {
        using (var db = new LcDatabase())
        {
            return FromDB(db.QuerySingle(sqlGetItem, id));
        }
    }
    #endregion
}