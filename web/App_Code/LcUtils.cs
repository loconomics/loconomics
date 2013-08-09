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
    #region Types management and conversion
    #region Types list: CTypesTable
    /// <summary>
    /// Table with the C# types aliases list that point to the
    /// CLR equivalent type (full type name, with namespace)
    /// </summary>
    public static Dictionary<string, string> CTypesTable = new Dictionary<string,string> {
        { "sbyte", "System.SByte" }
        ,{ "byte", "System.Byte" }
        ,{ "short", "System.Int16" }
        ,{ "ushort", "System.UInt16" }
        ,{ "int", "System.Int32" }
        ,{ "uint", "System.UInt32" }
        ,{ "long", "System.Int64" }
        ,{ "ulong", "System.UInt64" }
        ,{ "float", "System.Single" }
        ,{ "double", "System.Double" }
        ,{ "decimal", "System.Decimal" }
        ,{ "bool", "System.Boolean" }
        ,{ "char", "System.Char" }
        ,{ "string", "System.String" }
        ,{ "object", "System.Object" }
    };
    #endregion
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
                return (T)ConvertToType(val, typeof(T));
            }
            catch {}
            return defaultValue;
        }
    }
    /// <summary>
    /// Try to convert the given value at @val to the desired @type,
    /// returning the value converted (but wrapped as object still).
    /// It throws an error if conversion is not possible.
    /// </summary>
    /// <param name="val"></param>
    /// <param name="type"></param>
    /// <returns></returns>
    public static object ConvertToType(object val, Type type)
    {
        var convertToType = type;
        // If the type is nullable, will have an underlying not nullable type,
        // we must use that non-nullable for a successful conversion
        var notNullableType = Nullable.GetUnderlyingType(type);
        if (notNullableType != null)
        {
            convertToType = notNullableType;
        }
        return Convert.ChangeType(val, convertToType);
    }
    /// <summary>
    /// Checks if @val is valid to represent as @type, because
    /// is just that type, it can be converted to or parsed to successfully.
    /// @type must be a valid string representing a type. Framework basic types
    /// can be represented by its C# short name ('int', 'decimal'...)
    /// </summary>
    /// <param name="val"></param>
    /// <param name="type"></param>
    /// <returns></returns>
    public static bool ValidateType(object val, string type)
    {
        // Try to get the real type in @type
        Type t = Type.GetType(type, false, true);
        // If is not a type, try to guess
        if (t == null) {
            // Is a C# alias?
            if (CTypesTable.ContainsKey(type))
            {
                t = Type.GetType(CTypesTable[type]);
            }
            else
            {
                // Maybe lost the namespace, try appending the standard one
                t = Type.GetType("System." + type, false, true);
            }
            if (t == null)
            {
                throw new ArgumentException("The specified type is not valid, maybe requires a namespace?", "type");
            }
        }
        return ValidateType(val, t);
    }
    /// <summary>
    /// Checks if @val is valid to represent as @type, because
    /// is just that type, it can be converted to or parsed to successfully.
    /// </summary>
    /// <param name="val"></param>
    /// <param name="type"></param>
    /// <returns></returns>
    public static bool ValidateType(object val, Type type)
    {
        try
        {
            // Try to convert
            ConvertToType(val, type);
            // Success!
            return true;
        }
        catch {}
        // Error catched, impossible
        return false;
    }
    #endregion
}