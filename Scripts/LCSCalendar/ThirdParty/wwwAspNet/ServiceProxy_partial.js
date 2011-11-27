
    var reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/;
    var reMsAjax = /^\/Date\((d|-|.*)\)[\/|\\]$/;

    function JSONparseWithDate(json) {
        /// <summary>
        /// parses a JSON string and turns ISO or MSAJAX date strings
        /// into native JS date objects
        /// </summary>    
        /// <param name="json" type="var">json with dates to parse</param>        
        /// </param>
        /// <returns type="value, array or object" />
        try {
            var res = JSON.parse(json,
            function (key, value) {
                if (typeof value === 'string') {
                    var a = reISO.exec(value);
                    if (a)
                        return new Date(Date.UTC(+a[1], +a[2] - 1,
                                                 +a[3], +a[4], +a[5], +a[6]));
                    a = reMsAjax.exec(value);
                    if (a) {
                        var b = a[1].split(/[-+,.]/);
                        return new Date(b[0] ? +b[0] : 0 - +b[1]);
                    }
                }
                return value;
            });
            return res;
        } catch (e) {
            // orignal error thrown has no error message so rethrow with message
            throw new Error("JSON content could not be parsed");
            return null;
        }
    };
    function JSONdateStringToDate(dtString) {
        /// <summary>
        /// Converts a JSON ISO or MSAJAX string into a date object
        /// </summary>    
        /// <param name="" type="var">Date String</param>
        /// <returns type="date or null if invalid" /> 
        var a = reISO.exec(dtString);
        if (a)
            return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3],
                                     +a[4], +a[5], +a[6]));
        a = reMsAjax.exec(dtString);
        if (a) {
            var b = a[1].split(/[-,.]/);
            return new Date(+b[0]);
        }
        return null;
    };
    function JSONstringifyWcf(json) {
        /// <summary>
        /// Wcf specific stringify that encodes dates in the
        /// a WCF compatible format ("/Date(9991231231)/")
        /// Note: this format works ONLY with WCF. 
        ///       ASMX can use ISO dates as of .NET 3.5 SP1
        /// </summary>
        /// <param name="key" type="var">property name</param>
        /// <param name="value" type="var">value of the property</param>         
        return JSON.stringify(json, function (key, value) {
            if (typeof value == "string") {
                var a = reISO.exec(value);
                if (a) {
                    var val = '/Date(' +
                              new Date(Date.UTC(+a[1], +a[2] - 1,
                                       +a[3], +a[4],
                                       +a[5], +a[6])).getTime() + ')/';
                    this[key] = val;
                    return val;
                }
            }
            return value;
        })
    };


