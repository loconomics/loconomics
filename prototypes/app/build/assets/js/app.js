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

},{"../viewmodels/NavAction":109,"../viewmodels/NavBar":110}],3:[function(require,module,exports){
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

},{"../components/DatePicker":43,"../models/Appointment":47,"../testdata/calendarAppointments":67,"../viewmodels/NavAction":109,"../viewmodels/NavBar":110,"knockout":false,"moment":false}],4:[function(require,module,exports){
/**
    BookMeButton activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout'),
    $ = require('jquery');

var A = Activity.extends(function BookMeButtonActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.Freelancer;

    this.navBar = Activity.createSubsectionNavBar('Scheduling');
    
    // Auto select text on textarea, for better 'copy'
    // NOTE: the 'select' must happen on click, not tap, not focus,
    // only 'click' is reliable and bug-free.
    this.$activity.on('click', 'textarea', function() {
        $(this).select();
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    // Request a load, even if is a background load after the first time:
    this.app.model.marketplaceProfile.load();
    
    // Set the job title
    var jobID = state.route.segments[0] |0;
    this.viewModel.jobTitleID(jobID);
};

function ViewModel(app) {

    var marketplaceProfile = app.model.marketplaceProfile;
    
    // Actual data for the form:
    
    // Read-only bookCode
    this.bookCode = ko.computed(function() {
        return marketplaceProfile.data.bookCode();
    });
    
    this.jobTitleID = ko.observable(0);
    
    // Button type, can be: 'small', 'medium', 'large', 'link'
    this.type = ko.observable('medium');

    this.isLocked = marketplaceProfile.isLocked;
    
    // Generation of the button code
    
    var buttonTemplate =
        '<!-- begin Loconomics book-me-button -->' +
        '<a style="display:inline-block"><img alt="" style="border:none" /></a>' + 
        '<!-- end Loconomics book-me-button -->';
    
    var linkTemplate =
        '<!-- begin Loconomics book-me-button -->' +
        '<a><span></span></a>' +
        '<!-- end Loconomics book-me-button -->';

    this.buttonHtmlCode = ko.pureComputed(function() {
        
        if (marketplaceProfile.isLoading()) {
            return 'loading...';
        }
        else {
            var type = this.type(),
                tpl = buttonTemplate;

            if (type === 'link')
                tpl = linkTemplate;

            var siteUrl = $('html').attr('data-site-url'),
                linkUrl = siteUrl + '/book/' + this.bookCode() + '/' + this.jobTitleID() + '/',
                imgUrl = siteUrl + '/img/extern/book-me-button-' + type + '.png';

            var code = generateButtonCode({
                tpl: tpl,
                label: 'Click here to book me now (on loconomics.com)',
                linkUrl: linkUrl,
                imgUrl: imgUrl
            });

            return code;
        }
    }, this);
    
    // TODO Copy feature; will need a native plugin
    this.copyCode = function() { };
    
    this.sendByEmail = function() {
        // TODO Send by email, with window.open('mailto:&body=code');
    };
}

function generateButtonCode(options) {

    var $btn = $($.parseHTML('<div>' + options.tpl + '</div>'));

    $btn
    .find('a')
    .attr('href', options.linkUrl)
    .find('span')
    .text(options.label);
    $btn
    .find('img')
    .attr('src', options.imgUrl)
    .attr('alt', options.label);

    return $btn.html();
}

},{"../components/Activity":42,"knockout":false}],5:[function(require,module,exports){
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

},{"knockout":false}],6:[function(require,module,exports){
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

},{"../components/DatePicker":43,"../models/CalendarSlot":50,"../testdata/calendarSlots":68,"../viewmodels/NavAction":109,"../viewmodels/NavBar":110,"knockout":false,"moment":false}],7:[function(require,module,exports){
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

},{"../components/Activity":42,"knockout":false,"moment":false}],8:[function(require,module,exports){
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

},{"../components/Activity":42,"../models/Client":52,"knockout":false}],9:[function(require,module,exports){
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

},{"../components/Activity":42,"../testdata/clients":69,"../viewmodels/NavAction":109,"../viewmodels/NavBar":110,"knockout":false}],10:[function(require,module,exports){
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

},{"../components/Activity":42,"../testdata/clients":69,"knockout":false}],11:[function(require,module,exports){
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

},{"../components/Activity":42,"knockout":false}],12:[function(require,module,exports){
/**
    ContactInfo activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function ContactInfoActivity() {
    
    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.LoggedUser;
    
    this.navBar = Activity.createSubsectionNavBar('Owner information');
    
    // Update navBar for onboarding mode when the onboardingStep
    // in the current model changes:
    this.viewModel.profile.onboardingStep.subscribe(function (step) {
        
        if (step) {
            // TODO Set navbar step index
            // Setting navbar for Onboarding/wizard mode
            this.navBar.leftAction().text('');
            // Setting header
            this.viewModel.headerText('How can we reach you?');
            this.viewModel.buttonText('Save and continue');
        }
        else {
            // TODO Remove step index
            // Setting navbar to default
            this.navBar.leftAction().text('Account');
            // Setting header to default
            this.viewModel.headerText('Contact information');
            this.viewModel.buttonText('Save');
        }
    }.bind(this));
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    // Discard any previous unsaved edit
    this.viewModel.discard();
    
    // Keep data updated:
    this.app.model.userProfile.sync();
    this.app.model.homeAddress.sync();
};

var ko = require('knockout');

function ViewModel(app) {

    this.headerText = ko.observable('Contact information');
    this.buttonText = ko.observable('Save');
    
    // User Profile
    var userProfile = app.model.userProfile;
    var profileVersion = userProfile.newVersion();
    profileVersion.isObsolete.subscribe(function(itIs) {
        if (itIs) {
            // new version from server while editing
            // FUTURE: warn about a new remote version asking
            // confirmation to load them or discard and overwrite them;
            // the same is need on save(), and on server response
            // with a 509:Conflict status (its body must contain the
            // server version).
            // Right now, just overwrite current changes with
            // remote ones:
            profileVersion.pull({ evenIfNewer: true });
        }
    });
    
    // Actual data for the form:
    this.profile = profileVersion.version;
    
    // TODO l10n
    this.months = ko.observableArray([
        { id: 1, name: 'January'},
        { id: 2, name: 'February'},
        { id: 3, name: 'March'},
        { id: 4, name: 'April'},
        { id: 5, name: 'May'},
        { id: 6, name: 'June'},
        { id: 7, name: 'July'},
        { id: 8, name: 'August'},
        { id: 9, name: 'September'},
        { id: 10, name: 'October'},
        { id: 11, name: 'November'},
        { id: 12, name: 'December'}
    ]);
    // We need to use a special observable in the form, that will
    // update the back-end profile.birthMonth
    this.selectedBirthMonth = ko.computed({
        read: function() {
            var birthMonth = this.profile.birthMonth();
            return birthMonth ? this.months()[birthMonth - 1] : null;
        },
        write: function(month) {
            this.profile.birthMonth(month && month.id || null);
        },
        owner: this
    });
    
    this.monthDays = ko.observableArray([]);
    for (var iday = 1; iday <= 31; iday++) {
        this.monthDays.push(iday);
    }
    
    // Home Address
    var homeAddress = app.model.homeAddress;
    var homeAddressVersion = homeAddress.newVersion();
    homeAddressVersion.isObsolete.subscribe(function(itIs) {
        if (itIs) {
            // new version from server while editing
            // FUTURE: warn about a new remote version asking
            // confirmation to load them or discard and overwrite them;
            // the same is need on save(), and on server response
            // with a 509:Conflict status (its body must contain the
            // server version).
            // Right now, just overwrite current changes with
            // remote ones:
            homeAddressVersion.pull({ evenIfNewer: true });
        }
    });
    
    // Actual data for the form:
    this.address = homeAddressVersion.version;

    // Control observables: special because must a mix
    // of the both remote models used in this viewmodel
    this.isLocked = ko.computed(function() {
        return userProfile.isLocked() || homeAddress.isLocked();
    }, this);
    this.isLoading = ko.computed(function() {
        return userProfile.isLoading() || homeAddress.isLoading();
    }, this);
    this.isSaving = ko.computed(function() {
        return userProfile.isSaving() || homeAddress.isSaving();
    }, this);

    this.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ? 
                'loading...' : 
                this.isSaving() ? 
                    'saving...' : 
                    'Save'
        );
    }, this);
    
    // Actions

    this.discard = function discard() {
        profileVersion.pull({ evenIfNewer: true });
        homeAddressVersion.pull({ evenIfNewer: true });
    }.bind(this);

    this.save = function save() {
        // Force to save, even if there was remote updates
        profileVersion.push({ evenIfObsolete: true });
        homeAddressVersion.push({ evenIfObsolete: true });
    }.bind(this);
}

},{"../components/Activity":42,"knockout":false}],13:[function(require,module,exports){
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

},{"../components/Activity":42,"../models/MailFolder":56,"../testdata/messages":71,"knockout":false}],14:[function(require,module,exports){
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

},{"../components/DatePicker":43,"../testdata/timeSlots":73,"../utils/Time":80,"../viewmodels/NavAction":109,"../viewmodels/NavBar":110,"knockout":false,"moment":false}],15:[function(require,module,exports){
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

},{"../components/Activity":42,"../models/Model":59,"knockout":false}],16:[function(require,module,exports){
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

},{"../components/Activity":42}],17:[function(require,module,exports){
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

},{"../components/Activity":42,"knockout":false}],18:[function(require,module,exports){
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

},{"../models/GetMore":53,"../models/MailFolder":56,"../models/PerformanceSummary":60,"../models/UpcomingBookingsSummary":65,"../testdata/messages":71,"../utils/Time":80,"../viewmodels/NavAction":109,"../viewmodels/NavBar":110,"knockout":false}],19:[function(require,module,exports){
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

},{"../components/Activity":42,"../models/MailFolder":56,"../testdata/messages":71,"knockout":false}],20:[function(require,module,exports){
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

},{"../viewmodels/NavAction":109,"../viewmodels/NavBar":110}],21:[function(require,module,exports){
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

},{"../components/Activity":42}],22:[function(require,module,exports){
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
},{"../viewmodels/NavAction":109,"../viewmodels/NavBar":110,"knockout":false}],23:[function(require,module,exports){
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
},{"../models/Location":55,"../viewmodels/NavAction":109,"../viewmodels/NavBar":110,"knockout":false}],24:[function(require,module,exports){
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

},{"../testdata/locations":70,"../viewmodels/NavAction":109,"../viewmodels/NavBar":110,"knockout":false}],25:[function(require,module,exports){
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

},{"../models/User":66,"../viewmodels/FormCredentials":108,"../viewmodels/NavAction":109,"../viewmodels/NavBar":110,"knockout":false}],26:[function(require,module,exports){
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

},{}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
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

},{"../viewmodels/NavAction":109,"../viewmodels/NavBar":110}],29:[function(require,module,exports){
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
},{"../models/Position":61,"../viewmodels/NavAction":109,"../viewmodels/NavBar":110,"knockout":false}],30:[function(require,module,exports){
/**
    OwnerInfo activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function OwnerInfoActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    
    this.navBar = Activity.createSubsectionNavBar('Account');
});

exports.init = A.init;

},{"../components/Activity":42}],31:[function(require,module,exports){
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

},{"../viewmodels/NavAction":109,"../viewmodels/NavBar":110,"knockout":false}],32:[function(require,module,exports){
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

},{"../components/Activity":42,"knockout":false,"moment":false}],33:[function(require,module,exports){
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

},{"../components/Activity":42,"../testdata/services":72,"knockout":false}],34:[function(require,module,exports){
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

},{"../viewmodels/FormCredentials":108,"../viewmodels/NavAction":109,"../viewmodels/NavBar":110,"knockout":false}],35:[function(require,module,exports){
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

},{"../viewmodels/NavAction":109,"../viewmodels/NavBar":110,"events":false,"knockout":false}],36:[function(require,module,exports){
/**
    WeeklySchedule activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var moment = require('moment');

var A = Activity.extends(function WeeklyScheduleActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.Freelancer;

    this.navBar = Activity.createSubsectionNavBar('Scheduling');
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    // Request a load, even if is a background load after the first time:
    this.app.model.simplifiedWeeklySchedule.load();
    // Discard any previous unsaved edit
    this.viewModel.discard();
};

function ViewModel(app) {

    var simplifiedWeeklySchedule = app.model.simplifiedWeeklySchedule;

    var scheduleVersion = simplifiedWeeklySchedule.newVersion();
    scheduleVersion.isObsolete.subscribe(function(itIs) {
        if (itIs) {
            // new version from server while editing
            // FUTURE: warn about a new remote version asking
            // confirmation to load them or discard and overwrite them;
            // the same is need on save(), and on server response
            // with a 509:Conflict status (its body must contain the
            // server version).
            // Right now, just overwrite current changes with
            // remote ones:
            scheduleVersion.pull({ evenIfNewer: true });
        }
    });
    
    // Actual data for the form:
    this.schedule = scheduleVersion.version;

    this.isLocked = simplifiedWeeklySchedule.isLocked;

    this.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ? 
                'loading...' : 
                this.isSaving() ? 
                    'saving...' : 
                    'Save'
        );
    }, simplifiedWeeklySchedule);
    
    this.discard = function discard() {
        scheduleVersion.pull({ evenIfNewer: true });
    };

    this.save = function save() {
        // Force to save, even if there was remote updates
        scheduleVersion.push({ evenIfObsolete: true });
    };
}

},{"../components/Activity":42,"knockout":false,"moment":false}],37:[function(require,module,exports){
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
            this.disable = getObservable(params.disable);
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

},{"./utils/jsPropertiesTools":88,"knockout":false}],38:[function(require,module,exports){
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

},{"./viewmodels/NavAction":109,"./viewmodels/NavBar":110,"knockout":false}],39:[function(require,module,exports){
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
    'calendarSyncing': require('./activities/calendarSyncing'),
    'weeklySchedule': require('./activities/weeklySchedule'),
    'bookMeButton': require('./activities/bookMeButton'),
    'ownerInfo': require('./activities/ownerInfo')
};

},{"./activities/account":2,"./activities/appointment":3,"./activities/bookMeButton":4,"./activities/bookingConfirmation":5,"./activities/calendar":6,"./activities/calendarSyncing":7,"./activities/clientEdition":8,"./activities/clients":9,"./activities/cms":10,"./activities/contactForm":11,"./activities/contactInfo":12,"./activities/conversation":13,"./activities/datetimePicker":14,"./activities/faqs":15,"./activities/feedback":16,"./activities/feedbackForm":17,"./activities/home":18,"./activities/inbox":19,"./activities/index":20,"./activities/jobtitles":21,"./activities/learnMore":22,"./activities/locationEdition":23,"./activities/locations":24,"./activities/login":25,"./activities/logout":26,"./activities/onboardingComplete":27,"./activities/onboardingHome":28,"./activities/onboardingPositions":29,"./activities/ownerInfo":30,"./activities/scheduling":31,"./activities/schedulingPreferences":32,"./activities/services":33,"./activities/signup":34,"./activities/textEditor":35,"./activities/weeklySchedule":36}],40:[function(require,module,exports){
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
    require('./utils/bootstrapSwitchBinding').plugIn(ko);
    
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
},{"./app-components":37,"./app-navbar":38,"./app.activities":39,"./app.shell":41,"./components/SmartNavBar":44,"./locales/en-US-LC":45,"./utils/Function.prototype._delayed":75,"./utils/Function.prototype._inherits":76,"./utils/accessControl":81,"./utils/bootknockBindingHelpers":83,"./utils/bootstrapSwitchBinding":84,"./viewmodels/AppModel":103,"./viewmodels/NavAction":109,"./viewmodels/NavBar":110,"es6-promise":false,"knockout":false}],41:[function(require,module,exports){
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

},{"./utils/shell/hashbangHistory":93,"./utils/shell/index":94}],42:[function(require,module,exports){
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

},{"../utils/Function.prototype._inherits":76,"../viewmodels/NavAction":109,"../viewmodels/NavBar":110,"knockout":false}],43:[function(require,module,exports){
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

},{}],44:[function(require,module,exports){
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

},{}],45:[function(require,module,exports){
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

},{"moment":false}],46:[function(require,module,exports){
/** Address model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model');

function Address(values) {

    Model(this);
    
    this.model.defProperties({
        addressID: 0,
        addressName: '',
        jobTitleID: 0,
        userID: 0,
        addressLine1: null,
        addressLine2: null,
        postalCode: null,
        city: null, // Autofilled by server
        stateProvinceCode: null, // Autofilled by server
        stateProviceName: null, // Autofilled by server
        countryCode: null, // ISO Alpha-2 code, Ex.: 'US'
        latitude: null,
        longitude: null,
        specialInstructions: null,
        isServiceArea: false,
        isServiceLocation: false,
        serviceRadius: 0,
        createdDate: null, // Autofilled by server
        updatedDate: null, // Autofilled by server
        kind: '' // Autofilled by server
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
    
    // TODO: needed? l10n? must be provided by server side?
    var countries = {
        'US': 'United States',
        'ES': 'Spain'
    };
    this.countryName = ko.computed(function() {
        return countries[this.countryCode()] || 'unknow';
    }, this);

    // Useful GPS object with the format used by Google Maps
    this.latlng = ko.computed(function() {
        return {
            lat: this.latitude(),
            lng: this.longitude()
        };
    }, this);
}

module.exports = Address;

},{"./Model":59,"knockout":false}],47:[function(require,module,exports){
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

},{"./Client":52,"./Location":55,"./Model":59,"./Service":63,"knockout":false,"moment":false}],48:[function(require,module,exports){
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

},{"./Model":59,"knockout":false,"moment":false}],49:[function(require,module,exports){
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
},{"./Model":59,"knockout":false,"moment":false}],50:[function(require,module,exports){
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

},{"./Client":52,"./Model":59,"knockout":false}],51:[function(require,module,exports){
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

},{"./Model":59,"knockout":false}],52:[function(require,module,exports){
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

},{"./Model":59,"knockout":false}],53:[function(require,module,exports){
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

},{"./ListViewItem":54,"./Model":59,"knockout":false}],54:[function(require,module,exports){
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

},{"./Model":59,"knockout":false,"moment":false}],55:[function(require,module,exports){
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

},{"./Model":59,"knockout":false}],56:[function(require,module,exports){
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

},{"./Model":59,"knockout":false,"lodash":false,"moment":false}],57:[function(require,module,exports){
/** MarketplaceProfile model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model');

function MarketplaceProfile(values) {
    
    Model(this);
    
    this.model.defProperties({
        userID: 0,
        
        publicBio: '',
        freelancerProfileUrlSlug: '',
        // This is a server-side computed variable (read-only for the user) for a Loconomics address
        // created using the freelancerProfileUrlSlug if any or the fallback system URL.
        freelancerProfileUrl: '',
        // Specify an external website of the freelancer.
        freelancerWebsiteUrl: '',
        // Server-side generated code that allows to identificate special booking requests
        // from the book-me-now button. The server ensures that there is ever a value on this for freelancers.
        bookCode: '',

        createdDate: null,
        updatedDate: null
    }, values);
}

module.exports = MarketplaceProfile;

},{"./Model":59,"knockout":false}],58:[function(require,module,exports){
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

},{"./Model":59,"knockout":false,"moment":false}],59:[function(require,module,exports){
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

},{"knockout":false,"knockout.mapping":false}],60:[function(require,module,exports){
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

},{"./ListViewItem":54,"./Model":59,"knockout":false,"moment":false,"numeral":1}],61:[function(require,module,exports){
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

},{"./Model":59,"knockout":false}],62:[function(require,module,exports){
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

},{"./Model":59,"knockout":false}],63:[function(require,module,exports){
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

},{"./Model":59,"knockout":false}],64:[function(require,module,exports){
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
        
        Since on write two observables are being modified, and
        both are used in the read, a single change to the 
        value will trigger two notifications; to avoid that,
        the observable is rate limited with an inmediate value,
        son only one notification is received.
    **/
    this.isEnabled = ko.computed({
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
                this.fromHour(9);
                this.toHour(17);
            }
            else {
                this.toHour(0);
                this.from(0);
            }
        },
        owner: this
    }).extend({ rateLimit: 0 });
    
    this.isAllDay = ko.computed({
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
    }).extend({ rateLimit: 0 });
    
    // Additional interfaces to get/set the from/to times
    // by using a different data unit or format.
    
    // Integer, rounded-up, number of hours
    this.fromHour = ko.computed({
        read: function() {
            return Math.floor(this.from() / 60);
        },
        write: function(hours) {
            this.from((hours * 60) |0);
        },
        owner: this
    });
    this.toHour = ko.computed({
        read: function() {
            return Math.ceil(this.to() / 60);
        },
        write: function(hours) {
            this.to((hours * 60) |0);
        },
        owner: this
    });
    
    // String, time format ('hh:mm')
    this.fromTime = ko.computed({
        read: function() {
            return minutesToTimeString(this.from() |0);
        },
        write: function(time) {
            this.from(timeStringToMinutes(time));
        },
        owner: this
    });
    this.toTime = ko.computed({
        read: function() {
            return minutesToTimeString(this.to() |0);
        },
        write: function(time) {
            this.to(timeStringToMinutes(time));
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

//// UTILS,
// TODO Organize or externalize. some copied form appmodel..
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

var moment = require('moment');
function timeStringToMinutes(time) {
    return moment.duration(time).asMinutes() |0;
}
},{"./Model":59,"knockout":false,"moment":false}],65:[function(require,module,exports){
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

},{"./BookingSummary":48,"./Model":59,"knockout":false}],66:[function(require,module,exports){
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

},{"./Model":59,"knockout":false}],67:[function(require,module,exports){
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

},{"../models/Appointment":47,"./locations":70,"./services":72,"knockout":false,"moment":false}],68:[function(require,module,exports){
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

},{"../models/CalendarSlot":50,"../utils/Time":80,"moment":false}],69:[function(require,module,exports){
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

},{"../models/Client":52}],70:[function(require,module,exports){
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

},{"../models/Location":55}],71:[function(require,module,exports){
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

},{"../models/Message":58,"../utils/Time":80,"moment":false}],72:[function(require,module,exports){
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

},{"../models/Service":63}],73:[function(require,module,exports){
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

},{"../utils/Time":80,"moment":false}],74:[function(require,module,exports){
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

},{"moment":false}],75:[function(require,module,exports){
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

},{}],76:[function(require,module,exports){
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

},{}],77:[function(require,module,exports){
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
        // Ever deepCopy, since only properties and fields from models
        // are copied and that must avoid circular references
        this.version.model.updateWith(this.original, true);
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
        // Ever deepCopy, since only properties and fields from models
        // are copied and that must avoid circular references
        this.original.model.updateWith(this.version, true);
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

},{"events":false,"knockout":false}],78:[function(require,module,exports){
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
    ko = require('knockout'),
    localforage = require('localforage'),
    EventEmitter = require('events').EventEmitter;

function RemoteModel(options) {

    EventEmitter.call(this);
    
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
    
    // Optional name used to persist a copy of the data as plain object
    // in the local storage on every successfully load/save operation.
    // With no name, no saved (default).
    // It uses 'localforage', so may be not saved using localStorage actually,
    // but any supported and initialized storage system, like WebSQL, IndexedDB or LocalStorage.
    // localforage must have a set-up previous use of this option.
    this.localStorageName = options.localStorageName || null;
    
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
                this.save()
                .then(function() {
                    // Update the version data with the new one
                    // from the remote, that may include remote computed
                    // values:
                    v.pull({ evenIfNewer: true });
                })
                .catch(function() {
                    // Just catch the error to avoid 'unknow error's from being
                    // logged on the console; the error can be listening on
                    // the 'error' event.
                });
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
            
            var promise = Promise.resolve(),
                localPromise = null;
            
            // If local storage is set for this, load first
            // from local, then follow with syncing from remote
            if (firstTimeLoad &&
                this.localStorageName) {
                // Set both localPromise and promise,
                // since we only will wait for localPromise and the
                // other one is required by the remote loading
                localPromise = promise = localforage.getItem(this.localStorageName)
                .then(function(localData) {
                    if (localData) {
                        this.data.model.updateWith(localData, true);
                        
                        // Load done:
                        this.isLoading(false);
                        this.isSyncing(false);
                    }
                    else {
                        // When no data, return the general promise
                        // that will fullfill after server load:
                        return promise;
                    }
                }.bind(this));
            }

            // Perform the remote load (it doesn't matter if a local load
            // happened or not), getting the new promise
            promise = promise
            .then(this.fetch.bind(this))
            .then(function (serverData) {
                if (serverData) {
                    // Ever deepCopy, since plain data from the server (and any
                    // in between conversion on 'fecth') cannot have circular
                    // references:
                    this.data.model.updateWith(serverData, true);

                    // persistent local copy?
                    if (this.localStorageName) {
                        localforage.setItem(this.localStorageName, serverData);
                    }
                }
                else {
                    throw new Error('Remote model did not returned data, response must be a "Not Found"');
                }
                
                // Event
                if (this.isLoading()) {
                    this.emit('load', serverData);
                }
                else {
                    this.emit('synced', serverData);
                }
                
                // Finally: common tasks on success or error
                this.isLoading(false);
                this.isSyncing(false);
                
                this.cache.latest = new Date();
                return this.data;
            }.bind(this))
            .catch(function(err) {
                
                var wasLoad = this.isLoading();
                
                // Finally: common tasks on success or error
                this.isLoading(false);
                this.isSyncing(false);
                
                // Event
                var errPkg = {
                    task: wasLoad ? 'load' : 'sync',
                    error: err
                };
                // Be careful with 'error' event, is special and stops execution on emit
                // if no listeners attached: overwritting that behavior by just
                // print on console when nothing, or emit if some listener:
                if (EventEmitter.listenerCount(this, 'error') > 0) {
                    this.emit('error', errPkg);
                }
                else {
                    // Log it when not handled (even if the promise error is handled)
                    console.error('RemoteModel Error', errPkg);
                }
                
                // Rethrow error
                return err;
            }.bind(this));
            
            // First time, blocking load:
            // it returns when the load returns
            if (firstTimeLoad) {
                firstTimeLoad = false;
                // It returns the promise to the local storage loading
                // if any, or the remote loading promise, because
                // we must resolve as soon there is data.
                return localPromise || promise;
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
            // Ever deepCopy, since plain data from the server
            // cannot have circular references:
            this.data.model.updateWith(serverData, true);
            this.data.model.dataTimestamp(ts);
            
            // persistent local copy?
            if (this.localStorageName) {
                localforage.setItem(this.localStorageName, serverData);
            }
            
            // Event
            this.emit('saved', serverData);
            
            // Finally: common tasks on success or error
            this.isSaving(false);
            
            this.cache.latest = new Date();
            return this.data;
        }.bind(this))
        .catch(function(err) {
            // Finally: common tasks on success or error
            this.isSaving(false);
            
            // Event
            var errPkg = {
                task: 'save',
                error: err
            };
            // Be careful with 'error' event, is special and stops execution on emit
            // if no listeners attached: overwritting that behavior by just
            // print on console when nothing, or emit if some listener:
            if (EventEmitter.listenerCount(this, 'error') > 0) {
                this.emit('error', errPkg);
            }
            else {
                // Log it when not handled (even if the promise error is handled)
                console.error('RemoteModel Error', errPkg);
            }
            
            // Rethrow error
            return err;
        }.bind(this));
    };
    
    /**
        Launch a syncing request. Returns nothing, the
        way to track any result is with events or 
        the instance observables.
        IMPORTANT: right now is just a request for 'load'
        that avoids promise errors from throwing.
    **/
    this.sync = function sync() {
        // Call for a load, that will be treated as 'syncing' after the
        // first load
        this.load()
        // Avoid errors from throwing in the console,
        // the 'error' event is there to track anyone.
        .catch(function() {});
    };
}

module.exports = RemoteModel;

RemoteModel._inherits(EventEmitter);

},{"../utils/CacheControl":74,"../utils/ModelVersion":77,"events":false,"knockout":false,"localforage":false}],79:[function(require,module,exports){
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

},{}],80:[function(require,module,exports){
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

},{}],81:[function(require,module,exports){
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

},{"../models/User":66}],82:[function(require,module,exports){
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
},{}],83:[function(require,module,exports){
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

},{}],84:[function(require,module,exports){
/**
    Knockout Binding Helper for the Bootstrap Switch plugin.
    
    Dependencies: jquery, bootstrap, bootstrap-switch
    Injected dependencies: knockout
    
    IMPORTANT NOTES:
    - A console error of type "object has not that property" will happen if specified
        a non existant option in the binding. The error looks strange when using the minified file.
    - The order of options in the binding matters when combining with disabled and readonly
        options: if the element is disabled:true or readonly:true, any attempt to change the
        value will fail silently, so if the same binding update changes disabled to false
        and the state, the 'disabled' change must happens before the 'state' change so both
        are successfully updated. For that, just specify 'disabled' before 'state' in the bindings
        definition.
**/
'use strict';

// Dependencies
var $ = require('jquery');
require('bootstrap');
require('bootstrap-switch');

/**
    Create and plug-in the Binding in the provided Knockout instance
**/
exports.plugIn = function plugIn(ko, prefix) {

    ko.bindingHandlers[prefix ? prefix + 'switch' : 'switch'] = {
        init: function(element, valueAccessor, allBindings) {
            // Create plugin instance
            $(element).bootstrapSwitch();
            
            //console.log('switch init', ko.toJS(valueAccessor()));

            // Updating value on plugin changes
            $(element).on('switchChange.bootstrapSwitch', function (e, state) {
                var v = valueAccessor() || {};
                //console.log('switchChange', ko.toJS(v));
                
                // changed?
                var oldState = !!ko.unwrap(v.state),
                    newState = !!state;
                // Only update on change
                if (oldState !== newState) {
                    if (ko.isObservable(v.state)) {
                        if (ko.isWriteableObservable(v.state)) {
                            v.state(newState);
                        }
                    } else {
                        v.state = newState;
                    }
                }
            });
        },
        update: function(element, valueAccessor, allBindings) {
            // Get options to be applied to the plugin instance
            var srcOptions = valueAccessor();
            
            var options = srcOptions || {};

            // Unwrapping every option value, getting a duplicated
            // plain object
            options = ko.toJS(options);
            //console.log('switch update', options);

            var $el = $(element);
            // Update every option in the plugin
            Object.keys(options).forEach(function(key) {
                $el.bootstrapSwitch(key, options[key]);
            });
        }
    };
};

},{}],85:[function(require,module,exports){
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

},{}],86:[function(require,module,exports){
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

},{}],87:[function(require,module,exports){
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

},{}],88:[function(require,module,exports){
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

},{}],89:[function(require,module,exports){
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

},{"../escapeSelector":86}],90:[function(require,module,exports){
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

},{"./dependencies":92}],91:[function(require,module,exports){
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

},{"../escapeRegExp":85,"./sanitizeUrl":97}],92:[function(require,module,exports){
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

},{}],93:[function(require,module,exports){
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

},{"../getUrlQuery":87,"./sanitizeUrl":97}],94:[function(require,module,exports){
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

},{"./DomItemsManager":89,"./Shell":90,"./absolutizeUrl":91,"./dependencies":92,"./loader":95,"./parseUrl":96,"events":false}],95:[function(require,module,exports){
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

},{}],96:[function(require,module,exports){
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
},{"../escapeRegExp":85,"../getUrlQuery":87}],97:[function(require,module,exports){
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
},{}],98:[function(require,module,exports){
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
        }).then(performLocalLogin(this, username, password));
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

        // The result is the same as in a login, and
        // we do the same as there to get the user logged
        // on the app on sign-up success.
        return this.rest.post('signup?utm_source=app', {
            username: username,
            password: password,
            profileType: profileType,
            returnProfile: true
        }).then(performLocalLogin(this, username, password));
    };
};

function performLocalLogin(thisAppModel, username, password) {
    
    return function(logged) {
        // use authorization key for each
        // new Rest request
        thisAppModel.rest.extraHeaders = {
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
        // IMPORTANT: Local name kept in sync with set-up at AppModel.userProfile
        localforage.setItem('profile', logged.profile);

        // Set user data
        thisAppModel.user().model.updateWith(logged.profile);

        return logged;
    };
}

},{"localforage":false}],99:[function(require,module,exports){
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
},{"../models/CalendarEvent":49,"../utils/apiHelper":82}],100:[function(require,module,exports){
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

},{}],101:[function(require,module,exports){
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

},{"../models/CalendarSyncing":51,"../utils/RemoteModel":78,"knockout":false}],102:[function(require,module,exports){
/** Home Address
**/
'use strict';

var Address = require('../models/Address');

var RemoteModel = require('../utils/RemoteModel');

exports.create = function create(appModel) {
    return new RemoteModel({
        data: new Address(),
        ttl: { minutes: 1 },
        fetch: function fetch() {
            return appModel.rest.get('addresses/home');
        },
        push: function push() {
            return appModel.rest.put('addresses/home', this.data.model.toPlainObject());
        }
    });
};

},{"../models/Address":46,"../utils/RemoteModel":78}],103:[function(require,module,exports){
/** AppModel, centralizes all the data for the app,
    caching and sharing data across activities and performing
    requests
**/
var ko = require('knockout'),
    $ = require('jquery'),
    Model = require('../models/Model'),
    User = require('../models/User'),
    Rest = require('../utils/Rest'),
    localforage = require('localforage');

function AppModel(values) {

    Model(this);
    
    this.userProfile = require('./AppModel.userProfile').create(this);
    // NOTE: Alias for the user data
    // TODO:TOREVIEW if continue to makes sense to keep this 'user()' alias, document
    // where is used and why is preferred to the canonical way.
    this.user = ko.computed(function() {
        return this.userProfile.data;
    }, this);

    this.schedulingPreferences = require('./AppModel.schedulingPreferences').create(this);
    this.calendarSyncing = require('./AppModel.calendarSyncing').create(this);
    this.simplifiedWeeklySchedule = require('./AppModel.simplifiedWeeklySchedule').create(this);
    this.marketplaceProfile = require('./AppModel.marketplaceProfile').create(this);
    this.homeAddress = require('./AppModel.homeAddress').create(this);
}

require('./AppModel-account').plugIn(AppModel);

/** Initialize and wait for anything up **/
AppModel.prototype.init = function init() {
    
    var siteUrl = $('html').attr('data-site-url');
    this.rest = new Rest(siteUrl + '/api/v1/en-US/');
    
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
                // NOTE: the userProfile will load from local storage on this first
                // attempt, and lazily request updated data from remote
                this.userProfile.load().then(function(profile) {
                    if (profile) {
                        // There is a profile cached
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

},{"../models/Model":59,"../models/User":66,"../utils/Rest":79,"./AppModel-account":98,"./AppModel-events":99,"./AppModel-userJobProfile":100,"./AppModel.calendarSyncing":101,"./AppModel.homeAddress":102,"./AppModel.marketplaceProfile":104,"./AppModel.schedulingPreferences":105,"./AppModel.simplifiedWeeklySchedule":106,"./AppModel.userProfile":107,"knockout":false,"localforage":false}],104:[function(require,module,exports){
/** MarketplaceProfile
**/
'use strict';

var MarketplaceProfile = require('../models/MarketplaceProfile');

var RemoteModel = require('../utils/RemoteModel');

exports.create = function create(appModel) {
    return new RemoteModel({
        data: new MarketplaceProfile(),
        ttl: { minutes: 1 },
        localStorageName: 'marketplaceProfile',
        fetch: function fetch() {
            return appModel.rest.get('marketplace-profile');
        },
        push: function push() {
            return appModel.rest.put('marketplace-profile', this.data.model.toPlainObject());
        }
    });
};

},{"../models/MarketplaceProfile":57,"../utils/RemoteModel":78}],105:[function(require,module,exports){
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

},{"../models/SchedulingPreferences":62,"../utils/RemoteModel":78}],106:[function(require,module,exports){
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
    var slotSize = (weeklySchedule.slotSize || defaultSlotSize) |0;

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
        var from = simpleDay.from |0,
            to = simpleDay.to |0;

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

},{"../models/SimplifiedWeeklySchedule":64,"../utils/RemoteModel":78,"moment":false}],107:[function(require,module,exports){
/** UserProfile
**/
'use strict';

var User = require('../models/User');

var RemoteModel = require('../utils/RemoteModel');

exports.create = function create(appModel) {
    return new RemoteModel({
        data: User.newAnonymous(),
        ttl: { minutes: 1 },
        // IMPORTANT: Keep the name in sync with set-up at AppModel-account
        localStorageName: 'profile',
        fetch: function fetch() {
            return appModel.rest.get('profile');
        },
        push: function push() {
            return appModel.rest.put('profile', this.data.model.toPlainObject());
        }
    });
};

},{"../models/User":66,"../utils/RemoteModel":78}],108:[function(require,module,exports){
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

},{"knockout":false}],109:[function(require,module,exports){
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

},{"../models/Model":59,"knockout":false}],110:[function(require,module,exports){
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

},{"../models/Model":59,"./NavAction":109,"knockout":false}]},{},[40])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvbm9kZV9tb2R1bGVzL251bWVyYWwvbnVtZXJhbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYWNjb3VudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYXBwb2ludG1lbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2Jvb2tNZUJ1dHRvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYm9va2luZ0NvbmZpcm1hdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY2FsZW5kYXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2NhbGVuZGFyU3luY2luZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY2xpZW50RWRpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY2xpZW50cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY21zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9jb250YWN0Rm9ybS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY29udGFjdEluZm8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2NvbnZlcnNhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvZGF0ZXRpbWVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2ZhcXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2ZlZWRiYWNrLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9mZWVkYmFja0Zvcm0uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2hvbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2luYm94LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9pbmRleC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvam9idGl0bGVzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9sZWFybk1vcmUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2xvY2F0aW9uRWRpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvbG9jYXRpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9sb2dpbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvbG9nb3V0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9vbmJvYXJkaW5nQ29tcGxldGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL29uYm9hcmRpbmdIb21lLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9vbmJvYXJkaW5nUG9zaXRpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9vd25lckluZm8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL3NjaGVkdWxpbmcuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL3NjaGVkdWxpbmdQcmVmZXJlbmNlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvc2VydmljZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL3NpZ251cC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvdGV4dEVkaXRvci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvd2Vla2x5U2NoZWR1bGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hcHAtY29tcG9uZW50cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FwcC1uYXZiYXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hcHAuYWN0aXZpdGllcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FwcC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FwcC5zaGVsbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2NvbXBvbmVudHMvQWN0aXZpdHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9jb21wb25lbnRzL0RhdGVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9jb21wb25lbnRzL1NtYXJ0TmF2QmFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbG9jYWxlcy9lbi1VUy1MQy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9BZGRyZXNzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0FwcG9pbnRtZW50LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0Jvb2tpbmdTdW1tYXJ5LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0NhbGVuZGFyRXZlbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQ2FsZW5kYXJTbG90LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0NhbGVuZGFyU3luY2luZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9DbGllbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvR2V0TW9yZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9MaXN0Vmlld0l0ZW0uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvTG9jYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvTWFpbEZvbGRlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9NYXJrZXRwbGFjZVByb2ZpbGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvTWVzc2FnZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9Nb2RlbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9QZXJmb3JtYW5jZVN1bW1hcnkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvUG9zaXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvU2NoZWR1bGluZ1ByZWZlcmVuY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1NlcnZpY2UuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvU2ltcGxpZmllZFdlZWtseVNjaGVkdWxlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1VwY29taW5nQm9va2luZ3NTdW1tYXJ5LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1VzZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9jYWxlbmRhckFwcG9pbnRtZW50cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3Rlc3RkYXRhL2NhbGVuZGFyU2xvdHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9jbGllbnRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdGVzdGRhdGEvbG9jYXRpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdGVzdGRhdGEvbWVzc2FnZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9zZXJ2aWNlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3Rlc3RkYXRhL3RpbWVTbG90cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL0NhY2hlQ29udHJvbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL0Z1bmN0aW9uLnByb3RvdHlwZS5fZGVsYXllZC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL0Z1bmN0aW9uLnByb3RvdHlwZS5faW5oZXJpdHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9Nb2RlbFZlcnNpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9SZW1vdGVNb2RlbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL1Jlc3QuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9UaW1lLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvYWNjZXNzQ29udHJvbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL2FwaUhlbHBlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL2Jvb3Rrbm9ja0JpbmRpbmdIZWxwZXJzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvYm9vdHN0cmFwU3dpdGNoQmluZGluZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL2VzY2FwZVJlZ0V4cC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL2VzY2FwZVNlbGVjdG9yLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvZ2V0VXJsUXVlcnkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9qc1Byb3BlcnRpZXNUb29scy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL0RvbUl0ZW1zTWFuYWdlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL1NoZWxsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvc2hlbGwvYWJzb2x1dGl6ZVVybC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL2RlcGVuZGVuY2llcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL2hhc2hiYW5nSGlzdG9yeS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL2luZGV4LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvc2hlbGwvbG9hZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvc2hlbGwvcGFyc2VVcmwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9zYW5pdGl6ZVVybC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwtYWNjb3VudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwtZXZlbnRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9BcHBNb2RlbC11c2VySm9iUHJvZmlsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwuY2FsZW5kYXJTeW5jaW5nLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9BcHBNb2RlbC5ob21lQWRkcmVzcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLm1hcmtldHBsYWNlUHJvZmlsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwuc2NoZWR1bGluZ1ByZWZlcmVuY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9BcHBNb2RlbC5zaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLnVzZXJQcm9maWxlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9Gb3JtQ3JlZGVudGlhbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL05hdkFjdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvTmF2QmFyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3V0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogbnVtZXJhbC5qc1xuICogdmVyc2lvbiA6IDEuNS4zXG4gKiBhdXRob3IgOiBBZGFtIERyYXBlclxuICogbGljZW5zZSA6IE1JVFxuICogaHR0cDovL2FkYW13ZHJhcGVyLmdpdGh1Yi5jb20vTnVtZXJhbC1qcy9cbiAqL1xuXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBDb25zdGFudHNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICB2YXIgbnVtZXJhbCxcbiAgICAgICAgVkVSU0lPTiA9ICcxLjUuMycsXG4gICAgICAgIC8vIGludGVybmFsIHN0b3JhZ2UgZm9yIGxhbmd1YWdlIGNvbmZpZyBmaWxlc1xuICAgICAgICBsYW5ndWFnZXMgPSB7fSxcbiAgICAgICAgY3VycmVudExhbmd1YWdlID0gJ2VuJyxcbiAgICAgICAgemVyb0Zvcm1hdCA9IG51bGwsXG4gICAgICAgIGRlZmF1bHRGb3JtYXQgPSAnMCwwJyxcbiAgICAgICAgLy8gY2hlY2sgZm9yIG5vZGVKU1xuICAgICAgICBoYXNNb2R1bGUgPSAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpO1xuXG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIENvbnN0cnVjdG9yc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4gICAgLy8gTnVtZXJhbCBwcm90b3R5cGUgb2JqZWN0XG4gICAgZnVuY3Rpb24gTnVtZXJhbCAobnVtYmVyKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gbnVtYmVyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEltcGxlbWVudGF0aW9uIG9mIHRvRml4ZWQoKSB0aGF0IHRyZWF0cyBmbG9hdHMgbW9yZSBsaWtlIGRlY2ltYWxzXG4gICAgICpcbiAgICAgKiBGaXhlcyBiaW5hcnkgcm91bmRpbmcgaXNzdWVzIChlZy4gKDAuNjE1KS50b0ZpeGVkKDIpID09PSAnMC42MScpIHRoYXQgcHJlc2VudFxuICAgICAqIHByb2JsZW1zIGZvciBhY2NvdW50aW5nLSBhbmQgZmluYW5jZS1yZWxhdGVkIHNvZnR3YXJlLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRvRml4ZWQgKHZhbHVlLCBwcmVjaXNpb24sIHJvdW5kaW5nRnVuY3Rpb24sIG9wdGlvbmFscykge1xuICAgICAgICB2YXIgcG93ZXIgPSBNYXRoLnBvdygxMCwgcHJlY2lzaW9uKSxcbiAgICAgICAgICAgIG9wdGlvbmFsc1JlZ0V4cCxcbiAgICAgICAgICAgIG91dHB1dDtcbiAgICAgICAgICAgIFxuICAgICAgICAvL3JvdW5kaW5nRnVuY3Rpb24gPSAocm91bmRpbmdGdW5jdGlvbiAhPT0gdW5kZWZpbmVkID8gcm91bmRpbmdGdW5jdGlvbiA6IE1hdGgucm91bmQpO1xuICAgICAgICAvLyBNdWx0aXBseSB1cCBieSBwcmVjaXNpb24sIHJvdW5kIGFjY3VyYXRlbHksIHRoZW4gZGl2aWRlIGFuZCB1c2UgbmF0aXZlIHRvRml4ZWQoKTpcbiAgICAgICAgb3V0cHV0ID0gKHJvdW5kaW5nRnVuY3Rpb24odmFsdWUgKiBwb3dlcikgLyBwb3dlcikudG9GaXhlZChwcmVjaXNpb24pO1xuXG4gICAgICAgIGlmIChvcHRpb25hbHMpIHtcbiAgICAgICAgICAgIG9wdGlvbmFsc1JlZ0V4cCA9IG5ldyBSZWdFeHAoJzB7MSwnICsgb3B0aW9uYWxzICsgJ30kJyk7XG4gICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZShvcHRpb25hbHNSZWdFeHAsICcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBGb3JtYXR0aW5nXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgLy8gZGV0ZXJtaW5lIHdoYXQgdHlwZSBvZiBmb3JtYXR0aW5nIHdlIG5lZWQgdG8gZG9cbiAgICBmdW5jdGlvbiBmb3JtYXROdW1lcmFsIChuLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIG91dHB1dDtcblxuICAgICAgICAvLyBmaWd1cmUgb3V0IHdoYXQga2luZCBvZiBmb3JtYXQgd2UgYXJlIGRlYWxpbmcgd2l0aFxuICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyQnKSA+IC0xKSB7IC8vIGN1cnJlbmN5ISEhISFcbiAgICAgICAgICAgIG91dHB1dCA9IGZvcm1hdEN1cnJlbmN5KG4sIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0LmluZGV4T2YoJyUnKSA+IC0xKSB7IC8vIHBlcmNlbnRhZ2VcbiAgICAgICAgICAgIG91dHB1dCA9IGZvcm1hdFBlcmNlbnRhZ2UobiwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgfSBlbHNlIGlmIChmb3JtYXQuaW5kZXhPZignOicpID4gLTEpIHsgLy8gdGltZVxuICAgICAgICAgICAgb3V0cHV0ID0gZm9ybWF0VGltZShuLCBmb3JtYXQpO1xuICAgICAgICB9IGVsc2UgeyAvLyBwbGFpbiBvbCcgbnVtYmVycyBvciBieXRlc1xuICAgICAgICAgICAgb3V0cHV0ID0gZm9ybWF0TnVtYmVyKG4uX3ZhbHVlLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmV0dXJuIHN0cmluZ1xuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIC8vIHJldmVydCB0byBudW1iZXJcbiAgICBmdW5jdGlvbiB1bmZvcm1hdE51bWVyYWwgKG4sIHN0cmluZykge1xuICAgICAgICB2YXIgc3RyaW5nT3JpZ2luYWwgPSBzdHJpbmcsXG4gICAgICAgICAgICB0aG91c2FuZFJlZ0V4cCxcbiAgICAgICAgICAgIG1pbGxpb25SZWdFeHAsXG4gICAgICAgICAgICBiaWxsaW9uUmVnRXhwLFxuICAgICAgICAgICAgdHJpbGxpb25SZWdFeHAsXG4gICAgICAgICAgICBzdWZmaXhlcyA9IFsnS0InLCAnTUInLCAnR0InLCAnVEInLCAnUEInLCAnRUInLCAnWkInLCAnWUInXSxcbiAgICAgICAgICAgIGJ5dGVzTXVsdGlwbGllciA9IGZhbHNlLFxuICAgICAgICAgICAgcG93ZXI7XG5cbiAgICAgICAgaWYgKHN0cmluZy5pbmRleE9mKCc6JykgPiAtMSkge1xuICAgICAgICAgICAgbi5fdmFsdWUgPSB1bmZvcm1hdFRpbWUoc3RyaW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChzdHJpbmcgPT09IHplcm9Gb3JtYXQpIHtcbiAgICAgICAgICAgICAgICBuLl92YWx1ZSA9IDA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5kZWxpbWl0ZXJzLmRlY2ltYWwgIT09ICcuJykge1xuICAgICAgICAgICAgICAgICAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZSgvXFwuL2csJycpLnJlcGxhY2UobGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uZGVsaW1pdGVycy5kZWNpbWFsLCAnLicpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHNlZSBpZiBhYmJyZXZpYXRpb25zIGFyZSB0aGVyZSBzbyB0aGF0IHdlIGNhbiBtdWx0aXBseSB0byB0aGUgY29ycmVjdCBudW1iZXJcbiAgICAgICAgICAgICAgICB0aG91c2FuZFJlZ0V4cCA9IG5ldyBSZWdFeHAoJ1teYS16QS1aXScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLnRob3VzYW5kICsgJyg/OlxcXFwpfChcXFxcJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCArICcpPyg/OlxcXFwpKT8pPyQnKTtcbiAgICAgICAgICAgICAgICBtaWxsaW9uUmVnRXhwID0gbmV3IFJlZ0V4cCgnW15hLXpBLVpdJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMubWlsbGlvbiArICcoPzpcXFxcKXwoXFxcXCcgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyAnKT8oPzpcXFxcKSk/KT8kJyk7XG4gICAgICAgICAgICAgICAgYmlsbGlvblJlZ0V4cCA9IG5ldyBSZWdFeHAoJ1teYS16QS1aXScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLmJpbGxpb24gKyAnKD86XFxcXCl8KFxcXFwnICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgJyk/KD86XFxcXCkpPyk/JCcpO1xuICAgICAgICAgICAgICAgIHRyaWxsaW9uUmVnRXhwID0gbmV3IFJlZ0V4cCgnW15hLXpBLVpdJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMudHJpbGxpb24gKyAnKD86XFxcXCl8KFxcXFwnICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgJyk/KD86XFxcXCkpPyk/JCcpO1xuXG4gICAgICAgICAgICAgICAgLy8gc2VlIGlmIGJ5dGVzIGFyZSB0aGVyZSBzbyB0aGF0IHdlIGNhbiBtdWx0aXBseSB0byB0aGUgY29ycmVjdCBudW1iZXJcbiAgICAgICAgICAgICAgICBmb3IgKHBvd2VyID0gMDsgcG93ZXIgPD0gc3VmZml4ZXMubGVuZ3RoOyBwb3dlcisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGVzTXVsdGlwbGllciA9IChzdHJpbmcuaW5kZXhPZihzdWZmaXhlc1twb3dlcl0pID4gLTEpID8gTWF0aC5wb3coMTAyNCwgcG93ZXIgKyAxKSA6IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChieXRlc011bHRpcGxpZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gZG8gc29tZSBtYXRoIHRvIGNyZWF0ZSBvdXIgbnVtYmVyXG4gICAgICAgICAgICAgICAgbi5fdmFsdWUgPSAoKGJ5dGVzTXVsdGlwbGllcikgPyBieXRlc011bHRpcGxpZXIgOiAxKSAqICgoc3RyaW5nT3JpZ2luYWwubWF0Y2godGhvdXNhbmRSZWdFeHApKSA/IE1hdGgucG93KDEwLCAzKSA6IDEpICogKChzdHJpbmdPcmlnaW5hbC5tYXRjaChtaWxsaW9uUmVnRXhwKSkgPyBNYXRoLnBvdygxMCwgNikgOiAxKSAqICgoc3RyaW5nT3JpZ2luYWwubWF0Y2goYmlsbGlvblJlZ0V4cCkpID8gTWF0aC5wb3coMTAsIDkpIDogMSkgKiAoKHN0cmluZ09yaWdpbmFsLm1hdGNoKHRyaWxsaW9uUmVnRXhwKSkgPyBNYXRoLnBvdygxMCwgMTIpIDogMSkgKiAoKHN0cmluZy5pbmRleE9mKCclJykgPiAtMSkgPyAwLjAxIDogMSkgKiAoKChzdHJpbmcuc3BsaXQoJy0nKS5sZW5ndGggKyBNYXRoLm1pbihzdHJpbmcuc3BsaXQoJygnKS5sZW5ndGgtMSwgc3RyaW5nLnNwbGl0KCcpJykubGVuZ3RoLTEpKSAlIDIpPyAxOiAtMSkgKiBOdW1iZXIoc3RyaW5nLnJlcGxhY2UoL1teMC05XFwuXSsvZywgJycpKTtcblxuICAgICAgICAgICAgICAgIC8vIHJvdW5kIGlmIHdlIGFyZSB0YWxraW5nIGFib3V0IGJ5dGVzXG4gICAgICAgICAgICAgICAgbi5fdmFsdWUgPSAoYnl0ZXNNdWx0aXBsaWVyKSA/IE1hdGguY2VpbChuLl92YWx1ZSkgOiBuLl92YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbi5fdmFsdWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0Q3VycmVuY3kgKG4sIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbikge1xuICAgICAgICB2YXIgc3ltYm9sSW5kZXggPSBmb3JtYXQuaW5kZXhPZignJCcpLFxuICAgICAgICAgICAgb3BlblBhcmVuSW5kZXggPSBmb3JtYXQuaW5kZXhPZignKCcpLFxuICAgICAgICAgICAgbWludXNTaWduSW5kZXggPSBmb3JtYXQuaW5kZXhPZignLScpLFxuICAgICAgICAgICAgc3BhY2UgPSAnJyxcbiAgICAgICAgICAgIHNwbGljZUluZGV4LFxuICAgICAgICAgICAgb3V0cHV0O1xuXG4gICAgICAgIC8vIGNoZWNrIGZvciBzcGFjZSBiZWZvcmUgb3IgYWZ0ZXIgY3VycmVuY3lcbiAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcgJCcpID4gLTEpIHtcbiAgICAgICAgICAgIHNwYWNlID0gJyAnO1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyAkJywgJycpO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdC5pbmRleE9mKCckICcpID4gLTEpIHtcbiAgICAgICAgICAgIHNwYWNlID0gJyAnO1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyQgJywgJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyQnLCAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBmb3JtYXQgdGhlIG51bWJlclxuICAgICAgICBvdXRwdXQgPSBmb3JtYXROdW1iZXIobi5fdmFsdWUsIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbik7XG5cbiAgICAgICAgLy8gcG9zaXRpb24gdGhlIHN5bWJvbFxuICAgICAgICBpZiAoc3ltYm9sSW5kZXggPD0gMSkge1xuICAgICAgICAgICAgaWYgKG91dHB1dC5pbmRleE9mKCcoJykgPiAtMSB8fCBvdXRwdXQuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQuc3BsaXQoJycpO1xuICAgICAgICAgICAgICAgIHNwbGljZUluZGV4ID0gMTtcbiAgICAgICAgICAgICAgICBpZiAoc3ltYm9sSW5kZXggPCBvcGVuUGFyZW5JbmRleCB8fCBzeW1ib2xJbmRleCA8IG1pbnVzU2lnbkluZGV4KXtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHN5bWJvbCBhcHBlYXJzIGJlZm9yZSB0aGUgXCIoXCIgb3IgXCItXCJcbiAgICAgICAgICAgICAgICAgICAgc3BsaWNlSW5kZXggPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvdXRwdXQuc3BsaWNlKHNwbGljZUluZGV4LCAwLCBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyBzcGFjZSk7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LmpvaW4oJycpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyBzcGFjZSArIG91dHB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChvdXRwdXQuaW5kZXhPZignKScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQuc3BsaXQoJycpO1xuICAgICAgICAgICAgICAgIG91dHB1dC5zcGxpY2UoLTEsIDAsIHNwYWNlICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sKTtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQuam9pbignJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dCArIHNwYWNlICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXRQZXJjZW50YWdlIChuLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIHNwYWNlID0gJycsXG4gICAgICAgICAgICBvdXRwdXQsXG4gICAgICAgICAgICB2YWx1ZSA9IG4uX3ZhbHVlICogMTAwO1xuXG4gICAgICAgIC8vIGNoZWNrIGZvciBzcGFjZSBiZWZvcmUgJVxuICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyAlJykgPiAtMSkge1xuICAgICAgICAgICAgc3BhY2UgPSAnICc7XG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnICUnLCAnJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnJScsICcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG91dHB1dCA9IGZvcm1hdE51bWJlcih2YWx1ZSwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChvdXRwdXQuaW5kZXhPZignKScpID4gLTEgKSB7XG4gICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQuc3BsaXQoJycpO1xuICAgICAgICAgICAgb3V0cHV0LnNwbGljZSgtMSwgMCwgc3BhY2UgKyAnJScpO1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LmpvaW4oJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgc3BhY2UgKyAnJSc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZvcm1hdFRpbWUgKG4pIHtcbiAgICAgICAgdmFyIGhvdXJzID0gTWF0aC5mbG9vcihuLl92YWx1ZS82MC82MCksXG4gICAgICAgICAgICBtaW51dGVzID0gTWF0aC5mbG9vcigobi5fdmFsdWUgLSAoaG91cnMgKiA2MCAqIDYwKSkvNjApLFxuICAgICAgICAgICAgc2Vjb25kcyA9IE1hdGgucm91bmQobi5fdmFsdWUgLSAoaG91cnMgKiA2MCAqIDYwKSAtIChtaW51dGVzICogNjApKTtcbiAgICAgICAgcmV0dXJuIGhvdXJzICsgJzonICsgKChtaW51dGVzIDwgMTApID8gJzAnICsgbWludXRlcyA6IG1pbnV0ZXMpICsgJzonICsgKChzZWNvbmRzIDwgMTApID8gJzAnICsgc2Vjb25kcyA6IHNlY29uZHMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVuZm9ybWF0VGltZSAoc3RyaW5nKSB7XG4gICAgICAgIHZhciB0aW1lQXJyYXkgPSBzdHJpbmcuc3BsaXQoJzonKSxcbiAgICAgICAgICAgIHNlY29uZHMgPSAwO1xuICAgICAgICAvLyB0dXJuIGhvdXJzIGFuZCBtaW51dGVzIGludG8gc2Vjb25kcyBhbmQgYWRkIHRoZW0gYWxsIHVwXG4gICAgICAgIGlmICh0aW1lQXJyYXkubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICAvLyBob3Vyc1xuICAgICAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgKyAoTnVtYmVyKHRpbWVBcnJheVswXSkgKiA2MCAqIDYwKTtcbiAgICAgICAgICAgIC8vIG1pbnV0ZXNcbiAgICAgICAgICAgIHNlY29uZHMgPSBzZWNvbmRzICsgKE51bWJlcih0aW1lQXJyYXlbMV0pICogNjApO1xuICAgICAgICAgICAgLy8gc2Vjb25kc1xuICAgICAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgKyBOdW1iZXIodGltZUFycmF5WzJdKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aW1lQXJyYXkubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICAvLyBtaW51dGVzXG4gICAgICAgICAgICBzZWNvbmRzID0gc2Vjb25kcyArIChOdW1iZXIodGltZUFycmF5WzBdKSAqIDYwKTtcbiAgICAgICAgICAgIC8vIHNlY29uZHNcbiAgICAgICAgICAgIHNlY29uZHMgPSBzZWNvbmRzICsgTnVtYmVyKHRpbWVBcnJheVsxXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE51bWJlcihzZWNvbmRzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXROdW1iZXIgKHZhbHVlLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIG5lZ1AgPSBmYWxzZSxcbiAgICAgICAgICAgIHNpZ25lZCA9IGZhbHNlLFxuICAgICAgICAgICAgb3B0RGVjID0gZmFsc2UsXG4gICAgICAgICAgICBhYmJyID0gJycsXG4gICAgICAgICAgICBhYmJySyA9IGZhbHNlLCAvLyBmb3JjZSBhYmJyZXZpYXRpb24gdG8gdGhvdXNhbmRzXG4gICAgICAgICAgICBhYmJyTSA9IGZhbHNlLCAvLyBmb3JjZSBhYmJyZXZpYXRpb24gdG8gbWlsbGlvbnNcbiAgICAgICAgICAgIGFiYnJCID0gZmFsc2UsIC8vIGZvcmNlIGFiYnJldmlhdGlvbiB0byBiaWxsaW9uc1xuICAgICAgICAgICAgYWJiclQgPSBmYWxzZSwgLy8gZm9yY2UgYWJicmV2aWF0aW9uIHRvIHRyaWxsaW9uc1xuICAgICAgICAgICAgYWJickZvcmNlID0gZmFsc2UsIC8vIGZvcmNlIGFiYnJldmlhdGlvblxuICAgICAgICAgICAgYnl0ZXMgPSAnJyxcbiAgICAgICAgICAgIG9yZCA9ICcnLFxuICAgICAgICAgICAgYWJzID0gTWF0aC5hYnModmFsdWUpLFxuICAgICAgICAgICAgc3VmZml4ZXMgPSBbJ0InLCAnS0InLCAnTUInLCAnR0InLCAnVEInLCAnUEInLCAnRUInLCAnWkInLCAnWUInXSxcbiAgICAgICAgICAgIG1pbixcbiAgICAgICAgICAgIG1heCxcbiAgICAgICAgICAgIHBvd2VyLFxuICAgICAgICAgICAgdyxcbiAgICAgICAgICAgIHByZWNpc2lvbixcbiAgICAgICAgICAgIHRob3VzYW5kcyxcbiAgICAgICAgICAgIGQgPSAnJyxcbiAgICAgICAgICAgIG5lZyA9IGZhbHNlO1xuXG4gICAgICAgIC8vIGNoZWNrIGlmIG51bWJlciBpcyB6ZXJvIGFuZCBhIGN1c3RvbSB6ZXJvIGZvcm1hdCBoYXMgYmVlbiBzZXRcbiAgICAgICAgaWYgKHZhbHVlID09PSAwICYmIHplcm9Gb3JtYXQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB6ZXJvRm9ybWF0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gc2VlIGlmIHdlIHNob3VsZCB1c2UgcGFyZW50aGVzZXMgZm9yIG5lZ2F0aXZlIG51bWJlciBvciBpZiB3ZSBzaG91bGQgcHJlZml4IHdpdGggYSBzaWduXG4gICAgICAgICAgICAvLyBpZiBib3RoIGFyZSBwcmVzZW50IHdlIGRlZmF1bHQgdG8gcGFyZW50aGVzZXNcbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignKCcpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBuZWdQID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQuc2xpY2UoMSwgLTEpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChmb3JtYXQuaW5kZXhPZignKycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBzaWduZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKC9cXCsvZywgJycpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzZWUgaWYgYWJicmV2aWF0aW9uIGlzIHdhbnRlZFxuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCdhJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIGFiYnJldmlhdGlvbiBpcyBzcGVjaWZpZWRcbiAgICAgICAgICAgICAgICBhYmJySyA9IGZvcm1hdC5pbmRleE9mKCdhSycpID49IDA7XG4gICAgICAgICAgICAgICAgYWJick0gPSBmb3JtYXQuaW5kZXhPZignYU0nKSA+PSAwO1xuICAgICAgICAgICAgICAgIGFiYnJCID0gZm9ybWF0LmluZGV4T2YoJ2FCJykgPj0gMDtcbiAgICAgICAgICAgICAgICBhYmJyVCA9IGZvcm1hdC5pbmRleE9mKCdhVCcpID49IDA7XG4gICAgICAgICAgICAgICAgYWJickZvcmNlID0gYWJicksgfHwgYWJick0gfHwgYWJickIgfHwgYWJiclQ7XG5cbiAgICAgICAgICAgICAgICAvLyBjaGVjayBmb3Igc3BhY2UgYmVmb3JlIGFiYnJldmlhdGlvblxuICAgICAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignIGEnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGFiYnIgPSAnICc7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCcgYScsICcnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnYScsICcnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYWJzID49IE1hdGgucG93KDEwLCAxMikgJiYgIWFiYnJGb3JjZSB8fCBhYmJyVCkge1xuICAgICAgICAgICAgICAgICAgICAvLyB0cmlsbGlvblxuICAgICAgICAgICAgICAgICAgICBhYmJyID0gYWJiciArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMudHJpbGxpb247XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgMTIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYWJzIDwgTWF0aC5wb3coMTAsIDEyKSAmJiBhYnMgPj0gTWF0aC5wb3coMTAsIDkpICYmICFhYmJyRm9yY2UgfHwgYWJickIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYmlsbGlvblxuICAgICAgICAgICAgICAgICAgICBhYmJyID0gYWJiciArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMuYmlsbGlvbjtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KDEwLCA5KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFicyA8IE1hdGgucG93KDEwLCA5KSAmJiBhYnMgPj0gTWF0aC5wb3coMTAsIDYpICYmICFhYmJyRm9yY2UgfHwgYWJick0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbWlsbGlvblxuICAgICAgICAgICAgICAgICAgICBhYmJyID0gYWJiciArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMubWlsbGlvbjtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KDEwLCA2KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFicyA8IE1hdGgucG93KDEwLCA2KSAmJiBhYnMgPj0gTWF0aC5wb3coMTAsIDMpICYmICFhYmJyRm9yY2UgfHwgYWJickspIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhvdXNhbmRcbiAgICAgICAgICAgICAgICAgICAgYWJiciA9IGFiYnIgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLnRob3VzYW5kO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gTWF0aC5wb3coMTAsIDMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2VlIGlmIHdlIGFyZSBmb3JtYXR0aW5nIGJ5dGVzXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJ2InKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgZm9yIHNwYWNlIGJlZm9yZVxuICAgICAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignIGInKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGVzID0gJyAnO1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnIGInLCAnJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJ2InLCAnJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yIChwb3dlciA9IDA7IHBvd2VyIDw9IHN1ZmZpeGVzLmxlbmd0aDsgcG93ZXIrKykge1xuICAgICAgICAgICAgICAgICAgICBtaW4gPSBNYXRoLnBvdygxMDI0LCBwb3dlcik7XG4gICAgICAgICAgICAgICAgICAgIG1heCA9IE1hdGgucG93KDEwMjQsIHBvd2VyKzEpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA+PSBtaW4gJiYgdmFsdWUgPCBtYXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ5dGVzID0gYnl0ZXMgKyBzdWZmaXhlc1twb3dlcl07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWluID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBtaW47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2VlIGlmIG9yZGluYWwgaXMgd2FudGVkXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJ28nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgZm9yIHNwYWNlIGJlZm9yZVxuICAgICAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignIG8nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIG9yZCA9ICcgJztcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyBvJywgJycpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCdvJywgJycpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG9yZCA9IG9yZCArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLm9yZGluYWwodmFsdWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJ1suXScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBvcHREZWMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCdbLl0nLCAnLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB3ID0gdmFsdWUudG9TdHJpbmcoKS5zcGxpdCgnLicpWzBdO1xuICAgICAgICAgICAgcHJlY2lzaW9uID0gZm9ybWF0LnNwbGl0KCcuJylbMV07XG4gICAgICAgICAgICB0aG91c2FuZHMgPSBmb3JtYXQuaW5kZXhPZignLCcpO1xuXG4gICAgICAgICAgICBpZiAocHJlY2lzaW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHByZWNpc2lvbi5pbmRleE9mKCdbJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBwcmVjaXNpb24gPSBwcmVjaXNpb24ucmVwbGFjZSgnXScsICcnKTtcbiAgICAgICAgICAgICAgICAgICAgcHJlY2lzaW9uID0gcHJlY2lzaW9uLnNwbGl0KCdbJyk7XG4gICAgICAgICAgICAgICAgICAgIGQgPSB0b0ZpeGVkKHZhbHVlLCAocHJlY2lzaW9uWzBdLmxlbmd0aCArIHByZWNpc2lvblsxXS5sZW5ndGgpLCByb3VuZGluZ0Z1bmN0aW9uLCBwcmVjaXNpb25bMV0ubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkID0gdG9GaXhlZCh2YWx1ZSwgcHJlY2lzaW9uLmxlbmd0aCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdyA9IGQuc3BsaXQoJy4nKVswXTtcblxuICAgICAgICAgICAgICAgIGlmIChkLnNwbGl0KCcuJylbMV0ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGQgPSBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5kZWxpbWl0ZXJzLmRlY2ltYWwgKyBkLnNwbGl0KCcuJylbMV07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZCA9ICcnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChvcHREZWMgJiYgTnVtYmVyKGQuc2xpY2UoMSkpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGQgPSAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHcgPSB0b0ZpeGVkKHZhbHVlLCBudWxsLCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZm9ybWF0IG51bWJlclxuICAgICAgICAgICAgaWYgKHcuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICB3ID0gdy5zbGljZSgxKTtcbiAgICAgICAgICAgICAgICBuZWcgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhvdXNhbmRzID4gLTEpIHtcbiAgICAgICAgICAgICAgICB3ID0gdy50b1N0cmluZygpLnJlcGxhY2UoLyhcXGQpKD89KFxcZHszfSkrKD8hXFxkKSkvZywgJyQxJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmRlbGltaXRlcnMudGhvdXNhbmRzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcuJykgPT09IDApIHtcbiAgICAgICAgICAgICAgICB3ID0gJyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAoKG5lZ1AgJiYgbmVnKSA/ICcoJyA6ICcnKSArICgoIW5lZ1AgJiYgbmVnKSA/ICctJyA6ICcnKSArICgoIW5lZyAmJiBzaWduZWQpID8gJysnIDogJycpICsgdyArIGQgKyAoKG9yZCkgPyBvcmQgOiAnJykgKyAoKGFiYnIpID8gYWJiciA6ICcnKSArICgoYnl0ZXMpID8gYnl0ZXMgOiAnJykgKyAoKG5lZ1AgJiYgbmVnKSA/ICcpJyA6ICcnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgVG9wIExldmVsIEZ1bmN0aW9uc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIG51bWVyYWwgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgaWYgKG51bWVyYWwuaXNOdW1lcmFsKGlucHV0KSkge1xuICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC52YWx1ZSgpO1xuICAgICAgICB9IGVsc2UgaWYgKGlucHV0ID09PSAwIHx8IHR5cGVvZiBpbnB1dCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlucHV0ID0gMDtcbiAgICAgICAgfSBlbHNlIGlmICghTnVtYmVyKGlucHV0KSkge1xuICAgICAgICAgICAgaW5wdXQgPSBudW1lcmFsLmZuLnVuZm9ybWF0KGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgTnVtZXJhbChOdW1iZXIoaW5wdXQpKTtcbiAgICB9O1xuXG4gICAgLy8gdmVyc2lvbiBudW1iZXJcbiAgICBudW1lcmFsLnZlcnNpb24gPSBWRVJTSU9OO1xuXG4gICAgLy8gY29tcGFyZSBudW1lcmFsIG9iamVjdFxuICAgIG51bWVyYWwuaXNOdW1lcmFsID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgTnVtZXJhbDtcbiAgICB9O1xuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiB3aWxsIGxvYWQgbGFuZ3VhZ2VzIGFuZCB0aGVuIHNldCB0aGUgZ2xvYmFsIGxhbmd1YWdlLiAgSWZcbiAgICAvLyBubyBhcmd1bWVudHMgYXJlIHBhc3NlZCBpbiwgaXQgd2lsbCBzaW1wbHkgcmV0dXJuIHRoZSBjdXJyZW50IGdsb2JhbFxuICAgIC8vIGxhbmd1YWdlIGtleS5cbiAgICBudW1lcmFsLmxhbmd1YWdlID0gZnVuY3Rpb24gKGtleSwgdmFsdWVzKSB7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudExhbmd1YWdlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGtleSAmJiAhdmFsdWVzKSB7XG4gICAgICAgICAgICBpZighbGFuZ3VhZ2VzW2tleV0pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gbGFuZ3VhZ2UgOiAnICsga2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnJlbnRMYW5ndWFnZSA9IGtleTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZXMgfHwgIWxhbmd1YWdlc1trZXldKSB7XG4gICAgICAgICAgICBsb2FkTGFuZ3VhZ2Uoa2V5LCB2YWx1ZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bWVyYWw7XG4gICAgfTtcbiAgICBcbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHByb3ZpZGVzIGFjY2VzcyB0byB0aGUgbG9hZGVkIGxhbmd1YWdlIGRhdGEuICBJZlxuICAgIC8vIG5vIGFyZ3VtZW50cyBhcmUgcGFzc2VkIGluLCBpdCB3aWxsIHNpbXBseSByZXR1cm4gdGhlIGN1cnJlbnRcbiAgICAvLyBnbG9iYWwgbGFuZ3VhZ2Ugb2JqZWN0LlxuICAgIG51bWVyYWwubGFuZ3VhZ2VEYXRhID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIWxhbmd1YWdlc1trZXldKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gbGFuZ3VhZ2UgOiAnICsga2V5KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGxhbmd1YWdlc1trZXldO1xuICAgIH07XG5cbiAgICBudW1lcmFsLmxhbmd1YWdlKCdlbicsIHtcbiAgICAgICAgZGVsaW1pdGVyczoge1xuICAgICAgICAgICAgdGhvdXNhbmRzOiAnLCcsXG4gICAgICAgICAgICBkZWNpbWFsOiAnLidcbiAgICAgICAgfSxcbiAgICAgICAgYWJicmV2aWF0aW9uczoge1xuICAgICAgICAgICAgdGhvdXNhbmQ6ICdrJyxcbiAgICAgICAgICAgIG1pbGxpb246ICdtJyxcbiAgICAgICAgICAgIGJpbGxpb246ICdiJyxcbiAgICAgICAgICAgIHRyaWxsaW9uOiAndCdcbiAgICAgICAgfSxcbiAgICAgICAgb3JkaW5hbDogZnVuY3Rpb24gKG51bWJlcikge1xuICAgICAgICAgICAgdmFyIGIgPSBudW1iZXIgJSAxMDtcbiAgICAgICAgICAgIHJldHVybiAofn4gKG51bWJlciAlIDEwMCAvIDEwKSA9PT0gMSkgPyAndGgnIDpcbiAgICAgICAgICAgICAgICAoYiA9PT0gMSkgPyAnc3QnIDpcbiAgICAgICAgICAgICAgICAoYiA9PT0gMikgPyAnbmQnIDpcbiAgICAgICAgICAgICAgICAoYiA9PT0gMykgPyAncmQnIDogJ3RoJztcbiAgICAgICAgfSxcbiAgICAgICAgY3VycmVuY3k6IHtcbiAgICAgICAgICAgIHN5bWJvbDogJyQnXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIG51bWVyYWwuemVyb0Zvcm1hdCA9IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgemVyb0Zvcm1hdCA9IHR5cGVvZihmb3JtYXQpID09PSAnc3RyaW5nJyA/IGZvcm1hdCA6IG51bGw7XG4gICAgfTtcblxuICAgIG51bWVyYWwuZGVmYXVsdEZvcm1hdCA9IGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICAgICAgZGVmYXVsdEZvcm1hdCA9IHR5cGVvZihmb3JtYXQpID09PSAnc3RyaW5nJyA/IGZvcm1hdCA6ICcwLjAnO1xuICAgIH07XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEhlbHBlcnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICBmdW5jdGlvbiBsb2FkTGFuZ3VhZ2Uoa2V5LCB2YWx1ZXMpIHtcbiAgICAgICAgbGFuZ3VhZ2VzW2tleV0gPSB2YWx1ZXM7XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBGbG9hdGluZy1wb2ludCBoZWxwZXJzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgLy8gVGhlIGZsb2F0aW5nLXBvaW50IGhlbHBlciBmdW5jdGlvbnMgYW5kIGltcGxlbWVudGF0aW9uXG4gICAgLy8gYm9ycm93cyBoZWF2aWx5IGZyb20gc2luZnVsLmpzOiBodHRwOi8vZ3VpcG4uZ2l0aHViLmlvL3NpbmZ1bC5qcy9cblxuICAgIC8qKlxuICAgICAqIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UgZm9yIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBpdFxuICAgICAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L1JlZHVjZSNDb21wYXRpYmlsaXR5XG4gICAgICovXG4gICAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBBcnJheS5wcm90b3R5cGUucmVkdWNlKSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIG9wdF9pbml0aWFsVmFsdWUpIHtcbiAgICAgICAgICAgICd1c2Ugc3RyaWN0JztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKG51bGwgPT09IHRoaXMgfHwgJ3VuZGVmaW5lZCcgPT09IHR5cGVvZiB0aGlzKSB7XG4gICAgICAgICAgICAgICAgLy8gQXQgdGhlIG1vbWVudCBhbGwgbW9kZXJuIGJyb3dzZXJzLCB0aGF0IHN1cHBvcnQgc3RyaWN0IG1vZGUsIGhhdmVcbiAgICAgICAgICAgICAgICAvLyBuYXRpdmUgaW1wbGVtZW50YXRpb24gb2YgQXJyYXkucHJvdG90eXBlLnJlZHVjZS4gRm9yIGluc3RhbmNlLCBJRThcbiAgICAgICAgICAgICAgICAvLyBkb2VzIG5vdCBzdXBwb3J0IHN0cmljdCBtb2RlLCBzbyB0aGlzIGNoZWNrIGlzIGFjdHVhbGx5IHVzZWxlc3MuXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJyYXkucHJvdG90eXBlLnJlZHVjZSBjYWxsZWQgb24gbnVsbCBvciB1bmRlZmluZWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoY2FsbGJhY2sgKyAnIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBpbmRleCxcbiAgICAgICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgICAgICBsZW5ndGggPSB0aGlzLmxlbmd0aCA+Pj4gMCxcbiAgICAgICAgICAgICAgICBpc1ZhbHVlU2V0ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGlmICgxIDwgYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gb3B0X2luaXRpYWxWYWx1ZTtcbiAgICAgICAgICAgICAgICBpc1ZhbHVlU2V0ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChpbmRleCA9IDA7IGxlbmd0aCA+IGluZGV4OyArK2luZGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFzT3duUHJvcGVydHkoaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1ZhbHVlU2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGNhbGxiYWNrKHZhbHVlLCB0aGlzW2luZGV4XSwgaW5kZXgsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB0aGlzW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzVmFsdWVTZXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWlzVmFsdWVTZXQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdSZWR1Y2Ugb2YgZW1wdHkgYXJyYXkgd2l0aCBubyBpbml0aWFsIHZhbHVlJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBcbiAgICAvKipcbiAgICAgKiBDb21wdXRlcyB0aGUgbXVsdGlwbGllciBuZWNlc3NhcnkgdG8gbWFrZSB4ID49IDEsXG4gICAgICogZWZmZWN0aXZlbHkgZWxpbWluYXRpbmcgbWlzY2FsY3VsYXRpb25zIGNhdXNlZCBieVxuICAgICAqIGZpbml0ZSBwcmVjaXNpb24uXG4gICAgICovXG4gICAgZnVuY3Rpb24gbXVsdGlwbGllcih4KSB7XG4gICAgICAgIHZhciBwYXJ0cyA9IHgudG9TdHJpbmcoKS5zcGxpdCgnLicpO1xuICAgICAgICBpZiAocGFydHMubGVuZ3RoIDwgMikge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE1hdGgucG93KDEwLCBwYXJ0c1sxXS5sZW5ndGgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdpdmVuIGEgdmFyaWFibGUgbnVtYmVyIG9mIGFyZ3VtZW50cywgcmV0dXJucyB0aGUgbWF4aW11bVxuICAgICAqIG11bHRpcGxpZXIgdGhhdCBtdXN0IGJlIHVzZWQgdG8gbm9ybWFsaXplIGFuIG9wZXJhdGlvbiBpbnZvbHZpbmdcbiAgICAgKiBhbGwgb2YgdGhlbS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjb3JyZWN0aW9uRmFjdG9yKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiBhcmdzLnJlZHVjZShmdW5jdGlvbiAocHJldiwgbmV4dCkge1xuICAgICAgICAgICAgdmFyIG1wID0gbXVsdGlwbGllcihwcmV2KSxcbiAgICAgICAgICAgICAgICBtbiA9IG11bHRpcGxpZXIobmV4dCk7XG4gICAgICAgIHJldHVybiBtcCA+IG1uID8gbXAgOiBtbjtcbiAgICAgICAgfSwgLUluZmluaXR5KTtcbiAgICB9ICAgICAgICBcblxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBOdW1lcmFsIFByb3RvdHlwZVxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4gICAgbnVtZXJhbC5mbiA9IE51bWVyYWwucHJvdG90eXBlID0ge1xuXG4gICAgICAgIGNsb25lIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bWVyYWwodGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZm9ybWF0IDogZnVuY3Rpb24gKGlucHV0U3RyaW5nLCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0TnVtZXJhbCh0aGlzLCBcbiAgICAgICAgICAgICAgICAgIGlucHV0U3RyaW5nID8gaW5wdXRTdHJpbmcgOiBkZWZhdWx0Rm9ybWF0LCBcbiAgICAgICAgICAgICAgICAgIChyb3VuZGluZ0Z1bmN0aW9uICE9PSB1bmRlZmluZWQpID8gcm91bmRpbmdGdW5jdGlvbiA6IE1hdGgucm91bmRcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgfSxcblxuICAgICAgICB1bmZvcm1hdCA6IGZ1bmN0aW9uIChpbnB1dFN0cmluZykge1xuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dFN0cmluZykgPT09ICdbb2JqZWN0IE51bWJlcl0nKSB7IFxuICAgICAgICAgICAgICAgIHJldHVybiBpbnB1dFN0cmluZzsgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdW5mb3JtYXROdW1lcmFsKHRoaXMsIGlucHV0U3RyaW5nID8gaW5wdXRTdHJpbmcgOiBkZWZhdWx0Rm9ybWF0KTtcbiAgICAgICAgfSxcblxuICAgICAgICB2YWx1ZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICB2YWx1ZU9mIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldCA6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSBOdW1iZXIodmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWRkIDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgY29yckZhY3RvciA9IGNvcnJlY3Rpb25GYWN0b3IuY2FsbChudWxsLCB0aGlzLl92YWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgZnVuY3Rpb24gY2JhY2soYWNjdW0sIGN1cnIsIGN1cnJJLCBPKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjY3VtICsgY29yckZhY3RvciAqIGN1cnI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IFt0aGlzLl92YWx1ZSwgdmFsdWVdLnJlZHVjZShjYmFjaywgMCkgLyBjb3JyRmFjdG9yO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3VidHJhY3QgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBjb3JyRmFjdG9yID0gY29ycmVjdGlvbkZhY3Rvci5jYWxsKG51bGwsIHRoaXMuX3ZhbHVlLCB2YWx1ZSk7XG4gICAgICAgICAgICBmdW5jdGlvbiBjYmFjayhhY2N1bSwgY3VyciwgY3VyckksIE8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWNjdW0gLSBjb3JyRmFjdG9yICogY3VycjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gW3ZhbHVlXS5yZWR1Y2UoY2JhY2ssIHRoaXMuX3ZhbHVlICogY29yckZhY3RvcikgLyBjb3JyRmFjdG9yOyAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbXVsdGlwbHkgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNiYWNrKGFjY3VtLCBjdXJyLCBjdXJySSwgTykge1xuICAgICAgICAgICAgICAgIHZhciBjb3JyRmFjdG9yID0gY29ycmVjdGlvbkZhY3RvcihhY2N1bSwgY3Vycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChhY2N1bSAqIGNvcnJGYWN0b3IpICogKGN1cnIgKiBjb3JyRmFjdG9yKSAvXG4gICAgICAgICAgICAgICAgICAgIChjb3JyRmFjdG9yICogY29yckZhY3Rvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IFt0aGlzLl92YWx1ZSwgdmFsdWVdLnJlZHVjZShjYmFjaywgMSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBkaXZpZGUgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNiYWNrKGFjY3VtLCBjdXJyLCBjdXJySSwgTykge1xuICAgICAgICAgICAgICAgIHZhciBjb3JyRmFjdG9yID0gY29ycmVjdGlvbkZhY3RvcihhY2N1bSwgY3Vycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChhY2N1bSAqIGNvcnJGYWN0b3IpIC8gKGN1cnIgKiBjb3JyRmFjdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gW3RoaXMuX3ZhbHVlLCB2YWx1ZV0ucmVkdWNlKGNiYWNrKTsgICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRpZmZlcmVuY2UgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmFicyhudW1lcmFsKHRoaXMuX3ZhbHVlKS5zdWJ0cmFjdCh2YWx1ZSkudmFsdWUoKSk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEV4cG9zaW5nIE51bWVyYWxcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAvLyBDb21tb25KUyBtb2R1bGUgaXMgZGVmaW5lZFxuICAgIGlmIChoYXNNb2R1bGUpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBudW1lcmFsO1xuICAgIH1cblxuICAgIC8qZ2xvYmFsIGVuZGVyOmZhbHNlICovXG4gICAgaWYgKHR5cGVvZiBlbmRlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gaGVyZSwgYHRoaXNgIG1lYW5zIGB3aW5kb3dgIGluIHRoZSBicm93c2VyLCBvciBgZ2xvYmFsYCBvbiB0aGUgc2VydmVyXG4gICAgICAgIC8vIGFkZCBgbnVtZXJhbGAgYXMgYSBnbG9iYWwgb2JqZWN0IHZpYSBhIHN0cmluZyBpZGVudGlmaWVyLFxuICAgICAgICAvLyBmb3IgQ2xvc3VyZSBDb21waWxlciAnYWR2YW5jZWQnIG1vZGVcbiAgICAgICAgdGhpc1snbnVtZXJhbCddID0gbnVtZXJhbDtcbiAgICB9XG5cbiAgICAvKmdsb2JhbCBkZWZpbmU6ZmFsc2UgKi9cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbXSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bWVyYWw7XG4gICAgICAgIH0pO1xuICAgIH1cbn0pLmNhbGwodGhpcyk7XG4iLCIvKipcbiAgICBBY2NvdW50IGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIHNpbmdsZXRvbiA9IG51bGwsXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKSxcbiAgICBOYXZCYXIgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkJhcicpO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0QWNjb3VudCgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IEFjY291bnRBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XG4gICAgXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbn07XG5cbmZ1bmN0aW9uIEFjY291bnRBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xuICAgIFxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcblxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XG4gICAgICAgIHRpdGxlOiAnQWNjb3VudCcsXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5tZW51TmV3SXRlbSxcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5tZW51SW5cbiAgICB9KTtcbn1cblxuQWNjb3VudEFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG5cbn07XG4iLCIvKiogQ2FsZW5kYXIgYWN0aXZpdHkgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyksXHJcbiAgICBOYXZCYXIgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkJhcicpO1xyXG5yZXF1aXJlKCcuLi9jb21wb25lbnRzL0RhdGVQaWNrZXInKTtcclxuXHJcbnZhciBzaW5nbGV0b24gPSBudWxsO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdEFwcG9pbnRtZW50KCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcclxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgQXBwb2ludG1lbnRBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XHJcbiAgICBcclxuICAgIHJldHVybiBzaW5nbGV0b247XHJcbn07XHJcblxyXG5mdW5jdGlvbiBBcHBvaW50bWVudEFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xyXG4gICAgdGhpcy5tZW51SXRlbSA9ICdjYWxlbmRhcic7XHJcbiAgICBcclxuICAgIC8qIEdldHRpbmcgZWxlbWVudHMgKi9cclxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xyXG4gICAgdGhpcy4kYXBwb2ludG1lbnRWaWV3ID0gJGFjdGl2aXR5LmZpbmQoJyNjYWxlbmRhckFwcG9pbnRtZW50VmlldycpO1xyXG4gICAgdGhpcy4kY2hvb3NlTmV3ID0gJCgnI2NhbGVuZGFyQ2hvb3NlTmV3Jyk7XHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuICAgIFxyXG4gICAgLy8gT2JqZWN0IHRvIGhvbGQgdGhlIG9wdGlvbnMgcGFzc2VkIG9uICdzaG93JyBhcyBhIHJlc3VsdFxyXG4gICAgLy8gb2YgYSByZXF1ZXN0IGZyb20gYW5vdGhlciBhY3Rpdml0eVxyXG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XHJcbiAgICBcclxuICAgIC8vIENyZWF0ZSBhIHNwZWNpZmljIGJhY2tBY3Rpb24gdGhhdCBzaG93cyBjdXJyZW50IGRhdGVcclxuICAgIC8vIGFuZCByZXR1cm4gdG8gY2FsZW5kYXIgaW4gY3VycmVudCBkYXRlLlxyXG4gICAgLy8gTGF0ZXIgc29tZSBtb3JlIGNoYW5nZXMgYXJlIGFwcGxpZWQsIHdpdGggdmlld21vZGVsIHJlYWR5XHJcbiAgICB2YXIgYmFja0FjdGlvbiA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgICAgIGxpbms6ICdjYWxlbmRhci8nLCAvLyBQcmVzZXJ2ZSBsYXN0IHNsYXNoLCBmb3IgbGF0ZXIgdXNlXHJcbiAgICAgICAgaWNvbjogTmF2QWN0aW9uLmdvQmFjay5pY29uKCksXHJcbiAgICAgICAgaXNUaXRsZTogdHJ1ZSxcclxuICAgICAgICB0ZXh0OiAnQ2FsZW5kYXInXHJcbiAgICB9KTtcclxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XHJcbiAgICAgICAgdGl0bGU6ICcnLFxyXG4gICAgICAgIGxlZnRBY3Rpb246IGJhY2tBY3Rpb24sXHJcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5nb0hlbHBJbmRleFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMuaW5pdEFwcG9pbnRtZW50KCk7XHJcbiAgICBcclxuICAgIC8vIFRoaXMgdGl0bGUgdGV4dCBpcyBkeW5hbWljLCB3ZSBuZWVkIHRvIHJlcGxhY2UgaXQgYnkgYSBjb21wdXRlZCBvYnNlcnZhYmxlXHJcbiAgICAvLyBzaG93aW5nIHRoZSBjdXJyZW50IGRhdGVcclxuICAgIHZhciBkZWZCYWNrVGV4dCA9IGJhY2tBY3Rpb24udGV4dC5faW5pdGlhbFZhbHVlO1xyXG4gICAgYmFja0FjdGlvbi50ZXh0ID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHZhciBkID0gdGhpcy5hcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50RGF0ZSgpO1xyXG4gICAgICAgIGlmICghZClcclxuICAgICAgICAgICAgLy8gRmFsbGJhY2sgdG8gdGhlIGRlZmF1bHQgdGl0bGVcclxuICAgICAgICAgICAgcmV0dXJuIGRlZkJhY2tUZXh0O1xyXG5cclxuICAgICAgICB2YXIgbSA9IG1vbWVudChkKTtcclxuICAgICAgICB2YXIgdCA9IG0uZm9ybWF0KCdkZGRkIFsoXU0vRFspXScpO1xyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICAvLyBBbmQgdGhlIGxpbmsgaXMgZHluYW1pYyB0b28sIHRvIGFsbG93IHJldHVybiB0byB0aGUgZGF0ZVxyXG4gICAgLy8gdGhhdCBtYXRjaGVzIGN1cnJlbnQgYXBwb2ludG1lbnRcclxuICAgIHZhciBkZWZMaW5rID0gYmFja0FjdGlvbi5saW5rLl9pbml0aWFsVmFsdWU7XHJcbiAgICBiYWNrQWN0aW9uLmxpbmsgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIGQgPSB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3LmN1cnJlbnREYXRlKCk7XHJcbiAgICAgICAgaWYgKCFkKVxyXG4gICAgICAgICAgICAvLyBGYWxsYmFjayB0byB0aGUgZGVmYXVsdCBsaW5rXHJcbiAgICAgICAgICAgIHJldHVybiBkZWZMaW5rO1xyXG5cclxuICAgICAgICByZXR1cm4gZGVmTGluayArIGQudG9JU09TdHJpbmcoKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3LmN1cnJlbnRBcHBvaW50bWVudC5zdWJzY3JpYmUoZnVuY3Rpb24gKGFwdCkge1xyXG4gICAgICAgIC8vIFVwZGF0ZSBVUkwgdG8gbWF0Y2ggdGhlIGFwcG9pbnRtZW50IElEIGFuZFxyXG4gICAgICAgIC8vIHRyYWNrIGl0IHN0YXRlXHJcbiAgICAgICAgLy8gR2V0IElEIGZyb20gVVJMLCB0byBhdm9pZCBkbyBhbnl0aGluZyBpZiB0aGUgc2FtZS5cclxuICAgICAgICB2YXIgYXB0SWQgPSBhcHQuaWQoKTtcclxuICAgICAgICB2YXIgdXJsSWQgPSAvYXBwb2ludG1lbnRcXC8oXFxkKykvaS50ZXN0KHdpbmRvdy5sb2NhdGlvbik7XHJcbiAgICAgICAgdXJsSWQgPSB1cmxJZCAmJiB1cmxJZFsxXSB8fCAnJztcclxuICAgICAgICBpZiAodXJsSWQgIT09ICcwJyAmJiBhcHRJZCAhPT0gbnVsbCAmJiB1cmxJZCAhPT0gYXB0SWQudG9TdHJpbmcoKSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVE9ETyBzYXZlIGEgdXNlZnVsIHN0YXRlXHJcbiAgICAgICAgICAgIC8vIE5vdCBmb3Igbm93LCBpcyBmYWlsaW5nLCBidXQgc29tZXRoaW5nIGJhc2VkIG9uOlxyXG4gICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICB2YXIgdmlld3N0YXRlID0ge1xyXG4gICAgICAgICAgICAgICAgYXBwb2ludG1lbnQ6IGFwdC5tb2RlbC50b1BsYWluT2JqZWN0KHRydWUpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBJZiB3YXMgYSByb290IFVSTCwgbm8gSUQsIGp1c3QgcmVwbGFjZSBjdXJyZW50IHN0YXRlXHJcbiAgICAgICAgICAgIGlmICh1cmxJZCA9PT0gJycpXHJcbiAgICAgICAgICAgICAgICBhcHAuc2hlbGwuaGlzdG9yeS5yZXBsYWNlU3RhdGUobnVsbCwgbnVsbCwgJ2FwcG9pbnRtZW50LycgKyBhcHRJZCk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGFwcC5zaGVsbC5oaXN0b3J5LnB1c2hTdGF0ZShudWxsLCBudWxsLCAnYXBwb2ludG1lbnQvJyArIGFwdElkKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVHJpZ2dlciBhIGxheW91dCB1cGRhdGUsIHJlcXVpcmVkIGJ5IHRoZSBmdWxsLWhlaWdodCBmZWF0dXJlXHJcbiAgICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ2xheW91dFVwZGF0ZScpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbkFwcG9pbnRtZW50QWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcclxuICAgIC8qIGpzaGludCBtYXhjb21wbGV4aXR5OjEwICovXHJcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIFxyXG4gICAgdmFyIGFwdDtcclxuICAgIGlmICh0aGlzLnJlcXVlc3RJbmZvLmFwcG9pbnRtZW50KSB7XHJcbiAgICAgICAgYXB0ID0gdGhpcy5yZXF1ZXN0SW5mby5hcHBvaW50bWVudDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAvLyBHZXQgSURcclxuICAgICAgICB2YXIgYXB0SWQgPSBvcHRpb25zICYmIG9wdGlvbnMucm91dGUgJiYgb3B0aW9ucy5yb3V0ZS5zZWdtZW50c1swXTtcclxuICAgICAgICBhcHRJZCA9IHBhcnNlSW50KGFwdElkLCAxMCk7XHJcbiAgICAgICAgYXB0ID0gYXB0SWQgfHwgMDtcclxuICAgIH1cclxuICAgIHRoaXMuc2hvd0FwcG9pbnRtZW50KGFwdCk7XHJcbiAgICBcclxuICAgIC8vIElmIHRoZXJlIGFyZSBvcHRpb25zICh0aGVyZSBhcmUgbm90IG9uIHN0YXJ0dXAgb3JcclxuICAgIC8vIG9uIGNhbmNlbGxlZCBlZGl0aW9uKS5cclxuICAgIC8vIEFuZCBpdCBjb21lcyBiYWNrIGZyb20gdGhlIHRleHRFZGl0b3IuXHJcbiAgICBpZiAob3B0aW9ucyAhPT0gbnVsbCkge1xyXG5cclxuICAgICAgICB2YXIgYm9va2luZyA9IHRoaXMuYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50KCk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLnJlcXVlc3QgPT09ICd0ZXh0RWRpdG9yJyAmJiBib29raW5nKSB7XHJcblxyXG4gICAgICAgICAgICBib29raW5nW29wdGlvbnMuZmllbGRdKG9wdGlvbnMudGV4dCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKG9wdGlvbnMuc2VsZWN0Q2xpZW50ID09PSB0cnVlICYmIGJvb2tpbmcpIHtcclxuXHJcbiAgICAgICAgICAgIGJvb2tpbmcuY2xpZW50KG9wdGlvbnMuc2VsZWN0ZWRDbGllbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0eXBlb2Yob3B0aW9ucy5zZWxlY3RlZERhdGV0aW1lKSAhPT0gJ3VuZGVmaW5lZCcgJiYgYm9va2luZykge1xyXG5cclxuICAgICAgICAgICAgYm9va2luZy5zdGFydFRpbWUob3B0aW9ucy5zZWxlY3RlZERhdGV0aW1lKTtcclxuICAgICAgICAgICAgLy8gVE9ETyBDYWxjdWxhdGUgdGhlIGVuZFRpbWUgZ2l2ZW4gYW4gYXBwb2ludG1lbnQgZHVyYXRpb24sIHJldHJpZXZlZCBmcm9tIHRoZVxyXG4gICAgICAgICAgICAvLyBzZWxlY3RlZCBzZXJ2aWNlXHJcbiAgICAgICAgICAgIC8vdmFyIGR1cmF0aW9uID0gYm9va2luZy5wcmljaW5nICYmIGJvb2tpbmcucHJpY2luZy5kdXJhdGlvbjtcclxuICAgICAgICAgICAgLy8gT3IgYnkgZGVmYXVsdCAoaWYgbm8gcHJpY2luZyBzZWxlY3RlZCBvciBhbnkpIHRoZSB1c2VyIHByZWZlcnJlZFxyXG4gICAgICAgICAgICAvLyB0aW1lIGdhcFxyXG4gICAgICAgICAgICAvL2R1cmF0aW9uID0gZHVyYXRpb24gfHwgdXNlci5wcmVmZXJlbmNlcy50aW1lU2xvdHNHYXA7XHJcbiAgICAgICAgICAgIC8vIFBST1RPVFlQRTpcclxuICAgICAgICAgICAgdmFyIGR1cmF0aW9uID0gNjA7IC8vIG1pbnV0ZXNcclxuICAgICAgICAgICAgYm9va2luZy5lbmRUaW1lKG1vbWVudChib29raW5nLnN0YXJ0VGltZSgpKS5hZGQoZHVyYXRpb24sICdtaW51dGVzJykudG9EYXRlKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChvcHRpb25zLnNlbGVjdFNlcnZpY2VzID09PSB0cnVlICYmIGJvb2tpbmcpIHtcclxuXHJcbiAgICAgICAgICAgIGJvb2tpbmcuc2VydmljZXMob3B0aW9ucy5zZWxlY3RlZFNlcnZpY2VzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5zZWxlY3RMb2NhdGlvbiA9PT0gdHJ1ZSAmJiBib29raW5nKSB7XHJcblxyXG4gICAgICAgICAgICBib29raW5nLmxvY2F0aW9uKG9wdGlvbnMuc2VsZWN0ZWRMb2NhdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIEFwcG9pbnRtZW50ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0FwcG9pbnRtZW50Jyk7XHJcblxyXG5BcHBvaW50bWVudEFjdGl2aXR5LnByb3RvdHlwZS5zaG93QXBwb2ludG1lbnQgPSBmdW5jdGlvbiBzaG93QXBwb2ludG1lbnQoYXB0KSB7XHJcblxyXG4gICAgaWYgKHR5cGVvZihhcHQpID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgIGlmIChhcHQpIHtcclxuICAgICAgICAgICAgLy8gVE9ETzogc2VsZWN0IGFwcG9pbnRtZW50IGFwdCBJRFxyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKGFwdCA9PT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3Lm5ld0FwcG9pbnRtZW50KG5ldyBBcHBvaW50bWVudCgpKTtcclxuICAgICAgICAgICAgdGhpcy5hcHBvaW50bWVudHNEYXRhVmlldy5lZGl0TW9kZSh0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICAvLyBBcHBvaW50bWVudCBvYmplY3RcclxuICAgICAgICBpZiAoYXB0LmlkKSB7XHJcbiAgICAgICAgICAgIC8vIFRPRE86IHNlbGVjdCBhcHBvaW50bWVudCBieSBhcHQgaWRcclxuICAgICAgICAgICAgLy8gVE9ETzogdGhlbiB1cGRhdGUgdmFsdWVzIHdpdGggaW4tZWRpdGluZyB2YWx1ZXMgZnJvbSBhcHRcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIE5ldyBhcG9waW50bWVudCB3aXRoIHRoZSBpbi1lZGl0aW5nIHZhbHVlc1xyXG4gICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3Lm5ld0FwcG9pbnRtZW50KG5ldyBBcHBvaW50bWVudChhcHQpKTtcclxuICAgICAgICAgICAgdGhpcy5hcHBvaW50bWVudHNEYXRhVmlldy5lZGl0TW9kZSh0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5BcHBvaW50bWVudEFjdGl2aXR5LnByb3RvdHlwZS5pbml0QXBwb2ludG1lbnQgPSBmdW5jdGlvbiBpbml0QXBwb2ludG1lbnQoKSB7XHJcbiAgICBpZiAoIXRoaXMuX19pbml0ZWRBcHBvaW50bWVudCkge1xyXG4gICAgICAgIHRoaXMuX19pbml0ZWRBcHBvaW50bWVudCA9IHRydWU7XHJcblxyXG4gICAgICAgIHZhciBhcHAgPSB0aGlzLmFwcDtcclxuICAgICAgICBcclxuICAgICAgICAvLyBEYXRhXHJcbiAgICAgICAgdmFyIHRlc3REYXRhID0gcmVxdWlyZSgnLi4vdGVzdGRhdGEvY2FsZW5kYXJBcHBvaW50bWVudHMnKS5hcHBvaW50bWVudHM7XHJcbiAgICAgICAgdmFyIGFwcG9pbnRtZW50c0RhdGFWaWV3ID0ge1xyXG4gICAgICAgICAgICBhcHBvaW50bWVudHM6IGtvLm9ic2VydmFibGVBcnJheSh0ZXN0RGF0YSksXHJcbiAgICAgICAgICAgIGN1cnJlbnRJbmRleDoga28ub2JzZXJ2YWJsZSgwKSxcclxuICAgICAgICAgICAgZWRpdE1vZGU6IGtvLm9ic2VydmFibGUoZmFsc2UpLFxyXG4gICAgICAgICAgICBuZXdBcHBvaW50bWVudDoga28ub2JzZXJ2YWJsZShudWxsKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5hcHBvaW50bWVudHNEYXRhVmlldyA9IGFwcG9pbnRtZW50c0RhdGFWaWV3O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmlzTmV3ID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV3QXBwb2ludG1lbnQoKSAhPT0gbnVsbDtcclxuICAgICAgICB9LCBhcHBvaW50bWVudHNEYXRhVmlldyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50ID0ga28uY29tcHV0ZWQoe1xyXG4gICAgICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzTmV3KCkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5uZXdBcHBvaW50bWVudCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXBwb2ludG1lbnRzKClbdGhpcy5jdXJyZW50SW5kZXgoKSAlIHRoaXMuYXBwb2ludG1lbnRzKCkubGVuZ3RoXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKGFwdCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5jdXJyZW50SW5kZXgoKSAlIHRoaXMuYXBwb2ludG1lbnRzKCkubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBvaW50bWVudHMoKVtpbmRleF0gPSBhcHQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50cy52YWx1ZUhhc011dGF0ZWQoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgb3duZXI6IGFwcG9pbnRtZW50c0RhdGFWaWV3XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcub3JpZ2luYWxFZGl0ZWRBcHBvaW50bWVudCA9IHt9O1xyXG4gXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuZ29QcmV2aW91cyA9IGZ1bmN0aW9uIGdvUHJldmlvdXMoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmVkaXRNb2RlKCkpIHJldHVybjtcclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudEluZGV4KCkgPT09IDApXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCh0aGlzLmFwcG9pbnRtZW50cygpLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCgodGhpcy5jdXJyZW50SW5kZXgoKSAtIDEpICUgdGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGgpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuZ29OZXh0ID0gZnVuY3Rpb24gZ29OZXh0KCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5lZGl0TW9kZSgpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCgodGhpcy5jdXJyZW50SW5kZXgoKSArIDEpICUgdGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGgpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmVkaXQgPSBmdW5jdGlvbiBlZGl0KCkge1xyXG4gICAgICAgICAgICB0aGlzLmVkaXRNb2RlKHRydWUpO1xyXG4gICAgICAgIH0uYmluZChhcHBvaW50bWVudHNEYXRhVmlldyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKCkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gaWYgaXMgbmV3LCBkaXNjYXJkXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzTmV3KCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV3QXBwb2ludG1lbnQobnVsbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyByZXZlcnQgY2hhbmdlc1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50QXBwb2ludG1lbnQobmV3IEFwcG9pbnRtZW50KHRoaXMub3JpZ2luYWxFZGl0ZWRBcHBvaW50bWVudCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmVkaXRNb2RlKGZhbHNlKTtcclxuICAgICAgICB9LmJpbmQoYXBwb2ludG1lbnRzRGF0YVZpZXcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgICAgICAgICAvLyBJZiBpcyBhIG5ldyBvbmUsIGFkZCBpdCB0byB0aGUgY29sbGVjdGlvblxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc05ldygpKSB7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHZhciBuZXdBcHQgPSB0aGlzLm5ld0FwcG9pbnRtZW50KCk7XHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBzb21lIGZpZWRzIG5lZWQgc29tZSBraW5kIG9mIGNhbGN1bGF0aW9uIHRoYXQgaXMgcGVyc2lzdGVkXHJcbiAgICAgICAgICAgICAgICAvLyBzb24gY2Fubm90IGJlIGNvbXB1dGVkLiBTaW11bGF0ZWQ6XHJcbiAgICAgICAgICAgICAgICBuZXdBcHQuc3VtbWFyeSgnTWFzc2FnZSBUaGVyYXBpc3QgQm9va2luZycpO1xyXG4gICAgICAgICAgICAgICAgbmV3QXB0LmlkKDQpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgdG8gdGhlIGxpc3Q6XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50cy5wdXNoKG5ld0FwdCk7XHJcbiAgICAgICAgICAgICAgICAvLyBub3csIHJlc2V0XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5ld0FwcG9pbnRtZW50KG51bGwpO1xyXG4gICAgICAgICAgICAgICAgLy8gY3VycmVudCBpbmRleCBtdXN0IGJlIHRoZSBqdXN0LWFkZGVkIGFwdFxyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50SW5kZXgodGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gT24gYWRkaW5nIGEgbmV3IG9uZSwgdGhlIGNvbmZpcm1hdGlvbiBwYWdlIG11c3QgYmUgc2hvd2VkXHJcbiAgICAgICAgICAgICAgICBhcHAuc2hlbGwuZ28oJ2Jvb2tpbmdDb25maXJtYXRpb24nLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgYm9va2luZzogbmV3QXB0XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5lZGl0TW9kZShmYWxzZSk7XHJcbiAgICAgICAgfS5iaW5kKGFwcG9pbnRtZW50c0RhdGFWaWV3KTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5lZGl0TW9kZS5zdWJzY3JpYmUoZnVuY3Rpb24oaXNFZGl0KSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLiRhY3Rpdml0eS50b2dnbGVDbGFzcygnaW4tZWRpdCcsIGlzRWRpdCk7XHJcbiAgICAgICAgICAgIHRoaXMuJGFwcG9pbnRtZW50Vmlldy5maW5kKCcuQXBwb2ludG1lbnRDYXJkJykudG9nZ2xlQ2xhc3MoJ2luLWVkaXQnLCBpc0VkaXQpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGlzRWRpdCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGEgY29weSBvZiB0aGUgYXBwb2ludG1lbnQgc28gd2UgcmV2ZXJ0IG9uICdjYW5jZWwnXHJcbiAgICAgICAgICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5vcmlnaW5hbEVkaXRlZEFwcG9pbnRtZW50ID0gXHJcbiAgICAgICAgICAgICAgICAgICAga28udG9KUyhhcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50QXBwb2ludG1lbnQoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50RGF0ZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIGFwdCA9IHRoaXMuY3VycmVudEFwcG9pbnRtZW50KCksXHJcbiAgICAgICAgICAgICAgICBqdXN0RGF0ZSA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICBpZiAoYXB0ICYmIGFwdC5zdGFydFRpbWUoKSlcclxuICAgICAgICAgICAgICAgIGp1c3REYXRlID0gbW9tZW50KGFwdC5zdGFydFRpbWUoKSkuaG91cnMoMCkubWludXRlcygwKS5zZWNvbmRzKDApLnRvRGF0ZSgpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIGp1c3REYXRlO1xyXG4gICAgICAgIH0sIGFwcG9pbnRtZW50c0RhdGFWaWV3KTtcclxuICAgICAgICBcclxuICAgICAgICAvKipcclxuICAgICAgICAgICAgRXh0ZXJuYWwgYWN0aW9uc1xyXG4gICAgICAgICoqL1xyXG4gICAgICAgIHZhciBlZGl0RmllbGRPbiA9IGZ1bmN0aW9uIGVkaXRGaWVsZE9uKGFjdGl2aXR5LCBkYXRhKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBJbmNsdWRlIGFwcG9pbnRtZW50IHRvIHJlY292ZXIgc3RhdGUgb24gcmV0dXJuOlxyXG4gICAgICAgICAgICBkYXRhLmFwcG9pbnRtZW50ID0gYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50KCkubW9kZWwudG9QbGFpbk9iamVjdCh0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIGFwcC5zaGVsbC5nbyhhY3Rpdml0eSwgZGF0YSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5waWNrRGF0ZVRpbWUgPSBmdW5jdGlvbiBwaWNrRGF0ZVRpbWUoKSB7XHJcblxyXG4gICAgICAgICAgICBlZGl0RmllbGRPbignZGF0ZXRpbWVQaWNrZXInLCB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RlZERhdGV0aW1lOiBudWxsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcucGlja0NsaWVudCA9IGZ1bmN0aW9uIHBpY2tDbGllbnQoKSB7XHJcblxyXG4gICAgICAgICAgICBlZGl0RmllbGRPbignY2xpZW50cycsIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdENsaWVudDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHNlbGVjdGVkQ2xpZW50OiBudWxsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LnBpY2tTZXJ2aWNlID0gZnVuY3Rpb24gcGlja1NlcnZpY2UoKSB7XHJcblxyXG4gICAgICAgICAgICBlZGl0RmllbGRPbignc2VydmljZXMnLCB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RTZXJ2aWNlczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHNlbGVjdGVkU2VydmljZXM6IGFwcG9pbnRtZW50c0RhdGFWaWV3LmN1cnJlbnRBcHBvaW50bWVudCgpLnNlcnZpY2VzKClcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuY2hhbmdlUHJpY2UgPSBmdW5jdGlvbiBjaGFuZ2VQcmljZSgpIHtcclxuICAgICAgICAgICAgLy8gVE9ET1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcucGlja0xvY2F0aW9uID0gZnVuY3Rpb24gcGlja0xvY2F0aW9uKCkge1xyXG5cclxuICAgICAgICAgICAgZWRpdEZpZWxkT24oJ2xvY2F0aW9ucycsIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdExvY2F0aW9uOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRMb2NhdGlvbjogYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50KCkubG9jYXRpb24oKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgdGV4dEZpZWxkc0hlYWRlcnMgPSB7XHJcbiAgICAgICAgICAgIHByZU5vdGVzVG9DbGllbnQ6ICdOb3RlcyB0byBjbGllbnQnLFxyXG4gICAgICAgICAgICBwb3N0Tm90ZXNUb0NsaWVudDogJ05vdGVzIHRvIGNsaWVudCAoYWZ0ZXJ3YXJkcyknLFxyXG4gICAgICAgICAgICBwcmVOb3Rlc1RvU2VsZjogJ05vdGVzIHRvIHNlbGYnLFxyXG4gICAgICAgICAgICBwb3N0Tm90ZXNUb1NlbGY6ICdCb29raW5nIHN1bW1hcnknXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5lZGl0VGV4dEZpZWxkID0gZnVuY3Rpb24gZWRpdFRleHRGaWVsZChmaWVsZCkge1xyXG5cclxuICAgICAgICAgICAgZWRpdEZpZWxkT24oJ3RleHRFZGl0b3InLCB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0OiAndGV4dEVkaXRvcicsXHJcbiAgICAgICAgICAgICAgICBmaWVsZDogZmllbGQsXHJcbiAgICAgICAgICAgICAgICB0aXRsZTogYXBwb2ludG1lbnRzRGF0YVZpZXcuaXNOZXcoKSA/ICdOZXcgYm9va2luZycgOiAnQm9va2luZycsXHJcbiAgICAgICAgICAgICAgICBoZWFkZXI6IHRleHRGaWVsZHNIZWFkZXJzW2ZpZWxkXSxcclxuICAgICAgICAgICAgICAgIHRleHQ6IGFwcG9pbnRtZW50c0RhdGFWaWV3LmN1cnJlbnRBcHBvaW50bWVudCgpW2ZpZWxkXSgpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKTtcclxuICAgICAgICBcclxuICAgICAgICBrby5hcHBseUJpbmRpbmdzKGFwcG9pbnRtZW50c0RhdGFWaWV3LCB0aGlzLiRhY3Rpdml0eS5nZXQoMCkpO1xyXG4gICAgfVxyXG59O1xyXG4iLCIvKipcclxuICAgIEJvb2tNZUJ1dHRvbiBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEJvb2tNZUJ1dHRvbkFjdGl2aXR5KCkge1xyXG4gICAgXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkZyZWVsYW5jZXI7XHJcblxyXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdTY2hlZHVsaW5nJyk7XHJcbiAgICBcclxuICAgIC8vIEF1dG8gc2VsZWN0IHRleHQgb24gdGV4dGFyZWEsIGZvciBiZXR0ZXIgJ2NvcHknXHJcbiAgICAvLyBOT1RFOiB0aGUgJ3NlbGVjdCcgbXVzdCBoYXBwZW4gb24gY2xpY2ssIG5vdCB0YXAsIG5vdCBmb2N1cyxcclxuICAgIC8vIG9ubHkgJ2NsaWNrJyBpcyByZWxpYWJsZSBhbmQgYnVnLWZyZWUuXHJcbiAgICB0aGlzLiRhY3Rpdml0eS5vbignY2xpY2snLCAndGV4dGFyZWEnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAkKHRoaXMpLnNlbGVjdCgpO1xyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xyXG4gICAgXHJcbiAgICAvLyBSZXF1ZXN0IGEgbG9hZCwgZXZlbiBpZiBpcyBhIGJhY2tncm91bmQgbG9hZCBhZnRlciB0aGUgZmlyc3QgdGltZTpcclxuICAgIHRoaXMuYXBwLm1vZGVsLm1hcmtldHBsYWNlUHJvZmlsZS5sb2FkKCk7XHJcbiAgICBcclxuICAgIC8vIFNldCB0aGUgam9iIHRpdGxlXHJcbiAgICB2YXIgam9iSUQgPSBzdGF0ZS5yb3V0ZS5zZWdtZW50c1swXSB8MDtcclxuICAgIHRoaXMudmlld01vZGVsLmpvYlRpdGxlSUQoam9iSUQpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKGFwcCkge1xyXG5cclxuICAgIHZhciBtYXJrZXRwbGFjZVByb2ZpbGUgPSBhcHAubW9kZWwubWFya2V0cGxhY2VQcm9maWxlO1xyXG4gICAgXHJcbiAgICAvLyBBY3R1YWwgZGF0YSBmb3IgdGhlIGZvcm06XHJcbiAgICBcclxuICAgIC8vIFJlYWQtb25seSBib29rQ29kZVxyXG4gICAgdGhpcy5ib29rQ29kZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBtYXJrZXRwbGFjZVByb2ZpbGUuZGF0YS5ib29rQ29kZSgpO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMuam9iVGl0bGVJRCA9IGtvLm9ic2VydmFibGUoMCk7XHJcbiAgICBcclxuICAgIC8vIEJ1dHRvbiB0eXBlLCBjYW4gYmU6ICdzbWFsbCcsICdtZWRpdW0nLCAnbGFyZ2UnLCAnbGluaydcclxuICAgIHRoaXMudHlwZSA9IGtvLm9ic2VydmFibGUoJ21lZGl1bScpO1xyXG5cclxuICAgIHRoaXMuaXNMb2NrZWQgPSBtYXJrZXRwbGFjZVByb2ZpbGUuaXNMb2NrZWQ7XHJcbiAgICBcclxuICAgIC8vIEdlbmVyYXRpb24gb2YgdGhlIGJ1dHRvbiBjb2RlXHJcbiAgICBcclxuICAgIHZhciBidXR0b25UZW1wbGF0ZSA9XHJcbiAgICAgICAgJzwhLS0gYmVnaW4gTG9jb25vbWljcyBib29rLW1lLWJ1dHRvbiAtLT4nICtcclxuICAgICAgICAnPGEgc3R5bGU9XCJkaXNwbGF5OmlubGluZS1ibG9ja1wiPjxpbWcgYWx0PVwiXCIgc3R5bGU9XCJib3JkZXI6bm9uZVwiIC8+PC9hPicgKyBcclxuICAgICAgICAnPCEtLSBlbmQgTG9jb25vbWljcyBib29rLW1lLWJ1dHRvbiAtLT4nO1xyXG4gICAgXHJcbiAgICB2YXIgbGlua1RlbXBsYXRlID1cclxuICAgICAgICAnPCEtLSBiZWdpbiBMb2Nvbm9taWNzIGJvb2stbWUtYnV0dG9uIC0tPicgK1xyXG4gICAgICAgICc8YT48c3Bhbj48L3NwYW4+PC9hPicgK1xyXG4gICAgICAgICc8IS0tIGVuZCBMb2Nvbm9taWNzIGJvb2stbWUtYnV0dG9uIC0tPic7XHJcblxyXG4gICAgdGhpcy5idXR0b25IdG1sQ29kZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICBpZiAobWFya2V0cGxhY2VQcm9maWxlLmlzTG9hZGluZygpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnbG9hZGluZy4uLic7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgdHlwZSA9IHRoaXMudHlwZSgpLFxyXG4gICAgICAgICAgICAgICAgdHBsID0gYnV0dG9uVGVtcGxhdGU7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gJ2xpbmsnKVxyXG4gICAgICAgICAgICAgICAgdHBsID0gbGlua1RlbXBsYXRlO1xyXG5cclxuICAgICAgICAgICAgdmFyIHNpdGVVcmwgPSAkKCdodG1sJykuYXR0cignZGF0YS1zaXRlLXVybCcpLFxyXG4gICAgICAgICAgICAgICAgbGlua1VybCA9IHNpdGVVcmwgKyAnL2Jvb2svJyArIHRoaXMuYm9va0NvZGUoKSArICcvJyArIHRoaXMuam9iVGl0bGVJRCgpICsgJy8nLFxyXG4gICAgICAgICAgICAgICAgaW1nVXJsID0gc2l0ZVVybCArICcvaW1nL2V4dGVybi9ib29rLW1lLWJ1dHRvbi0nICsgdHlwZSArICcucG5nJztcclxuXHJcbiAgICAgICAgICAgIHZhciBjb2RlID0gZ2VuZXJhdGVCdXR0b25Db2RlKHtcclxuICAgICAgICAgICAgICAgIHRwbDogdHBsLFxyXG4gICAgICAgICAgICAgICAgbGFiZWw6ICdDbGljayBoZXJlIHRvIGJvb2sgbWUgbm93IChvbiBsb2Nvbm9taWNzLmNvbSknLFxyXG4gICAgICAgICAgICAgICAgbGlua1VybDogbGlua1VybCxcclxuICAgICAgICAgICAgICAgIGltZ1VybDogaW1nVXJsXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGNvZGU7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIC8vIFRPRE8gQ29weSBmZWF0dXJlOyB3aWxsIG5lZWQgYSBuYXRpdmUgcGx1Z2luXHJcbiAgICB0aGlzLmNvcHlDb2RlID0gZnVuY3Rpb24oKSB7IH07XHJcbiAgICBcclxuICAgIHRoaXMuc2VuZEJ5RW1haWwgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBUT0RPIFNlbmQgYnkgZW1haWwsIHdpdGggd2luZG93Lm9wZW4oJ21haWx0bzomYm9keT1jb2RlJyk7XHJcbiAgICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZW5lcmF0ZUJ1dHRvbkNvZGUob3B0aW9ucykge1xyXG5cclxuICAgIHZhciAkYnRuID0gJCgkLnBhcnNlSFRNTCgnPGRpdj4nICsgb3B0aW9ucy50cGwgKyAnPC9kaXY+JykpO1xyXG5cclxuICAgICRidG5cclxuICAgIC5maW5kKCdhJylcclxuICAgIC5hdHRyKCdocmVmJywgb3B0aW9ucy5saW5rVXJsKVxyXG4gICAgLmZpbmQoJ3NwYW4nKVxyXG4gICAgLnRleHQob3B0aW9ucy5sYWJlbCk7XHJcbiAgICAkYnRuXHJcbiAgICAuZmluZCgnaW1nJylcclxuICAgIC5hdHRyKCdzcmMnLCBvcHRpb25zLmltZ1VybClcclxuICAgIC5hdHRyKCdhbHQnLCBvcHRpb25zLmxhYmVsKTtcclxuXHJcbiAgICByZXR1cm4gJGJ0bi5odG1sKCk7XHJcbn1cclxuIiwiLyoqXHJcbiAgICBib29raW5nQ29uZmlybWF0aW9uIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG4gICAgXHJcbnZhciBzaW5nbGV0b24gPSBudWxsO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdENsaWVudHMoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxyXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBCb29raW5nQ29uZmlybWF0aW9uQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xyXG4gICAgXHJcbiAgICByZXR1cm4gc2luZ2xldG9uO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gQm9va2luZ0NvbmZpcm1hdGlvbkFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xyXG4gICAgXHJcbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcclxuICAgIHRoaXMuYXBwID0gYXBwO1xyXG5cclxuICAgIHRoaXMuZGF0YVZpZXcgPSBuZXcgVmlld01vZGVsKCk7XHJcbiAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMuZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xyXG59XHJcblxyXG5Cb29raW5nQ29uZmlybWF0aW9uQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcclxuXHJcbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmJvb2tpbmcpXHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5ib29raW5nKG9wdGlvbnMuYm9va2luZyk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XHJcblxyXG4gICAgLy8gOkFwcG9pbnRtZW50XHJcbiAgICB0aGlzLmJvb2tpbmcgPSBrby5vYnNlcnZhYmxlKG51bGwpO1xyXG59XHJcbiIsIi8qKiBDYWxlbmRhciBhY3Rpdml0eSAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5yZXF1aXJlKCcuLi9jb21wb25lbnRzL0RhdGVQaWNrZXInKTtcclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxudmFyIENhbGVuZGFyU2xvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9DYWxlbmRhclNsb3QnKSxcclxuICAgIE5hdkJhciA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QmFyJyksXHJcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xyXG5cclxudmFyIHNpbmdsZXRvbiA9IG51bGw7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0Q2FsZW5kYXIoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxyXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBDYWxlbmRhckFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIENhbGVuZGFyQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XHJcbiAgICB0aGlzLm5hdkJhciA9IG5ldyBOYXZCYXIoe1xyXG4gICAgICAgIHRpdGxlOiAnQ2FsZW5kYXInLFxyXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5tZW51TmV3SXRlbSxcclxuICAgICAgICByaWdodEFjdGlvbjogTmF2QWN0aW9uLm1lbnVJblxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8qIEdldHRpbmcgZWxlbWVudHMgKi9cclxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xyXG4gICAgdGhpcy4kZGF0ZXBpY2tlciA9ICRhY3Rpdml0eS5maW5kKCcjY2FsZW5kYXJEYXRlUGlja2VyJyk7XHJcbiAgICB0aGlzLiRkYWlseVZpZXcgPSAkYWN0aXZpdHkuZmluZCgnI2NhbGVuZGFyRGFpbHlWaWV3Jyk7XHJcbiAgICB0aGlzLiRkYXRlSGVhZGVyID0gJGFjdGl2aXR5LmZpbmQoJyNjYWxlbmRhckRhdGVIZWFkZXInKTtcclxuICAgIHRoaXMuJGRhdGVUaXRsZSA9IHRoaXMuJGRhdGVIZWFkZXIuY2hpbGRyZW4oJy5DYWxlbmRhckRhdGVIZWFkZXItZGF0ZScpO1xyXG4gICAgdGhpcy4kY2hvb3NlTmV3ID0gJCgnI2NhbGVuZGFyQ2hvb3NlTmV3Jyk7XHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuICAgIFxyXG4gICAgLyogSW5pdCBjb21wb25lbnRzICovXHJcbiAgICB0aGlzLiRkYXRlcGlja2VyLnNob3coKS5kYXRlcGlja2VyKCk7XHJcblxyXG4gICAgLy8gRGF0YVxyXG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcclxuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XHJcblxyXG4gICAgLy8gVGVzdGluZyBkYXRhXHJcbiAgICB0aGlzLmRhdGFWaWV3LnNsb3RzRGF0YShyZXF1aXJlKCcuLi90ZXN0ZGF0YS9jYWxlbmRhclNsb3RzJykuY2FsZW5kYXIpO1xyXG4gICAgXHJcbiAgICAvLyBPYmplY3QgdG8gaG9sZCB0aGUgb3B0aW9ucyBwYXNzZWQgb24gJ3Nob3cnIGFzIGEgcmVzdWx0XHJcbiAgICAvLyBvZiBhIHJlcXVlc3QgZnJvbSBhbm90aGVyIGFjdGl2aXR5XHJcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gbnVsbDtcclxuXHJcbiAgICAvKiBFdmVudCBoYW5kbGVycyAqL1xyXG4gICAgLy8gQ2hhbmdlcyBvbiBjdXJyZW50RGF0ZVxyXG4gICAgdGhpcy5kYXRhVmlldy5jdXJyZW50RGF0ZS5zdWJzY3JpYmUoZnVuY3Rpb24oZGF0ZSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFRyaWdnZXIgYSBsYXlvdXQgdXBkYXRlLCByZXF1aXJlZCBieSB0aGUgZnVsbC1oZWlnaHQgZmVhdHVyZVxyXG4gICAgICAgICQod2luZG93KS50cmlnZ2VyKCdsYXlvdXRVcGRhdGUnKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoZGF0ZSkge1xyXG4gICAgICAgICAgICB2YXIgbWRhdGUgPSBtb21lbnQoZGF0ZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAobWRhdGUuaXNWYWxpZCgpKSB7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHZhciBpc29EYXRlID0gbWRhdGUudG9JU09TdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gVXBkYXRlIGRhdGVwaWNrZXIgc2VsZWN0ZWQgZGF0ZSBvbiBkYXRlIGNoYW5nZSAoZnJvbSBcclxuICAgICAgICAgICAgICAgIC8vIGEgZGlmZmVyZW50IHNvdXJjZSB0aGFuIHRoZSBkYXRlcGlja2VyIGl0c2VsZlxyXG4gICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5yZW1vdmVDbGFzcygnaXMtdmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgLy8gQ2hhbmdlIG5vdCBmcm9tIHRoZSB3aWRnZXQ/XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdnZXRWYWx1ZScpLnRvSVNPU3RyaW5nKCkgIT09IGlzb0RhdGUpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdzZXRWYWx1ZScsIGRhdGUsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIE9uIGN1cnJlbnREYXRlIGNoYW5nZXMsIHVwZGF0ZSB0aGUgVVJMXHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBzYXZlIGEgdXNlZnVsIHN0YXRlXHJcbiAgICAgICAgICAgICAgICAvLyBET1VCVDogcHVzaCBvciByZXBsYWNlIHN0YXRlPyAobW9yZSBoaXN0b3J5IGVudHJpZXMgb3IgdGhlIHNhbWU/KVxyXG4gICAgICAgICAgICAgICAgYXBwLnNoZWxsLmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsICdjYWxlbmRhci8nICsgaXNvRGF0ZSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIERPTkVcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBTb21ldGhpbmcgZmFpbCwgYmFkIGRhdGUgb3Igbm90IGRhdGUgYXQgYWxsXHJcbiAgICAgICAgLy8gU2V0IHRoZSBjdXJyZW50IG9uZVxyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuY3VycmVudERhdGUobmV3IERhdGUoKSk7XHJcblxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAvLyBTd2lwZSBkYXRlIG9uIGdlc3R1cmVcclxuICAgIHRoaXMuJGRhaWx5Vmlld1xyXG4gICAgLm9uKCdzd2lwZWxlZnQgc3dpcGVyaWdodCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRpciA9IGUudHlwZSA9PT0gJ3N3aXBlbGVmdCcgPyAnbmV4dCcgOiAncHJldic7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSGFjayB0byBzb2x2ZSB0aGUgZnJlZXp5LXN3aXBlIGFuZCB0YXAtYWZ0ZXIgYnVnIG9uIEpRTTpcclxuICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCd0b3VjaGVuZCcpO1xyXG4gICAgICAgIC8vIENoYW5nZSBkYXRlXHJcbiAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCBkaXIsICdkYXRlJyk7XHJcblxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIFxyXG4gICAgLy8gQ2hhbmdpbmcgZGF0ZSB3aXRoIGJ1dHRvbnM6XHJcbiAgICB0aGlzLiRkYXRlSGVhZGVyLm9uKCd0YXAnLCAnLkNhbGVuZGFyRGF0ZUhlYWRlci1zd2l0Y2gnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgc3dpdGNoIChlLmN1cnJlbnRUYXJnZXQuZ2V0QXR0cmlidXRlKCdocmVmJykpIHtcclxuICAgICAgICAgICAgY2FzZSAnI3ByZXYnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCAncHJldicsICdkYXRlJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnI25leHQnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCAnbmV4dCcsICdkYXRlJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIC8vIExldHMgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIC8vIFNob3dpbmcgZGF0ZXBpY2tlciB3aGVuIHByZXNzaW5nIHRoZSB0aXRsZVxyXG4gICAgdGhpcy4kZGF0ZVRpdGxlLm9uKCd0YXAnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci50b2dnbGVDbGFzcygnaXMtdmlzaWJsZScpO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAvLyBVcGRhdGluZyB2aWV3IGRhdGUgd2hlbiBwaWNrZWQgYW5vdGhlciBvbmVcclxuICAgIHRoaXMuJGRhdGVwaWNrZXIub24oJ2NoYW5nZURhdGUnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgaWYgKGUudmlld01vZGUgPT09ICdkYXlzJykge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmN1cnJlbnREYXRlKGUuZGF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAvLyBTZXQgZGF0ZSB0byBtYXRjaCBkYXRlcGlja2VyIGZvciBmaXJzdCB1cGRhdGVcclxuICAgIHRoaXMuZGF0YVZpZXcuY3VycmVudERhdGUodGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdnZXRWYWx1ZScpKTtcclxufVxyXG5cclxuQ2FsZW5kYXJBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG4gICAgLyoganNoaW50IG1heGNvbXBsZXhpdHk6MTAgKi9cclxuICAgIFxyXG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5yb3V0ZSAmJiBvcHRpb25zLnJvdXRlLnNlZ21lbnRzKSB7XHJcbiAgICAgICAgdmFyIHNkYXRlID0gb3B0aW9ucy5yb3V0ZS5zZWdtZW50c1swXSxcclxuICAgICAgICAgICAgbWRhdGUgPSBtb21lbnQoc2RhdGUpLFxyXG4gICAgICAgICAgICBkYXRlID0gbWRhdGUuaXNWYWxpZCgpID8gbWRhdGUudG9EYXRlKCkgOiBudWxsO1xyXG5cclxuICAgICAgICBpZiAoZGF0ZSlcclxuICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5jdXJyZW50RGF0ZShkYXRlKTtcclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcclxuXHJcbiAgICB0aGlzLnNsb3RzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcclxuICAgIHRoaXMuc2xvdHNEYXRhID0ga28ub2JzZXJ2YWJsZSh7fSk7XHJcbiAgICB0aGlzLmN1cnJlbnREYXRlID0ga28ub2JzZXJ2YWJsZShuZXcgRGF0ZSgpKTtcclxuICAgIFxyXG4gICAgLy8gVXBkYXRlIGN1cnJlbnQgc2xvdHMgb24gZGF0ZSBjaGFuZ2VcclxuICAgIHRoaXMuY3VycmVudERhdGUuc3Vic2NyaWJlKGZ1bmN0aW9uIChkYXRlKSB7XHJcblxyXG4gICAgICAgIHZhciBtZGF0ZSA9IG1vbWVudChkYXRlKSxcclxuICAgICAgICAgICAgc2RhdGUgPSBtZGF0ZS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgc2xvdHMgPSB0aGlzLnNsb3RzRGF0YSgpO1xyXG5cclxuICAgICAgICBpZiAoc2xvdHMuaGFzT3duUHJvcGVydHkoc2RhdGUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2xvdHMoc2xvdHNbc2RhdGVdKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnNsb3RzKHNsb3RzWydkZWZhdWx0J10pO1xyXG4gICAgICAgIH1cclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn1cclxuIiwiLyoqXHJcbiAgICBDYWxlbmRhclN5bmNpbmcgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIENhbGVuZGFyU3luY2luZ0FjdGl2aXR5KCkge1xyXG4gICAgXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkZyZWVsYW5jZXI7XHJcblxyXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdTY2hlZHVsaW5nJyk7XHJcbiAgICBcclxuICAgIC8vIEFkZGluZyBhdXRvLXNlbGVjdCBiZWhhdmlvciB0byB0aGUgZXhwb3J0IFVSTFxyXG4gICAgdGhpcy4kYWN0aXZpdHkuZmluZCgnI2NhbGVuZGFyU3luYy1pY2FsRXhwb3J0VXJsJylcclxuICAgIC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnNlbGVjdCgpO1xyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xyXG4gICAgXHJcbiAgICAvLyBSZXF1ZXN0IGEgbG9hZCwgZXZlbiBpZiBpcyBhIGJhY2tncm91bmQgbG9hZCBhZnRlciB0aGUgZmlyc3QgdGltZTpcclxuICAgIHRoaXMuYXBwLm1vZGVsLmNhbGVuZGFyU3luY2luZy5sb2FkKCk7XHJcbiAgICAvLyBEaXNjYXJkIGFueSBwcmV2aW91cyB1bnNhdmVkIGVkaXRcclxuICAgIHRoaXMudmlld01vZGVsLmRpc2NhcmQoKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbChhcHApIHtcclxuXHJcbiAgICB2YXIgY2FsZW5kYXJTeW5jaW5nID0gYXBwLm1vZGVsLmNhbGVuZGFyU3luY2luZztcclxuXHJcbiAgICB2YXIgc3luY1ZlcnNpb24gPSBjYWxlbmRhclN5bmNpbmcubmV3VmVyc2lvbigpO1xyXG4gICAgc3luY1ZlcnNpb24uaXNPYnNvbGV0ZS5zdWJzY3JpYmUoZnVuY3Rpb24oaXRJcykge1xyXG4gICAgICAgIGlmIChpdElzKSB7XHJcbiAgICAgICAgICAgIC8vIG5ldyB2ZXJzaW9uIGZyb20gc2VydmVyIHdoaWxlIGVkaXRpbmdcclxuICAgICAgICAgICAgLy8gRlVUVVJFOiB3YXJuIGFib3V0IGEgbmV3IHJlbW90ZSB2ZXJzaW9uIGFza2luZ1xyXG4gICAgICAgICAgICAvLyBjb25maXJtYXRpb24gdG8gbG9hZCB0aGVtIG9yIGRpc2NhcmQgYW5kIG92ZXJ3cml0ZSB0aGVtO1xyXG4gICAgICAgICAgICAvLyB0aGUgc2FtZSBpcyBuZWVkIG9uIHNhdmUoKSwgYW5kIG9uIHNlcnZlciByZXNwb25zZVxyXG4gICAgICAgICAgICAvLyB3aXRoIGEgNTA5OkNvbmZsaWN0IHN0YXR1cyAoaXRzIGJvZHkgbXVzdCBjb250YWluIHRoZVxyXG4gICAgICAgICAgICAvLyBzZXJ2ZXIgdmVyc2lvbikuXHJcbiAgICAgICAgICAgIC8vIFJpZ2h0IG5vdywganVzdCBvdmVyd3JpdGUgY3VycmVudCBjaGFuZ2VzIHdpdGhcclxuICAgICAgICAgICAgLy8gcmVtb3RlIG9uZXM6XHJcbiAgICAgICAgICAgIHN5bmNWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gQWN0dWFsIGRhdGEgZm9yIHRoZSBmb3JtOlxyXG4gICAgdGhpcy5zeW5jID0gc3luY1ZlcnNpb24udmVyc2lvbjtcclxuXHJcbiAgICB0aGlzLmlzTG9ja2VkID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmlzTG9ja2VkKCkgfHwgdGhpcy5pc1Jlc2V0aW5nKCk7XHJcbiAgICB9LCBjYWxlbmRhclN5bmNpbmcpO1xyXG5cclxuICAgIHRoaXMuc3VibWl0VGV4dCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZygpID8gXHJcbiAgICAgICAgICAgICAgICAnbG9hZGluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNTYXZpbmcoKSA/IFxyXG4gICAgICAgICAgICAgICAgICAgICdzYXZpbmcuLi4nIDogXHJcbiAgICAgICAgICAgICAgICAgICAgJ1NhdmUnXHJcbiAgICAgICAgKTtcclxuICAgIH0sIGNhbGVuZGFyU3luY2luZyk7XHJcbiAgICBcclxuICAgIHRoaXMucmVzZXRUZXh0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMuaXNSZXNldGluZygpID8gXHJcbiAgICAgICAgICAgICAgICAncmVzZXRpbmcuLi4nIDogXHJcbiAgICAgICAgICAgICAgICAnUmVzZXQgUHJpdmF0ZSBVUkwnXHJcbiAgICAgICAgKTtcclxuICAgIH0sIGNhbGVuZGFyU3luY2luZyk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzY2FyZCA9IGZ1bmN0aW9uIGRpc2NhcmQoKSB7XHJcbiAgICAgICAgc3luY1ZlcnNpb24ucHVsbCh7IGV2ZW5JZk5ld2VyOiB0cnVlIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgICAgIC8vIEZvcmNlIHRvIHNhdmUsIGV2ZW4gaWYgdGhlcmUgd2FzIHJlbW90ZSB1cGRhdGVzXHJcbiAgICAgICAgc3luY1ZlcnNpb24ucHVzaCh7IGV2ZW5JZk9ic29sZXRlOiB0cnVlIH0pO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgdGhpcy5yZXNldCA9IGZ1bmN0aW9uIHJlc2V0KCkge1xyXG4gICAgICAgIGNhbGVuZGFyU3luY2luZy5yZXNldEV4cG9ydFVybCgpO1xyXG4gICAgfTtcclxufVxyXG4iLCIvKipcbiAgICBDbGllbnRFZGl0aW9uIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQ2xpZW50RWRpdGlvbkFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdjbGllbnRzJyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xudmFyIENsaWVudCA9IHJlcXVpcmUoJy4uL21vZGVscy9DbGllbnQnKTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuICAgIFxuICAgIHRoaXMuY2xpZW50ID0ga28ub2JzZXJ2YWJsZShuZXcgQ2xpZW50KCkpO1xuICAgIFxuICAgIHRoaXMuaGVhZGVyID0ga28ub2JzZXJ2YWJsZSgnRWRpdCBMb2NhdGlvbicpO1xuICAgIFxuICAgIC8vIFRPRE9cbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbigpIHt9O1xuICAgIHRoaXMuY2FuY2VsID0gZnVuY3Rpb24oKSB7fTtcbn1cbiIsIi8qKlxyXG4gICAgY2xpZW50cyBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE5hdkJhciA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QmFyJyksXHJcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xyXG4gICAgXHJcbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcclxuXHJcbnZhciBzaW5nbGV0b24gPSBudWxsO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdENsaWVudHMoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxyXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBDbGllbnRzQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xyXG4gICAgXHJcbiAgICByZXR1cm4gc2luZ2xldG9uO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gQ2xpZW50c0FjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xyXG4gICAgXHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ0NsaWVudHMnKTtcclxuICAgIFxyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuICAgIHRoaXMuJGluZGV4ID0gJGFjdGl2aXR5LmZpbmQoJyNjbGllbnRzSW5kZXgnKTtcclxuICAgIHRoaXMuJGxpc3RWaWV3ID0gJGFjdGl2aXR5LmZpbmQoJyNjbGllbnRzTGlzdFZpZXcnKTtcclxuXHJcbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xyXG4gICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLmRhdGFWaWV3LCAkYWN0aXZpdHkuZ2V0KDApKTtcclxuXHJcbiAgICAvLyBUZXN0aW5nRGF0YVxyXG4gICAgdGhpcy5kYXRhVmlldy5jbGllbnRzKHJlcXVpcmUoJy4uL3Rlc3RkYXRhL2NsaWVudHMnKS5jbGllbnRzKTtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciB0byB1cGRhdGUgaGVhZGVyIGJhc2VkIG9uIGEgbW9kZSBjaGFuZ2U6XHJcbiAgICB0aGlzLmRhdGFWaWV3LmlzU2VsZWN0aW9uTW9kZS5zdWJzY3JpYmUoZnVuY3Rpb24gKGl0SXMpIHtcclxuICAgICAgICB0aGlzLmRhdGFWaWV3LmhlYWRlclRleHQoaXRJcyA/ICdTZWxlY3QgYSBjbGllbnQnIDogJycpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAvLyBPYmplY3QgdG8gaG9sZCB0aGUgb3B0aW9ucyBwYXNzZWQgb24gJ3Nob3cnIGFzIGEgcmVzdWx0XHJcbiAgICAvLyBvZiBhIHJlcXVlc3QgZnJvbSBhbm90aGVyIGFjdGl2aXR5XHJcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gbnVsbDtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciB0byBnbyBiYWNrIHdpdGggdGhlIHNlbGVjdGVkIGNsaWVudCB3aGVuIFxyXG4gICAgLy8gdGhlcmUgaXMgb25lIHNlbGVjdGVkIGFuZCByZXF1ZXN0SW5mbyBpcyBmb3JcclxuICAgIC8vICdzZWxlY3QgbW9kZSdcclxuICAgIHRoaXMuZGF0YVZpZXcuc2VsZWN0ZWRDbGllbnQuc3Vic2NyaWJlKGZ1bmN0aW9uICh0aGVTZWxlY3RlZENsaWVudCkge1xyXG4gICAgICAgIC8vIFdlIGhhdmUgYSByZXF1ZXN0IGFuZFxyXG4gICAgICAgIC8vIGl0IHJlcXVlc3RlZCB0byBzZWxlY3QgYSBjbGllbnQsXHJcbiAgICAgICAgLy8gYW5kIGEgc2VsZWN0ZWQgY2xpZW50XHJcbiAgICAgICAgaWYgKHRoaXMucmVxdWVzdEluZm8gJiZcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mby5zZWxlY3RDbGllbnQgPT09IHRydWUgJiZcclxuICAgICAgICAgICAgdGhlU2VsZWN0ZWRDbGllbnQpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFBhc3MgdGhlIHNlbGVjdGVkIGNsaWVudCBpbiB0aGUgaW5mb1xyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvLnNlbGVjdGVkQ2xpZW50ID0gdGhlU2VsZWN0ZWRDbGllbnQ7XHJcbiAgICAgICAgICAgIC8vIEFuZCBnbyBiYWNrXHJcbiAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvQmFjayh0aGlzLnJlcXVlc3RJbmZvKTtcclxuICAgICAgICAgICAgLy8gTGFzdCwgY2xlYXIgcmVxdWVzdEluZm9cclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufVxyXG5cclxuQ2xpZW50c0FjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcblxyXG4gICAgLy8gT24gZXZlcnkgc2hvdywgc2VhcmNoIGdldHMgcmVzZXRlZFxyXG4gICAgdGhpcy5kYXRhVmlldy5zZWFyY2hUZXh0KCcnKTtcclxuICBcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG9wdGlvbnM7XHJcblxyXG4gICAgdGhpcy5kYXRhVmlldy5pc1NlbGVjdGlvbk1vZGUob3B0aW9ucy5zZWxlY3RDbGllbnQgPT09IHRydWUpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJycpO1xyXG5cclxuICAgIC8vIEVzcGVjaWFsIG1vZGUgd2hlbiBpbnN0ZWFkIG9mIHBpY2sgYW5kIGVkaXQgd2UgYXJlIGp1c3Qgc2VsZWN0aW5nXHJcbiAgICAvLyAod2hlbiBlZGl0aW5nIGFuIGFwcG9pbnRtZW50KVxyXG4gICAgdGhpcy5pc1NlbGVjdGlvbk1vZGUgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuXHJcbiAgICAvLyBGdWxsIGxpc3Qgb2YgY2xpZW50c1xyXG4gICAgdGhpcy5jbGllbnRzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcclxuICAgIFxyXG4gICAgLy8gU2VhcmNoIHRleHQsIHVzZWQgdG8gZmlsdGVyICdjbGllbnRzJ1xyXG4gICAgdGhpcy5zZWFyY2hUZXh0ID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcbiAgICBcclxuICAgIC8vIFV0aWxpdHkgdG8gZ2V0IGEgZmlsdGVyZWQgbGlzdCBvZiBjbGllbnRzIGJhc2VkIG9uIGNsaWVudHNcclxuICAgIHRoaXMuZ2V0RmlsdGVyZWRMaXN0ID0gZnVuY3Rpb24gZ2V0RmlsdGVyZWRMaXN0KCkge1xyXG4gICAgICAgIHZhciBzID0gKHRoaXMuc2VhcmNoVGV4dCgpIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnRzKCkuZmlsdGVyKGZ1bmN0aW9uKGNsaWVudCkge1xyXG4gICAgICAgICAgICB2YXIgbiA9IGNsaWVudCAmJiBjbGllbnQuZnVsbE5hbWUoKSB8fCAnJztcclxuICAgICAgICAgICAgbiA9IG4udG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgcmV0dXJuIG4uaW5kZXhPZihzKSA+IC0xO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBGaWx0ZXJlZCBsaXN0IG9mIGNsaWVudHNcclxuICAgIHRoaXMuZmlsdGVyZWRDbGllbnRzID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RmlsdGVyZWRMaXN0KCk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgLy8gR3JvdXBlZCBsaXN0IG9mIGZpbHRlcmVkIGNsaWVudHNcclxuICAgIHRoaXMuZ3JvdXBlZENsaWVudHMgPSBrby5jb21wdXRlZChmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICB2YXIgY2xpZW50cyA9IHRoaXMuZmlsdGVyZWRDbGllbnRzKCkuc29ydChmdW5jdGlvbihjbGllbnRBLCBjbGllbnRCKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjbGllbnRBLmZpcnN0TmFtZSgpID4gY2xpZW50Qi5maXJzdE5hbWUoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgZ3JvdXBzID0gW10sXHJcbiAgICAgICAgICAgIGxhdGVzdEdyb3VwID0gbnVsbCxcclxuICAgICAgICAgICAgbGF0ZXN0TGV0dGVyID0gbnVsbDtcclxuXHJcbiAgICAgICAgY2xpZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGNsaWVudCkge1xyXG4gICAgICAgICAgICB2YXIgbGV0dGVyID0gKGNsaWVudC5maXJzdE5hbWUoKVswXSB8fCAnJykudG9VcHBlckNhc2UoKTtcclxuICAgICAgICAgICAgaWYgKGxldHRlciAhPT0gbGF0ZXN0TGV0dGVyKSB7XHJcbiAgICAgICAgICAgICAgICBsYXRlc3RHcm91cCA9IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXR0ZXI6IGxldHRlcixcclxuICAgICAgICAgICAgICAgICAgICBjbGllbnRzOiBbY2xpZW50XVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGdyb3Vwcy5wdXNoKGxhdGVzdEdyb3VwKTtcclxuICAgICAgICAgICAgICAgIGxhdGVzdExldHRlciA9IGxldHRlcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxhdGVzdEdyb3VwLmNsaWVudHMucHVzaChjbGllbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBncm91cHM7XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2VsZWN0ZWRDbGllbnQgPSBrby5vYnNlcnZhYmxlKG51bGwpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlbGVjdENsaWVudCA9IGZ1bmN0aW9uKHNlbGVjdGVkQ2xpZW50KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZENsaWVudChzZWxlY3RlZENsaWVudCk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbn1cclxuIiwiLyoqXG4gICAgQ01TIGFjdGl2aXR5XG4gICAgKENsaWVudCBNYW5hZ2VtZW50IFN5c3RlbSlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQ21zQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIoJ0NsaWVudCBtYW5hZ2VtZW50Jyk7XG4gICAgXG4gICAgLy8gS2VlcCBjbGllbnRzQ291bnQgdXBkYXRlZFxuICAgIC8vIFRPRE8gdGhpcy5hcHAubW9kZWwuY2xpZW50c1xuICAgIHZhciBjbGllbnRzID0ga28ub2JzZXJ2YWJsZUFycmF5KHJlcXVpcmUoJy4uL3Rlc3RkYXRhL2NsaWVudHMnKS5jbGllbnRzKTtcbiAgICB0aGlzLnZpZXdNb2RlbC5jbGllbnRzQ291bnQoY2xpZW50cygpLmxlbmd0aCk7XG4gICAgY2xpZW50cy5zdWJzY3JpYmUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMudmlld01vZGVsLmNsaWVudHNDb3VudChjbGllbnRzKCkubGVuZ3RoKTtcbiAgICB9LmJpbmQodGhpcykpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuICAgIFxuICAgIHRoaXMuY2xpZW50c0NvdW50ID0ga28ub2JzZXJ2YWJsZSgpO1xufVxuIiwiLyoqXG4gICAgQ29udGFjdEZvcm0gYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBDb250YWN0Rm9ybUFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdUYWxrIHRvIHVzJyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuICAgIFxuICAgIHRoaXMubWVzc2FnZSA9IGtvLm9ic2VydmFibGUoJycpO1xuICAgIHRoaXMud2FzU2VudCA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xuXG4gICAgdmFyIHVwZGF0ZVdhc1NlbnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy53YXNTZW50KGZhbHNlKTtcbiAgICB9LmJpbmQodGhpcyk7XG4gICAgdGhpcy5tZXNzYWdlLnN1YnNjcmliZSh1cGRhdGVXYXNTZW50KTtcbiAgICBcbiAgICB0aGlzLnNlbmQgPSBmdW5jdGlvbiBzZW5kKCkge1xuICAgICAgICAvLyBUT0RPOiBTZW5kXG4gICAgICAgIFxuICAgICAgICAvLyBSZXNldCBhZnRlciBiZWluZyBzZW50XG4gICAgICAgIHRoaXMubWVzc2FnZSgnJyk7XG4gICAgICAgIHRoaXMud2FzU2VudCh0cnVlKTtcblxuICAgIH0uYmluZCh0aGlzKTtcbn1cbiIsIi8qKlxuICAgIENvbnRhY3RJbmZvIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQ29udGFjdEluZm9BY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ093bmVyIGluZm9ybWF0aW9uJyk7XG4gICAgXG4gICAgLy8gVXBkYXRlIG5hdkJhciBmb3Igb25ib2FyZGluZyBtb2RlIHdoZW4gdGhlIG9uYm9hcmRpbmdTdGVwXG4gICAgLy8gaW4gdGhlIGN1cnJlbnQgbW9kZWwgY2hhbmdlczpcbiAgICB0aGlzLnZpZXdNb2RlbC5wcm9maWxlLm9uYm9hcmRpbmdTdGVwLnN1YnNjcmliZShmdW5jdGlvbiAoc3RlcCkge1xuICAgICAgICBcbiAgICAgICAgaWYgKHN0ZXApIHtcbiAgICAgICAgICAgIC8vIFRPRE8gU2V0IG5hdmJhciBzdGVwIGluZGV4XG4gICAgICAgICAgICAvLyBTZXR0aW5nIG5hdmJhciBmb3IgT25ib2FyZGluZy93aXphcmQgbW9kZVxuICAgICAgICAgICAgdGhpcy5uYXZCYXIubGVmdEFjdGlvbigpLnRleHQoJycpO1xuICAgICAgICAgICAgLy8gU2V0dGluZyBoZWFkZXJcbiAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmhlYWRlclRleHQoJ0hvdyBjYW4gd2UgcmVhY2ggeW91PycpO1xuICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuYnV0dG9uVGV4dCgnU2F2ZSBhbmQgY29udGludWUnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRPRE8gUmVtb3ZlIHN0ZXAgaW5kZXhcbiAgICAgICAgICAgIC8vIFNldHRpbmcgbmF2YmFyIHRvIGRlZmF1bHRcbiAgICAgICAgICAgIHRoaXMubmF2QmFyLmxlZnRBY3Rpb24oKS50ZXh0KCdBY2NvdW50Jyk7XG4gICAgICAgICAgICAvLyBTZXR0aW5nIGhlYWRlciB0byBkZWZhdWx0XG4gICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5oZWFkZXJUZXh0KCdDb250YWN0IGluZm9ybWF0aW9uJyk7XG4gICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5idXR0b25UZXh0KCdTYXZlJyk7XG4gICAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcbiAgICBcbiAgICAvLyBEaXNjYXJkIGFueSBwcmV2aW91cyB1bnNhdmVkIGVkaXRcbiAgICB0aGlzLnZpZXdNb2RlbC5kaXNjYXJkKCk7XG4gICAgXG4gICAgLy8gS2VlcCBkYXRhIHVwZGF0ZWQ6XG4gICAgdGhpcy5hcHAubW9kZWwudXNlclByb2ZpbGUuc3luYygpO1xuICAgIHRoaXMuYXBwLm1vZGVsLmhvbWVBZGRyZXNzLnN5bmMoKTtcbn07XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbChhcHApIHtcblxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJ0NvbnRhY3QgaW5mb3JtYXRpb24nKTtcbiAgICB0aGlzLmJ1dHRvblRleHQgPSBrby5vYnNlcnZhYmxlKCdTYXZlJyk7XG4gICAgXG4gICAgLy8gVXNlciBQcm9maWxlXG4gICAgdmFyIHVzZXJQcm9maWxlID0gYXBwLm1vZGVsLnVzZXJQcm9maWxlO1xuICAgIHZhciBwcm9maWxlVmVyc2lvbiA9IHVzZXJQcm9maWxlLm5ld1ZlcnNpb24oKTtcbiAgICBwcm9maWxlVmVyc2lvbi5pc09ic29sZXRlLnN1YnNjcmliZShmdW5jdGlvbihpdElzKSB7XG4gICAgICAgIGlmIChpdElzKSB7XG4gICAgICAgICAgICAvLyBuZXcgdmVyc2lvbiBmcm9tIHNlcnZlciB3aGlsZSBlZGl0aW5nXG4gICAgICAgICAgICAvLyBGVVRVUkU6IHdhcm4gYWJvdXQgYSBuZXcgcmVtb3RlIHZlcnNpb24gYXNraW5nXG4gICAgICAgICAgICAvLyBjb25maXJtYXRpb24gdG8gbG9hZCB0aGVtIG9yIGRpc2NhcmQgYW5kIG92ZXJ3cml0ZSB0aGVtO1xuICAgICAgICAgICAgLy8gdGhlIHNhbWUgaXMgbmVlZCBvbiBzYXZlKCksIGFuZCBvbiBzZXJ2ZXIgcmVzcG9uc2VcbiAgICAgICAgICAgIC8vIHdpdGggYSA1MDk6Q29uZmxpY3Qgc3RhdHVzIChpdHMgYm9keSBtdXN0IGNvbnRhaW4gdGhlXG4gICAgICAgICAgICAvLyBzZXJ2ZXIgdmVyc2lvbikuXG4gICAgICAgICAgICAvLyBSaWdodCBub3csIGp1c3Qgb3ZlcndyaXRlIGN1cnJlbnQgY2hhbmdlcyB3aXRoXG4gICAgICAgICAgICAvLyByZW1vdGUgb25lczpcbiAgICAgICAgICAgIHByb2ZpbGVWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIFxuICAgIC8vIEFjdHVhbCBkYXRhIGZvciB0aGUgZm9ybTpcbiAgICB0aGlzLnByb2ZpbGUgPSBwcm9maWxlVmVyc2lvbi52ZXJzaW9uO1xuICAgIFxuICAgIC8vIFRPRE8gbDEwblxuICAgIHRoaXMubW9udGhzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtcbiAgICAgICAgeyBpZDogMSwgbmFtZTogJ0phbnVhcnknfSxcbiAgICAgICAgeyBpZDogMiwgbmFtZTogJ0ZlYnJ1YXJ5J30sXG4gICAgICAgIHsgaWQ6IDMsIG5hbWU6ICdNYXJjaCd9LFxuICAgICAgICB7IGlkOiA0LCBuYW1lOiAnQXByaWwnfSxcbiAgICAgICAgeyBpZDogNSwgbmFtZTogJ01heSd9LFxuICAgICAgICB7IGlkOiA2LCBuYW1lOiAnSnVuZSd9LFxuICAgICAgICB7IGlkOiA3LCBuYW1lOiAnSnVseSd9LFxuICAgICAgICB7IGlkOiA4LCBuYW1lOiAnQXVndXN0J30sXG4gICAgICAgIHsgaWQ6IDksIG5hbWU6ICdTZXB0ZW1iZXInfSxcbiAgICAgICAgeyBpZDogMTAsIG5hbWU6ICdPY3RvYmVyJ30sXG4gICAgICAgIHsgaWQ6IDExLCBuYW1lOiAnTm92ZW1iZXInfSxcbiAgICAgICAgeyBpZDogMTIsIG5hbWU6ICdEZWNlbWJlcid9XG4gICAgXSk7XG4gICAgLy8gV2UgbmVlZCB0byB1c2UgYSBzcGVjaWFsIG9ic2VydmFibGUgaW4gdGhlIGZvcm0sIHRoYXQgd2lsbFxuICAgIC8vIHVwZGF0ZSB0aGUgYmFjay1lbmQgcHJvZmlsZS5iaXJ0aE1vbnRoXG4gICAgdGhpcy5zZWxlY3RlZEJpcnRoTW9udGggPSBrby5jb21wdXRlZCh7XG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGJpcnRoTW9udGggPSB0aGlzLnByb2ZpbGUuYmlydGhNb250aCgpO1xuICAgICAgICAgICAgcmV0dXJuIGJpcnRoTW9udGggPyB0aGlzLm1vbnRocygpW2JpcnRoTW9udGggLSAxXSA6IG51bGw7XG4gICAgICAgIH0sXG4gICAgICAgIHdyaXRlOiBmdW5jdGlvbihtb250aCkge1xuICAgICAgICAgICAgdGhpcy5wcm9maWxlLmJpcnRoTW9udGgobW9udGggJiYgbW9udGguaWQgfHwgbnVsbCk7XG4gICAgICAgIH0sXG4gICAgICAgIG93bmVyOiB0aGlzXG4gICAgfSk7XG4gICAgXG4gICAgdGhpcy5tb250aERheXMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xuICAgIGZvciAodmFyIGlkYXkgPSAxOyBpZGF5IDw9IDMxOyBpZGF5KyspIHtcbiAgICAgICAgdGhpcy5tb250aERheXMucHVzaChpZGF5KTtcbiAgICB9XG4gICAgXG4gICAgLy8gSG9tZSBBZGRyZXNzXG4gICAgdmFyIGhvbWVBZGRyZXNzID0gYXBwLm1vZGVsLmhvbWVBZGRyZXNzO1xuICAgIHZhciBob21lQWRkcmVzc1ZlcnNpb24gPSBob21lQWRkcmVzcy5uZXdWZXJzaW9uKCk7XG4gICAgaG9tZUFkZHJlc3NWZXJzaW9uLmlzT2Jzb2xldGUuc3Vic2NyaWJlKGZ1bmN0aW9uKGl0SXMpIHtcbiAgICAgICAgaWYgKGl0SXMpIHtcbiAgICAgICAgICAgIC8vIG5ldyB2ZXJzaW9uIGZyb20gc2VydmVyIHdoaWxlIGVkaXRpbmdcbiAgICAgICAgICAgIC8vIEZVVFVSRTogd2FybiBhYm91dCBhIG5ldyByZW1vdGUgdmVyc2lvbiBhc2tpbmdcbiAgICAgICAgICAgIC8vIGNvbmZpcm1hdGlvbiB0byBsb2FkIHRoZW0gb3IgZGlzY2FyZCBhbmQgb3ZlcndyaXRlIHRoZW07XG4gICAgICAgICAgICAvLyB0aGUgc2FtZSBpcyBuZWVkIG9uIHNhdmUoKSwgYW5kIG9uIHNlcnZlciByZXNwb25zZVxuICAgICAgICAgICAgLy8gd2l0aCBhIDUwOTpDb25mbGljdCBzdGF0dXMgKGl0cyBib2R5IG11c3QgY29udGFpbiB0aGVcbiAgICAgICAgICAgIC8vIHNlcnZlciB2ZXJzaW9uKS5cbiAgICAgICAgICAgIC8vIFJpZ2h0IG5vdywganVzdCBvdmVyd3JpdGUgY3VycmVudCBjaGFuZ2VzIHdpdGhcbiAgICAgICAgICAgIC8vIHJlbW90ZSBvbmVzOlxuICAgICAgICAgICAgaG9tZUFkZHJlc3NWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIFxuICAgIC8vIEFjdHVhbCBkYXRhIGZvciB0aGUgZm9ybTpcbiAgICB0aGlzLmFkZHJlc3MgPSBob21lQWRkcmVzc1ZlcnNpb24udmVyc2lvbjtcblxuICAgIC8vIENvbnRyb2wgb2JzZXJ2YWJsZXM6IHNwZWNpYWwgYmVjYXVzZSBtdXN0IGEgbWl4XG4gICAgLy8gb2YgdGhlIGJvdGggcmVtb3RlIG1vZGVscyB1c2VkIGluIHRoaXMgdmlld21vZGVsXG4gICAgdGhpcy5pc0xvY2tlZCA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdXNlclByb2ZpbGUuaXNMb2NrZWQoKSB8fCBob21lQWRkcmVzcy5pc0xvY2tlZCgpO1xuICAgIH0sIHRoaXMpO1xuICAgIHRoaXMuaXNMb2FkaW5nID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB1c2VyUHJvZmlsZS5pc0xvYWRpbmcoKSB8fCBob21lQWRkcmVzcy5pc0xvYWRpbmcoKTtcbiAgICB9LCB0aGlzKTtcbiAgICB0aGlzLmlzU2F2aW5nID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB1c2VyUHJvZmlsZS5pc1NhdmluZygpIHx8IGhvbWVBZGRyZXNzLmlzU2F2aW5nKCk7XG4gICAgfSwgdGhpcyk7XG5cbiAgICB0aGlzLnN1Ym1pdFRleHQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZygpID8gXG4gICAgICAgICAgICAgICAgJ2xvYWRpbmcuLi4nIDogXG4gICAgICAgICAgICAgICAgdGhpcy5pc1NhdmluZygpID8gXG4gICAgICAgICAgICAgICAgICAgICdzYXZpbmcuLi4nIDogXG4gICAgICAgICAgICAgICAgICAgICdTYXZlJ1xuICAgICAgICApO1xuICAgIH0sIHRoaXMpO1xuICAgIFxuICAgIC8vIEFjdGlvbnNcblxuICAgIHRoaXMuZGlzY2FyZCA9IGZ1bmN0aW9uIGRpc2NhcmQoKSB7XG4gICAgICAgIHByb2ZpbGVWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcbiAgICAgICAgaG9tZUFkZHJlc3NWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcbiAgICB9LmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xuICAgICAgICAvLyBGb3JjZSB0byBzYXZlLCBldmVuIGlmIHRoZXJlIHdhcyByZW1vdGUgdXBkYXRlc1xuICAgICAgICBwcm9maWxlVmVyc2lvbi5wdXNoKHsgZXZlbklmT2Jzb2xldGU6IHRydWUgfSk7XG4gICAgICAgIGhvbWVBZGRyZXNzVmVyc2lvbi5wdXNoKHsgZXZlbklmT2Jzb2xldGU6IHRydWUgfSk7XG4gICAgfS5iaW5kKHRoaXMpO1xufVxuIiwiLyoqXG4gICAgQ29udmVyc2F0aW9uIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQ29udmVyc2F0aW9uQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ0luYm94Jyk7XG4gICAgXG4gICAgLy8gVGVzdGluZ0RhdGFcbiAgICBzZXRTb21lVGVzdGluZ0RhdGEodGhpcy52aWV3TW9kZWwpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcbiAgICBcbiAgICBpZiAoc3RhdGUgJiYgc3RhdGUucm91dGUgJiYgc3RhdGUucm91dGUuc2VnbWVudHMpIHtcbiAgICAgICAgdGhpcy52aWV3TW9kZWwuY29udmVyc2F0aW9uSUQocGFyc2VJbnQoc3RhdGUucm91dGUuc2VnbWVudHNbMF0sIDEwKSB8fCAwKTtcbiAgICB9XG59O1xuXG52YXIgTWFpbEZvbGRlciA9IHJlcXVpcmUoJy4uL21vZGVscy9NYWlsRm9sZGVyJyk7XG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG5cbiAgICB0aGlzLmluYm94ID0gbmV3IE1haWxGb2xkZXIoe1xuICAgICAgICB0b3BOdW1iZXI6IDIwXG4gICAgfSk7XG4gICAgXG4gICAgdGhpcy5jb252ZXJzYXRpb25JRCA9IGtvLm9ic2VydmFibGUobnVsbCk7XG4gICAgXG4gICAgdGhpcy5jb252ZXJzYXRpb24gPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb25JRCA9IHRoaXMuY29udmVyc2F0aW9uSUQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5ib3gubWVzc2FnZXMoKS5maWx0ZXIoZnVuY3Rpb24odikge1xuICAgICAgICAgICAgcmV0dXJuIHYgJiYgdi5pZCgpID09PSBjb25JRDtcbiAgICAgICAgfSk7XG4gICAgfSwgdGhpcyk7XG4gICAgXG4gICAgdGhpcy5zdWJqZWN0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbSA9IHRoaXMuY29udmVyc2F0aW9uKClbMF07XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBtID9cbiAgICAgICAgICAgIG0uc3ViamVjdCgpIDpcbiAgICAgICAgICAgICdDb252ZXJzYXRpb24gdy9vIHN1YmplY3QnXG4gICAgICAgICk7XG4gICAgICAgIFxuICAgIH0sIHRoaXMpO1xufVxuXG4vKiogVEVTVElORyBEQVRBICoqL1xuZnVuY3Rpb24gc2V0U29tZVRlc3RpbmdEYXRhKHZpZXdNb2RlbCkge1xuICAgIFxuICAgIHZpZXdNb2RlbC5pbmJveC5tZXNzYWdlcyhyZXF1aXJlKCcuLi90ZXN0ZGF0YS9tZXNzYWdlcycpLm1lc3NhZ2VzKTtcbn1cbiIsIi8qKlxyXG4gICAgZGF0ZXRpbWVQaWNrZXIgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIFRpbWUgPSByZXF1aXJlKCcuLi91dGlscy9UaW1lJyksXHJcbiAgICBOYXZCYXIgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkJhcicpLFxyXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcclxucmVxdWlyZSgnLi4vY29tcG9uZW50cy9EYXRlUGlja2VyJyk7XHJcbiAgICBcclxudmFyIHNpbmdsZXRvbiA9IG51bGw7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0RGF0ZXRpbWVQaWNrZXIoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxyXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBEYXRldGltZVBpY2tlckFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcclxuXHJcbiAgICByZXR1cm4gc2luZ2xldG9uO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gRGF0ZXRpbWVQaWNrZXJBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcclxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XHJcbiAgICAgICAgdGl0bGU6ICcnLFxyXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5nb0JhY2ssXHJcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5nb0hlbHBJbmRleFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMuYXBwID0gYXBwO1xyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLiRkYXRlUGlja2VyID0gJGFjdGl2aXR5LmZpbmQoJyNkYXRldGltZVBpY2tlckRhdGVQaWNrZXInKTtcclxuICAgIHRoaXMuJHRpbWVQaWNrZXIgPSAkYWN0aXZpdHkuZmluZCgnI2RhdGV0aW1lUGlja2VyVGltZVBpY2tlcicpO1xyXG5cclxuICAgIC8qIEluaXQgY29tcG9uZW50cyAqL1xyXG4gICAgdGhpcy4kZGF0ZVBpY2tlci5zaG93KCkuZGF0ZXBpY2tlcigpO1xyXG4gICAgXHJcbiAgICB2YXIgZGF0YVZpZXcgPSB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xyXG4gICAgZGF0YVZpZXcuaGVhZGVyVGV4dCA9ICdTZWxlY3QgYSBzdGFydCB0aW1lJztcclxuICAgIGtvLmFwcGx5QmluZGluZ3MoZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xyXG4gICAgXHJcbiAgICAvLyBFdmVudHNcclxuICAgIHRoaXMuJGRhdGVQaWNrZXIub24oJ2NoYW5nZURhdGUnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgaWYgKGUudmlld01vZGUgPT09ICdkYXlzJykge1xyXG4gICAgICAgICAgICBkYXRhVmlldy5zZWxlY3RlZERhdGUoZS5kYXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgXHJcbiAgICAvLyBUZXN0aW5nRGF0YVxyXG4gICAgZGF0YVZpZXcuc2xvdHNEYXRhID0gcmVxdWlyZSgnLi4vdGVzdGRhdGEvdGltZVNsb3RzJykudGltZVNsb3RzO1xyXG4gXHJcbiAgICBkYXRhVmlldy5zZWxlY3RlZERhdGUuc3Vic2NyaWJlKGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgICAgICB0aGlzLmJpbmREYXRlRGF0YShkYXRlKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgdGhpcy5iaW5kRGF0ZURhdGEobmV3IERhdGUoKSk7XHJcbiAgICBcclxuICAgIC8vIE9iamVjdCB0byBob2xkIHRoZSBvcHRpb25zIHBhc3NlZCBvbiAnc2hvdycgYXMgYSByZXN1bHRcclxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyIHRvIGdvIGJhY2sgd2l0aCB0aGUgc2VsZWN0ZWQgZGF0ZS10aW1lIHdoZW5cclxuICAgIC8vIHRoYXQgc2VsZWN0aW9uIGlzIGRvbmUgKGNvdWxkIGJlIHRvIG51bGwpXHJcbiAgICB0aGlzLmRhdGFWaWV3LnNlbGVjdGVkRGF0ZXRpbWUuc3Vic2NyaWJlKGZ1bmN0aW9uIChkYXRldGltZSkge1xyXG4gICAgICAgIC8vIFdlIGhhdmUgYSByZXF1ZXN0XHJcbiAgICAgICAgaWYgKHRoaXMucmVxdWVzdEluZm8pIHtcclxuICAgICAgICAgICAgLy8gUGFzcyB0aGUgc2VsZWN0ZWQgZGF0ZXRpbWUgaW4gdGhlIGluZm9cclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mby5zZWxlY3RlZERhdGV0aW1lID0gdGhpcy5kYXRhVmlldy5zZWxlY3RlZERhdGV0aW1lKCk7XHJcbiAgICAgICAgICAgIC8vIEFuZCBnbyBiYWNrXHJcbiAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvQmFjayh0aGlzLnJlcXVlc3RJbmZvKTtcclxuICAgICAgICAgICAgLy8gTGFzdCwgY2xlYXIgcmVxdWVzdEluZm9cclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufVxyXG5cclxuRGF0ZXRpbWVQaWNrZXJBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG4gIFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gb3B0aW9ucztcclxufTtcclxuXHJcbkRhdGV0aW1lUGlja2VyQWN0aXZpdHkucHJvdG90eXBlLmJpbmREYXRlRGF0YSA9IGZ1bmN0aW9uIGJpbmREYXRlRGF0YShkYXRlKSB7XHJcblxyXG4gICAgdmFyIHNkYXRlID0gbW9tZW50KGRhdGUpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xyXG4gICAgdmFyIHNsb3RzRGF0YSA9IHRoaXMuZGF0YVZpZXcuc2xvdHNEYXRhO1xyXG5cclxuICAgIGlmIChzbG90c0RhdGEuaGFzT3duUHJvcGVydHkoc2RhdGUpKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5zbG90cyhzbG90c0RhdGFbc2RhdGVdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5zbG90cyhzbG90c0RhdGFbJ2RlZmF1bHQnXSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XHJcblxyXG4gICAgdGhpcy5oZWFkZXJUZXh0ID0ga28ub2JzZXJ2YWJsZSgnU2VsZWN0IGEgdGltZScpO1xyXG4gICAgdGhpcy5zZWxlY3RlZERhdGUgPSBrby5vYnNlcnZhYmxlKG5ldyBEYXRlKCkpO1xyXG4gICAgdGhpcy5zbG90c0RhdGEgPSB7fTtcclxuICAgIHRoaXMuc2xvdHMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xyXG4gICAgdGhpcy5ncm91cGVkU2xvdHMgPSBrby5jb21wdXRlZChmdW5jdGlvbigpe1xyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICBiZWZvcmUgMTI6MDBwbSAobm9vbikgPSBtb3JuaW5nXHJcbiAgICAgICAgICBhZnRlcm5vb246IDEyOjAwcG0gdW50aWwgNTowMHBtXHJcbiAgICAgICAgICBldmVuaW5nOiA1OjAwcG0gLSAxMTo1OXBtXHJcbiAgICAgICAgKi9cclxuICAgICAgICAvLyBTaW5jZSBzbG90cyBtdXN0IGJlIGZvciB0aGUgc2FtZSBkYXRlLFxyXG4gICAgICAgIC8vIHRvIGRlZmluZSB0aGUgZ3JvdXBzIHJhbmdlcyB1c2UgdGhlIGZpcnN0IGRhdGVcclxuICAgICAgICB2YXIgZGF0ZVBhcnQgPSB0aGlzLnNsb3RzKCkgJiYgdGhpcy5zbG90cygpWzBdIHx8IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgdmFyIGdyb3VwcyA9IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZ3JvdXA6ICdNb3JuaW5nJyxcclxuICAgICAgICAgICAgICAgIHNsb3RzOiBbXSxcclxuICAgICAgICAgICAgICAgIHN0YXJ0czogbmV3IFRpbWUoZGF0ZVBhcnQsIDAsIDApLFxyXG4gICAgICAgICAgICAgICAgZW5kczogbmV3IFRpbWUoZGF0ZVBhcnQsIDEyLCAwKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBncm91cDogJ0FmdGVybm9vbicsXHJcbiAgICAgICAgICAgICAgICBzbG90czogW10sXHJcbiAgICAgICAgICAgICAgICBzdGFydHM6IG5ldyBUaW1lKGRhdGVQYXJ0LCAxMiwgMCksXHJcbiAgICAgICAgICAgICAgICBlbmRzOiBuZXcgVGltZShkYXRlUGFydCwgMTcsIDApXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGdyb3VwOiAnRXZlbmluZycsXHJcbiAgICAgICAgICAgICAgICBzbG90czogW10sXHJcbiAgICAgICAgICAgICAgICBzdGFydHM6IG5ldyBUaW1lKGRhdGVQYXJ0LCAxNywgMCksXHJcbiAgICAgICAgICAgICAgICBlbmRzOiBuZXcgVGltZShkYXRlUGFydCwgMjQsIDApXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdO1xyXG4gICAgICAgIHZhciBzbG90cyA9IHRoaXMuc2xvdHMoKS5zb3J0KCk7XHJcbiAgICAgICAgc2xvdHMuZm9yRWFjaChmdW5jdGlvbihzbG90KSB7XHJcbiAgICAgICAgICAgIGdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uKGdyb3VwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2xvdCA+PSBncm91cC5zdGFydHMgJiZcclxuICAgICAgICAgICAgICAgICAgICBzbG90IDwgZ3JvdXAuZW5kcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwLnNsb3RzLnB1c2goc2xvdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gZ3JvdXBzO1xyXG5cclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlbGVjdGVkRGF0ZXRpbWUgPSBrby5vYnNlcnZhYmxlKG51bGwpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlbGVjdERhdGV0aW1lID0gZnVuY3Rpb24oc2VsZWN0ZWREYXRldGltZSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWREYXRldGltZShzZWxlY3RlZERhdGV0aW1lKTtcclxuXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcblxyXG59XHJcbiIsIi8qKlxuICAgIEZhcXMgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBGYXFzQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ1RhbGsgdG8gdXMnKTtcbiAgICBcbiAgICAvLyBUZXN0aW5nRGF0YVxuICAgIHNldFNvbWVUZXN0aW5nRGF0YSh0aGlzLnZpZXdNb2RlbCk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhzdGF0ZSkge1xuICAgIFxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xuICAgIFxuICAgIHRoaXMudmlld01vZGVsLnNlYXJjaFRleHQoJycpO1xufTtcblxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG4gICAgdGhpcy5mYXFzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcbiAgICB0aGlzLnNlYXJjaFRleHQgPSBrby5vYnNlcnZhYmxlKCcnKTtcbiAgICBcbiAgICB0aGlzLmZpbHRlcmVkRmFxcyA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHMgPSB0aGlzLnNlYXJjaFRleHQoKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICByZXR1cm4gdGhpcy5mYXFzKCkuZmlsdGVyKGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICAgIHZhciBuID0gdiAmJiB2LnRpdGxlKCkgfHwgJyc7XG4gICAgICAgICAgICBuICs9IHYgJiYgdi5kZXNjcmlwdGlvbigpIHx8ICcnO1xuICAgICAgICAgICAgbiA9IG4udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHJldHVybiBuLmluZGV4T2YocykgPiAtMTtcbiAgICAgICAgfSk7XG4gICAgfSwgdGhpcyk7XG59XG5cbnZhciBNb2RlbCA9IHJlcXVpcmUoJy4uL21vZGVscy9Nb2RlbCcpO1xuZnVuY3Rpb24gRmFxKHZhbHVlcykge1xuICAgIFxuICAgIE1vZGVsKHRoaXMpO1xuXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcbiAgICAgICAgaWQ6IDAsXG4gICAgICAgIHRpdGxlOiAnJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICcnXG4gICAgfSwgdmFsdWVzKTtcbn1cblxuLyoqIFRFU1RJTkcgREFUQSAqKi9cbmZ1bmN0aW9uIHNldFNvbWVUZXN0aW5nRGF0YSh2aWV3TW9kZWwpIHtcbiAgICBcbiAgICB2YXIgdGVzdGRhdGEgPSBbXG4gICAgICAgIG5ldyBGYXEoe1xuICAgICAgICAgICAgaWQ6IDEsXG4gICAgICAgICAgICB0aXRsZTogJ0hvdyBkbyBJIHNldCB1cCBhIG1hcmtldHBsYWNlIHByb2ZpbGU/JyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGVzY3JpcHRpb24gYWJvdXQgaG93IEkgc2V0IHVwIGEgbWFya2V0cGxhY2UgcHJvZmlsZSdcbiAgICAgICAgfSksXG4gICAgICAgIG5ldyBGYXEoe1xuICAgICAgICAgICAgaWQ6IDIsXG4gICAgICAgICAgICB0aXRsZTogJ0Fub3RoZXIgZmFxJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQW5vdGhlciBkZXNjcmlwdGlvbidcbiAgICAgICAgfSlcbiAgICBdO1xuICAgIHZpZXdNb2RlbC5mYXFzKHRlc3RkYXRhKTtcbn1cbiIsIi8qKlxuICAgIEZlZWRiYWNrIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gRmVlZGJhY2tBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKCdUYWxrIHRvIHVzJyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuIiwiLyoqXG4gICAgRmVlZGJhY2tGb3JtIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gRmVlZGJhY2tGb3JtQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ1RhbGsgdG8gdXMnKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgXG4gICAgdGhpcy5tZXNzYWdlID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgdGhpcy5iZWNvbWVDb2xsYWJvcmF0b3IgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcbiAgICB0aGlzLndhc1NlbnQgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcblxuICAgIHZhciB1cGRhdGVXYXNTZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMud2FzU2VudChmYWxzZSk7XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIHRoaXMubWVzc2FnZS5zdWJzY3JpYmUodXBkYXRlV2FzU2VudCk7XG4gICAgdGhpcy5iZWNvbWVDb2xsYWJvcmF0b3Iuc3Vic2NyaWJlKHVwZGF0ZVdhc1NlbnQpO1xuICAgIFxuICAgIHRoaXMuc2VuZCA9IGZ1bmN0aW9uIHNlbmQoKSB7XG4gICAgICAgIC8vIFRPRE86IFNlbmRcbiAgICAgICAgXG4gICAgICAgIC8vIFJlc2V0IGFmdGVyIGJlaW5nIHNlbnRcbiAgICAgICAgdGhpcy5tZXNzYWdlKCcnKTtcbiAgICAgICAgdGhpcy5iZWNvbWVDb2xsYWJvcmF0b3IoZmFsc2UpO1xuICAgICAgICB0aGlzLndhc1NlbnQodHJ1ZSk7XG5cbiAgICB9LmJpbmQodGhpcyk7XG59XG4iLCIvKipcbiAgICBIb21lIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKSxcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xuXG52YXIgc2luZ2xldG9uID0gbnVsbDtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdEhvbWUoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBIb21lQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xuICAgIFxuICAgIHJldHVybiBzaW5nbGV0b247XG59O1xuXG5mdW5jdGlvbiBIb21lQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkN1c3RvbWVyO1xuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XG4gICAgICAgIHRpdGxlOiBudWxsLCAvLyBudWxsIGZvciBsb2dvXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5tZW51TmV3SXRlbSxcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5tZW51SW5cbiAgICB9KTtcblxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIHRoaXMuJG5leHRCb29raW5nID0gJGFjdGl2aXR5LmZpbmQoJyNob21lTmV4dEJvb2tpbmcnKTtcbiAgICB0aGlzLiR1cGNvbWluZ0Jvb2tpbmdzID0gJGFjdGl2aXR5LmZpbmQoJyNob21lVXBjb21pbmdCb29raW5ncycpO1xuICAgIHRoaXMuJGluYm94ID0gJGFjdGl2aXR5LmZpbmQoJyNob21lSW5ib3gnKTtcbiAgICB0aGlzLiRwZXJmb3JtYW5jZSA9ICRhY3Rpdml0eS5maW5kKCcjaG9tZVBlcmZvcm1hbmNlJyk7XG4gICAgdGhpcy4kZ2V0TW9yZSA9ICRhY3Rpdml0eS5maW5kKCcjaG9tZUdldE1vcmUnKTtcblxuICAgIHRoaXMuZGF0YVZpZXcgPSBuZXcgVmlld01vZGVsKCk7XG4gICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLmRhdGFWaWV3LCAkYWN0aXZpdHkuZ2V0KDApKTtcblxuICAgIC8vIFRlc3RpbmdEYXRhXG4gICAgc2V0U29tZVRlc3RpbmdEYXRhKHRoaXMuZGF0YVZpZXcpO1xuXG4gICAgLy8gT2JqZWN0IHRvIGhvbGQgdGhlIG9wdGlvbnMgcGFzc2VkIG9uICdzaG93JyBhcyBhIHJlc3VsdFxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gbnVsbDtcbn1cblxuSG9tZUFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG4gXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG9wdGlvbnM7XG4gICAgdmFyIHYgPSB0aGlzLmRhdGFWaWV3LFxuICAgICAgICBhcHBNb2RlbCA9IHRoaXMuYXBwLm1vZGVsO1xuICAgIFxuICAgIC8vIFVwZGF0ZSBkYXRhXG4gICAgYXBwTW9kZWwuZ2V0VXBjb21pbmdCb29raW5ncygpLnRoZW4oZnVuY3Rpb24odXBjb21pbmcpIHtcblxuICAgICAgICBpZiAodXBjb21pbmcubmV4dEJvb2tpbmdJRClcbiAgICAgICAgICAgIGFwcE1vZGVsLmdldEJvb2tpbmcodXBjb21pbmcubmV4dEJvb2tpbmdJRCkudGhlbih2Lm5leHRCb29raW5nKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdi5uZXh0Qm9va2luZyhudWxsKTtcblxuICAgICAgICB2LnVwY29taW5nQm9va2luZ3MudG9kYXkucXVhbnRpdHkodXBjb21pbmcudG9kYXkucXVhbnRpdHkpO1xuICAgICAgICB2LnVwY29taW5nQm9va2luZ3MudG9kYXkudGltZSh1cGNvbWluZy50b2RheS50aW1lICYmIG5ldyBEYXRlKHVwY29taW5nLnRvZGF5LnRpbWUpKTtcbiAgICAgICAgdi51cGNvbWluZ0Jvb2tpbmdzLnRvbW9ycm93LnF1YW50aXR5KHVwY29taW5nLnRvbW9ycm93LnF1YW50aXR5KTtcbiAgICAgICAgdi51cGNvbWluZ0Jvb2tpbmdzLnRvbW9ycm93LnRpbWUodXBjb21pbmcudG9tb3Jyb3cudGltZSAmJiBuZXcgRGF0ZSh1cGNvbWluZy50b21vcnJvdy50aW1lKSk7XG4gICAgICAgIHYudXBjb21pbmdCb29raW5ncy5uZXh0V2Vlay5xdWFudGl0eSh1cGNvbWluZy5uZXh0V2Vlay5xdWFudGl0eSk7XG4gICAgICAgIHYudXBjb21pbmdCb29raW5ncy5uZXh0V2Vlay50aW1lKHVwY29taW5nLm5leHRXZWVrLnRpbWUgJiYgbmV3IERhdGUodXBjb21pbmcubmV4dFdlZWsudGltZSkpO1xuICAgIH0pO1xufTtcblxudmFyIFVwY29taW5nQm9va2luZ3NTdW1tYXJ5ID0gcmVxdWlyZSgnLi4vbW9kZWxzL1VwY29taW5nQm9va2luZ3NTdW1tYXJ5JyksXG4gICAgTWFpbEZvbGRlciA9IHJlcXVpcmUoJy4uL21vZGVscy9NYWlsRm9sZGVyJyksXG4gICAgUGVyZm9ybWFuY2VTdW1tYXJ5ID0gcmVxdWlyZSgnLi4vbW9kZWxzL1BlcmZvcm1hbmNlU3VtbWFyeScpLFxuICAgIEdldE1vcmUgPSByZXF1aXJlKCcuLi9tb2RlbHMvR2V0TW9yZScpO1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG5cbiAgICB0aGlzLnVwY29taW5nQm9va2luZ3MgPSBuZXcgVXBjb21pbmdCb29raW5nc1N1bW1hcnkoKTtcblxuICAgIC8vIDpBcHBvaW50bWVudFxuICAgIHRoaXMubmV4dEJvb2tpbmcgPSBrby5vYnNlcnZhYmxlKG51bGwpO1xuICAgIFxuICAgIHRoaXMuaW5ib3ggPSBuZXcgTWFpbEZvbGRlcih7XG4gICAgICAgIHRvcE51bWJlcjogNFxuICAgIH0pO1xuICAgIFxuICAgIHRoaXMucGVyZm9ybWFuY2UgPSBuZXcgUGVyZm9ybWFuY2VTdW1tYXJ5KCk7XG4gICAgXG4gICAgdGhpcy5nZXRNb3JlID0gbmV3IEdldE1vcmUoKTtcbn1cblxuLyoqIFRFU1RJTkcgREFUQSAqKi9cbnZhciBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xuXG5mdW5jdGlvbiBzZXRTb21lVGVzdGluZ0RhdGEoZGF0YVZpZXcpIHtcbiAgICBcbiAgICBkYXRhVmlldy5pbmJveC5tZXNzYWdlcyhyZXF1aXJlKCcuLi90ZXN0ZGF0YS9tZXNzYWdlcycpLm1lc3NhZ2VzKTtcbiAgICBcbiAgICBkYXRhVmlldy5wZXJmb3JtYW5jZS5lYXJuaW5ncy5jdXJyZW50QW1vdW50KDI0MDApO1xuICAgIGRhdGFWaWV3LnBlcmZvcm1hbmNlLmVhcm5pbmdzLm5leHRBbW91bnQoNjIwMC41NCk7XG4gICAgZGF0YVZpZXcucGVyZm9ybWFuY2UudGltZUJvb2tlZC5wZXJjZW50KDAuOTMpO1xuICAgIFxuICAgIGRhdGFWaWV3LmdldE1vcmUubW9kZWwudXBkYXRlV2l0aCh7XG4gICAgICAgIGF2YWlsYWJpbGl0eTogdHJ1ZSxcbiAgICAgICAgcGF5bWVudHM6IHRydWUsXG4gICAgICAgIHByb2ZpbGU6IHRydWUsXG4gICAgICAgIGNvb3A6IHRydWVcbiAgICB9KTtcbn1cbiIsIi8qKlxuICAgIEluYm94IGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEluYm94QWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIoJ0luYm94Jyk7XG4gICAgXG4gICAgLy90aGlzLiRpbmJveCA9ICRhY3Rpdml0eS5maW5kKCcjaW5ib3hMaXN0Jyk7XG4gICAgXG4gICAgLy8gVGVzdGluZ0RhdGFcbiAgICBzZXRTb21lVGVzdGluZ0RhdGEodGhpcy52aWV3TW9kZWwpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxudmFyIE1haWxGb2xkZXIgPSByZXF1aXJlKCcuLi9tb2RlbHMvTWFpbEZvbGRlcicpO1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG5cbiAgICB0aGlzLmluYm94ID0gbmV3IE1haWxGb2xkZXIoe1xuICAgICAgICB0b3BOdW1iZXI6IDIwXG4gICAgfSk7XG4gICAgXG4gICAgdGhpcy5zZWFyY2hUZXh0ID0ga28ub2JzZXJ2YWJsZSgnJyk7XG59XG5cbi8qKiBURVNUSU5HIERBVEEgKiovXG5mdW5jdGlvbiBzZXRTb21lVGVzdGluZ0RhdGEoZGF0YVZpZXcpIHtcbiAgICBcbiAgICBkYXRhVmlldy5pbmJveC5tZXNzYWdlcyhyZXF1aXJlKCcuLi90ZXN0ZGF0YS9tZXNzYWdlcycpLm1lc3NhZ2VzKTtcbn1cbiIsIi8qKlxuICAgIEluZGV4IGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIHNpbmdsZXRvbiA9IG51bGwsXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKSxcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0SW5kZXgoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBJbmRleEFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcbiAgICBcbiAgICByZXR1cm4gc2luZ2xldG9uO1xufTtcblxuZnVuY3Rpb24gSW5kZXhBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBuZXcgTmF2QmFyKHtcbiAgICAgICAgdGl0bGU6IG51bGwsIC8vIG51bGwgZm9yIGxvZ29cbiAgICAgICAgbGVmdEFjdGlvbjogTmF2QWN0aW9uLmdvTG9naW4sXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBOYXZBY3Rpb24ubWVudU91dFxuICAgIH0pO1xuICAgIFxuICAgIC8vIEFueSB1c2VyIGNhbiBhY2Nlc3MgdGhpc1xuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBudWxsO1xufVxuXG5JbmRleEFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG4gICAgLy8gSXQgY2hlY2tzIGlmIHRoZSB1c2VyIGlzIGxvZ2dlZCBzbyB0aGVuIFxuICAgIC8vIHRoZWlyICdsb2dnZWQgaW5kZXgnIGlzIHRoZSBkYXNoYm9hcmQgbm90IHRoaXNcbiAgICAvLyBwYWdlIHRoYXQgaXMgZm9jdXNlZCBvbiBhbm9ueW1vdXMgdXNlcnNcbiAgICBpZiAoIXRoaXMuYXBwLm1vZGVsLnVzZXIoKS5pc0Fub255bW91cygpKSB7XG4gICAgICAgIHRoaXMuYXBwLmdvRGFzaGJvYXJkKCk7XG4gICAgfVxufTtcbiIsIi8qKlxuICAgIEpvYnRpdGxlcyBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEpvYnRpdGxlc0FjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdTY2hlZHVsaW5nJyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG59XG4iLCIvKipcbiAgICBMZWFybk1vcmUgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcbiAgICBOYXZCYXIgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkJhcicpLFxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyk7XG5cbnZhciBzaW5nbGV0b24gPSBudWxsO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0TGVhcm5Nb3JlKCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgTGVhcm5Nb3JlQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xuICAgIFxuICAgIHJldHVybiBzaW5nbGV0b247XG59O1xuXG5mdW5jdGlvbiBMZWFybk1vcmVBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMuZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XG4gICAgICAgIHRpdGxlOiBudWxsLCAvLyBudWxsIGZvciBsb2dvXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5nb0JhY2ssXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBOYXZBY3Rpb24ubWVudU91dFxuICAgIH0pO1xufVxuXG5MZWFybk1vcmVBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuXG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5yb3V0ZSAmJlxuICAgICAgICBvcHRpb25zLnJvdXRlLnNlZ21lbnRzICYmXG4gICAgICAgIG9wdGlvbnMucm91dGUuc2VnbWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuZGF0YVZpZXcucHJvZmlsZShvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdKTtcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgdGhpcy5wcm9maWxlID0ga28ub2JzZXJ2YWJsZSgnY3VzdG9tZXInKTtcbn0iLCIvKipcbiAgICBMb2NhdGlvbkVkaXRpb24gYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcbiAgICBMb2NhdGlvbiA9IHJlcXVpcmUoJy4uL21vZGVscy9Mb2NhdGlvbicpLFxuICAgIE5hdkJhciA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QmFyJyksXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcblxudmFyIHNpbmdsZXRvbiA9IG51bGw7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRMb2NhdGlvbkVkaXRpb24oJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBMb2NhdGlvbkVkaXRpb25BY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XG4gICAgXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbn07XG5cbmZ1bmN0aW9uIExvY2F0aW9uRWRpdGlvbkFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xuXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMuZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XG4gICAgICAgIHRpdGxlOiAnJyxcbiAgICAgICAgbGVmdEFjdGlvbjogTmF2QWN0aW9uLmdvQmFjay5tb2RlbC5jbG9uZSh7XG4gICAgICAgICAgICB0ZXh0OiAnTG9jYXRpb25zJ1xuICAgICAgICB9KSxcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5nb0hlbHBJbmRleFxuICAgIH0pO1xufVxuXG5Mb2NhdGlvbkVkaXRpb25BY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuICAgIC8vanNoaW50IG1heGNvbXBsZXhpdHk6MTBcbiAgICBcbiAgICB2YXIgaWQgPSAwLFxuICAgICAgICBjcmVhdGUgPSAnJztcblxuICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmxvY2F0aW9uSUQpIHtcbiAgICAgICAgICAgIGlkID0gb3B0aW9ucy5sb2NhdGlvbklEO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9wdGlvbnMucm91dGUgJiYgb3B0aW9ucy5yb3V0ZS5zZWdtZW50cykge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZCA9IHBhcnNlSW50KG9wdGlvbnMucm91dGUuc2VnbWVudHNbMF0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9wdGlvbnMuY3JlYXRlKSB7XG4gICAgICAgICAgICBjcmVhdGUgPSBvcHRpb25zLmNyZWF0ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBpZiAoaWQpIHtcbiAgICAgICAgLy8gVE9ET1xuICAgICAgICAvLyB2YXIgbG9jYXRpb24gPSB0aGlzLmFwcC5tb2RlbC5nZXRMb2NhdGlvbihpZClcbiAgICAgICAgLy8gTk9URSB0ZXN0aW5nIGRhdGFcbiAgICAgICAgdmFyIGxvY2F0aW9ucyA9IHtcbiAgICAgICAgICAgICcxJzogbmV3IExvY2F0aW9uKHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbklEOiAxLFxuICAgICAgICAgICAgICAgIG5hbWU6ICdIb21lJyxcbiAgICAgICAgICAgICAgICBhZGRyZXNzTGluZTE6ICdIZXJlIFN0cmVldCcsXG4gICAgICAgICAgICAgICAgY2l0eTogJ1NhbiBGcmFuY2lzY28nLFxuICAgICAgICAgICAgICAgIHBvc3RhbENvZGU6ICc5MDAwMScsXG4gICAgICAgICAgICAgICAgc3RhdGVQcm92aW5jZUNvZGU6ICdDQScsXG4gICAgICAgICAgICAgICAgY291bnRyeUlEOiAxLFxuICAgICAgICAgICAgICAgIGlzU2VydmljZVJhZGl1czogdHJ1ZSxcbiAgICAgICAgICAgICAgICBpc1NlcnZpY2VMb2NhdGlvbjogZmFsc2VcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgJzInOiBuZXcgTG9jYXRpb24oe1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uSUQ6IDEsXG4gICAgICAgICAgICAgICAgbmFtZTogJ1dvcmtzaG9wJyxcbiAgICAgICAgICAgICAgICBhZGRyZXNzTGluZTE6ICdVbmtub3cgU3RyZWV0JyxcbiAgICAgICAgICAgICAgICBjaXR5OiAnU2FuIEZyYW5jaXNjbycsXG4gICAgICAgICAgICAgICAgcG9zdGFsQ29kZTogJzkwMDAxJyxcbiAgICAgICAgICAgICAgICBzdGF0ZVByb3ZpbmNlQ29kZTogJ0NBJyxcbiAgICAgICAgICAgICAgICBjb3VudHJ5SUQ6IDEsXG4gICAgICAgICAgICAgICAgaXNTZXJ2aWNlUmFkaXVzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBpc1NlcnZpY2VMb2NhdGlvbjogdHJ1ZVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGxvY2F0aW9uID0gbG9jYXRpb25zW2lkXTtcbiAgICAgICAgaWYgKGxvY2F0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmxvY2F0aW9uKGxvY2F0aW9uKTtcblxuICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5oZWFkZXIoJ0VkaXQgTG9jYXRpb24nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9jYXRpb24obnVsbCk7XG4gICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmhlYWRlcignVW5rbm93IGxvY2F0aW9uIG9yIHdhcyBkZWxldGVkJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIC8vIE5ldyBsb2NhdGlvblxuICAgICAgICB0aGlzLmRhdGFWaWV3LmxvY2F0aW9uKG5ldyBMb2NhdGlvbigpKTtcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAob3B0aW9ucy5jcmVhdGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ3NlcnZpY2VSYWRpdXMnOlxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9jYXRpb24oKS5pc1NlcnZpY2VSYWRpdXModHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5oZWFkZXIoJ0FkZCBhIHNlcnZpY2UgcmFkaXVzJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdzZXJ2aWNlTG9jYXRpb24nOlxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9jYXRpb24oKS5pc1NlcnZpY2VMb2NhdGlvbih0cnVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmhlYWRlcignQWRkIGEgc2VydmljZSBsb2NhdGlvbicpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmxvY2F0aW9uKCkuaXNTZXJ2aWNlUmFkaXVzKHRydWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9jYXRpb24oKS5pc1NlcnZpY2VMb2NhdGlvbih0cnVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmhlYWRlcignQWRkIGEgbG9jYXRpb24nKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcbiAgICBcbiAgICB0aGlzLmxvY2F0aW9uID0ga28ub2JzZXJ2YWJsZShuZXcgTG9jYXRpb24oKSk7XG4gICAgXG4gICAgdGhpcy5oZWFkZXIgPSBrby5vYnNlcnZhYmxlKCdFZGl0IExvY2F0aW9uJyk7XG4gICAgXG4gICAgLy8gVE9ET1xuICAgIHRoaXMuc2F2ZSA9IGZ1bmN0aW9uKCkge307XG4gICAgdGhpcy5jYW5jZWwgPSBmdW5jdGlvbigpIHt9O1xufSIsIi8qKlxyXG4gICAgbG9jYXRpb25zIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKSxcclxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyk7XHJcbiAgICBcclxudmFyIHNpbmdsZXRvbiA9IG51bGw7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0TG9jYXRpb25zKCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcclxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgTG9jYXRpb25zQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xyXG4gICAgXHJcbiAgICByZXR1cm4gc2luZ2xldG9uO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gTG9jYXRpb25zQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcclxuICAgIFxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xyXG4gICAgdGhpcy5uYXZCYXIgPSBuZXcgTmF2QmFyKHtcclxuICAgICAgICB0aXRsZTogJycsXHJcbiAgICAgICAgbGVmdEFjdGlvbjogTmF2QWN0aW9uLmdvQmFjay5tb2RlbC5jbG9uZSh7XHJcbiAgICAgICAgICAgIGlzVGl0bGU6IHRydWVcclxuICAgICAgICB9KSxcclxuICAgICAgICByaWdodEFjdGlvbjogTmF2QWN0aW9uLmdvSGVscEluZGV4XHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xyXG4gICAgdGhpcy4kbGlzdFZpZXcgPSAkYWN0aXZpdHkuZmluZCgnI2xvY2F0aW9uc0xpc3RWaWV3Jyk7XHJcblxyXG4gICAgdmFyIGRhdGFWaWV3ID0gdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoYXBwKTtcclxuICAgIGtvLmFwcGx5QmluZGluZ3MoZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xyXG5cclxuICAgIC8vIFRlc3RpbmdEYXRhXHJcbiAgICBkYXRhVmlldy5sb2NhdGlvbnMocmVxdWlyZSgnLi4vdGVzdGRhdGEvbG9jYXRpb25zJykubG9jYXRpb25zKTtcclxuXHJcbiAgICAvLyBIYW5kbGVyIHRvIHVwZGF0ZSBoZWFkZXIgYmFzZWQgb24gYSBtb2RlIGNoYW5nZTpcclxuICAgIHRoaXMuZGF0YVZpZXcuaXNTZWxlY3Rpb25Nb2RlLnN1YnNjcmliZShmdW5jdGlvbiAoaXRJcykge1xyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuaGVhZGVyVGV4dChpdElzID8gJ1NlbGVjdCBvciBhZGQgYSBzZXJ2aWNlIGxvY2F0aW9uJyA6ICdMb2NhdGlvbnMnKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBVcGRhdGUgbmF2YmFyIHRvb1xyXG4gICAgICAgIC8vIFRPRE86IENhbiBiZSBvdGhlciB0aGFuICdzY2hlZHVsaW5nJywgbGlrZSBtYXJrZXRwbGFjZSBwcm9maWxlIG9yIHRoZSBqb2ItdGl0bGU/XHJcbiAgICAgICAgdGhpcy5uYXZCYXIubGVmdEFjdGlvbigpLnRleHQoaXRJcyA/ICdCb29raW5nJyA6ICdTY2hlZHVsaW5nJyk7XHJcbiAgICAgICAgLy8gVGl0bGUgbXVzdCBiZSBlbXB0eVxyXG4gICAgICAgIHRoaXMubmF2QmFyLnRpdGxlKCcnKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBUT0RPIFJlcGxhY2VkIGJ5IGEgcHJvZ3Jlc3MgYmFyIG9uIGJvb2tpbmcgY3JlYXRpb25cclxuICAgICAgICAvLyBUT0RPIE9yIGxlZnRBY3Rpb24oKS50ZXh0KC4uKSBvbiBib29raW5nIGVkaXRpb24gKHJldHVybiB0byBib29raW5nKVxyXG4gICAgICAgIC8vIG9yIGNvbWluZyBmcm9tIEpvYnRpdGxlL3NjaGVkdWxlIChyZXR1cm4gdG8gc2NoZWR1bGUvam9iIHRpdGxlKT9cclxuICAgICAgICBcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgLy8gT2JqZWN0IHRvIGhvbGQgdGhlIG9wdGlvbnMgcGFzc2VkIG9uICdzaG93JyBhcyBhIHJlc3VsdFxyXG4gICAgLy8gb2YgYSByZXF1ZXN0IGZyb20gYW5vdGhlciBhY3Rpdml0eVxyXG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XHJcbiAgICBcclxuICAgIC8vIEhhbmRsZXIgdG8gZ28gYmFjayB3aXRoIHRoZSBzZWxlY3RlZCBsb2NhdGlvbiB3aGVuIFxyXG4gICAgLy8gc2VsZWN0aW9uIG1vZGUgZ29lcyBvZmYgYW5kIHJlcXVlc3RJbmZvIGlzIGZvclxyXG4gICAgLy8gJ3NlbGVjdCBtb2RlJ1xyXG4gICAgdGhpcy5kYXRhVmlldy5pc1NlbGVjdGlvbk1vZGUuc3Vic2NyaWJlKGZ1bmN0aW9uIChpdElzKSB7XHJcbiAgICAgICAgLy8gV2UgaGF2ZSBhIHJlcXVlc3QgYW5kXHJcbiAgICAgICAgLy8gaXQgcmVxdWVzdGVkIHRvIHNlbGVjdCBhIGxvY2F0aW9uXHJcbiAgICAgICAgLy8gYW5kIHNlbGVjdGlvbiBtb2RlIGdvZXMgb2ZmXHJcbiAgICAgICAgaWYgKHRoaXMucmVxdWVzdEluZm8gJiZcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mby5zZWxlY3RMb2NhdGlvbiA9PT0gdHJ1ZSAmJlxyXG4gICAgICAgICAgICBpdElzID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gUGFzcyB0aGUgc2VsZWN0ZWQgY2xpZW50IGluIHRoZSBpbmZvXHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8uc2VsZWN0ZWRMb2NhdGlvbiA9IHRoaXMuZGF0YVZpZXcuc2VsZWN0ZWRMb2NhdGlvbigpO1xyXG4gICAgICAgICAgICAvLyBBbmQgZ28gYmFja1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5zaGVsbC5nb0JhY2sodGhpcy5yZXF1ZXN0SW5mbyk7XHJcbiAgICAgICAgICAgIC8vIExhc3QsIGNsZWFyIHJlcXVlc3RJbmZvXHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn1cclxuXHJcbkxvY2F0aW9uc0FjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcbiAgXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBvcHRpb25zO1xyXG5cclxuICAgIGlmIChvcHRpb25zLnNlbGVjdExvY2F0aW9uID09PSB0cnVlKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5pc1NlbGVjdGlvbk1vZGUodHJ1ZSk7XHJcbiAgICAgICAgLy8gcHJlc2V0OlxyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuc2VsZWN0ZWRMb2NhdGlvbihvcHRpb25zLnNlbGVjdGVkTG9jYXRpb24pO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAob3B0aW9ucy5yb3V0ZSAmJiBvcHRpb25zLnJvdXRlLnNlZ21lbnRzKSB7XHJcbiAgICAgICAgdmFyIGlkID0gb3B0aW9ucy5yb3V0ZS5zZWdtZW50c1swXTtcclxuICAgICAgICBpZiAoaWQpIHtcclxuICAgICAgICAgICAgaWYgKGlkID09PSAnbmV3Jykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ28oJ2xvY2F0aW9uRWRpdGlvbicsIHtcclxuICAgICAgICAgICAgICAgICAgICBjcmVhdGU6IG9wdGlvbnMucm91dGUuc2VnbWVudHNbMV0gLy8gJ3NlcnZpY2VSYWRpdXMnLCAnc2VydmljZUxvY2F0aW9uJ1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5zaGVsbC5nbygnbG9jYXRpb25FZGl0aW9uJywge1xyXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uSUQ6IGlkXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbChhcHApIHtcclxuXHJcbiAgICB0aGlzLmhlYWRlclRleHQgPSBrby5vYnNlcnZhYmxlKCdMb2NhdGlvbnMnKTtcclxuXHJcbiAgICAvLyBGdWxsIGxpc3Qgb2YgbG9jYXRpb25zXHJcbiAgICB0aGlzLmxvY2F0aW9ucyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcblxyXG4gICAgLy8gRXNwZWNpYWwgbW9kZSB3aGVuIGluc3RlYWQgb2YgcGljayBhbmQgZWRpdCB3ZSBhcmUganVzdCBzZWxlY3RpbmdcclxuICAgIC8vICh3aGVuIGVkaXRpbmcgYW4gYXBwb2ludG1lbnQpXHJcbiAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZSA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG5cclxuICAgIHRoaXMuc2VsZWN0ZWRMb2NhdGlvbiA9IGtvLm9ic2VydmFibGUobnVsbCk7XHJcbiAgICBcclxuICAgIHRoaXMuc2VsZWN0TG9jYXRpb24gPSBmdW5jdGlvbihzZWxlY3RlZExvY2F0aW9uKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHRoaXMuaXNTZWxlY3Rpb25Nb2RlKCkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZExvY2F0aW9uKHNlbGVjdGVkTG9jYXRpb24pO1xyXG4gICAgICAgICAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZShmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBhcHAuc2hlbGwuZ28oJ2xvY2F0aW9uRWRpdGlvbicsIHtcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uSUQ6IHNlbGVjdGVkTG9jYXRpb24ubG9jYXRpb25JRCgpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbn1cclxuIiwiLyoqXG4gICAgTG9naW4gYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcbiAgVXNlciA9IHJlcXVpcmUoJy4uL21vZGVscy9Vc2VyJyksXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKSxcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xuXG52YXIgc2luZ2xldG9uID0gbnVsbDtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdExvZ2luKCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgTG9naW5BY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XG4gICAgXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbn07XG5cbmZ1bmN0aW9uIExvZ2luQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkFub255bW91cztcbiAgICB0aGlzLm5hdkJhciA9IG5ldyBOYXZCYXIoe1xuICAgICAgICB0aXRsZTogJ0xvZyBpbicsXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5nb0JhY2ssXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBOYXZBY3Rpb24ubWVudU91dFxuICAgIH0pO1xuXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMuZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xuICAgIFxuICAgIC8vIFBlcmZvcm0gbG9nLWluIHJlcXVlc3Qgd2hlbiBpcyByZXF1ZXN0ZWQgYnkgdGhlIGZvcm06XG4gICAgdGhpcy5kYXRhVmlldy5pc0xvZ2luZ0luLnN1YnNjcmliZShmdW5jdGlvbih2KSB7XG4gICAgICAgIGlmICh2ID09PSB0cnVlKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFBlcmZvcm0gbG9naW5nXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIE5vdGlmeSBzdGF0ZTpcbiAgICAgICAgICAgIHZhciAkYnRuID0gJGFjdGl2aXR5LmZpbmQoJ1t0eXBlPVwic3VibWl0XCJdJyk7XG4gICAgICAgICAgICAkYnRuLmJ1dHRvbignbG9hZGluZycpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBDbGVhciBwcmV2aW91cyBlcnJvciBzbyBtYWtlcyBjbGVhciB3ZVxuICAgICAgICAgICAgLy8gYXJlIGF0dGVtcHRpbmdcbiAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9naW5FcnJvcignJyk7XG4gICAgICAgIFxuICAgICAgICAgICAgdmFyIGVuZGVkID0gZnVuY3Rpb24gZW5kZWQoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5pc0xvZ2luZ0luKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAkYnRuLmJ1dHRvbigncmVzZXQnKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQWZ0ZXIgY2xlYW4tdXAgZXJyb3IgKHRvIGZvcmNlIHNvbWUgdmlldyB1cGRhdGVzKSxcbiAgICAgICAgICAgIC8vIHZhbGlkYXRlIGFuZCBhYm9ydCBvbiBlcnJvclxuICAgICAgICAgICAgLy8gTWFudWFsbHkgY2hlY2tpbmcgZXJyb3Igb24gZWFjaCBmaWVsZFxuICAgICAgICAgICAgaWYgKHRoaXMuZGF0YVZpZXcudXNlcm5hbWUuZXJyb3IoKSB8fFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcucGFzc3dvcmQuZXJyb3IoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9naW5FcnJvcignUmV2aWV3IHlvdXIgZGF0YScpO1xuICAgICAgICAgICAgICAgIGVuZGVkKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBhcHAubW9kZWwubG9naW4oXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy51c2VybmFtZSgpLFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcucGFzc3dvcmQoKVxuICAgICAgICAgICAgKS50aGVuKGZ1bmN0aW9uKGxvZ2luRGF0YSkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9naW5FcnJvcignJyk7XG4gICAgICAgICAgICAgICAgZW5kZWQoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgZm9ybSBkYXRhXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy51c2VybmFtZSgnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5wYXNzd29yZCgnJyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuZ29EYXNoYm9hcmQoKTtcblxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKS5jYXRjaChmdW5jdGlvbihlcnIpIHtcblxuICAgICAgICAgICAgICAgIHZhciBtc2cgPSBlcnIgJiYgZXJyLnJlc3BvbnNlSlNPTiAmJiBlcnIucmVzcG9uc2VKU09OLmVycm9yTWVzc2FnZSB8fFxuICAgICAgICAgICAgICAgICAgICBlcnIgJiYgZXJyLnN0YXR1c1RleHQgfHxcbiAgICAgICAgICAgICAgICAgICAgJ0ludmFsaWQgdXNlcm5hbWUgb3IgcGFzc3dvcmQnO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5sb2dpbkVycm9yKG1zZyk7XG4gICAgICAgICAgICAgICAgZW5kZWQoKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuICAgIFxuICAgIC8vIEZvY3VzIGZpcnN0IGJhZCBmaWVsZCBvbiBlcnJvclxuICAgIHRoaXMuZGF0YVZpZXcubG9naW5FcnJvci5zdWJzY3JpYmUoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIC8vIExvZ2luIGlzIGVhc3kgc2luY2Ugd2UgbWFyayBib3RoIHVuaXF1ZSBmaWVsZHNcbiAgICAgICAgLy8gYXMgZXJyb3Igb24gbG9naW5FcnJvciAoaXRzIGEgZ2VuZXJhbCBmb3JtIGVycm9yKVxuICAgICAgICB2YXIgaW5wdXQgPSAkYWN0aXZpdHkuZmluZCgnOmlucHV0JykuZ2V0KDApO1xuICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgaW5wdXQuZm9jdXMoKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaW5wdXQuYmx1cigpO1xuICAgIH0pO1xufVxuXG5Mb2dpbkFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG59O1xuXG52YXIgRm9ybUNyZWRlbnRpYWxzID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9Gb3JtQ3JlZGVudGlhbHMnKTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG4gICAgdmFyIGNyZWRlbnRpYWxzID0gbmV3IEZvcm1DcmVkZW50aWFscygpOyAgICBcbiAgICB0aGlzLnVzZXJuYW1lID0gY3JlZGVudGlhbHMudXNlcm5hbWU7XG4gICAgdGhpcy5wYXNzd29yZCA9IGNyZWRlbnRpYWxzLnBhc3N3b3JkO1xuXG4gICAgdGhpcy5sb2dpbkVycm9yID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgXG4gICAgdGhpcy5pc0xvZ2luZ0luID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG4gICAgXG4gICAgdGhpcy5wZXJmb3JtTG9naW4gPSBmdW5jdGlvbiBwZXJmb3JtTG9naW4oKSB7XG5cbiAgICAgICAgdGhpcy5pc0xvZ2luZ0luKHRydWUpOyAgICAgICAgXG4gICAgfS5iaW5kKHRoaXMpO1xufVxuIiwiLyoqXG4gICAgTG9nb3V0IGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIHNpbmdsZXRvbiA9IG51bGw7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRMb2dvdXQoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBMb2dvdXRBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XG4gICAgXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbn07XG5cbmZ1bmN0aW9uIExvZ291dEFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cbkxvZ291dEFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG5cbiAgICB0aGlzLmFwcC5tb2RlbC5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBBbm9ueW1vdXMgdXNlciBhZ2FpblxuICAgICAgICB2YXIgbmV3QW5vbiA9IHRoaXMuYXBwLm1vZGVsLnVzZXIoKS5jb25zdHJ1Y3Rvci5uZXdBbm9ueW1vdXMoKTtcbiAgICAgICAgdGhpcy5hcHAubW9kZWwudXNlcigpLm1vZGVsLnVwZGF0ZVdpdGgobmV3QW5vbik7XG5cbiAgICAgICAgLy8gR28gaW5kZXhcbiAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ28oJy8nKTtcbiAgICAgICAgXG4gICAgfS5iaW5kKHRoaXMpKTtcbn07XG4iLCIvKipcbiAgICBPbmJvYXJkaW5nQ29tcGxldGUgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2luZ2xldG9uID0gbnVsbDtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdE9uYm9hcmRpbmdDb21wbGV0ZSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IE9uYm9hcmRpbmdDb21wbGV0ZUFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcbiAgICBcbiAgICByZXR1cm4gc2luZ2xldG9uO1xufTtcblxuZnVuY3Rpb24gT25ib2FyZGluZ0NvbXBsZXRlQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuT25ib2FyZGluZ0NvbXBsZXRlQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcblxufTtcbiIsIi8qKlxuICAgIE9uYm9hcmRpbmdIb21lIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIHNpbmdsZXRvbiA9IG51bGwsXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKSxcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0T25ib2FyZGluZ0hvbWUoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBPbmJvYXJkaW5nSG9tZUFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcbiAgICBcbiAgICByZXR1cm4gc2luZ2xldG9uO1xufTtcblxuZnVuY3Rpb24gT25ib2FyZGluZ0hvbWVBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIFxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XG4gICAgICAgIHRpdGxlOiBudWxsLCAvLyBudWxsIGZvciBMb2dvXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5nb0xvZ291dCxcbiAgICAgICAgcmlnaHRBY3Rpb246IG51bGxcbiAgICB9KTtcbn1cblxuT25ib2FyZGluZ0hvbWVBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuXG59O1xuIiwiLyoqXG4gICAgT25ib2FyZGluZyBQb3NpdGlvbnMgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcbiAgICBOYXZCYXIgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkJhcicpLFxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyk7XG5cbnZhciBzaW5nbGV0b24gPSBudWxsO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0T25ib2FyZGluZ1Bvc2l0aW9ucygkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IE9uYm9hcmRpbmdQb3NpdGlvbnNBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XG4gICAgXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbn07XG5cbmZ1bmN0aW9uIE9uYm9hcmRpbmdQb3NpdGlvbnNBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xuICAgIFxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIHRoaXMuZGF0YVZpZXcgPSBuZXcgVmlld01vZGVsKCk7XG4gICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLmRhdGFWaWV3LCAkYWN0aXZpdHkuZ2V0KDApKTtcblxuICAgIC8vIFRlc3RpbmdEYXRhXG4gICAgc2V0U29tZVRlc3RpbmdEYXRhKHRoaXMuZGF0YVZpZXcpO1xuXG4gICAgLy8gT2JqZWN0IHRvIGhvbGQgdGhlIG9wdGlvbnMgcGFzc2VkIG9uICdzaG93JyBhcyBhIHJlc3VsdFxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gbnVsbDtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IG5ldyBOYXZCYXIoe1xuICAgICAgICB0aXRsZTogJ0pvYiBUaXRsZXMnLFxuICAgICAgICBsZWZ0QWN0aW9uOiBOYXZBY3Rpb24ubWVudU5ld0l0ZW0sXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBOYXZBY3Rpb24ubWVudUluXG4gICAgfSk7XG59XG5cbk9uYm9hcmRpbmdQb3NpdGlvbnNBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuIFxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMucmVxdWVzdEluZm8gPSBvcHRpb25zO1xufTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG4gICAgLy8gRnVsbCBsaXN0IG9mIHBvc2l0aW9uc1xuICAgIHRoaXMucG9zaXRpb25zID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcbn1cblxudmFyIFBvc2l0aW9uID0gcmVxdWlyZSgnLi4vbW9kZWxzL1Bvc2l0aW9uJyk7XG4vLyBVc2VyUG9zaXRpb24gbW9kZWxcbmZ1bmN0aW9uIHNldFNvbWVUZXN0aW5nRGF0YShkYXRhdmlldykge1xuICAgIFxuICAgIGRhdGF2aWV3LnBvc2l0aW9ucy5wdXNoKG5ldyBQb3NpdGlvbih7XG4gICAgICAgIHBvc2l0aW9uU2luZ3VsYXI6ICdNYXNzYWdlIFRoZXJhcGlzdCdcbiAgICB9KSk7XG4gICAgZGF0YXZpZXcucG9zaXRpb25zLnB1c2gobmV3IFBvc2l0aW9uKHtcbiAgICAgICAgcG9zaXRpb25TaW5ndWxhcjogJ0hvdXNla2VlcGVyJ1xuICAgIH0pKTtcbn0iLCIvKipcbiAgICBPd25lckluZm8gYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBPd25lckluZm9BY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdBY2NvdW50Jyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuIiwiLyoqXG4gICAgU2NoZWR1bGluZyBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBzaW5nbGV0b24gPSBudWxsLFxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpLFxuICAgIE5hdkJhciA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QmFyJyk7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRTY2hlZHVsaW5nKCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgU2NoZWR1bGluZ0FjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcbiAgICBcbiAgICByZXR1cm4gc2luZ2xldG9uO1xufTtcblxuZnVuY3Rpb24gU2NoZWR1bGluZ0FjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMuZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XG4gICAgICAgIHRpdGxlOiAnU2NoZWR1bGluZycsXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5tZW51TmV3SXRlbSxcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5tZW51SW5cbiAgICB9KTtcbn1cblxuU2NoZWR1bGluZ0FjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG5cbn07XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcblxufVxuIiwiLyoqXHJcbiAgICBTY2hlZHVsaW5nUHJlZmVyZW5jZXMgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIFNjaGVkdWxpbmdQcmVmZXJlbmNlc0FjdGl2aXR5KCkge1xyXG4gICAgXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkZyZWVsYW5jZXI7XHJcblxyXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdTY2hlZHVsaW5nJyk7XHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xyXG4gICAgXHJcbiAgICAvLyBSZXF1ZXN0IGEgbG9hZCwgZXZlbiBpZiBpcyBhIGJhY2tncm91bmQgbG9hZCBhZnRlciB0aGUgZmlyc3QgdGltZTpcclxuICAgIHRoaXMuYXBwLm1vZGVsLnNjaGVkdWxpbmdQcmVmZXJlbmNlcy5sb2FkKCk7XHJcbiAgICAvLyBEaXNjYXJkIGFueSBwcmV2aW91cyB1bnNhdmVkIGVkaXRcclxuICAgIHRoaXMudmlld01vZGVsLmRpc2NhcmQoKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbChhcHApIHtcclxuXHJcbiAgICB2YXIgc2NoZWR1bGluZ1ByZWZlcmVuY2VzID0gYXBwLm1vZGVsLnNjaGVkdWxpbmdQcmVmZXJlbmNlcztcclxuXHJcbiAgICB2YXIgcHJlZnNWZXJzaW9uID0gc2NoZWR1bGluZ1ByZWZlcmVuY2VzLm5ld1ZlcnNpb24oKTtcclxuICAgIHByZWZzVmVyc2lvbi5pc09ic29sZXRlLnN1YnNjcmliZShmdW5jdGlvbihpdElzKSB7XHJcbiAgICAgICAgaWYgKGl0SXMpIHtcclxuICAgICAgICAgICAgLy8gbmV3IHZlcnNpb24gZnJvbSBzZXJ2ZXIgd2hpbGUgZWRpdGluZ1xyXG4gICAgICAgICAgICAvLyBGVVRVUkU6IHdhcm4gYWJvdXQgYSBuZXcgcmVtb3RlIHZlcnNpb24gYXNraW5nXHJcbiAgICAgICAgICAgIC8vIGNvbmZpcm1hdGlvbiB0byBsb2FkIHRoZW0gb3IgZGlzY2FyZCBhbmQgb3ZlcndyaXRlIHRoZW07XHJcbiAgICAgICAgICAgIC8vIHRoZSBzYW1lIGlzIG5lZWQgb24gc2F2ZSgpLCBhbmQgb24gc2VydmVyIHJlc3BvbnNlXHJcbiAgICAgICAgICAgIC8vIHdpdGggYSA1MDk6Q29uZmxpY3Qgc3RhdHVzIChpdHMgYm9keSBtdXN0IGNvbnRhaW4gdGhlXHJcbiAgICAgICAgICAgIC8vIHNlcnZlciB2ZXJzaW9uKS5cclxuICAgICAgICAgICAgLy8gUmlnaHQgbm93LCBqdXN0IG92ZXJ3cml0ZSBjdXJyZW50IGNoYW5nZXMgd2l0aFxyXG4gICAgICAgICAgICAvLyByZW1vdGUgb25lczpcclxuICAgICAgICAgICAgcHJlZnNWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gQWN0dWFsIGRhdGEgZm9yIHRoZSBmb3JtOlxyXG4gICAgdGhpcy5wcmVmcyA9IHByZWZzVmVyc2lvbi52ZXJzaW9uO1xyXG5cclxuICAgIHRoaXMuaXNMb2NrZWQgPSBzY2hlZHVsaW5nUHJlZmVyZW5jZXMuaXNMb2NrZWQ7XHJcblxyXG4gICAgdGhpcy5zdWJtaXRUZXh0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKCkgPyBcclxuICAgICAgICAgICAgICAgICdsb2FkaW5nLi4uJyA6IFxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc1NhdmluZygpID8gXHJcbiAgICAgICAgICAgICAgICAgICAgJ3NhdmluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgICAgICAnU2F2ZSdcclxuICAgICAgICApO1xyXG4gICAgfSwgc2NoZWR1bGluZ1ByZWZlcmVuY2VzKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNjYXJkID0gZnVuY3Rpb24gZGlzY2FyZCgpIHtcclxuICAgICAgICBwcmVmc1ZlcnNpb24ucHVsbCh7IGV2ZW5JZk5ld2VyOiB0cnVlIH0pO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG5cclxuICAgIHRoaXMuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICAgICAgLy8gRm9yY2UgdG8gc2F2ZSwgZXZlbiBpZiB0aGVyZSB3YXMgcmVtb3RlIHVwZGF0ZXNcclxuICAgICAgICBwcmVmc1ZlcnNpb24ucHVzaCh7IGV2ZW5JZk9ic29sZXRlOiB0cnVlIH0pO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmluY3JlbWVudHNFeGFtcGxlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBzdHIgPSAnZS5nLiAnLFxyXG4gICAgICAgICAgICBpbmNTaXplID0gdGhpcy5pbmNyZW1lbnRzU2l6ZUluTWludXRlcygpLFxyXG4gICAgICAgICAgICBtID0gbW9tZW50KHsgaG91cjogMTAsIG1pbnV0ZTogMCB9KSxcclxuICAgICAgICAgICAgaG91cnMgPSBbbS5mb3JtYXQoJ0hIOm1tJyldO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgNDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGhvdXJzLnB1c2goXHJcbiAgICAgICAgICAgICAgICBtLmFkZChpbmNTaXplLCAnbWludXRlcycpXHJcbiAgICAgICAgICAgICAgICAuZm9ybWF0KCdISDptbScpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0ciArPSBob3Vycy5qb2luKCcsICcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBzdHI7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzLnByZWZzKTtcclxufVxyXG4iLCIvKipcclxuICAgIHNlcnZpY2VzIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbiAgICBcclxudmFyIHNpbmdsZXRvbiA9IG51bGw7XHJcblxyXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gU2VydmljZXNBY3Rpdml0eSgpIHtcclxuXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuRnJlbGFuY2VyO1xyXG4gICAgXHJcbiAgICAvLyBUT0RPOiBvbiBzaG93LCBuZWVkIHRvIGJlIHVwZGF0ZWQgd2l0aCB0aGUgSm9iVGl0bGUgbmFtZVxyXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdKb2IgdGl0bGUnKTtcclxuICAgIFxyXG4gICAgLy90aGlzLiRsaXN0VmlldyA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNzZXJ2aWNlc0xpc3RWaWV3Jyk7XHJcblxyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XHJcblxyXG4gICAgLy8gVGVzdGluZ0RhdGFcclxuICAgIHRoaXMudmlld01vZGVsLnNlcnZpY2VzKHJlcXVpcmUoJy4uL3Rlc3RkYXRhL3NlcnZpY2VzJykuc2VydmljZXMubWFwKFNlbGVjdGFibGUpKTtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciB0byBnbyBiYWNrIHdpdGggdGhlIHNlbGVjdGVkIHNlcnZpY2Ugd2hlbiBcclxuICAgIC8vIHNlbGVjdGlvbiBtb2RlIGdvZXMgb2ZmIGFuZCByZXF1ZXN0RGF0YSBpcyBmb3JcclxuICAgIC8vICdzZWxlY3QgbW9kZSdcclxuICAgIHRoaXMudmlld01vZGVsLmlzU2VsZWN0aW9uTW9kZS5zdWJzY3JpYmUoZnVuY3Rpb24gKGl0SXMpIHtcclxuICAgICAgICAvLyBXZSBoYXZlIGEgcmVxdWVzdCBhbmRcclxuICAgICAgICAvLyBpdCByZXF1ZXN0ZWQgdG8gc2VsZWN0IGEgc2VydmljZVxyXG4gICAgICAgIC8vIGFuZCBzZWxlY3Rpb24gbW9kZSBnb2VzIG9mZlxyXG4gICAgICAgIGlmICh0aGlzLnJlcXVlc3REYXRhICYmXHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdERhdGEuc2VsZWN0U2VydmljZXMgPT09IHRydWUgJiZcclxuICAgICAgICAgICAgaXRJcyA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFBhc3MgdGhlIHNlbGVjdGVkIGNsaWVudCBpbiB0aGUgaW5mb1xyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3REYXRhLnNlbGVjdGVkU2VydmljZXMgPSB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZFNlcnZpY2VzKCk7XHJcbiAgICAgICAgICAgIC8vIEFuZCBnbyBiYWNrXHJcbiAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvQmFjayh0aGlzLnJlcXVlc3REYXRhKTtcclxuICAgICAgICAgICAgLy8gTGFzdCwgY2xlYXIgcmVxdWVzdERhdGFcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RGF0YSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcblxyXG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBvcHRpb25zKTtcclxuICAgIFxyXG4gICAgLy8gR2V0IGpvYnRpdGxlSUQgZm9yIHRoZSByZXF1ZXN0XHJcbiAgICB2YXIgcm91dGUgPSB0aGlzLnJlcXVlc3REYXRhLnJvdXRlO1xyXG4gICAgdmFyIGpvYlRpdGxlSUQgPSByb3V0ZSAmJiByb3V0ZS5zZWdtZW50cyAmJiByb3V0ZS5zZWdtZW50c1swXTtcclxuICAgIGpvYlRpdGxlSUQgPSBwYXJzZUludChqb2JUaXRsZUlELCAxMCk7XHJcbiAgICBpZiAoam9iVGl0bGVJRCkge1xyXG4gICAgICAgIC8vIFRPRE86IGdldCBkYXRhIGZvciB0aGUgSm9iIHRpdGxlIElEXHJcbiAgICAgICAgdGhpcy5hcHAubW9kZWwuZ2V0VXNlckpvYlRpdGxlKGpvYlRpdGxlSUQpLnRoZW4oZnVuY3Rpb24odXNlckpvYnRpdGxlKSB7XHJcbiAgICAgICAgICAgIGlmICghdXNlckpvYnRpdGxlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTm8gdXNlciBqb2IgdGl0bGUnKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBMb2FkIHVzZXIgZGF0YSBvbiB0aGlzIGFjdGl2aXR5OlxyXG4gICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5zZXJ2aWNlcyh1c2VySm9idGl0bGUuc2VydmljZXMoKSk7XHJcbiAgICAgICAgICAgIC8vIEZpbGwgaW4gam9iIHRpdGxlIG5hbWVcclxuICAgICAgICAgICAgdGhpcy5hcHAubW9kZWwuZ2V0Sm9iVGl0bGUoam9iVGl0bGVJRCkudGhlbihmdW5jdGlvbihqb2JUaXRsZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFqb2JUaXRsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdObyBqb2IgdGl0bGUnKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5hdkJhci5sZWZ0QWN0aW9uKCkudGV4dChqb2JUaXRsZS5zaW5ndWxhck5hbWUoKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLnJlcXVlc3REYXRhLnNlbGVjdFNlcnZpY2VzID09PSB0cnVlKSB7XHJcbiAgICAgICAgdGhpcy52aWV3TW9kZWwuaXNTZWxlY3Rpb25Nb2RlKHRydWUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8qIFRyaWFscyB0byBwcmVzZXRzIHRoZSBzZWxlY3RlZCBzZXJ2aWNlcywgTk9UIFdPUktJTkdcclxuICAgICAgICB2YXIgc2VydmljZXMgPSAob3B0aW9ucy5zZWxlY3RlZFNlcnZpY2VzIHx8IFtdKTtcclxuICAgICAgICB2YXIgc2VsZWN0ZWRTZXJ2aWNlcyA9IHRoaXMudmlld01vZGVsLnNlbGVjdGVkU2VydmljZXM7XHJcbiAgICAgICAgc2VsZWN0ZWRTZXJ2aWNlcy5yZW1vdmVBbGwoKTtcclxuICAgICAgICB0aGlzLnZpZXdNb2RlbC5zZXJ2aWNlcygpLmZvckVhY2goZnVuY3Rpb24oc2VydmljZSkge1xyXG4gICAgICAgICAgICBzZXJ2aWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHNlbFNlcnZpY2UpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzZWxTZXJ2aWNlID09PSBzZXJ2aWNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VydmljZS5pc1NlbGVjdGVkKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkU2VydmljZXMucHVzaChzZXJ2aWNlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VydmljZS5pc1NlbGVjdGVkKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgKi9cclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIFNlbGVjdGFibGUob2JqKSB7XHJcbiAgICBvYmouaXNTZWxlY3RlZCA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgcmV0dXJuIG9iajtcclxufVxyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIC8vIEZ1bGwgbGlzdCBvZiBzZXJ2aWNlc1xyXG4gICAgdGhpcy5zZXJ2aWNlcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcblxyXG4gICAgLy8gRXNwZWNpYWwgbW9kZSB3aGVuIGluc3RlYWQgb2YgcGljayBhbmQgZWRpdCB3ZSBhcmUganVzdCBzZWxlY3RpbmdcclxuICAgIC8vICh3aGVuIGVkaXRpbmcgYW4gYXBwb2ludG1lbnQpXHJcbiAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZSA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG5cclxuICAgIC8vIEdyb3VwZWQgbGlzdCBvZiBwcmljaW5nczpcclxuICAgIC8vIERlZmluZWQgZ3JvdXBzOiByZWd1bGFyIHNlcnZpY2VzIGFuZCBhZGQtb25zXHJcbiAgICB0aGlzLmdyb3VwZWRTZXJ2aWNlcyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIHZhciBzZXJ2aWNlcyA9IHRoaXMuc2VydmljZXMoKTtcclxuICAgICAgICB2YXIgaXNTZWxlY3Rpb24gPSB0aGlzLmlzU2VsZWN0aW9uTW9kZSgpO1xyXG5cclxuICAgICAgICB2YXIgc2VydmljZXNHcm91cCA9IHtcclxuICAgICAgICAgICAgICAgIGdyb3VwOiBpc1NlbGVjdGlvbiA/ICdTZWxlY3Qgc3RhbmRhbG9uZSBzZXJ2aWNlcycgOiAnU3RhbmRhbG9uZSBzZXJ2aWNlcycsXHJcbiAgICAgICAgICAgICAgICBzZXJ2aWNlczogW11cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYWRkb25zR3JvdXAgPSB7XHJcbiAgICAgICAgICAgICAgICBncm91cDogaXNTZWxlY3Rpb24gPyAnU2VsZWN0IGFkZC1vbiBzZXJ2aWNlcycgOiAnQWRkLW9uIHNlcnZpY2VzJyxcclxuICAgICAgICAgICAgICAgIHNlcnZpY2VzOiBbXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBncm91cHMgPSBbc2VydmljZXNHcm91cCwgYWRkb25zR3JvdXBdO1xyXG5cclxuICAgICAgICBzZXJ2aWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBpc0FkZG9uID0gc2VydmljZS5pc0FkZG9uKCk7XHJcbiAgICAgICAgICAgIGlmIChpc0FkZG9uKSB7XHJcbiAgICAgICAgICAgICAgICBhZGRvbnNHcm91cC5zZXJ2aWNlcy5wdXNoKHNlcnZpY2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2VydmljZXNHcm91cC5zZXJ2aWNlcy5wdXNoKHNlcnZpY2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBncm91cHM7XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2VsZWN0ZWRTZXJ2aWNlcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcbiAgICAvKipcclxuICAgICAgICBUb2dnbGUgdGhlIHNlbGVjdGlvbiBzdGF0dXMgb2YgYSBzZXJ2aWNlLCBhZGRpbmdcclxuICAgICAgICBvciByZW1vdmluZyBpdCBmcm9tIHRoZSAnc2VsZWN0ZWRTZXJ2aWNlcycgYXJyYXkuXHJcbiAgICAqKi9cclxuICAgIHRoaXMudG9nZ2xlU2VydmljZVNlbGVjdGlvbiA9IGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgaW5JbmRleCA9IC0xLFxyXG4gICAgICAgICAgICBpc1NlbGVjdGVkID0gdGhpcy5zZWxlY3RlZFNlcnZpY2VzKCkuc29tZShmdW5jdGlvbihzZWxlY3RlZFNlcnZpY2UsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RlZFNlcnZpY2UgPT09IHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgICAgIGluSW5kZXggPSBpbmRleDtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2VydmljZS5pc1NlbGVjdGVkKCFpc1NlbGVjdGVkKTtcclxuXHJcbiAgICAgICAgaWYgKGlzU2VsZWN0ZWQpXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRTZXJ2aWNlcy5zcGxpY2UoaW5JbmRleCwgMSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkU2VydmljZXMucHVzaChzZXJ2aWNlKTtcclxuXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEVuZHMgdGhlIHNlbGVjdGlvbiBwcm9jZXNzLCByZWFkeSB0byBjb2xsZWN0IHNlbGVjdGlvblxyXG4gICAgICAgIGFuZCBwYXNzaW5nIGl0IHRvIHRoZSByZXF1ZXN0IGFjdGl2aXR5XHJcbiAgICAqKi9cclxuICAgIHRoaXMuZW5kU2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5pc1NlbGVjdGlvbk1vZGUoZmFsc2UpO1xyXG4gICAgICAgIFxyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG59XHJcbiIsIi8qKlxuICAgIFNpZ251cCBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxuICAgIE5hdkJhciA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QmFyJyksXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcblxudmFyIHNpbmdsZXRvbiA9IG51bGw7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRTaWdudXAoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBTaWdudXBBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XG4gICAgXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbn07XG5cbmZ1bmN0aW9uIFNpZ251cEFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkFub255bW91cztcbiAgICBcbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBuZXcgTmF2QmFyKHtcbiAgICAgICAgdGl0bGU6IG51bGwsIC8vIG51bGwgZm9yIExvZ29cbiAgICAgICAgbGVmdEFjdGlvbjogbnVsbCxcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5tZW51T3V0XG4gICAgfSk7XG4gICAgXG4gICAgLy8gUGVyZm9ybSBzaWduLXVwIHJlcXVlc3Qgd2hlbiBpcyByZXF1ZXN0ZWQgYnkgdGhlIGZvcm06XG4gICAgdGhpcy5kYXRhVmlldy5pc1NpZ25pbmdVcC5zdWJzY3JpYmUoZnVuY3Rpb24odikge1xuICAgICAgICBpZiAodiA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBQZXJmb3JtIHNpZ251cFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBOb3RpZnkgc3RhdGU6XG4gICAgICAgICAgICB2YXIgJGJ0biA9ICRhY3Rpdml0eS5maW5kKCdbdHlwZT1cInN1Ym1pdFwiXScpO1xuICAgICAgICAgICAgJGJ0bi5idXR0b24oJ2xvYWRpbmcnKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQ2xlYXIgcHJldmlvdXMgZXJyb3Igc28gbWFrZXMgY2xlYXIgd2VcbiAgICAgICAgICAgIC8vIGFyZSBhdHRlbXB0aW5nXG4gICAgICAgICAgICB0aGlzLmRhdGFWaWV3LnNpZ251cEVycm9yKCcnKTtcbiAgICAgICAgXG4gICAgICAgICAgICB2YXIgZW5kZWQgPSBmdW5jdGlvbiBlbmRlZCgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmlzU2lnbmluZ1VwKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAkYnRuLmJ1dHRvbigncmVzZXQnKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQWZ0ZXIgY2xlYW4tdXAgZXJyb3IgKHRvIGZvcmNlIHNvbWUgdmlldyB1cGRhdGVzKSxcbiAgICAgICAgICAgIC8vIHZhbGlkYXRlIGFuZCBhYm9ydCBvbiBlcnJvclxuICAgICAgICAgICAgLy8gTWFudWFsbHkgY2hlY2tpbmcgZXJyb3Igb24gZWFjaCBmaWVsZFxuICAgICAgICAgICAgaWYgKHRoaXMuZGF0YVZpZXcudXNlcm5hbWUuZXJyb3IoKSB8fFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcucGFzc3dvcmQuZXJyb3IoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcuc2lnbnVwRXJyb3IoJ1JldmlldyB5b3VyIGRhdGEnKTtcbiAgICAgICAgICAgICAgICBlbmRlZCgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgYXBwLm1vZGVsLnNpZ251cChcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFWaWV3LnVzZXJuYW1lKCksXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5wYXNzd29yZCgpLFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcucHJvZmlsZSgpXG4gICAgICAgICAgICApLnRoZW4oZnVuY3Rpb24oc2lnbnVwRGF0YSkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcuc2lnbnVwRXJyb3IoJycpO1xuICAgICAgICAgICAgICAgIGVuZGVkKCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGZvcm0gZGF0YVxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcudXNlcm5hbWUoJycpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcucGFzc3dvcmQoJycpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLmdvRGFzaGJvYXJkKCk7XG5cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIG1zZyA9IGVyciAmJiBlcnIucmVzcG9uc2VKU09OICYmIGVyci5yZXNwb25zZUpTT04uZXJyb3JNZXNzYWdlIHx8XG4gICAgICAgICAgICAgICAgICAgIGVyciAmJiBlcnIuc3RhdHVzVGV4dCB8fFxuICAgICAgICAgICAgICAgICAgICAnSW52YWxpZCB1c2VybmFtZSBvciBwYXNzd29yZCc7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFWaWV3LnNpZ251cEVycm9yKG1zZyk7XG4gICAgICAgICAgICAgICAgZW5kZWQoKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuICAgIFxuICAgIC8vIEZvY3VzIGZpcnN0IGJhZCBmaWVsZCBvbiBlcnJvclxuICAgIHRoaXMuZGF0YVZpZXcuc2lnbnVwRXJyb3Iuc3Vic2NyaWJlKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAvLyBTaWdudXAgaXMgZWFzeSBzaW5jZSB3ZSBtYXJrIGJvdGggdW5pcXVlIGZpZWxkc1xuICAgICAgICAvLyBhcyBlcnJvciBvbiBzaWdudXBFcnJvciAoaXRzIGEgZ2VuZXJhbCBmb3JtIGVycm9yKVxuICAgICAgICB2YXIgaW5wdXQgPSAkYWN0aXZpdHkuZmluZCgnOmlucHV0JykuZ2V0KDApO1xuICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgaW5wdXQuZm9jdXMoKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaW5wdXQuYmx1cigpO1xuICAgIH0pO1xufVxuXG5TaWdudXBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuXG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5yb3V0ZSAmJlxuICAgICAgICBvcHRpb25zLnJvdXRlLnNlZ21lbnRzICYmXG4gICAgICAgIG9wdGlvbnMucm91dGUuc2VnbWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuZGF0YVZpZXcucHJvZmlsZShvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdKTtcbiAgICB9XG59O1xudmFyIEZvcm1DcmVkZW50aWFscyA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvRm9ybUNyZWRlbnRpYWxzJyk7XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcblxuICAgIHZhciBjcmVkZW50aWFscyA9IG5ldyBGb3JtQ3JlZGVudGlhbHMoKTsgICAgXG4gICAgdGhpcy51c2VybmFtZSA9IGNyZWRlbnRpYWxzLnVzZXJuYW1lO1xuICAgIHRoaXMucGFzc3dvcmQgPSBjcmVkZW50aWFscy5wYXNzd29yZDtcblxuICAgIHRoaXMuc2lnbnVwRXJyb3IgPSBrby5vYnNlcnZhYmxlKCcnKTtcbiAgICBcbiAgICB0aGlzLmlzU2lnbmluZ1VwID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG4gICAgXG4gICAgdGhpcy5wZXJmb3JtU2lnbnVwID0gZnVuY3Rpb24gcGVyZm9ybVNpZ251cCgpIHtcblxuICAgICAgICB0aGlzLmlzU2lnbmluZ1VwKHRydWUpO1xuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIHRoaXMucHJvZmlsZSA9IGtvLm9ic2VydmFibGUoJ2N1c3RvbWVyJyk7XG59XG4iLCIvKipcclxuICAgIHRleHRFZGl0b3IgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXIsXHJcbiAgICBOYXZCYXIgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkJhcicpLFxyXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcclxuICAgIFxyXG52YXIgc2luZ2xldG9uID0gbnVsbDtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRUZXh0RWRpdG9yKCRhY3Rpdml0eSwgYXBwKSB7XHJcbiAgICBcclxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXHJcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IFRleHRFZGl0b3JBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XHJcbiAgICBcclxuICAgIHJldHVybiBzaW5nbGV0b247XHJcbn07XHJcblxyXG5mdW5jdGlvbiBUZXh0RWRpdG9yQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICB0aGlzLm5hdkJhciA9IG5ldyBOYXZCYXIoe1xyXG4gICAgICAgIC8vIFRpdGxlIGlzIGVtcHR5IGV2ZXIsIHNpbmNlIHdlIGFyZSBpbiAnZ28gYmFjaycgbW9kZSBhbGwgdGhlIHRpbWUgaGVyZVxyXG4gICAgICAgIHRpdGxlOiAnJyxcclxuICAgICAgICAvLyBidXQgbGVmdEFjdGlvbi50ZXh0IGlzIHVwZGF0ZWQgb24gJ3Nob3cnIHdpdGggcGFzc2VkIHZhbHVlLFxyXG4gICAgICAgIC8vIHNvIHdlIG5lZWQgYSBjbG9uZSB0byBub3QgbW9kaWZ5IHRoZSBzaGFyZWQgc3RhdGljIGluc3RhbmNlXHJcbiAgICAgICAgbGVmdEFjdGlvbjogTmF2QWN0aW9uLmdvQmFjay5tb2RlbC5jbG9uZSh7IGlzVGl0bGU6IHRydWUgfSksXHJcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5nb0hlbHBJbmRleFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEZpZWxkc1xyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuICAgIHRoaXMuJHRleHRhcmVhID0gdGhpcy4kYWN0aXZpdHkuZmluZCgndGV4dGFyZWEnKTtcclxuICAgIHRoaXMudGV4dGFyZWEgPSB0aGlzLiR0ZXh0YXJlYS5nZXQoMCk7XHJcblxyXG4gICAgLy8gRGF0YVxyXG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcclxuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XHJcbiAgICBcclxuICAgIC8vIE9iamVjdCB0byBob2xkIHRoZSBvcHRpb25zIHBhc3NlZCBvbiAnc2hvdycgYXMgYSByZXN1bHRcclxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyc1xyXG4gICAgLy8gSGFuZGxlciBmb3IgdGhlICdzYXZlZCcgZXZlbnQgc28gdGhlIGFjdGl2aXR5XHJcbiAgICAvLyByZXR1cm5zIGJhY2sgdG8gdGhlIHJlcXVlc3RlciBhY3Rpdml0eSBnaXZpbmcgaXRcclxuICAgIC8vIHRoZSBuZXcgdGV4dFxyXG4gICAgdGhpcy5kYXRhVmlldy5vbignc2F2ZWQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAodGhpcy5yZXF1ZXN0SW5mbykge1xyXG4gICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGluZm8gd2l0aCB0aGUgbmV3IHRleHRcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mby50ZXh0ID0gdGhpcy5kYXRhVmlldy50ZXh0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBhbmQgcGFzcyBpdCBiYWNrXHJcbiAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ29CYWNrKHRoaXMucmVxdWVzdEluZm8pO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuIFxyXG4gICAgLy8gSGFuZGxlciB0aGUgY2FuY2VsIGV2ZW50XHJcbiAgICB0aGlzLmRhdGFWaWV3Lm9uKCdjYW5jZWwnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyByZXR1cm4sIG5vdGhpbmcgY2hhbmdlZFxyXG4gICAgICAgIGFwcC5zaGVsbC5nb0JhY2soKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn1cclxuXHJcblRleHRFZGl0b3JBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG4gICAgXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBvcHRpb25zO1xyXG5cclxuICAgIC8vIFNldCBuYXZpZ2F0aW9uIHRpdGxlIG9yIG5vdGhpbmdcclxuICAgIHRoaXMubmF2QmFyLmxlZnRBY3Rpb24oKS50ZXh0KG9wdGlvbnMudGl0bGUgfHwgJycpO1xyXG4gICAgXHJcbiAgICAvLyBGaWVsZCBoZWFkZXJcclxuICAgIHRoaXMuZGF0YVZpZXcuaGVhZGVyVGV4dChvcHRpb25zLmhlYWRlcik7XHJcbiAgICB0aGlzLmRhdGFWaWV3LnRleHQob3B0aW9ucy50ZXh0KTtcclxuICAgIGlmIChvcHRpb25zLnJvd3NOdW1iZXIpXHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5yb3dzTnVtYmVyKG9wdGlvbnMucm93c051bWJlcik7XHJcbiAgICAgICAgXHJcbiAgICAvLyBJbm1lZGlhdGUgZm9jdXMgdG8gdGhlIHRleHRhcmVhIGZvciBiZXR0ZXIgdXNhYmlsaXR5XHJcbiAgICB0aGlzLnRleHRhcmVhLmZvY3VzKCk7XHJcbiAgICB0aGlzLiR0ZXh0YXJlYS5jbGljaygpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJ1RleHQnKTtcclxuXHJcbiAgICAvLyBUZXh0IHRvIGVkaXRcclxuICAgIHRoaXMudGV4dCA9IGtvLm9ic2VydmFibGUoJycpO1xyXG4gICAgXHJcbiAgICAvLyBOdW1iZXIgb2Ygcm93cyBmb3IgdGhlIHRleHRhcmVhXHJcbiAgICB0aGlzLnJvd3NOdW1iZXIgPSBrby5vYnNlcnZhYmxlKDIpO1xyXG5cclxuICAgIHRoaXMuY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKCkge1xyXG4gICAgICAgIHRoaXMuZW1pdCgnY2FuY2VsJyk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgICAgIHRoaXMuZW1pdCgnc2F2ZWQnKTtcclxuICAgIH07XHJcbn1cclxuXHJcblZpZXdNb2RlbC5faW5oZXJpdHMoRXZlbnRFbWl0dGVyKTtcclxuIiwiLyoqXHJcbiAgICBXZWVrbHlTY2hlZHVsZSBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gV2Vla2x5U2NoZWR1bGVBY3Rpdml0eSgpIHtcclxuICAgIFxyXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIFxyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xyXG5cclxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignU2NoZWR1bGluZycpO1xyXG59KTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcclxuXHJcbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KHN0YXRlKSB7XHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcclxuICAgIFxyXG4gICAgLy8gUmVxdWVzdCBhIGxvYWQsIGV2ZW4gaWYgaXMgYSBiYWNrZ3JvdW5kIGxvYWQgYWZ0ZXIgdGhlIGZpcnN0IHRpbWU6XHJcbiAgICB0aGlzLmFwcC5tb2RlbC5zaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUubG9hZCgpO1xyXG4gICAgLy8gRGlzY2FyZCBhbnkgcHJldmlvdXMgdW5zYXZlZCBlZGl0XHJcbiAgICB0aGlzLnZpZXdNb2RlbC5kaXNjYXJkKCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoYXBwKSB7XHJcblxyXG4gICAgdmFyIHNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSA9IGFwcC5tb2RlbC5zaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGU7XHJcblxyXG4gICAgdmFyIHNjaGVkdWxlVmVyc2lvbiA9IHNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZS5uZXdWZXJzaW9uKCk7XHJcbiAgICBzY2hlZHVsZVZlcnNpb24uaXNPYnNvbGV0ZS5zdWJzY3JpYmUoZnVuY3Rpb24oaXRJcykge1xyXG4gICAgICAgIGlmIChpdElzKSB7XHJcbiAgICAgICAgICAgIC8vIG5ldyB2ZXJzaW9uIGZyb20gc2VydmVyIHdoaWxlIGVkaXRpbmdcclxuICAgICAgICAgICAgLy8gRlVUVVJFOiB3YXJuIGFib3V0IGEgbmV3IHJlbW90ZSB2ZXJzaW9uIGFza2luZ1xyXG4gICAgICAgICAgICAvLyBjb25maXJtYXRpb24gdG8gbG9hZCB0aGVtIG9yIGRpc2NhcmQgYW5kIG92ZXJ3cml0ZSB0aGVtO1xyXG4gICAgICAgICAgICAvLyB0aGUgc2FtZSBpcyBuZWVkIG9uIHNhdmUoKSwgYW5kIG9uIHNlcnZlciByZXNwb25zZVxyXG4gICAgICAgICAgICAvLyB3aXRoIGEgNTA5OkNvbmZsaWN0IHN0YXR1cyAoaXRzIGJvZHkgbXVzdCBjb250YWluIHRoZVxyXG4gICAgICAgICAgICAvLyBzZXJ2ZXIgdmVyc2lvbikuXHJcbiAgICAgICAgICAgIC8vIFJpZ2h0IG5vdywganVzdCBvdmVyd3JpdGUgY3VycmVudCBjaGFuZ2VzIHdpdGhcclxuICAgICAgICAgICAgLy8gcmVtb3RlIG9uZXM6XHJcbiAgICAgICAgICAgIHNjaGVkdWxlVmVyc2lvbi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEFjdHVhbCBkYXRhIGZvciB0aGUgZm9ybTpcclxuICAgIHRoaXMuc2NoZWR1bGUgPSBzY2hlZHVsZVZlcnNpb24udmVyc2lvbjtcclxuXHJcbiAgICB0aGlzLmlzTG9ja2VkID0gc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlLmlzTG9ja2VkO1xyXG5cclxuICAgIHRoaXMuc3VibWl0VGV4dCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZygpID8gXHJcbiAgICAgICAgICAgICAgICAnbG9hZGluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNTYXZpbmcoKSA/IFxyXG4gICAgICAgICAgICAgICAgICAgICdzYXZpbmcuLi4nIDogXHJcbiAgICAgICAgICAgICAgICAgICAgJ1NhdmUnXHJcbiAgICAgICAgKTtcclxuICAgIH0sIHNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzY2FyZCA9IGZ1bmN0aW9uIGRpc2NhcmQoKSB7XHJcbiAgICAgICAgc2NoZWR1bGVWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgICAgICAvLyBGb3JjZSB0byBzYXZlLCBldmVuIGlmIHRoZXJlIHdhcyByZW1vdGUgdXBkYXRlc1xyXG4gICAgICAgIHNjaGVkdWxlVmVyc2lvbi5wdXNoKHsgZXZlbklmT2Jzb2xldGU6IHRydWUgfSk7XHJcbiAgICB9O1xyXG59XHJcbiIsIi8qKlxyXG4gICAgUmVnaXN0cmF0aW9uIG9mIGN1c3RvbSBodG1sIGNvbXBvbmVudHMgdXNlZCBieSB0aGUgQXBwLlxyXG4gICAgQWxsIHdpdGggJ2FwcC0nIGFzIHByZWZpeC5cclxuICAgIFxyXG4gICAgU29tZSBkZWZpbml0aW9ucyBtYXkgYmUgaW5jbHVkZWQgb24tbGluZSByYXRoZXIgdGhhbiBvbiBzZXBhcmF0ZWRcclxuICAgIGZpbGVzICh2aWV3bW9kZWxzKSwgdGVtcGxhdGVzIGFyZSBsaW5rZWQgc28gbmVlZCB0byBiZSBcclxuICAgIGluY2x1ZGVkIGluIHRoZSBodG1sIGZpbGUgd2l0aCB0aGUgc2FtZSBJRCB0aGF0IHJlZmVyZW5jZWQgaGVyZSxcclxuICAgIHVzdWFsbHkgdXNpbmcgYXMgRE9NIElEIHRoZSBzYW1lIG5hbWUgYXMgdGhlIGNvbXBvbmVudCB3aXRoIHN1Zml4ICctdGVtcGxhdGUnLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxudmFyIHByb3BUb29scyA9IHJlcXVpcmUoJy4vdXRpbHMvanNQcm9wZXJ0aWVzVG9vbHMnKTtcclxuXHJcbmZ1bmN0aW9uIGdldE9ic2VydmFibGUob2JzT3JWYWx1ZSkge1xyXG4gICAgaWYgKHR5cGVvZihvYnNPclZhbHVlKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICByZXR1cm4gb2JzT3JWYWx1ZTtcclxuICAgIGVsc2VcclxuICAgICAgICByZXR1cm4ga28ub2JzZXJ2YWJsZShvYnNPclZhbHVlKTtcclxufVxyXG5cclxuZXhwb3J0cy5yZWdpc3RlckFsbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgXHJcbiAgICAvLy8gbmF2YmFyLWFjdGlvblxyXG4gICAga28uY29tcG9uZW50cy5yZWdpc3RlcignYXBwLW5hdmJhci1hY3Rpb24nLCB7XHJcbiAgICAgICAgdGVtcGxhdGU6IHsgZWxlbWVudDogJ25hdmJhci1hY3Rpb24tdGVtcGxhdGUnIH0sXHJcbiAgICAgICAgdmlld01vZGVsOiBmdW5jdGlvbihwYXJhbXMpIHtcclxuXHJcbiAgICAgICAgICAgIHByb3BUb29scy5kZWZpbmVHZXR0ZXIodGhpcywgJ2FjdGlvbicsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgICAgICBwYXJhbXMuYWN0aW9uICYmIHBhcmFtcy5uYXZCYXIoKSA/XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zLm5hdkJhcigpW3BhcmFtcy5hY3Rpb25dKCkgOlxyXG4gICAgICAgICAgICAgICAgICAgIG51bGxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLy8gdW5sYWJlbGVkLWlucHV0XHJcbiAgICBrby5jb21wb25lbnRzLnJlZ2lzdGVyKCdhcHAtdW5sYWJlbGVkLWlucHV0Jywge1xyXG4gICAgICAgIHRlbXBsYXRlOiB7IGVsZW1lbnQ6ICd1bmxhYmVsZWQtaW5wdXQtdGVtcGxhdGUnIH0sXHJcbiAgICAgICAgdmlld01vZGVsOiBmdW5jdGlvbihwYXJhbXMpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSBnZXRPYnNlcnZhYmxlKHBhcmFtcy52YWx1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMucGxhY2Vob2xkZXIgPSBnZXRPYnNlcnZhYmxlKHBhcmFtcy5wbGFjZWhvbGRlcik7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzYWJsZSA9IGdldE9ic2VydmFibGUocGFyYW1zLmRpc2FibGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLy8gZmVlZGJhY2stZW50cnlcclxuICAgIGtvLmNvbXBvbmVudHMucmVnaXN0ZXIoJ2FwcC1mZWVkYmFjay1lbnRyeScsIHtcclxuICAgICAgICB0ZW1wbGF0ZTogeyBlbGVtZW50OiAnZmVlZGJhY2stZW50cnktdGVtcGxhdGUnIH0sXHJcbiAgICAgICAgdmlld01vZGVsOiBmdW5jdGlvbihwYXJhbXMpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2VjdGlvbiA9IGdldE9ic2VydmFibGUocGFyYW1zLnNlY3Rpb24gfHwgJycpO1xyXG4gICAgICAgICAgICB0aGlzLnVybCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAnL2ZlZWRiYWNrLycgKyB0aGlzLnNlY3Rpb24oKTtcclxuICAgICAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgTmF2YmFyIGV4dGVuc2lvbiBvZiB0aGUgQXBwLFxyXG4gICAgYWRkcyB0aGUgZWxlbWVudHMgdG8gbWFuYWdlIGEgdmlldyBtb2RlbFxyXG4gICAgZm9yIHRoZSBOYXZCYXIgYW5kIGF1dG9tYXRpYyBjaGFuZ2VzXHJcbiAgICB1bmRlciBzb21lIG1vZGVsIGNoYW5nZXMgbGlrZSB1c2VyIGxvZ2luL2xvZ291dFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIE5hdkJhciA9IHJlcXVpcmUoJy4vdmlld21vZGVscy9OYXZCYXInKSxcclxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcclxuXHJcbmV4cG9ydHMuZXh0ZW5kcyA9IGZ1bmN0aW9uIChhcHApIHtcclxuICAgIFxyXG4gICAgLy8gUkVWSUVXOiBzdGlsbCBuZWVkZWQ/IE1heWJlIHRoZSBwZXIgYWN0aXZpdHkgbmF2QmFyIG1lYW5zXHJcbiAgICAvLyB0aGlzIGlzIG5vdCBuZWVkZWQuIFNvbWUgcHJldmlvdXMgbG9naWMgd2FzIGFscmVhZHkgcmVtb3ZlZFxyXG4gICAgLy8gYmVjYXVzZSB3YXMgdXNlbGVzcy5cclxuICAgIC8vXHJcbiAgICAvLyBBZGp1c3QgdGhlIG5hdmJhciBzZXR1cCBkZXBlbmRpbmcgb24gY3VycmVudCB1c2VyLFxyXG4gICAgLy8gc2luY2UgZGlmZmVyZW50IHRoaW5ncyBhcmUgbmVlZCBmb3IgbG9nZ2VkLWluL291dC5cclxuICAgIGZ1bmN0aW9uIGFkanVzdFVzZXJCYXIoKSB7XHJcblxyXG4gICAgICAgIHZhciB1c2VyID0gYXBwLm1vZGVsLnVzZXIoKTtcclxuXHJcbiAgICAgICAgaWYgKHVzZXIuaXNBbm9ueW1vdXMoKSkge1xyXG4gICAgICAgICAgICBhcHAubmF2QmFyKCkucmlnaHRBY3Rpb24oTmF2QWN0aW9uLm1lbnVPdXQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIENvbW1lbnRlZCBsaW5lcywgdXNlZCBwcmV2aW91c2x5IGJ1dCB1bnVzZWQgbm93LCBpdCBtdXN0IGJlIGVub3VnaCB3aXRoIHRoZSB1cGRhdGVcclxuICAgIC8vIHBlciBhY3Rpdml0eSBjaGFuZ2VcclxuICAgIC8vYXBwLm1vZGVsLnVzZXIoKS5pc0Fub255bW91cy5zdWJzY3JpYmUodXBkYXRlU3RhdGVzT25Vc2VyQ2hhbmdlKTtcclxuICAgIC8vYXBwLm1vZGVsLnVzZXIoKS5vbmJvYXJkaW5nU3RlcC5zdWJzY3JpYmUodXBkYXRlU3RhdGVzT25Vc2VyQ2hhbmdlKTtcclxuICAgIFxyXG4gICAgYXBwLm5hdkJhciA9IGtvLm9ic2VydmFibGUobnVsbCk7XHJcbiAgICBcclxuICAgIHZhciByZWZyZXNoTmF2ID0gZnVuY3Rpb24gcmVmcmVzaE5hdigpIHtcclxuICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50IHRvIGZvcmNlIGEgY29tcG9uZW50IHVwZGF0ZVxyXG4gICAgICAgICQoJy5BcHBOYXYnKS50cmlnZ2VyKCdjb250ZW50Q2hhbmdlJyk7XHJcbiAgICB9O1xyXG4gICAgdmFyIGF1dG9SZWZyZXNoTmF2ID0gZnVuY3Rpb24gYXV0b1JlZnJlc2hOYXYoYWN0aW9uKSB7XHJcbiAgICAgICAgaWYgKGFjdGlvbikge1xyXG4gICAgICAgICAgICBhY3Rpb24udGV4dC5zdWJzY3JpYmUocmVmcmVzaE5hdik7XHJcbiAgICAgICAgICAgIGFjdGlvbi5pc1RpdGxlLnN1YnNjcmliZShyZWZyZXNoTmF2KTtcclxuICAgICAgICAgICAgYWN0aW9uLmljb24uc3Vic2NyaWJlKHJlZnJlc2hOYXYpO1xyXG4gICAgICAgICAgICBhY3Rpb24uaXNNZW51LnN1YnNjcmliZShyZWZyZXNoTmF2KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICAgIFVwZGF0ZSB0aGUgbmF2IG1vZGVsIHVzaW5nIHRoZSBBY3Rpdml0eSBkZWZhdWx0c1xyXG4gICAgKiovXHJcbiAgICBhcHAudXBkYXRlQXBwTmF2ID0gZnVuY3Rpb24gdXBkYXRlQXBwTmF2KGFjdGl2aXR5KSB7XHJcblxyXG4gICAgICAgIC8vIGlmIHRoZSBhY3Rpdml0eSBoYXMgaXRzIG93blxyXG4gICAgICAgIGlmICgnbmF2QmFyJyBpbiBhY3Rpdml0eSkge1xyXG4gICAgICAgICAgICAvLyBVc2Ugc3BlY2lhbGl6aWVkIGFjdGl2aXR5IGJhciBkYXRhXHJcbiAgICAgICAgICAgIGFwcC5uYXZCYXIoYWN0aXZpdHkubmF2QmFyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFVzZSBkZWZhdWx0IG9uZVxyXG4gICAgICAgICAgICBhcHAubmF2QmFyKG5ldyBOYXZCYXIoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBUT0RPIERvdWJsZSBjaGVjayBpZiBuZWVkZWQuXHJcbiAgICAgICAgLy8gTGF0ZXN0IGNoYW5nZXMsIHdoZW4gbmVlZGVkXHJcbiAgICAgICAgYWRqdXN0VXNlckJhcigpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJlZnJlc2hOYXYoKTtcclxuICAgICAgICBhdXRvUmVmcmVzaE5hdihhcHAubmF2QmFyKCkubGVmdEFjdGlvbigpKTtcclxuICAgICAgICBhdXRvUmVmcmVzaE5hdihhcHAubmF2QmFyKCkucmlnaHRBY3Rpb24oKSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIFVwZGF0ZSB0aGUgYXBwIG1lbnUgdG8gaGlnaGxpZ2h0IHRoZVxyXG4gICAgICAgIGdpdmVuIGxpbmsgbmFtZVxyXG4gICAgKiovXHJcbiAgICBhcHAudXBkYXRlTWVudSA9IGZ1bmN0aW9uIHVwZGF0ZU1lbnUobmFtZSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciAkbWVudSA9ICQoJy5BcHAtbWVudXMgLm5hdmJhci1jb2xsYXBzZScpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFJlbW92ZSBhbnkgYWN0aXZlXHJcbiAgICAgICAgJG1lbnVcclxuICAgICAgICAuZmluZCgnbGknKVxyXG4gICAgICAgIC5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgLy8gQWRkIGFjdGl2ZVxyXG4gICAgICAgICRtZW51XHJcbiAgICAgICAgLmZpbmQoJy5nby0nICsgbmFtZSlcclxuICAgICAgICAuY2xvc2VzdCgnbGknKVxyXG4gICAgICAgIC5hZGRDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgLy8gSGlkZSBtZW51XHJcbiAgICAgICAgJG1lbnVcclxuICAgICAgICAuZmlsdGVyKCc6dmlzaWJsZScpXHJcbiAgICAgICAgLmNvbGxhcHNlKCdoaWRlJyk7XHJcbiAgICB9O1xyXG59O1xyXG4iLCIvKipcclxuICAgIExpc3Qgb2YgYWN0aXZpdGllcyBsb2FkZWQgaW4gdGhlIEFwcCxcclxuICAgIGFzIGFuIG9iamVjdCB3aXRoIHRoZSBhY3Rpdml0eSBuYW1lIGFzIHRoZSBrZXlcclxuICAgIGFuZCB0aGUgY29udHJvbGxlciBhcyB2YWx1ZS5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgJ2NhbGVuZGFyJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NhbGVuZGFyJyksXHJcbiAgICAnZGF0ZXRpbWVQaWNrZXInOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvZGF0ZXRpbWVQaWNrZXInKSxcclxuICAgICdjbGllbnRzJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NsaWVudHMnKSxcclxuICAgICdzZXJ2aWNlcyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9zZXJ2aWNlcycpLFxyXG4gICAgJ2xvY2F0aW9ucyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9sb2NhdGlvbnMnKSxcclxuICAgICd0ZXh0RWRpdG9yJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL3RleHRFZGl0b3InKSxcclxuICAgICdob21lJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2hvbWUnKSxcclxuICAgICdhcHBvaW50bWVudCc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9hcHBvaW50bWVudCcpLFxyXG4gICAgJ2Jvb2tpbmdDb25maXJtYXRpb24nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvYm9va2luZ0NvbmZpcm1hdGlvbicpLFxyXG4gICAgJ2luZGV4JzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2luZGV4JyksXHJcbiAgICAnbG9naW4nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvbG9naW4nKSxcclxuICAgICdsb2dvdXQnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvbG9nb3V0JyksXHJcbiAgICAnbGVhcm5Nb3JlJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2xlYXJuTW9yZScpLFxyXG4gICAgJ3NpZ251cCc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9zaWdudXAnKSxcclxuICAgICdjb250YWN0SW5mbyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jb250YWN0SW5mbycpLFxyXG4gICAgJ29uYm9hcmRpbmdQb3NpdGlvbnMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvb25ib2FyZGluZ1Bvc2l0aW9ucycpLFxyXG4gICAgJ29uYm9hcmRpbmdIb21lJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL29uYm9hcmRpbmdIb21lJyksXHJcbiAgICAnbG9jYXRpb25FZGl0aW9uJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2xvY2F0aW9uRWRpdGlvbicpLFxyXG4gICAgJ29uYm9hcmRpbmdDb21wbGV0ZSc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9vbmJvYXJkaW5nQ29tcGxldGUnKSxcclxuICAgICdhY2NvdW50JzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2FjY291bnQnKSxcclxuICAgICdpbmJveCc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9pbmJveCcpLFxyXG4gICAgJ2NvbnZlcnNhdGlvbic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jb252ZXJzYXRpb24nKSxcclxuICAgICdzY2hlZHVsaW5nJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL3NjaGVkdWxpbmcnKSxcclxuICAgICdqb2J0aXRsZXMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvam9idGl0bGVzJyksXHJcbiAgICAnZmVlZGJhY2snOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvZmVlZGJhY2snKSxcclxuICAgICdmYXFzJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2ZhcXMnKSxcclxuICAgICdmZWVkYmFja0Zvcm0nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvZmVlZGJhY2tGb3JtJyksXHJcbiAgICAnY29udGFjdEZvcm0nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvY29udGFjdEZvcm0nKSxcclxuICAgICdjbXMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvY21zJyksXHJcbiAgICAnY2xpZW50RWRpdGlvbic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jbGllbnRFZGl0aW9uJyksXHJcbiAgICAnc2NoZWR1bGluZ1ByZWZlcmVuY2VzJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL3NjaGVkdWxpbmdQcmVmZXJlbmNlcycpLFxyXG4gICAgJ2NhbGVuZGFyU3luY2luZyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jYWxlbmRhclN5bmNpbmcnKSxcclxuICAgICd3ZWVrbHlTY2hlZHVsZSc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy93ZWVrbHlTY2hlZHVsZScpLFxyXG4gICAgJ2Jvb2tNZUJ1dHRvbic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9ib29rTWVCdXR0b24nKSxcclxuICAgICdvd25lckluZm8nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvb3duZXJJbmZvJylcclxufTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqIEdsb2JhbCBkZXBlbmRlbmNpZXMgKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS1tb2JpbGUnKTtcclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxua28uYmluZGluZ0hhbmRsZXJzLmZvcm1hdCA9IHJlcXVpcmUoJ2tvL2Zvcm1hdEJpbmRpbmcnKS5mb3JtYXRCaW5kaW5nO1xyXG52YXIgYm9vdGtub2NrID0gcmVxdWlyZSgnLi91dGlscy9ib290a25vY2tCaW5kaW5nSGVscGVycycpO1xyXG5yZXF1aXJlKCcuL3V0aWxzL0Z1bmN0aW9uLnByb3RvdHlwZS5faW5oZXJpdHMnKTtcclxucmVxdWlyZSgnLi91dGlscy9GdW5jdGlvbi5wcm90b3R5cGUuX2RlbGF5ZWQnKTtcclxuLy8gUHJvbWlzZSBwb2x5ZmlsbCwgc28gaXRzIG5vdCAncmVxdWlyZSdkIHBlciBtb2R1bGU6XHJcbnJlcXVpcmUoJ2VzNi1wcm9taXNlJykucG9seWZpbGwoKTtcclxuXHJcbnZhciBsYXlvdXRVcGRhdGVFdmVudCA9IHJlcXVpcmUoJ2xheW91dFVwZGF0ZUV2ZW50Jyk7XHJcbnZhciBOYXZCYXIgPSByZXF1aXJlKCcuL3ZpZXdtb2RlbHMvTmF2QmFyJyksXHJcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyksXHJcbiAgICBBcHBNb2RlbCA9IHJlcXVpcmUoJy4vdmlld21vZGVscy9BcHBNb2RlbCcpO1xyXG5cclxuLy8gUmVnaXN0ZXIgdGhlIHNwZWNpYWwgbG9jYWxlXHJcbnJlcXVpcmUoJy4vbG9jYWxlcy9lbi1VUy1MQycpO1xyXG5cclxuLyoqXHJcbiAgICBBIHNldCBvZiBmaXhlcy93b3JrYXJvdW5kcyBmb3IgQm9vdHN0cmFwIGJlaGF2aW9yL3BsdWdpbnNcclxuICAgIHRvIGJlIGV4ZWN1dGVkIGJlZm9yZSBCb290c3RyYXAgaXMgaW5jbHVkZWQvZXhlY3V0ZWQuXHJcbiAgICBGb3IgZXhhbXBsZSwgYmVjYXVzZSBvZiBkYXRhLWJpbmRpbmcgcmVtb3ZpbmcvY3JlYXRpbmcgZWxlbWVudHMsXHJcbiAgICBzb21lIG9sZCByZWZlcmVuY2VzIHRvIHJlbW92ZWQgaXRlbXMgbWF5IGdldCBhbGl2ZSBhbmQgbmVlZCB1cGRhdGUsXHJcbiAgICBvciByZS1lbmFibGluZyBzb21lIGJlaGF2aW9ycy5cclxuKiovXHJcbmZ1bmN0aW9uIHByZUJvb3RzdHJhcFdvcmthcm91bmRzKCkge1xyXG4gICAgLy8gSW50ZXJuYWwgQm9vdHN0cmFwIHNvdXJjZSB1dGlsaXR5XHJcbiAgICBmdW5jdGlvbiBnZXRUYXJnZXRGcm9tVHJpZ2dlcigkdHJpZ2dlcikge1xyXG4gICAgICAgIHZhciBocmVmLFxyXG4gICAgICAgICAgICB0YXJnZXQgPSAkdHJpZ2dlci5hdHRyKCdkYXRhLXRhcmdldCcpIHx8XHJcbiAgICAgICAgICAgIChocmVmID0gJHRyaWdnZXIuYXR0cignaHJlZicpKSAmJiBcclxuICAgICAgICAgICAgaHJlZi5yZXBsYWNlKC8uKig/PSNbXlxcc10rJCkvLCAnJyk7IC8vIHN0cmlwIGZvciBpZTdcclxuXHJcbiAgICAgICAgcmV0dXJuICQodGFyZ2V0KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gQnVnOiBuYXZiYXItY29sbGFwc2UgZWxlbWVudHMgaG9sZCBhIHJlZmVyZW5jZSB0byB0aGVpciBvcmlnaW5hbFxyXG4gICAgLy8gJHRyaWdnZXIsIGJ1dCB0aGF0IHRyaWdnZXIgY2FuIGNoYW5nZSBvbiBkaWZmZXJlbnQgJ2NsaWNrcycgb3JcclxuICAgIC8vIGdldCByZW1vdmVkIHRoZSBvcmlnaW5hbCwgc28gaXQgbXVzdCByZWZlcmVuY2UgdGhlIG5ldyBvbmVcclxuICAgIC8vICh0aGUgbGF0ZXN0cyBjbGlja2VkLCBhbmQgbm90IHRoZSBjYWNoZWQgb25lIHVuZGVyIHRoZSAnZGF0YScgQVBJKS4gICAgXHJcbiAgICAvLyBOT1RFOiBoYW5kbGVyIG11c3QgZXhlY3V0ZSBiZWZvcmUgdGhlIEJvb3RzdHJhcCBoYW5kbGVyIGZvciB0aGUgc2FtZVxyXG4gICAgLy8gZXZlbnQgaW4gb3JkZXIgdG8gd29yay5cclxuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljay5icy5jb2xsYXBzZS5kYXRhLWFwaS53b3JrYXJvdW5kJywgJ1tkYXRhLXRvZ2dsZT1cImNvbGxhcHNlXCJdJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyksXHJcbiAgICAgICAgICAgICR0YXJnZXQgPSBnZXRUYXJnZXRGcm9tVHJpZ2dlcigkdCksXHJcbiAgICAgICAgICAgIGRhdGEgPSAkdGFyZ2V0ICYmICR0YXJnZXQuZGF0YSgnYnMuY29sbGFwc2UnKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBJZiBhbnlcclxuICAgICAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgICAgICAvLyBSZXBsYWNlIHRoZSB0cmlnZ2VyIGluIHRoZSBkYXRhIHJlZmVyZW5jZTpcclxuICAgICAgICAgICAgZGF0YS4kdHJpZ2dlciA9ICR0O1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBPbiBlbHNlLCBub3RoaW5nIHRvIGRvLCBhIG5ldyBDb2xsYXBzZSBpbnN0YW5jZSB3aWxsIGJlIGNyZWF0ZWRcclxuICAgICAgICAvLyB3aXRoIHRoZSBjb3JyZWN0IHRhcmdldCwgdGhlIGZpcnN0IHRpbWVcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICAgIEFwcCBzdGF0aWMgY2xhc3NcclxuKiovXHJcbnZhciBhcHAgPSB7XHJcbiAgICBzaGVsbDogcmVxdWlyZSgnLi9hcHAuc2hlbGwnKSxcclxuICAgIFxyXG4gICAgLy8gTmV3IGFwcCBtb2RlbCwgdGhhdCBzdGFydHMgd2l0aCBhbm9ueW1vdXMgdXNlclxyXG4gICAgbW9kZWw6IG5ldyBBcHBNb2RlbCgpLFxyXG4gICAgXHJcbiAgICAvKiogTG9hZCBhY3Rpdml0aWVzIGNvbnRyb2xsZXJzIChub3QgaW5pdGlhbGl6ZWQpICoqL1xyXG4gICAgYWN0aXZpdGllczogcmVxdWlyZSgnLi9hcHAuYWN0aXZpdGllcycpLFxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBKdXN0IHJlZGlyZWN0IHRoZSBiZXR0ZXIgcGxhY2UgZm9yIGN1cnJlbnQgdXNlciBhbmQgc3RhdGUuXHJcbiAgICAgICAgTk9URTogSXRzIGEgZGVsYXllZCBmdW5jdGlvbiwgc2luY2Ugb24gbWFueSBjb250ZXh0cyBuZWVkIHRvXHJcbiAgICAgICAgd2FpdCBmb3IgdGhlIGN1cnJlbnQgJ3JvdXRpbmcnIGZyb20gZW5kIGJlZm9yZSBkbyB0aGUgbmV3XHJcbiAgICAgICAgaGlzdG9yeSBjaGFuZ2UuXHJcbiAgICAgICAgVE9ETzogTWF5YmUsIHJhdGhlciB0aGFuIGRlbGF5IGl0LCBjYW4gc3RvcCBjdXJyZW50IHJvdXRpbmdcclxuICAgICAgICAoY2hhbmdlcyBvbiBTaGVsbCByZXF1aXJlZCkgYW5kIHBlcmZvcm0gdGhlIG5ldy5cclxuICAgICAgICBUT0RPOiBNYXliZSBhbHRlcm5hdGl2ZSB0byBwcmV2aW91cywgdG8gcHJvdmlkZSBhICdyZXBsYWNlJ1xyXG4gICAgICAgIGluIHNoZWxsIHJhdGhlciB0aGFuIGEgZ28sIHRvIGF2b2lkIGFwcGVuZCByZWRpcmVjdCBlbnRyaWVzXHJcbiAgICAgICAgaW4gdGhlIGhpc3RvcnksIHRoYXQgY3JlYXRlIHRoZSBwcm9ibGVtIG9mICdicm9rZW4gYmFjayBidXR0b24nXHJcbiAgICAqKi9cclxuICAgIGdvRGFzaGJvYXJkOiBmdW5jdGlvbiBnb0Rhc2hib2FyZCgpIHtcclxuICAgICAgICBcclxuICAgICAgICAvLyBUbyBhdm9pZCBpbmZpbml0ZSBsb29wcyBpZiB3ZSBhbHJlYWR5IGFyZSBwZXJmb3JtaW5nIFxyXG4gICAgICAgIC8vIGEgZ29EYXNoYm9hcmQgdGFzaywgd2UgZmxhZyB0aGUgZXhlY3V0aW9uXHJcbiAgICAgICAgLy8gYmVpbmcgY2FyZSBvZiB0aGUgZGVsYXkgaW50cm9kdWNlZCBpbiB0aGUgZXhlY3V0aW9uXHJcbiAgICAgICAgaWYgKGdvRGFzaGJvYXJkLl9nb2luZyA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBEZWxheWVkIHRvIGF2b2lkIGNvbGxpc2lvbnMgd2l0aCBpbi10aGUtbWlkZGxlXHJcbiAgICAgICAgICAgIC8vIHRhc2tzOiBqdXN0IGFsbG93aW5nIGN1cnJlbnQgcm91dGluZyB0byBmaW5pc2hcclxuICAgICAgICAgICAgLy8gYmVmb3JlIHBlcmZvcm0gdGhlICdyZWRpcmVjdCdcclxuICAgICAgICAgICAgLy8gVE9ETzogY2hhbmdlIGJ5IGEgcmVhbCByZWRpcmVjdCB0aGF0IGlzIGFibGUgdG9cclxuICAgICAgICAgICAgLy8gY2FuY2VsIHRoZSBjdXJyZW50IGFwcC5zaGVsbCByb3V0aW5nIHByb2Nlc3MuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBnb0Rhc2hib2FyZC5fZ29pbmcgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBvbmJvYXJkaW5nID0gdGhpcy5tb2RlbC51c2VyKCkub25ib2FyZGluZ1N0ZXAoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAob25ib2FyZGluZykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hlbGwuZ28oJ29uYm9hcmRpbmdIb21lLycgKyBvbmJvYXJkaW5nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hlbGwuZ28oJ2hvbWUnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBKdXN0IGJlY2F1c2UgaXMgZGVsYXllZCwgbmVlZHNcclxuICAgICAgICAgICAgICAgIC8vIHRvIGJlIHNldCBvZmYgYWZ0ZXIgYW4gaW5tZWRpYXRlIHRvIFxyXG4gICAgICAgICAgICAgICAgLy8gZW5zdXJlIGlzIHNldCBvZmYgYWZ0ZXIgYW55IG90aGVyIGF0dGVtcHRcclxuICAgICAgICAgICAgICAgIC8vIHRvIGFkZCBhIGRlbGF5ZWQgZ29EYXNoYm9hcmQ6XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGdvRGFzaGJvYXJkLl9nb2luZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfSwgMSk7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqIENvbnRpbnVlIGFwcCBjcmVhdGlvbiB3aXRoIHRoaW5ncyB0aGF0IG5lZWQgYSByZWZlcmVuY2UgdG8gdGhlIGFwcCAqKi9cclxuXHJcbnJlcXVpcmUoJy4vYXBwLW5hdmJhcicpLmV4dGVuZHMoYXBwKTtcclxuXHJcbnJlcXVpcmUoJy4vYXBwLWNvbXBvbmVudHMnKS5yZWdpc3RlckFsbCgpO1xyXG5cclxuYXBwLmdldEFjdGl2aXR5ID0gZnVuY3Rpb24gZ2V0QWN0aXZpdHkobmFtZSkge1xyXG4gICAgdmFyIGFjdGl2aXR5ID0gdGhpcy5hY3Rpdml0aWVzW25hbWVdO1xyXG4gICAgaWYgKGFjdGl2aXR5KSB7XHJcbiAgICAgICAgdmFyICRhY3QgPSB0aGlzLnNoZWxsLml0ZW1zLmZpbmQobmFtZSk7XHJcbiAgICAgICAgaWYgKCRhY3QgJiYgJGFjdC5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybiBhY3Rpdml0eS5pbml0KCRhY3QsIHRoaXMpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbn07XHJcblxyXG5hcHAuZ2V0QWN0aXZpdHlDb250cm9sbGVyQnlSb3V0ZSA9IGZ1bmN0aW9uIGdldEFjdGl2aXR5Q29udHJvbGxlckJ5Um91dGUocm91dGUpIHtcclxuICAgIC8vIEZyb20gdGhlIHJvdXRlIG9iamVjdCwgdGhlIGltcG9ydGFudCBwaWVjZSBpcyByb3V0ZS5uYW1lXHJcbiAgICAvLyB0aGF0IGNvbnRhaW5zIHRoZSBhY3Rpdml0eSBuYW1lIGV4Y2VwdCBpZiBpcyB0aGUgcm9vdFxyXG4gICAgdmFyIGFjdE5hbWUgPSByb3V0ZS5uYW1lIHx8IHRoaXMuc2hlbGwuaW5kZXhOYW1lO1xyXG4gICAgXHJcbiAgICByZXR1cm4gdGhpcy5nZXRBY3Rpdml0eShhY3ROYW1lKTtcclxufTtcclxuXHJcbi8vIGFjY2Vzc0NvbnRyb2wgc2V0dXA6IGNhbm5vdCBiZSBzcGVjaWZpZWQgb24gU2hlbGwgY3JlYXRpb24gYmVjYXVzZVxyXG4vLyBkZXBlbmRzIG9uIHRoZSBhcHAgaW5zdGFuY2VcclxuYXBwLnNoZWxsLmFjY2Vzc0NvbnRyb2wgPSByZXF1aXJlKCcuL3V0aWxzL2FjY2Vzc0NvbnRyb2wnKShhcHApO1xyXG5cclxuLy8gU2hvcnRjdXQgdG8gVXNlclR5cGUgZW51bWVyYXRpb24gdXNlZCB0byBzZXQgcGVybWlzc2lvbnNcclxuYXBwLlVzZXJUeXBlID0gYXBwLm1vZGVsLnVzZXIoKS5jb25zdHJ1Y3Rvci5Vc2VyVHlwZTtcclxuXHJcbi8qKiBBcHAgSW5pdCAqKi9cclxudmFyIGFwcEluaXQgPSBmdW5jdGlvbiBhcHBJbml0KCkge1xyXG4gICAgLypqc2hpbnQgbWF4c3RhdGVtZW50czo1MCxtYXhjb21wbGV4aXR5OjE2ICovXHJcbiAgICBcclxuICAgIC8vIEVuYWJsaW5nIHRoZSAnbGF5b3V0VXBkYXRlJyBqUXVlcnkgV2luZG93IGV2ZW50IHRoYXQgaGFwcGVucyBvbiByZXNpemUgYW5kIHRyYW5zaXRpb25lbmQsXHJcbiAgICAvLyBhbmQgY2FuIGJlIHRyaWdnZXJlZCBtYW51YWxseSBieSBhbnkgc2NyaXB0IHRvIG5vdGlmeSBjaGFuZ2VzIG9uIGxheW91dCB0aGF0XHJcbiAgICAvLyBtYXkgcmVxdWlyZSBhZGp1c3RtZW50cyBvbiBvdGhlciBzY3JpcHRzIHRoYXQgbGlzdGVuIHRvIGl0LlxyXG4gICAgLy8gVGhlIGV2ZW50IGlzIHRocm90dGxlLCBndWFyYW50aW5nIHRoYXQgdGhlIG1pbm9yIGhhbmRsZXJzIGFyZSBleGVjdXRlZCByYXRoZXJcclxuICAgIC8vIHRoYW4gYSBsb3Qgb2YgdGhlbSBpbiBzaG9ydCB0aW1lIGZyYW1lcyAoYXMgaGFwcGVuIHdpdGggJ3Jlc2l6ZScgZXZlbnRzKS5cclxuICAgIGxheW91dFVwZGF0ZUV2ZW50LmxheW91dFVwZGF0ZUV2ZW50ICs9ICcgb3JpZW50YXRpb25jaGFuZ2UnO1xyXG4gICAgbGF5b3V0VXBkYXRlRXZlbnQub24oKTtcclxuICAgIFxyXG4gICAgLy8gS2V5Ym9hcmQgcGx1Z2luIGV2ZW50cyBhcmUgbm90IGNvbXBhdGlibGUgd2l0aCBqUXVlcnkgZXZlbnRzLCBidXQgbmVlZGVkIHRvXHJcbiAgICAvLyB0cmlnZ2VyIGEgbGF5b3V0VXBkYXRlLCBzbyBoZXJlIGFyZSBjb25uZWN0ZWQsIG1haW5seSBmaXhpbmcgYnVncyBvbiBpT1Mgd2hlbiB0aGUga2V5Ym9hcmRcclxuICAgIC8vIGlzIGhpZGRpbmcuXHJcbiAgICB2YXIgdHJpZ0xheW91dCA9IGZ1bmN0aW9uIHRyaWdMYXlvdXQoZXZlbnQpIHtcclxuICAgICAgICAkKHdpbmRvdykudHJpZ2dlcignbGF5b3V0VXBkYXRlJyk7XHJcbiAgICB9O1xyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ25hdGl2ZS5rZXlib2FyZHNob3cnLCB0cmlnTGF5b3V0KTtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCduYXRpdmUua2V5Ym9hcmRoaWRlJywgdHJpZ0xheW91dCk7XHJcblxyXG4gICAgLy8gaU9TLTcrIHN0YXR1cyBiYXIgZml4LiBBcHBseSBvbiBwbHVnaW4gbG9hZGVkIChjb3Jkb3ZhL3Bob25lZ2FwIGVudmlyb25tZW50KVxyXG4gICAgLy8gYW5kIGluIGFueSBzeXN0ZW0sIHNvIGFueSBvdGhlciBzeXN0ZW1zIGZpeCBpdHMgc29sdmVkIHRvbyBpZiBuZWVkZWQgXHJcbiAgICAvLyBqdXN0IHVwZGF0aW5nIHRoZSBwbHVnaW4gKGZ1dHVyZSBwcm9vZikgYW5kIGVuc3VyZSBob21vZ2VuZW91cyBjcm9zcyBwbGFmdGZvcm0gYmVoYXZpb3IuXHJcbiAgICBpZiAod2luZG93LlN0YXR1c0Jhcikge1xyXG4gICAgICAgIC8vIEZpeCBpT1MtNysgb3ZlcmxheSBwcm9ibGVtXHJcbiAgICAgICAgLy8gSXMgaW4gY29uZmlnLnhtbCB0b28sIGJ1dCBzZWVtcyBub3QgdG8gd29yayB3aXRob3V0IG5leHQgY2FsbDpcclxuICAgICAgICB3aW5kb3cuU3RhdHVzQmFyLm92ZXJsYXlzV2ViVmlldyhmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGlPc1dlYnZpZXcgPSBmYWxzZTtcclxuICAgIGlmICh3aW5kb3cuZGV2aWNlICYmIFxyXG4gICAgICAgIC9pT1N8aVBhZHxpUGhvbmV8aVBvZC9pLnRlc3Qod2luZG93LmRldmljZS5wbGF0Zm9ybSkpIHtcclxuICAgICAgICBpT3NXZWJ2aWV3ID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gTk9URTogU2FmYXJpIGlPUyBidWcgd29ya2Fyb3VuZCwgbWluLWhlaWdodC9oZWlnaHQgb24gaHRtbCBkb2Vzbid0IHdvcmsgYXMgZXhwZWN0ZWQsXHJcbiAgICAvLyBnZXR0aW5nIGJpZ2dlciB0aGFuIHZpZXdwb3J0LlxyXG4gICAgdmFyIGlPUyA9IC8oaVBhZHxpUGhvbmV8aVBvZCkvZy50ZXN0KCBuYXZpZ2F0b3IudXNlckFnZW50ICk7XHJcbiAgICBpZiAoaU9TKSB7XHJcbiAgICAgICAgdmFyIGdldEhlaWdodCA9IGZ1bmN0aW9uIGdldEhlaWdodCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5pbm5lckhlaWdodDtcclxuICAgICAgICAgICAgLy8gSW4gY2FzZSBvZiBlbmFibGUgdHJhbnNwYXJlbnQvb3ZlcmxheSBTdGF0dXNCYXI6XHJcbiAgICAgICAgICAgIC8vICh3aW5kb3cuaW5uZXJIZWlnaHQgLSAoaU9zV2VidmlldyA/IDIwIDogMCkpXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICAkKCdodG1sJykuaGVpZ2h0KGdldEhlaWdodCgpICsgJ3B4Jyk7ICAgICAgICBcclxuICAgICAgICAkKHdpbmRvdykub24oJ2xheW91dFVwZGF0ZScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAkKCdodG1sJykuaGVpZ2h0KGdldEhlaWdodCgpICsgJ3B4Jyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQmVjYXVzZSBvZiB0aGUgaU9TNys4IGJ1Z3Mgd2l0aCBoZWlnaHQgY2FsY3VsYXRpb24sXHJcbiAgICAvLyBhIGRpZmZlcmVudCB3YXkgb2YgYXBwbHkgY29udGVudCBoZWlnaHQgdG8gZmlsbCBhbGwgdGhlIGF2YWlsYWJsZSBoZWlnaHQgKGFzIG1pbmltdW0pXHJcbiAgICAvLyBpcyByZXF1aXJlZC5cclxuICAgIC8vIEZvciB0aGF0LCB0aGUgJ2Z1bGwtaGVpZ2h0JyBjbGFzcyB3YXMgYWRkZWQsIHRvIGJlIHVzZWQgaW4gZWxlbWVudHMgaW5zaWRlIHRoZSBcclxuICAgIC8vIGFjdGl2aXR5IHRoYXQgbmVlZHMgYWxsIHRoZSBhdmFpbGFibGUgaGVpZ2h0LCBoZXJlIHRoZSBjYWxjdWxhdGlvbiBpcyBhcHBsaWVkIGZvclxyXG4gICAgLy8gYWxsIHBsYXRmb3JtcyBmb3IgdGhpcyBob21vZ2VuZW91cyBhcHByb2FjaCB0byBzb2x2ZSB0aGUgcHJvYmxlbW0uXHJcbiAgICAoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyICRiID0gJCgnYm9keScpO1xyXG4gICAgICAgIHZhciBmdWxsSGVpZ2h0ID0gZnVuY3Rpb24gZnVsbEhlaWdodCgpIHtcclxuICAgICAgICAgICAgdmFyIGggPSAkYi5oZWlnaHQoKTtcclxuICAgICAgICAgICAgJCgnLmZ1bGwtaGVpZ2h0JylcclxuICAgICAgICAgICAgLy8gTGV0IGJyb3dzZXIgdG8gY29tcHV0ZVxyXG4gICAgICAgICAgICAuY3NzKCdoZWlnaHQnLCAnYXV0bycpXHJcbiAgICAgICAgICAgIC8vIEFzIG1pbmltdW1cclxuICAgICAgICAgICAgLmNzcygnbWluLWhlaWdodCcsIGgpXHJcbiAgICAgICAgICAgIC8vIFNldCBleHBsaWNpdCB0aGUgYXV0b21hdGljIGNvbXB1dGVkIGhlaWdodFxyXG4gICAgICAgICAgICAuY3NzKCdoZWlnaHQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIC8vIHdlIHVzZSBib3gtc2l6aW5nOmJvcmRlci1ib3gsIHNvIG5lZWRzIHRvIGJlIG91dGVySGVpZ2h0IHdpdGhvdXQgbWFyZ2luOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuICQodGhpcykub3V0ZXJIZWlnaHQoZmFsc2UpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICA7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBmdWxsSGVpZ2h0KCk7XHJcbiAgICAgICAgJCh3aW5kb3cpLm9uKCdsYXlvdXRVcGRhdGUnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgZnVsbEhlaWdodCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSkoKTtcclxuICAgIFxyXG4gICAgLy8gRm9yY2UgYW4gdXBkYXRlIGRlbGF5ZWQgdG8gZW5zdXJlIHVwZGF0ZSBhZnRlciBzb21lIHRoaW5ncyBkaWQgYWRkaXRpb25hbCB3b3JrXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICQod2luZG93KS50cmlnZ2VyKCdsYXlvdXRVcGRhdGUnKTtcclxuICAgIH0sIDIwMCk7XHJcbiAgICBcclxuICAgIC8vIEJvb3RzdHJhcFxyXG4gICAgcHJlQm9vdHN0cmFwV29ya2Fyb3VuZHMoKTtcclxuICAgIHJlcXVpcmUoJ2Jvb3RzdHJhcCcpO1xyXG4gICAgXHJcbiAgICAvLyBMb2FkIEtub2Nrb3V0IGJpbmRpbmcgaGVscGVyc1xyXG4gICAgYm9vdGtub2NrLnBsdWdJbihrbyk7XHJcbiAgICByZXF1aXJlKCcuL3V0aWxzL2Jvb3RzdHJhcFN3aXRjaEJpbmRpbmcnKS5wbHVnSW4oa28pO1xyXG4gICAgXHJcbiAgICAvLyBQbHVnaW5zIHNldHVwXHJcbiAgICBpZiAod2luZG93LmNvcmRvdmEgJiYgd2luZG93LmNvcmRvdmEucGx1Z2lucyAmJiB3aW5kb3cuY29yZG92YS5wbHVnaW5zLktleWJvYXJkKSB7XHJcbiAgICAgICAgd2luZG93LmNvcmRvdmEucGx1Z2lucy5LZXlib2FyZC5kaXNhYmxlU2Nyb2xsKHRydWUpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBFYXN5IGxpbmtzIHRvIHNoZWxsIGFjdGlvbnMsIGxpa2UgZ29CYWNrLCBpbiBodG1sIGVsZW1lbnRzXHJcbiAgICAvLyBFeGFtcGxlOiA8YnV0dG9uIGRhdGEtc2hlbGw9XCJnb0JhY2sgMlwiPkdvIDIgdGltZXMgYmFjazwvYnV0dG9uPlxyXG4gICAgLy8gTk9URTogSW1wb3J0YW50LCByZWdpc3RlcmVkIGJlZm9yZSB0aGUgc2hlbGwucnVuIHRvIGJlIGV4ZWN1dGVkXHJcbiAgICAvLyBiZWZvcmUgaXRzICdjYXRjaCBhbGwgbGlua3MnIGhhbmRsZXJcclxuICAgICQoZG9jdW1lbnQpLm9uKCd0YXAnLCAnW2RhdGEtc2hlbGxdJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIC8vIFVzaW5nIGF0dHIgcmF0aGVyIHRoYW4gdGhlICdkYXRhJyBBUEkgdG8gZ2V0IHVwZGF0ZWRcclxuICAgICAgICAvLyBET00gdmFsdWVzXHJcbiAgICAgICAgdmFyIGNtZGxpbmUgPSAkKHRoaXMpLmF0dHIoJ2RhdGEtc2hlbGwnKSB8fCAnJyxcclxuICAgICAgICAgICAgYXJncyA9IGNtZGxpbmUuc3BsaXQoJyAnKSxcclxuICAgICAgICAgICAgY21kID0gYXJnc1swXTtcclxuXHJcbiAgICAgICAgaWYgKGNtZCAmJiB0eXBlb2YoYXBwLnNoZWxsW2NtZF0pID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIGFwcC5zaGVsbFtjbWRdLmFwcGx5KGFwcC5zaGVsbCwgYXJncy5zbGljZSgxKSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBDYW5jZWwgYW55IG90aGVyIGFjdGlvbiBvbiB0aGUgbGluaywgdG8gYXZvaWQgZG91YmxlIGxpbmtpbmcgcmVzdWx0c1xyXG4gICAgICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIE9uIENvcmRvdmEvUGhvbmVnYXAgYXBwLCBzcGVjaWFsIHRhcmdldHMgbXVzdCBiZSBjYWxsZWQgdXNpbmcgdGhlIHdpbmRvdy5vcGVuXHJcbiAgICAvLyBBUEkgdG8gZW5zdXJlIGlzIGNvcnJlY3RseSBvcGVuZWQgb24gdGhlIEluQXBwQnJvd3NlciAoX2JsYW5rKSBvciBzeXN0ZW0gZGVmYXVsdFxyXG4gICAgLy8gYnJvd3NlciAoX3N5c3RlbSkuXHJcbiAgICBpZiAod2luZG93LmNvcmRvdmEpIHtcclxuICAgICAgICAkKGRvY3VtZW50KS5vbigndGFwJywgJ1t0YXJnZXQ9XCJfYmxhbmtcIl0sIFt0YXJnZXQ9XCJfc3lzdGVtXCJdJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICB3aW5kb3cub3Blbih0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpLCB0aGlzLmdldEF0dHJpYnV0ZSgndGFyZ2V0JykpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFdoZW4gYW4gYWN0aXZpdHkgaXMgcmVhZHkgaW4gdGhlIFNoZWxsOlxyXG4gICAgYXBwLnNoZWxsLm9uKGFwcC5zaGVsbC5ldmVudHMuaXRlbVJlYWR5LCBmdW5jdGlvbigkYWN0LCBzdGF0ZSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIENvbm5lY3QgdGhlICdhY3Rpdml0aWVzJyBjb250cm9sbGVycyB0byB0aGVpciB2aWV3c1xyXG4gICAgICAgIC8vIEdldCBpbml0aWFsaXplZCBhY3Rpdml0eSBmb3IgdGhlIERPTSBlbGVtZW50XHJcbiAgICAgICAgdmFyIGFjdE5hbWUgPSAkYWN0LmRhdGEoJ2FjdGl2aXR5Jyk7XHJcbiAgICAgICAgdmFyIGFjdGl2aXR5ID0gYXBwLmdldEFjdGl2aXR5KGFjdE5hbWUpO1xyXG4gICAgICAgIC8vIFRyaWdnZXIgdGhlICdzaG93JyBsb2dpYyBvZiB0aGUgYWN0aXZpdHkgY29udHJvbGxlcjpcclxuICAgICAgICBhY3Rpdml0eS5zaG93KHN0YXRlKTtcclxuXHJcbiAgICAgICAgLy8gVXBkYXRlIG1lbnVcclxuICAgICAgICB2YXIgbWVudUl0ZW0gPSBhY3Rpdml0eS5tZW51SXRlbSB8fCBhY3ROYW1lO1xyXG4gICAgICAgIGFwcC51cGRhdGVNZW51KG1lbnVJdGVtKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBVcGRhdGUgYXBwIG5hdmlnYXRpb25cclxuICAgICAgICBhcHAudXBkYXRlQXBwTmF2KGFjdGl2aXR5KTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBTZXQgbW9kZWwgZm9yIHRoZSBBcHBOYXZcclxuICAgIGtvLmFwcGx5QmluZGluZ3Moe1xyXG4gICAgICAgIG5hdkJhcjogYXBwLm5hdkJhclxyXG4gICAgfSwgJCgnLkFwcE5hdicpLmdldCgwKSk7XHJcbiAgICBcclxuICAgIHZhciBTbWFydE5hdkJhciA9IHJlcXVpcmUoJy4vY29tcG9uZW50cy9TbWFydE5hdkJhcicpO1xyXG4gICAgdmFyIG5hdkJhcnMgPSBTbWFydE5hdkJhci5nZXRBbGwoKTtcclxuICAgIC8vIENyZWF0ZXMgYW4gZXZlbnQgYnkgbGlzdGVuaW5nIHRvIGl0LCBzbyBvdGhlciBzY3JpcHRzIGNhbiB0cmlnZ2VyXHJcbiAgICAvLyBhICdjb250ZW50Q2hhbmdlJyBldmVudCB0byBmb3JjZSBhIHJlZnJlc2ggb2YgdGhlIG5hdmJhciAodG8gXHJcbiAgICAvLyBjYWxjdWxhdGUgYW5kIGFwcGx5IGEgbmV3IHNpemUpOyBleHBlY3RlZCBmcm9tIGR5bmFtaWMgbmF2YmFyc1xyXG4gICAgLy8gdGhhdCBjaGFuZ2UgaXQgY29udGVudCBiYXNlZCBvbiBvYnNlcnZhYmxlcy5cclxuICAgIG5hdkJhcnMuZm9yRWFjaChmdW5jdGlvbihuYXZiYXIpIHtcclxuICAgICAgICAkKG5hdmJhci5lbCkub24oJ2NvbnRlbnRDaGFuZ2UnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgbmF2YmFyLnJlZnJlc2goKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBMaXN0ZW4gZm9yIG1lbnUgZXZlbnRzIChjb2xsYXBzZSBpbiBTbWFydE5hdkJhcilcclxuICAgIC8vIHRvIGFwcGx5IHRoZSBiYWNrZHJvcFxyXG4gICAgdmFyIHRvZ2dsaW5nQmFja2Ryb3AgPSBmYWxzZTtcclxuICAgICQoZG9jdW1lbnQpLm9uKCdzaG93LmJzLmNvbGxhcHNlIGhpZGUuYnMuY29sbGFwc2UnLCAnLkFwcE5hdiAubmF2YmFyLWNvbGxhcHNlJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGlmICghdG9nZ2xpbmdCYWNrZHJvcCkge1xyXG4gICAgICAgICAgICB0b2dnbGluZ0JhY2tkcm9wID0gdHJ1ZTtcclxuICAgICAgICAgICAgdmFyIGVuYWJsZWQgPSBlLnR5cGUgPT09ICdzaG93JztcclxuICAgICAgICAgICAgJCgnYm9keScpLnRvZ2dsZUNsYXNzKCd1c2UtYmFja2Ryb3AnLCBlbmFibGVkKTtcclxuICAgICAgICAgICAgLy8gSGlkZSBhbnkgb3RoZXIgb3BlbmVkIGNvbGxhcHNlXHJcbiAgICAgICAgICAgICQoJy5jb2xsYXBzaW5nLCAuY29sbGFwc2UuaW4nKS5jb2xsYXBzZSgnaGlkZScpO1xyXG4gICAgICAgICAgICB0b2dnbGluZ0JhY2tkcm9wID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQXBwIGluaXQ6XHJcbiAgICB2YXIgYWxlcnRFcnJvciA9IGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgIHdpbmRvdy5hbGVydCgnVGhlcmUgd2FzIGFuIGVycm9yIGxvYWRpbmc6ICcgKyBlcnIgJiYgZXJyLm1lc3NhZ2UgfHwgZXJyKTtcclxuICAgIH07XHJcblxyXG4gICAgYXBwLm1vZGVsLmluaXQoKVxyXG4gICAgLnRoZW4oYXBwLnNoZWxsLnJ1bi5iaW5kKGFwcC5zaGVsbCksIGFsZXJ0RXJyb3IpXHJcbiAgICAudGhlbihmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBNYXJrIHRoZSBwYWdlIGFzIHJlYWR5XHJcbiAgICAgICAgJCgnaHRtbCcpLmFkZENsYXNzKCdpcy1yZWFkeScpO1xyXG4gICAgICAgIC8vIEFzIGFwcCwgaGlkZXMgc3BsYXNoIHNjcmVlblxyXG4gICAgICAgIGlmICh3aW5kb3cubmF2aWdhdG9yICYmIHdpbmRvdy5uYXZpZ2F0b3Iuc3BsYXNoc2NyZWVuKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5uYXZpZ2F0b3Iuc3BsYXNoc2NyZWVuLmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9LCBhbGVydEVycm9yKTtcclxuXHJcbiAgICAvLyBERUJVR1xyXG4gICAgd2luZG93LmFwcCA9IGFwcDtcclxufTtcclxuXHJcbi8vIEFwcCBpbml0IG9uIHBhZ2UgcmVhZHkgYW5kIHBob25lZ2FwIHJlYWR5XHJcbmlmICh3aW5kb3cuY29yZG92YSkge1xyXG4gICAgLy8gT24gRE9NLVJlYWR5IGZpcnN0XHJcbiAgICAkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIFBhZ2UgaXMgcmVhZHksIGRldmljZSBpcyB0b28/XHJcbiAgICAgICAgLy8gTm90ZTogQ29yZG92YSBlbnN1cmVzIHRvIGNhbGwgdGhlIGhhbmRsZXIgZXZlbiBpZiB0aGVcclxuICAgICAgICAvLyBldmVudCB3YXMgYWxyZWFkeSBmaXJlZCwgc28gaXMgZ29vZCB0byBkbyBpdCBpbnNpZGVcclxuICAgICAgICAvLyB0aGUgZG9tLXJlYWR5IGFuZCB3ZSBhcmUgZW5zdXJpbmcgdGhhdCBldmVyeXRoaW5nIGlzXHJcbiAgICAgICAgLy8gcmVhZHkuXHJcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2RldmljZXJlYWR5JywgYXBwSW5pdCk7XHJcbiAgICB9KTtcclxufSBlbHNlIHtcclxuICAgIC8vIE9ubHkgb24gRE9NLVJlYWR5LCBmb3IgaW4gYnJvd3NlciBkZXZlbG9wbWVudFxyXG4gICAgJChhcHBJbml0KTtcclxufSIsIi8qKlxyXG4gICAgU2V0dXAgb2YgdGhlIHNoZWxsIG9iamVjdCB1c2VkIGJ5IHRoZSBhcHBcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBiYXNlVXJsID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xyXG5cclxuLy92YXIgSGlzdG9yeSA9IHJlcXVpcmUoJy4vYXBwLXNoZWxsLWhpc3RvcnknKS5jcmVhdGUoYmFzZVVybCk7XHJcbnZhciBIaXN0b3J5ID0gcmVxdWlyZSgnLi91dGlscy9zaGVsbC9oYXNoYmFuZ0hpc3RvcnknKTtcclxuXHJcbi8vIFNoZWxsIGRlcGVuZGVuY2llc1xyXG52YXIgc2hlbGwgPSByZXF1aXJlKCcuL3V0aWxzL3NoZWxsL2luZGV4JyksXHJcbiAgICBTaGVsbCA9IHNoZWxsLlNoZWxsLFxyXG4gICAgRG9tSXRlbXNNYW5hZ2VyID0gc2hlbGwuRG9tSXRlbXNNYW5hZ2VyO1xyXG5cclxudmFyIGlPUyA9IC8oaVBhZHxpUGhvbmV8aVBvZCkvZy50ZXN0KCBuYXZpZ2F0b3IudXNlckFnZW50ICk7XHJcblxyXG4vLyBDcmVhdGluZyB0aGUgc2hlbGw6XHJcbnZhciBzaGVsbCA9IG5ldyBTaGVsbCh7XHJcblxyXG4gICAgLy8gU2VsZWN0b3IsIERPTSBlbGVtZW50IG9yIGpRdWVyeSBvYmplY3QgcG9pbnRpbmdcclxuICAgIC8vIHRoZSByb290IG9yIGNvbnRhaW5lciBmb3IgdGhlIHNoZWxsIGl0ZW1zXHJcbiAgICByb290OiAnYm9keScsXHJcblxyXG4gICAgLy8gSWYgaXMgbm90IGluIHRoZSBzaXRlIHJvb3QsIHRoZSBiYXNlIFVSTCBpcyByZXF1aXJlZDpcclxuICAgIGJhc2VVcmw6IGJhc2VVcmwsXHJcbiAgICBcclxuICAgIGZvcmNlSGFzaGJhbmc6IHRydWUsXHJcblxyXG4gICAgaW5kZXhOYW1lOiAnaW5kZXgnLFxyXG5cclxuICAgIC8vIFdPUktBUk9VTkQ6IFVzaW5nIHRoZSAndGFwJyBldmVudCBmb3IgZmFzdGVyIG1vYmlsZSBleHBlcmllbmNlXHJcbiAgICAvLyAoZnJvbSBqcXVlcnktbW9iaWxlIGV2ZW50KSBvbiBpT1MgZGV2aWNlcywgYnV0IGxlZnRcclxuICAgIC8vICdjbGljaycgb24gb3RoZXJzIHNpbmNlIHRoZXkgaGFzIG5vdCB0aGUgc2xvdy1jbGljayBwcm9ibGVtXHJcbiAgICAvLyB0aGFua3MgdG8gdGhlIG1ldGEtdmlld3BvcnQuXHJcbiAgICAvLyBXT1JLQVJPVU5EOiBJTVBPUlRBTlQsIHVzaW5nICdjbGljaycgcmF0aGVyIHRoYW4gJ3RhcCcgb24gQW5kcm9pZFxyXG4gICAgLy8gcHJldmVudHMgYW4gYXBwIGNyYXNoIChvciBnbyBvdXQgYW5kIHBhZ2Ugbm90IGZvdW5kIG9uIENocm9tZSBmb3IgQW5kcm9pZClcclxuICAgIC8vIGJlY2F1c2Ugb2Ygc29tZSAnY2xpY2tzJyBoYXBwZW5pbmcgb25cclxuICAgIC8vIGEgaGFsZi1saW5rLWVsZW1lbnQgdGFwLCB3aGVyZSB0aGUgJ3RhcCcgZXZlbnQgZGV0ZWN0cyBhcyB0YXJnZXQgdGhlIG5vbi1saW5rIGFuZCB0aGVcclxuICAgIC8vIGxpbmsgZ2V0cyBleGVjdXRlZCBhbnl3YXkgYnkgdGhlIGJyb3dzZXIsIG5vdCBjYXRjaGVkIHNvIFdlYnZpZXcgbW92ZXMgdG8gXHJcbiAgICAvLyBhIG5vbiBleGlzdGFudCBmaWxlIChhbmQgdGhhdHMgbWFrZSBQaG9uZUdhcCB0byBjcmFzaCkuXHJcbiAgICBsaW5rRXZlbnQ6IGlPUyA/ICd0YXAnIDogJ2NsaWNrJyxcclxuXHJcbiAgICAvLyBObyBuZWVkIGZvciBsb2FkZXIsIGV2ZXJ5dGhpbmcgY29tZXMgYnVuZGxlZFxyXG4gICAgbG9hZGVyOiBudWxsLFxyXG5cclxuICAgIC8vIEhpc3RvcnkgUG9seWZpbGw6XHJcbiAgICBoaXN0b3J5OiBIaXN0b3J5LFxyXG5cclxuICAgIC8vIEEgRG9tSXRlbXNNYW5hZ2VyIG9yIGVxdWl2YWxlbnQgb2JqZWN0IGluc3RhbmNlIG5lZWRzIHRvXHJcbiAgICAvLyBiZSBwcm92aWRlZDpcclxuICAgIGRvbUl0ZW1zTWFuYWdlcjogbmV3IERvbUl0ZW1zTWFuYWdlcih7XHJcbiAgICAgICAgaWRBdHRyaWJ1dGVOYW1lOiAnZGF0YS1hY3Rpdml0eSdcclxuICAgIH0pXHJcbn0pO1xyXG5cclxuLy8gQ2F0Y2ggZXJyb3JzIG9uIGl0ZW0vcGFnZSBsb2FkaW5nLCBzaG93aW5nLi5cclxuc2hlbGwub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyKSB7XHJcbiAgICBcclxuICAgIHZhciBzdHIgPSAnVW5rbm93IGVycm9yJztcclxuICAgIGlmIChlcnIpIHtcclxuICAgICAgICBpZiAodHlwZW9mKGVycikgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHN0ciA9IGVycjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoZXJyLm1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgc3RyID0gZXJyLm1lc3NhZ2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBzdHIgPSBKU09OLnN0cmluZ2lmeShlcnIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBUT0RPIGNoYW5nZSB3aXRoIGEgZGlhbG9nIG9yIHNvbWV0aGluZ1xyXG4gICAgd2luZG93LmFsZXJ0KHN0cik7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzaGVsbDtcclxuIiwiLyoqXHJcbiAgICBBY3Rpdml0eSBiYXNlIGNsYXNzXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKSxcclxuICAgIE5hdkJhciA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QmFyJyk7XHJcblxyXG5yZXF1aXJlKCcuLi91dGlscy9GdW5jdGlvbi5wcm90b3R5cGUuX2luaGVyaXRzJyk7XHJcblxyXG4vKipcclxuICAgIEFjdGl2aXR5IGNsYXNzIGRlZmluaXRpb25cclxuKiovXHJcbmZ1bmN0aW9uIEFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuXHJcbiAgICAvLyBEZWZhdWx0IGFjY2VzcyBsZXZlbDogYW55b25lXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLk5vbmU7XHJcbiAgICBcclxuICAgIC8vIFRPRE86IEZ1dHVyZSB1c2Ugb2YgYSB2aWV3U3RhdGUsIHBsYWluIG9iamVjdCByZXByZXNlbnRhdGlvblxyXG4gICAgLy8gb2YgcGFydCBvZiB0aGUgdmlld01vZGVsIHRvIGJlIHVzZWQgYXMgdGhlIHN0YXRlIHBhc3NlZCB0byB0aGVcclxuICAgIC8vIGhpc3RvcnkgYW5kIGJldHdlZW4gYWN0aXZpdGllcyBjYWxscy5cclxuICAgIHRoaXMudmlld1N0YXRlID0ge307XHJcbiAgICBcclxuICAgIC8vIE9iamVjdCB0byBob2xkIHRoZSBvcHRpb25zIHBhc3NlZCBvbiAnc2hvdycgYXMgYSByZXN1bHRcclxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcclxuICAgIHRoaXMucmVxdWVzdERhdGEgPSBudWxsO1xyXG5cclxuICAgIC8vIERlZmF1bHQgbmF2QmFyIG9iamVjdC5cclxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XHJcbiAgICAgICAgdGl0bGU6IG51bGwsIC8vIG51bGwgZm9yIGxvZ29cclxuICAgICAgICBsZWZ0QWN0aW9uOiBudWxsLFxyXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBudWxsXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gRGVsYXllZCBiaW5kaW5ncyB0byBhbGxvdyBmb3IgZnVydGhlciBjb25zdHJ1Y3RvciBzZXQtdXAgXHJcbiAgICAvLyBvbiBzdWJjbGFzc2VzLlxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiBBY3Rpdml0eUNvbnN0cnVjdG9yRGVsYXllZCgpIHtcclxuICAgICAgICAvLyBBIHZpZXcgbW9kZWwgYW5kIGJpbmRpbmdzIGJlaW5nIGFwcGxpZWQgaXMgZXZlciByZXF1aXJlZFxyXG4gICAgICAgIC8vIGV2ZW4gb24gQWN0aXZpdGllcyB3aXRob3V0IG5lZWQgZm9yIGEgdmlldyBtb2RlbCwgc2luY2VcclxuICAgICAgICAvLyB0aGUgdXNlIG9mIGNvbXBvbmVudHMgYW5kIHRlbXBsYXRlcywgb3IgYW55IG90aGVyIGRhdGEtYmluZFxyXG4gICAgICAgIC8vIHN5bnRheCwgcmVxdWlyZXMgdG8gYmUgaW4gYSBjb250ZXh0IHdpdGggYmluZGluZyBlbmFibGVkOlxyXG4gICAgICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy52aWV3TW9kZWwgfHwge30sICRhY3Rpdml0eS5nZXQoMCkpO1xyXG4gICAgfS5iaW5kKHRoaXMpLCAxKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBY3Rpdml0eTtcclxuXHJcbi8qKlxyXG4gICAgU2V0LXVwIHZpc3VhbGl6YXRpb24gb2YgdGhlIHZpZXcgd2l0aCB0aGUgZ2l2ZW4gb3B0aW9ucy9zdGF0ZSxcclxuICAgIHdpdGggYSByZXNldCBvZiBjdXJyZW50IHN0YXRlLlxyXG4gICAgTXVzdCBiZSBleGVjdXRlZCBldmVyeSB0aW1lIHRoZSBhY3Rpdml0eSBpcyBwdXQgaW4gdGhlIGN1cnJlbnQgdmlldy5cclxuKiovXHJcbkFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcbiAgICAvLyBUT0RPOiBtdXN0IGtlZXAgdmlld1N0YXRlIHVwIHRvIGRhdGUgdXNpbmcgb3B0aW9ucy9zdGF0ZS5cclxuICAgIFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICB0aGlzLnJlcXVlc3REYXRhID0gb3B0aW9ucztcclxufTtcclxuXHJcbi8qKlxyXG4gICAgU3RhdGljIHV0aWxpdGllc1xyXG4qKi9cclxuLy8gRm9yIGNvbW1vZGl0eSwgY29tbW9uIGNsYXNzZXMgYXJlIGV4cG9zZWQgYXMgc3RhdGljIHByb3BlcnRpZXNcclxuQWN0aXZpdHkuTmF2QmFyID0gTmF2QmFyO1xyXG5BY3Rpdml0eS5OYXZBY3Rpb24gPSBOYXZBY3Rpb247XHJcblxyXG4vLyBRdWljayBjcmVhdGlvbiBvZiBjb21tb24gdHlwZXMgb2YgTmF2QmFyXHJcbkFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIgPSBmdW5jdGlvbiBjcmVhdGVTZWN0aW9uTmF2QmFyKHRpdGxlKSB7XHJcbiAgICByZXR1cm4gbmV3IE5hdkJhcih7XHJcbiAgICAgICAgdGl0bGU6IHRpdGxlLFxyXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5tZW51TmV3SXRlbSxcclxuICAgICAgICByaWdodEFjdGlvbjogTmF2QWN0aW9uLm1lbnVJblxyXG4gICAgfSk7XHJcbn07XHJcblxyXG5BY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyID0gZnVuY3Rpb24gY3JlYXRlU3Vic2VjdGlvbk5hdkJhcih0aXRsZSwgb3B0aW9ucykge1xyXG4gICAgXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIFxyXG4gICAgdmFyIGdvQmFja09wdGlvbnMgPSB7XHJcbiAgICAgICAgdGV4dDogdGl0bGUsXHJcbiAgICAgICAgaXNUaXRsZTogdHJ1ZVxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5iYWNrTGluaykge1xyXG4gICAgICAgIGdvQmFja09wdGlvbnMubGluayA9IG9wdGlvbnMuYmFja0xpbms7XHJcbiAgICAgICAgZ29CYWNrT3B0aW9ucy5pc1NoZWxsID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBOYXZCYXIoe1xyXG4gICAgICAgIHRpdGxlOiAnJywgLy8gTm8gdGl0bGVcclxuICAgICAgICBsZWZ0QWN0aW9uOiBOYXZBY3Rpb24uZ29CYWNrLm1vZGVsLmNsb25lKGdvQmFja09wdGlvbnMpLFxyXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBvcHRpb25zLmhlbHBJZCA/XHJcbiAgICAgICAgICAgIE5hdkFjdGlvbi5nb0hlbHBJbmRleC5tb2RlbC5jbG9uZSh7XHJcbiAgICAgICAgICAgICAgICBsaW5rOiAnIycgKyBvcHRpb25zLmhlbHBJZFxyXG4gICAgICAgICAgICB9KSA6XHJcbiAgICAgICAgICAgIE5hdkFjdGlvbi5nb0hlbHBJbmRleFxyXG4gICAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIFNpbmdsZXRvbiBoZWxwZXJcclxuKiovXHJcbnZhciBjcmVhdGVTaW5nbGV0b24gPSBmdW5jdGlvbiBjcmVhdGVTaW5nbGV0b24oQWN0aXZpdHlDbGFzcywgJGFjdGl2aXR5LCBhcHApIHtcclxuICAgIFxyXG4gICAgY3JlYXRlU2luZ2xldG9uLmluc3RhbmNlcyA9IGNyZWF0ZVNpbmdsZXRvbi5pbnN0YW5jZXMgfHwge307XHJcbiAgICBcclxuICAgIGlmIChjcmVhdGVTaW5nbGV0b24uaW5zdGFuY2VzW0FjdGl2aXR5Q2xhc3MubmFtZV0gaW5zdGFuY2VvZiBBY3Rpdml0eUNsYXNzKSB7XHJcbiAgICAgICAgcmV0dXJuIGNyZWF0ZVNpbmdsZXRvbi5pbnN0YW5jZXNbQWN0aXZpdHlDbGFzcy5uYW1lXTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHZhciBzID0gbmV3IEFjdGl2aXR5Q2xhc3MoJGFjdGl2aXR5LCBhcHApO1xyXG4gICAgICAgIGNyZWF0ZVNpbmdsZXRvbi5pbnN0YW5jZXNbQWN0aXZpdHlDbGFzcy5uYW1lXSA9IHM7XHJcbiAgICAgICAgcmV0dXJuIHM7XHJcbiAgICB9XHJcbn07XHJcbi8vIEV4YW1wbGUgb2YgdXNlXHJcbi8vZXhwb3J0cy5pbml0ID0gY3JlYXRlU2luZ2xldG9uLmJpbmQobnVsbCwgQWN0aXZpdHlDbGFzcyk7XHJcblxyXG4vKipcclxuICAgIFN0YXRpYyBtZXRob2QgZXh0ZW5kcyB0byBoZWxwIGluaGVyaXRhbmNlLlxyXG4gICAgQWRkaXRpb25hbGx5LCBpdCBhZGRzIGEgc3RhdGljIGluaXQgbWV0aG9kIHJlYWR5IGZvciB0aGUgbmV3IGNsYXNzXHJcbiAgICB0aGF0IGdlbmVyYXRlcy9yZXRyaWV2ZXMgdGhlIHNpbmdsZXRvbi5cclxuKiovXHJcbkFjdGl2aXR5LmV4dGVuZHMgPSBmdW5jdGlvbiBleHRlbmRzQWN0aXZpdHkoQ2xhc3NGbikge1xyXG4gICAgXHJcbiAgICBDbGFzc0ZuLl9pbmhlcml0cyhBY3Rpdml0eSk7XHJcbiAgICBcclxuICAgIENsYXNzRm4uaW5pdCA9IGNyZWF0ZVNpbmdsZXRvbi5iaW5kKG51bGwsIENsYXNzRm4pO1xyXG4gICAgXHJcbiAgICByZXR1cm4gQ2xhc3NGbjtcclxufTtcclxuIiwiLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAqIERhdGVQaWNrZXIgSlMgQ29tcG9uZW50LCB3aXRoIHNldmVyYWxcclxuICogbW9kZXMgYW5kIG9wdGlvbmFsIGlubGluZS1wZXJtYW5lbnQgdmlzdWFsaXphdGlvbi5cclxuICpcclxuICogQ29weXJpZ2h0IDIwMTQgTG9jb25vbWljcyBDb29wLlxyXG4gKlxyXG4gKiBCYXNlZCBvbjpcclxuICogYm9vdHN0cmFwLWRhdGVwaWNrZXIuanMgXHJcbiAqIGh0dHA6Ly93d3cuZXllY29uLnJvL2Jvb3RzdHJhcC1kYXRlcGlja2VyXHJcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gKiBDb3B5cmlnaHQgMjAxMiBTdGVmYW4gUGV0cmVcclxuICpcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcclxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxyXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcclxuICpcclxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXHJcbiAqXHJcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcclxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxyXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cclxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxyXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cclxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpOyBcclxuXHJcbnZhciBjbGFzc2VzID0ge1xyXG4gICAgY29tcG9uZW50OiAnRGF0ZVBpY2tlcicsXHJcbiAgICBtb250aHM6ICdEYXRlUGlja2VyLW1vbnRocycsXHJcbiAgICBkYXlzOiAnRGF0ZVBpY2tlci1kYXlzJyxcclxuICAgIG1vbnRoRGF5OiAnZGF5JyxcclxuICAgIG1vbnRoOiAnbW9udGgnLFxyXG4gICAgeWVhcjogJ3llYXInLFxyXG4gICAgeWVhcnM6ICdEYXRlUGlja2VyLXllYXJzJ1xyXG59O1xyXG5cclxuLy8gUGlja2VyIG9iamVjdFxyXG52YXIgRGF0ZVBpY2tlciA9IGZ1bmN0aW9uKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIC8qanNoaW50IG1heHN0YXRlbWVudHM6MzIsbWF4Y29tcGxleGl0eToyNCovXHJcbiAgICB0aGlzLmVsZW1lbnQgPSAkKGVsZW1lbnQpO1xyXG4gICAgdGhpcy5mb3JtYXQgPSBEUEdsb2JhbC5wYXJzZUZvcm1hdChvcHRpb25zLmZvcm1hdHx8dGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtZm9ybWF0Jyl8fCdtbS9kZC95eXl5Jyk7XHJcbiAgICBcclxuICAgIHRoaXMuaXNJbnB1dCA9IHRoaXMuZWxlbWVudC5pcygnaW5wdXQnKTtcclxuICAgIHRoaXMuY29tcG9uZW50ID0gdGhpcy5lbGVtZW50LmlzKCcuZGF0ZScpID8gdGhpcy5lbGVtZW50LmZpbmQoJy5hZGQtb24nKSA6IGZhbHNlO1xyXG4gICAgdGhpcy5pc1BsYWNlaG9sZGVyID0gdGhpcy5lbGVtZW50LmlzKCcuY2FsZW5kYXItcGxhY2Vob2xkZXInKTtcclxuICAgIFxyXG4gICAgdGhpcy5waWNrZXIgPSAkKERQR2xvYmFsLnRlbXBsYXRlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kVG8odGhpcy5pc1BsYWNlaG9sZGVyID8gdGhpcy5lbGVtZW50IDogJ2JvZHknKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAub24oJ2NsaWNrIHRhcCcsICQucHJveHkodGhpcy5jbGljaywgdGhpcykpO1xyXG4gICAgLy8gVE9ETzogdG8gcmV2aWV3IGlmICdjb250YWluZXInIGNsYXNzIGNhbiBiZSBhdm9pZGVkLCBzbyBpbiBwbGFjZWhvbGRlciBtb2RlIGdldHMgb3B0aW9uYWxcclxuICAgIC8vIGlmIGlzIHdhbnRlZCBjYW4gYmUgcGxhY2VkIG9uIHRoZSBwbGFjZWhvbGRlciBlbGVtZW50IChvciBjb250YWluZXItZmx1aWQgb3Igbm90aGluZylcclxuICAgIHRoaXMucGlja2VyLmFkZENsYXNzKHRoaXMuaXNQbGFjZWhvbGRlciA/ICdjb250YWluZXInIDogJ2Ryb3Bkb3duLW1lbnUnKTtcclxuICAgIFxyXG4gICAgaWYgKHRoaXMuaXNQbGFjZWhvbGRlcikge1xyXG4gICAgICAgIHRoaXMucGlja2VyLnNob3coKTtcclxuICAgICAgICBpZiAodGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUnKSA9PSAndG9kYXknKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcclxuICAgICAgICAgICAgdHlwZTogJ3Nob3cnLFxyXG4gICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGVcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHRoaXMuaXNJbnB1dCkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5vbih7XHJcbiAgICAgICAgICAgIGZvY3VzOiAkLnByb3h5KHRoaXMuc2hvdywgdGhpcyksXHJcbiAgICAgICAgICAgIC8vYmx1cjogJC5wcm94eSh0aGlzLmhpZGUsIHRoaXMpLFxyXG4gICAgICAgICAgICBrZXl1cDogJC5wcm94eSh0aGlzLnVwZGF0ZSwgdGhpcylcclxuICAgICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKHRoaXMuY29tcG9uZW50KXtcclxuICAgICAgICAgICAgdGhpcy5jb21wb25lbnQub24oJ2NsaWNrIHRhcCcsICQucHJveHkodGhpcy5zaG93LCB0aGlzKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lm9uKCdjbGljayB0YXAnLCAkLnByb3h5KHRoaXMuc2hvdywgdGhpcykpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLyogVG91Y2ggZXZlbnRzIHRvIHN3aXBlIGRhdGVzICovXHJcbiAgICB0aGlzLmVsZW1lbnRcclxuICAgIC5vbignc3dpcGVsZWZ0JywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB0aGlzLm1vdmVEYXRlKCduZXh0Jyk7XHJcbiAgICB9LmJpbmQodGhpcykpXHJcbiAgICAub24oJ3N3aXBlcmlnaHQnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHRoaXMubW92ZURhdGUoJ3ByZXYnKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgLyogU2V0LXVwIHZpZXcgbW9kZSAqL1xyXG4gICAgdGhpcy5taW5WaWV3TW9kZSA9IG9wdGlvbnMubWluVmlld01vZGV8fHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLW1pbnZpZXdtb2RlJyl8fDA7XHJcbiAgICBpZiAodHlwZW9mIHRoaXMubWluVmlld01vZGUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgc3dpdGNoICh0aGlzLm1pblZpZXdNb2RlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ21vbnRocyc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pblZpZXdNb2RlID0gMTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICd5ZWFycyc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pblZpZXdNb2RlID0gMjtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5WaWV3TW9kZSA9IDA7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnZpZXdNb2RlID0gb3B0aW9ucy52aWV3TW9kZXx8dGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtdmlld21vZGUnKXx8MDtcclxuICAgIGlmICh0eXBlb2YgdGhpcy52aWV3TW9kZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICBzd2l0Y2ggKHRoaXMudmlld01vZGUpIHtcclxuICAgICAgICAgICAgY2FzZSAnbW9udGhzJzpcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGUgPSAxO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ3llYXJzJzpcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGUgPSAyO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlID0gMDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuc3RhcnRWaWV3TW9kZSA9IHRoaXMudmlld01vZGU7XHJcbiAgICB0aGlzLndlZWtTdGFydCA9IG9wdGlvbnMud2Vla1N0YXJ0fHx0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS13ZWVrc3RhcnQnKXx8MDtcclxuICAgIHRoaXMud2Vla0VuZCA9IHRoaXMud2Vla1N0YXJ0ID09PSAwID8gNiA6IHRoaXMud2Vla1N0YXJ0IC0gMTtcclxuICAgIHRoaXMub25SZW5kZXIgPSBvcHRpb25zLm9uUmVuZGVyO1xyXG4gICAgdGhpcy5maWxsRG93KCk7XHJcbiAgICB0aGlzLmZpbGxNb250aHMoKTtcclxuICAgIHRoaXMudXBkYXRlKCk7XHJcbiAgICB0aGlzLnNob3dNb2RlKCk7XHJcbn07XHJcblxyXG5EYXRlUGlja2VyLnByb3RvdHlwZSA9IHtcclxuICAgIGNvbnN0cnVjdG9yOiBEYXRlUGlja2VyLFxyXG4gICAgXHJcbiAgICBzaG93OiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuc2hvdygpO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5jb21wb25lbnQgPyB0aGlzLmNvbXBvbmVudC5vdXRlckhlaWdodCgpIDogdGhpcy5lbGVtZW50Lm91dGVySGVpZ2h0KCk7XHJcbiAgICAgICAgdGhpcy5wbGFjZSgpO1xyXG4gICAgICAgICQod2luZG93KS5vbigncmVzaXplJywgJC5wcm94eSh0aGlzLnBsYWNlLCB0aGlzKSk7XHJcbiAgICAgICAgaWYgKGUgKSB7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzSW5wdXQpIHtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbihldil7XHJcbiAgICAgICAgICAgIGlmICgkKGV2LnRhcmdldCkuY2xvc2VzdCgnLicgKyBjbGFzc2VzLmNvbXBvbmVudCkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0LmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcclxuICAgICAgICAgICAgdHlwZTogJ3Nob3cnLFxyXG4gICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGVcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIGhpZGU6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuaGlkZSgpO1xyXG4gICAgICAgICQod2luZG93KS5vZmYoJ3Jlc2l6ZScsIHRoaXMucGxhY2UpO1xyXG4gICAgICAgIHRoaXMudmlld01vZGUgPSB0aGlzLnN0YXJ0Vmlld01vZGU7XHJcbiAgICAgICAgdGhpcy5zaG93TW9kZSgpO1xyXG4gICAgICAgIGlmICghdGhpcy5pc0lucHV0KSB7XHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLm9mZignbW91c2Vkb3duJywgdGhpcy5oaWRlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy90aGlzLnNldCgpO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcclxuICAgICAgICAgICAgdHlwZTogJ2hpZGUnLFxyXG4gICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGVcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIHNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGZvcm1hdGVkID0gRFBHbG9iYWwuZm9ybWF0RGF0ZSh0aGlzLmRhdGUsIHRoaXMuZm9ybWF0KTtcclxuICAgICAgICBpZiAoIXRoaXMuaXNJbnB1dCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jb21wb25lbnQpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmZpbmQoJ2lucHV0JykucHJvcCgndmFsdWUnLCBmb3JtYXRlZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUnLCBmb3JtYXRlZCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnByb3AoJ3ZhbHVlJywgZm9ybWF0ZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIFNldHMgYSBkYXRlIGFzIHZhbHVlIGFuZCBub3RpZnkgd2l0aCBhbiBldmVudC5cclxuICAgICAgICBQYXJhbWV0ZXIgZG9udE5vdGlmeSBpcyBvbmx5IGZvciBjYXNlcyB3aGVyZSB0aGUgY2FsZW5kYXIgb3JcclxuICAgICAgICBzb21lIHJlbGF0ZWQgY29tcG9uZW50IGdldHMgYWxyZWFkeSB1cGRhdGVkIGJ1dCB0aGUgaGlnaGxpZ2h0ZWRcclxuICAgICAgICBkYXRlIG5lZWRzIHRvIGJlIHVwZGF0ZWQgd2l0aG91dCBjcmVhdGUgaW5maW5pdGUgcmVjdXJzaW9uIFxyXG4gICAgICAgIGJlY2F1c2Ugb2Ygbm90aWZpY2F0aW9uLiBJbiBvdGhlciBjYXNlLCBkb250IHVzZS5cclxuICAgICoqL1xyXG4gICAgc2V0VmFsdWU6IGZ1bmN0aW9uKG5ld0RhdGUsIGRvbnROb3RpZnkpIHtcclxuICAgICAgICBpZiAodHlwZW9mIG5ld0RhdGUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSA9IERQR2xvYmFsLnBhcnNlRGF0ZShuZXdEYXRlLCB0aGlzLmZvcm1hdCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5kYXRlID0gbmV3IERhdGUobmV3RGF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc2V0KCk7XHJcbiAgICAgICAgdGhpcy52aWV3RGF0ZSA9IG5ldyBEYXRlKHRoaXMuZGF0ZS5nZXRGdWxsWWVhcigpLCB0aGlzLmRhdGUuZ2V0TW9udGgoKSwgMSwgMCwgMCwgMCwgMCk7XHJcbiAgICAgICAgdGhpcy5maWxsKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGRvbnROb3RpZnkgIT09IHRydWUpIHtcclxuICAgICAgICAgICAgLy8gTm90aWZ5OlxyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnY2hhbmdlRGF0ZScsXHJcbiAgICAgICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGUsXHJcbiAgICAgICAgICAgICAgICB2aWV3TW9kZTogRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBnZXRWYWx1ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0ZTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIG1vdmVWYWx1ZTogZnVuY3Rpb24oZGlyLCBtb2RlKSB7XHJcbiAgICAgICAgLy8gZGlyIGNhbiBiZTogJ3ByZXYnLCAnbmV4dCdcclxuICAgICAgICBpZiAoWydwcmV2JywgJ25leHQnXS5pbmRleE9mKGRpciAmJiBkaXIudG9Mb3dlckNhc2UoKSkgPT0gLTEpXHJcbiAgICAgICAgICAgIC8vIE5vIHZhbGlkIG9wdGlvbjpcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBkZWZhdWx0IG1vZGUgaXMgdGhlIGN1cnJlbnQgb25lXHJcbiAgICAgICAgbW9kZSA9IG1vZGUgP1xyXG4gICAgICAgICAgICBEUEdsb2JhbC5tb2Rlc1NldFttb2RlXSA6XHJcbiAgICAgICAgICAgIERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdO1xyXG5cclxuICAgICAgICB0aGlzLmRhdGVbJ3NldCcgKyBtb2RlLm5hdkZuY10uY2FsbChcclxuICAgICAgICAgICAgdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICB0aGlzLmRhdGVbJ2dldCcgKyBtb2RlLm5hdkZuY10uY2FsbCh0aGlzLmRhdGUpICsgXHJcbiAgICAgICAgICAgIG1vZGUubmF2U3RlcCAqIChkaXIgPT09ICdwcmV2JyA/IC0xIDogMSlcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMuc2V0VmFsdWUodGhpcy5kYXRlKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5kYXRlO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgcGxhY2U6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdmFyIG9mZnNldCA9IHRoaXMuY29tcG9uZW50ID8gdGhpcy5jb21wb25lbnQub2Zmc2V0KCkgOiB0aGlzLmVsZW1lbnQub2Zmc2V0KCk7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuY3NzKHtcclxuICAgICAgICAgICAgdG9wOiBvZmZzZXQudG9wICsgdGhpcy5oZWlnaHQsXHJcbiAgICAgICAgICAgIGxlZnQ6IG9mZnNldC5sZWZ0XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uKG5ld0RhdGUpe1xyXG4gICAgICAgIHRoaXMuZGF0ZSA9IERQR2xvYmFsLnBhcnNlRGF0ZShcclxuICAgICAgICAgICAgdHlwZW9mIG5ld0RhdGUgPT09ICdzdHJpbmcnID8gbmV3RGF0ZSA6ICh0aGlzLmlzSW5wdXQgPyB0aGlzLmVsZW1lbnQucHJvcCgndmFsdWUnKSA6IHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlJykpLFxyXG4gICAgICAgICAgICB0aGlzLmZvcm1hdFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgdGhpcy52aWV3RGF0ZSA9IG5ldyBEYXRlKHRoaXMuZGF0ZS5nZXRGdWxsWWVhcigpLCB0aGlzLmRhdGUuZ2V0TW9udGgoKSwgMSwgMCwgMCwgMCwgMCk7XHJcbiAgICAgICAgdGhpcy5maWxsKCk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBmaWxsRG93OiBmdW5jdGlvbigpe1xyXG4gICAgICAgIHZhciBkb3dDbnQgPSB0aGlzLndlZWtTdGFydDtcclxuICAgICAgICB2YXIgaHRtbCA9ICc8dHI+JztcclxuICAgICAgICB3aGlsZSAoZG93Q250IDwgdGhpcy53ZWVrU3RhcnQgKyA3KSB7XHJcbiAgICAgICAgICAgIGh0bWwgKz0gJzx0aCBjbGFzcz1cImRvd1wiPicrRFBHbG9iYWwuZGF0ZXMuZGF5c01pblsoZG93Q250KyspJTddKyc8L3RoPic7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGh0bWwgKz0gJzwvdHI+JztcclxuICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcuJyArIGNsYXNzZXMuZGF5cyArICcgdGhlYWQnKS5hcHBlbmQoaHRtbCk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBmaWxsTW9udGhzOiBmdW5jdGlvbigpe1xyXG4gICAgICAgIHZhciBodG1sID0gJyc7XHJcbiAgICAgICAgdmFyIGkgPSAwO1xyXG4gICAgICAgIHdoaWxlIChpIDwgMTIpIHtcclxuICAgICAgICAgICAgaHRtbCArPSAnPHNwYW4gY2xhc3M9XCInICsgY2xhc3Nlcy5tb250aCArICdcIj4nK0RQR2xvYmFsLmRhdGVzLm1vbnRoc1Nob3J0W2krK10rJzwvc3Bhbj4nO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcuJyArIGNsYXNzZXMubW9udGhzICsgJyB0ZCcpLmFwcGVuZChodG1sKTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIGZpbGw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8qanNoaW50IG1heHN0YXRlbWVudHM6NjYsIG1heGNvbXBsZXhpdHk6MjgqL1xyXG4gICAgICAgIHZhciBkID0gbmV3IERhdGUodGhpcy52aWV3RGF0ZSksXHJcbiAgICAgICAgICAgIHllYXIgPSBkLmdldEZ1bGxZZWFyKCksXHJcbiAgICAgICAgICAgIG1vbnRoID0gZC5nZXRNb250aCgpLFxyXG4gICAgICAgICAgICBjdXJyZW50RGF0ZSA9IHRoaXMuZGF0ZS52YWx1ZU9mKCk7XHJcbiAgICAgICAgdGhpcy5waWNrZXJcclxuICAgICAgICAuZmluZCgnLicgKyBjbGFzc2VzLmRheXMgKyAnIHRoOmVxKDEpJylcclxuICAgICAgICAuaHRtbChEUEdsb2JhbC5kYXRlcy5tb250aHNbbW9udGhdICsgJyAnICsgeWVhcik7XHJcbiAgICAgICAgdmFyIHByZXZNb250aCA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLTEsIDI4LDAsMCwwLDApLFxyXG4gICAgICAgICAgICBkYXkgPSBEUEdsb2JhbC5nZXREYXlzSW5Nb250aChwcmV2TW9udGguZ2V0RnVsbFllYXIoKSwgcHJldk1vbnRoLmdldE1vbnRoKCkpO1xyXG4gICAgICAgIHByZXZNb250aC5zZXREYXRlKGRheSk7XHJcbiAgICAgICAgcHJldk1vbnRoLnNldERhdGUoZGF5IC0gKHByZXZNb250aC5nZXREYXkoKSAtIHRoaXMud2Vla1N0YXJ0ICsgNyklNyk7XHJcbiAgICAgICAgdmFyIG5leHRNb250aCA9IG5ldyBEYXRlKHByZXZNb250aCk7XHJcbiAgICAgICAgbmV4dE1vbnRoLnNldERhdGUobmV4dE1vbnRoLmdldERhdGUoKSArIDQyKTtcclxuICAgICAgICBuZXh0TW9udGggPSBuZXh0TW9udGgudmFsdWVPZigpO1xyXG4gICAgICAgIHZhciBodG1sID0gW107XHJcbiAgICAgICAgdmFyIGNsc05hbWUsXHJcbiAgICAgICAgICAgIHByZXZZLFxyXG4gICAgICAgICAgICBwcmV2TTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgaWYgKHRoaXMuX2RheXNDcmVhdGVkICE9PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBodG1sIChmaXJzdCB0aW1lIG9ubHkpXHJcbiAgICAgICBcclxuICAgICAgICAgICAgd2hpbGUocHJldk1vbnRoLnZhbHVlT2YoKSA8IG5leHRNb250aCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZNb250aC5nZXREYXkoKSA9PT0gdGhpcy53ZWVrU3RhcnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goJzx0cj4nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNsc05hbWUgPSB0aGlzLm9uUmVuZGVyKHByZXZNb250aCk7XHJcbiAgICAgICAgICAgICAgICBwcmV2WSA9IHByZXZNb250aC5nZXRGdWxsWWVhcigpO1xyXG4gICAgICAgICAgICAgICAgcHJldk0gPSBwcmV2TW9udGguZ2V0TW9udGgoKTtcclxuICAgICAgICAgICAgICAgIGlmICgocHJldk0gPCBtb250aCAmJiAgcHJldlkgPT09IHllYXIpIHx8ICBwcmV2WSA8IHllYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgb2xkJztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoKHByZXZNID4gbW9udGggJiYgcHJldlkgPT09IHllYXIpIHx8IHByZXZZID4geWVhcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBuZXcnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZNb250aC52YWx1ZU9mKCkgPT09IGN1cnJlbnREYXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIGFjdGl2ZSc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBodG1sLnB1c2goJzx0ZCBjbGFzcz1cIicgKyBjbGFzc2VzLm1vbnRoRGF5ICsgJyAnICsgY2xzTmFtZSsnXCI+JytwcmV2TW9udGguZ2V0RGF0ZSgpICsgJzwvdGQ+Jyk7XHJcbiAgICAgICAgICAgICAgICBpZiAocHJldk1vbnRoLmdldERheSgpID09PSB0aGlzLndlZWtFbmQpIHtcclxuICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goJzwvdHI+Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBwcmV2TW9udGguc2V0RGF0ZShwcmV2TW9udGguZ2V0RGF0ZSgpKzEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcuJyArIGNsYXNzZXMuZGF5cyArICcgdGJvZHknKS5lbXB0eSgpLmFwcGVuZChodG1sLmpvaW4oJycpKTtcclxuICAgICAgICAgICAgdGhpcy5fZGF5c0NyZWF0ZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gVXBkYXRlIGRheXMgdmFsdWVzXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgd2Vla1RyID0gdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLmRheXMgKyAnIHRib2R5IHRyOmZpcnN0LWNoaWxkKCknKTtcclxuICAgICAgICAgICAgdmFyIGRheVRkID0gbnVsbDtcclxuICAgICAgICAgICAgd2hpbGUocHJldk1vbnRoLnZhbHVlT2YoKSA8IG5leHRNb250aCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRXZWVrRGF5SW5kZXggPSBwcmV2TW9udGguZ2V0RGF5KCkgLSB0aGlzLndlZWtTdGFydDtcclxuXHJcbiAgICAgICAgICAgICAgICBjbHNOYW1lID0gdGhpcy5vblJlbmRlcihwcmV2TW9udGgpO1xyXG4gICAgICAgICAgICAgICAgcHJldlkgPSBwcmV2TW9udGguZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICAgICAgICAgIHByZXZNID0gcHJldk1vbnRoLmdldE1vbnRoKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoKHByZXZNIDwgbW9udGggJiYgIHByZXZZID09PSB5ZWFyKSB8fCAgcHJldlkgPCB5ZWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIG9sZCc7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKChwcmV2TSA+IG1vbnRoICYmIHByZXZZID09PSB5ZWFyKSB8fCBwcmV2WSA+IHllYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgbmV3JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGgudmFsdWVPZigpID09PSBjdXJyZW50RGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBhY3RpdmUnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy9odG1sLnB1c2goJzx0ZCBjbGFzcz1cImRheSAnK2Nsc05hbWUrJ1wiPicrcHJldk1vbnRoLmdldERhdGUoKSArICc8L3RkPicpO1xyXG4gICAgICAgICAgICAgICAgZGF5VGQgPSB3ZWVrVHIuZmluZCgndGQ6ZXEoJyArIGN1cnJlbnRXZWVrRGF5SW5kZXggKyAnKScpO1xyXG4gICAgICAgICAgICAgICAgZGF5VGRcclxuICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdkYXkgJyArIGNsc05hbWUpXHJcbiAgICAgICAgICAgICAgICAudGV4dChwcmV2TW9udGguZ2V0RGF0ZSgpKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gTmV4dCB3ZWVrP1xyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZNb250aC5nZXREYXkoKSA9PT0gdGhpcy53ZWVrRW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2Vla1RyID0gd2Vla1RyLm5leHQoJ3RyJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBwcmV2TW9udGguc2V0RGF0ZShwcmV2TW9udGguZ2V0RGF0ZSgpKzEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY3VycmVudFllYXIgPSB0aGlzLmRhdGUuZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgbW9udGhzID0gdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLm1vbnRocylcclxuICAgICAgICAgICAgICAgICAgICAuZmluZCgndGg6ZXEoMSknKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuaHRtbCh5ZWFyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZW5kKClcclxuICAgICAgICAgICAgICAgICAgICAuZmluZCgnc3BhbicpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcclxuICAgICAgICBpZiAoY3VycmVudFllYXIgPT09IHllYXIpIHtcclxuICAgICAgICAgICAgbW9udGhzLmVxKHRoaXMuZGF0ZS5nZXRNb250aCgpKS5hZGRDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGh0bWwgPSAnJztcclxuICAgICAgICB5ZWFyID0gcGFyc2VJbnQoeWVhci8xMCwgMTApICogMTA7XHJcbiAgICAgICAgdmFyIHllYXJDb250ID0gdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLnllYXJzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ3RoOmVxKDEpJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGV4dCh5ZWFyICsgJy0nICsgKHllYXIgKyA5KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZW5kKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKCd0ZCcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHllYXIgLT0gMTtcclxuICAgICAgICB2YXIgaTtcclxuICAgICAgICBpZiAodGhpcy5feWVhcnNDcmVhdGVkICE9PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGkgPSAtMTsgaSA8IDExOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGh0bWwgKz0gJzxzcGFuIGNsYXNzPVwiJyArIGNsYXNzZXMueWVhciArIChpID09PSAtMSB8fCBpID09PSAxMCA/ICcgb2xkJyA6ICcnKSsoY3VycmVudFllYXIgPT09IHllYXIgPyAnIGFjdGl2ZScgOiAnJykrJ1wiPicreWVhcisnPC9zcGFuPic7XHJcbiAgICAgICAgICAgICAgICB5ZWFyICs9IDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHllYXJDb250Lmh0bWwoaHRtbCk7XHJcbiAgICAgICAgICAgIHRoaXMuX3llYXJzQ3JlYXRlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHllYXJTcGFuID0geWVhckNvbnQuZmluZCgnc3BhbjpmaXJzdC1jaGlsZCgpJyk7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IC0xOyBpIDwgMTE7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgLy9odG1sICs9ICc8c3BhbiBjbGFzcz1cInllYXInKyhpID09PSAtMSB8fCBpID09PSAxMCA/ICcgb2xkJyA6ICcnKSsoY3VycmVudFllYXIgPT09IHllYXIgPyAnIGFjdGl2ZScgOiAnJykrJ1wiPicreWVhcisnPC9zcGFuPic7XHJcbiAgICAgICAgICAgICAgICB5ZWFyU3BhblxyXG4gICAgICAgICAgICAgICAgLnRleHQoeWVhcilcclxuICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICd5ZWFyJyArIChpID09PSAtMSB8fCBpID09PSAxMCA/ICcgb2xkJyA6ICcnKSArIChjdXJyZW50WWVhciA9PT0geWVhciA/ICcgYWN0aXZlJyA6ICcnKSk7XHJcbiAgICAgICAgICAgICAgICB5ZWFyICs9IDE7XHJcbiAgICAgICAgICAgICAgICB5ZWFyU3BhbiA9IHllYXJTcGFuLm5leHQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIG1vdmVEYXRlOiBmdW5jdGlvbihkaXIsIG1vZGUpIHtcclxuICAgICAgICAvLyBkaXIgY2FuIGJlOiAncHJldicsICduZXh0J1xyXG4gICAgICAgIGlmIChbJ3ByZXYnLCAnbmV4dCddLmluZGV4T2YoZGlyICYmIGRpci50b0xvd2VyQ2FzZSgpKSA9PSAtMSlcclxuICAgICAgICAgICAgLy8gTm8gdmFsaWQgb3B0aW9uOlxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIC8vIGRlZmF1bHQgbW9kZSBpcyB0aGUgY3VycmVudCBvbmVcclxuICAgICAgICBtb2RlID0gbW9kZSB8fCB0aGlzLnZpZXdNb2RlO1xyXG5cclxuICAgICAgICB0aGlzLnZpZXdEYXRlWydzZXQnK0RQR2xvYmFsLm1vZGVzW21vZGVdLm5hdkZuY10uY2FsbChcclxuICAgICAgICAgICAgdGhpcy52aWV3RGF0ZSxcclxuICAgICAgICAgICAgdGhpcy52aWV3RGF0ZVsnZ2V0JytEUEdsb2JhbC5tb2Rlc1ttb2RlXS5uYXZGbmNdLmNhbGwodGhpcy52aWV3RGF0ZSkgKyBcclxuICAgICAgICAgICAgRFBHbG9iYWwubW9kZXNbbW9kZV0ubmF2U3RlcCAqIChkaXIgPT09ICdwcmV2JyA/IC0xIDogMSlcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgICAgIHRoaXMuc2V0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsaWNrOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgLypqc2hpbnQgbWF4Y29tcGxleGl0eToxNiovXHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdmFyIHRhcmdldCA9ICQoZS50YXJnZXQpLmNsb3Nlc3QoJ3NwYW4sIHRkLCB0aCcpO1xyXG4gICAgICAgIGlmICh0YXJnZXQubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgIHZhciBtb250aCwgeWVhcjtcclxuICAgICAgICAgICAgc3dpdGNoKHRhcmdldFswXS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd0aCc6XHJcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoKHRhcmdldFswXS5jbGFzc05hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3dpdGNoJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd01vZGUoMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAncHJldic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ25leHQnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3ZlRGF0ZSh0YXJnZXRbMF0uY2xhc3NOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3NwYW4nOlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuaXMoJy4nICsgY2xhc3Nlcy5tb250aCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggPSB0YXJnZXQucGFyZW50KCkuZmluZCgnc3BhbicpLmluZGV4KHRhcmdldCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmlld0RhdGUuc2V0TW9udGgobW9udGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHllYXIgPSBwYXJzZUludCh0YXJnZXQudGV4dCgpLCAxMCl8fDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmlld0RhdGUuc2V0RnVsbFllYXIoeWVhcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnZpZXdNb2RlICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0ZSA9IG5ldyBEYXRlKHRoaXMudmlld0RhdGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2hhbmdlRGF0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3TW9kZTogRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93TW9kZSgtMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQoKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3RkJzpcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmlzKCcuZGF5JykgJiYgIXRhcmdldC5pcygnLmRpc2FibGVkJykpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGF5ID0gcGFyc2VJbnQodGFyZ2V0LnRleHQoKSwgMTApfHwxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb250aCA9IHRoaXMudmlld0RhdGUuZ2V0TW9udGgoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldC5pcygnLm9sZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb250aCAtPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRhcmdldC5pcygnLm5ldycpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb250aCArPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHllYXIgPSB0aGlzLnZpZXdEYXRlLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0ZSA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLCBkYXksMCwwLDAsMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmlld0RhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgTWF0aC5taW4oMjgsIGRheSksMCwwLDAsMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2hhbmdlRGF0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3TW9kZTogRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBtb3VzZWRvd246IGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgc2hvd01vZGU6IGZ1bmN0aW9uKGRpcikge1xyXG4gICAgICAgIGlmIChkaXIpIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3TW9kZSA9IE1hdGgubWF4KHRoaXMubWluVmlld01vZGUsIE1hdGgubWluKDIsIHRoaXMudmlld01vZGUgKyBkaXIpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnPmRpdicpLmhpZGUoKS5maWx0ZXIoJy4nICsgY2xhc3Nlcy5jb21wb25lbnQgKyAnLScgKyBEUEdsb2JhbC5tb2Rlc1t0aGlzLnZpZXdNb2RlXS5jbHNOYW1lKS5zaG93KCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4kLmZuLmRhdGVwaWNrZXIgPSBmdW5jdGlvbiAoIG9wdGlvbiApIHtcclxuICAgIHZhciB2YWxzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcclxuICAgIHZhciByZXR1cm5lZDtcclxuICAgIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgZGF0YSA9ICR0aGlzLmRhdGEoJ2RhdGVwaWNrZXInKSxcclxuICAgICAgICAgICAgb3B0aW9ucyA9IHR5cGVvZiBvcHRpb24gPT09ICdvYmplY3QnICYmIG9wdGlvbjtcclxuICAgICAgICBpZiAoIWRhdGEpIHtcclxuICAgICAgICAgICAgJHRoaXMuZGF0YSgnZGF0ZXBpY2tlcicsIChkYXRhID0gbmV3IERhdGVQaWNrZXIodGhpcywgJC5leHRlbmQoe30sICQuZm4uZGF0ZXBpY2tlci5kZWZhdWx0cyxvcHRpb25zKSkpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9uID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICByZXR1cm5lZCA9IGRhdGFbb3B0aW9uXS5hcHBseShkYXRhLCB2YWxzKTtcclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgYSB2YWx1ZSByZXR1cm5lZCBieSB0aGUgbWV0aG9kP1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mKHJldHVybmVkICE9PSAndW5kZWZpbmVkJykpIHtcclxuICAgICAgICAgICAgICAgIC8vIEdvIG91dCB0aGUgbG9vcCB0byByZXR1cm4gdGhlIHZhbHVlIGZyb20gdGhlIGZpcnN0XHJcbiAgICAgICAgICAgICAgICAvLyBlbGVtZW50LW1ldGhvZCBleGVjdXRpb25cclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBGb2xsb3cgbmV4dCBsb29wIGl0ZW1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIGlmICh0eXBlb2YocmV0dXJuZWQpICE9PSAndW5kZWZpbmVkJylcclxuICAgICAgICByZXR1cm4gcmV0dXJuZWQ7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgLy8gY2hhaW5pbmc6XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4kLmZuLmRhdGVwaWNrZXIuZGVmYXVsdHMgPSB7XHJcbiAgICBvblJlbmRlcjogZnVuY3Rpb24oZGF0ZSkge1xyXG4gICAgICAgIHJldHVybiAnJztcclxuICAgIH1cclxufTtcclxuJC5mbi5kYXRlcGlja2VyLkNvbnN0cnVjdG9yID0gRGF0ZVBpY2tlcjtcclxuXHJcbnZhciBEUEdsb2JhbCA9IHtcclxuICAgIG1vZGVzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjbHNOYW1lOiAnZGF5cycsXHJcbiAgICAgICAgICAgIG5hdkZuYzogJ01vbnRoJyxcclxuICAgICAgICAgICAgbmF2U3RlcDogMVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjbHNOYW1lOiAnbW9udGhzJyxcclxuICAgICAgICAgICAgbmF2Rm5jOiAnRnVsbFllYXInLFxyXG4gICAgICAgICAgICBuYXZTdGVwOiAxXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNsc05hbWU6ICd5ZWFycycsXHJcbiAgICAgICAgICAgIG5hdkZuYzogJ0Z1bGxZZWFyJyxcclxuICAgICAgICAgICAgbmF2U3RlcDogMTBcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xzTmFtZTogJ2RheScsXHJcbiAgICAgICAgICAgIG5hdkZuYzogJ0RhdGUnLFxyXG4gICAgICAgICAgICBuYXZTdGVwOiAxXHJcbiAgICAgICAgfVxyXG4gICAgXSxcclxuICAgIGRhdGVzOntcclxuICAgICAgICBkYXlzOiBbXCJTdW5kYXlcIiwgXCJNb25kYXlcIiwgXCJUdWVzZGF5XCIsIFwiV2VkbmVzZGF5XCIsIFwiVGh1cnNkYXlcIiwgXCJGcmlkYXlcIiwgXCJTYXR1cmRheVwiLCBcIlN1bmRheVwiXSxcclxuICAgICAgICBkYXlzU2hvcnQ6IFtcIlN1blwiLCBcIk1vblwiLCBcIlR1ZVwiLCBcIldlZFwiLCBcIlRodVwiLCBcIkZyaVwiLCBcIlNhdFwiLCBcIlN1blwiXSxcclxuICAgICAgICBkYXlzTWluOiBbXCJTdVwiLCBcIk1vXCIsIFwiVHVcIiwgXCJXZVwiLCBcIlRoXCIsIFwiRnJcIiwgXCJTYVwiLCBcIlN1XCJdLFxyXG4gICAgICAgIG1vbnRoczogW1wiSmFudWFyeVwiLCBcIkZlYnJ1YXJ5XCIsIFwiTWFyY2hcIiwgXCJBcHJpbFwiLCBcIk1heVwiLCBcIkp1bmVcIiwgXCJKdWx5XCIsIFwiQXVndXN0XCIsIFwiU2VwdGVtYmVyXCIsIFwiT2N0b2JlclwiLCBcIk5vdmVtYmVyXCIsIFwiRGVjZW1iZXJcIl0sXHJcbiAgICAgICAgbW9udGhzU2hvcnQ6IFtcIkphblwiLCBcIkZlYlwiLCBcIk1hclwiLCBcIkFwclwiLCBcIk1heVwiLCBcIkp1blwiLCBcIkp1bFwiLCBcIkF1Z1wiLCBcIlNlcFwiLCBcIk9jdFwiLCBcIk5vdlwiLCBcIkRlY1wiXVxyXG4gICAgfSxcclxuICAgIGlzTGVhcFllYXI6IGZ1bmN0aW9uICh5ZWFyKSB7XHJcbiAgICAgICAgcmV0dXJuICgoKHllYXIgJSA0ID09PSAwKSAmJiAoeWVhciAlIDEwMCAhPT0gMCkpIHx8ICh5ZWFyICUgNDAwID09PSAwKSk7XHJcbiAgICB9LFxyXG4gICAgZ2V0RGF5c0luTW9udGg6IGZ1bmN0aW9uICh5ZWFyLCBtb250aCkge1xyXG4gICAgICAgIHJldHVybiBbMzEsIChEUEdsb2JhbC5pc0xlYXBZZWFyKHllYXIpID8gMjkgOiAyOCksIDMxLCAzMCwgMzEsIDMwLCAzMSwgMzEsIDMwLCAzMSwgMzAsIDMxXVttb250aF07XHJcbiAgICB9LFxyXG4gICAgcGFyc2VGb3JtYXQ6IGZ1bmN0aW9uKGZvcm1hdCl7XHJcbiAgICAgICAgdmFyIHNlcGFyYXRvciA9IGZvcm1hdC5tYXRjaCgvWy5cXC9cXC1cXHNdLio/LyksXHJcbiAgICAgICAgICAgIHBhcnRzID0gZm9ybWF0LnNwbGl0KC9cXFcrLyk7XHJcbiAgICAgICAgaWYgKCFzZXBhcmF0b3IgfHwgIXBhcnRzIHx8IHBhcnRzLmxlbmd0aCA9PT0gMCl7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgZGF0ZSBmb3JtYXQuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4ge3NlcGFyYXRvcjogc2VwYXJhdG9yLCBwYXJ0czogcGFydHN9O1xyXG4gICAgfSxcclxuICAgIHBhcnNlRGF0ZTogZnVuY3Rpb24oZGF0ZSwgZm9ybWF0KSB7XHJcbiAgICAgICAgLypqc2hpbnQgbWF4Y29tcGxleGl0eToxMSovXHJcbiAgICAgICAgdmFyIHBhcnRzID0gZGF0ZS5zcGxpdChmb3JtYXQuc2VwYXJhdG9yKSxcclxuICAgICAgICAgICAgdmFsO1xyXG4gICAgICAgIGRhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgIGRhdGUuc2V0SG91cnMoMCk7XHJcbiAgICAgICAgZGF0ZS5zZXRNaW51dGVzKDApO1xyXG4gICAgICAgIGRhdGUuc2V0U2Vjb25kcygwKTtcclxuICAgICAgICBkYXRlLnNldE1pbGxpc2Vjb25kcygwKTtcclxuICAgICAgICBpZiAocGFydHMubGVuZ3RoID09PSBmb3JtYXQucGFydHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciB5ZWFyID0gZGF0ZS5nZXRGdWxsWWVhcigpLCBkYXkgPSBkYXRlLmdldERhdGUoKSwgbW9udGggPSBkYXRlLmdldE1vbnRoKCk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGk9MCwgY250ID0gZm9ybWF0LnBhcnRzLmxlbmd0aDsgaSA8IGNudDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YWwgPSBwYXJzZUludChwYXJ0c1tpXSwgMTApfHwxO1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoKGZvcm1hdC5wYXJ0c1tpXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2RkJzpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdkJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF5ID0gdmFsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlLnNldERhdGUodmFsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbW0nOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ20nOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb250aCA9IHZhbCAtIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGUuc2V0TW9udGgodmFsIC0gMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3l5JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgeWVhciA9IDIwMDAgKyB2YWw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGUuc2V0RnVsbFllYXIoMjAwMCArIHZhbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3l5eXknOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ZWFyID0gdmFsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlLnNldEZ1bGxZZWFyKHZhbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgZGF5LCAwICwwICwwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGRhdGU7XHJcbiAgICB9LFxyXG4gICAgZm9ybWF0RGF0ZTogZnVuY3Rpb24oZGF0ZSwgZm9ybWF0KXtcclxuICAgICAgICB2YXIgdmFsID0ge1xyXG4gICAgICAgICAgICBkOiBkYXRlLmdldERhdGUoKSxcclxuICAgICAgICAgICAgbTogZGF0ZS5nZXRNb250aCgpICsgMSxcclxuICAgICAgICAgICAgeXk6IGRhdGUuZ2V0RnVsbFllYXIoKS50b1N0cmluZygpLnN1YnN0cmluZygyKSxcclxuICAgICAgICAgICAgeXl5eTogZGF0ZS5nZXRGdWxsWWVhcigpXHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YWwuZGQgPSAodmFsLmQgPCAxMCA/ICcwJyA6ICcnKSArIHZhbC5kO1xyXG4gICAgICAgIHZhbC5tbSA9ICh2YWwubSA8IDEwID8gJzAnIDogJycpICsgdmFsLm07XHJcbiAgICAgICAgZGF0ZSA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGk9MCwgY250ID0gZm9ybWF0LnBhcnRzLmxlbmd0aDsgaSA8IGNudDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGRhdGUucHVzaCh2YWxbZm9ybWF0LnBhcnRzW2ldXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRlLmpvaW4oZm9ybWF0LnNlcGFyYXRvcik7XHJcbiAgICB9LFxyXG4gICAgaGVhZFRlbXBsYXRlOiAnPHRoZWFkPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8dHI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGggY2xhc3M9XCJwcmV2XCI+JmxzYXF1bzs8L3RoPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRoIGNvbHNwYW49XCI1XCIgY2xhc3M9XCJzd2l0Y2hcIj48L3RoPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRoIGNsYXNzPVwibmV4dFwiPiZyc2FxdW87PC90aD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC90cj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICc8L3RoZWFkPicsXHJcbiAgICBjb250VGVtcGxhdGU6ICc8dGJvZHk+PHRyPjx0ZCBjb2xzcGFuPVwiN1wiPjwvdGQ+PC90cj48L3Rib2R5PidcclxufTtcclxuRFBHbG9iYWwudGVtcGxhdGUgPSAnPGRpdiBjbGFzcz1cIicgKyBjbGFzc2VzLmNvbXBvbmVudCArICdcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cIicgKyBjbGFzc2VzLmRheXMgKyAnXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGFibGUgY2xhc3M9XCIgdGFibGUtY29uZGVuc2VkXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEUEdsb2JhbC5oZWFkVGVtcGxhdGUrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0Ym9keT48L3Rib2R5PicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC90YWJsZT4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCInICsgY2xhc3Nlcy5tb250aHMgKyAnXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGFibGUgY2xhc3M9XCJ0YWJsZS1jb25kZW5zZWRcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERQR2xvYmFsLmhlYWRUZW1wbGF0ZStcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEUEdsb2JhbC5jb250VGVtcGxhdGUrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC90YWJsZT4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCInICsgY2xhc3Nlcy55ZWFycyArICdcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0YWJsZSBjbGFzcz1cInRhYmxlLWNvbmRlbnNlZFwiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRFBHbG9iYWwuaGVhZFRlbXBsYXRlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERQR2xvYmFsLmNvbnRUZW1wbGF0ZStcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L3RhYmxlPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nO1xyXG5EUEdsb2JhbC5tb2Rlc1NldCA9IHtcclxuICAgICdkYXRlJzogRFBHbG9iYWwubW9kZXNbM10sXHJcbiAgICAnbW9udGgnOiBEUEdsb2JhbC5tb2Rlc1swXSxcclxuICAgICd5ZWFyJzogRFBHbG9iYWwubW9kZXNbMV0sXHJcbiAgICAnZGVjYWRlJzogRFBHbG9iYWwubW9kZXNbMl1cclxufTtcclxuXHJcbi8qKiBQdWJsaWMgQVBJICoqL1xyXG5leHBvcnRzLkRhdGVQaWNrZXIgPSBEYXRlUGlja2VyO1xyXG5leHBvcnRzLmRlZmF1bHRzID0gRFBHbG9iYWw7XHJcbmV4cG9ydHMudXRpbHMgPSBEUEdsb2JhbDtcclxuIiwiLyoqXHJcbiAgICBTbWFydE5hdkJhciBjb21wb25lbnQuXHJcbiAgICBSZXF1aXJlcyBpdHMgQ1NTIGNvdW50ZXJwYXJ0LlxyXG4gICAgXHJcbiAgICBDcmVhdGVkIGJhc2VkIG9uIHRoZSBwcm9qZWN0OlxyXG4gICAgXHJcbiAgICBQcm9qZWN0LVR5c29uXHJcbiAgICBXZWJzaXRlOiBodHRwczovL2dpdGh1Yi5jb20vYzJwcm9kcy9Qcm9qZWN0LVR5c29uXHJcbiAgICBBdXRob3I6IGMycHJvZHNcclxuICAgIExpY2Vuc2U6XHJcbiAgICBUaGUgTUlUIExpY2Vuc2UgKE1JVClcclxuICAgIENvcHlyaWdodCAoYykgMjAxMyBjMnByb2RzXHJcbiAgICBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mXHJcbiAgICB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluXHJcbiAgICB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvXHJcbiAgICB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZlxyXG4gICAgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLFxyXG4gICAgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcbiAgICBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcclxuICAgIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXHJcbiAgICBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXHJcbiAgICBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTU1xyXG4gICAgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SXHJcbiAgICBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVJcclxuICAgIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOXHJcbiAgICBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbi8qKlxyXG4gICAgSW50ZXJuYWwgdXRpbGl0eS5cclxuICAgIFJlbW92ZXMgYWxsIGNoaWxkcmVuIGZvciBhIERPTSBub2RlXHJcbioqL1xyXG52YXIgY2xlYXJOb2RlID0gZnVuY3Rpb24gKG5vZGUpIHtcclxuICAgIHdoaWxlKG5vZGUuZmlyc3RDaGlsZCl7XHJcbiAgICAgICAgbm9kZS5yZW1vdmVDaGlsZChub2RlLmZpcnN0Q2hpbGQpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAgICBDYWxjdWxhdGVzIGFuZCBhcHBsaWVzIHRoZSBiZXN0IHNpemluZyBhbmQgZGlzdHJpYnV0aW9uIGZvciB0aGUgdGl0bGVcclxuICAgIGRlcGVuZGluZyBvbiBjb250ZW50IGFuZCBidXR0b25zLlxyXG4gICAgUGFzcyBpbiB0aGUgdGl0bGUgZWxlbWVudCwgYnV0dG9ucyBtdXN0IGJlIGZvdW5kIGFzIHNpYmxpbmdzIG9mIGl0LlxyXG4qKi9cclxudmFyIHRleHRib3hSZXNpemUgPSBmdW5jdGlvbiB0ZXh0Ym94UmVzaXplKGVsKSB7XHJcbiAgICAvKiBqc2hpbnQgbWF4c3RhdGVtZW50czogMjgsIG1heGNvbXBsZXhpdHk6MTEgKi9cclxuICAgIFxyXG4gICAgdmFyIGxlZnRidG4gPSBlbC5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoJy5TbWFydE5hdkJhci1lZGdlLmxlZnQnKVswXTtcclxuICAgIHZhciByaWdodGJ0biA9IGVsLnBhcmVudE5vZGUucXVlcnlTZWxlY3RvckFsbCgnLlNtYXJ0TmF2QmFyLWVkZ2UucmlnaHQnKVswXTtcclxuICAgIGlmICh0eXBlb2YgbGVmdGJ0biA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICBsZWZ0YnRuID0ge1xyXG4gICAgICAgICAgICBvZmZzZXRXaWR0aDogMCxcclxuICAgICAgICAgICAgY2xhc3NOYW1lOiAnJ1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHJpZ2h0YnRuID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIHJpZ2h0YnRuID0ge1xyXG4gICAgICAgICAgICBvZmZzZXRXaWR0aDogMCxcclxuICAgICAgICAgICAgY2xhc3NOYW1lOiAnJ1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHZhciBtYXJnaW4gPSBNYXRoLm1heChsZWZ0YnRuLm9mZnNldFdpZHRoLCByaWdodGJ0bi5vZmZzZXRXaWR0aCk7XHJcbiAgICBlbC5zdHlsZS5tYXJnaW5MZWZ0ID0gbWFyZ2luICsgJ3B4JztcclxuICAgIGVsLnN0eWxlLm1hcmdpblJpZ2h0ID0gbWFyZ2luICsgJ3B4JztcclxuICAgIHZhciB0b29Mb25nID0gKGVsLm9mZnNldFdpZHRoIDwgZWwuc2Nyb2xsV2lkdGgpID8gdHJ1ZSA6IGZhbHNlO1xyXG4gICAgaWYgKHRvb0xvbmcpIHtcclxuICAgICAgICBpZiAobGVmdGJ0bi5vZmZzZXRXaWR0aCA8IHJpZ2h0YnRuLm9mZnNldFdpZHRoKSB7XHJcbiAgICAgICAgICAgIGVsLnN0eWxlLm1hcmdpbkxlZnQgPSBsZWZ0YnRuLm9mZnNldFdpZHRoICsgJ3B4JztcclxuICAgICAgICAgICAgZWwuc3R5bGUudGV4dEFsaWduID0gJ3JpZ2h0JztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBlbC5zdHlsZS5tYXJnaW5SaWdodCA9IHJpZ2h0YnRuLm9mZnNldFdpZHRoICsgJ3B4JztcclxuICAgICAgICAgICAgZWwuc3R5bGUudGV4dEFsaWduID0gJ2xlZnQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0b29Mb25nID0gKGVsLm9mZnNldFdpZHRoPGVsLnNjcm9sbFdpZHRoKSA/IHRydWUgOiBmYWxzZTtcclxuICAgICAgICBpZiAodG9vTG9uZykge1xyXG4gICAgICAgICAgICBpZiAobmV3IFJlZ0V4cCgnYXJyb3cnKS50ZXN0KGxlZnRidG4uY2xhc3NOYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgY2xlYXJOb2RlKGxlZnRidG4uY2hpbGROb2Rlc1sxXSk7XHJcbiAgICAgICAgICAgICAgICBlbC5zdHlsZS5tYXJnaW5MZWZ0ID0gJzI2cHgnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChuZXcgUmVnRXhwKCdhcnJvdycpLnRlc3QocmlnaHRidG4uY2xhc3NOYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgY2xlYXJOb2RlKHJpZ2h0YnRuLmNoaWxkTm9kZXNbMV0pO1xyXG4gICAgICAgICAgICAgICAgZWwuc3R5bGUubWFyZ2luUmlnaHQgPSAnMjZweCc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnRzLnRleHRib3hSZXNpemUgPSB0ZXh0Ym94UmVzaXplO1xyXG5cclxuLyoqXHJcbiAgICBTbWFydE5hdkJhciBjbGFzcywgaW5zdGFudGlhdGUgd2l0aCBhIERPTSBlbGVtZW50XHJcbiAgICByZXByZXNlbnRpbmcgYSBuYXZiYXIuXHJcbiAgICBBUEk6XHJcbiAgICAtIHJlZnJlc2g6IHVwZGF0ZXMgdGhlIGNvbnRyb2wgdGFraW5nIGNhcmUgb2YgdGhlIG5lZWRlZFxyXG4gICAgICAgIHdpZHRoIGZvciB0aXRsZSBhbmQgYnV0dG9uc1xyXG4qKi9cclxudmFyIFNtYXJ0TmF2QmFyID0gZnVuY3Rpb24gU21hcnROYXZCYXIoZWwpIHtcclxuICAgIHRoaXMuZWwgPSBlbDtcclxuICAgIFxyXG4gICAgdGhpcy5yZWZyZXNoID0gZnVuY3Rpb24gcmVmcmVzaCgpIHtcclxuICAgICAgICB2YXIgaCA9ICQoZWwpLmNoaWxkcmVuKCdoMScpLmdldCgwKTtcclxuICAgICAgICBpZiAoaClcclxuICAgICAgICAgICAgdGV4dGJveFJlc2l6ZShoKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5yZWZyZXNoKCk7IFxyXG59O1xyXG5cclxuZXhwb3J0cy5TbWFydE5hdkJhciA9IFNtYXJ0TmF2QmFyO1xyXG5cclxuLyoqXHJcbiAgICBHZXQgaW5zdGFuY2VzIGZvciBhbGwgdGhlIFNtYXJ0TmF2QmFyIGVsZW1lbnRzIGluIHRoZSBET01cclxuKiovXHJcbmV4cG9ydHMuZ2V0QWxsID0gZnVuY3Rpb24gZ2V0QWxsKCkge1xyXG4gICAgdmFyIGFsbCA9ICQoJy5TbWFydE5hdkJhcicpO1xyXG4gICAgcmV0dXJuICQubWFwKGFsbCwgZnVuY3Rpb24oaXRlbSkgeyByZXR1cm4gbmV3IFNtYXJ0TmF2QmFyKGl0ZW0pOyB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgUmVmcmVzaCBhbGwgU21hcnROYXZCYXIgZm91bmQgaW4gdGhlIGRvY3VtZW50LlxyXG4qKi9cclxuZXhwb3J0cy5yZWZyZXNoQWxsID0gZnVuY3Rpb24gcmVmcmVzaEFsbCgpIHtcclxuICAgICQoJy5TbWFydE5hdkJhciA+IGgxJykuZWFjaChmdW5jdGlvbigpIHsgdGV4dGJveFJlc2l6ZSh0aGlzKTsgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgQ3VzdG9tIExvY29ub21pY3MgJ2xvY2FsZScgc3R5bGVzIGZvciBkYXRlL3RpbWVzLlxyXG4gICAgSXRzIGEgYml0IG1vcmUgJ2Nvb2wnIHJlbmRlcmluZyBkYXRlcyA7LSlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuLy8gU2luY2UgdGhlIHRhc2sgb2YgZGVmaW5lIGEgbG9jYWxlIGNoYW5nZXNcclxuLy8gdGhlIGN1cnJlbnQgZ2xvYmFsIGxvY2FsZSwgd2Ugc2F2ZSBhIHJlZmVyZW5jZVxyXG4vLyBhbmQgcmVzdG9yZSBpdCBsYXRlciBzbyBub3RoaW5nIGNoYW5nZWQuXHJcbnZhciBjdXJyZW50ID0gbW9tZW50LmxvY2FsZSgpO1xyXG5cclxubW9tZW50LmxvY2FsZSgnZW4tVVMtTEMnLCB7XHJcbiAgICBtZXJpZGllbVBhcnNlIDogL1thcF1cXC4/XFwuPy9pLFxyXG4gICAgbWVyaWRpZW0gOiBmdW5jdGlvbiAoaG91cnMsIG1pbnV0ZXMsIGlzTG93ZXIpIHtcclxuICAgICAgICBpZiAoaG91cnMgPiAxMSkge1xyXG4gICAgICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdwJyA6ICdQJztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdhJyA6ICdBJztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgY2FsZW5kYXIgOiB7XHJcbiAgICAgICAgbGFzdERheSA6ICdbWWVzdGVyZGF5XScsXHJcbiAgICAgICAgc2FtZURheSA6ICdbVG9kYXldJyxcclxuICAgICAgICBuZXh0RGF5IDogJ1tUb21vcnJvd10nLFxyXG4gICAgICAgIGxhc3RXZWVrIDogJ1tsYXN0XSBkZGRkJyxcclxuICAgICAgICBuZXh0V2VlayA6ICdkZGRkJyxcclxuICAgICAgICBzYW1lRWxzZSA6ICdNL0QnXHJcbiAgICB9LFxyXG4gICAgbG9uZ0RhdGVGb3JtYXQgOiB7XHJcbiAgICAgICAgTFQ6ICdoOm1tYScsXHJcbiAgICAgICAgTFRTOiAnaDptbTpzc2EnLFxyXG4gICAgICAgIEw6ICdNTS9ERC9ZWVlZJyxcclxuICAgICAgICBsOiAnTS9EL1lZWVknLFxyXG4gICAgICAgIExMOiAnTU1NTSBEbyBZWVlZJyxcclxuICAgICAgICBsbDogJ01NTSBEIFlZWVknLFxyXG4gICAgICAgIExMTDogJ01NTU0gRG8gWVlZWSBMVCcsXHJcbiAgICAgICAgbGxsOiAnTU1NIEQgWVlZWSBMVCcsXHJcbiAgICAgICAgTExMTDogJ2RkZGQsIE1NTU0gRG8gWVlZWSBMVCcsXHJcbiAgICAgICAgbGxsbDogJ2RkZCwgTU1NIEQgWVlZWSBMVCdcclxuICAgIH1cclxufSk7XHJcblxyXG4vLyBSZXN0b3JlIGxvY2FsZVxyXG5tb21lbnQubG9jYWxlKGN1cnJlbnQpO1xyXG4iLCIvKiogQWRkcmVzcyBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gQWRkcmVzcyh2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBhZGRyZXNzSUQ6IDAsXHJcbiAgICAgICAgYWRkcmVzc05hbWU6ICcnLFxyXG4gICAgICAgIGpvYlRpdGxlSUQ6IDAsXHJcbiAgICAgICAgdXNlcklEOiAwLFxyXG4gICAgICAgIGFkZHJlc3NMaW5lMTogbnVsbCxcclxuICAgICAgICBhZGRyZXNzTGluZTI6IG51bGwsXHJcbiAgICAgICAgcG9zdGFsQ29kZTogbnVsbCxcclxuICAgICAgICBjaXR5OiBudWxsLCAvLyBBdXRvZmlsbGVkIGJ5IHNlcnZlclxyXG4gICAgICAgIHN0YXRlUHJvdmluY2VDb2RlOiBudWxsLCAvLyBBdXRvZmlsbGVkIGJ5IHNlcnZlclxyXG4gICAgICAgIHN0YXRlUHJvdmljZU5hbWU6IG51bGwsIC8vIEF1dG9maWxsZWQgYnkgc2VydmVyXHJcbiAgICAgICAgY291bnRyeUNvZGU6IG51bGwsIC8vIElTTyBBbHBoYS0yIGNvZGUsIEV4LjogJ1VTJ1xyXG4gICAgICAgIGxhdGl0dWRlOiBudWxsLFxyXG4gICAgICAgIGxvbmdpdHVkZTogbnVsbCxcclxuICAgICAgICBzcGVjaWFsSW5zdHJ1Y3Rpb25zOiBudWxsLFxyXG4gICAgICAgIGlzU2VydmljZUFyZWE6IGZhbHNlLFxyXG4gICAgICAgIGlzU2VydmljZUxvY2F0aW9uOiBmYWxzZSxcclxuICAgICAgICBzZXJ2aWNlUmFkaXVzOiAwLFxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBudWxsLCAvLyBBdXRvZmlsbGVkIGJ5IHNlcnZlclxyXG4gICAgICAgIHVwZGF0ZWREYXRlOiBudWxsLCAvLyBBdXRvZmlsbGVkIGJ5IHNlcnZlclxyXG4gICAgICAgIGtpbmQ6ICcnIC8vIEF1dG9maWxsZWQgYnkgc2VydmVyXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNpbmdsZUxpbmUgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgbGlzdCA9IFtcclxuICAgICAgICAgICAgdGhpcy5hZGRyZXNzTGluZTEoKSxcclxuICAgICAgICAgICAgdGhpcy5jaXR5KCksXHJcbiAgICAgICAgICAgIHRoaXMucG9zdGFsQ29kZSgpLFxyXG4gICAgICAgICAgICB0aGlzLnN0YXRlUHJvdmluY2VDb2RlKClcclxuICAgICAgICBdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBsaXN0LmZpbHRlcihmdW5jdGlvbih2KSB7IHJldHVybiAhIXY7IH0pLmpvaW4oJywgJyk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgLy8gVE9ETzogbmVlZGVkPyBsMTBuPyBtdXN0IGJlIHByb3ZpZGVkIGJ5IHNlcnZlciBzaWRlP1xyXG4gICAgdmFyIGNvdW50cmllcyA9IHtcclxuICAgICAgICAnVVMnOiAnVW5pdGVkIFN0YXRlcycsXHJcbiAgICAgICAgJ0VTJzogJ1NwYWluJ1xyXG4gICAgfTtcclxuICAgIHRoaXMuY291bnRyeU5hbWUgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gY291bnRyaWVzW3RoaXMuY291bnRyeUNvZGUoKV0gfHwgJ3Vua25vdyc7XHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAvLyBVc2VmdWwgR1BTIG9iamVjdCB3aXRoIHRoZSBmb3JtYXQgdXNlZCBieSBHb29nbGUgTWFwc1xyXG4gICAgdGhpcy5sYXRsbmcgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBsYXQ6IHRoaXMubGF0aXR1ZGUoKSxcclxuICAgICAgICAgICAgbG5nOiB0aGlzLmxvbmdpdHVkZSgpXHJcbiAgICAgICAgfTtcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFkZHJlc3M7XHJcbiIsIi8qKiBBcHBvaW50bWVudCBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgQ2xpZW50ID0gcmVxdWlyZSgnLi9DbGllbnQnKSxcclxuICAgIExvY2F0aW9uID0gcmVxdWlyZSgnLi9Mb2NhdGlvbicpLFxyXG4gICAgU2VydmljZSA9IHJlcXVpcmUoJy4vU2VydmljZScpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbiAgIFxyXG5mdW5jdGlvbiBBcHBvaW50bWVudCh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBpZDogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBzdGFydFRpbWU6IG51bGwsXHJcbiAgICAgICAgZW5kVGltZTogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICAvLyBFdmVudCBzdW1tYXJ5OlxyXG4gICAgICAgIHN1bW1hcnk6ICdOZXcgYm9va2luZycsXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3VidG90YWxQcmljZTogMCxcclxuICAgICAgICBmZWVQcmljZTogMCxcclxuICAgICAgICBwZmVlUHJpY2U6IDAsXHJcbiAgICAgICAgdG90YWxQcmljZTogMCxcclxuICAgICAgICBwdG90YWxQcmljZTogMCxcclxuICAgICAgICBcclxuICAgICAgICBwcmVOb3Rlc1RvQ2xpZW50OiBudWxsLFxyXG4gICAgICAgIHBvc3ROb3Rlc1RvQ2xpZW50OiBudWxsLFxyXG4gICAgICAgIHByZU5vdGVzVG9TZWxmOiBudWxsLFxyXG4gICAgICAgIHBvc3ROb3Rlc1RvU2VsZjogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdmFsdWVzID0gdmFsdWVzIHx8IHt9O1xyXG5cclxuICAgIHRoaXMuY2xpZW50ID0ga28ub2JzZXJ2YWJsZSh2YWx1ZXMuY2xpZW50ID8gbmV3IENsaWVudCh2YWx1ZXMuY2xpZW50KSA6IG51bGwpO1xyXG5cclxuICAgIHRoaXMubG9jYXRpb24gPSBrby5vYnNlcnZhYmxlKG5ldyBMb2NhdGlvbih2YWx1ZXMubG9jYXRpb24pKTtcclxuICAgIHRoaXMubG9jYXRpb25TdW1tYXJ5ID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYXRpb24oKS5zaW5nbGVMaW5lKCk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZXJ2aWNlcyA9IGtvLm9ic2VydmFibGVBcnJheSgodmFsdWVzLnNlcnZpY2VzIHx8IFtdKS5tYXAoZnVuY3Rpb24oc2VydmljZSkge1xyXG4gICAgICAgIHJldHVybiAoc2VydmljZSBpbnN0YW5jZW9mIFNlcnZpY2UpID8gc2VydmljZSA6IG5ldyBTZXJ2aWNlKHNlcnZpY2UpO1xyXG4gICAgfSkpO1xyXG4gICAgdGhpcy5zZXJ2aWNlc1N1bW1hcnkgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zZXJ2aWNlcygpLm1hcChmdW5jdGlvbihzZXJ2aWNlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzZXJ2aWNlLm5hbWUoKTtcclxuICAgICAgICB9KS5qb2luKCcsICcpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIC8vIFByaWNlIHVwZGF0ZSBvbiBzZXJ2aWNlcyBjaGFuZ2VzXHJcbiAgICAvLyBUT0RPIElzIG5vdCBjb21wbGV0ZSBmb3IgcHJvZHVjdGlvblxyXG4gICAgdGhpcy5zZXJ2aWNlcy5zdWJzY3JpYmUoZnVuY3Rpb24oc2VydmljZXMpIHtcclxuICAgICAgICB0aGlzLnB0b3RhbFByaWNlKHNlcnZpY2VzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHByZXYgKyBjdXIucHJpY2UoKTtcclxuICAgICAgICB9LCAwKSk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgXHJcbiAgICAvLyBTbWFydCB2aXN1YWxpemF0aW9uIG9mIGRhdGUgYW5kIHRpbWVcclxuICAgIHRoaXMuZGlzcGxheWVkRGF0ZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbW9tZW50KHRoaXMuc3RhcnRUaW1lKCkpLmxvY2FsZSgnZW4tVVMtTEMnKS5jYWxlbmRhcigpO1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzcGxheWVkU3RhcnRUaW1lID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBtb21lbnQodGhpcy5zdGFydFRpbWUoKSkubG9jYWxlKCdlbi1VUy1MQycpLmZvcm1hdCgnTFQnKTtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmRpc3BsYXllZEVuZFRpbWUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzLmVuZFRpbWUoKSkubG9jYWxlKCdlbi1VUy1MQycpLmZvcm1hdCgnTFQnKTtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmRpc3BsYXllZFRpbWVSYW5nZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpcy5kaXNwbGF5ZWRTdGFydFRpbWUoKSArICctJyArIHRoaXMuZGlzcGxheWVkRW5kVGltZSgpO1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuaXRTdGFydGVkID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5zdGFydFRpbWUoKSAmJiBuZXcgRGF0ZSgpID49IHRoaXMuc3RhcnRUaW1lKCkpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuaXRFbmRlZCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKHRoaXMuZW5kVGltZSgpICYmIG5ldyBEYXRlKCkgPj0gdGhpcy5lbmRUaW1lKCkpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuaXNOZXcgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICghdGhpcy5pZCgpKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnN0YXRlSGVhZGVyID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciB0ZXh0ID0gJyc7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzTmV3KCkpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXRTdGFydGVkKCkpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLml0RW5kZWQoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQgPSAnQ29tcGxldGVkOic7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gJ05vdzonO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGV4dCA9ICdVcGNvbWluZzonO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGV4dDtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFwcG9pbnRtZW50O1xyXG4iLCIvKiogQm9va2luZ1N1bW1hcnkgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG4gICAgXHJcbmZ1bmN0aW9uIEJvb2tpbmdTdW1tYXJ5KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHF1YW50aXR5OiAwLFxyXG4gICAgICAgIGNvbmNlcHQ6ICcnLFxyXG4gICAgICAgIHRpbWU6IG51bGwsXHJcbiAgICAgICAgdGltZUZvcm1hdDogJyBbQF0gaDptbWEnXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG5cclxuICAgIHRoaXMucGhyYXNlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdmFyIHQgPSB0aGlzLnRpbWVGb3JtYXQoKSAmJiBcclxuICAgICAgICAgICAgdGhpcy50aW1lKCkgJiYgXHJcbiAgICAgICAgICAgIG1vbWVudCh0aGlzLnRpbWUoKSkuZm9ybWF0KHRoaXMudGltZUZvcm1hdCgpKSB8fFxyXG4gICAgICAgICAgICAnJzsgICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbmNlcHQoKSArIHQ7XHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLnVybCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgdXJsID0gdGhpcy50aW1lKCkgJiZcclxuICAgICAgICAgICAgJy9jYWxlbmRhci8nICsgdGhpcy50aW1lKCkudG9JU09TdHJpbmcoKTtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdXJsO1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQm9va2luZ1N1bW1hcnk7XHJcbiIsIi8qKlxyXG4gICAgRXZlbnQgbW9kZWxcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbi8qIEV4YW1wbGUgSlNPTiAocmV0dXJuZWQgYnkgdGhlIFJFU1QgQVBJKTpcclxue1xyXG4gIFwiRXZlbnRJRFwiOiAzNTMsXHJcbiAgXCJVc2VySURcIjogMTQxLFxyXG4gIFwiRXZlbnRUeXBlSURcIjogMyxcclxuICBcIlN1bW1hcnlcIjogXCJIb3VzZWtlZXBlciBzZXJ2aWNlcyBmb3IgSm9obiBELlwiLFxyXG4gIFwiQXZhaWxhYmlsaXR5VHlwZUlEXCI6IDMsXHJcbiAgXCJTdGFydFRpbWVcIjogXCIyMDE0LTAzLTI1VDA4OjAwOjAwWlwiLFxyXG4gIFwiRW5kVGltZVwiOiBcIjIwMTQtMDMtMjVUMTg6MDA6MDBaXCIsXHJcbiAgXCJLaW5kXCI6IDAsXHJcbiAgXCJJc0FsbERheVwiOiBmYWxzZSxcclxuICBcIlRpbWVab25lXCI6IFwiMDE6MDA6MDBcIixcclxuICBcIkxvY2F0aW9uXCI6IFwibnVsbFwiLFxyXG4gIFwiVXBkYXRlZERhdGVcIjogXCIyMDE0LTEwLTMwVDE1OjQ0OjQ5LjY1M1wiLFxyXG4gIFwiQ3JlYXRlZERhdGVcIjogbnVsbCxcclxuICBcIkRlc2NyaXB0aW9uXCI6IFwidGVzdCBkZXNjcmlwdGlvbiBvZiBhIFJFU1QgZXZlbnRcIixcclxuICBcIlJlY3VycmVuY2VSdWxlXCI6IHtcclxuICAgIFwiRnJlcXVlbmN5VHlwZUlEXCI6IDUwMixcclxuICAgIFwiSW50ZXJ2YWxcIjogMSxcclxuICAgIFwiVW50aWxcIjogXCIyMDE0LTA3LTAxVDAwOjAwOjAwXCIsXHJcbiAgICBcIkNvdW50XCI6IG51bGwsXHJcbiAgICBcIkVuZGluZ1wiOiBcImRhdGVcIixcclxuICAgIFwiU2VsZWN0ZWRXZWVrRGF5c1wiOiBbXHJcbiAgICAgIDEsXHJcbiAgICBdLFxyXG4gICAgXCJNb250aGx5V2Vla0RheVwiOiBmYWxzZSxcclxuICAgIFwiSW5jb21wYXRpYmxlXCI6IGZhbHNlLFxyXG4gICAgXCJUb29NYW55XCI6IGZhbHNlXHJcbiAgfSxcclxuICBcIlJlY3VycmVuY2VPY2N1cnJlbmNlc1wiOiBudWxsLFxyXG4gIFwiUmVhZE9ubHlcIjogZmFsc2VcclxufSovXHJcblxyXG5mdW5jdGlvbiBSZWN1cnJlbmNlUnVsZSh2YWx1ZXMpIHtcclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGZyZXF1ZW5jeVR5cGVJRDogMCxcclxuICAgICAgICBpbnRlcnZhbDogMSwgLy86SW50ZWdlclxyXG4gICAgICAgIHVudGlsOiBudWxsLCAvLzpEYXRlXHJcbiAgICAgICAgY291bnQ6IG51bGwsIC8vOkludGVnZXJcclxuICAgICAgICBlbmRpbmc6IG51bGwsIC8vIDpzdHJpbmcgUG9zc2libGUgdmFsdWVzIGFsbG93ZWQ6ICduZXZlcicsICdkYXRlJywgJ29jdXJyZW5jZXMnXHJcbiAgICAgICAgc2VsZWN0ZWRXZWVrRGF5czogW10sIC8vIDppbnRlZ2VyW10gMDpTdW5kYXlcclxuICAgICAgICBtb250aGx5V2Vla0RheTogZmFsc2UsXHJcbiAgICAgICAgaW5jb21wYXRpYmxlOiBmYWxzZSxcclxuICAgICAgICB0b29NYW55OiBmYWxzZVxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gUmVjdXJyZW5jZU9jY3VycmVuY2UodmFsdWVzKSB7XHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBzdGFydFRpbWU6IG51bGwsIC8vOkRhdGVcclxuICAgICAgICBlbmRUaW1lOiBudWxsIC8vOkRhdGVcclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG4gICBcclxuZnVuY3Rpb24gQ2FsZW5kYXJFdmVudCh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgY2FsZW5kYXJFdmVudElEOiAwLFxyXG4gICAgICAgIHVzZXJJRDogMCxcclxuICAgICAgICBldmVudFR5cGVJRDogMyxcclxuICAgICAgICBzdW1tYXJ5OiAnJyxcclxuICAgICAgICBhdmFpbGFiaWxpdHlUeXBlSUQ6IDAsXHJcbiAgICAgICAgc3RhcnRUaW1lOiBudWxsLFxyXG4gICAgICAgIGVuZFRpbWU6IG51bGwsXHJcbiAgICAgICAga2luZDogMCxcclxuICAgICAgICBpc0FsbERheTogZmFsc2UsXHJcbiAgICAgICAgdGltZVpvbmU6ICdaJyxcclxuICAgICAgICBsb2NhdGlvbjogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJycsXHJcbiAgICAgICAgcmVhZE9ubHk6IGZhbHNlXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG5cclxuICAgIHRoaXMucmVjdXJyZW5jZVJ1bGUgPSBrby5vYnNlcnZhYmxlKFxyXG4gICAgICAgIHZhbHVlcyAmJiBcclxuICAgICAgICB2YWx1ZXMucmVjdXJyZW5jZVJ1bGUgJiYgXHJcbiAgICAgICAgbmV3IFJlY3VycmVuY2VSdWxlKHZhbHVlcy5yZWN1cnJlbmNlUnVsZSlcclxuICAgICk7XHJcbiAgICB0aGlzLnJlY3VycmVuY2VPY2N1cnJlbmNlcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7IC8vOlJlY3VycmVuY2VPY2N1cnJlbmNlW11cclxuICAgIGlmICh2YWx1ZXMgJiYgdmFsdWVzLnJlY3VycmVuY2VPY2N1cnJlbmNlcykge1xyXG4gICAgICAgIHZhbHVlcy5yZWN1cnJlbmNlT2NjdXJyZW5jZXMuZm9yRWFjaChmdW5jdGlvbihvY2N1cnJlbmNlKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLlJlY3VycmVuY2VPY2N1cnJlbmNlcy5wdXNoKG5ldyBSZWN1cnJlbmNlT2NjdXJyZW5jZShvY2N1cnJlbmNlKSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ2FsZW5kYXJFdmVudDtcclxuXHJcbkNhbGVuZGFyRXZlbnQuUmVjdXJyZW5jZVJ1bGUgPSBSZWN1cnJlbmNlUnVsZTtcclxuQ2FsZW5kYXJFdmVudC5SZWN1cnJlbmNlT2NjdXJyZW5jZSA9IFJlY3VycmVuY2VPY2N1cnJlbmNlOyIsIi8qKiBDYWxlbmRhclNsb3QgbW9kZWwuXHJcblxyXG4gICAgRGVzY3JpYmVzIGEgdGltZSBzbG90IGluIHRoZSBjYWxlbmRhciwgZm9yIGEgY29uc2VjdXRpdmVcclxuICAgIGV2ZW50LCBhcHBvaW50bWVudCBvciBmcmVlIHRpbWUuXHJcbiAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgQ2xpZW50ID0gcmVxdWlyZSgnLi9DbGllbnQnKTtcclxuXHJcbmZ1bmN0aW9uIENhbGVuZGFyU2xvdCh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBzdGFydFRpbWU6IG51bGwsXHJcbiAgICAgICAgZW5kVGltZTogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBjbGFzc05hbWVzOiAnJ1xyXG5cclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ2FsZW5kYXJTbG90O1xyXG4iLCIvKipcclxuICAgIENhbGVuZGFyU3luY2luZyBtb2RlbC5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBDYWxlbmRhclN5bmNpbmcodmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBpY2FsRXhwb3J0VXJsOiAnJyxcclxuICAgICAgICBpY2FsSW1wb3J0VXJsOiAnJ1xyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDYWxlbmRhclN5bmNpbmc7XHJcbiIsIi8qKiBDbGllbnQgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIENsaWVudCh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgaWQ6IDAsXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnJyxcclxuICAgICAgICBsYXN0TmFtZTogJycsXHJcbiAgICAgICAgZW1haWw6ICcnLFxyXG4gICAgICAgIG1vYmlsZVBob25lOiBudWxsLFxyXG4gICAgICAgIGFsdGVybmF0ZVBob25lOiBudWxsLFxyXG4gICAgICAgIGJpcnRoTW9udGhEYXk6IG51bGwsXHJcbiAgICAgICAgYmlydGhNb250aDogbnVsbCxcclxuICAgICAgICBub3Rlc0Fib3V0Q2xpZW50OiBudWxsXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG5cclxuICAgIHRoaXMuZnVsbE5hbWUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLmZpcnN0TmFtZSgpICsgJyAnICsgdGhpcy5sYXN0TmFtZSgpKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmJpcnRoRGF5ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmJpcnRoTW9udGhEYXkoKSAmJlxyXG4gICAgICAgICAgICB0aGlzLmJpcnRoTW9udGgoKSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVE9ETyBpMTBuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJpcnRoTW9udGgoKSArICcvJyArIHRoaXMuYmlydGhNb250aERheSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMucGhvbmVOdW1iZXIgPSBrby5wdXJlQ29tcHV0ZWQoe1xyXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgbSA9IHRoaXMubW9iaWxlUGhvbmUoKSxcclxuICAgICAgICAgICAgICAgIGEgPSB0aGlzLmFsdGVybmF0ZVBob25lKCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbSA/IG0gOiBhO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgICAgLy8gVE9ET1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3duZXI6IHRoaXNcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLmNhblJlY2VpdmVTbXMgPSBrby5wdXJlQ29tcHV0ZWQoe1xyXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgbSA9IHRoaXMubW9iaWxlUGhvbmUoKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBtID8gdHJ1ZSA6IGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgICAgLy8gVE9ET1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3duZXI6IHRoaXNcclxuICAgIH0pO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENsaWVudDtcclxuIiwiLyoqIEdldE1vcmUgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIExpc3RWaWV3SXRlbSA9IHJlcXVpcmUoJy4vTGlzdFZpZXdJdGVtJyk7XHJcblxyXG5mdW5jdGlvbiBHZXRNb3JlKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgYXZhaWxhYmlsaXR5OiBmYWxzZSxcclxuICAgICAgICBwYXltZW50czogZmFsc2UsXHJcbiAgICAgICAgcHJvZmlsZTogZmFsc2UsXHJcbiAgICAgICAgY29vcDogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHZhciBhdmFpbGFibGVJdGVtcyA9IHtcclxuICAgICAgICBhdmFpbGFiaWxpdHk6IG5ldyBMaXN0Vmlld0l0ZW0oe1xyXG4gICAgICAgICAgICBjb250ZW50TGluZTE6ICdDb21wbGV0ZSB5b3VyIGF2YWlsYWJpbGl0eSB0byBjcmVhdGUgYSBjbGVhbmVyIGNhbGVuZGFyJyxcclxuICAgICAgICAgICAgbWFya2VySWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tY2FsZW5kYXInLFxyXG4gICAgICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0J1xyXG4gICAgICAgIH0pLFxyXG4gICAgICAgIHBheW1lbnRzOiBuZXcgTGlzdFZpZXdJdGVtKHtcclxuICAgICAgICAgICAgY29udGVudExpbmUxOiAnU3RhcnQgYWNjZXB0aW5nIHBheW1lbnRzIHRocm91Z2ggTG9jb25vbWljcycsXHJcbiAgICAgICAgICAgIG1hcmtlckljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXVzZCcsXHJcbiAgICAgICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tcmlnaHQnXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgcHJvZmlsZTogbmV3IExpc3RWaWV3SXRlbSh7XHJcbiAgICAgICAgICAgIGNvbnRlbnRMaW5lMTogJ0FjdGl2YXRlIHlvdXIgcHJvZmlsZSBpbiB0aGUgbWFya2V0cGxhY2UnLFxyXG4gICAgICAgICAgICBtYXJrZXJJY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi11c2VyJyxcclxuICAgICAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1yaWdodCdcclxuICAgICAgICB9KSxcclxuICAgICAgICBjb29wOiBuZXcgTGlzdFZpZXdJdGVtKHtcclxuICAgICAgICAgICAgY29udGVudExpbmUxOiAnTGVhcm4gbW9yZSBhYm91dCBvdXIgY29vcGVyYXRpdmUnLFxyXG4gICAgICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0J1xyXG4gICAgICAgIH0pXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXRlbXMgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGl0ZW1zID0gW107XHJcbiAgICAgICAgXHJcbiAgICAgICAgT2JqZWN0LmtleXMoYXZhaWxhYmxlSXRlbXMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAodGhpc1trZXldKCkpXHJcbiAgICAgICAgICAgICAgICBpdGVtcy5wdXNoKGF2YWlsYWJsZUl0ZW1zW2tleV0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBpdGVtcztcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEdldE1vcmU7XHJcbiIsIi8qKiBMaXN0Vmlld0l0ZW0gbW9kZWwuXHJcblxyXG4gICAgRGVzY3JpYmVzIGEgZ2VuZXJpYyBpdGVtIG9mIGFcclxuICAgIExpc3RWaWV3IGNvbXBvbmVudC5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbmZ1bmN0aW9uIExpc3RWaWV3SXRlbSh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBtYXJrZXJMaW5lMTogbnVsbCxcclxuICAgICAgICBtYXJrZXJMaW5lMjogbnVsbCxcclxuICAgICAgICBtYXJrZXJJY29uOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnRlbnRMaW5lMTogJycsXHJcbiAgICAgICAgY29udGVudExpbmUyOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICcnXHJcblxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMaXN0Vmlld0l0ZW07XHJcbiIsIi8qKiBMb2NhdGlvbiBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gTG9jYXRpb24odmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgbG9jYXRpb25JRDogMCxcclxuICAgICAgICBuYW1lOiAnJyxcclxuICAgICAgICBhZGRyZXNzTGluZTE6IG51bGwsXHJcbiAgICAgICAgYWRkcmVzc0xpbmUyOiBudWxsLFxyXG4gICAgICAgIGNpdHk6IG51bGwsXHJcbiAgICAgICAgc3RhdGVQcm92aW5jZUNvZGU6IG51bGwsXHJcbiAgICAgICAgc3RhdGVQcm92aWNlSUQ6IG51bGwsXHJcbiAgICAgICAgcG9zdGFsQ29kZTogbnVsbCxcclxuICAgICAgICBwb3N0YWxDb2RlSUQ6IG51bGwsXHJcbiAgICAgICAgY291bnRyeUlEOiBudWxsLFxyXG4gICAgICAgIGxhdGl0dWRlOiBudWxsLFxyXG4gICAgICAgIGxvbmdpdHVkZTogbnVsbCxcclxuICAgICAgICBzcGVjaWFsSW5zdHJ1Y3Rpb25zOiBudWxsLFxyXG4gICAgICAgIGlzU2VydmljZVJhZGl1czogZmFsc2UsXHJcbiAgICAgICAgaXNTZXJ2aWNlTG9jYXRpb246IGZhbHNlLFxyXG4gICAgICAgIHNlcnZpY2VSYWRpdXM6IDBcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2luZ2xlTGluZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBsaXN0ID0gW1xyXG4gICAgICAgICAgICB0aGlzLmFkZHJlc3NMaW5lMSgpLFxyXG4gICAgICAgICAgICB0aGlzLmNpdHkoKSxcclxuICAgICAgICAgICAgdGhpcy5wb3N0YWxDb2RlKCksXHJcbiAgICAgICAgICAgIHRoaXMuc3RhdGVQcm92aW5jZUNvZGUoKVxyXG4gICAgICAgIF07XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGxpc3QuZmlsdGVyKGZ1bmN0aW9uKHYpIHsgcmV0dXJuICEhdjsgfSkuam9pbignLCAnKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmNvdW50cnlOYW1lID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5jb3VudHJ5SUQoKSA9PT0gMSA/XHJcbiAgICAgICAgICAgICdVbml0ZWQgU3RhdGVzJyA6XHJcbiAgICAgICAgICAgIHRoaXMuY291bnRyeUlEKCkgPT09IDIgP1xyXG4gICAgICAgICAgICAnU3BhaW4nIDpcclxuICAgICAgICAgICAgJ3Vua25vdydcclxuICAgICAgICApO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuY291bnRyeUNvZGVBbHBoYTIgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmNvdW50cnlJRCgpID09PSAxID9cclxuICAgICAgICAgICAgJ1VTJyA6XHJcbiAgICAgICAgICAgIHRoaXMuY291bnRyeUlEKCkgPT09IDIgP1xyXG4gICAgICAgICAgICAnRVMnIDpcclxuICAgICAgICAgICAgJydcclxuICAgICAgICApO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubGF0bG5nID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgbGF0OiB0aGlzLmxhdGl0dWRlKCksXHJcbiAgICAgICAgICAgIGxuZzogdGhpcy5sb25naXR1ZGUoKVxyXG4gICAgICAgIH07XHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMb2NhdGlvbjtcclxuIiwiLyoqIE1haWxGb2xkZXIgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpLFxyXG4gICAgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xyXG5cclxuZnVuY3Rpb24gTWFpbEZvbGRlcih2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIG1lc3NhZ2VzOiBbXSxcclxuICAgICAgICB0b3BOdW1iZXI6IDEwXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnRvcCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbiB0b3AobnVtKSB7XHJcbiAgICAgICAgaWYgKG51bSkgdGhpcy50b3BOdW1iZXIobnVtKTtcclxuICAgICAgICByZXR1cm4gXy5maXJzdCh0aGlzLm1lc3NhZ2VzKCksIHRoaXMudG9wTnVtYmVyKCkpO1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWFpbEZvbGRlcjtcclxuIiwiLyoqIE1hcmtldHBsYWNlUHJvZmlsZSBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gTWFya2V0cGxhY2VQcm9maWxlKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICB1c2VySUQ6IDAsXHJcbiAgICAgICAgXHJcbiAgICAgICAgcHVibGljQmlvOiAnJyxcclxuICAgICAgICBmcmVlbGFuY2VyUHJvZmlsZVVybFNsdWc6ICcnLFxyXG4gICAgICAgIC8vIFRoaXMgaXMgYSBzZXJ2ZXItc2lkZSBjb21wdXRlZCB2YXJpYWJsZSAocmVhZC1vbmx5IGZvciB0aGUgdXNlcikgZm9yIGEgTG9jb25vbWljcyBhZGRyZXNzXHJcbiAgICAgICAgLy8gY3JlYXRlZCB1c2luZyB0aGUgZnJlZWxhbmNlclByb2ZpbGVVcmxTbHVnIGlmIGFueSBvciB0aGUgZmFsbGJhY2sgc3lzdGVtIFVSTC5cclxuICAgICAgICBmcmVlbGFuY2VyUHJvZmlsZVVybDogJycsXHJcbiAgICAgICAgLy8gU3BlY2lmeSBhbiBleHRlcm5hbCB3ZWJzaXRlIG9mIHRoZSBmcmVlbGFuY2VyLlxyXG4gICAgICAgIGZyZWVsYW5jZXJXZWJzaXRlVXJsOiAnJyxcclxuICAgICAgICAvLyBTZXJ2ZXItc2lkZSBnZW5lcmF0ZWQgY29kZSB0aGF0IGFsbG93cyB0byBpZGVudGlmaWNhdGUgc3BlY2lhbCBib29raW5nIHJlcXVlc3RzXHJcbiAgICAgICAgLy8gZnJvbSB0aGUgYm9vay1tZS1ub3cgYnV0dG9uLiBUaGUgc2VydmVyIGVuc3VyZXMgdGhhdCB0aGVyZSBpcyBldmVyIGEgdmFsdWUgb24gdGhpcyBmb3IgZnJlZWxhbmNlcnMuXHJcbiAgICAgICAgYm9va0NvZGU6ICcnLFxyXG5cclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNYXJrZXRwbGFjZVByb2ZpbGU7XHJcbiIsIi8qKiBNZXNzYWdlIG1vZGVsLlxyXG5cclxuICAgIERlc2NyaWJlcyBhIG1lc3NhZ2UgZnJvbSBhIE1haWxGb2xkZXIuXHJcbiAgICBBIG1lc3NhZ2UgY291bGQgYmUgb2YgZGlmZmVyZW50IHR5cGVzLFxyXG4gICAgYXMgaW5xdWlyaWVzLCBib29raW5ncywgYm9va2luZyByZXF1ZXN0cy5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuLy9UT0RPICAgVGhyZWFkID0gcmVxdWlyZSgnLi9UaHJlYWQnKTtcclxuXHJcbmZ1bmN0aW9uIE1lc3NhZ2UodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgaWQ6IDAsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJycsXHJcbiAgICAgICAgY29udGVudDogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBjbGFzc05hbWVzOiAnJ1xyXG5cclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIC8vIFNtYXJ0IHZpc3VhbGl6YXRpb24gb2YgZGF0ZSBhbmQgdGltZVxyXG4gICAgdGhpcy5kaXNwbGF5ZWREYXRlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBtb21lbnQodGhpcy5jcmVhdGVkRGF0ZSgpKS5sb2NhbGUoJ2VuLVVTLUxDJykuY2FsZW5kYXIoKTtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmRpc3BsYXllZFRpbWUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzLmNyZWF0ZWREYXRlKCkpLmxvY2FsZSgnZW4tVVMtTEMnKS5mb3JtYXQoJ0xUJyk7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNZXNzYWdlO1xyXG4iLCIvKipcclxuICAgIE1vZGVsIGNsYXNzIHRvIGhlbHAgYnVpbGQgbW9kZWxzLlxyXG5cclxuICAgIElzIG5vdCBleGFjdGx5IGFuICdPT1AgYmFzZScgY2xhc3MsIGJ1dCBwcm92aWRlc1xyXG4gICAgdXRpbGl0aWVzIHRvIG1vZGVscyBhbmQgYSBtb2RlbCBkZWZpbml0aW9uIG9iamVjdFxyXG4gICAgd2hlbiBleGVjdXRlZCBpbiB0aGVpciBjb25zdHJ1Y3RvcnMgYXM6XHJcbiAgICBcclxuICAgICcnJ1xyXG4gICAgZnVuY3Rpb24gTXlNb2RlbCgpIHtcclxuICAgICAgICBNb2RlbCh0aGlzKTtcclxuICAgICAgICAvLyBOb3csIHRoZXJlIGlzIGEgdGhpcy5tb2RlbCBwcm9wZXJ0eSB3aXRoXHJcbiAgICAgICAgLy8gYW4gaW5zdGFuY2Ugb2YgdGhlIE1vZGVsIGNsYXNzLCB3aXRoIFxyXG4gICAgICAgIC8vIHV0aWxpdGllcyBhbmQgbW9kZWwgc2V0dGluZ3MuXHJcbiAgICB9XHJcbiAgICAnJydcclxuICAgIFxyXG4gICAgVGhhdCBhdXRvIGNyZWF0aW9uIG9mICdtb2RlbCcgcHJvcGVydHkgY2FuIGJlIGF2b2lkZWRcclxuICAgIHdoZW4gdXNpbmcgdGhlIG9iamVjdCBpbnN0YW50aWF0aW9uIHN5bnRheCAoJ25ldycga2V5d29yZCk6XHJcbiAgICBcclxuICAgICcnJ1xyXG4gICAgdmFyIG1vZGVsID0gbmV3IE1vZGVsKG9iaik7XHJcbiAgICAvLyBUaGVyZSBpcyBubyBhICdvYmoubW9kZWwnIHByb3BlcnR5LCBjYW4gYmVcclxuICAgIC8vIGFzc2lnbmVkIHRvIHdoYXRldmVyIHByb3BlcnR5IG9yIG5vdGhpbmcuXHJcbiAgICAnJydcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxua28ubWFwcGluZyA9IHJlcXVpcmUoJ2tub2Nrb3V0Lm1hcHBpbmcnKTtcclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGNsb25lID0gZnVuY3Rpb24ob2JqKSB7IHJldHVybiAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqKTsgfTtcclxuXHJcbmZ1bmN0aW9uIE1vZGVsKG1vZGVsT2JqZWN0KSB7XHJcbiAgICBcclxuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBNb2RlbCkpIHtcclxuICAgICAgICAvLyBFeGVjdXRlZCBhcyBhIGZ1bmN0aW9uLCBpdCBtdXN0IGNyZWF0ZVxyXG4gICAgICAgIC8vIGEgTW9kZWwgaW5zdGFuY2VcclxuICAgICAgICB2YXIgbW9kZWwgPSBuZXcgTW9kZWwobW9kZWxPYmplY3QpO1xyXG4gICAgICAgIC8vIGFuZCByZWdpc3RlciBhdXRvbWF0aWNhbGx5IGFzIHBhcnRcclxuICAgICAgICAvLyBvZiB0aGUgbW9kZWxPYmplY3QgaW4gJ21vZGVsJyBwcm9wZXJ0eVxyXG4gICAgICAgIG1vZGVsT2JqZWN0Lm1vZGVsID0gbW9kZWw7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gUmV0dXJucyB0aGUgaW5zdGFuY2VcclxuICAgICAgICByZXR1cm4gbW9kZWw7XHJcbiAgICB9XHJcbiBcclxuICAgIC8vIEl0IGluY2x1ZGVzIGEgcmVmZXJlbmNlIHRvIHRoZSBvYmplY3RcclxuICAgIHRoaXMubW9kZWxPYmplY3QgPSBtb2RlbE9iamVjdDtcclxuICAgIC8vIEl0IG1haW50YWlucyBhIGxpc3Qgb2YgcHJvcGVydGllcyBhbmQgZmllbGRzXHJcbiAgICB0aGlzLnByb3BlcnRpZXNMaXN0ID0gW107XHJcbiAgICB0aGlzLmZpZWxkc0xpc3QgPSBbXTtcclxuICAgIC8vIEl0IGFsbG93IHNldHRpbmcgdGhlICdrby5tYXBwaW5nLmZyb21KUycgbWFwcGluZyBvcHRpb25zXHJcbiAgICAvLyB0byBjb250cm9sIGNvbnZlcnNpb25zIGZyb20gcGxhaW4gSlMgb2JqZWN0cyB3aGVuIFxyXG4gICAgLy8gJ3VwZGF0ZVdpdGgnLlxyXG4gICAgdGhpcy5tYXBwaW5nT3B0aW9ucyA9IHt9O1xyXG4gICAgXHJcbiAgICAvLyBUaW1lc3RhbXAgd2l0aCB0aGUgZGF0ZSBvZiBsYXN0IGNoYW5nZVxyXG4gICAgLy8gaW4gdGhlIGRhdGEgKGF1dG9tYXRpY2FsbHkgdXBkYXRlZCB3aGVuIGNoYW5nZXNcclxuICAgIC8vIGhhcHBlbnMgb24gcHJvcGVydGllczsgZmllbGRzIG9yIGFueSBvdGhlciBtZW1iZXJcclxuICAgIC8vIGFkZGVkIHRvIHRoZSBtb2RlbCBjYW5ub3QgYmUgb2JzZXJ2ZWQgZm9yIGNoYW5nZXMsXHJcbiAgICAvLyByZXF1aXJpbmcgbWFudWFsIHVwZGF0aW5nIHdpdGggYSAnbmV3IERhdGUoKScsIGJ1dCBpc1xyXG4gICAgLy8gYmV0dGVyIHRvIHVzZSBwcm9wZXJ0aWVzLlxyXG4gICAgLy8gSXRzIHJhdGVkIHRvIHplcm8ganVzdCB0byBhdm9pZCB0aGF0IGNvbnNlY3V0aXZlXHJcbiAgICAvLyBzeW5jaHJvbm91cyBjaGFuZ2VzIGVtaXQgbG90IG9mIG5vdGlmaWNhdGlvbnMsIHNwZWNpYWxseVxyXG4gICAgLy8gd2l0aCBidWxrIHRhc2tzIGxpa2UgJ3VwZGF0ZVdpdGgnLlxyXG4gICAgdGhpcy5kYXRhVGltZXN0YW1wID0ga28ub2JzZXJ2YWJsZShuZXcgRGF0ZSgpKS5leHRlbmQoeyByYXRlTGltaXQ6IDAgfSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTW9kZWw7XHJcblxyXG4vKipcclxuICAgIERlZmluZSBvYnNlcnZhYmxlIHByb3BlcnRpZXMgdXNpbmcgdGhlIGdpdmVuXHJcbiAgICBwcm9wZXJ0aWVzIG9iamVjdCBkZWZpbml0aW9uIHRoYXQgaW5jbHVkZXMgZGUgZGVmYXVsdCB2YWx1ZXMsXHJcbiAgICBhbmQgc29tZSBvcHRpb25hbCBpbml0aWFsVmFsdWVzIChub3JtYWxseSB0aGF0IGlzIHByb3ZpZGVkIGV4dGVybmFsbHlcclxuICAgIGFzIGEgcGFyYW1ldGVyIHRvIHRoZSBtb2RlbCBjb25zdHJ1Y3Rvciwgd2hpbGUgZGVmYXVsdCB2YWx1ZXMgYXJlXHJcbiAgICBzZXQgaW4gdGhlIGNvbnN0cnVjdG9yKS5cclxuICAgIFRoYXQgcHJvcGVydGllcyBiZWNvbWUgbWVtYmVycyBvZiB0aGUgbW9kZWxPYmplY3QsIHNpbXBsaWZ5aW5nIFxyXG4gICAgbW9kZWwgZGVmaW5pdGlvbnMuXHJcbiAgICBcclxuICAgIEl0IHVzZXMgS25vY2tvdXQub2JzZXJ2YWJsZSBhbmQgb2JzZXJ2YWJsZUFycmF5LCBzbyBwcm9wZXJ0aWVzXHJcbiAgICBhcmUgZnVudGlvbnMgdGhhdCByZWFkcyB0aGUgdmFsdWUgd2hlbiBubyBhcmd1bWVudHMgb3Igc2V0cyB3aGVuXHJcbiAgICBvbmUgYXJndW1lbnQgaXMgcGFzc2VkIG9mLlxyXG4qKi9cclxuTW9kZWwucHJvdG90eXBlLmRlZlByb3BlcnRpZXMgPSBmdW5jdGlvbiBkZWZQcm9wZXJ0aWVzKHByb3BlcnRpZXMsIGluaXRpYWxWYWx1ZXMpIHtcclxuXHJcbiAgICBpbml0aWFsVmFsdWVzID0gaW5pdGlhbFZhbHVlcyB8fCB7fTtcclxuXHJcbiAgICB2YXIgbW9kZWxPYmplY3QgPSB0aGlzLm1vZGVsT2JqZWN0LFxyXG4gICAgICAgIHByb3BlcnRpZXNMaXN0ID0gdGhpcy5wcm9wZXJ0aWVzTGlzdCxcclxuICAgICAgICBkYXRhVGltZXN0YW1wID0gdGhpcy5kYXRhVGltZXN0YW1wO1xyXG5cclxuICAgIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRlZlZhbCA9IHByb3BlcnRpZXNba2V5XTtcclxuICAgICAgICAvLyBDcmVhdGUgb2JzZXJ2YWJsZSBwcm9wZXJ0eSB3aXRoIGRlZmF1bHQgdmFsdWVcclxuICAgICAgICBtb2RlbE9iamVjdFtrZXldID0gQXJyYXkuaXNBcnJheShkZWZWYWwpID9cclxuICAgICAgICAgICAga28ub2JzZXJ2YWJsZUFycmF5KGRlZlZhbCkgOlxyXG4gICAgICAgICAgICBrby5vYnNlcnZhYmxlKGRlZlZhbCk7XHJcbiAgICAgICAgLy8gUmVtZW1iZXIgZGVmYXVsdFxyXG4gICAgICAgIG1vZGVsT2JqZWN0W2tleV0uX2RlZmF1bHRWYWx1ZSA9IGRlZlZhbDtcclxuICAgICAgICAvLyByZW1lbWJlciBpbml0aWFsXHJcbiAgICAgICAgbW9kZWxPYmplY3Rba2V5XS5faW5pdGlhbFZhbHVlID0gaW5pdGlhbFZhbHVlc1trZXldO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIGFuIGluaXRpYWxWYWx1ZSwgc2V0IGl0OlxyXG4gICAgICAgIGlmICh0eXBlb2YoaW5pdGlhbFZhbHVlc1trZXldKSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgbW9kZWxPYmplY3Rba2V5XShpbml0aWFsVmFsdWVzW2tleV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBBZGQgc3Vic2NyaWJlciB0byB1cGRhdGUgdGhlIHRpbWVzdGFtcCBvbiBjaGFuZ2VzXHJcbiAgICAgICAgbW9kZWxPYmplY3Rba2V5XS5zdWJzY3JpYmUoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGRhdGFUaW1lc3RhbXAobmV3IERhdGUoKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQWRkIHRvIHRoZSBpbnRlcm5hbCByZWdpc3RyeVxyXG4gICAgICAgIHByb3BlcnRpZXNMaXN0LnB1c2goa2V5KTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBVcGRhdGUgdGltZXN0YW1wIGFmdGVyIHRoZSBidWxrIGNyZWF0aW9uLlxyXG4gICAgZGF0YVRpbWVzdGFtcChuZXcgRGF0ZSgpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgRGVmaW5lIGZpZWxkcyBhcyBwbGFpbiBtZW1iZXJzIG9mIHRoZSBtb2RlbE9iamVjdCB1c2luZ1xyXG4gICAgdGhlIGZpZWxkcyBvYmplY3QgZGVmaW5pdGlvbiB0aGF0IGluY2x1ZGVzIGRlZmF1bHQgdmFsdWVzLFxyXG4gICAgYW5kIHNvbWUgb3B0aW9uYWwgaW5pdGlhbFZhbHVlcy5cclxuICAgIFxyXG4gICAgSXRzIGxpa2UgZGVmUHJvcGVydGllcywgYnV0IGZvciBwbGFpbiBqcyB2YWx1ZXMgcmF0aGVyIHRoYW4gb2JzZXJ2YWJsZXMuXHJcbioqL1xyXG5Nb2RlbC5wcm90b3R5cGUuZGVmRmllbGRzID0gZnVuY3Rpb24gZGVmRmllbGRzKGZpZWxkcywgaW5pdGlhbFZhbHVlcykge1xyXG5cclxuICAgIGluaXRpYWxWYWx1ZXMgPSBpbml0aWFsVmFsdWVzIHx8IHt9O1xyXG5cclxuICAgIHZhciBtb2RlbE9iamVjdCA9IHRoaXMubW9kZWxPYmplY3QsXHJcbiAgICAgICAgZmllbGRzTGlzdCA9IHRoaXMuZmllbGRzTGlzdDtcclxuXHJcbiAgICBPYmplY3Qua2V5cyhmaWVsZHMpLmVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRlZlZhbCA9IGZpZWxkc1trZXldO1xyXG4gICAgICAgIC8vIENyZWF0ZSBmaWVsZCB3aXRoIGRlZmF1bHQgdmFsdWVcclxuICAgICAgICBtb2RlbE9iamVjdFtrZXldID0gZGVmVmFsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIGFuIGluaXRpYWxWYWx1ZSwgc2V0IGl0OlxyXG4gICAgICAgIGlmICh0eXBlb2YoaW5pdGlhbFZhbHVlc1trZXldKSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgbW9kZWxPYmplY3Rba2V5XSA9IGluaXRpYWxWYWx1ZXNba2V5XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQWRkIHRvIHRoZSBpbnRlcm5hbCByZWdpc3RyeVxyXG4gICAgICAgIGZpZWxkc0xpc3QucHVzaChrZXkpO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIFN0b3JlIHRoZSBsaXN0IG9mIGZpZWxkcyB0aGF0IG1ha2UgdGhlIElEL3ByaW1hcnkga2V5XHJcbiAgICBhbmQgY3JlYXRlIGFuIGFsaWFzICdpZCcgcHJvcGVydHkgdGhhdCByZXR1cm5zIHRoZVxyXG4gICAgdmFsdWUgZm9yIHRoZSBJRCBmaWVsZCBvciBhcnJheSBvZiB2YWx1ZXMgd2hlbiBtdWx0aXBsZVxyXG4gICAgZmllbGRzLlxyXG4qKi9cclxuTW9kZWwucHJvdG90eXBlLmRlZklEID0gZnVuY3Rpb24gZGVmSUQoZmllbGRzTmFtZXMpIHtcclxuICAgIFxyXG4gICAgLy8gU3RvcmUgdGhlIGxpc3RcclxuICAgIHRoaXMuaWRGaWVsZHNOYW1lcyA9IGZpZWxkc05hbWVzO1xyXG4gICAgXHJcbiAgICAvLyBEZWZpbmUgSUQgb2JzZXJ2YWJsZVxyXG4gICAgaWYgKGZpZWxkc05hbWVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIC8vIFJldHVybnMgc2luZ2xlIHZhbHVlXHJcbiAgICAgICAgdmFyIGZpZWxkID0gZmllbGRzTmFtZXNbMF07XHJcbiAgICAgICAgdGhpcy5tb2RlbE9iamVjdC5pZCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbZmllbGRdKCk7XHJcbiAgICAgICAgfSwgdGhpcy5tb2RlbE9iamVjdCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICB0aGlzLm1vZGVsT2JqZWN0LmlkID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmllbGRzTmFtZXMubWFwKGZ1bmN0aW9uKGZpZWxkTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbZmllbGRdKCk7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICAgICAgfSwgdGhpcy5tb2RlbE9iamVjdCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICAgIEFsbG93cyB0byByZWdpc3RlciBhIHByb3BlcnR5IChwcmV2aW91c2x5IGRlZmluZWQpIGFzIFxyXG4gICAgdGhlIG1vZGVsIHRpbWVzdGFtcCwgc28gZ2V0cyB1cGRhdGVkIG9uIGFueSBkYXRhIGNoYW5nZVxyXG4gICAgKGtlZXAgaW4gc3luYyB3aXRoIHRoZSBpbnRlcm5hbCBkYXRhVGltZXN0YW1wKS5cclxuKiovXHJcbk1vZGVsLnByb3RvdHlwZS5yZWdUaW1lc3RhbXAgPSBmdW5jdGlvbiByZWdUaW1lc3RhbXBQcm9wZXJ0eShwcm9wZXJ0eU5hbWUpIHtcclxuXHJcbiAgICB2YXIgcHJvcCA9IHRoaXMubW9kZWxPYmplY3RbcHJvcGVydHlOYW1lXTtcclxuICAgIGlmICh0eXBlb2YocHJvcCkgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZXJlIGlzIG5vIG9ic2VydmFibGUgcHJvcGVydHkgd2l0aCBuYW1lIFsnICsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZSArIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnXSB0byByZWdpc3RlciBhcyB0aW1lc3RhbXAuJ1xyXG4gICAgICAgKTtcclxuICAgIH1cclxuICAgIC8vIEFkZCBzdWJzY3JpYmVyIG9uIGludGVybmFsIHRpbWVzdGFtcCB0byBrZWVwXHJcbiAgICAvLyB0aGUgcHJvcGVydHkgdXBkYXRlZFxyXG4gICAgdGhpcy5kYXRhVGltZXN0YW1wLnN1YnNjcmliZShmdW5jdGlvbih0aW1lc3RhbXApIHtcclxuICAgICAgICBwcm9wKHRpbWVzdGFtcCk7XHJcbiAgICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgUmV0dXJucyBhIHBsYWluIG9iamVjdCB3aXRoIHRoZSBwcm9wZXJ0aWVzIGFuZCBmaWVsZHNcclxuICAgIG9mIHRoZSBtb2RlbCBvYmplY3QsIGp1c3QgdmFsdWVzLlxyXG4gICAgXHJcbiAgICBAcGFyYW0gZGVlcENvcHk6Ym9vbCBJZiBsZWZ0IHVuZGVmaW5lZCwgZG8gbm90IGNvcHkgb2JqZWN0cyBpblxyXG4gICAgdmFsdWVzIGFuZCBub3QgcmVmZXJlbmNlcy4gSWYgZmFsc2UsIGRvIGEgc2hhbGxvdyBjb3B5LCBzZXR0aW5nXHJcbiAgICB1cCByZWZlcmVuY2VzIGluIHRoZSByZXN1bHQuIElmIHRydWUsIHRvIGEgZGVlcCBjb3B5IG9mIGFsbCBvYmplY3RzLlxyXG4qKi9cclxuTW9kZWwucHJvdG90eXBlLnRvUGxhaW5PYmplY3QgPSBmdW5jdGlvbiB0b1BsYWluT2JqZWN0KGRlZXBDb3B5KSB7XHJcblxyXG4gICAgdmFyIHBsYWluID0ge30sXHJcbiAgICAgICAgbW9kZWxPYmogPSB0aGlzLm1vZGVsT2JqZWN0O1xyXG5cclxuICAgIGZ1bmN0aW9uIHNldFZhbHVlKHByb3BlcnR5LCB2YWwpIHtcclxuICAgICAgICAvKmpzaGludCBtYXhjb21wbGV4aXR5OiAxMCovXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHR5cGVvZih2YWwpID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICBpZiAoZGVlcENvcHkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIGlmICh2YWwgaW5zdGFuY2VvZiBEYXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQSBkYXRlIGNsb25lXHJcbiAgICAgICAgICAgICAgICAgICAgcGxhaW5bcHJvcGVydHldID0gbmV3IERhdGUodmFsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZhbCAmJiB2YWwubW9kZWwgaW5zdGFuY2VvZiBNb2RlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEEgbW9kZWwgY29weVxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IHZhbC5tb2RlbC50b1BsYWluT2JqZWN0KGRlZXBDb3B5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZhbCA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBQbGFpbiAnc3RhbmRhcmQnIG9iamVjdCBjbG9uZVxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IGNsb25lKHZhbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoZGVlcENvcHkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBTaGFsbG93IGNvcHlcclxuICAgICAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IHZhbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBPbiBlbHNlLCBkbyBub3RoaW5nLCBubyByZWZlcmVuY2VzLCBubyBjbG9uZXNcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IHZhbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5wcm9wZXJ0aWVzTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHByb3BlcnR5KSB7XHJcbiAgICAgICAgLy8gUHJvcGVydGllcyBhcmUgb2JzZXJ2YWJsZXMsIHNvIGZ1bmN0aW9ucyB3aXRob3V0IHBhcmFtczpcclxuICAgICAgICB2YXIgdmFsID0gbW9kZWxPYmpbcHJvcGVydHldKCk7XHJcblxyXG4gICAgICAgIHNldFZhbHVlKHByb3BlcnR5LCB2YWwpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5maWVsZHNMaXN0LmZvckVhY2goZnVuY3Rpb24oZmllbGQpIHtcclxuICAgICAgICAvLyBGaWVsZHMgYXJlIGp1c3QgcGxhaW4gb2JqZWN0IG1lbWJlcnMgZm9yIHZhbHVlcywganVzdCBjb3B5OlxyXG4gICAgICAgIHZhciB2YWwgPSBtb2RlbE9ialtmaWVsZF07XHJcblxyXG4gICAgICAgIHNldFZhbHVlKGZpZWxkLCB2YWwpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHBsYWluO1xyXG59O1xyXG5cclxuTW9kZWwucHJvdG90eXBlLnVwZGF0ZVdpdGggPSBmdW5jdGlvbiB1cGRhdGVXaXRoKGRhdGEsIGRlZXBDb3B5KSB7XHJcbiAgICBcclxuICAgIC8vIFdlIG5lZWQgYSBwbGFpbiBvYmplY3QgZm9yICdmcm9tSlMnLlxyXG4gICAgLy8gSWYgaXMgYSBtb2RlbCwgZXh0cmFjdCB0aGVpciBwcm9wZXJ0aWVzIGFuZCBmaWVsZHMgZnJvbVxyXG4gICAgLy8gdGhlIG9ic2VydmFibGVzIChmcm9tSlMpLCBzbyB3ZSBub3QgZ2V0IGNvbXB1dGVkXHJcbiAgICAvLyBvciBmdW5jdGlvbnMsIGp1c3QgcmVnaXN0ZXJlZCBwcm9wZXJ0aWVzIGFuZCBmaWVsZHNcclxuICAgIHZhciB0aW1lc3RhbXAgPSBudWxsO1xyXG4gICAgaWYgKGRhdGEgJiYgZGF0YS5tb2RlbCBpbnN0YW5jZW9mIE1vZGVsKSB7XHJcblxyXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gc2V0IHRoZSBzYW1lIHRpbWVzdGFtcCwgc29cclxuICAgICAgICAvLyByZW1lbWJlciBmb3IgYWZ0ZXIgdGhlIGZyb21KU1xyXG4gICAgICAgIHRpbWVzdGFtcCA9IGRhdGEubW9kZWwuZGF0YVRpbWVzdGFtcCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFJlcGxhY2UgZGF0YSB3aXRoIGEgcGxhaW4gY29weSBvZiBpdHNlbGZcclxuICAgICAgICBkYXRhID0gZGF0YS5tb2RlbC50b1BsYWluT2JqZWN0KGRlZXBDb3B5KTtcclxuICAgIH1cclxuXHJcbiAgICBrby5tYXBwaW5nLmZyb21KUyhkYXRhLCB0aGlzLm1hcHBpbmdPcHRpb25zLCB0aGlzLm1vZGVsT2JqZWN0KTtcclxuICAgIC8vIFNhbWUgdGltZXN0YW1wIGlmIGFueVxyXG4gICAgaWYgKHRpbWVzdGFtcClcclxuICAgICAgICB0aGlzLm1vZGVsT2JqZWN0Lm1vZGVsLmRhdGFUaW1lc3RhbXAodGltZXN0YW1wKTtcclxufTtcclxuXHJcbk1vZGVsLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lKGRhdGEsIGRlZXBDb3B5KSB7XHJcbiAgICAvLyBHZXQgYSBwbGFpbiBvYmplY3Qgd2l0aCB0aGUgb2JqZWN0IGRhdGFcclxuICAgIHZhciBwbGFpbiA9IHRoaXMudG9QbGFpbk9iamVjdChkZWVwQ29weSk7XHJcbiAgICAvLyBDcmVhdGUgYSBuZXcgbW9kZWwgaW5zdGFuY2UsIHVzaW5nIHRoZSBzb3VyY2UgcGxhaW4gb2JqZWN0XHJcbiAgICAvLyBhcyBpbml0aWFsIHZhbHVlc1xyXG4gICAgdmFyIGNsb25lZCA9IG5ldyB0aGlzLm1vZGVsT2JqZWN0LmNvbnN0cnVjdG9yKHBsYWluKTtcclxuICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgLy8gVXBkYXRlIHRoZSBjbG9uZWQgd2l0aCB0aGUgcHJvdmlkZWQgcGxhaW4gZGF0YSB1c2VkXHJcbiAgICAgICAgLy8gdG8gcmVwbGFjZSB2YWx1ZXMgb24gdGhlIGNsb25lZCBvbmUsIGZvciBxdWljayBvbmUtc3RlcCBjcmVhdGlvblxyXG4gICAgICAgIC8vIG9mIGRlcml2ZWQgb2JqZWN0cy5cclxuICAgICAgICBjbG9uZWQubW9kZWwudXBkYXRlV2l0aChkYXRhKTtcclxuICAgIH1cclxuICAgIC8vIENsb25lZCBtb2RlbCByZWFkeTpcclxuICAgIHJldHVybiBjbG9uZWQ7XHJcbn07XHJcbiIsIi8qKiBQZXJmb3JtYW5jZVN1bW1hcnkgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIExpc3RWaWV3SXRlbSA9IHJlcXVpcmUoJy4vTGlzdFZpZXdJdGVtJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKSxcclxuICAgIG51bWVyYWwgPSByZXF1aXJlKCdudW1lcmFsJyk7XHJcblxyXG5mdW5jdGlvbiBQZXJmb3JtYW5jZVN1bW1hcnkodmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdmFsdWVzID0gdmFsdWVzIHx8IHt9O1xyXG5cclxuICAgIHRoaXMuZWFybmluZ3MgPSBuZXcgRWFybmluZ3ModmFsdWVzLmVhcm5pbmdzKTtcclxuICAgIFxyXG4gICAgdmFyIGVhcm5pbmdzTGluZSA9IG5ldyBMaXN0Vmlld0l0ZW0oKTtcclxuICAgIGVhcm5pbmdzTGluZS5tYXJrZXJMaW5lMSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBudW0gPSBudW1lcmFsKHRoaXMuY3VycmVudEFtb3VudCgpKS5mb3JtYXQoJyQwLDAnKTtcclxuICAgICAgICByZXR1cm4gbnVtO1xyXG4gICAgfSwgdGhpcy5lYXJuaW5ncyk7XHJcbiAgICBlYXJuaW5nc0xpbmUuY29udGVudExpbmUxID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudENvbmNlcHQoKTtcclxuICAgIH0sIHRoaXMuZWFybmluZ3MpO1xyXG4gICAgZWFybmluZ3NMaW5lLm1hcmtlckxpbmUyID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIG51bSA9IG51bWVyYWwodGhpcy5uZXh0QW1vdW50KCkpLmZvcm1hdCgnJDAsMCcpO1xyXG4gICAgICAgIHJldHVybiBudW07XHJcbiAgICB9LCB0aGlzLmVhcm5pbmdzKTtcclxuICAgIGVhcm5pbmdzTGluZS5jb250ZW50TGluZTIgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5uZXh0Q29uY2VwdCgpO1xyXG4gICAgfSwgdGhpcy5lYXJuaW5ncyk7XHJcbiAgICBcclxuXHJcbiAgICB0aGlzLnRpbWVCb29rZWQgPSBuZXcgVGltZUJvb2tlZCh2YWx1ZXMudGltZUJvb2tlZCk7XHJcblxyXG4gICAgdmFyIHRpbWVCb29rZWRMaW5lID0gbmV3IExpc3RWaWV3SXRlbSgpO1xyXG4gICAgdGltZUJvb2tlZExpbmUubWFya2VyTGluZTEgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgbnVtID0gbnVtZXJhbCh0aGlzLnBlcmNlbnQoKSkuZm9ybWF0KCcwJScpO1xyXG4gICAgICAgIHJldHVybiBudW07XHJcbiAgICB9LCB0aGlzLnRpbWVCb29rZWQpO1xyXG4gICAgdGltZUJvb2tlZExpbmUuY29udGVudExpbmUxID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uY2VwdCgpO1xyXG4gICAgfSwgdGhpcy50aW1lQm9va2VkKTtcclxuICAgIFxyXG4gICAgXHJcbiAgICB0aGlzLml0ZW1zID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBpdGVtcyA9IFtdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGl0ZW1zLnB1c2goZWFybmluZ3NMaW5lKTtcclxuICAgICAgICBpdGVtcy5wdXNoKHRpbWVCb29rZWRMaW5lKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGl0ZW1zO1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGVyZm9ybWFuY2VTdW1tYXJ5O1xyXG5cclxuZnVuY3Rpb24gRWFybmluZ3ModmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICBcclxuICAgICAgICAgY3VycmVudEFtb3VudDogMCxcclxuICAgICAgICAgY3VycmVudENvbmNlcHRUZW1wbGF0ZTogJ2FscmVhZHkgcGFpZCB0aGlzIG1vbnRoJyxcclxuICAgICAgICAgbmV4dEFtb3VudDogMCxcclxuICAgICAgICAgbmV4dENvbmNlcHRUZW1wbGF0ZTogJ3Byb2plY3RlZCB7bW9udGh9IGVhcm5pbmdzJ1xyXG5cclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuY3VycmVudENvbmNlcHQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHZhciBtb250aCA9IG1vbWVudCgpLmZvcm1hdCgnTU1NTScpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRDb25jZXB0VGVtcGxhdGUoKS5yZXBsYWNlKC9cXHttb250aFxcfS8sIG1vbnRoKTtcclxuXHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLm5leHRDb25jZXB0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgbW9udGggPSBtb21lbnQoKS5hZGQoMSwgJ21vbnRoJykuZm9ybWF0KCdNTU1NJyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dENvbmNlcHRUZW1wbGF0ZSgpLnJlcGxhY2UoL1xce21vbnRoXFx9LywgbW9udGgpO1xyXG5cclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBUaW1lQm9va2VkKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgXHJcbiAgICAgICAgcGVyY2VudDogMCxcclxuICAgICAgICBjb25jZXB0VGVtcGxhdGU6ICdvZiBhdmFpbGFibGUgdGltZSBib29rZWQgaW4ge21vbnRofSdcclxuICAgIFxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5jb25jZXB0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgbW9udGggPSBtb21lbnQoKS5hZGQoMSwgJ21vbnRoJykuZm9ybWF0KCdNTU1NJyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uY2VwdFRlbXBsYXRlKCkucmVwbGFjZSgvXFx7bW9udGhcXH0vLCBtb250aCk7XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuIiwiLyoqIFBvc2l0aW9uIG1vZGVsLlxyXG4gKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIFBvc2l0aW9uKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHBvc2l0aW9uSUQ6IDAsXHJcbiAgICAgICAgcG9zaXRpb25TaW5ndWxhcjogJycsXHJcbiAgICAgICAgcG9zaXRpb25QbHVyYWw6ICcnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnJyxcclxuICAgICAgICBhY3RpdmU6IHRydWVcclxuXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBvc2l0aW9uO1xyXG4iLCIvKipcclxuICAgIFNjaGVkdWxpbmdQcmVmZXJlbmNlcyBtb2RlbC5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBTY2hlZHVsaW5nUHJlZmVyZW5jZXModmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgYWR2YW5jZVRpbWU6IDI0LFxyXG4gICAgICAgIGJldHdlZW5UaW1lOiAwLFxyXG4gICAgICAgIGluY3JlbWVudHNTaXplSW5NaW51dGVzOiAxNVxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTY2hlZHVsaW5nUHJlZmVyZW5jZXM7XHJcbiIsIi8qKiBTZXJ2aWNlIG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBTZXJ2aWNlKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgIHByaWNlOiAwLFxyXG4gICAgICAgIGR1cmF0aW9uOiAwLCAvLyBpbiBtaW51dGVzXHJcbiAgICAgICAgaXNBZGRvbjogZmFsc2VcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuZHVyYXRpb25UZXh0ID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIG1pbnV0ZXMgPSB0aGlzLmR1cmF0aW9uKCkgfHwgMDtcclxuICAgICAgICAvLyBUT0RPOiBGb3JtYXR0aW5nLCBsb2NhbGl6YXRpb25cclxuICAgICAgICByZXR1cm4gbWludXRlcyA/IG1pbnV0ZXMgKyAnIG1pbnV0ZXMnIDogJyc7XHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZXJ2aWNlO1xyXG4iLCIvKipcclxuICAgIFNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSBtb2RlbC5cclxuICAgIFxyXG4gICAgSXRzICdzaW1wbGlmaWVkJyBiZWNhdXNlIGl0IHByb3ZpZGVzIGFuIEFQSVxyXG4gICAgZm9yIHNpbXBsZSB0aW1lIHJhbmdlIHBlciB3ZWVrIGRheSxcclxuICAgIGEgcGFpciBvZiBmcm9tLXRvIHRpbWVzLlxyXG4gICAgR29vZCBmb3IgY3VycmVudCBzaW1wbGUgVUkuXHJcbiAgICBcclxuICAgIFRoZSBvcmlnaW5hbCB3ZWVrbHkgc2NoZWR1bGUgZGVmaW5lcyB0aGUgc2NoZWR1bGVcclxuICAgIGluIDE1IG1pbnV0ZXMgc2xvdHMsIHNvIG11bHRpcGxlIHRpbWUgcmFuZ2VzIGNhblxyXG4gICAgZXhpc3RzIHBlciB3ZWVrIGRheSwganVzdCBtYXJraW5nIGVhY2ggc2xvdFxyXG4gICAgYXMgYXZhaWxhYmxlIG9yIHVuYXZhaWxhYmxlLiBUaGUgQXBwTW9kZWxcclxuICAgIHdpbGwgZmlsbCB0aGlzIG1vZGVsIGluc3RhbmNlcyBwcm9wZXJseSBtYWtpbmdcclxuICAgIGFueSBjb252ZXJzaW9uIGZyb20vdG8gdGhlIHNvdXJjZSBkYXRhLlxyXG4gKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbi8qKlxyXG4gICAgU3VibW9kZWwgdGhhdCBpcyB1c2VkIG9uIHRoZSBTaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGVcclxuICAgIGRlZmluaW5nIGEgc2luZ2xlIHdlZWsgZGF5IGF2YWlsYWJpbGl0eSByYW5nZS5cclxuICAgIEEgZnVsbCBkYXkgbXVzdCBoYXZlIHZhbHVlcyBmcm9tOjAgdG86MTQ0MCwgbmV2ZXJcclxuICAgIGJvdGggYXMgemVybyBiZWNhdXNlIHRoYXRzIGNvbnNpZGVyZWQgYXMgbm90IGF2YWlsYWJsZSxcclxuICAgIHNvIGlzIGJldHRlciB0byB1c2UgdGhlIGlzQWxsRGF5IHByb3BlcnR5LlxyXG4qKi9cclxuZnVuY3Rpb24gV2Vla0RheVNjaGVkdWxlKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICAvLyBOT1RFOiBmcm9tLXRvIHByb3BlcmllcyBhcyBudW1iZXJzXHJcbiAgICAvLyBmb3IgdGhlIG1pbnV0ZSBvZiB0aGUgZGF5LCBmcm9tIDAgKDAwOjAwKSB0byAxNDM5ICgyMzo1OSlcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgZnJvbTogMCxcclxuICAgICAgICB0bzogMFxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgSXQgYWxsb3dzIHRvIGtub3cgaWYgdGhpcyB3ZWVrIGRheSBpcyBcclxuICAgICAgICBlbmFibGVkIGZvciB3ZWVrbHkgc2NoZWR1bGUsIGp1c3QgaXRcclxuICAgICAgICBoYXMgZnJvbS10byB0aW1lcy5cclxuICAgICAgICBJdCBhbGxvd3MgdG8gYmUgc2V0IGFzIHRydWUgcHV0dGluZ1xyXG4gICAgICAgIGEgZGVmYXVsdCByYW5nZSAoOWEtNXApIG9yIGZhbHNlIFxyXG4gICAgICAgIHNldHRpbmcgYm90aCBhcyAwcC5cclxuICAgICAgICBcclxuICAgICAgICBTaW5jZSBvbiB3cml0ZSB0d28gb2JzZXJ2YWJsZXMgYXJlIGJlaW5nIG1vZGlmaWVkLCBhbmRcclxuICAgICAgICBib3RoIGFyZSB1c2VkIGluIHRoZSByZWFkLCBhIHNpbmdsZSBjaGFuZ2UgdG8gdGhlIFxyXG4gICAgICAgIHZhbHVlIHdpbGwgdHJpZ2dlciB0d28gbm90aWZpY2F0aW9uczsgdG8gYXZvaWQgdGhhdCxcclxuICAgICAgICB0aGUgb2JzZXJ2YWJsZSBpcyByYXRlIGxpbWl0ZWQgd2l0aCBhbiBpbm1lZGlhdGUgdmFsdWUsXHJcbiAgICAgICAgc29uIG9ubHkgb25lIG5vdGlmaWNhdGlvbiBpcyByZWNlaXZlZC5cclxuICAgICoqL1xyXG4gICAgdGhpcy5pc0VuYWJsZWQgPSBrby5jb21wdXRlZCh7XHJcbiAgICAgICAgcmVhZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICB0eXBlb2YodGhpcy5mcm9tKCkpID09PSAnbnVtYmVyJyAmJlxyXG4gICAgICAgICAgICAgICAgdHlwZW9mKHRoaXMudG8oKSkgPT09ICdudW1iZXInICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZyb20oKSA8IHRoaXMudG8oKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgICAgICBpZiAodmFsID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBEZWZhdWx0IHJhbmdlIDlhIC0gNXBcclxuICAgICAgICAgICAgICAgIHRoaXMuZnJvbUhvdXIoOSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvSG91cigxNyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvSG91cigwKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZnJvbSgwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3duZXI6IHRoaXNcclxuICAgIH0pLmV4dGVuZCh7IHJhdGVMaW1pdDogMCB9KTtcclxuICAgIFxyXG4gICAgdGhpcy5pc0FsbERheSA9IGtvLmNvbXB1dGVkKHtcclxuICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuICAoXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZyb20oKSA9PT0gMCAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy50bygpID09PSAxNDQwXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB3cml0ZTogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJvbSgwKTtcclxuICAgICAgICAgICAgdGhpcy50bygxNDQwKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG93bmVyOiB0aGlzXHJcbiAgICB9KS5leHRlbmQoeyByYXRlTGltaXQ6IDAgfSk7XHJcbiAgICBcclxuICAgIC8vIEFkZGl0aW9uYWwgaW50ZXJmYWNlcyB0byBnZXQvc2V0IHRoZSBmcm9tL3RvIHRpbWVzXHJcbiAgICAvLyBieSB1c2luZyBhIGRpZmZlcmVudCBkYXRhIHVuaXQgb3IgZm9ybWF0LlxyXG4gICAgXHJcbiAgICAvLyBJbnRlZ2VyLCByb3VuZGVkLXVwLCBudW1iZXIgb2YgaG91cnNcclxuICAgIHRoaXMuZnJvbUhvdXIgPSBrby5jb21wdXRlZCh7XHJcbiAgICAgICAgcmVhZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKHRoaXMuZnJvbSgpIC8gNjApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKGhvdXJzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJvbSgoaG91cnMgKiA2MCkgfDApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3duZXI6IHRoaXNcclxuICAgIH0pO1xyXG4gICAgdGhpcy50b0hvdXIgPSBrby5jb21wdXRlZCh7XHJcbiAgICAgICAgcmVhZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmNlaWwodGhpcy50bygpIC8gNjApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKGhvdXJzKSB7XHJcbiAgICAgICAgICAgIHRoaXMudG8oKGhvdXJzICogNjApIHwwKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG93bmVyOiB0aGlzXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gU3RyaW5nLCB0aW1lIGZvcm1hdCAoJ2hoOm1tJylcclxuICAgIHRoaXMuZnJvbVRpbWUgPSBrby5jb21wdXRlZCh7XHJcbiAgICAgICAgcmVhZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBtaW51dGVzVG9UaW1lU3RyaW5nKHRoaXMuZnJvbSgpIHwwKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHdyaXRlOiBmdW5jdGlvbih0aW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJvbSh0aW1lU3RyaW5nVG9NaW51dGVzKHRpbWUpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG93bmVyOiB0aGlzXHJcbiAgICB9KTtcclxuICAgIHRoaXMudG9UaW1lID0ga28uY29tcHV0ZWQoe1xyXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbWludXRlc1RvVGltZVN0cmluZyh0aGlzLnRvKCkgfDApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKHRpbWUpIHtcclxuICAgICAgICAgICAgdGhpcy50byh0aW1lU3RyaW5nVG9NaW51dGVzKHRpbWUpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG93bmVyOiB0aGlzXHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAgICBNYWluIG1vZGVsIGRlZmluaW5nIHRoZSB3ZWVrIHNjaGVkdWxlXHJcbiAgICBwZXIgd2VlayBkYXRlLCBvciBqdXN0IHNldCBhbGwgZGF5cyB0aW1lc1xyXG4gICAgYXMgYXZhaWxhYmxlIHdpdGggYSBzaW5nbGUgZmxhZy5cclxuKiovXHJcbmZ1bmN0aW9uIFNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBzdW5kYXk6IG5ldyBXZWVrRGF5U2NoZWR1bGUoKSxcclxuICAgICAgICBtb25kYXk6IG5ldyBXZWVrRGF5U2NoZWR1bGUoKSxcclxuICAgICAgICB0dWVzZGF5OiBuZXcgV2Vla0RheVNjaGVkdWxlKCksXHJcbiAgICAgICAgd2VkbmVzZGF5OiBuZXcgV2Vla0RheVNjaGVkdWxlKCksXHJcbiAgICAgICAgdGh1cnNkYXk6IG5ldyBXZWVrRGF5U2NoZWR1bGUoKSxcclxuICAgICAgICBmcmlkYXk6IG5ldyBXZWVrRGF5U2NoZWR1bGUoKSxcclxuICAgICAgICBzYXR1cmRheTogbmV3IFdlZWtEYXlTY2hlZHVsZSgpLFxyXG4gICAgICAgIGlzQWxsVGltZTogZmFsc2VcclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2ltcGxpZmllZFdlZWtseVNjaGVkdWxlO1xyXG5cclxuLy8vLyBVVElMUyxcclxuLy8gVE9ETyBPcmdhbml6ZSBvciBleHRlcm5hbGl6ZS4gc29tZSBjb3BpZWQgZm9ybSBhcHBtb2RlbC4uXHJcbi8qKlxyXG4gICAgaW50ZXJuYWwgdXRpbGl0eSBmdW5jdGlvbiAndG8gc3RyaW5nIHdpdGggdHdvIGRpZ2l0cyBhbG1vc3QnXHJcbioqL1xyXG5mdW5jdGlvbiB0d29EaWdpdHMobikge1xyXG4gICAgcmV0dXJuIE1hdGguZmxvb3IobiAvIDEwKSArICcnICsgbiAlIDEwO1xyXG59XHJcblxyXG4vKipcclxuICAgIENvbnZlcnQgYSBudW1iZXIgb2YgbWludXRlc1xyXG4gICAgaW4gYSBzdHJpbmcgbGlrZTogMDA6MDA6MDAgKGhvdXJzOm1pbnV0ZXM6c2Vjb25kcylcclxuKiovXHJcbmZ1bmN0aW9uIG1pbnV0ZXNUb1RpbWVTdHJpbmcobWludXRlcykge1xyXG4gICAgdmFyIGQgPSBtb21lbnQuZHVyYXRpb24obWludXRlcywgJ21pbnV0ZXMnKSxcclxuICAgICAgICBoID0gZC5ob3VycygpLFxyXG4gICAgICAgIG0gPSBkLm1pbnV0ZXMoKSxcclxuICAgICAgICBzID0gZC5zZWNvbmRzKCk7XHJcbiAgICBcclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgdHdvRGlnaXRzKGgpICsgJzonICtcclxuICAgICAgICB0d29EaWdpdHMobSkgKyAnOicgK1xyXG4gICAgICAgIHR3b0RpZ2l0cyhzKVxyXG4gICAgKTtcclxufVxyXG5cclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5mdW5jdGlvbiB0aW1lU3RyaW5nVG9NaW51dGVzKHRpbWUpIHtcclxuICAgIHJldHVybiBtb21lbnQuZHVyYXRpb24odGltZSkuYXNNaW51dGVzKCkgfDA7XHJcbn0iLCIvKiogVXBjb21pbmdCb29raW5nc1N1bW1hcnkgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIEJvb2tpbmdTdW1tYXJ5ID0gcmVxdWlyZSgnLi9Cb29raW5nU3VtbWFyeScpO1xyXG5cclxuZnVuY3Rpb24gVXBjb21pbmdCb29raW5nc1N1bW1hcnkoKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy50b2RheSA9IG5ldyBCb29raW5nU3VtbWFyeSh7XHJcbiAgICAgICAgY29uY2VwdDogJ21vcmUgdG9kYXknLFxyXG4gICAgICAgIHRpbWVGb3JtYXQ6ICcgW2VuZGluZyBAXSBoOm1tYSdcclxuICAgIH0pO1xyXG4gICAgdGhpcy50b21vcnJvdyA9IG5ldyBCb29raW5nU3VtbWFyeSh7XHJcbiAgICAgICAgY29uY2VwdDogJ3RvbW9ycm93JyxcclxuICAgICAgICB0aW1lRm9ybWF0OiAnIFtzdGFydGluZyBAXSBoOm1tYSdcclxuICAgIH0pO1xyXG4gICAgdGhpcy5uZXh0V2VlayA9IG5ldyBCb29raW5nU3VtbWFyeSh7XHJcbiAgICAgICAgY29uY2VwdDogJ25leHQgd2VlaycsXHJcbiAgICAgICAgdGltZUZvcm1hdDogbnVsbFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMuaXRlbXMgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGl0ZW1zID0gW107XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9pZiAodGhpcy50b2RheS5xdWFudGl0eSgpKVxyXG4gICAgICAgIGl0ZW1zLnB1c2godGhpcy50b2RheSk7XHJcbiAgICAgICAgLy9pZiAodGhpcy50b21vcnJvdy5xdWFudGl0eSgpKVxyXG4gICAgICAgIGl0ZW1zLnB1c2godGhpcy50b21vcnJvdyk7XHJcbiAgICAgICAgLy9pZiAodGhpcy5uZXh0V2Vlay5xdWFudGl0eSgpKVxyXG4gICAgICAgIGl0ZW1zLnB1c2godGhpcy5uZXh0V2Vlayk7XHJcblxyXG4gICAgICAgIHJldHVybiBpdGVtcztcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVXBjb21pbmdCb29raW5nc1N1bW1hcnk7XHJcbiIsIi8qKiBVc2VyIG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG4vLyBFbnVtIFVzZXJUeXBlXHJcbnZhciBVc2VyVHlwZSA9IHtcclxuICAgIE5vbmU6IDAsXHJcbiAgICBBbm9ueW1vdXM6IDEsXHJcbiAgICBDdXN0b21lcjogMixcclxuICAgIEZyZWVsYW5jZXI6IDQsXHJcbiAgICBBZG1pbjogOCxcclxuICAgIExvZ2dlZFVzZXI6IDE0LFxyXG4gICAgVXNlcjogMTUsXHJcbiAgICBTeXN0ZW06IDE2XHJcbn07XHJcblxyXG5mdW5jdGlvbiBVc2VyKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICB1c2VySUQ6IDAsXHJcbiAgICAgICAgZW1haWw6ICcnLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGZpcnN0TmFtZTogJycsXHJcbiAgICAgICAgbGFzdE5hbWU6ICcnLFxyXG4gICAgICAgIHNlY29uZExhc3ROYW1lOiAnJyxcclxuICAgICAgICBidXNpbmVzc05hbWU6ICcnLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGFsdGVybmF0aXZlRW1haWw6ICcnLFxyXG4gICAgICAgIHBob25lOiAnJyxcclxuICAgICAgICBjYW5SZWNlaXZlU21zOiAnJyxcclxuICAgICAgICBiaXJ0aE1vbnRoRGF5OiBudWxsLFxyXG4gICAgICAgIGJpcnRoTW9udGg6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgaXNGcmVlbGFuY2VyOiBmYWxzZSxcclxuICAgICAgICBpc0N1c3RvbWVyOiBmYWxzZSxcclxuICAgICAgICBpc01lbWJlcjogZmFsc2UsXHJcbiAgICAgICAgaXNBZG1pbjogZmFsc2UsXHJcblxyXG4gICAgICAgIG9uYm9hcmRpbmdTdGVwOiBudWxsLFxyXG4gICAgICAgIGFjY291bnRTdGF0dXNJRDogMCxcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxuXHJcbiAgICB0aGlzLmZ1bGxOYW1lID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBuYW1lUGFydHMgPSBbdGhpcy5maXJzdE5hbWUoKV07XHJcbiAgICAgICAgaWYgKHRoaXMubGFzdE5hbWUoKSlcclxuICAgICAgICAgICAgbmFtZVBhcnRzLnB1c2godGhpcy5sYXN0TmFtZSgpKTtcclxuICAgICAgICBpZiAodGhpcy5zZWNvbmRMYXN0TmFtZSgpKVxyXG4gICAgICAgICAgICBuYW1lUGFydHMucHVzaCh0aGlzLnNlY29uZExhc3ROYW1lKTtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbmFtZVBhcnRzLmpvaW4oJyAnKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmJpcnRoRGF5ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmJpcnRoTW9udGhEYXkoKSAmJlxyXG4gICAgICAgICAgICB0aGlzLmJpcnRoTW9udGgoKSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVE9ETyBpMTBuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJpcnRoTW9udGgoKSArICcvJyArIHRoaXMuYmlydGhNb250aERheSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMudXNlclR5cGUgPSBrby5wdXJlQ29tcHV0ZWQoe1xyXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgYyA9IHRoaXMuaXNDdXN0b21lcigpLFxyXG4gICAgICAgICAgICAgICAgcCA9IHRoaXMuaXNGcmVlbGFuY2VyKCksXHJcbiAgICAgICAgICAgICAgICBhID0gdGhpcy5pc0FkbWluKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgdXNlclR5cGUgPSAwO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBbm9ueW1vdXMoKSlcclxuICAgICAgICAgICAgICAgIHVzZXJUeXBlID0gdXNlclR5cGUgfCBVc2VyVHlwZS5Bbm9ueW1vdXM7XHJcbiAgICAgICAgICAgIGlmIChjKVxyXG4gICAgICAgICAgICAgICAgdXNlclR5cGUgPSB1c2VyVHlwZSB8IFVzZXJUeXBlLkN1c3RvbWVyO1xyXG4gICAgICAgICAgICBpZiAocClcclxuICAgICAgICAgICAgICAgIHVzZXJUeXBlID0gdXNlclR5cGUgfCBVc2VyVHlwZS5GcmVlbGFuY2VyO1xyXG4gICAgICAgICAgICBpZiAoYSlcclxuICAgICAgICAgICAgICAgIHVzZXJUeXBlID0gdXNlclR5cGUgfCBVc2VyVHlwZS5BZG1pbjtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiB1c2VyVHlwZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qIE5PVEU6IE5vdCByZXF1aXJlZCBmb3Igbm93OlxyXG4gICAgICAgIHdyaXRlOiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgfSwqL1xyXG4gICAgICAgIG93bmVyOiB0aGlzXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgdGhpcy5pc0Fub255bW91cyA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLnVzZXJJRCgpIDwgMTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBJdCBtYXRjaGVzIGEgVXNlclR5cGUgZnJvbSB0aGUgZW51bWVyYXRpb24/XHJcbiAgICAqKi9cclxuICAgIHRoaXMuaXNVc2VyVHlwZSA9IGZ1bmN0aW9uIGlzVXNlclR5cGUodHlwZSkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy51c2VyVHlwZSgpICYgdHlwZSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVXNlcjtcclxuXHJcblVzZXIuVXNlclR5cGUgPSBVc2VyVHlwZTtcclxuXHJcbi8qIENyZWF0aW50IGFuIGFub255bW91cyB1c2VyIHdpdGggc29tZSBwcmVzc2V0cyAqL1xyXG5Vc2VyLm5ld0Fub255bW91cyA9IGZ1bmN0aW9uIG5ld0Fub255bW91cygpIHtcclxuICAgIHJldHVybiBuZXcgVXNlcih7XHJcbiAgICAgICAgdXNlcklEOiAwLFxyXG4gICAgICAgIGVtYWlsOiAnJyxcclxuICAgICAgICBmaXJzdE5hbWU6ICcnLFxyXG4gICAgICAgIG9uYm9hcmRpbmdTdGVwOiBudWxsXHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqIENhbGVuZGFyIEFwcG9pbnRtZW50cyB0ZXN0IGRhdGEgKiovXHJcbnZhciBBcHBvaW50bWVudCA9IHJlcXVpcmUoJy4uL21vZGVscy9BcHBvaW50bWVudCcpO1xyXG52YXIgdGVzdExvY2F0aW9ucyA9IHJlcXVpcmUoJy4vbG9jYXRpb25zJykubG9jYXRpb25zO1xyXG52YXIgdGVzdFNlcnZpY2VzID0gcmVxdWlyZSgnLi9zZXJ2aWNlcycpLnNlcnZpY2VzO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG52YXIgdG9kYXkgPSBtb21lbnQoKSxcclxuICAgIHRvbW9ycm93ID0gbW9tZW50KCkuYWRkKDEsICdkYXlzJyksXHJcbiAgICB0b21vcnJvdzEwID0gdG9tb3Jyb3cuY2xvbmUoKS5ob3VycygxMCkubWludXRlcygwKS5zZWNvbmRzKDApLFxyXG4gICAgdG9tb3Jyb3cxNiA9IHRvbW9ycm93LmNsb25lKCkuaG91cnMoMTYpLm1pbnV0ZXMoMzApLnNlY29uZHMoMCk7XHJcbiAgICBcclxudmFyIHRlc3REYXRhID0gW1xyXG4gICAgbmV3IEFwcG9pbnRtZW50KHtcclxuICAgICAgICBpZDogMSxcclxuICAgICAgICBzdGFydFRpbWU6IHRvbW9ycm93MTAsXHJcbiAgICAgICAgZW5kVGltZTogdG9tb3Jyb3cxNixcclxuICAgICAgICBzdW1tYXJ5OiAnTWFzc2FnZSBUaGVyYXBpc3QgQm9va2luZycsXHJcbiAgICAgICAgLy9wcmljaW5nU3VtbWFyeTogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UgMTIwbSBwbHVzIDIgbW9yZScsXHJcbiAgICAgICAgc2VydmljZXM6IHRlc3RTZXJ2aWNlcyxcclxuICAgICAgICBwdG90YWxQcmljZTogOTUuMCxcclxuICAgICAgICBsb2NhdGlvbjoga28udG9KUyh0ZXN0TG9jYXRpb25zWzBdKSxcclxuICAgICAgICBwcmVOb3Rlc1RvQ2xpZW50OiAnTG9va2luZyBmb3J3YXJkIHRvIHNlZWluZyB0aGUgbmV3IGNvbG9yJyxcclxuICAgICAgICBwcmVOb3Rlc1RvU2VsZjogJ0FzayBoaW0gYWJvdXQgaGlzIG5ldyBjb2xvcicsXHJcbiAgICAgICAgY2xpZW50OiB7XHJcbiAgICAgICAgICAgIGZpcnN0TmFtZTogJ0pvc2h1YScsXHJcbiAgICAgICAgICAgIGxhc3ROYW1lOiAnRGFuaWVsc29uJ1xyXG4gICAgICAgIH1cclxuICAgIH0pLFxyXG4gICAgbmV3IEFwcG9pbnRtZW50KHtcclxuICAgICAgICBpZDogMixcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxMywgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDEsIDEzLCA1MCwgMCksXHJcbiAgICAgICAgc3VtbWFyeTogJ01hc3NhZ2UgVGhlcmFwaXN0IEJvb2tpbmcnLFxyXG4gICAgICAgIC8vcHJpY2luZ1N1bW1hcnk6ICdBbm90aGVyIE1hc3NhZ2UgNTBtJyxcclxuICAgICAgICBzZXJ2aWNlczogW3Rlc3RTZXJ2aWNlc1swXV0sXHJcbiAgICAgICAgcHRvdGFsUHJpY2U6IDk1LjAsXHJcbiAgICAgICAgbG9jYXRpb246IGtvLnRvSlModGVzdExvY2F0aW9uc1sxXSksXHJcbiAgICAgICAgcHJlTm90ZXNUb0NsaWVudDogJ1NvbWV0aGluZyBlbHNlJyxcclxuICAgICAgICBwcmVOb3Rlc1RvU2VsZjogJ1JlbWVtYmVyIHRoYXQgdGhpbmcnLFxyXG4gICAgICAgIGNsaWVudDoge1xyXG4gICAgICAgICAgICBmaXJzdE5hbWU6ICdKb3NodWEnLFxyXG4gICAgICAgICAgICBsYXN0TmFtZTogJ0RhbmllbHNvbidcclxuICAgICAgICB9XHJcbiAgICB9KSxcclxuICAgIG5ldyBBcHBvaW50bWVudCh7XHJcbiAgICAgICAgaWQ6IDMsXHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMSwgMTYsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxOCwgMCwgMCksXHJcbiAgICAgICAgc3VtbWFyeTogJ01hc3NhZ2UgVGhlcmFwaXN0IEJvb2tpbmcnLFxyXG4gICAgICAgIC8vcHJpY2luZ1N1bW1hcnk6ICdUaXNzdWUgTWFzc2FnZSAxMjBtJyxcclxuICAgICAgICBzZXJ2aWNlczogW3Rlc3RTZXJ2aWNlc1sxXV0sXHJcbiAgICAgICAgcHRvdGFsUHJpY2U6IDk1LjAsXHJcbiAgICAgICAgbG9jYXRpb246IGtvLnRvSlModGVzdExvY2F0aW9uc1syXSksXHJcbiAgICAgICAgcHJlTm90ZXNUb0NsaWVudDogJycsXHJcbiAgICAgICAgcHJlTm90ZXNUb1NlbGY6ICdBc2sgaGltIGFib3V0IHRoZSBmb3Jnb3R0ZW4gbm90ZXMnLFxyXG4gICAgICAgIGNsaWVudDoge1xyXG4gICAgICAgICAgICBmaXJzdE5hbWU6ICdKb3NodWEnLFxyXG4gICAgICAgICAgICBsYXN0TmFtZTogJ0RhbmllbHNvbidcclxuICAgICAgICB9XHJcbiAgICB9KSxcclxuXTtcclxuXHJcbmV4cG9ydHMuYXBwb2ludG1lbnRzID0gdGVzdERhdGE7XHJcbiIsIi8qKiBDYWxlbmRhciBTbG90cyB0ZXN0IGRhdGEgKiovXHJcbnZhciBDYWxlbmRhclNsb3QgPSByZXF1aXJlKCcuLi9tb2RlbHMvQ2FsZW5kYXJTbG90Jyk7XHJcblxyXG52YXIgVGltZSA9IHJlcXVpcmUoJy4uL3V0aWxzL1RpbWUnKTtcclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxudmFyIHRvZGF5ID0gbmV3IERhdGUoKSxcclxuICAgIHRvbW9ycm93ID0gbmV3IERhdGUoKTtcclxudG9tb3Jyb3cuc2V0RGF0ZSh0b21vcnJvdy5nZXREYXRlKCkgKyAxKTtcclxuXHJcbnZhciBzdG9kYXkgPSBtb21lbnQodG9kYXkpLmZvcm1hdCgnWVlZWS1NTS1ERCcpLFxyXG4gICAgc3RvbW9ycm93ID0gbW9tZW50KHRvbW9ycm93KS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcclxuXHJcbnZhciB0ZXN0RGF0YTEgPSBbXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAwLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b2RheSwgMTIsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC8wJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAxMiwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9kYXksIDEzLCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnSm9zaCBEYW5pZWxzb24nLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgbGluazogJyMhYXBwb2ludG1lbnQvMycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b2RheSwgMTMsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAxNSwgMCwgMCksXHJcblxyXG4gICAgICAgIHN1YmplY3Q6ICdEbyB0aGF0IGltcG9ydGFudCB0aGluZycsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyMhZXZlbnQvOCcsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLW5ldy13aW5kb3cnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b2RheSwgMTUsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAxNiwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0lhZ28gTG9yZW56bycsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdEZWVwIFRpc3N1ZSBNYXNzYWdlIExvbmcgTmFtZScsXHJcbiAgICAgICAgbGluazogJyMhYXBwb2ludG1lbnQvNScsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogJyQxNTkuOTAnLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9kYXksIDE2LCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b2RheSwgMCwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0ZyZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjIWFwcG9pbnRtZW50LzAnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXN1Y2Nlc3MnXHJcbiAgICB9KVxyXG5dO1xyXG52YXIgdGVzdERhdGEyID0gW1xyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMCwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDksIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC8wJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCA5LCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTAsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdKYXJlbiBGcmVlbHknLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRGVlcCBUaXNzdWUgTWFzc2FnZSBMb25nIE5hbWUnLFxyXG4gICAgICAgIGxpbms6ICcjIWFwcG9pbnRtZW50LzEnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6ICckNTkuOTAnLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDEwLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTEsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC8wJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxMSwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDEyLCA0NSwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0NPTkZJUk0tU3VzYW4gRGVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UnLFxyXG4gICAgICAgIGxpbms6ICcjIWFwcG9pbnRtZW50LzInLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6ICckNzAnLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXdhcm5pbmcnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDEyLCA0NSwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDE2LCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnRnJlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyMhYXBwb2ludG1lbnQvMCcsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctc3VjY2VzcydcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTYsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxNywgMTUsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdTdXNhbiBEZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgbGluazogJyMhYXBwb2ludG1lbnQvMycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTcsIDE1LCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTgsIDMwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnRGVudGlzdCBhcHBvaW50bWVudCcsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyMhZXZlbnQvNCcsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLW5ldy13aW5kb3cnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTgsIDMwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTksIDMwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnU3VzYW4gRGVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UgTG9uZyBOYW1lJyxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC81JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiAnJDE1OS45MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTksIDMwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMjMsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC8wJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAyMywgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDAsIDAsIDApLFxyXG5cclxuICAgICAgICBzdWJqZWN0OiAnSmFyZW4gRnJlZWx5JyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UnLFxyXG4gICAgICAgIGxpbms6ICcjIWFwcG9pbnRtZW50LzYnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6ICckODAnLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KVxyXG5dO1xyXG52YXIgdGVzdERhdGFGcmVlID0gW1xyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMCwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDAsIDAsIDApLFxyXG5cclxuICAgICAgICBzdWJqZWN0OiAnRnJlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyMhYXBwb2ludG1lbnQvMCcsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctc3VjY2VzcydcclxuICAgIH0pXHJcbl07XHJcblxyXG52YXIgdGVzdERhdGEgPSB7XHJcbiAgICAnZGVmYXVsdCc6IHRlc3REYXRhRnJlZVxyXG59O1xyXG50ZXN0RGF0YVtzdG9kYXldID0gdGVzdERhdGExO1xyXG50ZXN0RGF0YVtzdG9tb3Jyb3ddID0gdGVzdERhdGEyO1xyXG5cclxuZXhwb3J0cy5jYWxlbmRhciA9IHRlc3REYXRhO1xyXG4iLCIvKiogQ2xpZW50cyB0ZXN0IGRhdGEgKiovXHJcbnZhciBDbGllbnQgPSByZXF1aXJlKCcuLi9tb2RlbHMvQ2xpZW50Jyk7XHJcblxyXG52YXIgdGVzdERhdGEgPSBbXHJcbiAgICBuZXcgQ2xpZW50ICh7XHJcbiAgICAgICAgaWQ6IDEsXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnSm9zaHVhJyxcclxuICAgICAgICBsYXN0TmFtZTogJ0RhbmllbHNvbidcclxuICAgIH0pLFxyXG4gICAgbmV3IENsaWVudCh7XHJcbiAgICAgICAgaWQ6IDIsXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnSWFnbycsXHJcbiAgICAgICAgbGFzdE5hbWU6ICdMb3JlbnpvJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBpZDogMyxcclxuICAgICAgICBmaXJzdE5hbWU6ICdGZXJuYW5kbycsXHJcbiAgICAgICAgbGFzdE5hbWU6ICdHYWdvJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBpZDogNCxcclxuICAgICAgICBmaXJzdE5hbWU6ICdBZGFtJyxcclxuICAgICAgICBsYXN0TmFtZTogJ0ZpbmNoJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBpZDogNSxcclxuICAgICAgICBmaXJzdE5hbWU6ICdBbGFuJyxcclxuICAgICAgICBsYXN0TmFtZTogJ0Zlcmd1c29uJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBpZDogNixcclxuICAgICAgICBmaXJzdE5hbWU6ICdBbGV4JyxcclxuICAgICAgICBsYXN0TmFtZTogJ1BlbmEnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiA3LFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FsZXhpcycsXHJcbiAgICAgICAgbGFzdE5hbWU6ICdQZWFjYSdcclxuICAgIH0pLFxyXG4gICAgbmV3IENsaWVudCh7XHJcbiAgICAgICAgaWQ6IDgsXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnQXJ0aHVyJyxcclxuICAgICAgICBsYXN0TmFtZTogJ01pbGxlcidcclxuICAgIH0pXHJcbl07XHJcblxyXG5leHBvcnRzLmNsaWVudHMgPSB0ZXN0RGF0YTtcclxuIiwiLyoqIExvY2F0aW9ucyB0ZXN0IGRhdGEgKiovXHJcbnZhciBMb2NhdGlvbiA9IHJlcXVpcmUoJy4uL21vZGVscy9Mb2NhdGlvbicpO1xyXG5cclxudmFyIHRlc3REYXRhID0gW1xyXG4gICAgbmV3IExvY2F0aW9uICh7XHJcbiAgICAgICAgbG9jYXRpb25JRDogMSxcclxuICAgICAgICBuYW1lOiAnQWN0dmlTcGFjZScsXHJcbiAgICAgICAgYWRkcmVzc0xpbmUxOiAnMzE1MCAxOHRoIFN0cmVldCcsXHJcbiAgICAgICAgcG9zdGFsQ29kZTogOTAwMDEsXHJcbiAgICAgICAgaXNTZXJ2aWNlUmFkaXVzOiB0cnVlLFxyXG4gICAgICAgIHNlcnZpY2VSYWRpdXM6IDJcclxuICAgIH0pLFxyXG4gICAgbmV3IExvY2F0aW9uKHtcclxuICAgICAgICBsb2NhdGlvbklEOiAyLFxyXG4gICAgICAgIG5hbWU6ICdDb3JleVxcJ3MgQXB0JyxcclxuICAgICAgICBhZGRyZXNzTGluZTE6ICcxODcgQm9jYW5hIFN0LicsXHJcbiAgICAgICAgcG9zdGFsQ29kZTogOTAwMDJcclxuICAgIH0pLFxyXG4gICAgbmV3IExvY2F0aW9uKHtcclxuICAgICAgICBsb2NhdGlvbklEOiAzLFxyXG4gICAgICAgIG5hbWU6ICdKb3NoXFwnYSBBcHQnLFxyXG4gICAgICAgIGFkZHJlc3NMaW5lMTogJzQyOSBDb3JiZXR0IEF2ZScsXHJcbiAgICAgICAgcG9zdGFsQ29kZTogOTAwMDNcclxuICAgIH0pXHJcbl07XHJcblxyXG5leHBvcnRzLmxvY2F0aW9ucyA9IHRlc3REYXRhO1xyXG4iLCIvKiogSW5ib3ggdGVzdCBkYXRhICoqL1xyXG52YXIgTWVzc2FnZSA9IHJlcXVpcmUoJy4uL21vZGVscy9NZXNzYWdlJyk7XHJcblxyXG52YXIgVGltZSA9IHJlcXVpcmUoJy4uL3V0aWxzL1RpbWUnKTtcclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxudmFyIHRvZGF5ID0gbmV3IERhdGUoKSxcclxuICAgIHllc3RlcmRheSA9IG5ldyBEYXRlKCksXHJcbiAgICBsYXN0V2VlayA9IG5ldyBEYXRlKCksXHJcbiAgICBvbGREYXRlID0gbmV3IERhdGUoKTtcclxueWVzdGVyZGF5LnNldERhdGUoeWVzdGVyZGF5LmdldERhdGUoKSAtIDEpO1xyXG5sYXN0V2Vlay5zZXREYXRlKGxhc3RXZWVrLmdldERhdGUoKSAtIDIpO1xyXG5vbGREYXRlLnNldERhdGUob2xkRGF0ZS5nZXREYXRlKCkgLSAxNik7XHJcblxyXG52YXIgdGVzdERhdGEgPSBbXHJcbiAgICBuZXcgTWVzc2FnZSh7XHJcbiAgICAgICAgaWQ6IDEsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG5ldyBUaW1lKHRvZGF5LCAxMSwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0NPTkZJUk0tU3VzYW4gRGVlJyxcclxuICAgICAgICBjb250ZW50OiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgbGluazogJy9jb252ZXJzYXRpb24vMScsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogJyQ3MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctd2FybmluZydcclxuICAgIH0pLFxyXG4gICAgbmV3IE1lc3NhZ2Uoe1xyXG4gICAgICAgIGlkOiAzLFxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBuZXcgVGltZSh5ZXN0ZXJkYXksIDEzLCAwLCAwKSxcclxuXHJcbiAgICAgICAgc3ViamVjdDogJ0RvIHlvdSBkbyBcIkV4b3RpYyBNYXNzYWdlXCI/JyxcclxuICAgICAgICBjb250ZW50OiAnSGksIEkgd2FudGVkIHRvIGtub3cgaWYgeW91IHBlcmZvcm0gYXMgcGFyIG9mIHlvdXIgc2VydmljZXMuLi4nLFxyXG4gICAgICAgIGxpbms6ICcvY29udmVyc2F0aW9uLzMnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1zaGFyZS1hbHQnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IE1lc3NhZ2Uoe1xyXG4gICAgICAgIGlkOiAyLFxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBuZXcgVGltZShsYXN0V2VlaywgMTIsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdKb3NoIERhbmllbHNvbicsXHJcbiAgICAgICAgY29udGVudDogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UnLFxyXG4gICAgICAgIGxpbms6ICcvY29udmVyc2F0aW9uLzInLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KSxcclxuICAgIG5ldyBNZXNzYWdlKHtcclxuICAgICAgICBpZDogNCxcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbmV3IFRpbWUob2xkRGF0ZSwgMTUsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdJbnF1aXJ5JyxcclxuICAgICAgICBjb250ZW50OiAnQW5vdGhlciBxdWVzdGlvbiBmcm9tIGFub3RoZXIgY2xpZW50LicsXHJcbiAgICAgICAgbGluazogJy9jb252ZXJzYXRpb24vNCcsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXNoYXJlLWFsdCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pXHJcbl07XHJcblxyXG5leHBvcnRzLm1lc3NhZ2VzID0gdGVzdERhdGE7XHJcbiIsIi8qKiBTZXJ2aWNlcyB0ZXN0IGRhdGEgKiovXHJcbnZhciBTZXJ2aWNlID0gcmVxdWlyZSgnLi4vbW9kZWxzL1NlcnZpY2UnKTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IFtcclxuICAgIG5ldyBTZXJ2aWNlICh7XHJcbiAgICAgICAgbmFtZTogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UnLFxyXG4gICAgICAgIHByaWNlOiA5NSxcclxuICAgICAgICBkdXJhdGlvbjogMTIwXHJcbiAgICB9KSxcclxuICAgIG5ldyBTZXJ2aWNlKHtcclxuICAgICAgICBuYW1lOiAnVGlzc3VlIE1hc3NhZ2UnLFxyXG4gICAgICAgIHByaWNlOiA2MCxcclxuICAgICAgICBkdXJhdGlvbjogNjBcclxuICAgIH0pLFxyXG4gICAgbmV3IFNlcnZpY2Uoe1xyXG4gICAgICAgIG5hbWU6ICdTcGVjaWFsIG9pbHMnLFxyXG4gICAgICAgIHByaWNlOiA5NSxcclxuICAgICAgICBpc0FkZG9uOiB0cnVlXHJcbiAgICB9KSxcclxuICAgIG5ldyBTZXJ2aWNlKHtcclxuICAgICAgICBuYW1lOiAnU29tZSBzZXJ2aWNlIGV4dHJhJyxcclxuICAgICAgICBwcmljZTogNDAsXHJcbiAgICAgICAgZHVyYXRpb246IDIwLFxyXG4gICAgICAgIGlzQWRkb246IHRydWVcclxuICAgIH0pXHJcbl07XHJcblxyXG5leHBvcnRzLnNlcnZpY2VzID0gdGVzdERhdGE7XHJcbiIsIi8qKiBcclxuICAgIHRpbWVTbG90c1xyXG4gICAgdGVzdGluZyBkYXRhXHJcbioqL1xyXG5cclxudmFyIFRpbWUgPSByZXF1aXJlKCcuLi91dGlscy9UaW1lJyk7XHJcblxyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG52YXIgdG9kYXkgPSBuZXcgRGF0ZSgpLFxyXG4gICAgdG9tb3Jyb3cgPSBuZXcgRGF0ZSgpO1xyXG50b21vcnJvdy5zZXREYXRlKHRvbW9ycm93LmdldERhdGUoKSArIDEpO1xyXG5cclxudmFyIHN0b2RheSA9IG1vbWVudCh0b2RheSkuZm9ybWF0KCdZWVlZLU1NLUREJyksXHJcbiAgICBzdG9tb3Jyb3cgPSBtb21lbnQodG9tb3Jyb3cpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xyXG5cclxudmFyIHRlc3REYXRhMSA9IFtcclxuICAgIFRpbWUodG9kYXksIDksIDE1KSxcclxuICAgIFRpbWUodG9kYXksIDExLCAzMCksXHJcbiAgICBUaW1lKHRvZGF5LCAxMiwgMCksXHJcbiAgICBUaW1lKHRvZGF5LCAxMiwgMzApLFxyXG4gICAgVGltZSh0b2RheSwgMTYsIDE1KSxcclxuICAgIFRpbWUodG9kYXksIDE4LCAwKSxcclxuICAgIFRpbWUodG9kYXksIDE4LCAzMCksXHJcbiAgICBUaW1lKHRvZGF5LCAxOSwgMCksXHJcbiAgICBUaW1lKHRvZGF5LCAxOSwgMzApLFxyXG4gICAgVGltZSh0b2RheSwgMjEsIDMwKSxcclxuICAgIFRpbWUodG9kYXksIDIyLCAwKVxyXG5dO1xyXG5cclxudmFyIHRlc3REYXRhMiA9IFtcclxuICAgIFRpbWUodG9tb3Jyb3csIDgsIDApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTAsIDMwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDExLCAwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDExLCAzMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMiwgMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMiwgMzApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTMsIDApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTMsIDMwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDE0LCA0NSksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxNiwgMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxNiwgMzApXHJcbl07XHJcblxyXG52YXIgdGVzdERhdGFCdXN5ID0gW1xyXG5dO1xyXG5cclxudmFyIHRlc3REYXRhID0ge1xyXG4gICAgJ2RlZmF1bHQnOiB0ZXN0RGF0YUJ1c3lcclxufTtcclxudGVzdERhdGFbc3RvZGF5XSA9IHRlc3REYXRhMTtcclxudGVzdERhdGFbc3RvbW9ycm93XSA9IHRlc3REYXRhMjtcclxuXHJcbmV4cG9ydHMudGltZVNsb3RzID0gdGVzdERhdGE7XHJcbiIsIi8qKlxyXG4gICAgVXRpbGl0eSB0byBoZWxwIHRyYWNrIHRoZSBzdGF0ZSBvZiBjYWNoZWQgZGF0YVxyXG4gICAgbWFuYWdpbmcgdGltZSwgcHJlZmVyZW5jZSBhbmQgaWYgbXVzdCBiZSByZXZhbGlkYXRlZFxyXG4gICAgb3Igbm90LlxyXG4gICAgXHJcbiAgICBJdHMganVzdCBtYW5hZ2VzIG1ldGEgZGF0YSwgYnV0IG5vdCB0aGUgZGF0YSB0byBiZSBjYWNoZWQuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG5mdW5jdGlvbiBDYWNoZUNvbnRyb2wob3B0aW9ucykge1xyXG4gICAgXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAvLyBBIG51bWJlciBvZiBtaWxsaXNlY29uZHMgb3JcclxuICAgIC8vIEFuIG9iamVjdCB3aXRoIGRlc2lyZWQgdW5pdHMgYW5kIGFtb3VudCwgYWxsIG9wdGlvbmFsLFxyXG4gICAgLy8gYW55IGNvbWJpbmF0aW9uIHdpdGggYWxtb3N0IG9uZSBzcGVjaWZpZWQsIHNhbXBsZTpcclxuICAgIC8vIHsgeWVhcnM6IDAsIG1vbnRoczogMCwgd2Vla3M6IDAsIFxyXG4gICAgLy8gICBkYXlzOiAwLCBob3VyczogMCwgbWludXRlczogMCwgc2Vjb25kczogMCwgbWlsbGlzZWNvbmRzOiAwIH1cclxuICAgIHRoaXMudHRsID0gbW9tZW50LmR1cmF0aW9uKG9wdGlvbnMudHRsKS5hc01pbGxpc2Vjb25kcygpO1xyXG4gICAgdGhpcy5sYXRlc3QgPSBvcHRpb25zLmxhdGVzdCB8fCBudWxsO1xyXG5cclxuICAgIHRoaXMubXVzdFJldmFsaWRhdGUgPSBmdW5jdGlvbiBtdXN0UmV2YWxpZGF0ZSgpIHtcclxuICAgICAgICB2YXIgdGRpZmYgPSB0aGlzLmxhdGVzdCAmJiBuZXcgRGF0ZSgpIC0gdGhpcy5sYXRlc3QgfHwgTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xyXG4gICAgICAgIHJldHVybiB0ZGlmZiA+IHRoaXMudHRsO1xyXG4gICAgfTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDYWNoZUNvbnRyb2w7XHJcbiIsIi8qKlxyXG4gICAgTmV3IEZ1bmN0aW9uIG1ldGhvZDogJ19kZWxheWVkJy5cclxuICAgIEl0IHJldHVybnMgYSBuZXcgZnVuY3Rpb24sIHdyYXBwaW5nIHRoZSBvcmlnaW5hbCBvbmUsXHJcbiAgICB0aGF0IG9uY2UgaXRzIGNhbGwgd2lsbCBkZWxheSB0aGUgZXhlY3V0aW9uIHRoZSBnaXZlbiBtaWxsaXNlY29uZHMsXHJcbiAgICB1c2luZyBhIHNldFRpbWVvdXQuXHJcbiAgICBUaGUgbmV3IGZ1bmN0aW9uIHJldHVybnMgJ3VuZGVmaW5lZCcgc2luY2UgaXQgaGFzIG5vdCB0aGUgcmVzdWx0LFxyXG4gICAgYmVjYXVzZSBvZiB0aGF0IGlzIG9ubHkgc3VpdGFibGUgd2l0aCByZXR1cm4tZnJlZSBmdW5jdGlvbnMgXHJcbiAgICBsaWtlIGV2ZW50IGhhbmRsZXJzLlxyXG4gICAgXHJcbiAgICBXaHk6IHNvbWV0aW1lcywgdGhlIGhhbmRsZXIgZm9yIGFuIGV2ZW50IG5lZWRzIHRvIGJlIGV4ZWN1dGVkXHJcbiAgICBhZnRlciBhIGRlbGF5IGluc3RlYWQgb2YgaW5zdGFudGx5LlxyXG4qKi9cclxuRnVuY3Rpb24ucHJvdG90eXBlLl9kZWxheWVkID0gZnVuY3Rpb24gZGVsYXllZChtaWxsaXNlY29uZHMpIHtcclxuICAgIHZhciBmbiA9IHRoaXM7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLFxyXG4gICAgICAgICAgICBhcmdzID0gYXJndW1lbnRzO1xyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmbi5hcHBseShjb250ZXh0LCBhcmdzKTtcclxuICAgICAgICB9LCBtaWxsaXNlY29uZHMpO1xyXG4gICAgfTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBFeHRlbmRpbmcgdGhlIEZ1bmN0aW9uIGNsYXNzIHdpdGggYW4gaW5oZXJpdHMgbWV0aG9kLlxyXG4gICAgXHJcbiAgICBUaGUgaW5pdGlhbCBsb3cgZGFzaCBpcyB0byBtYXJrIGl0IGFzIG5vLXN0YW5kYXJkLlxyXG4qKi9cclxuRnVuY3Rpb24ucHJvdG90eXBlLl9pbmhlcml0cyA9IGZ1bmN0aW9uIF9pbmhlcml0cyhzdXBlckN0b3IpIHtcclxuICAgIHRoaXMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XHJcbiAgICAgICAgY29uc3RydWN0b3I6IHtcclxuICAgICAgICAgICAgdmFsdWU6IHRoaXMsXHJcbiAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICB3cml0YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgVXRpbGl0eSB0aGF0IGFsbG93cyB0byBrZWVwIGFuIG9yaWdpbmFsIG1vZGVsIHVudG91Y2hlZFxyXG4gICAgd2hpbGUgZWRpdGluZyBhIHZlcnNpb24sIGhlbHBpbmcgc3luY2hyb25pemUgYm90aFxyXG4gICAgd2hlbiBkZXNpcmVkIGJ5IHB1c2gvcHVsbC9zeW5jLWluZy5cclxuICAgIFxyXG4gICAgSXRzIHRoZSB1c3VhbCB3YXkgdG8gd29yayBvbiBmb3Jtcywgd2hlcmUgYW4gaW4gbWVtb3J5XHJcbiAgICBtb2RlbCBjYW4gYmUgdXNlZCBidXQgaW4gYSBjb3B5IHNvIGNoYW5nZXMgZG9lc24ndCBhZmZlY3RzXHJcbiAgICBvdGhlciB1c2VzIG9mIHRoZSBpbi1tZW1vcnkgbW9kZWwgKGFuZCBhdm9pZHMgcmVtb3RlIHN5bmNpbmcpXHJcbiAgICB1bnRpbCB0aGUgY29weSB3YW50IHRvIGJlIHBlcnNpc3RlZCBieSBwdXNoaW5nIGl0LCBvciBiZWluZ1xyXG4gICAgZGlzY2FyZGVkIG9yIHJlZnJlc2hlZCB3aXRoIGEgcmVtb3RlbHkgdXBkYXRlZCBvcmlnaW5hbCBtb2RlbC5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXI7XHJcblxyXG5mdW5jdGlvbiBNb2RlbFZlcnNpb24ob3JpZ2luYWwpIHtcclxuICAgIFxyXG4gICAgRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMub3JpZ2luYWwgPSBvcmlnaW5hbDtcclxuICAgIFxyXG4gICAgLy8gQ3JlYXRlIHZlcnNpb25cclxuICAgIC8vICh1cGRhdGVXaXRoIHRha2VzIGNhcmUgdG8gc2V0IHRoZSBzYW1lIGRhdGFUaW1lc3RhbXApXHJcbiAgICB0aGlzLnZlcnNpb24gPSBvcmlnaW5hbC5tb2RlbC5jbG9uZSgpO1xyXG4gICAgXHJcbiAgICAvLyBDb21wdXRlZCB0aGF0IHRlc3QgZXF1YWxpdHksIGFsbG93aW5nIGJlaW5nIG5vdGlmaWVkIG9mIGNoYW5nZXNcclxuICAgIC8vIEEgcmF0ZUxpbWl0IGlzIHVzZWQgb24gZWFjaCB0byBhdm9pZCBzZXZlcmFsIHN5bmNyaG9ub3VzIG5vdGlmaWNhdGlvbnMuXHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIFJldHVybnMgdHJ1ZSB3aGVuIGJvdGggdmVyc2lvbnMgaGFzIHRoZSBzYW1lIHRpbWVzdGFtcFxyXG4gICAgKiovXHJcbiAgICB0aGlzLmFyZURpZmZlcmVudCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbiBhcmVEaWZmZXJlbnQoKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5vcmlnaW5hbC5tb2RlbC5kYXRhVGltZXN0YW1wKCkgIT09IFxyXG4gICAgICAgICAgICB0aGlzLnZlcnNpb24ubW9kZWwuZGF0YVRpbWVzdGFtcCgpXHJcbiAgICAgICAgKTtcclxuICAgIH0sIHRoaXMpLmV4dGVuZCh7IHJhdGVMaW1pdDogMCB9KTtcclxuICAgIC8qKlxyXG4gICAgICAgIFJldHVybnMgdHJ1ZSB3aGVuIHRoZSB2ZXJzaW9uIGhhcyBuZXdlciBjaGFuZ2VzIHRoYW5cclxuICAgICAgICB0aGUgb3JpZ2luYWxcclxuICAgICoqL1xyXG4gICAgdGhpcy5pc05ld2VyID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uIGlzTmV3ZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5vcmlnaW5hbC5tb2RlbC5kYXRhVGltZXN0YW1wKCkgPCBcclxuICAgICAgICAgICAgdGhpcy52ZXJzaW9uLm1vZGVsLmRhdGFUaW1lc3RhbXAoKVxyXG4gICAgICAgICk7XHJcbiAgICB9LCB0aGlzKS5leHRlbmQoeyByYXRlTGltaXQ6IDAgfSk7XHJcbiAgICAvKipcclxuICAgICAgICBSZXR1cm5zIHRydWUgd2hlbiB0aGUgdmVyc2lvbiBoYXMgb2xkZXIgY2hhbmdlcyB0aGFuXHJcbiAgICAgICAgdGhlIG9yaWdpbmFsXHJcbiAgICAqKi9cclxuICAgIHRoaXMuaXNPYnNvbGV0ZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbiBpc0NvbXB1dGVkKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMub3JpZ2luYWwubW9kZWwuZGF0YVRpbWVzdGFtcCgpID4gXHJcbiAgICAgICAgICAgIHRoaXMudmVyc2lvbi5tb2RlbC5kYXRhVGltZXN0YW1wKClcclxuICAgICAgICApO1xyXG4gICAgfSwgdGhpcykuZXh0ZW5kKHsgcmF0ZUxpbWl0OiAwIH0pO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVsVmVyc2lvbjtcclxuXHJcbk1vZGVsVmVyc2lvbi5faW5oZXJpdHMoRXZlbnRFbWl0dGVyKTtcclxuXHJcbi8qKlxyXG4gICAgU2VuZHMgdGhlIHZlcnNpb24gY2hhbmdlcyB0byB0aGUgb3JpZ2luYWxcclxuICAgIFxyXG4gICAgb3B0aW9uczoge1xyXG4gICAgICAgIGV2ZW5JZk5ld2VyOiBmYWxzZVxyXG4gICAgfVxyXG4qKi9cclxuTW9kZWxWZXJzaW9uLnByb3RvdHlwZS5wdWxsID0gZnVuY3Rpb24gcHVsbChvcHRpb25zKSB7XHJcblxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICBcclxuICAgIC8vIEJ5IGRlZmF1bHQsIG5vdGhpbmcgdG8gZG8sIG9yIGF2b2lkIG92ZXJ3cml0ZSBjaGFuZ2VzLlxyXG4gICAgdmFyIHJlc3VsdCA9IGZhbHNlO1xyXG4gICAgXHJcbiAgICBpZiAob3B0aW9ucy5ldmVuSWZOZXdlciB8fCAhdGhpcy5pc05ld2VyKCkpIHtcclxuICAgICAgICAvLyBVcGRhdGUgdmVyc2lvbiwgZ2V0dGluZyBvcmlnaW5hbFxyXG4gICAgICAgIC8vICh1cGRhdGVXaXRoIHRha2VzIGNhcmUgdG8gc2V0IHRoZSBzYW1lIGRhdGFUaW1lc3RhbXApXHJcbiAgICAgICAgLy8gRXZlciBkZWVwQ29weSwgc2luY2Ugb25seSBwcm9wZXJ0aWVzIGFuZCBmaWVsZHMgZnJvbSBtb2RlbHNcclxuICAgICAgICAvLyBhcmUgY29waWVkIGFuZCB0aGF0IG11c3QgYXZvaWQgY2lyY3VsYXIgcmVmZXJlbmNlc1xyXG4gICAgICAgIHRoaXMudmVyc2lvbi5tb2RlbC51cGRhdGVXaXRoKHRoaXMub3JpZ2luYWwsIHRydWUpO1xyXG4gICAgICAgIC8vIERvbmVcclxuICAgICAgICByZXN1bHQgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB0aGlzLmVtaXQoJ3B1bGwnLCByZXN1bHQpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgRGlzY2FyZCB0aGUgdmVyc2lvbiBjaGFuZ2VzIGdldHRpbmcgdGhlIG9yaWdpbmFsXHJcbiAgICBkYXRhLlxyXG4gICAgXHJcbiAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgZXZlbklmT2Jzb2xldGU6IGZhbHNlXHJcbiAgICB9XHJcbioqL1xyXG5Nb2RlbFZlcnNpb24ucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiBwdXNoKG9wdGlvbnMpIHtcclxuICAgIFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICBcclxuICAgIC8vIEJ5IGRlZmF1bHQsIG5vdGhpbmcgdG8gZG8sIG9yIGF2b2lkIG92ZXJ3cml0ZSBjaGFuZ2VzLlxyXG4gICAgdmFyIHJlc3VsdCA9IGZhbHNlO1xyXG4gICAgXHJcbiAgICBpZiAob3B0aW9ucy5ldmVuSWZPYnNvbGV0ZSB8fCAhdGhpcy5pc09ic29sZXRlKCkpIHtcclxuICAgICAgICAvLyBVcGRhdGUgb3JpZ2luYWxcclxuICAgICAgICAvLyAodXBkYXRlV2l0aCB0YWtlcyBjYXJlIHRvIHNldCB0aGUgc2FtZSBkYXRhVGltZXN0YW1wKVxyXG4gICAgICAgIC8vIEV2ZXIgZGVlcENvcHksIHNpbmNlIG9ubHkgcHJvcGVydGllcyBhbmQgZmllbGRzIGZyb20gbW9kZWxzXHJcbiAgICAgICAgLy8gYXJlIGNvcGllZCBhbmQgdGhhdCBtdXN0IGF2b2lkIGNpcmN1bGFyIHJlZmVyZW5jZXNcclxuICAgICAgICB0aGlzLm9yaWdpbmFsLm1vZGVsLnVwZGF0ZVdpdGgodGhpcy52ZXJzaW9uLCB0cnVlKTtcclxuICAgICAgICAvLyBEb25lXHJcbiAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdGhpcy5lbWl0KCdwdXNoJywgcmVzdWx0KTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG4vKipcclxuICAgIFNldHMgb3JpZ2luYWwgYW5kIHZlcnNpb24gb24gdGhlIHNhbWUgdmVyc2lvblxyXG4gICAgYnkgZ2V0dGluZyB0aGUgbmV3ZXN0IG9uZS5cclxuKiovXHJcbk1vZGVsVmVyc2lvbi5wcm90b3R5cGUuc3luYyA9IGZ1bmN0aW9uIHN5bmMoKSB7XHJcbiAgICBcclxuICAgIGlmICh0aGlzLmlzTmV3ZXIoKSlcclxuICAgICAgICByZXR1cm4gdGhpcy5wdXNoKCk7XHJcbiAgICBlbHNlIGlmICh0aGlzLmlzT2Jzb2xldGUoKSlcclxuICAgICAgICByZXR1cm4gdGhpcy5wdWxsKCk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG59O1xyXG4iLCIvKipcclxuICAgIFJlbW90ZU1vZGVsIGNsYXNzLlxyXG4gICAgXHJcbiAgICBJdCBoZWxwcyBtYW5hZ2luZyBhIG1vZGVsIGluc3RhbmNlLCBtb2RlbCB2ZXJzaW9uc1xyXG4gICAgZm9yIGluIG1lbW9yeSBtb2RpZmljYXRpb24sIGFuZCB0aGUgcHJvY2VzcyB0byBcclxuICAgIHJlY2VpdmUgb3Igc2VuZCB0aGUgbW9kZWwgZGF0YVxyXG4gICAgdG8gYSByZW1vdGUgc291cmNlcywgd2l0aCBnbHVlIGNvZGUgZm9yIHRoZSB0YXNrc1xyXG4gICAgYW5kIHN0YXRlIHByb3BlcnRpZXMuXHJcbiAgICBcclxuICAgIEV2ZXJ5IGluc3RhbmNlIG9yIHN1YmNsYXNzIG11c3QgaW1wbGVtZW50XHJcbiAgICB0aGUgZmV0Y2ggYW5kIHB1bGwgbWV0aG9kcyB0aGF0IGtub3dzIHRoZSBzcGVjaWZpY3NcclxuICAgIG9mIHRoZSByZW1vdGVzLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIE1vZGVsVmVyc2lvbiA9IHJlcXVpcmUoJy4uL3V0aWxzL01vZGVsVmVyc2lvbicpLFxyXG4gICAgQ2FjaGVDb250cm9sID0gcmVxdWlyZSgnLi4vdXRpbHMvQ2FjaGVDb250cm9sJyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBsb2NhbGZvcmFnZSA9IHJlcXVpcmUoJ2xvY2FsZm9yYWdlJyksXHJcbiAgICBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXI7XHJcblxyXG5mdW5jdGlvbiBSZW1vdGVNb2RlbChvcHRpb25zKSB7XHJcblxyXG4gICAgRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XHJcbiAgICBcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgXHJcbiAgICB2YXIgZmlyc3RUaW1lTG9hZCA9IHRydWU7XHJcbiAgICBcclxuICAgIC8vIE1hcmtzIGEgbG9jayBsb2FkaW5nIGlzIGhhcHBlbmluZywgYW55IHVzZXIgY29kZVxyXG4gICAgLy8gbXVzdCB3YWl0IGZvciBpdFxyXG4gICAgdGhpcy5pc0xvYWRpbmcgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuICAgIC8vIE1hcmtzIGEgbG9jayBzYXZpbmcgaXMgaGFwcGVuaW5nLCBhbnkgdXNlciBjb2RlXHJcbiAgICAvLyBtdXN0IHdhaXQgZm9yIGl0XHJcbiAgICB0aGlzLmlzU2F2aW5nID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcbiAgICAvLyBNYXJrcyBhIGJhY2tncm91bmQgc3luY2hyb25pemF0aW9uOiBsb2FkIG9yIHNhdmUsXHJcbiAgICAvLyB1c2VyIGNvZGUga25vd3MgaXMgaGFwcGVuaW5nIGJ1dCBjYW4gY29udGludWVcclxuICAgIC8vIHVzaW5nIGNhY2hlZCBkYXRhXHJcbiAgICB0aGlzLmlzU3luY2luZyA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgLy8gVXRpbGl0eSB0byBrbm93IHdoZXRoZXIgYW55IGxvY2tpbmcgb3BlcmF0aW9uIGlzXHJcbiAgICAvLyBoYXBwZW5pbmcuXHJcbiAgICAvLyBKdXN0IGxvYWRpbmcgb3Igc2F2aW5nXHJcbiAgICB0aGlzLmlzTG9ja2VkID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNMb2FkaW5nKCkgfHwgdGhpcy5pc1NhdmluZygpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIGlmICghb3B0aW9ucy5kYXRhKVxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUmVtb3RlTW9kZWwgZGF0YSBtdXN0IGJlIHNldCBvbiBjb25zdHJ1Y3RvciBhbmQgbm8gY2hhbmdlZCBsYXRlcicpO1xyXG4gICAgdGhpcy5kYXRhID0gb3B0aW9ucy5kYXRhO1xyXG4gICAgXHJcbiAgICB0aGlzLmNhY2hlID0gbmV3IENhY2hlQ29udHJvbCh7XHJcbiAgICAgICAgdHRsOiBvcHRpb25zLnR0bFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIE9wdGlvbmFsIG5hbWUgdXNlZCB0byBwZXJzaXN0IGEgY29weSBvZiB0aGUgZGF0YSBhcyBwbGFpbiBvYmplY3RcclxuICAgIC8vIGluIHRoZSBsb2NhbCBzdG9yYWdlIG9uIGV2ZXJ5IHN1Y2Nlc3NmdWxseSBsb2FkL3NhdmUgb3BlcmF0aW9uLlxyXG4gICAgLy8gV2l0aCBubyBuYW1lLCBubyBzYXZlZCAoZGVmYXVsdCkuXHJcbiAgICAvLyBJdCB1c2VzICdsb2NhbGZvcmFnZScsIHNvIG1heSBiZSBub3Qgc2F2ZWQgdXNpbmcgbG9jYWxTdG9yYWdlIGFjdHVhbGx5LFxyXG4gICAgLy8gYnV0IGFueSBzdXBwb3J0ZWQgYW5kIGluaXRpYWxpemVkIHN0b3JhZ2Ugc3lzdGVtLCBsaWtlIFdlYlNRTCwgSW5kZXhlZERCIG9yIExvY2FsU3RvcmFnZS5cclxuICAgIC8vIGxvY2FsZm9yYWdlIG11c3QgaGF2ZSBhIHNldC11cCBwcmV2aW91cyB1c2Ugb2YgdGhpcyBvcHRpb24uXHJcbiAgICB0aGlzLmxvY2FsU3RvcmFnZU5hbWUgPSBvcHRpb25zLmxvY2FsU3RvcmFnZU5hbWUgfHwgbnVsbDtcclxuICAgIFxyXG4gICAgLy8gUmVjb21tZW5kZWQgd2F5IHRvIGdldCB0aGUgaW5zdGFuY2UgZGF0YVxyXG4gICAgLy8gc2luY2UgaXQgZW5zdXJlcyB0byBsYXVuY2ggYSBsb2FkIG9mIHRoZVxyXG4gICAgLy8gZGF0YSBlYWNoIHRpbWUgaXMgYWNjZXNzZWQgdGhpcyB3YXkuXHJcbiAgICB0aGlzLmdldERhdGEgPSBmdW5jdGlvbiBnZXREYXRhKCkge1xyXG4gICAgICAgIHRoaXMubG9hZCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGE7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMubmV3VmVyc2lvbiA9IGZ1bmN0aW9uIG5ld1ZlcnNpb24oKSB7XHJcbiAgICAgICAgdmFyIHYgPSBuZXcgTW9kZWxWZXJzaW9uKHRoaXMuZGF0YSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVXBkYXRlIHRoZSB2ZXJzaW9uIGRhdGEgd2l0aCB0aGUgb3JpZ2luYWxcclxuICAgICAgICAvLyBhZnRlciBhIGxvY2sgbG9hZCBmaW5pc2gsIGxpa2UgdGhlIGZpcnN0IHRpbWUsXHJcbiAgICAgICAgLy8gc2luY2UgdGhlIFVJIHRvIGVkaXQgdGhlIHZlcnNpb24gd2lsbCBiZSBsb2NrXHJcbiAgICAgICAgLy8gaW4gdGhlIG1pZGRsZS5cclxuICAgICAgICB0aGlzLmlzTG9hZGluZy5zdWJzY3JpYmUoZnVuY3Rpb24gKGlzSXQpIHtcclxuICAgICAgICAgICAgaWYgKCFpc0l0KSB7XHJcbiAgICAgICAgICAgICAgICB2LnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFNhdmUgdGhlIHJlbW90ZSB3aGVuIHN1Y2Nlc3NmdWxseSBwdXNoZWQgdGhlIG5ldyB2ZXJzaW9uXHJcbiAgICAgICAgdi5vbigncHVzaCcsIGZ1bmN0aW9uKHN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgaWYgKHN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2F2ZSgpXHJcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIHZlcnNpb24gZGF0YSB3aXRoIHRoZSBuZXcgb25lXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZnJvbSB0aGUgcmVtb3RlLCB0aGF0IG1heSBpbmNsdWRlIHJlbW90ZSBjb21wdXRlZFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHZhbHVlczpcclxuICAgICAgICAgICAgICAgICAgICB2LnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSnVzdCBjYXRjaCB0aGUgZXJyb3IgdG8gYXZvaWQgJ3Vua25vdyBlcnJvcidzIGZyb20gYmVpbmdcclxuICAgICAgICAgICAgICAgICAgICAvLyBsb2dnZWQgb24gdGhlIGNvbnNvbGU7IHRoZSBlcnJvciBjYW4gYmUgbGlzdGVuaW5nIG9uXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlICdlcnJvcicgZXZlbnQuXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIHJldHVybiB2O1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgdGhpcy5mZXRjaCA9IG9wdGlvbnMuZmV0Y2ggfHwgZnVuY3Rpb24gZmV0Y2goKSB7IHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkJyk7IH07XHJcbiAgICB0aGlzLnB1c2ggPSBvcHRpb25zLnB1c2ggfHwgZnVuY3Rpb24gcHVzaCgpIHsgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZCcpOyB9O1xyXG5cclxuICAgIHRoaXMubG9hZCA9IGZ1bmN0aW9uIGxvYWQoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuY2FjaGUubXVzdFJldmFsaWRhdGUoKSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGZpcnN0VGltZUxvYWQpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzTG9hZGluZyh0cnVlKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc1N5bmNpbmcodHJ1ZSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpLFxyXG4gICAgICAgICAgICAgICAgbG9jYWxQcm9taXNlID0gbnVsbDtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIElmIGxvY2FsIHN0b3JhZ2UgaXMgc2V0IGZvciB0aGlzLCBsb2FkIGZpcnN0XHJcbiAgICAgICAgICAgIC8vIGZyb20gbG9jYWwsIHRoZW4gZm9sbG93IHdpdGggc3luY2luZyBmcm9tIHJlbW90ZVxyXG4gICAgICAgICAgICBpZiAoZmlyc3RUaW1lTG9hZCAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5sb2NhbFN0b3JhZ2VOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBTZXQgYm90aCBsb2NhbFByb21pc2UgYW5kIHByb21pc2UsXHJcbiAgICAgICAgICAgICAgICAvLyBzaW5jZSB3ZSBvbmx5IHdpbGwgd2FpdCBmb3IgbG9jYWxQcm9taXNlIGFuZCB0aGVcclxuICAgICAgICAgICAgICAgIC8vIG90aGVyIG9uZSBpcyByZXF1aXJlZCBieSB0aGUgcmVtb3RlIGxvYWRpbmdcclxuICAgICAgICAgICAgICAgIGxvY2FsUHJvbWlzZSA9IHByb21pc2UgPSBsb2NhbGZvcmFnZS5nZXRJdGVtKHRoaXMubG9jYWxTdG9yYWdlTmFtZSlcclxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGxvY2FsRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2NhbERhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhLm1vZGVsLnVwZGF0ZVdpdGgobG9jYWxEYXRhLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIExvYWQgZG9uZTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlzU3luY2luZyhmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXaGVuIG5vIGRhdGEsIHJldHVybiB0aGUgZ2VuZXJhbCBwcm9taXNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoYXQgd2lsbCBmdWxsZmlsbCBhZnRlciBzZXJ2ZXIgbG9hZDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUGVyZm9ybSB0aGUgcmVtb3RlIGxvYWQgKGl0IGRvZXNuJ3QgbWF0dGVyIGlmIGEgbG9jYWwgbG9hZFxyXG4gICAgICAgICAgICAvLyBoYXBwZW5lZCBvciBub3QpLCBnZXR0aW5nIHRoZSBuZXcgcHJvbWlzZVxyXG4gICAgICAgICAgICBwcm9taXNlID0gcHJvbWlzZVxyXG4gICAgICAgICAgICAudGhlbih0aGlzLmZldGNoLmJpbmQodGhpcykpXHJcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChzZXJ2ZXJEYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VydmVyRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEV2ZXIgZGVlcENvcHksIHNpbmNlIHBsYWluIGRhdGEgZnJvbSB0aGUgc2VydmVyIChhbmQgYW55XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaW4gYmV0d2VlbiBjb252ZXJzaW9uIG9uICdmZWN0aCcpIGNhbm5vdCBoYXZlIGNpcmN1bGFyXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVmZXJlbmNlczpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGEubW9kZWwudXBkYXRlV2l0aChzZXJ2ZXJEYXRhLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcGVyc2lzdGVudCBsb2NhbCBjb3B5P1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmxvY2FsU3RvcmFnZU5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxmb3JhZ2Uuc2V0SXRlbSh0aGlzLmxvY2FsU3RvcmFnZU5hbWUsIHNlcnZlckRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUmVtb3RlIG1vZGVsIGRpZCBub3QgcmV0dXJuZWQgZGF0YSwgcmVzcG9uc2UgbXVzdCBiZSBhIFwiTm90IEZvdW5kXCInKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gRXZlbnRcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzTG9hZGluZygpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdsb2FkJywgc2VydmVyRGF0YSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3N5bmNlZCcsIHNlcnZlckRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBGaW5hbGx5OiBjb21tb24gdGFza3Mgb24gc3VjY2VzcyBvciBlcnJvclxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc1N5bmNpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB0aGlzLmNhY2hlLmxhdGVzdCA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kYXRhO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcykpXHJcbiAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdmFyIHdhc0xvYWQgPSB0aGlzLmlzTG9hZGluZygpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBGaW5hbGx5OiBjb21tb24gdGFza3Mgb24gc3VjY2VzcyBvciBlcnJvclxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc1N5bmNpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBFdmVudFxyXG4gICAgICAgICAgICAgICAgdmFyIGVyclBrZyA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0YXNrOiB3YXNMb2FkID8gJ2xvYWQnIDogJ3N5bmMnLFxyXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAvLyBCZSBjYXJlZnVsIHdpdGggJ2Vycm9yJyBldmVudCwgaXMgc3BlY2lhbCBhbmQgc3RvcHMgZXhlY3V0aW9uIG9uIGVtaXRcclxuICAgICAgICAgICAgICAgIC8vIGlmIG5vIGxpc3RlbmVycyBhdHRhY2hlZDogb3ZlcndyaXR0aW5nIHRoYXQgYmVoYXZpb3IgYnkganVzdFxyXG4gICAgICAgICAgICAgICAgLy8gcHJpbnQgb24gY29uc29sZSB3aGVuIG5vdGhpbmcsIG9yIGVtaXQgaWYgc29tZSBsaXN0ZW5lcjpcclxuICAgICAgICAgICAgICAgIGlmIChFdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCh0aGlzLCAnZXJyb3InKSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyUGtnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIExvZyBpdCB3aGVuIG5vdCBoYW5kbGVkIChldmVuIGlmIHRoZSBwcm9taXNlIGVycm9yIGlzIGhhbmRsZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignUmVtb3RlTW9kZWwgRXJyb3InLCBlcnJQa2cpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBSZXRocm93IGVycm9yXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gRmlyc3QgdGltZSwgYmxvY2tpbmcgbG9hZDpcclxuICAgICAgICAgICAgLy8gaXQgcmV0dXJucyB3aGVuIHRoZSBsb2FkIHJldHVybnNcclxuICAgICAgICAgICAgaWYgKGZpcnN0VGltZUxvYWQpIHtcclxuICAgICAgICAgICAgICAgIGZpcnN0VGltZUxvYWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIC8vIEl0IHJldHVybnMgdGhlIHByb21pc2UgdG8gdGhlIGxvY2FsIHN0b3JhZ2UgbG9hZGluZ1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgYW55LCBvciB0aGUgcmVtb3RlIGxvYWRpbmcgcHJvbWlzZSwgYmVjYXVzZVxyXG4gICAgICAgICAgICAgICAgLy8gd2UgbXVzdCByZXNvbHZlIGFzIHNvb24gdGhlcmUgaXMgZGF0YS5cclxuICAgICAgICAgICAgICAgIHJldHVybiBsb2NhbFByb21pc2UgfHwgcHJvbWlzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIEJhY2tncm91bmQgbG9hZDogaXMgbG9hZGluZyBzdGlsbFxyXG4gICAgICAgICAgICAgICAgLy8gYnV0IHdlIGhhdmUgY2FjaGVkIGRhdGEgc28gd2UgdXNlXHJcbiAgICAgICAgICAgICAgICAvLyB0aGF0IGZvciBub3cuIElmIGFueXRoaW5nIG5ldyBmcm9tIG91dHNpZGVcclxuICAgICAgICAgICAgICAgIC8vIHZlcnNpb25zIHdpbGwgZ2V0IG5vdGlmaWVkIHdpdGggaXNPYnNvbGV0ZSgpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFJldHVybiBjYWNoZWQgZGF0YSwgbm8gbmVlZCB0byBsb2FkIGFnYWluIGZvciBub3cuXHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5kYXRhKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICAgICAgdGhpcy5pc1NhdmluZyh0cnVlKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBQcmVzZXJ2ZSB0aGUgdGltZXN0YW1wIGFmdGVyIGJlaW5nIHNhdmVkXHJcbiAgICAgICAgLy8gdG8gYXZvaWQgZmFsc2UgJ29ic29sZXRlJyB3YXJuaW5ncyB3aXRoXHJcbiAgICAgICAgLy8gdGhlIHZlcnNpb24gdGhhdCBjcmVhdGVkIHRoZSBuZXcgb3JpZ2luYWxcclxuICAgICAgICB2YXIgdHMgPSB0aGlzLmRhdGEubW9kZWwuZGF0YVRpbWVzdGFtcCgpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5wdXNoKClcclxuICAgICAgICAudGhlbihmdW5jdGlvbiAoc2VydmVyRGF0YSkge1xyXG4gICAgICAgICAgICAvLyBFdmVyIGRlZXBDb3B5LCBzaW5jZSBwbGFpbiBkYXRhIGZyb20gdGhlIHNlcnZlclxyXG4gICAgICAgICAgICAvLyBjYW5ub3QgaGF2ZSBjaXJjdWxhciByZWZlcmVuY2VzOlxyXG4gICAgICAgICAgICB0aGlzLmRhdGEubW9kZWwudXBkYXRlV2l0aChzZXJ2ZXJEYXRhLCB0cnVlKTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLm1vZGVsLmRhdGFUaW1lc3RhbXAodHMpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gcGVyc2lzdGVudCBsb2NhbCBjb3B5P1xyXG4gICAgICAgICAgICBpZiAodGhpcy5sb2NhbFN0b3JhZ2VOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBsb2NhbGZvcmFnZS5zZXRJdGVtKHRoaXMubG9jYWxTdG9yYWdlTmFtZSwgc2VydmVyRGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIEV2ZW50XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnc2F2ZWQnLCBzZXJ2ZXJEYXRhKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIEZpbmFsbHk6IGNvbW1vbiB0YXNrcyBvbiBzdWNjZXNzIG9yIGVycm9yXHJcbiAgICAgICAgICAgIHRoaXMuaXNTYXZpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5jYWNoZS5sYXRlc3QgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kYXRhO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSlcclxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgIC8vIEZpbmFsbHk6IGNvbW1vbiB0YXNrcyBvbiBzdWNjZXNzIG9yIGVycm9yXHJcbiAgICAgICAgICAgIHRoaXMuaXNTYXZpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gRXZlbnRcclxuICAgICAgICAgICAgdmFyIGVyclBrZyA9IHtcclxuICAgICAgICAgICAgICAgIHRhc2s6ICdzYXZlJyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLy8gQmUgY2FyZWZ1bCB3aXRoICdlcnJvcicgZXZlbnQsIGlzIHNwZWNpYWwgYW5kIHN0b3BzIGV4ZWN1dGlvbiBvbiBlbWl0XHJcbiAgICAgICAgICAgIC8vIGlmIG5vIGxpc3RlbmVycyBhdHRhY2hlZDogb3ZlcndyaXR0aW5nIHRoYXQgYmVoYXZpb3IgYnkganVzdFxyXG4gICAgICAgICAgICAvLyBwcmludCBvbiBjb25zb2xlIHdoZW4gbm90aGluZywgb3IgZW1pdCBpZiBzb21lIGxpc3RlbmVyOlxyXG4gICAgICAgICAgICBpZiAoRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQodGhpcywgJ2Vycm9yJykgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyUGtnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIExvZyBpdCB3aGVuIG5vdCBoYW5kbGVkIChldmVuIGlmIHRoZSBwcm9taXNlIGVycm9yIGlzIGhhbmRsZWQpXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdSZW1vdGVNb2RlbCBFcnJvcicsIGVyclBrZyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFJldGhyb3cgZXJyb3JcclxuICAgICAgICAgICAgcmV0dXJuIGVycjtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgTGF1bmNoIGEgc3luY2luZyByZXF1ZXN0LiBSZXR1cm5zIG5vdGhpbmcsIHRoZVxyXG4gICAgICAgIHdheSB0byB0cmFjayBhbnkgcmVzdWx0IGlzIHdpdGggZXZlbnRzIG9yIFxyXG4gICAgICAgIHRoZSBpbnN0YW5jZSBvYnNlcnZhYmxlcy5cclxuICAgICAgICBJTVBPUlRBTlQ6IHJpZ2h0IG5vdyBpcyBqdXN0IGEgcmVxdWVzdCBmb3IgJ2xvYWQnXHJcbiAgICAgICAgdGhhdCBhdm9pZHMgcHJvbWlzZSBlcnJvcnMgZnJvbSB0aHJvd2luZy5cclxuICAgICoqL1xyXG4gICAgdGhpcy5zeW5jID0gZnVuY3Rpb24gc3luYygpIHtcclxuICAgICAgICAvLyBDYWxsIGZvciBhIGxvYWQsIHRoYXQgd2lsbCBiZSB0cmVhdGVkIGFzICdzeW5jaW5nJyBhZnRlciB0aGVcclxuICAgICAgICAvLyBmaXJzdCBsb2FkXHJcbiAgICAgICAgdGhpcy5sb2FkKClcclxuICAgICAgICAvLyBBdm9pZCBlcnJvcnMgZnJvbSB0aHJvd2luZyBpbiB0aGUgY29uc29sZSxcclxuICAgICAgICAvLyB0aGUgJ2Vycm9yJyBldmVudCBpcyB0aGVyZSB0byB0cmFjayBhbnlvbmUuXHJcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKCkge30pO1xyXG4gICAgfTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZW1vdGVNb2RlbDtcclxuXHJcblJlbW90ZU1vZGVsLl9pbmhlcml0cyhFdmVudEVtaXR0ZXIpO1xyXG4iLCIvKipcclxuICAgIFJFU1QgQVBJIGFjY2Vzc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZnVuY3Rpb24gbG93ZXJGaXJzdExldHRlcihuKSB7XHJcbiAgICByZXR1cm4gbiAmJiBuWzBdICYmIG5bMF0udG9Mb3dlckNhc2UgJiYgKG5bMF0udG9Mb3dlckNhc2UoKSArIG4uc2xpY2UoMSkpIHx8IG47XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGxvd2VyQ2FtZWxpemVPYmplY3Qob2JqKSB7XHJcbiAgICAvL2pzaGludCBtYXhjb21wbGV4aXR5OjhcclxuICAgIFxyXG4gICAgaWYgKCFvYmogfHwgdHlwZW9mKG9iaikgIT09ICdvYmplY3QnKSByZXR1cm4gb2JqO1xyXG5cclxuICAgIHZhciByZXQgPSBBcnJheS5pc0FycmF5KG9iaikgPyBbXSA6IHt9O1xyXG4gICAgZm9yKHZhciBrIGluIG9iaikge1xyXG4gICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoaykpIHtcclxuICAgICAgICAgICAgdmFyIG5ld2sgPSBsb3dlckZpcnN0TGV0dGVyKGspO1xyXG4gICAgICAgICAgICByZXRbbmV3a10gPSB0eXBlb2Yob2JqW2tdKSA9PT0gJ29iamVjdCcgP1xyXG4gICAgICAgICAgICAgICAgbG93ZXJDYW1lbGl6ZU9iamVjdChvYmpba10pIDpcclxuICAgICAgICAgICAgICAgIG9ialtrXVxyXG4gICAgICAgICAgICA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJldDtcclxufVxyXG5cclxuZnVuY3Rpb24gUmVzdChvcHRpb25zT3JVcmwpIHtcclxuICAgIFxyXG4gICAgdmFyIHVybCA9IHR5cGVvZihvcHRpb25zT3JVcmwpID09PSAnc3RyaW5nJyA/XHJcbiAgICAgICAgb3B0aW9uc09yVXJsIDpcclxuICAgICAgICBvcHRpb25zT3JVcmwgJiYgb3B0aW9uc09yVXJsLnVybDtcclxuXHJcbiAgICB0aGlzLmJhc2VVcmwgPSB1cmw7XHJcbiAgICAvLyBPcHRpb25hbCBleHRyYUhlYWRlcnMgZm9yIGFsbCByZXF1ZXN0cyxcclxuICAgIC8vIHVzdWFsbHkgZm9yIGF1dGhlbnRpY2F0aW9uIHRva2Vuc1xyXG4gICAgdGhpcy5leHRyYUhlYWRlcnMgPSBudWxsO1xyXG59XHJcblxyXG5SZXN0LnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiBnZXQoYXBpVXJsLCBkYXRhKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KGFwaVVybCwgJ2dldCcsIGRhdGEpO1xyXG59O1xyXG5cclxuUmVzdC5wcm90b3R5cGUucHV0ID0gZnVuY3Rpb24gZ2V0KGFwaVVybCwgZGF0YSkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChhcGlVcmwsICdwdXQnLCBkYXRhKTtcclxufTtcclxuXHJcblJlc3QucHJvdG90eXBlLnBvc3QgPSBmdW5jdGlvbiBnZXQoYXBpVXJsLCBkYXRhKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KGFwaVVybCwgJ3Bvc3QnLCBkYXRhKTtcclxufTtcclxuXHJcblJlc3QucHJvdG90eXBlLmRlbGV0ZSA9IGZ1bmN0aW9uIGdldChhcGlVcmwsIGRhdGEpIHtcclxuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoYXBpVXJsLCAnZGVsZXRlJywgZGF0YSk7XHJcbn07XHJcblxyXG5SZXN0LnByb3RvdHlwZS5wdXRGaWxlID0gZnVuY3Rpb24gcHV0RmlsZShhcGlVcmwsIGRhdGEpIHtcclxuICAgIC8vIE5PVEUgYmFzaWMgcHV0RmlsZSBpbXBsZW1lbnRhdGlvbiwgb25lIGZpbGUsIHVzZSBmaWxlVXBsb2FkP1xyXG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChhcGlVcmwsICdkZWxldGUnLCBkYXRhLCAnbXVsdGlwYXJ0L2Zvcm0tZGF0YScpO1xyXG59O1xyXG5cclxuUmVzdC5wcm90b3R5cGUucmVxdWVzdCA9IGZ1bmN0aW9uIHJlcXVlc3QoYXBpVXJsLCBodHRwTWV0aG9kLCBkYXRhLCBjb250ZW50VHlwZSkge1xyXG4gICAgXHJcbiAgICB2YXIgdGhpc1Jlc3QgPSB0aGlzO1xyXG4gICAgdmFyIHVybCA9IHRoaXMuYmFzZVVybCArIGFwaVVybDtcclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCQuYWpheCh7XHJcbiAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgLy8gQXZvaWQgY2FjaGUgZm9yIGRhdGEuXHJcbiAgICAgICAgY2FjaGU6IGZhbHNlLFxyXG4gICAgICAgIGRhdGFUeXBlOiAnanNvbicsXHJcbiAgICAgICAgbWV0aG9kOiBodHRwTWV0aG9kLFxyXG4gICAgICAgIGhlYWRlcnM6IHRoaXMuZXh0cmFIZWFkZXJzLFxyXG4gICAgICAgIC8vIFVSTEVOQ09ERUQgaW5wdXQ6XHJcbiAgICAgICAgLy8gQ29udmVydCB0byBKU09OIGFuZCBiYWNrIGp1c3QgdG8gZW5zdXJlIHRoZSB2YWx1ZXMgYXJlIGNvbnZlcnRlZC9lbmNvZGVkXHJcbiAgICAgICAgLy8gcHJvcGVybHkgdG8gYmUgc2VudCwgbGlrZSBEYXRlcyBiZWluZyBjb252ZXJ0ZWQgdG8gSVNPIGZvcm1hdC5cclxuICAgICAgICBkYXRhOiBkYXRhICYmIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZGF0YSkpLFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiBjb250ZW50VHlwZSB8fCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ1xyXG4gICAgICAgIC8vIEFsdGVybmF0ZTogSlNPTiBhcyBpbnB1dFxyXG4gICAgICAgIC8vZGF0YTogSlNPTi5zdHJpbmdpZnkoZGF0YSksXHJcbiAgICAgICAgLy9jb250ZW50VHlwZTogY29udGVudFR5cGUgfHwgJ2FwcGxpY2F0aW9uL2pzb24nXHJcbiAgICB9KSlcclxuICAgIC50aGVuKGxvd2VyQ2FtZWxpemVPYmplY3QpXHJcbiAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgLy8gT24gYXV0aG9yaXphdGlvbiBlcnJvciwgZ2l2ZSBvcG9ydHVuaXR5IHRvIHJldHJ5IHRoZSBvcGVyYXRpb25cclxuICAgICAgICBpZiAoZXJyLnN0YXR1cyA9PT0gNDAxKSB7XHJcbiAgICAgICAgICAgIHZhciByZXRyeSA9IHJlcXVlc3QuYmluZCh0aGlzLCBhcGlVcmwsIGh0dHBNZXRob2QsIGRhdGEsIGNvbnRlbnRUeXBlKTtcclxuICAgICAgICAgICAgdmFyIHJldHJ5UHJvbWlzZSA9IHRoaXNSZXN0Lm9uQXV0aG9yaXphdGlvblJlcXVpcmVkKHJldHJ5KTtcclxuICAgICAgICAgICAgaWYgKHJldHJ5UHJvbWlzZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSXQgcmV0dXJuZWQgc29tZXRoaW5nLCBleHBlY3RpbmcgaXMgYSBwcm9taXNlOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXRyeVByb21pc2UpXHJcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgICAgICAvLyBUaGVyZSBpcyBlcnJvciBvbiByZXRyeSwganVzdCByZXR1cm4gdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gb3JpZ2luYWwgY2FsbCBlcnJvclxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnI7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBieSBkZWZhdWx0LCBjb250aW51ZSBwcm9wYWdhdGluZyB0aGUgZXJyb3JcclxuICAgICAgICByZXR1cm4gZXJyO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG5SZXN0LnByb3RvdHlwZS5vbkF1dGhvcml6YXRpb25SZXF1aXJlZCA9IGZ1bmN0aW9uIG9uQXV0aG9yaXphdGlvblJlcXVpcmVkKHJldHJ5KSB7XHJcbiAgICAvLyBUbyBiZSBpbXBsZW1lbnRlZCBvdXRzaWRlLCBieSBkZWZhdWx0IGRvbid0IHdhaXRcclxuICAgIC8vIGZvciByZXRyeSwganVzdCByZXR1cm4gbm90aGluZzpcclxuICAgIHJldHVybjtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVzdDtcclxuIiwiLyoqXHJcbiAgICBUaW1lIGNsYXNzIHV0aWxpdHkuXHJcbiAgICBTaG9ydGVyIHdheSB0byBjcmVhdGUgYSBEYXRlIGluc3RhbmNlXHJcbiAgICBzcGVjaWZ5aW5nIG9ubHkgdGhlIFRpbWUgcGFydCxcclxuICAgIGRlZmF1bHRpbmcgdG8gY3VycmVudCBkYXRlIG9yIFxyXG4gICAgYW5vdGhlciByZWFkeSBkYXRlIGluc3RhbmNlLlxyXG4qKi9cclxuZnVuY3Rpb24gVGltZShkYXRlLCBob3VyLCBtaW51dGUsIHNlY29uZCkge1xyXG4gICAgaWYgKCEoZGF0ZSBpbnN0YW5jZW9mIERhdGUpKSB7XHJcbiBcclxuICAgICAgICBzZWNvbmQgPSBtaW51dGU7XHJcbiAgICAgICAgbWludXRlID0gaG91cjtcclxuICAgICAgICBob3VyID0gZGF0ZTtcclxuICAgICAgICBcclxuICAgICAgICBkYXRlID0gbmV3IERhdGUoKTsgICBcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IERhdGUoZGF0ZS5nZXRGdWxsWWVhcigpLCBkYXRlLmdldE1vbnRoKCksIGRhdGUuZ2V0RGF0ZSgpLCBob3VyIHx8IDAsIG1pbnV0ZSB8fCAwLCBzZWNvbmQgfHwgMCk7XHJcbn1cclxubW9kdWxlLmV4cG9ydHMgPSBUaW1lO1xyXG4iLCIvKipcclxuICAgIENyZWF0ZSBhbiBBY2Nlc3MgQ29udHJvbCBmb3IgYW4gYXBwIHRoYXQganVzdCBjaGVja3NcclxuICAgIHRoZSBhY3Rpdml0eSBwcm9wZXJ0eSBmb3IgYWxsb3dlZCB1c2VyIGxldmVsLlxyXG4gICAgVG8gYmUgcHJvdmlkZWQgdG8gU2hlbGwuanMgYW5kIHVzZWQgYnkgdGhlIGFwcC5qcyxcclxuICAgIHZlcnkgdGllZCB0byB0aGF0IGJvdGggY2xhc3Nlcy5cclxuICAgIFxyXG4gICAgQWN0aXZpdGllcyBjYW4gZGVmaW5lIG9uIGl0cyBvYmplY3QgYW4gYWNjZXNzTGV2ZWxcclxuICAgIHByb3BlcnR5IGxpa2UgbmV4dCBleGFtcGxlc1xyXG4gICAgXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJ0eXBlLlVzZXI7IC8vIGFueW9uZVxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Bbm9ueW1vdXM7IC8vIGFub255bW91cyB1c2VycyBvbmx5XHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7IC8vIGF1dGhlbnRpY2F0ZWQgdXNlcnMgb25seVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy8gVXNlclR5cGUgZW51bWVyYXRpb24gaXMgYml0IGJhc2VkLCBzbyBzZXZlcmFsXHJcbi8vIHVzZXJzIGNhbiBoYXMgYWNjZXNzIGluIGEgc2luZ2xlIHByb3BlcnR5XHJcbnZhciBVc2VyVHlwZSA9IHJlcXVpcmUoJy4uL21vZGVscy9Vc2VyJykuVXNlclR5cGU7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZUFjY2Vzc0NvbnRyb2woYXBwKSB7XHJcbiAgICBcclxuICAgIHJldHVybiBmdW5jdGlvbiBhY2Nlc3NDb250cm9sKHJvdXRlKSB7XHJcblxyXG4gICAgICAgIHZhciBhY3Rpdml0eSA9IGFwcC5nZXRBY3Rpdml0eUNvbnRyb2xsZXJCeVJvdXRlKHJvdXRlKTtcclxuXHJcbiAgICAgICAgdmFyIHVzZXIgPSBhcHAubW9kZWwudXNlcigpO1xyXG4gICAgICAgIHZhciBjdXJyZW50VHlwZSA9IHVzZXIgJiYgdXNlci51c2VyVHlwZSgpO1xyXG5cclxuICAgICAgICBpZiAoYWN0aXZpdHkgJiYgYWN0aXZpdHkuYWNjZXNzTGV2ZWwpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBjYW4gPSBhY3Rpdml0eS5hY2Nlc3NMZXZlbCAmIGN1cnJlbnRUeXBlO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKCFjYW4pIHtcclxuICAgICAgICAgICAgICAgIC8vIE5vdGlmeSBlcnJvciwgd2h5IGNhbm5vdCBhY2Nlc3NcclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWRMZXZlbDogYWN0aXZpdHkuYWNjZXNzTGV2ZWwsXHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFR5cGU6IGN1cnJlbnRUeXBlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBBbGxvd1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfTtcclxufTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIHVud3JhcCA9IGZ1bmN0aW9uIHVud3JhcCh2YWx1ZSkge1xyXG4gICAgcmV0dXJuICh0eXBlb2YodmFsdWUpID09PSAnZnVuY3Rpb24nID8gdmFsdWUoKSA6IHZhbHVlKTtcclxufTtcclxuXHJcbmV4cG9ydHMuZGVmaW5lQ3J1ZEFwaUZvclJlc3QgPSBmdW5jdGlvbiBkZWZpbmVDcnVkQXBpRm9yUmVzdChzZXR0aW5ncykge1xyXG4gICAgXHJcbiAgICB2YXIgZXh0ZW5kZWRPYmplY3QgPSBzZXR0aW5ncy5leHRlbmRlZE9iamVjdCxcclxuICAgICAgICBNb2RlbCA9IHNldHRpbmdzLk1vZGVsLFxyXG4gICAgICAgIG1vZGVsTmFtZSA9IHNldHRpbmdzLm1vZGVsTmFtZSxcclxuICAgICAgICBtb2RlbExpc3ROYW1lID0gc2V0dGluZ3MubW9kZWxMaXN0TmFtZSxcclxuICAgICAgICBtb2RlbFVybCA9IHNldHRpbmdzLm1vZGVsVXJsLFxyXG4gICAgICAgIGlkUHJvcGVydHlOYW1lID0gc2V0dGluZ3MuaWRQcm9wZXJ0eU5hbWU7XHJcblxyXG4gICAgZXh0ZW5kZWRPYmplY3RbJ2dldCcgKyBtb2RlbExpc3ROYW1lXSA9IGZ1bmN0aW9uIGdldExpc3QoZmlsdGVycykge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLnJlc3QuZ2V0KG1vZGVsVXJsLCBmaWx0ZXJzKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJhd0l0ZW1zKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByYXdJdGVtcyAmJiByYXdJdGVtcy5tYXAoZnVuY3Rpb24ocmF3SXRlbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBNb2RlbChyYXdJdGVtKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBleHRlbmRlZE9iamVjdFsnZ2V0JyArIG1vZGVsTmFtZV0gPSBmdW5jdGlvbiBnZXRJdGVtKGl0ZW1JRCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLnJlc3QuZ2V0KG1vZGVsVXJsICsgJy8nICsgaXRlbUlEKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJhd0l0ZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJhd0l0ZW0gJiYgbmV3IE1vZGVsKHJhd0l0ZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBleHRlbmRlZE9iamVjdFsncG9zdCcgKyBtb2RlbE5hbWVdID0gZnVuY3Rpb24gcG9zdEl0ZW0oYW5JdGVtKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5wb3N0KG1vZGVsVXJsLCBhbkl0ZW0pXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oc2VydmVySXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IE1vZGVsKHNlcnZlckl0ZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBleHRlbmRlZE9iamVjdFsncHV0JyArIG1vZGVsTmFtZV0gPSBmdW5jdGlvbiBwdXRJdGVtKGFuSXRlbSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlc3QucHV0KG1vZGVsVXJsICsgJy8nICsgdW53cmFwKGFuSXRlbVtpZFByb3BlcnR5TmFtZV0pLCBhbkl0ZW0pXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oc2VydmVySXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IE1vZGVsKHNlcnZlckl0ZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgZXh0ZW5kZWRPYmplY3RbJ3NldCcgKyBtb2RlbE5hbWVdID0gZnVuY3Rpb24gc2V0SXRlbShhbkl0ZW0pIHtcclxuICAgICAgICB2YXIgaWQgPSB1bndyYXAoYW5JdGVtW2lkUHJvcGVydHlOYW1lXSk7XHJcbiAgICAgICAgaWYgKGlkKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1sncHV0JyArIG1vZGVsTmFtZV0oYW5JdGVtKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzWydwb3N0JyArIG1vZGVsTmFtZV0oYW5JdGVtKTtcclxuICAgIH07XHJcblxyXG4gICAgZXh0ZW5kZWRPYmplY3RbJ2RlbCcgKyBtb2RlbE5hbWVdID0gZnVuY3Rpb24gZGVsSXRlbShhbkl0ZW0pIHtcclxuICAgICAgICB2YXIgaWQgPSBhbkl0ZW0gJiYgdW53cmFwKGFuSXRlbVtpZFByb3BlcnR5TmFtZV0pIHx8XHJcbiAgICAgICAgICAgICAgICBhbkl0ZW07XHJcbiAgICAgICAgaWYgKGlkKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXN0LmRlbGV0ZShtb2RlbFVybCArICcvJyArIGlkLCBhbkl0ZW0pXHJcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGRlbGV0ZWRJdGVtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVsZXRlZEl0ZW0gJiYgbmV3IE1vZGVsKGRlbGV0ZWRJdGVtKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05lZWQgYW4gSUQgb3IgYW4gb2JqZWN0IHdpdGggdGhlIElEIHByb3BlcnR5IHRvIGRlbGV0ZScpO1xyXG4gICAgfTtcclxufTsiLCIvKipcclxuICAgIEJvb3Rrbm9jazogU2V0IG9mIEtub2Nrb3V0IEJpbmRpbmcgSGVscGVycyBmb3IgQm9vdHN0cmFwIGpzIGNvbXBvbmVudHMgKGpxdWVyeSBwbHVnaW5zKVxyXG4gICAgXHJcbiAgICBEZXBlbmRlbmNpZXM6IGpxdWVyeVxyXG4gICAgSW5qZWN0ZWQgZGVwZW5kZW5jaWVzOiBrbm9ja291dFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy8gRGVwZW5kZW5jaWVzXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbi8vIERJIGkxOG4gbGlicmFyeVxyXG5leHBvcnRzLmkxOG4gPSBudWxsO1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlSGVscGVycyhrbykge1xyXG4gICAgdmFyIGhlbHBlcnMgPSB7fTtcclxuXHJcbiAgICAvKiogUG9wb3ZlciBCaW5kaW5nICoqL1xyXG4gICAgaGVscGVycy5wb3BvdmVyID0ge1xyXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24oZWxlbWVudCwgdmFsdWVBY2Nlc3NvciwgYWxsQmluZGluZ3MpIHtcclxuICAgICAgICAgICAgdmFyIHNyY09wdGlvbnMgPSBrby51bndyYXAodmFsdWVBY2Nlc3NvcigpKTtcclxuXHJcbiAgICAgICAgICAgIC8vIER1cGxpY2F0aW5nIG9wdGlvbnMgb2JqZWN0IHRvIHBhc3MgdG8gcG9wb3ZlciB3aXRob3V0XHJcbiAgICAgICAgICAgIC8vIG92ZXJ3cml0dG5nIHNvdXJjZSBjb25maWd1cmF0aW9uXHJcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNyY09wdGlvbnMpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVW53cmFwcGluZyBjb250ZW50IHRleHRcclxuICAgICAgICAgICAgb3B0aW9ucy5jb250ZW50ID0ga28udW53cmFwKHNyY09wdGlvbnMuY29udGVudCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jb250ZW50KSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gTG9jYWxpemU6XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zLmNvbnRlbnQgPSBcclxuICAgICAgICAgICAgICAgICAgICBleHBvcnRzLmkxOG4gJiYgZXhwb3J0cy5pMThuLnQob3B0aW9ucy5jb250ZW50KSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuY29udGVudDtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gVG8gZ2V0IHRoZSBuZXcgb3B0aW9ucywgd2UgbmVlZCBkZXN0cm95IGl0IGZpcnN0OlxyXG4gICAgICAgICAgICAgICAgJChlbGVtZW50KS5wb3BvdmVyKCdkZXN0cm95JykucG9wb3ZlcihvcHRpb25zKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBTZSBtdWVzdHJhIHNpIGVsIGVsZW1lbnRvIHRpZW5lIGVsIGZvY29cclxuICAgICAgICAgICAgICAgIGlmICgkKGVsZW1lbnQpLmlzKCc6Zm9jdXMnKSlcclxuICAgICAgICAgICAgICAgICAgICAkKGVsZW1lbnQpLnBvcG92ZXIoJ3Nob3cnKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkKGVsZW1lbnQpLnBvcG92ZXIoJ2Rlc3Ryb3knKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBcclxuICAgIHJldHVybiBoZWxwZXJzO1xyXG59XHJcblxyXG4vKipcclxuICAgIFBsdWcgaGVscGVycyBpbiB0aGUgcHJvdmlkZWQgS25vY2tvdXQgaW5zdGFuY2VcclxuKiovXHJcbmZ1bmN0aW9uIHBsdWdJbihrbywgcHJlZml4KSB7XHJcbiAgICB2YXIgbmFtZSxcclxuICAgICAgICBoZWxwZXJzID0gY3JlYXRlSGVscGVycyhrbyk7XHJcbiAgICBcclxuICAgIGZvcih2YXIgaCBpbiBoZWxwZXJzKSB7XHJcbiAgICAgICAgaWYgKGhlbHBlcnMuaGFzT3duUHJvcGVydHkgJiYgIWhlbHBlcnMuaGFzT3duUHJvcGVydHkoaCkpXHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICBuYW1lID0gcHJlZml4ID8gcHJlZml4ICsgaFswXS50b1VwcGVyQ2FzZSgpICsgaC5zbGljZSgxKSA6IGg7XHJcbiAgICAgICAga28uYmluZGluZ0hhbmRsZXJzW25hbWVdID0gaGVscGVyc1toXTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0cy5wbHVnSW4gPSBwbHVnSW47XHJcbmV4cG9ydHMuY3JlYXRlQmluZGluZ0hlbHBlcnMgPSBjcmVhdGVIZWxwZXJzO1xyXG4iLCIvKipcclxuICAgIEtub2Nrb3V0IEJpbmRpbmcgSGVscGVyIGZvciB0aGUgQm9vdHN0cmFwIFN3aXRjaCBwbHVnaW4uXHJcbiAgICBcclxuICAgIERlcGVuZGVuY2llczoganF1ZXJ5LCBib290c3RyYXAsIGJvb3RzdHJhcC1zd2l0Y2hcclxuICAgIEluamVjdGVkIGRlcGVuZGVuY2llczoga25vY2tvdXRcclxuICAgIFxyXG4gICAgSU1QT1JUQU5UIE5PVEVTOlxyXG4gICAgLSBBIGNvbnNvbGUgZXJyb3Igb2YgdHlwZSBcIm9iamVjdCBoYXMgbm90IHRoYXQgcHJvcGVydHlcIiB3aWxsIGhhcHBlbiBpZiBzcGVjaWZpZWRcclxuICAgICAgICBhIG5vbiBleGlzdGFudCBvcHRpb24gaW4gdGhlIGJpbmRpbmcuIFRoZSBlcnJvciBsb29rcyBzdHJhbmdlIHdoZW4gdXNpbmcgdGhlIG1pbmlmaWVkIGZpbGUuXHJcbiAgICAtIFRoZSBvcmRlciBvZiBvcHRpb25zIGluIHRoZSBiaW5kaW5nIG1hdHRlcnMgd2hlbiBjb21iaW5pbmcgd2l0aCBkaXNhYmxlZCBhbmQgcmVhZG9ubHlcclxuICAgICAgICBvcHRpb25zOiBpZiB0aGUgZWxlbWVudCBpcyBkaXNhYmxlZDp0cnVlIG9yIHJlYWRvbmx5OnRydWUsIGFueSBhdHRlbXB0IHRvIGNoYW5nZSB0aGVcclxuICAgICAgICB2YWx1ZSB3aWxsIGZhaWwgc2lsZW50bHksIHNvIGlmIHRoZSBzYW1lIGJpbmRpbmcgdXBkYXRlIGNoYW5nZXMgZGlzYWJsZWQgdG8gZmFsc2VcclxuICAgICAgICBhbmQgdGhlIHN0YXRlLCB0aGUgJ2Rpc2FibGVkJyBjaGFuZ2UgbXVzdCBoYXBwZW5zIGJlZm9yZSB0aGUgJ3N0YXRlJyBjaGFuZ2Ugc28gYm90aFxyXG4gICAgICAgIGFyZSBzdWNjZXNzZnVsbHkgdXBkYXRlZC4gRm9yIHRoYXQsIGp1c3Qgc3BlY2lmeSAnZGlzYWJsZWQnIGJlZm9yZSAnc3RhdGUnIGluIHRoZSBiaW5kaW5nc1xyXG4gICAgICAgIGRlZmluaXRpb24uXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vLyBEZXBlbmRlbmNpZXNcclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnYm9vdHN0cmFwJyk7XHJcbnJlcXVpcmUoJ2Jvb3RzdHJhcC1zd2l0Y2gnKTtcclxuXHJcbi8qKlxyXG4gICAgQ3JlYXRlIGFuZCBwbHVnLWluIHRoZSBCaW5kaW5nIGluIHRoZSBwcm92aWRlZCBLbm9ja291dCBpbnN0YW5jZVxyXG4qKi9cclxuZXhwb3J0cy5wbHVnSW4gPSBmdW5jdGlvbiBwbHVnSW4oa28sIHByZWZpeCkge1xyXG5cclxuICAgIGtvLmJpbmRpbmdIYW5kbGVyc1twcmVmaXggPyBwcmVmaXggKyAnc3dpdGNoJyA6ICdzd2l0Y2gnXSA9IHtcclxuICAgICAgICBpbml0OiBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZUFjY2Vzc29yLCBhbGxCaW5kaW5ncykge1xyXG4gICAgICAgICAgICAvLyBDcmVhdGUgcGx1Z2luIGluc3RhbmNlXHJcbiAgICAgICAgICAgICQoZWxlbWVudCkuYm9vdHN0cmFwU3dpdGNoKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzd2l0Y2ggaW5pdCcsIGtvLnRvSlModmFsdWVBY2Nlc3NvcigpKSk7XHJcblxyXG4gICAgICAgICAgICAvLyBVcGRhdGluZyB2YWx1ZSBvbiBwbHVnaW4gY2hhbmdlc1xyXG4gICAgICAgICAgICAkKGVsZW1lbnQpLm9uKCdzd2l0Y2hDaGFuZ2UuYm9vdHN0cmFwU3dpdGNoJywgZnVuY3Rpb24gKGUsIHN0YXRlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHZhbHVlQWNjZXNzb3IoKSB8fCB7fTtcclxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3N3aXRjaENoYW5nZScsIGtvLnRvSlModikpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBjaGFuZ2VkP1xyXG4gICAgICAgICAgICAgICAgdmFyIG9sZFN0YXRlID0gISFrby51bndyYXAodi5zdGF0ZSksXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3U3RhdGUgPSAhIXN0YXRlO1xyXG4gICAgICAgICAgICAgICAgLy8gT25seSB1cGRhdGUgb24gY2hhbmdlXHJcbiAgICAgICAgICAgICAgICBpZiAob2xkU3RhdGUgIT09IG5ld1N0YXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtvLmlzT2JzZXJ2YWJsZSh2LnN0YXRlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoa28uaXNXcml0ZWFibGVPYnNlcnZhYmxlKHYuc3RhdGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2LnN0YXRlKG5ld1N0YXRlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHYuc3RhdGUgPSBuZXdTdGF0ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZUFjY2Vzc29yLCBhbGxCaW5kaW5ncykge1xyXG4gICAgICAgICAgICAvLyBHZXQgb3B0aW9ucyB0byBiZSBhcHBsaWVkIHRvIHRoZSBwbHVnaW4gaW5zdGFuY2VcclxuICAgICAgICAgICAgdmFyIHNyY09wdGlvbnMgPSB2YWx1ZUFjY2Vzc29yKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHNyY09wdGlvbnMgfHwge307XHJcblxyXG4gICAgICAgICAgICAvLyBVbndyYXBwaW5nIGV2ZXJ5IG9wdGlvbiB2YWx1ZSwgZ2V0dGluZyBhIGR1cGxpY2F0ZWRcclxuICAgICAgICAgICAgLy8gcGxhaW4gb2JqZWN0XHJcbiAgICAgICAgICAgIG9wdGlvbnMgPSBrby50b0pTKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzd2l0Y2ggdXBkYXRlJywgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgICAgICB2YXIgJGVsID0gJChlbGVtZW50KTtcclxuICAgICAgICAgICAgLy8gVXBkYXRlIGV2ZXJ5IG9wdGlvbiBpbiB0aGUgcGx1Z2luXHJcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKG9wdGlvbnMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgICAgICAkZWwuYm9vdHN0cmFwU3dpdGNoKGtleSwgb3B0aW9uc1trZXldKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBFc3BhY2UgYSBzdHJpbmcgZm9yIHVzZSBvbiBhIFJlZ0V4cC5cclxuICAgIFVzdWFsbHksIHRvIGxvb2sgZm9yIGEgc3RyaW5nIGluIGEgdGV4dCBtdWx0aXBsZSB0aW1lc1xyXG4gICAgb3Igd2l0aCBzb21lIGV4cHJlc3Npb25zLCBzb21lIGNvbW1vbiBhcmUgXHJcbiAgICBsb29rIGZvciBhIHRleHQgJ2luIHRoZSBiZWdpbm5pbmcnICheKVxyXG4gICAgb3IgJ2F0IHRoZSBlbmQnICgkKS5cclxuICAgIFxyXG4gICAgQXV0aG9yOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vdXNlcnMvMTUxMzEyL2Nvb2xhajg2IGFuZCBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vdXNlcnMvOTQxMC9hcmlzdG90bGUtcGFnYWx0emlzXHJcbiAgICBMaW5rOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS82OTY5NDg2XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vLyBSZWZlcnJpbmcgdG8gdGhlIHRhYmxlIGhlcmU6XHJcbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL3JlZ2V4cFxyXG4vLyB0aGVzZSBjaGFyYWN0ZXJzIHNob3VsZCBiZSBlc2NhcGVkXHJcbi8vIFxcIF4gJCAqICsgPyAuICggKSB8IHsgfSBbIF1cclxuLy8gVGhlc2UgY2hhcmFjdGVycyBvbmx5IGhhdmUgc3BlY2lhbCBtZWFuaW5nIGluc2lkZSBvZiBicmFja2V0c1xyXG4vLyB0aGV5IGRvIG5vdCBuZWVkIHRvIGJlIGVzY2FwZWQsIGJ1dCB0aGV5IE1BWSBiZSBlc2NhcGVkXHJcbi8vIHdpdGhvdXQgYW55IGFkdmVyc2UgZWZmZWN0cyAodG8gdGhlIGJlc3Qgb2YgbXkga25vd2xlZGdlIGFuZCBjYXN1YWwgdGVzdGluZylcclxuLy8gOiAhICwgPSBcclxuLy8gbXkgdGVzdCBcIn4hQCMkJV4mKigpe31bXWAvPT8rXFx8LV87OidcXFwiLDwuPlwiLm1hdGNoKC9bXFwjXS9nKVxyXG5cclxudmFyIHNwZWNpYWxzID0gW1xyXG4gICAgLy8gb3JkZXIgbWF0dGVycyBmb3IgdGhlc2VcclxuICAgICAgXCItXCJcclxuICAgICwgXCJbXCJcclxuICAgICwgXCJdXCJcclxuICAgIC8vIG9yZGVyIGRvZXNuJ3QgbWF0dGVyIGZvciBhbnkgb2YgdGhlc2VcclxuICAgICwgXCIvXCJcclxuICAgICwgXCJ7XCJcclxuICAgICwgXCJ9XCJcclxuICAgICwgXCIoXCJcclxuICAgICwgXCIpXCJcclxuICAgICwgXCIqXCJcclxuICAgICwgXCIrXCJcclxuICAgICwgXCI/XCJcclxuICAgICwgXCIuXCJcclxuICAgICwgXCJcXFxcXCJcclxuICAgICwgXCJeXCJcclxuICAgICwgXCIkXCJcclxuICAgICwgXCJ8XCJcclxuICBdXHJcblxyXG4gIC8vIEkgY2hvb3NlIHRvIGVzY2FwZSBldmVyeSBjaGFyYWN0ZXIgd2l0aCAnXFwnXHJcbiAgLy8gZXZlbiB0aG91Z2ggb25seSBzb21lIHN0cmljdGx5IHJlcXVpcmUgaXQgd2hlbiBpbnNpZGUgb2YgW11cclxuLCByZWdleCA9IFJlZ0V4cCgnWycgKyBzcGVjaWFscy5qb2luKCdcXFxcJykgKyAnXScsICdnJylcclxuO1xyXG5cclxudmFyIGVzY2FwZVJlZ0V4cCA9IGZ1bmN0aW9uIChzdHIpIHtcclxucmV0dXJuIHN0ci5yZXBsYWNlKHJlZ2V4LCBcIlxcXFwkJlwiKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZXNjYXBlUmVnRXhwO1xyXG5cclxuLy8gdGVzdCBlc2NhcGVSZWdFeHAoXCIvcGF0aC90by9yZXM/c2VhcmNoPXRoaXMudGhhdFwiKVxyXG4iLCIvKipcclxuKiBlc2NhcGVTZWxlY3RvclxyXG4qXHJcbiogc291cmNlOiBodHRwOi8va2p2YXJnYS5ibG9nc3BvdC5jb20uZXMvMjAwOS8wNi9qcXVlcnktcGx1Z2luLXRvLWVzY2FwZS1jc3Mtc2VsZWN0b3IuaHRtbFxyXG4qXHJcbiogRXNjYXBlIGFsbCBzcGVjaWFsIGpRdWVyeSBDU1Mgc2VsZWN0b3IgY2hhcmFjdGVycyBpbiAqc2VsZWN0b3IqLlxyXG4qIFVzZWZ1bCB3aGVuIHlvdSBoYXZlIGEgY2xhc3Mgb3IgaWQgd2hpY2ggY29udGFpbnMgc3BlY2lhbCBjaGFyYWN0ZXJzXHJcbiogd2hpY2ggeW91IG5lZWQgdG8gaW5jbHVkZSBpbiBhIHNlbGVjdG9yLlxyXG4qL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgc3BlY2lhbHMgPSBbXHJcbiAgJyMnLCAnJicsICd+JywgJz0nLCAnPicsIFxyXG4gIFwiJ1wiLCAnOicsICdcIicsICchJywgJzsnLCAnLCdcclxuXTtcclxudmFyIHJlZ2V4U3BlY2lhbHMgPSBbXHJcbiAgJy4nLCAnKicsICcrJywgJ3wnLCAnWycsICddJywgJygnLCAnKScsICcvJywgJ14nLCAnJCdcclxuXTtcclxudmFyIHNSRSA9IG5ldyBSZWdFeHAoXHJcbiAgJygnICsgc3BlY2lhbHMuam9pbignfCcpICsgJ3xcXFxcJyArIHJlZ2V4U3BlY2lhbHMuam9pbignfFxcXFwnKSArICcpJywgJ2cnXHJcbik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgcmV0dXJuIHNlbGVjdG9yLnJlcGxhY2Uoc1JFLCAnXFxcXCQxJyk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgUmVhZCBhIHBhZ2UncyBHRVQgVVJMIHZhcmlhYmxlcyBhbmQgcmV0dXJuIHRoZW0gYXMgYW4gYXNzb2NpYXRpdmUgYXJyYXkuXHJcbioqL1xyXG4ndXNlciBzdHJpY3QnO1xyXG4vL2dsb2JhbCB3aW5kb3dcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0VXJsUXVlcnkodXJsKSB7XHJcblxyXG4gICAgdXJsID0gdXJsIHx8IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xyXG5cclxuICAgIHZhciB2YXJzID0gW10sIGhhc2gsXHJcbiAgICAgICAgcXVlcnlJbmRleCA9IHVybC5pbmRleE9mKCc/Jyk7XHJcbiAgICBpZiAocXVlcnlJbmRleCA+IC0xKSB7XHJcbiAgICAgICAgdmFyIGhhc2hlcyA9IHVybC5zbGljZShxdWVyeUluZGV4ICsgMSkuc3BsaXQoJyYnKTtcclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgaGFzaGVzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaGFzaCA9IGhhc2hlc1tpXS5zcGxpdCgnPScpO1xyXG4gICAgICAgICAgICB2YXJzLnB1c2goaGFzaFswXSk7XHJcbiAgICAgICAgICAgIHZhcnNbaGFzaFswXV0gPSBoYXNoWzFdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB2YXJzO1xyXG59O1xyXG4iLCIvKipcclxuICAgIFNldCBvZiB1dGlsaXRpZXMgdG8gZGVmaW5lIEphdmFzY3JpcHQgUHJvcGVydGllc1xyXG4gICAgaW5kZXBlbmRlbnRseSBvZiB0aGUgYnJvd3Nlci5cclxuICAgIFxyXG4gICAgQWxsb3dzIHRvIGRlZmluZSBnZXR0ZXJzIGFuZCBzZXR0ZXJzLlxyXG4gICAgXHJcbiAgICBBZGFwdGVkIGNvZGUgZnJvbSB0aGUgb3JpZ2luYWwgY3JlYXRlZCBieSBKZWZmIFdhbGRlblxyXG4gICAgaHR0cDovL3doZXJlc3dhbGRlbi5jb20vMjAxMC8wNC8xNi9tb3JlLXNwaWRlcm1vbmtleS1jaGFuZ2VzLWFuY2llbnQtZXNvdGVyaWMtdmVyeS1yYXJlbHktdXNlZC1zeW50YXgtZm9yLWNyZWF0aW5nLWdldHRlcnMtYW5kLXNldHRlcnMtaXMtYmVpbmctcmVtb3ZlZC9cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIGFjY2Vzc29yRGVzY3JpcHRvcihmaWVsZCwgZnVuKVxyXG57XHJcbiAgICB2YXIgZGVzYyA9IHsgZW51bWVyYWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH07XHJcbiAgICBkZXNjW2ZpZWxkXSA9IGZ1bjtcclxuICAgIHJldHVybiBkZXNjO1xyXG59XHJcblxyXG5mdW5jdGlvbiBkZWZpbmVHZXR0ZXIob2JqLCBwcm9wLCBnZXQpXHJcbntcclxuICAgIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydHkpXHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIHByb3AsIGFjY2Vzc29yRGVzY3JpcHRvcihcImdldFwiLCBnZXQpKTtcclxuICAgIGlmIChPYmplY3QucHJvdG90eXBlLl9fZGVmaW5lR2V0dGVyX18pXHJcbiAgICAgICAgcmV0dXJuIG9iai5fX2RlZmluZUdldHRlcl9fKHByb3AsIGdldCk7XHJcblxyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IGdldHRlcnNcIik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRlZmluZVNldHRlcihvYmosIHByb3AsIHNldClcclxue1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSlcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgcHJvcCwgYWNjZXNzb3JEZXNjcmlwdG9yKFwic2V0XCIsIHNldCkpO1xyXG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuX19kZWZpbmVTZXR0ZXJfXylcclxuICAgICAgICByZXR1cm4gb2JqLl9fZGVmaW5lU2V0dGVyX18ocHJvcCwgc2V0KTtcclxuXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgc2V0dGVyc1wiKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBkZWZpbmVHZXR0ZXI6IGRlZmluZUdldHRlcixcclxuICAgIGRlZmluZVNldHRlcjogZGVmaW5lU2V0dGVyXHJcbn07XHJcbiIsIi8qKlxyXG4gICAgRG9tSXRlbXNNYW5hZ2VyIGNsYXNzLCB0aGF0IG1hbmFnZSBhIGNvbGxlY3Rpb24gXHJcbiAgICBvZiBIVE1ML0RPTSBpdGVtcyB1bmRlciBhIHJvb3QvY29udGFpbmVyLCB3aGVyZVxyXG4gICAgb25seSBvbmUgZWxlbWVudCBhdCB0aGUgdGltZSBpcyB2aXNpYmxlLCBwcm92aWRpbmdcclxuICAgIHRvb2xzIHRvIHVuaXF1ZXJseSBpZGVudGlmeSB0aGUgaXRlbXMsXHJcbiAgICB0byBjcmVhdGUgb3IgdXBkYXRlIG5ldyBpdGVtcyAodGhyb3VnaCAnaW5qZWN0JyksXHJcbiAgICBnZXQgdGhlIGN1cnJlbnQsIGZpbmQgYnkgdGhlIElEIGFuZCBtb3JlLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGVzY2FwZVNlbGVjdG9yID0gcmVxdWlyZSgnLi4vZXNjYXBlU2VsZWN0b3InKTtcclxuXHJcbmZ1bmN0aW9uIERvbUl0ZW1zTWFuYWdlcihzZXR0aW5ncykge1xyXG5cclxuICAgIHRoaXMuaWRBdHRyaWJ1dGVOYW1lID0gc2V0dGluZ3MuaWRBdHRyaWJ1dGVOYW1lIHx8ICdpZCc7XHJcbiAgICB0aGlzLmFsbG93RHVwbGljYXRlcyA9ICEhc2V0dGluZ3MuYWxsb3dEdXBsaWNhdGVzIHx8IGZhbHNlO1xyXG4gICAgdGhpcy4kcm9vdCA9IG51bGw7XHJcbiAgICAvLyBPbiBwYWdlIHJlYWR5LCBnZXQgdGhlIHJvb3QgZWxlbWVudDpcclxuICAgICQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy4kcm9vdCA9ICQoc2V0dGluZ3Mucm9vdCB8fCAnYm9keScpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBEb21JdGVtc01hbmFnZXI7XHJcblxyXG5Eb21JdGVtc01hbmFnZXIucHJvdG90eXBlLmZpbmQgPSBmdW5jdGlvbiBmaW5kKGNvbnRhaW5lck5hbWUsIHJvb3QpIHtcclxuICAgIHZhciAkcm9vdCA9ICQocm9vdCB8fCB0aGlzLiRyb290KTtcclxuICAgIHJldHVybiAkcm9vdC5maW5kKCdbJyArIHRoaXMuaWRBdHRyaWJ1dGVOYW1lICsgJz1cIicgKyBlc2NhcGVTZWxlY3Rvcihjb250YWluZXJOYW1lKSArICdcIl0nKTtcclxufTtcclxuXHJcbkRvbUl0ZW1zTWFuYWdlci5wcm90b3R5cGUuZ2V0QWN0aXZlID0gZnVuY3Rpb24gZ2V0QWN0aXZlKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuJHJvb3QuZmluZCgnWycgKyB0aGlzLmlkQXR0cmlidXRlTmFtZSArICddOnZpc2libGUnKTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgSXQgYWRkcyB0aGUgaXRlbSBpbiB0aGUgaHRtbCBwcm92aWRlZCAoY2FuIGJlIG9ubHkgdGhlIGVsZW1lbnQgb3IgXHJcbiAgICBjb250YWluZWQgaW4gYW5vdGhlciBvciBhIGZ1bGwgaHRtbCBwYWdlKS5cclxuICAgIFJlcGxhY2VzIGFueSBleGlzdGFudCBpZiBkdXBsaWNhdGVzIGFyZSBub3QgYWxsb3dlZC5cclxuKiovXHJcbkRvbUl0ZW1zTWFuYWdlci5wcm90b3R5cGUuaW5qZWN0ID0gZnVuY3Rpb24gaW5qZWN0KG5hbWUsIGh0bWwpIHtcclxuXHJcbiAgICAvLyBGaWx0ZXJpbmcgaW5wdXQgaHRtbCAoY2FuIGJlIHBhcnRpYWwgb3IgZnVsbCBwYWdlcylcclxuICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEyODQ4Nzk4XHJcbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKC9eW1xcc1xcU10qPGJvZHkuKj8+fDxcXC9ib2R5PltcXHNcXFNdKiQvZywgJycpO1xyXG5cclxuICAgIC8vIENyZWF0aW5nIGEgd3JhcHBlciBhcm91bmQgdGhlIGh0bWxcclxuICAgIC8vIChjYW4gYmUgcHJvdmlkZWQgdGhlIGlubmVySHRtbCBvciBvdXRlckh0bWwsIGRvZXNuJ3QgbWF0dGVycyB3aXRoIG5leHQgYXBwcm9hY2gpXHJcbiAgICB2YXIgJGh0bWwgPSAkKCc8ZGl2Lz4nLCB7IGh0bWw6IGh0bWwgfSksXHJcbiAgICAgICAgLy8gV2UgbG9vayBmb3IgdGhlIGNvbnRhaW5lciBlbGVtZW50ICh3aGVuIHRoZSBvdXRlckh0bWwgaXMgcHJvdmlkZWQpXHJcbiAgICAgICAgJGMgPSB0aGlzLmZpbmQobmFtZSwgJGh0bWwpO1xyXG5cclxuICAgIGlmICgkYy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAvLyBJdHMgaW5uZXJIdG1sLCBzbyB0aGUgd3JhcHBlciBiZWNvbWVzIHRoZSBjb250YWluZXIgaXRzZWxmXHJcbiAgICAgICAgJGMgPSAkaHRtbC5hdHRyKHRoaXMuaWRBdHRyaWJ1dGVOYW1lLCBuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMuYWxsb3dEdXBsaWNhdGVzKSB7XHJcbiAgICAgICAgLy8gTm8gbW9yZSB0aGFuIG9uZSBjb250YWluZXIgaW5zdGFuY2UgY2FuIGV4aXN0cyBhdCB0aGUgc2FtZSB0aW1lXHJcbiAgICAgICAgLy8gV2UgbG9vayBmb3IgYW55IGV4aXN0ZW50IG9uZSBhbmQgaXRzIHJlcGxhY2VkIHdpdGggdGhlIG5ld1xyXG4gICAgICAgIHZhciAkcHJldiA9IHRoaXMuZmluZChuYW1lKTtcclxuICAgICAgICBpZiAoJHByZXYubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAkcHJldi5yZXBsYWNlV2l0aCgkYyk7XHJcbiAgICAgICAgICAgICRjID0gJHByZXY7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEFkZCB0byB0aGUgZG9jdW1lbnRcclxuICAgIC8vIChvbiB0aGUgY2FzZSBvZiBkdXBsaWNhdGVkIGZvdW5kLCB0aGlzIHdpbGwgZG8gbm90aGluZywgbm8gd29ycnkpXHJcbiAgICAkYy5hcHBlbmRUbyh0aGlzLiRyb290KTtcclxufTtcclxuXHJcbi8qKiBcclxuICAgIFRoZSBzd2l0Y2ggbWV0aG9kIHJlY2VpdmUgdGhlIGl0ZW1zIHRvIGludGVyY2hhbmdlIGFzIGFjdGl2ZSBvciBjdXJyZW50LFxyXG4gICAgdGhlICdmcm9tJyBhbmQgJ3RvJywgYW5kIHRoZSBzaGVsbCBpbnN0YW5jZSB0aGF0IE1VU1QgYmUgdXNlZFxyXG4gICAgdG8gbm90aWZ5IGVhY2ggZXZlbnQgdGhhdCBpbnZvbHZlcyB0aGUgaXRlbTpcclxuICAgIHdpbGxDbG9zZSwgd2lsbE9wZW4sIHJlYWR5LCBvcGVuZWQsIGNsb3NlZC5cclxuICAgIEl0IHJlY2VpdmVzIGFzIGxhdGVzdCBwYXJhbWV0ZXIgdGhlICdub3RpZmljYXRpb24nIG9iamVjdCB0aGF0IG11c3QgYmVcclxuICAgIHBhc3NlZCB3aXRoIHRoZSBldmVudCBzbyBoYW5kbGVycyBoYXMgY29udGV4dCBzdGF0ZSBpbmZvcm1hdGlvbi5cclxuICAgIFxyXG4gICAgSXQncyBkZXNpZ25lZCB0byBiZSBhYmxlIHRvIG1hbmFnZSB0cmFuc2l0aW9ucywgYnV0IHRoaXMgZGVmYXVsdFxyXG4gICAgaW1wbGVtZW50YXRpb24gaXMgYXMgc2ltcGxlIGFzICdzaG93IHRoZSBuZXcgYW5kIGhpZGUgdGhlIG9sZCcuXHJcbioqL1xyXG5Eb21JdGVtc01hbmFnZXIucHJvdG90eXBlLnN3aXRjaCA9IGZ1bmN0aW9uIHN3aXRjaEFjdGl2ZUl0ZW0oJGZyb20sICR0bywgc2hlbGwsIG5vdGlmaWNhdGlvbikge1xyXG5cclxuICAgIGlmICghJHRvLmlzKCc6dmlzaWJsZScpKSB7XHJcbiAgICAgICAgc2hlbGwuZW1pdChzaGVsbC5ldmVudHMud2lsbE9wZW4sICR0bywgbm90aWZpY2F0aW9uKTtcclxuICAgICAgICAkdG8uc2hvdygpO1xyXG4gICAgICAgIC8vIEl0cyBlbm91Z2ggdmlzaWJsZSBhbmQgaW4gRE9NIHRvIHBlcmZvcm0gaW5pdGlhbGl6YXRpb24gdGFza3NcclxuICAgICAgICAvLyB0aGF0IG1heSBpbnZvbHZlIGxheW91dCBpbmZvcm1hdGlvblxyXG4gICAgICAgIHNoZWxsLmVtaXQoc2hlbGwuZXZlbnRzLml0ZW1SZWFkeSwgJHRvLCBub3RpZmljYXRpb24pO1xyXG4gICAgICAgIC8vIFdoZW4gaXRzIGNvbXBsZXRlbHkgb3BlbmVkXHJcbiAgICAgICAgc2hlbGwuZW1pdChzaGVsbC5ldmVudHMub3BlbmVkLCAkdG8sIG5vdGlmaWNhdGlvbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEl0cyByZWFkeTsgbWF5YmUgaXQgd2FzIGJ1dCBzdWItbG9jYXRpb25cclxuICAgICAgICAvLyBvciBzdGF0ZSBjaGFuZ2UgbmVlZCB0byBiZSBjb21tdW5pY2F0ZWRcclxuICAgICAgICBzaGVsbC5lbWl0KHNoZWxsLmV2ZW50cy5pdGVtUmVhZHksICR0bywgbm90aWZpY2F0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoJGZyb20uaXMoJzp2aXNpYmxlJykpIHtcclxuICAgICAgICBzaGVsbC5lbWl0KHNoZWxsLmV2ZW50cy53aWxsQ2xvc2UsICRmcm9tLCBub3RpZmljYXRpb24pO1xyXG4gICAgICAgIC8vIERvICd1bmZvY3VzJyBvbiB0aGUgaGlkZGVuIGVsZW1lbnQgYWZ0ZXIgbm90aWZ5ICd3aWxsQ2xvc2UnXHJcbiAgICAgICAgLy8gZm9yIGJldHRlciBVWDogaGlkZGVuIGVsZW1lbnRzIGFyZSBub3QgcmVhY2hhYmxlIGFuZCBoYXMgZ29vZFxyXG4gICAgICAgIC8vIHNpZGUgZWZmZWN0cyBsaWtlIGhpZGRpbmcgdGhlIG9uLXNjcmVlbiBrZXlib2FyZCBpZiBhbiBpbnB1dCB3YXNcclxuICAgICAgICAvLyBmb2N1c2VkXHJcbiAgICAgICAgJGZyb20uZmluZCgnOmZvY3VzJykuYmx1cigpO1xyXG4gICAgICAgIC8vIGhpZGUgYW5kIG5vdGlmeSBpdCBlbmRlZFxyXG4gICAgICAgICRmcm9tLmhpZGUoKTtcclxuICAgICAgICBzaGVsbC5lbWl0KHNoZWxsLmV2ZW50cy5jbG9zZWQsICRmcm9tLCBub3RpZmljYXRpb24pO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAgICBJbml0aWFsaXplcyB0aGUgbGlzdCBvZiBpdGVtcy4gTm8gbW9yZSB0aGFuIG9uZVxyXG4gICAgbXVzdCBiZSBvcGVuZWQvdmlzaWJsZSBhdCB0aGUgc2FtZSB0aW1lLCBzbyBhdCB0aGUgXHJcbiAgICBpbml0IGFsbCB0aGUgZWxlbWVudHMgYXJlIGNsb3NlZCB3YWl0aW5nIHRvIHNldFxyXG4gICAgb25lIGFzIHRoZSBhY3RpdmUgb3IgdGhlIGN1cnJlbnQgb25lLlxyXG4qKi9cclxuRG9tSXRlbXNNYW5hZ2VyLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gaW5pdCgpIHtcclxuICAgIHRoaXMuZ2V0QWN0aXZlKCkuaGlkZSgpO1xyXG59O1xyXG4iLCIvKipcclxuICAgIEphdmFzY3JpdHAgU2hlbGwgZm9yIFNQQXMuXHJcbioqL1xyXG4vKmdsb2JhbCB3aW5kb3csIGRvY3VtZW50ICovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKiBESSBlbnRyeSBwb2ludHMgZm9yIGRlZmF1bHQgYnVpbGRzLiBNb3N0IGRlcGVuZGVuY2llcyBjYW4gYmVcclxuICAgIHNwZWNpZmllZCBpbiB0aGUgY29uc3RydWN0b3Igc2V0dGluZ3MgZm9yIHBlci1pbnN0YW5jZSBzZXR1cC5cclxuKiovXHJcbnZhciBkZXBzID0gcmVxdWlyZSgnLi9kZXBlbmRlbmNpZXMnKTtcclxuXHJcbi8qKiBDb25zdHJ1Y3RvciAqKi9cclxuXHJcbmZ1bmN0aW9uIFNoZWxsKHNldHRpbmdzKSB7XHJcbiAgICAvL2pzaGludCBtYXhjb21wbGV4aXR5OjE0XHJcbiAgICBcclxuICAgIGRlcHMuRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XHJcblxyXG4gICAgdGhpcy4kID0gc2V0dGluZ3MuanF1ZXJ5IHx8IGRlcHMuanF1ZXJ5O1xyXG4gICAgdGhpcy4kcm9vdCA9IHRoaXMuJChzZXR0aW5ncy5yb290KTtcclxuICAgIHRoaXMuYmFzZVVybCA9IHNldHRpbmdzLmJhc2VVcmwgfHwgJyc7XHJcbiAgICAvLyBXaXRoIGZvcmNlSGFzaGJhbmc9dHJ1ZTpcclxuICAgIC8vIC0gZnJhZ21lbnRzIFVSTHMgY2Fubm90IGJlIHVzZWQgdG8gc2Nyb2xsIHRvIGFuIGVsZW1lbnQgKGRlZmF1bHQgYnJvd3NlciBiZWhhdmlvciksXHJcbiAgICAvLyAgIHRoZXkgYXJlIGRlZmF1bHRQcmV2ZW50ZWQgdG8gYXZvaWQgY29uZnVzZSB0aGUgcm91dGluZyBtZWNoYW5pc20gYW5kIGN1cnJlbnQgVVJMLlxyXG4gICAgLy8gLSBwcmVzc2VkIGxpbmtzIHRvIGZyYWdtZW50cyBVUkxzIGFyZSBub3Qgcm91dGVkLCB0aGV5IGFyZSBza2lwcGVkIHNpbGVudGx5XHJcbiAgICAvLyAgIGV4Y2VwdCB3aGVuIHRoZXkgYXJlIGEgaGFzaGJhbmcgKCMhKS4gVGhpcyB3YXksIHNwZWNpYWwgbGlua3NcclxuICAgIC8vICAgdGhhdCBwZXJmb3JtbiBqcyBhY3Rpb25zIGRvZXNuJ3QgY29uZmxpdHMuXHJcbiAgICAvLyAtIGFsbCBVUkxzIHJvdXRlZCB0aHJvdWdoIHRoZSBzaGVsbCBpbmNsdWRlcyBhIGhhc2hiYW5nICgjISksIHRoZSBzaGVsbCBlbnN1cmVzXHJcbiAgICAvLyAgIHRoYXQgaGFwcGVucyBieSBhcHBlbmRpbmcgdGhlIGhhc2hiYW5nIHRvIGFueSBVUkwgcGFzc2VkIGluIChleGNlcHQgdGhlIHN0YW5kYXJkIGhhc2hcclxuICAgIC8vICAgdGhhdCBhcmUgc2tpcHQpLlxyXG4gICAgdGhpcy5mb3JjZUhhc2hiYW5nID0gc2V0dGluZ3MuZm9yY2VIYXNoYmFuZyB8fCBmYWxzZTtcclxuICAgIHRoaXMubGlua0V2ZW50ID0gc2V0dGluZ3MubGlua0V2ZW50IHx8ICdjbGljayc7XHJcbiAgICB0aGlzLnBhcnNlVXJsID0gKHNldHRpbmdzLnBhcnNlVXJsIHx8IGRlcHMucGFyc2VVcmwpLmJpbmQodGhpcywgdGhpcy5iYXNlVXJsKTtcclxuICAgIHRoaXMuYWJzb2x1dGl6ZVVybCA9IChzZXR0aW5ncy5hYnNvbHV0aXplVXJsIHx8IGRlcHMuYWJzb2x1dGl6ZVVybCkuYmluZCh0aGlzLCB0aGlzLmJhc2VVcmwpO1xyXG5cclxuICAgIHRoaXMuaGlzdG9yeSA9IHNldHRpbmdzLmhpc3RvcnkgfHwgd2luZG93Lmhpc3Rvcnk7XHJcblxyXG4gICAgdGhpcy5pbmRleE5hbWUgPSBzZXR0aW5ncy5pbmRleE5hbWUgfHwgJ2luZGV4JztcclxuICAgIFxyXG4gICAgdGhpcy5pdGVtcyA9IHNldHRpbmdzLmRvbUl0ZW1zTWFuYWdlcjtcclxuXHJcbiAgICAvLyBsb2FkZXIgY2FuIGJlIGRpc2FibGVkIHBhc3NpbmcgJ251bGwnLCBzbyB3ZSBtdXN0XHJcbiAgICAvLyBlbnN1cmUgdG8gbm90IHVzZSB0aGUgZGVmYXVsdCBvbiB0aGF0IGNhc2VzOlxyXG4gICAgdGhpcy5sb2FkZXIgPSB0eXBlb2Yoc2V0dGluZ3MubG9hZGVyKSA9PT0gJ3VuZGVmaW5lZCcgPyBkZXBzLmxvYWRlciA6IHNldHRpbmdzLmxvYWRlcjtcclxuICAgIC8vIGxvYWRlciBzZXR1cFxyXG4gICAgaWYgKHRoaXMubG9hZGVyKVxyXG4gICAgICAgIHRoaXMubG9hZGVyLmJhc2VVcmwgPSB0aGlzLmJhc2VVcmw7XHJcblxyXG4gICAgLy8gRGVmaW5pdGlvbiBvZiBldmVudHMgdGhhdCB0aGlzIG9iamVjdCBjYW4gdHJpZ2dlcixcclxuICAgIC8vIGl0cyB2YWx1ZSBjYW4gYmUgY3VzdG9taXplZCBidXQgYW55IGxpc3RlbmVyIG5lZWRzXHJcbiAgICAvLyB0byBrZWVwIHVwZGF0ZWQgdG8gdGhlIGNvcnJlY3QgZXZlbnQgc3RyaW5nLW5hbWUgdXNlZC5cclxuICAgIC8vIFRoZSBpdGVtcyBtYW5pcHVsYXRpb24gZXZlbnRzIE1VU1QgYmUgdHJpZ2dlcmVkXHJcbiAgICAvLyBieSB0aGUgJ2l0ZW1zLnN3aXRjaCcgZnVuY3Rpb25cclxuICAgIHRoaXMuZXZlbnRzID0ge1xyXG4gICAgICAgIHdpbGxPcGVuOiAnc2hlbGwtd2lsbC1vcGVuJyxcclxuICAgICAgICB3aWxsQ2xvc2U6ICdzaGVsbC13aWxsLWNsb3NlJyxcclxuICAgICAgICBpdGVtUmVhZHk6ICdzaGVsbC1pdGVtLXJlYWR5JyxcclxuICAgICAgICBjbG9zZWQ6ICdzaGVsbC1jbG9zZWQnLFxyXG4gICAgICAgIG9wZW5lZDogJ3NoZWxsLW9wZW5lZCdcclxuICAgIH07XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEEgZnVuY3Rpb24gdG8gZGVjaWRlIGlmIHRoZVxyXG4gICAgICAgIGFjY2VzcyBpcyBhbGxvd2VkIChyZXR1cm5zICdudWxsJylcclxuICAgICAgICBvciBub3QgKHJldHVybiBhIHN0YXRlIG9iamVjdCB3aXRoIGluZm9ybWF0aW9uXHJcbiAgICAgICAgdGhhdCB3aWxsIGJlIHBhc3NlZCB0byB0aGUgJ25vbkFjY2Vzc05hbWUnIGl0ZW07XHJcbiAgICAgICAgdGhlICdyb3V0ZScgcHJvcGVydHkgb24gdGhlIHN0YXRlIGlzIGF1dG9tYXRpY2FsbHkgZmlsbGVkKS5cclxuICAgICAgICBcclxuICAgICAgICBUaGUgZGVmYXVsdCBidWl0LWluIGp1c3QgYWxsb3cgZXZlcnl0aGluZyBcclxuICAgICAgICBieSBqdXN0IHJldHVybmluZyAnbnVsbCcgYWxsIHRoZSB0aW1lLlxyXG4gICAgICAgIFxyXG4gICAgICAgIEl0IHJlY2VpdmVzIGFzIHBhcmFtZXRlciB0aGUgc3RhdGUgb2JqZWN0LFxyXG4gICAgICAgIHRoYXQgYWxtb3N0IGNvbnRhaW5zIHRoZSAncm91dGUnIHByb3BlcnR5IHdpdGhcclxuICAgICAgICBpbmZvcm1hdGlvbiBhYm91dCB0aGUgVVJMLlxyXG4gICAgKiovXHJcbiAgICB0aGlzLmFjY2Vzc0NvbnRyb2wgPSBzZXR0aW5ncy5hY2Nlc3NDb250cm9sIHx8IGRlcHMuYWNjZXNzQ29udHJvbDtcclxuICAgIC8vIFdoYXQgaXRlbSBsb2FkIG9uIG5vbiBhY2Nlc3NcclxuICAgIHRoaXMubm9uQWNjZXNzTmFtZSA9IHNldHRpbmdzLm5vbkFjY2Vzc05hbWUgfHwgJ2luZGV4JztcclxufVxyXG5cclxuLy8gU2hlbGwgaW5oZXJpdHMgZnJvbSBFdmVudEVtaXR0ZXJcclxuU2hlbGwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShkZXBzLkV2ZW50RW1pdHRlci5wcm90b3R5cGUsIHtcclxuICAgIGNvbnN0cnVjdG9yOiB7XHJcbiAgICAgICAgdmFsdWU6IFNoZWxsLFxyXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxyXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2hlbGw7XHJcblxyXG5cclxuLyoqIEFQSSBkZWZpbml0aW9uICoqL1xyXG5cclxuU2hlbGwucHJvdG90eXBlLmdvID0gZnVuY3Rpb24gZ28odXJsLCBzdGF0ZSkge1xyXG5cclxuICAgIGlmICh0aGlzLmZvcmNlSGFzaGJhbmcpIHtcclxuICAgICAgICBpZiAoIS9eIyEvLnRlc3QodXJsKSkge1xyXG4gICAgICAgICAgICB1cmwgPSAnIyEnICsgdXJsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHVybCA9IHRoaXMuYWJzb2x1dGl6ZVVybCh1cmwpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5oaXN0b3J5LnB1c2hTdGF0ZShzdGF0ZSwgdW5kZWZpbmVkLCB1cmwpO1xyXG4gICAgLy8gcHVzaFN0YXRlIGRvIE5PVCB0cmlnZ2VyIHRoZSBwb3BzdGF0ZSBldmVudCwgc29cclxuICAgIHJldHVybiB0aGlzLnJlcGxhY2Uoc3RhdGUpO1xyXG59O1xyXG5cclxuU2hlbGwucHJvdG90eXBlLmdvQmFjayA9IGZ1bmN0aW9uIGdvQmFjayhzdGF0ZSwgc3RlcHMpIHtcclxuICAgIHN0ZXBzID0gMCAtIChzdGVwcyB8fCAxKTtcclxuICAgIC8vIElmIHRoZXJlIGlzIG5vdGhpbmcgdG8gZ28tYmFjayBvciBub3QgZW5vdWdodFxyXG4gICAgLy8gJ2JhY2snIHN0ZXBzLCBnbyB0byB0aGUgaW5kZXhcclxuICAgIGlmIChzdGVwcyA8IDAgJiYgTWF0aC5hYnMoc3RlcHMpID49IHRoaXMuaGlzdG9yeS5sZW5ndGgpIHtcclxuICAgICAgICB0aGlzLmdvKHRoaXMuaW5kZXhOYW1lKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIC8vIE9uIHJlcGxhY2UsIHRoZSBwYXNzZWQgc3RhdGUgaXMgbWVyZ2VkIHdpdGhcclxuICAgICAgICAvLyB0aGUgb25lIHRoYXQgY29tZXMgZnJvbSB0aGUgc2F2ZWQgaGlzdG9yeVxyXG4gICAgICAgIC8vIGVudHJ5IChpdCAncG9wcycgd2hlbiBkb2luZyB0aGUgaGlzdG9yeS5nbygpKVxyXG4gICAgICAgIHRoaXMuX3BlbmRpbmdTdGF0ZVVwZGF0ZSA9IHN0YXRlO1xyXG4gICAgICAgIHRoaXMuaGlzdG9yeS5nbyhzdGVwcyk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICAgIFByb2Nlc3MgdGhlIGdpdmVuIHN0YXRlIGluIG9yZGVyIHRvIGdldCB0aGUgY3VycmVudCBzdGF0ZVxyXG4gICAgYmFzZWQgb24gdGhhdCBvciB0aGUgc2F2ZWQgaW4gaGlzdG9yeSwgbWVyZ2UgaXQgd2l0aFxyXG4gICAgYW55IHVwZGF0ZWQgc3RhdGUgcGVuZGluZyBhbmQgYWRkcyB0aGUgcm91dGUgaW5mb3JtYXRpb24sXHJcbiAgICByZXR1cm5pbmcgYW4gc3RhdGUgb2JqZWN0IHN1aXRhYmxlIHRvIHVzZS5cclxuKiovXHJcblNoZWxsLnByb3RvdHlwZS5nZXRVcGRhdGVkU3RhdGUgPSBmdW5jdGlvbiBnZXRVcGRhdGVkU3RhdGUoc3RhdGUpIHtcclxuICAgIC8qanNoaW50IG1heGNvbXBsZXhpdHk6IDggKi9cclxuICAgIFxyXG4gICAgLy8gRm9yIGN1cnJlbnQgdXNlcywgYW55IHBlbmRpbmdTdGF0ZVVwZGF0ZSBpcyB1c2VkIGFzXHJcbiAgICAvLyB0aGUgc3RhdGUsIHJhdGhlciB0aGFuIHRoZSBwcm92aWRlZCBvbmVcclxuICAgIHN0YXRlID0gdGhpcy5fcGVuZGluZ1N0YXRlVXBkYXRlIHx8IHN0YXRlIHx8IHRoaXMuaGlzdG9yeS5zdGF0ZSB8fCB7fTtcclxuICAgIFxyXG4gICAgLy8gVE9ETzogbW9yZSBhZHZhbmNlZCB1c2VzIG11c3QgYmUgdG8gdXNlIHRoZSAnc3RhdGUnIHRvXHJcbiAgICAvLyByZWNvdmVyIHRoZSBVSSBzdGF0ZSwgd2l0aCBhbnkgbWVzc2FnZSBmcm9tIG90aGVyIFVJXHJcbiAgICAvLyBwYXNzaW5nIGluIGEgd2F5IHRoYXQgYWxsb3cgdXBkYXRlIHRoZSBzdGF0ZSwgbm90XHJcbiAgICAvLyByZXBsYWNlIGl0IChmcm9tIHBlbmRpbmdTdGF0ZVVwZGF0ZSkuXHJcbiAgICAvKlxyXG4gICAgLy8gU3RhdGUgb3IgZGVmYXVsdCBzdGF0ZVxyXG4gICAgc3RhdGUgPSBzdGF0ZSB8fCB0aGlzLmhpc3Rvcnkuc3RhdGUgfHwge307XHJcbiAgICAvLyBtZXJnZSBwZW5kaW5nIHVwZGF0ZWQgc3RhdGVcclxuICAgIHRoaXMuJC5leHRlbmQoc3RhdGUsIHRoaXMuX3BlbmRpbmdTdGF0ZVVwZGF0ZSk7XHJcbiAgICAvLyBkaXNjYXJkIHRoZSB1cGRhdGVcclxuICAgICovXHJcbiAgICB0aGlzLl9wZW5kaW5nU3RhdGVVcGRhdGUgPSBudWxsO1xyXG4gICAgXHJcbiAgICAvLyBEb2Vzbid0IG1hdHRlcnMgaWYgc3RhdGUgaW5jbHVkZXMgYWxyZWFkeSBcclxuICAgIC8vICdyb3V0ZScgaW5mb3JtYXRpb24sIG5lZWQgdG8gYmUgb3ZlcndyaXR0ZW5cclxuICAgIC8vIHRvIG1hdGNoIHRoZSBjdXJyZW50IG9uZS5cclxuICAgIC8vIE5PVEU6IHByZXZpb3VzbHksIGEgY2hlY2sgcHJldmVudGVkIHRoaXMgaWZcclxuICAgIC8vIHJvdXRlIHByb3BlcnR5IGV4aXN0cywgY3JlYXRpbmcgaW5maW5pdGUgbG9vcHNcclxuICAgIC8vIG9uIHJlZGlyZWN0aW9ucyBmcm9tIGFjdGl2aXR5LnNob3cgc2luY2UgJ3JvdXRlJyBkb2Vzbid0XHJcbiAgICAvLyBtYXRjaCB0aGUgbmV3IGRlc2lyZWQgbG9jYXRpb25cclxuICAgIFxyXG4gICAgLy8gRGV0ZWN0IGlmIGlzIGEgaGFzaGJhbmcgVVJMIG9yIGFuIHN0YW5kYXJkIG9uZS5cclxuICAgIC8vIEV4Y2VwdCBpZiB0aGUgYXBwIGlzIGZvcmNlZCB0byB1c2UgaGFzaGJhbmcuXHJcbiAgICB2YXIgaXNIYXNoQmFuZyA9IC8jIS8udGVzdChsb2NhdGlvbi5ocmVmKSB8fCB0aGlzLmZvcmNlSGFzaGJhbmc7XHJcbiAgICBcclxuICAgIHZhciBsaW5rID0gKFxyXG4gICAgICAgIGlzSGFzaEJhbmcgP1xyXG4gICAgICAgIGxvY2F0aW9uLmhhc2ggOlxyXG4gICAgICAgIGxvY2F0aW9uLnBhdGhuYW1lXHJcbiAgICApICsgKGxvY2F0aW9uLnNlYXJjaCB8fCAnJyk7XHJcbiAgICBcclxuICAgIC8vIFNldCB0aGUgcm91dGVcclxuICAgIHN0YXRlLnJvdXRlID0gdGhpcy5wYXJzZVVybChsaW5rKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHN0YXRlO1xyXG59O1xyXG5cclxuU2hlbGwucHJvdG90eXBlLnJlcGxhY2UgPSBmdW5jdGlvbiByZXBsYWNlKHN0YXRlKSB7XHJcbiAgICBcclxuICAgIHN0YXRlID0gdGhpcy5nZXRVcGRhdGVkU3RhdGUoc3RhdGUpO1xyXG5cclxuICAgIC8vIFVzZSB0aGUgaW5kZXggb24gcm9vdCBjYWxsc1xyXG4gICAgaWYgKHN0YXRlLnJvdXRlLnJvb3QgPT09IHRydWUpIHtcclxuICAgICAgICBzdGF0ZS5yb3V0ZSA9IHRoaXMucGFyc2VVcmwodGhpcy5pbmRleE5hbWUpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBBY2Nlc3MgY29udHJvbFxyXG4gICAgdmFyIGFjY2Vzc0Vycm9yID0gdGhpcy5hY2Nlc3NDb250cm9sKHN0YXRlLnJvdXRlKTtcclxuICAgIGlmIChhY2Nlc3NFcnJvcikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdvKHRoaXMubm9uQWNjZXNzTmFtZSwgYWNjZXNzRXJyb3IpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIExvY2F0aW5nIHRoZSBjb250YWluZXJcclxuICAgIHZhciAkY29udCA9IHRoaXMuaXRlbXMuZmluZChzdGF0ZS5yb3V0ZS5uYW1lKTtcclxuICAgIHZhciBzaGVsbCA9IHRoaXM7XHJcbiAgICB2YXIgcHJvbWlzZSA9IG51bGw7XHJcblxyXG4gICAgaWYgKCRjb250ICYmICRjb250Lmxlbmd0aCkge1xyXG4gICAgICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgJG9sZENvbnQgPSBzaGVsbC5pdGVtcy5nZXRBY3RpdmUoKTtcclxuICAgICAgICAgICAgICAgICRvbGRDb250ID0gJG9sZENvbnQubm90KCRjb250KTtcclxuICAgICAgICAgICAgICAgIHNoZWxsLml0ZW1zLnN3aXRjaCgkb2xkQ29udCwgJGNvbnQsIHNoZWxsLCBzdGF0ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpOyAvLz8gcmVzb2x2ZShhY3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGV4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgaWYgKHRoaXMubG9hZGVyKSB7XHJcbiAgICAgICAgICAgIC8vIGxvYWQgYW5kIGluamVjdCB0aGUgY29udGVudCBpbiB0aGUgcGFnZVxyXG4gICAgICAgICAgICAvLyB0aGVuIHRyeSB0aGUgcmVwbGFjZSBhZ2FpblxyXG4gICAgICAgICAgICBwcm9taXNlID0gdGhpcy5sb2FkZXIubG9hZChzdGF0ZS5yb3V0ZSkudGhlbihmdW5jdGlvbihodG1sKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgdG8gdGhlIGl0ZW1zICh0aGUgbWFuYWdlciB0YWtlcyBjYXJlIHlvdVxyXG4gICAgICAgICAgICAgICAgLy8gYWRkIG9ubHkgdGhlIGl0ZW0sIGlmIHRoZXJlIGlzIG9uZSlcclxuICAgICAgICAgICAgICAgIHNoZWxsLml0ZW1zLmluamVjdChzdGF0ZS5yb3V0ZS5uYW1lLCBodG1sKTtcclxuICAgICAgICAgICAgICAgIC8vIERvdWJsZSBjaGVjayB0aGF0IHRoZSBpdGVtIHdhcyBhZGRlZCBhbmQgaXMgcmVhZHlcclxuICAgICAgICAgICAgICAgIC8vIHRvIGF2b2lkIGFuIGluZmluaXRlIGxvb3AgYmVjYXVzZSBhIHJlcXVlc3Qgbm90IHJldHVybmluZ1xyXG4gICAgICAgICAgICAgICAgLy8gdGhlIGl0ZW0gYW5kIHRoZSAncmVwbGFjZScgdHJ5aW5nIHRvIGxvYWQgaXQgYWdhaW4sIGFuZCBhZ2FpbiwgYW5kLi5cclxuICAgICAgICAgICAgICAgIGlmIChzaGVsbC5pdGVtcy5maW5kKHN0YXRlLnJvdXRlLm5hbWUpLmxlbmd0aClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2hlbGwucmVwbGFjZShzdGF0ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcignUGFnZSBub3QgZm91bmQgKCcgKyBzdGF0ZS5yb3V0ZS5uYW1lICsgJyknKTtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdTaGVsbCBQYWdlIG5vdCBmb3VuZCwgc3RhdGU6Jywgc3RhdGUpO1xyXG4gICAgICAgICAgICBwcm9taXNlID0gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFRvIGF2b2lkIGJlaW5nIGluIGFuIGluZXhpc3RhbnQgVVJMIChnZW5lcmF0aW5nIGluY29uc2lzdGVuY3kgYmV0d2VlblxyXG4gICAgICAgICAgICAvLyBjdXJyZW50IHZpZXcgYW5kIFVSTCwgY3JlYXRpbmcgYmFkIGhpc3RvcnkgZW50cmllcyksXHJcbiAgICAgICAgICAgIC8vIGEgZ29CYWNrIGlzIGV4ZWN1dGVkLCBqdXN0IGFmdGVyIHRoZSBjdXJyZW50IHBpcGUgZW5kc1xyXG4gICAgICAgICAgICAvLyBUT0RPOiBpbXBsZW1lbnQgcmVkaXJlY3QgdGhhdCBjdXQgY3VycmVudCBwcm9jZXNzaW5nIHJhdGhlciB0aGFuIGV4ZWN1dGUgZGVsYXllZFxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nb0JhY2soKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHZhciB0aGlzU2hlbGwgPSB0aGlzO1xyXG4gICAgcHJvbWlzZS5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiBFcnJvcikpXHJcbiAgICAgICAgICAgIGVyciA9IG5ldyBFcnJvcihlcnIpO1xyXG5cclxuICAgICAgICAvLyBMb2cgZXJyb3IsIFxyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1NoZWxsLCB1bmV4cGVjdGVkIGVycm9yLicsIGVycik7XHJcbiAgICAgICAgLy8gbm90aWZ5IGFzIGFuIGV2ZW50XHJcbiAgICAgICAgdGhpc1NoZWxsLmVtaXQoJ2Vycm9yJywgZXJyKTtcclxuICAgICAgICAvLyBhbmQgY29udGludWUgcHJvcGFnYXRpbmcgdGhlIGVycm9yXHJcbiAgICAgICAgcmV0dXJuIGVycjtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBwcm9taXNlO1xyXG59O1xyXG5cclxuU2hlbGwucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIHJ1bigpIHtcclxuXHJcbiAgICB2YXIgc2hlbGwgPSB0aGlzO1xyXG5cclxuICAgIC8vIENhdGNoIHBvcHN0YXRlIGV2ZW50IHRvIHVwZGF0ZSBzaGVsbCByZXBsYWNpbmcgdGhlIGFjdGl2ZSBjb250YWluZXIuXHJcbiAgICAvLyBBbGxvd3MgcG9seWZpbGxzIHRvIHByb3ZpZGUgYSBkaWZmZXJlbnQgYnV0IGVxdWl2YWxlbnQgZXZlbnQgbmFtZVxyXG4gICAgdGhpcy4kKHdpbmRvdykub24odGhpcy5oaXN0b3J5LnBvcHN0YXRlRXZlbnQgfHwgJ3BvcHN0YXRlJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgc3RhdGUgPSBldmVudC5zdGF0ZSB8fCBcclxuICAgICAgICAgICAgKGV2ZW50Lm9yaWdpbmFsRXZlbnQgJiYgZXZlbnQub3JpZ2luYWxFdmVudC5zdGF0ZSkgfHwgXHJcbiAgICAgICAgICAgIHNoZWxsLmhpc3Rvcnkuc3RhdGU7XHJcblxyXG4gICAgICAgIC8vIGdldCBzdGF0ZSBmb3IgY3VycmVudC4gVG8gc3VwcG9ydCBwb2x5ZmlsbHMsIHdlIHVzZSB0aGUgZ2VuZXJhbCBnZXR0ZXJcclxuICAgICAgICAvLyBoaXN0b3J5LnN0YXRlIGFzIGZhbGxiYWNrICh0aGV5IG11c3QgYmUgdGhlIHNhbWUgb24gYnJvd3NlcnMgc3VwcG9ydGluZyBIaXN0b3J5IEFQSSlcclxuICAgICAgICBzaGVsbC5yZXBsYWNlKHN0YXRlKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENhdGNoIGFsbCBsaW5rcyBpbiB0aGUgcGFnZSAobm90IG9ubHkgJHJvb3Qgb25lcykgYW5kIGxpa2UtbGlua3NcclxuICAgIHRoaXMuJChkb2N1bWVudCkub24odGhpcy5saW5rRXZlbnQsICdbaHJlZl0sIFtkYXRhLWhyZWZdJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciAkdCA9IHNoZWxsLiQodGhpcyksXHJcbiAgICAgICAgICAgIGhyZWYgPSAkdC5hdHRyKCdocmVmJykgfHwgJHQuZGF0YSgnaHJlZicpO1xyXG5cclxuICAgICAgICAvLyBEbyBub3RoaW5nIGlmIHRoZSBVUkwgY29udGFpbnMgdGhlIHByb3RvY29sXHJcbiAgICAgICAgaWYgKC9eW2Etel0rOi9pLnRlc3QoaHJlZikpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChzaGVsbC5mb3JjZUhhc2hiYW5nICYmIC9eIyhbXiFdfCQpLy50ZXN0KGhyZWYpKSB7XHJcbiAgICAgICAgICAgIC8vIFN0YW5kYXJkIGhhc2gsIGJ1dCBub3QgaGFzaGJhbmc6IGF2b2lkIHJvdXRpbmcgYW5kIGRlZmF1bHQgYmVoYXZpb3JcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgLy8/IGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgIC8vIEV4ZWN1dGVkIGRlbGF5ZWQgdG8gYXZvaWQgaGFuZGxlciBjb2xsaXNpb25zLCBiZWNhdXNlXHJcbiAgICAgICAgLy8gb2YgdGhlIG5ldyBwYWdlIG1vZGlmeWluZyB0aGUgZWxlbWVudCBhbmQgb3RoZXIgaGFuZGxlcnNcclxuICAgICAgICAvLyByZWFkaW5nIGl0IGF0dHJpYnV0ZXMgYW5kIGFwcGx5aW5nIGxvZ2ljIG9uIHRoZSB1cGRhdGVkIGxpbmtcclxuICAgICAgICAvLyBhcyBpZiB3YXMgdGhlIG9sZCBvbmUgKGV4YW1wbGU6IHNoYXJlZCBsaW5rcywgbGlrZSBpbiBhXHJcbiAgICAgICAgLy8gZ2xvYmFsIG5hdmJhciwgdGhhdCBtb2RpZmllcyB3aXRoIHRoZSBuZXcgcGFnZSkuXHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgc2hlbGwuZ28oaHJlZik7XHJcbiAgICAgICAgfSwgMSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBJbml0aWFsbGl6ZSBzdGF0ZVxyXG4gICAgdGhpcy5pdGVtcy5pbml0KCk7XHJcbiAgICAvLyBSb3V0ZSB0byB0aGUgY3VycmVudCB1cmwvc3RhdGVcclxuICAgIHRoaXMucmVwbGFjZSgpO1xyXG59O1xyXG4iLCIvKipcclxuICAgIGFic29sdXRpemVVcmwgdXRpbGl0eSBcclxuICAgIHRoYXQgZW5zdXJlcyB0aGUgdXJsIHByb3ZpZGVkXHJcbiAgICBiZWluZyBpbiB0aGUgcGF0aCBvZiB0aGUgZ2l2ZW4gYmFzZVVybFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIHNhbml0aXplVXJsID0gcmVxdWlyZSgnLi9zYW5pdGl6ZVVybCcpLFxyXG4gICAgZXNjYXBlUmVnRXhwID0gcmVxdWlyZSgnLi4vZXNjYXBlUmVnRXhwJyk7XHJcblxyXG5mdW5jdGlvbiBhYnNvbHV0aXplVXJsKGJhc2VVcmwsIHVybCkge1xyXG5cclxuICAgIC8vIHNhbml0aXplIGJlZm9yZSBjaGVja1xyXG4gICAgdXJsID0gc2FuaXRpemVVcmwodXJsKTtcclxuXHJcbiAgICAvLyBDaGVjayBpZiB1c2UgdGhlIGJhc2UgYWxyZWFkeVxyXG4gICAgdmFyIG1hdGNoQmFzZSA9IG5ldyBSZWdFeHAoJ14nICsgZXNjYXBlUmVnRXhwKGJhc2VVcmwpLCAnaScpO1xyXG4gICAgaWYgKG1hdGNoQmFzZS50ZXN0KHVybCkpIHtcclxuICAgICAgICByZXR1cm4gdXJsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGJ1aWxkIGFuZCBzYW5pdGl6ZVxyXG4gICAgcmV0dXJuIHNhbml0aXplVXJsKGJhc2VVcmwgKyB1cmwpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFic29sdXRpemVVcmw7XHJcbiIsIi8qKlxyXG4gICAgRXh0ZXJuYWwgZGVwZW5kZW5jaWVzIGZvciBTaGVsbCBpbiBhIHNlcGFyYXRlIG1vZHVsZVxyXG4gICAgdG8gdXNlIGFzIERJLCBuZWVkcyBzZXR1cCBiZWZvcmUgY2FsbCB0aGUgU2hlbGwuanNcclxuICAgIG1vZHVsZSBjbGFzc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBwYXJzZVVybDogbnVsbCxcclxuICAgIGFic29sdXRpemVVcmw6IG51bGwsXHJcbiAgICBqcXVlcnk6IG51bGwsXHJcbiAgICBsb2FkZXI6IG51bGwsXHJcbiAgICBhY2Nlc3NDb250cm9sOiBmdW5jdGlvbiBhbGxvd0FsbChuYW1lKSB7XHJcbiAgICAgICAgLy8gYWxsb3cgYWNjZXNzIGJ5IGRlZmF1bHRcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH0sXHJcbiAgICBFdmVudEVtaXR0ZXI6IG51bGxcclxufTtcclxuIiwiLyoqXHJcbiAgICBTaW1wbGUgaW1wbGVtZW50YXRpb24gb2YgdGhlIEhpc3RvcnkgQVBJIHVzaW5nIG9ubHkgaGFzaGJhbmdzIFVSTHMsXHJcbiAgICBkb2Vzbid0IG1hdHRlcnMgdGhlIGJyb3dzZXIgc3VwcG9ydC5cclxuICAgIFVzZWQgdG8gYXZvaWQgZnJvbSBzZXR0aW5nIFVSTHMgdGhhdCBoYXMgbm90IGFuIGVuZC1wb2ludCxcclxuICAgIGxpa2UgaW4gbG9jYWwgZW52aXJvbm1lbnRzIHdpdGhvdXQgYSBzZXJ2ZXIgZG9pbmcgdXJsLXJld3JpdGluZyxcclxuICAgIGluIHBob25lZ2FwIGFwcHMsIG9yIHRvIGNvbXBsZXRlbHkgYnktcGFzcyBicm93c2VyIHN1cHBvcnQgYmVjYXVzZVxyXG4gICAgaXMgYnVnZ3kgKGxpa2UgQW5kcm9pZCA8PSA0LjEpLlxyXG4gICAgXHJcbiAgICBOT1RFUzpcclxuICAgIC0gQnJvd3NlciBtdXN0IHN1cHBvcnQgJ2hhc2hjaGFuZ2UnIGV2ZW50LlxyXG4gICAgLSBCcm93c2VyIG11c3QgaGFzIHN1cHBvcnQgZm9yIHN0YW5kYXJkIEpTT04gY2xhc3MuXHJcbiAgICAtIFJlbGllcyBvbiBzZXNzaW9uc3RvcmFnZSBmb3IgcGVyc2lzdGFuY2UsIHN1cHBvcnRlZCBieSBhbGwgYnJvd3NlcnMgYW5kIHdlYnZpZXdzIFxyXG4gICAgICBmb3IgYSBlbm91Z2ggbG9uZyB0aW1lIG5vdy5cclxuICAgIC0gU2ltaWxhciBhcHByb2FjaCBhcyBIaXN0b3J5LmpzIHBvbHlmaWxsLCBidXQgc2ltcGxpZmllZCwgYXBwZW5kaW5nIGEgZmFrZSBxdWVyeVxyXG4gICAgICBwYXJhbWV0ZXIgJ19zdWlkPTAnIHRvIHRoZSBoYXNoIHZhbHVlIChhY3R1YWwgcXVlcnkgZ29lcyBiZWZvcmUgdGhlIGhhc2gsIGJ1dFxyXG4gICAgICB3ZSBuZWVkIGl0IGluc2lkZSkuXHJcbiAgICAtIEZvciBzaW1wbGlmaWNhdGlvbiwgb25seSB0aGUgc3RhdGUgaXMgcGVyc2lzdGVkLCB0aGUgJ3RpdGxlJyBwYXJhbWV0ZXIgaXMgbm90XHJcbiAgICAgIHVzZWQgYXQgYWxsICh0aGUgc2FtZSBhcyBtYWpvciBicm93c2VycyBkbywgc28gaXMgbm90IGEgcHJvYmxlbSk7IGluIHRoaXMgbGluZSxcclxuICAgICAgb25seSBoaXN0b3J5IGVudHJpZXMgd2l0aCBzdGF0ZSBhcmUgcGVyc2lzdGVkLlxyXG4qKi9cclxuLy9nbG9iYWwgbG9jYXRpb25cclxuJ3VzZSBzdHJpY3QnO1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgc2FuaXRpemVVcmwgPSByZXF1aXJlKCcuL3Nhbml0aXplVXJsJyksXHJcbiAgICBnZXRVcmxRdWVyeSA9IHJlcXVpcmUoJy4uL2dldFVybFF1ZXJ5Jyk7XHJcblxyXG4vLyBJbml0OiBMb2FkIHNhdmVkIGNvcHkgZnJvbSBzZXNzaW9uU3RvcmFnZVxyXG52YXIgc2Vzc2lvbiA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oJ2hhc2hiYW5nSGlzdG9yeS5zdG9yZScpO1xyXG4vLyBPciBjcmVhdGUgYSBuZXcgb25lXHJcbmlmICghc2Vzc2lvbikge1xyXG4gICAgc2Vzc2lvbiA9IHtcclxuICAgICAgICAvLyBTdGF0ZXMgYXJyYXkgd2hlcmUgZWFjaCBpbmRleCBpcyB0aGUgU1VJRCBjb2RlIGFuZCB0aGVcclxuICAgICAgICAvLyB2YWx1ZSBpcyBqdXN0IHRoZSB2YWx1ZSBwYXNzZWQgYXMgc3RhdGUgb24gcHVzaFN0YXRlL3JlcGxhY2VTdGF0ZVxyXG4gICAgICAgIHN0YXRlczogW11cclxuICAgIH07XHJcbn1cclxuZWxzZSB7XHJcbiAgICBzZXNzaW9uID0gSlNPTi5wYXJzZShzZXNzaW9uKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gICAgR2V0IHRoZSBTVUlEIG51bWJlclxyXG4gICAgZnJvbSBhIGhhc2ggc3RyaW5nXHJcbioqL1xyXG5mdW5jdGlvbiBnZXRTdWlkKGhhc2gpIHtcclxuICAgIFxyXG4gICAgdmFyIHN1aWQgPSArZ2V0VXJsUXVlcnkoaGFzaCkuX3N1aWQ7XHJcbiAgICBpZiAoaXNOYU4oc3VpZCkpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuIHN1aWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldFN1aWQoaGFzaCwgc3VpZCkge1xyXG4gICAgXHJcbiAgICAvLyBXZSBuZWVkIHRoZSBxdWVyeSwgc2luY2Ugd2UgbmVlZCBcclxuICAgIC8vIHRvIHJlcGxhY2UgdGhlIF9zdWlkIChtYXkgZXhpc3QpXHJcbiAgICAvLyBhbmQgcmVjcmVhdGUgdGhlIHF1ZXJ5IGluIHRoZVxyXG4gICAgLy8gcmV0dXJuZWQgaGFzaC11cmxcclxuICAgIHZhciBxcyA9IGdldFVybFF1ZXJ5KGhhc2gpO1xyXG4gICAgcXMucHVzaCgnX3N1aWQnKTtcclxuICAgIHFzLl9zdWlkID0gc3VpZDtcclxuXHJcbiAgICB2YXIgcXVlcnkgPSBbXTtcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBxcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHF1ZXJ5LnB1c2gocXNbaV0gKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQocXNbcXNbaV1dKSk7XHJcbiAgICB9XHJcbiAgICBxdWVyeSA9IHF1ZXJ5LmpvaW4oJyYnKTtcclxuICAgIFxyXG4gICAgaWYgKHF1ZXJ5KSB7XHJcbiAgICAgICAgdmFyIGluZGV4ID0gaGFzaC5pbmRleE9mKCc/Jyk7XHJcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpXHJcbiAgICAgICAgICAgIGhhc2ggPSBoYXNoLnN1YnN0cigwLCBpbmRleCk7XHJcbiAgICAgICAgaGFzaCArPSAnPycgKyBxdWVyeTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaGFzaDtcclxufVxyXG5cclxuLyoqXHJcbiAgICBBc2sgdG8gcGVyc2lzdCB0aGUgc2Vzc2lvbiBkYXRhLlxyXG4gICAgSXQgaXMgZG9uZSB3aXRoIGEgdGltZW91dCBpbiBvcmRlciB0byBhdm9pZFxyXG4gICAgZGVsYXkgaW4gdGhlIGN1cnJlbnQgdGFzayBtYWlubHkgYW55IGhhbmRsZXJcclxuICAgIHRoYXQgYWN0cyBhZnRlciBhIEhpc3RvcnkgY2hhbmdlLlxyXG4qKi9cclxuZnVuY3Rpb24gcGVyc2lzdCgpIHtcclxuICAgIC8vIEVub3VnaCB0aW1lIHRvIGFsbG93IHJvdXRpbmcgdGFza3MsXHJcbiAgICAvLyBtb3N0IGFuaW1hdGlvbnMgZnJvbSBmaW5pc2ggYW5kIHRoZSBVSVxyXG4gICAgLy8gYmVpbmcgcmVzcG9uc2l2ZS5cclxuICAgIC8vIEJlY2F1c2Ugc2Vzc2lvblN0b3JhZ2UgaXMgc3luY2hyb25vdXMuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oJ2hhc2hiYW5nSGlzdG9yeS5zdG9yZScsIEpTT04uc3RyaW5naWZ5KHNlc3Npb24pKTtcclxuICAgIH0sIDE1MDApO1xyXG59XHJcblxyXG4vKipcclxuICAgIFJldHVybnMgdGhlIGdpdmVuIHN0YXRlIG9yIG51bGxcclxuICAgIGlmIGlzIGFuIGVtcHR5IG9iamVjdC5cclxuKiovXHJcbmZ1bmN0aW9uIGNoZWNrU3RhdGUoc3RhdGUpIHtcclxuICAgIFxyXG4gICAgaWYgKHN0YXRlKSB7XHJcbiAgICAgICAgLy8gaXMgZW1wdHk/XHJcbiAgICAgICAgZm9yKHZhciBpIGluIHN0YXRlKSB7XHJcbiAgICAgICAgICAgIC8vIE5vXHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gaXRzIGVtcHR5XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICAvLyBBbnl0aGluZyBlbHNlXHJcbiAgICByZXR1cm4gc3RhdGU7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgR2V0IGEgY2Fub25pY2FsIHJlcHJlc2VudGF0aW9uXHJcbiAgICBvZiB0aGUgVVJMIHNvIGNhbiBiZSBjb21wYXJlZFxyXG4gICAgd2l0aCBzdWNjZXNzLlxyXG4qKi9cclxuZnVuY3Rpb24gY2Fubm9uaWNhbFVybCh1cmwpIHtcclxuICAgIFxyXG4gICAgLy8gQXZvaWQgc29tZSBiYWQgb3IgcHJvYmxlbWF0aWMgc3ludGF4XHJcbiAgICB1cmwgPSBzYW5pdGl6ZVVybCh1cmwgfHwgJycpO1xyXG4gICAgXHJcbiAgICAvLyBHZXQgdGhlIGhhc2ggcGFydFxyXG4gICAgdmFyIGloYXNoID0gdXJsLmluZGV4T2YoJyMnKTtcclxuICAgIGlmIChpaGFzaCA+IC0xKSB7XHJcbiAgICAgICAgdXJsID0gdXJsLnN1YnN0cihpaGFzaCArIDEpO1xyXG4gICAgfVxyXG4gICAgLy8gTWF5YmUgYSBoYXNoYmFuZyBVUkwsIHJlbW92ZSB0aGVcclxuICAgIC8vICdiYW5nJyAodGhlIGhhc2ggd2FzIHJlbW92ZWQgYWxyZWFkeSlcclxuICAgIHVybCA9IHVybC5yZXBsYWNlKC9eIS8sICcnKTtcclxuXHJcbiAgICByZXR1cm4gdXJsO1xyXG59XHJcblxyXG4vKipcclxuICAgIFRyYWNrcyB0aGUgbGF0ZXN0IFVSTFxyXG4gICAgYmVpbmcgcHVzaGVkIG9yIHJlcGxhY2VkIGJ5XHJcbiAgICB0aGUgQVBJLlxyXG4gICAgVGhpcyBhbGxvd3MgbGF0ZXIgdG8gYXZvaWRcclxuICAgIHRyaWdnZXIgdGhlIHBvcHN0YXRlIGV2ZW50LFxyXG4gICAgc2luY2UgbXVzdCBOT1QgYmUgdHJpZ2dlcmVkXHJcbiAgICBhcyBhIHJlc3VsdCBvZiB0aGF0IEFQSSBtZXRob2RzXHJcbioqL1xyXG52YXIgbGF0ZXN0UHVzaGVkUmVwbGFjZWRVcmwgPSBudWxsO1xyXG5cclxuLyoqXHJcbiAgICBIaXN0b3J5IFBvbHlmaWxsXHJcbioqL1xyXG52YXIgaGFzaGJhbmdIaXN0b3J5ID0ge1xyXG4gICAgcHVzaFN0YXRlOiBmdW5jdGlvbiBwdXNoU3RhdGUoc3RhdGUsIHRpdGxlLCB1cmwpIHtcclxuXHJcbiAgICAgICAgLy8gY2xlYW51cCB1cmxcclxuICAgICAgICB1cmwgPSBjYW5ub25pY2FsVXJsKHVybCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gc2F2ZSBuZXcgc3RhdGUgZm9yIHVybFxyXG4gICAgICAgIHN0YXRlID0gY2hlY2tTdGF0ZShzdGF0ZSkgfHwgbnVsbDtcclxuICAgICAgICBpZiAoc3RhdGUgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgLy8gc2F2ZSBzdGF0ZVxyXG4gICAgICAgICAgICBzZXNzaW9uLnN0YXRlcy5wdXNoKHN0YXRlKTtcclxuICAgICAgICAgICAgdmFyIHN1aWQgPSBzZXNzaW9uLnN0YXRlcy5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICAvLyB1cGRhdGUgVVJMIHdpdGggdGhlIHN1aWRcclxuICAgICAgICAgICAgdXJsID0gc2V0U3VpZCh1cmwsIHN1aWQpO1xyXG4gICAgICAgICAgICAvLyBjYWxsIHRvIHBlcnNpc3QgdGhlIHVwZGF0ZWQgc2Vzc2lvblxyXG4gICAgICAgICAgICBwZXJzaXN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxhdGVzdFB1c2hlZFJlcGxhY2VkVXJsID0gdXJsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIHVwZGF0ZSBsb2NhdGlvbiB0byB0cmFjayBoaXN0b3J5OlxyXG4gICAgICAgIGxvY2F0aW9uLmhhc2ggPSAnIyEnICsgdXJsO1xyXG4gICAgfSxcclxuICAgIHJlcGxhY2VTdGF0ZTogZnVuY3Rpb24gcmVwbGFjZVN0YXRlKHN0YXRlLCB0aXRsZSwgdXJsKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gY2xlYW51cCB1cmxcclxuICAgICAgICB1cmwgPSBjYW5ub25pY2FsVXJsKHVybCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gaXQgaGFzIHNhdmVkIHN0YXRlP1xyXG4gICAgICAgIHZhciBzdWlkID0gZ2V0U3VpZCh1cmwpLFxyXG4gICAgICAgICAgICBoYXNPbGRTdGF0ZSA9IHN1aWQgIT09IG51bGw7XHJcblxyXG4gICAgICAgIC8vIHNhdmUgbmV3IHN0YXRlIGZvciB1cmxcclxuICAgICAgICBzdGF0ZSA9IGNoZWNrU3RhdGUoc3RhdGUpIHx8IG51bGw7XHJcbiAgICAgICAgLy8gaXRzIHNhdmVkIGlmIHRoZXJlIGlzIHNvbWV0aGluZyB0byBzYXZlXHJcbiAgICAgICAgLy8gb3Igc29tZXRoaW5nIHRvIGRlc3Ryb3lcclxuICAgICAgICBpZiAoc3RhdGUgIT09IG51bGwgfHwgaGFzT2xkU3RhdGUpIHtcclxuICAgICAgICAgICAgLy8gc2F2ZSBzdGF0ZVxyXG4gICAgICAgICAgICBpZiAoaGFzT2xkU3RhdGUpIHtcclxuICAgICAgICAgICAgICAgIC8vIHJlcGxhY2UgZXhpc3Rpbmcgc3RhdGVcclxuICAgICAgICAgICAgICAgIHNlc3Npb24uc3RhdGVzW3N1aWRdID0gc3RhdGU7XHJcbiAgICAgICAgICAgICAgICAvLyB0aGUgdXJsIHJlbWFpbnMgdGhlIHNhbWVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBzdGF0ZVxyXG4gICAgICAgICAgICAgICAgc2Vzc2lvbi5zdGF0ZXMucHVzaChzdGF0ZSk7XHJcbiAgICAgICAgICAgICAgICBzdWlkID0gc2Vzc2lvbi5zdGF0ZXMubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSBVUkwgd2l0aCB0aGUgc3VpZFxyXG4gICAgICAgICAgICAgICAgdXJsID0gc2V0U3VpZCh1cmwsIHN1aWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGNhbGwgdG8gcGVyc2lzdCB0aGUgdXBkYXRlZCBzZXNzaW9uXHJcbiAgICAgICAgICAgIHBlcnNpc3QoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGF0ZXN0UHVzaGVkUmVwbGFjZWRVcmwgPSB1cmw7XHJcblxyXG4gICAgICAgIC8vIHVwZGF0ZSBsb2NhdGlvbiB0byB0cmFjayBoaXN0b3J5OlxyXG4gICAgICAgIGxvY2F0aW9uLmhhc2ggPSAnIyEnICsgdXJsO1xyXG4gICAgfSxcclxuICAgIGdldCBzdGF0ZSgpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgc3VpZCA9IGdldFN1aWQobG9jYXRpb24uaGFzaCk7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgc3VpZCAhPT0gbnVsbCA/XHJcbiAgICAgICAgICAgIHNlc3Npb24uc3RhdGVzW3N1aWRdIDpcclxuICAgICAgICAgICAgbnVsbFxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG4gICAgZ2V0IGxlbmd0aCgpIHtcclxuICAgICAgICByZXR1cm4gd2luZG93Lmhpc3RvcnkubGVuZ3RoO1xyXG4gICAgfSxcclxuICAgIGdvOiBmdW5jdGlvbiBnbyhvZmZzZXQpIHtcclxuICAgICAgICB3aW5kb3cuaGlzdG9yeS5nbyhvZmZzZXQpO1xyXG4gICAgfSxcclxuICAgIGJhY2s6IGZ1bmN0aW9uIGJhY2soKSB7XHJcbiAgICAgICAgd2luZG93Lmhpc3RvcnkuYmFjaygpO1xyXG4gICAgfSxcclxuICAgIGZvcndhcmQ6IGZ1bmN0aW9uIGZvcndhcmQoKSB7XHJcbiAgICAgICAgd2luZG93Lmhpc3RvcnkuZm9yd2FyZCgpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLy8gQXR0YWNoIGhhc2hjYW5nZSBldmVudCB0byB0cmlnZ2VyIEhpc3RvcnkgQVBJIGV2ZW50ICdwb3BzdGF0ZSdcclxudmFyICR3ID0gJCh3aW5kb3cpO1xyXG4kdy5vbignaGFzaGNoYW5nZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgIFxyXG4gICAgdmFyIHVybCA9IGUub3JpZ2luYWxFdmVudC5uZXdVUkw7XHJcbiAgICB1cmwgPSBjYW5ub25pY2FsVXJsKHVybCk7XHJcbiAgICBcclxuICAgIC8vIEFuIFVSTCBiZWluZyBwdXNoZWQgb3IgcmVwbGFjZWRcclxuICAgIC8vIG11c3QgTk9UIHRyaWdnZXIgcG9wc3RhdGVcclxuICAgIGlmICh1cmwgPT09IGxhdGVzdFB1c2hlZFJlcGxhY2VkVXJsKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIFxyXG4gICAgLy8gZ2V0IHN0YXRlIGZyb20gaGlzdG9yeSBlbnRyeVxyXG4gICAgLy8gZm9yIHRoZSB1cGRhdGVkIFVSTCwgaWYgYW55XHJcbiAgICAvLyAoY2FuIGhhdmUgdmFsdWUgd2hlbiB0cmF2ZXJzaW5nXHJcbiAgICAvLyBoaXN0b3J5KS5cclxuICAgIHZhciBzdWlkID0gZ2V0U3VpZCh1cmwpLFxyXG4gICAgICAgIHN0YXRlID0gbnVsbDtcclxuICAgIFxyXG4gICAgaWYgKHN1aWQgIT09IG51bGwpXHJcbiAgICAgICAgc3RhdGUgPSBzZXNzaW9uLnN0YXRlc1tzdWlkXTtcclxuXHJcbiAgICAkdy50cmlnZ2VyKG5ldyAkLkV2ZW50KCdwb3BzdGF0ZScsIHtcclxuICAgICAgICBzdGF0ZTogc3RhdGVcclxuICAgIH0pLCAnaGFzaGJhbmdIaXN0b3J5Jyk7XHJcbn0pO1xyXG5cclxuLy8gRm9yIEhpc3RvcnlBUEkgY2FwYWJsZSBicm93c2Vycywgd2UgbmVlZFxyXG4vLyB0byBjYXB0dXJlIHRoZSBuYXRpdmUgJ3BvcHN0YXRlJyBldmVudCB0aGF0XHJcbi8vIGdldHMgdHJpZ2dlcmVkIG9uIG91ciBwdXNoL3JlcGxhY2VTdGF0ZSBiZWNhdXNlXHJcbi8vIG9mIHRoZSBsb2NhdGlvbiBjaGFuZ2UsIGJ1dCB0b28gb24gdHJhdmVyc2luZ1xyXG4vLyB0aGUgaGlzdG9yeSAoYmFjay9mb3J3YXJkKS5cclxuLy8gV2Ugd2lsbCBsb2NrIHRoZSBldmVudCBleGNlcHQgd2hlbiBpc1xyXG4vLyB0aGUgb25lIHdlIHRyaWdnZXIuXHJcbi8vXHJcbi8vIE5PVEU6IHRvIHRoaXMgdHJpY2sgdG8gd29yaywgdGhpcyBtdXN0XHJcbi8vIGJlIHRoZSBmaXJzdCBoYW5kbGVyIGF0dGFjaGVkIGZvciB0aGlzXHJcbi8vIGV2ZW50LCBzbyBjYW4gYmxvY2sgYWxsIG90aGVycy5cclxuLy8gQUxURVJOQVRJVkU6IGluc3RlYWQgb2YgdGhpcywgb24gdGhlXHJcbi8vIHB1c2gvcmVwbGFjZVN0YXRlIG1ldGhvZHMgZGV0ZWN0IGlmXHJcbi8vIEhpc3RvcnlBUEkgaXMgbmF0aXZlIHN1cHBvcnRlZCBhbmRcclxuLy8gdXNlIHJlcGxhY2VTdGF0ZSB0aGVyZSByYXRoZXIgdGhhblxyXG4vLyBhIGhhc2ggY2hhbmdlLlxyXG4kdy5vbigncG9wc3RhdGUnLCBmdW5jdGlvbihlLCBzb3VyY2UpIHtcclxuICAgIFxyXG4gICAgLy8gRW5zdXJpbmcgaXMgdGhlIG9uZSB3ZSB0cmlnZ2VyXHJcbiAgICBpZiAoc291cmNlID09PSAnaGFzaGJhbmdIaXN0b3J5JylcclxuICAgICAgICByZXR1cm47XHJcbiAgICBcclxuICAgIC8vIEluIG90aGVyIGNhc2UsIGJsb2NrOlxyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxufSk7XHJcblxyXG4vLyBFeHBvc2UgQVBJXHJcbm1vZHVsZS5leHBvcnRzID0gaGFzaGJhbmdIaXN0b3J5O1xyXG4iLCIvKipcclxuICAgIERlZmF1bHQgYnVpbGQgb2YgdGhlIFNoZWxsIGNvbXBvbmVudC5cclxuICAgIEl0IHJldHVybnMgdGhlIFNoZWxsIGNsYXNzIGFzIGEgbW9kdWxlIHByb3BlcnR5LFxyXG4gICAgc2V0dGluZyB1cCB0aGUgYnVpbHQtaW4gbW9kdWxlcyBhcyBpdHMgZGVwZW5kZW5jaWVzLFxyXG4gICAgYW5kIHRoZSBleHRlcm5hbCAnanF1ZXJ5JyBhbmQgJ2V2ZW50cycgKGZvciB0aGUgRXZlbnRFbWl0dGVyKS5cclxuICAgIEl0IHJldHVybnMgdG9vIHRoZSBidWlsdC1pdCBEb21JdGVtc01hbmFnZXIgY2xhc3MgYXMgYSBwcm9wZXJ0eSBmb3IgY29udmVuaWVuY2UuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgZGVwcyA9IHJlcXVpcmUoJy4vZGVwZW5kZW5jaWVzJyksXHJcbiAgICBEb21JdGVtc01hbmFnZXIgPSByZXF1aXJlKCcuL0RvbUl0ZW1zTWFuYWdlcicpLFxyXG4gICAgcGFyc2VVcmwgPSByZXF1aXJlKCcuL3BhcnNlVXJsJyksXHJcbiAgICBhYnNvbHV0aXplVXJsID0gcmVxdWlyZSgnLi9hYnNvbHV0aXplVXJsJyksXHJcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBsb2FkZXIgPSByZXF1aXJlKCcuL2xvYWRlcicpLFxyXG4gICAgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xyXG5cclxuJC5leHRlbmQoZGVwcywge1xyXG4gICAgcGFyc2VVcmw6IHBhcnNlVXJsLFxyXG4gICAgYWJzb2x1dGl6ZVVybDogYWJzb2x1dGl6ZVVybCxcclxuICAgIGpxdWVyeTogJCxcclxuICAgIGxvYWRlcjogbG9hZGVyLFxyXG4gICAgRXZlbnRFbWl0dGVyOiBFdmVudEVtaXR0ZXJcclxufSk7XHJcblxyXG4vLyBEZXBlbmRlbmNpZXMgYXJlIHJlYWR5LCB3ZSBjYW4gbG9hZCB0aGUgY2xhc3M6XHJcbnZhciBTaGVsbCA9IHJlcXVpcmUoJy4vU2hlbGwnKTtcclxuXHJcbmV4cG9ydHMuU2hlbGwgPSBTaGVsbDtcclxuZXhwb3J0cy5Eb21JdGVtc01hbmFnZXIgPSBEb21JdGVtc01hbmFnZXI7XHJcbiIsIi8qKlxyXG4gICAgTG9hZGVyIHV0aWxpdHkgdG8gbG9hZCBTaGVsbCBpdGVtcyBvbiBkZW1hbmQgd2l0aCBBSkFYXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBcclxuICAgIGJhc2VVcmw6ICcvJyxcclxuICAgIFxyXG4gICAgbG9hZDogZnVuY3Rpb24gbG9hZChyb3V0ZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0xPQURFUiBQUk9NSVNFJywgcm91dGUsIHJvdXRlLm5hbWUpO1xyXG4gICAgICAgICAgICByZXNvbHZlKCcnKTtcclxuICAgICAgICAgICAgLyokLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiBtb2R1bGUuZXhwb3J0cy5iYXNlVXJsICsgcm91dGUubmFtZSArICcuaHRtbCcsXHJcbiAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2VcclxuICAgICAgICAgICAgICAgIC8vIFdlIGFyZSBsb2FkaW5nIHRoZSBwcm9ncmFtIGFuZCBubyBsb2FkZXIgc2NyZWVuIGluIHBsYWNlLFxyXG4gICAgICAgICAgICAgICAgLy8gc28gYW55IGluIGJldHdlZW4gaW50ZXJhY3Rpb24gd2lsbCBiZSBwcm9ibGVtYXRpYy5cclxuICAgICAgICAgICAgICAgIC8vYXN5bmM6IGZhbHNlXHJcbiAgICAgICAgICAgIH0pLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTsqL1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59O1xyXG4iLCIvKipcclxuICAgIHBhcnNlVXJsIGZ1bmN0aW9uIGRldGVjdGluZ1xyXG4gICAgdGhlIG1haW4gcGFydHMgb2YgdGhlIFVSTCBpbiBhXHJcbiAgICBjb252ZW5pZW5jZSB3YXkgZm9yIHJvdXRpbmcuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgZ2V0VXJsUXVlcnkgPSByZXF1aXJlKCcuLi9nZXRVcmxRdWVyeScpLFxyXG4gICAgZXNjYXBlUmVnRXhwID0gcmVxdWlyZSgnLi4vZXNjYXBlUmVnRXhwJyk7XHJcblxyXG5mdW5jdGlvbiBwYXJzZVVybChiYXNlVXJsLCBsaW5rKSB7XHJcblxyXG4gICAgbGluayA9IGxpbmsgfHwgJyc7XHJcblxyXG4gICAgdmFyIHJhd1VybCA9IGxpbms7XHJcblxyXG4gICAgLy8gaGFzaGJhbmcgc3VwcG9ydDogcmVtb3ZlIHRoZSAjISBvciBzaW5nbGUgIyBhbmQgdXNlIHRoZSByZXN0IGFzIHRoZSBsaW5rXHJcbiAgICBsaW5rID0gbGluay5yZXBsYWNlKC9eIyEvLCAnJykucmVwbGFjZSgvXiMvLCAnJyk7XHJcbiAgICBcclxuICAgIC8vIHJlbW92ZSBvcHRpb25hbCBpbml0aWFsIHNsYXNoIG9yIGRvdC1zbGFzaFxyXG4gICAgbGluayA9IGxpbmsucmVwbGFjZSgvXlxcL3xeXFwuXFwvLywgJycpO1xyXG5cclxuICAgIC8vIFVSTCBRdWVyeSBhcyBhbiBvYmplY3QsIGVtcHR5IG9iamVjdCBpZiBubyBxdWVyeVxyXG4gICAgdmFyIHF1ZXJ5ID0gZ2V0VXJsUXVlcnkobGluayB8fCAnPycpO1xyXG5cclxuICAgIC8vIHJlbW92ZSBxdWVyeSBmcm9tIHRoZSByZXN0IG9mIFVSTCB0byBwYXJzZVxyXG4gICAgbGluayA9IGxpbmsucmVwbGFjZSgvXFw/LiokLywgJycpO1xyXG5cclxuICAgIC8vIFJlbW92ZSB0aGUgYmFzZVVybCB0byBnZXQgdGhlIGFwcCBiYXNlLlxyXG4gICAgdmFyIHBhdGggPSBsaW5rLnJlcGxhY2UobmV3IFJlZ0V4cCgnXicgKyBlc2NhcGVSZWdFeHAoYmFzZVVybCksICdpJyksICcnKTtcclxuXHJcbiAgICAvLyBHZXQgZmlyc3Qgc2VnbWVudCBvciBwYWdlIG5hbWUgKGFueXRoaW5nIHVudGlsIGEgc2xhc2ggb3IgZXh0ZW5zaW9uIGJlZ2dpbmluZylcclxuICAgIHZhciBtYXRjaCA9IC9eXFwvPyhbXlxcL1xcLl0rKVteXFwvXSooXFwvLiopKiQvLmV4ZWMocGF0aCk7XHJcblxyXG4gICAgdmFyIHBhcnNlZCA9IHtcclxuICAgICAgICByb290OiB0cnVlLFxyXG4gICAgICAgIG5hbWU6IG51bGwsXHJcbiAgICAgICAgc2VnbWVudHM6IG51bGwsXHJcbiAgICAgICAgcGF0aDogbnVsbCxcclxuICAgICAgICB1cmw6IHJhd1VybCxcclxuICAgICAgICBxdWVyeTogcXVlcnlcclxuICAgIH07XHJcblxyXG4gICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgcGFyc2VkLnJvb3QgPSBmYWxzZTtcclxuICAgICAgICBpZiAobWF0Y2hbMV0pIHtcclxuICAgICAgICAgICAgcGFyc2VkLm5hbWUgPSBtYXRjaFsxXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYXRjaFsyXSkge1xyXG4gICAgICAgICAgICAgICAgcGFyc2VkLnBhdGggPSBtYXRjaFsyXTtcclxuICAgICAgICAgICAgICAgIHBhcnNlZC5zZWdtZW50cyA9IG1hdGNoWzJdLnJlcGxhY2UoL15cXC8vLCAnJykuc3BsaXQoJy8nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHBhcnNlZC5wYXRoID0gJy8nO1xyXG4gICAgICAgICAgICAgICAgcGFyc2VkLnNlZ21lbnRzID0gW107XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHBhcnNlZDtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBwYXJzZVVybDsiLCIvKipcclxuICAgIHNhbml0aXplVXJsIHV0aWxpdHkgdGhhdCBlbnN1cmVzXHJcbiAgICB0aGF0IHByb2JsZW1hdGljIHBhcnRzIGdldCByZW1vdmVkLlxyXG4gICAgXHJcbiAgICBBcyBmb3Igbm93IGl0IGRvZXM6XHJcbiAgICAtIHJlbW92ZXMgcGFyZW50IGRpcmVjdG9yeSBzeW50YXhcclxuICAgIC0gcmVtb3ZlcyBkdXBsaWNhdGVkIHNsYXNoZXNcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIHNhbml0aXplVXJsKHVybCkge1xyXG4gICAgcmV0dXJuIHVybC5yZXBsYWNlKC9cXC57Mix9L2csICcnKS5yZXBsYWNlKC9cXC97Mix9L2csICcvJyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2FuaXRpemVVcmw7IiwiLyoqIFxyXG4gICAgQXBwTW9kZWwgZXh0ZW5zaW9uLFxyXG4gICAgZm9jdXNlZCBvbiB0aGUgQWNjb3VudCByZWxhdGVkIEFQSXM6XHJcbiAgICAtIGxvZ2luXHJcbiAgICAtIGxvZ291dFxyXG4gICAgLSBzaWdudXBcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBsb2NhbGZvcmFnZSA9IHJlcXVpcmUoJ2xvY2FsZm9yYWdlJyk7XHJcblxyXG5leHBvcnRzLnBsdWdJbiA9IGZ1bmN0aW9uIChBcHBNb2RlbCkge1xyXG4gICAgLyoqXHJcbiAgICAgICAgVHJ5IHRvIHBlcmZvcm0gYW4gYXV0b21hdGljIGxvZ2luIGlmIHRoZXJlIGlzIGEgbG9jYWxcclxuICAgICAgICBjb3B5IG9mIGNyZWRlbnRpYWxzIHRvIHVzZSBvbiB0aGF0LFxyXG4gICAgICAgIGNhbGxpbmcgdGhlIGxvZ2luIG1ldGhvZCB0aGF0IHNhdmUgdGhlIHVwZGF0ZWRcclxuICAgICAgICBkYXRhIGFuZCBwcm9maWxlLlxyXG4gICAgKiovXHJcbiAgICBBcHBNb2RlbC5wcm90b3R5cGUudHJ5TG9naW4gPSBmdW5jdGlvbiB0cnlMb2dpbigpIHtcclxuICAgICAgICAvLyBHZXQgc2F2ZWQgY3JlZGVudGlhbHNcclxuICAgICAgICByZXR1cm4gbG9jYWxmb3JhZ2UuZ2V0SXRlbSgnY3JlZGVudGlhbHMnKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGNyZWRlbnRpYWxzKSB7XHJcbiAgICAgICAgICAgIC8vIElmIHdlIGhhdmUgb25lcywgdHJ5IHRvIGxvZy1pblxyXG4gICAgICAgICAgICBpZiAoY3JlZGVudGlhbHMpIHtcclxuICAgICAgICAgICAgICAgIC8vIEF0dGVtcHQgbG9naW4gd2l0aCB0aGF0XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sb2dpbihcclxuICAgICAgICAgICAgICAgICAgICBjcmVkZW50aWFscy51c2VybmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBjcmVkZW50aWFscy5wYXNzd29yZFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gc2F2ZWQgY3JlZGVudGlhbHMnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICAgIFBlcmZvcm1zIGEgbG9naW4gYXR0ZW1wdCB3aXRoIHRoZSBBUEkgYnkgdXNpbmdcclxuICAgICAgICB0aGUgcHJvdmlkZWQgY3JlZGVudGlhbHMuXHJcbiAgICAqKi9cclxuICAgIEFwcE1vZGVsLnByb3RvdHlwZS5sb2dpbiA9IGZ1bmN0aW9uIGxvZ2luKHVzZXJuYW1lLCBwYXNzd29yZCkge1xyXG5cclxuICAgICAgICAvLyBSZXNldCB0aGUgZXh0cmEgaGVhZGVycyB0byBhdHRlbXB0IHRoZSBsb2dpblxyXG4gICAgICAgIHRoaXMucmVzdC5leHRyYUhlYWRlcnMgPSBudWxsO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5yZXN0LnBvc3QoJ2xvZ2luJywge1xyXG4gICAgICAgICAgICB1c2VybmFtZTogdXNlcm5hbWUsXHJcbiAgICAgICAgICAgIHBhc3N3b3JkOiBwYXNzd29yZCxcclxuICAgICAgICAgICAgcmV0dXJuUHJvZmlsZTogdHJ1ZVxyXG4gICAgICAgIH0pLnRoZW4ocGVyZm9ybUxvY2FsTG9naW4odGhpcywgdXNlcm5hbWUsIHBhc3N3b3JkKSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICAgIFBlcmZvcm1zIGEgbG9nb3V0LCByZW1vdmluZyBjYWNoZWQgY3JlZGVudGlhbHNcclxuICAgICAgICBhbmQgcHJvZmlsZSBzbyB0aGUgYXBwIGNhbiBiZSBmaWxsZWQgdXAgd2l0aFxyXG4gICAgICAgIG5ldyB1c2VyIGluZm9ybWF0aW9uLlxyXG4gICAgICAgIEl0IGNhbGxzIHRvIHRoZSBBUEkgbG9nb3V0IGNhbGwgdG9vLCB0byByZW1vdmVcclxuICAgICAgICBhbnkgc2VydmVyLXNpZGUgc2Vzc2lvbiBhbmQgbm90aWZpY2F0aW9uXHJcbiAgICAgICAgKHJlbW92ZXMgdGhlIGNvb2tpZSB0b28sIGZvciBicm93c2VyIGVudmlyb25tZW50XHJcbiAgICAgICAgdGhhdCBtYXkgdXNlIGl0KS5cclxuICAgICoqL1xyXG4gICAgLy8gRlVUVVJFOiBUT1JFVklFVyBpZiB0aGUgL2xvZ291dCBjYWxsIGNhbiBiZSByZW1vdmVkLlxyXG4gICAgLy8gVE9ETzogbXVzdCByZW1vdmUgYWxsIHRoZSBsb2NhbGx5IHNhdmVkL2NhY2hlZCBkYXRhXHJcbiAgICAvLyByZWxhdGVkIHRvIHRoZSB1c2VyP1xyXG4gICAgQXBwTW9kZWwucHJvdG90eXBlLmxvZ291dCA9IGZ1bmN0aW9uIGxvZ291dCgpIHtcclxuXHJcbiAgICAgICAgLy8gTG9jYWwgYXBwIGNsb3NlIHNlc3Npb25cclxuICAgICAgICB0aGlzLnJlc3QuZXh0cmFIZWFkZXJzID0gbnVsbDtcclxuICAgICAgICBsb2NhbGZvcmFnZS5yZW1vdmVJdGVtKCdjcmVkZW50aWFscycpO1xyXG4gICAgICAgIGxvY2FsZm9yYWdlLnJlbW92ZUl0ZW0oJ3Byb2ZpbGUnKTtcclxuXHJcbiAgICAgICAgLy8gRG9uJ3QgbmVlZCB0byB3YWl0IHRoZSByZXN1bHQgb2YgdGhlIFJFU1Qgb3BlcmF0aW9uXHJcbiAgICAgICAgdGhpcy5yZXN0LnBvc3QoJ2xvZ291dCcpO1xyXG5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICAgIEF0dGVtcHRzIHRvIGNyZWF0ZSBhIHVzZXIgYWNjb3VudCwgZ2V0dGluZyBsb2dnZWRcclxuICAgICAgICBpZiBzdWNjZXNzZnVsbHkgbGlrZSB3aGVuIGRvaW5nIGEgbG9naW4gY2FsbC5cclxuICAgICoqL1xyXG4gICAgQXBwTW9kZWwucHJvdG90eXBlLnNpZ251cCA9IGZ1bmN0aW9uIHNpZ251cCh1c2VybmFtZSwgcGFzc3dvcmQsIHByb2ZpbGVUeXBlKSB7XHJcblxyXG4gICAgICAgIC8vIFJlc2V0IHRoZSBleHRyYSBoZWFkZXJzIHRvIGF0dGVtcHQgdGhlIHNpZ251cFxyXG4gICAgICAgIHRoaXMucmVzdC5leHRyYUhlYWRyZXMgPSBudWxsO1xyXG5cclxuICAgICAgICAvLyBUaGUgcmVzdWx0IGlzIHRoZSBzYW1lIGFzIGluIGEgbG9naW4sIGFuZFxyXG4gICAgICAgIC8vIHdlIGRvIHRoZSBzYW1lIGFzIHRoZXJlIHRvIGdldCB0aGUgdXNlciBsb2dnZWRcclxuICAgICAgICAvLyBvbiB0aGUgYXBwIG9uIHNpZ24tdXAgc3VjY2Vzcy5cclxuICAgICAgICByZXR1cm4gdGhpcy5yZXN0LnBvc3QoJ3NpZ251cD91dG1fc291cmNlPWFwcCcsIHtcclxuICAgICAgICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxyXG4gICAgICAgICAgICBwYXNzd29yZDogcGFzc3dvcmQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVUeXBlOiBwcm9maWxlVHlwZSxcclxuICAgICAgICAgICAgcmV0dXJuUHJvZmlsZTogdHJ1ZVxyXG4gICAgICAgIH0pLnRoZW4ocGVyZm9ybUxvY2FsTG9naW4odGhpcywgdXNlcm5hbWUsIHBhc3N3b3JkKSk7XHJcbiAgICB9O1xyXG59O1xyXG5cclxuZnVuY3Rpb24gcGVyZm9ybUxvY2FsTG9naW4odGhpc0FwcE1vZGVsLCB1c2VybmFtZSwgcGFzc3dvcmQpIHtcclxuICAgIFxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGxvZ2dlZCkge1xyXG4gICAgICAgIC8vIHVzZSBhdXRob3JpemF0aW9uIGtleSBmb3IgZWFjaFxyXG4gICAgICAgIC8vIG5ldyBSZXN0IHJlcXVlc3RcclxuICAgICAgICB0aGlzQXBwTW9kZWwucmVzdC5leHRyYUhlYWRlcnMgPSB7XHJcbiAgICAgICAgICAgIGFsdTogbG9nZ2VkLnVzZXJJRCxcclxuICAgICAgICAgICAgYWxrOiBsb2dnZWQuYXV0aEtleVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIGFzeW5jIGxvY2FsIHNhdmUsIGRvbid0IHdhaXRcclxuICAgICAgICBsb2NhbGZvcmFnZS5zZXRJdGVtKCdjcmVkZW50aWFscycsIHtcclxuICAgICAgICAgICAgdXNlcklEOiBsb2dnZWQudXNlcklELFxyXG4gICAgICAgICAgICB1c2VybmFtZTogdXNlcm5hbWUsXHJcbiAgICAgICAgICAgIHBhc3N3b3JkOiBwYXNzd29yZCxcclxuICAgICAgICAgICAgYXV0aEtleTogbG9nZ2VkLmF1dGhLZXlcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBJTVBPUlRBTlQ6IExvY2FsIG5hbWUga2VwdCBpbiBzeW5jIHdpdGggc2V0LXVwIGF0IEFwcE1vZGVsLnVzZXJQcm9maWxlXHJcbiAgICAgICAgbG9jYWxmb3JhZ2Uuc2V0SXRlbSgncHJvZmlsZScsIGxvZ2dlZC5wcm9maWxlKTtcclxuXHJcbiAgICAgICAgLy8gU2V0IHVzZXIgZGF0YVxyXG4gICAgICAgIHRoaXNBcHBNb2RlbC51c2VyKCkubW9kZWwudXBkYXRlV2l0aChsb2dnZWQucHJvZmlsZSk7XHJcblxyXG4gICAgICAgIHJldHVybiBsb2dnZWQ7XHJcbiAgICB9O1xyXG59XHJcbiIsIi8qKiBBcHBNb2RlbCBleHRlbnNpb24sXHJcbiAgICBmb2N1c2VkIG9uIHRoZSBFdmVudHMgQVBJXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcbnZhciBDYWxlbmRhckV2ZW50ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0NhbGVuZGFyRXZlbnQnKSxcclxuICAgIGFwaUhlbHBlciA9IHJlcXVpcmUoJy4uL3V0aWxzL2FwaUhlbHBlcicpO1xyXG5cclxuZXhwb3J0cy5wbHVnSW4gPSBmdW5jdGlvbiAoQXBwTW9kZWwpIHtcclxuICAgIFxyXG4gICAgYXBpSGVscGVyLmRlZmluZUNydWRBcGlGb3JSZXN0KHtcclxuICAgICAgICBleHRlbmRlZE9iamVjdDogQXBwTW9kZWwucHJvdG90eXBlLFxyXG4gICAgICAgIE1vZGVsOiBDYWxlbmRhckV2ZW50LFxyXG4gICAgICAgIG1vZGVsTmFtZTogJ0NhbGVuZGFyRXZlbnQnLFxyXG4gICAgICAgIG1vZGVsTGlzdE5hbWU6ICdDYWxlbmRhckV2ZW50cycsXHJcbiAgICAgICAgbW9kZWxVcmw6ICdldmVudHMnLFxyXG4gICAgICAgIGlkUHJvcGVydHlOYW1lOiAnY2FsZW5kYXJFdmVudElEJ1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8qKiAjIEFQSVxyXG4gICAgICAgIEFwcE1vZGVsLnByb3RvdHlwZS5nZXRFdmVudHM6OlxyXG4gICAgICAgIEBwYXJhbSB7b2JqZWN0fSBmaWx0ZXJzOiB7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBEYXRlLFxyXG4gICAgICAgICAgICBlbmQ6IERhdGUsXHJcbiAgICAgICAgICAgIHR5cGVzOiBbMywgNV0gLy8gW29wdGlvbmFsXSBMaXN0IEV2ZW50VHlwZXNJRHNcclxuICAgICAgICB9XHJcbiAgICAgICAgLS0tXHJcbiAgICAgICAgQXBwTW9kZWwucHJvdG90eXBlLmdldEV2ZW50XHJcbiAgICAgICAgLS0tXHJcbiAgICAgICAgQXBwTW9kZWwucHJvdG90eXBlLnB1dEV2ZW50XHJcbiAgICAgICAgLS0tXHJcbiAgICAgICAgQXBwTW9kZWwucHJvdG90eXBlLnBvc3RFdmVudFxyXG4gICAgICAgIC0tLVxyXG4gICAgICAgIEFwcE1vZGVsLnByb3RvdHlwZS5kZWxFdmVudFxyXG4gICAgICAgIC0tLVxyXG4gICAgICAgIEFwcE1vZGVsLnByb3RvdHlwZS5zZXRFdmVudFxyXG4gICAgKiovXHJcbn07IiwiLyoqXHJcbiAgICBNb2RlbCBBUEkgdG8gbWFuYWdlIHRoZSBjb2xsZWN0aW9uIG9mIEpvYiBUaXRsZXMgYXNzaWduZWRcclxuICAgIHRvIHRoZSBjdXJyZW50IHVzZXIgYW5kIGl0cyB3b3JraW5nIGRhdGEuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5leHBvcnRzLnBsdWdJbiA9IGZ1bmN0aW9uIChBcHBNb2RlbCkge1xyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBHZXQgdGhlIGNvbXBsZXRlIGxpc3Qgb2YgVXNlckpvYlRpdGxlIGZvclxyXG4gICAgICAgIGFsbCB0aGUgSm9iVGl0bGVzIGFzc2lnbmVkIHRvIHRoZSBjdXJyZW50IHVzZXJcclxuICAgICoqL1xyXG4gICAgQXBwTW9kZWwucHJvdG90eXBlLmdldFVzZXJKb2JQcm9maWxlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIFRPRE9cclxuICAgICAgICAvLyBUZXN0IGRhdGFcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFxyXG4gICAgICAgICAgICBbXVxyXG4gICAgICAgICk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBHZXQgYSBVc2VySm9iVGl0bGUgcmVjb3JkIGZvciB0aGUgZ2l2ZW5cclxuICAgICAgICBKb2JUaXRsZUlEIGFuZCB0aGUgY3VycmVudCB1c2VyLlxyXG4gICAgKiovXHJcbiAgICBBcHBNb2RlbC5wcm90b3R5cGUuZ2V0VXNlckpvYlRpdGxlID0gZnVuY3Rpb24gKGpvYlRpdGxlSUQpIHtcclxuICAgICAgICAvLyBUT0RPXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcclxuICAgIH07XHJcbn07XHJcbiIsIi8qKiBDYWxlbmRhciBTeW5jaW5nIGFwcCBtb2RlbFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIENhbGVuZGFyU3luY2luZyA9IHJlcXVpcmUoJy4uL21vZGVscy9DYWxlbmRhclN5bmNpbmcnKSxcclxuICAgIFJlbW90ZU1vZGVsID0gcmVxdWlyZSgnLi4vdXRpbHMvUmVtb3RlTW9kZWwnKTtcclxuXHJcbmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKGFwcE1vZGVsKSB7XHJcbiAgICB2YXIgcmVtID0gbmV3IFJlbW90ZU1vZGVsKHtcclxuICAgICAgICBkYXRhOiBuZXcgQ2FsZW5kYXJTeW5jaW5nKCksXHJcbiAgICAgICAgdHRsOiB7IG1pbnV0ZXM6IDEgfSxcclxuICAgICAgICBmZXRjaDogZnVuY3Rpb24gZmV0Y2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgnY2FsZW5kYXItc3luY2luZycpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHVzaDogZnVuY3Rpb24gcHVzaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QucHV0KCdjYWxlbmRhci1zeW5jaW5nJywgdGhpcy5kYXRhLm1vZGVsLnRvUGxhaW5PYmplY3QoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEV4dGVuZGluZyB3aXRoIHRoZSBzcGVjaWFsIEFQSSBtZXRob2QgJ3Jlc2V0RXhwb3J0VXJsJ1xyXG4gICAgcmVtLmlzUmVzZXRpbmcgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuICAgIHJlbS5yZXNldEV4cG9ydFVybCA9IGZ1bmN0aW9uIHJlc2V0RXhwb3J0VXJsKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJlbS5pc1Jlc2V0aW5nKHRydWUpO1xyXG5cclxuICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5wb3N0KCdjYWxlbmRhci1zeW5jaW5nL3Jlc2V0LWV4cG9ydC11cmwnKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHVwZGF0ZWRTeW5jU2V0dGluZ3MpIHtcclxuICAgICAgICAgICAgLy8gVXBkYXRpbmcgdGhlIGNhY2hlZCBkYXRhXHJcbiAgICAgICAgICAgIHJlbS5kYXRhLm1vZGVsLnVwZGF0ZVdpdGgodXBkYXRlZFN5bmNTZXR0aW5ncyk7XHJcbiAgICAgICAgICAgIHJlbS5pc1Jlc2V0aW5nKGZhbHNlKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB1cGRhdGVkU3luY1NldHRpbmdzO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gcmVtO1xyXG59O1xyXG4iLCIvKiogSG9tZSBBZGRyZXNzXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgQWRkcmVzcyA9IHJlcXVpcmUoJy4uL21vZGVscy9BZGRyZXNzJyk7XHJcblxyXG52YXIgUmVtb3RlTW9kZWwgPSByZXF1aXJlKCcuLi91dGlscy9SZW1vdGVNb2RlbCcpO1xyXG5cclxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoYXBwTW9kZWwpIHtcclxuICAgIHJldHVybiBuZXcgUmVtb3RlTW9kZWwoe1xyXG4gICAgICAgIGRhdGE6IG5ldyBBZGRyZXNzKCksXHJcbiAgICAgICAgdHRsOiB7IG1pbnV0ZXM6IDEgfSxcclxuICAgICAgICBmZXRjaDogZnVuY3Rpb24gZmV0Y2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgnYWRkcmVzc2VzL2hvbWUnKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1c2g6IGZ1bmN0aW9uIHB1c2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LnB1dCgnYWRkcmVzc2VzL2hvbWUnLCB0aGlzLmRhdGEubW9kZWwudG9QbGFpbk9iamVjdCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqIEFwcE1vZGVsLCBjZW50cmFsaXplcyBhbGwgdGhlIGRhdGEgZm9yIHRoZSBhcHAsXHJcbiAgICBjYWNoaW5nIGFuZCBzaGFyaW5nIGRhdGEgYWNyb3NzIGFjdGl2aXRpZXMgYW5kIHBlcmZvcm1pbmdcclxuICAgIHJlcXVlc3RzXHJcbioqL1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuLi9tb2RlbHMvTW9kZWwnKSxcclxuICAgIFVzZXIgPSByZXF1aXJlKCcuLi9tb2RlbHMvVXNlcicpLFxyXG4gICAgUmVzdCA9IHJlcXVpcmUoJy4uL3V0aWxzL1Jlc3QnKSxcclxuICAgIGxvY2FsZm9yYWdlID0gcmVxdWlyZSgnbG9jYWxmb3JhZ2UnKTtcclxuXHJcbmZ1bmN0aW9uIEFwcE1vZGVsKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnVzZXJQcm9maWxlID0gcmVxdWlyZSgnLi9BcHBNb2RlbC51c2VyUHJvZmlsZScpLmNyZWF0ZSh0aGlzKTtcclxuICAgIC8vIE5PVEU6IEFsaWFzIGZvciB0aGUgdXNlciBkYXRhXHJcbiAgICAvLyBUT0RPOlRPUkVWSUVXIGlmIGNvbnRpbnVlIHRvIG1ha2VzIHNlbnNlIHRvIGtlZXAgdGhpcyAndXNlcigpJyBhbGlhcywgZG9jdW1lbnRcclxuICAgIC8vIHdoZXJlIGlzIHVzZWQgYW5kIHdoeSBpcyBwcmVmZXJyZWQgdG8gdGhlIGNhbm9uaWNhbCB3YXkuXHJcbiAgICB0aGlzLnVzZXIgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy51c2VyUHJvZmlsZS5kYXRhO1xyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgdGhpcy5zY2hlZHVsaW5nUHJlZmVyZW5jZXMgPSByZXF1aXJlKCcuL0FwcE1vZGVsLnNjaGVkdWxpbmdQcmVmZXJlbmNlcycpLmNyZWF0ZSh0aGlzKTtcclxuICAgIHRoaXMuY2FsZW5kYXJTeW5jaW5nID0gcmVxdWlyZSgnLi9BcHBNb2RlbC5jYWxlbmRhclN5bmNpbmcnKS5jcmVhdGUodGhpcyk7XHJcbiAgICB0aGlzLnNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSA9IHJlcXVpcmUoJy4vQXBwTW9kZWwuc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlJykuY3JlYXRlKHRoaXMpO1xyXG4gICAgdGhpcy5tYXJrZXRwbGFjZVByb2ZpbGUgPSByZXF1aXJlKCcuL0FwcE1vZGVsLm1hcmtldHBsYWNlUHJvZmlsZScpLmNyZWF0ZSh0aGlzKTtcclxuICAgIHRoaXMuaG9tZUFkZHJlc3MgPSByZXF1aXJlKCcuL0FwcE1vZGVsLmhvbWVBZGRyZXNzJykuY3JlYXRlKHRoaXMpO1xyXG59XHJcblxyXG5yZXF1aXJlKCcuL0FwcE1vZGVsLWFjY291bnQnKS5wbHVnSW4oQXBwTW9kZWwpO1xyXG5cclxuLyoqIEluaXRpYWxpemUgYW5kIHdhaXQgZm9yIGFueXRoaW5nIHVwICoqL1xyXG5BcHBNb2RlbC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICBcclxuICAgIHZhciBzaXRlVXJsID0gJCgnaHRtbCcpLmF0dHIoJ2RhdGEtc2l0ZS11cmwnKTtcclxuICAgIHRoaXMucmVzdCA9IG5ldyBSZXN0KHNpdGVVcmwgKyAnL2FwaS92MS9lbi1VUy8nKTtcclxuICAgIFxyXG4gICAgLy8gU2V0dXAgUmVzdCBhdXRoZW50aWNhdGlvblxyXG4gICAgdGhpcy5yZXN0Lm9uQXV0aG9yaXphdGlvblJlcXVpcmVkID0gZnVuY3Rpb24ocmV0cnkpIHtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnRyeUxvZ2luKClcclxuICAgICAgICAudGhlbihmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgLy8gTG9nZ2VkISBKdXN0IHJldHJ5XHJcbiAgICAgICAgICAgIHJldHJ5KCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbiAgICBcclxuICAgIC8vIExvY2FsIGRhdGFcclxuICAgIC8vIFRPRE8gSW52ZXN0aWdhdGUgd2h5IGF1dG9tYXRpYyBzZWxlY3Rpb24gYW4gSW5kZXhlZERCIGFyZVxyXG4gICAgLy8gZmFpbGluZyBhbmQgd2UgbmVlZCB0byB1c2UgdGhlIHdvcnNlLXBlcmZvcm1hbmNlIGxvY2Fsc3RvcmFnZSBiYWNrLWVuZFxyXG4gICAgbG9jYWxmb3JhZ2UuY29uZmlnKHtcclxuICAgICAgICBuYW1lOiAnTG9jb25vbWljc0FwcCcsXHJcbiAgICAgICAgdmVyc2lvbjogMC4xLFxyXG4gICAgICAgIHNpemUgOiA0OTgwNzM2LCAvLyBTaXplIG9mIGRhdGFiYXNlLCBpbiBieXRlcy4gV2ViU1FMLW9ubHkgZm9yIG5vdy5cclxuICAgICAgICBzdG9yZU5hbWUgOiAna2V5dmFsdWVwYWlycycsXHJcbiAgICAgICAgZGVzY3JpcHRpb24gOiAnTG9jb25vbWljcyBBcHAnLFxyXG4gICAgICAgIGRyaXZlcjogbG9jYWxmb3JhZ2UuTE9DQUxTVE9SQUdFXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBJbml0aWFsaXplOiBjaGVjayB0aGUgdXNlciBoYXMgbG9naW4gZGF0YSBhbmQgbmVlZGVkXHJcbiAgICAvLyBjYWNoZWQgZGF0YVxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG5cclxuICAgICAgICAvLyBDYWxsYmFjayB0byBqdXN0IHJlc29sdmUgd2l0aG91dCBlcnJvciAocGFzc2luZyBpbiB0aGUgZXJyb3JcclxuICAgICAgICAvLyB0byB0aGUgJ3Jlc29sdmUnIHdpbGwgbWFrZSB0aGUgcHJvY2VzcyB0byBmYWlsKSxcclxuICAgICAgICAvLyBzaW5jZSB3ZSBkb24ndCBuZWVkIHRvIGNyZWF0ZSBhbiBlcnJvciBmb3IgdGhlXHJcbiAgICAgICAgLy8gYXBwIGluaXQsIGlmIHRoZXJlIGlzIG5vdCBlbm91Z2ggc2F2ZWQgaW5mb3JtYXRpb25cclxuICAgICAgICAvLyB0aGUgYXBwIGhhcyBjb2RlIHRvIHJlcXVlc3QgYSBsb2dpbi5cclxuICAgICAgICB2YXIgcmVzb2x2ZUFueXdheSA9IGZ1bmN0aW9uKGRvZXNuTWF0dGVyKXsgICAgICAgIFxyXG4gICAgICAgICAgICBjb25zb2xlLndhcm5pbmcoJ0FwcCBNb2RlbCBJbml0IGVycicsIGRvZXNuTWF0dGVyKTtcclxuICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSWYgdGhlcmUgYXJlIGNyZWRlbnRpYWxzIHNhdmVkXHJcbiAgICAgICAgbG9jYWxmb3JhZ2UuZ2V0SXRlbSgnY3JlZGVudGlhbHMnKS50aGVuKGZ1bmN0aW9uKGNyZWRlbnRpYWxzKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoY3JlZGVudGlhbHMgJiZcclxuICAgICAgICAgICAgICAgIGNyZWRlbnRpYWxzLnVzZXJJRCAmJlxyXG4gICAgICAgICAgICAgICAgY3JlZGVudGlhbHMudXNlcm5hbWUgJiZcclxuICAgICAgICAgICAgICAgIGNyZWRlbnRpYWxzLmF1dGhLZXkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyB1c2UgYXV0aG9yaXphdGlvbiBrZXkgZm9yIGVhY2hcclxuICAgICAgICAgICAgICAgIC8vIG5ldyBSZXN0IHJlcXVlc3RcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzdC5leHRyYUhlYWRlcnMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWx1OiBjcmVkZW50aWFscy51c2VySUQsXHJcbiAgICAgICAgICAgICAgICAgICAgYWxrOiBjcmVkZW50aWFscy5hdXRoS2V5XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBJdCBoYXMgY3JlZGVudGlhbHMhIEhhcyBiYXNpYyBwcm9maWxlIGRhdGE/XHJcbiAgICAgICAgICAgICAgICAvLyBOT1RFOiB0aGUgdXNlclByb2ZpbGUgd2lsbCBsb2FkIGZyb20gbG9jYWwgc3RvcmFnZSBvbiB0aGlzIGZpcnN0XHJcbiAgICAgICAgICAgICAgICAvLyBhdHRlbXB0LCBhbmQgbGF6aWx5IHJlcXVlc3QgdXBkYXRlZCBkYXRhIGZyb20gcmVtb3RlXHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJQcm9maWxlLmxvYWQoKS50aGVuKGZ1bmN0aW9uKHByb2ZpbGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGVyZSBpcyBhIHByb2ZpbGUgY2FjaGVkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVuZCBzdWNjZXNmdWxseVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBObyBwcm9maWxlLCB3ZSBuZWVkIHRvIHJlcXVlc3QgaXQgdG8gYmUgYWJsZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0byB3b3JrIGNvcnJlY3RseSwgc28gd2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXR0ZW1wdCBhIGxvZ2luICh0aGUgdHJ5TG9naW4gcHJvY2VzcyBwZXJmb3Jtc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhIGxvZ2luIHdpdGggdGhlIHNhdmVkIGNyZWRlbnRpYWxzIGFuZCBmZXRjaFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgcHJvZmlsZSB0byBzYXZlIGl0IGluIHRoZSBsb2NhbCBjb3B5KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyeUxvZ2luKCkudGhlbihyZXNvbHZlLCByZXNvbHZlQW55d2F5KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LmJpbmQodGhpcyksIHJlc29sdmVBbnl3YXkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gRW5kIHN1Y2Nlc3NmdWxseS4gTm90IGxvZ2dpbiBpcyBub3QgYW4gZXJyb3IsXHJcbiAgICAgICAgICAgICAgICAvLyBpcyBqdXN0IHRoZSBmaXJzdCBhcHAgc3RhcnQtdXBcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKSwgcmVzb2x2ZUFueXdheSk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59O1xyXG5cclxuQXBwTW9kZWwucHJvdG90eXBlLmdldFVwY29taW5nQm9va2luZ3MgPSBmdW5jdGlvbiBnZXRVcGNvbWluZ0Jvb2tpbmdzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVzdC5nZXQoJ3VwY29taW5nLWJvb2tpbmdzJyk7XHJcbn07XHJcblxyXG5BcHBNb2RlbC5wcm90b3R5cGUuZ2V0Qm9va2luZyA9IGZ1bmN0aW9uIGdldEJvb2tpbmcoaWQpIHtcclxuICAgIHJldHVybiB0aGlzLnJlc3QuZ2V0KCdnZXQtYm9va2luZycsIHsgYm9va2luZ0lEOiBpZCB9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXBwTW9kZWw7XHJcblxyXG4vLyBDbGFzcyBzcGxpdGVkIGluIGRpZmZlcmVudCBmaWxlcyB0byBtaXRpZ2F0ZSBzaXplIGFuZCBvcmdhbml6YXRpb25cclxuLy8gYnV0IGtlZXBpbmcgYWNjZXNzIHRvIHRoZSBjb21tb24gc2V0IG9mIG1ldGhvZHMgYW5kIG9iamVjdHMgZWFzeSB3aXRoXHJcbi8vIHRoZSBzYW1lIGNsYXNzLlxyXG4vLyBMb2FkaW5nIGV4dGVuc2lvbnM6XHJcbnJlcXVpcmUoJy4vQXBwTW9kZWwtZXZlbnRzJykucGx1Z0luKEFwcE1vZGVsKTtcclxucmVxdWlyZSgnLi9BcHBNb2RlbC11c2VySm9iUHJvZmlsZScpLnBsdWdJbihBcHBNb2RlbCk7XHJcbiIsIi8qKiBNYXJrZXRwbGFjZVByb2ZpbGVcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBNYXJrZXRwbGFjZVByb2ZpbGUgPSByZXF1aXJlKCcuLi9tb2RlbHMvTWFya2V0cGxhY2VQcm9maWxlJyk7XHJcblxyXG52YXIgUmVtb3RlTW9kZWwgPSByZXF1aXJlKCcuLi91dGlscy9SZW1vdGVNb2RlbCcpO1xyXG5cclxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoYXBwTW9kZWwpIHtcclxuICAgIHJldHVybiBuZXcgUmVtb3RlTW9kZWwoe1xyXG4gICAgICAgIGRhdGE6IG5ldyBNYXJrZXRwbGFjZVByb2ZpbGUoKSxcclxuICAgICAgICB0dGw6IHsgbWludXRlczogMSB9LFxyXG4gICAgICAgIGxvY2FsU3RvcmFnZU5hbWU6ICdtYXJrZXRwbGFjZVByb2ZpbGUnLFxyXG4gICAgICAgIGZldGNoOiBmdW5jdGlvbiBmZXRjaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QuZ2V0KCdtYXJrZXRwbGFjZS1wcm9maWxlJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXNoOiBmdW5jdGlvbiBwdXNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5wdXQoJ21hcmtldHBsYWNlLXByb2ZpbGUnLCB0aGlzLmRhdGEubW9kZWwudG9QbGFpbk9iamVjdCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgU2NoZWR1bGluZ1ByZWZlcmVuY2VzID0gcmVxdWlyZSgnLi4vbW9kZWxzL1NjaGVkdWxpbmdQcmVmZXJlbmNlcycpO1xyXG5cclxudmFyIFJlbW90ZU1vZGVsID0gcmVxdWlyZSgnLi4vdXRpbHMvUmVtb3RlTW9kZWwnKTtcclxuXHJcbmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKGFwcE1vZGVsKSB7XHJcbiAgICByZXR1cm4gbmV3IFJlbW90ZU1vZGVsKHtcclxuICAgICAgICBkYXRhOiBuZXcgU2NoZWR1bGluZ1ByZWZlcmVuY2VzKCksXHJcbiAgICAgICAgdHRsOiB7IG1pbnV0ZXM6IDEgfSxcclxuICAgICAgICBmZXRjaDogZnVuY3Rpb24gZmV0Y2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgnc2NoZWR1bGluZy1wcmVmZXJlbmNlcycpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHVzaDogZnVuY3Rpb24gcHVzaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QucHV0KCdzY2hlZHVsaW5nLXByZWZlcmVuY2VzJywgdGhpcy5kYXRhLm1vZGVsLnRvUGxhaW5PYmplY3QoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSA9IHJlcXVpcmUoJy4uL21vZGVscy9TaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUnKSxcclxuICAgIFJlbW90ZU1vZGVsID0gcmVxdWlyZSgnLi4vdXRpbHMvUmVtb3RlTW9kZWwnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxuLy8gVGhlIHNsb3Qgc2l6ZSBpcyBmaXhlZCB0byAxNSBtaW51dGVzIGJ5IGRlZmF1bHQuXHJcbi8vIE5PVEU6IGN1cnJlbnRseSwgdGhlIEFQSSBvbmx5IGFsbG93cyAxNSBtaW51dGVzIHNsb3RzLFxyXG4vLyBiZWluZyB0aGF0IGltcGxpY2l0LCBidXQgcGFydCBvZiB0aGUgY29kZSBpcyByZWFkeSBmb3IgZXhwbGljaXQgc2xvdFNpemUuXHJcbnZhciBkZWZhdWx0U2xvdFNpemUgPSAxNTtcclxuLy8gQSBsaXN0IG9mIHdlZWsgZGF5IHByb3BlcnRpZXMgbmFtZXMgYWxsb3dlZFxyXG4vLyB0byBiZSBwYXJ0IG9mIHRoZSBvYmplY3RzIGRlc2NyaWJpbmcgd2Vla2x5IHNjaGVkdWxlXHJcbi8vIChzaW1wbGlmaWVkIG9yIGNvbXBsZXRlL3Nsb3QgYmFzZWQpXHJcbi8vIEp1c3QgbG93ZWNhc2VkIGVuZ2xpc2ggbmFtZXNcclxudmFyIHdlZWtEYXlQcm9wZXJ0aWVzID0gWydzdW5kYXknLCAnbW9uZGF5JywgJ3R1ZXNkYXknLCAnd2VkbmVzZGF5JywgJ3RodXJzZGF5JywgJ2ZyaWRheScsICdzYXR1cmRheSddO1xyXG5cclxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoYXBwTW9kZWwpIHtcclxuICAgIHJldHVybiBuZXcgUmVtb3RlTW9kZWwoe1xyXG4gICAgICAgIGRhdGE6IG5ldyBTaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUoKSxcclxuICAgICAgICB0dGw6IHsgbWludXRlczogMSB9LFxyXG4gICAgICAgIGZldGNoOiBmdW5jdGlvbiBmZXRjaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QuZ2V0KCdhdmFpbGFiaWxpdHkvd2Vla2x5LXNjaGVkdWxlJylcclxuICAgICAgICAgICAgLnRoZW4oZnJvbVdlZWtseVNjaGVkdWxlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1c2g6IGZ1bmN0aW9uIHB1c2goKSB7XHJcbiAgICAgICAgICAgIHZhciBwbGFpbkRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAnYWxsLXRpbWUnOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICdqc29uLWRhdGEnOiB7fVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBpZiAodGhpcy5kYXRhLmlzQWxsVGltZSgpID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICBwbGFpbkRhdGFbJ2FsbC10aW1lJ10gPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcGxhaW5EYXRhWydqc29uLWRhdGEnXSA9IEpTT04uc3RyaW5naWZ5KHRvV2Vla2x5U2NoZWR1bGUodGhpcy5kYXRhLm1vZGVsLnRvUGxhaW5PYmplY3QodHJ1ZSkpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QucHV0KCdhdmFpbGFiaWxpdHkvd2Vla2x5LXNjaGVkdWxlJywgcGxhaW5EYXRhKVxyXG4gICAgICAgICAgICAudGhlbihmcm9tV2Vla2x5U2NoZWR1bGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gZnJvbVdlZWtseVNjaGVkdWxlKHdlZWtseVNjaGVkdWxlKSB7XHJcbiAgICBcclxuICAgIC8vIE5ldyBzaW1wbGlmaWVkIG9iamVjdCwgYXMgYSBwbGFpbiBvYmplY3Qgd2l0aFxyXG4gICAgLy8gd2Vla2RheXMgcHJvcGVydGllcyBhbmQgZnJvbS10byBwcm9wZXJ0aWVzIGxpa2U6XHJcbiAgICAvLyB7IHN1bmRheTogeyBmcm9tOiAwLCB0bzogNjAgfSB9XHJcbiAgICAvLyBTaW5jZSB0aGlzIGlzIGV4cGVjdGVkIHRvIGJlIGNvbnN1bWVkIGJ5IGZldGNoLXB1c2hcclxuICAgIC8vIG9wZXJhdGlvbnMsIGFuZCBsYXRlciBieSBhbiAnbW9kZWwudXBkYXRlV2l0aCcgb3BlcmF0aW9uLFxyXG4gICAgLy8gc28gcGxhaW4gaXMgc2ltcGxlIGFuZCBiZXR0ZXIgb24gcGVyZm9ybWFuY2U7IGNhbiBiZVxyXG4gICAgLy8gY29udmVydGVkIGVhc2lseSB0byB0aGUgU2ltcGxpZmllZFdlZWtseVNjaGVkdWxlIG9iamVjdC5cclxuICAgIHZhciBzaW1wbGVXUyA9IHt9O1xyXG4gICAgXHJcbiAgICAvLyBPbmx5IHN1cHBvcnRzICdhdmFpbGFibGUnIHN0YXR1cyB3aXRoIGRlZmF1bHQgJ3VuYXZhaWxhYmxlJ1xyXG4gICAgaWYgKHdlZWtseVNjaGVkdWxlLmRlZmF1bHRTdGF0dXMgIT09ICd1bmF2YWlsYWJsZScgfHxcclxuICAgICAgICB3ZWVrbHlTY2hlZHVsZS5zdGF0dXMgIT09ICdhdmFpbGFibGUnKSB7XHJcbiAgICAgICAgdGhyb3cge1xyXG4gICAgICAgICAgICBuYW1lOiAnaW5wdXQtZm9ybWF0JyxcclxuICAgICAgICAgICAgbWVzc2FnZTogJ1dlZWtseSBzY2hlZHVsZSwgZ2l2ZW4gc3RhdHVzZXMgbm90IHN1cHBvcnRlZCwgc3RhdHVzOiAnICtcclxuICAgICAgICAgICAgd2Vla2x5U2NoZWR1bGUuc3RhdHVzICsgJywgZGVmYXVsdFN0YXR1czogJyArIFxyXG4gICAgICAgICAgICB3ZWVrbHlTY2hlZHVsZS5kZWZhdWx0U3RhdHVzXHJcbiAgICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBnaXZlbiBzbG90U2l6ZSBvciBkZWZhdWx0XHJcbiAgICB2YXIgc2xvdFNpemUgPSAod2Vla2x5U2NoZWR1bGUuc2xvdFNpemUgfHwgZGVmYXVsdFNsb3RTaXplKSB8MDtcclxuXHJcbiAgICAvLyBSZWFkIHNsb3RzIHBlciB3ZWVrLWRheSAoeyBzbG90czogeyBcInN1bmRheVwiOiBbXSB9IH0pXHJcbiAgICBPYmplY3Qua2V5cyh3ZWVrbHlTY2hlZHVsZS5zbG90cylcclxuICAgIC5mb3JFYWNoKGZ1bmN0aW9uKHdlZWtkYXkpIHtcclxuICAgICAgICBcclxuICAgICAgICAvLyBWZXJpZnkgaXMgYSB3ZWVrZGF5IHByb3BlcnR5LCBvciBleGl0IGVhcmx5XHJcbiAgICAgICAgaWYgKHdlZWtEYXlQcm9wZXJ0aWVzLmluZGV4T2Yod2Vla2RheSkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRheXNsb3RzID0gd2Vla2x5U2NoZWR1bGUuc2xvdHNbd2Vla2RheV07XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gV2UgZ2V0IHRoZSBmaXJzdCBhdmFpbGFibGUgc2xvdCBhbmQgdGhlIGxhc3QgY29uc2VjdXRpdmVcclxuICAgICAgICAvLyB0byBtYWtlIHRoZSByYW5nZVxyXG4gICAgICAgIHZhciBmcm9tID0gbnVsbCxcclxuICAgICAgICAgICAgdG8gPSBudWxsLFxyXG4gICAgICAgICAgICBwcmV2aW91cyA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIHRpbWVzIGFyZSBvcmRlcmVkIGluIGFzY2VuZGluZ1xyXG4gICAgICAgIC8vIGFuZCB3aXRoIGZvcm1hdCBcIjAwOjAwOjAwXCIgdGhhdCB3ZSBjb252ZXJ0IHRvIG1pbnV0ZXNcclxuICAgICAgICAvLyAoZW5vdWdoIHByZWNpc2lvbiBmb3Igc2ltcGxpZmllZCB3ZWVrbHkgc2NoZWR1bGUpXHJcbiAgICAgICAgLy8gdXNpbmcgbW9tZW50LmR1cmF0aW9uXHJcbiAgICAgICAgLy8gTk9URTogdXNpbmcgJ3NvbWUnIHJhdGhlciB0aGFuICdmb3JFYWNoJyB0byBiZSBhYmxlXHJcbiAgICAgICAgLy8gdG8gZXhpdCBlYXJseSBmcm9tIHRoZSBpdGVyYXRpb24gYnkgcmV0dXJuaW5nICd0cnVlJ1xyXG4gICAgICAgIC8vIHdoZW4gdGhlIGVuZCBpcyByZWFjaGVkLlxyXG4gICAgICAgIGRheXNsb3RzLnNvbWUoZnVuY3Rpb24oc2xvdCkge1xyXG4gICAgICAgICAgICB2YXIgbWludXRlcyA9IG1vbWVudC5kdXJhdGlvbihzbG90KS5hc01pbnV0ZXMoKSB8MDtcclxuICAgICAgICAgICAgLy8gV2UgaGF2ZSBub3Qgc3RpbGwgYSAnZnJvbScgdGltZTpcclxuICAgICAgICAgICAgaWYgKGZyb20gPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGZyb20gPSBtaW51dGVzO1xyXG4gICAgICAgICAgICAgICAgcHJldmlvdXMgPSBtaW51dGVzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gV2UgaGF2ZSBhIGJlZ2dpbmluZywgY2hlY2sgaWYgdGhpcyBpcyBjb25zZWN1dGl2ZVxyXG4gICAgICAgICAgICAgICAgLy8gdG8gcHJldmlvdXMsIGJ5IGNoZWNraW5nIHByZXZpb3VzIHBsdXMgc2xvdFNpemVcclxuICAgICAgICAgICAgICAgIGlmIChwcmV2aW91cyArIHNsb3RTaXplID09PSBtaW51dGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTmV3IGVuZFxyXG4gICAgICAgICAgICAgICAgICAgIHRvID0gbWludXRlcztcclxuICAgICAgICAgICAgICAgICAgICAvLyBOZXh0IGl0ZXJhdGlvblxyXG4gICAgICAgICAgICAgICAgICAgIHByZXZpb3VzID0gbWludXRlcztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIE5vIGNvbnNlY3V0aXZlLCB3ZSBhbHJlYWR5IGhhcyBhIHJhbmdlLCBhbnlcclxuICAgICAgICAgICAgICAgICAgICAvLyBhZGRpdGlvbmFsIHNsb3QgaXMgZGlzY2FyZGVkLCBvdXQgb2YgdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcHJlY2lzaW9uIG9mIHRoZSBzaW1wbGlmaWVkIHdlZWtseSBzY2hlZHVsZSxcclxuICAgICAgICAgICAgICAgICAgICAvLyBzbyB3ZSBjYW4gZ28gb3V0IHRoZSBpdGVyYXRpb246XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTk9URTogSWYgaW4gYSBmdXR1cmUgYSBtb3JlIGNvbXBsZXRlIHNjaGVkdWxlXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gbmVlZCB0byBiZSB3cm90ZW4gdXNpbmcgbXVsdGlwbGUgcmFuZ2VzIHJhdGhlclxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGluZGl2aWR1YWwgc2xvdHMsIHRoaXMgaXMgdGhlIHBsYWNlIHRvIGNvbnRpbnVlXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29kaW5nLCBwb3B1bGF0aW5nIGFuIGFycmF5IG9mIFt7ZnJvbSwgdG99XSA6LSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFNsb3RzIGNoZWNrZWQsIGNoZWNrIHRoZSByZXN1bHRcclxuICAgICAgICBpZiAoZnJvbSAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHNpbXBsZURheSA9IHtcclxuICAgICAgICAgICAgICAgIGZyb206IGZyb20sXHJcbiAgICAgICAgICAgICAgICB0bzogMFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBzaW1wbGVXU1t3ZWVrZGF5XSA9IHNpbXBsZURheTtcclxuXHJcbiAgICAgICAgICAgIC8vIFdlIGhhdmUgYSByYW5nZSFcclxuICAgICAgICAgICAgaWYgKHRvICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBhbmQgaGFzIGFuIGVuZCFcclxuICAgICAgICAgICAgICAgIC8vIGFkZCB0aGUgc2xvdCBzaXplIHRvIHRoZSBlbmRpbmdcclxuICAgICAgICAgICAgICAgIHNpbXBsZURheS50byA9IHRvICsgc2xvdFNpemU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBzbWFsbGVyIHJhbmdlLCBqdXN0IG9uZSBzbG90LFxyXG4gICAgICAgICAgICAgICAgLy8gYWRkIHRoZSBzbG90IHNpemUgdG8gdGhlIGJlZ2luaW5nXHJcbiAgICAgICAgICAgICAgICBzaW1wbGVEYXkudG8gPSBmcm9tICsgc2xvdFNpemU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEb25lIVxyXG4gICAgcmV0dXJuIHNpbXBsZVdTO1xyXG59XHJcblxyXG4vKipcclxuICAgIFBhc3MgaW4gYSBwbGFpbiBvYmplY3QsIG5vdCBhIG1vZGVsLFxyXG4gICAgZ2V0dGluZyBhbiBvYmplY3Qgc3VpdGFibGUgZm9yIHRoZSBBUEkgZW5kcG9pbnQuXHJcbioqL1xyXG5mdW5jdGlvbiB0b1dlZWtseVNjaGVkdWxlKHNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSkge1xyXG5cclxuICAgIHZhciBzbG90U2l6ZSA9IGRlZmF1bHRTbG90U2l6ZTtcclxuICAgIFxyXG4gICAgLy8gSXQncyBidWlsZCB3aXRoICdhdmFpbGFibGUnIGFzIGV4cGxpY2l0IHN0YXR1czpcclxuICAgIHZhciB3ZWVrbHlTY2hlZHVsZSA9IHtcclxuICAgICAgICBzdGF0dXM6ICdhdmFpbGFibGUnLFxyXG4gICAgICAgIGRlZmF1bHRBdmFpbGFiaWxpdHk6ICd1bmF2YWlsYWJsZScsXHJcbiAgICAgICAgc2xvdHM6IHt9LFxyXG4gICAgICAgIHNsb3RTaXplOiBzbG90U2l6ZVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBQZXIgd2Vla2RheVxyXG4gICAgT2JqZWN0LmtleXMoc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlKVxyXG4gICAgLmZvckVhY2goZnVuY3Rpb24od2Vla2RheSkge1xyXG5cclxuICAgICAgICAvLyBWZXJpZnkgaXMgYSB3ZWVrZGF5IHByb3BlcnR5LCBvciBleGl0IGVhcmx5XHJcbiAgICAgICAgaWYgKHdlZWtEYXlQcm9wZXJ0aWVzLmluZGV4T2Yod2Vla2RheSkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzaW1wbGVEYXkgPSBzaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGVbd2Vla2RheV07XHJcblxyXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gZXhwYW5kIHRoZSBzaW1wbGlmaWVkIHRpbWUgcmFuZ2VzIFxyXG4gICAgICAgIC8vIGluIHNsb3RzIG9mIHRoZSBzbG90U2l6ZVxyXG4gICAgICAgIC8vIFRoZSBlbmQgdGltZSB3aWxsIGJlIGV4Y2x1ZGVkLCBzaW5jZSBzbG90c1xyXG4gICAgICAgIC8vIGRlZmluZSBvbmx5IHRoZSBzdGFydCwgYmVpbmcgaW1wbGljaXQgdGhlIHNsb3RTaXplLlxyXG4gICAgICAgIHZhciBmcm9tID0gc2ltcGxlRGF5LmZyb20gfDAsXHJcbiAgICAgICAgICAgIHRvID0gc2ltcGxlRGF5LnRvIHwwO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgdGhlIHNsb3QgYXJyYXlcclxuICAgICAgICB3ZWVrbHlTY2hlZHVsZS5zbG90c1t3ZWVrZGF5XSA9IFtdO1xyXG5cclxuICAgICAgICAvLyBJbnRlZ3JpdHkgdmVyaWZpY2F0aW9uXHJcbiAgICAgICAgaWYgKHRvID4gZnJvbSkge1xyXG4gICAgICAgICAgICAvLyBJdGVyYXRlIGJ5IHRoZSBzbG90U2l6ZSB1bnRpbCB3ZSByZWFjaFxyXG4gICAgICAgICAgICAvLyB0aGUgZW5kLCBub3QgaW5jbHVkaW5nIHRoZSAndG8nIHNpbmNlXHJcbiAgICAgICAgICAgIC8vIHNsb3RzIGluZGljYXRlIG9ubHkgdGhlIHN0YXJ0IG9mIHRoZSBzbG90XHJcbiAgICAgICAgICAgIC8vIHRoYXQgaXMgYXNzdW1lZCB0byBmaWxsIGEgc2xvdFNpemUgc3RhcnRpbmdcclxuICAgICAgICAgICAgLy8gb24gdGhhdCBzbG90LXRpbWVcclxuICAgICAgICAgICAgdmFyIHByZXZpb3VzID0gZnJvbTtcclxuICAgICAgICAgICAgd2hpbGUgKHByZXZpb3VzIDwgdG8pIHtcclxuICAgICAgICAgICAgICAgIHdlZWtseVNjaGVkdWxlLnNsb3RzW3dlZWtkYXldLnB1c2gobWludXRlc1RvVGltZVN0cmluZyhwcmV2aW91cykpO1xyXG4gICAgICAgICAgICAgICAgcHJldmlvdXMgKz0gc2xvdFNpemU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEb25lIVxyXG4gICAgcmV0dXJuIHdlZWtseVNjaGVkdWxlO1xyXG59XHJcblxyXG4vKipcclxuICAgIGludGVybmFsIHV0aWxpdHkgZnVuY3Rpb24gJ3RvIHN0cmluZyB3aXRoIHR3byBkaWdpdHMgYWxtb3N0J1xyXG4qKi9cclxuZnVuY3Rpb24gdHdvRGlnaXRzKG4pIHtcclxuICAgIHJldHVybiBNYXRoLmZsb29yKG4gLyAxMCkgKyAnJyArIG4gJSAxMDtcclxufVxyXG5cclxuLyoqXHJcbiAgICBDb252ZXJ0IGEgbnVtYmVyIG9mIG1pbnV0ZXNcclxuICAgIGluIGEgc3RyaW5nIGxpa2U6IDAwOjAwOjAwIChob3VyczptaW51dGVzOnNlY29uZHMpXHJcbioqL1xyXG5mdW5jdGlvbiBtaW51dGVzVG9UaW1lU3RyaW5nKG1pbnV0ZXMpIHtcclxuICAgIHZhciBkID0gbW9tZW50LmR1cmF0aW9uKG1pbnV0ZXMsICdtaW51dGVzJyksXHJcbiAgICAgICAgaCA9IGQuaG91cnMoKSxcclxuICAgICAgICBtID0gZC5taW51dGVzKCksXHJcbiAgICAgICAgcyA9IGQuc2Vjb25kcygpO1xyXG4gICAgXHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgIHR3b0RpZ2l0cyhoKSArICc6JyArXHJcbiAgICAgICAgdHdvRGlnaXRzKG0pICsgJzonICtcclxuICAgICAgICB0d29EaWdpdHMocylcclxuICAgICk7XHJcbn1cclxuIiwiLyoqIFVzZXJQcm9maWxlXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgVXNlciA9IHJlcXVpcmUoJy4uL21vZGVscy9Vc2VyJyk7XHJcblxyXG52YXIgUmVtb3RlTW9kZWwgPSByZXF1aXJlKCcuLi91dGlscy9SZW1vdGVNb2RlbCcpO1xyXG5cclxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoYXBwTW9kZWwpIHtcclxuICAgIHJldHVybiBuZXcgUmVtb3RlTW9kZWwoe1xyXG4gICAgICAgIGRhdGE6IFVzZXIubmV3QW5vbnltb3VzKCksXHJcbiAgICAgICAgdHRsOiB7IG1pbnV0ZXM6IDEgfSxcclxuICAgICAgICAvLyBJTVBPUlRBTlQ6IEtlZXAgdGhlIG5hbWUgaW4gc3luYyB3aXRoIHNldC11cCBhdCBBcHBNb2RlbC1hY2NvdW50XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlTmFtZTogJ3Byb2ZpbGUnLFxyXG4gICAgICAgIGZldGNoOiBmdW5jdGlvbiBmZXRjaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QuZ2V0KCdwcm9maWxlJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXNoOiBmdW5jdGlvbiBwdXNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5wdXQoJ3Byb2ZpbGUnLCB0aGlzLmRhdGEubW9kZWwudG9QbGFpbk9iamVjdCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBTaW1wbGUgVmlldyBNb2RlbCB3aXRoIG1haW4gY3JlZGVudGlhbHMgZm9yXHJcbiAgICB1c2UgaW4gYSBmb3JtLCB3aXRoIHZhbGlkYXRpb24uXHJcbiAgICBVc2VkIGJ5IExvZ2luIGFuZCBTaWdudXAgYWN0aXZpdGllc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxuXHJcbmZ1bmN0aW9uIEZvcm1DcmVkZW50aWFscygpIHtcclxuXHJcbiAgICB0aGlzLnVzZXJuYW1lID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcbiAgICB0aGlzLnBhc3N3b3JkID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcbiAgICBcclxuICAgIC8vIHZhbGlkYXRlIHVzZXJuYW1lIGFzIGFuIGVtYWlsXHJcbiAgICB2YXIgZW1haWxSZWdleHAgPSAvXlstMC05QS1aYS16ISMkJSYnKisvPT9eX2B7fH1+Ll0rQFstMC05QS1aYS16ISMkJSYnKisvPT9eX2B7fH1+Ll0rJC87XHJcbiAgICB0aGlzLnVzZXJuYW1lLmVycm9yID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcbiAgICB0aGlzLnVzZXJuYW1lLnN1YnNjcmliZShmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgaWYgKHYpIHtcclxuICAgICAgICAgICAgaWYgKGVtYWlsUmVnZXhwLnRlc3QodikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWUuZXJyb3IoJycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZS5lcnJvcignSXMgbm90IGEgdmFsaWQgZW1haWwnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy51c2VybmFtZS5lcnJvcignUmVxdWlyZWQnKTtcclxuICAgICAgICB9XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgXHJcbiAgICAvLyByZXF1aXJlZCBwYXNzd29yZFxyXG4gICAgdGhpcy5wYXNzd29yZC5lcnJvciA9IGtvLm9ic2VydmFibGUoJycpO1xyXG4gICAgdGhpcy5wYXNzd29yZC5zdWJzY3JpYmUoZnVuY3Rpb24odikge1xyXG4gICAgICAgIHZhciBlcnIgPSAnJztcclxuICAgICAgICBpZiAoIXYpXHJcbiAgICAgICAgICAgIGVyciA9ICdSZXF1aXJlZCc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5wYXNzd29yZC5lcnJvcihlcnIpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGb3JtQ3JlZGVudGlhbHM7XHJcbiIsIi8qKiBOYXZBY3Rpb24gdmlldyBtb2RlbC5cclxuICAgIEl0IGFsbG93cyBzZXQtdXAgcGVyIGFjdGl2aXR5IGZvciB0aGUgQXBwTmF2IGFjdGlvbiBidXR0b24uXHJcbioqL1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuLi9tb2RlbHMvTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIE5hdkFjdGlvbih2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgbGluazogJycsXHJcbiAgICAgICAgaWNvbjogJycsXHJcbiAgICAgICAgdGV4dDogJycsXHJcbiAgICAgICAgLy8gJ1Rlc3QnIGlzIHRoZSBoZWFkZXIgdGl0bGUgYnV0IHBsYWNlZCBpbiB0aGUgYnV0dG9uL2FjdGlvblxyXG4gICAgICAgIGlzVGl0bGU6IGZhbHNlLFxyXG4gICAgICAgIC8vICdMaW5rJyBpcyB0aGUgZWxlbWVudCBJRCBvZiBhIG1vZGFsIChzdGFydHMgd2l0aCBhICMpXHJcbiAgICAgICAgaXNNb2RhbDogZmFsc2UsXHJcbiAgICAgICAgLy8gJ0xpbmsnIGlzIGEgU2hlbGwgY29tbWFuZCwgbGlrZSAnZ29CYWNrIDInXHJcbiAgICAgICAgaXNTaGVsbDogZmFsc2UsXHJcbiAgICAgICAgLy8gU2V0IGlmIHRoZSBlbGVtZW50IGlzIGEgbWVudSBidXR0b24sIGluIHRoYXQgY2FzZSAnbGluaydcclxuICAgICAgICAvLyB3aWxsIGJlIHRoZSBJRCBvZiB0aGUgbWVudSAoY29udGFpbmVkIGluIHRoZSBwYWdlOyB3aXRob3V0IHRoZSBoYXNoKSwgdXNpbmdcclxuICAgICAgICAvLyB0aGUgdGV4dCBhbmQgaWNvbiBidXQgc3BlY2lhbCBtZWFuaW5nIGZvciB0aGUgdGV4dCB2YWx1ZSAnbWVudSdcclxuICAgICAgICAvLyBvbiBpY29uIHByb3BlcnR5IHRoYXQgd2lsbCB1c2UgdGhlIHN0YW5kYXJkIG1lbnUgaWNvbi5cclxuICAgICAgICBpc01lbnU6IGZhbHNlXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE5hdkFjdGlvbjtcclxuXHJcbi8vIFNldCBvZiB2aWV3IHV0aWxpdGllcyB0byBnZXQgdGhlIGxpbmsgZm9yIHRoZSBleHBlY3RlZCBodG1sIGF0dHJpYnV0ZXNcclxuXHJcbk5hdkFjdGlvbi5wcm90b3R5cGUuZ2V0SHJlZiA9IGZ1bmN0aW9uIGdldEhyZWYoKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgICh0aGlzLmlzTWVudSgpIHx8IHRoaXMuaXNNb2RhbCgpIHx8IHRoaXMuaXNTaGVsbCgpKSA/XHJcbiAgICAgICAgJyMnIDpcclxuICAgICAgICB0aGlzLmxpbmsoKVxyXG4gICAgKTtcclxufTtcclxuXHJcbk5hdkFjdGlvbi5wcm90b3R5cGUuZ2V0TW9kYWxUYXJnZXQgPSBmdW5jdGlvbiBnZXRNb2RhbFRhcmdldCgpIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgKHRoaXMuaXNNZW51KCkgfHwgIXRoaXMuaXNNb2RhbCgpIHx8IHRoaXMuaXNTaGVsbCgpKSA/XHJcbiAgICAgICAgJycgOlxyXG4gICAgICAgIHRoaXMubGluaygpXHJcbiAgICApO1xyXG59O1xyXG5cclxuTmF2QWN0aW9uLnByb3RvdHlwZS5nZXRTaGVsbENvbW1hbmQgPSBmdW5jdGlvbiBnZXRTaGVsbENvbW1hbmQoKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgICh0aGlzLmlzTWVudSgpIHx8ICF0aGlzLmlzU2hlbGwoKSkgP1xyXG4gICAgICAgICcnIDpcclxuICAgICAgICB0aGlzLmxpbmsoKVxyXG4gICAgKTtcclxufTtcclxuXHJcbk5hdkFjdGlvbi5wcm90b3R5cGUuZ2V0TWVudUlEID0gZnVuY3Rpb24gZ2V0TWVudUlEKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgICAoIXRoaXMuaXNNZW51KCkpID9cclxuICAgICAgICAnJyA6XHJcbiAgICAgICAgdGhpcy5saW5rKClcclxuICAgICk7XHJcbn07XHJcblxyXG5OYXZBY3Rpb24ucHJvdG90eXBlLmdldE1lbnVMaW5rID0gZnVuY3Rpb24gZ2V0TWVudUxpbmsoKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgICghdGhpcy5pc01lbnUoKSkgP1xyXG4gICAgICAgICcnIDpcclxuICAgICAgICAnIycgKyB0aGlzLmxpbmsoKVxyXG4gICAgKTtcclxufTtcclxuXHJcbi8qKiBTdGF0aWMsIHNoYXJlZCBhY3Rpb25zICoqL1xyXG5OYXZBY3Rpb24uZ29Ib21lID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnLycsXHJcbiAgICBpY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1ob21lJ1xyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5nb0JhY2sgPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICdnb0JhY2snLFxyXG4gICAgaWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tYXJyb3ctbGVmdCcsXHJcbiAgICBpc1NoZWxsOiB0cnVlXHJcbn0pO1xyXG5cclxuLy8gVE9ETyBUTyBSRU1PVkUsIEV4YW1wbGUgb2YgbW9kYWxcclxuTmF2QWN0aW9uLm5ld0l0ZW0gPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICcjbmV3SXRlbScsXHJcbiAgICBpY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgIGlzTW9kYWw6IHRydWVcclxufSk7XHJcblxyXG5OYXZBY3Rpb24ubWVudUluID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnbWVudUluJyxcclxuICAgIGljb246ICdtZW51JyxcclxuICAgIGlzTWVudTogdHJ1ZVxyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5tZW51T3V0ID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnbWVudU91dCcsXHJcbiAgICBpY29uOiAnbWVudScsXHJcbiAgICBpc01lbnU6IHRydWVcclxufSk7XHJcblxyXG5OYXZBY3Rpb24ubWVudU5ld0l0ZW0gPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICdtZW51TmV3SXRlbScsXHJcbiAgICBpY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgIGlzTWVudTogdHJ1ZVxyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5nb0hlbHBJbmRleCA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgbGluazogJyNoZWxwSW5kZXgnLFxyXG4gICAgdGV4dDogJ2hlbHAnLFxyXG4gICAgaXNNb2RhbDogdHJ1ZVxyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5nb0xvZ2luID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnL2xvZ2luJyxcclxuICAgIHRleHQ6ICdsb2ctaW4nXHJcbn0pO1xyXG5cclxuTmF2QWN0aW9uLmdvTG9nb3V0ID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnL2xvZ291dCcsXHJcbiAgICB0ZXh0OiAnbG9nLW91dCdcclxufSk7XHJcblxyXG5OYXZBY3Rpb24uZ29TaWdudXAgPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICcvc2lnbnVwJyxcclxuICAgIHRleHQ6ICdzaWduLXVwJ1xyXG59KTtcclxuIiwiLyoqIE5hdkJhciB2aWV3IG1vZGVsLlxyXG4gICAgSXQgYWxsb3dzIGN1c3RvbWl6ZSB0aGUgTmF2QmFyIHBlciBhY3Rpdml0eS5cclxuKiovXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4uL21vZGVscy9Nb2RlbCcpLFxyXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi9OYXZBY3Rpb24nKTtcclxuXHJcbmZ1bmN0aW9uIE5hdkJhcih2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgLy8gVGl0bGUgc2hvd2VkIGluIHRoZSBjZW50ZXJcclxuICAgICAgICAvLyBXaGVuIHRoZSB0aXRsZSBpcyAnbnVsbCcsIHRoZSBhcHAgbG9nbyBpcyBzaG93ZWQgaW4gcGxhY2UsXHJcbiAgICAgICAgLy8gb24gZW1wdHkgdGV4dCwgdGhlIGVtcHR5IHRleHQgaXMgc2hvd2VkIGFuZCBubyBsb2dvLlxyXG4gICAgICAgIHRpdGxlOiAnJyxcclxuICAgICAgICAvLyBOYXZBY3Rpb24gaW5zdGFuY2U6XHJcbiAgICAgICAgbGVmdEFjdGlvbjogbnVsbCxcclxuICAgICAgICAvLyBOYXZBY3Rpb24gaW5zdGFuY2U6XHJcbiAgICAgICAgcmlnaHRBY3Rpb246IG51bGxcclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTmF2QmFyO1xyXG4iXX0=
;