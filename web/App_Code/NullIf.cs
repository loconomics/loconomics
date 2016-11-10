using System;

/// <summary>
/// Function collection that returns null as value when some conditions
/// are true, otherwise return the not null value.
/// It allows use the coallesce operator in cases that value can be 'another type
/// of null' (like empty string, white-spaced, or DataBase null) and must to be
/// considered like null.
/// 
/// Author: IagoSRL@gmail.com
/// For: several projects.
/// </summary>
public static class NullIf
{
    /// <summary>
    /// Returns null when value is null or System.DBNull.Value.
    /// </summary>
    /// <param name="dbValue"></param>
    /// <returns></returns>
    public static object DBNull(object dbValue)
    {
        return dbValue == System.DBNull.Value ? null : dbValue;
    }
    /// <summary>
    /// Returns null when value is null or an empty string.
    /// </summary>
    /// <param name="value"></param>
    /// <returns></returns>
    public static string Empty(string value)
    {
        return String.IsNullOrEmpty(value) ? null : value;
    }
    /// <summary>
    /// Returns null when value is null, empty string or white space string
    /// </summary>
    /// <param name="value"></param>
    /// <returns></returns>
    public static string White(string value)
    {
        return String.IsNullOrWhiteSpace(value) ? null : value;
    }
    /// <summary>
    /// Returns null when value is null, empty string or
    /// System.DBNull.Value.
    /// If the value is not null nelse System.DBNull.Value nelse string an exception
    /// of invalid cast is throwed.
    /// </summary>
    /// <param name="dbValue"></param>
    /// <returns></returns>
    public static string DBNullOrEmpty(object dbValue)
    {
        return dbValue == System.DBNull.Value || dbValue == null ? null :
              (string)dbValue == String.Empty ? null : (string)dbValue;       
    }
    /// <summary>
    /// Returns null when value is null, empty string, white space string or
    /// System.DBNull.Value.
    /// If the value is not null nelse System.DBNull.Value nelse string an exception
    /// of invalid cast is throwed.
    /// </summary>
    /// <param name="dbValue"></param>
    /// <returns></returns>
    public static string DBNullOrWhite(object dbValue)
    {
        return dbValue == System.DBNull.Value || dbValue == null ? null :
            ((string)dbValue).Trim() == String.Empty ? null : (string)dbValue;
    }
}
/// <summary>
/// Same class like NullIf, but using a shorter name.
/// </summary>
public static class N
{
    /// <summary>
    /// Returns null when value is null or System.DBNull.Value.
    /// </summary>
    /// <param name="dbValue"></param>
    /// <returns></returns>
    public static object D(object dbValue)
    {
        return NullIf.DBNull(dbValue);
    }
    /// <summary>
    /// Returns null when value is null or an empty string.
    /// </summary>
    /// <param name="value"></param>
    /// <returns></returns>
    public static string E(string value)
    {
        return NullIf.Empty(value);
    }
    /// <summary>
    /// Returns null when value is null, empty string or white space string
    /// </summary>
    /// <param name="value"></param>
    /// <returns></returns>
    public static string W(string value)
    {
        return NullIf.White(value);
    }
    /// <summary>
    /// Returns null when value is null, empty string or
    /// System.DBNull.Value.
    /// If the value is not null nelse System.DBNull.Value nelse string an exception
    /// of invalid cast is throwed.
    /// </summary>
    /// <param name="dbValue"></param>
    /// <returns></returns>
    public static string DE(object dbValue)
    {
        return NullIf.DBNullOrEmpty(dbValue);
    }
    /// <summary>
    /// Returns null when value is null, empty string, white space string or
    /// System.DBNull.Value.
    /// If the value is not null nelse System.DBNull.Value nelse string an exception
    /// of invalid cast is throwed.
    /// </summary>
    /// <param name="dbValue"></param>
    /// <returns></returns>
    public static string DW(object dbValue)
    {
        return NullIf.DBNullOrWhite(dbValue);
    }
}
