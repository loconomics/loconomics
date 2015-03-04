;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * numeral.js
 * version : 1.5.3
 * author : Adam Draper
 * license : MIT
 * http://adamwdraper.github.com/Numeral-js/
 */

(function () {

    /************************************
        Constants
    ************************************/

    var numeral,
        VERSION = '1.5.3',
        // internal storage for language config files
        languages = {},
        currentLanguage = 'en',
        zeroFormat = null,
        defaultFormat = '0,0',
        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports);


    /************************************
        Constructors
    ************************************/


    // Numeral prototype object
    function Numeral (number) {
        this._value = number;
    }

    /**
     * Implementation of toFixed() that treats floats more like decimals
     *
     * Fixes binary rounding issues (eg. (0.615).toFixed(2) === '0.61') that present
     * problems for accounting- and finance-related software.
     */
    function toFixed (value, precision, roundingFunction, optionals) {
        var power = Math.pow(10, precision),
            optionalsRegExp,
            output;
            
        //roundingFunction = (roundingFunction !== undefined ? roundingFunction : Math.round);
        // Multiply up by precision, round accurately, then divide and use native toFixed():
        output = (roundingFunction(value * power) / power).toFixed(precision);

        if (optionals) {
            optionalsRegExp = new RegExp('0{1,' + optionals + '}$');
            output = output.replace(optionalsRegExp, '');
        }

        return output;
    }

    /************************************
        Formatting
    ************************************/

    // determine what type of formatting we need to do
    function formatNumeral (n, format, roundingFunction) {
        var output;

        // figure out what kind of format we are dealing with
        if (format.indexOf('$') > -1) { // currency!!!!!
            output = formatCurrency(n, format, roundingFunction);
        } else if (format.indexOf('%') > -1) { // percentage
            output = formatPercentage(n, format, roundingFunction);
        } else if (format.indexOf(':') > -1) { // time
            output = formatTime(n, format);
        } else { // plain ol' numbers or bytes
            output = formatNumber(n._value, format, roundingFunction);
        }

        // return string
        return output;
    }

    // revert to number
    function unformatNumeral (n, string) {
        var stringOriginal = string,
            thousandRegExp,
            millionRegExp,
            billionRegExp,
            trillionRegExp,
            suffixes = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            bytesMultiplier = false,
            power;

        if (string.indexOf(':') > -1) {
            n._value = unformatTime(string);
        } else {
            if (string === zeroFormat) {
                n._value = 0;
            } else {
                if (languages[currentLanguage].delimiters.decimal !== '.') {
                    string = string.replace(/\./g,'').replace(languages[currentLanguage].delimiters.decimal, '.');
                }

                // see if abbreviations are there so that we can multiply to the correct number
                thousandRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.thousand + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');
                millionRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.million + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');
                billionRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.billion + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');
                trillionRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.trillion + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');

                // see if bytes are there so that we can multiply to the correct number
                for (power = 0; power <= suffixes.length; power++) {
                    bytesMultiplier = (string.indexOf(suffixes[power]) > -1) ? Math.pow(1024, power + 1) : false;

                    if (bytesMultiplier) {
                        break;
                    }
                }

                // do some math to create our number
                n._value = ((bytesMultiplier) ? bytesMultiplier : 1) * ((stringOriginal.match(thousandRegExp)) ? Math.pow(10, 3) : 1) * ((stringOriginal.match(millionRegExp)) ? Math.pow(10, 6) : 1) * ((stringOriginal.match(billionRegExp)) ? Math.pow(10, 9) : 1) * ((stringOriginal.match(trillionRegExp)) ? Math.pow(10, 12) : 1) * ((string.indexOf('%') > -1) ? 0.01 : 1) * (((string.split('-').length + Math.min(string.split('(').length-1, string.split(')').length-1)) % 2)? 1: -1) * Number(string.replace(/[^0-9\.]+/g, ''));

                // round if we are talking about bytes
                n._value = (bytesMultiplier) ? Math.ceil(n._value) : n._value;
            }
        }
        return n._value;
    }

    function formatCurrency (n, format, roundingFunction) {
        var symbolIndex = format.indexOf('$'),
            openParenIndex = format.indexOf('('),
            minusSignIndex = format.indexOf('-'),
            space = '',
            spliceIndex,
            output;

        // check for space before or after currency
        if (format.indexOf(' $') > -1) {
            space = ' ';
            format = format.replace(' $', '');
        } else if (format.indexOf('$ ') > -1) {
            space = ' ';
            format = format.replace('$ ', '');
        } else {
            format = format.replace('$', '');
        }

        // format the number
        output = formatNumber(n._value, format, roundingFunction);

        // position the symbol
        if (symbolIndex <= 1) {
            if (output.indexOf('(') > -1 || output.indexOf('-') > -1) {
                output = output.split('');
                spliceIndex = 1;
                if (symbolIndex < openParenIndex || symbolIndex < minusSignIndex){
                    // the symbol appears before the "(" or "-"
                    spliceIndex = 0;
                }
                output.splice(spliceIndex, 0, languages[currentLanguage].currency.symbol + space);
                output = output.join('');
            } else {
                output = languages[currentLanguage].currency.symbol + space + output;
            }
        } else {
            if (output.indexOf(')') > -1) {
                output = output.split('');
                output.splice(-1, 0, space + languages[currentLanguage].currency.symbol);
                output = output.join('');
            } else {
                output = output + space + languages[currentLanguage].currency.symbol;
            }
        }

        return output;
    }

    function formatPercentage (n, format, roundingFunction) {
        var space = '',
            output,
            value = n._value * 100;

        // check for space before %
        if (format.indexOf(' %') > -1) {
            space = ' ';
            format = format.replace(' %', '');
        } else {
            format = format.replace('%', '');
        }

        output = formatNumber(value, format, roundingFunction);
        
        if (output.indexOf(')') > -1 ) {
            output = output.split('');
            output.splice(-1, 0, space + '%');
            output = output.join('');
        } else {
            output = output + space + '%';
        }

        return output;
    }

    function formatTime (n) {
        var hours = Math.floor(n._value/60/60),
            minutes = Math.floor((n._value - (hours * 60 * 60))/60),
            seconds = Math.round(n._value - (hours * 60 * 60) - (minutes * 60));
        return hours + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds);
    }

    function unformatTime (string) {
        var timeArray = string.split(':'),
            seconds = 0;
        // turn hours and minutes into seconds and add them all up
        if (timeArray.length === 3) {
            // hours
            seconds = seconds + (Number(timeArray[0]) * 60 * 60);
            // minutes
            seconds = seconds + (Number(timeArray[1]) * 60);
            // seconds
            seconds = seconds + Number(timeArray[2]);
        } else if (timeArray.length === 2) {
            // minutes
            seconds = seconds + (Number(timeArray[0]) * 60);
            // seconds
            seconds = seconds + Number(timeArray[1]);
        }
        return Number(seconds);
    }

    function formatNumber (value, format, roundingFunction) {
        var negP = false,
            signed = false,
            optDec = false,
            abbr = '',
            abbrK = false, // force abbreviation to thousands
            abbrM = false, // force abbreviation to millions
            abbrB = false, // force abbreviation to billions
            abbrT = false, // force abbreviation to trillions
            abbrForce = false, // force abbreviation
            bytes = '',
            ord = '',
            abs = Math.abs(value),
            suffixes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            min,
            max,
            power,
            w,
            precision,
            thousands,
            d = '',
            neg = false;

        // check if number is zero and a custom zero format has been set
        if (value === 0 && zeroFormat !== null) {
            return zeroFormat;
        } else {
            // see if we should use parentheses for negative number or if we should prefix with a sign
            // if both are present we default to parentheses
            if (format.indexOf('(') > -1) {
                negP = true;
                format = format.slice(1, -1);
            } else if (format.indexOf('+') > -1) {
                signed = true;
                format = format.replace(/\+/g, '');
            }

            // see if abbreviation is wanted
            if (format.indexOf('a') > -1) {
                // check if abbreviation is specified
                abbrK = format.indexOf('aK') >= 0;
                abbrM = format.indexOf('aM') >= 0;
                abbrB = format.indexOf('aB') >= 0;
                abbrT = format.indexOf('aT') >= 0;
                abbrForce = abbrK || abbrM || abbrB || abbrT;

                // check for space before abbreviation
                if (format.indexOf(' a') > -1) {
                    abbr = ' ';
                    format = format.replace(' a', '');
                } else {
                    format = format.replace('a', '');
                }

                if (abs >= Math.pow(10, 12) && !abbrForce || abbrT) {
                    // trillion
                    abbr = abbr + languages[currentLanguage].abbreviations.trillion;
                    value = value / Math.pow(10, 12);
                } else if (abs < Math.pow(10, 12) && abs >= Math.pow(10, 9) && !abbrForce || abbrB) {
                    // billion
                    abbr = abbr + languages[currentLanguage].abbreviations.billion;
                    value = value / Math.pow(10, 9);
                } else if (abs < Math.pow(10, 9) && abs >= Math.pow(10, 6) && !abbrForce || abbrM) {
                    // million
                    abbr = abbr + languages[currentLanguage].abbreviations.million;
                    value = value / Math.pow(10, 6);
                } else if (abs < Math.pow(10, 6) && abs >= Math.pow(10, 3) && !abbrForce || abbrK) {
                    // thousand
                    abbr = abbr + languages[currentLanguage].abbreviations.thousand;
                    value = value / Math.pow(10, 3);
                }
            }

            // see if we are formatting bytes
            if (format.indexOf('b') > -1) {
                // check for space before
                if (format.indexOf(' b') > -1) {
                    bytes = ' ';
                    format = format.replace(' b', '');
                } else {
                    format = format.replace('b', '');
                }

                for (power = 0; power <= suffixes.length; power++) {
                    min = Math.pow(1024, power);
                    max = Math.pow(1024, power+1);

                    if (value >= min && value < max) {
                        bytes = bytes + suffixes[power];
                        if (min > 0) {
                            value = value / min;
                        }
                        break;
                    }
                }
            }

            // see if ordinal is wanted
            if (format.indexOf('o') > -1) {
                // check for space before
                if (format.indexOf(' o') > -1) {
                    ord = ' ';
                    format = format.replace(' o', '');
                } else {
                    format = format.replace('o', '');
                }

                ord = ord + languages[currentLanguage].ordinal(value);
            }

            if (format.indexOf('[.]') > -1) {
                optDec = true;
                format = format.replace('[.]', '.');
            }

            w = value.toString().split('.')[0];
            precision = format.split('.')[1];
            thousands = format.indexOf(',');

            if (precision) {
                if (precision.indexOf('[') > -1) {
                    precision = precision.replace(']', '');
                    precision = precision.split('[');
                    d = toFixed(value, (precision[0].length + precision[1].length), roundingFunction, precision[1].length);
                } else {
                    d = toFixed(value, precision.length, roundingFunction);
                }

                w = d.split('.')[0];

                if (d.split('.')[1].length) {
                    d = languages[currentLanguage].delimiters.decimal + d.split('.')[1];
                } else {
                    d = '';
                }

                if (optDec && Number(d.slice(1)) === 0) {
                    d = '';
                }
            } else {
                w = toFixed(value, null, roundingFunction);
            }

            // format number
            if (w.indexOf('-') > -1) {
                w = w.slice(1);
                neg = true;
            }

            if (thousands > -1) {
                w = w.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + languages[currentLanguage].delimiters.thousands);
            }

            if (format.indexOf('.') === 0) {
                w = '';
            }

            return ((negP && neg) ? '(' : '') + ((!negP && neg) ? '-' : '') + ((!neg && signed) ? '+' : '') + w + d + ((ord) ? ord : '') + ((abbr) ? abbr : '') + ((bytes) ? bytes : '') + ((negP && neg) ? ')' : '');
        }
    }

    /************************************
        Top Level Functions
    ************************************/

    numeral = function (input) {
        if (numeral.isNumeral(input)) {
            input = input.value();
        } else if (input === 0 || typeof input === 'undefined') {
            input = 0;
        } else if (!Number(input)) {
            input = numeral.fn.unformat(input);
        }

        return new Numeral(Number(input));
    };

    // version number
    numeral.version = VERSION;

    // compare numeral object
    numeral.isNumeral = function (obj) {
        return obj instanceof Numeral;
    };

    // This function will load languages and then set the global language.  If
    // no arguments are passed in, it will simply return the current global
    // language key.
    numeral.language = function (key, values) {
        if (!key) {
            return currentLanguage;
        }

        if (key && !values) {
            if(!languages[key]) {
                throw new Error('Unknown language : ' + key);
            }
            currentLanguage = key;
        }

        if (values || !languages[key]) {
            loadLanguage(key, values);
        }

        return numeral;
    };
    
    // This function provides access to the loaded language data.  If
    // no arguments are passed in, it will simply return the current
    // global language object.
    numeral.languageData = function (key) {
        if (!key) {
            return languages[currentLanguage];
        }
        
        if (!languages[key]) {
            throw new Error('Unknown language : ' + key);
        }
        
        return languages[key];
    };

    numeral.language('en', {
        delimiters: {
            thousands: ',',
            decimal: '.'
        },
        abbreviations: {
            thousand: 'k',
            million: 'm',
            billion: 'b',
            trillion: 't'
        },
        ordinal: function (number) {
            var b = number % 10;
            return (~~ (number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
        },
        currency: {
            symbol: '$'
        }
    });

    numeral.zeroFormat = function (format) {
        zeroFormat = typeof(format) === 'string' ? format : null;
    };

    numeral.defaultFormat = function (format) {
        defaultFormat = typeof(format) === 'string' ? format : '0.0';
    };

    /************************************
        Helpers
    ************************************/

    function loadLanguage(key, values) {
        languages[key] = values;
    }

    /************************************
        Floating-point helpers
    ************************************/

    // The floating-point helper functions and implementation
    // borrows heavily from sinful.js: http://guipn.github.io/sinful.js/

    /**
     * Array.prototype.reduce for browsers that don't support it
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce#Compatibility
     */
    if ('function' !== typeof Array.prototype.reduce) {
        Array.prototype.reduce = function (callback, opt_initialValue) {
            'use strict';
            
            if (null === this || 'undefined' === typeof this) {
                // At the moment all modern browsers, that support strict mode, have
                // native implementation of Array.prototype.reduce. For instance, IE8
                // does not support strict mode, so this check is actually useless.
                throw new TypeError('Array.prototype.reduce called on null or undefined');
            }
            
            if ('function' !== typeof callback) {
                throw new TypeError(callback + ' is not a function');
            }

            var index,
                value,
                length = this.length >>> 0,
                isValueSet = false;

            if (1 < arguments.length) {
                value = opt_initialValue;
                isValueSet = true;
            }

            for (index = 0; length > index; ++index) {
                if (this.hasOwnProperty(index)) {
                    if (isValueSet) {
                        value = callback(value, this[index], index, this);
                    } else {
                        value = this[index];
                        isValueSet = true;
                    }
                }
            }

            if (!isValueSet) {
                throw new TypeError('Reduce of empty array with no initial value');
            }

            return value;
        };
    }

    
    /**
     * Computes the multiplier necessary to make x >= 1,
     * effectively eliminating miscalculations caused by
     * finite precision.
     */
    function multiplier(x) {
        var parts = x.toString().split('.');
        if (parts.length < 2) {
            return 1;
        }
        return Math.pow(10, parts[1].length);
    }

    /**
     * Given a variable number of arguments, returns the maximum
     * multiplier that must be used to normalize an operation involving
     * all of them.
     */
    function correctionFactor() {
        var args = Array.prototype.slice.call(arguments);
        return args.reduce(function (prev, next) {
            var mp = multiplier(prev),
                mn = multiplier(next);
        return mp > mn ? mp : mn;
        }, -Infinity);
    }        


    /************************************
        Numeral Prototype
    ************************************/


    numeral.fn = Numeral.prototype = {

        clone : function () {
            return numeral(this);
        },

        format : function (inputString, roundingFunction) {
            return formatNumeral(this, 
                  inputString ? inputString : defaultFormat, 
                  (roundingFunction !== undefined) ? roundingFunction : Math.round
              );
        },

        unformat : function (inputString) {
            if (Object.prototype.toString.call(inputString) === '[object Number]') { 
                return inputString; 
            }
            return unformatNumeral(this, inputString ? inputString : defaultFormat);
        },

        value : function () {
            return this._value;
        },

        valueOf : function () {
            return this._value;
        },

        set : function (value) {
            this._value = Number(value);
            return this;
        },

        add : function (value) {
            var corrFactor = correctionFactor.call(null, this._value, value);
            function cback(accum, curr, currI, O) {
                return accum + corrFactor * curr;
            }
            this._value = [this._value, value].reduce(cback, 0) / corrFactor;
            return this;
        },

        subtract : function (value) {
            var corrFactor = correctionFactor.call(null, this._value, value);
            function cback(accum, curr, currI, O) {
                return accum - corrFactor * curr;
            }
            this._value = [value].reduce(cback, this._value * corrFactor) / corrFactor;            
            return this;
        },

        multiply : function (value) {
            function cback(accum, curr, currI, O) {
                var corrFactor = correctionFactor(accum, curr);
                return (accum * corrFactor) * (curr * corrFactor) /
                    (corrFactor * corrFactor);
            }
            this._value = [this._value, value].reduce(cback, 1);
            return this;
        },

        divide : function (value) {
            function cback(accum, curr, currI, O) {
                var corrFactor = correctionFactor(accum, curr);
                return (accum * corrFactor) / (curr * corrFactor);
            }
            this._value = [this._value, value].reduce(cback);            
            return this;
        },

        difference : function (value) {
            return Math.abs(numeral(this._value).subtract(value).value());
        }

    };

    /************************************
        Exposing Numeral
    ************************************/

    // CommonJS module is defined
    if (hasModule) {
        module.exports = numeral;
    }

    /*global ender:false */
    if (typeof ender === 'undefined') {
        // here, `this` means `window` in the browser, or `global` on the server
        // add `numeral` as a global object via a string identifier,
        // for Closure Compiler 'advanced' mode
        this['numeral'] = numeral;
    }

    /*global define:false */
    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return numeral;
        });
    }
}).call(this);

},{}],2:[function(require,module,exports){
/**
    Account activity
**/
'use strict';

var singleton = null,
    NavAction = require('../viewmodels/NavAction'),
    NavBar = require('../viewmodels/NavBar');

exports.init = function initAccount($activity, app) {

    if (singleton === null)
        singleton = new AccountActivity($activity, app);
    
    return singleton;
};

function AccountActivity($activity, app) {
    
    this.accessLevel = app.UserType.LoggedUser;

    this.$activity = $activity;
    this.app = app;
    
    this.navBar = new NavBar({
        title: 'Account',
        leftAction: NavAction.menuNewItem,
        rightAction: NavAction.menuIn
    });
}

AccountActivity.prototype.show = function show(options) {

};

},{"../viewmodels/NavAction":88,"../viewmodels/NavBar":89}],3:[function(require,module,exports){
/** Calendar activity **/
'use strict';

var $ = require('jquery'),
    moment = require('moment'),
    ko = require('knockout'),
    NavAction = require('../viewmodels/NavAction'),
    NavBar = require('../viewmodels/NavBar');
require('../components/DatePicker');

var singleton = null;

exports.init = function initAppointment($activity, app) {

    if (singleton === null)
        singleton = new AppointmentActivity($activity, app);
    
    return singleton;
};

function AppointmentActivity($activity, app) {

    this.accessLevel = app.UserType.Provider;
    this.menuItem = 'calendar';
    
    /* Getting elements */
    this.$activity = $activity;
    this.$appointmentView = $activity.find('#calendarAppointmentView');
    this.$chooseNew = $('#calendarChooseNew');
    this.app = app;
    
    // Object to hold the options passed on 'show' as a result
    // of a request from another activity
    this.requestInfo = null;
    
    // Create a specific backAction that shows current date
    // and return to calendar in current date.
    // Later some more changes are applied, with viewmodel ready
    var backAction = new NavAction({
        link: 'calendar/', // Preserve last slash, for later use
        icon: NavAction.goBack.icon(),
        isTitle: true,
        text: 'Calendar'
    });
    this.navBar = new NavBar({
        title: '',
        leftAction: backAction,
        rightAction: NavAction.goHelpIndex
    });
    
    this.initAppointment();
    
    // This title text is dynamic, we need to replace it by a computed observable
    // showing the current date
    var defBackText = backAction.text._initialValue;
    backAction.text = ko.computed(function() {

        var d = this.appointmentsDataView.currentDate();
        if (!d)
            // Fallback to the default title
            return defBackText;

        var m = moment(d);
        var t = m.format('dddd [(]M/D[)]');
        return t;
    }, this);
    // And the link is dynamic too, to allow return to the date
    // that matches current appointment
    var defLink = backAction.link._initialValue;
    backAction.link = ko.computed(function() {

        var d = this.appointmentsDataView.currentDate();
        if (!d)
            // Fallback to the default link
            return defLink;

        return defLink + d.toISOString();
    }, this);
    
    this.appointmentsDataView.currentAppointment.subscribe(function (apt) {
        // Update URL to match the appointment ID and
        // track it state
        // Get ID from URL, to avoid do anything if the same.
        var aptId = apt.id();
        var urlId = /appointment\/(\d+)/i.test(window.location);
        urlId = urlId && urlId[1] || '';
        if (urlId !== '0' && aptId !== null && urlId !== aptId.toString()) {
            
            // TODO save a useful state
            // Not for now, is failing, but something based on:
            /*
            var viewstate = {
                appointment: apt.model.toPlainObject(true)
            };
            */
            
            // If was a root URL, no ID, just replace current state
            if (urlId === '')
                app.shell.history.replaceState(null, null, 'appointment/' + aptId);
            else
                app.shell.history.pushState(null, null, 'appointment/' + aptId);
        }
        
        // Trigger a layout update, required by the full-height feature
        $(window).trigger('layoutUpdate');
    });
}

AppointmentActivity.prototype.show = function show(options) {
    /* jshint maxcomplexity:10 */
    this.requestInfo = options || {};
    
    var apt;
    if (this.requestInfo.appointment) {
        apt = this.requestInfo.appointment;
    } else {
    // Get ID
        var aptId = options && options.route && options.route.segments[0];
        aptId = parseInt(aptId, 10);
        apt = aptId || 0;
    }
    this.showAppointment(apt);
    
    // If there are options (there are not on startup or
    // on cancelled edition).
    // And it comes back from the textEditor.
    if (options !== null) {

        var booking = this.appointmentsDataView.currentAppointment();

        if (options.request === 'textEditor' && booking) {

            booking[options.field](options.text);
        }
        else if (options.selectClient === true && booking) {

            booking.client(options.selectedClient);
        }
        else if (typeof(options.selectedDatetime) !== 'undefined' && booking) {

            booking.startTime(options.selectedDatetime);
            // TODO Calculate the endTime given an appointment duration, retrieved from the
            // selected service
            //var duration = booking.pricing && booking.pricing.duration;
            // Or by default (if no pricing selected or any) the user preferred
            // time gap
            //duration = duration || user.preferences.timeSlotsGap;
            // PROTOTYPE:
            var duration = 60; // minutes
            booking.endTime(moment(booking.startTime()).add(duration, 'minutes').toDate());
        }
        else if (options.selectServices === true && booking) {

            booking.services(options.selectedServices);
        }
        else if (options.selectLocation === true && booking) {

            booking.location(options.selectedLocation);
        }
    }
};

var Appointment = require('../models/Appointment');

AppointmentActivity.prototype.showAppointment = function showAppointment(apt) {

    if (typeof(apt) === 'number') {
        if (apt) {
            // TODO: select appointment apt ID

        } else if (apt === 0) {
            this.appointmentsDataView.newAppointment(new Appointment());
            this.appointmentsDataView.editMode(true);
        }
    }
    else {
        // Appointment object
        if (apt.id) {
            // TODO: select appointment by apt id
            // TODO: then update values with in-editing values from apt
        }
        else {
            // New apopintment with the in-editing values
            this.appointmentsDataView.newAppointment(new Appointment(apt));
            this.appointmentsDataView.editMode(true);
        }
    }
};

AppointmentActivity.prototype.initAppointment = function initAppointment() {
    if (!this.__initedAppointment) {
        this.__initedAppointment = true;

        var app = this.app;
        
        // Data
        var testData = require('../testdata/calendarAppointments').appointments;
        var appointmentsDataView = {
            appointments: ko.observableArray(testData),
            currentIndex: ko.observable(0),
            editMode: ko.observable(false),
            newAppointment: ko.observable(null)
        };
        
        this.appointmentsDataView = appointmentsDataView;
        
        appointmentsDataView.isNew = ko.computed(function(){
            return this.newAppointment() !== null;
        }, appointmentsDataView);
        
        appointmentsDataView.currentAppointment = ko.computed({
            read: function() {
                if (this.isNew()) {
                    return this.newAppointment();
                }
                else {
                    return this.appointments()[this.currentIndex() % this.appointments().length];
                }
            },
            write: function(apt) {
                var index = this.currentIndex() % this.appointments().length;
                this.appointments()[index] = apt;
                this.appointments.valueHasMutated();
            },
            owner: appointmentsDataView
        });
        
        appointmentsDataView.originalEditedAppointment = {};
 
        appointmentsDataView.goPrevious = function goPrevious() {
            if (this.editMode()) return;
        
            if (this.currentIndex() === 0)
                this.currentIndex(this.appointments().length - 1);
            else
                this.currentIndex((this.currentIndex() - 1) % this.appointments().length);
        };
        
        appointmentsDataView.goNext = function goNext() {
            if (this.editMode()) return;

            this.currentIndex((this.currentIndex() + 1) % this.appointments().length);
        };

        appointmentsDataView.edit = function edit() {
            this.editMode(true);
        }.bind(appointmentsDataView);
        
        appointmentsDataView.cancel = function cancel() {
            
            // if is new, discard
            if (this.isNew()) {
                this.newAppointment(null);
            }
            else {
                // revert changes
                this.currentAppointment(new Appointment(this.originalEditedAppointment));
            }

            this.editMode(false);
        }.bind(appointmentsDataView);
        
        appointmentsDataView.save = function save() {
            // If is a new one, add it to the collection
            if (this.isNew()) {
                
                var newApt = this.newAppointment();
                // TODO: some fieds need some kind of calculation that is persisted
                // son cannot be computed. Simulated:
                newApt.summary('Massage Therapist Booking');
                newApt.id(4);
                
                // Add to the list:
                this.appointments.push(newApt);
                // now, reset
                this.newAppointment(null);
                // current index must be the just-added apt
                this.currentIndex(this.appointments().length - 1);
                
                // On adding a new one, the confirmation page must be showed
                app.shell.go('bookingConfirmation', {
                    booking: newApt
                });
            }

            this.editMode(false);
        }.bind(appointmentsDataView);
        
        appointmentsDataView.editMode.subscribe(function(isEdit) {
            
            this.$activity.toggleClass('in-edit', isEdit);
            this.$appointmentView.find('.AppointmentCard').toggleClass('in-edit', isEdit);
            
            if (isEdit) {
                // Create a copy of the appointment so we revert on 'cancel'
                appointmentsDataView.originalEditedAppointment = 
                    ko.toJS(appointmentsDataView.currentAppointment());
            }
            
        }.bind(this));
        
        appointmentsDataView.currentDate = ko.computed(function() {
            
            var apt = this.currentAppointment(),
                justDate = null;

            if (apt && apt.startTime())
                justDate = moment(apt.startTime()).hours(0).minutes(0).seconds(0).toDate();
            
            return justDate;
        }, appointmentsDataView);
        
        /**
            External actions
        **/
        var editFieldOn = function editFieldOn(activity, data) {
            
            // Include appointment to recover state on return:
            data.appointment = appointmentsDataView.currentAppointment().model.toPlainObject(true);

            app.shell.go(activity, data);
        };
        
        appointmentsDataView.pickDateTime = function pickDateTime() {

            editFieldOn('datetimePicker', {
                selectedDatetime: null
            });
        };
        
        appointmentsDataView.pickClient = function pickClient() {

            editFieldOn('clients', {
                selectClient: true,
                selectedClient: null
            });
        };

        appointmentsDataView.pickService = function pickService() {

            editFieldOn('services', {
                selectServices: true,
                selectedServices: appointmentsDataView.currentAppointment().services()
            });
        };

        appointmentsDataView.changePrice = function changePrice() {
            // TODO
        };
        
        appointmentsDataView.pickLocation = function pickLocation() {

            editFieldOn('locations', {
                selectLocation: true,
                selectedLocation: appointmentsDataView.currentAppointment().location()
            });
        };

        var textFieldsHeaders = {
            preNotesToClient: 'Notes to client',
            postNotesToClient: 'Notes to client (afterwards)',
            preNotesToSelf: 'Notes to self',
            postNotesToSelf: 'Booking summary'
        };
        
        appointmentsDataView.editTextField = function editTextField(field) {

            editFieldOn('textEditor', {
                request: 'textEditor',
                field: field,
                title: appointmentsDataView.isNew() ? 'New booking' : 'Booking',
                header: textFieldsHeaders[field],
                text: appointmentsDataView.currentAppointment()[field]()
            });
        }.bind(this);
        
        ko.applyBindings(appointmentsDataView, this.$activity.get(0));
    }
};

},{"../components/DatePicker":38,"../models/Appointment":41,"../testdata/calendarAppointments":57,"../viewmodels/NavAction":88,"../viewmodels/NavBar":89,"knockout":false,"moment":false}],4:[function(require,module,exports){
/**
    bookingConfirmation activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout');
    
var singleton = null;

exports.init = function initClients($activity, app) {

    if (singleton === null)
        singleton = new BookingConfirmationActivity($activity, app);
    
    return singleton;
};

function BookingConfirmationActivity($activity, app) {

    this.accessLevel = app.UserType.LoggedUser;
    
    this.$activity = $activity;
    this.app = app;

    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));
}

BookingConfirmationActivity.prototype.show = function show(options) {

    if (options && options.booking)
        this.dataView.booking(options.booking);
};

function ViewModel() {

    // :Appointment
    this.booking = ko.observable(null);
}

},{"knockout":false}],5:[function(require,module,exports){
/** Calendar activity **/
'use strict';

var $ = require('jquery'),
    moment = require('moment');
require('../components/DatePicker');
var ko = require('knockout');
var CalendarSlot = require('../models/CalendarSlot'),
    NavBar = require('../viewmodels/NavBar'),
    NavAction = require('../viewmodels/NavAction');

var singleton = null;

exports.init = function initCalendar($activity, app) {

    if (singleton === null)
        singleton = new CalendarActivity($activity, app);
    
    return singleton;
};

function CalendarActivity($activity, app) {

    this.accessLevel = app.UserType.LoggedUser;
    this.navBar = new NavBar({
        title: 'Calendar',
        leftAction: NavAction.menuNewItem,
        rightAction: NavAction.menuIn
    });
    
    /* Getting elements */
    this.$activity = $activity;
    this.$datepicker = $activity.find('#calendarDatePicker');
    this.$dailyView = $activity.find('#calendarDailyView');
    this.$dateHeader = $activity.find('#calendarDateHeader');
    this.$dateTitle = this.$dateHeader.children('.CalendarDateHeader-date');
    this.$chooseNew = $('#calendarChooseNew');
    this.app = app;
    
    /* Init components */
    this.$datepicker.show().datepicker();

    // Data
    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));

    // Testing data
    this.dataView.slotsData(require('../testdata/calendarSlots').calendar);
    
    // Object to hold the options passed on 'show' as a result
    // of a request from another activity
    this.requestInfo = null;

    /* Event handlers */
    // Changes on currentDate
    this.dataView.currentDate.subscribe(function(date) {
        
        // Trigger a layout update, required by the full-height feature
        $(window).trigger('layoutUpdate');
        
        if (date) {
            var mdate = moment(date);

            if (mdate.isValid()) {
                
                var isoDate = mdate.toISOString();
                
                // Update datepicker selected date on date change (from 
                // a different source than the datepicker itself
                this.$datepicker.removeClass('is-visible');
                // Change not from the widget?
                if (this.$datepicker.datepicker('getValue').toISOString() !== isoDate)
                    this.$datepicker.datepicker('setValue', date, true);

                // On currentDate changes, update the URL
                // TODO: save a useful state
                // DOUBT: push or replace state? (more history entries or the same?)
                app.shell.history.pushState(null, null, 'calendar/' + isoDate);
                
                // DONE
                return;
            }
        }
        
        // Something fail, bad date or not date at all
        // Set the current one
        this.dataView.currentDate(new Date());

    }.bind(this));

    // Swipe date on gesture
    this.$dailyView
    .on('swipeleft swiperight', function(e) {
        e.preventDefault();
        
        var dir = e.type === 'swipeleft' ? 'next' : 'prev';
        
        // Hack to solve the freezy-swipe and tap-after bug on JQM:
        $(document).trigger('touchend');
        // Change date
        this.$datepicker.datepicker('moveValue', dir, 'date');

    }.bind(this));
    
    // Changing date with buttons:
    this.$dateHeader.on('tap', '.CalendarDateHeader-switch', function(e) {
        switch (e.currentTarget.getAttribute('href')) {
            case '#prev':
                this.$datepicker.datepicker('moveValue', 'prev', 'date');
                break;
            case '#next':
                this.$datepicker.datepicker('moveValue', 'next', 'date');
                break;
            default:
                // Lets default:
                return;
        }
        e.preventDefault();
        e.stopPropagation();
    }.bind(this));

    // Showing datepicker when pressing the title
    this.$dateTitle.on('tap', function(e) {
        this.$datepicker.toggleClass('is-visible');
        e.preventDefault();
        e.stopPropagation();
    }.bind(this));

    // Updating view date when picked another one
    this.$datepicker.on('changeDate', function(e) {
        if (e.viewMode === 'days') {
            this.dataView.currentDate(e.date);
        }
    }.bind(this));

    // Set date to match datepicker for first update
    this.dataView.currentDate(this.$datepicker.datepicker('getValue'));
}

CalendarActivity.prototype.show = function show(options) {
    /* jshint maxcomplexity:10 */
    
    if (options && options.route && options.route.segments) {
        var sdate = options.route.segments[0],
            mdate = moment(sdate),
            date = mdate.isValid() ? mdate.toDate() : null;

        if (date)
            this.dataView.currentDate(date);
    }
};

function ViewModel() {

    this.slots = ko.observableArray([]);
    this.slotsData = ko.observable({});
    this.currentDate = ko.observable(new Date());
    
    // Update current slots on date change
    this.currentDate.subscribe(function (date) {

        var mdate = moment(date),
            sdate = mdate.format('YYYY-MM-DD');
        
        var slots = this.slotsData();

        if (slots.hasOwnProperty(sdate)) {
            this.slots(slots[sdate]);
        } else {
            this.slots(slots['default']);
        }
    }.bind(this));
}

},{"../components/DatePicker":38,"../models/CalendarSlot":44,"../testdata/calendarSlots":58,"../viewmodels/NavAction":88,"../viewmodels/NavBar":89,"knockout":false,"moment":false}],6:[function(require,module,exports){
/**
    ClientEdition activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function ClientEditionActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel();
    
    this.accessLevel = this.app.UserType.LoggedUser;
    
    this.navBar = Activity.createSubsectionNavBar('clients');
});

exports.init = A.init;

var ko = require('knockout');
var Client = require('../models/Client');

function ViewModel() {
    
    this.client = ko.observable(new Client());
    
    this.header = ko.observable('Edit Location');
    
    // TODO
    this.save = function() {};
    this.cancel = function() {};
}

},{"../components/Activity":37,"../models/Client":45,"knockout":false}],7:[function(require,module,exports){
/**
    clients activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    NavBar = require('../viewmodels/NavBar'),
    NavAction = require('../viewmodels/NavAction');
    
var Activity = require('../components/Activity');

var singleton = null;

exports.init = function initClients($activity, app) {

    if (singleton === null)
        singleton = new ClientsActivity($activity, app);
    
    return singleton;
};

function ClientsActivity($activity, app) {

    this.accessLevel = app.UserType.Provider;
    
    this.navBar = Activity.createSubsectionNavBar('Clients');
    
    this.$activity = $activity;
    this.app = app;
    this.$index = $activity.find('#clientsIndex');
    this.$listView = $activity.find('#clientsListView');

    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));

    // TestingData
    this.dataView.clients(require('../testdata/clients').clients);
    
    // Handler to update header based on a mode change:
    this.dataView.isSelectionMode.subscribe(function (itIs) {
        this.dataView.headerText(itIs ? 'Select a client' : '');
    }.bind(this));

    // Object to hold the options passed on 'show' as a result
    // of a request from another activity
    this.requestInfo = null;
    
    // Handler to go back with the selected client when 
    // there is one selected and requestInfo is for
    // 'select mode'
    this.dataView.selectedClient.subscribe(function (theSelectedClient) {
        // We have a request and
        // it requested to select a client,
        // and a selected client
        if (this.requestInfo &&
            this.requestInfo.selectClient === true &&
            theSelectedClient) {
            
            // Pass the selected client in the info
            this.requestInfo.selectedClient = theSelectedClient;
            // And go back
            this.app.shell.goBack(this.requestInfo);
            // Last, clear requestInfo
            this.requestInfo = null;
        }
    }.bind(this));
}

ClientsActivity.prototype.show = function show(options) {

    // On every show, search gets reseted
    this.dataView.searchText('');
  
    options = options || {};
    this.requestInfo = options;

    this.dataView.isSelectionMode(options.selectClient === true);
};

function ViewModel() {

    this.headerText = ko.observable('');

    // Especial mode when instead of pick and edit we are just selecting
    // (when editing an appointment)
    this.isSelectionMode = ko.observable(false);

    // Full list of clients
    this.clients = ko.observableArray([]);
    
    // Search text, used to filter 'clients'
    this.searchText = ko.observable('');
    
    // Utility to get a filtered list of clients based on clients
    this.getFilteredList = function getFilteredList() {
        var s = (this.searchText() || '').toLowerCase();

        return this.clients().filter(function(client) {
            var n = client && client.fullName() || '';
            n = n.toLowerCase();
            return n.indexOf(s) > -1;
        });
    };

    // Filtered list of clients
    this.filteredClients = ko.computed(function() {
        return this.getFilteredList();
    }, this);
    
    // Grouped list of filtered clients
    this.groupedClients = ko.computed(function(){

        var clients = this.filteredClients().sort(function(clientA, clientB) {
            return clientA.firstName() > clientB.firstName();
        });
        
        var groups = [],
            latestGroup = null,
            latestLetter = null;

        clients.forEach(function(client) {
            var letter = (client.firstName()[0] || '').toUpperCase();
            if (letter !== latestLetter) {
                latestGroup = {
                    letter: letter,
                    clients: [client]
                };
                groups.push(latestGroup);
                latestLetter = letter;
            }
            else {
                latestGroup.clients.push(client);
            }
        });

        return groups;

    }, this);
    
    this.selectedClient = ko.observable(null);
    
    this.selectClient = function(selectedClient) {
        
        this.selectedClient(selectedClient);
    }.bind(this);
}

},{"../components/Activity":37,"../testdata/clients":59,"../viewmodels/NavAction":88,"../viewmodels/NavBar":89,"knockout":false}],8:[function(require,module,exports){
/**
    CMS activity
    (Client Management System)
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');

var A = Activity.extends(function CmsActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel();
    
    this.accessLevel = this.app.UserType.LoggedUser;
    
    this.navBar = Activity.createSectionNavBar('Client management');
    
    // Keep clientsCount updated
    // TODO this.app.model.clients
    var clients = ko.observableArray(require('../testdata/clients').clients);
    this.viewModel.clientsCount(clients().length);
    clients.subscribe(function() {
        this.viewModel.clientsCount(clients().length);
    }.bind(this));
});

exports.init = A.init;

function ViewModel() {
    
    this.clientsCount = ko.observable();
}

},{"../components/Activity":37,"../testdata/clients":59,"knockout":false}],9:[function(require,module,exports){
/**
    ContactForm activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function ContactFormActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel();
    
    this.accessLevel = this.app.UserType.LoggedUser;
    
    this.navBar = Activity.createSubsectionNavBar('Talk to us');
});

exports.init = A.init;

var ko = require('knockout');
function ViewModel() {
    
    this.message = ko.observable('');
    this.wasSent = ko.observable(false);

    var updateWasSent = function() {
        this.wasSent(false);
    }.bind(this);
    this.message.subscribe(updateWasSent);
    
    this.send = function send() {
        // TODO: Send
        
        // Reset after being sent
        this.message('');
        this.wasSent(true);

    }.bind(this);
}

},{"../components/Activity":37,"knockout":false}],10:[function(require,module,exports){
/**
    ContactInfo activity
**/
'use strict';

var singleton = null,
    ko = require('knockout'),
    NavBar = require('../viewmodels/NavBar'),
    NavAction = require('../viewmodels/NavAction');

exports.init = function initContactInfo($activity, app) {

    if (singleton === null)
        singleton = new ContactInfoActivity($activity, app);
    
    return singleton;
};

function ContactInfoActivity($activity, app) {

    this.accessLevel = app.UserType.LoggedUser;
    
    this.$activity = $activity;
    this.app = app;
    this.dataView = new ViewModel();
    this.dataView.profile = app.model.user;
    ko.applyBindings(this.dataView, $activity.get(0));

    this.navBar = new NavBar({
        title: '',
        leftAction: NavAction.goBack.model.clone({
            text: 'Account',
            isTitle: true
        }),
        rightAction: NavAction.goHelpIndex
    });
    
    app.model.user().onboardingStep.subscribe(function (step) {
        
        if (step) {
            // TODO Set navbar step index
            // Setting navbar for Onboarding/wizard mode
            this.navBar.leftAction().text('');
            // Setting header
            this.dataView.headerText('How can we reach you?');
            this.dataView.buttonText('Save and continue');
        }
        else {
            // TODO Remove step index
            // Setting navbar to default
            this.navBar.leftAction().text('Account');
            // Setting header to default
            this.dataView.headerText('Contact information');
            this.dataView.buttonText('Save');
        }
    }.bind(this));
}

ContactInfoActivity.prototype.show = function show(options) {

};

function ViewModel() {

    this.headerText = ko.observable('Contact information');
    this.buttonText = ko.observable('Save');
    this.profile = ko.observable();
}

},{"../viewmodels/NavAction":88,"../viewmodels/NavBar":89,"knockout":false}],11:[function(require,module,exports){
/**
    Conversation activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function ConversationActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel();
    
    this.accessLevel = this.app.UserType.LoggedUser;
    
    this.navBar = Activity.createSubsectionNavBar('Inbox');
    
    // TestingData
    setSomeTestingData(this.viewModel);
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    if (state && state.route && state.route.segments) {
        this.viewModel.conversationID(parseInt(state.route.segments[0], 10) || 0);
    }
};

var MailFolder = require('../models/MailFolder');
var ko = require('knockout');

function ViewModel() {

    this.inbox = new MailFolder({
        topNumber: 20
    });
    
    this.conversationID = ko.observable(null);
    
    this.conversation = ko.pureComputed(function() {
        var conID = this.conversationID();
        return this.inbox.messages().filter(function(v) {
            return v && v.id() === conID;
        });
    }, this);
    
    this.subject = ko.pureComputed(function() {
        var m = this.conversation()[0];
        return (
            m ?
            m.subject() :
            'Conversation w/o subject'
        );
        
    }, this);
}

/** TESTING DATA **/
function setSomeTestingData(viewModel) {
    
    viewModel.inbox.messages(require('../testdata/messages').messages);
}

},{"../components/Activity":37,"../models/MailFolder":49,"../testdata/messages":61,"knockout":false}],12:[function(require,module,exports){
/**
    datetimePicker activity
**/
'use strict';

var $ = require('jquery'),
    moment = require('moment'),
    ko = require('knockout'),
    Time = require('../utils/Time'),
    NavBar = require('../viewmodels/NavBar'),
    NavAction = require('../viewmodels/NavAction');
require('../components/DatePicker');
    
var singleton = null;

exports.init = function initDatetimePicker($activity, app) {

    if (singleton === null)
        singleton = new DatetimePickerActivity($activity, app);

    return singleton;
};

function DatetimePickerActivity($activity, app) {

    this.accessLevel = app.UserType.LoggedUser;
    this.navBar = new NavBar({
        title: '',
        leftAction: NavAction.goBack,
        rightAction: NavAction.goHelpIndex
    });
    
    this.app = app;
    this.$activity = $activity;
    this.$datePicker = $activity.find('#datetimePickerDatePicker');
    this.$timePicker = $activity.find('#datetimePickerTimePicker');

    /* Init components */
    this.$datePicker.show().datepicker();
    
    var dataView = this.dataView = new ViewModel();
    dataView.headerText = 'Select a start time';
    ko.applyBindings(dataView, $activity.get(0));
    
    // Events
    this.$datePicker.on('changeDate', function(e) {
        if (e.viewMode === 'days') {
            dataView.selectedDate(e.date);
        }
    }.bind(this));
    
    // TestingData
    dataView.slotsData = require('../testdata/timeSlots').timeSlots;
 
    dataView.selectedDate.subscribe(function(date) {
        this.bindDateData(date);
    }.bind(this));

    this.bindDateData(new Date());
    
    // Object to hold the options passed on 'show' as a result
    // of a request from another activity
    this.requestInfo = null;
    
    // Handler to go back with the selected date-time when
    // that selection is done (could be to null)
    this.dataView.selectedDatetime.subscribe(function (datetime) {
        // We have a request
        if (this.requestInfo) {
            // Pass the selected datetime in the info
            this.requestInfo.selectedDatetime = this.dataView.selectedDatetime();
            // And go back
            this.app.shell.goBack(this.requestInfo);
            // Last, clear requestInfo
            this.requestInfo = null;
        }
    }.bind(this));
}

DatetimePickerActivity.prototype.show = function show(options) {
  
    options = options || {};
    this.requestInfo = options;
};

DatetimePickerActivity.prototype.bindDateData = function bindDateData(date) {

    var sdate = moment(date).format('YYYY-MM-DD');
    var slotsData = this.dataView.slotsData;

    if (slotsData.hasOwnProperty(sdate)) {
        this.dataView.slots(slotsData[sdate]);
    } else {
        this.dataView.slots(slotsData['default']);
    }
};

function ViewModel() {

    this.headerText = ko.observable('Select a time');
    this.selectedDate = ko.observable(new Date());
    this.slotsData = {};
    this.slots = ko.observableArray([]);
    this.groupedSlots = ko.computed(function(){
        /*
          before 12:00pm (noon) = morning
          afternoon: 12:00pm until 5:00pm
          evening: 5:00pm - 11:59pm
        */
        // Since slots must be for the same date,
        // to define the groups ranges use the first date
        var datePart = this.slots() && this.slots()[0] || new Date();
        var groups = [
            {
                group: 'Morning',
                slots: [],
                starts: new Time(datePart, 0, 0),
                ends: new Time(datePart, 12, 0)
            },
            {
                group: 'Afternoon',
                slots: [],
                starts: new Time(datePart, 12, 0),
                ends: new Time(datePart, 17, 0)
            },
            {
                group: 'Evening',
                slots: [],
                starts: new Time(datePart, 17, 0),
                ends: new Time(datePart, 24, 0)
            }
        ];
        var slots = this.slots().sort();
        slots.forEach(function(slot) {
            groups.forEach(function(group) {
                if (slot >= group.starts &&
                    slot < group.ends) {
                    group.slots.push(slot);
                }
            });
        });

        return groups;

    }, this);
    
    this.selectedDatetime = ko.observable(null);
    
    this.selectDatetime = function(selectedDatetime) {
        
        this.selectedDatetime(selectedDatetime);

    }.bind(this);

}

},{"../components/DatePicker":38,"../testdata/timeSlots":63,"../utils/Time":67,"../viewmodels/NavAction":88,"../viewmodels/NavBar":89,"knockout":false,"moment":false}],13:[function(require,module,exports){
/**
    Faqs activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function FaqsActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel();
    this.accessLevel = this.app.UserType.LoggedUser;
    
    this.navBar = Activity.createSubsectionNavBar('Talk to us');
    
    // TestingData
    setSomeTestingData(this.viewModel);
});

exports.init = A.init;

A.prototype.show = function show(state) {
    
    Activity.prototype.show.call(this, state);
    
    this.viewModel.searchText('');
};

var ko = require('knockout');

function ViewModel() {

    this.faqs = ko.observableArray([]);
    this.searchText = ko.observable('');
    
    this.filteredFaqs = ko.pureComputed(function() {
        var s = this.searchText().toLowerCase();
        return this.faqs().filter(function(v) {
            var n = v && v.title() || '';
            n += v && v.description() || '';
            n = n.toLowerCase();
            return n.indexOf(s) > -1;
        });
    }, this);
}

var Model = require('../models/Model');
function Faq(values) {
    
    Model(this);

    this.model.defProperties({
        id: 0,
        title: '',
        description: ''
    }, values);
}

/** TESTING DATA **/
function setSomeTestingData(viewModel) {
    
    var testdata = [
        new Faq({
            id: 1,
            title: 'How do I set up a marketplace profile?',
            description: 'Description about how I set up a marketplace profile'
        }),
        new Faq({
            id: 2,
            title: 'Another faq',
            description: 'Another description'
        })
    ];
    viewModel.faqs(testdata);
}

},{"../components/Activity":37,"../models/Model":51,"knockout":false}],14:[function(require,module,exports){
/**
    Feedback activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function FeedbackActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    
    this.navBar = Activity.createSectionNavBar('Talk to us');
});

exports.init = A.init;

},{"../components/Activity":37}],15:[function(require,module,exports){
/**
    FeedbackForm activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function FeedbackFormActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel();
    
    this.accessLevel = this.app.UserType.LoggedUser;
    
    this.navBar = Activity.createSubsectionNavBar('Talk to us');
});

exports.init = A.init;

var ko = require('knockout');
function ViewModel() {
    
    this.message = ko.observable('');
    this.becomeCollaborator = ko.observable(false);
    this.wasSent = ko.observable(false);

    var updateWasSent = function() {
        this.wasSent(false);
    }.bind(this);
    this.message.subscribe(updateWasSent);
    this.becomeCollaborator.subscribe(updateWasSent);
    
    this.send = function send() {
        // TODO: Send
        
        // Reset after being sent
        this.message('');
        this.becomeCollaborator(false);
        this.wasSent(true);

    }.bind(this);
}

},{"../components/Activity":37,"knockout":false}],16:[function(require,module,exports){
/**
    Home activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    NavBar = require('../viewmodels/NavBar'),
    NavAction = require('../viewmodels/NavAction');

var singleton = null;

exports.init = function initHome($activity, app) {

    if (singleton === null)
        singleton = new HomeActivity($activity, app);
    
    return singleton;
};

function HomeActivity($activity, app) {
    
    this.accessLevel = app.UserType.Customer;
    this.navBar = new NavBar({
        title: null, // null for logo
        leftAction: NavAction.menuNewItem,
        rightAction: NavAction.menuIn
    });

    this.$activity = $activity;
    this.app = app;
    this.$nextBooking = $activity.find('#homeNextBooking');
    this.$upcomingBookings = $activity.find('#homeUpcomingBookings');
    this.$inbox = $activity.find('#homeInbox');
    this.$performance = $activity.find('#homePerformance');
    this.$getMore = $activity.find('#homeGetMore');

    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));

    // TestingData
    setSomeTestingData(this.dataView);

    // Object to hold the options passed on 'show' as a result
    // of a request from another activity
    this.requestInfo = null;
}

HomeActivity.prototype.show = function show(options) {
 
    options = options || {};
    this.requestInfo = options;
    var v = this.dataView,
        appModel = this.app.model;
    
    // Update data
    appModel.getUpcomingBookings().then(function(upcoming) {

        if (upcoming.nextBookingID)
            appModel.getBooking(upcoming.nextBookingID).then(v.nextBooking);
        else
            v.nextBooking(null);

        v.upcomingBookings.today.quantity(upcoming.today.quantity);
        v.upcomingBookings.today.time(upcoming.today.time && new Date(upcoming.today.time));
        v.upcomingBookings.tomorrow.quantity(upcoming.tomorrow.quantity);
        v.upcomingBookings.tomorrow.time(upcoming.tomorrow.time && new Date(upcoming.tomorrow.time));
        v.upcomingBookings.nextWeek.quantity(upcoming.nextWeek.quantity);
        v.upcomingBookings.nextWeek.time(upcoming.nextWeek.time && new Date(upcoming.nextWeek.time));
    });
};

var UpcomingBookingsSummary = require('../models/UpcomingBookingsSummary'),
    MailFolder = require('../models/MailFolder'),
    PerformanceSummary = require('../models/PerformanceSummary'),
    GetMore = require('../models/GetMore');

function ViewModel() {

    this.upcomingBookings = new UpcomingBookingsSummary();

    // :Appointment
    this.nextBooking = ko.observable(null);
    
    this.inbox = new MailFolder({
        topNumber: 4
    });
    
    this.performance = new PerformanceSummary();
    
    this.getMore = new GetMore();
}

/** TESTING DATA **/
var Time = require('../utils/Time');

function setSomeTestingData(dataView) {
    
    dataView.inbox.messages(require('../testdata/messages').messages);
    
    dataView.performance.earnings.currentAmount(2400);
    dataView.performance.earnings.nextAmount(6200.54);
    dataView.performance.timeBooked.percent(0.93);
    
    dataView.getMore.model.updateWith({
        availability: true,
        payments: true,
        profile: true,
        coop: true
    });
}

},{"../models/GetMore":46,"../models/MailFolder":49,"../models/PerformanceSummary":52,"../models/UpcomingBookingsSummary":55,"../testdata/messages":61,"../utils/Time":67,"../viewmodels/NavAction":88,"../viewmodels/NavBar":89,"knockout":false}],17:[function(require,module,exports){
/**
    Inbox activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');

var A = Activity.extends(function InboxActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel();
    this.accessLevel = this.app.UserType.LoggedUser;
    
    this.navBar = Activity.createSectionNavBar('Inbox');
    
    //this.$inbox = $activity.find('#inboxList');
    
    // TestingData
    setSomeTestingData(this.viewModel);
});

exports.init = A.init;

var MailFolder = require('../models/MailFolder');

function ViewModel() {

    this.inbox = new MailFolder({
        topNumber: 20
    });
    
    this.searchText = ko.observable('');
}

/** TESTING DATA **/
function setSomeTestingData(dataView) {
    
    dataView.inbox.messages(require('../testdata/messages').messages);
}

},{"../components/Activity":37,"../models/MailFolder":49,"../testdata/messages":61,"knockout":false}],18:[function(require,module,exports){
/**
    Index activity
**/
'use strict';

var singleton = null,
    NavBar = require('../viewmodels/NavBar'),
    NavAction = require('../viewmodels/NavAction');

exports.init = function initIndex($activity, app) {

    if (singleton === null)
        singleton = new IndexActivity($activity, app);
    
    return singleton;
};

function IndexActivity($activity, app) {

    this.$activity = $activity;
    this.app = app;
    
    this.navBar = new NavBar({
        title: null, // null for logo
        leftAction: NavAction.goLogin,
        rightAction: NavAction.menuOut
    });
    
    // Any user can access this
    this.accessLevel = null;
}

IndexActivity.prototype.show = function show(options) {
    // It checks if the user is logged so then 
    // their 'logged index' is the dashboard not this
    // page that is focused on anonymous users
    if (!this.app.model.user().isAnonymous()) {
        this.app.goDashboard();
    }
};

},{"../viewmodels/NavAction":88,"../viewmodels/NavBar":89}],19:[function(require,module,exports){
/**
    Jobtitles activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function JobtitlesActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel();
    
    this.accessLevel = this.app.UserType.LoggedUser;
    
    this.navBar = Activity.createSubsectionNavBar('Scheduling');
});

exports.init = A.init;

function ViewModel() {
}

},{"../components/Activity":37}],20:[function(require,module,exports){
/**
    LearnMore activity
**/
'use strict';
var ko = require('knockout'),
    NavBar = require('../viewmodels/NavBar'),
    NavAction = require('../viewmodels/NavAction');

var singleton = null;

exports.init = function initLearnMore($activity, app) {

    if (singleton === null)
        singleton = new LearnMoreActivity($activity, app);
    
    return singleton;
};

function LearnMoreActivity($activity, app) {

    this.$activity = $activity;
    this.app = app;
    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));
    
    this.navBar = new NavBar({
        title: null, // null for logo
        leftAction: NavAction.goBack,
        rightAction: NavAction.menuOut
    });
}

LearnMoreActivity.prototype.show = function show(options) {

    if (options && options.route &&
        options.route.segments &&
        options.route.segments.length) {
        this.dataView.profile(options.route.segments[0]);
    }
};

function ViewModel() {
    this.profile = ko.observable('customer');
}
},{"../viewmodels/NavAction":88,"../viewmodels/NavBar":89,"knockout":false}],21:[function(require,module,exports){
/**
    LocationEdition activity
**/
'use strict';
var ko = require('knockout'),
    Location = require('../models/Location'),
    NavBar = require('../viewmodels/NavBar'),
    NavAction = require('../viewmodels/NavAction');

var singleton = null;

exports.init = function initLocationEdition($activity, app) {

    if (singleton === null)
        singleton = new LocationEditionActivity($activity, app);
    
    return singleton;
};

function LocationEditionActivity($activity, app) {
    
    this.accessLevel = app.UserType.Provider;

    this.$activity = $activity;
    this.app = app;
    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));
    
    this.navBar = new NavBar({
        title: '',
        leftAction: NavAction.goBack.model.clone({
            text: 'Locations'
        }),
        rightAction: NavAction.goHelpIndex
    });
}

LocationEditionActivity.prototype.show = function show(options) {
    //jshint maxcomplexity:10
    
    var id = 0,
        create = '';

    if (options) {
        if (options.locationID) {
            id = options.locationID;
        }
        else if (options.route && options.route.segments) {
            
            id = parseInt(options.route.segments[0]);
        }
        else if (options.create) {
            create = options.create;
        }
    }
    
    if (id) {
        // TODO
        // var location = this.app.model.getLocation(id)
        // NOTE testing data
        var locations = {
            '1': new Location({
                locationID: 1,
                name: 'Home',
                addressLine1: 'Here Street',
                city: 'San Francisco',
                postalCode: '90001',
                stateProvinceCode: 'CA',
                countryID: 1,
                isServiceRadius: true,
                isServiceLocation: false
            }),
            '2': new Location({
                locationID: 1,
                name: 'Workshop',
                addressLine1: 'Unknow Street',
                city: 'San Francisco',
                postalCode: '90001',
                stateProvinceCode: 'CA',
                countryID: 1,
                isServiceRadius: false,
                isServiceLocation: true
            })
        };
        var location = locations[id];
        if (location) {
            this.dataView.location(location);

            this.dataView.header('Edit Location');
        } else {
            this.dataView.location(null);
            this.dataView.header('Unknow location or was deleted');
        }
    }
    else {
        // New location
        this.dataView.location(new Location());
        
        switch (options.create) {
            case 'serviceRadius':
                this.dataView.location().isServiceRadius(true);
                this.dataView.header('Add a service radius');
                break;
            case 'serviceLocation':
                this.dataView.location().isServiceLocation(true);
                this.dataView.header('Add a service location');
                break;
            default:
                this.dataView.location().isServiceRadius(true);
                this.dataView.location().isServiceLocation(true);
                this.dataView.header('Add a location');
                break;
        }
    }
};

function ViewModel() {
    
    this.location = ko.observable(new Location());
    
    this.header = ko.observable('Edit Location');
    
    // TODO
    this.save = function() {};
    this.cancel = function() {};
}
},{"../models/Location":48,"../viewmodels/NavAction":88,"../viewmodels/NavBar":89,"knockout":false}],22:[function(require,module,exports){
/**
    locations activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    NavBar = require('../viewmodels/NavBar'),
    NavAction = require('../viewmodels/NavAction');
    
var singleton = null;

exports.init = function initLocations($activity, app) {

    if (singleton === null)
        singleton = new LocationsActivity($activity, app);
    
    return singleton;
};

function LocationsActivity($activity, app) {
    
    this.accessLevel = app.UserType.Provider;
    this.navBar = new NavBar({
        title: '',
        leftAction: NavAction.goBack.model.clone({
            isTitle: true
        }),
        rightAction: NavAction.goHelpIndex
    });

    this.app = app;
    this.$activity = $activity;
    this.$listView = $activity.find('#locationsListView');

    var dataView = this.dataView = new ViewModel(app);
    ko.applyBindings(dataView, $activity.get(0));

    // TestingData
    dataView.locations(require('../testdata/locations').locations);

    // Handler to update header based on a mode change:
    this.dataView.isSelectionMode.subscribe(function (itIs) {
        this.dataView.headerText(itIs ? 'Select or add a service location' : 'Locations');
        
        // Update navbar too
        // TODO: Can be other than 'scheduling', like marketplace profile or the job-title?
        this.navBar.leftAction().text(itIs ? 'Booking' : 'Scheduling');
        // Title must be empty
        this.navBar.title('');
        
        // TODO Replaced by a progress bar on booking creation
        // TODO Or leftAction().text(..) on booking edition (return to booking)
        // or coming from Jobtitle/schedule (return to schedule/job title)?
        
    }.bind(this));

    // Object to hold the options passed on 'show' as a result
    // of a request from another activity
    this.requestInfo = null;
    
    // Handler to go back with the selected location when 
    // selection mode goes off and requestInfo is for
    // 'select mode'
    this.dataView.isSelectionMode.subscribe(function (itIs) {
        // We have a request and
        // it requested to select a location
        // and selection mode goes off
        if (this.requestInfo &&
            this.requestInfo.selectLocation === true &&
            itIs === false) {
            
            // Pass the selected client in the info
            this.requestInfo.selectedLocation = this.dataView.selectedLocation();
            // And go back
            this.app.shell.goBack(this.requestInfo);
            // Last, clear requestInfo
            this.requestInfo = null;
        }
    }.bind(this));
}

LocationsActivity.prototype.show = function show(options) {
  
    options = options || {};
    this.requestInfo = options;

    if (options.selectLocation === true) {
        this.dataView.isSelectionMode(true);
        // preset:
        this.dataView.selectedLocation(options.selectedLocation);
    }
    else if (options.route && options.route.segments) {
        var id = options.route.segments[0];
        if (id) {
            if (id === 'new') {
                this.app.shell.go('locationEdition', {
                    create: options.route.segments[1] // 'serviceRadius', 'serviceLocation'
                });
            }
            else {
                this.app.shell.go('locationEdition', {
                    locationID: id
                });
            }
        }
    }
};

function ViewModel(app) {

    this.headerText = ko.observable('Locations');

    // Full list of locations
    this.locations = ko.observableArray([]);

    // Especial mode when instead of pick and edit we are just selecting
    // (when editing an appointment)
    this.isSelectionMode = ko.observable(false);

    this.selectedLocation = ko.observable(null);
    
    this.selectLocation = function(selectedLocation) {
        
        if (this.isSelectionMode() === true) {
            this.selectedLocation(selectedLocation);
            this.isSelectionMode(false);
        }
        else {
            app.shell.go('locationEdition', {
                locationID: selectedLocation.locationID()
            });
        }

    }.bind(this);
}

},{"../testdata/locations":60,"../viewmodels/NavAction":88,"../viewmodels/NavBar":89,"knockout":false}],23:[function(require,module,exports){
/**
    Login activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
  User = require('../models/User'),
    NavBar = require('../viewmodels/NavBar'),
    NavAction = require('../viewmodels/NavAction');

var singleton = null;

exports.init = function initLogin($activity, app) {

    if (singleton === null)
        singleton = new LoginActivity($activity, app);
    
    return singleton;
};

function LoginActivity($activity, app) {
    
    this.accessLevel = app.UserType.Anonymous;
    this.navBar = new NavBar({
        title: 'Log in',
        leftAction: NavAction.goBack,
        rightAction: NavAction.menuOut
    });

    this.$activity = $activity;
    this.app = app;
    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));
    
    // Perform log-in request when is requested by the form:
    this.dataView.isLogingIn.subscribe(function(v) {
        if (v === true) {
            
            // Perform loging
            
            // Notify state:
            var $btn = $activity.find('[type="submit"]');
            $btn.button('loading');
            
            // Clear previous error so makes clear we
            // are attempting
            this.dataView.loginError('');
        
            var ended = function ended() {
                this.dataView.isLogingIn(false);
                $btn.button('reset');
            }.bind(this);
            
            // After clean-up error (to force some view updates),
            // validate and abort on error
            // Manually checking error on each field
            if (this.dataView.username.error() ||
                this.dataView.password.error()) {
                this.dataView.loginError('Review your data');
                ended();
                return;
            }
            
            app.model.login(
                this.dataView.username(),
                this.dataView.password()
            ).then(function(loginData) {
                
                this.dataView.loginError('');
                ended();
                
                // Remove form data
                this.dataView.username('');
                this.dataView.password('');
                
                this.app.goDashboard();

            }.bind(this)).catch(function(err) {

                var msg = err && err.responseJSON && err.responseJSON.errorMessage ||
                    err && err.statusText ||
                    'Invalid username or password';

                this.dataView.loginError(msg);
                ended();
            }.bind(this));
        }
    }.bind(this));
    
    // Focus first bad field on error
    this.dataView.loginError.subscribe(function(err) {
        // Login is easy since we mark both unique fields
        // as error on loginError (its a general form error)
        var input = $activity.find(':input').get(0);
        if (err)
            input.focus();
        else
            input.blur();
    });
}

LoginActivity.prototype.show = function show(options) {
};

var FormCredentials = require('../viewmodels/FormCredentials');

function ViewModel() {

    var credentials = new FormCredentials();    
    this.username = credentials.username;
    this.password = credentials.password;

    this.loginError = ko.observable('');
    
    this.isLogingIn = ko.observable(false);
    
    this.performLogin = function performLogin() {

        this.isLogingIn(true);        
    }.bind(this);
}

},{"../models/User":56,"../viewmodels/FormCredentials":87,"../viewmodels/NavAction":88,"../viewmodels/NavBar":89,"knockout":false}],24:[function(require,module,exports){
/**
    Logout activity
**/
'use strict';

var singleton = null;

exports.init = function initLogout($activity, app) {

    if (singleton === null)
        singleton = new LogoutActivity($activity, app);
    
    return singleton;
};

function LogoutActivity($activity, app) {
    
    this.accessLevel = app.UserType.LoggedUser;

    this.$activity = $activity;
    this.app = app;
}

LogoutActivity.prototype.show = function show(options) {

    this.app.model.logout().then(function() {
        // Anonymous user again
        var newAnon = this.app.model.user().constructor.newAnonymous();
        this.app.model.user().model.updateWith(newAnon);

        // Go index
        this.app.shell.go('/');
        
    }.bind(this));
};

},{}],25:[function(require,module,exports){
/**
    OnboardingComplete activity
**/
'use strict';

var singleton = null;

exports.init = function initOnboardingComplete($activity, app) {

    if (singleton === null)
        singleton = new OnboardingCompleteActivity($activity, app);
    
    return singleton;
};

function OnboardingCompleteActivity($activity, app) {

    this.accessLevel = app.UserType.LoggedUser;
    
    this.$activity = $activity;
    this.app = app;
}

OnboardingCompleteActivity.prototype.show = function show(options) {

};

},{}],26:[function(require,module,exports){
/**
    OnboardingHome activity
**/
'use strict';

var singleton = null,
    NavBar = require('../viewmodels/NavBar'),
    NavAction = require('../viewmodels/NavAction');

exports.init = function initOnboardingHome($activity, app) {

    if (singleton === null)
        singleton = new OnboardingHomeActivity($activity, app);
    
    return singleton;
};

function OnboardingHomeActivity($activity, app) {

    this.accessLevel = app.UserType.LoggedUser;
    
    this.$activity = $activity;
    this.app = app;
    
    this.navBar = new NavBar({
        title: null, // null for Logo
        leftAction: NavAction.goLogout,
        rightAction: null
    });
}

OnboardingHomeActivity.prototype.show = function show(options) {

};

},{"../viewmodels/NavAction":88,"../viewmodels/NavBar":89}],27:[function(require,module,exports){
/**
    Onboarding Positions activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    NavBar = require('../viewmodels/NavBar'),
    NavAction = require('../viewmodels/NavAction');

var singleton = null;

exports.init = function initOnboardingPositions($activity, app) {

    if (singleton === null)
        singleton = new OnboardingPositionsActivity($activity, app);
    
    return singleton;
};

function OnboardingPositionsActivity($activity, app) {

    this.accessLevel = app.UserType.Provider;
    
    this.$activity = $activity;
    this.app = app;
    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));

    // TestingData
    setSomeTestingData(this.dataView);

    // Object to hold the options passed on 'show' as a result
    // of a request from another activity
    this.requestInfo = null;
    
    this.navBar = new NavBar({
        title: 'Job Titles',
        leftAction: NavAction.menuNewItem,
        rightAction: NavAction.menuIn
    });
}

OnboardingPositionsActivity.prototype.show = function show(options) {
 
    options = options || {};
    this.requestInfo = options;
};

function ViewModel() {

    // Full list of positions
    this.positions = ko.observableArray([]);
}

var Position = require('../models/Position');
// UserPosition model
function setSomeTestingData(dataview) {
    
    dataview.positions.push(new Position({
        positionSingular: 'Massage Therapist'
    }));
    dataview.positions.push(new Position({
        positionSingular: 'Housekeeper'
    }));
}
},{"../models/Position":53,"../viewmodels/NavAction":88,"../viewmodels/NavBar":89,"knockout":false}],28:[function(require,module,exports){
/**
    Scheduling activity
**/
'use strict';

var singleton = null,
    ko = require('knockout'),
    NavAction = require('../viewmodels/NavAction'),
    NavBar = require('../viewmodels/NavBar');

exports.init = function initScheduling($activity, app) {

    if (singleton === null)
        singleton = new SchedulingActivity($activity, app);
    
    return singleton;
};

function SchedulingActivity($activity, app) {
    
    this.accessLevel = app.UserType.LoggedUser;

    this.$activity = $activity;
    this.app = app;
    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));
    
    this.navBar = new NavBar({
        title: 'Scheduling',
        leftAction: NavAction.menuNewItem,
        rightAction: NavAction.menuIn
    });
}

SchedulingActivity.prototype.show = function show(options) {

};

function ViewModel() {

}

},{"../viewmodels/NavAction":88,"../viewmodels/NavBar":89,"knockout":false}],29:[function(require,module,exports){
/**
    services activity
**/
'use strict';

var Activity = require('../components/Activity');
var $ = require('jquery'),
    ko = require('knockout');
    
var singleton = null;

var A = Activity.extends(function ServicesActivity() {

    Activity.apply(this, arguments);
    
    this.accessLevel = this.app.UserType.Provider;
    
    // TODO: on show, need to be updated with the JobTitle name
    this.navBar = Activity.createSubsectionNavBar('Job title');
    
    //this.$listView = this.$activity.find('#servicesListView');

    this.viewModel = new ViewModel();

    // TestingData
    this.viewModel.services(require('../testdata/services').services.map(Selectable));
    
    // Handler to go back with the selected service when 
    // selection mode goes off and requestData is for
    // 'select mode'
    this.viewModel.isSelectionMode.subscribe(function (itIs) {
        // We have a request and
        // it requested to select a service
        // and selection mode goes off
        if (this.requestData &&
            this.requestData.selectServices === true &&
            itIs === false) {
            
            // Pass the selected client in the info
            this.requestData.selectedServices = this.viewModel.selectedServices();
            // And go back
            this.app.shell.goBack(this.requestData);
            // Last, clear requestData
            this.requestData = null;
        }
    }.bind(this));
});

exports.init = A.init;

A.prototype.show = function show(options) {

    Activity.prototype.show.call(this, options);
    
    // Get jobtitleID for the request
    var route = this.requestData.route;
    var jobTitleID = route && route.segments && route.segments[0];
    jobTitleID = parseInt(jobTitleID, 10);
    if (jobTitleID) {
        // TODO: get data for the Job title ID
        this.app.model.getUserJobTitle(jobTitleID).then(function(userJobtitle) {
            if (!userJobtitle) {
                console.log('No user job title');
                return;
            }
            // Load user data on this activity:
            this.viewModel.services(userJobtitle.services());
            // Fill in job title name
            this.app.model.getJobTitle(jobTitleID).then(function(jobTitle) {
                if (!jobTitle) {
                    console.log('No job title');
                    return;
                }
                this.navBar.leftAction().text(jobTitle.singularName());
            });
        });
    }

    if (this.requestData.selectServices === true) {
        this.viewModel.isSelectionMode(true);
        
        /* Trials to presets the selected services, NOT WORKING
        var services = (options.selectedServices || []);
        var selectedServices = this.viewModel.selectedServices;
        selectedServices.removeAll();
        this.viewModel.services().forEach(function(service) {
            services.forEach(function(selService) {
                if (selService === service) {
                    service.isSelected(true);
                    selectedServices.push(service);
                } else {
                    service.isSelected(false);
                }
            });
        });
        */
    }
};

function Selectable(obj) {
    obj.isSelected = ko.observable(false);
    return obj;
}

function ViewModel() {

    // Full list of services
    this.services = ko.observableArray([]);

    // Especial mode when instead of pick and edit we are just selecting
    // (when editing an appointment)
    this.isSelectionMode = ko.observable(false);

    // Grouped list of pricings:
    // Defined groups: regular services and add-ons
    this.groupedServices = ko.computed(function(){

        var services = this.services();
        var isSelection = this.isSelectionMode();

        var servicesGroup = {
                group: isSelection ? 'Select standalone services' : 'Standalone services',
                services: []
            },
            addonsGroup = {
                group: isSelection ? 'Select add-on services' : 'Add-on services',
                services: []
            },
            groups = [servicesGroup, addonsGroup];

        services.forEach(function(service) {
            
            var isAddon = service.isAddon();
            if (isAddon) {
                addonsGroup.services.push(service);
            }
            else {
                servicesGroup.services.push(service);
            }
        });

        return groups;

    }, this);
    
    this.selectedServices = ko.observableArray([]);
    /**
        Toggle the selection status of a service, adding
        or removing it from the 'selectedServices' array.
    **/
    this.toggleServiceSelection = function(service) {
        
        var inIndex = -1,
            isSelected = this.selectedServices().some(function(selectedService, index) {
            if (selectedService === service) {
                inIndex = index;
                return true;
            }
        });
        
        service.isSelected(!isSelected);

        if (isSelected)
            this.selectedServices.splice(inIndex, 1);
        else
            this.selectedServices.push(service);

    }.bind(this);
    
    /**
        Ends the selection process, ready to collect selection
        and passing it to the request activity
    **/
    this.endSelection = function() {
        
        this.isSelectionMode(false);
        
    }.bind(this);
}

},{"../components/Activity":37,"../testdata/services":62,"knockout":false}],30:[function(require,module,exports){
/**
    Signup activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    NavBar = require('../viewmodels/NavBar'),
    NavAction = require('../viewmodels/NavAction');

var singleton = null;

exports.init = function initSignup($activity, app) {

    if (singleton === null)
        singleton = new SignupActivity($activity, app);
    
    return singleton;
};

function SignupActivity($activity, app) {

    this.accessLevel = app.UserType.Anonymous;
    
    this.$activity = $activity;
    this.app = app;
    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));
    
    this.navBar = new NavBar({
        title: null, // null for Logo
        leftAction: null,
        rightAction: NavAction.menuOut
    });
    
    // Perform sign-up request when is requested by the form:
    this.dataView.isSigningUp.subscribe(function(v) {
        if (v === true) {
            
            // Perform signup
            
            // Notify state:
            var $btn = $activity.find('[type="submit"]');
            $btn.button('loading');
            
            // Clear previous error so makes clear we
            // are attempting
            this.dataView.signupError('');
        
            var ended = function ended() {
                this.dataView.isSigningUp(false);
                $btn.button('reset');
            }.bind(this);
            
            // After clean-up error (to force some view updates),
            // validate and abort on error
            // Manually checking error on each field
            if (this.dataView.username.error() ||
                this.dataView.password.error()) {
                this.dataView.signupError('Review your data');
                ended();
                return;
            }
            
            app.model.signup(
                this.dataView.username(),
                this.dataView.password(),
                this.dataView.profile()
            ).then(function(signupData) {
                
                this.dataView.signupError('');
                ended();
                
                // Remove form data
                this.dataView.username('');
                this.dataView.password('');
                
                this.app.goDashboard();

            }.bind(this)).catch(function(err) {
                
                var msg = err && err.responseJSON && err.responseJSON.errorMessage ||
                    err && err.statusText ||
                    'Invalid username or password';

                this.dataView.signupError(msg);
                ended();
            }.bind(this));
        }
    }.bind(this));
    
    // Focus first bad field on error
    this.dataView.signupError.subscribe(function(err) {
        // Signup is easy since we mark both unique fields
        // as error on signupError (its a general form error)
        var input = $activity.find(':input').get(0);
        if (err)
            input.focus();
        else
            input.blur();
    });
}

SignupActivity.prototype.show = function show(options) {

    if (options && options.route &&
        options.route.segments &&
        options.route.segments.length) {
        this.dataView.profile(options.route.segments[0]);
    }
};
var FormCredentials = require('../viewmodels/FormCredentials');

function ViewModel() {

    var credentials = new FormCredentials();    
    this.username = credentials.username;
    this.password = credentials.password;

    this.signupError = ko.observable('');
    
    this.isSigningUp = ko.observable(false);
    
    this.performSignup = function performSignup() {

        this.isSigningUp(true);
    }.bind(this);

    this.profile = ko.observable('customer');
}

},{"../viewmodels/FormCredentials":87,"../viewmodels/NavAction":88,"../viewmodels/NavBar":89,"knockout":false}],31:[function(require,module,exports){
/**
    textEditor activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    EventEmitter = require('events').EventEmitter,
    NavBar = require('../viewmodels/NavBar'),
    NavAction = require('../viewmodels/NavAction');
    
var singleton = null;

exports.init = function initTextEditor($activity, app) {
    
    if (singleton === null)
        singleton = new TextEditorActivity($activity, app);
    
    return singleton;
};

function TextEditorActivity($activity, app) {

    this.navBar = new NavBar({
        // Title is empty ever, since we are in 'go back' mode all the time here
        title: '',
        // but leftAction.text is updated on 'show' with passed value,
        // so we need a clone to not modify the shared static instance
        leftAction: NavAction.goBack.model.clone({ isTitle: true }),
        rightAction: NavAction.goHelpIndex
    });
    
    // Fields
    this.$activity = $activity;
    this.app = app;
    this.$textarea = this.$activity.find('textarea');
    this.textarea = this.$textarea.get(0);

    // Data
    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));
    
    // Object to hold the options passed on 'show' as a result
    // of a request from another activity
    this.requestInfo = null;
    
    // Handlers
    // Handler for the 'saved' event so the activity
    // returns back to the requester activity giving it
    // the new text
    this.dataView.on('saved', function() {
        if (this.requestInfo) {
            // Update the info with the new text
            this.requestInfo.text = this.dataView.text();
        }

        // and pass it back
        this.app.shell.goBack(this.requestInfo);
    }.bind(this));
 
    // Handler the cancel event
    this.dataView.on('cancel', function() {
        // return, nothing changed
        app.shell.goBack();
    }.bind(this));
}

TextEditorActivity.prototype.show = function show(options) {
    
    options = options || {};
    this.requestInfo = options;

    // Set navigation title or nothing
    this.navBar.leftAction().text(options.title || '');
    
    // Field header
    this.dataView.headerText(options.header);
    this.dataView.text(options.text);
    if (options.rowsNumber)
        this.dataView.rowsNumber(options.rowsNumber);
        
    // Inmediate focus to the textarea for better usability
    this.textarea.focus();
    this.$textarea.click();
};

function ViewModel() {

    this.headerText = ko.observable('Text');

    // Text to edit
    this.text = ko.observable('');
    
    // Number of rows for the textarea
    this.rowsNumber = ko.observable(2);

    this.cancel = function cancel() {
        this.emit('cancel');
    };
    
    this.save = function save() {
        this.emit('saved');
    };
}

ViewModel._inherits(EventEmitter);

},{"../viewmodels/NavAction":88,"../viewmodels/NavBar":89,"events":false,"knockout":false}],32:[function(require,module,exports){
/**
    Registration of custom html components used by the App.
    All with 'app-' as prefix.
    
    Some definitions may be included on-line rather than on separated
    files (viewmodels), templates are linked so need to be 
    included in the html file with the same ID that referenced here,
    usually using as DOM ID the same name as the component with sufix '-template'.
**/
'use strict';

var ko = require('knockout');
var propTools = require('./utils/jsPropertiesTools');

function getObservable(obsOrValue) {
    if (typeof(obsOrValue) === 'function')
        return obsOrValue;
    else
        return ko.observable(obsOrValue);
}

exports.registerAll = function() {
    
    /// navbar-action
    ko.components.register('app-navbar-action', {
        template: { element: 'navbar-action-template' },
        viewModel: function(params) {

            propTools.defineGetter(this, 'action', function() {
                return (
                    params.action && params.navBar() ?
                    params.navBar()[params.action]() :
                    null
                );
            });
        }
    });
    
    /// unlabeled-input
    ko.components.register('app-unlabeled-input', {
        template: { element: 'unlabeled-input-template' },
        viewModel: function(params) {

            this.value = getObservable(params.value);
            this.placeholder = getObservable(params.placeholder);
        }
    });
    
    /// feedback-entry
    ko.components.register('app-feedback-entry', {
        template: { element: 'feedback-entry-template' },
        viewModel: function(params) {

            this.section = getObservable(params.section || '');
            this.url = ko.pureComputed(function() {
                return '/feedback/' + this.section();
            }, this);
        }
    });
};

},{"./utils/jsPropertiesTools":74,"knockout":false}],33:[function(require,module,exports){
/**
    Navbar extension of the App,
    adds the elements to manage a view model
    for the NavBar and automatic changes
    under some model changes like user login/logout
**/
'use strict';

var ko = require('knockout'),
    $ = require('jquery'),
    NavBar = require('./viewmodels/NavBar'),
    NavAction = require('./viewmodels/NavAction');

exports.extends = function (app) {
    
    // REVIEW: still needed? Maybe the per activity navBar means
    // this is not needed. Some previous logic was already removed
    // because was useless.
    //
    // Adjust the navbar setup depending on current user,
    // since different things are need for logged-in/out.
    function adjustUserBar() {

        var user = app.model.user();

        if (user.isAnonymous()) {
            app.navBar().rightAction(NavAction.menuOut);
        }
    }
    // Commented lines, used previously but unused now, it must be enough with the update
    // per activity change
    //app.model.user().isAnonymous.subscribe(updateStatesOnUserChange);
    //app.model.user().onboardingStep.subscribe(updateStatesOnUserChange);
    
    app.navBar = ko.observable(null);
    
    var refreshNav = function refreshNav() {
        // Trigger event to force a component update
        $('.AppNav').trigger('contentChange');
    };
    var autoRefreshNav = function autoRefreshNav(action) {
        if (action) {
            action.text.subscribe(refreshNav);
            action.isTitle.subscribe(refreshNav);
            action.icon.subscribe(refreshNav);
            action.isMenu.subscribe(refreshNav);
        }
    };

    /**
        Update the nav model using the Activity defaults
    **/
    app.updateAppNav = function updateAppNav(activity) {

        // if the activity has its own
        if ('navBar' in activity) {
            // Use specializied activity bar data
            app.navBar(activity.navBar);
        }
        else {
            // Use default one
            app.navBar(new NavBar());
        }

        // TODO Double check if needed.
        // Latest changes, when needed
        adjustUserBar();
        
        refreshNav();
        autoRefreshNav(app.navBar().leftAction());
        autoRefreshNav(app.navBar().rightAction());
    };
    
    
    /**
        Update the app menu to highlight the
        given link name
    **/
    app.updateMenu = function updateMenu(name) {
        
        var $menu = $('.App-menus .navbar-collapse');
        
        // Remove any active
        $menu
        .find('li')
        .removeClass('active');
        // Add active
        $menu
        .find('.go-' + name)
        .closest('li')
        .addClass('active');
        // Hide menu
        $menu
        .filter(':visible')
        .collapse('hide');
    };
};

},{"./viewmodels/NavAction":88,"./viewmodels/NavBar":89,"knockout":false}],34:[function(require,module,exports){
/**
    List of activities loaded in the App,
    as an object with the activity name as the key
    and the controller as value.
**/
'use strict';

module.exports = {
    'calendar': require('./activities/calendar'),
    'datetimePicker': require('./activities/datetimePicker'),
    'clients': require('./activities/clients'),
    'services': require('./activities/services'),
    'locations': require('./activities/locations'),
    'textEditor': require('./activities/textEditor'),
    'home': require('./activities/home'),
    'appointment': require('./activities/appointment'),
    'bookingConfirmation': require('./activities/bookingConfirmation'),
    'index': require('./activities/index'),
    'login': require('./activities/login'),
    'logout': require('./activities/logout'),
    'learnMore': require('./activities/learnMore'),
    'signup': require('./activities/signup'),
    'contactInfo': require('./activities/contactInfo'),
    'onboardingPositions': require('./activities/onboardingPositions'),
    'onboardingHome': require('./activities/onboardingHome'),
    'locationEdition': require('./activities/locationEdition'),
    'onboardingComplete': require('./activities/onboardingComplete'),
    'account': require('./activities/account'),
    'inbox': require('./activities/inbox'),
    'conversation': require('./activities/conversation'),
    'scheduling': require('./activities/scheduling'),
    'jobtitles': require('./activities/jobtitles'),
    'feedback': require('./activities/feedback'),
    'faqs': require('./activities/faqs'),
    'feedbackForm': require('./activities/feedbackForm'),
    'contactForm': require('./activities/contactForm'),
    'cms': require('./activities/cms'),
    'clientEdition': require('./activities/clientEdition')
};

},{"./activities/account":2,"./activities/appointment":3,"./activities/bookingConfirmation":4,"./activities/calendar":5,"./activities/clientEdition":6,"./activities/clients":7,"./activities/cms":8,"./activities/contactForm":9,"./activities/contactInfo":10,"./activities/conversation":11,"./activities/datetimePicker":12,"./activities/faqs":13,"./activities/feedback":14,"./activities/feedbackForm":15,"./activities/home":16,"./activities/inbox":17,"./activities/index":18,"./activities/jobtitles":19,"./activities/learnMore":20,"./activities/locationEdition":21,"./activities/locations":22,"./activities/login":23,"./activities/logout":24,"./activities/onboardingComplete":25,"./activities/onboardingHome":26,"./activities/onboardingPositions":27,"./activities/scheduling":28,"./activities/services":29,"./activities/signup":30,"./activities/textEditor":31}],35:[function(require,module,exports){
'use strict';

/** Global dependencies **/
var $ = require('jquery');
require('jquery-mobile');
var ko = require('knockout');
ko.bindingHandlers.format = require('ko/formatBinding').formatBinding;
var bootknock = require('./utils/bootknockBindingHelpers');
require('./utils/Function.prototype._inherits');
require('./utils/Function.prototype._delayed');
// Promise polyfill, so its not 'require'd per module:
require('es6-promise').polyfill();

var layoutUpdateEvent = require('layoutUpdateEvent');
var NavBar = require('./viewmodels/NavBar'),
    NavAction = require('./viewmodels/NavAction'),
    AppModel = require('./viewmodels/AppModel');

// Register the special locale
require('./locales/en-US-LC');

/**
    A set of fixes/workarounds for Bootstrap behavior/plugins
    to be executed before Bootstrap is included/executed.
    For example, because of data-binding removing/creating elements,
    some old references to removed items may get alive and need update,
    or re-enabling some behaviors.
**/
function preBootstrapWorkarounds() {
    // Internal Bootstrap source utility
    function getTargetFromTrigger($trigger) {
        var href,
            target = $trigger.attr('data-target') ||
            (href = $trigger.attr('href')) && 
            href.replace(/.*(?=#[^\s]+$)/, ''); // strip for ie7

        return $(target);
    }
    
    // Bug: navbar-collapse elements hold a reference to their original
    // $trigger, but that trigger can change on different 'clicks' or
    // get removed the original, so it must reference the new one
    // (the latests clicked, and not the cached one under the 'data' API).    
    // NOTE: handler must execute before the Bootstrap handler for the same
    // event in order to work.
    $(document).on('click.bs.collapse.data-api.workaround', '[data-toggle="collapse"]', function(e) {
        var $t = $(this),
            $target = getTargetFromTrigger($t),
            data = $target && $target.data('bs.collapse');
        
        // If any
        if (data) {
            // Replace the trigger in the data reference:
            data.$trigger = $t;
        }
        // On else, nothing to do, a new Collapse instance will be created
        // with the correct target, the first time
    });
}

/**
    App static class
**/
var app = {
    shell: require('./app.shell'),
    
    // New app model, that starts with anonymous user
    model: new AppModel(),
    
    /** Load activities controllers (not initialized) **/
    activities: require('./app.activities'),
    
    /**
        Just redirect the better place for current user and state.
        NOTE: Its a delayed function, since on many contexts need to
        wait for the current 'routing' from end before do the new
        history change.
        TODO: Maybe, rather than delay it, can stop current routing
        (changes on Shell required) and perform the new.
        TODO: Maybe alternative to previous, to provide a 'replace'
        in shell rather than a go, to avoid append redirect entries
        in the history, that create the problem of 'broken back button'
    **/
    goDashboard: function goDashboard() {
        
        // To avoid infinite loops if we already are performing 
        // a goDashboard task, we flag the execution
        // being care of the delay introduced in the execution
        if (goDashboard._going === true) {
            return;
        }
        else {
            // Delayed to avoid collisions with in-the-middle
            // tasks: just allowing current routing to finish
            // before perform the 'redirect'
            // TODO: change by a real redirect that is able to
            // cancel the current app.shell routing process.
            setTimeout(function() {
        
                goDashboard._going = true;

                var onboarding = this.model.user().onboardingStep();

                if (onboarding) {
                    this.shell.go('onboardingHome/' + onboarding);
                }
                else {
                    this.shell.go('home');
                }

                // Just because is delayed, needs
                // to be set off after an inmediate to 
                // ensure is set off after any other attempt
                // to add a delayed goDashboard:
                setTimeout(function() {
                    goDashboard._going = false;
                }, 1);
            }.bind(this), 1);
        }
    }
};

/** Continue app creation with things that need a reference to the app **/

require('./app-navbar').extends(app);

require('./app-components').registerAll();

app.getActivity = function getActivity(name) {
    var activity = this.activities[name];
    if (activity) {
        var $act = this.shell.items.find(name);
        if ($act && $act.length)
            return activity.init($act, this);
    }
    return null;
};

app.getActivityControllerByRoute = function getActivityControllerByRoute(route) {
    // From the route object, the important piece is route.name
    // that contains the activity name except if is the root
    var actName = route.name || this.shell.indexName;
    
    return this.getActivity(actName);
};

// accessControl setup: cannot be specified on Shell creation because
// depends on the app instance
app.shell.accessControl = require('./utils/accessControl')(app);

// Shortcut to UserType enumeration used to set permissions
app.UserType = app.model.user().constructor.UserType;

/** App Init **/
var appInit = function appInit() {
    /*jshint maxstatements:50,maxcomplexity:16 */
    
    // Enabling the 'layoutUpdate' jQuery Window event that happens on resize and transitionend,
    // and can be triggered manually by any script to notify changes on layout that
    // may require adjustments on other scripts that listen to it.
    // The event is throttle, guaranting that the minor handlers are executed rather
    // than a lot of them in short time frames (as happen with 'resize' events).
    layoutUpdateEvent.layoutUpdateEvent += ' orientationchange';
    layoutUpdateEvent.on();
    
    // Keyboard plugin events are not compatible with jQuery events, but needed to
    // trigger a layoutUpdate, so here are connected, mainly fixing bugs on iOS when the keyboard
    // is hidding.
    var trigLayout = function trigLayout(event) {
        $(window).trigger('layoutUpdate');
    };
    window.addEventListener('native.keyboardshow', trigLayout);
    window.addEventListener('native.keyboardhide', trigLayout);

    // iOS-7+ status bar fix. Apply on plugin loaded (cordova/phonegap environment)
    // and in any system, so any other systems fix its solved too if needed 
    // just updating the plugin (future proof) and ensure homogeneous cross plaftform behavior.
    if (window.StatusBar) {
        // Fix iOS-7+ overlay problem
        // Is in config.xml too, but seems not to work without next call:
        window.StatusBar.overlaysWebView(false);
    }

    var iOsWebview = false;
    if (window.device && 
        /iOS|iPad|iPhone|iPod/i.test(window.device.platform)) {
        iOsWebview = true;
    }
    
    // NOTE: Safari iOS bug workaround, min-height/height on html doesn't work as expected,
    // getting bigger than viewport.
    var iOS = /(iPad|iPhone|iPod)/g.test( navigator.userAgent );
    if (iOS) {
        var getHeight = function getHeight() {
            return window.innerHeight;
            // In case of enable transparent/overlay StatusBar:
            // (window.innerHeight - (iOsWebview ? 20 : 0))
        };
        
        $('html').height(getHeight() + 'px');        
        $(window).on('layoutUpdate', function() {
            $('html').height(getHeight() + 'px');
        });
    }

    // Because of the iOS7+8 bugs with height calculation,
    // a different way of apply content height to fill all the available height (as minimum)
    // is required.
    // For that, the 'full-height' class was added, to be used in elements inside the 
    // activity that needs all the available height, here the calculation is applied for
    // all platforms for this homogeneous approach to solve the problemm.
    (function() {
        var $b = $('body');
        var fullHeight = function fullHeight() {
            var h = $b.height();
            $('.full-height')
            // Let browser to compute
            .css('height', 'auto')
            // As minimum
            .css('min-height', h)
            // Set explicit the automatic computed height
            .css('height', function() {
                // we use box-sizing:border-box, so needs to be outerHeight without margin:
                return $(this).outerHeight(false);
            })
            ;
        };
        
        fullHeight();
        $(window).on('layoutUpdate', function() {
            fullHeight();
        });
    })();
    
    // Force an update delayed to ensure update after some things did additional work
    setTimeout(function() {
        $(window).trigger('layoutUpdate');
    }, 200);
    
    // Bootstrap
    preBootstrapWorkarounds();
    require('bootstrap');
    
    // Load Knockout binding helpers
    bootknock.plugIn(ko);
    
    // Plugins setup
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        window.cordova.plugins.Keyboard.disableScroll(true);
    }
    
    // Easy links to shell actions, like goBack, in html elements
    // Example: <button data-shell="goBack 2">Go 2 times back</button>
    // NOTE: Important, registered before the shell.run to be executed
    // before its 'catch all links' handler
    $(document).on('tap', '[data-shell]', function(e) {
        // Using attr rather than the 'data' API to get updated
        // DOM values
        var cmdline = $(this).attr('data-shell') || '',
            args = cmdline.split(' '),
            cmd = args[0];

        if (cmd && typeof(app.shell[cmd]) === 'function') {
            app.shell[cmd].apply(app.shell, args.slice(1));
            
            // Cancel any other action on the link, to avoid double linking results
            e.stopImmediatePropagation();
            e.preventDefault();
        }
    });
    
    // On Cordova/Phonegap app, special targets must be called using the window.open
    // API to ensure is correctly opened on the InAppBrowser (_blank) or system default
    // browser (_system).
    if (window.cordova) {
        $(document).on('tap', '[target="_blank"], [target="_system"]', function(e) {
            window.open(this.getAttribute('href'), this.getAttribute('target'));
            e.preventDefault();
        });
    }
    
    // When an activity is ready in the Shell:
    app.shell.on(app.shell.events.itemReady, function($act, state) {
        
        // Connect the 'activities' controllers to their views
        // Get initialized activity for the DOM element
        var actName = $act.data('activity');
        var activity = app.getActivity(actName);
        // Trigger the 'show' logic of the activity controller:
        activity.show(state);

        // Update menu
        var menuItem = activity.menuItem || actName;
        app.updateMenu(menuItem);
        
        // Update app navigation
        app.updateAppNav(activity);
    });
    
    // Set model for the AppNav
    ko.applyBindings({
        navBar: app.navBar
    }, $('.AppNav').get(0));
    
    var SmartNavBar = require('./components/SmartNavBar');
    var navBars = SmartNavBar.getAll();
    // Creates an event by listening to it, so other scripts can trigger
    // a 'contentChange' event to force a refresh of the navbar (to 
    // calculate and apply a new size); expected from dynamic navbars
    // that change it content based on observables.
    navBars.forEach(function(navbar) {
        $(navbar.el).on('contentChange', function() {
            navbar.refresh();
        });
    });
    
    // Listen for menu events (collapse in SmartNavBar)
    // to apply the backdrop
    var togglingBackdrop = false;
    $(document).on('show.bs.collapse hide.bs.collapse', '.AppNav .navbar-collapse', function(e) {
        if (!togglingBackdrop) {
            togglingBackdrop = true;
            var enabled = e.type === 'show';
            $('body').toggleClass('use-backdrop', enabled);
            // Hide any other opened collapse
            $('.collapsing, .collapse.in').collapse('hide');
            togglingBackdrop = false;
        }
    });

    // App init:
    var alertError = function(err) {
        window.alert('There was an error loading: ' + err && err.message || err);
    };

    app.model.init()
    .then(app.shell.run.bind(app.shell), alertError)
    .then(function() {
        // Mark the page as ready
        $('html').addClass('is-ready');
        // As app, hides splash screen
        if (window.navigator && window.navigator.splashscreen) {
            window.navigator.splashscreen.hide();
        }
    }, alertError);

    // DEBUG
    window.app = app;
};

// App init on page ready and phonegap ready
if (window.cordova) {
    // On DOM-Ready first
    $(function() {
        // Page is ready, device is too?
        // Note: Cordova ensures to call the handler even if the
        // event was already fired, so is good to do it inside
        // the dom-ready and we are ensuring that everything is
        // ready.
        $(document).on('deviceready', appInit);
    });
} else {
    // Only on DOM-Ready, for in browser development
    $(appInit);
}
},{"./app-components":32,"./app-navbar":33,"./app.activities":34,"./app.shell":36,"./components/SmartNavBar":39,"./locales/en-US-LC":40,"./utils/Function.prototype._delayed":64,"./utils/Function.prototype._inherits":65,"./utils/accessControl":68,"./utils/bootknockBindingHelpers":70,"./viewmodels/AppModel":86,"./viewmodels/NavAction":88,"./viewmodels/NavBar":89,"es6-promise":false,"knockout":false}],36:[function(require,module,exports){
/**
    Setup of the shell object used by the app
**/
'use strict';

var baseUrl = window.location.pathname;

//var History = require('./app-shell-history').create(baseUrl);
var History = require('./utils/shell/hashbangHistory');

// Shell dependencies
var shell = require('./utils/shell/index'),
    Shell = shell.Shell,
    DomItemsManager = shell.DomItemsManager;

var iOS = /(iPad|iPhone|iPod)/g.test( navigator.userAgent );

// Creating the shell:
var shell = new Shell({

    // Selector, DOM element or jQuery object pointing
    // the root or container for the shell items
    root: 'body',

    // If is not in the site root, the base URL is required:
    baseUrl: baseUrl,
    
    forceHashbang: true,

    indexName: 'index',

    // WORKAROUND: Using the 'tap' event for faster mobile experience
    // (from jquery-mobile event) on iOS devices, but left
    // 'click' on others since they has not the slow-click problem
    // thanks to the meta-viewport.
    // WORKAROUND: IMPORTANT, using 'click' rather than 'tap' on Android
    // prevents an app crash (or go out and page not found on Chrome for Android)
    // because of some 'clicks' happening on
    // a half-link-element tap, where the 'tap' event detects as target the non-link and the
    // link gets executed anyway by the browser, not catched so Webview moves to 
    // a non existant file (and thats make PhoneGap to crash).
    linkEvent: iOS ? 'tap' : 'click',

    // No need for loader, everything comes bundled
    loader: null,

    // History Polyfill:
    history: History,

    // A DomItemsManager or equivalent object instance needs to
    // be provided:
    domItemsManager: new DomItemsManager({
        idAttributeName: 'data-activity'
    })
});

// Catch errors on item/page loading, showing..
shell.on('error', function(err) {
    
    var str = 'Unknow error';
    if (err) {
        if (typeof(err) === 'string') {
            str = err;
        }
        else if (err.message) {
            str = err.message;
        }
        else {
            str = JSON.stringify(err);
        }
    }

    // TODO change with a dialog or something
    window.alert(str);
});

module.exports = shell;

},{"./utils/shell/hashbangHistory":79,"./utils/shell/index":80}],37:[function(require,module,exports){
/**
    Activity base class
**/
'use strict';

var ko = require('knockout'),
    NavAction = require('../viewmodels/NavAction'),
    NavBar = require('../viewmodels/NavBar');

require('../utils/Function.prototype._inherits');

/**
    Activity class definition
**/
function Activity($activity, app) {

    this.$activity = $activity;
    this.app = app;

    // Default access level: anyone
    this.accessLevel = app.UserType.None;
    
    // TODO: Future use of a viewState, plain object representation
    // of part of the viewModel to be used as the state passed to the
    // history and between activities calls.
    this.viewState = {};
    
    // Object to hold the options passed on 'show' as a result
    // of a request from another activity
    this.requestData = null;

    // Default navBar object.
    this.navBar = new NavBar({
        title: null, // null for logo
        leftAction: null,
        rightAction: null
    });
    
    // Delayed bindings to allow for further constructor set-up 
    // on subclasses.
    setTimeout(function ActivityConstructorDelayed() {
        // A view model and bindings being applied is ever required
        // even on Activities without need for a view model, since
        // the use of components and templates, or any other data-bind
        // syntax, requires to be in a context with binding enabled:
        ko.applyBindings(this.viewModel || {}, $activity.get(0));
    }.bind(this), 1);
}

module.exports = Activity;

/**
    Set-up visualization of the view with the given options/state,
    with a reset of current state.
    Must be executed every time the activity is put in the current view.
**/
Activity.prototype.show = function show(options) {
    // TODO: must keep viewState up to date using options/state.
    
    options = options || {};
    this.requestData = options;
};

/**
    Static utilities
**/
// For commodity, common classes are exposed as static properties
Activity.NavBar = NavBar;
Activity.NavAction = NavAction;

// Quick creation of common types of NavBar
Activity.createSectionNavBar = function createSectionNavBar(title) {
    return new NavBar({
        title: title,
        leftAction: NavAction.menuNewItem,
        rightAction: NavAction.menuIn
    });
};

Activity.createSubsectionNavBar = function createSubsectionNavBar(title, options) {
    
    options = options || {};
    
    var goBackOptions = {
        text: title,
        isTitle: true
    };

    if (options.backLink) {
        goBackOptions.link = options.backLink;
        goBackOptions.isShell = false;
    }

    return new NavBar({
        title: '', // No title
        leftAction: NavAction.goBack.model.clone(goBackOptions),
        rightAction: options.helpId ?
            NavAction.goHelpIndex :
            NavAction.goHelpIndex.model.clone({
                link: '#' + options.helpId
            })
    });
};

/**
    Singleton helper
**/
var createSingleton = function createSingleton(ActivityClass, $activity, app) {
    
    createSingleton.instances = createSingleton.instances || {};
    
    if (createSingleton.instances[ActivityClass.name] instanceof ActivityClass) {
        return createSingleton.instances[ActivityClass.name];
    }
    else {
        var s = new ActivityClass($activity, app);
        createSingleton.instances[ActivityClass.name] = s;
        return s;
    }
};
// Example of use
//exports.init = createSingleton.bind(null, ActivityClass);

/**
    Static method extends to help inheritance.
    Additionally, it adds a static init method ready for the new class
    that generates/retrieves the singleton.
**/
Activity.extends = function extendsActivity(ClassFn) {
    
    ClassFn._inherits(Activity);
    
    ClassFn.init = createSingleton.bind(null, ClassFn);
    
    return ClassFn;
};

},{"../utils/Function.prototype._inherits":65,"../viewmodels/NavAction":88,"../viewmodels/NavBar":89,"knockout":false}],38:[function(require,module,exports){
/* =========================================================
 * DatePicker JS Component, with several
 * modes and optional inline-permanent visualization.
 *
 * Copyright 2014 Loconomics Coop.
 *
 * Based on:
 * bootstrap-datepicker.js 
 * http://www.eyecon.ro/bootstrap-datepicker
 * =========================================================
 * Copyright 2012 Stefan Petre
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */

var $ = require('jquery'); 

var classes = {
    component: 'DatePicker',
    months: 'DatePicker-months',
    days: 'DatePicker-days',
    monthDay: 'day',
    month: 'month',
    year: 'year',
    years: 'DatePicker-years'
};

// Picker object
var DatePicker = function(element, options) {
    /*jshint maxstatements:32,maxcomplexity:24*/
    this.element = $(element);
    this.format = DPGlobal.parseFormat(options.format||this.element.data('date-format')||'mm/dd/yyyy');
    
    this.isInput = this.element.is('input');
    this.component = this.element.is('.date') ? this.element.find('.add-on') : false;
    this.isPlaceholder = this.element.is('.calendar-placeholder');
    
    this.picker = $(DPGlobal.template)
                        .appendTo(this.isPlaceholder ? this.element : 'body')
                        .on('click tap', $.proxy(this.click, this));
    // TODO: to review if 'container' class can be avoided, so in placeholder mode gets optional
    // if is wanted can be placed on the placeholder element (or container-fluid or nothing)
    this.picker.addClass(this.isPlaceholder ? 'container' : 'dropdown-menu');
    
    if (this.isPlaceholder) {
        this.picker.show();
        if (this.element.data('date') == 'today') {
            this.date = new Date();
            this.set();
        }
        this.element.trigger({
            type: 'show',
            date: this.date
        });
    }
    else if (this.isInput) {
        this.element.on({
            focus: $.proxy(this.show, this),
            //blur: $.proxy(this.hide, this),
            keyup: $.proxy(this.update, this)
        });
    } else {
        if (this.component){
            this.component.on('click tap', $.proxy(this.show, this));
        } else {
            this.element.on('click tap', $.proxy(this.show, this));
        }
    }
    
    /* Touch events to swipe dates */
    this.element
    .on('swipeleft', function(e) {
        e.preventDefault();
        this.moveDate('next');
    }.bind(this))
    .on('swiperight', function(e) {
        e.preventDefault();
        this.moveDate('prev');
    }.bind(this));

    /* Set-up view mode */
    this.minViewMode = options.minViewMode||this.element.data('date-minviewmode')||0;
    if (typeof this.minViewMode === 'string') {
        switch (this.minViewMode) {
            case 'months':
                this.minViewMode = 1;
                break;
            case 'years':
                this.minViewMode = 2;
                break;
            default:
                this.minViewMode = 0;
                break;
        }
    }
    this.viewMode = options.viewMode||this.element.data('date-viewmode')||0;
    if (typeof this.viewMode === 'string') {
        switch (this.viewMode) {
            case 'months':
                this.viewMode = 1;
                break;
            case 'years':
                this.viewMode = 2;
                break;
            default:
                this.viewMode = 0;
                break;
        }
    }
    this.startViewMode = this.viewMode;
    this.weekStart = options.weekStart||this.element.data('date-weekstart')||0;
    this.weekEnd = this.weekStart === 0 ? 6 : this.weekStart - 1;
    this.onRender = options.onRender;
    this.fillDow();
    this.fillMonths();
    this.update();
    this.showMode();
};

DatePicker.prototype = {
    constructor: DatePicker,
    
    show: function(e) {
        this.picker.show();
        this.height = this.component ? this.component.outerHeight() : this.element.outerHeight();
        this.place();
        $(window).on('resize', $.proxy(this.place, this));
        if (e ) {
            e.stopPropagation();
            e.preventDefault();
        }
        if (!this.isInput) {
        }
        var that = this;
        $(document).on('mousedown', function(ev){
            if ($(ev.target).closest('.' + classes.component).length === 0) {
                that.hide();
            }
        });
        this.element.trigger({
            type: 'show',
            date: this.date
        });
    },
    
    hide: function(){
        this.picker.hide();
        $(window).off('resize', this.place);
        this.viewMode = this.startViewMode;
        this.showMode();
        if (!this.isInput) {
            $(document).off('mousedown', this.hide);
        }
        //this.set();
        this.element.trigger({
            type: 'hide',
            date: this.date
        });
    },
    
    set: function() {
        var formated = DPGlobal.formatDate(this.date, this.format);
        if (!this.isInput) {
            if (this.component){
                this.element.find('input').prop('value', formated);
            }
            this.element.data('date', formated);
        } else {
            this.element.prop('value', formated);
        }
    },
    
    /**
        Sets a date as value and notify with an event.
        Parameter dontNotify is only for cases where the calendar or
        some related component gets already updated but the highlighted
        date needs to be updated without create infinite recursion 
        because of notification. In other case, dont use.
    **/
    setValue: function(newDate, dontNotify) {
        if (typeof newDate === 'string') {
            this.date = DPGlobal.parseDate(newDate, this.format);
        } else {
            this.date = new Date(newDate);
        }
        this.set();
        this.viewDate = new Date(this.date.getFullYear(), this.date.getMonth(), 1, 0, 0, 0, 0);
        this.fill();
        
        if (dontNotify !== true) {
            // Notify:
            this.element.trigger({
                type: 'changeDate',
                date: this.date,
                viewMode: DPGlobal.modes[this.viewMode].clsName
            });
        }
    },
    
    getValue: function() {
        return this.date;
    },
    
    moveValue: function(dir, mode) {
        // dir can be: 'prev', 'next'
        if (['prev', 'next'].indexOf(dir && dir.toLowerCase()) == -1)
            // No valid option:
            return;

        // default mode is the current one
        mode = mode ?
            DPGlobal.modesSet[mode] :
            DPGlobal.modes[this.viewMode];

        this.date['set' + mode.navFnc].call(
            this.date,
            this.date['get' + mode.navFnc].call(this.date) + 
            mode.navStep * (dir === 'prev' ? -1 : 1)
        );
        this.setValue(this.date);
        return this.date;
    },
    
    place: function(){
        var offset = this.component ? this.component.offset() : this.element.offset();
        this.picker.css({
            top: offset.top + this.height,
            left: offset.left
        });
    },
    
    update: function(newDate){
        this.date = DPGlobal.parseDate(
            typeof newDate === 'string' ? newDate : (this.isInput ? this.element.prop('value') : this.element.data('date')),
            this.format
        );
        this.viewDate = new Date(this.date.getFullYear(), this.date.getMonth(), 1, 0, 0, 0, 0);
        this.fill();
    },
    
    fillDow: function(){
        var dowCnt = this.weekStart;
        var html = '<tr>';
        while (dowCnt < this.weekStart + 7) {
            html += '<th class="dow">'+DPGlobal.dates.daysMin[(dowCnt++)%7]+'</th>';
        }
        html += '</tr>';
        this.picker.find('.' + classes.days + ' thead').append(html);
    },
    
    fillMonths: function(){
        var html = '';
        var i = 0;
        while (i < 12) {
            html += '<span class="' + classes.month + '">'+DPGlobal.dates.monthsShort[i++]+'</span>';
        }
        this.picker.find('.' + classes.months + ' td').append(html);
    },
    
    fill: function() {
        /*jshint maxstatements:66, maxcomplexity:28*/
        var d = new Date(this.viewDate),
            year = d.getFullYear(),
            month = d.getMonth(),
            currentDate = this.date.valueOf();
        this.picker
        .find('.' + classes.days + ' th:eq(1)')
        .html(DPGlobal.dates.months[month] + ' ' + year);
        var prevMonth = new Date(year, month-1, 28,0,0,0,0),
            day = DPGlobal.getDaysInMonth(prevMonth.getFullYear(), prevMonth.getMonth());
        prevMonth.setDate(day);
        prevMonth.setDate(day - (prevMonth.getDay() - this.weekStart + 7)%7);
        var nextMonth = new Date(prevMonth);
        nextMonth.setDate(nextMonth.getDate() + 42);
        nextMonth = nextMonth.valueOf();
        var html = [];
        var clsName,
            prevY,
            prevM;
            
        if (this._daysCreated !== true) {
            // Create html (first time only)
       
            while(prevMonth.valueOf() < nextMonth) {
                if (prevMonth.getDay() === this.weekStart) {
                    html.push('<tr>');
                }
                clsName = this.onRender(prevMonth);
                prevY = prevMonth.getFullYear();
                prevM = prevMonth.getMonth();
                if ((prevM < month &&  prevY === year) ||  prevY < year) {
                    clsName += ' old';
                } else if ((prevM > month && prevY === year) || prevY > year) {
                    clsName += ' new';
                }
                if (prevMonth.valueOf() === currentDate) {
                    clsName += ' active';
                }
                html.push('<td class="' + classes.monthDay + ' ' + clsName+'">'+prevMonth.getDate() + '</td>');
                if (prevMonth.getDay() === this.weekEnd) {
                    html.push('</tr>');
                }
                prevMonth.setDate(prevMonth.getDate()+1);
            }
            
            this.picker.find('.' + classes.days + ' tbody').empty().append(html.join(''));
            this._daysCreated = true;
        }
        else {
            // Update days values
            
            var weekTr = this.picker.find('.' + classes.days + ' tbody tr:first-child()');
            var dayTd = null;
            while(prevMonth.valueOf() < nextMonth) {
                var currentWeekDayIndex = prevMonth.getDay() - this.weekStart;

                clsName = this.onRender(prevMonth);
                prevY = prevMonth.getFullYear();
                prevM = prevMonth.getMonth();
                if ((prevM < month &&  prevY === year) ||  prevY < year) {
                    clsName += ' old';
                } else if ((prevM > month && prevY === year) || prevY > year) {
                    clsName += ' new';
                }
                if (prevMonth.valueOf() === currentDate) {
                    clsName += ' active';
                }
                //html.push('<td class="day '+clsName+'">'+prevMonth.getDate() + '</td>');
                dayTd = weekTr.find('td:eq(' + currentWeekDayIndex + ')');
                dayTd
                .attr('class', 'day ' + clsName)
                .text(prevMonth.getDate());
                
                // Next week?
                if (prevMonth.getDay() === this.weekEnd) {
                    weekTr = weekTr.next('tr');
                }
                prevMonth.setDate(prevMonth.getDate()+1);
            }
        }

        var currentYear = this.date.getFullYear();
        
        var months = this.picker.find('.' + classes.months)
                    .find('th:eq(1)')
                        .html(year)
                        .end()
                    .find('span').removeClass('active');
        if (currentYear === year) {
            months.eq(this.date.getMonth()).addClass('active');
        }
        
        html = '';
        year = parseInt(year/10, 10) * 10;
        var yearCont = this.picker.find('.' + classes.years)
                            .find('th:eq(1)')
                                .text(year + '-' + (year + 9))
                                .end()
                            .find('td');
        
        year -= 1;
        var i;
        if (this._yearsCreated !== true) {

            for (i = -1; i < 11; i++) {
                html += '<span class="' + classes.year + (i === -1 || i === 10 ? ' old' : '')+(currentYear === year ? ' active' : '')+'">'+year+'</span>';
                year += 1;
            }
            
            yearCont.html(html);
            this._yearsCreated = true;
        }
        else {
            
            var yearSpan = yearCont.find('span:first-child()');
            for (i = -1; i < 11; i++) {
                //html += '<span class="year'+(i === -1 || i === 10 ? ' old' : '')+(currentYear === year ? ' active' : '')+'">'+year+'</span>';
                yearSpan
                .text(year)
                .attr('class', 'year' + (i === -1 || i === 10 ? ' old' : '') + (currentYear === year ? ' active' : ''));
                year += 1;
                yearSpan = yearSpan.next();
            }
        }
    },
    
    moveDate: function(dir, mode) {
        // dir can be: 'prev', 'next'
        if (['prev', 'next'].indexOf(dir && dir.toLowerCase()) == -1)
            // No valid option:
            return;
            
        // default mode is the current one
        mode = mode || this.viewMode;

        this.viewDate['set'+DPGlobal.modes[mode].navFnc].call(
            this.viewDate,
            this.viewDate['get'+DPGlobal.modes[mode].navFnc].call(this.viewDate) + 
            DPGlobal.modes[mode].navStep * (dir === 'prev' ? -1 : 1)
        );
        this.fill();
        this.set();
    },

    click: function(e) {
        /*jshint maxcomplexity:16*/
        e.stopPropagation();
        e.preventDefault();
        var target = $(e.target).closest('span, td, th');
        if (target.length === 1) {
            var month, year;
            switch(target[0].nodeName.toLowerCase()) {
                case 'th':
                    switch(target[0].className) {
                        case 'switch':
                            this.showMode(1);
                            break;
                        case 'prev':
                        case 'next':
                            this.moveDate(target[0].className);
                            break;
                    }
                    break;
                case 'span':
                    if (target.is('.' + classes.month)) {
                        month = target.parent().find('span').index(target);
                        this.viewDate.setMonth(month);
                    } else {
                        year = parseInt(target.text(), 10)||0;
                        this.viewDate.setFullYear(year);
                    }
                    if (this.viewMode !== 0) {
                        this.date = new Date(this.viewDate);
                        this.element.trigger({
                            type: 'changeDate',
                            date: this.date,
                            viewMode: DPGlobal.modes[this.viewMode].clsName
                        });
                    }
                    this.showMode(-1);
                    this.fill();
                    this.set();
                    break;
                case 'td':
                    if (target.is('.day') && !target.is('.disabled')){
                        var day = parseInt(target.text(), 10)||1;
                        month = this.viewDate.getMonth();
                        if (target.is('.old')) {
                            month -= 1;
                        } else if (target.is('.new')) {
                            month += 1;
                        }
                        year = this.viewDate.getFullYear();
                        this.date = new Date(year, month, day,0,0,0,0);
                        this.viewDate = new Date(year, month, Math.min(28, day),0,0,0,0);
                        this.fill();
                        this.set();
                        this.element.trigger({
                            type: 'changeDate',
                            date: this.date,
                            viewMode: DPGlobal.modes[this.viewMode].clsName
                        });
                    }
                    break;
            }
        }
    },
    
    mousedown: function(e){
        e.stopPropagation();
        e.preventDefault();
    },
    
    showMode: function(dir) {
        if (dir) {
            this.viewMode = Math.max(this.minViewMode, Math.min(2, this.viewMode + dir));
        }
        this.picker.find('>div').hide().filter('.' + classes.component + '-' + DPGlobal.modes[this.viewMode].clsName).show();
    }
};

$.fn.datepicker = function ( option ) {
    var vals = Array.prototype.slice.call(arguments, 1);
    var returned;
    this.each(function () {
        var $this = $(this),
            data = $this.data('datepicker'),
            options = typeof option === 'object' && option;
        if (!data) {
            $this.data('datepicker', (data = new DatePicker(this, $.extend({}, $.fn.datepicker.defaults,options))));
        }

        if (typeof option === 'string') {
            returned = data[option].apply(data, vals);
            // There is a value returned by the method?
            if (typeof(returned !== 'undefined')) {
                // Go out the loop to return the value from the first
                // element-method execution
                return false;
            }
            // Follow next loop item
        }
    });
    if (typeof(returned) !== 'undefined')
        return returned;
    else
        // chaining:
        return this;
};

$.fn.datepicker.defaults = {
    onRender: function(date) {
        return '';
    }
};
$.fn.datepicker.Constructor = DatePicker;

var DPGlobal = {
    modes: [
        {
            clsName: 'days',
            navFnc: 'Month',
            navStep: 1
        },
        {
            clsName: 'months',
            navFnc: 'FullYear',
            navStep: 1
        },
        {
            clsName: 'years',
            navFnc: 'FullYear',
            navStep: 10
        },
        {
            clsName: 'day',
            navFnc: 'Date',
            navStep: 1
        }
    ],
    dates:{
        days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    },
    isLeapYear: function (year) {
        return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
    },
    getDaysInMonth: function (year, month) {
        return [31, (DPGlobal.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
    },
    parseFormat: function(format){
        var separator = format.match(/[.\/\-\s].*?/),
            parts = format.split(/\W+/);
        if (!separator || !parts || parts.length === 0){
            throw new Error("Invalid date format.");
        }
        return {separator: separator, parts: parts};
    },
    parseDate: function(date, format) {
        /*jshint maxcomplexity:11*/
        var parts = date.split(format.separator),
            val;
        date = new Date();
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        if (parts.length === format.parts.length) {
            var year = date.getFullYear(), day = date.getDate(), month = date.getMonth();
            for (var i=0, cnt = format.parts.length; i < cnt; i++) {
                val = parseInt(parts[i], 10)||1;
                switch(format.parts[i]) {
                    case 'dd':
                    case 'd':
                        day = val;
                        date.setDate(val);
                        break;
                    case 'mm':
                    case 'm':
                        month = val - 1;
                        date.setMonth(val - 1);
                        break;
                    case 'yy':
                        year = 2000 + val;
                        date.setFullYear(2000 + val);
                        break;
                    case 'yyyy':
                        year = val;
                        date.setFullYear(val);
                        break;
                }
            }
            date = new Date(year, month, day, 0 ,0 ,0);
        }
        return date;
    },
    formatDate: function(date, format){
        var val = {
            d: date.getDate(),
            m: date.getMonth() + 1,
            yy: date.getFullYear().toString().substring(2),
            yyyy: date.getFullYear()
        };
        val.dd = (val.d < 10 ? '0' : '') + val.d;
        val.mm = (val.m < 10 ? '0' : '') + val.m;
        date = [];
        for (var i=0, cnt = format.parts.length; i < cnt; i++) {
            date.push(val[format.parts[i]]);
        }
        return date.join(format.separator);
    },
    headTemplate: '<thead>'+
                        '<tr>'+
                            '<th class="prev">&lsaquo;</th>'+
                            '<th colspan="5" class="switch"></th>'+
                            '<th class="next">&rsaquo;</th>'+
                        '</tr>'+
                    '</thead>',
    contTemplate: '<tbody><tr><td colspan="7"></td></tr></tbody>'
};
DPGlobal.template = '<div class="' + classes.component + '">'+
                        '<div class="' + classes.days + '">'+
                            '<table class=" table-condensed">'+
                                DPGlobal.headTemplate+
                                '<tbody></tbody>'+
                            '</table>'+
                        '</div>'+
                        '<div class="' + classes.months + '">'+
                            '<table class="table-condensed">'+
                                DPGlobal.headTemplate+
                                DPGlobal.contTemplate+
                            '</table>'+
                        '</div>'+
                        '<div class="' + classes.years + '">'+
                            '<table class="table-condensed">'+
                                DPGlobal.headTemplate+
                                DPGlobal.contTemplate+
                            '</table>'+
                        '</div>'+
                    '</div>';
DPGlobal.modesSet = {
    'date': DPGlobal.modes[3],
    'month': DPGlobal.modes[0],
    'year': DPGlobal.modes[1],
    'decade': DPGlobal.modes[2]
};

/** Public API **/
exports.DatePicker = DatePicker;
exports.defaults = DPGlobal;
exports.utils = DPGlobal;

},{}],39:[function(require,module,exports){
/**
    SmartNavBar component.
    Requires its CSS counterpart.
    
    Created based on the project:
    
    Project-Tyson
    Website: https://github.com/c2prods/Project-Tyson
    Author: c2prods
    License:
    The MIT License (MIT)
    Copyright (c) 2013 c2prods
    Permission is hereby granted, free of charge, to any person obtaining a copy of
    this software and associated documentation files (the "Software"), to deal in
    the Software without restriction, including without limitation the rights to
    use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
    the Software, and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:
    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
    FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
    COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
    IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
**/
var $ = require('jquery');

/**
    Internal utility.
    Removes all children for a DOM node
**/
var clearNode = function (node) {
    while(node.firstChild){
        node.removeChild(node.firstChild);
    }
};

/**
    Calculates and applies the best sizing and distribution for the title
    depending on content and buttons.
    Pass in the title element, buttons must be found as siblings of it.
**/
var textboxResize = function textboxResize(el) {
    /* jshint maxstatements: 28, maxcomplexity:11 */
    
    var leftbtn = el.parentNode.querySelectorAll('.SmartNavBar-edge.left')[0];
    var rightbtn = el.parentNode.querySelectorAll('.SmartNavBar-edge.right')[0];
    if (typeof leftbtn === 'undefined') {
        leftbtn = {
            offsetWidth: 0,
            className: ''
        };
    }
    if (typeof rightbtn === 'undefined') {
        rightbtn = {
            offsetWidth: 0,
            className: ''
        };
    }
    
    var margin = Math.max(leftbtn.offsetWidth, rightbtn.offsetWidth);
    el.style.marginLeft = margin + 'px';
    el.style.marginRight = margin + 'px';
    var tooLong = (el.offsetWidth < el.scrollWidth) ? true : false;
    if (tooLong) {
        if (leftbtn.offsetWidth < rightbtn.offsetWidth) {
            el.style.marginLeft = leftbtn.offsetWidth + 'px';
            el.style.textAlign = 'right';
        } else {
            el.style.marginRight = rightbtn.offsetWidth + 'px';
            el.style.textAlign = 'left';
        }
        tooLong = (el.offsetWidth<el.scrollWidth) ? true : false;
        if (tooLong) {
            if (new RegExp('arrow').test(leftbtn.className)) {
                clearNode(leftbtn.childNodes[1]);
                el.style.marginLeft = '26px';
            }
            if (new RegExp('arrow').test(rightbtn.className)) {
                clearNode(rightbtn.childNodes[1]);
                el.style.marginRight = '26px';
            }
        }
    }
};

exports.textboxResize = textboxResize;

/**
    SmartNavBar class, instantiate with a DOM element
    representing a navbar.
    API:
    - refresh: updates the control taking care of the needed
        width for title and buttons
**/
var SmartNavBar = function SmartNavBar(el) {
    this.el = el;
    
    this.refresh = function refresh() {
        var h = $(el).children('h1').get(0);
        if (h)
            textboxResize(h);
    };

    this.refresh(); 
};

exports.SmartNavBar = SmartNavBar;

/**
    Get instances for all the SmartNavBar elements in the DOM
**/
exports.getAll = function getAll() {
    var all = $('.SmartNavBar');
    return $.map(all, function(item) { return new SmartNavBar(item); });
};

/**
    Refresh all SmartNavBar found in the document.
**/
exports.refreshAll = function refreshAll() {
    $('.SmartNavBar > h1').each(function() { textboxResize(this); });
};

},{}],40:[function(require,module,exports){
/**
    Custom Loconomics 'locale' styles for date/times.
    Its a bit more 'cool' rendering dates ;-)
**/
'use strict';

var moment = require('moment');
// Since the task of define a locale changes
// the current global locale, we save a reference
// and restore it later so nothing changed.
var current = moment.locale();

moment.locale('en-US-LC', {
    meridiemParse : /[ap]\.?\.?/i,
    meridiem : function (hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'p' : 'P';
        } else {
            return isLower ? 'a' : 'A';
        }
    },
    calendar : {
        lastDay : '[Yesterday]',
        sameDay : '[Today]',
        nextDay : '[Tomorrow]',
        lastWeek : '[last] dddd',
        nextWeek : 'dddd',
        sameElse : 'M/D'
    },
    longDateFormat : {
        LT: 'h:mma',
        LTS: 'h:mm:ssa',
        L: 'MM/DD/YYYY',
        l: 'M/D/YYYY',
        LL: 'MMMM Do YYYY',
        ll: 'MMM D YYYY',
        LLL: 'MMMM Do YYYY LT',
        lll: 'MMM D YYYY LT',
        LLLL: 'dddd, MMMM Do YYYY LT',
        llll: 'ddd, MMM D YYYY LT'
    }
});

// Restore locale
moment.locale(current);

},{"moment":false}],41:[function(require,module,exports){
/** Appointment model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    Client = require('./Client'),
    Location = require('./Location'),
    Service = require('./Service'),
    moment = require('moment');
   
function Appointment(values) {
    
    Model(this);

    this.model.defProperties({
        id: null,
        
        startTime: null,
        endTime: null,
        
        // Event summary:
        summary: 'New booking',
        
        subtotalPrice: 0,
        feePrice: 0,
        pfeePrice: 0,
        totalPrice: 0,
        ptotalPrice: 0,
        
        preNotesToClient: null,
        postNotesToClient: null,
        preNotesToSelf: null,
        postNotesToSelf: null
    }, values);
    
    values = values || {};

    this.client = ko.observable(values.client ? new Client(values.client) : null);

    this.location = ko.observable(new Location(values.location));
    this.locationSummary = ko.computed(function() {
        return this.location().singleLine();
    }, this);
    
    this.services = ko.observableArray((values.services || []).map(function(service) {
        return (service instanceof Service) ? service : new Service(service);
    }));
    this.servicesSummary = ko.computed(function() {
        return this.services().map(function(service) {
            return service.name();
        }).join(', ');
    }, this);
    
    // Price update on services changes
    // TODO Is not complete for production
    this.services.subscribe(function(services) {
        this.ptotalPrice(services.reduce(function(prev, cur) {
            return prev + cur.price();
        }, 0));
    }.bind(this));
    
    // Smart visualization of date and time
    this.displayedDate = ko.pureComputed(function() {
        
        return moment(this.startTime()).locale('en-US-LC').calendar();
        
    }, this);
    
    this.displayedStartTime = ko.pureComputed(function() {
        
        return moment(this.startTime()).locale('en-US-LC').format('LT');
        
    }, this);
    
    this.displayedEndTime = ko.pureComputed(function() {
        
        return moment(this.endTime()).locale('en-US-LC').format('LT');
        
    }, this);
    
    this.displayedTimeRange = ko.pureComputed(function() {
        
        return this.displayedStartTime() + '-' + this.displayedEndTime();
        
    }, this);
    
    this.itStarted = ko.pureComputed(function() {
        return (this.startTime() && new Date() >= this.startTime());
    }, this);
    
    this.itEnded = ko.pureComputed(function() {
        return (this.endTime() && new Date() >= this.endTime());
    }, this);
    
    this.isNew = ko.pureComputed(function() {
        return (!this.id());
    }, this);
    
    this.stateHeader = ko.pureComputed(function() {
        
        var text = '';
        if (!this.isNew()) {
            if (this.itStarted()) {
                if (this.itEnded()) {
                    text = 'Completed:';
                }
                else {
                    text = 'Now:';
                }
            }
            else {
                text = 'Upcoming:';
            }
        }

        return text;
        
    }, this);
}

module.exports = Appointment;

},{"./Client":45,"./Location":48,"./Model":51,"./Service":54,"knockout":false,"moment":false}],42:[function(require,module,exports){
/** BookingSummary model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    moment = require('moment');
    
function BookingSummary(values) {
    
    Model(this);

    this.model.defProperties({
        quantity: 0,
        concept: '',
        time: null,
        timeFormat: ' [@] h:mma'
    }, values);

    this.phrase = ko.pureComputed(function(){
        var t = this.timeFormat() && 
            this.time() && 
            moment(this.time()).format(this.timeFormat()) ||
            '';        
        return this.concept() + t;
    }, this);

    this.url = ko.pureComputed(function() {
        var url = this.time() &&
            '/calendar/' + this.time().toISOString();
        
        return url;
    }, this);
}

module.exports = BookingSummary;

},{"./Model":51,"knockout":false,"moment":false}],43:[function(require,module,exports){
/**
    Event model
**/
'use strict';

/* Example JSON (returned by the REST API):
{
  "EventID": 353,
  "UserID": 141,
  "EventTypeID": 3,
  "Summary": "Housekeeper services for JoshuaProvider D.",
  "AvailabilityTypeID": 3,
  "StartTime": "2014-03-25T08:00:00Z",
  "EndTime": "2014-03-25T18:00:00Z",
  "Kind": 0,
  "IsAllDay": false,
  "TimeZone": "01:00:00",
  "Location": "null",
  "UpdatedDate": "2014-10-30T15:44:49.653",
  "CreatedDate": null,
  "Description": "test description of a REST event",
  "RecurrenceRule": {
    "FrequencyTypeID": 502,
    "Interval": 1,
    "Until": "2014-07-01T00:00:00",
    "Count": null,
    "Ending": "date",
    "SelectedWeekDays": [
      1,
    ],
    "MonthlyWeekDay": false,
    "Incompatible": false,
    "TooMany": false
  },
  "RecurrenceOccurrences": null,
  "ReadOnly": false
}*/

function RecurrenceRule(values) {
    Model(this);
    
    this.model.defProperties({
        frequencyTypeID: 0,
        interval: 1, //:Integer
        until: null, //:Date
        count: null, //:Integer
        ending: null, // :string Possible values allowed: 'never', 'date', 'ocurrences'
        selectedWeekDays: [], // :integer[] 0:Sunday
        monthlyWeekDay: false,
        incompatible: false,
        tooMany: false
    }, values);
}

function RecurrenceOccurrence(values) {
    Model(this);
    
    this.model.defProperties({
        startTime: null, //:Date
        endTime: null //:Date
    }, values);
}

var ko = require('knockout'),
    Model = require('./Model'),
    moment = require('moment');
   
function CalendarEvent(values) {
    
    Model(this);
    
    this.model.defProperties({
        calendarEventID: 0,
        userID: 0,
        eventTypeID: 3,
        summary: '',
        availabilityTypeID: 0,
        startTime: null,
        endTime: null,
        kind: 0,
        isAllDay: false,
        timeZone: 'Z',
        location: null,
        updatedDate: null,
        createdDate: null,
        description: '',
        readOnly: false
    }, values);

    this.recurrenceRule = ko.observable(
        values && 
        values.recurrenceRule && 
        new RecurrenceRule(values.recurrenceRule)
    );
    this.recurrenceOccurrences = ko.observableArray([]); //:RecurrenceOccurrence[]
    if (values && values.recurrenceOccurrences) {
        values.recurrenceOccurrences.forEach(function(occurrence) {
            
            this.RecurrenceOccurrences.push(new RecurrenceOccurrence(occurrence));
            
        }.bind(this));
    }
}

module.exports = CalendarEvent;

CalendarEvent.RecurrenceRule = RecurrenceRule;
CalendarEvent.RecurrenceOccurrence = RecurrenceOccurrence;
},{"./Model":51,"knockout":false,"moment":false}],44:[function(require,module,exports){
/** CalendarSlot model.

    Describes a time slot in the calendar, for a consecutive
    event, appointment or free time.
 **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    Client = require('./Client');

function CalendarSlot(values) {
    
    Model(this);

    this.model.defProperties({
        startTime: null,
        endTime: null,
        
        subject: '',
        description: null,
        link: '#',

        actionIcon: null,
        actionText: null,
        
        classNames: ''

    }, values);
}

module.exports = CalendarSlot;

},{"./Client":45,"./Model":51,"knockout":false}],45:[function(require,module,exports){
/** Client model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model');

function Client(values) {
    
    Model(this);
    
    this.model.defProperties({
        id: 0,
        firstName: '',
        lastName: '',
        email: '',
        mobilePhone: null,
        alternatePhone: null,
        birthMonthDay: null,
        birthMonth: null,
        notesAboutClient: null
    }, values);

    this.fullName = ko.pureComputed(function() {
        return (this.firstName() + ' ' + this.lastName());
    }, this);
    
    this.birthDay = ko.pureComputed(function() {
        if (this.birthMonthDay() &&
            this.birthMonth()) {
            
            // TODO i10n
            return this.birthMonth() + '/' + this.birthMonthDay();
        }
        else {
            return null;
        }
    }, this);
    
    this.phoneNumber = ko.pureComputed({
        read: function() {
            var m = this.mobilePhone(),
                a = this.alternatePhone();

            return m ? m : a;
        },
        write: function(v) {
            // TODO
        },
        owner: this
    });
    
    this.canReceiveSms = ko.pureComputed({
        read: function() {
        
            var m = this.mobilePhone();

            return m ? true : false;
        },
        write: function(v) {
            // TODO
        },
        owner: this
    });
}

module.exports = Client;

},{"./Model":51,"knockout":false}],46:[function(require,module,exports){
/** GetMore model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    ListViewItem = require('./ListViewItem');

function GetMore(values) {

    Model(this);

    this.model.defProperties({
        availability: false,
        payments: false,
        profile: false,
        coop: true
    });
    
    var availableItems = {
        availability: new ListViewItem({
            contentLine1: 'Complete your availability to create a cleaner calendar',
            markerIcon: 'glyphicon glyphicon-calendar',
            actionIcon: 'glyphicon glyphicon-chevron-right'
        }),
        payments: new ListViewItem({
            contentLine1: 'Start accepting payments through Loconomics',
            markerIcon: 'glyphicon glyphicon-usd',
            actionIcon: 'glyphicon glyphicon-chevron-right'
        }),
        profile: new ListViewItem({
            contentLine1: 'Activate your profile in the marketplace',
            markerIcon: 'glyphicon glyphicon-user',
            actionIcon: 'glyphicon glyphicon-chevron-right'
        }),
        coop: new ListViewItem({
            contentLine1: 'Learn more about our cooperative',
            actionIcon: 'glyphicon glyphicon-chevron-right'
        })
    };

    this.items = ko.pureComputed(function() {
        var items = [];
        
        Object.keys(availableItems).forEach(function(key) {
            
            if (this[key]())
                items.push(availableItems[key]);
        }.bind(this));

        return items;
    }, this);
}

module.exports = GetMore;

},{"./ListViewItem":47,"./Model":51,"knockout":false}],47:[function(require,module,exports){
/** ListViewItem model.

    Describes a generic item of a
    ListView component.
 **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    moment = require('moment');

function ListViewItem(values) {
    
    Model(this);

    this.model.defProperties({
        markerLine1: null,
        markerLine2: null,
        markerIcon: null,
        
        contentLine1: '',
        contentLine2: null,
        link: '#',

        actionIcon: null,
        actionText: null,
        
        classNames: ''

    }, values);
}

module.exports = ListViewItem;

},{"./Model":51,"knockout":false,"moment":false}],48:[function(require,module,exports){
/** Location model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model');

function Location(values) {

    Model(this);
    
    this.model.defProperties({
        locationID: 0,
        name: '',
        addressLine1: null,
        addressLine2: null,
        city: null,
        stateProvinceCode: null,
        stateProviceID: null,
        postalCode: null,
        postalCodeID: null,
        countryID: null,
        latitude: null,
        longitude: null,
        specialInstructions: null,
        isServiceRadius: false,
        isServiceLocation: false,
        serviceRadius: 0
    }, values);
    
    this.singleLine = ko.computed(function() {
        
        var list = [
            this.addressLine1(),
            this.city(),
            this.postalCode(),
            this.stateProvinceCode()
        ];
        
        return list.filter(function(v) { return !!v; }).join(', ');
    }, this);
    
    this.countryName = ko.computed(function() {
        return (
            this.countryID() === 1 ?
            'United States' :
            this.countryID() === 2 ?
            'Spain' :
            'unknow'
        );
    }, this);
    
    this.countryCodeAlpha2 = ko.computed(function() {
        return (
            this.countryID() === 1 ?
            'US' :
            this.countryID() === 2 ?
            'ES' :
            ''
        );
    }, this);
    
    this.latlng = ko.computed(function() {
        return {
            lat: this.latitude(),
            lng: this.longitude()
        };
    }, this);
}

module.exports = Location;

},{"./Model":51,"knockout":false}],49:[function(require,module,exports){
/** MailFolder model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    moment = require('moment'),
    _ = require('lodash');

function MailFolder(values) {

    Model(this);

    this.model.defProperties({
        messages: [],
        topNumber: 10
    }, values);
    
    this.top = ko.pureComputed(function top(num) {
        if (num) this.topNumber(num);
        return _.first(this.messages(), this.topNumber());
    }, this);
}

module.exports = MailFolder;

},{"./Model":51,"knockout":false,"lodash":false,"moment":false}],50:[function(require,module,exports){
/** Message model.

    Describes a message from a MailFolder.
    A message could be of different types,
    as inquiries, bookings, booking requests.
 **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    moment = require('moment');
//TODO   Thread = require('./Thread');

function Message(values) {
    
    Model(this);

    this.model.defProperties({
        id: 0,
        createdDate: null,
        updatedDate: null,
        
        subject: '',
        content: null,
        link: '#',

        actionIcon: null,
        actionText: null,
        
        classNames: ''

    }, values);
    
    // Smart visualization of date and time
    this.displayedDate = ko.pureComputed(function() {
        
        return moment(this.createdDate()).locale('en-US-LC').calendar();
        
    }, this);
    
    this.displayedTime = ko.pureComputed(function() {
        
        return moment(this.createdDate()).locale('en-US-LC').format('LT');
        
    }, this);
}

module.exports = Message;

},{"./Model":51,"knockout":false,"moment":false}],51:[function(require,module,exports){
/**
    Model class to help build models.

    Is not exactly an 'OOP base' class, but provides
    utilities to models and a model definition object
    when executed in their constructors as:
    
    '''
    function MyModel() {
        Model(this);
        // Now, there is a this.model property with
        // an instance of the Model class, with 
        // utilities and model settings.
    }
    '''
    
    That auto creation of 'model' property can be avoided
    when using the object instantiation syntax ('new' keyword):
    
    '''
    var model = new Model(obj);
    // There is no a 'obj.model' property, can be
    // assigned to whatever property or nothing.
    '''
**/
'use strict';
var ko = require('knockout');
ko.mapping = require('knockout.mapping');
var $ = require('jquery');
var clone = function(obj) { return $.extend(true, {}, obj); };

function Model(modelObject) {
    
    if (!(this instanceof Model)) {
        // Executed as a function, it must create
        // a Model instance
        var model = new Model(modelObject);
        // and register automatically as part
        // of the modelObject in 'model' property
        modelObject.model = model;
        
        // Returns the instance
        return model;
    }
 
    // It includes a reference to the object
    this.modelObject = modelObject;
    // It maintains a list of properties and fields
    this.propertiesList = [];
    this.fieldsList = [];
    // It allow setting the 'ko.mapping.fromJS' mapping options
    // to control conversions from plain JS objects when 
    // 'updateWith'.
    this.mappingOptions = {};
}

module.exports = Model;

/**
    Define observable properties using the given
    properties object definition that includes de default values,
    and some optional initialValues (normally that is provided externally
    as a parameter to the model constructor, while default values are
    set in the constructor).
    That properties become members of the modelObject, simplifying 
    model definitions.
    
    It uses Knockout.observable and observableArray, so properties
    are funtions that reads the value when no arguments or sets when
    one argument is passed of.
**/
Model.prototype.defProperties = function defProperties(properties, initialValues) {

    initialValues = initialValues || {};

    var modelObject = this.modelObject,
        propertiesList = this.propertiesList;

    Object.keys(properties).forEach(function(key) {
        
        var defVal = properties[key];
        // Create observable property with default value
        modelObject[key] = Array.isArray(defVal) ?
            ko.observableArray(defVal) :
            ko.observable(defVal);
        // Remember default
        modelObject[key]._defaultValue = defVal;
        // remember initial
        modelObject[key]._initialValue = initialValues[key];
        
        // If there is an initialValue, set it:
        if (typeof(initialValues[key]) !== 'undefined') {
            modelObject[key](initialValues[key]);
        }
        
        // Add to the internal registry
        propertiesList.push(key);
    });
};

/**
    Define fields as plain members of the modelObject using
    the fields object definition that includes default values,
    and some optional initialValues.
    
    Its like defProperties, but for plain js values rather than observables.
**/
Model.prototype.defFields = function defFields(fields, initialValues) {

    initialValues = initialValues || {};

    var modelObject = this.modelObject,
        fieldsList = this.fieldsList;

    Object.keys(fields).each(function(key) {
        
        var defVal = fields[key];
        // Create field with default value
        modelObject[key] = defVal;
        
        // If there is an initialValue, set it:
        if (typeof(initialValues[key]) !== 'undefined') {
            modelObject[key] = initialValues[key];
        }
        
        // Add to the internal registry
        fieldsList.push(key);
    });
};

/**
    Store the list of fields that make the ID/primary key
    and create an alias 'id' property that returns the
    value for the ID field or array of values when multiple
    fields.
**/
Model.prototype.defID = function defID(fieldsNames) {
    
    // Store the list
    this.idFieldsNames = fieldsNames;
    
    // Define ID observable
    if (fieldsNames.length === 1) {
        // Returns single value
        var field = fieldsNames[0];
        this.modelObject.id = ko.pureComputed(function() {
            return this[field]();
        }, this.modelObject);
    }
    else {
        this.modelObject.id = ko.pureComputed(function() {
            return fieldsNames.map(function(fieldName) {
                return this[field]();
            }.bind(this));
        }, this.modelObject);
    }
};

/**
    Returns a plain object with the properties and fields
    of the model object, just values.
    
    @param deepCopy:bool If left undefined, do not copy objects in
    values and not references. If false, do a shallow copy, setting
    up references in the result. If true, to a deep copy of all objects.
**/
Model.prototype.toPlainObject = function toPlainObject(deepCopy) {

    var plain = {},
        modelObj = this.modelObject;

    function setValue(property, val) {
        /*jshint maxcomplexity: 10*/
        
        if (typeof(val) === 'object') {
            if (deepCopy === true) {
                if (val instanceof Date) {
                    // A date clone
                    plain[property] = new Date(val);
                }
                else if (val && val.model instanceof Model) {
                    // A model copy
                    plain[property] = val.model.toPlainObject(deepCopy);
                }
                else if (val === null) {
                    plain[property] = null;
                }
                else {
                    // Plain 'standard' object clone
                    plain[property] = clone(val);
                }
            }
            else if (deepCopy === false) {
                // Shallow copy
                plain[property] = val;
            }
            // On else, do nothing, no references, no clones
        }
        else {
            plain[property] = val;
        }
    }

    this.propertiesList.forEach(function(property) {
        // Properties are observables, so functions without params:
        var val = modelObj[property]();

        setValue(property, val);
    });

    this.fieldsList.forEach(function(field) {
        // Fields are just plain object members for values, just copy:
        var val = modelObj[field];

        setValue(field, val);
    });

    return plain;
};

Model.prototype.updateWith = function updateWith(data, deepCopy) {
    
    // We need a plain object for 'fromJS'.
    // If is a model, extract their properties and fields from
    // the observables (fromJS), so we not get computed
    // or functions, just registered properties and fields
    if (data && data.model instanceof Model) {
        
        data = data.model.toPlainObject(deepCopy);
    }

    ko.mapping.fromJS(data, this.mappingOptions, this.modelObject);
};

Model.prototype.clone = function clone(data, deepCopy) {
    // Get a plain object with the object data
    var plain = this.toPlainObject(deepCopy);
    // Create a new model instance, using the source plain object
    // as initial values
    var cloned = new this.modelObject.constructor(plain);
    // Update the cloned with the provided plain data used
    // to replace values on the cloned one, for quick one-step creation
    // of derived objects.
    cloned.model.updateWith(data);
    // Cloned model ready:
    return cloned;
};

},{"knockout":false,"knockout.mapping":false}],52:[function(require,module,exports){
/** PerformanceSummary model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    ListViewItem = require('./ListViewItem'),
    moment = require('moment'),
    numeral = require('numeral');

function PerformanceSummary(values) {

    Model(this);

    values = values || {};

    this.earnings = new Earnings(values.earnings);
    
    var earningsLine = new ListViewItem();
    earningsLine.markerLine1 = ko.computed(function() {
        var num = numeral(this.currentAmount()).format('$0,0');
        return num;
    }, this.earnings);
    earningsLine.contentLine1 = ko.computed(function() {
        return this.currentConcept();
    }, this.earnings);
    earningsLine.markerLine2 = ko.computed(function() {
        var num = numeral(this.nextAmount()).format('$0,0');
        return num;
    }, this.earnings);
    earningsLine.contentLine2 = ko.computed(function() {
        return this.nextConcept();
    }, this.earnings);
    

    this.timeBooked = new TimeBooked(values.timeBooked);

    var timeBookedLine = new ListViewItem();
    timeBookedLine.markerLine1 = ko.computed(function() {
        var num = numeral(this.percent()).format('0%');
        return num;
    }, this.timeBooked);
    timeBookedLine.contentLine1 = ko.computed(function() {
        return this.concept();
    }, this.timeBooked);
    
    
    this.items = ko.pureComputed(function() {
        var items = [];
        
        items.push(earningsLine);
        items.push(timeBookedLine);

        return items;
    }, this);
}

module.exports = PerformanceSummary;

function Earnings(values) {

    Model(this);
    
    this.model.defProperties({
    
         currentAmount: 0,
         currentConceptTemplate: 'already paid this month',
         nextAmount: 0,
         nextConceptTemplate: 'projected {month} earnings'

    }, values);
    
    this.currentConcept = ko.pureComputed(function() {

        var month = moment().format('MMMM');
        return this.currentConceptTemplate().replace(/\{month\}/, month);

    }, this);

    this.nextConcept = ko.pureComputed(function() {

        var month = moment().add(1, 'month').format('MMMM');
        return this.nextConceptTemplate().replace(/\{month\}/, month);

    }, this);
}

function TimeBooked(values) {

    Model(this);
    
    this.model.defProperties({
    
        percent: 0,
        conceptTemplate: 'of available time booked in {month}'
    
    }, values);
    
    this.concept = ko.pureComputed(function() {

        var month = moment().add(1, 'month').format('MMMM');
        return this.conceptTemplate().replace(/\{month\}/, month);

    }, this);
}

},{"./ListViewItem":47,"./Model":51,"knockout":false,"moment":false,"numeral":1}],53:[function(require,module,exports){
/** Position model.
 **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model');

function Position(values) {
    
    Model(this);

    this.model.defProperties({
        positionID: 0,
        positionSingular: '',
        positionPlural: '',
        description: '',
        active: true

    }, values);
}

module.exports = Position;

},{"./Model":51,"knockout":false}],54:[function(require,module,exports){
/** Service model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model');

function Service(values) {

    Model(this);
    
    this.model.defProperties({
        name: '',
        price: 0,
        duration: 0, // in minutes
        isAddon: false
    }, values);
    
    this.durationText = ko.computed(function() {
        var minutes = this.duration() || 0;
        // TODO: Formatting, localization
        return minutes ? minutes + ' minutes' : '';
    }, this);
}

module.exports = Service;

},{"./Model":51,"knockout":false}],55:[function(require,module,exports){
/** UpcomingBookingsSummary model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    BookingSummary = require('./BookingSummary');

function UpcomingBookingsSummary() {

    Model(this);

    this.today = new BookingSummary({
        concept: 'more today',
        timeFormat: ' [ending @] h:mma'
    });
    this.tomorrow = new BookingSummary({
        concept: 'tomorrow',
        timeFormat: ' [starting @] h:mma'
    });
    this.nextWeek = new BookingSummary({
        concept: 'next week',
        timeFormat: null
    });
    
    this.items = ko.pureComputed(function() {
        var items = [];
        
        //if (this.today.quantity())
        items.push(this.today);
        //if (this.tomorrow.quantity())
        items.push(this.tomorrow);
        //if (this.nextWeek.quantity())
        items.push(this.nextWeek);

        return items;
    }, this);
    
}

module.exports = UpcomingBookingsSummary;

},{"./BookingSummary":42,"./Model":51,"knockout":false}],56:[function(require,module,exports){
/** User model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model');

// Enum UserType
var UserType = {
    None: 0,
    Anonymous: 1,
    Customer: 2,
    Provider: 4,
    Admin: 8,
    LoggedUser: 14,
    User: 15,
    System: 16
};

function User(values) {
    
    Model(this);
    
    this.model.defProperties({
        userID: 0,
        email: '',
        firstName: '',
        middleIn: '',
        lastName: '',
        secondLastName: '',
        nickName: null,
        publicBio: null,
        genderID: 0,
        preferredLanguageID: null,
        preferredCountryID: null,
        isProvider: false,
        isCustomer: false,
        isMember: false,
        isAdmin: false,
        mobilePhone: null,
        alternatePhone: null,
        providerProfileURL: null,
        providerWebsiteURL: null,
        createdDate: null,
        updatedDate: null,
        modifiedBy: null,
        active: false,
        accountStatusID: 0,
        bookCode: null,
        onboardingStep: null,
        businessName: null,
        alternateEmail: null,
        birthMonthDay: null,
        birthMonth: null
    }, values);

    this.fullName = ko.pureComputed(function() {
        return (this.firstName() + ' ' + this.lastName());
    }, this);
    
    this.birthDay = ko.pureComputed(function() {
        if (this.birthMonthDay() &&
            this.birthMonth()) {
            
            // TODO i10n
            return this.birthMonth() + '/' + this.birthMonthDay();
        }
        else {
            return null;
        }
    }, this);
    
    this.userType = ko.pureComputed({
        read: function() {
            var c = this.isCustomer(),
                p = this.isProvider(),
                a = this.isAdmin();
            
            var userType = 0;
            
            if (this.isAnonymous()) {
                userType = userType | UserType.Anonymous;
            }
            if (c)
                userType = userType | UserType.Customer;
            if (p)
                userType = userType | UserType.Provider;
            if (a)
                userType = userType | UserType.Admin;
            
            return userType;
        },
        /* NOTE: Not require for now:
        write: function(v) {
        },*/
        owner: this
    });
    
    this.isAnonymous = ko.pureComputed(function(){
        return this.userID() < 1;
    }, this);
    
    /**
        It matches a UserType from the enumeration?
    **/
    this.isUserType = function isUserType(type) {
        return (this.userType() & type);
    }.bind(this);
}

module.exports = User;

User.UserType = UserType;

/* Creatint an anonymous user with some pressets */
User.newAnonymous = function newAnonymous() {
    return new User({
        userID: 0,
        email: '',
        firstName: '',
        onboardingStep: null
    });
};

},{"./Model":51,"knockout":false}],57:[function(require,module,exports){
/** Calendar Appointments test data **/
var Appointment = require('../models/Appointment');
var testLocations = require('./locations').locations;
var testServices = require('./services').services;
var ko = require('knockout');
var moment = require('moment');

var today = moment(),
    tomorrow = moment().add(1, 'days'),
    tomorrow10 = tomorrow.clone().hours(10).minutes(0).seconds(0),
    tomorrow16 = tomorrow.clone().hours(16).minutes(30).seconds(0);
    
var testData = [
    new Appointment({
        id: 1,
        startTime: tomorrow10,
        endTime: tomorrow16,
        summary: 'Massage Therapist Booking',
        //pricingSummary: 'Deep Tissue Massage 120m plus 2 more',
        services: testServices,
        ptotalPrice: 95.0,
        location: ko.toJS(testLocations[0]),
        preNotesToClient: 'Looking forward to seeing the new color',
        preNotesToSelf: 'Ask him about his new color',
        client: {
            firstName: 'Joshua',
            lastName: 'Danielson'
        }
    }),
    new Appointment({
        id: 2,
        startTime: new Date(2014, 11, 1, 13, 0, 0),
        endTime: new Date(2014, 11, 1, 13, 50, 0),
        summary: 'Massage Therapist Booking',
        //pricingSummary: 'Another Massage 50m',
        services: [testServices[0]],
        ptotalPrice: 95.0,
        location: ko.toJS(testLocations[1]),
        preNotesToClient: 'Something else',
        preNotesToSelf: 'Remember that thing',
        client: {
            firstName: 'Joshua',
            lastName: 'Danielson'
        }
    }),
    new Appointment({
        id: 3,
        startTime: new Date(2014, 11, 1, 16, 0, 0),
        endTime: new Date(2014, 11, 1, 18, 0, 0),
        summary: 'Massage Therapist Booking',
        //pricingSummary: 'Tissue Massage 120m',
        services: [testServices[1]],
        ptotalPrice: 95.0,
        location: ko.toJS(testLocations[2]),
        preNotesToClient: '',
        preNotesToSelf: 'Ask him about the forgotten notes',
        client: {
            firstName: 'Joshua',
            lastName: 'Danielson'
        }
    }),
];

exports.appointments = testData;

},{"../models/Appointment":41,"./locations":60,"./services":62,"knockout":false,"moment":false}],58:[function(require,module,exports){
/** Calendar Slots test data **/
var CalendarSlot = require('../models/CalendarSlot');

var Time = require('../utils/Time');
var moment = require('moment');

var today = new Date(),
    tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

var stoday = moment(today).format('YYYY-MM-DD'),
    stomorrow = moment(tomorrow).format('YYYY-MM-DD');

var testData1 = [
    new CalendarSlot({
        startTime: new Time(today, 0, 0, 0),
        endTime: new Time(today, 12, 0, 0),
        
        subject: 'Free',
        description: null,
        link: '#!appointment/0',

        actionIcon: 'glyphicon glyphicon-plus',
        actionText: null,

        classNames: 'ListView-item--tag-success'
    }),
    new CalendarSlot({
        startTime: new Time(today, 12, 0, 0),
        endTime: new Time(today, 13, 0, 0),
        
        subject: 'Josh Danielson',
        description: 'Deep Tissue Massage',
        link: '#!appointment/3',

        actionIcon: 'glyphicon glyphicon-plus',
        actionText: null,

        classNames: null
    }),
    new CalendarSlot({
        startTime: new Time(today, 13, 0, 0),
        endTime: new Time(today, 15, 0, 0),

        subject: 'Do that important thing',
        description: null,
        link: '#!event/8',

        actionIcon: 'glyphicon glyphicon-new-window',
        actionText: null,

        classNames: null
    }),
    new CalendarSlot({
        startTime: new Time(today, 15, 0, 0),
        endTime: new Time(today, 16, 0, 0),
        
        subject: 'Iago Lorenzo',
        description: 'Deep Tissue Massage Long Name',
        link: '#!appointment/5',

        actionIcon: null,
        actionText: '$159.90',

        classNames: null
    }),
    new CalendarSlot({
        startTime: new Time(today, 16, 0, 0),
        endTime: new Time(today, 0, 0, 0),
        
        subject: 'Free',
        description: null,
        link: '#!appointment/0',

        actionIcon: 'glyphicon glyphicon-plus',
        actionText: null,

        classNames: 'ListView-item--tag-success'
    })
];
var testData2 = [
    new CalendarSlot({
        startTime: new Time(tomorrow, 0, 0, 0),
        endTime: new Time(tomorrow, 9, 0, 0),
        
        subject: 'Free',
        description: null,
        link: '#!appointment/0',

        actionIcon: 'glyphicon glyphicon-plus',
        actionText: null,

        classNames: 'ListView-item--tag-success'
    }),
    new CalendarSlot({
        startTime: new Time(tomorrow, 9, 0, 0),
        endTime: new Time(tomorrow, 10, 0, 0),
        
        subject: 'Jaren Freely',
        description: 'Deep Tissue Massage Long Name',
        link: '#!appointment/1',

        actionIcon: null,
        actionText: '$59.90',

        classNames: null
    }),
    new CalendarSlot({
        startTime: new Time(tomorrow, 10, 0, 0),
        endTime: new Time(tomorrow, 11, 0, 0),
        
        subject: 'Free',
        description: null,
        link: '#!appointment/0',

        actionIcon: 'glyphicon glyphicon-plus',
        actionText: null,

        classNames: 'ListView-item--tag-success'
    }),
    new CalendarSlot({
        startTime: new Time(tomorrow, 11, 0, 0),
        endTime: new Time(tomorrow, 12, 45, 0),
        
        subject: 'CONFIRM-Susan Dee',
        description: 'Deep Tissue Massage',
        link: '#!appointment/2',

        actionIcon: null,
        actionText: '$70',

        classNames: 'ListView-item--tag-warning'
    }),
    new CalendarSlot({
        startTime: new Time(tomorrow, 12, 45, 0),
        endTime: new Time(tomorrow, 16, 0, 0),
        
        subject: 'Free',
        description: null,
        link: '#!appointment/0',

        actionIcon: 'glyphicon glyphicon-plus',
        actionText: null,

        classNames: 'ListView-item--tag-success'
    }),
    new CalendarSlot({
        startTime: new Time(tomorrow, 16, 0, 0),
        endTime: new Time(tomorrow, 17, 15, 0),
        
        subject: 'Susan Dee',
        description: 'Deep Tissue Massage',
        link: '#!appointment/3',

        actionIcon: 'glyphicon glyphicon-plus',
        actionText: null,

        classNames: null
    }),
    new CalendarSlot({
        startTime: new Time(tomorrow, 17, 15, 0),
        endTime: new Time(tomorrow, 18, 30, 0),
        
        subject: 'Dentist appointment',
        description: null,
        link: '#!event/4',

        actionIcon: 'glyphicon glyphicon-new-window',
        actionText: null,

        classNames: null
    }),
    new CalendarSlot({
        startTime: new Time(tomorrow, 18, 30, 0),
        endTime: new Time(tomorrow, 19, 30, 0),
        
        subject: 'Susan Dee',
        description: 'Deep Tissue Massage Long Name',
        link: '#!appointment/5',

        actionIcon: null,
        actionText: '$159.90',

        classNames: null
    }),
    new CalendarSlot({
        startTime: new Time(tomorrow, 19, 30, 0),
        endTime: new Time(tomorrow, 23, 0, 0),
        
        subject: 'Free',
        description: null,
        link: '#!appointment/0',

        actionIcon: 'glyphicon glyphicon-plus',
        actionText: null,

        classNames: 'ListView-item--tag-success'
    }),
    new CalendarSlot({
        startTime: new Time(tomorrow, 23, 0, 0),
        endTime: new Time(tomorrow, 0, 0, 0),

        subject: 'Jaren Freely',
        description: 'Deep Tissue Massage',
        link: '#!appointment/6',

        actionIcon: null,
        actionText: '$80',

        classNames: null
    })
];
var testDataFree = [
    new CalendarSlot({
        startTime: new Time(tomorrow, 0, 0, 0),
        endTime: new Time(tomorrow, 0, 0, 0),

        subject: 'Free',
        description: null,
        link: '#!appointment/0',

        actionIcon: 'glyphicon glyphicon-plus',
        actionText: null,

        classNames: 'ListView-item--tag-success'
    })
];

var testData = {
    'default': testDataFree
};
testData[stoday] = testData1;
testData[stomorrow] = testData2;

exports.calendar = testData;

},{"../models/CalendarSlot":44,"../utils/Time":67,"moment":false}],59:[function(require,module,exports){
/** Clients test data **/
var Client = require('../models/Client');

var testData = [
    new Client ({
        id: 1,
        firstName: 'Joshua',
        lastName: 'Danielson'
    }),
    new Client({
        id: 2,
        firstName: 'Iago',
        lastName: 'Lorenzo'
    }),
    new Client({
        id: 3,
        firstName: 'Fernando',
        lastName: 'Gago'
    }),
    new Client({
        id: 4,
        firstName: 'Adam',
        lastName: 'Finch'
    }),
    new Client({
        id: 5,
        firstName: 'Alan',
        lastName: 'Ferguson'
    }),
    new Client({
        id: 6,
        firstName: 'Alex',
        lastName: 'Pena'
    }),
    new Client({
        id: 7,
        firstName: 'Alexis',
        lastName: 'Peaca'
    }),
    new Client({
        id: 8,
        firstName: 'Arthur',
        lastName: 'Miller'
    })
];

exports.clients = testData;

},{"../models/Client":45}],60:[function(require,module,exports){
/** Locations test data **/
var Location = require('../models/Location');

var testData = [
    new Location ({
        locationID: 1,
        name: 'ActviSpace',
        addressLine1: '3150 18th Street',
        postalCode: 90001,
        isServiceRadius: true,
        serviceRadius: 2
    }),
    new Location({
        locationID: 2,
        name: 'Corey\'s Apt',
        addressLine1: '187 Bocana St.',
        postalCode: 90002
    }),
    new Location({
        locationID: 3,
        name: 'Josh\'a Apt',
        addressLine1: '429 Corbett Ave',
        postalCode: 90003
    })
];

exports.locations = testData;

},{"../models/Location":48}],61:[function(require,module,exports){
/** Inbox test data **/
var Message = require('../models/Message');

var Time = require('../utils/Time');
var moment = require('moment');

var today = new Date(),
    yesterday = new Date(),
    lastWeek = new Date(),
    oldDate = new Date();
yesterday.setDate(yesterday.getDate() - 1);
lastWeek.setDate(lastWeek.getDate() - 2);
oldDate.setDate(oldDate.getDate() - 16);

var testData = [
    new Message({
        id: 1,
        createdDate: new Time(today, 11, 0, 0),
        
        subject: 'CONFIRM-Susan Dee',
        content: 'Deep Tissue Massage',
        link: '/conversation/1',

        actionIcon: null,
        actionText: '$70',

        classNames: 'ListView-item--tag-warning'
    }),
    new Message({
        id: 3,
        createdDate: new Time(yesterday, 13, 0, 0),

        subject: 'Do you do "Exotic Massage"?',
        content: 'Hi, I wanted to know if you perform as par of your services...',
        link: '/conversation/3',

        actionIcon: 'glyphicon glyphicon-share-alt',
        actionText: null,

        classNames: null
    }),
    new Message({
        id: 2,
        createdDate: new Time(lastWeek, 12, 0, 0),
        
        subject: 'Josh Danielson',
        content: 'Deep Tissue Massage',
        link: '/conversation/2',

        actionIcon: 'glyphicon glyphicon-plus',
        actionText: null,

        classNames: null
    }),
    new Message({
        id: 4,
        createdDate: new Time(oldDate, 15, 0, 0),
        
        subject: 'Inquiry',
        content: 'Another question from another client.',
        link: '/conversation/4',

        actionIcon: 'glyphicon glyphicon-share-alt',

        classNames: null
    })
];

exports.messages = testData;

},{"../models/Message":50,"../utils/Time":67,"moment":false}],62:[function(require,module,exports){
/** Services test data **/
var Service = require('../models/Service');

var testData = [
    new Service ({
        name: 'Deep Tissue Massage',
        price: 95,
        duration: 120
    }),
    new Service({
        name: 'Tissue Massage',
        price: 60,
        duration: 60
    }),
    new Service({
        name: 'Special oils',
        price: 95,
        isAddon: true
    }),
    new Service({
        name: 'Some service extra',
        price: 40,
        duration: 20,
        isAddon: true
    })
];

exports.services = testData;

},{"../models/Service":54}],63:[function(require,module,exports){
/** 
    timeSlots
    testing data
**/

var Time = require('../utils/Time');

var moment = require('moment');

var today = new Date(),
    tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

var stoday = moment(today).format('YYYY-MM-DD'),
    stomorrow = moment(tomorrow).format('YYYY-MM-DD');

var testData1 = [
    Time(today, 9, 15),
    Time(today, 11, 30),
    Time(today, 12, 0),
    Time(today, 12, 30),
    Time(today, 16, 15),
    Time(today, 18, 0),
    Time(today, 18, 30),
    Time(today, 19, 0),
    Time(today, 19, 30),
    Time(today, 21, 30),
    Time(today, 22, 0)
];

var testData2 = [
    Time(tomorrow, 8, 0),
    Time(tomorrow, 10, 30),
    Time(tomorrow, 11, 0),
    Time(tomorrow, 11, 30),
    Time(tomorrow, 12, 0),
    Time(tomorrow, 12, 30),
    Time(tomorrow, 13, 0),
    Time(tomorrow, 13, 30),
    Time(tomorrow, 14, 45),
    Time(tomorrow, 16, 0),
    Time(tomorrow, 16, 30)
];

var testDataBusy = [
];

var testData = {
    'default': testDataBusy
};
testData[stoday] = testData1;
testData[stomorrow] = testData2;

exports.timeSlots = testData;

},{"../utils/Time":67,"moment":false}],64:[function(require,module,exports){
/**
    New Function method: '_delayed'.
    It returns a new function, wrapping the original one,
    that once its call will delay the execution the given milliseconds,
    using a setTimeout.
    The new function returns 'undefined' since it has not the result,
    because of that is only suitable with return-free functions 
    like event handlers.
    
    Why: sometimes, the handler for an event needs to be executed
    after a delay instead of instantly.
**/
Function.prototype._delayed = function delayed(milliseconds) {
    var fn = this;
    return function() {
        var context = this,
            args = arguments;
        setTimeout(function () {
            fn.apply(context, args);
        }, milliseconds);
    };
};

},{}],65:[function(require,module,exports){
/**
    Extending the Function class with an inherits method.
    
    The initial low dash is to mark it as no-standard.
**/
Function.prototype._inherits = function _inherits(superCtor) {
    this.prototype = Object.create(superCtor.prototype, {
        constructor: {
            value: this,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
};

},{}],66:[function(require,module,exports){
/**
    REST API access
**/
'use strict';
var $ = require('jquery');

function lowerFirstLetter(n) {
    return n && n[0] && n[0].toLowerCase && (n[0].toLowerCase() + n.slice(1)) || n;
}

function lowerCamelizeObject(obj) {
    //jshint maxcomplexity:8
    
    if (!obj || typeof(obj) !== 'object') return obj;

    var ret = Array.isArray(obj) ? [] : {};
    for(var k in obj) {
        if (obj.hasOwnProperty(k)) {
            var newk = lowerFirstLetter(k);
            ret[newk] = typeof(obj[k]) === 'object' ?
                lowerCamelizeObject(obj[k]) :
                obj[k]
            ;
        }
    }
    return ret;
}

function Rest(optionsOrUrl) {
    
    var url = typeof(optionsOrUrl) === 'string' ?
        optionsOrUrl :
        optionsOrUrl && optionsOrUrl.url;

    this.baseUrl = url;
    // Optional extraHeaders for all requests,
    // usually for authentication tokens
    this.extraHeaders = null;
}

Rest.prototype.get = function get(apiUrl, data) {
    return this.request(apiUrl, 'get', data);
};

Rest.prototype.put = function get(apiUrl, data) {
    return this.request(apiUrl, 'put', data);
};

Rest.prototype.post = function get(apiUrl, data) {
    return this.request(apiUrl, 'post', data);
};

Rest.prototype.delete = function get(apiUrl, data) {
    return this.request(apiUrl, 'delete', data);
};

Rest.prototype.putFile = function putFile(apiUrl, data) {
    // NOTE basic putFile implementation, one file, use fileUpload?
    return this.request(apiUrl, 'delete', data, 'multipart/form-data');
};

Rest.prototype.request = function request(apiUrl, httpMethod, data, contentType) {
    
    var thisRest = this;
    var url = this.baseUrl + apiUrl;

    return Promise.resolve($.ajax({
        url: url,
        // Avoid cache for data.
        cache: false,
        dataType: 'json',
        method: httpMethod,
        headers: this.extraHeaders,
        // URLENCODED input:
        // Convert to JSON and back just to ensure the values are converted/encoded
        // properly to be sent, like Dates being converted to ISO format.
        data: data && JSON.parse(JSON.stringify(data)),
        contentType: contentType || 'application/x-www-form-urlencoded'
        // Alternate: JSON as input
        //data: JSON.stringify(data),
        //contentType: contentType || 'application/json'
    }))
    .then(lowerCamelizeObject)
    .catch(function(err) {
        // On authorization error, give oportunity to retry the operation
        if (err.status === 401) {
            var retry = request.bind(this, apiUrl, httpMethod, data, contentType);
            var retryPromise = thisRest.onAuthorizationRequired(retry);
            if (retryPromise) {
                // It returned something, expecting is a promise:
                return Promise.resolve(retryPromise)
                .catch(function(){
                    // There is error on retry, just return the
                    // original call error
                    return err;
                });
            }
        }
        // by default, continue propagating the error
        return err;
    });
};

Rest.prototype.onAuthorizationRequired = function onAuthorizationRequired(retry) {
    // To be implemented outside, by default don't wait
    // for retry, just return nothing:
    return;
};

module.exports = Rest;

},{}],67:[function(require,module,exports){
/**
    Time class utility.
    Shorter way to create a Date instance
    specifying only the Time part,
    defaulting to current date or 
    another ready date instance.
**/
function Time(date, hour, minute, second) {
    if (!(date instanceof Date)) {
 
        second = minute;
        minute = hour;
        hour = date;
        
        date = new Date();   
    }

    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour || 0, minute || 0, second || 0);
}
module.exports = Time;

},{}],68:[function(require,module,exports){
/**
    Create an Access Control for an app that just checks
    the activity property for allowed user level.
    To be provided to Shell.js and used by the app.js,
    very tied to that both classes.
    
    Activities can define on its object an accessLevel
    property like next examples
    
    this.accessLevel = app.Usertype.User; // anyone
    this.accessLevel = app.UserType.Anonymous; // anonymous users only
    this.accessLevel = app.UserType.LoggedUser; // authenticated users only
**/
'use strict';

// UserType enumeration is bit based, so several
// users can has access in a single property
var UserType = require('../models/User').UserType;

module.exports = function createAccessControl(app) {
    
    return function accessControl(route) {

        var activity = app.getActivityControllerByRoute(route);

        var user = app.model.user();
        var currentType = user && user.userType();

        if (activity && activity.accessLevel) {

            var can = activity.accessLevel & currentType;
            
            if (!can) {
                // Notify error, why cannot access
                return {
                    requiredLevel: activity.accessLevel,
                    currentType: currentType
                };
            }
        }

        // Allow
        return null;
    };
};

},{"../models/User":56}],69:[function(require,module,exports){
'use strict';

var unwrap = function unwrap(value) {
    return (typeof(value) === 'function' ? value() : value);
};

exports.defineCrudApiForRest = function defineCrudApiForRest(settings) {
    
    var extendedObject = settings.extendedObject,
        Model = settings.Model,
        modelName = settings.modelName,
        modelListName = settings.modelListName,
        modelUrl = settings.modelUrl,
        idPropertyName = settings.idPropertyName;

    extendedObject['get' + modelListName] = function getList(filters) {
        
        return this.rest.get(modelUrl, filters)
        .then(function(rawItems) {
            return rawItems && rawItems.map(function(rawItem) {
                return new Model(rawItem);
            });
        });
    };
    
    extendedObject['get' + modelName] = function getItem(itemID) {
        
        return this.rest.get(modelUrl + '/' + itemID)
        .then(function(rawItem) {
            return rawItem && new Model(rawItem);
        });
    };

    extendedObject['post' + modelName] = function postItem(anItem) {
        
        return this.rest.post(modelUrl, anItem)
        .then(function(serverItem) {
            return new Model(serverItem);
        });
    };

    extendedObject['put' + modelName] = function putItem(anItem) {
        return this.rest.put(modelUrl + '/' + unwrap(anItem[idPropertyName]), anItem)
        .then(function(serverItem) {
            return new Model(serverItem);
        });
    };
    
    extendedObject['set' + modelName] = function setItem(anItem) {
        var id = unwrap(anItem[idPropertyName]);
        if (id)
            return this['put' + modelName](anItem);
        else
            return this['post' + modelName](anItem);
    };

    extendedObject['del' + modelName] = function delItem(anItem) {
        var id = anItem && unwrap(anItem[idPropertyName]) ||
                anItem;
        if (id)
            return this.rest.delete(modelUrl + '/' + id, anItem)
            .then(function(deletedItem) {
                return deletedItem && new Model(deletedItem);
            });
        else
            throw new Error('Need an ID or an object with the ID property to delete');
    };
};
},{}],70:[function(require,module,exports){
/**
    Bootknock: Set of Knockout Binding Helpers for Bootstrap js components (jquery plugins)
    
    Dependencies: jquery
    Injected dependencies: knockout
**/
'use strict';

// Dependencies
var $ = require('jquery');
// DI i18n library
exports.i18n = null;

function createHelpers(ko) {
    var helpers = {};

    /** Popover Binding **/
    helpers.popover = {
        update: function(element, valueAccessor, allBindings) {
            var srcOptions = ko.unwrap(valueAccessor());

            // Duplicating options object to pass to popover without
            // overwrittng source configuration
            var options = $.extend(true, {}, srcOptions);
            
            // Unwrapping content text
            options.content = ko.unwrap(srcOptions.content);
            
            if (options.content) {
            
                // Localize:
                options.content = 
                    exports.i18n && exports.i18n.t(options.content) ||
                    options.content;
                
                // To get the new options, we need destroy it first:
                $(element).popover('destroy').popover(options);

                // Se muestra si el elemento tiene el foco
                if ($(element).is(':focus'))
                    $(element).popover('show');

            } else {
                $(element).popover('destroy');
            }
        }
    };
    
    return helpers;
}

/**
    Plug helpers in the provided Knockout instance
**/
function plugIn(ko, prefix) {
    var name,
        helpers = createHelpers(ko);
    
    for(var h in helpers) {
        if (helpers.hasOwnProperty && !helpers.hasOwnProperty(h))
            continue;

        name = prefix ? prefix + h[0].toUpperCase() + h.slice(1) : h;
        ko.bindingHandlers[name] = helpers[h];
    }
}

exports.plugIn = plugIn;
exports.createBindingHelpers = createHelpers;

},{}],71:[function(require,module,exports){
/**
    Espace a string for use on a RegExp.
    Usually, to look for a string in a text multiple times
    or with some expressions, some common are 
    look for a text 'in the beginning' (^)
    or 'at the end' ($).
    
    Author: http://stackoverflow.com/users/151312/coolaj86 and http://stackoverflow.com/users/9410/aristotle-pagaltzis
    Link: http://stackoverflow.com/a/6969486
**/
'use strict';

// Referring to the table here:
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/regexp
// these characters should be escaped
// \ ^ $ * + ? . ( ) | { } [ ]
// These characters only have special meaning inside of brackets
// they do not need to be escaped, but they MAY be escaped
// without any adverse effects (to the best of my knowledge and casual testing)
// : ! , = 
// my test "~!@#$%^&*(){}[]`/=?+\|-_;:'\",<.>".match(/[\#]/g)

var specials = [
    // order matters for these
      "-"
    , "["
    , "]"
    // order doesn't matter for any of these
    , "/"
    , "{"
    , "}"
    , "("
    , ")"
    , "*"
    , "+"
    , "?"
    , "."
    , "\\"
    , "^"
    , "$"
    , "|"
  ]

  // I choose to escape every character with '\'
  // even though only some strictly require it when inside of []
, regex = RegExp('[' + specials.join('\\') + ']', 'g')
;

var escapeRegExp = function (str) {
return str.replace(regex, "\\$&");
};

module.exports = escapeRegExp;

// test escapeRegExp("/path/to/res?search=this.that")

},{}],72:[function(require,module,exports){
/**
* escapeSelector
*
* source: http://kjvarga.blogspot.com.es/2009/06/jquery-plugin-to-escape-css-selector.html
*
* Escape all special jQuery CSS selector characters in *selector*.
* Useful when you have a class or id which contains special characters
* which you need to include in a selector.
*/
'use strict';

var specials = [
  '#', '&', '~', '=', '>', 
  "'", ':', '"', '!', ';', ','
];
var regexSpecials = [
  '.', '*', '+', '|', '[', ']', '(', ')', '/', '^', '$'
];
var sRE = new RegExp(
  '(' + specials.join('|') + '|\\' + regexSpecials.join('|\\') + ')', 'g'
);

module.exports = function(selector) {
  return selector.replace(sRE, '\\$1');
};

},{}],73:[function(require,module,exports){
/**
    Read a page's GET URL variables and return them as an associative array.
**/
'user strict';
//global window

module.exports = function getUrlQuery(url) {

    url = url || window.location.href;

    var vars = [], hash,
        queryIndex = url.indexOf('?');
    if (queryIndex > -1) {
        var hashes = url.slice(queryIndex + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
    }
    return vars;
};

},{}],74:[function(require,module,exports){
/**
    Set of utilities to define Javascript Properties
    independently of the browser.
    
    Allows to define getters and setters.
    
    Adapted code from the original created by Jeff Walden
    http://whereswalden.com/2010/04/16/more-spidermonkey-changes-ancient-esoteric-very-rarely-used-syntax-for-creating-getters-and-setters-is-being-removed/
**/
'use strict';

function accessorDescriptor(field, fun)
{
    var desc = { enumerable: true, configurable: true };
    desc[field] = fun;
    return desc;
}

function defineGetter(obj, prop, get)
{
    if (Object.defineProperty)
        return Object.defineProperty(obj, prop, accessorDescriptor("get", get));
    if (Object.prototype.__defineGetter__)
        return obj.__defineGetter__(prop, get);

    throw new Error("browser does not support getters");
}

function defineSetter(obj, prop, set)
{
    if (Object.defineProperty)
        return Object.defineProperty(obj, prop, accessorDescriptor("set", set));
    if (Object.prototype.__defineSetter__)
        return obj.__defineSetter__(prop, set);

    throw new Error("browser does not support setters");
}

module.exports = {
    defineGetter: defineGetter,
    defineSetter: defineSetter
};

},{}],75:[function(require,module,exports){
/**
    DomItemsManager class, that manage a collection 
    of HTML/DOM items under a root/container, where
    only one element at the time is visible, providing
    tools to uniquerly identify the items,
    to create or update new items (through 'inject'),
    get the current, find by the ID and more.
**/
'use strict';

var $ = require('jquery');
var escapeSelector = require('../escapeSelector');

function DomItemsManager(settings) {

    this.idAttributeName = settings.idAttributeName || 'id';
    this.allowDuplicates = !!settings.allowDuplicates || false;
    this.$root = null;
    // On page ready, get the root element:
    $(function() {
        this.$root = $(settings.root || 'body');
    }.bind(this));
}

module.exports = DomItemsManager;

DomItemsManager.prototype.find = function find(containerName, root) {
    var $root = $(root || this.$root);
    return $root.find('[' + this.idAttributeName + '="' + escapeSelector(containerName) + '"]');
};

DomItemsManager.prototype.getActive = function getActive() {
    return this.$root.find('[' + this.idAttributeName + ']:visible');
};

/**
    It adds the item in the html provided (can be only the element or 
    contained in another or a full html page).
    Replaces any existant if duplicates are not allowed.
**/
DomItemsManager.prototype.inject = function inject(name, html) {

    // Filtering input html (can be partial or full pages)
    // http://stackoverflow.com/a/12848798
    html = html.replace(/^[\s\S]*<body.*?>|<\/body>[\s\S]*$/g, '');

    // Creating a wrapper around the html
    // (can be provided the innerHtml or outerHtml, doesn't matters with next approach)
    var $html = $('<div/>', { html: html }),
        // We look for the container element (when the outerHtml is provided)
        $c = this.find(name, $html);

    if ($c.length === 0) {
        // Its innerHtml, so the wrapper becomes the container itself
        $c = $html.attr(this.idAttributeName, name);
    }

    if (!this.allowDuplicates) {
        // No more than one container instance can exists at the same time
        // We look for any existent one and its replaced with the new
        var $prev = this.find(name);
        if ($prev.length > 0) {
            $prev.replaceWith($c);
            $c = $prev;
        }
    }

    // Add to the document
    // (on the case of duplicated found, this will do nothing, no worry)
    $c.appendTo(this.$root);
};

/** 
    The switch method receive the items to interchange as active or current,
    the 'from' and 'to', and the shell instance that MUST be used
    to notify each event that involves the item:
    willClose, willOpen, ready, opened, closed.
    It receives as latest parameter the 'notification' object that must be
    passed with the event so handlers has context state information.
    
    It's designed to be able to manage transitions, but this default
    implementation is as simple as 'show the new and hide the old'.
**/
DomItemsManager.prototype.switch = function switchActiveItem($from, $to, shell, notification) {

    if (!$to.is(':visible')) {
        shell.emit(shell.events.willOpen, $to, notification);
        $to.show();
        // Its enough visible and in DOM to perform initialization tasks
        // that may involve layout information
        shell.emit(shell.events.itemReady, $to, notification);
        // When its completely opened
        shell.emit(shell.events.opened, $to, notification);
    } else {
        // Its ready; maybe it was but sub-location
        // or state change need to be communicated
        shell.emit(shell.events.itemReady, $to, notification);
    }

    if ($from.is(':visible')) {
        shell.emit(shell.events.willClose, $from, notification);
        // Do 'unfocus' on the hidden element after notify 'willClose'
        // for better UX: hidden elements are not reachable and has good
        // side effects like hidding the on-screen keyboard if an input was
        // focused
        $from.find(':focus').blur();
        // hide and notify it ended
        $from.hide();
        shell.emit(shell.events.closed, $from, notification);
    }
};

/**
    Initializes the list of items. No more than one
    must be opened/visible at the same time, so at the 
    init all the elements are closed waiting to set
    one as the active or the current one.
**/
DomItemsManager.prototype.init = function init() {
    this.getActive().hide();
};

},{"../escapeSelector":72}],76:[function(require,module,exports){
/**
    Javascritp Shell for SPAs.
**/
/*global window, document */
'use strict';

/** DI entry points for default builds. Most dependencies can be
    specified in the constructor settings for per-instance setup.
**/
var deps = require('./dependencies');

/** Constructor **/

function Shell(settings) {
    //jshint maxcomplexity:14
    
    deps.EventEmitter.call(this);

    this.$ = settings.jquery || deps.jquery;
    this.$root = this.$(settings.root);
    this.baseUrl = settings.baseUrl || '';
    // With forceHashbang=true:
    // - fragments URLs cannot be used to scroll to an element (default browser behavior),
    //   they are defaultPrevented to avoid confuse the routing mechanism and current URL.
    // - pressed links to fragments URLs are not routed, they are skipped silently
    //   except when they are a hashbang (#!). This way, special links
    //   that performn js actions doesn't conflits.
    // - all URLs routed through the shell includes a hashbang (#!), the shell ensures
    //   that happens by appending the hashbang to any URL passed in (except the standard hash
    //   that are skipt).
    this.forceHashbang = settings.forceHashbang || false;
    this.linkEvent = settings.linkEvent || 'click';
    this.parseUrl = (settings.parseUrl || deps.parseUrl).bind(this, this.baseUrl);
    this.absolutizeUrl = (settings.absolutizeUrl || deps.absolutizeUrl).bind(this, this.baseUrl);

    this.history = settings.history || window.history;

    this.indexName = settings.indexName || 'index';
    
    this.items = settings.domItemsManager;

    // loader can be disabled passing 'null', so we must
    // ensure to not use the default on that cases:
    this.loader = typeof(settings.loader) === 'undefined' ? deps.loader : settings.loader;
    // loader setup
    if (this.loader)
        this.loader.baseUrl = this.baseUrl;

    // Definition of events that this object can trigger,
    // its value can be customized but any listener needs
    // to keep updated to the correct event string-name used.
    // The items manipulation events MUST be triggered
    // by the 'items.switch' function
    this.events = {
        willOpen: 'shell-will-open',
        willClose: 'shell-will-close',
        itemReady: 'shell-item-ready',
        closed: 'shell-closed',
        opened: 'shell-opened'
    };
    
    /**
        A function to decide if the
        access is allowed (returns 'null')
        or not (return a state object with information
        that will be passed to the 'nonAccessName' item;
        the 'route' property on the state is automatically filled).
        
        The default buit-in just allow everything 
        by just returning 'null' all the time.
        
        It receives as parameter the state object,
        that almost contains the 'route' property with
        information about the URL.
    **/
    this.accessControl = settings.accessControl || deps.accessControl;
    // What item load on non access
    this.nonAccessName = settings.nonAccessName || 'index';
}

// Shell inherits from EventEmitter
Shell.prototype = Object.create(deps.EventEmitter.prototype, {
    constructor: {
        value: Shell,
        enumerable: false,
        writable: true,
        configurable: true
    }
});

module.exports = Shell;


/** API definition **/

Shell.prototype.go = function go(url, state) {

    if (this.forceHashbang) {
        if (!/^#!/.test(url)) {
            url = '#!' + url;
        }
    }
    else {
        url = this.absolutizeUrl(url);
    }
    this.history.pushState(state, undefined, url);
    // pushState do NOT trigger the popstate event, so
    return this.replace(state);
};

Shell.prototype.goBack = function goBack(state, steps) {
    steps = 0 - (steps || 1);
    // If there is nothing to go-back or not enought
    // 'back' steps, go to the index
    if (steps < 0 && Math.abs(steps) >= this.history.length) {
        this.go(this.indexName);
    }
    else {
        // On replace, the passed state is merged with
        // the one that comes from the saved history
        // entry (it 'pops' when doing the history.go())
        this._pendingStateUpdate = state;
        this.history.go(steps);
    }
};

/**
    Process the given state in order to get the current state
    based on that or the saved in history, merge it with
    any updated state pending and adds the route information,
    returning an state object suitable to use.
**/
Shell.prototype.getUpdatedState = function getUpdatedState(state) {
    /*jshint maxcomplexity: 8 */
    
    // For current uses, any pendingStateUpdate is used as
    // the state, rather than the provided one
    state = this._pendingStateUpdate || state || this.history.state || {};
    
    // TODO: more advanced uses must be to use the 'state' to
    // recover the UI state, with any message from other UI
    // passing in a way that allow update the state, not
    // replace it (from pendingStateUpdate).
    /*
    // State or default state
    state = state || this.history.state || {};
    // merge pending updated state
    this.$.extend(state, this._pendingStateUpdate);
    // discard the update
    */
    this._pendingStateUpdate = null;
    
    // Doesn't matters if state includes already 
    // 'route' information, need to be overwritten
    // to match the current one.
    // NOTE: previously, a check prevented this if
    // route property exists, creating infinite loops
    // on redirections from activity.show since 'route' doesn't
    // match the new desired location
    
    // Detect if is a hashbang URL or an standard one.
    // Except if the app is forced to use hashbang.
    var isHashBang = /#!/.test(location.href) || this.forceHashbang;
    
    var link = (
        isHashBang ?
        location.hash :
        location.pathname
    ) + (location.search || '');
    
    // Set the route
    state.route = this.parseUrl(link);
    
    return state;
};

Shell.prototype.replace = function replace(state) {
    
    state = this.getUpdatedState(state);

    // Use the index on root calls
    if (state.route.root === true) {
        state.route = this.parseUrl(this.indexName);
    }
    
    // Access control
    var accessError = this.accessControl(state.route);
    if (accessError) {
        return this.go(this.nonAccessName, accessError);
    }

    // Locating the container
    var $cont = this.items.find(state.route.name);
    var shell = this;
    var promise = null;

    if ($cont && $cont.length) {
        promise = new Promise(function(resolve, reject) {
            try {

                var $oldCont = shell.items.getActive();
                $oldCont = $oldCont.not($cont);
                shell.items.switch($oldCont, $cont, shell, state);

                resolve(); //? resolve(act);
            }
            catch (ex) {
                reject(ex);
            }
        });
    }
    else {
        if (this.loader) {
            // load and inject the content in the page
            // then try the replace again
            promise = this.loader.load(state.route).then(function(html) {
                // Add to the items (the manager takes care you
                // add only the item, if there is one)
                shell.items.inject(state.route.name, html);
                // Double check that the item was added and is ready
                // to avoid an infinite loop because a request not returning
                // the item and the 'replace' trying to load it again, and again, and..
                if (shell.items.find(state.route.name).length)
                    return shell.replace(state);
            });
        }
        else {
            var err = new Error('Page not found (' + state.route.name + ')');
            console.warn('Shell Page not found, state:', state);
            promise = Promise.reject(err);
            
            // To avoid being in an inexistant URL (generating inconsistency between
            // current view and URL, creating bad history entries),
            // a goBack is executed, just after the current pipe ends
            // TODO: implement redirect that cut current processing rather than execute delayed
            setTimeout(function() {
                this.goBack();
            }.bind(this), 1);
        }
    }
    
    var thisShell = this;
    promise.catch(function(err) {
        if (!(err instanceof Error))
            err = new Error(err);

        // Log error, 
        console.error('Shell, unexpected error.', err);
        // notify as an event
        thisShell.emit('error', err);
        // and continue propagating the error
        return err;
    });

    return promise;
};

Shell.prototype.run = function run() {

    var shell = this;

    // Catch popstate event to update shell replacing the active container.
    // Allows polyfills to provide a different but equivalent event name
    this.$(window).on(this.history.popstateEvent || 'popstate', function(event) {
        
        var state = event.state || 
            (event.originalEvent && event.originalEvent.state) || 
            shell.history.state;

        // get state for current. To support polyfills, we use the general getter
        // history.state as fallback (they must be the same on browsers supporting History API)
        shell.replace(state);
    });

    // Catch all links in the page (not only $root ones) and like-links
    this.$(document).on(this.linkEvent, '[href], [data-href]', function(e) {
        
        var $t = shell.$(this),
            href = $t.attr('href') || $t.data('href');

        // Do nothing if the URL contains the protocol
        if (/^[a-z]+:/i.test(href)) {
            return;
        }
        else if (shell.forceHashbang && /^#([^!]|$)/.test(href)) {
            // Standard hash, but not hashbang: avoid routing and default behavior
            e.preventDefault();
            return;
        }

        e.preventDefault();
        //? e.stopImmediatePropagation();

        // Executed delayed to avoid handler collisions, because
        // of the new page modifying the element and other handlers
        // reading it attributes and applying logic on the updated link
        // as if was the old one (example: shared links, like in a
        // global navbar, that modifies with the new page).
        setTimeout(function() {
            shell.go(href);
        }, 1);
    });

    // Initiallize state
    this.items.init();
    // Route to the current url/state
    this.replace();
};

},{"./dependencies":78}],77:[function(require,module,exports){
/**
    absolutizeUrl utility 
    that ensures the url provided
    being in the path of the given baseUrl
**/
'use strict';

var sanitizeUrl = require('./sanitizeUrl'),
    escapeRegExp = require('../escapeRegExp');

function absolutizeUrl(baseUrl, url) {

    // sanitize before check
    url = sanitizeUrl(url);

    // Check if use the base already
    var matchBase = new RegExp('^' + escapeRegExp(baseUrl), 'i');
    if (matchBase.test(url)) {
        return url;
    }

    // build and sanitize
    return sanitizeUrl(baseUrl + url);
}

module.exports = absolutizeUrl;

},{"../escapeRegExp":71,"./sanitizeUrl":83}],78:[function(require,module,exports){
/**
    External dependencies for Shell in a separate module
    to use as DI, needs setup before call the Shell.js
    module class
**/
'use strict';

module.exports = {
    parseUrl: null,
    absolutizeUrl: null,
    jquery: null,
    loader: null,
    accessControl: function allowAll(name) {
        // allow access by default
        return null;
    },
    EventEmitter: null
};

},{}],79:[function(require,module,exports){
/**
    Simple implementation of the History API using only hashbangs URLs,
    doesn't matters the browser support.
    Used to avoid from setting URLs that has not an end-point,
    like in local environments without a server doing url-rewriting,
    in phonegap apps, or to completely by-pass browser support because
    is buggy (like Android <= 4.1).
    
    NOTES:
    - Browser must support 'hashchange' event.
    - Browser must has support for standard JSON class.
    - Relies on sessionstorage for persistance, supported by all browsers and webviews 
      for a enough long time now.
    - Similar approach as History.js polyfill, but simplified, appending a fake query
      parameter '_suid=0' to the hash value (actual query goes before the hash, but
      we need it inside).
    - For simplification, only the state is persisted, the 'title' parameter is not
      used at all (the same as major browsers do, so is not a problem); in this line,
      only history entries with state are persisted.
**/
//global location
'use strict';
var $ = require('jquery'),
    sanitizeUrl = require('./sanitizeUrl'),
    getUrlQuery = require('../getUrlQuery');

// Init: Load saved copy from sessionStorage
var session = sessionStorage.getItem('hashbangHistory.store');
// Or create a new one
if (!session) {
    session = {
        // States array where each index is the SUID code and the
        // value is just the value passed as state on pushState/replaceState
        states: []
    };
}
else {
    session = JSON.parse(session);
}


/**
    Get the SUID number
    from a hash string
**/
function getSuid(hash) {
    
    var suid = +getUrlQuery(hash)._suid;
    if (isNaN(suid))
        return null;
    else
        return suid;
}

function setSuid(hash, suid) {
    
    // We need the query, since we need 
    // to replace the _suid (may exist)
    // and recreate the query in the
    // returned hash-url
    var qs = getUrlQuery(hash);
    qs.push('_suid');
    qs._suid = suid;

    var query = [];
    for(var i = 0; i < qs.length; i++) {
        query.push(qs[i] + '=' + encodeURIComponent(qs[qs[i]]));
    }
    query = query.join('&');
    
    if (query) {
        var index = hash.indexOf('?');
        if (index > -1)
            hash = hash.substr(0, index);
        hash += '?' + query;
    }

    return hash;
}

/**
    Ask to persist the session data.
    It is done with a timeout in order to avoid
    delay in the current task mainly any handler
    that acts after a History change.
**/
function persist() {
    // Enough time to allow routing tasks,
    // most animations from finish and the UI
    // being responsive.
    // Because sessionStorage is synchronous.
    setTimeout(function() {
        sessionStorage.setItem('hashbangHistory.store', JSON.stringify(session));
    }, 1500);
}

/**
    Returns the given state or null
    if is an empty object.
**/
function checkState(state) {
    
    if (state) {
        // is empty?
        for(var i in state) {
            // No
            return state;
        }
        // its empty
        return null;
    }
    // Anything else
    return state;
}

/**
    Get a canonical representation
    of the URL so can be compared
    with success.
**/
function cannonicalUrl(url) {
    
    // Avoid some bad or problematic syntax
    url = sanitizeUrl(url || '');
    
    // Get the hash part
    var ihash = url.indexOf('#');
    if (ihash > -1) {
        url = url.substr(ihash + 1);
    }
    // Maybe a hashbang URL, remove the
    // 'bang' (the hash was removed already)
    url = url.replace(/^!/, '');

    return url;
}

/**
    Tracks the latest URL
    being pushed or replaced by
    the API.
    This allows later to avoid
    trigger the popstate event,
    since must NOT be triggered
    as a result of that API methods
**/
var latestPushedReplacedUrl = null;

/**
    History Polyfill
**/
var hashbangHistory = {
    pushState: function pushState(state, title, url) {

        // cleanup url
        url = cannonicalUrl(url);
        
        // save new state for url
        state = checkState(state) || null;
        if (state !== null) {
            // save state
            session.states.push(state);
            var suid = session.states.length - 1;
            // update URL with the suid
            url = setSuid(url, suid);
            // call to persist the updated session
            persist();
        }
        
        latestPushedReplacedUrl = url;
        
        // update location to track history:
        location.hash = '#!' + url;
    },
    replaceState: function replaceState(state, title, url) {
        
        // cleanup url
        url = cannonicalUrl(url);
        
        // it has saved state?
        var suid = getSuid(url),
            hasOldState = suid !== null;

        // save new state for url
        state = checkState(state) || null;
        // its saved if there is something to save
        // or something to destroy
        if (state !== null || hasOldState) {
            // save state
            if (hasOldState) {
                // replace existing state
                session.states[suid] = state;
                // the url remains the same
            }
            else {
                // create state
                session.states.push(state);
                suid = session.states.length - 1;
                // update URL with the suid
                url = setSuid(url, suid);
            }
            // call to persist the updated session
            persist();
        }
        
        latestPushedReplacedUrl = url;

        // update location to track history:
        location.hash = '#!' + url;
    },
    get state() {
        
        var suid = getSuid(location.hash);
        return (
            suid !== null ?
            session.states[suid] :
            null
        );
    },
    get length() {
        return window.history.length;
    },
    go: function go(offset) {
        window.history.go(offset);
    },
    back: function back() {
        window.history.back();
    },
    forward: function forward() {
        window.history.forward();
    }
};

// Attach hashcange event to trigger History API event 'popstate'
var $w = $(window);
$w.on('hashchange', function(e) {
    
    var url = e.originalEvent.newURL;
    url = cannonicalUrl(url);
    
    // An URL being pushed or replaced
    // must NOT trigger popstate
    if (url === latestPushedReplacedUrl)
        return;
    
    // get state from history entry
    // for the updated URL, if any
    // (can have value when traversing
    // history).
    var suid = getSuid(url),
        state = null;
    
    if (suid !== null)
        state = session.states[suid];

    $w.trigger(new $.Event('popstate', {
        state: state
    }), 'hashbangHistory');
});

// For HistoryAPI capable browsers, we need
// to capture the native 'popstate' event that
// gets triggered on our push/replaceState because
// of the location change, but too on traversing
// the history (back/forward).
// We will lock the event except when is
// the one we trigger.
//
// NOTE: to this trick to work, this must
// be the first handler attached for this
// event, so can block all others.
// ALTERNATIVE: instead of this, on the
// push/replaceState methods detect if
// HistoryAPI is native supported and
// use replaceState there rather than
// a hash change.
$w.on('popstate', function(e, source) {
    
    // Ensuring is the one we trigger
    if (source === 'hashbangHistory')
        return;
    
    // In other case, block:
    e.preventDefault();
    e.stopImmediatePropagation();
});

// Expose API
module.exports = hashbangHistory;

},{"../getUrlQuery":73,"./sanitizeUrl":83}],80:[function(require,module,exports){
/**
    Default build of the Shell component.
    It returns the Shell class as a module property,
    setting up the built-in modules as its dependencies,
    and the external 'jquery' and 'events' (for the EventEmitter).
    It returns too the built-it DomItemsManager class as a property for convenience.
**/
'use strict';

var deps = require('./dependencies'),
    DomItemsManager = require('./DomItemsManager'),
    parseUrl = require('./parseUrl'),
    absolutizeUrl = require('./absolutizeUrl'),
    $ = require('jquery'),
    loader = require('./loader'),
    EventEmitter = require('events').EventEmitter;

$.extend(deps, {
    parseUrl: parseUrl,
    absolutizeUrl: absolutizeUrl,
    jquery: $,
    loader: loader,
    EventEmitter: EventEmitter
});

// Dependencies are ready, we can load the class:
var Shell = require('./Shell');

exports.Shell = Shell;
exports.DomItemsManager = DomItemsManager;

},{"./DomItemsManager":75,"./Shell":76,"./absolutizeUrl":77,"./dependencies":78,"./loader":81,"./parseUrl":82,"events":false}],81:[function(require,module,exports){
/**
    Loader utility to load Shell items on demand with AJAX
**/
'use strict';

var $ = require('jquery');

module.exports = {
    
    baseUrl: '/',
    
    load: function load(route) {
        return new Promise(function(resolve, reject) {
            console.log('LOADER PROMISE', route, route.name);
            resolve('');
            /*$.ajax({
                url: module.exports.baseUrl + route.name + '.html',
                cache: false
                // We are loading the program and no loader screen in place,
                // so any in between interaction will be problematic.
                //async: false
            }).then(resolve, reject);*/
        });
    }
};

},{}],82:[function(require,module,exports){
/**
    parseUrl function detecting
    the main parts of the URL in a
    convenience way for routing.
**/
'use strict';

var getUrlQuery = require('../getUrlQuery'),
    escapeRegExp = require('../escapeRegExp');

function parseUrl(baseUrl, link) {

    link = link || '';

    var rawUrl = link;

    // hashbang support: remove the #! or single # and use the rest as the link
    link = link.replace(/^#!/, '').replace(/^#/, '');
    
    // remove optional initial slash or dot-slash
    link = link.replace(/^\/|^\.\//, '');

    // URL Query as an object, empty object if no query
    var query = getUrlQuery(link || '?');

    // remove query from the rest of URL to parse
    link = link.replace(/\?.*$/, '');

    // Remove the baseUrl to get the app base.
    var path = link.replace(new RegExp('^' + escapeRegExp(baseUrl), 'i'), '');

    // Get first segment or page name (anything until a slash or extension beggining)
    var match = /^\/?([^\/\.]+)[^\/]*(\/.*)*$/.exec(path);

    var parsed = {
        root: true,
        name: null,
        segments: null,
        path: null,
        url: rawUrl,
        query: query
    };

    if (match) {
        parsed.root = false;
        if (match[1]) {
            parsed.name = match[1];

            if (match[2]) {
                parsed.path = match[2];
                parsed.segments = match[2].replace(/^\//, '').split('/');
            }
            else {
                parsed.path = '/';
                parsed.segments = [];
            }
        }
    }

    return parsed;
}

module.exports = parseUrl;
},{"../escapeRegExp":71,"../getUrlQuery":73}],83:[function(require,module,exports){
/**
    sanitizeUrl utility that ensures
    that problematic parts get removed.
    
    As for now it does:
    - removes parent directory syntax
    - removes duplicated slashes
**/
'use strict';

function sanitizeUrl(url) {
    return url.replace(/\.{2,}/g, '').replace(/\/{2,}/g, '/');
}

module.exports = sanitizeUrl;
},{}],84:[function(require,module,exports){
/** AppModel extension,
    focused on the Events API
**/
'use strict';
var CalendarEvent = require('../models/CalendarEvent'),
    apiHelper = require('../utils/apiHelper');

exports.plugIn = function (AppModel) {
    
    apiHelper.defineCrudApiForRest({
        extendedObject: AppModel.prototype,
        Model: CalendarEvent,
        modelName: 'CalendarEvent',
        modelListName: 'CalendarEvents',
        modelUrl: 'events',
        idPropertyName: 'calendarEventID'
    });
    
    /** # API
        AppModel.prototype.getEvents::
        @param {object} filters: {
            start: Date,
            end: Date,
            types: [3, 5] // [optional] List EventTypesIDs
        }
        ---
        AppModel.prototype.getEvent
        ---
        AppModel.prototype.putEvent
        ---
        AppModel.prototype.postEvent
        ---
        AppModel.prototype.delEvent
        ---
        AppModel.prototype.setEvent
    **/
};
},{"../models/CalendarEvent":43,"../utils/apiHelper":69}],85:[function(require,module,exports){
/**
    Model API to manage the collection of Job Titles assigned
    to the current user and its working data.
**/
'use strict';

exports.plugIn = function (AppModel) {
    
    /**
        Get the complete list of UserJobTitle for
        all the JobTitles assigned to the current user
    **/
    AppModel.prototype.getUserJobProfile = function () {
        // TODO
        // Test data
        return Promise.resolve(
            []
        );
    };
    
    /**
        Get a UserJobTitle record for the given
        JobTitleID and the current user.
    **/
    AppModel.prototype.getUserJobTitle = function (jobTitleID) {
        // TODO
        return Promise.resolve(null);
    };
};

},{}],86:[function(require,module,exports){
/** AppModel, centralizes all the data for the app,
    caching and sharing data across activities and performing
    requests
**/
var ko = require('knockout'),
    Model = require('../models/Model'),
    User = require('../models/User'),
    Rest = require('../utils/Rest'),
    localforage = require('localforage');

function AppModel(values) {

    Model(this);
    
    this.model.defProperties({
        user: User.newAnonymous()
    }, values);
}

/** Initialize and wait for anything up **/
AppModel.prototype.init = function init() {
    
    // NOTE: URL to be updated
    this.rest = new Rest('http://dev.loconomics.com/en-US/rest/');
    //this.rest = new Rest('http://localhost/source/en-US/rest/');
    
    // Setup Rest authentication
    this.rest.onAuthorizationRequired = function(retry) {
        
        this.tryLogin()
        .then(function() {
            // Logged! Just retry
            retry();
        });
    }.bind(this);
    
    // Local data
    // TODO Investigate why automatic selection an IndexedDB are
    // failing and we need to use the worse-performance localstorage back-end
    localforage.config({
        name: 'LoconomicsApp',
        version: 0.1,
        size : 4980736, // Size of database, in bytes. WebSQL-only for now.
        storeName : 'keyvaluepairs',
        description : 'Loconomics App',
        driver: localforage.LOCALSTORAGE
    });

    // Initialize: check the user has login data and needed
    // cached data
    return new Promise(function(resolve, reject) {

        // Callback to just resolve without error (passing in the error
        // to the 'resolve' will make the process to fail),
        // since we don't need to create an error for the
        // app init, if there is not enough saved information
        // the app has code to request a login.
        var resolveAnyway = function(doesnMatter){        
            console.warning('App Model Init err', doesnMatter);
            resolve();
        };
        
        // If there are credentials saved
        localforage.getItem('credentials').then(function(credentials) {

            if (credentials &&
                credentials.userID &&
                credentials.username &&
                credentials.authKey) {

                // use authorization key for each
                // new Rest request
                this.rest.extraHeaders = {
                    alu: credentials.userID,
                    alk: credentials.authKey
                };
                
                // It has credentials! Has basic profile data?
                localforage.getItem('profile').then(function(profile) {
                    if (profile) {
                        // Set user data
                        this.user().model.updateWith(profile);
                        // End succesfully
                        resolve();
                    }
                    else {
                        // No profile, we need to request it to be able
                        // to work correctly, so we
                        // attempt a login (the tryLogin process performs
                        // a login with the saved credentials and fetch
                        // the profile to save it in the local copy)
                        this.tryLogin().then(resolve, resolveAnyway);
                    }
                }.bind(this), resolveAnyway);
            }
            else {
                // End successfully. Not loggin is not an error,
                // is just the first app start-up
                resolve();
            }
        }.bind(this), resolveAnyway);
    }.bind(this));
};

/**
    Account methods
**/
AppModel.prototype.tryLogin = function tryLogin() {
    // Get saved credentials
    return localforage.getItem('credentials')
    .then(function(credentials) {
        // If we have ones, try to log-in
        if (credentials) {
            // Attempt login with that
            return this.login(
                credentials.username,
                credentials.password
            );
        } else {
            throw new Error('No saved credentials');
        }
    }.bind(this));
};

AppModel.prototype.login = function login(username, password) {

    // Reset the extra headers to attempt the login
    this.rest.extraHeaders = null;

    return this.rest.post('login', {
        username: username,
        password: password,
        returnProfile: true
    }).then(function(logged) {

        // use authorization key for each
        // new Rest request
        this.rest.extraHeaders = {
            alu: logged.userId,
            alk: logged.authKey
        };

        // async local save, don't wait
        localforage.setItem('credentials', {
            userID: logged.userId,
            username: username,
            password: password,
            authKey: logged.authKey
        });
        localforage.setItem('profile', logged.profile);

        // Set user data
        this.user().model.updateWith(logged.profile);

        return logged;
    }.bind(this));
};

AppModel.prototype.logout = function logout() {

    // Local app close session
    this.rest.extraHeaders = null;
    localforage.removeItem('credentials');
    localforage.removeItem('profile');
    
    // Don't need to wait the result of the REST operation
    this.rest.post('logout');
    
    return Promise.resolve();
};

AppModel.prototype.signup = function signup(username, password, profileType) {
    
    // Reset the extra headers to attempt the signup
    this.rest.extraHeadres = null;
    
    return this.rest.post('signup?utm_source=app', {
        username: username,
        password: password,
        profileType: profileType,
        returnProfile: true
    }).then(function(logged) {
        // The result is the same as in a login, and
        // we do the same as there to get the user logged
        // on the app on sign-up success.
        
        // use authorization key for each
        // new Rest request
        this.rest.extraHeaders = {
            alu: logged.userId,
            alk: logged.authKey
        };

        // async local save, don't wait
        localforage.setItem('credentials', {
            userID: logged.userId,
            username: username,
            password: password,
            authKey: logged.authKey
        });
        localforage.setItem('profile', logged.profile);

        // Set user data
        this.user().model.updateWith(logged.profile);

        return logged;
    }.bind(this));
};

AppModel.prototype.getUpcomingBookings = function getUpcomingBookings() {
    return this.rest.get('upcoming-bookings');
};

AppModel.prototype.getBooking = function getBooking(id) {
    return this.rest.get('get-booking', { bookingID: id });
};

module.exports = AppModel;

// Class splited in different files to mitigate size and organization
// but keeping access to the common set of methods and objects easy with
// the same class.
// Loading extensions:
require('./AppModel-events').plugIn(AppModel);
require('./AppModel-userJobProfile').plugIn(AppModel);

},{"../models/Model":51,"../models/User":56,"../utils/Rest":66,"./AppModel-events":84,"./AppModel-userJobProfile":85,"knockout":false,"localforage":false}],87:[function(require,module,exports){
/**
    Simple View Model with main credentials for
    use in a form, with validation.
    Used by Login and Signup activities
**/
'use strict';

var ko = require('knockout');

function FormCredentials() {

    this.username = ko.observable('');
    this.password = ko.observable('');
    
    // validate username as an email
    var emailRegexp = /^[-0-9A-Za-z!#$%&'*+/=?^_`{|}~.]+@[-0-9A-Za-z!#$%&'*+/=?^_`{|}~.]+$/;
    this.username.error = ko.observable('');
    this.username.subscribe(function(v) {
        if (v) {
            if (emailRegexp.test(v)) {
                this.username.error('');
            }
            else {
                this.username.error('Is not a valid email');
            }
        }
        else {
            this.username.error('Required');
        }
    }.bind(this));
    
    // required password
    this.password.error = ko.observable('');
    this.password.subscribe(function(v) {
        var err = '';
        if (!v)
            err = 'Required';
        
        this.password.error(err);
    }.bind(this));
}

module.exports = FormCredentials;

},{"knockout":false}],88:[function(require,module,exports){
/** NavAction view model.
    It allows set-up per activity for the AppNav action button.
**/
var ko = require('knockout'),
    Model = require('../models/Model');

function NavAction(values) {
    
    Model(this);
    
    this.model.defProperties({
        link: '',
        icon: '',
        text: '',
        // 'Test' is the header title but placed in the button/action
        isTitle: false,
        // 'Link' is the element ID of a modal (starts with a #)
        isModal: false,
        // 'Link' is a Shell command, like 'goBack 2'
        isShell: false,
        // Set if the element is a menu button, in that case 'link'
        // will be the ID of the menu (contained in the page; without the hash), using
        // the text and icon but special meaning for the text value 'menu'
        // on icon property that will use the standard menu icon.
        isMenu: false
    }, values);
}

module.exports = NavAction;

// Set of view utilities to get the link for the expected html attributes

NavAction.prototype.getHref = function getHref() {
    return (
        (this.isMenu() || this.isModal() || this.isShell()) ?
        '#' :
        this.link()
    );
};

NavAction.prototype.getModalTarget = function getModalTarget() {
    return (
        (this.isMenu() || !this.isModal() || this.isShell()) ?
        '' :
        this.link()
    );
};

NavAction.prototype.getShellCommand = function getShellCommand() {
    return (
        (this.isMenu() || !this.isShell()) ?
        '' :
        this.link()
    );
};

NavAction.prototype.getMenuID = function getMenuID() {
    return (
        (!this.isMenu()) ?
        '' :
        this.link()
    );
};

NavAction.prototype.getMenuLink = function getMenuLink() {
    return (
        (!this.isMenu()) ?
        '' :
        '#' + this.link()
    );
};

/** Static, shared actions **/
NavAction.goHome = new NavAction({
    link: '/',
    icon: 'glyphicon glyphicon-home'
});

NavAction.goBack = new NavAction({
    link: 'goBack',
    icon: 'glyphicon glyphicon-arrow-left',
    isShell: true
});

// TODO TO REMOVE, Example of modal
NavAction.newItem = new NavAction({
    link: '#newItem',
    icon: 'glyphicon glyphicon-plus',
    isModal: true
});

NavAction.menuIn = new NavAction({
    link: 'menuIn',
    icon: 'menu',
    isMenu: true
});

NavAction.menuOut = new NavAction({
    link: 'menuOut',
    icon: 'menu',
    isMenu: true
});

NavAction.menuNewItem = new NavAction({
    link: 'menuNewItem',
    icon: 'glyphicon glyphicon-plus',
    isMenu: true
});

NavAction.goHelpIndex = new NavAction({
    link: '#helpIndex',
    text: 'help',
    isModal: true
});

NavAction.goLogin = new NavAction({
    link: '/login',
    text: 'log-in'
});

NavAction.goLogout = new NavAction({
    link: '/logout',
    text: 'log-out'
});

NavAction.goSignup = new NavAction({
    link: '/signup',
    text: 'sign-up'
});

},{"../models/Model":51,"knockout":false}],89:[function(require,module,exports){
/** NavBar view model.
    It allows customize the NavBar per activity.
**/
var ko = require('knockout'),
    Model = require('../models/Model'),
    NavAction = require('./NavAction');

function NavBar(values) {
    
    Model(this);
    
    this.model.defProperties({
        // Title showed in the center
        // When the title is 'null', the app logo is showed in place,
        // on empty text, the empty text is showed and no logo.
        title: '',
        // NavAction instance:
        leftAction: null,
        // NavAction instance:
        rightAction: null
    }, values);
}

module.exports = NavBar;

},{"../models/Model":51,"./NavAction":88,"knockout":false}]},{},[35])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvbm9kZV9tb2R1bGVzL251bWVyYWwvbnVtZXJhbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYWNjb3VudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYXBwb2ludG1lbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2Jvb2tpbmdDb25maXJtYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2NhbGVuZGFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9jbGllbnRFZGl0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9jbGllbnRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9jbXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2NvbnRhY3RGb3JtLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9jb250YWN0SW5mby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY29udmVyc2F0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9kYXRldGltZVBpY2tlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvZmFxcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvZmVlZGJhY2suanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2ZlZWRiYWNrRm9ybS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvaG9tZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvaW5ib3guanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2luZGV4LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9qb2J0aXRsZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2xlYXJuTW9yZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvbG9jYXRpb25FZGl0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9sb2NhdGlvbnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2xvZ2luLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9sb2dvdXQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL29uYm9hcmRpbmdDb21wbGV0ZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvb25ib2FyZGluZ0hvbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL29uYm9hcmRpbmdQb3NpdGlvbnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL3NjaGVkdWxpbmcuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL3NlcnZpY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9zaWdudXAuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL3RleHRFZGl0b3IuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hcHAtY29tcG9uZW50cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FwcC1uYXZiYXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hcHAuYWN0aXZpdGllcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FwcC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FwcC5zaGVsbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2NvbXBvbmVudHMvQWN0aXZpdHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9jb21wb25lbnRzL0RhdGVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9jb21wb25lbnRzL1NtYXJ0TmF2QmFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbG9jYWxlcy9lbi1VUy1MQy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9BcHBvaW50bWVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9Cb29raW5nU3VtbWFyeS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9DYWxlbmRhckV2ZW50LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0NhbGVuZGFyU2xvdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9DbGllbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvR2V0TW9yZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9MaXN0Vmlld0l0ZW0uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvTG9jYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvTWFpbEZvbGRlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9NZXNzYWdlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL01vZGVsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1BlcmZvcm1hbmNlU3VtbWFyeS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9Qb3NpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9TZXJ2aWNlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1VwY29taW5nQm9va2luZ3NTdW1tYXJ5LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1VzZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9jYWxlbmRhckFwcG9pbnRtZW50cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3Rlc3RkYXRhL2NhbGVuZGFyU2xvdHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9jbGllbnRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdGVzdGRhdGEvbG9jYXRpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdGVzdGRhdGEvbWVzc2FnZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9zZXJ2aWNlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3Rlc3RkYXRhL3RpbWVTbG90cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL0Z1bmN0aW9uLnByb3RvdHlwZS5fZGVsYXllZC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL0Z1bmN0aW9uLnByb3RvdHlwZS5faW5oZXJpdHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9SZXN0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvVGltZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL2FjY2Vzc0NvbnRyb2wuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9hcGlIZWxwZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9ib290a25vY2tCaW5kaW5nSGVscGVycy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL2VzY2FwZVJlZ0V4cC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL2VzY2FwZVNlbGVjdG9yLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvZ2V0VXJsUXVlcnkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9qc1Byb3BlcnRpZXNUb29scy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL0RvbUl0ZW1zTWFuYWdlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL1NoZWxsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvc2hlbGwvYWJzb2x1dGl6ZVVybC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL2RlcGVuZGVuY2llcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL2hhc2hiYW5nSGlzdG9yeS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL2luZGV4LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvc2hlbGwvbG9hZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvc2hlbGwvcGFyc2VVcmwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9zYW5pdGl6ZVVybC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwtZXZlbnRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9BcHBNb2RlbC11c2VySm9iUHJvZmlsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0Zvcm1DcmVkZW50aWFscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvTmF2QWN0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9OYXZCYXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdnFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1V0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIG51bWVyYWwuanNcbiAqIHZlcnNpb24gOiAxLjUuM1xuICogYXV0aG9yIDogQWRhbSBEcmFwZXJcbiAqIGxpY2Vuc2UgOiBNSVRcbiAqIGh0dHA6Ly9hZGFtd2RyYXBlci5naXRodWIuY29tL051bWVyYWwtanMvXG4gKi9cblxuKGZ1bmN0aW9uICgpIHtcblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgQ29uc3RhbnRzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgdmFyIG51bWVyYWwsXG4gICAgICAgIFZFUlNJT04gPSAnMS41LjMnLFxuICAgICAgICAvLyBpbnRlcm5hbCBzdG9yYWdlIGZvciBsYW5ndWFnZSBjb25maWcgZmlsZXNcbiAgICAgICAgbGFuZ3VhZ2VzID0ge30sXG4gICAgICAgIGN1cnJlbnRMYW5ndWFnZSA9ICdlbicsXG4gICAgICAgIHplcm9Gb3JtYXQgPSBudWxsLFxuICAgICAgICBkZWZhdWx0Rm9ybWF0ID0gJzAsMCcsXG4gICAgICAgIC8vIGNoZWNrIGZvciBub2RlSlNcbiAgICAgICAgaGFzTW9kdWxlID0gKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKTtcblxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBDb25zdHJ1Y3RvcnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIC8vIE51bWVyYWwgcHJvdG90eXBlIG9iamVjdFxuICAgIGZ1bmN0aW9uIE51bWVyYWwgKG51bWJlcikge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IG51bWJlcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbXBsZW1lbnRhdGlvbiBvZiB0b0ZpeGVkKCkgdGhhdCB0cmVhdHMgZmxvYXRzIG1vcmUgbGlrZSBkZWNpbWFsc1xuICAgICAqXG4gICAgICogRml4ZXMgYmluYXJ5IHJvdW5kaW5nIGlzc3VlcyAoZWcuICgwLjYxNSkudG9GaXhlZCgyKSA9PT0gJzAuNjEnKSB0aGF0IHByZXNlbnRcbiAgICAgKiBwcm9ibGVtcyBmb3IgYWNjb3VudGluZy0gYW5kIGZpbmFuY2UtcmVsYXRlZCBzb2Z0d2FyZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0b0ZpeGVkICh2YWx1ZSwgcHJlY2lzaW9uLCByb3VuZGluZ0Z1bmN0aW9uLCBvcHRpb25hbHMpIHtcbiAgICAgICAgdmFyIHBvd2VyID0gTWF0aC5wb3coMTAsIHByZWNpc2lvbiksXG4gICAgICAgICAgICBvcHRpb25hbHNSZWdFeHAsXG4gICAgICAgICAgICBvdXRwdXQ7XG4gICAgICAgICAgICBcbiAgICAgICAgLy9yb3VuZGluZ0Z1bmN0aW9uID0gKHJvdW5kaW5nRnVuY3Rpb24gIT09IHVuZGVmaW5lZCA/IHJvdW5kaW5nRnVuY3Rpb24gOiBNYXRoLnJvdW5kKTtcbiAgICAgICAgLy8gTXVsdGlwbHkgdXAgYnkgcHJlY2lzaW9uLCByb3VuZCBhY2N1cmF0ZWx5LCB0aGVuIGRpdmlkZSBhbmQgdXNlIG5hdGl2ZSB0b0ZpeGVkKCk6XG4gICAgICAgIG91dHB1dCA9IChyb3VuZGluZ0Z1bmN0aW9uKHZhbHVlICogcG93ZXIpIC8gcG93ZXIpLnRvRml4ZWQocHJlY2lzaW9uKTtcblxuICAgICAgICBpZiAob3B0aW9uYWxzKSB7XG4gICAgICAgICAgICBvcHRpb25hbHNSZWdFeHAgPSBuZXcgUmVnRXhwKCcwezEsJyArIG9wdGlvbmFscyArICd9JCcpO1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2Uob3B0aW9uYWxzUmVnRXhwLCAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRm9ybWF0dGluZ1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIC8vIGRldGVybWluZSB3aGF0IHR5cGUgb2YgZm9ybWF0dGluZyB3ZSBuZWVkIHRvIGRvXG4gICAgZnVuY3Rpb24gZm9ybWF0TnVtZXJhbCAobiwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgIHZhciBvdXRwdXQ7XG5cbiAgICAgICAgLy8gZmlndXJlIG91dCB3aGF0IGtpbmQgb2YgZm9ybWF0IHdlIGFyZSBkZWFsaW5nIHdpdGhcbiAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCckJykgPiAtMSkgeyAvLyBjdXJyZW5jeSEhISEhXG4gICAgICAgICAgICBvdXRwdXQgPSBmb3JtYXRDdXJyZW5jeShuLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdC5pbmRleE9mKCclJykgPiAtMSkgeyAvLyBwZXJjZW50YWdlXG4gICAgICAgICAgICBvdXRwdXQgPSBmb3JtYXRQZXJjZW50YWdlKG4sIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0LmluZGV4T2YoJzonKSA+IC0xKSB7IC8vIHRpbWVcbiAgICAgICAgICAgIG91dHB1dCA9IGZvcm1hdFRpbWUobiwgZm9ybWF0KTtcbiAgICAgICAgfSBlbHNlIHsgLy8gcGxhaW4gb2wnIG51bWJlcnMgb3IgYnl0ZXNcbiAgICAgICAgICAgIG91dHB1dCA9IGZvcm1hdE51bWJlcihuLl92YWx1ZSwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJldHVybiBzdHJpbmdcbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICAvLyByZXZlcnQgdG8gbnVtYmVyXG4gICAgZnVuY3Rpb24gdW5mb3JtYXROdW1lcmFsIChuLCBzdHJpbmcpIHtcbiAgICAgICAgdmFyIHN0cmluZ09yaWdpbmFsID0gc3RyaW5nLFxuICAgICAgICAgICAgdGhvdXNhbmRSZWdFeHAsXG4gICAgICAgICAgICBtaWxsaW9uUmVnRXhwLFxuICAgICAgICAgICAgYmlsbGlvblJlZ0V4cCxcbiAgICAgICAgICAgIHRyaWxsaW9uUmVnRXhwLFxuICAgICAgICAgICAgc3VmZml4ZXMgPSBbJ0tCJywgJ01CJywgJ0dCJywgJ1RCJywgJ1BCJywgJ0VCJywgJ1pCJywgJ1lCJ10sXG4gICAgICAgICAgICBieXRlc011bHRpcGxpZXIgPSBmYWxzZSxcbiAgICAgICAgICAgIHBvd2VyO1xuXG4gICAgICAgIGlmIChzdHJpbmcuaW5kZXhPZignOicpID4gLTEpIHtcbiAgICAgICAgICAgIG4uX3ZhbHVlID0gdW5mb3JtYXRUaW1lKHN0cmluZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoc3RyaW5nID09PSB6ZXJvRm9ybWF0KSB7XG4gICAgICAgICAgICAgICAgbi5fdmFsdWUgPSAwO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uZGVsaW1pdGVycy5kZWNpbWFsICE9PSAnLicpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnJlcGxhY2UoL1xcLi9nLCcnKS5yZXBsYWNlKGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmRlbGltaXRlcnMuZGVjaW1hbCwgJy4nKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBzZWUgaWYgYWJicmV2aWF0aW9ucyBhcmUgdGhlcmUgc28gdGhhdCB3ZSBjYW4gbXVsdGlwbHkgdG8gdGhlIGNvcnJlY3QgbnVtYmVyXG4gICAgICAgICAgICAgICAgdGhvdXNhbmRSZWdFeHAgPSBuZXcgUmVnRXhwKCdbXmEtekEtWl0nICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy50aG91c2FuZCArICcoPzpcXFxcKXwoXFxcXCcgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyAnKT8oPzpcXFxcKSk/KT8kJyk7XG4gICAgICAgICAgICAgICAgbWlsbGlvblJlZ0V4cCA9IG5ldyBSZWdFeHAoJ1teYS16QS1aXScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLm1pbGxpb24gKyAnKD86XFxcXCl8KFxcXFwnICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgJyk/KD86XFxcXCkpPyk/JCcpO1xuICAgICAgICAgICAgICAgIGJpbGxpb25SZWdFeHAgPSBuZXcgUmVnRXhwKCdbXmEtekEtWl0nICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy5iaWxsaW9uICsgJyg/OlxcXFwpfChcXFxcJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCArICcpPyg/OlxcXFwpKT8pPyQnKTtcbiAgICAgICAgICAgICAgICB0cmlsbGlvblJlZ0V4cCA9IG5ldyBSZWdFeHAoJ1teYS16QS1aXScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLnRyaWxsaW9uICsgJyg/OlxcXFwpfChcXFxcJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCArICcpPyg/OlxcXFwpKT8pPyQnKTtcblxuICAgICAgICAgICAgICAgIC8vIHNlZSBpZiBieXRlcyBhcmUgdGhlcmUgc28gdGhhdCB3ZSBjYW4gbXVsdGlwbHkgdG8gdGhlIGNvcnJlY3QgbnVtYmVyXG4gICAgICAgICAgICAgICAgZm9yIChwb3dlciA9IDA7IHBvd2VyIDw9IHN1ZmZpeGVzLmxlbmd0aDsgcG93ZXIrKykge1xuICAgICAgICAgICAgICAgICAgICBieXRlc011bHRpcGxpZXIgPSAoc3RyaW5nLmluZGV4T2Yoc3VmZml4ZXNbcG93ZXJdKSA+IC0xKSA/IE1hdGgucG93KDEwMjQsIHBvd2VyICsgMSkgOiBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYnl0ZXNNdWx0aXBsaWVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGRvIHNvbWUgbWF0aCB0byBjcmVhdGUgb3VyIG51bWJlclxuICAgICAgICAgICAgICAgIG4uX3ZhbHVlID0gKChieXRlc011bHRpcGxpZXIpID8gYnl0ZXNNdWx0aXBsaWVyIDogMSkgKiAoKHN0cmluZ09yaWdpbmFsLm1hdGNoKHRob3VzYW5kUmVnRXhwKSkgPyBNYXRoLnBvdygxMCwgMykgOiAxKSAqICgoc3RyaW5nT3JpZ2luYWwubWF0Y2gobWlsbGlvblJlZ0V4cCkpID8gTWF0aC5wb3coMTAsIDYpIDogMSkgKiAoKHN0cmluZ09yaWdpbmFsLm1hdGNoKGJpbGxpb25SZWdFeHApKSA/IE1hdGgucG93KDEwLCA5KSA6IDEpICogKChzdHJpbmdPcmlnaW5hbC5tYXRjaCh0cmlsbGlvblJlZ0V4cCkpID8gTWF0aC5wb3coMTAsIDEyKSA6IDEpICogKChzdHJpbmcuaW5kZXhPZignJScpID4gLTEpID8gMC4wMSA6IDEpICogKCgoc3RyaW5nLnNwbGl0KCctJykubGVuZ3RoICsgTWF0aC5taW4oc3RyaW5nLnNwbGl0KCcoJykubGVuZ3RoLTEsIHN0cmluZy5zcGxpdCgnKScpLmxlbmd0aC0xKSkgJSAyKT8gMTogLTEpICogTnVtYmVyKHN0cmluZy5yZXBsYWNlKC9bXjAtOVxcLl0rL2csICcnKSk7XG5cbiAgICAgICAgICAgICAgICAvLyByb3VuZCBpZiB3ZSBhcmUgdGFsa2luZyBhYm91dCBieXRlc1xuICAgICAgICAgICAgICAgIG4uX3ZhbHVlID0gKGJ5dGVzTXVsdGlwbGllcikgPyBNYXRoLmNlaWwobi5fdmFsdWUpIDogbi5fdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG4uX3ZhbHVlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZvcm1hdEN1cnJlbmN5IChuLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIHN5bWJvbEluZGV4ID0gZm9ybWF0LmluZGV4T2YoJyQnKSxcbiAgICAgICAgICAgIG9wZW5QYXJlbkluZGV4ID0gZm9ybWF0LmluZGV4T2YoJygnKSxcbiAgICAgICAgICAgIG1pbnVzU2lnbkluZGV4ID0gZm9ybWF0LmluZGV4T2YoJy0nKSxcbiAgICAgICAgICAgIHNwYWNlID0gJycsXG4gICAgICAgICAgICBzcGxpY2VJbmRleCxcbiAgICAgICAgICAgIG91dHB1dDtcblxuICAgICAgICAvLyBjaGVjayBmb3Igc3BhY2UgYmVmb3JlIG9yIGFmdGVyIGN1cnJlbmN5XG4gICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignICQnKSA+IC0xKSB7XG4gICAgICAgICAgICBzcGFjZSA9ICcgJztcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCcgJCcsICcnKTtcbiAgICAgICAgfSBlbHNlIGlmIChmb3JtYXQuaW5kZXhPZignJCAnKSA+IC0xKSB7XG4gICAgICAgICAgICBzcGFjZSA9ICcgJztcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCckICcsICcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCckJywgJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZm9ybWF0IHRoZSBudW1iZXJcbiAgICAgICAgb3V0cHV0ID0gZm9ybWF0TnVtYmVyKG4uX3ZhbHVlLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pO1xuXG4gICAgICAgIC8vIHBvc2l0aW9uIHRoZSBzeW1ib2xcbiAgICAgICAgaWYgKHN5bWJvbEluZGV4IDw9IDEpIHtcbiAgICAgICAgICAgIGlmIChvdXRwdXQuaW5kZXhPZignKCcpID4gLTEgfHwgb3V0cHV0LmluZGV4T2YoJy0nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnNwbGl0KCcnKTtcbiAgICAgICAgICAgICAgICBzcGxpY2VJbmRleCA9IDE7XG4gICAgICAgICAgICAgICAgaWYgKHN5bWJvbEluZGV4IDwgb3BlblBhcmVuSW5kZXggfHwgc3ltYm9sSW5kZXggPCBtaW51c1NpZ25JbmRleCl7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBzeW1ib2wgYXBwZWFycyBiZWZvcmUgdGhlIFwiKFwiIG9yIFwiLVwiXG4gICAgICAgICAgICAgICAgICAgIHNwbGljZUluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb3V0cHV0LnNwbGljZShzcGxpY2VJbmRleCwgMCwgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgc3BhY2UpO1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5qb2luKCcnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgc3BhY2UgKyBvdXRwdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAob3V0cHV0LmluZGV4T2YoJyknKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnNwbGl0KCcnKTtcbiAgICAgICAgICAgICAgICBvdXRwdXQuc3BsaWNlKC0xLCAwLCBzcGFjZSArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCk7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LmpvaW4oJycpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQgKyBzcGFjZSArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0UGVyY2VudGFnZSAobiwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgIHZhciBzcGFjZSA9ICcnLFxuICAgICAgICAgICAgb3V0cHV0LFxuICAgICAgICAgICAgdmFsdWUgPSBuLl92YWx1ZSAqIDEwMDtcblxuICAgICAgICAvLyBjaGVjayBmb3Igc3BhY2UgYmVmb3JlICVcbiAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcgJScpID4gLTEpIHtcbiAgICAgICAgICAgIHNwYWNlID0gJyAnO1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyAlJywgJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyUnLCAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICBvdXRwdXQgPSBmb3JtYXROdW1iZXIodmFsdWUsIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgIFxuICAgICAgICBpZiAob3V0cHV0LmluZGV4T2YoJyknKSA+IC0xICkge1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnNwbGl0KCcnKTtcbiAgICAgICAgICAgIG91dHB1dC5zcGxpY2UoLTEsIDAsIHNwYWNlICsgJyUnKTtcbiAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5qb2luKCcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dCArIHNwYWNlICsgJyUnO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXRUaW1lIChuKSB7XG4gICAgICAgIHZhciBob3VycyA9IE1hdGguZmxvb3Iobi5fdmFsdWUvNjAvNjApLFxuICAgICAgICAgICAgbWludXRlcyA9IE1hdGguZmxvb3IoKG4uX3ZhbHVlIC0gKGhvdXJzICogNjAgKiA2MCkpLzYwKSxcbiAgICAgICAgICAgIHNlY29uZHMgPSBNYXRoLnJvdW5kKG4uX3ZhbHVlIC0gKGhvdXJzICogNjAgKiA2MCkgLSAobWludXRlcyAqIDYwKSk7XG4gICAgICAgIHJldHVybiBob3VycyArICc6JyArICgobWludXRlcyA8IDEwKSA/ICcwJyArIG1pbnV0ZXMgOiBtaW51dGVzKSArICc6JyArICgoc2Vjb25kcyA8IDEwKSA/ICcwJyArIHNlY29uZHMgOiBzZWNvbmRzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bmZvcm1hdFRpbWUgKHN0cmluZykge1xuICAgICAgICB2YXIgdGltZUFycmF5ID0gc3RyaW5nLnNwbGl0KCc6JyksXG4gICAgICAgICAgICBzZWNvbmRzID0gMDtcbiAgICAgICAgLy8gdHVybiBob3VycyBhbmQgbWludXRlcyBpbnRvIHNlY29uZHMgYW5kIGFkZCB0aGVtIGFsbCB1cFxuICAgICAgICBpZiAodGltZUFycmF5Lmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgLy8gaG91cnNcbiAgICAgICAgICAgIHNlY29uZHMgPSBzZWNvbmRzICsgKE51bWJlcih0aW1lQXJyYXlbMF0pICogNjAgKiA2MCk7XG4gICAgICAgICAgICAvLyBtaW51dGVzXG4gICAgICAgICAgICBzZWNvbmRzID0gc2Vjb25kcyArIChOdW1iZXIodGltZUFycmF5WzFdKSAqIDYwKTtcbiAgICAgICAgICAgIC8vIHNlY29uZHNcbiAgICAgICAgICAgIHNlY29uZHMgPSBzZWNvbmRzICsgTnVtYmVyKHRpbWVBcnJheVsyXSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGltZUFycmF5Lmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgLy8gbWludXRlc1xuICAgICAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgKyAoTnVtYmVyKHRpbWVBcnJheVswXSkgKiA2MCk7XG4gICAgICAgICAgICAvLyBzZWNvbmRzXG4gICAgICAgICAgICBzZWNvbmRzID0gc2Vjb25kcyArIE51bWJlcih0aW1lQXJyYXlbMV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBOdW1iZXIoc2Vjb25kcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0TnVtYmVyICh2YWx1ZSwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgIHZhciBuZWdQID0gZmFsc2UsXG4gICAgICAgICAgICBzaWduZWQgPSBmYWxzZSxcbiAgICAgICAgICAgIG9wdERlYyA9IGZhbHNlLFxuICAgICAgICAgICAgYWJiciA9ICcnLFxuICAgICAgICAgICAgYWJicksgPSBmYWxzZSwgLy8gZm9yY2UgYWJicmV2aWF0aW9uIHRvIHRob3VzYW5kc1xuICAgICAgICAgICAgYWJick0gPSBmYWxzZSwgLy8gZm9yY2UgYWJicmV2aWF0aW9uIHRvIG1pbGxpb25zXG4gICAgICAgICAgICBhYmJyQiA9IGZhbHNlLCAvLyBmb3JjZSBhYmJyZXZpYXRpb24gdG8gYmlsbGlvbnNcbiAgICAgICAgICAgIGFiYnJUID0gZmFsc2UsIC8vIGZvcmNlIGFiYnJldmlhdGlvbiB0byB0cmlsbGlvbnNcbiAgICAgICAgICAgIGFiYnJGb3JjZSA9IGZhbHNlLCAvLyBmb3JjZSBhYmJyZXZpYXRpb25cbiAgICAgICAgICAgIGJ5dGVzID0gJycsXG4gICAgICAgICAgICBvcmQgPSAnJyxcbiAgICAgICAgICAgIGFicyA9IE1hdGguYWJzKHZhbHVlKSxcbiAgICAgICAgICAgIHN1ZmZpeGVzID0gWydCJywgJ0tCJywgJ01CJywgJ0dCJywgJ1RCJywgJ1BCJywgJ0VCJywgJ1pCJywgJ1lCJ10sXG4gICAgICAgICAgICBtaW4sXG4gICAgICAgICAgICBtYXgsXG4gICAgICAgICAgICBwb3dlcixcbiAgICAgICAgICAgIHcsXG4gICAgICAgICAgICBwcmVjaXNpb24sXG4gICAgICAgICAgICB0aG91c2FuZHMsXG4gICAgICAgICAgICBkID0gJycsXG4gICAgICAgICAgICBuZWcgPSBmYWxzZTtcblxuICAgICAgICAvLyBjaGVjayBpZiBudW1iZXIgaXMgemVybyBhbmQgYSBjdXN0b20gemVybyBmb3JtYXQgaGFzIGJlZW4gc2V0XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gMCAmJiB6ZXJvRm9ybWF0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gemVyb0Zvcm1hdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHNlZSBpZiB3ZSBzaG91bGQgdXNlIHBhcmVudGhlc2VzIGZvciBuZWdhdGl2ZSBudW1iZXIgb3IgaWYgd2Ugc2hvdWxkIHByZWZpeCB3aXRoIGEgc2lnblxuICAgICAgICAgICAgLy8gaWYgYm90aCBhcmUgcHJlc2VudCB3ZSBkZWZhdWx0IHRvIHBhcmVudGhlc2VzXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJygnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgbmVnUCA9IHRydWU7XG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnNsaWNlKDEsIC0xKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0LmluZGV4T2YoJysnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgc2lnbmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgvXFwrL2csICcnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2VlIGlmIGFiYnJldmlhdGlvbiBpcyB3YW50ZWRcbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignYScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiBhYmJyZXZpYXRpb24gaXMgc3BlY2lmaWVkXG4gICAgICAgICAgICAgICAgYWJicksgPSBmb3JtYXQuaW5kZXhPZignYUsnKSA+PSAwO1xuICAgICAgICAgICAgICAgIGFiYnJNID0gZm9ybWF0LmluZGV4T2YoJ2FNJykgPj0gMDtcbiAgICAgICAgICAgICAgICBhYmJyQiA9IGZvcm1hdC5pbmRleE9mKCdhQicpID49IDA7XG4gICAgICAgICAgICAgICAgYWJiclQgPSBmb3JtYXQuaW5kZXhPZignYVQnKSA+PSAwO1xuICAgICAgICAgICAgICAgIGFiYnJGb3JjZSA9IGFiYnJLIHx8IGFiYnJNIHx8IGFiYnJCIHx8IGFiYnJUO1xuXG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgZm9yIHNwYWNlIGJlZm9yZSBhYmJyZXZpYXRpb25cbiAgICAgICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyBhJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBhYmJyID0gJyAnO1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnIGEnLCAnJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJ2EnLCAnJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGFicyA+PSBNYXRoLnBvdygxMCwgMTIpICYmICFhYmJyRm9yY2UgfHwgYWJiclQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdHJpbGxpb25cbiAgICAgICAgICAgICAgICAgICAgYWJiciA9IGFiYnIgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLnRyaWxsaW9uO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gTWF0aC5wb3coMTAsIDEyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFicyA8IE1hdGgucG93KDEwLCAxMikgJiYgYWJzID49IE1hdGgucG93KDEwLCA5KSAmJiAhYWJickZvcmNlIHx8IGFiYnJCKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGJpbGxpb25cbiAgICAgICAgICAgICAgICAgICAgYWJiciA9IGFiYnIgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLmJpbGxpb247XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgOSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhYnMgPCBNYXRoLnBvdygxMCwgOSkgJiYgYWJzID49IE1hdGgucG93KDEwLCA2KSAmJiAhYWJickZvcmNlIHx8IGFiYnJNKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1pbGxpb25cbiAgICAgICAgICAgICAgICAgICAgYWJiciA9IGFiYnIgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLm1pbGxpb247XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgNik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhYnMgPCBNYXRoLnBvdygxMCwgNikgJiYgYWJzID49IE1hdGgucG93KDEwLCAzKSAmJiAhYWJickZvcmNlIHx8IGFiYnJLKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRob3VzYW5kXG4gICAgICAgICAgICAgICAgICAgIGFiYnIgPSBhYmJyICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy50aG91c2FuZDtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KDEwLCAzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNlZSBpZiB3ZSBhcmUgZm9ybWF0dGluZyBieXRlc1xuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCdiJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGZvciBzcGFjZSBiZWZvcmVcbiAgICAgICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyBiJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBieXRlcyA9ICcgJztcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyBiJywgJycpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCdiJywgJycpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAocG93ZXIgPSAwOyBwb3dlciA8PSBzdWZmaXhlcy5sZW5ndGg7IHBvd2VyKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbWluID0gTWF0aC5wb3coMTAyNCwgcG93ZXIpO1xuICAgICAgICAgICAgICAgICAgICBtYXggPSBNYXRoLnBvdygxMDI0LCBwb3dlcisxKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPj0gbWluICYmIHZhbHVlIDwgbWF4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBieXRlcyA9IGJ5dGVzICsgc3VmZml4ZXNbcG93ZXJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1pbiA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gbWluO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNlZSBpZiBvcmRpbmFsIGlzIHdhbnRlZFxuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCdvJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGZvciBzcGFjZSBiZWZvcmVcbiAgICAgICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyBvJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBvcmQgPSAnICc7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCcgbycsICcnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnbycsICcnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBvcmQgPSBvcmQgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5vcmRpbmFsKHZhbHVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCdbLl0nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgb3B0RGVjID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnWy5dJywgJy4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdyA9IHZhbHVlLnRvU3RyaW5nKCkuc3BsaXQoJy4nKVswXTtcbiAgICAgICAgICAgIHByZWNpc2lvbiA9IGZvcm1hdC5zcGxpdCgnLicpWzFdO1xuICAgICAgICAgICAgdGhvdXNhbmRzID0gZm9ybWF0LmluZGV4T2YoJywnKTtcblxuICAgICAgICAgICAgaWYgKHByZWNpc2lvbikge1xuICAgICAgICAgICAgICAgIGlmIChwcmVjaXNpb24uaW5kZXhPZignWycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJlY2lzaW9uID0gcHJlY2lzaW9uLnJlcGxhY2UoJ10nLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIHByZWNpc2lvbiA9IHByZWNpc2lvbi5zcGxpdCgnWycpO1xuICAgICAgICAgICAgICAgICAgICBkID0gdG9GaXhlZCh2YWx1ZSwgKHByZWNpc2lvblswXS5sZW5ndGggKyBwcmVjaXNpb25bMV0ubGVuZ3RoKSwgcm91bmRpbmdGdW5jdGlvbiwgcHJlY2lzaW9uWzFdLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZCA9IHRvRml4ZWQodmFsdWUsIHByZWNpc2lvbi5sZW5ndGgsIHJvdW5kaW5nRnVuY3Rpb24pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHcgPSBkLnNwbGl0KCcuJylbMF07XG5cbiAgICAgICAgICAgICAgICBpZiAoZC5zcGxpdCgnLicpWzFdLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBkID0gbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uZGVsaW1pdGVycy5kZWNpbWFsICsgZC5zcGxpdCgnLicpWzFdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGQgPSAnJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0RGVjICYmIE51bWJlcihkLnNsaWNlKDEpKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBkID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB3ID0gdG9GaXhlZCh2YWx1ZSwgbnVsbCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGZvcm1hdCBudW1iZXJcbiAgICAgICAgICAgIGlmICh3LmluZGV4T2YoJy0nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgdyA9IHcuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgbmVnID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRob3VzYW5kcyA+IC0xKSB7XG4gICAgICAgICAgICAgICAgdyA9IHcudG9TdHJpbmcoKS5yZXBsYWNlKC8oXFxkKSg/PShcXGR7M30pKyg/IVxcZCkpL2csICckMScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5kZWxpbWl0ZXJzLnRob3VzYW5kcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignLicpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgdyA9ICcnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gKChuZWdQICYmIG5lZykgPyAnKCcgOiAnJykgKyAoKCFuZWdQICYmIG5lZykgPyAnLScgOiAnJykgKyAoKCFuZWcgJiYgc2lnbmVkKSA/ICcrJyA6ICcnKSArIHcgKyBkICsgKChvcmQpID8gb3JkIDogJycpICsgKChhYmJyKSA/IGFiYnIgOiAnJykgKyAoKGJ5dGVzKSA/IGJ5dGVzIDogJycpICsgKChuZWdQICYmIG5lZykgPyAnKScgOiAnJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIFRvcCBMZXZlbCBGdW5jdGlvbnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICBudW1lcmFsID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgIGlmIChudW1lcmFsLmlzTnVtZXJhbChpbnB1dCkpIHtcbiAgICAgICAgICAgIGlucHV0ID0gaW5wdXQudmFsdWUoKTtcbiAgICAgICAgfSBlbHNlIGlmIChpbnB1dCA9PT0gMCB8fCB0eXBlb2YgaW5wdXQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpbnB1dCA9IDA7XG4gICAgICAgIH0gZWxzZSBpZiAoIU51bWJlcihpbnB1dCkpIHtcbiAgICAgICAgICAgIGlucHV0ID0gbnVtZXJhbC5mbi51bmZvcm1hdChpbnB1dCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IE51bWVyYWwoTnVtYmVyKGlucHV0KSk7XG4gICAgfTtcblxuICAgIC8vIHZlcnNpb24gbnVtYmVyXG4gICAgbnVtZXJhbC52ZXJzaW9uID0gVkVSU0lPTjtcblxuICAgIC8vIGNvbXBhcmUgbnVtZXJhbCBvYmplY3RcbiAgICBudW1lcmFsLmlzTnVtZXJhbCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIE51bWVyYWw7XG4gICAgfTtcblxuICAgIC8vIFRoaXMgZnVuY3Rpb24gd2lsbCBsb2FkIGxhbmd1YWdlcyBhbmQgdGhlbiBzZXQgdGhlIGdsb2JhbCBsYW5ndWFnZS4gIElmXG4gICAgLy8gbm8gYXJndW1lbnRzIGFyZSBwYXNzZWQgaW4sIGl0IHdpbGwgc2ltcGx5IHJldHVybiB0aGUgY3VycmVudCBnbG9iYWxcbiAgICAvLyBsYW5ndWFnZSBrZXkuXG4gICAgbnVtZXJhbC5sYW5ndWFnZSA9IGZ1bmN0aW9uIChrZXksIHZhbHVlcykge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRMYW5ndWFnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChrZXkgJiYgIXZhbHVlcykge1xuICAgICAgICAgICAgaWYoIWxhbmd1YWdlc1trZXldKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGxhbmd1YWdlIDogJyArIGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJyZW50TGFuZ3VhZ2UgPSBrZXk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWVzIHx8ICFsYW5ndWFnZXNba2V5XSkge1xuICAgICAgICAgICAgbG9hZExhbmd1YWdlKGtleSwgdmFsdWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudW1lcmFsO1xuICAgIH07XG4gICAgXG4gICAgLy8gVGhpcyBmdW5jdGlvbiBwcm92aWRlcyBhY2Nlc3MgdG8gdGhlIGxvYWRlZCBsYW5ndWFnZSBkYXRhLiAgSWZcbiAgICAvLyBubyBhcmd1bWVudHMgYXJlIHBhc3NlZCBpbiwgaXQgd2lsbCBzaW1wbHkgcmV0dXJuIHRoZSBjdXJyZW50XG4gICAgLy8gZ2xvYmFsIGxhbmd1YWdlIG9iamVjdC5cbiAgICBudW1lcmFsLmxhbmd1YWdlRGF0YSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFsYW5ndWFnZXNba2V5XSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGxhbmd1YWdlIDogJyArIGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBsYW5ndWFnZXNba2V5XTtcbiAgICB9O1xuXG4gICAgbnVtZXJhbC5sYW5ndWFnZSgnZW4nLCB7XG4gICAgICAgIGRlbGltaXRlcnM6IHtcbiAgICAgICAgICAgIHRob3VzYW5kczogJywnLFxuICAgICAgICAgICAgZGVjaW1hbDogJy4nXG4gICAgICAgIH0sXG4gICAgICAgIGFiYnJldmlhdGlvbnM6IHtcbiAgICAgICAgICAgIHRob3VzYW5kOiAnaycsXG4gICAgICAgICAgICBtaWxsaW9uOiAnbScsXG4gICAgICAgICAgICBiaWxsaW9uOiAnYicsXG4gICAgICAgICAgICB0cmlsbGlvbjogJ3QnXG4gICAgICAgIH0sXG4gICAgICAgIG9yZGluYWw6IGZ1bmN0aW9uIChudW1iZXIpIHtcbiAgICAgICAgICAgIHZhciBiID0gbnVtYmVyICUgMTA7XG4gICAgICAgICAgICByZXR1cm4gKH5+IChudW1iZXIgJSAxMDAgLyAxMCkgPT09IDEpID8gJ3RoJyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDEpID8gJ3N0JyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDIpID8gJ25kJyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDMpID8gJ3JkJyA6ICd0aCc7XG4gICAgICAgIH0sXG4gICAgICAgIGN1cnJlbmN5OiB7XG4gICAgICAgICAgICBzeW1ib2w6ICckJ1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBudW1lcmFsLnplcm9Gb3JtYXQgPSBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgIHplcm9Gb3JtYXQgPSB0eXBlb2YoZm9ybWF0KSA9PT0gJ3N0cmluZycgPyBmb3JtYXQgOiBudWxsO1xuICAgIH07XG5cbiAgICBudW1lcmFsLmRlZmF1bHRGb3JtYXQgPSBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgIGRlZmF1bHRGb3JtYXQgPSB0eXBlb2YoZm9ybWF0KSA9PT0gJ3N0cmluZycgPyBmb3JtYXQgOiAnMC4wJztcbiAgICB9O1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBIZWxwZXJzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgZnVuY3Rpb24gbG9hZExhbmd1YWdlKGtleSwgdmFsdWVzKSB7XG4gICAgICAgIGxhbmd1YWdlc1trZXldID0gdmFsdWVzO1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRmxvYXRpbmctcG9pbnQgaGVscGVyc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIC8vIFRoZSBmbG9hdGluZy1wb2ludCBoZWxwZXIgZnVuY3Rpb25zIGFuZCBpbXBsZW1lbnRhdGlvblxuICAgIC8vIGJvcnJvd3MgaGVhdmlseSBmcm9tIHNpbmZ1bC5qczogaHR0cDovL2d1aXBuLmdpdGh1Yi5pby9zaW5mdWwuanMvXG5cbiAgICAvKipcbiAgICAgKiBBcnJheS5wcm90b3R5cGUucmVkdWNlIGZvciBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgaXRcbiAgICAgKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9SZWR1Y2UjQ29tcGF0aWJpbGl0eVxuICAgICAqL1xuICAgIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgQXJyYXkucHJvdG90eXBlLnJlZHVjZSkge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUucmVkdWNlID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBvcHRfaW5pdGlhbFZhbHVlKSB7XG4gICAgICAgICAgICAndXNlIHN0cmljdCc7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChudWxsID09PSB0aGlzIHx8ICd1bmRlZmluZWQnID09PSB0eXBlb2YgdGhpcykge1xuICAgICAgICAgICAgICAgIC8vIEF0IHRoZSBtb21lbnQgYWxsIG1vZGVybiBicm93c2VycywgdGhhdCBzdXBwb3J0IHN0cmljdCBtb2RlLCBoYXZlXG4gICAgICAgICAgICAgICAgLy8gbmF0aXZlIGltcGxlbWVudGF0aW9uIG9mIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UuIEZvciBpbnN0YW5jZSwgSUU4XG4gICAgICAgICAgICAgICAgLy8gZG9lcyBub3Qgc3VwcG9ydCBzdHJpY3QgbW9kZSwgc28gdGhpcyBjaGVjayBpcyBhY3R1YWxseSB1c2VsZXNzLlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FycmF5LnByb3RvdHlwZS5yZWR1Y2UgY2FsbGVkIG9uIG51bGwgb3IgdW5kZWZpbmVkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGNhbGxiYWNrICsgJyBpcyBub3QgYSBmdW5jdGlvbicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgaW5kZXgsXG4gICAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gdGhpcy5sZW5ndGggPj4+IDAsXG4gICAgICAgICAgICAgICAgaXNWYWx1ZVNldCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAoMSA8IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IG9wdF9pbml0aWFsVmFsdWU7XG4gICAgICAgICAgICAgICAgaXNWYWx1ZVNldCA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoaW5kZXggPSAwOyBsZW5ndGggPiBpbmRleDsgKytpbmRleCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc093blByb3BlcnR5KGluZGV4KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNWYWx1ZVNldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBjYWxsYmFjayh2YWx1ZSwgdGhpc1tpbmRleF0sIGluZGV4LCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdGhpc1tpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpc1ZhbHVlU2V0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFpc1ZhbHVlU2V0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUmVkdWNlIG9mIGVtcHR5IGFycmF5IHdpdGggbm8gaW5pdGlhbCB2YWx1ZScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgXG4gICAgLyoqXG4gICAgICogQ29tcHV0ZXMgdGhlIG11bHRpcGxpZXIgbmVjZXNzYXJ5IHRvIG1ha2UgeCA+PSAxLFxuICAgICAqIGVmZmVjdGl2ZWx5IGVsaW1pbmF0aW5nIG1pc2NhbGN1bGF0aW9ucyBjYXVzZWQgYnlcbiAgICAgKiBmaW5pdGUgcHJlY2lzaW9uLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG11bHRpcGxpZXIoeCkge1xuICAgICAgICB2YXIgcGFydHMgPSB4LnRvU3RyaW5nKCkuc3BsaXQoJy4nKTtcbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNYXRoLnBvdygxMCwgcGFydHNbMV0ubGVuZ3RoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHaXZlbiBhIHZhcmlhYmxlIG51bWJlciBvZiBhcmd1bWVudHMsIHJldHVybnMgdGhlIG1heGltdW1cbiAgICAgKiBtdWx0aXBsaWVyIHRoYXQgbXVzdCBiZSB1c2VkIHRvIG5vcm1hbGl6ZSBhbiBvcGVyYXRpb24gaW52b2x2aW5nXG4gICAgICogYWxsIG9mIHRoZW0uXG4gICAgICovXG4gICAgZnVuY3Rpb24gY29ycmVjdGlvbkZhY3RvcigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gYXJncy5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIG5leHQpIHtcbiAgICAgICAgICAgIHZhciBtcCA9IG11bHRpcGxpZXIocHJldiksXG4gICAgICAgICAgICAgICAgbW4gPSBtdWx0aXBsaWVyKG5leHQpO1xuICAgICAgICByZXR1cm4gbXAgPiBtbiA/IG1wIDogbW47XG4gICAgICAgIH0sIC1JbmZpbml0eSk7XG4gICAgfSAgICAgICAgXG5cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgTnVtZXJhbCBQcm90b3R5cGVcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIG51bWVyYWwuZm4gPSBOdW1lcmFsLnByb3RvdHlwZSA9IHtcblxuICAgICAgICBjbG9uZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBudW1lcmFsKHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZvcm1hdCA6IGZ1bmN0aW9uIChpbnB1dFN0cmluZywgcm91bmRpbmdGdW5jdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdE51bWVyYWwodGhpcywgXG4gICAgICAgICAgICAgICAgICBpbnB1dFN0cmluZyA/IGlucHV0U3RyaW5nIDogZGVmYXVsdEZvcm1hdCwgXG4gICAgICAgICAgICAgICAgICAocm91bmRpbmdGdW5jdGlvbiAhPT0gdW5kZWZpbmVkKSA/IHJvdW5kaW5nRnVuY3Rpb24gOiBNYXRoLnJvdW5kXG4gICAgICAgICAgICAgICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdW5mb3JtYXQgOiBmdW5jdGlvbiAoaW5wdXRTdHJpbmcpIHtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXRTdHJpbmcpID09PSAnW29iamVjdCBOdW1iZXJdJykgeyBcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5wdXRTdHJpbmc7IFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHVuZm9ybWF0TnVtZXJhbCh0aGlzLCBpbnB1dFN0cmluZyA/IGlucHV0U3RyaW5nIDogZGVmYXVsdEZvcm1hdCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdmFsdWUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdmFsdWVPZiA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXQgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gTnVtYmVyKHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZCA6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIGNvcnJGYWN0b3IgPSBjb3JyZWN0aW9uRmFjdG9yLmNhbGwobnVsbCwgdGhpcy5fdmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNiYWNrKGFjY3VtLCBjdXJyLCBjdXJySSwgTykge1xuICAgICAgICAgICAgICAgIHJldHVybiBhY2N1bSArIGNvcnJGYWN0b3IgKiBjdXJyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSBbdGhpcy5fdmFsdWUsIHZhbHVlXS5yZWR1Y2UoY2JhY2ssIDApIC8gY29yckZhY3RvcjtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN1YnRyYWN0IDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgY29yckZhY3RvciA9IGNvcnJlY3Rpb25GYWN0b3IuY2FsbChudWxsLCB0aGlzLl92YWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgZnVuY3Rpb24gY2JhY2soYWNjdW0sIGN1cnIsIGN1cnJJLCBPKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjY3VtIC0gY29yckZhY3RvciAqIGN1cnI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IFt2YWx1ZV0ucmVkdWNlKGNiYWNrLCB0aGlzLl92YWx1ZSAqIGNvcnJGYWN0b3IpIC8gY29yckZhY3RvcjsgICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIG11bHRpcGx5IDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBjYmFjayhhY2N1bSwgY3VyciwgY3VyckksIE8pIHtcbiAgICAgICAgICAgICAgICB2YXIgY29yckZhY3RvciA9IGNvcnJlY3Rpb25GYWN0b3IoYWNjdW0sIGN1cnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiAoYWNjdW0gKiBjb3JyRmFjdG9yKSAqIChjdXJyICogY29yckZhY3RvcikgL1xuICAgICAgICAgICAgICAgICAgICAoY29yckZhY3RvciAqIGNvcnJGYWN0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSBbdGhpcy5fdmFsdWUsIHZhbHVlXS5yZWR1Y2UoY2JhY2ssIDEpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGl2aWRlIDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBjYmFjayhhY2N1bSwgY3VyciwgY3VyckksIE8pIHtcbiAgICAgICAgICAgICAgICB2YXIgY29yckZhY3RvciA9IGNvcnJlY3Rpb25GYWN0b3IoYWNjdW0sIGN1cnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiAoYWNjdW0gKiBjb3JyRmFjdG9yKSAvIChjdXJyICogY29yckZhY3Rvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IFt0aGlzLl92YWx1ZSwgdmFsdWVdLnJlZHVjZShjYmFjayk7ICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBkaWZmZXJlbmNlIDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5hYnMobnVtZXJhbCh0aGlzLl92YWx1ZSkuc3VidHJhY3QodmFsdWUpLnZhbHVlKCkpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBFeHBvc2luZyBOdW1lcmFsXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgLy8gQ29tbW9uSlMgbW9kdWxlIGlzIGRlZmluZWRcbiAgICBpZiAoaGFzTW9kdWxlKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gbnVtZXJhbDtcbiAgICB9XG5cbiAgICAvKmdsb2JhbCBlbmRlcjpmYWxzZSAqL1xuICAgIGlmICh0eXBlb2YgZW5kZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8vIGhlcmUsIGB0aGlzYCBtZWFucyBgd2luZG93YCBpbiB0aGUgYnJvd3Nlciwgb3IgYGdsb2JhbGAgb24gdGhlIHNlcnZlclxuICAgICAgICAvLyBhZGQgYG51bWVyYWxgIGFzIGEgZ2xvYmFsIG9iamVjdCB2aWEgYSBzdHJpbmcgaWRlbnRpZmllcixcbiAgICAgICAgLy8gZm9yIENsb3N1cmUgQ29tcGlsZXIgJ2FkdmFuY2VkJyBtb2RlXG4gICAgICAgIHRoaXNbJ251bWVyYWwnXSA9IG51bWVyYWw7XG4gICAgfVxuXG4gICAgLypnbG9iYWwgZGVmaW5lOmZhbHNlICovXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBudW1lcmFsO1xuICAgICAgICB9KTtcbiAgICB9XG59KS5jYWxsKHRoaXMpO1xuIiwiLyoqXG4gICAgQWNjb3VudCBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBzaW5nbGV0b24gPSBudWxsLFxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyksXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKTtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdEFjY291bnQoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBBY2NvdW50QWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xuICAgIFxuICAgIHJldHVybiBzaW5nbGV0b247XG59O1xuXG5mdW5jdGlvbiBBY2NvdW50QWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG5cbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IG5ldyBOYXZCYXIoe1xuICAgICAgICB0aXRsZTogJ0FjY291bnQnLFxuICAgICAgICBsZWZ0QWN0aW9uOiBOYXZBY3Rpb24ubWVudU5ld0l0ZW0sXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBOYXZBY3Rpb24ubWVudUluXG4gICAgfSk7XG59XG5cbkFjY291bnRBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuXG59O1xuIiwiLyoqIENhbGVuZGFyIGFjdGl2aXR5ICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpLFxyXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKTtcclxucmVxdWlyZSgnLi4vY29tcG9uZW50cy9EYXRlUGlja2VyJyk7XHJcblxyXG52YXIgc2luZ2xldG9uID0gbnVsbDtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRBcHBvaW50bWVudCgkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXHJcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IEFwcG9pbnRtZW50QWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xyXG4gICAgXHJcbiAgICByZXR1cm4gc2luZ2xldG9uO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gQXBwb2ludG1lbnRBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuUHJvdmlkZXI7XHJcbiAgICB0aGlzLm1lbnVJdGVtID0gJ2NhbGVuZGFyJztcclxuICAgIFxyXG4gICAgLyogR2V0dGluZyBlbGVtZW50cyAqL1xyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLiRhcHBvaW50bWVudFZpZXcgPSAkYWN0aXZpdHkuZmluZCgnI2NhbGVuZGFyQXBwb2ludG1lbnRWaWV3Jyk7XHJcbiAgICB0aGlzLiRjaG9vc2VOZXcgPSAkKCcjY2FsZW5kYXJDaG9vc2VOZXcnKTtcclxuICAgIHRoaXMuYXBwID0gYXBwO1xyXG4gICAgXHJcbiAgICAvLyBPYmplY3QgdG8gaG9sZCB0aGUgb3B0aW9ucyBwYXNzZWQgb24gJ3Nob3cnIGFzIGEgcmVzdWx0XHJcbiAgICAvLyBvZiBhIHJlcXVlc3QgZnJvbSBhbm90aGVyIGFjdGl2aXR5XHJcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gbnVsbDtcclxuICAgIFxyXG4gICAgLy8gQ3JlYXRlIGEgc3BlY2lmaWMgYmFja0FjdGlvbiB0aGF0IHNob3dzIGN1cnJlbnQgZGF0ZVxyXG4gICAgLy8gYW5kIHJldHVybiB0byBjYWxlbmRhciBpbiBjdXJyZW50IGRhdGUuXHJcbiAgICAvLyBMYXRlciBzb21lIG1vcmUgY2hhbmdlcyBhcmUgYXBwbGllZCwgd2l0aCB2aWV3bW9kZWwgcmVhZHlcclxuICAgIHZhciBiYWNrQWN0aW9uID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICAgICAgbGluazogJ2NhbGVuZGFyLycsIC8vIFByZXNlcnZlIGxhc3Qgc2xhc2gsIGZvciBsYXRlciB1c2VcclxuICAgICAgICBpY29uOiBOYXZBY3Rpb24uZ29CYWNrLmljb24oKSxcclxuICAgICAgICBpc1RpdGxlOiB0cnVlLFxyXG4gICAgICAgIHRleHQ6ICdDYWxlbmRhcidcclxuICAgIH0pO1xyXG4gICAgdGhpcy5uYXZCYXIgPSBuZXcgTmF2QmFyKHtcclxuICAgICAgICB0aXRsZTogJycsXHJcbiAgICAgICAgbGVmdEFjdGlvbjogYmFja0FjdGlvbixcclxuICAgICAgICByaWdodEFjdGlvbjogTmF2QWN0aW9uLmdvSGVscEluZGV4XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgdGhpcy5pbml0QXBwb2ludG1lbnQoKTtcclxuICAgIFxyXG4gICAgLy8gVGhpcyB0aXRsZSB0ZXh0IGlzIGR5bmFtaWMsIHdlIG5lZWQgdG8gcmVwbGFjZSBpdCBieSBhIGNvbXB1dGVkIG9ic2VydmFibGVcclxuICAgIC8vIHNob3dpbmcgdGhlIGN1cnJlbnQgZGF0ZVxyXG4gICAgdmFyIGRlZkJhY2tUZXh0ID0gYmFja0FjdGlvbi50ZXh0Ll9pbml0aWFsVmFsdWU7XHJcbiAgICBiYWNrQWN0aW9uLnRleHQgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIGQgPSB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3LmN1cnJlbnREYXRlKCk7XHJcbiAgICAgICAgaWYgKCFkKVxyXG4gICAgICAgICAgICAvLyBGYWxsYmFjayB0byB0aGUgZGVmYXVsdCB0aXRsZVxyXG4gICAgICAgICAgICByZXR1cm4gZGVmQmFja1RleHQ7XHJcblxyXG4gICAgICAgIHZhciBtID0gbW9tZW50KGQpO1xyXG4gICAgICAgIHZhciB0ID0gbS5mb3JtYXQoJ2RkZGQgWyhdTS9EWyldJyk7XHJcbiAgICAgICAgcmV0dXJuIHQ7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIC8vIEFuZCB0aGUgbGluayBpcyBkeW5hbWljIHRvbywgdG8gYWxsb3cgcmV0dXJuIHRvIHRoZSBkYXRlXHJcbiAgICAvLyB0aGF0IG1hdGNoZXMgY3VycmVudCBhcHBvaW50bWVudFxyXG4gICAgdmFyIGRlZkxpbmsgPSBiYWNrQWN0aW9uLmxpbmsuX2luaXRpYWxWYWx1ZTtcclxuICAgIGJhY2tBY3Rpb24ubGluayA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgZCA9IHRoaXMuYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudERhdGUoKTtcclxuICAgICAgICBpZiAoIWQpXHJcbiAgICAgICAgICAgIC8vIEZhbGxiYWNrIHRvIHRoZSBkZWZhdWx0IGxpbmtcclxuICAgICAgICAgICAgcmV0dXJuIGRlZkxpbms7XHJcblxyXG4gICAgICAgIHJldHVybiBkZWZMaW5rICsgZC50b0lTT1N0cmluZygpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50LnN1YnNjcmliZShmdW5jdGlvbiAoYXB0KSB7XHJcbiAgICAgICAgLy8gVXBkYXRlIFVSTCB0byBtYXRjaCB0aGUgYXBwb2ludG1lbnQgSUQgYW5kXHJcbiAgICAgICAgLy8gdHJhY2sgaXQgc3RhdGVcclxuICAgICAgICAvLyBHZXQgSUQgZnJvbSBVUkwsIHRvIGF2b2lkIGRvIGFueXRoaW5nIGlmIHRoZSBzYW1lLlxyXG4gICAgICAgIHZhciBhcHRJZCA9IGFwdC5pZCgpO1xyXG4gICAgICAgIHZhciB1cmxJZCA9IC9hcHBvaW50bWVudFxcLyhcXGQrKS9pLnRlc3Qod2luZG93LmxvY2F0aW9uKTtcclxuICAgICAgICB1cmxJZCA9IHVybElkICYmIHVybElkWzFdIHx8ICcnO1xyXG4gICAgICAgIGlmICh1cmxJZCAhPT0gJzAnICYmIGFwdElkICE9PSBudWxsICYmIHVybElkICE9PSBhcHRJZC50b1N0cmluZygpKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBUT0RPIHNhdmUgYSB1c2VmdWwgc3RhdGVcclxuICAgICAgICAgICAgLy8gTm90IGZvciBub3csIGlzIGZhaWxpbmcsIGJ1dCBzb21ldGhpbmcgYmFzZWQgb246XHJcbiAgICAgICAgICAgIC8qXHJcbiAgICAgICAgICAgIHZhciB2aWV3c3RhdGUgPSB7XHJcbiAgICAgICAgICAgICAgICBhcHBvaW50bWVudDogYXB0Lm1vZGVsLnRvUGxhaW5PYmplY3QodHJ1ZSlcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIElmIHdhcyBhIHJvb3QgVVJMLCBubyBJRCwganVzdCByZXBsYWNlIGN1cnJlbnQgc3RhdGVcclxuICAgICAgICAgICAgaWYgKHVybElkID09PSAnJylcclxuICAgICAgICAgICAgICAgIGFwcC5zaGVsbC5oaXN0b3J5LnJlcGxhY2VTdGF0ZShudWxsLCBudWxsLCAnYXBwb2ludG1lbnQvJyArIGFwdElkKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgYXBwLnNoZWxsLmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsICdhcHBvaW50bWVudC8nICsgYXB0SWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBUcmlnZ2VyIGEgbGF5b3V0IHVwZGF0ZSwgcmVxdWlyZWQgYnkgdGhlIGZ1bGwtaGVpZ2h0IGZlYXR1cmVcclxuICAgICAgICAkKHdpbmRvdykudHJpZ2dlcignbGF5b3V0VXBkYXRlJyk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuQXBwb2ludG1lbnRBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG4gICAgLyoganNoaW50IG1heGNvbXBsZXhpdHk6MTAgKi9cclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgXHJcbiAgICB2YXIgYXB0O1xyXG4gICAgaWYgKHRoaXMucmVxdWVzdEluZm8uYXBwb2ludG1lbnQpIHtcclxuICAgICAgICBhcHQgPSB0aGlzLnJlcXVlc3RJbmZvLmFwcG9pbnRtZW50O1xyXG4gICAgfSBlbHNlIHtcclxuICAgIC8vIEdldCBJRFxyXG4gICAgICAgIHZhciBhcHRJZCA9IG9wdGlvbnMgJiYgb3B0aW9ucy5yb3V0ZSAmJiBvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdO1xyXG4gICAgICAgIGFwdElkID0gcGFyc2VJbnQoYXB0SWQsIDEwKTtcclxuICAgICAgICBhcHQgPSBhcHRJZCB8fCAwO1xyXG4gICAgfVxyXG4gICAgdGhpcy5zaG93QXBwb2ludG1lbnQoYXB0KTtcclxuICAgIFxyXG4gICAgLy8gSWYgdGhlcmUgYXJlIG9wdGlvbnMgKHRoZXJlIGFyZSBub3Qgb24gc3RhcnR1cCBvclxyXG4gICAgLy8gb24gY2FuY2VsbGVkIGVkaXRpb24pLlxyXG4gICAgLy8gQW5kIGl0IGNvbWVzIGJhY2sgZnJvbSB0aGUgdGV4dEVkaXRvci5cclxuICAgIGlmIChvcHRpb25zICE9PSBudWxsKSB7XHJcblxyXG4gICAgICAgIHZhciBib29raW5nID0gdGhpcy5hcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50QXBwb2ludG1lbnQoKTtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMucmVxdWVzdCA9PT0gJ3RleHRFZGl0b3InICYmIGJvb2tpbmcpIHtcclxuXHJcbiAgICAgICAgICAgIGJvb2tpbmdbb3B0aW9ucy5maWVsZF0ob3B0aW9ucy50ZXh0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5zZWxlY3RDbGllbnQgPT09IHRydWUgJiYgYm9va2luZykge1xyXG5cclxuICAgICAgICAgICAgYm9va2luZy5jbGllbnQob3B0aW9ucy5zZWxlY3RlZENsaWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZihvcHRpb25zLnNlbGVjdGVkRGF0ZXRpbWUpICE9PSAndW5kZWZpbmVkJyAmJiBib29raW5nKSB7XHJcblxyXG4gICAgICAgICAgICBib29raW5nLnN0YXJ0VGltZShvcHRpb25zLnNlbGVjdGVkRGF0ZXRpbWUpO1xyXG4gICAgICAgICAgICAvLyBUT0RPIENhbGN1bGF0ZSB0aGUgZW5kVGltZSBnaXZlbiBhbiBhcHBvaW50bWVudCBkdXJhdGlvbiwgcmV0cmlldmVkIGZyb20gdGhlXHJcbiAgICAgICAgICAgIC8vIHNlbGVjdGVkIHNlcnZpY2VcclxuICAgICAgICAgICAgLy92YXIgZHVyYXRpb24gPSBib29raW5nLnByaWNpbmcgJiYgYm9va2luZy5wcmljaW5nLmR1cmF0aW9uO1xyXG4gICAgICAgICAgICAvLyBPciBieSBkZWZhdWx0IChpZiBubyBwcmljaW5nIHNlbGVjdGVkIG9yIGFueSkgdGhlIHVzZXIgcHJlZmVycmVkXHJcbiAgICAgICAgICAgIC8vIHRpbWUgZ2FwXHJcbiAgICAgICAgICAgIC8vZHVyYXRpb24gPSBkdXJhdGlvbiB8fCB1c2VyLnByZWZlcmVuY2VzLnRpbWVTbG90c0dhcDtcclxuICAgICAgICAgICAgLy8gUFJPVE9UWVBFOlxyXG4gICAgICAgICAgICB2YXIgZHVyYXRpb24gPSA2MDsgLy8gbWludXRlc1xyXG4gICAgICAgICAgICBib29raW5nLmVuZFRpbWUobW9tZW50KGJvb2tpbmcuc3RhcnRUaW1lKCkpLmFkZChkdXJhdGlvbiwgJ21pbnV0ZXMnKS50b0RhdGUoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKG9wdGlvbnMuc2VsZWN0U2VydmljZXMgPT09IHRydWUgJiYgYm9va2luZykge1xyXG5cclxuICAgICAgICAgICAgYm9va2luZy5zZXJ2aWNlcyhvcHRpb25zLnNlbGVjdGVkU2VydmljZXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChvcHRpb25zLnNlbGVjdExvY2F0aW9uID09PSB0cnVlICYmIGJvb2tpbmcpIHtcclxuXHJcbiAgICAgICAgICAgIGJvb2tpbmcubG9jYXRpb24ob3B0aW9ucy5zZWxlY3RlZExvY2F0aW9uKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgQXBwb2ludG1lbnQgPSByZXF1aXJlKCcuLi9tb2RlbHMvQXBwb2ludG1lbnQnKTtcclxuXHJcbkFwcG9pbnRtZW50QWN0aXZpdHkucHJvdG90eXBlLnNob3dBcHBvaW50bWVudCA9IGZ1bmN0aW9uIHNob3dBcHBvaW50bWVudChhcHQpIHtcclxuXHJcbiAgICBpZiAodHlwZW9mKGFwdCkgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgaWYgKGFwdCkge1xyXG4gICAgICAgICAgICAvLyBUT0RPOiBzZWxlY3QgYXBwb2ludG1lbnQgYXB0IElEXHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAoYXB0ID09PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwb2ludG1lbnRzRGF0YVZpZXcubmV3QXBwb2ludG1lbnQobmV3IEFwcG9pbnRtZW50KCkpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3LmVkaXRNb2RlKHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIC8vIEFwcG9pbnRtZW50IG9iamVjdFxyXG4gICAgICAgIGlmIChhcHQuaWQpIHtcclxuICAgICAgICAgICAgLy8gVE9ETzogc2VsZWN0IGFwcG9pbnRtZW50IGJ5IGFwdCBpZFxyXG4gICAgICAgICAgICAvLyBUT0RPOiB0aGVuIHVwZGF0ZSB2YWx1ZXMgd2l0aCBpbi1lZGl0aW5nIHZhbHVlcyBmcm9tIGFwdFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gTmV3IGFwb3BpbnRtZW50IHdpdGggdGhlIGluLWVkaXRpbmcgdmFsdWVzXHJcbiAgICAgICAgICAgIHRoaXMuYXBwb2ludG1lbnRzRGF0YVZpZXcubmV3QXBwb2ludG1lbnQobmV3IEFwcG9pbnRtZW50KGFwdCkpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3LmVkaXRNb2RlKHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbkFwcG9pbnRtZW50QWN0aXZpdHkucHJvdG90eXBlLmluaXRBcHBvaW50bWVudCA9IGZ1bmN0aW9uIGluaXRBcHBvaW50bWVudCgpIHtcclxuICAgIGlmICghdGhpcy5fX2luaXRlZEFwcG9pbnRtZW50KSB7XHJcbiAgICAgICAgdGhpcy5fX2luaXRlZEFwcG9pbnRtZW50ID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdmFyIGFwcCA9IHRoaXMuYXBwO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIERhdGFcclxuICAgICAgICB2YXIgdGVzdERhdGEgPSByZXF1aXJlKCcuLi90ZXN0ZGF0YS9jYWxlbmRhckFwcG9pbnRtZW50cycpLmFwcG9pbnRtZW50cztcclxuICAgICAgICB2YXIgYXBwb2ludG1lbnRzRGF0YVZpZXcgPSB7XHJcbiAgICAgICAgICAgIGFwcG9pbnRtZW50czoga28ub2JzZXJ2YWJsZUFycmF5KHRlc3REYXRhKSxcclxuICAgICAgICAgICAgY3VycmVudEluZGV4OiBrby5vYnNlcnZhYmxlKDApLFxyXG4gICAgICAgICAgICBlZGl0TW9kZToga28ub2JzZXJ2YWJsZShmYWxzZSksXHJcbiAgICAgICAgICAgIG5ld0FwcG9pbnRtZW50OiBrby5vYnNlcnZhYmxlKG51bGwpXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3ID0gYXBwb2ludG1lbnRzRGF0YVZpZXc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuaXNOZXcgPSBrby5jb21wdXRlZChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXdBcHBvaW50bWVudCgpICE9PSBudWxsO1xyXG4gICAgICAgIH0sIGFwcG9pbnRtZW50c0RhdGFWaWV3KTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50QXBwb2ludG1lbnQgPSBrby5jb21wdXRlZCh7XHJcbiAgICAgICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNOZXcoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm5ld0FwcG9pbnRtZW50KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hcHBvaW50bWVudHMoKVt0aGlzLmN1cnJlbnRJbmRleCgpICUgdGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGhdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB3cml0ZTogZnVuY3Rpb24oYXB0KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmN1cnJlbnRJbmRleCgpICUgdGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50cygpW2luZGV4XSA9IGFwdDtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwb2ludG1lbnRzLnZhbHVlSGFzTXV0YXRlZCgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvd25lcjogYXBwb2ludG1lbnRzRGF0YVZpZXdcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5vcmlnaW5hbEVkaXRlZEFwcG9pbnRtZW50ID0ge307XHJcbiBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5nb1ByZXZpb3VzID0gZnVuY3Rpb24gZ29QcmV2aW91cygpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZWRpdE1vZGUoKSkgcmV0dXJuO1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50SW5kZXgoKSA9PT0gMClcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEluZGV4KHRoaXMuYXBwb2ludG1lbnRzKCkubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEluZGV4KCh0aGlzLmN1cnJlbnRJbmRleCgpIC0gMSkgJSB0aGlzLmFwcG9pbnRtZW50cygpLmxlbmd0aCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5nb05leHQgPSBmdW5jdGlvbiBnb05leHQoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmVkaXRNb2RlKCkpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEluZGV4KCh0aGlzLmN1cnJlbnRJbmRleCgpICsgMSkgJSB0aGlzLmFwcG9pbnRtZW50cygpLmxlbmd0aCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuZWRpdCA9IGZ1bmN0aW9uIGVkaXQoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWRpdE1vZGUodHJ1ZSk7XHJcbiAgICAgICAgfS5iaW5kKGFwcG9pbnRtZW50c0RhdGFWaWV3KTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5jYW5jZWwgPSBmdW5jdGlvbiBjYW5jZWwoKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBpZiBpcyBuZXcsIGRpc2NhcmRcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXNOZXcoKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXdBcHBvaW50bWVudChudWxsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIHJldmVydCBjaGFuZ2VzXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRBcHBvaW50bWVudChuZXcgQXBwb2ludG1lbnQodGhpcy5vcmlnaW5hbEVkaXRlZEFwcG9pbnRtZW50KSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuZWRpdE1vZGUoZmFsc2UpO1xyXG4gICAgICAgIH0uYmluZChhcHBvaW50bWVudHNEYXRhVmlldyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICAgICAgICAgIC8vIElmIGlzIGEgbmV3IG9uZSwgYWRkIGl0IHRvIHRoZSBjb2xsZWN0aW9uXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzTmV3KCkpIHtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdmFyIG5ld0FwdCA9IHRoaXMubmV3QXBwb2ludG1lbnQoKTtcclxuICAgICAgICAgICAgICAgIC8vIFRPRE86IHNvbWUgZmllZHMgbmVlZCBzb21lIGtpbmQgb2YgY2FsY3VsYXRpb24gdGhhdCBpcyBwZXJzaXN0ZWRcclxuICAgICAgICAgICAgICAgIC8vIHNvbiBjYW5ub3QgYmUgY29tcHV0ZWQuIFNpbXVsYXRlZDpcclxuICAgICAgICAgICAgICAgIG5ld0FwdC5zdW1tYXJ5KCdNYXNzYWdlIFRoZXJhcGlzdCBCb29raW5nJyk7XHJcbiAgICAgICAgICAgICAgICBuZXdBcHQuaWQoNCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIEFkZCB0byB0aGUgbGlzdDpcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwb2ludG1lbnRzLnB1c2gobmV3QXB0KTtcclxuICAgICAgICAgICAgICAgIC8vIG5vdywgcmVzZXRcclxuICAgICAgICAgICAgICAgIHRoaXMubmV3QXBwb2ludG1lbnQobnVsbCk7XHJcbiAgICAgICAgICAgICAgICAvLyBjdXJyZW50IGluZGV4IG11c3QgYmUgdGhlIGp1c3QtYWRkZWQgYXB0XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCh0aGlzLmFwcG9pbnRtZW50cygpLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBPbiBhZGRpbmcgYSBuZXcgb25lLCB0aGUgY29uZmlybWF0aW9uIHBhZ2UgbXVzdCBiZSBzaG93ZWRcclxuICAgICAgICAgICAgICAgIGFwcC5zaGVsbC5nbygnYm9va2luZ0NvbmZpcm1hdGlvbicsIHtcclxuICAgICAgICAgICAgICAgICAgICBib29raW5nOiBuZXdBcHRcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmVkaXRNb2RlKGZhbHNlKTtcclxuICAgICAgICB9LmJpbmQoYXBwb2ludG1lbnRzRGF0YVZpZXcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmVkaXRNb2RlLnN1YnNjcmliZShmdW5jdGlvbihpc0VkaXQpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuJGFjdGl2aXR5LnRvZ2dsZUNsYXNzKCdpbi1lZGl0JywgaXNFZGl0KTtcclxuICAgICAgICAgICAgdGhpcy4kYXBwb2ludG1lbnRWaWV3LmZpbmQoJy5BcHBvaW50bWVudENhcmQnKS50b2dnbGVDbGFzcygnaW4tZWRpdCcsIGlzRWRpdCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaXNFZGl0KSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgYSBjb3B5IG9mIHRoZSBhcHBvaW50bWVudCBzbyB3ZSByZXZlcnQgb24gJ2NhbmNlbCdcclxuICAgICAgICAgICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3Lm9yaWdpbmFsRWRpdGVkQXBwb2ludG1lbnQgPSBcclxuICAgICAgICAgICAgICAgICAgICBrby50b0pTKGFwcG9pbnRtZW50c0RhdGFWaWV3LmN1cnJlbnRBcHBvaW50bWVudCgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmN1cnJlbnREYXRlID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgYXB0ID0gdGhpcy5jdXJyZW50QXBwb2ludG1lbnQoKSxcclxuICAgICAgICAgICAgICAgIGp1c3REYXRlID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmIChhcHQgJiYgYXB0LnN0YXJ0VGltZSgpKVxyXG4gICAgICAgICAgICAgICAganVzdERhdGUgPSBtb21lbnQoYXB0LnN0YXJ0VGltZSgpKS5ob3VycygwKS5taW51dGVzKDApLnNlY29uZHMoMCkudG9EYXRlKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4ganVzdERhdGU7XHJcbiAgICAgICAgfSwgYXBwb2ludG1lbnRzRGF0YVZpZXcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAgICBFeHRlcm5hbCBhY3Rpb25zXHJcbiAgICAgICAgKiovXHJcbiAgICAgICAgdmFyIGVkaXRGaWVsZE9uID0gZnVuY3Rpb24gZWRpdEZpZWxkT24oYWN0aXZpdHksIGRhdGEpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIEluY2x1ZGUgYXBwb2ludG1lbnQgdG8gcmVjb3ZlciBzdGF0ZSBvbiByZXR1cm46XHJcbiAgICAgICAgICAgIGRhdGEuYXBwb2ludG1lbnQgPSBhcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50QXBwb2ludG1lbnQoKS5tb2RlbC50b1BsYWluT2JqZWN0KHRydWUpO1xyXG5cclxuICAgICAgICAgICAgYXBwLnNoZWxsLmdvKGFjdGl2aXR5LCBkYXRhKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LnBpY2tEYXRlVGltZSA9IGZ1bmN0aW9uIHBpY2tEYXRlVGltZSgpIHtcclxuXHJcbiAgICAgICAgICAgIGVkaXRGaWVsZE9uKCdkYXRldGltZVBpY2tlcicsIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdGVkRGF0ZXRpbWU6IG51bGxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5waWNrQ2xpZW50ID0gZnVuY3Rpb24gcGlja0NsaWVudCgpIHtcclxuXHJcbiAgICAgICAgICAgIGVkaXRGaWVsZE9uKCdjbGllbnRzJywge1xyXG4gICAgICAgICAgICAgICAgc2VsZWN0Q2xpZW50OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRDbGllbnQ6IG51bGxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcucGlja1NlcnZpY2UgPSBmdW5jdGlvbiBwaWNrU2VydmljZSgpIHtcclxuXHJcbiAgICAgICAgICAgIGVkaXRGaWVsZE9uKCdzZXJ2aWNlcycsIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdFNlcnZpY2VzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRTZXJ2aWNlczogYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50KCkuc2VydmljZXMoKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5jaGFuZ2VQcmljZSA9IGZ1bmN0aW9uIGNoYW5nZVByaWNlKCkge1xyXG4gICAgICAgICAgICAvLyBUT0RPXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5waWNrTG9jYXRpb24gPSBmdW5jdGlvbiBwaWNrTG9jYXRpb24oKSB7XHJcblxyXG4gICAgICAgICAgICBlZGl0RmllbGRPbignbG9jYXRpb25zJywge1xyXG4gICAgICAgICAgICAgICAgc2VsZWN0TG9jYXRpb246IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzZWxlY3RlZExvY2F0aW9uOiBhcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50QXBwb2ludG1lbnQoKS5sb2NhdGlvbigpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciB0ZXh0RmllbGRzSGVhZGVycyA9IHtcclxuICAgICAgICAgICAgcHJlTm90ZXNUb0NsaWVudDogJ05vdGVzIHRvIGNsaWVudCcsXHJcbiAgICAgICAgICAgIHBvc3ROb3Rlc1RvQ2xpZW50OiAnTm90ZXMgdG8gY2xpZW50IChhZnRlcndhcmRzKScsXHJcbiAgICAgICAgICAgIHByZU5vdGVzVG9TZWxmOiAnTm90ZXMgdG8gc2VsZicsXHJcbiAgICAgICAgICAgIHBvc3ROb3Rlc1RvU2VsZjogJ0Jvb2tpbmcgc3VtbWFyeSdcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmVkaXRUZXh0RmllbGQgPSBmdW5jdGlvbiBlZGl0VGV4dEZpZWxkKGZpZWxkKSB7XHJcblxyXG4gICAgICAgICAgICBlZGl0RmllbGRPbigndGV4dEVkaXRvcicsIHtcclxuICAgICAgICAgICAgICAgIHJlcXVlc3Q6ICd0ZXh0RWRpdG9yJyxcclxuICAgICAgICAgICAgICAgIGZpZWxkOiBmaWVsZCxcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBhcHBvaW50bWVudHNEYXRhVmlldy5pc05ldygpID8gJ05ldyBib29raW5nJyA6ICdCb29raW5nJyxcclxuICAgICAgICAgICAgICAgIGhlYWRlcjogdGV4dEZpZWxkc0hlYWRlcnNbZmllbGRdLFxyXG4gICAgICAgICAgICAgICAgdGV4dDogYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50KClbZmllbGRdKClcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGtvLmFwcGx5QmluZGluZ3MoYXBwb2ludG1lbnRzRGF0YVZpZXcsIHRoaXMuJGFjdGl2aXR5LmdldCgwKSk7XHJcbiAgICB9XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgYm9va2luZ0NvbmZpcm1hdGlvbiBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxuICAgIFxyXG52YXIgc2luZ2xldG9uID0gbnVsbDtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRDbGllbnRzKCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcclxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgQm9va2luZ0NvbmZpcm1hdGlvbkFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIEJvb2tpbmdDb25maXJtYXRpb25BY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcclxuICAgIFxyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuXHJcbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xyXG4gICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLmRhdGFWaWV3LCAkYWN0aXZpdHkuZ2V0KDApKTtcclxufVxyXG5cclxuQm9va2luZ0NvbmZpcm1hdGlvbkFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5ib29raW5nKVxyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuYm9va2luZyhvcHRpb25zLmJvb2tpbmcpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIC8vIDpBcHBvaW50bWVudFxyXG4gICAgdGhpcy5ib29raW5nID0ga28ub2JzZXJ2YWJsZShudWxsKTtcclxufVxyXG4iLCIvKiogQ2FsZW5kYXIgYWN0aXZpdHkgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxucmVxdWlyZSgnLi4vY29tcG9uZW50cy9EYXRlUGlja2VyJyk7XHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbnZhciBDYWxlbmRhclNsb3QgPSByZXF1aXJlKCcuLi9tb2RlbHMvQ2FsZW5kYXJTbG90JyksXHJcbiAgICBOYXZCYXIgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkJhcicpLFxyXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcclxuXHJcbnZhciBzaW5nbGV0b24gPSBudWxsO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdENhbGVuZGFyKCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcclxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgQ2FsZW5kYXJBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XHJcbiAgICBcclxuICAgIHJldHVybiBzaW5nbGV0b247XHJcbn07XHJcblxyXG5mdW5jdGlvbiBDYWxlbmRhckFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xyXG4gICAgdGhpcy5uYXZCYXIgPSBuZXcgTmF2QmFyKHtcclxuICAgICAgICB0aXRsZTogJ0NhbGVuZGFyJyxcclxuICAgICAgICBsZWZ0QWN0aW9uOiBOYXZBY3Rpb24ubWVudU5ld0l0ZW0sXHJcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5tZW51SW5cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvKiBHZXR0aW5nIGVsZW1lbnRzICovXHJcbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcclxuICAgIHRoaXMuJGRhdGVwaWNrZXIgPSAkYWN0aXZpdHkuZmluZCgnI2NhbGVuZGFyRGF0ZVBpY2tlcicpO1xyXG4gICAgdGhpcy4kZGFpbHlWaWV3ID0gJGFjdGl2aXR5LmZpbmQoJyNjYWxlbmRhckRhaWx5VmlldycpO1xyXG4gICAgdGhpcy4kZGF0ZUhlYWRlciA9ICRhY3Rpdml0eS5maW5kKCcjY2FsZW5kYXJEYXRlSGVhZGVyJyk7XHJcbiAgICB0aGlzLiRkYXRlVGl0bGUgPSB0aGlzLiRkYXRlSGVhZGVyLmNoaWxkcmVuKCcuQ2FsZW5kYXJEYXRlSGVhZGVyLWRhdGUnKTtcclxuICAgIHRoaXMuJGNob29zZU5ldyA9ICQoJyNjYWxlbmRhckNob29zZU5ldycpO1xyXG4gICAgdGhpcy5hcHAgPSBhcHA7XHJcbiAgICBcclxuICAgIC8qIEluaXQgY29tcG9uZW50cyAqL1xyXG4gICAgdGhpcy4kZGF0ZXBpY2tlci5zaG93KCkuZGF0ZXBpY2tlcigpO1xyXG5cclxuICAgIC8vIERhdGFcclxuICAgIHRoaXMuZGF0YVZpZXcgPSBuZXcgVmlld01vZGVsKCk7XHJcbiAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMuZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xyXG5cclxuICAgIC8vIFRlc3RpbmcgZGF0YVxyXG4gICAgdGhpcy5kYXRhVmlldy5zbG90c0RhdGEocmVxdWlyZSgnLi4vdGVzdGRhdGEvY2FsZW5kYXJTbG90cycpLmNhbGVuZGFyKTtcclxuICAgIFxyXG4gICAgLy8gT2JqZWN0IHRvIGhvbGQgdGhlIG9wdGlvbnMgcGFzc2VkIG9uICdzaG93JyBhcyBhIHJlc3VsdFxyXG4gICAgLy8gb2YgYSByZXF1ZXN0IGZyb20gYW5vdGhlciBhY3Rpdml0eVxyXG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XHJcblxyXG4gICAgLyogRXZlbnQgaGFuZGxlcnMgKi9cclxuICAgIC8vIENoYW5nZXMgb24gY3VycmVudERhdGVcclxuICAgIHRoaXMuZGF0YVZpZXcuY3VycmVudERhdGUuc3Vic2NyaWJlKGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgICAgICBcclxuICAgICAgICAvLyBUcmlnZ2VyIGEgbGF5b3V0IHVwZGF0ZSwgcmVxdWlyZWQgYnkgdGhlIGZ1bGwtaGVpZ2h0IGZlYXR1cmVcclxuICAgICAgICAkKHdpbmRvdykudHJpZ2dlcignbGF5b3V0VXBkYXRlJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGRhdGUpIHtcclxuICAgICAgICAgICAgdmFyIG1kYXRlID0gbW9tZW50KGRhdGUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1kYXRlLmlzVmFsaWQoKSkge1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB2YXIgaXNvRGF0ZSA9IG1kYXRlLnRvSVNPU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBkYXRlcGlja2VyIHNlbGVjdGVkIGRhdGUgb24gZGF0ZSBjaGFuZ2UgKGZyb20gXHJcbiAgICAgICAgICAgICAgICAvLyBhIGRpZmZlcmVudCBzb3VyY2UgdGhhbiB0aGUgZGF0ZXBpY2tlciBpdHNlbGZcclxuICAgICAgICAgICAgICAgIHRoaXMuJGRhdGVwaWNrZXIucmVtb3ZlQ2xhc3MoJ2lzLXZpc2libGUnKTtcclxuICAgICAgICAgICAgICAgIC8vIENoYW5nZSBub3QgZnJvbSB0aGUgd2lkZ2V0P1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuJGRhdGVwaWNrZXIuZGF0ZXBpY2tlcignZ2V0VmFsdWUnKS50b0lTT1N0cmluZygpICE9PSBpc29EYXRlKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJGRhdGVwaWNrZXIuZGF0ZXBpY2tlcignc2V0VmFsdWUnLCBkYXRlLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBPbiBjdXJyZW50RGF0ZSBjaGFuZ2VzLCB1cGRhdGUgdGhlIFVSTFxyXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogc2F2ZSBhIHVzZWZ1bCBzdGF0ZVxyXG4gICAgICAgICAgICAgICAgLy8gRE9VQlQ6IHB1c2ggb3IgcmVwbGFjZSBzdGF0ZT8gKG1vcmUgaGlzdG9yeSBlbnRyaWVzIG9yIHRoZSBzYW1lPylcclxuICAgICAgICAgICAgICAgIGFwcC5zaGVsbC5oaXN0b3J5LnB1c2hTdGF0ZShudWxsLCBudWxsLCAnY2FsZW5kYXIvJyArIGlzb0RhdGUpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBET05FXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gU29tZXRoaW5nIGZhaWwsIGJhZCBkYXRlIG9yIG5vdCBkYXRlIGF0IGFsbFxyXG4gICAgICAgIC8vIFNldCB0aGUgY3VycmVudCBvbmVcclxuICAgICAgICB0aGlzLmRhdGFWaWV3LmN1cnJlbnREYXRlKG5ldyBEYXRlKCkpO1xyXG5cclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgLy8gU3dpcGUgZGF0ZSBvbiBnZXN0dXJlXHJcbiAgICB0aGlzLiRkYWlseVZpZXdcclxuICAgIC5vbignc3dpcGVsZWZ0IHN3aXBlcmlnaHQnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBkaXIgPSBlLnR5cGUgPT09ICdzd2lwZWxlZnQnID8gJ25leHQnIDogJ3ByZXYnO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEhhY2sgdG8gc29sdmUgdGhlIGZyZWV6eS1zd2lwZSBhbmQgdGFwLWFmdGVyIGJ1ZyBvbiBKUU06XHJcbiAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcigndG91Y2hlbmQnKTtcclxuICAgICAgICAvLyBDaGFuZ2UgZGF0ZVxyXG4gICAgICAgIHRoaXMuJGRhdGVwaWNrZXIuZGF0ZXBpY2tlcignbW92ZVZhbHVlJywgZGlyLCAnZGF0ZScpO1xyXG5cclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICBcclxuICAgIC8vIENoYW5naW5nIGRhdGUgd2l0aCBidXR0b25zOlxyXG4gICAgdGhpcy4kZGF0ZUhlYWRlci5vbigndGFwJywgJy5DYWxlbmRhckRhdGVIZWFkZXItc3dpdGNoJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHN3aXRjaCAoZS5jdXJyZW50VGFyZ2V0LmdldEF0dHJpYnV0ZSgnaHJlZicpKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJyNwcmV2JzpcclxuICAgICAgICAgICAgICAgIHRoaXMuJGRhdGVwaWNrZXIuZGF0ZXBpY2tlcignbW92ZVZhbHVlJywgJ3ByZXYnLCAnZGF0ZScpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJyNuZXh0JzpcclxuICAgICAgICAgICAgICAgIHRoaXMuJGRhdGVwaWNrZXIuZGF0ZXBpY2tlcignbW92ZVZhbHVlJywgJ25leHQnLCAnZGF0ZScpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAvLyBMZXRzIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAvLyBTaG93aW5nIGRhdGVwaWNrZXIgd2hlbiBwcmVzc2luZyB0aGUgdGl0bGVcclxuICAgIHRoaXMuJGRhdGVUaXRsZS5vbigndGFwJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHRoaXMuJGRhdGVwaWNrZXIudG9nZ2xlQ2xhc3MoJ2lzLXZpc2libGUnKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgLy8gVXBkYXRpbmcgdmlldyBkYXRlIHdoZW4gcGlja2VkIGFub3RoZXIgb25lXHJcbiAgICB0aGlzLiRkYXRlcGlja2VyLm9uKCdjaGFuZ2VEYXRlJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGlmIChlLnZpZXdNb2RlID09PSAnZGF5cycpIHtcclxuICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5jdXJyZW50RGF0ZShlLmRhdGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgLy8gU2V0IGRhdGUgdG8gbWF0Y2ggZGF0ZXBpY2tlciBmb3IgZmlyc3QgdXBkYXRlXHJcbiAgICB0aGlzLmRhdGFWaWV3LmN1cnJlbnREYXRlKHRoaXMuJGRhdGVwaWNrZXIuZGF0ZXBpY2tlcignZ2V0VmFsdWUnKSk7XHJcbn1cclxuXHJcbkNhbGVuZGFyQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcclxuICAgIC8qIGpzaGludCBtYXhjb21wbGV4aXR5OjEwICovXHJcbiAgICBcclxuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMucm91dGUgJiYgb3B0aW9ucy5yb3V0ZS5zZWdtZW50cykge1xyXG4gICAgICAgIHZhciBzZGF0ZSA9IG9wdGlvbnMucm91dGUuc2VnbWVudHNbMF0sXHJcbiAgICAgICAgICAgIG1kYXRlID0gbW9tZW50KHNkYXRlKSxcclxuICAgICAgICAgICAgZGF0ZSA9IG1kYXRlLmlzVmFsaWQoKSA/IG1kYXRlLnRvRGF0ZSgpIDogbnVsbDtcclxuXHJcbiAgICAgICAgaWYgKGRhdGUpXHJcbiAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcuY3VycmVudERhdGUoZGF0ZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XHJcblxyXG4gICAgdGhpcy5zbG90cyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcbiAgICB0aGlzLnNsb3RzRGF0YSA9IGtvLm9ic2VydmFibGUoe30pO1xyXG4gICAgdGhpcy5jdXJyZW50RGF0ZSA9IGtvLm9ic2VydmFibGUobmV3IERhdGUoKSk7XHJcbiAgICBcclxuICAgIC8vIFVwZGF0ZSBjdXJyZW50IHNsb3RzIG9uIGRhdGUgY2hhbmdlXHJcbiAgICB0aGlzLmN1cnJlbnREYXRlLnN1YnNjcmliZShmdW5jdGlvbiAoZGF0ZSkge1xyXG5cclxuICAgICAgICB2YXIgbWRhdGUgPSBtb21lbnQoZGF0ZSksXHJcbiAgICAgICAgICAgIHNkYXRlID0gbWRhdGUuZm9ybWF0KCdZWVlZLU1NLUREJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHNsb3RzID0gdGhpcy5zbG90c0RhdGEoKTtcclxuXHJcbiAgICAgICAgaWYgKHNsb3RzLmhhc093blByb3BlcnR5KHNkYXRlKSkge1xyXG4gICAgICAgICAgICB0aGlzLnNsb3RzKHNsb3RzW3NkYXRlXSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5zbG90cyhzbG90c1snZGVmYXVsdCddKTtcclxuICAgICAgICB9XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59XHJcbiIsIi8qKlxuICAgIENsaWVudEVkaXRpb24gYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBDbGllbnRFZGl0aW9uQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ2NsaWVudHMnKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG52YXIgQ2xpZW50ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0NsaWVudCcpO1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgXG4gICAgdGhpcy5jbGllbnQgPSBrby5vYnNlcnZhYmxlKG5ldyBDbGllbnQoKSk7XG4gICAgXG4gICAgdGhpcy5oZWFkZXIgPSBrby5vYnNlcnZhYmxlKCdFZGl0IExvY2F0aW9uJyk7XG4gICAgXG4gICAgLy8gVE9ET1xuICAgIHRoaXMuc2F2ZSA9IGZ1bmN0aW9uKCkge307XG4gICAgdGhpcy5jYW5jZWwgPSBmdW5jdGlvbigpIHt9O1xufVxuIiwiLyoqXHJcbiAgICBjbGllbnRzIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKSxcclxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyk7XHJcbiAgICBcclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG5cclxudmFyIHNpbmdsZXRvbiA9IG51bGw7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0Q2xpZW50cygkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXHJcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IENsaWVudHNBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XHJcbiAgICBcclxuICAgIHJldHVybiBzaW5nbGV0b247XHJcbn07XHJcblxyXG5mdW5jdGlvbiBDbGllbnRzQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLlByb3ZpZGVyO1xyXG4gICAgXHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ0NsaWVudHMnKTtcclxuICAgIFxyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuICAgIHRoaXMuJGluZGV4ID0gJGFjdGl2aXR5LmZpbmQoJyNjbGllbnRzSW5kZXgnKTtcclxuICAgIHRoaXMuJGxpc3RWaWV3ID0gJGFjdGl2aXR5LmZpbmQoJyNjbGllbnRzTGlzdFZpZXcnKTtcclxuXHJcbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xyXG4gICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLmRhdGFWaWV3LCAkYWN0aXZpdHkuZ2V0KDApKTtcclxuXHJcbiAgICAvLyBUZXN0aW5nRGF0YVxyXG4gICAgdGhpcy5kYXRhVmlldy5jbGllbnRzKHJlcXVpcmUoJy4uL3Rlc3RkYXRhL2NsaWVudHMnKS5jbGllbnRzKTtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciB0byB1cGRhdGUgaGVhZGVyIGJhc2VkIG9uIGEgbW9kZSBjaGFuZ2U6XHJcbiAgICB0aGlzLmRhdGFWaWV3LmlzU2VsZWN0aW9uTW9kZS5zdWJzY3JpYmUoZnVuY3Rpb24gKGl0SXMpIHtcclxuICAgICAgICB0aGlzLmRhdGFWaWV3LmhlYWRlclRleHQoaXRJcyA/ICdTZWxlY3QgYSBjbGllbnQnIDogJycpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAvLyBPYmplY3QgdG8gaG9sZCB0aGUgb3B0aW9ucyBwYXNzZWQgb24gJ3Nob3cnIGFzIGEgcmVzdWx0XHJcbiAgICAvLyBvZiBhIHJlcXVlc3QgZnJvbSBhbm90aGVyIGFjdGl2aXR5XHJcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gbnVsbDtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciB0byBnbyBiYWNrIHdpdGggdGhlIHNlbGVjdGVkIGNsaWVudCB3aGVuIFxyXG4gICAgLy8gdGhlcmUgaXMgb25lIHNlbGVjdGVkIGFuZCByZXF1ZXN0SW5mbyBpcyBmb3JcclxuICAgIC8vICdzZWxlY3QgbW9kZSdcclxuICAgIHRoaXMuZGF0YVZpZXcuc2VsZWN0ZWRDbGllbnQuc3Vic2NyaWJlKGZ1bmN0aW9uICh0aGVTZWxlY3RlZENsaWVudCkge1xyXG4gICAgICAgIC8vIFdlIGhhdmUgYSByZXF1ZXN0IGFuZFxyXG4gICAgICAgIC8vIGl0IHJlcXVlc3RlZCB0byBzZWxlY3QgYSBjbGllbnQsXHJcbiAgICAgICAgLy8gYW5kIGEgc2VsZWN0ZWQgY2xpZW50XHJcbiAgICAgICAgaWYgKHRoaXMucmVxdWVzdEluZm8gJiZcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mby5zZWxlY3RDbGllbnQgPT09IHRydWUgJiZcclxuICAgICAgICAgICAgdGhlU2VsZWN0ZWRDbGllbnQpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFBhc3MgdGhlIHNlbGVjdGVkIGNsaWVudCBpbiB0aGUgaW5mb1xyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvLnNlbGVjdGVkQ2xpZW50ID0gdGhlU2VsZWN0ZWRDbGllbnQ7XHJcbiAgICAgICAgICAgIC8vIEFuZCBnbyBiYWNrXHJcbiAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvQmFjayh0aGlzLnJlcXVlc3RJbmZvKTtcclxuICAgICAgICAgICAgLy8gTGFzdCwgY2xlYXIgcmVxdWVzdEluZm9cclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufVxyXG5cclxuQ2xpZW50c0FjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcblxyXG4gICAgLy8gT24gZXZlcnkgc2hvdywgc2VhcmNoIGdldHMgcmVzZXRlZFxyXG4gICAgdGhpcy5kYXRhVmlldy5zZWFyY2hUZXh0KCcnKTtcclxuICBcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG9wdGlvbnM7XHJcblxyXG4gICAgdGhpcy5kYXRhVmlldy5pc1NlbGVjdGlvbk1vZGUob3B0aW9ucy5zZWxlY3RDbGllbnQgPT09IHRydWUpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJycpO1xyXG5cclxuICAgIC8vIEVzcGVjaWFsIG1vZGUgd2hlbiBpbnN0ZWFkIG9mIHBpY2sgYW5kIGVkaXQgd2UgYXJlIGp1c3Qgc2VsZWN0aW5nXHJcbiAgICAvLyAod2hlbiBlZGl0aW5nIGFuIGFwcG9pbnRtZW50KVxyXG4gICAgdGhpcy5pc1NlbGVjdGlvbk1vZGUgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuXHJcbiAgICAvLyBGdWxsIGxpc3Qgb2YgY2xpZW50c1xyXG4gICAgdGhpcy5jbGllbnRzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcclxuICAgIFxyXG4gICAgLy8gU2VhcmNoIHRleHQsIHVzZWQgdG8gZmlsdGVyICdjbGllbnRzJ1xyXG4gICAgdGhpcy5zZWFyY2hUZXh0ID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcbiAgICBcclxuICAgIC8vIFV0aWxpdHkgdG8gZ2V0IGEgZmlsdGVyZWQgbGlzdCBvZiBjbGllbnRzIGJhc2VkIG9uIGNsaWVudHNcclxuICAgIHRoaXMuZ2V0RmlsdGVyZWRMaXN0ID0gZnVuY3Rpb24gZ2V0RmlsdGVyZWRMaXN0KCkge1xyXG4gICAgICAgIHZhciBzID0gKHRoaXMuc2VhcmNoVGV4dCgpIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnRzKCkuZmlsdGVyKGZ1bmN0aW9uKGNsaWVudCkge1xyXG4gICAgICAgICAgICB2YXIgbiA9IGNsaWVudCAmJiBjbGllbnQuZnVsbE5hbWUoKSB8fCAnJztcclxuICAgICAgICAgICAgbiA9IG4udG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgcmV0dXJuIG4uaW5kZXhPZihzKSA+IC0xO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBGaWx0ZXJlZCBsaXN0IG9mIGNsaWVudHNcclxuICAgIHRoaXMuZmlsdGVyZWRDbGllbnRzID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RmlsdGVyZWRMaXN0KCk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgLy8gR3JvdXBlZCBsaXN0IG9mIGZpbHRlcmVkIGNsaWVudHNcclxuICAgIHRoaXMuZ3JvdXBlZENsaWVudHMgPSBrby5jb21wdXRlZChmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICB2YXIgY2xpZW50cyA9IHRoaXMuZmlsdGVyZWRDbGllbnRzKCkuc29ydChmdW5jdGlvbihjbGllbnRBLCBjbGllbnRCKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjbGllbnRBLmZpcnN0TmFtZSgpID4gY2xpZW50Qi5maXJzdE5hbWUoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgZ3JvdXBzID0gW10sXHJcbiAgICAgICAgICAgIGxhdGVzdEdyb3VwID0gbnVsbCxcclxuICAgICAgICAgICAgbGF0ZXN0TGV0dGVyID0gbnVsbDtcclxuXHJcbiAgICAgICAgY2xpZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGNsaWVudCkge1xyXG4gICAgICAgICAgICB2YXIgbGV0dGVyID0gKGNsaWVudC5maXJzdE5hbWUoKVswXSB8fCAnJykudG9VcHBlckNhc2UoKTtcclxuICAgICAgICAgICAgaWYgKGxldHRlciAhPT0gbGF0ZXN0TGV0dGVyKSB7XHJcbiAgICAgICAgICAgICAgICBsYXRlc3RHcm91cCA9IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXR0ZXI6IGxldHRlcixcclxuICAgICAgICAgICAgICAgICAgICBjbGllbnRzOiBbY2xpZW50XVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGdyb3Vwcy5wdXNoKGxhdGVzdEdyb3VwKTtcclxuICAgICAgICAgICAgICAgIGxhdGVzdExldHRlciA9IGxldHRlcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxhdGVzdEdyb3VwLmNsaWVudHMucHVzaChjbGllbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBncm91cHM7XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2VsZWN0ZWRDbGllbnQgPSBrby5vYnNlcnZhYmxlKG51bGwpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlbGVjdENsaWVudCA9IGZ1bmN0aW9uKHNlbGVjdGVkQ2xpZW50KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZENsaWVudChzZWxlY3RlZENsaWVudCk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbn1cclxuIiwiLyoqXG4gICAgQ01TIGFjdGl2aXR5XG4gICAgKENsaWVudCBNYW5hZ2VtZW50IFN5c3RlbSlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQ21zQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIoJ0NsaWVudCBtYW5hZ2VtZW50Jyk7XG4gICAgXG4gICAgLy8gS2VlcCBjbGllbnRzQ291bnQgdXBkYXRlZFxuICAgIC8vIFRPRE8gdGhpcy5hcHAubW9kZWwuY2xpZW50c1xuICAgIHZhciBjbGllbnRzID0ga28ub2JzZXJ2YWJsZUFycmF5KHJlcXVpcmUoJy4uL3Rlc3RkYXRhL2NsaWVudHMnKS5jbGllbnRzKTtcbiAgICB0aGlzLnZpZXdNb2RlbC5jbGllbnRzQ291bnQoY2xpZW50cygpLmxlbmd0aCk7XG4gICAgY2xpZW50cy5zdWJzY3JpYmUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudmlld01vZGVsLmNsaWVudHNDb3VudChjbGllbnRzKCkubGVuZ3RoKTtcbiAgICB9LmJpbmQodGhpcykpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuICAgIFxuICAgIHRoaXMuY2xpZW50c0NvdW50ID0ga28ub2JzZXJ2YWJsZSgpO1xufVxuIiwiLyoqXG4gICAgQ29udGFjdEZvcm0gYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBDb250YWN0Rm9ybUFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdUYWxrIHRvIHVzJyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuICAgIFxuICAgIHRoaXMubWVzc2FnZSA9IGtvLm9ic2VydmFibGUoJycpO1xuICAgIHRoaXMud2FzU2VudCA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xuXG4gICAgdmFyIHVwZGF0ZVdhc1NlbnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy53YXNTZW50KGZhbHNlKTtcbiAgICB9LmJpbmQodGhpcyk7XG4gICAgdGhpcy5tZXNzYWdlLnN1YnNjcmliZSh1cGRhdGVXYXNTZW50KTtcbiAgICBcbiAgICB0aGlzLnNlbmQgPSBmdW5jdGlvbiBzZW5kKCkge1xuICAgICAgICAvLyBUT0RPOiBTZW5kXG4gICAgICAgIFxuICAgICAgICAvLyBSZXNldCBhZnRlciBiZWluZyBzZW50XG4gICAgICAgIHRoaXMubWVzc2FnZSgnJyk7XG4gICAgICAgIHRoaXMud2FzU2VudCh0cnVlKTtcblxuICAgIH0uYmluZCh0aGlzKTtcbn1cbiIsIi8qKlxuICAgIENvbnRhY3RJbmZvIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIHNpbmdsZXRvbiA9IG51bGwsXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxuICAgIE5hdkJhciA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QmFyJyksXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdENvbnRhY3RJbmZvKCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgQ29udGFjdEluZm9BY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XG4gICAgXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbn07XG5cbmZ1bmN0aW9uIENvbnRhY3RJbmZvQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xuICAgIHRoaXMuZGF0YVZpZXcucHJvZmlsZSA9IGFwcC5tb2RlbC51c2VyO1xuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XG5cbiAgICB0aGlzLm5hdkJhciA9IG5ldyBOYXZCYXIoe1xuICAgICAgICB0aXRsZTogJycsXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5nb0JhY2subW9kZWwuY2xvbmUoe1xuICAgICAgICAgICAgdGV4dDogJ0FjY291bnQnLFxuICAgICAgICAgICAgaXNUaXRsZTogdHJ1ZVxuICAgICAgICB9KSxcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5nb0hlbHBJbmRleFxuICAgIH0pO1xuICAgIFxuICAgIGFwcC5tb2RlbC51c2VyKCkub25ib2FyZGluZ1N0ZXAuc3Vic2NyaWJlKGZ1bmN0aW9uIChzdGVwKSB7XG4gICAgICAgIFxuICAgICAgICBpZiAoc3RlcCkge1xuICAgICAgICAgICAgLy8gVE9ETyBTZXQgbmF2YmFyIHN0ZXAgaW5kZXhcbiAgICAgICAgICAgIC8vIFNldHRpbmcgbmF2YmFyIGZvciBPbmJvYXJkaW5nL3dpemFyZCBtb2RlXG4gICAgICAgICAgICB0aGlzLm5hdkJhci5sZWZ0QWN0aW9uKCkudGV4dCgnJyk7XG4gICAgICAgICAgICAvLyBTZXR0aW5nIGhlYWRlclxuICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5oZWFkZXJUZXh0KCdIb3cgY2FuIHdlIHJlYWNoIHlvdT8nKTtcbiAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcuYnV0dG9uVGV4dCgnU2F2ZSBhbmQgY29udGludWUnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRPRE8gUmVtb3ZlIHN0ZXAgaW5kZXhcbiAgICAgICAgICAgIC8vIFNldHRpbmcgbmF2YmFyIHRvIGRlZmF1bHRcbiAgICAgICAgICAgIHRoaXMubmF2QmFyLmxlZnRBY3Rpb24oKS50ZXh0KCdBY2NvdW50Jyk7XG4gICAgICAgICAgICAvLyBTZXR0aW5nIGhlYWRlciB0byBkZWZhdWx0XG4gICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmhlYWRlclRleHQoJ0NvbnRhY3QgaW5mb3JtYXRpb24nKTtcbiAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcuYnV0dG9uVGV4dCgnU2F2ZScpO1xuICAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbn1cblxuQ29udGFjdEluZm9BY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuXG59O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG5cbiAgICB0aGlzLmhlYWRlclRleHQgPSBrby5vYnNlcnZhYmxlKCdDb250YWN0IGluZm9ybWF0aW9uJyk7XG4gICAgdGhpcy5idXR0b25UZXh0ID0ga28ub2JzZXJ2YWJsZSgnU2F2ZScpO1xuICAgIHRoaXMucHJvZmlsZSA9IGtvLm9ic2VydmFibGUoKTtcbn1cbiIsIi8qKlxuICAgIENvbnZlcnNhdGlvbiBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIENvbnZlcnNhdGlvbkFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdJbmJveCcpO1xuICAgIFxuICAgIC8vIFRlc3RpbmdEYXRhXG4gICAgc2V0U29tZVRlc3RpbmdEYXRhKHRoaXMudmlld01vZGVsKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KHN0YXRlKSB7XG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBzdGF0ZSk7XG4gICAgXG4gICAgaWYgKHN0YXRlICYmIHN0YXRlLnJvdXRlICYmIHN0YXRlLnJvdXRlLnNlZ21lbnRzKSB7XG4gICAgICAgIHRoaXMudmlld01vZGVsLmNvbnZlcnNhdGlvbklEKHBhcnNlSW50KHN0YXRlLnJvdXRlLnNlZ21lbnRzWzBdLCAxMCkgfHwgMCk7XG4gICAgfVxufTtcblxudmFyIE1haWxGb2xkZXIgPSByZXF1aXJlKCcuLi9tb2RlbHMvTWFpbEZvbGRlcicpO1xudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG4gICAgdGhpcy5pbmJveCA9IG5ldyBNYWlsRm9sZGVyKHtcbiAgICAgICAgdG9wTnVtYmVyOiAyMFxuICAgIH0pO1xuICAgIFxuICAgIHRoaXMuY29udmVyc2F0aW9uSUQgPSBrby5vYnNlcnZhYmxlKG51bGwpO1xuICAgIFxuICAgIHRoaXMuY29udmVyc2F0aW9uID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29uSUQgPSB0aGlzLmNvbnZlcnNhdGlvbklEKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmluYm94Lm1lc3NhZ2VzKCkuZmlsdGVyKGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICAgIHJldHVybiB2ICYmIHYuaWQoKSA9PT0gY29uSUQ7XG4gICAgICAgIH0pO1xuICAgIH0sIHRoaXMpO1xuICAgIFxuICAgIHRoaXMuc3ViamVjdCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG0gPSB0aGlzLmNvbnZlcnNhdGlvbigpWzBdO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgbSA/XG4gICAgICAgICAgICBtLnN1YmplY3QoKSA6XG4gICAgICAgICAgICAnQ29udmVyc2F0aW9uIHcvbyBzdWJqZWN0J1xuICAgICAgICApO1xuICAgICAgICBcbiAgICB9LCB0aGlzKTtcbn1cblxuLyoqIFRFU1RJTkcgREFUQSAqKi9cbmZ1bmN0aW9uIHNldFNvbWVUZXN0aW5nRGF0YSh2aWV3TW9kZWwpIHtcbiAgICBcbiAgICB2aWV3TW9kZWwuaW5ib3gubWVzc2FnZXMocmVxdWlyZSgnLi4vdGVzdGRhdGEvbWVzc2FnZXMnKS5tZXNzYWdlcyk7XG59XG4iLCIvKipcclxuICAgIGRhdGV0aW1lUGlja2VyIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpLFxyXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKSxcclxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyk7XHJcbnJlcXVpcmUoJy4uL2NvbXBvbmVudHMvRGF0ZVBpY2tlcicpO1xyXG4gICAgXHJcbnZhciBzaW5nbGV0b24gPSBudWxsO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdERhdGV0aW1lUGlja2VyKCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcclxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgRGF0ZXRpbWVQaWNrZXJBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XHJcblxyXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIERhdGV0aW1lUGlja2VyQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XHJcbiAgICB0aGlzLm5hdkJhciA9IG5ldyBOYXZCYXIoe1xyXG4gICAgICAgIHRpdGxlOiAnJyxcclxuICAgICAgICBsZWZ0QWN0aW9uOiBOYXZBY3Rpb24uZ29CYWNrLFxyXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBOYXZBY3Rpb24uZ29IZWxwSW5kZXhcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xyXG4gICAgdGhpcy4kZGF0ZVBpY2tlciA9ICRhY3Rpdml0eS5maW5kKCcjZGF0ZXRpbWVQaWNrZXJEYXRlUGlja2VyJyk7XHJcbiAgICB0aGlzLiR0aW1lUGlja2VyID0gJGFjdGl2aXR5LmZpbmQoJyNkYXRldGltZVBpY2tlclRpbWVQaWNrZXInKTtcclxuXHJcbiAgICAvKiBJbml0IGNvbXBvbmVudHMgKi9cclxuICAgIHRoaXMuJGRhdGVQaWNrZXIuc2hvdygpLmRhdGVwaWNrZXIoKTtcclxuICAgIFxyXG4gICAgdmFyIGRhdGFWaWV3ID0gdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcclxuICAgIGRhdGFWaWV3LmhlYWRlclRleHQgPSAnU2VsZWN0IGEgc3RhcnQgdGltZSc7XHJcbiAgICBrby5hcHBseUJpbmRpbmdzKGRhdGFWaWV3LCAkYWN0aXZpdHkuZ2V0KDApKTtcclxuICAgIFxyXG4gICAgLy8gRXZlbnRzXHJcbiAgICB0aGlzLiRkYXRlUGlja2VyLm9uKCdjaGFuZ2VEYXRlJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGlmIChlLnZpZXdNb2RlID09PSAnZGF5cycpIHtcclxuICAgICAgICAgICAgZGF0YVZpZXcuc2VsZWN0ZWREYXRlKGUuZGF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIFxyXG4gICAgLy8gVGVzdGluZ0RhdGFcclxuICAgIGRhdGFWaWV3LnNsb3RzRGF0YSA9IHJlcXVpcmUoJy4uL3Rlc3RkYXRhL3RpbWVTbG90cycpLnRpbWVTbG90cztcclxuIFxyXG4gICAgZGF0YVZpZXcuc2VsZWN0ZWREYXRlLnN1YnNjcmliZShmdW5jdGlvbihkYXRlKSB7XHJcbiAgICAgICAgdGhpcy5iaW5kRGF0ZURhdGEoZGF0ZSk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIHRoaXMuYmluZERhdGVEYXRhKG5ldyBEYXRlKCkpO1xyXG4gICAgXHJcbiAgICAvLyBPYmplY3QgdG8gaG9sZCB0aGUgb3B0aW9ucyBwYXNzZWQgb24gJ3Nob3cnIGFzIGEgcmVzdWx0XHJcbiAgICAvLyBvZiBhIHJlcXVlc3QgZnJvbSBhbm90aGVyIGFjdGl2aXR5XHJcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gbnVsbDtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciB0byBnbyBiYWNrIHdpdGggdGhlIHNlbGVjdGVkIGRhdGUtdGltZSB3aGVuXHJcbiAgICAvLyB0aGF0IHNlbGVjdGlvbiBpcyBkb25lIChjb3VsZCBiZSB0byBudWxsKVxyXG4gICAgdGhpcy5kYXRhVmlldy5zZWxlY3RlZERhdGV0aW1lLnN1YnNjcmliZShmdW5jdGlvbiAoZGF0ZXRpbWUpIHtcclxuICAgICAgICAvLyBXZSBoYXZlIGEgcmVxdWVzdFxyXG4gICAgICAgIGlmICh0aGlzLnJlcXVlc3RJbmZvKSB7XHJcbiAgICAgICAgICAgIC8vIFBhc3MgdGhlIHNlbGVjdGVkIGRhdGV0aW1lIGluIHRoZSBpbmZvXHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8uc2VsZWN0ZWREYXRldGltZSA9IHRoaXMuZGF0YVZpZXcuc2VsZWN0ZWREYXRldGltZSgpO1xyXG4gICAgICAgICAgICAvLyBBbmQgZ28gYmFja1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5zaGVsbC5nb0JhY2sodGhpcy5yZXF1ZXN0SW5mbyk7XHJcbiAgICAgICAgICAgIC8vIExhc3QsIGNsZWFyIHJlcXVlc3RJbmZvXHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn1cclxuXHJcbkRhdGV0aW1lUGlja2VyQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcclxuICBcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG9wdGlvbnM7XHJcbn07XHJcblxyXG5EYXRldGltZVBpY2tlckFjdGl2aXR5LnByb3RvdHlwZS5iaW5kRGF0ZURhdGEgPSBmdW5jdGlvbiBiaW5kRGF0ZURhdGEoZGF0ZSkge1xyXG5cclxuICAgIHZhciBzZGF0ZSA9IG1vbWVudChkYXRlKS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcclxuICAgIHZhciBzbG90c0RhdGEgPSB0aGlzLmRhdGFWaWV3LnNsb3RzRGF0YTtcclxuXHJcbiAgICBpZiAoc2xvdHNEYXRhLmhhc093blByb3BlcnR5KHNkYXRlKSkge1xyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuc2xvdHMoc2xvdHNEYXRhW3NkYXRlXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuc2xvdHMoc2xvdHNEYXRhWydkZWZhdWx0J10pO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJ1NlbGVjdCBhIHRpbWUnKTtcclxuICAgIHRoaXMuc2VsZWN0ZWREYXRlID0ga28ub2JzZXJ2YWJsZShuZXcgRGF0ZSgpKTtcclxuICAgIHRoaXMuc2xvdHNEYXRhID0ge307XHJcbiAgICB0aGlzLnNsb3RzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcclxuICAgIHRoaXMuZ3JvdXBlZFNsb3RzID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuICAgICAgICAvKlxyXG4gICAgICAgICAgYmVmb3JlIDEyOjAwcG0gKG5vb24pID0gbW9ybmluZ1xyXG4gICAgICAgICAgYWZ0ZXJub29uOiAxMjowMHBtIHVudGlsIDU6MDBwbVxyXG4gICAgICAgICAgZXZlbmluZzogNTowMHBtIC0gMTE6NTlwbVxyXG4gICAgICAgICovXHJcbiAgICAgICAgLy8gU2luY2Ugc2xvdHMgbXVzdCBiZSBmb3IgdGhlIHNhbWUgZGF0ZSxcclxuICAgICAgICAvLyB0byBkZWZpbmUgdGhlIGdyb3VwcyByYW5nZXMgdXNlIHRoZSBmaXJzdCBkYXRlXHJcbiAgICAgICAgdmFyIGRhdGVQYXJ0ID0gdGhpcy5zbG90cygpICYmIHRoaXMuc2xvdHMoKVswXSB8fCBuZXcgRGF0ZSgpO1xyXG4gICAgICAgIHZhciBncm91cHMgPSBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGdyb3VwOiAnTW9ybmluZycsXHJcbiAgICAgICAgICAgICAgICBzbG90czogW10sXHJcbiAgICAgICAgICAgICAgICBzdGFydHM6IG5ldyBUaW1lKGRhdGVQYXJ0LCAwLCAwKSxcclxuICAgICAgICAgICAgICAgIGVuZHM6IG5ldyBUaW1lKGRhdGVQYXJ0LCAxMiwgMClcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZ3JvdXA6ICdBZnRlcm5vb24nLFxyXG4gICAgICAgICAgICAgICAgc2xvdHM6IFtdLFxyXG4gICAgICAgICAgICAgICAgc3RhcnRzOiBuZXcgVGltZShkYXRlUGFydCwgMTIsIDApLFxyXG4gICAgICAgICAgICAgICAgZW5kczogbmV3IFRpbWUoZGF0ZVBhcnQsIDE3LCAwKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBncm91cDogJ0V2ZW5pbmcnLFxyXG4gICAgICAgICAgICAgICAgc2xvdHM6IFtdLFxyXG4gICAgICAgICAgICAgICAgc3RhcnRzOiBuZXcgVGltZShkYXRlUGFydCwgMTcsIDApLFxyXG4gICAgICAgICAgICAgICAgZW5kczogbmV3IFRpbWUoZGF0ZVBhcnQsIDI0LCAwKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXTtcclxuICAgICAgICB2YXIgc2xvdHMgPSB0aGlzLnNsb3RzKCkuc29ydCgpO1xyXG4gICAgICAgIHNsb3RzLmZvckVhY2goZnVuY3Rpb24oc2xvdCkge1xyXG4gICAgICAgICAgICBncm91cHMuZm9yRWFjaChmdW5jdGlvbihncm91cCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNsb3QgPj0gZ3JvdXAuc3RhcnRzICYmXHJcbiAgICAgICAgICAgICAgICAgICAgc2xvdCA8IGdyb3VwLmVuZHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBncm91cC5zbG90cy5wdXNoKHNsb3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdyb3VwcztcclxuXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZWxlY3RlZERhdGV0aW1lID0ga28ub2JzZXJ2YWJsZShudWxsKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZWxlY3REYXRldGltZSA9IGZ1bmN0aW9uKHNlbGVjdGVkRGF0ZXRpbWUpIHtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnNlbGVjdGVkRGF0ZXRpbWUoc2VsZWN0ZWREYXRldGltZSk7XHJcblxyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG5cclxufVxyXG4iLCIvKipcbiAgICBGYXFzIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gRmFxc0FjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdUYWxrIHRvIHVzJyk7XG4gICAgXG4gICAgLy8gVGVzdGluZ0RhdGFcbiAgICBzZXRTb21lVGVzdGluZ0RhdGEodGhpcy52aWV3TW9kZWwpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbC5zZWFyY2hUZXh0KCcnKTtcbn07XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcblxuICAgIHRoaXMuZmFxcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XG4gICAgdGhpcy5zZWFyY2hUZXh0ID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgXG4gICAgdGhpcy5maWx0ZXJlZEZhcXMgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzID0gdGhpcy5zZWFyY2hUZXh0KCkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmFxcygpLmZpbHRlcihmdW5jdGlvbih2KSB7XG4gICAgICAgICAgICB2YXIgbiA9IHYgJiYgdi50aXRsZSgpIHx8ICcnO1xuICAgICAgICAgICAgbiArPSB2ICYmIHYuZGVzY3JpcHRpb24oKSB8fCAnJztcbiAgICAgICAgICAgIG4gPSBuLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICByZXR1cm4gbi5pbmRleE9mKHMpID4gLTE7XG4gICAgICAgIH0pO1xuICAgIH0sIHRoaXMpO1xufVxuXG52YXIgTW9kZWwgPSByZXF1aXJlKCcuLi9tb2RlbHMvTW9kZWwnKTtcbmZ1bmN0aW9uIEZhcSh2YWx1ZXMpIHtcbiAgICBcbiAgICBNb2RlbCh0aGlzKTtcblxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XG4gICAgICAgIGlkOiAwLFxuICAgICAgICB0aXRsZTogJycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnJ1xuICAgIH0sIHZhbHVlcyk7XG59XG5cbi8qKiBURVNUSU5HIERBVEEgKiovXG5mdW5jdGlvbiBzZXRTb21lVGVzdGluZ0RhdGEodmlld01vZGVsKSB7XG4gICAgXG4gICAgdmFyIHRlc3RkYXRhID0gW1xuICAgICAgICBuZXcgRmFxKHtcbiAgICAgICAgICAgIGlkOiAxLFxuICAgICAgICAgICAgdGl0bGU6ICdIb3cgZG8gSSBzZXQgdXAgYSBtYXJrZXRwbGFjZSBwcm9maWxlPycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Rlc2NyaXB0aW9uIGFib3V0IGhvdyBJIHNldCB1cCBhIG1hcmtldHBsYWNlIHByb2ZpbGUnXG4gICAgICAgIH0pLFxuICAgICAgICBuZXcgRmFxKHtcbiAgICAgICAgICAgIGlkOiAyLFxuICAgICAgICAgICAgdGl0bGU6ICdBbm90aGVyIGZhcScsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Fub3RoZXIgZGVzY3JpcHRpb24nXG4gICAgICAgIH0pXG4gICAgXTtcbiAgICB2aWV3TW9kZWwuZmFxcyh0ZXN0ZGF0YSk7XG59XG4iLCIvKipcbiAgICBGZWVkYmFjayBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEZlZWRiYWNrQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU2VjdGlvbk5hdkJhcignVGFsayB0byB1cycpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcbiIsIi8qKlxuICAgIEZlZWRiYWNrRm9ybSBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEZlZWRiYWNrRm9ybUFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdUYWxrIHRvIHVzJyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuICAgIFxuICAgIHRoaXMubWVzc2FnZSA9IGtvLm9ic2VydmFibGUoJycpO1xuICAgIHRoaXMuYmVjb21lQ29sbGFib3JhdG9yID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG4gICAgdGhpcy53YXNTZW50ID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG5cbiAgICB2YXIgdXBkYXRlV2FzU2VudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLndhc1NlbnQoZmFsc2UpO1xuICAgIH0uYmluZCh0aGlzKTtcbiAgICB0aGlzLm1lc3NhZ2Uuc3Vic2NyaWJlKHVwZGF0ZVdhc1NlbnQpO1xuICAgIHRoaXMuYmVjb21lQ29sbGFib3JhdG9yLnN1YnNjcmliZSh1cGRhdGVXYXNTZW50KTtcbiAgICBcbiAgICB0aGlzLnNlbmQgPSBmdW5jdGlvbiBzZW5kKCkge1xuICAgICAgICAvLyBUT0RPOiBTZW5kXG4gICAgICAgIFxuICAgICAgICAvLyBSZXNldCBhZnRlciBiZWluZyBzZW50XG4gICAgICAgIHRoaXMubWVzc2FnZSgnJyk7XG4gICAgICAgIHRoaXMuYmVjb21lQ29sbGFib3JhdG9yKGZhbHNlKTtcbiAgICAgICAgdGhpcy53YXNTZW50KHRydWUpO1xuXG4gICAgfS5iaW5kKHRoaXMpO1xufVxuIiwiLyoqXG4gICAgSG9tZSBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxuICAgIE5hdkJhciA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QmFyJyksXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcblxudmFyIHNpbmdsZXRvbiA9IG51bGw7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRIb21lKCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgSG9tZUFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcbiAgICBcbiAgICByZXR1cm4gc2luZ2xldG9uO1xufTtcblxuZnVuY3Rpb24gSG9tZUFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5DdXN0b21lcjtcbiAgICB0aGlzLm5hdkJhciA9IG5ldyBOYXZCYXIoe1xuICAgICAgICB0aXRsZTogbnVsbCwgLy8gbnVsbCBmb3IgbG9nb1xuICAgICAgICBsZWZ0QWN0aW9uOiBOYXZBY3Rpb24ubWVudU5ld0l0ZW0sXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBOYXZBY3Rpb24ubWVudUluXG4gICAgfSk7XG5cbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICB0aGlzLiRuZXh0Qm9va2luZyA9ICRhY3Rpdml0eS5maW5kKCcjaG9tZU5leHRCb29raW5nJyk7XG4gICAgdGhpcy4kdXBjb21pbmdCb29raW5ncyA9ICRhY3Rpdml0eS5maW5kKCcjaG9tZVVwY29taW5nQm9va2luZ3MnKTtcbiAgICB0aGlzLiRpbmJveCA9ICRhY3Rpdml0eS5maW5kKCcjaG9tZUluYm94Jyk7XG4gICAgdGhpcy4kcGVyZm9ybWFuY2UgPSAkYWN0aXZpdHkuZmluZCgnI2hvbWVQZXJmb3JtYW5jZScpO1xuICAgIHRoaXMuJGdldE1vcmUgPSAkYWN0aXZpdHkuZmluZCgnI2hvbWVHZXRNb3JlJyk7XG5cbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XG5cbiAgICAvLyBUZXN0aW5nRGF0YVxuICAgIHNldFNvbWVUZXN0aW5nRGF0YSh0aGlzLmRhdGFWaWV3KTtcblxuICAgIC8vIE9iamVjdCB0byBob2xkIHRoZSBvcHRpb25zIHBhc3NlZCBvbiAnc2hvdycgYXMgYSByZXN1bHRcbiAgICAvLyBvZiBhIHJlcXVlc3QgZnJvbSBhbm90aGVyIGFjdGl2aXR5XG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XG59XG5cbkhvbWVBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuIFxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMucmVxdWVzdEluZm8gPSBvcHRpb25zO1xuICAgIHZhciB2ID0gdGhpcy5kYXRhVmlldyxcbiAgICAgICAgYXBwTW9kZWwgPSB0aGlzLmFwcC5tb2RlbDtcbiAgICBcbiAgICAvLyBVcGRhdGUgZGF0YVxuICAgIGFwcE1vZGVsLmdldFVwY29taW5nQm9va2luZ3MoKS50aGVuKGZ1bmN0aW9uKHVwY29taW5nKSB7XG5cbiAgICAgICAgaWYgKHVwY29taW5nLm5leHRCb29raW5nSUQpXG4gICAgICAgICAgICBhcHBNb2RlbC5nZXRCb29raW5nKHVwY29taW5nLm5leHRCb29raW5nSUQpLnRoZW4odi5uZXh0Qm9va2luZyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHYubmV4dEJvb2tpbmcobnVsbCk7XG5cbiAgICAgICAgdi51cGNvbWluZ0Jvb2tpbmdzLnRvZGF5LnF1YW50aXR5KHVwY29taW5nLnRvZGF5LnF1YW50aXR5KTtcbiAgICAgICAgdi51cGNvbWluZ0Jvb2tpbmdzLnRvZGF5LnRpbWUodXBjb21pbmcudG9kYXkudGltZSAmJiBuZXcgRGF0ZSh1cGNvbWluZy50b2RheS50aW1lKSk7XG4gICAgICAgIHYudXBjb21pbmdCb29raW5ncy50b21vcnJvdy5xdWFudGl0eSh1cGNvbWluZy50b21vcnJvdy5xdWFudGl0eSk7XG4gICAgICAgIHYudXBjb21pbmdCb29raW5ncy50b21vcnJvdy50aW1lKHVwY29taW5nLnRvbW9ycm93LnRpbWUgJiYgbmV3IERhdGUodXBjb21pbmcudG9tb3Jyb3cudGltZSkpO1xuICAgICAgICB2LnVwY29taW5nQm9va2luZ3MubmV4dFdlZWsucXVhbnRpdHkodXBjb21pbmcubmV4dFdlZWsucXVhbnRpdHkpO1xuICAgICAgICB2LnVwY29taW5nQm9va2luZ3MubmV4dFdlZWsudGltZSh1cGNvbWluZy5uZXh0V2Vlay50aW1lICYmIG5ldyBEYXRlKHVwY29taW5nLm5leHRXZWVrLnRpbWUpKTtcbiAgICB9KTtcbn07XG5cbnZhciBVcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeSA9IHJlcXVpcmUoJy4uL21vZGVscy9VcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeScpLFxuICAgIE1haWxGb2xkZXIgPSByZXF1aXJlKCcuLi9tb2RlbHMvTWFpbEZvbGRlcicpLFxuICAgIFBlcmZvcm1hbmNlU3VtbWFyeSA9IHJlcXVpcmUoJy4uL21vZGVscy9QZXJmb3JtYW5jZVN1bW1hcnknKSxcbiAgICBHZXRNb3JlID0gcmVxdWlyZSgnLi4vbW9kZWxzL0dldE1vcmUnKTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG4gICAgdGhpcy51cGNvbWluZ0Jvb2tpbmdzID0gbmV3IFVwY29taW5nQm9va2luZ3NTdW1tYXJ5KCk7XG5cbiAgICAvLyA6QXBwb2ludG1lbnRcbiAgICB0aGlzLm5leHRCb29raW5nID0ga28ub2JzZXJ2YWJsZShudWxsKTtcbiAgICBcbiAgICB0aGlzLmluYm94ID0gbmV3IE1haWxGb2xkZXIoe1xuICAgICAgICB0b3BOdW1iZXI6IDRcbiAgICB9KTtcbiAgICBcbiAgICB0aGlzLnBlcmZvcm1hbmNlID0gbmV3IFBlcmZvcm1hbmNlU3VtbWFyeSgpO1xuICAgIFxuICAgIHRoaXMuZ2V0TW9yZSA9IG5ldyBHZXRNb3JlKCk7XG59XG5cbi8qKiBURVNUSU5HIERBVEEgKiovXG52YXIgVGltZSA9IHJlcXVpcmUoJy4uL3V0aWxzL1RpbWUnKTtcblxuZnVuY3Rpb24gc2V0U29tZVRlc3RpbmdEYXRhKGRhdGFWaWV3KSB7XG4gICAgXG4gICAgZGF0YVZpZXcuaW5ib3gubWVzc2FnZXMocmVxdWlyZSgnLi4vdGVzdGRhdGEvbWVzc2FnZXMnKS5tZXNzYWdlcyk7XG4gICAgXG4gICAgZGF0YVZpZXcucGVyZm9ybWFuY2UuZWFybmluZ3MuY3VycmVudEFtb3VudCgyNDAwKTtcbiAgICBkYXRhVmlldy5wZXJmb3JtYW5jZS5lYXJuaW5ncy5uZXh0QW1vdW50KDYyMDAuNTQpO1xuICAgIGRhdGFWaWV3LnBlcmZvcm1hbmNlLnRpbWVCb29rZWQucGVyY2VudCgwLjkzKTtcbiAgICBcbiAgICBkYXRhVmlldy5nZXRNb3JlLm1vZGVsLnVwZGF0ZVdpdGgoe1xuICAgICAgICBhdmFpbGFiaWxpdHk6IHRydWUsXG4gICAgICAgIHBheW1lbnRzOiB0cnVlLFxuICAgICAgICBwcm9maWxlOiB0cnVlLFxuICAgICAgICBjb29wOiB0cnVlXG4gICAgfSk7XG59XG4iLCIvKipcbiAgICBJbmJveCBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBJbmJveEFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKCdJbmJveCcpO1xuICAgIFxuICAgIC8vdGhpcy4kaW5ib3ggPSAkYWN0aXZpdHkuZmluZCgnI2luYm94TGlzdCcpO1xuICAgIFxuICAgIC8vIFRlc3RpbmdEYXRhXG4gICAgc2V0U29tZVRlc3RpbmdEYXRhKHRoaXMudmlld01vZGVsKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbnZhciBNYWlsRm9sZGVyID0gcmVxdWlyZSgnLi4vbW9kZWxzL01haWxGb2xkZXInKTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG4gICAgdGhpcy5pbmJveCA9IG5ldyBNYWlsRm9sZGVyKHtcbiAgICAgICAgdG9wTnVtYmVyOiAyMFxuICAgIH0pO1xuICAgIFxuICAgIHRoaXMuc2VhcmNoVGV4dCA9IGtvLm9ic2VydmFibGUoJycpO1xufVxuXG4vKiogVEVTVElORyBEQVRBICoqL1xuZnVuY3Rpb24gc2V0U29tZVRlc3RpbmdEYXRhKGRhdGFWaWV3KSB7XG4gICAgXG4gICAgZGF0YVZpZXcuaW5ib3gubWVzc2FnZXMocmVxdWlyZSgnLi4vdGVzdGRhdGEvbWVzc2FnZXMnKS5tZXNzYWdlcyk7XG59XG4iLCIvKipcbiAgICBJbmRleCBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBzaW5nbGV0b24gPSBudWxsLFxuICAgIE5hdkJhciA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QmFyJyksXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdEluZGV4KCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgSW5kZXhBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XG4gICAgXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbn07XG5cbmZ1bmN0aW9uIEluZGV4QWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XG4gICAgICAgIHRpdGxlOiBudWxsLCAvLyBudWxsIGZvciBsb2dvXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5nb0xvZ2luLFxuICAgICAgICByaWdodEFjdGlvbjogTmF2QWN0aW9uLm1lbnVPdXRcbiAgICB9KTtcbiAgICBcbiAgICAvLyBBbnkgdXNlciBjYW4gYWNjZXNzIHRoaXNcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gbnVsbDtcbn1cblxuSW5kZXhBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuICAgIC8vIEl0IGNoZWNrcyBpZiB0aGUgdXNlciBpcyBsb2dnZWQgc28gdGhlbiBcbiAgICAvLyB0aGVpciAnbG9nZ2VkIGluZGV4JyBpcyB0aGUgZGFzaGJvYXJkIG5vdCB0aGlzXG4gICAgLy8gcGFnZSB0aGF0IGlzIGZvY3VzZWQgb24gYW5vbnltb3VzIHVzZXJzXG4gICAgaWYgKCF0aGlzLmFwcC5tb2RlbC51c2VyKCkuaXNBbm9ueW1vdXMoKSkge1xuICAgICAgICB0aGlzLmFwcC5nb0Rhc2hib2FyZCgpO1xuICAgIH1cbn07XG4iLCIvKipcbiAgICBKb2J0aXRsZXMgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBKb2J0aXRsZXNBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIFxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCgpO1xuICAgIFxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignU2NoZWR1bGluZycpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xufVxuIiwiLyoqXG4gICAgTGVhcm5Nb3JlIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKSxcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xuXG52YXIgc2luZ2xldG9uID0gbnVsbDtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdExlYXJuTW9yZSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IExlYXJuTW9yZUFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcbiAgICBcbiAgICByZXR1cm4gc2luZ2xldG9uO1xufTtcblxuZnVuY3Rpb24gTGVhcm5Nb3JlQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIHRoaXMuZGF0YVZpZXcgPSBuZXcgVmlld01vZGVsKCk7XG4gICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLmRhdGFWaWV3LCAkYWN0aXZpdHkuZ2V0KDApKTtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IG5ldyBOYXZCYXIoe1xuICAgICAgICB0aXRsZTogbnVsbCwgLy8gbnVsbCBmb3IgbG9nb1xuICAgICAgICBsZWZ0QWN0aW9uOiBOYXZBY3Rpb24uZ29CYWNrLFxuICAgICAgICByaWdodEFjdGlvbjogTmF2QWN0aW9uLm1lbnVPdXRcbiAgICB9KTtcbn1cblxuTGVhcm5Nb3JlQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcblxuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMucm91dGUgJiZcbiAgICAgICAgb3B0aW9ucy5yb3V0ZS5zZWdtZW50cyAmJlxuICAgICAgICBvcHRpb25zLnJvdXRlLnNlZ21lbnRzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLmRhdGFWaWV3LnByb2ZpbGUob3B0aW9ucy5yb3V0ZS5zZWdtZW50c1swXSk7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuICAgIHRoaXMucHJvZmlsZSA9IGtvLm9ic2VydmFibGUoJ2N1c3RvbWVyJyk7XG59IiwiLyoqXG4gICAgTG9jYXRpb25FZGl0aW9uIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXG4gICAgTG9jYXRpb24gPSByZXF1aXJlKCcuLi9tb2RlbHMvTG9jYXRpb24nKSxcbiAgICBOYXZCYXIgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkJhcicpLFxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyk7XG5cbnZhciBzaW5nbGV0b24gPSBudWxsO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0TG9jYXRpb25FZGl0aW9uKCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgTG9jYXRpb25FZGl0aW9uQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xuICAgIFxuICAgIHJldHVybiBzaW5nbGV0b247XG59O1xuXG5mdW5jdGlvbiBMb2NhdGlvbkVkaXRpb25BY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xuICAgIFxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuUHJvdmlkZXI7XG5cbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBuZXcgTmF2QmFyKHtcbiAgICAgICAgdGl0bGU6ICcnLFxuICAgICAgICBsZWZ0QWN0aW9uOiBOYXZBY3Rpb24uZ29CYWNrLm1vZGVsLmNsb25lKHtcbiAgICAgICAgICAgIHRleHQ6ICdMb2NhdGlvbnMnXG4gICAgICAgIH0pLFxuICAgICAgICByaWdodEFjdGlvbjogTmF2QWN0aW9uLmdvSGVscEluZGV4XG4gICAgfSk7XG59XG5cbkxvY2F0aW9uRWRpdGlvbkFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG4gICAgLy9qc2hpbnQgbWF4Y29tcGxleGl0eToxMFxuICAgIFxuICAgIHZhciBpZCA9IDAsXG4gICAgICAgIGNyZWF0ZSA9ICcnO1xuXG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMubG9jYXRpb25JRCkge1xuICAgICAgICAgICAgaWQgPSBvcHRpb25zLmxvY2F0aW9uSUQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5yb3V0ZSAmJiBvcHRpb25zLnJvdXRlLnNlZ21lbnRzKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlkID0gcGFyc2VJbnQob3B0aW9ucy5yb3V0ZS5zZWdtZW50c1swXSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5jcmVhdGUpIHtcbiAgICAgICAgICAgIGNyZWF0ZSA9IG9wdGlvbnMuY3JlYXRlO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGlmIChpZCkge1xuICAgICAgICAvLyBUT0RPXG4gICAgICAgIC8vIHZhciBsb2NhdGlvbiA9IHRoaXMuYXBwLm1vZGVsLmdldExvY2F0aW9uKGlkKVxuICAgICAgICAvLyBOT1RFIHRlc3RpbmcgZGF0YVxuICAgICAgICB2YXIgbG9jYXRpb25zID0ge1xuICAgICAgICAgICAgJzEnOiBuZXcgTG9jYXRpb24oe1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uSUQ6IDEsXG4gICAgICAgICAgICAgICAgbmFtZTogJ0hvbWUnLFxuICAgICAgICAgICAgICAgIGFkZHJlc3NMaW5lMTogJ0hlcmUgU3RyZWV0JyxcbiAgICAgICAgICAgICAgICBjaXR5OiAnU2FuIEZyYW5jaXNjbycsXG4gICAgICAgICAgICAgICAgcG9zdGFsQ29kZTogJzkwMDAxJyxcbiAgICAgICAgICAgICAgICBzdGF0ZVByb3ZpbmNlQ29kZTogJ0NBJyxcbiAgICAgICAgICAgICAgICBjb3VudHJ5SUQ6IDEsXG4gICAgICAgICAgICAgICAgaXNTZXJ2aWNlUmFkaXVzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGlzU2VydmljZUxvY2F0aW9uOiBmYWxzZVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAnMic6IG5ldyBMb2NhdGlvbih7XG4gICAgICAgICAgICAgICAgbG9jYXRpb25JRDogMSxcbiAgICAgICAgICAgICAgICBuYW1lOiAnV29ya3Nob3AnLFxuICAgICAgICAgICAgICAgIGFkZHJlc3NMaW5lMTogJ1Vua25vdyBTdHJlZXQnLFxuICAgICAgICAgICAgICAgIGNpdHk6ICdTYW4gRnJhbmNpc2NvJyxcbiAgICAgICAgICAgICAgICBwb3N0YWxDb2RlOiAnOTAwMDEnLFxuICAgICAgICAgICAgICAgIHN0YXRlUHJvdmluY2VDb2RlOiAnQ0EnLFxuICAgICAgICAgICAgICAgIGNvdW50cnlJRDogMSxcbiAgICAgICAgICAgICAgICBpc1NlcnZpY2VSYWRpdXM6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGlzU2VydmljZUxvY2F0aW9uOiB0cnVlXG4gICAgICAgICAgICB9KVxuICAgICAgICB9O1xuICAgICAgICB2YXIgbG9jYXRpb24gPSBsb2NhdGlvbnNbaWRdO1xuICAgICAgICBpZiAobG9jYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9jYXRpb24obG9jYXRpb24pO1xuXG4gICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmhlYWRlcignRWRpdCBMb2NhdGlvbicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5sb2NhdGlvbihudWxsKTtcbiAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcuaGVhZGVyKCdVbmtub3cgbG9jYXRpb24gb3Igd2FzIGRlbGV0ZWQnKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgLy8gTmV3IGxvY2F0aW9uXG4gICAgICAgIHRoaXMuZGF0YVZpZXcubG9jYXRpb24obmV3IExvY2F0aW9uKCkpO1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoIChvcHRpb25zLmNyZWF0ZSkge1xuICAgICAgICAgICAgY2FzZSAnc2VydmljZVJhZGl1cyc6XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5sb2NhdGlvbigpLmlzU2VydmljZVJhZGl1cyh0cnVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmhlYWRlcignQWRkIGEgc2VydmljZSByYWRpdXMnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3NlcnZpY2VMb2NhdGlvbic6XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5sb2NhdGlvbigpLmlzU2VydmljZUxvY2F0aW9uKHRydWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcuaGVhZGVyKCdBZGQgYSBzZXJ2aWNlIGxvY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9jYXRpb24oKS5pc1NlcnZpY2VSYWRpdXModHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5sb2NhdGlvbigpLmlzU2VydmljZUxvY2F0aW9uKHRydWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcuaGVhZGVyKCdBZGQgYSBsb2NhdGlvbicpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuICAgIFxuICAgIHRoaXMubG9jYXRpb24gPSBrby5vYnNlcnZhYmxlKG5ldyBMb2NhdGlvbigpKTtcbiAgICBcbiAgICB0aGlzLmhlYWRlciA9IGtvLm9ic2VydmFibGUoJ0VkaXQgTG9jYXRpb24nKTtcbiAgICBcbiAgICAvLyBUT0RPXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24oKSB7fTtcbiAgICB0aGlzLmNhbmNlbCA9IGZ1bmN0aW9uKCkge307XG59IiwiLyoqXHJcbiAgICBsb2NhdGlvbnMgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBOYXZCYXIgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkJhcicpLFxyXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcclxuICAgIFxyXG52YXIgc2luZ2xldG9uID0gbnVsbDtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRMb2NhdGlvbnMoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxyXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBMb2NhdGlvbnNBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XHJcbiAgICBcclxuICAgIHJldHVybiBzaW5nbGV0b247XHJcbn07XHJcblxyXG5mdW5jdGlvbiBMb2NhdGlvbnNBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xyXG4gICAgXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLlByb3ZpZGVyO1xyXG4gICAgdGhpcy5uYXZCYXIgPSBuZXcgTmF2QmFyKHtcclxuICAgICAgICB0aXRsZTogJycsXHJcbiAgICAgICAgbGVmdEFjdGlvbjogTmF2QWN0aW9uLmdvQmFjay5tb2RlbC5jbG9uZSh7XHJcbiAgICAgICAgICAgIGlzVGl0bGU6IHRydWVcclxuICAgICAgICB9KSxcclxuICAgICAgICByaWdodEFjdGlvbjogTmF2QWN0aW9uLmdvSGVscEluZGV4XHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xyXG4gICAgdGhpcy4kbGlzdFZpZXcgPSAkYWN0aXZpdHkuZmluZCgnI2xvY2F0aW9uc0xpc3RWaWV3Jyk7XHJcblxyXG4gICAgdmFyIGRhdGFWaWV3ID0gdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoYXBwKTtcclxuICAgIGtvLmFwcGx5QmluZGluZ3MoZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xyXG5cclxuICAgIC8vIFRlc3RpbmdEYXRhXHJcbiAgICBkYXRhVmlldy5sb2NhdGlvbnMocmVxdWlyZSgnLi4vdGVzdGRhdGEvbG9jYXRpb25zJykubG9jYXRpb25zKTtcclxuXHJcbiAgICAvLyBIYW5kbGVyIHRvIHVwZGF0ZSBoZWFkZXIgYmFzZWQgb24gYSBtb2RlIGNoYW5nZTpcclxuICAgIHRoaXMuZGF0YVZpZXcuaXNTZWxlY3Rpb25Nb2RlLnN1YnNjcmliZShmdW5jdGlvbiAoaXRJcykge1xyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuaGVhZGVyVGV4dChpdElzID8gJ1NlbGVjdCBvciBhZGQgYSBzZXJ2aWNlIGxvY2F0aW9uJyA6ICdMb2NhdGlvbnMnKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBVcGRhdGUgbmF2YmFyIHRvb1xyXG4gICAgICAgIC8vIFRPRE86IENhbiBiZSBvdGhlciB0aGFuICdzY2hlZHVsaW5nJywgbGlrZSBtYXJrZXRwbGFjZSBwcm9maWxlIG9yIHRoZSBqb2ItdGl0bGU/XHJcbiAgICAgICAgdGhpcy5uYXZCYXIubGVmdEFjdGlvbigpLnRleHQoaXRJcyA/ICdCb29raW5nJyA6ICdTY2hlZHVsaW5nJyk7XHJcbiAgICAgICAgLy8gVGl0bGUgbXVzdCBiZSBlbXB0eVxyXG4gICAgICAgIHRoaXMubmF2QmFyLnRpdGxlKCcnKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBUT0RPIFJlcGxhY2VkIGJ5IGEgcHJvZ3Jlc3MgYmFyIG9uIGJvb2tpbmcgY3JlYXRpb25cclxuICAgICAgICAvLyBUT0RPIE9yIGxlZnRBY3Rpb24oKS50ZXh0KC4uKSBvbiBib29raW5nIGVkaXRpb24gKHJldHVybiB0byBib29raW5nKVxyXG4gICAgICAgIC8vIG9yIGNvbWluZyBmcm9tIEpvYnRpdGxlL3NjaGVkdWxlIChyZXR1cm4gdG8gc2NoZWR1bGUvam9iIHRpdGxlKT9cclxuICAgICAgICBcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgLy8gT2JqZWN0IHRvIGhvbGQgdGhlIG9wdGlvbnMgcGFzc2VkIG9uICdzaG93JyBhcyBhIHJlc3VsdFxyXG4gICAgLy8gb2YgYSByZXF1ZXN0IGZyb20gYW5vdGhlciBhY3Rpdml0eVxyXG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XHJcbiAgICBcclxuICAgIC8vIEhhbmRsZXIgdG8gZ28gYmFjayB3aXRoIHRoZSBzZWxlY3RlZCBsb2NhdGlvbiB3aGVuIFxyXG4gICAgLy8gc2VsZWN0aW9uIG1vZGUgZ29lcyBvZmYgYW5kIHJlcXVlc3RJbmZvIGlzIGZvclxyXG4gICAgLy8gJ3NlbGVjdCBtb2RlJ1xyXG4gICAgdGhpcy5kYXRhVmlldy5pc1NlbGVjdGlvbk1vZGUuc3Vic2NyaWJlKGZ1bmN0aW9uIChpdElzKSB7XHJcbiAgICAgICAgLy8gV2UgaGF2ZSBhIHJlcXVlc3QgYW5kXHJcbiAgICAgICAgLy8gaXQgcmVxdWVzdGVkIHRvIHNlbGVjdCBhIGxvY2F0aW9uXHJcbiAgICAgICAgLy8gYW5kIHNlbGVjdGlvbiBtb2RlIGdvZXMgb2ZmXHJcbiAgICAgICAgaWYgKHRoaXMucmVxdWVzdEluZm8gJiZcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mby5zZWxlY3RMb2NhdGlvbiA9PT0gdHJ1ZSAmJlxyXG4gICAgICAgICAgICBpdElzID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gUGFzcyB0aGUgc2VsZWN0ZWQgY2xpZW50IGluIHRoZSBpbmZvXHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8uc2VsZWN0ZWRMb2NhdGlvbiA9IHRoaXMuZGF0YVZpZXcuc2VsZWN0ZWRMb2NhdGlvbigpO1xyXG4gICAgICAgICAgICAvLyBBbmQgZ28gYmFja1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5zaGVsbC5nb0JhY2sodGhpcy5yZXF1ZXN0SW5mbyk7XHJcbiAgICAgICAgICAgIC8vIExhc3QsIGNsZWFyIHJlcXVlc3RJbmZvXHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn1cclxuXHJcbkxvY2F0aW9uc0FjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcbiAgXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBvcHRpb25zO1xyXG5cclxuICAgIGlmIChvcHRpb25zLnNlbGVjdExvY2F0aW9uID09PSB0cnVlKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5pc1NlbGVjdGlvbk1vZGUodHJ1ZSk7XHJcbiAgICAgICAgLy8gcHJlc2V0OlxyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuc2VsZWN0ZWRMb2NhdGlvbihvcHRpb25zLnNlbGVjdGVkTG9jYXRpb24pO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAob3B0aW9ucy5yb3V0ZSAmJiBvcHRpb25zLnJvdXRlLnNlZ21lbnRzKSB7XHJcbiAgICAgICAgdmFyIGlkID0gb3B0aW9ucy5yb3V0ZS5zZWdtZW50c1swXTtcclxuICAgICAgICBpZiAoaWQpIHtcclxuICAgICAgICAgICAgaWYgKGlkID09PSAnbmV3Jykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ28oJ2xvY2F0aW9uRWRpdGlvbicsIHtcclxuICAgICAgICAgICAgICAgICAgICBjcmVhdGU6IG9wdGlvbnMucm91dGUuc2VnbWVudHNbMV0gLy8gJ3NlcnZpY2VSYWRpdXMnLCAnc2VydmljZUxvY2F0aW9uJ1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5zaGVsbC5nbygnbG9jYXRpb25FZGl0aW9uJywge1xyXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uSUQ6IGlkXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbChhcHApIHtcclxuXHJcbiAgICB0aGlzLmhlYWRlclRleHQgPSBrby5vYnNlcnZhYmxlKCdMb2NhdGlvbnMnKTtcclxuXHJcbiAgICAvLyBGdWxsIGxpc3Qgb2YgbG9jYXRpb25zXHJcbiAgICB0aGlzLmxvY2F0aW9ucyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcblxyXG4gICAgLy8gRXNwZWNpYWwgbW9kZSB3aGVuIGluc3RlYWQgb2YgcGljayBhbmQgZWRpdCB3ZSBhcmUganVzdCBzZWxlY3RpbmdcclxuICAgIC8vICh3aGVuIGVkaXRpbmcgYW4gYXBwb2ludG1lbnQpXHJcbiAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZSA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG5cclxuICAgIHRoaXMuc2VsZWN0ZWRMb2NhdGlvbiA9IGtvLm9ic2VydmFibGUobnVsbCk7XHJcbiAgICBcclxuICAgIHRoaXMuc2VsZWN0TG9jYXRpb24gPSBmdW5jdGlvbihzZWxlY3RlZExvY2F0aW9uKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHRoaXMuaXNTZWxlY3Rpb25Nb2RlKCkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZExvY2F0aW9uKHNlbGVjdGVkTG9jYXRpb24pO1xyXG4gICAgICAgICAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZShmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBhcHAuc2hlbGwuZ28oJ2xvY2F0aW9uRWRpdGlvbicsIHtcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uSUQ6IHNlbGVjdGVkTG9jYXRpb24ubG9jYXRpb25JRCgpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbn1cclxuIiwiLyoqXG4gICAgTG9naW4gYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcbiAgVXNlciA9IHJlcXVpcmUoJy4uL21vZGVscy9Vc2VyJyksXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKSxcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xuXG52YXIgc2luZ2xldG9uID0gbnVsbDtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdExvZ2luKCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgTG9naW5BY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XG4gICAgXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbn07XG5cbmZ1bmN0aW9uIExvZ2luQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkFub255bW91cztcbiAgICB0aGlzLm5hdkJhciA9IG5ldyBOYXZCYXIoe1xuICAgICAgICB0aXRsZTogJ0xvZyBpbicsXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5nb0JhY2ssXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBOYXZBY3Rpb24ubWVudU91dFxuICAgIH0pO1xuXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMuZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xuICAgIFxuICAgIC8vIFBlcmZvcm0gbG9nLWluIHJlcXVlc3Qgd2hlbiBpcyByZXF1ZXN0ZWQgYnkgdGhlIGZvcm06XG4gICAgdGhpcy5kYXRhVmlldy5pc0xvZ2luZ0luLnN1YnNjcmliZShmdW5jdGlvbih2KSB7XG4gICAgICAgIGlmICh2ID09PSB0cnVlKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFBlcmZvcm0gbG9naW5nXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIE5vdGlmeSBzdGF0ZTpcbiAgICAgICAgICAgIHZhciAkYnRuID0gJGFjdGl2aXR5LmZpbmQoJ1t0eXBlPVwic3VibWl0XCJdJyk7XG4gICAgICAgICAgICAkYnRuLmJ1dHRvbignbG9hZGluZycpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBDbGVhciBwcmV2aW91cyBlcnJvciBzbyBtYWtlcyBjbGVhciB3ZVxuICAgICAgICAgICAgLy8gYXJlIGF0dGVtcHRpbmdcbiAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9naW5FcnJvcignJyk7XG4gICAgICAgIFxuICAgICAgICAgICAgdmFyIGVuZGVkID0gZnVuY3Rpb24gZW5kZWQoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5pc0xvZ2luZ0luKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAkYnRuLmJ1dHRvbigncmVzZXQnKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQWZ0ZXIgY2xlYW4tdXAgZXJyb3IgKHRvIGZvcmNlIHNvbWUgdmlldyB1cGRhdGVzKSxcbiAgICAgICAgICAgIC8vIHZhbGlkYXRlIGFuZCBhYm9ydCBvbiBlcnJvclxuICAgICAgICAgICAgLy8gTWFudWFsbHkgY2hlY2tpbmcgZXJyb3Igb24gZWFjaCBmaWVsZFxuICAgICAgICAgICAgaWYgKHRoaXMuZGF0YVZpZXcudXNlcm5hbWUuZXJyb3IoKSB8fFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcucGFzc3dvcmQuZXJyb3IoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9naW5FcnJvcignUmV2aWV3IHlvdXIgZGF0YScpO1xuICAgICAgICAgICAgICAgIGVuZGVkKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBhcHAubW9kZWwubG9naW4oXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy51c2VybmFtZSgpLFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcucGFzc3dvcmQoKVxuICAgICAgICAgICAgKS50aGVuKGZ1bmN0aW9uKGxvZ2luRGF0YSkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9naW5FcnJvcignJyk7XG4gICAgICAgICAgICAgICAgZW5kZWQoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgZm9ybSBkYXRhXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy51c2VybmFtZSgnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5wYXNzd29yZCgnJyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuZ29EYXNoYm9hcmQoKTtcblxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKS5jYXRjaChmdW5jdGlvbihlcnIpIHtcblxuICAgICAgICAgICAgICAgIHZhciBtc2cgPSBlcnIgJiYgZXJyLnJlc3BvbnNlSlNPTiAmJiBlcnIucmVzcG9uc2VKU09OLmVycm9yTWVzc2FnZSB8fFxuICAgICAgICAgICAgICAgICAgICBlcnIgJiYgZXJyLnN0YXR1c1RleHQgfHxcbiAgICAgICAgICAgICAgICAgICAgJ0ludmFsaWQgdXNlcm5hbWUgb3IgcGFzc3dvcmQnO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5sb2dpbkVycm9yKG1zZyk7XG4gICAgICAgICAgICAgICAgZW5kZWQoKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuICAgIFxuICAgIC8vIEZvY3VzIGZpcnN0IGJhZCBmaWVsZCBvbiBlcnJvclxuICAgIHRoaXMuZGF0YVZpZXcubG9naW5FcnJvci5zdWJzY3JpYmUoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIC8vIExvZ2luIGlzIGVhc3kgc2luY2Ugd2UgbWFyayBib3RoIHVuaXF1ZSBmaWVsZHNcbiAgICAgICAgLy8gYXMgZXJyb3Igb24gbG9naW5FcnJvciAoaXRzIGEgZ2VuZXJhbCBmb3JtIGVycm9yKVxuICAgICAgICB2YXIgaW5wdXQgPSAkYWN0aXZpdHkuZmluZCgnOmlucHV0JykuZ2V0KDApO1xuICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgaW5wdXQuZm9jdXMoKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaW5wdXQuYmx1cigpO1xuICAgIH0pO1xufVxuXG5Mb2dpbkFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG59O1xuXG52YXIgRm9ybUNyZWRlbnRpYWxzID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9Gb3JtQ3JlZGVudGlhbHMnKTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG4gICAgdmFyIGNyZWRlbnRpYWxzID0gbmV3IEZvcm1DcmVkZW50aWFscygpOyAgICBcbiAgICB0aGlzLnVzZXJuYW1lID0gY3JlZGVudGlhbHMudXNlcm5hbWU7XG4gICAgdGhpcy5wYXNzd29yZCA9IGNyZWRlbnRpYWxzLnBhc3N3b3JkO1xuXG4gICAgdGhpcy5sb2dpbkVycm9yID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgXG4gICAgdGhpcy5pc0xvZ2luZ0luID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG4gICAgXG4gICAgdGhpcy5wZXJmb3JtTG9naW4gPSBmdW5jdGlvbiBwZXJmb3JtTG9naW4oKSB7XG5cbiAgICAgICAgdGhpcy5pc0xvZ2luZ0luKHRydWUpOyAgICAgICAgXG4gICAgfS5iaW5kKHRoaXMpO1xufVxuIiwiLyoqXG4gICAgTG9nb3V0IGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIHNpbmdsZXRvbiA9IG51bGw7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRMb2dvdXQoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBMb2dvdXRBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XG4gICAgXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbn07XG5cbmZ1bmN0aW9uIExvZ291dEFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cbkxvZ291dEFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG5cbiAgICB0aGlzLmFwcC5tb2RlbC5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBBbm9ueW1vdXMgdXNlciBhZ2FpblxuICAgICAgICB2YXIgbmV3QW5vbiA9IHRoaXMuYXBwLm1vZGVsLnVzZXIoKS5jb25zdHJ1Y3Rvci5uZXdBbm9ueW1vdXMoKTtcbiAgICAgICAgdGhpcy5hcHAubW9kZWwudXNlcigpLm1vZGVsLnVwZGF0ZVdpdGgobmV3QW5vbik7XG5cbiAgICAgICAgLy8gR28gaW5kZXhcbiAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ28oJy8nKTtcbiAgICAgICAgXG4gICAgfS5iaW5kKHRoaXMpKTtcbn07XG4iLCIvKipcbiAgICBPbmJvYXJkaW5nQ29tcGxldGUgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2luZ2xldG9uID0gbnVsbDtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdE9uYm9hcmRpbmdDb21wbGV0ZSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IE9uYm9hcmRpbmdDb21wbGV0ZUFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcbiAgICBcbiAgICByZXR1cm4gc2luZ2xldG9uO1xufTtcblxuZnVuY3Rpb24gT25ib2FyZGluZ0NvbXBsZXRlQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuT25ib2FyZGluZ0NvbXBsZXRlQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcblxufTtcbiIsIi8qKlxuICAgIE9uYm9hcmRpbmdIb21lIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIHNpbmdsZXRvbiA9IG51bGwsXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKSxcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0T25ib2FyZGluZ0hvbWUoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBPbmJvYXJkaW5nSG9tZUFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcbiAgICBcbiAgICByZXR1cm4gc2luZ2xldG9uO1xufTtcblxuZnVuY3Rpb24gT25ib2FyZGluZ0hvbWVBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIFxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XG4gICAgICAgIHRpdGxlOiBudWxsLCAvLyBudWxsIGZvciBMb2dvXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5nb0xvZ291dCxcbiAgICAgICAgcmlnaHRBY3Rpb246IG51bGxcbiAgICB9KTtcbn1cblxuT25ib2FyZGluZ0hvbWVBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuXG59O1xuIiwiLyoqXG4gICAgT25ib2FyZGluZyBQb3NpdGlvbnMgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcbiAgICBOYXZCYXIgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkJhcicpLFxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyk7XG5cbnZhciBzaW5nbGV0b24gPSBudWxsO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0T25ib2FyZGluZ1Bvc2l0aW9ucygkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IE9uYm9hcmRpbmdQb3NpdGlvbnNBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XG4gICAgXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbn07XG5cbmZ1bmN0aW9uIE9uYm9hcmRpbmdQb3NpdGlvbnNBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Qcm92aWRlcjtcbiAgICBcbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XG5cbiAgICAvLyBUZXN0aW5nRGF0YVxuICAgIHNldFNvbWVUZXN0aW5nRGF0YSh0aGlzLmRhdGFWaWV3KTtcblxuICAgIC8vIE9iamVjdCB0byBob2xkIHRoZSBvcHRpb25zIHBhc3NlZCBvbiAnc2hvdycgYXMgYSByZXN1bHRcbiAgICAvLyBvZiBhIHJlcXVlc3QgZnJvbSBhbm90aGVyIGFjdGl2aXR5XG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBuZXcgTmF2QmFyKHtcbiAgICAgICAgdGl0bGU6ICdKb2IgVGl0bGVzJyxcbiAgICAgICAgbGVmdEFjdGlvbjogTmF2QWN0aW9uLm1lbnVOZXdJdGVtLFxuICAgICAgICByaWdodEFjdGlvbjogTmF2QWN0aW9uLm1lbnVJblxuICAgIH0pO1xufVxuXG5PbmJvYXJkaW5nUG9zaXRpb25zQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcbiBcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gb3B0aW9ucztcbn07XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcblxuICAgIC8vIEZ1bGwgbGlzdCBvZiBwb3NpdGlvbnNcbiAgICB0aGlzLnBvc2l0aW9ucyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XG59XG5cbnZhciBQb3NpdGlvbiA9IHJlcXVpcmUoJy4uL21vZGVscy9Qb3NpdGlvbicpO1xuLy8gVXNlclBvc2l0aW9uIG1vZGVsXG5mdW5jdGlvbiBzZXRTb21lVGVzdGluZ0RhdGEoZGF0YXZpZXcpIHtcbiAgICBcbiAgICBkYXRhdmlldy5wb3NpdGlvbnMucHVzaChuZXcgUG9zaXRpb24oe1xuICAgICAgICBwb3NpdGlvblNpbmd1bGFyOiAnTWFzc2FnZSBUaGVyYXBpc3QnXG4gICAgfSkpO1xuICAgIGRhdGF2aWV3LnBvc2l0aW9ucy5wdXNoKG5ldyBQb3NpdGlvbih7XG4gICAgICAgIHBvc2l0aW9uU2luZ3VsYXI6ICdIb3VzZWtlZXBlcidcbiAgICB9KSk7XG59IiwiLyoqXG4gICAgU2NoZWR1bGluZyBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBzaW5nbGV0b24gPSBudWxsLFxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpLFxuICAgIE5hdkJhciA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QmFyJyk7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRTY2hlZHVsaW5nKCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgU2NoZWR1bGluZ0FjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcbiAgICBcbiAgICByZXR1cm4gc2luZ2xldG9uO1xufTtcblxuZnVuY3Rpb24gU2NoZWR1bGluZ0FjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMuZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XG4gICAgICAgIHRpdGxlOiAnU2NoZWR1bGluZycsXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5tZW51TmV3SXRlbSxcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5tZW51SW5cbiAgICB9KTtcbn1cblxuU2NoZWR1bGluZ0FjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG5cbn07XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcblxufVxuIiwiLyoqXHJcbiAgICBzZXJ2aWNlcyBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG4gICAgXHJcbnZhciBzaW5nbGV0b24gPSBudWxsO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIFNlcnZpY2VzQWN0aXZpdHkoKSB7XHJcblxyXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIFxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLlByb3ZpZGVyO1xyXG4gICAgXHJcbiAgICAvLyBUT0RPOiBvbiBzaG93LCBuZWVkIHRvIGJlIHVwZGF0ZWQgd2l0aCB0aGUgSm9iVGl0bGUgbmFtZVxyXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdKb2IgdGl0bGUnKTtcclxuICAgIFxyXG4gICAgLy90aGlzLiRsaXN0VmlldyA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNzZXJ2aWNlc0xpc3RWaWV3Jyk7XHJcblxyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XHJcblxyXG4gICAgLy8gVGVzdGluZ0RhdGFcclxuICAgIHRoaXMudmlld01vZGVsLnNlcnZpY2VzKHJlcXVpcmUoJy4uL3Rlc3RkYXRhL3NlcnZpY2VzJykuc2VydmljZXMubWFwKFNlbGVjdGFibGUpKTtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciB0byBnbyBiYWNrIHdpdGggdGhlIHNlbGVjdGVkIHNlcnZpY2Ugd2hlbiBcclxuICAgIC8vIHNlbGVjdGlvbiBtb2RlIGdvZXMgb2ZmIGFuZCByZXF1ZXN0RGF0YSBpcyBmb3JcclxuICAgIC8vICdzZWxlY3QgbW9kZSdcclxuICAgIHRoaXMudmlld01vZGVsLmlzU2VsZWN0aW9uTW9kZS5zdWJzY3JpYmUoZnVuY3Rpb24gKGl0SXMpIHtcclxuICAgICAgICAvLyBXZSBoYXZlIGEgcmVxdWVzdCBhbmRcclxuICAgICAgICAvLyBpdCByZXF1ZXN0ZWQgdG8gc2VsZWN0IGEgc2VydmljZVxyXG4gICAgICAgIC8vIGFuZCBzZWxlY3Rpb24gbW9kZSBnb2VzIG9mZlxyXG4gICAgICAgIGlmICh0aGlzLnJlcXVlc3REYXRhICYmXHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdERhdGEuc2VsZWN0U2VydmljZXMgPT09IHRydWUgJiZcclxuICAgICAgICAgICAgaXRJcyA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFBhc3MgdGhlIHNlbGVjdGVkIGNsaWVudCBpbiB0aGUgaW5mb1xyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3REYXRhLnNlbGVjdGVkU2VydmljZXMgPSB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZFNlcnZpY2VzKCk7XHJcbiAgICAgICAgICAgIC8vIEFuZCBnbyBiYWNrXHJcbiAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvQmFjayh0aGlzLnJlcXVlc3REYXRhKTtcclxuICAgICAgICAgICAgLy8gTGFzdCwgY2xlYXIgcmVxdWVzdERhdGFcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RGF0YSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcblxyXG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBvcHRpb25zKTtcclxuICAgIFxyXG4gICAgLy8gR2V0IGpvYnRpdGxlSUQgZm9yIHRoZSByZXF1ZXN0XHJcbiAgICB2YXIgcm91dGUgPSB0aGlzLnJlcXVlc3REYXRhLnJvdXRlO1xyXG4gICAgdmFyIGpvYlRpdGxlSUQgPSByb3V0ZSAmJiByb3V0ZS5zZWdtZW50cyAmJiByb3V0ZS5zZWdtZW50c1swXTtcclxuICAgIGpvYlRpdGxlSUQgPSBwYXJzZUludChqb2JUaXRsZUlELCAxMCk7XHJcbiAgICBpZiAoam9iVGl0bGVJRCkge1xyXG4gICAgICAgIC8vIFRPRE86IGdldCBkYXRhIGZvciB0aGUgSm9iIHRpdGxlIElEXHJcbiAgICAgICAgdGhpcy5hcHAubW9kZWwuZ2V0VXNlckpvYlRpdGxlKGpvYlRpdGxlSUQpLnRoZW4oZnVuY3Rpb24odXNlckpvYnRpdGxlKSB7XHJcbiAgICAgICAgICAgIGlmICghdXNlckpvYnRpdGxlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTm8gdXNlciBqb2IgdGl0bGUnKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBMb2FkIHVzZXIgZGF0YSBvbiB0aGlzIGFjdGl2aXR5OlxyXG4gICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5zZXJ2aWNlcyh1c2VySm9idGl0bGUuc2VydmljZXMoKSk7XHJcbiAgICAgICAgICAgIC8vIEZpbGwgaW4gam9iIHRpdGxlIG5hbWVcclxuICAgICAgICAgICAgdGhpcy5hcHAubW9kZWwuZ2V0Sm9iVGl0bGUoam9iVGl0bGVJRCkudGhlbihmdW5jdGlvbihqb2JUaXRsZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFqb2JUaXRsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdObyBqb2IgdGl0bGUnKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5hdkJhci5sZWZ0QWN0aW9uKCkudGV4dChqb2JUaXRsZS5zaW5ndWxhck5hbWUoKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLnJlcXVlc3REYXRhLnNlbGVjdFNlcnZpY2VzID09PSB0cnVlKSB7XHJcbiAgICAgICAgdGhpcy52aWV3TW9kZWwuaXNTZWxlY3Rpb25Nb2RlKHRydWUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8qIFRyaWFscyB0byBwcmVzZXRzIHRoZSBzZWxlY3RlZCBzZXJ2aWNlcywgTk9UIFdPUktJTkdcclxuICAgICAgICB2YXIgc2VydmljZXMgPSAob3B0aW9ucy5zZWxlY3RlZFNlcnZpY2VzIHx8IFtdKTtcclxuICAgICAgICB2YXIgc2VsZWN0ZWRTZXJ2aWNlcyA9IHRoaXMudmlld01vZGVsLnNlbGVjdGVkU2VydmljZXM7XHJcbiAgICAgICAgc2VsZWN0ZWRTZXJ2aWNlcy5yZW1vdmVBbGwoKTtcclxuICAgICAgICB0aGlzLnZpZXdNb2RlbC5zZXJ2aWNlcygpLmZvckVhY2goZnVuY3Rpb24oc2VydmljZSkge1xyXG4gICAgICAgICAgICBzZXJ2aWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHNlbFNlcnZpY2UpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzZWxTZXJ2aWNlID09PSBzZXJ2aWNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VydmljZS5pc1NlbGVjdGVkKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkU2VydmljZXMucHVzaChzZXJ2aWNlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VydmljZS5pc1NlbGVjdGVkKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgKi9cclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIFNlbGVjdGFibGUob2JqKSB7XHJcbiAgICBvYmouaXNTZWxlY3RlZCA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgcmV0dXJuIG9iajtcclxufVxyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIC8vIEZ1bGwgbGlzdCBvZiBzZXJ2aWNlc1xyXG4gICAgdGhpcy5zZXJ2aWNlcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcblxyXG4gICAgLy8gRXNwZWNpYWwgbW9kZSB3aGVuIGluc3RlYWQgb2YgcGljayBhbmQgZWRpdCB3ZSBhcmUganVzdCBzZWxlY3RpbmdcclxuICAgIC8vICh3aGVuIGVkaXRpbmcgYW4gYXBwb2ludG1lbnQpXHJcbiAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZSA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG5cclxuICAgIC8vIEdyb3VwZWQgbGlzdCBvZiBwcmljaW5nczpcclxuICAgIC8vIERlZmluZWQgZ3JvdXBzOiByZWd1bGFyIHNlcnZpY2VzIGFuZCBhZGQtb25zXHJcbiAgICB0aGlzLmdyb3VwZWRTZXJ2aWNlcyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIHZhciBzZXJ2aWNlcyA9IHRoaXMuc2VydmljZXMoKTtcclxuICAgICAgICB2YXIgaXNTZWxlY3Rpb24gPSB0aGlzLmlzU2VsZWN0aW9uTW9kZSgpO1xyXG5cclxuICAgICAgICB2YXIgc2VydmljZXNHcm91cCA9IHtcclxuICAgICAgICAgICAgICAgIGdyb3VwOiBpc1NlbGVjdGlvbiA/ICdTZWxlY3Qgc3RhbmRhbG9uZSBzZXJ2aWNlcycgOiAnU3RhbmRhbG9uZSBzZXJ2aWNlcycsXHJcbiAgICAgICAgICAgICAgICBzZXJ2aWNlczogW11cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYWRkb25zR3JvdXAgPSB7XHJcbiAgICAgICAgICAgICAgICBncm91cDogaXNTZWxlY3Rpb24gPyAnU2VsZWN0IGFkZC1vbiBzZXJ2aWNlcycgOiAnQWRkLW9uIHNlcnZpY2VzJyxcclxuICAgICAgICAgICAgICAgIHNlcnZpY2VzOiBbXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBncm91cHMgPSBbc2VydmljZXNHcm91cCwgYWRkb25zR3JvdXBdO1xyXG5cclxuICAgICAgICBzZXJ2aWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBpc0FkZG9uID0gc2VydmljZS5pc0FkZG9uKCk7XHJcbiAgICAgICAgICAgIGlmIChpc0FkZG9uKSB7XHJcbiAgICAgICAgICAgICAgICBhZGRvbnNHcm91cC5zZXJ2aWNlcy5wdXNoKHNlcnZpY2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2VydmljZXNHcm91cC5zZXJ2aWNlcy5wdXNoKHNlcnZpY2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBncm91cHM7XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2VsZWN0ZWRTZXJ2aWNlcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcbiAgICAvKipcclxuICAgICAgICBUb2dnbGUgdGhlIHNlbGVjdGlvbiBzdGF0dXMgb2YgYSBzZXJ2aWNlLCBhZGRpbmdcclxuICAgICAgICBvciByZW1vdmluZyBpdCBmcm9tIHRoZSAnc2VsZWN0ZWRTZXJ2aWNlcycgYXJyYXkuXHJcbiAgICAqKi9cclxuICAgIHRoaXMudG9nZ2xlU2VydmljZVNlbGVjdGlvbiA9IGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgaW5JbmRleCA9IC0xLFxyXG4gICAgICAgICAgICBpc1NlbGVjdGVkID0gdGhpcy5zZWxlY3RlZFNlcnZpY2VzKCkuc29tZShmdW5jdGlvbihzZWxlY3RlZFNlcnZpY2UsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RlZFNlcnZpY2UgPT09IHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgICAgIGluSW5kZXggPSBpbmRleDtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2VydmljZS5pc1NlbGVjdGVkKCFpc1NlbGVjdGVkKTtcclxuXHJcbiAgICAgICAgaWYgKGlzU2VsZWN0ZWQpXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRTZXJ2aWNlcy5zcGxpY2UoaW5JbmRleCwgMSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkU2VydmljZXMucHVzaChzZXJ2aWNlKTtcclxuXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEVuZHMgdGhlIHNlbGVjdGlvbiBwcm9jZXNzLCByZWFkeSB0byBjb2xsZWN0IHNlbGVjdGlvblxyXG4gICAgICAgIGFuZCBwYXNzaW5nIGl0IHRvIHRoZSByZXF1ZXN0IGFjdGl2aXR5XHJcbiAgICAqKi9cclxuICAgIHRoaXMuZW5kU2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5pc1NlbGVjdGlvbk1vZGUoZmFsc2UpO1xyXG4gICAgICAgIFxyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG59XHJcbiIsIi8qKlxuICAgIFNpZ251cCBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxuICAgIE5hdkJhciA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QmFyJyksXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcblxudmFyIHNpbmdsZXRvbiA9IG51bGw7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRTaWdudXAoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBTaWdudXBBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XG4gICAgXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbn07XG5cbmZ1bmN0aW9uIFNpZ251cEFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkFub255bW91cztcbiAgICBcbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBuZXcgTmF2QmFyKHtcbiAgICAgICAgdGl0bGU6IG51bGwsIC8vIG51bGwgZm9yIExvZ29cbiAgICAgICAgbGVmdEFjdGlvbjogbnVsbCxcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5tZW51T3V0XG4gICAgfSk7XG4gICAgXG4gICAgLy8gUGVyZm9ybSBzaWduLXVwIHJlcXVlc3Qgd2hlbiBpcyByZXF1ZXN0ZWQgYnkgdGhlIGZvcm06XG4gICAgdGhpcy5kYXRhVmlldy5pc1NpZ25pbmdVcC5zdWJzY3JpYmUoZnVuY3Rpb24odikge1xuICAgICAgICBpZiAodiA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBQZXJmb3JtIHNpZ251cFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBOb3RpZnkgc3RhdGU6XG4gICAgICAgICAgICB2YXIgJGJ0biA9ICRhY3Rpdml0eS5maW5kKCdbdHlwZT1cInN1Ym1pdFwiXScpO1xuICAgICAgICAgICAgJGJ0bi5idXR0b24oJ2xvYWRpbmcnKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQ2xlYXIgcHJldmlvdXMgZXJyb3Igc28gbWFrZXMgY2xlYXIgd2VcbiAgICAgICAgICAgIC8vIGFyZSBhdHRlbXB0aW5nXG4gICAgICAgICAgICB0aGlzLmRhdGFWaWV3LnNpZ251cEVycm9yKCcnKTtcbiAgICAgICAgXG4gICAgICAgICAgICB2YXIgZW5kZWQgPSBmdW5jdGlvbiBlbmRlZCgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmlzU2lnbmluZ1VwKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAkYnRuLmJ1dHRvbigncmVzZXQnKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQWZ0ZXIgY2xlYW4tdXAgZXJyb3IgKHRvIGZvcmNlIHNvbWUgdmlldyB1cGRhdGVzKSxcbiAgICAgICAgICAgIC8vIHZhbGlkYXRlIGFuZCBhYm9ydCBvbiBlcnJvclxuICAgICAgICAgICAgLy8gTWFudWFsbHkgY2hlY2tpbmcgZXJyb3Igb24gZWFjaCBmaWVsZFxuICAgICAgICAgICAgaWYgKHRoaXMuZGF0YVZpZXcudXNlcm5hbWUuZXJyb3IoKSB8fFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcucGFzc3dvcmQuZXJyb3IoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcuc2lnbnVwRXJyb3IoJ1JldmlldyB5b3VyIGRhdGEnKTtcbiAgICAgICAgICAgICAgICBlbmRlZCgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgYXBwLm1vZGVsLnNpZ251cChcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFWaWV3LnVzZXJuYW1lKCksXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5wYXNzd29yZCgpLFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcucHJvZmlsZSgpXG4gICAgICAgICAgICApLnRoZW4oZnVuY3Rpb24oc2lnbnVwRGF0YSkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcuc2lnbnVwRXJyb3IoJycpO1xuICAgICAgICAgICAgICAgIGVuZGVkKCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGZvcm0gZGF0YVxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcudXNlcm5hbWUoJycpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcucGFzc3dvcmQoJycpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLmdvRGFzaGJvYXJkKCk7XG5cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIG1zZyA9IGVyciAmJiBlcnIucmVzcG9uc2VKU09OICYmIGVyci5yZXNwb25zZUpTT04uZXJyb3JNZXNzYWdlIHx8XG4gICAgICAgICAgICAgICAgICAgIGVyciAmJiBlcnIuc3RhdHVzVGV4dCB8fFxuICAgICAgICAgICAgICAgICAgICAnSW52YWxpZCB1c2VybmFtZSBvciBwYXNzd29yZCc7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFWaWV3LnNpZ251cEVycm9yKG1zZyk7XG4gICAgICAgICAgICAgICAgZW5kZWQoKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuICAgIFxuICAgIC8vIEZvY3VzIGZpcnN0IGJhZCBmaWVsZCBvbiBlcnJvclxuICAgIHRoaXMuZGF0YVZpZXcuc2lnbnVwRXJyb3Iuc3Vic2NyaWJlKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAvLyBTaWdudXAgaXMgZWFzeSBzaW5jZSB3ZSBtYXJrIGJvdGggdW5pcXVlIGZpZWxkc1xuICAgICAgICAvLyBhcyBlcnJvciBvbiBzaWdudXBFcnJvciAoaXRzIGEgZ2VuZXJhbCBmb3JtIGVycm9yKVxuICAgICAgICB2YXIgaW5wdXQgPSAkYWN0aXZpdHkuZmluZCgnOmlucHV0JykuZ2V0KDApO1xuICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgaW5wdXQuZm9jdXMoKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaW5wdXQuYmx1cigpO1xuICAgIH0pO1xufVxuXG5TaWdudXBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuXG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5yb3V0ZSAmJlxuICAgICAgICBvcHRpb25zLnJvdXRlLnNlZ21lbnRzICYmXG4gICAgICAgIG9wdGlvbnMucm91dGUuc2VnbWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuZGF0YVZpZXcucHJvZmlsZShvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdKTtcbiAgICB9XG59O1xudmFyIEZvcm1DcmVkZW50aWFscyA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvRm9ybUNyZWRlbnRpYWxzJyk7XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcblxuICAgIHZhciBjcmVkZW50aWFscyA9IG5ldyBGb3JtQ3JlZGVudGlhbHMoKTsgICAgXG4gICAgdGhpcy51c2VybmFtZSA9IGNyZWRlbnRpYWxzLnVzZXJuYW1lO1xuICAgIHRoaXMucGFzc3dvcmQgPSBjcmVkZW50aWFscy5wYXNzd29yZDtcblxuICAgIHRoaXMuc2lnbnVwRXJyb3IgPSBrby5vYnNlcnZhYmxlKCcnKTtcbiAgICBcbiAgICB0aGlzLmlzU2lnbmluZ1VwID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG4gICAgXG4gICAgdGhpcy5wZXJmb3JtU2lnbnVwID0gZnVuY3Rpb24gcGVyZm9ybVNpZ251cCgpIHtcblxuICAgICAgICB0aGlzLmlzU2lnbmluZ1VwKHRydWUpO1xuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIHRoaXMucHJvZmlsZSA9IGtvLm9ic2VydmFibGUoJ2N1c3RvbWVyJyk7XG59XG4iLCIvKipcclxuICAgIHRleHRFZGl0b3IgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXIsXHJcbiAgICBOYXZCYXIgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkJhcicpLFxyXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcclxuICAgIFxyXG52YXIgc2luZ2xldG9uID0gbnVsbDtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRUZXh0RWRpdG9yKCRhY3Rpdml0eSwgYXBwKSB7XHJcbiAgICBcclxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXHJcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IFRleHRFZGl0b3JBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XHJcbiAgICBcclxuICAgIHJldHVybiBzaW5nbGV0b247XHJcbn07XHJcblxyXG5mdW5jdGlvbiBUZXh0RWRpdG9yQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICB0aGlzLm5hdkJhciA9IG5ldyBOYXZCYXIoe1xyXG4gICAgICAgIC8vIFRpdGxlIGlzIGVtcHR5IGV2ZXIsIHNpbmNlIHdlIGFyZSBpbiAnZ28gYmFjaycgbW9kZSBhbGwgdGhlIHRpbWUgaGVyZVxyXG4gICAgICAgIHRpdGxlOiAnJyxcclxuICAgICAgICAvLyBidXQgbGVmdEFjdGlvbi50ZXh0IGlzIHVwZGF0ZWQgb24gJ3Nob3cnIHdpdGggcGFzc2VkIHZhbHVlLFxyXG4gICAgICAgIC8vIHNvIHdlIG5lZWQgYSBjbG9uZSB0byBub3QgbW9kaWZ5IHRoZSBzaGFyZWQgc3RhdGljIGluc3RhbmNlXHJcbiAgICAgICAgbGVmdEFjdGlvbjogTmF2QWN0aW9uLmdvQmFjay5tb2RlbC5jbG9uZSh7IGlzVGl0bGU6IHRydWUgfSksXHJcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5nb0hlbHBJbmRleFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEZpZWxkc1xyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuICAgIHRoaXMuJHRleHRhcmVhID0gdGhpcy4kYWN0aXZpdHkuZmluZCgndGV4dGFyZWEnKTtcclxuICAgIHRoaXMudGV4dGFyZWEgPSB0aGlzLiR0ZXh0YXJlYS5nZXQoMCk7XHJcblxyXG4gICAgLy8gRGF0YVxyXG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcclxuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XHJcbiAgICBcclxuICAgIC8vIE9iamVjdCB0byBob2xkIHRoZSBvcHRpb25zIHBhc3NlZCBvbiAnc2hvdycgYXMgYSByZXN1bHRcclxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyc1xyXG4gICAgLy8gSGFuZGxlciBmb3IgdGhlICdzYXZlZCcgZXZlbnQgc28gdGhlIGFjdGl2aXR5XHJcbiAgICAvLyByZXR1cm5zIGJhY2sgdG8gdGhlIHJlcXVlc3RlciBhY3Rpdml0eSBnaXZpbmcgaXRcclxuICAgIC8vIHRoZSBuZXcgdGV4dFxyXG4gICAgdGhpcy5kYXRhVmlldy5vbignc2F2ZWQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAodGhpcy5yZXF1ZXN0SW5mbykge1xyXG4gICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGluZm8gd2l0aCB0aGUgbmV3IHRleHRcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mby50ZXh0ID0gdGhpcy5kYXRhVmlldy50ZXh0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBhbmQgcGFzcyBpdCBiYWNrXHJcbiAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ29CYWNrKHRoaXMucmVxdWVzdEluZm8pO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuIFxyXG4gICAgLy8gSGFuZGxlciB0aGUgY2FuY2VsIGV2ZW50XHJcbiAgICB0aGlzLmRhdGFWaWV3Lm9uKCdjYW5jZWwnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyByZXR1cm4sIG5vdGhpbmcgY2hhbmdlZFxyXG4gICAgICAgIGFwcC5zaGVsbC5nb0JhY2soKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn1cclxuXHJcblRleHRFZGl0b3JBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG4gICAgXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBvcHRpb25zO1xyXG5cclxuICAgIC8vIFNldCBuYXZpZ2F0aW9uIHRpdGxlIG9yIG5vdGhpbmdcclxuICAgIHRoaXMubmF2QmFyLmxlZnRBY3Rpb24oKS50ZXh0KG9wdGlvbnMudGl0bGUgfHwgJycpO1xyXG4gICAgXHJcbiAgICAvLyBGaWVsZCBoZWFkZXJcclxuICAgIHRoaXMuZGF0YVZpZXcuaGVhZGVyVGV4dChvcHRpb25zLmhlYWRlcik7XHJcbiAgICB0aGlzLmRhdGFWaWV3LnRleHQob3B0aW9ucy50ZXh0KTtcclxuICAgIGlmIChvcHRpb25zLnJvd3NOdW1iZXIpXHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5yb3dzTnVtYmVyKG9wdGlvbnMucm93c051bWJlcik7XHJcbiAgICAgICAgXHJcbiAgICAvLyBJbm1lZGlhdGUgZm9jdXMgdG8gdGhlIHRleHRhcmVhIGZvciBiZXR0ZXIgdXNhYmlsaXR5XHJcbiAgICB0aGlzLnRleHRhcmVhLmZvY3VzKCk7XHJcbiAgICB0aGlzLiR0ZXh0YXJlYS5jbGljaygpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJ1RleHQnKTtcclxuXHJcbiAgICAvLyBUZXh0IHRvIGVkaXRcclxuICAgIHRoaXMudGV4dCA9IGtvLm9ic2VydmFibGUoJycpO1xyXG4gICAgXHJcbiAgICAvLyBOdW1iZXIgb2Ygcm93cyBmb3IgdGhlIHRleHRhcmVhXHJcbiAgICB0aGlzLnJvd3NOdW1iZXIgPSBrby5vYnNlcnZhYmxlKDIpO1xyXG5cclxuICAgIHRoaXMuY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKCkge1xyXG4gICAgICAgIHRoaXMuZW1pdCgnY2FuY2VsJyk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgICAgIHRoaXMuZW1pdCgnc2F2ZWQnKTtcclxuICAgIH07XHJcbn1cclxuXHJcblZpZXdNb2RlbC5faW5oZXJpdHMoRXZlbnRFbWl0dGVyKTtcclxuIiwiLyoqXHJcbiAgICBSZWdpc3RyYXRpb24gb2YgY3VzdG9tIGh0bWwgY29tcG9uZW50cyB1c2VkIGJ5IHRoZSBBcHAuXHJcbiAgICBBbGwgd2l0aCAnYXBwLScgYXMgcHJlZml4LlxyXG4gICAgXHJcbiAgICBTb21lIGRlZmluaXRpb25zIG1heSBiZSBpbmNsdWRlZCBvbi1saW5lIHJhdGhlciB0aGFuIG9uIHNlcGFyYXRlZFxyXG4gICAgZmlsZXMgKHZpZXdtb2RlbHMpLCB0ZW1wbGF0ZXMgYXJlIGxpbmtlZCBzbyBuZWVkIHRvIGJlIFxyXG4gICAgaW5jbHVkZWQgaW4gdGhlIGh0bWwgZmlsZSB3aXRoIHRoZSBzYW1lIElEIHRoYXQgcmVmZXJlbmNlZCBoZXJlLFxyXG4gICAgdXN1YWxseSB1c2luZyBhcyBET00gSUQgdGhlIHNhbWUgbmFtZSBhcyB0aGUgY29tcG9uZW50IHdpdGggc3VmaXggJy10ZW1wbGF0ZScuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG52YXIgcHJvcFRvb2xzID0gcmVxdWlyZSgnLi91dGlscy9qc1Byb3BlcnRpZXNUb29scycpO1xyXG5cclxuZnVuY3Rpb24gZ2V0T2JzZXJ2YWJsZShvYnNPclZhbHVlKSB7XHJcbiAgICBpZiAodHlwZW9mKG9ic09yVmFsdWUpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgIHJldHVybiBvYnNPclZhbHVlO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIHJldHVybiBrby5vYnNlcnZhYmxlKG9ic09yVmFsdWUpO1xyXG59XHJcblxyXG5leHBvcnRzLnJlZ2lzdGVyQWxsID0gZnVuY3Rpb24oKSB7XHJcbiAgICBcclxuICAgIC8vLyBuYXZiYXItYWN0aW9uXHJcbiAgICBrby5jb21wb25lbnRzLnJlZ2lzdGVyKCdhcHAtbmF2YmFyLWFjdGlvbicsIHtcclxuICAgICAgICB0ZW1wbGF0ZTogeyBlbGVtZW50OiAnbmF2YmFyLWFjdGlvbi10ZW1wbGF0ZScgfSxcclxuICAgICAgICB2aWV3TW9kZWw6IGZ1bmN0aW9uKHBhcmFtcykge1xyXG5cclxuICAgICAgICAgICAgcHJvcFRvb2xzLmRlZmluZUdldHRlcih0aGlzLCAnYWN0aW9uJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtcy5hY3Rpb24gJiYgcGFyYW1zLm5hdkJhcigpID9cclxuICAgICAgICAgICAgICAgICAgICBwYXJhbXMubmF2QmFyKClbcGFyYW1zLmFjdGlvbl0oKSA6XHJcbiAgICAgICAgICAgICAgICAgICAgbnVsbFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vLyB1bmxhYmVsZWQtaW5wdXRcclxuICAgIGtvLmNvbXBvbmVudHMucmVnaXN0ZXIoJ2FwcC11bmxhYmVsZWQtaW5wdXQnLCB7XHJcbiAgICAgICAgdGVtcGxhdGU6IHsgZWxlbWVudDogJ3VubGFiZWxlZC1pbnB1dC10ZW1wbGF0ZScgfSxcclxuICAgICAgICB2aWV3TW9kZWw6IGZ1bmN0aW9uKHBhcmFtcykge1xyXG5cclxuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IGdldE9ic2VydmFibGUocGFyYW1zLnZhbHVlKTtcclxuICAgICAgICAgICAgdGhpcy5wbGFjZWhvbGRlciA9IGdldE9ic2VydmFibGUocGFyYW1zLnBsYWNlaG9sZGVyKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8vIGZlZWRiYWNrLWVudHJ5XHJcbiAgICBrby5jb21wb25lbnRzLnJlZ2lzdGVyKCdhcHAtZmVlZGJhY2stZW50cnknLCB7XHJcbiAgICAgICAgdGVtcGxhdGU6IHsgZWxlbWVudDogJ2ZlZWRiYWNrLWVudHJ5LXRlbXBsYXRlJyB9LFxyXG4gICAgICAgIHZpZXdNb2RlbDogZnVuY3Rpb24ocGFyYW1zKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNlY3Rpb24gPSBnZXRPYnNlcnZhYmxlKHBhcmFtcy5zZWN0aW9uIHx8ICcnKTtcclxuICAgICAgICAgICAgdGhpcy51cmwgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJy9mZWVkYmFjay8nICsgdGhpcy5zZWN0aW9uKCk7XHJcbiAgICAgICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKipcclxuICAgIE5hdmJhciBleHRlbnNpb24gb2YgdGhlIEFwcCxcclxuICAgIGFkZHMgdGhlIGVsZW1lbnRzIHRvIG1hbmFnZSBhIHZpZXcgbW9kZWxcclxuICAgIGZvciB0aGUgTmF2QmFyIGFuZCBhdXRvbWF0aWMgY2hhbmdlc1xyXG4gICAgdW5kZXIgc29tZSBtb2RlbCBjaGFuZ2VzIGxpa2UgdXNlciBsb2dpbi9sb2dvdXRcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBOYXZCYXIgPSByZXF1aXJlKCcuL3ZpZXdtb2RlbHMvTmF2QmFyJyksXHJcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyk7XHJcblxyXG5leHBvcnRzLmV4dGVuZHMgPSBmdW5jdGlvbiAoYXBwKSB7XHJcbiAgICBcclxuICAgIC8vIFJFVklFVzogc3RpbGwgbmVlZGVkPyBNYXliZSB0aGUgcGVyIGFjdGl2aXR5IG5hdkJhciBtZWFuc1xyXG4gICAgLy8gdGhpcyBpcyBub3QgbmVlZGVkLiBTb21lIHByZXZpb3VzIGxvZ2ljIHdhcyBhbHJlYWR5IHJlbW92ZWRcclxuICAgIC8vIGJlY2F1c2Ugd2FzIHVzZWxlc3MuXHJcbiAgICAvL1xyXG4gICAgLy8gQWRqdXN0IHRoZSBuYXZiYXIgc2V0dXAgZGVwZW5kaW5nIG9uIGN1cnJlbnQgdXNlcixcclxuICAgIC8vIHNpbmNlIGRpZmZlcmVudCB0aGluZ3MgYXJlIG5lZWQgZm9yIGxvZ2dlZC1pbi9vdXQuXHJcbiAgICBmdW5jdGlvbiBhZGp1c3RVc2VyQmFyKCkge1xyXG5cclxuICAgICAgICB2YXIgdXNlciA9IGFwcC5tb2RlbC51c2VyKCk7XHJcblxyXG4gICAgICAgIGlmICh1c2VyLmlzQW5vbnltb3VzKCkpIHtcclxuICAgICAgICAgICAgYXBwLm5hdkJhcigpLnJpZ2h0QWN0aW9uKE5hdkFjdGlvbi5tZW51T3V0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBDb21tZW50ZWQgbGluZXMsIHVzZWQgcHJldmlvdXNseSBidXQgdW51c2VkIG5vdywgaXQgbXVzdCBiZSBlbm91Z2ggd2l0aCB0aGUgdXBkYXRlXHJcbiAgICAvLyBwZXIgYWN0aXZpdHkgY2hhbmdlXHJcbiAgICAvL2FwcC5tb2RlbC51c2VyKCkuaXNBbm9ueW1vdXMuc3Vic2NyaWJlKHVwZGF0ZVN0YXRlc09uVXNlckNoYW5nZSk7XHJcbiAgICAvL2FwcC5tb2RlbC51c2VyKCkub25ib2FyZGluZ1N0ZXAuc3Vic2NyaWJlKHVwZGF0ZVN0YXRlc09uVXNlckNoYW5nZSk7XHJcbiAgICBcclxuICAgIGFwcC5uYXZCYXIgPSBrby5vYnNlcnZhYmxlKG51bGwpO1xyXG4gICAgXHJcbiAgICB2YXIgcmVmcmVzaE5hdiA9IGZ1bmN0aW9uIHJlZnJlc2hOYXYoKSB7XHJcbiAgICAgICAgLy8gVHJpZ2dlciBldmVudCB0byBmb3JjZSBhIGNvbXBvbmVudCB1cGRhdGVcclxuICAgICAgICAkKCcuQXBwTmF2JykudHJpZ2dlcignY29udGVudENoYW5nZScpO1xyXG4gICAgfTtcclxuICAgIHZhciBhdXRvUmVmcmVzaE5hdiA9IGZ1bmN0aW9uIGF1dG9SZWZyZXNoTmF2KGFjdGlvbikge1xyXG4gICAgICAgIGlmIChhY3Rpb24pIHtcclxuICAgICAgICAgICAgYWN0aW9uLnRleHQuc3Vic2NyaWJlKHJlZnJlc2hOYXYpO1xyXG4gICAgICAgICAgICBhY3Rpb24uaXNUaXRsZS5zdWJzY3JpYmUocmVmcmVzaE5hdik7XHJcbiAgICAgICAgICAgIGFjdGlvbi5pY29uLnN1YnNjcmliZShyZWZyZXNoTmF2KTtcclxuICAgICAgICAgICAgYWN0aW9uLmlzTWVudS5zdWJzY3JpYmUocmVmcmVzaE5hdik7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAgICBVcGRhdGUgdGhlIG5hdiBtb2RlbCB1c2luZyB0aGUgQWN0aXZpdHkgZGVmYXVsdHNcclxuICAgICoqL1xyXG4gICAgYXBwLnVwZGF0ZUFwcE5hdiA9IGZ1bmN0aW9uIHVwZGF0ZUFwcE5hdihhY3Rpdml0eSkge1xyXG5cclxuICAgICAgICAvLyBpZiB0aGUgYWN0aXZpdHkgaGFzIGl0cyBvd25cclxuICAgICAgICBpZiAoJ25hdkJhcicgaW4gYWN0aXZpdHkpIHtcclxuICAgICAgICAgICAgLy8gVXNlIHNwZWNpYWxpemllZCBhY3Rpdml0eSBiYXIgZGF0YVxyXG4gICAgICAgICAgICBhcHAubmF2QmFyKGFjdGl2aXR5Lm5hdkJhcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBVc2UgZGVmYXVsdCBvbmVcclxuICAgICAgICAgICAgYXBwLm5hdkJhcihuZXcgTmF2QmFyKCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVE9ETyBEb3VibGUgY2hlY2sgaWYgbmVlZGVkLlxyXG4gICAgICAgIC8vIExhdGVzdCBjaGFuZ2VzLCB3aGVuIG5lZWRlZFxyXG4gICAgICAgIGFkanVzdFVzZXJCYXIoKTtcclxuICAgICAgICBcclxuICAgICAgICByZWZyZXNoTmF2KCk7XHJcbiAgICAgICAgYXV0b1JlZnJlc2hOYXYoYXBwLm5hdkJhcigpLmxlZnRBY3Rpb24oKSk7XHJcbiAgICAgICAgYXV0b1JlZnJlc2hOYXYoYXBwLm5hdkJhcigpLnJpZ2h0QWN0aW9uKCkpO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBVcGRhdGUgdGhlIGFwcCBtZW51IHRvIGhpZ2hsaWdodCB0aGVcclxuICAgICAgICBnaXZlbiBsaW5rIG5hbWVcclxuICAgICoqL1xyXG4gICAgYXBwLnVwZGF0ZU1lbnUgPSBmdW5jdGlvbiB1cGRhdGVNZW51KG5hbWUpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgJG1lbnUgPSAkKCcuQXBwLW1lbnVzIC5uYXZiYXItY29sbGFwc2UnKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBSZW1vdmUgYW55IGFjdGl2ZVxyXG4gICAgICAgICRtZW51XHJcbiAgICAgICAgLmZpbmQoJ2xpJylcclxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xyXG4gICAgICAgIC8vIEFkZCBhY3RpdmVcclxuICAgICAgICAkbWVudVxyXG4gICAgICAgIC5maW5kKCcuZ28tJyArIG5hbWUpXHJcbiAgICAgICAgLmNsb3Nlc3QoJ2xpJylcclxuICAgICAgICAuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xyXG4gICAgICAgIC8vIEhpZGUgbWVudVxyXG4gICAgICAgICRtZW51XHJcbiAgICAgICAgLmZpbHRlcignOnZpc2libGUnKVxyXG4gICAgICAgIC5jb2xsYXBzZSgnaGlkZScpO1xyXG4gICAgfTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBMaXN0IG9mIGFjdGl2aXRpZXMgbG9hZGVkIGluIHRoZSBBcHAsXHJcbiAgICBhcyBhbiBvYmplY3Qgd2l0aCB0aGUgYWN0aXZpdHkgbmFtZSBhcyB0aGUga2V5XHJcbiAgICBhbmQgdGhlIGNvbnRyb2xsZXIgYXMgdmFsdWUuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICdjYWxlbmRhcic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jYWxlbmRhcicpLFxyXG4gICAgJ2RhdGV0aW1lUGlja2VyJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2RhdGV0aW1lUGlja2VyJyksXHJcbiAgICAnY2xpZW50cyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jbGllbnRzJyksXHJcbiAgICAnc2VydmljZXMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvc2VydmljZXMnKSxcclxuICAgICdsb2NhdGlvbnMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvbG9jYXRpb25zJyksXHJcbiAgICAndGV4dEVkaXRvcic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy90ZXh0RWRpdG9yJyksXHJcbiAgICAnaG9tZSc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9ob21lJyksXHJcbiAgICAnYXBwb2ludG1lbnQnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvYXBwb2ludG1lbnQnKSxcclxuICAgICdib29raW5nQ29uZmlybWF0aW9uJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2Jvb2tpbmdDb25maXJtYXRpb24nKSxcclxuICAgICdpbmRleCc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9pbmRleCcpLFxyXG4gICAgJ2xvZ2luJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2xvZ2luJyksXHJcbiAgICAnbG9nb3V0JzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2xvZ291dCcpLFxyXG4gICAgJ2xlYXJuTW9yZSc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9sZWFybk1vcmUnKSxcclxuICAgICdzaWdudXAnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvc2lnbnVwJyksXHJcbiAgICAnY29udGFjdEluZm8nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvY29udGFjdEluZm8nKSxcclxuICAgICdvbmJvYXJkaW5nUG9zaXRpb25zJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL29uYm9hcmRpbmdQb3NpdGlvbnMnKSxcclxuICAgICdvbmJvYXJkaW5nSG9tZSc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9vbmJvYXJkaW5nSG9tZScpLFxyXG4gICAgJ2xvY2F0aW9uRWRpdGlvbic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9sb2NhdGlvbkVkaXRpb24nKSxcclxuICAgICdvbmJvYXJkaW5nQ29tcGxldGUnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvb25ib2FyZGluZ0NvbXBsZXRlJyksXHJcbiAgICAnYWNjb3VudCc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9hY2NvdW50JyksXHJcbiAgICAnaW5ib3gnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvaW5ib3gnKSxcclxuICAgICdjb252ZXJzYXRpb24nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvY29udmVyc2F0aW9uJyksXHJcbiAgICAnc2NoZWR1bGluZyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9zY2hlZHVsaW5nJyksXHJcbiAgICAnam9idGl0bGVzJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2pvYnRpdGxlcycpLFxyXG4gICAgJ2ZlZWRiYWNrJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2ZlZWRiYWNrJyksXHJcbiAgICAnZmFxcyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9mYXFzJyksXHJcbiAgICAnZmVlZGJhY2tGb3JtJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2ZlZWRiYWNrRm9ybScpLFxyXG4gICAgJ2NvbnRhY3RGb3JtJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NvbnRhY3RGb3JtJyksXHJcbiAgICAnY21zJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NtcycpLFxyXG4gICAgJ2NsaWVudEVkaXRpb24nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvY2xpZW50RWRpdGlvbicpXHJcbn07XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKiBHbG9iYWwgZGVwZW5kZW5jaWVzICoqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnktbW9iaWxlJyk7XHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbmtvLmJpbmRpbmdIYW5kbGVycy5mb3JtYXQgPSByZXF1aXJlKCdrby9mb3JtYXRCaW5kaW5nJykuZm9ybWF0QmluZGluZztcclxudmFyIGJvb3Rrbm9jayA9IHJlcXVpcmUoJy4vdXRpbHMvYm9vdGtub2NrQmluZGluZ0hlbHBlcnMnKTtcclxucmVxdWlyZSgnLi91dGlscy9GdW5jdGlvbi5wcm90b3R5cGUuX2luaGVyaXRzJyk7XHJcbnJlcXVpcmUoJy4vdXRpbHMvRnVuY3Rpb24ucHJvdG90eXBlLl9kZWxheWVkJyk7XHJcbi8vIFByb21pc2UgcG9seWZpbGwsIHNvIGl0cyBub3QgJ3JlcXVpcmUnZCBwZXIgbW9kdWxlOlxyXG5yZXF1aXJlKCdlczYtcHJvbWlzZScpLnBvbHlmaWxsKCk7XHJcblxyXG52YXIgbGF5b3V0VXBkYXRlRXZlbnQgPSByZXF1aXJlKCdsYXlvdXRVcGRhdGVFdmVudCcpO1xyXG52YXIgTmF2QmFyID0gcmVxdWlyZSgnLi92aWV3bW9kZWxzL05hdkJhcicpLFxyXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi92aWV3bW9kZWxzL05hdkFjdGlvbicpLFxyXG4gICAgQXBwTW9kZWwgPSByZXF1aXJlKCcuL3ZpZXdtb2RlbHMvQXBwTW9kZWwnKTtcclxuXHJcbi8vIFJlZ2lzdGVyIHRoZSBzcGVjaWFsIGxvY2FsZVxyXG5yZXF1aXJlKCcuL2xvY2FsZXMvZW4tVVMtTEMnKTtcclxuXHJcbi8qKlxyXG4gICAgQSBzZXQgb2YgZml4ZXMvd29ya2Fyb3VuZHMgZm9yIEJvb3RzdHJhcCBiZWhhdmlvci9wbHVnaW5zXHJcbiAgICB0byBiZSBleGVjdXRlZCBiZWZvcmUgQm9vdHN0cmFwIGlzIGluY2x1ZGVkL2V4ZWN1dGVkLlxyXG4gICAgRm9yIGV4YW1wbGUsIGJlY2F1c2Ugb2YgZGF0YS1iaW5kaW5nIHJlbW92aW5nL2NyZWF0aW5nIGVsZW1lbnRzLFxyXG4gICAgc29tZSBvbGQgcmVmZXJlbmNlcyB0byByZW1vdmVkIGl0ZW1zIG1heSBnZXQgYWxpdmUgYW5kIG5lZWQgdXBkYXRlLFxyXG4gICAgb3IgcmUtZW5hYmxpbmcgc29tZSBiZWhhdmlvcnMuXHJcbioqL1xyXG5mdW5jdGlvbiBwcmVCb290c3RyYXBXb3JrYXJvdW5kcygpIHtcclxuICAgIC8vIEludGVybmFsIEJvb3RzdHJhcCBzb3VyY2UgdXRpbGl0eVxyXG4gICAgZnVuY3Rpb24gZ2V0VGFyZ2V0RnJvbVRyaWdnZXIoJHRyaWdnZXIpIHtcclxuICAgICAgICB2YXIgaHJlZixcclxuICAgICAgICAgICAgdGFyZ2V0ID0gJHRyaWdnZXIuYXR0cignZGF0YS10YXJnZXQnKSB8fFxyXG4gICAgICAgICAgICAoaHJlZiA9ICR0cmlnZ2VyLmF0dHIoJ2hyZWYnKSkgJiYgXHJcbiAgICAgICAgICAgIGhyZWYucmVwbGFjZSgvLiooPz0jW15cXHNdKyQpLywgJycpOyAvLyBzdHJpcCBmb3IgaWU3XHJcblxyXG4gICAgICAgIHJldHVybiAkKHRhcmdldCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEJ1ZzogbmF2YmFyLWNvbGxhcHNlIGVsZW1lbnRzIGhvbGQgYSByZWZlcmVuY2UgdG8gdGhlaXIgb3JpZ2luYWxcclxuICAgIC8vICR0cmlnZ2VyLCBidXQgdGhhdCB0cmlnZ2VyIGNhbiBjaGFuZ2Ugb24gZGlmZmVyZW50ICdjbGlja3MnIG9yXHJcbiAgICAvLyBnZXQgcmVtb3ZlZCB0aGUgb3JpZ2luYWwsIHNvIGl0IG11c3QgcmVmZXJlbmNlIHRoZSBuZXcgb25lXHJcbiAgICAvLyAodGhlIGxhdGVzdHMgY2xpY2tlZCwgYW5kIG5vdCB0aGUgY2FjaGVkIG9uZSB1bmRlciB0aGUgJ2RhdGEnIEFQSSkuICAgIFxyXG4gICAgLy8gTk9URTogaGFuZGxlciBtdXN0IGV4ZWN1dGUgYmVmb3JlIHRoZSBCb290c3RyYXAgaGFuZGxlciBmb3IgdGhlIHNhbWVcclxuICAgIC8vIGV2ZW50IGluIG9yZGVyIHRvIHdvcmsuXHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2suYnMuY29sbGFwc2UuZGF0YS1hcGkud29ya2Fyb3VuZCcsICdbZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiXScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICAkdGFyZ2V0ID0gZ2V0VGFyZ2V0RnJvbVRyaWdnZXIoJHQpLFxyXG4gICAgICAgICAgICBkYXRhID0gJHRhcmdldCAmJiAkdGFyZ2V0LmRhdGEoJ2JzLmNvbGxhcHNlJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSWYgYW55XHJcbiAgICAgICAgaWYgKGRhdGEpIHtcclxuICAgICAgICAgICAgLy8gUmVwbGFjZSB0aGUgdHJpZ2dlciBpbiB0aGUgZGF0YSByZWZlcmVuY2U6XHJcbiAgICAgICAgICAgIGRhdGEuJHRyaWdnZXIgPSAkdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gT24gZWxzZSwgbm90aGluZyB0byBkbywgYSBuZXcgQ29sbGFwc2UgaW5zdGFuY2Ugd2lsbCBiZSBjcmVhdGVkXHJcbiAgICAgICAgLy8gd2l0aCB0aGUgY29ycmVjdCB0YXJnZXQsIHRoZSBmaXJzdCB0aW1lXHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAgICBBcHAgc3RhdGljIGNsYXNzXHJcbioqL1xyXG52YXIgYXBwID0ge1xyXG4gICAgc2hlbGw6IHJlcXVpcmUoJy4vYXBwLnNoZWxsJyksXHJcbiAgICBcclxuICAgIC8vIE5ldyBhcHAgbW9kZWwsIHRoYXQgc3RhcnRzIHdpdGggYW5vbnltb3VzIHVzZXJcclxuICAgIG1vZGVsOiBuZXcgQXBwTW9kZWwoKSxcclxuICAgIFxyXG4gICAgLyoqIExvYWQgYWN0aXZpdGllcyBjb250cm9sbGVycyAobm90IGluaXRpYWxpemVkKSAqKi9cclxuICAgIGFjdGl2aXRpZXM6IHJlcXVpcmUoJy4vYXBwLmFjdGl2aXRpZXMnKSxcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgSnVzdCByZWRpcmVjdCB0aGUgYmV0dGVyIHBsYWNlIGZvciBjdXJyZW50IHVzZXIgYW5kIHN0YXRlLlxyXG4gICAgICAgIE5PVEU6IEl0cyBhIGRlbGF5ZWQgZnVuY3Rpb24sIHNpbmNlIG9uIG1hbnkgY29udGV4dHMgbmVlZCB0b1xyXG4gICAgICAgIHdhaXQgZm9yIHRoZSBjdXJyZW50ICdyb3V0aW5nJyBmcm9tIGVuZCBiZWZvcmUgZG8gdGhlIG5ld1xyXG4gICAgICAgIGhpc3RvcnkgY2hhbmdlLlxyXG4gICAgICAgIFRPRE86IE1heWJlLCByYXRoZXIgdGhhbiBkZWxheSBpdCwgY2FuIHN0b3AgY3VycmVudCByb3V0aW5nXHJcbiAgICAgICAgKGNoYW5nZXMgb24gU2hlbGwgcmVxdWlyZWQpIGFuZCBwZXJmb3JtIHRoZSBuZXcuXHJcbiAgICAgICAgVE9ETzogTWF5YmUgYWx0ZXJuYXRpdmUgdG8gcHJldmlvdXMsIHRvIHByb3ZpZGUgYSAncmVwbGFjZSdcclxuICAgICAgICBpbiBzaGVsbCByYXRoZXIgdGhhbiBhIGdvLCB0byBhdm9pZCBhcHBlbmQgcmVkaXJlY3QgZW50cmllc1xyXG4gICAgICAgIGluIHRoZSBoaXN0b3J5LCB0aGF0IGNyZWF0ZSB0aGUgcHJvYmxlbSBvZiAnYnJva2VuIGJhY2sgYnV0dG9uJ1xyXG4gICAgKiovXHJcbiAgICBnb0Rhc2hib2FyZDogZnVuY3Rpb24gZ29EYXNoYm9hcmQoKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVG8gYXZvaWQgaW5maW5pdGUgbG9vcHMgaWYgd2UgYWxyZWFkeSBhcmUgcGVyZm9ybWluZyBcclxuICAgICAgICAvLyBhIGdvRGFzaGJvYXJkIHRhc2ssIHdlIGZsYWcgdGhlIGV4ZWN1dGlvblxyXG4gICAgICAgIC8vIGJlaW5nIGNhcmUgb2YgdGhlIGRlbGF5IGludHJvZHVjZWQgaW4gdGhlIGV4ZWN1dGlvblxyXG4gICAgICAgIGlmIChnb0Rhc2hib2FyZC5fZ29pbmcgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gRGVsYXllZCB0byBhdm9pZCBjb2xsaXNpb25zIHdpdGggaW4tdGhlLW1pZGRsZVxyXG4gICAgICAgICAgICAvLyB0YXNrczoganVzdCBhbGxvd2luZyBjdXJyZW50IHJvdXRpbmcgdG8gZmluaXNoXHJcbiAgICAgICAgICAgIC8vIGJlZm9yZSBwZXJmb3JtIHRoZSAncmVkaXJlY3QnXHJcbiAgICAgICAgICAgIC8vIFRPRE86IGNoYW5nZSBieSBhIHJlYWwgcmVkaXJlY3QgdGhhdCBpcyBhYmxlIHRvXHJcbiAgICAgICAgICAgIC8vIGNhbmNlbCB0aGUgY3VycmVudCBhcHAuc2hlbGwgcm91dGluZyBwcm9jZXNzLlxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZ29EYXNoYm9hcmQuX2dvaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgb25ib2FyZGluZyA9IHRoaXMubW9kZWwudXNlcigpLm9uYm9hcmRpbmdTdGVwKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG9uYm9hcmRpbmcpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNoZWxsLmdvKCdvbmJvYXJkaW5nSG9tZS8nICsgb25ib2FyZGluZyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNoZWxsLmdvKCdob21lJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSnVzdCBiZWNhdXNlIGlzIGRlbGF5ZWQsIG5lZWRzXHJcbiAgICAgICAgICAgICAgICAvLyB0byBiZSBzZXQgb2ZmIGFmdGVyIGFuIGlubWVkaWF0ZSB0byBcclxuICAgICAgICAgICAgICAgIC8vIGVuc3VyZSBpcyBzZXQgb2ZmIGFmdGVyIGFueSBvdGhlciBhdHRlbXB0XHJcbiAgICAgICAgICAgICAgICAvLyB0byBhZGQgYSBkZWxheWVkIGdvRGFzaGJvYXJkOlxyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICBnb0Rhc2hib2FyZC5fZ29pbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0sIDEpO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcyksIDEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbi8qKiBDb250aW51ZSBhcHAgY3JlYXRpb24gd2l0aCB0aGluZ3MgdGhhdCBuZWVkIGEgcmVmZXJlbmNlIHRvIHRoZSBhcHAgKiovXHJcblxyXG5yZXF1aXJlKCcuL2FwcC1uYXZiYXInKS5leHRlbmRzKGFwcCk7XHJcblxyXG5yZXF1aXJlKCcuL2FwcC1jb21wb25lbnRzJykucmVnaXN0ZXJBbGwoKTtcclxuXHJcbmFwcC5nZXRBY3Rpdml0eSA9IGZ1bmN0aW9uIGdldEFjdGl2aXR5KG5hbWUpIHtcclxuICAgIHZhciBhY3Rpdml0eSA9IHRoaXMuYWN0aXZpdGllc1tuYW1lXTtcclxuICAgIGlmIChhY3Rpdml0eSkge1xyXG4gICAgICAgIHZhciAkYWN0ID0gdGhpcy5zaGVsbC5pdGVtcy5maW5kKG5hbWUpO1xyXG4gICAgICAgIGlmICgkYWN0ICYmICRhY3QubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm4gYWN0aXZpdHkuaW5pdCgkYWN0LCB0aGlzKTtcclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG59O1xyXG5cclxuYXBwLmdldEFjdGl2aXR5Q29udHJvbGxlckJ5Um91dGUgPSBmdW5jdGlvbiBnZXRBY3Rpdml0eUNvbnRyb2xsZXJCeVJvdXRlKHJvdXRlKSB7XHJcbiAgICAvLyBGcm9tIHRoZSByb3V0ZSBvYmplY3QsIHRoZSBpbXBvcnRhbnQgcGllY2UgaXMgcm91dGUubmFtZVxyXG4gICAgLy8gdGhhdCBjb250YWlucyB0aGUgYWN0aXZpdHkgbmFtZSBleGNlcHQgaWYgaXMgdGhlIHJvb3RcclxuICAgIHZhciBhY3ROYW1lID0gcm91dGUubmFtZSB8fCB0aGlzLnNoZWxsLmluZGV4TmFtZTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHRoaXMuZ2V0QWN0aXZpdHkoYWN0TmFtZSk7XHJcbn07XHJcblxyXG4vLyBhY2Nlc3NDb250cm9sIHNldHVwOiBjYW5ub3QgYmUgc3BlY2lmaWVkIG9uIFNoZWxsIGNyZWF0aW9uIGJlY2F1c2VcclxuLy8gZGVwZW5kcyBvbiB0aGUgYXBwIGluc3RhbmNlXHJcbmFwcC5zaGVsbC5hY2Nlc3NDb250cm9sID0gcmVxdWlyZSgnLi91dGlscy9hY2Nlc3NDb250cm9sJykoYXBwKTtcclxuXHJcbi8vIFNob3J0Y3V0IHRvIFVzZXJUeXBlIGVudW1lcmF0aW9uIHVzZWQgdG8gc2V0IHBlcm1pc3Npb25zXHJcbmFwcC5Vc2VyVHlwZSA9IGFwcC5tb2RlbC51c2VyKCkuY29uc3RydWN0b3IuVXNlclR5cGU7XHJcblxyXG4vKiogQXBwIEluaXQgKiovXHJcbnZhciBhcHBJbml0ID0gZnVuY3Rpb24gYXBwSW5pdCgpIHtcclxuICAgIC8qanNoaW50IG1heHN0YXRlbWVudHM6NTAsbWF4Y29tcGxleGl0eToxNiAqL1xyXG4gICAgXHJcbiAgICAvLyBFbmFibGluZyB0aGUgJ2xheW91dFVwZGF0ZScgalF1ZXJ5IFdpbmRvdyBldmVudCB0aGF0IGhhcHBlbnMgb24gcmVzaXplIGFuZCB0cmFuc2l0aW9uZW5kLFxyXG4gICAgLy8gYW5kIGNhbiBiZSB0cmlnZ2VyZWQgbWFudWFsbHkgYnkgYW55IHNjcmlwdCB0byBub3RpZnkgY2hhbmdlcyBvbiBsYXlvdXQgdGhhdFxyXG4gICAgLy8gbWF5IHJlcXVpcmUgYWRqdXN0bWVudHMgb24gb3RoZXIgc2NyaXB0cyB0aGF0IGxpc3RlbiB0byBpdC5cclxuICAgIC8vIFRoZSBldmVudCBpcyB0aHJvdHRsZSwgZ3VhcmFudGluZyB0aGF0IHRoZSBtaW5vciBoYW5kbGVycyBhcmUgZXhlY3V0ZWQgcmF0aGVyXHJcbiAgICAvLyB0aGFuIGEgbG90IG9mIHRoZW0gaW4gc2hvcnQgdGltZSBmcmFtZXMgKGFzIGhhcHBlbiB3aXRoICdyZXNpemUnIGV2ZW50cykuXHJcbiAgICBsYXlvdXRVcGRhdGVFdmVudC5sYXlvdXRVcGRhdGVFdmVudCArPSAnIG9yaWVudGF0aW9uY2hhbmdlJztcclxuICAgIGxheW91dFVwZGF0ZUV2ZW50Lm9uKCk7XHJcbiAgICBcclxuICAgIC8vIEtleWJvYXJkIHBsdWdpbiBldmVudHMgYXJlIG5vdCBjb21wYXRpYmxlIHdpdGggalF1ZXJ5IGV2ZW50cywgYnV0IG5lZWRlZCB0b1xyXG4gICAgLy8gdHJpZ2dlciBhIGxheW91dFVwZGF0ZSwgc28gaGVyZSBhcmUgY29ubmVjdGVkLCBtYWlubHkgZml4aW5nIGJ1Z3Mgb24gaU9TIHdoZW4gdGhlIGtleWJvYXJkXHJcbiAgICAvLyBpcyBoaWRkaW5nLlxyXG4gICAgdmFyIHRyaWdMYXlvdXQgPSBmdW5jdGlvbiB0cmlnTGF5b3V0KGV2ZW50KSB7XHJcbiAgICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ2xheW91dFVwZGF0ZScpO1xyXG4gICAgfTtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCduYXRpdmUua2V5Ym9hcmRzaG93JywgdHJpZ0xheW91dCk7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbmF0aXZlLmtleWJvYXJkaGlkZScsIHRyaWdMYXlvdXQpO1xyXG5cclxuICAgIC8vIGlPUy03KyBzdGF0dXMgYmFyIGZpeC4gQXBwbHkgb24gcGx1Z2luIGxvYWRlZCAoY29yZG92YS9waG9uZWdhcCBlbnZpcm9ubWVudClcclxuICAgIC8vIGFuZCBpbiBhbnkgc3lzdGVtLCBzbyBhbnkgb3RoZXIgc3lzdGVtcyBmaXggaXRzIHNvbHZlZCB0b28gaWYgbmVlZGVkIFxyXG4gICAgLy8ganVzdCB1cGRhdGluZyB0aGUgcGx1Z2luIChmdXR1cmUgcHJvb2YpIGFuZCBlbnN1cmUgaG9tb2dlbmVvdXMgY3Jvc3MgcGxhZnRmb3JtIGJlaGF2aW9yLlxyXG4gICAgaWYgKHdpbmRvdy5TdGF0dXNCYXIpIHtcclxuICAgICAgICAvLyBGaXggaU9TLTcrIG92ZXJsYXkgcHJvYmxlbVxyXG4gICAgICAgIC8vIElzIGluIGNvbmZpZy54bWwgdG9vLCBidXQgc2VlbXMgbm90IHRvIHdvcmsgd2l0aG91dCBuZXh0IGNhbGw6XHJcbiAgICAgICAgd2luZG93LlN0YXR1c0Jhci5vdmVybGF5c1dlYlZpZXcoZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBpT3NXZWJ2aWV3ID0gZmFsc2U7XHJcbiAgICBpZiAod2luZG93LmRldmljZSAmJiBcclxuICAgICAgICAvaU9TfGlQYWR8aVBob25lfGlQb2QvaS50ZXN0KHdpbmRvdy5kZXZpY2UucGxhdGZvcm0pKSB7XHJcbiAgICAgICAgaU9zV2VidmlldyA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIE5PVEU6IFNhZmFyaSBpT1MgYnVnIHdvcmthcm91bmQsIG1pbi1oZWlnaHQvaGVpZ2h0IG9uIGh0bWwgZG9lc24ndCB3b3JrIGFzIGV4cGVjdGVkLFxyXG4gICAgLy8gZ2V0dGluZyBiaWdnZXIgdGhhbiB2aWV3cG9ydC5cclxuICAgIHZhciBpT1MgPSAvKGlQYWR8aVBob25lfGlQb2QpL2cudGVzdCggbmF2aWdhdG9yLnVzZXJBZ2VudCApO1xyXG4gICAgaWYgKGlPUykge1xyXG4gICAgICAgIHZhciBnZXRIZWlnaHQgPSBmdW5jdGlvbiBnZXRIZWlnaHQoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbiAgICAgICAgICAgIC8vIEluIGNhc2Ugb2YgZW5hYmxlIHRyYW5zcGFyZW50L292ZXJsYXkgU3RhdHVzQmFyOlxyXG4gICAgICAgICAgICAvLyAod2luZG93LmlubmVySGVpZ2h0IC0gKGlPc1dlYnZpZXcgPyAyMCA6IDApKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgJCgnaHRtbCcpLmhlaWdodChnZXRIZWlnaHQoKSArICdweCcpOyAgICAgICAgXHJcbiAgICAgICAgJCh3aW5kb3cpLm9uKCdsYXlvdXRVcGRhdGUnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgJCgnaHRtbCcpLmhlaWdodChnZXRIZWlnaHQoKSArICdweCcpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEJlY2F1c2Ugb2YgdGhlIGlPUzcrOCBidWdzIHdpdGggaGVpZ2h0IGNhbGN1bGF0aW9uLFxyXG4gICAgLy8gYSBkaWZmZXJlbnQgd2F5IG9mIGFwcGx5IGNvbnRlbnQgaGVpZ2h0IHRvIGZpbGwgYWxsIHRoZSBhdmFpbGFibGUgaGVpZ2h0IChhcyBtaW5pbXVtKVxyXG4gICAgLy8gaXMgcmVxdWlyZWQuXHJcbiAgICAvLyBGb3IgdGhhdCwgdGhlICdmdWxsLWhlaWdodCcgY2xhc3Mgd2FzIGFkZGVkLCB0byBiZSB1c2VkIGluIGVsZW1lbnRzIGluc2lkZSB0aGUgXHJcbiAgICAvLyBhY3Rpdml0eSB0aGF0IG5lZWRzIGFsbCB0aGUgYXZhaWxhYmxlIGhlaWdodCwgaGVyZSB0aGUgY2FsY3VsYXRpb24gaXMgYXBwbGllZCBmb3JcclxuICAgIC8vIGFsbCBwbGF0Zm9ybXMgZm9yIHRoaXMgaG9tb2dlbmVvdXMgYXBwcm9hY2ggdG8gc29sdmUgdGhlIHByb2JsZW1tLlxyXG4gICAgKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciAkYiA9ICQoJ2JvZHknKTtcclxuICAgICAgICB2YXIgZnVsbEhlaWdodCA9IGZ1bmN0aW9uIGZ1bGxIZWlnaHQoKSB7XHJcbiAgICAgICAgICAgIHZhciBoID0gJGIuaGVpZ2h0KCk7XHJcbiAgICAgICAgICAgICQoJy5mdWxsLWhlaWdodCcpXHJcbiAgICAgICAgICAgIC8vIExldCBicm93c2VyIHRvIGNvbXB1dGVcclxuICAgICAgICAgICAgLmNzcygnaGVpZ2h0JywgJ2F1dG8nKVxyXG4gICAgICAgICAgICAvLyBBcyBtaW5pbXVtXHJcbiAgICAgICAgICAgIC5jc3MoJ21pbi1oZWlnaHQnLCBoKVxyXG4gICAgICAgICAgICAvLyBTZXQgZXhwbGljaXQgdGhlIGF1dG9tYXRpYyBjb21wdXRlZCBoZWlnaHRcclxuICAgICAgICAgICAgLmNzcygnaGVpZ2h0JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAvLyB3ZSB1c2UgYm94LXNpemluZzpib3JkZXItYm94LCBzbyBuZWVkcyB0byBiZSBvdXRlckhlaWdodCB3aXRob3V0IG1hcmdpbjpcclxuICAgICAgICAgICAgICAgIHJldHVybiAkKHRoaXMpLm91dGVySGVpZ2h0KGZhbHNlKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgZnVsbEhlaWdodCgpO1xyXG4gICAgICAgICQod2luZG93KS5vbignbGF5b3V0VXBkYXRlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGZ1bGxIZWlnaHQoKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pKCk7XHJcbiAgICBcclxuICAgIC8vIEZvcmNlIGFuIHVwZGF0ZSBkZWxheWVkIHRvIGVuc3VyZSB1cGRhdGUgYWZ0ZXIgc29tZSB0aGluZ3MgZGlkIGFkZGl0aW9uYWwgd29ya1xyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAkKHdpbmRvdykudHJpZ2dlcignbGF5b3V0VXBkYXRlJyk7XHJcbiAgICB9LCAyMDApO1xyXG4gICAgXHJcbiAgICAvLyBCb290c3RyYXBcclxuICAgIHByZUJvb3RzdHJhcFdvcmthcm91bmRzKCk7XHJcbiAgICByZXF1aXJlKCdib290c3RyYXAnKTtcclxuICAgIFxyXG4gICAgLy8gTG9hZCBLbm9ja291dCBiaW5kaW5nIGhlbHBlcnNcclxuICAgIGJvb3Rrbm9jay5wbHVnSW4oa28pO1xyXG4gICAgXHJcbiAgICAvLyBQbHVnaW5zIHNldHVwXHJcbiAgICBpZiAod2luZG93LmNvcmRvdmEgJiYgd2luZG93LmNvcmRvdmEucGx1Z2lucyAmJiB3aW5kb3cuY29yZG92YS5wbHVnaW5zLktleWJvYXJkKSB7XHJcbiAgICAgICAgd2luZG93LmNvcmRvdmEucGx1Z2lucy5LZXlib2FyZC5kaXNhYmxlU2Nyb2xsKHRydWUpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBFYXN5IGxpbmtzIHRvIHNoZWxsIGFjdGlvbnMsIGxpa2UgZ29CYWNrLCBpbiBodG1sIGVsZW1lbnRzXHJcbiAgICAvLyBFeGFtcGxlOiA8YnV0dG9uIGRhdGEtc2hlbGw9XCJnb0JhY2sgMlwiPkdvIDIgdGltZXMgYmFjazwvYnV0dG9uPlxyXG4gICAgLy8gTk9URTogSW1wb3J0YW50LCByZWdpc3RlcmVkIGJlZm9yZSB0aGUgc2hlbGwucnVuIHRvIGJlIGV4ZWN1dGVkXHJcbiAgICAvLyBiZWZvcmUgaXRzICdjYXRjaCBhbGwgbGlua3MnIGhhbmRsZXJcclxuICAgICQoZG9jdW1lbnQpLm9uKCd0YXAnLCAnW2RhdGEtc2hlbGxdJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIC8vIFVzaW5nIGF0dHIgcmF0aGVyIHRoYW4gdGhlICdkYXRhJyBBUEkgdG8gZ2V0IHVwZGF0ZWRcclxuICAgICAgICAvLyBET00gdmFsdWVzXHJcbiAgICAgICAgdmFyIGNtZGxpbmUgPSAkKHRoaXMpLmF0dHIoJ2RhdGEtc2hlbGwnKSB8fCAnJyxcclxuICAgICAgICAgICAgYXJncyA9IGNtZGxpbmUuc3BsaXQoJyAnKSxcclxuICAgICAgICAgICAgY21kID0gYXJnc1swXTtcclxuXHJcbiAgICAgICAgaWYgKGNtZCAmJiB0eXBlb2YoYXBwLnNoZWxsW2NtZF0pID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIGFwcC5zaGVsbFtjbWRdLmFwcGx5KGFwcC5zaGVsbCwgYXJncy5zbGljZSgxKSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBDYW5jZWwgYW55IG90aGVyIGFjdGlvbiBvbiB0aGUgbGluaywgdG8gYXZvaWQgZG91YmxlIGxpbmtpbmcgcmVzdWx0c1xyXG4gICAgICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIE9uIENvcmRvdmEvUGhvbmVnYXAgYXBwLCBzcGVjaWFsIHRhcmdldHMgbXVzdCBiZSBjYWxsZWQgdXNpbmcgdGhlIHdpbmRvdy5vcGVuXHJcbiAgICAvLyBBUEkgdG8gZW5zdXJlIGlzIGNvcnJlY3RseSBvcGVuZWQgb24gdGhlIEluQXBwQnJvd3NlciAoX2JsYW5rKSBvciBzeXN0ZW0gZGVmYXVsdFxyXG4gICAgLy8gYnJvd3NlciAoX3N5c3RlbSkuXHJcbiAgICBpZiAod2luZG93LmNvcmRvdmEpIHtcclxuICAgICAgICAkKGRvY3VtZW50KS5vbigndGFwJywgJ1t0YXJnZXQ9XCJfYmxhbmtcIl0sIFt0YXJnZXQ9XCJfc3lzdGVtXCJdJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICB3aW5kb3cub3Blbih0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpLCB0aGlzLmdldEF0dHJpYnV0ZSgndGFyZ2V0JykpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFdoZW4gYW4gYWN0aXZpdHkgaXMgcmVhZHkgaW4gdGhlIFNoZWxsOlxyXG4gICAgYXBwLnNoZWxsLm9uKGFwcC5zaGVsbC5ldmVudHMuaXRlbVJlYWR5LCBmdW5jdGlvbigkYWN0LCBzdGF0ZSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIENvbm5lY3QgdGhlICdhY3Rpdml0aWVzJyBjb250cm9sbGVycyB0byB0aGVpciB2aWV3c1xyXG4gICAgICAgIC8vIEdldCBpbml0aWFsaXplZCBhY3Rpdml0eSBmb3IgdGhlIERPTSBlbGVtZW50XHJcbiAgICAgICAgdmFyIGFjdE5hbWUgPSAkYWN0LmRhdGEoJ2FjdGl2aXR5Jyk7XHJcbiAgICAgICAgdmFyIGFjdGl2aXR5ID0gYXBwLmdldEFjdGl2aXR5KGFjdE5hbWUpO1xyXG4gICAgICAgIC8vIFRyaWdnZXIgdGhlICdzaG93JyBsb2dpYyBvZiB0aGUgYWN0aXZpdHkgY29udHJvbGxlcjpcclxuICAgICAgICBhY3Rpdml0eS5zaG93KHN0YXRlKTtcclxuXHJcbiAgICAgICAgLy8gVXBkYXRlIG1lbnVcclxuICAgICAgICB2YXIgbWVudUl0ZW0gPSBhY3Rpdml0eS5tZW51SXRlbSB8fCBhY3ROYW1lO1xyXG4gICAgICAgIGFwcC51cGRhdGVNZW51KG1lbnVJdGVtKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBVcGRhdGUgYXBwIG5hdmlnYXRpb25cclxuICAgICAgICBhcHAudXBkYXRlQXBwTmF2KGFjdGl2aXR5KTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBTZXQgbW9kZWwgZm9yIHRoZSBBcHBOYXZcclxuICAgIGtvLmFwcGx5QmluZGluZ3Moe1xyXG4gICAgICAgIG5hdkJhcjogYXBwLm5hdkJhclxyXG4gICAgfSwgJCgnLkFwcE5hdicpLmdldCgwKSk7XHJcbiAgICBcclxuICAgIHZhciBTbWFydE5hdkJhciA9IHJlcXVpcmUoJy4vY29tcG9uZW50cy9TbWFydE5hdkJhcicpO1xyXG4gICAgdmFyIG5hdkJhcnMgPSBTbWFydE5hdkJhci5nZXRBbGwoKTtcclxuICAgIC8vIENyZWF0ZXMgYW4gZXZlbnQgYnkgbGlzdGVuaW5nIHRvIGl0LCBzbyBvdGhlciBzY3JpcHRzIGNhbiB0cmlnZ2VyXHJcbiAgICAvLyBhICdjb250ZW50Q2hhbmdlJyBldmVudCB0byBmb3JjZSBhIHJlZnJlc2ggb2YgdGhlIG5hdmJhciAodG8gXHJcbiAgICAvLyBjYWxjdWxhdGUgYW5kIGFwcGx5IGEgbmV3IHNpemUpOyBleHBlY3RlZCBmcm9tIGR5bmFtaWMgbmF2YmFyc1xyXG4gICAgLy8gdGhhdCBjaGFuZ2UgaXQgY29udGVudCBiYXNlZCBvbiBvYnNlcnZhYmxlcy5cclxuICAgIG5hdkJhcnMuZm9yRWFjaChmdW5jdGlvbihuYXZiYXIpIHtcclxuICAgICAgICAkKG5hdmJhci5lbCkub24oJ2NvbnRlbnRDaGFuZ2UnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgbmF2YmFyLnJlZnJlc2goKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBMaXN0ZW4gZm9yIG1lbnUgZXZlbnRzIChjb2xsYXBzZSBpbiBTbWFydE5hdkJhcilcclxuICAgIC8vIHRvIGFwcGx5IHRoZSBiYWNrZHJvcFxyXG4gICAgdmFyIHRvZ2dsaW5nQmFja2Ryb3AgPSBmYWxzZTtcclxuICAgICQoZG9jdW1lbnQpLm9uKCdzaG93LmJzLmNvbGxhcHNlIGhpZGUuYnMuY29sbGFwc2UnLCAnLkFwcE5hdiAubmF2YmFyLWNvbGxhcHNlJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGlmICghdG9nZ2xpbmdCYWNrZHJvcCkge1xyXG4gICAgICAgICAgICB0b2dnbGluZ0JhY2tkcm9wID0gdHJ1ZTtcclxuICAgICAgICAgICAgdmFyIGVuYWJsZWQgPSBlLnR5cGUgPT09ICdzaG93JztcclxuICAgICAgICAgICAgJCgnYm9keScpLnRvZ2dsZUNsYXNzKCd1c2UtYmFja2Ryb3AnLCBlbmFibGVkKTtcclxuICAgICAgICAgICAgLy8gSGlkZSBhbnkgb3RoZXIgb3BlbmVkIGNvbGxhcHNlXHJcbiAgICAgICAgICAgICQoJy5jb2xsYXBzaW5nLCAuY29sbGFwc2UuaW4nKS5jb2xsYXBzZSgnaGlkZScpO1xyXG4gICAgICAgICAgICB0b2dnbGluZ0JhY2tkcm9wID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQXBwIGluaXQ6XHJcbiAgICB2YXIgYWxlcnRFcnJvciA9IGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgIHdpbmRvdy5hbGVydCgnVGhlcmUgd2FzIGFuIGVycm9yIGxvYWRpbmc6ICcgKyBlcnIgJiYgZXJyLm1lc3NhZ2UgfHwgZXJyKTtcclxuICAgIH07XHJcblxyXG4gICAgYXBwLm1vZGVsLmluaXQoKVxyXG4gICAgLnRoZW4oYXBwLnNoZWxsLnJ1bi5iaW5kKGFwcC5zaGVsbCksIGFsZXJ0RXJyb3IpXHJcbiAgICAudGhlbihmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBNYXJrIHRoZSBwYWdlIGFzIHJlYWR5XHJcbiAgICAgICAgJCgnaHRtbCcpLmFkZENsYXNzKCdpcy1yZWFkeScpO1xyXG4gICAgICAgIC8vIEFzIGFwcCwgaGlkZXMgc3BsYXNoIHNjcmVlblxyXG4gICAgICAgIGlmICh3aW5kb3cubmF2aWdhdG9yICYmIHdpbmRvdy5uYXZpZ2F0b3Iuc3BsYXNoc2NyZWVuKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5uYXZpZ2F0b3Iuc3BsYXNoc2NyZWVuLmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9LCBhbGVydEVycm9yKTtcclxuXHJcbiAgICAvLyBERUJVR1xyXG4gICAgd2luZG93LmFwcCA9IGFwcDtcclxufTtcclxuXHJcbi8vIEFwcCBpbml0IG9uIHBhZ2UgcmVhZHkgYW5kIHBob25lZ2FwIHJlYWR5XHJcbmlmICh3aW5kb3cuY29yZG92YSkge1xyXG4gICAgLy8gT24gRE9NLVJlYWR5IGZpcnN0XHJcbiAgICAkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIFBhZ2UgaXMgcmVhZHksIGRldmljZSBpcyB0b28/XHJcbiAgICAgICAgLy8gTm90ZTogQ29yZG92YSBlbnN1cmVzIHRvIGNhbGwgdGhlIGhhbmRsZXIgZXZlbiBpZiB0aGVcclxuICAgICAgICAvLyBldmVudCB3YXMgYWxyZWFkeSBmaXJlZCwgc28gaXMgZ29vZCB0byBkbyBpdCBpbnNpZGVcclxuICAgICAgICAvLyB0aGUgZG9tLXJlYWR5IGFuZCB3ZSBhcmUgZW5zdXJpbmcgdGhhdCBldmVyeXRoaW5nIGlzXHJcbiAgICAgICAgLy8gcmVhZHkuXHJcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2RldmljZXJlYWR5JywgYXBwSW5pdCk7XHJcbiAgICB9KTtcclxufSBlbHNlIHtcclxuICAgIC8vIE9ubHkgb24gRE9NLVJlYWR5LCBmb3IgaW4gYnJvd3NlciBkZXZlbG9wbWVudFxyXG4gICAgJChhcHBJbml0KTtcclxufSIsIi8qKlxyXG4gICAgU2V0dXAgb2YgdGhlIHNoZWxsIG9iamVjdCB1c2VkIGJ5IHRoZSBhcHBcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBiYXNlVXJsID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xyXG5cclxuLy92YXIgSGlzdG9yeSA9IHJlcXVpcmUoJy4vYXBwLXNoZWxsLWhpc3RvcnknKS5jcmVhdGUoYmFzZVVybCk7XHJcbnZhciBIaXN0b3J5ID0gcmVxdWlyZSgnLi91dGlscy9zaGVsbC9oYXNoYmFuZ0hpc3RvcnknKTtcclxuXHJcbi8vIFNoZWxsIGRlcGVuZGVuY2llc1xyXG52YXIgc2hlbGwgPSByZXF1aXJlKCcuL3V0aWxzL3NoZWxsL2luZGV4JyksXHJcbiAgICBTaGVsbCA9IHNoZWxsLlNoZWxsLFxyXG4gICAgRG9tSXRlbXNNYW5hZ2VyID0gc2hlbGwuRG9tSXRlbXNNYW5hZ2VyO1xyXG5cclxudmFyIGlPUyA9IC8oaVBhZHxpUGhvbmV8aVBvZCkvZy50ZXN0KCBuYXZpZ2F0b3IudXNlckFnZW50ICk7XHJcblxyXG4vLyBDcmVhdGluZyB0aGUgc2hlbGw6XHJcbnZhciBzaGVsbCA9IG5ldyBTaGVsbCh7XHJcblxyXG4gICAgLy8gU2VsZWN0b3IsIERPTSBlbGVtZW50IG9yIGpRdWVyeSBvYmplY3QgcG9pbnRpbmdcclxuICAgIC8vIHRoZSByb290IG9yIGNvbnRhaW5lciBmb3IgdGhlIHNoZWxsIGl0ZW1zXHJcbiAgICByb290OiAnYm9keScsXHJcblxyXG4gICAgLy8gSWYgaXMgbm90IGluIHRoZSBzaXRlIHJvb3QsIHRoZSBiYXNlIFVSTCBpcyByZXF1aXJlZDpcclxuICAgIGJhc2VVcmw6IGJhc2VVcmwsXHJcbiAgICBcclxuICAgIGZvcmNlSGFzaGJhbmc6IHRydWUsXHJcblxyXG4gICAgaW5kZXhOYW1lOiAnaW5kZXgnLFxyXG5cclxuICAgIC8vIFdPUktBUk9VTkQ6IFVzaW5nIHRoZSAndGFwJyBldmVudCBmb3IgZmFzdGVyIG1vYmlsZSBleHBlcmllbmNlXHJcbiAgICAvLyAoZnJvbSBqcXVlcnktbW9iaWxlIGV2ZW50KSBvbiBpT1MgZGV2aWNlcywgYnV0IGxlZnRcclxuICAgIC8vICdjbGljaycgb24gb3RoZXJzIHNpbmNlIHRoZXkgaGFzIG5vdCB0aGUgc2xvdy1jbGljayBwcm9ibGVtXHJcbiAgICAvLyB0aGFua3MgdG8gdGhlIG1ldGEtdmlld3BvcnQuXHJcbiAgICAvLyBXT1JLQVJPVU5EOiBJTVBPUlRBTlQsIHVzaW5nICdjbGljaycgcmF0aGVyIHRoYW4gJ3RhcCcgb24gQW5kcm9pZFxyXG4gICAgLy8gcHJldmVudHMgYW4gYXBwIGNyYXNoIChvciBnbyBvdXQgYW5kIHBhZ2Ugbm90IGZvdW5kIG9uIENocm9tZSBmb3IgQW5kcm9pZClcclxuICAgIC8vIGJlY2F1c2Ugb2Ygc29tZSAnY2xpY2tzJyBoYXBwZW5pbmcgb25cclxuICAgIC8vIGEgaGFsZi1saW5rLWVsZW1lbnQgdGFwLCB3aGVyZSB0aGUgJ3RhcCcgZXZlbnQgZGV0ZWN0cyBhcyB0YXJnZXQgdGhlIG5vbi1saW5rIGFuZCB0aGVcclxuICAgIC8vIGxpbmsgZ2V0cyBleGVjdXRlZCBhbnl3YXkgYnkgdGhlIGJyb3dzZXIsIG5vdCBjYXRjaGVkIHNvIFdlYnZpZXcgbW92ZXMgdG8gXHJcbiAgICAvLyBhIG5vbiBleGlzdGFudCBmaWxlIChhbmQgdGhhdHMgbWFrZSBQaG9uZUdhcCB0byBjcmFzaCkuXHJcbiAgICBsaW5rRXZlbnQ6IGlPUyA/ICd0YXAnIDogJ2NsaWNrJyxcclxuXHJcbiAgICAvLyBObyBuZWVkIGZvciBsb2FkZXIsIGV2ZXJ5dGhpbmcgY29tZXMgYnVuZGxlZFxyXG4gICAgbG9hZGVyOiBudWxsLFxyXG5cclxuICAgIC8vIEhpc3RvcnkgUG9seWZpbGw6XHJcbiAgICBoaXN0b3J5OiBIaXN0b3J5LFxyXG5cclxuICAgIC8vIEEgRG9tSXRlbXNNYW5hZ2VyIG9yIGVxdWl2YWxlbnQgb2JqZWN0IGluc3RhbmNlIG5lZWRzIHRvXHJcbiAgICAvLyBiZSBwcm92aWRlZDpcclxuICAgIGRvbUl0ZW1zTWFuYWdlcjogbmV3IERvbUl0ZW1zTWFuYWdlcih7XHJcbiAgICAgICAgaWRBdHRyaWJ1dGVOYW1lOiAnZGF0YS1hY3Rpdml0eSdcclxuICAgIH0pXHJcbn0pO1xyXG5cclxuLy8gQ2F0Y2ggZXJyb3JzIG9uIGl0ZW0vcGFnZSBsb2FkaW5nLCBzaG93aW5nLi5cclxuc2hlbGwub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyKSB7XHJcbiAgICBcclxuICAgIHZhciBzdHIgPSAnVW5rbm93IGVycm9yJztcclxuICAgIGlmIChlcnIpIHtcclxuICAgICAgICBpZiAodHlwZW9mKGVycikgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHN0ciA9IGVycjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoZXJyLm1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgc3RyID0gZXJyLm1lc3NhZ2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBzdHIgPSBKU09OLnN0cmluZ2lmeShlcnIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBUT0RPIGNoYW5nZSB3aXRoIGEgZGlhbG9nIG9yIHNvbWV0aGluZ1xyXG4gICAgd2luZG93LmFsZXJ0KHN0cik7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzaGVsbDtcclxuIiwiLyoqXHJcbiAgICBBY3Rpdml0eSBiYXNlIGNsYXNzXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKSxcclxuICAgIE5hdkJhciA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QmFyJyk7XHJcblxyXG5yZXF1aXJlKCcuLi91dGlscy9GdW5jdGlvbi5wcm90b3R5cGUuX2luaGVyaXRzJyk7XHJcblxyXG4vKipcclxuICAgIEFjdGl2aXR5IGNsYXNzIGRlZmluaXRpb25cclxuKiovXHJcbmZ1bmN0aW9uIEFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuXHJcbiAgICAvLyBEZWZhdWx0IGFjY2VzcyBsZXZlbDogYW55b25lXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLk5vbmU7XHJcbiAgICBcclxuICAgIC8vIFRPRE86IEZ1dHVyZSB1c2Ugb2YgYSB2aWV3U3RhdGUsIHBsYWluIG9iamVjdCByZXByZXNlbnRhdGlvblxyXG4gICAgLy8gb2YgcGFydCBvZiB0aGUgdmlld01vZGVsIHRvIGJlIHVzZWQgYXMgdGhlIHN0YXRlIHBhc3NlZCB0byB0aGVcclxuICAgIC8vIGhpc3RvcnkgYW5kIGJldHdlZW4gYWN0aXZpdGllcyBjYWxscy5cclxuICAgIHRoaXMudmlld1N0YXRlID0ge307XHJcbiAgICBcclxuICAgIC8vIE9iamVjdCB0byBob2xkIHRoZSBvcHRpb25zIHBhc3NlZCBvbiAnc2hvdycgYXMgYSByZXN1bHRcclxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcclxuICAgIHRoaXMucmVxdWVzdERhdGEgPSBudWxsO1xyXG5cclxuICAgIC8vIERlZmF1bHQgbmF2QmFyIG9iamVjdC5cclxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XHJcbiAgICAgICAgdGl0bGU6IG51bGwsIC8vIG51bGwgZm9yIGxvZ29cclxuICAgICAgICBsZWZ0QWN0aW9uOiBudWxsLFxyXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBudWxsXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gRGVsYXllZCBiaW5kaW5ncyB0byBhbGxvdyBmb3IgZnVydGhlciBjb25zdHJ1Y3RvciBzZXQtdXAgXHJcbiAgICAvLyBvbiBzdWJjbGFzc2VzLlxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiBBY3Rpdml0eUNvbnN0cnVjdG9yRGVsYXllZCgpIHtcclxuICAgICAgICAvLyBBIHZpZXcgbW9kZWwgYW5kIGJpbmRpbmdzIGJlaW5nIGFwcGxpZWQgaXMgZXZlciByZXF1aXJlZFxyXG4gICAgICAgIC8vIGV2ZW4gb24gQWN0aXZpdGllcyB3aXRob3V0IG5lZWQgZm9yIGEgdmlldyBtb2RlbCwgc2luY2VcclxuICAgICAgICAvLyB0aGUgdXNlIG9mIGNvbXBvbmVudHMgYW5kIHRlbXBsYXRlcywgb3IgYW55IG90aGVyIGRhdGEtYmluZFxyXG4gICAgICAgIC8vIHN5bnRheCwgcmVxdWlyZXMgdG8gYmUgaW4gYSBjb250ZXh0IHdpdGggYmluZGluZyBlbmFibGVkOlxyXG4gICAgICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy52aWV3TW9kZWwgfHwge30sICRhY3Rpdml0eS5nZXQoMCkpO1xyXG4gICAgfS5iaW5kKHRoaXMpLCAxKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBY3Rpdml0eTtcclxuXHJcbi8qKlxyXG4gICAgU2V0LXVwIHZpc3VhbGl6YXRpb24gb2YgdGhlIHZpZXcgd2l0aCB0aGUgZ2l2ZW4gb3B0aW9ucy9zdGF0ZSxcclxuICAgIHdpdGggYSByZXNldCBvZiBjdXJyZW50IHN0YXRlLlxyXG4gICAgTXVzdCBiZSBleGVjdXRlZCBldmVyeSB0aW1lIHRoZSBhY3Rpdml0eSBpcyBwdXQgaW4gdGhlIGN1cnJlbnQgdmlldy5cclxuKiovXHJcbkFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcbiAgICAvLyBUT0RPOiBtdXN0IGtlZXAgdmlld1N0YXRlIHVwIHRvIGRhdGUgdXNpbmcgb3B0aW9ucy9zdGF0ZS5cclxuICAgIFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICB0aGlzLnJlcXVlc3REYXRhID0gb3B0aW9ucztcclxufTtcclxuXHJcbi8qKlxyXG4gICAgU3RhdGljIHV0aWxpdGllc1xyXG4qKi9cclxuLy8gRm9yIGNvbW1vZGl0eSwgY29tbW9uIGNsYXNzZXMgYXJlIGV4cG9zZWQgYXMgc3RhdGljIHByb3BlcnRpZXNcclxuQWN0aXZpdHkuTmF2QmFyID0gTmF2QmFyO1xyXG5BY3Rpdml0eS5OYXZBY3Rpb24gPSBOYXZBY3Rpb247XHJcblxyXG4vLyBRdWljayBjcmVhdGlvbiBvZiBjb21tb24gdHlwZXMgb2YgTmF2QmFyXHJcbkFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIgPSBmdW5jdGlvbiBjcmVhdGVTZWN0aW9uTmF2QmFyKHRpdGxlKSB7XHJcbiAgICByZXR1cm4gbmV3IE5hdkJhcih7XHJcbiAgICAgICAgdGl0bGU6IHRpdGxlLFxyXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5tZW51TmV3SXRlbSxcclxuICAgICAgICByaWdodEFjdGlvbjogTmF2QWN0aW9uLm1lbnVJblxyXG4gICAgfSk7XHJcbn07XHJcblxyXG5BY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyID0gZnVuY3Rpb24gY3JlYXRlU3Vic2VjdGlvbk5hdkJhcih0aXRsZSwgb3B0aW9ucykge1xyXG4gICAgXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIFxyXG4gICAgdmFyIGdvQmFja09wdGlvbnMgPSB7XHJcbiAgICAgICAgdGV4dDogdGl0bGUsXHJcbiAgICAgICAgaXNUaXRsZTogdHJ1ZVxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5iYWNrTGluaykge1xyXG4gICAgICAgIGdvQmFja09wdGlvbnMubGluayA9IG9wdGlvbnMuYmFja0xpbms7XHJcbiAgICAgICAgZ29CYWNrT3B0aW9ucy5pc1NoZWxsID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBOYXZCYXIoe1xyXG4gICAgICAgIHRpdGxlOiAnJywgLy8gTm8gdGl0bGVcclxuICAgICAgICBsZWZ0QWN0aW9uOiBOYXZBY3Rpb24uZ29CYWNrLm1vZGVsLmNsb25lKGdvQmFja09wdGlvbnMpLFxyXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBvcHRpb25zLmhlbHBJZCA/XHJcbiAgICAgICAgICAgIE5hdkFjdGlvbi5nb0hlbHBJbmRleCA6XHJcbiAgICAgICAgICAgIE5hdkFjdGlvbi5nb0hlbHBJbmRleC5tb2RlbC5jbG9uZSh7XHJcbiAgICAgICAgICAgICAgICBsaW5rOiAnIycgKyBvcHRpb25zLmhlbHBJZFxyXG4gICAgICAgICAgICB9KVxyXG4gICAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIFNpbmdsZXRvbiBoZWxwZXJcclxuKiovXHJcbnZhciBjcmVhdGVTaW5nbGV0b24gPSBmdW5jdGlvbiBjcmVhdGVTaW5nbGV0b24oQWN0aXZpdHlDbGFzcywgJGFjdGl2aXR5LCBhcHApIHtcclxuICAgIFxyXG4gICAgY3JlYXRlU2luZ2xldG9uLmluc3RhbmNlcyA9IGNyZWF0ZVNpbmdsZXRvbi5pbnN0YW5jZXMgfHwge307XHJcbiAgICBcclxuICAgIGlmIChjcmVhdGVTaW5nbGV0b24uaW5zdGFuY2VzW0FjdGl2aXR5Q2xhc3MubmFtZV0gaW5zdGFuY2VvZiBBY3Rpdml0eUNsYXNzKSB7XHJcbiAgICAgICAgcmV0dXJuIGNyZWF0ZVNpbmdsZXRvbi5pbnN0YW5jZXNbQWN0aXZpdHlDbGFzcy5uYW1lXTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHZhciBzID0gbmV3IEFjdGl2aXR5Q2xhc3MoJGFjdGl2aXR5LCBhcHApO1xyXG4gICAgICAgIGNyZWF0ZVNpbmdsZXRvbi5pbnN0YW5jZXNbQWN0aXZpdHlDbGFzcy5uYW1lXSA9IHM7XHJcbiAgICAgICAgcmV0dXJuIHM7XHJcbiAgICB9XHJcbn07XHJcbi8vIEV4YW1wbGUgb2YgdXNlXHJcbi8vZXhwb3J0cy5pbml0ID0gY3JlYXRlU2luZ2xldG9uLmJpbmQobnVsbCwgQWN0aXZpdHlDbGFzcyk7XHJcblxyXG4vKipcclxuICAgIFN0YXRpYyBtZXRob2QgZXh0ZW5kcyB0byBoZWxwIGluaGVyaXRhbmNlLlxyXG4gICAgQWRkaXRpb25hbGx5LCBpdCBhZGRzIGEgc3RhdGljIGluaXQgbWV0aG9kIHJlYWR5IGZvciB0aGUgbmV3IGNsYXNzXHJcbiAgICB0aGF0IGdlbmVyYXRlcy9yZXRyaWV2ZXMgdGhlIHNpbmdsZXRvbi5cclxuKiovXHJcbkFjdGl2aXR5LmV4dGVuZHMgPSBmdW5jdGlvbiBleHRlbmRzQWN0aXZpdHkoQ2xhc3NGbikge1xyXG4gICAgXHJcbiAgICBDbGFzc0ZuLl9pbmhlcml0cyhBY3Rpdml0eSk7XHJcbiAgICBcclxuICAgIENsYXNzRm4uaW5pdCA9IGNyZWF0ZVNpbmdsZXRvbi5iaW5kKG51bGwsIENsYXNzRm4pO1xyXG4gICAgXHJcbiAgICByZXR1cm4gQ2xhc3NGbjtcclxufTtcclxuIiwiLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAqIERhdGVQaWNrZXIgSlMgQ29tcG9uZW50LCB3aXRoIHNldmVyYWxcclxuICogbW9kZXMgYW5kIG9wdGlvbmFsIGlubGluZS1wZXJtYW5lbnQgdmlzdWFsaXphdGlvbi5cclxuICpcclxuICogQ29weXJpZ2h0IDIwMTQgTG9jb25vbWljcyBDb29wLlxyXG4gKlxyXG4gKiBCYXNlZCBvbjpcclxuICogYm9vdHN0cmFwLWRhdGVwaWNrZXIuanMgXHJcbiAqIGh0dHA6Ly93d3cuZXllY29uLnJvL2Jvb3RzdHJhcC1kYXRlcGlja2VyXHJcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gKiBDb3B5cmlnaHQgMjAxMiBTdGVmYW4gUGV0cmVcclxuICpcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcclxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxyXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcclxuICpcclxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXHJcbiAqXHJcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcclxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxyXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cclxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxyXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cclxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpOyBcclxuXHJcbnZhciBjbGFzc2VzID0ge1xyXG4gICAgY29tcG9uZW50OiAnRGF0ZVBpY2tlcicsXHJcbiAgICBtb250aHM6ICdEYXRlUGlja2VyLW1vbnRocycsXHJcbiAgICBkYXlzOiAnRGF0ZVBpY2tlci1kYXlzJyxcclxuICAgIG1vbnRoRGF5OiAnZGF5JyxcclxuICAgIG1vbnRoOiAnbW9udGgnLFxyXG4gICAgeWVhcjogJ3llYXInLFxyXG4gICAgeWVhcnM6ICdEYXRlUGlja2VyLXllYXJzJ1xyXG59O1xyXG5cclxuLy8gUGlja2VyIG9iamVjdFxyXG52YXIgRGF0ZVBpY2tlciA9IGZ1bmN0aW9uKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIC8qanNoaW50IG1heHN0YXRlbWVudHM6MzIsbWF4Y29tcGxleGl0eToyNCovXHJcbiAgICB0aGlzLmVsZW1lbnQgPSAkKGVsZW1lbnQpO1xyXG4gICAgdGhpcy5mb3JtYXQgPSBEUEdsb2JhbC5wYXJzZUZvcm1hdChvcHRpb25zLmZvcm1hdHx8dGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtZm9ybWF0Jyl8fCdtbS9kZC95eXl5Jyk7XHJcbiAgICBcclxuICAgIHRoaXMuaXNJbnB1dCA9IHRoaXMuZWxlbWVudC5pcygnaW5wdXQnKTtcclxuICAgIHRoaXMuY29tcG9uZW50ID0gdGhpcy5lbGVtZW50LmlzKCcuZGF0ZScpID8gdGhpcy5lbGVtZW50LmZpbmQoJy5hZGQtb24nKSA6IGZhbHNlO1xyXG4gICAgdGhpcy5pc1BsYWNlaG9sZGVyID0gdGhpcy5lbGVtZW50LmlzKCcuY2FsZW5kYXItcGxhY2Vob2xkZXInKTtcclxuICAgIFxyXG4gICAgdGhpcy5waWNrZXIgPSAkKERQR2xvYmFsLnRlbXBsYXRlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kVG8odGhpcy5pc1BsYWNlaG9sZGVyID8gdGhpcy5lbGVtZW50IDogJ2JvZHknKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAub24oJ2NsaWNrIHRhcCcsICQucHJveHkodGhpcy5jbGljaywgdGhpcykpO1xyXG4gICAgLy8gVE9ETzogdG8gcmV2aWV3IGlmICdjb250YWluZXInIGNsYXNzIGNhbiBiZSBhdm9pZGVkLCBzbyBpbiBwbGFjZWhvbGRlciBtb2RlIGdldHMgb3B0aW9uYWxcclxuICAgIC8vIGlmIGlzIHdhbnRlZCBjYW4gYmUgcGxhY2VkIG9uIHRoZSBwbGFjZWhvbGRlciBlbGVtZW50IChvciBjb250YWluZXItZmx1aWQgb3Igbm90aGluZylcclxuICAgIHRoaXMucGlja2VyLmFkZENsYXNzKHRoaXMuaXNQbGFjZWhvbGRlciA/ICdjb250YWluZXInIDogJ2Ryb3Bkb3duLW1lbnUnKTtcclxuICAgIFxyXG4gICAgaWYgKHRoaXMuaXNQbGFjZWhvbGRlcikge1xyXG4gICAgICAgIHRoaXMucGlja2VyLnNob3coKTtcclxuICAgICAgICBpZiAodGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUnKSA9PSAndG9kYXknKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcclxuICAgICAgICAgICAgdHlwZTogJ3Nob3cnLFxyXG4gICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGVcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHRoaXMuaXNJbnB1dCkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5vbih7XHJcbiAgICAgICAgICAgIGZvY3VzOiAkLnByb3h5KHRoaXMuc2hvdywgdGhpcyksXHJcbiAgICAgICAgICAgIC8vYmx1cjogJC5wcm94eSh0aGlzLmhpZGUsIHRoaXMpLFxyXG4gICAgICAgICAgICBrZXl1cDogJC5wcm94eSh0aGlzLnVwZGF0ZSwgdGhpcylcclxuICAgICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKHRoaXMuY29tcG9uZW50KXtcclxuICAgICAgICAgICAgdGhpcy5jb21wb25lbnQub24oJ2NsaWNrIHRhcCcsICQucHJveHkodGhpcy5zaG93LCB0aGlzKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lm9uKCdjbGljayB0YXAnLCAkLnByb3h5KHRoaXMuc2hvdywgdGhpcykpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLyogVG91Y2ggZXZlbnRzIHRvIHN3aXBlIGRhdGVzICovXHJcbiAgICB0aGlzLmVsZW1lbnRcclxuICAgIC5vbignc3dpcGVsZWZ0JywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB0aGlzLm1vdmVEYXRlKCduZXh0Jyk7XHJcbiAgICB9LmJpbmQodGhpcykpXHJcbiAgICAub24oJ3N3aXBlcmlnaHQnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHRoaXMubW92ZURhdGUoJ3ByZXYnKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgLyogU2V0LXVwIHZpZXcgbW9kZSAqL1xyXG4gICAgdGhpcy5taW5WaWV3TW9kZSA9IG9wdGlvbnMubWluVmlld01vZGV8fHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLW1pbnZpZXdtb2RlJyl8fDA7XHJcbiAgICBpZiAodHlwZW9mIHRoaXMubWluVmlld01vZGUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgc3dpdGNoICh0aGlzLm1pblZpZXdNb2RlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ21vbnRocyc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pblZpZXdNb2RlID0gMTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICd5ZWFycyc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pblZpZXdNb2RlID0gMjtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5WaWV3TW9kZSA9IDA7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnZpZXdNb2RlID0gb3B0aW9ucy52aWV3TW9kZXx8dGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtdmlld21vZGUnKXx8MDtcclxuICAgIGlmICh0eXBlb2YgdGhpcy52aWV3TW9kZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICBzd2l0Y2ggKHRoaXMudmlld01vZGUpIHtcclxuICAgICAgICAgICAgY2FzZSAnbW9udGhzJzpcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGUgPSAxO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ3llYXJzJzpcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGUgPSAyO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlID0gMDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuc3RhcnRWaWV3TW9kZSA9IHRoaXMudmlld01vZGU7XHJcbiAgICB0aGlzLndlZWtTdGFydCA9IG9wdGlvbnMud2Vla1N0YXJ0fHx0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS13ZWVrc3RhcnQnKXx8MDtcclxuICAgIHRoaXMud2Vla0VuZCA9IHRoaXMud2Vla1N0YXJ0ID09PSAwID8gNiA6IHRoaXMud2Vla1N0YXJ0IC0gMTtcclxuICAgIHRoaXMub25SZW5kZXIgPSBvcHRpb25zLm9uUmVuZGVyO1xyXG4gICAgdGhpcy5maWxsRG93KCk7XHJcbiAgICB0aGlzLmZpbGxNb250aHMoKTtcclxuICAgIHRoaXMudXBkYXRlKCk7XHJcbiAgICB0aGlzLnNob3dNb2RlKCk7XHJcbn07XHJcblxyXG5EYXRlUGlja2VyLnByb3RvdHlwZSA9IHtcclxuICAgIGNvbnN0cnVjdG9yOiBEYXRlUGlja2VyLFxyXG4gICAgXHJcbiAgICBzaG93OiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuc2hvdygpO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5jb21wb25lbnQgPyB0aGlzLmNvbXBvbmVudC5vdXRlckhlaWdodCgpIDogdGhpcy5lbGVtZW50Lm91dGVySGVpZ2h0KCk7XHJcbiAgICAgICAgdGhpcy5wbGFjZSgpO1xyXG4gICAgICAgICQod2luZG93KS5vbigncmVzaXplJywgJC5wcm94eSh0aGlzLnBsYWNlLCB0aGlzKSk7XHJcbiAgICAgICAgaWYgKGUgKSB7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzSW5wdXQpIHtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbihldil7XHJcbiAgICAgICAgICAgIGlmICgkKGV2LnRhcmdldCkuY2xvc2VzdCgnLicgKyBjbGFzc2VzLmNvbXBvbmVudCkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0LmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcclxuICAgICAgICAgICAgdHlwZTogJ3Nob3cnLFxyXG4gICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGVcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIGhpZGU6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuaGlkZSgpO1xyXG4gICAgICAgICQod2luZG93KS5vZmYoJ3Jlc2l6ZScsIHRoaXMucGxhY2UpO1xyXG4gICAgICAgIHRoaXMudmlld01vZGUgPSB0aGlzLnN0YXJ0Vmlld01vZGU7XHJcbiAgICAgICAgdGhpcy5zaG93TW9kZSgpO1xyXG4gICAgICAgIGlmICghdGhpcy5pc0lucHV0KSB7XHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLm9mZignbW91c2Vkb3duJywgdGhpcy5oaWRlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy90aGlzLnNldCgpO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcclxuICAgICAgICAgICAgdHlwZTogJ2hpZGUnLFxyXG4gICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGVcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIHNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGZvcm1hdGVkID0gRFBHbG9iYWwuZm9ybWF0RGF0ZSh0aGlzLmRhdGUsIHRoaXMuZm9ybWF0KTtcclxuICAgICAgICBpZiAoIXRoaXMuaXNJbnB1dCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jb21wb25lbnQpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmZpbmQoJ2lucHV0JykucHJvcCgndmFsdWUnLCBmb3JtYXRlZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUnLCBmb3JtYXRlZCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnByb3AoJ3ZhbHVlJywgZm9ybWF0ZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIFNldHMgYSBkYXRlIGFzIHZhbHVlIGFuZCBub3RpZnkgd2l0aCBhbiBldmVudC5cclxuICAgICAgICBQYXJhbWV0ZXIgZG9udE5vdGlmeSBpcyBvbmx5IGZvciBjYXNlcyB3aGVyZSB0aGUgY2FsZW5kYXIgb3JcclxuICAgICAgICBzb21lIHJlbGF0ZWQgY29tcG9uZW50IGdldHMgYWxyZWFkeSB1cGRhdGVkIGJ1dCB0aGUgaGlnaGxpZ2h0ZWRcclxuICAgICAgICBkYXRlIG5lZWRzIHRvIGJlIHVwZGF0ZWQgd2l0aG91dCBjcmVhdGUgaW5maW5pdGUgcmVjdXJzaW9uIFxyXG4gICAgICAgIGJlY2F1c2Ugb2Ygbm90aWZpY2F0aW9uLiBJbiBvdGhlciBjYXNlLCBkb250IHVzZS5cclxuICAgICoqL1xyXG4gICAgc2V0VmFsdWU6IGZ1bmN0aW9uKG5ld0RhdGUsIGRvbnROb3RpZnkpIHtcclxuICAgICAgICBpZiAodHlwZW9mIG5ld0RhdGUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSA9IERQR2xvYmFsLnBhcnNlRGF0ZShuZXdEYXRlLCB0aGlzLmZvcm1hdCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5kYXRlID0gbmV3IERhdGUobmV3RGF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc2V0KCk7XHJcbiAgICAgICAgdGhpcy52aWV3RGF0ZSA9IG5ldyBEYXRlKHRoaXMuZGF0ZS5nZXRGdWxsWWVhcigpLCB0aGlzLmRhdGUuZ2V0TW9udGgoKSwgMSwgMCwgMCwgMCwgMCk7XHJcbiAgICAgICAgdGhpcy5maWxsKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGRvbnROb3RpZnkgIT09IHRydWUpIHtcclxuICAgICAgICAgICAgLy8gTm90aWZ5OlxyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnY2hhbmdlRGF0ZScsXHJcbiAgICAgICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGUsXHJcbiAgICAgICAgICAgICAgICB2aWV3TW9kZTogRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBnZXRWYWx1ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0ZTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIG1vdmVWYWx1ZTogZnVuY3Rpb24oZGlyLCBtb2RlKSB7XHJcbiAgICAgICAgLy8gZGlyIGNhbiBiZTogJ3ByZXYnLCAnbmV4dCdcclxuICAgICAgICBpZiAoWydwcmV2JywgJ25leHQnXS5pbmRleE9mKGRpciAmJiBkaXIudG9Mb3dlckNhc2UoKSkgPT0gLTEpXHJcbiAgICAgICAgICAgIC8vIE5vIHZhbGlkIG9wdGlvbjpcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBkZWZhdWx0IG1vZGUgaXMgdGhlIGN1cnJlbnQgb25lXHJcbiAgICAgICAgbW9kZSA9IG1vZGUgP1xyXG4gICAgICAgICAgICBEUEdsb2JhbC5tb2Rlc1NldFttb2RlXSA6XHJcbiAgICAgICAgICAgIERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdO1xyXG5cclxuICAgICAgICB0aGlzLmRhdGVbJ3NldCcgKyBtb2RlLm5hdkZuY10uY2FsbChcclxuICAgICAgICAgICAgdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICB0aGlzLmRhdGVbJ2dldCcgKyBtb2RlLm5hdkZuY10uY2FsbCh0aGlzLmRhdGUpICsgXHJcbiAgICAgICAgICAgIG1vZGUubmF2U3RlcCAqIChkaXIgPT09ICdwcmV2JyA/IC0xIDogMSlcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMuc2V0VmFsdWUodGhpcy5kYXRlKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5kYXRlO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgcGxhY2U6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdmFyIG9mZnNldCA9IHRoaXMuY29tcG9uZW50ID8gdGhpcy5jb21wb25lbnQub2Zmc2V0KCkgOiB0aGlzLmVsZW1lbnQub2Zmc2V0KCk7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuY3NzKHtcclxuICAgICAgICAgICAgdG9wOiBvZmZzZXQudG9wICsgdGhpcy5oZWlnaHQsXHJcbiAgICAgICAgICAgIGxlZnQ6IG9mZnNldC5sZWZ0XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uKG5ld0RhdGUpe1xyXG4gICAgICAgIHRoaXMuZGF0ZSA9IERQR2xvYmFsLnBhcnNlRGF0ZShcclxuICAgICAgICAgICAgdHlwZW9mIG5ld0RhdGUgPT09ICdzdHJpbmcnID8gbmV3RGF0ZSA6ICh0aGlzLmlzSW5wdXQgPyB0aGlzLmVsZW1lbnQucHJvcCgndmFsdWUnKSA6IHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlJykpLFxyXG4gICAgICAgICAgICB0aGlzLmZvcm1hdFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgdGhpcy52aWV3RGF0ZSA9IG5ldyBEYXRlKHRoaXMuZGF0ZS5nZXRGdWxsWWVhcigpLCB0aGlzLmRhdGUuZ2V0TW9udGgoKSwgMSwgMCwgMCwgMCwgMCk7XHJcbiAgICAgICAgdGhpcy5maWxsKCk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBmaWxsRG93OiBmdW5jdGlvbigpe1xyXG4gICAgICAgIHZhciBkb3dDbnQgPSB0aGlzLndlZWtTdGFydDtcclxuICAgICAgICB2YXIgaHRtbCA9ICc8dHI+JztcclxuICAgICAgICB3aGlsZSAoZG93Q250IDwgdGhpcy53ZWVrU3RhcnQgKyA3KSB7XHJcbiAgICAgICAgICAgIGh0bWwgKz0gJzx0aCBjbGFzcz1cImRvd1wiPicrRFBHbG9iYWwuZGF0ZXMuZGF5c01pblsoZG93Q250KyspJTddKyc8L3RoPic7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGh0bWwgKz0gJzwvdHI+JztcclxuICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcuJyArIGNsYXNzZXMuZGF5cyArICcgdGhlYWQnKS5hcHBlbmQoaHRtbCk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBmaWxsTW9udGhzOiBmdW5jdGlvbigpe1xyXG4gICAgICAgIHZhciBodG1sID0gJyc7XHJcbiAgICAgICAgdmFyIGkgPSAwO1xyXG4gICAgICAgIHdoaWxlIChpIDwgMTIpIHtcclxuICAgICAgICAgICAgaHRtbCArPSAnPHNwYW4gY2xhc3M9XCInICsgY2xhc3Nlcy5tb250aCArICdcIj4nK0RQR2xvYmFsLmRhdGVzLm1vbnRoc1Nob3J0W2krK10rJzwvc3Bhbj4nO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcuJyArIGNsYXNzZXMubW9udGhzICsgJyB0ZCcpLmFwcGVuZChodG1sKTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIGZpbGw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8qanNoaW50IG1heHN0YXRlbWVudHM6NjYsIG1heGNvbXBsZXhpdHk6MjgqL1xyXG4gICAgICAgIHZhciBkID0gbmV3IERhdGUodGhpcy52aWV3RGF0ZSksXHJcbiAgICAgICAgICAgIHllYXIgPSBkLmdldEZ1bGxZZWFyKCksXHJcbiAgICAgICAgICAgIG1vbnRoID0gZC5nZXRNb250aCgpLFxyXG4gICAgICAgICAgICBjdXJyZW50RGF0ZSA9IHRoaXMuZGF0ZS52YWx1ZU9mKCk7XHJcbiAgICAgICAgdGhpcy5waWNrZXJcclxuICAgICAgICAuZmluZCgnLicgKyBjbGFzc2VzLmRheXMgKyAnIHRoOmVxKDEpJylcclxuICAgICAgICAuaHRtbChEUEdsb2JhbC5kYXRlcy5tb250aHNbbW9udGhdICsgJyAnICsgeWVhcik7XHJcbiAgICAgICAgdmFyIHByZXZNb250aCA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLTEsIDI4LDAsMCwwLDApLFxyXG4gICAgICAgICAgICBkYXkgPSBEUEdsb2JhbC5nZXREYXlzSW5Nb250aChwcmV2TW9udGguZ2V0RnVsbFllYXIoKSwgcHJldk1vbnRoLmdldE1vbnRoKCkpO1xyXG4gICAgICAgIHByZXZNb250aC5zZXREYXRlKGRheSk7XHJcbiAgICAgICAgcHJldk1vbnRoLnNldERhdGUoZGF5IC0gKHByZXZNb250aC5nZXREYXkoKSAtIHRoaXMud2Vla1N0YXJ0ICsgNyklNyk7XHJcbiAgICAgICAgdmFyIG5leHRNb250aCA9IG5ldyBEYXRlKHByZXZNb250aCk7XHJcbiAgICAgICAgbmV4dE1vbnRoLnNldERhdGUobmV4dE1vbnRoLmdldERhdGUoKSArIDQyKTtcclxuICAgICAgICBuZXh0TW9udGggPSBuZXh0TW9udGgudmFsdWVPZigpO1xyXG4gICAgICAgIHZhciBodG1sID0gW107XHJcbiAgICAgICAgdmFyIGNsc05hbWUsXHJcbiAgICAgICAgICAgIHByZXZZLFxyXG4gICAgICAgICAgICBwcmV2TTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgaWYgKHRoaXMuX2RheXNDcmVhdGVkICE9PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBodG1sIChmaXJzdCB0aW1lIG9ubHkpXHJcbiAgICAgICBcclxuICAgICAgICAgICAgd2hpbGUocHJldk1vbnRoLnZhbHVlT2YoKSA8IG5leHRNb250aCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZNb250aC5nZXREYXkoKSA9PT0gdGhpcy53ZWVrU3RhcnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goJzx0cj4nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNsc05hbWUgPSB0aGlzLm9uUmVuZGVyKHByZXZNb250aCk7XHJcbiAgICAgICAgICAgICAgICBwcmV2WSA9IHByZXZNb250aC5nZXRGdWxsWWVhcigpO1xyXG4gICAgICAgICAgICAgICAgcHJldk0gPSBwcmV2TW9udGguZ2V0TW9udGgoKTtcclxuICAgICAgICAgICAgICAgIGlmICgocHJldk0gPCBtb250aCAmJiAgcHJldlkgPT09IHllYXIpIHx8ICBwcmV2WSA8IHllYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgb2xkJztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoKHByZXZNID4gbW9udGggJiYgcHJldlkgPT09IHllYXIpIHx8IHByZXZZID4geWVhcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBuZXcnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZNb250aC52YWx1ZU9mKCkgPT09IGN1cnJlbnREYXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIGFjdGl2ZSc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2goJzx0ZCBjbGFzcz1cIicgKyBjbGFzc2VzLm1vbnRoRGF5ICsgJyAnICsgY2xzTmFtZSsnXCI+JytwcmV2TW9udGguZ2V0RGF0ZSgpICsgJzwvdGQ+Jyk7XHJcbiAgICAgICAgICAgICAgICBpZiAocHJldk1vbnRoLmdldERheSgpID09PSB0aGlzLndlZWtFbmQpIHtcclxuICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goJzwvdHI+Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBwcmV2TW9udGguc2V0RGF0ZShwcmV2TW9udGguZ2V0RGF0ZSgpKzEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcuJyArIGNsYXNzZXMuZGF5cyArICcgdGJvZHknKS5lbXB0eSgpLmFwcGVuZChodG1sLmpvaW4oJycpKTtcclxuICAgICAgICAgICAgdGhpcy5fZGF5c0NyZWF0ZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gVXBkYXRlIGRheXMgdmFsdWVzXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgd2Vla1RyID0gdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLmRheXMgKyAnIHRib2R5IHRyOmZpcnN0LWNoaWxkKCknKTtcclxuICAgICAgICAgICAgdmFyIGRheVRkID0gbnVsbDtcclxuICAgICAgICAgICAgd2hpbGUocHJldk1vbnRoLnZhbHVlT2YoKSA8IG5leHRNb250aCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRXZWVrRGF5SW5kZXggPSBwcmV2TW9udGguZ2V0RGF5KCkgLSB0aGlzLndlZWtTdGFydDtcclxuXHJcbiAgICAgICAgICAgICAgICBjbHNOYW1lID0gdGhpcy5vblJlbmRlcihwcmV2TW9udGgpO1xyXG4gICAgICAgICAgICAgICAgcHJldlkgPSBwcmV2TW9udGguZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICAgICAgICAgIHByZXZNID0gcHJldk1vbnRoLmdldE1vbnRoKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoKHByZXZNIDwgbW9udGggJiYgIHByZXZZID09PSB5ZWFyKSB8fCAgcHJldlkgPCB5ZWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIG9sZCc7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKChwcmV2TSA+IG1vbnRoICYmIHByZXZZID09PSB5ZWFyKSB8fCBwcmV2WSA+IHllYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgbmV3JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGgudmFsdWVPZigpID09PSBjdXJyZW50RGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBhY3RpdmUnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy9odG1sLnB1c2goJzx0ZCBjbGFzcz1cImRheSAnK2Nsc05hbWUrJ1wiPicrcHJldk1vbnRoLmdldERhdGUoKSArICc8L3RkPicpO1xyXG4gICAgICAgICAgICAgICAgZGF5VGQgPSB3ZWVrVHIuZmluZCgndGQ6ZXEoJyArIGN1cnJlbnRXZWVrRGF5SW5kZXggKyAnKScpO1xyXG4gICAgICAgICAgICAgICAgZGF5VGRcclxuICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdkYXkgJyArIGNsc05hbWUpXHJcbiAgICAgICAgICAgICAgICAudGV4dChwcmV2TW9udGguZ2V0RGF0ZSgpKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gTmV4dCB3ZWVrP1xyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZNb250aC5nZXREYXkoKSA9PT0gdGhpcy53ZWVrRW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2Vla1RyID0gd2Vla1RyLm5leHQoJ3RyJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBwcmV2TW9udGguc2V0RGF0ZShwcmV2TW9udGguZ2V0RGF0ZSgpKzEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY3VycmVudFllYXIgPSB0aGlzLmRhdGUuZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgbW9udGhzID0gdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLm1vbnRocylcclxuICAgICAgICAgICAgICAgICAgICAuZmluZCgndGg6ZXEoMSknKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuaHRtbCh5ZWFyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZW5kKClcclxuICAgICAgICAgICAgICAgICAgICAuZmluZCgnc3BhbicpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcclxuICAgICAgICBpZiAoY3VycmVudFllYXIgPT09IHllYXIpIHtcclxuICAgICAgICAgICAgbW9udGhzLmVxKHRoaXMuZGF0ZS5nZXRNb250aCgpKS5hZGRDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGh0bWwgPSAnJztcclxuICAgICAgICB5ZWFyID0gcGFyc2VJbnQoeWVhci8xMCwgMTApICogMTA7XHJcbiAgICAgICAgdmFyIHllYXJDb250ID0gdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLnllYXJzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ3RoOmVxKDEpJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGV4dCh5ZWFyICsgJy0nICsgKHllYXIgKyA5KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZW5kKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKCd0ZCcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHllYXIgLT0gMTtcclxuICAgICAgICB2YXIgaTtcclxuICAgICAgICBpZiAodGhpcy5feWVhcnNDcmVhdGVkICE9PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGkgPSAtMTsgaSA8IDExOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGh0bWwgKz0gJzxzcGFuIGNsYXNzPVwiJyArIGNsYXNzZXMueWVhciArIChpID09PSAtMSB8fCBpID09PSAxMCA/ICcgb2xkJyA6ICcnKSsoY3VycmVudFllYXIgPT09IHllYXIgPyAnIGFjdGl2ZScgOiAnJykrJ1wiPicreWVhcisnPC9zcGFuPic7XHJcbiAgICAgICAgICAgICAgICB5ZWFyICs9IDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHllYXJDb250Lmh0bWwoaHRtbCk7XHJcbiAgICAgICAgICAgIHRoaXMuX3llYXJzQ3JlYXRlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHllYXJTcGFuID0geWVhckNvbnQuZmluZCgnc3BhbjpmaXJzdC1jaGlsZCgpJyk7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IC0xOyBpIDwgMTE7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgLy9odG1sICs9ICc8c3BhbiBjbGFzcz1cInllYXInKyhpID09PSAtMSB8fCBpID09PSAxMCA/ICcgb2xkJyA6ICcnKSsoY3VycmVudFllYXIgPT09IHllYXIgPyAnIGFjdGl2ZScgOiAnJykrJ1wiPicreWVhcisnPC9zcGFuPic7XHJcbiAgICAgICAgICAgICAgICB5ZWFyU3BhblxyXG4gICAgICAgICAgICAgICAgLnRleHQoeWVhcilcclxuICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICd5ZWFyJyArIChpID09PSAtMSB8fCBpID09PSAxMCA/ICcgb2xkJyA6ICcnKSArIChjdXJyZW50WWVhciA9PT0geWVhciA/ICcgYWN0aXZlJyA6ICcnKSk7XHJcbiAgICAgICAgICAgICAgICB5ZWFyICs9IDE7XHJcbiAgICAgICAgICAgICAgICB5ZWFyU3BhbiA9IHllYXJTcGFuLm5leHQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIG1vdmVEYXRlOiBmdW5jdGlvbihkaXIsIG1vZGUpIHtcclxuICAgICAgICAvLyBkaXIgY2FuIGJlOiAncHJldicsICduZXh0J1xyXG4gICAgICAgIGlmIChbJ3ByZXYnLCAnbmV4dCddLmluZGV4T2YoZGlyICYmIGRpci50b0xvd2VyQ2FzZSgpKSA9PSAtMSlcclxuICAgICAgICAgICAgLy8gTm8gdmFsaWQgb3B0aW9uOlxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIC8vIGRlZmF1bHQgbW9kZSBpcyB0aGUgY3VycmVudCBvbmVcclxuICAgICAgICBtb2RlID0gbW9kZSB8fCB0aGlzLnZpZXdNb2RlO1xyXG5cclxuICAgICAgICB0aGlzLnZpZXdEYXRlWydzZXQnK0RQR2xvYmFsLm1vZGVzW21vZGVdLm5hdkZuY10uY2FsbChcclxuICAgICAgICAgICAgdGhpcy52aWV3RGF0ZSxcclxuICAgICAgICAgICAgdGhpcy52aWV3RGF0ZVsnZ2V0JytEUEdsb2JhbC5tb2Rlc1ttb2RlXS5uYXZGbmNdLmNhbGwodGhpcy52aWV3RGF0ZSkgKyBcclxuICAgICAgICAgICAgRFBHbG9iYWwubW9kZXNbbW9kZV0ubmF2U3RlcCAqIChkaXIgPT09ICdwcmV2JyA/IC0xIDogMSlcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgICAgIHRoaXMuc2V0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsaWNrOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgLypqc2hpbnQgbWF4Y29tcGxleGl0eToxNiovXHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdmFyIHRhcmdldCA9ICQoZS50YXJnZXQpLmNsb3Nlc3QoJ3NwYW4sIHRkLCB0aCcpO1xyXG4gICAgICAgIGlmICh0YXJnZXQubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgIHZhciBtb250aCwgeWVhcjtcclxuICAgICAgICAgICAgc3dpdGNoKHRhcmdldFswXS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd0aCc6XHJcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoKHRhcmdldFswXS5jbGFzc05hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3dpdGNoJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd01vZGUoMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAncHJldic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ25leHQnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3ZlRGF0ZSh0YXJnZXRbMF0uY2xhc3NOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3NwYW4nOlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuaXMoJy4nICsgY2xhc3Nlcy5tb250aCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggPSB0YXJnZXQucGFyZW50KCkuZmluZCgnc3BhbicpLmluZGV4KHRhcmdldCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmlld0RhdGUuc2V0TW9udGgobW9udGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHllYXIgPSBwYXJzZUludCh0YXJnZXQudGV4dCgpLCAxMCl8fDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmlld0RhdGUuc2V0RnVsbFllYXIoeWVhcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnZpZXdNb2RlICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0ZSA9IG5ldyBEYXRlKHRoaXMudmlld0RhdGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2hhbmdlRGF0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3TW9kZTogRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93TW9kZSgtMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQoKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3RkJzpcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmlzKCcuZGF5JykgJiYgIXRhcmdldC5pcygnLmRpc2FibGVkJykpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGF5ID0gcGFyc2VJbnQodGFyZ2V0LnRleHQoKSwgMTApfHwxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb250aCA9IHRoaXMudmlld0RhdGUuZ2V0TW9udGgoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldC5pcygnLm9sZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb250aCAtPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRhcmdldC5pcygnLm5ldycpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb250aCArPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHllYXIgPSB0aGlzLnZpZXdEYXRlLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0ZSA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLCBkYXksMCwwLDAsMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmlld0RhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgTWF0aC5taW4oMjgsIGRheSksMCwwLDAsMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2hhbmdlRGF0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3TW9kZTogRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBtb3VzZWRvd246IGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgc2hvd01vZGU6IGZ1bmN0aW9uKGRpcikge1xyXG4gICAgICAgIGlmIChkaXIpIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3TW9kZSA9IE1hdGgubWF4KHRoaXMubWluVmlld01vZGUsIE1hdGgubWluKDIsIHRoaXMudmlld01vZGUgKyBkaXIpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnPmRpdicpLmhpZGUoKS5maWx0ZXIoJy4nICsgY2xhc3Nlcy5jb21wb25lbnQgKyAnLScgKyBEUEdsb2JhbC5tb2Rlc1t0aGlzLnZpZXdNb2RlXS5jbHNOYW1lKS5zaG93KCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4kLmZuLmRhdGVwaWNrZXIgPSBmdW5jdGlvbiAoIG9wdGlvbiApIHtcclxuICAgIHZhciB2YWxzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcclxuICAgIHZhciByZXR1cm5lZDtcclxuICAgIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgZGF0YSA9ICR0aGlzLmRhdGEoJ2RhdGVwaWNrZXInKSxcclxuICAgICAgICAgICAgb3B0aW9ucyA9IHR5cGVvZiBvcHRpb24gPT09ICdvYmplY3QnICYmIG9wdGlvbjtcclxuICAgICAgICBpZiAoIWRhdGEpIHtcclxuICAgICAgICAgICAgJHRoaXMuZGF0YSgnZGF0ZXBpY2tlcicsIChkYXRhID0gbmV3IERhdGVQaWNrZXIodGhpcywgJC5leHRlbmQoe30sICQuZm4uZGF0ZXBpY2tlci5kZWZhdWx0cyxvcHRpb25zKSkpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICByZXR1cm5lZCA9IGRhdGFbb3B0aW9uXS5hcHBseShkYXRhLCB2YWxzKTtcclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgYSB2YWx1ZSByZXR1cm5lZCBieSB0aGUgbWV0aG9kP1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mKHJldHVybmVkICE9PSAndW5kZWZpbmVkJykpIHtcclxuICAgICAgICAgICAgICAgIC8vIEdvIG91dCB0aGUgbG9vcCB0byByZXR1cm4gdGhlIHZhbHVlIGZyb20gdGhlIGZpcnN0XHJcbiAgICAgICAgICAgICAgICAvLyBlbGVtZW50LW1ldGhvZCBleGVjdXRpb25cclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBGb2xsb3cgbmV4dCBsb29wIGl0ZW1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIGlmICh0eXBlb2YocmV0dXJuZWQpICE9PSAndW5kZWZpbmVkJylcclxuICAgICAgICByZXR1cm4gcmV0dXJuZWQ7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgLy8gY2hhaW5pbmc6XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4kLmZuLmRhdGVwaWNrZXIuZGVmYXVsdHMgPSB7XHJcbiAgICBvblJlbmRlcjogZnVuY3Rpb24oZGF0ZSkge1xyXG4gICAgICAgIHJldHVybiAnJztcclxuICAgIH1cclxufTtcclxuJC5mbi5kYXRlcGlja2VyLkNvbnN0cnVjdG9yID0gRGF0ZVBpY2tlcjtcclxuXHJcbnZhciBEUEdsb2JhbCA9IHtcclxuICAgIG1vZGVzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjbHNOYW1lOiAnZGF5cycsXHJcbiAgICAgICAgICAgIG5hdkZuYzogJ01vbnRoJyxcclxuICAgICAgICAgICAgbmF2U3RlcDogMVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjbHNOYW1lOiAnbW9udGhzJyxcclxuICAgICAgICAgICAgbmF2Rm5jOiAnRnVsbFllYXInLFxyXG4gICAgICAgICAgICBuYXZTdGVwOiAxXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNsc05hbWU6ICd5ZWFycycsXHJcbiAgICAgICAgICAgIG5hdkZuYzogJ0Z1bGxZZWFyJyxcclxuICAgICAgICAgICAgbmF2U3RlcDogMTBcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xzTmFtZTogJ2RheScsXHJcbiAgICAgICAgICAgIG5hdkZuYzogJ0RhdGUnLFxyXG4gICAgICAgICAgICBuYXZTdGVwOiAxXHJcbiAgICAgICAgfVxyXG4gICAgXSxcclxuICAgIGRhdGVzOntcclxuICAgICAgICBkYXlzOiBbXCJTdW5kYXlcIiwgXCJNb25kYXlcIiwgXCJUdWVzZGF5XCIsIFwiV2VkbmVzZGF5XCIsIFwiVGh1cnNkYXlcIiwgXCJGcmlkYXlcIiwgXCJTYXR1cmRheVwiLCBcIlN1bmRheVwiXSxcclxuICAgICAgICBkYXlzU2hvcnQ6IFtcIlN1blwiLCBcIk1vblwiLCBcIlR1ZVwiLCBcIldlZFwiLCBcIlRodVwiLCBcIkZyaVwiLCBcIlNhdFwiLCBcIlN1blwiXSxcclxuICAgICAgICBkYXlzTWluOiBbXCJTdVwiLCBcIk1vXCIsIFwiVHVcIiwgXCJXZVwiLCBcIlRoXCIsIFwiRnJcIiwgXCJTYVwiLCBcIlN1XCJdLFxyXG4gICAgICAgIG1vbnRoczogW1wiSmFudWFyeVwiLCBcIkZlYnJ1YXJ5XCIsIFwiTWFyY2hcIiwgXCJBcHJpbFwiLCBcIk1heVwiLCBcIkp1bmVcIiwgXCJKdWx5XCIsIFwiQXVndXN0XCIsIFwiU2VwdGVtYmVyXCIsIFwiT2N0b2JlclwiLCBcIk5vdmVtYmVyXCIsIFwiRGVjZW1iZXJcIl0sXHJcbiAgICAgICAgbW9udGhzU2hvcnQ6IFtcIkphblwiLCBcIkZlYlwiLCBcIk1hclwiLCBcIkFwclwiLCBcIk1heVwiLCBcIkp1blwiLCBcIkp1bFwiLCBcIkF1Z1wiLCBcIlNlcFwiLCBcIk9jdFwiLCBcIk5vdlwiLCBcIkRlY1wiXVxyXG4gICAgfSxcclxuICAgIGlzTGVhcFllYXI6IGZ1bmN0aW9uICh5ZWFyKSB7XHJcbiAgICAgICAgcmV0dXJuICgoKHllYXIgJSA0ID09PSAwKSAmJiAoeWVhciAlIDEwMCAhPT0gMCkpIHx8ICh5ZWFyICUgNDAwID09PSAwKSk7XHJcbiAgICB9LFxyXG4gICAgZ2V0RGF5c0luTW9udGg6IGZ1bmN0aW9uICh5ZWFyLCBtb250aCkge1xyXG4gICAgICAgIHJldHVybiBbMzEsIChEUEdsb2JhbC5pc0xlYXBZZWFyKHllYXIpID8gMjkgOiAyOCksIDMxLCAzMCwgMzEsIDMwLCAzMSwgMzEsIDMwLCAzMSwgMzAsIDMxXVttb250aF07XHJcbiAgICB9LFxyXG4gICAgcGFyc2VGb3JtYXQ6IGZ1bmN0aW9uKGZvcm1hdCl7XHJcbiAgICAgICAgdmFyIHNlcGFyYXRvciA9IGZvcm1hdC5tYXRjaCgvWy5cXC9cXC1cXHNdLio/LyksXHJcbiAgICAgICAgICAgIHBhcnRzID0gZm9ybWF0LnNwbGl0KC9cXFcrLyk7XHJcbiAgICAgICAgaWYgKCFzZXBhcmF0b3IgfHwgIXBhcnRzIHx8IHBhcnRzLmxlbmd0aCA9PT0gMCl7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgZGF0ZSBmb3JtYXQuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4ge3NlcGFyYXRvcjogc2VwYXJhdG9yLCBwYXJ0czogcGFydHN9O1xyXG4gICAgfSxcclxuICAgIHBhcnNlRGF0ZTogZnVuY3Rpb24oZGF0ZSwgZm9ybWF0KSB7XHJcbiAgICAgICAgLypqc2hpbnQgbWF4Y29tcGxleGl0eToxMSovXHJcbiAgICAgICAgdmFyIHBhcnRzID0gZGF0ZS5zcGxpdChmb3JtYXQuc2VwYXJhdG9yKSxcclxuICAgICAgICAgICAgdmFsO1xyXG4gICAgICAgIGRhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgIGRhdGUuc2V0SG91cnMoMCk7XHJcbiAgICAgICAgZGF0ZS5zZXRNaW51dGVzKDApO1xyXG4gICAgICAgIGRhdGUuc2V0U2Vjb25kcygwKTtcclxuICAgICAgICBkYXRlLnNldE1pbGxpc2Vjb25kcygwKTtcclxuICAgICAgICBpZiAocGFydHMubGVuZ3RoID09PSBmb3JtYXQucGFydHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciB5ZWFyID0gZGF0ZS5nZXRGdWxsWWVhcigpLCBkYXkgPSBkYXRlLmdldERhdGUoKSwgbW9udGggPSBkYXRlLmdldE1vbnRoKCk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGk9MCwgY250ID0gZm9ybWF0LnBhcnRzLmxlbmd0aDsgaSA8IGNudDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YWwgPSBwYXJzZUludChwYXJ0c1tpXSwgMTApfHwxO1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoKGZvcm1hdC5wYXJ0c1tpXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2RkJzpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdkJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF5ID0gdmFsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlLnNldERhdGUodmFsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbW0nOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ20nOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb250aCA9IHZhbCAtIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGUuc2V0TW9udGgodmFsIC0gMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3l5JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgeWVhciA9IDIwMDAgKyB2YWw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGUuc2V0RnVsbFllYXIoMjAwMCArIHZhbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3l5eXknOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ZWFyID0gdmFsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlLnNldEZ1bGxZZWFyKHZhbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgZGF5LCAwICwwICwwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGRhdGU7XHJcbiAgICB9LFxyXG4gICAgZm9ybWF0RGF0ZTogZnVuY3Rpb24oZGF0ZSwgZm9ybWF0KXtcclxuICAgICAgICB2YXIgdmFsID0ge1xyXG4gICAgICAgICAgICBkOiBkYXRlLmdldERhdGUoKSxcclxuICAgICAgICAgICAgbTogZGF0ZS5nZXRNb250aCgpICsgMSxcclxuICAgICAgICAgICAgeXk6IGRhdGUuZ2V0RnVsbFllYXIoKS50b1N0cmluZygpLnN1YnN0cmluZygyKSxcclxuICAgICAgICAgICAgeXl5eTogZGF0ZS5nZXRGdWxsWWVhcigpXHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YWwuZGQgPSAodmFsLmQgPCAxMCA/ICcwJyA6ICcnKSArIHZhbC5kO1xyXG4gICAgICAgIHZhbC5tbSA9ICh2YWwubSA8IDEwID8gJzAnIDogJycpICsgdmFsLm07XHJcbiAgICAgICAgZGF0ZSA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGk9MCwgY250ID0gZm9ybWF0LnBhcnRzLmxlbmd0aDsgaSA8IGNudDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGRhdGUucHVzaCh2YWxbZm9ybWF0LnBhcnRzW2ldXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRlLmpvaW4oZm9ybWF0LnNlcGFyYXRvcik7XHJcbiAgICB9LFxyXG4gICAgaGVhZFRlbXBsYXRlOiAnPHRoZWFkPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8dHI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGggY2xhc3M9XCJwcmV2XCI+JmxzYXF1bzs8L3RoPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRoIGNvbHNwYW49XCI1XCIgY2xhc3M9XCJzd2l0Y2hcIj48L3RoPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRoIGNsYXNzPVwibmV4dFwiPiZyc2FxdW87PC90aD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC90cj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICc8L3RoZWFkPicsXHJcbiAgICBjb250VGVtcGxhdGU6ICc8dGJvZHk+PHRyPjx0ZCBjb2xzcGFuPVwiN1wiPjwvdGQ+PC90cj48L3Rib2R5PidcclxufTtcclxuRFBHbG9iYWwudGVtcGxhdGUgPSAnPGRpdiBjbGFzcz1cIicgKyBjbGFzc2VzLmNvbXBvbmVudCArICdcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cIicgKyBjbGFzc2VzLmRheXMgKyAnXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGFibGUgY2xhc3M9XCIgdGFibGUtY29uZGVuc2VkXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEUEdsb2JhbC5oZWFkVGVtcGxhdGUrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0Ym9keT48L3Rib2R5PicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC90YWJsZT4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCInICsgY2xhc3Nlcy5tb250aHMgKyAnXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGFibGUgY2xhc3M9XCJ0YWJsZS1jb25kZW5zZWRcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERQR2xvYmFsLmhlYWRUZW1wbGF0ZStcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEUEdsb2JhbC5jb250VGVtcGxhdGUrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC90YWJsZT4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCInICsgY2xhc3Nlcy55ZWFycyArICdcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0YWJsZSBjbGFzcz1cInRhYmxlLWNvbmRlbnNlZFwiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRFBHbG9iYWwuaGVhZFRlbXBsYXRlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERQR2xvYmFsLmNvbnRUZW1wbGF0ZStcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L3RhYmxlPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nO1xyXG5EUEdsb2JhbC5tb2Rlc1NldCA9IHtcclxuICAgICdkYXRlJzogRFBHbG9iYWwubW9kZXNbM10sXHJcbiAgICAnbW9udGgnOiBEUEdsb2JhbC5tb2Rlc1swXSxcclxuICAgICd5ZWFyJzogRFBHbG9iYWwubW9kZXNbMV0sXHJcbiAgICAnZGVjYWRlJzogRFBHbG9iYWwubW9kZXNbMl1cclxufTtcclxuXHJcbi8qKiBQdWJsaWMgQVBJICoqL1xyXG5leHBvcnRzLkRhdGVQaWNrZXIgPSBEYXRlUGlja2VyO1xyXG5leHBvcnRzLmRlZmF1bHRzID0gRFBHbG9iYWw7XHJcbmV4cG9ydHMudXRpbHMgPSBEUEdsb2JhbDtcclxuIiwiLyoqXHJcbiAgICBTbWFydE5hdkJhciBjb21wb25lbnQuXHJcbiAgICBSZXF1aXJlcyBpdHMgQ1NTIGNvdW50ZXJwYXJ0LlxyXG4gICAgXHJcbiAgICBDcmVhdGVkIGJhc2VkIG9uIHRoZSBwcm9qZWN0OlxyXG4gICAgXHJcbiAgICBQcm9qZWN0LVR5c29uXHJcbiAgICBXZWJzaXRlOiBodHRwczovL2dpdGh1Yi5jb20vYzJwcm9kcy9Qcm9qZWN0LVR5c29uXHJcbiAgICBBdXRob3I6IGMycHJvZHNcclxuICAgIExpY2Vuc2U6XHJcbiAgICBUaGUgTUlUIExpY2Vuc2UgKE1JVClcclxuICAgIENvcHlyaWdodCAoYykgMjAxMyBjMnByb2RzXHJcbiAgICBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mXHJcbiAgICB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluXHJcbiAgICB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvXHJcbiAgICB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZlxyXG4gICAgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLFxyXG4gICAgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcbiAgICBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcclxuICAgIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXHJcbiAgICBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXHJcbiAgICBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTU1xyXG4gICAgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SXHJcbiAgICBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVJcclxuICAgIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOXHJcbiAgICBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbi8qKlxyXG4gICAgSW50ZXJuYWwgdXRpbGl0eS5cclxuICAgIFJlbW92ZXMgYWxsIGNoaWxkcmVuIGZvciBhIERPTSBub2RlXHJcbioqL1xyXG52YXIgY2xlYXJOb2RlID0gZnVuY3Rpb24gKG5vZGUpIHtcclxuICAgIHdoaWxlKG5vZGUuZmlyc3RDaGlsZCl7XHJcbiAgICAgICAgbm9kZS5yZW1vdmVDaGlsZChub2RlLmZpcnN0Q2hpbGQpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAgICBDYWxjdWxhdGVzIGFuZCBhcHBsaWVzIHRoZSBiZXN0IHNpemluZyBhbmQgZGlzdHJpYnV0aW9uIGZvciB0aGUgdGl0bGVcclxuICAgIGRlcGVuZGluZyBvbiBjb250ZW50IGFuZCBidXR0b25zLlxyXG4gICAgUGFzcyBpbiB0aGUgdGl0bGUgZWxlbWVudCwgYnV0dG9ucyBtdXN0IGJlIGZvdW5kIGFzIHNpYmxpbmdzIG9mIGl0LlxyXG4qKi9cclxudmFyIHRleHRib3hSZXNpemUgPSBmdW5jdGlvbiB0ZXh0Ym94UmVzaXplKGVsKSB7XHJcbiAgICAvKiBqc2hpbnQgbWF4c3RhdGVtZW50czogMjgsIG1heGNvbXBsZXhpdHk6MTEgKi9cclxuICAgIFxyXG4gICAgdmFyIGxlZnRidG4gPSBlbC5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoJy5TbWFydE5hdkJhci1lZGdlLmxlZnQnKVswXTtcclxuICAgIHZhciByaWdodGJ0biA9IGVsLnBhcmVudE5vZGUucXVlcnlTZWxlY3RvckFsbCgnLlNtYXJ0TmF2QmFyLWVkZ2UucmlnaHQnKVswXTtcclxuICAgIGlmICh0eXBlb2YgbGVmdGJ0biA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICBsZWZ0YnRuID0ge1xyXG4gICAgICAgICAgICBvZmZzZXRXaWR0aDogMCxcclxuICAgICAgICAgICAgY2xhc3NOYW1lOiAnJ1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHJpZ2h0YnRuID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIHJpZ2h0YnRuID0ge1xyXG4gICAgICAgICAgICBvZmZzZXRXaWR0aDogMCxcclxuICAgICAgICAgICAgY2xhc3NOYW1lOiAnJ1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHZhciBtYXJnaW4gPSBNYXRoLm1heChsZWZ0YnRuLm9mZnNldFdpZHRoLCByaWdodGJ0bi5vZmZzZXRXaWR0aCk7XHJcbiAgICBlbC5zdHlsZS5tYXJnaW5MZWZ0ID0gbWFyZ2luICsgJ3B4JztcclxuICAgIGVsLnN0eWxlLm1hcmdpblJpZ2h0ID0gbWFyZ2luICsgJ3B4JztcclxuICAgIHZhciB0b29Mb25nID0gKGVsLm9mZnNldFdpZHRoIDwgZWwuc2Nyb2xsV2lkdGgpID8gdHJ1ZSA6IGZhbHNlO1xyXG4gICAgaWYgKHRvb0xvbmcpIHtcclxuICAgICAgICBpZiAobGVmdGJ0bi5vZmZzZXRXaWR0aCA8IHJpZ2h0YnRuLm9mZnNldFdpZHRoKSB7XHJcbiAgICAgICAgICAgIGVsLnN0eWxlLm1hcmdpbkxlZnQgPSBsZWZ0YnRuLm9mZnNldFdpZHRoICsgJ3B4JztcclxuICAgICAgICAgICAgZWwuc3R5bGUudGV4dEFsaWduID0gJ3JpZ2h0JztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBlbC5zdHlsZS5tYXJnaW5SaWdodCA9IHJpZ2h0YnRuLm9mZnNldFdpZHRoICsgJ3B4JztcclxuICAgICAgICAgICAgZWwuc3R5bGUudGV4dEFsaWduID0gJ2xlZnQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0b29Mb25nID0gKGVsLm9mZnNldFdpZHRoPGVsLnNjcm9sbFdpZHRoKSA/IHRydWUgOiBmYWxzZTtcclxuICAgICAgICBpZiAodG9vTG9uZykge1xyXG4gICAgICAgICAgICBpZiAobmV3IFJlZ0V4cCgnYXJyb3cnKS50ZXN0KGxlZnRidG4uY2xhc3NOYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgY2xlYXJOb2RlKGxlZnRidG4uY2hpbGROb2Rlc1sxXSk7XHJcbiAgICAgICAgICAgICAgICBlbC5zdHlsZS5tYXJnaW5MZWZ0ID0gJzI2cHgnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChuZXcgUmVnRXhwKCdhcnJvdycpLnRlc3QocmlnaHRidG4uY2xhc3NOYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgY2xlYXJOb2RlKHJpZ2h0YnRuLmNoaWxkTm9kZXNbMV0pO1xyXG4gICAgICAgICAgICAgICAgZWwuc3R5bGUubWFyZ2luUmlnaHQgPSAnMjZweCc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnRzLnRleHRib3hSZXNpemUgPSB0ZXh0Ym94UmVzaXplO1xyXG5cclxuLyoqXHJcbiAgICBTbWFydE5hdkJhciBjbGFzcywgaW5zdGFudGlhdGUgd2l0aCBhIERPTSBlbGVtZW50XHJcbiAgICByZXByZXNlbnRpbmcgYSBuYXZiYXIuXHJcbiAgICBBUEk6XHJcbiAgICAtIHJlZnJlc2g6IHVwZGF0ZXMgdGhlIGNvbnRyb2wgdGFraW5nIGNhcmUgb2YgdGhlIG5lZWRlZFxyXG4gICAgICAgIHdpZHRoIGZvciB0aXRsZSBhbmQgYnV0dG9uc1xyXG4qKi9cclxudmFyIFNtYXJ0TmF2QmFyID0gZnVuY3Rpb24gU21hcnROYXZCYXIoZWwpIHtcclxuICAgIHRoaXMuZWwgPSBlbDtcclxuICAgIFxyXG4gICAgdGhpcy5yZWZyZXNoID0gZnVuY3Rpb24gcmVmcmVzaCgpIHtcclxuICAgICAgICB2YXIgaCA9ICQoZWwpLmNoaWxkcmVuKCdoMScpLmdldCgwKTtcclxuICAgICAgICBpZiAoaClcclxuICAgICAgICAgICAgdGV4dGJveFJlc2l6ZShoKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5yZWZyZXNoKCk7IFxyXG59O1xyXG5cclxuZXhwb3J0cy5TbWFydE5hdkJhciA9IFNtYXJ0TmF2QmFyO1xyXG5cclxuLyoqXHJcbiAgICBHZXQgaW5zdGFuY2VzIGZvciBhbGwgdGhlIFNtYXJ0TmF2QmFyIGVsZW1lbnRzIGluIHRoZSBET01cclxuKiovXHJcbmV4cG9ydHMuZ2V0QWxsID0gZnVuY3Rpb24gZ2V0QWxsKCkge1xyXG4gICAgdmFyIGFsbCA9ICQoJy5TbWFydE5hdkJhcicpO1xyXG4gICAgcmV0dXJuICQubWFwKGFsbCwgZnVuY3Rpb24oaXRlbSkgeyByZXR1cm4gbmV3IFNtYXJ0TmF2QmFyKGl0ZW0pOyB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgUmVmcmVzaCBhbGwgU21hcnROYXZCYXIgZm91bmQgaW4gdGhlIGRvY3VtZW50LlxyXG4qKi9cclxuZXhwb3J0cy5yZWZyZXNoQWxsID0gZnVuY3Rpb24gcmVmcmVzaEFsbCgpIHtcclxuICAgICQoJy5TbWFydE5hdkJhciA+IGgxJykuZWFjaChmdW5jdGlvbigpIHsgdGV4dGJveFJlc2l6ZSh0aGlzKTsgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgQ3VzdG9tIExvY29ub21pY3MgJ2xvY2FsZScgc3R5bGVzIGZvciBkYXRlL3RpbWVzLlxyXG4gICAgSXRzIGEgYml0IG1vcmUgJ2Nvb2wnIHJlbmRlcmluZyBkYXRlcyA7LSlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuLy8gU2luY2UgdGhlIHRhc2sgb2YgZGVmaW5lIGEgbG9jYWxlIGNoYW5nZXNcclxuLy8gdGhlIGN1cnJlbnQgZ2xvYmFsIGxvY2FsZSwgd2Ugc2F2ZSBhIHJlZmVyZW5jZVxyXG4vLyBhbmQgcmVzdG9yZSBpdCBsYXRlciBzbyBub3RoaW5nIGNoYW5nZWQuXHJcbnZhciBjdXJyZW50ID0gbW9tZW50LmxvY2FsZSgpO1xyXG5cclxubW9tZW50LmxvY2FsZSgnZW4tVVMtTEMnLCB7XHJcbiAgICBtZXJpZGllbVBhcnNlIDogL1thcF1cXC4/XFwuPy9pLFxyXG4gICAgbWVyaWRpZW0gOiBmdW5jdGlvbiAoaG91cnMsIG1pbnV0ZXMsIGlzTG93ZXIpIHtcclxuICAgICAgICBpZiAoaG91cnMgPiAxMSkge1xyXG4gICAgICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdwJyA6ICdQJztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdhJyA6ICdBJztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgY2FsZW5kYXIgOiB7XHJcbiAgICAgICAgbGFzdERheSA6ICdbWWVzdGVyZGF5XScsXHJcbiAgICAgICAgc2FtZURheSA6ICdbVG9kYXldJyxcclxuICAgICAgICBuZXh0RGF5IDogJ1tUb21vcnJvd10nLFxyXG4gICAgICAgIGxhc3RXZWVrIDogJ1tsYXN0XSBkZGRkJyxcclxuICAgICAgICBuZXh0V2VlayA6ICdkZGRkJyxcclxuICAgICAgICBzYW1lRWxzZSA6ICdNL0QnXHJcbiAgICB9LFxyXG4gICAgbG9uZ0RhdGVGb3JtYXQgOiB7XHJcbiAgICAgICAgTFQ6ICdoOm1tYScsXHJcbiAgICAgICAgTFRTOiAnaDptbTpzc2EnLFxyXG4gICAgICAgIEw6ICdNTS9ERC9ZWVlZJyxcclxuICAgICAgICBsOiAnTS9EL1lZWVknLFxyXG4gICAgICAgIExMOiAnTU1NTSBEbyBZWVlZJyxcclxuICAgICAgICBsbDogJ01NTSBEIFlZWVknLFxyXG4gICAgICAgIExMTDogJ01NTU0gRG8gWVlZWSBMVCcsXHJcbiAgICAgICAgbGxsOiAnTU1NIEQgWVlZWSBMVCcsXHJcbiAgICAgICAgTExMTDogJ2RkZGQsIE1NTU0gRG8gWVlZWSBMVCcsXHJcbiAgICAgICAgbGxsbDogJ2RkZCwgTU1NIEQgWVlZWSBMVCdcclxuICAgIH1cclxufSk7XHJcblxyXG4vLyBSZXN0b3JlIGxvY2FsZVxyXG5tb21lbnQubG9jYWxlKGN1cnJlbnQpO1xyXG4iLCIvKiogQXBwb2ludG1lbnQgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIENsaWVudCA9IHJlcXVpcmUoJy4vQ2xpZW50JyksXHJcbiAgICBMb2NhdGlvbiA9IHJlcXVpcmUoJy4vTG9jYXRpb24nKSxcclxuICAgIFNlcnZpY2UgPSByZXF1aXJlKCcuL1NlcnZpY2UnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG4gICBcclxuZnVuY3Rpb24gQXBwb2ludG1lbnQodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgaWQ6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3RhcnRUaW1lOiBudWxsLFxyXG4gICAgICAgIGVuZFRpbWU6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gRXZlbnQgc3VtbWFyeTpcclxuICAgICAgICBzdW1tYXJ5OiAnTmV3IGJvb2tpbmcnLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YnRvdGFsUHJpY2U6IDAsXHJcbiAgICAgICAgZmVlUHJpY2U6IDAsXHJcbiAgICAgICAgcGZlZVByaWNlOiAwLFxyXG4gICAgICAgIHRvdGFsUHJpY2U6IDAsXHJcbiAgICAgICAgcHRvdGFsUHJpY2U6IDAsXHJcbiAgICAgICAgXHJcbiAgICAgICAgcHJlTm90ZXNUb0NsaWVudDogbnVsbCxcclxuICAgICAgICBwb3N0Tm90ZXNUb0NsaWVudDogbnVsbCxcclxuICAgICAgICBwcmVOb3Rlc1RvU2VsZjogbnVsbCxcclxuICAgICAgICBwb3N0Tm90ZXNUb1NlbGY6IG51bGxcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHZhbHVlcyA9IHZhbHVlcyB8fCB7fTtcclxuXHJcbiAgICB0aGlzLmNsaWVudCA9IGtvLm9ic2VydmFibGUodmFsdWVzLmNsaWVudCA/IG5ldyBDbGllbnQodmFsdWVzLmNsaWVudCkgOiBudWxsKTtcclxuXHJcbiAgICB0aGlzLmxvY2F0aW9uID0ga28ub2JzZXJ2YWJsZShuZXcgTG9jYXRpb24odmFsdWVzLmxvY2F0aW9uKSk7XHJcbiAgICB0aGlzLmxvY2F0aW9uU3VtbWFyeSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxvY2F0aW9uKCkuc2luZ2xlTGluZSgpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2VydmljZXMgPSBrby5vYnNlcnZhYmxlQXJyYXkoKHZhbHVlcy5zZXJ2aWNlcyB8fCBbXSkubWFwKGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICByZXR1cm4gKHNlcnZpY2UgaW5zdGFuY2VvZiBTZXJ2aWNlKSA/IHNlcnZpY2UgOiBuZXcgU2VydmljZShzZXJ2aWNlKTtcclxuICAgIH0pKTtcclxuICAgIHRoaXMuc2VydmljZXNTdW1tYXJ5ID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VydmljZXMoKS5tYXAoZnVuY3Rpb24oc2VydmljZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc2VydmljZS5uYW1lKCk7XHJcbiAgICAgICAgfSkuam9pbignLCAnKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICAvLyBQcmljZSB1cGRhdGUgb24gc2VydmljZXMgY2hhbmdlc1xyXG4gICAgLy8gVE9ETyBJcyBub3QgY29tcGxldGUgZm9yIHByb2R1Y3Rpb25cclxuICAgIHRoaXMuc2VydmljZXMuc3Vic2NyaWJlKGZ1bmN0aW9uKHNlcnZpY2VzKSB7XHJcbiAgICAgICAgdGhpcy5wdG90YWxQcmljZShzZXJ2aWNlcy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwcmV2ICsgY3VyLnByaWNlKCk7XHJcbiAgICAgICAgfSwgMCkpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIFxyXG4gICAgLy8gU21hcnQgdmlzdWFsaXphdGlvbiBvZiBkYXRlIGFuZCB0aW1lXHJcbiAgICB0aGlzLmRpc3BsYXllZERhdGUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzLnN0YXJ0VGltZSgpKS5sb2NhbGUoJ2VuLVVTLUxDJykuY2FsZW5kYXIoKTtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmRpc3BsYXllZFN0YXJ0VGltZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbW9tZW50KHRoaXMuc3RhcnRUaW1lKCkpLmxvY2FsZSgnZW4tVVMtTEMnKS5mb3JtYXQoJ0xUJyk7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNwbGF5ZWRFbmRUaW1lID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBtb21lbnQodGhpcy5lbmRUaW1lKCkpLmxvY2FsZSgnZW4tVVMtTEMnKS5mb3JtYXQoJ0xUJyk7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNwbGF5ZWRUaW1lUmFuZ2UgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlzcGxheWVkU3RhcnRUaW1lKCkgKyAnLScgKyB0aGlzLmRpc3BsYXllZEVuZFRpbWUoKTtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLml0U3RhcnRlZCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKHRoaXMuc3RhcnRUaW1lKCkgJiYgbmV3IERhdGUoKSA+PSB0aGlzLnN0YXJ0VGltZSgpKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLml0RW5kZWQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLmVuZFRpbWUoKSAmJiBuZXcgRGF0ZSgpID49IHRoaXMuZW5kVGltZSgpKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmlzTmV3ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAoIXRoaXMuaWQoKSk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5zdGF0ZUhlYWRlciA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgdGV4dCA9ICcnO1xyXG4gICAgICAgIGlmICghdGhpcy5pc05ldygpKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLml0U3RhcnRlZCgpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pdEVuZGVkKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gJ0NvbXBsZXRlZDonO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dCA9ICdOb3c6JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRleHQgPSAnVXBjb21pbmc6JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRleHQ7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBcHBvaW50bWVudDtcclxuIiwiLyoqIEJvb2tpbmdTdW1tYXJ5IG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuICAgIFxyXG5mdW5jdGlvbiBCb29raW5nU3VtbWFyeSh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBxdWFudGl0eTogMCxcclxuICAgICAgICBjb25jZXB0OiAnJyxcclxuICAgICAgICB0aW1lOiBudWxsLFxyXG4gICAgICAgIHRpbWVGb3JtYXQ6ICcgW0BdIGg6bW1hJ1xyXG4gICAgfSwgdmFsdWVzKTtcclxuXHJcbiAgICB0aGlzLnBocmFzZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpe1xyXG4gICAgICAgIHZhciB0ID0gdGhpcy50aW1lRm9ybWF0KCkgJiYgXHJcbiAgICAgICAgICAgIHRoaXMudGltZSgpICYmIFxyXG4gICAgICAgICAgICBtb21lbnQodGhpcy50aW1lKCkpLmZvcm1hdCh0aGlzLnRpbWVGb3JtYXQoKSkgfHxcclxuICAgICAgICAgICAgJyc7ICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpcy5jb25jZXB0KCkgKyB0O1xyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgdGhpcy51cmwgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IHRoaXMudGltZSgpICYmXHJcbiAgICAgICAgICAgICcvY2FsZW5kYXIvJyArIHRoaXMudGltZSgpLnRvSVNPU3RyaW5nKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHVybDtcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJvb2tpbmdTdW1tYXJ5O1xyXG4iLCIvKipcclxuICAgIEV2ZW50IG1vZGVsXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vKiBFeGFtcGxlIEpTT04gKHJldHVybmVkIGJ5IHRoZSBSRVNUIEFQSSk6XHJcbntcclxuICBcIkV2ZW50SURcIjogMzUzLFxyXG4gIFwiVXNlcklEXCI6IDE0MSxcclxuICBcIkV2ZW50VHlwZUlEXCI6IDMsXHJcbiAgXCJTdW1tYXJ5XCI6IFwiSG91c2VrZWVwZXIgc2VydmljZXMgZm9yIEpvc2h1YVByb3ZpZGVyIEQuXCIsXHJcbiAgXCJBdmFpbGFiaWxpdHlUeXBlSURcIjogMyxcclxuICBcIlN0YXJ0VGltZVwiOiBcIjIwMTQtMDMtMjVUMDg6MDA6MDBaXCIsXHJcbiAgXCJFbmRUaW1lXCI6IFwiMjAxNC0wMy0yNVQxODowMDowMFpcIixcclxuICBcIktpbmRcIjogMCxcclxuICBcIklzQWxsRGF5XCI6IGZhbHNlLFxyXG4gIFwiVGltZVpvbmVcIjogXCIwMTowMDowMFwiLFxyXG4gIFwiTG9jYXRpb25cIjogXCJudWxsXCIsXHJcbiAgXCJVcGRhdGVkRGF0ZVwiOiBcIjIwMTQtMTAtMzBUMTU6NDQ6NDkuNjUzXCIsXHJcbiAgXCJDcmVhdGVkRGF0ZVwiOiBudWxsLFxyXG4gIFwiRGVzY3JpcHRpb25cIjogXCJ0ZXN0IGRlc2NyaXB0aW9uIG9mIGEgUkVTVCBldmVudFwiLFxyXG4gIFwiUmVjdXJyZW5jZVJ1bGVcIjoge1xyXG4gICAgXCJGcmVxdWVuY3lUeXBlSURcIjogNTAyLFxyXG4gICAgXCJJbnRlcnZhbFwiOiAxLFxyXG4gICAgXCJVbnRpbFwiOiBcIjIwMTQtMDctMDFUMDA6MDA6MDBcIixcclxuICAgIFwiQ291bnRcIjogbnVsbCxcclxuICAgIFwiRW5kaW5nXCI6IFwiZGF0ZVwiLFxyXG4gICAgXCJTZWxlY3RlZFdlZWtEYXlzXCI6IFtcclxuICAgICAgMSxcclxuICAgIF0sXHJcbiAgICBcIk1vbnRobHlXZWVrRGF5XCI6IGZhbHNlLFxyXG4gICAgXCJJbmNvbXBhdGlibGVcIjogZmFsc2UsXHJcbiAgICBcIlRvb01hbnlcIjogZmFsc2VcclxuICB9LFxyXG4gIFwiUmVjdXJyZW5jZU9jY3VycmVuY2VzXCI6IG51bGwsXHJcbiAgXCJSZWFkT25seVwiOiBmYWxzZVxyXG59Ki9cclxuXHJcbmZ1bmN0aW9uIFJlY3VycmVuY2VSdWxlKHZhbHVlcykge1xyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgZnJlcXVlbmN5VHlwZUlEOiAwLFxyXG4gICAgICAgIGludGVydmFsOiAxLCAvLzpJbnRlZ2VyXHJcbiAgICAgICAgdW50aWw6IG51bGwsIC8vOkRhdGVcclxuICAgICAgICBjb3VudDogbnVsbCwgLy86SW50ZWdlclxyXG4gICAgICAgIGVuZGluZzogbnVsbCwgLy8gOnN0cmluZyBQb3NzaWJsZSB2YWx1ZXMgYWxsb3dlZDogJ25ldmVyJywgJ2RhdGUnLCAnb2N1cnJlbmNlcydcclxuICAgICAgICBzZWxlY3RlZFdlZWtEYXlzOiBbXSwgLy8gOmludGVnZXJbXSAwOlN1bmRheVxyXG4gICAgICAgIG1vbnRobHlXZWVrRGF5OiBmYWxzZSxcclxuICAgICAgICBpbmNvbXBhdGlibGU6IGZhbHNlLFxyXG4gICAgICAgIHRvb01hbnk6IGZhbHNlXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBSZWN1cnJlbmNlT2NjdXJyZW5jZSh2YWx1ZXMpIHtcclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbnVsbCwgLy86RGF0ZVxyXG4gICAgICAgIGVuZFRpbWU6IG51bGwgLy86RGF0ZVxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbiAgIFxyXG5mdW5jdGlvbiBDYWxlbmRhckV2ZW50KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBjYWxlbmRhckV2ZW50SUQ6IDAsXHJcbiAgICAgICAgdXNlcklEOiAwLFxyXG4gICAgICAgIGV2ZW50VHlwZUlEOiAzLFxyXG4gICAgICAgIHN1bW1hcnk6ICcnLFxyXG4gICAgICAgIGF2YWlsYWJpbGl0eVR5cGVJRDogMCxcclxuICAgICAgICBzdGFydFRpbWU6IG51bGwsXHJcbiAgICAgICAgZW5kVGltZTogbnVsbCxcclxuICAgICAgICBraW5kOiAwLFxyXG4gICAgICAgIGlzQWxsRGF5OiBmYWxzZSxcclxuICAgICAgICB0aW1lWm9uZTogJ1onLFxyXG4gICAgICAgIGxvY2F0aW9uOiBudWxsLFxyXG4gICAgICAgIHVwZGF0ZWREYXRlOiBudWxsLFxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBudWxsLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnJyxcclxuICAgICAgICByZWFkT25seTogZmFsc2VcclxuICAgIH0sIHZhbHVlcyk7XHJcblxyXG4gICAgdGhpcy5yZWN1cnJlbmNlUnVsZSA9IGtvLm9ic2VydmFibGUoXHJcbiAgICAgICAgdmFsdWVzICYmIFxyXG4gICAgICAgIHZhbHVlcy5yZWN1cnJlbmNlUnVsZSAmJiBcclxuICAgICAgICBuZXcgUmVjdXJyZW5jZVJ1bGUodmFsdWVzLnJlY3VycmVuY2VSdWxlKVxyXG4gICAgKTtcclxuICAgIHRoaXMucmVjdXJyZW5jZU9jY3VycmVuY2VzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTsgLy86UmVjdXJyZW5jZU9jY3VycmVuY2VbXVxyXG4gICAgaWYgKHZhbHVlcyAmJiB2YWx1ZXMucmVjdXJyZW5jZU9jY3VycmVuY2VzKSB7XHJcbiAgICAgICAgdmFsdWVzLnJlY3VycmVuY2VPY2N1cnJlbmNlcy5mb3JFYWNoKGZ1bmN0aW9uKG9jY3VycmVuY2UpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuUmVjdXJyZW5jZU9jY3VycmVuY2VzLnB1c2gobmV3IFJlY3VycmVuY2VPY2N1cnJlbmNlKG9jY3VycmVuY2UpKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDYWxlbmRhckV2ZW50O1xyXG5cclxuQ2FsZW5kYXJFdmVudC5SZWN1cnJlbmNlUnVsZSA9IFJlY3VycmVuY2VSdWxlO1xyXG5DYWxlbmRhckV2ZW50LlJlY3VycmVuY2VPY2N1cnJlbmNlID0gUmVjdXJyZW5jZU9jY3VycmVuY2U7IiwiLyoqIENhbGVuZGFyU2xvdCBtb2RlbC5cclxuXHJcbiAgICBEZXNjcmliZXMgYSB0aW1lIHNsb3QgaW4gdGhlIGNhbGVuZGFyLCBmb3IgYSBjb25zZWN1dGl2ZVxyXG4gICAgZXZlbnQsIGFwcG9pbnRtZW50IG9yIGZyZWUgdGltZS5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBDbGllbnQgPSByZXF1aXJlKCcuL0NsaWVudCcpO1xyXG5cclxuZnVuY3Rpb24gQ2FsZW5kYXJTbG90KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbnVsbCxcclxuICAgICAgICBlbmRUaW1lOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICcnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICcnXHJcblxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDYWxlbmRhclNsb3Q7XHJcbiIsIi8qKiBDbGllbnQgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIENsaWVudCh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgaWQ6IDAsXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnJyxcclxuICAgICAgICBsYXN0TmFtZTogJycsXHJcbiAgICAgICAgZW1haWw6ICcnLFxyXG4gICAgICAgIG1vYmlsZVBob25lOiBudWxsLFxyXG4gICAgICAgIGFsdGVybmF0ZVBob25lOiBudWxsLFxyXG4gICAgICAgIGJpcnRoTW9udGhEYXk6IG51bGwsXHJcbiAgICAgICAgYmlydGhNb250aDogbnVsbCxcclxuICAgICAgICBub3Rlc0Fib3V0Q2xpZW50OiBudWxsXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG5cclxuICAgIHRoaXMuZnVsbE5hbWUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLmZpcnN0TmFtZSgpICsgJyAnICsgdGhpcy5sYXN0TmFtZSgpKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmJpcnRoRGF5ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmJpcnRoTW9udGhEYXkoKSAmJlxyXG4gICAgICAgICAgICB0aGlzLmJpcnRoTW9udGgoKSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVE9ETyBpMTBuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJpcnRoTW9udGgoKSArICcvJyArIHRoaXMuYmlydGhNb250aERheSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMucGhvbmVOdW1iZXIgPSBrby5wdXJlQ29tcHV0ZWQoe1xyXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgbSA9IHRoaXMubW9iaWxlUGhvbmUoKSxcclxuICAgICAgICAgICAgICAgIGEgPSB0aGlzLmFsdGVybmF0ZVBob25lKCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbSA/IG0gOiBhO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgICAgLy8gVE9ET1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3duZXI6IHRoaXNcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLmNhblJlY2VpdmVTbXMgPSBrby5wdXJlQ29tcHV0ZWQoe1xyXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgbSA9IHRoaXMubW9iaWxlUGhvbmUoKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBtID8gdHJ1ZSA6IGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgICAgLy8gVE9ET1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3duZXI6IHRoaXNcclxuICAgIH0pO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENsaWVudDtcclxuIiwiLyoqIEdldE1vcmUgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIExpc3RWaWV3SXRlbSA9IHJlcXVpcmUoJy4vTGlzdFZpZXdJdGVtJyk7XHJcblxyXG5mdW5jdGlvbiBHZXRNb3JlKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgYXZhaWxhYmlsaXR5OiBmYWxzZSxcclxuICAgICAgICBwYXltZW50czogZmFsc2UsXHJcbiAgICAgICAgcHJvZmlsZTogZmFsc2UsXHJcbiAgICAgICAgY29vcDogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHZhciBhdmFpbGFibGVJdGVtcyA9IHtcclxuICAgICAgICBhdmFpbGFiaWxpdHk6IG5ldyBMaXN0Vmlld0l0ZW0oe1xyXG4gICAgICAgICAgICBjb250ZW50TGluZTE6ICdDb21wbGV0ZSB5b3VyIGF2YWlsYWJpbGl0eSB0byBjcmVhdGUgYSBjbGVhbmVyIGNhbGVuZGFyJyxcclxuICAgICAgICAgICAgbWFya2VySWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tY2FsZW5kYXInLFxyXG4gICAgICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0J1xyXG4gICAgICAgIH0pLFxyXG4gICAgICAgIHBheW1lbnRzOiBuZXcgTGlzdFZpZXdJdGVtKHtcclxuICAgICAgICAgICAgY29udGVudExpbmUxOiAnU3RhcnQgYWNjZXB0aW5nIHBheW1lbnRzIHRocm91Z2ggTG9jb25vbWljcycsXHJcbiAgICAgICAgICAgIG1hcmtlckljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXVzZCcsXHJcbiAgICAgICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tcmlnaHQnXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgcHJvZmlsZTogbmV3IExpc3RWaWV3SXRlbSh7XHJcbiAgICAgICAgICAgIGNvbnRlbnRMaW5lMTogJ0FjdGl2YXRlIHlvdXIgcHJvZmlsZSBpbiB0aGUgbWFya2V0cGxhY2UnLFxyXG4gICAgICAgICAgICBtYXJrZXJJY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi11c2VyJyxcclxuICAgICAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1yaWdodCdcclxuICAgICAgICB9KSxcclxuICAgICAgICBjb29wOiBuZXcgTGlzdFZpZXdJdGVtKHtcclxuICAgICAgICAgICAgY29udGVudExpbmUxOiAnTGVhcm4gbW9yZSBhYm91dCBvdXIgY29vcGVyYXRpdmUnLFxyXG4gICAgICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0J1xyXG4gICAgICAgIH0pXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXRlbXMgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGl0ZW1zID0gW107XHJcbiAgICAgICAgXHJcbiAgICAgICAgT2JqZWN0LmtleXMoYXZhaWxhYmxlSXRlbXMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAodGhpc1trZXldKCkpXHJcbiAgICAgICAgICAgICAgICBpdGVtcy5wdXNoKGF2YWlsYWJsZUl0ZW1zW2tleV0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBpdGVtcztcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEdldE1vcmU7XHJcbiIsIi8qKiBMaXN0Vmlld0l0ZW0gbW9kZWwuXHJcblxyXG4gICAgRGVzY3JpYmVzIGEgZ2VuZXJpYyBpdGVtIG9mIGFcclxuICAgIExpc3RWaWV3IGNvbXBvbmVudC5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbmZ1bmN0aW9uIExpc3RWaWV3SXRlbSh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBtYXJrZXJMaW5lMTogbnVsbCxcclxuICAgICAgICBtYXJrZXJMaW5lMjogbnVsbCxcclxuICAgICAgICBtYXJrZXJJY29uOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnRlbnRMaW5lMTogJycsXHJcbiAgICAgICAgY29udGVudExpbmUyOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICcnXHJcblxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMaXN0Vmlld0l0ZW07XHJcbiIsIi8qKiBMb2NhdGlvbiBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gTG9jYXRpb24odmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgbG9jYXRpb25JRDogMCxcclxuICAgICAgICBuYW1lOiAnJyxcclxuICAgICAgICBhZGRyZXNzTGluZTE6IG51bGwsXHJcbiAgICAgICAgYWRkcmVzc0xpbmUyOiBudWxsLFxyXG4gICAgICAgIGNpdHk6IG51bGwsXHJcbiAgICAgICAgc3RhdGVQcm92aW5jZUNvZGU6IG51bGwsXHJcbiAgICAgICAgc3RhdGVQcm92aWNlSUQ6IG51bGwsXHJcbiAgICAgICAgcG9zdGFsQ29kZTogbnVsbCxcclxuICAgICAgICBwb3N0YWxDb2RlSUQ6IG51bGwsXHJcbiAgICAgICAgY291bnRyeUlEOiBudWxsLFxyXG4gICAgICAgIGxhdGl0dWRlOiBudWxsLFxyXG4gICAgICAgIGxvbmdpdHVkZTogbnVsbCxcclxuICAgICAgICBzcGVjaWFsSW5zdHJ1Y3Rpb25zOiBudWxsLFxyXG4gICAgICAgIGlzU2VydmljZVJhZGl1czogZmFsc2UsXHJcbiAgICAgICAgaXNTZXJ2aWNlTG9jYXRpb246IGZhbHNlLFxyXG4gICAgICAgIHNlcnZpY2VSYWRpdXM6IDBcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2luZ2xlTGluZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBsaXN0ID0gW1xyXG4gICAgICAgICAgICB0aGlzLmFkZHJlc3NMaW5lMSgpLFxyXG4gICAgICAgICAgICB0aGlzLmNpdHkoKSxcclxuICAgICAgICAgICAgdGhpcy5wb3N0YWxDb2RlKCksXHJcbiAgICAgICAgICAgIHRoaXMuc3RhdGVQcm92aW5jZUNvZGUoKVxyXG4gICAgICAgIF07XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGxpc3QuZmlsdGVyKGZ1bmN0aW9uKHYpIHsgcmV0dXJuICEhdjsgfSkuam9pbignLCAnKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmNvdW50cnlOYW1lID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5jb3VudHJ5SUQoKSA9PT0gMSA/XHJcbiAgICAgICAgICAgICdVbml0ZWQgU3RhdGVzJyA6XHJcbiAgICAgICAgICAgIHRoaXMuY291bnRyeUlEKCkgPT09IDIgP1xyXG4gICAgICAgICAgICAnU3BhaW4nIDpcclxuICAgICAgICAgICAgJ3Vua25vdydcclxuICAgICAgICApO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuY291bnRyeUNvZGVBbHBoYTIgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmNvdW50cnlJRCgpID09PSAxID9cclxuICAgICAgICAgICAgJ1VTJyA6XHJcbiAgICAgICAgICAgIHRoaXMuY291bnRyeUlEKCkgPT09IDIgP1xyXG4gICAgICAgICAgICAnRVMnIDpcclxuICAgICAgICAgICAgJydcclxuICAgICAgICApO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubGF0bG5nID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgbGF0OiB0aGlzLmxhdGl0dWRlKCksXHJcbiAgICAgICAgICAgIGxuZzogdGhpcy5sb25naXR1ZGUoKVxyXG4gICAgICAgIH07XHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMb2NhdGlvbjtcclxuIiwiLyoqIE1haWxGb2xkZXIgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpLFxyXG4gICAgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xyXG5cclxuZnVuY3Rpb24gTWFpbEZvbGRlcih2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIG1lc3NhZ2VzOiBbXSxcclxuICAgICAgICB0b3BOdW1iZXI6IDEwXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnRvcCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbiB0b3AobnVtKSB7XHJcbiAgICAgICAgaWYgKG51bSkgdGhpcy50b3BOdW1iZXIobnVtKTtcclxuICAgICAgICByZXR1cm4gXy5maXJzdCh0aGlzLm1lc3NhZ2VzKCksIHRoaXMudG9wTnVtYmVyKCkpO1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWFpbEZvbGRlcjtcclxuIiwiLyoqIE1lc3NhZ2UgbW9kZWwuXHJcblxyXG4gICAgRGVzY3JpYmVzIGEgbWVzc2FnZSBmcm9tIGEgTWFpbEZvbGRlci5cclxuICAgIEEgbWVzc2FnZSBjb3VsZCBiZSBvZiBkaWZmZXJlbnQgdHlwZXMsXHJcbiAgICBhcyBpbnF1aXJpZXMsIGJvb2tpbmdzLCBib29raW5nIHJlcXVlc3RzLlxyXG4gKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG4vL1RPRE8gICBUaHJlYWQgPSByZXF1aXJlKCcuL1RocmVhZCcpO1xyXG5cclxuZnVuY3Rpb24gTWVzc2FnZSh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBpZDogMCxcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnJyxcclxuICAgICAgICBjb250ZW50OiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICcnXHJcblxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgLy8gU21hcnQgdmlzdWFsaXphdGlvbiBvZiBkYXRlIGFuZCB0aW1lXHJcbiAgICB0aGlzLmRpc3BsYXllZERhdGUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzLmNyZWF0ZWREYXRlKCkpLmxvY2FsZSgnZW4tVVMtTEMnKS5jYWxlbmRhcigpO1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzcGxheWVkVGltZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbW9tZW50KHRoaXMuY3JlYXRlZERhdGUoKSkubG9jYWxlKCdlbi1VUy1MQycpLmZvcm1hdCgnTFQnKTtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1lc3NhZ2U7XHJcbiIsIi8qKlxyXG4gICAgTW9kZWwgY2xhc3MgdG8gaGVscCBidWlsZCBtb2RlbHMuXHJcblxyXG4gICAgSXMgbm90IGV4YWN0bHkgYW4gJ09PUCBiYXNlJyBjbGFzcywgYnV0IHByb3ZpZGVzXHJcbiAgICB1dGlsaXRpZXMgdG8gbW9kZWxzIGFuZCBhIG1vZGVsIGRlZmluaXRpb24gb2JqZWN0XHJcbiAgICB3aGVuIGV4ZWN1dGVkIGluIHRoZWlyIGNvbnN0cnVjdG9ycyBhczpcclxuICAgIFxyXG4gICAgJycnXHJcbiAgICBmdW5jdGlvbiBNeU1vZGVsKCkge1xyXG4gICAgICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgICAgIC8vIE5vdywgdGhlcmUgaXMgYSB0aGlzLm1vZGVsIHByb3BlcnR5IHdpdGhcclxuICAgICAgICAvLyBhbiBpbnN0YW5jZSBvZiB0aGUgTW9kZWwgY2xhc3MsIHdpdGggXHJcbiAgICAgICAgLy8gdXRpbGl0aWVzIGFuZCBtb2RlbCBzZXR0aW5ncy5cclxuICAgIH1cclxuICAgICcnJ1xyXG4gICAgXHJcbiAgICBUaGF0IGF1dG8gY3JlYXRpb24gb2YgJ21vZGVsJyBwcm9wZXJ0eSBjYW4gYmUgYXZvaWRlZFxyXG4gICAgd2hlbiB1c2luZyB0aGUgb2JqZWN0IGluc3RhbnRpYXRpb24gc3ludGF4ICgnbmV3JyBrZXl3b3JkKTpcclxuICAgIFxyXG4gICAgJycnXHJcbiAgICB2YXIgbW9kZWwgPSBuZXcgTW9kZWwob2JqKTtcclxuICAgIC8vIFRoZXJlIGlzIG5vIGEgJ29iai5tb2RlbCcgcHJvcGVydHksIGNhbiBiZVxyXG4gICAgLy8gYXNzaWduZWQgdG8gd2hhdGV2ZXIgcHJvcGVydHkgb3Igbm90aGluZy5cclxuICAgICcnJ1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG5rby5tYXBwaW5nID0gcmVxdWlyZSgna25vY2tvdXQubWFwcGluZycpO1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgY2xvbmUgPSBmdW5jdGlvbihvYmopIHsgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHt9LCBvYmopOyB9O1xyXG5cclxuZnVuY3Rpb24gTW9kZWwobW9kZWxPYmplY3QpIHtcclxuICAgIFxyXG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIE1vZGVsKSkge1xyXG4gICAgICAgIC8vIEV4ZWN1dGVkIGFzIGEgZnVuY3Rpb24sIGl0IG11c3QgY3JlYXRlXHJcbiAgICAgICAgLy8gYSBNb2RlbCBpbnN0YW5jZVxyXG4gICAgICAgIHZhciBtb2RlbCA9IG5ldyBNb2RlbChtb2RlbE9iamVjdCk7XHJcbiAgICAgICAgLy8gYW5kIHJlZ2lzdGVyIGF1dG9tYXRpY2FsbHkgYXMgcGFydFxyXG4gICAgICAgIC8vIG9mIHRoZSBtb2RlbE9iamVjdCBpbiAnbW9kZWwnIHByb3BlcnR5XHJcbiAgICAgICAgbW9kZWxPYmplY3QubW9kZWwgPSBtb2RlbDtcclxuICAgICAgICBcclxuICAgICAgICAvLyBSZXR1cm5zIHRoZSBpbnN0YW5jZVxyXG4gICAgICAgIHJldHVybiBtb2RlbDtcclxuICAgIH1cclxuIFxyXG4gICAgLy8gSXQgaW5jbHVkZXMgYSByZWZlcmVuY2UgdG8gdGhlIG9iamVjdFxyXG4gICAgdGhpcy5tb2RlbE9iamVjdCA9IG1vZGVsT2JqZWN0O1xyXG4gICAgLy8gSXQgbWFpbnRhaW5zIGEgbGlzdCBvZiBwcm9wZXJ0aWVzIGFuZCBmaWVsZHNcclxuICAgIHRoaXMucHJvcGVydGllc0xpc3QgPSBbXTtcclxuICAgIHRoaXMuZmllbGRzTGlzdCA9IFtdO1xyXG4gICAgLy8gSXQgYWxsb3cgc2V0dGluZyB0aGUgJ2tvLm1hcHBpbmcuZnJvbUpTJyBtYXBwaW5nIG9wdGlvbnNcclxuICAgIC8vIHRvIGNvbnRyb2wgY29udmVyc2lvbnMgZnJvbSBwbGFpbiBKUyBvYmplY3RzIHdoZW4gXHJcbiAgICAvLyAndXBkYXRlV2l0aCcuXHJcbiAgICB0aGlzLm1hcHBpbmdPcHRpb25zID0ge307XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTW9kZWw7XHJcblxyXG4vKipcclxuICAgIERlZmluZSBvYnNlcnZhYmxlIHByb3BlcnRpZXMgdXNpbmcgdGhlIGdpdmVuXHJcbiAgICBwcm9wZXJ0aWVzIG9iamVjdCBkZWZpbml0aW9uIHRoYXQgaW5jbHVkZXMgZGUgZGVmYXVsdCB2YWx1ZXMsXHJcbiAgICBhbmQgc29tZSBvcHRpb25hbCBpbml0aWFsVmFsdWVzIChub3JtYWxseSB0aGF0IGlzIHByb3ZpZGVkIGV4dGVybmFsbHlcclxuICAgIGFzIGEgcGFyYW1ldGVyIHRvIHRoZSBtb2RlbCBjb25zdHJ1Y3Rvciwgd2hpbGUgZGVmYXVsdCB2YWx1ZXMgYXJlXHJcbiAgICBzZXQgaW4gdGhlIGNvbnN0cnVjdG9yKS5cclxuICAgIFRoYXQgcHJvcGVydGllcyBiZWNvbWUgbWVtYmVycyBvZiB0aGUgbW9kZWxPYmplY3QsIHNpbXBsaWZ5aW5nIFxyXG4gICAgbW9kZWwgZGVmaW5pdGlvbnMuXHJcbiAgICBcclxuICAgIEl0IHVzZXMgS25vY2tvdXQub2JzZXJ2YWJsZSBhbmQgb2JzZXJ2YWJsZUFycmF5LCBzbyBwcm9wZXJ0aWVzXHJcbiAgICBhcmUgZnVudGlvbnMgdGhhdCByZWFkcyB0aGUgdmFsdWUgd2hlbiBubyBhcmd1bWVudHMgb3Igc2V0cyB3aGVuXHJcbiAgICBvbmUgYXJndW1lbnQgaXMgcGFzc2VkIG9mLlxyXG4qKi9cclxuTW9kZWwucHJvdG90eXBlLmRlZlByb3BlcnRpZXMgPSBmdW5jdGlvbiBkZWZQcm9wZXJ0aWVzKHByb3BlcnRpZXMsIGluaXRpYWxWYWx1ZXMpIHtcclxuXHJcbiAgICBpbml0aWFsVmFsdWVzID0gaW5pdGlhbFZhbHVlcyB8fCB7fTtcclxuXHJcbiAgICB2YXIgbW9kZWxPYmplY3QgPSB0aGlzLm1vZGVsT2JqZWN0LFxyXG4gICAgICAgIHByb3BlcnRpZXNMaXN0ID0gdGhpcy5wcm9wZXJ0aWVzTGlzdDtcclxuXHJcbiAgICBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBkZWZWYWwgPSBwcm9wZXJ0aWVzW2tleV07XHJcbiAgICAgICAgLy8gQ3JlYXRlIG9ic2VydmFibGUgcHJvcGVydHkgd2l0aCBkZWZhdWx0IHZhbHVlXHJcbiAgICAgICAgbW9kZWxPYmplY3Rba2V5XSA9IEFycmF5LmlzQXJyYXkoZGVmVmFsKSA/XHJcbiAgICAgICAgICAgIGtvLm9ic2VydmFibGVBcnJheShkZWZWYWwpIDpcclxuICAgICAgICAgICAga28ub2JzZXJ2YWJsZShkZWZWYWwpO1xyXG4gICAgICAgIC8vIFJlbWVtYmVyIGRlZmF1bHRcclxuICAgICAgICBtb2RlbE9iamVjdFtrZXldLl9kZWZhdWx0VmFsdWUgPSBkZWZWYWw7XHJcbiAgICAgICAgLy8gcmVtZW1iZXIgaW5pdGlhbFxyXG4gICAgICAgIG1vZGVsT2JqZWN0W2tleV0uX2luaXRpYWxWYWx1ZSA9IGluaXRpYWxWYWx1ZXNba2V5XTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBJZiB0aGVyZSBpcyBhbiBpbml0aWFsVmFsdWUsIHNldCBpdDpcclxuICAgICAgICBpZiAodHlwZW9mKGluaXRpYWxWYWx1ZXNba2V5XSkgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIG1vZGVsT2JqZWN0W2tleV0oaW5pdGlhbFZhbHVlc1trZXldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQWRkIHRvIHRoZSBpbnRlcm5hbCByZWdpc3RyeVxyXG4gICAgICAgIHByb3BlcnRpZXNMaXN0LnB1c2goa2V5KTtcclxuICAgIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBEZWZpbmUgZmllbGRzIGFzIHBsYWluIG1lbWJlcnMgb2YgdGhlIG1vZGVsT2JqZWN0IHVzaW5nXHJcbiAgICB0aGUgZmllbGRzIG9iamVjdCBkZWZpbml0aW9uIHRoYXQgaW5jbHVkZXMgZGVmYXVsdCB2YWx1ZXMsXHJcbiAgICBhbmQgc29tZSBvcHRpb25hbCBpbml0aWFsVmFsdWVzLlxyXG4gICAgXHJcbiAgICBJdHMgbGlrZSBkZWZQcm9wZXJ0aWVzLCBidXQgZm9yIHBsYWluIGpzIHZhbHVlcyByYXRoZXIgdGhhbiBvYnNlcnZhYmxlcy5cclxuKiovXHJcbk1vZGVsLnByb3RvdHlwZS5kZWZGaWVsZHMgPSBmdW5jdGlvbiBkZWZGaWVsZHMoZmllbGRzLCBpbml0aWFsVmFsdWVzKSB7XHJcblxyXG4gICAgaW5pdGlhbFZhbHVlcyA9IGluaXRpYWxWYWx1ZXMgfHwge307XHJcblxyXG4gICAgdmFyIG1vZGVsT2JqZWN0ID0gdGhpcy5tb2RlbE9iamVjdCxcclxuICAgICAgICBmaWVsZHNMaXN0ID0gdGhpcy5maWVsZHNMaXN0O1xyXG5cclxuICAgIE9iamVjdC5rZXlzKGZpZWxkcykuZWFjaChmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgZGVmVmFsID0gZmllbGRzW2tleV07XHJcbiAgICAgICAgLy8gQ3JlYXRlIGZpZWxkIHdpdGggZGVmYXVsdCB2YWx1ZVxyXG4gICAgICAgIG1vZGVsT2JqZWN0W2tleV0gPSBkZWZWYWw7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgYW4gaW5pdGlhbFZhbHVlLCBzZXQgaXQ6XHJcbiAgICAgICAgaWYgKHR5cGVvZihpbml0aWFsVmFsdWVzW2tleV0pICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICBtb2RlbE9iamVjdFtrZXldID0gaW5pdGlhbFZhbHVlc1trZXldO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBBZGQgdG8gdGhlIGludGVybmFsIHJlZ2lzdHJ5XHJcbiAgICAgICAgZmllbGRzTGlzdC5wdXNoKGtleSk7XHJcbiAgICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgU3RvcmUgdGhlIGxpc3Qgb2YgZmllbGRzIHRoYXQgbWFrZSB0aGUgSUQvcHJpbWFyeSBrZXlcclxuICAgIGFuZCBjcmVhdGUgYW4gYWxpYXMgJ2lkJyBwcm9wZXJ0eSB0aGF0IHJldHVybnMgdGhlXHJcbiAgICB2YWx1ZSBmb3IgdGhlIElEIGZpZWxkIG9yIGFycmF5IG9mIHZhbHVlcyB3aGVuIG11bHRpcGxlXHJcbiAgICBmaWVsZHMuXHJcbioqL1xyXG5Nb2RlbC5wcm90b3R5cGUuZGVmSUQgPSBmdW5jdGlvbiBkZWZJRChmaWVsZHNOYW1lcykge1xyXG4gICAgXHJcbiAgICAvLyBTdG9yZSB0aGUgbGlzdFxyXG4gICAgdGhpcy5pZEZpZWxkc05hbWVzID0gZmllbGRzTmFtZXM7XHJcbiAgICBcclxuICAgIC8vIERlZmluZSBJRCBvYnNlcnZhYmxlXHJcbiAgICBpZiAoZmllbGRzTmFtZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgLy8gUmV0dXJucyBzaW5nbGUgdmFsdWVcclxuICAgICAgICB2YXIgZmllbGQgPSBmaWVsZHNOYW1lc1swXTtcclxuICAgICAgICB0aGlzLm1vZGVsT2JqZWN0LmlkID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1tmaWVsZF0oKTtcclxuICAgICAgICB9LCB0aGlzLm1vZGVsT2JqZWN0KTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHRoaXMubW9kZWxPYmplY3QuaWQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmaWVsZHNOYW1lcy5tYXAoZnVuY3Rpb24oZmllbGROYW1lKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1tmaWVsZF0oKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB9LCB0aGlzLm1vZGVsT2JqZWN0KTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gICAgUmV0dXJucyBhIHBsYWluIG9iamVjdCB3aXRoIHRoZSBwcm9wZXJ0aWVzIGFuZCBmaWVsZHNcclxuICAgIG9mIHRoZSBtb2RlbCBvYmplY3QsIGp1c3QgdmFsdWVzLlxyXG4gICAgXHJcbiAgICBAcGFyYW0gZGVlcENvcHk6Ym9vbCBJZiBsZWZ0IHVuZGVmaW5lZCwgZG8gbm90IGNvcHkgb2JqZWN0cyBpblxyXG4gICAgdmFsdWVzIGFuZCBub3QgcmVmZXJlbmNlcy4gSWYgZmFsc2UsIGRvIGEgc2hhbGxvdyBjb3B5LCBzZXR0aW5nXHJcbiAgICB1cCByZWZlcmVuY2VzIGluIHRoZSByZXN1bHQuIElmIHRydWUsIHRvIGEgZGVlcCBjb3B5IG9mIGFsbCBvYmplY3RzLlxyXG4qKi9cclxuTW9kZWwucHJvdG90eXBlLnRvUGxhaW5PYmplY3QgPSBmdW5jdGlvbiB0b1BsYWluT2JqZWN0KGRlZXBDb3B5KSB7XHJcblxyXG4gICAgdmFyIHBsYWluID0ge30sXHJcbiAgICAgICAgbW9kZWxPYmogPSB0aGlzLm1vZGVsT2JqZWN0O1xyXG5cclxuICAgIGZ1bmN0aW9uIHNldFZhbHVlKHByb3BlcnR5LCB2YWwpIHtcclxuICAgICAgICAvKmpzaGludCBtYXhjb21wbGV4aXR5OiAxMCovXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHR5cGVvZih2YWwpID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICBpZiAoZGVlcENvcHkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIGlmICh2YWwgaW5zdGFuY2VvZiBEYXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQSBkYXRlIGNsb25lXHJcbiAgICAgICAgICAgICAgICAgICAgcGxhaW5bcHJvcGVydHldID0gbmV3IERhdGUodmFsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZhbCAmJiB2YWwubW9kZWwgaW5zdGFuY2VvZiBNb2RlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEEgbW9kZWwgY29weVxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IHZhbC5tb2RlbC50b1BsYWluT2JqZWN0KGRlZXBDb3B5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZhbCA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBQbGFpbiAnc3RhbmRhcmQnIG9iamVjdCBjbG9uZVxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IGNsb25lKHZhbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoZGVlcENvcHkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBTaGFsbG93IGNvcHlcclxuICAgICAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IHZhbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBPbiBlbHNlLCBkbyBub3RoaW5nLCBubyByZWZlcmVuY2VzLCBubyBjbG9uZXNcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IHZhbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5wcm9wZXJ0aWVzTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHByb3BlcnR5KSB7XHJcbiAgICAgICAgLy8gUHJvcGVydGllcyBhcmUgb2JzZXJ2YWJsZXMsIHNvIGZ1bmN0aW9ucyB3aXRob3V0IHBhcmFtczpcclxuICAgICAgICB2YXIgdmFsID0gbW9kZWxPYmpbcHJvcGVydHldKCk7XHJcblxyXG4gICAgICAgIHNldFZhbHVlKHByb3BlcnR5LCB2YWwpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5maWVsZHNMaXN0LmZvckVhY2goZnVuY3Rpb24oZmllbGQpIHtcclxuICAgICAgICAvLyBGaWVsZHMgYXJlIGp1c3QgcGxhaW4gb2JqZWN0IG1lbWJlcnMgZm9yIHZhbHVlcywganVzdCBjb3B5OlxyXG4gICAgICAgIHZhciB2YWwgPSBtb2RlbE9ialtmaWVsZF07XHJcblxyXG4gICAgICAgIHNldFZhbHVlKGZpZWxkLCB2YWwpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHBsYWluO1xyXG59O1xyXG5cclxuTW9kZWwucHJvdG90eXBlLnVwZGF0ZVdpdGggPSBmdW5jdGlvbiB1cGRhdGVXaXRoKGRhdGEsIGRlZXBDb3B5KSB7XHJcbiAgICBcclxuICAgIC8vIFdlIG5lZWQgYSBwbGFpbiBvYmplY3QgZm9yICdmcm9tSlMnLlxyXG4gICAgLy8gSWYgaXMgYSBtb2RlbCwgZXh0cmFjdCB0aGVpciBwcm9wZXJ0aWVzIGFuZCBmaWVsZHMgZnJvbVxyXG4gICAgLy8gdGhlIG9ic2VydmFibGVzIChmcm9tSlMpLCBzbyB3ZSBub3QgZ2V0IGNvbXB1dGVkXHJcbiAgICAvLyBvciBmdW5jdGlvbnMsIGp1c3QgcmVnaXN0ZXJlZCBwcm9wZXJ0aWVzIGFuZCBmaWVsZHNcclxuICAgIGlmIChkYXRhICYmIGRhdGEubW9kZWwgaW5zdGFuY2VvZiBNb2RlbCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIGRhdGEgPSBkYXRhLm1vZGVsLnRvUGxhaW5PYmplY3QoZGVlcENvcHkpO1xyXG4gICAgfVxyXG5cclxuICAgIGtvLm1hcHBpbmcuZnJvbUpTKGRhdGEsIHRoaXMubWFwcGluZ09wdGlvbnMsIHRoaXMubW9kZWxPYmplY3QpO1xyXG59O1xyXG5cclxuTW9kZWwucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gY2xvbmUoZGF0YSwgZGVlcENvcHkpIHtcclxuICAgIC8vIEdldCBhIHBsYWluIG9iamVjdCB3aXRoIHRoZSBvYmplY3QgZGF0YVxyXG4gICAgdmFyIHBsYWluID0gdGhpcy50b1BsYWluT2JqZWN0KGRlZXBDb3B5KTtcclxuICAgIC8vIENyZWF0ZSBhIG5ldyBtb2RlbCBpbnN0YW5jZSwgdXNpbmcgdGhlIHNvdXJjZSBwbGFpbiBvYmplY3RcclxuICAgIC8vIGFzIGluaXRpYWwgdmFsdWVzXHJcbiAgICB2YXIgY2xvbmVkID0gbmV3IHRoaXMubW9kZWxPYmplY3QuY29uc3RydWN0b3IocGxhaW4pO1xyXG4gICAgLy8gVXBkYXRlIHRoZSBjbG9uZWQgd2l0aCB0aGUgcHJvdmlkZWQgcGxhaW4gZGF0YSB1c2VkXHJcbiAgICAvLyB0byByZXBsYWNlIHZhbHVlcyBvbiB0aGUgY2xvbmVkIG9uZSwgZm9yIHF1aWNrIG9uZS1zdGVwIGNyZWF0aW9uXHJcbiAgICAvLyBvZiBkZXJpdmVkIG9iamVjdHMuXHJcbiAgICBjbG9uZWQubW9kZWwudXBkYXRlV2l0aChkYXRhKTtcclxuICAgIC8vIENsb25lZCBtb2RlbCByZWFkeTpcclxuICAgIHJldHVybiBjbG9uZWQ7XHJcbn07XHJcbiIsIi8qKiBQZXJmb3JtYW5jZVN1bW1hcnkgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIExpc3RWaWV3SXRlbSA9IHJlcXVpcmUoJy4vTGlzdFZpZXdJdGVtJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKSxcclxuICAgIG51bWVyYWwgPSByZXF1aXJlKCdudW1lcmFsJyk7XHJcblxyXG5mdW5jdGlvbiBQZXJmb3JtYW5jZVN1bW1hcnkodmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdmFsdWVzID0gdmFsdWVzIHx8IHt9O1xyXG5cclxuICAgIHRoaXMuZWFybmluZ3MgPSBuZXcgRWFybmluZ3ModmFsdWVzLmVhcm5pbmdzKTtcclxuICAgIFxyXG4gICAgdmFyIGVhcm5pbmdzTGluZSA9IG5ldyBMaXN0Vmlld0l0ZW0oKTtcclxuICAgIGVhcm5pbmdzTGluZS5tYXJrZXJMaW5lMSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBudW0gPSBudW1lcmFsKHRoaXMuY3VycmVudEFtb3VudCgpKS5mb3JtYXQoJyQwLDAnKTtcclxuICAgICAgICByZXR1cm4gbnVtO1xyXG4gICAgfSwgdGhpcy5lYXJuaW5ncyk7XHJcbiAgICBlYXJuaW5nc0xpbmUuY29udGVudExpbmUxID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudENvbmNlcHQoKTtcclxuICAgIH0sIHRoaXMuZWFybmluZ3MpO1xyXG4gICAgZWFybmluZ3NMaW5lLm1hcmtlckxpbmUyID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIG51bSA9IG51bWVyYWwodGhpcy5uZXh0QW1vdW50KCkpLmZvcm1hdCgnJDAsMCcpO1xyXG4gICAgICAgIHJldHVybiBudW07XHJcbiAgICB9LCB0aGlzLmVhcm5pbmdzKTtcclxuICAgIGVhcm5pbmdzTGluZS5jb250ZW50TGluZTIgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5uZXh0Q29uY2VwdCgpO1xyXG4gICAgfSwgdGhpcy5lYXJuaW5ncyk7XHJcbiAgICBcclxuXHJcbiAgICB0aGlzLnRpbWVCb29rZWQgPSBuZXcgVGltZUJvb2tlZCh2YWx1ZXMudGltZUJvb2tlZCk7XHJcblxyXG4gICAgdmFyIHRpbWVCb29rZWRMaW5lID0gbmV3IExpc3RWaWV3SXRlbSgpO1xyXG4gICAgdGltZUJvb2tlZExpbmUubWFya2VyTGluZTEgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgbnVtID0gbnVtZXJhbCh0aGlzLnBlcmNlbnQoKSkuZm9ybWF0KCcwJScpO1xyXG4gICAgICAgIHJldHVybiBudW07XHJcbiAgICB9LCB0aGlzLnRpbWVCb29rZWQpO1xyXG4gICAgdGltZUJvb2tlZExpbmUuY29udGVudExpbmUxID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uY2VwdCgpO1xyXG4gICAgfSwgdGhpcy50aW1lQm9va2VkKTtcclxuICAgIFxyXG4gICAgXHJcbiAgICB0aGlzLml0ZW1zID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBpdGVtcyA9IFtdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGl0ZW1zLnB1c2goZWFybmluZ3NMaW5lKTtcclxuICAgICAgICBpdGVtcy5wdXNoKHRpbWVCb29rZWRMaW5lKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGl0ZW1zO1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGVyZm9ybWFuY2VTdW1tYXJ5O1xyXG5cclxuZnVuY3Rpb24gRWFybmluZ3ModmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICBcclxuICAgICAgICAgY3VycmVudEFtb3VudDogMCxcclxuICAgICAgICAgY3VycmVudENvbmNlcHRUZW1wbGF0ZTogJ2FscmVhZHkgcGFpZCB0aGlzIG1vbnRoJyxcclxuICAgICAgICAgbmV4dEFtb3VudDogMCxcclxuICAgICAgICAgbmV4dENvbmNlcHRUZW1wbGF0ZTogJ3Byb2plY3RlZCB7bW9udGh9IGVhcm5pbmdzJ1xyXG5cclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuY3VycmVudENvbmNlcHQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHZhciBtb250aCA9IG1vbWVudCgpLmZvcm1hdCgnTU1NTScpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRDb25jZXB0VGVtcGxhdGUoKS5yZXBsYWNlKC9cXHttb250aFxcfS8sIG1vbnRoKTtcclxuXHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLm5leHRDb25jZXB0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgbW9udGggPSBtb21lbnQoKS5hZGQoMSwgJ21vbnRoJykuZm9ybWF0KCdNTU1NJyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dENvbmNlcHRUZW1wbGF0ZSgpLnJlcGxhY2UoL1xce21vbnRoXFx9LywgbW9udGgpO1xyXG5cclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBUaW1lQm9va2VkKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgXHJcbiAgICAgICAgcGVyY2VudDogMCxcclxuICAgICAgICBjb25jZXB0VGVtcGxhdGU6ICdvZiBhdmFpbGFibGUgdGltZSBib29rZWQgaW4ge21vbnRofSdcclxuICAgIFxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5jb25jZXB0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgbW9udGggPSBtb21lbnQoKS5hZGQoMSwgJ21vbnRoJykuZm9ybWF0KCdNTU1NJyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uY2VwdFRlbXBsYXRlKCkucmVwbGFjZSgvXFx7bW9udGhcXH0vLCBtb250aCk7XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuIiwiLyoqIFBvc2l0aW9uIG1vZGVsLlxyXG4gKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIFBvc2l0aW9uKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHBvc2l0aW9uSUQ6IDAsXHJcbiAgICAgICAgcG9zaXRpb25TaW5ndWxhcjogJycsXHJcbiAgICAgICAgcG9zaXRpb25QbHVyYWw6ICcnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnJyxcclxuICAgICAgICBhY3RpdmU6IHRydWVcclxuXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBvc2l0aW9uO1xyXG4iLCIvKiogU2VydmljZSBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gU2VydmljZSh2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBuYW1lOiAnJyxcclxuICAgICAgICBwcmljZTogMCxcclxuICAgICAgICBkdXJhdGlvbjogMCwgLy8gaW4gbWludXRlc1xyXG4gICAgICAgIGlzQWRkb246IGZhbHNlXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmR1cmF0aW9uVGV4dCA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBtaW51dGVzID0gdGhpcy5kdXJhdGlvbigpIHx8IDA7XHJcbiAgICAgICAgLy8gVE9ETzogRm9ybWF0dGluZywgbG9jYWxpemF0aW9uXHJcbiAgICAgICAgcmV0dXJuIG1pbnV0ZXMgPyBtaW51dGVzICsgJyBtaW51dGVzJyA6ICcnO1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2VydmljZTtcclxuIiwiLyoqIFVwY29taW5nQm9va2luZ3NTdW1tYXJ5IG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBCb29raW5nU3VtbWFyeSA9IHJlcXVpcmUoJy4vQm9va2luZ1N1bW1hcnknKTtcclxuXHJcbmZ1bmN0aW9uIFVwY29taW5nQm9va2luZ3NTdW1tYXJ5KCkge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMudG9kYXkgPSBuZXcgQm9va2luZ1N1bW1hcnkoe1xyXG4gICAgICAgIGNvbmNlcHQ6ICdtb3JlIHRvZGF5JyxcclxuICAgICAgICB0aW1lRm9ybWF0OiAnIFtlbmRpbmcgQF0gaDptbWEnXHJcbiAgICB9KTtcclxuICAgIHRoaXMudG9tb3Jyb3cgPSBuZXcgQm9va2luZ1N1bW1hcnkoe1xyXG4gICAgICAgIGNvbmNlcHQ6ICd0b21vcnJvdycsXHJcbiAgICAgICAgdGltZUZvcm1hdDogJyBbc3RhcnRpbmcgQF0gaDptbWEnXHJcbiAgICB9KTtcclxuICAgIHRoaXMubmV4dFdlZWsgPSBuZXcgQm9va2luZ1N1bW1hcnkoe1xyXG4gICAgICAgIGNvbmNlcHQ6ICduZXh0IHdlZWsnLFxyXG4gICAgICAgIHRpbWVGb3JtYXQ6IG51bGxcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLml0ZW1zID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBpdGVtcyA9IFtdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vaWYgKHRoaXMudG9kYXkucXVhbnRpdHkoKSlcclxuICAgICAgICBpdGVtcy5wdXNoKHRoaXMudG9kYXkpO1xyXG4gICAgICAgIC8vaWYgKHRoaXMudG9tb3Jyb3cucXVhbnRpdHkoKSlcclxuICAgICAgICBpdGVtcy5wdXNoKHRoaXMudG9tb3Jyb3cpO1xyXG4gICAgICAgIC8vaWYgKHRoaXMubmV4dFdlZWsucXVhbnRpdHkoKSlcclxuICAgICAgICBpdGVtcy5wdXNoKHRoaXMubmV4dFdlZWspO1xyXG5cclxuICAgICAgICByZXR1cm4gaXRlbXM7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFVwY29taW5nQm9va2luZ3NTdW1tYXJ5O1xyXG4iLCIvKiogVXNlciBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuLy8gRW51bSBVc2VyVHlwZVxyXG52YXIgVXNlclR5cGUgPSB7XHJcbiAgICBOb25lOiAwLFxyXG4gICAgQW5vbnltb3VzOiAxLFxyXG4gICAgQ3VzdG9tZXI6IDIsXHJcbiAgICBQcm92aWRlcjogNCxcclxuICAgIEFkbWluOiA4LFxyXG4gICAgTG9nZ2VkVXNlcjogMTQsXHJcbiAgICBVc2VyOiAxNSxcclxuICAgIFN5c3RlbTogMTZcclxufTtcclxuXHJcbmZ1bmN0aW9uIFVzZXIodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHVzZXJJRDogMCxcclxuICAgICAgICBlbWFpbDogJycsXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnJyxcclxuICAgICAgICBtaWRkbGVJbjogJycsXHJcbiAgICAgICAgbGFzdE5hbWU6ICcnLFxyXG4gICAgICAgIHNlY29uZExhc3ROYW1lOiAnJyxcclxuICAgICAgICBuaWNrTmFtZTogbnVsbCxcclxuICAgICAgICBwdWJsaWNCaW86IG51bGwsXHJcbiAgICAgICAgZ2VuZGVySUQ6IDAsXHJcbiAgICAgICAgcHJlZmVycmVkTGFuZ3VhZ2VJRDogbnVsbCxcclxuICAgICAgICBwcmVmZXJyZWRDb3VudHJ5SUQ6IG51bGwsXHJcbiAgICAgICAgaXNQcm92aWRlcjogZmFsc2UsXHJcbiAgICAgICAgaXNDdXN0b21lcjogZmFsc2UsXHJcbiAgICAgICAgaXNNZW1iZXI6IGZhbHNlLFxyXG4gICAgICAgIGlzQWRtaW46IGZhbHNlLFxyXG4gICAgICAgIG1vYmlsZVBob25lOiBudWxsLFxyXG4gICAgICAgIGFsdGVybmF0ZVBob25lOiBudWxsLFxyXG4gICAgICAgIHByb3ZpZGVyUHJvZmlsZVVSTDogbnVsbCxcclxuICAgICAgICBwcm92aWRlcldlYnNpdGVVUkw6IG51bGwsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgbW9kaWZpZWRCeTogbnVsbCxcclxuICAgICAgICBhY3RpdmU6IGZhbHNlLFxyXG4gICAgICAgIGFjY291bnRTdGF0dXNJRDogMCxcclxuICAgICAgICBib29rQ29kZTogbnVsbCxcclxuICAgICAgICBvbmJvYXJkaW5nU3RlcDogbnVsbCxcclxuICAgICAgICBidXNpbmVzc05hbWU6IG51bGwsXHJcbiAgICAgICAgYWx0ZXJuYXRlRW1haWw6IG51bGwsXHJcbiAgICAgICAgYmlydGhNb250aERheTogbnVsbCxcclxuICAgICAgICBiaXJ0aE1vbnRoOiBudWxsXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG5cclxuICAgIHRoaXMuZnVsbE5hbWUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLmZpcnN0TmFtZSgpICsgJyAnICsgdGhpcy5sYXN0TmFtZSgpKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmJpcnRoRGF5ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmJpcnRoTW9udGhEYXkoKSAmJlxyXG4gICAgICAgICAgICB0aGlzLmJpcnRoTW9udGgoKSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVE9ETyBpMTBuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJpcnRoTW9udGgoKSArICcvJyArIHRoaXMuYmlydGhNb250aERheSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMudXNlclR5cGUgPSBrby5wdXJlQ29tcHV0ZWQoe1xyXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgYyA9IHRoaXMuaXNDdXN0b21lcigpLFxyXG4gICAgICAgICAgICAgICAgcCA9IHRoaXMuaXNQcm92aWRlcigpLFxyXG4gICAgICAgICAgICAgICAgYSA9IHRoaXMuaXNBZG1pbigpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHVzZXJUeXBlID0gMDtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQW5vbnltb3VzKCkpIHtcclxuICAgICAgICAgICAgICAgIHVzZXJUeXBlID0gdXNlclR5cGUgfCBVc2VyVHlwZS5Bbm9ueW1vdXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGMpXHJcbiAgICAgICAgICAgICAgICB1c2VyVHlwZSA9IHVzZXJUeXBlIHwgVXNlclR5cGUuQ3VzdG9tZXI7XHJcbiAgICAgICAgICAgIGlmIChwKVxyXG4gICAgICAgICAgICAgICAgdXNlclR5cGUgPSB1c2VyVHlwZSB8IFVzZXJUeXBlLlByb3ZpZGVyO1xyXG4gICAgICAgICAgICBpZiAoYSlcclxuICAgICAgICAgICAgICAgIHVzZXJUeXBlID0gdXNlclR5cGUgfCBVc2VyVHlwZS5BZG1pbjtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiB1c2VyVHlwZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qIE5PVEU6IE5vdCByZXF1aXJlIGZvciBub3c6XHJcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICB9LCovXHJcbiAgICAgICAgb3duZXI6IHRoaXNcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLmlzQW5vbnltb3VzID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudXNlcklEKCkgPCAxO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEl0IG1hdGNoZXMgYSBVc2VyVHlwZSBmcm9tIHRoZSBlbnVtZXJhdGlvbj9cclxuICAgICoqL1xyXG4gICAgdGhpcy5pc1VzZXJUeXBlID0gZnVuY3Rpb24gaXNVc2VyVHlwZSh0eXBlKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnVzZXJUeXBlKCkgJiB0eXBlKTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBVc2VyO1xyXG5cclxuVXNlci5Vc2VyVHlwZSA9IFVzZXJUeXBlO1xyXG5cclxuLyogQ3JlYXRpbnQgYW4gYW5vbnltb3VzIHVzZXIgd2l0aCBzb21lIHByZXNzZXRzICovXHJcblVzZXIubmV3QW5vbnltb3VzID0gZnVuY3Rpb24gbmV3QW5vbnltb3VzKCkge1xyXG4gICAgcmV0dXJuIG5ldyBVc2VyKHtcclxuICAgICAgICB1c2VySUQ6IDAsXHJcbiAgICAgICAgZW1haWw6ICcnLFxyXG4gICAgICAgIGZpcnN0TmFtZTogJycsXHJcbiAgICAgICAgb25ib2FyZGluZ1N0ZXA6IG51bGxcclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKiogQ2FsZW5kYXIgQXBwb2ludG1lbnRzIHRlc3QgZGF0YSAqKi9cclxudmFyIEFwcG9pbnRtZW50ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0FwcG9pbnRtZW50Jyk7XHJcbnZhciB0ZXN0TG9jYXRpb25zID0gcmVxdWlyZSgnLi9sb2NhdGlvbnMnKS5sb2NhdGlvbnM7XHJcbnZhciB0ZXN0U2VydmljZXMgPSByZXF1aXJlKCcuL3NlcnZpY2VzJykuc2VydmljZXM7XHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbnZhciB0b2RheSA9IG1vbWVudCgpLFxyXG4gICAgdG9tb3Jyb3cgPSBtb21lbnQoKS5hZGQoMSwgJ2RheXMnKSxcclxuICAgIHRvbW9ycm93MTAgPSB0b21vcnJvdy5jbG9uZSgpLmhvdXJzKDEwKS5taW51dGVzKDApLnNlY29uZHMoMCksXHJcbiAgICB0b21vcnJvdzE2ID0gdG9tb3Jyb3cuY2xvbmUoKS5ob3VycygxNikubWludXRlcygzMCkuc2Vjb25kcygwKTtcclxuICAgIFxyXG52YXIgdGVzdERhdGEgPSBbXHJcbiAgICBuZXcgQXBwb2ludG1lbnQoe1xyXG4gICAgICAgIGlkOiAxLFxyXG4gICAgICAgIHN0YXJ0VGltZTogdG9tb3Jyb3cxMCxcclxuICAgICAgICBlbmRUaW1lOiB0b21vcnJvdzE2LFxyXG4gICAgICAgIHN1bW1hcnk6ICdNYXNzYWdlIFRoZXJhcGlzdCBCb29raW5nJyxcclxuICAgICAgICAvL3ByaWNpbmdTdW1tYXJ5OiAnRGVlcCBUaXNzdWUgTWFzc2FnZSAxMjBtIHBsdXMgMiBtb3JlJyxcclxuICAgICAgICBzZXJ2aWNlczogdGVzdFNlcnZpY2VzLFxyXG4gICAgICAgIHB0b3RhbFByaWNlOiA5NS4wLFxyXG4gICAgICAgIGxvY2F0aW9uOiBrby50b0pTKHRlc3RMb2NhdGlvbnNbMF0pLFxyXG4gICAgICAgIHByZU5vdGVzVG9DbGllbnQ6ICdMb29raW5nIGZvcndhcmQgdG8gc2VlaW5nIHRoZSBuZXcgY29sb3InLFxyXG4gICAgICAgIHByZU5vdGVzVG9TZWxmOiAnQXNrIGhpbSBhYm91dCBoaXMgbmV3IGNvbG9yJyxcclxuICAgICAgICBjbGllbnQ6IHtcclxuICAgICAgICAgICAgZmlyc3ROYW1lOiAnSm9zaHVhJyxcclxuICAgICAgICAgICAgbGFzdE5hbWU6ICdEYW5pZWxzb24nXHJcbiAgICAgICAgfVxyXG4gICAgfSksXHJcbiAgICBuZXcgQXBwb2ludG1lbnQoe1xyXG4gICAgICAgIGlkOiAyLFxyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDEsIDEzLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMSwgMTMsIDUwLCAwKSxcclxuICAgICAgICBzdW1tYXJ5OiAnTWFzc2FnZSBUaGVyYXBpc3QgQm9va2luZycsXHJcbiAgICAgICAgLy9wcmljaW5nU3VtbWFyeTogJ0Fub3RoZXIgTWFzc2FnZSA1MG0nLFxyXG4gICAgICAgIHNlcnZpY2VzOiBbdGVzdFNlcnZpY2VzWzBdXSxcclxuICAgICAgICBwdG90YWxQcmljZTogOTUuMCxcclxuICAgICAgICBsb2NhdGlvbjoga28udG9KUyh0ZXN0TG9jYXRpb25zWzFdKSxcclxuICAgICAgICBwcmVOb3Rlc1RvQ2xpZW50OiAnU29tZXRoaW5nIGVsc2UnLFxyXG4gICAgICAgIHByZU5vdGVzVG9TZWxmOiAnUmVtZW1iZXIgdGhhdCB0aGluZycsXHJcbiAgICAgICAgY2xpZW50OiB7XHJcbiAgICAgICAgICAgIGZpcnN0TmFtZTogJ0pvc2h1YScsXHJcbiAgICAgICAgICAgIGxhc3ROYW1lOiAnRGFuaWVsc29uJ1xyXG4gICAgICAgIH1cclxuICAgIH0pLFxyXG4gICAgbmV3IEFwcG9pbnRtZW50KHtcclxuICAgICAgICBpZDogMyxcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxNiwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDEsIDE4LCAwLCAwKSxcclxuICAgICAgICBzdW1tYXJ5OiAnTWFzc2FnZSBUaGVyYXBpc3QgQm9va2luZycsXHJcbiAgICAgICAgLy9wcmljaW5nU3VtbWFyeTogJ1Rpc3N1ZSBNYXNzYWdlIDEyMG0nLFxyXG4gICAgICAgIHNlcnZpY2VzOiBbdGVzdFNlcnZpY2VzWzFdXSxcclxuICAgICAgICBwdG90YWxQcmljZTogOTUuMCxcclxuICAgICAgICBsb2NhdGlvbjoga28udG9KUyh0ZXN0TG9jYXRpb25zWzJdKSxcclxuICAgICAgICBwcmVOb3Rlc1RvQ2xpZW50OiAnJyxcclxuICAgICAgICBwcmVOb3Rlc1RvU2VsZjogJ0FzayBoaW0gYWJvdXQgdGhlIGZvcmdvdHRlbiBub3RlcycsXHJcbiAgICAgICAgY2xpZW50OiB7XHJcbiAgICAgICAgICAgIGZpcnN0TmFtZTogJ0pvc2h1YScsXHJcbiAgICAgICAgICAgIGxhc3ROYW1lOiAnRGFuaWVsc29uJ1xyXG4gICAgICAgIH1cclxuICAgIH0pLFxyXG5dO1xyXG5cclxuZXhwb3J0cy5hcHBvaW50bWVudHMgPSB0ZXN0RGF0YTtcclxuIiwiLyoqIENhbGVuZGFyIFNsb3RzIHRlc3QgZGF0YSAqKi9cclxudmFyIENhbGVuZGFyU2xvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9DYWxlbmRhclNsb3QnKTtcclxuXHJcbnZhciBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG52YXIgdG9kYXkgPSBuZXcgRGF0ZSgpLFxyXG4gICAgdG9tb3Jyb3cgPSBuZXcgRGF0ZSgpO1xyXG50b21vcnJvdy5zZXREYXRlKHRvbW9ycm93LmdldERhdGUoKSArIDEpO1xyXG5cclxudmFyIHN0b2RheSA9IG1vbWVudCh0b2RheSkuZm9ybWF0KCdZWVlZLU1NLUREJyksXHJcbiAgICBzdG9tb3Jyb3cgPSBtb21lbnQodG9tb3Jyb3cpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xyXG5cclxudmFyIHRlc3REYXRhMSA9IFtcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9kYXksIDAsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAxMiwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0ZyZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjIWFwcG9pbnRtZW50LzAnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXN1Y2Nlc3MnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9kYXksIDEyLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b2RheSwgMTMsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdKb3NoIERhbmllbHNvbicsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC8zJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAxMywgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9kYXksIDE1LCAwLCAwKSxcclxuXHJcbiAgICAgICAgc3ViamVjdDogJ0RvIHRoYXQgaW1wb3J0YW50IHRoaW5nJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFldmVudC84JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tbmV3LXdpbmRvdycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAxNSwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9kYXksIDE2LCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnSWFnbyBMb3JlbnpvJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UgTG9uZyBOYW1lJyxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC81JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiAnJDE1OS45MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b2RheSwgMTYsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAwLCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnRnJlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyMhYXBwb2ludG1lbnQvMCcsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctc3VjY2VzcydcclxuICAgIH0pXHJcbl07XHJcbnZhciB0ZXN0RGF0YTIgPSBbXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAwLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgOSwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0ZyZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjIWFwcG9pbnRtZW50LzAnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXN1Y2Nlc3MnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDksIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxMCwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0phcmVuIEZyZWVseScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdEZWVwIFRpc3N1ZSBNYXNzYWdlIExvbmcgTmFtZScsXHJcbiAgICAgICAgbGluazogJyMhYXBwb2ludG1lbnQvMScsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogJyQ1OS45MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTAsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxMSwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0ZyZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjIWFwcG9pbnRtZW50LzAnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXN1Y2Nlc3MnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDExLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTIsIDQ1LCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnQ09ORklSTS1TdXNhbiBEZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgbGluazogJyMhYXBwb2ludG1lbnQvMicsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogJyQ3MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctd2FybmluZydcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTIsIDQ1LCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTYsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC8wJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxNiwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDE3LCAxNSwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ1N1c2FuIERlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC8zJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxNywgMTUsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxOCwgMzAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdEZW50aXN0IGFwcG9pbnRtZW50JyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFldmVudC80JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tbmV3LXdpbmRvdycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxOCwgMzAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxOSwgMzAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdTdXNhbiBEZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRGVlcCBUaXNzdWUgTWFzc2FnZSBMb25nIE5hbWUnLFxyXG4gICAgICAgIGxpbms6ICcjIWFwcG9pbnRtZW50LzUnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6ICckMTU5LjkwJyxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxOSwgMzAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAyMywgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0ZyZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjIWFwcG9pbnRtZW50LzAnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXN1Y2Nlc3MnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDIzLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMCwgMCwgMCksXHJcblxyXG4gICAgICAgIHN1YmplY3Q6ICdKYXJlbiBGcmVlbHknLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgbGluazogJyMhYXBwb2ludG1lbnQvNicsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogJyQ4MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pXHJcbl07XHJcbnZhciB0ZXN0RGF0YUZyZWUgPSBbXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAwLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMCwgMCwgMCksXHJcblxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC8wJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSlcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IHtcclxuICAgICdkZWZhdWx0JzogdGVzdERhdGFGcmVlXHJcbn07XHJcbnRlc3REYXRhW3N0b2RheV0gPSB0ZXN0RGF0YTE7XHJcbnRlc3REYXRhW3N0b21vcnJvd10gPSB0ZXN0RGF0YTI7XHJcblxyXG5leHBvcnRzLmNhbGVuZGFyID0gdGVzdERhdGE7XHJcbiIsIi8qKiBDbGllbnRzIHRlc3QgZGF0YSAqKi9cclxudmFyIENsaWVudCA9IHJlcXVpcmUoJy4uL21vZGVscy9DbGllbnQnKTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IFtcclxuICAgIG5ldyBDbGllbnQgKHtcclxuICAgICAgICBpZDogMSxcclxuICAgICAgICBmaXJzdE5hbWU6ICdKb3NodWEnLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRGFuaWVsc29uJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBpZDogMixcclxuICAgICAgICBmaXJzdE5hbWU6ICdJYWdvJyxcclxuICAgICAgICBsYXN0TmFtZTogJ0xvcmVuem8nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiAzLFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0Zlcm5hbmRvJyxcclxuICAgICAgICBsYXN0TmFtZTogJ0dhZ28nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiA0LFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FkYW0nLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRmluY2gnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiA1LFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FsYW4nLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRmVyZ3Vzb24nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiA2LFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FsZXgnLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnUGVuYSdcclxuICAgIH0pLFxyXG4gICAgbmV3IENsaWVudCh7XHJcbiAgICAgICAgaWQ6IDcsXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnQWxleGlzJyxcclxuICAgICAgICBsYXN0TmFtZTogJ1BlYWNhJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBpZDogOCxcclxuICAgICAgICBmaXJzdE5hbWU6ICdBcnRodXInLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnTWlsbGVyJ1xyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMuY2xpZW50cyA9IHRlc3REYXRhO1xyXG4iLCIvKiogTG9jYXRpb25zIHRlc3QgZGF0YSAqKi9cclxudmFyIExvY2F0aW9uID0gcmVxdWlyZSgnLi4vbW9kZWxzL0xvY2F0aW9uJyk7XHJcblxyXG52YXIgdGVzdERhdGEgPSBbXHJcbiAgICBuZXcgTG9jYXRpb24gKHtcclxuICAgICAgICBsb2NhdGlvbklEOiAxLFxyXG4gICAgICAgIG5hbWU6ICdBY3R2aVNwYWNlJyxcclxuICAgICAgICBhZGRyZXNzTGluZTE6ICczMTUwIDE4dGggU3RyZWV0JyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwMSxcclxuICAgICAgICBpc1NlcnZpY2VSYWRpdXM6IHRydWUsXHJcbiAgICAgICAgc2VydmljZVJhZGl1czogMlxyXG4gICAgfSksXHJcbiAgICBuZXcgTG9jYXRpb24oe1xyXG4gICAgICAgIGxvY2F0aW9uSUQ6IDIsXHJcbiAgICAgICAgbmFtZTogJ0NvcmV5XFwncyBBcHQnLFxyXG4gICAgICAgIGFkZHJlc3NMaW5lMTogJzE4NyBCb2NhbmEgU3QuJyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwMlxyXG4gICAgfSksXHJcbiAgICBuZXcgTG9jYXRpb24oe1xyXG4gICAgICAgIGxvY2F0aW9uSUQ6IDMsXHJcbiAgICAgICAgbmFtZTogJ0pvc2hcXCdhIEFwdCcsXHJcbiAgICAgICAgYWRkcmVzc0xpbmUxOiAnNDI5IENvcmJldHQgQXZlJyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwM1xyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMubG9jYXRpb25zID0gdGVzdERhdGE7XHJcbiIsIi8qKiBJbmJveCB0ZXN0IGRhdGEgKiovXHJcbnZhciBNZXNzYWdlID0gcmVxdWlyZSgnLi4vbW9kZWxzL01lc3NhZ2UnKTtcclxuXHJcbnZhciBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG52YXIgdG9kYXkgPSBuZXcgRGF0ZSgpLFxyXG4gICAgeWVzdGVyZGF5ID0gbmV3IERhdGUoKSxcclxuICAgIGxhc3RXZWVrID0gbmV3IERhdGUoKSxcclxuICAgIG9sZERhdGUgPSBuZXcgRGF0ZSgpO1xyXG55ZXN0ZXJkYXkuc2V0RGF0ZSh5ZXN0ZXJkYXkuZ2V0RGF0ZSgpIC0gMSk7XHJcbmxhc3RXZWVrLnNldERhdGUobGFzdFdlZWsuZ2V0RGF0ZSgpIC0gMik7XHJcbm9sZERhdGUuc2V0RGF0ZShvbGREYXRlLmdldERhdGUoKSAtIDE2KTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IFtcclxuICAgIG5ldyBNZXNzYWdlKHtcclxuICAgICAgICBpZDogMSxcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbmV3IFRpbWUodG9kYXksIDExLCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnQ09ORklSTS1TdXNhbiBEZWUnLFxyXG4gICAgICAgIGNvbnRlbnQ6ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBsaW5rOiAnL2NvbnZlcnNhdGlvbi8xJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiAnJDcwJyxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy13YXJuaW5nJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgTWVzc2FnZSh7XHJcbiAgICAgICAgaWQ6IDMsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG5ldyBUaW1lKHllc3RlcmRheSwgMTMsIDAsIDApLFxyXG5cclxuICAgICAgICBzdWJqZWN0OiAnRG8geW91IGRvIFwiRXhvdGljIE1hc3NhZ2VcIj8nLFxyXG4gICAgICAgIGNvbnRlbnQ6ICdIaSwgSSB3YW50ZWQgdG8ga25vdyBpZiB5b3UgcGVyZm9ybSBhcyBwYXIgb2YgeW91ciBzZXJ2aWNlcy4uLicsXHJcbiAgICAgICAgbGluazogJy9jb252ZXJzYXRpb24vMycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXNoYXJlLWFsdCcsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgTWVzc2FnZSh7XHJcbiAgICAgICAgaWQ6IDIsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG5ldyBUaW1lKGxhc3RXZWVrLCAxMiwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0pvc2ggRGFuaWVsc29uJyxcclxuICAgICAgICBjb250ZW50OiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgbGluazogJy9jb252ZXJzYXRpb24vMicsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IE1lc3NhZ2Uoe1xyXG4gICAgICAgIGlkOiA0LFxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBuZXcgVGltZShvbGREYXRlLCAxNSwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0lucXVpcnknLFxyXG4gICAgICAgIGNvbnRlbnQ6ICdBbm90aGVyIHF1ZXN0aW9uIGZyb20gYW5vdGhlciBjbGllbnQuJyxcclxuICAgICAgICBsaW5rOiAnL2NvbnZlcnNhdGlvbi80JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tc2hhcmUtYWx0JyxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMubWVzc2FnZXMgPSB0ZXN0RGF0YTtcclxuIiwiLyoqIFNlcnZpY2VzIHRlc3QgZGF0YSAqKi9cclxudmFyIFNlcnZpY2UgPSByZXF1aXJlKCcuLi9tb2RlbHMvU2VydmljZScpO1xyXG5cclxudmFyIHRlc3REYXRhID0gW1xyXG4gICAgbmV3IFNlcnZpY2UgKHtcclxuICAgICAgICBuYW1lOiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgcHJpY2U6IDk1LFxyXG4gICAgICAgIGR1cmF0aW9uOiAxMjBcclxuICAgIH0pLFxyXG4gICAgbmV3IFNlcnZpY2Uoe1xyXG4gICAgICAgIG5hbWU6ICdUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgcHJpY2U6IDYwLFxyXG4gICAgICAgIGR1cmF0aW9uOiA2MFxyXG4gICAgfSksXHJcbiAgICBuZXcgU2VydmljZSh7XHJcbiAgICAgICAgbmFtZTogJ1NwZWNpYWwgb2lscycsXHJcbiAgICAgICAgcHJpY2U6IDk1LFxyXG4gICAgICAgIGlzQWRkb246IHRydWVcclxuICAgIH0pLFxyXG4gICAgbmV3IFNlcnZpY2Uoe1xyXG4gICAgICAgIG5hbWU6ICdTb21lIHNlcnZpY2UgZXh0cmEnLFxyXG4gICAgICAgIHByaWNlOiA0MCxcclxuICAgICAgICBkdXJhdGlvbjogMjAsXHJcbiAgICAgICAgaXNBZGRvbjogdHJ1ZVxyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMuc2VydmljZXMgPSB0ZXN0RGF0YTtcclxuIiwiLyoqIFxyXG4gICAgdGltZVNsb3RzXHJcbiAgICB0ZXN0aW5nIGRhdGFcclxuKiovXHJcblxyXG52YXIgVGltZSA9IHJlcXVpcmUoJy4uL3V0aWxzL1RpbWUnKTtcclxuXHJcbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbnZhciB0b2RheSA9IG5ldyBEYXRlKCksXHJcbiAgICB0b21vcnJvdyA9IG5ldyBEYXRlKCk7XHJcbnRvbW9ycm93LnNldERhdGUodG9tb3Jyb3cuZ2V0RGF0ZSgpICsgMSk7XHJcblxyXG52YXIgc3RvZGF5ID0gbW9tZW50KHRvZGF5KS5mb3JtYXQoJ1lZWVktTU0tREQnKSxcclxuICAgIHN0b21vcnJvdyA9IG1vbWVudCh0b21vcnJvdykuZm9ybWF0KCdZWVlZLU1NLUREJyk7XHJcblxyXG52YXIgdGVzdERhdGExID0gW1xyXG4gICAgVGltZSh0b2RheSwgOSwgMTUpLFxyXG4gICAgVGltZSh0b2RheSwgMTEsIDMwKSxcclxuICAgIFRpbWUodG9kYXksIDEyLCAwKSxcclxuICAgIFRpbWUodG9kYXksIDEyLCAzMCksXHJcbiAgICBUaW1lKHRvZGF5LCAxNiwgMTUpLFxyXG4gICAgVGltZSh0b2RheSwgMTgsIDApLFxyXG4gICAgVGltZSh0b2RheSwgMTgsIDMwKSxcclxuICAgIFRpbWUodG9kYXksIDE5LCAwKSxcclxuICAgIFRpbWUodG9kYXksIDE5LCAzMCksXHJcbiAgICBUaW1lKHRvZGF5LCAyMSwgMzApLFxyXG4gICAgVGltZSh0b2RheSwgMjIsIDApXHJcbl07XHJcblxyXG52YXIgdGVzdERhdGEyID0gW1xyXG4gICAgVGltZSh0b21vcnJvdywgOCwgMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMCwgMzApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTEsIDApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTEsIDMwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEyLCAwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEyLCAzMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMywgMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMywgMzApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTQsIDQ1KSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDE2LCAwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDE2LCAzMClcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YUJ1c3kgPSBbXHJcbl07XHJcblxyXG52YXIgdGVzdERhdGEgPSB7XHJcbiAgICAnZGVmYXVsdCc6IHRlc3REYXRhQnVzeVxyXG59O1xyXG50ZXN0RGF0YVtzdG9kYXldID0gdGVzdERhdGExO1xyXG50ZXN0RGF0YVtzdG9tb3Jyb3ddID0gdGVzdERhdGEyO1xyXG5cclxuZXhwb3J0cy50aW1lU2xvdHMgPSB0ZXN0RGF0YTtcclxuIiwiLyoqXHJcbiAgICBOZXcgRnVuY3Rpb24gbWV0aG9kOiAnX2RlbGF5ZWQnLlxyXG4gICAgSXQgcmV0dXJucyBhIG5ldyBmdW5jdGlvbiwgd3JhcHBpbmcgdGhlIG9yaWdpbmFsIG9uZSxcclxuICAgIHRoYXQgb25jZSBpdHMgY2FsbCB3aWxsIGRlbGF5IHRoZSBleGVjdXRpb24gdGhlIGdpdmVuIG1pbGxpc2Vjb25kcyxcclxuICAgIHVzaW5nIGEgc2V0VGltZW91dC5cclxuICAgIFRoZSBuZXcgZnVuY3Rpb24gcmV0dXJucyAndW5kZWZpbmVkJyBzaW5jZSBpdCBoYXMgbm90IHRoZSByZXN1bHQsXHJcbiAgICBiZWNhdXNlIG9mIHRoYXQgaXMgb25seSBzdWl0YWJsZSB3aXRoIHJldHVybi1mcmVlIGZ1bmN0aW9ucyBcclxuICAgIGxpa2UgZXZlbnQgaGFuZGxlcnMuXHJcbiAgICBcclxuICAgIFdoeTogc29tZXRpbWVzLCB0aGUgaGFuZGxlciBmb3IgYW4gZXZlbnQgbmVlZHMgdG8gYmUgZXhlY3V0ZWRcclxuICAgIGFmdGVyIGEgZGVsYXkgaW5zdGVhZCBvZiBpbnN0YW50bHkuXHJcbioqL1xyXG5GdW5jdGlvbi5wcm90b3R5cGUuX2RlbGF5ZWQgPSBmdW5jdGlvbiBkZWxheWVkKG1pbGxpc2Vjb25kcykge1xyXG4gICAgdmFyIGZuID0gdGhpcztcclxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgY29udGV4dCA9IHRoaXMsXHJcbiAgICAgICAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZuLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xyXG4gICAgICAgIH0sIG1pbGxpc2Vjb25kcyk7XHJcbiAgICB9O1xyXG59O1xyXG4iLCIvKipcclxuICAgIEV4dGVuZGluZyB0aGUgRnVuY3Rpb24gY2xhc3Mgd2l0aCBhbiBpbmhlcml0cyBtZXRob2QuXHJcbiAgICBcclxuICAgIFRoZSBpbml0aWFsIGxvdyBkYXNoIGlzIHRvIG1hcmsgaXQgYXMgbm8tc3RhbmRhcmQuXHJcbioqL1xyXG5GdW5jdGlvbi5wcm90b3R5cGUuX2luaGVyaXRzID0gZnVuY3Rpb24gX2luaGVyaXRzKHN1cGVyQ3Rvcikge1xyXG4gICAgdGhpcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcjoge1xyXG4gICAgICAgICAgICB2YWx1ZTogdGhpcyxcclxuICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBSRVNUIEFQSSBhY2Nlc3NcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmZ1bmN0aW9uIGxvd2VyRmlyc3RMZXR0ZXIobikge1xyXG4gICAgcmV0dXJuIG4gJiYgblswXSAmJiBuWzBdLnRvTG93ZXJDYXNlICYmIChuWzBdLnRvTG93ZXJDYXNlKCkgKyBuLnNsaWNlKDEpKSB8fCBuO1xyXG59XHJcblxyXG5mdW5jdGlvbiBsb3dlckNhbWVsaXplT2JqZWN0KG9iaikge1xyXG4gICAgLy9qc2hpbnQgbWF4Y29tcGxleGl0eTo4XHJcbiAgICBcclxuICAgIGlmICghb2JqIHx8IHR5cGVvZihvYmopICE9PSAnb2JqZWN0JykgcmV0dXJuIG9iajtcclxuXHJcbiAgICB2YXIgcmV0ID0gQXJyYXkuaXNBcnJheShvYmopID8gW10gOiB7fTtcclxuICAgIGZvcih2YXIgayBpbiBvYmopIHtcclxuICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGspKSB7XHJcbiAgICAgICAgICAgIHZhciBuZXdrID0gbG93ZXJGaXJzdExldHRlcihrKTtcclxuICAgICAgICAgICAgcmV0W25ld2tdID0gdHlwZW9mKG9ialtrXSkgPT09ICdvYmplY3QnID9cclxuICAgICAgICAgICAgICAgIGxvd2VyQ2FtZWxpemVPYmplY3Qob2JqW2tdKSA6XHJcbiAgICAgICAgICAgICAgICBvYmpba11cclxuICAgICAgICAgICAgO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZXQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFJlc3Qob3B0aW9uc09yVXJsKSB7XHJcbiAgICBcclxuICAgIHZhciB1cmwgPSB0eXBlb2Yob3B0aW9uc09yVXJsKSA9PT0gJ3N0cmluZycgP1xyXG4gICAgICAgIG9wdGlvbnNPclVybCA6XHJcbiAgICAgICAgb3B0aW9uc09yVXJsICYmIG9wdGlvbnNPclVybC51cmw7XHJcblxyXG4gICAgdGhpcy5iYXNlVXJsID0gdXJsO1xyXG4gICAgLy8gT3B0aW9uYWwgZXh0cmFIZWFkZXJzIGZvciBhbGwgcmVxdWVzdHMsXHJcbiAgICAvLyB1c3VhbGx5IGZvciBhdXRoZW50aWNhdGlvbiB0b2tlbnNcclxuICAgIHRoaXMuZXh0cmFIZWFkZXJzID0gbnVsbDtcclxufVxyXG5cclxuUmVzdC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0KGFwaVVybCwgZGF0YSkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChhcGlVcmwsICdnZXQnLCBkYXRhKTtcclxufTtcclxuXHJcblJlc3QucHJvdG90eXBlLnB1dCA9IGZ1bmN0aW9uIGdldChhcGlVcmwsIGRhdGEpIHtcclxuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoYXBpVXJsLCAncHV0JywgZGF0YSk7XHJcbn07XHJcblxyXG5SZXN0LnByb3RvdHlwZS5wb3N0ID0gZnVuY3Rpb24gZ2V0KGFwaVVybCwgZGF0YSkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChhcGlVcmwsICdwb3N0JywgZGF0YSk7XHJcbn07XHJcblxyXG5SZXN0LnByb3RvdHlwZS5kZWxldGUgPSBmdW5jdGlvbiBnZXQoYXBpVXJsLCBkYXRhKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KGFwaVVybCwgJ2RlbGV0ZScsIGRhdGEpO1xyXG59O1xyXG5cclxuUmVzdC5wcm90b3R5cGUucHV0RmlsZSA9IGZ1bmN0aW9uIHB1dEZpbGUoYXBpVXJsLCBkYXRhKSB7XHJcbiAgICAvLyBOT1RFIGJhc2ljIHB1dEZpbGUgaW1wbGVtZW50YXRpb24sIG9uZSBmaWxlLCB1c2UgZmlsZVVwbG9hZD9cclxuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoYXBpVXJsLCAnZGVsZXRlJywgZGF0YSwgJ211bHRpcGFydC9mb3JtLWRhdGEnKTtcclxufTtcclxuXHJcblJlc3QucHJvdG90eXBlLnJlcXVlc3QgPSBmdW5jdGlvbiByZXF1ZXN0KGFwaVVybCwgaHR0cE1ldGhvZCwgZGF0YSwgY29udGVudFR5cGUpIHtcclxuICAgIFxyXG4gICAgdmFyIHRoaXNSZXN0ID0gdGhpcztcclxuICAgIHZhciB1cmwgPSB0aGlzLmJhc2VVcmwgKyBhcGlVcmw7XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgkLmFqYXgoe1xyXG4gICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgIC8vIEF2b2lkIGNhY2hlIGZvciBkYXRhLlxyXG4gICAgICAgIGNhY2hlOiBmYWxzZSxcclxuICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxyXG4gICAgICAgIG1ldGhvZDogaHR0cE1ldGhvZCxcclxuICAgICAgICBoZWFkZXJzOiB0aGlzLmV4dHJhSGVhZGVycyxcclxuICAgICAgICAvLyBVUkxFTkNPREVEIGlucHV0OlxyXG4gICAgICAgIC8vIENvbnZlcnQgdG8gSlNPTiBhbmQgYmFjayBqdXN0IHRvIGVuc3VyZSB0aGUgdmFsdWVzIGFyZSBjb252ZXJ0ZWQvZW5jb2RlZFxyXG4gICAgICAgIC8vIHByb3Blcmx5IHRvIGJlIHNlbnQsIGxpa2UgRGF0ZXMgYmVpbmcgY29udmVydGVkIHRvIElTTyBmb3JtYXQuXHJcbiAgICAgICAgZGF0YTogZGF0YSAmJiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGRhdGEpKSxcclxuICAgICAgICBjb250ZW50VHlwZTogY29udGVudFR5cGUgfHwgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCdcclxuICAgICAgICAvLyBBbHRlcm5hdGU6IEpTT04gYXMgaW5wdXRcclxuICAgICAgICAvL2RhdGE6IEpTT04uc3RyaW5naWZ5KGRhdGEpLFxyXG4gICAgICAgIC8vY29udGVudFR5cGU6IGNvbnRlbnRUeXBlIHx8ICdhcHBsaWNhdGlvbi9qc29uJ1xyXG4gICAgfSkpXHJcbiAgICAudGhlbihsb3dlckNhbWVsaXplT2JqZWN0KVxyXG4gICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgIC8vIE9uIGF1dGhvcml6YXRpb24gZXJyb3IsIGdpdmUgb3BvcnR1bml0eSB0byByZXRyeSB0aGUgb3BlcmF0aW9uXHJcbiAgICAgICAgaWYgKGVyci5zdGF0dXMgPT09IDQwMSkge1xyXG4gICAgICAgICAgICB2YXIgcmV0cnkgPSByZXF1ZXN0LmJpbmQodGhpcywgYXBpVXJsLCBodHRwTWV0aG9kLCBkYXRhLCBjb250ZW50VHlwZSk7XHJcbiAgICAgICAgICAgIHZhciByZXRyeVByb21pc2UgPSB0aGlzUmVzdC5vbkF1dGhvcml6YXRpb25SZXF1aXJlZChyZXRyeSk7XHJcbiAgICAgICAgICAgIGlmIChyZXRyeVByb21pc2UpIHtcclxuICAgICAgICAgICAgICAgIC8vIEl0IHJldHVybmVkIHNvbWV0aGluZywgZXhwZWN0aW5nIGlzIGEgcHJvbWlzZTpcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmV0cnlQcm9taXNlKVxyXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlcmUgaXMgZXJyb3Igb24gcmV0cnksIGp1c3QgcmV0dXJuIHRoZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIG9yaWdpbmFsIGNhbGwgZXJyb3JcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gYnkgZGVmYXVsdCwgY29udGludWUgcHJvcGFnYXRpbmcgdGhlIGVycm9yXHJcbiAgICAgICAgcmV0dXJuIGVycjtcclxuICAgIH0pO1xyXG59O1xyXG5cclxuUmVzdC5wcm90b3R5cGUub25BdXRob3JpemF0aW9uUmVxdWlyZWQgPSBmdW5jdGlvbiBvbkF1dGhvcml6YXRpb25SZXF1aXJlZChyZXRyeSkge1xyXG4gICAgLy8gVG8gYmUgaW1wbGVtZW50ZWQgb3V0c2lkZSwgYnkgZGVmYXVsdCBkb24ndCB3YWl0XHJcbiAgICAvLyBmb3IgcmV0cnksIGp1c3QgcmV0dXJuIG5vdGhpbmc6XHJcbiAgICByZXR1cm47XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlc3Q7XHJcbiIsIi8qKlxyXG4gICAgVGltZSBjbGFzcyB1dGlsaXR5LlxyXG4gICAgU2hvcnRlciB3YXkgdG8gY3JlYXRlIGEgRGF0ZSBpbnN0YW5jZVxyXG4gICAgc3BlY2lmeWluZyBvbmx5IHRoZSBUaW1lIHBhcnQsXHJcbiAgICBkZWZhdWx0aW5nIHRvIGN1cnJlbnQgZGF0ZSBvciBcclxuICAgIGFub3RoZXIgcmVhZHkgZGF0ZSBpbnN0YW5jZS5cclxuKiovXHJcbmZ1bmN0aW9uIFRpbWUoZGF0ZSwgaG91ciwgbWludXRlLCBzZWNvbmQpIHtcclxuICAgIGlmICghKGRhdGUgaW5zdGFuY2VvZiBEYXRlKSkge1xyXG4gXHJcbiAgICAgICAgc2Vjb25kID0gbWludXRlO1xyXG4gICAgICAgIG1pbnV0ZSA9IGhvdXI7XHJcbiAgICAgICAgaG91ciA9IGRhdGU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZGF0ZSA9IG5ldyBEYXRlKCk7ICAgXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBEYXRlKGRhdGUuZ2V0RnVsbFllYXIoKSwgZGF0ZS5nZXRNb250aCgpLCBkYXRlLmdldERhdGUoKSwgaG91ciB8fCAwLCBtaW51dGUgfHwgMCwgc2Vjb25kIHx8IDApO1xyXG59XHJcbm1vZHVsZS5leHBvcnRzID0gVGltZTtcclxuIiwiLyoqXHJcbiAgICBDcmVhdGUgYW4gQWNjZXNzIENvbnRyb2wgZm9yIGFuIGFwcCB0aGF0IGp1c3QgY2hlY2tzXHJcbiAgICB0aGUgYWN0aXZpdHkgcHJvcGVydHkgZm9yIGFsbG93ZWQgdXNlciBsZXZlbC5cclxuICAgIFRvIGJlIHByb3ZpZGVkIHRvIFNoZWxsLmpzIGFuZCB1c2VkIGJ5IHRoZSBhcHAuanMsXHJcbiAgICB2ZXJ5IHRpZWQgdG8gdGhhdCBib3RoIGNsYXNzZXMuXHJcbiAgICBcclxuICAgIEFjdGl2aXRpZXMgY2FuIGRlZmluZSBvbiBpdHMgb2JqZWN0IGFuIGFjY2Vzc0xldmVsXHJcbiAgICBwcm9wZXJ0eSBsaWtlIG5leHQgZXhhbXBsZXNcclxuICAgIFxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VydHlwZS5Vc2VyOyAvLyBhbnlvbmVcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuQW5vbnltb3VzOyAvLyBhbm9ueW1vdXMgdXNlcnMgb25seVxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyOyAvLyBhdXRoZW50aWNhdGVkIHVzZXJzIG9ubHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbi8vIFVzZXJUeXBlIGVudW1lcmF0aW9uIGlzIGJpdCBiYXNlZCwgc28gc2V2ZXJhbFxyXG4vLyB1c2VycyBjYW4gaGFzIGFjY2VzcyBpbiBhIHNpbmdsZSBwcm9wZXJ0eVxyXG52YXIgVXNlclR5cGUgPSByZXF1aXJlKCcuLi9tb2RlbHMvVXNlcicpLlVzZXJUeXBlO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjcmVhdGVBY2Nlc3NDb250cm9sKGFwcCkge1xyXG4gICAgXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gYWNjZXNzQ29udHJvbChyb3V0ZSkge1xyXG5cclxuICAgICAgICB2YXIgYWN0aXZpdHkgPSBhcHAuZ2V0QWN0aXZpdHlDb250cm9sbGVyQnlSb3V0ZShyb3V0ZSk7XHJcblxyXG4gICAgICAgIHZhciB1c2VyID0gYXBwLm1vZGVsLnVzZXIoKTtcclxuICAgICAgICB2YXIgY3VycmVudFR5cGUgPSB1c2VyICYmIHVzZXIudXNlclR5cGUoKTtcclxuXHJcbiAgICAgICAgaWYgKGFjdGl2aXR5ICYmIGFjdGl2aXR5LmFjY2Vzc0xldmVsKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgY2FuID0gYWN0aXZpdHkuYWNjZXNzTGV2ZWwgJiBjdXJyZW50VHlwZTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICghY2FuKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBOb3RpZnkgZXJyb3IsIHdoeSBjYW5ub3QgYWNjZXNzXHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkTGV2ZWw6IGFjdGl2aXR5LmFjY2Vzc0xldmVsLFxyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRUeXBlOiBjdXJyZW50VHlwZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQWxsb3dcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH07XHJcbn07XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciB1bndyYXAgPSBmdW5jdGlvbiB1bndyYXAodmFsdWUpIHtcclxuICAgIHJldHVybiAodHlwZW9mKHZhbHVlKSA9PT0gJ2Z1bmN0aW9uJyA/IHZhbHVlKCkgOiB2YWx1ZSk7XHJcbn07XHJcblxyXG5leHBvcnRzLmRlZmluZUNydWRBcGlGb3JSZXN0ID0gZnVuY3Rpb24gZGVmaW5lQ3J1ZEFwaUZvclJlc3Qoc2V0dGluZ3MpIHtcclxuICAgIFxyXG4gICAgdmFyIGV4dGVuZGVkT2JqZWN0ID0gc2V0dGluZ3MuZXh0ZW5kZWRPYmplY3QsXHJcbiAgICAgICAgTW9kZWwgPSBzZXR0aW5ncy5Nb2RlbCxcclxuICAgICAgICBtb2RlbE5hbWUgPSBzZXR0aW5ncy5tb2RlbE5hbWUsXHJcbiAgICAgICAgbW9kZWxMaXN0TmFtZSA9IHNldHRpbmdzLm1vZGVsTGlzdE5hbWUsXHJcbiAgICAgICAgbW9kZWxVcmwgPSBzZXR0aW5ncy5tb2RlbFVybCxcclxuICAgICAgICBpZFByb3BlcnR5TmFtZSA9IHNldHRpbmdzLmlkUHJvcGVydHlOYW1lO1xyXG5cclxuICAgIGV4dGVuZGVkT2JqZWN0WydnZXQnICsgbW9kZWxMaXN0TmFtZV0gPSBmdW5jdGlvbiBnZXRMaXN0KGZpbHRlcnMpIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpcy5yZXN0LmdldChtb2RlbFVybCwgZmlsdGVycylcclxuICAgICAgICAudGhlbihmdW5jdGlvbihyYXdJdGVtcykge1xyXG4gICAgICAgICAgICByZXR1cm4gcmF3SXRlbXMgJiYgcmF3SXRlbXMubWFwKGZ1bmN0aW9uKHJhd0l0ZW0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTW9kZWwocmF3SXRlbSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgZXh0ZW5kZWRPYmplY3RbJ2dldCcgKyBtb2RlbE5hbWVdID0gZnVuY3Rpb24gZ2V0SXRlbShpdGVtSUQpIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpcy5yZXN0LmdldChtb2RlbFVybCArICcvJyArIGl0ZW1JRClcclxuICAgICAgICAudGhlbihmdW5jdGlvbihyYXdJdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByYXdJdGVtICYmIG5ldyBNb2RlbChyYXdJdGVtKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgZXh0ZW5kZWRPYmplY3RbJ3Bvc3QnICsgbW9kZWxOYW1lXSA9IGZ1bmN0aW9uIHBvc3RJdGVtKGFuSXRlbSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLnJlc3QucG9zdChtb2RlbFVybCwgYW5JdGVtKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHNlcnZlckl0ZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBNb2RlbChzZXJ2ZXJJdGVtKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgZXh0ZW5kZWRPYmplY3RbJ3B1dCcgKyBtb2RlbE5hbWVdID0gZnVuY3Rpb24gcHV0SXRlbShhbkl0ZW0pIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZXN0LnB1dChtb2RlbFVybCArICcvJyArIHVud3JhcChhbkl0ZW1baWRQcm9wZXJ0eU5hbWVdKSwgYW5JdGVtKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHNlcnZlckl0ZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBNb2RlbChzZXJ2ZXJJdGVtKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIGV4dGVuZGVkT2JqZWN0WydzZXQnICsgbW9kZWxOYW1lXSA9IGZ1bmN0aW9uIHNldEl0ZW0oYW5JdGVtKSB7XHJcbiAgICAgICAgdmFyIGlkID0gdW53cmFwKGFuSXRlbVtpZFByb3BlcnR5TmFtZV0pO1xyXG4gICAgICAgIGlmIChpZClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbJ3B1dCcgKyBtb2RlbE5hbWVdKGFuSXRlbSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1sncG9zdCcgKyBtb2RlbE5hbWVdKGFuSXRlbSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGV4dGVuZGVkT2JqZWN0WydkZWwnICsgbW9kZWxOYW1lXSA9IGZ1bmN0aW9uIGRlbEl0ZW0oYW5JdGVtKSB7XHJcbiAgICAgICAgdmFyIGlkID0gYW5JdGVtICYmIHVud3JhcChhbkl0ZW1baWRQcm9wZXJ0eU5hbWVdKSB8fFxyXG4gICAgICAgICAgICAgICAgYW5JdGVtO1xyXG4gICAgICAgIGlmIChpZClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5kZWxldGUobW9kZWxVcmwgKyAnLycgKyBpZCwgYW5JdGVtKVxyXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihkZWxldGVkSXRlbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlbGV0ZWRJdGVtICYmIG5ldyBNb2RlbChkZWxldGVkSXRlbSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOZWVkIGFuIElEIG9yIGFuIG9iamVjdCB3aXRoIHRoZSBJRCBwcm9wZXJ0eSB0byBkZWxldGUnKTtcclxuICAgIH07XHJcbn07IiwiLyoqXHJcbiAgICBCb290a25vY2s6IFNldCBvZiBLbm9ja291dCBCaW5kaW5nIEhlbHBlcnMgZm9yIEJvb3RzdHJhcCBqcyBjb21wb25lbnRzIChqcXVlcnkgcGx1Z2lucylcclxuICAgIFxyXG4gICAgRGVwZW5kZW5jaWVzOiBqcXVlcnlcclxuICAgIEluamVjdGVkIGRlcGVuZGVuY2llczoga25vY2tvdXRcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbi8vIERlcGVuZGVuY2llc1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4vLyBESSBpMThuIGxpYnJhcnlcclxuZXhwb3J0cy5pMThuID0gbnVsbDtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZUhlbHBlcnMoa28pIHtcclxuICAgIHZhciBoZWxwZXJzID0ge307XHJcblxyXG4gICAgLyoqIFBvcG92ZXIgQmluZGluZyAqKi9cclxuICAgIGhlbHBlcnMucG9wb3ZlciA9IHtcclxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IsIGFsbEJpbmRpbmdzKSB7XHJcbiAgICAgICAgICAgIHZhciBzcmNPcHRpb25zID0ga28udW53cmFwKHZhbHVlQWNjZXNzb3IoKSk7XHJcblxyXG4gICAgICAgICAgICAvLyBEdXBsaWNhdGluZyBvcHRpb25zIG9iamVjdCB0byBwYXNzIHRvIHBvcG92ZXIgd2l0aG91dFxyXG4gICAgICAgICAgICAvLyBvdmVyd3JpdHRuZyBzb3VyY2UgY29uZmlndXJhdGlvblxyXG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzcmNPcHRpb25zKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFVud3JhcHBpbmcgY29udGVudCB0ZXh0XHJcbiAgICAgICAgICAgIG9wdGlvbnMuY29udGVudCA9IGtvLnVud3JhcChzcmNPcHRpb25zLmNvbnRlbnQpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY29udGVudCkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIExvY2FsaXplOlxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5jb250ZW50ID0gXHJcbiAgICAgICAgICAgICAgICAgICAgZXhwb3J0cy5pMThuICYmIGV4cG9ydHMuaTE4bi50KG9wdGlvbnMuY29udGVudCkgfHxcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmNvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIFRvIGdldCB0aGUgbmV3IG9wdGlvbnMsIHdlIG5lZWQgZGVzdHJveSBpdCBmaXJzdDpcclxuICAgICAgICAgICAgICAgICQoZWxlbWVudCkucG9wb3ZlcignZGVzdHJveScpLnBvcG92ZXIob3B0aW9ucyk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU2UgbXVlc3RyYSBzaSBlbCBlbGVtZW50byB0aWVuZSBlbCBmb2NvXHJcbiAgICAgICAgICAgICAgICBpZiAoJChlbGVtZW50KS5pcygnOmZvY3VzJykpXHJcbiAgICAgICAgICAgICAgICAgICAgJChlbGVtZW50KS5wb3BvdmVyKCdzaG93Jyk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJChlbGVtZW50KS5wb3BvdmVyKCdkZXN0cm95Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICByZXR1cm4gaGVscGVycztcclxufVxyXG5cclxuLyoqXHJcbiAgICBQbHVnIGhlbHBlcnMgaW4gdGhlIHByb3ZpZGVkIEtub2Nrb3V0IGluc3RhbmNlXHJcbioqL1xyXG5mdW5jdGlvbiBwbHVnSW4oa28sIHByZWZpeCkge1xyXG4gICAgdmFyIG5hbWUsXHJcbiAgICAgICAgaGVscGVycyA9IGNyZWF0ZUhlbHBlcnMoa28pO1xyXG4gICAgXHJcbiAgICBmb3IodmFyIGggaW4gaGVscGVycykge1xyXG4gICAgICAgIGlmIChoZWxwZXJzLmhhc093blByb3BlcnR5ICYmICFoZWxwZXJzLmhhc093blByb3BlcnR5KGgpKVxyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuXHJcbiAgICAgICAgbmFtZSA9IHByZWZpeCA/IHByZWZpeCArIGhbMF0udG9VcHBlckNhc2UoKSArIGguc2xpY2UoMSkgOiBoO1xyXG4gICAgICAgIGtvLmJpbmRpbmdIYW5kbGVyc1tuYW1lXSA9IGhlbHBlcnNbaF07XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydHMucGx1Z0luID0gcGx1Z0luO1xyXG5leHBvcnRzLmNyZWF0ZUJpbmRpbmdIZWxwZXJzID0gY3JlYXRlSGVscGVycztcclxuIiwiLyoqXHJcbiAgICBFc3BhY2UgYSBzdHJpbmcgZm9yIHVzZSBvbiBhIFJlZ0V4cC5cclxuICAgIFVzdWFsbHksIHRvIGxvb2sgZm9yIGEgc3RyaW5nIGluIGEgdGV4dCBtdWx0aXBsZSB0aW1lc1xyXG4gICAgb3Igd2l0aCBzb21lIGV4cHJlc3Npb25zLCBzb21lIGNvbW1vbiBhcmUgXHJcbiAgICBsb29rIGZvciBhIHRleHQgJ2luIHRoZSBiZWdpbm5pbmcnICheKVxyXG4gICAgb3IgJ2F0IHRoZSBlbmQnICgkKS5cclxuICAgIFxyXG4gICAgQXV0aG9yOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vdXNlcnMvMTUxMzEyL2Nvb2xhajg2IGFuZCBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vdXNlcnMvOTQxMC9hcmlzdG90bGUtcGFnYWx0emlzXHJcbiAgICBMaW5rOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS82OTY5NDg2XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vLyBSZWZlcnJpbmcgdG8gdGhlIHRhYmxlIGhlcmU6XHJcbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL3JlZ2V4cFxyXG4vLyB0aGVzZSBjaGFyYWN0ZXJzIHNob3VsZCBiZSBlc2NhcGVkXHJcbi8vIFxcIF4gJCAqICsgPyAuICggKSB8IHsgfSBbIF1cclxuLy8gVGhlc2UgY2hhcmFjdGVycyBvbmx5IGhhdmUgc3BlY2lhbCBtZWFuaW5nIGluc2lkZSBvZiBicmFja2V0c1xyXG4vLyB0aGV5IGRvIG5vdCBuZWVkIHRvIGJlIGVzY2FwZWQsIGJ1dCB0aGV5IE1BWSBiZSBlc2NhcGVkXHJcbi8vIHdpdGhvdXQgYW55IGFkdmVyc2UgZWZmZWN0cyAodG8gdGhlIGJlc3Qgb2YgbXkga25vd2xlZGdlIGFuZCBjYXN1YWwgdGVzdGluZylcclxuLy8gOiAhICwgPSBcclxuLy8gbXkgdGVzdCBcIn4hQCMkJV4mKigpe31bXWAvPT8rXFx8LV87OidcXFwiLDwuPlwiLm1hdGNoKC9bXFwjXS9nKVxyXG5cclxudmFyIHNwZWNpYWxzID0gW1xyXG4gICAgLy8gb3JkZXIgbWF0dGVycyBmb3IgdGhlc2VcclxuICAgICAgXCItXCJcclxuICAgICwgXCJbXCJcclxuICAgICwgXCJdXCJcclxuICAgIC8vIG9yZGVyIGRvZXNuJ3QgbWF0dGVyIGZvciBhbnkgb2YgdGhlc2VcclxuICAgICwgXCIvXCJcclxuICAgICwgXCJ7XCJcclxuICAgICwgXCJ9XCJcclxuICAgICwgXCIoXCJcclxuICAgICwgXCIpXCJcclxuICAgICwgXCIqXCJcclxuICAgICwgXCIrXCJcclxuICAgICwgXCI/XCJcclxuICAgICwgXCIuXCJcclxuICAgICwgXCJcXFxcXCJcclxuICAgICwgXCJeXCJcclxuICAgICwgXCIkXCJcclxuICAgICwgXCJ8XCJcclxuICBdXHJcblxyXG4gIC8vIEkgY2hvb3NlIHRvIGVzY2FwZSBldmVyeSBjaGFyYWN0ZXIgd2l0aCAnXFwnXHJcbiAgLy8gZXZlbiB0aG91Z2ggb25seSBzb21lIHN0cmljdGx5IHJlcXVpcmUgaXQgd2hlbiBpbnNpZGUgb2YgW11cclxuLCByZWdleCA9IFJlZ0V4cCgnWycgKyBzcGVjaWFscy5qb2luKCdcXFxcJykgKyAnXScsICdnJylcclxuO1xyXG5cclxudmFyIGVzY2FwZVJlZ0V4cCA9IGZ1bmN0aW9uIChzdHIpIHtcclxucmV0dXJuIHN0ci5yZXBsYWNlKHJlZ2V4LCBcIlxcXFwkJlwiKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZXNjYXBlUmVnRXhwO1xyXG5cclxuLy8gdGVzdCBlc2NhcGVSZWdFeHAoXCIvcGF0aC90by9yZXM/c2VhcmNoPXRoaXMudGhhdFwiKVxyXG4iLCIvKipcclxuKiBlc2NhcGVTZWxlY3RvclxyXG4qXHJcbiogc291cmNlOiBodHRwOi8va2p2YXJnYS5ibG9nc3BvdC5jb20uZXMvMjAwOS8wNi9qcXVlcnktcGx1Z2luLXRvLWVzY2FwZS1jc3Mtc2VsZWN0b3IuaHRtbFxyXG4qXHJcbiogRXNjYXBlIGFsbCBzcGVjaWFsIGpRdWVyeSBDU1Mgc2VsZWN0b3IgY2hhcmFjdGVycyBpbiAqc2VsZWN0b3IqLlxyXG4qIFVzZWZ1bCB3aGVuIHlvdSBoYXZlIGEgY2xhc3Mgb3IgaWQgd2hpY2ggY29udGFpbnMgc3BlY2lhbCBjaGFyYWN0ZXJzXHJcbiogd2hpY2ggeW91IG5lZWQgdG8gaW5jbHVkZSBpbiBhIHNlbGVjdG9yLlxyXG4qL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgc3BlY2lhbHMgPSBbXHJcbiAgJyMnLCAnJicsICd+JywgJz0nLCAnPicsIFxyXG4gIFwiJ1wiLCAnOicsICdcIicsICchJywgJzsnLCAnLCdcclxuXTtcclxudmFyIHJlZ2V4U3BlY2lhbHMgPSBbXHJcbiAgJy4nLCAnKicsICcrJywgJ3wnLCAnWycsICddJywgJygnLCAnKScsICcvJywgJ14nLCAnJCdcclxuXTtcclxudmFyIHNSRSA9IG5ldyBSZWdFeHAoXHJcbiAgJygnICsgc3BlY2lhbHMuam9pbignfCcpICsgJ3xcXFxcJyArIHJlZ2V4U3BlY2lhbHMuam9pbignfFxcXFwnKSArICcpJywgJ2cnXHJcbik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgcmV0dXJuIHNlbGVjdG9yLnJlcGxhY2Uoc1JFLCAnXFxcXCQxJyk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgUmVhZCBhIHBhZ2UncyBHRVQgVVJMIHZhcmlhYmxlcyBhbmQgcmV0dXJuIHRoZW0gYXMgYW4gYXNzb2NpYXRpdmUgYXJyYXkuXHJcbioqL1xyXG4ndXNlciBzdHJpY3QnO1xyXG4vL2dsb2JhbCB3aW5kb3dcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0VXJsUXVlcnkodXJsKSB7XHJcblxyXG4gICAgdXJsID0gdXJsIHx8IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xyXG5cclxuICAgIHZhciB2YXJzID0gW10sIGhhc2gsXHJcbiAgICAgICAgcXVlcnlJbmRleCA9IHVybC5pbmRleE9mKCc/Jyk7XHJcbiAgICBpZiAocXVlcnlJbmRleCA+IC0xKSB7XHJcbiAgICAgICAgdmFyIGhhc2hlcyA9IHVybC5zbGljZShxdWVyeUluZGV4ICsgMSkuc3BsaXQoJyYnKTtcclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgaGFzaGVzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaGFzaCA9IGhhc2hlc1tpXS5zcGxpdCgnPScpO1xyXG4gICAgICAgICAgICB2YXJzLnB1c2goaGFzaFswXSk7XHJcbiAgICAgICAgICAgIHZhcnNbaGFzaFswXV0gPSBoYXNoWzFdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB2YXJzO1xyXG59O1xyXG4iLCIvKipcclxuICAgIFNldCBvZiB1dGlsaXRpZXMgdG8gZGVmaW5lIEphdmFzY3JpcHQgUHJvcGVydGllc1xyXG4gICAgaW5kZXBlbmRlbnRseSBvZiB0aGUgYnJvd3Nlci5cclxuICAgIFxyXG4gICAgQWxsb3dzIHRvIGRlZmluZSBnZXR0ZXJzIGFuZCBzZXR0ZXJzLlxyXG4gICAgXHJcbiAgICBBZGFwdGVkIGNvZGUgZnJvbSB0aGUgb3JpZ2luYWwgY3JlYXRlZCBieSBKZWZmIFdhbGRlblxyXG4gICAgaHR0cDovL3doZXJlc3dhbGRlbi5jb20vMjAxMC8wNC8xNi9tb3JlLXNwaWRlcm1vbmtleS1jaGFuZ2VzLWFuY2llbnQtZXNvdGVyaWMtdmVyeS1yYXJlbHktdXNlZC1zeW50YXgtZm9yLWNyZWF0aW5nLWdldHRlcnMtYW5kLXNldHRlcnMtaXMtYmVpbmctcmVtb3ZlZC9cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIGFjY2Vzc29yRGVzY3JpcHRvcihmaWVsZCwgZnVuKVxyXG57XHJcbiAgICB2YXIgZGVzYyA9IHsgZW51bWVyYWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH07XHJcbiAgICBkZXNjW2ZpZWxkXSA9IGZ1bjtcclxuICAgIHJldHVybiBkZXNjO1xyXG59XHJcblxyXG5mdW5jdGlvbiBkZWZpbmVHZXR0ZXIob2JqLCBwcm9wLCBnZXQpXHJcbntcclxuICAgIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydHkpXHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIHByb3AsIGFjY2Vzc29yRGVzY3JpcHRvcihcImdldFwiLCBnZXQpKTtcclxuICAgIGlmIChPYmplY3QucHJvdG90eXBlLl9fZGVmaW5lR2V0dGVyX18pXHJcbiAgICAgICAgcmV0dXJuIG9iai5fX2RlZmluZUdldHRlcl9fKHByb3AsIGdldCk7XHJcblxyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IGdldHRlcnNcIik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRlZmluZVNldHRlcihvYmosIHByb3AsIHNldClcclxue1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSlcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgcHJvcCwgYWNjZXNzb3JEZXNjcmlwdG9yKFwic2V0XCIsIHNldCkpO1xyXG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuX19kZWZpbmVTZXR0ZXJfXylcclxuICAgICAgICByZXR1cm4gb2JqLl9fZGVmaW5lU2V0dGVyX18ocHJvcCwgc2V0KTtcclxuXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgc2V0dGVyc1wiKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBkZWZpbmVHZXR0ZXI6IGRlZmluZUdldHRlcixcclxuICAgIGRlZmluZVNldHRlcjogZGVmaW5lU2V0dGVyXHJcbn07XHJcbiIsIi8qKlxyXG4gICAgRG9tSXRlbXNNYW5hZ2VyIGNsYXNzLCB0aGF0IG1hbmFnZSBhIGNvbGxlY3Rpb24gXHJcbiAgICBvZiBIVE1ML0RPTSBpdGVtcyB1bmRlciBhIHJvb3QvY29udGFpbmVyLCB3aGVyZVxyXG4gICAgb25seSBvbmUgZWxlbWVudCBhdCB0aGUgdGltZSBpcyB2aXNpYmxlLCBwcm92aWRpbmdcclxuICAgIHRvb2xzIHRvIHVuaXF1ZXJseSBpZGVudGlmeSB0aGUgaXRlbXMsXHJcbiAgICB0byBjcmVhdGUgb3IgdXBkYXRlIG5ldyBpdGVtcyAodGhyb3VnaCAnaW5qZWN0JyksXHJcbiAgICBnZXQgdGhlIGN1cnJlbnQsIGZpbmQgYnkgdGhlIElEIGFuZCBtb3JlLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGVzY2FwZVNlbGVjdG9yID0gcmVxdWlyZSgnLi4vZXNjYXBlU2VsZWN0b3InKTtcclxuXHJcbmZ1bmN0aW9uIERvbUl0ZW1zTWFuYWdlcihzZXR0aW5ncykge1xyXG5cclxuICAgIHRoaXMuaWRBdHRyaWJ1dGVOYW1lID0gc2V0dGluZ3MuaWRBdHRyaWJ1dGVOYW1lIHx8ICdpZCc7XHJcbiAgICB0aGlzLmFsbG93RHVwbGljYXRlcyA9ICEhc2V0dGluZ3MuYWxsb3dEdXBsaWNhdGVzIHx8IGZhbHNlO1xyXG4gICAgdGhpcy4kcm9vdCA9IG51bGw7XHJcbiAgICAvLyBPbiBwYWdlIHJlYWR5LCBnZXQgdGhlIHJvb3QgZWxlbWVudDpcclxuICAgICQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy4kcm9vdCA9ICQoc2V0dGluZ3Mucm9vdCB8fCAnYm9keScpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBEb21JdGVtc01hbmFnZXI7XHJcblxyXG5Eb21JdGVtc01hbmFnZXIucHJvdG90eXBlLmZpbmQgPSBmdW5jdGlvbiBmaW5kKGNvbnRhaW5lck5hbWUsIHJvb3QpIHtcclxuICAgIHZhciAkcm9vdCA9ICQocm9vdCB8fCB0aGlzLiRyb290KTtcclxuICAgIHJldHVybiAkcm9vdC5maW5kKCdbJyArIHRoaXMuaWRBdHRyaWJ1dGVOYW1lICsgJz1cIicgKyBlc2NhcGVTZWxlY3Rvcihjb250YWluZXJOYW1lKSArICdcIl0nKTtcclxufTtcclxuXHJcbkRvbUl0ZW1zTWFuYWdlci5wcm90b3R5cGUuZ2V0QWN0aXZlID0gZnVuY3Rpb24gZ2V0QWN0aXZlKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuJHJvb3QuZmluZCgnWycgKyB0aGlzLmlkQXR0cmlidXRlTmFtZSArICddOnZpc2libGUnKTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgSXQgYWRkcyB0aGUgaXRlbSBpbiB0aGUgaHRtbCBwcm92aWRlZCAoY2FuIGJlIG9ubHkgdGhlIGVsZW1lbnQgb3IgXHJcbiAgICBjb250YWluZWQgaW4gYW5vdGhlciBvciBhIGZ1bGwgaHRtbCBwYWdlKS5cclxuICAgIFJlcGxhY2VzIGFueSBleGlzdGFudCBpZiBkdXBsaWNhdGVzIGFyZSBub3QgYWxsb3dlZC5cclxuKiovXHJcbkRvbUl0ZW1zTWFuYWdlci5wcm90b3R5cGUuaW5qZWN0ID0gZnVuY3Rpb24gaW5qZWN0KG5hbWUsIGh0bWwpIHtcclxuXHJcbiAgICAvLyBGaWx0ZXJpbmcgaW5wdXQgaHRtbCAoY2FuIGJlIHBhcnRpYWwgb3IgZnVsbCBwYWdlcylcclxuICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEyODQ4Nzk4XHJcbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKC9eW1xcc1xcU10qPGJvZHkuKj8+fDxcXC9ib2R5PltcXHNcXFNdKiQvZywgJycpO1xyXG5cclxuICAgIC8vIENyZWF0aW5nIGEgd3JhcHBlciBhcm91bmQgdGhlIGh0bWxcclxuICAgIC8vIChjYW4gYmUgcHJvdmlkZWQgdGhlIGlubmVySHRtbCBvciBvdXRlckh0bWwsIGRvZXNuJ3QgbWF0dGVycyB3aXRoIG5leHQgYXBwcm9hY2gpXHJcbiAgICB2YXIgJGh0bWwgPSAkKCc8ZGl2Lz4nLCB7IGh0bWw6IGh0bWwgfSksXHJcbiAgICAgICAgLy8gV2UgbG9vayBmb3IgdGhlIGNvbnRhaW5lciBlbGVtZW50ICh3aGVuIHRoZSBvdXRlckh0bWwgaXMgcHJvdmlkZWQpXHJcbiAgICAgICAgJGMgPSB0aGlzLmZpbmQobmFtZSwgJGh0bWwpO1xyXG5cclxuICAgIGlmICgkYy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAvLyBJdHMgaW5uZXJIdG1sLCBzbyB0aGUgd3JhcHBlciBiZWNvbWVzIHRoZSBjb250YWluZXIgaXRzZWxmXHJcbiAgICAgICAgJGMgPSAkaHRtbC5hdHRyKHRoaXMuaWRBdHRyaWJ1dGVOYW1lLCBuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMuYWxsb3dEdXBsaWNhdGVzKSB7XHJcbiAgICAgICAgLy8gTm8gbW9yZSB0aGFuIG9uZSBjb250YWluZXIgaW5zdGFuY2UgY2FuIGV4aXN0cyBhdCB0aGUgc2FtZSB0aW1lXHJcbiAgICAgICAgLy8gV2UgbG9vayBmb3IgYW55IGV4aXN0ZW50IG9uZSBhbmQgaXRzIHJlcGxhY2VkIHdpdGggdGhlIG5ld1xyXG4gICAgICAgIHZhciAkcHJldiA9IHRoaXMuZmluZChuYW1lKTtcclxuICAgICAgICBpZiAoJHByZXYubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAkcHJldi5yZXBsYWNlV2l0aCgkYyk7XHJcbiAgICAgICAgICAgICRjID0gJHByZXY7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEFkZCB0byB0aGUgZG9jdW1lbnRcclxuICAgIC8vIChvbiB0aGUgY2FzZSBvZiBkdXBsaWNhdGVkIGZvdW5kLCB0aGlzIHdpbGwgZG8gbm90aGluZywgbm8gd29ycnkpXHJcbiAgICAkYy5hcHBlbmRUbyh0aGlzLiRyb290KTtcclxufTtcclxuXHJcbi8qKiBcclxuICAgIFRoZSBzd2l0Y2ggbWV0aG9kIHJlY2VpdmUgdGhlIGl0ZW1zIHRvIGludGVyY2hhbmdlIGFzIGFjdGl2ZSBvciBjdXJyZW50LFxyXG4gICAgdGhlICdmcm9tJyBhbmQgJ3RvJywgYW5kIHRoZSBzaGVsbCBpbnN0YW5jZSB0aGF0IE1VU1QgYmUgdXNlZFxyXG4gICAgdG8gbm90aWZ5IGVhY2ggZXZlbnQgdGhhdCBpbnZvbHZlcyB0aGUgaXRlbTpcclxuICAgIHdpbGxDbG9zZSwgd2lsbE9wZW4sIHJlYWR5LCBvcGVuZWQsIGNsb3NlZC5cclxuICAgIEl0IHJlY2VpdmVzIGFzIGxhdGVzdCBwYXJhbWV0ZXIgdGhlICdub3RpZmljYXRpb24nIG9iamVjdCB0aGF0IG11c3QgYmVcclxuICAgIHBhc3NlZCB3aXRoIHRoZSBldmVudCBzbyBoYW5kbGVycyBoYXMgY29udGV4dCBzdGF0ZSBpbmZvcm1hdGlvbi5cclxuICAgIFxyXG4gICAgSXQncyBkZXNpZ25lZCB0byBiZSBhYmxlIHRvIG1hbmFnZSB0cmFuc2l0aW9ucywgYnV0IHRoaXMgZGVmYXVsdFxyXG4gICAgaW1wbGVtZW50YXRpb24gaXMgYXMgc2ltcGxlIGFzICdzaG93IHRoZSBuZXcgYW5kIGhpZGUgdGhlIG9sZCcuXHJcbioqL1xyXG5Eb21JdGVtc01hbmFnZXIucHJvdG90eXBlLnN3aXRjaCA9IGZ1bmN0aW9uIHN3aXRjaEFjdGl2ZUl0ZW0oJGZyb20sICR0bywgc2hlbGwsIG5vdGlmaWNhdGlvbikge1xyXG5cclxuICAgIGlmICghJHRvLmlzKCc6dmlzaWJsZScpKSB7XHJcbiAgICAgICAgc2hlbGwuZW1pdChzaGVsbC5ldmVudHMud2lsbE9wZW4sICR0bywgbm90aWZpY2F0aW9uKTtcclxuICAgICAgICAkdG8uc2hvdygpO1xyXG4gICAgICAgIC8vIEl0cyBlbm91Z2ggdmlzaWJsZSBhbmQgaW4gRE9NIHRvIHBlcmZvcm0gaW5pdGlhbGl6YXRpb24gdGFza3NcclxuICAgICAgICAvLyB0aGF0IG1heSBpbnZvbHZlIGxheW91dCBpbmZvcm1hdGlvblxyXG4gICAgICAgIHNoZWxsLmVtaXQoc2hlbGwuZXZlbnRzLml0ZW1SZWFkeSwgJHRvLCBub3RpZmljYXRpb24pO1xyXG4gICAgICAgIC8vIFdoZW4gaXRzIGNvbXBsZXRlbHkgb3BlbmVkXHJcbiAgICAgICAgc2hlbGwuZW1pdChzaGVsbC5ldmVudHMub3BlbmVkLCAkdG8sIG5vdGlmaWNhdGlvbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEl0cyByZWFkeTsgbWF5YmUgaXQgd2FzIGJ1dCBzdWItbG9jYXRpb25cclxuICAgICAgICAvLyBvciBzdGF0ZSBjaGFuZ2UgbmVlZCB0byBiZSBjb21tdW5pY2F0ZWRcclxuICAgICAgICBzaGVsbC5lbWl0KHNoZWxsLmV2ZW50cy5pdGVtUmVhZHksICR0bywgbm90aWZpY2F0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoJGZyb20uaXMoJzp2aXNpYmxlJykpIHtcclxuICAgICAgICBzaGVsbC5lbWl0KHNoZWxsLmV2ZW50cy53aWxsQ2xvc2UsICRmcm9tLCBub3RpZmljYXRpb24pO1xyXG4gICAgICAgIC8vIERvICd1bmZvY3VzJyBvbiB0aGUgaGlkZGVuIGVsZW1lbnQgYWZ0ZXIgbm90aWZ5ICd3aWxsQ2xvc2UnXHJcbiAgICAgICAgLy8gZm9yIGJldHRlciBVWDogaGlkZGVuIGVsZW1lbnRzIGFyZSBub3QgcmVhY2hhYmxlIGFuZCBoYXMgZ29vZFxyXG4gICAgICAgIC8vIHNpZGUgZWZmZWN0cyBsaWtlIGhpZGRpbmcgdGhlIG9uLXNjcmVlbiBrZXlib2FyZCBpZiBhbiBpbnB1dCB3YXNcclxuICAgICAgICAvLyBmb2N1c2VkXHJcbiAgICAgICAgJGZyb20uZmluZCgnOmZvY3VzJykuYmx1cigpO1xyXG4gICAgICAgIC8vIGhpZGUgYW5kIG5vdGlmeSBpdCBlbmRlZFxyXG4gICAgICAgICRmcm9tLmhpZGUoKTtcclxuICAgICAgICBzaGVsbC5lbWl0KHNoZWxsLmV2ZW50cy5jbG9zZWQsICRmcm9tLCBub3RpZmljYXRpb24pO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAgICBJbml0aWFsaXplcyB0aGUgbGlzdCBvZiBpdGVtcy4gTm8gbW9yZSB0aGFuIG9uZVxyXG4gICAgbXVzdCBiZSBvcGVuZWQvdmlzaWJsZSBhdCB0aGUgc2FtZSB0aW1lLCBzbyBhdCB0aGUgXHJcbiAgICBpbml0IGFsbCB0aGUgZWxlbWVudHMgYXJlIGNsb3NlZCB3YWl0aW5nIHRvIHNldFxyXG4gICAgb25lIGFzIHRoZSBhY3RpdmUgb3IgdGhlIGN1cnJlbnQgb25lLlxyXG4qKi9cclxuRG9tSXRlbXNNYW5hZ2VyLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gaW5pdCgpIHtcclxuICAgIHRoaXMuZ2V0QWN0aXZlKCkuaGlkZSgpO1xyXG59O1xyXG4iLCIvKipcclxuICAgIEphdmFzY3JpdHAgU2hlbGwgZm9yIFNQQXMuXHJcbioqL1xyXG4vKmdsb2JhbCB3aW5kb3csIGRvY3VtZW50ICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKiBESSBlbnRyeSBwb2ludHMgZm9yIGRlZmF1bHQgYnVpbGRzLiBNb3N0IGRlcGVuZGVuY2llcyBjYW4gYmVcclxuICAgIHNwZWNpZmllZCBpbiB0aGUgY29uc3RydWN0b3Igc2V0dGluZ3MgZm9yIHBlci1pbnN0YW5jZSBzZXR1cC5cclxuKiovXHJcbnZhciBkZXBzID0gcmVxdWlyZSgnLi9kZXBlbmRlbmNpZXMnKTtcclxuXHJcbi8qKiBDb25zdHJ1Y3RvciAqKi9cclxuXHJcbmZ1bmN0aW9uIFNoZWxsKHNldHRpbmdzKSB7XHJcbiAgICAvL2pzaGludCBtYXhjb21wbGV4aXR5OjE0XHJcbiAgICBcclxuICAgIGRlcHMuRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XHJcblxyXG4gICAgdGhpcy4kID0gc2V0dGluZ3MuanF1ZXJ5IHx8IGRlcHMuanF1ZXJ5O1xyXG4gICAgdGhpcy4kcm9vdCA9IHRoaXMuJChzZXR0aW5ncy5yb290KTtcclxuICAgIHRoaXMuYmFzZVVybCA9IHNldHRpbmdzLmJhc2VVcmwgfHwgJyc7XHJcbiAgICAvLyBXaXRoIGZvcmNlSGFzaGJhbmc9dHJ1ZTpcclxuICAgIC8vIC0gZnJhZ21lbnRzIFVSTHMgY2Fubm90IGJlIHVzZWQgdG8gc2Nyb2xsIHRvIGFuIGVsZW1lbnQgKGRlZmF1bHQgYnJvd3NlciBiZWhhdmlvciksXHJcbiAgICAvLyAgIHRoZXkgYXJlIGRlZmF1bHRQcmV2ZW50ZWQgdG8gYXZvaWQgY29uZnVzZSB0aGUgcm91dGluZyBtZWNoYW5pc20gYW5kIGN1cnJlbnQgVVJMLlxyXG4gICAgLy8gLSBwcmVzc2VkIGxpbmtzIHRvIGZyYWdtZW50cyBVUkxzIGFyZSBub3Qgcm91dGVkLCB0aGV5IGFyZSBza2lwcGVkIHNpbGVudGx5XHJcbiAgICAvLyAgIGV4Y2VwdCB3aGVuIHRoZXkgYXJlIGEgaGFzaGJhbmcgKCMhKS4gVGhpcyB3YXksIHNwZWNpYWwgbGlua3NcclxuICAgIC8vICAgdGhhdCBwZXJmb3JtbiBqcyBhY3Rpb25zIGRvZXNuJ3QgY29uZmxpdHMuXHJcbiAgICAvLyAtIGFsbCBVUkxzIHJvdXRlZCB0aHJvdWdoIHRoZSBzaGVsbCBpbmNsdWRlcyBhIGhhc2hiYW5nICgjISksIHRoZSBzaGVsbCBlbnN1cmVzXHJcbiAgICAvLyAgIHRoYXQgaGFwcGVucyBieSBhcHBlbmRpbmcgdGhlIGhhc2hiYW5nIHRvIGFueSBVUkwgcGFzc2VkIGluIChleGNlcHQgdGhlIHN0YW5kYXJkIGhhc2hcclxuICAgIC8vICAgdGhhdCBhcmUgc2tpcHQpLlxyXG4gICAgdGhpcy5mb3JjZUhhc2hiYW5nID0gc2V0dGluZ3MuZm9yY2VIYXNoYmFuZyB8fCBmYWxzZTtcclxuICAgIHRoaXMubGlua0V2ZW50ID0gc2V0dGluZ3MubGlua0V2ZW50IHx8ICdjbGljayc7XHJcbiAgICB0aGlzLnBhcnNlVXJsID0gKHNldHRpbmdzLnBhcnNlVXJsIHx8IGRlcHMucGFyc2VVcmwpLmJpbmQodGhpcywgdGhpcy5iYXNlVXJsKTtcclxuICAgIHRoaXMuYWJzb2x1dGl6ZVVybCA9IChzZXR0aW5ncy5hYnNvbHV0aXplVXJsIHx8IGRlcHMuYWJzb2x1dGl6ZVVybCkuYmluZCh0aGlzLCB0aGlzLmJhc2VVcmwpO1xyXG5cclxuICAgIHRoaXMuaGlzdG9yeSA9IHNldHRpbmdzLmhpc3RvcnkgfHwgd2luZG93Lmhpc3Rvcnk7XHJcblxyXG4gICAgdGhpcy5pbmRleE5hbWUgPSBzZXR0aW5ncy5pbmRleE5hbWUgfHwgJ2luZGV4JztcclxuICAgIFxyXG4gICAgdGhpcy5pdGVtcyA9IHNldHRpbmdzLmRvbUl0ZW1zTWFuYWdlcjtcclxuXHJcbiAgICAvLyBsb2FkZXIgY2FuIGJlIGRpc2FibGVkIHBhc3NpbmcgJ251bGwnLCBzbyB3ZSBtdXN0XHJcbiAgICAvLyBlbnN1cmUgdG8gbm90IHVzZSB0aGUgZGVmYXVsdCBvbiB0aGF0IGNhc2VzOlxyXG4gICAgdGhpcy5sb2FkZXIgPSB0eXBlb2Yoc2V0dGluZ3MubG9hZGVyKSA9PT0gJ3VuZGVmaW5lZCcgPyBkZXBzLmxvYWRlciA6IHNldHRpbmdzLmxvYWRlcjtcclxuICAgIC8vIGxvYWRlciBzZXR1cFxyXG4gICAgaWYgKHRoaXMubG9hZGVyKVxyXG4gICAgICAgIHRoaXMubG9hZGVyLmJhc2VVcmwgPSB0aGlzLmJhc2VVcmw7XHJcblxyXG4gICAgLy8gRGVmaW5pdGlvbiBvZiBldmVudHMgdGhhdCB0aGlzIG9iamVjdCBjYW4gdHJpZ2dlcixcclxuICAgIC8vIGl0cyB2YWx1ZSBjYW4gYmUgY3VzdG9taXplZCBidXQgYW55IGxpc3RlbmVyIG5lZWRzXHJcbiAgICAvLyB0byBrZWVwIHVwZGF0ZWQgdG8gdGhlIGNvcnJlY3QgZXZlbnQgc3RyaW5nLW5hbWUgdXNlZC5cclxuICAgIC8vIFRoZSBpdGVtcyBtYW5pcHVsYXRpb24gZXZlbnRzIE1VU1QgYmUgdHJpZ2dlcmVkXHJcbiAgICAvLyBieSB0aGUgJ2l0ZW1zLnN3aXRjaCcgZnVuY3Rpb25cclxuICAgIHRoaXMuZXZlbnRzID0ge1xyXG4gICAgICAgIHdpbGxPcGVuOiAnc2hlbGwtd2lsbC1vcGVuJyxcclxuICAgICAgICB3aWxsQ2xvc2U6ICdzaGVsbC13aWxsLWNsb3NlJyxcclxuICAgICAgICBpdGVtUmVhZHk6ICdzaGVsbC1pdGVtLXJlYWR5JyxcclxuICAgICAgICBjbG9zZWQ6ICdzaGVsbC1jbG9zZWQnLFxyXG4gICAgICAgIG9wZW5lZDogJ3NoZWxsLW9wZW5lZCdcclxuICAgIH07XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEEgZnVuY3Rpb24gdG8gZGVjaWRlIGlmIHRoZVxyXG4gICAgICAgIGFjY2VzcyBpcyBhbGxvd2VkIChyZXR1cm5zICdudWxsJylcclxuICAgICAgICBvciBub3QgKHJldHVybiBhIHN0YXRlIG9iamVjdCB3aXRoIGluZm9ybWF0aW9uXHJcbiAgICAgICAgdGhhdCB3aWxsIGJlIHBhc3NlZCB0byB0aGUgJ25vbkFjY2Vzc05hbWUnIGl0ZW07XHJcbiAgICAgICAgdGhlICdyb3V0ZScgcHJvcGVydHkgb24gdGhlIHN0YXRlIGlzIGF1dG9tYXRpY2FsbHkgZmlsbGVkKS5cclxuICAgICAgICBcclxuICAgICAgICBUaGUgZGVmYXVsdCBidWl0LWluIGp1c3QgYWxsb3cgZXZlcnl0aGluZyBcclxuICAgICAgICBieSBqdXN0IHJldHVybmluZyAnbnVsbCcgYWxsIHRoZSB0aW1lLlxyXG4gICAgICAgIFxyXG4gICAgICAgIEl0IHJlY2VpdmVzIGFzIHBhcmFtZXRlciB0aGUgc3RhdGUgb2JqZWN0LFxyXG4gICAgICAgIHRoYXQgYWxtb3N0IGNvbnRhaW5zIHRoZSAncm91dGUnIHByb3BlcnR5IHdpdGhcclxuICAgICAgICBpbmZvcm1hdGlvbiBhYm91dCB0aGUgVVJMLlxyXG4gICAgKiovXHJcbiAgICB0aGlzLmFjY2Vzc0NvbnRyb2wgPSBzZXR0aW5ncy5hY2Nlc3NDb250cm9sIHx8IGRlcHMuYWNjZXNzQ29udHJvbDtcclxuICAgIC8vIFdoYXQgaXRlbSBsb2FkIG9uIG5vbiBhY2Nlc3NcclxuICAgIHRoaXMubm9uQWNjZXNzTmFtZSA9IHNldHRpbmdzLm5vbkFjY2Vzc05hbWUgfHwgJ2luZGV4JztcclxufVxyXG5cclxuLy8gU2hlbGwgaW5oZXJpdHMgZnJvbSBFdmVudEVtaXR0ZXJcclxuU2hlbGwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShkZXBzLkV2ZW50RW1pdHRlci5wcm90b3R5cGUsIHtcclxuICAgIGNvbnN0cnVjdG9yOiB7XHJcbiAgICAgICAgdmFsdWU6IFNoZWxsLFxyXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxyXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2hlbGw7XHJcblxyXG5cclxuLyoqIEFQSSBkZWZpbml0aW9uICoqL1xyXG5cclxuU2hlbGwucHJvdG90eXBlLmdvID0gZnVuY3Rpb24gZ28odXJsLCBzdGF0ZSkge1xyXG5cclxuICAgIGlmICh0aGlzLmZvcmNlSGFzaGJhbmcpIHtcclxuICAgICAgICBpZiAoIS9eIyEvLnRlc3QodXJsKSkge1xyXG4gICAgICAgICAgICB1cmwgPSAnIyEnICsgdXJsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHVybCA9IHRoaXMuYWJzb2x1dGl6ZVVybCh1cmwpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5oaXN0b3J5LnB1c2hTdGF0ZShzdGF0ZSwgdW5kZWZpbmVkLCB1cmwpO1xyXG4gICAgLy8gcHVzaFN0YXRlIGRvIE5PVCB0cmlnZ2VyIHRoZSBwb3BzdGF0ZSBldmVudCwgc29cclxuICAgIHJldHVybiB0aGlzLnJlcGxhY2Uoc3RhdGUpO1xyXG59O1xyXG5cclxuU2hlbGwucHJvdG90eXBlLmdvQmFjayA9IGZ1bmN0aW9uIGdvQmFjayhzdGF0ZSwgc3RlcHMpIHtcclxuICAgIHN0ZXBzID0gMCAtIChzdGVwcyB8fCAxKTtcclxuICAgIC8vIElmIHRoZXJlIGlzIG5vdGhpbmcgdG8gZ28tYmFjayBvciBub3QgZW5vdWdodFxyXG4gICAgLy8gJ2JhY2snIHN0ZXBzLCBnbyB0byB0aGUgaW5kZXhcclxuICAgIGlmIChzdGVwcyA8IDAgJiYgTWF0aC5hYnMoc3RlcHMpID49IHRoaXMuaGlzdG9yeS5sZW5ndGgpIHtcclxuICAgICAgICB0aGlzLmdvKHRoaXMuaW5kZXhOYW1lKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIC8vIE9uIHJlcGxhY2UsIHRoZSBwYXNzZWQgc3RhdGUgaXMgbWVyZ2VkIHdpdGhcclxuICAgICAgICAvLyB0aGUgb25lIHRoYXQgY29tZXMgZnJvbSB0aGUgc2F2ZWQgaGlzdG9yeVxyXG4gICAgICAgIC8vIGVudHJ5IChpdCAncG9wcycgd2hlbiBkb2luZyB0aGUgaGlzdG9yeS5nbygpKVxyXG4gICAgICAgIHRoaXMuX3BlbmRpbmdTdGF0ZVVwZGF0ZSA9IHN0YXRlO1xyXG4gICAgICAgIHRoaXMuaGlzdG9yeS5nbyhzdGVwcyk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICAgIFByb2Nlc3MgdGhlIGdpdmVuIHN0YXRlIGluIG9yZGVyIHRvIGdldCB0aGUgY3VycmVudCBzdGF0ZVxyXG4gICAgYmFzZWQgb24gdGhhdCBvciB0aGUgc2F2ZWQgaW4gaGlzdG9yeSwgbWVyZ2UgaXQgd2l0aFxyXG4gICAgYW55IHVwZGF0ZWQgc3RhdGUgcGVuZGluZyBhbmQgYWRkcyB0aGUgcm91dGUgaW5mb3JtYXRpb24sXHJcbiAgICByZXR1cm5pbmcgYW4gc3RhdGUgb2JqZWN0IHN1aXRhYmxlIHRvIHVzZS5cclxuKiovXHJcblNoZWxsLnByb3RvdHlwZS5nZXRVcGRhdGVkU3RhdGUgPSBmdW5jdGlvbiBnZXRVcGRhdGVkU3RhdGUoc3RhdGUpIHtcclxuICAgIC8qanNoaW50IG1heGNvbXBsZXhpdHk6IDggKi9cclxuICAgIFxyXG4gICAgLy8gRm9yIGN1cnJlbnQgdXNlcywgYW55IHBlbmRpbmdTdGF0ZVVwZGF0ZSBpcyB1c2VkIGFzXHJcbiAgICAvLyB0aGUgc3RhdGUsIHJhdGhlciB0aGFuIHRoZSBwcm92aWRlZCBvbmVcclxuICAgIHN0YXRlID0gdGhpcy5fcGVuZGluZ1N0YXRlVXBkYXRlIHx8IHN0YXRlIHx8IHRoaXMuaGlzdG9yeS5zdGF0ZSB8fCB7fTtcclxuICAgIFxyXG4gICAgLy8gVE9ETzogbW9yZSBhZHZhbmNlZCB1c2VzIG11c3QgYmUgdG8gdXNlIHRoZSAnc3RhdGUnIHRvXHJcbiAgICAvLyByZWNvdmVyIHRoZSBVSSBzdGF0ZSwgd2l0aCBhbnkgbWVzc2FnZSBmcm9tIG90aGVyIFVJXHJcbiAgICAvLyBwYXNzaW5nIGluIGEgd2F5IHRoYXQgYWxsb3cgdXBkYXRlIHRoZSBzdGF0ZSwgbm90XHJcbiAgICAvLyByZXBsYWNlIGl0IChmcm9tIHBlbmRpbmdTdGF0ZVVwZGF0ZSkuXHJcbiAgICAvKlxyXG4gICAgLy8gU3RhdGUgb3IgZGVmYXVsdCBzdGF0ZVxyXG4gICAgc3RhdGUgPSBzdGF0ZSB8fCB0aGlzLmhpc3Rvcnkuc3RhdGUgfHwge307XHJcbiAgICAvLyBtZXJnZSBwZW5kaW5nIHVwZGF0ZWQgc3RhdGVcclxuICAgIHRoaXMuJC5leHRlbmQoc3RhdGUsIHRoaXMuX3BlbmRpbmdTdGF0ZVVwZGF0ZSk7XHJcbiAgICAvLyBkaXNjYXJkIHRoZSB1cGRhdGVcclxuICAgICovXHJcbiAgICB0aGlzLl9wZW5kaW5nU3RhdGVVcGRhdGUgPSBudWxsO1xyXG4gICAgXHJcbiAgICAvLyBEb2Vzbid0IG1hdHRlcnMgaWYgc3RhdGUgaW5jbHVkZXMgYWxyZWFkeSBcclxuICAgIC8vICdyb3V0ZScgaW5mb3JtYXRpb24sIG5lZWQgdG8gYmUgb3ZlcndyaXR0ZW5cclxuICAgIC8vIHRvIG1hdGNoIHRoZSBjdXJyZW50IG9uZS5cclxuICAgIC8vIE5PVEU6IHByZXZpb3VzbHksIGEgY2hlY2sgcHJldmVudGVkIHRoaXMgaWZcclxuICAgIC8vIHJvdXRlIHByb3BlcnR5IGV4aXN0cywgY3JlYXRpbmcgaW5maW5pdGUgbG9vcHNcclxuICAgIC8vIG9uIHJlZGlyZWN0aW9ucyBmcm9tIGFjdGl2aXR5LnNob3cgc2luY2UgJ3JvdXRlJyBkb2Vzbid0XHJcbiAgICAvLyBtYXRjaCB0aGUgbmV3IGRlc2lyZWQgbG9jYXRpb25cclxuICAgIFxyXG4gICAgLy8gRGV0ZWN0IGlmIGlzIGEgaGFzaGJhbmcgVVJMIG9yIGFuIHN0YW5kYXJkIG9uZS5cclxuICAgIC8vIEV4Y2VwdCBpZiB0aGUgYXBwIGlzIGZvcmNlZCB0byB1c2UgaGFzaGJhbmcuXHJcbiAgICB2YXIgaXNIYXNoQmFuZyA9IC8jIS8udGVzdChsb2NhdGlvbi5ocmVmKSB8fCB0aGlzLmZvcmNlSGFzaGJhbmc7XHJcbiAgICBcclxuICAgIHZhciBsaW5rID0gKFxyXG4gICAgICAgIGlzSGFzaEJhbmcgP1xyXG4gICAgICAgIGxvY2F0aW9uLmhhc2ggOlxyXG4gICAgICAgIGxvY2F0aW9uLnBhdGhuYW1lXHJcbiAgICApICsgKGxvY2F0aW9uLnNlYXJjaCB8fCAnJyk7XHJcbiAgICBcclxuICAgIC8vIFNldCB0aGUgcm91dGVcclxuICAgIHN0YXRlLnJvdXRlID0gdGhpcy5wYXJzZVVybChsaW5rKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHN0YXRlO1xyXG59O1xyXG5cclxuU2hlbGwucHJvdG90eXBlLnJlcGxhY2UgPSBmdW5jdGlvbiByZXBsYWNlKHN0YXRlKSB7XHJcbiAgICBcclxuICAgIHN0YXRlID0gdGhpcy5nZXRVcGRhdGVkU3RhdGUoc3RhdGUpO1xyXG5cclxuICAgIC8vIFVzZSB0aGUgaW5kZXggb24gcm9vdCBjYWxsc1xyXG4gICAgaWYgKHN0YXRlLnJvdXRlLnJvb3QgPT09IHRydWUpIHtcclxuICAgICAgICBzdGF0ZS5yb3V0ZSA9IHRoaXMucGFyc2VVcmwodGhpcy5pbmRleE5hbWUpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBBY2Nlc3MgY29udHJvbFxyXG4gICAgdmFyIGFjY2Vzc0Vycm9yID0gdGhpcy5hY2Nlc3NDb250cm9sKHN0YXRlLnJvdXRlKTtcclxuICAgIGlmIChhY2Nlc3NFcnJvcikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdvKHRoaXMubm9uQWNjZXNzTmFtZSwgYWNjZXNzRXJyb3IpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIExvY2F0aW5nIHRoZSBjb250YWluZXJcclxuICAgIHZhciAkY29udCA9IHRoaXMuaXRlbXMuZmluZChzdGF0ZS5yb3V0ZS5uYW1lKTtcclxuICAgIHZhciBzaGVsbCA9IHRoaXM7XHJcbiAgICB2YXIgcHJvbWlzZSA9IG51bGw7XHJcblxyXG4gICAgaWYgKCRjb250ICYmICRjb250Lmxlbmd0aCkge1xyXG4gICAgICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgJG9sZENvbnQgPSBzaGVsbC5pdGVtcy5nZXRBY3RpdmUoKTtcclxuICAgICAgICAgICAgICAgICRvbGRDb250ID0gJG9sZENvbnQubm90KCRjb250KTtcclxuICAgICAgICAgICAgICAgIHNoZWxsLml0ZW1zLnN3aXRjaCgkb2xkQ29udCwgJGNvbnQsIHNoZWxsLCBzdGF0ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpOyAvLz8gcmVzb2x2ZShhY3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGV4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgaWYgKHRoaXMubG9hZGVyKSB7XHJcbiAgICAgICAgICAgIC8vIGxvYWQgYW5kIGluamVjdCB0aGUgY29udGVudCBpbiB0aGUgcGFnZVxyXG4gICAgICAgICAgICAvLyB0aGVuIHRyeSB0aGUgcmVwbGFjZSBhZ2FpblxyXG4gICAgICAgICAgICBwcm9taXNlID0gdGhpcy5sb2FkZXIubG9hZChzdGF0ZS5yb3V0ZSkudGhlbihmdW5jdGlvbihodG1sKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgdG8gdGhlIGl0ZW1zICh0aGUgbWFuYWdlciB0YWtlcyBjYXJlIHlvdVxyXG4gICAgICAgICAgICAgICAgLy8gYWRkIG9ubHkgdGhlIGl0ZW0sIGlmIHRoZXJlIGlzIG9uZSlcclxuICAgICAgICAgICAgICAgIHNoZWxsLml0ZW1zLmluamVjdChzdGF0ZS5yb3V0ZS5uYW1lLCBodG1sKTtcclxuICAgICAgICAgICAgICAgIC8vIERvdWJsZSBjaGVjayB0aGF0IHRoZSBpdGVtIHdhcyBhZGRlZCBhbmQgaXMgcmVhZHlcclxuICAgICAgICAgICAgICAgIC8vIHRvIGF2b2lkIGFuIGluZmluaXRlIGxvb3AgYmVjYXVzZSBhIHJlcXVlc3Qgbm90IHJldHVybmluZ1xyXG4gICAgICAgICAgICAgICAgLy8gdGhlIGl0ZW0gYW5kIHRoZSAncmVwbGFjZScgdHJ5aW5nIHRvIGxvYWQgaXQgYWdhaW4sIGFuZCBhZ2FpbiwgYW5kLi5cclxuICAgICAgICAgICAgICAgIGlmIChzaGVsbC5pdGVtcy5maW5kKHN0YXRlLnJvdXRlLm5hbWUpLmxlbmd0aClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2hlbGwucmVwbGFjZShzdGF0ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcignUGFnZSBub3QgZm91bmQgKCcgKyBzdGF0ZS5yb3V0ZS5uYW1lICsgJyknKTtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdTaGVsbCBQYWdlIG5vdCBmb3VuZCwgc3RhdGU6Jywgc3RhdGUpO1xyXG4gICAgICAgICAgICBwcm9taXNlID0gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFRvIGF2b2lkIGJlaW5nIGluIGFuIGluZXhpc3RhbnQgVVJMIChnZW5lcmF0aW5nIGluY29uc2lzdGVuY3kgYmV0d2VlblxyXG4gICAgICAgICAgICAvLyBjdXJyZW50IHZpZXcgYW5kIFVSTCwgY3JlYXRpbmcgYmFkIGhpc3RvcnkgZW50cmllcyksXHJcbiAgICAgICAgICAgIC8vIGEgZ29CYWNrIGlzIGV4ZWN1dGVkLCBqdXN0IGFmdGVyIHRoZSBjdXJyZW50IHBpcGUgZW5kc1xyXG4gICAgICAgICAgICAvLyBUT0RPOiBpbXBsZW1lbnQgcmVkaXJlY3QgdGhhdCBjdXQgY3VycmVudCBwcm9jZXNzaW5nIHJhdGhlciB0aGFuIGV4ZWN1dGUgZGVsYXllZFxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nb0JhY2soKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHZhciB0aGlzU2hlbGwgPSB0aGlzO1xyXG4gICAgcHJvbWlzZS5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiBFcnJvcikpXHJcbiAgICAgICAgICAgIGVyciA9IG5ldyBFcnJvcihlcnIpO1xyXG5cclxuICAgICAgICAvLyBMb2cgZXJyb3IsIFxyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1NoZWxsLCB1bmV4cGVjdGVkIGVycm9yLicsIGVycik7XHJcbiAgICAgICAgLy8gbm90aWZ5IGFzIGFuIGV2ZW50XHJcbiAgICAgICAgdGhpc1NoZWxsLmVtaXQoJ2Vycm9yJywgZXJyKTtcclxuICAgICAgICAvLyBhbmQgY29udGludWUgcHJvcGFnYXRpbmcgdGhlIGVycm9yXHJcbiAgICAgICAgcmV0dXJuIGVycjtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBwcm9taXNlO1xyXG59O1xyXG5cclxuU2hlbGwucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIHJ1bigpIHtcclxuXHJcbiAgICB2YXIgc2hlbGwgPSB0aGlzO1xyXG5cclxuICAgIC8vIENhdGNoIHBvcHN0YXRlIGV2ZW50IHRvIHVwZGF0ZSBzaGVsbCByZXBsYWNpbmcgdGhlIGFjdGl2ZSBjb250YWluZXIuXHJcbiAgICAvLyBBbGxvd3MgcG9seWZpbGxzIHRvIHByb3ZpZGUgYSBkaWZmZXJlbnQgYnV0IGVxdWl2YWxlbnQgZXZlbnQgbmFtZVxyXG4gICAgdGhpcy4kKHdpbmRvdykub24odGhpcy5oaXN0b3J5LnBvcHN0YXRlRXZlbnQgfHwgJ3BvcHN0YXRlJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgc3RhdGUgPSBldmVudC5zdGF0ZSB8fCBcclxuICAgICAgICAgICAgKGV2ZW50Lm9yaWdpbmFsRXZlbnQgJiYgZXZlbnQub3JpZ2luYWxFdmVudC5zdGF0ZSkgfHwgXHJcbiAgICAgICAgICAgIHNoZWxsLmhpc3Rvcnkuc3RhdGU7XHJcblxyXG4gICAgICAgIC8vIGdldCBzdGF0ZSBmb3IgY3VycmVudC4gVG8gc3VwcG9ydCBwb2x5ZmlsbHMsIHdlIHVzZSB0aGUgZ2VuZXJhbCBnZXR0ZXJcclxuICAgICAgICAvLyBoaXN0b3J5LnN0YXRlIGFzIGZhbGxiYWNrICh0aGV5IG11c3QgYmUgdGhlIHNhbWUgb24gYnJvd3NlcnMgc3VwcG9ydGluZyBIaXN0b3J5IEFQSSlcclxuICAgICAgICBzaGVsbC5yZXBsYWNlKHN0YXRlKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENhdGNoIGFsbCBsaW5rcyBpbiB0aGUgcGFnZSAobm90IG9ubHkgJHJvb3Qgb25lcykgYW5kIGxpa2UtbGlua3NcclxuICAgIHRoaXMuJChkb2N1bWVudCkub24odGhpcy5saW5rRXZlbnQsICdbaHJlZl0sIFtkYXRhLWhyZWZdJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciAkdCA9IHNoZWxsLiQodGhpcyksXHJcbiAgICAgICAgICAgIGhyZWYgPSAkdC5hdHRyKCdocmVmJykgfHwgJHQuZGF0YSgnaHJlZicpO1xyXG5cclxuICAgICAgICAvLyBEbyBub3RoaW5nIGlmIHRoZSBVUkwgY29udGFpbnMgdGhlIHByb3RvY29sXHJcbiAgICAgICAgaWYgKC9eW2Etel0rOi9pLnRlc3QoaHJlZikpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChzaGVsbC5mb3JjZUhhc2hiYW5nICYmIC9eIyhbXiFdfCQpLy50ZXN0KGhyZWYpKSB7XHJcbiAgICAgICAgICAgIC8vIFN0YW5kYXJkIGhhc2gsIGJ1dCBub3QgaGFzaGJhbmc6IGF2b2lkIHJvdXRpbmcgYW5kIGRlZmF1bHQgYmVoYXZpb3JcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgLy8/IGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgIC8vIEV4ZWN1dGVkIGRlbGF5ZWQgdG8gYXZvaWQgaGFuZGxlciBjb2xsaXNpb25zLCBiZWNhdXNlXHJcbiAgICAgICAgLy8gb2YgdGhlIG5ldyBwYWdlIG1vZGlmeWluZyB0aGUgZWxlbWVudCBhbmQgb3RoZXIgaGFuZGxlcnNcclxuICAgICAgICAvLyByZWFkaW5nIGl0IGF0dHJpYnV0ZXMgYW5kIGFwcGx5aW5nIGxvZ2ljIG9uIHRoZSB1cGRhdGVkIGxpbmtcclxuICAgICAgICAvLyBhcyBpZiB3YXMgdGhlIG9sZCBvbmUgKGV4YW1wbGU6IHNoYXJlZCBsaW5rcywgbGlrZSBpbiBhXHJcbiAgICAgICAgLy8gZ2xvYmFsIG5hdmJhciwgdGhhdCBtb2RpZmllcyB3aXRoIHRoZSBuZXcgcGFnZSkuXHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgc2hlbGwuZ28oaHJlZik7XHJcbiAgICAgICAgfSwgMSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBJbml0aWFsbGl6ZSBzdGF0ZVxyXG4gICAgdGhpcy5pdGVtcy5pbml0KCk7XHJcbiAgICAvLyBSb3V0ZSB0byB0aGUgY3VycmVudCB1cmwvc3RhdGVcclxuICAgIHRoaXMucmVwbGFjZSgpO1xyXG59O1xyXG4iLCIvKipcclxuICAgIGFic29sdXRpemVVcmwgdXRpbGl0eSBcclxuICAgIHRoYXQgZW5zdXJlcyB0aGUgdXJsIHByb3ZpZGVkXHJcbiAgICBiZWluZyBpbiB0aGUgcGF0aCBvZiB0aGUgZ2l2ZW4gYmFzZVVybFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIHNhbml0aXplVXJsID0gcmVxdWlyZSgnLi9zYW5pdGl6ZVVybCcpLFxyXG4gICAgZXNjYXBlUmVnRXhwID0gcmVxdWlyZSgnLi4vZXNjYXBlUmVnRXhwJyk7XHJcblxyXG5mdW5jdGlvbiBhYnNvbHV0aXplVXJsKGJhc2VVcmwsIHVybCkge1xyXG5cclxuICAgIC8vIHNhbml0aXplIGJlZm9yZSBjaGVja1xyXG4gICAgdXJsID0gc2FuaXRpemVVcmwodXJsKTtcclxuXHJcbiAgICAvLyBDaGVjayBpZiB1c2UgdGhlIGJhc2UgYWxyZWFkeVxyXG4gICAgdmFyIG1hdGNoQmFzZSA9IG5ldyBSZWdFeHAoJ14nICsgZXNjYXBlUmVnRXhwKGJhc2VVcmwpLCAnaScpO1xyXG4gICAgaWYgKG1hdGNoQmFzZS50ZXN0KHVybCkpIHtcclxuICAgICAgICByZXR1cm4gdXJsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGJ1aWxkIGFuZCBzYW5pdGl6ZVxyXG4gICAgcmV0dXJuIHNhbml0aXplVXJsKGJhc2VVcmwgKyB1cmwpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFic29sdXRpemVVcmw7XHJcbiIsIi8qKlxyXG4gICAgRXh0ZXJuYWwgZGVwZW5kZW5jaWVzIGZvciBTaGVsbCBpbiBhIHNlcGFyYXRlIG1vZHVsZVxyXG4gICAgdG8gdXNlIGFzIERJLCBuZWVkcyBzZXR1cCBiZWZvcmUgY2FsbCB0aGUgU2hlbGwuanNcclxuICAgIG1vZHVsZSBjbGFzc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBwYXJzZVVybDogbnVsbCxcclxuICAgIGFic29sdXRpemVVcmw6IG51bGwsXHJcbiAgICBqcXVlcnk6IG51bGwsXHJcbiAgICBsb2FkZXI6IG51bGwsXHJcbiAgICBhY2Nlc3NDb250cm9sOiBmdW5jdGlvbiBhbGxvd0FsbChuYW1lKSB7XHJcbiAgICAgICAgLy8gYWxsb3cgYWNjZXNzIGJ5IGRlZmF1bHRcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH0sXHJcbiAgICBFdmVudEVtaXR0ZXI6IG51bGxcclxufTtcclxuIiwiLyoqXHJcbiAgICBTaW1wbGUgaW1wbGVtZW50YXRpb24gb2YgdGhlIEhpc3RvcnkgQVBJIHVzaW5nIG9ubHkgaGFzaGJhbmdzIFVSTHMsXHJcbiAgICBkb2Vzbid0IG1hdHRlcnMgdGhlIGJyb3dzZXIgc3VwcG9ydC5cclxuICAgIFVzZWQgdG8gYXZvaWQgZnJvbSBzZXR0aW5nIFVSTHMgdGhhdCBoYXMgbm90IGFuIGVuZC1wb2ludCxcclxuICAgIGxpa2UgaW4gbG9jYWwgZW52aXJvbm1lbnRzIHdpdGhvdXQgYSBzZXJ2ZXIgZG9pbmcgdXJsLXJld3JpdGluZyxcclxuICAgIGluIHBob25lZ2FwIGFwcHMsIG9yIHRvIGNvbXBsZXRlbHkgYnktcGFzcyBicm93c2VyIHN1cHBvcnQgYmVjYXVzZVxyXG4gICAgaXMgYnVnZ3kgKGxpa2UgQW5kcm9pZCA8PSA0LjEpLlxyXG4gICAgXHJcbiAgICBOT1RFUzpcclxuICAgIC0gQnJvd3NlciBtdXN0IHN1cHBvcnQgJ2hhc2hjaGFuZ2UnIGV2ZW50LlxyXG4gICAgLSBCcm93c2VyIG11c3QgaGFzIHN1cHBvcnQgZm9yIHN0YW5kYXJkIEpTT04gY2xhc3MuXHJcbiAgICAtIFJlbGllcyBvbiBzZXNzaW9uc3RvcmFnZSBmb3IgcGVyc2lzdGFuY2UsIHN1cHBvcnRlZCBieSBhbGwgYnJvd3NlcnMgYW5kIHdlYnZpZXdzIFxyXG4gICAgICBmb3IgYSBlbm91Z2ggbG9uZyB0aW1lIG5vdy5cclxuICAgIC0gU2ltaWxhciBhcHByb2FjaCBhcyBIaXN0b3J5LmpzIHBvbHlmaWxsLCBidXQgc2ltcGxpZmllZCwgYXBwZW5kaW5nIGEgZmFrZSBxdWVyeVxyXG4gICAgICBwYXJhbWV0ZXIgJ19zdWlkPTAnIHRvIHRoZSBoYXNoIHZhbHVlIChhY3R1YWwgcXVlcnkgZ29lcyBiZWZvcmUgdGhlIGhhc2gsIGJ1dFxyXG4gICAgICB3ZSBuZWVkIGl0IGluc2lkZSkuXHJcbiAgICAtIEZvciBzaW1wbGlmaWNhdGlvbiwgb25seSB0aGUgc3RhdGUgaXMgcGVyc2lzdGVkLCB0aGUgJ3RpdGxlJyBwYXJhbWV0ZXIgaXMgbm90XHJcbiAgICAgIHVzZWQgYXQgYWxsICh0aGUgc2FtZSBhcyBtYWpvciBicm93c2VycyBkbywgc28gaXMgbm90IGEgcHJvYmxlbSk7IGluIHRoaXMgbGluZSxcclxuICAgICAgb25seSBoaXN0b3J5IGVudHJpZXMgd2l0aCBzdGF0ZSBhcmUgcGVyc2lzdGVkLlxyXG4qKi9cclxuLy9nbG9iYWwgbG9jYXRpb25cclxuJ3VzZSBzdHJpY3QnO1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgc2FuaXRpemVVcmwgPSByZXF1aXJlKCcuL3Nhbml0aXplVXJsJyksXHJcbiAgICBnZXRVcmxRdWVyeSA9IHJlcXVpcmUoJy4uL2dldFVybFF1ZXJ5Jyk7XHJcblxyXG4vLyBJbml0OiBMb2FkIHNhdmVkIGNvcHkgZnJvbSBzZXNzaW9uU3RvcmFnZVxyXG52YXIgc2Vzc2lvbiA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oJ2hhc2hiYW5nSGlzdG9yeS5zdG9yZScpO1xyXG4vLyBPciBjcmVhdGUgYSBuZXcgb25lXHJcbmlmICghc2Vzc2lvbikge1xyXG4gICAgc2Vzc2lvbiA9IHtcclxuICAgICAgICAvLyBTdGF0ZXMgYXJyYXkgd2hlcmUgZWFjaCBpbmRleCBpcyB0aGUgU1VJRCBjb2RlIGFuZCB0aGVcclxuICAgICAgICAvLyB2YWx1ZSBpcyBqdXN0IHRoZSB2YWx1ZSBwYXNzZWQgYXMgc3RhdGUgb24gcHVzaFN0YXRlL3JlcGxhY2VTdGF0ZVxyXG4gICAgICAgIHN0YXRlczogW11cclxuICAgIH07XHJcbn1cclxuZWxzZSB7XHJcbiAgICBzZXNzaW9uID0gSlNPTi5wYXJzZShzZXNzaW9uKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gICAgR2V0IHRoZSBTVUlEIG51bWJlclxyXG4gICAgZnJvbSBhIGhhc2ggc3RyaW5nXHJcbioqL1xyXG5mdW5jdGlvbiBnZXRTdWlkKGhhc2gpIHtcclxuICAgIFxyXG4gICAgdmFyIHN1aWQgPSArZ2V0VXJsUXVlcnkoaGFzaCkuX3N1aWQ7XHJcbiAgICBpZiAoaXNOYU4oc3VpZCkpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuIHN1aWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldFN1aWQoaGFzaCwgc3VpZCkge1xyXG4gICAgXHJcbiAgICAvLyBXZSBuZWVkIHRoZSBxdWVyeSwgc2luY2Ugd2UgbmVlZCBcclxuICAgIC8vIHRvIHJlcGxhY2UgdGhlIF9zdWlkIChtYXkgZXhpc3QpXHJcbiAgICAvLyBhbmQgcmVjcmVhdGUgdGhlIHF1ZXJ5IGluIHRoZVxyXG4gICAgLy8gcmV0dXJuZWQgaGFzaC11cmxcclxuICAgIHZhciBxcyA9IGdldFVybFF1ZXJ5KGhhc2gpO1xyXG4gICAgcXMucHVzaCgnX3N1aWQnKTtcclxuICAgIHFzLl9zdWlkID0gc3VpZDtcclxuXHJcbiAgICB2YXIgcXVlcnkgPSBbXTtcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBxcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHF1ZXJ5LnB1c2gocXNbaV0gKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQocXNbcXNbaV1dKSk7XHJcbiAgICB9XHJcbiAgICBxdWVyeSA9IHF1ZXJ5LmpvaW4oJyYnKTtcclxuICAgIFxyXG4gICAgaWYgKHF1ZXJ5KSB7XHJcbiAgICAgICAgdmFyIGluZGV4ID0gaGFzaC5pbmRleE9mKCc/Jyk7XHJcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpXHJcbiAgICAgICAgICAgIGhhc2ggPSBoYXNoLnN1YnN0cigwLCBpbmRleCk7XHJcbiAgICAgICAgaGFzaCArPSAnPycgKyBxdWVyeTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaGFzaDtcclxufVxyXG5cclxuLyoqXHJcbiAgICBBc2sgdG8gcGVyc2lzdCB0aGUgc2Vzc2lvbiBkYXRhLlxyXG4gICAgSXQgaXMgZG9uZSB3aXRoIGEgdGltZW91dCBpbiBvcmRlciB0byBhdm9pZFxyXG4gICAgZGVsYXkgaW4gdGhlIGN1cnJlbnQgdGFzayBtYWlubHkgYW55IGhhbmRsZXJcclxuICAgIHRoYXQgYWN0cyBhZnRlciBhIEhpc3RvcnkgY2hhbmdlLlxyXG4qKi9cclxuZnVuY3Rpb24gcGVyc2lzdCgpIHtcclxuICAgIC8vIEVub3VnaCB0aW1lIHRvIGFsbG93IHJvdXRpbmcgdGFza3MsXHJcbiAgICAvLyBtb3N0IGFuaW1hdGlvbnMgZnJvbSBmaW5pc2ggYW5kIHRoZSBVSVxyXG4gICAgLy8gYmVpbmcgcmVzcG9uc2l2ZS5cclxuICAgIC8vIEJlY2F1c2Ugc2Vzc2lvblN0b3JhZ2UgaXMgc3luY2hyb25vdXMuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oJ2hhc2hiYW5nSGlzdG9yeS5zdG9yZScsIEpTT04uc3RyaW5naWZ5KHNlc3Npb24pKTtcclxuICAgIH0sIDE1MDApO1xyXG59XHJcblxyXG4vKipcclxuICAgIFJldHVybnMgdGhlIGdpdmVuIHN0YXRlIG9yIG51bGxcclxuICAgIGlmIGlzIGFuIGVtcHR5IG9iamVjdC5cclxuKiovXHJcbmZ1bmN0aW9uIGNoZWNrU3RhdGUoc3RhdGUpIHtcclxuICAgIFxyXG4gICAgaWYgKHN0YXRlKSB7XHJcbiAgICAgICAgLy8gaXMgZW1wdHk/XHJcbiAgICAgICAgZm9yKHZhciBpIGluIHN0YXRlKSB7XHJcbiAgICAgICAgICAgIC8vIE5vXHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gaXRzIGVtcHR5XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICAvLyBBbnl0aGluZyBlbHNlXHJcbiAgICByZXR1cm4gc3RhdGU7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgR2V0IGEgY2Fub25pY2FsIHJlcHJlc2VudGF0aW9uXHJcbiAgICBvZiB0aGUgVVJMIHNvIGNhbiBiZSBjb21wYXJlZFxyXG4gICAgd2l0aCBzdWNjZXNzLlxyXG4qKi9cclxuZnVuY3Rpb24gY2Fubm9uaWNhbFVybCh1cmwpIHtcclxuICAgIFxyXG4gICAgLy8gQXZvaWQgc29tZSBiYWQgb3IgcHJvYmxlbWF0aWMgc3ludGF4XHJcbiAgICB1cmwgPSBzYW5pdGl6ZVVybCh1cmwgfHwgJycpO1xyXG4gICAgXHJcbiAgICAvLyBHZXQgdGhlIGhhc2ggcGFydFxyXG4gICAgdmFyIGloYXNoID0gdXJsLmluZGV4T2YoJyMnKTtcclxuICAgIGlmIChpaGFzaCA+IC0xKSB7XHJcbiAgICAgICAgdXJsID0gdXJsLnN1YnN0cihpaGFzaCArIDEpO1xyXG4gICAgfVxyXG4gICAgLy8gTWF5YmUgYSBoYXNoYmFuZyBVUkwsIHJlbW92ZSB0aGVcclxuICAgIC8vICdiYW5nJyAodGhlIGhhc2ggd2FzIHJlbW92ZWQgYWxyZWFkeSlcclxuICAgIHVybCA9IHVybC5yZXBsYWNlKC9eIS8sICcnKTtcclxuXHJcbiAgICByZXR1cm4gdXJsO1xyXG59XHJcblxyXG4vKipcclxuICAgIFRyYWNrcyB0aGUgbGF0ZXN0IFVSTFxyXG4gICAgYmVpbmcgcHVzaGVkIG9yIHJlcGxhY2VkIGJ5XHJcbiAgICB0aGUgQVBJLlxyXG4gICAgVGhpcyBhbGxvd3MgbGF0ZXIgdG8gYXZvaWRcclxuICAgIHRyaWdnZXIgdGhlIHBvcHN0YXRlIGV2ZW50LFxyXG4gICAgc2luY2UgbXVzdCBOT1QgYmUgdHJpZ2dlcmVkXHJcbiAgICBhcyBhIHJlc3VsdCBvZiB0aGF0IEFQSSBtZXRob2RzXHJcbioqL1xyXG52YXIgbGF0ZXN0UHVzaGVkUmVwbGFjZWRVcmwgPSBudWxsO1xyXG5cclxuLyoqXHJcbiAgICBIaXN0b3J5IFBvbHlmaWxsXHJcbioqL1xyXG52YXIgaGFzaGJhbmdIaXN0b3J5ID0ge1xyXG4gICAgcHVzaFN0YXRlOiBmdW5jdGlvbiBwdXNoU3RhdGUoc3RhdGUsIHRpdGxlLCB1cmwpIHtcclxuXHJcbiAgICAgICAgLy8gY2xlYW51cCB1cmxcclxuICAgICAgICB1cmwgPSBjYW5ub25pY2FsVXJsKHVybCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gc2F2ZSBuZXcgc3RhdGUgZm9yIHVybFxyXG4gICAgICAgIHN0YXRlID0gY2hlY2tTdGF0ZShzdGF0ZSkgfHwgbnVsbDtcclxuICAgICAgICBpZiAoc3RhdGUgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgLy8gc2F2ZSBzdGF0ZVxyXG4gICAgICAgICAgICBzZXNzaW9uLnN0YXRlcy5wdXNoKHN0YXRlKTtcclxuICAgICAgICAgICAgdmFyIHN1aWQgPSBzZXNzaW9uLnN0YXRlcy5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICAvLyB1cGRhdGUgVVJMIHdpdGggdGhlIHN1aWRcclxuICAgICAgICAgICAgdXJsID0gc2V0U3VpZCh1cmwsIHN1aWQpO1xyXG4gICAgICAgICAgICAvLyBjYWxsIHRvIHBlcnNpc3QgdGhlIHVwZGF0ZWQgc2Vzc2lvblxyXG4gICAgICAgICAgICBwZXJzaXN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxhdGVzdFB1c2hlZFJlcGxhY2VkVXJsID0gdXJsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIHVwZGF0ZSBsb2NhdGlvbiB0byB0cmFjayBoaXN0b3J5OlxyXG4gICAgICAgIGxvY2F0aW9uLmhhc2ggPSAnIyEnICsgdXJsO1xyXG4gICAgfSxcclxuICAgIHJlcGxhY2VTdGF0ZTogZnVuY3Rpb24gcmVwbGFjZVN0YXRlKHN0YXRlLCB0aXRsZSwgdXJsKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gY2xlYW51cCB1cmxcclxuICAgICAgICB1cmwgPSBjYW5ub25pY2FsVXJsKHVybCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gaXQgaGFzIHNhdmVkIHN0YXRlP1xyXG4gICAgICAgIHZhciBzdWlkID0gZ2V0U3VpZCh1cmwpLFxyXG4gICAgICAgICAgICBoYXNPbGRTdGF0ZSA9IHN1aWQgIT09IG51bGw7XHJcblxyXG4gICAgICAgIC8vIHNhdmUgbmV3IHN0YXRlIGZvciB1cmxcclxuICAgICAgICBzdGF0ZSA9IGNoZWNrU3RhdGUoc3RhdGUpIHx8IG51bGw7XHJcbiAgICAgICAgLy8gaXRzIHNhdmVkIGlmIHRoZXJlIGlzIHNvbWV0aGluZyB0byBzYXZlXHJcbiAgICAgICAgLy8gb3Igc29tZXRoaW5nIHRvIGRlc3Ryb3lcclxuICAgICAgICBpZiAoc3RhdGUgIT09IG51bGwgfHwgaGFzT2xkU3RhdGUpIHtcclxuICAgICAgICAgICAgLy8gc2F2ZSBzdGF0ZVxyXG4gICAgICAgICAgICBpZiAoaGFzT2xkU3RhdGUpIHtcclxuICAgICAgICAgICAgICAgIC8vIHJlcGxhY2UgZXhpc3Rpbmcgc3RhdGVcclxuICAgICAgICAgICAgICAgIHNlc3Npb24uc3RhdGVzW3N1aWRdID0gc3RhdGU7XHJcbiAgICAgICAgICAgICAgICAvLyB0aGUgdXJsIHJlbWFpbnMgdGhlIHNhbWVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBzdGF0ZVxyXG4gICAgICAgICAgICAgICAgc2Vzc2lvbi5zdGF0ZXMucHVzaChzdGF0ZSk7XHJcbiAgICAgICAgICAgICAgICBzdWlkID0gc2Vzc2lvbi5zdGF0ZXMubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSBVUkwgd2l0aCB0aGUgc3VpZFxyXG4gICAgICAgICAgICAgICAgdXJsID0gc2V0U3VpZCh1cmwsIHN1aWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGNhbGwgdG8gcGVyc2lzdCB0aGUgdXBkYXRlZCBzZXNzaW9uXHJcbiAgICAgICAgICAgIHBlcnNpc3QoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGF0ZXN0UHVzaGVkUmVwbGFjZWRVcmwgPSB1cmw7XHJcblxyXG4gICAgICAgIC8vIHVwZGF0ZSBsb2NhdGlvbiB0byB0cmFjayBoaXN0b3J5OlxyXG4gICAgICAgIGxvY2F0aW9uLmhhc2ggPSAnIyEnICsgdXJsO1xyXG4gICAgfSxcclxuICAgIGdldCBzdGF0ZSgpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgc3VpZCA9IGdldFN1aWQobG9jYXRpb24uaGFzaCk7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgc3VpZCAhPT0gbnVsbCA/XHJcbiAgICAgICAgICAgIHNlc3Npb24uc3RhdGVzW3N1aWRdIDpcclxuICAgICAgICAgICAgbnVsbFxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG4gICAgZ2V0IGxlbmd0aCgpIHtcclxuICAgICAgICByZXR1cm4gd2luZG93Lmhpc3RvcnkubGVuZ3RoO1xyXG4gICAgfSxcclxuICAgIGdvOiBmdW5jdGlvbiBnbyhvZmZzZXQpIHtcclxuICAgICAgICB3aW5kb3cuaGlzdG9yeS5nbyhvZmZzZXQpO1xyXG4gICAgfSxcclxuICAgIGJhY2s6IGZ1bmN0aW9uIGJhY2soKSB7XHJcbiAgICAgICAgd2luZG93Lmhpc3RvcnkuYmFjaygpO1xyXG4gICAgfSxcclxuICAgIGZvcndhcmQ6IGZ1bmN0aW9uIGZvcndhcmQoKSB7XHJcbiAgICAgICAgd2luZG93Lmhpc3RvcnkuZm9yd2FyZCgpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLy8gQXR0YWNoIGhhc2hjYW5nZSBldmVudCB0byB0cmlnZ2VyIEhpc3RvcnkgQVBJIGV2ZW50ICdwb3BzdGF0ZSdcclxudmFyICR3ID0gJCh3aW5kb3cpO1xyXG4kdy5vbignaGFzaGNoYW5nZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgIFxyXG4gICAgdmFyIHVybCA9IGUub3JpZ2luYWxFdmVudC5uZXdVUkw7XHJcbiAgICB1cmwgPSBjYW5ub25pY2FsVXJsKHVybCk7XHJcbiAgICBcclxuICAgIC8vIEFuIFVSTCBiZWluZyBwdXNoZWQgb3IgcmVwbGFjZWRcclxuICAgIC8vIG11c3QgTk9UIHRyaWdnZXIgcG9wc3RhdGVcclxuICAgIGlmICh1cmwgPT09IGxhdGVzdFB1c2hlZFJlcGxhY2VkVXJsKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIFxyXG4gICAgLy8gZ2V0IHN0YXRlIGZyb20gaGlzdG9yeSBlbnRyeVxyXG4gICAgLy8gZm9yIHRoZSB1cGRhdGVkIFVSTCwgaWYgYW55XHJcbiAgICAvLyAoY2FuIGhhdmUgdmFsdWUgd2hlbiB0cmF2ZXJzaW5nXHJcbiAgICAvLyBoaXN0b3J5KS5cclxuICAgIHZhciBzdWlkID0gZ2V0U3VpZCh1cmwpLFxyXG4gICAgICAgIHN0YXRlID0gbnVsbDtcclxuICAgIFxyXG4gICAgaWYgKHN1aWQgIT09IG51bGwpXHJcbiAgICAgICAgc3RhdGUgPSBzZXNzaW9uLnN0YXRlc1tzdWlkXTtcclxuXHJcbiAgICAkdy50cmlnZ2VyKG5ldyAkLkV2ZW50KCdwb3BzdGF0ZScsIHtcclxuICAgICAgICBzdGF0ZTogc3RhdGVcclxuICAgIH0pLCAnaGFzaGJhbmdIaXN0b3J5Jyk7XHJcbn0pO1xyXG5cclxuLy8gRm9yIEhpc3RvcnlBUEkgY2FwYWJsZSBicm93c2Vycywgd2UgbmVlZFxyXG4vLyB0byBjYXB0dXJlIHRoZSBuYXRpdmUgJ3BvcHN0YXRlJyBldmVudCB0aGF0XHJcbi8vIGdldHMgdHJpZ2dlcmVkIG9uIG91ciBwdXNoL3JlcGxhY2VTdGF0ZSBiZWNhdXNlXHJcbi8vIG9mIHRoZSBsb2NhdGlvbiBjaGFuZ2UsIGJ1dCB0b28gb24gdHJhdmVyc2luZ1xyXG4vLyB0aGUgaGlzdG9yeSAoYmFjay9mb3J3YXJkKS5cclxuLy8gV2Ugd2lsbCBsb2NrIHRoZSBldmVudCBleGNlcHQgd2hlbiBpc1xyXG4vLyB0aGUgb25lIHdlIHRyaWdnZXIuXHJcbi8vXHJcbi8vIE5PVEU6IHRvIHRoaXMgdHJpY2sgdG8gd29yaywgdGhpcyBtdXN0XHJcbi8vIGJlIHRoZSBmaXJzdCBoYW5kbGVyIGF0dGFjaGVkIGZvciB0aGlzXHJcbi8vIGV2ZW50LCBzbyBjYW4gYmxvY2sgYWxsIG90aGVycy5cclxuLy8gQUxURVJOQVRJVkU6IGluc3RlYWQgb2YgdGhpcywgb24gdGhlXHJcbi8vIHB1c2gvcmVwbGFjZVN0YXRlIG1ldGhvZHMgZGV0ZWN0IGlmXHJcbi8vIEhpc3RvcnlBUEkgaXMgbmF0aXZlIHN1cHBvcnRlZCBhbmRcclxuLy8gdXNlIHJlcGxhY2VTdGF0ZSB0aGVyZSByYXRoZXIgdGhhblxyXG4vLyBhIGhhc2ggY2hhbmdlLlxyXG4kdy5vbigncG9wc3RhdGUnLCBmdW5jdGlvbihlLCBzb3VyY2UpIHtcclxuICAgIFxyXG4gICAgLy8gRW5zdXJpbmcgaXMgdGhlIG9uZSB3ZSB0cmlnZ2VyXHJcbiAgICBpZiAoc291cmNlID09PSAnaGFzaGJhbmdIaXN0b3J5JylcclxuICAgICAgICByZXR1cm47XHJcbiAgICBcclxuICAgIC8vIEluIG90aGVyIGNhc2UsIGJsb2NrOlxyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxufSk7XHJcblxyXG4vLyBFeHBvc2UgQVBJXHJcbm1vZHVsZS5leHBvcnRzID0gaGFzaGJhbmdIaXN0b3J5O1xyXG4iLCIvKipcclxuICAgIERlZmF1bHQgYnVpbGQgb2YgdGhlIFNoZWxsIGNvbXBvbmVudC5cclxuICAgIEl0IHJldHVybnMgdGhlIFNoZWxsIGNsYXNzIGFzIGEgbW9kdWxlIHByb3BlcnR5LFxyXG4gICAgc2V0dGluZyB1cCB0aGUgYnVpbHQtaW4gbW9kdWxlcyBhcyBpdHMgZGVwZW5kZW5jaWVzLFxyXG4gICAgYW5kIHRoZSBleHRlcm5hbCAnanF1ZXJ5JyBhbmQgJ2V2ZW50cycgKGZvciB0aGUgRXZlbnRFbWl0dGVyKS5cclxuICAgIEl0IHJldHVybnMgdG9vIHRoZSBidWlsdC1pdCBEb21JdGVtc01hbmFnZXIgY2xhc3MgYXMgYSBwcm9wZXJ0eSBmb3IgY29udmVuaWVuY2UuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgZGVwcyA9IHJlcXVpcmUoJy4vZGVwZW5kZW5jaWVzJyksXHJcbiAgICBEb21JdGVtc01hbmFnZXIgPSByZXF1aXJlKCcuL0RvbUl0ZW1zTWFuYWdlcicpLFxyXG4gICAgcGFyc2VVcmwgPSByZXF1aXJlKCcuL3BhcnNlVXJsJyksXHJcbiAgICBhYnNvbHV0aXplVXJsID0gcmVxdWlyZSgnLi9hYnNvbHV0aXplVXJsJyksXHJcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBsb2FkZXIgPSByZXF1aXJlKCcuL2xvYWRlcicpLFxyXG4gICAgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xyXG5cclxuJC5leHRlbmQoZGVwcywge1xyXG4gICAgcGFyc2VVcmw6IHBhcnNlVXJsLFxyXG4gICAgYWJzb2x1dGl6ZVVybDogYWJzb2x1dGl6ZVVybCxcclxuICAgIGpxdWVyeTogJCxcclxuICAgIGxvYWRlcjogbG9hZGVyLFxyXG4gICAgRXZlbnRFbWl0dGVyOiBFdmVudEVtaXR0ZXJcclxufSk7XHJcblxyXG4vLyBEZXBlbmRlbmNpZXMgYXJlIHJlYWR5LCB3ZSBjYW4gbG9hZCB0aGUgY2xhc3M6XHJcbnZhciBTaGVsbCA9IHJlcXVpcmUoJy4vU2hlbGwnKTtcclxuXHJcbmV4cG9ydHMuU2hlbGwgPSBTaGVsbDtcclxuZXhwb3J0cy5Eb21JdGVtc01hbmFnZXIgPSBEb21JdGVtc01hbmFnZXI7XHJcbiIsIi8qKlxyXG4gICAgTG9hZGVyIHV0aWxpdHkgdG8gbG9hZCBTaGVsbCBpdGVtcyBvbiBkZW1hbmQgd2l0aCBBSkFYXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBcclxuICAgIGJhc2VVcmw6ICcvJyxcclxuICAgIFxyXG4gICAgbG9hZDogZnVuY3Rpb24gbG9hZChyb3V0ZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0xPQURFUiBQUk9NSVNFJywgcm91dGUsIHJvdXRlLm5hbWUpO1xyXG4gICAgICAgICAgICByZXNvbHZlKCcnKTtcclxuICAgICAgICAgICAgLyokLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiBtb2R1bGUuZXhwb3J0cy5iYXNlVXJsICsgcm91dGUubmFtZSArICcuaHRtbCcsXHJcbiAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2VcclxuICAgICAgICAgICAgICAgIC8vIFdlIGFyZSBsb2FkaW5nIHRoZSBwcm9ncmFtIGFuZCBubyBsb2FkZXIgc2NyZWVuIGluIHBsYWNlLFxyXG4gICAgICAgICAgICAgICAgLy8gc28gYW55IGluIGJldHdlZW4gaW50ZXJhY3Rpb24gd2lsbCBiZSBwcm9ibGVtYXRpYy5cclxuICAgICAgICAgICAgICAgIC8vYXN5bmM6IGZhbHNlXHJcbiAgICAgICAgICAgIH0pLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTsqL1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59O1xyXG4iLCIvKipcclxuICAgIHBhcnNlVXJsIGZ1bmN0aW9uIGRldGVjdGluZ1xyXG4gICAgdGhlIG1haW4gcGFydHMgb2YgdGhlIFVSTCBpbiBhXHJcbiAgICBjb252ZW5pZW5jZSB3YXkgZm9yIHJvdXRpbmcuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgZ2V0VXJsUXVlcnkgPSByZXF1aXJlKCcuLi9nZXRVcmxRdWVyeScpLFxyXG4gICAgZXNjYXBlUmVnRXhwID0gcmVxdWlyZSgnLi4vZXNjYXBlUmVnRXhwJyk7XHJcblxyXG5mdW5jdGlvbiBwYXJzZVVybChiYXNlVXJsLCBsaW5rKSB7XHJcblxyXG4gICAgbGluayA9IGxpbmsgfHwgJyc7XHJcblxyXG4gICAgdmFyIHJhd1VybCA9IGxpbms7XHJcblxyXG4gICAgLy8gaGFzaGJhbmcgc3VwcG9ydDogcmVtb3ZlIHRoZSAjISBvciBzaW5nbGUgIyBhbmQgdXNlIHRoZSByZXN0IGFzIHRoZSBsaW5rXHJcbiAgICBsaW5rID0gbGluay5yZXBsYWNlKC9eIyEvLCAnJykucmVwbGFjZSgvXiMvLCAnJyk7XHJcbiAgICBcclxuICAgIC8vIHJlbW92ZSBvcHRpb25hbCBpbml0aWFsIHNsYXNoIG9yIGRvdC1zbGFzaFxyXG4gICAgbGluayA9IGxpbmsucmVwbGFjZSgvXlxcL3xeXFwuXFwvLywgJycpO1xyXG5cclxuICAgIC8vIFVSTCBRdWVyeSBhcyBhbiBvYmplY3QsIGVtcHR5IG9iamVjdCBpZiBubyBxdWVyeVxyXG4gICAgdmFyIHF1ZXJ5ID0gZ2V0VXJsUXVlcnkobGluayB8fCAnPycpO1xyXG5cclxuICAgIC8vIHJlbW92ZSBxdWVyeSBmcm9tIHRoZSByZXN0IG9mIFVSTCB0byBwYXJzZVxyXG4gICAgbGluayA9IGxpbmsucmVwbGFjZSgvXFw/LiokLywgJycpO1xyXG5cclxuICAgIC8vIFJlbW92ZSB0aGUgYmFzZVVybCB0byBnZXQgdGhlIGFwcCBiYXNlLlxyXG4gICAgdmFyIHBhdGggPSBsaW5rLnJlcGxhY2UobmV3IFJlZ0V4cCgnXicgKyBlc2NhcGVSZWdFeHAoYmFzZVVybCksICdpJyksICcnKTtcclxuXHJcbiAgICAvLyBHZXQgZmlyc3Qgc2VnbWVudCBvciBwYWdlIG5hbWUgKGFueXRoaW5nIHVudGlsIGEgc2xhc2ggb3IgZXh0ZW5zaW9uIGJlZ2dpbmluZylcclxuICAgIHZhciBtYXRjaCA9IC9eXFwvPyhbXlxcL1xcLl0rKVteXFwvXSooXFwvLiopKiQvLmV4ZWMocGF0aCk7XHJcblxyXG4gICAgdmFyIHBhcnNlZCA9IHtcclxuICAgICAgICByb290OiB0cnVlLFxyXG4gICAgICAgIG5hbWU6IG51bGwsXHJcbiAgICAgICAgc2VnbWVudHM6IG51bGwsXHJcbiAgICAgICAgcGF0aDogbnVsbCxcclxuICAgICAgICB1cmw6IHJhd1VybCxcclxuICAgICAgICBxdWVyeTogcXVlcnlcclxuICAgIH07XHJcblxyXG4gICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgcGFyc2VkLnJvb3QgPSBmYWxzZTtcclxuICAgICAgICBpZiAobWF0Y2hbMV0pIHtcclxuICAgICAgICAgICAgcGFyc2VkLm5hbWUgPSBtYXRjaFsxXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYXRjaFsyXSkge1xyXG4gICAgICAgICAgICAgICAgcGFyc2VkLnBhdGggPSBtYXRjaFsyXTtcclxuICAgICAgICAgICAgICAgIHBhcnNlZC5zZWdtZW50cyA9IG1hdGNoWzJdLnJlcGxhY2UoL15cXC8vLCAnJykuc3BsaXQoJy8nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHBhcnNlZC5wYXRoID0gJy8nO1xyXG4gICAgICAgICAgICAgICAgcGFyc2VkLnNlZ21lbnRzID0gW107XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHBhcnNlZDtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBwYXJzZVVybDsiLCIvKipcclxuICAgIHNhbml0aXplVXJsIHV0aWxpdHkgdGhhdCBlbnN1cmVzXHJcbiAgICB0aGF0IHByb2JsZW1hdGljIHBhcnRzIGdldCByZW1vdmVkLlxyXG4gICAgXHJcbiAgICBBcyBmb3Igbm93IGl0IGRvZXM6XHJcbiAgICAtIHJlbW92ZXMgcGFyZW50IGRpcmVjdG9yeSBzeW50YXhcclxuICAgIC0gcmVtb3ZlcyBkdXBsaWNhdGVkIHNsYXNoZXNcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIHNhbml0aXplVXJsKHVybCkge1xyXG4gICAgcmV0dXJuIHVybC5yZXBsYWNlKC9cXC57Mix9L2csICcnKS5yZXBsYWNlKC9cXC97Mix9L2csICcvJyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2FuaXRpemVVcmw7IiwiLyoqIEFwcE1vZGVsIGV4dGVuc2lvbixcclxuICAgIGZvY3VzZWQgb24gdGhlIEV2ZW50cyBBUElcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxudmFyIENhbGVuZGFyRXZlbnQgPSByZXF1aXJlKCcuLi9tb2RlbHMvQ2FsZW5kYXJFdmVudCcpLFxyXG4gICAgYXBpSGVscGVyID0gcmVxdWlyZSgnLi4vdXRpbHMvYXBpSGVscGVyJyk7XHJcblxyXG5leHBvcnRzLnBsdWdJbiA9IGZ1bmN0aW9uIChBcHBNb2RlbCkge1xyXG4gICAgXHJcbiAgICBhcGlIZWxwZXIuZGVmaW5lQ3J1ZEFwaUZvclJlc3Qoe1xyXG4gICAgICAgIGV4dGVuZGVkT2JqZWN0OiBBcHBNb2RlbC5wcm90b3R5cGUsXHJcbiAgICAgICAgTW9kZWw6IENhbGVuZGFyRXZlbnQsXHJcbiAgICAgICAgbW9kZWxOYW1lOiAnQ2FsZW5kYXJFdmVudCcsXHJcbiAgICAgICAgbW9kZWxMaXN0TmFtZTogJ0NhbGVuZGFyRXZlbnRzJyxcclxuICAgICAgICBtb2RlbFVybDogJ2V2ZW50cycsXHJcbiAgICAgICAgaWRQcm9wZXJ0eU5hbWU6ICdjYWxlbmRhckV2ZW50SUQnXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLyoqICMgQVBJXHJcbiAgICAgICAgQXBwTW9kZWwucHJvdG90eXBlLmdldEV2ZW50czo6XHJcbiAgICAgICAgQHBhcmFtIHtvYmplY3R9IGZpbHRlcnM6IHtcclxuICAgICAgICAgICAgc3RhcnQ6IERhdGUsXHJcbiAgICAgICAgICAgIGVuZDogRGF0ZSxcclxuICAgICAgICAgICAgdHlwZXM6IFszLCA1XSAvLyBbb3B0aW9uYWxdIExpc3QgRXZlbnRUeXBlc0lEc1xyXG4gICAgICAgIH1cclxuICAgICAgICAtLS1cclxuICAgICAgICBBcHBNb2RlbC5wcm90b3R5cGUuZ2V0RXZlbnRcclxuICAgICAgICAtLS1cclxuICAgICAgICBBcHBNb2RlbC5wcm90b3R5cGUucHV0RXZlbnRcclxuICAgICAgICAtLS1cclxuICAgICAgICBBcHBNb2RlbC5wcm90b3R5cGUucG9zdEV2ZW50XHJcbiAgICAgICAgLS0tXHJcbiAgICAgICAgQXBwTW9kZWwucHJvdG90eXBlLmRlbEV2ZW50XHJcbiAgICAgICAgLS0tXHJcbiAgICAgICAgQXBwTW9kZWwucHJvdG90eXBlLnNldEV2ZW50XHJcbiAgICAqKi9cclxufTsiLCIvKipcclxuICAgIE1vZGVsIEFQSSB0byBtYW5hZ2UgdGhlIGNvbGxlY3Rpb24gb2YgSm9iIFRpdGxlcyBhc3NpZ25lZFxyXG4gICAgdG8gdGhlIGN1cnJlbnQgdXNlciBhbmQgaXRzIHdvcmtpbmcgZGF0YS5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmV4cG9ydHMucGx1Z0luID0gZnVuY3Rpb24gKEFwcE1vZGVsKSB7XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEdldCB0aGUgY29tcGxldGUgbGlzdCBvZiBVc2VySm9iVGl0bGUgZm9yXHJcbiAgICAgICAgYWxsIHRoZSBKb2JUaXRsZXMgYXNzaWduZWQgdG8gdGhlIGN1cnJlbnQgdXNlclxyXG4gICAgKiovXHJcbiAgICBBcHBNb2RlbC5wcm90b3R5cGUuZ2V0VXNlckpvYlByb2ZpbGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gVE9ET1xyXG4gICAgICAgIC8vIFRlc3QgZGF0YVxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoXHJcbiAgICAgICAgICAgIFtdXHJcbiAgICAgICAgKTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEdldCBhIFVzZXJKb2JUaXRsZSByZWNvcmQgZm9yIHRoZSBnaXZlblxyXG4gICAgICAgIEpvYlRpdGxlSUQgYW5kIHRoZSBjdXJyZW50IHVzZXIuXHJcbiAgICAqKi9cclxuICAgIEFwcE1vZGVsLnByb3RvdHlwZS5nZXRVc2VySm9iVGl0bGUgPSBmdW5jdGlvbiAoam9iVGl0bGVJRCkge1xyXG4gICAgICAgIC8vIFRPRE9cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xyXG4gICAgfTtcclxufTtcclxuIiwiLyoqIEFwcE1vZGVsLCBjZW50cmFsaXplcyBhbGwgdGhlIGRhdGEgZm9yIHRoZSBhcHAsXHJcbiAgICBjYWNoaW5nIGFuZCBzaGFyaW5nIGRhdGEgYWNyb3NzIGFjdGl2aXRpZXMgYW5kIHBlcmZvcm1pbmdcclxuICAgIHJlcXVlc3RzXHJcbioqL1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuLi9tb2RlbHMvTW9kZWwnKSxcclxuICAgIFVzZXIgPSByZXF1aXJlKCcuLi9tb2RlbHMvVXNlcicpLFxyXG4gICAgUmVzdCA9IHJlcXVpcmUoJy4uL3V0aWxzL1Jlc3QnKSxcclxuICAgIGxvY2FsZm9yYWdlID0gcmVxdWlyZSgnbG9jYWxmb3JhZ2UnKTtcclxuXHJcbmZ1bmN0aW9uIEFwcE1vZGVsKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHVzZXI6IFVzZXIubmV3QW5vbnltb3VzKClcclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbi8qKiBJbml0aWFsaXplIGFuZCB3YWl0IGZvciBhbnl0aGluZyB1cCAqKi9cclxuQXBwTW9kZWwucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiBpbml0KCkge1xyXG4gICAgXHJcbiAgICAvLyBOT1RFOiBVUkwgdG8gYmUgdXBkYXRlZFxyXG4gICAgdGhpcy5yZXN0ID0gbmV3IFJlc3QoJ2h0dHA6Ly9kZXYubG9jb25vbWljcy5jb20vZW4tVVMvcmVzdC8nKTtcclxuICAgIC8vdGhpcy5yZXN0ID0gbmV3IFJlc3QoJ2h0dHA6Ly9sb2NhbGhvc3Qvc291cmNlL2VuLVVTL3Jlc3QvJyk7XHJcbiAgICBcclxuICAgIC8vIFNldHVwIFJlc3QgYXV0aGVudGljYXRpb25cclxuICAgIHRoaXMucmVzdC5vbkF1dGhvcml6YXRpb25SZXF1aXJlZCA9IGZ1bmN0aW9uKHJldHJ5KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy50cnlMb2dpbigpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIC8vIExvZ2dlZCEgSnVzdCByZXRyeVxyXG4gICAgICAgICAgICByZXRyeSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG4gICAgXHJcbiAgICAvLyBMb2NhbCBkYXRhXHJcbiAgICAvLyBUT0RPIEludmVzdGlnYXRlIHdoeSBhdXRvbWF0aWMgc2VsZWN0aW9uIGFuIEluZGV4ZWREQiBhcmVcclxuICAgIC8vIGZhaWxpbmcgYW5kIHdlIG5lZWQgdG8gdXNlIHRoZSB3b3JzZS1wZXJmb3JtYW5jZSBsb2NhbHN0b3JhZ2UgYmFjay1lbmRcclxuICAgIGxvY2FsZm9yYWdlLmNvbmZpZyh7XHJcbiAgICAgICAgbmFtZTogJ0xvY29ub21pY3NBcHAnLFxyXG4gICAgICAgIHZlcnNpb246IDAuMSxcclxuICAgICAgICBzaXplIDogNDk4MDczNiwgLy8gU2l6ZSBvZiBkYXRhYmFzZSwgaW4gYnl0ZXMuIFdlYlNRTC1vbmx5IGZvciBub3cuXHJcbiAgICAgICAgc3RvcmVOYW1lIDogJ2tleXZhbHVlcGFpcnMnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uIDogJ0xvY29ub21pY3MgQXBwJyxcclxuICAgICAgICBkcml2ZXI6IGxvY2FsZm9yYWdlLkxPQ0FMU1RPUkFHRVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gSW5pdGlhbGl6ZTogY2hlY2sgdGhlIHVzZXIgaGFzIGxvZ2luIGRhdGEgYW5kIG5lZWRlZFxyXG4gICAgLy8gY2FjaGVkIGRhdGFcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuXHJcbiAgICAgICAgLy8gQ2FsbGJhY2sgdG8ganVzdCByZXNvbHZlIHdpdGhvdXQgZXJyb3IgKHBhc3NpbmcgaW4gdGhlIGVycm9yXHJcbiAgICAgICAgLy8gdG8gdGhlICdyZXNvbHZlJyB3aWxsIG1ha2UgdGhlIHByb2Nlc3MgdG8gZmFpbCksXHJcbiAgICAgICAgLy8gc2luY2Ugd2UgZG9uJ3QgbmVlZCB0byBjcmVhdGUgYW4gZXJyb3IgZm9yIHRoZVxyXG4gICAgICAgIC8vIGFwcCBpbml0LCBpZiB0aGVyZSBpcyBub3QgZW5vdWdoIHNhdmVkIGluZm9ybWF0aW9uXHJcbiAgICAgICAgLy8gdGhlIGFwcCBoYXMgY29kZSB0byByZXF1ZXN0IGEgbG9naW4uXHJcbiAgICAgICAgdmFyIHJlc29sdmVBbnl3YXkgPSBmdW5jdGlvbihkb2Vzbk1hdHRlcil7ICAgICAgICBcclxuICAgICAgICAgICAgY29uc29sZS53YXJuaW5nKCdBcHAgTW9kZWwgSW5pdCBlcnInLCBkb2Vzbk1hdHRlcik7XHJcbiAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIElmIHRoZXJlIGFyZSBjcmVkZW50aWFscyBzYXZlZFxyXG4gICAgICAgIGxvY2FsZm9yYWdlLmdldEl0ZW0oJ2NyZWRlbnRpYWxzJykudGhlbihmdW5jdGlvbihjcmVkZW50aWFscykge1xyXG5cclxuICAgICAgICAgICAgaWYgKGNyZWRlbnRpYWxzICYmXHJcbiAgICAgICAgICAgICAgICBjcmVkZW50aWFscy51c2VySUQgJiZcclxuICAgICAgICAgICAgICAgIGNyZWRlbnRpYWxzLnVzZXJuYW1lICYmXHJcbiAgICAgICAgICAgICAgICBjcmVkZW50aWFscy5hdXRoS2V5KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gdXNlIGF1dGhvcml6YXRpb24ga2V5IGZvciBlYWNoXHJcbiAgICAgICAgICAgICAgICAvLyBuZXcgUmVzdCByZXF1ZXN0XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3QuZXh0cmFIZWFkZXJzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGFsdTogY3JlZGVudGlhbHMudXNlcklELFxyXG4gICAgICAgICAgICAgICAgICAgIGFsazogY3JlZGVudGlhbHMuYXV0aEtleVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gSXQgaGFzIGNyZWRlbnRpYWxzISBIYXMgYmFzaWMgcHJvZmlsZSBkYXRhP1xyXG4gICAgICAgICAgICAgICAgbG9jYWxmb3JhZ2UuZ2V0SXRlbSgncHJvZmlsZScpLnRoZW4oZnVuY3Rpb24ocHJvZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9maWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB1c2VyIGRhdGFcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51c2VyKCkubW9kZWwudXBkYXRlV2l0aChwcm9maWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRW5kIHN1Y2Nlc2Z1bGx5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vIHByb2ZpbGUsIHdlIG5lZWQgdG8gcmVxdWVzdCBpdCB0byBiZSBhYmxlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRvIHdvcmsgY29ycmVjdGx5LCBzbyB3ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhdHRlbXB0IGEgbG9naW4gKHRoZSB0cnlMb2dpbiBwcm9jZXNzIHBlcmZvcm1zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGEgbG9naW4gd2l0aCB0aGUgc2F2ZWQgY3JlZGVudGlhbHMgYW5kIGZldGNoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZSBwcm9maWxlIHRvIHNhdmUgaXQgaW4gdGhlIGxvY2FsIGNvcHkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJ5TG9naW4oKS50aGVuKHJlc29sdmUsIHJlc29sdmVBbnl3YXkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSwgcmVzb2x2ZUFueXdheSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBFbmQgc3VjY2Vzc2Z1bGx5LiBOb3QgbG9nZ2luIGlzIG5vdCBhbiBlcnJvcixcclxuICAgICAgICAgICAgICAgIC8vIGlzIGp1c3QgdGhlIGZpcnN0IGFwcCBzdGFydC11cFxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpLCByZXNvbHZlQW55d2F5KTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIEFjY291bnQgbWV0aG9kc1xyXG4qKi9cclxuQXBwTW9kZWwucHJvdG90eXBlLnRyeUxvZ2luID0gZnVuY3Rpb24gdHJ5TG9naW4oKSB7XHJcbiAgICAvLyBHZXQgc2F2ZWQgY3JlZGVudGlhbHNcclxuICAgIHJldHVybiBsb2NhbGZvcmFnZS5nZXRJdGVtKCdjcmVkZW50aWFscycpXHJcbiAgICAudGhlbihmdW5jdGlvbihjcmVkZW50aWFscykge1xyXG4gICAgICAgIC8vIElmIHdlIGhhdmUgb25lcywgdHJ5IHRvIGxvZy1pblxyXG4gICAgICAgIGlmIChjcmVkZW50aWFscykge1xyXG4gICAgICAgICAgICAvLyBBdHRlbXB0IGxvZ2luIHdpdGggdGhhdFxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sb2dpbihcclxuICAgICAgICAgICAgICAgIGNyZWRlbnRpYWxzLnVzZXJuYW1lLFxyXG4gICAgICAgICAgICAgICAgY3JlZGVudGlhbHMucGFzc3dvcmRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHNhdmVkIGNyZWRlbnRpYWxzJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufTtcclxuXHJcbkFwcE1vZGVsLnByb3RvdHlwZS5sb2dpbiA9IGZ1bmN0aW9uIGxvZ2luKHVzZXJuYW1lLCBwYXNzd29yZCkge1xyXG5cclxuICAgIC8vIFJlc2V0IHRoZSBleHRyYSBoZWFkZXJzIHRvIGF0dGVtcHQgdGhlIGxvZ2luXHJcbiAgICB0aGlzLnJlc3QuZXh0cmFIZWFkZXJzID0gbnVsbDtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5yZXN0LnBvc3QoJ2xvZ2luJywge1xyXG4gICAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcclxuICAgICAgICBwYXNzd29yZDogcGFzc3dvcmQsXHJcbiAgICAgICAgcmV0dXJuUHJvZmlsZTogdHJ1ZVxyXG4gICAgfSkudGhlbihmdW5jdGlvbihsb2dnZWQpIHtcclxuXHJcbiAgICAgICAgLy8gdXNlIGF1dGhvcml6YXRpb24ga2V5IGZvciBlYWNoXHJcbiAgICAgICAgLy8gbmV3IFJlc3QgcmVxdWVzdFxyXG4gICAgICAgIHRoaXMucmVzdC5leHRyYUhlYWRlcnMgPSB7XHJcbiAgICAgICAgICAgIGFsdTogbG9nZ2VkLnVzZXJJZCxcclxuICAgICAgICAgICAgYWxrOiBsb2dnZWQuYXV0aEtleVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIGFzeW5jIGxvY2FsIHNhdmUsIGRvbid0IHdhaXRcclxuICAgICAgICBsb2NhbGZvcmFnZS5zZXRJdGVtKCdjcmVkZW50aWFscycsIHtcclxuICAgICAgICAgICAgdXNlcklEOiBsb2dnZWQudXNlcklkLFxyXG4gICAgICAgICAgICB1c2VybmFtZTogdXNlcm5hbWUsXHJcbiAgICAgICAgICAgIHBhc3N3b3JkOiBwYXNzd29yZCxcclxuICAgICAgICAgICAgYXV0aEtleTogbG9nZ2VkLmF1dGhLZXlcclxuICAgICAgICB9KTtcclxuICAgICAgICBsb2NhbGZvcmFnZS5zZXRJdGVtKCdwcm9maWxlJywgbG9nZ2VkLnByb2ZpbGUpO1xyXG5cclxuICAgICAgICAvLyBTZXQgdXNlciBkYXRhXHJcbiAgICAgICAgdGhpcy51c2VyKCkubW9kZWwudXBkYXRlV2l0aChsb2dnZWQucHJvZmlsZSk7XHJcblxyXG4gICAgICAgIHJldHVybiBsb2dnZWQ7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59O1xyXG5cclxuQXBwTW9kZWwucHJvdG90eXBlLmxvZ291dCA9IGZ1bmN0aW9uIGxvZ291dCgpIHtcclxuXHJcbiAgICAvLyBMb2NhbCBhcHAgY2xvc2Ugc2Vzc2lvblxyXG4gICAgdGhpcy5yZXN0LmV4dHJhSGVhZGVycyA9IG51bGw7XHJcbiAgICBsb2NhbGZvcmFnZS5yZW1vdmVJdGVtKCdjcmVkZW50aWFscycpO1xyXG4gICAgbG9jYWxmb3JhZ2UucmVtb3ZlSXRlbSgncHJvZmlsZScpO1xyXG4gICAgXHJcbiAgICAvLyBEb24ndCBuZWVkIHRvIHdhaXQgdGhlIHJlc3VsdCBvZiB0aGUgUkVTVCBvcGVyYXRpb25cclxuICAgIHRoaXMucmVzdC5wb3N0KCdsb2dvdXQnKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG59O1xyXG5cclxuQXBwTW9kZWwucHJvdG90eXBlLnNpZ251cCA9IGZ1bmN0aW9uIHNpZ251cCh1c2VybmFtZSwgcGFzc3dvcmQsIHByb2ZpbGVUeXBlKSB7XHJcbiAgICBcclxuICAgIC8vIFJlc2V0IHRoZSBleHRyYSBoZWFkZXJzIHRvIGF0dGVtcHQgdGhlIHNpZ251cFxyXG4gICAgdGhpcy5yZXN0LmV4dHJhSGVhZHJlcyA9IG51bGw7XHJcbiAgICBcclxuICAgIHJldHVybiB0aGlzLnJlc3QucG9zdCgnc2lnbnVwP3V0bV9zb3VyY2U9YXBwJywge1xyXG4gICAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcclxuICAgICAgICBwYXNzd29yZDogcGFzc3dvcmQsXHJcbiAgICAgICAgcHJvZmlsZVR5cGU6IHByb2ZpbGVUeXBlLFxyXG4gICAgICAgIHJldHVyblByb2ZpbGU6IHRydWVcclxuICAgIH0pLnRoZW4oZnVuY3Rpb24obG9nZ2VkKSB7XHJcbiAgICAgICAgLy8gVGhlIHJlc3VsdCBpcyB0aGUgc2FtZSBhcyBpbiBhIGxvZ2luLCBhbmRcclxuICAgICAgICAvLyB3ZSBkbyB0aGUgc2FtZSBhcyB0aGVyZSB0byBnZXQgdGhlIHVzZXIgbG9nZ2VkXHJcbiAgICAgICAgLy8gb24gdGhlIGFwcCBvbiBzaWduLXVwIHN1Y2Nlc3MuXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gdXNlIGF1dGhvcml6YXRpb24ga2V5IGZvciBlYWNoXHJcbiAgICAgICAgLy8gbmV3IFJlc3QgcmVxdWVzdFxyXG4gICAgICAgIHRoaXMucmVzdC5leHRyYUhlYWRlcnMgPSB7XHJcbiAgICAgICAgICAgIGFsdTogbG9nZ2VkLnVzZXJJZCxcclxuICAgICAgICAgICAgYWxrOiBsb2dnZWQuYXV0aEtleVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIGFzeW5jIGxvY2FsIHNhdmUsIGRvbid0IHdhaXRcclxuICAgICAgICBsb2NhbGZvcmFnZS5zZXRJdGVtKCdjcmVkZW50aWFscycsIHtcclxuICAgICAgICAgICAgdXNlcklEOiBsb2dnZWQudXNlcklkLFxyXG4gICAgICAgICAgICB1c2VybmFtZTogdXNlcm5hbWUsXHJcbiAgICAgICAgICAgIHBhc3N3b3JkOiBwYXNzd29yZCxcclxuICAgICAgICAgICAgYXV0aEtleTogbG9nZ2VkLmF1dGhLZXlcclxuICAgICAgICB9KTtcclxuICAgICAgICBsb2NhbGZvcmFnZS5zZXRJdGVtKCdwcm9maWxlJywgbG9nZ2VkLnByb2ZpbGUpO1xyXG5cclxuICAgICAgICAvLyBTZXQgdXNlciBkYXRhXHJcbiAgICAgICAgdGhpcy51c2VyKCkubW9kZWwudXBkYXRlV2l0aChsb2dnZWQucHJvZmlsZSk7XHJcblxyXG4gICAgICAgIHJldHVybiBsb2dnZWQ7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59O1xyXG5cclxuQXBwTW9kZWwucHJvdG90eXBlLmdldFVwY29taW5nQm9va2luZ3MgPSBmdW5jdGlvbiBnZXRVcGNvbWluZ0Jvb2tpbmdzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVzdC5nZXQoJ3VwY29taW5nLWJvb2tpbmdzJyk7XHJcbn07XHJcblxyXG5BcHBNb2RlbC5wcm90b3R5cGUuZ2V0Qm9va2luZyA9IGZ1bmN0aW9uIGdldEJvb2tpbmcoaWQpIHtcclxuICAgIHJldHVybiB0aGlzLnJlc3QuZ2V0KCdnZXQtYm9va2luZycsIHsgYm9va2luZ0lEOiBpZCB9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXBwTW9kZWw7XHJcblxyXG4vLyBDbGFzcyBzcGxpdGVkIGluIGRpZmZlcmVudCBmaWxlcyB0byBtaXRpZ2F0ZSBzaXplIGFuZCBvcmdhbml6YXRpb25cclxuLy8gYnV0IGtlZXBpbmcgYWNjZXNzIHRvIHRoZSBjb21tb24gc2V0IG9mIG1ldGhvZHMgYW5kIG9iamVjdHMgZWFzeSB3aXRoXHJcbi8vIHRoZSBzYW1lIGNsYXNzLlxyXG4vLyBMb2FkaW5nIGV4dGVuc2lvbnM6XHJcbnJlcXVpcmUoJy4vQXBwTW9kZWwtZXZlbnRzJykucGx1Z0luKEFwcE1vZGVsKTtcclxucmVxdWlyZSgnLi9BcHBNb2RlbC11c2VySm9iUHJvZmlsZScpLnBsdWdJbihBcHBNb2RlbCk7XHJcbiIsIi8qKlxyXG4gICAgU2ltcGxlIFZpZXcgTW9kZWwgd2l0aCBtYWluIGNyZWRlbnRpYWxzIGZvclxyXG4gICAgdXNlIGluIGEgZm9ybSwgd2l0aCB2YWxpZGF0aW9uLlxyXG4gICAgVXNlZCBieSBMb2dpbiBhbmQgU2lnbnVwIGFjdGl2aXRpZXNcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcblxyXG5mdW5jdGlvbiBGb3JtQ3JlZGVudGlhbHMoKSB7XHJcblxyXG4gICAgdGhpcy51c2VybmFtZSA9IGtvLm9ic2VydmFibGUoJycpO1xyXG4gICAgdGhpcy5wYXNzd29yZCA9IGtvLm9ic2VydmFibGUoJycpO1xyXG4gICAgXHJcbiAgICAvLyB2YWxpZGF0ZSB1c2VybmFtZSBhcyBhbiBlbWFpbFxyXG4gICAgdmFyIGVtYWlsUmVnZXhwID0gL15bLTAtOUEtWmEteiEjJCUmJyorLz0/Xl9ge3x9fi5dK0BbLTAtOUEtWmEteiEjJCUmJyorLz0/Xl9ge3x9fi5dKyQvO1xyXG4gICAgdGhpcy51c2VybmFtZS5lcnJvciA9IGtvLm9ic2VydmFibGUoJycpO1xyXG4gICAgdGhpcy51c2VybmFtZS5zdWJzY3JpYmUoZnVuY3Rpb24odikge1xyXG4gICAgICAgIGlmICh2KSB7XHJcbiAgICAgICAgICAgIGlmIChlbWFpbFJlZ2V4cC50ZXN0KHYpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJuYW1lLmVycm9yKCcnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWUuZXJyb3IoJ0lzIG5vdCBhIHZhbGlkIGVtYWlsJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMudXNlcm5hbWUuZXJyb3IoJ1JlcXVpcmVkJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIFxyXG4gICAgLy8gcmVxdWlyZWQgcGFzc3dvcmRcclxuICAgIHRoaXMucGFzc3dvcmQuZXJyb3IgPSBrby5vYnNlcnZhYmxlKCcnKTtcclxuICAgIHRoaXMucGFzc3dvcmQuc3Vic2NyaWJlKGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICB2YXIgZXJyID0gJyc7XHJcbiAgICAgICAgaWYgKCF2KVxyXG4gICAgICAgICAgICBlcnIgPSAnUmVxdWlyZWQnO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMucGFzc3dvcmQuZXJyb3IoZXJyKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRm9ybUNyZWRlbnRpYWxzO1xyXG4iLCIvKiogTmF2QWN0aW9uIHZpZXcgbW9kZWwuXHJcbiAgICBJdCBhbGxvd3Mgc2V0LXVwIHBlciBhY3Rpdml0eSBmb3IgdGhlIEFwcE5hdiBhY3Rpb24gYnV0dG9uLlxyXG4qKi9cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi4vbW9kZWxzL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBOYXZBY3Rpb24odmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGxpbms6ICcnLFxyXG4gICAgICAgIGljb246ICcnLFxyXG4gICAgICAgIHRleHQ6ICcnLFxyXG4gICAgICAgIC8vICdUZXN0JyBpcyB0aGUgaGVhZGVyIHRpdGxlIGJ1dCBwbGFjZWQgaW4gdGhlIGJ1dHRvbi9hY3Rpb25cclxuICAgICAgICBpc1RpdGxlOiBmYWxzZSxcclxuICAgICAgICAvLyAnTGluaycgaXMgdGhlIGVsZW1lbnQgSUQgb2YgYSBtb2RhbCAoc3RhcnRzIHdpdGggYSAjKVxyXG4gICAgICAgIGlzTW9kYWw6IGZhbHNlLFxyXG4gICAgICAgIC8vICdMaW5rJyBpcyBhIFNoZWxsIGNvbW1hbmQsIGxpa2UgJ2dvQmFjayAyJ1xyXG4gICAgICAgIGlzU2hlbGw6IGZhbHNlLFxyXG4gICAgICAgIC8vIFNldCBpZiB0aGUgZWxlbWVudCBpcyBhIG1lbnUgYnV0dG9uLCBpbiB0aGF0IGNhc2UgJ2xpbmsnXHJcbiAgICAgICAgLy8gd2lsbCBiZSB0aGUgSUQgb2YgdGhlIG1lbnUgKGNvbnRhaW5lZCBpbiB0aGUgcGFnZTsgd2l0aG91dCB0aGUgaGFzaCksIHVzaW5nXHJcbiAgICAgICAgLy8gdGhlIHRleHQgYW5kIGljb24gYnV0IHNwZWNpYWwgbWVhbmluZyBmb3IgdGhlIHRleHQgdmFsdWUgJ21lbnUnXHJcbiAgICAgICAgLy8gb24gaWNvbiBwcm9wZXJ0eSB0aGF0IHdpbGwgdXNlIHRoZSBzdGFuZGFyZCBtZW51IGljb24uXHJcbiAgICAgICAgaXNNZW51OiBmYWxzZVxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBOYXZBY3Rpb247XHJcblxyXG4vLyBTZXQgb2YgdmlldyB1dGlsaXRpZXMgdG8gZ2V0IHRoZSBsaW5rIGZvciB0aGUgZXhwZWN0ZWQgaHRtbCBhdHRyaWJ1dGVzXHJcblxyXG5OYXZBY3Rpb24ucHJvdG90eXBlLmdldEhyZWYgPSBmdW5jdGlvbiBnZXRIcmVmKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgICAodGhpcy5pc01lbnUoKSB8fCB0aGlzLmlzTW9kYWwoKSB8fCB0aGlzLmlzU2hlbGwoKSkgP1xyXG4gICAgICAgICcjJyA6XHJcbiAgICAgICAgdGhpcy5saW5rKClcclxuICAgICk7XHJcbn07XHJcblxyXG5OYXZBY3Rpb24ucHJvdG90eXBlLmdldE1vZGFsVGFyZ2V0ID0gZnVuY3Rpb24gZ2V0TW9kYWxUYXJnZXQoKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgICh0aGlzLmlzTWVudSgpIHx8ICF0aGlzLmlzTW9kYWwoKSB8fCB0aGlzLmlzU2hlbGwoKSkgP1xyXG4gICAgICAgICcnIDpcclxuICAgICAgICB0aGlzLmxpbmsoKVxyXG4gICAgKTtcclxufTtcclxuXHJcbk5hdkFjdGlvbi5wcm90b3R5cGUuZ2V0U2hlbGxDb21tYW5kID0gZnVuY3Rpb24gZ2V0U2hlbGxDb21tYW5kKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgICAodGhpcy5pc01lbnUoKSB8fCAhdGhpcy5pc1NoZWxsKCkpID9cclxuICAgICAgICAnJyA6XHJcbiAgICAgICAgdGhpcy5saW5rKClcclxuICAgICk7XHJcbn07XHJcblxyXG5OYXZBY3Rpb24ucHJvdG90eXBlLmdldE1lbnVJRCA9IGZ1bmN0aW9uIGdldE1lbnVJRCgpIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgKCF0aGlzLmlzTWVudSgpKSA/XHJcbiAgICAgICAgJycgOlxyXG4gICAgICAgIHRoaXMubGluaygpXHJcbiAgICApO1xyXG59O1xyXG5cclxuTmF2QWN0aW9uLnByb3RvdHlwZS5nZXRNZW51TGluayA9IGZ1bmN0aW9uIGdldE1lbnVMaW5rKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgICAoIXRoaXMuaXNNZW51KCkpID9cclxuICAgICAgICAnJyA6XHJcbiAgICAgICAgJyMnICsgdGhpcy5saW5rKClcclxuICAgICk7XHJcbn07XHJcblxyXG4vKiogU3RhdGljLCBzaGFyZWQgYWN0aW9ucyAqKi9cclxuTmF2QWN0aW9uLmdvSG9tZSA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgbGluazogJy8nLFxyXG4gICAgaWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24taG9tZSdcclxufSk7XHJcblxyXG5OYXZBY3Rpb24uZ29CYWNrID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnZ29CYWNrJyxcclxuICAgIGljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLWFycm93LWxlZnQnLFxyXG4gICAgaXNTaGVsbDogdHJ1ZVxyXG59KTtcclxuXHJcbi8vIFRPRE8gVE8gUkVNT1ZFLCBFeGFtcGxlIG9mIG1vZGFsXHJcbk5hdkFjdGlvbi5uZXdJdGVtID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnI25ld0l0ZW0nLFxyXG4gICAgaWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICBpc01vZGFsOiB0cnVlXHJcbn0pO1xyXG5cclxuTmF2QWN0aW9uLm1lbnVJbiA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgbGluazogJ21lbnVJbicsXHJcbiAgICBpY29uOiAnbWVudScsXHJcbiAgICBpc01lbnU6IHRydWVcclxufSk7XHJcblxyXG5OYXZBY3Rpb24ubWVudU91dCA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgbGluazogJ21lbnVPdXQnLFxyXG4gICAgaWNvbjogJ21lbnUnLFxyXG4gICAgaXNNZW51OiB0cnVlXHJcbn0pO1xyXG5cclxuTmF2QWN0aW9uLm1lbnVOZXdJdGVtID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnbWVudU5ld0l0ZW0nLFxyXG4gICAgaWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICBpc01lbnU6IHRydWVcclxufSk7XHJcblxyXG5OYXZBY3Rpb24uZ29IZWxwSW5kZXggPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICcjaGVscEluZGV4JyxcclxuICAgIHRleHQ6ICdoZWxwJyxcclxuICAgIGlzTW9kYWw6IHRydWVcclxufSk7XHJcblxyXG5OYXZBY3Rpb24uZ29Mb2dpbiA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgbGluazogJy9sb2dpbicsXHJcbiAgICB0ZXh0OiAnbG9nLWluJ1xyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5nb0xvZ291dCA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgbGluazogJy9sb2dvdXQnLFxyXG4gICAgdGV4dDogJ2xvZy1vdXQnXHJcbn0pO1xyXG5cclxuTmF2QWN0aW9uLmdvU2lnbnVwID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnL3NpZ251cCcsXHJcbiAgICB0ZXh0OiAnc2lnbi11cCdcclxufSk7XHJcbiIsIi8qKiBOYXZCYXIgdmlldyBtb2RlbC5cclxuICAgIEl0IGFsbG93cyBjdXN0b21pemUgdGhlIE5hdkJhciBwZXIgYWN0aXZpdHkuXHJcbioqL1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuLi9tb2RlbHMvTW9kZWwnKSxcclxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4vTmF2QWN0aW9uJyk7XHJcblxyXG5mdW5jdGlvbiBOYXZCYXIodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIC8vIFRpdGxlIHNob3dlZCBpbiB0aGUgY2VudGVyXHJcbiAgICAgICAgLy8gV2hlbiB0aGUgdGl0bGUgaXMgJ251bGwnLCB0aGUgYXBwIGxvZ28gaXMgc2hvd2VkIGluIHBsYWNlLFxyXG4gICAgICAgIC8vIG9uIGVtcHR5IHRleHQsIHRoZSBlbXB0eSB0ZXh0IGlzIHNob3dlZCBhbmQgbm8gbG9nby5cclxuICAgICAgICB0aXRsZTogJycsXHJcbiAgICAgICAgLy8gTmF2QWN0aW9uIGluc3RhbmNlOlxyXG4gICAgICAgIGxlZnRBY3Rpb246IG51bGwsXHJcbiAgICAgICAgLy8gTmF2QWN0aW9uIGluc3RhbmNlOlxyXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBudWxsXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE5hdkJhcjtcclxuIl19
;