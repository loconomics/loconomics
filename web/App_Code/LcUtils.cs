using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Collection of static utilities shared by
/// all the project
/// </summary>
public static class LcUtils
{
    /// <summary>
    /// Retrieve the passed value as the desired type.
    /// If the internal type is already the correct, just is returned with explicit type.
    /// It not, converion is applied following .net rules, adapting type from compatible ones or parsing from text value.
    /// For nullable values, if T is not-nullable, its underliying value type is get.
    /// If the value is null, DBNull, or impossible to convert, the desired defaultValue is returned.
    /// Ever gets a value of the desired type, and not exceptions are raised.
    /// </summary>
    /// <typeparam name="T">The desired type</typeparam>
    /// <param name="val">The value</param>
    /// <param name="defaultValue">Alternative value, when impossible to convert or any kind of null value.</param>
    /// <returns></returns>
    public static T GetTypedValue<T>(object val, T defaultValue)
    {
        if (val is T)
        {
            return (T)val;
        }
        else if (val == null || val is DBNull)
        {
            return defaultValue;
        }
        else
        {
            // Try to convert to requested type (it works to parse from string too), or defaultValue
            try
            {
                var convertToType = typeof(T);
                // If the type is nullable, will have an underlying not nullable type,
                // we must use that non-nullable for a successful conversion
                var notNullableType = Nullable.GetUnderlyingType(typeof(T));
                if (notNullableType != null)
                {
                    convertToType = notNullableType;
                }
                return (T)Convert.ChangeType(val, convertToType);
            }
            catch {}
            return defaultValue;
        }
    }
}