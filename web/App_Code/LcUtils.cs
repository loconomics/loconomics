using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Text;

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
    /// Retrieve the passed value converted to the given type (wrapped as object but an implicit conversion is safe).
    /// If the value is null, DBNull, or impossible to convert, the desired defaultValue is returned (ensure to give
    /// a value in the same desired type, this make safe do an implicit conversion of the returned value into the type).
    /// </summary>
    /// <param name="val"></param>
    /// <param name="defaultValue"></param>
    /// <param name="type"></param>
    /// <returns></returns>
    public static object GetTypedValue(object val, object defaultValue, string type)
    {
        // Try to get the real type in @type
        Type t = ParseType(type);
        if (t == null) {
            throw new ArgumentException("The specified type is not valid, maybe requires a namespace?", "type");
        }
        return GetTypedValue(val, defaultValue, t);
    }
    /// <summary>
    /// Retrieve the passed value converted to the given type (wrapped as object but an implicit conversion is safe).
    /// If the value is null, DBNull, or impossible to convert, the desired defaultValue is returned (ensure to give
    /// a value in the same desired type, this make safe do an implicit conversion of the returned value into the type).
    /// </summary>
    /// <param name="val"></param>
    /// <param name="defaultValue"></param>
    /// <param name="type"></param>
    /// <returns></returns>
    public static object GetTypedValue(object val, object defaultValue, Type type)
    {
        if (val == null || val is DBNull)
        {
            return defaultValue;
        }
        try
        {
            // Try to convert
            return ConvertToType(val, type);
        }
        catch
        {
            // Error catched, return alternative value
            return defaultValue;
        }
    }
    /// <summary>
    /// Converts the type name in a Type instance.
    /// </summary>
    /// <param name="type"></param>
    /// <returns></returns>
    public static Type ParseType(string type)
    {
        // Try to get the real type in @type
        Type t = Type.GetType(type, false, true);
        // If is not a type, try to guess
        if (t == null)
        {
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
        }
        return t;
    }
    /// <summary>
    /// Try to convert the given value at @val to the desired @type,
    /// returning the value converted (but wrapped as object).
    /// If the internal type is already the correct, just is returned.
    /// It not, converion is applied following .net rules, adapting type from compatible ones or parsing from text value.
    /// For nullable values, if T is not-nullable, its underliying value type is get.
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
        Type t = ParseType(type);
        if (t == null) {
            throw new ArgumentException("The specified type is not valid, maybe requires a namespace?", "type");
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

    #region Html
    public static string EncodeForHtml(string s)
    {
        return HttpContext.Current.Server.HtmlEncode(s);
    }
    /// <summary>
    /// Generates the HTML for a Select object
    /// </summary>
    /// <param name="nameAttr"></param>
    /// <param name="selectedValue"></param>
    /// <param name="items">Is a collection or iterator over KeyValuePair&lt;string, object> items</param>
    /// <param name="additionalHtmlAttrs"></param>
    /// <returns></returns>
    public static string BuildHtmlSelect(string nameAttr, object selectedValue, dynamic items, string additionalHtmlAttrs = "")
    {
        var s = new StringBuilder();
        foreach (KeyValuePair<string, object> v in items)
        {
            s.AppendFormat("<option value='{0}' {2}>{1}</option>",
                v.Key,
                EncodeForHtml(GetTypedValue<string>(v.Value, "")),
                AreEquivalents(v.Key, selectedValue) ? "selected='selected'" : "");
        }
        return String.Format("<select name='{0}' {2}>{1}</select>",
            EncodeForHtml(nameAttr),
            s.ToString(),
            additionalHtmlAttrs);
    }
    public static string BuildHtmlInput(string nameAttr, object value, string type = "text", string additionalHtmlAttrs = "")
    {
        return String.Format("<input type='{2}' name='{0}' value='{1}' {3} />",
            EncodeForHtml(nameAttr),
            EncodeForHtml(GetTypedValue<string>(value, "")),
            type,
            additionalHtmlAttrs);
    }
    #endregion

    #region Data utilities
    public static bool AreEquivalents(IEnumerable<object> A, IEnumerable<object> B)
    {
        foreach (var a in A)
        {
            var av = a ?? "";
            foreach (var b in B)
            {
                var bv = b ?? "";
                if (av == bv || av.ToString() == bv.ToString())
                    return true;
                // If both can be converted to numbers, convert to decimal and compare
                // (because sometimes, comparing a integer/float with a decimal gives a false negative because of fixed decimals)
                var ad = GetTypedValue<decimal?>(av, null);
                var bd = GetTypedValue<decimal?>(bv, null);
                if (ad.HasValue &&
                    bd.HasValue &&
                    ad == bd)
                    return true;
            }
        }
        return false;
    }
    public static bool AreEquivalents(object A, object B)
    {
        IEnumerable<object> a, b;
        if (A is IEnumerable<object>)
            a = (IEnumerable<object>)A;
        else
            a = new object[] { A };
        if (B is IEnumerable<object>)
            b = (IEnumerable<object>)B;
        else
            b = new object[] { B };
        return AreEquivalents(a, b);
    }
    /// <summary>
    /// Generates a range of KeyValue pairs for (start, end] values,
    /// generating proper labels as values for its singular and plural names.
    /// </summary>
    /// <typeparam name="TK"></typeparam>
    /// <typeparam name="TV"></typeparam>
    /// <param name="start"></param>
    /// <param name="end"></param>
    /// <param name="step"></param>
    /// <param name="unitSingularName"></param>
    /// <param name="unitPluralName"></param>
    /// <returns></returns>
    public static IEnumerable<KeyValuePair<TK, TV>> GenerateKeyValueRange<TK, TV>(decimal start, decimal end, decimal step = 1, string unitSingularName = null, string unitPluralName = null)
    {
        for(decimal i = start; i < end; i += step)
            yield return new KeyValuePair<TK, TV>(GetTypedValue<TK>(i, default(TK)), GetTypedValue<TV>(GetLabelForValue(i, unitSingularName, unitPluralName), default(TV)));
    }
    #endregion

    #region Text utilities
    /// <summary>
    /// Given a value, it returns a label for it using the number on the value
    /// and the appropiated singular or plural form of its unit name.
    /// The value is converted automatically to a number, if not possible
    /// then is returned the string that represent it.
    /// If the value is null, or an empty or white-space string, null is returned.
    /// </summary>
    /// <param name="value"></param>
    /// <param name="unitSingularName"></param>
    /// <param name="unitPluralName"></param>
    /// <returns></returns>
    public static string GetLabelForValue(object value, string unitSingularName, string unitPluralName)
    {
        if (value == null || (value is string && String.IsNullOrWhiteSpace((string)value)))
            return null;

        decimal? number = LcUtils.GetTypedValue<decimal?>(value, null);
        if (number.HasValue)
            if (number.Value != 1)
                return String.Format(String.IsNullOrEmpty(unitPluralName) ? "{0:#,##0.##}" : "{0:#,##0.##} {1}", number.Value, unitPluralName);
            else
                return String.IsNullOrEmpty(unitSingularName) ? "1" : String.Format("1 {0}", unitSingularName);
        else
            return value.ToString();
    }
    #endregion
}