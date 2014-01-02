/** Base class 'enum' with utility methods for objects that are used as enumerations.
Its NOT a class to instantiate or to use as base for enumerations, else enumerations
are plain objects with properties-values only.
**/
var Enum = {
    parse: function (enumType, str, caseSensitive) {
        if (caseSensitive)
            return enumType[str] || null;
        str = str.toLowerCase();
        for (var e in enumType)
            if (e.toLowerCase && e.toLowerCase() == str)
                return enumType[e];
        return null;
    }
};

if (typeof module !== 'undefined' && module.exports)
    module.exports = Enum;