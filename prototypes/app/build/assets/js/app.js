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

},{"../viewmodels/NavAction":100,"../viewmodels/NavBar":101}],3:[function(require,module,exports){
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

    this.accessLevel = app.UserType.Freelancer;
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

},{"../components/DatePicker":40,"../models/Appointment":43,"../testdata/calendarAppointments":62,"../viewmodels/NavAction":100,"../viewmodels/NavBar":101,"knockout":false,"moment":false}],4:[function(require,module,exports){
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

},{"../components/DatePicker":40,"../models/CalendarSlot":46,"../testdata/calendarSlots":63,"../viewmodels/NavAction":100,"../viewmodels/NavBar":101,"knockout":false,"moment":false}],6:[function(require,module,exports){
/**
    CalendarSyncing activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var moment = require('moment');

var A = Activity.extends(function CalendarSyncingActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.Freelancer;

    this.navBar = Activity.createSubsectionNavBar('Scheduling');
    
    // Adding auto-select behavior to the export URL
    this.$activity.find('#calendarSync-icalExportUrl')
    .on('click', function() {
        this.select();
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    // Request a load, even if is a background load after the first time:
    this.app.model.calendarSyncing.load();
    // Discard any previous unsaved edit
    this.viewModel.discard();
};

function ViewModel(app) {

    var calendarSyncing = app.model.calendarSyncing;

    var syncVersion = calendarSyncing.newVersion();
    syncVersion.isObsolete.subscribe(function(itIs) {
        if (itIs) {
            // new version from server while editing
            // FUTURE: warn about a new remote version asking
            // confirmation to load them or discard and overwrite them;
            // the same is need on save(), and on server response
            // with a 509:Conflict status (its body must contain the
            // server version).
            // Right now, just overwrite current changes with
            // remote ones:
            syncVersion.pull({ evenIfNewer: true });
        }
    });
    
    // Actual data for the form:
    this.sync = syncVersion.version;

    this.isLocked = ko.pureComputed(function() {
        return this.isLocked() || this.isReseting();
    }, calendarSyncing);

    this.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ? 
                'loading...' : 
                this.isSaving() ? 
                    'saving...' : 
                    'Save'
        );
    }, calendarSyncing);
    
    this.resetText = ko.pureComputed(function() {
        return (
            this.isReseting() ? 
                'reseting...' : 
                'Reset Private URL'
        );
    }, calendarSyncing);
    
    this.discard = function discard() {
        syncVersion.pull({ evenIfNewer: true });
    };

    this.save = function save() {
        // Force to save, even if there was remote updates
        syncVersion.push({ evenIfObsolete: true });
    };
    
    this.reset = function reset() {
        calendarSyncing.resetExportUrl();
    };
}

},{"../components/Activity":39,"knockout":false,"moment":false}],7:[function(require,module,exports){
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

},{"../components/Activity":39,"../models/Client":48,"knockout":false}],8:[function(require,module,exports){
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

    this.accessLevel = app.UserType.Freelancer;
    
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

},{"../components/Activity":39,"../testdata/clients":64,"../viewmodels/NavAction":100,"../viewmodels/NavBar":101,"knockout":false}],9:[function(require,module,exports){
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

},{"../components/Activity":39,"../testdata/clients":64,"knockout":false}],10:[function(require,module,exports){
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

},{"../components/Activity":39,"knockout":false}],11:[function(require,module,exports){
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

},{"../viewmodels/NavAction":100,"../viewmodels/NavBar":101,"knockout":false}],12:[function(require,module,exports){
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

},{"../components/Activity":39,"../models/MailFolder":52,"../testdata/messages":66,"knockout":false}],13:[function(require,module,exports){
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

},{"../components/DatePicker":40,"../testdata/timeSlots":68,"../utils/Time":75,"../viewmodels/NavAction":100,"../viewmodels/NavBar":101,"knockout":false,"moment":false}],14:[function(require,module,exports){
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

},{"../components/Activity":39,"../models/Model":54,"knockout":false}],15:[function(require,module,exports){
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

},{"../components/Activity":39}],16:[function(require,module,exports){
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

},{"../components/Activity":39,"knockout":false}],17:[function(require,module,exports){
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

},{"../models/GetMore":49,"../models/MailFolder":52,"../models/PerformanceSummary":55,"../models/UpcomingBookingsSummary":60,"../testdata/messages":66,"../utils/Time":75,"../viewmodels/NavAction":100,"../viewmodels/NavBar":101,"knockout":false}],18:[function(require,module,exports){
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

},{"../components/Activity":39,"../models/MailFolder":52,"../testdata/messages":66,"knockout":false}],19:[function(require,module,exports){
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

},{"../viewmodels/NavAction":100,"../viewmodels/NavBar":101}],20:[function(require,module,exports){
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

},{"../components/Activity":39}],21:[function(require,module,exports){
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
},{"../viewmodels/NavAction":100,"../viewmodels/NavBar":101,"knockout":false}],22:[function(require,module,exports){
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
    
    this.accessLevel = app.UserType.Freelancer;

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
},{"../models/Location":51,"../viewmodels/NavAction":100,"../viewmodels/NavBar":101,"knockout":false}],23:[function(require,module,exports){
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
    
    this.accessLevel = app.UserType.Freelancer;
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

},{"../testdata/locations":65,"../viewmodels/NavAction":100,"../viewmodels/NavBar":101,"knockout":false}],24:[function(require,module,exports){
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

},{"../models/User":61,"../viewmodels/FormCredentials":99,"../viewmodels/NavAction":100,"../viewmodels/NavBar":101,"knockout":false}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
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

},{}],27:[function(require,module,exports){
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

},{"../viewmodels/NavAction":100,"../viewmodels/NavBar":101}],28:[function(require,module,exports){
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

    this.accessLevel = app.UserType.Freelancer;
    
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
},{"../models/Position":56,"../viewmodels/NavAction":100,"../viewmodels/NavBar":101,"knockout":false}],29:[function(require,module,exports){
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

},{"../viewmodels/NavAction":100,"../viewmodels/NavBar":101,"knockout":false}],30:[function(require,module,exports){
/**
    SchedulingPreferences activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var moment = require('moment');

var A = Activity.extends(function SchedulingPreferencesActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.Freelancer;

    this.navBar = Activity.createSubsectionNavBar('Scheduling');
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    // Request a load, even if is a background load after the first time:
    this.app.model.schedulingPreferences.load();
    // Discard any previous unsaved edit
    this.viewModel.discard();
};

function ViewModel(app) {

    var schedulingPreferences = app.model.schedulingPreferences;

    var prefsVersion = schedulingPreferences.newVersion();
    prefsVersion.isObsolete.subscribe(function(itIs) {
        if (itIs) {
            // new version from server while editing
            // FUTURE: warn about a new remote version asking
            // confirmation to load them or discard and overwrite them;
            // the same is need on save(), and on server response
            // with a 509:Conflict status (its body must contain the
            // server version).
            // Right now, just overwrite current changes with
            // remote ones:
            prefsVersion.pull({ evenIfNewer: true });
        }
    });
    
    // Actual data for the form:
    this.prefs = prefsVersion.version;

    this.isLocked = schedulingPreferences.isLocked;

    this.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ? 
                'loading...' : 
                this.isSaving() ? 
                    'saving...' : 
                    'Save'
        );
    }, schedulingPreferences);
    
    this.discard = function discard() {
        prefsVersion.pull({ evenIfNewer: true });
    }.bind(this);

    this.save = function save() {
        // Force to save, even if there was remote updates
        prefsVersion.push({ evenIfObsolete: true });
    }.bind(this);
    
    this.incrementsExample = ko.pureComputed(function() {
        
        var str = 'e.g. ',
            incSize = this.incrementsSizeInMinutes(),
            m = moment({ hour: 10, minute: 0 }),
            hours = [m.format('HH:mm')];
        
        for (var i = 1; i < 4; i++) {
            hours.push(
                m.add(incSize, 'minutes')
                .format('HH:mm')
            );
        }
        str += hours.join(', ');
        
        return str;
        
    }, this.prefs);
}

},{"../components/Activity":39,"knockout":false,"moment":false}],31:[function(require,module,exports){
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
    
    this.accessLevel = this.app.UserType.Frelancer;
    
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

},{"../components/Activity":39,"../testdata/services":67,"knockout":false}],32:[function(require,module,exports){
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

},{"../viewmodels/FormCredentials":99,"../viewmodels/NavAction":100,"../viewmodels/NavBar":101,"knockout":false}],33:[function(require,module,exports){
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

},{"../viewmodels/NavAction":100,"../viewmodels/NavBar":101,"events":false,"knockout":false}],34:[function(require,module,exports){
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

},{"./utils/jsPropertiesTools":82,"knockout":false}],35:[function(require,module,exports){
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

},{"./viewmodels/NavAction":100,"./viewmodels/NavBar":101,"knockout":false}],36:[function(require,module,exports){
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
    'clientEdition': require('./activities/clientEdition'),
    'schedulingPreferences': require('./activities/schedulingPreferences'),
    'calendarSyncing': require('./activities/calendarSyncing')
};

},{"./activities/account":2,"./activities/appointment":3,"./activities/bookingConfirmation":4,"./activities/calendar":5,"./activities/calendarSyncing":6,"./activities/clientEdition":7,"./activities/clients":8,"./activities/cms":9,"./activities/contactForm":10,"./activities/contactInfo":11,"./activities/conversation":12,"./activities/datetimePicker":13,"./activities/faqs":14,"./activities/feedback":15,"./activities/feedbackForm":16,"./activities/home":17,"./activities/inbox":18,"./activities/index":19,"./activities/jobtitles":20,"./activities/learnMore":21,"./activities/locationEdition":22,"./activities/locations":23,"./activities/login":24,"./activities/logout":25,"./activities/onboardingComplete":26,"./activities/onboardingHome":27,"./activities/onboardingPositions":28,"./activities/scheduling":29,"./activities/schedulingPreferences":30,"./activities/services":31,"./activities/signup":32,"./activities/textEditor":33}],37:[function(require,module,exports){
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
},{"./app-components":34,"./app-navbar":35,"./app.activities":36,"./app.shell":38,"./components/SmartNavBar":41,"./locales/en-US-LC":42,"./utils/Function.prototype._delayed":70,"./utils/Function.prototype._inherits":71,"./utils/accessControl":76,"./utils/bootknockBindingHelpers":78,"./viewmodels/AppModel":96,"./viewmodels/NavAction":100,"./viewmodels/NavBar":101,"es6-promise":false,"knockout":false}],38:[function(require,module,exports){
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

},{"./utils/shell/hashbangHistory":87,"./utils/shell/index":88}],39:[function(require,module,exports){
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
            NavAction.goHelpIndex.model.clone({
                link: '#' + options.helpId
            }) :
            NavAction.goHelpIndex
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

},{"../utils/Function.prototype._inherits":71,"../viewmodels/NavAction":100,"../viewmodels/NavBar":101,"knockout":false}],40:[function(require,module,exports){
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

},{}],41:[function(require,module,exports){
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

},{}],42:[function(require,module,exports){
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

},{"moment":false}],43:[function(require,module,exports){
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

},{"./Client":48,"./Location":51,"./Model":54,"./Service":58,"knockout":false,"moment":false}],44:[function(require,module,exports){
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

},{"./Model":54,"knockout":false,"moment":false}],45:[function(require,module,exports){
/**
    Event model
**/
'use strict';

/* Example JSON (returned by the REST API):
{
  "EventID": 353,
  "UserID": 141,
  "EventTypeID": 3,
  "Summary": "Housekeeper services for John D.",
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
},{"./Model":54,"knockout":false,"moment":false}],46:[function(require,module,exports){
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

},{"./Client":48,"./Model":54,"knockout":false}],47:[function(require,module,exports){
/**
    CalendarSyncing model.
 **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model');

function CalendarSyncing(values) {

    Model(this);

    this.model.defProperties({
        icalExportUrl: '',
        icalImportUrl: ''
    }, values);
}

module.exports = CalendarSyncing;

},{"./Model":54,"knockout":false}],48:[function(require,module,exports){
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

},{"./Model":54,"knockout":false}],49:[function(require,module,exports){
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

},{"./ListViewItem":50,"./Model":54,"knockout":false}],50:[function(require,module,exports){
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

},{"./Model":54,"knockout":false,"moment":false}],51:[function(require,module,exports){
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

},{"./Model":54,"knockout":false}],52:[function(require,module,exports){
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

},{"./Model":54,"knockout":false,"lodash":false,"moment":false}],53:[function(require,module,exports){
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

},{"./Model":54,"knockout":false,"moment":false}],54:[function(require,module,exports){
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
    
    // Timestamp with the date of last change
    // in the data (automatically updated when changes
    // happens on properties; fields or any other member
    // added to the model cannot be observed for changes,
    // requiring manual updating with a 'new Date()', but is
    // better to use properties.
    // Its rated to zero just to avoid that consecutive
    // synchronous changes emit lot of notifications, specially
    // with bulk tasks like 'updateWith'.
    this.dataTimestamp = ko.observable(new Date()).extend({ rateLimit: 0 });
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
        propertiesList = this.propertiesList,
        dataTimestamp = this.dataTimestamp;

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
        
        // Add subscriber to update the timestamp on changes
        modelObject[key].subscribe(function() {
            dataTimestamp(new Date());
        });
        
        // Add to the internal registry
        propertiesList.push(key);
    });
    
    // Update timestamp after the bulk creation.
    dataTimestamp(new Date());
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
    Allows to register a property (previously defined) as 
    the model timestamp, so gets updated on any data change
    (keep in sync with the internal dataTimestamp).
**/
Model.prototype.regTimestamp = function regTimestampProperty(propertyName) {

    var prop = this.modelObject[propertyName];
    if (typeof(prop) !== 'function') {
        throw new Error('There is no observable property with name [' + 
                        propertyName + 
                        '] to register as timestamp.'
       );
    }
    // Add subscriber on internal timestamp to keep
    // the property updated
    this.dataTimestamp.subscribe(function(timestamp) {
        prop(timestamp);
    });
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
    var timestamp = null;
    if (data && data.model instanceof Model) {

        // We need to set the same timestamp, so
        // remember for after the fromJS
        timestamp = data.model.dataTimestamp();
        
        // Replace data with a plain copy of itself
        data = data.model.toPlainObject(deepCopy);
    }

    ko.mapping.fromJS(data, this.mappingOptions, this.modelObject);
    // Same timestamp if any
    if (timestamp)
        this.modelObject.model.dataTimestamp(timestamp);
};

Model.prototype.clone = function clone(data, deepCopy) {
    // Get a plain object with the object data
    var plain = this.toPlainObject(deepCopy);
    // Create a new model instance, using the source plain object
    // as initial values
    var cloned = new this.modelObject.constructor(plain);
    if (data) {
        // Update the cloned with the provided plain data used
        // to replace values on the cloned one, for quick one-step creation
        // of derived objects.
        cloned.model.updateWith(data);
    }
    // Cloned model ready:
    return cloned;
};

},{"knockout":false,"knockout.mapping":false}],55:[function(require,module,exports){
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

},{"./ListViewItem":50,"./Model":54,"knockout":false,"moment":false,"numeral":1}],56:[function(require,module,exports){
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

},{"./Model":54,"knockout":false}],57:[function(require,module,exports){
/**
    SchedulingPreferences model.
 **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model');

function SchedulingPreferences(values) {
    
    Model(this);

    this.model.defProperties({
        advanceTime: 24,
        betweenTime: 0,
        incrementsSizeInMinutes: 15
    }, values);
}

module.exports = SchedulingPreferences;

},{"./Model":54,"knockout":false}],58:[function(require,module,exports){
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

},{"./Model":54,"knockout":false}],59:[function(require,module,exports){
/**
    SimplifiedWeeklySchedule model.
    
    Its 'simplified' because it provides an API
    for simple time range per week day,
    a pair of from-to times.
    Good for current simple UI.
    
    The original weekly schedule defines the schedule
    in 15 minutes slots, so multiple time ranges can
    exists per week day, just marking each slot
    as available or unavailable. The AppModel
    will fill this model instances properly making
    any conversion from/to the source data.
 **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model');

/**
    Submodel that is used on the SimplifiedWeeklySchedule
    defining a single week day availability range.
    A full day must have values from:0 to:1440, never
    both as zero because thats considered as not available,
    so is better to use the isAllDay property.
**/
function WeekDaySchedule(values) {
    
    Model(this);

    // NOTE: from-to properies as numbers
    // for the minute of the day, from 0 (00:00) to 1439 (23:59)
    this.model.defProperties({
        from: 0,
        to: 0
    }, values);
    
    /**
        It allows to know if this week day is 
        enabled for weekly schedule, just it
        has from-to times.
        It allows to be set as true putting
        a default range (9a-5p) or false 
        setting both as 0p.
    **/
    this.isEnabled = ko.pureComputed({
        read: function() {
            return (
                typeof(this.from()) === 'number' &&
                typeof(this.to()) === 'number' &&
                this.from() < this.to()
            );
        },
        write: function(val) {
            if (val === true) {
                // Default range 9a - 5p
                this.from(9);
                this.to(17);
            }
            else {
                this.from(0);
                this.to(0);
            }
        },
        owner: this
    });
    
    this.isAllDay = ko.pureComputed({
        read: function() {
            return  (
                this.from() === 0 &&
                this.to() === 1440
            );
        },
        write: function(val) {
            this.from(0);
            this.to(1440);
        },
        owner: this
    });
}

/**
    Main model defining the week schedule
    per week date, or just set all days times
    as available with a single flag.
**/
function SimplifiedWeeklySchedule(values) {
    
    Model(this);

    this.model.defProperties({
        sunday: new WeekDaySchedule(),
        monday: new WeekDaySchedule(),
        tuesday: new WeekDaySchedule(),
        wednesday: new WeekDaySchedule(),
        thursday: new WeekDaySchedule(),
        friday: new WeekDaySchedule(),
        saturday: new WeekDaySchedule(),
        isAllTime: false
    }, values);
}

module.exports = SimplifiedWeeklySchedule;

},{"./Model":54,"knockout":false}],60:[function(require,module,exports){
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

},{"./BookingSummary":44,"./Model":54,"knockout":false}],61:[function(require,module,exports){
/** User model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model');

// Enum UserType
var UserType = {
    None: 0,
    Anonymous: 1,
    Customer: 2,
    Freelancer: 4,
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
        lastName: '',
        secondLastName: '',
        businessName: '',
        
        alternativeEmail: '',
        phone: '',
        canReceiveSms: '',
        birthMonthDay: null,
        birthMonth: null,
        
        isFreelancer: false,
        isCustomer: false,
        isMember: false,
        isAdmin: false,

        onboardingStep: null,
        accountStatusID: 0,
        createdDate: null,
        updatedDate: null
    }, values);

    this.fullName = ko.pureComputed(function() {
        var nameParts = [this.firstName()];
        if (this.lastName())
            nameParts.push(this.lastName());
        if (this.secondLastName())
            nameParts.push(this.secondLastName);
        
        return nameParts.join(' ');
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
                p = this.isFreelancer(),
                a = this.isAdmin();
            
            var userType = 0;
            
            if (this.isAnonymous())
                userType = userType | UserType.Anonymous;
            if (c)
                userType = userType | UserType.Customer;
            if (p)
                userType = userType | UserType.Freelancer;
            if (a)
                userType = userType | UserType.Admin;
            
            return userType;
        },
        /* NOTE: Not required for now:
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

},{"./Model":54,"knockout":false}],62:[function(require,module,exports){
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

},{"../models/Appointment":43,"./locations":65,"./services":67,"knockout":false,"moment":false}],63:[function(require,module,exports){
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

},{"../models/CalendarSlot":46,"../utils/Time":75,"moment":false}],64:[function(require,module,exports){
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

},{"../models/Client":48}],65:[function(require,module,exports){
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

},{"../models/Location":51}],66:[function(require,module,exports){
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

},{"../models/Message":53,"../utils/Time":75,"moment":false}],67:[function(require,module,exports){
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

},{"../models/Service":58}],68:[function(require,module,exports){
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

},{"../utils/Time":75,"moment":false}],69:[function(require,module,exports){
/**
    Utility to help track the state of cached data
    managing time, preference and if must be revalidated
    or not.
    
    Its just manages meta data, but not the data to be cached.
**/
'use strict';

var moment = require('moment');

function CacheControl(options) {
    
    options = options || {};

    // A number of milliseconds or
    // An object with desired units and amount, all optional,
    // any combination with almost one specified, sample:
    // { years: 0, months: 0, weeks: 0, 
    //   days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }
    this.ttl = moment.duration(options.ttl).asMilliseconds();
    this.latest = options.latest || null;

    this.mustRevalidate = function mustRevalidate() {
        var tdiff = this.latest && new Date() - this.latest || Number.POSITIVE_INFINITY;
        return tdiff > this.ttl;
    };
}

module.exports = CacheControl;

},{"moment":false}],70:[function(require,module,exports){
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

},{}],71:[function(require,module,exports){
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

},{}],72:[function(require,module,exports){
/**
    Utility that allows to keep an original model untouched
    while editing a version, helping synchronize both
    when desired by push/pull/sync-ing.
    
    Its the usual way to work on forms, where an in memory
    model can be used but in a copy so changes doesn't affects
    other uses of the in-memory model (and avoids remote syncing)
    until the copy want to be persisted by pushing it, or being
    discarded or refreshed with a remotely updated original model.
**/
'use strict';

var ko = require('knockout'),
    EventEmitter = require('events').EventEmitter;

function ModelVersion(original) {
    
    EventEmitter.call(this);
    
    this.original = original;
    
    // Create version
    // (updateWith takes care to set the same dataTimestamp)
    this.version = original.model.clone();
    
    // Computed that test equality, allowing being notified of changes
    // A rateLimit is used on each to avoid several syncrhonous notifications.
    
    /**
        Returns true when both versions has the same timestamp
    **/
    this.areDifferent = ko.pureComputed(function areDifferent() {
        return (
            this.original.model.dataTimestamp() !== 
            this.version.model.dataTimestamp()
        );
    }, this).extend({ rateLimit: 0 });
    /**
        Returns true when the version has newer changes than
        the original
    **/
    this.isNewer = ko.pureComputed(function isNewer() {
        return (
            this.original.model.dataTimestamp() < 
            this.version.model.dataTimestamp()
        );
    }, this).extend({ rateLimit: 0 });
    /**
        Returns true when the version has older changes than
        the original
    **/
    this.isObsolete = ko.pureComputed(function isComputed() {
        return (
            this.original.model.dataTimestamp() > 
            this.version.model.dataTimestamp()
        );
    }, this).extend({ rateLimit: 0 });
}

module.exports = ModelVersion;

ModelVersion._inherits(EventEmitter);

/**
    Sends the version changes to the original
    
    options: {
        evenIfNewer: false
    }
**/
ModelVersion.prototype.pull = function pull(options) {

    options = options || {};
    
    // By default, nothing to do, or avoid overwrite changes.
    var result = false;
    
    if (options.evenIfNewer || !this.isNewer()) {
        // Update version, getting original
        // (updateWith takes care to set the same dataTimestamp)
        this.version.model.updateWith(this.original);
        // Done
        result = true;
    }
    
    this.emit('pull', result);
    return result;
};

/**
    Discard the version changes getting the original
    data.
    
    options: {
        evenIfObsolete: false
    }
**/
ModelVersion.prototype.push = function push(options) {
    
    options = options || {};
    
    // By default, nothing to do, or avoid overwrite changes.
    var result = false;
    
    if (options.evenIfObsolete || !this.isObsolete()) {
        // Update original
        // (updateWith takes care to set the same dataTimestamp)
        this.original.model.updateWith(this.version);
        // Done
        result = true;
    }
    
    this.emit('push', result);
    return result;
};

/**
    Sets original and version on the same version
    by getting the newest one.
**/
ModelVersion.prototype.sync = function sync() {
    
    if (this.isNewer())
        return this.push();
    else if (this.isObsolete())
        return this.pull();
    else
        return false;
};

},{"events":false,"knockout":false}],73:[function(require,module,exports){
/**
    RemoteModel class.
    
    It helps managing a model instance, model versions
    for in memory modification, and the process to 
    receive or send the model data
    to a remote sources, with glue code for the tasks
    and state properties.
    
    Every instance or subclass must implement
    the fetch and pull methods that knows the specifics
    of the remotes.
**/
'use strict';

var ModelVersion = require('../utils/ModelVersion'),
    CacheControl = require('../utils/CacheControl'),
    ko = require('knockout');

function RemoteModel(options) {

    options = options || {};
    
    var firstTimeLoad = true;
    
    // Marks a lock loading is happening, any user code
    // must wait for it
    this.isLoading = ko.observable(false);
    // Marks a lock saving is happening, any user code
    // must wait for it
    this.isSaving = ko.observable(false);
    // Marks a background synchronization: load or save,
    // user code knows is happening but can continue
    // using cached data
    this.isSyncing = ko.observable(false);
    // Utility to know whether any locking operation is
    // happening.
    // Just loading or saving
    this.isLocked = ko.pureComputed(function(){
        return this.isLoading() || this.isSaving();
    }, this);
    
    if (!options.data)
        throw new Error('RemoteModel data must be set on constructor and no changed later');
    this.data = options.data;
    
    this.cache = new CacheControl({
        ttl: options.ttl
    });
    
    // Recommended way to get the instance data
    // since it ensures to launch a load of the
    // data each time is accessed this way.
    this.getData = function getData() {
        this.load();
        return this.data;
    };

    this.newVersion = function newVersion() {
        var v = new ModelVersion(this.data);
        
        // Update the version data with the original
        // after a lock load finish, like the first time,
        // since the UI to edit the version will be lock
        // in the middle.
        this.isLoading.subscribe(function (isIt) {
            if (!isIt) {
                v.pull({ evenIfNewer: true });
            }
        });
        
        // Save the remote when successfully pushed the new version
        v.on('push', function(success) {
            if (success) {
                this.save();
            }
        }.bind(this));
        
        return v;
    };
    
    this.fetch = options.fetch || function fetch() { throw new Error('Not implemented'); };
    this.push = options.push || function push() { throw new Error('Not implementd'); };

    this.load = function load() {
        if (this.cache.mustRevalidate()) {
            
            if (firstTimeLoad)
                this.isLoading(true);
            else
                this.isSyncing(true);
            
            var promise = this.fetch()
            .then(function (serverData) {
                this.data.model.updateWith(serverData);
                this.isLoading(false);
                this.isSyncing(false);
                this.cache.latest = new Date();
                return this.data;
            }.bind(this));
            
            // First time, blocking load:
            // it returns when the load returns
            if (firstTimeLoad) {
                firstTimeLoad = false;
                return promise;
            }
            else {
                // Background load: is loading still
                // but we have cached data so we use
                // that for now. If anything new from outside
                // versions will get notified with isObsolete()
                return Promise.resolve(this.data);
            }
        }
        else {
            // Return cached data, no need to load again for now.
            return Promise.resolve(this.data);
        }
    };

    this.save = function save() {
        this.isSaving(true);
        
        // Preserve the timestamp after being saved
        // to avoid false 'obsolete' warnings with
        // the version that created the new original
        var ts = this.data.model.dataTimestamp();
        
        return this.push()
        .then(function (serverData) {
            this.data.model.updateWith(serverData);
            this.data.model.dataTimestamp(ts);

            this.isSaving(false);
            this.cache.latest = new Date();
            return this.data;
        }.bind(this));
    };
}

module.exports = RemoteModel;

},{"../utils/CacheControl":69,"../utils/ModelVersion":72,"knockout":false}],74:[function(require,module,exports){
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

},{}],75:[function(require,module,exports){
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

},{}],76:[function(require,module,exports){
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

},{"../models/User":61}],77:[function(require,module,exports){
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
},{}],78:[function(require,module,exports){
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

},{}],79:[function(require,module,exports){
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

},{}],80:[function(require,module,exports){
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

},{}],81:[function(require,module,exports){
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

},{}],82:[function(require,module,exports){
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

},{}],83:[function(require,module,exports){
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

},{"../escapeSelector":80}],84:[function(require,module,exports){
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

},{"./dependencies":86}],85:[function(require,module,exports){
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

},{"../escapeRegExp":79,"./sanitizeUrl":91}],86:[function(require,module,exports){
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

},{}],87:[function(require,module,exports){
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

},{"../getUrlQuery":81,"./sanitizeUrl":91}],88:[function(require,module,exports){
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

},{"./DomItemsManager":83,"./Shell":84,"./absolutizeUrl":85,"./dependencies":86,"./loader":89,"./parseUrl":90,"events":false}],89:[function(require,module,exports){
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

},{}],90:[function(require,module,exports){
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
},{"../escapeRegExp":79,"../getUrlQuery":81}],91:[function(require,module,exports){
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
},{}],92:[function(require,module,exports){
/** 
    AppModel extension,
    focused on the Account related APIs:
    - login
    - logout
    - signup
**/
'use strict';

var localforage = require('localforage');

exports.plugIn = function (AppModel) {
    /**
        Try to perform an automatic login if there is a local
        copy of credentials to use on that,
        calling the login method that save the updated
        data and profile.
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

    /**
        Performs a login attempt with the API by using
        the provided credentials.
    **/
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
                alu: logged.userID,
                alk: logged.authKey
            };

            // async local save, don't wait
            localforage.setItem('credentials', {
                userID: logged.userID,
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

    /**
        Performs a logout, removing cached credentials
        and profile so the app can be filled up with
        new user information.
        It calls to the API logout call too, to remove
        any server-side session and notification
        (removes the cookie too, for browser environment
        that may use it).
    **/
    // FUTURE: TOREVIEW if the /logout call can be removed.
    // TODO: must remove all the locally saved/cached data
    // related to the user?
    AppModel.prototype.logout = function logout() {

        // Local app close session
        this.rest.extraHeaders = null;
        localforage.removeItem('credentials');
        localforage.removeItem('profile');

        // Don't need to wait the result of the REST operation
        this.rest.post('logout');

        return Promise.resolve();
    };

    /**
        Attempts to create a user account, getting logged
        if successfully like when doing a login call.
    **/
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
                alu: logged.userID,
                alk: logged.authKey
            };

            // async local save, don't wait
            localforage.setItem('credentials', {
                userID: logged.userID,
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
};

},{"localforage":false}],93:[function(require,module,exports){
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
},{"../models/CalendarEvent":45,"../utils/apiHelper":77}],94:[function(require,module,exports){
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

},{}],95:[function(require,module,exports){
/** Calendar Syncing app model
**/
'use strict';

var ko = require('knockout'),
    CalendarSyncing = require('../models/CalendarSyncing'),
    RemoteModel = require('../utils/RemoteModel');

exports.create = function create(appModel) {
    var rem = new RemoteModel({
        data: new CalendarSyncing(),
        ttl: { minutes: 1 },
        fetch: function fetch() {
            return appModel.rest.get('calendar-syncing');
        },
        push: function push() {
            return appModel.rest.put('calendar-syncing', this.data.model.toPlainObject());
        }
    });
    
    // Extending with the special API method 'resetExportUrl'
    rem.isReseting = ko.observable(false);
    rem.resetExportUrl = function resetExportUrl() {
        
        rem.isReseting(true);

        return appModel.rest.post('calendar-syncing/reset-export-url')
        .then(function(updatedSyncSettings) {
            // Updating the cached data
            rem.data.model.updateWith(updatedSyncSettings);
            rem.isReseting(false);

            return updatedSyncSettings;
        });
    };

    return rem;
};

},{"../models/CalendarSyncing":47,"../utils/RemoteModel":73,"knockout":false}],96:[function(require,module,exports){
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
    
    this.schedulingPreferences = require('./AppModel.schedulingPreferences').create(this);
    this.calendarSyncing = require('./AppModel.calendarSyncing').create(this);
    this.simplifiedWeeklySchedule = require('./AppModel.simplifiedWeeklySchedule').create(this);
}

require('./AppModel-account').plugIn(AppModel);

/** Initialize and wait for anything up **/
AppModel.prototype.init = function init() {
    
    // NOTE: URL to be updated
    this.rest = new Rest('http://dev.loconomics.com/api/v1/en-US/');
    //this.rest = new Rest('http://localhost/source/api/v1/en-US/');
    
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

},{"../models/Model":54,"../models/User":61,"../utils/Rest":74,"./AppModel-account":92,"./AppModel-events":93,"./AppModel-userJobProfile":94,"./AppModel.calendarSyncing":95,"./AppModel.schedulingPreferences":97,"./AppModel.simplifiedWeeklySchedule":98,"knockout":false,"localforage":false}],97:[function(require,module,exports){
/**
**/
'use strict';

var SchedulingPreferences = require('../models/SchedulingPreferences');

var RemoteModel = require('../utils/RemoteModel');

exports.create = function create(appModel) {
    return new RemoteModel({
        data: new SchedulingPreferences(),
        ttl: { minutes: 1 },
        fetch: function fetch() {
            return appModel.rest.get('scheduling-preferences');
        },
        push: function push() {
            return appModel.rest.put('scheduling-preferences', this.data.model.toPlainObject());
        }
    });
};

},{"../models/SchedulingPreferences":57,"../utils/RemoteModel":73}],98:[function(require,module,exports){
/**
**/
'use strict';

var SimplifiedWeeklySchedule = require('../models/SimplifiedWeeklySchedule'),
    RemoteModel = require('../utils/RemoteModel'),
    moment = require('moment');

// The slot size is fixed to 15 minutes by default.
// NOTE: currently, the API only allows 15 minutes slots,
// being that implicit, but part of the code is ready for explicit slotSize.
var defaultSlotSize = 15;
// A list of week day properties names allowed
// to be part of the objects describing weekly schedule
// (simplified or complete/slot based)
// Just lowecased english names
var weekDayProperties = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

exports.create = function create(appModel) {
    return new RemoteModel({
        data: new SimplifiedWeeklySchedule(),
        ttl: { minutes: 1 },
        fetch: function fetch() {
            return appModel.rest.get('availability/weekly-schedule')
            .then(fromWeeklySchedule);
        },
        push: function push() {
            var plainData = {
                'all-time': false,
                'json-data': {}
            };
            if (this.data.isAllTime() === true) {
                plainData['all-time'] = true;
            }
            else {
                plainData['json-data'] = JSON.stringify(toWeeklySchedule(this.data.model.toPlainObject(true)));
            }

            return appModel.rest.put('availability/weekly-schedule', plainData)
            .then(fromWeeklySchedule);
        }
    });
};

function fromWeeklySchedule(weeklySchedule) {
    
    // New simplified object, as a plain object with
    // weekdays properties and from-to properties like:
    // { sunday: { from: 0, to: 60 } }
    // Since this is expected to be consumed by fetch-push
    // operations, and later by an 'model.updateWith' operation,
    // so plain is simple and better on performance; can be
    // converted easily to the SimplifiedWeeklySchedule object.
    var simpleWS = {};
    
    // Only supports 'available' status with default 'unavailable'
    if (weeklySchedule.defaultStatus !== 'unavailable' ||
        weeklySchedule.status !== 'available') {
        throw {
            name: 'input-format',
            message: 'Weekly schedule, given statuses not supported, status: ' +
            weeklySchedule.status + ', defaultStatus: ' + 
            weeklySchedule.defaultStatus
          };
    }
    
    // given slotSize or default
    var slotSize = weeklySchedule.slotSize || defaultSlotSize;

    // Read slots per week-day ({ slots: { "sunday": [] } })
    Object.keys(weeklySchedule.slots)
    .forEach(function(weekday) {
        
        // Verify is a weekday property, or exit early
        if (weekDayProperties.indexOf(weekday) === -1) {
            return;
        }
        
        var dayslots = weeklySchedule.slots[weekday];
        
        // We get the first available slot and the last consecutive
        // to make the range
        var from = null,
            to = null,
            previous = null;

        // times are ordered in ascending
        // and with format "00:00:00" that we convert to minutes
        // (enough precision for simplified weekly schedule)
        // using moment.duration
        // NOTE: using 'some' rather than 'forEach' to be able
        // to exit early from the iteration by returning 'true'
        // when the end is reached.
        dayslots.some(function(slot) {
            var minutes = moment.duration(slot).asMinutes() |0;
            // We have not still a 'from' time:
            if (from === null) {
                from = minutes;
                previous = minutes;
            }
            else {
                // We have a beggining, check if this is consecutive
                // to previous, by checking previous plus slotSize
                if (previous + slotSize === minutes) {
                    // New end
                    to = minutes;
                    // Next iteration
                    previous = minutes;
                }
                else {
                    // No consecutive, we already has a range, any
                    // additional slot is discarded, out of the
                    // precision of the simplified weekly schedule,
                    // so we can go out the iteration:
                    return true;
                    
                    // NOTE: If in a future a more complete schedule
                    // need to be wroten using multiple ranges rather
                    // individual slots, this is the place to continue
                    // coding, populating an array of [{from, to}] :-)
                }
            }
        });
        
        // Slots checked, check the result
        if (from !== null) {
            
            var simpleDay = {
                from: from,
                to: 0
            };
            simpleWS[weekday] = simpleDay;

            // We have a range!
            if (to !== null) {
                // and has an end!
                // add the slot size to the ending
                simpleDay.to = to + slotSize;
            }
            else {
                // smaller range, just one slot,
                // add the slot size to the begining
                simpleDay.to = from + slotSize;
            }
        }
    });
    
    // Done!
    return simpleWS;
}

/**
    Pass in a plain object, not a model,
    getting an object suitable for the API endpoint.
**/
function toWeeklySchedule(simplifiedWeeklySchedule) {

    var slotSize = defaultSlotSize;
    
    // It's build with 'available' as explicit status:
    var weeklySchedule = {
        status: 'available',
        defaultAvailability: 'unavailable',
        slots: {},
        slotSize: slotSize
    };

    // Per weekday
    Object.keys(simplifiedWeeklySchedule)
    .forEach(function(weekday) {

        // Verify is a weekday property, or exit early
        if (weekDayProperties.indexOf(weekday) === -1) {
            return;
        }

        var simpleDay = simplifiedWeeklySchedule[weekday];

        // We need to expand the simplified time ranges 
        // in slots of the slotSize
        // The end time will be excluded, since slots
        // define only the start, being implicit the slotSize.
        var from = simpleDay.from,
            to = simpleDay.to;

        // Create the slot array
        weeklySchedule.slots[weekday] = [];

        // Integrity verification
        if (to > from) {
            // Iterate by the slotSize until we reach
            // the end, not including the 'to' since
            // slots indicate only the start of the slot
            // that is assumed to fill a slotSize starting
            // on that slot-time
            var previous = from;
            while (previous < to) {
                weeklySchedule.slots[weekday].push(minutesToTimeString(previous));
                previous += slotSize;
            }
        }
    });

    // Done!
    return weeklySchedule;
}

/**
    internal utility function 'to string with two digits almost'
**/
function twoDigits(n) {
    return Math.floor(n / 10) + '' + n % 10;
}

/**
    Convert a number of minutes
    in a string like: 00:00:00 (hours:minutes:seconds)
**/
function minutesToTimeString(minutes) {
    var d = moment.duration(minutes, 'minutes'),
        h = d.hours(),
        m = d.minutes(),
        s = d.seconds();
    
    return (
        twoDigits(h) + ':' +
        twoDigits(m) + ':' +
        twoDigits(s)
    );
}

},{"../models/SimplifiedWeeklySchedule":59,"../utils/RemoteModel":73,"moment":false}],99:[function(require,module,exports){
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

},{"knockout":false}],100:[function(require,module,exports){
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

},{"../models/Model":54,"knockout":false}],101:[function(require,module,exports){
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

},{"../models/Model":54,"./NavAction":100,"knockout":false}]},{},[37])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvbm9kZV9tb2R1bGVzL251bWVyYWwvbnVtZXJhbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYWNjb3VudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYXBwb2ludG1lbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2Jvb2tpbmdDb25maXJtYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2NhbGVuZGFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9jYWxlbmRhclN5bmNpbmcuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2NsaWVudEVkaXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2NsaWVudHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2Ntcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY29udGFjdEZvcm0uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2NvbnRhY3RJbmZvLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9jb252ZXJzYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2RhdGV0aW1lUGlja2VyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9mYXFzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9mZWVkYmFjay5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvZmVlZGJhY2tGb3JtLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9ob21lLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9pbmJveC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvaW5kZXguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2pvYnRpdGxlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvbGVhcm5Nb3JlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9sb2NhdGlvbkVkaXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2xvY2F0aW9ucy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvbG9naW4uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2xvZ291dC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvb25ib2FyZGluZ0NvbXBsZXRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9vbmJvYXJkaW5nSG9tZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvb25ib2FyZGluZ1Bvc2l0aW9ucy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvc2NoZWR1bGluZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvc2NoZWR1bGluZ1ByZWZlcmVuY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9zZXJ2aWNlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvc2lnbnVwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy90ZXh0RWRpdG9yLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYXBwLWNvbXBvbmVudHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hcHAtbmF2YmFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYXBwLmFjdGl2aXRpZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hcHAuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hcHAuc2hlbGwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9jb21wb25lbnRzL0FjdGl2aXR5LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvY29tcG9uZW50cy9EYXRlUGlja2VyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvY29tcG9uZW50cy9TbWFydE5hdkJhci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2xvY2FsZXMvZW4tVVMtTEMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQXBwb2ludG1lbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQm9va2luZ1N1bW1hcnkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQ2FsZW5kYXJFdmVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9DYWxlbmRhclNsb3QuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQ2FsZW5kYXJTeW5jaW5nLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0NsaWVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9HZXRNb3JlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0xpc3RWaWV3SXRlbS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9Mb2NhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9NYWlsRm9sZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL01lc3NhZ2UuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvTW9kZWwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvUGVyZm9ybWFuY2VTdW1tYXJ5LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1Bvc2l0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1NjaGVkdWxpbmdQcmVmZXJlbmNlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9TZXJ2aWNlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1NpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9VcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9Vc2VyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdGVzdGRhdGEvY2FsZW5kYXJBcHBvaW50bWVudHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9jYWxlbmRhclNsb3RzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdGVzdGRhdGEvY2xpZW50cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3Rlc3RkYXRhL2xvY2F0aW9ucy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3Rlc3RkYXRhL21lc3NhZ2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdGVzdGRhdGEvc2VydmljZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS90aW1lU2xvdHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9DYWNoZUNvbnRyb2wuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9GdW5jdGlvbi5wcm90b3R5cGUuX2RlbGF5ZWQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9GdW5jdGlvbi5wcm90b3R5cGUuX2luaGVyaXRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvTW9kZWxWZXJzaW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvUmVtb3RlTW9kZWwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9SZXN0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvVGltZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL2FjY2Vzc0NvbnRyb2wuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9hcGlIZWxwZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9ib290a25vY2tCaW5kaW5nSGVscGVycy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL2VzY2FwZVJlZ0V4cC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL2VzY2FwZVNlbGVjdG9yLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvZ2V0VXJsUXVlcnkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9qc1Byb3BlcnRpZXNUb29scy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL0RvbUl0ZW1zTWFuYWdlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL1NoZWxsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvc2hlbGwvYWJzb2x1dGl6ZVVybC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL2RlcGVuZGVuY2llcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL2hhc2hiYW5nSGlzdG9yeS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL2luZGV4LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvc2hlbGwvbG9hZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvc2hlbGwvcGFyc2VVcmwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9zYW5pdGl6ZVVybC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwtYWNjb3VudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwtZXZlbnRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9BcHBNb2RlbC11c2VySm9iUHJvZmlsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwuY2FsZW5kYXJTeW5jaW5nLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9BcHBNb2RlbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwuc2NoZWR1bGluZ1ByZWZlcmVuY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9BcHBNb2RlbC5zaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0Zvcm1DcmVkZW50aWFscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvTmF2QWN0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9OYXZCYXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdnFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4cEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogbnVtZXJhbC5qc1xuICogdmVyc2lvbiA6IDEuNS4zXG4gKiBhdXRob3IgOiBBZGFtIERyYXBlclxuICogbGljZW5zZSA6IE1JVFxuICogaHR0cDovL2FkYW13ZHJhcGVyLmdpdGh1Yi5jb20vTnVtZXJhbC1qcy9cbiAqL1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBDb25zdGFudHNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICB2YXIgbnVtZXJhbCxcbiAgICAgICAgVkVSU0lPTiA9ICcxLjUuMycsXG4gICAgICAgIC8vIGludGVybmFsIHN0b3JhZ2UgZm9yIGxhbmd1YWdlIGNvbmZpZyBmaWxlc1xuICAgICAgICBsYW5ndWFnZXMgPSB7fSxcbiAgICAgICAgY3VycmVudExhbmd1YWdlID0gJ2VuJyxcbiAgICAgICAgemVyb0Zvcm1hdCA9IG51bGwsXG4gICAgICAgIGRlZmF1bHRGb3JtYXQgPSAnMCwwJyxcbiAgICAgICAgLy8gY2hlY2sgZm9yIG5vZGVKU1xuICAgICAgICBoYXNNb2R1bGUgPSAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpO1xuXG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIENvbnN0cnVjdG9yc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4gICAgLy8gTnVtZXJhbCBwcm90b3R5cGUgb2JqZWN0XG4gICAgZnVuY3Rpb24gTnVtZXJhbCAobnVtYmVyKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gbnVtYmVyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEltcGxlbWVudGF0aW9uIG9mIHRvRml4ZWQoKSB0aGF0IHRyZWF0cyBmbG9hdHMgbW9yZSBsaWtlIGRlY2ltYWxzXG4gICAgICpcbiAgICAgKiBGaXhlcyBiaW5hcnkgcm91bmRpbmcgaXNzdWVzIChlZy4gKDAuNjE1KS50b0ZpeGVkKDIpID09PSAnMC42MScpIHRoYXQgcHJlc2VudFxuICAgICAqIHByb2JsZW1zIGZvciBhY2NvdW50aW5nLSBhbmQgZmluYW5jZS1yZWxhdGVkIHNvZnR3YXJlLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRvRml4ZWQgKHZhbHVlLCBwcmVjaXNpb24sIHJvdW5kaW5nRnVuY3Rpb24sIG9wdGlvbmFscykge1xuICAgICAgICB2YXIgcG93ZXIgPSBNYXRoLnBvdygxMCwgcHJlY2lzaW9uKSxcbiAgICAgICAgICAgIG9wdGlvbmFsc1JlZ0V4cCxcbiAgICAgICAgICAgIG91dHB1dDtcbiAgICAgICAgICAgIFxuICAgICAgICAvL3JvdW5kaW5nRnVuY3Rpb24gPSAocm91bmRpbmdGdW5jdGlvbiAhPT0gdW5kZWZpbmVkID8gcm91bmRpbmdGdW5jdGlvbiA6IE1hdGgucm91bmQpO1xuICAgICAgICAvLyBNdWx0aXBseSB1cCBieSBwcmVjaXNpb24sIHJvdW5kIGFjY3VyYXRlbHksIHRoZW4gZGl2aWRlIGFuZCB1c2UgbmF0aXZlIHRvRml4ZWQoKTpcbiAgICAgICAgb3V0cHV0ID0gKHJvdW5kaW5nRnVuY3Rpb24odmFsdWUgKiBwb3dlcikgLyBwb3dlcikudG9GaXhlZChwcmVjaXNpb24pO1xuXG4gICAgICAgIGlmIChvcHRpb25hbHMpIHtcbiAgICAgICAgICAgIG9wdGlvbmFsc1JlZ0V4cCA9IG5ldyBSZWdFeHAoJzB7MSwnICsgb3B0aW9uYWxzICsgJ30kJyk7XG4gICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZShvcHRpb25hbHNSZWdFeHAsICcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBGb3JtYXR0aW5nXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgLy8gZGV0ZXJtaW5lIHdoYXQgdHlwZSBvZiBmb3JtYXR0aW5nIHdlIG5lZWQgdG8gZG9cbiAgICBmdW5jdGlvbiBmb3JtYXROdW1lcmFsIChuLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIG91dHB1dDtcblxuICAgICAgICAvLyBmaWd1cmUgb3V0IHdoYXQga2luZCBvZiBmb3JtYXQgd2UgYXJlIGRlYWxpbmcgd2l0aFxuICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyQnKSA+IC0xKSB7IC8vIGN1cnJlbmN5ISEhISFcbiAgICAgICAgICAgIG91dHB1dCA9IGZvcm1hdEN1cnJlbmN5KG4sIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0LmluZGV4T2YoJyUnKSA+IC0xKSB7IC8vIHBlcmNlbnRhZ2VcbiAgICAgICAgICAgIG91dHB1dCA9IGZvcm1hdFBlcmNlbnRhZ2UobiwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgfSBlbHNlIGlmIChmb3JtYXQuaW5kZXhPZignOicpID4gLTEpIHsgLy8gdGltZVxuICAgICAgICAgICAgb3V0cHV0ID0gZm9ybWF0VGltZShuLCBmb3JtYXQpO1xuICAgICAgICB9IGVsc2UgeyAvLyBwbGFpbiBvbCcgbnVtYmVycyBvciBieXRlc1xuICAgICAgICAgICAgb3V0cHV0ID0gZm9ybWF0TnVtYmVyKG4uX3ZhbHVlLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmV0dXJuIHN0cmluZ1xuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIC8vIHJldmVydCB0byBudW1iZXJcbiAgICBmdW5jdGlvbiB1bmZvcm1hdE51bWVyYWwgKG4sIHN0cmluZykge1xuICAgICAgICB2YXIgc3RyaW5nT3JpZ2luYWwgPSBzdHJpbmcsXG4gICAgICAgICAgICB0aG91c2FuZFJlZ0V4cCxcbiAgICAgICAgICAgIG1pbGxpb25SZWdFeHAsXG4gICAgICAgICAgICBiaWxsaW9uUmVnRXhwLFxuICAgICAgICAgICAgdHJpbGxpb25SZWdFeHAsXG4gICAgICAgICAgICBzdWZmaXhlcyA9IFsnS0InLCAnTUInLCAnR0InLCAnVEInLCAnUEInLCAnRUInLCAnWkInLCAnWUInXSxcbiAgICAgICAgICAgIGJ5dGVzTXVsdGlwbGllciA9IGZhbHNlLFxuICAgICAgICAgICAgcG93ZXI7XG5cbiAgICAgICAgaWYgKHN0cmluZy5pbmRleE9mKCc6JykgPiAtMSkge1xuICAgICAgICAgICAgbi5fdmFsdWUgPSB1bmZvcm1hdFRpbWUoc3RyaW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChzdHJpbmcgPT09IHplcm9Gb3JtYXQpIHtcbiAgICAgICAgICAgICAgICBuLl92YWx1ZSA9IDA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5kZWxpbWl0ZXJzLmRlY2ltYWwgIT09ICcuJykge1xuICAgICAgICAgICAgICAgICAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZSgvXFwuL2csJycpLnJlcGxhY2UobGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uZGVsaW1pdGVycy5kZWNpbWFsLCAnLicpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHNlZSBpZiBhYmJyZXZpYXRpb25zIGFyZSB0aGVyZSBzbyB0aGF0IHdlIGNhbiBtdWx0aXBseSB0byB0aGUgY29ycmVjdCBudW1iZXJcbiAgICAgICAgICAgICAgICB0aG91c2FuZFJlZ0V4cCA9IG5ldyBSZWdFeHAoJ1teYS16QS1aXScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLnRob3VzYW5kICsgJyg/OlxcXFwpfChcXFxcJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCArICcpPyg/OlxcXFwpKT8pPyQnKTtcbiAgICAgICAgICAgICAgICBtaWxsaW9uUmVnRXhwID0gbmV3IFJlZ0V4cCgnW15hLXpBLVpdJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMubWlsbGlvbiArICcoPzpcXFxcKXwoXFxcXCcgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyAnKT8oPzpcXFxcKSk/KT8kJyk7XG4gICAgICAgICAgICAgICAgYmlsbGlvblJlZ0V4cCA9IG5ldyBSZWdFeHAoJ1teYS16QS1aXScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLmJpbGxpb24gKyAnKD86XFxcXCl8KFxcXFwnICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgJyk/KD86XFxcXCkpPyk/JCcpO1xuICAgICAgICAgICAgICAgIHRyaWxsaW9uUmVnRXhwID0gbmV3IFJlZ0V4cCgnW15hLXpBLVpdJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMudHJpbGxpb24gKyAnKD86XFxcXCl8KFxcXFwnICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgJyk/KD86XFxcXCkpPyk/JCcpO1xuXG4gICAgICAgICAgICAgICAgLy8gc2VlIGlmIGJ5dGVzIGFyZSB0aGVyZSBzbyB0aGF0IHdlIGNhbiBtdWx0aXBseSB0byB0aGUgY29ycmVjdCBudW1iZXJcbiAgICAgICAgICAgICAgICBmb3IgKHBvd2VyID0gMDsgcG93ZXIgPD0gc3VmZml4ZXMubGVuZ3RoOyBwb3dlcisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGVzTXVsdGlwbGllciA9IChzdHJpbmcuaW5kZXhPZihzdWZmaXhlc1twb3dlcl0pID4gLTEpID8gTWF0aC5wb3coMTAyNCwgcG93ZXIgKyAxKSA6IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChieXRlc011bHRpcGxpZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gZG8gc29tZSBtYXRoIHRvIGNyZWF0ZSBvdXIgbnVtYmVyXG4gICAgICAgICAgICAgICAgbi5fdmFsdWUgPSAoKGJ5dGVzTXVsdGlwbGllcikgPyBieXRlc011bHRpcGxpZXIgOiAxKSAqICgoc3RyaW5nT3JpZ2luYWwubWF0Y2godGhvdXNhbmRSZWdFeHApKSA/IE1hdGgucG93KDEwLCAzKSA6IDEpICogKChzdHJpbmdPcmlnaW5hbC5tYXRjaChtaWxsaW9uUmVnRXhwKSkgPyBNYXRoLnBvdygxMCwgNikgOiAxKSAqICgoc3RyaW5nT3JpZ2luYWwubWF0Y2goYmlsbGlvblJlZ0V4cCkpID8gTWF0aC5wb3coMTAsIDkpIDogMSkgKiAoKHN0cmluZ09yaWdpbmFsLm1hdGNoKHRyaWxsaW9uUmVnRXhwKSkgPyBNYXRoLnBvdygxMCwgMTIpIDogMSkgKiAoKHN0cmluZy5pbmRleE9mKCclJykgPiAtMSkgPyAwLjAxIDogMSkgKiAoKChzdHJpbmcuc3BsaXQoJy0nKS5sZW5ndGggKyBNYXRoLm1pbihzdHJpbmcuc3BsaXQoJygnKS5sZW5ndGgtMSwgc3RyaW5nLnNwbGl0KCcpJykubGVuZ3RoLTEpKSAlIDIpPyAxOiAtMSkgKiBOdW1iZXIoc3RyaW5nLnJlcGxhY2UoL1teMC05XFwuXSsvZywgJycpKTtcblxuICAgICAgICAgICAgICAgIC8vIHJvdW5kIGlmIHdlIGFyZSB0YWxraW5nIGFib3V0IGJ5dGVzXG4gICAgICAgICAgICAgICAgbi5fdmFsdWUgPSAoYnl0ZXNNdWx0aXBsaWVyKSA/IE1hdGguY2VpbChuLl92YWx1ZSkgOiBuLl92YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbi5fdmFsdWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0Q3VycmVuY3kgKG4sIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbikge1xuICAgICAgICB2YXIgc3ltYm9sSW5kZXggPSBmb3JtYXQuaW5kZXhPZignJCcpLFxuICAgICAgICAgICAgb3BlblBhcmVuSW5kZXggPSBmb3JtYXQuaW5kZXhPZignKCcpLFxuICAgICAgICAgICAgbWludXNTaWduSW5kZXggPSBmb3JtYXQuaW5kZXhPZignLScpLFxuICAgICAgICAgICAgc3BhY2UgPSAnJyxcbiAgICAgICAgICAgIHNwbGljZUluZGV4LFxuICAgICAgICAgICAgb3V0cHV0O1xuXG4gICAgICAgIC8vIGNoZWNrIGZvciBzcGFjZSBiZWZvcmUgb3IgYWZ0ZXIgY3VycmVuY3lcbiAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcgJCcpID4gLTEpIHtcbiAgICAgICAgICAgIHNwYWNlID0gJyAnO1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyAkJywgJycpO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdC5pbmRleE9mKCckICcpID4gLTEpIHtcbiAgICAgICAgICAgIHNwYWNlID0gJyAnO1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyQgJywgJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyQnLCAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBmb3JtYXQgdGhlIG51bWJlclxuICAgICAgICBvdXRwdXQgPSBmb3JtYXROdW1iZXIobi5fdmFsdWUsIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbik7XG5cbiAgICAgICAgLy8gcG9zaXRpb24gdGhlIHN5bWJvbFxuICAgICAgICBpZiAoc3ltYm9sSW5kZXggPD0gMSkge1xuICAgICAgICAgICAgaWYgKG91dHB1dC5pbmRleE9mKCcoJykgPiAtMSB8fCBvdXRwdXQuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQuc3BsaXQoJycpO1xuICAgICAgICAgICAgICAgIHNwbGljZUluZGV4ID0gMTtcbiAgICAgICAgICAgICAgICBpZiAoc3ltYm9sSW5kZXggPCBvcGVuUGFyZW5JbmRleCB8fCBzeW1ib2xJbmRleCA8IG1pbnVzU2lnbkluZGV4KXtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHN5bWJvbCBhcHBlYXJzIGJlZm9yZSB0aGUgXCIoXCIgb3IgXCItXCJcbiAgICAgICAgICAgICAgICAgICAgc3BsaWNlSW5kZXggPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvdXRwdXQuc3BsaWNlKHNwbGljZUluZGV4LCAwLCBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyBzcGFjZSk7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LmpvaW4oJycpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyBzcGFjZSArIG91dHB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChvdXRwdXQuaW5kZXhPZignKScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQuc3BsaXQoJycpO1xuICAgICAgICAgICAgICAgIG91dHB1dC5zcGxpY2UoLTEsIDAsIHNwYWNlICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sKTtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQuam9pbignJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dCArIHNwYWNlICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXRQZXJjZW50YWdlIChuLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIHNwYWNlID0gJycsXG4gICAgICAgICAgICBvdXRwdXQsXG4gICAgICAgICAgICB2YWx1ZSA9IG4uX3ZhbHVlICogMTAwO1xuXG4gICAgICAgIC8vIGNoZWNrIGZvciBzcGFjZSBiZWZvcmUgJVxuICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyAlJykgPiAtMSkge1xuICAgICAgICAgICAgc3BhY2UgPSAnICc7XG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnICUnLCAnJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnJScsICcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG91dHB1dCA9IGZvcm1hdE51bWJlcih2YWx1ZSwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChvdXRwdXQuaW5kZXhPZignKScpID4gLTEgKSB7XG4gICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQuc3BsaXQoJycpO1xuICAgICAgICAgICAgb3V0cHV0LnNwbGljZSgtMSwgMCwgc3BhY2UgKyAnJScpO1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LmpvaW4oJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgc3BhY2UgKyAnJSc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZvcm1hdFRpbWUgKG4pIHtcbiAgICAgICAgdmFyIGhvdXJzID0gTWF0aC5mbG9vcihuLl92YWx1ZS82MC82MCksXG4gICAgICAgICAgICBtaW51dGVzID0gTWF0aC5mbG9vcigobi5fdmFsdWUgLSAoaG91cnMgKiA2MCAqIDYwKSkvNjApLFxuICAgICAgICAgICAgc2Vjb25kcyA9IE1hdGgucm91bmQobi5fdmFsdWUgLSAoaG91cnMgKiA2MCAqIDYwKSAtIChtaW51dGVzICogNjApKTtcbiAgICAgICAgcmV0dXJuIGhvdXJzICsgJzonICsgKChtaW51dGVzIDwgMTApID8gJzAnICsgbWludXRlcyA6IG1pbnV0ZXMpICsgJzonICsgKChzZWNvbmRzIDwgMTApID8gJzAnICsgc2Vjb25kcyA6IHNlY29uZHMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVuZm9ybWF0VGltZSAoc3RyaW5nKSB7XG4gICAgICAgIHZhciB0aW1lQXJyYXkgPSBzdHJpbmcuc3BsaXQoJzonKSxcbiAgICAgICAgICAgIHNlY29uZHMgPSAwO1xuICAgICAgICAvLyB0dXJuIGhvdXJzIGFuZCBtaW51dGVzIGludG8gc2Vjb25kcyBhbmQgYWRkIHRoZW0gYWxsIHVwXG4gICAgICAgIGlmICh0aW1lQXJyYXkubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICAvLyBob3Vyc1xuICAgICAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgKyAoTnVtYmVyKHRpbWVBcnJheVswXSkgKiA2MCAqIDYwKTtcbiAgICAgICAgICAgIC8vIG1pbnV0ZXNcbiAgICAgICAgICAgIHNlY29uZHMgPSBzZWNvbmRzICsgKE51bWJlcih0aW1lQXJyYXlbMV0pICogNjApO1xuICAgICAgICAgICAgLy8gc2Vjb25kc1xuICAgICAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgKyBOdW1iZXIodGltZUFycmF5WzJdKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aW1lQXJyYXkubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICAvLyBtaW51dGVzXG4gICAgICAgICAgICBzZWNvbmRzID0gc2Vjb25kcyArIChOdW1iZXIodGltZUFycmF5WzBdKSAqIDYwKTtcbiAgICAgICAgICAgIC8vIHNlY29uZHNcbiAgICAgICAgICAgIHNlY29uZHMgPSBzZWNvbmRzICsgTnVtYmVyKHRpbWVBcnJheVsxXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE51bWJlcihzZWNvbmRzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXROdW1iZXIgKHZhbHVlLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIG5lZ1AgPSBmYWxzZSxcbiAgICAgICAgICAgIHNpZ25lZCA9IGZhbHNlLFxuICAgICAgICAgICAgb3B0RGVjID0gZmFsc2UsXG4gICAgICAgICAgICBhYmJyID0gJycsXG4gICAgICAgICAgICBhYmJySyA9IGZhbHNlLCAvLyBmb3JjZSBhYmJyZXZpYXRpb24gdG8gdGhvdXNhbmRzXG4gICAgICAgICAgICBhYmJyTSA9IGZhbHNlLCAvLyBmb3JjZSBhYmJyZXZpYXRpb24gdG8gbWlsbGlvbnNcbiAgICAgICAgICAgIGFiYnJCID0gZmFsc2UsIC8vIGZvcmNlIGFiYnJldmlhdGlvbiB0byBiaWxsaW9uc1xuICAgICAgICAgICAgYWJiclQgPSBmYWxzZSwgLy8gZm9yY2UgYWJicmV2aWF0aW9uIHRvIHRyaWxsaW9uc1xuICAgICAgICAgICAgYWJickZvcmNlID0gZmFsc2UsIC8vIGZvcmNlIGFiYnJldmlhdGlvblxuICAgICAgICAgICAgYnl0ZXMgPSAnJyxcbiAgICAgICAgICAgIG9yZCA9ICcnLFxuICAgICAgICAgICAgYWJzID0gTWF0aC5hYnModmFsdWUpLFxuICAgICAgICAgICAgc3VmZml4ZXMgPSBbJ0InLCAnS0InLCAnTUInLCAnR0InLCAnVEInLCAnUEInLCAnRUInLCAnWkInLCAnWUInXSxcbiAgICAgICAgICAgIG1pbixcbiAgICAgICAgICAgIG1heCxcbiAgICAgICAgICAgIHBvd2VyLFxuICAgICAgICAgICAgdyxcbiAgICAgICAgICAgIHByZWNpc2lvbixcbiAgICAgICAgICAgIHRob3VzYW5kcyxcbiAgICAgICAgICAgIGQgPSAnJyxcbiAgICAgICAgICAgIG5lZyA9IGZhbHNlO1xuXG4gICAgICAgIC8vIGNoZWNrIGlmIG51bWJlciBpcyB6ZXJvIGFuZCBhIGN1c3RvbSB6ZXJvIGZvcm1hdCBoYXMgYmVlbiBzZXRcbiAgICAgICAgaWYgKHZhbHVlID09PSAwICYmIHplcm9Gb3JtYXQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB6ZXJvRm9ybWF0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gc2VlIGlmIHdlIHNob3VsZCB1c2UgcGFyZW50aGVzZXMgZm9yIG5lZ2F0aXZlIG51bWJlciBvciBpZiB3ZSBzaG91bGQgcHJlZml4IHdpdGggYSBzaWduXG4gICAgICAgICAgICAvLyBpZiBib3RoIGFyZSBwcmVzZW50IHdlIGRlZmF1bHQgdG8gcGFyZW50aGVzZXNcbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignKCcpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBuZWdQID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQuc2xpY2UoMSwgLTEpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmb3JtYXQuaW5kZXhPZignKycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBzaWduZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKC9cXCsvZywgJycpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzZWUgaWYgYWJicmV2aWF0aW9uIGlzIHdhbnRlZFxuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCdhJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIGFiYnJldmlhdGlvbiBpcyBzcGVjaWZpZWRcbiAgICAgICAgICAgICAgICBhYmJySyA9IGZvcm1hdC5pbmRleE9mKCdhSycpID49IDA7XG4gICAgICAgICAgICAgICAgYWJick0gPSBmb3JtYXQuaW5kZXhPZignYU0nKSA+PSAwO1xuICAgICAgICAgICAgICAgIGFiYnJCID0gZm9ybWF0LmluZGV4T2YoJ2FCJykgPj0gMDtcbiAgICAgICAgICAgICAgICBhYmJyVCA9IGZvcm1hdC5pbmRleE9mKCdhVCcpID49IDA7XG4gICAgICAgICAgICAgICAgYWJickZvcmNlID0gYWJicksgfHwgYWJick0gfHwgYWJickIgfHwgYWJiclQ7XG5cbiAgICAgICAgICAgICAgICAvLyBjaGVjayBmb3Igc3BhY2UgYmVmb3JlIGFiYnJldmlhdGlvblxuICAgICAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignIGEnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGFiYnIgPSAnICc7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCcgYScsICcnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnYScsICcnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYWJzID49IE1hdGgucG93KDEwLCAxMikgJiYgIWFiYnJGb3JjZSB8fCBhYmJyVCkge1xuICAgICAgICAgICAgICAgICAgICAvLyB0cmlsbGlvblxuICAgICAgICAgICAgICAgICAgICBhYmJyID0gYWJiciArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMudHJpbGxpb247XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgMTIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYWJzIDwgTWF0aC5wb3coMTAsIDEyKSAmJiBhYnMgPj0gTWF0aC5wb3coMTAsIDkpICYmICFhYmJyRm9yY2UgfHwgYWJickIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYmlsbGlvblxuICAgICAgICAgICAgICAgICAgICBhYmJyID0gYWJiciArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMuYmlsbGlvbjtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KDEwLCA5KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFicyA8IE1hdGgucG93KDEwLCA5KSAmJiBhYnMgPj0gTWF0aC5wb3coMTAsIDYpICYmICFhYmJyRm9yY2UgfHwgYWJick0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbWlsbGlvblxuICAgICAgICAgICAgICAgICAgICBhYmJyID0gYWJiciArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMubWlsbGlvbjtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KDEwLCA2KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFicyA8IE1hdGgucG93KDEwLCA2KSAmJiBhYnMgPj0gTWF0aC5wb3coMTAsIDMpICYmICFhYmJyRm9yY2UgfHwgYWJickspIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhvdXNhbmRcbiAgICAgICAgICAgICAgICAgICAgYWJiciA9IGFiYnIgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLnRob3VzYW5kO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gTWF0aC5wb3coMTAsIDMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2VlIGlmIHdlIGFyZSBmb3JtYXR0aW5nIGJ5dGVzXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJ2InKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgZm9yIHNwYWNlIGJlZm9yZVxuICAgICAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignIGInKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGVzID0gJyAnO1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnIGInLCAnJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJ2InLCAnJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yIChwb3dlciA9IDA7IHBvd2VyIDw9IHN1ZmZpeGVzLmxlbmd0aDsgcG93ZXIrKykge1xuICAgICAgICAgICAgICAgICAgICBtaW4gPSBNYXRoLnBvdygxMDI0LCBwb3dlcik7XG4gICAgICAgICAgICAgICAgICAgIG1heCA9IE1hdGgucG93KDEwMjQsIHBvd2VyKzEpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA+PSBtaW4gJiYgdmFsdWUgPCBtYXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ5dGVzID0gYnl0ZXMgKyBzdWZmaXhlc1twb3dlcl07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWluID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBtaW47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2VlIGlmIG9yZGluYWwgaXMgd2FudGVkXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJ28nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgZm9yIHNwYWNlIGJlZm9yZVxuICAgICAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignIG8nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIG9yZCA9ICcgJztcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyBvJywgJycpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCdvJywgJycpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG9yZCA9IG9yZCArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLm9yZGluYWwodmFsdWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJ1suXScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBvcHREZWMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCdbLl0nLCAnLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB3ID0gdmFsdWUudG9TdHJpbmcoKS5zcGxpdCgnLicpWzBdO1xuICAgICAgICAgICAgcHJlY2lzaW9uID0gZm9ybWF0LnNwbGl0KCcuJylbMV07XG4gICAgICAgICAgICB0aG91c2FuZHMgPSBmb3JtYXQuaW5kZXhPZignLCcpO1xuXG4gICAgICAgICAgICBpZiAocHJlY2lzaW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHByZWNpc2lvbi5pbmRleE9mKCdbJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBwcmVjaXNpb24gPSBwcmVjaXNpb24ucmVwbGFjZSgnXScsICcnKTtcbiAgICAgICAgICAgICAgICAgICAgcHJlY2lzaW9uID0gcHJlY2lzaW9uLnNwbGl0KCdbJyk7XG4gICAgICAgICAgICAgICAgICAgIGQgPSB0b0ZpeGVkKHZhbHVlLCAocHJlY2lzaW9uWzBdLmxlbmd0aCArIHByZWNpc2lvblsxXS5sZW5ndGgpLCByb3VuZGluZ0Z1bmN0aW9uLCBwcmVjaXNpb25bMV0ubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkID0gdG9GaXhlZCh2YWx1ZSwgcHJlY2lzaW9uLmxlbmd0aCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdyA9IGQuc3BsaXQoJy4nKVswXTtcblxuICAgICAgICAgICAgICAgIGlmIChkLnNwbGl0KCcuJylbMV0ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGQgPSBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5kZWxpbWl0ZXJzLmRlY2ltYWwgKyBkLnNwbGl0KCcuJylbMV07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZCA9ICcnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChvcHREZWMgJiYgTnVtYmVyKGQuc2xpY2UoMSkpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGQgPSAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHcgPSB0b0ZpeGVkKHZhbHVlLCBudWxsLCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZm9ybWF0IG51bWJlclxuICAgICAgICAgICAgaWYgKHcuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICB3ID0gdy5zbGljZSgxKTtcbiAgICAgICAgICAgICAgICBuZWcgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhvdXNhbmRzID4gLTEpIHtcbiAgICAgICAgICAgICAgICB3ID0gdy50b1N0cmluZygpLnJlcGxhY2UoLyhcXGQpKD89KFxcZHszfSkrKD8hXFxkKSkvZywgJyQxJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmRlbGltaXRlcnMudGhvdXNhbmRzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcuJykgPT09IDApIHtcbiAgICAgICAgICAgICAgICB3ID0gJyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAoKG5lZ1AgJiYgbmVnKSA/ICcoJyA6ICcnKSArICgoIW5lZ1AgJiYgbmVnKSA/ICctJyA6ICcnKSArICgoIW5lZyAmJiBzaWduZWQpID8gJysnIDogJycpICsgdyArIGQgKyAoKG9yZCkgPyBvcmQgOiAnJykgKyAoKGFiYnIpID8gYWJiciA6ICcnKSArICgoYnl0ZXMpID8gYnl0ZXMgOiAnJykgKyAoKG5lZ1AgJiYgbmVnKSA/ICcpJyA6ICcnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgVG9wIExldmVsIEZ1bmN0aW9uc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIG51bWVyYWwgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgaWYgKG51bWVyYWwuaXNOdW1lcmFsKGlucHV0KSkge1xuICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC52YWx1ZSgpO1xuICAgICAgICB9IGVsc2UgaWYgKGlucHV0ID09PSAwIHx8IHR5cGVvZiBpbnB1dCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlucHV0ID0gMDtcbiAgICAgICAgfSBlbHNlIGlmICghTnVtYmVyKGlucHV0KSkge1xuICAgICAgICAgICAgaW5wdXQgPSBudW1lcmFsLmZuLnVuZm9ybWF0KGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgTnVtZXJhbChOdW1iZXIoaW5wdXQpKTtcbiAgICB9O1xuXG4gICAgLy8gdmVyc2lvbiBudW1iZXJcbiAgICBudW1lcmFsLnZlcnNpb24gPSBWRVJTSU9OO1xuXG4gICAgLy8gY29tcGFyZSBudW1lcmFsIG9iamVjdFxuICAgIG51bWVyYWwuaXNOdW1lcmFsID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgTnVtZXJhbDtcbiAgICB9O1xuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiB3aWxsIGxvYWQgbGFuZ3VhZ2VzIGFuZCB0aGVuIHNldCB0aGUgZ2xvYmFsIGxhbmd1YWdlLiAgSWZcbiAgICAvLyBubyBhcmd1bWVudHMgYXJlIHBhc3NlZCBpbiwgaXQgd2lsbCBzaW1wbHkgcmV0dXJuIHRoZSBjdXJyZW50IGdsb2JhbFxuICAgIC8vIGxhbmd1YWdlIGtleS5cbiAgICBudW1lcmFsLmxhbmd1YWdlID0gZnVuY3Rpb24gKGtleSwgdmFsdWVzKSB7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudExhbmd1YWdlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGtleSAmJiAhdmFsdWVzKSB7XG4gICAgICAgICAgICBpZighbGFuZ3VhZ2VzW2tleV0pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gbGFuZ3VhZ2UgOiAnICsga2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnJlbnRMYW5ndWFnZSA9IGtleTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZXMgfHwgIWxhbmd1YWdlc1trZXldKSB7XG4gICAgICAgICAgICBsb2FkTGFuZ3VhZ2Uoa2V5LCB2YWx1ZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bWVyYWw7XG4gICAgfTtcbiAgICBcbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHByb3ZpZGVzIGFjY2VzcyB0byB0aGUgbG9hZGVkIGxhbmd1YWdlIGRhdGEuICBJZlxuICAgIC8vIG5vIGFyZ3VtZW50cyBhcmUgcGFzc2VkIGluLCBpdCB3aWxsIHNpbXBseSByZXR1cm4gdGhlIGN1cnJlbnRcbiAgICAvLyBnbG9iYWwgbGFuZ3VhZ2Ugb2JqZWN0LlxuICAgIG51bWVyYWwubGFuZ3VhZ2VEYXRhID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIWxhbmd1YWdlc1trZXldKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gbGFuZ3VhZ2UgOiAnICsga2V5KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGxhbmd1YWdlc1trZXldO1xuICAgIH07XG5cbiAgICBudW1lcmFsLmxhbmd1YWdlKCdlbicsIHtcbiAgICAgICAgZGVsaW1pdGVyczoge1xuICAgICAgICAgICAgdGhvdXNhbmRzOiAnLCcsXG4gICAgICAgICAgICBkZWNpbWFsOiAnLidcbiAgICAgICAgfSxcbiAgICAgICAgYWJicmV2aWF0aW9uczoge1xuICAgICAgICAgICAgdGhvdXNhbmQ6ICdrJyxcbiAgICAgICAgICAgIG1pbGxpb246ICdtJyxcbiAgICAgICAgICAgIGJpbGxpb246ICdiJyxcbiAgICAgICAgICAgIHRyaWxsaW9uOiAndCdcbiAgICAgICAgfSxcbiAgICAgICAgb3JkaW5hbDogZnVuY3Rpb24gKG51bWJlcikge1xuICAgICAgICAgICAgdmFyIGIgPSBudW1iZXIgJSAxMDtcbiAgICAgICAgICAgIHJldHVybiAofn4gKG51bWJlciAlIDEwMCAvIDEwKSA9PT0gMSkgPyAndGgnIDpcbiAgICAgICAgICAgICAgICAoYiA9PT0gMSkgPyAnc3QnIDpcbiAgICAgICAgICAgICAgICAoYiA9PT0gMikgPyAnbmQnIDpcbiAgICAgICAgICAgICAgICAoYiA9PT0gMykgPyAncmQnIDogJ3RoJztcbiAgICAgICAgfSxcbiAgICAgICAgY3VycmVuY3k6IHtcbiAgICAgICAgICAgIHN5bWJvbDogJyQnXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIG51bWVyYWwuemVyb0Zvcm1hdCA9IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgemVyb0Zvcm1hdCA9IHR5cGVvZihmb3JtYXQpID09PSAnc3RyaW5nJyA/IGZvcm1hdCA6IG51bGw7XG4gICAgfTtcblxuICAgIG51bWVyYWwuZGVmYXVsdEZvcm1hdCA9IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgZGVmYXVsdEZvcm1hdCA9IHR5cGVvZihmb3JtYXQpID09PSAnc3RyaW5nJyA/IGZvcm1hdCA6ICcwLjAnO1xuICAgIH07XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEhlbHBlcnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICBmdW5jdGlvbiBsb2FkTGFuZ3VhZ2Uoa2V5LCB2YWx1ZXMpIHtcbiAgICAgICAgbGFuZ3VhZ2VzW2tleV0gPSB2YWx1ZXM7XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBGbG9hdGluZy1wb2ludCBoZWxwZXJzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgLy8gVGhlIGZsb2F0aW5nLXBvaW50IGhlbHBlciBmdW5jdGlvbnMgYW5kIGltcGxlbWVudGF0aW9uXG4gICAgLy8gYm9ycm93cyBoZWF2aWx5IGZyb20gc2luZnVsLmpzOiBodHRwOi8vZ3VpcG4uZ2l0aHViLmlvL3NpbmZ1bC5qcy9cblxuICAgIC8qKlxuICAgICAqIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UgZm9yIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBpdFxuICAgICAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L1JlZHVjZSNDb21wYXRpYmlsaXR5XG4gICAgICovXG4gICAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBBcnJheS5wcm90b3R5cGUucmVkdWNlKSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIG9wdF9pbml0aWFsVmFsdWUpIHtcbiAgICAgICAgICAgICd1c2Ugc3RyaWN0JztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKG51bGwgPT09IHRoaXMgfHwgJ3VuZGVmaW5lZCcgPT09IHR5cGVvZiB0aGlzKSB7XG4gICAgICAgICAgICAgICAgLy8gQXQgdGhlIG1vbWVudCBhbGwgbW9kZXJuIGJyb3dzZXJzLCB0aGF0IHN1cHBvcnQgc3RyaWN0IG1vZGUsIGhhdmVcbiAgICAgICAgICAgICAgICAvLyBuYXRpdmUgaW1wbGVtZW50YXRpb24gb2YgQXJyYXkucHJvdG90eXBlLnJlZHVjZS4gRm9yIGluc3RhbmNlLCBJRThcbiAgICAgICAgICAgICAgICAvLyBkb2VzIG5vdCBzdXBwb3J0IHN0cmljdCBtb2RlLCBzbyB0aGlzIGNoZWNrIGlzIGFjdHVhbGx5IHVzZWxlc3MuXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJyYXkucHJvdG90eXBlLnJlZHVjZSBjYWxsZWQgb24gbnVsbCBvciB1bmRlZmluZWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoY2FsbGJhY2sgKyAnIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBpbmRleCxcbiAgICAgICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgICAgICBsZW5ndGggPSB0aGlzLmxlbmd0aCA+Pj4gMCxcbiAgICAgICAgICAgICAgICBpc1ZhbHVlU2V0ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGlmICgxIDwgYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gb3B0X2luaXRpYWxWYWx1ZTtcbiAgICAgICAgICAgICAgICBpc1ZhbHVlU2V0ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChpbmRleCA9IDA7IGxlbmd0aCA+IGluZGV4OyArK2luZGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFzT3duUHJvcGVydHkoaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1ZhbHVlU2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGNhbGxiYWNrKHZhbHVlLCB0aGlzW2luZGV4XSwgaW5kZXgsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB0aGlzW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzVmFsdWVTZXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWlzVmFsdWVTZXQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdSZWR1Y2Ugb2YgZW1wdHkgYXJyYXkgd2l0aCBubyBpbml0aWFsIHZhbHVlJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBcbiAgICAvKipcbiAgICAgKiBDb21wdXRlcyB0aGUgbXVsdGlwbGllciBuZWNlc3NhcnkgdG8gbWFrZSB4ID49IDEsXG4gICAgICogZWZmZWN0aXZlbHkgZWxpbWluYXRpbmcgbWlzY2FsY3VsYXRpb25zIGNhdXNlZCBieVxuICAgICAqIGZpbml0ZSBwcmVjaXNpb24uXG4gICAgICovXG4gICAgZnVuY3Rpb24gbXVsdGlwbGllcih4KSB7XG4gICAgICAgIHZhciBwYXJ0cyA9IHgudG9TdHJpbmcoKS5zcGxpdCgnLicpO1xuICAgICAgICBpZiAocGFydHMubGVuZ3RoIDwgMikge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE1hdGgucG93KDEwLCBwYXJ0c1sxXS5sZW5ndGgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdpdmVuIGEgdmFyaWFibGUgbnVtYmVyIG9mIGFyZ3VtZW50cywgcmV0dXJucyB0aGUgbWF4aW11bVxuICAgICAqIG11bHRpcGxpZXIgdGhhdCBtdXN0IGJlIHVzZWQgdG8gbm9ybWFsaXplIGFuIG9wZXJhdGlvbiBpbnZvbHZpbmdcbiAgICAgKiBhbGwgb2YgdGhlbS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjb3JyZWN0aW9uRmFjdG9yKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiBhcmdzLnJlZHVjZShmdW5jdGlvbiAocHJldiwgbmV4dCkge1xuICAgICAgICAgICAgdmFyIG1wID0gbXVsdGlwbGllcihwcmV2KSxcbiAgICAgICAgICAgICAgICBtbiA9IG11bHRpcGxpZXIobmV4dCk7XG4gICAgICAgIHJldHVybiBtcCA+IG1uID8gbXAgOiBtbjtcbiAgICAgICAgfSwgLUluZmluaXR5KTtcbiAgICB9ICAgICAgICBcblxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBOdW1lcmFsIFByb3RvdHlwZVxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4gICAgbnVtZXJhbC5mbiA9IE51bWVyYWwucHJvdG90eXBlID0ge1xuXG4gICAgICAgIGNsb25lIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bWVyYWwodGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZm9ybWF0IDogZnVuY3Rpb24gKGlucHV0U3RyaW5nLCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0TnVtZXJhbCh0aGlzLCBcbiAgICAgICAgICAgICAgICAgIGlucHV0U3RyaW5nID8gaW5wdXRTdHJpbmcgOiBkZWZhdWx0Rm9ybWF0LCBcbiAgICAgICAgICAgICAgICAgIChyb3VuZGluZ0Z1bmN0aW9uICE9PSB1bmRlZmluZWQpID8gcm91bmRpbmdGdW5jdGlvbiA6IE1hdGgucm91bmRcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgfSxcblxuICAgICAgICB1bmZvcm1hdCA6IGZ1bmN0aW9uIChpbnB1dFN0cmluZykge1xuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dFN0cmluZykgPT09ICdbb2JqZWN0IE51bWJlcl0nKSB7IFxuICAgICAgICAgICAgICAgIHJldHVybiBpbnB1dFN0cmluZzsgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdW5mb3JtYXROdW1lcmFsKHRoaXMsIGlucHV0U3RyaW5nID8gaW5wdXRTdHJpbmcgOiBkZWZhdWx0Rm9ybWF0KTtcbiAgICAgICAgfSxcblxuICAgICAgICB2YWx1ZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICB2YWx1ZU9mIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldCA6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSBOdW1iZXIodmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWRkIDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgY29yckZhY3RvciA9IGNvcnJlY3Rpb25GYWN0b3IuY2FsbChudWxsLCB0aGlzLl92YWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgZnVuY3Rpb24gY2JhY2soYWNjdW0sIGN1cnIsIGN1cnJJLCBPKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjY3VtICsgY29yckZhY3RvciAqIGN1cnI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IFt0aGlzLl92YWx1ZSwgdmFsdWVdLnJlZHVjZShjYmFjaywgMCkgLyBjb3JyRmFjdG9yO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3VidHJhY3QgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBjb3JyRmFjdG9yID0gY29ycmVjdGlvbkZhY3Rvci5jYWxsKG51bGwsIHRoaXMuX3ZhbHVlLCB2YWx1ZSk7XG4gICAgICAgICAgICBmdW5jdGlvbiBjYmFjayhhY2N1bSwgY3VyciwgY3VyckksIE8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWNjdW0gLSBjb3JyRmFjdG9yICogY3VycjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gW3ZhbHVlXS5yZWR1Y2UoY2JhY2ssIHRoaXMuX3ZhbHVlICogY29yckZhY3RvcikgLyBjb3JyRmFjdG9yOyAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbXVsdGlwbHkgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNiYWNrKGFjY3VtLCBjdXJyLCBjdXJySSwgTykge1xuICAgICAgICAgICAgICAgIHZhciBjb3JyRmFjdG9yID0gY29ycmVjdGlvbkZhY3RvcihhY2N1bSwgY3Vycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChhY2N1bSAqIGNvcnJGYWN0b3IpICogKGN1cnIgKiBjb3JyRmFjdG9yKSAvXG4gICAgICAgICAgICAgICAgICAgIChjb3JyRmFjdG9yICogY29yckZhY3Rvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IFt0aGlzLl92YWx1ZSwgdmFsdWVdLnJlZHVjZShjYmFjaywgMSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBkaXZpZGUgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNiYWNrKGFjY3VtLCBjdXJyLCBjdXJySSwgTykge1xuICAgICAgICAgICAgICAgIHZhciBjb3JyRmFjdG9yID0gY29ycmVjdGlvbkZhY3RvcihhY2N1bSwgY3Vycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChhY2N1bSAqIGNvcnJGYWN0b3IpIC8gKGN1cnIgKiBjb3JyRmFjdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gW3RoaXMuX3ZhbHVlLCB2YWx1ZV0ucmVkdWNlKGNiYWNrKTsgICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRpZmZlcmVuY2UgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmFicyhudW1lcmFsKHRoaXMuX3ZhbHVlKS5zdWJ0cmFjdCh2YWx1ZSkudmFsdWUoKSk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEV4cG9zaW5nIE51bWVyYWxcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAvLyBDb21tb25KUyBtb2R1bGUgaXMgZGVmaW5lZFxuICAgIGlmIChoYXNNb2R1bGUpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBudW1lcmFsO1xuICAgIH1cblxuICAgIC8qZ2xvYmFsIGVuZGVyOmZhbHNlICovXG4gICAgaWYgKHR5cGVvZiBlbmRlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gaGVyZSwgYHRoaXNgIG1lYW5zIGB3aW5kb3dgIGluIHRoZSBicm93c2VyLCBvciBgZ2xvYmFsYCBvbiB0aGUgc2VydmVyXG4gICAgICAgIC8vIGFkZCBgbnVtZXJhbGAgYXMgYSBnbG9iYWwgb2JqZWN0IHZpYSBhIHN0cmluZyBpZGVudGlmaWVyLFxuICAgICAgICAvLyBmb3IgQ2xvc3VyZSBDb21waWxlciAnYWR2YW5jZWQnIG1vZGVcbiAgICAgICAgdGhpc1snbnVtZXJhbCddID0gbnVtZXJhbDtcbiAgICB9XG5cbiAgICAvKmdsb2JhbCBkZWZpbmU6ZmFsc2UgKi9cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbXSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bWVyYWw7XG4gICAgICAgIH0pO1xuICAgIH1cbn0pLmNhbGwodGhpcyk7XG4iLCIvKipcbiAgICBBY2NvdW50IGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIHNpbmdsZXRvbiA9IG51bGwsXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKSxcbiAgICBOYXZCYXIgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkJhcicpO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0QWNjb3VudCgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IEFjY291bnRBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XG4gICAgXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbn07XG5cbmZ1bmN0aW9uIEFjY291bnRBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xuICAgIFxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcblxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XG4gICAgICAgIHRpdGxlOiAnQWNjb3VudCcsXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5tZW51TmV3SXRlbSxcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5tZW51SW5cbiAgICB9KTtcbn1cblxuQWNjb3VudEFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG5cbn07XG4iLCIvKiogQ2FsZW5kYXIgYWN0aXZpdHkgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyksXHJcbiAgICBOYXZCYXIgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkJhcicpO1xyXG5yZXF1aXJlKCcuLi9jb21wb25lbnRzL0RhdGVQaWNrZXInKTtcclxuXHJcbnZhciBzaW5nbGV0b24gPSBudWxsO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdEFwcG9pbnRtZW50KCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcclxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgQXBwb2ludG1lbnRBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XHJcbiAgICBcclxuICAgIHJldHVybiBzaW5nbGV0b247XHJcbn07XHJcblxyXG5mdW5jdGlvbiBBcHBvaW50bWVudEFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xyXG4gICAgdGhpcy5tZW51SXRlbSA9ICdjYWxlbmRhcic7XHJcbiAgICBcclxuICAgIC8qIEdldHRpbmcgZWxlbWVudHMgKi9cclxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xyXG4gICAgdGhpcy4kYXBwb2ludG1lbnRWaWV3ID0gJGFjdGl2aXR5LmZpbmQoJyNjYWxlbmRhckFwcG9pbnRtZW50VmlldycpO1xyXG4gICAgdGhpcy4kY2hvb3NlTmV3ID0gJCgnI2NhbGVuZGFyQ2hvb3NlTmV3Jyk7XHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuICAgIFxyXG4gICAgLy8gT2JqZWN0IHRvIGhvbGQgdGhlIG9wdGlvbnMgcGFzc2VkIG9uICdzaG93JyBhcyBhIHJlc3VsdFxyXG4gICAgLy8gb2YgYSByZXF1ZXN0IGZyb20gYW5vdGhlciBhY3Rpdml0eVxyXG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XHJcbiAgICBcclxuICAgIC8vIENyZWF0ZSBhIHNwZWNpZmljIGJhY2tBY3Rpb24gdGhhdCBzaG93cyBjdXJyZW50IGRhdGVcclxuICAgIC8vIGFuZCByZXR1cm4gdG8gY2FsZW5kYXIgaW4gY3VycmVudCBkYXRlLlxyXG4gICAgLy8gTGF0ZXIgc29tZSBtb3JlIGNoYW5nZXMgYXJlIGFwcGxpZWQsIHdpdGggdmlld21vZGVsIHJlYWR5XHJcbiAgICB2YXIgYmFja0FjdGlvbiA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgICAgIGxpbms6ICdjYWxlbmRhci8nLCAvLyBQcmVzZXJ2ZSBsYXN0IHNsYXNoLCBmb3IgbGF0ZXIgdXNlXHJcbiAgICAgICAgaWNvbjogTmF2QWN0aW9uLmdvQmFjay5pY29uKCksXHJcbiAgICAgICAgaXNUaXRsZTogdHJ1ZSxcclxuICAgICAgICB0ZXh0OiAnQ2FsZW5kYXInXHJcbiAgICB9KTtcclxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XHJcbiAgICAgICAgdGl0bGU6ICcnLFxyXG4gICAgICAgIGxlZnRBY3Rpb246IGJhY2tBY3Rpb24sXHJcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5nb0hlbHBJbmRleFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMuaW5pdEFwcG9pbnRtZW50KCk7XHJcbiAgICBcclxuICAgIC8vIFRoaXMgdGl0bGUgdGV4dCBpcyBkeW5hbWljLCB3ZSBuZWVkIHRvIHJlcGxhY2UgaXQgYnkgYSBjb21wdXRlZCBvYnNlcnZhYmxlXHJcbiAgICAvLyBzaG93aW5nIHRoZSBjdXJyZW50IGRhdGVcclxuICAgIHZhciBkZWZCYWNrVGV4dCA9IGJhY2tBY3Rpb24udGV4dC5faW5pdGlhbFZhbHVlO1xyXG4gICAgYmFja0FjdGlvbi50ZXh0ID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHZhciBkID0gdGhpcy5hcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50RGF0ZSgpO1xyXG4gICAgICAgIGlmICghZClcclxuICAgICAgICAgICAgLy8gRmFsbGJhY2sgdG8gdGhlIGRlZmF1bHQgdGl0bGVcclxuICAgICAgICAgICAgcmV0dXJuIGRlZkJhY2tUZXh0O1xyXG5cclxuICAgICAgICB2YXIgbSA9IG1vbWVudChkKTtcclxuICAgICAgICB2YXIgdCA9IG0uZm9ybWF0KCdkZGRkIFsoXU0vRFspXScpO1xyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICAvLyBBbmQgdGhlIGxpbmsgaXMgZHluYW1pYyB0b28sIHRvIGFsbG93IHJldHVybiB0byB0aGUgZGF0ZVxyXG4gICAgLy8gdGhhdCBtYXRjaGVzIGN1cnJlbnQgYXBwb2ludG1lbnRcclxuICAgIHZhciBkZWZMaW5rID0gYmFja0FjdGlvbi5saW5rLl9pbml0aWFsVmFsdWU7XHJcbiAgICBiYWNrQWN0aW9uLmxpbmsgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIGQgPSB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3LmN1cnJlbnREYXRlKCk7XHJcbiAgICAgICAgaWYgKCFkKVxyXG4gICAgICAgICAgICAvLyBGYWxsYmFjayB0byB0aGUgZGVmYXVsdCBsaW5rXHJcbiAgICAgICAgICAgIHJldHVybiBkZWZMaW5rO1xyXG5cclxuICAgICAgICByZXR1cm4gZGVmTGluayArIGQudG9JU09TdHJpbmcoKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3LmN1cnJlbnRBcHBvaW50bWVudC5zdWJzY3JpYmUoZnVuY3Rpb24gKGFwdCkge1xyXG4gICAgICAgIC8vIFVwZGF0ZSBVUkwgdG8gbWF0Y2ggdGhlIGFwcG9pbnRtZW50IElEIGFuZFxyXG4gICAgICAgIC8vIHRyYWNrIGl0IHN0YXRlXHJcbiAgICAgICAgLy8gR2V0IElEIGZyb20gVVJMLCB0byBhdm9pZCBkbyBhbnl0aGluZyBpZiB0aGUgc2FtZS5cclxuICAgICAgICB2YXIgYXB0SWQgPSBhcHQuaWQoKTtcclxuICAgICAgICB2YXIgdXJsSWQgPSAvYXBwb2ludG1lbnRcXC8oXFxkKykvaS50ZXN0KHdpbmRvdy5sb2NhdGlvbik7XHJcbiAgICAgICAgdXJsSWQgPSB1cmxJZCAmJiB1cmxJZFsxXSB8fCAnJztcclxuICAgICAgICBpZiAodXJsSWQgIT09ICcwJyAmJiBhcHRJZCAhPT0gbnVsbCAmJiB1cmxJZCAhPT0gYXB0SWQudG9TdHJpbmcoKSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVE9ETyBzYXZlIGEgdXNlZnVsIHN0YXRlXHJcbiAgICAgICAgICAgIC8vIE5vdCBmb3Igbm93LCBpcyBmYWlsaW5nLCBidXQgc29tZXRoaW5nIGJhc2VkIG9uOlxyXG4gICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICB2YXIgdmlld3N0YXRlID0ge1xyXG4gICAgICAgICAgICAgICAgYXBwb2ludG1lbnQ6IGFwdC5tb2RlbC50b1BsYWluT2JqZWN0KHRydWUpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBJZiB3YXMgYSByb290IFVSTCwgbm8gSUQsIGp1c3QgcmVwbGFjZSBjdXJyZW50IHN0YXRlXHJcbiAgICAgICAgICAgIGlmICh1cmxJZCA9PT0gJycpXHJcbiAgICAgICAgICAgICAgICBhcHAuc2hlbGwuaGlzdG9yeS5yZXBsYWNlU3RhdGUobnVsbCwgbnVsbCwgJ2FwcG9pbnRtZW50LycgKyBhcHRJZCk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGFwcC5zaGVsbC5oaXN0b3J5LnB1c2hTdGF0ZShudWxsLCBudWxsLCAnYXBwb2ludG1lbnQvJyArIGFwdElkKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVHJpZ2dlciBhIGxheW91dCB1cGRhdGUsIHJlcXVpcmVkIGJ5IHRoZSBmdWxsLWhlaWdodCBmZWF0dXJlXHJcbiAgICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ2xheW91dFVwZGF0ZScpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbkFwcG9pbnRtZW50QWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcclxuICAgIC8qIGpzaGludCBtYXhjb21wbGV4aXR5OjEwICovXHJcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIFxyXG4gICAgdmFyIGFwdDtcclxuICAgIGlmICh0aGlzLnJlcXVlc3RJbmZvLmFwcG9pbnRtZW50KSB7XHJcbiAgICAgICAgYXB0ID0gdGhpcy5yZXF1ZXN0SW5mby5hcHBvaW50bWVudDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAvLyBHZXQgSURcclxuICAgICAgICB2YXIgYXB0SWQgPSBvcHRpb25zICYmIG9wdGlvbnMucm91dGUgJiYgb3B0aW9ucy5yb3V0ZS5zZWdtZW50c1swXTtcclxuICAgICAgICBhcHRJZCA9IHBhcnNlSW50KGFwdElkLCAxMCk7XHJcbiAgICAgICAgYXB0ID0gYXB0SWQgfHwgMDtcclxuICAgIH1cclxuICAgIHRoaXMuc2hvd0FwcG9pbnRtZW50KGFwdCk7XHJcbiAgICBcclxuICAgIC8vIElmIHRoZXJlIGFyZSBvcHRpb25zICh0aGVyZSBhcmUgbm90IG9uIHN0YXJ0dXAgb3JcclxuICAgIC8vIG9uIGNhbmNlbGxlZCBlZGl0aW9uKS5cclxuICAgIC8vIEFuZCBpdCBjb21lcyBiYWNrIGZyb20gdGhlIHRleHRFZGl0b3IuXHJcbiAgICBpZiAob3B0aW9ucyAhPT0gbnVsbCkge1xyXG5cclxuICAgICAgICB2YXIgYm9va2luZyA9IHRoaXMuYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50KCk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLnJlcXVlc3QgPT09ICd0ZXh0RWRpdG9yJyAmJiBib29raW5nKSB7XHJcblxyXG4gICAgICAgICAgICBib29raW5nW29wdGlvbnMuZmllbGRdKG9wdGlvbnMudGV4dCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKG9wdGlvbnMuc2VsZWN0Q2xpZW50ID09PSB0cnVlICYmIGJvb2tpbmcpIHtcclxuXHJcbiAgICAgICAgICAgIGJvb2tpbmcuY2xpZW50KG9wdGlvbnMuc2VsZWN0ZWRDbGllbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0eXBlb2Yob3B0aW9ucy5zZWxlY3RlZERhdGV0aW1lKSAhPT0gJ3VuZGVmaW5lZCcgJiYgYm9va2luZykge1xyXG5cclxuICAgICAgICAgICAgYm9va2luZy5zdGFydFRpbWUob3B0aW9ucy5zZWxlY3RlZERhdGV0aW1lKTtcclxuICAgICAgICAgICAgLy8gVE9ETyBDYWxjdWxhdGUgdGhlIGVuZFRpbWUgZ2l2ZW4gYW4gYXBwb2ludG1lbnQgZHVyYXRpb24sIHJldHJpZXZlZCBmcm9tIHRoZVxyXG4gICAgICAgICAgICAvLyBzZWxlY3RlZCBzZXJ2aWNlXHJcbiAgICAgICAgICAgIC8vdmFyIGR1cmF0aW9uID0gYm9va2luZy5wcmljaW5nICYmIGJvb2tpbmcucHJpY2luZy5kdXJhdGlvbjtcclxuICAgICAgICAgICAgLy8gT3IgYnkgZGVmYXVsdCAoaWYgbm8gcHJpY2luZyBzZWxlY3RlZCBvciBhbnkpIHRoZSB1c2VyIHByZWZlcnJlZFxyXG4gICAgICAgICAgICAvLyB0aW1lIGdhcFxyXG4gICAgICAgICAgICAvL2R1cmF0aW9uID0gZHVyYXRpb24gfHwgdXNlci5wcmVmZXJlbmNlcy50aW1lU2xvdHNHYXA7XHJcbiAgICAgICAgICAgIC8vIFBST1RPVFlQRTpcclxuICAgICAgICAgICAgdmFyIGR1cmF0aW9uID0gNjA7IC8vIG1pbnV0ZXNcclxuICAgICAgICAgICAgYm9va2luZy5lbmRUaW1lKG1vbWVudChib29raW5nLnN0YXJ0VGltZSgpKS5hZGQoZHVyYXRpb24sICdtaW51dGVzJykudG9EYXRlKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChvcHRpb25zLnNlbGVjdFNlcnZpY2VzID09PSB0cnVlICYmIGJvb2tpbmcpIHtcclxuXHJcbiAgICAgICAgICAgIGJvb2tpbmcuc2VydmljZXMob3B0aW9ucy5zZWxlY3RlZFNlcnZpY2VzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5zZWxlY3RMb2NhdGlvbiA9PT0gdHJ1ZSAmJiBib29raW5nKSB7XHJcblxyXG4gICAgICAgICAgICBib29raW5nLmxvY2F0aW9uKG9wdGlvbnMuc2VsZWN0ZWRMb2NhdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIEFwcG9pbnRtZW50ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0FwcG9pbnRtZW50Jyk7XHJcblxyXG5BcHBvaW50bWVudEFjdGl2aXR5LnByb3RvdHlwZS5zaG93QXBwb2ludG1lbnQgPSBmdW5jdGlvbiBzaG93QXBwb2ludG1lbnQoYXB0KSB7XHJcblxyXG4gICAgaWYgKHR5cGVvZihhcHQpID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgIGlmIChhcHQpIHtcclxuICAgICAgICAgICAgLy8gVE9ETzogc2VsZWN0IGFwcG9pbnRtZW50IGFwdCBJRFxyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKGFwdCA9PT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3Lm5ld0FwcG9pbnRtZW50KG5ldyBBcHBvaW50bWVudCgpKTtcclxuICAgICAgICAgICAgdGhpcy5hcHBvaW50bWVudHNEYXRhVmlldy5lZGl0TW9kZSh0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICAvLyBBcHBvaW50bWVudCBvYmplY3RcclxuICAgICAgICBpZiAoYXB0LmlkKSB7XHJcbiAgICAgICAgICAgIC8vIFRPRE86IHNlbGVjdCBhcHBvaW50bWVudCBieSBhcHQgaWRcclxuICAgICAgICAgICAgLy8gVE9ETzogdGhlbiB1cGRhdGUgdmFsdWVzIHdpdGggaW4tZWRpdGluZyB2YWx1ZXMgZnJvbSBhcHRcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIE5ldyBhcG9waW50bWVudCB3aXRoIHRoZSBpbi1lZGl0aW5nIHZhbHVlc1xyXG4gICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3Lm5ld0FwcG9pbnRtZW50KG5ldyBBcHBvaW50bWVudChhcHQpKTtcclxuICAgICAgICAgICAgdGhpcy5hcHBvaW50bWVudHNEYXRhVmlldy5lZGl0TW9kZSh0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5BcHBvaW50bWVudEFjdGl2aXR5LnByb3RvdHlwZS5pbml0QXBwb2ludG1lbnQgPSBmdW5jdGlvbiBpbml0QXBwb2ludG1lbnQoKSB7XHJcbiAgICBpZiAoIXRoaXMuX19pbml0ZWRBcHBvaW50bWVudCkge1xyXG4gICAgICAgIHRoaXMuX19pbml0ZWRBcHBvaW50bWVudCA9IHRydWU7XHJcblxyXG4gICAgICAgIHZhciBhcHAgPSB0aGlzLmFwcDtcclxuICAgICAgICBcclxuICAgICAgICAvLyBEYXRhXHJcbiAgICAgICAgdmFyIHRlc3REYXRhID0gcmVxdWlyZSgnLi4vdGVzdGRhdGEvY2FsZW5kYXJBcHBvaW50bWVudHMnKS5hcHBvaW50bWVudHM7XHJcbiAgICAgICAgdmFyIGFwcG9pbnRtZW50c0RhdGFWaWV3ID0ge1xyXG4gICAgICAgICAgICBhcHBvaW50bWVudHM6IGtvLm9ic2VydmFibGVBcnJheSh0ZXN0RGF0YSksXHJcbiAgICAgICAgICAgIGN1cnJlbnRJbmRleDoga28ub2JzZXJ2YWJsZSgwKSxcclxuICAgICAgICAgICAgZWRpdE1vZGU6IGtvLm9ic2VydmFibGUoZmFsc2UpLFxyXG4gICAgICAgICAgICBuZXdBcHBvaW50bWVudDoga28ub2JzZXJ2YWJsZShudWxsKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5hcHBvaW50bWVudHNEYXRhVmlldyA9IGFwcG9pbnRtZW50c0RhdGFWaWV3O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmlzTmV3ID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV3QXBwb2ludG1lbnQoKSAhPT0gbnVsbDtcclxuICAgICAgICB9LCBhcHBvaW50bWVudHNEYXRhVmlldyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50ID0ga28uY29tcHV0ZWQoe1xyXG4gICAgICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzTmV3KCkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5uZXdBcHBvaW50bWVudCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXBwb2ludG1lbnRzKClbdGhpcy5jdXJyZW50SW5kZXgoKSAlIHRoaXMuYXBwb2ludG1lbnRzKCkubGVuZ3RoXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKGFwdCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5jdXJyZW50SW5kZXgoKSAlIHRoaXMuYXBwb2ludG1lbnRzKCkubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBvaW50bWVudHMoKVtpbmRleF0gPSBhcHQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50cy52YWx1ZUhhc011dGF0ZWQoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgb3duZXI6IGFwcG9pbnRtZW50c0RhdGFWaWV3XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcub3JpZ2luYWxFZGl0ZWRBcHBvaW50bWVudCA9IHt9O1xyXG4gXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuZ29QcmV2aW91cyA9IGZ1bmN0aW9uIGdvUHJldmlvdXMoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmVkaXRNb2RlKCkpIHJldHVybjtcclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudEluZGV4KCkgPT09IDApXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCh0aGlzLmFwcG9pbnRtZW50cygpLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCgodGhpcy5jdXJyZW50SW5kZXgoKSAtIDEpICUgdGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGgpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuZ29OZXh0ID0gZnVuY3Rpb24gZ29OZXh0KCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5lZGl0TW9kZSgpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCgodGhpcy5jdXJyZW50SW5kZXgoKSArIDEpICUgdGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGgpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmVkaXQgPSBmdW5jdGlvbiBlZGl0KCkge1xyXG4gICAgICAgICAgICB0aGlzLmVkaXRNb2RlKHRydWUpO1xyXG4gICAgICAgIH0uYmluZChhcHBvaW50bWVudHNEYXRhVmlldyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKCkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gaWYgaXMgbmV3LCBkaXNjYXJkXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzTmV3KCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV3QXBwb2ludG1lbnQobnVsbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyByZXZlcnQgY2hhbmdlc1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50QXBwb2ludG1lbnQobmV3IEFwcG9pbnRtZW50KHRoaXMub3JpZ2luYWxFZGl0ZWRBcHBvaW50bWVudCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmVkaXRNb2RlKGZhbHNlKTtcclxuICAgICAgICB9LmJpbmQoYXBwb2ludG1lbnRzRGF0YVZpZXcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgICAgICAgICAvLyBJZiBpcyBhIG5ldyBvbmUsIGFkZCBpdCB0byB0aGUgY29sbGVjdGlvblxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc05ldygpKSB7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHZhciBuZXdBcHQgPSB0aGlzLm5ld0FwcG9pbnRtZW50KCk7XHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBzb21lIGZpZWRzIG5lZWQgc29tZSBraW5kIG9mIGNhbGN1bGF0aW9uIHRoYXQgaXMgcGVyc2lzdGVkXHJcbiAgICAgICAgICAgICAgICAvLyBzb24gY2Fubm90IGJlIGNvbXB1dGVkLiBTaW11bGF0ZWQ6XHJcbiAgICAgICAgICAgICAgICBuZXdBcHQuc3VtbWFyeSgnTWFzc2FnZSBUaGVyYXBpc3QgQm9va2luZycpO1xyXG4gICAgICAgICAgICAgICAgbmV3QXB0LmlkKDQpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgdG8gdGhlIGxpc3Q6XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50cy5wdXNoKG5ld0FwdCk7XHJcbiAgICAgICAgICAgICAgICAvLyBub3csIHJlc2V0XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5ld0FwcG9pbnRtZW50KG51bGwpO1xyXG4gICAgICAgICAgICAgICAgLy8gY3VycmVudCBpbmRleCBtdXN0IGJlIHRoZSBqdXN0LWFkZGVkIGFwdFxyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50SW5kZXgodGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gT24gYWRkaW5nIGEgbmV3IG9uZSwgdGhlIGNvbmZpcm1hdGlvbiBwYWdlIG11c3QgYmUgc2hvd2VkXHJcbiAgICAgICAgICAgICAgICBhcHAuc2hlbGwuZ28oJ2Jvb2tpbmdDb25maXJtYXRpb24nLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgYm9va2luZzogbmV3QXB0XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5lZGl0TW9kZShmYWxzZSk7XHJcbiAgICAgICAgfS5iaW5kKGFwcG9pbnRtZW50c0RhdGFWaWV3KTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5lZGl0TW9kZS5zdWJzY3JpYmUoZnVuY3Rpb24oaXNFZGl0KSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLiRhY3Rpdml0eS50b2dnbGVDbGFzcygnaW4tZWRpdCcsIGlzRWRpdCk7XHJcbiAgICAgICAgICAgIHRoaXMuJGFwcG9pbnRtZW50Vmlldy5maW5kKCcuQXBwb2ludG1lbnRDYXJkJykudG9nZ2xlQ2xhc3MoJ2luLWVkaXQnLCBpc0VkaXQpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGlzRWRpdCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGEgY29weSBvZiB0aGUgYXBwb2ludG1lbnQgc28gd2UgcmV2ZXJ0IG9uICdjYW5jZWwnXHJcbiAgICAgICAgICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5vcmlnaW5hbEVkaXRlZEFwcG9pbnRtZW50ID0gXHJcbiAgICAgICAgICAgICAgICAgICAga28udG9KUyhhcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50QXBwb2ludG1lbnQoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50RGF0ZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIGFwdCA9IHRoaXMuY3VycmVudEFwcG9pbnRtZW50KCksXHJcbiAgICAgICAgICAgICAgICBqdXN0RGF0ZSA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICBpZiAoYXB0ICYmIGFwdC5zdGFydFRpbWUoKSlcclxuICAgICAgICAgICAgICAgIGp1c3REYXRlID0gbW9tZW50KGFwdC5zdGFydFRpbWUoKSkuaG91cnMoMCkubWludXRlcygwKS5zZWNvbmRzKDApLnRvRGF0ZSgpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIGp1c3REYXRlO1xyXG4gICAgICAgIH0sIGFwcG9pbnRtZW50c0RhdGFWaWV3KTtcclxuICAgICAgICBcclxuICAgICAgICAvKipcclxuICAgICAgICAgICAgRXh0ZXJuYWwgYWN0aW9uc1xyXG4gICAgICAgICoqL1xyXG4gICAgICAgIHZhciBlZGl0RmllbGRPbiA9IGZ1bmN0aW9uIGVkaXRGaWVsZE9uKGFjdGl2aXR5LCBkYXRhKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBJbmNsdWRlIGFwcG9pbnRtZW50IHRvIHJlY292ZXIgc3RhdGUgb24gcmV0dXJuOlxyXG4gICAgICAgICAgICBkYXRhLmFwcG9pbnRtZW50ID0gYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50KCkubW9kZWwudG9QbGFpbk9iamVjdCh0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIGFwcC5zaGVsbC5nbyhhY3Rpdml0eSwgZGF0YSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5waWNrRGF0ZVRpbWUgPSBmdW5jdGlvbiBwaWNrRGF0ZVRpbWUoKSB7XHJcblxyXG4gICAgICAgICAgICBlZGl0RmllbGRPbignZGF0ZXRpbWVQaWNrZXInLCB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RlZERhdGV0aW1lOiBudWxsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcucGlja0NsaWVudCA9IGZ1bmN0aW9uIHBpY2tDbGllbnQoKSB7XHJcblxyXG4gICAgICAgICAgICBlZGl0RmllbGRPbignY2xpZW50cycsIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdENsaWVudDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHNlbGVjdGVkQ2xpZW50OiBudWxsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LnBpY2tTZXJ2aWNlID0gZnVuY3Rpb24gcGlja1NlcnZpY2UoKSB7XHJcblxyXG4gICAgICAgICAgICBlZGl0RmllbGRPbignc2VydmljZXMnLCB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RTZXJ2aWNlczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHNlbGVjdGVkU2VydmljZXM6IGFwcG9pbnRtZW50c0RhdGFWaWV3LmN1cnJlbnRBcHBvaW50bWVudCgpLnNlcnZpY2VzKClcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuY2hhbmdlUHJpY2UgPSBmdW5jdGlvbiBjaGFuZ2VQcmljZSgpIHtcclxuICAgICAgICAgICAgLy8gVE9ET1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcucGlja0xvY2F0aW9uID0gZnVuY3Rpb24gcGlja0xvY2F0aW9uKCkge1xyXG5cclxuICAgICAgICAgICAgZWRpdEZpZWxkT24oJ2xvY2F0aW9ucycsIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdExvY2F0aW9uOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRMb2NhdGlvbjogYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50KCkubG9jYXRpb24oKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgdGV4dEZpZWxkc0hlYWRlcnMgPSB7XHJcbiAgICAgICAgICAgIHByZU5vdGVzVG9DbGllbnQ6ICdOb3RlcyB0byBjbGllbnQnLFxyXG4gICAgICAgICAgICBwb3N0Tm90ZXNUb0NsaWVudDogJ05vdGVzIHRvIGNsaWVudCAoYWZ0ZXJ3YXJkcyknLFxyXG4gICAgICAgICAgICBwcmVOb3Rlc1RvU2VsZjogJ05vdGVzIHRvIHNlbGYnLFxyXG4gICAgICAgICAgICBwb3N0Tm90ZXNUb1NlbGY6ICdCb29raW5nIHN1bW1hcnknXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5lZGl0VGV4dEZpZWxkID0gZnVuY3Rpb24gZWRpdFRleHRGaWVsZChmaWVsZCkge1xyXG5cclxuICAgICAgICAgICAgZWRpdEZpZWxkT24oJ3RleHRFZGl0b3InLCB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0OiAndGV4dEVkaXRvcicsXHJcbiAgICAgICAgICAgICAgICBmaWVsZDogZmllbGQsXHJcbiAgICAgICAgICAgICAgICB0aXRsZTogYXBwb2ludG1lbnRzRGF0YVZpZXcuaXNOZXcoKSA/ICdOZXcgYm9va2luZycgOiAnQm9va2luZycsXHJcbiAgICAgICAgICAgICAgICBoZWFkZXI6IHRleHRGaWVsZHNIZWFkZXJzW2ZpZWxkXSxcclxuICAgICAgICAgICAgICAgIHRleHQ6IGFwcG9pbnRtZW50c0RhdGFWaWV3LmN1cnJlbnRBcHBvaW50bWVudCgpW2ZpZWxkXSgpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKTtcclxuICAgICAgICBcclxuICAgICAgICBrby5hcHBseUJpbmRpbmdzKGFwcG9pbnRtZW50c0RhdGFWaWV3LCB0aGlzLiRhY3Rpdml0eS5nZXQoMCkpO1xyXG4gICAgfVxyXG59O1xyXG4iLCIvKipcclxuICAgIGJvb2tpbmdDb25maXJtYXRpb24gYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbiAgICBcclxudmFyIHNpbmdsZXRvbiA9IG51bGw7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0Q2xpZW50cygkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXHJcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IEJvb2tpbmdDb25maXJtYXRpb25BY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XHJcbiAgICBcclxuICAgIHJldHVybiBzaW5nbGV0b247XHJcbn07XHJcblxyXG5mdW5jdGlvbiBCb29raW5nQ29uZmlybWF0aW9uQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XHJcbiAgICBcclxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xyXG4gICAgdGhpcy5hcHAgPSBhcHA7XHJcblxyXG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcclxuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XHJcbn1cclxuXHJcbkJvb2tpbmdDb25maXJtYXRpb25BY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG5cclxuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuYm9va2luZylcclxuICAgICAgICB0aGlzLmRhdGFWaWV3LmJvb2tpbmcob3B0aW9ucy5ib29raW5nKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcclxuXHJcbiAgICAvLyA6QXBwb2ludG1lbnRcclxuICAgIHRoaXMuYm9va2luZyA9IGtvLm9ic2VydmFibGUobnVsbCk7XHJcbn1cclxuIiwiLyoqIENhbGVuZGFyIGFjdGl2aXR5ICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbnJlcXVpcmUoJy4uL2NvbXBvbmVudHMvRGF0ZVBpY2tlcicpO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG52YXIgQ2FsZW5kYXJTbG90ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0NhbGVuZGFyU2xvdCcpLFxyXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKSxcclxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyk7XHJcblxyXG52YXIgc2luZ2xldG9uID0gbnVsbDtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRDYWxlbmRhcigkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXHJcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IENhbGVuZGFyQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xyXG4gICAgXHJcbiAgICByZXR1cm4gc2luZ2xldG9uO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gQ2FsZW5kYXJBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcclxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XHJcbiAgICAgICAgdGl0bGU6ICdDYWxlbmRhcicsXHJcbiAgICAgICAgbGVmdEFjdGlvbjogTmF2QWN0aW9uLm1lbnVOZXdJdGVtLFxyXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBOYXZBY3Rpb24ubWVudUluXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLyogR2V0dGluZyBlbGVtZW50cyAqL1xyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLiRkYXRlcGlja2VyID0gJGFjdGl2aXR5LmZpbmQoJyNjYWxlbmRhckRhdGVQaWNrZXInKTtcclxuICAgIHRoaXMuJGRhaWx5VmlldyA9ICRhY3Rpdml0eS5maW5kKCcjY2FsZW5kYXJEYWlseVZpZXcnKTtcclxuICAgIHRoaXMuJGRhdGVIZWFkZXIgPSAkYWN0aXZpdHkuZmluZCgnI2NhbGVuZGFyRGF0ZUhlYWRlcicpO1xyXG4gICAgdGhpcy4kZGF0ZVRpdGxlID0gdGhpcy4kZGF0ZUhlYWRlci5jaGlsZHJlbignLkNhbGVuZGFyRGF0ZUhlYWRlci1kYXRlJyk7XHJcbiAgICB0aGlzLiRjaG9vc2VOZXcgPSAkKCcjY2FsZW5kYXJDaG9vc2VOZXcnKTtcclxuICAgIHRoaXMuYXBwID0gYXBwO1xyXG4gICAgXHJcbiAgICAvKiBJbml0IGNvbXBvbmVudHMgKi9cclxuICAgIHRoaXMuJGRhdGVwaWNrZXIuc2hvdygpLmRhdGVwaWNrZXIoKTtcclxuXHJcbiAgICAvLyBEYXRhXHJcbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xyXG4gICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLmRhdGFWaWV3LCAkYWN0aXZpdHkuZ2V0KDApKTtcclxuXHJcbiAgICAvLyBUZXN0aW5nIGRhdGFcclxuICAgIHRoaXMuZGF0YVZpZXcuc2xvdHNEYXRhKHJlcXVpcmUoJy4uL3Rlc3RkYXRhL2NhbGVuZGFyU2xvdHMnKS5jYWxlbmRhcik7XHJcbiAgICBcclxuICAgIC8vIE9iamVjdCB0byBob2xkIHRoZSBvcHRpb25zIHBhc3NlZCBvbiAnc2hvdycgYXMgYSByZXN1bHRcclxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG5cclxuICAgIC8qIEV2ZW50IGhhbmRsZXJzICovXHJcbiAgICAvLyBDaGFuZ2VzIG9uIGN1cnJlbnREYXRlXHJcbiAgICB0aGlzLmRhdGFWaWV3LmN1cnJlbnREYXRlLnN1YnNjcmliZShmdW5jdGlvbihkYXRlKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVHJpZ2dlciBhIGxheW91dCB1cGRhdGUsIHJlcXVpcmVkIGJ5IHRoZSBmdWxsLWhlaWdodCBmZWF0dXJlXHJcbiAgICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ2xheW91dFVwZGF0ZScpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChkYXRlKSB7XHJcbiAgICAgICAgICAgIHZhciBtZGF0ZSA9IG1vbWVudChkYXRlKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtZGF0ZS5pc1ZhbGlkKCkpIHtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdmFyIGlzb0RhdGUgPSBtZGF0ZS50b0lTT1N0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgZGF0ZXBpY2tlciBzZWxlY3RlZCBkYXRlIG9uIGRhdGUgY2hhbmdlIChmcm9tIFxyXG4gICAgICAgICAgICAgICAgLy8gYSBkaWZmZXJlbnQgc291cmNlIHRoYW4gdGhlIGRhdGVwaWNrZXIgaXRzZWxmXHJcbiAgICAgICAgICAgICAgICB0aGlzLiRkYXRlcGlja2VyLnJlbW92ZUNsYXNzKCdpcy12aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAvLyBDaGFuZ2Ugbm90IGZyb20gdGhlIHdpZGdldD9cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLiRkYXRlcGlja2VyLmRhdGVwaWNrZXIoJ2dldFZhbHVlJykudG9JU09TdHJpbmcoKSAhPT0gaXNvRGF0ZSlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLiRkYXRlcGlja2VyLmRhdGVwaWNrZXIoJ3NldFZhbHVlJywgZGF0ZSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gT24gY3VycmVudERhdGUgY2hhbmdlcywgdXBkYXRlIHRoZSBVUkxcclxuICAgICAgICAgICAgICAgIC8vIFRPRE86IHNhdmUgYSB1c2VmdWwgc3RhdGVcclxuICAgICAgICAgICAgICAgIC8vIERPVUJUOiBwdXNoIG9yIHJlcGxhY2Ugc3RhdGU/IChtb3JlIGhpc3RvcnkgZW50cmllcyBvciB0aGUgc2FtZT8pXHJcbiAgICAgICAgICAgICAgICBhcHAuc2hlbGwuaGlzdG9yeS5wdXNoU3RhdGUobnVsbCwgbnVsbCwgJ2NhbGVuZGFyLycgKyBpc29EYXRlKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gRE9ORVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFNvbWV0aGluZyBmYWlsLCBiYWQgZGF0ZSBvciBub3QgZGF0ZSBhdCBhbGxcclxuICAgICAgICAvLyBTZXQgdGhlIGN1cnJlbnQgb25lXHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5jdXJyZW50RGF0ZShuZXcgRGF0ZSgpKTtcclxuXHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIC8vIFN3aXBlIGRhdGUgb24gZ2VzdHVyZVxyXG4gICAgdGhpcy4kZGFpbHlWaWV3XHJcbiAgICAub24oJ3N3aXBlbGVmdCBzd2lwZXJpZ2h0JywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgZGlyID0gZS50eXBlID09PSAnc3dpcGVsZWZ0JyA/ICduZXh0JyA6ICdwcmV2JztcclxuICAgICAgICBcclxuICAgICAgICAvLyBIYWNrIHRvIHNvbHZlIHRoZSBmcmVlenktc3dpcGUgYW5kIHRhcC1hZnRlciBidWcgb24gSlFNOlxyXG4gICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ3RvdWNoZW5kJyk7XHJcbiAgICAgICAgLy8gQ2hhbmdlIGRhdGVcclxuICAgICAgICB0aGlzLiRkYXRlcGlja2VyLmRhdGVwaWNrZXIoJ21vdmVWYWx1ZScsIGRpciwgJ2RhdGUnKTtcclxuXHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgXHJcbiAgICAvLyBDaGFuZ2luZyBkYXRlIHdpdGggYnV0dG9uczpcclxuICAgIHRoaXMuJGRhdGVIZWFkZXIub24oJ3RhcCcsICcuQ2FsZW5kYXJEYXRlSGVhZGVyLXN3aXRjaCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBzd2l0Y2ggKGUuY3VycmVudFRhcmdldC5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSkge1xyXG4gICAgICAgICAgICBjYXNlICcjcHJldic6XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRkYXRlcGlja2VyLmRhdGVwaWNrZXIoJ21vdmVWYWx1ZScsICdwcmV2JywgJ2RhdGUnKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICcjbmV4dCc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRkYXRlcGlja2VyLmRhdGVwaWNrZXIoJ21vdmVWYWx1ZScsICduZXh0JywgJ2RhdGUnKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgLy8gTGV0cyBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgLy8gU2hvd2luZyBkYXRlcGlja2VyIHdoZW4gcHJlc3NpbmcgdGhlIHRpdGxlXHJcbiAgICB0aGlzLiRkYXRlVGl0bGUub24oJ3RhcCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB0aGlzLiRkYXRlcGlja2VyLnRvZ2dsZUNsYXNzKCdpcy12aXNpYmxlJyk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIC8vIFVwZGF0aW5nIHZpZXcgZGF0ZSB3aGVuIHBpY2tlZCBhbm90aGVyIG9uZVxyXG4gICAgdGhpcy4kZGF0ZXBpY2tlci5vbignY2hhbmdlRGF0ZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBpZiAoZS52aWV3TW9kZSA9PT0gJ2RheXMnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcuY3VycmVudERhdGUoZS5kYXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIC8vIFNldCBkYXRlIHRvIG1hdGNoIGRhdGVwaWNrZXIgZm9yIGZpcnN0IHVwZGF0ZVxyXG4gICAgdGhpcy5kYXRhVmlldy5jdXJyZW50RGF0ZSh0aGlzLiRkYXRlcGlja2VyLmRhdGVwaWNrZXIoJ2dldFZhbHVlJykpO1xyXG59XHJcblxyXG5DYWxlbmRhckFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcbiAgICAvKiBqc2hpbnQgbWF4Y29tcGxleGl0eToxMCAqL1xyXG4gICAgXHJcbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnJvdXRlICYmIG9wdGlvbnMucm91dGUuc2VnbWVudHMpIHtcclxuICAgICAgICB2YXIgc2RhdGUgPSBvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdLFxyXG4gICAgICAgICAgICBtZGF0ZSA9IG1vbWVudChzZGF0ZSksXHJcbiAgICAgICAgICAgIGRhdGUgPSBtZGF0ZS5pc1ZhbGlkKCkgPyBtZGF0ZS50b0RhdGUoKSA6IG51bGw7XHJcblxyXG4gICAgICAgIGlmIChkYXRlKVxyXG4gICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmN1cnJlbnREYXRlKGRhdGUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIHRoaXMuc2xvdHMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xyXG4gICAgdGhpcy5zbG90c0RhdGEgPSBrby5vYnNlcnZhYmxlKHt9KTtcclxuICAgIHRoaXMuY3VycmVudERhdGUgPSBrby5vYnNlcnZhYmxlKG5ldyBEYXRlKCkpO1xyXG4gICAgXHJcbiAgICAvLyBVcGRhdGUgY3VycmVudCBzbG90cyBvbiBkYXRlIGNoYW5nZVxyXG4gICAgdGhpcy5jdXJyZW50RGF0ZS5zdWJzY3JpYmUoZnVuY3Rpb24gKGRhdGUpIHtcclxuXHJcbiAgICAgICAgdmFyIG1kYXRlID0gbW9tZW50KGRhdGUpLFxyXG4gICAgICAgICAgICBzZGF0ZSA9IG1kYXRlLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBzbG90cyA9IHRoaXMuc2xvdHNEYXRhKCk7XHJcblxyXG4gICAgICAgIGlmIChzbG90cy5oYXNPd25Qcm9wZXJ0eShzZGF0ZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5zbG90cyhzbG90c1tzZGF0ZV0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2xvdHMoc2xvdHNbJ2RlZmF1bHQnXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufVxyXG4iLCIvKipcclxuICAgIENhbGVuZGFyU3luY2luZyBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQ2FsZW5kYXJTeW5jaW5nQWN0aXZpdHkoKSB7XHJcbiAgICBcclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICBcclxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuRnJlZWxhbmNlcjtcclxuXHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ1NjaGVkdWxpbmcnKTtcclxuICAgIFxyXG4gICAgLy8gQWRkaW5nIGF1dG8tc2VsZWN0IGJlaGF2aW9yIHRvIHRoZSBleHBvcnQgVVJMXHJcbiAgICB0aGlzLiRhY3Rpdml0eS5maW5kKCcjY2FsZW5kYXJTeW5jLWljYWxFeHBvcnRVcmwnKVxyXG4gICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuc2VsZWN0KCk7XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhzdGF0ZSkge1xyXG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBzdGF0ZSk7XHJcbiAgICBcclxuICAgIC8vIFJlcXVlc3QgYSBsb2FkLCBldmVuIGlmIGlzIGEgYmFja2dyb3VuZCBsb2FkIGFmdGVyIHRoZSBmaXJzdCB0aW1lOlxyXG4gICAgdGhpcy5hcHAubW9kZWwuY2FsZW5kYXJTeW5jaW5nLmxvYWQoKTtcclxuICAgIC8vIERpc2NhcmQgYW55IHByZXZpb3VzIHVuc2F2ZWQgZWRpdFxyXG4gICAgdGhpcy52aWV3TW9kZWwuZGlzY2FyZCgpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKGFwcCkge1xyXG5cclxuICAgIHZhciBjYWxlbmRhclN5bmNpbmcgPSBhcHAubW9kZWwuY2FsZW5kYXJTeW5jaW5nO1xyXG5cclxuICAgIHZhciBzeW5jVmVyc2lvbiA9IGNhbGVuZGFyU3luY2luZy5uZXdWZXJzaW9uKCk7XHJcbiAgICBzeW5jVmVyc2lvbi5pc09ic29sZXRlLnN1YnNjcmliZShmdW5jdGlvbihpdElzKSB7XHJcbiAgICAgICAgaWYgKGl0SXMpIHtcclxuICAgICAgICAgICAgLy8gbmV3IHZlcnNpb24gZnJvbSBzZXJ2ZXIgd2hpbGUgZWRpdGluZ1xyXG4gICAgICAgICAgICAvLyBGVVRVUkU6IHdhcm4gYWJvdXQgYSBuZXcgcmVtb3RlIHZlcnNpb24gYXNraW5nXHJcbiAgICAgICAgICAgIC8vIGNvbmZpcm1hdGlvbiB0byBsb2FkIHRoZW0gb3IgZGlzY2FyZCBhbmQgb3ZlcndyaXRlIHRoZW07XHJcbiAgICAgICAgICAgIC8vIHRoZSBzYW1lIGlzIG5lZWQgb24gc2F2ZSgpLCBhbmQgb24gc2VydmVyIHJlc3BvbnNlXHJcbiAgICAgICAgICAgIC8vIHdpdGggYSA1MDk6Q29uZmxpY3Qgc3RhdHVzIChpdHMgYm9keSBtdXN0IGNvbnRhaW4gdGhlXHJcbiAgICAgICAgICAgIC8vIHNlcnZlciB2ZXJzaW9uKS5cclxuICAgICAgICAgICAgLy8gUmlnaHQgbm93LCBqdXN0IG92ZXJ3cml0ZSBjdXJyZW50IGNoYW5nZXMgd2l0aFxyXG4gICAgICAgICAgICAvLyByZW1vdGUgb25lczpcclxuICAgICAgICAgICAgc3luY1ZlcnNpb24ucHVsbCh7IGV2ZW5JZk5ld2VyOiB0cnVlIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBBY3R1YWwgZGF0YSBmb3IgdGhlIGZvcm06XHJcbiAgICB0aGlzLnN5bmMgPSBzeW5jVmVyc2lvbi52ZXJzaW9uO1xyXG5cclxuICAgIHRoaXMuaXNMb2NrZWQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNMb2NrZWQoKSB8fCB0aGlzLmlzUmVzZXRpbmcoKTtcclxuICAgIH0sIGNhbGVuZGFyU3luY2luZyk7XHJcblxyXG4gICAgdGhpcy5zdWJtaXRUZXh0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKCkgPyBcclxuICAgICAgICAgICAgICAgICdsb2FkaW5nLi4uJyA6IFxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc1NhdmluZygpID8gXHJcbiAgICAgICAgICAgICAgICAgICAgJ3NhdmluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgICAgICAnU2F2ZSdcclxuICAgICAgICApO1xyXG4gICAgfSwgY2FsZW5kYXJTeW5jaW5nKTtcclxuICAgIFxyXG4gICAgdGhpcy5yZXNldFRleHQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5pc1Jlc2V0aW5nKCkgPyBcclxuICAgICAgICAgICAgICAgICdyZXNldGluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgICdSZXNldCBQcml2YXRlIFVSTCdcclxuICAgICAgICApO1xyXG4gICAgfSwgY2FsZW5kYXJTeW5jaW5nKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNjYXJkID0gZnVuY3Rpb24gZGlzY2FyZCgpIHtcclxuICAgICAgICBzeW5jVmVyc2lvbi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICAgICAgLy8gRm9yY2UgdG8gc2F2ZSwgZXZlbiBpZiB0aGVyZSB3YXMgcmVtb3RlIHVwZGF0ZXNcclxuICAgICAgICBzeW5jVmVyc2lvbi5wdXNoKHsgZXZlbklmT2Jzb2xldGU6IHRydWUgfSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLnJlc2V0ID0gZnVuY3Rpb24gcmVzZXQoKSB7XHJcbiAgICAgICAgY2FsZW5kYXJTeW5jaW5nLnJlc2V0RXhwb3J0VXJsKCk7XHJcbiAgICB9O1xyXG59XHJcbiIsIi8qKlxuICAgIENsaWVudEVkaXRpb24gYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBDbGllbnRFZGl0aW9uQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ2NsaWVudHMnKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG52YXIgQ2xpZW50ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0NsaWVudCcpO1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgXG4gICAgdGhpcy5jbGllbnQgPSBrby5vYnNlcnZhYmxlKG5ldyBDbGllbnQoKSk7XG4gICAgXG4gICAgdGhpcy5oZWFkZXIgPSBrby5vYnNlcnZhYmxlKCdFZGl0IExvY2F0aW9uJyk7XG4gICAgXG4gICAgLy8gVE9ET1xuICAgIHRoaXMuc2F2ZSA9IGZ1bmN0aW9uKCkge307XG4gICAgdGhpcy5jYW5jZWwgPSBmdW5jdGlvbigpIHt9O1xufVxuIiwiLyoqXHJcbiAgICBjbGllbnRzIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKSxcclxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyk7XHJcbiAgICBcclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG5cclxudmFyIHNpbmdsZXRvbiA9IG51bGw7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0Q2xpZW50cygkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXHJcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IENsaWVudHNBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XHJcbiAgICBcclxuICAgIHJldHVybiBzaW5nbGV0b247XHJcbn07XHJcblxyXG5mdW5jdGlvbiBDbGllbnRzQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkZyZWVsYW5jZXI7XHJcbiAgICBcclxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignQ2xpZW50cycpO1xyXG4gICAgXHJcbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcclxuICAgIHRoaXMuYXBwID0gYXBwO1xyXG4gICAgdGhpcy4kaW5kZXggPSAkYWN0aXZpdHkuZmluZCgnI2NsaWVudHNJbmRleCcpO1xyXG4gICAgdGhpcy4kbGlzdFZpZXcgPSAkYWN0aXZpdHkuZmluZCgnI2NsaWVudHNMaXN0VmlldycpO1xyXG5cclxuICAgIHRoaXMuZGF0YVZpZXcgPSBuZXcgVmlld01vZGVsKCk7XHJcbiAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMuZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xyXG5cclxuICAgIC8vIFRlc3RpbmdEYXRhXHJcbiAgICB0aGlzLmRhdGFWaWV3LmNsaWVudHMocmVxdWlyZSgnLi4vdGVzdGRhdGEvY2xpZW50cycpLmNsaWVudHMpO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyIHRvIHVwZGF0ZSBoZWFkZXIgYmFzZWQgb24gYSBtb2RlIGNoYW5nZTpcclxuICAgIHRoaXMuZGF0YVZpZXcuaXNTZWxlY3Rpb25Nb2RlLnN1YnNjcmliZShmdW5jdGlvbiAoaXRJcykge1xyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuaGVhZGVyVGV4dChpdElzID8gJ1NlbGVjdCBhIGNsaWVudCcgOiAnJyk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIC8vIE9iamVjdCB0byBob2xkIHRoZSBvcHRpb25zIHBhc3NlZCBvbiAnc2hvdycgYXMgYSByZXN1bHRcclxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyIHRvIGdvIGJhY2sgd2l0aCB0aGUgc2VsZWN0ZWQgY2xpZW50IHdoZW4gXHJcbiAgICAvLyB0aGVyZSBpcyBvbmUgc2VsZWN0ZWQgYW5kIHJlcXVlc3RJbmZvIGlzIGZvclxyXG4gICAgLy8gJ3NlbGVjdCBtb2RlJ1xyXG4gICAgdGhpcy5kYXRhVmlldy5zZWxlY3RlZENsaWVudC5zdWJzY3JpYmUoZnVuY3Rpb24gKHRoZVNlbGVjdGVkQ2xpZW50KSB7XHJcbiAgICAgICAgLy8gV2UgaGF2ZSBhIHJlcXVlc3QgYW5kXHJcbiAgICAgICAgLy8gaXQgcmVxdWVzdGVkIHRvIHNlbGVjdCBhIGNsaWVudCxcclxuICAgICAgICAvLyBhbmQgYSBzZWxlY3RlZCBjbGllbnRcclxuICAgICAgICBpZiAodGhpcy5yZXF1ZXN0SW5mbyAmJlxyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvLnNlbGVjdENsaWVudCA9PT0gdHJ1ZSAmJlxyXG4gICAgICAgICAgICB0aGVTZWxlY3RlZENsaWVudCkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gUGFzcyB0aGUgc2VsZWN0ZWQgY2xpZW50IGluIHRoZSBpbmZvXHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8uc2VsZWN0ZWRDbGllbnQgPSB0aGVTZWxlY3RlZENsaWVudDtcclxuICAgICAgICAgICAgLy8gQW5kIGdvIGJhY2tcclxuICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ29CYWNrKHRoaXMucmVxdWVzdEluZm8pO1xyXG4gICAgICAgICAgICAvLyBMYXN0LCBjbGVhciByZXF1ZXN0SW5mb1xyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59XHJcblxyXG5DbGllbnRzQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcclxuXHJcbiAgICAvLyBPbiBldmVyeSBzaG93LCBzZWFyY2ggZ2V0cyByZXNldGVkXHJcbiAgICB0aGlzLmRhdGFWaWV3LnNlYXJjaFRleHQoJycpO1xyXG4gIFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gb3B0aW9ucztcclxuXHJcbiAgICB0aGlzLmRhdGFWaWV3LmlzU2VsZWN0aW9uTW9kZShvcHRpb25zLnNlbGVjdENsaWVudCA9PT0gdHJ1ZSk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XHJcblxyXG4gICAgdGhpcy5oZWFkZXJUZXh0ID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcblxyXG4gICAgLy8gRXNwZWNpYWwgbW9kZSB3aGVuIGluc3RlYWQgb2YgcGljayBhbmQgZWRpdCB3ZSBhcmUganVzdCBzZWxlY3RpbmdcclxuICAgIC8vICh3aGVuIGVkaXRpbmcgYW4gYXBwb2ludG1lbnQpXHJcbiAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZSA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG5cclxuICAgIC8vIEZ1bGwgbGlzdCBvZiBjbGllbnRzXHJcbiAgICB0aGlzLmNsaWVudHMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xyXG4gICAgXHJcbiAgICAvLyBTZWFyY2ggdGV4dCwgdXNlZCB0byBmaWx0ZXIgJ2NsaWVudHMnXHJcbiAgICB0aGlzLnNlYXJjaFRleHQgPSBrby5vYnNlcnZhYmxlKCcnKTtcclxuICAgIFxyXG4gICAgLy8gVXRpbGl0eSB0byBnZXQgYSBmaWx0ZXJlZCBsaXN0IG9mIGNsaWVudHMgYmFzZWQgb24gY2xpZW50c1xyXG4gICAgdGhpcy5nZXRGaWx0ZXJlZExpc3QgPSBmdW5jdGlvbiBnZXRGaWx0ZXJlZExpc3QoKSB7XHJcbiAgICAgICAgdmFyIHMgPSAodGhpcy5zZWFyY2hUZXh0KCkgfHwgJycpLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudHMoKS5maWx0ZXIoZnVuY3Rpb24oY2xpZW50KSB7XHJcbiAgICAgICAgICAgIHZhciBuID0gY2xpZW50ICYmIGNsaWVudC5mdWxsTmFtZSgpIHx8ICcnO1xyXG4gICAgICAgICAgICBuID0gbi50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICByZXR1cm4gbi5pbmRleE9mKHMpID4gLTE7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEZpbHRlcmVkIGxpc3Qgb2YgY2xpZW50c1xyXG4gICAgdGhpcy5maWx0ZXJlZENsaWVudHMgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRGaWx0ZXJlZExpc3QoKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICAvLyBHcm91cGVkIGxpc3Qgb2YgZmlsdGVyZWQgY2xpZW50c1xyXG4gICAgdGhpcy5ncm91cGVkQ2xpZW50cyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIHZhciBjbGllbnRzID0gdGhpcy5maWx0ZXJlZENsaWVudHMoKS5zb3J0KGZ1bmN0aW9uKGNsaWVudEEsIGNsaWVudEIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNsaWVudEEuZmlyc3ROYW1lKCkgPiBjbGllbnRCLmZpcnN0TmFtZSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBncm91cHMgPSBbXSxcclxuICAgICAgICAgICAgbGF0ZXN0R3JvdXAgPSBudWxsLFxyXG4gICAgICAgICAgICBsYXRlc3RMZXR0ZXIgPSBudWxsO1xyXG5cclxuICAgICAgICBjbGllbnRzLmZvckVhY2goZnVuY3Rpb24oY2xpZW50KSB7XHJcbiAgICAgICAgICAgIHZhciBsZXR0ZXIgPSAoY2xpZW50LmZpcnN0TmFtZSgpWzBdIHx8ICcnKS50b1VwcGVyQ2FzZSgpO1xyXG4gICAgICAgICAgICBpZiAobGV0dGVyICE9PSBsYXRlc3RMZXR0ZXIpIHtcclxuICAgICAgICAgICAgICAgIGxhdGVzdEdyb3VwID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldHRlcjogbGV0dGVyLFxyXG4gICAgICAgICAgICAgICAgICAgIGNsaWVudHM6IFtjbGllbnRdXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgZ3JvdXBzLnB1c2gobGF0ZXN0R3JvdXApO1xyXG4gICAgICAgICAgICAgICAgbGF0ZXN0TGV0dGVyID0gbGV0dGVyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbGF0ZXN0R3JvdXAuY2xpZW50cy5wdXNoKGNsaWVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdyb3VwcztcclxuXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZWxlY3RlZENsaWVudCA9IGtvLm9ic2VydmFibGUobnVsbCk7XHJcbiAgICBcclxuICAgIHRoaXMuc2VsZWN0Q2xpZW50ID0gZnVuY3Rpb24oc2VsZWN0ZWRDbGllbnQpIHtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnNlbGVjdGVkQ2xpZW50KHNlbGVjdGVkQ2xpZW50KTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxufVxyXG4iLCIvKipcbiAgICBDTVMgYWN0aXZpdHlcbiAgICAoQ2xpZW50IE1hbmFnZW1lbnQgU3lzdGVtKVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBDbXNBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIFxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCgpO1xuICAgIFxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU2VjdGlvbk5hdkJhcignQ2xpZW50IG1hbmFnZW1lbnQnKTtcbiAgICBcbiAgICAvLyBLZWVwIGNsaWVudHNDb3VudCB1cGRhdGVkXG4gICAgLy8gVE9ETyB0aGlzLmFwcC5tb2RlbC5jbGllbnRzXG4gICAgdmFyIGNsaWVudHMgPSBrby5vYnNlcnZhYmxlQXJyYXkocmVxdWlyZSgnLi4vdGVzdGRhdGEvY2xpZW50cycpLmNsaWVudHMpO1xuICAgIHRoaXMudmlld01vZGVsLmNsaWVudHNDb3VudChjbGllbnRzKCkubGVuZ3RoKTtcbiAgICBjbGllbnRzLnN1YnNjcmliZShmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy52aWV3TW9kZWwuY2xpZW50c0NvdW50KGNsaWVudHMoKS5sZW5ndGgpO1xuICAgIH0uYmluZCh0aGlzKSk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgXG4gICAgdGhpcy5jbGllbnRzQ291bnQgPSBrby5vYnNlcnZhYmxlKCk7XG59XG4iLCIvKipcbiAgICBDb250YWN0Rm9ybSBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIENvbnRhY3RGb3JtQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ1RhbGsgdG8gdXMnKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgXG4gICAgdGhpcy5tZXNzYWdlID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgdGhpcy53YXNTZW50ID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG5cbiAgICB2YXIgdXBkYXRlV2FzU2VudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLndhc1NlbnQoZmFsc2UpO1xuICAgIH0uYmluZCh0aGlzKTtcbiAgICB0aGlzLm1lc3NhZ2Uuc3Vic2NyaWJlKHVwZGF0ZVdhc1NlbnQpO1xuICAgIFxuICAgIHRoaXMuc2VuZCA9IGZ1bmN0aW9uIHNlbmQoKSB7XG4gICAgICAgIC8vIFRPRE86IFNlbmRcbiAgICAgICAgXG4gICAgICAgIC8vIFJlc2V0IGFmdGVyIGJlaW5nIHNlbnRcbiAgICAgICAgdGhpcy5tZXNzYWdlKCcnKTtcbiAgICAgICAgdGhpcy53YXNTZW50KHRydWUpO1xuXG4gICAgfS5iaW5kKHRoaXMpO1xufVxuIiwiLyoqXG4gICAgQ29udGFjdEluZm8gYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2luZ2xldG9uID0gbnVsbCxcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKSxcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0Q29udGFjdEluZm8oJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBDb250YWN0SW5mb0FjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcbiAgICBcbiAgICByZXR1cm4gc2luZ2xldG9uO1xufTtcblxuZnVuY3Rpb24gQ29udGFjdEluZm9BY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIFxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIHRoaXMuZGF0YVZpZXcgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgdGhpcy5kYXRhVmlldy5wcm9maWxlID0gYXBwLm1vZGVsLnVzZXI7XG4gICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLmRhdGFWaWV3LCAkYWN0aXZpdHkuZ2V0KDApKTtcblxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XG4gICAgICAgIHRpdGxlOiAnJyxcbiAgICAgICAgbGVmdEFjdGlvbjogTmF2QWN0aW9uLmdvQmFjay5tb2RlbC5jbG9uZSh7XG4gICAgICAgICAgICB0ZXh0OiAnQWNjb3VudCcsXG4gICAgICAgICAgICBpc1RpdGxlOiB0cnVlXG4gICAgICAgIH0pLFxuICAgICAgICByaWdodEFjdGlvbjogTmF2QWN0aW9uLmdvSGVscEluZGV4XG4gICAgfSk7XG4gICAgXG4gICAgYXBwLm1vZGVsLnVzZXIoKS5vbmJvYXJkaW5nU3RlcC5zdWJzY3JpYmUoZnVuY3Rpb24gKHN0ZXApIHtcbiAgICAgICAgXG4gICAgICAgIGlmIChzdGVwKSB7XG4gICAgICAgICAgICAvLyBUT0RPIFNldCBuYXZiYXIgc3RlcCBpbmRleFxuICAgICAgICAgICAgLy8gU2V0dGluZyBuYXZiYXIgZm9yIE9uYm9hcmRpbmcvd2l6YXJkIG1vZGVcbiAgICAgICAgICAgIHRoaXMubmF2QmFyLmxlZnRBY3Rpb24oKS50ZXh0KCcnKTtcbiAgICAgICAgICAgIC8vIFNldHRpbmcgaGVhZGVyXG4gICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmhlYWRlclRleHQoJ0hvdyBjYW4gd2UgcmVhY2ggeW91PycpO1xuICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5idXR0b25UZXh0KCdTYXZlIGFuZCBjb250aW51ZScpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gVE9ETyBSZW1vdmUgc3RlcCBpbmRleFxuICAgICAgICAgICAgLy8gU2V0dGluZyBuYXZiYXIgdG8gZGVmYXVsdFxuICAgICAgICAgICAgdGhpcy5uYXZCYXIubGVmdEFjdGlvbigpLnRleHQoJ0FjY291bnQnKTtcbiAgICAgICAgICAgIC8vIFNldHRpbmcgaGVhZGVyIHRvIGRlZmF1bHRcbiAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcuaGVhZGVyVGV4dCgnQ29udGFjdCBpbmZvcm1hdGlvbicpO1xuICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5idXR0b25UZXh0KCdTYXZlJyk7XG4gICAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xufVxuXG5Db250YWN0SW5mb0FjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG5cbn07XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcblxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJ0NvbnRhY3QgaW5mb3JtYXRpb24nKTtcbiAgICB0aGlzLmJ1dHRvblRleHQgPSBrby5vYnNlcnZhYmxlKCdTYXZlJyk7XG4gICAgdGhpcy5wcm9maWxlID0ga28ub2JzZXJ2YWJsZSgpO1xufVxuIiwiLyoqXG4gICAgQ29udmVyc2F0aW9uIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQ29udmVyc2F0aW9uQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ0luYm94Jyk7XG4gICAgXG4gICAgLy8gVGVzdGluZ0RhdGFcbiAgICBzZXRTb21lVGVzdGluZ0RhdGEodGhpcy52aWV3TW9kZWwpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcbiAgICBcbiAgICBpZiAoc3RhdGUgJiYgc3RhdGUucm91dGUgJiYgc3RhdGUucm91dGUuc2VnbWVudHMpIHtcbiAgICAgICAgdGhpcy52aWV3TW9kZWwuY29udmVyc2F0aW9uSUQocGFyc2VJbnQoc3RhdGUucm91dGUuc2VnbWVudHNbMF0sIDEwKSB8fCAwKTtcbiAgICB9XG59O1xuXG52YXIgTWFpbEZvbGRlciA9IHJlcXVpcmUoJy4uL21vZGVscy9NYWlsRm9sZGVyJyk7XG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG5cbiAgICB0aGlzLmluYm94ID0gbmV3IE1haWxGb2xkZXIoe1xuICAgICAgICB0b3BOdW1iZXI6IDIwXG4gICAgfSk7XG4gICAgXG4gICAgdGhpcy5jb252ZXJzYXRpb25JRCA9IGtvLm9ic2VydmFibGUobnVsbCk7XG4gICAgXG4gICAgdGhpcy5jb252ZXJzYXRpb24gPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb25JRCA9IHRoaXMuY29udmVyc2F0aW9uSUQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5ib3gubWVzc2FnZXMoKS5maWx0ZXIoZnVuY3Rpb24odikge1xuICAgICAgICAgICAgcmV0dXJuIHYgJiYgdi5pZCgpID09PSBjb25JRDtcbiAgICAgICAgfSk7XG4gICAgfSwgdGhpcyk7XG4gICAgXG4gICAgdGhpcy5zdWJqZWN0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbSA9IHRoaXMuY29udmVyc2F0aW9uKClbMF07XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBtID9cbiAgICAgICAgICAgIG0uc3ViamVjdCgpIDpcbiAgICAgICAgICAgICdDb252ZXJzYXRpb24gdy9vIHN1YmplY3QnXG4gICAgICAgICk7XG4gICAgICAgIFxuICAgIH0sIHRoaXMpO1xufVxuXG4vKiogVEVTVElORyBEQVRBICoqL1xuZnVuY3Rpb24gc2V0U29tZVRlc3RpbmdEYXRhKHZpZXdNb2RlbCkge1xuICAgIFxuICAgIHZpZXdNb2RlbC5pbmJveC5tZXNzYWdlcyhyZXF1aXJlKCcuLi90ZXN0ZGF0YS9tZXNzYWdlcycpLm1lc3NhZ2VzKTtcbn1cbiIsIi8qKlxyXG4gICAgZGF0ZXRpbWVQaWNrZXIgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIFRpbWUgPSByZXF1aXJlKCcuLi91dGlscy9UaW1lJyksXHJcbiAgICBOYXZCYXIgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkJhcicpLFxyXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcclxucmVxdWlyZSgnLi4vY29tcG9uZW50cy9EYXRlUGlja2VyJyk7XHJcbiAgICBcclxudmFyIHNpbmdsZXRvbiA9IG51bGw7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0RGF0ZXRpbWVQaWNrZXIoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxyXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBEYXRldGltZVBpY2tlckFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcclxuXHJcbiAgICByZXR1cm4gc2luZ2xldG9uO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gRGF0ZXRpbWVQaWNrZXJBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcclxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XHJcbiAgICAgICAgdGl0bGU6ICcnLFxyXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5nb0JhY2ssXHJcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5nb0hlbHBJbmRleFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMuYXBwID0gYXBwO1xyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLiRkYXRlUGlja2VyID0gJGFjdGl2aXR5LmZpbmQoJyNkYXRldGltZVBpY2tlckRhdGVQaWNrZXInKTtcclxuICAgIHRoaXMuJHRpbWVQaWNrZXIgPSAkYWN0aXZpdHkuZmluZCgnI2RhdGV0aW1lUGlja2VyVGltZVBpY2tlcicpO1xyXG5cclxuICAgIC8qIEluaXQgY29tcG9uZW50cyAqL1xyXG4gICAgdGhpcy4kZGF0ZVBpY2tlci5zaG93KCkuZGF0ZXBpY2tlcigpO1xyXG4gICAgXHJcbiAgICB2YXIgZGF0YVZpZXcgPSB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xyXG4gICAgZGF0YVZpZXcuaGVhZGVyVGV4dCA9ICdTZWxlY3QgYSBzdGFydCB0aW1lJztcclxuICAgIGtvLmFwcGx5QmluZGluZ3MoZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xyXG4gICAgXHJcbiAgICAvLyBFdmVudHNcclxuICAgIHRoaXMuJGRhdGVQaWNrZXIub24oJ2NoYW5nZURhdGUnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgaWYgKGUudmlld01vZGUgPT09ICdkYXlzJykge1xyXG4gICAgICAgICAgICBkYXRhVmlldy5zZWxlY3RlZERhdGUoZS5kYXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgXHJcbiAgICAvLyBUZXN0aW5nRGF0YVxyXG4gICAgZGF0YVZpZXcuc2xvdHNEYXRhID0gcmVxdWlyZSgnLi4vdGVzdGRhdGEvdGltZVNsb3RzJykudGltZVNsb3RzO1xyXG4gXHJcbiAgICBkYXRhVmlldy5zZWxlY3RlZERhdGUuc3Vic2NyaWJlKGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgICAgICB0aGlzLmJpbmREYXRlRGF0YShkYXRlKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgdGhpcy5iaW5kRGF0ZURhdGEobmV3IERhdGUoKSk7XHJcbiAgICBcclxuICAgIC8vIE9iamVjdCB0byBob2xkIHRoZSBvcHRpb25zIHBhc3NlZCBvbiAnc2hvdycgYXMgYSByZXN1bHRcclxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyIHRvIGdvIGJhY2sgd2l0aCB0aGUgc2VsZWN0ZWQgZGF0ZS10aW1lIHdoZW5cclxuICAgIC8vIHRoYXQgc2VsZWN0aW9uIGlzIGRvbmUgKGNvdWxkIGJlIHRvIG51bGwpXHJcbiAgICB0aGlzLmRhdGFWaWV3LnNlbGVjdGVkRGF0ZXRpbWUuc3Vic2NyaWJlKGZ1bmN0aW9uIChkYXRldGltZSkge1xyXG4gICAgICAgIC8vIFdlIGhhdmUgYSByZXF1ZXN0XHJcbiAgICAgICAgaWYgKHRoaXMucmVxdWVzdEluZm8pIHtcclxuICAgICAgICAgICAgLy8gUGFzcyB0aGUgc2VsZWN0ZWQgZGF0ZXRpbWUgaW4gdGhlIGluZm9cclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mby5zZWxlY3RlZERhdGV0aW1lID0gdGhpcy5kYXRhVmlldy5zZWxlY3RlZERhdGV0aW1lKCk7XHJcbiAgICAgICAgICAgIC8vIEFuZCBnbyBiYWNrXHJcbiAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvQmFjayh0aGlzLnJlcXVlc3RJbmZvKTtcclxuICAgICAgICAgICAgLy8gTGFzdCwgY2xlYXIgcmVxdWVzdEluZm9cclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufVxyXG5cclxuRGF0ZXRpbWVQaWNrZXJBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG4gIFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gb3B0aW9ucztcclxufTtcclxuXHJcbkRhdGV0aW1lUGlja2VyQWN0aXZpdHkucHJvdG90eXBlLmJpbmREYXRlRGF0YSA9IGZ1bmN0aW9uIGJpbmREYXRlRGF0YShkYXRlKSB7XHJcblxyXG4gICAgdmFyIHNkYXRlID0gbW9tZW50KGRhdGUpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xyXG4gICAgdmFyIHNsb3RzRGF0YSA9IHRoaXMuZGF0YVZpZXcuc2xvdHNEYXRhO1xyXG5cclxuICAgIGlmIChzbG90c0RhdGEuaGFzT3duUHJvcGVydHkoc2RhdGUpKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5zbG90cyhzbG90c0RhdGFbc2RhdGVdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5zbG90cyhzbG90c0RhdGFbJ2RlZmF1bHQnXSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XHJcblxyXG4gICAgdGhpcy5oZWFkZXJUZXh0ID0ga28ub2JzZXJ2YWJsZSgnU2VsZWN0IGEgdGltZScpO1xyXG4gICAgdGhpcy5zZWxlY3RlZERhdGUgPSBrby5vYnNlcnZhYmxlKG5ldyBEYXRlKCkpO1xyXG4gICAgdGhpcy5zbG90c0RhdGEgPSB7fTtcclxuICAgIHRoaXMuc2xvdHMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xyXG4gICAgdGhpcy5ncm91cGVkU2xvdHMgPSBrby5jb21wdXRlZChmdW5jdGlvbigpe1xyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICBiZWZvcmUgMTI6MDBwbSAobm9vbikgPSBtb3JuaW5nXHJcbiAgICAgICAgICBhZnRlcm5vb246IDEyOjAwcG0gdW50aWwgNTowMHBtXHJcbiAgICAgICAgICBldmVuaW5nOiA1OjAwcG0gLSAxMTo1OXBtXHJcbiAgICAgICAgKi9cclxuICAgICAgICAvLyBTaW5jZSBzbG90cyBtdXN0IGJlIGZvciB0aGUgc2FtZSBkYXRlLFxyXG4gICAgICAgIC8vIHRvIGRlZmluZSB0aGUgZ3JvdXBzIHJhbmdlcyB1c2UgdGhlIGZpcnN0IGRhdGVcclxuICAgICAgICB2YXIgZGF0ZVBhcnQgPSB0aGlzLnNsb3RzKCkgJiYgdGhpcy5zbG90cygpWzBdIHx8IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgdmFyIGdyb3VwcyA9IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZ3JvdXA6ICdNb3JuaW5nJyxcclxuICAgICAgICAgICAgICAgIHNsb3RzOiBbXSxcclxuICAgICAgICAgICAgICAgIHN0YXJ0czogbmV3IFRpbWUoZGF0ZVBhcnQsIDAsIDApLFxyXG4gICAgICAgICAgICAgICAgZW5kczogbmV3IFRpbWUoZGF0ZVBhcnQsIDEyLCAwKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBncm91cDogJ0FmdGVybm9vbicsXHJcbiAgICAgICAgICAgICAgICBzbG90czogW10sXHJcbiAgICAgICAgICAgICAgICBzdGFydHM6IG5ldyBUaW1lKGRhdGVQYXJ0LCAxMiwgMCksXHJcbiAgICAgICAgICAgICAgICBlbmRzOiBuZXcgVGltZShkYXRlUGFydCwgMTcsIDApXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGdyb3VwOiAnRXZlbmluZycsXHJcbiAgICAgICAgICAgICAgICBzbG90czogW10sXHJcbiAgICAgICAgICAgICAgICBzdGFydHM6IG5ldyBUaW1lKGRhdGVQYXJ0LCAxNywgMCksXHJcbiAgICAgICAgICAgICAgICBlbmRzOiBuZXcgVGltZShkYXRlUGFydCwgMjQsIDApXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdO1xyXG4gICAgICAgIHZhciBzbG90cyA9IHRoaXMuc2xvdHMoKS5zb3J0KCk7XHJcbiAgICAgICAgc2xvdHMuZm9yRWFjaChmdW5jdGlvbihzbG90KSB7XHJcbiAgICAgICAgICAgIGdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uKGdyb3VwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2xvdCA+PSBncm91cC5zdGFydHMgJiZcclxuICAgICAgICAgICAgICAgICAgICBzbG90IDwgZ3JvdXAuZW5kcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwLnNsb3RzLnB1c2goc2xvdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gZ3JvdXBzO1xyXG5cclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlbGVjdGVkRGF0ZXRpbWUgPSBrby5vYnNlcnZhYmxlKG51bGwpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlbGVjdERhdGV0aW1lID0gZnVuY3Rpb24oc2VsZWN0ZWREYXRldGltZSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWREYXRldGltZShzZWxlY3RlZERhdGV0aW1lKTtcclxuXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcblxyXG59XHJcbiIsIi8qKlxuICAgIEZhcXMgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBGYXFzQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ1RhbGsgdG8gdXMnKTtcbiAgICBcbiAgICAvLyBUZXN0aW5nRGF0YVxuICAgIHNldFNvbWVUZXN0aW5nRGF0YSh0aGlzLnZpZXdNb2RlbCk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhzdGF0ZSkge1xuICAgIFxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xuICAgIFxuICAgIHRoaXMudmlld01vZGVsLnNlYXJjaFRleHQoJycpO1xufTtcblxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG4gICAgdGhpcy5mYXFzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcbiAgICB0aGlzLnNlYXJjaFRleHQgPSBrby5vYnNlcnZhYmxlKCcnKTtcbiAgICBcbiAgICB0aGlzLmZpbHRlcmVkRmFxcyA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHMgPSB0aGlzLnNlYXJjaFRleHQoKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICByZXR1cm4gdGhpcy5mYXFzKCkuZmlsdGVyKGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICAgIHZhciBuID0gdiAmJiB2LnRpdGxlKCkgfHwgJyc7XG4gICAgICAgICAgICBuICs9IHYgJiYgdi5kZXNjcmlwdGlvbigpIHx8ICcnO1xuICAgICAgICAgICAgbiA9IG4udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHJldHVybiBuLmluZGV4T2YocykgPiAtMTtcbiAgICAgICAgfSk7XG4gICAgfSwgdGhpcyk7XG59XG5cbnZhciBNb2RlbCA9IHJlcXVpcmUoJy4uL21vZGVscy9Nb2RlbCcpO1xuZnVuY3Rpb24gRmFxKHZhbHVlcykge1xuICAgIFxuICAgIE1vZGVsKHRoaXMpO1xuXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcbiAgICAgICAgaWQ6IDAsXG4gICAgICAgIHRpdGxlOiAnJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICcnXG4gICAgfSwgdmFsdWVzKTtcbn1cblxuLyoqIFRFU1RJTkcgREFUQSAqKi9cbmZ1bmN0aW9uIHNldFNvbWVUZXN0aW5nRGF0YSh2aWV3TW9kZWwpIHtcbiAgICBcbiAgICB2YXIgdGVzdGRhdGEgPSBbXG4gICAgICAgIG5ldyBGYXEoe1xuICAgICAgICAgICAgaWQ6IDEsXG4gICAgICAgICAgICB0aXRsZTogJ0hvdyBkbyBJIHNldCB1cCBhIG1hcmtldHBsYWNlIHByb2ZpbGU/JyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGVzY3JpcHRpb24gYWJvdXQgaG93IEkgc2V0IHVwIGEgbWFya2V0cGxhY2UgcHJvZmlsZSdcbiAgICAgICAgfSksXG4gICAgICAgIG5ldyBGYXEoe1xuICAgICAgICAgICAgaWQ6IDIsXG4gICAgICAgICAgICB0aXRsZTogJ0Fub3RoZXIgZmFxJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQW5vdGhlciBkZXNjcmlwdGlvbidcbiAgICAgICAgfSlcbiAgICBdO1xuICAgIHZpZXdNb2RlbC5mYXFzKHRlc3RkYXRhKTtcbn1cbiIsIi8qKlxuICAgIEZlZWRiYWNrIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gRmVlZGJhY2tBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKCdUYWxrIHRvIHVzJyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuIiwiLyoqXG4gICAgRmVlZGJhY2tGb3JtIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gRmVlZGJhY2tGb3JtQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ1RhbGsgdG8gdXMnKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgXG4gICAgdGhpcy5tZXNzYWdlID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgdGhpcy5iZWNvbWVDb2xsYWJvcmF0b3IgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcbiAgICB0aGlzLndhc1NlbnQgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcblxuICAgIHZhciB1cGRhdGVXYXNTZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMud2FzU2VudChmYWxzZSk7XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIHRoaXMubWVzc2FnZS5zdWJzY3JpYmUodXBkYXRlV2FzU2VudCk7XG4gICAgdGhpcy5iZWNvbWVDb2xsYWJvcmF0b3Iuc3Vic2NyaWJlKHVwZGF0ZVdhc1NlbnQpO1xuICAgIFxuICAgIHRoaXMuc2VuZCA9IGZ1bmN0aW9uIHNlbmQoKSB7XG4gICAgICAgIC8vIFRPRE86IFNlbmRcbiAgICAgICAgXG4gICAgICAgIC8vIFJlc2V0IGFmdGVyIGJlaW5nIHNlbnRcbiAgICAgICAgdGhpcy5tZXNzYWdlKCcnKTtcbiAgICAgICAgdGhpcy5iZWNvbWVDb2xsYWJvcmF0b3IoZmFsc2UpO1xuICAgICAgICB0aGlzLndhc1NlbnQodHJ1ZSk7XG5cbiAgICB9LmJpbmQodGhpcyk7XG59XG4iLCIvKipcbiAgICBIb21lIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKSxcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xuXG52YXIgc2luZ2xldG9uID0gbnVsbDtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdEhvbWUoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBIb21lQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xuICAgIFxuICAgIHJldHVybiBzaW5nbGV0b247XG59O1xuXG5mdW5jdGlvbiBIb21lQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkN1c3RvbWVyO1xuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XG4gICAgICAgIHRpdGxlOiBudWxsLCAvLyBudWxsIGZvciBsb2dvXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5tZW51TmV3SXRlbSxcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5tZW51SW5cbiAgICB9KTtcblxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIHRoaXMuJG5leHRCb29raW5nID0gJGFjdGl2aXR5LmZpbmQoJyNob21lTmV4dEJvb2tpbmcnKTtcbiAgICB0aGlzLiR1cGNvbWluZ0Jvb2tpbmdzID0gJGFjdGl2aXR5LmZpbmQoJyNob21lVXBjb21pbmdCb29raW5ncycpO1xuICAgIHRoaXMuJGluYm94ID0gJGFjdGl2aXR5LmZpbmQoJyNob21lSW5ib3gnKTtcbiAgICB0aGlzLiRwZXJmb3JtYW5jZSA9ICRhY3Rpdml0eS5maW5kKCcjaG9tZVBlcmZvcm1hbmNlJyk7XG4gICAgdGhpcy4kZ2V0TW9yZSA9ICRhY3Rpdml0eS5maW5kKCcjaG9tZUdldE1vcmUnKTtcblxuICAgIHRoaXMuZGF0YVZpZXcgPSBuZXcgVmlld01vZGVsKCk7XG4gICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLmRhdGFWaWV3LCAkYWN0aXZpdHkuZ2V0KDApKTtcblxuICAgIC8vIFRlc3RpbmdEYXRhXG4gICAgc2V0U29tZVRlc3RpbmdEYXRhKHRoaXMuZGF0YVZpZXcpO1xuXG4gICAgLy8gT2JqZWN0IHRvIGhvbGQgdGhlIG9wdGlvbnMgcGFzc2VkIG9uICdzaG93JyBhcyBhIHJlc3VsdFxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gbnVsbDtcbn1cblxuSG9tZUFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG4gXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG9wdGlvbnM7XG4gICAgdmFyIHYgPSB0aGlzLmRhdGFWaWV3LFxuICAgICAgICBhcHBNb2RlbCA9IHRoaXMuYXBwLm1vZGVsO1xuICAgIFxuICAgIC8vIFVwZGF0ZSBkYXRhXG4gICAgYXBwTW9kZWwuZ2V0VXBjb21pbmdCb29raW5ncygpLnRoZW4oZnVuY3Rpb24odXBjb21pbmcpIHtcblxuICAgICAgICBpZiAodXBjb21pbmcubmV4dEJvb2tpbmdJRClcbiAgICAgICAgICAgIGFwcE1vZGVsLmdldEJvb2tpbmcodXBjb21pbmcubmV4dEJvb2tpbmdJRCkudGhlbih2Lm5leHRCb29raW5nKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdi5uZXh0Qm9va2luZyhudWxsKTtcblxuICAgICAgICB2LnVwY29taW5nQm9va2luZ3MudG9kYXkucXVhbnRpdHkodXBjb21pbmcudG9kYXkucXVhbnRpdHkpO1xuICAgICAgICB2LnVwY29taW5nQm9va2luZ3MudG9kYXkudGltZSh1cGNvbWluZy50b2RheS50aW1lICYmIG5ldyBEYXRlKHVwY29taW5nLnRvZGF5LnRpbWUpKTtcbiAgICAgICAgdi51cGNvbWluZ0Jvb2tpbmdzLnRvbW9ycm93LnF1YW50aXR5KHVwY29taW5nLnRvbW9ycm93LnF1YW50aXR5KTtcbiAgICAgICAgdi51cGNvbWluZ0Jvb2tpbmdzLnRvbW9ycm93LnRpbWUodXBjb21pbmcudG9tb3Jyb3cudGltZSAmJiBuZXcgRGF0ZSh1cGNvbWluZy50b21vcnJvdy50aW1lKSk7XG4gICAgICAgIHYudXBjb21pbmdCb29raW5ncy5uZXh0V2Vlay5xdWFudGl0eSh1cGNvbWluZy5uZXh0V2Vlay5xdWFudGl0eSk7XG4gICAgICAgIHYudXBjb21pbmdCb29raW5ncy5uZXh0V2Vlay50aW1lKHVwY29taW5nLm5leHRXZWVrLnRpbWUgJiYgbmV3IERhdGUodXBjb21pbmcubmV4dFdlZWsudGltZSkpO1xuICAgIH0pO1xufTtcblxudmFyIFVwY29taW5nQm9va2luZ3NTdW1tYXJ5ID0gcmVxdWlyZSgnLi4vbW9kZWxzL1VwY29taW5nQm9va2luZ3NTdW1tYXJ5JyksXG4gICAgTWFpbEZvbGRlciA9IHJlcXVpcmUoJy4uL21vZGVscy9NYWlsRm9sZGVyJyksXG4gICAgUGVyZm9ybWFuY2VTdW1tYXJ5ID0gcmVxdWlyZSgnLi4vbW9kZWxzL1BlcmZvcm1hbmNlU3VtbWFyeScpLFxuICAgIEdldE1vcmUgPSByZXF1aXJlKCcuLi9tb2RlbHMvR2V0TW9yZScpO1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG5cbiAgICB0aGlzLnVwY29taW5nQm9va2luZ3MgPSBuZXcgVXBjb21pbmdCb29raW5nc1N1bW1hcnkoKTtcblxuICAgIC8vIDpBcHBvaW50bWVudFxuICAgIHRoaXMubmV4dEJvb2tpbmcgPSBrby5vYnNlcnZhYmxlKG51bGwpO1xuICAgIFxuICAgIHRoaXMuaW5ib3ggPSBuZXcgTWFpbEZvbGRlcih7XG4gICAgICAgIHRvcE51bWJlcjogNFxuICAgIH0pO1xuICAgIFxuICAgIHRoaXMucGVyZm9ybWFuY2UgPSBuZXcgUGVyZm9ybWFuY2VTdW1tYXJ5KCk7XG4gICAgXG4gICAgdGhpcy5nZXRNb3JlID0gbmV3IEdldE1vcmUoKTtcbn1cblxuLyoqIFRFU1RJTkcgREFUQSAqKi9cbnZhciBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xuXG5mdW5jdGlvbiBzZXRTb21lVGVzdGluZ0RhdGEoZGF0YVZpZXcpIHtcbiAgICBcbiAgICBkYXRhVmlldy5pbmJveC5tZXNzYWdlcyhyZXF1aXJlKCcuLi90ZXN0ZGF0YS9tZXNzYWdlcycpLm1lc3NhZ2VzKTtcbiAgICBcbiAgICBkYXRhVmlldy5wZXJmb3JtYW5jZS5lYXJuaW5ncy5jdXJyZW50QW1vdW50KDI0MDApO1xuICAgIGRhdGFWaWV3LnBlcmZvcm1hbmNlLmVhcm5pbmdzLm5leHRBbW91bnQoNjIwMC41NCk7XG4gICAgZGF0YVZpZXcucGVyZm9ybWFuY2UudGltZUJvb2tlZC5wZXJjZW50KDAuOTMpO1xuICAgIFxuICAgIGRhdGFWaWV3LmdldE1vcmUubW9kZWwudXBkYXRlV2l0aCh7XG4gICAgICAgIGF2YWlsYWJpbGl0eTogdHJ1ZSxcbiAgICAgICAgcGF5bWVudHM6IHRydWUsXG4gICAgICAgIHByb2ZpbGU6IHRydWUsXG4gICAgICAgIGNvb3A6IHRydWVcbiAgICB9KTtcbn1cbiIsIi8qKlxuICAgIEluYm94IGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEluYm94QWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIoJ0luYm94Jyk7XG4gICAgXG4gICAgLy90aGlzLiRpbmJveCA9ICRhY3Rpdml0eS5maW5kKCcjaW5ib3hMaXN0Jyk7XG4gICAgXG4gICAgLy8gVGVzdGluZ0RhdGFcbiAgICBzZXRTb21lVGVzdGluZ0RhdGEodGhpcy52aWV3TW9kZWwpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxudmFyIE1haWxGb2xkZXIgPSByZXF1aXJlKCcuLi9tb2RlbHMvTWFpbEZvbGRlcicpO1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG5cbiAgICB0aGlzLmluYm94ID0gbmV3IE1haWxGb2xkZXIoe1xuICAgICAgICB0b3BOdW1iZXI6IDIwXG4gICAgfSk7XG4gICAgXG4gICAgdGhpcy5zZWFyY2hUZXh0ID0ga28ub2JzZXJ2YWJsZSgnJyk7XG59XG5cbi8qKiBURVNUSU5HIERBVEEgKiovXG5mdW5jdGlvbiBzZXRTb21lVGVzdGluZ0RhdGEoZGF0YVZpZXcpIHtcbiAgICBcbiAgICBkYXRhVmlldy5pbmJveC5tZXNzYWdlcyhyZXF1aXJlKCcuLi90ZXN0ZGF0YS9tZXNzYWdlcycpLm1lc3NhZ2VzKTtcbn1cbiIsIi8qKlxuICAgIEluZGV4IGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIHNpbmdsZXRvbiA9IG51bGwsXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKSxcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0SW5kZXgoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBJbmRleEFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcbiAgICBcbiAgICByZXR1cm4gc2luZ2xldG9uO1xufTtcblxuZnVuY3Rpb24gSW5kZXhBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBuZXcgTmF2QmFyKHtcbiAgICAgICAgdGl0bGU6IG51bGwsIC8vIG51bGwgZm9yIGxvZ29cbiAgICAgICAgbGVmdEFjdGlvbjogTmF2QWN0aW9uLmdvTG9naW4sXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBOYXZBY3Rpb24ubWVudU91dFxuICAgIH0pO1xuICAgIFxuICAgIC8vIEFueSB1c2VyIGNhbiBhY2Nlc3MgdGhpc1xuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBudWxsO1xufVxuXG5JbmRleEFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG4gICAgLy8gSXQgY2hlY2tzIGlmIHRoZSB1c2VyIGlzIGxvZ2dlZCBzbyB0aGVuIFxuICAgIC8vIHRoZWlyICdsb2dnZWQgaW5kZXgnIGlzIHRoZSBkYXNoYm9hcmQgbm90IHRoaXNcbiAgICAvLyBwYWdlIHRoYXQgaXMgZm9jdXNlZCBvbiBhbm9ueW1vdXMgdXNlcnNcbiAgICBpZiAoIXRoaXMuYXBwLm1vZGVsLnVzZXIoKS5pc0Fub255bW91cygpKSB7XG4gICAgICAgIHRoaXMuYXBwLmdvRGFzaGJvYXJkKCk7XG4gICAgfVxufTtcbiIsIi8qKlxuICAgIEpvYnRpdGxlcyBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEpvYnRpdGxlc0FjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdTY2hlZHVsaW5nJyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG59XG4iLCIvKipcbiAgICBMZWFybk1vcmUgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcbiAgICBOYXZCYXIgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkJhcicpLFxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyk7XG5cbnZhciBzaW5nbGV0b24gPSBudWxsO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0TGVhcm5Nb3JlKCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgTGVhcm5Nb3JlQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xuICAgIFxuICAgIHJldHVybiBzaW5nbGV0b247XG59O1xuXG5mdW5jdGlvbiBMZWFybk1vcmVBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMuZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XG4gICAgICAgIHRpdGxlOiBudWxsLCAvLyBudWxsIGZvciBsb2dvXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5nb0JhY2ssXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBOYXZBY3Rpb24ubWVudU91dFxuICAgIH0pO1xufVxuXG5MZWFybk1vcmVBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuXG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5yb3V0ZSAmJlxuICAgICAgICBvcHRpb25zLnJvdXRlLnNlZ21lbnRzICYmXG4gICAgICAgIG9wdGlvbnMucm91dGUuc2VnbWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuZGF0YVZpZXcucHJvZmlsZShvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdKTtcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgdGhpcy5wcm9maWxlID0ga28ub2JzZXJ2YWJsZSgnY3VzdG9tZXInKTtcbn0iLCIvKipcbiAgICBMb2NhdGlvbkVkaXRpb24gYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcbiAgICBMb2NhdGlvbiA9IHJlcXVpcmUoJy4uL21vZGVscy9Mb2NhdGlvbicpLFxuICAgIE5hdkJhciA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QmFyJyksXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcblxudmFyIHNpbmdsZXRvbiA9IG51bGw7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRMb2NhdGlvbkVkaXRpb24oJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBMb2NhdGlvbkVkaXRpb25BY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XG4gICAgXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbn07XG5cbmZ1bmN0aW9uIExvY2F0aW9uRWRpdGlvbkFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xuXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMuZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XG4gICAgICAgIHRpdGxlOiAnJyxcbiAgICAgICAgbGVmdEFjdGlvbjogTmF2QWN0aW9uLmdvQmFjay5tb2RlbC5jbG9uZSh7XG4gICAgICAgICAgICB0ZXh0OiAnTG9jYXRpb25zJ1xuICAgICAgICB9KSxcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5nb0hlbHBJbmRleFxuICAgIH0pO1xufVxuXG5Mb2NhdGlvbkVkaXRpb25BY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuICAgIC8vanNoaW50IG1heGNvbXBsZXhpdHk6MTBcbiAgICBcbiAgICB2YXIgaWQgPSAwLFxuICAgICAgICBjcmVhdGUgPSAnJztcblxuICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmxvY2F0aW9uSUQpIHtcbiAgICAgICAgICAgIGlkID0gb3B0aW9ucy5sb2NhdGlvbklEO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9wdGlvbnMucm91dGUgJiYgb3B0aW9ucy5yb3V0ZS5zZWdtZW50cykge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZCA9IHBhcnNlSW50KG9wdGlvbnMucm91dGUuc2VnbWVudHNbMF0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9wdGlvbnMuY3JlYXRlKSB7XG4gICAgICAgICAgICBjcmVhdGUgPSBvcHRpb25zLmNyZWF0ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBpZiAoaWQpIHtcbiAgICAgICAgLy8gVE9ET1xuICAgICAgICAvLyB2YXIgbG9jYXRpb24gPSB0aGlzLmFwcC5tb2RlbC5nZXRMb2NhdGlvbihpZClcbiAgICAgICAgLy8gTk9URSB0ZXN0aW5nIGRhdGFcbiAgICAgICAgdmFyIGxvY2F0aW9ucyA9IHtcbiAgICAgICAgICAgICcxJzogbmV3IExvY2F0aW9uKHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbklEOiAxLFxuICAgICAgICAgICAgICAgIG5hbWU6ICdIb21lJyxcbiAgICAgICAgICAgICAgICBhZGRyZXNzTGluZTE6ICdIZXJlIFN0cmVldCcsXG4gICAgICAgICAgICAgICAgY2l0eTogJ1NhbiBGcmFuY2lzY28nLFxuICAgICAgICAgICAgICAgIHBvc3RhbENvZGU6ICc5MDAwMScsXG4gICAgICAgICAgICAgICAgc3RhdGVQcm92aW5jZUNvZGU6ICdDQScsXG4gICAgICAgICAgICAgICAgY291bnRyeUlEOiAxLFxuICAgICAgICAgICAgICAgIGlzU2VydmljZVJhZGl1czogdHJ1ZSxcbiAgICAgICAgICAgICAgICBpc1NlcnZpY2VMb2NhdGlvbjogZmFsc2VcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgJzInOiBuZXcgTG9jYXRpb24oe1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uSUQ6IDEsXG4gICAgICAgICAgICAgICAgbmFtZTogJ1dvcmtzaG9wJyxcbiAgICAgICAgICAgICAgICBhZGRyZXNzTGluZTE6ICdVbmtub3cgU3RyZWV0JyxcbiAgICAgICAgICAgICAgICBjaXR5OiAnU2FuIEZyYW5jaXNjbycsXG4gICAgICAgICAgICAgICAgcG9zdGFsQ29kZTogJzkwMDAxJyxcbiAgICAgICAgICAgICAgICBzdGF0ZVByb3ZpbmNlQ29kZTogJ0NBJyxcbiAgICAgICAgICAgICAgICBjb3VudHJ5SUQ6IDEsXG4gICAgICAgICAgICAgICAgaXNTZXJ2aWNlUmFkaXVzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBpc1NlcnZpY2VMb2NhdGlvbjogdHJ1ZVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGxvY2F0aW9uID0gbG9jYXRpb25zW2lkXTtcbiAgICAgICAgaWYgKGxvY2F0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmxvY2F0aW9uKGxvY2F0aW9uKTtcblxuICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5oZWFkZXIoJ0VkaXQgTG9jYXRpb24nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9jYXRpb24obnVsbCk7XG4gICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmhlYWRlcignVW5rbm93IGxvY2F0aW9uIG9yIHdhcyBkZWxldGVkJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIC8vIE5ldyBsb2NhdGlvblxuICAgICAgICB0aGlzLmRhdGFWaWV3LmxvY2F0aW9uKG5ldyBMb2NhdGlvbigpKTtcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAob3B0aW9ucy5jcmVhdGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ3NlcnZpY2VSYWRpdXMnOlxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9jYXRpb24oKS5pc1NlcnZpY2VSYWRpdXModHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5oZWFkZXIoJ0FkZCBhIHNlcnZpY2UgcmFkaXVzJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdzZXJ2aWNlTG9jYXRpb24nOlxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9jYXRpb24oKS5pc1NlcnZpY2VMb2NhdGlvbih0cnVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmhlYWRlcignQWRkIGEgc2VydmljZSBsb2NhdGlvbicpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmxvY2F0aW9uKCkuaXNTZXJ2aWNlUmFkaXVzKHRydWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9jYXRpb24oKS5pc1NlcnZpY2VMb2NhdGlvbih0cnVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmhlYWRlcignQWRkIGEgbG9jYXRpb24nKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcbiAgICBcbiAgICB0aGlzLmxvY2F0aW9uID0ga28ub2JzZXJ2YWJsZShuZXcgTG9jYXRpb24oKSk7XG4gICAgXG4gICAgdGhpcy5oZWFkZXIgPSBrby5vYnNlcnZhYmxlKCdFZGl0IExvY2F0aW9uJyk7XG4gICAgXG4gICAgLy8gVE9ET1xuICAgIHRoaXMuc2F2ZSA9IGZ1bmN0aW9uKCkge307XG4gICAgdGhpcy5jYW5jZWwgPSBmdW5jdGlvbigpIHt9O1xufSIsIi8qKlxyXG4gICAgbG9jYXRpb25zIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKSxcclxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyk7XHJcbiAgICBcclxudmFyIHNpbmdsZXRvbiA9IG51bGw7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0TG9jYXRpb25zKCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcclxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgTG9jYXRpb25zQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xyXG4gICAgXHJcbiAgICByZXR1cm4gc2luZ2xldG9uO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gTG9jYXRpb25zQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcclxuICAgIFxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xyXG4gICAgdGhpcy5uYXZCYXIgPSBuZXcgTmF2QmFyKHtcclxuICAgICAgICB0aXRsZTogJycsXHJcbiAgICAgICAgbGVmdEFjdGlvbjogTmF2QWN0aW9uLmdvQmFjay5tb2RlbC5jbG9uZSh7XHJcbiAgICAgICAgICAgIGlzVGl0bGU6IHRydWVcclxuICAgICAgICB9KSxcclxuICAgICAgICByaWdodEFjdGlvbjogTmF2QWN0aW9uLmdvSGVscEluZGV4XHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xyXG4gICAgdGhpcy4kbGlzdFZpZXcgPSAkYWN0aXZpdHkuZmluZCgnI2xvY2F0aW9uc0xpc3RWaWV3Jyk7XHJcblxyXG4gICAgdmFyIGRhdGFWaWV3ID0gdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoYXBwKTtcclxuICAgIGtvLmFwcGx5QmluZGluZ3MoZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xyXG5cclxuICAgIC8vIFRlc3RpbmdEYXRhXHJcbiAgICBkYXRhVmlldy5sb2NhdGlvbnMocmVxdWlyZSgnLi4vdGVzdGRhdGEvbG9jYXRpb25zJykubG9jYXRpb25zKTtcclxuXHJcbiAgICAvLyBIYW5kbGVyIHRvIHVwZGF0ZSBoZWFkZXIgYmFzZWQgb24gYSBtb2RlIGNoYW5nZTpcclxuICAgIHRoaXMuZGF0YVZpZXcuaXNTZWxlY3Rpb25Nb2RlLnN1YnNjcmliZShmdW5jdGlvbiAoaXRJcykge1xyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuaGVhZGVyVGV4dChpdElzID8gJ1NlbGVjdCBvciBhZGQgYSBzZXJ2aWNlIGxvY2F0aW9uJyA6ICdMb2NhdGlvbnMnKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBVcGRhdGUgbmF2YmFyIHRvb1xyXG4gICAgICAgIC8vIFRPRE86IENhbiBiZSBvdGhlciB0aGFuICdzY2hlZHVsaW5nJywgbGlrZSBtYXJrZXRwbGFjZSBwcm9maWxlIG9yIHRoZSBqb2ItdGl0bGU/XHJcbiAgICAgICAgdGhpcy5uYXZCYXIubGVmdEFjdGlvbigpLnRleHQoaXRJcyA/ICdCb29raW5nJyA6ICdTY2hlZHVsaW5nJyk7XHJcbiAgICAgICAgLy8gVGl0bGUgbXVzdCBiZSBlbXB0eVxyXG4gICAgICAgIHRoaXMubmF2QmFyLnRpdGxlKCcnKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBUT0RPIFJlcGxhY2VkIGJ5IGEgcHJvZ3Jlc3MgYmFyIG9uIGJvb2tpbmcgY3JlYXRpb25cclxuICAgICAgICAvLyBUT0RPIE9yIGxlZnRBY3Rpb24oKS50ZXh0KC4uKSBvbiBib29raW5nIGVkaXRpb24gKHJldHVybiB0byBib29raW5nKVxyXG4gICAgICAgIC8vIG9yIGNvbWluZyBmcm9tIEpvYnRpdGxlL3NjaGVkdWxlIChyZXR1cm4gdG8gc2NoZWR1bGUvam9iIHRpdGxlKT9cclxuICAgICAgICBcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgLy8gT2JqZWN0IHRvIGhvbGQgdGhlIG9wdGlvbnMgcGFzc2VkIG9uICdzaG93JyBhcyBhIHJlc3VsdFxyXG4gICAgLy8gb2YgYSByZXF1ZXN0IGZyb20gYW5vdGhlciBhY3Rpdml0eVxyXG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XHJcbiAgICBcclxuICAgIC8vIEhhbmRsZXIgdG8gZ28gYmFjayB3aXRoIHRoZSBzZWxlY3RlZCBsb2NhdGlvbiB3aGVuIFxyXG4gICAgLy8gc2VsZWN0aW9uIG1vZGUgZ29lcyBvZmYgYW5kIHJlcXVlc3RJbmZvIGlzIGZvclxyXG4gICAgLy8gJ3NlbGVjdCBtb2RlJ1xyXG4gICAgdGhpcy5kYXRhVmlldy5pc1NlbGVjdGlvbk1vZGUuc3Vic2NyaWJlKGZ1bmN0aW9uIChpdElzKSB7XHJcbiAgICAgICAgLy8gV2UgaGF2ZSBhIHJlcXVlc3QgYW5kXHJcbiAgICAgICAgLy8gaXQgcmVxdWVzdGVkIHRvIHNlbGVjdCBhIGxvY2F0aW9uXHJcbiAgICAgICAgLy8gYW5kIHNlbGVjdGlvbiBtb2RlIGdvZXMgb2ZmXHJcbiAgICAgICAgaWYgKHRoaXMucmVxdWVzdEluZm8gJiZcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mby5zZWxlY3RMb2NhdGlvbiA9PT0gdHJ1ZSAmJlxyXG4gICAgICAgICAgICBpdElzID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gUGFzcyB0aGUgc2VsZWN0ZWQgY2xpZW50IGluIHRoZSBpbmZvXHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8uc2VsZWN0ZWRMb2NhdGlvbiA9IHRoaXMuZGF0YVZpZXcuc2VsZWN0ZWRMb2NhdGlvbigpO1xyXG4gICAgICAgICAgICAvLyBBbmQgZ28gYmFja1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5zaGVsbC5nb0JhY2sodGhpcy5yZXF1ZXN0SW5mbyk7XHJcbiAgICAgICAgICAgIC8vIExhc3QsIGNsZWFyIHJlcXVlc3RJbmZvXHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn1cclxuXHJcbkxvY2F0aW9uc0FjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcbiAgXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBvcHRpb25zO1xyXG5cclxuICAgIGlmIChvcHRpb25zLnNlbGVjdExvY2F0aW9uID09PSB0cnVlKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5pc1NlbGVjdGlvbk1vZGUodHJ1ZSk7XHJcbiAgICAgICAgLy8gcHJlc2V0OlxyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuc2VsZWN0ZWRMb2NhdGlvbihvcHRpb25zLnNlbGVjdGVkTG9jYXRpb24pO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAob3B0aW9ucy5yb3V0ZSAmJiBvcHRpb25zLnJvdXRlLnNlZ21lbnRzKSB7XHJcbiAgICAgICAgdmFyIGlkID0gb3B0aW9ucy5yb3V0ZS5zZWdtZW50c1swXTtcclxuICAgICAgICBpZiAoaWQpIHtcclxuICAgICAgICAgICAgaWYgKGlkID09PSAnbmV3Jykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ28oJ2xvY2F0aW9uRWRpdGlvbicsIHtcclxuICAgICAgICAgICAgICAgICAgICBjcmVhdGU6IG9wdGlvbnMucm91dGUuc2VnbWVudHNbMV0gLy8gJ3NlcnZpY2VSYWRpdXMnLCAnc2VydmljZUxvY2F0aW9uJ1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5zaGVsbC5nbygnbG9jYXRpb25FZGl0aW9uJywge1xyXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uSUQ6IGlkXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbChhcHApIHtcclxuXHJcbiAgICB0aGlzLmhlYWRlclRleHQgPSBrby5vYnNlcnZhYmxlKCdMb2NhdGlvbnMnKTtcclxuXHJcbiAgICAvLyBGdWxsIGxpc3Qgb2YgbG9jYXRpb25zXHJcbiAgICB0aGlzLmxvY2F0aW9ucyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcblxyXG4gICAgLy8gRXNwZWNpYWwgbW9kZSB3aGVuIGluc3RlYWQgb2YgcGljayBhbmQgZWRpdCB3ZSBhcmUganVzdCBzZWxlY3RpbmdcclxuICAgIC8vICh3aGVuIGVkaXRpbmcgYW4gYXBwb2ludG1lbnQpXHJcbiAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZSA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG5cclxuICAgIHRoaXMuc2VsZWN0ZWRMb2NhdGlvbiA9IGtvLm9ic2VydmFibGUobnVsbCk7XHJcbiAgICBcclxuICAgIHRoaXMuc2VsZWN0TG9jYXRpb24gPSBmdW5jdGlvbihzZWxlY3RlZExvY2F0aW9uKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHRoaXMuaXNTZWxlY3Rpb25Nb2RlKCkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZExvY2F0aW9uKHNlbGVjdGVkTG9jYXRpb24pO1xyXG4gICAgICAgICAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZShmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBhcHAuc2hlbGwuZ28oJ2xvY2F0aW9uRWRpdGlvbicsIHtcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uSUQ6IHNlbGVjdGVkTG9jYXRpb24ubG9jYXRpb25JRCgpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbn1cclxuIiwiLyoqXG4gICAgTG9naW4gYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcbiAgVXNlciA9IHJlcXVpcmUoJy4uL21vZGVscy9Vc2VyJyksXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKSxcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xuXG52YXIgc2luZ2xldG9uID0gbnVsbDtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdExvZ2luKCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgTG9naW5BY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XG4gICAgXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbn07XG5cbmZ1bmN0aW9uIExvZ2luQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkFub255bW91cztcbiAgICB0aGlzLm5hdkJhciA9IG5ldyBOYXZCYXIoe1xuICAgICAgICB0aXRsZTogJ0xvZyBpbicsXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5nb0JhY2ssXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBOYXZBY3Rpb24ubWVudU91dFxuICAgIH0pO1xuXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMuZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xuICAgIFxuICAgIC8vIFBlcmZvcm0gbG9nLWluIHJlcXVlc3Qgd2hlbiBpcyByZXF1ZXN0ZWQgYnkgdGhlIGZvcm06XG4gICAgdGhpcy5kYXRhVmlldy5pc0xvZ2luZ0luLnN1YnNjcmliZShmdW5jdGlvbih2KSB7XG4gICAgICAgIGlmICh2ID09PSB0cnVlKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFBlcmZvcm0gbG9naW5nXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIE5vdGlmeSBzdGF0ZTpcbiAgICAgICAgICAgIHZhciAkYnRuID0gJGFjdGl2aXR5LmZpbmQoJ1t0eXBlPVwic3VibWl0XCJdJyk7XG4gICAgICAgICAgICAkYnRuLmJ1dHRvbignbG9hZGluZycpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBDbGVhciBwcmV2aW91cyBlcnJvciBzbyBtYWtlcyBjbGVhciB3ZVxuICAgICAgICAgICAgLy8gYXJlIGF0dGVtcHRpbmdcbiAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9naW5FcnJvcignJyk7XG4gICAgICAgIFxuICAgICAgICAgICAgdmFyIGVuZGVkID0gZnVuY3Rpb24gZW5kZWQoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5pc0xvZ2luZ0luKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAkYnRuLmJ1dHRvbigncmVzZXQnKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQWZ0ZXIgY2xlYW4tdXAgZXJyb3IgKHRvIGZvcmNlIHNvbWUgdmlldyB1cGRhdGVzKSxcbiAgICAgICAgICAgIC8vIHZhbGlkYXRlIGFuZCBhYm9ydCBvbiBlcnJvclxuICAgICAgICAgICAgLy8gTWFudWFsbHkgY2hlY2tpbmcgZXJyb3Igb24gZWFjaCBmaWVsZFxuICAgICAgICAgICAgaWYgKHRoaXMuZGF0YVZpZXcudXNlcm5hbWUuZXJyb3IoKSB8fFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcucGFzc3dvcmQuZXJyb3IoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9naW5FcnJvcignUmV2aWV3IHlvdXIgZGF0YScpO1xuICAgICAgICAgICAgICAgIGVuZGVkKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBhcHAubW9kZWwubG9naW4oXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy51c2VybmFtZSgpLFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcucGFzc3dvcmQoKVxuICAgICAgICAgICAgKS50aGVuKGZ1bmN0aW9uKGxvZ2luRGF0YSkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9naW5FcnJvcignJyk7XG4gICAgICAgICAgICAgICAgZW5kZWQoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgZm9ybSBkYXRhXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy51c2VybmFtZSgnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5wYXNzd29yZCgnJyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuZ29EYXNoYm9hcmQoKTtcblxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKS5jYXRjaChmdW5jdGlvbihlcnIpIHtcblxuICAgICAgICAgICAgICAgIHZhciBtc2cgPSBlcnIgJiYgZXJyLnJlc3BvbnNlSlNPTiAmJiBlcnIucmVzcG9uc2VKU09OLmVycm9yTWVzc2FnZSB8fFxuICAgICAgICAgICAgICAgICAgICBlcnIgJiYgZXJyLnN0YXR1c1RleHQgfHxcbiAgICAgICAgICAgICAgICAgICAgJ0ludmFsaWQgdXNlcm5hbWUgb3IgcGFzc3dvcmQnO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5sb2dpbkVycm9yKG1zZyk7XG4gICAgICAgICAgICAgICAgZW5kZWQoKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuICAgIFxuICAgIC8vIEZvY3VzIGZpcnN0IGJhZCBmaWVsZCBvbiBlcnJvclxuICAgIHRoaXMuZGF0YVZpZXcubG9naW5FcnJvci5zdWJzY3JpYmUoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIC8vIExvZ2luIGlzIGVhc3kgc2luY2Ugd2UgbWFyayBib3RoIHVuaXF1ZSBmaWVsZHNcbiAgICAgICAgLy8gYXMgZXJyb3Igb24gbG9naW5FcnJvciAoaXRzIGEgZ2VuZXJhbCBmb3JtIGVycm9yKVxuICAgICAgICB2YXIgaW5wdXQgPSAkYWN0aXZpdHkuZmluZCgnOmlucHV0JykuZ2V0KDApO1xuICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgaW5wdXQuZm9jdXMoKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaW5wdXQuYmx1cigpO1xuICAgIH0pO1xufVxuXG5Mb2dpbkFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG59O1xuXG52YXIgRm9ybUNyZWRlbnRpYWxzID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9Gb3JtQ3JlZGVudGlhbHMnKTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG4gICAgdmFyIGNyZWRlbnRpYWxzID0gbmV3IEZvcm1DcmVkZW50aWFscygpOyAgICBcbiAgICB0aGlzLnVzZXJuYW1lID0gY3JlZGVudGlhbHMudXNlcm5hbWU7XG4gICAgdGhpcy5wYXNzd29yZCA9IGNyZWRlbnRpYWxzLnBhc3N3b3JkO1xuXG4gICAgdGhpcy5sb2dpbkVycm9yID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgXG4gICAgdGhpcy5pc0xvZ2luZ0luID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG4gICAgXG4gICAgdGhpcy5wZXJmb3JtTG9naW4gPSBmdW5jdGlvbiBwZXJmb3JtTG9naW4oKSB7XG5cbiAgICAgICAgdGhpcy5pc0xvZ2luZ0luKHRydWUpOyAgICAgICAgXG4gICAgfS5iaW5kKHRoaXMpO1xufVxuIiwiLyoqXG4gICAgTG9nb3V0IGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIHNpbmdsZXRvbiA9IG51bGw7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRMb2dvdXQoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBMb2dvdXRBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XG4gICAgXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbn07XG5cbmZ1bmN0aW9uIExvZ291dEFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cbkxvZ291dEFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG5cbiAgICB0aGlzLmFwcC5tb2RlbC5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBBbm9ueW1vdXMgdXNlciBhZ2FpblxuICAgICAgICB2YXIgbmV3QW5vbiA9IHRoaXMuYXBwLm1vZGVsLnVzZXIoKS5jb25zdHJ1Y3Rvci5uZXdBbm9ueW1vdXMoKTtcbiAgICAgICAgdGhpcy5hcHAubW9kZWwudXNlcigpLm1vZGVsLnVwZGF0ZVdpdGgobmV3QW5vbik7XG5cbiAgICAgICAgLy8gR28gaW5kZXhcbiAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ28oJy8nKTtcbiAgICAgICAgXG4gICAgfS5iaW5kKHRoaXMpKTtcbn07XG4iLCIvKipcbiAgICBPbmJvYXJkaW5nQ29tcGxldGUgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2luZ2xldG9uID0gbnVsbDtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdE9uYm9hcmRpbmdDb21wbGV0ZSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IE9uYm9hcmRpbmdDb21wbGV0ZUFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcbiAgICBcbiAgICByZXR1cm4gc2luZ2xldG9uO1xufTtcblxuZnVuY3Rpb24gT25ib2FyZGluZ0NvbXBsZXRlQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuT25ib2FyZGluZ0NvbXBsZXRlQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcblxufTtcbiIsIi8qKlxuICAgIE9uYm9hcmRpbmdIb21lIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIHNpbmdsZXRvbiA9IG51bGwsXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKSxcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0T25ib2FyZGluZ0hvbWUoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBPbmJvYXJkaW5nSG9tZUFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcbiAgICBcbiAgICByZXR1cm4gc2luZ2xldG9uO1xufTtcblxuZnVuY3Rpb24gT25ib2FyZGluZ0hvbWVBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIFxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XG4gICAgICAgIHRpdGxlOiBudWxsLCAvLyBudWxsIGZvciBMb2dvXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5nb0xvZ291dCxcbiAgICAgICAgcmlnaHRBY3Rpb246IG51bGxcbiAgICB9KTtcbn1cblxuT25ib2FyZGluZ0hvbWVBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuXG59O1xuIiwiLyoqXG4gICAgT25ib2FyZGluZyBQb3NpdGlvbnMgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcbiAgICBOYXZCYXIgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkJhcicpLFxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyk7XG5cbnZhciBzaW5nbGV0b24gPSBudWxsO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0T25ib2FyZGluZ1Bvc2l0aW9ucygkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IE9uYm9hcmRpbmdQb3NpdGlvbnNBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XG4gICAgXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbn07XG5cbmZ1bmN0aW9uIE9uYm9hcmRpbmdQb3NpdGlvbnNBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xuICAgIFxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIHRoaXMuZGF0YVZpZXcgPSBuZXcgVmlld01vZGVsKCk7XG4gICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLmRhdGFWaWV3LCAkYWN0aXZpdHkuZ2V0KDApKTtcblxuICAgIC8vIFRlc3RpbmdEYXRhXG4gICAgc2V0U29tZVRlc3RpbmdEYXRhKHRoaXMuZGF0YVZpZXcpO1xuXG4gICAgLy8gT2JqZWN0IHRvIGhvbGQgdGhlIG9wdGlvbnMgcGFzc2VkIG9uICdzaG93JyBhcyBhIHJlc3VsdFxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gbnVsbDtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IG5ldyBOYXZCYXIoe1xuICAgICAgICB0aXRsZTogJ0pvYiBUaXRsZXMnLFxuICAgICAgICBsZWZ0QWN0aW9uOiBOYXZBY3Rpb24ubWVudU5ld0l0ZW0sXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBOYXZBY3Rpb24ubWVudUluXG4gICAgfSk7XG59XG5cbk9uYm9hcmRpbmdQb3NpdGlvbnNBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuIFxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMucmVxdWVzdEluZm8gPSBvcHRpb25zO1xufTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG4gICAgLy8gRnVsbCBsaXN0IG9mIHBvc2l0aW9uc1xuICAgIHRoaXMucG9zaXRpb25zID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcbn1cblxudmFyIFBvc2l0aW9uID0gcmVxdWlyZSgnLi4vbW9kZWxzL1Bvc2l0aW9uJyk7XG4vLyBVc2VyUG9zaXRpb24gbW9kZWxcbmZ1bmN0aW9uIHNldFNvbWVUZXN0aW5nRGF0YShkYXRhdmlldykge1xuICAgIFxuICAgIGRhdGF2aWV3LnBvc2l0aW9ucy5wdXNoKG5ldyBQb3NpdGlvbih7XG4gICAgICAgIHBvc2l0aW9uU2luZ3VsYXI6ICdNYXNzYWdlIFRoZXJhcGlzdCdcbiAgICB9KSk7XG4gICAgZGF0YXZpZXcucG9zaXRpb25zLnB1c2gobmV3IFBvc2l0aW9uKHtcbiAgICAgICAgcG9zaXRpb25TaW5ndWxhcjogJ0hvdXNla2VlcGVyJ1xuICAgIH0pKTtcbn0iLCIvKipcbiAgICBTY2hlZHVsaW5nIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIHNpbmdsZXRvbiA9IG51bGwsXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyksXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKTtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFNjaGVkdWxpbmcoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBTY2hlZHVsaW5nQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xuICAgIFxuICAgIHJldHVybiBzaW5nbGV0b247XG59O1xuXG5mdW5jdGlvbiBTY2hlZHVsaW5nQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG5cbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBuZXcgTmF2QmFyKHtcbiAgICAgICAgdGl0bGU6ICdTY2hlZHVsaW5nJyxcbiAgICAgICAgbGVmdEFjdGlvbjogTmF2QWN0aW9uLm1lbnVOZXdJdGVtLFxuICAgICAgICByaWdodEFjdGlvbjogTmF2QWN0aW9uLm1lbnVJblxuICAgIH0pO1xufVxuXG5TY2hlZHVsaW5nQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcblxufTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG59XG4iLCIvKipcclxuICAgIFNjaGVkdWxpbmdQcmVmZXJlbmNlcyBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gU2NoZWR1bGluZ1ByZWZlcmVuY2VzQWN0aXZpdHkoKSB7XHJcbiAgICBcclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICBcclxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuRnJlZWxhbmNlcjtcclxuXHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ1NjaGVkdWxpbmcnKTtcclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhzdGF0ZSkge1xyXG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBzdGF0ZSk7XHJcbiAgICBcclxuICAgIC8vIFJlcXVlc3QgYSBsb2FkLCBldmVuIGlmIGlzIGEgYmFja2dyb3VuZCBsb2FkIGFmdGVyIHRoZSBmaXJzdCB0aW1lOlxyXG4gICAgdGhpcy5hcHAubW9kZWwuc2NoZWR1bGluZ1ByZWZlcmVuY2VzLmxvYWQoKTtcclxuICAgIC8vIERpc2NhcmQgYW55IHByZXZpb3VzIHVuc2F2ZWQgZWRpdFxyXG4gICAgdGhpcy52aWV3TW9kZWwuZGlzY2FyZCgpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKGFwcCkge1xyXG5cclxuICAgIHZhciBzY2hlZHVsaW5nUHJlZmVyZW5jZXMgPSBhcHAubW9kZWwuc2NoZWR1bGluZ1ByZWZlcmVuY2VzO1xyXG5cclxuICAgIHZhciBwcmVmc1ZlcnNpb24gPSBzY2hlZHVsaW5nUHJlZmVyZW5jZXMubmV3VmVyc2lvbigpO1xyXG4gICAgcHJlZnNWZXJzaW9uLmlzT2Jzb2xldGUuc3Vic2NyaWJlKGZ1bmN0aW9uKGl0SXMpIHtcclxuICAgICAgICBpZiAoaXRJcykge1xyXG4gICAgICAgICAgICAvLyBuZXcgdmVyc2lvbiBmcm9tIHNlcnZlciB3aGlsZSBlZGl0aW5nXHJcbiAgICAgICAgICAgIC8vIEZVVFVSRTogd2FybiBhYm91dCBhIG5ldyByZW1vdGUgdmVyc2lvbiBhc2tpbmdcclxuICAgICAgICAgICAgLy8gY29uZmlybWF0aW9uIHRvIGxvYWQgdGhlbSBvciBkaXNjYXJkIGFuZCBvdmVyd3JpdGUgdGhlbTtcclxuICAgICAgICAgICAgLy8gdGhlIHNhbWUgaXMgbmVlZCBvbiBzYXZlKCksIGFuZCBvbiBzZXJ2ZXIgcmVzcG9uc2VcclxuICAgICAgICAgICAgLy8gd2l0aCBhIDUwOTpDb25mbGljdCBzdGF0dXMgKGl0cyBib2R5IG11c3QgY29udGFpbiB0aGVcclxuICAgICAgICAgICAgLy8gc2VydmVyIHZlcnNpb24pLlxyXG4gICAgICAgICAgICAvLyBSaWdodCBub3csIGp1c3Qgb3ZlcndyaXRlIGN1cnJlbnQgY2hhbmdlcyB3aXRoXHJcbiAgICAgICAgICAgIC8vIHJlbW90ZSBvbmVzOlxyXG4gICAgICAgICAgICBwcmVmc1ZlcnNpb24ucHVsbCh7IGV2ZW5JZk5ld2VyOiB0cnVlIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBBY3R1YWwgZGF0YSBmb3IgdGhlIGZvcm06XHJcbiAgICB0aGlzLnByZWZzID0gcHJlZnNWZXJzaW9uLnZlcnNpb247XHJcblxyXG4gICAgdGhpcy5pc0xvY2tlZCA9IHNjaGVkdWxpbmdQcmVmZXJlbmNlcy5pc0xvY2tlZDtcclxuXHJcbiAgICB0aGlzLnN1Ym1pdFRleHQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcoKSA/IFxyXG4gICAgICAgICAgICAgICAgJ2xvYWRpbmcuLi4nIDogXHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzU2F2aW5nKCkgPyBcclxuICAgICAgICAgICAgICAgICAgICAnc2F2aW5nLi4uJyA6IFxyXG4gICAgICAgICAgICAgICAgICAgICdTYXZlJ1xyXG4gICAgICAgICk7XHJcbiAgICB9LCBzY2hlZHVsaW5nUHJlZmVyZW5jZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmRpc2NhcmQgPSBmdW5jdGlvbiBkaXNjYXJkKCkge1xyXG4gICAgICAgIHByZWZzVmVyc2lvbi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcblxyXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgICAgICAvLyBGb3JjZSB0byBzYXZlLCBldmVuIGlmIHRoZXJlIHdhcyByZW1vdGUgdXBkYXRlc1xyXG4gICAgICAgIHByZWZzVmVyc2lvbi5wdXNoKHsgZXZlbklmT2Jzb2xldGU6IHRydWUgfSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuaW5jcmVtZW50c0V4YW1wbGUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHN0ciA9ICdlLmcuICcsXHJcbiAgICAgICAgICAgIGluY1NpemUgPSB0aGlzLmluY3JlbWVudHNTaXplSW5NaW51dGVzKCksXHJcbiAgICAgICAgICAgIG0gPSBtb21lbnQoeyBob3VyOiAxMCwgbWludXRlOiAwIH0pLFxyXG4gICAgICAgICAgICBob3VycyA9IFttLmZvcm1hdCgnSEg6bW0nKV07XHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCA0OyBpKyspIHtcclxuICAgICAgICAgICAgaG91cnMucHVzaChcclxuICAgICAgICAgICAgICAgIG0uYWRkKGluY1NpemUsICdtaW51dGVzJylcclxuICAgICAgICAgICAgICAgIC5mb3JtYXQoJ0hIOm1tJylcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RyICs9IGhvdXJzLmpvaW4oJywgJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHN0cjtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMucHJlZnMpO1xyXG59XHJcbiIsIi8qKlxyXG4gICAgc2VydmljZXMgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxuICAgIFxyXG52YXIgc2luZ2xldG9uID0gbnVsbDtcclxuXHJcbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBTZXJ2aWNlc0FjdGl2aXR5KCkge1xyXG5cclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICBcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5GcmVsYW5jZXI7XHJcbiAgICBcclxuICAgIC8vIFRPRE86IG9uIHNob3csIG5lZWQgdG8gYmUgdXBkYXRlZCB3aXRoIHRoZSBKb2JUaXRsZSBuYW1lXHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ0pvYiB0aXRsZScpO1xyXG4gICAgXHJcbiAgICAvL3RoaXMuJGxpc3RWaWV3ID0gdGhpcy4kYWN0aXZpdHkuZmluZCgnI3NlcnZpY2VzTGlzdFZpZXcnKTtcclxuXHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcclxuXHJcbiAgICAvLyBUZXN0aW5nRGF0YVxyXG4gICAgdGhpcy52aWV3TW9kZWwuc2VydmljZXMocmVxdWlyZSgnLi4vdGVzdGRhdGEvc2VydmljZXMnKS5zZXJ2aWNlcy5tYXAoU2VsZWN0YWJsZSkpO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyIHRvIGdvIGJhY2sgd2l0aCB0aGUgc2VsZWN0ZWQgc2VydmljZSB3aGVuIFxyXG4gICAgLy8gc2VsZWN0aW9uIG1vZGUgZ29lcyBvZmYgYW5kIHJlcXVlc3REYXRhIGlzIGZvclxyXG4gICAgLy8gJ3NlbGVjdCBtb2RlJ1xyXG4gICAgdGhpcy52aWV3TW9kZWwuaXNTZWxlY3Rpb25Nb2RlLnN1YnNjcmliZShmdW5jdGlvbiAoaXRJcykge1xyXG4gICAgICAgIC8vIFdlIGhhdmUgYSByZXF1ZXN0IGFuZFxyXG4gICAgICAgIC8vIGl0IHJlcXVlc3RlZCB0byBzZWxlY3QgYSBzZXJ2aWNlXHJcbiAgICAgICAgLy8gYW5kIHNlbGVjdGlvbiBtb2RlIGdvZXMgb2ZmXHJcbiAgICAgICAgaWYgKHRoaXMucmVxdWVzdERhdGEgJiZcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RGF0YS5zZWxlY3RTZXJ2aWNlcyA9PT0gdHJ1ZSAmJlxyXG4gICAgICAgICAgICBpdElzID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gUGFzcyB0aGUgc2VsZWN0ZWQgY2xpZW50IGluIHRoZSBpbmZvXHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdERhdGEuc2VsZWN0ZWRTZXJ2aWNlcyA9IHRoaXMudmlld01vZGVsLnNlbGVjdGVkU2VydmljZXMoKTtcclxuICAgICAgICAgICAgLy8gQW5kIGdvIGJhY2tcclxuICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ29CYWNrKHRoaXMucmVxdWVzdERhdGEpO1xyXG4gICAgICAgICAgICAvLyBMYXN0LCBjbGVhciByZXF1ZXN0RGF0YVxyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3REYXRhID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59KTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcclxuXHJcbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcclxuXHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgXHJcbiAgICAvLyBHZXQgam9idGl0bGVJRCBmb3IgdGhlIHJlcXVlc3RcclxuICAgIHZhciByb3V0ZSA9IHRoaXMucmVxdWVzdERhdGEucm91dGU7XHJcbiAgICB2YXIgam9iVGl0bGVJRCA9IHJvdXRlICYmIHJvdXRlLnNlZ21lbnRzICYmIHJvdXRlLnNlZ21lbnRzWzBdO1xyXG4gICAgam9iVGl0bGVJRCA9IHBhcnNlSW50KGpvYlRpdGxlSUQsIDEwKTtcclxuICAgIGlmIChqb2JUaXRsZUlEKSB7XHJcbiAgICAgICAgLy8gVE9ETzogZ2V0IGRhdGEgZm9yIHRoZSBKb2IgdGl0bGUgSURcclxuICAgICAgICB0aGlzLmFwcC5tb2RlbC5nZXRVc2VySm9iVGl0bGUoam9iVGl0bGVJRCkudGhlbihmdW5jdGlvbih1c2VySm9idGl0bGUpIHtcclxuICAgICAgICAgICAgaWYgKCF1c2VySm9idGl0bGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdObyB1c2VyIGpvYiB0aXRsZScpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIExvYWQgdXNlciBkYXRhIG9uIHRoaXMgYWN0aXZpdHk6XHJcbiAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnNlcnZpY2VzKHVzZXJKb2J0aXRsZS5zZXJ2aWNlcygpKTtcclxuICAgICAgICAgICAgLy8gRmlsbCBpbiBqb2IgdGl0bGUgbmFtZVxyXG4gICAgICAgICAgICB0aGlzLmFwcC5tb2RlbC5nZXRKb2JUaXRsZShqb2JUaXRsZUlEKS50aGVuKGZ1bmN0aW9uKGpvYlRpdGxlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWpvYlRpdGxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ05vIGpvYiB0aXRsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMubmF2QmFyLmxlZnRBY3Rpb24oKS50ZXh0KGpvYlRpdGxlLnNpbmd1bGFyTmFtZSgpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMucmVxdWVzdERhdGEuc2VsZWN0U2VydmljZXMgPT09IHRydWUpIHtcclxuICAgICAgICB0aGlzLnZpZXdNb2RlbC5pc1NlbGVjdGlvbk1vZGUodHJ1ZSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLyogVHJpYWxzIHRvIHByZXNldHMgdGhlIHNlbGVjdGVkIHNlcnZpY2VzLCBOT1QgV09SS0lOR1xyXG4gICAgICAgIHZhciBzZXJ2aWNlcyA9IChvcHRpb25zLnNlbGVjdGVkU2VydmljZXMgfHwgW10pO1xyXG4gICAgICAgIHZhciBzZWxlY3RlZFNlcnZpY2VzID0gdGhpcy52aWV3TW9kZWwuc2VsZWN0ZWRTZXJ2aWNlcztcclxuICAgICAgICBzZWxlY3RlZFNlcnZpY2VzLnJlbW92ZUFsbCgpO1xyXG4gICAgICAgIHRoaXMudmlld01vZGVsLnNlcnZpY2VzKCkuZm9yRWFjaChmdW5jdGlvbihzZXJ2aWNlKSB7XHJcbiAgICAgICAgICAgIHNlcnZpY2VzLmZvckVhY2goZnVuY3Rpb24oc2VsU2VydmljZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlbFNlcnZpY2UgPT09IHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlLmlzU2VsZWN0ZWQodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRTZXJ2aWNlcy5wdXNoKHNlcnZpY2UpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlLmlzU2VsZWN0ZWQoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAqL1xyXG4gICAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gU2VsZWN0YWJsZShvYmopIHtcclxuICAgIG9iai5pc1NlbGVjdGVkID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcbiAgICByZXR1cm4gb2JqO1xyXG59XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XHJcblxyXG4gICAgLy8gRnVsbCBsaXN0IG9mIHNlcnZpY2VzXHJcbiAgICB0aGlzLnNlcnZpY2VzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcclxuXHJcbiAgICAvLyBFc3BlY2lhbCBtb2RlIHdoZW4gaW5zdGVhZCBvZiBwaWNrIGFuZCBlZGl0IHdlIGFyZSBqdXN0IHNlbGVjdGluZ1xyXG4gICAgLy8gKHdoZW4gZWRpdGluZyBhbiBhcHBvaW50bWVudClcclxuICAgIHRoaXMuaXNTZWxlY3Rpb25Nb2RlID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcblxyXG4gICAgLy8gR3JvdXBlZCBsaXN0IG9mIHByaWNpbmdzOlxyXG4gICAgLy8gRGVmaW5lZCBncm91cHM6IHJlZ3VsYXIgc2VydmljZXMgYW5kIGFkZC1vbnNcclxuICAgIHRoaXMuZ3JvdXBlZFNlcnZpY2VzID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgdmFyIHNlcnZpY2VzID0gdGhpcy5zZXJ2aWNlcygpO1xyXG4gICAgICAgIHZhciBpc1NlbGVjdGlvbiA9IHRoaXMuaXNTZWxlY3Rpb25Nb2RlKCk7XHJcblxyXG4gICAgICAgIHZhciBzZXJ2aWNlc0dyb3VwID0ge1xyXG4gICAgICAgICAgICAgICAgZ3JvdXA6IGlzU2VsZWN0aW9uID8gJ1NlbGVjdCBzdGFuZGFsb25lIHNlcnZpY2VzJyA6ICdTdGFuZGFsb25lIHNlcnZpY2VzJyxcclxuICAgICAgICAgICAgICAgIHNlcnZpY2VzOiBbXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBhZGRvbnNHcm91cCA9IHtcclxuICAgICAgICAgICAgICAgIGdyb3VwOiBpc1NlbGVjdGlvbiA/ICdTZWxlY3QgYWRkLW9uIHNlcnZpY2VzJyA6ICdBZGQtb24gc2VydmljZXMnLFxyXG4gICAgICAgICAgICAgICAgc2VydmljZXM6IFtdXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGdyb3VwcyA9IFtzZXJ2aWNlc0dyb3VwLCBhZGRvbnNHcm91cF07XHJcblxyXG4gICAgICAgIHNlcnZpY2VzLmZvckVhY2goZnVuY3Rpb24oc2VydmljZSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIGlzQWRkb24gPSBzZXJ2aWNlLmlzQWRkb24oKTtcclxuICAgICAgICAgICAgaWYgKGlzQWRkb24pIHtcclxuICAgICAgICAgICAgICAgIGFkZG9uc0dyb3VwLnNlcnZpY2VzLnB1c2goc2VydmljZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzZXJ2aWNlc0dyb3VwLnNlcnZpY2VzLnB1c2goc2VydmljZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdyb3VwcztcclxuXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZWxlY3RlZFNlcnZpY2VzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcclxuICAgIC8qKlxyXG4gICAgICAgIFRvZ2dsZSB0aGUgc2VsZWN0aW9uIHN0YXR1cyBvZiBhIHNlcnZpY2UsIGFkZGluZ1xyXG4gICAgICAgIG9yIHJlbW92aW5nIGl0IGZyb20gdGhlICdzZWxlY3RlZFNlcnZpY2VzJyBhcnJheS5cclxuICAgICoqL1xyXG4gICAgdGhpcy50b2dnbGVTZXJ2aWNlU2VsZWN0aW9uID0gZnVuY3Rpb24oc2VydmljZSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBpbkluZGV4ID0gLTEsXHJcbiAgICAgICAgICAgIGlzU2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkU2VydmljZXMoKS5zb21lKGZ1bmN0aW9uKHNlbGVjdGVkU2VydmljZSwgaW5kZXgpIHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdGVkU2VydmljZSA9PT0gc2VydmljZSkge1xyXG4gICAgICAgICAgICAgICAgaW5JbmRleCA9IGluZGV4O1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICBzZXJ2aWNlLmlzU2VsZWN0ZWQoIWlzU2VsZWN0ZWQpO1xyXG5cclxuICAgICAgICBpZiAoaXNTZWxlY3RlZClcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFNlcnZpY2VzLnNwbGljZShpbkluZGV4LCAxKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRTZXJ2aWNlcy5wdXNoKHNlcnZpY2UpO1xyXG5cclxuICAgIH0uYmluZCh0aGlzKTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgRW5kcyB0aGUgc2VsZWN0aW9uIHByb2Nlc3MsIHJlYWR5IHRvIGNvbGxlY3Qgc2VsZWN0aW9uXHJcbiAgICAgICAgYW5kIHBhc3NpbmcgaXQgdG8gdGhlIHJlcXVlc3QgYWN0aXZpdHlcclxuICAgICoqL1xyXG4gICAgdGhpcy5lbmRTZWxlY3Rpb24gPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZShmYWxzZSk7XHJcbiAgICAgICAgXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbn1cclxuIiwiLyoqXG4gICAgU2lnbnVwIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKSxcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xuXG52YXIgc2luZ2xldG9uID0gbnVsbDtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFNpZ251cCgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IFNpZ251cEFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcbiAgICBcbiAgICByZXR1cm4gc2luZ2xldG9uO1xufTtcblxuZnVuY3Rpb24gU2lnbnVwQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuQW5vbnltb3VzO1xuICAgIFxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIHRoaXMuZGF0YVZpZXcgPSBuZXcgVmlld01vZGVsKCk7XG4gICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLmRhdGFWaWV3LCAkYWN0aXZpdHkuZ2V0KDApKTtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IG5ldyBOYXZCYXIoe1xuICAgICAgICB0aXRsZTogbnVsbCwgLy8gbnVsbCBmb3IgTG9nb1xuICAgICAgICBsZWZ0QWN0aW9uOiBudWxsLFxuICAgICAgICByaWdodEFjdGlvbjogTmF2QWN0aW9uLm1lbnVPdXRcbiAgICB9KTtcbiAgICBcbiAgICAvLyBQZXJmb3JtIHNpZ24tdXAgcmVxdWVzdCB3aGVuIGlzIHJlcXVlc3RlZCBieSB0aGUgZm9ybTpcbiAgICB0aGlzLmRhdGFWaWV3LmlzU2lnbmluZ1VwLnN1YnNjcmliZShmdW5jdGlvbih2KSB7XG4gICAgICAgIGlmICh2ID09PSB0cnVlKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFBlcmZvcm0gc2lnbnVwXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIE5vdGlmeSBzdGF0ZTpcbiAgICAgICAgICAgIHZhciAkYnRuID0gJGFjdGl2aXR5LmZpbmQoJ1t0eXBlPVwic3VibWl0XCJdJyk7XG4gICAgICAgICAgICAkYnRuLmJ1dHRvbignbG9hZGluZycpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBDbGVhciBwcmV2aW91cyBlcnJvciBzbyBtYWtlcyBjbGVhciB3ZVxuICAgICAgICAgICAgLy8gYXJlIGF0dGVtcHRpbmdcbiAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcuc2lnbnVwRXJyb3IoJycpO1xuICAgICAgICBcbiAgICAgICAgICAgIHZhciBlbmRlZCA9IGZ1bmN0aW9uIGVuZGVkKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcuaXNTaWduaW5nVXAoZmFsc2UpO1xuICAgICAgICAgICAgICAgICRidG4uYnV0dG9uKCdyZXNldCcpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBBZnRlciBjbGVhbi11cCBlcnJvciAodG8gZm9yY2Ugc29tZSB2aWV3IHVwZGF0ZXMpLFxuICAgICAgICAgICAgLy8gdmFsaWRhdGUgYW5kIGFib3J0IG9uIGVycm9yXG4gICAgICAgICAgICAvLyBNYW51YWxseSBjaGVja2luZyBlcnJvciBvbiBlYWNoIGZpZWxkXG4gICAgICAgICAgICBpZiAodGhpcy5kYXRhVmlldy51c2VybmFtZS5lcnJvcigpIHx8XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5wYXNzd29yZC5lcnJvcigpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5zaWdudXBFcnJvcignUmV2aWV3IHlvdXIgZGF0YScpO1xuICAgICAgICAgICAgICAgIGVuZGVkKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBhcHAubW9kZWwuc2lnbnVwKFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcudXNlcm5hbWUoKSxcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFWaWV3LnBhc3N3b3JkKCksXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5wcm9maWxlKClcbiAgICAgICAgICAgICkudGhlbihmdW5jdGlvbihzaWdudXBEYXRhKSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5zaWdudXBFcnJvcignJyk7XG4gICAgICAgICAgICAgICAgZW5kZWQoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgZm9ybSBkYXRhXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy51c2VybmFtZSgnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5wYXNzd29yZCgnJyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuZ29EYXNoYm9hcmQoKTtcblxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgbXNnID0gZXJyICYmIGVyci5yZXNwb25zZUpTT04gJiYgZXJyLnJlc3BvbnNlSlNPTi5lcnJvck1lc3NhZ2UgfHxcbiAgICAgICAgICAgICAgICAgICAgZXJyICYmIGVyci5zdGF0dXNUZXh0IHx8XG4gICAgICAgICAgICAgICAgICAgICdJbnZhbGlkIHVzZXJuYW1lIG9yIHBhc3N3b3JkJztcblxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcuc2lnbnVwRXJyb3IobXNnKTtcbiAgICAgICAgICAgICAgICBlbmRlZCgpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG4gICAgXG4gICAgLy8gRm9jdXMgZmlyc3QgYmFkIGZpZWxkIG9uIGVycm9yXG4gICAgdGhpcy5kYXRhVmlldy5zaWdudXBFcnJvci5zdWJzY3JpYmUoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIC8vIFNpZ251cCBpcyBlYXN5IHNpbmNlIHdlIG1hcmsgYm90aCB1bmlxdWUgZmllbGRzXG4gICAgICAgIC8vIGFzIGVycm9yIG9uIHNpZ251cEVycm9yIChpdHMgYSBnZW5lcmFsIGZvcm0gZXJyb3IpXG4gICAgICAgIHZhciBpbnB1dCA9ICRhY3Rpdml0eS5maW5kKCc6aW5wdXQnKS5nZXQoMCk7XG4gICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgICBpbnB1dC5mb2N1cygpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpbnB1dC5ibHVyKCk7XG4gICAgfSk7XG59XG5cblNpZ251cEFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG5cbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnJvdXRlICYmXG4gICAgICAgIG9wdGlvbnMucm91dGUuc2VnbWVudHMgJiZcbiAgICAgICAgb3B0aW9ucy5yb3V0ZS5zZWdtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5kYXRhVmlldy5wcm9maWxlKG9wdGlvbnMucm91dGUuc2VnbWVudHNbMF0pO1xuICAgIH1cbn07XG52YXIgRm9ybUNyZWRlbnRpYWxzID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9Gb3JtQ3JlZGVudGlhbHMnKTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG4gICAgdmFyIGNyZWRlbnRpYWxzID0gbmV3IEZvcm1DcmVkZW50aWFscygpOyAgICBcbiAgICB0aGlzLnVzZXJuYW1lID0gY3JlZGVudGlhbHMudXNlcm5hbWU7XG4gICAgdGhpcy5wYXNzd29yZCA9IGNyZWRlbnRpYWxzLnBhc3N3b3JkO1xuXG4gICAgdGhpcy5zaWdudXBFcnJvciA9IGtvLm9ic2VydmFibGUoJycpO1xuICAgIFxuICAgIHRoaXMuaXNTaWduaW5nVXAgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcbiAgICBcbiAgICB0aGlzLnBlcmZvcm1TaWdudXAgPSBmdW5jdGlvbiBwZXJmb3JtU2lnbnVwKCkge1xuXG4gICAgICAgIHRoaXMuaXNTaWduaW5nVXAodHJ1ZSk7XG4gICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5wcm9maWxlID0ga28ub2JzZXJ2YWJsZSgnY3VzdG9tZXInKTtcbn1cbiIsIi8qKlxyXG4gICAgdGV4dEVkaXRvciBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcixcclxuICAgIE5hdkJhciA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QmFyJyksXHJcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xyXG4gICAgXHJcbnZhciBzaW5nbGV0b24gPSBudWxsO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFRleHRFZGl0b3IoJGFjdGl2aXR5LCBhcHApIHtcclxuICAgIFxyXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcclxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgVGV4dEVkaXRvckFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFRleHRFZGl0b3JBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XHJcbiAgICAgICAgLy8gVGl0bGUgaXMgZW1wdHkgZXZlciwgc2luY2Ugd2UgYXJlIGluICdnbyBiYWNrJyBtb2RlIGFsbCB0aGUgdGltZSBoZXJlXHJcbiAgICAgICAgdGl0bGU6ICcnLFxyXG4gICAgICAgIC8vIGJ1dCBsZWZ0QWN0aW9uLnRleHQgaXMgdXBkYXRlZCBvbiAnc2hvdycgd2l0aCBwYXNzZWQgdmFsdWUsXHJcbiAgICAgICAgLy8gc28gd2UgbmVlZCBhIGNsb25lIHRvIG5vdCBtb2RpZnkgdGhlIHNoYXJlZCBzdGF0aWMgaW5zdGFuY2VcclxuICAgICAgICBsZWZ0QWN0aW9uOiBOYXZBY3Rpb24uZ29CYWNrLm1vZGVsLmNsb25lKHsgaXNUaXRsZTogdHJ1ZSB9KSxcclxuICAgICAgICByaWdodEFjdGlvbjogTmF2QWN0aW9uLmdvSGVscEluZGV4XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gRmllbGRzXHJcbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcclxuICAgIHRoaXMuYXBwID0gYXBwO1xyXG4gICAgdGhpcy4kdGV4dGFyZWEgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCd0ZXh0YXJlYScpO1xyXG4gICAgdGhpcy50ZXh0YXJlYSA9IHRoaXMuJHRleHRhcmVhLmdldCgwKTtcclxuXHJcbiAgICAvLyBEYXRhXHJcbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xyXG4gICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLmRhdGFWaWV3LCAkYWN0aXZpdHkuZ2V0KDApKTtcclxuICAgIFxyXG4gICAgLy8gT2JqZWN0IHRvIGhvbGQgdGhlIG9wdGlvbnMgcGFzc2VkIG9uICdzaG93JyBhcyBhIHJlc3VsdFxyXG4gICAgLy8gb2YgYSByZXF1ZXN0IGZyb20gYW5vdGhlciBhY3Rpdml0eVxyXG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XHJcbiAgICBcclxuICAgIC8vIEhhbmRsZXJzXHJcbiAgICAvLyBIYW5kbGVyIGZvciB0aGUgJ3NhdmVkJyBldmVudCBzbyB0aGUgYWN0aXZpdHlcclxuICAgIC8vIHJldHVybnMgYmFjayB0byB0aGUgcmVxdWVzdGVyIGFjdGl2aXR5IGdpdmluZyBpdFxyXG4gICAgLy8gdGhlIG5ldyB0ZXh0XHJcbiAgICB0aGlzLmRhdGFWaWV3Lm9uKCdzYXZlZCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnJlcXVlc3RJbmZvKSB7XHJcbiAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgaW5mbyB3aXRoIHRoZSBuZXcgdGV4dFxyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvLnRleHQgPSB0aGlzLmRhdGFWaWV3LnRleHQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGFuZCBwYXNzIGl0IGJhY2tcclxuICAgICAgICB0aGlzLmFwcC5zaGVsbC5nb0JhY2sodGhpcy5yZXF1ZXN0SW5mbyk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG4gXHJcbiAgICAvLyBIYW5kbGVyIHRoZSBjYW5jZWwgZXZlbnRcclxuICAgIHRoaXMuZGF0YVZpZXcub24oJ2NhbmNlbCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIHJldHVybiwgbm90aGluZyBjaGFuZ2VkXHJcbiAgICAgICAgYXBwLnNoZWxsLmdvQmFjaygpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufVxyXG5cclxuVGV4dEVkaXRvckFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcbiAgICBcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG9wdGlvbnM7XHJcblxyXG4gICAgLy8gU2V0IG5hdmlnYXRpb24gdGl0bGUgb3Igbm90aGluZ1xyXG4gICAgdGhpcy5uYXZCYXIubGVmdEFjdGlvbigpLnRleHQob3B0aW9ucy50aXRsZSB8fCAnJyk7XHJcbiAgICBcclxuICAgIC8vIEZpZWxkIGhlYWRlclxyXG4gICAgdGhpcy5kYXRhVmlldy5oZWFkZXJUZXh0KG9wdGlvbnMuaGVhZGVyKTtcclxuICAgIHRoaXMuZGF0YVZpZXcudGV4dChvcHRpb25zLnRleHQpO1xyXG4gICAgaWYgKG9wdGlvbnMucm93c051bWJlcilcclxuICAgICAgICB0aGlzLmRhdGFWaWV3LnJvd3NOdW1iZXIob3B0aW9ucy5yb3dzTnVtYmVyKTtcclxuICAgICAgICBcclxuICAgIC8vIElubWVkaWF0ZSBmb2N1cyB0byB0aGUgdGV4dGFyZWEgZm9yIGJldHRlciB1c2FiaWxpdHlcclxuICAgIHRoaXMudGV4dGFyZWEuZm9jdXMoKTtcclxuICAgIHRoaXMuJHRleHRhcmVhLmNsaWNrKCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XHJcblxyXG4gICAgdGhpcy5oZWFkZXJUZXh0ID0ga28ub2JzZXJ2YWJsZSgnVGV4dCcpO1xyXG5cclxuICAgIC8vIFRleHQgdG8gZWRpdFxyXG4gICAgdGhpcy50ZXh0ID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcbiAgICBcclxuICAgIC8vIE51bWJlciBvZiByb3dzIGZvciB0aGUgdGV4dGFyZWFcclxuICAgIHRoaXMucm93c051bWJlciA9IGtvLm9ic2VydmFibGUoMik7XHJcblxyXG4gICAgdGhpcy5jYW5jZWwgPSBmdW5jdGlvbiBjYW5jZWwoKSB7XHJcbiAgICAgICAgdGhpcy5lbWl0KCdjYW5jZWwnKTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIHRoaXMuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICAgICAgdGhpcy5lbWl0KCdzYXZlZCcpO1xyXG4gICAgfTtcclxufVxyXG5cclxuVmlld01vZGVsLl9pbmhlcml0cyhFdmVudEVtaXR0ZXIpO1xyXG4iLCIvKipcclxuICAgIFJlZ2lzdHJhdGlvbiBvZiBjdXN0b20gaHRtbCBjb21wb25lbnRzIHVzZWQgYnkgdGhlIEFwcC5cclxuICAgIEFsbCB3aXRoICdhcHAtJyBhcyBwcmVmaXguXHJcbiAgICBcclxuICAgIFNvbWUgZGVmaW5pdGlvbnMgbWF5IGJlIGluY2x1ZGVkIG9uLWxpbmUgcmF0aGVyIHRoYW4gb24gc2VwYXJhdGVkXHJcbiAgICBmaWxlcyAodmlld21vZGVscyksIHRlbXBsYXRlcyBhcmUgbGlua2VkIHNvIG5lZWQgdG8gYmUgXHJcbiAgICBpbmNsdWRlZCBpbiB0aGUgaHRtbCBmaWxlIHdpdGggdGhlIHNhbWUgSUQgdGhhdCByZWZlcmVuY2VkIGhlcmUsXHJcbiAgICB1c3VhbGx5IHVzaW5nIGFzIERPTSBJRCB0aGUgc2FtZSBuYW1lIGFzIHRoZSBjb21wb25lbnQgd2l0aCBzdWZpeCAnLXRlbXBsYXRlJy5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbnZhciBwcm9wVG9vbHMgPSByZXF1aXJlKCcuL3V0aWxzL2pzUHJvcGVydGllc1Rvb2xzJyk7XHJcblxyXG5mdW5jdGlvbiBnZXRPYnNlcnZhYmxlKG9ic09yVmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2Yob2JzT3JWYWx1ZSkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgcmV0dXJuIG9ic09yVmFsdWU7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuIGtvLm9ic2VydmFibGUob2JzT3JWYWx1ZSk7XHJcbn1cclxuXHJcbmV4cG9ydHMucmVnaXN0ZXJBbGwgPSBmdW5jdGlvbigpIHtcclxuICAgIFxyXG4gICAgLy8vIG5hdmJhci1hY3Rpb25cclxuICAgIGtvLmNvbXBvbmVudHMucmVnaXN0ZXIoJ2FwcC1uYXZiYXItYWN0aW9uJywge1xyXG4gICAgICAgIHRlbXBsYXRlOiB7IGVsZW1lbnQ6ICduYXZiYXItYWN0aW9uLXRlbXBsYXRlJyB9LFxyXG4gICAgICAgIHZpZXdNb2RlbDogZnVuY3Rpb24ocGFyYW1zKSB7XHJcblxyXG4gICAgICAgICAgICBwcm9wVG9vbHMuZGVmaW5lR2V0dGVyKHRoaXMsICdhY3Rpb24nLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zLmFjdGlvbiAmJiBwYXJhbXMubmF2QmFyKCkgP1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtcy5uYXZCYXIoKVtwYXJhbXMuYWN0aW9uXSgpIDpcclxuICAgICAgICAgICAgICAgICAgICBudWxsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8vIHVubGFiZWxlZC1pbnB1dFxyXG4gICAga28uY29tcG9uZW50cy5yZWdpc3RlcignYXBwLXVubGFiZWxlZC1pbnB1dCcsIHtcclxuICAgICAgICB0ZW1wbGF0ZTogeyBlbGVtZW50OiAndW5sYWJlbGVkLWlucHV0LXRlbXBsYXRlJyB9LFxyXG4gICAgICAgIHZpZXdNb2RlbDogZnVuY3Rpb24ocGFyYW1zKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gZ2V0T2JzZXJ2YWJsZShwYXJhbXMudmFsdWUpO1xyXG4gICAgICAgICAgICB0aGlzLnBsYWNlaG9sZGVyID0gZ2V0T2JzZXJ2YWJsZShwYXJhbXMucGxhY2Vob2xkZXIpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLy8gZmVlZGJhY2stZW50cnlcclxuICAgIGtvLmNvbXBvbmVudHMucmVnaXN0ZXIoJ2FwcC1mZWVkYmFjay1lbnRyeScsIHtcclxuICAgICAgICB0ZW1wbGF0ZTogeyBlbGVtZW50OiAnZmVlZGJhY2stZW50cnktdGVtcGxhdGUnIH0sXHJcbiAgICAgICAgdmlld01vZGVsOiBmdW5jdGlvbihwYXJhbXMpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2VjdGlvbiA9IGdldE9ic2VydmFibGUocGFyYW1zLnNlY3Rpb24gfHwgJycpO1xyXG4gICAgICAgICAgICB0aGlzLnVybCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAnL2ZlZWRiYWNrLycgKyB0aGlzLnNlY3Rpb24oKTtcclxuICAgICAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgTmF2YmFyIGV4dGVuc2lvbiBvZiB0aGUgQXBwLFxyXG4gICAgYWRkcyB0aGUgZWxlbWVudHMgdG8gbWFuYWdlIGEgdmlldyBtb2RlbFxyXG4gICAgZm9yIHRoZSBOYXZCYXIgYW5kIGF1dG9tYXRpYyBjaGFuZ2VzXHJcbiAgICB1bmRlciBzb21lIG1vZGVsIGNoYW5nZXMgbGlrZSB1c2VyIGxvZ2luL2xvZ291dFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIE5hdkJhciA9IHJlcXVpcmUoJy4vdmlld21vZGVscy9OYXZCYXInKSxcclxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcclxuXHJcbmV4cG9ydHMuZXh0ZW5kcyA9IGZ1bmN0aW9uIChhcHApIHtcclxuICAgIFxyXG4gICAgLy8gUkVWSUVXOiBzdGlsbCBuZWVkZWQ/IE1heWJlIHRoZSBwZXIgYWN0aXZpdHkgbmF2QmFyIG1lYW5zXHJcbiAgICAvLyB0aGlzIGlzIG5vdCBuZWVkZWQuIFNvbWUgcHJldmlvdXMgbG9naWMgd2FzIGFscmVhZHkgcmVtb3ZlZFxyXG4gICAgLy8gYmVjYXVzZSB3YXMgdXNlbGVzcy5cclxuICAgIC8vXHJcbiAgICAvLyBBZGp1c3QgdGhlIG5hdmJhciBzZXR1cCBkZXBlbmRpbmcgb24gY3VycmVudCB1c2VyLFxyXG4gICAgLy8gc2luY2UgZGlmZmVyZW50IHRoaW5ncyBhcmUgbmVlZCBmb3IgbG9nZ2VkLWluL291dC5cclxuICAgIGZ1bmN0aW9uIGFkanVzdFVzZXJCYXIoKSB7XHJcblxyXG4gICAgICAgIHZhciB1c2VyID0gYXBwLm1vZGVsLnVzZXIoKTtcclxuXHJcbiAgICAgICAgaWYgKHVzZXIuaXNBbm9ueW1vdXMoKSkge1xyXG4gICAgICAgICAgICBhcHAubmF2QmFyKCkucmlnaHRBY3Rpb24oTmF2QWN0aW9uLm1lbnVPdXQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIENvbW1lbnRlZCBsaW5lcywgdXNlZCBwcmV2aW91c2x5IGJ1dCB1bnVzZWQgbm93LCBpdCBtdXN0IGJlIGVub3VnaCB3aXRoIHRoZSB1cGRhdGVcclxuICAgIC8vIHBlciBhY3Rpdml0eSBjaGFuZ2VcclxuICAgIC8vYXBwLm1vZGVsLnVzZXIoKS5pc0Fub255bW91cy5zdWJzY3JpYmUodXBkYXRlU3RhdGVzT25Vc2VyQ2hhbmdlKTtcclxuICAgIC8vYXBwLm1vZGVsLnVzZXIoKS5vbmJvYXJkaW5nU3RlcC5zdWJzY3JpYmUodXBkYXRlU3RhdGVzT25Vc2VyQ2hhbmdlKTtcclxuICAgIFxyXG4gICAgYXBwLm5hdkJhciA9IGtvLm9ic2VydmFibGUobnVsbCk7XHJcbiAgICBcclxuICAgIHZhciByZWZyZXNoTmF2ID0gZnVuY3Rpb24gcmVmcmVzaE5hdigpIHtcclxuICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50IHRvIGZvcmNlIGEgY29tcG9uZW50IHVwZGF0ZVxyXG4gICAgICAgICQoJy5BcHBOYXYnKS50cmlnZ2VyKCdjb250ZW50Q2hhbmdlJyk7XHJcbiAgICB9O1xyXG4gICAgdmFyIGF1dG9SZWZyZXNoTmF2ID0gZnVuY3Rpb24gYXV0b1JlZnJlc2hOYXYoYWN0aW9uKSB7XHJcbiAgICAgICAgaWYgKGFjdGlvbikge1xyXG4gICAgICAgICAgICBhY3Rpb24udGV4dC5zdWJzY3JpYmUocmVmcmVzaE5hdik7XHJcbiAgICAgICAgICAgIGFjdGlvbi5pc1RpdGxlLnN1YnNjcmliZShyZWZyZXNoTmF2KTtcclxuICAgICAgICAgICAgYWN0aW9uLmljb24uc3Vic2NyaWJlKHJlZnJlc2hOYXYpO1xyXG4gICAgICAgICAgICBhY3Rpb24uaXNNZW51LnN1YnNjcmliZShyZWZyZXNoTmF2KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICAgIFVwZGF0ZSB0aGUgbmF2IG1vZGVsIHVzaW5nIHRoZSBBY3Rpdml0eSBkZWZhdWx0c1xyXG4gICAgKiovXHJcbiAgICBhcHAudXBkYXRlQXBwTmF2ID0gZnVuY3Rpb24gdXBkYXRlQXBwTmF2KGFjdGl2aXR5KSB7XHJcblxyXG4gICAgICAgIC8vIGlmIHRoZSBhY3Rpdml0eSBoYXMgaXRzIG93blxyXG4gICAgICAgIGlmICgnbmF2QmFyJyBpbiBhY3Rpdml0eSkge1xyXG4gICAgICAgICAgICAvLyBVc2Ugc3BlY2lhbGl6aWVkIGFjdGl2aXR5IGJhciBkYXRhXHJcbiAgICAgICAgICAgIGFwcC5uYXZCYXIoYWN0aXZpdHkubmF2QmFyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFVzZSBkZWZhdWx0IG9uZVxyXG4gICAgICAgICAgICBhcHAubmF2QmFyKG5ldyBOYXZCYXIoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBUT0RPIERvdWJsZSBjaGVjayBpZiBuZWVkZWQuXHJcbiAgICAgICAgLy8gTGF0ZXN0IGNoYW5nZXMsIHdoZW4gbmVlZGVkXHJcbiAgICAgICAgYWRqdXN0VXNlckJhcigpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJlZnJlc2hOYXYoKTtcclxuICAgICAgICBhdXRvUmVmcmVzaE5hdihhcHAubmF2QmFyKCkubGVmdEFjdGlvbigpKTtcclxuICAgICAgICBhdXRvUmVmcmVzaE5hdihhcHAubmF2QmFyKCkucmlnaHRBY3Rpb24oKSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIFVwZGF0ZSB0aGUgYXBwIG1lbnUgdG8gaGlnaGxpZ2h0IHRoZVxyXG4gICAgICAgIGdpdmVuIGxpbmsgbmFtZVxyXG4gICAgKiovXHJcbiAgICBhcHAudXBkYXRlTWVudSA9IGZ1bmN0aW9uIHVwZGF0ZU1lbnUobmFtZSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciAkbWVudSA9ICQoJy5BcHAtbWVudXMgLm5hdmJhci1jb2xsYXBzZScpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFJlbW92ZSBhbnkgYWN0aXZlXHJcbiAgICAgICAgJG1lbnVcclxuICAgICAgICAuZmluZCgnbGknKVxyXG4gICAgICAgIC5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgLy8gQWRkIGFjdGl2ZVxyXG4gICAgICAgICRtZW51XHJcbiAgICAgICAgLmZpbmQoJy5nby0nICsgbmFtZSlcclxuICAgICAgICAuY2xvc2VzdCgnbGknKVxyXG4gICAgICAgIC5hZGRDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgLy8gSGlkZSBtZW51XHJcbiAgICAgICAgJG1lbnVcclxuICAgICAgICAuZmlsdGVyKCc6dmlzaWJsZScpXHJcbiAgICAgICAgLmNvbGxhcHNlKCdoaWRlJyk7XHJcbiAgICB9O1xyXG59O1xyXG4iLCIvKipcclxuICAgIExpc3Qgb2YgYWN0aXZpdGllcyBsb2FkZWQgaW4gdGhlIEFwcCxcclxuICAgIGFzIGFuIG9iamVjdCB3aXRoIHRoZSBhY3Rpdml0eSBuYW1lIGFzIHRoZSBrZXlcclxuICAgIGFuZCB0aGUgY29udHJvbGxlciBhcyB2YWx1ZS5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgJ2NhbGVuZGFyJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NhbGVuZGFyJyksXHJcbiAgICAnZGF0ZXRpbWVQaWNrZXInOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvZGF0ZXRpbWVQaWNrZXInKSxcclxuICAgICdjbGllbnRzJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NsaWVudHMnKSxcclxuICAgICdzZXJ2aWNlcyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9zZXJ2aWNlcycpLFxyXG4gICAgJ2xvY2F0aW9ucyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9sb2NhdGlvbnMnKSxcclxuICAgICd0ZXh0RWRpdG9yJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL3RleHRFZGl0b3InKSxcclxuICAgICdob21lJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2hvbWUnKSxcclxuICAgICdhcHBvaW50bWVudCc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9hcHBvaW50bWVudCcpLFxyXG4gICAgJ2Jvb2tpbmdDb25maXJtYXRpb24nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvYm9va2luZ0NvbmZpcm1hdGlvbicpLFxyXG4gICAgJ2luZGV4JzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2luZGV4JyksXHJcbiAgICAnbG9naW4nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvbG9naW4nKSxcclxuICAgICdsb2dvdXQnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvbG9nb3V0JyksXHJcbiAgICAnbGVhcm5Nb3JlJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2xlYXJuTW9yZScpLFxyXG4gICAgJ3NpZ251cCc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9zaWdudXAnKSxcclxuICAgICdjb250YWN0SW5mbyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jb250YWN0SW5mbycpLFxyXG4gICAgJ29uYm9hcmRpbmdQb3NpdGlvbnMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvb25ib2FyZGluZ1Bvc2l0aW9ucycpLFxyXG4gICAgJ29uYm9hcmRpbmdIb21lJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL29uYm9hcmRpbmdIb21lJyksXHJcbiAgICAnbG9jYXRpb25FZGl0aW9uJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2xvY2F0aW9uRWRpdGlvbicpLFxyXG4gICAgJ29uYm9hcmRpbmdDb21wbGV0ZSc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9vbmJvYXJkaW5nQ29tcGxldGUnKSxcclxuICAgICdhY2NvdW50JzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2FjY291bnQnKSxcclxuICAgICdpbmJveCc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9pbmJveCcpLFxyXG4gICAgJ2NvbnZlcnNhdGlvbic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jb252ZXJzYXRpb24nKSxcclxuICAgICdzY2hlZHVsaW5nJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL3NjaGVkdWxpbmcnKSxcclxuICAgICdqb2J0aXRsZXMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvam9idGl0bGVzJyksXHJcbiAgICAnZmVlZGJhY2snOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvZmVlZGJhY2snKSxcclxuICAgICdmYXFzJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2ZhcXMnKSxcclxuICAgICdmZWVkYmFja0Zvcm0nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvZmVlZGJhY2tGb3JtJyksXHJcbiAgICAnY29udGFjdEZvcm0nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvY29udGFjdEZvcm0nKSxcclxuICAgICdjbXMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvY21zJyksXHJcbiAgICAnY2xpZW50RWRpdGlvbic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jbGllbnRFZGl0aW9uJyksXHJcbiAgICAnc2NoZWR1bGluZ1ByZWZlcmVuY2VzJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL3NjaGVkdWxpbmdQcmVmZXJlbmNlcycpLFxyXG4gICAgJ2NhbGVuZGFyU3luY2luZyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jYWxlbmRhclN5bmNpbmcnKVxyXG59O1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG4vKiogR2xvYmFsIGRlcGVuZGVuY2llcyAqKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LW1vYmlsZScpO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG5rby5iaW5kaW5nSGFuZGxlcnMuZm9ybWF0ID0gcmVxdWlyZSgna28vZm9ybWF0QmluZGluZycpLmZvcm1hdEJpbmRpbmc7XHJcbnZhciBib290a25vY2sgPSByZXF1aXJlKCcuL3V0aWxzL2Jvb3Rrbm9ja0JpbmRpbmdIZWxwZXJzJyk7XHJcbnJlcXVpcmUoJy4vdXRpbHMvRnVuY3Rpb24ucHJvdG90eXBlLl9pbmhlcml0cycpO1xyXG5yZXF1aXJlKCcuL3V0aWxzL0Z1bmN0aW9uLnByb3RvdHlwZS5fZGVsYXllZCcpO1xyXG4vLyBQcm9taXNlIHBvbHlmaWxsLCBzbyBpdHMgbm90ICdyZXF1aXJlJ2QgcGVyIG1vZHVsZTpcclxucmVxdWlyZSgnZXM2LXByb21pc2UnKS5wb2x5ZmlsbCgpO1xyXG5cclxudmFyIGxheW91dFVwZGF0ZUV2ZW50ID0gcmVxdWlyZSgnbGF5b3V0VXBkYXRlRXZlbnQnKTtcclxudmFyIE5hdkJhciA9IHJlcXVpcmUoJy4vdmlld21vZGVscy9OYXZCYXInKSxcclxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4vdmlld21vZGVscy9OYXZBY3Rpb24nKSxcclxuICAgIEFwcE1vZGVsID0gcmVxdWlyZSgnLi92aWV3bW9kZWxzL0FwcE1vZGVsJyk7XHJcblxyXG4vLyBSZWdpc3RlciB0aGUgc3BlY2lhbCBsb2NhbGVcclxucmVxdWlyZSgnLi9sb2NhbGVzL2VuLVVTLUxDJyk7XHJcblxyXG4vKipcclxuICAgIEEgc2V0IG9mIGZpeGVzL3dvcmthcm91bmRzIGZvciBCb290c3RyYXAgYmVoYXZpb3IvcGx1Z2luc1xyXG4gICAgdG8gYmUgZXhlY3V0ZWQgYmVmb3JlIEJvb3RzdHJhcCBpcyBpbmNsdWRlZC9leGVjdXRlZC5cclxuICAgIEZvciBleGFtcGxlLCBiZWNhdXNlIG9mIGRhdGEtYmluZGluZyByZW1vdmluZy9jcmVhdGluZyBlbGVtZW50cyxcclxuICAgIHNvbWUgb2xkIHJlZmVyZW5jZXMgdG8gcmVtb3ZlZCBpdGVtcyBtYXkgZ2V0IGFsaXZlIGFuZCBuZWVkIHVwZGF0ZSxcclxuICAgIG9yIHJlLWVuYWJsaW5nIHNvbWUgYmVoYXZpb3JzLlxyXG4qKi9cclxuZnVuY3Rpb24gcHJlQm9vdHN0cmFwV29ya2Fyb3VuZHMoKSB7XHJcbiAgICAvLyBJbnRlcm5hbCBCb290c3RyYXAgc291cmNlIHV0aWxpdHlcclxuICAgIGZ1bmN0aW9uIGdldFRhcmdldEZyb21UcmlnZ2VyKCR0cmlnZ2VyKSB7XHJcbiAgICAgICAgdmFyIGhyZWYsXHJcbiAgICAgICAgICAgIHRhcmdldCA9ICR0cmlnZ2VyLmF0dHIoJ2RhdGEtdGFyZ2V0JykgfHxcclxuICAgICAgICAgICAgKGhyZWYgPSAkdHJpZ2dlci5hdHRyKCdocmVmJykpICYmIFxyXG4gICAgICAgICAgICBocmVmLnJlcGxhY2UoLy4qKD89I1teXFxzXSskKS8sICcnKTsgLy8gc3RyaXAgZm9yIGllN1xyXG5cclxuICAgICAgICByZXR1cm4gJCh0YXJnZXQpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBCdWc6IG5hdmJhci1jb2xsYXBzZSBlbGVtZW50cyBob2xkIGEgcmVmZXJlbmNlIHRvIHRoZWlyIG9yaWdpbmFsXHJcbiAgICAvLyAkdHJpZ2dlciwgYnV0IHRoYXQgdHJpZ2dlciBjYW4gY2hhbmdlIG9uIGRpZmZlcmVudCAnY2xpY2tzJyBvclxyXG4gICAgLy8gZ2V0IHJlbW92ZWQgdGhlIG9yaWdpbmFsLCBzbyBpdCBtdXN0IHJlZmVyZW5jZSB0aGUgbmV3IG9uZVxyXG4gICAgLy8gKHRoZSBsYXRlc3RzIGNsaWNrZWQsIGFuZCBub3QgdGhlIGNhY2hlZCBvbmUgdW5kZXIgdGhlICdkYXRhJyBBUEkpLiAgICBcclxuICAgIC8vIE5PVEU6IGhhbmRsZXIgbXVzdCBleGVjdXRlIGJlZm9yZSB0aGUgQm9vdHN0cmFwIGhhbmRsZXIgZm9yIHRoZSBzYW1lXHJcbiAgICAvLyBldmVudCBpbiBvcmRlciB0byB3b3JrLlxyXG4gICAgJChkb2N1bWVudCkub24oJ2NsaWNrLmJzLmNvbGxhcHNlLmRhdGEtYXBpLndvcmthcm91bmQnLCAnW2RhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIl0nLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgJHRhcmdldCA9IGdldFRhcmdldEZyb21UcmlnZ2VyKCR0KSxcclxuICAgICAgICAgICAgZGF0YSA9ICR0YXJnZXQgJiYgJHRhcmdldC5kYXRhKCdicy5jb2xsYXBzZScpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIElmIGFueVxyXG4gICAgICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgICAgIC8vIFJlcGxhY2UgdGhlIHRyaWdnZXIgaW4gdGhlIGRhdGEgcmVmZXJlbmNlOlxyXG4gICAgICAgICAgICBkYXRhLiR0cmlnZ2VyID0gJHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIE9uIGVsc2UsIG5vdGhpbmcgdG8gZG8sIGEgbmV3IENvbGxhcHNlIGluc3RhbmNlIHdpbGwgYmUgY3JlYXRlZFxyXG4gICAgICAgIC8vIHdpdGggdGhlIGNvcnJlY3QgdGFyZ2V0LCB0aGUgZmlyc3QgdGltZVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgQXBwIHN0YXRpYyBjbGFzc1xyXG4qKi9cclxudmFyIGFwcCA9IHtcclxuICAgIHNoZWxsOiByZXF1aXJlKCcuL2FwcC5zaGVsbCcpLFxyXG4gICAgXHJcbiAgICAvLyBOZXcgYXBwIG1vZGVsLCB0aGF0IHN0YXJ0cyB3aXRoIGFub255bW91cyB1c2VyXHJcbiAgICBtb2RlbDogbmV3IEFwcE1vZGVsKCksXHJcbiAgICBcclxuICAgIC8qKiBMb2FkIGFjdGl2aXRpZXMgY29udHJvbGxlcnMgKG5vdCBpbml0aWFsaXplZCkgKiovXHJcbiAgICBhY3Rpdml0aWVzOiByZXF1aXJlKCcuL2FwcC5hY3Rpdml0aWVzJyksXHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEp1c3QgcmVkaXJlY3QgdGhlIGJldHRlciBwbGFjZSBmb3IgY3VycmVudCB1c2VyIGFuZCBzdGF0ZS5cclxuICAgICAgICBOT1RFOiBJdHMgYSBkZWxheWVkIGZ1bmN0aW9uLCBzaW5jZSBvbiBtYW55IGNvbnRleHRzIG5lZWQgdG9cclxuICAgICAgICB3YWl0IGZvciB0aGUgY3VycmVudCAncm91dGluZycgZnJvbSBlbmQgYmVmb3JlIGRvIHRoZSBuZXdcclxuICAgICAgICBoaXN0b3J5IGNoYW5nZS5cclxuICAgICAgICBUT0RPOiBNYXliZSwgcmF0aGVyIHRoYW4gZGVsYXkgaXQsIGNhbiBzdG9wIGN1cnJlbnQgcm91dGluZ1xyXG4gICAgICAgIChjaGFuZ2VzIG9uIFNoZWxsIHJlcXVpcmVkKSBhbmQgcGVyZm9ybSB0aGUgbmV3LlxyXG4gICAgICAgIFRPRE86IE1heWJlIGFsdGVybmF0aXZlIHRvIHByZXZpb3VzLCB0byBwcm92aWRlIGEgJ3JlcGxhY2UnXHJcbiAgICAgICAgaW4gc2hlbGwgcmF0aGVyIHRoYW4gYSBnbywgdG8gYXZvaWQgYXBwZW5kIHJlZGlyZWN0IGVudHJpZXNcclxuICAgICAgICBpbiB0aGUgaGlzdG9yeSwgdGhhdCBjcmVhdGUgdGhlIHByb2JsZW0gb2YgJ2Jyb2tlbiBiYWNrIGJ1dHRvbidcclxuICAgICoqL1xyXG4gICAgZ29EYXNoYm9hcmQ6IGZ1bmN0aW9uIGdvRGFzaGJvYXJkKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFRvIGF2b2lkIGluZmluaXRlIGxvb3BzIGlmIHdlIGFscmVhZHkgYXJlIHBlcmZvcm1pbmcgXHJcbiAgICAgICAgLy8gYSBnb0Rhc2hib2FyZCB0YXNrLCB3ZSBmbGFnIHRoZSBleGVjdXRpb25cclxuICAgICAgICAvLyBiZWluZyBjYXJlIG9mIHRoZSBkZWxheSBpbnRyb2R1Y2VkIGluIHRoZSBleGVjdXRpb25cclxuICAgICAgICBpZiAoZ29EYXNoYm9hcmQuX2dvaW5nID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIERlbGF5ZWQgdG8gYXZvaWQgY29sbGlzaW9ucyB3aXRoIGluLXRoZS1taWRkbGVcclxuICAgICAgICAgICAgLy8gdGFza3M6IGp1c3QgYWxsb3dpbmcgY3VycmVudCByb3V0aW5nIHRvIGZpbmlzaFxyXG4gICAgICAgICAgICAvLyBiZWZvcmUgcGVyZm9ybSB0aGUgJ3JlZGlyZWN0J1xyXG4gICAgICAgICAgICAvLyBUT0RPOiBjaGFuZ2UgYnkgYSByZWFsIHJlZGlyZWN0IHRoYXQgaXMgYWJsZSB0b1xyXG4gICAgICAgICAgICAvLyBjYW5jZWwgdGhlIGN1cnJlbnQgYXBwLnNoZWxsIHJvdXRpbmcgcHJvY2Vzcy5cclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICAgICAgICAgIGdvRGFzaGJvYXJkLl9nb2luZyA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG9uYm9hcmRpbmcgPSB0aGlzLm1vZGVsLnVzZXIoKS5vbmJvYXJkaW5nU3RlcCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChvbmJvYXJkaW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaGVsbC5nbygnb25ib2FyZGluZ0hvbWUvJyArIG9uYm9hcmRpbmcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaGVsbC5nbygnaG9tZScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEp1c3QgYmVjYXVzZSBpcyBkZWxheWVkLCBuZWVkc1xyXG4gICAgICAgICAgICAgICAgLy8gdG8gYmUgc2V0IG9mZiBhZnRlciBhbiBpbm1lZGlhdGUgdG8gXHJcbiAgICAgICAgICAgICAgICAvLyBlbnN1cmUgaXMgc2V0IG9mZiBhZnRlciBhbnkgb3RoZXIgYXR0ZW1wdFxyXG4gICAgICAgICAgICAgICAgLy8gdG8gYWRkIGEgZGVsYXllZCBnb0Rhc2hib2FyZDpcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZ29EYXNoYm9hcmQuX2dvaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9LCAxKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKiogQ29udGludWUgYXBwIGNyZWF0aW9uIHdpdGggdGhpbmdzIHRoYXQgbmVlZCBhIHJlZmVyZW5jZSB0byB0aGUgYXBwICoqL1xyXG5cclxucmVxdWlyZSgnLi9hcHAtbmF2YmFyJykuZXh0ZW5kcyhhcHApO1xyXG5cclxucmVxdWlyZSgnLi9hcHAtY29tcG9uZW50cycpLnJlZ2lzdGVyQWxsKCk7XHJcblxyXG5hcHAuZ2V0QWN0aXZpdHkgPSBmdW5jdGlvbiBnZXRBY3Rpdml0eShuYW1lKSB7XHJcbiAgICB2YXIgYWN0aXZpdHkgPSB0aGlzLmFjdGl2aXRpZXNbbmFtZV07XHJcbiAgICBpZiAoYWN0aXZpdHkpIHtcclxuICAgICAgICB2YXIgJGFjdCA9IHRoaXMuc2hlbGwuaXRlbXMuZmluZChuYW1lKTtcclxuICAgICAgICBpZiAoJGFjdCAmJiAkYWN0Lmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuIGFjdGl2aXR5LmluaXQoJGFjdCwgdGhpcyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbnVsbDtcclxufTtcclxuXHJcbmFwcC5nZXRBY3Rpdml0eUNvbnRyb2xsZXJCeVJvdXRlID0gZnVuY3Rpb24gZ2V0QWN0aXZpdHlDb250cm9sbGVyQnlSb3V0ZShyb3V0ZSkge1xyXG4gICAgLy8gRnJvbSB0aGUgcm91dGUgb2JqZWN0LCB0aGUgaW1wb3J0YW50IHBpZWNlIGlzIHJvdXRlLm5hbWVcclxuICAgIC8vIHRoYXQgY29udGFpbnMgdGhlIGFjdGl2aXR5IG5hbWUgZXhjZXB0IGlmIGlzIHRoZSByb290XHJcbiAgICB2YXIgYWN0TmFtZSA9IHJvdXRlLm5hbWUgfHwgdGhpcy5zaGVsbC5pbmRleE5hbWU7XHJcbiAgICBcclxuICAgIHJldHVybiB0aGlzLmdldEFjdGl2aXR5KGFjdE5hbWUpO1xyXG59O1xyXG5cclxuLy8gYWNjZXNzQ29udHJvbCBzZXR1cDogY2Fubm90IGJlIHNwZWNpZmllZCBvbiBTaGVsbCBjcmVhdGlvbiBiZWNhdXNlXHJcbi8vIGRlcGVuZHMgb24gdGhlIGFwcCBpbnN0YW5jZVxyXG5hcHAuc2hlbGwuYWNjZXNzQ29udHJvbCA9IHJlcXVpcmUoJy4vdXRpbHMvYWNjZXNzQ29udHJvbCcpKGFwcCk7XHJcblxyXG4vLyBTaG9ydGN1dCB0byBVc2VyVHlwZSBlbnVtZXJhdGlvbiB1c2VkIHRvIHNldCBwZXJtaXNzaW9uc1xyXG5hcHAuVXNlclR5cGUgPSBhcHAubW9kZWwudXNlcigpLmNvbnN0cnVjdG9yLlVzZXJUeXBlO1xyXG5cclxuLyoqIEFwcCBJbml0ICoqL1xyXG52YXIgYXBwSW5pdCA9IGZ1bmN0aW9uIGFwcEluaXQoKSB7XHJcbiAgICAvKmpzaGludCBtYXhzdGF0ZW1lbnRzOjUwLG1heGNvbXBsZXhpdHk6MTYgKi9cclxuICAgIFxyXG4gICAgLy8gRW5hYmxpbmcgdGhlICdsYXlvdXRVcGRhdGUnIGpRdWVyeSBXaW5kb3cgZXZlbnQgdGhhdCBoYXBwZW5zIG9uIHJlc2l6ZSBhbmQgdHJhbnNpdGlvbmVuZCxcclxuICAgIC8vIGFuZCBjYW4gYmUgdHJpZ2dlcmVkIG1hbnVhbGx5IGJ5IGFueSBzY3JpcHQgdG8gbm90aWZ5IGNoYW5nZXMgb24gbGF5b3V0IHRoYXRcclxuICAgIC8vIG1heSByZXF1aXJlIGFkanVzdG1lbnRzIG9uIG90aGVyIHNjcmlwdHMgdGhhdCBsaXN0ZW4gdG8gaXQuXHJcbiAgICAvLyBUaGUgZXZlbnQgaXMgdGhyb3R0bGUsIGd1YXJhbnRpbmcgdGhhdCB0aGUgbWlub3IgaGFuZGxlcnMgYXJlIGV4ZWN1dGVkIHJhdGhlclxyXG4gICAgLy8gdGhhbiBhIGxvdCBvZiB0aGVtIGluIHNob3J0IHRpbWUgZnJhbWVzIChhcyBoYXBwZW4gd2l0aCAncmVzaXplJyBldmVudHMpLlxyXG4gICAgbGF5b3V0VXBkYXRlRXZlbnQubGF5b3V0VXBkYXRlRXZlbnQgKz0gJyBvcmllbnRhdGlvbmNoYW5nZSc7XHJcbiAgICBsYXlvdXRVcGRhdGVFdmVudC5vbigpO1xyXG4gICAgXHJcbiAgICAvLyBLZXlib2FyZCBwbHVnaW4gZXZlbnRzIGFyZSBub3QgY29tcGF0aWJsZSB3aXRoIGpRdWVyeSBldmVudHMsIGJ1dCBuZWVkZWQgdG9cclxuICAgIC8vIHRyaWdnZXIgYSBsYXlvdXRVcGRhdGUsIHNvIGhlcmUgYXJlIGNvbm5lY3RlZCwgbWFpbmx5IGZpeGluZyBidWdzIG9uIGlPUyB3aGVuIHRoZSBrZXlib2FyZFxyXG4gICAgLy8gaXMgaGlkZGluZy5cclxuICAgIHZhciB0cmlnTGF5b3V0ID0gZnVuY3Rpb24gdHJpZ0xheW91dChldmVudCkge1xyXG4gICAgICAgICQod2luZG93KS50cmlnZ2VyKCdsYXlvdXRVcGRhdGUnKTtcclxuICAgIH07XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbmF0aXZlLmtleWJvYXJkc2hvdycsIHRyaWdMYXlvdXQpO1xyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ25hdGl2ZS5rZXlib2FyZGhpZGUnLCB0cmlnTGF5b3V0KTtcclxuXHJcbiAgICAvLyBpT1MtNysgc3RhdHVzIGJhciBmaXguIEFwcGx5IG9uIHBsdWdpbiBsb2FkZWQgKGNvcmRvdmEvcGhvbmVnYXAgZW52aXJvbm1lbnQpXHJcbiAgICAvLyBhbmQgaW4gYW55IHN5c3RlbSwgc28gYW55IG90aGVyIHN5c3RlbXMgZml4IGl0cyBzb2x2ZWQgdG9vIGlmIG5lZWRlZCBcclxuICAgIC8vIGp1c3QgdXBkYXRpbmcgdGhlIHBsdWdpbiAoZnV0dXJlIHByb29mKSBhbmQgZW5zdXJlIGhvbW9nZW5lb3VzIGNyb3NzIHBsYWZ0Zm9ybSBiZWhhdmlvci5cclxuICAgIGlmICh3aW5kb3cuU3RhdHVzQmFyKSB7XHJcbiAgICAgICAgLy8gRml4IGlPUy03KyBvdmVybGF5IHByb2JsZW1cclxuICAgICAgICAvLyBJcyBpbiBjb25maWcueG1sIHRvbywgYnV0IHNlZW1zIG5vdCB0byB3b3JrIHdpdGhvdXQgbmV4dCBjYWxsOlxyXG4gICAgICAgIHdpbmRvdy5TdGF0dXNCYXIub3ZlcmxheXNXZWJWaWV3KGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgaU9zV2VidmlldyA9IGZhbHNlO1xyXG4gICAgaWYgKHdpbmRvdy5kZXZpY2UgJiYgXHJcbiAgICAgICAgL2lPU3xpUGFkfGlQaG9uZXxpUG9kL2kudGVzdCh3aW5kb3cuZGV2aWNlLnBsYXRmb3JtKSkge1xyXG4gICAgICAgIGlPc1dlYnZpZXcgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBOT1RFOiBTYWZhcmkgaU9TIGJ1ZyB3b3JrYXJvdW5kLCBtaW4taGVpZ2h0L2hlaWdodCBvbiBodG1sIGRvZXNuJ3Qgd29yayBhcyBleHBlY3RlZCxcclxuICAgIC8vIGdldHRpbmcgYmlnZ2VyIHRoYW4gdmlld3BvcnQuXHJcbiAgICB2YXIgaU9TID0gLyhpUGFkfGlQaG9uZXxpUG9kKS9nLnRlc3QoIG5hdmlnYXRvci51c2VyQWdlbnQgKTtcclxuICAgIGlmIChpT1MpIHtcclxuICAgICAgICB2YXIgZ2V0SGVpZ2h0ID0gZnVuY3Rpb24gZ2V0SGVpZ2h0KCkge1xyXG4gICAgICAgICAgICByZXR1cm4gd2luZG93LmlubmVySGVpZ2h0O1xyXG4gICAgICAgICAgICAvLyBJbiBjYXNlIG9mIGVuYWJsZSB0cmFuc3BhcmVudC9vdmVybGF5IFN0YXR1c0JhcjpcclxuICAgICAgICAgICAgLy8gKHdpbmRvdy5pbm5lckhlaWdodCAtIChpT3NXZWJ2aWV3ID8gMjAgOiAwKSlcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgICQoJ2h0bWwnKS5oZWlnaHQoZ2V0SGVpZ2h0KCkgKyAncHgnKTsgICAgICAgIFxyXG4gICAgICAgICQod2luZG93KS5vbignbGF5b3V0VXBkYXRlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICQoJ2h0bWwnKS5oZWlnaHQoZ2V0SGVpZ2h0KCkgKyAncHgnKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBCZWNhdXNlIG9mIHRoZSBpT1M3KzggYnVncyB3aXRoIGhlaWdodCBjYWxjdWxhdGlvbixcclxuICAgIC8vIGEgZGlmZmVyZW50IHdheSBvZiBhcHBseSBjb250ZW50IGhlaWdodCB0byBmaWxsIGFsbCB0aGUgYXZhaWxhYmxlIGhlaWdodCAoYXMgbWluaW11bSlcclxuICAgIC8vIGlzIHJlcXVpcmVkLlxyXG4gICAgLy8gRm9yIHRoYXQsIHRoZSAnZnVsbC1oZWlnaHQnIGNsYXNzIHdhcyBhZGRlZCwgdG8gYmUgdXNlZCBpbiBlbGVtZW50cyBpbnNpZGUgdGhlIFxyXG4gICAgLy8gYWN0aXZpdHkgdGhhdCBuZWVkcyBhbGwgdGhlIGF2YWlsYWJsZSBoZWlnaHQsIGhlcmUgdGhlIGNhbGN1bGF0aW9uIGlzIGFwcGxpZWQgZm9yXHJcbiAgICAvLyBhbGwgcGxhdGZvcm1zIGZvciB0aGlzIGhvbW9nZW5lb3VzIGFwcHJvYWNoIHRvIHNvbHZlIHRoZSBwcm9ibGVtbS5cclxuICAgIChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgJGIgPSAkKCdib2R5Jyk7XHJcbiAgICAgICAgdmFyIGZ1bGxIZWlnaHQgPSBmdW5jdGlvbiBmdWxsSGVpZ2h0KCkge1xyXG4gICAgICAgICAgICB2YXIgaCA9ICRiLmhlaWdodCgpO1xyXG4gICAgICAgICAgICAkKCcuZnVsbC1oZWlnaHQnKVxyXG4gICAgICAgICAgICAvLyBMZXQgYnJvd3NlciB0byBjb21wdXRlXHJcbiAgICAgICAgICAgIC5jc3MoJ2hlaWdodCcsICdhdXRvJylcclxuICAgICAgICAgICAgLy8gQXMgbWluaW11bVxyXG4gICAgICAgICAgICAuY3NzKCdtaW4taGVpZ2h0JywgaClcclxuICAgICAgICAgICAgLy8gU2V0IGV4cGxpY2l0IHRoZSBhdXRvbWF0aWMgY29tcHV0ZWQgaGVpZ2h0XHJcbiAgICAgICAgICAgIC5jc3MoJ2hlaWdodCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gd2UgdXNlIGJveC1zaXppbmc6Ym9yZGVyLWJveCwgc28gbmVlZHMgdG8gYmUgb3V0ZXJIZWlnaHQgd2l0aG91dCBtYXJnaW46XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJCh0aGlzKS5vdXRlckhlaWdodChmYWxzZSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGZ1bGxIZWlnaHQoKTtcclxuICAgICAgICAkKHdpbmRvdykub24oJ2xheW91dFVwZGF0ZScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBmdWxsSGVpZ2h0KCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KSgpO1xyXG4gICAgXHJcbiAgICAvLyBGb3JjZSBhbiB1cGRhdGUgZGVsYXllZCB0byBlbnN1cmUgdXBkYXRlIGFmdGVyIHNvbWUgdGhpbmdzIGRpZCBhZGRpdGlvbmFsIHdvcmtcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ2xheW91dFVwZGF0ZScpO1xyXG4gICAgfSwgMjAwKTtcclxuICAgIFxyXG4gICAgLy8gQm9vdHN0cmFwXHJcbiAgICBwcmVCb290c3RyYXBXb3JrYXJvdW5kcygpO1xyXG4gICAgcmVxdWlyZSgnYm9vdHN0cmFwJyk7XHJcbiAgICBcclxuICAgIC8vIExvYWQgS25vY2tvdXQgYmluZGluZyBoZWxwZXJzXHJcbiAgICBib290a25vY2sucGx1Z0luKGtvKTtcclxuICAgIFxyXG4gICAgLy8gUGx1Z2lucyBzZXR1cFxyXG4gICAgaWYgKHdpbmRvdy5jb3Jkb3ZhICYmIHdpbmRvdy5jb3Jkb3ZhLnBsdWdpbnMgJiYgd2luZG93LmNvcmRvdmEucGx1Z2lucy5LZXlib2FyZCkge1xyXG4gICAgICAgIHdpbmRvdy5jb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQuZGlzYWJsZVNjcm9sbCh0cnVlKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gRWFzeSBsaW5rcyB0byBzaGVsbCBhY3Rpb25zLCBsaWtlIGdvQmFjaywgaW4gaHRtbCBlbGVtZW50c1xyXG4gICAgLy8gRXhhbXBsZTogPGJ1dHRvbiBkYXRhLXNoZWxsPVwiZ29CYWNrIDJcIj5HbyAyIHRpbWVzIGJhY2s8L2J1dHRvbj5cclxuICAgIC8vIE5PVEU6IEltcG9ydGFudCwgcmVnaXN0ZXJlZCBiZWZvcmUgdGhlIHNoZWxsLnJ1biB0byBiZSBleGVjdXRlZFxyXG4gICAgLy8gYmVmb3JlIGl0cyAnY2F0Y2ggYWxsIGxpbmtzJyBoYW5kbGVyXHJcbiAgICAkKGRvY3VtZW50KS5vbigndGFwJywgJ1tkYXRhLXNoZWxsXScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAvLyBVc2luZyBhdHRyIHJhdGhlciB0aGFuIHRoZSAnZGF0YScgQVBJIHRvIGdldCB1cGRhdGVkXHJcbiAgICAgICAgLy8gRE9NIHZhbHVlc1xyXG4gICAgICAgIHZhciBjbWRsaW5lID0gJCh0aGlzKS5hdHRyKCdkYXRhLXNoZWxsJykgfHwgJycsXHJcbiAgICAgICAgICAgIGFyZ3MgPSBjbWRsaW5lLnNwbGl0KCcgJyksXHJcbiAgICAgICAgICAgIGNtZCA9IGFyZ3NbMF07XHJcblxyXG4gICAgICAgIGlmIChjbWQgJiYgdHlwZW9mKGFwcC5zaGVsbFtjbWRdKSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICBhcHAuc2hlbGxbY21kXS5hcHBseShhcHAuc2hlbGwsIGFyZ3Muc2xpY2UoMSkpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gQ2FuY2VsIGFueSBvdGhlciBhY3Rpb24gb24gdGhlIGxpbmssIHRvIGF2b2lkIGRvdWJsZSBsaW5raW5nIHJlc3VsdHNcclxuICAgICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBPbiBDb3Jkb3ZhL1Bob25lZ2FwIGFwcCwgc3BlY2lhbCB0YXJnZXRzIG11c3QgYmUgY2FsbGVkIHVzaW5nIHRoZSB3aW5kb3cub3BlblxyXG4gICAgLy8gQVBJIHRvIGVuc3VyZSBpcyBjb3JyZWN0bHkgb3BlbmVkIG9uIHRoZSBJbkFwcEJyb3dzZXIgKF9ibGFuaykgb3Igc3lzdGVtIGRlZmF1bHRcclxuICAgIC8vIGJyb3dzZXIgKF9zeXN0ZW0pLlxyXG4gICAgaWYgKHdpbmRvdy5jb3Jkb3ZhKSB7XHJcbiAgICAgICAgJChkb2N1bWVudCkub24oJ3RhcCcsICdbdGFyZ2V0PVwiX2JsYW5rXCJdLCBbdGFyZ2V0PVwiX3N5c3RlbVwiXScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgd2luZG93Lm9wZW4odGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSwgdGhpcy5nZXRBdHRyaWJ1dGUoJ3RhcmdldCcpKTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBXaGVuIGFuIGFjdGl2aXR5IGlzIHJlYWR5IGluIHRoZSBTaGVsbDpcclxuICAgIGFwcC5zaGVsbC5vbihhcHAuc2hlbGwuZXZlbnRzLml0ZW1SZWFkeSwgZnVuY3Rpb24oJGFjdCwgc3RhdGUpIHtcclxuICAgICAgICBcclxuICAgICAgICAvLyBDb25uZWN0IHRoZSAnYWN0aXZpdGllcycgY29udHJvbGxlcnMgdG8gdGhlaXIgdmlld3NcclxuICAgICAgICAvLyBHZXQgaW5pdGlhbGl6ZWQgYWN0aXZpdHkgZm9yIHRoZSBET00gZWxlbWVudFxyXG4gICAgICAgIHZhciBhY3ROYW1lID0gJGFjdC5kYXRhKCdhY3Rpdml0eScpO1xyXG4gICAgICAgIHZhciBhY3Rpdml0eSA9IGFwcC5nZXRBY3Rpdml0eShhY3ROYW1lKTtcclxuICAgICAgICAvLyBUcmlnZ2VyIHRoZSAnc2hvdycgbG9naWMgb2YgdGhlIGFjdGl2aXR5IGNvbnRyb2xsZXI6XHJcbiAgICAgICAgYWN0aXZpdHkuc2hvdyhzdGF0ZSk7XHJcblxyXG4gICAgICAgIC8vIFVwZGF0ZSBtZW51XHJcbiAgICAgICAgdmFyIG1lbnVJdGVtID0gYWN0aXZpdHkubWVudUl0ZW0gfHwgYWN0TmFtZTtcclxuICAgICAgICBhcHAudXBkYXRlTWVudShtZW51SXRlbSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVXBkYXRlIGFwcCBuYXZpZ2F0aW9uXHJcbiAgICAgICAgYXBwLnVwZGF0ZUFwcE5hdihhY3Rpdml0eSk7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gU2V0IG1vZGVsIGZvciB0aGUgQXBwTmF2XHJcbiAgICBrby5hcHBseUJpbmRpbmdzKHtcclxuICAgICAgICBuYXZCYXI6IGFwcC5uYXZCYXJcclxuICAgIH0sICQoJy5BcHBOYXYnKS5nZXQoMCkpO1xyXG4gICAgXHJcbiAgICB2YXIgU21hcnROYXZCYXIgPSByZXF1aXJlKCcuL2NvbXBvbmVudHMvU21hcnROYXZCYXInKTtcclxuICAgIHZhciBuYXZCYXJzID0gU21hcnROYXZCYXIuZ2V0QWxsKCk7XHJcbiAgICAvLyBDcmVhdGVzIGFuIGV2ZW50IGJ5IGxpc3RlbmluZyB0byBpdCwgc28gb3RoZXIgc2NyaXB0cyBjYW4gdHJpZ2dlclxyXG4gICAgLy8gYSAnY29udGVudENoYW5nZScgZXZlbnQgdG8gZm9yY2UgYSByZWZyZXNoIG9mIHRoZSBuYXZiYXIgKHRvIFxyXG4gICAgLy8gY2FsY3VsYXRlIGFuZCBhcHBseSBhIG5ldyBzaXplKTsgZXhwZWN0ZWQgZnJvbSBkeW5hbWljIG5hdmJhcnNcclxuICAgIC8vIHRoYXQgY2hhbmdlIGl0IGNvbnRlbnQgYmFzZWQgb24gb2JzZXJ2YWJsZXMuXHJcbiAgICBuYXZCYXJzLmZvckVhY2goZnVuY3Rpb24obmF2YmFyKSB7XHJcbiAgICAgICAgJChuYXZiYXIuZWwpLm9uKCdjb250ZW50Q2hhbmdlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIG5hdmJhci5yZWZyZXNoKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gTGlzdGVuIGZvciBtZW51IGV2ZW50cyAoY29sbGFwc2UgaW4gU21hcnROYXZCYXIpXHJcbiAgICAvLyB0byBhcHBseSB0aGUgYmFja2Ryb3BcclxuICAgIHZhciB0b2dnbGluZ0JhY2tkcm9wID0gZmFsc2U7XHJcbiAgICAkKGRvY3VtZW50KS5vbignc2hvdy5icy5jb2xsYXBzZSBoaWRlLmJzLmNvbGxhcHNlJywgJy5BcHBOYXYgLm5hdmJhci1jb2xsYXBzZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBpZiAoIXRvZ2dsaW5nQmFja2Ryb3ApIHtcclxuICAgICAgICAgICAgdG9nZ2xpbmdCYWNrZHJvcCA9IHRydWU7XHJcbiAgICAgICAgICAgIHZhciBlbmFibGVkID0gZS50eXBlID09PSAnc2hvdyc7XHJcbiAgICAgICAgICAgICQoJ2JvZHknKS50b2dnbGVDbGFzcygndXNlLWJhY2tkcm9wJywgZW5hYmxlZCk7XHJcbiAgICAgICAgICAgIC8vIEhpZGUgYW55IG90aGVyIG9wZW5lZCBjb2xsYXBzZVxyXG4gICAgICAgICAgICAkKCcuY29sbGFwc2luZywgLmNvbGxhcHNlLmluJykuY29sbGFwc2UoJ2hpZGUnKTtcclxuICAgICAgICAgICAgdG9nZ2xpbmdCYWNrZHJvcCA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEFwcCBpbml0OlxyXG4gICAgdmFyIGFsZXJ0RXJyb3IgPSBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICB3aW5kb3cuYWxlcnQoJ1RoZXJlIHdhcyBhbiBlcnJvciBsb2FkaW5nOiAnICsgZXJyICYmIGVyci5tZXNzYWdlIHx8IGVycik7XHJcbiAgICB9O1xyXG5cclxuICAgIGFwcC5tb2RlbC5pbml0KClcclxuICAgIC50aGVuKGFwcC5zaGVsbC5ydW4uYmluZChhcHAuc2hlbGwpLCBhbGVydEVycm9yKVxyXG4gICAgLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgLy8gTWFyayB0aGUgcGFnZSBhcyByZWFkeVxyXG4gICAgICAgICQoJ2h0bWwnKS5hZGRDbGFzcygnaXMtcmVhZHknKTtcclxuICAgICAgICAvLyBBcyBhcHAsIGhpZGVzIHNwbGFzaCBzY3JlZW5cclxuICAgICAgICBpZiAod2luZG93Lm5hdmlnYXRvciAmJiB3aW5kb3cubmF2aWdhdG9yLnNwbGFzaHNjcmVlbikge1xyXG4gICAgICAgICAgICB3aW5kb3cubmF2aWdhdG9yLnNwbGFzaHNjcmVlbi5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgYWxlcnRFcnJvcik7XHJcblxyXG4gICAgLy8gREVCVUdcclxuICAgIHdpbmRvdy5hcHAgPSBhcHA7XHJcbn07XHJcblxyXG4vLyBBcHAgaW5pdCBvbiBwYWdlIHJlYWR5IGFuZCBwaG9uZWdhcCByZWFkeVxyXG5pZiAod2luZG93LmNvcmRvdmEpIHtcclxuICAgIC8vIE9uIERPTS1SZWFkeSBmaXJzdFxyXG4gICAgJChmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBQYWdlIGlzIHJlYWR5LCBkZXZpY2UgaXMgdG9vP1xyXG4gICAgICAgIC8vIE5vdGU6IENvcmRvdmEgZW5zdXJlcyB0byBjYWxsIHRoZSBoYW5kbGVyIGV2ZW4gaWYgdGhlXHJcbiAgICAgICAgLy8gZXZlbnQgd2FzIGFscmVhZHkgZmlyZWQsIHNvIGlzIGdvb2QgdG8gZG8gaXQgaW5zaWRlXHJcbiAgICAgICAgLy8gdGhlIGRvbS1yZWFkeSBhbmQgd2UgYXJlIGVuc3VyaW5nIHRoYXQgZXZlcnl0aGluZyBpc1xyXG4gICAgICAgIC8vIHJlYWR5LlxyXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdkZXZpY2VyZWFkeScsIGFwcEluaXQpO1xyXG4gICAgfSk7XHJcbn0gZWxzZSB7XHJcbiAgICAvLyBPbmx5IG9uIERPTS1SZWFkeSwgZm9yIGluIGJyb3dzZXIgZGV2ZWxvcG1lbnRcclxuICAgICQoYXBwSW5pdCk7XHJcbn0iLCIvKipcclxuICAgIFNldHVwIG9mIHRoZSBzaGVsbCBvYmplY3QgdXNlZCBieSB0aGUgYXBwXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgYmFzZVVybCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcclxuXHJcbi8vdmFyIEhpc3RvcnkgPSByZXF1aXJlKCcuL2FwcC1zaGVsbC1oaXN0b3J5JykuY3JlYXRlKGJhc2VVcmwpO1xyXG52YXIgSGlzdG9yeSA9IHJlcXVpcmUoJy4vdXRpbHMvc2hlbGwvaGFzaGJhbmdIaXN0b3J5Jyk7XHJcblxyXG4vLyBTaGVsbCBkZXBlbmRlbmNpZXNcclxudmFyIHNoZWxsID0gcmVxdWlyZSgnLi91dGlscy9zaGVsbC9pbmRleCcpLFxyXG4gICAgU2hlbGwgPSBzaGVsbC5TaGVsbCxcclxuICAgIERvbUl0ZW1zTWFuYWdlciA9IHNoZWxsLkRvbUl0ZW1zTWFuYWdlcjtcclxuXHJcbnZhciBpT1MgPSAvKGlQYWR8aVBob25lfGlQb2QpL2cudGVzdCggbmF2aWdhdG9yLnVzZXJBZ2VudCApO1xyXG5cclxuLy8gQ3JlYXRpbmcgdGhlIHNoZWxsOlxyXG52YXIgc2hlbGwgPSBuZXcgU2hlbGwoe1xyXG5cclxuICAgIC8vIFNlbGVjdG9yLCBET00gZWxlbWVudCBvciBqUXVlcnkgb2JqZWN0IHBvaW50aW5nXHJcbiAgICAvLyB0aGUgcm9vdCBvciBjb250YWluZXIgZm9yIHRoZSBzaGVsbCBpdGVtc1xyXG4gICAgcm9vdDogJ2JvZHknLFxyXG5cclxuICAgIC8vIElmIGlzIG5vdCBpbiB0aGUgc2l0ZSByb290LCB0aGUgYmFzZSBVUkwgaXMgcmVxdWlyZWQ6XHJcbiAgICBiYXNlVXJsOiBiYXNlVXJsLFxyXG4gICAgXHJcbiAgICBmb3JjZUhhc2hiYW5nOiB0cnVlLFxyXG5cclxuICAgIGluZGV4TmFtZTogJ2luZGV4JyxcclxuXHJcbiAgICAvLyBXT1JLQVJPVU5EOiBVc2luZyB0aGUgJ3RhcCcgZXZlbnQgZm9yIGZhc3RlciBtb2JpbGUgZXhwZXJpZW5jZVxyXG4gICAgLy8gKGZyb20ganF1ZXJ5LW1vYmlsZSBldmVudCkgb24gaU9TIGRldmljZXMsIGJ1dCBsZWZ0XHJcbiAgICAvLyAnY2xpY2snIG9uIG90aGVycyBzaW5jZSB0aGV5IGhhcyBub3QgdGhlIHNsb3ctY2xpY2sgcHJvYmxlbVxyXG4gICAgLy8gdGhhbmtzIHRvIHRoZSBtZXRhLXZpZXdwb3J0LlxyXG4gICAgLy8gV09SS0FST1VORDogSU1QT1JUQU5ULCB1c2luZyAnY2xpY2snIHJhdGhlciB0aGFuICd0YXAnIG9uIEFuZHJvaWRcclxuICAgIC8vIHByZXZlbnRzIGFuIGFwcCBjcmFzaCAob3IgZ28gb3V0IGFuZCBwYWdlIG5vdCBmb3VuZCBvbiBDaHJvbWUgZm9yIEFuZHJvaWQpXHJcbiAgICAvLyBiZWNhdXNlIG9mIHNvbWUgJ2NsaWNrcycgaGFwcGVuaW5nIG9uXHJcbiAgICAvLyBhIGhhbGYtbGluay1lbGVtZW50IHRhcCwgd2hlcmUgdGhlICd0YXAnIGV2ZW50IGRldGVjdHMgYXMgdGFyZ2V0IHRoZSBub24tbGluayBhbmQgdGhlXHJcbiAgICAvLyBsaW5rIGdldHMgZXhlY3V0ZWQgYW55d2F5IGJ5IHRoZSBicm93c2VyLCBub3QgY2F0Y2hlZCBzbyBXZWJ2aWV3IG1vdmVzIHRvIFxyXG4gICAgLy8gYSBub24gZXhpc3RhbnQgZmlsZSAoYW5kIHRoYXRzIG1ha2UgUGhvbmVHYXAgdG8gY3Jhc2gpLlxyXG4gICAgbGlua0V2ZW50OiBpT1MgPyAndGFwJyA6ICdjbGljaycsXHJcblxyXG4gICAgLy8gTm8gbmVlZCBmb3IgbG9hZGVyLCBldmVyeXRoaW5nIGNvbWVzIGJ1bmRsZWRcclxuICAgIGxvYWRlcjogbnVsbCxcclxuXHJcbiAgICAvLyBIaXN0b3J5IFBvbHlmaWxsOlxyXG4gICAgaGlzdG9yeTogSGlzdG9yeSxcclxuXHJcbiAgICAvLyBBIERvbUl0ZW1zTWFuYWdlciBvciBlcXVpdmFsZW50IG9iamVjdCBpbnN0YW5jZSBuZWVkcyB0b1xyXG4gICAgLy8gYmUgcHJvdmlkZWQ6XHJcbiAgICBkb21JdGVtc01hbmFnZXI6IG5ldyBEb21JdGVtc01hbmFnZXIoe1xyXG4gICAgICAgIGlkQXR0cmlidXRlTmFtZTogJ2RhdGEtYWN0aXZpdHknXHJcbiAgICB9KVxyXG59KTtcclxuXHJcbi8vIENhdGNoIGVycm9ycyBvbiBpdGVtL3BhZ2UgbG9hZGluZywgc2hvd2luZy4uXHJcbnNoZWxsLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGVycikge1xyXG4gICAgXHJcbiAgICB2YXIgc3RyID0gJ1Vua25vdyBlcnJvcic7XHJcbiAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZihlcnIpID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICBzdHIgPSBlcnI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGVyci5tZXNzYWdlKSB7XHJcbiAgICAgICAgICAgIHN0ciA9IGVyci5tZXNzYWdlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgc3RyID0gSlNPTi5zdHJpbmdpZnkoZXJyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVE9ETyBjaGFuZ2Ugd2l0aCBhIGRpYWxvZyBvciBzb21ldGhpbmdcclxuICAgIHdpbmRvdy5hbGVydChzdHIpO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2hlbGw7XHJcbiIsIi8qKlxyXG4gICAgQWN0aXZpdHkgYmFzZSBjbGFzc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyksXHJcbiAgICBOYXZCYXIgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkJhcicpO1xyXG5cclxucmVxdWlyZSgnLi4vdXRpbHMvRnVuY3Rpb24ucHJvdG90eXBlLl9pbmhlcml0cycpO1xyXG5cclxuLyoqXHJcbiAgICBBY3Rpdml0eSBjbGFzcyBkZWZpbml0aW9uXHJcbioqL1xyXG5mdW5jdGlvbiBBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xyXG4gICAgdGhpcy5hcHAgPSBhcHA7XHJcblxyXG4gICAgLy8gRGVmYXVsdCBhY2Nlc3MgbGV2ZWw6IGFueW9uZVxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Ob25lO1xyXG4gICAgXHJcbiAgICAvLyBUT0RPOiBGdXR1cmUgdXNlIG9mIGEgdmlld1N0YXRlLCBwbGFpbiBvYmplY3QgcmVwcmVzZW50YXRpb25cclxuICAgIC8vIG9mIHBhcnQgb2YgdGhlIHZpZXdNb2RlbCB0byBiZSB1c2VkIGFzIHRoZSBzdGF0ZSBwYXNzZWQgdG8gdGhlXHJcbiAgICAvLyBoaXN0b3J5IGFuZCBiZXR3ZWVuIGFjdGl2aXRpZXMgY2FsbHMuXHJcbiAgICB0aGlzLnZpZXdTdGF0ZSA9IHt9O1xyXG4gICAgXHJcbiAgICAvLyBPYmplY3QgdG8gaG9sZCB0aGUgb3B0aW9ucyBwYXNzZWQgb24gJ3Nob3cnIGFzIGEgcmVzdWx0XHJcbiAgICAvLyBvZiBhIHJlcXVlc3QgZnJvbSBhbm90aGVyIGFjdGl2aXR5XHJcbiAgICB0aGlzLnJlcXVlc3REYXRhID0gbnVsbDtcclxuXHJcbiAgICAvLyBEZWZhdWx0IG5hdkJhciBvYmplY3QuXHJcbiAgICB0aGlzLm5hdkJhciA9IG5ldyBOYXZCYXIoe1xyXG4gICAgICAgIHRpdGxlOiBudWxsLCAvLyBudWxsIGZvciBsb2dvXHJcbiAgICAgICAgbGVmdEFjdGlvbjogbnVsbCxcclxuICAgICAgICByaWdodEFjdGlvbjogbnVsbFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIERlbGF5ZWQgYmluZGluZ3MgdG8gYWxsb3cgZm9yIGZ1cnRoZXIgY29uc3RydWN0b3Igc2V0LXVwIFxyXG4gICAgLy8gb24gc3ViY2xhc3Nlcy5cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gQWN0aXZpdHlDb25zdHJ1Y3RvckRlbGF5ZWQoKSB7XHJcbiAgICAgICAgLy8gQSB2aWV3IG1vZGVsIGFuZCBiaW5kaW5ncyBiZWluZyBhcHBsaWVkIGlzIGV2ZXIgcmVxdWlyZWRcclxuICAgICAgICAvLyBldmVuIG9uIEFjdGl2aXRpZXMgd2l0aG91dCBuZWVkIGZvciBhIHZpZXcgbW9kZWwsIHNpbmNlXHJcbiAgICAgICAgLy8gdGhlIHVzZSBvZiBjb21wb25lbnRzIGFuZCB0ZW1wbGF0ZXMsIG9yIGFueSBvdGhlciBkYXRhLWJpbmRcclxuICAgICAgICAvLyBzeW50YXgsIHJlcXVpcmVzIHRvIGJlIGluIGEgY29udGV4dCB3aXRoIGJpbmRpbmcgZW5hYmxlZDpcclxuICAgICAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMudmlld01vZGVsIHx8IHt9LCAkYWN0aXZpdHkuZ2V0KDApKTtcclxuICAgIH0uYmluZCh0aGlzKSwgMSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQWN0aXZpdHk7XHJcblxyXG4vKipcclxuICAgIFNldC11cCB2aXN1YWxpemF0aW9uIG9mIHRoZSB2aWV3IHdpdGggdGhlIGdpdmVuIG9wdGlvbnMvc3RhdGUsXHJcbiAgICB3aXRoIGEgcmVzZXQgb2YgY3VycmVudCBzdGF0ZS5cclxuICAgIE11c3QgYmUgZXhlY3V0ZWQgZXZlcnkgdGltZSB0aGUgYWN0aXZpdHkgaXMgcHV0IGluIHRoZSBjdXJyZW50IHZpZXcuXHJcbioqL1xyXG5BY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG4gICAgLy8gVE9ETzogbXVzdCBrZWVwIHZpZXdTdGF0ZSB1cCB0byBkYXRlIHVzaW5nIG9wdGlvbnMvc3RhdGUuXHJcbiAgICBcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgdGhpcy5yZXF1ZXN0RGF0YSA9IG9wdGlvbnM7XHJcbn07XHJcblxyXG4vKipcclxuICAgIFN0YXRpYyB1dGlsaXRpZXNcclxuKiovXHJcbi8vIEZvciBjb21tb2RpdHksIGNvbW1vbiBjbGFzc2VzIGFyZSBleHBvc2VkIGFzIHN0YXRpYyBwcm9wZXJ0aWVzXHJcbkFjdGl2aXR5Lk5hdkJhciA9IE5hdkJhcjtcclxuQWN0aXZpdHkuTmF2QWN0aW9uID0gTmF2QWN0aW9uO1xyXG5cclxuLy8gUXVpY2sgY3JlYXRpb24gb2YgY29tbW9uIHR5cGVzIG9mIE5hdkJhclxyXG5BY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyID0gZnVuY3Rpb24gY3JlYXRlU2VjdGlvbk5hdkJhcih0aXRsZSkge1xyXG4gICAgcmV0dXJuIG5ldyBOYXZCYXIoe1xyXG4gICAgICAgIHRpdGxlOiB0aXRsZSxcclxuICAgICAgICBsZWZ0QWN0aW9uOiBOYXZBY3Rpb24ubWVudU5ld0l0ZW0sXHJcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5tZW51SW5cclxuICAgIH0pO1xyXG59O1xyXG5cclxuQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhciA9IGZ1bmN0aW9uIGNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIodGl0bGUsIG9wdGlvbnMpIHtcclxuICAgIFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICBcclxuICAgIHZhciBnb0JhY2tPcHRpb25zID0ge1xyXG4gICAgICAgIHRleHQ6IHRpdGxlLFxyXG4gICAgICAgIGlzVGl0bGU6IHRydWVcclxuICAgIH07XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuYmFja0xpbmspIHtcclxuICAgICAgICBnb0JhY2tPcHRpb25zLmxpbmsgPSBvcHRpb25zLmJhY2tMaW5rO1xyXG4gICAgICAgIGdvQmFja09wdGlvbnMuaXNTaGVsbCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgTmF2QmFyKHtcclxuICAgICAgICB0aXRsZTogJycsIC8vIE5vIHRpdGxlXHJcbiAgICAgICAgbGVmdEFjdGlvbjogTmF2QWN0aW9uLmdvQmFjay5tb2RlbC5jbG9uZShnb0JhY2tPcHRpb25zKSxcclxuICAgICAgICByaWdodEFjdGlvbjogb3B0aW9ucy5oZWxwSWQgP1xyXG4gICAgICAgICAgICBOYXZBY3Rpb24uZ29IZWxwSW5kZXgubW9kZWwuY2xvbmUoe1xyXG4gICAgICAgICAgICAgICAgbGluazogJyMnICsgb3B0aW9ucy5oZWxwSWRcclxuICAgICAgICAgICAgfSkgOlxyXG4gICAgICAgICAgICBOYXZBY3Rpb24uZ29IZWxwSW5kZXhcclxuICAgIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBTaW5nbGV0b24gaGVscGVyXHJcbioqL1xyXG52YXIgY3JlYXRlU2luZ2xldG9uID0gZnVuY3Rpb24gY3JlYXRlU2luZ2xldG9uKEFjdGl2aXR5Q2xhc3MsICRhY3Rpdml0eSwgYXBwKSB7XHJcbiAgICBcclxuICAgIGNyZWF0ZVNpbmdsZXRvbi5pbnN0YW5jZXMgPSBjcmVhdGVTaW5nbGV0b24uaW5zdGFuY2VzIHx8IHt9O1xyXG4gICAgXHJcbiAgICBpZiAoY3JlYXRlU2luZ2xldG9uLmluc3RhbmNlc1tBY3Rpdml0eUNsYXNzLm5hbWVdIGluc3RhbmNlb2YgQWN0aXZpdHlDbGFzcykge1xyXG4gICAgICAgIHJldHVybiBjcmVhdGVTaW5nbGV0b24uaW5zdGFuY2VzW0FjdGl2aXR5Q2xhc3MubmFtZV07XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICB2YXIgcyA9IG5ldyBBY3Rpdml0eUNsYXNzKCRhY3Rpdml0eSwgYXBwKTtcclxuICAgICAgICBjcmVhdGVTaW5nbGV0b24uaW5zdGFuY2VzW0FjdGl2aXR5Q2xhc3MubmFtZV0gPSBzO1xyXG4gICAgICAgIHJldHVybiBzO1xyXG4gICAgfVxyXG59O1xyXG4vLyBFeGFtcGxlIG9mIHVzZVxyXG4vL2V4cG9ydHMuaW5pdCA9IGNyZWF0ZVNpbmdsZXRvbi5iaW5kKG51bGwsIEFjdGl2aXR5Q2xhc3MpO1xyXG5cclxuLyoqXHJcbiAgICBTdGF0aWMgbWV0aG9kIGV4dGVuZHMgdG8gaGVscCBpbmhlcml0YW5jZS5cclxuICAgIEFkZGl0aW9uYWxseSwgaXQgYWRkcyBhIHN0YXRpYyBpbml0IG1ldGhvZCByZWFkeSBmb3IgdGhlIG5ldyBjbGFzc1xyXG4gICAgdGhhdCBnZW5lcmF0ZXMvcmV0cmlldmVzIHRoZSBzaW5nbGV0b24uXHJcbioqL1xyXG5BY3Rpdml0eS5leHRlbmRzID0gZnVuY3Rpb24gZXh0ZW5kc0FjdGl2aXR5KENsYXNzRm4pIHtcclxuICAgIFxyXG4gICAgQ2xhc3NGbi5faW5oZXJpdHMoQWN0aXZpdHkpO1xyXG4gICAgXHJcbiAgICBDbGFzc0ZuLmluaXQgPSBjcmVhdGVTaW5nbGV0b24uYmluZChudWxsLCBDbGFzc0ZuKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIENsYXNzRm47XHJcbn07XHJcbiIsIi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gKiBEYXRlUGlja2VyIEpTIENvbXBvbmVudCwgd2l0aCBzZXZlcmFsXHJcbiAqIG1vZGVzIGFuZCBvcHRpb25hbCBpbmxpbmUtcGVybWFuZW50IHZpc3VhbGl6YXRpb24uXHJcbiAqXHJcbiAqIENvcHlyaWdodCAyMDE0IExvY29ub21pY3MgQ29vcC5cclxuICpcclxuICogQmFzZWQgb246XHJcbiAqIGJvb3RzdHJhcC1kYXRlcGlja2VyLmpzIFxyXG4gKiBodHRwOi8vd3d3LmV5ZWNvbi5yby9ib290c3RyYXAtZGF0ZXBpY2tlclxyXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICogQ29weXJpZ2h0IDIwMTIgU3RlZmFuIFBldHJlXHJcbiAqXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XHJcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cclxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XHJcbiAqXHJcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxyXG4gKlxyXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXHJcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcclxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXHJcbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcclxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXHJcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTsgXHJcblxyXG52YXIgY2xhc3NlcyA9IHtcclxuICAgIGNvbXBvbmVudDogJ0RhdGVQaWNrZXInLFxyXG4gICAgbW9udGhzOiAnRGF0ZVBpY2tlci1tb250aHMnLFxyXG4gICAgZGF5czogJ0RhdGVQaWNrZXItZGF5cycsXHJcbiAgICBtb250aERheTogJ2RheScsXHJcbiAgICBtb250aDogJ21vbnRoJyxcclxuICAgIHllYXI6ICd5ZWFyJyxcclxuICAgIHllYXJzOiAnRGF0ZVBpY2tlci15ZWFycydcclxufTtcclxuXHJcbi8vIFBpY2tlciBvYmplY3RcclxudmFyIERhdGVQaWNrZXIgPSBmdW5jdGlvbihlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAvKmpzaGludCBtYXhzdGF0ZW1lbnRzOjMyLG1heGNvbXBsZXhpdHk6MjQqL1xyXG4gICAgdGhpcy5lbGVtZW50ID0gJChlbGVtZW50KTtcclxuICAgIHRoaXMuZm9ybWF0ID0gRFBHbG9iYWwucGFyc2VGb3JtYXQob3B0aW9ucy5mb3JtYXR8fHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLWZvcm1hdCcpfHwnbW0vZGQveXl5eScpO1xyXG4gICAgXHJcbiAgICB0aGlzLmlzSW5wdXQgPSB0aGlzLmVsZW1lbnQuaXMoJ2lucHV0Jyk7XHJcbiAgICB0aGlzLmNvbXBvbmVudCA9IHRoaXMuZWxlbWVudC5pcygnLmRhdGUnKSA/IHRoaXMuZWxlbWVudC5maW5kKCcuYWRkLW9uJykgOiBmYWxzZTtcclxuICAgIHRoaXMuaXNQbGFjZWhvbGRlciA9IHRoaXMuZWxlbWVudC5pcygnLmNhbGVuZGFyLXBsYWNlaG9sZGVyJyk7XHJcbiAgICBcclxuICAgIHRoaXMucGlja2VyID0gJChEUEdsb2JhbC50ZW1wbGF0ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZFRvKHRoaXMuaXNQbGFjZWhvbGRlciA/IHRoaXMuZWxlbWVudCA6ICdib2R5JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLm9uKCdjbGljayB0YXAnLCAkLnByb3h5KHRoaXMuY2xpY2ssIHRoaXMpKTtcclxuICAgIC8vIFRPRE86IHRvIHJldmlldyBpZiAnY29udGFpbmVyJyBjbGFzcyBjYW4gYmUgYXZvaWRlZCwgc28gaW4gcGxhY2Vob2xkZXIgbW9kZSBnZXRzIG9wdGlvbmFsXHJcbiAgICAvLyBpZiBpcyB3YW50ZWQgY2FuIGJlIHBsYWNlZCBvbiB0aGUgcGxhY2Vob2xkZXIgZWxlbWVudCAob3IgY29udGFpbmVyLWZsdWlkIG9yIG5vdGhpbmcpXHJcbiAgICB0aGlzLnBpY2tlci5hZGRDbGFzcyh0aGlzLmlzUGxhY2Vob2xkZXIgPyAnY29udGFpbmVyJyA6ICdkcm9wZG93bi1tZW51Jyk7XHJcbiAgICBcclxuICAgIGlmICh0aGlzLmlzUGxhY2Vob2xkZXIpIHtcclxuICAgICAgICB0aGlzLnBpY2tlci5zaG93KCk7XHJcbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlJykgPT0gJ3RvZGF5Jykge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdzaG93JyxcclxuICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0aGlzLmlzSW5wdXQpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnQub24oe1xyXG4gICAgICAgICAgICBmb2N1czogJC5wcm94eSh0aGlzLnNob3csIHRoaXMpLFxyXG4gICAgICAgICAgICAvL2JsdXI6ICQucHJveHkodGhpcy5oaWRlLCB0aGlzKSxcclxuICAgICAgICAgICAga2V5dXA6ICQucHJveHkodGhpcy51cGRhdGUsIHRoaXMpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmICh0aGlzLmNvbXBvbmVudCl7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcG9uZW50Lm9uKCdjbGljayB0YXAnLCAkLnByb3h5KHRoaXMuc2hvdywgdGhpcykpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5vbignY2xpY2sgdGFwJywgJC5wcm94eSh0aGlzLnNob3csIHRoaXMpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qIFRvdWNoIGV2ZW50cyB0byBzd2lwZSBkYXRlcyAqL1xyXG4gICAgdGhpcy5lbGVtZW50XHJcbiAgICAub24oJ3N3aXBlbGVmdCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdGhpcy5tb3ZlRGF0ZSgnbmV4dCcpO1xyXG4gICAgfS5iaW5kKHRoaXMpKVxyXG4gICAgLm9uKCdzd2lwZXJpZ2h0JywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB0aGlzLm1vdmVEYXRlKCdwcmV2Jyk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIC8qIFNldC11cCB2aWV3IG1vZGUgKi9cclxuICAgIHRoaXMubWluVmlld01vZGUgPSBvcHRpb25zLm1pblZpZXdNb2RlfHx0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS1taW52aWV3bW9kZScpfHwwO1xyXG4gICAgaWYgKHR5cGVvZiB0aGlzLm1pblZpZXdNb2RlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgIHN3aXRjaCAodGhpcy5taW5WaWV3TW9kZSkge1xyXG4gICAgICAgICAgICBjYXNlICdtb250aHMnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5WaWV3TW9kZSA9IDE7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAneWVhcnMnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5WaWV3TW9kZSA9IDI7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHRoaXMubWluVmlld01vZGUgPSAwO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy52aWV3TW9kZSA9IG9wdGlvbnMudmlld01vZGV8fHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLXZpZXdtb2RlJyl8fDA7XHJcbiAgICBpZiAodHlwZW9mIHRoaXMudmlld01vZGUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgc3dpdGNoICh0aGlzLnZpZXdNb2RlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ21vbnRocyc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlID0gMTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICd5ZWFycyc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlID0gMjtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZSA9IDA7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnN0YXJ0Vmlld01vZGUgPSB0aGlzLnZpZXdNb2RlO1xyXG4gICAgdGhpcy53ZWVrU3RhcnQgPSBvcHRpb25zLndlZWtTdGFydHx8dGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtd2Vla3N0YXJ0Jyl8fDA7XHJcbiAgICB0aGlzLndlZWtFbmQgPSB0aGlzLndlZWtTdGFydCA9PT0gMCA/IDYgOiB0aGlzLndlZWtTdGFydCAtIDE7XHJcbiAgICB0aGlzLm9uUmVuZGVyID0gb3B0aW9ucy5vblJlbmRlcjtcclxuICAgIHRoaXMuZmlsbERvdygpO1xyXG4gICAgdGhpcy5maWxsTW9udGhzKCk7XHJcbiAgICB0aGlzLnVwZGF0ZSgpO1xyXG4gICAgdGhpcy5zaG93TW9kZSgpO1xyXG59O1xyXG5cclxuRGF0ZVBpY2tlci5wcm90b3R5cGUgPSB7XHJcbiAgICBjb25zdHJ1Y3RvcjogRGF0ZVBpY2tlcixcclxuICAgIFxyXG4gICAgc2hvdzogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHRoaXMucGlja2VyLnNob3coKTtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMuY29tcG9uZW50ID8gdGhpcy5jb21wb25lbnQub3V0ZXJIZWlnaHQoKSA6IHRoaXMuZWxlbWVudC5vdXRlckhlaWdodCgpO1xyXG4gICAgICAgIHRoaXMucGxhY2UoKTtcclxuICAgICAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsICQucHJveHkodGhpcy5wbGFjZSwgdGhpcykpO1xyXG4gICAgICAgIGlmIChlICkge1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpcy5pc0lucHV0KSB7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICAkKGRvY3VtZW50KS5vbignbW91c2Vkb3duJywgZnVuY3Rpb24oZXYpe1xyXG4gICAgICAgICAgICBpZiAoJChldi50YXJnZXQpLmNsb3Nlc3QoJy4nICsgY2xhc3Nlcy5jb21wb25lbnQpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5oaWRlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdzaG93JyxcclxuICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBoaWRlOiBmdW5jdGlvbigpe1xyXG4gICAgICAgIHRoaXMucGlja2VyLmhpZGUoKTtcclxuICAgICAgICAkKHdpbmRvdykub2ZmKCdyZXNpemUnLCB0aGlzLnBsYWNlKTtcclxuICAgICAgICB0aGlzLnZpZXdNb2RlID0gdGhpcy5zdGFydFZpZXdNb2RlO1xyXG4gICAgICAgIHRoaXMuc2hvd01vZGUoKTtcclxuICAgICAgICBpZiAoIXRoaXMuaXNJbnB1dCkge1xyXG4gICAgICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ21vdXNlZG93bicsIHRoaXMuaGlkZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vdGhpcy5zZXQoKTtcclxuICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdoaWRlJyxcclxuICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBmb3JtYXRlZCA9IERQR2xvYmFsLmZvcm1hdERhdGUodGhpcy5kYXRlLCB0aGlzLmZvcm1hdCk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzSW5wdXQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY29tcG9uZW50KXtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5maW5kKCdpbnB1dCcpLnByb3AoJ3ZhbHVlJywgZm9ybWF0ZWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlJywgZm9ybWF0ZWQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wcm9wKCd2YWx1ZScsIGZvcm1hdGVkKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBTZXRzIGEgZGF0ZSBhcyB2YWx1ZSBhbmQgbm90aWZ5IHdpdGggYW4gZXZlbnQuXHJcbiAgICAgICAgUGFyYW1ldGVyIGRvbnROb3RpZnkgaXMgb25seSBmb3IgY2FzZXMgd2hlcmUgdGhlIGNhbGVuZGFyIG9yXHJcbiAgICAgICAgc29tZSByZWxhdGVkIGNvbXBvbmVudCBnZXRzIGFscmVhZHkgdXBkYXRlZCBidXQgdGhlIGhpZ2hsaWdodGVkXHJcbiAgICAgICAgZGF0ZSBuZWVkcyB0byBiZSB1cGRhdGVkIHdpdGhvdXQgY3JlYXRlIGluZmluaXRlIHJlY3Vyc2lvbiBcclxuICAgICAgICBiZWNhdXNlIG9mIG5vdGlmaWNhdGlvbi4gSW4gb3RoZXIgY2FzZSwgZG9udCB1c2UuXHJcbiAgICAqKi9cclxuICAgIHNldFZhbHVlOiBmdW5jdGlvbihuZXdEYXRlLCBkb250Tm90aWZ5KSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBuZXdEYXRlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGUgPSBEUEdsb2JhbC5wYXJzZURhdGUobmV3RGF0ZSwgdGhpcy5mb3JtYXQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSA9IG5ldyBEYXRlKG5ld0RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgICAgIHRoaXMudmlld0RhdGUgPSBuZXcgRGF0ZSh0aGlzLmRhdGUuZ2V0RnVsbFllYXIoKSwgdGhpcy5kYXRlLmdldE1vbnRoKCksIDEsIDAsIDAsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChkb250Tm90aWZ5ICE9PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIC8vIE5vdGlmeTpcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICAgICAgdmlld01vZGU6IERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZ2V0VmFsdWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGU7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBtb3ZlVmFsdWU6IGZ1bmN0aW9uKGRpciwgbW9kZSkge1xyXG4gICAgICAgIC8vIGRpciBjYW4gYmU6ICdwcmV2JywgJ25leHQnXHJcbiAgICAgICAgaWYgKFsncHJldicsICduZXh0J10uaW5kZXhPZihkaXIgJiYgZGlyLnRvTG93ZXJDYXNlKCkpID09IC0xKVxyXG4gICAgICAgICAgICAvLyBObyB2YWxpZCBvcHRpb246XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gZGVmYXVsdCBtb2RlIGlzIHRoZSBjdXJyZW50IG9uZVxyXG4gICAgICAgIG1vZGUgPSBtb2RlID9cclxuICAgICAgICAgICAgRFBHbG9iYWwubW9kZXNTZXRbbW9kZV0gOlxyXG4gICAgICAgICAgICBEUEdsb2JhbC5tb2Rlc1t0aGlzLnZpZXdNb2RlXTtcclxuXHJcbiAgICAgICAgdGhpcy5kYXRlWydzZXQnICsgbW9kZS5uYXZGbmNdLmNhbGwoXHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSxcclxuICAgICAgICAgICAgdGhpcy5kYXRlWydnZXQnICsgbW9kZS5uYXZGbmNdLmNhbGwodGhpcy5kYXRlKSArIFxyXG4gICAgICAgICAgICBtb2RlLm5hdlN0ZXAgKiAoZGlyID09PSAncHJldicgPyAtMSA6IDEpXHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLnNldFZhbHVlKHRoaXMuZGF0ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0ZTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIHBsYWNlOiBmdW5jdGlvbigpe1xyXG4gICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLmNvbXBvbmVudCA/IHRoaXMuY29tcG9uZW50Lm9mZnNldCgpIDogdGhpcy5lbGVtZW50Lm9mZnNldCgpO1xyXG4gICAgICAgIHRoaXMucGlja2VyLmNzcyh7XHJcbiAgICAgICAgICAgIHRvcDogb2Zmc2V0LnRvcCArIHRoaXMuaGVpZ2h0LFxyXG4gICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbihuZXdEYXRlKXtcclxuICAgICAgICB0aGlzLmRhdGUgPSBEUEdsb2JhbC5wYXJzZURhdGUoXHJcbiAgICAgICAgICAgIHR5cGVvZiBuZXdEYXRlID09PSAnc3RyaW5nJyA/IG5ld0RhdGUgOiAodGhpcy5pc0lucHV0ID8gdGhpcy5lbGVtZW50LnByb3AoJ3ZhbHVlJykgOiB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZScpKSxcclxuICAgICAgICAgICAgdGhpcy5mb3JtYXRcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMudmlld0RhdGUgPSBuZXcgRGF0ZSh0aGlzLmRhdGUuZ2V0RnVsbFllYXIoKSwgdGhpcy5kYXRlLmdldE1vbnRoKCksIDEsIDAsIDAsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZmlsbERvdzogZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgZG93Q250ID0gdGhpcy53ZWVrU3RhcnQ7XHJcbiAgICAgICAgdmFyIGh0bWwgPSAnPHRyPic7XHJcbiAgICAgICAgd2hpbGUgKGRvd0NudCA8IHRoaXMud2Vla1N0YXJ0ICsgNykge1xyXG4gICAgICAgICAgICBodG1sICs9ICc8dGggY2xhc3M9XCJkb3dcIj4nK0RQR2xvYmFsLmRhdGVzLmRheXNNaW5bKGRvd0NudCsrKSU3XSsnPC90aD4nO1xyXG4gICAgICAgIH1cclxuICAgICAgICBodG1sICs9ICc8L3RyPic7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLmRheXMgKyAnIHRoZWFkJykuYXBwZW5kKGh0bWwpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZmlsbE1vbnRoczogZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgaHRtbCA9ICcnO1xyXG4gICAgICAgIHZhciBpID0gMDtcclxuICAgICAgICB3aGlsZSAoaSA8IDEyKSB7XHJcbiAgICAgICAgICAgIGh0bWwgKz0gJzxzcGFuIGNsYXNzPVwiJyArIGNsYXNzZXMubW9udGggKyAnXCI+JytEUEdsb2JhbC5kYXRlcy5tb250aHNTaG9ydFtpKytdKyc8L3NwYW4+JztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLm1vbnRocyArICcgdGQnKS5hcHBlbmQoaHRtbCk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBmaWxsOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAvKmpzaGludCBtYXhzdGF0ZW1lbnRzOjY2LCBtYXhjb21wbGV4aXR5OjI4Ki9cclxuICAgICAgICB2YXIgZCA9IG5ldyBEYXRlKHRoaXMudmlld0RhdGUpLFxyXG4gICAgICAgICAgICB5ZWFyID0gZC5nZXRGdWxsWWVhcigpLFxyXG4gICAgICAgICAgICBtb250aCA9IGQuZ2V0TW9udGgoKSxcclxuICAgICAgICAgICAgY3VycmVudERhdGUgPSB0aGlzLmRhdGUudmFsdWVPZigpO1xyXG4gICAgICAgIHRoaXMucGlja2VyXHJcbiAgICAgICAgLmZpbmQoJy4nICsgY2xhc3Nlcy5kYXlzICsgJyB0aDplcSgxKScpXHJcbiAgICAgICAgLmh0bWwoRFBHbG9iYWwuZGF0ZXMubW9udGhzW21vbnRoXSArICcgJyArIHllYXIpO1xyXG4gICAgICAgIHZhciBwcmV2TW9udGggPSBuZXcgRGF0ZSh5ZWFyLCBtb250aC0xLCAyOCwwLDAsMCwwKSxcclxuICAgICAgICAgICAgZGF5ID0gRFBHbG9iYWwuZ2V0RGF5c0luTW9udGgocHJldk1vbnRoLmdldEZ1bGxZZWFyKCksIHByZXZNb250aC5nZXRNb250aCgpKTtcclxuICAgICAgICBwcmV2TW9udGguc2V0RGF0ZShkYXkpO1xyXG4gICAgICAgIHByZXZNb250aC5zZXREYXRlKGRheSAtIChwcmV2TW9udGguZ2V0RGF5KCkgLSB0aGlzLndlZWtTdGFydCArIDcpJTcpO1xyXG4gICAgICAgIHZhciBuZXh0TW9udGggPSBuZXcgRGF0ZShwcmV2TW9udGgpO1xyXG4gICAgICAgIG5leHRNb250aC5zZXREYXRlKG5leHRNb250aC5nZXREYXRlKCkgKyA0Mik7XHJcbiAgICAgICAgbmV4dE1vbnRoID0gbmV4dE1vbnRoLnZhbHVlT2YoKTtcclxuICAgICAgICB2YXIgaHRtbCA9IFtdO1xyXG4gICAgICAgIHZhciBjbHNOYW1lLFxyXG4gICAgICAgICAgICBwcmV2WSxcclxuICAgICAgICAgICAgcHJldk07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIGlmICh0aGlzLl9kYXlzQ3JlYXRlZCAhPT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAvLyBDcmVhdGUgaHRtbCAoZmlyc3QgdGltZSBvbmx5KVxyXG4gICAgICAgXHJcbiAgICAgICAgICAgIHdoaWxlKHByZXZNb250aC52YWx1ZU9mKCkgPCBuZXh0TW9udGgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGguZ2V0RGF5KCkgPT09IHRoaXMud2Vla1N0YXJ0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8dHI+Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjbHNOYW1lID0gdGhpcy5vblJlbmRlcihwcmV2TW9udGgpO1xyXG4gICAgICAgICAgICAgICAgcHJldlkgPSBwcmV2TW9udGguZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICAgICAgICAgIHByZXZNID0gcHJldk1vbnRoLmdldE1vbnRoKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoKHByZXZNIDwgbW9udGggJiYgIHByZXZZID09PSB5ZWFyKSB8fCAgcHJldlkgPCB5ZWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIG9sZCc7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKChwcmV2TSA+IG1vbnRoICYmIHByZXZZID09PSB5ZWFyKSB8fCBwcmV2WSA+IHllYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgbmV3JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGgudmFsdWVPZigpID09PSBjdXJyZW50RGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBhY3RpdmUnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8dGQgY2xhc3M9XCInICsgY2xhc3Nlcy5tb250aERheSArICcgJyArIGNsc05hbWUrJ1wiPicrcHJldk1vbnRoLmdldERhdGUoKSArICc8L3RkPicpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZNb250aC5nZXREYXkoKSA9PT0gdGhpcy53ZWVrRW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8L3RyPicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcHJldk1vbnRoLnNldERhdGUocHJldk1vbnRoLmdldERhdGUoKSsxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLmRheXMgKyAnIHRib2R5JykuZW1wdHkoKS5hcHBlbmQoaHRtbC5qb2luKCcnKSk7XHJcbiAgICAgICAgICAgIHRoaXMuX2RheXNDcmVhdGVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFVwZGF0ZSBkYXlzIHZhbHVlc1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHdlZWtUciA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy5kYXlzICsgJyB0Ym9keSB0cjpmaXJzdC1jaGlsZCgpJyk7XHJcbiAgICAgICAgICAgIHZhciBkYXlUZCA9IG51bGw7XHJcbiAgICAgICAgICAgIHdoaWxlKHByZXZNb250aC52YWx1ZU9mKCkgPCBuZXh0TW9udGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50V2Vla0RheUluZGV4ID0gcHJldk1vbnRoLmdldERheSgpIC0gdGhpcy53ZWVrU3RhcnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgY2xzTmFtZSA9IHRoaXMub25SZW5kZXIocHJldk1vbnRoKTtcclxuICAgICAgICAgICAgICAgIHByZXZZID0gcHJldk1vbnRoLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgICAgICAgICBwcmV2TSA9IHByZXZNb250aC5nZXRNb250aCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKChwcmV2TSA8IG1vbnRoICYmICBwcmV2WSA9PT0geWVhcikgfHwgIHByZXZZIDwgeWVhcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBvbGQnO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgocHJldk0gPiBtb250aCAmJiBwcmV2WSA9PT0geWVhcikgfHwgcHJldlkgPiB5ZWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIG5ldyc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAocHJldk1vbnRoLnZhbHVlT2YoKSA9PT0gY3VycmVudERhdGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgYWN0aXZlJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vaHRtbC5wdXNoKCc8dGQgY2xhc3M9XCJkYXkgJytjbHNOYW1lKydcIj4nK3ByZXZNb250aC5nZXREYXRlKCkgKyAnPC90ZD4nKTtcclxuICAgICAgICAgICAgICAgIGRheVRkID0gd2Vla1RyLmZpbmQoJ3RkOmVxKCcgKyBjdXJyZW50V2Vla0RheUluZGV4ICsgJyknKTtcclxuICAgICAgICAgICAgICAgIGRheVRkXHJcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnZGF5ICcgKyBjbHNOYW1lKVxyXG4gICAgICAgICAgICAgICAgLnRleHQocHJldk1vbnRoLmdldERhdGUoKSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIE5leHQgd2Vlaz9cclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGguZ2V0RGF5KCkgPT09IHRoaXMud2Vla0VuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdlZWtUciA9IHdlZWtUci5uZXh0KCd0cicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcHJldk1vbnRoLnNldERhdGUocHJldk1vbnRoLmdldERhdGUoKSsxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGN1cnJlbnRZZWFyID0gdGhpcy5kYXRlLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIG1vbnRocyA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy5tb250aHMpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ3RoOmVxKDEpJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmh0bWwoeWVhcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmVuZCgpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ3NwYW4nKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgaWYgKGN1cnJlbnRZZWFyID09PSB5ZWFyKSB7XHJcbiAgICAgICAgICAgIG1vbnRocy5lcSh0aGlzLmRhdGUuZ2V0TW9udGgoKSkuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBodG1sID0gJyc7XHJcbiAgICAgICAgeWVhciA9IHBhcnNlSW50KHllYXIvMTAsIDEwKSAqIDEwO1xyXG4gICAgICAgIHZhciB5ZWFyQ29udCA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy55ZWFycylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKCd0aDplcSgxKScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRleHQoeWVhciArICctJyArICh5ZWFyICsgOSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmVuZCgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgndGQnKTtcclxuICAgICAgICBcclxuICAgICAgICB5ZWFyIC09IDE7XHJcbiAgICAgICAgdmFyIGk7XHJcbiAgICAgICAgaWYgKHRoaXMuX3llYXJzQ3JlYXRlZCAhPT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgZm9yIChpID0gLTE7IGkgPCAxMTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8c3BhbiBjbGFzcz1cIicgKyBjbGFzc2VzLnllYXIgKyAoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykrKGN1cnJlbnRZZWFyID09PSB5ZWFyID8gJyBhY3RpdmUnIDogJycpKydcIj4nK3llYXIrJzwvc3Bhbj4nO1xyXG4gICAgICAgICAgICAgICAgeWVhciArPSAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB5ZWFyQ29udC5odG1sKGh0bWwpO1xyXG4gICAgICAgICAgICB0aGlzLl95ZWFyc0NyZWF0ZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciB5ZWFyU3BhbiA9IHllYXJDb250LmZpbmQoJ3NwYW46Zmlyc3QtY2hpbGQoKScpO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAtMTsgaSA8IDExOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIC8vaHRtbCArPSAnPHNwYW4gY2xhc3M9XCJ5ZWFyJysoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykrKGN1cnJlbnRZZWFyID09PSB5ZWFyID8gJyBhY3RpdmUnIDogJycpKydcIj4nK3llYXIrJzwvc3Bhbj4nO1xyXG4gICAgICAgICAgICAgICAgeWVhclNwYW5cclxuICAgICAgICAgICAgICAgIC50ZXh0KHllYXIpXHJcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAneWVhcicgKyAoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykgKyAoY3VycmVudFllYXIgPT09IHllYXIgPyAnIGFjdGl2ZScgOiAnJykpO1xyXG4gICAgICAgICAgICAgICAgeWVhciArPSAxO1xyXG4gICAgICAgICAgICAgICAgeWVhclNwYW4gPSB5ZWFyU3Bhbi5uZXh0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBtb3ZlRGF0ZTogZnVuY3Rpb24oZGlyLCBtb2RlKSB7XHJcbiAgICAgICAgLy8gZGlyIGNhbiBiZTogJ3ByZXYnLCAnbmV4dCdcclxuICAgICAgICBpZiAoWydwcmV2JywgJ25leHQnXS5pbmRleE9mKGRpciAmJiBkaXIudG9Mb3dlckNhc2UoKSkgPT0gLTEpXHJcbiAgICAgICAgICAgIC8vIE5vIHZhbGlkIG9wdGlvbjpcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAvLyBkZWZhdWx0IG1vZGUgaXMgdGhlIGN1cnJlbnQgb25lXHJcbiAgICAgICAgbW9kZSA9IG1vZGUgfHwgdGhpcy52aWV3TW9kZTtcclxuXHJcbiAgICAgICAgdGhpcy52aWV3RGF0ZVsnc2V0JytEUEdsb2JhbC5tb2Rlc1ttb2RlXS5uYXZGbmNdLmNhbGwoXHJcbiAgICAgICAgICAgIHRoaXMudmlld0RhdGUsXHJcbiAgICAgICAgICAgIHRoaXMudmlld0RhdGVbJ2dldCcrRFBHbG9iYWwubW9kZXNbbW9kZV0ubmF2Rm5jXS5jYWxsKHRoaXMudmlld0RhdGUpICsgXHJcbiAgICAgICAgICAgIERQR2xvYmFsLm1vZGVzW21vZGVdLm5hdlN0ZXAgKiAoZGlyID09PSAncHJldicgPyAtMSA6IDEpXHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLmZpbGwoKTtcclxuICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGljazogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIC8qanNoaW50IG1heGNvbXBsZXhpdHk6MTYqL1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHZhciB0YXJnZXQgPSAkKGUudGFyZ2V0KS5jbG9zZXN0KCdzcGFuLCB0ZCwgdGgnKTtcclxuICAgICAgICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICB2YXIgbW9udGgsIHllYXI7XHJcbiAgICAgICAgICAgIHN3aXRjaCh0YXJnZXRbMF0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAndGgnOlxyXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCh0YXJnZXRbMF0uY2xhc3NOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N3aXRjaCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dNb2RlKDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3ByZXYnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICduZXh0JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZURhdGUodGFyZ2V0WzBdLmNsYXNzTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdzcGFuJzpcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmlzKCcuJyArIGNsYXNzZXMubW9udGgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vbnRoID0gdGFyZ2V0LnBhcmVudCgpLmZpbmQoJ3NwYW4nKS5pbmRleCh0YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlLnNldE1vbnRoKG1vbnRoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ZWFyID0gcGFyc2VJbnQodGFyZ2V0LnRleHQoKSwgMTApfHwwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlLnNldEZ1bGxZZWFyKHllYXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy52aWV3TW9kZSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSh0aGlzLnZpZXdEYXRlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld01vZGU6IERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd01vZGUoLTEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd0ZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldC5pcygnLmRheScpICYmICF0YXJnZXQuaXMoJy5kaXNhYmxlZCcpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRheSA9IHBhcnNlSW50KHRhcmdldC50ZXh0KCksIDEwKXx8MTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggPSB0aGlzLnZpZXdEYXRlLmdldE1vbnRoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuaXMoJy5vbGQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggLT0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YXJnZXQuaXMoJy5uZXcnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggKz0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ZWFyID0gdGhpcy52aWV3RGF0ZS5nZXRGdWxsWWVhcigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgZGF5LDAsMCwwLDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGgsIE1hdGgubWluKDI4LCBkYXkpLDAsMCwwLDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld01vZGU6IERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgbW91c2Vkb3duOiBmdW5jdGlvbihlKXtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIHNob3dNb2RlOiBmdW5jdGlvbihkaXIpIHtcclxuICAgICAgICBpZiAoZGlyKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlld01vZGUgPSBNYXRoLm1heCh0aGlzLm1pblZpZXdNb2RlLCBNYXRoLm1pbigyLCB0aGlzLnZpZXdNb2RlICsgZGlyKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucGlja2VyLmZpbmQoJz5kaXYnKS5oaWRlKCkuZmlsdGVyKCcuJyArIGNsYXNzZXMuY29tcG9uZW50ICsgJy0nICsgRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZSkuc2hvdygpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuJC5mbi5kYXRlcGlja2VyID0gZnVuY3Rpb24gKCBvcHRpb24gKSB7XHJcbiAgICB2YXIgdmFscyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XHJcbiAgICB2YXIgcmV0dXJuZWQ7XHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXHJcbiAgICAgICAgICAgIGRhdGEgPSAkdGhpcy5kYXRhKCdkYXRlcGlja2VyJyksXHJcbiAgICAgICAgICAgIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09PSAnb2JqZWN0JyAmJiBvcHRpb247XHJcbiAgICAgICAgaWYgKCFkYXRhKSB7XHJcbiAgICAgICAgICAgICR0aGlzLmRhdGEoJ2RhdGVwaWNrZXInLCAoZGF0YSA9IG5ldyBEYXRlUGlja2VyKHRoaXMsICQuZXh0ZW5kKHt9LCAkLmZuLmRhdGVwaWNrZXIuZGVmYXVsdHMsb3B0aW9ucykpKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgcmV0dXJuZWQgPSBkYXRhW29wdGlvbl0uYXBwbHkoZGF0YSwgdmFscyk7XHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgdmFsdWUgcmV0dXJuZWQgYnkgdGhlIG1ldGhvZD9cclxuICAgICAgICAgICAgaWYgKHR5cGVvZihyZXR1cm5lZCAhPT0gJ3VuZGVmaW5lZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBHbyBvdXQgdGhlIGxvb3AgdG8gcmV0dXJuIHRoZSB2YWx1ZSBmcm9tIHRoZSBmaXJzdFxyXG4gICAgICAgICAgICAgICAgLy8gZWxlbWVudC1tZXRob2QgZXhlY3V0aW9uXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gRm9sbG93IG5leHQgbG9vcCBpdGVtXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBpZiAodHlwZW9mKHJldHVybmVkKSAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgcmV0dXJuIHJldHVybmVkO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIC8vIGNoYWluaW5nOlxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuJC5mbi5kYXRlcGlja2VyLmRlZmF1bHRzID0ge1xyXG4gICAgb25SZW5kZXI6IGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgICAgICByZXR1cm4gJyc7XHJcbiAgICB9XHJcbn07XHJcbiQuZm4uZGF0ZXBpY2tlci5Db25zdHJ1Y3RvciA9IERhdGVQaWNrZXI7XHJcblxyXG52YXIgRFBHbG9iYWwgPSB7XHJcbiAgICBtb2RlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xzTmFtZTogJ2RheXMnLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdNb250aCcsXHJcbiAgICAgICAgICAgIG5hdlN0ZXA6IDFcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xzTmFtZTogJ21vbnRocycsXHJcbiAgICAgICAgICAgIG5hdkZuYzogJ0Z1bGxZZWFyJyxcclxuICAgICAgICAgICAgbmF2U3RlcDogMVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjbHNOYW1lOiAneWVhcnMnLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdGdWxsWWVhcicsXHJcbiAgICAgICAgICAgIG5hdlN0ZXA6IDEwXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNsc05hbWU6ICdkYXknLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdEYXRlJyxcclxuICAgICAgICAgICAgbmF2U3RlcDogMVxyXG4gICAgICAgIH1cclxuICAgIF0sXHJcbiAgICBkYXRlczp7XHJcbiAgICAgICAgZGF5czogW1wiU3VuZGF5XCIsIFwiTW9uZGF5XCIsIFwiVHVlc2RheVwiLCBcIldlZG5lc2RheVwiLCBcIlRodXJzZGF5XCIsIFwiRnJpZGF5XCIsIFwiU2F0dXJkYXlcIiwgXCJTdW5kYXlcIl0sXHJcbiAgICAgICAgZGF5c1Nob3J0OiBbXCJTdW5cIiwgXCJNb25cIiwgXCJUdWVcIiwgXCJXZWRcIiwgXCJUaHVcIiwgXCJGcmlcIiwgXCJTYXRcIiwgXCJTdW5cIl0sXHJcbiAgICAgICAgZGF5c01pbjogW1wiU3VcIiwgXCJNb1wiLCBcIlR1XCIsIFwiV2VcIiwgXCJUaFwiLCBcIkZyXCIsIFwiU2FcIiwgXCJTdVwiXSxcclxuICAgICAgICBtb250aHM6IFtcIkphbnVhcnlcIiwgXCJGZWJydWFyeVwiLCBcIk1hcmNoXCIsIFwiQXByaWxcIiwgXCJNYXlcIiwgXCJKdW5lXCIsIFwiSnVseVwiLCBcIkF1Z3VzdFwiLCBcIlNlcHRlbWJlclwiLCBcIk9jdG9iZXJcIiwgXCJOb3ZlbWJlclwiLCBcIkRlY2VtYmVyXCJdLFxyXG4gICAgICAgIG1vbnRoc1Nob3J0OiBbXCJKYW5cIiwgXCJGZWJcIiwgXCJNYXJcIiwgXCJBcHJcIiwgXCJNYXlcIiwgXCJKdW5cIiwgXCJKdWxcIiwgXCJBdWdcIiwgXCJTZXBcIiwgXCJPY3RcIiwgXCJOb3ZcIiwgXCJEZWNcIl1cclxuICAgIH0sXHJcbiAgICBpc0xlYXBZZWFyOiBmdW5jdGlvbiAoeWVhcikge1xyXG4gICAgICAgIHJldHVybiAoKCh5ZWFyICUgNCA9PT0gMCkgJiYgKHllYXIgJSAxMDAgIT09IDApKSB8fCAoeWVhciAlIDQwMCA9PT0gMCkpO1xyXG4gICAgfSxcclxuICAgIGdldERheXNJbk1vbnRoOiBmdW5jdGlvbiAoeWVhciwgbW9udGgpIHtcclxuICAgICAgICByZXR1cm4gWzMxLCAoRFBHbG9iYWwuaXNMZWFwWWVhcih5ZWFyKSA/IDI5IDogMjgpLCAzMSwgMzAsIDMxLCAzMCwgMzEsIDMxLCAzMCwgMzEsIDMwLCAzMV1bbW9udGhdO1xyXG4gICAgfSxcclxuICAgIHBhcnNlRm9ybWF0OiBmdW5jdGlvbihmb3JtYXQpe1xyXG4gICAgICAgIHZhciBzZXBhcmF0b3IgPSBmb3JtYXQubWF0Y2goL1suXFwvXFwtXFxzXS4qPy8pLFxyXG4gICAgICAgICAgICBwYXJ0cyA9IGZvcm1hdC5zcGxpdCgvXFxXKy8pO1xyXG4gICAgICAgIGlmICghc2VwYXJhdG9yIHx8ICFwYXJ0cyB8fCBwYXJ0cy5sZW5ndGggPT09IDApe1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGRhdGUgZm9ybWF0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHtzZXBhcmF0b3I6IHNlcGFyYXRvciwgcGFydHM6IHBhcnRzfTtcclxuICAgIH0sXHJcbiAgICBwYXJzZURhdGU6IGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCkge1xyXG4gICAgICAgIC8qanNoaW50IG1heGNvbXBsZXhpdHk6MTEqL1xyXG4gICAgICAgIHZhciBwYXJ0cyA9IGRhdGUuc3BsaXQoZm9ybWF0LnNlcGFyYXRvciksXHJcbiAgICAgICAgICAgIHZhbDtcclxuICAgICAgICBkYXRlID0gbmV3IERhdGUoKTtcclxuICAgICAgICBkYXRlLnNldEhvdXJzKDApO1xyXG4gICAgICAgIGRhdGUuc2V0TWludXRlcygwKTtcclxuICAgICAgICBkYXRlLnNldFNlY29uZHMoMCk7XHJcbiAgICAgICAgZGF0ZS5zZXRNaWxsaXNlY29uZHMoMCk7XHJcbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gZm9ybWF0LnBhcnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgeWVhciA9IGRhdGUuZ2V0RnVsbFllYXIoKSwgZGF5ID0gZGF0ZS5nZXREYXRlKCksIG1vbnRoID0gZGF0ZS5nZXRNb250aCgpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpPTAsIGNudCA9IGZvcm1hdC5wYXJ0cy5sZW5ndGg7IGkgPCBjbnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFsID0gcGFyc2VJbnQocGFydHNbaV0sIDEwKXx8MTtcclxuICAgICAgICAgICAgICAgIHN3aXRjaChmb3JtYXQucGFydHNbaV0pIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdkZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRheSA9IHZhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZS5zZXREYXRlKHZhbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ21tJzpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdtJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggPSB2YWwgLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlLnNldE1vbnRoKHZhbCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd5eSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHllYXIgPSAyMDAwICsgdmFsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlLnNldEZ1bGxZZWFyKDIwMDAgKyB2YWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd5eXl5JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgeWVhciA9IHZhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZS5zZXRGdWxsWWVhcih2YWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGgsIGRheSwgMCAsMCAsMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRlO1xyXG4gICAgfSxcclxuICAgIGZvcm1hdERhdGU6IGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCl7XHJcbiAgICAgICAgdmFyIHZhbCA9IHtcclxuICAgICAgICAgICAgZDogZGF0ZS5nZXREYXRlKCksXHJcbiAgICAgICAgICAgIG06IGRhdGUuZ2V0TW9udGgoKSArIDEsXHJcbiAgICAgICAgICAgIHl5OiBkYXRlLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKS5zdWJzdHJpbmcoMiksXHJcbiAgICAgICAgICAgIHl5eXk6IGRhdGUuZ2V0RnVsbFllYXIoKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFsLmRkID0gKHZhbC5kIDwgMTAgPyAnMCcgOiAnJykgKyB2YWwuZDtcclxuICAgICAgICB2YWwubW0gPSAodmFsLm0gPCAxMCA/ICcwJyA6ICcnKSArIHZhbC5tO1xyXG4gICAgICAgIGRhdGUgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpPTAsIGNudCA9IGZvcm1hdC5wYXJ0cy5sZW5ndGg7IGkgPCBjbnQ7IGkrKykge1xyXG4gICAgICAgICAgICBkYXRlLnB1c2godmFsW2Zvcm1hdC5wYXJ0c1tpXV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0ZS5qb2luKGZvcm1hdC5zZXBhcmF0b3IpO1xyXG4gICAgfSxcclxuICAgIGhlYWRUZW1wbGF0ZTogJzx0aGVhZD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHRyPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRoIGNsYXNzPVwicHJldlwiPiZsc2FxdW87PC90aD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0aCBjb2xzcGFuPVwiNVwiIGNsYXNzPVwic3dpdGNoXCI+PC90aD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0aCBjbGFzcz1cIm5leHRcIj4mcnNhcXVvOzwvdGg+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvdHI+JytcclxuICAgICAgICAgICAgICAgICAgICAnPC90aGVhZD4nLFxyXG4gICAgY29udFRlbXBsYXRlOiAnPHRib2R5Pjx0cj48dGQgY29sc3Bhbj1cIjdcIj48L3RkPjwvdHI+PC90Ym9keT4nXHJcbn07XHJcbkRQR2xvYmFsLnRlbXBsYXRlID0gJzxkaXYgY2xhc3M9XCInICsgY2xhc3Nlcy5jb21wb25lbnQgKyAnXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCInICsgY2xhc3Nlcy5kYXlzICsgJ1wiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRhYmxlIGNsYXNzPVwiIHRhYmxlLWNvbmRlbnNlZFwiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRFBHbG9iYWwuaGVhZFRlbXBsYXRlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGJvZHk+PC90Ym9keT4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvdGFibGU+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiJyArIGNsYXNzZXMubW9udGhzICsgJ1wiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRhYmxlIGNsYXNzPVwidGFibGUtY29uZGVuc2VkXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEUEdsb2JhbC5oZWFkVGVtcGxhdGUrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRFBHbG9iYWwuY29udFRlbXBsYXRlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvdGFibGU+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiJyArIGNsYXNzZXMueWVhcnMgKyAnXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGFibGUgY2xhc3M9XCJ0YWJsZS1jb25kZW5zZWRcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERQR2xvYmFsLmhlYWRUZW1wbGF0ZStcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEUEdsb2JhbC5jb250VGVtcGxhdGUrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC90YWJsZT4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JytcclxuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JztcclxuRFBHbG9iYWwubW9kZXNTZXQgPSB7XHJcbiAgICAnZGF0ZSc6IERQR2xvYmFsLm1vZGVzWzNdLFxyXG4gICAgJ21vbnRoJzogRFBHbG9iYWwubW9kZXNbMF0sXHJcbiAgICAneWVhcic6IERQR2xvYmFsLm1vZGVzWzFdLFxyXG4gICAgJ2RlY2FkZSc6IERQR2xvYmFsLm1vZGVzWzJdXHJcbn07XHJcblxyXG4vKiogUHVibGljIEFQSSAqKi9cclxuZXhwb3J0cy5EYXRlUGlja2VyID0gRGF0ZVBpY2tlcjtcclxuZXhwb3J0cy5kZWZhdWx0cyA9IERQR2xvYmFsO1xyXG5leHBvcnRzLnV0aWxzID0gRFBHbG9iYWw7XHJcbiIsIi8qKlxyXG4gICAgU21hcnROYXZCYXIgY29tcG9uZW50LlxyXG4gICAgUmVxdWlyZXMgaXRzIENTUyBjb3VudGVycGFydC5cclxuICAgIFxyXG4gICAgQ3JlYXRlZCBiYXNlZCBvbiB0aGUgcHJvamVjdDpcclxuICAgIFxyXG4gICAgUHJvamVjdC1UeXNvblxyXG4gICAgV2Vic2l0ZTogaHR0cHM6Ly9naXRodWIuY29tL2MycHJvZHMvUHJvamVjdC1UeXNvblxyXG4gICAgQXV0aG9yOiBjMnByb2RzXHJcbiAgICBMaWNlbnNlOlxyXG4gICAgVGhlIE1JVCBMaWNlbnNlIChNSVQpXHJcbiAgICBDb3B5cmlnaHQgKGMpIDIwMTMgYzJwcm9kc1xyXG4gICAgUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZlxyXG4gICAgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpblxyXG4gICAgdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0b1xyXG4gICAgdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2ZcclxuICAgIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbyxcclxuICAgIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxyXG4gICAgVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXHJcbiAgICBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxyXG4gICAgVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxyXG4gICAgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1NcclxuICAgIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUlxyXG4gICAgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSXHJcbiAgICBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTlxyXG4gICAgQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG4vKipcclxuICAgIEludGVybmFsIHV0aWxpdHkuXHJcbiAgICBSZW1vdmVzIGFsbCBjaGlsZHJlbiBmb3IgYSBET00gbm9kZVxyXG4qKi9cclxudmFyIGNsZWFyTm9kZSA9IGZ1bmN0aW9uIChub2RlKSB7XHJcbiAgICB3aGlsZShub2RlLmZpcnN0Q2hpbGQpe1xyXG4gICAgICAgIG5vZGUucmVtb3ZlQ2hpbGQobm9kZS5maXJzdENoaWxkKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gICAgQ2FsY3VsYXRlcyBhbmQgYXBwbGllcyB0aGUgYmVzdCBzaXppbmcgYW5kIGRpc3RyaWJ1dGlvbiBmb3IgdGhlIHRpdGxlXHJcbiAgICBkZXBlbmRpbmcgb24gY29udGVudCBhbmQgYnV0dG9ucy5cclxuICAgIFBhc3MgaW4gdGhlIHRpdGxlIGVsZW1lbnQsIGJ1dHRvbnMgbXVzdCBiZSBmb3VuZCBhcyBzaWJsaW5ncyBvZiBpdC5cclxuKiovXHJcbnZhciB0ZXh0Ym94UmVzaXplID0gZnVuY3Rpb24gdGV4dGJveFJlc2l6ZShlbCkge1xyXG4gICAgLyoganNoaW50IG1heHN0YXRlbWVudHM6IDI4LCBtYXhjb21wbGV4aXR5OjExICovXHJcbiAgICBcclxuICAgIHZhciBsZWZ0YnRuID0gZWwucGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yQWxsKCcuU21hcnROYXZCYXItZWRnZS5sZWZ0JylbMF07XHJcbiAgICB2YXIgcmlnaHRidG4gPSBlbC5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoJy5TbWFydE5hdkJhci1lZGdlLnJpZ2h0JylbMF07XHJcbiAgICBpZiAodHlwZW9mIGxlZnRidG4gPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgbGVmdGJ0biA9IHtcclxuICAgICAgICAgICAgb2Zmc2V0V2lkdGg6IDAsXHJcbiAgICAgICAgICAgIGNsYXNzTmFtZTogJydcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiByaWdodGJ0biA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICByaWdodGJ0biA9IHtcclxuICAgICAgICAgICAgb2Zmc2V0V2lkdGg6IDAsXHJcbiAgICAgICAgICAgIGNsYXNzTmFtZTogJydcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB2YXIgbWFyZ2luID0gTWF0aC5tYXgobGVmdGJ0bi5vZmZzZXRXaWR0aCwgcmlnaHRidG4ub2Zmc2V0V2lkdGgpO1xyXG4gICAgZWwuc3R5bGUubWFyZ2luTGVmdCA9IG1hcmdpbiArICdweCc7XHJcbiAgICBlbC5zdHlsZS5tYXJnaW5SaWdodCA9IG1hcmdpbiArICdweCc7XHJcbiAgICB2YXIgdG9vTG9uZyA9IChlbC5vZmZzZXRXaWR0aCA8IGVsLnNjcm9sbFdpZHRoKSA/IHRydWUgOiBmYWxzZTtcclxuICAgIGlmICh0b29Mb25nKSB7XHJcbiAgICAgICAgaWYgKGxlZnRidG4ub2Zmc2V0V2lkdGggPCByaWdodGJ0bi5vZmZzZXRXaWR0aCkge1xyXG4gICAgICAgICAgICBlbC5zdHlsZS5tYXJnaW5MZWZ0ID0gbGVmdGJ0bi5vZmZzZXRXaWR0aCArICdweCc7XHJcbiAgICAgICAgICAgIGVsLnN0eWxlLnRleHRBbGlnbiA9ICdyaWdodCc7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZWwuc3R5bGUubWFyZ2luUmlnaHQgPSByaWdodGJ0bi5vZmZzZXRXaWR0aCArICdweCc7XHJcbiAgICAgICAgICAgIGVsLnN0eWxlLnRleHRBbGlnbiA9ICdsZWZ0JztcclxuICAgICAgICB9XHJcbiAgICAgICAgdG9vTG9uZyA9IChlbC5vZmZzZXRXaWR0aDxlbC5zY3JvbGxXaWR0aCkgPyB0cnVlIDogZmFsc2U7XHJcbiAgICAgICAgaWYgKHRvb0xvbmcpIHtcclxuICAgICAgICAgICAgaWYgKG5ldyBSZWdFeHAoJ2Fycm93JykudGVzdChsZWZ0YnRuLmNsYXNzTmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIGNsZWFyTm9kZShsZWZ0YnRuLmNoaWxkTm9kZXNbMV0pO1xyXG4gICAgICAgICAgICAgICAgZWwuc3R5bGUubWFyZ2luTGVmdCA9ICcyNnB4JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAobmV3IFJlZ0V4cCgnYXJyb3cnKS50ZXN0KHJpZ2h0YnRuLmNsYXNzTmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIGNsZWFyTm9kZShyaWdodGJ0bi5jaGlsZE5vZGVzWzFdKTtcclxuICAgICAgICAgICAgICAgIGVsLnN0eWxlLm1hcmdpblJpZ2h0ID0gJzI2cHgnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0cy50ZXh0Ym94UmVzaXplID0gdGV4dGJveFJlc2l6ZTtcclxuXHJcbi8qKlxyXG4gICAgU21hcnROYXZCYXIgY2xhc3MsIGluc3RhbnRpYXRlIHdpdGggYSBET00gZWxlbWVudFxyXG4gICAgcmVwcmVzZW50aW5nIGEgbmF2YmFyLlxyXG4gICAgQVBJOlxyXG4gICAgLSByZWZyZXNoOiB1cGRhdGVzIHRoZSBjb250cm9sIHRha2luZyBjYXJlIG9mIHRoZSBuZWVkZWRcclxuICAgICAgICB3aWR0aCBmb3IgdGl0bGUgYW5kIGJ1dHRvbnNcclxuKiovXHJcbnZhciBTbWFydE5hdkJhciA9IGZ1bmN0aW9uIFNtYXJ0TmF2QmFyKGVsKSB7XHJcbiAgICB0aGlzLmVsID0gZWw7XHJcbiAgICBcclxuICAgIHRoaXMucmVmcmVzaCA9IGZ1bmN0aW9uIHJlZnJlc2goKSB7XHJcbiAgICAgICAgdmFyIGggPSAkKGVsKS5jaGlsZHJlbignaDEnKS5nZXQoMCk7XHJcbiAgICAgICAgaWYgKGgpXHJcbiAgICAgICAgICAgIHRleHRib3hSZXNpemUoaCk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMucmVmcmVzaCgpOyBcclxufTtcclxuXHJcbmV4cG9ydHMuU21hcnROYXZCYXIgPSBTbWFydE5hdkJhcjtcclxuXHJcbi8qKlxyXG4gICAgR2V0IGluc3RhbmNlcyBmb3IgYWxsIHRoZSBTbWFydE5hdkJhciBlbGVtZW50cyBpbiB0aGUgRE9NXHJcbioqL1xyXG5leHBvcnRzLmdldEFsbCA9IGZ1bmN0aW9uIGdldEFsbCgpIHtcclxuICAgIHZhciBhbGwgPSAkKCcuU21hcnROYXZCYXInKTtcclxuICAgIHJldHVybiAkLm1hcChhbGwsIGZ1bmN0aW9uKGl0ZW0pIHsgcmV0dXJuIG5ldyBTbWFydE5hdkJhcihpdGVtKTsgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIFJlZnJlc2ggYWxsIFNtYXJ0TmF2QmFyIGZvdW5kIGluIHRoZSBkb2N1bWVudC5cclxuKiovXHJcbmV4cG9ydHMucmVmcmVzaEFsbCA9IGZ1bmN0aW9uIHJlZnJlc2hBbGwoKSB7XHJcbiAgICAkKCcuU21hcnROYXZCYXIgPiBoMScpLmVhY2goZnVuY3Rpb24oKSB7IHRleHRib3hSZXNpemUodGhpcyk7IH0pO1xyXG59O1xyXG4iLCIvKipcclxuICAgIEN1c3RvbSBMb2Nvbm9taWNzICdsb2NhbGUnIHN0eWxlcyBmb3IgZGF0ZS90aW1lcy5cclxuICAgIEl0cyBhIGJpdCBtb3JlICdjb29sJyByZW5kZXJpbmcgZGF0ZXMgOy0pXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbi8vIFNpbmNlIHRoZSB0YXNrIG9mIGRlZmluZSBhIGxvY2FsZSBjaGFuZ2VzXHJcbi8vIHRoZSBjdXJyZW50IGdsb2JhbCBsb2NhbGUsIHdlIHNhdmUgYSByZWZlcmVuY2VcclxuLy8gYW5kIHJlc3RvcmUgaXQgbGF0ZXIgc28gbm90aGluZyBjaGFuZ2VkLlxyXG52YXIgY3VycmVudCA9IG1vbWVudC5sb2NhbGUoKTtcclxuXHJcbm1vbWVudC5sb2NhbGUoJ2VuLVVTLUxDJywge1xyXG4gICAgbWVyaWRpZW1QYXJzZSA6IC9bYXBdXFwuP1xcLj8vaSxcclxuICAgIG1lcmlkaWVtIDogZnVuY3Rpb24gKGhvdXJzLCBtaW51dGVzLCBpc0xvd2VyKSB7XHJcbiAgICAgICAgaWYgKGhvdXJzID4gMTEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGlzTG93ZXIgPyAncCcgOiAnUCc7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIGlzTG93ZXIgPyAnYScgOiAnQSc7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGNhbGVuZGFyIDoge1xyXG4gICAgICAgIGxhc3REYXkgOiAnW1llc3RlcmRheV0nLFxyXG4gICAgICAgIHNhbWVEYXkgOiAnW1RvZGF5XScsXHJcbiAgICAgICAgbmV4dERheSA6ICdbVG9tb3Jyb3ddJyxcclxuICAgICAgICBsYXN0V2VlayA6ICdbbGFzdF0gZGRkZCcsXHJcbiAgICAgICAgbmV4dFdlZWsgOiAnZGRkZCcsXHJcbiAgICAgICAgc2FtZUVsc2UgOiAnTS9EJ1xyXG4gICAgfSxcclxuICAgIGxvbmdEYXRlRm9ybWF0IDoge1xyXG4gICAgICAgIExUOiAnaDptbWEnLFxyXG4gICAgICAgIExUUzogJ2g6bW06c3NhJyxcclxuICAgICAgICBMOiAnTU0vREQvWVlZWScsXHJcbiAgICAgICAgbDogJ00vRC9ZWVlZJyxcclxuICAgICAgICBMTDogJ01NTU0gRG8gWVlZWScsXHJcbiAgICAgICAgbGw6ICdNTU0gRCBZWVlZJyxcclxuICAgICAgICBMTEw6ICdNTU1NIERvIFlZWVkgTFQnLFxyXG4gICAgICAgIGxsbDogJ01NTSBEIFlZWVkgTFQnLFxyXG4gICAgICAgIExMTEw6ICdkZGRkLCBNTU1NIERvIFlZWVkgTFQnLFxyXG4gICAgICAgIGxsbGw6ICdkZGQsIE1NTSBEIFlZWVkgTFQnXHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLy8gUmVzdG9yZSBsb2NhbGVcclxubW9tZW50LmxvY2FsZShjdXJyZW50KTtcclxuIiwiLyoqIEFwcG9pbnRtZW50IG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBDbGllbnQgPSByZXF1aXJlKCcuL0NsaWVudCcpLFxyXG4gICAgTG9jYXRpb24gPSByZXF1aXJlKCcuL0xvY2F0aW9uJyksXHJcbiAgICBTZXJ2aWNlID0gcmVxdWlyZSgnLi9TZXJ2aWNlJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuICAgXHJcbmZ1bmN0aW9uIEFwcG9pbnRtZW50KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGlkOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN0YXJ0VGltZTogbnVsbCxcclxuICAgICAgICBlbmRUaW1lOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEV2ZW50IHN1bW1hcnk6XHJcbiAgICAgICAgc3VtbWFyeTogJ05ldyBib29raW5nJyxcclxuICAgICAgICBcclxuICAgICAgICBzdWJ0b3RhbFByaWNlOiAwLFxyXG4gICAgICAgIGZlZVByaWNlOiAwLFxyXG4gICAgICAgIHBmZWVQcmljZTogMCxcclxuICAgICAgICB0b3RhbFByaWNlOiAwLFxyXG4gICAgICAgIHB0b3RhbFByaWNlOiAwLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHByZU5vdGVzVG9DbGllbnQ6IG51bGwsXHJcbiAgICAgICAgcG9zdE5vdGVzVG9DbGllbnQ6IG51bGwsXHJcbiAgICAgICAgcHJlTm90ZXNUb1NlbGY6IG51bGwsXHJcbiAgICAgICAgcG9zdE5vdGVzVG9TZWxmOiBudWxsXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB2YWx1ZXMgPSB2YWx1ZXMgfHwge307XHJcblxyXG4gICAgdGhpcy5jbGllbnQgPSBrby5vYnNlcnZhYmxlKHZhbHVlcy5jbGllbnQgPyBuZXcgQ2xpZW50KHZhbHVlcy5jbGllbnQpIDogbnVsbCk7XHJcblxyXG4gICAgdGhpcy5sb2NhdGlvbiA9IGtvLm9ic2VydmFibGUobmV3IExvY2F0aW9uKHZhbHVlcy5sb2NhdGlvbikpO1xyXG4gICAgdGhpcy5sb2NhdGlvblN1bW1hcnkgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sb2NhdGlvbigpLnNpbmdsZUxpbmUoKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlcnZpY2VzID0ga28ub2JzZXJ2YWJsZUFycmF5KCh2YWx1ZXMuc2VydmljZXMgfHwgW10pLm1hcChmdW5jdGlvbihzZXJ2aWNlKSB7XHJcbiAgICAgICAgcmV0dXJuIChzZXJ2aWNlIGluc3RhbmNlb2YgU2VydmljZSkgPyBzZXJ2aWNlIDogbmV3IFNlcnZpY2Uoc2VydmljZSk7XHJcbiAgICB9KSk7XHJcbiAgICB0aGlzLnNlcnZpY2VzU3VtbWFyeSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNlcnZpY2VzKCkubWFwKGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNlcnZpY2UubmFtZSgpO1xyXG4gICAgICAgIH0pLmpvaW4oJywgJyk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgLy8gUHJpY2UgdXBkYXRlIG9uIHNlcnZpY2VzIGNoYW5nZXNcclxuICAgIC8vIFRPRE8gSXMgbm90IGNvbXBsZXRlIGZvciBwcm9kdWN0aW9uXHJcbiAgICB0aGlzLnNlcnZpY2VzLnN1YnNjcmliZShmdW5jdGlvbihzZXJ2aWNlcykge1xyXG4gICAgICAgIHRoaXMucHRvdGFsUHJpY2Uoc2VydmljZXMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xyXG4gICAgICAgICAgICByZXR1cm4gcHJldiArIGN1ci5wcmljZSgpO1xyXG4gICAgICAgIH0sIDApKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICBcclxuICAgIC8vIFNtYXJ0IHZpc3VhbGl6YXRpb24gb2YgZGF0ZSBhbmQgdGltZVxyXG4gICAgdGhpcy5kaXNwbGF5ZWREYXRlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBtb21lbnQodGhpcy5zdGFydFRpbWUoKSkubG9jYWxlKCdlbi1VUy1MQycpLmNhbGVuZGFyKCk7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNwbGF5ZWRTdGFydFRpbWUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzLnN0YXJ0VGltZSgpKS5sb2NhbGUoJ2VuLVVTLUxDJykuZm9ybWF0KCdMVCcpO1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzcGxheWVkRW5kVGltZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbW9tZW50KHRoaXMuZW5kVGltZSgpKS5sb2NhbGUoJ2VuLVVTLUxDJykuZm9ybWF0KCdMVCcpO1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzcGxheWVkVGltZVJhbmdlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLmRpc3BsYXllZFN0YXJ0VGltZSgpICsgJy0nICsgdGhpcy5kaXNwbGF5ZWRFbmRUaW1lKCk7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5pdFN0YXJ0ZWQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnN0YXJ0VGltZSgpICYmIG5ldyBEYXRlKCkgPj0gdGhpcy5zdGFydFRpbWUoKSk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5pdEVuZGVkID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5lbmRUaW1lKCkgJiYgbmV3IERhdGUoKSA+PSB0aGlzLmVuZFRpbWUoKSk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5pc05ldyA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKCF0aGlzLmlkKCkpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc3RhdGVIZWFkZXIgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHRleHQgPSAnJztcclxuICAgICAgICBpZiAoIXRoaXMuaXNOZXcoKSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5pdFN0YXJ0ZWQoKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXRFbmRlZCgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dCA9ICdDb21wbGV0ZWQ6JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQgPSAnTm93Oic7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ID0gJ1VwY29taW5nOic7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0ZXh0O1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXBwb2ludG1lbnQ7XHJcbiIsIi8qKiBCb29raW5nU3VtbWFyeSBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbiAgICBcclxuZnVuY3Rpb24gQm9va2luZ1N1bW1hcnkodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgcXVhbnRpdHk6IDAsXHJcbiAgICAgICAgY29uY2VwdDogJycsXHJcbiAgICAgICAgdGltZTogbnVsbCxcclxuICAgICAgICB0aW1lRm9ybWF0OiAnIFtAXSBoOm1tYSdcclxuICAgIH0sIHZhbHVlcyk7XHJcblxyXG4gICAgdGhpcy5waHJhc2UgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgdCA9IHRoaXMudGltZUZvcm1hdCgpICYmIFxyXG4gICAgICAgICAgICB0aGlzLnRpbWUoKSAmJiBcclxuICAgICAgICAgICAgbW9tZW50KHRoaXMudGltZSgpKS5mb3JtYXQodGhpcy50aW1lRm9ybWF0KCkpIHx8XHJcbiAgICAgICAgICAgICcnOyAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uY2VwdCgpICsgdDtcclxuICAgIH0sIHRoaXMpO1xyXG5cclxuICAgIHRoaXMudXJsID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciB1cmwgPSB0aGlzLnRpbWUoKSAmJlxyXG4gICAgICAgICAgICAnL2NhbGVuZGFyLycgKyB0aGlzLnRpbWUoKS50b0lTT1N0cmluZygpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB1cmw7XHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCb29raW5nU3VtbWFyeTtcclxuIiwiLyoqXHJcbiAgICBFdmVudCBtb2RlbFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyogRXhhbXBsZSBKU09OIChyZXR1cm5lZCBieSB0aGUgUkVTVCBBUEkpOlxyXG57XHJcbiAgXCJFdmVudElEXCI6IDM1MyxcclxuICBcIlVzZXJJRFwiOiAxNDEsXHJcbiAgXCJFdmVudFR5cGVJRFwiOiAzLFxyXG4gIFwiU3VtbWFyeVwiOiBcIkhvdXNla2VlcGVyIHNlcnZpY2VzIGZvciBKb2huIEQuXCIsXHJcbiAgXCJBdmFpbGFiaWxpdHlUeXBlSURcIjogMyxcclxuICBcIlN0YXJ0VGltZVwiOiBcIjIwMTQtMDMtMjVUMDg6MDA6MDBaXCIsXHJcbiAgXCJFbmRUaW1lXCI6IFwiMjAxNC0wMy0yNVQxODowMDowMFpcIixcclxuICBcIktpbmRcIjogMCxcclxuICBcIklzQWxsRGF5XCI6IGZhbHNlLFxyXG4gIFwiVGltZVpvbmVcIjogXCIwMTowMDowMFwiLFxyXG4gIFwiTG9jYXRpb25cIjogXCJudWxsXCIsXHJcbiAgXCJVcGRhdGVkRGF0ZVwiOiBcIjIwMTQtMTAtMzBUMTU6NDQ6NDkuNjUzXCIsXHJcbiAgXCJDcmVhdGVkRGF0ZVwiOiBudWxsLFxyXG4gIFwiRGVzY3JpcHRpb25cIjogXCJ0ZXN0IGRlc2NyaXB0aW9uIG9mIGEgUkVTVCBldmVudFwiLFxyXG4gIFwiUmVjdXJyZW5jZVJ1bGVcIjoge1xyXG4gICAgXCJGcmVxdWVuY3lUeXBlSURcIjogNTAyLFxyXG4gICAgXCJJbnRlcnZhbFwiOiAxLFxyXG4gICAgXCJVbnRpbFwiOiBcIjIwMTQtMDctMDFUMDA6MDA6MDBcIixcclxuICAgIFwiQ291bnRcIjogbnVsbCxcclxuICAgIFwiRW5kaW5nXCI6IFwiZGF0ZVwiLFxyXG4gICAgXCJTZWxlY3RlZFdlZWtEYXlzXCI6IFtcclxuICAgICAgMSxcclxuICAgIF0sXHJcbiAgICBcIk1vbnRobHlXZWVrRGF5XCI6IGZhbHNlLFxyXG4gICAgXCJJbmNvbXBhdGlibGVcIjogZmFsc2UsXHJcbiAgICBcIlRvb01hbnlcIjogZmFsc2VcclxuICB9LFxyXG4gIFwiUmVjdXJyZW5jZU9jY3VycmVuY2VzXCI6IG51bGwsXHJcbiAgXCJSZWFkT25seVwiOiBmYWxzZVxyXG59Ki9cclxuXHJcbmZ1bmN0aW9uIFJlY3VycmVuY2VSdWxlKHZhbHVlcykge1xyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgZnJlcXVlbmN5VHlwZUlEOiAwLFxyXG4gICAgICAgIGludGVydmFsOiAxLCAvLzpJbnRlZ2VyXHJcbiAgICAgICAgdW50aWw6IG51bGwsIC8vOkRhdGVcclxuICAgICAgICBjb3VudDogbnVsbCwgLy86SW50ZWdlclxyXG4gICAgICAgIGVuZGluZzogbnVsbCwgLy8gOnN0cmluZyBQb3NzaWJsZSB2YWx1ZXMgYWxsb3dlZDogJ25ldmVyJywgJ2RhdGUnLCAnb2N1cnJlbmNlcydcclxuICAgICAgICBzZWxlY3RlZFdlZWtEYXlzOiBbXSwgLy8gOmludGVnZXJbXSAwOlN1bmRheVxyXG4gICAgICAgIG1vbnRobHlXZWVrRGF5OiBmYWxzZSxcclxuICAgICAgICBpbmNvbXBhdGlibGU6IGZhbHNlLFxyXG4gICAgICAgIHRvb01hbnk6IGZhbHNlXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBSZWN1cnJlbmNlT2NjdXJyZW5jZSh2YWx1ZXMpIHtcclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbnVsbCwgLy86RGF0ZVxyXG4gICAgICAgIGVuZFRpbWU6IG51bGwgLy86RGF0ZVxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbiAgIFxyXG5mdW5jdGlvbiBDYWxlbmRhckV2ZW50KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBjYWxlbmRhckV2ZW50SUQ6IDAsXHJcbiAgICAgICAgdXNlcklEOiAwLFxyXG4gICAgICAgIGV2ZW50VHlwZUlEOiAzLFxyXG4gICAgICAgIHN1bW1hcnk6ICcnLFxyXG4gICAgICAgIGF2YWlsYWJpbGl0eVR5cGVJRDogMCxcclxuICAgICAgICBzdGFydFRpbWU6IG51bGwsXHJcbiAgICAgICAgZW5kVGltZTogbnVsbCxcclxuICAgICAgICBraW5kOiAwLFxyXG4gICAgICAgIGlzQWxsRGF5OiBmYWxzZSxcclxuICAgICAgICB0aW1lWm9uZTogJ1onLFxyXG4gICAgICAgIGxvY2F0aW9uOiBudWxsLFxyXG4gICAgICAgIHVwZGF0ZWREYXRlOiBudWxsLFxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBudWxsLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnJyxcclxuICAgICAgICByZWFkT25seTogZmFsc2VcclxuICAgIH0sIHZhbHVlcyk7XHJcblxyXG4gICAgdGhpcy5yZWN1cnJlbmNlUnVsZSA9IGtvLm9ic2VydmFibGUoXHJcbiAgICAgICAgdmFsdWVzICYmIFxyXG4gICAgICAgIHZhbHVlcy5yZWN1cnJlbmNlUnVsZSAmJiBcclxuICAgICAgICBuZXcgUmVjdXJyZW5jZVJ1bGUodmFsdWVzLnJlY3VycmVuY2VSdWxlKVxyXG4gICAgKTtcclxuICAgIHRoaXMucmVjdXJyZW5jZU9jY3VycmVuY2VzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTsgLy86UmVjdXJyZW5jZU9jY3VycmVuY2VbXVxyXG4gICAgaWYgKHZhbHVlcyAmJiB2YWx1ZXMucmVjdXJyZW5jZU9jY3VycmVuY2VzKSB7XHJcbiAgICAgICAgdmFsdWVzLnJlY3VycmVuY2VPY2N1cnJlbmNlcy5mb3JFYWNoKGZ1bmN0aW9uKG9jY3VycmVuY2UpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuUmVjdXJyZW5jZU9jY3VycmVuY2VzLnB1c2gobmV3IFJlY3VycmVuY2VPY2N1cnJlbmNlKG9jY3VycmVuY2UpKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDYWxlbmRhckV2ZW50O1xyXG5cclxuQ2FsZW5kYXJFdmVudC5SZWN1cnJlbmNlUnVsZSA9IFJlY3VycmVuY2VSdWxlO1xyXG5DYWxlbmRhckV2ZW50LlJlY3VycmVuY2VPY2N1cnJlbmNlID0gUmVjdXJyZW5jZU9jY3VycmVuY2U7IiwiLyoqIENhbGVuZGFyU2xvdCBtb2RlbC5cclxuXHJcbiAgICBEZXNjcmliZXMgYSB0aW1lIHNsb3QgaW4gdGhlIGNhbGVuZGFyLCBmb3IgYSBjb25zZWN1dGl2ZVxyXG4gICAgZXZlbnQsIGFwcG9pbnRtZW50IG9yIGZyZWUgdGltZS5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBDbGllbnQgPSByZXF1aXJlKCcuL0NsaWVudCcpO1xyXG5cclxuZnVuY3Rpb24gQ2FsZW5kYXJTbG90KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbnVsbCxcclxuICAgICAgICBlbmRUaW1lOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICcnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICcnXHJcblxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDYWxlbmRhclNsb3Q7XHJcbiIsIi8qKlxyXG4gICAgQ2FsZW5kYXJTeW5jaW5nIG1vZGVsLlxyXG4gKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIENhbGVuZGFyU3luY2luZyh2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGljYWxFeHBvcnRVcmw6ICcnLFxyXG4gICAgICAgIGljYWxJbXBvcnRVcmw6ICcnXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENhbGVuZGFyU3luY2luZztcclxuIiwiLyoqIENsaWVudCBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gQ2xpZW50KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBpZDogMCxcclxuICAgICAgICBmaXJzdE5hbWU6ICcnLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnJyxcclxuICAgICAgICBlbWFpbDogJycsXHJcbiAgICAgICAgbW9iaWxlUGhvbmU6IG51bGwsXHJcbiAgICAgICAgYWx0ZXJuYXRlUGhvbmU6IG51bGwsXHJcbiAgICAgICAgYmlydGhNb250aERheTogbnVsbCxcclxuICAgICAgICBiaXJ0aE1vbnRoOiBudWxsLFxyXG4gICAgICAgIG5vdGVzQWJvdXRDbGllbnQ6IG51bGxcclxuICAgIH0sIHZhbHVlcyk7XHJcblxyXG4gICAgdGhpcy5mdWxsTmFtZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKHRoaXMuZmlyc3ROYW1lKCkgKyAnICcgKyB0aGlzLmxhc3ROYW1lKCkpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuYmlydGhEYXkgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYmlydGhNb250aERheSgpICYmXHJcbiAgICAgICAgICAgIHRoaXMuYmlydGhNb250aCgpKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBUT0RPIGkxMG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmlydGhNb250aCgpICsgJy8nICsgdGhpcy5iaXJ0aE1vbnRoRGF5KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5waG9uZU51bWJlciA9IGtvLnB1cmVDb21wdXRlZCh7XHJcbiAgICAgICAgcmVhZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBtID0gdGhpcy5tb2JpbGVQaG9uZSgpLFxyXG4gICAgICAgICAgICAgICAgYSA9IHRoaXMuYWx0ZXJuYXRlUGhvbmUoKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBtID8gbSA6IGE7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB3cml0ZTogZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgICAvLyBUT0RPXHJcbiAgICAgICAgfSxcclxuICAgICAgICBvd25lcjogdGhpc1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMuY2FuUmVjZWl2ZVNtcyA9IGtvLnB1cmVDb21wdXRlZCh7XHJcbiAgICAgICAgcmVhZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBtID0gdGhpcy5tb2JpbGVQaG9uZSgpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG0gPyB0cnVlIDogZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB3cml0ZTogZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgICAvLyBUT0RPXHJcbiAgICAgICAgfSxcclxuICAgICAgICBvd25lcjogdGhpc1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ2xpZW50O1xyXG4iLCIvKiogR2V0TW9yZSBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgTGlzdFZpZXdJdGVtID0gcmVxdWlyZSgnLi9MaXN0Vmlld0l0ZW0nKTtcclxuXHJcbmZ1bmN0aW9uIEdldE1vcmUodmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBhdmFpbGFiaWxpdHk6IGZhbHNlLFxyXG4gICAgICAgIHBheW1lbnRzOiBmYWxzZSxcclxuICAgICAgICBwcm9maWxlOiBmYWxzZSxcclxuICAgICAgICBjb29wOiB0cnVlXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgdmFyIGF2YWlsYWJsZUl0ZW1zID0ge1xyXG4gICAgICAgIGF2YWlsYWJpbGl0eTogbmV3IExpc3RWaWV3SXRlbSh7XHJcbiAgICAgICAgICAgIGNvbnRlbnRMaW5lMTogJ0NvbXBsZXRlIHlvdXIgYXZhaWxhYmlsaXR5IHRvIGNyZWF0ZSBhIGNsZWFuZXIgY2FsZW5kYXInLFxyXG4gICAgICAgICAgICBtYXJrZXJJY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1jYWxlbmRhcicsXHJcbiAgICAgICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tcmlnaHQnXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgcGF5bWVudHM6IG5ldyBMaXN0Vmlld0l0ZW0oe1xyXG4gICAgICAgICAgICBjb250ZW50TGluZTE6ICdTdGFydCBhY2NlcHRpbmcgcGF5bWVudHMgdGhyb3VnaCBMb2Nvbm9taWNzJyxcclxuICAgICAgICAgICAgbWFya2VySWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tdXNkJyxcclxuICAgICAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1yaWdodCdcclxuICAgICAgICB9KSxcclxuICAgICAgICBwcm9maWxlOiBuZXcgTGlzdFZpZXdJdGVtKHtcclxuICAgICAgICAgICAgY29udGVudExpbmUxOiAnQWN0aXZhdGUgeW91ciBwcm9maWxlIGluIHRoZSBtYXJrZXRwbGFjZScsXHJcbiAgICAgICAgICAgIG1hcmtlckljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXVzZXInLFxyXG4gICAgICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0J1xyXG4gICAgICAgIH0pLFxyXG4gICAgICAgIGNvb3A6IG5ldyBMaXN0Vmlld0l0ZW0oe1xyXG4gICAgICAgICAgICBjb250ZW50TGluZTE6ICdMZWFybiBtb3JlIGFib3V0IG91ciBjb29wZXJhdGl2ZScsXHJcbiAgICAgICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tcmlnaHQnXHJcbiAgICAgICAgfSlcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pdGVtcyA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcclxuICAgICAgICBcclxuICAgICAgICBPYmplY3Qua2V5cyhhdmFpbGFibGVJdGVtcykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICh0aGlzW2tleV0oKSlcclxuICAgICAgICAgICAgICAgIGl0ZW1zLnB1c2goYXZhaWxhYmxlSXRlbXNba2V5XSk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGl0ZW1zO1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gR2V0TW9yZTtcclxuIiwiLyoqIExpc3RWaWV3SXRlbSBtb2RlbC5cclxuXHJcbiAgICBEZXNjcmliZXMgYSBnZW5lcmljIGl0ZW0gb2YgYVxyXG4gICAgTGlzdFZpZXcgY29tcG9uZW50LlxyXG4gKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxuZnVuY3Rpb24gTGlzdFZpZXdJdGVtKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIG1hcmtlckxpbmUxOiBudWxsLFxyXG4gICAgICAgIG1hcmtlckxpbmUyOiBudWxsLFxyXG4gICAgICAgIG1hcmtlckljb246IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgY29udGVudExpbmUxOiAnJyxcclxuICAgICAgICBjb250ZW50TGluZTI6IG51bGwsXHJcbiAgICAgICAgbGluazogJyMnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgY2xhc3NOYW1lczogJydcclxuXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExpc3RWaWV3SXRlbTtcclxuIiwiLyoqIExvY2F0aW9uIG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBMb2NhdGlvbih2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBsb2NhdGlvbklEOiAwLFxyXG4gICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgIGFkZHJlc3NMaW5lMTogbnVsbCxcclxuICAgICAgICBhZGRyZXNzTGluZTI6IG51bGwsXHJcbiAgICAgICAgY2l0eTogbnVsbCxcclxuICAgICAgICBzdGF0ZVByb3ZpbmNlQ29kZTogbnVsbCxcclxuICAgICAgICBzdGF0ZVByb3ZpY2VJRDogbnVsbCxcclxuICAgICAgICBwb3N0YWxDb2RlOiBudWxsLFxyXG4gICAgICAgIHBvc3RhbENvZGVJRDogbnVsbCxcclxuICAgICAgICBjb3VudHJ5SUQ6IG51bGwsXHJcbiAgICAgICAgbGF0aXR1ZGU6IG51bGwsXHJcbiAgICAgICAgbG9uZ2l0dWRlOiBudWxsLFxyXG4gICAgICAgIHNwZWNpYWxJbnN0cnVjdGlvbnM6IG51bGwsXHJcbiAgICAgICAgaXNTZXJ2aWNlUmFkaXVzOiBmYWxzZSxcclxuICAgICAgICBpc1NlcnZpY2VMb2NhdGlvbjogZmFsc2UsXHJcbiAgICAgICAgc2VydmljZVJhZGl1czogMFxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5zaW5nbGVMaW5lID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGxpc3QgPSBbXHJcbiAgICAgICAgICAgIHRoaXMuYWRkcmVzc0xpbmUxKCksXHJcbiAgICAgICAgICAgIHRoaXMuY2l0eSgpLFxyXG4gICAgICAgICAgICB0aGlzLnBvc3RhbENvZGUoKSxcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZVByb3ZpbmNlQ29kZSgpXHJcbiAgICAgICAgXTtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbGlzdC5maWx0ZXIoZnVuY3Rpb24odikgeyByZXR1cm4gISF2OyB9KS5qb2luKCcsICcpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuY291bnRyeU5hbWUgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmNvdW50cnlJRCgpID09PSAxID9cclxuICAgICAgICAgICAgJ1VuaXRlZCBTdGF0ZXMnIDpcclxuICAgICAgICAgICAgdGhpcy5jb3VudHJ5SUQoKSA9PT0gMiA/XHJcbiAgICAgICAgICAgICdTcGFpbicgOlxyXG4gICAgICAgICAgICAndW5rbm93J1xyXG4gICAgICAgICk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5jb3VudHJ5Q29kZUFscGhhMiA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMuY291bnRyeUlEKCkgPT09IDEgP1xyXG4gICAgICAgICAgICAnVVMnIDpcclxuICAgICAgICAgICAgdGhpcy5jb3VudHJ5SUQoKSA9PT0gMiA/XHJcbiAgICAgICAgICAgICdFUycgOlxyXG4gICAgICAgICAgICAnJ1xyXG4gICAgICAgICk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5sYXRsbmcgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBsYXQ6IHRoaXMubGF0aXR1ZGUoKSxcclxuICAgICAgICAgICAgbG5nOiB0aGlzLmxvbmdpdHVkZSgpXHJcbiAgICAgICAgfTtcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExvY2F0aW9uO1xyXG4iLCIvKiogTWFpbEZvbGRlciBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXHJcbiAgICBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XHJcblxyXG5mdW5jdGlvbiBNYWlsRm9sZGVyKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgbWVzc2FnZXM6IFtdLFxyXG4gICAgICAgIHRvcE51bWJlcjogMTBcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMudG9wID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uIHRvcChudW0pIHtcclxuICAgICAgICBpZiAobnVtKSB0aGlzLnRvcE51bWJlcihudW0pO1xyXG4gICAgICAgIHJldHVybiBfLmZpcnN0KHRoaXMubWVzc2FnZXMoKSwgdGhpcy50b3BOdW1iZXIoKSk7XHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNYWlsRm9sZGVyO1xyXG4iLCIvKiogTWVzc2FnZSBtb2RlbC5cclxuXHJcbiAgICBEZXNjcmliZXMgYSBtZXNzYWdlIGZyb20gYSBNYWlsRm9sZGVyLlxyXG4gICAgQSBtZXNzYWdlIGNvdWxkIGJlIG9mIGRpZmZlcmVudCB0eXBlcyxcclxuICAgIGFzIGlucXVpcmllcywgYm9va2luZ3MsIGJvb2tpbmcgcmVxdWVzdHMuXHJcbiAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbi8vVE9ETyAgIFRocmVhZCA9IHJlcXVpcmUoJy4vVGhyZWFkJyk7XHJcblxyXG5mdW5jdGlvbiBNZXNzYWdlKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGlkOiAwLFxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBudWxsLFxyXG4gICAgICAgIHVwZGF0ZWREYXRlOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICcnLFxyXG4gICAgICAgIGNvbnRlbnQ6IG51bGwsXHJcbiAgICAgICAgbGluazogJyMnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgY2xhc3NOYW1lczogJydcclxuXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICAvLyBTbWFydCB2aXN1YWxpemF0aW9uIG9mIGRhdGUgYW5kIHRpbWVcclxuICAgIHRoaXMuZGlzcGxheWVkRGF0ZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbW9tZW50KHRoaXMuY3JlYXRlZERhdGUoKSkubG9jYWxlKCdlbi1VUy1MQycpLmNhbGVuZGFyKCk7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNwbGF5ZWRUaW1lID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBtb21lbnQodGhpcy5jcmVhdGVkRGF0ZSgpKS5sb2NhbGUoJ2VuLVVTLUxDJykuZm9ybWF0KCdMVCcpO1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWVzc2FnZTtcclxuIiwiLyoqXHJcbiAgICBNb2RlbCBjbGFzcyB0byBoZWxwIGJ1aWxkIG1vZGVscy5cclxuXHJcbiAgICBJcyBub3QgZXhhY3RseSBhbiAnT09QIGJhc2UnIGNsYXNzLCBidXQgcHJvdmlkZXNcclxuICAgIHV0aWxpdGllcyB0byBtb2RlbHMgYW5kIGEgbW9kZWwgZGVmaW5pdGlvbiBvYmplY3RcclxuICAgIHdoZW4gZXhlY3V0ZWQgaW4gdGhlaXIgY29uc3RydWN0b3JzIGFzOlxyXG4gICAgXHJcbiAgICAnJydcclxuICAgIGZ1bmN0aW9uIE15TW9kZWwoKSB7XHJcbiAgICAgICAgTW9kZWwodGhpcyk7XHJcbiAgICAgICAgLy8gTm93LCB0aGVyZSBpcyBhIHRoaXMubW9kZWwgcHJvcGVydHkgd2l0aFxyXG4gICAgICAgIC8vIGFuIGluc3RhbmNlIG9mIHRoZSBNb2RlbCBjbGFzcywgd2l0aCBcclxuICAgICAgICAvLyB1dGlsaXRpZXMgYW5kIG1vZGVsIHNldHRpbmdzLlxyXG4gICAgfVxyXG4gICAgJycnXHJcbiAgICBcclxuICAgIFRoYXQgYXV0byBjcmVhdGlvbiBvZiAnbW9kZWwnIHByb3BlcnR5IGNhbiBiZSBhdm9pZGVkXHJcbiAgICB3aGVuIHVzaW5nIHRoZSBvYmplY3QgaW5zdGFudGlhdGlvbiBzeW50YXggKCduZXcnIGtleXdvcmQpOlxyXG4gICAgXHJcbiAgICAnJydcclxuICAgIHZhciBtb2RlbCA9IG5ldyBNb2RlbChvYmopO1xyXG4gICAgLy8gVGhlcmUgaXMgbm8gYSAnb2JqLm1vZGVsJyBwcm9wZXJ0eSwgY2FuIGJlXHJcbiAgICAvLyBhc3NpZ25lZCB0byB3aGF0ZXZlciBwcm9wZXJ0eSBvciBub3RoaW5nLlxyXG4gICAgJycnXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbmtvLm1hcHBpbmcgPSByZXF1aXJlKCdrbm9ja291dC5tYXBwaW5nJyk7XHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBjbG9uZSA9IGZ1bmN0aW9uKG9iaikgeyByZXR1cm4gJC5leHRlbmQodHJ1ZSwge30sIG9iaik7IH07XHJcblxyXG5mdW5jdGlvbiBNb2RlbChtb2RlbE9iamVjdCkge1xyXG4gICAgXHJcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgTW9kZWwpKSB7XHJcbiAgICAgICAgLy8gRXhlY3V0ZWQgYXMgYSBmdW5jdGlvbiwgaXQgbXVzdCBjcmVhdGVcclxuICAgICAgICAvLyBhIE1vZGVsIGluc3RhbmNlXHJcbiAgICAgICAgdmFyIG1vZGVsID0gbmV3IE1vZGVsKG1vZGVsT2JqZWN0KTtcclxuICAgICAgICAvLyBhbmQgcmVnaXN0ZXIgYXV0b21hdGljYWxseSBhcyBwYXJ0XHJcbiAgICAgICAgLy8gb2YgdGhlIG1vZGVsT2JqZWN0IGluICdtb2RlbCcgcHJvcGVydHlcclxuICAgICAgICBtb2RlbE9iamVjdC5tb2RlbCA9IG1vZGVsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFJldHVybnMgdGhlIGluc3RhbmNlXHJcbiAgICAgICAgcmV0dXJuIG1vZGVsO1xyXG4gICAgfVxyXG4gXHJcbiAgICAvLyBJdCBpbmNsdWRlcyBhIHJlZmVyZW5jZSB0byB0aGUgb2JqZWN0XHJcbiAgICB0aGlzLm1vZGVsT2JqZWN0ID0gbW9kZWxPYmplY3Q7XHJcbiAgICAvLyBJdCBtYWludGFpbnMgYSBsaXN0IG9mIHByb3BlcnRpZXMgYW5kIGZpZWxkc1xyXG4gICAgdGhpcy5wcm9wZXJ0aWVzTGlzdCA9IFtdO1xyXG4gICAgdGhpcy5maWVsZHNMaXN0ID0gW107XHJcbiAgICAvLyBJdCBhbGxvdyBzZXR0aW5nIHRoZSAna28ubWFwcGluZy5mcm9tSlMnIG1hcHBpbmcgb3B0aW9uc1xyXG4gICAgLy8gdG8gY29udHJvbCBjb252ZXJzaW9ucyBmcm9tIHBsYWluIEpTIG9iamVjdHMgd2hlbiBcclxuICAgIC8vICd1cGRhdGVXaXRoJy5cclxuICAgIHRoaXMubWFwcGluZ09wdGlvbnMgPSB7fTtcclxuICAgIFxyXG4gICAgLy8gVGltZXN0YW1wIHdpdGggdGhlIGRhdGUgb2YgbGFzdCBjaGFuZ2VcclxuICAgIC8vIGluIHRoZSBkYXRhIChhdXRvbWF0aWNhbGx5IHVwZGF0ZWQgd2hlbiBjaGFuZ2VzXHJcbiAgICAvLyBoYXBwZW5zIG9uIHByb3BlcnRpZXM7IGZpZWxkcyBvciBhbnkgb3RoZXIgbWVtYmVyXHJcbiAgICAvLyBhZGRlZCB0byB0aGUgbW9kZWwgY2Fubm90IGJlIG9ic2VydmVkIGZvciBjaGFuZ2VzLFxyXG4gICAgLy8gcmVxdWlyaW5nIG1hbnVhbCB1cGRhdGluZyB3aXRoIGEgJ25ldyBEYXRlKCknLCBidXQgaXNcclxuICAgIC8vIGJldHRlciB0byB1c2UgcHJvcGVydGllcy5cclxuICAgIC8vIEl0cyByYXRlZCB0byB6ZXJvIGp1c3QgdG8gYXZvaWQgdGhhdCBjb25zZWN1dGl2ZVxyXG4gICAgLy8gc3luY2hyb25vdXMgY2hhbmdlcyBlbWl0IGxvdCBvZiBub3RpZmljYXRpb25zLCBzcGVjaWFsbHlcclxuICAgIC8vIHdpdGggYnVsayB0YXNrcyBsaWtlICd1cGRhdGVXaXRoJy5cclxuICAgIHRoaXMuZGF0YVRpbWVzdGFtcCA9IGtvLm9ic2VydmFibGUobmV3IERhdGUoKSkuZXh0ZW5kKHsgcmF0ZUxpbWl0OiAwIH0pO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVsO1xyXG5cclxuLyoqXHJcbiAgICBEZWZpbmUgb2JzZXJ2YWJsZSBwcm9wZXJ0aWVzIHVzaW5nIHRoZSBnaXZlblxyXG4gICAgcHJvcGVydGllcyBvYmplY3QgZGVmaW5pdGlvbiB0aGF0IGluY2x1ZGVzIGRlIGRlZmF1bHQgdmFsdWVzLFxyXG4gICAgYW5kIHNvbWUgb3B0aW9uYWwgaW5pdGlhbFZhbHVlcyAobm9ybWFsbHkgdGhhdCBpcyBwcm92aWRlZCBleHRlcm5hbGx5XHJcbiAgICBhcyBhIHBhcmFtZXRlciB0byB0aGUgbW9kZWwgY29uc3RydWN0b3IsIHdoaWxlIGRlZmF1bHQgdmFsdWVzIGFyZVxyXG4gICAgc2V0IGluIHRoZSBjb25zdHJ1Y3RvcikuXHJcbiAgICBUaGF0IHByb3BlcnRpZXMgYmVjb21lIG1lbWJlcnMgb2YgdGhlIG1vZGVsT2JqZWN0LCBzaW1wbGlmeWluZyBcclxuICAgIG1vZGVsIGRlZmluaXRpb25zLlxyXG4gICAgXHJcbiAgICBJdCB1c2VzIEtub2Nrb3V0Lm9ic2VydmFibGUgYW5kIG9ic2VydmFibGVBcnJheSwgc28gcHJvcGVydGllc1xyXG4gICAgYXJlIGZ1bnRpb25zIHRoYXQgcmVhZHMgdGhlIHZhbHVlIHdoZW4gbm8gYXJndW1lbnRzIG9yIHNldHMgd2hlblxyXG4gICAgb25lIGFyZ3VtZW50IGlzIHBhc3NlZCBvZi5cclxuKiovXHJcbk1vZGVsLnByb3RvdHlwZS5kZWZQcm9wZXJ0aWVzID0gZnVuY3Rpb24gZGVmUHJvcGVydGllcyhwcm9wZXJ0aWVzLCBpbml0aWFsVmFsdWVzKSB7XHJcblxyXG4gICAgaW5pdGlhbFZhbHVlcyA9IGluaXRpYWxWYWx1ZXMgfHwge307XHJcblxyXG4gICAgdmFyIG1vZGVsT2JqZWN0ID0gdGhpcy5tb2RlbE9iamVjdCxcclxuICAgICAgICBwcm9wZXJ0aWVzTGlzdCA9IHRoaXMucHJvcGVydGllc0xpc3QsXHJcbiAgICAgICAgZGF0YVRpbWVzdGFtcCA9IHRoaXMuZGF0YVRpbWVzdGFtcDtcclxuXHJcbiAgICBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBkZWZWYWwgPSBwcm9wZXJ0aWVzW2tleV07XHJcbiAgICAgICAgLy8gQ3JlYXRlIG9ic2VydmFibGUgcHJvcGVydHkgd2l0aCBkZWZhdWx0IHZhbHVlXHJcbiAgICAgICAgbW9kZWxPYmplY3Rba2V5XSA9IEFycmF5LmlzQXJyYXkoZGVmVmFsKSA/XHJcbiAgICAgICAgICAgIGtvLm9ic2VydmFibGVBcnJheShkZWZWYWwpIDpcclxuICAgICAgICAgICAga28ub2JzZXJ2YWJsZShkZWZWYWwpO1xyXG4gICAgICAgIC8vIFJlbWVtYmVyIGRlZmF1bHRcclxuICAgICAgICBtb2RlbE9iamVjdFtrZXldLl9kZWZhdWx0VmFsdWUgPSBkZWZWYWw7XHJcbiAgICAgICAgLy8gcmVtZW1iZXIgaW5pdGlhbFxyXG4gICAgICAgIG1vZGVsT2JqZWN0W2tleV0uX2luaXRpYWxWYWx1ZSA9IGluaXRpYWxWYWx1ZXNba2V5XTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBJZiB0aGVyZSBpcyBhbiBpbml0aWFsVmFsdWUsIHNldCBpdDpcclxuICAgICAgICBpZiAodHlwZW9mKGluaXRpYWxWYWx1ZXNba2V5XSkgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIG1vZGVsT2JqZWN0W2tleV0oaW5pdGlhbFZhbHVlc1trZXldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQWRkIHN1YnNjcmliZXIgdG8gdXBkYXRlIHRoZSB0aW1lc3RhbXAgb24gY2hhbmdlc1xyXG4gICAgICAgIG1vZGVsT2JqZWN0W2tleV0uc3Vic2NyaWJlKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBkYXRhVGltZXN0YW1wKG5ldyBEYXRlKCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEFkZCB0byB0aGUgaW50ZXJuYWwgcmVnaXN0cnlcclxuICAgICAgICBwcm9wZXJ0aWVzTGlzdC5wdXNoKGtleSk7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gVXBkYXRlIHRpbWVzdGFtcCBhZnRlciB0aGUgYnVsayBjcmVhdGlvbi5cclxuICAgIGRhdGFUaW1lc3RhbXAobmV3IERhdGUoKSk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIERlZmluZSBmaWVsZHMgYXMgcGxhaW4gbWVtYmVycyBvZiB0aGUgbW9kZWxPYmplY3QgdXNpbmdcclxuICAgIHRoZSBmaWVsZHMgb2JqZWN0IGRlZmluaXRpb24gdGhhdCBpbmNsdWRlcyBkZWZhdWx0IHZhbHVlcyxcclxuICAgIGFuZCBzb21lIG9wdGlvbmFsIGluaXRpYWxWYWx1ZXMuXHJcbiAgICBcclxuICAgIEl0cyBsaWtlIGRlZlByb3BlcnRpZXMsIGJ1dCBmb3IgcGxhaW4ganMgdmFsdWVzIHJhdGhlciB0aGFuIG9ic2VydmFibGVzLlxyXG4qKi9cclxuTW9kZWwucHJvdG90eXBlLmRlZkZpZWxkcyA9IGZ1bmN0aW9uIGRlZkZpZWxkcyhmaWVsZHMsIGluaXRpYWxWYWx1ZXMpIHtcclxuXHJcbiAgICBpbml0aWFsVmFsdWVzID0gaW5pdGlhbFZhbHVlcyB8fCB7fTtcclxuXHJcbiAgICB2YXIgbW9kZWxPYmplY3QgPSB0aGlzLm1vZGVsT2JqZWN0LFxyXG4gICAgICAgIGZpZWxkc0xpc3QgPSB0aGlzLmZpZWxkc0xpc3Q7XHJcblxyXG4gICAgT2JqZWN0LmtleXMoZmllbGRzKS5lYWNoKGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBkZWZWYWwgPSBmaWVsZHNba2V5XTtcclxuICAgICAgICAvLyBDcmVhdGUgZmllbGQgd2l0aCBkZWZhdWx0IHZhbHVlXHJcbiAgICAgICAgbW9kZWxPYmplY3Rba2V5XSA9IGRlZlZhbDtcclxuICAgICAgICBcclxuICAgICAgICAvLyBJZiB0aGVyZSBpcyBhbiBpbml0aWFsVmFsdWUsIHNldCBpdDpcclxuICAgICAgICBpZiAodHlwZW9mKGluaXRpYWxWYWx1ZXNba2V5XSkgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIG1vZGVsT2JqZWN0W2tleV0gPSBpbml0aWFsVmFsdWVzW2tleV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEFkZCB0byB0aGUgaW50ZXJuYWwgcmVnaXN0cnlcclxuICAgICAgICBmaWVsZHNMaXN0LnB1c2goa2V5KTtcclxuICAgIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBTdG9yZSB0aGUgbGlzdCBvZiBmaWVsZHMgdGhhdCBtYWtlIHRoZSBJRC9wcmltYXJ5IGtleVxyXG4gICAgYW5kIGNyZWF0ZSBhbiBhbGlhcyAnaWQnIHByb3BlcnR5IHRoYXQgcmV0dXJucyB0aGVcclxuICAgIHZhbHVlIGZvciB0aGUgSUQgZmllbGQgb3IgYXJyYXkgb2YgdmFsdWVzIHdoZW4gbXVsdGlwbGVcclxuICAgIGZpZWxkcy5cclxuKiovXHJcbk1vZGVsLnByb3RvdHlwZS5kZWZJRCA9IGZ1bmN0aW9uIGRlZklEKGZpZWxkc05hbWVzKSB7XHJcbiAgICBcclxuICAgIC8vIFN0b3JlIHRoZSBsaXN0XHJcbiAgICB0aGlzLmlkRmllbGRzTmFtZXMgPSBmaWVsZHNOYW1lcztcclxuICAgIFxyXG4gICAgLy8gRGVmaW5lIElEIG9ic2VydmFibGVcclxuICAgIGlmIChmaWVsZHNOYW1lcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAvLyBSZXR1cm5zIHNpbmdsZSB2YWx1ZVxyXG4gICAgICAgIHZhciBmaWVsZCA9IGZpZWxkc05hbWVzWzBdO1xyXG4gICAgICAgIHRoaXMubW9kZWxPYmplY3QuaWQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzW2ZpZWxkXSgpO1xyXG4gICAgICAgIH0sIHRoaXMubW9kZWxPYmplY3QpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdGhpcy5tb2RlbE9iamVjdC5pZCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZpZWxkc05hbWVzLm1hcChmdW5jdGlvbihmaWVsZE5hbWUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW2ZpZWxkXSgpO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgICAgIH0sIHRoaXMubW9kZWxPYmplY3QpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAgICBBbGxvd3MgdG8gcmVnaXN0ZXIgYSBwcm9wZXJ0eSAocHJldmlvdXNseSBkZWZpbmVkKSBhcyBcclxuICAgIHRoZSBtb2RlbCB0aW1lc3RhbXAsIHNvIGdldHMgdXBkYXRlZCBvbiBhbnkgZGF0YSBjaGFuZ2VcclxuICAgIChrZWVwIGluIHN5bmMgd2l0aCB0aGUgaW50ZXJuYWwgZGF0YVRpbWVzdGFtcCkuXHJcbioqL1xyXG5Nb2RlbC5wcm90b3R5cGUucmVnVGltZXN0YW1wID0gZnVuY3Rpb24gcmVnVGltZXN0YW1wUHJvcGVydHkocHJvcGVydHlOYW1lKSB7XHJcblxyXG4gICAgdmFyIHByb3AgPSB0aGlzLm1vZGVsT2JqZWN0W3Byb3BlcnR5TmFtZV07XHJcbiAgICBpZiAodHlwZW9mKHByb3ApICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGVyZSBpcyBubyBvYnNlcnZhYmxlIHByb3BlcnR5IHdpdGggbmFtZSBbJyArIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWUgKyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ10gdG8gcmVnaXN0ZXIgYXMgdGltZXN0YW1wLidcclxuICAgICAgICk7XHJcbiAgICB9XHJcbiAgICAvLyBBZGQgc3Vic2NyaWJlciBvbiBpbnRlcm5hbCB0aW1lc3RhbXAgdG8ga2VlcFxyXG4gICAgLy8gdGhlIHByb3BlcnR5IHVwZGF0ZWRcclxuICAgIHRoaXMuZGF0YVRpbWVzdGFtcC5zdWJzY3JpYmUoZnVuY3Rpb24odGltZXN0YW1wKSB7XHJcbiAgICAgICAgcHJvcCh0aW1lc3RhbXApO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIFJldHVybnMgYSBwbGFpbiBvYmplY3Qgd2l0aCB0aGUgcHJvcGVydGllcyBhbmQgZmllbGRzXHJcbiAgICBvZiB0aGUgbW9kZWwgb2JqZWN0LCBqdXN0IHZhbHVlcy5cclxuICAgIFxyXG4gICAgQHBhcmFtIGRlZXBDb3B5OmJvb2wgSWYgbGVmdCB1bmRlZmluZWQsIGRvIG5vdCBjb3B5IG9iamVjdHMgaW5cclxuICAgIHZhbHVlcyBhbmQgbm90IHJlZmVyZW5jZXMuIElmIGZhbHNlLCBkbyBhIHNoYWxsb3cgY29weSwgc2V0dGluZ1xyXG4gICAgdXAgcmVmZXJlbmNlcyBpbiB0aGUgcmVzdWx0LiBJZiB0cnVlLCB0byBhIGRlZXAgY29weSBvZiBhbGwgb2JqZWN0cy5cclxuKiovXHJcbk1vZGVsLnByb3RvdHlwZS50b1BsYWluT2JqZWN0ID0gZnVuY3Rpb24gdG9QbGFpbk9iamVjdChkZWVwQ29weSkge1xyXG5cclxuICAgIHZhciBwbGFpbiA9IHt9LFxyXG4gICAgICAgIG1vZGVsT2JqID0gdGhpcy5tb2RlbE9iamVjdDtcclxuXHJcbiAgICBmdW5jdGlvbiBzZXRWYWx1ZShwcm9wZXJ0eSwgdmFsKSB7XHJcbiAgICAgICAgLypqc2hpbnQgbWF4Y29tcGxleGl0eTogMTAqL1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICh0eXBlb2YodmFsKSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgaWYgKGRlZXBDb3B5ID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgRGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEEgZGF0ZSBjbG9uZVxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IG5ldyBEYXRlKHZhbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh2YWwgJiYgdmFsLm1vZGVsIGluc3RhbmNlb2YgTW9kZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBBIG1vZGVsIGNvcHlcclxuICAgICAgICAgICAgICAgICAgICBwbGFpbltwcm9wZXJ0eV0gPSB2YWwubW9kZWwudG9QbGFpbk9iamVjdChkZWVwQ29weSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh2YWwgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBwbGFpbltwcm9wZXJ0eV0gPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUGxhaW4gJ3N0YW5kYXJkJyBvYmplY3QgY2xvbmVcclxuICAgICAgICAgICAgICAgICAgICBwbGFpbltwcm9wZXJ0eV0gPSBjbG9uZSh2YWwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGRlZXBDb3B5ID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gU2hhbGxvdyBjb3B5XHJcbiAgICAgICAgICAgICAgICBwbGFpbltwcm9wZXJ0eV0gPSB2YWw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gT24gZWxzZSwgZG8gbm90aGluZywgbm8gcmVmZXJlbmNlcywgbm8gY2xvbmVzXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBwbGFpbltwcm9wZXJ0eV0gPSB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMucHJvcGVydGllc0xpc3QuZm9yRWFjaChmdW5jdGlvbihwcm9wZXJ0eSkge1xyXG4gICAgICAgIC8vIFByb3BlcnRpZXMgYXJlIG9ic2VydmFibGVzLCBzbyBmdW5jdGlvbnMgd2l0aG91dCBwYXJhbXM6XHJcbiAgICAgICAgdmFyIHZhbCA9IG1vZGVsT2JqW3Byb3BlcnR5XSgpO1xyXG5cclxuICAgICAgICBzZXRWYWx1ZShwcm9wZXJ0eSwgdmFsKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuZmllbGRzTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKGZpZWxkKSB7XHJcbiAgICAgICAgLy8gRmllbGRzIGFyZSBqdXN0IHBsYWluIG9iamVjdCBtZW1iZXJzIGZvciB2YWx1ZXMsIGp1c3QgY29weTpcclxuICAgICAgICB2YXIgdmFsID0gbW9kZWxPYmpbZmllbGRdO1xyXG5cclxuICAgICAgICBzZXRWYWx1ZShmaWVsZCwgdmFsKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBwbGFpbjtcclxufTtcclxuXHJcbk1vZGVsLnByb3RvdHlwZS51cGRhdGVXaXRoID0gZnVuY3Rpb24gdXBkYXRlV2l0aChkYXRhLCBkZWVwQ29weSkge1xyXG4gICAgXHJcbiAgICAvLyBXZSBuZWVkIGEgcGxhaW4gb2JqZWN0IGZvciAnZnJvbUpTJy5cclxuICAgIC8vIElmIGlzIGEgbW9kZWwsIGV4dHJhY3QgdGhlaXIgcHJvcGVydGllcyBhbmQgZmllbGRzIGZyb21cclxuICAgIC8vIHRoZSBvYnNlcnZhYmxlcyAoZnJvbUpTKSwgc28gd2Ugbm90IGdldCBjb21wdXRlZFxyXG4gICAgLy8gb3IgZnVuY3Rpb25zLCBqdXN0IHJlZ2lzdGVyZWQgcHJvcGVydGllcyBhbmQgZmllbGRzXHJcbiAgICB2YXIgdGltZXN0YW1wID0gbnVsbDtcclxuICAgIGlmIChkYXRhICYmIGRhdGEubW9kZWwgaW5zdGFuY2VvZiBNb2RlbCkge1xyXG5cclxuICAgICAgICAvLyBXZSBuZWVkIHRvIHNldCB0aGUgc2FtZSB0aW1lc3RhbXAsIHNvXHJcbiAgICAgICAgLy8gcmVtZW1iZXIgZm9yIGFmdGVyIHRoZSBmcm9tSlNcclxuICAgICAgICB0aW1lc3RhbXAgPSBkYXRhLm1vZGVsLmRhdGFUaW1lc3RhbXAoKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBSZXBsYWNlIGRhdGEgd2l0aCBhIHBsYWluIGNvcHkgb2YgaXRzZWxmXHJcbiAgICAgICAgZGF0YSA9IGRhdGEubW9kZWwudG9QbGFpbk9iamVjdChkZWVwQ29weSk7XHJcbiAgICB9XHJcblxyXG4gICAga28ubWFwcGluZy5mcm9tSlMoZGF0YSwgdGhpcy5tYXBwaW5nT3B0aW9ucywgdGhpcy5tb2RlbE9iamVjdCk7XHJcbiAgICAvLyBTYW1lIHRpbWVzdGFtcCBpZiBhbnlcclxuICAgIGlmICh0aW1lc3RhbXApXHJcbiAgICAgICAgdGhpcy5tb2RlbE9iamVjdC5tb2RlbC5kYXRhVGltZXN0YW1wKHRpbWVzdGFtcCk7XHJcbn07XHJcblxyXG5Nb2RlbC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZShkYXRhLCBkZWVwQ29weSkge1xyXG4gICAgLy8gR2V0IGEgcGxhaW4gb2JqZWN0IHdpdGggdGhlIG9iamVjdCBkYXRhXHJcbiAgICB2YXIgcGxhaW4gPSB0aGlzLnRvUGxhaW5PYmplY3QoZGVlcENvcHkpO1xyXG4gICAgLy8gQ3JlYXRlIGEgbmV3IG1vZGVsIGluc3RhbmNlLCB1c2luZyB0aGUgc291cmNlIHBsYWluIG9iamVjdFxyXG4gICAgLy8gYXMgaW5pdGlhbCB2YWx1ZXNcclxuICAgIHZhciBjbG9uZWQgPSBuZXcgdGhpcy5tb2RlbE9iamVjdC5jb25zdHJ1Y3RvcihwbGFpbik7XHJcbiAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgY2xvbmVkIHdpdGggdGhlIHByb3ZpZGVkIHBsYWluIGRhdGEgdXNlZFxyXG4gICAgICAgIC8vIHRvIHJlcGxhY2UgdmFsdWVzIG9uIHRoZSBjbG9uZWQgb25lLCBmb3IgcXVpY2sgb25lLXN0ZXAgY3JlYXRpb25cclxuICAgICAgICAvLyBvZiBkZXJpdmVkIG9iamVjdHMuXHJcbiAgICAgICAgY2xvbmVkLm1vZGVsLnVwZGF0ZVdpdGgoZGF0YSk7XHJcbiAgICB9XHJcbiAgICAvLyBDbG9uZWQgbW9kZWwgcmVhZHk6XHJcbiAgICByZXR1cm4gY2xvbmVkO1xyXG59O1xyXG4iLCIvKiogUGVyZm9ybWFuY2VTdW1tYXJ5IG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBMaXN0Vmlld0l0ZW0gPSByZXF1aXJlKCcuL0xpc3RWaWV3SXRlbScpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXHJcbiAgICBudW1lcmFsID0gcmVxdWlyZSgnbnVtZXJhbCcpO1xyXG5cclxuZnVuY3Rpb24gUGVyZm9ybWFuY2VTdW1tYXJ5KHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHZhbHVlcyA9IHZhbHVlcyB8fCB7fTtcclxuXHJcbiAgICB0aGlzLmVhcm5pbmdzID0gbmV3IEVhcm5pbmdzKHZhbHVlcy5lYXJuaW5ncyk7XHJcbiAgICBcclxuICAgIHZhciBlYXJuaW5nc0xpbmUgPSBuZXcgTGlzdFZpZXdJdGVtKCk7XHJcbiAgICBlYXJuaW5nc0xpbmUubWFya2VyTGluZTEgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgbnVtID0gbnVtZXJhbCh0aGlzLmN1cnJlbnRBbW91bnQoKSkuZm9ybWF0KCckMCwwJyk7XHJcbiAgICAgICAgcmV0dXJuIG51bTtcclxuICAgIH0sIHRoaXMuZWFybmluZ3MpO1xyXG4gICAgZWFybmluZ3NMaW5lLmNvbnRlbnRMaW5lMSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRDb25jZXB0KCk7XHJcbiAgICB9LCB0aGlzLmVhcm5pbmdzKTtcclxuICAgIGVhcm5pbmdzTGluZS5tYXJrZXJMaW5lMiA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBudW0gPSBudW1lcmFsKHRoaXMubmV4dEFtb3VudCgpKS5mb3JtYXQoJyQwLDAnKTtcclxuICAgICAgICByZXR1cm4gbnVtO1xyXG4gICAgfSwgdGhpcy5lYXJuaW5ncyk7XHJcbiAgICBlYXJuaW5nc0xpbmUuY29udGVudExpbmUyID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dENvbmNlcHQoKTtcclxuICAgIH0sIHRoaXMuZWFybmluZ3MpO1xyXG4gICAgXHJcblxyXG4gICAgdGhpcy50aW1lQm9va2VkID0gbmV3IFRpbWVCb29rZWQodmFsdWVzLnRpbWVCb29rZWQpO1xyXG5cclxuICAgIHZhciB0aW1lQm9va2VkTGluZSA9IG5ldyBMaXN0Vmlld0l0ZW0oKTtcclxuICAgIHRpbWVCb29rZWRMaW5lLm1hcmtlckxpbmUxID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIG51bSA9IG51bWVyYWwodGhpcy5wZXJjZW50KCkpLmZvcm1hdCgnMCUnKTtcclxuICAgICAgICByZXR1cm4gbnVtO1xyXG4gICAgfSwgdGhpcy50aW1lQm9va2VkKTtcclxuICAgIHRpbWVCb29rZWRMaW5lLmNvbnRlbnRMaW5lMSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbmNlcHQoKTtcclxuICAgIH0sIHRoaXMudGltZUJvb2tlZCk7XHJcbiAgICBcclxuICAgIFxyXG4gICAgdGhpcy5pdGVtcyA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcclxuICAgICAgICBcclxuICAgICAgICBpdGVtcy5wdXNoKGVhcm5pbmdzTGluZSk7XHJcbiAgICAgICAgaXRlbXMucHVzaCh0aW1lQm9va2VkTGluZSk7XHJcblxyXG4gICAgICAgIHJldHVybiBpdGVtcztcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBlcmZvcm1hbmNlU3VtbWFyeTtcclxuXHJcbmZ1bmN0aW9uIEVhcm5pbmdzKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgXHJcbiAgICAgICAgIGN1cnJlbnRBbW91bnQ6IDAsXHJcbiAgICAgICAgIGN1cnJlbnRDb25jZXB0VGVtcGxhdGU6ICdhbHJlYWR5IHBhaWQgdGhpcyBtb250aCcsXHJcbiAgICAgICAgIG5leHRBbW91bnQ6IDAsXHJcbiAgICAgICAgIG5leHRDb25jZXB0VGVtcGxhdGU6ICdwcm9qZWN0ZWQge21vbnRofSBlYXJuaW5ncydcclxuXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmN1cnJlbnRDb25jZXB0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgbW9udGggPSBtb21lbnQoKS5mb3JtYXQoJ01NTU0nKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50Q29uY2VwdFRlbXBsYXRlKCkucmVwbGFjZSgvXFx7bW9udGhcXH0vLCBtb250aCk7XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgdGhpcy5uZXh0Q29uY2VwdCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIG1vbnRoID0gbW9tZW50KCkuYWRkKDEsICdtb250aCcpLmZvcm1hdCgnTU1NTScpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5leHRDb25jZXB0VGVtcGxhdGUoKS5yZXBsYWNlKC9cXHttb250aFxcfS8sIG1vbnRoKTtcclxuXHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gVGltZUJvb2tlZCh2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgIFxyXG4gICAgICAgIHBlcmNlbnQ6IDAsXHJcbiAgICAgICAgY29uY2VwdFRlbXBsYXRlOiAnb2YgYXZhaWxhYmxlIHRpbWUgYm9va2VkIGluIHttb250aH0nXHJcbiAgICBcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuY29uY2VwdCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIG1vbnRoID0gbW9tZW50KCkuYWRkKDEsICdtb250aCcpLmZvcm1hdCgnTU1NTScpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbmNlcHRUZW1wbGF0ZSgpLnJlcGxhY2UoL1xce21vbnRoXFx9LywgbW9udGgpO1xyXG5cclxuICAgIH0sIHRoaXMpO1xyXG59XHJcbiIsIi8qKiBQb3NpdGlvbiBtb2RlbC5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBQb3NpdGlvbih2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBwb3NpdGlvbklEOiAwLFxyXG4gICAgICAgIHBvc2l0aW9uU2luZ3VsYXI6ICcnLFxyXG4gICAgICAgIHBvc2l0aW9uUGx1cmFsOiAnJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJycsXHJcbiAgICAgICAgYWN0aXZlOiB0cnVlXHJcblxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQb3NpdGlvbjtcclxuIiwiLyoqXHJcbiAgICBTY2hlZHVsaW5nUHJlZmVyZW5jZXMgbW9kZWwuXHJcbiAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gU2NoZWR1bGluZ1ByZWZlcmVuY2VzKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGFkdmFuY2VUaW1lOiAyNCxcclxuICAgICAgICBiZXR3ZWVuVGltZTogMCxcclxuICAgICAgICBpbmNyZW1lbnRzU2l6ZUluTWludXRlczogMTVcclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2NoZWR1bGluZ1ByZWZlcmVuY2VzO1xyXG4iLCIvKiogU2VydmljZSBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gU2VydmljZSh2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBuYW1lOiAnJyxcclxuICAgICAgICBwcmljZTogMCxcclxuICAgICAgICBkdXJhdGlvbjogMCwgLy8gaW4gbWludXRlc1xyXG4gICAgICAgIGlzQWRkb246IGZhbHNlXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmR1cmF0aW9uVGV4dCA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBtaW51dGVzID0gdGhpcy5kdXJhdGlvbigpIHx8IDA7XHJcbiAgICAgICAgLy8gVE9ETzogRm9ybWF0dGluZywgbG9jYWxpemF0aW9uXHJcbiAgICAgICAgcmV0dXJuIG1pbnV0ZXMgPyBtaW51dGVzICsgJyBtaW51dGVzJyA6ICcnO1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2VydmljZTtcclxuIiwiLyoqXHJcbiAgICBTaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUgbW9kZWwuXHJcbiAgICBcclxuICAgIEl0cyAnc2ltcGxpZmllZCcgYmVjYXVzZSBpdCBwcm92aWRlcyBhbiBBUElcclxuICAgIGZvciBzaW1wbGUgdGltZSByYW5nZSBwZXIgd2VlayBkYXksXHJcbiAgICBhIHBhaXIgb2YgZnJvbS10byB0aW1lcy5cclxuICAgIEdvb2QgZm9yIGN1cnJlbnQgc2ltcGxlIFVJLlxyXG4gICAgXHJcbiAgICBUaGUgb3JpZ2luYWwgd2Vla2x5IHNjaGVkdWxlIGRlZmluZXMgdGhlIHNjaGVkdWxlXHJcbiAgICBpbiAxNSBtaW51dGVzIHNsb3RzLCBzbyBtdWx0aXBsZSB0aW1lIHJhbmdlcyBjYW5cclxuICAgIGV4aXN0cyBwZXIgd2VlayBkYXksIGp1c3QgbWFya2luZyBlYWNoIHNsb3RcclxuICAgIGFzIGF2YWlsYWJsZSBvciB1bmF2YWlsYWJsZS4gVGhlIEFwcE1vZGVsXHJcbiAgICB3aWxsIGZpbGwgdGhpcyBtb2RlbCBpbnN0YW5jZXMgcHJvcGVybHkgbWFraW5nXHJcbiAgICBhbnkgY29udmVyc2lvbiBmcm9tL3RvIHRoZSBzb3VyY2UgZGF0YS5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG4vKipcclxuICAgIFN1Ym1vZGVsIHRoYXQgaXMgdXNlZCBvbiB0aGUgU2ltcGxpZmllZFdlZWtseVNjaGVkdWxlXHJcbiAgICBkZWZpbmluZyBhIHNpbmdsZSB3ZWVrIGRheSBhdmFpbGFiaWxpdHkgcmFuZ2UuXHJcbiAgICBBIGZ1bGwgZGF5IG11c3QgaGF2ZSB2YWx1ZXMgZnJvbTowIHRvOjE0NDAsIG5ldmVyXHJcbiAgICBib3RoIGFzIHplcm8gYmVjYXVzZSB0aGF0cyBjb25zaWRlcmVkIGFzIG5vdCBhdmFpbGFibGUsXHJcbiAgICBzbyBpcyBiZXR0ZXIgdG8gdXNlIHRoZSBpc0FsbERheSBwcm9wZXJ0eS5cclxuKiovXHJcbmZ1bmN0aW9uIFdlZWtEYXlTY2hlZHVsZSh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgLy8gTk9URTogZnJvbS10byBwcm9wZXJpZXMgYXMgbnVtYmVyc1xyXG4gICAgLy8gZm9yIHRoZSBtaW51dGUgb2YgdGhlIGRheSwgZnJvbSAwICgwMDowMCkgdG8gMTQzOSAoMjM6NTkpXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGZyb206IDAsXHJcbiAgICAgICAgdG86IDBcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEl0IGFsbG93cyB0byBrbm93IGlmIHRoaXMgd2VlayBkYXkgaXMgXHJcbiAgICAgICAgZW5hYmxlZCBmb3Igd2Vla2x5IHNjaGVkdWxlLCBqdXN0IGl0XHJcbiAgICAgICAgaGFzIGZyb20tdG8gdGltZXMuXHJcbiAgICAgICAgSXQgYWxsb3dzIHRvIGJlIHNldCBhcyB0cnVlIHB1dHRpbmdcclxuICAgICAgICBhIGRlZmF1bHQgcmFuZ2UgKDlhLTVwKSBvciBmYWxzZSBcclxuICAgICAgICBzZXR0aW5nIGJvdGggYXMgMHAuXHJcbiAgICAqKi9cclxuICAgIHRoaXMuaXNFbmFibGVkID0ga28ucHVyZUNvbXB1dGVkKHtcclxuICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIHR5cGVvZih0aGlzLmZyb20oKSkgPT09ICdudW1iZXInICYmXHJcbiAgICAgICAgICAgICAgICB0eXBlb2YodGhpcy50bygpKSA9PT0gJ251bWJlcicgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMuZnJvbSgpIDwgdGhpcy50bygpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB3cml0ZTogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWwgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIC8vIERlZmF1bHQgcmFuZ2UgOWEgLSA1cFxyXG4gICAgICAgICAgICAgICAgdGhpcy5mcm9tKDkpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50bygxNyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZyb20oMCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvKDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvd25lcjogdGhpc1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMuaXNBbGxEYXkgPSBrby5wdXJlQ29tcHV0ZWQoe1xyXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gIChcclxuICAgICAgICAgICAgICAgIHRoaXMuZnJvbSgpID09PSAwICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvKCkgPT09IDE0NDBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHdyaXRlOiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICAgICAgdGhpcy5mcm9tKDApO1xyXG4gICAgICAgICAgICB0aGlzLnRvKDE0NDApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3duZXI6IHRoaXNcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICAgIE1haW4gbW9kZWwgZGVmaW5pbmcgdGhlIHdlZWsgc2NoZWR1bGVcclxuICAgIHBlciB3ZWVrIGRhdGUsIG9yIGp1c3Qgc2V0IGFsbCBkYXlzIHRpbWVzXHJcbiAgICBhcyBhdmFpbGFibGUgd2l0aCBhIHNpbmdsZSBmbGFnLlxyXG4qKi9cclxuZnVuY3Rpb24gU2ltcGxpZmllZFdlZWtseVNjaGVkdWxlKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHN1bmRheTogbmV3IFdlZWtEYXlTY2hlZHVsZSgpLFxyXG4gICAgICAgIG1vbmRheTogbmV3IFdlZWtEYXlTY2hlZHVsZSgpLFxyXG4gICAgICAgIHR1ZXNkYXk6IG5ldyBXZWVrRGF5U2NoZWR1bGUoKSxcclxuICAgICAgICB3ZWRuZXNkYXk6IG5ldyBXZWVrRGF5U2NoZWR1bGUoKSxcclxuICAgICAgICB0aHVyc2RheTogbmV3IFdlZWtEYXlTY2hlZHVsZSgpLFxyXG4gICAgICAgIGZyaWRheTogbmV3IFdlZWtEYXlTY2hlZHVsZSgpLFxyXG4gICAgICAgIHNhdHVyZGF5OiBuZXcgV2Vla0RheVNjaGVkdWxlKCksXHJcbiAgICAgICAgaXNBbGxUaW1lOiBmYWxzZVxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGU7XHJcbiIsIi8qKiBVcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeSBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgQm9va2luZ1N1bW1hcnkgPSByZXF1aXJlKCcuL0Jvb2tpbmdTdW1tYXJ5Jyk7XHJcblxyXG5mdW5jdGlvbiBVcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeSgpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLnRvZGF5ID0gbmV3IEJvb2tpbmdTdW1tYXJ5KHtcclxuICAgICAgICBjb25jZXB0OiAnbW9yZSB0b2RheScsXHJcbiAgICAgICAgdGltZUZvcm1hdDogJyBbZW5kaW5nIEBdIGg6bW1hJ1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLnRvbW9ycm93ID0gbmV3IEJvb2tpbmdTdW1tYXJ5KHtcclxuICAgICAgICBjb25jZXB0OiAndG9tb3Jyb3cnLFxyXG4gICAgICAgIHRpbWVGb3JtYXQ6ICcgW3N0YXJ0aW5nIEBdIGg6bW1hJ1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLm5leHRXZWVrID0gbmV3IEJvb2tpbmdTdW1tYXJ5KHtcclxuICAgICAgICBjb25jZXB0OiAnbmV4dCB3ZWVrJyxcclxuICAgICAgICB0aW1lRm9ybWF0OiBudWxsXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgdGhpcy5pdGVtcyA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcclxuICAgICAgICBcclxuICAgICAgICAvL2lmICh0aGlzLnRvZGF5LnF1YW50aXR5KCkpXHJcbiAgICAgICAgaXRlbXMucHVzaCh0aGlzLnRvZGF5KTtcclxuICAgICAgICAvL2lmICh0aGlzLnRvbW9ycm93LnF1YW50aXR5KCkpXHJcbiAgICAgICAgaXRlbXMucHVzaCh0aGlzLnRvbW9ycm93KTtcclxuICAgICAgICAvL2lmICh0aGlzLm5leHRXZWVrLnF1YW50aXR5KCkpXHJcbiAgICAgICAgaXRlbXMucHVzaCh0aGlzLm5leHRXZWVrKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGl0ZW1zO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBVcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeTtcclxuIiwiLyoqIFVzZXIgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbi8vIEVudW0gVXNlclR5cGVcclxudmFyIFVzZXJUeXBlID0ge1xyXG4gICAgTm9uZTogMCxcclxuICAgIEFub255bW91czogMSxcclxuICAgIEN1c3RvbWVyOiAyLFxyXG4gICAgRnJlZWxhbmNlcjogNCxcclxuICAgIEFkbWluOiA4LFxyXG4gICAgTG9nZ2VkVXNlcjogMTQsXHJcbiAgICBVc2VyOiAxNSxcclxuICAgIFN5c3RlbTogMTZcclxufTtcclxuXHJcbmZ1bmN0aW9uIFVzZXIodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHVzZXJJRDogMCxcclxuICAgICAgICBlbWFpbDogJycsXHJcbiAgICAgICAgXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnJyxcclxuICAgICAgICBsYXN0TmFtZTogJycsXHJcbiAgICAgICAgc2Vjb25kTGFzdE5hbWU6ICcnLFxyXG4gICAgICAgIGJ1c2luZXNzTmFtZTogJycsXHJcbiAgICAgICAgXHJcbiAgICAgICAgYWx0ZXJuYXRpdmVFbWFpbDogJycsXHJcbiAgICAgICAgcGhvbmU6ICcnLFxyXG4gICAgICAgIGNhblJlY2VpdmVTbXM6ICcnLFxyXG4gICAgICAgIGJpcnRoTW9udGhEYXk6IG51bGwsXHJcbiAgICAgICAgYmlydGhNb250aDogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBpc0ZyZWVsYW5jZXI6IGZhbHNlLFxyXG4gICAgICAgIGlzQ3VzdG9tZXI6IGZhbHNlLFxyXG4gICAgICAgIGlzTWVtYmVyOiBmYWxzZSxcclxuICAgICAgICBpc0FkbWluOiBmYWxzZSxcclxuXHJcbiAgICAgICAgb25ib2FyZGluZ1N0ZXA6IG51bGwsXHJcbiAgICAgICAgYWNjb3VudFN0YXR1c0lEOiAwLFxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBudWxsLFxyXG4gICAgICAgIHVwZGF0ZWREYXRlOiBudWxsXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG5cclxuICAgIHRoaXMuZnVsbE5hbWUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIG5hbWVQYXJ0cyA9IFt0aGlzLmZpcnN0TmFtZSgpXTtcclxuICAgICAgICBpZiAodGhpcy5sYXN0TmFtZSgpKVxyXG4gICAgICAgICAgICBuYW1lUGFydHMucHVzaCh0aGlzLmxhc3ROYW1lKCkpO1xyXG4gICAgICAgIGlmICh0aGlzLnNlY29uZExhc3ROYW1lKCkpXHJcbiAgICAgICAgICAgIG5hbWVQYXJ0cy5wdXNoKHRoaXMuc2Vjb25kTGFzdE5hbWUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBuYW1lUGFydHMuam9pbignICcpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuYmlydGhEYXkgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYmlydGhNb250aERheSgpICYmXHJcbiAgICAgICAgICAgIHRoaXMuYmlydGhNb250aCgpKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBUT0RPIGkxMG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmlydGhNb250aCgpICsgJy8nICsgdGhpcy5iaXJ0aE1vbnRoRGF5KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy51c2VyVHlwZSA9IGtvLnB1cmVDb21wdXRlZCh7XHJcbiAgICAgICAgcmVhZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBjID0gdGhpcy5pc0N1c3RvbWVyKCksXHJcbiAgICAgICAgICAgICAgICBwID0gdGhpcy5pc0ZyZWVsYW5jZXIoKSxcclxuICAgICAgICAgICAgICAgIGEgPSB0aGlzLmlzQWRtaW4oKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciB1c2VyVHlwZSA9IDA7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc0Fub255bW91cygpKVxyXG4gICAgICAgICAgICAgICAgdXNlclR5cGUgPSB1c2VyVHlwZSB8IFVzZXJUeXBlLkFub255bW91cztcclxuICAgICAgICAgICAgaWYgKGMpXHJcbiAgICAgICAgICAgICAgICB1c2VyVHlwZSA9IHVzZXJUeXBlIHwgVXNlclR5cGUuQ3VzdG9tZXI7XHJcbiAgICAgICAgICAgIGlmIChwKVxyXG4gICAgICAgICAgICAgICAgdXNlclR5cGUgPSB1c2VyVHlwZSB8IFVzZXJUeXBlLkZyZWVsYW5jZXI7XHJcbiAgICAgICAgICAgIGlmIChhKVxyXG4gICAgICAgICAgICAgICAgdXNlclR5cGUgPSB1c2VyVHlwZSB8IFVzZXJUeXBlLkFkbWluO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIHVzZXJUeXBlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLyogTk9URTogTm90IHJlcXVpcmVkIGZvciBub3c6XHJcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICB9LCovXHJcbiAgICAgICAgb3duZXI6IHRoaXNcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLmlzQW5vbnltb3VzID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudXNlcklEKCkgPCAxO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEl0IG1hdGNoZXMgYSBVc2VyVHlwZSBmcm9tIHRoZSBlbnVtZXJhdGlvbj9cclxuICAgICoqL1xyXG4gICAgdGhpcy5pc1VzZXJUeXBlID0gZnVuY3Rpb24gaXNVc2VyVHlwZSh0eXBlKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnVzZXJUeXBlKCkgJiB0eXBlKTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBVc2VyO1xyXG5cclxuVXNlci5Vc2VyVHlwZSA9IFVzZXJUeXBlO1xyXG5cclxuLyogQ3JlYXRpbnQgYW4gYW5vbnltb3VzIHVzZXIgd2l0aCBzb21lIHByZXNzZXRzICovXHJcblVzZXIubmV3QW5vbnltb3VzID0gZnVuY3Rpb24gbmV3QW5vbnltb3VzKCkge1xyXG4gICAgcmV0dXJuIG5ldyBVc2VyKHtcclxuICAgICAgICB1c2VySUQ6IDAsXHJcbiAgICAgICAgZW1haWw6ICcnLFxyXG4gICAgICAgIGZpcnN0TmFtZTogJycsXHJcbiAgICAgICAgb25ib2FyZGluZ1N0ZXA6IG51bGxcclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKiogQ2FsZW5kYXIgQXBwb2ludG1lbnRzIHRlc3QgZGF0YSAqKi9cclxudmFyIEFwcG9pbnRtZW50ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0FwcG9pbnRtZW50Jyk7XHJcbnZhciB0ZXN0TG9jYXRpb25zID0gcmVxdWlyZSgnLi9sb2NhdGlvbnMnKS5sb2NhdGlvbnM7XHJcbnZhciB0ZXN0U2VydmljZXMgPSByZXF1aXJlKCcuL3NlcnZpY2VzJykuc2VydmljZXM7XHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbnZhciB0b2RheSA9IG1vbWVudCgpLFxyXG4gICAgdG9tb3Jyb3cgPSBtb21lbnQoKS5hZGQoMSwgJ2RheXMnKSxcclxuICAgIHRvbW9ycm93MTAgPSB0b21vcnJvdy5jbG9uZSgpLmhvdXJzKDEwKS5taW51dGVzKDApLnNlY29uZHMoMCksXHJcbiAgICB0b21vcnJvdzE2ID0gdG9tb3Jyb3cuY2xvbmUoKS5ob3VycygxNikubWludXRlcygzMCkuc2Vjb25kcygwKTtcclxuICAgIFxyXG52YXIgdGVzdERhdGEgPSBbXHJcbiAgICBuZXcgQXBwb2ludG1lbnQoe1xyXG4gICAgICAgIGlkOiAxLFxyXG4gICAgICAgIHN0YXJ0VGltZTogdG9tb3Jyb3cxMCxcclxuICAgICAgICBlbmRUaW1lOiB0b21vcnJvdzE2LFxyXG4gICAgICAgIHN1bW1hcnk6ICdNYXNzYWdlIFRoZXJhcGlzdCBCb29raW5nJyxcclxuICAgICAgICAvL3ByaWNpbmdTdW1tYXJ5OiAnRGVlcCBUaXNzdWUgTWFzc2FnZSAxMjBtIHBsdXMgMiBtb3JlJyxcclxuICAgICAgICBzZXJ2aWNlczogdGVzdFNlcnZpY2VzLFxyXG4gICAgICAgIHB0b3RhbFByaWNlOiA5NS4wLFxyXG4gICAgICAgIGxvY2F0aW9uOiBrby50b0pTKHRlc3RMb2NhdGlvbnNbMF0pLFxyXG4gICAgICAgIHByZU5vdGVzVG9DbGllbnQ6ICdMb29raW5nIGZvcndhcmQgdG8gc2VlaW5nIHRoZSBuZXcgY29sb3InLFxyXG4gICAgICAgIHByZU5vdGVzVG9TZWxmOiAnQXNrIGhpbSBhYm91dCBoaXMgbmV3IGNvbG9yJyxcclxuICAgICAgICBjbGllbnQ6IHtcclxuICAgICAgICAgICAgZmlyc3ROYW1lOiAnSm9zaHVhJyxcclxuICAgICAgICAgICAgbGFzdE5hbWU6ICdEYW5pZWxzb24nXHJcbiAgICAgICAgfVxyXG4gICAgfSksXHJcbiAgICBuZXcgQXBwb2ludG1lbnQoe1xyXG4gICAgICAgIGlkOiAyLFxyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDEsIDEzLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMSwgMTMsIDUwLCAwKSxcclxuICAgICAgICBzdW1tYXJ5OiAnTWFzc2FnZSBUaGVyYXBpc3QgQm9va2luZycsXHJcbiAgICAgICAgLy9wcmljaW5nU3VtbWFyeTogJ0Fub3RoZXIgTWFzc2FnZSA1MG0nLFxyXG4gICAgICAgIHNlcnZpY2VzOiBbdGVzdFNlcnZpY2VzWzBdXSxcclxuICAgICAgICBwdG90YWxQcmljZTogOTUuMCxcclxuICAgICAgICBsb2NhdGlvbjoga28udG9KUyh0ZXN0TG9jYXRpb25zWzFdKSxcclxuICAgICAgICBwcmVOb3Rlc1RvQ2xpZW50OiAnU29tZXRoaW5nIGVsc2UnLFxyXG4gICAgICAgIHByZU5vdGVzVG9TZWxmOiAnUmVtZW1iZXIgdGhhdCB0aGluZycsXHJcbiAgICAgICAgY2xpZW50OiB7XHJcbiAgICAgICAgICAgIGZpcnN0TmFtZTogJ0pvc2h1YScsXHJcbiAgICAgICAgICAgIGxhc3ROYW1lOiAnRGFuaWVsc29uJ1xyXG4gICAgICAgIH1cclxuICAgIH0pLFxyXG4gICAgbmV3IEFwcG9pbnRtZW50KHtcclxuICAgICAgICBpZDogMyxcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxNiwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDEsIDE4LCAwLCAwKSxcclxuICAgICAgICBzdW1tYXJ5OiAnTWFzc2FnZSBUaGVyYXBpc3QgQm9va2luZycsXHJcbiAgICAgICAgLy9wcmljaW5nU3VtbWFyeTogJ1Rpc3N1ZSBNYXNzYWdlIDEyMG0nLFxyXG4gICAgICAgIHNlcnZpY2VzOiBbdGVzdFNlcnZpY2VzWzFdXSxcclxuICAgICAgICBwdG90YWxQcmljZTogOTUuMCxcclxuICAgICAgICBsb2NhdGlvbjoga28udG9KUyh0ZXN0TG9jYXRpb25zWzJdKSxcclxuICAgICAgICBwcmVOb3Rlc1RvQ2xpZW50OiAnJyxcclxuICAgICAgICBwcmVOb3Rlc1RvU2VsZjogJ0FzayBoaW0gYWJvdXQgdGhlIGZvcmdvdHRlbiBub3RlcycsXHJcbiAgICAgICAgY2xpZW50OiB7XHJcbiAgICAgICAgICAgIGZpcnN0TmFtZTogJ0pvc2h1YScsXHJcbiAgICAgICAgICAgIGxhc3ROYW1lOiAnRGFuaWVsc29uJ1xyXG4gICAgICAgIH1cclxuICAgIH0pLFxyXG5dO1xyXG5cclxuZXhwb3J0cy5hcHBvaW50bWVudHMgPSB0ZXN0RGF0YTtcclxuIiwiLyoqIENhbGVuZGFyIFNsb3RzIHRlc3QgZGF0YSAqKi9cclxudmFyIENhbGVuZGFyU2xvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9DYWxlbmRhclNsb3QnKTtcclxuXHJcbnZhciBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG52YXIgdG9kYXkgPSBuZXcgRGF0ZSgpLFxyXG4gICAgdG9tb3Jyb3cgPSBuZXcgRGF0ZSgpO1xyXG50b21vcnJvdy5zZXREYXRlKHRvbW9ycm93LmdldERhdGUoKSArIDEpO1xyXG5cclxudmFyIHN0b2RheSA9IG1vbWVudCh0b2RheSkuZm9ybWF0KCdZWVlZLU1NLUREJyksXHJcbiAgICBzdG9tb3Jyb3cgPSBtb21lbnQodG9tb3Jyb3cpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xyXG5cclxudmFyIHRlc3REYXRhMSA9IFtcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9kYXksIDAsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAxMiwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0ZyZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjIWFwcG9pbnRtZW50LzAnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXN1Y2Nlc3MnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9kYXksIDEyLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b2RheSwgMTMsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdKb3NoIERhbmllbHNvbicsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC8zJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAxMywgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9kYXksIDE1LCAwLCAwKSxcclxuXHJcbiAgICAgICAgc3ViamVjdDogJ0RvIHRoYXQgaW1wb3J0YW50IHRoaW5nJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFldmVudC84JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tbmV3LXdpbmRvdycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAxNSwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9kYXksIDE2LCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnSWFnbyBMb3JlbnpvJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UgTG9uZyBOYW1lJyxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC81JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiAnJDE1OS45MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b2RheSwgMTYsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAwLCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnRnJlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyMhYXBwb2ludG1lbnQvMCcsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctc3VjY2VzcydcclxuICAgIH0pXHJcbl07XHJcbnZhciB0ZXN0RGF0YTIgPSBbXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAwLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgOSwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0ZyZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjIWFwcG9pbnRtZW50LzAnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXN1Y2Nlc3MnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDksIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxMCwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0phcmVuIEZyZWVseScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdEZWVwIFRpc3N1ZSBNYXNzYWdlIExvbmcgTmFtZScsXHJcbiAgICAgICAgbGluazogJyMhYXBwb2ludG1lbnQvMScsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogJyQ1OS45MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTAsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxMSwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0ZyZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjIWFwcG9pbnRtZW50LzAnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXN1Y2Nlc3MnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDExLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTIsIDQ1LCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnQ09ORklSTS1TdXNhbiBEZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgbGluazogJyMhYXBwb2ludG1lbnQvMicsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogJyQ3MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctd2FybmluZydcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTIsIDQ1LCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTYsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC8wJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxNiwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDE3LCAxNSwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ1N1c2FuIERlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC8zJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxNywgMTUsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxOCwgMzAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdEZW50aXN0IGFwcG9pbnRtZW50JyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFldmVudC80JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tbmV3LXdpbmRvdycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxOCwgMzAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxOSwgMzAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdTdXNhbiBEZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRGVlcCBUaXNzdWUgTWFzc2FnZSBMb25nIE5hbWUnLFxyXG4gICAgICAgIGxpbms6ICcjIWFwcG9pbnRtZW50LzUnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6ICckMTU5LjkwJyxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxOSwgMzAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAyMywgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0ZyZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjIWFwcG9pbnRtZW50LzAnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXN1Y2Nlc3MnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDIzLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMCwgMCwgMCksXHJcblxyXG4gICAgICAgIHN1YmplY3Q6ICdKYXJlbiBGcmVlbHknLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgbGluazogJyMhYXBwb2ludG1lbnQvNicsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogJyQ4MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pXHJcbl07XHJcbnZhciB0ZXN0RGF0YUZyZWUgPSBbXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAwLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMCwgMCwgMCksXHJcblxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC8wJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSlcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IHtcclxuICAgICdkZWZhdWx0JzogdGVzdERhdGFGcmVlXHJcbn07XHJcbnRlc3REYXRhW3N0b2RheV0gPSB0ZXN0RGF0YTE7XHJcbnRlc3REYXRhW3N0b21vcnJvd10gPSB0ZXN0RGF0YTI7XHJcblxyXG5leHBvcnRzLmNhbGVuZGFyID0gdGVzdERhdGE7XHJcbiIsIi8qKiBDbGllbnRzIHRlc3QgZGF0YSAqKi9cclxudmFyIENsaWVudCA9IHJlcXVpcmUoJy4uL21vZGVscy9DbGllbnQnKTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IFtcclxuICAgIG5ldyBDbGllbnQgKHtcclxuICAgICAgICBpZDogMSxcclxuICAgICAgICBmaXJzdE5hbWU6ICdKb3NodWEnLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRGFuaWVsc29uJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBpZDogMixcclxuICAgICAgICBmaXJzdE5hbWU6ICdJYWdvJyxcclxuICAgICAgICBsYXN0TmFtZTogJ0xvcmVuem8nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiAzLFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0Zlcm5hbmRvJyxcclxuICAgICAgICBsYXN0TmFtZTogJ0dhZ28nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiA0LFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FkYW0nLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRmluY2gnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiA1LFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FsYW4nLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRmVyZ3Vzb24nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiA2LFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FsZXgnLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnUGVuYSdcclxuICAgIH0pLFxyXG4gICAgbmV3IENsaWVudCh7XHJcbiAgICAgICAgaWQ6IDcsXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnQWxleGlzJyxcclxuICAgICAgICBsYXN0TmFtZTogJ1BlYWNhJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBpZDogOCxcclxuICAgICAgICBmaXJzdE5hbWU6ICdBcnRodXInLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnTWlsbGVyJ1xyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMuY2xpZW50cyA9IHRlc3REYXRhO1xyXG4iLCIvKiogTG9jYXRpb25zIHRlc3QgZGF0YSAqKi9cclxudmFyIExvY2F0aW9uID0gcmVxdWlyZSgnLi4vbW9kZWxzL0xvY2F0aW9uJyk7XHJcblxyXG52YXIgdGVzdERhdGEgPSBbXHJcbiAgICBuZXcgTG9jYXRpb24gKHtcclxuICAgICAgICBsb2NhdGlvbklEOiAxLFxyXG4gICAgICAgIG5hbWU6ICdBY3R2aVNwYWNlJyxcclxuICAgICAgICBhZGRyZXNzTGluZTE6ICczMTUwIDE4dGggU3RyZWV0JyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwMSxcclxuICAgICAgICBpc1NlcnZpY2VSYWRpdXM6IHRydWUsXHJcbiAgICAgICAgc2VydmljZVJhZGl1czogMlxyXG4gICAgfSksXHJcbiAgICBuZXcgTG9jYXRpb24oe1xyXG4gICAgICAgIGxvY2F0aW9uSUQ6IDIsXHJcbiAgICAgICAgbmFtZTogJ0NvcmV5XFwncyBBcHQnLFxyXG4gICAgICAgIGFkZHJlc3NMaW5lMTogJzE4NyBCb2NhbmEgU3QuJyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwMlxyXG4gICAgfSksXHJcbiAgICBuZXcgTG9jYXRpb24oe1xyXG4gICAgICAgIGxvY2F0aW9uSUQ6IDMsXHJcbiAgICAgICAgbmFtZTogJ0pvc2hcXCdhIEFwdCcsXHJcbiAgICAgICAgYWRkcmVzc0xpbmUxOiAnNDI5IENvcmJldHQgQXZlJyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwM1xyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMubG9jYXRpb25zID0gdGVzdERhdGE7XHJcbiIsIi8qKiBJbmJveCB0ZXN0IGRhdGEgKiovXHJcbnZhciBNZXNzYWdlID0gcmVxdWlyZSgnLi4vbW9kZWxzL01lc3NhZ2UnKTtcclxuXHJcbnZhciBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG52YXIgdG9kYXkgPSBuZXcgRGF0ZSgpLFxyXG4gICAgeWVzdGVyZGF5ID0gbmV3IERhdGUoKSxcclxuICAgIGxhc3RXZWVrID0gbmV3IERhdGUoKSxcclxuICAgIG9sZERhdGUgPSBuZXcgRGF0ZSgpO1xyXG55ZXN0ZXJkYXkuc2V0RGF0ZSh5ZXN0ZXJkYXkuZ2V0RGF0ZSgpIC0gMSk7XHJcbmxhc3RXZWVrLnNldERhdGUobGFzdFdlZWsuZ2V0RGF0ZSgpIC0gMik7XHJcbm9sZERhdGUuc2V0RGF0ZShvbGREYXRlLmdldERhdGUoKSAtIDE2KTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IFtcclxuICAgIG5ldyBNZXNzYWdlKHtcclxuICAgICAgICBpZDogMSxcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbmV3IFRpbWUodG9kYXksIDExLCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnQ09ORklSTS1TdXNhbiBEZWUnLFxyXG4gICAgICAgIGNvbnRlbnQ6ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBsaW5rOiAnL2NvbnZlcnNhdGlvbi8xJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiAnJDcwJyxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy13YXJuaW5nJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgTWVzc2FnZSh7XHJcbiAgICAgICAgaWQ6IDMsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG5ldyBUaW1lKHllc3RlcmRheSwgMTMsIDAsIDApLFxyXG5cclxuICAgICAgICBzdWJqZWN0OiAnRG8geW91IGRvIFwiRXhvdGljIE1hc3NhZ2VcIj8nLFxyXG4gICAgICAgIGNvbnRlbnQ6ICdIaSwgSSB3YW50ZWQgdG8ga25vdyBpZiB5b3UgcGVyZm9ybSBhcyBwYXIgb2YgeW91ciBzZXJ2aWNlcy4uLicsXHJcbiAgICAgICAgbGluazogJy9jb252ZXJzYXRpb24vMycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXNoYXJlLWFsdCcsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgTWVzc2FnZSh7XHJcbiAgICAgICAgaWQ6IDIsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG5ldyBUaW1lKGxhc3RXZWVrLCAxMiwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0pvc2ggRGFuaWVsc29uJyxcclxuICAgICAgICBjb250ZW50OiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgbGluazogJy9jb252ZXJzYXRpb24vMicsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IE1lc3NhZ2Uoe1xyXG4gICAgICAgIGlkOiA0LFxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBuZXcgVGltZShvbGREYXRlLCAxNSwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0lucXVpcnknLFxyXG4gICAgICAgIGNvbnRlbnQ6ICdBbm90aGVyIHF1ZXN0aW9uIGZyb20gYW5vdGhlciBjbGllbnQuJyxcclxuICAgICAgICBsaW5rOiAnL2NvbnZlcnNhdGlvbi80JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tc2hhcmUtYWx0JyxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMubWVzc2FnZXMgPSB0ZXN0RGF0YTtcclxuIiwiLyoqIFNlcnZpY2VzIHRlc3QgZGF0YSAqKi9cclxudmFyIFNlcnZpY2UgPSByZXF1aXJlKCcuLi9tb2RlbHMvU2VydmljZScpO1xyXG5cclxudmFyIHRlc3REYXRhID0gW1xyXG4gICAgbmV3IFNlcnZpY2UgKHtcclxuICAgICAgICBuYW1lOiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgcHJpY2U6IDk1LFxyXG4gICAgICAgIGR1cmF0aW9uOiAxMjBcclxuICAgIH0pLFxyXG4gICAgbmV3IFNlcnZpY2Uoe1xyXG4gICAgICAgIG5hbWU6ICdUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgcHJpY2U6IDYwLFxyXG4gICAgICAgIGR1cmF0aW9uOiA2MFxyXG4gICAgfSksXHJcbiAgICBuZXcgU2VydmljZSh7XHJcbiAgICAgICAgbmFtZTogJ1NwZWNpYWwgb2lscycsXHJcbiAgICAgICAgcHJpY2U6IDk1LFxyXG4gICAgICAgIGlzQWRkb246IHRydWVcclxuICAgIH0pLFxyXG4gICAgbmV3IFNlcnZpY2Uoe1xyXG4gICAgICAgIG5hbWU6ICdTb21lIHNlcnZpY2UgZXh0cmEnLFxyXG4gICAgICAgIHByaWNlOiA0MCxcclxuICAgICAgICBkdXJhdGlvbjogMjAsXHJcbiAgICAgICAgaXNBZGRvbjogdHJ1ZVxyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMuc2VydmljZXMgPSB0ZXN0RGF0YTtcclxuIiwiLyoqIFxyXG4gICAgdGltZVNsb3RzXHJcbiAgICB0ZXN0aW5nIGRhdGFcclxuKiovXHJcblxyXG52YXIgVGltZSA9IHJlcXVpcmUoJy4uL3V0aWxzL1RpbWUnKTtcclxuXHJcbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbnZhciB0b2RheSA9IG5ldyBEYXRlKCksXHJcbiAgICB0b21vcnJvdyA9IG5ldyBEYXRlKCk7XHJcbnRvbW9ycm93LnNldERhdGUodG9tb3Jyb3cuZ2V0RGF0ZSgpICsgMSk7XHJcblxyXG52YXIgc3RvZGF5ID0gbW9tZW50KHRvZGF5KS5mb3JtYXQoJ1lZWVktTU0tREQnKSxcclxuICAgIHN0b21vcnJvdyA9IG1vbWVudCh0b21vcnJvdykuZm9ybWF0KCdZWVlZLU1NLUREJyk7XHJcblxyXG52YXIgdGVzdERhdGExID0gW1xyXG4gICAgVGltZSh0b2RheSwgOSwgMTUpLFxyXG4gICAgVGltZSh0b2RheSwgMTEsIDMwKSxcclxuICAgIFRpbWUodG9kYXksIDEyLCAwKSxcclxuICAgIFRpbWUodG9kYXksIDEyLCAzMCksXHJcbiAgICBUaW1lKHRvZGF5LCAxNiwgMTUpLFxyXG4gICAgVGltZSh0b2RheSwgMTgsIDApLFxyXG4gICAgVGltZSh0b2RheSwgMTgsIDMwKSxcclxuICAgIFRpbWUodG9kYXksIDE5LCAwKSxcclxuICAgIFRpbWUodG9kYXksIDE5LCAzMCksXHJcbiAgICBUaW1lKHRvZGF5LCAyMSwgMzApLFxyXG4gICAgVGltZSh0b2RheSwgMjIsIDApXHJcbl07XHJcblxyXG52YXIgdGVzdERhdGEyID0gW1xyXG4gICAgVGltZSh0b21vcnJvdywgOCwgMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMCwgMzApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTEsIDApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTEsIDMwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEyLCAwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEyLCAzMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMywgMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMywgMzApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTQsIDQ1KSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDE2LCAwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDE2LCAzMClcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YUJ1c3kgPSBbXHJcbl07XHJcblxyXG52YXIgdGVzdERhdGEgPSB7XHJcbiAgICAnZGVmYXVsdCc6IHRlc3REYXRhQnVzeVxyXG59O1xyXG50ZXN0RGF0YVtzdG9kYXldID0gdGVzdERhdGExO1xyXG50ZXN0RGF0YVtzdG9tb3Jyb3ddID0gdGVzdERhdGEyO1xyXG5cclxuZXhwb3J0cy50aW1lU2xvdHMgPSB0ZXN0RGF0YTtcclxuIiwiLyoqXHJcbiAgICBVdGlsaXR5IHRvIGhlbHAgdHJhY2sgdGhlIHN0YXRlIG9mIGNhY2hlZCBkYXRhXHJcbiAgICBtYW5hZ2luZyB0aW1lLCBwcmVmZXJlbmNlIGFuZCBpZiBtdXN0IGJlIHJldmFsaWRhdGVkXHJcbiAgICBvciBub3QuXHJcbiAgICBcclxuICAgIEl0cyBqdXN0IG1hbmFnZXMgbWV0YSBkYXRhLCBidXQgbm90IHRoZSBkYXRhIHRvIGJlIGNhY2hlZC5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbmZ1bmN0aW9uIENhY2hlQ29udHJvbChvcHRpb25zKSB7XHJcbiAgICBcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgIC8vIEEgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBvclxyXG4gICAgLy8gQW4gb2JqZWN0IHdpdGggZGVzaXJlZCB1bml0cyBhbmQgYW1vdW50LCBhbGwgb3B0aW9uYWwsXHJcbiAgICAvLyBhbnkgY29tYmluYXRpb24gd2l0aCBhbG1vc3Qgb25lIHNwZWNpZmllZCwgc2FtcGxlOlxyXG4gICAgLy8geyB5ZWFyczogMCwgbW9udGhzOiAwLCB3ZWVrczogMCwgXHJcbiAgICAvLyAgIGRheXM6IDAsIGhvdXJzOiAwLCBtaW51dGVzOiAwLCBzZWNvbmRzOiAwLCBtaWxsaXNlY29uZHM6IDAgfVxyXG4gICAgdGhpcy50dGwgPSBtb21lbnQuZHVyYXRpb24ob3B0aW9ucy50dGwpLmFzTWlsbGlzZWNvbmRzKCk7XHJcbiAgICB0aGlzLmxhdGVzdCA9IG9wdGlvbnMubGF0ZXN0IHx8IG51bGw7XHJcblxyXG4gICAgdGhpcy5tdXN0UmV2YWxpZGF0ZSA9IGZ1bmN0aW9uIG11c3RSZXZhbGlkYXRlKCkge1xyXG4gICAgICAgIHZhciB0ZGlmZiA9IHRoaXMubGF0ZXN0ICYmIG5ldyBEYXRlKCkgLSB0aGlzLmxhdGVzdCB8fCBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XHJcbiAgICAgICAgcmV0dXJuIHRkaWZmID4gdGhpcy50dGw7XHJcbiAgICB9O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENhY2hlQ29udHJvbDtcclxuIiwiLyoqXHJcbiAgICBOZXcgRnVuY3Rpb24gbWV0aG9kOiAnX2RlbGF5ZWQnLlxyXG4gICAgSXQgcmV0dXJucyBhIG5ldyBmdW5jdGlvbiwgd3JhcHBpbmcgdGhlIG9yaWdpbmFsIG9uZSxcclxuICAgIHRoYXQgb25jZSBpdHMgY2FsbCB3aWxsIGRlbGF5IHRoZSBleGVjdXRpb24gdGhlIGdpdmVuIG1pbGxpc2Vjb25kcyxcclxuICAgIHVzaW5nIGEgc2V0VGltZW91dC5cclxuICAgIFRoZSBuZXcgZnVuY3Rpb24gcmV0dXJucyAndW5kZWZpbmVkJyBzaW5jZSBpdCBoYXMgbm90IHRoZSByZXN1bHQsXHJcbiAgICBiZWNhdXNlIG9mIHRoYXQgaXMgb25seSBzdWl0YWJsZSB3aXRoIHJldHVybi1mcmVlIGZ1bmN0aW9ucyBcclxuICAgIGxpa2UgZXZlbnQgaGFuZGxlcnMuXHJcbiAgICBcclxuICAgIFdoeTogc29tZXRpbWVzLCB0aGUgaGFuZGxlciBmb3IgYW4gZXZlbnQgbmVlZHMgdG8gYmUgZXhlY3V0ZWRcclxuICAgIGFmdGVyIGEgZGVsYXkgaW5zdGVhZCBvZiBpbnN0YW50bHkuXHJcbioqL1xyXG5GdW5jdGlvbi5wcm90b3R5cGUuX2RlbGF5ZWQgPSBmdW5jdGlvbiBkZWxheWVkKG1pbGxpc2Vjb25kcykge1xyXG4gICAgdmFyIGZuID0gdGhpcztcclxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgY29udGV4dCA9IHRoaXMsXHJcbiAgICAgICAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZuLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xyXG4gICAgICAgIH0sIG1pbGxpc2Vjb25kcyk7XHJcbiAgICB9O1xyXG59O1xyXG4iLCIvKipcclxuICAgIEV4dGVuZGluZyB0aGUgRnVuY3Rpb24gY2xhc3Mgd2l0aCBhbiBpbmhlcml0cyBtZXRob2QuXHJcbiAgICBcclxuICAgIFRoZSBpbml0aWFsIGxvdyBkYXNoIGlzIHRvIG1hcmsgaXQgYXMgbm8tc3RhbmRhcmQuXHJcbioqL1xyXG5GdW5jdGlvbi5wcm90b3R5cGUuX2luaGVyaXRzID0gZnVuY3Rpb24gX2luaGVyaXRzKHN1cGVyQ3Rvcikge1xyXG4gICAgdGhpcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcjoge1xyXG4gICAgICAgICAgICB2YWx1ZTogdGhpcyxcclxuICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBVdGlsaXR5IHRoYXQgYWxsb3dzIHRvIGtlZXAgYW4gb3JpZ2luYWwgbW9kZWwgdW50b3VjaGVkXHJcbiAgICB3aGlsZSBlZGl0aW5nIGEgdmVyc2lvbiwgaGVscGluZyBzeW5jaHJvbml6ZSBib3RoXHJcbiAgICB3aGVuIGRlc2lyZWQgYnkgcHVzaC9wdWxsL3N5bmMtaW5nLlxyXG4gICAgXHJcbiAgICBJdHMgdGhlIHVzdWFsIHdheSB0byB3b3JrIG9uIGZvcm1zLCB3aGVyZSBhbiBpbiBtZW1vcnlcclxuICAgIG1vZGVsIGNhbiBiZSB1c2VkIGJ1dCBpbiBhIGNvcHkgc28gY2hhbmdlcyBkb2Vzbid0IGFmZmVjdHNcclxuICAgIG90aGVyIHVzZXMgb2YgdGhlIGluLW1lbW9yeSBtb2RlbCAoYW5kIGF2b2lkcyByZW1vdGUgc3luY2luZylcclxuICAgIHVudGlsIHRoZSBjb3B5IHdhbnQgdG8gYmUgcGVyc2lzdGVkIGJ5IHB1c2hpbmcgaXQsIG9yIGJlaW5nXHJcbiAgICBkaXNjYXJkZWQgb3IgcmVmcmVzaGVkIHdpdGggYSByZW1vdGVseSB1cGRhdGVkIG9yaWdpbmFsIG1vZGVsLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcclxuXHJcbmZ1bmN0aW9uIE1vZGVsVmVyc2lvbihvcmlnaW5hbCkge1xyXG4gICAgXHJcbiAgICBFdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5vcmlnaW5hbCA9IG9yaWdpbmFsO1xyXG4gICAgXHJcbiAgICAvLyBDcmVhdGUgdmVyc2lvblxyXG4gICAgLy8gKHVwZGF0ZVdpdGggdGFrZXMgY2FyZSB0byBzZXQgdGhlIHNhbWUgZGF0YVRpbWVzdGFtcClcclxuICAgIHRoaXMudmVyc2lvbiA9IG9yaWdpbmFsLm1vZGVsLmNsb25lKCk7XHJcbiAgICBcclxuICAgIC8vIENvbXB1dGVkIHRoYXQgdGVzdCBlcXVhbGl0eSwgYWxsb3dpbmcgYmVpbmcgbm90aWZpZWQgb2YgY2hhbmdlc1xyXG4gICAgLy8gQSByYXRlTGltaXQgaXMgdXNlZCBvbiBlYWNoIHRvIGF2b2lkIHNldmVyYWwgc3luY3Job25vdXMgbm90aWZpY2F0aW9ucy5cclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgUmV0dXJucyB0cnVlIHdoZW4gYm90aCB2ZXJzaW9ucyBoYXMgdGhlIHNhbWUgdGltZXN0YW1wXHJcbiAgICAqKi9cclxuICAgIHRoaXMuYXJlRGlmZmVyZW50ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uIGFyZURpZmZlcmVudCgpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLm9yaWdpbmFsLm1vZGVsLmRhdGFUaW1lc3RhbXAoKSAhPT0gXHJcbiAgICAgICAgICAgIHRoaXMudmVyc2lvbi5tb2RlbC5kYXRhVGltZXN0YW1wKClcclxuICAgICAgICApO1xyXG4gICAgfSwgdGhpcykuZXh0ZW5kKHsgcmF0ZUxpbWl0OiAwIH0pO1xyXG4gICAgLyoqXHJcbiAgICAgICAgUmV0dXJucyB0cnVlIHdoZW4gdGhlIHZlcnNpb24gaGFzIG5ld2VyIGNoYW5nZXMgdGhhblxyXG4gICAgICAgIHRoZSBvcmlnaW5hbFxyXG4gICAgKiovXHJcbiAgICB0aGlzLmlzTmV3ZXIgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24gaXNOZXdlcigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLm9yaWdpbmFsLm1vZGVsLmRhdGFUaW1lc3RhbXAoKSA8IFxyXG4gICAgICAgICAgICB0aGlzLnZlcnNpb24ubW9kZWwuZGF0YVRpbWVzdGFtcCgpXHJcbiAgICAgICAgKTtcclxuICAgIH0sIHRoaXMpLmV4dGVuZCh7IHJhdGVMaW1pdDogMCB9KTtcclxuICAgIC8qKlxyXG4gICAgICAgIFJldHVybnMgdHJ1ZSB3aGVuIHRoZSB2ZXJzaW9uIGhhcyBvbGRlciBjaGFuZ2VzIHRoYW5cclxuICAgICAgICB0aGUgb3JpZ2luYWxcclxuICAgICoqL1xyXG4gICAgdGhpcy5pc09ic29sZXRlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uIGlzQ29tcHV0ZWQoKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5vcmlnaW5hbC5tb2RlbC5kYXRhVGltZXN0YW1wKCkgPiBcclxuICAgICAgICAgICAgdGhpcy52ZXJzaW9uLm1vZGVsLmRhdGFUaW1lc3RhbXAoKVxyXG4gICAgICAgICk7XHJcbiAgICB9LCB0aGlzKS5leHRlbmQoeyByYXRlTGltaXQ6IDAgfSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTW9kZWxWZXJzaW9uO1xyXG5cclxuTW9kZWxWZXJzaW9uLl9pbmhlcml0cyhFdmVudEVtaXR0ZXIpO1xyXG5cclxuLyoqXHJcbiAgICBTZW5kcyB0aGUgdmVyc2lvbiBjaGFuZ2VzIHRvIHRoZSBvcmlnaW5hbFxyXG4gICAgXHJcbiAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgZXZlbklmTmV3ZXI6IGZhbHNlXHJcbiAgICB9XHJcbioqL1xyXG5Nb2RlbFZlcnNpb24ucHJvdG90eXBlLnB1bGwgPSBmdW5jdGlvbiBwdWxsKG9wdGlvbnMpIHtcclxuXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIFxyXG4gICAgLy8gQnkgZGVmYXVsdCwgbm90aGluZyB0byBkbywgb3IgYXZvaWQgb3ZlcndyaXRlIGNoYW5nZXMuXHJcbiAgICB2YXIgcmVzdWx0ID0gZmFsc2U7XHJcbiAgICBcclxuICAgIGlmIChvcHRpb25zLmV2ZW5JZk5ld2VyIHx8ICF0aGlzLmlzTmV3ZXIoKSkge1xyXG4gICAgICAgIC8vIFVwZGF0ZSB2ZXJzaW9uLCBnZXR0aW5nIG9yaWdpbmFsXHJcbiAgICAgICAgLy8gKHVwZGF0ZVdpdGggdGFrZXMgY2FyZSB0byBzZXQgdGhlIHNhbWUgZGF0YVRpbWVzdGFtcClcclxuICAgICAgICB0aGlzLnZlcnNpb24ubW9kZWwudXBkYXRlV2l0aCh0aGlzLm9yaWdpbmFsKTtcclxuICAgICAgICAvLyBEb25lXHJcbiAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdGhpcy5lbWl0KCdwdWxsJywgcmVzdWx0KTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG4vKipcclxuICAgIERpc2NhcmQgdGhlIHZlcnNpb24gY2hhbmdlcyBnZXR0aW5nIHRoZSBvcmlnaW5hbFxyXG4gICAgZGF0YS5cclxuICAgIFxyXG4gICAgb3B0aW9uczoge1xyXG4gICAgICAgIGV2ZW5JZk9ic29sZXRlOiBmYWxzZVxyXG4gICAgfVxyXG4qKi9cclxuTW9kZWxWZXJzaW9uLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gcHVzaChvcHRpb25zKSB7XHJcbiAgICBcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgXHJcbiAgICAvLyBCeSBkZWZhdWx0LCBub3RoaW5nIHRvIGRvLCBvciBhdm9pZCBvdmVyd3JpdGUgY2hhbmdlcy5cclxuICAgIHZhciByZXN1bHQgPSBmYWxzZTtcclxuICAgIFxyXG4gICAgaWYgKG9wdGlvbnMuZXZlbklmT2Jzb2xldGUgfHwgIXRoaXMuaXNPYnNvbGV0ZSgpKSB7XHJcbiAgICAgICAgLy8gVXBkYXRlIG9yaWdpbmFsXHJcbiAgICAgICAgLy8gKHVwZGF0ZVdpdGggdGFrZXMgY2FyZSB0byBzZXQgdGhlIHNhbWUgZGF0YVRpbWVzdGFtcClcclxuICAgICAgICB0aGlzLm9yaWdpbmFsLm1vZGVsLnVwZGF0ZVdpdGgodGhpcy52ZXJzaW9uKTtcclxuICAgICAgICAvLyBEb25lXHJcbiAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdGhpcy5lbWl0KCdwdXNoJywgcmVzdWx0KTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG4vKipcclxuICAgIFNldHMgb3JpZ2luYWwgYW5kIHZlcnNpb24gb24gdGhlIHNhbWUgdmVyc2lvblxyXG4gICAgYnkgZ2V0dGluZyB0aGUgbmV3ZXN0IG9uZS5cclxuKiovXHJcbk1vZGVsVmVyc2lvbi5wcm90b3R5cGUuc3luYyA9IGZ1bmN0aW9uIHN5bmMoKSB7XHJcbiAgICBcclxuICAgIGlmICh0aGlzLmlzTmV3ZXIoKSlcclxuICAgICAgICByZXR1cm4gdGhpcy5wdXNoKCk7XHJcbiAgICBlbHNlIGlmICh0aGlzLmlzT2Jzb2xldGUoKSlcclxuICAgICAgICByZXR1cm4gdGhpcy5wdWxsKCk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG59O1xyXG4iLCIvKipcclxuICAgIFJlbW90ZU1vZGVsIGNsYXNzLlxyXG4gICAgXHJcbiAgICBJdCBoZWxwcyBtYW5hZ2luZyBhIG1vZGVsIGluc3RhbmNlLCBtb2RlbCB2ZXJzaW9uc1xyXG4gICAgZm9yIGluIG1lbW9yeSBtb2RpZmljYXRpb24sIGFuZCB0aGUgcHJvY2VzcyB0byBcclxuICAgIHJlY2VpdmUgb3Igc2VuZCB0aGUgbW9kZWwgZGF0YVxyXG4gICAgdG8gYSByZW1vdGUgc291cmNlcywgd2l0aCBnbHVlIGNvZGUgZm9yIHRoZSB0YXNrc1xyXG4gICAgYW5kIHN0YXRlIHByb3BlcnRpZXMuXHJcbiAgICBcclxuICAgIEV2ZXJ5IGluc3RhbmNlIG9yIHN1YmNsYXNzIG11c3QgaW1wbGVtZW50XHJcbiAgICB0aGUgZmV0Y2ggYW5kIHB1bGwgbWV0aG9kcyB0aGF0IGtub3dzIHRoZSBzcGVjaWZpY3NcclxuICAgIG9mIHRoZSByZW1vdGVzLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIE1vZGVsVmVyc2lvbiA9IHJlcXVpcmUoJy4uL3V0aWxzL01vZGVsVmVyc2lvbicpLFxyXG4gICAgQ2FjaGVDb250cm9sID0gcmVxdWlyZSgnLi4vdXRpbHMvQ2FjaGVDb250cm9sJyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcblxyXG5mdW5jdGlvbiBSZW1vdGVNb2RlbChvcHRpb25zKSB7XHJcblxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICBcclxuICAgIHZhciBmaXJzdFRpbWVMb2FkID0gdHJ1ZTtcclxuICAgIFxyXG4gICAgLy8gTWFya3MgYSBsb2NrIGxvYWRpbmcgaXMgaGFwcGVuaW5nLCBhbnkgdXNlciBjb2RlXHJcbiAgICAvLyBtdXN0IHdhaXQgZm9yIGl0XHJcbiAgICB0aGlzLmlzTG9hZGluZyA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgLy8gTWFya3MgYSBsb2NrIHNhdmluZyBpcyBoYXBwZW5pbmcsIGFueSB1c2VyIGNvZGVcclxuICAgIC8vIG11c3Qgd2FpdCBmb3IgaXRcclxuICAgIHRoaXMuaXNTYXZpbmcgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuICAgIC8vIE1hcmtzIGEgYmFja2dyb3VuZCBzeW5jaHJvbml6YXRpb246IGxvYWQgb3Igc2F2ZSxcclxuICAgIC8vIHVzZXIgY29kZSBrbm93cyBpcyBoYXBwZW5pbmcgYnV0IGNhbiBjb250aW51ZVxyXG4gICAgLy8gdXNpbmcgY2FjaGVkIGRhdGFcclxuICAgIHRoaXMuaXNTeW5jaW5nID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcbiAgICAvLyBVdGlsaXR5IHRvIGtub3cgd2hldGhlciBhbnkgbG9ja2luZyBvcGVyYXRpb24gaXNcclxuICAgIC8vIGhhcHBlbmluZy5cclxuICAgIC8vIEp1c3QgbG9hZGluZyBvciBzYXZpbmdcclxuICAgIHRoaXMuaXNMb2NrZWQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5pc0xvYWRpbmcoKSB8fCB0aGlzLmlzU2F2aW5nKCk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgaWYgKCFvcHRpb25zLmRhdGEpXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZW1vdGVNb2RlbCBkYXRhIG11c3QgYmUgc2V0IG9uIGNvbnN0cnVjdG9yIGFuZCBubyBjaGFuZ2VkIGxhdGVyJyk7XHJcbiAgICB0aGlzLmRhdGEgPSBvcHRpb25zLmRhdGE7XHJcbiAgICBcclxuICAgIHRoaXMuY2FjaGUgPSBuZXcgQ2FjaGVDb250cm9sKHtcclxuICAgICAgICB0dGw6IG9wdGlvbnMudHRsXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gUmVjb21tZW5kZWQgd2F5IHRvIGdldCB0aGUgaW5zdGFuY2UgZGF0YVxyXG4gICAgLy8gc2luY2UgaXQgZW5zdXJlcyB0byBsYXVuY2ggYSBsb2FkIG9mIHRoZVxyXG4gICAgLy8gZGF0YSBlYWNoIHRpbWUgaXMgYWNjZXNzZWQgdGhpcyB3YXkuXHJcbiAgICB0aGlzLmdldERhdGEgPSBmdW5jdGlvbiBnZXREYXRhKCkge1xyXG4gICAgICAgIHRoaXMubG9hZCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGE7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMubmV3VmVyc2lvbiA9IGZ1bmN0aW9uIG5ld1ZlcnNpb24oKSB7XHJcbiAgICAgICAgdmFyIHYgPSBuZXcgTW9kZWxWZXJzaW9uKHRoaXMuZGF0YSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVXBkYXRlIHRoZSB2ZXJzaW9uIGRhdGEgd2l0aCB0aGUgb3JpZ2luYWxcclxuICAgICAgICAvLyBhZnRlciBhIGxvY2sgbG9hZCBmaW5pc2gsIGxpa2UgdGhlIGZpcnN0IHRpbWUsXHJcbiAgICAgICAgLy8gc2luY2UgdGhlIFVJIHRvIGVkaXQgdGhlIHZlcnNpb24gd2lsbCBiZSBsb2NrXHJcbiAgICAgICAgLy8gaW4gdGhlIG1pZGRsZS5cclxuICAgICAgICB0aGlzLmlzTG9hZGluZy5zdWJzY3JpYmUoZnVuY3Rpb24gKGlzSXQpIHtcclxuICAgICAgICAgICAgaWYgKCFpc0l0KSB7XHJcbiAgICAgICAgICAgICAgICB2LnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFNhdmUgdGhlIHJlbW90ZSB3aGVuIHN1Y2Nlc3NmdWxseSBwdXNoZWQgdGhlIG5ldyB2ZXJzaW9uXHJcbiAgICAgICAgdi5vbigncHVzaCcsIGZ1bmN0aW9uKHN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgaWYgKHN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2F2ZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdjtcclxuICAgIH07XHJcbiAgICBcclxuICAgIHRoaXMuZmV0Y2ggPSBvcHRpb25zLmZldGNoIHx8IGZ1bmN0aW9uIGZldGNoKCkgeyB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCcpOyB9O1xyXG4gICAgdGhpcy5wdXNoID0gb3B0aW9ucy5wdXNoIHx8IGZ1bmN0aW9uIHB1c2goKSB7IHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGQnKTsgfTtcclxuXHJcbiAgICB0aGlzLmxvYWQgPSBmdW5jdGlvbiBsb2FkKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmNhY2hlLm11c3RSZXZhbGlkYXRlKCkpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChmaXJzdFRpbWVMb2FkKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcodHJ1ZSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNTeW5jaW5nKHRydWUpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHByb21pc2UgPSB0aGlzLmZldGNoKClcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHNlcnZlckRhdGEpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5tb2RlbC51cGRhdGVXaXRoKHNlcnZlckRhdGEpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc1N5bmNpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jYWNoZS5sYXRlc3QgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF0YTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIEZpcnN0IHRpbWUsIGJsb2NraW5nIGxvYWQ6XHJcbiAgICAgICAgICAgIC8vIGl0IHJldHVybnMgd2hlbiB0aGUgbG9hZCByZXR1cm5zXHJcbiAgICAgICAgICAgIGlmIChmaXJzdFRpbWVMb2FkKSB7XHJcbiAgICAgICAgICAgICAgICBmaXJzdFRpbWVMb2FkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIEJhY2tncm91bmQgbG9hZDogaXMgbG9hZGluZyBzdGlsbFxyXG4gICAgICAgICAgICAgICAgLy8gYnV0IHdlIGhhdmUgY2FjaGVkIGRhdGEgc28gd2UgdXNlXHJcbiAgICAgICAgICAgICAgICAvLyB0aGF0IGZvciBub3cuIElmIGFueXRoaW5nIG5ldyBmcm9tIG91dHNpZGVcclxuICAgICAgICAgICAgICAgIC8vIHZlcnNpb25zIHdpbGwgZ2V0IG5vdGlmaWVkIHdpdGggaXNPYnNvbGV0ZSgpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFJldHVybiBjYWNoZWQgZGF0YSwgbm8gbmVlZCB0byBsb2FkIGFnYWluIGZvciBub3cuXHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5kYXRhKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICAgICAgdGhpcy5pc1NhdmluZyh0cnVlKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBQcmVzZXJ2ZSB0aGUgdGltZXN0YW1wIGFmdGVyIGJlaW5nIHNhdmVkXHJcbiAgICAgICAgLy8gdG8gYXZvaWQgZmFsc2UgJ29ic29sZXRlJyB3YXJuaW5ncyB3aXRoXHJcbiAgICAgICAgLy8gdGhlIHZlcnNpb24gdGhhdCBjcmVhdGVkIHRoZSBuZXcgb3JpZ2luYWxcclxuICAgICAgICB2YXIgdHMgPSB0aGlzLmRhdGEubW9kZWwuZGF0YVRpbWVzdGFtcCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLnB1c2goKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChzZXJ2ZXJEYXRhKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5tb2RlbC51cGRhdGVXaXRoKHNlcnZlckRhdGEpO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEubW9kZWwuZGF0YVRpbWVzdGFtcCh0cyk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmlzU2F2aW5nKGZhbHNlKTtcclxuICAgICAgICAgICAgdGhpcy5jYWNoZS5sYXRlc3QgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kYXRhO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICB9O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlbW90ZU1vZGVsO1xyXG4iLCIvKipcclxuICAgIFJFU1QgQVBJIGFjY2Vzc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZnVuY3Rpb24gbG93ZXJGaXJzdExldHRlcihuKSB7XHJcbiAgICByZXR1cm4gbiAmJiBuWzBdICYmIG5bMF0udG9Mb3dlckNhc2UgJiYgKG5bMF0udG9Mb3dlckNhc2UoKSArIG4uc2xpY2UoMSkpIHx8IG47XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGxvd2VyQ2FtZWxpemVPYmplY3Qob2JqKSB7XHJcbiAgICAvL2pzaGludCBtYXhjb21wbGV4aXR5OjhcclxuICAgIFxyXG4gICAgaWYgKCFvYmogfHwgdHlwZW9mKG9iaikgIT09ICdvYmplY3QnKSByZXR1cm4gb2JqO1xyXG5cclxuICAgIHZhciByZXQgPSBBcnJheS5pc0FycmF5KG9iaikgPyBbXSA6IHt9O1xyXG4gICAgZm9yKHZhciBrIGluIG9iaikge1xyXG4gICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoaykpIHtcclxuICAgICAgICAgICAgdmFyIG5ld2sgPSBsb3dlckZpcnN0TGV0dGVyKGspO1xyXG4gICAgICAgICAgICByZXRbbmV3a10gPSB0eXBlb2Yob2JqW2tdKSA9PT0gJ29iamVjdCcgP1xyXG4gICAgICAgICAgICAgICAgbG93ZXJDYW1lbGl6ZU9iamVjdChvYmpba10pIDpcclxuICAgICAgICAgICAgICAgIG9ialtrXVxyXG4gICAgICAgICAgICA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJldDtcclxufVxyXG5cclxuZnVuY3Rpb24gUmVzdChvcHRpb25zT3JVcmwpIHtcclxuICAgIFxyXG4gICAgdmFyIHVybCA9IHR5cGVvZihvcHRpb25zT3JVcmwpID09PSAnc3RyaW5nJyA/XHJcbiAgICAgICAgb3B0aW9uc09yVXJsIDpcclxuICAgICAgICBvcHRpb25zT3JVcmwgJiYgb3B0aW9uc09yVXJsLnVybDtcclxuXHJcbiAgICB0aGlzLmJhc2VVcmwgPSB1cmw7XHJcbiAgICAvLyBPcHRpb25hbCBleHRyYUhlYWRlcnMgZm9yIGFsbCByZXF1ZXN0cyxcclxuICAgIC8vIHVzdWFsbHkgZm9yIGF1dGhlbnRpY2F0aW9uIHRva2Vuc1xyXG4gICAgdGhpcy5leHRyYUhlYWRlcnMgPSBudWxsO1xyXG59XHJcblxyXG5SZXN0LnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiBnZXQoYXBpVXJsLCBkYXRhKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KGFwaVVybCwgJ2dldCcsIGRhdGEpO1xyXG59O1xyXG5cclxuUmVzdC5wcm90b3R5cGUucHV0ID0gZnVuY3Rpb24gZ2V0KGFwaVVybCwgZGF0YSkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChhcGlVcmwsICdwdXQnLCBkYXRhKTtcclxufTtcclxuXHJcblJlc3QucHJvdG90eXBlLnBvc3QgPSBmdW5jdGlvbiBnZXQoYXBpVXJsLCBkYXRhKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KGFwaVVybCwgJ3Bvc3QnLCBkYXRhKTtcclxufTtcclxuXHJcblJlc3QucHJvdG90eXBlLmRlbGV0ZSA9IGZ1bmN0aW9uIGdldChhcGlVcmwsIGRhdGEpIHtcclxuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoYXBpVXJsLCAnZGVsZXRlJywgZGF0YSk7XHJcbn07XHJcblxyXG5SZXN0LnByb3RvdHlwZS5wdXRGaWxlID0gZnVuY3Rpb24gcHV0RmlsZShhcGlVcmwsIGRhdGEpIHtcclxuICAgIC8vIE5PVEUgYmFzaWMgcHV0RmlsZSBpbXBsZW1lbnRhdGlvbiwgb25lIGZpbGUsIHVzZSBmaWxlVXBsb2FkP1xyXG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChhcGlVcmwsICdkZWxldGUnLCBkYXRhLCAnbXVsdGlwYXJ0L2Zvcm0tZGF0YScpO1xyXG59O1xyXG5cclxuUmVzdC5wcm90b3R5cGUucmVxdWVzdCA9IGZ1bmN0aW9uIHJlcXVlc3QoYXBpVXJsLCBodHRwTWV0aG9kLCBkYXRhLCBjb250ZW50VHlwZSkge1xyXG4gICAgXHJcbiAgICB2YXIgdGhpc1Jlc3QgPSB0aGlzO1xyXG4gICAgdmFyIHVybCA9IHRoaXMuYmFzZVVybCArIGFwaVVybDtcclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCQuYWpheCh7XHJcbiAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgLy8gQXZvaWQgY2FjaGUgZm9yIGRhdGEuXHJcbiAgICAgICAgY2FjaGU6IGZhbHNlLFxyXG4gICAgICAgIGRhdGFUeXBlOiAnanNvbicsXHJcbiAgICAgICAgbWV0aG9kOiBodHRwTWV0aG9kLFxyXG4gICAgICAgIGhlYWRlcnM6IHRoaXMuZXh0cmFIZWFkZXJzLFxyXG4gICAgICAgIC8vIFVSTEVOQ09ERUQgaW5wdXQ6XHJcbiAgICAgICAgLy8gQ29udmVydCB0byBKU09OIGFuZCBiYWNrIGp1c3QgdG8gZW5zdXJlIHRoZSB2YWx1ZXMgYXJlIGNvbnZlcnRlZC9lbmNvZGVkXHJcbiAgICAgICAgLy8gcHJvcGVybHkgdG8gYmUgc2VudCwgbGlrZSBEYXRlcyBiZWluZyBjb252ZXJ0ZWQgdG8gSVNPIGZvcm1hdC5cclxuICAgICAgICBkYXRhOiBkYXRhICYmIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZGF0YSkpLFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiBjb250ZW50VHlwZSB8fCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ1xyXG4gICAgICAgIC8vIEFsdGVybmF0ZTogSlNPTiBhcyBpbnB1dFxyXG4gICAgICAgIC8vZGF0YTogSlNPTi5zdHJpbmdpZnkoZGF0YSksXHJcbiAgICAgICAgLy9jb250ZW50VHlwZTogY29udGVudFR5cGUgfHwgJ2FwcGxpY2F0aW9uL2pzb24nXHJcbiAgICB9KSlcclxuICAgIC50aGVuKGxvd2VyQ2FtZWxpemVPYmplY3QpXHJcbiAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgLy8gT24gYXV0aG9yaXphdGlvbiBlcnJvciwgZ2l2ZSBvcG9ydHVuaXR5IHRvIHJldHJ5IHRoZSBvcGVyYXRpb25cclxuICAgICAgICBpZiAoZXJyLnN0YXR1cyA9PT0gNDAxKSB7XHJcbiAgICAgICAgICAgIHZhciByZXRyeSA9IHJlcXVlc3QuYmluZCh0aGlzLCBhcGlVcmwsIGh0dHBNZXRob2QsIGRhdGEsIGNvbnRlbnRUeXBlKTtcclxuICAgICAgICAgICAgdmFyIHJldHJ5UHJvbWlzZSA9IHRoaXNSZXN0Lm9uQXV0aG9yaXphdGlvblJlcXVpcmVkKHJldHJ5KTtcclxuICAgICAgICAgICAgaWYgKHJldHJ5UHJvbWlzZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSXQgcmV0dXJuZWQgc29tZXRoaW5nLCBleHBlY3RpbmcgaXMgYSBwcm9taXNlOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXRyeVByb21pc2UpXHJcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgICAgICAvLyBUaGVyZSBpcyBlcnJvciBvbiByZXRyeSwganVzdCByZXR1cm4gdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gb3JpZ2luYWwgY2FsbCBlcnJvclxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnI7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBieSBkZWZhdWx0LCBjb250aW51ZSBwcm9wYWdhdGluZyB0aGUgZXJyb3JcclxuICAgICAgICByZXR1cm4gZXJyO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG5SZXN0LnByb3RvdHlwZS5vbkF1dGhvcml6YXRpb25SZXF1aXJlZCA9IGZ1bmN0aW9uIG9uQXV0aG9yaXphdGlvblJlcXVpcmVkKHJldHJ5KSB7XHJcbiAgICAvLyBUbyBiZSBpbXBsZW1lbnRlZCBvdXRzaWRlLCBieSBkZWZhdWx0IGRvbid0IHdhaXRcclxuICAgIC8vIGZvciByZXRyeSwganVzdCByZXR1cm4gbm90aGluZzpcclxuICAgIHJldHVybjtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVzdDtcclxuIiwiLyoqXHJcbiAgICBUaW1lIGNsYXNzIHV0aWxpdHkuXHJcbiAgICBTaG9ydGVyIHdheSB0byBjcmVhdGUgYSBEYXRlIGluc3RhbmNlXHJcbiAgICBzcGVjaWZ5aW5nIG9ubHkgdGhlIFRpbWUgcGFydCxcclxuICAgIGRlZmF1bHRpbmcgdG8gY3VycmVudCBkYXRlIG9yIFxyXG4gICAgYW5vdGhlciByZWFkeSBkYXRlIGluc3RhbmNlLlxyXG4qKi9cclxuZnVuY3Rpb24gVGltZShkYXRlLCBob3VyLCBtaW51dGUsIHNlY29uZCkge1xyXG4gICAgaWYgKCEoZGF0ZSBpbnN0YW5jZW9mIERhdGUpKSB7XHJcbiBcclxuICAgICAgICBzZWNvbmQgPSBtaW51dGU7XHJcbiAgICAgICAgbWludXRlID0gaG91cjtcclxuICAgICAgICBob3VyID0gZGF0ZTtcclxuICAgICAgICBcclxuICAgICAgICBkYXRlID0gbmV3IERhdGUoKTsgICBcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IERhdGUoZGF0ZS5nZXRGdWxsWWVhcigpLCBkYXRlLmdldE1vbnRoKCksIGRhdGUuZ2V0RGF0ZSgpLCBob3VyIHx8IDAsIG1pbnV0ZSB8fCAwLCBzZWNvbmQgfHwgMCk7XHJcbn1cclxubW9kdWxlLmV4cG9ydHMgPSBUaW1lO1xyXG4iLCIvKipcclxuICAgIENyZWF0ZSBhbiBBY2Nlc3MgQ29udHJvbCBmb3IgYW4gYXBwIHRoYXQganVzdCBjaGVja3NcclxuICAgIHRoZSBhY3Rpdml0eSBwcm9wZXJ0eSBmb3IgYWxsb3dlZCB1c2VyIGxldmVsLlxyXG4gICAgVG8gYmUgcHJvdmlkZWQgdG8gU2hlbGwuanMgYW5kIHVzZWQgYnkgdGhlIGFwcC5qcyxcclxuICAgIHZlcnkgdGllZCB0byB0aGF0IGJvdGggY2xhc3Nlcy5cclxuICAgIFxyXG4gICAgQWN0aXZpdGllcyBjYW4gZGVmaW5lIG9uIGl0cyBvYmplY3QgYW4gYWNjZXNzTGV2ZWxcclxuICAgIHByb3BlcnR5IGxpa2UgbmV4dCBleGFtcGxlc1xyXG4gICAgXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJ0eXBlLlVzZXI7IC8vIGFueW9uZVxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Bbm9ueW1vdXM7IC8vIGFub255bW91cyB1c2VycyBvbmx5XHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7IC8vIGF1dGhlbnRpY2F0ZWQgdXNlcnMgb25seVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy8gVXNlclR5cGUgZW51bWVyYXRpb24gaXMgYml0IGJhc2VkLCBzbyBzZXZlcmFsXHJcbi8vIHVzZXJzIGNhbiBoYXMgYWNjZXNzIGluIGEgc2luZ2xlIHByb3BlcnR5XHJcbnZhciBVc2VyVHlwZSA9IHJlcXVpcmUoJy4uL21vZGVscy9Vc2VyJykuVXNlclR5cGU7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZUFjY2Vzc0NvbnRyb2woYXBwKSB7XHJcbiAgICBcclxuICAgIHJldHVybiBmdW5jdGlvbiBhY2Nlc3NDb250cm9sKHJvdXRlKSB7XHJcblxyXG4gICAgICAgIHZhciBhY3Rpdml0eSA9IGFwcC5nZXRBY3Rpdml0eUNvbnRyb2xsZXJCeVJvdXRlKHJvdXRlKTtcclxuXHJcbiAgICAgICAgdmFyIHVzZXIgPSBhcHAubW9kZWwudXNlcigpO1xyXG4gICAgICAgIHZhciBjdXJyZW50VHlwZSA9IHVzZXIgJiYgdXNlci51c2VyVHlwZSgpO1xyXG5cclxuICAgICAgICBpZiAoYWN0aXZpdHkgJiYgYWN0aXZpdHkuYWNjZXNzTGV2ZWwpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBjYW4gPSBhY3Rpdml0eS5hY2Nlc3NMZXZlbCAmIGN1cnJlbnRUeXBlO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKCFjYW4pIHtcclxuICAgICAgICAgICAgICAgIC8vIE5vdGlmeSBlcnJvciwgd2h5IGNhbm5vdCBhY2Nlc3NcclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWRMZXZlbDogYWN0aXZpdHkuYWNjZXNzTGV2ZWwsXHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFR5cGU6IGN1cnJlbnRUeXBlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBBbGxvd1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfTtcclxufTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIHVud3JhcCA9IGZ1bmN0aW9uIHVud3JhcCh2YWx1ZSkge1xyXG4gICAgcmV0dXJuICh0eXBlb2YodmFsdWUpID09PSAnZnVuY3Rpb24nID8gdmFsdWUoKSA6IHZhbHVlKTtcclxufTtcclxuXHJcbmV4cG9ydHMuZGVmaW5lQ3J1ZEFwaUZvclJlc3QgPSBmdW5jdGlvbiBkZWZpbmVDcnVkQXBpRm9yUmVzdChzZXR0aW5ncykge1xyXG4gICAgXHJcbiAgICB2YXIgZXh0ZW5kZWRPYmplY3QgPSBzZXR0aW5ncy5leHRlbmRlZE9iamVjdCxcclxuICAgICAgICBNb2RlbCA9IHNldHRpbmdzLk1vZGVsLFxyXG4gICAgICAgIG1vZGVsTmFtZSA9IHNldHRpbmdzLm1vZGVsTmFtZSxcclxuICAgICAgICBtb2RlbExpc3ROYW1lID0gc2V0dGluZ3MubW9kZWxMaXN0TmFtZSxcclxuICAgICAgICBtb2RlbFVybCA9IHNldHRpbmdzLm1vZGVsVXJsLFxyXG4gICAgICAgIGlkUHJvcGVydHlOYW1lID0gc2V0dGluZ3MuaWRQcm9wZXJ0eU5hbWU7XHJcblxyXG4gICAgZXh0ZW5kZWRPYmplY3RbJ2dldCcgKyBtb2RlbExpc3ROYW1lXSA9IGZ1bmN0aW9uIGdldExpc3QoZmlsdGVycykge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLnJlc3QuZ2V0KG1vZGVsVXJsLCBmaWx0ZXJzKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJhd0l0ZW1zKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByYXdJdGVtcyAmJiByYXdJdGVtcy5tYXAoZnVuY3Rpb24ocmF3SXRlbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBNb2RlbChyYXdJdGVtKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBleHRlbmRlZE9iamVjdFsnZ2V0JyArIG1vZGVsTmFtZV0gPSBmdW5jdGlvbiBnZXRJdGVtKGl0ZW1JRCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLnJlc3QuZ2V0KG1vZGVsVXJsICsgJy8nICsgaXRlbUlEKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJhd0l0ZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJhd0l0ZW0gJiYgbmV3IE1vZGVsKHJhd0l0ZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBleHRlbmRlZE9iamVjdFsncG9zdCcgKyBtb2RlbE5hbWVdID0gZnVuY3Rpb24gcG9zdEl0ZW0oYW5JdGVtKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5wb3N0KG1vZGVsVXJsLCBhbkl0ZW0pXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oc2VydmVySXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IE1vZGVsKHNlcnZlckl0ZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBleHRlbmRlZE9iamVjdFsncHV0JyArIG1vZGVsTmFtZV0gPSBmdW5jdGlvbiBwdXRJdGVtKGFuSXRlbSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlc3QucHV0KG1vZGVsVXJsICsgJy8nICsgdW53cmFwKGFuSXRlbVtpZFByb3BlcnR5TmFtZV0pLCBhbkl0ZW0pXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oc2VydmVySXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IE1vZGVsKHNlcnZlckl0ZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgZXh0ZW5kZWRPYmplY3RbJ3NldCcgKyBtb2RlbE5hbWVdID0gZnVuY3Rpb24gc2V0SXRlbShhbkl0ZW0pIHtcclxuICAgICAgICB2YXIgaWQgPSB1bndyYXAoYW5JdGVtW2lkUHJvcGVydHlOYW1lXSk7XHJcbiAgICAgICAgaWYgKGlkKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1sncHV0JyArIG1vZGVsTmFtZV0oYW5JdGVtKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzWydwb3N0JyArIG1vZGVsTmFtZV0oYW5JdGVtKTtcclxuICAgIH07XHJcblxyXG4gICAgZXh0ZW5kZWRPYmplY3RbJ2RlbCcgKyBtb2RlbE5hbWVdID0gZnVuY3Rpb24gZGVsSXRlbShhbkl0ZW0pIHtcclxuICAgICAgICB2YXIgaWQgPSBhbkl0ZW0gJiYgdW53cmFwKGFuSXRlbVtpZFByb3BlcnR5TmFtZV0pIHx8XHJcbiAgICAgICAgICAgICAgICBhbkl0ZW07XHJcbiAgICAgICAgaWYgKGlkKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXN0LmRlbGV0ZShtb2RlbFVybCArICcvJyArIGlkLCBhbkl0ZW0pXHJcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGRlbGV0ZWRJdGVtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVsZXRlZEl0ZW0gJiYgbmV3IE1vZGVsKGRlbGV0ZWRJdGVtKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05lZWQgYW4gSUQgb3IgYW4gb2JqZWN0IHdpdGggdGhlIElEIHByb3BlcnR5IHRvIGRlbGV0ZScpO1xyXG4gICAgfTtcclxufTsiLCIvKipcclxuICAgIEJvb3Rrbm9jazogU2V0IG9mIEtub2Nrb3V0IEJpbmRpbmcgSGVscGVycyBmb3IgQm9vdHN0cmFwIGpzIGNvbXBvbmVudHMgKGpxdWVyeSBwbHVnaW5zKVxyXG4gICAgXHJcbiAgICBEZXBlbmRlbmNpZXM6IGpxdWVyeVxyXG4gICAgSW5qZWN0ZWQgZGVwZW5kZW5jaWVzOiBrbm9ja291dFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy8gRGVwZW5kZW5jaWVzXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbi8vIERJIGkxOG4gbGlicmFyeVxyXG5leHBvcnRzLmkxOG4gPSBudWxsO1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlSGVscGVycyhrbykge1xyXG4gICAgdmFyIGhlbHBlcnMgPSB7fTtcclxuXHJcbiAgICAvKiogUG9wb3ZlciBCaW5kaW5nICoqL1xyXG4gICAgaGVscGVycy5wb3BvdmVyID0ge1xyXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24oZWxlbWVudCwgdmFsdWVBY2Nlc3NvciwgYWxsQmluZGluZ3MpIHtcclxuICAgICAgICAgICAgdmFyIHNyY09wdGlvbnMgPSBrby51bndyYXAodmFsdWVBY2Nlc3NvcigpKTtcclxuXHJcbiAgICAgICAgICAgIC8vIER1cGxpY2F0aW5nIG9wdGlvbnMgb2JqZWN0IHRvIHBhc3MgdG8gcG9wb3ZlciB3aXRob3V0XHJcbiAgICAgICAgICAgIC8vIG92ZXJ3cml0dG5nIHNvdXJjZSBjb25maWd1cmF0aW9uXHJcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNyY09wdGlvbnMpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVW53cmFwcGluZyBjb250ZW50IHRleHRcclxuICAgICAgICAgICAgb3B0aW9ucy5jb250ZW50ID0ga28udW53cmFwKHNyY09wdGlvbnMuY29udGVudCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jb250ZW50KSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gTG9jYWxpemU6XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zLmNvbnRlbnQgPSBcclxuICAgICAgICAgICAgICAgICAgICBleHBvcnRzLmkxOG4gJiYgZXhwb3J0cy5pMThuLnQob3B0aW9ucy5jb250ZW50KSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuY29udGVudDtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gVG8gZ2V0IHRoZSBuZXcgb3B0aW9ucywgd2UgbmVlZCBkZXN0cm95IGl0IGZpcnN0OlxyXG4gICAgICAgICAgICAgICAgJChlbGVtZW50KS5wb3BvdmVyKCdkZXN0cm95JykucG9wb3ZlcihvcHRpb25zKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBTZSBtdWVzdHJhIHNpIGVsIGVsZW1lbnRvIHRpZW5lIGVsIGZvY29cclxuICAgICAgICAgICAgICAgIGlmICgkKGVsZW1lbnQpLmlzKCc6Zm9jdXMnKSlcclxuICAgICAgICAgICAgICAgICAgICAkKGVsZW1lbnQpLnBvcG92ZXIoJ3Nob3cnKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkKGVsZW1lbnQpLnBvcG92ZXIoJ2Rlc3Ryb3knKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBcclxuICAgIHJldHVybiBoZWxwZXJzO1xyXG59XHJcblxyXG4vKipcclxuICAgIFBsdWcgaGVscGVycyBpbiB0aGUgcHJvdmlkZWQgS25vY2tvdXQgaW5zdGFuY2VcclxuKiovXHJcbmZ1bmN0aW9uIHBsdWdJbihrbywgcHJlZml4KSB7XHJcbiAgICB2YXIgbmFtZSxcclxuICAgICAgICBoZWxwZXJzID0gY3JlYXRlSGVscGVycyhrbyk7XHJcbiAgICBcclxuICAgIGZvcih2YXIgaCBpbiBoZWxwZXJzKSB7XHJcbiAgICAgICAgaWYgKGhlbHBlcnMuaGFzT3duUHJvcGVydHkgJiYgIWhlbHBlcnMuaGFzT3duUHJvcGVydHkoaCkpXHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICBuYW1lID0gcHJlZml4ID8gcHJlZml4ICsgaFswXS50b1VwcGVyQ2FzZSgpICsgaC5zbGljZSgxKSA6IGg7XHJcbiAgICAgICAga28uYmluZGluZ0hhbmRsZXJzW25hbWVdID0gaGVscGVyc1toXTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0cy5wbHVnSW4gPSBwbHVnSW47XHJcbmV4cG9ydHMuY3JlYXRlQmluZGluZ0hlbHBlcnMgPSBjcmVhdGVIZWxwZXJzO1xyXG4iLCIvKipcclxuICAgIEVzcGFjZSBhIHN0cmluZyBmb3IgdXNlIG9uIGEgUmVnRXhwLlxyXG4gICAgVXN1YWxseSwgdG8gbG9vayBmb3IgYSBzdHJpbmcgaW4gYSB0ZXh0IG11bHRpcGxlIHRpbWVzXHJcbiAgICBvciB3aXRoIHNvbWUgZXhwcmVzc2lvbnMsIHNvbWUgY29tbW9uIGFyZSBcclxuICAgIGxvb2sgZm9yIGEgdGV4dCAnaW4gdGhlIGJlZ2lubmluZycgKF4pXHJcbiAgICBvciAnYXQgdGhlIGVuZCcgKCQpLlxyXG4gICAgXHJcbiAgICBBdXRob3I6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS91c2Vycy8xNTEzMTIvY29vbGFqODYgYW5kIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS91c2Vycy85NDEwL2FyaXN0b3RsZS1wYWdhbHR6aXNcclxuICAgIExpbms6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzY5Njk0ODZcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbi8vIFJlZmVycmluZyB0byB0aGUgdGFibGUgaGVyZTpcclxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvcmVnZXhwXHJcbi8vIHRoZXNlIGNoYXJhY3RlcnMgc2hvdWxkIGJlIGVzY2FwZWRcclxuLy8gXFwgXiAkICogKyA/IC4gKCApIHwgeyB9IFsgXVxyXG4vLyBUaGVzZSBjaGFyYWN0ZXJzIG9ubHkgaGF2ZSBzcGVjaWFsIG1lYW5pbmcgaW5zaWRlIG9mIGJyYWNrZXRzXHJcbi8vIHRoZXkgZG8gbm90IG5lZWQgdG8gYmUgZXNjYXBlZCwgYnV0IHRoZXkgTUFZIGJlIGVzY2FwZWRcclxuLy8gd2l0aG91dCBhbnkgYWR2ZXJzZSBlZmZlY3RzICh0byB0aGUgYmVzdCBvZiBteSBrbm93bGVkZ2UgYW5kIGNhc3VhbCB0ZXN0aW5nKVxyXG4vLyA6ICEgLCA9IFxyXG4vLyBteSB0ZXN0IFwifiFAIyQlXiYqKCl7fVtdYC89PytcXHwtXzs6J1xcXCIsPC4+XCIubWF0Y2goL1tcXCNdL2cpXHJcblxyXG52YXIgc3BlY2lhbHMgPSBbXHJcbiAgICAvLyBvcmRlciBtYXR0ZXJzIGZvciB0aGVzZVxyXG4gICAgICBcIi1cIlxyXG4gICAgLCBcIltcIlxyXG4gICAgLCBcIl1cIlxyXG4gICAgLy8gb3JkZXIgZG9lc24ndCBtYXR0ZXIgZm9yIGFueSBvZiB0aGVzZVxyXG4gICAgLCBcIi9cIlxyXG4gICAgLCBcIntcIlxyXG4gICAgLCBcIn1cIlxyXG4gICAgLCBcIihcIlxyXG4gICAgLCBcIilcIlxyXG4gICAgLCBcIipcIlxyXG4gICAgLCBcIitcIlxyXG4gICAgLCBcIj9cIlxyXG4gICAgLCBcIi5cIlxyXG4gICAgLCBcIlxcXFxcIlxyXG4gICAgLCBcIl5cIlxyXG4gICAgLCBcIiRcIlxyXG4gICAgLCBcInxcIlxyXG4gIF1cclxuXHJcbiAgLy8gSSBjaG9vc2UgdG8gZXNjYXBlIGV2ZXJ5IGNoYXJhY3RlciB3aXRoICdcXCdcclxuICAvLyBldmVuIHRob3VnaCBvbmx5IHNvbWUgc3RyaWN0bHkgcmVxdWlyZSBpdCB3aGVuIGluc2lkZSBvZiBbXVxyXG4sIHJlZ2V4ID0gUmVnRXhwKCdbJyArIHNwZWNpYWxzLmpvaW4oJ1xcXFwnKSArICddJywgJ2cnKVxyXG47XHJcblxyXG52YXIgZXNjYXBlUmVnRXhwID0gZnVuY3Rpb24gKHN0cikge1xyXG5yZXR1cm4gc3RyLnJlcGxhY2UocmVnZXgsIFwiXFxcXCQmXCIpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBlc2NhcGVSZWdFeHA7XHJcblxyXG4vLyB0ZXN0IGVzY2FwZVJlZ0V4cChcIi9wYXRoL3RvL3Jlcz9zZWFyY2g9dGhpcy50aGF0XCIpXHJcbiIsIi8qKlxyXG4qIGVzY2FwZVNlbGVjdG9yXHJcbipcclxuKiBzb3VyY2U6IGh0dHA6Ly9ranZhcmdhLmJsb2dzcG90LmNvbS5lcy8yMDA5LzA2L2pxdWVyeS1wbHVnaW4tdG8tZXNjYXBlLWNzcy1zZWxlY3Rvci5odG1sXHJcbipcclxuKiBFc2NhcGUgYWxsIHNwZWNpYWwgalF1ZXJ5IENTUyBzZWxlY3RvciBjaGFyYWN0ZXJzIGluICpzZWxlY3RvciouXHJcbiogVXNlZnVsIHdoZW4geW91IGhhdmUgYSBjbGFzcyBvciBpZCB3aGljaCBjb250YWlucyBzcGVjaWFsIGNoYXJhY3RlcnNcclxuKiB3aGljaCB5b3UgbmVlZCB0byBpbmNsdWRlIGluIGEgc2VsZWN0b3IuXHJcbiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBzcGVjaWFscyA9IFtcclxuICAnIycsICcmJywgJ34nLCAnPScsICc+JywgXHJcbiAgXCInXCIsICc6JywgJ1wiJywgJyEnLCAnOycsICcsJ1xyXG5dO1xyXG52YXIgcmVnZXhTcGVjaWFscyA9IFtcclxuICAnLicsICcqJywgJysnLCAnfCcsICdbJywgJ10nLCAnKCcsICcpJywgJy8nLCAnXicsICckJ1xyXG5dO1xyXG52YXIgc1JFID0gbmV3IFJlZ0V4cChcclxuICAnKCcgKyBzcGVjaWFscy5qb2luKCd8JykgKyAnfFxcXFwnICsgcmVnZXhTcGVjaWFscy5qb2luKCd8XFxcXCcpICsgJyknLCAnZydcclxuKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICByZXR1cm4gc2VsZWN0b3IucmVwbGFjZShzUkUsICdcXFxcJDEnKTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBSZWFkIGEgcGFnZSdzIEdFVCBVUkwgdmFyaWFibGVzIGFuZCByZXR1cm4gdGhlbSBhcyBhbiBhc3NvY2lhdGl2ZSBhcnJheS5cclxuKiovXHJcbid1c2VyIHN0cmljdCc7XHJcbi8vZ2xvYmFsIHdpbmRvd1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZXRVcmxRdWVyeSh1cmwpIHtcclxuXHJcbiAgICB1cmwgPSB1cmwgfHwgd2luZG93LmxvY2F0aW9uLmhyZWY7XHJcblxyXG4gICAgdmFyIHZhcnMgPSBbXSwgaGFzaCxcclxuICAgICAgICBxdWVyeUluZGV4ID0gdXJsLmluZGV4T2YoJz8nKTtcclxuICAgIGlmIChxdWVyeUluZGV4ID4gLTEpIHtcclxuICAgICAgICB2YXIgaGFzaGVzID0gdXJsLnNsaWNlKHF1ZXJ5SW5kZXggKyAxKS5zcGxpdCgnJicpO1xyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBoYXNoZXMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBoYXNoID0gaGFzaGVzW2ldLnNwbGl0KCc9Jyk7XHJcbiAgICAgICAgICAgIHZhcnMucHVzaChoYXNoWzBdKTtcclxuICAgICAgICAgICAgdmFyc1toYXNoWzBdXSA9IGhhc2hbMV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhcnM7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgU2V0IG9mIHV0aWxpdGllcyB0byBkZWZpbmUgSmF2YXNjcmlwdCBQcm9wZXJ0aWVzXHJcbiAgICBpbmRlcGVuZGVudGx5IG9mIHRoZSBicm93c2VyLlxyXG4gICAgXHJcbiAgICBBbGxvd3MgdG8gZGVmaW5lIGdldHRlcnMgYW5kIHNldHRlcnMuXHJcbiAgICBcclxuICAgIEFkYXB0ZWQgY29kZSBmcm9tIHRoZSBvcmlnaW5hbCBjcmVhdGVkIGJ5IEplZmYgV2FsZGVuXHJcbiAgICBodHRwOi8vd2hlcmVzd2FsZGVuLmNvbS8yMDEwLzA0LzE2L21vcmUtc3BpZGVybW9ua2V5LWNoYW5nZXMtYW5jaWVudC1lc290ZXJpYy12ZXJ5LXJhcmVseS11c2VkLXN5bnRheC1mb3ItY3JlYXRpbmctZ2V0dGVycy1hbmQtc2V0dGVycy1pcy1iZWluZy1yZW1vdmVkL1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gYWNjZXNzb3JEZXNjcmlwdG9yKGZpZWxkLCBmdW4pXHJcbntcclxuICAgIHZhciBkZXNjID0geyBlbnVtZXJhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfTtcclxuICAgIGRlc2NbZmllbGRdID0gZnVuO1xyXG4gICAgcmV0dXJuIGRlc2M7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRlZmluZUdldHRlcihvYmosIHByb3AsIGdldClcclxue1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSlcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgcHJvcCwgYWNjZXNzb3JEZXNjcmlwdG9yKFwiZ2V0XCIsIGdldCkpO1xyXG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuX19kZWZpbmVHZXR0ZXJfXylcclxuICAgICAgICByZXR1cm4gb2JqLl9fZGVmaW5lR2V0dGVyX18ocHJvcCwgZ2V0KTtcclxuXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgZ2V0dGVyc1wiKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZGVmaW5lU2V0dGVyKG9iaiwgcHJvcCwgc2V0KVxyXG57XHJcbiAgICBpZiAoT2JqZWN0LmRlZmluZVByb3BlcnR5KVxyXG4gICAgICAgIHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBwcm9wLCBhY2Nlc3NvckRlc2NyaXB0b3IoXCJzZXRcIiwgc2V0KSk7XHJcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5fX2RlZmluZVNldHRlcl9fKVxyXG4gICAgICAgIHJldHVybiBvYmouX19kZWZpbmVTZXR0ZXJfXyhwcm9wLCBzZXQpO1xyXG5cclxuICAgIHRocm93IG5ldyBFcnJvcihcImJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBzZXR0ZXJzXCIpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGRlZmluZUdldHRlcjogZGVmaW5lR2V0dGVyLFxyXG4gICAgZGVmaW5lU2V0dGVyOiBkZWZpbmVTZXR0ZXJcclxufTtcclxuIiwiLyoqXHJcbiAgICBEb21JdGVtc01hbmFnZXIgY2xhc3MsIHRoYXQgbWFuYWdlIGEgY29sbGVjdGlvbiBcclxuICAgIG9mIEhUTUwvRE9NIGl0ZW1zIHVuZGVyIGEgcm9vdC9jb250YWluZXIsIHdoZXJlXHJcbiAgICBvbmx5IG9uZSBlbGVtZW50IGF0IHRoZSB0aW1lIGlzIHZpc2libGUsIHByb3ZpZGluZ1xyXG4gICAgdG9vbHMgdG8gdW5pcXVlcmx5IGlkZW50aWZ5IHRoZSBpdGVtcyxcclxuICAgIHRvIGNyZWF0ZSBvciB1cGRhdGUgbmV3IGl0ZW1zICh0aHJvdWdoICdpbmplY3QnKSxcclxuICAgIGdldCB0aGUgY3VycmVudCwgZmluZCBieSB0aGUgSUQgYW5kIG1vcmUuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgZXNjYXBlU2VsZWN0b3IgPSByZXF1aXJlKCcuLi9lc2NhcGVTZWxlY3RvcicpO1xyXG5cclxuZnVuY3Rpb24gRG9tSXRlbXNNYW5hZ2VyKHNldHRpbmdzKSB7XHJcblxyXG4gICAgdGhpcy5pZEF0dHJpYnV0ZU5hbWUgPSBzZXR0aW5ncy5pZEF0dHJpYnV0ZU5hbWUgfHwgJ2lkJztcclxuICAgIHRoaXMuYWxsb3dEdXBsaWNhdGVzID0gISFzZXR0aW5ncy5hbGxvd0R1cGxpY2F0ZXMgfHwgZmFsc2U7XHJcbiAgICB0aGlzLiRyb290ID0gbnVsbDtcclxuICAgIC8vIE9uIHBhZ2UgcmVhZHksIGdldCB0aGUgcm9vdCBlbGVtZW50OlxyXG4gICAgJChmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLiRyb290ID0gJChzZXR0aW5ncy5yb290IHx8ICdib2R5Jyk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IERvbUl0ZW1zTWFuYWdlcjtcclxuXHJcbkRvbUl0ZW1zTWFuYWdlci5wcm90b3R5cGUuZmluZCA9IGZ1bmN0aW9uIGZpbmQoY29udGFpbmVyTmFtZSwgcm9vdCkge1xyXG4gICAgdmFyICRyb290ID0gJChyb290IHx8IHRoaXMuJHJvb3QpO1xyXG4gICAgcmV0dXJuICRyb290LmZpbmQoJ1snICsgdGhpcy5pZEF0dHJpYnV0ZU5hbWUgKyAnPVwiJyArIGVzY2FwZVNlbGVjdG9yKGNvbnRhaW5lck5hbWUpICsgJ1wiXScpO1xyXG59O1xyXG5cclxuRG9tSXRlbXNNYW5hZ2VyLnByb3RvdHlwZS5nZXRBY3RpdmUgPSBmdW5jdGlvbiBnZXRBY3RpdmUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy4kcm9vdC5maW5kKCdbJyArIHRoaXMuaWRBdHRyaWJ1dGVOYW1lICsgJ106dmlzaWJsZScpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBJdCBhZGRzIHRoZSBpdGVtIGluIHRoZSBodG1sIHByb3ZpZGVkIChjYW4gYmUgb25seSB0aGUgZWxlbWVudCBvciBcclxuICAgIGNvbnRhaW5lZCBpbiBhbm90aGVyIG9yIGEgZnVsbCBodG1sIHBhZ2UpLlxyXG4gICAgUmVwbGFjZXMgYW55IGV4aXN0YW50IGlmIGR1cGxpY2F0ZXMgYXJlIG5vdCBhbGxvd2VkLlxyXG4qKi9cclxuRG9tSXRlbXNNYW5hZ2VyLnByb3RvdHlwZS5pbmplY3QgPSBmdW5jdGlvbiBpbmplY3QobmFtZSwgaHRtbCkge1xyXG5cclxuICAgIC8vIEZpbHRlcmluZyBpbnB1dCBodG1sIChjYW4gYmUgcGFydGlhbCBvciBmdWxsIHBhZ2VzKVxyXG4gICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTI4NDg3OThcclxuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoL15bXFxzXFxTXSo8Ym9keS4qPz58PFxcL2JvZHk+W1xcc1xcU10qJC9nLCAnJyk7XHJcblxyXG4gICAgLy8gQ3JlYXRpbmcgYSB3cmFwcGVyIGFyb3VuZCB0aGUgaHRtbFxyXG4gICAgLy8gKGNhbiBiZSBwcm92aWRlZCB0aGUgaW5uZXJIdG1sIG9yIG91dGVySHRtbCwgZG9lc24ndCBtYXR0ZXJzIHdpdGggbmV4dCBhcHByb2FjaClcclxuICAgIHZhciAkaHRtbCA9ICQoJzxkaXYvPicsIHsgaHRtbDogaHRtbCB9KSxcclxuICAgICAgICAvLyBXZSBsb29rIGZvciB0aGUgY29udGFpbmVyIGVsZW1lbnQgKHdoZW4gdGhlIG91dGVySHRtbCBpcyBwcm92aWRlZClcclxuICAgICAgICAkYyA9IHRoaXMuZmluZChuYW1lLCAkaHRtbCk7XHJcblxyXG4gICAgaWYgKCRjLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIC8vIEl0cyBpbm5lckh0bWwsIHNvIHRoZSB3cmFwcGVyIGJlY29tZXMgdGhlIGNvbnRhaW5lciBpdHNlbGZcclxuICAgICAgICAkYyA9ICRodG1sLmF0dHIodGhpcy5pZEF0dHJpYnV0ZU5hbWUsIG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5hbGxvd0R1cGxpY2F0ZXMpIHtcclxuICAgICAgICAvLyBObyBtb3JlIHRoYW4gb25lIGNvbnRhaW5lciBpbnN0YW5jZSBjYW4gZXhpc3RzIGF0IHRoZSBzYW1lIHRpbWVcclxuICAgICAgICAvLyBXZSBsb29rIGZvciBhbnkgZXhpc3RlbnQgb25lIGFuZCBpdHMgcmVwbGFjZWQgd2l0aCB0aGUgbmV3XHJcbiAgICAgICAgdmFyICRwcmV2ID0gdGhpcy5maW5kKG5hbWUpO1xyXG4gICAgICAgIGlmICgkcHJldi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICRwcmV2LnJlcGxhY2VXaXRoKCRjKTtcclxuICAgICAgICAgICAgJGMgPSAkcHJldjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWRkIHRvIHRoZSBkb2N1bWVudFxyXG4gICAgLy8gKG9uIHRoZSBjYXNlIG9mIGR1cGxpY2F0ZWQgZm91bmQsIHRoaXMgd2lsbCBkbyBub3RoaW5nLCBubyB3b3JyeSlcclxuICAgICRjLmFwcGVuZFRvKHRoaXMuJHJvb3QpO1xyXG59O1xyXG5cclxuLyoqIFxyXG4gICAgVGhlIHN3aXRjaCBtZXRob2QgcmVjZWl2ZSB0aGUgaXRlbXMgdG8gaW50ZXJjaGFuZ2UgYXMgYWN0aXZlIG9yIGN1cnJlbnQsXHJcbiAgICB0aGUgJ2Zyb20nIGFuZCAndG8nLCBhbmQgdGhlIHNoZWxsIGluc3RhbmNlIHRoYXQgTVVTVCBiZSB1c2VkXHJcbiAgICB0byBub3RpZnkgZWFjaCBldmVudCB0aGF0IGludm9sdmVzIHRoZSBpdGVtOlxyXG4gICAgd2lsbENsb3NlLCB3aWxsT3BlbiwgcmVhZHksIG9wZW5lZCwgY2xvc2VkLlxyXG4gICAgSXQgcmVjZWl2ZXMgYXMgbGF0ZXN0IHBhcmFtZXRlciB0aGUgJ25vdGlmaWNhdGlvbicgb2JqZWN0IHRoYXQgbXVzdCBiZVxyXG4gICAgcGFzc2VkIHdpdGggdGhlIGV2ZW50IHNvIGhhbmRsZXJzIGhhcyBjb250ZXh0IHN0YXRlIGluZm9ybWF0aW9uLlxyXG4gICAgXHJcbiAgICBJdCdzIGRlc2lnbmVkIHRvIGJlIGFibGUgdG8gbWFuYWdlIHRyYW5zaXRpb25zLCBidXQgdGhpcyBkZWZhdWx0XHJcbiAgICBpbXBsZW1lbnRhdGlvbiBpcyBhcyBzaW1wbGUgYXMgJ3Nob3cgdGhlIG5ldyBhbmQgaGlkZSB0aGUgb2xkJy5cclxuKiovXHJcbkRvbUl0ZW1zTWFuYWdlci5wcm90b3R5cGUuc3dpdGNoID0gZnVuY3Rpb24gc3dpdGNoQWN0aXZlSXRlbSgkZnJvbSwgJHRvLCBzaGVsbCwgbm90aWZpY2F0aW9uKSB7XHJcblxyXG4gICAgaWYgKCEkdG8uaXMoJzp2aXNpYmxlJykpIHtcclxuICAgICAgICBzaGVsbC5lbWl0KHNoZWxsLmV2ZW50cy53aWxsT3BlbiwgJHRvLCBub3RpZmljYXRpb24pO1xyXG4gICAgICAgICR0by5zaG93KCk7XHJcbiAgICAgICAgLy8gSXRzIGVub3VnaCB2aXNpYmxlIGFuZCBpbiBET00gdG8gcGVyZm9ybSBpbml0aWFsaXphdGlvbiB0YXNrc1xyXG4gICAgICAgIC8vIHRoYXQgbWF5IGludm9sdmUgbGF5b3V0IGluZm9ybWF0aW9uXHJcbiAgICAgICAgc2hlbGwuZW1pdChzaGVsbC5ldmVudHMuaXRlbVJlYWR5LCAkdG8sIG5vdGlmaWNhdGlvbik7XHJcbiAgICAgICAgLy8gV2hlbiBpdHMgY29tcGxldGVseSBvcGVuZWRcclxuICAgICAgICBzaGVsbC5lbWl0KHNoZWxsLmV2ZW50cy5vcGVuZWQsICR0bywgbm90aWZpY2F0aW9uKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gSXRzIHJlYWR5OyBtYXliZSBpdCB3YXMgYnV0IHN1Yi1sb2NhdGlvblxyXG4gICAgICAgIC8vIG9yIHN0YXRlIGNoYW5nZSBuZWVkIHRvIGJlIGNvbW11bmljYXRlZFxyXG4gICAgICAgIHNoZWxsLmVtaXQoc2hlbGwuZXZlbnRzLml0ZW1SZWFkeSwgJHRvLCBub3RpZmljYXRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICgkZnJvbS5pcygnOnZpc2libGUnKSkge1xyXG4gICAgICAgIHNoZWxsLmVtaXQoc2hlbGwuZXZlbnRzLndpbGxDbG9zZSwgJGZyb20sIG5vdGlmaWNhdGlvbik7XHJcbiAgICAgICAgLy8gRG8gJ3VuZm9jdXMnIG9uIHRoZSBoaWRkZW4gZWxlbWVudCBhZnRlciBub3RpZnkgJ3dpbGxDbG9zZSdcclxuICAgICAgICAvLyBmb3IgYmV0dGVyIFVYOiBoaWRkZW4gZWxlbWVudHMgYXJlIG5vdCByZWFjaGFibGUgYW5kIGhhcyBnb29kXHJcbiAgICAgICAgLy8gc2lkZSBlZmZlY3RzIGxpa2UgaGlkZGluZyB0aGUgb24tc2NyZWVuIGtleWJvYXJkIGlmIGFuIGlucHV0IHdhc1xyXG4gICAgICAgIC8vIGZvY3VzZWRcclxuICAgICAgICAkZnJvbS5maW5kKCc6Zm9jdXMnKS5ibHVyKCk7XHJcbiAgICAgICAgLy8gaGlkZSBhbmQgbm90aWZ5IGl0IGVuZGVkXHJcbiAgICAgICAgJGZyb20uaGlkZSgpO1xyXG4gICAgICAgIHNoZWxsLmVtaXQoc2hlbGwuZXZlbnRzLmNsb3NlZCwgJGZyb20sIG5vdGlmaWNhdGlvbik7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICAgIEluaXRpYWxpemVzIHRoZSBsaXN0IG9mIGl0ZW1zLiBObyBtb3JlIHRoYW4gb25lXHJcbiAgICBtdXN0IGJlIG9wZW5lZC92aXNpYmxlIGF0IHRoZSBzYW1lIHRpbWUsIHNvIGF0IHRoZSBcclxuICAgIGluaXQgYWxsIHRoZSBlbGVtZW50cyBhcmUgY2xvc2VkIHdhaXRpbmcgdG8gc2V0XHJcbiAgICBvbmUgYXMgdGhlIGFjdGl2ZSBvciB0aGUgY3VycmVudCBvbmUuXHJcbioqL1xyXG5Eb21JdGVtc01hbmFnZXIucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiBpbml0KCkge1xyXG4gICAgdGhpcy5nZXRBY3RpdmUoKS5oaWRlKCk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgSmF2YXNjcml0cCBTaGVsbCBmb3IgU1BBcy5cclxuKiovXHJcbi8qZ2xvYmFsIHdpbmRvdywgZG9jdW1lbnQgKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqIERJIGVudHJ5IHBvaW50cyBmb3IgZGVmYXVsdCBidWlsZHMuIE1vc3QgZGVwZW5kZW5jaWVzIGNhbiBiZVxyXG4gICAgc3BlY2lmaWVkIGluIHRoZSBjb25zdHJ1Y3RvciBzZXR0aW5ncyBmb3IgcGVyLWluc3RhbmNlIHNldHVwLlxyXG4qKi9cclxudmFyIGRlcHMgPSByZXF1aXJlKCcuL2RlcGVuZGVuY2llcycpO1xyXG5cclxuLyoqIENvbnN0cnVjdG9yICoqL1xyXG5cclxuZnVuY3Rpb24gU2hlbGwoc2V0dGluZ3MpIHtcclxuICAgIC8vanNoaW50IG1heGNvbXBsZXhpdHk6MTRcclxuICAgIFxyXG4gICAgZGVwcy5FdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLiQgPSBzZXR0aW5ncy5qcXVlcnkgfHwgZGVwcy5qcXVlcnk7XHJcbiAgICB0aGlzLiRyb290ID0gdGhpcy4kKHNldHRpbmdzLnJvb3QpO1xyXG4gICAgdGhpcy5iYXNlVXJsID0gc2V0dGluZ3MuYmFzZVVybCB8fCAnJztcclxuICAgIC8vIFdpdGggZm9yY2VIYXNoYmFuZz10cnVlOlxyXG4gICAgLy8gLSBmcmFnbWVudHMgVVJMcyBjYW5ub3QgYmUgdXNlZCB0byBzY3JvbGwgdG8gYW4gZWxlbWVudCAoZGVmYXVsdCBicm93c2VyIGJlaGF2aW9yKSxcclxuICAgIC8vICAgdGhleSBhcmUgZGVmYXVsdFByZXZlbnRlZCB0byBhdm9pZCBjb25mdXNlIHRoZSByb3V0aW5nIG1lY2hhbmlzbSBhbmQgY3VycmVudCBVUkwuXHJcbiAgICAvLyAtIHByZXNzZWQgbGlua3MgdG8gZnJhZ21lbnRzIFVSTHMgYXJlIG5vdCByb3V0ZWQsIHRoZXkgYXJlIHNraXBwZWQgc2lsZW50bHlcclxuICAgIC8vICAgZXhjZXB0IHdoZW4gdGhleSBhcmUgYSBoYXNoYmFuZyAoIyEpLiBUaGlzIHdheSwgc3BlY2lhbCBsaW5rc1xyXG4gICAgLy8gICB0aGF0IHBlcmZvcm1uIGpzIGFjdGlvbnMgZG9lc24ndCBjb25mbGl0cy5cclxuICAgIC8vIC0gYWxsIFVSTHMgcm91dGVkIHRocm91Z2ggdGhlIHNoZWxsIGluY2x1ZGVzIGEgaGFzaGJhbmcgKCMhKSwgdGhlIHNoZWxsIGVuc3VyZXNcclxuICAgIC8vICAgdGhhdCBoYXBwZW5zIGJ5IGFwcGVuZGluZyB0aGUgaGFzaGJhbmcgdG8gYW55IFVSTCBwYXNzZWQgaW4gKGV4Y2VwdCB0aGUgc3RhbmRhcmQgaGFzaFxyXG4gICAgLy8gICB0aGF0IGFyZSBza2lwdCkuXHJcbiAgICB0aGlzLmZvcmNlSGFzaGJhbmcgPSBzZXR0aW5ncy5mb3JjZUhhc2hiYW5nIHx8IGZhbHNlO1xyXG4gICAgdGhpcy5saW5rRXZlbnQgPSBzZXR0aW5ncy5saW5rRXZlbnQgfHwgJ2NsaWNrJztcclxuICAgIHRoaXMucGFyc2VVcmwgPSAoc2V0dGluZ3MucGFyc2VVcmwgfHwgZGVwcy5wYXJzZVVybCkuYmluZCh0aGlzLCB0aGlzLmJhc2VVcmwpO1xyXG4gICAgdGhpcy5hYnNvbHV0aXplVXJsID0gKHNldHRpbmdzLmFic29sdXRpemVVcmwgfHwgZGVwcy5hYnNvbHV0aXplVXJsKS5iaW5kKHRoaXMsIHRoaXMuYmFzZVVybCk7XHJcblxyXG4gICAgdGhpcy5oaXN0b3J5ID0gc2V0dGluZ3MuaGlzdG9yeSB8fCB3aW5kb3cuaGlzdG9yeTtcclxuXHJcbiAgICB0aGlzLmluZGV4TmFtZSA9IHNldHRpbmdzLmluZGV4TmFtZSB8fCAnaW5kZXgnO1xyXG4gICAgXHJcbiAgICB0aGlzLml0ZW1zID0gc2V0dGluZ3MuZG9tSXRlbXNNYW5hZ2VyO1xyXG5cclxuICAgIC8vIGxvYWRlciBjYW4gYmUgZGlzYWJsZWQgcGFzc2luZyAnbnVsbCcsIHNvIHdlIG11c3RcclxuICAgIC8vIGVuc3VyZSB0byBub3QgdXNlIHRoZSBkZWZhdWx0IG9uIHRoYXQgY2FzZXM6XHJcbiAgICB0aGlzLmxvYWRlciA9IHR5cGVvZihzZXR0aW5ncy5sb2FkZXIpID09PSAndW5kZWZpbmVkJyA/IGRlcHMubG9hZGVyIDogc2V0dGluZ3MubG9hZGVyO1xyXG4gICAgLy8gbG9hZGVyIHNldHVwXHJcbiAgICBpZiAodGhpcy5sb2FkZXIpXHJcbiAgICAgICAgdGhpcy5sb2FkZXIuYmFzZVVybCA9IHRoaXMuYmFzZVVybDtcclxuXHJcbiAgICAvLyBEZWZpbml0aW9uIG9mIGV2ZW50cyB0aGF0IHRoaXMgb2JqZWN0IGNhbiB0cmlnZ2VyLFxyXG4gICAgLy8gaXRzIHZhbHVlIGNhbiBiZSBjdXN0b21pemVkIGJ1dCBhbnkgbGlzdGVuZXIgbmVlZHNcclxuICAgIC8vIHRvIGtlZXAgdXBkYXRlZCB0byB0aGUgY29ycmVjdCBldmVudCBzdHJpbmctbmFtZSB1c2VkLlxyXG4gICAgLy8gVGhlIGl0ZW1zIG1hbmlwdWxhdGlvbiBldmVudHMgTVVTVCBiZSB0cmlnZ2VyZWRcclxuICAgIC8vIGJ5IHRoZSAnaXRlbXMuc3dpdGNoJyBmdW5jdGlvblxyXG4gICAgdGhpcy5ldmVudHMgPSB7XHJcbiAgICAgICAgd2lsbE9wZW46ICdzaGVsbC13aWxsLW9wZW4nLFxyXG4gICAgICAgIHdpbGxDbG9zZTogJ3NoZWxsLXdpbGwtY2xvc2UnLFxyXG4gICAgICAgIGl0ZW1SZWFkeTogJ3NoZWxsLWl0ZW0tcmVhZHknLFxyXG4gICAgICAgIGNsb3NlZDogJ3NoZWxsLWNsb3NlZCcsXHJcbiAgICAgICAgb3BlbmVkOiAnc2hlbGwtb3BlbmVkJ1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgQSBmdW5jdGlvbiB0byBkZWNpZGUgaWYgdGhlXHJcbiAgICAgICAgYWNjZXNzIGlzIGFsbG93ZWQgKHJldHVybnMgJ251bGwnKVxyXG4gICAgICAgIG9yIG5vdCAocmV0dXJuIGEgc3RhdGUgb2JqZWN0IHdpdGggaW5mb3JtYXRpb25cclxuICAgICAgICB0aGF0IHdpbGwgYmUgcGFzc2VkIHRvIHRoZSAnbm9uQWNjZXNzTmFtZScgaXRlbTtcclxuICAgICAgICB0aGUgJ3JvdXRlJyBwcm9wZXJ0eSBvbiB0aGUgc3RhdGUgaXMgYXV0b21hdGljYWxseSBmaWxsZWQpLlxyXG4gICAgICAgIFxyXG4gICAgICAgIFRoZSBkZWZhdWx0IGJ1aXQtaW4ganVzdCBhbGxvdyBldmVyeXRoaW5nIFxyXG4gICAgICAgIGJ5IGp1c3QgcmV0dXJuaW5nICdudWxsJyBhbGwgdGhlIHRpbWUuXHJcbiAgICAgICAgXHJcbiAgICAgICAgSXQgcmVjZWl2ZXMgYXMgcGFyYW1ldGVyIHRoZSBzdGF0ZSBvYmplY3QsXHJcbiAgICAgICAgdGhhdCBhbG1vc3QgY29udGFpbnMgdGhlICdyb3V0ZScgcHJvcGVydHkgd2l0aFxyXG4gICAgICAgIGluZm9ybWF0aW9uIGFib3V0IHRoZSBVUkwuXHJcbiAgICAqKi9cclxuICAgIHRoaXMuYWNjZXNzQ29udHJvbCA9IHNldHRpbmdzLmFjY2Vzc0NvbnRyb2wgfHwgZGVwcy5hY2Nlc3NDb250cm9sO1xyXG4gICAgLy8gV2hhdCBpdGVtIGxvYWQgb24gbm9uIGFjY2Vzc1xyXG4gICAgdGhpcy5ub25BY2Nlc3NOYW1lID0gc2V0dGluZ3Mubm9uQWNjZXNzTmFtZSB8fCAnaW5kZXgnO1xyXG59XHJcblxyXG4vLyBTaGVsbCBpbmhlcml0cyBmcm9tIEV2ZW50RW1pdHRlclxyXG5TaGVsbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGRlcHMuRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwge1xyXG4gICAgY29uc3RydWN0b3I6IHtcclxuICAgICAgICB2YWx1ZTogU2hlbGwsXHJcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXHJcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTaGVsbDtcclxuXHJcblxyXG4vKiogQVBJIGRlZmluaXRpb24gKiovXHJcblxyXG5TaGVsbC5wcm90b3R5cGUuZ28gPSBmdW5jdGlvbiBnbyh1cmwsIHN0YXRlKSB7XHJcblxyXG4gICAgaWYgKHRoaXMuZm9yY2VIYXNoYmFuZykge1xyXG4gICAgICAgIGlmICghL14jIS8udGVzdCh1cmwpKSB7XHJcbiAgICAgICAgICAgIHVybCA9ICcjIScgKyB1cmw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdXJsID0gdGhpcy5hYnNvbHV0aXplVXJsKHVybCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmhpc3RvcnkucHVzaFN0YXRlKHN0YXRlLCB1bmRlZmluZWQsIHVybCk7XHJcbiAgICAvLyBwdXNoU3RhdGUgZG8gTk9UIHRyaWdnZXIgdGhlIHBvcHN0YXRlIGV2ZW50LCBzb1xyXG4gICAgcmV0dXJuIHRoaXMucmVwbGFjZShzdGF0ZSk7XHJcbn07XHJcblxyXG5TaGVsbC5wcm90b3R5cGUuZ29CYWNrID0gZnVuY3Rpb24gZ29CYWNrKHN0YXRlLCBzdGVwcykge1xyXG4gICAgc3RlcHMgPSAwIC0gKHN0ZXBzIHx8IDEpO1xyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm90aGluZyB0byBnby1iYWNrIG9yIG5vdCBlbm91Z2h0XHJcbiAgICAvLyAnYmFjaycgc3RlcHMsIGdvIHRvIHRoZSBpbmRleFxyXG4gICAgaWYgKHN0ZXBzIDwgMCAmJiBNYXRoLmFicyhzdGVwcykgPj0gdGhpcy5oaXN0b3J5Lmxlbmd0aCkge1xyXG4gICAgICAgIHRoaXMuZ28odGhpcy5pbmRleE5hbWUpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgLy8gT24gcmVwbGFjZSwgdGhlIHBhc3NlZCBzdGF0ZSBpcyBtZXJnZWQgd2l0aFxyXG4gICAgICAgIC8vIHRoZSBvbmUgdGhhdCBjb21lcyBmcm9tIHRoZSBzYXZlZCBoaXN0b3J5XHJcbiAgICAgICAgLy8gZW50cnkgKGl0ICdwb3BzJyB3aGVuIGRvaW5nIHRoZSBoaXN0b3J5LmdvKCkpXHJcbiAgICAgICAgdGhpcy5fcGVuZGluZ1N0YXRlVXBkYXRlID0gc3RhdGU7XHJcbiAgICAgICAgdGhpcy5oaXN0b3J5LmdvKHN0ZXBzKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gICAgUHJvY2VzcyB0aGUgZ2l2ZW4gc3RhdGUgaW4gb3JkZXIgdG8gZ2V0IHRoZSBjdXJyZW50IHN0YXRlXHJcbiAgICBiYXNlZCBvbiB0aGF0IG9yIHRoZSBzYXZlZCBpbiBoaXN0b3J5LCBtZXJnZSBpdCB3aXRoXHJcbiAgICBhbnkgdXBkYXRlZCBzdGF0ZSBwZW5kaW5nIGFuZCBhZGRzIHRoZSByb3V0ZSBpbmZvcm1hdGlvbixcclxuICAgIHJldHVybmluZyBhbiBzdGF0ZSBvYmplY3Qgc3VpdGFibGUgdG8gdXNlLlxyXG4qKi9cclxuU2hlbGwucHJvdG90eXBlLmdldFVwZGF0ZWRTdGF0ZSA9IGZ1bmN0aW9uIGdldFVwZGF0ZWRTdGF0ZShzdGF0ZSkge1xyXG4gICAgLypqc2hpbnQgbWF4Y29tcGxleGl0eTogOCAqL1xyXG4gICAgXHJcbiAgICAvLyBGb3IgY3VycmVudCB1c2VzLCBhbnkgcGVuZGluZ1N0YXRlVXBkYXRlIGlzIHVzZWQgYXNcclxuICAgIC8vIHRoZSBzdGF0ZSwgcmF0aGVyIHRoYW4gdGhlIHByb3ZpZGVkIG9uZVxyXG4gICAgc3RhdGUgPSB0aGlzLl9wZW5kaW5nU3RhdGVVcGRhdGUgfHwgc3RhdGUgfHwgdGhpcy5oaXN0b3J5LnN0YXRlIHx8IHt9O1xyXG4gICAgXHJcbiAgICAvLyBUT0RPOiBtb3JlIGFkdmFuY2VkIHVzZXMgbXVzdCBiZSB0byB1c2UgdGhlICdzdGF0ZScgdG9cclxuICAgIC8vIHJlY292ZXIgdGhlIFVJIHN0YXRlLCB3aXRoIGFueSBtZXNzYWdlIGZyb20gb3RoZXIgVUlcclxuICAgIC8vIHBhc3NpbmcgaW4gYSB3YXkgdGhhdCBhbGxvdyB1cGRhdGUgdGhlIHN0YXRlLCBub3RcclxuICAgIC8vIHJlcGxhY2UgaXQgKGZyb20gcGVuZGluZ1N0YXRlVXBkYXRlKS5cclxuICAgIC8qXHJcbiAgICAvLyBTdGF0ZSBvciBkZWZhdWx0IHN0YXRlXHJcbiAgICBzdGF0ZSA9IHN0YXRlIHx8IHRoaXMuaGlzdG9yeS5zdGF0ZSB8fCB7fTtcclxuICAgIC8vIG1lcmdlIHBlbmRpbmcgdXBkYXRlZCBzdGF0ZVxyXG4gICAgdGhpcy4kLmV4dGVuZChzdGF0ZSwgdGhpcy5fcGVuZGluZ1N0YXRlVXBkYXRlKTtcclxuICAgIC8vIGRpc2NhcmQgdGhlIHVwZGF0ZVxyXG4gICAgKi9cclxuICAgIHRoaXMuX3BlbmRpbmdTdGF0ZVVwZGF0ZSA9IG51bGw7XHJcbiAgICBcclxuICAgIC8vIERvZXNuJ3QgbWF0dGVycyBpZiBzdGF0ZSBpbmNsdWRlcyBhbHJlYWR5IFxyXG4gICAgLy8gJ3JvdXRlJyBpbmZvcm1hdGlvbiwgbmVlZCB0byBiZSBvdmVyd3JpdHRlblxyXG4gICAgLy8gdG8gbWF0Y2ggdGhlIGN1cnJlbnQgb25lLlxyXG4gICAgLy8gTk9URTogcHJldmlvdXNseSwgYSBjaGVjayBwcmV2ZW50ZWQgdGhpcyBpZlxyXG4gICAgLy8gcm91dGUgcHJvcGVydHkgZXhpc3RzLCBjcmVhdGluZyBpbmZpbml0ZSBsb29wc1xyXG4gICAgLy8gb24gcmVkaXJlY3Rpb25zIGZyb20gYWN0aXZpdHkuc2hvdyBzaW5jZSAncm91dGUnIGRvZXNuJ3RcclxuICAgIC8vIG1hdGNoIHRoZSBuZXcgZGVzaXJlZCBsb2NhdGlvblxyXG4gICAgXHJcbiAgICAvLyBEZXRlY3QgaWYgaXMgYSBoYXNoYmFuZyBVUkwgb3IgYW4gc3RhbmRhcmQgb25lLlxyXG4gICAgLy8gRXhjZXB0IGlmIHRoZSBhcHAgaXMgZm9yY2VkIHRvIHVzZSBoYXNoYmFuZy5cclxuICAgIHZhciBpc0hhc2hCYW5nID0gLyMhLy50ZXN0KGxvY2F0aW9uLmhyZWYpIHx8IHRoaXMuZm9yY2VIYXNoYmFuZztcclxuICAgIFxyXG4gICAgdmFyIGxpbmsgPSAoXHJcbiAgICAgICAgaXNIYXNoQmFuZyA/XHJcbiAgICAgICAgbG9jYXRpb24uaGFzaCA6XHJcbiAgICAgICAgbG9jYXRpb24ucGF0aG5hbWVcclxuICAgICkgKyAobG9jYXRpb24uc2VhcmNoIHx8ICcnKTtcclxuICAgIFxyXG4gICAgLy8gU2V0IHRoZSByb3V0ZVxyXG4gICAgc3RhdGUucm91dGUgPSB0aGlzLnBhcnNlVXJsKGxpbmspO1xyXG4gICAgXHJcbiAgICByZXR1cm4gc3RhdGU7XHJcbn07XHJcblxyXG5TaGVsbC5wcm90b3R5cGUucmVwbGFjZSA9IGZ1bmN0aW9uIHJlcGxhY2Uoc3RhdGUpIHtcclxuICAgIFxyXG4gICAgc3RhdGUgPSB0aGlzLmdldFVwZGF0ZWRTdGF0ZShzdGF0ZSk7XHJcblxyXG4gICAgLy8gVXNlIHRoZSBpbmRleCBvbiByb290IGNhbGxzXHJcbiAgICBpZiAoc3RhdGUucm91dGUucm9vdCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIHN0YXRlLnJvdXRlID0gdGhpcy5wYXJzZVVybCh0aGlzLmluZGV4TmFtZSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEFjY2VzcyBjb250cm9sXHJcbiAgICB2YXIgYWNjZXNzRXJyb3IgPSB0aGlzLmFjY2Vzc0NvbnRyb2woc3RhdGUucm91dGUpO1xyXG4gICAgaWYgKGFjY2Vzc0Vycm9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ28odGhpcy5ub25BY2Nlc3NOYW1lLCBhY2Nlc3NFcnJvcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTG9jYXRpbmcgdGhlIGNvbnRhaW5lclxyXG4gICAgdmFyICRjb250ID0gdGhpcy5pdGVtcy5maW5kKHN0YXRlLnJvdXRlLm5hbWUpO1xyXG4gICAgdmFyIHNoZWxsID0gdGhpcztcclxuICAgIHZhciBwcm9taXNlID0gbnVsbDtcclxuXHJcbiAgICBpZiAoJGNvbnQgJiYgJGNvbnQubGVuZ3RoKSB7XHJcbiAgICAgICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciAkb2xkQ29udCA9IHNoZWxsLml0ZW1zLmdldEFjdGl2ZSgpO1xyXG4gICAgICAgICAgICAgICAgJG9sZENvbnQgPSAkb2xkQ29udC5ub3QoJGNvbnQpO1xyXG4gICAgICAgICAgICAgICAgc2hlbGwuaXRlbXMuc3dpdGNoKCRvbGRDb250LCAkY29udCwgc2hlbGwsIHN0YXRlKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7IC8vPyByZXNvbHZlKGFjdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoZXgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBpZiAodGhpcy5sb2FkZXIpIHtcclxuICAgICAgICAgICAgLy8gbG9hZCBhbmQgaW5qZWN0IHRoZSBjb250ZW50IGluIHRoZSBwYWdlXHJcbiAgICAgICAgICAgIC8vIHRoZW4gdHJ5IHRoZSByZXBsYWNlIGFnYWluXHJcbiAgICAgICAgICAgIHByb21pc2UgPSB0aGlzLmxvYWRlci5sb2FkKHN0YXRlLnJvdXRlKS50aGVuKGZ1bmN0aW9uKGh0bWwpIHtcclxuICAgICAgICAgICAgICAgIC8vIEFkZCB0byB0aGUgaXRlbXMgKHRoZSBtYW5hZ2VyIHRha2VzIGNhcmUgeW91XHJcbiAgICAgICAgICAgICAgICAvLyBhZGQgb25seSB0aGUgaXRlbSwgaWYgdGhlcmUgaXMgb25lKVxyXG4gICAgICAgICAgICAgICAgc2hlbGwuaXRlbXMuaW5qZWN0KHN0YXRlLnJvdXRlLm5hbWUsIGh0bWwpO1xyXG4gICAgICAgICAgICAgICAgLy8gRG91YmxlIGNoZWNrIHRoYXQgdGhlIGl0ZW0gd2FzIGFkZGVkIGFuZCBpcyByZWFkeVxyXG4gICAgICAgICAgICAgICAgLy8gdG8gYXZvaWQgYW4gaW5maW5pdGUgbG9vcCBiZWNhdXNlIGEgcmVxdWVzdCBub3QgcmV0dXJuaW5nXHJcbiAgICAgICAgICAgICAgICAvLyB0aGUgaXRlbSBhbmQgdGhlICdyZXBsYWNlJyB0cnlpbmcgdG8gbG9hZCBpdCBhZ2FpbiwgYW5kIGFnYWluLCBhbmQuLlxyXG4gICAgICAgICAgICAgICAgaWYgKHNoZWxsLml0ZW1zLmZpbmQoc3RhdGUucm91dGUubmFtZSkubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzaGVsbC5yZXBsYWNlKHN0YXRlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdQYWdlIG5vdCBmb3VuZCAoJyArIHN0YXRlLnJvdXRlLm5hbWUgKyAnKScpO1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1NoZWxsIFBhZ2Ugbm90IGZvdW5kLCBzdGF0ZTonLCBzdGF0ZSk7XHJcbiAgICAgICAgICAgIHByb21pc2UgPSBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVG8gYXZvaWQgYmVpbmcgaW4gYW4gaW5leGlzdGFudCBVUkwgKGdlbmVyYXRpbmcgaW5jb25zaXN0ZW5jeSBiZXR3ZWVuXHJcbiAgICAgICAgICAgIC8vIGN1cnJlbnQgdmlldyBhbmQgVVJMLCBjcmVhdGluZyBiYWQgaGlzdG9yeSBlbnRyaWVzKSxcclxuICAgICAgICAgICAgLy8gYSBnb0JhY2sgaXMgZXhlY3V0ZWQsIGp1c3QgYWZ0ZXIgdGhlIGN1cnJlbnQgcGlwZSBlbmRzXHJcbiAgICAgICAgICAgIC8vIFRPRE86IGltcGxlbWVudCByZWRpcmVjdCB0aGF0IGN1dCBjdXJyZW50IHByb2Nlc3NpbmcgcmF0aGVyIHRoYW4gZXhlY3V0ZSBkZWxheWVkXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdvQmFjaygpO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcyksIDEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIHRoaXNTaGVsbCA9IHRoaXM7XHJcbiAgICBwcm9taXNlLmNhdGNoKGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgIGlmICghKGVyciBpbnN0YW5jZW9mIEVycm9yKSlcclxuICAgICAgICAgICAgZXJyID0gbmV3IEVycm9yKGVycik7XHJcblxyXG4gICAgICAgIC8vIExvZyBlcnJvciwgXHJcbiAgICAgICAgY29uc29sZS5lcnJvcignU2hlbGwsIHVuZXhwZWN0ZWQgZXJyb3IuJywgZXJyKTtcclxuICAgICAgICAvLyBub3RpZnkgYXMgYW4gZXZlbnRcclxuICAgICAgICB0aGlzU2hlbGwuZW1pdCgnZXJyb3InLCBlcnIpO1xyXG4gICAgICAgIC8vIGFuZCBjb250aW51ZSBwcm9wYWdhdGluZyB0aGUgZXJyb3JcclxuICAgICAgICByZXR1cm4gZXJyO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHByb21pc2U7XHJcbn07XHJcblxyXG5TaGVsbC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gcnVuKCkge1xyXG5cclxuICAgIHZhciBzaGVsbCA9IHRoaXM7XHJcblxyXG4gICAgLy8gQ2F0Y2ggcG9wc3RhdGUgZXZlbnQgdG8gdXBkYXRlIHNoZWxsIHJlcGxhY2luZyB0aGUgYWN0aXZlIGNvbnRhaW5lci5cclxuICAgIC8vIEFsbG93cyBwb2x5ZmlsbHMgdG8gcHJvdmlkZSBhIGRpZmZlcmVudCBidXQgZXF1aXZhbGVudCBldmVudCBuYW1lXHJcbiAgICB0aGlzLiQod2luZG93KS5vbih0aGlzLmhpc3RvcnkucG9wc3RhdGVFdmVudCB8fCAncG9wc3RhdGUnLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBzdGF0ZSA9IGV2ZW50LnN0YXRlIHx8IFxyXG4gICAgICAgICAgICAoZXZlbnQub3JpZ2luYWxFdmVudCAmJiBldmVudC5vcmlnaW5hbEV2ZW50LnN0YXRlKSB8fCBcclxuICAgICAgICAgICAgc2hlbGwuaGlzdG9yeS5zdGF0ZTtcclxuXHJcbiAgICAgICAgLy8gZ2V0IHN0YXRlIGZvciBjdXJyZW50LiBUbyBzdXBwb3J0IHBvbHlmaWxscywgd2UgdXNlIHRoZSBnZW5lcmFsIGdldHRlclxyXG4gICAgICAgIC8vIGhpc3Rvcnkuc3RhdGUgYXMgZmFsbGJhY2sgKHRoZXkgbXVzdCBiZSB0aGUgc2FtZSBvbiBicm93c2VycyBzdXBwb3J0aW5nIEhpc3RvcnkgQVBJKVxyXG4gICAgICAgIHNoZWxsLnJlcGxhY2Uoc3RhdGUpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ2F0Y2ggYWxsIGxpbmtzIGluIHRoZSBwYWdlIChub3Qgb25seSAkcm9vdCBvbmVzKSBhbmQgbGlrZS1saW5rc1xyXG4gICAgdGhpcy4kKGRvY3VtZW50KS5vbih0aGlzLmxpbmtFdmVudCwgJ1tocmVmXSwgW2RhdGEtaHJlZl0nLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyICR0ID0gc2hlbGwuJCh0aGlzKSxcclxuICAgICAgICAgICAgaHJlZiA9ICR0LmF0dHIoJ2hyZWYnKSB8fCAkdC5kYXRhKCdocmVmJyk7XHJcblxyXG4gICAgICAgIC8vIERvIG5vdGhpbmcgaWYgdGhlIFVSTCBjb250YWlucyB0aGUgcHJvdG9jb2xcclxuICAgICAgICBpZiAoL15bYS16XSs6L2kudGVzdChocmVmKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHNoZWxsLmZvcmNlSGFzaGJhbmcgJiYgL14jKFteIV18JCkvLnRlc3QoaHJlZikpIHtcclxuICAgICAgICAgICAgLy8gU3RhbmRhcmQgaGFzaCwgYnV0IG5vdCBoYXNoYmFuZzogYXZvaWQgcm91dGluZyBhbmQgZGVmYXVsdCBiZWhhdmlvclxyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAvLz8gZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgLy8gRXhlY3V0ZWQgZGVsYXllZCB0byBhdm9pZCBoYW5kbGVyIGNvbGxpc2lvbnMsIGJlY2F1c2VcclxuICAgICAgICAvLyBvZiB0aGUgbmV3IHBhZ2UgbW9kaWZ5aW5nIHRoZSBlbGVtZW50IGFuZCBvdGhlciBoYW5kbGVyc1xyXG4gICAgICAgIC8vIHJlYWRpbmcgaXQgYXR0cmlidXRlcyBhbmQgYXBwbHlpbmcgbG9naWMgb24gdGhlIHVwZGF0ZWQgbGlua1xyXG4gICAgICAgIC8vIGFzIGlmIHdhcyB0aGUgb2xkIG9uZSAoZXhhbXBsZTogc2hhcmVkIGxpbmtzLCBsaWtlIGluIGFcclxuICAgICAgICAvLyBnbG9iYWwgbmF2YmFyLCB0aGF0IG1vZGlmaWVzIHdpdGggdGhlIG5ldyBwYWdlKS5cclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBzaGVsbC5nbyhocmVmKTtcclxuICAgICAgICB9LCAxKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEluaXRpYWxsaXplIHN0YXRlXHJcbiAgICB0aGlzLml0ZW1zLmluaXQoKTtcclxuICAgIC8vIFJvdXRlIHRvIHRoZSBjdXJyZW50IHVybC9zdGF0ZVxyXG4gICAgdGhpcy5yZXBsYWNlKCk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgYWJzb2x1dGl6ZVVybCB1dGlsaXR5IFxyXG4gICAgdGhhdCBlbnN1cmVzIHRoZSB1cmwgcHJvdmlkZWRcclxuICAgIGJlaW5nIGluIHRoZSBwYXRoIG9mIHRoZSBnaXZlbiBiYXNlVXJsXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgc2FuaXRpemVVcmwgPSByZXF1aXJlKCcuL3Nhbml0aXplVXJsJyksXHJcbiAgICBlc2NhcGVSZWdFeHAgPSByZXF1aXJlKCcuLi9lc2NhcGVSZWdFeHAnKTtcclxuXHJcbmZ1bmN0aW9uIGFic29sdXRpemVVcmwoYmFzZVVybCwgdXJsKSB7XHJcblxyXG4gICAgLy8gc2FuaXRpemUgYmVmb3JlIGNoZWNrXHJcbiAgICB1cmwgPSBzYW5pdGl6ZVVybCh1cmwpO1xyXG5cclxuICAgIC8vIENoZWNrIGlmIHVzZSB0aGUgYmFzZSBhbHJlYWR5XHJcbiAgICB2YXIgbWF0Y2hCYXNlID0gbmV3IFJlZ0V4cCgnXicgKyBlc2NhcGVSZWdFeHAoYmFzZVVybCksICdpJyk7XHJcbiAgICBpZiAobWF0Y2hCYXNlLnRlc3QodXJsKSkge1xyXG4gICAgICAgIHJldHVybiB1cmw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gYnVpbGQgYW5kIHNhbml0aXplXHJcbiAgICByZXR1cm4gc2FuaXRpemVVcmwoYmFzZVVybCArIHVybCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYWJzb2x1dGl6ZVVybDtcclxuIiwiLyoqXHJcbiAgICBFeHRlcm5hbCBkZXBlbmRlbmNpZXMgZm9yIFNoZWxsIGluIGEgc2VwYXJhdGUgbW9kdWxlXHJcbiAgICB0byB1c2UgYXMgREksIG5lZWRzIHNldHVwIGJlZm9yZSBjYWxsIHRoZSBTaGVsbC5qc1xyXG4gICAgbW9kdWxlIGNsYXNzXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHBhcnNlVXJsOiBudWxsLFxyXG4gICAgYWJzb2x1dGl6ZVVybDogbnVsbCxcclxuICAgIGpxdWVyeTogbnVsbCxcclxuICAgIGxvYWRlcjogbnVsbCxcclxuICAgIGFjY2Vzc0NvbnRyb2w6IGZ1bmN0aW9uIGFsbG93QWxsKG5hbWUpIHtcclxuICAgICAgICAvLyBhbGxvdyBhY2Nlc3MgYnkgZGVmYXVsdFxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfSxcclxuICAgIEV2ZW50RW1pdHRlcjogbnVsbFxyXG59O1xyXG4iLCIvKipcclxuICAgIFNpbXBsZSBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgSGlzdG9yeSBBUEkgdXNpbmcgb25seSBoYXNoYmFuZ3MgVVJMcyxcclxuICAgIGRvZXNuJ3QgbWF0dGVycyB0aGUgYnJvd3NlciBzdXBwb3J0LlxyXG4gICAgVXNlZCB0byBhdm9pZCBmcm9tIHNldHRpbmcgVVJMcyB0aGF0IGhhcyBub3QgYW4gZW5kLXBvaW50LFxyXG4gICAgbGlrZSBpbiBsb2NhbCBlbnZpcm9ubWVudHMgd2l0aG91dCBhIHNlcnZlciBkb2luZyB1cmwtcmV3cml0aW5nLFxyXG4gICAgaW4gcGhvbmVnYXAgYXBwcywgb3IgdG8gY29tcGxldGVseSBieS1wYXNzIGJyb3dzZXIgc3VwcG9ydCBiZWNhdXNlXHJcbiAgICBpcyBidWdneSAobGlrZSBBbmRyb2lkIDw9IDQuMSkuXHJcbiAgICBcclxuICAgIE5PVEVTOlxyXG4gICAgLSBCcm93c2VyIG11c3Qgc3VwcG9ydCAnaGFzaGNoYW5nZScgZXZlbnQuXHJcbiAgICAtIEJyb3dzZXIgbXVzdCBoYXMgc3VwcG9ydCBmb3Igc3RhbmRhcmQgSlNPTiBjbGFzcy5cclxuICAgIC0gUmVsaWVzIG9uIHNlc3Npb25zdG9yYWdlIGZvciBwZXJzaXN0YW5jZSwgc3VwcG9ydGVkIGJ5IGFsbCBicm93c2VycyBhbmQgd2Vidmlld3MgXHJcbiAgICAgIGZvciBhIGVub3VnaCBsb25nIHRpbWUgbm93LlxyXG4gICAgLSBTaW1pbGFyIGFwcHJvYWNoIGFzIEhpc3RvcnkuanMgcG9seWZpbGwsIGJ1dCBzaW1wbGlmaWVkLCBhcHBlbmRpbmcgYSBmYWtlIHF1ZXJ5XHJcbiAgICAgIHBhcmFtZXRlciAnX3N1aWQ9MCcgdG8gdGhlIGhhc2ggdmFsdWUgKGFjdHVhbCBxdWVyeSBnb2VzIGJlZm9yZSB0aGUgaGFzaCwgYnV0XHJcbiAgICAgIHdlIG5lZWQgaXQgaW5zaWRlKS5cclxuICAgIC0gRm9yIHNpbXBsaWZpY2F0aW9uLCBvbmx5IHRoZSBzdGF0ZSBpcyBwZXJzaXN0ZWQsIHRoZSAndGl0bGUnIHBhcmFtZXRlciBpcyBub3RcclxuICAgICAgdXNlZCBhdCBhbGwgKHRoZSBzYW1lIGFzIG1ham9yIGJyb3dzZXJzIGRvLCBzbyBpcyBub3QgYSBwcm9ibGVtKTsgaW4gdGhpcyBsaW5lLFxyXG4gICAgICBvbmx5IGhpc3RvcnkgZW50cmllcyB3aXRoIHN0YXRlIGFyZSBwZXJzaXN0ZWQuXHJcbioqL1xyXG4vL2dsb2JhbCBsb2NhdGlvblxyXG4ndXNlIHN0cmljdCc7XHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBzYW5pdGl6ZVVybCA9IHJlcXVpcmUoJy4vc2FuaXRpemVVcmwnKSxcclxuICAgIGdldFVybFF1ZXJ5ID0gcmVxdWlyZSgnLi4vZ2V0VXJsUXVlcnknKTtcclxuXHJcbi8vIEluaXQ6IExvYWQgc2F2ZWQgY29weSBmcm9tIHNlc3Npb25TdG9yYWdlXHJcbnZhciBzZXNzaW9uID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbSgnaGFzaGJhbmdIaXN0b3J5LnN0b3JlJyk7XHJcbi8vIE9yIGNyZWF0ZSBhIG5ldyBvbmVcclxuaWYgKCFzZXNzaW9uKSB7XHJcbiAgICBzZXNzaW9uID0ge1xyXG4gICAgICAgIC8vIFN0YXRlcyBhcnJheSB3aGVyZSBlYWNoIGluZGV4IGlzIHRoZSBTVUlEIGNvZGUgYW5kIHRoZVxyXG4gICAgICAgIC8vIHZhbHVlIGlzIGp1c3QgdGhlIHZhbHVlIHBhc3NlZCBhcyBzdGF0ZSBvbiBwdXNoU3RhdGUvcmVwbGFjZVN0YXRlXHJcbiAgICAgICAgc3RhdGVzOiBbXVxyXG4gICAgfTtcclxufVxyXG5lbHNlIHtcclxuICAgIHNlc3Npb24gPSBKU09OLnBhcnNlKHNlc3Npb24pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAgICBHZXQgdGhlIFNVSUQgbnVtYmVyXHJcbiAgICBmcm9tIGEgaGFzaCBzdHJpbmdcclxuKiovXHJcbmZ1bmN0aW9uIGdldFN1aWQoaGFzaCkge1xyXG4gICAgXHJcbiAgICB2YXIgc3VpZCA9ICtnZXRVcmxRdWVyeShoYXNoKS5fc3VpZDtcclxuICAgIGlmIChpc05hTihzdWlkKSlcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIGVsc2VcclxuICAgICAgICByZXR1cm4gc3VpZDtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0U3VpZChoYXNoLCBzdWlkKSB7XHJcbiAgICBcclxuICAgIC8vIFdlIG5lZWQgdGhlIHF1ZXJ5LCBzaW5jZSB3ZSBuZWVkIFxyXG4gICAgLy8gdG8gcmVwbGFjZSB0aGUgX3N1aWQgKG1heSBleGlzdClcclxuICAgIC8vIGFuZCByZWNyZWF0ZSB0aGUgcXVlcnkgaW4gdGhlXHJcbiAgICAvLyByZXR1cm5lZCBoYXNoLXVybFxyXG4gICAgdmFyIHFzID0gZ2V0VXJsUXVlcnkoaGFzaCk7XHJcbiAgICBxcy5wdXNoKCdfc3VpZCcpO1xyXG4gICAgcXMuX3N1aWQgPSBzdWlkO1xyXG5cclxuICAgIHZhciBxdWVyeSA9IFtdO1xyXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHFzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgcXVlcnkucHVzaChxc1tpXSArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChxc1txc1tpXV0pKTtcclxuICAgIH1cclxuICAgIHF1ZXJ5ID0gcXVlcnkuam9pbignJicpO1xyXG4gICAgXHJcbiAgICBpZiAocXVlcnkpIHtcclxuICAgICAgICB2YXIgaW5kZXggPSBoYXNoLmluZGV4T2YoJz8nKTtcclxuICAgICAgICBpZiAoaW5kZXggPiAtMSlcclxuICAgICAgICAgICAgaGFzaCA9IGhhc2guc3Vic3RyKDAsIGluZGV4KTtcclxuICAgICAgICBoYXNoICs9ICc/JyArIHF1ZXJ5O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBoYXNoO1xyXG59XHJcblxyXG4vKipcclxuICAgIEFzayB0byBwZXJzaXN0IHRoZSBzZXNzaW9uIGRhdGEuXHJcbiAgICBJdCBpcyBkb25lIHdpdGggYSB0aW1lb3V0IGluIG9yZGVyIHRvIGF2b2lkXHJcbiAgICBkZWxheSBpbiB0aGUgY3VycmVudCB0YXNrIG1haW5seSBhbnkgaGFuZGxlclxyXG4gICAgdGhhdCBhY3RzIGFmdGVyIGEgSGlzdG9yeSBjaGFuZ2UuXHJcbioqL1xyXG5mdW5jdGlvbiBwZXJzaXN0KCkge1xyXG4gICAgLy8gRW5vdWdoIHRpbWUgdG8gYWxsb3cgcm91dGluZyB0YXNrcyxcclxuICAgIC8vIG1vc3QgYW5pbWF0aW9ucyBmcm9tIGZpbmlzaCBhbmQgdGhlIFVJXHJcbiAgICAvLyBiZWluZyByZXNwb25zaXZlLlxyXG4gICAgLy8gQmVjYXVzZSBzZXNzaW9uU3RvcmFnZSBpcyBzeW5jaHJvbm91cy5cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSgnaGFzaGJhbmdIaXN0b3J5LnN0b3JlJywgSlNPTi5zdHJpbmdpZnkoc2Vzc2lvbikpO1xyXG4gICAgfSwgMTUwMCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgUmV0dXJucyB0aGUgZ2l2ZW4gc3RhdGUgb3IgbnVsbFxyXG4gICAgaWYgaXMgYW4gZW1wdHkgb2JqZWN0LlxyXG4qKi9cclxuZnVuY3Rpb24gY2hlY2tTdGF0ZShzdGF0ZSkge1xyXG4gICAgXHJcbiAgICBpZiAoc3RhdGUpIHtcclxuICAgICAgICAvLyBpcyBlbXB0eT9cclxuICAgICAgICBmb3IodmFyIGkgaW4gc3RhdGUpIHtcclxuICAgICAgICAgICAgLy8gTm9cclxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBpdHMgZW1wdHlcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIC8vIEFueXRoaW5nIGVsc2VcclxuICAgIHJldHVybiBzdGF0ZTtcclxufVxyXG5cclxuLyoqXHJcbiAgICBHZXQgYSBjYW5vbmljYWwgcmVwcmVzZW50YXRpb25cclxuICAgIG9mIHRoZSBVUkwgc28gY2FuIGJlIGNvbXBhcmVkXHJcbiAgICB3aXRoIHN1Y2Nlc3MuXHJcbioqL1xyXG5mdW5jdGlvbiBjYW5ub25pY2FsVXJsKHVybCkge1xyXG4gICAgXHJcbiAgICAvLyBBdm9pZCBzb21lIGJhZCBvciBwcm9ibGVtYXRpYyBzeW50YXhcclxuICAgIHVybCA9IHNhbml0aXplVXJsKHVybCB8fCAnJyk7XHJcbiAgICBcclxuICAgIC8vIEdldCB0aGUgaGFzaCBwYXJ0XHJcbiAgICB2YXIgaWhhc2ggPSB1cmwuaW5kZXhPZignIycpO1xyXG4gICAgaWYgKGloYXNoID4gLTEpIHtcclxuICAgICAgICB1cmwgPSB1cmwuc3Vic3RyKGloYXNoICsgMSk7XHJcbiAgICB9XHJcbiAgICAvLyBNYXliZSBhIGhhc2hiYW5nIFVSTCwgcmVtb3ZlIHRoZVxyXG4gICAgLy8gJ2JhbmcnICh0aGUgaGFzaCB3YXMgcmVtb3ZlZCBhbHJlYWR5KVxyXG4gICAgdXJsID0gdXJsLnJlcGxhY2UoL14hLywgJycpO1xyXG5cclxuICAgIHJldHVybiB1cmw7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgVHJhY2tzIHRoZSBsYXRlc3QgVVJMXHJcbiAgICBiZWluZyBwdXNoZWQgb3IgcmVwbGFjZWQgYnlcclxuICAgIHRoZSBBUEkuXHJcbiAgICBUaGlzIGFsbG93cyBsYXRlciB0byBhdm9pZFxyXG4gICAgdHJpZ2dlciB0aGUgcG9wc3RhdGUgZXZlbnQsXHJcbiAgICBzaW5jZSBtdXN0IE5PVCBiZSB0cmlnZ2VyZWRcclxuICAgIGFzIGEgcmVzdWx0IG9mIHRoYXQgQVBJIG1ldGhvZHNcclxuKiovXHJcbnZhciBsYXRlc3RQdXNoZWRSZXBsYWNlZFVybCA9IG51bGw7XHJcblxyXG4vKipcclxuICAgIEhpc3RvcnkgUG9seWZpbGxcclxuKiovXHJcbnZhciBoYXNoYmFuZ0hpc3RvcnkgPSB7XHJcbiAgICBwdXNoU3RhdGU6IGZ1bmN0aW9uIHB1c2hTdGF0ZShzdGF0ZSwgdGl0bGUsIHVybCkge1xyXG5cclxuICAgICAgICAvLyBjbGVhbnVwIHVybFxyXG4gICAgICAgIHVybCA9IGNhbm5vbmljYWxVcmwodXJsKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBzYXZlIG5ldyBzdGF0ZSBmb3IgdXJsXHJcbiAgICAgICAgc3RhdGUgPSBjaGVja1N0YXRlKHN0YXRlKSB8fCBudWxsO1xyXG4gICAgICAgIGlmIChzdGF0ZSAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAvLyBzYXZlIHN0YXRlXHJcbiAgICAgICAgICAgIHNlc3Npb24uc3RhdGVzLnB1c2goc3RhdGUpO1xyXG4gICAgICAgICAgICB2YXIgc3VpZCA9IHNlc3Npb24uc3RhdGVzLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgICAgIC8vIHVwZGF0ZSBVUkwgd2l0aCB0aGUgc3VpZFxyXG4gICAgICAgICAgICB1cmwgPSBzZXRTdWlkKHVybCwgc3VpZCk7XHJcbiAgICAgICAgICAgIC8vIGNhbGwgdG8gcGVyc2lzdCB0aGUgdXBkYXRlZCBzZXNzaW9uXHJcbiAgICAgICAgICAgIHBlcnNpc3QoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGF0ZXN0UHVzaGVkUmVwbGFjZWRVcmwgPSB1cmw7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gdXBkYXRlIGxvY2F0aW9uIHRvIHRyYWNrIGhpc3Rvcnk6XHJcbiAgICAgICAgbG9jYXRpb24uaGFzaCA9ICcjIScgKyB1cmw7XHJcbiAgICB9LFxyXG4gICAgcmVwbGFjZVN0YXRlOiBmdW5jdGlvbiByZXBsYWNlU3RhdGUoc3RhdGUsIHRpdGxlLCB1cmwpIHtcclxuICAgICAgICBcclxuICAgICAgICAvLyBjbGVhbnVwIHVybFxyXG4gICAgICAgIHVybCA9IGNhbm5vbmljYWxVcmwodXJsKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBpdCBoYXMgc2F2ZWQgc3RhdGU/XHJcbiAgICAgICAgdmFyIHN1aWQgPSBnZXRTdWlkKHVybCksXHJcbiAgICAgICAgICAgIGhhc09sZFN0YXRlID0gc3VpZCAhPT0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gc2F2ZSBuZXcgc3RhdGUgZm9yIHVybFxyXG4gICAgICAgIHN0YXRlID0gY2hlY2tTdGF0ZShzdGF0ZSkgfHwgbnVsbDtcclxuICAgICAgICAvLyBpdHMgc2F2ZWQgaWYgdGhlcmUgaXMgc29tZXRoaW5nIHRvIHNhdmVcclxuICAgICAgICAvLyBvciBzb21ldGhpbmcgdG8gZGVzdHJveVxyXG4gICAgICAgIGlmIChzdGF0ZSAhPT0gbnVsbCB8fCBoYXNPbGRTdGF0ZSkge1xyXG4gICAgICAgICAgICAvLyBzYXZlIHN0YXRlXHJcbiAgICAgICAgICAgIGlmIChoYXNPbGRTdGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gcmVwbGFjZSBleGlzdGluZyBzdGF0ZVxyXG4gICAgICAgICAgICAgICAgc2Vzc2lvbi5zdGF0ZXNbc3VpZF0gPSBzdGF0ZTtcclxuICAgICAgICAgICAgICAgIC8vIHRoZSB1cmwgcmVtYWlucyB0aGUgc2FtZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIHN0YXRlXHJcbiAgICAgICAgICAgICAgICBzZXNzaW9uLnN0YXRlcy5wdXNoKHN0YXRlKTtcclxuICAgICAgICAgICAgICAgIHN1aWQgPSBzZXNzaW9uLnN0YXRlcy5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICAgICAgLy8gdXBkYXRlIFVSTCB3aXRoIHRoZSBzdWlkXHJcbiAgICAgICAgICAgICAgICB1cmwgPSBzZXRTdWlkKHVybCwgc3VpZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gY2FsbCB0byBwZXJzaXN0IHRoZSB1cGRhdGVkIHNlc3Npb25cclxuICAgICAgICAgICAgcGVyc2lzdCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBsYXRlc3RQdXNoZWRSZXBsYWNlZFVybCA9IHVybDtcclxuXHJcbiAgICAgICAgLy8gdXBkYXRlIGxvY2F0aW9uIHRvIHRyYWNrIGhpc3Rvcnk6XHJcbiAgICAgICAgbG9jYXRpb24uaGFzaCA9ICcjIScgKyB1cmw7XHJcbiAgICB9LFxyXG4gICAgZ2V0IHN0YXRlKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBzdWlkID0gZ2V0U3VpZChsb2NhdGlvbi5oYXNoKTtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICBzdWlkICE9PSBudWxsID9cclxuICAgICAgICAgICAgc2Vzc2lvbi5zdGF0ZXNbc3VpZF0gOlxyXG4gICAgICAgICAgICBudWxsXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcbiAgICBnZXQgbGVuZ3RoKCkge1xyXG4gICAgICAgIHJldHVybiB3aW5kb3cuaGlzdG9yeS5sZW5ndGg7XHJcbiAgICB9LFxyXG4gICAgZ286IGZ1bmN0aW9uIGdvKG9mZnNldCkge1xyXG4gICAgICAgIHdpbmRvdy5oaXN0b3J5LmdvKG9mZnNldCk7XHJcbiAgICB9LFxyXG4gICAgYmFjazogZnVuY3Rpb24gYmFjaygpIHtcclxuICAgICAgICB3aW5kb3cuaGlzdG9yeS5iYWNrKCk7XHJcbiAgICB9LFxyXG4gICAgZm9yd2FyZDogZnVuY3Rpb24gZm9yd2FyZCgpIHtcclxuICAgICAgICB3aW5kb3cuaGlzdG9yeS5mb3J3YXJkKCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vLyBBdHRhY2ggaGFzaGNhbmdlIGV2ZW50IHRvIHRyaWdnZXIgSGlzdG9yeSBBUEkgZXZlbnQgJ3BvcHN0YXRlJ1xyXG52YXIgJHcgPSAkKHdpbmRvdyk7XHJcbiR3Lm9uKCdoYXNoY2hhbmdlJywgZnVuY3Rpb24oZSkge1xyXG4gICAgXHJcbiAgICB2YXIgdXJsID0gZS5vcmlnaW5hbEV2ZW50Lm5ld1VSTDtcclxuICAgIHVybCA9IGNhbm5vbmljYWxVcmwodXJsKTtcclxuICAgIFxyXG4gICAgLy8gQW4gVVJMIGJlaW5nIHB1c2hlZCBvciByZXBsYWNlZFxyXG4gICAgLy8gbXVzdCBOT1QgdHJpZ2dlciBwb3BzdGF0ZVxyXG4gICAgaWYgKHVybCA9PT0gbGF0ZXN0UHVzaGVkUmVwbGFjZWRVcmwpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgXHJcbiAgICAvLyBnZXQgc3RhdGUgZnJvbSBoaXN0b3J5IGVudHJ5XHJcbiAgICAvLyBmb3IgdGhlIHVwZGF0ZWQgVVJMLCBpZiBhbnlcclxuICAgIC8vIChjYW4gaGF2ZSB2YWx1ZSB3aGVuIHRyYXZlcnNpbmdcclxuICAgIC8vIGhpc3RvcnkpLlxyXG4gICAgdmFyIHN1aWQgPSBnZXRTdWlkKHVybCksXHJcbiAgICAgICAgc3RhdGUgPSBudWxsO1xyXG4gICAgXHJcbiAgICBpZiAoc3VpZCAhPT0gbnVsbClcclxuICAgICAgICBzdGF0ZSA9IHNlc3Npb24uc3RhdGVzW3N1aWRdO1xyXG5cclxuICAgICR3LnRyaWdnZXIobmV3ICQuRXZlbnQoJ3BvcHN0YXRlJywge1xyXG4gICAgICAgIHN0YXRlOiBzdGF0ZVxyXG4gICAgfSksICdoYXNoYmFuZ0hpc3RvcnknKTtcclxufSk7XHJcblxyXG4vLyBGb3IgSGlzdG9yeUFQSSBjYXBhYmxlIGJyb3dzZXJzLCB3ZSBuZWVkXHJcbi8vIHRvIGNhcHR1cmUgdGhlIG5hdGl2ZSAncG9wc3RhdGUnIGV2ZW50IHRoYXRcclxuLy8gZ2V0cyB0cmlnZ2VyZWQgb24gb3VyIHB1c2gvcmVwbGFjZVN0YXRlIGJlY2F1c2VcclxuLy8gb2YgdGhlIGxvY2F0aW9uIGNoYW5nZSwgYnV0IHRvbyBvbiB0cmF2ZXJzaW5nXHJcbi8vIHRoZSBoaXN0b3J5IChiYWNrL2ZvcndhcmQpLlxyXG4vLyBXZSB3aWxsIGxvY2sgdGhlIGV2ZW50IGV4Y2VwdCB3aGVuIGlzXHJcbi8vIHRoZSBvbmUgd2UgdHJpZ2dlci5cclxuLy9cclxuLy8gTk9URTogdG8gdGhpcyB0cmljayB0byB3b3JrLCB0aGlzIG11c3RcclxuLy8gYmUgdGhlIGZpcnN0IGhhbmRsZXIgYXR0YWNoZWQgZm9yIHRoaXNcclxuLy8gZXZlbnQsIHNvIGNhbiBibG9jayBhbGwgb3RoZXJzLlxyXG4vLyBBTFRFUk5BVElWRTogaW5zdGVhZCBvZiB0aGlzLCBvbiB0aGVcclxuLy8gcHVzaC9yZXBsYWNlU3RhdGUgbWV0aG9kcyBkZXRlY3QgaWZcclxuLy8gSGlzdG9yeUFQSSBpcyBuYXRpdmUgc3VwcG9ydGVkIGFuZFxyXG4vLyB1c2UgcmVwbGFjZVN0YXRlIHRoZXJlIHJhdGhlciB0aGFuXHJcbi8vIGEgaGFzaCBjaGFuZ2UuXHJcbiR3Lm9uKCdwb3BzdGF0ZScsIGZ1bmN0aW9uKGUsIHNvdXJjZSkge1xyXG4gICAgXHJcbiAgICAvLyBFbnN1cmluZyBpcyB0aGUgb25lIHdlIHRyaWdnZXJcclxuICAgIGlmIChzb3VyY2UgPT09ICdoYXNoYmFuZ0hpc3RvcnknKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIFxyXG4gICAgLy8gSW4gb3RoZXIgY2FzZSwgYmxvY2s6XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG59KTtcclxuXHJcbi8vIEV4cG9zZSBBUElcclxubW9kdWxlLmV4cG9ydHMgPSBoYXNoYmFuZ0hpc3Rvcnk7XHJcbiIsIi8qKlxyXG4gICAgRGVmYXVsdCBidWlsZCBvZiB0aGUgU2hlbGwgY29tcG9uZW50LlxyXG4gICAgSXQgcmV0dXJucyB0aGUgU2hlbGwgY2xhc3MgYXMgYSBtb2R1bGUgcHJvcGVydHksXHJcbiAgICBzZXR0aW5nIHVwIHRoZSBidWlsdC1pbiBtb2R1bGVzIGFzIGl0cyBkZXBlbmRlbmNpZXMsXHJcbiAgICBhbmQgdGhlIGV4dGVybmFsICdqcXVlcnknIGFuZCAnZXZlbnRzJyAoZm9yIHRoZSBFdmVudEVtaXR0ZXIpLlxyXG4gICAgSXQgcmV0dXJucyB0b28gdGhlIGJ1aWx0LWl0IERvbUl0ZW1zTWFuYWdlciBjbGFzcyBhcyBhIHByb3BlcnR5IGZvciBjb252ZW5pZW5jZS5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBkZXBzID0gcmVxdWlyZSgnLi9kZXBlbmRlbmNpZXMnKSxcclxuICAgIERvbUl0ZW1zTWFuYWdlciA9IHJlcXVpcmUoJy4vRG9tSXRlbXNNYW5hZ2VyJyksXHJcbiAgICBwYXJzZVVybCA9IHJlcXVpcmUoJy4vcGFyc2VVcmwnKSxcclxuICAgIGFic29sdXRpemVVcmwgPSByZXF1aXJlKCcuL2Fic29sdXRpemVVcmwnKSxcclxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGxvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyksXHJcbiAgICBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXI7XHJcblxyXG4kLmV4dGVuZChkZXBzLCB7XHJcbiAgICBwYXJzZVVybDogcGFyc2VVcmwsXHJcbiAgICBhYnNvbHV0aXplVXJsOiBhYnNvbHV0aXplVXJsLFxyXG4gICAganF1ZXJ5OiAkLFxyXG4gICAgbG9hZGVyOiBsb2FkZXIsXHJcbiAgICBFdmVudEVtaXR0ZXI6IEV2ZW50RW1pdHRlclxyXG59KTtcclxuXHJcbi8vIERlcGVuZGVuY2llcyBhcmUgcmVhZHksIHdlIGNhbiBsb2FkIHRoZSBjbGFzczpcclxudmFyIFNoZWxsID0gcmVxdWlyZSgnLi9TaGVsbCcpO1xyXG5cclxuZXhwb3J0cy5TaGVsbCA9IFNoZWxsO1xyXG5leHBvcnRzLkRvbUl0ZW1zTWFuYWdlciA9IERvbUl0ZW1zTWFuYWdlcjtcclxuIiwiLyoqXHJcbiAgICBMb2FkZXIgdXRpbGl0eSB0byBsb2FkIFNoZWxsIGl0ZW1zIG9uIGRlbWFuZCB3aXRoIEFKQVhcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIFxyXG4gICAgYmFzZVVybDogJy8nLFxyXG4gICAgXHJcbiAgICBsb2FkOiBmdW5jdGlvbiBsb2FkKHJvdXRlKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnTE9BREVSIFBST01JU0UnLCByb3V0ZSwgcm91dGUubmFtZSk7XHJcbiAgICAgICAgICAgIHJlc29sdmUoJycpO1xyXG4gICAgICAgICAgICAvKiQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IG1vZHVsZS5leHBvcnRzLmJhc2VVcmwgKyByb3V0ZS5uYW1lICsgJy5odG1sJyxcclxuICAgICAgICAgICAgICAgIGNhY2hlOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgLy8gV2UgYXJlIGxvYWRpbmcgdGhlIHByb2dyYW0gYW5kIG5vIGxvYWRlciBzY3JlZW4gaW4gcGxhY2UsXHJcbiAgICAgICAgICAgICAgICAvLyBzbyBhbnkgaW4gYmV0d2VlbiBpbnRlcmFjdGlvbiB3aWxsIGJlIHByb2JsZW1hdGljLlxyXG4gICAgICAgICAgICAgICAgLy9hc3luYzogZmFsc2VcclxuICAgICAgICAgICAgfSkudGhlbihyZXNvbHZlLCByZWplY3QpOyovXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgcGFyc2VVcmwgZnVuY3Rpb24gZGV0ZWN0aW5nXHJcbiAgICB0aGUgbWFpbiBwYXJ0cyBvZiB0aGUgVVJMIGluIGFcclxuICAgIGNvbnZlbmllbmNlIHdheSBmb3Igcm91dGluZy5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBnZXRVcmxRdWVyeSA9IHJlcXVpcmUoJy4uL2dldFVybFF1ZXJ5JyksXHJcbiAgICBlc2NhcGVSZWdFeHAgPSByZXF1aXJlKCcuLi9lc2NhcGVSZWdFeHAnKTtcclxuXHJcbmZ1bmN0aW9uIHBhcnNlVXJsKGJhc2VVcmwsIGxpbmspIHtcclxuXHJcbiAgICBsaW5rID0gbGluayB8fCAnJztcclxuXHJcbiAgICB2YXIgcmF3VXJsID0gbGluaztcclxuXHJcbiAgICAvLyBoYXNoYmFuZyBzdXBwb3J0OiByZW1vdmUgdGhlICMhIG9yIHNpbmdsZSAjIGFuZCB1c2UgdGhlIHJlc3QgYXMgdGhlIGxpbmtcclxuICAgIGxpbmsgPSBsaW5rLnJlcGxhY2UoL14jIS8sICcnKS5yZXBsYWNlKC9eIy8sICcnKTtcclxuICAgIFxyXG4gICAgLy8gcmVtb3ZlIG9wdGlvbmFsIGluaXRpYWwgc2xhc2ggb3IgZG90LXNsYXNoXHJcbiAgICBsaW5rID0gbGluay5yZXBsYWNlKC9eXFwvfF5cXC5cXC8vLCAnJyk7XHJcblxyXG4gICAgLy8gVVJMIFF1ZXJ5IGFzIGFuIG9iamVjdCwgZW1wdHkgb2JqZWN0IGlmIG5vIHF1ZXJ5XHJcbiAgICB2YXIgcXVlcnkgPSBnZXRVcmxRdWVyeShsaW5rIHx8ICc/Jyk7XHJcblxyXG4gICAgLy8gcmVtb3ZlIHF1ZXJ5IGZyb20gdGhlIHJlc3Qgb2YgVVJMIHRvIHBhcnNlXHJcbiAgICBsaW5rID0gbGluay5yZXBsYWNlKC9cXD8uKiQvLCAnJyk7XHJcblxyXG4gICAgLy8gUmVtb3ZlIHRoZSBiYXNlVXJsIHRvIGdldCB0aGUgYXBwIGJhc2UuXHJcbiAgICB2YXIgcGF0aCA9IGxpbmsucmVwbGFjZShuZXcgUmVnRXhwKCdeJyArIGVzY2FwZVJlZ0V4cChiYXNlVXJsKSwgJ2knKSwgJycpO1xyXG5cclxuICAgIC8vIEdldCBmaXJzdCBzZWdtZW50IG9yIHBhZ2UgbmFtZSAoYW55dGhpbmcgdW50aWwgYSBzbGFzaCBvciBleHRlbnNpb24gYmVnZ2luaW5nKVxyXG4gICAgdmFyIG1hdGNoID0gL15cXC8/KFteXFwvXFwuXSspW15cXC9dKihcXC8uKikqJC8uZXhlYyhwYXRoKTtcclxuXHJcbiAgICB2YXIgcGFyc2VkID0ge1xyXG4gICAgICAgIHJvb3Q6IHRydWUsXHJcbiAgICAgICAgbmFtZTogbnVsbCxcclxuICAgICAgICBzZWdtZW50czogbnVsbCxcclxuICAgICAgICBwYXRoOiBudWxsLFxyXG4gICAgICAgIHVybDogcmF3VXJsLFxyXG4gICAgICAgIHF1ZXJ5OiBxdWVyeVxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICBwYXJzZWQucm9vdCA9IGZhbHNlO1xyXG4gICAgICAgIGlmIChtYXRjaFsxXSkge1xyXG4gICAgICAgICAgICBwYXJzZWQubmFtZSA9IG1hdGNoWzFdO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1hdGNoWzJdKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQucGF0aCA9IG1hdGNoWzJdO1xyXG4gICAgICAgICAgICAgICAgcGFyc2VkLnNlZ21lbnRzID0gbWF0Y2hbMl0ucmVwbGFjZSgvXlxcLy8sICcnKS5zcGxpdCgnLycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcGFyc2VkLnBhdGggPSAnLyc7XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQuc2VnbWVudHMgPSBbXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcGFyc2VkO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlVXJsOyIsIi8qKlxyXG4gICAgc2FuaXRpemVVcmwgdXRpbGl0eSB0aGF0IGVuc3VyZXNcclxuICAgIHRoYXQgcHJvYmxlbWF0aWMgcGFydHMgZ2V0IHJlbW92ZWQuXHJcbiAgICBcclxuICAgIEFzIGZvciBub3cgaXQgZG9lczpcclxuICAgIC0gcmVtb3ZlcyBwYXJlbnQgZGlyZWN0b3J5IHN5bnRheFxyXG4gICAgLSByZW1vdmVzIGR1cGxpY2F0ZWQgc2xhc2hlc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gc2FuaXRpemVVcmwodXJsKSB7XHJcbiAgICByZXR1cm4gdXJsLnJlcGxhY2UoL1xcLnsyLH0vZywgJycpLnJlcGxhY2UoL1xcL3syLH0vZywgJy8nKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzYW5pdGl6ZVVybDsiLCIvKiogXHJcbiAgICBBcHBNb2RlbCBleHRlbnNpb24sXHJcbiAgICBmb2N1c2VkIG9uIHRoZSBBY2NvdW50IHJlbGF0ZWQgQVBJczpcclxuICAgIC0gbG9naW5cclxuICAgIC0gbG9nb3V0XHJcbiAgICAtIHNpZ251cFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGxvY2FsZm9yYWdlID0gcmVxdWlyZSgnbG9jYWxmb3JhZ2UnKTtcclxuXHJcbmV4cG9ydHMucGx1Z0luID0gZnVuY3Rpb24gKEFwcE1vZGVsKSB7XHJcbiAgICAvKipcclxuICAgICAgICBUcnkgdG8gcGVyZm9ybSBhbiBhdXRvbWF0aWMgbG9naW4gaWYgdGhlcmUgaXMgYSBsb2NhbFxyXG4gICAgICAgIGNvcHkgb2YgY3JlZGVudGlhbHMgdG8gdXNlIG9uIHRoYXQsXHJcbiAgICAgICAgY2FsbGluZyB0aGUgbG9naW4gbWV0aG9kIHRoYXQgc2F2ZSB0aGUgdXBkYXRlZFxyXG4gICAgICAgIGRhdGEgYW5kIHByb2ZpbGUuXHJcbiAgICAqKi9cclxuICAgIEFwcE1vZGVsLnByb3RvdHlwZS50cnlMb2dpbiA9IGZ1bmN0aW9uIHRyeUxvZ2luKCkge1xyXG4gICAgICAgIC8vIEdldCBzYXZlZCBjcmVkZW50aWFsc1xyXG4gICAgICAgIHJldHVybiBsb2NhbGZvcmFnZS5nZXRJdGVtKCdjcmVkZW50aWFscycpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcclxuICAgICAgICAgICAgLy8gSWYgd2UgaGF2ZSBvbmVzLCB0cnkgdG8gbG9nLWluXHJcbiAgICAgICAgICAgIGlmIChjcmVkZW50aWFscykge1xyXG4gICAgICAgICAgICAgICAgLy8gQXR0ZW1wdCBsb2dpbiB3aXRoIHRoYXRcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxvZ2luKFxyXG4gICAgICAgICAgICAgICAgICAgIGNyZWRlbnRpYWxzLnVzZXJuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIGNyZWRlbnRpYWxzLnBhc3N3b3JkXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBzYXZlZCBjcmVkZW50aWFscycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgICAgUGVyZm9ybXMgYSBsb2dpbiBhdHRlbXB0IHdpdGggdGhlIEFQSSBieSB1c2luZ1xyXG4gICAgICAgIHRoZSBwcm92aWRlZCBjcmVkZW50aWFscy5cclxuICAgICoqL1xyXG4gICAgQXBwTW9kZWwucHJvdG90eXBlLmxvZ2luID0gZnVuY3Rpb24gbG9naW4odXNlcm5hbWUsIHBhc3N3b3JkKSB7XHJcblxyXG4gICAgICAgIC8vIFJlc2V0IHRoZSBleHRyYSBoZWFkZXJzIHRvIGF0dGVtcHQgdGhlIGxvZ2luXHJcbiAgICAgICAgdGhpcy5yZXN0LmV4dHJhSGVhZGVycyA9IG51bGw7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnJlc3QucG9zdCgnbG9naW4nLCB7XHJcbiAgICAgICAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcclxuICAgICAgICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkLFxyXG4gICAgICAgICAgICByZXR1cm5Qcm9maWxlOiB0cnVlXHJcbiAgICAgICAgfSkudGhlbihmdW5jdGlvbihsb2dnZWQpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIHVzZSBhdXRob3JpemF0aW9uIGtleSBmb3IgZWFjaFxyXG4gICAgICAgICAgICAvLyBuZXcgUmVzdCByZXF1ZXN0XHJcbiAgICAgICAgICAgIHRoaXMucmVzdC5leHRyYUhlYWRlcnMgPSB7XHJcbiAgICAgICAgICAgICAgICBhbHU6IGxvZ2dlZC51c2VySUQsXHJcbiAgICAgICAgICAgICAgICBhbGs6IGxvZ2dlZC5hdXRoS2V5XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvLyBhc3luYyBsb2NhbCBzYXZlLCBkb24ndCB3YWl0XHJcbiAgICAgICAgICAgIGxvY2FsZm9yYWdlLnNldEl0ZW0oJ2NyZWRlbnRpYWxzJywge1xyXG4gICAgICAgICAgICAgICAgdXNlcklEOiBsb2dnZWQudXNlcklELFxyXG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxyXG4gICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkLFxyXG4gICAgICAgICAgICAgICAgYXV0aEtleTogbG9nZ2VkLmF1dGhLZXlcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGxvY2FsZm9yYWdlLnNldEl0ZW0oJ3Byb2ZpbGUnLCBsb2dnZWQucHJvZmlsZSk7XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQgdXNlciBkYXRhXHJcbiAgICAgICAgICAgIHRoaXMudXNlcigpLm1vZGVsLnVwZGF0ZVdpdGgobG9nZ2VkLnByb2ZpbGUpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGxvZ2dlZDtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAgICBQZXJmb3JtcyBhIGxvZ291dCwgcmVtb3ZpbmcgY2FjaGVkIGNyZWRlbnRpYWxzXHJcbiAgICAgICAgYW5kIHByb2ZpbGUgc28gdGhlIGFwcCBjYW4gYmUgZmlsbGVkIHVwIHdpdGhcclxuICAgICAgICBuZXcgdXNlciBpbmZvcm1hdGlvbi5cclxuICAgICAgICBJdCBjYWxscyB0byB0aGUgQVBJIGxvZ291dCBjYWxsIHRvbywgdG8gcmVtb3ZlXHJcbiAgICAgICAgYW55IHNlcnZlci1zaWRlIHNlc3Npb24gYW5kIG5vdGlmaWNhdGlvblxyXG4gICAgICAgIChyZW1vdmVzIHRoZSBjb29raWUgdG9vLCBmb3IgYnJvd3NlciBlbnZpcm9ubWVudFxyXG4gICAgICAgIHRoYXQgbWF5IHVzZSBpdCkuXHJcbiAgICAqKi9cclxuICAgIC8vIEZVVFVSRTogVE9SRVZJRVcgaWYgdGhlIC9sb2dvdXQgY2FsbCBjYW4gYmUgcmVtb3ZlZC5cclxuICAgIC8vIFRPRE86IG11c3QgcmVtb3ZlIGFsbCB0aGUgbG9jYWxseSBzYXZlZC9jYWNoZWQgZGF0YVxyXG4gICAgLy8gcmVsYXRlZCB0byB0aGUgdXNlcj9cclxuICAgIEFwcE1vZGVsLnByb3RvdHlwZS5sb2dvdXQgPSBmdW5jdGlvbiBsb2dvdXQoKSB7XHJcblxyXG4gICAgICAgIC8vIExvY2FsIGFwcCBjbG9zZSBzZXNzaW9uXHJcbiAgICAgICAgdGhpcy5yZXN0LmV4dHJhSGVhZGVycyA9IG51bGw7XHJcbiAgICAgICAgbG9jYWxmb3JhZ2UucmVtb3ZlSXRlbSgnY3JlZGVudGlhbHMnKTtcclxuICAgICAgICBsb2NhbGZvcmFnZS5yZW1vdmVJdGVtKCdwcm9maWxlJyk7XHJcblxyXG4gICAgICAgIC8vIERvbid0IG5lZWQgdG8gd2FpdCB0aGUgcmVzdWx0IG9mIHRoZSBSRVNUIG9wZXJhdGlvblxyXG4gICAgICAgIHRoaXMucmVzdC5wb3N0KCdsb2dvdXQnKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAgICBBdHRlbXB0cyB0byBjcmVhdGUgYSB1c2VyIGFjY291bnQsIGdldHRpbmcgbG9nZ2VkXHJcbiAgICAgICAgaWYgc3VjY2Vzc2Z1bGx5IGxpa2Ugd2hlbiBkb2luZyBhIGxvZ2luIGNhbGwuXHJcbiAgICAqKi9cclxuICAgIEFwcE1vZGVsLnByb3RvdHlwZS5zaWdudXAgPSBmdW5jdGlvbiBzaWdudXAodXNlcm5hbWUsIHBhc3N3b3JkLCBwcm9maWxlVHlwZSkge1xyXG5cclxuICAgICAgICAvLyBSZXNldCB0aGUgZXh0cmEgaGVhZGVycyB0byBhdHRlbXB0IHRoZSBzaWdudXBcclxuICAgICAgICB0aGlzLnJlc3QuZXh0cmFIZWFkcmVzID0gbnVsbDtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5wb3N0KCdzaWdudXA/dXRtX3NvdXJjZT1hcHAnLCB7XHJcbiAgICAgICAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcclxuICAgICAgICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkLFxyXG4gICAgICAgICAgICBwcm9maWxlVHlwZTogcHJvZmlsZVR5cGUsXHJcbiAgICAgICAgICAgIHJldHVyblByb2ZpbGU6IHRydWVcclxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKGxvZ2dlZCkge1xyXG4gICAgICAgICAgICAvLyBUaGUgcmVzdWx0IGlzIHRoZSBzYW1lIGFzIGluIGEgbG9naW4sIGFuZFxyXG4gICAgICAgICAgICAvLyB3ZSBkbyB0aGUgc2FtZSBhcyB0aGVyZSB0byBnZXQgdGhlIHVzZXIgbG9nZ2VkXHJcbiAgICAgICAgICAgIC8vIG9uIHRoZSBhcHAgb24gc2lnbi11cCBzdWNjZXNzLlxyXG5cclxuICAgICAgICAgICAgLy8gdXNlIGF1dGhvcml6YXRpb24ga2V5IGZvciBlYWNoXHJcbiAgICAgICAgICAgIC8vIG5ldyBSZXN0IHJlcXVlc3RcclxuICAgICAgICAgICAgdGhpcy5yZXN0LmV4dHJhSGVhZGVycyA9IHtcclxuICAgICAgICAgICAgICAgIGFsdTogbG9nZ2VkLnVzZXJJRCxcclxuICAgICAgICAgICAgICAgIGFsazogbG9nZ2VkLmF1dGhLZXlcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8vIGFzeW5jIGxvY2FsIHNhdmUsIGRvbid0IHdhaXRcclxuICAgICAgICAgICAgbG9jYWxmb3JhZ2Uuc2V0SXRlbSgnY3JlZGVudGlhbHMnLCB7XHJcbiAgICAgICAgICAgICAgICB1c2VySUQ6IGxvZ2dlZC51c2VySUQsXHJcbiAgICAgICAgICAgICAgICB1c2VybmFtZTogdXNlcm5hbWUsXHJcbiAgICAgICAgICAgICAgICBwYXNzd29yZDogcGFzc3dvcmQsXHJcbiAgICAgICAgICAgICAgICBhdXRoS2V5OiBsb2dnZWQuYXV0aEtleVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgbG9jYWxmb3JhZ2Uuc2V0SXRlbSgncHJvZmlsZScsIGxvZ2dlZC5wcm9maWxlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFNldCB1c2VyIGRhdGFcclxuICAgICAgICAgICAgdGhpcy51c2VyKCkubW9kZWwudXBkYXRlV2l0aChsb2dnZWQucHJvZmlsZSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbG9nZ2VkO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICB9O1xyXG59O1xyXG4iLCIvKiogQXBwTW9kZWwgZXh0ZW5zaW9uLFxyXG4gICAgZm9jdXNlZCBvbiB0aGUgRXZlbnRzIEFQSVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG52YXIgQ2FsZW5kYXJFdmVudCA9IHJlcXVpcmUoJy4uL21vZGVscy9DYWxlbmRhckV2ZW50JyksXHJcbiAgICBhcGlIZWxwZXIgPSByZXF1aXJlKCcuLi91dGlscy9hcGlIZWxwZXInKTtcclxuXHJcbmV4cG9ydHMucGx1Z0luID0gZnVuY3Rpb24gKEFwcE1vZGVsKSB7XHJcbiAgICBcclxuICAgIGFwaUhlbHBlci5kZWZpbmVDcnVkQXBpRm9yUmVzdCh7XHJcbiAgICAgICAgZXh0ZW5kZWRPYmplY3Q6IEFwcE1vZGVsLnByb3RvdHlwZSxcclxuICAgICAgICBNb2RlbDogQ2FsZW5kYXJFdmVudCxcclxuICAgICAgICBtb2RlbE5hbWU6ICdDYWxlbmRhckV2ZW50JyxcclxuICAgICAgICBtb2RlbExpc3ROYW1lOiAnQ2FsZW5kYXJFdmVudHMnLFxyXG4gICAgICAgIG1vZGVsVXJsOiAnZXZlbnRzJyxcclxuICAgICAgICBpZFByb3BlcnR5TmFtZTogJ2NhbGVuZGFyRXZlbnRJRCdcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvKiogIyBBUElcclxuICAgICAgICBBcHBNb2RlbC5wcm90b3R5cGUuZ2V0RXZlbnRzOjpcclxuICAgICAgICBAcGFyYW0ge29iamVjdH0gZmlsdGVyczoge1xyXG4gICAgICAgICAgICBzdGFydDogRGF0ZSxcclxuICAgICAgICAgICAgZW5kOiBEYXRlLFxyXG4gICAgICAgICAgICB0eXBlczogWzMsIDVdIC8vIFtvcHRpb25hbF0gTGlzdCBFdmVudFR5cGVzSURzXHJcbiAgICAgICAgfVxyXG4gICAgICAgIC0tLVxyXG4gICAgICAgIEFwcE1vZGVsLnByb3RvdHlwZS5nZXRFdmVudFxyXG4gICAgICAgIC0tLVxyXG4gICAgICAgIEFwcE1vZGVsLnByb3RvdHlwZS5wdXRFdmVudFxyXG4gICAgICAgIC0tLVxyXG4gICAgICAgIEFwcE1vZGVsLnByb3RvdHlwZS5wb3N0RXZlbnRcclxuICAgICAgICAtLS1cclxuICAgICAgICBBcHBNb2RlbC5wcm90b3R5cGUuZGVsRXZlbnRcclxuICAgICAgICAtLS1cclxuICAgICAgICBBcHBNb2RlbC5wcm90b3R5cGUuc2V0RXZlbnRcclxuICAgICoqL1xyXG59OyIsIi8qKlxyXG4gICAgTW9kZWwgQVBJIHRvIG1hbmFnZSB0aGUgY29sbGVjdGlvbiBvZiBKb2IgVGl0bGVzIGFzc2lnbmVkXHJcbiAgICB0byB0aGUgY3VycmVudCB1c2VyIGFuZCBpdHMgd29ya2luZyBkYXRhLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuZXhwb3J0cy5wbHVnSW4gPSBmdW5jdGlvbiAoQXBwTW9kZWwpIHtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgR2V0IHRoZSBjb21wbGV0ZSBsaXN0IG9mIFVzZXJKb2JUaXRsZSBmb3JcclxuICAgICAgICBhbGwgdGhlIEpvYlRpdGxlcyBhc3NpZ25lZCB0byB0aGUgY3VycmVudCB1c2VyXHJcbiAgICAqKi9cclxuICAgIEFwcE1vZGVsLnByb3RvdHlwZS5nZXRVc2VySm9iUHJvZmlsZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBUT0RPXHJcbiAgICAgICAgLy8gVGVzdCBkYXRhXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShcclxuICAgICAgICAgICAgW11cclxuICAgICAgICApO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgR2V0IGEgVXNlckpvYlRpdGxlIHJlY29yZCBmb3IgdGhlIGdpdmVuXHJcbiAgICAgICAgSm9iVGl0bGVJRCBhbmQgdGhlIGN1cnJlbnQgdXNlci5cclxuICAgICoqL1xyXG4gICAgQXBwTW9kZWwucHJvdG90eXBlLmdldFVzZXJKb2JUaXRsZSA9IGZ1bmN0aW9uIChqb2JUaXRsZUlEKSB7XHJcbiAgICAgICAgLy8gVE9ET1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XHJcbiAgICB9O1xyXG59O1xyXG4iLCIvKiogQ2FsZW5kYXIgU3luY2luZyBhcHAgbW9kZWxcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBDYWxlbmRhclN5bmNpbmcgPSByZXF1aXJlKCcuLi9tb2RlbHMvQ2FsZW5kYXJTeW5jaW5nJyksXHJcbiAgICBSZW1vdGVNb2RlbCA9IHJlcXVpcmUoJy4uL3V0aWxzL1JlbW90ZU1vZGVsJyk7XHJcblxyXG5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShhcHBNb2RlbCkge1xyXG4gICAgdmFyIHJlbSA9IG5ldyBSZW1vdGVNb2RlbCh7XHJcbiAgICAgICAgZGF0YTogbmV3IENhbGVuZGFyU3luY2luZygpLFxyXG4gICAgICAgIHR0bDogeyBtaW51dGVzOiAxIH0sXHJcbiAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uIGZldGNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5nZXQoJ2NhbGVuZGFyLXN5bmNpbmcnKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1c2g6IGZ1bmN0aW9uIHB1c2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LnB1dCgnY2FsZW5kYXItc3luY2luZycsIHRoaXMuZGF0YS5tb2RlbC50b1BsYWluT2JqZWN0KCkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBFeHRlbmRpbmcgd2l0aCB0aGUgc3BlY2lhbCBBUEkgbWV0aG9kICdyZXNldEV4cG9ydFVybCdcclxuICAgIHJlbS5pc1Jlc2V0aW5nID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcbiAgICByZW0ucmVzZXRFeHBvcnRVcmwgPSBmdW5jdGlvbiByZXNldEV4cG9ydFVybCgpIHtcclxuICAgICAgICBcclxuICAgICAgICByZW0uaXNSZXNldGluZyh0cnVlKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QucG9zdCgnY2FsZW5kYXItc3luY2luZy9yZXNldC1leHBvcnQtdXJsJylcclxuICAgICAgICAudGhlbihmdW5jdGlvbih1cGRhdGVkU3luY1NldHRpbmdzKSB7XHJcbiAgICAgICAgICAgIC8vIFVwZGF0aW5nIHRoZSBjYWNoZWQgZGF0YVxyXG4gICAgICAgICAgICByZW0uZGF0YS5tb2RlbC51cGRhdGVXaXRoKHVwZGF0ZWRTeW5jU2V0dGluZ3MpO1xyXG4gICAgICAgICAgICByZW0uaXNSZXNldGluZyhmYWxzZSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdXBkYXRlZFN5bmNTZXR0aW5ncztcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHJlbTtcclxufTtcclxuIiwiLyoqIEFwcE1vZGVsLCBjZW50cmFsaXplcyBhbGwgdGhlIGRhdGEgZm9yIHRoZSBhcHAsXHJcbiAgICBjYWNoaW5nIGFuZCBzaGFyaW5nIGRhdGEgYWNyb3NzIGFjdGl2aXRpZXMgYW5kIHBlcmZvcm1pbmdcclxuICAgIHJlcXVlc3RzXHJcbioqL1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuLi9tb2RlbHMvTW9kZWwnKSxcclxuICAgIFVzZXIgPSByZXF1aXJlKCcuLi9tb2RlbHMvVXNlcicpLFxyXG4gICAgUmVzdCA9IHJlcXVpcmUoJy4uL3V0aWxzL1Jlc3QnKSxcclxuICAgIGxvY2FsZm9yYWdlID0gcmVxdWlyZSgnbG9jYWxmb3JhZ2UnKTtcclxuXHJcbmZ1bmN0aW9uIEFwcE1vZGVsKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHVzZXI6IFVzZXIubmV3QW5vbnltb3VzKClcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2NoZWR1bGluZ1ByZWZlcmVuY2VzID0gcmVxdWlyZSgnLi9BcHBNb2RlbC5zY2hlZHVsaW5nUHJlZmVyZW5jZXMnKS5jcmVhdGUodGhpcyk7XHJcbiAgICB0aGlzLmNhbGVuZGFyU3luY2luZyA9IHJlcXVpcmUoJy4vQXBwTW9kZWwuY2FsZW5kYXJTeW5jaW5nJykuY3JlYXRlKHRoaXMpO1xyXG4gICAgdGhpcy5zaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUgPSByZXF1aXJlKCcuL0FwcE1vZGVsLnNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZScpLmNyZWF0ZSh0aGlzKTtcclxufVxyXG5cclxucmVxdWlyZSgnLi9BcHBNb2RlbC1hY2NvdW50JykucGx1Z0luKEFwcE1vZGVsKTtcclxuXHJcbi8qKiBJbml0aWFsaXplIGFuZCB3YWl0IGZvciBhbnl0aGluZyB1cCAqKi9cclxuQXBwTW9kZWwucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiBpbml0KCkge1xyXG4gICAgXHJcbiAgICAvLyBOT1RFOiBVUkwgdG8gYmUgdXBkYXRlZFxyXG4gICAgdGhpcy5yZXN0ID0gbmV3IFJlc3QoJ2h0dHA6Ly9kZXYubG9jb25vbWljcy5jb20vYXBpL3YxL2VuLVVTLycpO1xyXG4gICAgLy90aGlzLnJlc3QgPSBuZXcgUmVzdCgnaHR0cDovL2xvY2FsaG9zdC9zb3VyY2UvYXBpL3YxL2VuLVVTLycpO1xyXG4gICAgXHJcbiAgICAvLyBTZXR1cCBSZXN0IGF1dGhlbnRpY2F0aW9uXHJcbiAgICB0aGlzLnJlc3Qub25BdXRob3JpemF0aW9uUmVxdWlyZWQgPSBmdW5jdGlvbihyZXRyeSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMudHJ5TG9naW4oKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAvLyBMb2dnZWQhIEp1c3QgcmV0cnlcclxuICAgICAgICAgICAgcmV0cnkoKTtcclxuICAgICAgICB9KTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuICAgIFxyXG4gICAgLy8gTG9jYWwgZGF0YVxyXG4gICAgLy8gVE9ETyBJbnZlc3RpZ2F0ZSB3aHkgYXV0b21hdGljIHNlbGVjdGlvbiBhbiBJbmRleGVkREIgYXJlXHJcbiAgICAvLyBmYWlsaW5nIGFuZCB3ZSBuZWVkIHRvIHVzZSB0aGUgd29yc2UtcGVyZm9ybWFuY2UgbG9jYWxzdG9yYWdlIGJhY2stZW5kXHJcbiAgICBsb2NhbGZvcmFnZS5jb25maWcoe1xyXG4gICAgICAgIG5hbWU6ICdMb2Nvbm9taWNzQXBwJyxcclxuICAgICAgICB2ZXJzaW9uOiAwLjEsXHJcbiAgICAgICAgc2l6ZSA6IDQ5ODA3MzYsIC8vIFNpemUgb2YgZGF0YWJhc2UsIGluIGJ5dGVzLiBXZWJTUUwtb25seSBmb3Igbm93LlxyXG4gICAgICAgIHN0b3JlTmFtZSA6ICdrZXl2YWx1ZXBhaXJzJyxcclxuICAgICAgICBkZXNjcmlwdGlvbiA6ICdMb2Nvbm9taWNzIEFwcCcsXHJcbiAgICAgICAgZHJpdmVyOiBsb2NhbGZvcmFnZS5MT0NBTFNUT1JBR0VcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEluaXRpYWxpemU6IGNoZWNrIHRoZSB1c2VyIGhhcyBsb2dpbiBkYXRhIGFuZCBuZWVkZWRcclxuICAgIC8vIGNhY2hlZCBkYXRhXHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcblxyXG4gICAgICAgIC8vIENhbGxiYWNrIHRvIGp1c3QgcmVzb2x2ZSB3aXRob3V0IGVycm9yIChwYXNzaW5nIGluIHRoZSBlcnJvclxyXG4gICAgICAgIC8vIHRvIHRoZSAncmVzb2x2ZScgd2lsbCBtYWtlIHRoZSBwcm9jZXNzIHRvIGZhaWwpLFxyXG4gICAgICAgIC8vIHNpbmNlIHdlIGRvbid0IG5lZWQgdG8gY3JlYXRlIGFuIGVycm9yIGZvciB0aGVcclxuICAgICAgICAvLyBhcHAgaW5pdCwgaWYgdGhlcmUgaXMgbm90IGVub3VnaCBzYXZlZCBpbmZvcm1hdGlvblxyXG4gICAgICAgIC8vIHRoZSBhcHAgaGFzIGNvZGUgdG8gcmVxdWVzdCBhIGxvZ2luLlxyXG4gICAgICAgIHZhciByZXNvbHZlQW55d2F5ID0gZnVuY3Rpb24oZG9lc25NYXR0ZXIpeyAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybmluZygnQXBwIE1vZGVsIEluaXQgZXJyJywgZG9lc25NYXR0ZXIpO1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBJZiB0aGVyZSBhcmUgY3JlZGVudGlhbHMgc2F2ZWRcclxuICAgICAgICBsb2NhbGZvcmFnZS5nZXRJdGVtKCdjcmVkZW50aWFscycpLnRoZW4oZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChjcmVkZW50aWFscyAmJlxyXG4gICAgICAgICAgICAgICAgY3JlZGVudGlhbHMudXNlcklEICYmXHJcbiAgICAgICAgICAgICAgICBjcmVkZW50aWFscy51c2VybmFtZSAmJlxyXG4gICAgICAgICAgICAgICAgY3JlZGVudGlhbHMuYXV0aEtleSkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIHVzZSBhdXRob3JpemF0aW9uIGtleSBmb3IgZWFjaFxyXG4gICAgICAgICAgICAgICAgLy8gbmV3IFJlc3QgcmVxdWVzdFxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXN0LmV4dHJhSGVhZGVycyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBhbHU6IGNyZWRlbnRpYWxzLnVzZXJJRCxcclxuICAgICAgICAgICAgICAgICAgICBhbGs6IGNyZWRlbnRpYWxzLmF1dGhLZXlcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIEl0IGhhcyBjcmVkZW50aWFscyEgSGFzIGJhc2ljIHByb2ZpbGUgZGF0YT9cclxuICAgICAgICAgICAgICAgIGxvY2FsZm9yYWdlLmdldEl0ZW0oJ3Byb2ZpbGUnKS50aGVuKGZ1bmN0aW9uKHByb2ZpbGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdXNlciBkYXRhXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXNlcigpLm1vZGVsLnVwZGF0ZVdpdGgocHJvZmlsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVuZCBzdWNjZXNmdWxseVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBObyBwcm9maWxlLCB3ZSBuZWVkIHRvIHJlcXVlc3QgaXQgdG8gYmUgYWJsZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0byB3b3JrIGNvcnJlY3RseSwgc28gd2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXR0ZW1wdCBhIGxvZ2luICh0aGUgdHJ5TG9naW4gcHJvY2VzcyBwZXJmb3Jtc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhIGxvZ2luIHdpdGggdGhlIHNhdmVkIGNyZWRlbnRpYWxzIGFuZCBmZXRjaFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgcHJvZmlsZSB0byBzYXZlIGl0IGluIHRoZSBsb2NhbCBjb3B5KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyeUxvZ2luKCkudGhlbihyZXNvbHZlLCByZXNvbHZlQW55d2F5KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LmJpbmQodGhpcyksIHJlc29sdmVBbnl3YXkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gRW5kIHN1Y2Nlc3NmdWxseS4gTm90IGxvZ2dpbiBpcyBub3QgYW4gZXJyb3IsXHJcbiAgICAgICAgICAgICAgICAvLyBpcyBqdXN0IHRoZSBmaXJzdCBhcHAgc3RhcnQtdXBcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKSwgcmVzb2x2ZUFueXdheSk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59O1xyXG5cclxuQXBwTW9kZWwucHJvdG90eXBlLmdldFVwY29taW5nQm9va2luZ3MgPSBmdW5jdGlvbiBnZXRVcGNvbWluZ0Jvb2tpbmdzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVzdC5nZXQoJ3VwY29taW5nLWJvb2tpbmdzJyk7XHJcbn07XHJcblxyXG5BcHBNb2RlbC5wcm90b3R5cGUuZ2V0Qm9va2luZyA9IGZ1bmN0aW9uIGdldEJvb2tpbmcoaWQpIHtcclxuICAgIHJldHVybiB0aGlzLnJlc3QuZ2V0KCdnZXQtYm9va2luZycsIHsgYm9va2luZ0lEOiBpZCB9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXBwTW9kZWw7XHJcblxyXG4vLyBDbGFzcyBzcGxpdGVkIGluIGRpZmZlcmVudCBmaWxlcyB0byBtaXRpZ2F0ZSBzaXplIGFuZCBvcmdhbml6YXRpb25cclxuLy8gYnV0IGtlZXBpbmcgYWNjZXNzIHRvIHRoZSBjb21tb24gc2V0IG9mIG1ldGhvZHMgYW5kIG9iamVjdHMgZWFzeSB3aXRoXHJcbi8vIHRoZSBzYW1lIGNsYXNzLlxyXG4vLyBMb2FkaW5nIGV4dGVuc2lvbnM6XHJcbnJlcXVpcmUoJy4vQXBwTW9kZWwtZXZlbnRzJykucGx1Z0luKEFwcE1vZGVsKTtcclxucmVxdWlyZSgnLi9BcHBNb2RlbC11c2VySm9iUHJvZmlsZScpLnBsdWdJbihBcHBNb2RlbCk7XHJcbiIsIi8qKlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFNjaGVkdWxpbmdQcmVmZXJlbmNlcyA9IHJlcXVpcmUoJy4uL21vZGVscy9TY2hlZHVsaW5nUHJlZmVyZW5jZXMnKTtcclxuXHJcbnZhciBSZW1vdGVNb2RlbCA9IHJlcXVpcmUoJy4uL3V0aWxzL1JlbW90ZU1vZGVsJyk7XHJcblxyXG5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShhcHBNb2RlbCkge1xyXG4gICAgcmV0dXJuIG5ldyBSZW1vdGVNb2RlbCh7XHJcbiAgICAgICAgZGF0YTogbmV3IFNjaGVkdWxpbmdQcmVmZXJlbmNlcygpLFxyXG4gICAgICAgIHR0bDogeyBtaW51dGVzOiAxIH0sXHJcbiAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uIGZldGNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5nZXQoJ3NjaGVkdWxpbmctcHJlZmVyZW5jZXMnKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1c2g6IGZ1bmN0aW9uIHB1c2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LnB1dCgnc2NoZWR1bGluZy1wcmVmZXJlbmNlcycsIHRoaXMuZGF0YS5tb2RlbC50b1BsYWluT2JqZWN0KCkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKipcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBTaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUgPSByZXF1aXJlKCcuLi9tb2RlbHMvU2ltcGxpZmllZFdlZWtseVNjaGVkdWxlJyksXHJcbiAgICBSZW1vdGVNb2RlbCA9IHJlcXVpcmUoJy4uL3V0aWxzL1JlbW90ZU1vZGVsJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbi8vIFRoZSBzbG90IHNpemUgaXMgZml4ZWQgdG8gMTUgbWludXRlcyBieSBkZWZhdWx0LlxyXG4vLyBOT1RFOiBjdXJyZW50bHksIHRoZSBBUEkgb25seSBhbGxvd3MgMTUgbWludXRlcyBzbG90cyxcclxuLy8gYmVpbmcgdGhhdCBpbXBsaWNpdCwgYnV0IHBhcnQgb2YgdGhlIGNvZGUgaXMgcmVhZHkgZm9yIGV4cGxpY2l0IHNsb3RTaXplLlxyXG52YXIgZGVmYXVsdFNsb3RTaXplID0gMTU7XHJcbi8vIEEgbGlzdCBvZiB3ZWVrIGRheSBwcm9wZXJ0aWVzIG5hbWVzIGFsbG93ZWRcclxuLy8gdG8gYmUgcGFydCBvZiB0aGUgb2JqZWN0cyBkZXNjcmliaW5nIHdlZWtseSBzY2hlZHVsZVxyXG4vLyAoc2ltcGxpZmllZCBvciBjb21wbGV0ZS9zbG90IGJhc2VkKVxyXG4vLyBKdXN0IGxvd2VjYXNlZCBlbmdsaXNoIG5hbWVzXHJcbnZhciB3ZWVrRGF5UHJvcGVydGllcyA9IFsnc3VuZGF5JywgJ21vbmRheScsICd0dWVzZGF5JywgJ3dlZG5lc2RheScsICd0aHVyc2RheScsICdmcmlkYXknLCAnc2F0dXJkYXknXTtcclxuXHJcbmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKGFwcE1vZGVsKSB7XHJcbiAgICByZXR1cm4gbmV3IFJlbW90ZU1vZGVsKHtcclxuICAgICAgICBkYXRhOiBuZXcgU2ltcGxpZmllZFdlZWtseVNjaGVkdWxlKCksXHJcbiAgICAgICAgdHRsOiB7IG1pbnV0ZXM6IDEgfSxcclxuICAgICAgICBmZXRjaDogZnVuY3Rpb24gZmV0Y2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgnYXZhaWxhYmlsaXR5L3dlZWtseS1zY2hlZHVsZScpXHJcbiAgICAgICAgICAgIC50aGVuKGZyb21XZWVrbHlTY2hlZHVsZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXNoOiBmdW5jdGlvbiBwdXNoKCkge1xyXG4gICAgICAgICAgICB2YXIgcGxhaW5EYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgJ2FsbC10aW1lJzogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAnanNvbi1kYXRhJzoge31cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZGF0YS5pc0FsbFRpbWUoKSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgcGxhaW5EYXRhWydhbGwtdGltZSddID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHBsYWluRGF0YVsnanNvbi1kYXRhJ10gPSBKU09OLnN0cmluZ2lmeSh0b1dlZWtseVNjaGVkdWxlKHRoaXMuZGF0YS5tb2RlbC50b1BsYWluT2JqZWN0KHRydWUpKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LnB1dCgnYXZhaWxhYmlsaXR5L3dlZWtseS1zY2hlZHVsZScsIHBsYWluRGF0YSlcclxuICAgICAgICAgICAgLnRoZW4oZnJvbVdlZWtseVNjaGVkdWxlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGZyb21XZWVrbHlTY2hlZHVsZSh3ZWVrbHlTY2hlZHVsZSkge1xyXG4gICAgXHJcbiAgICAvLyBOZXcgc2ltcGxpZmllZCBvYmplY3QsIGFzIGEgcGxhaW4gb2JqZWN0IHdpdGhcclxuICAgIC8vIHdlZWtkYXlzIHByb3BlcnRpZXMgYW5kIGZyb20tdG8gcHJvcGVydGllcyBsaWtlOlxyXG4gICAgLy8geyBzdW5kYXk6IHsgZnJvbTogMCwgdG86IDYwIH0gfVxyXG4gICAgLy8gU2luY2UgdGhpcyBpcyBleHBlY3RlZCB0byBiZSBjb25zdW1lZCBieSBmZXRjaC1wdXNoXHJcbiAgICAvLyBvcGVyYXRpb25zLCBhbmQgbGF0ZXIgYnkgYW4gJ21vZGVsLnVwZGF0ZVdpdGgnIG9wZXJhdGlvbixcclxuICAgIC8vIHNvIHBsYWluIGlzIHNpbXBsZSBhbmQgYmV0dGVyIG9uIHBlcmZvcm1hbmNlOyBjYW4gYmVcclxuICAgIC8vIGNvbnZlcnRlZCBlYXNpbHkgdG8gdGhlIFNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSBvYmplY3QuXHJcbiAgICB2YXIgc2ltcGxlV1MgPSB7fTtcclxuICAgIFxyXG4gICAgLy8gT25seSBzdXBwb3J0cyAnYXZhaWxhYmxlJyBzdGF0dXMgd2l0aCBkZWZhdWx0ICd1bmF2YWlsYWJsZSdcclxuICAgIGlmICh3ZWVrbHlTY2hlZHVsZS5kZWZhdWx0U3RhdHVzICE9PSAndW5hdmFpbGFibGUnIHx8XHJcbiAgICAgICAgd2Vla2x5U2NoZWR1bGUuc3RhdHVzICE9PSAnYXZhaWxhYmxlJykge1xyXG4gICAgICAgIHRocm93IHtcclxuICAgICAgICAgICAgbmFtZTogJ2lucHV0LWZvcm1hdCcsXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdXZWVrbHkgc2NoZWR1bGUsIGdpdmVuIHN0YXR1c2VzIG5vdCBzdXBwb3J0ZWQsIHN0YXR1czogJyArXHJcbiAgICAgICAgICAgIHdlZWtseVNjaGVkdWxlLnN0YXR1cyArICcsIGRlZmF1bHRTdGF0dXM6ICcgKyBcclxuICAgICAgICAgICAgd2Vla2x5U2NoZWR1bGUuZGVmYXVsdFN0YXR1c1xyXG4gICAgICAgICAgfTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gZ2l2ZW4gc2xvdFNpemUgb3IgZGVmYXVsdFxyXG4gICAgdmFyIHNsb3RTaXplID0gd2Vla2x5U2NoZWR1bGUuc2xvdFNpemUgfHwgZGVmYXVsdFNsb3RTaXplO1xyXG5cclxuICAgIC8vIFJlYWQgc2xvdHMgcGVyIHdlZWstZGF5ICh7IHNsb3RzOiB7IFwic3VuZGF5XCI6IFtdIH0gfSlcclxuICAgIE9iamVjdC5rZXlzKHdlZWtseVNjaGVkdWxlLnNsb3RzKVxyXG4gICAgLmZvckVhY2goZnVuY3Rpb24od2Vla2RheSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFZlcmlmeSBpcyBhIHdlZWtkYXkgcHJvcGVydHksIG9yIGV4aXQgZWFybHlcclxuICAgICAgICBpZiAod2Vla0RheVByb3BlcnRpZXMuaW5kZXhPZih3ZWVrZGF5KSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB2YXIgZGF5c2xvdHMgPSB3ZWVrbHlTY2hlZHVsZS5zbG90c1t3ZWVrZGF5XTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBXZSBnZXQgdGhlIGZpcnN0IGF2YWlsYWJsZSBzbG90IGFuZCB0aGUgbGFzdCBjb25zZWN1dGl2ZVxyXG4gICAgICAgIC8vIHRvIG1ha2UgdGhlIHJhbmdlXHJcbiAgICAgICAgdmFyIGZyb20gPSBudWxsLFxyXG4gICAgICAgICAgICB0byA9IG51bGwsXHJcbiAgICAgICAgICAgIHByZXZpb3VzID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gdGltZXMgYXJlIG9yZGVyZWQgaW4gYXNjZW5kaW5nXHJcbiAgICAgICAgLy8gYW5kIHdpdGggZm9ybWF0IFwiMDA6MDA6MDBcIiB0aGF0IHdlIGNvbnZlcnQgdG8gbWludXRlc1xyXG4gICAgICAgIC8vIChlbm91Z2ggcHJlY2lzaW9uIGZvciBzaW1wbGlmaWVkIHdlZWtseSBzY2hlZHVsZSlcclxuICAgICAgICAvLyB1c2luZyBtb21lbnQuZHVyYXRpb25cclxuICAgICAgICAvLyBOT1RFOiB1c2luZyAnc29tZScgcmF0aGVyIHRoYW4gJ2ZvckVhY2gnIHRvIGJlIGFibGVcclxuICAgICAgICAvLyB0byBleGl0IGVhcmx5IGZyb20gdGhlIGl0ZXJhdGlvbiBieSByZXR1cm5pbmcgJ3RydWUnXHJcbiAgICAgICAgLy8gd2hlbiB0aGUgZW5kIGlzIHJlYWNoZWQuXHJcbiAgICAgICAgZGF5c2xvdHMuc29tZShmdW5jdGlvbihzbG90KSB7XHJcbiAgICAgICAgICAgIHZhciBtaW51dGVzID0gbW9tZW50LmR1cmF0aW9uKHNsb3QpLmFzTWludXRlcygpIHwwO1xyXG4gICAgICAgICAgICAvLyBXZSBoYXZlIG5vdCBzdGlsbCBhICdmcm9tJyB0aW1lOlxyXG4gICAgICAgICAgICBpZiAoZnJvbSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgZnJvbSA9IG1pbnV0ZXM7XHJcbiAgICAgICAgICAgICAgICBwcmV2aW91cyA9IG1pbnV0ZXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBXZSBoYXZlIGEgYmVnZ2luaW5nLCBjaGVjayBpZiB0aGlzIGlzIGNvbnNlY3V0aXZlXHJcbiAgICAgICAgICAgICAgICAvLyB0byBwcmV2aW91cywgYnkgY2hlY2tpbmcgcHJldmlvdXMgcGx1cyBzbG90U2l6ZVxyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZpb3VzICsgc2xvdFNpemUgPT09IG1pbnV0ZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBOZXcgZW5kXHJcbiAgICAgICAgICAgICAgICAgICAgdG8gPSBtaW51dGVzO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIE5leHQgaXRlcmF0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgcHJldmlvdXMgPSBtaW51dGVzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTm8gY29uc2VjdXRpdmUsIHdlIGFscmVhZHkgaGFzIGEgcmFuZ2UsIGFueVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGFkZGl0aW9uYWwgc2xvdCBpcyBkaXNjYXJkZWQsIG91dCBvZiB0aGVcclxuICAgICAgICAgICAgICAgICAgICAvLyBwcmVjaXNpb24gb2YgdGhlIHNpbXBsaWZpZWQgd2Vla2x5IHNjaGVkdWxlLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHNvIHdlIGNhbiBnbyBvdXQgdGhlIGl0ZXJhdGlvbjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAvLyBOT1RFOiBJZiBpbiBhIGZ1dHVyZSBhIG1vcmUgY29tcGxldGUgc2NoZWR1bGVcclxuICAgICAgICAgICAgICAgICAgICAvLyBuZWVkIHRvIGJlIHdyb3RlbiB1c2luZyBtdWx0aXBsZSByYW5nZXMgcmF0aGVyXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaW5kaXZpZHVhbCBzbG90cywgdGhpcyBpcyB0aGUgcGxhY2UgdG8gY29udGludWVcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb2RpbmcsIHBvcHVsYXRpbmcgYW4gYXJyYXkgb2YgW3tmcm9tLCB0b31dIDotKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gU2xvdHMgY2hlY2tlZCwgY2hlY2sgdGhlIHJlc3VsdFxyXG4gICAgICAgIGlmIChmcm9tICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgc2ltcGxlRGF5ID0ge1xyXG4gICAgICAgICAgICAgICAgZnJvbTogZnJvbSxcclxuICAgICAgICAgICAgICAgIHRvOiAwXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHNpbXBsZVdTW3dlZWtkYXldID0gc2ltcGxlRGF5O1xyXG5cclxuICAgICAgICAgICAgLy8gV2UgaGF2ZSBhIHJhbmdlIVxyXG4gICAgICAgICAgICBpZiAodG8gIT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIC8vIGFuZCBoYXMgYW4gZW5kIVxyXG4gICAgICAgICAgICAgICAgLy8gYWRkIHRoZSBzbG90IHNpemUgdG8gdGhlIGVuZGluZ1xyXG4gICAgICAgICAgICAgICAgc2ltcGxlRGF5LnRvID0gdG8gKyBzbG90U2l6ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIHNtYWxsZXIgcmFuZ2UsIGp1c3Qgb25lIHNsb3QsXHJcbiAgICAgICAgICAgICAgICAvLyBhZGQgdGhlIHNsb3Qgc2l6ZSB0byB0aGUgYmVnaW5pbmdcclxuICAgICAgICAgICAgICAgIHNpbXBsZURheS50byA9IGZyb20gKyBzbG90U2l6ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBEb25lIVxyXG4gICAgcmV0dXJuIHNpbXBsZVdTO1xyXG59XHJcblxyXG4vKipcclxuICAgIFBhc3MgaW4gYSBwbGFpbiBvYmplY3QsIG5vdCBhIG1vZGVsLFxyXG4gICAgZ2V0dGluZyBhbiBvYmplY3Qgc3VpdGFibGUgZm9yIHRoZSBBUEkgZW5kcG9pbnQuXHJcbioqL1xyXG5mdW5jdGlvbiB0b1dlZWtseVNjaGVkdWxlKHNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSkge1xyXG5cclxuICAgIHZhciBzbG90U2l6ZSA9IGRlZmF1bHRTbG90U2l6ZTtcclxuICAgIFxyXG4gICAgLy8gSXQncyBidWlsZCB3aXRoICdhdmFpbGFibGUnIGFzIGV4cGxpY2l0IHN0YXR1czpcclxuICAgIHZhciB3ZWVrbHlTY2hlZHVsZSA9IHtcclxuICAgICAgICBzdGF0dXM6ICdhdmFpbGFibGUnLFxyXG4gICAgICAgIGRlZmF1bHRBdmFpbGFiaWxpdHk6ICd1bmF2YWlsYWJsZScsXHJcbiAgICAgICAgc2xvdHM6IHt9LFxyXG4gICAgICAgIHNsb3RTaXplOiBzbG90U2l6ZVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBQZXIgd2Vla2RheVxyXG4gICAgT2JqZWN0LmtleXMoc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlKVxyXG4gICAgLmZvckVhY2goZnVuY3Rpb24od2Vla2RheSkge1xyXG5cclxuICAgICAgICAvLyBWZXJpZnkgaXMgYSB3ZWVrZGF5IHByb3BlcnR5LCBvciBleGl0IGVhcmx5XHJcbiAgICAgICAgaWYgKHdlZWtEYXlQcm9wZXJ0aWVzLmluZGV4T2Yod2Vla2RheSkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzaW1wbGVEYXkgPSBzaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGVbd2Vla2RheV07XHJcblxyXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gZXhwYW5kIHRoZSBzaW1wbGlmaWVkIHRpbWUgcmFuZ2VzIFxyXG4gICAgICAgIC8vIGluIHNsb3RzIG9mIHRoZSBzbG90U2l6ZVxyXG4gICAgICAgIC8vIFRoZSBlbmQgdGltZSB3aWxsIGJlIGV4Y2x1ZGVkLCBzaW5jZSBzbG90c1xyXG4gICAgICAgIC8vIGRlZmluZSBvbmx5IHRoZSBzdGFydCwgYmVpbmcgaW1wbGljaXQgdGhlIHNsb3RTaXplLlxyXG4gICAgICAgIHZhciBmcm9tID0gc2ltcGxlRGF5LmZyb20sXHJcbiAgICAgICAgICAgIHRvID0gc2ltcGxlRGF5LnRvO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgdGhlIHNsb3QgYXJyYXlcclxuICAgICAgICB3ZWVrbHlTY2hlZHVsZS5zbG90c1t3ZWVrZGF5XSA9IFtdO1xyXG5cclxuICAgICAgICAvLyBJbnRlZ3JpdHkgdmVyaWZpY2F0aW9uXHJcbiAgICAgICAgaWYgKHRvID4gZnJvbSkge1xyXG4gICAgICAgICAgICAvLyBJdGVyYXRlIGJ5IHRoZSBzbG90U2l6ZSB1bnRpbCB3ZSByZWFjaFxyXG4gICAgICAgICAgICAvLyB0aGUgZW5kLCBub3QgaW5jbHVkaW5nIHRoZSAndG8nIHNpbmNlXHJcbiAgICAgICAgICAgIC8vIHNsb3RzIGluZGljYXRlIG9ubHkgdGhlIHN0YXJ0IG9mIHRoZSBzbG90XHJcbiAgICAgICAgICAgIC8vIHRoYXQgaXMgYXNzdW1lZCB0byBmaWxsIGEgc2xvdFNpemUgc3RhcnRpbmdcclxuICAgICAgICAgICAgLy8gb24gdGhhdCBzbG90LXRpbWVcclxuICAgICAgICAgICAgdmFyIHByZXZpb3VzID0gZnJvbTtcclxuICAgICAgICAgICAgd2hpbGUgKHByZXZpb3VzIDwgdG8pIHtcclxuICAgICAgICAgICAgICAgIHdlZWtseVNjaGVkdWxlLnNsb3RzW3dlZWtkYXldLnB1c2gobWludXRlc1RvVGltZVN0cmluZyhwcmV2aW91cykpO1xyXG4gICAgICAgICAgICAgICAgcHJldmlvdXMgKz0gc2xvdFNpemU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEb25lIVxyXG4gICAgcmV0dXJuIHdlZWtseVNjaGVkdWxlO1xyXG59XHJcblxyXG4vKipcclxuICAgIGludGVybmFsIHV0aWxpdHkgZnVuY3Rpb24gJ3RvIHN0cmluZyB3aXRoIHR3byBkaWdpdHMgYWxtb3N0J1xyXG4qKi9cclxuZnVuY3Rpb24gdHdvRGlnaXRzKG4pIHtcclxuICAgIHJldHVybiBNYXRoLmZsb29yKG4gLyAxMCkgKyAnJyArIG4gJSAxMDtcclxufVxyXG5cclxuLyoqXHJcbiAgICBDb252ZXJ0IGEgbnVtYmVyIG9mIG1pbnV0ZXNcclxuICAgIGluIGEgc3RyaW5nIGxpa2U6IDAwOjAwOjAwIChob3VyczptaW51dGVzOnNlY29uZHMpXHJcbioqL1xyXG5mdW5jdGlvbiBtaW51dGVzVG9UaW1lU3RyaW5nKG1pbnV0ZXMpIHtcclxuICAgIHZhciBkID0gbW9tZW50LmR1cmF0aW9uKG1pbnV0ZXMsICdtaW51dGVzJyksXHJcbiAgICAgICAgaCA9IGQuaG91cnMoKSxcclxuICAgICAgICBtID0gZC5taW51dGVzKCksXHJcbiAgICAgICAgcyA9IGQuc2Vjb25kcygpO1xyXG4gICAgXHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgIHR3b0RpZ2l0cyhoKSArICc6JyArXHJcbiAgICAgICAgdHdvRGlnaXRzKG0pICsgJzonICtcclxuICAgICAgICB0d29EaWdpdHMocylcclxuICAgICk7XHJcbn1cclxuIiwiLyoqXHJcbiAgICBTaW1wbGUgVmlldyBNb2RlbCB3aXRoIG1haW4gY3JlZGVudGlhbHMgZm9yXHJcbiAgICB1c2UgaW4gYSBmb3JtLCB3aXRoIHZhbGlkYXRpb24uXHJcbiAgICBVc2VkIGJ5IExvZ2luIGFuZCBTaWdudXAgYWN0aXZpdGllc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxuXHJcbmZ1bmN0aW9uIEZvcm1DcmVkZW50aWFscygpIHtcclxuXHJcbiAgICB0aGlzLnVzZXJuYW1lID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcbiAgICB0aGlzLnBhc3N3b3JkID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcbiAgICBcclxuICAgIC8vIHZhbGlkYXRlIHVzZXJuYW1lIGFzIGFuIGVtYWlsXHJcbiAgICB2YXIgZW1haWxSZWdleHAgPSAvXlstMC05QS1aYS16ISMkJSYnKisvPT9eX2B7fH1+Ll0rQFstMC05QS1aYS16ISMkJSYnKisvPT9eX2B7fH1+Ll0rJC87XHJcbiAgICB0aGlzLnVzZXJuYW1lLmVycm9yID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcbiAgICB0aGlzLnVzZXJuYW1lLnN1YnNjcmliZShmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgaWYgKHYpIHtcclxuICAgICAgICAgICAgaWYgKGVtYWlsUmVnZXhwLnRlc3QodikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWUuZXJyb3IoJycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZS5lcnJvcignSXMgbm90IGEgdmFsaWQgZW1haWwnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy51c2VybmFtZS5lcnJvcignUmVxdWlyZWQnKTtcclxuICAgICAgICB9XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgXHJcbiAgICAvLyByZXF1aXJlZCBwYXNzd29yZFxyXG4gICAgdGhpcy5wYXNzd29yZC5lcnJvciA9IGtvLm9ic2VydmFibGUoJycpO1xyXG4gICAgdGhpcy5wYXNzd29yZC5zdWJzY3JpYmUoZnVuY3Rpb24odikge1xyXG4gICAgICAgIHZhciBlcnIgPSAnJztcclxuICAgICAgICBpZiAoIXYpXHJcbiAgICAgICAgICAgIGVyciA9ICdSZXF1aXJlZCc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5wYXNzd29yZC5lcnJvcihlcnIpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGb3JtQ3JlZGVudGlhbHM7XHJcbiIsIi8qKiBOYXZBY3Rpb24gdmlldyBtb2RlbC5cclxuICAgIEl0IGFsbG93cyBzZXQtdXAgcGVyIGFjdGl2aXR5IGZvciB0aGUgQXBwTmF2IGFjdGlvbiBidXR0b24uXHJcbioqL1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuLi9tb2RlbHMvTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIE5hdkFjdGlvbih2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgbGluazogJycsXHJcbiAgICAgICAgaWNvbjogJycsXHJcbiAgICAgICAgdGV4dDogJycsXHJcbiAgICAgICAgLy8gJ1Rlc3QnIGlzIHRoZSBoZWFkZXIgdGl0bGUgYnV0IHBsYWNlZCBpbiB0aGUgYnV0dG9uL2FjdGlvblxyXG4gICAgICAgIGlzVGl0bGU6IGZhbHNlLFxyXG4gICAgICAgIC8vICdMaW5rJyBpcyB0aGUgZWxlbWVudCBJRCBvZiBhIG1vZGFsIChzdGFydHMgd2l0aCBhICMpXHJcbiAgICAgICAgaXNNb2RhbDogZmFsc2UsXHJcbiAgICAgICAgLy8gJ0xpbmsnIGlzIGEgU2hlbGwgY29tbWFuZCwgbGlrZSAnZ29CYWNrIDInXHJcbiAgICAgICAgaXNTaGVsbDogZmFsc2UsXHJcbiAgICAgICAgLy8gU2V0IGlmIHRoZSBlbGVtZW50IGlzIGEgbWVudSBidXR0b24sIGluIHRoYXQgY2FzZSAnbGluaydcclxuICAgICAgICAvLyB3aWxsIGJlIHRoZSBJRCBvZiB0aGUgbWVudSAoY29udGFpbmVkIGluIHRoZSBwYWdlOyB3aXRob3V0IHRoZSBoYXNoKSwgdXNpbmdcclxuICAgICAgICAvLyB0aGUgdGV4dCBhbmQgaWNvbiBidXQgc3BlY2lhbCBtZWFuaW5nIGZvciB0aGUgdGV4dCB2YWx1ZSAnbWVudSdcclxuICAgICAgICAvLyBvbiBpY29uIHByb3BlcnR5IHRoYXQgd2lsbCB1c2UgdGhlIHN0YW5kYXJkIG1lbnUgaWNvbi5cclxuICAgICAgICBpc01lbnU6IGZhbHNlXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE5hdkFjdGlvbjtcclxuXHJcbi8vIFNldCBvZiB2aWV3IHV0aWxpdGllcyB0byBnZXQgdGhlIGxpbmsgZm9yIHRoZSBleHBlY3RlZCBodG1sIGF0dHJpYnV0ZXNcclxuXHJcbk5hdkFjdGlvbi5wcm90b3R5cGUuZ2V0SHJlZiA9IGZ1bmN0aW9uIGdldEhyZWYoKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgICh0aGlzLmlzTWVudSgpIHx8IHRoaXMuaXNNb2RhbCgpIHx8IHRoaXMuaXNTaGVsbCgpKSA/XHJcbiAgICAgICAgJyMnIDpcclxuICAgICAgICB0aGlzLmxpbmsoKVxyXG4gICAgKTtcclxufTtcclxuXHJcbk5hdkFjdGlvbi5wcm90b3R5cGUuZ2V0TW9kYWxUYXJnZXQgPSBmdW5jdGlvbiBnZXRNb2RhbFRhcmdldCgpIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgKHRoaXMuaXNNZW51KCkgfHwgIXRoaXMuaXNNb2RhbCgpIHx8IHRoaXMuaXNTaGVsbCgpKSA/XHJcbiAgICAgICAgJycgOlxyXG4gICAgICAgIHRoaXMubGluaygpXHJcbiAgICApO1xyXG59O1xyXG5cclxuTmF2QWN0aW9uLnByb3RvdHlwZS5nZXRTaGVsbENvbW1hbmQgPSBmdW5jdGlvbiBnZXRTaGVsbENvbW1hbmQoKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgICh0aGlzLmlzTWVudSgpIHx8ICF0aGlzLmlzU2hlbGwoKSkgP1xyXG4gICAgICAgICcnIDpcclxuICAgICAgICB0aGlzLmxpbmsoKVxyXG4gICAgKTtcclxufTtcclxuXHJcbk5hdkFjdGlvbi5wcm90b3R5cGUuZ2V0TWVudUlEID0gZnVuY3Rpb24gZ2V0TWVudUlEKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgICAoIXRoaXMuaXNNZW51KCkpID9cclxuICAgICAgICAnJyA6XHJcbiAgICAgICAgdGhpcy5saW5rKClcclxuICAgICk7XHJcbn07XHJcblxyXG5OYXZBY3Rpb24ucHJvdG90eXBlLmdldE1lbnVMaW5rID0gZnVuY3Rpb24gZ2V0TWVudUxpbmsoKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgICghdGhpcy5pc01lbnUoKSkgP1xyXG4gICAgICAgICcnIDpcclxuICAgICAgICAnIycgKyB0aGlzLmxpbmsoKVxyXG4gICAgKTtcclxufTtcclxuXHJcbi8qKiBTdGF0aWMsIHNoYXJlZCBhY3Rpb25zICoqL1xyXG5OYXZBY3Rpb24uZ29Ib21lID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnLycsXHJcbiAgICBpY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1ob21lJ1xyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5nb0JhY2sgPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICdnb0JhY2snLFxyXG4gICAgaWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tYXJyb3ctbGVmdCcsXHJcbiAgICBpc1NoZWxsOiB0cnVlXHJcbn0pO1xyXG5cclxuLy8gVE9ETyBUTyBSRU1PVkUsIEV4YW1wbGUgb2YgbW9kYWxcclxuTmF2QWN0aW9uLm5ld0l0ZW0gPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICcjbmV3SXRlbScsXHJcbiAgICBpY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgIGlzTW9kYWw6IHRydWVcclxufSk7XHJcblxyXG5OYXZBY3Rpb24ubWVudUluID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnbWVudUluJyxcclxuICAgIGljb246ICdtZW51JyxcclxuICAgIGlzTWVudTogdHJ1ZVxyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5tZW51T3V0ID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnbWVudU91dCcsXHJcbiAgICBpY29uOiAnbWVudScsXHJcbiAgICBpc01lbnU6IHRydWVcclxufSk7XHJcblxyXG5OYXZBY3Rpb24ubWVudU5ld0l0ZW0gPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICdtZW51TmV3SXRlbScsXHJcbiAgICBpY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgIGlzTWVudTogdHJ1ZVxyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5nb0hlbHBJbmRleCA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgbGluazogJyNoZWxwSW5kZXgnLFxyXG4gICAgdGV4dDogJ2hlbHAnLFxyXG4gICAgaXNNb2RhbDogdHJ1ZVxyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5nb0xvZ2luID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnL2xvZ2luJyxcclxuICAgIHRleHQ6ICdsb2ctaW4nXHJcbn0pO1xyXG5cclxuTmF2QWN0aW9uLmdvTG9nb3V0ID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnL2xvZ291dCcsXHJcbiAgICB0ZXh0OiAnbG9nLW91dCdcclxufSk7XHJcblxyXG5OYXZBY3Rpb24uZ29TaWdudXAgPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICcvc2lnbnVwJyxcclxuICAgIHRleHQ6ICdzaWduLXVwJ1xyXG59KTtcclxuIiwiLyoqIE5hdkJhciB2aWV3IG1vZGVsLlxyXG4gICAgSXQgYWxsb3dzIGN1c3RvbWl6ZSB0aGUgTmF2QmFyIHBlciBhY3Rpdml0eS5cclxuKiovXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4uL21vZGVscy9Nb2RlbCcpLFxyXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi9OYXZBY3Rpb24nKTtcclxuXHJcbmZ1bmN0aW9uIE5hdkJhcih2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgLy8gVGl0bGUgc2hvd2VkIGluIHRoZSBjZW50ZXJcclxuICAgICAgICAvLyBXaGVuIHRoZSB0aXRsZSBpcyAnbnVsbCcsIHRoZSBhcHAgbG9nbyBpcyBzaG93ZWQgaW4gcGxhY2UsXHJcbiAgICAgICAgLy8gb24gZW1wdHkgdGV4dCwgdGhlIGVtcHR5IHRleHQgaXMgc2hvd2VkIGFuZCBubyBsb2dvLlxyXG4gICAgICAgIHRpdGxlOiAnJyxcclxuICAgICAgICAvLyBOYXZBY3Rpb24gaW5zdGFuY2U6XHJcbiAgICAgICAgbGVmdEFjdGlvbjogbnVsbCxcclxuICAgICAgICAvLyBOYXZBY3Rpb24gaW5zdGFuY2U6XHJcbiAgICAgICAgcmlnaHRBY3Rpb246IG51bGxcclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTmF2QmFyO1xyXG4iXX0=
;