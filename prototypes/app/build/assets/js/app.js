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

var Activity = require('../components/Activity');

var A = Activity.extends(function AccountActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    
    this.navBar = Activity.createSectionNavBar('Account');
});

exports.init = A.init;

},{"../components/Activity":44}],3:[function(require,module,exports){
/** Calendar activity **/
'use strict';

var $ = require('jquery'),
    moment = require('moment'),
    ko = require('knockout');
require('../components/DatePicker');

var Activity = require('../components/Activity');

var A = Activity.extends(function AppointmentActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.Freelancer;    
    this.menuItem = 'calendar';
    
    // Create a specific backAction that shows current date
    // and return to calendar in current date.
    // Later some more changes are applied, with viewmodel ready
    var backAction = new Activity.NavAction({
        link: 'calendar/', // Preserve last slash, for later use
        icon: Activity.NavAction.goBack.icon(),
        isTitle: true,
        text: 'Calendar'
    });
    this.navBar = new Activity.NavBar({
        title: '',
        leftAction: backAction,
        rightAction: Activity.NavAction.goHelpIndex
    });
    
    this.$appointmentView = this.$activity.find('#calendarAppointmentView');
    this.$chooseNew = $('#calendarChooseNew');
    
    this.initAppointment();
    this.viewModel = this.appointmentsDataView;
    
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
                this.app.shell.history.replaceState(null, null, 'appointment/' + aptId);
            else
                this.app.shell.history.pushState(null, null, 'appointment/' + aptId);
        }
        
        // Trigger a layout update, required by the full-height feature
        $(window).trigger('layoutUpdate');
    }.bind(this));
});

exports.init = A.init;

A.prototype.show = function show(options) {
    /* jshint maxcomplexity:10 */

    Activity.prototype.show.call(this, options);
    
    var apt;
    if (this.requestData.appointment) {
        apt = this.requestData.appointment;
    } else {
    // Get ID
        var aptId = options && options.route && options.route.segments[0];
        aptId = parseInt(aptId, 10);
        apt = aptId || 0;
    }
    this.showAppointment(apt);
    
    // If there are options (there  not on startup or
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

A.prototype.showAppointment = function showAppointment(apt) {

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

A.prototype.initAppointment = function initAppointment() {
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
    }
};

},{"../components/Activity":44,"../components/DatePicker":45,"../models/Appointment":49,"../testdata/calendarAppointments":71,"knockout":false,"moment":false}],4:[function(require,module,exports){
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
    this.registerHandler({
        target: this.$activity,
        event: 'click',
        selector: 'textarea',
        handler: function() {
            $(this).select();
        }
    });
    
    this.registerHandler({
        target: this.app.model.marketplaceProfile,
        event: 'error',
        handler: function(err) {
            if (err && err.task === 'save') return;
            var msg = 'Error loading data to build the Button.';
            this.app.modals.showError({
                title: msg,
                error: err && err.task && err.error || err
            });
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    // Keep data updated:
    this.app.model.marketplaceProfile.sync();
    
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

},{"../components/Activity":44,"knockout":false}],5:[function(require,module,exports){
/**
    bookingConfirmation activity
    
    TODO: To replaced by a modal
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
    moment = require('moment'),
    ko = require('knockout'),
    CalendarSlot = require('../models/CalendarSlot');

require('../components/DatePicker');

var Activity = require('../components/Activity');

var A = Activity.extends(function CalendarActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSectionNavBar('Calendar');

    /* Getting elements */
    this.$datepicker = this.$activity.find('#calendarDatePicker');
    this.$dailyView = this.$activity.find('#calendarDailyView');
    this.$dateHeader = this.$activity.find('#calendarDateHeader');
    this.$dateTitle = this.$dateHeader.children('.CalendarDateHeader-date');
    this.$chooseNew = $('#calendarChooseNew');
    
    /* Init components */
    this.$datepicker.show().datepicker();

    // Testing data
    this.viewModel.slotsData(require('../testdata/calendarSlots').calendar);
    
    /* Event handlers */
    // Changes on currentDate
    this.registerHandler({
        target: this.viewModel.currentDate,
        handler: function(date) {
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
                    this.app.shell.history.pushState(null, null, 'calendar/' + isoDate);

                    // DONE
                    return;
                }
            }

            // Something fail, bad date or not date at all
            // Set the current 
            this.viewModel.currentDate(new Date());

        }.bind(this)
    });

    // Swipe date on gesture
    this.registerHandler({
        target: this.$dailyView,
        event: 'swipeleft swiperight',
        handler: function(e) {
            e.preventDefault();

            var dir = e.type === 'swipeleft' ? 'next' : 'prev';

            // Hack to solve the freezy-swipe and tap-after bug on JQM:
            $(document).trigger('touchend');
            // Change date
            this.$datepicker.datepicker('moveValue', dir, 'date');

        }.bind(this)
    });

    // Changing date with buttons:
    this.registerHandler({
        target: this.$dateHeader,
        event: 'tap',
        selector: '.CalendarDateHeader-switch',
        handler: function(e) {
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
        }.bind(this)
    });

    // Showing datepicker when pressing the title
    this.registerHandler({
        target: this.$dateTitle,
        event: 'tap',
        handler: function(e) {
            this.$datepicker.toggleClass('is-visible');
            e.preventDefault();
            e.stopPropagation();
        }.bind(this)
    });

    // Updating view date when picked another one
    this.registerHandler({
        target: this.$datepicker,
        event: 'changeDate',
        handler: function(e) {
            if (e.viewMode === 'days') {
                this.viewModel.currentDate(e.date);
            }
        }.bind(this)
    });

    // Set date to match datepicker for first update
    this.viewModel.currentDate(this.$datepicker.datepicker('getValue'));
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    if (options && options.route && options.route.segments) {
        var sdate = options.route.segments[0],
            mdate = moment(sdate),
            date = mdate.isValid() ? mdate.toDate() : null;

        if (date)
            this.viewModel.currentDate(date);
    }
};

var Time = require('../utils/Time');
function createFreeSlot(options) {
    
    var start = options.start || new Time(options.date, 0, 0, 0),
        end = options.end || new Time(options.date, 0, 0, 0);

    return new CalendarSlot({
        startTime: start,
        endTime: end,

        subject: 'Free',
        description: null,
        link: '#!appointment/0',

        actionIcon: 'glyphicon glyphicon-plus',
        actionText: null,

        classNames: 'ListView-item--tag-success'
    });
}

function convertEventToSlot(event, booking) {

    return new CalendarSlot({
        startTime: event.startTime(),
        endTime: event.endTime(),
        
        subject: event.summary(), // FullName
        description: event.description(), // 'Deep Tissue Massage Long Name',
        link: '#!appointment/' + event.calendarEventID(),

        actionIcon: booking === null ? 'glyphicon glyphicon-chevron-right' : null,
        actionText: booking === null ? null : (booking && booking.bookingRequest && booking.bookingRequest.pricingEstimate.totalPrice || '$0.00'),

        classNames: null
    });
}

function ViewModel(app) {

    this.slotsData = ko.observable({});
    this.currentDate = ko.observable(new Date());
    var fullDayFree = [createFreeSlot({ date: this.currentDate() })];

    this.slots = ko.observableArray(fullDayFree);
    
    this.isLoading = ko.observable(false);
    
    // Update current slots on date change
    var previousDate = this.currentDate().toISOString();
    this.currentDate.subscribe(function (date) {
        
        // IMPORTANT: The date object may be reused and mutated between calls
        // (mostly because the widget I think), so is better to create
        // a clone and avoid getting race-conditions in the data downloading.
        date = new Date(Date.parse(date.toISOString()));

        // Avoid duplicated notification, un-changed date
        if (date.toISOString() === previousDate) {
            return;
        }
        previousDate = date.toISOString();
        
        var mdate = moment(date),
            sdate = mdate.format('YYYYMMDD');

        this.isLoading(true);
        
        Promise.all([
            app.model.bookings.getBookingsByDate(date),
            app.model.calendarEvents.getEventsByDate(date)
        ]).then(function(group) {
            
            // IMPORTANT: First, we need to check that we are
            // in the same date still, because several loadings
            // can happen at a time (changing quickly from date to date
            // without wait for finish), avoiding a race-condition
            // that create flickering effects or replace the date events
            // by the events from other date, because it tooks more an changed.
            // TODO: still this has the minor bug of losing the isLoading
            // if a previous triggered load still didn't finished; its minor
            // because is very rare that happens, moving this stuff
            // to a special appModel for mixed bookings and events with 
            // per date cache that includes a view object with isLoading will
            // fix it and reduce this complexity.
            if (date.toISOString() !== this.currentDate().toISOString()) {
                // Race condition, not the same!! out:
                return;
            }
            
            var events = group[1],
                bookings = group[0];
            
            if (events && events().length) {
                this.slots(events().map(function(event) {
                    
                    var booking = null;
                    bookings().some(function(searchBooking) {
                        var found = searchBooking.confirmedDateID() === event.calendarEventID();
                        if (found) {
                            booking = searchBooking;
                            return true;
                        }
                    });
                    
                    return convertEventToSlot(event, booking);
                }));

                this.isLoading(false);
            }
            else {
                this.slots(fullDayFree);
                this.isLoading(false);
            }

        }.bind(this))
        .catch(function(err) {
            
            // Show free on error
            this.slots(fullDayFree);
            this.isLoading(false);
            
            var msg = 'Error loading calendar events.';
            app.modals.showError({
                title: msg,
                error: err && err.error || err
            });
            
        }.bind(this));
        
        /*
        var slots = this.slotsData();
        if (slots.hasOwnProperty(sdate)) {
            this.slots(slots[sdate]);
        } else {
            this.slots(slots['default']);
        }*/
    }.bind(this));
}

},{"../components/Activity":44,"../components/DatePicker":45,"../models/CalendarSlot":53,"../testdata/calendarSlots":72,"../utils/Time":84,"knockout":false,"moment":false}],7:[function(require,module,exports){
/**
    CalendarSyncing activity
**/
'use strict';

var Activity = require('../components/Activity'),
    $ = require('jquery'),
    ko = require('knockout'),
    moment = require('moment');

var A = Activity.extends(function CalendarSyncingActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.Freelancer;

    this.navBar = Activity.createSubsectionNavBar('Scheduling');
    
    // Adding auto-select behavior to the export URL
    this.registerHandler({
        target: this.$activity.find('#calendarSync-icalExportUrl'),
        event: 'click',
        handler: function() {
            $(this).select();
        }
    });
    
    this.registerHandler({
        target: this.app.model.calendarSyncing,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Error saving calendar syncing settings.' : 'Error loading calendar syncing settings.';
            this.app.modals.showError({
                title: msg,
                error: err && err.task && err.error || err
            });
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    // Keep data updated:
    this.app.model.calendarSyncing.sync();
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

},{"../components/Activity":44,"knockout":false,"moment":false}],8:[function(require,module,exports){
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

},{"../components/Activity":44,"../models/Client":55,"knockout":false}],9:[function(require,module,exports){
/**
    clients activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    Activity = require('../components/Activity');

var A = Activity.extends(function ClientsActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.Freelancer;
    this.viewModel = new ViewModel(this.app);    
    this.navBar = Activity.createSubsectionNavBar('Clients');
    
    // Getting elements
    this.$index = this.$activity.find('#clientsIndex');
    this.$listView = this.$activity.find('#clientsListView');
    
    // TestingData
    this.viewModel.clients(require('../testdata/clients').clients);
    
    // Handler to update header based on a mode change:
    this.registerHandler({
        target: this.viewModel.isSelectionMode,
        handler: function (itIs) {
            this.viewModel.headerText(itIs ? 'Select a client' : '');
        }.bind(this)
    });

    // Handler to go back with the selected client when 
    // there is one selected and requestData is for
    // 'select mode'
    this.registerHandler({
        target: this.viewModel.selectedClient,
        handler: function (theSelectedClient) {
            // We have a request and
            // it requested to select a client,
            // and a selected client
            if (this.requestData &&
                this.requestData.selectClient === true &&
                theSelectedClient) {

                // Pass the selected client in the info
                this.requestData.selectedClient = theSelectedClient;
                // And go back
                this.app.shell.goBack(this.requestData);
                // Last, clear requestData
                this.requestData = null;
            }
        }.bind(this)
    });
    
    // TODO: check errors from loading, will be RemoteModel??
    /*this.registerHandler({
        target: this.app.model.clients,
        event: 'error',
        handler: function(err) {
            if (err.task === 'save') return;
            var msg = 'Error loading clients.';
            this.app.modals.showError({
                title: msg,
                error: err && err.task && err.error || err
            });
        }.bind(this)
    });*/
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    // On every show, search gets reseted
    this.viewModel.searchText('');
    
    // Set selection:
    this.viewModel.isSelectionMode(state.selectClient === true);
    
    // Keep data updated:
    // TODO: as RemoteModel?
    //this.app.model.clients.sync();
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

},{"../components/Activity":44,"../testdata/clients":73,"knockout":false}],10:[function(require,module,exports){
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
    this.registerHandler({
        target: clients,
        handler: function() {
            this.viewModel.clientsCount(clients().length);
        }.bind(this)
    });
});

exports.init = A.init;

function ViewModel() {
    
    this.clientsCount = ko.observable();
}

},{"../components/Activity":44,"../testdata/clients":73,"knockout":false}],11:[function(require,module,exports){
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

},{"../components/Activity":44,"knockout":false}],12:[function(require,module,exports){
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
    this.registerHandler({
        target: this.viewModel.profile.onboardingStep,
        handler: function (step) {
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
        }.bind(this)
    });
    //this.viewModel.profile.onboardingStep.subscribe();
    
    this.registerHandler({
        target: this.app.model.userProfile,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Error saving contact data.' : 'Error loading contact data.';
            this.app.modals.showError({
                title: msg,
                error: err && err.task && err.error || err
            });
        }.bind(this)
    });
    
    this.registerHandler({
        target: this.app.model.homeAddress,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Error saving address details.' : 'Error loading address details.';
            this.app.modals.showError({
                title: msg,
                error: err && err.task && err.error || err
            });
        }.bind(this)
    });
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

},{"../components/Activity":44,"knockout":false}],13:[function(require,module,exports){
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

},{"../components/Activity":44,"../models/MailFolder":59,"../testdata/messages":75,"knockout":false}],14:[function(require,module,exports){
/**
    datetimePicker activity
**/
'use strict';

var $ = require('jquery'),
    moment = require('moment'),
    ko = require('knockout'),
    Time = require('../utils/Time');
require('../components/DatePicker');

var Activity = require('../components/Activity');

var A = Activity.extends(function DatetimePickerActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('');
    
    // Getting elements
    this.$datePicker = this.$activity.find('#datetimePickerDatePicker');
    this.$timePicker = this.$activity.find('#datetimePickerTimePicker');
    
    /* Init components */
    this.$datePicker.show().datepicker();
    
    this.registerHandler({
        target: this.$datePicker,
        event: 'changeDate',
        handler: function(e) {
            if (e.viewMode === 'days') {
                this.viewModel.selectedDate(e.date);
            }
        }.bind(this)
    });
    
    this.registerHandler({
        target: this.viewModel.selectedDate,
        handler: function(date) {
            this.bindDateData(date);
        }.bind(this)
    });
    
    // Handler to go back with the selected date-time when
    // that selection is done (could be to null)
    this.registerHandler({
        target: this.viewModel.selectedDatetime,
        handler: function (datetime) {
            // We have a request
            if (this.requestData) {
                // Pass the selected datetime in the info
                this.requestData.selectedDatetime = this.viewModel.selectedDatetime();
                // And go back
                this.app.shell.goBack(this.requestData);
                // Last, clear requestData
                this.requestData = null;
            }
        }.bind(this)
    });
    
    // TestingData
    this.viewModel.slotsData = require('../testdata/timeSlots').timeSlots;
    
    this.bindDateData(new Date());
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);

    // TODO: text from outside or depending on state?
    this.viewModel.headerText('Select a start time');
};

A.prototype.bindDateData = function bindDateData(date) {

    var sdate = moment(date).format('YYYY-MM-DD');
    var slotsData = this.viewModel.slotsData;

    if (slotsData.hasOwnProperty(sdate)) {
        this.viewModel.slots(slotsData[sdate]);
    } else {
        this.viewModel.slots(slotsData['default']);
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

},{"../components/Activity":44,"../components/DatePicker":45,"../testdata/timeSlots":77,"../utils/Time":84,"knockout":false,"moment":false}],15:[function(require,module,exports){
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

},{"../components/Activity":44,"../models/Model":62,"knockout":false}],16:[function(require,module,exports){
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

},{"../components/Activity":44}],17:[function(require,module,exports){
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

},{"../components/Activity":44,"knockout":false}],18:[function(require,module,exports){
/**
    Home activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout');

var Activity = require('../components/Activity');

var A = Activity.extends(function HomeActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    this.viewModel = new ViewModel(this.app);
    // null for logo
    this.navBar = Activity.createSectionNavBar(null);
    
    // Getting elements
    this.$nextBooking = this.$activity.find('#homeNextBooking');
    this.$upcomingBookings = this.$activity.find('#homeUpcomingBookings');
    this.$inbox = this.$activity.find('#homeInbox');
    this.$performance = this.$activity.find('#homePerformance');
    this.$getMore = this.$activity.find('#homeGetMore');
    
    // TestingData
    setSomeTestingData(this.viewModel);
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    
    var v = this.viewModel,
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

function setSomeTestingData(viewModel) {
    
    viewModel.inbox.messages(require('../testdata/messages').messages);
    
    viewModel.performance.earnings.currentAmount(2400);
    viewModel.performance.earnings.nextAmount(6200.54);
    viewModel.performance.timeBooked.percent(0.93);
    
    viewModel.getMore.model.updateWith({
        availability: true,
        payments: true,
        profile: true,
        coop: true
    });
}

},{"../components/Activity":44,"../models/GetMore":56,"../models/MailFolder":59,"../models/PerformanceSummary":63,"../models/UpcomingBookingsSummary":69,"../testdata/messages":75,"../utils/Time":84,"knockout":false}],19:[function(require,module,exports){
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

},{"../components/Activity":44,"../models/MailFolder":59,"../testdata/messages":75,"knockout":false}],20:[function(require,module,exports){
/**
    Index activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function IndexActivity() {
    
    Activity.apply(this, arguments);

    // Any user can access this
    this.accessLevel = null;
    
    // null for logo
    this.navBar = Activity.createSectionNavBar(null);
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    // It checks if the user is logged so then 
    // their 'logged index' is the dashboard not this
    // page that is focused on anonymous users
    if (!this.app.model.user().isAnonymous()) {
        this.app.goDashboard();
    }
};

},{"../components/Activity":44}],21:[function(require,module,exports){
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

},{"../components/Activity":44}],22:[function(require,module,exports){
/**
    LearnMore activity
**/
'use strict';
var ko = require('knockout'),
    Activity = require('../components/Activity');

var A = Activity.extends(function LearnMoreActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    this.viewModel = new ViewModel(this.app);
    // null for logo
    this.navBar = Activity.createSectionNavBar(null);
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    
    if (options && options.route &&
        options.route.segments &&
        options.route.segments.length) {
        this.viewModel.profile(options.route.segments[0]);
    }
};

function ViewModel() {
    this.profile = ko.observable('customer');
}

},{"../components/Activity":44,"knockout":false}],23:[function(require,module,exports){
/**
    LocationEdition activity
**/
'use strict';
var ko = require('knockout'),
    Location = require('../models/Location'),
    Activity = require('../components/Activity');

var A = Activity.extends(function LocationEditionActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.Freelancer;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Locations');
});

exports.init = A.init;

A.prototype.show = function show(options) {
    //jshint maxcomplexity:10
    
    Activity.prototype.show.call(this, options);
    
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
            this.viewModel.location(location);

            this.viewModel.header('Edit Location');
        } else {
            this.viewModel.location(null);
            this.viewModel.header('Unknow location or was deleted');
        }
    }
    else {
        // New location
        this.viewModel.location(new Location());
        
        switch (options.create) {
            case 'serviceRadius':
                this.viewModel.location().isServiceRadius(true);
                this.viewModel.header('Add a service radius');
                break;
            case 'serviceLocation':
                this.viewModel.location().isServiceLocation(true);
                this.viewModel.header('Add a service location');
                break;
            default:
                this.viewModel.location().isServiceRadius(true);
                this.viewModel.location().isServiceLocation(true);
                this.viewModel.header('Add a location');
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
},{"../components/Activity":44,"../models/Location":58,"knockout":false}],24:[function(require,module,exports){
/**
    locations activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    Activity = require('../components/Activity');

var A = Activity.extends(function LocationsActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.Freelancer;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSubsectionNavBar('Scheduling');
    
    // Getting elements
    this.$listView = this.$activity.find('#locationsListView');
    
    // Handler to update header based on a mode change:
    this.registerHandler({
        target: this.viewModel.isSelectionMode,
        handler: function (itIs) {
            this.viewModel.headerText(itIs ? 'Select or add a service location' : 'Locations');

            // Update navbar too
            // TODO: Can be other than 'scheduling', like marketplace profile or the job-title?
            this.navBar.leftAction().text(itIs ? 'Booking' : 'Scheduling');
            // Title must be empty
            this.navBar.title('');

            // TODO Replaced by a progress bar on booking creation
            // TODO Or leftAction().text(..) on booking edition (return to booking)
            // or coming from Jobtitle/schedule (return to schedule/job title)?

        }.bind(this)
    });
    
    // Handler to go back with the selected location when 
    // selection mode goes off and requestInfo is for
    // 'select mode'
    this.registerHandler({
        target: this.viewModel.isSelectionMode,
        handler: function (itIs) {
            // We have a request and
            // it requested to select a location
            // and selection mode goes off
            if (this.requestInfo &&
                this.requestInfo.selectLocation === true &&
                itIs === false) {

                // Pass the selected client in the info
                this.requestInfo.selectedLocation = this.viewModel.selectedLocation();
                // And go back
                this.app.shell.goBack(this.requestInfo);
                // Last, clear requestInfo
                this.requestInfo = null;
            }
        }.bind(this)
    });
    
    // TestingData
    this.viewModel.locations(require('../testdata/locations').locations);
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    
    if (options.selectLocation === true) {
        this.viewModel.isSelectionMode(true);
        // preset:
        this.viewModel.selectedLocation(options.selectedLocation);
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

},{"../components/Activity":44,"../testdata/locations":74,"knockout":false}],25:[function(require,module,exports){
/**
    Login activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    User = require('../models/User'),
    Activity = require('../components/Activity');

var A = Activity.extends(function LoginActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.Anonymous;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSectionNavBar('Log in');
    
    // Perform log-in request when is requested by the form:
    this.registerHandler({
        target: this.viewModel.isLogingIn,
        handler: function(v) {
            if (v === true) {

                // Perform loging

                // Notify state:
                var $btn = this.$activity.find('[type="submit"]');
                $btn.button('loading');

                // Clear previous error so makes clear we
                // are attempting
                this.viewModel.loginError('');

                var ended = function ended() {
                    this.viewModel.isLogingIn(false);
                    $btn.button('reset');
                }.bind(this);

                // After clean-up error (to force some view updates),
                // validate and abort on error
                // Manually checking error on each field
                if (this.viewModel.username.error() ||
                    this.viewModel.password.error()) {
                    this.viewModel.loginError('Review your data');
                    ended();
                    return;
                }

                this.app.model.login(
                    this.viewModel.username(),
                    this.viewModel.password()
                ).then(function(loginData) {

                    this.viewModel.loginError('');
                    ended();

                    // Remove form data
                    this.viewModel.username('');
                    this.viewModel.password('');

                    this.app.goDashboard();

                }.bind(this)).catch(function(err) {

                    var msg = err && err.responseJSON && err.responseJSON.errorMessage ||
                        err && err.statusText ||
                        'Invalid username or password';

                    this.viewModel.loginError(msg);
                    ended();
                }.bind(this));
            }
        }.bind(this)
    });
    
    // Focus first bad field on error
    this.registerHandler({
        target: this.viewModel.loginError,
        handler: function(err) {
            // Login is easy since we mark both unique fields
            // as error on loginError (its a general form error)
            var input = this.$activity.find(':input').get(0);
            if (err)
                input.focus();
            else
                input.blur();
        }.bind(this)
    });
});

exports.init = A.init;

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

},{"../components/Activity":44,"../models/User":70,"../viewmodels/FormCredentials":116,"knockout":false}],26:[function(require,module,exports){
/**
    Logout activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function LogoutActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    this.app.model.logout().then(function() {
        // Anonymous user again
        var newAnon = this.app.model.user().constructor.newAnonymous();
        this.app.model.user().model.updateWith(newAnon);

        // Go index
        this.app.shell.go('/');
        
    }.bind(this));
};

},{"../components/Activity":44}],27:[function(require,module,exports){
/**
    OnboardingComplete activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function OnboardingCompleteActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    
    this.navBar = Activity.createSectionNavBar(null);
});

exports.init = A.init;

},{"../components/Activity":44}],28:[function(require,module,exports){
/**
    OnboardingHome activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function OnboardingHomeActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    
    // null for Logo
    this.navBar = Activity.createSectionNavBar(null);
});

exports.init = A.init;

},{"../components/Activity":44}],29:[function(require,module,exports){
/**
    Onboarding Positions activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    Activity = require('../components/Activity');

var A = Activity.extends(function OnboardingPositionsActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.Freelancer;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSectionNavBar('Job Titles');

    // TestingData
    setSomeTestingData(this.viewModel);
});

exports.init = A.init;

function ViewModel() {

    // Full list of positions
    this.positions = ko.observableArray([]);
}

var Position = require('../models/Position');
// UserPosition model
function setSomeTestingData(viewModel) {
    
    viewModel.positions.push(new Position({
        positionSingular: 'Massage Therapist'
    }));
    viewModel.positions.push(new Position({
        positionSingular: 'Housekeeper'
    }));
}
},{"../components/Activity":44,"../models/Position":64,"knockout":false}],30:[function(require,module,exports){
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

},{"../components/Activity":44}],31:[function(require,module,exports){
/**
    PrivacySettings activity
**/
'use strict';

var Activity = require('../components/Activity');
var ko = require('knockout');
var moment = require('moment');

var A = Activity.extends(function PrivacySettingsActivity() {
    
    Activity.apply(this, arguments);
    
    this.viewModel = new ViewModel(this.app);
    this.accessLevel = this.app.UserType.LoggedUser;

    this.navBar = Activity.createSubsectionNavBar('Account');
    
    this.registerHandler({
        target: this.app.model.privacySettings,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Error saving privacy settings.' : 'Error loading privacy settings.';
            this.app.modals.showError({
                title: msg,
                error: err && err.task && err.error || err
            });
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
        // Keep data updated:
    this.app.model.privacySettings.sync();
    // Discard any previous unsaved edit
    this.viewModel.discard();
};

function ViewModel(app) {

    var privacySettings = app.model.privacySettings;

    var settingsVersion = privacySettings.newVersion();
    settingsVersion.isObsolete.subscribe(function(itIs) {
        if (itIs) {
            // new version from server while editing
            // FUTURE: warn about a new remote version asking
            // confirmation to load them or discard and overwrite them;
            // the same is need on save(), and on server response
            // with a 509:Conflict status (its body must contain the
            // server version).
            // Right now, just overwrite current changes with
            // remote ones:
            settingsVersion.pull({ evenIfNewer: true });
        }
    });
    
    // Actual data for the form:
    this.settings = settingsVersion.version;

    this.isLocked = privacySettings.isLocked;

    this.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ? 
                'loading...' : 
                this.isSaving() ? 
                    'saving...' : 
                    'Save'
        );
    }, privacySettings);
    
    this.discard = function discard() {
        settingsVersion.pull({ evenIfNewer: true });
    }.bind(this);

    this.save = function save() {
        // Force to save, even if there was remote updates
        settingsVersion.push({ evenIfObsolete: true });
    }.bind(this);
}

},{"../components/Activity":44,"knockout":false,"moment":false}],32:[function(require,module,exports){
/**
    Scheduling activity
**/
'use strict';

var ko = require('knockout'),
    Activity = require('../components/Activity');

var A = Activity.extends(function SchedulingActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSectionNavBar('Scheduling');
});

exports.init = A.init;

function ViewModel() {

}

},{"../components/Activity":44,"knockout":false}],33:[function(require,module,exports){
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
    
    this.registerHandler({
        target: this.app.model.schedulingPreferences,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Error saving scheduling preferences.' : 'Error loading scheduling preferences.';
            this.app.modals.showError({
                title: msg,
                error: err && err.task && err.error || err
            });
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
        // Keep data updated:
    this.app.model.schedulingPreferences.sync();
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

},{"../components/Activity":44,"knockout":false,"moment":false}],34:[function(require,module,exports){
/**
    services activity
**/
'use strict';

var Activity = require('../components/Activity');
var $ = require('jquery'),
    ko = require('knockout');
    
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
    this.registerHandler({
        target: this.viewModel.isSelectionMode,
        handler: function (itIs) {
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
                this.requestData = {};
            }
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(options) {

    Activity.prototype.show.call(this, options);
    
    // Get jobtitleID for the request
    var route = this.requestData && this.requestData.route;
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

},{"../components/Activity":44,"../testdata/services":76,"knockout":false}],35:[function(require,module,exports){
/**
    Signup activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    Activity = require('../components/Activity');

var A = Activity.extends(function SignupActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.Anonymous;
    this.viewModel = new ViewModel(this.app);
    // null for Logo
    this.navBar = Activity.createSectionNavBar(null);
    
    // Perform sign-up request when is requested by the form:
    this.registerHandler({
        target: this.viewModel.isSigningUp,
        handler: function(v) {
            if (v === true) {

                // Perform signup

                // Notify state:
                var $btn = this.$activity.find('[type="submit"]');
                $btn.button('loading');

                // Clear previous error so makes clear we
                // are attempting
                this.viewModel.signupError('');

                var ended = function ended() {
                    this.viewModel.isSigningUp(false);
                    $btn.button('reset');
                }.bind(this);

                // After clean-up error (to force some view updates),
                // validate and abort on error
                // Manually checking error on each field
                if (this.viewModel.username.error() ||
                    this.viewModel.password.error()) {
                    this.viewModel.signupError('Review your data');
                    ended();
                    return;
                }

                this.app.model.signup(
                    this.viewModel.username(),
                    this.viewModel.password(),
                    this.viewModel.profile()
                ).then(function(signupData) {

                    this.viewModel.signupError('');
                    ended();

                    // Remove form data
                    this.viewModel.username('');
                    this.viewModel.password('');

                    this.app.goDashboard();

                }.bind(this)).catch(function(err) {

                    var msg = err && err.responseJSON && err.responseJSON.errorMessage ||
                        err && err.statusText ||
                        'Invalid username or password';

                    this.viewModel.signupError(msg);
                    ended();
                }.bind(this));
            }
        }.bind(this)
    });
    
    // Focus first bad field on error
    this.registerHandler({
        target: this.viewModel.signupError,
        handler: function(err) {
            // Signup is easy since we mark both unique fields
            // as error on signupError (its a general form error)
            var input = this.$activity.find(':input').get(0);
            if (err)
                input.focus();
            else
                input.blur();
        }
    });
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    
    if (options && options.route &&
        options.route.segments &&
        options.route.segments.length) {
        this.viewModel.profile(options.route.segments[0]);
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

},{"../components/Activity":44,"../viewmodels/FormCredentials":116,"knockout":false}],36:[function(require,module,exports){
/**
    textEditor activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    EventEmitter = require('events').EventEmitter,
    Activity = require('../components/Activity');

var A = Activity.extends(function TextEditorActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    this.viewModel = new ViewModel(this.app);
    // Title is empty ever, since we are in 'go back' mode all the time here
    this.navBar = Activity.createSubsectionNavBar('');
    
    // Getting elements
    this.$textarea = this.$activity.find('textarea');
    this.textarea = this.$textarea.get(0);
    
    // Handler for the 'saved' event so the activity
    // returns back to the requester activity giving it
    // the new text
    this.registerHandler({
        target: this.viewModel,
        event: 'saved',
        handler: function() {
            if (this.requestInfo) {
                // Update the info with the new text
                this.requestInfo.text = this.viewModel.text();
            }

            // and pass it back
            this.app.shell.goBack(this.requestInfo);
        }.bind(this)
    });
    
    // Handler the cancel event
    this.registerHandler({
        target: this.viewModel,
        event: 'cancel',
        handler: function() {
            // return, nothing changed
            this.app.shell.goBack();
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    
    // Set navigation title or nothing
    this.navBar.leftAction().text(options.title || '');
    
    // Field header
    this.viewModel.headerText(options.header);
    this.viewModel.text(options.text);
    if (options.rowsNumber)
        this.viewModel.rowsNumber(options.rowsNumber);
        
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

},{"../components/Activity":44,"events":false,"knockout":false}],37:[function(require,module,exports){
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
    
    this.registerHandler({
        target: this.app.model.simplifiedWeeklySchedule,
        event: 'error',
        handler: function(err) {
            var msg = err.task === 'save' ? 'Error saving your weekly schedule.' : 'Error loading your weekly schedule.';
            this.app.modals.showError({
                title: msg,
                error: err && err.task && err.error || err
            });
        }.bind(this)
    });
});

exports.init = A.init;

A.prototype.show = function show(state) {
    Activity.prototype.show.call(this, state);
    
    // Keep data updated:
    this.app.model.simplifiedWeeklySchedule.sync();
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

},{"../components/Activity":44,"knockout":false,"moment":false}],38:[function(require,module,exports){
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

},{"./utils/jsPropertiesTools":93,"knockout":false}],39:[function(require,module,exports){
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

},{"./viewmodels/NavAction":117,"./viewmodels/NavBar":118,"knockout":false}],40:[function(require,module,exports){
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
    'ownerInfo': require('./activities/ownerInfo'),
    'privacySettings': require('./activities/privacySettings')
};

},{"./activities/account":2,"./activities/appointment":3,"./activities/bookMeButton":4,"./activities/bookingConfirmation":5,"./activities/calendar":6,"./activities/calendarSyncing":7,"./activities/clientEdition":8,"./activities/clients":9,"./activities/cms":10,"./activities/contactForm":11,"./activities/contactInfo":12,"./activities/conversation":13,"./activities/datetimePicker":14,"./activities/faqs":15,"./activities/feedback":16,"./activities/feedbackForm":17,"./activities/home":18,"./activities/inbox":19,"./activities/index":20,"./activities/jobtitles":21,"./activities/learnMore":22,"./activities/locationEdition":23,"./activities/locations":24,"./activities/login":25,"./activities/logout":26,"./activities/onboardingComplete":27,"./activities/onboardingHome":28,"./activities/onboardingPositions":29,"./activities/ownerInfo":30,"./activities/privacySettings":31,"./activities/scheduling":32,"./activities/schedulingPreferences":33,"./activities/services":34,"./activities/signup":35,"./activities/textEditor":36,"./activities/weeklySchedule":37}],41:[function(require,module,exports){
'use strict';

/** Global dependencies **/
var $ = require('jquery');
require('jquery-mobile');
require('./utils/jquery.multiline');
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
    
    modals: require('./app.modals'),
    
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
    // When an activity is hidden
    app.shell.on(app.shell.events.closed, function($act) {
        
        // Connect the 'activities' controllers to their views
        var actName = $act.data('activity');
        var activity = app.getActivity(actName);
        // Trigger the 'hide' logic of the activity controller:
        if (activity.hide)
            activity.hide();
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

},{"./app-components":38,"./app-navbar":39,"./app.activities":40,"./app.modals":42,"./app.shell":43,"./components/SmartNavBar":46,"./locales/en-US-LC":47,"./utils/Function.prototype._delayed":79,"./utils/Function.prototype._inherits":80,"./utils/accessControl":85,"./utils/bootknockBindingHelpers":87,"./utils/bootstrapSwitchBinding":88,"./utils/jquery.multiline":92,"./viewmodels/AppModel":110,"./viewmodels/NavAction":117,"./viewmodels/NavBar":118,"es6-promise":false,"knockout":false}],42:[function(require,module,exports){
/**
    Access to use global App Modals
**/
'use strict';

var $ = require('jquery');

/**
    Generates a text message, with newlines if needed, describing the error
    object passed.
    @param err:any As a string, is returned 'as is'; as falsy, it return a generic
    message for 'unknow error'; as object, it investigate what type of error is to
    provide the more meaninful result, with fallback to JSON.stringify prefixed
    with 'Technical details:'.
    Objects recognized:
    - XHR/jQuery for JSON responses: just objects with responseJSON property, is
      used as the 'err' object and passed to the other object tests.
    - Object with 'errorMessage' (server-side formatted error).
    - Object with 'message' property, like the standard Error class and Exception objects.
    - Object with 'name' property, like the standard Exception objects. The name, if any,
      is set as prefix for the 'message' property value.
    - Object with 'errors' property. Each element in the array or object own keys
      is appended to the errorMessage or message separated by newline.
**/
exports.getErrorMessageFrom = function getErrorMessageFrom(err) {
    /*jshint maxcomplexity:10*/

    if (!err) {
        return 'Unknow error';
    }
    else if (typeof(err) === 'string') {
        return err;
    }
    else {
        // If is a XHR object, use its response as the error.
        err = err.responseJSON || err;

        var msg = err.name && (err.name + ': ') || '';
        msg += err.errorMessage || err.message || '';

        if (err.errors) {
            if (Array.isArray(err.errors)) {
                msg += '\n' + err.errors.join('\n');
            }
            else {
                Object.keys(err.errors).forEach(function(key) {
                    msg += '\n' + err.errors[key].join('\n');
                });
            }
        }
        else {
            msg += '\nTechnical details: ' + JSON.stringify(err);
        }

        return msg;
    }
};

exports.showError = function showErrorModal(options) {
    
    var modal = $('#errorModal'),
        header = modal.find('#errorModal-label'),
        body = modal.find('#errorModal-body');
    
    options = options || {};
    
    var msg = body.data('default-text');

    if (options.error)
        msg = exports.getErrorMessageFrom(options.error);
    else if (options.message)
        msg = options.message;

    body.multiline(msg);

    header.text(options.title || header.data('default-text'));
    
    modal.modal('show');
};

},{}],43:[function(require,module,exports){
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

},{"./utils/shell/hashbangHistory":98,"./utils/shell/index":99}],44:[function(require,module,exports){
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
    
    // Enable registered handlers
    // Validation of each settings object is performed
    // on registered, avoided here.
    if (this._handlers &&
        this._handlersAreConnected !== true) {
        this._handlers.forEach(function(settings) {
            // Check if is an observable subscription
            if (!settings.event && settings.target.subscribe) {
                var subscription = settings.target.subscribe(settings.handler);
                // Observables has not a 'unsubscribe' function,
                // they return an object that must be 'disposed'.
                // Saving that with settings to allow 'unsubscribe' later.
                settings._subscription = subscription;
                
                // Inmediate execution: if current observable value is different
                // than previous one, execute the handler:
                // (this avoid that a changed state get omitted because happened
                // when subscription was off; it means a first time execution too).
                // NOTE: 'undefined' value on observable may cause this to fall
                if (settings._latestSubscribedValue !== settings.target()) {
                    settings.handler.call(settings.target, settings.target());
                }
            }
            else if (settings.selector) {
                settings.target.on(settings.event, settings.selector, settings.handler);
            }
            else {
                settings.target.on(settings.event, settings.handler);
            }
        });
        // To avoid double connections:
        // NOTE: may happen that 'show' gets called several times without a 'hide'
        // in between, because 'show' acts as a refresher right now even from segment
        // changes from the same activity.
        this._handlersAreConnected = true;
    }
};

/**
    Perform tasks to stop anything running or stop handlers from listening.
    Must be executed every time the activity is hidden/removed 
    from the current view.
**/
Activity.prototype.hide = function hide() {
    
    // Disable registered handlers
    if (this._handlers) {
        this._handlers.forEach(function(settings) {
            // Check if is an observable subscription
            if (settings._subscription) {
                settings._subscription.dispose();
                // Save latest observable value to make a comparision
                // next time is enabled to ensure is executed if there was
                // a change while disabled:
                settings._latestSubscribedValue = settings.target();
            }
            else if (settings.target.off) {
                if (settings.selector)
                    settings.target.off(settings.event, settings.selector, settings.handler);
                else
                    settings.target.off(settings.event, settings.handler);
            }
            else {
                settings.target.removeListener(settings.event, settings.handler);
            }
        });
        
        this._handlersAreConnected = false;
    }
};

/**
    Register a handler that acts on an event or subscription notification,
    that will be enabled on Activity.show and disabled on Activity.hide.

    @param settings:object {
        target: jQuery, EventEmitter, Knockout.observable. Required
        event: string. Event name (can have namespaces, several events allowed). Its required except when the target is an observable, there must
            be omitted.
        handler: Function. Required,
        selector: string. Optional. For jQuery events only, passed as the
            selector for delegated handlers.
    }
**/
Activity.prototype.registerHandler = function registerHandler(settings) {
    /*jshint maxcomplexity:8 */
    
    if (!settings)
        throw new Error('Register require a settings object');
    
    if (!settings.target || (!settings.target.on && !settings.target.subscribe))
        throw new Error('Target is null or not a jQuery, EventEmmiter or Observable object');
    
    if (typeof(settings.handler) !== 'function') {
        throw new Error('Handler must be a function.');
    }
    
    if (!settings.event && !settings.target.subscribe) {
        throw new Error('Event is null; it\'s required for non observable objects');
    }

    this._handlers = this._handlers || [];

    this._handlers.push(settings);
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

},{"../utils/Function.prototype._inherits":80,"../viewmodels/NavAction":117,"../viewmodels/NavBar":118,"knockout":false}],45:[function(require,module,exports){
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

},{}],46:[function(require,module,exports){
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

},{}],47:[function(require,module,exports){
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

},{"moment":false}],48:[function(require,module,exports){
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

},{"./Model":62,"knockout":false}],49:[function(require,module,exports){
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

},{"./Client":55,"./Location":58,"./Model":62,"./Service":67,"knockout":false,"moment":false}],50:[function(require,module,exports){
/** Booking model.

    Describes a booking with related BookingRequest 
    and PricingEstimate objects.
 **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model');

function Booking(values) {
    
    Model(this);

    this.model.defProperties({
        bookingID: 0,
        bookingRequestID: 0,
        confirmedDateID: null,
        totalPricePaidByCustomer: null,
        totalServiceFeesPaidByCustomer: null,
        totalPaidToFreelancer: null,
        totalServiceFeesPaidByFreelancer: null,
        bookingStatusID: null,
        pricingAdjustmentApplied: false,
        
        reviewedByFreelancer: false,
        reviewedByCustomer: false,
        
        createdDate: null,
        updatedDate: null,
        
        bookingRequest: null // BookingRequest
    }, values);
    
    this.bookingRequest(new BookingRequest(values && values.bookingRequest));
}

module.exports = Booking;

function BookingRequest(values) {
    
    Model(this);

    this.model.defProperties({
        bookingRequestID: 0,
        bookingTypeID: 0,
        customerUserID: 0,
        freelancerUserID: 0,
        jobTitleID: 0,
        pricingEstimateID: 0,
        bookingRequestStatusID: 0,
        
        specialRequests: null,
        preferredDateID: null,
        alternativeDate1ID: null,
        alternativeDate2ID: null,
        addressID: null,
        cancellationPolicyID: null,
        instantBooking: false,
        
        createdDate: null,
        updatedDate: null,
        
        pricingEstimate: null // PricingEstimate
    }, values);
    
    this.pricingEstimate(new PricingEstimate(values && values.pricingEstimate));
}

function PricingEstimate(values) {
    
    Model(this);

    this.model.defProperties({
        pricingEstimateID: 0,
        pricingEstimateRevision: 0,
        serviceDurationHours: null,
        firstSessionDurationHours: null,
        subtotalPrice: null,
        feePrice: null,
        totalPrice: null,
        pFeePrice: null,
        subtotalRefunded: null,
        feeRefunded: null,
        totalRefunded: null,
        dateRefunded: null,
        
        createdDate: null,
        updatedDate: null,
        
        details: []
    }, values);
    
    if (Array.isArray(values.details)) {
        this.details(values.details.map(function(detail) {
            return new PricingEstimateDetail(detail);
        }));
    }
}

function PricingEstimateDetail(values) {
    
    Model(this);

    this.model.defProperties({
        freelancerPricingID: 0,
        freelancerPricingDataInput: null,
        customerPricingDataInput: null,
        hourlyPrice: null,
        subtotalPrice: null,
        feePrice: null,
        totalPrice: null,
        serviceDurationHours: null,
        firstSessionDurationHours: null,
        
        createdDate: null,
        updatedDate: null
    }, values);
}

},{"./Model":62,"knockout":false}],51:[function(require,module,exports){
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

},{"./Model":62,"knockout":false,"moment":false}],52:[function(require,module,exports){
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
},{"./Model":62,"knockout":false,"moment":false}],53:[function(require,module,exports){
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

},{"./Client":55,"./Model":62,"knockout":false}],54:[function(require,module,exports){
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

},{"./Model":62,"knockout":false}],55:[function(require,module,exports){
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

},{"./Model":62,"knockout":false}],56:[function(require,module,exports){
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

},{"./ListViewItem":57,"./Model":62,"knockout":false}],57:[function(require,module,exports){
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

},{"./Model":62,"knockout":false,"moment":false}],58:[function(require,module,exports){
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

},{"./Model":62,"knockout":false}],59:[function(require,module,exports){
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

},{"./Model":62,"knockout":false,"lodash":false,"moment":false}],60:[function(require,module,exports){
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

},{"./Model":62,"knockout":false}],61:[function(require,module,exports){
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

},{"./Model":62,"knockout":false,"moment":false}],62:[function(require,module,exports){
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

},{"knockout":false,"knockout.mapping":false}],63:[function(require,module,exports){
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

},{"./ListViewItem":57,"./Model":62,"knockout":false,"moment":false,"numeral":1}],64:[function(require,module,exports){
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

},{"./Model":62,"knockout":false}],65:[function(require,module,exports){
/**
    PrivacySettings model
**/
'use strict';

var Model = require('./Model');

function PrivacySettings(values) {
    
    Model(this);
    
    this.model.defProperties({
        userID: 0,
        smsBookingCommunication: false,
        phoneBookingCommunication: false,
        loconomicsCommunityCommunication: false,
        loconomicsDbmCampaigns: false,
        profileSeoPermission: false,
        loconomicsMarketingCampaigns: false,
        coBrandedPartnerPermissions: false,
        createdDate: null,
        updatedDate: null
    }, values);
    
    this.model.defID(['userID']);
}

module.exports = PrivacySettings;

},{"./Model":62}],66:[function(require,module,exports){
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

},{"./Model":62,"knockout":false}],67:[function(require,module,exports){
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

},{"./Model":62,"knockout":false}],68:[function(require,module,exports){
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
},{"./Model":62,"knockout":false,"moment":false}],69:[function(require,module,exports){
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

},{"./BookingSummary":51,"./Model":62,"knockout":false}],70:[function(require,module,exports){
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

},{"./Model":62,"knockout":false}],71:[function(require,module,exports){
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

},{"../models/Appointment":49,"./locations":74,"./services":76,"knockout":false,"moment":false}],72:[function(require,module,exports){
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

},{"../models/CalendarSlot":53,"../utils/Time":84,"moment":false}],73:[function(require,module,exports){
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

},{"../models/Client":55}],74:[function(require,module,exports){
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

},{"../models/Location":58}],75:[function(require,module,exports){
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

},{"../models/Message":61,"../utils/Time":84,"moment":false}],76:[function(require,module,exports){
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

},{"../models/Service":67}],77:[function(require,module,exports){
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

},{"../utils/Time":84,"moment":false}],78:[function(require,module,exports){
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

},{"moment":false}],79:[function(require,module,exports){
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

},{}],80:[function(require,module,exports){
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

},{}],81:[function(require,module,exports){
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
    var result = false,
        rollback = null;
    
    if (options.evenIfNewer || !this.isNewer()) {
        // Update version with the original data,
        // creating first a rollback function.
        rollback = createRollbackFunction(this.version);
        // Ever deepCopy, since only properties and fields from models
        // are copied and that must avoid circular references
        // The method updateWith takes care to set the same dataTimestamp:        
        this.version.model.updateWith(this.original, true);
        // Done
        result = true;
    }

    this.emit('pull', result, rollback);
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
    var result = false,
        rollback = null;

    if (options.evenIfObsolete || !this.isObsolete()) {
        // Update original, creating first a rollback function.
        rollback = createRollbackFunction(this.original);
        // Ever deepCopy, since only properties and fields from models
        // are copied and that must avoid circular references
        // The method updateWith takes care to set the same dataTimestamp.
        this.original.model.updateWith(this.version, true);
        // Done
        result = true;
    }

    this.emit('push', result, rollback);
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

/**
    Utility that create a function able to 
    perform a data rollback on execution, useful
    to pass on the events to allow react upon changes
    or external synchronization failures.
**/
function createRollbackFunction(modelInstance) {
    // Previous function creation, get NOW the information to
    // be backed for later.
    var backedData = modelInstance.model.toPlainObject(true),
        backedTimestamp = modelInstance.model.dataTimestamp();

    // Create the function that *may* get executed later, after
    // changes were done in the modelInstance.
    return function rollback() {
        // Set the backed data
        modelInstance.model.updateWith(backedData);
        // And the timestamp
        modelInstance.model.dataTimestamp(backedTimestamp);
    };
}

},{"events":false,"knockout":false}],82:[function(require,module,exports){
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
        v.on('push', function(success, rollback) {
            if (success) {
                this.save()
                .then(function() {
                    // Update the version data with the new one
                    // from the remote, that may include remote computed
                    // values:
                    v.pull({ evenIfNewer: true });
                })
                .catch(function() {
                    // To catch the error is important 
                    // to avoid 'unknow error's from being
                    // logged on the console.
                    // The error can be read by listening the 'error' event.
                    
                    // Performs a rollback of the original model
                    rollback();
                    // The version data keeps untouched, user may want to retry
                    // or made changes on its un-saved data.
                });
            }
        }.bind(this));

        return v;
    };
    
    this.fetch = options.fetch || function fetch() { throw new Error('Not implemented'); };
    this.push = options.push || function push() { throw new Error('Not implementd'); };

    var loadFromRemote = function loadFromRemote() {
        return this.fetch()
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
    }.bind(this);
    
    this.load = function load() {
        if (this.cache.mustRevalidate()) {
            
            if (firstTimeLoad)
                this.isLoading(true);
            else
                this.isSyncing(true);
            
            var promise = null;
            
            // If local storage is set for this, load first
            // from local, then follow with syncing from remote
            if (firstTimeLoad &&
                this.localStorageName) {

                promise = localforage.getItem(this.localStorageName)
                .then(function(localData) {
                    if (localData) {
                        this.data.model.updateWith(localData, true);
                        
                        // Load done:
                        this.isLoading(false);
                        this.isSyncing(false);
                        
                        // Local load done, do a background
                        // remote load
                        loadFromRemote();
                        // just don't wait, return current
                        // data
                        return this.data;
                    }
                    else {
                        // When no data, perform a remote
                        // load and wait for it:
                        return loadFromRemote();
                    }
                }.bind(this));
            }
            else {
                // Perform the remote load:
                promise = loadFromRemote();
            }
            
            // First time, blocking load:
            // it returns when the load returns
            if (firstTimeLoad) {
                firstTimeLoad = false;
                // Returns the promise and will wait for the first load:
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

},{"../utils/CacheControl":78,"../utils/ModelVersion":81,"events":false,"knockout":false,"localforage":false}],83:[function(require,module,exports){
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

},{}],84:[function(require,module,exports){
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

},{}],85:[function(require,module,exports){
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

},{"../models/User":70}],86:[function(require,module,exports){
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
},{}],87:[function(require,module,exports){
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

},{}],88:[function(require,module,exports){
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

},{}],89:[function(require,module,exports){
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

},{}],90:[function(require,module,exports){
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

},{}],91:[function(require,module,exports){
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

},{}],92:[function(require,module,exports){
// jQuery plugin to set multiline text in an element,
// by replacing \n by <br/> with careful to avoid XSS attacks.
// http://stackoverflow.com/a/13082028
'use strict';

var $ = require('jquery');

$.fn.multiline = function(text) {
    this.text(text);
    this.html(this.html().replace(/\n/g,'<br/>'));
    return this;
};

},{}],93:[function(require,module,exports){
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

},{}],94:[function(require,module,exports){
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

},{"../escapeSelector":90}],95:[function(require,module,exports){
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

},{"./dependencies":97}],96:[function(require,module,exports){
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

},{"../escapeRegExp":89,"./sanitizeUrl":102}],97:[function(require,module,exports){
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

},{}],98:[function(require,module,exports){
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

},{"../getUrlQuery":91,"./sanitizeUrl":102}],99:[function(require,module,exports){
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

},{"./DomItemsManager":94,"./Shell":95,"./absolutizeUrl":96,"./dependencies":97,"./loader":100,"./parseUrl":101,"events":false}],100:[function(require,module,exports){
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

},{}],101:[function(require,module,exports){
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
},{"../escapeRegExp":89,"../getUrlQuery":91}],102:[function(require,module,exports){
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
},{}],103:[function(require,module,exports){
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

},{"localforage":false}],104:[function(require,module,exports){
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
},{"../models/CalendarEvent":52,"../utils/apiHelper":86}],105:[function(require,module,exports){
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

},{}],106:[function(require,module,exports){
/** Bookings
**/
'use strict';

var Booking = require('../models/Booking'),
    apiHelper = require('../utils/apiHelper'),
    moment = require('moment'),
    ko = require('knockout');

exports.create = function create(appModel) {

    var api = {
        remote: {
            rest: appModel.rest,
            getBookings: function(filters) {
                return appModel.rest.get('bookings', filters)
                .then(function(rawItems) {
                    return rawItems && rawItems.map(function(rawItem) {
                        return new Booking(rawItem);
                    });
                });
            }
        }
    };
/*
    apiHelper.defineCrudApiForRest({
        extendedObject: api.remote,
        Model: Booking,
        modelName: 'Booking',
        modelListName: 'Bookings',
        modelUrl: 'bookings',
        idPropertyName: 'bookingID'
    });*/

    var cacheByDate = {};

    api.getBookingsByDate = function getBookingsByDate(date) {
        var dateKey = moment(date).format('YYYYMMDD');
        if (cacheByDate.hasOwnProperty(dateKey)) {
            
            return Promise.resolve(cacheByDate[dateKey]);

            // TODO lazy load, on background, for synchronization
        }
        else {
            // TODO check localforage copy first

            // Remote loading data
            return api.remote.getBookings({
                start: date,
                end: moment(date).add(1, 'days').toDate()
            }).then(function(bookings) {
                // TODO localforage copy of [dateKey]=bookings

                // Put in cache (they are already model instances)
                var arr = ko.observableArray(bookings);
                cacheByDate[dateKey] = arr;
                // Return the observable array
                return arr;
            });
        }
    };
    
    return api;
};

},{"../models/Booking":50,"../utils/apiHelper":86,"knockout":false,"moment":false}],107:[function(require,module,exports){
/** Events
**/
'use strict';

var CalendarEvent = require('../models/CalendarEvent'),
    apiHelper = require('../utils/apiHelper'),
    moment = require('moment'),
    ko = require('knockout');

exports.create = function create(appModel) {

    var api = {
        remote: {
            rest: appModel.rest,
            getCalendarEvents: function(filters) {
                return appModel.rest.get('events', filters)
                .then(function(rawItems) {
                    return rawItems && rawItems.map(function(rawItem) {
                        return new CalendarEvent(rawItem);
                    });
                });
            }
        }
    };

    /*apiHelper.defineCrudApiForRest({
        extendedObject: api.remote,
        Model: CalendarEvent,
        modelName: 'CalendarEvent',
        modelListName: 'CalendarEvents',
        modelUrl: 'events',
        idPropertyName: 'calendarEventID'
    });*/

    var cacheByDate = {};

    api.getEventsByDate = function getEventsByDate(date) {
        var dateKey = moment(date).format('YYYYMMDD');
        if (cacheByDate.hasOwnProperty(dateKey)) {
            
            return Promise.resolve(cacheByDate[dateKey]);

            // TODO lazy load, on background, for synchronization
        }
        else {
            // TODO check localforage copy first

            // Remote loading data
            return api.remote.getCalendarEvents({
                start: date,
                end: moment(date).add(1, 'days').toDate()
            }).then(function(events) {
                // TODO localforage copy of [dateKey]=bookings

                // Put in cache (they are already model instances)
                var arr = ko.observableArray(events);
                cacheByDate[dateKey] = arr;
                // Return the observable array
                return arr;
            });
        }
    };
    
    return api;
};

},{"../models/CalendarEvent":52,"../utils/apiHelper":86,"knockout":false,"moment":false}],108:[function(require,module,exports){
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
        localStorageName: 'calendarSyncing',
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

},{"../models/CalendarSyncing":54,"../utils/RemoteModel":82,"knockout":false}],109:[function(require,module,exports){
/** Home Address
**/
'use strict';

var Address = require('../models/Address');

var RemoteModel = require('../utils/RemoteModel');

exports.create = function create(appModel) {
    return new RemoteModel({
        data: new Address(),
        ttl: { minutes: 1 },
        localStorageName: 'homeAddress',
        fetch: function fetch() {
            return appModel.rest.get('addresses/home');
        },
        push: function push() {
            return appModel.rest.put('addresses/home', this.data.model.toPlainObject());
        }
    });
};

},{"../models/Address":48,"../utils/RemoteModel":82}],110:[function(require,module,exports){
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
    this.privacySettings = require('./AppModel.privacySettings').create(this);
    this.bookings = require('./AppModel.bookings').create(this);
    this.calendarEvents = require('./AppModel.calendarEvents').create(this);
}

require('./AppModel-account').plugIn(AppModel);

/**
    Load credentials from the local storage, without error if there is nothing
    saved. If load profile data too, performing an tryLogin if no local data.
**/
AppModel.prototype.loadLocalCredentials = function loadLocalCredentials() {
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

/** Initialize and wait for anything up **/
AppModel.prototype.init = function init() {
    
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
    
    // First, get any saved local config
    // NOTE: for now, this is optional, to get a saved siteUrl rather than the
    // default one, if any.
    return localforage.getItem('config')
    .then(function(config) {
        // Optional config
        config = config || {};
        
        if (config.siteUrl) {
            // Update the html URL
            $('html').attr('data-site-url', config.siteUrl);
        }
        else {
            config.siteUrl = $('html').attr('data-site-url');
        }
        
        this.rest = new Rest(config.siteUrl + '/api/v1/en-US/');
        
        // Setup Rest authentication
        this.rest.onAuthorizationRequired = function(retry) {

            this.tryLogin()
            .then(function() {
                // Logged! Just retry
                retry();
            });
        }.bind(this);
        
        // Initialize: check the user has login data and needed
        // cached data, return its promise
        return this.loadLocalCredentials();
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

},{"../models/Model":62,"../models/User":70,"../utils/Rest":83,"./AppModel-account":103,"./AppModel-events":104,"./AppModel-userJobProfile":105,"./AppModel.bookings":106,"./AppModel.calendarEvents":107,"./AppModel.calendarSyncing":108,"./AppModel.homeAddress":109,"./AppModel.marketplaceProfile":111,"./AppModel.privacySettings":112,"./AppModel.schedulingPreferences":113,"./AppModel.simplifiedWeeklySchedule":114,"./AppModel.userProfile":115,"knockout":false,"localforage":false}],111:[function(require,module,exports){
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

},{"../models/MarketplaceProfile":60,"../utils/RemoteModel":82}],112:[function(require,module,exports){
/** Privacy Settings
**/
'use strict';

var PrivacySettings = require('../models/PrivacySettings');

var RemoteModel = require('../utils/RemoteModel');

exports.create = function create(appModel) {
    return new RemoteModel({
        data: new PrivacySettings(),
        ttl: { minutes: 1 },
        localStorageName: 'privacySettings',
        fetch: function fetch() {
            return appModel.rest.get('privacy-settings');
        },
        push: function push() {
            return appModel.rest.put('privacy-settings', this.data.model.toPlainObject());
        }
    });
};

},{"../models/PrivacySettings":65,"../utils/RemoteModel":82}],113:[function(require,module,exports){
/**
**/
'use strict';

var SchedulingPreferences = require('../models/SchedulingPreferences');

var RemoteModel = require('../utils/RemoteModel');

exports.create = function create(appModel) {
    return new RemoteModel({
        data: new SchedulingPreferences(),
        ttl: { minutes: 1 },
        localStorageName: 'schedulingPreferences',
        fetch: function fetch() {
            return appModel.rest.get('scheduling-preferences');
        },
        push: function push() {
            return appModel.rest.put('scheduling-preferences', this.data.model.toPlainObject());
        }
    });
};

},{"../models/SchedulingPreferences":66,"../utils/RemoteModel":82}],114:[function(require,module,exports){
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
        localStorageName: 'weeklySchedule',
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

},{"../models/SimplifiedWeeklySchedule":68,"../utils/RemoteModel":82,"moment":false}],115:[function(require,module,exports){
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

},{"../models/User":70,"../utils/RemoteModel":82}],116:[function(require,module,exports){
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

},{"knockout":false}],117:[function(require,module,exports){
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

},{"../models/Model":62,"knockout":false}],118:[function(require,module,exports){
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

},{"../models/Model":62,"./NavAction":117,"knockout":false}]},{},[41])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvbm9kZV9tb2R1bGVzL251bWVyYWwvbnVtZXJhbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYWNjb3VudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYXBwb2ludG1lbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2Jvb2tNZUJ1dHRvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYm9va2luZ0NvbmZpcm1hdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY2FsZW5kYXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2NhbGVuZGFyU3luY2luZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY2xpZW50RWRpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY2xpZW50cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY21zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9jb250YWN0Rm9ybS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY29udGFjdEluZm8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2NvbnZlcnNhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvZGF0ZXRpbWVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2ZhcXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2ZlZWRiYWNrLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9mZWVkYmFja0Zvcm0uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2hvbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2luYm94LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9pbmRleC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvam9idGl0bGVzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9sZWFybk1vcmUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2xvY2F0aW9uRWRpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvbG9jYXRpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9sb2dpbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvbG9nb3V0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9vbmJvYXJkaW5nQ29tcGxldGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL29uYm9hcmRpbmdIb21lLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9vbmJvYXJkaW5nUG9zaXRpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9vd25lckluZm8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL3ByaXZhY3lTZXR0aW5ncy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvc2NoZWR1bGluZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvc2NoZWR1bGluZ1ByZWZlcmVuY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9zZXJ2aWNlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvc2lnbnVwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy90ZXh0RWRpdG9yLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy93ZWVrbHlTY2hlZHVsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FwcC1jb21wb25lbnRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYXBwLW5hdmJhci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FwcC5hY3Rpdml0aWVzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYXBwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYXBwLm1vZGFscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FwcC5zaGVsbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2NvbXBvbmVudHMvQWN0aXZpdHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9jb21wb25lbnRzL0RhdGVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9jb21wb25lbnRzL1NtYXJ0TmF2QmFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbG9jYWxlcy9lbi1VUy1MQy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9BZGRyZXNzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0FwcG9pbnRtZW50LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0Jvb2tpbmcuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQm9va2luZ1N1bW1hcnkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQ2FsZW5kYXJFdmVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9DYWxlbmRhclNsb3QuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQ2FsZW5kYXJTeW5jaW5nLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0NsaWVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9HZXRNb3JlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0xpc3RWaWV3SXRlbS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9Mb2NhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9NYWlsRm9sZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL01hcmtldHBsYWNlUHJvZmlsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9NZXNzYWdlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL01vZGVsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1BlcmZvcm1hbmNlU3VtbWFyeS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9Qb3NpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9Qcml2YWN5U2V0dGluZ3MuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvU2NoZWR1bGluZ1ByZWZlcmVuY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1NlcnZpY2UuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvU2ltcGxpZmllZFdlZWtseVNjaGVkdWxlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1VwY29taW5nQm9va2luZ3NTdW1tYXJ5LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1VzZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9jYWxlbmRhckFwcG9pbnRtZW50cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3Rlc3RkYXRhL2NhbGVuZGFyU2xvdHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9jbGllbnRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdGVzdGRhdGEvbG9jYXRpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdGVzdGRhdGEvbWVzc2FnZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9zZXJ2aWNlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3Rlc3RkYXRhL3RpbWVTbG90cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL0NhY2hlQ29udHJvbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL0Z1bmN0aW9uLnByb3RvdHlwZS5fZGVsYXllZC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL0Z1bmN0aW9uLnByb3RvdHlwZS5faW5oZXJpdHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9Nb2RlbFZlcnNpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9SZW1vdGVNb2RlbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL1Jlc3QuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9UaW1lLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvYWNjZXNzQ29udHJvbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL2FwaUhlbHBlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL2Jvb3Rrbm9ja0JpbmRpbmdIZWxwZXJzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvYm9vdHN0cmFwU3dpdGNoQmluZGluZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL2VzY2FwZVJlZ0V4cC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL2VzY2FwZVNlbGVjdG9yLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvZ2V0VXJsUXVlcnkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9qcXVlcnkubXVsdGlsaW5lLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvanNQcm9wZXJ0aWVzVG9vbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9Eb21JdGVtc01hbmFnZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9TaGVsbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL2Fic29sdXRpemVVcmwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9kZXBlbmRlbmNpZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9oYXNoYmFuZ0hpc3RvcnkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9pbmRleC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL2xvYWRlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL3BhcnNlVXJsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvc2hlbGwvc2FuaXRpemVVcmwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLWFjY291bnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLWV2ZW50cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwtdXNlckpvYlByb2ZpbGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLmJvb2tpbmdzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9BcHBNb2RlbC5jYWxlbmRhckV2ZW50cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwuY2FsZW5kYXJTeW5jaW5nLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9BcHBNb2RlbC5ob21lQWRkcmVzcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLm1hcmtldHBsYWNlUHJvZmlsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwucHJpdmFjeVNldHRpbmdzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9BcHBNb2RlbC5zY2hlZHVsaW5nUHJlZmVyZW5jZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLnNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwudXNlclByb2ZpbGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0Zvcm1DcmVkZW50aWFscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvTmF2QWN0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9OYXZCYXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdnFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25TQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4cEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBudW1lcmFsLmpzXG4gKiB2ZXJzaW9uIDogMS41LjNcbiAqIGF1dGhvciA6IEFkYW0gRHJhcGVyXG4gKiBsaWNlbnNlIDogTUlUXG4gKiBodHRwOi8vYWRhbXdkcmFwZXIuZ2l0aHViLmNvbS9OdW1lcmFsLWpzL1xuICovXG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIENvbnN0YW50c1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIHZhciBudW1lcmFsLFxuICAgICAgICBWRVJTSU9OID0gJzEuNS4zJyxcbiAgICAgICAgLy8gaW50ZXJuYWwgc3RvcmFnZSBmb3IgbGFuZ3VhZ2UgY29uZmlnIGZpbGVzXG4gICAgICAgIGxhbmd1YWdlcyA9IHt9LFxuICAgICAgICBjdXJyZW50TGFuZ3VhZ2UgPSAnZW4nLFxuICAgICAgICB6ZXJvRm9ybWF0ID0gbnVsbCxcbiAgICAgICAgZGVmYXVsdEZvcm1hdCA9ICcwLDAnLFxuICAgICAgICAvLyBjaGVjayBmb3Igbm9kZUpTXG4gICAgICAgIGhhc01vZHVsZSA9ICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cyk7XG5cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgQ29uc3RydWN0b3JzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICAvLyBOdW1lcmFsIHByb3RvdHlwZSBvYmplY3RcbiAgICBmdW5jdGlvbiBOdW1lcmFsIChudW1iZXIpIHtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSBudW1iZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW1wbGVtZW50YXRpb24gb2YgdG9GaXhlZCgpIHRoYXQgdHJlYXRzIGZsb2F0cyBtb3JlIGxpa2UgZGVjaW1hbHNcbiAgICAgKlxuICAgICAqIEZpeGVzIGJpbmFyeSByb3VuZGluZyBpc3N1ZXMgKGVnLiAoMC42MTUpLnRvRml4ZWQoMikgPT09ICcwLjYxJykgdGhhdCBwcmVzZW50XG4gICAgICogcHJvYmxlbXMgZm9yIGFjY291bnRpbmctIGFuZCBmaW5hbmNlLXJlbGF0ZWQgc29mdHdhcmUuXG4gICAgICovXG4gICAgZnVuY3Rpb24gdG9GaXhlZCAodmFsdWUsIHByZWNpc2lvbiwgcm91bmRpbmdGdW5jdGlvbiwgb3B0aW9uYWxzKSB7XG4gICAgICAgIHZhciBwb3dlciA9IE1hdGgucG93KDEwLCBwcmVjaXNpb24pLFxuICAgICAgICAgICAgb3B0aW9uYWxzUmVnRXhwLFxuICAgICAgICAgICAgb3V0cHV0O1xuICAgICAgICAgICAgXG4gICAgICAgIC8vcm91bmRpbmdGdW5jdGlvbiA9IChyb3VuZGluZ0Z1bmN0aW9uICE9PSB1bmRlZmluZWQgPyByb3VuZGluZ0Z1bmN0aW9uIDogTWF0aC5yb3VuZCk7XG4gICAgICAgIC8vIE11bHRpcGx5IHVwIGJ5IHByZWNpc2lvbiwgcm91bmQgYWNjdXJhdGVseSwgdGhlbiBkaXZpZGUgYW5kIHVzZSBuYXRpdmUgdG9GaXhlZCgpOlxuICAgICAgICBvdXRwdXQgPSAocm91bmRpbmdGdW5jdGlvbih2YWx1ZSAqIHBvd2VyKSAvIHBvd2VyKS50b0ZpeGVkKHByZWNpc2lvbik7XG5cbiAgICAgICAgaWYgKG9wdGlvbmFscykge1xuICAgICAgICAgICAgb3B0aW9uYWxzUmVnRXhwID0gbmV3IFJlZ0V4cCgnMHsxLCcgKyBvcHRpb25hbHMgKyAnfSQnKTtcbiAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKG9wdGlvbmFsc1JlZ0V4cCwgJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEZvcm1hdHRpbmdcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAvLyBkZXRlcm1pbmUgd2hhdCB0eXBlIG9mIGZvcm1hdHRpbmcgd2UgbmVlZCB0byBkb1xuICAgIGZ1bmN0aW9uIGZvcm1hdE51bWVyYWwgKG4sIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbikge1xuICAgICAgICB2YXIgb3V0cHV0O1xuXG4gICAgICAgIC8vIGZpZ3VyZSBvdXQgd2hhdCBraW5kIG9mIGZvcm1hdCB3ZSBhcmUgZGVhbGluZyB3aXRoXG4gICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignJCcpID4gLTEpIHsgLy8gY3VycmVuY3khISEhIVxuICAgICAgICAgICAgb3V0cHV0ID0gZm9ybWF0Q3VycmVuY3kobiwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgfSBlbHNlIGlmIChmb3JtYXQuaW5kZXhPZignJScpID4gLTEpIHsgLy8gcGVyY2VudGFnZVxuICAgICAgICAgICAgb3V0cHV0ID0gZm9ybWF0UGVyY2VudGFnZShuLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdC5pbmRleE9mKCc6JykgPiAtMSkgeyAvLyB0aW1lXG4gICAgICAgICAgICBvdXRwdXQgPSBmb3JtYXRUaW1lKG4sIGZvcm1hdCk7XG4gICAgICAgIH0gZWxzZSB7IC8vIHBsYWluIG9sJyBudW1iZXJzIG9yIGJ5dGVzXG4gICAgICAgICAgICBvdXRwdXQgPSBmb3JtYXROdW1iZXIobi5fdmFsdWUsIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXR1cm4gc3RyaW5nXG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgLy8gcmV2ZXJ0IHRvIG51bWJlclxuICAgIGZ1bmN0aW9uIHVuZm9ybWF0TnVtZXJhbCAobiwgc3RyaW5nKSB7XG4gICAgICAgIHZhciBzdHJpbmdPcmlnaW5hbCA9IHN0cmluZyxcbiAgICAgICAgICAgIHRob3VzYW5kUmVnRXhwLFxuICAgICAgICAgICAgbWlsbGlvblJlZ0V4cCxcbiAgICAgICAgICAgIGJpbGxpb25SZWdFeHAsXG4gICAgICAgICAgICB0cmlsbGlvblJlZ0V4cCxcbiAgICAgICAgICAgIHN1ZmZpeGVzID0gWydLQicsICdNQicsICdHQicsICdUQicsICdQQicsICdFQicsICdaQicsICdZQiddLFxuICAgICAgICAgICAgYnl0ZXNNdWx0aXBsaWVyID0gZmFsc2UsXG4gICAgICAgICAgICBwb3dlcjtcblxuICAgICAgICBpZiAoc3RyaW5nLmluZGV4T2YoJzonKSA+IC0xKSB7XG4gICAgICAgICAgICBuLl92YWx1ZSA9IHVuZm9ybWF0VGltZShzdHJpbmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHN0cmluZyA9PT0gemVyb0Zvcm1hdCkge1xuICAgICAgICAgICAgICAgIG4uX3ZhbHVlID0gMDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmRlbGltaXRlcnMuZGVjaW1hbCAhPT0gJy4nKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKC9cXC4vZywnJykucmVwbGFjZShsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5kZWxpbWl0ZXJzLmRlY2ltYWwsICcuJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gc2VlIGlmIGFiYnJldmlhdGlvbnMgYXJlIHRoZXJlIHNvIHRoYXQgd2UgY2FuIG11bHRpcGx5IHRvIHRoZSBjb3JyZWN0IG51bWJlclxuICAgICAgICAgICAgICAgIHRob3VzYW5kUmVnRXhwID0gbmV3IFJlZ0V4cCgnW15hLXpBLVpdJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMudGhvdXNhbmQgKyAnKD86XFxcXCl8KFxcXFwnICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgJyk/KD86XFxcXCkpPyk/JCcpO1xuICAgICAgICAgICAgICAgIG1pbGxpb25SZWdFeHAgPSBuZXcgUmVnRXhwKCdbXmEtekEtWl0nICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy5taWxsaW9uICsgJyg/OlxcXFwpfChcXFxcJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCArICcpPyg/OlxcXFwpKT8pPyQnKTtcbiAgICAgICAgICAgICAgICBiaWxsaW9uUmVnRXhwID0gbmV3IFJlZ0V4cCgnW15hLXpBLVpdJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMuYmlsbGlvbiArICcoPzpcXFxcKXwoXFxcXCcgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyAnKT8oPzpcXFxcKSk/KT8kJyk7XG4gICAgICAgICAgICAgICAgdHJpbGxpb25SZWdFeHAgPSBuZXcgUmVnRXhwKCdbXmEtekEtWl0nICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy50cmlsbGlvbiArICcoPzpcXFxcKXwoXFxcXCcgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyAnKT8oPzpcXFxcKSk/KT8kJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBzZWUgaWYgYnl0ZXMgYXJlIHRoZXJlIHNvIHRoYXQgd2UgY2FuIG11bHRpcGx5IHRvIHRoZSBjb3JyZWN0IG51bWJlclxuICAgICAgICAgICAgICAgIGZvciAocG93ZXIgPSAwOyBwb3dlciA8PSBzdWZmaXhlcy5sZW5ndGg7IHBvd2VyKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZXNNdWx0aXBsaWVyID0gKHN0cmluZy5pbmRleE9mKHN1ZmZpeGVzW3Bvd2VyXSkgPiAtMSkgPyBNYXRoLnBvdygxMDI0LCBwb3dlciArIDEpIDogZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGJ5dGVzTXVsdGlwbGllcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBkbyBzb21lIG1hdGggdG8gY3JlYXRlIG91ciBudW1iZXJcbiAgICAgICAgICAgICAgICBuLl92YWx1ZSA9ICgoYnl0ZXNNdWx0aXBsaWVyKSA/IGJ5dGVzTXVsdGlwbGllciA6IDEpICogKChzdHJpbmdPcmlnaW5hbC5tYXRjaCh0aG91c2FuZFJlZ0V4cCkpID8gTWF0aC5wb3coMTAsIDMpIDogMSkgKiAoKHN0cmluZ09yaWdpbmFsLm1hdGNoKG1pbGxpb25SZWdFeHApKSA/IE1hdGgucG93KDEwLCA2KSA6IDEpICogKChzdHJpbmdPcmlnaW5hbC5tYXRjaChiaWxsaW9uUmVnRXhwKSkgPyBNYXRoLnBvdygxMCwgOSkgOiAxKSAqICgoc3RyaW5nT3JpZ2luYWwubWF0Y2godHJpbGxpb25SZWdFeHApKSA/IE1hdGgucG93KDEwLCAxMikgOiAxKSAqICgoc3RyaW5nLmluZGV4T2YoJyUnKSA+IC0xKSA/IDAuMDEgOiAxKSAqICgoKHN0cmluZy5zcGxpdCgnLScpLmxlbmd0aCArIE1hdGgubWluKHN0cmluZy5zcGxpdCgnKCcpLmxlbmd0aC0xLCBzdHJpbmcuc3BsaXQoJyknKS5sZW5ndGgtMSkpICUgMik/IDE6IC0xKSAqIE51bWJlcihzdHJpbmcucmVwbGFjZSgvW14wLTlcXC5dKy9nLCAnJykpO1xuXG4gICAgICAgICAgICAgICAgLy8gcm91bmQgaWYgd2UgYXJlIHRhbGtpbmcgYWJvdXQgYnl0ZXNcbiAgICAgICAgICAgICAgICBuLl92YWx1ZSA9IChieXRlc011bHRpcGxpZXIpID8gTWF0aC5jZWlsKG4uX3ZhbHVlKSA6IG4uX3ZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuLl92YWx1ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXRDdXJyZW5jeSAobiwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgIHZhciBzeW1ib2xJbmRleCA9IGZvcm1hdC5pbmRleE9mKCckJyksXG4gICAgICAgICAgICBvcGVuUGFyZW5JbmRleCA9IGZvcm1hdC5pbmRleE9mKCcoJyksXG4gICAgICAgICAgICBtaW51c1NpZ25JbmRleCA9IGZvcm1hdC5pbmRleE9mKCctJyksXG4gICAgICAgICAgICBzcGFjZSA9ICcnLFxuICAgICAgICAgICAgc3BsaWNlSW5kZXgsXG4gICAgICAgICAgICBvdXRwdXQ7XG5cbiAgICAgICAgLy8gY2hlY2sgZm9yIHNwYWNlIGJlZm9yZSBvciBhZnRlciBjdXJyZW5jeVxuICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyAkJykgPiAtMSkge1xuICAgICAgICAgICAgc3BhY2UgPSAnICc7XG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnICQnLCAnJyk7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0LmluZGV4T2YoJyQgJykgPiAtMSkge1xuICAgICAgICAgICAgc3BhY2UgPSAnICc7XG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnJCAnLCAnJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnJCcsICcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGZvcm1hdCB0aGUgbnVtYmVyXG4gICAgICAgIG91dHB1dCA9IGZvcm1hdE51bWJlcihuLl92YWx1ZSwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKTtcblxuICAgICAgICAvLyBwb3NpdGlvbiB0aGUgc3ltYm9sXG4gICAgICAgIGlmIChzeW1ib2xJbmRleCA8PSAxKSB7XG4gICAgICAgICAgICBpZiAob3V0cHV0LmluZGV4T2YoJygnKSA+IC0xIHx8IG91dHB1dC5pbmRleE9mKCctJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5zcGxpdCgnJyk7XG4gICAgICAgICAgICAgICAgc3BsaWNlSW5kZXggPSAxO1xuICAgICAgICAgICAgICAgIGlmIChzeW1ib2xJbmRleCA8IG9wZW5QYXJlbkluZGV4IHx8IHN5bWJvbEluZGV4IDwgbWludXNTaWduSW5kZXgpe1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgc3ltYm9sIGFwcGVhcnMgYmVmb3JlIHRoZSBcIihcIiBvciBcIi1cIlxuICAgICAgICAgICAgICAgICAgICBzcGxpY2VJbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG91dHB1dC5zcGxpY2Uoc3BsaWNlSW5kZXgsIDAsIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCArIHNwYWNlKTtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQuam9pbignJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCArIHNwYWNlICsgb3V0cHV0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKG91dHB1dC5pbmRleE9mKCcpJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5zcGxpdCgnJyk7XG4gICAgICAgICAgICAgICAgb3V0cHV0LnNwbGljZSgtMSwgMCwgc3BhY2UgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wpO1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5qb2luKCcnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgc3BhY2UgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2w7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZvcm1hdFBlcmNlbnRhZ2UgKG4sIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbikge1xuICAgICAgICB2YXIgc3BhY2UgPSAnJyxcbiAgICAgICAgICAgIG91dHB1dCxcbiAgICAgICAgICAgIHZhbHVlID0gbi5fdmFsdWUgKiAxMDA7XG5cbiAgICAgICAgLy8gY2hlY2sgZm9yIHNwYWNlIGJlZm9yZSAlXG4gICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignICUnKSA+IC0xKSB7XG4gICAgICAgICAgICBzcGFjZSA9ICcgJztcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCcgJScsICcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCclJywgJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgb3V0cHV0ID0gZm9ybWF0TnVtYmVyKHZhbHVlLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pO1xuICAgICAgICBcbiAgICAgICAgaWYgKG91dHB1dC5pbmRleE9mKCcpJykgPiAtMSApIHtcbiAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5zcGxpdCgnJyk7XG4gICAgICAgICAgICBvdXRwdXQuc3BsaWNlKC0xLCAwLCBzcGFjZSArICclJyk7XG4gICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQuam9pbignJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQgKyBzcGFjZSArICclJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0VGltZSAobikge1xuICAgICAgICB2YXIgaG91cnMgPSBNYXRoLmZsb29yKG4uX3ZhbHVlLzYwLzYwKSxcbiAgICAgICAgICAgIG1pbnV0ZXMgPSBNYXRoLmZsb29yKChuLl92YWx1ZSAtIChob3VycyAqIDYwICogNjApKS82MCksXG4gICAgICAgICAgICBzZWNvbmRzID0gTWF0aC5yb3VuZChuLl92YWx1ZSAtIChob3VycyAqIDYwICogNjApIC0gKG1pbnV0ZXMgKiA2MCkpO1xuICAgICAgICByZXR1cm4gaG91cnMgKyAnOicgKyAoKG1pbnV0ZXMgPCAxMCkgPyAnMCcgKyBtaW51dGVzIDogbWludXRlcykgKyAnOicgKyAoKHNlY29uZHMgPCAxMCkgPyAnMCcgKyBzZWNvbmRzIDogc2Vjb25kcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW5mb3JtYXRUaW1lIChzdHJpbmcpIHtcbiAgICAgICAgdmFyIHRpbWVBcnJheSA9IHN0cmluZy5zcGxpdCgnOicpLFxuICAgICAgICAgICAgc2Vjb25kcyA9IDA7XG4gICAgICAgIC8vIHR1cm4gaG91cnMgYW5kIG1pbnV0ZXMgaW50byBzZWNvbmRzIGFuZCBhZGQgdGhlbSBhbGwgdXBcbiAgICAgICAgaWYgKHRpbWVBcnJheS5sZW5ndGggPT09IDMpIHtcbiAgICAgICAgICAgIC8vIGhvdXJzXG4gICAgICAgICAgICBzZWNvbmRzID0gc2Vjb25kcyArIChOdW1iZXIodGltZUFycmF5WzBdKSAqIDYwICogNjApO1xuICAgICAgICAgICAgLy8gbWludXRlc1xuICAgICAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgKyAoTnVtYmVyKHRpbWVBcnJheVsxXSkgKiA2MCk7XG4gICAgICAgICAgICAvLyBzZWNvbmRzXG4gICAgICAgICAgICBzZWNvbmRzID0gc2Vjb25kcyArIE51bWJlcih0aW1lQXJyYXlbMl0pO1xuICAgICAgICB9IGVsc2UgaWYgKHRpbWVBcnJheS5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgIC8vIG1pbnV0ZXNcbiAgICAgICAgICAgIHNlY29uZHMgPSBzZWNvbmRzICsgKE51bWJlcih0aW1lQXJyYXlbMF0pICogNjApO1xuICAgICAgICAgICAgLy8gc2Vjb25kc1xuICAgICAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgKyBOdW1iZXIodGltZUFycmF5WzFdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTnVtYmVyKHNlY29uZHMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZvcm1hdE51bWJlciAodmFsdWUsIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbikge1xuICAgICAgICB2YXIgbmVnUCA9IGZhbHNlLFxuICAgICAgICAgICAgc2lnbmVkID0gZmFsc2UsXG4gICAgICAgICAgICBvcHREZWMgPSBmYWxzZSxcbiAgICAgICAgICAgIGFiYnIgPSAnJyxcbiAgICAgICAgICAgIGFiYnJLID0gZmFsc2UsIC8vIGZvcmNlIGFiYnJldmlhdGlvbiB0byB0aG91c2FuZHNcbiAgICAgICAgICAgIGFiYnJNID0gZmFsc2UsIC8vIGZvcmNlIGFiYnJldmlhdGlvbiB0byBtaWxsaW9uc1xuICAgICAgICAgICAgYWJickIgPSBmYWxzZSwgLy8gZm9yY2UgYWJicmV2aWF0aW9uIHRvIGJpbGxpb25zXG4gICAgICAgICAgICBhYmJyVCA9IGZhbHNlLCAvLyBmb3JjZSBhYmJyZXZpYXRpb24gdG8gdHJpbGxpb25zXG4gICAgICAgICAgICBhYmJyRm9yY2UgPSBmYWxzZSwgLy8gZm9yY2UgYWJicmV2aWF0aW9uXG4gICAgICAgICAgICBieXRlcyA9ICcnLFxuICAgICAgICAgICAgb3JkID0gJycsXG4gICAgICAgICAgICBhYnMgPSBNYXRoLmFicyh2YWx1ZSksXG4gICAgICAgICAgICBzdWZmaXhlcyA9IFsnQicsICdLQicsICdNQicsICdHQicsICdUQicsICdQQicsICdFQicsICdaQicsICdZQiddLFxuICAgICAgICAgICAgbWluLFxuICAgICAgICAgICAgbWF4LFxuICAgICAgICAgICAgcG93ZXIsXG4gICAgICAgICAgICB3LFxuICAgICAgICAgICAgcHJlY2lzaW9uLFxuICAgICAgICAgICAgdGhvdXNhbmRzLFxuICAgICAgICAgICAgZCA9ICcnLFxuICAgICAgICAgICAgbmVnID0gZmFsc2U7XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgbnVtYmVyIGlzIHplcm8gYW5kIGEgY3VzdG9tIHplcm8gZm9ybWF0IGhhcyBiZWVuIHNldFxuICAgICAgICBpZiAodmFsdWUgPT09IDAgJiYgemVyb0Zvcm1hdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHplcm9Gb3JtYXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBzZWUgaWYgd2Ugc2hvdWxkIHVzZSBwYXJlbnRoZXNlcyBmb3IgbmVnYXRpdmUgbnVtYmVyIG9yIGlmIHdlIHNob3VsZCBwcmVmaXggd2l0aCBhIHNpZ25cbiAgICAgICAgICAgIC8vIGlmIGJvdGggYXJlIHByZXNlbnQgd2UgZGVmYXVsdCB0byBwYXJlbnRoZXNlc1xuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcoJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIG5lZ1AgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5zbGljZSgxLCAtMSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdC5pbmRleE9mKCcrJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIHNpZ25lZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoL1xcKy9nLCAnJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNlZSBpZiBhYmJyZXZpYXRpb24gaXMgd2FudGVkXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJ2EnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgYWJicmV2aWF0aW9uIGlzIHNwZWNpZmllZFxuICAgICAgICAgICAgICAgIGFiYnJLID0gZm9ybWF0LmluZGV4T2YoJ2FLJykgPj0gMDtcbiAgICAgICAgICAgICAgICBhYmJyTSA9IGZvcm1hdC5pbmRleE9mKCdhTScpID49IDA7XG4gICAgICAgICAgICAgICAgYWJickIgPSBmb3JtYXQuaW5kZXhPZignYUInKSA+PSAwO1xuICAgICAgICAgICAgICAgIGFiYnJUID0gZm9ybWF0LmluZGV4T2YoJ2FUJykgPj0gMDtcbiAgICAgICAgICAgICAgICBhYmJyRm9yY2UgPSBhYmJySyB8fCBhYmJyTSB8fCBhYmJyQiB8fCBhYmJyVDtcblxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGZvciBzcGFjZSBiZWZvcmUgYWJicmV2aWF0aW9uXG4gICAgICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcgYScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgYWJiciA9ICcgJztcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyBhJywgJycpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCdhJywgJycpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChhYnMgPj0gTWF0aC5wb3coMTAsIDEyKSAmJiAhYWJickZvcmNlIHx8IGFiYnJUKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRyaWxsaW9uXG4gICAgICAgICAgICAgICAgICAgIGFiYnIgPSBhYmJyICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy50cmlsbGlvbjtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KDEwLCAxMik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhYnMgPCBNYXRoLnBvdygxMCwgMTIpICYmIGFicyA+PSBNYXRoLnBvdygxMCwgOSkgJiYgIWFiYnJGb3JjZSB8fCBhYmJyQikge1xuICAgICAgICAgICAgICAgICAgICAvLyBiaWxsaW9uXG4gICAgICAgICAgICAgICAgICAgIGFiYnIgPSBhYmJyICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy5iaWxsaW9uO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gTWF0aC5wb3coMTAsIDkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYWJzIDwgTWF0aC5wb3coMTAsIDkpICYmIGFicyA+PSBNYXRoLnBvdygxMCwgNikgJiYgIWFiYnJGb3JjZSB8fCBhYmJyTSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBtaWxsaW9uXG4gICAgICAgICAgICAgICAgICAgIGFiYnIgPSBhYmJyICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy5taWxsaW9uO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gTWF0aC5wb3coMTAsIDYpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYWJzIDwgTWF0aC5wb3coMTAsIDYpICYmIGFicyA+PSBNYXRoLnBvdygxMCwgMykgJiYgIWFiYnJGb3JjZSB8fCBhYmJySykge1xuICAgICAgICAgICAgICAgICAgICAvLyB0aG91c2FuZFxuICAgICAgICAgICAgICAgICAgICBhYmJyID0gYWJiciArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMudGhvdXNhbmQ7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgMyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzZWUgaWYgd2UgYXJlIGZvcm1hdHRpbmcgYnl0ZXNcbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignYicpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBmb3Igc3BhY2UgYmVmb3JlXG4gICAgICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcgYicpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZXMgPSAnICc7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCcgYicsICcnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnYicsICcnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKHBvd2VyID0gMDsgcG93ZXIgPD0gc3VmZml4ZXMubGVuZ3RoOyBwb3dlcisrKSB7XG4gICAgICAgICAgICAgICAgICAgIG1pbiA9IE1hdGgucG93KDEwMjQsIHBvd2VyKTtcbiAgICAgICAgICAgICAgICAgICAgbWF4ID0gTWF0aC5wb3coMTAyNCwgcG93ZXIrMSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID49IG1pbiAmJiB2YWx1ZSA8IG1heCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnl0ZXMgPSBieXRlcyArIHN1ZmZpeGVzW3Bvd2VyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtaW4gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIG1pbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzZWUgaWYgb3JkaW5hbCBpcyB3YW50ZWRcbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignbycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBmb3Igc3BhY2UgYmVmb3JlXG4gICAgICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcgbycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgb3JkID0gJyAnO1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnIG8nLCAnJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJ28nLCAnJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgb3JkID0gb3JkICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0ub3JkaW5hbCh2YWx1ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignWy5dJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIG9wdERlYyA9IHRydWU7XG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJ1suXScsICcuJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHcgPSB2YWx1ZS50b1N0cmluZygpLnNwbGl0KCcuJylbMF07XG4gICAgICAgICAgICBwcmVjaXNpb24gPSBmb3JtYXQuc3BsaXQoJy4nKVsxXTtcbiAgICAgICAgICAgIHRob3VzYW5kcyA9IGZvcm1hdC5pbmRleE9mKCcsJyk7XG5cbiAgICAgICAgICAgIGlmIChwcmVjaXNpb24pIHtcbiAgICAgICAgICAgICAgICBpZiAocHJlY2lzaW9uLmluZGV4T2YoJ1snKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHByZWNpc2lvbiA9IHByZWNpc2lvbi5yZXBsYWNlKCddJywgJycpO1xuICAgICAgICAgICAgICAgICAgICBwcmVjaXNpb24gPSBwcmVjaXNpb24uc3BsaXQoJ1snKTtcbiAgICAgICAgICAgICAgICAgICAgZCA9IHRvRml4ZWQodmFsdWUsIChwcmVjaXNpb25bMF0ubGVuZ3RoICsgcHJlY2lzaW9uWzFdLmxlbmd0aCksIHJvdW5kaW5nRnVuY3Rpb24sIHByZWNpc2lvblsxXS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGQgPSB0b0ZpeGVkKHZhbHVlLCBwcmVjaXNpb24ubGVuZ3RoLCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB3ID0gZC5zcGxpdCgnLicpWzBdO1xuXG4gICAgICAgICAgICAgICAgaWYgKGQuc3BsaXQoJy4nKVsxXS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgZCA9IGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmRlbGltaXRlcnMuZGVjaW1hbCArIGQuc3BsaXQoJy4nKVsxXTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG9wdERlYyAmJiBOdW1iZXIoZC5zbGljZSgxKSkgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZCA9ICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdyA9IHRvRml4ZWQodmFsdWUsIG51bGwsIHJvdW5kaW5nRnVuY3Rpb24pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBmb3JtYXQgbnVtYmVyXG4gICAgICAgICAgICBpZiAody5pbmRleE9mKCctJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIHcgPSB3LnNsaWNlKDEpO1xuICAgICAgICAgICAgICAgIG5lZyA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aG91c2FuZHMgPiAtMSkge1xuICAgICAgICAgICAgICAgIHcgPSB3LnRvU3RyaW5nKCkucmVwbGFjZSgvKFxcZCkoPz0oXFxkezN9KSsoPyFcXGQpKS9nLCAnJDEnICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uZGVsaW1pdGVycy50aG91c2FuZHMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJy4nKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHcgPSAnJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICgobmVnUCAmJiBuZWcpID8gJygnIDogJycpICsgKCghbmVnUCAmJiBuZWcpID8gJy0nIDogJycpICsgKCghbmVnICYmIHNpZ25lZCkgPyAnKycgOiAnJykgKyB3ICsgZCArICgob3JkKSA/IG9yZCA6ICcnKSArICgoYWJicikgPyBhYmJyIDogJycpICsgKChieXRlcykgPyBieXRlcyA6ICcnKSArICgobmVnUCAmJiBuZWcpID8gJyknIDogJycpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBUb3AgTGV2ZWwgRnVuY3Rpb25zXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgbnVtZXJhbCA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICBpZiAobnVtZXJhbC5pc051bWVyYWwoaW5wdXQpKSB7XG4gICAgICAgICAgICBpbnB1dCA9IGlucHV0LnZhbHVlKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5wdXQgPT09IDAgfHwgdHlwZW9mIGlucHV0ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaW5wdXQgPSAwO1xuICAgICAgICB9IGVsc2UgaWYgKCFOdW1iZXIoaW5wdXQpKSB7XG4gICAgICAgICAgICBpbnB1dCA9IG51bWVyYWwuZm4udW5mb3JtYXQoaW5wdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmFsKE51bWJlcihpbnB1dCkpO1xuICAgIH07XG5cbiAgICAvLyB2ZXJzaW9uIG51bWJlclxuICAgIG51bWVyYWwudmVyc2lvbiA9IFZFUlNJT047XG5cbiAgICAvLyBjb21wYXJlIG51bWVyYWwgb2JqZWN0XG4gICAgbnVtZXJhbC5pc051bWVyYWwgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBOdW1lcmFsO1xuICAgIH07XG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHdpbGwgbG9hZCBsYW5ndWFnZXMgYW5kIHRoZW4gc2V0IHRoZSBnbG9iYWwgbGFuZ3VhZ2UuICBJZlxuICAgIC8vIG5vIGFyZ3VtZW50cyBhcmUgcGFzc2VkIGluLCBpdCB3aWxsIHNpbXBseSByZXR1cm4gdGhlIGN1cnJlbnQgZ2xvYmFsXG4gICAgLy8gbGFuZ3VhZ2Uga2V5LlxuICAgIG51bWVyYWwubGFuZ3VhZ2UgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZXMpIHtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50TGFuZ3VhZ2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoa2V5ICYmICF2YWx1ZXMpIHtcbiAgICAgICAgICAgIGlmKCFsYW5ndWFnZXNba2V5XSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBsYW5ndWFnZSA6ICcgKyBrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3VycmVudExhbmd1YWdlID0ga2V5O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbHVlcyB8fCAhbGFuZ3VhZ2VzW2tleV0pIHtcbiAgICAgICAgICAgIGxvYWRMYW5ndWFnZShrZXksIHZhbHVlcyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVtZXJhbDtcbiAgICB9O1xuICAgIFxuICAgIC8vIFRoaXMgZnVuY3Rpb24gcHJvdmlkZXMgYWNjZXNzIHRvIHRoZSBsb2FkZWQgbGFuZ3VhZ2UgZGF0YS4gIElmXG4gICAgLy8gbm8gYXJndW1lbnRzIGFyZSBwYXNzZWQgaW4sIGl0IHdpbGwgc2ltcGx5IHJldHVybiB0aGUgY3VycmVudFxuICAgIC8vIGdsb2JhbCBsYW5ndWFnZSBvYmplY3QuXG4gICAgbnVtZXJhbC5sYW5ndWFnZURhdGEgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV07XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghbGFuZ3VhZ2VzW2tleV0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBsYW5ndWFnZSA6ICcgKyBrZXkpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gbGFuZ3VhZ2VzW2tleV07XG4gICAgfTtcblxuICAgIG51bWVyYWwubGFuZ3VhZ2UoJ2VuJywge1xuICAgICAgICBkZWxpbWl0ZXJzOiB7XG4gICAgICAgICAgICB0aG91c2FuZHM6ICcsJyxcbiAgICAgICAgICAgIGRlY2ltYWw6ICcuJ1xuICAgICAgICB9LFxuICAgICAgICBhYmJyZXZpYXRpb25zOiB7XG4gICAgICAgICAgICB0aG91c2FuZDogJ2snLFxuICAgICAgICAgICAgbWlsbGlvbjogJ20nLFxuICAgICAgICAgICAgYmlsbGlvbjogJ2InLFxuICAgICAgICAgICAgdHJpbGxpb246ICd0J1xuICAgICAgICB9LFxuICAgICAgICBvcmRpbmFsOiBmdW5jdGlvbiAobnVtYmVyKSB7XG4gICAgICAgICAgICB2YXIgYiA9IG51bWJlciAlIDEwO1xuICAgICAgICAgICAgcmV0dXJuICh+fiAobnVtYmVyICUgMTAwIC8gMTApID09PSAxKSA/ICd0aCcgOlxuICAgICAgICAgICAgICAgIChiID09PSAxKSA/ICdzdCcgOlxuICAgICAgICAgICAgICAgIChiID09PSAyKSA/ICduZCcgOlxuICAgICAgICAgICAgICAgIChiID09PSAzKSA/ICdyZCcgOiAndGgnO1xuICAgICAgICB9LFxuICAgICAgICBjdXJyZW5jeToge1xuICAgICAgICAgICAgc3ltYm9sOiAnJCdcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgbnVtZXJhbC56ZXJvRm9ybWF0ID0gZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgICAgICB6ZXJvRm9ybWF0ID0gdHlwZW9mKGZvcm1hdCkgPT09ICdzdHJpbmcnID8gZm9ybWF0IDogbnVsbDtcbiAgICB9O1xuXG4gICAgbnVtZXJhbC5kZWZhdWx0Rm9ybWF0ID0gZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgICAgICBkZWZhdWx0Rm9ybWF0ID0gdHlwZW9mKGZvcm1hdCkgPT09ICdzdHJpbmcnID8gZm9ybWF0IDogJzAuMCc7XG4gICAgfTtcblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgSGVscGVyc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIGZ1bmN0aW9uIGxvYWRMYW5ndWFnZShrZXksIHZhbHVlcykge1xuICAgICAgICBsYW5ndWFnZXNba2V5XSA9IHZhbHVlcztcbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEZsb2F0aW5nLXBvaW50IGhlbHBlcnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAvLyBUaGUgZmxvYXRpbmctcG9pbnQgaGVscGVyIGZ1bmN0aW9ucyBhbmQgaW1wbGVtZW50YXRpb25cbiAgICAvLyBib3Jyb3dzIGhlYXZpbHkgZnJvbSBzaW5mdWwuanM6IGh0dHA6Ly9ndWlwbi5naXRodWIuaW8vc2luZnVsLmpzL1xuXG4gICAgLyoqXG4gICAgICogQXJyYXkucHJvdG90eXBlLnJlZHVjZSBmb3IgYnJvd3NlcnMgdGhhdCBkb24ndCBzdXBwb3J0IGl0XG4gICAgICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvUmVkdWNlI0NvbXBhdGliaWxpdHlcbiAgICAgKi9cbiAgICBpZiAoJ2Z1bmN0aW9uJyAhPT0gdHlwZW9mIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UpIHtcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnJlZHVjZSA9IGZ1bmN0aW9uIChjYWxsYmFjaywgb3B0X2luaXRpYWxWYWx1ZSkge1xuICAgICAgICAgICAgJ3VzZSBzdHJpY3QnO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAobnVsbCA9PT0gdGhpcyB8fCAndW5kZWZpbmVkJyA9PT0gdHlwZW9mIHRoaXMpIHtcbiAgICAgICAgICAgICAgICAvLyBBdCB0aGUgbW9tZW50IGFsbCBtb2Rlcm4gYnJvd3NlcnMsIHRoYXQgc3VwcG9ydCBzdHJpY3QgbW9kZSwgaGF2ZVxuICAgICAgICAgICAgICAgIC8vIG5hdGl2ZSBpbXBsZW1lbnRhdGlvbiBvZiBBcnJheS5wcm90b3R5cGUucmVkdWNlLiBGb3IgaW5zdGFuY2UsIElFOFxuICAgICAgICAgICAgICAgIC8vIGRvZXMgbm90IHN1cHBvcnQgc3RyaWN0IG1vZGUsIHNvIHRoaXMgY2hlY2sgaXMgYWN0dWFsbHkgdXNlbGVzcy5cbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcnJheS5wcm90b3R5cGUucmVkdWNlIGNhbGxlZCBvbiBudWxsIG9yIHVuZGVmaW5lZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoJ2Z1bmN0aW9uJyAhPT0gdHlwZW9mIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihjYWxsYmFjayArICcgaXMgbm90IGEgZnVuY3Rpb24nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGluZGV4LFxuICAgICAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoID4+PiAwLFxuICAgICAgICAgICAgICAgIGlzVmFsdWVTZXQgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKDEgPCBhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBvcHRfaW5pdGlhbFZhbHVlO1xuICAgICAgICAgICAgICAgIGlzVmFsdWVTZXQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGluZGV4ID0gMDsgbGVuZ3RoID4gaW5kZXg7ICsraW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eShpbmRleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzVmFsdWVTZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gY2FsbGJhY2sodmFsdWUsIHRoaXNbaW5kZXhdLCBpbmRleCwgdGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHRoaXNbaW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNWYWx1ZVNldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghaXNWYWx1ZVNldCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1JlZHVjZSBvZiBlbXB0eSBhcnJheSB3aXRoIG5vIGluaXRpYWwgdmFsdWUnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIFxuICAgIC8qKlxuICAgICAqIENvbXB1dGVzIHRoZSBtdWx0aXBsaWVyIG5lY2Vzc2FyeSB0byBtYWtlIHggPj0gMSxcbiAgICAgKiBlZmZlY3RpdmVseSBlbGltaW5hdGluZyBtaXNjYWxjdWxhdGlvbnMgY2F1c2VkIGJ5XG4gICAgICogZmluaXRlIHByZWNpc2lvbi5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBtdWx0aXBsaWVyKHgpIHtcbiAgICAgICAgdmFyIHBhcnRzID0geC50b1N0cmluZygpLnNwbGl0KCcuJyk7XG4gICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPCAyKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTWF0aC5wb3coMTAsIHBhcnRzWzFdLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2l2ZW4gYSB2YXJpYWJsZSBudW1iZXIgb2YgYXJndW1lbnRzLCByZXR1cm5zIHRoZSBtYXhpbXVtXG4gICAgICogbXVsdGlwbGllciB0aGF0IG11c3QgYmUgdXNlZCB0byBub3JtYWxpemUgYW4gb3BlcmF0aW9uIGludm9sdmluZ1xuICAgICAqIGFsbCBvZiB0aGVtLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNvcnJlY3Rpb25GYWN0b3IoKSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIGFyZ3MucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBuZXh0KSB7XG4gICAgICAgICAgICB2YXIgbXAgPSBtdWx0aXBsaWVyKHByZXYpLFxuICAgICAgICAgICAgICAgIG1uID0gbXVsdGlwbGllcihuZXh0KTtcbiAgICAgICAgcmV0dXJuIG1wID4gbW4gPyBtcCA6IG1uO1xuICAgICAgICB9LCAtSW5maW5pdHkpO1xuICAgIH0gICAgICAgIFxuXG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIE51bWVyYWwgUHJvdG90eXBlXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICBudW1lcmFsLmZuID0gTnVtZXJhbC5wcm90b3R5cGUgPSB7XG5cbiAgICAgICAgY2xvbmUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVtZXJhbCh0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBmb3JtYXQgOiBmdW5jdGlvbiAoaW5wdXRTdHJpbmcsIHJvdW5kaW5nRnVuY3Rpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXROdW1lcmFsKHRoaXMsIFxuICAgICAgICAgICAgICAgICAgaW5wdXRTdHJpbmcgPyBpbnB1dFN0cmluZyA6IGRlZmF1bHRGb3JtYXQsIFxuICAgICAgICAgICAgICAgICAgKHJvdW5kaW5nRnVuY3Rpb24gIT09IHVuZGVmaW5lZCkgPyByb3VuZGluZ0Z1bmN0aW9uIDogTWF0aC5yb3VuZFxuICAgICAgICAgICAgICApO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVuZm9ybWF0IDogZnVuY3Rpb24gKGlucHV0U3RyaW5nKSB7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGlucHV0U3RyaW5nKSA9PT0gJ1tvYmplY3QgTnVtYmVyXScpIHsgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlucHV0U3RyaW5nOyBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB1bmZvcm1hdE51bWVyYWwodGhpcywgaW5wdXRTdHJpbmcgPyBpbnB1dFN0cmluZyA6IGRlZmF1bHRGb3JtYXQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHZhbHVlIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIHZhbHVlT2YgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0IDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IE51bWJlcih2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBhZGQgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBjb3JyRmFjdG9yID0gY29ycmVjdGlvbkZhY3Rvci5jYWxsKG51bGwsIHRoaXMuX3ZhbHVlLCB2YWx1ZSk7XG4gICAgICAgICAgICBmdW5jdGlvbiBjYmFjayhhY2N1bSwgY3VyciwgY3VyckksIE8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWNjdW0gKyBjb3JyRmFjdG9yICogY3VycjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gW3RoaXMuX3ZhbHVlLCB2YWx1ZV0ucmVkdWNlKGNiYWNrLCAwKSAvIGNvcnJGYWN0b3I7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBzdWJ0cmFjdCA6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIGNvcnJGYWN0b3IgPSBjb3JyZWN0aW9uRmFjdG9yLmNhbGwobnVsbCwgdGhpcy5fdmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNiYWNrKGFjY3VtLCBjdXJyLCBjdXJySSwgTykge1xuICAgICAgICAgICAgICAgIHJldHVybiBhY2N1bSAtIGNvcnJGYWN0b3IgKiBjdXJyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSBbdmFsdWVdLnJlZHVjZShjYmFjaywgdGhpcy5fdmFsdWUgKiBjb3JyRmFjdG9yKSAvIGNvcnJGYWN0b3I7ICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBtdWx0aXBseSA6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgZnVuY3Rpb24gY2JhY2soYWNjdW0sIGN1cnIsIGN1cnJJLCBPKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvcnJGYWN0b3IgPSBjb3JyZWN0aW9uRmFjdG9yKGFjY3VtLCBjdXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGFjY3VtICogY29yckZhY3RvcikgKiAoY3VyciAqIGNvcnJGYWN0b3IpIC9cbiAgICAgICAgICAgICAgICAgICAgKGNvcnJGYWN0b3IgKiBjb3JyRmFjdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gW3RoaXMuX3ZhbHVlLCB2YWx1ZV0ucmVkdWNlKGNiYWNrLCAxKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRpdmlkZSA6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgZnVuY3Rpb24gY2JhY2soYWNjdW0sIGN1cnIsIGN1cnJJLCBPKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvcnJGYWN0b3IgPSBjb3JyZWN0aW9uRmFjdG9yKGFjY3VtLCBjdXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGFjY3VtICogY29yckZhY3RvcikgLyAoY3VyciAqIGNvcnJGYWN0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSBbdGhpcy5fdmFsdWUsIHZhbHVlXS5yZWR1Y2UoY2JhY2spOyAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGlmZmVyZW5jZSA6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGguYWJzKG51bWVyYWwodGhpcy5fdmFsdWUpLnN1YnRyYWN0KHZhbHVlKS52YWx1ZSgpKTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRXhwb3NpbmcgTnVtZXJhbFxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIC8vIENvbW1vbkpTIG1vZHVsZSBpcyBkZWZpbmVkXG4gICAgaWYgKGhhc01vZHVsZSkge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IG51bWVyYWw7XG4gICAgfVxuXG4gICAgLypnbG9iYWwgZW5kZXI6ZmFsc2UgKi9cbiAgICBpZiAodHlwZW9mIGVuZGVyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAvLyBoZXJlLCBgdGhpc2AgbWVhbnMgYHdpbmRvd2AgaW4gdGhlIGJyb3dzZXIsIG9yIGBnbG9iYWxgIG9uIHRoZSBzZXJ2ZXJcbiAgICAgICAgLy8gYWRkIGBudW1lcmFsYCBhcyBhIGdsb2JhbCBvYmplY3QgdmlhIGEgc3RyaW5nIGlkZW50aWZpZXIsXG4gICAgICAgIC8vIGZvciBDbG9zdXJlIENvbXBpbGVyICdhZHZhbmNlZCcgbW9kZVxuICAgICAgICB0aGlzWydudW1lcmFsJ10gPSBudW1lcmFsO1xuICAgIH1cblxuICAgIC8qZ2xvYmFsIGRlZmluZTpmYWxzZSAqL1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVtZXJhbDtcbiAgICAgICAgfSk7XG4gICAgfVxufSkuY2FsbCh0aGlzKTtcbiIsIi8qKlxuICAgIEFjY291bnQgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBBY2NvdW50QWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU2VjdGlvbk5hdkJhcignQWNjb3VudCcpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcbiIsIi8qKiBDYWxlbmRhciBhY3Rpdml0eSAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpLFxyXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG5yZXF1aXJlKCcuLi9jb21wb25lbnRzL0RhdGVQaWNrZXInKTtcclxuXHJcbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcclxuXHJcbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBBcHBvaW50bWVudEFjdGl2aXR5KCkge1xyXG4gICAgXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyOyAgICBcclxuICAgIHRoaXMubWVudUl0ZW0gPSAnY2FsZW5kYXInO1xyXG4gICAgXHJcbiAgICAvLyBDcmVhdGUgYSBzcGVjaWZpYyBiYWNrQWN0aW9uIHRoYXQgc2hvd3MgY3VycmVudCBkYXRlXHJcbiAgICAvLyBhbmQgcmV0dXJuIHRvIGNhbGVuZGFyIGluIGN1cnJlbnQgZGF0ZS5cclxuICAgIC8vIExhdGVyIHNvbWUgbW9yZSBjaGFuZ2VzIGFyZSBhcHBsaWVkLCB3aXRoIHZpZXdtb2RlbCByZWFkeVxyXG4gICAgdmFyIGJhY2tBY3Rpb24gPSBuZXcgQWN0aXZpdHkuTmF2QWN0aW9uKHtcclxuICAgICAgICBsaW5rOiAnY2FsZW5kYXIvJywgLy8gUHJlc2VydmUgbGFzdCBzbGFzaCwgZm9yIGxhdGVyIHVzZVxyXG4gICAgICAgIGljb246IEFjdGl2aXR5Lk5hdkFjdGlvbi5nb0JhY2suaWNvbigpLFxyXG4gICAgICAgIGlzVGl0bGU6IHRydWUsXHJcbiAgICAgICAgdGV4dDogJ0NhbGVuZGFyJ1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLm5hdkJhciA9IG5ldyBBY3Rpdml0eS5OYXZCYXIoe1xyXG4gICAgICAgIHRpdGxlOiAnJyxcclxuICAgICAgICBsZWZ0QWN0aW9uOiBiYWNrQWN0aW9uLFxyXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBBY3Rpdml0eS5OYXZBY3Rpb24uZ29IZWxwSW5kZXhcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLiRhcHBvaW50bWVudFZpZXcgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjY2FsZW5kYXJBcHBvaW50bWVudFZpZXcnKTtcclxuICAgIHRoaXMuJGNob29zZU5ldyA9ICQoJyNjYWxlbmRhckNob29zZU5ldycpO1xyXG4gICAgXHJcbiAgICB0aGlzLmluaXRBcHBvaW50bWVudCgpO1xyXG4gICAgdGhpcy52aWV3TW9kZWwgPSB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3O1xyXG4gICAgXHJcbiAgICAvLyBUaGlzIHRpdGxlIHRleHQgaXMgZHluYW1pYywgd2UgbmVlZCB0byByZXBsYWNlIGl0IGJ5IGEgY29tcHV0ZWQgb2JzZXJ2YWJsZVxyXG4gICAgLy8gc2hvd2luZyB0aGUgY3VycmVudCBkYXRlXHJcbiAgICB2YXIgZGVmQmFja1RleHQgPSBiYWNrQWN0aW9uLnRleHQuX2luaXRpYWxWYWx1ZTtcclxuICAgIGJhY2tBY3Rpb24udGV4dCA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgZCA9IHRoaXMuYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudERhdGUoKTtcclxuICAgICAgICBpZiAoIWQpXHJcbiAgICAgICAgICAgIC8vIEZhbGxiYWNrIHRvIHRoZSBkZWZhdWx0IHRpdGxlXHJcbiAgICAgICAgICAgIHJldHVybiBkZWZCYWNrVGV4dDtcclxuXHJcbiAgICAgICAgdmFyIG0gPSBtb21lbnQoZCk7XHJcbiAgICAgICAgdmFyIHQgPSBtLmZvcm1hdCgnZGRkZCBbKF1NL0RbKV0nKTtcclxuICAgICAgICByZXR1cm4gdDtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgLy8gQW5kIHRoZSBsaW5rIGlzIGR5bmFtaWMgdG9vLCB0byBhbGxvdyByZXR1cm4gdG8gdGhlIGRhdGVcclxuICAgIC8vIHRoYXQgbWF0Y2hlcyBjdXJyZW50IGFwcG9pbnRtZW50XHJcbiAgICB2YXIgZGVmTGluayA9IGJhY2tBY3Rpb24ubGluay5faW5pdGlhbFZhbHVlO1xyXG4gICAgYmFja0FjdGlvbi5saW5rID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHZhciBkID0gdGhpcy5hcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50RGF0ZSgpO1xyXG4gICAgICAgIGlmICghZClcclxuICAgICAgICAgICAgLy8gRmFsbGJhY2sgdG8gdGhlIGRlZmF1bHQgbGlua1xyXG4gICAgICAgICAgICByZXR1cm4gZGVmTGluaztcclxuXHJcbiAgICAgICAgcmV0dXJuIGRlZkxpbmsgKyBkLnRvSVNPU3RyaW5nKCk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5hcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50QXBwb2ludG1lbnQuc3Vic2NyaWJlKGZ1bmN0aW9uIChhcHQpIHtcclxuICAgICAgICAvLyBVcGRhdGUgVVJMIHRvIG1hdGNoIHRoZSBhcHBvaW50bWVudCBJRCBhbmRcclxuICAgICAgICAvLyB0cmFjayBpdCBzdGF0ZVxyXG4gICAgICAgIC8vIEdldCBJRCBmcm9tIFVSTCwgdG8gYXZvaWQgZG8gYW55dGhpbmcgaWYgdGhlIHNhbWUuXHJcbiAgICAgICAgdmFyIGFwdElkID0gYXB0LmlkKCk7XHJcbiAgICAgICAgdmFyIHVybElkID0gL2FwcG9pbnRtZW50XFwvKFxcZCspL2kudGVzdCh3aW5kb3cubG9jYXRpb24pO1xyXG4gICAgICAgIHVybElkID0gdXJsSWQgJiYgdXJsSWRbMV0gfHwgJyc7XHJcbiAgICAgICAgaWYgKHVybElkICE9PSAnMCcgJiYgYXB0SWQgIT09IG51bGwgJiYgdXJsSWQgIT09IGFwdElkLnRvU3RyaW5nKCkpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFRPRE8gc2F2ZSBhIHVzZWZ1bCBzdGF0ZVxyXG4gICAgICAgICAgICAvLyBOb3QgZm9yIG5vdywgaXMgZmFpbGluZywgYnV0IHNvbWV0aGluZyBiYXNlZCBvbjpcclxuICAgICAgICAgICAgLypcclxuICAgICAgICAgICAgdmFyIHZpZXdzdGF0ZSA9IHtcclxuICAgICAgICAgICAgICAgIGFwcG9pbnRtZW50OiBhcHQubW9kZWwudG9QbGFpbk9iamVjdCh0cnVlKVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gSWYgd2FzIGEgcm9vdCBVUkwsIG5vIElELCBqdXN0IHJlcGxhY2UgY3VycmVudCBzdGF0ZVxyXG4gICAgICAgICAgICBpZiAodXJsSWQgPT09ICcnKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuaGlzdG9yeS5yZXBsYWNlU3RhdGUobnVsbCwgbnVsbCwgJ2FwcG9pbnRtZW50LycgKyBhcHRJZCk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsICdhcHBvaW50bWVudC8nICsgYXB0SWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBUcmlnZ2VyIGEgbGF5b3V0IHVwZGF0ZSwgcmVxdWlyZWQgYnkgdGhlIGZ1bGwtaGVpZ2h0IGZlYXR1cmVcclxuICAgICAgICAkKHdpbmRvdykudHJpZ2dlcignbGF5b3V0VXBkYXRlJyk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59KTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcclxuXHJcbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcclxuICAgIC8qIGpzaGludCBtYXhjb21wbGV4aXR5OjEwICovXHJcblxyXG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBvcHRpb25zKTtcclxuICAgIFxyXG4gICAgdmFyIGFwdDtcclxuICAgIGlmICh0aGlzLnJlcXVlc3REYXRhLmFwcG9pbnRtZW50KSB7XHJcbiAgICAgICAgYXB0ID0gdGhpcy5yZXF1ZXN0RGF0YS5hcHBvaW50bWVudDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAvLyBHZXQgSURcclxuICAgICAgICB2YXIgYXB0SWQgPSBvcHRpb25zICYmIG9wdGlvbnMucm91dGUgJiYgb3B0aW9ucy5yb3V0ZS5zZWdtZW50c1swXTtcclxuICAgICAgICBhcHRJZCA9IHBhcnNlSW50KGFwdElkLCAxMCk7XHJcbiAgICAgICAgYXB0ID0gYXB0SWQgfHwgMDtcclxuICAgIH1cclxuICAgIHRoaXMuc2hvd0FwcG9pbnRtZW50KGFwdCk7XHJcbiAgICBcclxuICAgIC8vIElmIHRoZXJlIGFyZSBvcHRpb25zICh0aGVyZSAgbm90IG9uIHN0YXJ0dXAgb3JcclxuICAgIC8vIG9uIGNhbmNlbGxlZCBlZGl0aW9uKS5cclxuICAgIC8vIEFuZCBpdCBjb21lcyBiYWNrIGZyb20gdGhlIHRleHRFZGl0b3IuXHJcbiAgICBpZiAob3B0aW9ucyAhPT0gbnVsbCkge1xyXG5cclxuICAgICAgICB2YXIgYm9va2luZyA9IHRoaXMuYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50KCk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLnJlcXVlc3QgPT09ICd0ZXh0RWRpdG9yJyAmJiBib29raW5nKSB7XHJcblxyXG4gICAgICAgICAgICBib29raW5nW29wdGlvbnMuZmllbGRdKG9wdGlvbnMudGV4dCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKG9wdGlvbnMuc2VsZWN0Q2xpZW50ID09PSB0cnVlICYmIGJvb2tpbmcpIHtcclxuXHJcbiAgICAgICAgICAgIGJvb2tpbmcuY2xpZW50KG9wdGlvbnMuc2VsZWN0ZWRDbGllbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0eXBlb2Yob3B0aW9ucy5zZWxlY3RlZERhdGV0aW1lKSAhPT0gJ3VuZGVmaW5lZCcgJiYgYm9va2luZykge1xyXG5cclxuICAgICAgICAgICAgYm9va2luZy5zdGFydFRpbWUob3B0aW9ucy5zZWxlY3RlZERhdGV0aW1lKTtcclxuICAgICAgICAgICAgLy8gVE9ETyBDYWxjdWxhdGUgdGhlIGVuZFRpbWUgZ2l2ZW4gYW4gYXBwb2ludG1lbnQgZHVyYXRpb24sIHJldHJpZXZlZCBmcm9tIHRoZVxyXG4gICAgICAgICAgICAvLyBzZWxlY3RlZCBzZXJ2aWNlXHJcbiAgICAgICAgICAgIC8vdmFyIGR1cmF0aW9uID0gYm9va2luZy5wcmljaW5nICYmIGJvb2tpbmcucHJpY2luZy5kdXJhdGlvbjtcclxuICAgICAgICAgICAgLy8gT3IgYnkgZGVmYXVsdCAoaWYgbm8gcHJpY2luZyBzZWxlY3RlZCBvciBhbnkpIHRoZSB1c2VyIHByZWZlcnJlZFxyXG4gICAgICAgICAgICAvLyB0aW1lIGdhcFxyXG4gICAgICAgICAgICAvL2R1cmF0aW9uID0gZHVyYXRpb24gfHwgdXNlci5wcmVmZXJlbmNlcy50aW1lU2xvdHNHYXA7XHJcbiAgICAgICAgICAgIC8vIFBST1RPVFlQRTpcclxuICAgICAgICAgICAgdmFyIGR1cmF0aW9uID0gNjA7IC8vIG1pbnV0ZXNcclxuICAgICAgICAgICAgYm9va2luZy5lbmRUaW1lKG1vbWVudChib29raW5nLnN0YXJ0VGltZSgpKS5hZGQoZHVyYXRpb24sICdtaW51dGVzJykudG9EYXRlKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChvcHRpb25zLnNlbGVjdFNlcnZpY2VzID09PSB0cnVlICYmIGJvb2tpbmcpIHtcclxuXHJcbiAgICAgICAgICAgIGJvb2tpbmcuc2VydmljZXMob3B0aW9ucy5zZWxlY3RlZFNlcnZpY2VzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5zZWxlY3RMb2NhdGlvbiA9PT0gdHJ1ZSAmJiBib29raW5nKSB7XHJcblxyXG4gICAgICAgICAgICBib29raW5nLmxvY2F0aW9uKG9wdGlvbnMuc2VsZWN0ZWRMb2NhdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIEFwcG9pbnRtZW50ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0FwcG9pbnRtZW50Jyk7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93QXBwb2ludG1lbnQgPSBmdW5jdGlvbiBzaG93QXBwb2ludG1lbnQoYXB0KSB7XHJcblxyXG4gICAgaWYgKHR5cGVvZihhcHQpID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgIGlmIChhcHQpIHtcclxuICAgICAgICAgICAgLy8gVE9ETzogc2VsZWN0IGFwcG9pbnRtZW50IGFwdCBJRFxyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKGFwdCA9PT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3Lm5ld0FwcG9pbnRtZW50KG5ldyBBcHBvaW50bWVudCgpKTtcclxuICAgICAgICAgICAgdGhpcy5hcHBvaW50bWVudHNEYXRhVmlldy5lZGl0TW9kZSh0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICAvLyBBcHBvaW50bWVudCBvYmplY3RcclxuICAgICAgICBpZiAoYXB0LmlkKSB7XHJcbiAgICAgICAgICAgIC8vIFRPRE86IHNlbGVjdCBhcHBvaW50bWVudCBieSBhcHQgaWRcclxuICAgICAgICAgICAgLy8gVE9ETzogdGhlbiB1cGRhdGUgdmFsdWVzIHdpdGggaW4tZWRpdGluZyB2YWx1ZXMgZnJvbSBhcHRcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIE5ldyBhcG9waW50bWVudCB3aXRoIHRoZSBpbi1lZGl0aW5nIHZhbHVlc1xyXG4gICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3Lm5ld0FwcG9pbnRtZW50KG5ldyBBcHBvaW50bWVudChhcHQpKTtcclxuICAgICAgICAgICAgdGhpcy5hcHBvaW50bWVudHNEYXRhVmlldy5lZGl0TW9kZSh0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5BLnByb3RvdHlwZS5pbml0QXBwb2ludG1lbnQgPSBmdW5jdGlvbiBpbml0QXBwb2ludG1lbnQoKSB7XHJcbiAgICBpZiAoIXRoaXMuX19pbml0ZWRBcHBvaW50bWVudCkge1xyXG4gICAgICAgIHRoaXMuX19pbml0ZWRBcHBvaW50bWVudCA9IHRydWU7XHJcblxyXG4gICAgICAgIHZhciBhcHAgPSB0aGlzLmFwcDtcclxuICAgICAgICBcclxuICAgICAgICAvLyBEYXRhXHJcbiAgICAgICAgdmFyIHRlc3REYXRhID0gcmVxdWlyZSgnLi4vdGVzdGRhdGEvY2FsZW5kYXJBcHBvaW50bWVudHMnKS5hcHBvaW50bWVudHM7XHJcbiAgICAgICAgdmFyIGFwcG9pbnRtZW50c0RhdGFWaWV3ID0ge1xyXG4gICAgICAgICAgICBhcHBvaW50bWVudHM6IGtvLm9ic2VydmFibGVBcnJheSh0ZXN0RGF0YSksXHJcbiAgICAgICAgICAgIGN1cnJlbnRJbmRleDoga28ub2JzZXJ2YWJsZSgwKSxcclxuICAgICAgICAgICAgZWRpdE1vZGU6IGtvLm9ic2VydmFibGUoZmFsc2UpLFxyXG4gICAgICAgICAgICBuZXdBcHBvaW50bWVudDoga28ub2JzZXJ2YWJsZShudWxsKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5hcHBvaW50bWVudHNEYXRhVmlldyA9IGFwcG9pbnRtZW50c0RhdGFWaWV3O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmlzTmV3ID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV3QXBwb2ludG1lbnQoKSAhPT0gbnVsbDtcclxuICAgICAgICB9LCBhcHBvaW50bWVudHNEYXRhVmlldyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50ID0ga28uY29tcHV0ZWQoe1xyXG4gICAgICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzTmV3KCkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5uZXdBcHBvaW50bWVudCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXBwb2ludG1lbnRzKClbdGhpcy5jdXJyZW50SW5kZXgoKSAlIHRoaXMuYXBwb2ludG1lbnRzKCkubGVuZ3RoXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKGFwdCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5jdXJyZW50SW5kZXgoKSAlIHRoaXMuYXBwb2ludG1lbnRzKCkubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBvaW50bWVudHMoKVtpbmRleF0gPSBhcHQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50cy52YWx1ZUhhc011dGF0ZWQoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgb3duZXI6IGFwcG9pbnRtZW50c0RhdGFWaWV3XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcub3JpZ2luYWxFZGl0ZWRBcHBvaW50bWVudCA9IHt9O1xyXG4gXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuZ29QcmV2aW91cyA9IGZ1bmN0aW9uIGdvUHJldmlvdXMoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmVkaXRNb2RlKCkpIHJldHVybjtcclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudEluZGV4KCkgPT09IDApXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCh0aGlzLmFwcG9pbnRtZW50cygpLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCgodGhpcy5jdXJyZW50SW5kZXgoKSAtIDEpICUgdGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGgpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuZ29OZXh0ID0gZnVuY3Rpb24gZ29OZXh0KCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5lZGl0TW9kZSgpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCgodGhpcy5jdXJyZW50SW5kZXgoKSArIDEpICUgdGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGgpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmVkaXQgPSBmdW5jdGlvbiBlZGl0KCkge1xyXG4gICAgICAgICAgICB0aGlzLmVkaXRNb2RlKHRydWUpO1xyXG4gICAgICAgIH0uYmluZChhcHBvaW50bWVudHNEYXRhVmlldyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKCkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gaWYgaXMgbmV3LCBkaXNjYXJkXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzTmV3KCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV3QXBwb2ludG1lbnQobnVsbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyByZXZlcnQgY2hhbmdlc1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50QXBwb2ludG1lbnQobmV3IEFwcG9pbnRtZW50KHRoaXMub3JpZ2luYWxFZGl0ZWRBcHBvaW50bWVudCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmVkaXRNb2RlKGZhbHNlKTtcclxuICAgICAgICB9LmJpbmQoYXBwb2ludG1lbnRzRGF0YVZpZXcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgICAgICAgICAvLyBJZiBpcyBhIG5ldyBvbmUsIGFkZCBpdCB0byB0aGUgY29sbGVjdGlvblxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc05ldygpKSB7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHZhciBuZXdBcHQgPSB0aGlzLm5ld0FwcG9pbnRtZW50KCk7XHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBzb21lIGZpZWRzIG5lZWQgc29tZSBraW5kIG9mIGNhbGN1bGF0aW9uIHRoYXQgaXMgcGVyc2lzdGVkXHJcbiAgICAgICAgICAgICAgICAvLyBzb24gY2Fubm90IGJlIGNvbXB1dGVkLiBTaW11bGF0ZWQ6XHJcbiAgICAgICAgICAgICAgICBuZXdBcHQuc3VtbWFyeSgnTWFzc2FnZSBUaGVyYXBpc3QgQm9va2luZycpO1xyXG4gICAgICAgICAgICAgICAgbmV3QXB0LmlkKDQpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgdG8gdGhlIGxpc3Q6XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50cy5wdXNoKG5ld0FwdCk7XHJcbiAgICAgICAgICAgICAgICAvLyBub3csIHJlc2V0XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5ld0FwcG9pbnRtZW50KG51bGwpO1xyXG4gICAgICAgICAgICAgICAgLy8gY3VycmVudCBpbmRleCBtdXN0IGJlIHRoZSBqdXN0LWFkZGVkIGFwdFxyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50SW5kZXgodGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gT24gYWRkaW5nIGEgbmV3IG9uZSwgdGhlIGNvbmZpcm1hdGlvbiBwYWdlIG11c3QgYmUgc2hvd2VkXHJcbiAgICAgICAgICAgICAgICBhcHAuc2hlbGwuZ28oJ2Jvb2tpbmdDb25maXJtYXRpb24nLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgYm9va2luZzogbmV3QXB0XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5lZGl0TW9kZShmYWxzZSk7XHJcbiAgICAgICAgfS5iaW5kKGFwcG9pbnRtZW50c0RhdGFWaWV3KTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5lZGl0TW9kZS5zdWJzY3JpYmUoZnVuY3Rpb24oaXNFZGl0KSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLiRhY3Rpdml0eS50b2dnbGVDbGFzcygnaW4tZWRpdCcsIGlzRWRpdCk7XHJcbiAgICAgICAgICAgIHRoaXMuJGFwcG9pbnRtZW50Vmlldy5maW5kKCcuQXBwb2ludG1lbnRDYXJkJykudG9nZ2xlQ2xhc3MoJ2luLWVkaXQnLCBpc0VkaXQpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGlzRWRpdCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGEgY29weSBvZiB0aGUgYXBwb2ludG1lbnQgc28gd2UgcmV2ZXJ0IG9uICdjYW5jZWwnXHJcbiAgICAgICAgICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5vcmlnaW5hbEVkaXRlZEFwcG9pbnRtZW50ID0gXHJcbiAgICAgICAgICAgICAgICAgICAga28udG9KUyhhcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50QXBwb2ludG1lbnQoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50RGF0ZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIGFwdCA9IHRoaXMuY3VycmVudEFwcG9pbnRtZW50KCksXHJcbiAgICAgICAgICAgICAgICBqdXN0RGF0ZSA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICBpZiAoYXB0ICYmIGFwdC5zdGFydFRpbWUoKSlcclxuICAgICAgICAgICAgICAgIGp1c3REYXRlID0gbW9tZW50KGFwdC5zdGFydFRpbWUoKSkuaG91cnMoMCkubWludXRlcygwKS5zZWNvbmRzKDApLnRvRGF0ZSgpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIGp1c3REYXRlO1xyXG4gICAgICAgIH0sIGFwcG9pbnRtZW50c0RhdGFWaWV3KTtcclxuICAgICAgICBcclxuICAgICAgICAvKipcclxuICAgICAgICAgICAgRXh0ZXJuYWwgYWN0aW9uc1xyXG4gICAgICAgICoqL1xyXG4gICAgICAgIHZhciBlZGl0RmllbGRPbiA9IGZ1bmN0aW9uIGVkaXRGaWVsZE9uKGFjdGl2aXR5LCBkYXRhKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBJbmNsdWRlIGFwcG9pbnRtZW50IHRvIHJlY292ZXIgc3RhdGUgb24gcmV0dXJuOlxyXG4gICAgICAgICAgICBkYXRhLmFwcG9pbnRtZW50ID0gYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50KCkubW9kZWwudG9QbGFpbk9iamVjdCh0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIGFwcC5zaGVsbC5nbyhhY3Rpdml0eSwgZGF0YSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5waWNrRGF0ZVRpbWUgPSBmdW5jdGlvbiBwaWNrRGF0ZVRpbWUoKSB7XHJcblxyXG4gICAgICAgICAgICBlZGl0RmllbGRPbignZGF0ZXRpbWVQaWNrZXInLCB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RlZERhdGV0aW1lOiBudWxsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcucGlja0NsaWVudCA9IGZ1bmN0aW9uIHBpY2tDbGllbnQoKSB7XHJcblxyXG4gICAgICAgICAgICBlZGl0RmllbGRPbignY2xpZW50cycsIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdENsaWVudDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHNlbGVjdGVkQ2xpZW50OiBudWxsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LnBpY2tTZXJ2aWNlID0gZnVuY3Rpb24gcGlja1NlcnZpY2UoKSB7XHJcblxyXG4gICAgICAgICAgICBlZGl0RmllbGRPbignc2VydmljZXMnLCB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RTZXJ2aWNlczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHNlbGVjdGVkU2VydmljZXM6IGFwcG9pbnRtZW50c0RhdGFWaWV3LmN1cnJlbnRBcHBvaW50bWVudCgpLnNlcnZpY2VzKClcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuY2hhbmdlUHJpY2UgPSBmdW5jdGlvbiBjaGFuZ2VQcmljZSgpIHtcclxuICAgICAgICAgICAgLy8gVE9ET1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcucGlja0xvY2F0aW9uID0gZnVuY3Rpb24gcGlja0xvY2F0aW9uKCkge1xyXG5cclxuICAgICAgICAgICAgZWRpdEZpZWxkT24oJ2xvY2F0aW9ucycsIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdExvY2F0aW9uOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRMb2NhdGlvbjogYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50KCkubG9jYXRpb24oKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgdGV4dEZpZWxkc0hlYWRlcnMgPSB7XHJcbiAgICAgICAgICAgIHByZU5vdGVzVG9DbGllbnQ6ICdOb3RlcyB0byBjbGllbnQnLFxyXG4gICAgICAgICAgICBwb3N0Tm90ZXNUb0NsaWVudDogJ05vdGVzIHRvIGNsaWVudCAoYWZ0ZXJ3YXJkcyknLFxyXG4gICAgICAgICAgICBwcmVOb3Rlc1RvU2VsZjogJ05vdGVzIHRvIHNlbGYnLFxyXG4gICAgICAgICAgICBwb3N0Tm90ZXNUb1NlbGY6ICdCb29raW5nIHN1bW1hcnknXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5lZGl0VGV4dEZpZWxkID0gZnVuY3Rpb24gZWRpdFRleHRGaWVsZChmaWVsZCkge1xyXG5cclxuICAgICAgICAgICAgZWRpdEZpZWxkT24oJ3RleHRFZGl0b3InLCB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0OiAndGV4dEVkaXRvcicsXHJcbiAgICAgICAgICAgICAgICBmaWVsZDogZmllbGQsXHJcbiAgICAgICAgICAgICAgICB0aXRsZTogYXBwb2ludG1lbnRzRGF0YVZpZXcuaXNOZXcoKSA/ICdOZXcgYm9va2luZycgOiAnQm9va2luZycsXHJcbiAgICAgICAgICAgICAgICBoZWFkZXI6IHRleHRGaWVsZHNIZWFkZXJzW2ZpZWxkXSxcclxuICAgICAgICAgICAgICAgIHRleHQ6IGFwcG9pbnRtZW50c0RhdGFWaWV3LmN1cnJlbnRBcHBvaW50bWVudCgpW2ZpZWxkXSgpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKTtcclxuICAgIH1cclxufTtcclxuIiwiLyoqXHJcbiAgICBCb29rTWVCdXR0b24gYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBCb29rTWVCdXR0b25BY3Rpdml0eSgpIHtcclxuICAgIFxyXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIFxyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xyXG5cclxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignU2NoZWR1bGluZycpO1xyXG4gICAgXHJcbiAgICAvLyBBdXRvIHNlbGVjdCB0ZXh0IG9uIHRleHRhcmVhLCBmb3IgYmV0dGVyICdjb3B5J1xyXG4gICAgLy8gTk9URTogdGhlICdzZWxlY3QnIG11c3QgaGFwcGVuIG9uIGNsaWNrLCBub3QgdGFwLCBub3QgZm9jdXMsXHJcbiAgICAvLyBvbmx5ICdjbGljaycgaXMgcmVsaWFibGUgYW5kIGJ1Zy1mcmVlLlxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy4kYWN0aXZpdHksXHJcbiAgICAgICAgZXZlbnQ6ICdjbGljaycsXHJcbiAgICAgICAgc2VsZWN0b3I6ICd0ZXh0YXJlYScsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICQodGhpcykuc2VsZWN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMuYXBwLm1vZGVsLm1hcmtldHBsYWNlUHJvZmlsZSxcclxuICAgICAgICBldmVudDogJ2Vycm9yJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgaWYgKGVyciAmJiBlcnIudGFzayA9PT0gJ3NhdmUnKSByZXR1cm47XHJcbiAgICAgICAgICAgIHZhciBtc2cgPSAnRXJyb3IgbG9hZGluZyBkYXRhIHRvIGJ1aWxkIHRoZSBCdXR0b24uJztcclxuICAgICAgICAgICAgdGhpcy5hcHAubW9kYWxzLnNob3dFcnJvcih7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogbXNnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVyciAmJiBlcnIudGFzayAmJiBlcnIuZXJyb3IgfHwgZXJyXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xyXG4gICAgXHJcbiAgICAvLyBLZWVwIGRhdGEgdXBkYXRlZDpcclxuICAgIHRoaXMuYXBwLm1vZGVsLm1hcmtldHBsYWNlUHJvZmlsZS5zeW5jKCk7XHJcbiAgICBcclxuICAgIC8vIFNldCB0aGUgam9iIHRpdGxlXHJcbiAgICB2YXIgam9iSUQgPSBzdGF0ZS5yb3V0ZS5zZWdtZW50c1swXSB8MDtcclxuICAgIHRoaXMudmlld01vZGVsLmpvYlRpdGxlSUQoam9iSUQpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKGFwcCkge1xyXG5cclxuICAgIHZhciBtYXJrZXRwbGFjZVByb2ZpbGUgPSBhcHAubW9kZWwubWFya2V0cGxhY2VQcm9maWxlO1xyXG4gICAgXHJcbiAgICAvLyBBY3R1YWwgZGF0YSBmb3IgdGhlIGZvcm06XHJcbiAgICBcclxuICAgIC8vIFJlYWQtb25seSBib29rQ29kZVxyXG4gICAgdGhpcy5ib29rQ29kZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBtYXJrZXRwbGFjZVByb2ZpbGUuZGF0YS5ib29rQ29kZSgpO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMuam9iVGl0bGVJRCA9IGtvLm9ic2VydmFibGUoMCk7XHJcbiAgICBcclxuICAgIC8vIEJ1dHRvbiB0eXBlLCBjYW4gYmU6ICdzbWFsbCcsICdtZWRpdW0nLCAnbGFyZ2UnLCAnbGluaydcclxuICAgIHRoaXMudHlwZSA9IGtvLm9ic2VydmFibGUoJ21lZGl1bScpO1xyXG5cclxuICAgIHRoaXMuaXNMb2NrZWQgPSBtYXJrZXRwbGFjZVByb2ZpbGUuaXNMb2NrZWQ7XHJcbiAgICBcclxuICAgIC8vIEdlbmVyYXRpb24gb2YgdGhlIGJ1dHRvbiBjb2RlXHJcbiAgICBcclxuICAgIHZhciBidXR0b25UZW1wbGF0ZSA9XHJcbiAgICAgICAgJzwhLS0gYmVnaW4gTG9jb25vbWljcyBib29rLW1lLWJ1dHRvbiAtLT4nICtcclxuICAgICAgICAnPGEgc3R5bGU9XCJkaXNwbGF5OmlubGluZS1ibG9ja1wiPjxpbWcgYWx0PVwiXCIgc3R5bGU9XCJib3JkZXI6bm9uZVwiIC8+PC9hPicgKyBcclxuICAgICAgICAnPCEtLSBlbmQgTG9jb25vbWljcyBib29rLW1lLWJ1dHRvbiAtLT4nO1xyXG4gICAgXHJcbiAgICB2YXIgbGlua1RlbXBsYXRlID1cclxuICAgICAgICAnPCEtLSBiZWdpbiBMb2Nvbm9taWNzIGJvb2stbWUtYnV0dG9uIC0tPicgK1xyXG4gICAgICAgICc8YT48c3Bhbj48L3NwYW4+PC9hPicgK1xyXG4gICAgICAgICc8IS0tIGVuZCBMb2Nvbm9taWNzIGJvb2stbWUtYnV0dG9uIC0tPic7XHJcblxyXG4gICAgdGhpcy5idXR0b25IdG1sQ29kZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICBpZiAobWFya2V0cGxhY2VQcm9maWxlLmlzTG9hZGluZygpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnbG9hZGluZy4uLic7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgdHlwZSA9IHRoaXMudHlwZSgpLFxyXG4gICAgICAgICAgICAgICAgdHBsID0gYnV0dG9uVGVtcGxhdGU7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gJ2xpbmsnKVxyXG4gICAgICAgICAgICAgICAgdHBsID0gbGlua1RlbXBsYXRlO1xyXG5cclxuICAgICAgICAgICAgdmFyIHNpdGVVcmwgPSAkKCdodG1sJykuYXR0cignZGF0YS1zaXRlLXVybCcpLFxyXG4gICAgICAgICAgICAgICAgbGlua1VybCA9IHNpdGVVcmwgKyAnL2Jvb2svJyArIHRoaXMuYm9va0NvZGUoKSArICcvJyArIHRoaXMuam9iVGl0bGVJRCgpICsgJy8nLFxyXG4gICAgICAgICAgICAgICAgaW1nVXJsID0gc2l0ZVVybCArICcvaW1nL2V4dGVybi9ib29rLW1lLWJ1dHRvbi0nICsgdHlwZSArICcucG5nJztcclxuXHJcbiAgICAgICAgICAgIHZhciBjb2RlID0gZ2VuZXJhdGVCdXR0b25Db2RlKHtcclxuICAgICAgICAgICAgICAgIHRwbDogdHBsLFxyXG4gICAgICAgICAgICAgICAgbGFiZWw6ICdDbGljayBoZXJlIHRvIGJvb2sgbWUgbm93IChvbiBsb2Nvbm9taWNzLmNvbSknLFxyXG4gICAgICAgICAgICAgICAgbGlua1VybDogbGlua1VybCxcclxuICAgICAgICAgICAgICAgIGltZ1VybDogaW1nVXJsXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGNvZGU7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIC8vIFRPRE8gQ29weSBmZWF0dXJlOyB3aWxsIG5lZWQgYSBuYXRpdmUgcGx1Z2luXHJcbiAgICB0aGlzLmNvcHlDb2RlID0gZnVuY3Rpb24oKSB7IH07XHJcbiAgICBcclxuICAgIHRoaXMuc2VuZEJ5RW1haWwgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBUT0RPIFNlbmQgYnkgZW1haWwsIHdpdGggd2luZG93Lm9wZW4oJ21haWx0bzomYm9keT1jb2RlJyk7XHJcbiAgICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZW5lcmF0ZUJ1dHRvbkNvZGUob3B0aW9ucykge1xyXG5cclxuICAgIHZhciAkYnRuID0gJCgkLnBhcnNlSFRNTCgnPGRpdj4nICsgb3B0aW9ucy50cGwgKyAnPC9kaXY+JykpO1xyXG5cclxuICAgICRidG5cclxuICAgIC5maW5kKCdhJylcclxuICAgIC5hdHRyKCdocmVmJywgb3B0aW9ucy5saW5rVXJsKVxyXG4gICAgLmZpbmQoJ3NwYW4nKVxyXG4gICAgLnRleHQob3B0aW9ucy5sYWJlbCk7XHJcbiAgICAkYnRuXHJcbiAgICAuZmluZCgnaW1nJylcclxuICAgIC5hdHRyKCdzcmMnLCBvcHRpb25zLmltZ1VybClcclxuICAgIC5hdHRyKCdhbHQnLCBvcHRpb25zLmxhYmVsKTtcclxuXHJcbiAgICByZXR1cm4gJGJ0bi5odG1sKCk7XHJcbn1cclxuIiwiLyoqXHJcbiAgICBib29raW5nQ29uZmlybWF0aW9uIGFjdGl2aXR5XHJcbiAgICBcclxuICAgIFRPRE86IFRvIHJlcGxhY2VkIGJ5IGEgbW9kYWxcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbiAgICBcclxudmFyIHNpbmdsZXRvbiA9IG51bGw7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0Q2xpZW50cygkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXHJcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IEJvb2tpbmdDb25maXJtYXRpb25BY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XHJcbiAgICBcclxuICAgIHJldHVybiBzaW5nbGV0b247XHJcbn07XHJcblxyXG5mdW5jdGlvbiBCb29raW5nQ29uZmlybWF0aW9uQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XHJcbiAgICBcclxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xyXG4gICAgdGhpcy5hcHAgPSBhcHA7XHJcblxyXG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcclxuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XHJcbn1cclxuXHJcbkJvb2tpbmdDb25maXJtYXRpb25BY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG5cclxuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuYm9va2luZylcclxuICAgICAgICB0aGlzLmRhdGFWaWV3LmJvb2tpbmcob3B0aW9ucy5ib29raW5nKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcclxuXHJcbiAgICAvLyA6QXBwb2ludG1lbnRcclxuICAgIHRoaXMuYm9va2luZyA9IGtvLm9ic2VydmFibGUobnVsbCk7XHJcbn1cclxuIiwiLyoqIENhbGVuZGFyIGFjdGl2aXR5ICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBDYWxlbmRhclNsb3QgPSByZXF1aXJlKCcuLi9tb2RlbHMvQ2FsZW5kYXJTbG90Jyk7XHJcblxyXG5yZXF1aXJlKCcuLi9jb21wb25lbnRzL0RhdGVQaWNrZXInKTtcclxuXHJcbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcclxuXHJcbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBDYWxlbmRhckFjdGl2aXR5KCkge1xyXG4gICAgXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcclxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU2VjdGlvbk5hdkJhcignQ2FsZW5kYXInKTtcclxuXHJcbiAgICAvKiBHZXR0aW5nIGVsZW1lbnRzICovXHJcbiAgICB0aGlzLiRkYXRlcGlja2VyID0gdGhpcy4kYWN0aXZpdHkuZmluZCgnI2NhbGVuZGFyRGF0ZVBpY2tlcicpO1xyXG4gICAgdGhpcy4kZGFpbHlWaWV3ID0gdGhpcy4kYWN0aXZpdHkuZmluZCgnI2NhbGVuZGFyRGFpbHlWaWV3Jyk7XHJcbiAgICB0aGlzLiRkYXRlSGVhZGVyID0gdGhpcy4kYWN0aXZpdHkuZmluZCgnI2NhbGVuZGFyRGF0ZUhlYWRlcicpO1xyXG4gICAgdGhpcy4kZGF0ZVRpdGxlID0gdGhpcy4kZGF0ZUhlYWRlci5jaGlsZHJlbignLkNhbGVuZGFyRGF0ZUhlYWRlci1kYXRlJyk7XHJcbiAgICB0aGlzLiRjaG9vc2VOZXcgPSAkKCcjY2FsZW5kYXJDaG9vc2VOZXcnKTtcclxuICAgIFxyXG4gICAgLyogSW5pdCBjb21wb25lbnRzICovXHJcbiAgICB0aGlzLiRkYXRlcGlja2VyLnNob3coKS5kYXRlcGlja2VyKCk7XHJcblxyXG4gICAgLy8gVGVzdGluZyBkYXRhXHJcbiAgICB0aGlzLnZpZXdNb2RlbC5zbG90c0RhdGEocmVxdWlyZSgnLi4vdGVzdGRhdGEvY2FsZW5kYXJTbG90cycpLmNhbGVuZGFyKTtcclxuICAgIFxyXG4gICAgLyogRXZlbnQgaGFuZGxlcnMgKi9cclxuICAgIC8vIENoYW5nZXMgb24gY3VycmVudERhdGVcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLmN1cnJlbnREYXRlLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgICAgICAgICAgLy8gVHJpZ2dlciBhIGxheW91dCB1cGRhdGUsIHJlcXVpcmVkIGJ5IHRoZSBmdWxsLWhlaWdodCBmZWF0dXJlXHJcbiAgICAgICAgICAgICQod2luZG93KS50cmlnZ2VyKCdsYXlvdXRVcGRhdGUnKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChkYXRlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbWRhdGUgPSBtb21lbnQoZGF0ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG1kYXRlLmlzVmFsaWQoKSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgaXNvRGF0ZSA9IG1kYXRlLnRvSVNPU3RyaW5nKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBkYXRlcGlja2VyIHNlbGVjdGVkIGRhdGUgb24gZGF0ZSBjaGFuZ2UgKGZyb20gXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYSBkaWZmZXJlbnQgc291cmNlIHRoYW4gdGhlIGRhdGVwaWNrZXIgaXRzZWxmXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5yZW1vdmVDbGFzcygnaXMtdmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENoYW5nZSBub3QgZnJvbSB0aGUgd2lkZ2V0P1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLiRkYXRlcGlja2VyLmRhdGVwaWNrZXIoJ2dldFZhbHVlJykudG9JU09TdHJpbmcoKSAhPT0gaXNvRGF0ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdzZXRWYWx1ZScsIGRhdGUsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBPbiBjdXJyZW50RGF0ZSBjaGFuZ2VzLCB1cGRhdGUgdGhlIFVSTFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHNhdmUgYSB1c2VmdWwgc3RhdGVcclxuICAgICAgICAgICAgICAgICAgICAvLyBET1VCVDogcHVzaCBvciByZXBsYWNlIHN0YXRlPyAobW9yZSBoaXN0b3J5IGVudHJpZXMgb3IgdGhlIHNhbWU/KVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsICdjYWxlbmRhci8nICsgaXNvRGF0ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIERPTkVcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFNvbWV0aGluZyBmYWlsLCBiYWQgZGF0ZSBvciBub3QgZGF0ZSBhdCBhbGxcclxuICAgICAgICAgICAgLy8gU2V0IHRoZSBjdXJyZW50IFxyXG4gICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5jdXJyZW50RGF0ZShuZXcgRGF0ZSgpKTtcclxuXHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTd2lwZSBkYXRlIG9uIGdlc3R1cmVcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMuJGRhaWx5VmlldyxcclxuICAgICAgICBldmVudDogJ3N3aXBlbGVmdCBzd2lwZXJpZ2h0JyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBkaXIgPSBlLnR5cGUgPT09ICdzd2lwZWxlZnQnID8gJ25leHQnIDogJ3ByZXYnO1xyXG5cclxuICAgICAgICAgICAgLy8gSGFjayB0byBzb2x2ZSB0aGUgZnJlZXp5LXN3aXBlIGFuZCB0YXAtYWZ0ZXIgYnVnIG9uIEpRTTpcclxuICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcigndG91Y2hlbmQnKTtcclxuICAgICAgICAgICAgLy8gQ2hhbmdlIGRhdGVcclxuICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCBkaXIsICdkYXRlJyk7XHJcblxyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ2hhbmdpbmcgZGF0ZSB3aXRoIGJ1dHRvbnM6XHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLiRkYXRlSGVhZGVyLFxyXG4gICAgICAgIGV2ZW50OiAndGFwJyxcclxuICAgICAgICBzZWxlY3RvcjogJy5DYWxlbmRhckRhdGVIZWFkZXItc3dpdGNoJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoZS5jdXJyZW50VGFyZ2V0LmdldEF0dHJpYnV0ZSgnaHJlZicpKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICcjcHJldic6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCAncHJldicsICdkYXRlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICcjbmV4dCc6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCAnbmV4dCcsICdkYXRlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIExldHMgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU2hvd2luZyBkYXRlcGlja2VyIHdoZW4gcHJlc3NpbmcgdGhlIHRpdGxlXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLiRkYXRlVGl0bGUsXHJcbiAgICAgICAgZXZlbnQ6ICd0YXAnLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci50b2dnbGVDbGFzcygnaXMtdmlzaWJsZScpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBVcGRhdGluZyB2aWV3IGRhdGUgd2hlbiBwaWNrZWQgYW5vdGhlciBvbmVcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMuJGRhdGVwaWNrZXIsXHJcbiAgICAgICAgZXZlbnQ6ICdjaGFuZ2VEYXRlJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgIGlmIChlLnZpZXdNb2RlID09PSAnZGF5cycpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmN1cnJlbnREYXRlKGUuZGF0ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFNldCBkYXRlIHRvIG1hdGNoIGRhdGVwaWNrZXIgZm9yIGZpcnN0IHVwZGF0ZVxyXG4gICAgdGhpcy52aWV3TW9kZWwuY3VycmVudERhdGUodGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdnZXRWYWx1ZScpKTtcclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIG9wdGlvbnMpO1xyXG5cclxuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMucm91dGUgJiYgb3B0aW9ucy5yb3V0ZS5zZWdtZW50cykge1xyXG4gICAgICAgIHZhciBzZGF0ZSA9IG9wdGlvbnMucm91dGUuc2VnbWVudHNbMF0sXHJcbiAgICAgICAgICAgIG1kYXRlID0gbW9tZW50KHNkYXRlKSxcclxuICAgICAgICAgICAgZGF0ZSA9IG1kYXRlLmlzVmFsaWQoKSA/IG1kYXRlLnRvRGF0ZSgpIDogbnVsbDtcclxuXHJcbiAgICAgICAgaWYgKGRhdGUpXHJcbiAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmN1cnJlbnREYXRlKGRhdGUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIFRpbWUgPSByZXF1aXJlKCcuLi91dGlscy9UaW1lJyk7XHJcbmZ1bmN0aW9uIGNyZWF0ZUZyZWVTbG90KG9wdGlvbnMpIHtcclxuICAgIFxyXG4gICAgdmFyIHN0YXJ0ID0gb3B0aW9ucy5zdGFydCB8fCBuZXcgVGltZShvcHRpb25zLmRhdGUsIDAsIDAsIDApLFxyXG4gICAgICAgIGVuZCA9IG9wdGlvbnMuZW5kIHx8IG5ldyBUaW1lKG9wdGlvbnMuZGF0ZSwgMCwgMCwgMCk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogc3RhcnQsXHJcbiAgICAgICAgZW5kVGltZTogZW5kLFxyXG5cclxuICAgICAgICBzdWJqZWN0OiAnRnJlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyMhYXBwb2ludG1lbnQvMCcsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctc3VjY2VzcydcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb252ZXJ0RXZlbnRUb1Nsb3QoZXZlbnQsIGJvb2tpbmcpIHtcclxuXHJcbiAgICByZXR1cm4gbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBldmVudC5zdGFydFRpbWUoKSxcclxuICAgICAgICBlbmRUaW1lOiBldmVudC5lbmRUaW1lKCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogZXZlbnQuc3VtbWFyeSgpLCAvLyBGdWxsTmFtZVxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBldmVudC5kZXNjcmlwdGlvbigpLCAvLyAnRGVlcCBUaXNzdWUgTWFzc2FnZSBMb25nIE5hbWUnLFxyXG4gICAgICAgIGxpbms6ICcjIWFwcG9pbnRtZW50LycgKyBldmVudC5jYWxlbmRhckV2ZW50SUQoKSxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogYm9va2luZyA9PT0gbnVsbCA/ICdnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tcmlnaHQnIDogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiBib29raW5nID09PSBudWxsID8gbnVsbCA6IChib29raW5nICYmIGJvb2tpbmcuYm9va2luZ1JlcXVlc3QgJiYgYm9va2luZy5ib29raW5nUmVxdWVzdC5wcmljaW5nRXN0aW1hdGUudG90YWxQcmljZSB8fCAnJDAuMDAnKSxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbChhcHApIHtcclxuXHJcbiAgICB0aGlzLnNsb3RzRGF0YSA9IGtvLm9ic2VydmFibGUoe30pO1xyXG4gICAgdGhpcy5jdXJyZW50RGF0ZSA9IGtvLm9ic2VydmFibGUobmV3IERhdGUoKSk7XHJcbiAgICB2YXIgZnVsbERheUZyZWUgPSBbY3JlYXRlRnJlZVNsb3QoeyBkYXRlOiB0aGlzLmN1cnJlbnREYXRlKCkgfSldO1xyXG5cclxuICAgIHRoaXMuc2xvdHMgPSBrby5vYnNlcnZhYmxlQXJyYXkoZnVsbERheUZyZWUpO1xyXG4gICAgXHJcbiAgICB0aGlzLmlzTG9hZGluZyA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgXHJcbiAgICAvLyBVcGRhdGUgY3VycmVudCBzbG90cyBvbiBkYXRlIGNoYW5nZVxyXG4gICAgdmFyIHByZXZpb3VzRGF0ZSA9IHRoaXMuY3VycmVudERhdGUoKS50b0lTT1N0cmluZygpO1xyXG4gICAgdGhpcy5jdXJyZW50RGF0ZS5zdWJzY3JpYmUoZnVuY3Rpb24gKGRhdGUpIHtcclxuICAgICAgICBcclxuICAgICAgICAvLyBJTVBPUlRBTlQ6IFRoZSBkYXRlIG9iamVjdCBtYXkgYmUgcmV1c2VkIGFuZCBtdXRhdGVkIGJldHdlZW4gY2FsbHNcclxuICAgICAgICAvLyAobW9zdGx5IGJlY2F1c2UgdGhlIHdpZGdldCBJIHRoaW5rKSwgc28gaXMgYmV0dGVyIHRvIGNyZWF0ZVxyXG4gICAgICAgIC8vIGEgY2xvbmUgYW5kIGF2b2lkIGdldHRpbmcgcmFjZS1jb25kaXRpb25zIGluIHRoZSBkYXRhIGRvd25sb2FkaW5nLlxyXG4gICAgICAgIGRhdGUgPSBuZXcgRGF0ZShEYXRlLnBhcnNlKGRhdGUudG9JU09TdHJpbmcoKSkpO1xyXG5cclxuICAgICAgICAvLyBBdm9pZCBkdXBsaWNhdGVkIG5vdGlmaWNhdGlvbiwgdW4tY2hhbmdlZCBkYXRlXHJcbiAgICAgICAgaWYgKGRhdGUudG9JU09TdHJpbmcoKSA9PT0gcHJldmlvdXNEYXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJldmlvdXNEYXRlID0gZGF0ZS50b0lTT1N0cmluZygpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBtZGF0ZSA9IG1vbWVudChkYXRlKSxcclxuICAgICAgICAgICAgc2RhdGUgPSBtZGF0ZS5mb3JtYXQoJ1lZWVlNTUREJyk7XHJcblxyXG4gICAgICAgIHRoaXMuaXNMb2FkaW5nKHRydWUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIFByb21pc2UuYWxsKFtcclxuICAgICAgICAgICAgYXBwLm1vZGVsLmJvb2tpbmdzLmdldEJvb2tpbmdzQnlEYXRlKGRhdGUpLFxyXG4gICAgICAgICAgICBhcHAubW9kZWwuY2FsZW5kYXJFdmVudHMuZ2V0RXZlbnRzQnlEYXRlKGRhdGUpXHJcbiAgICAgICAgXSkudGhlbihmdW5jdGlvbihncm91cCkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gSU1QT1JUQU5UOiBGaXJzdCwgd2UgbmVlZCB0byBjaGVjayB0aGF0IHdlIGFyZVxyXG4gICAgICAgICAgICAvLyBpbiB0aGUgc2FtZSBkYXRlIHN0aWxsLCBiZWNhdXNlIHNldmVyYWwgbG9hZGluZ3NcclxuICAgICAgICAgICAgLy8gY2FuIGhhcHBlbiBhdCBhIHRpbWUgKGNoYW5naW5nIHF1aWNrbHkgZnJvbSBkYXRlIHRvIGRhdGVcclxuICAgICAgICAgICAgLy8gd2l0aG91dCB3YWl0IGZvciBmaW5pc2gpLCBhdm9pZGluZyBhIHJhY2UtY29uZGl0aW9uXHJcbiAgICAgICAgICAgIC8vIHRoYXQgY3JlYXRlIGZsaWNrZXJpbmcgZWZmZWN0cyBvciByZXBsYWNlIHRoZSBkYXRlIGV2ZW50c1xyXG4gICAgICAgICAgICAvLyBieSB0aGUgZXZlbnRzIGZyb20gb3RoZXIgZGF0ZSwgYmVjYXVzZSBpdCB0b29rcyBtb3JlIGFuIGNoYW5nZWQuXHJcbiAgICAgICAgICAgIC8vIFRPRE86IHN0aWxsIHRoaXMgaGFzIHRoZSBtaW5vciBidWcgb2YgbG9zaW5nIHRoZSBpc0xvYWRpbmdcclxuICAgICAgICAgICAgLy8gaWYgYSBwcmV2aW91cyB0cmlnZ2VyZWQgbG9hZCBzdGlsbCBkaWRuJ3QgZmluaXNoZWQ7IGl0cyBtaW5vclxyXG4gICAgICAgICAgICAvLyBiZWNhdXNlIGlzIHZlcnkgcmFyZSB0aGF0IGhhcHBlbnMsIG1vdmluZyB0aGlzIHN0dWZmXHJcbiAgICAgICAgICAgIC8vIHRvIGEgc3BlY2lhbCBhcHBNb2RlbCBmb3IgbWl4ZWQgYm9va2luZ3MgYW5kIGV2ZW50cyB3aXRoIFxyXG4gICAgICAgICAgICAvLyBwZXIgZGF0ZSBjYWNoZSB0aGF0IGluY2x1ZGVzIGEgdmlldyBvYmplY3Qgd2l0aCBpc0xvYWRpbmcgd2lsbFxyXG4gICAgICAgICAgICAvLyBmaXggaXQgYW5kIHJlZHVjZSB0aGlzIGNvbXBsZXhpdHkuXHJcbiAgICAgICAgICAgIGlmIChkYXRlLnRvSVNPU3RyaW5nKCkgIT09IHRoaXMuY3VycmVudERhdGUoKS50b0lTT1N0cmluZygpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBSYWNlIGNvbmRpdGlvbiwgbm90IHRoZSBzYW1lISEgb3V0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgZXZlbnRzID0gZ3JvdXBbMV0sXHJcbiAgICAgICAgICAgICAgICBib29raW5ncyA9IGdyb3VwWzBdO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGV2ZW50cyAmJiBldmVudHMoKS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2xvdHMoZXZlbnRzKCkubWFwKGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJvb2tpbmcgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIGJvb2tpbmdzKCkuc29tZShmdW5jdGlvbihzZWFyY2hCb29raW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmb3VuZCA9IHNlYXJjaEJvb2tpbmcuY29uZmlybWVkRGF0ZUlEKCkgPT09IGV2ZW50LmNhbGVuZGFyRXZlbnRJRCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvb2tpbmcgPSBzZWFyY2hCb29raW5nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udmVydEV2ZW50VG9TbG90KGV2ZW50LCBib29raW5nKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzTG9hZGluZyhmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNsb3RzKGZ1bGxEYXlGcmVlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9LmJpbmQodGhpcykpXHJcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gU2hvdyBmcmVlIG9uIGVycm9yXHJcbiAgICAgICAgICAgIHRoaXMuc2xvdHMoZnVsbERheUZyZWUpO1xyXG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZyhmYWxzZSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgbXNnID0gJ0Vycm9yIGxvYWRpbmcgY2FsZW5kYXIgZXZlbnRzLic7XHJcbiAgICAgICAgICAgIGFwcC5tb2RhbHMuc2hvd0Vycm9yKHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBtc2csXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyICYmIGVyci5lcnJvciB8fCBlcnJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLypcclxuICAgICAgICB2YXIgc2xvdHMgPSB0aGlzLnNsb3RzRGF0YSgpO1xyXG4gICAgICAgIGlmIChzbG90cy5oYXNPd25Qcm9wZXJ0eShzZGF0ZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5zbG90cyhzbG90c1tzZGF0ZV0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2xvdHMoc2xvdHNbJ2RlZmF1bHQnXSk7XHJcbiAgICAgICAgfSovXHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59XHJcbiIsIi8qKlxyXG4gICAgQ2FsZW5kYXJTeW5jaW5nIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5JyksXHJcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBDYWxlbmRhclN5bmNpbmdBY3Rpdml0eSgpIHtcclxuICAgIFxyXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIFxyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xyXG5cclxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignU2NoZWR1bGluZycpO1xyXG4gICAgXHJcbiAgICAvLyBBZGRpbmcgYXV0by1zZWxlY3QgYmVoYXZpb3IgdG8gdGhlIGV4cG9ydCBVUkxcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNjYWxlbmRhclN5bmMtaWNhbEV4cG9ydFVybCcpLFxyXG4gICAgICAgIGV2ZW50OiAnY2xpY2snLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAkKHRoaXMpLnNlbGVjdCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLmFwcC5tb2RlbC5jYWxlbmRhclN5bmNpbmcsXHJcbiAgICAgICAgZXZlbnQ6ICdlcnJvcicsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgIHZhciBtc2cgPSBlcnIudGFzayA9PT0gJ3NhdmUnID8gJ0Vycm9yIHNhdmluZyBjYWxlbmRhciBzeW5jaW5nIHNldHRpbmdzLicgOiAnRXJyb3IgbG9hZGluZyBjYWxlbmRhciBzeW5jaW5nIHNldHRpbmdzLic7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLm1vZGFscy5zaG93RXJyb3Ioe1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IG1zZyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnIgJiYgZXJyLnRhc2sgJiYgZXJyLmVycm9yIHx8IGVyclxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG59KTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcclxuXHJcbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KHN0YXRlKSB7XHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcclxuICAgIFxyXG4gICAgLy8gS2VlcCBkYXRhIHVwZGF0ZWQ6XHJcbiAgICB0aGlzLmFwcC5tb2RlbC5jYWxlbmRhclN5bmNpbmcuc3luYygpO1xyXG4gICAgLy8gRGlzY2FyZCBhbnkgcHJldmlvdXMgdW5zYXZlZCBlZGl0XHJcbiAgICB0aGlzLnZpZXdNb2RlbC5kaXNjYXJkKCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoYXBwKSB7XHJcblxyXG4gICAgdmFyIGNhbGVuZGFyU3luY2luZyA9IGFwcC5tb2RlbC5jYWxlbmRhclN5bmNpbmc7XHJcblxyXG4gICAgdmFyIHN5bmNWZXJzaW9uID0gY2FsZW5kYXJTeW5jaW5nLm5ld1ZlcnNpb24oKTtcclxuICAgIHN5bmNWZXJzaW9uLmlzT2Jzb2xldGUuc3Vic2NyaWJlKGZ1bmN0aW9uKGl0SXMpIHtcclxuICAgICAgICBpZiAoaXRJcykge1xyXG4gICAgICAgICAgICAvLyBuZXcgdmVyc2lvbiBmcm9tIHNlcnZlciB3aGlsZSBlZGl0aW5nXHJcbiAgICAgICAgICAgIC8vIEZVVFVSRTogd2FybiBhYm91dCBhIG5ldyByZW1vdGUgdmVyc2lvbiBhc2tpbmdcclxuICAgICAgICAgICAgLy8gY29uZmlybWF0aW9uIHRvIGxvYWQgdGhlbSBvciBkaXNjYXJkIGFuZCBvdmVyd3JpdGUgdGhlbTtcclxuICAgICAgICAgICAgLy8gdGhlIHNhbWUgaXMgbmVlZCBvbiBzYXZlKCksIGFuZCBvbiBzZXJ2ZXIgcmVzcG9uc2VcclxuICAgICAgICAgICAgLy8gd2l0aCBhIDUwOTpDb25mbGljdCBzdGF0dXMgKGl0cyBib2R5IG11c3QgY29udGFpbiB0aGVcclxuICAgICAgICAgICAgLy8gc2VydmVyIHZlcnNpb24pLlxyXG4gICAgICAgICAgICAvLyBSaWdodCBub3csIGp1c3Qgb3ZlcndyaXRlIGN1cnJlbnQgY2hhbmdlcyB3aXRoXHJcbiAgICAgICAgICAgIC8vIHJlbW90ZSBvbmVzOlxyXG4gICAgICAgICAgICBzeW5jVmVyc2lvbi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEFjdHVhbCBkYXRhIGZvciB0aGUgZm9ybTpcclxuICAgIHRoaXMuc3luYyA9IHN5bmNWZXJzaW9uLnZlcnNpb247XHJcblxyXG4gICAgdGhpcy5pc0xvY2tlZCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pc0xvY2tlZCgpIHx8IHRoaXMuaXNSZXNldGluZygpO1xyXG4gICAgfSwgY2FsZW5kYXJTeW5jaW5nKTtcclxuXHJcbiAgICB0aGlzLnN1Ym1pdFRleHQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcoKSA/IFxyXG4gICAgICAgICAgICAgICAgJ2xvYWRpbmcuLi4nIDogXHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzU2F2aW5nKCkgPyBcclxuICAgICAgICAgICAgICAgICAgICAnc2F2aW5nLi4uJyA6IFxyXG4gICAgICAgICAgICAgICAgICAgICdTYXZlJ1xyXG4gICAgICAgICk7XHJcbiAgICB9LCBjYWxlbmRhclN5bmNpbmcpO1xyXG4gICAgXHJcbiAgICB0aGlzLnJlc2V0VGV4dCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmlzUmVzZXRpbmcoKSA/IFxyXG4gICAgICAgICAgICAgICAgJ3Jlc2V0aW5nLi4uJyA6IFxyXG4gICAgICAgICAgICAgICAgJ1Jlc2V0IFByaXZhdGUgVVJMJ1xyXG4gICAgICAgICk7XHJcbiAgICB9LCBjYWxlbmRhclN5bmNpbmcpO1xyXG4gICAgXHJcbiAgICB0aGlzLmRpc2NhcmQgPSBmdW5jdGlvbiBkaXNjYXJkKCkge1xyXG4gICAgICAgIHN5bmNWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgICAgICAvLyBGb3JjZSB0byBzYXZlLCBldmVuIGlmIHRoZXJlIHdhcyByZW1vdGUgdXBkYXRlc1xyXG4gICAgICAgIHN5bmNWZXJzaW9uLnB1c2goeyBldmVuSWZPYnNvbGV0ZTogdHJ1ZSB9KTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIHRoaXMucmVzZXQgPSBmdW5jdGlvbiByZXNldCgpIHtcclxuICAgICAgICBjYWxlbmRhclN5bmNpbmcucmVzZXRFeHBvcnRVcmwoKTtcclxuICAgIH07XHJcbn1cclxuIiwiLyoqXG4gICAgQ2xpZW50RWRpdGlvbiBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIENsaWVudEVkaXRpb25BY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIFxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCgpO1xuICAgIFxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignY2xpZW50cycpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcbnZhciBDbGllbnQgPSByZXF1aXJlKCcuLi9tb2RlbHMvQ2xpZW50Jyk7XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcbiAgICBcbiAgICB0aGlzLmNsaWVudCA9IGtvLm9ic2VydmFibGUobmV3IENsaWVudCgpKTtcbiAgICBcbiAgICB0aGlzLmhlYWRlciA9IGtvLm9ic2VydmFibGUoJ0VkaXQgTG9jYXRpb24nKTtcbiAgICBcbiAgICAvLyBUT0RPXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24oKSB7fTtcbiAgICB0aGlzLmNhbmNlbCA9IGZ1bmN0aW9uKCkge307XG59XG4iLCIvKipcclxuICAgIGNsaWVudHMgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcclxuXHJcbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBDbGllbnRzQWN0aXZpdHkoKSB7XHJcbiAgICBcclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkZyZWVsYW5jZXI7XHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApOyAgICBcclxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignQ2xpZW50cycpO1xyXG4gICAgXHJcbiAgICAvLyBHZXR0aW5nIGVsZW1lbnRzXHJcbiAgICB0aGlzLiRpbmRleCA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNjbGllbnRzSW5kZXgnKTtcclxuICAgIHRoaXMuJGxpc3RWaWV3ID0gdGhpcy4kYWN0aXZpdHkuZmluZCgnI2NsaWVudHNMaXN0VmlldycpO1xyXG4gICAgXHJcbiAgICAvLyBUZXN0aW5nRGF0YVxyXG4gICAgdGhpcy52aWV3TW9kZWwuY2xpZW50cyhyZXF1aXJlKCcuLi90ZXN0ZGF0YS9jbGllbnRzJykuY2xpZW50cyk7XHJcbiAgICBcclxuICAgIC8vIEhhbmRsZXIgdG8gdXBkYXRlIGhlYWRlciBiYXNlZCBvbiBhIG1vZGUgY2hhbmdlOlxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwuaXNTZWxlY3Rpb25Nb2RlLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uIChpdElzKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmhlYWRlclRleHQoaXRJcyA/ICdTZWxlY3QgYSBjbGllbnQnIDogJycpO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gSGFuZGxlciB0byBnbyBiYWNrIHdpdGggdGhlIHNlbGVjdGVkIGNsaWVudCB3aGVuIFxyXG4gICAgLy8gdGhlcmUgaXMgb25lIHNlbGVjdGVkIGFuZCByZXF1ZXN0RGF0YSBpcyBmb3JcclxuICAgIC8vICdzZWxlY3QgbW9kZSdcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLnNlbGVjdGVkQ2xpZW50LFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uICh0aGVTZWxlY3RlZENsaWVudCkge1xyXG4gICAgICAgICAgICAvLyBXZSBoYXZlIGEgcmVxdWVzdCBhbmRcclxuICAgICAgICAgICAgLy8gaXQgcmVxdWVzdGVkIHRvIHNlbGVjdCBhIGNsaWVudCxcclxuICAgICAgICAgICAgLy8gYW5kIGEgc2VsZWN0ZWQgY2xpZW50XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnJlcXVlc3REYXRhICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3REYXRhLnNlbGVjdENsaWVudCA9PT0gdHJ1ZSAmJlxyXG4gICAgICAgICAgICAgICAgdGhlU2VsZWN0ZWRDbGllbnQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBQYXNzIHRoZSBzZWxlY3RlZCBjbGllbnQgaW4gdGhlIGluZm9cclxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdERhdGEuc2VsZWN0ZWRDbGllbnQgPSB0aGVTZWxlY3RlZENsaWVudDtcclxuICAgICAgICAgICAgICAgIC8vIEFuZCBnbyBiYWNrXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5zaGVsbC5nb0JhY2sodGhpcy5yZXF1ZXN0RGF0YSk7XHJcbiAgICAgICAgICAgICAgICAvLyBMYXN0LCBjbGVhciByZXF1ZXN0RGF0YVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RGF0YSA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBUT0RPOiBjaGVjayBlcnJvcnMgZnJvbSBsb2FkaW5nLCB3aWxsIGJlIFJlbW90ZU1vZGVsPz9cclxuICAgIC8qdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy5hcHAubW9kZWwuY2xpZW50cyxcclxuICAgICAgICBldmVudDogJ2Vycm9yJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgaWYgKGVyci50YXNrID09PSAnc2F2ZScpIHJldHVybjtcclxuICAgICAgICAgICAgdmFyIG1zZyA9ICdFcnJvciBsb2FkaW5nIGNsaWVudHMuJztcclxuICAgICAgICAgICAgdGhpcy5hcHAubW9kYWxzLnNob3dFcnJvcih7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogbXNnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVyciAmJiBlcnIudGFzayAmJiBlcnIuZXJyb3IgfHwgZXJyXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7Ki9cclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhzdGF0ZSkge1xyXG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBzdGF0ZSk7XHJcbiAgICBcclxuICAgIC8vIE9uIGV2ZXJ5IHNob3csIHNlYXJjaCBnZXRzIHJlc2V0ZWRcclxuICAgIHRoaXMudmlld01vZGVsLnNlYXJjaFRleHQoJycpO1xyXG4gICAgXHJcbiAgICAvLyBTZXQgc2VsZWN0aW9uOlxyXG4gICAgdGhpcy52aWV3TW9kZWwuaXNTZWxlY3Rpb25Nb2RlKHN0YXRlLnNlbGVjdENsaWVudCA9PT0gdHJ1ZSk7XHJcbiAgICBcclxuICAgIC8vIEtlZXAgZGF0YSB1cGRhdGVkOlxyXG4gICAgLy8gVE9ETzogYXMgUmVtb3RlTW9kZWw/XHJcbiAgICAvL3RoaXMuYXBwLm1vZGVsLmNsaWVudHMuc3luYygpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJycpO1xyXG5cclxuICAgIC8vIEVzcGVjaWFsIG1vZGUgd2hlbiBpbnN0ZWFkIG9mIHBpY2sgYW5kIGVkaXQgd2UgYXJlIGp1c3Qgc2VsZWN0aW5nXHJcbiAgICAvLyAod2hlbiBlZGl0aW5nIGFuIGFwcG9pbnRtZW50KVxyXG4gICAgdGhpcy5pc1NlbGVjdGlvbk1vZGUgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuXHJcbiAgICAvLyBGdWxsIGxpc3Qgb2YgY2xpZW50c1xyXG4gICAgdGhpcy5jbGllbnRzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcclxuICAgIFxyXG4gICAgLy8gU2VhcmNoIHRleHQsIHVzZWQgdG8gZmlsdGVyICdjbGllbnRzJ1xyXG4gICAgdGhpcy5zZWFyY2hUZXh0ID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcbiAgICBcclxuICAgIC8vIFV0aWxpdHkgdG8gZ2V0IGEgZmlsdGVyZWQgbGlzdCBvZiBjbGllbnRzIGJhc2VkIG9uIGNsaWVudHNcclxuICAgIHRoaXMuZ2V0RmlsdGVyZWRMaXN0ID0gZnVuY3Rpb24gZ2V0RmlsdGVyZWRMaXN0KCkge1xyXG4gICAgICAgIHZhciBzID0gKHRoaXMuc2VhcmNoVGV4dCgpIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5jbGllbnRzKCkuZmlsdGVyKGZ1bmN0aW9uKGNsaWVudCkge1xyXG4gICAgICAgICAgICB2YXIgbiA9IGNsaWVudCAmJiBjbGllbnQuZnVsbE5hbWUoKSB8fCAnJztcclxuICAgICAgICAgICAgbiA9IG4udG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgcmV0dXJuIG4uaW5kZXhPZihzKSA+IC0xO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBGaWx0ZXJlZCBsaXN0IG9mIGNsaWVudHNcclxuICAgIHRoaXMuZmlsdGVyZWRDbGllbnRzID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RmlsdGVyZWRMaXN0KCk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgLy8gR3JvdXBlZCBsaXN0IG9mIGZpbHRlcmVkIGNsaWVudHNcclxuICAgIHRoaXMuZ3JvdXBlZENsaWVudHMgPSBrby5jb21wdXRlZChmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICB2YXIgY2xpZW50cyA9IHRoaXMuZmlsdGVyZWRDbGllbnRzKCkuc29ydChmdW5jdGlvbihjbGllbnRBLCBjbGllbnRCKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjbGllbnRBLmZpcnN0TmFtZSgpID4gY2xpZW50Qi5maXJzdE5hbWUoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgZ3JvdXBzID0gW10sXHJcbiAgICAgICAgICAgIGxhdGVzdEdyb3VwID0gbnVsbCxcclxuICAgICAgICAgICAgbGF0ZXN0TGV0dGVyID0gbnVsbDtcclxuXHJcbiAgICAgICAgY2xpZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGNsaWVudCkge1xyXG4gICAgICAgICAgICB2YXIgbGV0dGVyID0gKGNsaWVudC5maXJzdE5hbWUoKVswXSB8fCAnJykudG9VcHBlckNhc2UoKTtcclxuICAgICAgICAgICAgaWYgKGxldHRlciAhPT0gbGF0ZXN0TGV0dGVyKSB7XHJcbiAgICAgICAgICAgICAgICBsYXRlc3RHcm91cCA9IHtcclxuICAgICAgICAgICAgICAgICAgICBsZXR0ZXI6IGxldHRlcixcclxuICAgICAgICAgICAgICAgICAgICBjbGllbnRzOiBbY2xpZW50XVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGdyb3Vwcy5wdXNoKGxhdGVzdEdyb3VwKTtcclxuICAgICAgICAgICAgICAgIGxhdGVzdExldHRlciA9IGxldHRlcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxhdGVzdEdyb3VwLmNsaWVudHMucHVzaChjbGllbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBncm91cHM7XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2VsZWN0ZWRDbGllbnQgPSBrby5vYnNlcnZhYmxlKG51bGwpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlbGVjdENsaWVudCA9IGZ1bmN0aW9uKHNlbGVjdGVkQ2xpZW50KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZENsaWVudChzZWxlY3RlZENsaWVudCk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbn1cclxuIiwiLyoqXG4gICAgQ01TIGFjdGl2aXR5XG4gICAgKENsaWVudCBNYW5hZ2VtZW50IFN5c3RlbSlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQ21zQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIoJ0NsaWVudCBtYW5hZ2VtZW50Jyk7XG4gICAgXG4gICAgLy8gS2VlcCBjbGllbnRzQ291bnQgdXBkYXRlZFxuICAgIC8vIFRPRE8gdGhpcy5hcHAubW9kZWwuY2xpZW50c1xuICAgIHZhciBjbGllbnRzID0ga28ub2JzZXJ2YWJsZUFycmF5KHJlcXVpcmUoJy4uL3Rlc3RkYXRhL2NsaWVudHMnKS5jbGllbnRzKTtcbiAgICB0aGlzLnZpZXdNb2RlbC5jbGllbnRzQ291bnQoY2xpZW50cygpLmxlbmd0aCk7XG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xuICAgICAgICB0YXJnZXQ6IGNsaWVudHMsXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuY2xpZW50c0NvdW50KGNsaWVudHMoKS5sZW5ndGgpO1xuICAgICAgICB9LmJpbmQodGhpcylcbiAgICB9KTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcbiAgICBcbiAgICB0aGlzLmNsaWVudHNDb3VudCA9IGtvLm9ic2VydmFibGUoKTtcbn1cbiIsIi8qKlxuICAgIENvbnRhY3RGb3JtIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQ29udGFjdEZvcm1BY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIFxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCgpO1xuICAgIFxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignVGFsayB0byB1cycpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcbiAgICBcbiAgICB0aGlzLm1lc3NhZ2UgPSBrby5vYnNlcnZhYmxlKCcnKTtcbiAgICB0aGlzLndhc1NlbnQgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcblxuICAgIHZhciB1cGRhdGVXYXNTZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMud2FzU2VudChmYWxzZSk7XG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIHRoaXMubWVzc2FnZS5zdWJzY3JpYmUodXBkYXRlV2FzU2VudCk7XG4gICAgXG4gICAgdGhpcy5zZW5kID0gZnVuY3Rpb24gc2VuZCgpIHtcbiAgICAgICAgLy8gVE9ETzogU2VuZFxuICAgICAgICBcbiAgICAgICAgLy8gUmVzZXQgYWZ0ZXIgYmVpbmcgc2VudFxuICAgICAgICB0aGlzLm1lc3NhZ2UoJycpO1xuICAgICAgICB0aGlzLndhc1NlbnQodHJ1ZSk7XG5cbiAgICB9LmJpbmQodGhpcyk7XG59XG4iLCIvKipcclxuICAgIENvbnRhY3RJbmZvIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XHJcblxyXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQ29udGFjdEluZm9BY3Rpdml0eSgpIHtcclxuICAgIFxyXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XHJcbiAgICBcclxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignT3duZXIgaW5mb3JtYXRpb24nKTtcclxuICAgIFxyXG4gICAgLy8gVXBkYXRlIG5hdkJhciBmb3Igb25ib2FyZGluZyBtb2RlIHdoZW4gdGhlIG9uYm9hcmRpbmdTdGVwXHJcbiAgICAvLyBpbiB0aGUgY3VycmVudCBtb2RlbCBjaGFuZ2VzOlxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwucHJvZmlsZS5vbmJvYXJkaW5nU3RlcCxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbiAoc3RlcCkge1xyXG4gICAgICAgICAgICBpZiAoc3RlcCkge1xyXG4gICAgICAgICAgICAgICAgLy8gVE9ETyBTZXQgbmF2YmFyIHN0ZXAgaW5kZXhcclxuICAgICAgICAgICAgICAgIC8vIFNldHRpbmcgbmF2YmFyIGZvciBPbmJvYXJkaW5nL3dpemFyZCBtb2RlXHJcbiAgICAgICAgICAgICAgICB0aGlzLm5hdkJhci5sZWZ0QWN0aW9uKCkudGV4dCgnJyk7XHJcbiAgICAgICAgICAgICAgICAvLyBTZXR0aW5nIGhlYWRlclxyXG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuaGVhZGVyVGV4dCgnSG93IGNhbiB3ZSByZWFjaCB5b3U/Jyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5idXR0b25UZXh0KCdTYXZlIGFuZCBjb250aW51ZScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gVE9ETyBSZW1vdmUgc3RlcCBpbmRleFxyXG4gICAgICAgICAgICAgICAgLy8gU2V0dGluZyBuYXZiYXIgdG8gZGVmYXVsdFxyXG4gICAgICAgICAgICAgICAgdGhpcy5uYXZCYXIubGVmdEFjdGlvbigpLnRleHQoJ0FjY291bnQnKTtcclxuICAgICAgICAgICAgICAgIC8vIFNldHRpbmcgaGVhZGVyIHRvIGRlZmF1bHRcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmhlYWRlclRleHQoJ0NvbnRhY3QgaW5mb3JtYXRpb24nKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmJ1dHRvblRleHQoJ1NhdmUnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbiAgICAvL3RoaXMudmlld01vZGVsLnByb2ZpbGUub25ib2FyZGluZ1N0ZXAuc3Vic2NyaWJlKCk7XHJcbiAgICBcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMuYXBwLm1vZGVsLnVzZXJQcm9maWxlLFxyXG4gICAgICAgIGV2ZW50OiAnZXJyb3InLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICB2YXIgbXNnID0gZXJyLnRhc2sgPT09ICdzYXZlJyA/ICdFcnJvciBzYXZpbmcgY29udGFjdCBkYXRhLicgOiAnRXJyb3IgbG9hZGluZyBjb250YWN0IGRhdGEuJztcclxuICAgICAgICAgICAgdGhpcy5hcHAubW9kYWxzLnNob3dFcnJvcih7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogbXNnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVyciAmJiBlcnIudGFzayAmJiBlcnIuZXJyb3IgfHwgZXJyXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMuYXBwLm1vZGVsLmhvbWVBZGRyZXNzLFxyXG4gICAgICAgIGV2ZW50OiAnZXJyb3InLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICB2YXIgbXNnID0gZXJyLnRhc2sgPT09ICdzYXZlJyA/ICdFcnJvciBzYXZpbmcgYWRkcmVzcyBkZXRhaWxzLicgOiAnRXJyb3IgbG9hZGluZyBhZGRyZXNzIGRldGFpbHMuJztcclxuICAgICAgICAgICAgdGhpcy5hcHAubW9kYWxzLnNob3dFcnJvcih7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogbXNnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVyciAmJiBlcnIudGFzayAmJiBlcnIuZXJyb3IgfHwgZXJyXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xyXG4gICAgXHJcbiAgICAvLyBEaXNjYXJkIGFueSBwcmV2aW91cyB1bnNhdmVkIGVkaXRcclxuICAgIHRoaXMudmlld01vZGVsLmRpc2NhcmQoKTtcclxuICAgIFxyXG4gICAgLy8gS2VlcCBkYXRhIHVwZGF0ZWQ6XHJcbiAgICB0aGlzLmFwcC5tb2RlbC51c2VyUHJvZmlsZS5zeW5jKCk7XHJcbiAgICB0aGlzLmFwcC5tb2RlbC5ob21lQWRkcmVzcy5zeW5jKCk7XHJcbn07XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKGFwcCkge1xyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJ0NvbnRhY3QgaW5mb3JtYXRpb24nKTtcclxuICAgIHRoaXMuYnV0dG9uVGV4dCA9IGtvLm9ic2VydmFibGUoJ1NhdmUnKTtcclxuICAgIFxyXG4gICAgLy8gVXNlciBQcm9maWxlXHJcbiAgICB2YXIgdXNlclByb2ZpbGUgPSBhcHAubW9kZWwudXNlclByb2ZpbGU7XHJcbiAgICB2YXIgcHJvZmlsZVZlcnNpb24gPSB1c2VyUHJvZmlsZS5uZXdWZXJzaW9uKCk7XHJcbiAgICBwcm9maWxlVmVyc2lvbi5pc09ic29sZXRlLnN1YnNjcmliZShmdW5jdGlvbihpdElzKSB7XHJcbiAgICAgICAgaWYgKGl0SXMpIHtcclxuICAgICAgICAgICAgLy8gbmV3IHZlcnNpb24gZnJvbSBzZXJ2ZXIgd2hpbGUgZWRpdGluZ1xyXG4gICAgICAgICAgICAvLyBGVVRVUkU6IHdhcm4gYWJvdXQgYSBuZXcgcmVtb3RlIHZlcnNpb24gYXNraW5nXHJcbiAgICAgICAgICAgIC8vIGNvbmZpcm1hdGlvbiB0byBsb2FkIHRoZW0gb3IgZGlzY2FyZCBhbmQgb3ZlcndyaXRlIHRoZW07XHJcbiAgICAgICAgICAgIC8vIHRoZSBzYW1lIGlzIG5lZWQgb24gc2F2ZSgpLCBhbmQgb24gc2VydmVyIHJlc3BvbnNlXHJcbiAgICAgICAgICAgIC8vIHdpdGggYSA1MDk6Q29uZmxpY3Qgc3RhdHVzIChpdHMgYm9keSBtdXN0IGNvbnRhaW4gdGhlXHJcbiAgICAgICAgICAgIC8vIHNlcnZlciB2ZXJzaW9uKS5cclxuICAgICAgICAgICAgLy8gUmlnaHQgbm93LCBqdXN0IG92ZXJ3cml0ZSBjdXJyZW50IGNoYW5nZXMgd2l0aFxyXG4gICAgICAgICAgICAvLyByZW1vdGUgb25lczpcclxuICAgICAgICAgICAgcHJvZmlsZVZlcnNpb24ucHVsbCh7IGV2ZW5JZk5ld2VyOiB0cnVlIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBBY3R1YWwgZGF0YSBmb3IgdGhlIGZvcm06XHJcbiAgICB0aGlzLnByb2ZpbGUgPSBwcm9maWxlVmVyc2lvbi52ZXJzaW9uO1xyXG4gICAgXHJcbiAgICAvLyBUT0RPIGwxMG5cclxuICAgIHRoaXMubW9udGhzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtcclxuICAgICAgICB7IGlkOiAxLCBuYW1lOiAnSmFudWFyeSd9LFxyXG4gICAgICAgIHsgaWQ6IDIsIG5hbWU6ICdGZWJydWFyeSd9LFxyXG4gICAgICAgIHsgaWQ6IDMsIG5hbWU6ICdNYXJjaCd9LFxyXG4gICAgICAgIHsgaWQ6IDQsIG5hbWU6ICdBcHJpbCd9LFxyXG4gICAgICAgIHsgaWQ6IDUsIG5hbWU6ICdNYXknfSxcclxuICAgICAgICB7IGlkOiA2LCBuYW1lOiAnSnVuZSd9LFxyXG4gICAgICAgIHsgaWQ6IDcsIG5hbWU6ICdKdWx5J30sXHJcbiAgICAgICAgeyBpZDogOCwgbmFtZTogJ0F1Z3VzdCd9LFxyXG4gICAgICAgIHsgaWQ6IDksIG5hbWU6ICdTZXB0ZW1iZXInfSxcclxuICAgICAgICB7IGlkOiAxMCwgbmFtZTogJ09jdG9iZXInfSxcclxuICAgICAgICB7IGlkOiAxMSwgbmFtZTogJ05vdmVtYmVyJ30sXHJcbiAgICAgICAgeyBpZDogMTIsIG5hbWU6ICdEZWNlbWJlcid9XHJcbiAgICBdKTtcclxuICAgIC8vIFdlIG5lZWQgdG8gdXNlIGEgc3BlY2lhbCBvYnNlcnZhYmxlIGluIHRoZSBmb3JtLCB0aGF0IHdpbGxcclxuICAgIC8vIHVwZGF0ZSB0aGUgYmFjay1lbmQgcHJvZmlsZS5iaXJ0aE1vbnRoXHJcbiAgICB0aGlzLnNlbGVjdGVkQmlydGhNb250aCA9IGtvLmNvbXB1dGVkKHtcclxuICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIGJpcnRoTW9udGggPSB0aGlzLnByb2ZpbGUuYmlydGhNb250aCgpO1xyXG4gICAgICAgICAgICByZXR1cm4gYmlydGhNb250aCA/IHRoaXMubW9udGhzKClbYmlydGhNb250aCAtIDFdIDogbnVsbDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHdyaXRlOiBmdW5jdGlvbihtb250aCkge1xyXG4gICAgICAgICAgICB0aGlzLnByb2ZpbGUuYmlydGhNb250aChtb250aCAmJiBtb250aC5pZCB8fCBudWxsKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG93bmVyOiB0aGlzXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgdGhpcy5tb250aERheXMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xyXG4gICAgZm9yICh2YXIgaWRheSA9IDE7IGlkYXkgPD0gMzE7IGlkYXkrKykge1xyXG4gICAgICAgIHRoaXMubW9udGhEYXlzLnB1c2goaWRheSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEhvbWUgQWRkcmVzc1xyXG4gICAgdmFyIGhvbWVBZGRyZXNzID0gYXBwLm1vZGVsLmhvbWVBZGRyZXNzO1xyXG4gICAgdmFyIGhvbWVBZGRyZXNzVmVyc2lvbiA9IGhvbWVBZGRyZXNzLm5ld1ZlcnNpb24oKTtcclxuICAgIGhvbWVBZGRyZXNzVmVyc2lvbi5pc09ic29sZXRlLnN1YnNjcmliZShmdW5jdGlvbihpdElzKSB7XHJcbiAgICAgICAgaWYgKGl0SXMpIHtcclxuICAgICAgICAgICAgLy8gbmV3IHZlcnNpb24gZnJvbSBzZXJ2ZXIgd2hpbGUgZWRpdGluZ1xyXG4gICAgICAgICAgICAvLyBGVVRVUkU6IHdhcm4gYWJvdXQgYSBuZXcgcmVtb3RlIHZlcnNpb24gYXNraW5nXHJcbiAgICAgICAgICAgIC8vIGNvbmZpcm1hdGlvbiB0byBsb2FkIHRoZW0gb3IgZGlzY2FyZCBhbmQgb3ZlcndyaXRlIHRoZW07XHJcbiAgICAgICAgICAgIC8vIHRoZSBzYW1lIGlzIG5lZWQgb24gc2F2ZSgpLCBhbmQgb24gc2VydmVyIHJlc3BvbnNlXHJcbiAgICAgICAgICAgIC8vIHdpdGggYSA1MDk6Q29uZmxpY3Qgc3RhdHVzIChpdHMgYm9keSBtdXN0IGNvbnRhaW4gdGhlXHJcbiAgICAgICAgICAgIC8vIHNlcnZlciB2ZXJzaW9uKS5cclxuICAgICAgICAgICAgLy8gUmlnaHQgbm93LCBqdXN0IG92ZXJ3cml0ZSBjdXJyZW50IGNoYW5nZXMgd2l0aFxyXG4gICAgICAgICAgICAvLyByZW1vdGUgb25lczpcclxuICAgICAgICAgICAgaG9tZUFkZHJlc3NWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gQWN0dWFsIGRhdGEgZm9yIHRoZSBmb3JtOlxyXG4gICAgdGhpcy5hZGRyZXNzID0gaG9tZUFkZHJlc3NWZXJzaW9uLnZlcnNpb247XHJcblxyXG4gICAgLy8gQ29udHJvbCBvYnNlcnZhYmxlczogc3BlY2lhbCBiZWNhdXNlIG11c3QgYSBtaXhcclxuICAgIC8vIG9mIHRoZSBib3RoIHJlbW90ZSBtb2RlbHMgdXNlZCBpbiB0aGlzIHZpZXdtb2RlbFxyXG4gICAgdGhpcy5pc0xvY2tlZCA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB1c2VyUHJvZmlsZS5pc0xvY2tlZCgpIHx8IGhvbWVBZGRyZXNzLmlzTG9ja2VkKCk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIHRoaXMuaXNMb2FkaW5nID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHVzZXJQcm9maWxlLmlzTG9hZGluZygpIHx8IGhvbWVBZGRyZXNzLmlzTG9hZGluZygpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICB0aGlzLmlzU2F2aW5nID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHVzZXJQcm9maWxlLmlzU2F2aW5nKCkgfHwgaG9tZUFkZHJlc3MuaXNTYXZpbmcoKTtcclxuICAgIH0sIHRoaXMpO1xyXG5cclxuICAgIHRoaXMuc3VibWl0VGV4dCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZygpID8gXHJcbiAgICAgICAgICAgICAgICAnbG9hZGluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNTYXZpbmcoKSA/IFxyXG4gICAgICAgICAgICAgICAgICAgICdzYXZpbmcuLi4nIDogXHJcbiAgICAgICAgICAgICAgICAgICAgJ1NhdmUnXHJcbiAgICAgICAgKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICAvLyBBY3Rpb25zXHJcblxyXG4gICAgdGhpcy5kaXNjYXJkID0gZnVuY3Rpb24gZGlzY2FyZCgpIHtcclxuICAgICAgICBwcm9maWxlVmVyc2lvbi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgaG9tZUFkZHJlc3NWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgICAgIC8vIEZvcmNlIHRvIHNhdmUsIGV2ZW4gaWYgdGhlcmUgd2FzIHJlbW90ZSB1cGRhdGVzXHJcbiAgICAgICAgcHJvZmlsZVZlcnNpb24ucHVzaCh7IGV2ZW5JZk9ic29sZXRlOiB0cnVlIH0pO1xyXG4gICAgICAgIGhvbWVBZGRyZXNzVmVyc2lvbi5wdXNoKHsgZXZlbklmT2Jzb2xldGU6IHRydWUgfSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbn1cclxuIiwiLyoqXG4gICAgQ29udmVyc2F0aW9uIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQ29udmVyc2F0aW9uQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ0luYm94Jyk7XG4gICAgXG4gICAgLy8gVGVzdGluZ0RhdGFcbiAgICBzZXRTb21lVGVzdGluZ0RhdGEodGhpcy52aWV3TW9kZWwpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcbiAgICBcbiAgICBpZiAoc3RhdGUgJiYgc3RhdGUucm91dGUgJiYgc3RhdGUucm91dGUuc2VnbWVudHMpIHtcbiAgICAgICAgdGhpcy52aWV3TW9kZWwuY29udmVyc2F0aW9uSUQocGFyc2VJbnQoc3RhdGUucm91dGUuc2VnbWVudHNbMF0sIDEwKSB8fCAwKTtcbiAgICB9XG59O1xuXG52YXIgTWFpbEZvbGRlciA9IHJlcXVpcmUoJy4uL21vZGVscy9NYWlsRm9sZGVyJyk7XG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG5cbiAgICB0aGlzLmluYm94ID0gbmV3IE1haWxGb2xkZXIoe1xuICAgICAgICB0b3BOdW1iZXI6IDIwXG4gICAgfSk7XG4gICAgXG4gICAgdGhpcy5jb252ZXJzYXRpb25JRCA9IGtvLm9ic2VydmFibGUobnVsbCk7XG4gICAgXG4gICAgdGhpcy5jb252ZXJzYXRpb24gPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb25JRCA9IHRoaXMuY29udmVyc2F0aW9uSUQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5ib3gubWVzc2FnZXMoKS5maWx0ZXIoZnVuY3Rpb24odikge1xuICAgICAgICAgICAgcmV0dXJuIHYgJiYgdi5pZCgpID09PSBjb25JRDtcbiAgICAgICAgfSk7XG4gICAgfSwgdGhpcyk7XG4gICAgXG4gICAgdGhpcy5zdWJqZWN0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbSA9IHRoaXMuY29udmVyc2F0aW9uKClbMF07XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBtID9cbiAgICAgICAgICAgIG0uc3ViamVjdCgpIDpcbiAgICAgICAgICAgICdDb252ZXJzYXRpb24gdy9vIHN1YmplY3QnXG4gICAgICAgICk7XG4gICAgICAgIFxuICAgIH0sIHRoaXMpO1xufVxuXG4vKiogVEVTVElORyBEQVRBICoqL1xuZnVuY3Rpb24gc2V0U29tZVRlc3RpbmdEYXRhKHZpZXdNb2RlbCkge1xuICAgIFxuICAgIHZpZXdNb2RlbC5pbmJveC5tZXNzYWdlcyhyZXF1aXJlKCcuLi90ZXN0ZGF0YS9tZXNzYWdlcycpLm1lc3NhZ2VzKTtcbn1cbiIsIi8qKlxyXG4gICAgZGF0ZXRpbWVQaWNrZXIgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIFRpbWUgPSByZXF1aXJlKCcuLi91dGlscy9UaW1lJyk7XHJcbnJlcXVpcmUoJy4uL2NvbXBvbmVudHMvRGF0ZVBpY2tlcicpO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIERhdGV0aW1lUGlja2VyQWN0aXZpdHkoKSB7XHJcbiAgICBcclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xyXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCcnKTtcclxuICAgIFxyXG4gICAgLy8gR2V0dGluZyBlbGVtZW50c1xyXG4gICAgdGhpcy4kZGF0ZVBpY2tlciA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNkYXRldGltZVBpY2tlckRhdGVQaWNrZXInKTtcclxuICAgIHRoaXMuJHRpbWVQaWNrZXIgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjZGF0ZXRpbWVQaWNrZXJUaW1lUGlja2VyJyk7XHJcbiAgICBcclxuICAgIC8qIEluaXQgY29tcG9uZW50cyAqL1xyXG4gICAgdGhpcy4kZGF0ZVBpY2tlci5zaG93KCkuZGF0ZXBpY2tlcigpO1xyXG4gICAgXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLiRkYXRlUGlja2VyLFxyXG4gICAgICAgIGV2ZW50OiAnY2hhbmdlRGF0ZScsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICBpZiAoZS52aWV3TW9kZSA9PT0gJ2RheXMnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZERhdGUoZS5kYXRlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLnNlbGVjdGVkRGF0ZSxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihkYXRlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYmluZERhdGVEYXRhKGRhdGUpO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEhhbmRsZXIgdG8gZ28gYmFjayB3aXRoIHRoZSBzZWxlY3RlZCBkYXRlLXRpbWUgd2hlblxyXG4gICAgLy8gdGhhdCBzZWxlY3Rpb24gaXMgZG9uZSAoY291bGQgYmUgdG8gbnVsbClcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLnNlbGVjdGVkRGF0ZXRpbWUsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24gKGRhdGV0aW1lKSB7XHJcbiAgICAgICAgICAgIC8vIFdlIGhhdmUgYSByZXF1ZXN0XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnJlcXVlc3REYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBQYXNzIHRoZSBzZWxlY3RlZCBkYXRldGltZSBpbiB0aGUgaW5mb1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RGF0YS5zZWxlY3RlZERhdGV0aW1lID0gdGhpcy52aWV3TW9kZWwuc2VsZWN0ZWREYXRldGltZSgpO1xyXG4gICAgICAgICAgICAgICAgLy8gQW5kIGdvIGJhY2tcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvQmFjayh0aGlzLnJlcXVlc3REYXRhKTtcclxuICAgICAgICAgICAgICAgIC8vIExhc3QsIGNsZWFyIHJlcXVlc3REYXRhXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3REYXRhID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIFRlc3RpbmdEYXRhXHJcbiAgICB0aGlzLnZpZXdNb2RlbC5zbG90c0RhdGEgPSByZXF1aXJlKCcuLi90ZXN0ZGF0YS90aW1lU2xvdHMnKS50aW1lU2xvdHM7XHJcbiAgICBcclxuICAgIHRoaXMuYmluZERhdGVEYXRhKG5ldyBEYXRlKCkpO1xyXG59KTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcclxuXHJcbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KHN0YXRlKSB7XHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcclxuXHJcbiAgICAvLyBUT0RPOiB0ZXh0IGZyb20gb3V0c2lkZSBvciBkZXBlbmRpbmcgb24gc3RhdGU/XHJcbiAgICB0aGlzLnZpZXdNb2RlbC5oZWFkZXJUZXh0KCdTZWxlY3QgYSBzdGFydCB0aW1lJyk7XHJcbn07XHJcblxyXG5BLnByb3RvdHlwZS5iaW5kRGF0ZURhdGEgPSBmdW5jdGlvbiBiaW5kRGF0ZURhdGEoZGF0ZSkge1xyXG5cclxuICAgIHZhciBzZGF0ZSA9IG1vbWVudChkYXRlKS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcclxuICAgIHZhciBzbG90c0RhdGEgPSB0aGlzLnZpZXdNb2RlbC5zbG90c0RhdGE7XHJcblxyXG4gICAgaWYgKHNsb3RzRGF0YS5oYXNPd25Qcm9wZXJ0eShzZGF0ZSkpIHtcclxuICAgICAgICB0aGlzLnZpZXdNb2RlbC5zbG90cyhzbG90c0RhdGFbc2RhdGVdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy52aWV3TW9kZWwuc2xvdHMoc2xvdHNEYXRhWydkZWZhdWx0J10pO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJ1NlbGVjdCBhIHRpbWUnKTtcclxuICAgIHRoaXMuc2VsZWN0ZWREYXRlID0ga28ub2JzZXJ2YWJsZShuZXcgRGF0ZSgpKTtcclxuICAgIHRoaXMuc2xvdHNEYXRhID0ge307XHJcbiAgICB0aGlzLnNsb3RzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcclxuICAgIHRoaXMuZ3JvdXBlZFNsb3RzID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuICAgICAgICAvKlxyXG4gICAgICAgICAgYmVmb3JlIDEyOjAwcG0gKG5vb24pID0gbW9ybmluZ1xyXG4gICAgICAgICAgYWZ0ZXJub29uOiAxMjowMHBtIHVudGlsIDU6MDBwbVxyXG4gICAgICAgICAgZXZlbmluZzogNTowMHBtIC0gMTE6NTlwbVxyXG4gICAgICAgICovXHJcbiAgICAgICAgLy8gU2luY2Ugc2xvdHMgbXVzdCBiZSBmb3IgdGhlIHNhbWUgZGF0ZSxcclxuICAgICAgICAvLyB0byBkZWZpbmUgdGhlIGdyb3VwcyByYW5nZXMgdXNlIHRoZSBmaXJzdCBkYXRlXHJcbiAgICAgICAgdmFyIGRhdGVQYXJ0ID0gdGhpcy5zbG90cygpICYmIHRoaXMuc2xvdHMoKVswXSB8fCBuZXcgRGF0ZSgpO1xyXG4gICAgICAgIHZhciBncm91cHMgPSBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGdyb3VwOiAnTW9ybmluZycsXHJcbiAgICAgICAgICAgICAgICBzbG90czogW10sXHJcbiAgICAgICAgICAgICAgICBzdGFydHM6IG5ldyBUaW1lKGRhdGVQYXJ0LCAwLCAwKSxcclxuICAgICAgICAgICAgICAgIGVuZHM6IG5ldyBUaW1lKGRhdGVQYXJ0LCAxMiwgMClcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZ3JvdXA6ICdBZnRlcm5vb24nLFxyXG4gICAgICAgICAgICAgICAgc2xvdHM6IFtdLFxyXG4gICAgICAgICAgICAgICAgc3RhcnRzOiBuZXcgVGltZShkYXRlUGFydCwgMTIsIDApLFxyXG4gICAgICAgICAgICAgICAgZW5kczogbmV3IFRpbWUoZGF0ZVBhcnQsIDE3LCAwKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBncm91cDogJ0V2ZW5pbmcnLFxyXG4gICAgICAgICAgICAgICAgc2xvdHM6IFtdLFxyXG4gICAgICAgICAgICAgICAgc3RhcnRzOiBuZXcgVGltZShkYXRlUGFydCwgMTcsIDApLFxyXG4gICAgICAgICAgICAgICAgZW5kczogbmV3IFRpbWUoZGF0ZVBhcnQsIDI0LCAwKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXTtcclxuICAgICAgICB2YXIgc2xvdHMgPSB0aGlzLnNsb3RzKCkuc29ydCgpO1xyXG4gICAgICAgIHNsb3RzLmZvckVhY2goZnVuY3Rpb24oc2xvdCkge1xyXG4gICAgICAgICAgICBncm91cHMuZm9yRWFjaChmdW5jdGlvbihncm91cCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNsb3QgPj0gZ3JvdXAuc3RhcnRzICYmXHJcbiAgICAgICAgICAgICAgICAgICAgc2xvdCA8IGdyb3VwLmVuZHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBncm91cC5zbG90cy5wdXNoKHNsb3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdyb3VwcztcclxuXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZWxlY3RlZERhdGV0aW1lID0ga28ub2JzZXJ2YWJsZShudWxsKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZWxlY3REYXRldGltZSA9IGZ1bmN0aW9uKHNlbGVjdGVkRGF0ZXRpbWUpIHtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnNlbGVjdGVkRGF0ZXRpbWUoc2VsZWN0ZWREYXRldGltZSk7XHJcblxyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG5cclxufVxyXG4iLCIvKipcbiAgICBGYXFzIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gRmFxc0FjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdUYWxrIHRvIHVzJyk7XG4gICAgXG4gICAgLy8gVGVzdGluZ0RhdGFcbiAgICBzZXRTb21lVGVzdGluZ0RhdGEodGhpcy52aWV3TW9kZWwpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbC5zZWFyY2hUZXh0KCcnKTtcbn07XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcblxuICAgIHRoaXMuZmFxcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XG4gICAgdGhpcy5zZWFyY2hUZXh0ID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgXG4gICAgdGhpcy5maWx0ZXJlZEZhcXMgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzID0gdGhpcy5zZWFyY2hUZXh0KCkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmFxcygpLmZpbHRlcihmdW5jdGlvbih2KSB7XG4gICAgICAgICAgICB2YXIgbiA9IHYgJiYgdi50aXRsZSgpIHx8ICcnO1xuICAgICAgICAgICAgbiArPSB2ICYmIHYuZGVzY3JpcHRpb24oKSB8fCAnJztcbiAgICAgICAgICAgIG4gPSBuLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICByZXR1cm4gbi5pbmRleE9mKHMpID4gLTE7XG4gICAgICAgIH0pO1xuICAgIH0sIHRoaXMpO1xufVxuXG52YXIgTW9kZWwgPSByZXF1aXJlKCcuLi9tb2RlbHMvTW9kZWwnKTtcbmZ1bmN0aW9uIEZhcSh2YWx1ZXMpIHtcbiAgICBcbiAgICBNb2RlbCh0aGlzKTtcblxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XG4gICAgICAgIGlkOiAwLFxuICAgICAgICB0aXRsZTogJycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnJ1xuICAgIH0sIHZhbHVlcyk7XG59XG5cbi8qKiBURVNUSU5HIERBVEEgKiovXG5mdW5jdGlvbiBzZXRTb21lVGVzdGluZ0RhdGEodmlld01vZGVsKSB7XG4gICAgXG4gICAgdmFyIHRlc3RkYXRhID0gW1xuICAgICAgICBuZXcgRmFxKHtcbiAgICAgICAgICAgIGlkOiAxLFxuICAgICAgICAgICAgdGl0bGU6ICdIb3cgZG8gSSBzZXQgdXAgYSBtYXJrZXRwbGFjZSBwcm9maWxlPycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Rlc2NyaXB0aW9uIGFib3V0IGhvdyBJIHNldCB1cCBhIG1hcmtldHBsYWNlIHByb2ZpbGUnXG4gICAgICAgIH0pLFxuICAgICAgICBuZXcgRmFxKHtcbiAgICAgICAgICAgIGlkOiAyLFxuICAgICAgICAgICAgdGl0bGU6ICdBbm90aGVyIGZhcScsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Fub3RoZXIgZGVzY3JpcHRpb24nXG4gICAgICAgIH0pXG4gICAgXTtcbiAgICB2aWV3TW9kZWwuZmFxcyh0ZXN0ZGF0YSk7XG59XG4iLCIvKipcbiAgICBGZWVkYmFjayBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEZlZWRiYWNrQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU2VjdGlvbk5hdkJhcignVGFsayB0byB1cycpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcbiIsIi8qKlxuICAgIEZlZWRiYWNrRm9ybSBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEZlZWRiYWNrRm9ybUFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdUYWxrIHRvIHVzJyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuICAgIFxuICAgIHRoaXMubWVzc2FnZSA9IGtvLm9ic2VydmFibGUoJycpO1xuICAgIHRoaXMuYmVjb21lQ29sbGFib3JhdG9yID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG4gICAgdGhpcy53YXNTZW50ID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG5cbiAgICB2YXIgdXBkYXRlV2FzU2VudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLndhc1NlbnQoZmFsc2UpO1xuICAgIH0uYmluZCh0aGlzKTtcbiAgICB0aGlzLm1lc3NhZ2Uuc3Vic2NyaWJlKHVwZGF0ZVdhc1NlbnQpO1xuICAgIHRoaXMuYmVjb21lQ29sbGFib3JhdG9yLnN1YnNjcmliZSh1cGRhdGVXYXNTZW50KTtcbiAgICBcbiAgICB0aGlzLnNlbmQgPSBmdW5jdGlvbiBzZW5kKCkge1xuICAgICAgICAvLyBUT0RPOiBTZW5kXG4gICAgICAgIFxuICAgICAgICAvLyBSZXNldCBhZnRlciBiZWluZyBzZW50XG4gICAgICAgIHRoaXMubWVzc2FnZSgnJyk7XG4gICAgICAgIHRoaXMuYmVjb21lQ29sbGFib3JhdG9yKGZhbHNlKTtcbiAgICAgICAgdGhpcy53YXNTZW50KHRydWUpO1xuXG4gICAgfS5iaW5kKHRoaXMpO1xufVxuIiwiLyoqXG4gICAgSG9tZSBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBIb21lQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XG4gICAgLy8gbnVsbCBmb3IgbG9nb1xuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU2VjdGlvbk5hdkJhcihudWxsKTtcbiAgICBcbiAgICAvLyBHZXR0aW5nIGVsZW1lbnRzXG4gICAgdGhpcy4kbmV4dEJvb2tpbmcgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjaG9tZU5leHRCb29raW5nJyk7XG4gICAgdGhpcy4kdXBjb21pbmdCb29raW5ncyA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNob21lVXBjb21pbmdCb29raW5ncycpO1xuICAgIHRoaXMuJGluYm94ID0gdGhpcy4kYWN0aXZpdHkuZmluZCgnI2hvbWVJbmJveCcpO1xuICAgIHRoaXMuJHBlcmZvcm1hbmNlID0gdGhpcy4kYWN0aXZpdHkuZmluZCgnI2hvbWVQZXJmb3JtYW5jZScpO1xuICAgIHRoaXMuJGdldE1vcmUgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjaG9tZUdldE1vcmUnKTtcbiAgICBcbiAgICAvLyBUZXN0aW5nRGF0YVxuICAgIHNldFNvbWVUZXN0aW5nRGF0YSh0aGlzLnZpZXdNb2RlbCk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICBcbiAgICB2YXIgdiA9IHRoaXMudmlld01vZGVsLFxuICAgICAgICBhcHBNb2RlbCA9IHRoaXMuYXBwLm1vZGVsO1xuICAgIFxuICAgIC8vIFVwZGF0ZSBkYXRhXG4gICAgYXBwTW9kZWwuZ2V0VXBjb21pbmdCb29raW5ncygpLnRoZW4oZnVuY3Rpb24odXBjb21pbmcpIHtcblxuICAgICAgICBpZiAodXBjb21pbmcubmV4dEJvb2tpbmdJRClcbiAgICAgICAgICAgIGFwcE1vZGVsLmdldEJvb2tpbmcodXBjb21pbmcubmV4dEJvb2tpbmdJRCkudGhlbih2Lm5leHRCb29raW5nKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdi5uZXh0Qm9va2luZyhudWxsKTtcblxuICAgICAgICB2LnVwY29taW5nQm9va2luZ3MudG9kYXkucXVhbnRpdHkodXBjb21pbmcudG9kYXkucXVhbnRpdHkpO1xuICAgICAgICB2LnVwY29taW5nQm9va2luZ3MudG9kYXkudGltZSh1cGNvbWluZy50b2RheS50aW1lICYmIG5ldyBEYXRlKHVwY29taW5nLnRvZGF5LnRpbWUpKTtcbiAgICAgICAgdi51cGNvbWluZ0Jvb2tpbmdzLnRvbW9ycm93LnF1YW50aXR5KHVwY29taW5nLnRvbW9ycm93LnF1YW50aXR5KTtcbiAgICAgICAgdi51cGNvbWluZ0Jvb2tpbmdzLnRvbW9ycm93LnRpbWUodXBjb21pbmcudG9tb3Jyb3cudGltZSAmJiBuZXcgRGF0ZSh1cGNvbWluZy50b21vcnJvdy50aW1lKSk7XG4gICAgICAgIHYudXBjb21pbmdCb29raW5ncy5uZXh0V2Vlay5xdWFudGl0eSh1cGNvbWluZy5uZXh0V2Vlay5xdWFudGl0eSk7XG4gICAgICAgIHYudXBjb21pbmdCb29raW5ncy5uZXh0V2Vlay50aW1lKHVwY29taW5nLm5leHRXZWVrLnRpbWUgJiYgbmV3IERhdGUodXBjb21pbmcubmV4dFdlZWsudGltZSkpO1xuICAgIH0pO1xufTtcblxuXG52YXIgVXBjb21pbmdCb29raW5nc1N1bW1hcnkgPSByZXF1aXJlKCcuLi9tb2RlbHMvVXBjb21pbmdCb29raW5nc1N1bW1hcnknKSxcbiAgICBNYWlsRm9sZGVyID0gcmVxdWlyZSgnLi4vbW9kZWxzL01haWxGb2xkZXInKSxcbiAgICBQZXJmb3JtYW5jZVN1bW1hcnkgPSByZXF1aXJlKCcuLi9tb2RlbHMvUGVyZm9ybWFuY2VTdW1tYXJ5JyksXG4gICAgR2V0TW9yZSA9IHJlcXVpcmUoJy4uL21vZGVscy9HZXRNb3JlJyk7XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcblxuICAgIHRoaXMudXBjb21pbmdCb29raW5ncyA9IG5ldyBVcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeSgpO1xuXG4gICAgLy8gOkFwcG9pbnRtZW50XG4gICAgdGhpcy5uZXh0Qm9va2luZyA9IGtvLm9ic2VydmFibGUobnVsbCk7XG4gICAgXG4gICAgdGhpcy5pbmJveCA9IG5ldyBNYWlsRm9sZGVyKHtcbiAgICAgICAgdG9wTnVtYmVyOiA0XG4gICAgfSk7XG4gICAgXG4gICAgdGhpcy5wZXJmb3JtYW5jZSA9IG5ldyBQZXJmb3JtYW5jZVN1bW1hcnkoKTtcbiAgICBcbiAgICB0aGlzLmdldE1vcmUgPSBuZXcgR2V0TW9yZSgpO1xufVxuXG4vKiogVEVTVElORyBEQVRBICoqL1xudmFyIFRpbWUgPSByZXF1aXJlKCcuLi91dGlscy9UaW1lJyk7XG5cbmZ1bmN0aW9uIHNldFNvbWVUZXN0aW5nRGF0YSh2aWV3TW9kZWwpIHtcbiAgICBcbiAgICB2aWV3TW9kZWwuaW5ib3gubWVzc2FnZXMocmVxdWlyZSgnLi4vdGVzdGRhdGEvbWVzc2FnZXMnKS5tZXNzYWdlcyk7XG4gICAgXG4gICAgdmlld01vZGVsLnBlcmZvcm1hbmNlLmVhcm5pbmdzLmN1cnJlbnRBbW91bnQoMjQwMCk7XG4gICAgdmlld01vZGVsLnBlcmZvcm1hbmNlLmVhcm5pbmdzLm5leHRBbW91bnQoNjIwMC41NCk7XG4gICAgdmlld01vZGVsLnBlcmZvcm1hbmNlLnRpbWVCb29rZWQucGVyY2VudCgwLjkzKTtcbiAgICBcbiAgICB2aWV3TW9kZWwuZ2V0TW9yZS5tb2RlbC51cGRhdGVXaXRoKHtcbiAgICAgICAgYXZhaWxhYmlsaXR5OiB0cnVlLFxuICAgICAgICBwYXltZW50czogdHJ1ZSxcbiAgICAgICAgcHJvZmlsZTogdHJ1ZSxcbiAgICAgICAgY29vcDogdHJ1ZVxuICAgIH0pO1xufVxuIiwiLyoqXG4gICAgSW5ib3ggYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gSW5ib3hBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIFxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCgpO1xuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU2VjdGlvbk5hdkJhcignSW5ib3gnKTtcbiAgICBcbiAgICAvL3RoaXMuJGluYm94ID0gJGFjdGl2aXR5LmZpbmQoJyNpbmJveExpc3QnKTtcbiAgICBcbiAgICAvLyBUZXN0aW5nRGF0YVxuICAgIHNldFNvbWVUZXN0aW5nRGF0YSh0aGlzLnZpZXdNb2RlbCk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG52YXIgTWFpbEZvbGRlciA9IHJlcXVpcmUoJy4uL21vZGVscy9NYWlsRm9sZGVyJyk7XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcblxuICAgIHRoaXMuaW5ib3ggPSBuZXcgTWFpbEZvbGRlcih7XG4gICAgICAgIHRvcE51bWJlcjogMjBcbiAgICB9KTtcbiAgICBcbiAgICB0aGlzLnNlYXJjaFRleHQgPSBrby5vYnNlcnZhYmxlKCcnKTtcbn1cblxuLyoqIFRFU1RJTkcgREFUQSAqKi9cbmZ1bmN0aW9uIHNldFNvbWVUZXN0aW5nRGF0YShkYXRhVmlldykge1xuICAgIFxuICAgIGRhdGFWaWV3LmluYm94Lm1lc3NhZ2VzKHJlcXVpcmUoJy4uL3Rlc3RkYXRhL21lc3NhZ2VzJykubWVzc2FnZXMpO1xufVxuIiwiLyoqXG4gICAgSW5kZXggYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBJbmRleEFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAvLyBBbnkgdXNlciBjYW4gYWNjZXNzIHRoaXNcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gbnVsbDtcbiAgICBcbiAgICAvLyBudWxsIGZvciBsb2dvXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKG51bGwpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcbiAgICBcbiAgICAvLyBJdCBjaGVja3MgaWYgdGhlIHVzZXIgaXMgbG9nZ2VkIHNvIHRoZW4gXG4gICAgLy8gdGhlaXIgJ2xvZ2dlZCBpbmRleCcgaXMgdGhlIGRhc2hib2FyZCBub3QgdGhpc1xuICAgIC8vIHBhZ2UgdGhhdCBpcyBmb2N1c2VkIG9uIGFub255bW91cyB1c2Vyc1xuICAgIGlmICghdGhpcy5hcHAubW9kZWwudXNlcigpLmlzQW5vbnltb3VzKCkpIHtcbiAgICAgICAgdGhpcy5hcHAuZ29EYXNoYm9hcmQoKTtcbiAgICB9XG59O1xuIiwiLyoqXG4gICAgSm9idGl0bGVzIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gSm9idGl0bGVzQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ1NjaGVkdWxpbmcnKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcbn1cbiIsIi8qKlxuICAgIExlYXJuTW9yZSBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxuICAgIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gTGVhcm5Nb3JlQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XG4gICAgLy8gbnVsbCBmb3IgbG9nb1xuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU2VjdGlvbk5hdkJhcihudWxsKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgIFxuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMucm91dGUgJiZcbiAgICAgICAgb3B0aW9ucy5yb3V0ZS5zZWdtZW50cyAmJlxuICAgICAgICBvcHRpb25zLnJvdXRlLnNlZ21lbnRzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLnZpZXdNb2RlbC5wcm9maWxlKG9wdGlvbnMucm91dGUuc2VnbWVudHNbMF0pO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcbiAgICB0aGlzLnByb2ZpbGUgPSBrby5vYnNlcnZhYmxlKCdjdXN0b21lcicpO1xufVxuIiwiLyoqXG4gICAgTG9jYXRpb25FZGl0aW9uIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXG4gICAgTG9jYXRpb24gPSByZXF1aXJlKCcuLi9tb2RlbHMvTG9jYXRpb24nKSxcbiAgICBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIExvY2F0aW9uRWRpdGlvbkFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuRnJlZWxhbmNlcjtcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignTG9jYXRpb25zJyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG4gICAgLy9qc2hpbnQgbWF4Y29tcGxleGl0eToxMFxuICAgIFxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgXG4gICAgdmFyIGlkID0gMCxcbiAgICAgICAgY3JlYXRlID0gJyc7XG5cbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucy5sb2NhdGlvbklEKSB7XG4gICAgICAgICAgICBpZCA9IG9wdGlvbnMubG9jYXRpb25JRDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvcHRpb25zLnJvdXRlICYmIG9wdGlvbnMucm91dGUuc2VnbWVudHMpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWQgPSBwYXJzZUludChvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvcHRpb25zLmNyZWF0ZSkge1xuICAgICAgICAgICAgY3JlYXRlID0gb3B0aW9ucy5jcmVhdGU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaWYgKGlkKSB7XG4gICAgICAgIC8vIFRPRE9cbiAgICAgICAgLy8gdmFyIGxvY2F0aW9uID0gdGhpcy5hcHAubW9kZWwuZ2V0TG9jYXRpb24oaWQpXG4gICAgICAgIC8vIE5PVEUgdGVzdGluZyBkYXRhXG4gICAgICAgIHZhciBsb2NhdGlvbnMgPSB7XG4gICAgICAgICAgICAnMSc6IG5ldyBMb2NhdGlvbih7XG4gICAgICAgICAgICAgICAgbG9jYXRpb25JRDogMSxcbiAgICAgICAgICAgICAgICBuYW1lOiAnSG9tZScsXG4gICAgICAgICAgICAgICAgYWRkcmVzc0xpbmUxOiAnSGVyZSBTdHJlZXQnLFxuICAgICAgICAgICAgICAgIGNpdHk6ICdTYW4gRnJhbmNpc2NvJyxcbiAgICAgICAgICAgICAgICBwb3N0YWxDb2RlOiAnOTAwMDEnLFxuICAgICAgICAgICAgICAgIHN0YXRlUHJvdmluY2VDb2RlOiAnQ0EnLFxuICAgICAgICAgICAgICAgIGNvdW50cnlJRDogMSxcbiAgICAgICAgICAgICAgICBpc1NlcnZpY2VSYWRpdXM6IHRydWUsXG4gICAgICAgICAgICAgICAgaXNTZXJ2aWNlTG9jYXRpb246IGZhbHNlXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICcyJzogbmV3IExvY2F0aW9uKHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbklEOiAxLFxuICAgICAgICAgICAgICAgIG5hbWU6ICdXb3Jrc2hvcCcsXG4gICAgICAgICAgICAgICAgYWRkcmVzc0xpbmUxOiAnVW5rbm93IFN0cmVldCcsXG4gICAgICAgICAgICAgICAgY2l0eTogJ1NhbiBGcmFuY2lzY28nLFxuICAgICAgICAgICAgICAgIHBvc3RhbENvZGU6ICc5MDAwMScsXG4gICAgICAgICAgICAgICAgc3RhdGVQcm92aW5jZUNvZGU6ICdDQScsXG4gICAgICAgICAgICAgICAgY291bnRyeUlEOiAxLFxuICAgICAgICAgICAgICAgIGlzU2VydmljZVJhZGl1czogZmFsc2UsXG4gICAgICAgICAgICAgICAgaXNTZXJ2aWNlTG9jYXRpb246IHRydWVcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH07XG4gICAgICAgIHZhciBsb2NhdGlvbiA9IGxvY2F0aW9uc1tpZF07XG4gICAgICAgIGlmIChsb2NhdGlvbikge1xuICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwubG9jYXRpb24obG9jYXRpb24pO1xuXG4gICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5oZWFkZXIoJ0VkaXQgTG9jYXRpb24nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmxvY2F0aW9uKG51bGwpO1xuICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuaGVhZGVyKCdVbmtub3cgbG9jYXRpb24gb3Igd2FzIGRlbGV0ZWQnKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgLy8gTmV3IGxvY2F0aW9uXG4gICAgICAgIHRoaXMudmlld01vZGVsLmxvY2F0aW9uKG5ldyBMb2NhdGlvbigpKTtcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCAob3B0aW9ucy5jcmVhdGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ3NlcnZpY2VSYWRpdXMnOlxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmxvY2F0aW9uKCkuaXNTZXJ2aWNlUmFkaXVzKHRydWUpO1xuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmhlYWRlcignQWRkIGEgc2VydmljZSByYWRpdXMnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3NlcnZpY2VMb2NhdGlvbic6XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwubG9jYXRpb24oKS5pc1NlcnZpY2VMb2NhdGlvbih0cnVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5oZWFkZXIoJ0FkZCBhIHNlcnZpY2UgbG9jYXRpb24nKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwubG9jYXRpb24oKS5pc1NlcnZpY2VSYWRpdXModHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwubG9jYXRpb24oKS5pc1NlcnZpY2VMb2NhdGlvbih0cnVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5oZWFkZXIoJ0FkZCBhIGxvY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgXG4gICAgdGhpcy5sb2NhdGlvbiA9IGtvLm9ic2VydmFibGUobmV3IExvY2F0aW9uKCkpO1xuICAgIFxuICAgIHRoaXMuaGVhZGVyID0ga28ub2JzZXJ2YWJsZSgnRWRpdCBMb2NhdGlvbicpO1xuICAgIFxuICAgIC8vIFRPRE9cbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbigpIHt9O1xuICAgIHRoaXMuY2FuY2VsID0gZnVuY3Rpb24oKSB7fTtcbn0iLCIvKipcclxuICAgIGxvY2F0aW9ucyBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIExvY2F0aW9uc0FjdGl2aXR5KCkge1xyXG4gICAgXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcclxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignU2NoZWR1bGluZycpO1xyXG4gICAgXHJcbiAgICAvLyBHZXR0aW5nIGVsZW1lbnRzXHJcbiAgICB0aGlzLiRsaXN0VmlldyA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNsb2NhdGlvbnNMaXN0VmlldycpO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyIHRvIHVwZGF0ZSBoZWFkZXIgYmFzZWQgb24gYSBtb2RlIGNoYW5nZTpcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLmlzU2VsZWN0aW9uTW9kZSxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbiAoaXRJcykge1xyXG4gICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5oZWFkZXJUZXh0KGl0SXMgPyAnU2VsZWN0IG9yIGFkZCBhIHNlcnZpY2UgbG9jYXRpb24nIDogJ0xvY2F0aW9ucycpO1xyXG5cclxuICAgICAgICAgICAgLy8gVXBkYXRlIG5hdmJhciB0b29cclxuICAgICAgICAgICAgLy8gVE9ETzogQ2FuIGJlIG90aGVyIHRoYW4gJ3NjaGVkdWxpbmcnLCBsaWtlIG1hcmtldHBsYWNlIHByb2ZpbGUgb3IgdGhlIGpvYi10aXRsZT9cclxuICAgICAgICAgICAgdGhpcy5uYXZCYXIubGVmdEFjdGlvbigpLnRleHQoaXRJcyA/ICdCb29raW5nJyA6ICdTY2hlZHVsaW5nJyk7XHJcbiAgICAgICAgICAgIC8vIFRpdGxlIG11c3QgYmUgZW1wdHlcclxuICAgICAgICAgICAgdGhpcy5uYXZCYXIudGl0bGUoJycpO1xyXG5cclxuICAgICAgICAgICAgLy8gVE9ETyBSZXBsYWNlZCBieSBhIHByb2dyZXNzIGJhciBvbiBib29raW5nIGNyZWF0aW9uXHJcbiAgICAgICAgICAgIC8vIFRPRE8gT3IgbGVmdEFjdGlvbigpLnRleHQoLi4pIG9uIGJvb2tpbmcgZWRpdGlvbiAocmV0dXJuIHRvIGJvb2tpbmcpXHJcbiAgICAgICAgICAgIC8vIG9yIGNvbWluZyBmcm9tIEpvYnRpdGxlL3NjaGVkdWxlIChyZXR1cm4gdG8gc2NoZWR1bGUvam9iIHRpdGxlKT9cclxuXHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciB0byBnbyBiYWNrIHdpdGggdGhlIHNlbGVjdGVkIGxvY2F0aW9uIHdoZW4gXHJcbiAgICAvLyBzZWxlY3Rpb24gbW9kZSBnb2VzIG9mZiBhbmQgcmVxdWVzdEluZm8gaXMgZm9yXHJcbiAgICAvLyAnc2VsZWN0IG1vZGUnXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdNb2RlbC5pc1NlbGVjdGlvbk1vZGUsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24gKGl0SXMpIHtcclxuICAgICAgICAgICAgLy8gV2UgaGF2ZSBhIHJlcXVlc3QgYW5kXHJcbiAgICAgICAgICAgIC8vIGl0IHJlcXVlc3RlZCB0byBzZWxlY3QgYSBsb2NhdGlvblxyXG4gICAgICAgICAgICAvLyBhbmQgc2VsZWN0aW9uIG1vZGUgZ29lcyBvZmZcclxuICAgICAgICAgICAgaWYgKHRoaXMucmVxdWVzdEluZm8gJiZcclxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8uc2VsZWN0TG9jYXRpb24gPT09IHRydWUgJiZcclxuICAgICAgICAgICAgICAgIGl0SXMgPT09IGZhbHNlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUGFzcyB0aGUgc2VsZWN0ZWQgY2xpZW50IGluIHRoZSBpbmZvXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvLnNlbGVjdGVkTG9jYXRpb24gPSB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZExvY2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAvLyBBbmQgZ28gYmFja1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ29CYWNrKHRoaXMucmVxdWVzdEluZm8pO1xyXG4gICAgICAgICAgICAgICAgLy8gTGFzdCwgY2xlYXIgcmVxdWVzdEluZm9cclxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gVGVzdGluZ0RhdGFcclxuICAgIHRoaXMudmlld01vZGVsLmxvY2F0aW9ucyhyZXF1aXJlKCcuLi90ZXN0ZGF0YS9sb2NhdGlvbnMnKS5sb2NhdGlvbnMpO1xyXG59KTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcclxuXHJcbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgb3B0aW9ucyk7XHJcbiAgICBcclxuICAgIGlmIChvcHRpb25zLnNlbGVjdExvY2F0aW9uID09PSB0cnVlKSB7XHJcbiAgICAgICAgdGhpcy52aWV3TW9kZWwuaXNTZWxlY3Rpb25Nb2RlKHRydWUpO1xyXG4gICAgICAgIC8vIHByZXNldDpcclxuICAgICAgICB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZExvY2F0aW9uKG9wdGlvbnMuc2VsZWN0ZWRMb2NhdGlvbik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChvcHRpb25zLnJvdXRlICYmIG9wdGlvbnMucm91dGUuc2VnbWVudHMpIHtcclxuICAgICAgICB2YXIgaWQgPSBvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdO1xyXG4gICAgICAgIGlmIChpZCkge1xyXG4gICAgICAgICAgICBpZiAoaWQgPT09ICduZXcnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5zaGVsbC5nbygnbG9jYXRpb25FZGl0aW9uJywge1xyXG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZTogb3B0aW9ucy5yb3V0ZS5zZWdtZW50c1sxXSAvLyAnc2VydmljZVJhZGl1cycsICdzZXJ2aWNlTG9jYXRpb24nXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvKCdsb2NhdGlvbkVkaXRpb24nLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb25JRDogaWRcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKGFwcCkge1xyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJ0xvY2F0aW9ucycpO1xyXG5cclxuICAgIC8vIEZ1bGwgbGlzdCBvZiBsb2NhdGlvbnNcclxuICAgIHRoaXMubG9jYXRpb25zID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcclxuXHJcbiAgICAvLyBFc3BlY2lhbCBtb2RlIHdoZW4gaW5zdGVhZCBvZiBwaWNrIGFuZCBlZGl0IHdlIGFyZSBqdXN0IHNlbGVjdGluZ1xyXG4gICAgLy8gKHdoZW4gZWRpdGluZyBhbiBhcHBvaW50bWVudClcclxuICAgIHRoaXMuaXNTZWxlY3Rpb25Nb2RlID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcblxyXG4gICAgdGhpcy5zZWxlY3RlZExvY2F0aW9uID0ga28ub2JzZXJ2YWJsZShudWxsKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZWxlY3RMb2NhdGlvbiA9IGZ1bmN0aW9uKHNlbGVjdGVkTG9jYXRpb24pIHtcclxuICAgICAgICBcclxuICAgICAgICBpZiAodGhpcy5pc1NlbGVjdGlvbk1vZGUoKSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkTG9jYXRpb24oc2VsZWN0ZWRMb2NhdGlvbik7XHJcbiAgICAgICAgICAgIHRoaXMuaXNTZWxlY3Rpb25Nb2RlKGZhbHNlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGFwcC5zaGVsbC5nbygnbG9jYXRpb25FZGl0aW9uJywge1xyXG4gICAgICAgICAgICAgICAgbG9jYXRpb25JRDogc2VsZWN0ZWRMb2NhdGlvbi5sb2NhdGlvbklEKClcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0uYmluZCh0aGlzKTtcclxufVxyXG4iLCIvKipcbiAgICBMb2dpbiBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxuICAgIFVzZXIgPSByZXF1aXJlKCcuLi9tb2RlbHMvVXNlcicpLFxuICAgIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gTG9naW5BY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkFub255bW91cztcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU2VjdGlvbk5hdkJhcignTG9nIGluJyk7XG4gICAgXG4gICAgLy8gUGVyZm9ybSBsb2ctaW4gcmVxdWVzdCB3aGVuIGlzIHJlcXVlc3RlZCBieSB0aGUgZm9ybTpcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwuaXNMb2dpbmdJbixcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24odikge1xuICAgICAgICAgICAgaWYgKHYgPT09IHRydWUpIHtcblxuICAgICAgICAgICAgICAgIC8vIFBlcmZvcm0gbG9naW5nXG5cbiAgICAgICAgICAgICAgICAvLyBOb3RpZnkgc3RhdGU6XG4gICAgICAgICAgICAgICAgdmFyICRidG4gPSB0aGlzLiRhY3Rpdml0eS5maW5kKCdbdHlwZT1cInN1Ym1pdFwiXScpO1xuICAgICAgICAgICAgICAgICRidG4uYnV0dG9uKCdsb2FkaW5nJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBDbGVhciBwcmV2aW91cyBlcnJvciBzbyBtYWtlcyBjbGVhciB3ZVxuICAgICAgICAgICAgICAgIC8vIGFyZSBhdHRlbXB0aW5nXG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwubG9naW5FcnJvcignJyk7XG5cbiAgICAgICAgICAgICAgICB2YXIgZW5kZWQgPSBmdW5jdGlvbiBlbmRlZCgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuaXNMb2dpbmdJbihmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICRidG4uYnV0dG9uKCdyZXNldCcpO1xuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAgICAgICAgIC8vIEFmdGVyIGNsZWFuLXVwIGVycm9yICh0byBmb3JjZSBzb21lIHZpZXcgdXBkYXRlcyksXG4gICAgICAgICAgICAgICAgLy8gdmFsaWRhdGUgYW5kIGFib3J0IG9uIGVycm9yXG4gICAgICAgICAgICAgICAgLy8gTWFudWFsbHkgY2hlY2tpbmcgZXJyb3Igb24gZWFjaCBmaWVsZFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnZpZXdNb2RlbC51c2VybmFtZS5lcnJvcigpIHx8XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnBhc3N3b3JkLmVycm9yKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwubG9naW5FcnJvcignUmV2aWV3IHlvdXIgZGF0YScpO1xuICAgICAgICAgICAgICAgICAgICBlbmRlZCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAubW9kZWwubG9naW4oXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnVzZXJuYW1lKCksXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnBhc3N3b3JkKClcbiAgICAgICAgICAgICAgICApLnRoZW4oZnVuY3Rpb24obG9naW5EYXRhKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwubG9naW5FcnJvcignJyk7XG4gICAgICAgICAgICAgICAgICAgIGVuZGVkKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGZvcm0gZGF0YVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC51c2VybmFtZSgnJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnBhc3N3b3JkKCcnKTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcC5nb0Rhc2hib2FyZCgpO1xuXG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKS5jYXRjaChmdW5jdGlvbihlcnIpIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgbXNnID0gZXJyICYmIGVyci5yZXNwb25zZUpTT04gJiYgZXJyLnJlc3BvbnNlSlNPTi5lcnJvck1lc3NhZ2UgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVyciAmJiBlcnIuc3RhdHVzVGV4dCB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0ludmFsaWQgdXNlcm5hbWUgb3IgcGFzc3dvcmQnO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmxvZ2luRXJyb3IobXNnKTtcbiAgICAgICAgICAgICAgICAgICAgZW5kZWQoKTtcbiAgICAgICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcylcbiAgICB9KTtcbiAgICBcbiAgICAvLyBGb2N1cyBmaXJzdCBiYWQgZmllbGQgb24gZXJyb3JcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwubG9naW5FcnJvcixcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAvLyBMb2dpbiBpcyBlYXN5IHNpbmNlIHdlIG1hcmsgYm90aCB1bmlxdWUgZmllbGRzXG4gICAgICAgICAgICAvLyBhcyBlcnJvciBvbiBsb2dpbkVycm9yIChpdHMgYSBnZW5lcmFsIGZvcm0gZXJyb3IpXG4gICAgICAgICAgICB2YXIgaW5wdXQgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCc6aW5wdXQnKS5nZXQoMCk7XG4gICAgICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgICAgIGlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaW5wdXQuYmx1cigpO1xuICAgICAgICB9LmJpbmQodGhpcylcbiAgICB9KTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbnZhciBGb3JtQ3JlZGVudGlhbHMgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL0Zvcm1DcmVkZW50aWFscycpO1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG5cbiAgICB2YXIgY3JlZGVudGlhbHMgPSBuZXcgRm9ybUNyZWRlbnRpYWxzKCk7ICAgIFxuICAgIHRoaXMudXNlcm5hbWUgPSBjcmVkZW50aWFscy51c2VybmFtZTtcbiAgICB0aGlzLnBhc3N3b3JkID0gY3JlZGVudGlhbHMucGFzc3dvcmQ7XG5cbiAgICB0aGlzLmxvZ2luRXJyb3IgPSBrby5vYnNlcnZhYmxlKCcnKTtcbiAgICBcbiAgICB0aGlzLmlzTG9naW5nSW4gPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcbiAgICBcbiAgICB0aGlzLnBlcmZvcm1Mb2dpbiA9IGZ1bmN0aW9uIHBlcmZvcm1Mb2dpbigpIHtcblxuICAgICAgICB0aGlzLmlzTG9naW5nSW4odHJ1ZSk7ICAgICAgICBcbiAgICB9LmJpbmQodGhpcyk7XG59XG4iLCIvKipcbiAgICBMb2dvdXQgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBMb2dvdXRBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhzdGF0ZSkge1xuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xuICAgIFxuICAgIHRoaXMuYXBwLm1vZGVsLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIEFub255bW91cyB1c2VyIGFnYWluXG4gICAgICAgIHZhciBuZXdBbm9uID0gdGhpcy5hcHAubW9kZWwudXNlcigpLmNvbnN0cnVjdG9yLm5ld0Fub255bW91cygpO1xuICAgICAgICB0aGlzLmFwcC5tb2RlbC51c2VyKCkubW9kZWwudXBkYXRlV2l0aChuZXdBbm9uKTtcblxuICAgICAgICAvLyBHbyBpbmRleFxuICAgICAgICB0aGlzLmFwcC5zaGVsbC5nbygnLycpO1xuICAgICAgICBcbiAgICB9LmJpbmQodGhpcykpO1xufTtcbiIsIi8qKlxuICAgIE9uYm9hcmRpbmdDb21wbGV0ZSBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIE9uYm9hcmRpbmdDb21wbGV0ZUFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIobnVsbCk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuIiwiLyoqXG4gICAgT25ib2FyZGluZ0hvbWUgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBPbmJvYXJkaW5nSG9tZUFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICAvLyBudWxsIGZvciBMb2dvXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKG51bGwpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcbiIsIi8qKlxuICAgIE9uYm9hcmRpbmcgUG9zaXRpb25zIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXG4gICAgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBPbmJvYXJkaW5nUG9zaXRpb25zQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKCdKb2IgVGl0bGVzJyk7XG5cbiAgICAvLyBUZXN0aW5nRGF0YVxuICAgIHNldFNvbWVUZXN0aW5nRGF0YSh0aGlzLnZpZXdNb2RlbCk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG5cbiAgICAvLyBGdWxsIGxpc3Qgb2YgcG9zaXRpb25zXG4gICAgdGhpcy5wb3NpdGlvbnMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xufVxuXG52YXIgUG9zaXRpb24gPSByZXF1aXJlKCcuLi9tb2RlbHMvUG9zaXRpb24nKTtcbi8vIFVzZXJQb3NpdGlvbiBtb2RlbFxuZnVuY3Rpb24gc2V0U29tZVRlc3RpbmdEYXRhKHZpZXdNb2RlbCkge1xuICAgIFxuICAgIHZpZXdNb2RlbC5wb3NpdGlvbnMucHVzaChuZXcgUG9zaXRpb24oe1xuICAgICAgICBwb3NpdGlvblNpbmd1bGFyOiAnTWFzc2FnZSBUaGVyYXBpc3QnXG4gICAgfSkpO1xuICAgIHZpZXdNb2RlbC5wb3NpdGlvbnMucHVzaChuZXcgUG9zaXRpb24oe1xuICAgICAgICBwb3NpdGlvblNpbmd1bGFyOiAnSG91c2VrZWVwZXInXG4gICAgfSkpO1xufSIsIi8qKlxuICAgIE93bmVySW5mbyBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIE93bmVySW5mb0FjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ0FjY291bnQnKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG4iLCIvKipcclxuICAgIFByaXZhY3lTZXR0aW5ncyBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gUHJpdmFjeVNldHRpbmdzQWN0aXZpdHkoKSB7XHJcbiAgICBcclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICBcclxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcclxuXHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ0FjY291bnQnKTtcclxuICAgIFxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy5hcHAubW9kZWwucHJpdmFjeVNldHRpbmdzLFxyXG4gICAgICAgIGV2ZW50OiAnZXJyb3InLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICB2YXIgbXNnID0gZXJyLnRhc2sgPT09ICdzYXZlJyA/ICdFcnJvciBzYXZpbmcgcHJpdmFjeSBzZXR0aW5ncy4nIDogJ0Vycm9yIGxvYWRpbmcgcHJpdmFjeSBzZXR0aW5ncy4nO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5tb2RhbHMuc2hvd0Vycm9yKHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBtc2csXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyICYmIGVyci50YXNrICYmIGVyci5lcnJvciB8fCBlcnJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhzdGF0ZSkge1xyXG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBzdGF0ZSk7XHJcbiAgICBcclxuICAgICAgICAvLyBLZWVwIGRhdGEgdXBkYXRlZDpcclxuICAgIHRoaXMuYXBwLm1vZGVsLnByaXZhY3lTZXR0aW5ncy5zeW5jKCk7XHJcbiAgICAvLyBEaXNjYXJkIGFueSBwcmV2aW91cyB1bnNhdmVkIGVkaXRcclxuICAgIHRoaXMudmlld01vZGVsLmRpc2NhcmQoKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbChhcHApIHtcclxuXHJcbiAgICB2YXIgcHJpdmFjeVNldHRpbmdzID0gYXBwLm1vZGVsLnByaXZhY3lTZXR0aW5ncztcclxuXHJcbiAgICB2YXIgc2V0dGluZ3NWZXJzaW9uID0gcHJpdmFjeVNldHRpbmdzLm5ld1ZlcnNpb24oKTtcclxuICAgIHNldHRpbmdzVmVyc2lvbi5pc09ic29sZXRlLnN1YnNjcmliZShmdW5jdGlvbihpdElzKSB7XHJcbiAgICAgICAgaWYgKGl0SXMpIHtcclxuICAgICAgICAgICAgLy8gbmV3IHZlcnNpb24gZnJvbSBzZXJ2ZXIgd2hpbGUgZWRpdGluZ1xyXG4gICAgICAgICAgICAvLyBGVVRVUkU6IHdhcm4gYWJvdXQgYSBuZXcgcmVtb3RlIHZlcnNpb24gYXNraW5nXHJcbiAgICAgICAgICAgIC8vIGNvbmZpcm1hdGlvbiB0byBsb2FkIHRoZW0gb3IgZGlzY2FyZCBhbmQgb3ZlcndyaXRlIHRoZW07XHJcbiAgICAgICAgICAgIC8vIHRoZSBzYW1lIGlzIG5lZWQgb24gc2F2ZSgpLCBhbmQgb24gc2VydmVyIHJlc3BvbnNlXHJcbiAgICAgICAgICAgIC8vIHdpdGggYSA1MDk6Q29uZmxpY3Qgc3RhdHVzIChpdHMgYm9keSBtdXN0IGNvbnRhaW4gdGhlXHJcbiAgICAgICAgICAgIC8vIHNlcnZlciB2ZXJzaW9uKS5cclxuICAgICAgICAgICAgLy8gUmlnaHQgbm93LCBqdXN0IG92ZXJ3cml0ZSBjdXJyZW50IGNoYW5nZXMgd2l0aFxyXG4gICAgICAgICAgICAvLyByZW1vdGUgb25lczpcclxuICAgICAgICAgICAgc2V0dGluZ3NWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gQWN0dWFsIGRhdGEgZm9yIHRoZSBmb3JtOlxyXG4gICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzVmVyc2lvbi52ZXJzaW9uO1xyXG5cclxuICAgIHRoaXMuaXNMb2NrZWQgPSBwcml2YWN5U2V0dGluZ3MuaXNMb2NrZWQ7XHJcblxyXG4gICAgdGhpcy5zdWJtaXRUZXh0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKCkgPyBcclxuICAgICAgICAgICAgICAgICdsb2FkaW5nLi4uJyA6IFxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc1NhdmluZygpID8gXHJcbiAgICAgICAgICAgICAgICAgICAgJ3NhdmluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgICAgICAnU2F2ZSdcclxuICAgICAgICApO1xyXG4gICAgfSwgcHJpdmFjeVNldHRpbmdzKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNjYXJkID0gZnVuY3Rpb24gZGlzY2FyZCgpIHtcclxuICAgICAgICBzZXR0aW5nc1ZlcnNpb24ucHVsbCh7IGV2ZW5JZk5ld2VyOiB0cnVlIH0pO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG5cclxuICAgIHRoaXMuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICAgICAgLy8gRm9yY2UgdG8gc2F2ZSwgZXZlbiBpZiB0aGVyZSB3YXMgcmVtb3RlIHVwZGF0ZXNcclxuICAgICAgICBzZXR0aW5nc1ZlcnNpb24ucHVzaCh7IGV2ZW5JZk9ic29sZXRlOiB0cnVlIH0pO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG59XHJcbiIsIi8qKlxuICAgIFNjaGVkdWxpbmcgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxuICAgIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gU2NoZWR1bGluZ0FjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU2VjdGlvbk5hdkJhcignU2NoZWR1bGluZycpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG59XG4iLCIvKipcclxuICAgIFNjaGVkdWxpbmdQcmVmZXJlbmNlcyBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gU2NoZWR1bGluZ1ByZWZlcmVuY2VzQWN0aXZpdHkoKSB7XHJcbiAgICBcclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICBcclxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuRnJlZWxhbmNlcjtcclxuXHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ1NjaGVkdWxpbmcnKTtcclxuICAgIFxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy5hcHAubW9kZWwuc2NoZWR1bGluZ1ByZWZlcmVuY2VzLFxyXG4gICAgICAgIGV2ZW50OiAnZXJyb3InLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICB2YXIgbXNnID0gZXJyLnRhc2sgPT09ICdzYXZlJyA/ICdFcnJvciBzYXZpbmcgc2NoZWR1bGluZyBwcmVmZXJlbmNlcy4nIDogJ0Vycm9yIGxvYWRpbmcgc2NoZWR1bGluZyBwcmVmZXJlbmNlcy4nO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5tb2RhbHMuc2hvd0Vycm9yKHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBtc2csXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyICYmIGVyci50YXNrICYmIGVyci5lcnJvciB8fCBlcnJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhzdGF0ZSkge1xyXG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBzdGF0ZSk7XHJcbiAgICBcclxuICAgICAgICAvLyBLZWVwIGRhdGEgdXBkYXRlZDpcclxuICAgIHRoaXMuYXBwLm1vZGVsLnNjaGVkdWxpbmdQcmVmZXJlbmNlcy5zeW5jKCk7XHJcbiAgICAvLyBEaXNjYXJkIGFueSBwcmV2aW91cyB1bnNhdmVkIGVkaXRcclxuICAgIHRoaXMudmlld01vZGVsLmRpc2NhcmQoKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbChhcHApIHtcclxuXHJcbiAgICB2YXIgc2NoZWR1bGluZ1ByZWZlcmVuY2VzID0gYXBwLm1vZGVsLnNjaGVkdWxpbmdQcmVmZXJlbmNlcztcclxuXHJcbiAgICB2YXIgcHJlZnNWZXJzaW9uID0gc2NoZWR1bGluZ1ByZWZlcmVuY2VzLm5ld1ZlcnNpb24oKTtcclxuICAgIHByZWZzVmVyc2lvbi5pc09ic29sZXRlLnN1YnNjcmliZShmdW5jdGlvbihpdElzKSB7XHJcbiAgICAgICAgaWYgKGl0SXMpIHtcclxuICAgICAgICAgICAgLy8gbmV3IHZlcnNpb24gZnJvbSBzZXJ2ZXIgd2hpbGUgZWRpdGluZ1xyXG4gICAgICAgICAgICAvLyBGVVRVUkU6IHdhcm4gYWJvdXQgYSBuZXcgcmVtb3RlIHZlcnNpb24gYXNraW5nXHJcbiAgICAgICAgICAgIC8vIGNvbmZpcm1hdGlvbiB0byBsb2FkIHRoZW0gb3IgZGlzY2FyZCBhbmQgb3ZlcndyaXRlIHRoZW07XHJcbiAgICAgICAgICAgIC8vIHRoZSBzYW1lIGlzIG5lZWQgb24gc2F2ZSgpLCBhbmQgb24gc2VydmVyIHJlc3BvbnNlXHJcbiAgICAgICAgICAgIC8vIHdpdGggYSA1MDk6Q29uZmxpY3Qgc3RhdHVzIChpdHMgYm9keSBtdXN0IGNvbnRhaW4gdGhlXHJcbiAgICAgICAgICAgIC8vIHNlcnZlciB2ZXJzaW9uKS5cclxuICAgICAgICAgICAgLy8gUmlnaHQgbm93LCBqdXN0IG92ZXJ3cml0ZSBjdXJyZW50IGNoYW5nZXMgd2l0aFxyXG4gICAgICAgICAgICAvLyByZW1vdGUgb25lczpcclxuICAgICAgICAgICAgcHJlZnNWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gQWN0dWFsIGRhdGEgZm9yIHRoZSBmb3JtOlxyXG4gICAgdGhpcy5wcmVmcyA9IHByZWZzVmVyc2lvbi52ZXJzaW9uO1xyXG5cclxuICAgIHRoaXMuaXNMb2NrZWQgPSBzY2hlZHVsaW5nUHJlZmVyZW5jZXMuaXNMb2NrZWQ7XHJcblxyXG4gICAgdGhpcy5zdWJtaXRUZXh0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKCkgPyBcclxuICAgICAgICAgICAgICAgICdsb2FkaW5nLi4uJyA6IFxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc1NhdmluZygpID8gXHJcbiAgICAgICAgICAgICAgICAgICAgJ3NhdmluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgICAgICAnU2F2ZSdcclxuICAgICAgICApO1xyXG4gICAgfSwgc2NoZWR1bGluZ1ByZWZlcmVuY2VzKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNjYXJkID0gZnVuY3Rpb24gZGlzY2FyZCgpIHtcclxuICAgICAgICBwcmVmc1ZlcnNpb24ucHVsbCh7IGV2ZW5JZk5ld2VyOiB0cnVlIH0pO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG5cclxuICAgIHRoaXMuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICAgICAgLy8gRm9yY2UgdG8gc2F2ZSwgZXZlbiBpZiB0aGVyZSB3YXMgcmVtb3RlIHVwZGF0ZXNcclxuICAgICAgICBwcmVmc1ZlcnNpb24ucHVzaCh7IGV2ZW5JZk9ic29sZXRlOiB0cnVlIH0pO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmluY3JlbWVudHNFeGFtcGxlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBzdHIgPSAnZS5nLiAnLFxyXG4gICAgICAgICAgICBpbmNTaXplID0gdGhpcy5pbmNyZW1lbnRzU2l6ZUluTWludXRlcygpLFxyXG4gICAgICAgICAgICBtID0gbW9tZW50KHsgaG91cjogMTAsIG1pbnV0ZTogMCB9KSxcclxuICAgICAgICAgICAgaG91cnMgPSBbbS5mb3JtYXQoJ0hIOm1tJyldO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgNDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGhvdXJzLnB1c2goXHJcbiAgICAgICAgICAgICAgICBtLmFkZChpbmNTaXplLCAnbWludXRlcycpXHJcbiAgICAgICAgICAgICAgICAuZm9ybWF0KCdISDptbScpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0ciArPSBob3Vycy5qb2luKCcsICcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBzdHI7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzLnByZWZzKTtcclxufVxyXG4iLCIvKipcclxuICAgIHNlcnZpY2VzIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbiAgICBcclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIFNlcnZpY2VzQWN0aXZpdHkoKSB7XHJcblxyXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIFxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkZyZWxhbmNlcjtcclxuICAgIFxyXG4gICAgLy8gVE9ETzogb24gc2hvdywgbmVlZCB0byBiZSB1cGRhdGVkIHdpdGggdGhlIEpvYlRpdGxlIG5hbWVcclxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignSm9iIHRpdGxlJyk7XHJcbiAgICBcclxuICAgIC8vdGhpcy4kbGlzdFZpZXcgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjc2VydmljZXNMaXN0VmlldycpO1xyXG5cclxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCgpO1xyXG5cclxuICAgIC8vIFRlc3RpbmdEYXRhXHJcbiAgICB0aGlzLnZpZXdNb2RlbC5zZXJ2aWNlcyhyZXF1aXJlKCcuLi90ZXN0ZGF0YS9zZXJ2aWNlcycpLnNlcnZpY2VzLm1hcChTZWxlY3RhYmxlKSk7XHJcbiAgICBcclxuICAgIC8vIEhhbmRsZXIgdG8gZ28gYmFjayB3aXRoIHRoZSBzZWxlY3RlZCBzZXJ2aWNlIHdoZW4gXHJcbiAgICAvLyBzZWxlY3Rpb24gbW9kZSBnb2VzIG9mZiBhbmQgcmVxdWVzdERhdGEgaXMgZm9yXHJcbiAgICAvLyAnc2VsZWN0IG1vZGUnXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdNb2RlbC5pc1NlbGVjdGlvbk1vZGUsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24gKGl0SXMpIHtcclxuICAgICAgICAgICAgLy8gV2UgaGF2ZSBhIHJlcXVlc3QgYW5kXHJcbiAgICAgICAgICAgIC8vIGl0IHJlcXVlc3RlZCB0byBzZWxlY3QgYSBzZXJ2aWNlXHJcbiAgICAgICAgICAgIC8vIGFuZCBzZWxlY3Rpb24gbW9kZSBnb2VzIG9mZlxyXG4gICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0RGF0YSAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RGF0YS5zZWxlY3RTZXJ2aWNlcyA9PT0gdHJ1ZSAmJlxyXG4gICAgICAgICAgICAgICAgaXRJcyA9PT0gZmFsc2UpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBQYXNzIHRoZSBzZWxlY3RlZCBjbGllbnQgaW4gdGhlIGluZm9cclxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdERhdGEuc2VsZWN0ZWRTZXJ2aWNlcyA9IHRoaXMudmlld01vZGVsLnNlbGVjdGVkU2VydmljZXMoKTtcclxuICAgICAgICAgICAgICAgIC8vIEFuZCBnbyBiYWNrXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5zaGVsbC5nb0JhY2sodGhpcy5yZXF1ZXN0RGF0YSk7XHJcbiAgICAgICAgICAgICAgICAvLyBMYXN0LCBjbGVhciByZXF1ZXN0RGF0YVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RGF0YSA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcblxyXG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBvcHRpb25zKTtcclxuICAgIFxyXG4gICAgLy8gR2V0IGpvYnRpdGxlSUQgZm9yIHRoZSByZXF1ZXN0XHJcbiAgICB2YXIgcm91dGUgPSB0aGlzLnJlcXVlc3REYXRhICYmIHRoaXMucmVxdWVzdERhdGEucm91dGU7XHJcbiAgICB2YXIgam9iVGl0bGVJRCA9IHJvdXRlICYmIHJvdXRlLnNlZ21lbnRzICYmIHJvdXRlLnNlZ21lbnRzWzBdO1xyXG4gICAgam9iVGl0bGVJRCA9IHBhcnNlSW50KGpvYlRpdGxlSUQsIDEwKTtcclxuICAgIGlmIChqb2JUaXRsZUlEKSB7XHJcbiAgICAgICAgLy8gVE9ETzogZ2V0IGRhdGEgZm9yIHRoZSBKb2IgdGl0bGUgSURcclxuICAgICAgICB0aGlzLmFwcC5tb2RlbC5nZXRVc2VySm9iVGl0bGUoam9iVGl0bGVJRCkudGhlbihmdW5jdGlvbih1c2VySm9idGl0bGUpIHtcclxuICAgICAgICAgICAgaWYgKCF1c2VySm9idGl0bGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdObyB1c2VyIGpvYiB0aXRsZScpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIExvYWQgdXNlciBkYXRhIG9uIHRoaXMgYWN0aXZpdHk6XHJcbiAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnNlcnZpY2VzKHVzZXJKb2J0aXRsZS5zZXJ2aWNlcygpKTtcclxuICAgICAgICAgICAgLy8gRmlsbCBpbiBqb2IgdGl0bGUgbmFtZVxyXG4gICAgICAgICAgICB0aGlzLmFwcC5tb2RlbC5nZXRKb2JUaXRsZShqb2JUaXRsZUlEKS50aGVuKGZ1bmN0aW9uKGpvYlRpdGxlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWpvYlRpdGxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ05vIGpvYiB0aXRsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMubmF2QmFyLmxlZnRBY3Rpb24oKS50ZXh0KGpvYlRpdGxlLnNpbmd1bGFyTmFtZSgpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMucmVxdWVzdERhdGEuc2VsZWN0U2VydmljZXMgPT09IHRydWUpIHtcclxuICAgICAgICB0aGlzLnZpZXdNb2RlbC5pc1NlbGVjdGlvbk1vZGUodHJ1ZSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLyogVHJpYWxzIHRvIHByZXNldHMgdGhlIHNlbGVjdGVkIHNlcnZpY2VzLCBOT1QgV09SS0lOR1xyXG4gICAgICAgIHZhciBzZXJ2aWNlcyA9IChvcHRpb25zLnNlbGVjdGVkU2VydmljZXMgfHwgW10pO1xyXG4gICAgICAgIHZhciBzZWxlY3RlZFNlcnZpY2VzID0gdGhpcy52aWV3TW9kZWwuc2VsZWN0ZWRTZXJ2aWNlcztcclxuICAgICAgICBzZWxlY3RlZFNlcnZpY2VzLnJlbW92ZUFsbCgpO1xyXG4gICAgICAgIHRoaXMudmlld01vZGVsLnNlcnZpY2VzKCkuZm9yRWFjaChmdW5jdGlvbihzZXJ2aWNlKSB7XHJcbiAgICAgICAgICAgIHNlcnZpY2VzLmZvckVhY2goZnVuY3Rpb24oc2VsU2VydmljZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlbFNlcnZpY2UgPT09IHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlLmlzU2VsZWN0ZWQodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRTZXJ2aWNlcy5wdXNoKHNlcnZpY2UpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlLmlzU2VsZWN0ZWQoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAqL1xyXG4gICAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gU2VsZWN0YWJsZShvYmopIHtcclxuICAgIG9iai5pc1NlbGVjdGVkID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcbiAgICByZXR1cm4gb2JqO1xyXG59XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XHJcblxyXG4gICAgLy8gRnVsbCBsaXN0IG9mIHNlcnZpY2VzXHJcbiAgICB0aGlzLnNlcnZpY2VzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcclxuXHJcbiAgICAvLyBFc3BlY2lhbCBtb2RlIHdoZW4gaW5zdGVhZCBvZiBwaWNrIGFuZCBlZGl0IHdlIGFyZSBqdXN0IHNlbGVjdGluZ1xyXG4gICAgLy8gKHdoZW4gZWRpdGluZyBhbiBhcHBvaW50bWVudClcclxuICAgIHRoaXMuaXNTZWxlY3Rpb25Nb2RlID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcblxyXG4gICAgLy8gR3JvdXBlZCBsaXN0IG9mIHByaWNpbmdzOlxyXG4gICAgLy8gRGVmaW5lZCBncm91cHM6IHJlZ3VsYXIgc2VydmljZXMgYW5kIGFkZC1vbnNcclxuICAgIHRoaXMuZ3JvdXBlZFNlcnZpY2VzID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgdmFyIHNlcnZpY2VzID0gdGhpcy5zZXJ2aWNlcygpO1xyXG4gICAgICAgIHZhciBpc1NlbGVjdGlvbiA9IHRoaXMuaXNTZWxlY3Rpb25Nb2RlKCk7XHJcblxyXG4gICAgICAgIHZhciBzZXJ2aWNlc0dyb3VwID0ge1xyXG4gICAgICAgICAgICAgICAgZ3JvdXA6IGlzU2VsZWN0aW9uID8gJ1NlbGVjdCBzdGFuZGFsb25lIHNlcnZpY2VzJyA6ICdTdGFuZGFsb25lIHNlcnZpY2VzJyxcclxuICAgICAgICAgICAgICAgIHNlcnZpY2VzOiBbXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBhZGRvbnNHcm91cCA9IHtcclxuICAgICAgICAgICAgICAgIGdyb3VwOiBpc1NlbGVjdGlvbiA/ICdTZWxlY3QgYWRkLW9uIHNlcnZpY2VzJyA6ICdBZGQtb24gc2VydmljZXMnLFxyXG4gICAgICAgICAgICAgICAgc2VydmljZXM6IFtdXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGdyb3VwcyA9IFtzZXJ2aWNlc0dyb3VwLCBhZGRvbnNHcm91cF07XHJcblxyXG4gICAgICAgIHNlcnZpY2VzLmZvckVhY2goZnVuY3Rpb24oc2VydmljZSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIGlzQWRkb24gPSBzZXJ2aWNlLmlzQWRkb24oKTtcclxuICAgICAgICAgICAgaWYgKGlzQWRkb24pIHtcclxuICAgICAgICAgICAgICAgIGFkZG9uc0dyb3VwLnNlcnZpY2VzLnB1c2goc2VydmljZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzZXJ2aWNlc0dyb3VwLnNlcnZpY2VzLnB1c2goc2VydmljZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdyb3VwcztcclxuXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZWxlY3RlZFNlcnZpY2VzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcclxuICAgIC8qKlxyXG4gICAgICAgIFRvZ2dsZSB0aGUgc2VsZWN0aW9uIHN0YXR1cyBvZiBhIHNlcnZpY2UsIGFkZGluZ1xyXG4gICAgICAgIG9yIHJlbW92aW5nIGl0IGZyb20gdGhlICdzZWxlY3RlZFNlcnZpY2VzJyBhcnJheS5cclxuICAgICoqL1xyXG4gICAgdGhpcy50b2dnbGVTZXJ2aWNlU2VsZWN0aW9uID0gZnVuY3Rpb24oc2VydmljZSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBpbkluZGV4ID0gLTEsXHJcbiAgICAgICAgICAgIGlzU2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGVkU2VydmljZXMoKS5zb21lKGZ1bmN0aW9uKHNlbGVjdGVkU2VydmljZSwgaW5kZXgpIHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdGVkU2VydmljZSA9PT0gc2VydmljZSkge1xyXG4gICAgICAgICAgICAgICAgaW5JbmRleCA9IGluZGV4O1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICBzZXJ2aWNlLmlzU2VsZWN0ZWQoIWlzU2VsZWN0ZWQpO1xyXG5cclxuICAgICAgICBpZiAoaXNTZWxlY3RlZClcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFNlcnZpY2VzLnNwbGljZShpbkluZGV4LCAxKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRTZXJ2aWNlcy5wdXNoKHNlcnZpY2UpO1xyXG5cclxuICAgIH0uYmluZCh0aGlzKTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgRW5kcyB0aGUgc2VsZWN0aW9uIHByb2Nlc3MsIHJlYWR5IHRvIGNvbGxlY3Qgc2VsZWN0aW9uXHJcbiAgICAgICAgYW5kIHBhc3NpbmcgaXQgdG8gdGhlIHJlcXVlc3QgYWN0aXZpdHlcclxuICAgICoqL1xyXG4gICAgdGhpcy5lbmRTZWxlY3Rpb24gPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZShmYWxzZSk7XHJcbiAgICAgICAgXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbn1cclxuIiwiLyoqXG4gICAgU2lnbnVwIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXG4gICAgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBTaWdudXBBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkFub255bW91cztcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xuICAgIC8vIG51bGwgZm9yIExvZ29cbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIobnVsbCk7XG4gICAgXG4gICAgLy8gUGVyZm9ybSBzaWduLXVwIHJlcXVlc3Qgd2hlbiBpcyByZXF1ZXN0ZWQgYnkgdGhlIGZvcm06XG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLmlzU2lnbmluZ1VwLFxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgICBpZiAodiA9PT0gdHJ1ZSkge1xuXG4gICAgICAgICAgICAgICAgLy8gUGVyZm9ybSBzaWdudXBcblxuICAgICAgICAgICAgICAgIC8vIE5vdGlmeSBzdGF0ZTpcbiAgICAgICAgICAgICAgICB2YXIgJGJ0biA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJ1t0eXBlPVwic3VibWl0XCJdJyk7XG4gICAgICAgICAgICAgICAgJGJ0bi5idXR0b24oJ2xvYWRpbmcnKTtcblxuICAgICAgICAgICAgICAgIC8vIENsZWFyIHByZXZpb3VzIGVycm9yIHNvIG1ha2VzIGNsZWFyIHdlXG4gICAgICAgICAgICAgICAgLy8gYXJlIGF0dGVtcHRpbmdcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5zaWdudXBFcnJvcignJyk7XG5cbiAgICAgICAgICAgICAgICB2YXIgZW5kZWQgPSBmdW5jdGlvbiBlbmRlZCgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuaXNTaWduaW5nVXAoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAkYnRuLmJ1dHRvbigncmVzZXQnKTtcbiAgICAgICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgICAgICAvLyBBZnRlciBjbGVhbi11cCBlcnJvciAodG8gZm9yY2Ugc29tZSB2aWV3IHVwZGF0ZXMpLFxuICAgICAgICAgICAgICAgIC8vIHZhbGlkYXRlIGFuZCBhYm9ydCBvbiBlcnJvclxuICAgICAgICAgICAgICAgIC8vIE1hbnVhbGx5IGNoZWNraW5nIGVycm9yIG9uIGVhY2ggZmllbGRcbiAgICAgICAgICAgICAgICBpZiAodGhpcy52aWV3TW9kZWwudXNlcm5hbWUuZXJyb3IoKSB8fFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5wYXNzd29yZC5lcnJvcigpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnNpZ251cEVycm9yKCdSZXZpZXcgeW91ciBkYXRhJyk7XG4gICAgICAgICAgICAgICAgICAgIGVuZGVkKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5tb2RlbC5zaWdudXAoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnVzZXJuYW1lKCksXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnBhc3N3b3JkKCksXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnByb2ZpbGUoKVxuICAgICAgICAgICAgICAgICkudGhlbihmdW5jdGlvbihzaWdudXBEYXRhKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuc2lnbnVwRXJyb3IoJycpO1xuICAgICAgICAgICAgICAgICAgICBlbmRlZCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBmb3JtIGRhdGFcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwudXNlcm5hbWUoJycpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5wYXNzd29yZCgnJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAuZ29EYXNoYm9hcmQoKTtcblxuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IGVyciAmJiBlcnIucmVzcG9uc2VKU09OICYmIGVyci5yZXNwb25zZUpTT04uZXJyb3JNZXNzYWdlIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnIgJiYgZXJyLnN0YXR1c1RleHQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICdJbnZhbGlkIHVzZXJuYW1lIG9yIHBhc3N3b3JkJztcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5zaWdudXBFcnJvcihtc2cpO1xuICAgICAgICAgICAgICAgICAgICBlbmRlZCgpO1xuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKVxuICAgIH0pO1xuICAgIFxuICAgIC8vIEZvY3VzIGZpcnN0IGJhZCBmaWVsZCBvbiBlcnJvclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdNb2RlbC5zaWdudXBFcnJvcixcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAvLyBTaWdudXAgaXMgZWFzeSBzaW5jZSB3ZSBtYXJrIGJvdGggdW5pcXVlIGZpZWxkc1xuICAgICAgICAgICAgLy8gYXMgZXJyb3Igb24gc2lnbnVwRXJyb3IgKGl0cyBhIGdlbmVyYWwgZm9ybSBlcnJvcilcbiAgICAgICAgICAgIHZhciBpbnB1dCA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJzppbnB1dCcpLmdldCgwKTtcbiAgICAgICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgICAgICAgaW5wdXQuZm9jdXMoKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpbnB1dC5ibHVyKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgIFxuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMucm91dGUgJiZcbiAgICAgICAgb3B0aW9ucy5yb3V0ZS5zZWdtZW50cyAmJlxuICAgICAgICBvcHRpb25zLnJvdXRlLnNlZ21lbnRzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLnZpZXdNb2RlbC5wcm9maWxlKG9wdGlvbnMucm91dGUuc2VnbWVudHNbMF0pO1xuICAgIH1cbn07XG5cblxudmFyIEZvcm1DcmVkZW50aWFscyA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvRm9ybUNyZWRlbnRpYWxzJyk7XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcblxuICAgIHZhciBjcmVkZW50aWFscyA9IG5ldyBGb3JtQ3JlZGVudGlhbHMoKTsgICAgXG4gICAgdGhpcy51c2VybmFtZSA9IGNyZWRlbnRpYWxzLnVzZXJuYW1lO1xuICAgIHRoaXMucGFzc3dvcmQgPSBjcmVkZW50aWFscy5wYXNzd29yZDtcblxuICAgIHRoaXMuc2lnbnVwRXJyb3IgPSBrby5vYnNlcnZhYmxlKCcnKTtcbiAgICBcbiAgICB0aGlzLmlzU2lnbmluZ1VwID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG4gICAgXG4gICAgdGhpcy5wZXJmb3JtU2lnbnVwID0gZnVuY3Rpb24gcGVyZm9ybVNpZ251cCgpIHtcblxuICAgICAgICB0aGlzLmlzU2lnbmluZ1VwKHRydWUpO1xuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIHRoaXMucHJvZmlsZSA9IGtvLm9ic2VydmFibGUoJ2N1c3RvbWVyJyk7XG59XG4iLCIvKipcclxuICAgIHRleHRFZGl0b3IgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXIsXHJcbiAgICBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcclxuXHJcbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBUZXh0RWRpdG9yQWN0aXZpdHkoKSB7XHJcbiAgICBcclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xyXG4gICAgLy8gVGl0bGUgaXMgZW1wdHkgZXZlciwgc2luY2Ugd2UgYXJlIGluICdnbyBiYWNrJyBtb2RlIGFsbCB0aGUgdGltZSBoZXJlXHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJycpO1xyXG4gICAgXHJcbiAgICAvLyBHZXR0aW5nIGVsZW1lbnRzXHJcbiAgICB0aGlzLiR0ZXh0YXJlYSA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJ3RleHRhcmVhJyk7XHJcbiAgICB0aGlzLnRleHRhcmVhID0gdGhpcy4kdGV4dGFyZWEuZ2V0KDApO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyIGZvciB0aGUgJ3NhdmVkJyBldmVudCBzbyB0aGUgYWN0aXZpdHlcclxuICAgIC8vIHJldHVybnMgYmFjayB0byB0aGUgcmVxdWVzdGVyIGFjdGl2aXR5IGdpdmluZyBpdFxyXG4gICAgLy8gdGhlIG5ldyB0ZXh0XHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdNb2RlbCxcclxuICAgICAgICBldmVudDogJ3NhdmVkJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucmVxdWVzdEluZm8pIHtcclxuICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgaW5mbyB3aXRoIHRoZSBuZXcgdGV4dFxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mby50ZXh0ID0gdGhpcy52aWV3TW9kZWwudGV4dCgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBhbmQgcGFzcyBpdCBiYWNrXHJcbiAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvQmFjayh0aGlzLnJlcXVlc3RJbmZvKTtcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyIHRoZSBjYW5jZWwgZXZlbnRcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLFxyXG4gICAgICAgIGV2ZW50OiAnY2FuY2VsJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgLy8gcmV0dXJuLCBub3RoaW5nIGNoYW5nZWRcclxuICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ29CYWNrKCk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgXHJcbiAgICAvLyBTZXQgbmF2aWdhdGlvbiB0aXRsZSBvciBub3RoaW5nXHJcbiAgICB0aGlzLm5hdkJhci5sZWZ0QWN0aW9uKCkudGV4dChvcHRpb25zLnRpdGxlIHx8ICcnKTtcclxuICAgIFxyXG4gICAgLy8gRmllbGQgaGVhZGVyXHJcbiAgICB0aGlzLnZpZXdNb2RlbC5oZWFkZXJUZXh0KG9wdGlvbnMuaGVhZGVyKTtcclxuICAgIHRoaXMudmlld01vZGVsLnRleHQob3B0aW9ucy50ZXh0KTtcclxuICAgIGlmIChvcHRpb25zLnJvd3NOdW1iZXIpXHJcbiAgICAgICAgdGhpcy52aWV3TW9kZWwucm93c051bWJlcihvcHRpb25zLnJvd3NOdW1iZXIpO1xyXG4gICAgICAgIFxyXG4gICAgLy8gSW5tZWRpYXRlIGZvY3VzIHRvIHRoZSB0ZXh0YXJlYSBmb3IgYmV0dGVyIHVzYWJpbGl0eVxyXG4gICAgdGhpcy50ZXh0YXJlYS5mb2N1cygpO1xyXG4gICAgdGhpcy4kdGV4dGFyZWEuY2xpY2soKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcclxuXHJcbiAgICB0aGlzLmhlYWRlclRleHQgPSBrby5vYnNlcnZhYmxlKCdUZXh0Jyk7XHJcblxyXG4gICAgLy8gVGV4dCB0byBlZGl0XHJcbiAgICB0aGlzLnRleHQgPSBrby5vYnNlcnZhYmxlKCcnKTtcclxuICAgIFxyXG4gICAgLy8gTnVtYmVyIG9mIHJvd3MgZm9yIHRoZSB0ZXh0YXJlYVxyXG4gICAgdGhpcy5yb3dzTnVtYmVyID0ga28ub2JzZXJ2YWJsZSgyKTtcclxuXHJcbiAgICB0aGlzLmNhbmNlbCA9IGZ1bmN0aW9uIGNhbmNlbCgpIHtcclxuICAgICAgICB0aGlzLmVtaXQoJ2NhbmNlbCcpO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgICAgICB0aGlzLmVtaXQoJ3NhdmVkJyk7XHJcbiAgICB9O1xyXG59XHJcblxyXG5WaWV3TW9kZWwuX2luaGVyaXRzKEV2ZW50RW1pdHRlcik7XHJcbiIsIi8qKlxyXG4gICAgV2Vla2x5U2NoZWR1bGUgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIFdlZWtseVNjaGVkdWxlQWN0aXZpdHkoKSB7XHJcbiAgICBcclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICBcclxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuRnJlZWxhbmNlcjtcclxuXHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ1NjaGVkdWxpbmcnKTtcclxuICAgIFxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy5hcHAubW9kZWwuc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlLFxyXG4gICAgICAgIGV2ZW50OiAnZXJyb3InLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICB2YXIgbXNnID0gZXJyLnRhc2sgPT09ICdzYXZlJyA/ICdFcnJvciBzYXZpbmcgeW91ciB3ZWVrbHkgc2NoZWR1bGUuJyA6ICdFcnJvciBsb2FkaW5nIHlvdXIgd2Vla2x5IHNjaGVkdWxlLic7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLm1vZGFscy5zaG93RXJyb3Ioe1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IG1zZyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnIgJiYgZXJyLnRhc2sgJiYgZXJyLmVycm9yIHx8IGVyclxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG59KTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcclxuXHJcbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KHN0YXRlKSB7XHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcclxuICAgIFxyXG4gICAgLy8gS2VlcCBkYXRhIHVwZGF0ZWQ6XHJcbiAgICB0aGlzLmFwcC5tb2RlbC5zaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUuc3luYygpO1xyXG4gICAgLy8gRGlzY2FyZCBhbnkgcHJldmlvdXMgdW5zYXZlZCBlZGl0XHJcbiAgICB0aGlzLnZpZXdNb2RlbC5kaXNjYXJkKCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoYXBwKSB7XHJcblxyXG4gICAgdmFyIHNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSA9IGFwcC5tb2RlbC5zaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGU7XHJcblxyXG4gICAgdmFyIHNjaGVkdWxlVmVyc2lvbiA9IHNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZS5uZXdWZXJzaW9uKCk7XHJcbiAgICBzY2hlZHVsZVZlcnNpb24uaXNPYnNvbGV0ZS5zdWJzY3JpYmUoZnVuY3Rpb24oaXRJcykge1xyXG4gICAgICAgIGlmIChpdElzKSB7XHJcbiAgICAgICAgICAgIC8vIG5ldyB2ZXJzaW9uIGZyb20gc2VydmVyIHdoaWxlIGVkaXRpbmdcclxuICAgICAgICAgICAgLy8gRlVUVVJFOiB3YXJuIGFib3V0IGEgbmV3IHJlbW90ZSB2ZXJzaW9uIGFza2luZ1xyXG4gICAgICAgICAgICAvLyBjb25maXJtYXRpb24gdG8gbG9hZCB0aGVtIG9yIGRpc2NhcmQgYW5kIG92ZXJ3cml0ZSB0aGVtO1xyXG4gICAgICAgICAgICAvLyB0aGUgc2FtZSBpcyBuZWVkIG9uIHNhdmUoKSwgYW5kIG9uIHNlcnZlciByZXNwb25zZVxyXG4gICAgICAgICAgICAvLyB3aXRoIGEgNTA5OkNvbmZsaWN0IHN0YXR1cyAoaXRzIGJvZHkgbXVzdCBjb250YWluIHRoZVxyXG4gICAgICAgICAgICAvLyBzZXJ2ZXIgdmVyc2lvbikuXHJcbiAgICAgICAgICAgIC8vIFJpZ2h0IG5vdywganVzdCBvdmVyd3JpdGUgY3VycmVudCBjaGFuZ2VzIHdpdGhcclxuICAgICAgICAgICAgLy8gcmVtb3RlIG9uZXM6XHJcbiAgICAgICAgICAgIHNjaGVkdWxlVmVyc2lvbi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEFjdHVhbCBkYXRhIGZvciB0aGUgZm9ybTpcclxuICAgIHRoaXMuc2NoZWR1bGUgPSBzY2hlZHVsZVZlcnNpb24udmVyc2lvbjtcclxuXHJcbiAgICB0aGlzLmlzTG9ja2VkID0gc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlLmlzTG9ja2VkO1xyXG5cclxuICAgIHRoaXMuc3VibWl0VGV4dCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZygpID8gXHJcbiAgICAgICAgICAgICAgICAnbG9hZGluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNTYXZpbmcoKSA/IFxyXG4gICAgICAgICAgICAgICAgICAgICdzYXZpbmcuLi4nIDogXHJcbiAgICAgICAgICAgICAgICAgICAgJ1NhdmUnXHJcbiAgICAgICAgKTtcclxuICAgIH0sIHNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzY2FyZCA9IGZ1bmN0aW9uIGRpc2NhcmQoKSB7XHJcbiAgICAgICAgc2NoZWR1bGVWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgICAgICAvLyBGb3JjZSB0byBzYXZlLCBldmVuIGlmIHRoZXJlIHdhcyByZW1vdGUgdXBkYXRlc1xyXG4gICAgICAgIHNjaGVkdWxlVmVyc2lvbi5wdXNoKHsgZXZlbklmT2Jzb2xldGU6IHRydWUgfSk7XHJcbiAgICB9O1xyXG59XHJcbiIsIi8qKlxyXG4gICAgUmVnaXN0cmF0aW9uIG9mIGN1c3RvbSBodG1sIGNvbXBvbmVudHMgdXNlZCBieSB0aGUgQXBwLlxyXG4gICAgQWxsIHdpdGggJ2FwcC0nIGFzIHByZWZpeC5cclxuICAgIFxyXG4gICAgU29tZSBkZWZpbml0aW9ucyBtYXkgYmUgaW5jbHVkZWQgb24tbGluZSByYXRoZXIgdGhhbiBvbiBzZXBhcmF0ZWRcclxuICAgIGZpbGVzICh2aWV3bW9kZWxzKSwgdGVtcGxhdGVzIGFyZSBsaW5rZWQgc28gbmVlZCB0byBiZSBcclxuICAgIGluY2x1ZGVkIGluIHRoZSBodG1sIGZpbGUgd2l0aCB0aGUgc2FtZSBJRCB0aGF0IHJlZmVyZW5jZWQgaGVyZSxcclxuICAgIHVzdWFsbHkgdXNpbmcgYXMgRE9NIElEIHRoZSBzYW1lIG5hbWUgYXMgdGhlIGNvbXBvbmVudCB3aXRoIHN1Zml4ICctdGVtcGxhdGUnLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxudmFyIHByb3BUb29scyA9IHJlcXVpcmUoJy4vdXRpbHMvanNQcm9wZXJ0aWVzVG9vbHMnKTtcclxuXHJcbmZ1bmN0aW9uIGdldE9ic2VydmFibGUob2JzT3JWYWx1ZSkge1xyXG4gICAgaWYgKHR5cGVvZihvYnNPclZhbHVlKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICByZXR1cm4gb2JzT3JWYWx1ZTtcclxuICAgIGVsc2VcclxuICAgICAgICByZXR1cm4ga28ub2JzZXJ2YWJsZShvYnNPclZhbHVlKTtcclxufVxyXG5cclxuZXhwb3J0cy5yZWdpc3RlckFsbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgXHJcbiAgICAvLy8gbmF2YmFyLWFjdGlvblxyXG4gICAga28uY29tcG9uZW50cy5yZWdpc3RlcignYXBwLW5hdmJhci1hY3Rpb24nLCB7XHJcbiAgICAgICAgdGVtcGxhdGU6IHsgZWxlbWVudDogJ25hdmJhci1hY3Rpb24tdGVtcGxhdGUnIH0sXHJcbiAgICAgICAgdmlld01vZGVsOiBmdW5jdGlvbihwYXJhbXMpIHtcclxuXHJcbiAgICAgICAgICAgIHByb3BUb29scy5kZWZpbmVHZXR0ZXIodGhpcywgJ2FjdGlvbicsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgICAgICBwYXJhbXMuYWN0aW9uICYmIHBhcmFtcy5uYXZCYXIoKSA/XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zLm5hdkJhcigpW3BhcmFtcy5hY3Rpb25dKCkgOlxyXG4gICAgICAgICAgICAgICAgICAgIG51bGxcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLy8gdW5sYWJlbGVkLWlucHV0XHJcbiAgICBrby5jb21wb25lbnRzLnJlZ2lzdGVyKCdhcHAtdW5sYWJlbGVkLWlucHV0Jywge1xyXG4gICAgICAgIHRlbXBsYXRlOiB7IGVsZW1lbnQ6ICd1bmxhYmVsZWQtaW5wdXQtdGVtcGxhdGUnIH0sXHJcbiAgICAgICAgdmlld01vZGVsOiBmdW5jdGlvbihwYXJhbXMpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSBnZXRPYnNlcnZhYmxlKHBhcmFtcy52YWx1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMucGxhY2Vob2xkZXIgPSBnZXRPYnNlcnZhYmxlKHBhcmFtcy5wbGFjZWhvbGRlcik7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzYWJsZSA9IGdldE9ic2VydmFibGUocGFyYW1zLmRpc2FibGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLy8gZmVlZGJhY2stZW50cnlcclxuICAgIGtvLmNvbXBvbmVudHMucmVnaXN0ZXIoJ2FwcC1mZWVkYmFjay1lbnRyeScsIHtcclxuICAgICAgICB0ZW1wbGF0ZTogeyBlbGVtZW50OiAnZmVlZGJhY2stZW50cnktdGVtcGxhdGUnIH0sXHJcbiAgICAgICAgdmlld01vZGVsOiBmdW5jdGlvbihwYXJhbXMpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2VjdGlvbiA9IGdldE9ic2VydmFibGUocGFyYW1zLnNlY3Rpb24gfHwgJycpO1xyXG4gICAgICAgICAgICB0aGlzLnVybCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAnL2ZlZWRiYWNrLycgKyB0aGlzLnNlY3Rpb24oKTtcclxuICAgICAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgTmF2YmFyIGV4dGVuc2lvbiBvZiB0aGUgQXBwLFxyXG4gICAgYWRkcyB0aGUgZWxlbWVudHMgdG8gbWFuYWdlIGEgdmlldyBtb2RlbFxyXG4gICAgZm9yIHRoZSBOYXZCYXIgYW5kIGF1dG9tYXRpYyBjaGFuZ2VzXHJcbiAgICB1bmRlciBzb21lIG1vZGVsIGNoYW5nZXMgbGlrZSB1c2VyIGxvZ2luL2xvZ291dFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIE5hdkJhciA9IHJlcXVpcmUoJy4vdmlld21vZGVscy9OYXZCYXInKSxcclxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcclxuXHJcbmV4cG9ydHMuZXh0ZW5kcyA9IGZ1bmN0aW9uIChhcHApIHtcclxuICAgIFxyXG4gICAgLy8gUkVWSUVXOiBzdGlsbCBuZWVkZWQ/IE1heWJlIHRoZSBwZXIgYWN0aXZpdHkgbmF2QmFyIG1lYW5zXHJcbiAgICAvLyB0aGlzIGlzIG5vdCBuZWVkZWQuIFNvbWUgcHJldmlvdXMgbG9naWMgd2FzIGFscmVhZHkgcmVtb3ZlZFxyXG4gICAgLy8gYmVjYXVzZSB3YXMgdXNlbGVzcy5cclxuICAgIC8vXHJcbiAgICAvLyBBZGp1c3QgdGhlIG5hdmJhciBzZXR1cCBkZXBlbmRpbmcgb24gY3VycmVudCB1c2VyLFxyXG4gICAgLy8gc2luY2UgZGlmZmVyZW50IHRoaW5ncyBhcmUgbmVlZCBmb3IgbG9nZ2VkLWluL291dC5cclxuICAgIGZ1bmN0aW9uIGFkanVzdFVzZXJCYXIoKSB7XHJcblxyXG4gICAgICAgIHZhciB1c2VyID0gYXBwLm1vZGVsLnVzZXIoKTtcclxuXHJcbiAgICAgICAgaWYgKHVzZXIuaXNBbm9ueW1vdXMoKSkge1xyXG4gICAgICAgICAgICBhcHAubmF2QmFyKCkucmlnaHRBY3Rpb24oTmF2QWN0aW9uLm1lbnVPdXQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIENvbW1lbnRlZCBsaW5lcywgdXNlZCBwcmV2aW91c2x5IGJ1dCB1bnVzZWQgbm93LCBpdCBtdXN0IGJlIGVub3VnaCB3aXRoIHRoZSB1cGRhdGVcclxuICAgIC8vIHBlciBhY3Rpdml0eSBjaGFuZ2VcclxuICAgIC8vYXBwLm1vZGVsLnVzZXIoKS5pc0Fub255bW91cy5zdWJzY3JpYmUodXBkYXRlU3RhdGVzT25Vc2VyQ2hhbmdlKTtcclxuICAgIC8vYXBwLm1vZGVsLnVzZXIoKS5vbmJvYXJkaW5nU3RlcC5zdWJzY3JpYmUodXBkYXRlU3RhdGVzT25Vc2VyQ2hhbmdlKTtcclxuICAgIFxyXG4gICAgYXBwLm5hdkJhciA9IGtvLm9ic2VydmFibGUobnVsbCk7XHJcbiAgICBcclxuICAgIHZhciByZWZyZXNoTmF2ID0gZnVuY3Rpb24gcmVmcmVzaE5hdigpIHtcclxuICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50IHRvIGZvcmNlIGEgY29tcG9uZW50IHVwZGF0ZVxyXG4gICAgICAgICQoJy5BcHBOYXYnKS50cmlnZ2VyKCdjb250ZW50Q2hhbmdlJyk7XHJcbiAgICB9O1xyXG4gICAgdmFyIGF1dG9SZWZyZXNoTmF2ID0gZnVuY3Rpb24gYXV0b1JlZnJlc2hOYXYoYWN0aW9uKSB7XHJcbiAgICAgICAgaWYgKGFjdGlvbikge1xyXG4gICAgICAgICAgICBhY3Rpb24udGV4dC5zdWJzY3JpYmUocmVmcmVzaE5hdik7XHJcbiAgICAgICAgICAgIGFjdGlvbi5pc1RpdGxlLnN1YnNjcmliZShyZWZyZXNoTmF2KTtcclxuICAgICAgICAgICAgYWN0aW9uLmljb24uc3Vic2NyaWJlKHJlZnJlc2hOYXYpO1xyXG4gICAgICAgICAgICBhY3Rpb24uaXNNZW51LnN1YnNjcmliZShyZWZyZXNoTmF2KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICAgIFVwZGF0ZSB0aGUgbmF2IG1vZGVsIHVzaW5nIHRoZSBBY3Rpdml0eSBkZWZhdWx0c1xyXG4gICAgKiovXHJcbiAgICBhcHAudXBkYXRlQXBwTmF2ID0gZnVuY3Rpb24gdXBkYXRlQXBwTmF2KGFjdGl2aXR5KSB7XHJcblxyXG4gICAgICAgIC8vIGlmIHRoZSBhY3Rpdml0eSBoYXMgaXRzIG93blxyXG4gICAgICAgIGlmICgnbmF2QmFyJyBpbiBhY3Rpdml0eSkge1xyXG4gICAgICAgICAgICAvLyBVc2Ugc3BlY2lhbGl6aWVkIGFjdGl2aXR5IGJhciBkYXRhXHJcbiAgICAgICAgICAgIGFwcC5uYXZCYXIoYWN0aXZpdHkubmF2QmFyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFVzZSBkZWZhdWx0IG9uZVxyXG4gICAgICAgICAgICBhcHAubmF2QmFyKG5ldyBOYXZCYXIoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBUT0RPIERvdWJsZSBjaGVjayBpZiBuZWVkZWQuXHJcbiAgICAgICAgLy8gTGF0ZXN0IGNoYW5nZXMsIHdoZW4gbmVlZGVkXHJcbiAgICAgICAgYWRqdXN0VXNlckJhcigpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJlZnJlc2hOYXYoKTtcclxuICAgICAgICBhdXRvUmVmcmVzaE5hdihhcHAubmF2QmFyKCkubGVmdEFjdGlvbigpKTtcclxuICAgICAgICBhdXRvUmVmcmVzaE5hdihhcHAubmF2QmFyKCkucmlnaHRBY3Rpb24oKSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIFVwZGF0ZSB0aGUgYXBwIG1lbnUgdG8gaGlnaGxpZ2h0IHRoZVxyXG4gICAgICAgIGdpdmVuIGxpbmsgbmFtZVxyXG4gICAgKiovXHJcbiAgICBhcHAudXBkYXRlTWVudSA9IGZ1bmN0aW9uIHVwZGF0ZU1lbnUobmFtZSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciAkbWVudSA9ICQoJy5BcHAtbWVudXMgLm5hdmJhci1jb2xsYXBzZScpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFJlbW92ZSBhbnkgYWN0aXZlXHJcbiAgICAgICAgJG1lbnVcclxuICAgICAgICAuZmluZCgnbGknKVxyXG4gICAgICAgIC5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgLy8gQWRkIGFjdGl2ZVxyXG4gICAgICAgICRtZW51XHJcbiAgICAgICAgLmZpbmQoJy5nby0nICsgbmFtZSlcclxuICAgICAgICAuY2xvc2VzdCgnbGknKVxyXG4gICAgICAgIC5hZGRDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgLy8gSGlkZSBtZW51XHJcbiAgICAgICAgJG1lbnVcclxuICAgICAgICAuZmlsdGVyKCc6dmlzaWJsZScpXHJcbiAgICAgICAgLmNvbGxhcHNlKCdoaWRlJyk7XHJcbiAgICB9O1xyXG59O1xyXG4iLCIvKipcclxuICAgIExpc3Qgb2YgYWN0aXZpdGllcyBsb2FkZWQgaW4gdGhlIEFwcCxcclxuICAgIGFzIGFuIG9iamVjdCB3aXRoIHRoZSBhY3Rpdml0eSBuYW1lIGFzIHRoZSBrZXlcclxuICAgIGFuZCB0aGUgY29udHJvbGxlciBhcyB2YWx1ZS5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgJ2NhbGVuZGFyJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NhbGVuZGFyJyksXHJcbiAgICAnZGF0ZXRpbWVQaWNrZXInOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvZGF0ZXRpbWVQaWNrZXInKSxcclxuICAgICdjbGllbnRzJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NsaWVudHMnKSxcclxuICAgICdzZXJ2aWNlcyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9zZXJ2aWNlcycpLFxyXG4gICAgJ2xvY2F0aW9ucyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9sb2NhdGlvbnMnKSxcclxuICAgICd0ZXh0RWRpdG9yJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL3RleHRFZGl0b3InKSxcclxuICAgICdob21lJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2hvbWUnKSxcclxuICAgICdhcHBvaW50bWVudCc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9hcHBvaW50bWVudCcpLFxyXG4gICAgJ2Jvb2tpbmdDb25maXJtYXRpb24nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvYm9va2luZ0NvbmZpcm1hdGlvbicpLFxyXG4gICAgJ2luZGV4JzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2luZGV4JyksXHJcbiAgICAnbG9naW4nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvbG9naW4nKSxcclxuICAgICdsb2dvdXQnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvbG9nb3V0JyksXHJcbiAgICAnbGVhcm5Nb3JlJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2xlYXJuTW9yZScpLFxyXG4gICAgJ3NpZ251cCc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9zaWdudXAnKSxcclxuICAgICdjb250YWN0SW5mbyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jb250YWN0SW5mbycpLFxyXG4gICAgJ29uYm9hcmRpbmdQb3NpdGlvbnMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvb25ib2FyZGluZ1Bvc2l0aW9ucycpLFxyXG4gICAgJ29uYm9hcmRpbmdIb21lJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL29uYm9hcmRpbmdIb21lJyksXHJcbiAgICAnbG9jYXRpb25FZGl0aW9uJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2xvY2F0aW9uRWRpdGlvbicpLFxyXG4gICAgJ29uYm9hcmRpbmdDb21wbGV0ZSc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9vbmJvYXJkaW5nQ29tcGxldGUnKSxcclxuICAgICdhY2NvdW50JzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2FjY291bnQnKSxcclxuICAgICdpbmJveCc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9pbmJveCcpLFxyXG4gICAgJ2NvbnZlcnNhdGlvbic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jb252ZXJzYXRpb24nKSxcclxuICAgICdzY2hlZHVsaW5nJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL3NjaGVkdWxpbmcnKSxcclxuICAgICdqb2J0aXRsZXMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvam9idGl0bGVzJyksXHJcbiAgICAnZmVlZGJhY2snOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvZmVlZGJhY2snKSxcclxuICAgICdmYXFzJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2ZhcXMnKSxcclxuICAgICdmZWVkYmFja0Zvcm0nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvZmVlZGJhY2tGb3JtJyksXHJcbiAgICAnY29udGFjdEZvcm0nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvY29udGFjdEZvcm0nKSxcclxuICAgICdjbXMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvY21zJyksXHJcbiAgICAnY2xpZW50RWRpdGlvbic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jbGllbnRFZGl0aW9uJyksXHJcbiAgICAnc2NoZWR1bGluZ1ByZWZlcmVuY2VzJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL3NjaGVkdWxpbmdQcmVmZXJlbmNlcycpLFxyXG4gICAgJ2NhbGVuZGFyU3luY2luZyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jYWxlbmRhclN5bmNpbmcnKSxcclxuICAgICd3ZWVrbHlTY2hlZHVsZSc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy93ZWVrbHlTY2hlZHVsZScpLFxyXG4gICAgJ2Jvb2tNZUJ1dHRvbic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9ib29rTWVCdXR0b24nKSxcclxuICAgICdvd25lckluZm8nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvb3duZXJJbmZvJyksXHJcbiAgICAncHJpdmFjeVNldHRpbmdzJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL3ByaXZhY3lTZXR0aW5ncycpXHJcbn07XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKiBHbG9iYWwgZGVwZW5kZW5jaWVzICoqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnktbW9iaWxlJyk7XHJcbnJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5Lm11bHRpbGluZScpO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG5rby5iaW5kaW5nSGFuZGxlcnMuZm9ybWF0ID0gcmVxdWlyZSgna28vZm9ybWF0QmluZGluZycpLmZvcm1hdEJpbmRpbmc7XHJcbnZhciBib290a25vY2sgPSByZXF1aXJlKCcuL3V0aWxzL2Jvb3Rrbm9ja0JpbmRpbmdIZWxwZXJzJyk7XHJcbnJlcXVpcmUoJy4vdXRpbHMvRnVuY3Rpb24ucHJvdG90eXBlLl9pbmhlcml0cycpO1xyXG5yZXF1aXJlKCcuL3V0aWxzL0Z1bmN0aW9uLnByb3RvdHlwZS5fZGVsYXllZCcpO1xyXG4vLyBQcm9taXNlIHBvbHlmaWxsLCBzbyBpdHMgbm90ICdyZXF1aXJlJ2QgcGVyIG1vZHVsZTpcclxucmVxdWlyZSgnZXM2LXByb21pc2UnKS5wb2x5ZmlsbCgpO1xyXG5cclxudmFyIGxheW91dFVwZGF0ZUV2ZW50ID0gcmVxdWlyZSgnbGF5b3V0VXBkYXRlRXZlbnQnKTtcclxudmFyIE5hdkJhciA9IHJlcXVpcmUoJy4vdmlld21vZGVscy9OYXZCYXInKSxcclxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4vdmlld21vZGVscy9OYXZBY3Rpb24nKSxcclxuICAgIEFwcE1vZGVsID0gcmVxdWlyZSgnLi92aWV3bW9kZWxzL0FwcE1vZGVsJyk7XHJcblxyXG4vLyBSZWdpc3RlciB0aGUgc3BlY2lhbCBsb2NhbGVcclxucmVxdWlyZSgnLi9sb2NhbGVzL2VuLVVTLUxDJyk7XHJcblxyXG4vKipcclxuICAgIEEgc2V0IG9mIGZpeGVzL3dvcmthcm91bmRzIGZvciBCb290c3RyYXAgYmVoYXZpb3IvcGx1Z2luc1xyXG4gICAgdG8gYmUgZXhlY3V0ZWQgYmVmb3JlIEJvb3RzdHJhcCBpcyBpbmNsdWRlZC9leGVjdXRlZC5cclxuICAgIEZvciBleGFtcGxlLCBiZWNhdXNlIG9mIGRhdGEtYmluZGluZyByZW1vdmluZy9jcmVhdGluZyBlbGVtZW50cyxcclxuICAgIHNvbWUgb2xkIHJlZmVyZW5jZXMgdG8gcmVtb3ZlZCBpdGVtcyBtYXkgZ2V0IGFsaXZlIGFuZCBuZWVkIHVwZGF0ZSxcclxuICAgIG9yIHJlLWVuYWJsaW5nIHNvbWUgYmVoYXZpb3JzLlxyXG4qKi9cclxuZnVuY3Rpb24gcHJlQm9vdHN0cmFwV29ya2Fyb3VuZHMoKSB7XHJcbiAgICAvLyBJbnRlcm5hbCBCb290c3RyYXAgc291cmNlIHV0aWxpdHlcclxuICAgIGZ1bmN0aW9uIGdldFRhcmdldEZyb21UcmlnZ2VyKCR0cmlnZ2VyKSB7XHJcbiAgICAgICAgdmFyIGhyZWYsXHJcbiAgICAgICAgICAgIHRhcmdldCA9ICR0cmlnZ2VyLmF0dHIoJ2RhdGEtdGFyZ2V0JykgfHxcclxuICAgICAgICAgICAgKGhyZWYgPSAkdHJpZ2dlci5hdHRyKCdocmVmJykpICYmIFxyXG4gICAgICAgICAgICBocmVmLnJlcGxhY2UoLy4qKD89I1teXFxzXSskKS8sICcnKTsgLy8gc3RyaXAgZm9yIGllN1xyXG5cclxuICAgICAgICByZXR1cm4gJCh0YXJnZXQpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBCdWc6IG5hdmJhci1jb2xsYXBzZSBlbGVtZW50cyBob2xkIGEgcmVmZXJlbmNlIHRvIHRoZWlyIG9yaWdpbmFsXHJcbiAgICAvLyAkdHJpZ2dlciwgYnV0IHRoYXQgdHJpZ2dlciBjYW4gY2hhbmdlIG9uIGRpZmZlcmVudCAnY2xpY2tzJyBvclxyXG4gICAgLy8gZ2V0IHJlbW92ZWQgdGhlIG9yaWdpbmFsLCBzbyBpdCBtdXN0IHJlZmVyZW5jZSB0aGUgbmV3IG9uZVxyXG4gICAgLy8gKHRoZSBsYXRlc3RzIGNsaWNrZWQsIGFuZCBub3QgdGhlIGNhY2hlZCBvbmUgdW5kZXIgdGhlICdkYXRhJyBBUEkpLiAgICBcclxuICAgIC8vIE5PVEU6IGhhbmRsZXIgbXVzdCBleGVjdXRlIGJlZm9yZSB0aGUgQm9vdHN0cmFwIGhhbmRsZXIgZm9yIHRoZSBzYW1lXHJcbiAgICAvLyBldmVudCBpbiBvcmRlciB0byB3b3JrLlxyXG4gICAgJChkb2N1bWVudCkub24oJ2NsaWNrLmJzLmNvbGxhcHNlLmRhdGEtYXBpLndvcmthcm91bmQnLCAnW2RhdGEtdG9nZ2xlPVwiY29sbGFwc2VcIl0nLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgJHRhcmdldCA9IGdldFRhcmdldEZyb21UcmlnZ2VyKCR0KSxcclxuICAgICAgICAgICAgZGF0YSA9ICR0YXJnZXQgJiYgJHRhcmdldC5kYXRhKCdicy5jb2xsYXBzZScpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIElmIGFueVxyXG4gICAgICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgICAgIC8vIFJlcGxhY2UgdGhlIHRyaWdnZXIgaW4gdGhlIGRhdGEgcmVmZXJlbmNlOlxyXG4gICAgICAgICAgICBkYXRhLiR0cmlnZ2VyID0gJHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIE9uIGVsc2UsIG5vdGhpbmcgdG8gZG8sIGEgbmV3IENvbGxhcHNlIGluc3RhbmNlIHdpbGwgYmUgY3JlYXRlZFxyXG4gICAgICAgIC8vIHdpdGggdGhlIGNvcnJlY3QgdGFyZ2V0LCB0aGUgZmlyc3QgdGltZVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgQXBwIHN0YXRpYyBjbGFzc1xyXG4qKi9cclxudmFyIGFwcCA9IHtcclxuICAgIHNoZWxsOiByZXF1aXJlKCcuL2FwcC5zaGVsbCcpLFxyXG4gICAgXHJcbiAgICAvLyBOZXcgYXBwIG1vZGVsLCB0aGF0IHN0YXJ0cyB3aXRoIGFub255bW91cyB1c2VyXHJcbiAgICBtb2RlbDogbmV3IEFwcE1vZGVsKCksXHJcbiAgICBcclxuICAgIC8qKiBMb2FkIGFjdGl2aXRpZXMgY29udHJvbGxlcnMgKG5vdCBpbml0aWFsaXplZCkgKiovXHJcbiAgICBhY3Rpdml0aWVzOiByZXF1aXJlKCcuL2FwcC5hY3Rpdml0aWVzJyksXHJcbiAgICBcclxuICAgIG1vZGFsczogcmVxdWlyZSgnLi9hcHAubW9kYWxzJyksXHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEp1c3QgcmVkaXJlY3QgdGhlIGJldHRlciBwbGFjZSBmb3IgY3VycmVudCB1c2VyIGFuZCBzdGF0ZS5cclxuICAgICAgICBOT1RFOiBJdHMgYSBkZWxheWVkIGZ1bmN0aW9uLCBzaW5jZSBvbiBtYW55IGNvbnRleHRzIG5lZWQgdG9cclxuICAgICAgICB3YWl0IGZvciB0aGUgY3VycmVudCAncm91dGluZycgZnJvbSBlbmQgYmVmb3JlIGRvIHRoZSBuZXdcclxuICAgICAgICBoaXN0b3J5IGNoYW5nZS5cclxuICAgICAgICBUT0RPOiBNYXliZSwgcmF0aGVyIHRoYW4gZGVsYXkgaXQsIGNhbiBzdG9wIGN1cnJlbnQgcm91dGluZ1xyXG4gICAgICAgIChjaGFuZ2VzIG9uIFNoZWxsIHJlcXVpcmVkKSBhbmQgcGVyZm9ybSB0aGUgbmV3LlxyXG4gICAgICAgIFRPRE86IE1heWJlIGFsdGVybmF0aXZlIHRvIHByZXZpb3VzLCB0byBwcm92aWRlIGEgJ3JlcGxhY2UnXHJcbiAgICAgICAgaW4gc2hlbGwgcmF0aGVyIHRoYW4gYSBnbywgdG8gYXZvaWQgYXBwZW5kIHJlZGlyZWN0IGVudHJpZXNcclxuICAgICAgICBpbiB0aGUgaGlzdG9yeSwgdGhhdCBjcmVhdGUgdGhlIHByb2JsZW0gb2YgJ2Jyb2tlbiBiYWNrIGJ1dHRvbidcclxuICAgICoqL1xyXG4gICAgZ29EYXNoYm9hcmQ6IGZ1bmN0aW9uIGdvRGFzaGJvYXJkKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFRvIGF2b2lkIGluZmluaXRlIGxvb3BzIGlmIHdlIGFscmVhZHkgYXJlIHBlcmZvcm1pbmcgXHJcbiAgICAgICAgLy8gYSBnb0Rhc2hib2FyZCB0YXNrLCB3ZSBmbGFnIHRoZSBleGVjdXRpb25cclxuICAgICAgICAvLyBiZWluZyBjYXJlIG9mIHRoZSBkZWxheSBpbnRyb2R1Y2VkIGluIHRoZSBleGVjdXRpb25cclxuICAgICAgICBpZiAoZ29EYXNoYm9hcmQuX2dvaW5nID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIERlbGF5ZWQgdG8gYXZvaWQgY29sbGlzaW9ucyB3aXRoIGluLXRoZS1taWRkbGVcclxuICAgICAgICAgICAgLy8gdGFza3M6IGp1c3QgYWxsb3dpbmcgY3VycmVudCByb3V0aW5nIHRvIGZpbmlzaFxyXG4gICAgICAgICAgICAvLyBiZWZvcmUgcGVyZm9ybSB0aGUgJ3JlZGlyZWN0J1xyXG4gICAgICAgICAgICAvLyBUT0RPOiBjaGFuZ2UgYnkgYSByZWFsIHJlZGlyZWN0IHRoYXQgaXMgYWJsZSB0b1xyXG4gICAgICAgICAgICAvLyBjYW5jZWwgdGhlIGN1cnJlbnQgYXBwLnNoZWxsIHJvdXRpbmcgcHJvY2Vzcy5cclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICAgICAgICAgIGdvRGFzaGJvYXJkLl9nb2luZyA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG9uYm9hcmRpbmcgPSB0aGlzLm1vZGVsLnVzZXIoKS5vbmJvYXJkaW5nU3RlcCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChvbmJvYXJkaW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaGVsbC5nbygnb25ib2FyZGluZ0hvbWUvJyArIG9uYm9hcmRpbmcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaGVsbC5nbygnaG9tZScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEp1c3QgYmVjYXVzZSBpcyBkZWxheWVkLCBuZWVkc1xyXG4gICAgICAgICAgICAgICAgLy8gdG8gYmUgc2V0IG9mZiBhZnRlciBhbiBpbm1lZGlhdGUgdG8gXHJcbiAgICAgICAgICAgICAgICAvLyBlbnN1cmUgaXMgc2V0IG9mZiBhZnRlciBhbnkgb3RoZXIgYXR0ZW1wdFxyXG4gICAgICAgICAgICAgICAgLy8gdG8gYWRkIGEgZGVsYXllZCBnb0Rhc2hib2FyZDpcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZ29EYXNoYm9hcmQuX2dvaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9LCAxKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKiogQ29udGludWUgYXBwIGNyZWF0aW9uIHdpdGggdGhpbmdzIHRoYXQgbmVlZCBhIHJlZmVyZW5jZSB0byB0aGUgYXBwICoqL1xyXG5cclxucmVxdWlyZSgnLi9hcHAtbmF2YmFyJykuZXh0ZW5kcyhhcHApO1xyXG5cclxucmVxdWlyZSgnLi9hcHAtY29tcG9uZW50cycpLnJlZ2lzdGVyQWxsKCk7XHJcblxyXG5hcHAuZ2V0QWN0aXZpdHkgPSBmdW5jdGlvbiBnZXRBY3Rpdml0eShuYW1lKSB7XHJcbiAgICB2YXIgYWN0aXZpdHkgPSB0aGlzLmFjdGl2aXRpZXNbbmFtZV07XHJcbiAgICBpZiAoYWN0aXZpdHkpIHtcclxuICAgICAgICB2YXIgJGFjdCA9IHRoaXMuc2hlbGwuaXRlbXMuZmluZChuYW1lKTtcclxuICAgICAgICBpZiAoJGFjdCAmJiAkYWN0Lmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuIGFjdGl2aXR5LmluaXQoJGFjdCwgdGhpcyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbnVsbDtcclxufTtcclxuXHJcbmFwcC5nZXRBY3Rpdml0eUNvbnRyb2xsZXJCeVJvdXRlID0gZnVuY3Rpb24gZ2V0QWN0aXZpdHlDb250cm9sbGVyQnlSb3V0ZShyb3V0ZSkge1xyXG4gICAgLy8gRnJvbSB0aGUgcm91dGUgb2JqZWN0LCB0aGUgaW1wb3J0YW50IHBpZWNlIGlzIHJvdXRlLm5hbWVcclxuICAgIC8vIHRoYXQgY29udGFpbnMgdGhlIGFjdGl2aXR5IG5hbWUgZXhjZXB0IGlmIGlzIHRoZSByb290XHJcbiAgICB2YXIgYWN0TmFtZSA9IHJvdXRlLm5hbWUgfHwgdGhpcy5zaGVsbC5pbmRleE5hbWU7XHJcbiAgICBcclxuICAgIHJldHVybiB0aGlzLmdldEFjdGl2aXR5KGFjdE5hbWUpO1xyXG59O1xyXG5cclxuLy8gYWNjZXNzQ29udHJvbCBzZXR1cDogY2Fubm90IGJlIHNwZWNpZmllZCBvbiBTaGVsbCBjcmVhdGlvbiBiZWNhdXNlXHJcbi8vIGRlcGVuZHMgb24gdGhlIGFwcCBpbnN0YW5jZVxyXG5hcHAuc2hlbGwuYWNjZXNzQ29udHJvbCA9IHJlcXVpcmUoJy4vdXRpbHMvYWNjZXNzQ29udHJvbCcpKGFwcCk7XHJcblxyXG4vLyBTaG9ydGN1dCB0byBVc2VyVHlwZSBlbnVtZXJhdGlvbiB1c2VkIHRvIHNldCBwZXJtaXNzaW9uc1xyXG5hcHAuVXNlclR5cGUgPSBhcHAubW9kZWwudXNlcigpLmNvbnN0cnVjdG9yLlVzZXJUeXBlO1xyXG5cclxuLyoqIEFwcCBJbml0ICoqL1xyXG52YXIgYXBwSW5pdCA9IGZ1bmN0aW9uIGFwcEluaXQoKSB7XHJcbiAgICAvKmpzaGludCBtYXhzdGF0ZW1lbnRzOjUwLG1heGNvbXBsZXhpdHk6MTYgKi9cclxuICAgIFxyXG4gICAgLy8gRW5hYmxpbmcgdGhlICdsYXlvdXRVcGRhdGUnIGpRdWVyeSBXaW5kb3cgZXZlbnQgdGhhdCBoYXBwZW5zIG9uIHJlc2l6ZSBhbmQgdHJhbnNpdGlvbmVuZCxcclxuICAgIC8vIGFuZCBjYW4gYmUgdHJpZ2dlcmVkIG1hbnVhbGx5IGJ5IGFueSBzY3JpcHQgdG8gbm90aWZ5IGNoYW5nZXMgb24gbGF5b3V0IHRoYXRcclxuICAgIC8vIG1heSByZXF1aXJlIGFkanVzdG1lbnRzIG9uIG90aGVyIHNjcmlwdHMgdGhhdCBsaXN0ZW4gdG8gaXQuXHJcbiAgICAvLyBUaGUgZXZlbnQgaXMgdGhyb3R0bGUsIGd1YXJhbnRpbmcgdGhhdCB0aGUgbWlub3IgaGFuZGxlcnMgYXJlIGV4ZWN1dGVkIHJhdGhlclxyXG4gICAgLy8gdGhhbiBhIGxvdCBvZiB0aGVtIGluIHNob3J0IHRpbWUgZnJhbWVzIChhcyBoYXBwZW4gd2l0aCAncmVzaXplJyBldmVudHMpLlxyXG4gICAgbGF5b3V0VXBkYXRlRXZlbnQubGF5b3V0VXBkYXRlRXZlbnQgKz0gJyBvcmllbnRhdGlvbmNoYW5nZSc7XHJcbiAgICBsYXlvdXRVcGRhdGVFdmVudC5vbigpO1xyXG4gICAgXHJcbiAgICAvLyBLZXlib2FyZCBwbHVnaW4gZXZlbnRzIGFyZSBub3QgY29tcGF0aWJsZSB3aXRoIGpRdWVyeSBldmVudHMsIGJ1dCBuZWVkZWQgdG9cclxuICAgIC8vIHRyaWdnZXIgYSBsYXlvdXRVcGRhdGUsIHNvIGhlcmUgYXJlIGNvbm5lY3RlZCwgbWFpbmx5IGZpeGluZyBidWdzIG9uIGlPUyB3aGVuIHRoZSBrZXlib2FyZFxyXG4gICAgLy8gaXMgaGlkZGluZy5cclxuICAgIHZhciB0cmlnTGF5b3V0ID0gZnVuY3Rpb24gdHJpZ0xheW91dChldmVudCkge1xyXG4gICAgICAgICQod2luZG93KS50cmlnZ2VyKCdsYXlvdXRVcGRhdGUnKTtcclxuICAgIH07XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbmF0aXZlLmtleWJvYXJkc2hvdycsIHRyaWdMYXlvdXQpO1xyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ25hdGl2ZS5rZXlib2FyZGhpZGUnLCB0cmlnTGF5b3V0KTtcclxuXHJcbiAgICAvLyBpT1MtNysgc3RhdHVzIGJhciBmaXguIEFwcGx5IG9uIHBsdWdpbiBsb2FkZWQgKGNvcmRvdmEvcGhvbmVnYXAgZW52aXJvbm1lbnQpXHJcbiAgICAvLyBhbmQgaW4gYW55IHN5c3RlbSwgc28gYW55IG90aGVyIHN5c3RlbXMgZml4IGl0cyBzb2x2ZWQgdG9vIGlmIG5lZWRlZCBcclxuICAgIC8vIGp1c3QgdXBkYXRpbmcgdGhlIHBsdWdpbiAoZnV0dXJlIHByb29mKSBhbmQgZW5zdXJlIGhvbW9nZW5lb3VzIGNyb3NzIHBsYWZ0Zm9ybSBiZWhhdmlvci5cclxuICAgIGlmICh3aW5kb3cuU3RhdHVzQmFyKSB7XHJcbiAgICAgICAgLy8gRml4IGlPUy03KyBvdmVybGF5IHByb2JsZW1cclxuICAgICAgICAvLyBJcyBpbiBjb25maWcueG1sIHRvbywgYnV0IHNlZW1zIG5vdCB0byB3b3JrIHdpdGhvdXQgbmV4dCBjYWxsOlxyXG4gICAgICAgIHdpbmRvdy5TdGF0dXNCYXIub3ZlcmxheXNXZWJWaWV3KGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgaU9zV2VidmlldyA9IGZhbHNlO1xyXG4gICAgaWYgKHdpbmRvdy5kZXZpY2UgJiYgXHJcbiAgICAgICAgL2lPU3xpUGFkfGlQaG9uZXxpUG9kL2kudGVzdCh3aW5kb3cuZGV2aWNlLnBsYXRmb3JtKSkge1xyXG4gICAgICAgIGlPc1dlYnZpZXcgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBOT1RFOiBTYWZhcmkgaU9TIGJ1ZyB3b3JrYXJvdW5kLCBtaW4taGVpZ2h0L2hlaWdodCBvbiBodG1sIGRvZXNuJ3Qgd29yayBhcyBleHBlY3RlZCxcclxuICAgIC8vIGdldHRpbmcgYmlnZ2VyIHRoYW4gdmlld3BvcnQuXHJcbiAgICB2YXIgaU9TID0gLyhpUGFkfGlQaG9uZXxpUG9kKS9nLnRlc3QoIG5hdmlnYXRvci51c2VyQWdlbnQgKTtcclxuICAgIGlmIChpT1MpIHtcclxuICAgICAgICB2YXIgZ2V0SGVpZ2h0ID0gZnVuY3Rpb24gZ2V0SGVpZ2h0KCkge1xyXG4gICAgICAgICAgICByZXR1cm4gd2luZG93LmlubmVySGVpZ2h0O1xyXG4gICAgICAgICAgICAvLyBJbiBjYXNlIG9mIGVuYWJsZSB0cmFuc3BhcmVudC9vdmVybGF5IFN0YXR1c0JhcjpcclxuICAgICAgICAgICAgLy8gKHdpbmRvdy5pbm5lckhlaWdodCAtIChpT3NXZWJ2aWV3ID8gMjAgOiAwKSlcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgICQoJ2h0bWwnKS5oZWlnaHQoZ2V0SGVpZ2h0KCkgKyAncHgnKTsgICAgICAgIFxyXG4gICAgICAgICQod2luZG93KS5vbignbGF5b3V0VXBkYXRlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICQoJ2h0bWwnKS5oZWlnaHQoZ2V0SGVpZ2h0KCkgKyAncHgnKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBCZWNhdXNlIG9mIHRoZSBpT1M3KzggYnVncyB3aXRoIGhlaWdodCBjYWxjdWxhdGlvbixcclxuICAgIC8vIGEgZGlmZmVyZW50IHdheSBvZiBhcHBseSBjb250ZW50IGhlaWdodCB0byBmaWxsIGFsbCB0aGUgYXZhaWxhYmxlIGhlaWdodCAoYXMgbWluaW11bSlcclxuICAgIC8vIGlzIHJlcXVpcmVkLlxyXG4gICAgLy8gRm9yIHRoYXQsIHRoZSAnZnVsbC1oZWlnaHQnIGNsYXNzIHdhcyBhZGRlZCwgdG8gYmUgdXNlZCBpbiBlbGVtZW50cyBpbnNpZGUgdGhlIFxyXG4gICAgLy8gYWN0aXZpdHkgdGhhdCBuZWVkcyBhbGwgdGhlIGF2YWlsYWJsZSBoZWlnaHQsIGhlcmUgdGhlIGNhbGN1bGF0aW9uIGlzIGFwcGxpZWQgZm9yXHJcbiAgICAvLyBhbGwgcGxhdGZvcm1zIGZvciB0aGlzIGhvbW9nZW5lb3VzIGFwcHJvYWNoIHRvIHNvbHZlIHRoZSBwcm9ibGVtbS5cclxuICAgIChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgJGIgPSAkKCdib2R5Jyk7XHJcbiAgICAgICAgdmFyIGZ1bGxIZWlnaHQgPSBmdW5jdGlvbiBmdWxsSGVpZ2h0KCkge1xyXG4gICAgICAgICAgICB2YXIgaCA9ICRiLmhlaWdodCgpO1xyXG4gICAgICAgICAgICAkKCcuZnVsbC1oZWlnaHQnKVxyXG4gICAgICAgICAgICAvLyBMZXQgYnJvd3NlciB0byBjb21wdXRlXHJcbiAgICAgICAgICAgIC5jc3MoJ2hlaWdodCcsICdhdXRvJylcclxuICAgICAgICAgICAgLy8gQXMgbWluaW11bVxyXG4gICAgICAgICAgICAuY3NzKCdtaW4taGVpZ2h0JywgaClcclxuICAgICAgICAgICAgLy8gU2V0IGV4cGxpY2l0IHRoZSBhdXRvbWF0aWMgY29tcHV0ZWQgaGVpZ2h0XHJcbiAgICAgICAgICAgIC5jc3MoJ2hlaWdodCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gd2UgdXNlIGJveC1zaXppbmc6Ym9yZGVyLWJveCwgc28gbmVlZHMgdG8gYmUgb3V0ZXJIZWlnaHQgd2l0aG91dCBtYXJnaW46XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJCh0aGlzKS5vdXRlckhlaWdodChmYWxzZSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGZ1bGxIZWlnaHQoKTtcclxuICAgICAgICAkKHdpbmRvdykub24oJ2xheW91dFVwZGF0ZScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBmdWxsSGVpZ2h0KCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KSgpO1xyXG4gICAgXHJcbiAgICAvLyBGb3JjZSBhbiB1cGRhdGUgZGVsYXllZCB0byBlbnN1cmUgdXBkYXRlIGFmdGVyIHNvbWUgdGhpbmdzIGRpZCBhZGRpdGlvbmFsIHdvcmtcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ2xheW91dFVwZGF0ZScpO1xyXG4gICAgfSwgMjAwKTtcclxuICAgIFxyXG4gICAgLy8gQm9vdHN0cmFwXHJcbiAgICBwcmVCb290c3RyYXBXb3JrYXJvdW5kcygpO1xyXG4gICAgcmVxdWlyZSgnYm9vdHN0cmFwJyk7XHJcbiAgICBcclxuICAgIC8vIExvYWQgS25vY2tvdXQgYmluZGluZyBoZWxwZXJzXHJcbiAgICBib290a25vY2sucGx1Z0luKGtvKTtcclxuICAgIHJlcXVpcmUoJy4vdXRpbHMvYm9vdHN0cmFwU3dpdGNoQmluZGluZycpLnBsdWdJbihrbyk7XHJcbiAgICBcclxuICAgIC8vIFBsdWdpbnMgc2V0dXBcclxuICAgIGlmICh3aW5kb3cuY29yZG92YSAmJiB3aW5kb3cuY29yZG92YS5wbHVnaW5zICYmIHdpbmRvdy5jb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQpIHtcclxuICAgICAgICB3aW5kb3cuY29yZG92YS5wbHVnaW5zLktleWJvYXJkLmRpc2FibGVTY3JvbGwodHJ1ZSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEVhc3kgbGlua3MgdG8gc2hlbGwgYWN0aW9ucywgbGlrZSBnb0JhY2ssIGluIGh0bWwgZWxlbWVudHNcclxuICAgIC8vIEV4YW1wbGU6IDxidXR0b24gZGF0YS1zaGVsbD1cImdvQmFjayAyXCI+R28gMiB0aW1lcyBiYWNrPC9idXR0b24+XHJcbiAgICAvLyBOT1RFOiBJbXBvcnRhbnQsIHJlZ2lzdGVyZWQgYmVmb3JlIHRoZSBzaGVsbC5ydW4gdG8gYmUgZXhlY3V0ZWRcclxuICAgIC8vIGJlZm9yZSBpdHMgJ2NhdGNoIGFsbCBsaW5rcycgaGFuZGxlclxyXG4gICAgJChkb2N1bWVudCkub24oJ3RhcCcsICdbZGF0YS1zaGVsbF0nLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgLy8gVXNpbmcgYXR0ciByYXRoZXIgdGhhbiB0aGUgJ2RhdGEnIEFQSSB0byBnZXQgdXBkYXRlZFxyXG4gICAgICAgIC8vIERPTSB2YWx1ZXNcclxuICAgICAgICB2YXIgY21kbGluZSA9ICQodGhpcykuYXR0cignZGF0YS1zaGVsbCcpIHx8ICcnLFxyXG4gICAgICAgICAgICBhcmdzID0gY21kbGluZS5zcGxpdCgnICcpLFxyXG4gICAgICAgICAgICBjbWQgPSBhcmdzWzBdO1xyXG5cclxuICAgICAgICBpZiAoY21kICYmIHR5cGVvZihhcHAuc2hlbGxbY21kXSkgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgYXBwLnNoZWxsW2NtZF0uYXBwbHkoYXBwLnNoZWxsLCBhcmdzLnNsaWNlKDEpKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIENhbmNlbCBhbnkgb3RoZXIgYWN0aW9uIG9uIHRoZSBsaW5rLCB0byBhdm9pZCBkb3VibGUgbGlua2luZyByZXN1bHRzXHJcbiAgICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gT24gQ29yZG92YS9QaG9uZWdhcCBhcHAsIHNwZWNpYWwgdGFyZ2V0cyBtdXN0IGJlIGNhbGxlZCB1c2luZyB0aGUgd2luZG93Lm9wZW5cclxuICAgIC8vIEFQSSB0byBlbnN1cmUgaXMgY29ycmVjdGx5IG9wZW5lZCBvbiB0aGUgSW5BcHBCcm93c2VyIChfYmxhbmspIG9yIHN5c3RlbSBkZWZhdWx0XHJcbiAgICAvLyBicm93c2VyIChfc3lzdGVtKS5cclxuICAgIGlmICh3aW5kb3cuY29yZG92YSkge1xyXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCd0YXAnLCAnW3RhcmdldD1cIl9ibGFua1wiXSwgW3RhcmdldD1cIl9zeXN0ZW1cIl0nLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5vcGVuKHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJyksIHRoaXMuZ2V0QXR0cmlidXRlKCd0YXJnZXQnKSk7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gV2hlbiBhbiBhY3Rpdml0eSBpcyByZWFkeSBpbiB0aGUgU2hlbGw6XHJcbiAgICBhcHAuc2hlbGwub24oYXBwLnNoZWxsLmV2ZW50cy5pdGVtUmVhZHksIGZ1bmN0aW9uKCRhY3QsIHN0YXRlKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQ29ubmVjdCB0aGUgJ2FjdGl2aXRpZXMnIGNvbnRyb2xsZXJzIHRvIHRoZWlyIHZpZXdzXHJcbiAgICAgICAgLy8gR2V0IGluaXRpYWxpemVkIGFjdGl2aXR5IGZvciB0aGUgRE9NIGVsZW1lbnRcclxuICAgICAgICB2YXIgYWN0TmFtZSA9ICRhY3QuZGF0YSgnYWN0aXZpdHknKTtcclxuICAgICAgICB2YXIgYWN0aXZpdHkgPSBhcHAuZ2V0QWN0aXZpdHkoYWN0TmFtZSk7XHJcbiAgICAgICAgLy8gVHJpZ2dlciB0aGUgJ3Nob3cnIGxvZ2ljIG9mIHRoZSBhY3Rpdml0eSBjb250cm9sbGVyOlxyXG4gICAgICAgIGFjdGl2aXR5LnNob3coc3RhdGUpO1xyXG5cclxuICAgICAgICAvLyBVcGRhdGUgbWVudVxyXG4gICAgICAgIHZhciBtZW51SXRlbSA9IGFjdGl2aXR5Lm1lbnVJdGVtIHx8IGFjdE5hbWU7XHJcbiAgICAgICAgYXBwLnVwZGF0ZU1lbnUobWVudUl0ZW0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFVwZGF0ZSBhcHAgbmF2aWdhdGlvblxyXG4gICAgICAgIGFwcC51cGRhdGVBcHBOYXYoYWN0aXZpdHkpO1xyXG4gICAgfSk7XHJcbiAgICAvLyBXaGVuIGFuIGFjdGl2aXR5IGlzIGhpZGRlblxyXG4gICAgYXBwLnNoZWxsLm9uKGFwcC5zaGVsbC5ldmVudHMuY2xvc2VkLCBmdW5jdGlvbigkYWN0KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQ29ubmVjdCB0aGUgJ2FjdGl2aXRpZXMnIGNvbnRyb2xsZXJzIHRvIHRoZWlyIHZpZXdzXHJcbiAgICAgICAgdmFyIGFjdE5hbWUgPSAkYWN0LmRhdGEoJ2FjdGl2aXR5Jyk7XHJcbiAgICAgICAgdmFyIGFjdGl2aXR5ID0gYXBwLmdldEFjdGl2aXR5KGFjdE5hbWUpO1xyXG4gICAgICAgIC8vIFRyaWdnZXIgdGhlICdoaWRlJyBsb2dpYyBvZiB0aGUgYWN0aXZpdHkgY29udHJvbGxlcjpcclxuICAgICAgICBpZiAoYWN0aXZpdHkuaGlkZSlcclxuICAgICAgICAgICAgYWN0aXZpdHkuaGlkZSgpO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIFNldCBtb2RlbCBmb3IgdGhlIEFwcE5hdlxyXG4gICAga28uYXBwbHlCaW5kaW5ncyh7XHJcbiAgICAgICAgbmF2QmFyOiBhcHAubmF2QmFyXHJcbiAgICB9LCAkKCcuQXBwTmF2JykuZ2V0KDApKTtcclxuICAgIFxyXG4gICAgdmFyIFNtYXJ0TmF2QmFyID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL1NtYXJ0TmF2QmFyJyk7XHJcbiAgICB2YXIgbmF2QmFycyA9IFNtYXJ0TmF2QmFyLmdldEFsbCgpO1xyXG4gICAgLy8gQ3JlYXRlcyBhbiBldmVudCBieSBsaXN0ZW5pbmcgdG8gaXQsIHNvIG90aGVyIHNjcmlwdHMgY2FuIHRyaWdnZXJcclxuICAgIC8vIGEgJ2NvbnRlbnRDaGFuZ2UnIGV2ZW50IHRvIGZvcmNlIGEgcmVmcmVzaCBvZiB0aGUgbmF2YmFyICh0byBcclxuICAgIC8vIGNhbGN1bGF0ZSBhbmQgYXBwbHkgYSBuZXcgc2l6ZSk7IGV4cGVjdGVkIGZyb20gZHluYW1pYyBuYXZiYXJzXHJcbiAgICAvLyB0aGF0IGNoYW5nZSBpdCBjb250ZW50IGJhc2VkIG9uIG9ic2VydmFibGVzLlxyXG4gICAgbmF2QmFycy5mb3JFYWNoKGZ1bmN0aW9uKG5hdmJhcikge1xyXG4gICAgICAgICQobmF2YmFyLmVsKS5vbignY29udGVudENoYW5nZScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBuYXZiYXIucmVmcmVzaCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIExpc3RlbiBmb3IgbWVudSBldmVudHMgKGNvbGxhcHNlIGluIFNtYXJ0TmF2QmFyKVxyXG4gICAgLy8gdG8gYXBwbHkgdGhlIGJhY2tkcm9wXHJcbiAgICB2YXIgdG9nZ2xpbmdCYWNrZHJvcCA9IGZhbHNlO1xyXG4gICAgJChkb2N1bWVudCkub24oJ3Nob3cuYnMuY29sbGFwc2UgaGlkZS5icy5jb2xsYXBzZScsICcuQXBwTmF2IC5uYXZiYXItY29sbGFwc2UnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgaWYgKCF0b2dnbGluZ0JhY2tkcm9wKSB7XHJcbiAgICAgICAgICAgIHRvZ2dsaW5nQmFja2Ryb3AgPSB0cnVlO1xyXG4gICAgICAgICAgICB2YXIgZW5hYmxlZCA9IGUudHlwZSA9PT0gJ3Nob3cnO1xyXG4gICAgICAgICAgICAkKCdib2R5JykudG9nZ2xlQ2xhc3MoJ3VzZS1iYWNrZHJvcCcsIGVuYWJsZWQpO1xyXG4gICAgICAgICAgICAvLyBIaWRlIGFueSBvdGhlciBvcGVuZWQgY29sbGFwc2VcclxuICAgICAgICAgICAgJCgnLmNvbGxhcHNpbmcsIC5jb2xsYXBzZS5pbicpLmNvbGxhcHNlKCdoaWRlJyk7XHJcbiAgICAgICAgICAgIHRvZ2dsaW5nQmFja2Ryb3AgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBcHAgaW5pdDpcclxuICAgIHZhciBhbGVydEVycm9yID0gZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgd2luZG93LmFsZXJ0KCdUaGVyZSB3YXMgYW4gZXJyb3IgbG9hZGluZzogJyArIGVyciAmJiBlcnIubWVzc2FnZSB8fCBlcnIpO1xyXG4gICAgfTtcclxuXHJcbiAgICBhcHAubW9kZWwuaW5pdCgpXHJcbiAgICAudGhlbihhcHAuc2hlbGwucnVuLmJpbmQoYXBwLnNoZWxsKSwgYWxlcnRFcnJvcilcclxuICAgIC50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIE1hcmsgdGhlIHBhZ2UgYXMgcmVhZHlcclxuICAgICAgICAkKCdodG1sJykuYWRkQ2xhc3MoJ2lzLXJlYWR5Jyk7XHJcbiAgICAgICAgLy8gQXMgYXBwLCBoaWRlcyBzcGxhc2ggc2NyZWVuXHJcbiAgICAgICAgaWYgKHdpbmRvdy5uYXZpZ2F0b3IgJiYgd2luZG93Lm5hdmlnYXRvci5zcGxhc2hzY3JlZW4pIHtcclxuICAgICAgICAgICAgd2luZG93Lm5hdmlnYXRvci5zcGxhc2hzY3JlZW4uaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sIGFsZXJ0RXJyb3IpO1xyXG5cclxuICAgIC8vIERFQlVHXHJcbiAgICB3aW5kb3cuYXBwID0gYXBwO1xyXG59O1xyXG5cclxuLy8gQXBwIGluaXQgb24gcGFnZSByZWFkeSBhbmQgcGhvbmVnYXAgcmVhZHlcclxuaWYgKHdpbmRvdy5jb3Jkb3ZhKSB7XHJcbiAgICAvLyBPbiBET00tUmVhZHkgZmlyc3RcclxuICAgICQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgLy8gUGFnZSBpcyByZWFkeSwgZGV2aWNlIGlzIHRvbz9cclxuICAgICAgICAvLyBOb3RlOiBDb3Jkb3ZhIGVuc3VyZXMgdG8gY2FsbCB0aGUgaGFuZGxlciBldmVuIGlmIHRoZVxyXG4gICAgICAgIC8vIGV2ZW50IHdhcyBhbHJlYWR5IGZpcmVkLCBzbyBpcyBnb29kIHRvIGRvIGl0IGluc2lkZVxyXG4gICAgICAgIC8vIHRoZSBkb20tcmVhZHkgYW5kIHdlIGFyZSBlbnN1cmluZyB0aGF0IGV2ZXJ5dGhpbmcgaXNcclxuICAgICAgICAvLyByZWFkeS5cclxuICAgICAgICAkKGRvY3VtZW50KS5vbignZGV2aWNlcmVhZHknLCBhcHBJbml0KTtcclxuICAgIH0pO1xyXG59IGVsc2Uge1xyXG4gICAgLy8gT25seSBvbiBET00tUmVhZHksIGZvciBpbiBicm93c2VyIGRldmVsb3BtZW50XHJcbiAgICAkKGFwcEluaXQpO1xyXG59XHJcbiIsIi8qKlxyXG4gICAgQWNjZXNzIHRvIHVzZSBnbG9iYWwgQXBwIE1vZGFsc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbi8qKlxyXG4gICAgR2VuZXJhdGVzIGEgdGV4dCBtZXNzYWdlLCB3aXRoIG5ld2xpbmVzIGlmIG5lZWRlZCwgZGVzY3JpYmluZyB0aGUgZXJyb3JcclxuICAgIG9iamVjdCBwYXNzZWQuXHJcbiAgICBAcGFyYW0gZXJyOmFueSBBcyBhIHN0cmluZywgaXMgcmV0dXJuZWQgJ2FzIGlzJzsgYXMgZmFsc3ksIGl0IHJldHVybiBhIGdlbmVyaWNcclxuICAgIG1lc3NhZ2UgZm9yICd1bmtub3cgZXJyb3InOyBhcyBvYmplY3QsIGl0IGludmVzdGlnYXRlIHdoYXQgdHlwZSBvZiBlcnJvciBpcyB0b1xyXG4gICAgcHJvdmlkZSB0aGUgbW9yZSBtZWFuaW5mdWwgcmVzdWx0LCB3aXRoIGZhbGxiYWNrIHRvIEpTT04uc3RyaW5naWZ5IHByZWZpeGVkXHJcbiAgICB3aXRoICdUZWNobmljYWwgZGV0YWlsczonLlxyXG4gICAgT2JqZWN0cyByZWNvZ25pemVkOlxyXG4gICAgLSBYSFIvalF1ZXJ5IGZvciBKU09OIHJlc3BvbnNlczoganVzdCBvYmplY3RzIHdpdGggcmVzcG9uc2VKU09OIHByb3BlcnR5LCBpc1xyXG4gICAgICB1c2VkIGFzIHRoZSAnZXJyJyBvYmplY3QgYW5kIHBhc3NlZCB0byB0aGUgb3RoZXIgb2JqZWN0IHRlc3RzLlxyXG4gICAgLSBPYmplY3Qgd2l0aCAnZXJyb3JNZXNzYWdlJyAoc2VydmVyLXNpZGUgZm9ybWF0dGVkIGVycm9yKS5cclxuICAgIC0gT2JqZWN0IHdpdGggJ21lc3NhZ2UnIHByb3BlcnR5LCBsaWtlIHRoZSBzdGFuZGFyZCBFcnJvciBjbGFzcyBhbmQgRXhjZXB0aW9uIG9iamVjdHMuXHJcbiAgICAtIE9iamVjdCB3aXRoICduYW1lJyBwcm9wZXJ0eSwgbGlrZSB0aGUgc3RhbmRhcmQgRXhjZXB0aW9uIG9iamVjdHMuIFRoZSBuYW1lLCBpZiBhbnksXHJcbiAgICAgIGlzIHNldCBhcyBwcmVmaXggZm9yIHRoZSAnbWVzc2FnZScgcHJvcGVydHkgdmFsdWUuXHJcbiAgICAtIE9iamVjdCB3aXRoICdlcnJvcnMnIHByb3BlcnR5LiBFYWNoIGVsZW1lbnQgaW4gdGhlIGFycmF5IG9yIG9iamVjdCBvd24ga2V5c1xyXG4gICAgICBpcyBhcHBlbmRlZCB0byB0aGUgZXJyb3JNZXNzYWdlIG9yIG1lc3NhZ2Ugc2VwYXJhdGVkIGJ5IG5ld2xpbmUuXHJcbioqL1xyXG5leHBvcnRzLmdldEVycm9yTWVzc2FnZUZyb20gPSBmdW5jdGlvbiBnZXRFcnJvck1lc3NhZ2VGcm9tKGVycikge1xyXG4gICAgLypqc2hpbnQgbWF4Y29tcGxleGl0eToxMCovXHJcblxyXG4gICAgaWYgKCFlcnIpIHtcclxuICAgICAgICByZXR1cm4gJ1Vua25vdyBlcnJvcic7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YoZXJyKSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICByZXR1cm4gZXJyO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgLy8gSWYgaXMgYSBYSFIgb2JqZWN0LCB1c2UgaXRzIHJlc3BvbnNlIGFzIHRoZSBlcnJvci5cclxuICAgICAgICBlcnIgPSBlcnIucmVzcG9uc2VKU09OIHx8IGVycjtcclxuXHJcbiAgICAgICAgdmFyIG1zZyA9IGVyci5uYW1lICYmIChlcnIubmFtZSArICc6ICcpIHx8ICcnO1xyXG4gICAgICAgIG1zZyArPSBlcnIuZXJyb3JNZXNzYWdlIHx8IGVyci5tZXNzYWdlIHx8ICcnO1xyXG5cclxuICAgICAgICBpZiAoZXJyLmVycm9ycykge1xyXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShlcnIuZXJyb3JzKSkge1xyXG4gICAgICAgICAgICAgICAgbXNnICs9ICdcXG4nICsgZXJyLmVycm9ycy5qb2luKCdcXG4nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGVyci5lcnJvcnMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbXNnICs9ICdcXG4nICsgZXJyLmVycm9yc1trZXldLmpvaW4oJ1xcbicpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIG1zZyArPSAnXFxuVGVjaG5pY2FsIGRldGFpbHM6ICcgKyBKU09OLnN0cmluZ2lmeShlcnIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG1zZztcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydHMuc2hvd0Vycm9yID0gZnVuY3Rpb24gc2hvd0Vycm9yTW9kYWwob3B0aW9ucykge1xyXG4gICAgXHJcbiAgICB2YXIgbW9kYWwgPSAkKCcjZXJyb3JNb2RhbCcpLFxyXG4gICAgICAgIGhlYWRlciA9IG1vZGFsLmZpbmQoJyNlcnJvck1vZGFsLWxhYmVsJyksXHJcbiAgICAgICAgYm9keSA9IG1vZGFsLmZpbmQoJyNlcnJvck1vZGFsLWJvZHknKTtcclxuICAgIFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICBcclxuICAgIHZhciBtc2cgPSBib2R5LmRhdGEoJ2RlZmF1bHQtdGV4dCcpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLmVycm9yKVxyXG4gICAgICAgIG1zZyA9IGV4cG9ydHMuZ2V0RXJyb3JNZXNzYWdlRnJvbShvcHRpb25zLmVycm9yKTtcclxuICAgIGVsc2UgaWYgKG9wdGlvbnMubWVzc2FnZSlcclxuICAgICAgICBtc2cgPSBvcHRpb25zLm1lc3NhZ2U7XHJcblxyXG4gICAgYm9keS5tdWx0aWxpbmUobXNnKTtcclxuXHJcbiAgICBoZWFkZXIudGV4dChvcHRpb25zLnRpdGxlIHx8IGhlYWRlci5kYXRhKCdkZWZhdWx0LXRleHQnKSk7XHJcbiAgICBcclxuICAgIG1vZGFsLm1vZGFsKCdzaG93Jyk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgU2V0dXAgb2YgdGhlIHNoZWxsIG9iamVjdCB1c2VkIGJ5IHRoZSBhcHBcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBiYXNlVXJsID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xyXG5cclxuLy92YXIgSGlzdG9yeSA9IHJlcXVpcmUoJy4vYXBwLXNoZWxsLWhpc3RvcnknKS5jcmVhdGUoYmFzZVVybCk7XHJcbnZhciBIaXN0b3J5ID0gcmVxdWlyZSgnLi91dGlscy9zaGVsbC9oYXNoYmFuZ0hpc3RvcnknKTtcclxuXHJcbi8vIFNoZWxsIGRlcGVuZGVuY2llc1xyXG52YXIgc2hlbGwgPSByZXF1aXJlKCcuL3V0aWxzL3NoZWxsL2luZGV4JyksXHJcbiAgICBTaGVsbCA9IHNoZWxsLlNoZWxsLFxyXG4gICAgRG9tSXRlbXNNYW5hZ2VyID0gc2hlbGwuRG9tSXRlbXNNYW5hZ2VyO1xyXG5cclxudmFyIGlPUyA9IC8oaVBhZHxpUGhvbmV8aVBvZCkvZy50ZXN0KCBuYXZpZ2F0b3IudXNlckFnZW50ICk7XHJcblxyXG4vLyBDcmVhdGluZyB0aGUgc2hlbGw6XHJcbnZhciBzaGVsbCA9IG5ldyBTaGVsbCh7XHJcblxyXG4gICAgLy8gU2VsZWN0b3IsIERPTSBlbGVtZW50IG9yIGpRdWVyeSBvYmplY3QgcG9pbnRpbmdcclxuICAgIC8vIHRoZSByb290IG9yIGNvbnRhaW5lciBmb3IgdGhlIHNoZWxsIGl0ZW1zXHJcbiAgICByb290OiAnYm9keScsXHJcblxyXG4gICAgLy8gSWYgaXMgbm90IGluIHRoZSBzaXRlIHJvb3QsIHRoZSBiYXNlIFVSTCBpcyByZXF1aXJlZDpcclxuICAgIGJhc2VVcmw6IGJhc2VVcmwsXHJcbiAgICBcclxuICAgIGZvcmNlSGFzaGJhbmc6IHRydWUsXHJcblxyXG4gICAgaW5kZXhOYW1lOiAnaW5kZXgnLFxyXG5cclxuICAgIC8vIFdPUktBUk9VTkQ6IFVzaW5nIHRoZSAndGFwJyBldmVudCBmb3IgZmFzdGVyIG1vYmlsZSBleHBlcmllbmNlXHJcbiAgICAvLyAoZnJvbSBqcXVlcnktbW9iaWxlIGV2ZW50KSBvbiBpT1MgZGV2aWNlcywgYnV0IGxlZnRcclxuICAgIC8vICdjbGljaycgb24gb3RoZXJzIHNpbmNlIHRoZXkgaGFzIG5vdCB0aGUgc2xvdy1jbGljayBwcm9ibGVtXHJcbiAgICAvLyB0aGFua3MgdG8gdGhlIG1ldGEtdmlld3BvcnQuXHJcbiAgICAvLyBXT1JLQVJPVU5EOiBJTVBPUlRBTlQsIHVzaW5nICdjbGljaycgcmF0aGVyIHRoYW4gJ3RhcCcgb24gQW5kcm9pZFxyXG4gICAgLy8gcHJldmVudHMgYW4gYXBwIGNyYXNoIChvciBnbyBvdXQgYW5kIHBhZ2Ugbm90IGZvdW5kIG9uIENocm9tZSBmb3IgQW5kcm9pZClcclxuICAgIC8vIGJlY2F1c2Ugb2Ygc29tZSAnY2xpY2tzJyBoYXBwZW5pbmcgb25cclxuICAgIC8vIGEgaGFsZi1saW5rLWVsZW1lbnQgdGFwLCB3aGVyZSB0aGUgJ3RhcCcgZXZlbnQgZGV0ZWN0cyBhcyB0YXJnZXQgdGhlIG5vbi1saW5rIGFuZCB0aGVcclxuICAgIC8vIGxpbmsgZ2V0cyBleGVjdXRlZCBhbnl3YXkgYnkgdGhlIGJyb3dzZXIsIG5vdCBjYXRjaGVkIHNvIFdlYnZpZXcgbW92ZXMgdG8gXHJcbiAgICAvLyBhIG5vbiBleGlzdGFudCBmaWxlIChhbmQgdGhhdHMgbWFrZSBQaG9uZUdhcCB0byBjcmFzaCkuXHJcbiAgICBsaW5rRXZlbnQ6IGlPUyA/ICd0YXAnIDogJ2NsaWNrJyxcclxuXHJcbiAgICAvLyBObyBuZWVkIGZvciBsb2FkZXIsIGV2ZXJ5dGhpbmcgY29tZXMgYnVuZGxlZFxyXG4gICAgbG9hZGVyOiBudWxsLFxyXG5cclxuICAgIC8vIEhpc3RvcnkgUG9seWZpbGw6XHJcbiAgICBoaXN0b3J5OiBIaXN0b3J5LFxyXG5cclxuICAgIC8vIEEgRG9tSXRlbXNNYW5hZ2VyIG9yIGVxdWl2YWxlbnQgb2JqZWN0IGluc3RhbmNlIG5lZWRzIHRvXHJcbiAgICAvLyBiZSBwcm92aWRlZDpcclxuICAgIGRvbUl0ZW1zTWFuYWdlcjogbmV3IERvbUl0ZW1zTWFuYWdlcih7XHJcbiAgICAgICAgaWRBdHRyaWJ1dGVOYW1lOiAnZGF0YS1hY3Rpdml0eSdcclxuICAgIH0pXHJcbn0pO1xyXG5cclxuLy8gQ2F0Y2ggZXJyb3JzIG9uIGl0ZW0vcGFnZSBsb2FkaW5nLCBzaG93aW5nLi5cclxuc2hlbGwub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyKSB7XHJcbiAgICBcclxuICAgIHZhciBzdHIgPSAnVW5rbm93IGVycm9yJztcclxuICAgIGlmIChlcnIpIHtcclxuICAgICAgICBpZiAodHlwZW9mKGVycikgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHN0ciA9IGVycjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoZXJyLm1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgc3RyID0gZXJyLm1lc3NhZ2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBzdHIgPSBKU09OLnN0cmluZ2lmeShlcnIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBUT0RPIGNoYW5nZSB3aXRoIGEgZGlhbG9nIG9yIHNvbWV0aGluZ1xyXG4gICAgd2luZG93LmFsZXJ0KHN0cik7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzaGVsbDtcclxuIiwiLyoqXHJcbiAgICBBY3Rpdml0eSBiYXNlIGNsYXNzXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKSxcclxuICAgIE5hdkJhciA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QmFyJyk7XHJcblxyXG5yZXF1aXJlKCcuLi91dGlscy9GdW5jdGlvbi5wcm90b3R5cGUuX2luaGVyaXRzJyk7XHJcblxyXG4vKipcclxuICAgIEFjdGl2aXR5IGNsYXNzIGRlZmluaXRpb25cclxuKiovXHJcbmZ1bmN0aW9uIEFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuXHJcbiAgICAvLyBEZWZhdWx0IGFjY2VzcyBsZXZlbDogYW55b25lXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLk5vbmU7XHJcbiAgICBcclxuICAgIC8vIFRPRE86IEZ1dHVyZSB1c2Ugb2YgYSB2aWV3U3RhdGUsIHBsYWluIG9iamVjdCByZXByZXNlbnRhdGlvblxyXG4gICAgLy8gb2YgcGFydCBvZiB0aGUgdmlld01vZGVsIHRvIGJlIHVzZWQgYXMgdGhlIHN0YXRlIHBhc3NlZCB0byB0aGVcclxuICAgIC8vIGhpc3RvcnkgYW5kIGJldHdlZW4gYWN0aXZpdGllcyBjYWxscy5cclxuICAgIHRoaXMudmlld1N0YXRlID0ge307XHJcbiAgICBcclxuICAgIC8vIE9iamVjdCB0byBob2xkIHRoZSBvcHRpb25zIHBhc3NlZCBvbiAnc2hvdycgYXMgYSByZXN1bHRcclxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcclxuICAgIHRoaXMucmVxdWVzdERhdGEgPSBudWxsO1xyXG5cclxuICAgIC8vIERlZmF1bHQgbmF2QmFyIG9iamVjdC5cclxuICAgIHRoaXMubmF2QmFyID0gbmV3IE5hdkJhcih7XHJcbiAgICAgICAgdGl0bGU6IG51bGwsIC8vIG51bGwgZm9yIGxvZ29cclxuICAgICAgICBsZWZ0QWN0aW9uOiBudWxsLFxyXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBudWxsXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gRGVsYXllZCBiaW5kaW5ncyB0byBhbGxvdyBmb3IgZnVydGhlciBjb25zdHJ1Y3RvciBzZXQtdXAgXHJcbiAgICAvLyBvbiBzdWJjbGFzc2VzLlxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiBBY3Rpdml0eUNvbnN0cnVjdG9yRGVsYXllZCgpIHtcclxuICAgICAgICAvLyBBIHZpZXcgbW9kZWwgYW5kIGJpbmRpbmdzIGJlaW5nIGFwcGxpZWQgaXMgZXZlciByZXF1aXJlZFxyXG4gICAgICAgIC8vIGV2ZW4gb24gQWN0aXZpdGllcyB3aXRob3V0IG5lZWQgZm9yIGEgdmlldyBtb2RlbCwgc2luY2VcclxuICAgICAgICAvLyB0aGUgdXNlIG9mIGNvbXBvbmVudHMgYW5kIHRlbXBsYXRlcywgb3IgYW55IG90aGVyIGRhdGEtYmluZFxyXG4gICAgICAgIC8vIHN5bnRheCwgcmVxdWlyZXMgdG8gYmUgaW4gYSBjb250ZXh0IHdpdGggYmluZGluZyBlbmFibGVkOlxyXG4gICAgICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy52aWV3TW9kZWwgfHwge30sICRhY3Rpdml0eS5nZXQoMCkpO1xyXG4gICAgfS5iaW5kKHRoaXMpLCAxKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBY3Rpdml0eTtcclxuXHJcbi8qKlxyXG4gICAgU2V0LXVwIHZpc3VhbGl6YXRpb24gb2YgdGhlIHZpZXcgd2l0aCB0aGUgZ2l2ZW4gb3B0aW9ucy9zdGF0ZSxcclxuICAgIHdpdGggYSByZXNldCBvZiBjdXJyZW50IHN0YXRlLlxyXG4gICAgTXVzdCBiZSBleGVjdXRlZCBldmVyeSB0aW1lIHRoZSBhY3Rpdml0eSBpcyBwdXQgaW4gdGhlIGN1cnJlbnQgdmlldy5cclxuKiovXHJcbkFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcbiAgICAvLyBUT0RPOiBtdXN0IGtlZXAgdmlld1N0YXRlIHVwIHRvIGRhdGUgdXNpbmcgb3B0aW9ucy9zdGF0ZS5cclxuICAgIFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICB0aGlzLnJlcXVlc3REYXRhID0gb3B0aW9ucztcclxuICAgIFxyXG4gICAgLy8gRW5hYmxlIHJlZ2lzdGVyZWQgaGFuZGxlcnNcclxuICAgIC8vIFZhbGlkYXRpb24gb2YgZWFjaCBzZXR0aW5ncyBvYmplY3QgaXMgcGVyZm9ybWVkXHJcbiAgICAvLyBvbiByZWdpc3RlcmVkLCBhdm9pZGVkIGhlcmUuXHJcbiAgICBpZiAodGhpcy5faGFuZGxlcnMgJiZcclxuICAgICAgICB0aGlzLl9oYW5kbGVyc0FyZUNvbm5lY3RlZCAhPT0gdHJ1ZSkge1xyXG4gICAgICAgIHRoaXMuX2hhbmRsZXJzLmZvckVhY2goZnVuY3Rpb24oc2V0dGluZ3MpIHtcclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgaXMgYW4gb2JzZXJ2YWJsZSBzdWJzY3JpcHRpb25cclxuICAgICAgICAgICAgaWYgKCFzZXR0aW5ncy5ldmVudCAmJiBzZXR0aW5ncy50YXJnZXQuc3Vic2NyaWJlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3Vic2NyaXB0aW9uID0gc2V0dGluZ3MudGFyZ2V0LnN1YnNjcmliZShzZXR0aW5ncy5oYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgIC8vIE9ic2VydmFibGVzIGhhcyBub3QgYSAndW5zdWJzY3JpYmUnIGZ1bmN0aW9uLFxyXG4gICAgICAgICAgICAgICAgLy8gdGhleSByZXR1cm4gYW4gb2JqZWN0IHRoYXQgbXVzdCBiZSAnZGlzcG9zZWQnLlxyXG4gICAgICAgICAgICAgICAgLy8gU2F2aW5nIHRoYXQgd2l0aCBzZXR0aW5ncyB0byBhbGxvdyAndW5zdWJzY3JpYmUnIGxhdGVyLlxyXG4gICAgICAgICAgICAgICAgc2V0dGluZ3MuX3N1YnNjcmlwdGlvbiA9IHN1YnNjcmlwdGlvbjtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gSW5tZWRpYXRlIGV4ZWN1dGlvbjogaWYgY3VycmVudCBvYnNlcnZhYmxlIHZhbHVlIGlzIGRpZmZlcmVudFxyXG4gICAgICAgICAgICAgICAgLy8gdGhhbiBwcmV2aW91cyBvbmUsIGV4ZWN1dGUgdGhlIGhhbmRsZXI6XHJcbiAgICAgICAgICAgICAgICAvLyAodGhpcyBhdm9pZCB0aGF0IGEgY2hhbmdlZCBzdGF0ZSBnZXQgb21pdHRlZCBiZWNhdXNlIGhhcHBlbmVkXHJcbiAgICAgICAgICAgICAgICAvLyB3aGVuIHN1YnNjcmlwdGlvbiB3YXMgb2ZmOyBpdCBtZWFucyBhIGZpcnN0IHRpbWUgZXhlY3V0aW9uIHRvbykuXHJcbiAgICAgICAgICAgICAgICAvLyBOT1RFOiAndW5kZWZpbmVkJyB2YWx1ZSBvbiBvYnNlcnZhYmxlIG1heSBjYXVzZSB0aGlzIHRvIGZhbGxcclxuICAgICAgICAgICAgICAgIGlmIChzZXR0aW5ncy5fbGF0ZXN0U3Vic2NyaWJlZFZhbHVlICE9PSBzZXR0aW5ncy50YXJnZXQoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNldHRpbmdzLmhhbmRsZXIuY2FsbChzZXR0aW5ncy50YXJnZXQsIHNldHRpbmdzLnRhcmdldCgpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChzZXR0aW5ncy5zZWxlY3Rvcikge1xyXG4gICAgICAgICAgICAgICAgc2V0dGluZ3MudGFyZ2V0Lm9uKHNldHRpbmdzLmV2ZW50LCBzZXR0aW5ncy5zZWxlY3Rvciwgc2V0dGluZ3MuaGFuZGxlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy50YXJnZXQub24oc2V0dGluZ3MuZXZlbnQsIHNldHRpbmdzLmhhbmRsZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gVG8gYXZvaWQgZG91YmxlIGNvbm5lY3Rpb25zOlxyXG4gICAgICAgIC8vIE5PVEU6IG1heSBoYXBwZW4gdGhhdCAnc2hvdycgZ2V0cyBjYWxsZWQgc2V2ZXJhbCB0aW1lcyB3aXRob3V0IGEgJ2hpZGUnXHJcbiAgICAgICAgLy8gaW4gYmV0d2VlbiwgYmVjYXVzZSAnc2hvdycgYWN0cyBhcyBhIHJlZnJlc2hlciByaWdodCBub3cgZXZlbiBmcm9tIHNlZ21lbnRcclxuICAgICAgICAvLyBjaGFuZ2VzIGZyb20gdGhlIHNhbWUgYWN0aXZpdHkuXHJcbiAgICAgICAgdGhpcy5faGFuZGxlcnNBcmVDb25uZWN0ZWQgPSB0cnVlO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAgICBQZXJmb3JtIHRhc2tzIHRvIHN0b3AgYW55dGhpbmcgcnVubmluZyBvciBzdG9wIGhhbmRsZXJzIGZyb20gbGlzdGVuaW5nLlxyXG4gICAgTXVzdCBiZSBleGVjdXRlZCBldmVyeSB0aW1lIHRoZSBhY3Rpdml0eSBpcyBoaWRkZW4vcmVtb3ZlZCBcclxuICAgIGZyb20gdGhlIGN1cnJlbnQgdmlldy5cclxuKiovXHJcbkFjdGl2aXR5LnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24gaGlkZSgpIHtcclxuICAgIFxyXG4gICAgLy8gRGlzYWJsZSByZWdpc3RlcmVkIGhhbmRsZXJzXHJcbiAgICBpZiAodGhpcy5faGFuZGxlcnMpIHtcclxuICAgICAgICB0aGlzLl9oYW5kbGVycy5mb3JFYWNoKGZ1bmN0aW9uKHNldHRpbmdzKSB7XHJcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIGlzIGFuIG9ic2VydmFibGUgc3Vic2NyaXB0aW9uXHJcbiAgICAgICAgICAgIGlmIChzZXR0aW5ncy5fc3Vic2NyaXB0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5fc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIC8vIFNhdmUgbGF0ZXN0IG9ic2VydmFibGUgdmFsdWUgdG8gbWFrZSBhIGNvbXBhcmlzaW9uXHJcbiAgICAgICAgICAgICAgICAvLyBuZXh0IHRpbWUgaXMgZW5hYmxlZCB0byBlbnN1cmUgaXMgZXhlY3V0ZWQgaWYgdGhlcmUgd2FzXHJcbiAgICAgICAgICAgICAgICAvLyBhIGNoYW5nZSB3aGlsZSBkaXNhYmxlZDpcclxuICAgICAgICAgICAgICAgIHNldHRpbmdzLl9sYXRlc3RTdWJzY3JpYmVkVmFsdWUgPSBzZXR0aW5ncy50YXJnZXQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChzZXR0aW5ncy50YXJnZXQub2ZmKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3Muc2VsZWN0b3IpXHJcbiAgICAgICAgICAgICAgICAgICAgc2V0dGluZ3MudGFyZ2V0Lm9mZihzZXR0aW5ncy5ldmVudCwgc2V0dGluZ3Muc2VsZWN0b3IsIHNldHRpbmdzLmhhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHNldHRpbmdzLnRhcmdldC5vZmYoc2V0dGluZ3MuZXZlbnQsIHNldHRpbmdzLmhhbmRsZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2V0dGluZ3MudGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHNldHRpbmdzLmV2ZW50LCBzZXR0aW5ncy5oYW5kbGVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuX2hhbmRsZXJzQXJlQ29ubmVjdGVkID0gZmFsc2U7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICAgIFJlZ2lzdGVyIGEgaGFuZGxlciB0aGF0IGFjdHMgb24gYW4gZXZlbnQgb3Igc3Vic2NyaXB0aW9uIG5vdGlmaWNhdGlvbixcclxuICAgIHRoYXQgd2lsbCBiZSBlbmFibGVkIG9uIEFjdGl2aXR5LnNob3cgYW5kIGRpc2FibGVkIG9uIEFjdGl2aXR5LmhpZGUuXHJcblxyXG4gICAgQHBhcmFtIHNldHRpbmdzOm9iamVjdCB7XHJcbiAgICAgICAgdGFyZ2V0OiBqUXVlcnksIEV2ZW50RW1pdHRlciwgS25vY2tvdXQub2JzZXJ2YWJsZS4gUmVxdWlyZWRcclxuICAgICAgICBldmVudDogc3RyaW5nLiBFdmVudCBuYW1lIChjYW4gaGF2ZSBuYW1lc3BhY2VzLCBzZXZlcmFsIGV2ZW50cyBhbGxvd2VkKS4gSXRzIHJlcXVpcmVkIGV4Y2VwdCB3aGVuIHRoZSB0YXJnZXQgaXMgYW4gb2JzZXJ2YWJsZSwgdGhlcmUgbXVzdFxyXG4gICAgICAgICAgICBiZSBvbWl0dGVkLlxyXG4gICAgICAgIGhhbmRsZXI6IEZ1bmN0aW9uLiBSZXF1aXJlZCxcclxuICAgICAgICBzZWxlY3Rvcjogc3RyaW5nLiBPcHRpb25hbC4gRm9yIGpRdWVyeSBldmVudHMgb25seSwgcGFzc2VkIGFzIHRoZVxyXG4gICAgICAgICAgICBzZWxlY3RvciBmb3IgZGVsZWdhdGVkIGhhbmRsZXJzLlxyXG4gICAgfVxyXG4qKi9cclxuQWN0aXZpdHkucHJvdG90eXBlLnJlZ2lzdGVySGFuZGxlciA9IGZ1bmN0aW9uIHJlZ2lzdGVySGFuZGxlcihzZXR0aW5ncykge1xyXG4gICAgLypqc2hpbnQgbWF4Y29tcGxleGl0eTo4ICovXHJcbiAgICBcclxuICAgIGlmICghc2V0dGluZ3MpXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZWdpc3RlciByZXF1aXJlIGEgc2V0dGluZ3Mgb2JqZWN0Jyk7XHJcbiAgICBcclxuICAgIGlmICghc2V0dGluZ3MudGFyZ2V0IHx8ICghc2V0dGluZ3MudGFyZ2V0Lm9uICYmICFzZXR0aW5ncy50YXJnZXQuc3Vic2NyaWJlKSlcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RhcmdldCBpcyBudWxsIG9yIG5vdCBhIGpRdWVyeSwgRXZlbnRFbW1pdGVyIG9yIE9ic2VydmFibGUgb2JqZWN0Jyk7XHJcbiAgICBcclxuICAgIGlmICh0eXBlb2Yoc2V0dGluZ3MuaGFuZGxlcikgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0hhbmRsZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZiAoIXNldHRpbmdzLmV2ZW50ICYmICFzZXR0aW5ncy50YXJnZXQuc3Vic2NyaWJlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdFdmVudCBpcyBudWxsOyBpdFxcJ3MgcmVxdWlyZWQgZm9yIG5vbiBvYnNlcnZhYmxlIG9iamVjdHMnKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9oYW5kbGVycyA9IHRoaXMuX2hhbmRsZXJzIHx8IFtdO1xyXG5cclxuICAgIHRoaXMuX2hhbmRsZXJzLnB1c2goc2V0dGluZ3MpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBTdGF0aWMgdXRpbGl0aWVzXHJcbioqL1xyXG4vLyBGb3IgY29tbW9kaXR5LCBjb21tb24gY2xhc3NlcyBhcmUgZXhwb3NlZCBhcyBzdGF0aWMgcHJvcGVydGllc1xyXG5BY3Rpdml0eS5OYXZCYXIgPSBOYXZCYXI7XHJcbkFjdGl2aXR5Lk5hdkFjdGlvbiA9IE5hdkFjdGlvbjtcclxuXHJcbi8vIFF1aWNrIGNyZWF0aW9uIG9mIGNvbW1vbiB0eXBlcyBvZiBOYXZCYXJcclxuQWN0aXZpdHkuY3JlYXRlU2VjdGlvbk5hdkJhciA9IGZ1bmN0aW9uIGNyZWF0ZVNlY3Rpb25OYXZCYXIodGl0bGUpIHtcclxuICAgIHJldHVybiBuZXcgTmF2QmFyKHtcclxuICAgICAgICB0aXRsZTogdGl0bGUsXHJcbiAgICAgICAgbGVmdEFjdGlvbjogTmF2QWN0aW9uLm1lbnVOZXdJdGVtLFxyXG4gICAgICAgIHJpZ2h0QWN0aW9uOiBOYXZBY3Rpb24ubWVudUluXHJcbiAgICB9KTtcclxufTtcclxuXHJcbkFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIgPSBmdW5jdGlvbiBjcmVhdGVTdWJzZWN0aW9uTmF2QmFyKHRpdGxlLCBvcHRpb25zKSB7XHJcbiAgICBcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgXHJcbiAgICB2YXIgZ29CYWNrT3B0aW9ucyA9IHtcclxuICAgICAgICB0ZXh0OiB0aXRsZSxcclxuICAgICAgICBpc1RpdGxlOiB0cnVlXHJcbiAgICB9O1xyXG5cclxuICAgIGlmIChvcHRpb25zLmJhY2tMaW5rKSB7XHJcbiAgICAgICAgZ29CYWNrT3B0aW9ucy5saW5rID0gb3B0aW9ucy5iYWNrTGluaztcclxuICAgICAgICBnb0JhY2tPcHRpb25zLmlzU2hlbGwgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IE5hdkJhcih7XHJcbiAgICAgICAgdGl0bGU6ICcnLCAvLyBObyB0aXRsZVxyXG4gICAgICAgIGxlZnRBY3Rpb246IE5hdkFjdGlvbi5nb0JhY2subW9kZWwuY2xvbmUoZ29CYWNrT3B0aW9ucyksXHJcbiAgICAgICAgcmlnaHRBY3Rpb246IG9wdGlvbnMuaGVscElkID9cclxuICAgICAgICAgICAgTmF2QWN0aW9uLmdvSGVscEluZGV4Lm1vZGVsLmNsb25lKHtcclxuICAgICAgICAgICAgICAgIGxpbms6ICcjJyArIG9wdGlvbnMuaGVscElkXHJcbiAgICAgICAgICAgIH0pIDpcclxuICAgICAgICAgICAgTmF2QWN0aW9uLmdvSGVscEluZGV4XHJcbiAgICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgU2luZ2xldG9uIGhlbHBlclxyXG4qKi9cclxudmFyIGNyZWF0ZVNpbmdsZXRvbiA9IGZ1bmN0aW9uIGNyZWF0ZVNpbmdsZXRvbihBY3Rpdml0eUNsYXNzLCAkYWN0aXZpdHksIGFwcCkge1xyXG4gICAgXHJcbiAgICBjcmVhdGVTaW5nbGV0b24uaW5zdGFuY2VzID0gY3JlYXRlU2luZ2xldG9uLmluc3RhbmNlcyB8fCB7fTtcclxuICAgIFxyXG4gICAgaWYgKGNyZWF0ZVNpbmdsZXRvbi5pbnN0YW5jZXNbQWN0aXZpdHlDbGFzcy5uYW1lXSBpbnN0YW5jZW9mIEFjdGl2aXR5Q2xhc3MpIHtcclxuICAgICAgICByZXR1cm4gY3JlYXRlU2luZ2xldG9uLmluc3RhbmNlc1tBY3Rpdml0eUNsYXNzLm5hbWVdO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdmFyIHMgPSBuZXcgQWN0aXZpdHlDbGFzcygkYWN0aXZpdHksIGFwcCk7XHJcbiAgICAgICAgY3JlYXRlU2luZ2xldG9uLmluc3RhbmNlc1tBY3Rpdml0eUNsYXNzLm5hbWVdID0gcztcclxuICAgICAgICByZXR1cm4gcztcclxuICAgIH1cclxufTtcclxuLy8gRXhhbXBsZSBvZiB1c2VcclxuLy9leHBvcnRzLmluaXQgPSBjcmVhdGVTaW5nbGV0b24uYmluZChudWxsLCBBY3Rpdml0eUNsYXNzKTtcclxuXHJcbi8qKlxyXG4gICAgU3RhdGljIG1ldGhvZCBleHRlbmRzIHRvIGhlbHAgaW5oZXJpdGFuY2UuXHJcbiAgICBBZGRpdGlvbmFsbHksIGl0IGFkZHMgYSBzdGF0aWMgaW5pdCBtZXRob2QgcmVhZHkgZm9yIHRoZSBuZXcgY2xhc3NcclxuICAgIHRoYXQgZ2VuZXJhdGVzL3JldHJpZXZlcyB0aGUgc2luZ2xldG9uLlxyXG4qKi9cclxuQWN0aXZpdHkuZXh0ZW5kcyA9IGZ1bmN0aW9uIGV4dGVuZHNBY3Rpdml0eShDbGFzc0ZuKSB7XHJcbiAgICBcclxuICAgIENsYXNzRm4uX2luaGVyaXRzKEFjdGl2aXR5KTtcclxuICAgIFxyXG4gICAgQ2xhc3NGbi5pbml0ID0gY3JlYXRlU2luZ2xldG9uLmJpbmQobnVsbCwgQ2xhc3NGbik7XHJcbiAgICBcclxuICAgIHJldHVybiBDbGFzc0ZuO1xyXG59O1xyXG4iLCIvKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICogRGF0ZVBpY2tlciBKUyBDb21wb25lbnQsIHdpdGggc2V2ZXJhbFxyXG4gKiBtb2RlcyBhbmQgb3B0aW9uYWwgaW5saW5lLXBlcm1hbmVudCB2aXN1YWxpemF0aW9uLlxyXG4gKlxyXG4gKiBDb3B5cmlnaHQgMjAxNCBMb2Nvbm9taWNzIENvb3AuXHJcbiAqXHJcbiAqIEJhc2VkIG9uOlxyXG4gKiBib290c3RyYXAtZGF0ZXBpY2tlci5qcyBcclxuICogaHR0cDovL3d3dy5leWVjb24ucm8vYm9vdHN0cmFwLWRhdGVwaWNrZXJcclxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAqIENvcHlyaWdodCAyMDEyIFN0ZWZhbiBQZXRyZVxyXG4gKlxyXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xyXG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXHJcbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxyXG4gKlxyXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcclxuICpcclxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxyXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXHJcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxyXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXHJcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxyXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7IFxyXG5cclxudmFyIGNsYXNzZXMgPSB7XHJcbiAgICBjb21wb25lbnQ6ICdEYXRlUGlja2VyJyxcclxuICAgIG1vbnRoczogJ0RhdGVQaWNrZXItbW9udGhzJyxcclxuICAgIGRheXM6ICdEYXRlUGlja2VyLWRheXMnLFxyXG4gICAgbW9udGhEYXk6ICdkYXknLFxyXG4gICAgbW9udGg6ICdtb250aCcsXHJcbiAgICB5ZWFyOiAneWVhcicsXHJcbiAgICB5ZWFyczogJ0RhdGVQaWNrZXIteWVhcnMnXHJcbn07XHJcblxyXG4vLyBQaWNrZXIgb2JqZWN0XHJcbnZhciBEYXRlUGlja2VyID0gZnVuY3Rpb24oZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgLypqc2hpbnQgbWF4c3RhdGVtZW50czozMixtYXhjb21wbGV4aXR5OjI0Ki9cclxuICAgIHRoaXMuZWxlbWVudCA9ICQoZWxlbWVudCk7XHJcbiAgICB0aGlzLmZvcm1hdCA9IERQR2xvYmFsLnBhcnNlRm9ybWF0KG9wdGlvbnMuZm9ybWF0fHx0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS1mb3JtYXQnKXx8J21tL2RkL3l5eXknKTtcclxuICAgIFxyXG4gICAgdGhpcy5pc0lucHV0ID0gdGhpcy5lbGVtZW50LmlzKCdpbnB1dCcpO1xyXG4gICAgdGhpcy5jb21wb25lbnQgPSB0aGlzLmVsZW1lbnQuaXMoJy5kYXRlJykgPyB0aGlzLmVsZW1lbnQuZmluZCgnLmFkZC1vbicpIDogZmFsc2U7XHJcbiAgICB0aGlzLmlzUGxhY2Vob2xkZXIgPSB0aGlzLmVsZW1lbnQuaXMoJy5jYWxlbmRhci1wbGFjZWhvbGRlcicpO1xyXG4gICAgXHJcbiAgICB0aGlzLnBpY2tlciA9ICQoRFBHbG9iYWwudGVtcGxhdGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmRUbyh0aGlzLmlzUGxhY2Vob2xkZXIgPyB0aGlzLmVsZW1lbnQgOiAnYm9keScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5vbignY2xpY2sgdGFwJywgJC5wcm94eSh0aGlzLmNsaWNrLCB0aGlzKSk7XHJcbiAgICAvLyBUT0RPOiB0byByZXZpZXcgaWYgJ2NvbnRhaW5lcicgY2xhc3MgY2FuIGJlIGF2b2lkZWQsIHNvIGluIHBsYWNlaG9sZGVyIG1vZGUgZ2V0cyBvcHRpb25hbFxyXG4gICAgLy8gaWYgaXMgd2FudGVkIGNhbiBiZSBwbGFjZWQgb24gdGhlIHBsYWNlaG9sZGVyIGVsZW1lbnQgKG9yIGNvbnRhaW5lci1mbHVpZCBvciBub3RoaW5nKVxyXG4gICAgdGhpcy5waWNrZXIuYWRkQ2xhc3ModGhpcy5pc1BsYWNlaG9sZGVyID8gJ2NvbnRhaW5lcicgOiAnZHJvcGRvd24tbWVudScpO1xyXG4gICAgXHJcbiAgICBpZiAodGhpcy5pc1BsYWNlaG9sZGVyKSB7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuc2hvdygpO1xyXG4gICAgICAgIGlmICh0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZScpID09ICd0b2RheScpIHtcclxuICAgICAgICAgICAgdGhpcy5kYXRlID0gbmV3IERhdGUoKTtcclxuICAgICAgICAgICAgdGhpcy5zZXQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICB0eXBlOiAnc2hvdycsXHJcbiAgICAgICAgICAgIGRhdGU6IHRoaXMuZGF0ZVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodGhpcy5pc0lucHV0KSB7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50Lm9uKHtcclxuICAgICAgICAgICAgZm9jdXM6ICQucHJveHkodGhpcy5zaG93LCB0aGlzKSxcclxuICAgICAgICAgICAgLy9ibHVyOiAkLnByb3h5KHRoaXMuaGlkZSwgdGhpcyksXHJcbiAgICAgICAgICAgIGtleXVwOiAkLnByb3h5KHRoaXMudXBkYXRlLCB0aGlzKVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAodGhpcy5jb21wb25lbnQpe1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBvbmVudC5vbignY2xpY2sgdGFwJywgJC5wcm94eSh0aGlzLnNob3csIHRoaXMpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQub24oJ2NsaWNrIHRhcCcsICQucHJveHkodGhpcy5zaG93LCB0aGlzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvKiBUb3VjaCBldmVudHMgdG8gc3dpcGUgZGF0ZXMgKi9cclxuICAgIHRoaXMuZWxlbWVudFxyXG4gICAgLm9uKCdzd2lwZWxlZnQnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHRoaXMubW92ZURhdGUoJ25leHQnKTtcclxuICAgIH0uYmluZCh0aGlzKSlcclxuICAgIC5vbignc3dpcGVyaWdodCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdGhpcy5tb3ZlRGF0ZSgncHJldicpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAvKiBTZXQtdXAgdmlldyBtb2RlICovXHJcbiAgICB0aGlzLm1pblZpZXdNb2RlID0gb3B0aW9ucy5taW5WaWV3TW9kZXx8dGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtbWludmlld21vZGUnKXx8MDtcclxuICAgIGlmICh0eXBlb2YgdGhpcy5taW5WaWV3TW9kZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICBzd2l0Y2ggKHRoaXMubWluVmlld01vZGUpIHtcclxuICAgICAgICAgICAgY2FzZSAnbW9udGhzJzpcclxuICAgICAgICAgICAgICAgIHRoaXMubWluVmlld01vZGUgPSAxO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ3llYXJzJzpcclxuICAgICAgICAgICAgICAgIHRoaXMubWluVmlld01vZGUgPSAyO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pblZpZXdNb2RlID0gMDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMudmlld01vZGUgPSBvcHRpb25zLnZpZXdNb2RlfHx0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS12aWV3bW9kZScpfHwwO1xyXG4gICAgaWYgKHR5cGVvZiB0aGlzLnZpZXdNb2RlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgIHN3aXRjaCAodGhpcy52aWV3TW9kZSkge1xyXG4gICAgICAgICAgICBjYXNlICdtb250aHMnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZSA9IDE7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAneWVhcnMnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZSA9IDI7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGUgPSAwO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5zdGFydFZpZXdNb2RlID0gdGhpcy52aWV3TW9kZTtcclxuICAgIHRoaXMud2Vla1N0YXJ0ID0gb3B0aW9ucy53ZWVrU3RhcnR8fHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLXdlZWtzdGFydCcpfHwwO1xyXG4gICAgdGhpcy53ZWVrRW5kID0gdGhpcy53ZWVrU3RhcnQgPT09IDAgPyA2IDogdGhpcy53ZWVrU3RhcnQgLSAxO1xyXG4gICAgdGhpcy5vblJlbmRlciA9IG9wdGlvbnMub25SZW5kZXI7XHJcbiAgICB0aGlzLmZpbGxEb3coKTtcclxuICAgIHRoaXMuZmlsbE1vbnRocygpO1xyXG4gICAgdGhpcy51cGRhdGUoKTtcclxuICAgIHRoaXMuc2hvd01vZGUoKTtcclxufTtcclxuXHJcbkRhdGVQaWNrZXIucHJvdG90eXBlID0ge1xyXG4gICAgY29uc3RydWN0b3I6IERhdGVQaWNrZXIsXHJcbiAgICBcclxuICAgIHNob3c6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB0aGlzLnBpY2tlci5zaG93KCk7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLmNvbXBvbmVudCA/IHRoaXMuY29tcG9uZW50Lm91dGVySGVpZ2h0KCkgOiB0aGlzLmVsZW1lbnQub3V0ZXJIZWlnaHQoKTtcclxuICAgICAgICB0aGlzLnBsYWNlKCk7XHJcbiAgICAgICAgJCh3aW5kb3cpLm9uKCdyZXNpemUnLCAkLnByb3h5KHRoaXMucGxhY2UsIHRoaXMpKTtcclxuICAgICAgICBpZiAoZSApIHtcclxuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXRoaXMuaXNJbnB1dCkge1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgJChkb2N1bWVudCkub24oJ21vdXNlZG93bicsIGZ1bmN0aW9uKGV2KXtcclxuICAgICAgICAgICAgaWYgKCQoZXYudGFyZ2V0KS5jbG9zZXN0KCcuJyArIGNsYXNzZXMuY29tcG9uZW50KS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHRoYXQuaGlkZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICB0eXBlOiAnc2hvdycsXHJcbiAgICAgICAgICAgIGRhdGU6IHRoaXMuZGF0ZVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgaGlkZTogZnVuY3Rpb24oKXtcclxuICAgICAgICB0aGlzLnBpY2tlci5oaWRlKCk7XHJcbiAgICAgICAgJCh3aW5kb3cpLm9mZigncmVzaXplJywgdGhpcy5wbGFjZSk7XHJcbiAgICAgICAgdGhpcy52aWV3TW9kZSA9IHRoaXMuc3RhcnRWaWV3TW9kZTtcclxuICAgICAgICB0aGlzLnNob3dNb2RlKCk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzSW5wdXQpIHtcclxuICAgICAgICAgICAgJChkb2N1bWVudCkub2ZmKCdtb3VzZWRvd24nLCB0aGlzLmhpZGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL3RoaXMuc2V0KCk7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICB0eXBlOiAnaGlkZScsXHJcbiAgICAgICAgICAgIGRhdGU6IHRoaXMuZGF0ZVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgZm9ybWF0ZWQgPSBEUEdsb2JhbC5mb3JtYXREYXRlKHRoaXMuZGF0ZSwgdGhpcy5mb3JtYXQpO1xyXG4gICAgICAgIGlmICghdGhpcy5pc0lucHV0KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbXBvbmVudCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuZmluZCgnaW5wdXQnKS5wcm9wKCd2YWx1ZScsIGZvcm1hdGVkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZScsIGZvcm1hdGVkKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucHJvcCgndmFsdWUnLCBmb3JtYXRlZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgU2V0cyBhIGRhdGUgYXMgdmFsdWUgYW5kIG5vdGlmeSB3aXRoIGFuIGV2ZW50LlxyXG4gICAgICAgIFBhcmFtZXRlciBkb250Tm90aWZ5IGlzIG9ubHkgZm9yIGNhc2VzIHdoZXJlIHRoZSBjYWxlbmRhciBvclxyXG4gICAgICAgIHNvbWUgcmVsYXRlZCBjb21wb25lbnQgZ2V0cyBhbHJlYWR5IHVwZGF0ZWQgYnV0IHRoZSBoaWdobGlnaHRlZFxyXG4gICAgICAgIGRhdGUgbmVlZHMgdG8gYmUgdXBkYXRlZCB3aXRob3V0IGNyZWF0ZSBpbmZpbml0ZSByZWN1cnNpb24gXHJcbiAgICAgICAgYmVjYXVzZSBvZiBub3RpZmljYXRpb24uIEluIG90aGVyIGNhc2UsIGRvbnQgdXNlLlxyXG4gICAgKiovXHJcbiAgICBzZXRWYWx1ZTogZnVuY3Rpb24obmV3RGF0ZSwgZG9udE5vdGlmeSkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgbmV3RGF0ZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgdGhpcy5kYXRlID0gRFBHbG9iYWwucGFyc2VEYXRlKG5ld0RhdGUsIHRoaXMuZm9ybWF0KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZShuZXdEYXRlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZXQoKTtcclxuICAgICAgICB0aGlzLnZpZXdEYXRlID0gbmV3IERhdGUodGhpcy5kYXRlLmdldEZ1bGxZZWFyKCksIHRoaXMuZGF0ZS5nZXRNb250aCgpLCAxLCAwLCAwLCAwLCAwKTtcclxuICAgICAgICB0aGlzLmZpbGwoKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoZG9udE5vdGlmeSAhPT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAvLyBOb3RpZnk6XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdjaGFuZ2VEYXRlJyxcclxuICAgICAgICAgICAgICAgIGRhdGU6IHRoaXMuZGF0ZSxcclxuICAgICAgICAgICAgICAgIHZpZXdNb2RlOiBEUEdsb2JhbC5tb2Rlc1t0aGlzLnZpZXdNb2RlXS5jbHNOYW1lXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIGdldFZhbHVlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kYXRlO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgbW92ZVZhbHVlOiBmdW5jdGlvbihkaXIsIG1vZGUpIHtcclxuICAgICAgICAvLyBkaXIgY2FuIGJlOiAncHJldicsICduZXh0J1xyXG4gICAgICAgIGlmIChbJ3ByZXYnLCAnbmV4dCddLmluZGV4T2YoZGlyICYmIGRpci50b0xvd2VyQ2FzZSgpKSA9PSAtMSlcclxuICAgICAgICAgICAgLy8gTm8gdmFsaWQgb3B0aW9uOlxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIGRlZmF1bHQgbW9kZSBpcyB0aGUgY3VycmVudCBvbmVcclxuICAgICAgICBtb2RlID0gbW9kZSA/XHJcbiAgICAgICAgICAgIERQR2xvYmFsLm1vZGVzU2V0W21vZGVdIDpcclxuICAgICAgICAgICAgRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV07XHJcblxyXG4gICAgICAgIHRoaXMuZGF0ZVsnc2V0JyArIG1vZGUubmF2Rm5jXS5jYWxsKFxyXG4gICAgICAgICAgICB0aGlzLmRhdGUsXHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZVsnZ2V0JyArIG1vZGUubmF2Rm5jXS5jYWxsKHRoaXMuZGF0ZSkgKyBcclxuICAgICAgICAgICAgbW9kZS5uYXZTdGVwICogKGRpciA9PT0gJ3ByZXYnID8gLTEgOiAxKVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgdGhpcy5zZXRWYWx1ZSh0aGlzLmRhdGUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGU7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBwbGFjZTogZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgb2Zmc2V0ID0gdGhpcy5jb21wb25lbnQgPyB0aGlzLmNvbXBvbmVudC5vZmZzZXQoKSA6IHRoaXMuZWxlbWVudC5vZmZzZXQoKTtcclxuICAgICAgICB0aGlzLnBpY2tlci5jc3Moe1xyXG4gICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgKyB0aGlzLmhlaWdodCxcclxuICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnRcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIHVwZGF0ZTogZnVuY3Rpb24obmV3RGF0ZSl7XHJcbiAgICAgICAgdGhpcy5kYXRlID0gRFBHbG9iYWwucGFyc2VEYXRlKFxyXG4gICAgICAgICAgICB0eXBlb2YgbmV3RGF0ZSA9PT0gJ3N0cmluZycgPyBuZXdEYXRlIDogKHRoaXMuaXNJbnB1dCA/IHRoaXMuZWxlbWVudC5wcm9wKCd2YWx1ZScpIDogdGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUnKSksXHJcbiAgICAgICAgICAgIHRoaXMuZm9ybWF0XHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLnZpZXdEYXRlID0gbmV3IERhdGUodGhpcy5kYXRlLmdldEZ1bGxZZWFyKCksIHRoaXMuZGF0ZS5nZXRNb250aCgpLCAxLCAwLCAwLCAwLCAwKTtcclxuICAgICAgICB0aGlzLmZpbGwoKTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIGZpbGxEb3c6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdmFyIGRvd0NudCA9IHRoaXMud2Vla1N0YXJ0O1xyXG4gICAgICAgIHZhciBodG1sID0gJzx0cj4nO1xyXG4gICAgICAgIHdoaWxlIChkb3dDbnQgPCB0aGlzLndlZWtTdGFydCArIDcpIHtcclxuICAgICAgICAgICAgaHRtbCArPSAnPHRoIGNsYXNzPVwiZG93XCI+JytEUEdsb2JhbC5kYXRlcy5kYXlzTWluWyhkb3dDbnQrKyklN10rJzwvdGg+JztcclxuICAgICAgICB9XHJcbiAgICAgICAgaHRtbCArPSAnPC90cj4nO1xyXG4gICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy5kYXlzICsgJyB0aGVhZCcpLmFwcGVuZChodG1sKTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIGZpbGxNb250aHM6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdmFyIGh0bWwgPSAnJztcclxuICAgICAgICB2YXIgaSA9IDA7XHJcbiAgICAgICAgd2hpbGUgKGkgPCAxMikge1xyXG4gICAgICAgICAgICBodG1sICs9ICc8c3BhbiBjbGFzcz1cIicgKyBjbGFzc2VzLm1vbnRoICsgJ1wiPicrRFBHbG9iYWwuZGF0ZXMubW9udGhzU2hvcnRbaSsrXSsnPC9zcGFuPic7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy5tb250aHMgKyAnIHRkJykuYXBwZW5kKGh0bWwpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZmlsbDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgLypqc2hpbnQgbWF4c3RhdGVtZW50czo2NiwgbWF4Y29tcGxleGl0eToyOCovXHJcbiAgICAgICAgdmFyIGQgPSBuZXcgRGF0ZSh0aGlzLnZpZXdEYXRlKSxcclxuICAgICAgICAgICAgeWVhciA9IGQuZ2V0RnVsbFllYXIoKSxcclxuICAgICAgICAgICAgbW9udGggPSBkLmdldE1vbnRoKCksXHJcbiAgICAgICAgICAgIGN1cnJlbnREYXRlID0gdGhpcy5kYXRlLnZhbHVlT2YoKTtcclxuICAgICAgICB0aGlzLnBpY2tlclxyXG4gICAgICAgIC5maW5kKCcuJyArIGNsYXNzZXMuZGF5cyArICcgdGg6ZXEoMSknKVxyXG4gICAgICAgIC5odG1sKERQR2xvYmFsLmRhdGVzLm1vbnRoc1ttb250aF0gKyAnICcgKyB5ZWFyKTtcclxuICAgICAgICB2YXIgcHJldk1vbnRoID0gbmV3IERhdGUoeWVhciwgbW9udGgtMSwgMjgsMCwwLDAsMCksXHJcbiAgICAgICAgICAgIGRheSA9IERQR2xvYmFsLmdldERheXNJbk1vbnRoKHByZXZNb250aC5nZXRGdWxsWWVhcigpLCBwcmV2TW9udGguZ2V0TW9udGgoKSk7XHJcbiAgICAgICAgcHJldk1vbnRoLnNldERhdGUoZGF5KTtcclxuICAgICAgICBwcmV2TW9udGguc2V0RGF0ZShkYXkgLSAocHJldk1vbnRoLmdldERheSgpIC0gdGhpcy53ZWVrU3RhcnQgKyA3KSU3KTtcclxuICAgICAgICB2YXIgbmV4dE1vbnRoID0gbmV3IERhdGUocHJldk1vbnRoKTtcclxuICAgICAgICBuZXh0TW9udGguc2V0RGF0ZShuZXh0TW9udGguZ2V0RGF0ZSgpICsgNDIpO1xyXG4gICAgICAgIG5leHRNb250aCA9IG5leHRNb250aC52YWx1ZU9mKCk7XHJcbiAgICAgICAgdmFyIGh0bWwgPSBbXTtcclxuICAgICAgICB2YXIgY2xzTmFtZSxcclxuICAgICAgICAgICAgcHJldlksXHJcbiAgICAgICAgICAgIHByZXZNO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICBpZiAodGhpcy5fZGF5c0NyZWF0ZWQgIT09IHRydWUpIHtcclxuICAgICAgICAgICAgLy8gQ3JlYXRlIGh0bWwgKGZpcnN0IHRpbWUgb25seSlcclxuICAgICAgIFxyXG4gICAgICAgICAgICB3aGlsZShwcmV2TW9udGgudmFsdWVPZigpIDwgbmV4dE1vbnRoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocHJldk1vbnRoLmdldERheSgpID09PSB0aGlzLndlZWtTdGFydCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaCgnPHRyPicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2xzTmFtZSA9IHRoaXMub25SZW5kZXIocHJldk1vbnRoKTtcclxuICAgICAgICAgICAgICAgIHByZXZZID0gcHJldk1vbnRoLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgICAgICAgICBwcmV2TSA9IHByZXZNb250aC5nZXRNb250aCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKChwcmV2TSA8IG1vbnRoICYmICBwcmV2WSA9PT0geWVhcikgfHwgIHByZXZZIDwgeWVhcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBvbGQnO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgocHJldk0gPiBtb250aCAmJiBwcmV2WSA9PT0geWVhcikgfHwgcHJldlkgPiB5ZWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIG5ldyc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAocHJldk1vbnRoLnZhbHVlT2YoKSA9PT0gY3VycmVudERhdGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgYWN0aXZlJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGh0bWwucHVzaCgnPHRkIGNsYXNzPVwiJyArIGNsYXNzZXMubW9udGhEYXkgKyAnICcgKyBjbHNOYW1lKydcIj4nK3ByZXZNb250aC5nZXREYXRlKCkgKyAnPC90ZD4nKTtcclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGguZ2V0RGF5KCkgPT09IHRoaXMud2Vla0VuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaCgnPC90cj4nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHByZXZNb250aC5zZXREYXRlKHByZXZNb250aC5nZXREYXRlKCkrMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy5kYXlzICsgJyB0Ym9keScpLmVtcHR5KCkuYXBwZW5kKGh0bWwuam9pbignJykpO1xyXG4gICAgICAgICAgICB0aGlzLl9kYXlzQ3JlYXRlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBVcGRhdGUgZGF5cyB2YWx1ZXNcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciB3ZWVrVHIgPSB0aGlzLnBpY2tlci5maW5kKCcuJyArIGNsYXNzZXMuZGF5cyArICcgdGJvZHkgdHI6Zmlyc3QtY2hpbGQoKScpO1xyXG4gICAgICAgICAgICB2YXIgZGF5VGQgPSBudWxsO1xyXG4gICAgICAgICAgICB3aGlsZShwcmV2TW9udGgudmFsdWVPZigpIDwgbmV4dE1vbnRoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudFdlZWtEYXlJbmRleCA9IHByZXZNb250aC5nZXREYXkoKSAtIHRoaXMud2Vla1N0YXJ0O1xyXG5cclxuICAgICAgICAgICAgICAgIGNsc05hbWUgPSB0aGlzLm9uUmVuZGVyKHByZXZNb250aCk7XHJcbiAgICAgICAgICAgICAgICBwcmV2WSA9IHByZXZNb250aC5nZXRGdWxsWWVhcigpO1xyXG4gICAgICAgICAgICAgICAgcHJldk0gPSBwcmV2TW9udGguZ2V0TW9udGgoKTtcclxuICAgICAgICAgICAgICAgIGlmICgocHJldk0gPCBtb250aCAmJiAgcHJldlkgPT09IHllYXIpIHx8ICBwcmV2WSA8IHllYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgb2xkJztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoKHByZXZNID4gbW9udGggJiYgcHJldlkgPT09IHllYXIpIHx8IHByZXZZID4geWVhcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBuZXcnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZNb250aC52YWx1ZU9mKCkgPT09IGN1cnJlbnREYXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIGFjdGl2ZSc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL2h0bWwucHVzaCgnPHRkIGNsYXNzPVwiZGF5ICcrY2xzTmFtZSsnXCI+JytwcmV2TW9udGguZ2V0RGF0ZSgpICsgJzwvdGQ+Jyk7XHJcbiAgICAgICAgICAgICAgICBkYXlUZCA9IHdlZWtUci5maW5kKCd0ZDplcSgnICsgY3VycmVudFdlZWtEYXlJbmRleCArICcpJyk7XHJcbiAgICAgICAgICAgICAgICBkYXlUZFxyXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2RheSAnICsgY2xzTmFtZSlcclxuICAgICAgICAgICAgICAgIC50ZXh0KHByZXZNb250aC5nZXREYXRlKCkpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBOZXh0IHdlZWs/XHJcbiAgICAgICAgICAgICAgICBpZiAocHJldk1vbnRoLmdldERheSgpID09PSB0aGlzLndlZWtFbmQpIHtcclxuICAgICAgICAgICAgICAgICAgICB3ZWVrVHIgPSB3ZWVrVHIubmV4dCgndHInKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHByZXZNb250aC5zZXREYXRlKHByZXZNb250aC5nZXREYXRlKCkrMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBjdXJyZW50WWVhciA9IHRoaXMuZGF0ZS5nZXRGdWxsWWVhcigpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBtb250aHMgPSB0aGlzLnBpY2tlci5maW5kKCcuJyArIGNsYXNzZXMubW9udGhzKVxyXG4gICAgICAgICAgICAgICAgICAgIC5maW5kKCd0aDplcSgxKScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5odG1sKHllYXIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5lbmQoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5maW5kKCdzcGFuJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xyXG4gICAgICAgIGlmIChjdXJyZW50WWVhciA9PT0geWVhcikge1xyXG4gICAgICAgICAgICBtb250aHMuZXEodGhpcy5kYXRlLmdldE1vbnRoKCkpLmFkZENsYXNzKCdhY3RpdmUnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaHRtbCA9ICcnO1xyXG4gICAgICAgIHllYXIgPSBwYXJzZUludCh5ZWFyLzEwLCAxMCkgKiAxMDtcclxuICAgICAgICB2YXIgeWVhckNvbnQgPSB0aGlzLnBpY2tlci5maW5kKCcuJyArIGNsYXNzZXMueWVhcnMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgndGg6ZXEoMSknKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50ZXh0KHllYXIgKyAnLScgKyAoeWVhciArIDkpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5lbmQoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ3RkJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgeWVhciAtPSAxO1xyXG4gICAgICAgIHZhciBpO1xyXG4gICAgICAgIGlmICh0aGlzLl95ZWFyc0NyZWF0ZWQgIT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIGZvciAoaSA9IC0xOyBpIDwgMTE7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPHNwYW4gY2xhc3M9XCInICsgY2xhc3Nlcy55ZWFyICsgKGkgPT09IC0xIHx8IGkgPT09IDEwID8gJyBvbGQnIDogJycpKyhjdXJyZW50WWVhciA9PT0geWVhciA/ICcgYWN0aXZlJyA6ICcnKSsnXCI+Jyt5ZWFyKyc8L3NwYW4+JztcclxuICAgICAgICAgICAgICAgIHllYXIgKz0gMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgeWVhckNvbnQuaHRtbChodG1sKTtcclxuICAgICAgICAgICAgdGhpcy5feWVhcnNDcmVhdGVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgeWVhclNwYW4gPSB5ZWFyQ29udC5maW5kKCdzcGFuOmZpcnN0LWNoaWxkKCknKTtcclxuICAgICAgICAgICAgZm9yIChpID0gLTE7IGkgPCAxMTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAvL2h0bWwgKz0gJzxzcGFuIGNsYXNzPVwieWVhcicrKGkgPT09IC0xIHx8IGkgPT09IDEwID8gJyBvbGQnIDogJycpKyhjdXJyZW50WWVhciA9PT0geWVhciA/ICcgYWN0aXZlJyA6ICcnKSsnXCI+Jyt5ZWFyKyc8L3NwYW4+JztcclxuICAgICAgICAgICAgICAgIHllYXJTcGFuXHJcbiAgICAgICAgICAgICAgICAudGV4dCh5ZWFyKVxyXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3llYXInICsgKGkgPT09IC0xIHx8IGkgPT09IDEwID8gJyBvbGQnIDogJycpICsgKGN1cnJlbnRZZWFyID09PSB5ZWFyID8gJyBhY3RpdmUnIDogJycpKTtcclxuICAgICAgICAgICAgICAgIHllYXIgKz0gMTtcclxuICAgICAgICAgICAgICAgIHllYXJTcGFuID0geWVhclNwYW4ubmV4dCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgbW92ZURhdGU6IGZ1bmN0aW9uKGRpciwgbW9kZSkge1xyXG4gICAgICAgIC8vIGRpciBjYW4gYmU6ICdwcmV2JywgJ25leHQnXHJcbiAgICAgICAgaWYgKFsncHJldicsICduZXh0J10uaW5kZXhPZihkaXIgJiYgZGlyLnRvTG93ZXJDYXNlKCkpID09IC0xKVxyXG4gICAgICAgICAgICAvLyBObyB2YWxpZCBvcHRpb246XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgLy8gZGVmYXVsdCBtb2RlIGlzIHRoZSBjdXJyZW50IG9uZVxyXG4gICAgICAgIG1vZGUgPSBtb2RlIHx8IHRoaXMudmlld01vZGU7XHJcblxyXG4gICAgICAgIHRoaXMudmlld0RhdGVbJ3NldCcrRFBHbG9iYWwubW9kZXNbbW9kZV0ubmF2Rm5jXS5jYWxsKFxyXG4gICAgICAgICAgICB0aGlzLnZpZXdEYXRlLFxyXG4gICAgICAgICAgICB0aGlzLnZpZXdEYXRlWydnZXQnK0RQR2xvYmFsLm1vZGVzW21vZGVdLm5hdkZuY10uY2FsbCh0aGlzLnZpZXdEYXRlKSArIFxyXG4gICAgICAgICAgICBEUEdsb2JhbC5tb2Rlc1ttb2RlXS5uYXZTdGVwICogKGRpciA9PT0gJ3ByZXYnID8gLTEgOiAxKVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgdGhpcy5maWxsKCk7XHJcbiAgICAgICAgdGhpcy5zZXQoKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xpY2s6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAvKmpzaGludCBtYXhjb21wbGV4aXR5OjE2Ki9cclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB2YXIgdGFyZ2V0ID0gJChlLnRhcmdldCkuY2xvc2VzdCgnc3BhbiwgdGQsIHRoJyk7XHJcbiAgICAgICAgaWYgKHRhcmdldC5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgdmFyIG1vbnRoLCB5ZWFyO1xyXG4gICAgICAgICAgICBzd2l0Y2godGFyZ2V0WzBdLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3RoJzpcclxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2godGFyZ2V0WzBdLmNsYXNzTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzd2l0Y2gnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93TW9kZSgxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdwcmV2JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnbmV4dCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdmVEYXRlKHRhcmdldFswXS5jbGFzc05hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnc3Bhbic6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldC5pcygnLicgKyBjbGFzc2VzLm1vbnRoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb250aCA9IHRhcmdldC5wYXJlbnQoKS5maW5kKCdzcGFuJykuaW5kZXgodGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3RGF0ZS5zZXRNb250aChtb250aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeWVhciA9IHBhcnNlSW50KHRhcmdldC50ZXh0KCksIDEwKXx8MDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3RGF0ZS5zZXRGdWxsWWVhcih5ZWFyKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudmlld01vZGUgIT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRlID0gbmV3IERhdGUodGhpcy52aWV3RGF0ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjaGFuZ2VEYXRlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGU6IHRoaXMuZGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXdNb2RlOiBEUEdsb2JhbC5tb2Rlc1t0aGlzLnZpZXdNb2RlXS5jbHNOYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dNb2RlKC0xKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAndGQnOlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuaXMoJy5kYXknKSAmJiAhdGFyZ2V0LmlzKCcuZGlzYWJsZWQnKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkYXkgPSBwYXJzZUludCh0YXJnZXQudGV4dCgpLCAxMCl8fDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vbnRoID0gdGhpcy52aWV3RGF0ZS5nZXRNb250aCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmlzKCcub2xkJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vbnRoIC09IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0LmlzKCcubmV3JykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vbnRoICs9IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgeWVhciA9IHRoaXMudmlld0RhdGUuZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGgsIGRheSwwLDAsMCwwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3RGF0ZSA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLCBNYXRoLm1pbigyOCwgZGF5KSwwLDAsMCwwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjaGFuZ2VEYXRlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGU6IHRoaXMuZGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXdNb2RlOiBEUEdsb2JhbC5tb2Rlc1t0aGlzLnZpZXdNb2RlXS5jbHNOYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIG1vdXNlZG93bjogZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBzaG93TW9kZTogZnVuY3Rpb24oZGlyKSB7XHJcbiAgICAgICAgaWYgKGRpcikge1xyXG4gICAgICAgICAgICB0aGlzLnZpZXdNb2RlID0gTWF0aC5tYXgodGhpcy5taW5WaWV3TW9kZSwgTWF0aC5taW4oMiwgdGhpcy52aWV3TW9kZSArIGRpcikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnBpY2tlci5maW5kKCc+ZGl2JykuaGlkZSgpLmZpbHRlcignLicgKyBjbGFzc2VzLmNvbXBvbmVudCArICctJyArIERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWUpLnNob3coKTtcclxuICAgIH1cclxufTtcclxuXHJcbiQuZm4uZGF0ZXBpY2tlciA9IGZ1bmN0aW9uICggb3B0aW9uICkge1xyXG4gICAgdmFyIHZhbHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xyXG4gICAgdmFyIHJldHVybmVkO1xyXG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICBkYXRhID0gJHRoaXMuZGF0YSgnZGF0ZXBpY2tlcicpLFxyXG4gICAgICAgICAgICBvcHRpb25zID0gdHlwZW9mIG9wdGlvbiA9PT0gJ29iamVjdCcgJiYgb3B0aW9uO1xyXG4gICAgICAgIGlmICghZGF0YSkge1xyXG4gICAgICAgICAgICAkdGhpcy5kYXRhKCdkYXRlcGlja2VyJywgKGRhdGEgPSBuZXcgRGF0ZVBpY2tlcih0aGlzLCAkLmV4dGVuZCh7fSwgJC5mbi5kYXRlcGlja2VyLmRlZmF1bHRzLG9wdGlvbnMpKSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHJldHVybmVkID0gZGF0YVtvcHRpb25dLmFwcGx5KGRhdGEsIHZhbHMpO1xyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBhIHZhbHVlIHJldHVybmVkIGJ5IHRoZSBtZXRob2Q/XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YocmV0dXJuZWQgIT09ICd1bmRlZmluZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gR28gb3V0IHRoZSBsb29wIHRvIHJldHVybiB0aGUgdmFsdWUgZnJvbSB0aGUgZmlyc3RcclxuICAgICAgICAgICAgICAgIC8vIGVsZW1lbnQtbWV0aG9kIGV4ZWN1dGlvblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIEZvbGxvdyBuZXh0IGxvb3AgaXRlbVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgaWYgKHR5cGVvZihyZXR1cm5lZCkgIT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgIHJldHVybiByZXR1cm5lZDtcclxuICAgIGVsc2VcclxuICAgICAgICAvLyBjaGFpbmluZzpcclxuICAgICAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbiQuZm4uZGF0ZXBpY2tlci5kZWZhdWx0cyA9IHtcclxuICAgIG9uUmVuZGVyOiBmdW5jdGlvbihkYXRlKSB7XHJcbiAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgfVxyXG59O1xyXG4kLmZuLmRhdGVwaWNrZXIuQ29uc3RydWN0b3IgPSBEYXRlUGlja2VyO1xyXG5cclxudmFyIERQR2xvYmFsID0ge1xyXG4gICAgbW9kZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNsc05hbWU6ICdkYXlzJyxcclxuICAgICAgICAgICAgbmF2Rm5jOiAnTW9udGgnLFxyXG4gICAgICAgICAgICBuYXZTdGVwOiAxXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNsc05hbWU6ICdtb250aHMnLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdGdWxsWWVhcicsXHJcbiAgICAgICAgICAgIG5hdlN0ZXA6IDFcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xzTmFtZTogJ3llYXJzJyxcclxuICAgICAgICAgICAgbmF2Rm5jOiAnRnVsbFllYXInLFxyXG4gICAgICAgICAgICBuYXZTdGVwOiAxMFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjbHNOYW1lOiAnZGF5JyxcclxuICAgICAgICAgICAgbmF2Rm5jOiAnRGF0ZScsXHJcbiAgICAgICAgICAgIG5hdlN0ZXA6IDFcclxuICAgICAgICB9XHJcbiAgICBdLFxyXG4gICAgZGF0ZXM6e1xyXG4gICAgICAgIGRheXM6IFtcIlN1bmRheVwiLCBcIk1vbmRheVwiLCBcIlR1ZXNkYXlcIiwgXCJXZWRuZXNkYXlcIiwgXCJUaHVyc2RheVwiLCBcIkZyaWRheVwiLCBcIlNhdHVyZGF5XCIsIFwiU3VuZGF5XCJdLFxyXG4gICAgICAgIGRheXNTaG9ydDogW1wiU3VuXCIsIFwiTW9uXCIsIFwiVHVlXCIsIFwiV2VkXCIsIFwiVGh1XCIsIFwiRnJpXCIsIFwiU2F0XCIsIFwiU3VuXCJdLFxyXG4gICAgICAgIGRheXNNaW46IFtcIlN1XCIsIFwiTW9cIiwgXCJUdVwiLCBcIldlXCIsIFwiVGhcIiwgXCJGclwiLCBcIlNhXCIsIFwiU3VcIl0sXHJcbiAgICAgICAgbW9udGhzOiBbXCJKYW51YXJ5XCIsIFwiRmVicnVhcnlcIiwgXCJNYXJjaFwiLCBcIkFwcmlsXCIsIFwiTWF5XCIsIFwiSnVuZVwiLCBcIkp1bHlcIiwgXCJBdWd1c3RcIiwgXCJTZXB0ZW1iZXJcIiwgXCJPY3RvYmVyXCIsIFwiTm92ZW1iZXJcIiwgXCJEZWNlbWJlclwiXSxcclxuICAgICAgICBtb250aHNTaG9ydDogW1wiSmFuXCIsIFwiRmViXCIsIFwiTWFyXCIsIFwiQXByXCIsIFwiTWF5XCIsIFwiSnVuXCIsIFwiSnVsXCIsIFwiQXVnXCIsIFwiU2VwXCIsIFwiT2N0XCIsIFwiTm92XCIsIFwiRGVjXCJdXHJcbiAgICB9LFxyXG4gICAgaXNMZWFwWWVhcjogZnVuY3Rpb24gKHllYXIpIHtcclxuICAgICAgICByZXR1cm4gKCgoeWVhciAlIDQgPT09IDApICYmICh5ZWFyICUgMTAwICE9PSAwKSkgfHwgKHllYXIgJSA0MDAgPT09IDApKTtcclxuICAgIH0sXHJcbiAgICBnZXREYXlzSW5Nb250aDogZnVuY3Rpb24gKHllYXIsIG1vbnRoKSB7XHJcbiAgICAgICAgcmV0dXJuIFszMSwgKERQR2xvYmFsLmlzTGVhcFllYXIoeWVhcikgPyAyOSA6IDI4KSwgMzEsIDMwLCAzMSwgMzAsIDMxLCAzMSwgMzAsIDMxLCAzMCwgMzFdW21vbnRoXTtcclxuICAgIH0sXHJcbiAgICBwYXJzZUZvcm1hdDogZnVuY3Rpb24oZm9ybWF0KXtcclxuICAgICAgICB2YXIgc2VwYXJhdG9yID0gZm9ybWF0Lm1hdGNoKC9bLlxcL1xcLVxcc10uKj8vKSxcclxuICAgICAgICAgICAgcGFydHMgPSBmb3JtYXQuc3BsaXQoL1xcVysvKTtcclxuICAgICAgICBpZiAoIXNlcGFyYXRvciB8fCAhcGFydHMgfHwgcGFydHMubGVuZ3RoID09PSAwKXtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBkYXRlIGZvcm1hdC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7c2VwYXJhdG9yOiBzZXBhcmF0b3IsIHBhcnRzOiBwYXJ0c307XHJcbiAgICB9LFxyXG4gICAgcGFyc2VEYXRlOiBmdW5jdGlvbihkYXRlLCBmb3JtYXQpIHtcclxuICAgICAgICAvKmpzaGludCBtYXhjb21wbGV4aXR5OjExKi9cclxuICAgICAgICB2YXIgcGFydHMgPSBkYXRlLnNwbGl0KGZvcm1hdC5zZXBhcmF0b3IpLFxyXG4gICAgICAgICAgICB2YWw7XHJcbiAgICAgICAgZGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgZGF0ZS5zZXRIb3VycygwKTtcclxuICAgICAgICBkYXRlLnNldE1pbnV0ZXMoMCk7XHJcbiAgICAgICAgZGF0ZS5zZXRTZWNvbmRzKDApO1xyXG4gICAgICAgIGRhdGUuc2V0TWlsbGlzZWNvbmRzKDApO1xyXG4gICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPT09IGZvcm1hdC5wYXJ0cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIHllYXIgPSBkYXRlLmdldEZ1bGxZZWFyKCksIGRheSA9IGRhdGUuZ2V0RGF0ZSgpLCBtb250aCA9IGRhdGUuZ2V0TW9udGgoKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaT0wLCBjbnQgPSBmb3JtYXQucGFydHMubGVuZ3RoOyBpIDwgY250OyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhbCA9IHBhcnNlSW50KHBhcnRzW2ldLCAxMCl8fDE7XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2goZm9ybWF0LnBhcnRzW2ldKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZGQnOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2QnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXkgPSB2YWw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGUuc2V0RGF0ZSh2YWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdtbSc6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vbnRoID0gdmFsIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZS5zZXRNb250aCh2YWwgLSAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAneXknOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ZWFyID0gMjAwMCArIHZhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZS5zZXRGdWxsWWVhcigyMDAwICsgdmFsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAneXl5eSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHllYXIgPSB2YWw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGUuc2V0RnVsbFllYXIodmFsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZGF0ZSA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLCBkYXksIDAgLDAgLDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0ZTtcclxuICAgIH0sXHJcbiAgICBmb3JtYXREYXRlOiBmdW5jdGlvbihkYXRlLCBmb3JtYXQpe1xyXG4gICAgICAgIHZhciB2YWwgPSB7XHJcbiAgICAgICAgICAgIGQ6IGRhdGUuZ2V0RGF0ZSgpLFxyXG4gICAgICAgICAgICBtOiBkYXRlLmdldE1vbnRoKCkgKyAxLFxyXG4gICAgICAgICAgICB5eTogZGF0ZS5nZXRGdWxsWWVhcigpLnRvU3RyaW5nKCkuc3Vic3RyaW5nKDIpLFxyXG4gICAgICAgICAgICB5eXl5OiBkYXRlLmdldEZ1bGxZZWFyKClcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhbC5kZCA9ICh2YWwuZCA8IDEwID8gJzAnIDogJycpICsgdmFsLmQ7XHJcbiAgICAgICAgdmFsLm1tID0gKHZhbC5tIDwgMTAgPyAnMCcgOiAnJykgKyB2YWwubTtcclxuICAgICAgICBkYXRlID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaT0wLCBjbnQgPSBmb3JtYXQucGFydHMubGVuZ3RoOyBpIDwgY250OyBpKyspIHtcclxuICAgICAgICAgICAgZGF0ZS5wdXNoKHZhbFtmb3JtYXQucGFydHNbaV1dKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGRhdGUuam9pbihmb3JtYXQuc2VwYXJhdG9yKTtcclxuICAgIH0sXHJcbiAgICBoZWFkVGVtcGxhdGU6ICc8dGhlYWQ+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzx0cj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0aCBjbGFzcz1cInByZXZcIj4mbHNhcXVvOzwvdGg+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGggY29sc3Bhbj1cIjVcIiBjbGFzcz1cInN3aXRjaFwiPjwvdGg+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGggY2xhc3M9XCJuZXh0XCI+JnJzYXF1bzs8L3RoPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L3RyPicrXHJcbiAgICAgICAgICAgICAgICAgICAgJzwvdGhlYWQ+JyxcclxuICAgIGNvbnRUZW1wbGF0ZTogJzx0Ym9keT48dHI+PHRkIGNvbHNwYW49XCI3XCI+PC90ZD48L3RyPjwvdGJvZHk+J1xyXG59O1xyXG5EUEdsb2JhbC50ZW1wbGF0ZSA9ICc8ZGl2IGNsYXNzPVwiJyArIGNsYXNzZXMuY29tcG9uZW50ICsgJ1wiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiJyArIGNsYXNzZXMuZGF5cyArICdcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0YWJsZSBjbGFzcz1cIiB0YWJsZS1jb25kZW5zZWRcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERQR2xvYmFsLmhlYWRUZW1wbGF0ZStcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRib2R5PjwvdGJvZHk+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L3RhYmxlPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cIicgKyBjbGFzc2VzLm1vbnRocyArICdcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0YWJsZSBjbGFzcz1cInRhYmxlLWNvbmRlbnNlZFwiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRFBHbG9iYWwuaGVhZFRlbXBsYXRlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERQR2xvYmFsLmNvbnRUZW1wbGF0ZStcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L3RhYmxlPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cIicgKyBjbGFzc2VzLnllYXJzICsgJ1wiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRhYmxlIGNsYXNzPVwidGFibGUtY29uZGVuc2VkXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEUEdsb2JhbC5oZWFkVGVtcGxhdGUrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRFBHbG9iYWwuY29udFRlbXBsYXRlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvdGFibGU+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicrXHJcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2Pic7XHJcbkRQR2xvYmFsLm1vZGVzU2V0ID0ge1xyXG4gICAgJ2RhdGUnOiBEUEdsb2JhbC5tb2Rlc1szXSxcclxuICAgICdtb250aCc6IERQR2xvYmFsLm1vZGVzWzBdLFxyXG4gICAgJ3llYXInOiBEUEdsb2JhbC5tb2Rlc1sxXSxcclxuICAgICdkZWNhZGUnOiBEUEdsb2JhbC5tb2Rlc1syXVxyXG59O1xyXG5cclxuLyoqIFB1YmxpYyBBUEkgKiovXHJcbmV4cG9ydHMuRGF0ZVBpY2tlciA9IERhdGVQaWNrZXI7XHJcbmV4cG9ydHMuZGVmYXVsdHMgPSBEUEdsb2JhbDtcclxuZXhwb3J0cy51dGlscyA9IERQR2xvYmFsO1xyXG4iLCIvKipcclxuICAgIFNtYXJ0TmF2QmFyIGNvbXBvbmVudC5cclxuICAgIFJlcXVpcmVzIGl0cyBDU1MgY291bnRlcnBhcnQuXHJcbiAgICBcclxuICAgIENyZWF0ZWQgYmFzZWQgb24gdGhlIHByb2plY3Q6XHJcbiAgICBcclxuICAgIFByb2plY3QtVHlzb25cclxuICAgIFdlYnNpdGU6IGh0dHBzOi8vZ2l0aHViLmNvbS9jMnByb2RzL1Byb2plY3QtVHlzb25cclxuICAgIEF1dGhvcjogYzJwcm9kc1xyXG4gICAgTGljZW5zZTpcclxuICAgIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxyXG4gICAgQ29weXJpZ2h0IChjKSAyMDEzIGMycHJvZHNcclxuICAgIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2ZcclxuICAgIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW5cclxuICAgIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG9cclxuICAgIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mXHJcbiAgICB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sXHJcbiAgICBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcclxuICAgIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxyXG4gICAgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cclxuICAgIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcclxuICAgIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTXHJcbiAgICBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1JcclxuICAgIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUlxyXG4gICAgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU5cclxuICAgIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuLyoqXHJcbiAgICBJbnRlcm5hbCB1dGlsaXR5LlxyXG4gICAgUmVtb3ZlcyBhbGwgY2hpbGRyZW4gZm9yIGEgRE9NIG5vZGVcclxuKiovXHJcbnZhciBjbGVhck5vZGUgPSBmdW5jdGlvbiAobm9kZSkge1xyXG4gICAgd2hpbGUobm9kZS5maXJzdENoaWxkKXtcclxuICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG5vZGUuZmlyc3RDaGlsZCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICAgIENhbGN1bGF0ZXMgYW5kIGFwcGxpZXMgdGhlIGJlc3Qgc2l6aW5nIGFuZCBkaXN0cmlidXRpb24gZm9yIHRoZSB0aXRsZVxyXG4gICAgZGVwZW5kaW5nIG9uIGNvbnRlbnQgYW5kIGJ1dHRvbnMuXHJcbiAgICBQYXNzIGluIHRoZSB0aXRsZSBlbGVtZW50LCBidXR0b25zIG11c3QgYmUgZm91bmQgYXMgc2libGluZ3Mgb2YgaXQuXHJcbioqL1xyXG52YXIgdGV4dGJveFJlc2l6ZSA9IGZ1bmN0aW9uIHRleHRib3hSZXNpemUoZWwpIHtcclxuICAgIC8qIGpzaGludCBtYXhzdGF0ZW1lbnRzOiAyOCwgbWF4Y29tcGxleGl0eToxMSAqL1xyXG4gICAgXHJcbiAgICB2YXIgbGVmdGJ0biA9IGVsLnBhcmVudE5vZGUucXVlcnlTZWxlY3RvckFsbCgnLlNtYXJ0TmF2QmFyLWVkZ2UubGVmdCcpWzBdO1xyXG4gICAgdmFyIHJpZ2h0YnRuID0gZWwucGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yQWxsKCcuU21hcnROYXZCYXItZWRnZS5yaWdodCcpWzBdO1xyXG4gICAgaWYgKHR5cGVvZiBsZWZ0YnRuID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIGxlZnRidG4gPSB7XHJcbiAgICAgICAgICAgIG9mZnNldFdpZHRoOiAwLFxyXG4gICAgICAgICAgICBjbGFzc05hbWU6ICcnXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgcmlnaHRidG4gPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgcmlnaHRidG4gPSB7XHJcbiAgICAgICAgICAgIG9mZnNldFdpZHRoOiAwLFxyXG4gICAgICAgICAgICBjbGFzc05hbWU6ICcnXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIG1hcmdpbiA9IE1hdGgubWF4KGxlZnRidG4ub2Zmc2V0V2lkdGgsIHJpZ2h0YnRuLm9mZnNldFdpZHRoKTtcclxuICAgIGVsLnN0eWxlLm1hcmdpbkxlZnQgPSBtYXJnaW4gKyAncHgnO1xyXG4gICAgZWwuc3R5bGUubWFyZ2luUmlnaHQgPSBtYXJnaW4gKyAncHgnO1xyXG4gICAgdmFyIHRvb0xvbmcgPSAoZWwub2Zmc2V0V2lkdGggPCBlbC5zY3JvbGxXaWR0aCkgPyB0cnVlIDogZmFsc2U7XHJcbiAgICBpZiAodG9vTG9uZykge1xyXG4gICAgICAgIGlmIChsZWZ0YnRuLm9mZnNldFdpZHRoIDwgcmlnaHRidG4ub2Zmc2V0V2lkdGgpIHtcclxuICAgICAgICAgICAgZWwuc3R5bGUubWFyZ2luTGVmdCA9IGxlZnRidG4ub2Zmc2V0V2lkdGggKyAncHgnO1xyXG4gICAgICAgICAgICBlbC5zdHlsZS50ZXh0QWxpZ24gPSAncmlnaHQnO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGVsLnN0eWxlLm1hcmdpblJpZ2h0ID0gcmlnaHRidG4ub2Zmc2V0V2lkdGggKyAncHgnO1xyXG4gICAgICAgICAgICBlbC5zdHlsZS50ZXh0QWxpZ24gPSAnbGVmdCc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRvb0xvbmcgPSAoZWwub2Zmc2V0V2lkdGg8ZWwuc2Nyb2xsV2lkdGgpID8gdHJ1ZSA6IGZhbHNlO1xyXG4gICAgICAgIGlmICh0b29Mb25nKSB7XHJcbiAgICAgICAgICAgIGlmIChuZXcgUmVnRXhwKCdhcnJvdycpLnRlc3QobGVmdGJ0bi5jbGFzc05hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhck5vZGUobGVmdGJ0bi5jaGlsZE5vZGVzWzFdKTtcclxuICAgICAgICAgICAgICAgIGVsLnN0eWxlLm1hcmdpbkxlZnQgPSAnMjZweCc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG5ldyBSZWdFeHAoJ2Fycm93JykudGVzdChyaWdodGJ0bi5jbGFzc05hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhck5vZGUocmlnaHRidG4uY2hpbGROb2Rlc1sxXSk7XHJcbiAgICAgICAgICAgICAgICBlbC5zdHlsZS5tYXJnaW5SaWdodCA9ICcyNnB4JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydHMudGV4dGJveFJlc2l6ZSA9IHRleHRib3hSZXNpemU7XHJcblxyXG4vKipcclxuICAgIFNtYXJ0TmF2QmFyIGNsYXNzLCBpbnN0YW50aWF0ZSB3aXRoIGEgRE9NIGVsZW1lbnRcclxuICAgIHJlcHJlc2VudGluZyBhIG5hdmJhci5cclxuICAgIEFQSTpcclxuICAgIC0gcmVmcmVzaDogdXBkYXRlcyB0aGUgY29udHJvbCB0YWtpbmcgY2FyZSBvZiB0aGUgbmVlZGVkXHJcbiAgICAgICAgd2lkdGggZm9yIHRpdGxlIGFuZCBidXR0b25zXHJcbioqL1xyXG52YXIgU21hcnROYXZCYXIgPSBmdW5jdGlvbiBTbWFydE5hdkJhcihlbCkge1xyXG4gICAgdGhpcy5lbCA9IGVsO1xyXG4gICAgXHJcbiAgICB0aGlzLnJlZnJlc2ggPSBmdW5jdGlvbiByZWZyZXNoKCkge1xyXG4gICAgICAgIHZhciBoID0gJChlbCkuY2hpbGRyZW4oJ2gxJykuZ2V0KDApO1xyXG4gICAgICAgIGlmIChoKVxyXG4gICAgICAgICAgICB0ZXh0Ym94UmVzaXplKGgpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnJlZnJlc2goKTsgXHJcbn07XHJcblxyXG5leHBvcnRzLlNtYXJ0TmF2QmFyID0gU21hcnROYXZCYXI7XHJcblxyXG4vKipcclxuICAgIEdldCBpbnN0YW5jZXMgZm9yIGFsbCB0aGUgU21hcnROYXZCYXIgZWxlbWVudHMgaW4gdGhlIERPTVxyXG4qKi9cclxuZXhwb3J0cy5nZXRBbGwgPSBmdW5jdGlvbiBnZXRBbGwoKSB7XHJcbiAgICB2YXIgYWxsID0gJCgnLlNtYXJ0TmF2QmFyJyk7XHJcbiAgICByZXR1cm4gJC5tYXAoYWxsLCBmdW5jdGlvbihpdGVtKSB7IHJldHVybiBuZXcgU21hcnROYXZCYXIoaXRlbSk7IH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBSZWZyZXNoIGFsbCBTbWFydE5hdkJhciBmb3VuZCBpbiB0aGUgZG9jdW1lbnQuXHJcbioqL1xyXG5leHBvcnRzLnJlZnJlc2hBbGwgPSBmdW5jdGlvbiByZWZyZXNoQWxsKCkge1xyXG4gICAgJCgnLlNtYXJ0TmF2QmFyID4gaDEnKS5lYWNoKGZ1bmN0aW9uKCkgeyB0ZXh0Ym94UmVzaXplKHRoaXMpOyB9KTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBDdXN0b20gTG9jb25vbWljcyAnbG9jYWxlJyBzdHlsZXMgZm9yIGRhdGUvdGltZXMuXHJcbiAgICBJdHMgYSBiaXQgbW9yZSAnY29vbCcgcmVuZGVyaW5nIGRhdGVzIDstKVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG4vLyBTaW5jZSB0aGUgdGFzayBvZiBkZWZpbmUgYSBsb2NhbGUgY2hhbmdlc1xyXG4vLyB0aGUgY3VycmVudCBnbG9iYWwgbG9jYWxlLCB3ZSBzYXZlIGEgcmVmZXJlbmNlXHJcbi8vIGFuZCByZXN0b3JlIGl0IGxhdGVyIHNvIG5vdGhpbmcgY2hhbmdlZC5cclxudmFyIGN1cnJlbnQgPSBtb21lbnQubG9jYWxlKCk7XHJcblxyXG5tb21lbnQubG9jYWxlKCdlbi1VUy1MQycsIHtcclxuICAgIG1lcmlkaWVtUGFyc2UgOiAvW2FwXVxcLj9cXC4/L2ksXHJcbiAgICBtZXJpZGllbSA6IGZ1bmN0aW9uIChob3VycywgbWludXRlcywgaXNMb3dlcikge1xyXG4gICAgICAgIGlmIChob3VycyA+IDExKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpc0xvd2VyID8gJ3AnIDogJ1AnO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpc0xvd2VyID8gJ2EnIDogJ0EnO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBjYWxlbmRhciA6IHtcclxuICAgICAgICBsYXN0RGF5IDogJ1tZZXN0ZXJkYXldJyxcclxuICAgICAgICBzYW1lRGF5IDogJ1tUb2RheV0nLFxyXG4gICAgICAgIG5leHREYXkgOiAnW1RvbW9ycm93XScsXHJcbiAgICAgICAgbGFzdFdlZWsgOiAnW2xhc3RdIGRkZGQnLFxyXG4gICAgICAgIG5leHRXZWVrIDogJ2RkZGQnLFxyXG4gICAgICAgIHNhbWVFbHNlIDogJ00vRCdcclxuICAgIH0sXHJcbiAgICBsb25nRGF0ZUZvcm1hdCA6IHtcclxuICAgICAgICBMVDogJ2g6bW1hJyxcclxuICAgICAgICBMVFM6ICdoOm1tOnNzYScsXHJcbiAgICAgICAgTDogJ01NL0REL1lZWVknLFxyXG4gICAgICAgIGw6ICdNL0QvWVlZWScsXHJcbiAgICAgICAgTEw6ICdNTU1NIERvIFlZWVknLFxyXG4gICAgICAgIGxsOiAnTU1NIEQgWVlZWScsXHJcbiAgICAgICAgTExMOiAnTU1NTSBEbyBZWVlZIExUJyxcclxuICAgICAgICBsbGw6ICdNTU0gRCBZWVlZIExUJyxcclxuICAgICAgICBMTExMOiAnZGRkZCwgTU1NTSBEbyBZWVlZIExUJyxcclxuICAgICAgICBsbGxsOiAnZGRkLCBNTU0gRCBZWVlZIExUJ1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8vIFJlc3RvcmUgbG9jYWxlXHJcbm1vbWVudC5sb2NhbGUoY3VycmVudCk7XHJcbiIsIi8qKiBBZGRyZXNzIG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBBZGRyZXNzKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGFkZHJlc3NJRDogMCxcclxuICAgICAgICBhZGRyZXNzTmFtZTogJycsXHJcbiAgICAgICAgam9iVGl0bGVJRDogMCxcclxuICAgICAgICB1c2VySUQ6IDAsXHJcbiAgICAgICAgYWRkcmVzc0xpbmUxOiBudWxsLFxyXG4gICAgICAgIGFkZHJlc3NMaW5lMjogbnVsbCxcclxuICAgICAgICBwb3N0YWxDb2RlOiBudWxsLFxyXG4gICAgICAgIGNpdHk6IG51bGwsIC8vIEF1dG9maWxsZWQgYnkgc2VydmVyXHJcbiAgICAgICAgc3RhdGVQcm92aW5jZUNvZGU6IG51bGwsIC8vIEF1dG9maWxsZWQgYnkgc2VydmVyXHJcbiAgICAgICAgc3RhdGVQcm92aWNlTmFtZTogbnVsbCwgLy8gQXV0b2ZpbGxlZCBieSBzZXJ2ZXJcclxuICAgICAgICBjb3VudHJ5Q29kZTogbnVsbCwgLy8gSVNPIEFscGhhLTIgY29kZSwgRXguOiAnVVMnXHJcbiAgICAgICAgbGF0aXR1ZGU6IG51bGwsXHJcbiAgICAgICAgbG9uZ2l0dWRlOiBudWxsLFxyXG4gICAgICAgIHNwZWNpYWxJbnN0cnVjdGlvbnM6IG51bGwsXHJcbiAgICAgICAgaXNTZXJ2aWNlQXJlYTogZmFsc2UsXHJcbiAgICAgICAgaXNTZXJ2aWNlTG9jYXRpb246IGZhbHNlLFxyXG4gICAgICAgIHNlcnZpY2VSYWRpdXM6IDAsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsIC8vIEF1dG9maWxsZWQgYnkgc2VydmVyXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGwsIC8vIEF1dG9maWxsZWQgYnkgc2VydmVyXHJcbiAgICAgICAga2luZDogJycgLy8gQXV0b2ZpbGxlZCBieSBzZXJ2ZXJcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2luZ2xlTGluZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBsaXN0ID0gW1xyXG4gICAgICAgICAgICB0aGlzLmFkZHJlc3NMaW5lMSgpLFxyXG4gICAgICAgICAgICB0aGlzLmNpdHkoKSxcclxuICAgICAgICAgICAgdGhpcy5wb3N0YWxDb2RlKCksXHJcbiAgICAgICAgICAgIHRoaXMuc3RhdGVQcm92aW5jZUNvZGUoKVxyXG4gICAgICAgIF07XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGxpc3QuZmlsdGVyKGZ1bmN0aW9uKHYpIHsgcmV0dXJuICEhdjsgfSkuam9pbignLCAnKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICAvLyBUT0RPOiBuZWVkZWQ/IGwxMG4/IG11c3QgYmUgcHJvdmlkZWQgYnkgc2VydmVyIHNpZGU/XHJcbiAgICB2YXIgY291bnRyaWVzID0ge1xyXG4gICAgICAgICdVUyc6ICdVbml0ZWQgU3RhdGVzJyxcclxuICAgICAgICAnRVMnOiAnU3BhaW4nXHJcbiAgICB9O1xyXG4gICAgdGhpcy5jb3VudHJ5TmFtZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBjb3VudHJpZXNbdGhpcy5jb3VudHJ5Q29kZSgpXSB8fCAndW5rbm93JztcclxuICAgIH0sIHRoaXMpO1xyXG5cclxuICAgIC8vIFVzZWZ1bCBHUFMgb2JqZWN0IHdpdGggdGhlIGZvcm1hdCB1c2VkIGJ5IEdvb2dsZSBNYXBzXHJcbiAgICB0aGlzLmxhdGxuZyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGxhdDogdGhpcy5sYXRpdHVkZSgpLFxyXG4gICAgICAgICAgICBsbmc6IHRoaXMubG9uZ2l0dWRlKClcclxuICAgICAgICB9O1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQWRkcmVzcztcclxuIiwiLyoqIEFwcG9pbnRtZW50IG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBDbGllbnQgPSByZXF1aXJlKCcuL0NsaWVudCcpLFxyXG4gICAgTG9jYXRpb24gPSByZXF1aXJlKCcuL0xvY2F0aW9uJyksXHJcbiAgICBTZXJ2aWNlID0gcmVxdWlyZSgnLi9TZXJ2aWNlJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuICAgXHJcbmZ1bmN0aW9uIEFwcG9pbnRtZW50KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGlkOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN0YXJ0VGltZTogbnVsbCxcclxuICAgICAgICBlbmRUaW1lOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEV2ZW50IHN1bW1hcnk6XHJcbiAgICAgICAgc3VtbWFyeTogJ05ldyBib29raW5nJyxcclxuICAgICAgICBcclxuICAgICAgICBzdWJ0b3RhbFByaWNlOiAwLFxyXG4gICAgICAgIGZlZVByaWNlOiAwLFxyXG4gICAgICAgIHBmZWVQcmljZTogMCxcclxuICAgICAgICB0b3RhbFByaWNlOiAwLFxyXG4gICAgICAgIHB0b3RhbFByaWNlOiAwLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHByZU5vdGVzVG9DbGllbnQ6IG51bGwsXHJcbiAgICAgICAgcG9zdE5vdGVzVG9DbGllbnQ6IG51bGwsXHJcbiAgICAgICAgcHJlTm90ZXNUb1NlbGY6IG51bGwsXHJcbiAgICAgICAgcG9zdE5vdGVzVG9TZWxmOiBudWxsXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB2YWx1ZXMgPSB2YWx1ZXMgfHwge307XHJcblxyXG4gICAgdGhpcy5jbGllbnQgPSBrby5vYnNlcnZhYmxlKHZhbHVlcy5jbGllbnQgPyBuZXcgQ2xpZW50KHZhbHVlcy5jbGllbnQpIDogbnVsbCk7XHJcblxyXG4gICAgdGhpcy5sb2NhdGlvbiA9IGtvLm9ic2VydmFibGUobmV3IExvY2F0aW9uKHZhbHVlcy5sb2NhdGlvbikpO1xyXG4gICAgdGhpcy5sb2NhdGlvblN1bW1hcnkgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sb2NhdGlvbigpLnNpbmdsZUxpbmUoKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlcnZpY2VzID0ga28ub2JzZXJ2YWJsZUFycmF5KCh2YWx1ZXMuc2VydmljZXMgfHwgW10pLm1hcChmdW5jdGlvbihzZXJ2aWNlKSB7XHJcbiAgICAgICAgcmV0dXJuIChzZXJ2aWNlIGluc3RhbmNlb2YgU2VydmljZSkgPyBzZXJ2aWNlIDogbmV3IFNlcnZpY2Uoc2VydmljZSk7XHJcbiAgICB9KSk7XHJcbiAgICB0aGlzLnNlcnZpY2VzU3VtbWFyeSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNlcnZpY2VzKCkubWFwKGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNlcnZpY2UubmFtZSgpO1xyXG4gICAgICAgIH0pLmpvaW4oJywgJyk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgLy8gUHJpY2UgdXBkYXRlIG9uIHNlcnZpY2VzIGNoYW5nZXNcclxuICAgIC8vIFRPRE8gSXMgbm90IGNvbXBsZXRlIGZvciBwcm9kdWN0aW9uXHJcbiAgICB0aGlzLnNlcnZpY2VzLnN1YnNjcmliZShmdW5jdGlvbihzZXJ2aWNlcykge1xyXG4gICAgICAgIHRoaXMucHRvdGFsUHJpY2Uoc2VydmljZXMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xyXG4gICAgICAgICAgICByZXR1cm4gcHJldiArIGN1ci5wcmljZSgpO1xyXG4gICAgICAgIH0sIDApKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICBcclxuICAgIC8vIFNtYXJ0IHZpc3VhbGl6YXRpb24gb2YgZGF0ZSBhbmQgdGltZVxyXG4gICAgdGhpcy5kaXNwbGF5ZWREYXRlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBtb21lbnQodGhpcy5zdGFydFRpbWUoKSkubG9jYWxlKCdlbi1VUy1MQycpLmNhbGVuZGFyKCk7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNwbGF5ZWRTdGFydFRpbWUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzLnN0YXJ0VGltZSgpKS5sb2NhbGUoJ2VuLVVTLUxDJykuZm9ybWF0KCdMVCcpO1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzcGxheWVkRW5kVGltZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbW9tZW50KHRoaXMuZW5kVGltZSgpKS5sb2NhbGUoJ2VuLVVTLUxDJykuZm9ybWF0KCdMVCcpO1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzcGxheWVkVGltZVJhbmdlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLmRpc3BsYXllZFN0YXJ0VGltZSgpICsgJy0nICsgdGhpcy5kaXNwbGF5ZWRFbmRUaW1lKCk7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5pdFN0YXJ0ZWQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnN0YXJ0VGltZSgpICYmIG5ldyBEYXRlKCkgPj0gdGhpcy5zdGFydFRpbWUoKSk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5pdEVuZGVkID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5lbmRUaW1lKCkgJiYgbmV3IERhdGUoKSA+PSB0aGlzLmVuZFRpbWUoKSk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5pc05ldyA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKCF0aGlzLmlkKCkpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc3RhdGVIZWFkZXIgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHRleHQgPSAnJztcclxuICAgICAgICBpZiAoIXRoaXMuaXNOZXcoKSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5pdFN0YXJ0ZWQoKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXRFbmRlZCgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dCA9ICdDb21wbGV0ZWQ6JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQgPSAnTm93Oic7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ID0gJ1VwY29taW5nOic7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0ZXh0O1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXBwb2ludG1lbnQ7XHJcbiIsIi8qKiBCb29raW5nIG1vZGVsLlxyXG5cclxuICAgIERlc2NyaWJlcyBhIGJvb2tpbmcgd2l0aCByZWxhdGVkIEJvb2tpbmdSZXF1ZXN0IFxyXG4gICAgYW5kIFByaWNpbmdFc3RpbWF0ZSBvYmplY3RzLlxyXG4gKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIEJvb2tpbmcodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgYm9va2luZ0lEOiAwLFxyXG4gICAgICAgIGJvb2tpbmdSZXF1ZXN0SUQ6IDAsXHJcbiAgICAgICAgY29uZmlybWVkRGF0ZUlEOiBudWxsLFxyXG4gICAgICAgIHRvdGFsUHJpY2VQYWlkQnlDdXN0b21lcjogbnVsbCxcclxuICAgICAgICB0b3RhbFNlcnZpY2VGZWVzUGFpZEJ5Q3VzdG9tZXI6IG51bGwsXHJcbiAgICAgICAgdG90YWxQYWlkVG9GcmVlbGFuY2VyOiBudWxsLFxyXG4gICAgICAgIHRvdGFsU2VydmljZUZlZXNQYWlkQnlGcmVlbGFuY2VyOiBudWxsLFxyXG4gICAgICAgIGJvb2tpbmdTdGF0dXNJRDogbnVsbCxcclxuICAgICAgICBwcmljaW5nQWRqdXN0bWVudEFwcGxpZWQ6IGZhbHNlLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldmlld2VkQnlGcmVlbGFuY2VyOiBmYWxzZSxcclxuICAgICAgICByZXZpZXdlZEJ5Q3VzdG9tZXI6IGZhbHNlLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBudWxsLFxyXG4gICAgICAgIHVwZGF0ZWREYXRlOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGJvb2tpbmdSZXF1ZXN0OiBudWxsIC8vIEJvb2tpbmdSZXF1ZXN0XHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmJvb2tpbmdSZXF1ZXN0KG5ldyBCb29raW5nUmVxdWVzdCh2YWx1ZXMgJiYgdmFsdWVzLmJvb2tpbmdSZXF1ZXN0KSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQm9va2luZztcclxuXHJcbmZ1bmN0aW9uIEJvb2tpbmdSZXF1ZXN0KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGJvb2tpbmdSZXF1ZXN0SUQ6IDAsXHJcbiAgICAgICAgYm9va2luZ1R5cGVJRDogMCxcclxuICAgICAgICBjdXN0b21lclVzZXJJRDogMCxcclxuICAgICAgICBmcmVlbGFuY2VyVXNlcklEOiAwLFxyXG4gICAgICAgIGpvYlRpdGxlSUQ6IDAsXHJcbiAgICAgICAgcHJpY2luZ0VzdGltYXRlSUQ6IDAsXHJcbiAgICAgICAgYm9va2luZ1JlcXVlc3RTdGF0dXNJRDogMCxcclxuICAgICAgICBcclxuICAgICAgICBzcGVjaWFsUmVxdWVzdHM6IG51bGwsXHJcbiAgICAgICAgcHJlZmVycmVkRGF0ZUlEOiBudWxsLFxyXG4gICAgICAgIGFsdGVybmF0aXZlRGF0ZTFJRDogbnVsbCxcclxuICAgICAgICBhbHRlcm5hdGl2ZURhdGUySUQ6IG51bGwsXHJcbiAgICAgICAgYWRkcmVzc0lEOiBudWxsLFxyXG4gICAgICAgIGNhbmNlbGxhdGlvblBvbGljeUlEOiBudWxsLFxyXG4gICAgICAgIGluc3RhbnRCb29raW5nOiBmYWxzZSxcclxuICAgICAgICBcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBwcmljaW5nRXN0aW1hdGU6IG51bGwgLy8gUHJpY2luZ0VzdGltYXRlXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnByaWNpbmdFc3RpbWF0ZShuZXcgUHJpY2luZ0VzdGltYXRlKHZhbHVlcyAmJiB2YWx1ZXMucHJpY2luZ0VzdGltYXRlKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFByaWNpbmdFc3RpbWF0ZSh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBwcmljaW5nRXN0aW1hdGVJRDogMCxcclxuICAgICAgICBwcmljaW5nRXN0aW1hdGVSZXZpc2lvbjogMCxcclxuICAgICAgICBzZXJ2aWNlRHVyYXRpb25Ib3VyczogbnVsbCxcclxuICAgICAgICBmaXJzdFNlc3Npb25EdXJhdGlvbkhvdXJzOiBudWxsLFxyXG4gICAgICAgIHN1YnRvdGFsUHJpY2U6IG51bGwsXHJcbiAgICAgICAgZmVlUHJpY2U6IG51bGwsXHJcbiAgICAgICAgdG90YWxQcmljZTogbnVsbCxcclxuICAgICAgICBwRmVlUHJpY2U6IG51bGwsXHJcbiAgICAgICAgc3VidG90YWxSZWZ1bmRlZDogbnVsbCxcclxuICAgICAgICBmZWVSZWZ1bmRlZDogbnVsbCxcclxuICAgICAgICB0b3RhbFJlZnVuZGVkOiBudWxsLFxyXG4gICAgICAgIGRhdGVSZWZ1bmRlZDogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBkZXRhaWxzOiBbXVxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWVzLmRldGFpbHMpKSB7XHJcbiAgICAgICAgdGhpcy5kZXRhaWxzKHZhbHVlcy5kZXRhaWxzLm1hcChmdW5jdGlvbihkZXRhaWwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcmljaW5nRXN0aW1hdGVEZXRhaWwoZGV0YWlsKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFByaWNpbmdFc3RpbWF0ZURldGFpbCh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBmcmVlbGFuY2VyUHJpY2luZ0lEOiAwLFxyXG4gICAgICAgIGZyZWVsYW5jZXJQcmljaW5nRGF0YUlucHV0OiBudWxsLFxyXG4gICAgICAgIGN1c3RvbWVyUHJpY2luZ0RhdGFJbnB1dDogbnVsbCxcclxuICAgICAgICBob3VybHlQcmljZTogbnVsbCxcclxuICAgICAgICBzdWJ0b3RhbFByaWNlOiBudWxsLFxyXG4gICAgICAgIGZlZVByaWNlOiBudWxsLFxyXG4gICAgICAgIHRvdGFsUHJpY2U6IG51bGwsXHJcbiAgICAgICAgc2VydmljZUR1cmF0aW9uSG91cnM6IG51bGwsXHJcbiAgICAgICAgZmlyc3RTZXNzaW9uRHVyYXRpb25Ib3VyczogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG4iLCIvKiogQm9va2luZ1N1bW1hcnkgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG4gICAgXHJcbmZ1bmN0aW9uIEJvb2tpbmdTdW1tYXJ5KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHF1YW50aXR5OiAwLFxyXG4gICAgICAgIGNvbmNlcHQ6ICcnLFxyXG4gICAgICAgIHRpbWU6IG51bGwsXHJcbiAgICAgICAgdGltZUZvcm1hdDogJyBbQF0gaDptbWEnXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG5cclxuICAgIHRoaXMucGhyYXNlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdmFyIHQgPSB0aGlzLnRpbWVGb3JtYXQoKSAmJiBcclxuICAgICAgICAgICAgdGhpcy50aW1lKCkgJiYgXHJcbiAgICAgICAgICAgIG1vbWVudCh0aGlzLnRpbWUoKSkuZm9ybWF0KHRoaXMudGltZUZvcm1hdCgpKSB8fFxyXG4gICAgICAgICAgICAnJzsgICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbmNlcHQoKSArIHQ7XHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLnVybCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgdXJsID0gdGhpcy50aW1lKCkgJiZcclxuICAgICAgICAgICAgJy9jYWxlbmRhci8nICsgdGhpcy50aW1lKCkudG9JU09TdHJpbmcoKTtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdXJsO1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQm9va2luZ1N1bW1hcnk7XHJcbiIsIi8qKlxyXG4gICAgRXZlbnQgbW9kZWxcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbi8qIEV4YW1wbGUgSlNPTiAocmV0dXJuZWQgYnkgdGhlIFJFU1QgQVBJKTpcclxue1xyXG4gIFwiRXZlbnRJRFwiOiAzNTMsXHJcbiAgXCJVc2VySURcIjogMTQxLFxyXG4gIFwiRXZlbnRUeXBlSURcIjogMyxcclxuICBcIlN1bW1hcnlcIjogXCJIb3VzZWtlZXBlciBzZXJ2aWNlcyBmb3IgSm9obiBELlwiLFxyXG4gIFwiQXZhaWxhYmlsaXR5VHlwZUlEXCI6IDMsXHJcbiAgXCJTdGFydFRpbWVcIjogXCIyMDE0LTAzLTI1VDA4OjAwOjAwWlwiLFxyXG4gIFwiRW5kVGltZVwiOiBcIjIwMTQtMDMtMjVUMTg6MDA6MDBaXCIsXHJcbiAgXCJLaW5kXCI6IDAsXHJcbiAgXCJJc0FsbERheVwiOiBmYWxzZSxcclxuICBcIlRpbWVab25lXCI6IFwiMDE6MDA6MDBcIixcclxuICBcIkxvY2F0aW9uXCI6IFwibnVsbFwiLFxyXG4gIFwiVXBkYXRlZERhdGVcIjogXCIyMDE0LTEwLTMwVDE1OjQ0OjQ5LjY1M1wiLFxyXG4gIFwiQ3JlYXRlZERhdGVcIjogbnVsbCxcclxuICBcIkRlc2NyaXB0aW9uXCI6IFwidGVzdCBkZXNjcmlwdGlvbiBvZiBhIFJFU1QgZXZlbnRcIixcclxuICBcIlJlY3VycmVuY2VSdWxlXCI6IHtcclxuICAgIFwiRnJlcXVlbmN5VHlwZUlEXCI6IDUwMixcclxuICAgIFwiSW50ZXJ2YWxcIjogMSxcclxuICAgIFwiVW50aWxcIjogXCIyMDE0LTA3LTAxVDAwOjAwOjAwXCIsXHJcbiAgICBcIkNvdW50XCI6IG51bGwsXHJcbiAgICBcIkVuZGluZ1wiOiBcImRhdGVcIixcclxuICAgIFwiU2VsZWN0ZWRXZWVrRGF5c1wiOiBbXHJcbiAgICAgIDEsXHJcbiAgICBdLFxyXG4gICAgXCJNb250aGx5V2Vla0RheVwiOiBmYWxzZSxcclxuICAgIFwiSW5jb21wYXRpYmxlXCI6IGZhbHNlLFxyXG4gICAgXCJUb29NYW55XCI6IGZhbHNlXHJcbiAgfSxcclxuICBcIlJlY3VycmVuY2VPY2N1cnJlbmNlc1wiOiBudWxsLFxyXG4gIFwiUmVhZE9ubHlcIjogZmFsc2VcclxufSovXHJcblxyXG5mdW5jdGlvbiBSZWN1cnJlbmNlUnVsZSh2YWx1ZXMpIHtcclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGZyZXF1ZW5jeVR5cGVJRDogMCxcclxuICAgICAgICBpbnRlcnZhbDogMSwgLy86SW50ZWdlclxyXG4gICAgICAgIHVudGlsOiBudWxsLCAvLzpEYXRlXHJcbiAgICAgICAgY291bnQ6IG51bGwsIC8vOkludGVnZXJcclxuICAgICAgICBlbmRpbmc6IG51bGwsIC8vIDpzdHJpbmcgUG9zc2libGUgdmFsdWVzIGFsbG93ZWQ6ICduZXZlcicsICdkYXRlJywgJ29jdXJyZW5jZXMnXHJcbiAgICAgICAgc2VsZWN0ZWRXZWVrRGF5czogW10sIC8vIDppbnRlZ2VyW10gMDpTdW5kYXlcclxuICAgICAgICBtb250aGx5V2Vla0RheTogZmFsc2UsXHJcbiAgICAgICAgaW5jb21wYXRpYmxlOiBmYWxzZSxcclxuICAgICAgICB0b29NYW55OiBmYWxzZVxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gUmVjdXJyZW5jZU9jY3VycmVuY2UodmFsdWVzKSB7XHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBzdGFydFRpbWU6IG51bGwsIC8vOkRhdGVcclxuICAgICAgICBlbmRUaW1lOiBudWxsIC8vOkRhdGVcclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG4gICBcclxuZnVuY3Rpb24gQ2FsZW5kYXJFdmVudCh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgY2FsZW5kYXJFdmVudElEOiAwLFxyXG4gICAgICAgIHVzZXJJRDogMCxcclxuICAgICAgICBldmVudFR5cGVJRDogMyxcclxuICAgICAgICBzdW1tYXJ5OiAnJyxcclxuICAgICAgICBhdmFpbGFiaWxpdHlUeXBlSUQ6IDAsXHJcbiAgICAgICAgc3RhcnRUaW1lOiBudWxsLFxyXG4gICAgICAgIGVuZFRpbWU6IG51bGwsXHJcbiAgICAgICAga2luZDogMCxcclxuICAgICAgICBpc0FsbERheTogZmFsc2UsXHJcbiAgICAgICAgdGltZVpvbmU6ICdaJyxcclxuICAgICAgICBsb2NhdGlvbjogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJycsXHJcbiAgICAgICAgcmVhZE9ubHk6IGZhbHNlXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG5cclxuICAgIHRoaXMucmVjdXJyZW5jZVJ1bGUgPSBrby5vYnNlcnZhYmxlKFxyXG4gICAgICAgIHZhbHVlcyAmJiBcclxuICAgICAgICB2YWx1ZXMucmVjdXJyZW5jZVJ1bGUgJiYgXHJcbiAgICAgICAgbmV3IFJlY3VycmVuY2VSdWxlKHZhbHVlcy5yZWN1cnJlbmNlUnVsZSlcclxuICAgICk7XHJcbiAgICB0aGlzLnJlY3VycmVuY2VPY2N1cnJlbmNlcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7IC8vOlJlY3VycmVuY2VPY2N1cnJlbmNlW11cclxuICAgIGlmICh2YWx1ZXMgJiYgdmFsdWVzLnJlY3VycmVuY2VPY2N1cnJlbmNlcykge1xyXG4gICAgICAgIHZhbHVlcy5yZWN1cnJlbmNlT2NjdXJyZW5jZXMuZm9yRWFjaChmdW5jdGlvbihvY2N1cnJlbmNlKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLlJlY3VycmVuY2VPY2N1cnJlbmNlcy5wdXNoKG5ldyBSZWN1cnJlbmNlT2NjdXJyZW5jZShvY2N1cnJlbmNlKSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ2FsZW5kYXJFdmVudDtcclxuXHJcbkNhbGVuZGFyRXZlbnQuUmVjdXJyZW5jZVJ1bGUgPSBSZWN1cnJlbmNlUnVsZTtcclxuQ2FsZW5kYXJFdmVudC5SZWN1cnJlbmNlT2NjdXJyZW5jZSA9IFJlY3VycmVuY2VPY2N1cnJlbmNlOyIsIi8qKiBDYWxlbmRhclNsb3QgbW9kZWwuXHJcblxyXG4gICAgRGVzY3JpYmVzIGEgdGltZSBzbG90IGluIHRoZSBjYWxlbmRhciwgZm9yIGEgY29uc2VjdXRpdmVcclxuICAgIGV2ZW50LCBhcHBvaW50bWVudCBvciBmcmVlIHRpbWUuXHJcbiAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgQ2xpZW50ID0gcmVxdWlyZSgnLi9DbGllbnQnKTtcclxuXHJcbmZ1bmN0aW9uIENhbGVuZGFyU2xvdCh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBzdGFydFRpbWU6IG51bGwsXHJcbiAgICAgICAgZW5kVGltZTogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBjbGFzc05hbWVzOiAnJ1xyXG5cclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ2FsZW5kYXJTbG90O1xyXG4iLCIvKipcclxuICAgIENhbGVuZGFyU3luY2luZyBtb2RlbC5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBDYWxlbmRhclN5bmNpbmcodmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBpY2FsRXhwb3J0VXJsOiAnJyxcclxuICAgICAgICBpY2FsSW1wb3J0VXJsOiAnJ1xyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDYWxlbmRhclN5bmNpbmc7XHJcbiIsIi8qKiBDbGllbnQgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIENsaWVudCh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgaWQ6IDAsXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnJyxcclxuICAgICAgICBsYXN0TmFtZTogJycsXHJcbiAgICAgICAgZW1haWw6ICcnLFxyXG4gICAgICAgIG1vYmlsZVBob25lOiBudWxsLFxyXG4gICAgICAgIGFsdGVybmF0ZVBob25lOiBudWxsLFxyXG4gICAgICAgIGJpcnRoTW9udGhEYXk6IG51bGwsXHJcbiAgICAgICAgYmlydGhNb250aDogbnVsbCxcclxuICAgICAgICBub3Rlc0Fib3V0Q2xpZW50OiBudWxsXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG5cclxuICAgIHRoaXMuZnVsbE5hbWUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLmZpcnN0TmFtZSgpICsgJyAnICsgdGhpcy5sYXN0TmFtZSgpKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmJpcnRoRGF5ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmJpcnRoTW9udGhEYXkoKSAmJlxyXG4gICAgICAgICAgICB0aGlzLmJpcnRoTW9udGgoKSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVE9ETyBpMTBuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJpcnRoTW9udGgoKSArICcvJyArIHRoaXMuYmlydGhNb250aERheSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMucGhvbmVOdW1iZXIgPSBrby5wdXJlQ29tcHV0ZWQoe1xyXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgbSA9IHRoaXMubW9iaWxlUGhvbmUoKSxcclxuICAgICAgICAgICAgICAgIGEgPSB0aGlzLmFsdGVybmF0ZVBob25lKCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbSA/IG0gOiBhO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgICAgLy8gVE9ET1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3duZXI6IHRoaXNcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLmNhblJlY2VpdmVTbXMgPSBrby5wdXJlQ29tcHV0ZWQoe1xyXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgbSA9IHRoaXMubW9iaWxlUGhvbmUoKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBtID8gdHJ1ZSA6IGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgICAgLy8gVE9ET1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3duZXI6IHRoaXNcclxuICAgIH0pO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENsaWVudDtcclxuIiwiLyoqIEdldE1vcmUgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIExpc3RWaWV3SXRlbSA9IHJlcXVpcmUoJy4vTGlzdFZpZXdJdGVtJyk7XHJcblxyXG5mdW5jdGlvbiBHZXRNb3JlKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgYXZhaWxhYmlsaXR5OiBmYWxzZSxcclxuICAgICAgICBwYXltZW50czogZmFsc2UsXHJcbiAgICAgICAgcHJvZmlsZTogZmFsc2UsXHJcbiAgICAgICAgY29vcDogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHZhciBhdmFpbGFibGVJdGVtcyA9IHtcclxuICAgICAgICBhdmFpbGFiaWxpdHk6IG5ldyBMaXN0Vmlld0l0ZW0oe1xyXG4gICAgICAgICAgICBjb250ZW50TGluZTE6ICdDb21wbGV0ZSB5b3VyIGF2YWlsYWJpbGl0eSB0byBjcmVhdGUgYSBjbGVhbmVyIGNhbGVuZGFyJyxcclxuICAgICAgICAgICAgbWFya2VySWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tY2FsZW5kYXInLFxyXG4gICAgICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0J1xyXG4gICAgICAgIH0pLFxyXG4gICAgICAgIHBheW1lbnRzOiBuZXcgTGlzdFZpZXdJdGVtKHtcclxuICAgICAgICAgICAgY29udGVudExpbmUxOiAnU3RhcnQgYWNjZXB0aW5nIHBheW1lbnRzIHRocm91Z2ggTG9jb25vbWljcycsXHJcbiAgICAgICAgICAgIG1hcmtlckljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXVzZCcsXHJcbiAgICAgICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tcmlnaHQnXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgcHJvZmlsZTogbmV3IExpc3RWaWV3SXRlbSh7XHJcbiAgICAgICAgICAgIGNvbnRlbnRMaW5lMTogJ0FjdGl2YXRlIHlvdXIgcHJvZmlsZSBpbiB0aGUgbWFya2V0cGxhY2UnLFxyXG4gICAgICAgICAgICBtYXJrZXJJY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi11c2VyJyxcclxuICAgICAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1yaWdodCdcclxuICAgICAgICB9KSxcclxuICAgICAgICBjb29wOiBuZXcgTGlzdFZpZXdJdGVtKHtcclxuICAgICAgICAgICAgY29udGVudExpbmUxOiAnTGVhcm4gbW9yZSBhYm91dCBvdXIgY29vcGVyYXRpdmUnLFxyXG4gICAgICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0J1xyXG4gICAgICAgIH0pXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXRlbXMgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGl0ZW1zID0gW107XHJcbiAgICAgICAgXHJcbiAgICAgICAgT2JqZWN0LmtleXMoYXZhaWxhYmxlSXRlbXMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAodGhpc1trZXldKCkpXHJcbiAgICAgICAgICAgICAgICBpdGVtcy5wdXNoKGF2YWlsYWJsZUl0ZW1zW2tleV0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBpdGVtcztcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEdldE1vcmU7XHJcbiIsIi8qKiBMaXN0Vmlld0l0ZW0gbW9kZWwuXHJcblxyXG4gICAgRGVzY3JpYmVzIGEgZ2VuZXJpYyBpdGVtIG9mIGFcclxuICAgIExpc3RWaWV3IGNvbXBvbmVudC5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbmZ1bmN0aW9uIExpc3RWaWV3SXRlbSh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBtYXJrZXJMaW5lMTogbnVsbCxcclxuICAgICAgICBtYXJrZXJMaW5lMjogbnVsbCxcclxuICAgICAgICBtYXJrZXJJY29uOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnRlbnRMaW5lMTogJycsXHJcbiAgICAgICAgY29udGVudExpbmUyOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICcnXHJcblxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMaXN0Vmlld0l0ZW07XHJcbiIsIi8qKiBMb2NhdGlvbiBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gTG9jYXRpb24odmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgbG9jYXRpb25JRDogMCxcclxuICAgICAgICBuYW1lOiAnJyxcclxuICAgICAgICBhZGRyZXNzTGluZTE6IG51bGwsXHJcbiAgICAgICAgYWRkcmVzc0xpbmUyOiBudWxsLFxyXG4gICAgICAgIGNpdHk6IG51bGwsXHJcbiAgICAgICAgc3RhdGVQcm92aW5jZUNvZGU6IG51bGwsXHJcbiAgICAgICAgc3RhdGVQcm92aWNlSUQ6IG51bGwsXHJcbiAgICAgICAgcG9zdGFsQ29kZTogbnVsbCxcclxuICAgICAgICBwb3N0YWxDb2RlSUQ6IG51bGwsXHJcbiAgICAgICAgY291bnRyeUlEOiBudWxsLFxyXG4gICAgICAgIGxhdGl0dWRlOiBudWxsLFxyXG4gICAgICAgIGxvbmdpdHVkZTogbnVsbCxcclxuICAgICAgICBzcGVjaWFsSW5zdHJ1Y3Rpb25zOiBudWxsLFxyXG4gICAgICAgIGlzU2VydmljZVJhZGl1czogZmFsc2UsXHJcbiAgICAgICAgaXNTZXJ2aWNlTG9jYXRpb246IGZhbHNlLFxyXG4gICAgICAgIHNlcnZpY2VSYWRpdXM6IDBcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2luZ2xlTGluZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBsaXN0ID0gW1xyXG4gICAgICAgICAgICB0aGlzLmFkZHJlc3NMaW5lMSgpLFxyXG4gICAgICAgICAgICB0aGlzLmNpdHkoKSxcclxuICAgICAgICAgICAgdGhpcy5wb3N0YWxDb2RlKCksXHJcbiAgICAgICAgICAgIHRoaXMuc3RhdGVQcm92aW5jZUNvZGUoKVxyXG4gICAgICAgIF07XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGxpc3QuZmlsdGVyKGZ1bmN0aW9uKHYpIHsgcmV0dXJuICEhdjsgfSkuam9pbignLCAnKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmNvdW50cnlOYW1lID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5jb3VudHJ5SUQoKSA9PT0gMSA/XHJcbiAgICAgICAgICAgICdVbml0ZWQgU3RhdGVzJyA6XHJcbiAgICAgICAgICAgIHRoaXMuY291bnRyeUlEKCkgPT09IDIgP1xyXG4gICAgICAgICAgICAnU3BhaW4nIDpcclxuICAgICAgICAgICAgJ3Vua25vdydcclxuICAgICAgICApO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuY291bnRyeUNvZGVBbHBoYTIgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmNvdW50cnlJRCgpID09PSAxID9cclxuICAgICAgICAgICAgJ1VTJyA6XHJcbiAgICAgICAgICAgIHRoaXMuY291bnRyeUlEKCkgPT09IDIgP1xyXG4gICAgICAgICAgICAnRVMnIDpcclxuICAgICAgICAgICAgJydcclxuICAgICAgICApO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubGF0bG5nID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgbGF0OiB0aGlzLmxhdGl0dWRlKCksXHJcbiAgICAgICAgICAgIGxuZzogdGhpcy5sb25naXR1ZGUoKVxyXG4gICAgICAgIH07XHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMb2NhdGlvbjtcclxuIiwiLyoqIE1haWxGb2xkZXIgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpLFxyXG4gICAgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xyXG5cclxuZnVuY3Rpb24gTWFpbEZvbGRlcih2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIG1lc3NhZ2VzOiBbXSxcclxuICAgICAgICB0b3BOdW1iZXI6IDEwXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnRvcCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbiB0b3AobnVtKSB7XHJcbiAgICAgICAgaWYgKG51bSkgdGhpcy50b3BOdW1iZXIobnVtKTtcclxuICAgICAgICByZXR1cm4gXy5maXJzdCh0aGlzLm1lc3NhZ2VzKCksIHRoaXMudG9wTnVtYmVyKCkpO1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWFpbEZvbGRlcjtcclxuIiwiLyoqIE1hcmtldHBsYWNlUHJvZmlsZSBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gTWFya2V0cGxhY2VQcm9maWxlKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICB1c2VySUQ6IDAsXHJcbiAgICAgICAgXHJcbiAgICAgICAgcHVibGljQmlvOiAnJyxcclxuICAgICAgICBmcmVlbGFuY2VyUHJvZmlsZVVybFNsdWc6ICcnLFxyXG4gICAgICAgIC8vIFRoaXMgaXMgYSBzZXJ2ZXItc2lkZSBjb21wdXRlZCB2YXJpYWJsZSAocmVhZC1vbmx5IGZvciB0aGUgdXNlcikgZm9yIGEgTG9jb25vbWljcyBhZGRyZXNzXHJcbiAgICAgICAgLy8gY3JlYXRlZCB1c2luZyB0aGUgZnJlZWxhbmNlclByb2ZpbGVVcmxTbHVnIGlmIGFueSBvciB0aGUgZmFsbGJhY2sgc3lzdGVtIFVSTC5cclxuICAgICAgICBmcmVlbGFuY2VyUHJvZmlsZVVybDogJycsXHJcbiAgICAgICAgLy8gU3BlY2lmeSBhbiBleHRlcm5hbCB3ZWJzaXRlIG9mIHRoZSBmcmVlbGFuY2VyLlxyXG4gICAgICAgIGZyZWVsYW5jZXJXZWJzaXRlVXJsOiAnJyxcclxuICAgICAgICAvLyBTZXJ2ZXItc2lkZSBnZW5lcmF0ZWQgY29kZSB0aGF0IGFsbG93cyB0byBpZGVudGlmaWNhdGUgc3BlY2lhbCBib29raW5nIHJlcXVlc3RzXHJcbiAgICAgICAgLy8gZnJvbSB0aGUgYm9vay1tZS1ub3cgYnV0dG9uLiBUaGUgc2VydmVyIGVuc3VyZXMgdGhhdCB0aGVyZSBpcyBldmVyIGEgdmFsdWUgb24gdGhpcyBmb3IgZnJlZWxhbmNlcnMuXHJcbiAgICAgICAgYm9va0NvZGU6ICcnLFxyXG5cclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNYXJrZXRwbGFjZVByb2ZpbGU7XHJcbiIsIi8qKiBNZXNzYWdlIG1vZGVsLlxyXG5cclxuICAgIERlc2NyaWJlcyBhIG1lc3NhZ2UgZnJvbSBhIE1haWxGb2xkZXIuXHJcbiAgICBBIG1lc3NhZ2UgY291bGQgYmUgb2YgZGlmZmVyZW50IHR5cGVzLFxyXG4gICAgYXMgaW5xdWlyaWVzLCBib29raW5ncywgYm9va2luZyByZXF1ZXN0cy5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuLy9UT0RPICAgVGhyZWFkID0gcmVxdWlyZSgnLi9UaHJlYWQnKTtcclxuXHJcbmZ1bmN0aW9uIE1lc3NhZ2UodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgaWQ6IDAsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJycsXHJcbiAgICAgICAgY29udGVudDogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBjbGFzc05hbWVzOiAnJ1xyXG5cclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIC8vIFNtYXJ0IHZpc3VhbGl6YXRpb24gb2YgZGF0ZSBhbmQgdGltZVxyXG4gICAgdGhpcy5kaXNwbGF5ZWREYXRlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBtb21lbnQodGhpcy5jcmVhdGVkRGF0ZSgpKS5sb2NhbGUoJ2VuLVVTLUxDJykuY2FsZW5kYXIoKTtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmRpc3BsYXllZFRpbWUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzLmNyZWF0ZWREYXRlKCkpLmxvY2FsZSgnZW4tVVMtTEMnKS5mb3JtYXQoJ0xUJyk7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNZXNzYWdlO1xyXG4iLCIvKipcclxuICAgIE1vZGVsIGNsYXNzIHRvIGhlbHAgYnVpbGQgbW9kZWxzLlxyXG5cclxuICAgIElzIG5vdCBleGFjdGx5IGFuICdPT1AgYmFzZScgY2xhc3MsIGJ1dCBwcm92aWRlc1xyXG4gICAgdXRpbGl0aWVzIHRvIG1vZGVscyBhbmQgYSBtb2RlbCBkZWZpbml0aW9uIG9iamVjdFxyXG4gICAgd2hlbiBleGVjdXRlZCBpbiB0aGVpciBjb25zdHJ1Y3RvcnMgYXM6XHJcbiAgICBcclxuICAgICcnJ1xyXG4gICAgZnVuY3Rpb24gTXlNb2RlbCgpIHtcclxuICAgICAgICBNb2RlbCh0aGlzKTtcclxuICAgICAgICAvLyBOb3csIHRoZXJlIGlzIGEgdGhpcy5tb2RlbCBwcm9wZXJ0eSB3aXRoXHJcbiAgICAgICAgLy8gYW4gaW5zdGFuY2Ugb2YgdGhlIE1vZGVsIGNsYXNzLCB3aXRoIFxyXG4gICAgICAgIC8vIHV0aWxpdGllcyBhbmQgbW9kZWwgc2V0dGluZ3MuXHJcbiAgICB9XHJcbiAgICAnJydcclxuICAgIFxyXG4gICAgVGhhdCBhdXRvIGNyZWF0aW9uIG9mICdtb2RlbCcgcHJvcGVydHkgY2FuIGJlIGF2b2lkZWRcclxuICAgIHdoZW4gdXNpbmcgdGhlIG9iamVjdCBpbnN0YW50aWF0aW9uIHN5bnRheCAoJ25ldycga2V5d29yZCk6XHJcbiAgICBcclxuICAgICcnJ1xyXG4gICAgdmFyIG1vZGVsID0gbmV3IE1vZGVsKG9iaik7XHJcbiAgICAvLyBUaGVyZSBpcyBubyBhICdvYmoubW9kZWwnIHByb3BlcnR5LCBjYW4gYmVcclxuICAgIC8vIGFzc2lnbmVkIHRvIHdoYXRldmVyIHByb3BlcnR5IG9yIG5vdGhpbmcuXHJcbiAgICAnJydcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxua28ubWFwcGluZyA9IHJlcXVpcmUoJ2tub2Nrb3V0Lm1hcHBpbmcnKTtcclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGNsb25lID0gZnVuY3Rpb24ob2JqKSB7IHJldHVybiAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqKTsgfTtcclxuXHJcbmZ1bmN0aW9uIE1vZGVsKG1vZGVsT2JqZWN0KSB7XHJcbiAgICBcclxuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBNb2RlbCkpIHtcclxuICAgICAgICAvLyBFeGVjdXRlZCBhcyBhIGZ1bmN0aW9uLCBpdCBtdXN0IGNyZWF0ZVxyXG4gICAgICAgIC8vIGEgTW9kZWwgaW5zdGFuY2VcclxuICAgICAgICB2YXIgbW9kZWwgPSBuZXcgTW9kZWwobW9kZWxPYmplY3QpO1xyXG4gICAgICAgIC8vIGFuZCByZWdpc3RlciBhdXRvbWF0aWNhbGx5IGFzIHBhcnRcclxuICAgICAgICAvLyBvZiB0aGUgbW9kZWxPYmplY3QgaW4gJ21vZGVsJyBwcm9wZXJ0eVxyXG4gICAgICAgIG1vZGVsT2JqZWN0Lm1vZGVsID0gbW9kZWw7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gUmV0dXJucyB0aGUgaW5zdGFuY2VcclxuICAgICAgICByZXR1cm4gbW9kZWw7XHJcbiAgICB9XHJcbiBcclxuICAgIC8vIEl0IGluY2x1ZGVzIGEgcmVmZXJlbmNlIHRvIHRoZSBvYmplY3RcclxuICAgIHRoaXMubW9kZWxPYmplY3QgPSBtb2RlbE9iamVjdDtcclxuICAgIC8vIEl0IG1haW50YWlucyBhIGxpc3Qgb2YgcHJvcGVydGllcyBhbmQgZmllbGRzXHJcbiAgICB0aGlzLnByb3BlcnRpZXNMaXN0ID0gW107XHJcbiAgICB0aGlzLmZpZWxkc0xpc3QgPSBbXTtcclxuICAgIC8vIEl0IGFsbG93IHNldHRpbmcgdGhlICdrby5tYXBwaW5nLmZyb21KUycgbWFwcGluZyBvcHRpb25zXHJcbiAgICAvLyB0byBjb250cm9sIGNvbnZlcnNpb25zIGZyb20gcGxhaW4gSlMgb2JqZWN0cyB3aGVuIFxyXG4gICAgLy8gJ3VwZGF0ZVdpdGgnLlxyXG4gICAgdGhpcy5tYXBwaW5nT3B0aW9ucyA9IHt9O1xyXG4gICAgXHJcbiAgICAvLyBUaW1lc3RhbXAgd2l0aCB0aGUgZGF0ZSBvZiBsYXN0IGNoYW5nZVxyXG4gICAgLy8gaW4gdGhlIGRhdGEgKGF1dG9tYXRpY2FsbHkgdXBkYXRlZCB3aGVuIGNoYW5nZXNcclxuICAgIC8vIGhhcHBlbnMgb24gcHJvcGVydGllczsgZmllbGRzIG9yIGFueSBvdGhlciBtZW1iZXJcclxuICAgIC8vIGFkZGVkIHRvIHRoZSBtb2RlbCBjYW5ub3QgYmUgb2JzZXJ2ZWQgZm9yIGNoYW5nZXMsXHJcbiAgICAvLyByZXF1aXJpbmcgbWFudWFsIHVwZGF0aW5nIHdpdGggYSAnbmV3IERhdGUoKScsIGJ1dCBpc1xyXG4gICAgLy8gYmV0dGVyIHRvIHVzZSBwcm9wZXJ0aWVzLlxyXG4gICAgLy8gSXRzIHJhdGVkIHRvIHplcm8ganVzdCB0byBhdm9pZCB0aGF0IGNvbnNlY3V0aXZlXHJcbiAgICAvLyBzeW5jaHJvbm91cyBjaGFuZ2VzIGVtaXQgbG90IG9mIG5vdGlmaWNhdGlvbnMsIHNwZWNpYWxseVxyXG4gICAgLy8gd2l0aCBidWxrIHRhc2tzIGxpa2UgJ3VwZGF0ZVdpdGgnLlxyXG4gICAgdGhpcy5kYXRhVGltZXN0YW1wID0ga28ub2JzZXJ2YWJsZShuZXcgRGF0ZSgpKS5leHRlbmQoeyByYXRlTGltaXQ6IDAgfSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTW9kZWw7XHJcblxyXG4vKipcclxuICAgIERlZmluZSBvYnNlcnZhYmxlIHByb3BlcnRpZXMgdXNpbmcgdGhlIGdpdmVuXHJcbiAgICBwcm9wZXJ0aWVzIG9iamVjdCBkZWZpbml0aW9uIHRoYXQgaW5jbHVkZXMgZGUgZGVmYXVsdCB2YWx1ZXMsXHJcbiAgICBhbmQgc29tZSBvcHRpb25hbCBpbml0aWFsVmFsdWVzIChub3JtYWxseSB0aGF0IGlzIHByb3ZpZGVkIGV4dGVybmFsbHlcclxuICAgIGFzIGEgcGFyYW1ldGVyIHRvIHRoZSBtb2RlbCBjb25zdHJ1Y3Rvciwgd2hpbGUgZGVmYXVsdCB2YWx1ZXMgYXJlXHJcbiAgICBzZXQgaW4gdGhlIGNvbnN0cnVjdG9yKS5cclxuICAgIFRoYXQgcHJvcGVydGllcyBiZWNvbWUgbWVtYmVycyBvZiB0aGUgbW9kZWxPYmplY3QsIHNpbXBsaWZ5aW5nIFxyXG4gICAgbW9kZWwgZGVmaW5pdGlvbnMuXHJcbiAgICBcclxuICAgIEl0IHVzZXMgS25vY2tvdXQub2JzZXJ2YWJsZSBhbmQgb2JzZXJ2YWJsZUFycmF5LCBzbyBwcm9wZXJ0aWVzXHJcbiAgICBhcmUgZnVudGlvbnMgdGhhdCByZWFkcyB0aGUgdmFsdWUgd2hlbiBubyBhcmd1bWVudHMgb3Igc2V0cyB3aGVuXHJcbiAgICBvbmUgYXJndW1lbnQgaXMgcGFzc2VkIG9mLlxyXG4qKi9cclxuTW9kZWwucHJvdG90eXBlLmRlZlByb3BlcnRpZXMgPSBmdW5jdGlvbiBkZWZQcm9wZXJ0aWVzKHByb3BlcnRpZXMsIGluaXRpYWxWYWx1ZXMpIHtcclxuXHJcbiAgICBpbml0aWFsVmFsdWVzID0gaW5pdGlhbFZhbHVlcyB8fCB7fTtcclxuXHJcbiAgICB2YXIgbW9kZWxPYmplY3QgPSB0aGlzLm1vZGVsT2JqZWN0LFxyXG4gICAgICAgIHByb3BlcnRpZXNMaXN0ID0gdGhpcy5wcm9wZXJ0aWVzTGlzdCxcclxuICAgICAgICBkYXRhVGltZXN0YW1wID0gdGhpcy5kYXRhVGltZXN0YW1wO1xyXG5cclxuICAgIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRlZlZhbCA9IHByb3BlcnRpZXNba2V5XTtcclxuICAgICAgICAvLyBDcmVhdGUgb2JzZXJ2YWJsZSBwcm9wZXJ0eSB3aXRoIGRlZmF1bHQgdmFsdWVcclxuICAgICAgICBtb2RlbE9iamVjdFtrZXldID0gQXJyYXkuaXNBcnJheShkZWZWYWwpID9cclxuICAgICAgICAgICAga28ub2JzZXJ2YWJsZUFycmF5KGRlZlZhbCkgOlxyXG4gICAgICAgICAgICBrby5vYnNlcnZhYmxlKGRlZlZhbCk7XHJcbiAgICAgICAgLy8gUmVtZW1iZXIgZGVmYXVsdFxyXG4gICAgICAgIG1vZGVsT2JqZWN0W2tleV0uX2RlZmF1bHRWYWx1ZSA9IGRlZlZhbDtcclxuICAgICAgICAvLyByZW1lbWJlciBpbml0aWFsXHJcbiAgICAgICAgbW9kZWxPYmplY3Rba2V5XS5faW5pdGlhbFZhbHVlID0gaW5pdGlhbFZhbHVlc1trZXldO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIGFuIGluaXRpYWxWYWx1ZSwgc2V0IGl0OlxyXG4gICAgICAgIGlmICh0eXBlb2YoaW5pdGlhbFZhbHVlc1trZXldKSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgbW9kZWxPYmplY3Rba2V5XShpbml0aWFsVmFsdWVzW2tleV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBBZGQgc3Vic2NyaWJlciB0byB1cGRhdGUgdGhlIHRpbWVzdGFtcCBvbiBjaGFuZ2VzXHJcbiAgICAgICAgbW9kZWxPYmplY3Rba2V5XS5zdWJzY3JpYmUoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGRhdGFUaW1lc3RhbXAobmV3IERhdGUoKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQWRkIHRvIHRoZSBpbnRlcm5hbCByZWdpc3RyeVxyXG4gICAgICAgIHByb3BlcnRpZXNMaXN0LnB1c2goa2V5KTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBVcGRhdGUgdGltZXN0YW1wIGFmdGVyIHRoZSBidWxrIGNyZWF0aW9uLlxyXG4gICAgZGF0YVRpbWVzdGFtcChuZXcgRGF0ZSgpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgRGVmaW5lIGZpZWxkcyBhcyBwbGFpbiBtZW1iZXJzIG9mIHRoZSBtb2RlbE9iamVjdCB1c2luZ1xyXG4gICAgdGhlIGZpZWxkcyBvYmplY3QgZGVmaW5pdGlvbiB0aGF0IGluY2x1ZGVzIGRlZmF1bHQgdmFsdWVzLFxyXG4gICAgYW5kIHNvbWUgb3B0aW9uYWwgaW5pdGlhbFZhbHVlcy5cclxuICAgIFxyXG4gICAgSXRzIGxpa2UgZGVmUHJvcGVydGllcywgYnV0IGZvciBwbGFpbiBqcyB2YWx1ZXMgcmF0aGVyIHRoYW4gb2JzZXJ2YWJsZXMuXHJcbioqL1xyXG5Nb2RlbC5wcm90b3R5cGUuZGVmRmllbGRzID0gZnVuY3Rpb24gZGVmRmllbGRzKGZpZWxkcywgaW5pdGlhbFZhbHVlcykge1xyXG5cclxuICAgIGluaXRpYWxWYWx1ZXMgPSBpbml0aWFsVmFsdWVzIHx8IHt9O1xyXG5cclxuICAgIHZhciBtb2RlbE9iamVjdCA9IHRoaXMubW9kZWxPYmplY3QsXHJcbiAgICAgICAgZmllbGRzTGlzdCA9IHRoaXMuZmllbGRzTGlzdDtcclxuXHJcbiAgICBPYmplY3Qua2V5cyhmaWVsZHMpLmVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRlZlZhbCA9IGZpZWxkc1trZXldO1xyXG4gICAgICAgIC8vIENyZWF0ZSBmaWVsZCB3aXRoIGRlZmF1bHQgdmFsdWVcclxuICAgICAgICBtb2RlbE9iamVjdFtrZXldID0gZGVmVmFsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIGFuIGluaXRpYWxWYWx1ZSwgc2V0IGl0OlxyXG4gICAgICAgIGlmICh0eXBlb2YoaW5pdGlhbFZhbHVlc1trZXldKSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgbW9kZWxPYmplY3Rba2V5XSA9IGluaXRpYWxWYWx1ZXNba2V5XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQWRkIHRvIHRoZSBpbnRlcm5hbCByZWdpc3RyeVxyXG4gICAgICAgIGZpZWxkc0xpc3QucHVzaChrZXkpO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIFN0b3JlIHRoZSBsaXN0IG9mIGZpZWxkcyB0aGF0IG1ha2UgdGhlIElEL3ByaW1hcnkga2V5XHJcbiAgICBhbmQgY3JlYXRlIGFuIGFsaWFzICdpZCcgcHJvcGVydHkgdGhhdCByZXR1cm5zIHRoZVxyXG4gICAgdmFsdWUgZm9yIHRoZSBJRCBmaWVsZCBvciBhcnJheSBvZiB2YWx1ZXMgd2hlbiBtdWx0aXBsZVxyXG4gICAgZmllbGRzLlxyXG4qKi9cclxuTW9kZWwucHJvdG90eXBlLmRlZklEID0gZnVuY3Rpb24gZGVmSUQoZmllbGRzTmFtZXMpIHtcclxuICAgIFxyXG4gICAgLy8gU3RvcmUgdGhlIGxpc3RcclxuICAgIHRoaXMuaWRGaWVsZHNOYW1lcyA9IGZpZWxkc05hbWVzO1xyXG4gICAgXHJcbiAgICAvLyBEZWZpbmUgSUQgb2JzZXJ2YWJsZVxyXG4gICAgaWYgKGZpZWxkc05hbWVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIC8vIFJldHVybnMgc2luZ2xlIHZhbHVlXHJcbiAgICAgICAgdmFyIGZpZWxkID0gZmllbGRzTmFtZXNbMF07XHJcbiAgICAgICAgdGhpcy5tb2RlbE9iamVjdC5pZCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbZmllbGRdKCk7XHJcbiAgICAgICAgfSwgdGhpcy5tb2RlbE9iamVjdCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICB0aGlzLm1vZGVsT2JqZWN0LmlkID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmllbGRzTmFtZXMubWFwKGZ1bmN0aW9uKGZpZWxkTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbZmllbGRdKCk7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICAgICAgfSwgdGhpcy5tb2RlbE9iamVjdCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICAgIEFsbG93cyB0byByZWdpc3RlciBhIHByb3BlcnR5IChwcmV2aW91c2x5IGRlZmluZWQpIGFzIFxyXG4gICAgdGhlIG1vZGVsIHRpbWVzdGFtcCwgc28gZ2V0cyB1cGRhdGVkIG9uIGFueSBkYXRhIGNoYW5nZVxyXG4gICAgKGtlZXAgaW4gc3luYyB3aXRoIHRoZSBpbnRlcm5hbCBkYXRhVGltZXN0YW1wKS5cclxuKiovXHJcbk1vZGVsLnByb3RvdHlwZS5yZWdUaW1lc3RhbXAgPSBmdW5jdGlvbiByZWdUaW1lc3RhbXBQcm9wZXJ0eShwcm9wZXJ0eU5hbWUpIHtcclxuXHJcbiAgICB2YXIgcHJvcCA9IHRoaXMubW9kZWxPYmplY3RbcHJvcGVydHlOYW1lXTtcclxuICAgIGlmICh0eXBlb2YocHJvcCkgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZXJlIGlzIG5vIG9ic2VydmFibGUgcHJvcGVydHkgd2l0aCBuYW1lIFsnICsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZSArIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnXSB0byByZWdpc3RlciBhcyB0aW1lc3RhbXAuJ1xyXG4gICAgICAgKTtcclxuICAgIH1cclxuICAgIC8vIEFkZCBzdWJzY3JpYmVyIG9uIGludGVybmFsIHRpbWVzdGFtcCB0byBrZWVwXHJcbiAgICAvLyB0aGUgcHJvcGVydHkgdXBkYXRlZFxyXG4gICAgdGhpcy5kYXRhVGltZXN0YW1wLnN1YnNjcmliZShmdW5jdGlvbih0aW1lc3RhbXApIHtcclxuICAgICAgICBwcm9wKHRpbWVzdGFtcCk7XHJcbiAgICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgUmV0dXJucyBhIHBsYWluIG9iamVjdCB3aXRoIHRoZSBwcm9wZXJ0aWVzIGFuZCBmaWVsZHNcclxuICAgIG9mIHRoZSBtb2RlbCBvYmplY3QsIGp1c3QgdmFsdWVzLlxyXG4gICAgXHJcbiAgICBAcGFyYW0gZGVlcENvcHk6Ym9vbCBJZiBsZWZ0IHVuZGVmaW5lZCwgZG8gbm90IGNvcHkgb2JqZWN0cyBpblxyXG4gICAgdmFsdWVzIGFuZCBub3QgcmVmZXJlbmNlcy4gSWYgZmFsc2UsIGRvIGEgc2hhbGxvdyBjb3B5LCBzZXR0aW5nXHJcbiAgICB1cCByZWZlcmVuY2VzIGluIHRoZSByZXN1bHQuIElmIHRydWUsIHRvIGEgZGVlcCBjb3B5IG9mIGFsbCBvYmplY3RzLlxyXG4qKi9cclxuTW9kZWwucHJvdG90eXBlLnRvUGxhaW5PYmplY3QgPSBmdW5jdGlvbiB0b1BsYWluT2JqZWN0KGRlZXBDb3B5KSB7XHJcblxyXG4gICAgdmFyIHBsYWluID0ge30sXHJcbiAgICAgICAgbW9kZWxPYmogPSB0aGlzLm1vZGVsT2JqZWN0O1xyXG5cclxuICAgIGZ1bmN0aW9uIHNldFZhbHVlKHByb3BlcnR5LCB2YWwpIHtcclxuICAgICAgICAvKmpzaGludCBtYXhjb21wbGV4aXR5OiAxMCovXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHR5cGVvZih2YWwpID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICBpZiAoZGVlcENvcHkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIGlmICh2YWwgaW5zdGFuY2VvZiBEYXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQSBkYXRlIGNsb25lXHJcbiAgICAgICAgICAgICAgICAgICAgcGxhaW5bcHJvcGVydHldID0gbmV3IERhdGUodmFsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZhbCAmJiB2YWwubW9kZWwgaW5zdGFuY2VvZiBNb2RlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEEgbW9kZWwgY29weVxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IHZhbC5tb2RlbC50b1BsYWluT2JqZWN0KGRlZXBDb3B5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZhbCA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBQbGFpbiAnc3RhbmRhcmQnIG9iamVjdCBjbG9uZVxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IGNsb25lKHZhbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoZGVlcENvcHkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBTaGFsbG93IGNvcHlcclxuICAgICAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IHZhbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBPbiBlbHNlLCBkbyBub3RoaW5nLCBubyByZWZlcmVuY2VzLCBubyBjbG9uZXNcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IHZhbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5wcm9wZXJ0aWVzTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHByb3BlcnR5KSB7XHJcbiAgICAgICAgLy8gUHJvcGVydGllcyBhcmUgb2JzZXJ2YWJsZXMsIHNvIGZ1bmN0aW9ucyB3aXRob3V0IHBhcmFtczpcclxuICAgICAgICB2YXIgdmFsID0gbW9kZWxPYmpbcHJvcGVydHldKCk7XHJcblxyXG4gICAgICAgIHNldFZhbHVlKHByb3BlcnR5LCB2YWwpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5maWVsZHNMaXN0LmZvckVhY2goZnVuY3Rpb24oZmllbGQpIHtcclxuICAgICAgICAvLyBGaWVsZHMgYXJlIGp1c3QgcGxhaW4gb2JqZWN0IG1lbWJlcnMgZm9yIHZhbHVlcywganVzdCBjb3B5OlxyXG4gICAgICAgIHZhciB2YWwgPSBtb2RlbE9ialtmaWVsZF07XHJcblxyXG4gICAgICAgIHNldFZhbHVlKGZpZWxkLCB2YWwpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHBsYWluO1xyXG59O1xyXG5cclxuTW9kZWwucHJvdG90eXBlLnVwZGF0ZVdpdGggPSBmdW5jdGlvbiB1cGRhdGVXaXRoKGRhdGEsIGRlZXBDb3B5KSB7XHJcbiAgICBcclxuICAgIC8vIFdlIG5lZWQgYSBwbGFpbiBvYmplY3QgZm9yICdmcm9tSlMnLlxyXG4gICAgLy8gSWYgaXMgYSBtb2RlbCwgZXh0cmFjdCB0aGVpciBwcm9wZXJ0aWVzIGFuZCBmaWVsZHMgZnJvbVxyXG4gICAgLy8gdGhlIG9ic2VydmFibGVzIChmcm9tSlMpLCBzbyB3ZSBub3QgZ2V0IGNvbXB1dGVkXHJcbiAgICAvLyBvciBmdW5jdGlvbnMsIGp1c3QgcmVnaXN0ZXJlZCBwcm9wZXJ0aWVzIGFuZCBmaWVsZHNcclxuICAgIHZhciB0aW1lc3RhbXAgPSBudWxsO1xyXG4gICAgaWYgKGRhdGEgJiYgZGF0YS5tb2RlbCBpbnN0YW5jZW9mIE1vZGVsKSB7XHJcblxyXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gc2V0IHRoZSBzYW1lIHRpbWVzdGFtcCwgc29cclxuICAgICAgICAvLyByZW1lbWJlciBmb3IgYWZ0ZXIgdGhlIGZyb21KU1xyXG4gICAgICAgIHRpbWVzdGFtcCA9IGRhdGEubW9kZWwuZGF0YVRpbWVzdGFtcCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFJlcGxhY2UgZGF0YSB3aXRoIGEgcGxhaW4gY29weSBvZiBpdHNlbGZcclxuICAgICAgICBkYXRhID0gZGF0YS5tb2RlbC50b1BsYWluT2JqZWN0KGRlZXBDb3B5KTtcclxuICAgIH1cclxuXHJcbiAgICBrby5tYXBwaW5nLmZyb21KUyhkYXRhLCB0aGlzLm1hcHBpbmdPcHRpb25zLCB0aGlzLm1vZGVsT2JqZWN0KTtcclxuICAgIC8vIFNhbWUgdGltZXN0YW1wIGlmIGFueVxyXG4gICAgaWYgKHRpbWVzdGFtcClcclxuICAgICAgICB0aGlzLm1vZGVsT2JqZWN0Lm1vZGVsLmRhdGFUaW1lc3RhbXAodGltZXN0YW1wKTtcclxufTtcclxuXHJcbk1vZGVsLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lKGRhdGEsIGRlZXBDb3B5KSB7XHJcbiAgICAvLyBHZXQgYSBwbGFpbiBvYmplY3Qgd2l0aCB0aGUgb2JqZWN0IGRhdGFcclxuICAgIHZhciBwbGFpbiA9IHRoaXMudG9QbGFpbk9iamVjdChkZWVwQ29weSk7XHJcbiAgICAvLyBDcmVhdGUgYSBuZXcgbW9kZWwgaW5zdGFuY2UsIHVzaW5nIHRoZSBzb3VyY2UgcGxhaW4gb2JqZWN0XHJcbiAgICAvLyBhcyBpbml0aWFsIHZhbHVlc1xyXG4gICAgdmFyIGNsb25lZCA9IG5ldyB0aGlzLm1vZGVsT2JqZWN0LmNvbnN0cnVjdG9yKHBsYWluKTtcclxuICAgIGlmIChkYXRhKSB7XHJcbiAgICAgICAgLy8gVXBkYXRlIHRoZSBjbG9uZWQgd2l0aCB0aGUgcHJvdmlkZWQgcGxhaW4gZGF0YSB1c2VkXHJcbiAgICAgICAgLy8gdG8gcmVwbGFjZSB2YWx1ZXMgb24gdGhlIGNsb25lZCBvbmUsIGZvciBxdWljayBvbmUtc3RlcCBjcmVhdGlvblxyXG4gICAgICAgIC8vIG9mIGRlcml2ZWQgb2JqZWN0cy5cclxuICAgICAgICBjbG9uZWQubW9kZWwudXBkYXRlV2l0aChkYXRhKTtcclxuICAgIH1cclxuICAgIC8vIENsb25lZCBtb2RlbCByZWFkeTpcclxuICAgIHJldHVybiBjbG9uZWQ7XHJcbn07XHJcbiIsIi8qKiBQZXJmb3JtYW5jZVN1bW1hcnkgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIExpc3RWaWV3SXRlbSA9IHJlcXVpcmUoJy4vTGlzdFZpZXdJdGVtJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKSxcclxuICAgIG51bWVyYWwgPSByZXF1aXJlKCdudW1lcmFsJyk7XHJcblxyXG5mdW5jdGlvbiBQZXJmb3JtYW5jZVN1bW1hcnkodmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdmFsdWVzID0gdmFsdWVzIHx8IHt9O1xyXG5cclxuICAgIHRoaXMuZWFybmluZ3MgPSBuZXcgRWFybmluZ3ModmFsdWVzLmVhcm5pbmdzKTtcclxuICAgIFxyXG4gICAgdmFyIGVhcm5pbmdzTGluZSA9IG5ldyBMaXN0Vmlld0l0ZW0oKTtcclxuICAgIGVhcm5pbmdzTGluZS5tYXJrZXJMaW5lMSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBudW0gPSBudW1lcmFsKHRoaXMuY3VycmVudEFtb3VudCgpKS5mb3JtYXQoJyQwLDAnKTtcclxuICAgICAgICByZXR1cm4gbnVtO1xyXG4gICAgfSwgdGhpcy5lYXJuaW5ncyk7XHJcbiAgICBlYXJuaW5nc0xpbmUuY29udGVudExpbmUxID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudENvbmNlcHQoKTtcclxuICAgIH0sIHRoaXMuZWFybmluZ3MpO1xyXG4gICAgZWFybmluZ3NMaW5lLm1hcmtlckxpbmUyID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIG51bSA9IG51bWVyYWwodGhpcy5uZXh0QW1vdW50KCkpLmZvcm1hdCgnJDAsMCcpO1xyXG4gICAgICAgIHJldHVybiBudW07XHJcbiAgICB9LCB0aGlzLmVhcm5pbmdzKTtcclxuICAgIGVhcm5pbmdzTGluZS5jb250ZW50TGluZTIgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5uZXh0Q29uY2VwdCgpO1xyXG4gICAgfSwgdGhpcy5lYXJuaW5ncyk7XHJcbiAgICBcclxuXHJcbiAgICB0aGlzLnRpbWVCb29rZWQgPSBuZXcgVGltZUJvb2tlZCh2YWx1ZXMudGltZUJvb2tlZCk7XHJcblxyXG4gICAgdmFyIHRpbWVCb29rZWRMaW5lID0gbmV3IExpc3RWaWV3SXRlbSgpO1xyXG4gICAgdGltZUJvb2tlZExpbmUubWFya2VyTGluZTEgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgbnVtID0gbnVtZXJhbCh0aGlzLnBlcmNlbnQoKSkuZm9ybWF0KCcwJScpO1xyXG4gICAgICAgIHJldHVybiBudW07XHJcbiAgICB9LCB0aGlzLnRpbWVCb29rZWQpO1xyXG4gICAgdGltZUJvb2tlZExpbmUuY29udGVudExpbmUxID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uY2VwdCgpO1xyXG4gICAgfSwgdGhpcy50aW1lQm9va2VkKTtcclxuICAgIFxyXG4gICAgXHJcbiAgICB0aGlzLml0ZW1zID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBpdGVtcyA9IFtdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGl0ZW1zLnB1c2goZWFybmluZ3NMaW5lKTtcclxuICAgICAgICBpdGVtcy5wdXNoKHRpbWVCb29rZWRMaW5lKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGl0ZW1zO1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGVyZm9ybWFuY2VTdW1tYXJ5O1xyXG5cclxuZnVuY3Rpb24gRWFybmluZ3ModmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICBcclxuICAgICAgICAgY3VycmVudEFtb3VudDogMCxcclxuICAgICAgICAgY3VycmVudENvbmNlcHRUZW1wbGF0ZTogJ2FscmVhZHkgcGFpZCB0aGlzIG1vbnRoJyxcclxuICAgICAgICAgbmV4dEFtb3VudDogMCxcclxuICAgICAgICAgbmV4dENvbmNlcHRUZW1wbGF0ZTogJ3Byb2plY3RlZCB7bW9udGh9IGVhcm5pbmdzJ1xyXG5cclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuY3VycmVudENvbmNlcHQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHZhciBtb250aCA9IG1vbWVudCgpLmZvcm1hdCgnTU1NTScpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRDb25jZXB0VGVtcGxhdGUoKS5yZXBsYWNlKC9cXHttb250aFxcfS8sIG1vbnRoKTtcclxuXHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLm5leHRDb25jZXB0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgbW9udGggPSBtb21lbnQoKS5hZGQoMSwgJ21vbnRoJykuZm9ybWF0KCdNTU1NJyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dENvbmNlcHRUZW1wbGF0ZSgpLnJlcGxhY2UoL1xce21vbnRoXFx9LywgbW9udGgpO1xyXG5cclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBUaW1lQm9va2VkKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgXHJcbiAgICAgICAgcGVyY2VudDogMCxcclxuICAgICAgICBjb25jZXB0VGVtcGxhdGU6ICdvZiBhdmFpbGFibGUgdGltZSBib29rZWQgaW4ge21vbnRofSdcclxuICAgIFxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5jb25jZXB0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgbW9udGggPSBtb21lbnQoKS5hZGQoMSwgJ21vbnRoJykuZm9ybWF0KCdNTU1NJyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uY2VwdFRlbXBsYXRlKCkucmVwbGFjZSgvXFx7bW9udGhcXH0vLCBtb250aCk7XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuIiwiLyoqIFBvc2l0aW9uIG1vZGVsLlxyXG4gKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIFBvc2l0aW9uKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHBvc2l0aW9uSUQ6IDAsXHJcbiAgICAgICAgcG9zaXRpb25TaW5ndWxhcjogJycsXHJcbiAgICAgICAgcG9zaXRpb25QbHVyYWw6ICcnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnJyxcclxuICAgICAgICBhY3RpdmU6IHRydWVcclxuXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBvc2l0aW9uO1xyXG4iLCIvKipcclxuICAgIFByaXZhY3lTZXR0aW5ncyBtb2RlbFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gUHJpdmFjeVNldHRpbmdzKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICB1c2VySUQ6IDAsXHJcbiAgICAgICAgc21zQm9va2luZ0NvbW11bmljYXRpb246IGZhbHNlLFxyXG4gICAgICAgIHBob25lQm9va2luZ0NvbW11bmljYXRpb246IGZhbHNlLFxyXG4gICAgICAgIGxvY29ub21pY3NDb21tdW5pdHlDb21tdW5pY2F0aW9uOiBmYWxzZSxcclxuICAgICAgICBsb2Nvbm9taWNzRGJtQ2FtcGFpZ25zOiBmYWxzZSxcclxuICAgICAgICBwcm9maWxlU2VvUGVybWlzc2lvbjogZmFsc2UsXHJcbiAgICAgICAgbG9jb25vbWljc01hcmtldGluZ0NhbXBhaWduczogZmFsc2UsXHJcbiAgICAgICAgY29CcmFuZGVkUGFydG5lclBlcm1pc3Npb25zOiBmYWxzZSxcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZJRChbJ3VzZXJJRCddKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQcml2YWN5U2V0dGluZ3M7XHJcbiIsIi8qKlxyXG4gICAgU2NoZWR1bGluZ1ByZWZlcmVuY2VzIG1vZGVsLlxyXG4gKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIFNjaGVkdWxpbmdQcmVmZXJlbmNlcyh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBhZHZhbmNlVGltZTogMjQsXHJcbiAgICAgICAgYmV0d2VlblRpbWU6IDAsXHJcbiAgICAgICAgaW5jcmVtZW50c1NpemVJbk1pbnV0ZXM6IDE1XHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNjaGVkdWxpbmdQcmVmZXJlbmNlcztcclxuIiwiLyoqIFNlcnZpY2UgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIFNlcnZpY2UodmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgbmFtZTogJycsXHJcbiAgICAgICAgcHJpY2U6IDAsXHJcbiAgICAgICAgZHVyYXRpb246IDAsIC8vIGluIG1pbnV0ZXNcclxuICAgICAgICBpc0FkZG9uOiBmYWxzZVxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5kdXJhdGlvblRleHQgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgbWludXRlcyA9IHRoaXMuZHVyYXRpb24oKSB8fCAwO1xyXG4gICAgICAgIC8vIFRPRE86IEZvcm1hdHRpbmcsIGxvY2FsaXphdGlvblxyXG4gICAgICAgIHJldHVybiBtaW51dGVzID8gbWludXRlcyArICcgbWludXRlcycgOiAnJztcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNlcnZpY2U7XHJcbiIsIi8qKlxyXG4gICAgU2ltcGxpZmllZFdlZWtseVNjaGVkdWxlIG1vZGVsLlxyXG4gICAgXHJcbiAgICBJdHMgJ3NpbXBsaWZpZWQnIGJlY2F1c2UgaXQgcHJvdmlkZXMgYW4gQVBJXHJcbiAgICBmb3Igc2ltcGxlIHRpbWUgcmFuZ2UgcGVyIHdlZWsgZGF5LFxyXG4gICAgYSBwYWlyIG9mIGZyb20tdG8gdGltZXMuXHJcbiAgICBHb29kIGZvciBjdXJyZW50IHNpbXBsZSBVSS5cclxuICAgIFxyXG4gICAgVGhlIG9yaWdpbmFsIHdlZWtseSBzY2hlZHVsZSBkZWZpbmVzIHRoZSBzY2hlZHVsZVxyXG4gICAgaW4gMTUgbWludXRlcyBzbG90cywgc28gbXVsdGlwbGUgdGltZSByYW5nZXMgY2FuXHJcbiAgICBleGlzdHMgcGVyIHdlZWsgZGF5LCBqdXN0IG1hcmtpbmcgZWFjaCBzbG90XHJcbiAgICBhcyBhdmFpbGFibGUgb3IgdW5hdmFpbGFibGUuIFRoZSBBcHBNb2RlbFxyXG4gICAgd2lsbCBmaWxsIHRoaXMgbW9kZWwgaW5zdGFuY2VzIHByb3Blcmx5IG1ha2luZ1xyXG4gICAgYW55IGNvbnZlcnNpb24gZnJvbS90byB0aGUgc291cmNlIGRhdGEuXHJcbiAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuLyoqXHJcbiAgICBTdWJtb2RlbCB0aGF0IGlzIHVzZWQgb24gdGhlIFNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZVxyXG4gICAgZGVmaW5pbmcgYSBzaW5nbGUgd2VlayBkYXkgYXZhaWxhYmlsaXR5IHJhbmdlLlxyXG4gICAgQSBmdWxsIGRheSBtdXN0IGhhdmUgdmFsdWVzIGZyb206MCB0bzoxNDQwLCBuZXZlclxyXG4gICAgYm90aCBhcyB6ZXJvIGJlY2F1c2UgdGhhdHMgY29uc2lkZXJlZCBhcyBub3QgYXZhaWxhYmxlLFxyXG4gICAgc28gaXMgYmV0dGVyIHRvIHVzZSB0aGUgaXNBbGxEYXkgcHJvcGVydHkuXHJcbioqL1xyXG5mdW5jdGlvbiBXZWVrRGF5U2NoZWR1bGUodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIC8vIE5PVEU6IGZyb20tdG8gcHJvcGVyaWVzIGFzIG51bWJlcnNcclxuICAgIC8vIGZvciB0aGUgbWludXRlIG9mIHRoZSBkYXksIGZyb20gMCAoMDA6MDApIHRvIDE0MzkgKDIzOjU5KVxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBmcm9tOiAwLFxyXG4gICAgICAgIHRvOiAwXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBJdCBhbGxvd3MgdG8ga25vdyBpZiB0aGlzIHdlZWsgZGF5IGlzIFxyXG4gICAgICAgIGVuYWJsZWQgZm9yIHdlZWtseSBzY2hlZHVsZSwganVzdCBpdFxyXG4gICAgICAgIGhhcyBmcm9tLXRvIHRpbWVzLlxyXG4gICAgICAgIEl0IGFsbG93cyB0byBiZSBzZXQgYXMgdHJ1ZSBwdXR0aW5nXHJcbiAgICAgICAgYSBkZWZhdWx0IHJhbmdlICg5YS01cCkgb3IgZmFsc2UgXHJcbiAgICAgICAgc2V0dGluZyBib3RoIGFzIDBwLlxyXG4gICAgICAgIFxyXG4gICAgICAgIFNpbmNlIG9uIHdyaXRlIHR3byBvYnNlcnZhYmxlcyBhcmUgYmVpbmcgbW9kaWZpZWQsIGFuZFxyXG4gICAgICAgIGJvdGggYXJlIHVzZWQgaW4gdGhlIHJlYWQsIGEgc2luZ2xlIGNoYW5nZSB0byB0aGUgXHJcbiAgICAgICAgdmFsdWUgd2lsbCB0cmlnZ2VyIHR3byBub3RpZmljYXRpb25zOyB0byBhdm9pZCB0aGF0LFxyXG4gICAgICAgIHRoZSBvYnNlcnZhYmxlIGlzIHJhdGUgbGltaXRlZCB3aXRoIGFuIGlubWVkaWF0ZSB2YWx1ZSxcclxuICAgICAgICBzb24gb25seSBvbmUgbm90aWZpY2F0aW9uIGlzIHJlY2VpdmVkLlxyXG4gICAgKiovXHJcbiAgICB0aGlzLmlzRW5hYmxlZCA9IGtvLmNvbXB1dGVkKHtcclxuICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIHR5cGVvZih0aGlzLmZyb20oKSkgPT09ICdudW1iZXInICYmXHJcbiAgICAgICAgICAgICAgICB0eXBlb2YodGhpcy50bygpKSA9PT0gJ251bWJlcicgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMuZnJvbSgpIDwgdGhpcy50bygpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB3cml0ZTogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWwgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIC8vIERlZmF1bHQgcmFuZ2UgOWEgLSA1cFxyXG4gICAgICAgICAgICAgICAgdGhpcy5mcm9tSG91cig5KTtcclxuICAgICAgICAgICAgICAgIHRoaXMudG9Ib3VyKDE3KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudG9Ib3VyKDApO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mcm9tKDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvd25lcjogdGhpc1xyXG4gICAgfSkuZXh0ZW5kKHsgcmF0ZUxpbWl0OiAwIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLmlzQWxsRGF5ID0ga28uY29tcHV0ZWQoe1xyXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gIChcclxuICAgICAgICAgICAgICAgIHRoaXMuZnJvbSgpID09PSAwICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvKCkgPT09IDE0NDBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHdyaXRlOiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICAgICAgdGhpcy5mcm9tKDApO1xyXG4gICAgICAgICAgICB0aGlzLnRvKDE0NDApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3duZXI6IHRoaXNcclxuICAgIH0pLmV4dGVuZCh7IHJhdGVMaW1pdDogMCB9KTtcclxuICAgIFxyXG4gICAgLy8gQWRkaXRpb25hbCBpbnRlcmZhY2VzIHRvIGdldC9zZXQgdGhlIGZyb20vdG8gdGltZXNcclxuICAgIC8vIGJ5IHVzaW5nIGEgZGlmZmVyZW50IGRhdGEgdW5pdCBvciBmb3JtYXQuXHJcbiAgICBcclxuICAgIC8vIEludGVnZXIsIHJvdW5kZWQtdXAsIG51bWJlciBvZiBob3Vyc1xyXG4gICAgdGhpcy5mcm9tSG91ciA9IGtvLmNvbXB1dGVkKHtcclxuICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IodGhpcy5mcm9tKCkgLyA2MCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB3cml0ZTogZnVuY3Rpb24oaG91cnMpIHtcclxuICAgICAgICAgICAgdGhpcy5mcm9tKChob3VycyAqIDYwKSB8MCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvd25lcjogdGhpc1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLnRvSG91ciA9IGtvLmNvbXB1dGVkKHtcclxuICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGguY2VpbCh0aGlzLnRvKCkgLyA2MCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB3cml0ZTogZnVuY3Rpb24oaG91cnMpIHtcclxuICAgICAgICAgICAgdGhpcy50bygoaG91cnMgKiA2MCkgfDApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3duZXI6IHRoaXNcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBTdHJpbmcsIHRpbWUgZm9ybWF0ICgnaGg6bW0nKVxyXG4gICAgdGhpcy5mcm9tVGltZSA9IGtvLmNvbXB1dGVkKHtcclxuICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1pbnV0ZXNUb1RpbWVTdHJpbmcodGhpcy5mcm9tKCkgfDApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKHRpbWUpIHtcclxuICAgICAgICAgICAgdGhpcy5mcm9tKHRpbWVTdHJpbmdUb01pbnV0ZXModGltZSkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3duZXI6IHRoaXNcclxuICAgIH0pO1xyXG4gICAgdGhpcy50b1RpbWUgPSBrby5jb21wdXRlZCh7XHJcbiAgICAgICAgcmVhZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBtaW51dGVzVG9UaW1lU3RyaW5nKHRoaXMudG8oKSB8MCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB3cml0ZTogZnVuY3Rpb24odGltZSkge1xyXG4gICAgICAgICAgICB0aGlzLnRvKHRpbWVTdHJpbmdUb01pbnV0ZXModGltZSkpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3duZXI6IHRoaXNcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICAgIE1haW4gbW9kZWwgZGVmaW5pbmcgdGhlIHdlZWsgc2NoZWR1bGVcclxuICAgIHBlciB3ZWVrIGRhdGUsIG9yIGp1c3Qgc2V0IGFsbCBkYXlzIHRpbWVzXHJcbiAgICBhcyBhdmFpbGFibGUgd2l0aCBhIHNpbmdsZSBmbGFnLlxyXG4qKi9cclxuZnVuY3Rpb24gU2ltcGxpZmllZFdlZWtseVNjaGVkdWxlKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHN1bmRheTogbmV3IFdlZWtEYXlTY2hlZHVsZSgpLFxyXG4gICAgICAgIG1vbmRheTogbmV3IFdlZWtEYXlTY2hlZHVsZSgpLFxyXG4gICAgICAgIHR1ZXNkYXk6IG5ldyBXZWVrRGF5U2NoZWR1bGUoKSxcclxuICAgICAgICB3ZWRuZXNkYXk6IG5ldyBXZWVrRGF5U2NoZWR1bGUoKSxcclxuICAgICAgICB0aHVyc2RheTogbmV3IFdlZWtEYXlTY2hlZHVsZSgpLFxyXG4gICAgICAgIGZyaWRheTogbmV3IFdlZWtEYXlTY2hlZHVsZSgpLFxyXG4gICAgICAgIHNhdHVyZGF5OiBuZXcgV2Vla0RheVNjaGVkdWxlKCksXHJcbiAgICAgICAgaXNBbGxUaW1lOiBmYWxzZVxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGU7XHJcblxyXG4vLy8vIFVUSUxTLFxyXG4vLyBUT0RPIE9yZ2FuaXplIG9yIGV4dGVybmFsaXplLiBzb21lIGNvcGllZCBmb3JtIGFwcG1vZGVsLi5cclxuLyoqXHJcbiAgICBpbnRlcm5hbCB1dGlsaXR5IGZ1bmN0aW9uICd0byBzdHJpbmcgd2l0aCB0d28gZGlnaXRzIGFsbW9zdCdcclxuKiovXHJcbmZ1bmN0aW9uIHR3b0RpZ2l0cyhuKSB7XHJcbiAgICByZXR1cm4gTWF0aC5mbG9vcihuIC8gMTApICsgJycgKyBuICUgMTA7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgQ29udmVydCBhIG51bWJlciBvZiBtaW51dGVzXHJcbiAgICBpbiBhIHN0cmluZyBsaWtlOiAwMDowMDowMCAoaG91cnM6bWludXRlczpzZWNvbmRzKVxyXG4qKi9cclxuZnVuY3Rpb24gbWludXRlc1RvVGltZVN0cmluZyhtaW51dGVzKSB7XHJcbiAgICB2YXIgZCA9IG1vbWVudC5kdXJhdGlvbihtaW51dGVzLCAnbWludXRlcycpLFxyXG4gICAgICAgIGggPSBkLmhvdXJzKCksXHJcbiAgICAgICAgbSA9IGQubWludXRlcygpLFxyXG4gICAgICAgIHMgPSBkLnNlY29uZHMoKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIChcclxuICAgICAgICB0d29EaWdpdHMoaCkgKyAnOicgK1xyXG4gICAgICAgIHR3b0RpZ2l0cyhtKSArICc6JyArXHJcbiAgICAgICAgdHdvRGlnaXRzKHMpXHJcbiAgICApO1xyXG59XHJcblxyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbmZ1bmN0aW9uIHRpbWVTdHJpbmdUb01pbnV0ZXModGltZSkge1xyXG4gICAgcmV0dXJuIG1vbWVudC5kdXJhdGlvbih0aW1lKS5hc01pbnV0ZXMoKSB8MDtcclxufSIsIi8qKiBVcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeSBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgQm9va2luZ1N1bW1hcnkgPSByZXF1aXJlKCcuL0Jvb2tpbmdTdW1tYXJ5Jyk7XHJcblxyXG5mdW5jdGlvbiBVcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeSgpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLnRvZGF5ID0gbmV3IEJvb2tpbmdTdW1tYXJ5KHtcclxuICAgICAgICBjb25jZXB0OiAnbW9yZSB0b2RheScsXHJcbiAgICAgICAgdGltZUZvcm1hdDogJyBbZW5kaW5nIEBdIGg6bW1hJ1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLnRvbW9ycm93ID0gbmV3IEJvb2tpbmdTdW1tYXJ5KHtcclxuICAgICAgICBjb25jZXB0OiAndG9tb3Jyb3cnLFxyXG4gICAgICAgIHRpbWVGb3JtYXQ6ICcgW3N0YXJ0aW5nIEBdIGg6bW1hJ1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLm5leHRXZWVrID0gbmV3IEJvb2tpbmdTdW1tYXJ5KHtcclxuICAgICAgICBjb25jZXB0OiAnbmV4dCB3ZWVrJyxcclxuICAgICAgICB0aW1lRm9ybWF0OiBudWxsXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgdGhpcy5pdGVtcyA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcclxuICAgICAgICBcclxuICAgICAgICAvL2lmICh0aGlzLnRvZGF5LnF1YW50aXR5KCkpXHJcbiAgICAgICAgaXRlbXMucHVzaCh0aGlzLnRvZGF5KTtcclxuICAgICAgICAvL2lmICh0aGlzLnRvbW9ycm93LnF1YW50aXR5KCkpXHJcbiAgICAgICAgaXRlbXMucHVzaCh0aGlzLnRvbW9ycm93KTtcclxuICAgICAgICAvL2lmICh0aGlzLm5leHRXZWVrLnF1YW50aXR5KCkpXHJcbiAgICAgICAgaXRlbXMucHVzaCh0aGlzLm5leHRXZWVrKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGl0ZW1zO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBVcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeTtcclxuIiwiLyoqIFVzZXIgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbi8vIEVudW0gVXNlclR5cGVcclxudmFyIFVzZXJUeXBlID0ge1xyXG4gICAgTm9uZTogMCxcclxuICAgIEFub255bW91czogMSxcclxuICAgIEN1c3RvbWVyOiAyLFxyXG4gICAgRnJlZWxhbmNlcjogNCxcclxuICAgIEFkbWluOiA4LFxyXG4gICAgTG9nZ2VkVXNlcjogMTQsXHJcbiAgICBVc2VyOiAxNSxcclxuICAgIFN5c3RlbTogMTZcclxufTtcclxuXHJcbmZ1bmN0aW9uIFVzZXIodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHVzZXJJRDogMCxcclxuICAgICAgICBlbWFpbDogJycsXHJcbiAgICAgICAgXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnJyxcclxuICAgICAgICBsYXN0TmFtZTogJycsXHJcbiAgICAgICAgc2Vjb25kTGFzdE5hbWU6ICcnLFxyXG4gICAgICAgIGJ1c2luZXNzTmFtZTogJycsXHJcbiAgICAgICAgXHJcbiAgICAgICAgYWx0ZXJuYXRpdmVFbWFpbDogJycsXHJcbiAgICAgICAgcGhvbmU6ICcnLFxyXG4gICAgICAgIGNhblJlY2VpdmVTbXM6ICcnLFxyXG4gICAgICAgIGJpcnRoTW9udGhEYXk6IG51bGwsXHJcbiAgICAgICAgYmlydGhNb250aDogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBpc0ZyZWVsYW5jZXI6IGZhbHNlLFxyXG4gICAgICAgIGlzQ3VzdG9tZXI6IGZhbHNlLFxyXG4gICAgICAgIGlzTWVtYmVyOiBmYWxzZSxcclxuICAgICAgICBpc0FkbWluOiBmYWxzZSxcclxuXHJcbiAgICAgICAgb25ib2FyZGluZ1N0ZXA6IG51bGwsXHJcbiAgICAgICAgYWNjb3VudFN0YXR1c0lEOiAwLFxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBudWxsLFxyXG4gICAgICAgIHVwZGF0ZWREYXRlOiBudWxsXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG5cclxuICAgIHRoaXMuZnVsbE5hbWUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIG5hbWVQYXJ0cyA9IFt0aGlzLmZpcnN0TmFtZSgpXTtcclxuICAgICAgICBpZiAodGhpcy5sYXN0TmFtZSgpKVxyXG4gICAgICAgICAgICBuYW1lUGFydHMucHVzaCh0aGlzLmxhc3ROYW1lKCkpO1xyXG4gICAgICAgIGlmICh0aGlzLnNlY29uZExhc3ROYW1lKCkpXHJcbiAgICAgICAgICAgIG5hbWVQYXJ0cy5wdXNoKHRoaXMuc2Vjb25kTGFzdE5hbWUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBuYW1lUGFydHMuam9pbignICcpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuYmlydGhEYXkgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYmlydGhNb250aERheSgpICYmXHJcbiAgICAgICAgICAgIHRoaXMuYmlydGhNb250aCgpKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBUT0RPIGkxMG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmlydGhNb250aCgpICsgJy8nICsgdGhpcy5iaXJ0aE1vbnRoRGF5KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy51c2VyVHlwZSA9IGtvLnB1cmVDb21wdXRlZCh7XHJcbiAgICAgICAgcmVhZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBjID0gdGhpcy5pc0N1c3RvbWVyKCksXHJcbiAgICAgICAgICAgICAgICBwID0gdGhpcy5pc0ZyZWVsYW5jZXIoKSxcclxuICAgICAgICAgICAgICAgIGEgPSB0aGlzLmlzQWRtaW4oKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciB1c2VyVHlwZSA9IDA7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc0Fub255bW91cygpKVxyXG4gICAgICAgICAgICAgICAgdXNlclR5cGUgPSB1c2VyVHlwZSB8IFVzZXJUeXBlLkFub255bW91cztcclxuICAgICAgICAgICAgaWYgKGMpXHJcbiAgICAgICAgICAgICAgICB1c2VyVHlwZSA9IHVzZXJUeXBlIHwgVXNlclR5cGUuQ3VzdG9tZXI7XHJcbiAgICAgICAgICAgIGlmIChwKVxyXG4gICAgICAgICAgICAgICAgdXNlclR5cGUgPSB1c2VyVHlwZSB8IFVzZXJUeXBlLkZyZWVsYW5jZXI7XHJcbiAgICAgICAgICAgIGlmIChhKVxyXG4gICAgICAgICAgICAgICAgdXNlclR5cGUgPSB1c2VyVHlwZSB8IFVzZXJUeXBlLkFkbWluO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIHVzZXJUeXBlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLyogTk9URTogTm90IHJlcXVpcmVkIGZvciBub3c6XHJcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICB9LCovXHJcbiAgICAgICAgb3duZXI6IHRoaXNcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLmlzQW5vbnltb3VzID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudXNlcklEKCkgPCAxO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEl0IG1hdGNoZXMgYSBVc2VyVHlwZSBmcm9tIHRoZSBlbnVtZXJhdGlvbj9cclxuICAgICoqL1xyXG4gICAgdGhpcy5pc1VzZXJUeXBlID0gZnVuY3Rpb24gaXNVc2VyVHlwZSh0eXBlKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnVzZXJUeXBlKCkgJiB0eXBlKTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBVc2VyO1xyXG5cclxuVXNlci5Vc2VyVHlwZSA9IFVzZXJUeXBlO1xyXG5cclxuLyogQ3JlYXRpbnQgYW4gYW5vbnltb3VzIHVzZXIgd2l0aCBzb21lIHByZXNzZXRzICovXHJcblVzZXIubmV3QW5vbnltb3VzID0gZnVuY3Rpb24gbmV3QW5vbnltb3VzKCkge1xyXG4gICAgcmV0dXJuIG5ldyBVc2VyKHtcclxuICAgICAgICB1c2VySUQ6IDAsXHJcbiAgICAgICAgZW1haWw6ICcnLFxyXG4gICAgICAgIGZpcnN0TmFtZTogJycsXHJcbiAgICAgICAgb25ib2FyZGluZ1N0ZXA6IG51bGxcclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKiogQ2FsZW5kYXIgQXBwb2ludG1lbnRzIHRlc3QgZGF0YSAqKi9cclxudmFyIEFwcG9pbnRtZW50ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0FwcG9pbnRtZW50Jyk7XHJcbnZhciB0ZXN0TG9jYXRpb25zID0gcmVxdWlyZSgnLi9sb2NhdGlvbnMnKS5sb2NhdGlvbnM7XHJcbnZhciB0ZXN0U2VydmljZXMgPSByZXF1aXJlKCcuL3NlcnZpY2VzJykuc2VydmljZXM7XHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbnZhciB0b2RheSA9IG1vbWVudCgpLFxyXG4gICAgdG9tb3Jyb3cgPSBtb21lbnQoKS5hZGQoMSwgJ2RheXMnKSxcclxuICAgIHRvbW9ycm93MTAgPSB0b21vcnJvdy5jbG9uZSgpLmhvdXJzKDEwKS5taW51dGVzKDApLnNlY29uZHMoMCksXHJcbiAgICB0b21vcnJvdzE2ID0gdG9tb3Jyb3cuY2xvbmUoKS5ob3VycygxNikubWludXRlcygzMCkuc2Vjb25kcygwKTtcclxuICAgIFxyXG52YXIgdGVzdERhdGEgPSBbXHJcbiAgICBuZXcgQXBwb2ludG1lbnQoe1xyXG4gICAgICAgIGlkOiAxLFxyXG4gICAgICAgIHN0YXJ0VGltZTogdG9tb3Jyb3cxMCxcclxuICAgICAgICBlbmRUaW1lOiB0b21vcnJvdzE2LFxyXG4gICAgICAgIHN1bW1hcnk6ICdNYXNzYWdlIFRoZXJhcGlzdCBCb29raW5nJyxcclxuICAgICAgICAvL3ByaWNpbmdTdW1tYXJ5OiAnRGVlcCBUaXNzdWUgTWFzc2FnZSAxMjBtIHBsdXMgMiBtb3JlJyxcclxuICAgICAgICBzZXJ2aWNlczogdGVzdFNlcnZpY2VzLFxyXG4gICAgICAgIHB0b3RhbFByaWNlOiA5NS4wLFxyXG4gICAgICAgIGxvY2F0aW9uOiBrby50b0pTKHRlc3RMb2NhdGlvbnNbMF0pLFxyXG4gICAgICAgIHByZU5vdGVzVG9DbGllbnQ6ICdMb29raW5nIGZvcndhcmQgdG8gc2VlaW5nIHRoZSBuZXcgY29sb3InLFxyXG4gICAgICAgIHByZU5vdGVzVG9TZWxmOiAnQXNrIGhpbSBhYm91dCBoaXMgbmV3IGNvbG9yJyxcclxuICAgICAgICBjbGllbnQ6IHtcclxuICAgICAgICAgICAgZmlyc3ROYW1lOiAnSm9zaHVhJyxcclxuICAgICAgICAgICAgbGFzdE5hbWU6ICdEYW5pZWxzb24nXHJcbiAgICAgICAgfVxyXG4gICAgfSksXHJcbiAgICBuZXcgQXBwb2ludG1lbnQoe1xyXG4gICAgICAgIGlkOiAyLFxyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDEsIDEzLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMSwgMTMsIDUwLCAwKSxcclxuICAgICAgICBzdW1tYXJ5OiAnTWFzc2FnZSBUaGVyYXBpc3QgQm9va2luZycsXHJcbiAgICAgICAgLy9wcmljaW5nU3VtbWFyeTogJ0Fub3RoZXIgTWFzc2FnZSA1MG0nLFxyXG4gICAgICAgIHNlcnZpY2VzOiBbdGVzdFNlcnZpY2VzWzBdXSxcclxuICAgICAgICBwdG90YWxQcmljZTogOTUuMCxcclxuICAgICAgICBsb2NhdGlvbjoga28udG9KUyh0ZXN0TG9jYXRpb25zWzFdKSxcclxuICAgICAgICBwcmVOb3Rlc1RvQ2xpZW50OiAnU29tZXRoaW5nIGVsc2UnLFxyXG4gICAgICAgIHByZU5vdGVzVG9TZWxmOiAnUmVtZW1iZXIgdGhhdCB0aGluZycsXHJcbiAgICAgICAgY2xpZW50OiB7XHJcbiAgICAgICAgICAgIGZpcnN0TmFtZTogJ0pvc2h1YScsXHJcbiAgICAgICAgICAgIGxhc3ROYW1lOiAnRGFuaWVsc29uJ1xyXG4gICAgICAgIH1cclxuICAgIH0pLFxyXG4gICAgbmV3IEFwcG9pbnRtZW50KHtcclxuICAgICAgICBpZDogMyxcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxNiwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDEsIDE4LCAwLCAwKSxcclxuICAgICAgICBzdW1tYXJ5OiAnTWFzc2FnZSBUaGVyYXBpc3QgQm9va2luZycsXHJcbiAgICAgICAgLy9wcmljaW5nU3VtbWFyeTogJ1Rpc3N1ZSBNYXNzYWdlIDEyMG0nLFxyXG4gICAgICAgIHNlcnZpY2VzOiBbdGVzdFNlcnZpY2VzWzFdXSxcclxuICAgICAgICBwdG90YWxQcmljZTogOTUuMCxcclxuICAgICAgICBsb2NhdGlvbjoga28udG9KUyh0ZXN0TG9jYXRpb25zWzJdKSxcclxuICAgICAgICBwcmVOb3Rlc1RvQ2xpZW50OiAnJyxcclxuICAgICAgICBwcmVOb3Rlc1RvU2VsZjogJ0FzayBoaW0gYWJvdXQgdGhlIGZvcmdvdHRlbiBub3RlcycsXHJcbiAgICAgICAgY2xpZW50OiB7XHJcbiAgICAgICAgICAgIGZpcnN0TmFtZTogJ0pvc2h1YScsXHJcbiAgICAgICAgICAgIGxhc3ROYW1lOiAnRGFuaWVsc29uJ1xyXG4gICAgICAgIH1cclxuICAgIH0pLFxyXG5dO1xyXG5cclxuZXhwb3J0cy5hcHBvaW50bWVudHMgPSB0ZXN0RGF0YTtcclxuIiwiLyoqIENhbGVuZGFyIFNsb3RzIHRlc3QgZGF0YSAqKi9cclxudmFyIENhbGVuZGFyU2xvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9DYWxlbmRhclNsb3QnKTtcclxuXHJcbnZhciBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG52YXIgdG9kYXkgPSBuZXcgRGF0ZSgpLFxyXG4gICAgdG9tb3Jyb3cgPSBuZXcgRGF0ZSgpO1xyXG50b21vcnJvdy5zZXREYXRlKHRvbW9ycm93LmdldERhdGUoKSArIDEpO1xyXG5cclxudmFyIHN0b2RheSA9IG1vbWVudCh0b2RheSkuZm9ybWF0KCdZWVlZLU1NLUREJyksXHJcbiAgICBzdG9tb3Jyb3cgPSBtb21lbnQodG9tb3Jyb3cpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xyXG5cclxudmFyIHRlc3REYXRhMSA9IFtcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9kYXksIDAsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAxMiwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0ZyZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjIWFwcG9pbnRtZW50LzAnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXN1Y2Nlc3MnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9kYXksIDEyLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b2RheSwgMTMsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdKb3NoIERhbmllbHNvbicsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC8zJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAxMywgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9kYXksIDE1LCAwLCAwKSxcclxuXHJcbiAgICAgICAgc3ViamVjdDogJ0RvIHRoYXQgaW1wb3J0YW50IHRoaW5nJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFldmVudC84JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tbmV3LXdpbmRvdycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAxNSwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9kYXksIDE2LCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnSWFnbyBMb3JlbnpvJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UgTG9uZyBOYW1lJyxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC81JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiAnJDE1OS45MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b2RheSwgMTYsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAwLCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnRnJlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyMhYXBwb2ludG1lbnQvMCcsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctc3VjY2VzcydcclxuICAgIH0pXHJcbl07XHJcbnZhciB0ZXN0RGF0YTIgPSBbXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAwLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgOSwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0ZyZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjIWFwcG9pbnRtZW50LzAnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXN1Y2Nlc3MnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDksIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxMCwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0phcmVuIEZyZWVseScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdEZWVwIFRpc3N1ZSBNYXNzYWdlIExvbmcgTmFtZScsXHJcbiAgICAgICAgbGluazogJyMhYXBwb2ludG1lbnQvMScsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogJyQ1OS45MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTAsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxMSwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0ZyZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjIWFwcG9pbnRtZW50LzAnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXN1Y2Nlc3MnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDExLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTIsIDQ1LCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnQ09ORklSTS1TdXNhbiBEZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgbGluazogJyMhYXBwb2ludG1lbnQvMicsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogJyQ3MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctd2FybmluZydcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTIsIDQ1LCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTYsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC8wJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxNiwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDE3LCAxNSwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ1N1c2FuIERlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC8zJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxNywgMTUsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxOCwgMzAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdEZW50aXN0IGFwcG9pbnRtZW50JyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFldmVudC80JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tbmV3LXdpbmRvdycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxOCwgMzAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxOSwgMzAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdTdXNhbiBEZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRGVlcCBUaXNzdWUgTWFzc2FnZSBMb25nIE5hbWUnLFxyXG4gICAgICAgIGxpbms6ICcjIWFwcG9pbnRtZW50LzUnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6ICckMTU5LjkwJyxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAxOSwgMzAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAyMywgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0ZyZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjIWFwcG9pbnRtZW50LzAnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXN1Y2Nlc3MnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDIzLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMCwgMCwgMCksXHJcblxyXG4gICAgICAgIHN1YmplY3Q6ICdKYXJlbiBGcmVlbHknLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgbGluazogJyMhYXBwb2ludG1lbnQvNicsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogJyQ4MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pXHJcbl07XHJcbnZhciB0ZXN0RGF0YUZyZWUgPSBbXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAwLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMCwgMCwgMCksXHJcblxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC8wJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSlcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IHtcclxuICAgICdkZWZhdWx0JzogdGVzdERhdGFGcmVlXHJcbn07XHJcbnRlc3REYXRhW3N0b2RheV0gPSB0ZXN0RGF0YTE7XHJcbnRlc3REYXRhW3N0b21vcnJvd10gPSB0ZXN0RGF0YTI7XHJcblxyXG5leHBvcnRzLmNhbGVuZGFyID0gdGVzdERhdGE7XHJcbiIsIi8qKiBDbGllbnRzIHRlc3QgZGF0YSAqKi9cclxudmFyIENsaWVudCA9IHJlcXVpcmUoJy4uL21vZGVscy9DbGllbnQnKTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IFtcclxuICAgIG5ldyBDbGllbnQgKHtcclxuICAgICAgICBpZDogMSxcclxuICAgICAgICBmaXJzdE5hbWU6ICdKb3NodWEnLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRGFuaWVsc29uJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBpZDogMixcclxuICAgICAgICBmaXJzdE5hbWU6ICdJYWdvJyxcclxuICAgICAgICBsYXN0TmFtZTogJ0xvcmVuem8nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiAzLFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0Zlcm5hbmRvJyxcclxuICAgICAgICBsYXN0TmFtZTogJ0dhZ28nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiA0LFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FkYW0nLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRmluY2gnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiA1LFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FsYW4nLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRmVyZ3Vzb24nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiA2LFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FsZXgnLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnUGVuYSdcclxuICAgIH0pLFxyXG4gICAgbmV3IENsaWVudCh7XHJcbiAgICAgICAgaWQ6IDcsXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnQWxleGlzJyxcclxuICAgICAgICBsYXN0TmFtZTogJ1BlYWNhJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBpZDogOCxcclxuICAgICAgICBmaXJzdE5hbWU6ICdBcnRodXInLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnTWlsbGVyJ1xyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMuY2xpZW50cyA9IHRlc3REYXRhO1xyXG4iLCIvKiogTG9jYXRpb25zIHRlc3QgZGF0YSAqKi9cclxudmFyIExvY2F0aW9uID0gcmVxdWlyZSgnLi4vbW9kZWxzL0xvY2F0aW9uJyk7XHJcblxyXG52YXIgdGVzdERhdGEgPSBbXHJcbiAgICBuZXcgTG9jYXRpb24gKHtcclxuICAgICAgICBsb2NhdGlvbklEOiAxLFxyXG4gICAgICAgIG5hbWU6ICdBY3R2aVNwYWNlJyxcclxuICAgICAgICBhZGRyZXNzTGluZTE6ICczMTUwIDE4dGggU3RyZWV0JyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwMSxcclxuICAgICAgICBpc1NlcnZpY2VSYWRpdXM6IHRydWUsXHJcbiAgICAgICAgc2VydmljZVJhZGl1czogMlxyXG4gICAgfSksXHJcbiAgICBuZXcgTG9jYXRpb24oe1xyXG4gICAgICAgIGxvY2F0aW9uSUQ6IDIsXHJcbiAgICAgICAgbmFtZTogJ0NvcmV5XFwncyBBcHQnLFxyXG4gICAgICAgIGFkZHJlc3NMaW5lMTogJzE4NyBCb2NhbmEgU3QuJyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwMlxyXG4gICAgfSksXHJcbiAgICBuZXcgTG9jYXRpb24oe1xyXG4gICAgICAgIGxvY2F0aW9uSUQ6IDMsXHJcbiAgICAgICAgbmFtZTogJ0pvc2hcXCdhIEFwdCcsXHJcbiAgICAgICAgYWRkcmVzc0xpbmUxOiAnNDI5IENvcmJldHQgQXZlJyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwM1xyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMubG9jYXRpb25zID0gdGVzdERhdGE7XHJcbiIsIi8qKiBJbmJveCB0ZXN0IGRhdGEgKiovXHJcbnZhciBNZXNzYWdlID0gcmVxdWlyZSgnLi4vbW9kZWxzL01lc3NhZ2UnKTtcclxuXHJcbnZhciBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG52YXIgdG9kYXkgPSBuZXcgRGF0ZSgpLFxyXG4gICAgeWVzdGVyZGF5ID0gbmV3IERhdGUoKSxcclxuICAgIGxhc3RXZWVrID0gbmV3IERhdGUoKSxcclxuICAgIG9sZERhdGUgPSBuZXcgRGF0ZSgpO1xyXG55ZXN0ZXJkYXkuc2V0RGF0ZSh5ZXN0ZXJkYXkuZ2V0RGF0ZSgpIC0gMSk7XHJcbmxhc3RXZWVrLnNldERhdGUobGFzdFdlZWsuZ2V0RGF0ZSgpIC0gMik7XHJcbm9sZERhdGUuc2V0RGF0ZShvbGREYXRlLmdldERhdGUoKSAtIDE2KTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IFtcclxuICAgIG5ldyBNZXNzYWdlKHtcclxuICAgICAgICBpZDogMSxcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbmV3IFRpbWUodG9kYXksIDExLCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnQ09ORklSTS1TdXNhbiBEZWUnLFxyXG4gICAgICAgIGNvbnRlbnQ6ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBsaW5rOiAnL2NvbnZlcnNhdGlvbi8xJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiAnJDcwJyxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy13YXJuaW5nJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgTWVzc2FnZSh7XHJcbiAgICAgICAgaWQ6IDMsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG5ldyBUaW1lKHllc3RlcmRheSwgMTMsIDAsIDApLFxyXG5cclxuICAgICAgICBzdWJqZWN0OiAnRG8geW91IGRvIFwiRXhvdGljIE1hc3NhZ2VcIj8nLFxyXG4gICAgICAgIGNvbnRlbnQ6ICdIaSwgSSB3YW50ZWQgdG8ga25vdyBpZiB5b3UgcGVyZm9ybSBhcyBwYXIgb2YgeW91ciBzZXJ2aWNlcy4uLicsXHJcbiAgICAgICAgbGluazogJy9jb252ZXJzYXRpb24vMycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXNoYXJlLWFsdCcsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgTWVzc2FnZSh7XHJcbiAgICAgICAgaWQ6IDIsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG5ldyBUaW1lKGxhc3RXZWVrLCAxMiwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0pvc2ggRGFuaWVsc29uJyxcclxuICAgICAgICBjb250ZW50OiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgbGluazogJy9jb252ZXJzYXRpb24vMicsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IE1lc3NhZ2Uoe1xyXG4gICAgICAgIGlkOiA0LFxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBuZXcgVGltZShvbGREYXRlLCAxNSwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0lucXVpcnknLFxyXG4gICAgICAgIGNvbnRlbnQ6ICdBbm90aGVyIHF1ZXN0aW9uIGZyb20gYW5vdGhlciBjbGllbnQuJyxcclxuICAgICAgICBsaW5rOiAnL2NvbnZlcnNhdGlvbi80JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tc2hhcmUtYWx0JyxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMubWVzc2FnZXMgPSB0ZXN0RGF0YTtcclxuIiwiLyoqIFNlcnZpY2VzIHRlc3QgZGF0YSAqKi9cclxudmFyIFNlcnZpY2UgPSByZXF1aXJlKCcuLi9tb2RlbHMvU2VydmljZScpO1xyXG5cclxudmFyIHRlc3REYXRhID0gW1xyXG4gICAgbmV3IFNlcnZpY2UgKHtcclxuICAgICAgICBuYW1lOiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgcHJpY2U6IDk1LFxyXG4gICAgICAgIGR1cmF0aW9uOiAxMjBcclxuICAgIH0pLFxyXG4gICAgbmV3IFNlcnZpY2Uoe1xyXG4gICAgICAgIG5hbWU6ICdUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgcHJpY2U6IDYwLFxyXG4gICAgICAgIGR1cmF0aW9uOiA2MFxyXG4gICAgfSksXHJcbiAgICBuZXcgU2VydmljZSh7XHJcbiAgICAgICAgbmFtZTogJ1NwZWNpYWwgb2lscycsXHJcbiAgICAgICAgcHJpY2U6IDk1LFxyXG4gICAgICAgIGlzQWRkb246IHRydWVcclxuICAgIH0pLFxyXG4gICAgbmV3IFNlcnZpY2Uoe1xyXG4gICAgICAgIG5hbWU6ICdTb21lIHNlcnZpY2UgZXh0cmEnLFxyXG4gICAgICAgIHByaWNlOiA0MCxcclxuICAgICAgICBkdXJhdGlvbjogMjAsXHJcbiAgICAgICAgaXNBZGRvbjogdHJ1ZVxyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMuc2VydmljZXMgPSB0ZXN0RGF0YTtcclxuIiwiLyoqIFxyXG4gICAgdGltZVNsb3RzXHJcbiAgICB0ZXN0aW5nIGRhdGFcclxuKiovXHJcblxyXG52YXIgVGltZSA9IHJlcXVpcmUoJy4uL3V0aWxzL1RpbWUnKTtcclxuXHJcbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbnZhciB0b2RheSA9IG5ldyBEYXRlKCksXHJcbiAgICB0b21vcnJvdyA9IG5ldyBEYXRlKCk7XHJcbnRvbW9ycm93LnNldERhdGUodG9tb3Jyb3cuZ2V0RGF0ZSgpICsgMSk7XHJcblxyXG52YXIgc3RvZGF5ID0gbW9tZW50KHRvZGF5KS5mb3JtYXQoJ1lZWVktTU0tREQnKSxcclxuICAgIHN0b21vcnJvdyA9IG1vbWVudCh0b21vcnJvdykuZm9ybWF0KCdZWVlZLU1NLUREJyk7XHJcblxyXG52YXIgdGVzdERhdGExID0gW1xyXG4gICAgVGltZSh0b2RheSwgOSwgMTUpLFxyXG4gICAgVGltZSh0b2RheSwgMTEsIDMwKSxcclxuICAgIFRpbWUodG9kYXksIDEyLCAwKSxcclxuICAgIFRpbWUodG9kYXksIDEyLCAzMCksXHJcbiAgICBUaW1lKHRvZGF5LCAxNiwgMTUpLFxyXG4gICAgVGltZSh0b2RheSwgMTgsIDApLFxyXG4gICAgVGltZSh0b2RheSwgMTgsIDMwKSxcclxuICAgIFRpbWUodG9kYXksIDE5LCAwKSxcclxuICAgIFRpbWUodG9kYXksIDE5LCAzMCksXHJcbiAgICBUaW1lKHRvZGF5LCAyMSwgMzApLFxyXG4gICAgVGltZSh0b2RheSwgMjIsIDApXHJcbl07XHJcblxyXG52YXIgdGVzdERhdGEyID0gW1xyXG4gICAgVGltZSh0b21vcnJvdywgOCwgMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMCwgMzApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTEsIDApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTEsIDMwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEyLCAwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEyLCAzMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMywgMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMywgMzApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTQsIDQ1KSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDE2LCAwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDE2LCAzMClcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YUJ1c3kgPSBbXHJcbl07XHJcblxyXG52YXIgdGVzdERhdGEgPSB7XHJcbiAgICAnZGVmYXVsdCc6IHRlc3REYXRhQnVzeVxyXG59O1xyXG50ZXN0RGF0YVtzdG9kYXldID0gdGVzdERhdGExO1xyXG50ZXN0RGF0YVtzdG9tb3Jyb3ddID0gdGVzdERhdGEyO1xyXG5cclxuZXhwb3J0cy50aW1lU2xvdHMgPSB0ZXN0RGF0YTtcclxuIiwiLyoqXHJcbiAgICBVdGlsaXR5IHRvIGhlbHAgdHJhY2sgdGhlIHN0YXRlIG9mIGNhY2hlZCBkYXRhXHJcbiAgICBtYW5hZ2luZyB0aW1lLCBwcmVmZXJlbmNlIGFuZCBpZiBtdXN0IGJlIHJldmFsaWRhdGVkXHJcbiAgICBvciBub3QuXHJcbiAgICBcclxuICAgIEl0cyBqdXN0IG1hbmFnZXMgbWV0YSBkYXRhLCBidXQgbm90IHRoZSBkYXRhIHRvIGJlIGNhY2hlZC5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbmZ1bmN0aW9uIENhY2hlQ29udHJvbChvcHRpb25zKSB7XHJcbiAgICBcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICAgIC8vIEEgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBvclxyXG4gICAgLy8gQW4gb2JqZWN0IHdpdGggZGVzaXJlZCB1bml0cyBhbmQgYW1vdW50LCBhbGwgb3B0aW9uYWwsXHJcbiAgICAvLyBhbnkgY29tYmluYXRpb24gd2l0aCBhbG1vc3Qgb25lIHNwZWNpZmllZCwgc2FtcGxlOlxyXG4gICAgLy8geyB5ZWFyczogMCwgbW9udGhzOiAwLCB3ZWVrczogMCwgXHJcbiAgICAvLyAgIGRheXM6IDAsIGhvdXJzOiAwLCBtaW51dGVzOiAwLCBzZWNvbmRzOiAwLCBtaWxsaXNlY29uZHM6IDAgfVxyXG4gICAgdGhpcy50dGwgPSBtb21lbnQuZHVyYXRpb24ob3B0aW9ucy50dGwpLmFzTWlsbGlzZWNvbmRzKCk7XHJcbiAgICB0aGlzLmxhdGVzdCA9IG9wdGlvbnMubGF0ZXN0IHx8IG51bGw7XHJcblxyXG4gICAgdGhpcy5tdXN0UmV2YWxpZGF0ZSA9IGZ1bmN0aW9uIG11c3RSZXZhbGlkYXRlKCkge1xyXG4gICAgICAgIHZhciB0ZGlmZiA9IHRoaXMubGF0ZXN0ICYmIG5ldyBEYXRlKCkgLSB0aGlzLmxhdGVzdCB8fCBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XHJcbiAgICAgICAgcmV0dXJuIHRkaWZmID4gdGhpcy50dGw7XHJcbiAgICB9O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENhY2hlQ29udHJvbDtcclxuIiwiLyoqXHJcbiAgICBOZXcgRnVuY3Rpb24gbWV0aG9kOiAnX2RlbGF5ZWQnLlxyXG4gICAgSXQgcmV0dXJucyBhIG5ldyBmdW5jdGlvbiwgd3JhcHBpbmcgdGhlIG9yaWdpbmFsIG9uZSxcclxuICAgIHRoYXQgb25jZSBpdHMgY2FsbCB3aWxsIGRlbGF5IHRoZSBleGVjdXRpb24gdGhlIGdpdmVuIG1pbGxpc2Vjb25kcyxcclxuICAgIHVzaW5nIGEgc2V0VGltZW91dC5cclxuICAgIFRoZSBuZXcgZnVuY3Rpb24gcmV0dXJucyAndW5kZWZpbmVkJyBzaW5jZSBpdCBoYXMgbm90IHRoZSByZXN1bHQsXHJcbiAgICBiZWNhdXNlIG9mIHRoYXQgaXMgb25seSBzdWl0YWJsZSB3aXRoIHJldHVybi1mcmVlIGZ1bmN0aW9ucyBcclxuICAgIGxpa2UgZXZlbnQgaGFuZGxlcnMuXHJcbiAgICBcclxuICAgIFdoeTogc29tZXRpbWVzLCB0aGUgaGFuZGxlciBmb3IgYW4gZXZlbnQgbmVlZHMgdG8gYmUgZXhlY3V0ZWRcclxuICAgIGFmdGVyIGEgZGVsYXkgaW5zdGVhZCBvZiBpbnN0YW50bHkuXHJcbioqL1xyXG5GdW5jdGlvbi5wcm90b3R5cGUuX2RlbGF5ZWQgPSBmdW5jdGlvbiBkZWxheWVkKG1pbGxpc2Vjb25kcykge1xyXG4gICAgdmFyIGZuID0gdGhpcztcclxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgY29udGV4dCA9IHRoaXMsXHJcbiAgICAgICAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZuLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xyXG4gICAgICAgIH0sIG1pbGxpc2Vjb25kcyk7XHJcbiAgICB9O1xyXG59O1xyXG4iLCIvKipcclxuICAgIEV4dGVuZGluZyB0aGUgRnVuY3Rpb24gY2xhc3Mgd2l0aCBhbiBpbmhlcml0cyBtZXRob2QuXHJcbiAgICBcclxuICAgIFRoZSBpbml0aWFsIGxvdyBkYXNoIGlzIHRvIG1hcmsgaXQgYXMgbm8tc3RhbmRhcmQuXHJcbioqL1xyXG5GdW5jdGlvbi5wcm90b3R5cGUuX2luaGVyaXRzID0gZnVuY3Rpb24gX2luaGVyaXRzKHN1cGVyQ3Rvcikge1xyXG4gICAgdGhpcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcjoge1xyXG4gICAgICAgICAgICB2YWx1ZTogdGhpcyxcclxuICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBVdGlsaXR5IHRoYXQgYWxsb3dzIHRvIGtlZXAgYW4gb3JpZ2luYWwgbW9kZWwgdW50b3VjaGVkXHJcbiAgICB3aGlsZSBlZGl0aW5nIGEgdmVyc2lvbiwgaGVscGluZyBzeW5jaHJvbml6ZSBib3RoXHJcbiAgICB3aGVuIGRlc2lyZWQgYnkgcHVzaC9wdWxsL3N5bmMtaW5nLlxyXG4gICAgXHJcbiAgICBJdHMgdGhlIHVzdWFsIHdheSB0byB3b3JrIG9uIGZvcm1zLCB3aGVyZSBhbiBpbiBtZW1vcnlcclxuICAgIG1vZGVsIGNhbiBiZSB1c2VkIGJ1dCBpbiBhIGNvcHkgc28gY2hhbmdlcyBkb2Vzbid0IGFmZmVjdHNcclxuICAgIG90aGVyIHVzZXMgb2YgdGhlIGluLW1lbW9yeSBtb2RlbCAoYW5kIGF2b2lkcyByZW1vdGUgc3luY2luZylcclxuICAgIHVudGlsIHRoZSBjb3B5IHdhbnQgdG8gYmUgcGVyc2lzdGVkIGJ5IHB1c2hpbmcgaXQsIG9yIGJlaW5nXHJcbiAgICBkaXNjYXJkZWQgb3IgcmVmcmVzaGVkIHdpdGggYSByZW1vdGVseSB1cGRhdGVkIG9yaWdpbmFsIG1vZGVsLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcclxuXHJcbmZ1bmN0aW9uIE1vZGVsVmVyc2lvbihvcmlnaW5hbCkge1xyXG4gICAgXHJcbiAgICBFdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5vcmlnaW5hbCA9IG9yaWdpbmFsO1xyXG4gICAgXHJcbiAgICAvLyBDcmVhdGUgdmVyc2lvblxyXG4gICAgLy8gKHVwZGF0ZVdpdGggdGFrZXMgY2FyZSB0byBzZXQgdGhlIHNhbWUgZGF0YVRpbWVzdGFtcClcclxuICAgIHRoaXMudmVyc2lvbiA9IG9yaWdpbmFsLm1vZGVsLmNsb25lKCk7XHJcbiAgICBcclxuICAgIC8vIENvbXB1dGVkIHRoYXQgdGVzdCBlcXVhbGl0eSwgYWxsb3dpbmcgYmVpbmcgbm90aWZpZWQgb2YgY2hhbmdlc1xyXG4gICAgLy8gQSByYXRlTGltaXQgaXMgdXNlZCBvbiBlYWNoIHRvIGF2b2lkIHNldmVyYWwgc3luY3Job25vdXMgbm90aWZpY2F0aW9ucy5cclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgUmV0dXJucyB0cnVlIHdoZW4gYm90aCB2ZXJzaW9ucyBoYXMgdGhlIHNhbWUgdGltZXN0YW1wXHJcbiAgICAqKi9cclxuICAgIHRoaXMuYXJlRGlmZmVyZW50ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uIGFyZURpZmZlcmVudCgpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLm9yaWdpbmFsLm1vZGVsLmRhdGFUaW1lc3RhbXAoKSAhPT0gXHJcbiAgICAgICAgICAgIHRoaXMudmVyc2lvbi5tb2RlbC5kYXRhVGltZXN0YW1wKClcclxuICAgICAgICApO1xyXG4gICAgfSwgdGhpcykuZXh0ZW5kKHsgcmF0ZUxpbWl0OiAwIH0pO1xyXG4gICAgLyoqXHJcbiAgICAgICAgUmV0dXJucyB0cnVlIHdoZW4gdGhlIHZlcnNpb24gaGFzIG5ld2VyIGNoYW5nZXMgdGhhblxyXG4gICAgICAgIHRoZSBvcmlnaW5hbFxyXG4gICAgKiovXHJcbiAgICB0aGlzLmlzTmV3ZXIgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24gaXNOZXdlcigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLm9yaWdpbmFsLm1vZGVsLmRhdGFUaW1lc3RhbXAoKSA8IFxyXG4gICAgICAgICAgICB0aGlzLnZlcnNpb24ubW9kZWwuZGF0YVRpbWVzdGFtcCgpXHJcbiAgICAgICAgKTtcclxuICAgIH0sIHRoaXMpLmV4dGVuZCh7IHJhdGVMaW1pdDogMCB9KTtcclxuICAgIC8qKlxyXG4gICAgICAgIFJldHVybnMgdHJ1ZSB3aGVuIHRoZSB2ZXJzaW9uIGhhcyBvbGRlciBjaGFuZ2VzIHRoYW5cclxuICAgICAgICB0aGUgb3JpZ2luYWxcclxuICAgICoqL1xyXG4gICAgdGhpcy5pc09ic29sZXRlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uIGlzQ29tcHV0ZWQoKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5vcmlnaW5hbC5tb2RlbC5kYXRhVGltZXN0YW1wKCkgPiBcclxuICAgICAgICAgICAgdGhpcy52ZXJzaW9uLm1vZGVsLmRhdGFUaW1lc3RhbXAoKVxyXG4gICAgICAgICk7XHJcbiAgICB9LCB0aGlzKS5leHRlbmQoeyByYXRlTGltaXQ6IDAgfSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTW9kZWxWZXJzaW9uO1xyXG5cclxuTW9kZWxWZXJzaW9uLl9pbmhlcml0cyhFdmVudEVtaXR0ZXIpO1xyXG5cclxuLyoqXHJcbiAgICBTZW5kcyB0aGUgdmVyc2lvbiBjaGFuZ2VzIHRvIHRoZSBvcmlnaW5hbFxyXG4gICAgXHJcbiAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgZXZlbklmTmV3ZXI6IGZhbHNlXHJcbiAgICB9XHJcbioqL1xyXG5Nb2RlbFZlcnNpb24ucHJvdG90eXBlLnB1bGwgPSBmdW5jdGlvbiBwdWxsKG9wdGlvbnMpIHtcclxuXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIFxyXG4gICAgLy8gQnkgZGVmYXVsdCwgbm90aGluZyB0byBkbywgb3IgYXZvaWQgb3ZlcndyaXRlIGNoYW5nZXMuXHJcbiAgICB2YXIgcmVzdWx0ID0gZmFsc2UsXHJcbiAgICAgICAgcm9sbGJhY2sgPSBudWxsO1xyXG4gICAgXHJcbiAgICBpZiAob3B0aW9ucy5ldmVuSWZOZXdlciB8fCAhdGhpcy5pc05ld2VyKCkpIHtcclxuICAgICAgICAvLyBVcGRhdGUgdmVyc2lvbiB3aXRoIHRoZSBvcmlnaW5hbCBkYXRhLFxyXG4gICAgICAgIC8vIGNyZWF0aW5nIGZpcnN0IGEgcm9sbGJhY2sgZnVuY3Rpb24uXHJcbiAgICAgICAgcm9sbGJhY2sgPSBjcmVhdGVSb2xsYmFja0Z1bmN0aW9uKHRoaXMudmVyc2lvbik7XHJcbiAgICAgICAgLy8gRXZlciBkZWVwQ29weSwgc2luY2Ugb25seSBwcm9wZXJ0aWVzIGFuZCBmaWVsZHMgZnJvbSBtb2RlbHNcclxuICAgICAgICAvLyBhcmUgY29waWVkIGFuZCB0aGF0IG11c3QgYXZvaWQgY2lyY3VsYXIgcmVmZXJlbmNlc1xyXG4gICAgICAgIC8vIFRoZSBtZXRob2QgdXBkYXRlV2l0aCB0YWtlcyBjYXJlIHRvIHNldCB0aGUgc2FtZSBkYXRhVGltZXN0YW1wOiAgICAgICAgXHJcbiAgICAgICAgdGhpcy52ZXJzaW9uLm1vZGVsLnVwZGF0ZVdpdGgodGhpcy5vcmlnaW5hbCwgdHJ1ZSk7XHJcbiAgICAgICAgLy8gRG9uZVxyXG4gICAgICAgIHJlc3VsdCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5lbWl0KCdwdWxsJywgcmVzdWx0LCByb2xsYmFjayk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBEaXNjYXJkIHRoZSB2ZXJzaW9uIGNoYW5nZXMgZ2V0dGluZyB0aGUgb3JpZ2luYWxcclxuICAgIGRhdGEuXHJcbiAgICBcclxuICAgIG9wdGlvbnM6IHtcclxuICAgICAgICBldmVuSWZPYnNvbGV0ZTogZmFsc2VcclxuICAgIH1cclxuKiovXHJcbk1vZGVsVmVyc2lvbi5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uIHB1c2gob3B0aW9ucykge1xyXG4gICAgXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIFxyXG4gICAgLy8gQnkgZGVmYXVsdCwgbm90aGluZyB0byBkbywgb3IgYXZvaWQgb3ZlcndyaXRlIGNoYW5nZXMuXHJcbiAgICB2YXIgcmVzdWx0ID0gZmFsc2UsXHJcbiAgICAgICAgcm9sbGJhY2sgPSBudWxsO1xyXG5cclxuICAgIGlmIChvcHRpb25zLmV2ZW5JZk9ic29sZXRlIHx8ICF0aGlzLmlzT2Jzb2xldGUoKSkge1xyXG4gICAgICAgIC8vIFVwZGF0ZSBvcmlnaW5hbCwgY3JlYXRpbmcgZmlyc3QgYSByb2xsYmFjayBmdW5jdGlvbi5cclxuICAgICAgICByb2xsYmFjayA9IGNyZWF0ZVJvbGxiYWNrRnVuY3Rpb24odGhpcy5vcmlnaW5hbCk7XHJcbiAgICAgICAgLy8gRXZlciBkZWVwQ29weSwgc2luY2Ugb25seSBwcm9wZXJ0aWVzIGFuZCBmaWVsZHMgZnJvbSBtb2RlbHNcclxuICAgICAgICAvLyBhcmUgY29waWVkIGFuZCB0aGF0IG11c3QgYXZvaWQgY2lyY3VsYXIgcmVmZXJlbmNlc1xyXG4gICAgICAgIC8vIFRoZSBtZXRob2QgdXBkYXRlV2l0aCB0YWtlcyBjYXJlIHRvIHNldCB0aGUgc2FtZSBkYXRhVGltZXN0YW1wLlxyXG4gICAgICAgIHRoaXMub3JpZ2luYWwubW9kZWwudXBkYXRlV2l0aCh0aGlzLnZlcnNpb24sIHRydWUpO1xyXG4gICAgICAgIC8vIERvbmVcclxuICAgICAgICByZXN1bHQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZW1pdCgncHVzaCcsIHJlc3VsdCwgcm9sbGJhY2spO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgU2V0cyBvcmlnaW5hbCBhbmQgdmVyc2lvbiBvbiB0aGUgc2FtZSB2ZXJzaW9uXHJcbiAgICBieSBnZXR0aW5nIHRoZSBuZXdlc3Qgb25lLlxyXG4qKi9cclxuTW9kZWxWZXJzaW9uLnByb3RvdHlwZS5zeW5jID0gZnVuY3Rpb24gc3luYygpIHtcclxuICAgIFxyXG4gICAgaWYgKHRoaXMuaXNOZXdlcigpKVxyXG4gICAgICAgIHJldHVybiB0aGlzLnB1c2goKTtcclxuICAgIGVsc2UgaWYgKHRoaXMuaXNPYnNvbGV0ZSgpKVxyXG4gICAgICAgIHJldHVybiB0aGlzLnB1bGwoKTtcclxuICAgIGVsc2VcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbn07XHJcblxyXG4vKipcclxuICAgIFV0aWxpdHkgdGhhdCBjcmVhdGUgYSBmdW5jdGlvbiBhYmxlIHRvIFxyXG4gICAgcGVyZm9ybSBhIGRhdGEgcm9sbGJhY2sgb24gZXhlY3V0aW9uLCB1c2VmdWxcclxuICAgIHRvIHBhc3Mgb24gdGhlIGV2ZW50cyB0byBhbGxvdyByZWFjdCB1cG9uIGNoYW5nZXNcclxuICAgIG9yIGV4dGVybmFsIHN5bmNocm9uaXphdGlvbiBmYWlsdXJlcy5cclxuKiovXHJcbmZ1bmN0aW9uIGNyZWF0ZVJvbGxiYWNrRnVuY3Rpb24obW9kZWxJbnN0YW5jZSkge1xyXG4gICAgLy8gUHJldmlvdXMgZnVuY3Rpb24gY3JlYXRpb24sIGdldCBOT1cgdGhlIGluZm9ybWF0aW9uIHRvXHJcbiAgICAvLyBiZSBiYWNrZWQgZm9yIGxhdGVyLlxyXG4gICAgdmFyIGJhY2tlZERhdGEgPSBtb2RlbEluc3RhbmNlLm1vZGVsLnRvUGxhaW5PYmplY3QodHJ1ZSksXHJcbiAgICAgICAgYmFja2VkVGltZXN0YW1wID0gbW9kZWxJbnN0YW5jZS5tb2RlbC5kYXRhVGltZXN0YW1wKCk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIHRoZSBmdW5jdGlvbiB0aGF0ICptYXkqIGdldCBleGVjdXRlZCBsYXRlciwgYWZ0ZXJcclxuICAgIC8vIGNoYW5nZXMgd2VyZSBkb25lIGluIHRoZSBtb2RlbEluc3RhbmNlLlxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIHJvbGxiYWNrKCkge1xyXG4gICAgICAgIC8vIFNldCB0aGUgYmFja2VkIGRhdGFcclxuICAgICAgICBtb2RlbEluc3RhbmNlLm1vZGVsLnVwZGF0ZVdpdGgoYmFja2VkRGF0YSk7XHJcbiAgICAgICAgLy8gQW5kIHRoZSB0aW1lc3RhbXBcclxuICAgICAgICBtb2RlbEluc3RhbmNlLm1vZGVsLmRhdGFUaW1lc3RhbXAoYmFja2VkVGltZXN0YW1wKTtcclxuICAgIH07XHJcbn1cclxuIiwiLyoqXHJcbiAgICBSZW1vdGVNb2RlbCBjbGFzcy5cclxuICAgIFxyXG4gICAgSXQgaGVscHMgbWFuYWdpbmcgYSBtb2RlbCBpbnN0YW5jZSwgbW9kZWwgdmVyc2lvbnNcclxuICAgIGZvciBpbiBtZW1vcnkgbW9kaWZpY2F0aW9uLCBhbmQgdGhlIHByb2Nlc3MgdG8gXHJcbiAgICByZWNlaXZlIG9yIHNlbmQgdGhlIG1vZGVsIGRhdGFcclxuICAgIHRvIGEgcmVtb3RlIHNvdXJjZXMsIHdpdGggZ2x1ZSBjb2RlIGZvciB0aGUgdGFza3NcclxuICAgIGFuZCBzdGF0ZSBwcm9wZXJ0aWVzLlxyXG4gICAgXHJcbiAgICBFdmVyeSBpbnN0YW5jZSBvciBzdWJjbGFzcyBtdXN0IGltcGxlbWVudFxyXG4gICAgdGhlIGZldGNoIGFuZCBwdWxsIG1ldGhvZHMgdGhhdCBrbm93cyB0aGUgc3BlY2lmaWNzXHJcbiAgICBvZiB0aGUgcmVtb3Rlcy5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBNb2RlbFZlcnNpb24gPSByZXF1aXJlKCcuLi91dGlscy9Nb2RlbFZlcnNpb24nKSxcclxuICAgIENhY2hlQ29udHJvbCA9IHJlcXVpcmUoJy4uL3V0aWxzL0NhY2hlQ29udHJvbCcpLFxyXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgbG9jYWxmb3JhZ2UgPSByZXF1aXJlKCdsb2NhbGZvcmFnZScpLFxyXG4gICAgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xyXG5cclxuZnVuY3Rpb24gUmVtb3RlTW9kZWwob3B0aW9ucykge1xyXG5cclxuICAgIEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xyXG4gICAgXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIFxyXG4gICAgdmFyIGZpcnN0VGltZUxvYWQgPSB0cnVlO1xyXG4gICAgXHJcbiAgICAvLyBNYXJrcyBhIGxvY2sgbG9hZGluZyBpcyBoYXBwZW5pbmcsIGFueSB1c2VyIGNvZGVcclxuICAgIC8vIG11c3Qgd2FpdCBmb3IgaXRcclxuICAgIHRoaXMuaXNMb2FkaW5nID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcbiAgICAvLyBNYXJrcyBhIGxvY2sgc2F2aW5nIGlzIGhhcHBlbmluZywgYW55IHVzZXIgY29kZVxyXG4gICAgLy8gbXVzdCB3YWl0IGZvciBpdFxyXG4gICAgdGhpcy5pc1NhdmluZyA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgLy8gTWFya3MgYSBiYWNrZ3JvdW5kIHN5bmNocm9uaXphdGlvbjogbG9hZCBvciBzYXZlLFxyXG4gICAgLy8gdXNlciBjb2RlIGtub3dzIGlzIGhhcHBlbmluZyBidXQgY2FuIGNvbnRpbnVlXHJcbiAgICAvLyB1c2luZyBjYWNoZWQgZGF0YVxyXG4gICAgdGhpcy5pc1N5bmNpbmcgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuICAgIC8vIFV0aWxpdHkgdG8ga25vdyB3aGV0aGVyIGFueSBsb2NraW5nIG9wZXJhdGlvbiBpc1xyXG4gICAgLy8gaGFwcGVuaW5nLlxyXG4gICAgLy8gSnVzdCBsb2FkaW5nIG9yIHNhdmluZ1xyXG4gICAgdGhpcy5pc0xvY2tlZCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmlzTG9hZGluZygpIHx8IHRoaXMuaXNTYXZpbmcoKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICBpZiAoIW9wdGlvbnMuZGF0YSlcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlbW90ZU1vZGVsIGRhdGEgbXVzdCBiZSBzZXQgb24gY29uc3RydWN0b3IgYW5kIG5vIGNoYW5nZWQgbGF0ZXInKTtcclxuICAgIHRoaXMuZGF0YSA9IG9wdGlvbnMuZGF0YTtcclxuICAgIFxyXG4gICAgdGhpcy5jYWNoZSA9IG5ldyBDYWNoZUNvbnRyb2woe1xyXG4gICAgICAgIHR0bDogb3B0aW9ucy50dGxcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBPcHRpb25hbCBuYW1lIHVzZWQgdG8gcGVyc2lzdCBhIGNvcHkgb2YgdGhlIGRhdGEgYXMgcGxhaW4gb2JqZWN0XHJcbiAgICAvLyBpbiB0aGUgbG9jYWwgc3RvcmFnZSBvbiBldmVyeSBzdWNjZXNzZnVsbHkgbG9hZC9zYXZlIG9wZXJhdGlvbi5cclxuICAgIC8vIFdpdGggbm8gbmFtZSwgbm8gc2F2ZWQgKGRlZmF1bHQpLlxyXG4gICAgLy8gSXQgdXNlcyAnbG9jYWxmb3JhZ2UnLCBzbyBtYXkgYmUgbm90IHNhdmVkIHVzaW5nIGxvY2FsU3RvcmFnZSBhY3R1YWxseSxcclxuICAgIC8vIGJ1dCBhbnkgc3VwcG9ydGVkIGFuZCBpbml0aWFsaXplZCBzdG9yYWdlIHN5c3RlbSwgbGlrZSBXZWJTUUwsIEluZGV4ZWREQiBvciBMb2NhbFN0b3JhZ2UuXHJcbiAgICAvLyBsb2NhbGZvcmFnZSBtdXN0IGhhdmUgYSBzZXQtdXAgcHJldmlvdXMgdXNlIG9mIHRoaXMgb3B0aW9uLlxyXG4gICAgdGhpcy5sb2NhbFN0b3JhZ2VOYW1lID0gb3B0aW9ucy5sb2NhbFN0b3JhZ2VOYW1lIHx8IG51bGw7XHJcbiAgICBcclxuICAgIC8vIFJlY29tbWVuZGVkIHdheSB0byBnZXQgdGhlIGluc3RhbmNlIGRhdGFcclxuICAgIC8vIHNpbmNlIGl0IGVuc3VyZXMgdG8gbGF1bmNoIGEgbG9hZCBvZiB0aGVcclxuICAgIC8vIGRhdGEgZWFjaCB0aW1lIGlzIGFjY2Vzc2VkIHRoaXMgd2F5LlxyXG4gICAgdGhpcy5nZXREYXRhID0gZnVuY3Rpb24gZ2V0RGF0YSgpIHtcclxuICAgICAgICB0aGlzLmxvYWQoKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5kYXRhO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLm5ld1ZlcnNpb24gPSBmdW5jdGlvbiBuZXdWZXJzaW9uKCkge1xyXG4gICAgICAgIHZhciB2ID0gbmV3IE1vZGVsVmVyc2lvbih0aGlzLmRhdGEpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgdmVyc2lvbiBkYXRhIHdpdGggdGhlIG9yaWdpbmFsXHJcbiAgICAgICAgLy8gYWZ0ZXIgYSBsb2NrIGxvYWQgZmluaXNoLCBsaWtlIHRoZSBmaXJzdCB0aW1lLFxyXG4gICAgICAgIC8vIHNpbmNlIHRoZSBVSSB0byBlZGl0IHRoZSB2ZXJzaW9uIHdpbGwgYmUgbG9ja1xyXG4gICAgICAgIC8vIGluIHRoZSBtaWRkbGUuXHJcbiAgICAgICAgdGhpcy5pc0xvYWRpbmcuc3Vic2NyaWJlKGZ1bmN0aW9uIChpc0l0KSB7XHJcbiAgICAgICAgICAgIGlmICghaXNJdCkge1xyXG4gICAgICAgICAgICAgICAgdi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBTYXZlIHRoZSByZW1vdGUgd2hlbiBzdWNjZXNzZnVsbHkgcHVzaGVkIHRoZSBuZXcgdmVyc2lvblxyXG4gICAgICAgIHYub24oJ3B1c2gnLCBmdW5jdGlvbihzdWNjZXNzLCByb2xsYmFjaykge1xyXG4gICAgICAgICAgICBpZiAoc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zYXZlKClcclxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgdmVyc2lvbiBkYXRhIHdpdGggdGhlIG5ldyBvbmVcclxuICAgICAgICAgICAgICAgICAgICAvLyBmcm9tIHRoZSByZW1vdGUsIHRoYXQgbWF5IGluY2x1ZGUgcmVtb3RlIGNvbXB1dGVkXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdmFsdWVzOlxyXG4gICAgICAgICAgICAgICAgICAgIHYucHVsbCh7IGV2ZW5JZk5ld2VyOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBUbyBjYXRjaCB0aGUgZXJyb3IgaXMgaW1wb3J0YW50IFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIGF2b2lkICd1bmtub3cgZXJyb3IncyBmcm9tIGJlaW5nXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gbG9nZ2VkIG9uIHRoZSBjb25zb2xlLlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBlcnJvciBjYW4gYmUgcmVhZCBieSBsaXN0ZW5pbmcgdGhlICdlcnJvcicgZXZlbnQuXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUGVyZm9ybXMgYSByb2xsYmFjayBvZiB0aGUgb3JpZ2luYWwgbW9kZWxcclxuICAgICAgICAgICAgICAgICAgICByb2xsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSB2ZXJzaW9uIGRhdGEga2VlcHMgdW50b3VjaGVkLCB1c2VyIG1heSB3YW50IHRvIHJldHJ5XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gb3IgbWFkZSBjaGFuZ2VzIG9uIGl0cyB1bi1zYXZlZCBkYXRhLlxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICByZXR1cm4gdjtcclxuICAgIH07XHJcbiAgICBcclxuICAgIHRoaXMuZmV0Y2ggPSBvcHRpb25zLmZldGNoIHx8IGZ1bmN0aW9uIGZldGNoKCkgeyB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCcpOyB9O1xyXG4gICAgdGhpcy5wdXNoID0gb3B0aW9ucy5wdXNoIHx8IGZ1bmN0aW9uIHB1c2goKSB7IHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGQnKTsgfTtcclxuXHJcbiAgICB2YXIgbG9hZEZyb21SZW1vdGUgPSBmdW5jdGlvbiBsb2FkRnJvbVJlbW90ZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5mZXRjaCgpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHNlcnZlckRhdGEpIHtcclxuICAgICAgICAgICAgaWYgKHNlcnZlckRhdGEpIHtcclxuICAgICAgICAgICAgICAgIC8vIEV2ZXIgZGVlcENvcHksIHNpbmNlIHBsYWluIGRhdGEgZnJvbSB0aGUgc2VydmVyIChhbmQgYW55XHJcbiAgICAgICAgICAgICAgICAvLyBpbiBiZXR3ZWVuIGNvbnZlcnNpb24gb24gJ2ZlY3RoJykgY2Fubm90IGhhdmUgY2lyY3VsYXJcclxuICAgICAgICAgICAgICAgIC8vIHJlZmVyZW5jZXM6XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEubW9kZWwudXBkYXRlV2l0aChzZXJ2ZXJEYXRhLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBwZXJzaXN0ZW50IGxvY2FsIGNvcHk/XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sb2NhbFN0b3JhZ2VOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxmb3JhZ2Uuc2V0SXRlbSh0aGlzLmxvY2FsU3RvcmFnZU5hbWUsIHNlcnZlckRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZW1vdGUgbW9kZWwgZGlkIG5vdCByZXR1cm5lZCBkYXRhLCByZXNwb25zZSBtdXN0IGJlIGEgXCJOb3QgRm91bmRcIicpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBFdmVudFxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc0xvYWRpbmcoKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdsb2FkJywgc2VydmVyRGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3N5bmNlZCcsIHNlcnZlckRhdGEpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBGaW5hbGx5OiBjb21tb24gdGFza3Mgb24gc3VjY2VzcyBvciBlcnJvclxyXG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZyhmYWxzZSk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNTeW5jaW5nKGZhbHNlKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2FjaGUubGF0ZXN0ID0gbmV3IERhdGUoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF0YTtcclxuICAgICAgICB9LmJpbmQodGhpcykpXHJcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xyXG5cclxuICAgICAgICAgICAgdmFyIHdhc0xvYWQgPSB0aGlzLmlzTG9hZGluZygpO1xyXG5cclxuICAgICAgICAgICAgLy8gRmluYWxseTogY29tbW9uIHRhc2tzIG9uIHN1Y2Nlc3Mgb3IgZXJyb3JcclxuICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICB0aGlzLmlzU3luY2luZyhmYWxzZSk7XHJcblxyXG4gICAgICAgICAgICAvLyBFdmVudFxyXG4gICAgICAgICAgICB2YXIgZXJyUGtnID0ge1xyXG4gICAgICAgICAgICAgICAgdGFzazogd2FzTG9hZCA/ICdsb2FkJyA6ICdzeW5jJyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLy8gQmUgY2FyZWZ1bCB3aXRoICdlcnJvcicgZXZlbnQsIGlzIHNwZWNpYWwgYW5kIHN0b3BzIGV4ZWN1dGlvbiBvbiBlbWl0XHJcbiAgICAgICAgICAgIC8vIGlmIG5vIGxpc3RlbmVycyBhdHRhY2hlZDogb3ZlcndyaXR0aW5nIHRoYXQgYmVoYXZpb3IgYnkganVzdFxyXG4gICAgICAgICAgICAvLyBwcmludCBvbiBjb25zb2xlIHdoZW4gbm90aGluZywgb3IgZW1pdCBpZiBzb21lIGxpc3RlbmVyOlxyXG4gICAgICAgICAgICBpZiAoRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQodGhpcywgJ2Vycm9yJykgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyUGtnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIExvZyBpdCB3aGVuIG5vdCBoYW5kbGVkIChldmVuIGlmIHRoZSBwcm9taXNlIGVycm9yIGlzIGhhbmRsZWQpXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdSZW1vdGVNb2RlbCBFcnJvcicsIGVyclBrZyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFJldGhyb3cgZXJyb3JcclxuICAgICAgICAgICAgcmV0dXJuIGVycjtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmxvYWQgPSBmdW5jdGlvbiBsb2FkKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmNhY2hlLm11c3RSZXZhbGlkYXRlKCkpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChmaXJzdFRpbWVMb2FkKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcodHJ1ZSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNTeW5jaW5nKHRydWUpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHByb21pc2UgPSBudWxsO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gSWYgbG9jYWwgc3RvcmFnZSBpcyBzZXQgZm9yIHRoaXMsIGxvYWQgZmlyc3RcclxuICAgICAgICAgICAgLy8gZnJvbSBsb2NhbCwgdGhlbiBmb2xsb3cgd2l0aCBzeW5jaW5nIGZyb20gcmVtb3RlXHJcbiAgICAgICAgICAgIGlmIChmaXJzdFRpbWVMb2FkICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmxvY2FsU3RvcmFnZU5hbWUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBwcm9taXNlID0gbG9jYWxmb3JhZ2UuZ2V0SXRlbSh0aGlzLmxvY2FsU3RvcmFnZU5hbWUpXHJcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihsb2NhbERhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobG9jYWxEYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5tb2RlbC51cGRhdGVXaXRoKGxvY2FsRGF0YSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBMb2FkIGRvbmU6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pc1N5bmNpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTG9jYWwgbG9hZCBkb25lLCBkbyBhIGJhY2tncm91bmRcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3RlIGxvYWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZEZyb21SZW1vdGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8ganVzdCBkb24ndCB3YWl0LCByZXR1cm4gY3VycmVudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkYXRhXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXaGVuIG5vIGRhdGEsIHBlcmZvcm0gYSByZW1vdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbG9hZCBhbmQgd2FpdCBmb3IgaXQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBsb2FkRnJvbVJlbW90ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBQZXJmb3JtIHRoZSByZW1vdGUgbG9hZDpcclxuICAgICAgICAgICAgICAgIHByb21pc2UgPSBsb2FkRnJvbVJlbW90ZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBGaXJzdCB0aW1lLCBibG9ja2luZyBsb2FkOlxyXG4gICAgICAgICAgICAvLyBpdCByZXR1cm5zIHdoZW4gdGhlIGxvYWQgcmV0dXJuc1xyXG4gICAgICAgICAgICBpZiAoZmlyc3RUaW1lTG9hZCkge1xyXG4gICAgICAgICAgICAgICAgZmlyc3RUaW1lTG9hZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgLy8gUmV0dXJucyB0aGUgcHJvbWlzZSBhbmQgd2lsbCB3YWl0IGZvciB0aGUgZmlyc3QgbG9hZDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gQmFja2dyb3VuZCBsb2FkOiBpcyBsb2FkaW5nIHN0aWxsXHJcbiAgICAgICAgICAgICAgICAvLyBidXQgd2UgaGF2ZSBjYWNoZWQgZGF0YSBzbyB3ZSB1c2VcclxuICAgICAgICAgICAgICAgIC8vIHRoYXQgZm9yIG5vdy4gSWYgYW55dGhpbmcgbmV3IGZyb20gb3V0c2lkZVxyXG4gICAgICAgICAgICAgICAgLy8gdmVyc2lvbnMgd2lsbCBnZXQgbm90aWZpZWQgd2l0aCBpc09ic29sZXRlKClcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5kYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gUmV0dXJuIGNhY2hlZCBkYXRhLCBubyBuZWVkIHRvIGxvYWQgYWdhaW4gZm9yIG5vdy5cclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLmRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgICAgICB0aGlzLmlzU2F2aW5nKHRydWUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFByZXNlcnZlIHRoZSB0aW1lc3RhbXAgYWZ0ZXIgYmVpbmcgc2F2ZWRcclxuICAgICAgICAvLyB0byBhdm9pZCBmYWxzZSAnb2Jzb2xldGUnIHdhcm5pbmdzIHdpdGhcclxuICAgICAgICAvLyB0aGUgdmVyc2lvbiB0aGF0IGNyZWF0ZWQgdGhlIG5ldyBvcmlnaW5hbFxyXG4gICAgICAgIHZhciB0cyA9IHRoaXMuZGF0YS5tb2RlbC5kYXRhVGltZXN0YW1wKCk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnB1c2goKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChzZXJ2ZXJEYXRhKSB7XHJcbiAgICAgICAgICAgIC8vIEV2ZXIgZGVlcENvcHksIHNpbmNlIHBsYWluIGRhdGEgZnJvbSB0aGUgc2VydmVyXHJcbiAgICAgICAgICAgIC8vIGNhbm5vdCBoYXZlIGNpcmN1bGFyIHJlZmVyZW5jZXM6XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5tb2RlbC51cGRhdGVXaXRoKHNlcnZlckRhdGEsIHRydWUpO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEubW9kZWwuZGF0YVRpbWVzdGFtcCh0cyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBwZXJzaXN0ZW50IGxvY2FsIGNvcHk/XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxvY2FsU3RvcmFnZU5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGxvY2FsZm9yYWdlLnNldEl0ZW0odGhpcy5sb2NhbFN0b3JhZ2VOYW1lLCBzZXJ2ZXJEYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gRXZlbnRcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdzYXZlZCcsIHNlcnZlckRhdGEpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gRmluYWxseTogY29tbW9uIHRhc2tzIG9uIHN1Y2Nlc3Mgb3IgZXJyb3JcclxuICAgICAgICAgICAgdGhpcy5pc1NhdmluZyhmYWxzZSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLmNhY2hlLmxhdGVzdCA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRhdGE7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxyXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgLy8gRmluYWxseTogY29tbW9uIHRhc2tzIG9uIHN1Y2Nlc3Mgb3IgZXJyb3JcclxuICAgICAgICAgICAgdGhpcy5pc1NhdmluZyhmYWxzZSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBFdmVudFxyXG4gICAgICAgICAgICB2YXIgZXJyUGtnID0ge1xyXG4gICAgICAgICAgICAgICAgdGFzazogJ3NhdmUnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVyclxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvLyBCZSBjYXJlZnVsIHdpdGggJ2Vycm9yJyBldmVudCwgaXMgc3BlY2lhbCBhbmQgc3RvcHMgZXhlY3V0aW9uIG9uIGVtaXRcclxuICAgICAgICAgICAgLy8gaWYgbm8gbGlzdGVuZXJzIGF0dGFjaGVkOiBvdmVyd3JpdHRpbmcgdGhhdCBiZWhhdmlvciBieSBqdXN0XHJcbiAgICAgICAgICAgIC8vIHByaW50IG9uIGNvbnNvbGUgd2hlbiBub3RoaW5nLCBvciBlbWl0IGlmIHNvbWUgbGlzdGVuZXI6XHJcbiAgICAgICAgICAgIGlmIChFdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCh0aGlzLCAnZXJyb3InKSA+IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnZXJyb3InLCBlcnJQa2cpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gTG9nIGl0IHdoZW4gbm90IGhhbmRsZWQgKGV2ZW4gaWYgdGhlIHByb21pc2UgZXJyb3IgaXMgaGFuZGxlZClcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1JlbW90ZU1vZGVsIEVycm9yJywgZXJyUGtnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gUmV0aHJvdyBlcnJvclxyXG4gICAgICAgICAgICByZXR1cm4gZXJyO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBMYXVuY2ggYSBzeW5jaW5nIHJlcXVlc3QuIFJldHVybnMgbm90aGluZywgdGhlXHJcbiAgICAgICAgd2F5IHRvIHRyYWNrIGFueSByZXN1bHQgaXMgd2l0aCBldmVudHMgb3IgXHJcbiAgICAgICAgdGhlIGluc3RhbmNlIG9ic2VydmFibGVzLlxyXG4gICAgICAgIElNUE9SVEFOVDogcmlnaHQgbm93IGlzIGp1c3QgYSByZXF1ZXN0IGZvciAnbG9hZCdcclxuICAgICAgICB0aGF0IGF2b2lkcyBwcm9taXNlIGVycm9ycyBmcm9tIHRocm93aW5nLlxyXG4gICAgKiovXHJcbiAgICB0aGlzLnN5bmMgPSBmdW5jdGlvbiBzeW5jKCkge1xyXG4gICAgICAgIC8vIENhbGwgZm9yIGEgbG9hZCwgdGhhdCB3aWxsIGJlIHRyZWF0ZWQgYXMgJ3N5bmNpbmcnIGFmdGVyIHRoZVxyXG4gICAgICAgIC8vIGZpcnN0IGxvYWRcclxuICAgICAgICB0aGlzLmxvYWQoKVxyXG4gICAgICAgIC8vIEF2b2lkIGVycm9ycyBmcm9tIHRocm93aW5nIGluIHRoZSBjb25zb2xlLFxyXG4gICAgICAgIC8vIHRoZSAnZXJyb3InIGV2ZW50IGlzIHRoZXJlIHRvIHRyYWNrIGFueW9uZS5cclxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oKSB7fSk7XHJcbiAgICB9O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlbW90ZU1vZGVsO1xyXG5cclxuUmVtb3RlTW9kZWwuX2luaGVyaXRzKEV2ZW50RW1pdHRlcik7XHJcbiIsIi8qKlxyXG4gICAgUkVTVCBBUEkgYWNjZXNzXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5mdW5jdGlvbiBsb3dlckZpcnN0TGV0dGVyKG4pIHtcclxuICAgIHJldHVybiBuICYmIG5bMF0gJiYgblswXS50b0xvd2VyQ2FzZSAmJiAoblswXS50b0xvd2VyQ2FzZSgpICsgbi5zbGljZSgxKSkgfHwgbjtcclxufVxyXG5cclxuZnVuY3Rpb24gbG93ZXJDYW1lbGl6ZU9iamVjdChvYmopIHtcclxuICAgIC8vanNoaW50IG1heGNvbXBsZXhpdHk6OFxyXG4gICAgXHJcbiAgICBpZiAoIW9iaiB8fCB0eXBlb2Yob2JqKSAhPT0gJ29iamVjdCcpIHJldHVybiBvYmo7XHJcblxyXG4gICAgdmFyIHJldCA9IEFycmF5LmlzQXJyYXkob2JqKSA/IFtdIDoge307XHJcbiAgICBmb3IodmFyIGsgaW4gb2JqKSB7XHJcbiAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrKSkge1xyXG4gICAgICAgICAgICB2YXIgbmV3ayA9IGxvd2VyRmlyc3RMZXR0ZXIoayk7XHJcbiAgICAgICAgICAgIHJldFtuZXdrXSA9IHR5cGVvZihvYmpba10pID09PSAnb2JqZWN0JyA/XHJcbiAgICAgICAgICAgICAgICBsb3dlckNhbWVsaXplT2JqZWN0KG9ialtrXSkgOlxyXG4gICAgICAgICAgICAgICAgb2JqW2tdXHJcbiAgICAgICAgICAgIDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmV0O1xyXG59XHJcblxyXG5mdW5jdGlvbiBSZXN0KG9wdGlvbnNPclVybCkge1xyXG4gICAgXHJcbiAgICB2YXIgdXJsID0gdHlwZW9mKG9wdGlvbnNPclVybCkgPT09ICdzdHJpbmcnID9cclxuICAgICAgICBvcHRpb25zT3JVcmwgOlxyXG4gICAgICAgIG9wdGlvbnNPclVybCAmJiBvcHRpb25zT3JVcmwudXJsO1xyXG5cclxuICAgIHRoaXMuYmFzZVVybCA9IHVybDtcclxuICAgIC8vIE9wdGlvbmFsIGV4dHJhSGVhZGVycyBmb3IgYWxsIHJlcXVlc3RzLFxyXG4gICAgLy8gdXN1YWxseSBmb3IgYXV0aGVudGljYXRpb24gdG9rZW5zXHJcbiAgICB0aGlzLmV4dHJhSGVhZGVycyA9IG51bGw7XHJcbn1cclxuXHJcblJlc3QucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldChhcGlVcmwsIGRhdGEpIHtcclxuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoYXBpVXJsLCAnZ2V0JywgZGF0YSk7XHJcbn07XHJcblxyXG5SZXN0LnByb3RvdHlwZS5wdXQgPSBmdW5jdGlvbiBnZXQoYXBpVXJsLCBkYXRhKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KGFwaVVybCwgJ3B1dCcsIGRhdGEpO1xyXG59O1xyXG5cclxuUmVzdC5wcm90b3R5cGUucG9zdCA9IGZ1bmN0aW9uIGdldChhcGlVcmwsIGRhdGEpIHtcclxuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoYXBpVXJsLCAncG9zdCcsIGRhdGEpO1xyXG59O1xyXG5cclxuUmVzdC5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gZ2V0KGFwaVVybCwgZGF0YSkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChhcGlVcmwsICdkZWxldGUnLCBkYXRhKTtcclxufTtcclxuXHJcblJlc3QucHJvdG90eXBlLnB1dEZpbGUgPSBmdW5jdGlvbiBwdXRGaWxlKGFwaVVybCwgZGF0YSkge1xyXG4gICAgLy8gTk9URSBiYXNpYyBwdXRGaWxlIGltcGxlbWVudGF0aW9uLCBvbmUgZmlsZSwgdXNlIGZpbGVVcGxvYWQ/XHJcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KGFwaVVybCwgJ2RlbGV0ZScsIGRhdGEsICdtdWx0aXBhcnQvZm9ybS1kYXRhJyk7XHJcbn07XHJcblxyXG5SZXN0LnByb3RvdHlwZS5yZXF1ZXN0ID0gZnVuY3Rpb24gcmVxdWVzdChhcGlVcmwsIGh0dHBNZXRob2QsIGRhdGEsIGNvbnRlbnRUeXBlKSB7XHJcbiAgICBcclxuICAgIHZhciB0aGlzUmVzdCA9IHRoaXM7XHJcbiAgICB2YXIgdXJsID0gdGhpcy5iYXNlVXJsICsgYXBpVXJsO1xyXG5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoJC5hamF4KHtcclxuICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICAvLyBBdm9pZCBjYWNoZSBmb3IgZGF0YS5cclxuICAgICAgICBjYWNoZTogZmFsc2UsXHJcbiAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuICAgICAgICBtZXRob2Q6IGh0dHBNZXRob2QsXHJcbiAgICAgICAgaGVhZGVyczogdGhpcy5leHRyYUhlYWRlcnMsXHJcbiAgICAgICAgLy8gVVJMRU5DT0RFRCBpbnB1dDpcclxuICAgICAgICAvLyBDb252ZXJ0IHRvIEpTT04gYW5kIGJhY2sganVzdCB0byBlbnN1cmUgdGhlIHZhbHVlcyBhcmUgY29udmVydGVkL2VuY29kZWRcclxuICAgICAgICAvLyBwcm9wZXJseSB0byBiZSBzZW50LCBsaWtlIERhdGVzIGJlaW5nIGNvbnZlcnRlZCB0byBJU08gZm9ybWF0LlxyXG4gICAgICAgIGRhdGE6IGRhdGEgJiYgSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkYXRhKSksXHJcbiAgICAgICAgY29udGVudFR5cGU6IGNvbnRlbnRUeXBlIHx8ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnXHJcbiAgICAgICAgLy8gQWx0ZXJuYXRlOiBKU09OIGFzIGlucHV0XHJcbiAgICAgICAgLy9kYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKSxcclxuICAgICAgICAvL2NvbnRlbnRUeXBlOiBjb250ZW50VHlwZSB8fCAnYXBwbGljYXRpb24vanNvbidcclxuICAgIH0pKVxyXG4gICAgLnRoZW4obG93ZXJDYW1lbGl6ZU9iamVjdClcclxuICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAvLyBPbiBhdXRob3JpemF0aW9uIGVycm9yLCBnaXZlIG9wb3J0dW5pdHkgdG8gcmV0cnkgdGhlIG9wZXJhdGlvblxyXG4gICAgICAgIGlmIChlcnIuc3RhdHVzID09PSA0MDEpIHtcclxuICAgICAgICAgICAgdmFyIHJldHJ5ID0gcmVxdWVzdC5iaW5kKHRoaXMsIGFwaVVybCwgaHR0cE1ldGhvZCwgZGF0YSwgY29udGVudFR5cGUpO1xyXG4gICAgICAgICAgICB2YXIgcmV0cnlQcm9taXNlID0gdGhpc1Jlc3Qub25BdXRob3JpemF0aW9uUmVxdWlyZWQocmV0cnkpO1xyXG4gICAgICAgICAgICBpZiAocmV0cnlQcm9taXNlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJdCByZXR1cm5lZCBzb21ldGhpbmcsIGV4cGVjdGluZyBpcyBhIHByb21pc2U6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJldHJ5UHJvbWlzZSlcclxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZXJlIGlzIGVycm9yIG9uIHJldHJ5LCBqdXN0IHJldHVybiB0aGVcclxuICAgICAgICAgICAgICAgICAgICAvLyBvcmlnaW5hbCBjYWxsIGVycm9yXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycjtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGJ5IGRlZmF1bHQsIGNvbnRpbnVlIHByb3BhZ2F0aW5nIHRoZSBlcnJvclxyXG4gICAgICAgIHJldHVybiBlcnI7XHJcbiAgICB9KTtcclxufTtcclxuXHJcblJlc3QucHJvdG90eXBlLm9uQXV0aG9yaXphdGlvblJlcXVpcmVkID0gZnVuY3Rpb24gb25BdXRob3JpemF0aW9uUmVxdWlyZWQocmV0cnkpIHtcclxuICAgIC8vIFRvIGJlIGltcGxlbWVudGVkIG91dHNpZGUsIGJ5IGRlZmF1bHQgZG9uJ3Qgd2FpdFxyXG4gICAgLy8gZm9yIHJldHJ5LCBqdXN0IHJldHVybiBub3RoaW5nOlxyXG4gICAgcmV0dXJuO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZXN0O1xyXG4iLCIvKipcclxuICAgIFRpbWUgY2xhc3MgdXRpbGl0eS5cclxuICAgIFNob3J0ZXIgd2F5IHRvIGNyZWF0ZSBhIERhdGUgaW5zdGFuY2VcclxuICAgIHNwZWNpZnlpbmcgb25seSB0aGUgVGltZSBwYXJ0LFxyXG4gICAgZGVmYXVsdGluZyB0byBjdXJyZW50IGRhdGUgb3IgXHJcbiAgICBhbm90aGVyIHJlYWR5IGRhdGUgaW5zdGFuY2UuXHJcbioqL1xyXG5mdW5jdGlvbiBUaW1lKGRhdGUsIGhvdXIsIG1pbnV0ZSwgc2Vjb25kKSB7XHJcbiAgICBpZiAoIShkYXRlIGluc3RhbmNlb2YgRGF0ZSkpIHtcclxuIFxyXG4gICAgICAgIHNlY29uZCA9IG1pbnV0ZTtcclxuICAgICAgICBtaW51dGUgPSBob3VyO1xyXG4gICAgICAgIGhvdXIgPSBkYXRlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGRhdGUgPSBuZXcgRGF0ZSgpOyAgIFxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgRGF0ZShkYXRlLmdldEZ1bGxZZWFyKCksIGRhdGUuZ2V0TW9udGgoKSwgZGF0ZS5nZXREYXRlKCksIGhvdXIgfHwgMCwgbWludXRlIHx8IDAsIHNlY29uZCB8fCAwKTtcclxufVxyXG5tb2R1bGUuZXhwb3J0cyA9IFRpbWU7XHJcbiIsIi8qKlxyXG4gICAgQ3JlYXRlIGFuIEFjY2VzcyBDb250cm9sIGZvciBhbiBhcHAgdGhhdCBqdXN0IGNoZWNrc1xyXG4gICAgdGhlIGFjdGl2aXR5IHByb3BlcnR5IGZvciBhbGxvd2VkIHVzZXIgbGV2ZWwuXHJcbiAgICBUbyBiZSBwcm92aWRlZCB0byBTaGVsbC5qcyBhbmQgdXNlZCBieSB0aGUgYXBwLmpzLFxyXG4gICAgdmVyeSB0aWVkIHRvIHRoYXQgYm90aCBjbGFzc2VzLlxyXG4gICAgXHJcbiAgICBBY3Rpdml0aWVzIGNhbiBkZWZpbmUgb24gaXRzIG9iamVjdCBhbiBhY2Nlc3NMZXZlbFxyXG4gICAgcHJvcGVydHkgbGlrZSBuZXh0IGV4YW1wbGVzXHJcbiAgICBcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlcnR5cGUuVXNlcjsgLy8gYW55b25lXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkFub255bW91czsgLy8gYW5vbnltb3VzIHVzZXJzIG9ubHlcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjsgLy8gYXV0aGVudGljYXRlZCB1c2VycyBvbmx5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vLyBVc2VyVHlwZSBlbnVtZXJhdGlvbiBpcyBiaXQgYmFzZWQsIHNvIHNldmVyYWxcclxuLy8gdXNlcnMgY2FuIGhhcyBhY2Nlc3MgaW4gYSBzaW5nbGUgcHJvcGVydHlcclxudmFyIFVzZXJUeXBlID0gcmVxdWlyZSgnLi4vbW9kZWxzL1VzZXInKS5Vc2VyVHlwZTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlQWNjZXNzQ29udHJvbChhcHApIHtcclxuICAgIFxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGFjY2Vzc0NvbnRyb2wocm91dGUpIHtcclxuXHJcbiAgICAgICAgdmFyIGFjdGl2aXR5ID0gYXBwLmdldEFjdGl2aXR5Q29udHJvbGxlckJ5Um91dGUocm91dGUpO1xyXG5cclxuICAgICAgICB2YXIgdXNlciA9IGFwcC5tb2RlbC51c2VyKCk7XHJcbiAgICAgICAgdmFyIGN1cnJlbnRUeXBlID0gdXNlciAmJiB1c2VyLnVzZXJUeXBlKCk7XHJcblxyXG4gICAgICAgIGlmIChhY3Rpdml0eSAmJiBhY3Rpdml0eS5hY2Nlc3NMZXZlbCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGNhbiA9IGFjdGl2aXR5LmFjY2Vzc0xldmVsICYgY3VycmVudFR5cGU7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoIWNhbikge1xyXG4gICAgICAgICAgICAgICAgLy8gTm90aWZ5IGVycm9yLCB3aHkgY2Fubm90IGFjY2Vzc1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZExldmVsOiBhY3Rpdml0eS5hY2Nlc3NMZXZlbCxcclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50VHlwZTogY3VycmVudFR5cGVcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEFsbG93XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9O1xyXG59O1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgdW53cmFwID0gZnVuY3Rpb24gdW53cmFwKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gKHR5cGVvZih2YWx1ZSkgPT09ICdmdW5jdGlvbicgPyB2YWx1ZSgpIDogdmFsdWUpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5kZWZpbmVDcnVkQXBpRm9yUmVzdCA9IGZ1bmN0aW9uIGRlZmluZUNydWRBcGlGb3JSZXN0KHNldHRpbmdzKSB7XHJcbiAgICBcclxuICAgIHZhciBleHRlbmRlZE9iamVjdCA9IHNldHRpbmdzLmV4dGVuZGVkT2JqZWN0LFxyXG4gICAgICAgIE1vZGVsID0gc2V0dGluZ3MuTW9kZWwsXHJcbiAgICAgICAgbW9kZWxOYW1lID0gc2V0dGluZ3MubW9kZWxOYW1lLFxyXG4gICAgICAgIG1vZGVsTGlzdE5hbWUgPSBzZXR0aW5ncy5tb2RlbExpc3ROYW1lLFxyXG4gICAgICAgIG1vZGVsVXJsID0gc2V0dGluZ3MubW9kZWxVcmwsXHJcbiAgICAgICAgaWRQcm9wZXJ0eU5hbWUgPSBzZXR0aW5ncy5pZFByb3BlcnR5TmFtZTtcclxuXHJcbiAgICBleHRlbmRlZE9iamVjdFsnZ2V0JyArIG1vZGVsTGlzdE5hbWVdID0gZnVuY3Rpb24gZ2V0TGlzdChmaWx0ZXJzKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5nZXQobW9kZWxVcmwsIGZpbHRlcnMpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmF3SXRlbXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJhd0l0ZW1zICYmIHJhd0l0ZW1zLm1hcChmdW5jdGlvbihyYXdJdGVtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE1vZGVsKHJhd0l0ZW0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIGV4dGVuZGVkT2JqZWN0WydnZXQnICsgbW9kZWxOYW1lXSA9IGZ1bmN0aW9uIGdldEl0ZW0oaXRlbUlEKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5nZXQobW9kZWxVcmwgKyAnLycgKyBpdGVtSUQpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmF3SXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmF3SXRlbSAmJiBuZXcgTW9kZWwocmF3SXRlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGV4dGVuZGVkT2JqZWN0Wydwb3N0JyArIG1vZGVsTmFtZV0gPSBmdW5jdGlvbiBwb3N0SXRlbShhbkl0ZW0pIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpcy5yZXN0LnBvc3QobW9kZWxVcmwsIGFuSXRlbSlcclxuICAgICAgICAudGhlbihmdW5jdGlvbihzZXJ2ZXJJdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgTW9kZWwoc2VydmVySXRlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGV4dGVuZGVkT2JqZWN0WydwdXQnICsgbW9kZWxOYW1lXSA9IGZ1bmN0aW9uIHB1dEl0ZW0oYW5JdGVtKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5wdXQobW9kZWxVcmwgKyAnLycgKyB1bndyYXAoYW5JdGVtW2lkUHJvcGVydHlOYW1lXSksIGFuSXRlbSlcclxuICAgICAgICAudGhlbihmdW5jdGlvbihzZXJ2ZXJJdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgTW9kZWwoc2VydmVySXRlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBleHRlbmRlZE9iamVjdFsnc2V0JyArIG1vZGVsTmFtZV0gPSBmdW5jdGlvbiBzZXRJdGVtKGFuSXRlbSkge1xyXG4gICAgICAgIHZhciBpZCA9IHVud3JhcChhbkl0ZW1baWRQcm9wZXJ0eU5hbWVdKTtcclxuICAgICAgICBpZiAoaWQpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzWydwdXQnICsgbW9kZWxOYW1lXShhbkl0ZW0pO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbJ3Bvc3QnICsgbW9kZWxOYW1lXShhbkl0ZW0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBleHRlbmRlZE9iamVjdFsnZGVsJyArIG1vZGVsTmFtZV0gPSBmdW5jdGlvbiBkZWxJdGVtKGFuSXRlbSkge1xyXG4gICAgICAgIHZhciBpZCA9IGFuSXRlbSAmJiB1bndyYXAoYW5JdGVtW2lkUHJvcGVydHlOYW1lXSkgfHxcclxuICAgICAgICAgICAgICAgIGFuSXRlbTtcclxuICAgICAgICBpZiAoaWQpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc3QuZGVsZXRlKG1vZGVsVXJsICsgJy8nICsgaWQsIGFuSXRlbSlcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oZGVsZXRlZEl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkZWxldGVkSXRlbSAmJiBuZXcgTW9kZWwoZGVsZXRlZEl0ZW0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTmVlZCBhbiBJRCBvciBhbiBvYmplY3Qgd2l0aCB0aGUgSUQgcHJvcGVydHkgdG8gZGVsZXRlJyk7XHJcbiAgICB9O1xyXG59OyIsIi8qKlxyXG4gICAgQm9vdGtub2NrOiBTZXQgb2YgS25vY2tvdXQgQmluZGluZyBIZWxwZXJzIGZvciBCb290c3RyYXAganMgY29tcG9uZW50cyAoanF1ZXJ5IHBsdWdpbnMpXHJcbiAgICBcclxuICAgIERlcGVuZGVuY2llczoganF1ZXJ5XHJcbiAgICBJbmplY3RlZCBkZXBlbmRlbmNpZXM6IGtub2Nrb3V0XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vLyBEZXBlbmRlbmNpZXNcclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuLy8gREkgaTE4biBsaWJyYXJ5XHJcbmV4cG9ydHMuaTE4biA9IG51bGw7XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVIZWxwZXJzKGtvKSB7XHJcbiAgICB2YXIgaGVscGVycyA9IHt9O1xyXG5cclxuICAgIC8qKiBQb3BvdmVyIEJpbmRpbmcgKiovXHJcbiAgICBoZWxwZXJzLnBvcG92ZXIgPSB7XHJcbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZUFjY2Vzc29yLCBhbGxCaW5kaW5ncykge1xyXG4gICAgICAgICAgICB2YXIgc3JjT3B0aW9ucyA9IGtvLnVud3JhcCh2YWx1ZUFjY2Vzc29yKCkpO1xyXG5cclxuICAgICAgICAgICAgLy8gRHVwbGljYXRpbmcgb3B0aW9ucyBvYmplY3QgdG8gcGFzcyB0byBwb3BvdmVyIHdpdGhvdXRcclxuICAgICAgICAgICAgLy8gb3ZlcndyaXR0bmcgc291cmNlIGNvbmZpZ3VyYXRpb25cclxuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc3JjT3B0aW9ucyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBVbndyYXBwaW5nIGNvbnRlbnQgdGV4dFxyXG4gICAgICAgICAgICBvcHRpb25zLmNvbnRlbnQgPSBrby51bndyYXAoc3JjT3B0aW9ucy5jb250ZW50KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmNvbnRlbnQpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBMb2NhbGl6ZTpcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMuY29udGVudCA9IFxyXG4gICAgICAgICAgICAgICAgICAgIGV4cG9ydHMuaTE4biAmJiBleHBvcnRzLmkxOG4udChvcHRpb25zLmNvbnRlbnQpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5jb250ZW50O1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBUbyBnZXQgdGhlIG5ldyBvcHRpb25zLCB3ZSBuZWVkIGRlc3Ryb3kgaXQgZmlyc3Q6XHJcbiAgICAgICAgICAgICAgICAkKGVsZW1lbnQpLnBvcG92ZXIoJ2Rlc3Ryb3knKS5wb3BvdmVyKG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFNlIG11ZXN0cmEgc2kgZWwgZWxlbWVudG8gdGllbmUgZWwgZm9jb1xyXG4gICAgICAgICAgICAgICAgaWYgKCQoZWxlbWVudCkuaXMoJzpmb2N1cycpKVxyXG4gICAgICAgICAgICAgICAgICAgICQoZWxlbWVudCkucG9wb3Zlcignc2hvdycpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICQoZWxlbWVudCkucG9wb3ZlcignZGVzdHJveScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGhlbHBlcnM7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgUGx1ZyBoZWxwZXJzIGluIHRoZSBwcm92aWRlZCBLbm9ja291dCBpbnN0YW5jZVxyXG4qKi9cclxuZnVuY3Rpb24gcGx1Z0luKGtvLCBwcmVmaXgpIHtcclxuICAgIHZhciBuYW1lLFxyXG4gICAgICAgIGhlbHBlcnMgPSBjcmVhdGVIZWxwZXJzKGtvKTtcclxuICAgIFxyXG4gICAgZm9yKHZhciBoIGluIGhlbHBlcnMpIHtcclxuICAgICAgICBpZiAoaGVscGVycy5oYXNPd25Qcm9wZXJ0eSAmJiAhaGVscGVycy5oYXNPd25Qcm9wZXJ0eShoKSlcclxuICAgICAgICAgICAgY29udGludWU7XHJcblxyXG4gICAgICAgIG5hbWUgPSBwcmVmaXggPyBwcmVmaXggKyBoWzBdLnRvVXBwZXJDYXNlKCkgKyBoLnNsaWNlKDEpIDogaDtcclxuICAgICAgICBrby5iaW5kaW5nSGFuZGxlcnNbbmFtZV0gPSBoZWxwZXJzW2hdO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnRzLnBsdWdJbiA9IHBsdWdJbjtcclxuZXhwb3J0cy5jcmVhdGVCaW5kaW5nSGVscGVycyA9IGNyZWF0ZUhlbHBlcnM7XHJcbiIsIi8qKlxyXG4gICAgS25vY2tvdXQgQmluZGluZyBIZWxwZXIgZm9yIHRoZSBCb290c3RyYXAgU3dpdGNoIHBsdWdpbi5cclxuICAgIFxyXG4gICAgRGVwZW5kZW5jaWVzOiBqcXVlcnksIGJvb3RzdHJhcCwgYm9vdHN0cmFwLXN3aXRjaFxyXG4gICAgSW5qZWN0ZWQgZGVwZW5kZW5jaWVzOiBrbm9ja291dFxyXG4gICAgXHJcbiAgICBJTVBPUlRBTlQgTk9URVM6XHJcbiAgICAtIEEgY29uc29sZSBlcnJvciBvZiB0eXBlIFwib2JqZWN0IGhhcyBub3QgdGhhdCBwcm9wZXJ0eVwiIHdpbGwgaGFwcGVuIGlmIHNwZWNpZmllZFxyXG4gICAgICAgIGEgbm9uIGV4aXN0YW50IG9wdGlvbiBpbiB0aGUgYmluZGluZy4gVGhlIGVycm9yIGxvb2tzIHN0cmFuZ2Ugd2hlbiB1c2luZyB0aGUgbWluaWZpZWQgZmlsZS5cclxuICAgIC0gVGhlIG9yZGVyIG9mIG9wdGlvbnMgaW4gdGhlIGJpbmRpbmcgbWF0dGVycyB3aGVuIGNvbWJpbmluZyB3aXRoIGRpc2FibGVkIGFuZCByZWFkb25seVxyXG4gICAgICAgIG9wdGlvbnM6IGlmIHRoZSBlbGVtZW50IGlzIGRpc2FibGVkOnRydWUgb3IgcmVhZG9ubHk6dHJ1ZSwgYW55IGF0dGVtcHQgdG8gY2hhbmdlIHRoZVxyXG4gICAgICAgIHZhbHVlIHdpbGwgZmFpbCBzaWxlbnRseSwgc28gaWYgdGhlIHNhbWUgYmluZGluZyB1cGRhdGUgY2hhbmdlcyBkaXNhYmxlZCB0byBmYWxzZVxyXG4gICAgICAgIGFuZCB0aGUgc3RhdGUsIHRoZSAnZGlzYWJsZWQnIGNoYW5nZSBtdXN0IGhhcHBlbnMgYmVmb3JlIHRoZSAnc3RhdGUnIGNoYW5nZSBzbyBib3RoXHJcbiAgICAgICAgYXJlIHN1Y2Nlc3NmdWxseSB1cGRhdGVkLiBGb3IgdGhhdCwganVzdCBzcGVjaWZ5ICdkaXNhYmxlZCcgYmVmb3JlICdzdGF0ZScgaW4gdGhlIGJpbmRpbmdzXHJcbiAgICAgICAgZGVmaW5pdGlvbi5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbi8vIERlcGVuZGVuY2llc1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdib290c3RyYXAnKTtcclxucmVxdWlyZSgnYm9vdHN0cmFwLXN3aXRjaCcpO1xyXG5cclxuLyoqXHJcbiAgICBDcmVhdGUgYW5kIHBsdWctaW4gdGhlIEJpbmRpbmcgaW4gdGhlIHByb3ZpZGVkIEtub2Nrb3V0IGluc3RhbmNlXHJcbioqL1xyXG5leHBvcnRzLnBsdWdJbiA9IGZ1bmN0aW9uIHBsdWdJbihrbywgcHJlZml4KSB7XHJcblxyXG4gICAga28uYmluZGluZ0hhbmRsZXJzW3ByZWZpeCA/IHByZWZpeCArICdzd2l0Y2gnIDogJ3N3aXRjaCddID0ge1xyXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IsIGFsbEJpbmRpbmdzKSB7XHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBwbHVnaW4gaW5zdGFuY2VcclxuICAgICAgICAgICAgJChlbGVtZW50KS5ib290c3RyYXBTd2l0Y2goKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3N3aXRjaCBpbml0Jywga28udG9KUyh2YWx1ZUFjY2Vzc29yKCkpKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFVwZGF0aW5nIHZhbHVlIG9uIHBsdWdpbiBjaGFuZ2VzXHJcbiAgICAgICAgICAgICQoZWxlbWVudCkub24oJ3N3aXRjaENoYW5nZS5ib290c3RyYXBTd2l0Y2gnLCBmdW5jdGlvbiAoZSwgc3RhdGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciB2ID0gdmFsdWVBY2Nlc3NvcigpIHx8IHt9O1xyXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnc3dpdGNoQ2hhbmdlJywga28udG9KUyh2KSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIGNoYW5nZWQ/XHJcbiAgICAgICAgICAgICAgICB2YXIgb2xkU3RhdGUgPSAhIWtvLnVud3JhcCh2LnN0YXRlKSxcclxuICAgICAgICAgICAgICAgICAgICBuZXdTdGF0ZSA9ICEhc3RhdGU7XHJcbiAgICAgICAgICAgICAgICAvLyBPbmx5IHVwZGF0ZSBvbiBjaGFuZ2VcclxuICAgICAgICAgICAgICAgIGlmIChvbGRTdGF0ZSAhPT0gbmV3U3RhdGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoa28uaXNPYnNlcnZhYmxlKHYuc3RhdGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrby5pc1dyaXRlYWJsZU9ic2VydmFibGUodi5zdGF0ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYuc3RhdGUobmV3U3RhdGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdi5zdGF0ZSA9IG5ld1N0YXRlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IsIGFsbEJpbmRpbmdzKSB7XHJcbiAgICAgICAgICAgIC8vIEdldCBvcHRpb25zIHRvIGJlIGFwcGxpZWQgdG8gdGhlIHBsdWdpbiBpbnN0YW5jZVxyXG4gICAgICAgICAgICB2YXIgc3JjT3B0aW9ucyA9IHZhbHVlQWNjZXNzb3IoKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gc3JjT3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgICAgIC8vIFVud3JhcHBpbmcgZXZlcnkgb3B0aW9uIHZhbHVlLCBnZXR0aW5nIGEgZHVwbGljYXRlZFxyXG4gICAgICAgICAgICAvLyBwbGFpbiBvYmplY3RcclxuICAgICAgICAgICAgb3B0aW9ucyA9IGtvLnRvSlMob3B0aW9ucyk7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3N3aXRjaCB1cGRhdGUnLCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgICAgIHZhciAkZWwgPSAkKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICAvLyBVcGRhdGUgZXZlcnkgb3B0aW9uIGluIHRoZSBwbHVnaW5cclxuICAgICAgICAgICAgT2JqZWN0LmtleXMob3B0aW9ucykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgICAgICRlbC5ib290c3RyYXBTd2l0Y2goa2V5LCBvcHRpb25zW2tleV0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG4iLCIvKipcclxuICAgIEVzcGFjZSBhIHN0cmluZyBmb3IgdXNlIG9uIGEgUmVnRXhwLlxyXG4gICAgVXN1YWxseSwgdG8gbG9vayBmb3IgYSBzdHJpbmcgaW4gYSB0ZXh0IG11bHRpcGxlIHRpbWVzXHJcbiAgICBvciB3aXRoIHNvbWUgZXhwcmVzc2lvbnMsIHNvbWUgY29tbW9uIGFyZSBcclxuICAgIGxvb2sgZm9yIGEgdGV4dCAnaW4gdGhlIGJlZ2lubmluZycgKF4pXHJcbiAgICBvciAnYXQgdGhlIGVuZCcgKCQpLlxyXG4gICAgXHJcbiAgICBBdXRob3I6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS91c2Vycy8xNTEzMTIvY29vbGFqODYgYW5kIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS91c2Vycy85NDEwL2FyaXN0b3RsZS1wYWdhbHR6aXNcclxuICAgIExpbms6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzY5Njk0ODZcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbi8vIFJlZmVycmluZyB0byB0aGUgdGFibGUgaGVyZTpcclxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvcmVnZXhwXHJcbi8vIHRoZXNlIGNoYXJhY3RlcnMgc2hvdWxkIGJlIGVzY2FwZWRcclxuLy8gXFwgXiAkICogKyA/IC4gKCApIHwgeyB9IFsgXVxyXG4vLyBUaGVzZSBjaGFyYWN0ZXJzIG9ubHkgaGF2ZSBzcGVjaWFsIG1lYW5pbmcgaW5zaWRlIG9mIGJyYWNrZXRzXHJcbi8vIHRoZXkgZG8gbm90IG5lZWQgdG8gYmUgZXNjYXBlZCwgYnV0IHRoZXkgTUFZIGJlIGVzY2FwZWRcclxuLy8gd2l0aG91dCBhbnkgYWR2ZXJzZSBlZmZlY3RzICh0byB0aGUgYmVzdCBvZiBteSBrbm93bGVkZ2UgYW5kIGNhc3VhbCB0ZXN0aW5nKVxyXG4vLyA6ICEgLCA9IFxyXG4vLyBteSB0ZXN0IFwifiFAIyQlXiYqKCl7fVtdYC89PytcXHwtXzs6J1xcXCIsPC4+XCIubWF0Y2goL1tcXCNdL2cpXHJcblxyXG52YXIgc3BlY2lhbHMgPSBbXHJcbiAgICAvLyBvcmRlciBtYXR0ZXJzIGZvciB0aGVzZVxyXG4gICAgICBcIi1cIlxyXG4gICAgLCBcIltcIlxyXG4gICAgLCBcIl1cIlxyXG4gICAgLy8gb3JkZXIgZG9lc24ndCBtYXR0ZXIgZm9yIGFueSBvZiB0aGVzZVxyXG4gICAgLCBcIi9cIlxyXG4gICAgLCBcIntcIlxyXG4gICAgLCBcIn1cIlxyXG4gICAgLCBcIihcIlxyXG4gICAgLCBcIilcIlxyXG4gICAgLCBcIipcIlxyXG4gICAgLCBcIitcIlxyXG4gICAgLCBcIj9cIlxyXG4gICAgLCBcIi5cIlxyXG4gICAgLCBcIlxcXFxcIlxyXG4gICAgLCBcIl5cIlxyXG4gICAgLCBcIiRcIlxyXG4gICAgLCBcInxcIlxyXG4gIF1cclxuXHJcbiAgLy8gSSBjaG9vc2UgdG8gZXNjYXBlIGV2ZXJ5IGNoYXJhY3RlciB3aXRoICdcXCdcclxuICAvLyBldmVuIHRob3VnaCBvbmx5IHNvbWUgc3RyaWN0bHkgcmVxdWlyZSBpdCB3aGVuIGluc2lkZSBvZiBbXVxyXG4sIHJlZ2V4ID0gUmVnRXhwKCdbJyArIHNwZWNpYWxzLmpvaW4oJ1xcXFwnKSArICddJywgJ2cnKVxyXG47XHJcblxyXG52YXIgZXNjYXBlUmVnRXhwID0gZnVuY3Rpb24gKHN0cikge1xyXG5yZXR1cm4gc3RyLnJlcGxhY2UocmVnZXgsIFwiXFxcXCQmXCIpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBlc2NhcGVSZWdFeHA7XHJcblxyXG4vLyB0ZXN0IGVzY2FwZVJlZ0V4cChcIi9wYXRoL3RvL3Jlcz9zZWFyY2g9dGhpcy50aGF0XCIpXHJcbiIsIi8qKlxyXG4qIGVzY2FwZVNlbGVjdG9yXHJcbipcclxuKiBzb3VyY2U6IGh0dHA6Ly9ranZhcmdhLmJsb2dzcG90LmNvbS5lcy8yMDA5LzA2L2pxdWVyeS1wbHVnaW4tdG8tZXNjYXBlLWNzcy1zZWxlY3Rvci5odG1sXHJcbipcclxuKiBFc2NhcGUgYWxsIHNwZWNpYWwgalF1ZXJ5IENTUyBzZWxlY3RvciBjaGFyYWN0ZXJzIGluICpzZWxlY3RvciouXHJcbiogVXNlZnVsIHdoZW4geW91IGhhdmUgYSBjbGFzcyBvciBpZCB3aGljaCBjb250YWlucyBzcGVjaWFsIGNoYXJhY3RlcnNcclxuKiB3aGljaCB5b3UgbmVlZCB0byBpbmNsdWRlIGluIGEgc2VsZWN0b3IuXHJcbiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBzcGVjaWFscyA9IFtcclxuICAnIycsICcmJywgJ34nLCAnPScsICc+JywgXHJcbiAgXCInXCIsICc6JywgJ1wiJywgJyEnLCAnOycsICcsJ1xyXG5dO1xyXG52YXIgcmVnZXhTcGVjaWFscyA9IFtcclxuICAnLicsICcqJywgJysnLCAnfCcsICdbJywgJ10nLCAnKCcsICcpJywgJy8nLCAnXicsICckJ1xyXG5dO1xyXG52YXIgc1JFID0gbmV3IFJlZ0V4cChcclxuICAnKCcgKyBzcGVjaWFscy5qb2luKCd8JykgKyAnfFxcXFwnICsgcmVnZXhTcGVjaWFscy5qb2luKCd8XFxcXCcpICsgJyknLCAnZydcclxuKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICByZXR1cm4gc2VsZWN0b3IucmVwbGFjZShzUkUsICdcXFxcJDEnKTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBSZWFkIGEgcGFnZSdzIEdFVCBVUkwgdmFyaWFibGVzIGFuZCByZXR1cm4gdGhlbSBhcyBhbiBhc3NvY2lhdGl2ZSBhcnJheS5cclxuKiovXHJcbid1c2VyIHN0cmljdCc7XHJcbi8vZ2xvYmFsIHdpbmRvd1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZXRVcmxRdWVyeSh1cmwpIHtcclxuXHJcbiAgICB1cmwgPSB1cmwgfHwgd2luZG93LmxvY2F0aW9uLmhyZWY7XHJcblxyXG4gICAgdmFyIHZhcnMgPSBbXSwgaGFzaCxcclxuICAgICAgICBxdWVyeUluZGV4ID0gdXJsLmluZGV4T2YoJz8nKTtcclxuICAgIGlmIChxdWVyeUluZGV4ID4gLTEpIHtcclxuICAgICAgICB2YXIgaGFzaGVzID0gdXJsLnNsaWNlKHF1ZXJ5SW5kZXggKyAxKS5zcGxpdCgnJicpO1xyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBoYXNoZXMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBoYXNoID0gaGFzaGVzW2ldLnNwbGl0KCc9Jyk7XHJcbiAgICAgICAgICAgIHZhcnMucHVzaChoYXNoWzBdKTtcclxuICAgICAgICAgICAgdmFyc1toYXNoWzBdXSA9IGhhc2hbMV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhcnM7XHJcbn07XHJcbiIsIi8vIGpRdWVyeSBwbHVnaW4gdG8gc2V0IG11bHRpbGluZSB0ZXh0IGluIGFuIGVsZW1lbnQsXHJcbi8vIGJ5IHJlcGxhY2luZyBcXG4gYnkgPGJyLz4gd2l0aCBjYXJlZnVsIHRvIGF2b2lkIFhTUyBhdHRhY2tzLlxyXG4vLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xMzA4MjAyOFxyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuJC5mbi5tdWx0aWxpbmUgPSBmdW5jdGlvbih0ZXh0KSB7XHJcbiAgICB0aGlzLnRleHQodGV4dCk7XHJcbiAgICB0aGlzLmh0bWwodGhpcy5odG1sKCkucmVwbGFjZSgvXFxuL2csJzxici8+JykpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgU2V0IG9mIHV0aWxpdGllcyB0byBkZWZpbmUgSmF2YXNjcmlwdCBQcm9wZXJ0aWVzXHJcbiAgICBpbmRlcGVuZGVudGx5IG9mIHRoZSBicm93c2VyLlxyXG4gICAgXHJcbiAgICBBbGxvd3MgdG8gZGVmaW5lIGdldHRlcnMgYW5kIHNldHRlcnMuXHJcbiAgICBcclxuICAgIEFkYXB0ZWQgY29kZSBmcm9tIHRoZSBvcmlnaW5hbCBjcmVhdGVkIGJ5IEplZmYgV2FsZGVuXHJcbiAgICBodHRwOi8vd2hlcmVzd2FsZGVuLmNvbS8yMDEwLzA0LzE2L21vcmUtc3BpZGVybW9ua2V5LWNoYW5nZXMtYW5jaWVudC1lc290ZXJpYy12ZXJ5LXJhcmVseS11c2VkLXN5bnRheC1mb3ItY3JlYXRpbmctZ2V0dGVycy1hbmQtc2V0dGVycy1pcy1iZWluZy1yZW1vdmVkL1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gYWNjZXNzb3JEZXNjcmlwdG9yKGZpZWxkLCBmdW4pXHJcbntcclxuICAgIHZhciBkZXNjID0geyBlbnVtZXJhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfTtcclxuICAgIGRlc2NbZmllbGRdID0gZnVuO1xyXG4gICAgcmV0dXJuIGRlc2M7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRlZmluZUdldHRlcihvYmosIHByb3AsIGdldClcclxue1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSlcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgcHJvcCwgYWNjZXNzb3JEZXNjcmlwdG9yKFwiZ2V0XCIsIGdldCkpO1xyXG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuX19kZWZpbmVHZXR0ZXJfXylcclxuICAgICAgICByZXR1cm4gb2JqLl9fZGVmaW5lR2V0dGVyX18ocHJvcCwgZ2V0KTtcclxuXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgZ2V0dGVyc1wiKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZGVmaW5lU2V0dGVyKG9iaiwgcHJvcCwgc2V0KVxyXG57XHJcbiAgICBpZiAoT2JqZWN0LmRlZmluZVByb3BlcnR5KVxyXG4gICAgICAgIHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBwcm9wLCBhY2Nlc3NvckRlc2NyaXB0b3IoXCJzZXRcIiwgc2V0KSk7XHJcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5fX2RlZmluZVNldHRlcl9fKVxyXG4gICAgICAgIHJldHVybiBvYmouX19kZWZpbmVTZXR0ZXJfXyhwcm9wLCBzZXQpO1xyXG5cclxuICAgIHRocm93IG5ldyBFcnJvcihcImJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBzZXR0ZXJzXCIpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGRlZmluZUdldHRlcjogZGVmaW5lR2V0dGVyLFxyXG4gICAgZGVmaW5lU2V0dGVyOiBkZWZpbmVTZXR0ZXJcclxufTtcclxuIiwiLyoqXHJcbiAgICBEb21JdGVtc01hbmFnZXIgY2xhc3MsIHRoYXQgbWFuYWdlIGEgY29sbGVjdGlvbiBcclxuICAgIG9mIEhUTUwvRE9NIGl0ZW1zIHVuZGVyIGEgcm9vdC9jb250YWluZXIsIHdoZXJlXHJcbiAgICBvbmx5IG9uZSBlbGVtZW50IGF0IHRoZSB0aW1lIGlzIHZpc2libGUsIHByb3ZpZGluZ1xyXG4gICAgdG9vbHMgdG8gdW5pcXVlcmx5IGlkZW50aWZ5IHRoZSBpdGVtcyxcclxuICAgIHRvIGNyZWF0ZSBvciB1cGRhdGUgbmV3IGl0ZW1zICh0aHJvdWdoICdpbmplY3QnKSxcclxuICAgIGdldCB0aGUgY3VycmVudCwgZmluZCBieSB0aGUgSUQgYW5kIG1vcmUuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgZXNjYXBlU2VsZWN0b3IgPSByZXF1aXJlKCcuLi9lc2NhcGVTZWxlY3RvcicpO1xyXG5cclxuZnVuY3Rpb24gRG9tSXRlbXNNYW5hZ2VyKHNldHRpbmdzKSB7XHJcblxyXG4gICAgdGhpcy5pZEF0dHJpYnV0ZU5hbWUgPSBzZXR0aW5ncy5pZEF0dHJpYnV0ZU5hbWUgfHwgJ2lkJztcclxuICAgIHRoaXMuYWxsb3dEdXBsaWNhdGVzID0gISFzZXR0aW5ncy5hbGxvd0R1cGxpY2F0ZXMgfHwgZmFsc2U7XHJcbiAgICB0aGlzLiRyb290ID0gbnVsbDtcclxuICAgIC8vIE9uIHBhZ2UgcmVhZHksIGdldCB0aGUgcm9vdCBlbGVtZW50OlxyXG4gICAgJChmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLiRyb290ID0gJChzZXR0aW5ncy5yb290IHx8ICdib2R5Jyk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IERvbUl0ZW1zTWFuYWdlcjtcclxuXHJcbkRvbUl0ZW1zTWFuYWdlci5wcm90b3R5cGUuZmluZCA9IGZ1bmN0aW9uIGZpbmQoY29udGFpbmVyTmFtZSwgcm9vdCkge1xyXG4gICAgdmFyICRyb290ID0gJChyb290IHx8IHRoaXMuJHJvb3QpO1xyXG4gICAgcmV0dXJuICRyb290LmZpbmQoJ1snICsgdGhpcy5pZEF0dHJpYnV0ZU5hbWUgKyAnPVwiJyArIGVzY2FwZVNlbGVjdG9yKGNvbnRhaW5lck5hbWUpICsgJ1wiXScpO1xyXG59O1xyXG5cclxuRG9tSXRlbXNNYW5hZ2VyLnByb3RvdHlwZS5nZXRBY3RpdmUgPSBmdW5jdGlvbiBnZXRBY3RpdmUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy4kcm9vdC5maW5kKCdbJyArIHRoaXMuaWRBdHRyaWJ1dGVOYW1lICsgJ106dmlzaWJsZScpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBJdCBhZGRzIHRoZSBpdGVtIGluIHRoZSBodG1sIHByb3ZpZGVkIChjYW4gYmUgb25seSB0aGUgZWxlbWVudCBvciBcclxuICAgIGNvbnRhaW5lZCBpbiBhbm90aGVyIG9yIGEgZnVsbCBodG1sIHBhZ2UpLlxyXG4gICAgUmVwbGFjZXMgYW55IGV4aXN0YW50IGlmIGR1cGxpY2F0ZXMgYXJlIG5vdCBhbGxvd2VkLlxyXG4qKi9cclxuRG9tSXRlbXNNYW5hZ2VyLnByb3RvdHlwZS5pbmplY3QgPSBmdW5jdGlvbiBpbmplY3QobmFtZSwgaHRtbCkge1xyXG5cclxuICAgIC8vIEZpbHRlcmluZyBpbnB1dCBodG1sIChjYW4gYmUgcGFydGlhbCBvciBmdWxsIHBhZ2VzKVxyXG4gICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTI4NDg3OThcclxuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoL15bXFxzXFxTXSo8Ym9keS4qPz58PFxcL2JvZHk+W1xcc1xcU10qJC9nLCAnJyk7XHJcblxyXG4gICAgLy8gQ3JlYXRpbmcgYSB3cmFwcGVyIGFyb3VuZCB0aGUgaHRtbFxyXG4gICAgLy8gKGNhbiBiZSBwcm92aWRlZCB0aGUgaW5uZXJIdG1sIG9yIG91dGVySHRtbCwgZG9lc24ndCBtYXR0ZXJzIHdpdGggbmV4dCBhcHByb2FjaClcclxuICAgIHZhciAkaHRtbCA9ICQoJzxkaXYvPicsIHsgaHRtbDogaHRtbCB9KSxcclxuICAgICAgICAvLyBXZSBsb29rIGZvciB0aGUgY29udGFpbmVyIGVsZW1lbnQgKHdoZW4gdGhlIG91dGVySHRtbCBpcyBwcm92aWRlZClcclxuICAgICAgICAkYyA9IHRoaXMuZmluZChuYW1lLCAkaHRtbCk7XHJcblxyXG4gICAgaWYgKCRjLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIC8vIEl0cyBpbm5lckh0bWwsIHNvIHRoZSB3cmFwcGVyIGJlY29tZXMgdGhlIGNvbnRhaW5lciBpdHNlbGZcclxuICAgICAgICAkYyA9ICRodG1sLmF0dHIodGhpcy5pZEF0dHJpYnV0ZU5hbWUsIG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5hbGxvd0R1cGxpY2F0ZXMpIHtcclxuICAgICAgICAvLyBObyBtb3JlIHRoYW4gb25lIGNvbnRhaW5lciBpbnN0YW5jZSBjYW4gZXhpc3RzIGF0IHRoZSBzYW1lIHRpbWVcclxuICAgICAgICAvLyBXZSBsb29rIGZvciBhbnkgZXhpc3RlbnQgb25lIGFuZCBpdHMgcmVwbGFjZWQgd2l0aCB0aGUgbmV3XHJcbiAgICAgICAgdmFyICRwcmV2ID0gdGhpcy5maW5kKG5hbWUpO1xyXG4gICAgICAgIGlmICgkcHJldi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICRwcmV2LnJlcGxhY2VXaXRoKCRjKTtcclxuICAgICAgICAgICAgJGMgPSAkcHJldjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWRkIHRvIHRoZSBkb2N1bWVudFxyXG4gICAgLy8gKG9uIHRoZSBjYXNlIG9mIGR1cGxpY2F0ZWQgZm91bmQsIHRoaXMgd2lsbCBkbyBub3RoaW5nLCBubyB3b3JyeSlcclxuICAgICRjLmFwcGVuZFRvKHRoaXMuJHJvb3QpO1xyXG59O1xyXG5cclxuLyoqIFxyXG4gICAgVGhlIHN3aXRjaCBtZXRob2QgcmVjZWl2ZSB0aGUgaXRlbXMgdG8gaW50ZXJjaGFuZ2UgYXMgYWN0aXZlIG9yIGN1cnJlbnQsXHJcbiAgICB0aGUgJ2Zyb20nIGFuZCAndG8nLCBhbmQgdGhlIHNoZWxsIGluc3RhbmNlIHRoYXQgTVVTVCBiZSB1c2VkXHJcbiAgICB0byBub3RpZnkgZWFjaCBldmVudCB0aGF0IGludm9sdmVzIHRoZSBpdGVtOlxyXG4gICAgd2lsbENsb3NlLCB3aWxsT3BlbiwgcmVhZHksIG9wZW5lZCwgY2xvc2VkLlxyXG4gICAgSXQgcmVjZWl2ZXMgYXMgbGF0ZXN0IHBhcmFtZXRlciB0aGUgJ25vdGlmaWNhdGlvbicgb2JqZWN0IHRoYXQgbXVzdCBiZVxyXG4gICAgcGFzc2VkIHdpdGggdGhlIGV2ZW50IHNvIGhhbmRsZXJzIGhhcyBjb250ZXh0IHN0YXRlIGluZm9ybWF0aW9uLlxyXG4gICAgXHJcbiAgICBJdCdzIGRlc2lnbmVkIHRvIGJlIGFibGUgdG8gbWFuYWdlIHRyYW5zaXRpb25zLCBidXQgdGhpcyBkZWZhdWx0XHJcbiAgICBpbXBsZW1lbnRhdGlvbiBpcyBhcyBzaW1wbGUgYXMgJ3Nob3cgdGhlIG5ldyBhbmQgaGlkZSB0aGUgb2xkJy5cclxuKiovXHJcbkRvbUl0ZW1zTWFuYWdlci5wcm90b3R5cGUuc3dpdGNoID0gZnVuY3Rpb24gc3dpdGNoQWN0aXZlSXRlbSgkZnJvbSwgJHRvLCBzaGVsbCwgbm90aWZpY2F0aW9uKSB7XHJcblxyXG4gICAgaWYgKCEkdG8uaXMoJzp2aXNpYmxlJykpIHtcclxuICAgICAgICBzaGVsbC5lbWl0KHNoZWxsLmV2ZW50cy53aWxsT3BlbiwgJHRvLCBub3RpZmljYXRpb24pO1xyXG4gICAgICAgICR0by5zaG93KCk7XHJcbiAgICAgICAgLy8gSXRzIGVub3VnaCB2aXNpYmxlIGFuZCBpbiBET00gdG8gcGVyZm9ybSBpbml0aWFsaXphdGlvbiB0YXNrc1xyXG4gICAgICAgIC8vIHRoYXQgbWF5IGludm9sdmUgbGF5b3V0IGluZm9ybWF0aW9uXHJcbiAgICAgICAgc2hlbGwuZW1pdChzaGVsbC5ldmVudHMuaXRlbVJlYWR5LCAkdG8sIG5vdGlmaWNhdGlvbik7XHJcbiAgICAgICAgLy8gV2hlbiBpdHMgY29tcGxldGVseSBvcGVuZWRcclxuICAgICAgICBzaGVsbC5lbWl0KHNoZWxsLmV2ZW50cy5vcGVuZWQsICR0bywgbm90aWZpY2F0aW9uKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gSXRzIHJlYWR5OyBtYXliZSBpdCB3YXMgYnV0IHN1Yi1sb2NhdGlvblxyXG4gICAgICAgIC8vIG9yIHN0YXRlIGNoYW5nZSBuZWVkIHRvIGJlIGNvbW11bmljYXRlZFxyXG4gICAgICAgIHNoZWxsLmVtaXQoc2hlbGwuZXZlbnRzLml0ZW1SZWFkeSwgJHRvLCBub3RpZmljYXRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICgkZnJvbS5pcygnOnZpc2libGUnKSkge1xyXG4gICAgICAgIHNoZWxsLmVtaXQoc2hlbGwuZXZlbnRzLndpbGxDbG9zZSwgJGZyb20sIG5vdGlmaWNhdGlvbik7XHJcbiAgICAgICAgLy8gRG8gJ3VuZm9jdXMnIG9uIHRoZSBoaWRkZW4gZWxlbWVudCBhZnRlciBub3RpZnkgJ3dpbGxDbG9zZSdcclxuICAgICAgICAvLyBmb3IgYmV0dGVyIFVYOiBoaWRkZW4gZWxlbWVudHMgYXJlIG5vdCByZWFjaGFibGUgYW5kIGhhcyBnb29kXHJcbiAgICAgICAgLy8gc2lkZSBlZmZlY3RzIGxpa2UgaGlkZGluZyB0aGUgb24tc2NyZWVuIGtleWJvYXJkIGlmIGFuIGlucHV0IHdhc1xyXG4gICAgICAgIC8vIGZvY3VzZWRcclxuICAgICAgICAkZnJvbS5maW5kKCc6Zm9jdXMnKS5ibHVyKCk7XHJcbiAgICAgICAgLy8gaGlkZSBhbmQgbm90aWZ5IGl0IGVuZGVkXHJcbiAgICAgICAgJGZyb20uaGlkZSgpO1xyXG4gICAgICAgIHNoZWxsLmVtaXQoc2hlbGwuZXZlbnRzLmNsb3NlZCwgJGZyb20sIG5vdGlmaWNhdGlvbik7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICAgIEluaXRpYWxpemVzIHRoZSBsaXN0IG9mIGl0ZW1zLiBObyBtb3JlIHRoYW4gb25lXHJcbiAgICBtdXN0IGJlIG9wZW5lZC92aXNpYmxlIGF0IHRoZSBzYW1lIHRpbWUsIHNvIGF0IHRoZSBcclxuICAgIGluaXQgYWxsIHRoZSBlbGVtZW50cyBhcmUgY2xvc2VkIHdhaXRpbmcgdG8gc2V0XHJcbiAgICBvbmUgYXMgdGhlIGFjdGl2ZSBvciB0aGUgY3VycmVudCBvbmUuXHJcbioqL1xyXG5Eb21JdGVtc01hbmFnZXIucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiBpbml0KCkge1xyXG4gICAgdGhpcy5nZXRBY3RpdmUoKS5oaWRlKCk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgSmF2YXNjcml0cCBTaGVsbCBmb3IgU1BBcy5cclxuKiovXHJcbi8qZ2xvYmFsIHdpbmRvdywgZG9jdW1lbnQgKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqIERJIGVudHJ5IHBvaW50cyBmb3IgZGVmYXVsdCBidWlsZHMuIE1vc3QgZGVwZW5kZW5jaWVzIGNhbiBiZVxyXG4gICAgc3BlY2lmaWVkIGluIHRoZSBjb25zdHJ1Y3RvciBzZXR0aW5ncyBmb3IgcGVyLWluc3RhbmNlIHNldHVwLlxyXG4qKi9cclxudmFyIGRlcHMgPSByZXF1aXJlKCcuL2RlcGVuZGVuY2llcycpO1xyXG5cclxuLyoqIENvbnN0cnVjdG9yICoqL1xyXG5cclxuZnVuY3Rpb24gU2hlbGwoc2V0dGluZ3MpIHtcclxuICAgIC8vanNoaW50IG1heGNvbXBsZXhpdHk6MTRcclxuICAgIFxyXG4gICAgZGVwcy5FdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLiQgPSBzZXR0aW5ncy5qcXVlcnkgfHwgZGVwcy5qcXVlcnk7XHJcbiAgICB0aGlzLiRyb290ID0gdGhpcy4kKHNldHRpbmdzLnJvb3QpO1xyXG4gICAgdGhpcy5iYXNlVXJsID0gc2V0dGluZ3MuYmFzZVVybCB8fCAnJztcclxuICAgIC8vIFdpdGggZm9yY2VIYXNoYmFuZz10cnVlOlxyXG4gICAgLy8gLSBmcmFnbWVudHMgVVJMcyBjYW5ub3QgYmUgdXNlZCB0byBzY3JvbGwgdG8gYW4gZWxlbWVudCAoZGVmYXVsdCBicm93c2VyIGJlaGF2aW9yKSxcclxuICAgIC8vICAgdGhleSBhcmUgZGVmYXVsdFByZXZlbnRlZCB0byBhdm9pZCBjb25mdXNlIHRoZSByb3V0aW5nIG1lY2hhbmlzbSBhbmQgY3VycmVudCBVUkwuXHJcbiAgICAvLyAtIHByZXNzZWQgbGlua3MgdG8gZnJhZ21lbnRzIFVSTHMgYXJlIG5vdCByb3V0ZWQsIHRoZXkgYXJlIHNraXBwZWQgc2lsZW50bHlcclxuICAgIC8vICAgZXhjZXB0IHdoZW4gdGhleSBhcmUgYSBoYXNoYmFuZyAoIyEpLiBUaGlzIHdheSwgc3BlY2lhbCBsaW5rc1xyXG4gICAgLy8gICB0aGF0IHBlcmZvcm1uIGpzIGFjdGlvbnMgZG9lc24ndCBjb25mbGl0cy5cclxuICAgIC8vIC0gYWxsIFVSTHMgcm91dGVkIHRocm91Z2ggdGhlIHNoZWxsIGluY2x1ZGVzIGEgaGFzaGJhbmcgKCMhKSwgdGhlIHNoZWxsIGVuc3VyZXNcclxuICAgIC8vICAgdGhhdCBoYXBwZW5zIGJ5IGFwcGVuZGluZyB0aGUgaGFzaGJhbmcgdG8gYW55IFVSTCBwYXNzZWQgaW4gKGV4Y2VwdCB0aGUgc3RhbmRhcmQgaGFzaFxyXG4gICAgLy8gICB0aGF0IGFyZSBza2lwdCkuXHJcbiAgICB0aGlzLmZvcmNlSGFzaGJhbmcgPSBzZXR0aW5ncy5mb3JjZUhhc2hiYW5nIHx8IGZhbHNlO1xyXG4gICAgdGhpcy5saW5rRXZlbnQgPSBzZXR0aW5ncy5saW5rRXZlbnQgfHwgJ2NsaWNrJztcclxuICAgIHRoaXMucGFyc2VVcmwgPSAoc2V0dGluZ3MucGFyc2VVcmwgfHwgZGVwcy5wYXJzZVVybCkuYmluZCh0aGlzLCB0aGlzLmJhc2VVcmwpO1xyXG4gICAgdGhpcy5hYnNvbHV0aXplVXJsID0gKHNldHRpbmdzLmFic29sdXRpemVVcmwgfHwgZGVwcy5hYnNvbHV0aXplVXJsKS5iaW5kKHRoaXMsIHRoaXMuYmFzZVVybCk7XHJcblxyXG4gICAgdGhpcy5oaXN0b3J5ID0gc2V0dGluZ3MuaGlzdG9yeSB8fCB3aW5kb3cuaGlzdG9yeTtcclxuXHJcbiAgICB0aGlzLmluZGV4TmFtZSA9IHNldHRpbmdzLmluZGV4TmFtZSB8fCAnaW5kZXgnO1xyXG4gICAgXHJcbiAgICB0aGlzLml0ZW1zID0gc2V0dGluZ3MuZG9tSXRlbXNNYW5hZ2VyO1xyXG5cclxuICAgIC8vIGxvYWRlciBjYW4gYmUgZGlzYWJsZWQgcGFzc2luZyAnbnVsbCcsIHNvIHdlIG11c3RcclxuICAgIC8vIGVuc3VyZSB0byBub3QgdXNlIHRoZSBkZWZhdWx0IG9uIHRoYXQgY2FzZXM6XHJcbiAgICB0aGlzLmxvYWRlciA9IHR5cGVvZihzZXR0aW5ncy5sb2FkZXIpID09PSAndW5kZWZpbmVkJyA/IGRlcHMubG9hZGVyIDogc2V0dGluZ3MubG9hZGVyO1xyXG4gICAgLy8gbG9hZGVyIHNldHVwXHJcbiAgICBpZiAodGhpcy5sb2FkZXIpXHJcbiAgICAgICAgdGhpcy5sb2FkZXIuYmFzZVVybCA9IHRoaXMuYmFzZVVybDtcclxuXHJcbiAgICAvLyBEZWZpbml0aW9uIG9mIGV2ZW50cyB0aGF0IHRoaXMgb2JqZWN0IGNhbiB0cmlnZ2VyLFxyXG4gICAgLy8gaXRzIHZhbHVlIGNhbiBiZSBjdXN0b21pemVkIGJ1dCBhbnkgbGlzdGVuZXIgbmVlZHNcclxuICAgIC8vIHRvIGtlZXAgdXBkYXRlZCB0byB0aGUgY29ycmVjdCBldmVudCBzdHJpbmctbmFtZSB1c2VkLlxyXG4gICAgLy8gVGhlIGl0ZW1zIG1hbmlwdWxhdGlvbiBldmVudHMgTVVTVCBiZSB0cmlnZ2VyZWRcclxuICAgIC8vIGJ5IHRoZSAnaXRlbXMuc3dpdGNoJyBmdW5jdGlvblxyXG4gICAgdGhpcy5ldmVudHMgPSB7XHJcbiAgICAgICAgd2lsbE9wZW46ICdzaGVsbC13aWxsLW9wZW4nLFxyXG4gICAgICAgIHdpbGxDbG9zZTogJ3NoZWxsLXdpbGwtY2xvc2UnLFxyXG4gICAgICAgIGl0ZW1SZWFkeTogJ3NoZWxsLWl0ZW0tcmVhZHknLFxyXG4gICAgICAgIGNsb3NlZDogJ3NoZWxsLWNsb3NlZCcsXHJcbiAgICAgICAgb3BlbmVkOiAnc2hlbGwtb3BlbmVkJ1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgQSBmdW5jdGlvbiB0byBkZWNpZGUgaWYgdGhlXHJcbiAgICAgICAgYWNjZXNzIGlzIGFsbG93ZWQgKHJldHVybnMgJ251bGwnKVxyXG4gICAgICAgIG9yIG5vdCAocmV0dXJuIGEgc3RhdGUgb2JqZWN0IHdpdGggaW5mb3JtYXRpb25cclxuICAgICAgICB0aGF0IHdpbGwgYmUgcGFzc2VkIHRvIHRoZSAnbm9uQWNjZXNzTmFtZScgaXRlbTtcclxuICAgICAgICB0aGUgJ3JvdXRlJyBwcm9wZXJ0eSBvbiB0aGUgc3RhdGUgaXMgYXV0b21hdGljYWxseSBmaWxsZWQpLlxyXG4gICAgICAgIFxyXG4gICAgICAgIFRoZSBkZWZhdWx0IGJ1aXQtaW4ganVzdCBhbGxvdyBldmVyeXRoaW5nIFxyXG4gICAgICAgIGJ5IGp1c3QgcmV0dXJuaW5nICdudWxsJyBhbGwgdGhlIHRpbWUuXHJcbiAgICAgICAgXHJcbiAgICAgICAgSXQgcmVjZWl2ZXMgYXMgcGFyYW1ldGVyIHRoZSBzdGF0ZSBvYmplY3QsXHJcbiAgICAgICAgdGhhdCBhbG1vc3QgY29udGFpbnMgdGhlICdyb3V0ZScgcHJvcGVydHkgd2l0aFxyXG4gICAgICAgIGluZm9ybWF0aW9uIGFib3V0IHRoZSBVUkwuXHJcbiAgICAqKi9cclxuICAgIHRoaXMuYWNjZXNzQ29udHJvbCA9IHNldHRpbmdzLmFjY2Vzc0NvbnRyb2wgfHwgZGVwcy5hY2Nlc3NDb250cm9sO1xyXG4gICAgLy8gV2hhdCBpdGVtIGxvYWQgb24gbm9uIGFjY2Vzc1xyXG4gICAgdGhpcy5ub25BY2Nlc3NOYW1lID0gc2V0dGluZ3Mubm9uQWNjZXNzTmFtZSB8fCAnaW5kZXgnO1xyXG59XHJcblxyXG4vLyBTaGVsbCBpbmhlcml0cyBmcm9tIEV2ZW50RW1pdHRlclxyXG5TaGVsbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGRlcHMuRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwge1xyXG4gICAgY29uc3RydWN0b3I6IHtcclxuICAgICAgICB2YWx1ZTogU2hlbGwsXHJcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXHJcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTaGVsbDtcclxuXHJcblxyXG4vKiogQVBJIGRlZmluaXRpb24gKiovXHJcblxyXG5TaGVsbC5wcm90b3R5cGUuZ28gPSBmdW5jdGlvbiBnbyh1cmwsIHN0YXRlKSB7XHJcblxyXG4gICAgaWYgKHRoaXMuZm9yY2VIYXNoYmFuZykge1xyXG4gICAgICAgIGlmICghL14jIS8udGVzdCh1cmwpKSB7XHJcbiAgICAgICAgICAgIHVybCA9ICcjIScgKyB1cmw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdXJsID0gdGhpcy5hYnNvbHV0aXplVXJsKHVybCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmhpc3RvcnkucHVzaFN0YXRlKHN0YXRlLCB1bmRlZmluZWQsIHVybCk7XHJcbiAgICAvLyBwdXNoU3RhdGUgZG8gTk9UIHRyaWdnZXIgdGhlIHBvcHN0YXRlIGV2ZW50LCBzb1xyXG4gICAgcmV0dXJuIHRoaXMucmVwbGFjZShzdGF0ZSk7XHJcbn07XHJcblxyXG5TaGVsbC5wcm90b3R5cGUuZ29CYWNrID0gZnVuY3Rpb24gZ29CYWNrKHN0YXRlLCBzdGVwcykge1xyXG4gICAgc3RlcHMgPSAwIC0gKHN0ZXBzIHx8IDEpO1xyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm90aGluZyB0byBnby1iYWNrIG9yIG5vdCBlbm91Z2h0XHJcbiAgICAvLyAnYmFjaycgc3RlcHMsIGdvIHRvIHRoZSBpbmRleFxyXG4gICAgaWYgKHN0ZXBzIDwgMCAmJiBNYXRoLmFicyhzdGVwcykgPj0gdGhpcy5oaXN0b3J5Lmxlbmd0aCkge1xyXG4gICAgICAgIHRoaXMuZ28odGhpcy5pbmRleE5hbWUpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgLy8gT24gcmVwbGFjZSwgdGhlIHBhc3NlZCBzdGF0ZSBpcyBtZXJnZWQgd2l0aFxyXG4gICAgICAgIC8vIHRoZSBvbmUgdGhhdCBjb21lcyBmcm9tIHRoZSBzYXZlZCBoaXN0b3J5XHJcbiAgICAgICAgLy8gZW50cnkgKGl0ICdwb3BzJyB3aGVuIGRvaW5nIHRoZSBoaXN0b3J5LmdvKCkpXHJcbiAgICAgICAgdGhpcy5fcGVuZGluZ1N0YXRlVXBkYXRlID0gc3RhdGU7XHJcbiAgICAgICAgdGhpcy5oaXN0b3J5LmdvKHN0ZXBzKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gICAgUHJvY2VzcyB0aGUgZ2l2ZW4gc3RhdGUgaW4gb3JkZXIgdG8gZ2V0IHRoZSBjdXJyZW50IHN0YXRlXHJcbiAgICBiYXNlZCBvbiB0aGF0IG9yIHRoZSBzYXZlZCBpbiBoaXN0b3J5LCBtZXJnZSBpdCB3aXRoXHJcbiAgICBhbnkgdXBkYXRlZCBzdGF0ZSBwZW5kaW5nIGFuZCBhZGRzIHRoZSByb3V0ZSBpbmZvcm1hdGlvbixcclxuICAgIHJldHVybmluZyBhbiBzdGF0ZSBvYmplY3Qgc3VpdGFibGUgdG8gdXNlLlxyXG4qKi9cclxuU2hlbGwucHJvdG90eXBlLmdldFVwZGF0ZWRTdGF0ZSA9IGZ1bmN0aW9uIGdldFVwZGF0ZWRTdGF0ZShzdGF0ZSkge1xyXG4gICAgLypqc2hpbnQgbWF4Y29tcGxleGl0eTogOCAqL1xyXG4gICAgXHJcbiAgICAvLyBGb3IgY3VycmVudCB1c2VzLCBhbnkgcGVuZGluZ1N0YXRlVXBkYXRlIGlzIHVzZWQgYXNcclxuICAgIC8vIHRoZSBzdGF0ZSwgcmF0aGVyIHRoYW4gdGhlIHByb3ZpZGVkIG9uZVxyXG4gICAgc3RhdGUgPSB0aGlzLl9wZW5kaW5nU3RhdGVVcGRhdGUgfHwgc3RhdGUgfHwgdGhpcy5oaXN0b3J5LnN0YXRlIHx8IHt9O1xyXG4gICAgXHJcbiAgICAvLyBUT0RPOiBtb3JlIGFkdmFuY2VkIHVzZXMgbXVzdCBiZSB0byB1c2UgdGhlICdzdGF0ZScgdG9cclxuICAgIC8vIHJlY292ZXIgdGhlIFVJIHN0YXRlLCB3aXRoIGFueSBtZXNzYWdlIGZyb20gb3RoZXIgVUlcclxuICAgIC8vIHBhc3NpbmcgaW4gYSB3YXkgdGhhdCBhbGxvdyB1cGRhdGUgdGhlIHN0YXRlLCBub3RcclxuICAgIC8vIHJlcGxhY2UgaXQgKGZyb20gcGVuZGluZ1N0YXRlVXBkYXRlKS5cclxuICAgIC8qXHJcbiAgICAvLyBTdGF0ZSBvciBkZWZhdWx0IHN0YXRlXHJcbiAgICBzdGF0ZSA9IHN0YXRlIHx8IHRoaXMuaGlzdG9yeS5zdGF0ZSB8fCB7fTtcclxuICAgIC8vIG1lcmdlIHBlbmRpbmcgdXBkYXRlZCBzdGF0ZVxyXG4gICAgdGhpcy4kLmV4dGVuZChzdGF0ZSwgdGhpcy5fcGVuZGluZ1N0YXRlVXBkYXRlKTtcclxuICAgIC8vIGRpc2NhcmQgdGhlIHVwZGF0ZVxyXG4gICAgKi9cclxuICAgIHRoaXMuX3BlbmRpbmdTdGF0ZVVwZGF0ZSA9IG51bGw7XHJcbiAgICBcclxuICAgIC8vIERvZXNuJ3QgbWF0dGVycyBpZiBzdGF0ZSBpbmNsdWRlcyBhbHJlYWR5IFxyXG4gICAgLy8gJ3JvdXRlJyBpbmZvcm1hdGlvbiwgbmVlZCB0byBiZSBvdmVyd3JpdHRlblxyXG4gICAgLy8gdG8gbWF0Y2ggdGhlIGN1cnJlbnQgb25lLlxyXG4gICAgLy8gTk9URTogcHJldmlvdXNseSwgYSBjaGVjayBwcmV2ZW50ZWQgdGhpcyBpZlxyXG4gICAgLy8gcm91dGUgcHJvcGVydHkgZXhpc3RzLCBjcmVhdGluZyBpbmZpbml0ZSBsb29wc1xyXG4gICAgLy8gb24gcmVkaXJlY3Rpb25zIGZyb20gYWN0aXZpdHkuc2hvdyBzaW5jZSAncm91dGUnIGRvZXNuJ3RcclxuICAgIC8vIG1hdGNoIHRoZSBuZXcgZGVzaXJlZCBsb2NhdGlvblxyXG4gICAgXHJcbiAgICAvLyBEZXRlY3QgaWYgaXMgYSBoYXNoYmFuZyBVUkwgb3IgYW4gc3RhbmRhcmQgb25lLlxyXG4gICAgLy8gRXhjZXB0IGlmIHRoZSBhcHAgaXMgZm9yY2VkIHRvIHVzZSBoYXNoYmFuZy5cclxuICAgIHZhciBpc0hhc2hCYW5nID0gLyMhLy50ZXN0KGxvY2F0aW9uLmhyZWYpIHx8IHRoaXMuZm9yY2VIYXNoYmFuZztcclxuICAgIFxyXG4gICAgdmFyIGxpbmsgPSAoXHJcbiAgICAgICAgaXNIYXNoQmFuZyA/XHJcbiAgICAgICAgbG9jYXRpb24uaGFzaCA6XHJcbiAgICAgICAgbG9jYXRpb24ucGF0aG5hbWVcclxuICAgICkgKyAobG9jYXRpb24uc2VhcmNoIHx8ICcnKTtcclxuICAgIFxyXG4gICAgLy8gU2V0IHRoZSByb3V0ZVxyXG4gICAgc3RhdGUucm91dGUgPSB0aGlzLnBhcnNlVXJsKGxpbmspO1xyXG4gICAgXHJcbiAgICByZXR1cm4gc3RhdGU7XHJcbn07XHJcblxyXG5TaGVsbC5wcm90b3R5cGUucmVwbGFjZSA9IGZ1bmN0aW9uIHJlcGxhY2Uoc3RhdGUpIHtcclxuICAgIFxyXG4gICAgc3RhdGUgPSB0aGlzLmdldFVwZGF0ZWRTdGF0ZShzdGF0ZSk7XHJcblxyXG4gICAgLy8gVXNlIHRoZSBpbmRleCBvbiByb290IGNhbGxzXHJcbiAgICBpZiAoc3RhdGUucm91dGUucm9vdCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIHN0YXRlLnJvdXRlID0gdGhpcy5wYXJzZVVybCh0aGlzLmluZGV4TmFtZSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEFjY2VzcyBjb250cm9sXHJcbiAgICB2YXIgYWNjZXNzRXJyb3IgPSB0aGlzLmFjY2Vzc0NvbnRyb2woc3RhdGUucm91dGUpO1xyXG4gICAgaWYgKGFjY2Vzc0Vycm9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ28odGhpcy5ub25BY2Nlc3NOYW1lLCBhY2Nlc3NFcnJvcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTG9jYXRpbmcgdGhlIGNvbnRhaW5lclxyXG4gICAgdmFyICRjb250ID0gdGhpcy5pdGVtcy5maW5kKHN0YXRlLnJvdXRlLm5hbWUpO1xyXG4gICAgdmFyIHNoZWxsID0gdGhpcztcclxuICAgIHZhciBwcm9taXNlID0gbnVsbDtcclxuXHJcbiAgICBpZiAoJGNvbnQgJiYgJGNvbnQubGVuZ3RoKSB7XHJcbiAgICAgICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciAkb2xkQ29udCA9IHNoZWxsLml0ZW1zLmdldEFjdGl2ZSgpO1xyXG4gICAgICAgICAgICAgICAgJG9sZENvbnQgPSAkb2xkQ29udC5ub3QoJGNvbnQpO1xyXG4gICAgICAgICAgICAgICAgc2hlbGwuaXRlbXMuc3dpdGNoKCRvbGRDb250LCAkY29udCwgc2hlbGwsIHN0YXRlKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7IC8vPyByZXNvbHZlKGFjdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoZXgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBpZiAodGhpcy5sb2FkZXIpIHtcclxuICAgICAgICAgICAgLy8gbG9hZCBhbmQgaW5qZWN0IHRoZSBjb250ZW50IGluIHRoZSBwYWdlXHJcbiAgICAgICAgICAgIC8vIHRoZW4gdHJ5IHRoZSByZXBsYWNlIGFnYWluXHJcbiAgICAgICAgICAgIHByb21pc2UgPSB0aGlzLmxvYWRlci5sb2FkKHN0YXRlLnJvdXRlKS50aGVuKGZ1bmN0aW9uKGh0bWwpIHtcclxuICAgICAgICAgICAgICAgIC8vIEFkZCB0byB0aGUgaXRlbXMgKHRoZSBtYW5hZ2VyIHRha2VzIGNhcmUgeW91XHJcbiAgICAgICAgICAgICAgICAvLyBhZGQgb25seSB0aGUgaXRlbSwgaWYgdGhlcmUgaXMgb25lKVxyXG4gICAgICAgICAgICAgICAgc2hlbGwuaXRlbXMuaW5qZWN0KHN0YXRlLnJvdXRlLm5hbWUsIGh0bWwpO1xyXG4gICAgICAgICAgICAgICAgLy8gRG91YmxlIGNoZWNrIHRoYXQgdGhlIGl0ZW0gd2FzIGFkZGVkIGFuZCBpcyByZWFkeVxyXG4gICAgICAgICAgICAgICAgLy8gdG8gYXZvaWQgYW4gaW5maW5pdGUgbG9vcCBiZWNhdXNlIGEgcmVxdWVzdCBub3QgcmV0dXJuaW5nXHJcbiAgICAgICAgICAgICAgICAvLyB0aGUgaXRlbSBhbmQgdGhlICdyZXBsYWNlJyB0cnlpbmcgdG8gbG9hZCBpdCBhZ2FpbiwgYW5kIGFnYWluLCBhbmQuLlxyXG4gICAgICAgICAgICAgICAgaWYgKHNoZWxsLml0ZW1zLmZpbmQoc3RhdGUucm91dGUubmFtZSkubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzaGVsbC5yZXBsYWNlKHN0YXRlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdQYWdlIG5vdCBmb3VuZCAoJyArIHN0YXRlLnJvdXRlLm5hbWUgKyAnKScpO1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1NoZWxsIFBhZ2Ugbm90IGZvdW5kLCBzdGF0ZTonLCBzdGF0ZSk7XHJcbiAgICAgICAgICAgIHByb21pc2UgPSBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVG8gYXZvaWQgYmVpbmcgaW4gYW4gaW5leGlzdGFudCBVUkwgKGdlbmVyYXRpbmcgaW5jb25zaXN0ZW5jeSBiZXR3ZWVuXHJcbiAgICAgICAgICAgIC8vIGN1cnJlbnQgdmlldyBhbmQgVVJMLCBjcmVhdGluZyBiYWQgaGlzdG9yeSBlbnRyaWVzKSxcclxuICAgICAgICAgICAgLy8gYSBnb0JhY2sgaXMgZXhlY3V0ZWQsIGp1c3QgYWZ0ZXIgdGhlIGN1cnJlbnQgcGlwZSBlbmRzXHJcbiAgICAgICAgICAgIC8vIFRPRE86IGltcGxlbWVudCByZWRpcmVjdCB0aGF0IGN1dCBjdXJyZW50IHByb2Nlc3NpbmcgcmF0aGVyIHRoYW4gZXhlY3V0ZSBkZWxheWVkXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdvQmFjaygpO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcyksIDEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIHRoaXNTaGVsbCA9IHRoaXM7XHJcbiAgICBwcm9taXNlLmNhdGNoKGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgIGlmICghKGVyciBpbnN0YW5jZW9mIEVycm9yKSlcclxuICAgICAgICAgICAgZXJyID0gbmV3IEVycm9yKGVycik7XHJcblxyXG4gICAgICAgIC8vIExvZyBlcnJvciwgXHJcbiAgICAgICAgY29uc29sZS5lcnJvcignU2hlbGwsIHVuZXhwZWN0ZWQgZXJyb3IuJywgZXJyKTtcclxuICAgICAgICAvLyBub3RpZnkgYXMgYW4gZXZlbnRcclxuICAgICAgICB0aGlzU2hlbGwuZW1pdCgnZXJyb3InLCBlcnIpO1xyXG4gICAgICAgIC8vIGFuZCBjb250aW51ZSBwcm9wYWdhdGluZyB0aGUgZXJyb3JcclxuICAgICAgICByZXR1cm4gZXJyO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHByb21pc2U7XHJcbn07XHJcblxyXG5TaGVsbC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gcnVuKCkge1xyXG5cclxuICAgIHZhciBzaGVsbCA9IHRoaXM7XHJcblxyXG4gICAgLy8gQ2F0Y2ggcG9wc3RhdGUgZXZlbnQgdG8gdXBkYXRlIHNoZWxsIHJlcGxhY2luZyB0aGUgYWN0aXZlIGNvbnRhaW5lci5cclxuICAgIC8vIEFsbG93cyBwb2x5ZmlsbHMgdG8gcHJvdmlkZSBhIGRpZmZlcmVudCBidXQgZXF1aXZhbGVudCBldmVudCBuYW1lXHJcbiAgICB0aGlzLiQod2luZG93KS5vbih0aGlzLmhpc3RvcnkucG9wc3RhdGVFdmVudCB8fCAncG9wc3RhdGUnLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBzdGF0ZSA9IGV2ZW50LnN0YXRlIHx8IFxyXG4gICAgICAgICAgICAoZXZlbnQub3JpZ2luYWxFdmVudCAmJiBldmVudC5vcmlnaW5hbEV2ZW50LnN0YXRlKSB8fCBcclxuICAgICAgICAgICAgc2hlbGwuaGlzdG9yeS5zdGF0ZTtcclxuXHJcbiAgICAgICAgLy8gZ2V0IHN0YXRlIGZvciBjdXJyZW50LiBUbyBzdXBwb3J0IHBvbHlmaWxscywgd2UgdXNlIHRoZSBnZW5lcmFsIGdldHRlclxyXG4gICAgICAgIC8vIGhpc3Rvcnkuc3RhdGUgYXMgZmFsbGJhY2sgKHRoZXkgbXVzdCBiZSB0aGUgc2FtZSBvbiBicm93c2VycyBzdXBwb3J0aW5nIEhpc3RvcnkgQVBJKVxyXG4gICAgICAgIHNoZWxsLnJlcGxhY2Uoc3RhdGUpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ2F0Y2ggYWxsIGxpbmtzIGluIHRoZSBwYWdlIChub3Qgb25seSAkcm9vdCBvbmVzKSBhbmQgbGlrZS1saW5rc1xyXG4gICAgdGhpcy4kKGRvY3VtZW50KS5vbih0aGlzLmxpbmtFdmVudCwgJ1tocmVmXSwgW2RhdGEtaHJlZl0nLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyICR0ID0gc2hlbGwuJCh0aGlzKSxcclxuICAgICAgICAgICAgaHJlZiA9ICR0LmF0dHIoJ2hyZWYnKSB8fCAkdC5kYXRhKCdocmVmJyk7XHJcblxyXG4gICAgICAgIC8vIERvIG5vdGhpbmcgaWYgdGhlIFVSTCBjb250YWlucyB0aGUgcHJvdG9jb2xcclxuICAgICAgICBpZiAoL15bYS16XSs6L2kudGVzdChocmVmKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHNoZWxsLmZvcmNlSGFzaGJhbmcgJiYgL14jKFteIV18JCkvLnRlc3QoaHJlZikpIHtcclxuICAgICAgICAgICAgLy8gU3RhbmRhcmQgaGFzaCwgYnV0IG5vdCBoYXNoYmFuZzogYXZvaWQgcm91dGluZyBhbmQgZGVmYXVsdCBiZWhhdmlvclxyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAvLz8gZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgLy8gRXhlY3V0ZWQgZGVsYXllZCB0byBhdm9pZCBoYW5kbGVyIGNvbGxpc2lvbnMsIGJlY2F1c2VcclxuICAgICAgICAvLyBvZiB0aGUgbmV3IHBhZ2UgbW9kaWZ5aW5nIHRoZSBlbGVtZW50IGFuZCBvdGhlciBoYW5kbGVyc1xyXG4gICAgICAgIC8vIHJlYWRpbmcgaXQgYXR0cmlidXRlcyBhbmQgYXBwbHlpbmcgbG9naWMgb24gdGhlIHVwZGF0ZWQgbGlua1xyXG4gICAgICAgIC8vIGFzIGlmIHdhcyB0aGUgb2xkIG9uZSAoZXhhbXBsZTogc2hhcmVkIGxpbmtzLCBsaWtlIGluIGFcclxuICAgICAgICAvLyBnbG9iYWwgbmF2YmFyLCB0aGF0IG1vZGlmaWVzIHdpdGggdGhlIG5ldyBwYWdlKS5cclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBzaGVsbC5nbyhocmVmKTtcclxuICAgICAgICB9LCAxKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEluaXRpYWxsaXplIHN0YXRlXHJcbiAgICB0aGlzLml0ZW1zLmluaXQoKTtcclxuICAgIC8vIFJvdXRlIHRvIHRoZSBjdXJyZW50IHVybC9zdGF0ZVxyXG4gICAgdGhpcy5yZXBsYWNlKCk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgYWJzb2x1dGl6ZVVybCB1dGlsaXR5IFxyXG4gICAgdGhhdCBlbnN1cmVzIHRoZSB1cmwgcHJvdmlkZWRcclxuICAgIGJlaW5nIGluIHRoZSBwYXRoIG9mIHRoZSBnaXZlbiBiYXNlVXJsXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgc2FuaXRpemVVcmwgPSByZXF1aXJlKCcuL3Nhbml0aXplVXJsJyksXHJcbiAgICBlc2NhcGVSZWdFeHAgPSByZXF1aXJlKCcuLi9lc2NhcGVSZWdFeHAnKTtcclxuXHJcbmZ1bmN0aW9uIGFic29sdXRpemVVcmwoYmFzZVVybCwgdXJsKSB7XHJcblxyXG4gICAgLy8gc2FuaXRpemUgYmVmb3JlIGNoZWNrXHJcbiAgICB1cmwgPSBzYW5pdGl6ZVVybCh1cmwpO1xyXG5cclxuICAgIC8vIENoZWNrIGlmIHVzZSB0aGUgYmFzZSBhbHJlYWR5XHJcbiAgICB2YXIgbWF0Y2hCYXNlID0gbmV3IFJlZ0V4cCgnXicgKyBlc2NhcGVSZWdFeHAoYmFzZVVybCksICdpJyk7XHJcbiAgICBpZiAobWF0Y2hCYXNlLnRlc3QodXJsKSkge1xyXG4gICAgICAgIHJldHVybiB1cmw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gYnVpbGQgYW5kIHNhbml0aXplXHJcbiAgICByZXR1cm4gc2FuaXRpemVVcmwoYmFzZVVybCArIHVybCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYWJzb2x1dGl6ZVVybDtcclxuIiwiLyoqXHJcbiAgICBFeHRlcm5hbCBkZXBlbmRlbmNpZXMgZm9yIFNoZWxsIGluIGEgc2VwYXJhdGUgbW9kdWxlXHJcbiAgICB0byB1c2UgYXMgREksIG5lZWRzIHNldHVwIGJlZm9yZSBjYWxsIHRoZSBTaGVsbC5qc1xyXG4gICAgbW9kdWxlIGNsYXNzXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHBhcnNlVXJsOiBudWxsLFxyXG4gICAgYWJzb2x1dGl6ZVVybDogbnVsbCxcclxuICAgIGpxdWVyeTogbnVsbCxcclxuICAgIGxvYWRlcjogbnVsbCxcclxuICAgIGFjY2Vzc0NvbnRyb2w6IGZ1bmN0aW9uIGFsbG93QWxsKG5hbWUpIHtcclxuICAgICAgICAvLyBhbGxvdyBhY2Nlc3MgYnkgZGVmYXVsdFxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfSxcclxuICAgIEV2ZW50RW1pdHRlcjogbnVsbFxyXG59O1xyXG4iLCIvKipcclxuICAgIFNpbXBsZSBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgSGlzdG9yeSBBUEkgdXNpbmcgb25seSBoYXNoYmFuZ3MgVVJMcyxcclxuICAgIGRvZXNuJ3QgbWF0dGVycyB0aGUgYnJvd3NlciBzdXBwb3J0LlxyXG4gICAgVXNlZCB0byBhdm9pZCBmcm9tIHNldHRpbmcgVVJMcyB0aGF0IGhhcyBub3QgYW4gZW5kLXBvaW50LFxyXG4gICAgbGlrZSBpbiBsb2NhbCBlbnZpcm9ubWVudHMgd2l0aG91dCBhIHNlcnZlciBkb2luZyB1cmwtcmV3cml0aW5nLFxyXG4gICAgaW4gcGhvbmVnYXAgYXBwcywgb3IgdG8gY29tcGxldGVseSBieS1wYXNzIGJyb3dzZXIgc3VwcG9ydCBiZWNhdXNlXHJcbiAgICBpcyBidWdneSAobGlrZSBBbmRyb2lkIDw9IDQuMSkuXHJcbiAgICBcclxuICAgIE5PVEVTOlxyXG4gICAgLSBCcm93c2VyIG11c3Qgc3VwcG9ydCAnaGFzaGNoYW5nZScgZXZlbnQuXHJcbiAgICAtIEJyb3dzZXIgbXVzdCBoYXMgc3VwcG9ydCBmb3Igc3RhbmRhcmQgSlNPTiBjbGFzcy5cclxuICAgIC0gUmVsaWVzIG9uIHNlc3Npb25zdG9yYWdlIGZvciBwZXJzaXN0YW5jZSwgc3VwcG9ydGVkIGJ5IGFsbCBicm93c2VycyBhbmQgd2Vidmlld3MgXHJcbiAgICAgIGZvciBhIGVub3VnaCBsb25nIHRpbWUgbm93LlxyXG4gICAgLSBTaW1pbGFyIGFwcHJvYWNoIGFzIEhpc3RvcnkuanMgcG9seWZpbGwsIGJ1dCBzaW1wbGlmaWVkLCBhcHBlbmRpbmcgYSBmYWtlIHF1ZXJ5XHJcbiAgICAgIHBhcmFtZXRlciAnX3N1aWQ9MCcgdG8gdGhlIGhhc2ggdmFsdWUgKGFjdHVhbCBxdWVyeSBnb2VzIGJlZm9yZSB0aGUgaGFzaCwgYnV0XHJcbiAgICAgIHdlIG5lZWQgaXQgaW5zaWRlKS5cclxuICAgIC0gRm9yIHNpbXBsaWZpY2F0aW9uLCBvbmx5IHRoZSBzdGF0ZSBpcyBwZXJzaXN0ZWQsIHRoZSAndGl0bGUnIHBhcmFtZXRlciBpcyBub3RcclxuICAgICAgdXNlZCBhdCBhbGwgKHRoZSBzYW1lIGFzIG1ham9yIGJyb3dzZXJzIGRvLCBzbyBpcyBub3QgYSBwcm9ibGVtKTsgaW4gdGhpcyBsaW5lLFxyXG4gICAgICBvbmx5IGhpc3RvcnkgZW50cmllcyB3aXRoIHN0YXRlIGFyZSBwZXJzaXN0ZWQuXHJcbioqL1xyXG4vL2dsb2JhbCBsb2NhdGlvblxyXG4ndXNlIHN0cmljdCc7XHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBzYW5pdGl6ZVVybCA9IHJlcXVpcmUoJy4vc2FuaXRpemVVcmwnKSxcclxuICAgIGdldFVybFF1ZXJ5ID0gcmVxdWlyZSgnLi4vZ2V0VXJsUXVlcnknKTtcclxuXHJcbi8vIEluaXQ6IExvYWQgc2F2ZWQgY29weSBmcm9tIHNlc3Npb25TdG9yYWdlXHJcbnZhciBzZXNzaW9uID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbSgnaGFzaGJhbmdIaXN0b3J5LnN0b3JlJyk7XHJcbi8vIE9yIGNyZWF0ZSBhIG5ldyBvbmVcclxuaWYgKCFzZXNzaW9uKSB7XHJcbiAgICBzZXNzaW9uID0ge1xyXG4gICAgICAgIC8vIFN0YXRlcyBhcnJheSB3aGVyZSBlYWNoIGluZGV4IGlzIHRoZSBTVUlEIGNvZGUgYW5kIHRoZVxyXG4gICAgICAgIC8vIHZhbHVlIGlzIGp1c3QgdGhlIHZhbHVlIHBhc3NlZCBhcyBzdGF0ZSBvbiBwdXNoU3RhdGUvcmVwbGFjZVN0YXRlXHJcbiAgICAgICAgc3RhdGVzOiBbXVxyXG4gICAgfTtcclxufVxyXG5lbHNlIHtcclxuICAgIHNlc3Npb24gPSBKU09OLnBhcnNlKHNlc3Npb24pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAgICBHZXQgdGhlIFNVSUQgbnVtYmVyXHJcbiAgICBmcm9tIGEgaGFzaCBzdHJpbmdcclxuKiovXHJcbmZ1bmN0aW9uIGdldFN1aWQoaGFzaCkge1xyXG4gICAgXHJcbiAgICB2YXIgc3VpZCA9ICtnZXRVcmxRdWVyeShoYXNoKS5fc3VpZDtcclxuICAgIGlmIChpc05hTihzdWlkKSlcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIGVsc2VcclxuICAgICAgICByZXR1cm4gc3VpZDtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0U3VpZChoYXNoLCBzdWlkKSB7XHJcbiAgICBcclxuICAgIC8vIFdlIG5lZWQgdGhlIHF1ZXJ5LCBzaW5jZSB3ZSBuZWVkIFxyXG4gICAgLy8gdG8gcmVwbGFjZSB0aGUgX3N1aWQgKG1heSBleGlzdClcclxuICAgIC8vIGFuZCByZWNyZWF0ZSB0aGUgcXVlcnkgaW4gdGhlXHJcbiAgICAvLyByZXR1cm5lZCBoYXNoLXVybFxyXG4gICAgdmFyIHFzID0gZ2V0VXJsUXVlcnkoaGFzaCk7XHJcbiAgICBxcy5wdXNoKCdfc3VpZCcpO1xyXG4gICAgcXMuX3N1aWQgPSBzdWlkO1xyXG5cclxuICAgIHZhciBxdWVyeSA9IFtdO1xyXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHFzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgcXVlcnkucHVzaChxc1tpXSArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChxc1txc1tpXV0pKTtcclxuICAgIH1cclxuICAgIHF1ZXJ5ID0gcXVlcnkuam9pbignJicpO1xyXG4gICAgXHJcbiAgICBpZiAocXVlcnkpIHtcclxuICAgICAgICB2YXIgaW5kZXggPSBoYXNoLmluZGV4T2YoJz8nKTtcclxuICAgICAgICBpZiAoaW5kZXggPiAtMSlcclxuICAgICAgICAgICAgaGFzaCA9IGhhc2guc3Vic3RyKDAsIGluZGV4KTtcclxuICAgICAgICBoYXNoICs9ICc/JyArIHF1ZXJ5O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBoYXNoO1xyXG59XHJcblxyXG4vKipcclxuICAgIEFzayB0byBwZXJzaXN0IHRoZSBzZXNzaW9uIGRhdGEuXHJcbiAgICBJdCBpcyBkb25lIHdpdGggYSB0aW1lb3V0IGluIG9yZGVyIHRvIGF2b2lkXHJcbiAgICBkZWxheSBpbiB0aGUgY3VycmVudCB0YXNrIG1haW5seSBhbnkgaGFuZGxlclxyXG4gICAgdGhhdCBhY3RzIGFmdGVyIGEgSGlzdG9yeSBjaGFuZ2UuXHJcbioqL1xyXG5mdW5jdGlvbiBwZXJzaXN0KCkge1xyXG4gICAgLy8gRW5vdWdoIHRpbWUgdG8gYWxsb3cgcm91dGluZyB0YXNrcyxcclxuICAgIC8vIG1vc3QgYW5pbWF0aW9ucyBmcm9tIGZpbmlzaCBhbmQgdGhlIFVJXHJcbiAgICAvLyBiZWluZyByZXNwb25zaXZlLlxyXG4gICAgLy8gQmVjYXVzZSBzZXNzaW9uU3RvcmFnZSBpcyBzeW5jaHJvbm91cy5cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSgnaGFzaGJhbmdIaXN0b3J5LnN0b3JlJywgSlNPTi5zdHJpbmdpZnkoc2Vzc2lvbikpO1xyXG4gICAgfSwgMTUwMCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgUmV0dXJucyB0aGUgZ2l2ZW4gc3RhdGUgb3IgbnVsbFxyXG4gICAgaWYgaXMgYW4gZW1wdHkgb2JqZWN0LlxyXG4qKi9cclxuZnVuY3Rpb24gY2hlY2tTdGF0ZShzdGF0ZSkge1xyXG4gICAgXHJcbiAgICBpZiAoc3RhdGUpIHtcclxuICAgICAgICAvLyBpcyBlbXB0eT9cclxuICAgICAgICBmb3IodmFyIGkgaW4gc3RhdGUpIHtcclxuICAgICAgICAgICAgLy8gTm9cclxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBpdHMgZW1wdHlcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIC8vIEFueXRoaW5nIGVsc2VcclxuICAgIHJldHVybiBzdGF0ZTtcclxufVxyXG5cclxuLyoqXHJcbiAgICBHZXQgYSBjYW5vbmljYWwgcmVwcmVzZW50YXRpb25cclxuICAgIG9mIHRoZSBVUkwgc28gY2FuIGJlIGNvbXBhcmVkXHJcbiAgICB3aXRoIHN1Y2Nlc3MuXHJcbioqL1xyXG5mdW5jdGlvbiBjYW5ub25pY2FsVXJsKHVybCkge1xyXG4gICAgXHJcbiAgICAvLyBBdm9pZCBzb21lIGJhZCBvciBwcm9ibGVtYXRpYyBzeW50YXhcclxuICAgIHVybCA9IHNhbml0aXplVXJsKHVybCB8fCAnJyk7XHJcbiAgICBcclxuICAgIC8vIEdldCB0aGUgaGFzaCBwYXJ0XHJcbiAgICB2YXIgaWhhc2ggPSB1cmwuaW5kZXhPZignIycpO1xyXG4gICAgaWYgKGloYXNoID4gLTEpIHtcclxuICAgICAgICB1cmwgPSB1cmwuc3Vic3RyKGloYXNoICsgMSk7XHJcbiAgICB9XHJcbiAgICAvLyBNYXliZSBhIGhhc2hiYW5nIFVSTCwgcmVtb3ZlIHRoZVxyXG4gICAgLy8gJ2JhbmcnICh0aGUgaGFzaCB3YXMgcmVtb3ZlZCBhbHJlYWR5KVxyXG4gICAgdXJsID0gdXJsLnJlcGxhY2UoL14hLywgJycpO1xyXG5cclxuICAgIHJldHVybiB1cmw7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgVHJhY2tzIHRoZSBsYXRlc3QgVVJMXHJcbiAgICBiZWluZyBwdXNoZWQgb3IgcmVwbGFjZWQgYnlcclxuICAgIHRoZSBBUEkuXHJcbiAgICBUaGlzIGFsbG93cyBsYXRlciB0byBhdm9pZFxyXG4gICAgdHJpZ2dlciB0aGUgcG9wc3RhdGUgZXZlbnQsXHJcbiAgICBzaW5jZSBtdXN0IE5PVCBiZSB0cmlnZ2VyZWRcclxuICAgIGFzIGEgcmVzdWx0IG9mIHRoYXQgQVBJIG1ldGhvZHNcclxuKiovXHJcbnZhciBsYXRlc3RQdXNoZWRSZXBsYWNlZFVybCA9IG51bGw7XHJcblxyXG4vKipcclxuICAgIEhpc3RvcnkgUG9seWZpbGxcclxuKiovXHJcbnZhciBoYXNoYmFuZ0hpc3RvcnkgPSB7XHJcbiAgICBwdXNoU3RhdGU6IGZ1bmN0aW9uIHB1c2hTdGF0ZShzdGF0ZSwgdGl0bGUsIHVybCkge1xyXG5cclxuICAgICAgICAvLyBjbGVhbnVwIHVybFxyXG4gICAgICAgIHVybCA9IGNhbm5vbmljYWxVcmwodXJsKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBzYXZlIG5ldyBzdGF0ZSBmb3IgdXJsXHJcbiAgICAgICAgc3RhdGUgPSBjaGVja1N0YXRlKHN0YXRlKSB8fCBudWxsO1xyXG4gICAgICAgIGlmIChzdGF0ZSAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAvLyBzYXZlIHN0YXRlXHJcbiAgICAgICAgICAgIHNlc3Npb24uc3RhdGVzLnB1c2goc3RhdGUpO1xyXG4gICAgICAgICAgICB2YXIgc3VpZCA9IHNlc3Npb24uc3RhdGVzLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgICAgIC8vIHVwZGF0ZSBVUkwgd2l0aCB0aGUgc3VpZFxyXG4gICAgICAgICAgICB1cmwgPSBzZXRTdWlkKHVybCwgc3VpZCk7XHJcbiAgICAgICAgICAgIC8vIGNhbGwgdG8gcGVyc2lzdCB0aGUgdXBkYXRlZCBzZXNzaW9uXHJcbiAgICAgICAgICAgIHBlcnNpc3QoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGF0ZXN0UHVzaGVkUmVwbGFjZWRVcmwgPSB1cmw7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gdXBkYXRlIGxvY2F0aW9uIHRvIHRyYWNrIGhpc3Rvcnk6XHJcbiAgICAgICAgbG9jYXRpb24uaGFzaCA9ICcjIScgKyB1cmw7XHJcbiAgICB9LFxyXG4gICAgcmVwbGFjZVN0YXRlOiBmdW5jdGlvbiByZXBsYWNlU3RhdGUoc3RhdGUsIHRpdGxlLCB1cmwpIHtcclxuICAgICAgICBcclxuICAgICAgICAvLyBjbGVhbnVwIHVybFxyXG4gICAgICAgIHVybCA9IGNhbm5vbmljYWxVcmwodXJsKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBpdCBoYXMgc2F2ZWQgc3RhdGU/XHJcbiAgICAgICAgdmFyIHN1aWQgPSBnZXRTdWlkKHVybCksXHJcbiAgICAgICAgICAgIGhhc09sZFN0YXRlID0gc3VpZCAhPT0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gc2F2ZSBuZXcgc3RhdGUgZm9yIHVybFxyXG4gICAgICAgIHN0YXRlID0gY2hlY2tTdGF0ZShzdGF0ZSkgfHwgbnVsbDtcclxuICAgICAgICAvLyBpdHMgc2F2ZWQgaWYgdGhlcmUgaXMgc29tZXRoaW5nIHRvIHNhdmVcclxuICAgICAgICAvLyBvciBzb21ldGhpbmcgdG8gZGVzdHJveVxyXG4gICAgICAgIGlmIChzdGF0ZSAhPT0gbnVsbCB8fCBoYXNPbGRTdGF0ZSkge1xyXG4gICAgICAgICAgICAvLyBzYXZlIHN0YXRlXHJcbiAgICAgICAgICAgIGlmIChoYXNPbGRTdGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gcmVwbGFjZSBleGlzdGluZyBzdGF0ZVxyXG4gICAgICAgICAgICAgICAgc2Vzc2lvbi5zdGF0ZXNbc3VpZF0gPSBzdGF0ZTtcclxuICAgICAgICAgICAgICAgIC8vIHRoZSB1cmwgcmVtYWlucyB0aGUgc2FtZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIHN0YXRlXHJcbiAgICAgICAgICAgICAgICBzZXNzaW9uLnN0YXRlcy5wdXNoKHN0YXRlKTtcclxuICAgICAgICAgICAgICAgIHN1aWQgPSBzZXNzaW9uLnN0YXRlcy5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICAgICAgLy8gdXBkYXRlIFVSTCB3aXRoIHRoZSBzdWlkXHJcbiAgICAgICAgICAgICAgICB1cmwgPSBzZXRTdWlkKHVybCwgc3VpZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gY2FsbCB0byBwZXJzaXN0IHRoZSB1cGRhdGVkIHNlc3Npb25cclxuICAgICAgICAgICAgcGVyc2lzdCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBsYXRlc3RQdXNoZWRSZXBsYWNlZFVybCA9IHVybDtcclxuXHJcbiAgICAgICAgLy8gdXBkYXRlIGxvY2F0aW9uIHRvIHRyYWNrIGhpc3Rvcnk6XHJcbiAgICAgICAgbG9jYXRpb24uaGFzaCA9ICcjIScgKyB1cmw7XHJcbiAgICB9LFxyXG4gICAgZ2V0IHN0YXRlKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBzdWlkID0gZ2V0U3VpZChsb2NhdGlvbi5oYXNoKTtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICBzdWlkICE9PSBudWxsID9cclxuICAgICAgICAgICAgc2Vzc2lvbi5zdGF0ZXNbc3VpZF0gOlxyXG4gICAgICAgICAgICBudWxsXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcbiAgICBnZXQgbGVuZ3RoKCkge1xyXG4gICAgICAgIHJldHVybiB3aW5kb3cuaGlzdG9yeS5sZW5ndGg7XHJcbiAgICB9LFxyXG4gICAgZ286IGZ1bmN0aW9uIGdvKG9mZnNldCkge1xyXG4gICAgICAgIHdpbmRvdy5oaXN0b3J5LmdvKG9mZnNldCk7XHJcbiAgICB9LFxyXG4gICAgYmFjazogZnVuY3Rpb24gYmFjaygpIHtcclxuICAgICAgICB3aW5kb3cuaGlzdG9yeS5iYWNrKCk7XHJcbiAgICB9LFxyXG4gICAgZm9yd2FyZDogZnVuY3Rpb24gZm9yd2FyZCgpIHtcclxuICAgICAgICB3aW5kb3cuaGlzdG9yeS5mb3J3YXJkKCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vLyBBdHRhY2ggaGFzaGNhbmdlIGV2ZW50IHRvIHRyaWdnZXIgSGlzdG9yeSBBUEkgZXZlbnQgJ3BvcHN0YXRlJ1xyXG52YXIgJHcgPSAkKHdpbmRvdyk7XHJcbiR3Lm9uKCdoYXNoY2hhbmdlJywgZnVuY3Rpb24oZSkge1xyXG4gICAgXHJcbiAgICB2YXIgdXJsID0gZS5vcmlnaW5hbEV2ZW50Lm5ld1VSTDtcclxuICAgIHVybCA9IGNhbm5vbmljYWxVcmwodXJsKTtcclxuICAgIFxyXG4gICAgLy8gQW4gVVJMIGJlaW5nIHB1c2hlZCBvciByZXBsYWNlZFxyXG4gICAgLy8gbXVzdCBOT1QgdHJpZ2dlciBwb3BzdGF0ZVxyXG4gICAgaWYgKHVybCA9PT0gbGF0ZXN0UHVzaGVkUmVwbGFjZWRVcmwpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgXHJcbiAgICAvLyBnZXQgc3RhdGUgZnJvbSBoaXN0b3J5IGVudHJ5XHJcbiAgICAvLyBmb3IgdGhlIHVwZGF0ZWQgVVJMLCBpZiBhbnlcclxuICAgIC8vIChjYW4gaGF2ZSB2YWx1ZSB3aGVuIHRyYXZlcnNpbmdcclxuICAgIC8vIGhpc3RvcnkpLlxyXG4gICAgdmFyIHN1aWQgPSBnZXRTdWlkKHVybCksXHJcbiAgICAgICAgc3RhdGUgPSBudWxsO1xyXG4gICAgXHJcbiAgICBpZiAoc3VpZCAhPT0gbnVsbClcclxuICAgICAgICBzdGF0ZSA9IHNlc3Npb24uc3RhdGVzW3N1aWRdO1xyXG5cclxuICAgICR3LnRyaWdnZXIobmV3ICQuRXZlbnQoJ3BvcHN0YXRlJywge1xyXG4gICAgICAgIHN0YXRlOiBzdGF0ZVxyXG4gICAgfSksICdoYXNoYmFuZ0hpc3RvcnknKTtcclxufSk7XHJcblxyXG4vLyBGb3IgSGlzdG9yeUFQSSBjYXBhYmxlIGJyb3dzZXJzLCB3ZSBuZWVkXHJcbi8vIHRvIGNhcHR1cmUgdGhlIG5hdGl2ZSAncG9wc3RhdGUnIGV2ZW50IHRoYXRcclxuLy8gZ2V0cyB0cmlnZ2VyZWQgb24gb3VyIHB1c2gvcmVwbGFjZVN0YXRlIGJlY2F1c2VcclxuLy8gb2YgdGhlIGxvY2F0aW9uIGNoYW5nZSwgYnV0IHRvbyBvbiB0cmF2ZXJzaW5nXHJcbi8vIHRoZSBoaXN0b3J5IChiYWNrL2ZvcndhcmQpLlxyXG4vLyBXZSB3aWxsIGxvY2sgdGhlIGV2ZW50IGV4Y2VwdCB3aGVuIGlzXHJcbi8vIHRoZSBvbmUgd2UgdHJpZ2dlci5cclxuLy9cclxuLy8gTk9URTogdG8gdGhpcyB0cmljayB0byB3b3JrLCB0aGlzIG11c3RcclxuLy8gYmUgdGhlIGZpcnN0IGhhbmRsZXIgYXR0YWNoZWQgZm9yIHRoaXNcclxuLy8gZXZlbnQsIHNvIGNhbiBibG9jayBhbGwgb3RoZXJzLlxyXG4vLyBBTFRFUk5BVElWRTogaW5zdGVhZCBvZiB0aGlzLCBvbiB0aGVcclxuLy8gcHVzaC9yZXBsYWNlU3RhdGUgbWV0aG9kcyBkZXRlY3QgaWZcclxuLy8gSGlzdG9yeUFQSSBpcyBuYXRpdmUgc3VwcG9ydGVkIGFuZFxyXG4vLyB1c2UgcmVwbGFjZVN0YXRlIHRoZXJlIHJhdGhlciB0aGFuXHJcbi8vIGEgaGFzaCBjaGFuZ2UuXHJcbiR3Lm9uKCdwb3BzdGF0ZScsIGZ1bmN0aW9uKGUsIHNvdXJjZSkge1xyXG4gICAgXHJcbiAgICAvLyBFbnN1cmluZyBpcyB0aGUgb25lIHdlIHRyaWdnZXJcclxuICAgIGlmIChzb3VyY2UgPT09ICdoYXNoYmFuZ0hpc3RvcnknKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIFxyXG4gICAgLy8gSW4gb3RoZXIgY2FzZSwgYmxvY2s6XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG59KTtcclxuXHJcbi8vIEV4cG9zZSBBUElcclxubW9kdWxlLmV4cG9ydHMgPSBoYXNoYmFuZ0hpc3Rvcnk7XHJcbiIsIi8qKlxyXG4gICAgRGVmYXVsdCBidWlsZCBvZiB0aGUgU2hlbGwgY29tcG9uZW50LlxyXG4gICAgSXQgcmV0dXJucyB0aGUgU2hlbGwgY2xhc3MgYXMgYSBtb2R1bGUgcHJvcGVydHksXHJcbiAgICBzZXR0aW5nIHVwIHRoZSBidWlsdC1pbiBtb2R1bGVzIGFzIGl0cyBkZXBlbmRlbmNpZXMsXHJcbiAgICBhbmQgdGhlIGV4dGVybmFsICdqcXVlcnknIGFuZCAnZXZlbnRzJyAoZm9yIHRoZSBFdmVudEVtaXR0ZXIpLlxyXG4gICAgSXQgcmV0dXJucyB0b28gdGhlIGJ1aWx0LWl0IERvbUl0ZW1zTWFuYWdlciBjbGFzcyBhcyBhIHByb3BlcnR5IGZvciBjb252ZW5pZW5jZS5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBkZXBzID0gcmVxdWlyZSgnLi9kZXBlbmRlbmNpZXMnKSxcclxuICAgIERvbUl0ZW1zTWFuYWdlciA9IHJlcXVpcmUoJy4vRG9tSXRlbXNNYW5hZ2VyJyksXHJcbiAgICBwYXJzZVVybCA9IHJlcXVpcmUoJy4vcGFyc2VVcmwnKSxcclxuICAgIGFic29sdXRpemVVcmwgPSByZXF1aXJlKCcuL2Fic29sdXRpemVVcmwnKSxcclxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGxvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyksXHJcbiAgICBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXI7XHJcblxyXG4kLmV4dGVuZChkZXBzLCB7XHJcbiAgICBwYXJzZVVybDogcGFyc2VVcmwsXHJcbiAgICBhYnNvbHV0aXplVXJsOiBhYnNvbHV0aXplVXJsLFxyXG4gICAganF1ZXJ5OiAkLFxyXG4gICAgbG9hZGVyOiBsb2FkZXIsXHJcbiAgICBFdmVudEVtaXR0ZXI6IEV2ZW50RW1pdHRlclxyXG59KTtcclxuXHJcbi8vIERlcGVuZGVuY2llcyBhcmUgcmVhZHksIHdlIGNhbiBsb2FkIHRoZSBjbGFzczpcclxudmFyIFNoZWxsID0gcmVxdWlyZSgnLi9TaGVsbCcpO1xyXG5cclxuZXhwb3J0cy5TaGVsbCA9IFNoZWxsO1xyXG5leHBvcnRzLkRvbUl0ZW1zTWFuYWdlciA9IERvbUl0ZW1zTWFuYWdlcjtcclxuIiwiLyoqXHJcbiAgICBMb2FkZXIgdXRpbGl0eSB0byBsb2FkIFNoZWxsIGl0ZW1zIG9uIGRlbWFuZCB3aXRoIEFKQVhcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIFxyXG4gICAgYmFzZVVybDogJy8nLFxyXG4gICAgXHJcbiAgICBsb2FkOiBmdW5jdGlvbiBsb2FkKHJvdXRlKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnTE9BREVSIFBST01JU0UnLCByb3V0ZSwgcm91dGUubmFtZSk7XHJcbiAgICAgICAgICAgIHJlc29sdmUoJycpO1xyXG4gICAgICAgICAgICAvKiQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IG1vZHVsZS5leHBvcnRzLmJhc2VVcmwgKyByb3V0ZS5uYW1lICsgJy5odG1sJyxcclxuICAgICAgICAgICAgICAgIGNhY2hlOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgLy8gV2UgYXJlIGxvYWRpbmcgdGhlIHByb2dyYW0gYW5kIG5vIGxvYWRlciBzY3JlZW4gaW4gcGxhY2UsXHJcbiAgICAgICAgICAgICAgICAvLyBzbyBhbnkgaW4gYmV0d2VlbiBpbnRlcmFjdGlvbiB3aWxsIGJlIHByb2JsZW1hdGljLlxyXG4gICAgICAgICAgICAgICAgLy9hc3luYzogZmFsc2VcclxuICAgICAgICAgICAgfSkudGhlbihyZXNvbHZlLCByZWplY3QpOyovXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgcGFyc2VVcmwgZnVuY3Rpb24gZGV0ZWN0aW5nXHJcbiAgICB0aGUgbWFpbiBwYXJ0cyBvZiB0aGUgVVJMIGluIGFcclxuICAgIGNvbnZlbmllbmNlIHdheSBmb3Igcm91dGluZy5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBnZXRVcmxRdWVyeSA9IHJlcXVpcmUoJy4uL2dldFVybFF1ZXJ5JyksXHJcbiAgICBlc2NhcGVSZWdFeHAgPSByZXF1aXJlKCcuLi9lc2NhcGVSZWdFeHAnKTtcclxuXHJcbmZ1bmN0aW9uIHBhcnNlVXJsKGJhc2VVcmwsIGxpbmspIHtcclxuXHJcbiAgICBsaW5rID0gbGluayB8fCAnJztcclxuXHJcbiAgICB2YXIgcmF3VXJsID0gbGluaztcclxuXHJcbiAgICAvLyBoYXNoYmFuZyBzdXBwb3J0OiByZW1vdmUgdGhlICMhIG9yIHNpbmdsZSAjIGFuZCB1c2UgdGhlIHJlc3QgYXMgdGhlIGxpbmtcclxuICAgIGxpbmsgPSBsaW5rLnJlcGxhY2UoL14jIS8sICcnKS5yZXBsYWNlKC9eIy8sICcnKTtcclxuICAgIFxyXG4gICAgLy8gcmVtb3ZlIG9wdGlvbmFsIGluaXRpYWwgc2xhc2ggb3IgZG90LXNsYXNoXHJcbiAgICBsaW5rID0gbGluay5yZXBsYWNlKC9eXFwvfF5cXC5cXC8vLCAnJyk7XHJcblxyXG4gICAgLy8gVVJMIFF1ZXJ5IGFzIGFuIG9iamVjdCwgZW1wdHkgb2JqZWN0IGlmIG5vIHF1ZXJ5XHJcbiAgICB2YXIgcXVlcnkgPSBnZXRVcmxRdWVyeShsaW5rIHx8ICc/Jyk7XHJcblxyXG4gICAgLy8gcmVtb3ZlIHF1ZXJ5IGZyb20gdGhlIHJlc3Qgb2YgVVJMIHRvIHBhcnNlXHJcbiAgICBsaW5rID0gbGluay5yZXBsYWNlKC9cXD8uKiQvLCAnJyk7XHJcblxyXG4gICAgLy8gUmVtb3ZlIHRoZSBiYXNlVXJsIHRvIGdldCB0aGUgYXBwIGJhc2UuXHJcbiAgICB2YXIgcGF0aCA9IGxpbmsucmVwbGFjZShuZXcgUmVnRXhwKCdeJyArIGVzY2FwZVJlZ0V4cChiYXNlVXJsKSwgJ2knKSwgJycpO1xyXG5cclxuICAgIC8vIEdldCBmaXJzdCBzZWdtZW50IG9yIHBhZ2UgbmFtZSAoYW55dGhpbmcgdW50aWwgYSBzbGFzaCBvciBleHRlbnNpb24gYmVnZ2luaW5nKVxyXG4gICAgdmFyIG1hdGNoID0gL15cXC8/KFteXFwvXFwuXSspW15cXC9dKihcXC8uKikqJC8uZXhlYyhwYXRoKTtcclxuXHJcbiAgICB2YXIgcGFyc2VkID0ge1xyXG4gICAgICAgIHJvb3Q6IHRydWUsXHJcbiAgICAgICAgbmFtZTogbnVsbCxcclxuICAgICAgICBzZWdtZW50czogbnVsbCxcclxuICAgICAgICBwYXRoOiBudWxsLFxyXG4gICAgICAgIHVybDogcmF3VXJsLFxyXG4gICAgICAgIHF1ZXJ5OiBxdWVyeVxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICBwYXJzZWQucm9vdCA9IGZhbHNlO1xyXG4gICAgICAgIGlmIChtYXRjaFsxXSkge1xyXG4gICAgICAgICAgICBwYXJzZWQubmFtZSA9IG1hdGNoWzFdO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1hdGNoWzJdKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQucGF0aCA9IG1hdGNoWzJdO1xyXG4gICAgICAgICAgICAgICAgcGFyc2VkLnNlZ21lbnRzID0gbWF0Y2hbMl0ucmVwbGFjZSgvXlxcLy8sICcnKS5zcGxpdCgnLycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcGFyc2VkLnBhdGggPSAnLyc7XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQuc2VnbWVudHMgPSBbXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcGFyc2VkO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlVXJsOyIsIi8qKlxyXG4gICAgc2FuaXRpemVVcmwgdXRpbGl0eSB0aGF0IGVuc3VyZXNcclxuICAgIHRoYXQgcHJvYmxlbWF0aWMgcGFydHMgZ2V0IHJlbW92ZWQuXHJcbiAgICBcclxuICAgIEFzIGZvciBub3cgaXQgZG9lczpcclxuICAgIC0gcmVtb3ZlcyBwYXJlbnQgZGlyZWN0b3J5IHN5bnRheFxyXG4gICAgLSByZW1vdmVzIGR1cGxpY2F0ZWQgc2xhc2hlc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gc2FuaXRpemVVcmwodXJsKSB7XHJcbiAgICByZXR1cm4gdXJsLnJlcGxhY2UoL1xcLnsyLH0vZywgJycpLnJlcGxhY2UoL1xcL3syLH0vZywgJy8nKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzYW5pdGl6ZVVybDsiLCIvKiogXHJcbiAgICBBcHBNb2RlbCBleHRlbnNpb24sXHJcbiAgICBmb2N1c2VkIG9uIHRoZSBBY2NvdW50IHJlbGF0ZWQgQVBJczpcclxuICAgIC0gbG9naW5cclxuICAgIC0gbG9nb3V0XHJcbiAgICAtIHNpZ251cFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGxvY2FsZm9yYWdlID0gcmVxdWlyZSgnbG9jYWxmb3JhZ2UnKTtcclxuXHJcbmV4cG9ydHMucGx1Z0luID0gZnVuY3Rpb24gKEFwcE1vZGVsKSB7XHJcbiAgICAvKipcclxuICAgICAgICBUcnkgdG8gcGVyZm9ybSBhbiBhdXRvbWF0aWMgbG9naW4gaWYgdGhlcmUgaXMgYSBsb2NhbFxyXG4gICAgICAgIGNvcHkgb2YgY3JlZGVudGlhbHMgdG8gdXNlIG9uIHRoYXQsXHJcbiAgICAgICAgY2FsbGluZyB0aGUgbG9naW4gbWV0aG9kIHRoYXQgc2F2ZSB0aGUgdXBkYXRlZFxyXG4gICAgICAgIGRhdGEgYW5kIHByb2ZpbGUuXHJcbiAgICAqKi9cclxuICAgIEFwcE1vZGVsLnByb3RvdHlwZS50cnlMb2dpbiA9IGZ1bmN0aW9uIHRyeUxvZ2luKCkge1xyXG4gICAgICAgIC8vIEdldCBzYXZlZCBjcmVkZW50aWFsc1xyXG4gICAgICAgIHJldHVybiBsb2NhbGZvcmFnZS5nZXRJdGVtKCdjcmVkZW50aWFscycpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcclxuICAgICAgICAgICAgLy8gSWYgd2UgaGF2ZSBvbmVzLCB0cnkgdG8gbG9nLWluXHJcbiAgICAgICAgICAgIGlmIChjcmVkZW50aWFscykge1xyXG4gICAgICAgICAgICAgICAgLy8gQXR0ZW1wdCBsb2dpbiB3aXRoIHRoYXRcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxvZ2luKFxyXG4gICAgICAgICAgICAgICAgICAgIGNyZWRlbnRpYWxzLnVzZXJuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIGNyZWRlbnRpYWxzLnBhc3N3b3JkXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBzYXZlZCBjcmVkZW50aWFscycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgICAgUGVyZm9ybXMgYSBsb2dpbiBhdHRlbXB0IHdpdGggdGhlIEFQSSBieSB1c2luZ1xyXG4gICAgICAgIHRoZSBwcm92aWRlZCBjcmVkZW50aWFscy5cclxuICAgICoqL1xyXG4gICAgQXBwTW9kZWwucHJvdG90eXBlLmxvZ2luID0gZnVuY3Rpb24gbG9naW4odXNlcm5hbWUsIHBhc3N3b3JkKSB7XHJcblxyXG4gICAgICAgIC8vIFJlc2V0IHRoZSBleHRyYSBoZWFkZXJzIHRvIGF0dGVtcHQgdGhlIGxvZ2luXHJcbiAgICAgICAgdGhpcy5yZXN0LmV4dHJhSGVhZGVycyA9IG51bGw7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnJlc3QucG9zdCgnbG9naW4nLCB7XHJcbiAgICAgICAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcclxuICAgICAgICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkLFxyXG4gICAgICAgICAgICByZXR1cm5Qcm9maWxlOiB0cnVlXHJcbiAgICAgICAgfSkudGhlbihwZXJmb3JtTG9jYWxMb2dpbih0aGlzLCB1c2VybmFtZSwgcGFzc3dvcmQpKTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgICAgUGVyZm9ybXMgYSBsb2dvdXQsIHJlbW92aW5nIGNhY2hlZCBjcmVkZW50aWFsc1xyXG4gICAgICAgIGFuZCBwcm9maWxlIHNvIHRoZSBhcHAgY2FuIGJlIGZpbGxlZCB1cCB3aXRoXHJcbiAgICAgICAgbmV3IHVzZXIgaW5mb3JtYXRpb24uXHJcbiAgICAgICAgSXQgY2FsbHMgdG8gdGhlIEFQSSBsb2dvdXQgY2FsbCB0b28sIHRvIHJlbW92ZVxyXG4gICAgICAgIGFueSBzZXJ2ZXItc2lkZSBzZXNzaW9uIGFuZCBub3RpZmljYXRpb25cclxuICAgICAgICAocmVtb3ZlcyB0aGUgY29va2llIHRvbywgZm9yIGJyb3dzZXIgZW52aXJvbm1lbnRcclxuICAgICAgICB0aGF0IG1heSB1c2UgaXQpLlxyXG4gICAgKiovXHJcbiAgICAvLyBGVVRVUkU6IFRPUkVWSUVXIGlmIHRoZSAvbG9nb3V0IGNhbGwgY2FuIGJlIHJlbW92ZWQuXHJcbiAgICAvLyBUT0RPOiBtdXN0IHJlbW92ZSBhbGwgdGhlIGxvY2FsbHkgc2F2ZWQvY2FjaGVkIGRhdGFcclxuICAgIC8vIHJlbGF0ZWQgdG8gdGhlIHVzZXI/XHJcbiAgICBBcHBNb2RlbC5wcm90b3R5cGUubG9nb3V0ID0gZnVuY3Rpb24gbG9nb3V0KCkge1xyXG5cclxuICAgICAgICAvLyBMb2NhbCBhcHAgY2xvc2Ugc2Vzc2lvblxyXG4gICAgICAgIHRoaXMucmVzdC5leHRyYUhlYWRlcnMgPSBudWxsO1xyXG4gICAgICAgIGxvY2FsZm9yYWdlLnJlbW92ZUl0ZW0oJ2NyZWRlbnRpYWxzJyk7XHJcbiAgICAgICAgbG9jYWxmb3JhZ2UucmVtb3ZlSXRlbSgncHJvZmlsZScpO1xyXG5cclxuICAgICAgICAvLyBEb24ndCBuZWVkIHRvIHdhaXQgdGhlIHJlc3VsdCBvZiB0aGUgUkVTVCBvcGVyYXRpb25cclxuICAgICAgICB0aGlzLnJlc3QucG9zdCgnbG9nb3V0Jyk7XHJcblxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgICAgQXR0ZW1wdHMgdG8gY3JlYXRlIGEgdXNlciBhY2NvdW50LCBnZXR0aW5nIGxvZ2dlZFxyXG4gICAgICAgIGlmIHN1Y2Nlc3NmdWxseSBsaWtlIHdoZW4gZG9pbmcgYSBsb2dpbiBjYWxsLlxyXG4gICAgKiovXHJcbiAgICBBcHBNb2RlbC5wcm90b3R5cGUuc2lnbnVwID0gZnVuY3Rpb24gc2lnbnVwKHVzZXJuYW1lLCBwYXNzd29yZCwgcHJvZmlsZVR5cGUpIHtcclxuXHJcbiAgICAgICAgLy8gUmVzZXQgdGhlIGV4dHJhIGhlYWRlcnMgdG8gYXR0ZW1wdCB0aGUgc2lnbnVwXHJcbiAgICAgICAgdGhpcy5yZXN0LmV4dHJhSGVhZHJlcyA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIFRoZSByZXN1bHQgaXMgdGhlIHNhbWUgYXMgaW4gYSBsb2dpbiwgYW5kXHJcbiAgICAgICAgLy8gd2UgZG8gdGhlIHNhbWUgYXMgdGhlcmUgdG8gZ2V0IHRoZSB1c2VyIGxvZ2dlZFxyXG4gICAgICAgIC8vIG9uIHRoZSBhcHAgb24gc2lnbi11cCBzdWNjZXNzLlxyXG4gICAgICAgIHJldHVybiB0aGlzLnJlc3QucG9zdCgnc2lnbnVwP3V0bV9zb3VyY2U9YXBwJywge1xyXG4gICAgICAgICAgICB1c2VybmFtZTogdXNlcm5hbWUsXHJcbiAgICAgICAgICAgIHBhc3N3b3JkOiBwYXNzd29yZCxcclxuICAgICAgICAgICAgcHJvZmlsZVR5cGU6IHByb2ZpbGVUeXBlLFxyXG4gICAgICAgICAgICByZXR1cm5Qcm9maWxlOiB0cnVlXHJcbiAgICAgICAgfSkudGhlbihwZXJmb3JtTG9jYWxMb2dpbih0aGlzLCB1c2VybmFtZSwgcGFzc3dvcmQpKTtcclxuICAgIH07XHJcbn07XHJcblxyXG5mdW5jdGlvbiBwZXJmb3JtTG9jYWxMb2dpbih0aGlzQXBwTW9kZWwsIHVzZXJuYW1lLCBwYXNzd29yZCkge1xyXG4gICAgXHJcbiAgICByZXR1cm4gZnVuY3Rpb24obG9nZ2VkKSB7XHJcbiAgICAgICAgLy8gdXNlIGF1dGhvcml6YXRpb24ga2V5IGZvciBlYWNoXHJcbiAgICAgICAgLy8gbmV3IFJlc3QgcmVxdWVzdFxyXG4gICAgICAgIHRoaXNBcHBNb2RlbC5yZXN0LmV4dHJhSGVhZGVycyA9IHtcclxuICAgICAgICAgICAgYWx1OiBsb2dnZWQudXNlcklELFxyXG4gICAgICAgICAgICBhbGs6IGxvZ2dlZC5hdXRoS2V5XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8gYXN5bmMgbG9jYWwgc2F2ZSwgZG9uJ3Qgd2FpdFxyXG4gICAgICAgIGxvY2FsZm9yYWdlLnNldEl0ZW0oJ2NyZWRlbnRpYWxzJywge1xyXG4gICAgICAgICAgICB1c2VySUQ6IGxvZ2dlZC51c2VySUQsXHJcbiAgICAgICAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcclxuICAgICAgICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkLFxyXG4gICAgICAgICAgICBhdXRoS2V5OiBsb2dnZWQuYXV0aEtleVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIElNUE9SVEFOVDogTG9jYWwgbmFtZSBrZXB0IGluIHN5bmMgd2l0aCBzZXQtdXAgYXQgQXBwTW9kZWwudXNlclByb2ZpbGVcclxuICAgICAgICBsb2NhbGZvcmFnZS5zZXRJdGVtKCdwcm9maWxlJywgbG9nZ2VkLnByb2ZpbGUpO1xyXG5cclxuICAgICAgICAvLyBTZXQgdXNlciBkYXRhXHJcbiAgICAgICAgdGhpc0FwcE1vZGVsLnVzZXIoKS5tb2RlbC51cGRhdGVXaXRoKGxvZ2dlZC5wcm9maWxlKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGxvZ2dlZDtcclxuICAgIH07XHJcbn1cclxuIiwiLyoqIEFwcE1vZGVsIGV4dGVuc2lvbixcclxuICAgIGZvY3VzZWQgb24gdGhlIEV2ZW50cyBBUElcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxudmFyIENhbGVuZGFyRXZlbnQgPSByZXF1aXJlKCcuLi9tb2RlbHMvQ2FsZW5kYXJFdmVudCcpLFxyXG4gICAgYXBpSGVscGVyID0gcmVxdWlyZSgnLi4vdXRpbHMvYXBpSGVscGVyJyk7XHJcblxyXG5leHBvcnRzLnBsdWdJbiA9IGZ1bmN0aW9uIChBcHBNb2RlbCkge1xyXG4gICAgXHJcbiAgICBhcGlIZWxwZXIuZGVmaW5lQ3J1ZEFwaUZvclJlc3Qoe1xyXG4gICAgICAgIGV4dGVuZGVkT2JqZWN0OiBBcHBNb2RlbC5wcm90b3R5cGUsXHJcbiAgICAgICAgTW9kZWw6IENhbGVuZGFyRXZlbnQsXHJcbiAgICAgICAgbW9kZWxOYW1lOiAnQ2FsZW5kYXJFdmVudCcsXHJcbiAgICAgICAgbW9kZWxMaXN0TmFtZTogJ0NhbGVuZGFyRXZlbnRzJyxcclxuICAgICAgICBtb2RlbFVybDogJ2V2ZW50cycsXHJcbiAgICAgICAgaWRQcm9wZXJ0eU5hbWU6ICdjYWxlbmRhckV2ZW50SUQnXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLyoqICMgQVBJXHJcbiAgICAgICAgQXBwTW9kZWwucHJvdG90eXBlLmdldEV2ZW50czo6XHJcbiAgICAgICAgQHBhcmFtIHtvYmplY3R9IGZpbHRlcnM6IHtcclxuICAgICAgICAgICAgc3RhcnQ6IERhdGUsXHJcbiAgICAgICAgICAgIGVuZDogRGF0ZSxcclxuICAgICAgICAgICAgdHlwZXM6IFszLCA1XSAvLyBbb3B0aW9uYWxdIExpc3QgRXZlbnRUeXBlc0lEc1xyXG4gICAgICAgIH1cclxuICAgICAgICAtLS1cclxuICAgICAgICBBcHBNb2RlbC5wcm90b3R5cGUuZ2V0RXZlbnRcclxuICAgICAgICAtLS1cclxuICAgICAgICBBcHBNb2RlbC5wcm90b3R5cGUucHV0RXZlbnRcclxuICAgICAgICAtLS1cclxuICAgICAgICBBcHBNb2RlbC5wcm90b3R5cGUucG9zdEV2ZW50XHJcbiAgICAgICAgLS0tXHJcbiAgICAgICAgQXBwTW9kZWwucHJvdG90eXBlLmRlbEV2ZW50XHJcbiAgICAgICAgLS0tXHJcbiAgICAgICAgQXBwTW9kZWwucHJvdG90eXBlLnNldEV2ZW50XHJcbiAgICAqKi9cclxufTsiLCIvKipcclxuICAgIE1vZGVsIEFQSSB0byBtYW5hZ2UgdGhlIGNvbGxlY3Rpb24gb2YgSm9iIFRpdGxlcyBhc3NpZ25lZFxyXG4gICAgdG8gdGhlIGN1cnJlbnQgdXNlciBhbmQgaXRzIHdvcmtpbmcgZGF0YS5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmV4cG9ydHMucGx1Z0luID0gZnVuY3Rpb24gKEFwcE1vZGVsKSB7XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEdldCB0aGUgY29tcGxldGUgbGlzdCBvZiBVc2VySm9iVGl0bGUgZm9yXHJcbiAgICAgICAgYWxsIHRoZSBKb2JUaXRsZXMgYXNzaWduZWQgdG8gdGhlIGN1cnJlbnQgdXNlclxyXG4gICAgKiovXHJcbiAgICBBcHBNb2RlbC5wcm90b3R5cGUuZ2V0VXNlckpvYlByb2ZpbGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gVE9ET1xyXG4gICAgICAgIC8vIFRlc3QgZGF0YVxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoXHJcbiAgICAgICAgICAgIFtdXHJcbiAgICAgICAgKTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEdldCBhIFVzZXJKb2JUaXRsZSByZWNvcmQgZm9yIHRoZSBnaXZlblxyXG4gICAgICAgIEpvYlRpdGxlSUQgYW5kIHRoZSBjdXJyZW50IHVzZXIuXHJcbiAgICAqKi9cclxuICAgIEFwcE1vZGVsLnByb3RvdHlwZS5nZXRVc2VySm9iVGl0bGUgPSBmdW5jdGlvbiAoam9iVGl0bGVJRCkge1xyXG4gICAgICAgIC8vIFRPRE9cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xyXG4gICAgfTtcclxufTtcclxuIiwiLyoqIEJvb2tpbmdzXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgQm9va2luZyA9IHJlcXVpcmUoJy4uL21vZGVscy9Cb29raW5nJyksXHJcbiAgICBhcGlIZWxwZXIgPSByZXF1aXJlKCcuLi91dGlscy9hcGlIZWxwZXInKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpLFxyXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG5cclxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoYXBwTW9kZWwpIHtcclxuXHJcbiAgICB2YXIgYXBpID0ge1xyXG4gICAgICAgIHJlbW90ZToge1xyXG4gICAgICAgICAgICByZXN0OiBhcHBNb2RlbC5yZXN0LFxyXG4gICAgICAgICAgICBnZXRCb29raW5nczogZnVuY3Rpb24oZmlsdGVycykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QuZ2V0KCdib29raW5ncycsIGZpbHRlcnMpXHJcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihyYXdJdGVtcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByYXdJdGVtcyAmJiByYXdJdGVtcy5tYXAoZnVuY3Rpb24ocmF3SXRlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEJvb2tpbmcocmF3SXRlbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbi8qXHJcbiAgICBhcGlIZWxwZXIuZGVmaW5lQ3J1ZEFwaUZvclJlc3Qoe1xyXG4gICAgICAgIGV4dGVuZGVkT2JqZWN0OiBhcGkucmVtb3RlLFxyXG4gICAgICAgIE1vZGVsOiBCb29raW5nLFxyXG4gICAgICAgIG1vZGVsTmFtZTogJ0Jvb2tpbmcnLFxyXG4gICAgICAgIG1vZGVsTGlzdE5hbWU6ICdCb29raW5ncycsXHJcbiAgICAgICAgbW9kZWxVcmw6ICdib29raW5ncycsXHJcbiAgICAgICAgaWRQcm9wZXJ0eU5hbWU6ICdib29raW5nSUQnXHJcbiAgICB9KTsqL1xyXG5cclxuICAgIHZhciBjYWNoZUJ5RGF0ZSA9IHt9O1xyXG5cclxuICAgIGFwaS5nZXRCb29raW5nc0J5RGF0ZSA9IGZ1bmN0aW9uIGdldEJvb2tpbmdzQnlEYXRlKGRhdGUpIHtcclxuICAgICAgICB2YXIgZGF0ZUtleSA9IG1vbWVudChkYXRlKS5mb3JtYXQoJ1lZWVlNTUREJyk7XHJcbiAgICAgICAgaWYgKGNhY2hlQnlEYXRlLmhhc093blByb3BlcnR5KGRhdGVLZXkpKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNhY2hlQnlEYXRlW2RhdGVLZXldKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFRPRE8gbGF6eSBsb2FkLCBvbiBiYWNrZ3JvdW5kLCBmb3Igc3luY2hyb25pemF0aW9uXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBUT0RPIGNoZWNrIGxvY2FsZm9yYWdlIGNvcHkgZmlyc3RcclxuXHJcbiAgICAgICAgICAgIC8vIFJlbW90ZSBsb2FkaW5nIGRhdGFcclxuICAgICAgICAgICAgcmV0dXJuIGFwaS5yZW1vdGUuZ2V0Qm9va2luZ3Moe1xyXG4gICAgICAgICAgICAgICAgc3RhcnQ6IGRhdGUsXHJcbiAgICAgICAgICAgICAgICBlbmQ6IG1vbWVudChkYXRlKS5hZGQoMSwgJ2RheXMnKS50b0RhdGUoKVxyXG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKGJvb2tpbmdzKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPIGxvY2FsZm9yYWdlIGNvcHkgb2YgW2RhdGVLZXldPWJvb2tpbmdzXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUHV0IGluIGNhY2hlICh0aGV5IGFyZSBhbHJlYWR5IG1vZGVsIGluc3RhbmNlcylcclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSBrby5vYnNlcnZhYmxlQXJyYXkoYm9va2luZ3MpO1xyXG4gICAgICAgICAgICAgICAgY2FjaGVCeURhdGVbZGF0ZUtleV0gPSBhcnI7XHJcbiAgICAgICAgICAgICAgICAvLyBSZXR1cm4gdGhlIG9ic2VydmFibGUgYXJyYXlcclxuICAgICAgICAgICAgICAgIHJldHVybiBhcnI7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBcclxuICAgIHJldHVybiBhcGk7XHJcbn07XHJcbiIsIi8qKiBFdmVudHNcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBDYWxlbmRhckV2ZW50ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0NhbGVuZGFyRXZlbnQnKSxcclxuICAgIGFwaUhlbHBlciA9IHJlcXVpcmUoJy4uL3V0aWxzL2FwaUhlbHBlcicpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcblxyXG5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShhcHBNb2RlbCkge1xyXG5cclxuICAgIHZhciBhcGkgPSB7XHJcbiAgICAgICAgcmVtb3RlOiB7XHJcbiAgICAgICAgICAgIHJlc3Q6IGFwcE1vZGVsLnJlc3QsXHJcbiAgICAgICAgICAgIGdldENhbGVuZGFyRXZlbnRzOiBmdW5jdGlvbihmaWx0ZXJzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5nZXQoJ2V2ZW50cycsIGZpbHRlcnMpXHJcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihyYXdJdGVtcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByYXdJdGVtcyAmJiByYXdJdGVtcy5tYXAoZnVuY3Rpb24ocmF3SXRlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IENhbGVuZGFyRXZlbnQocmF3SXRlbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyphcGlIZWxwZXIuZGVmaW5lQ3J1ZEFwaUZvclJlc3Qoe1xyXG4gICAgICAgIGV4dGVuZGVkT2JqZWN0OiBhcGkucmVtb3RlLFxyXG4gICAgICAgIE1vZGVsOiBDYWxlbmRhckV2ZW50LFxyXG4gICAgICAgIG1vZGVsTmFtZTogJ0NhbGVuZGFyRXZlbnQnLFxyXG4gICAgICAgIG1vZGVsTGlzdE5hbWU6ICdDYWxlbmRhckV2ZW50cycsXHJcbiAgICAgICAgbW9kZWxVcmw6ICdldmVudHMnLFxyXG4gICAgICAgIGlkUHJvcGVydHlOYW1lOiAnY2FsZW5kYXJFdmVudElEJ1xyXG4gICAgfSk7Ki9cclxuXHJcbiAgICB2YXIgY2FjaGVCeURhdGUgPSB7fTtcclxuXHJcbiAgICBhcGkuZ2V0RXZlbnRzQnlEYXRlID0gZnVuY3Rpb24gZ2V0RXZlbnRzQnlEYXRlKGRhdGUpIHtcclxuICAgICAgICB2YXIgZGF0ZUtleSA9IG1vbWVudChkYXRlKS5mb3JtYXQoJ1lZWVlNTUREJyk7XHJcbiAgICAgICAgaWYgKGNhY2hlQnlEYXRlLmhhc093blByb3BlcnR5KGRhdGVLZXkpKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNhY2hlQnlEYXRlW2RhdGVLZXldKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFRPRE8gbGF6eSBsb2FkLCBvbiBiYWNrZ3JvdW5kLCBmb3Igc3luY2hyb25pemF0aW9uXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBUT0RPIGNoZWNrIGxvY2FsZm9yYWdlIGNvcHkgZmlyc3RcclxuXHJcbiAgICAgICAgICAgIC8vIFJlbW90ZSBsb2FkaW5nIGRhdGFcclxuICAgICAgICAgICAgcmV0dXJuIGFwaS5yZW1vdGUuZ2V0Q2FsZW5kYXJFdmVudHMoe1xyXG4gICAgICAgICAgICAgICAgc3RhcnQ6IGRhdGUsXHJcbiAgICAgICAgICAgICAgICBlbmQ6IG1vbWVudChkYXRlKS5hZGQoMSwgJ2RheXMnKS50b0RhdGUoKVxyXG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKGV2ZW50cykge1xyXG4gICAgICAgICAgICAgICAgLy8gVE9ETyBsb2NhbGZvcmFnZSBjb3B5IG9mIFtkYXRlS2V5XT1ib29raW5nc1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFB1dCBpbiBjYWNoZSAodGhleSBhcmUgYWxyZWFkeSBtb2RlbCBpbnN0YW5jZXMpXHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0ga28ub2JzZXJ2YWJsZUFycmF5KGV2ZW50cyk7XHJcbiAgICAgICAgICAgICAgICBjYWNoZUJ5RGF0ZVtkYXRlS2V5XSA9IGFycjtcclxuICAgICAgICAgICAgICAgIC8vIFJldHVybiB0aGUgb2JzZXJ2YWJsZSBhcnJheVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFycjtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGFwaTtcclxufTtcclxuIiwiLyoqIENhbGVuZGFyIFN5bmNpbmcgYXBwIG1vZGVsXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgQ2FsZW5kYXJTeW5jaW5nID0gcmVxdWlyZSgnLi4vbW9kZWxzL0NhbGVuZGFyU3luY2luZycpLFxyXG4gICAgUmVtb3RlTW9kZWwgPSByZXF1aXJlKCcuLi91dGlscy9SZW1vdGVNb2RlbCcpO1xyXG5cclxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoYXBwTW9kZWwpIHtcclxuICAgIHZhciByZW0gPSBuZXcgUmVtb3RlTW9kZWwoe1xyXG4gICAgICAgIGRhdGE6IG5ldyBDYWxlbmRhclN5bmNpbmcoKSxcclxuICAgICAgICB0dGw6IHsgbWludXRlczogMSB9LFxyXG4gICAgICAgIGxvY2FsU3RvcmFnZU5hbWU6ICdjYWxlbmRhclN5bmNpbmcnLFxyXG4gICAgICAgIGZldGNoOiBmdW5jdGlvbiBmZXRjaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QuZ2V0KCdjYWxlbmRhci1zeW5jaW5nJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXNoOiBmdW5jdGlvbiBwdXNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5wdXQoJ2NhbGVuZGFyLXN5bmNpbmcnLCB0aGlzLmRhdGEubW9kZWwudG9QbGFpbk9iamVjdCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gRXh0ZW5kaW5nIHdpdGggdGhlIHNwZWNpYWwgQVBJIG1ldGhvZCAncmVzZXRFeHBvcnRVcmwnXHJcbiAgICByZW0uaXNSZXNldGluZyA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgcmVtLnJlc2V0RXhwb3J0VXJsID0gZnVuY3Rpb24gcmVzZXRFeHBvcnRVcmwoKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmVtLmlzUmVzZXRpbmcodHJ1ZSk7XHJcblxyXG4gICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LnBvc3QoJ2NhbGVuZGFyLXN5bmNpbmcvcmVzZXQtZXhwb3J0LXVybCcpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24odXBkYXRlZFN5bmNTZXR0aW5ncykge1xyXG4gICAgICAgICAgICAvLyBVcGRhdGluZyB0aGUgY2FjaGVkIGRhdGFcclxuICAgICAgICAgICAgcmVtLmRhdGEubW9kZWwudXBkYXRlV2l0aCh1cGRhdGVkU3luY1NldHRpbmdzKTtcclxuICAgICAgICAgICAgcmVtLmlzUmVzZXRpbmcoZmFsc2UpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHVwZGF0ZWRTeW5jU2V0dGluZ3M7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiByZW07XHJcbn07XHJcbiIsIi8qKiBIb21lIEFkZHJlc3NcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBBZGRyZXNzID0gcmVxdWlyZSgnLi4vbW9kZWxzL0FkZHJlc3MnKTtcclxuXHJcbnZhciBSZW1vdGVNb2RlbCA9IHJlcXVpcmUoJy4uL3V0aWxzL1JlbW90ZU1vZGVsJyk7XHJcblxyXG5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShhcHBNb2RlbCkge1xyXG4gICAgcmV0dXJuIG5ldyBSZW1vdGVNb2RlbCh7XHJcbiAgICAgICAgZGF0YTogbmV3IEFkZHJlc3MoKSxcclxuICAgICAgICB0dGw6IHsgbWludXRlczogMSB9LFxyXG4gICAgICAgIGxvY2FsU3RvcmFnZU5hbWU6ICdob21lQWRkcmVzcycsXHJcbiAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uIGZldGNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5nZXQoJ2FkZHJlc3Nlcy9ob21lJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXNoOiBmdW5jdGlvbiBwdXNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5wdXQoJ2FkZHJlc3Nlcy9ob21lJywgdGhpcy5kYXRhLm1vZGVsLnRvUGxhaW5PYmplY3QoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qKiBBcHBNb2RlbCwgY2VudHJhbGl6ZXMgYWxsIHRoZSBkYXRhIGZvciB0aGUgYXBwLFxyXG4gICAgY2FjaGluZyBhbmQgc2hhcmluZyBkYXRhIGFjcm9zcyBhY3Rpdml0aWVzIGFuZCBwZXJmb3JtaW5nXHJcbiAgICByZXF1ZXN0c1xyXG4qKi9cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi4vbW9kZWxzL01vZGVsJyksXHJcbiAgICBVc2VyID0gcmVxdWlyZSgnLi4vbW9kZWxzL1VzZXInKSxcclxuICAgIFJlc3QgPSByZXF1aXJlKCcuLi91dGlscy9SZXN0JyksXHJcbiAgICBsb2NhbGZvcmFnZSA9IHJlcXVpcmUoJ2xvY2FsZm9yYWdlJyk7XHJcblxyXG5mdW5jdGlvbiBBcHBNb2RlbCh2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy51c2VyUHJvZmlsZSA9IHJlcXVpcmUoJy4vQXBwTW9kZWwudXNlclByb2ZpbGUnKS5jcmVhdGUodGhpcyk7XHJcbiAgICAvLyBOT1RFOiBBbGlhcyBmb3IgdGhlIHVzZXIgZGF0YVxyXG4gICAgLy8gVE9ETzpUT1JFVklFVyBpZiBjb250aW51ZSB0byBtYWtlcyBzZW5zZSB0byBrZWVwIHRoaXMgJ3VzZXIoKScgYWxpYXMsIGRvY3VtZW50XHJcbiAgICAvLyB3aGVyZSBpcyB1c2VkIGFuZCB3aHkgaXMgcHJlZmVycmVkIHRvIHRoZSBjYW5vbmljYWwgd2F5LlxyXG4gICAgdGhpcy51c2VyID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudXNlclByb2ZpbGUuZGF0YTtcclxuICAgIH0sIHRoaXMpO1xyXG5cclxuICAgIHRoaXMuc2NoZWR1bGluZ1ByZWZlcmVuY2VzID0gcmVxdWlyZSgnLi9BcHBNb2RlbC5zY2hlZHVsaW5nUHJlZmVyZW5jZXMnKS5jcmVhdGUodGhpcyk7XHJcbiAgICB0aGlzLmNhbGVuZGFyU3luY2luZyA9IHJlcXVpcmUoJy4vQXBwTW9kZWwuY2FsZW5kYXJTeW5jaW5nJykuY3JlYXRlKHRoaXMpO1xyXG4gICAgdGhpcy5zaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUgPSByZXF1aXJlKCcuL0FwcE1vZGVsLnNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZScpLmNyZWF0ZSh0aGlzKTtcclxuICAgIHRoaXMubWFya2V0cGxhY2VQcm9maWxlID0gcmVxdWlyZSgnLi9BcHBNb2RlbC5tYXJrZXRwbGFjZVByb2ZpbGUnKS5jcmVhdGUodGhpcyk7XHJcbiAgICB0aGlzLmhvbWVBZGRyZXNzID0gcmVxdWlyZSgnLi9BcHBNb2RlbC5ob21lQWRkcmVzcycpLmNyZWF0ZSh0aGlzKTtcclxuICAgIHRoaXMucHJpdmFjeVNldHRpbmdzID0gcmVxdWlyZSgnLi9BcHBNb2RlbC5wcml2YWN5U2V0dGluZ3MnKS5jcmVhdGUodGhpcyk7XHJcbiAgICB0aGlzLmJvb2tpbmdzID0gcmVxdWlyZSgnLi9BcHBNb2RlbC5ib29raW5ncycpLmNyZWF0ZSh0aGlzKTtcclxuICAgIHRoaXMuY2FsZW5kYXJFdmVudHMgPSByZXF1aXJlKCcuL0FwcE1vZGVsLmNhbGVuZGFyRXZlbnRzJykuY3JlYXRlKHRoaXMpO1xyXG59XHJcblxyXG5yZXF1aXJlKCcuL0FwcE1vZGVsLWFjY291bnQnKS5wbHVnSW4oQXBwTW9kZWwpO1xyXG5cclxuLyoqXHJcbiAgICBMb2FkIGNyZWRlbnRpYWxzIGZyb20gdGhlIGxvY2FsIHN0b3JhZ2UsIHdpdGhvdXQgZXJyb3IgaWYgdGhlcmUgaXMgbm90aGluZ1xyXG4gICAgc2F2ZWQuIElmIGxvYWQgcHJvZmlsZSBkYXRhIHRvbywgcGVyZm9ybWluZyBhbiB0cnlMb2dpbiBpZiBubyBsb2NhbCBkYXRhLlxyXG4qKi9cclxuQXBwTW9kZWwucHJvdG90eXBlLmxvYWRMb2NhbENyZWRlbnRpYWxzID0gZnVuY3Rpb24gbG9hZExvY2FsQ3JlZGVudGlhbHMoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcblxyXG4gICAgICAgIC8vIENhbGxiYWNrIHRvIGp1c3QgcmVzb2x2ZSB3aXRob3V0IGVycm9yIChwYXNzaW5nIGluIHRoZSBlcnJvclxyXG4gICAgICAgIC8vIHRvIHRoZSAncmVzb2x2ZScgd2lsbCBtYWtlIHRoZSBwcm9jZXNzIHRvIGZhaWwpLFxyXG4gICAgICAgIC8vIHNpbmNlIHdlIGRvbid0IG5lZWQgdG8gY3JlYXRlIGFuIGVycm9yIGZvciB0aGVcclxuICAgICAgICAvLyBhcHAgaW5pdCwgaWYgdGhlcmUgaXMgbm90IGVub3VnaCBzYXZlZCBpbmZvcm1hdGlvblxyXG4gICAgICAgIC8vIHRoZSBhcHAgaGFzIGNvZGUgdG8gcmVxdWVzdCBhIGxvZ2luLlxyXG4gICAgICAgIHZhciByZXNvbHZlQW55d2F5ID0gZnVuY3Rpb24oZG9lc25NYXR0ZXIpeyAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybmluZygnQXBwIE1vZGVsIEluaXQgZXJyJywgZG9lc25NYXR0ZXIpO1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBJZiB0aGVyZSBhcmUgY3JlZGVudGlhbHMgc2F2ZWRcclxuICAgICAgICBsb2NhbGZvcmFnZS5nZXRJdGVtKCdjcmVkZW50aWFscycpLnRoZW4oZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChjcmVkZW50aWFscyAmJlxyXG4gICAgICAgICAgICAgICAgY3JlZGVudGlhbHMudXNlcklEICYmXHJcbiAgICAgICAgICAgICAgICBjcmVkZW50aWFscy51c2VybmFtZSAmJlxyXG4gICAgICAgICAgICAgICAgY3JlZGVudGlhbHMuYXV0aEtleSkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIHVzZSBhdXRob3JpemF0aW9uIGtleSBmb3IgZWFjaFxyXG4gICAgICAgICAgICAgICAgLy8gbmV3IFJlc3QgcmVxdWVzdFxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXN0LmV4dHJhSGVhZGVycyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBhbHU6IGNyZWRlbnRpYWxzLnVzZXJJRCxcclxuICAgICAgICAgICAgICAgICAgICBhbGs6IGNyZWRlbnRpYWxzLmF1dGhLZXlcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIEl0IGhhcyBjcmVkZW50aWFscyEgSGFzIGJhc2ljIHByb2ZpbGUgZGF0YT9cclxuICAgICAgICAgICAgICAgIC8vIE5PVEU6IHRoZSB1c2VyUHJvZmlsZSB3aWxsIGxvYWQgZnJvbSBsb2NhbCBzdG9yYWdlIG9uIHRoaXMgZmlyc3RcclxuICAgICAgICAgICAgICAgIC8vIGF0dGVtcHQsIGFuZCBsYXppbHkgcmVxdWVzdCB1cGRhdGVkIGRhdGEgZnJvbSByZW1vdGVcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlclByb2ZpbGUubG9hZCgpLnRoZW4oZnVuY3Rpb24ocHJvZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9maWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgcHJvZmlsZSBjYWNoZWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRW5kIHN1Y2Nlc2Z1bGx5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vIHByb2ZpbGUsIHdlIG5lZWQgdG8gcmVxdWVzdCBpdCB0byBiZSBhYmxlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRvIHdvcmsgY29ycmVjdGx5LCBzbyB3ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhdHRlbXB0IGEgbG9naW4gKHRoZSB0cnlMb2dpbiBwcm9jZXNzIHBlcmZvcm1zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGEgbG9naW4gd2l0aCB0aGUgc2F2ZWQgY3JlZGVudGlhbHMgYW5kIGZldGNoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZSBwcm9maWxlIHRvIHNhdmUgaXQgaW4gdGhlIGxvY2FsIGNvcHkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJ5TG9naW4oKS50aGVuKHJlc29sdmUsIHJlc29sdmVBbnl3YXkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSwgcmVzb2x2ZUFueXdheSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBFbmQgc3VjY2Vzc2Z1bGx5LiBOb3QgbG9nZ2luIGlzIG5vdCBhbiBlcnJvcixcclxuICAgICAgICAgICAgICAgIC8vIGlzIGp1c3QgdGhlIGZpcnN0IGFwcCBzdGFydC11cFxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpLCByZXNvbHZlQW55d2F5KTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn07XHJcblxyXG4vKiogSW5pdGlhbGl6ZSBhbmQgd2FpdCBmb3IgYW55dGhpbmcgdXAgKiovXHJcbkFwcE1vZGVsLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gaW5pdCgpIHtcclxuICAgIFxyXG4gICAgLy8gTG9jYWwgZGF0YVxyXG4gICAgLy8gVE9ETyBJbnZlc3RpZ2F0ZSB3aHkgYXV0b21hdGljIHNlbGVjdGlvbiBhbiBJbmRleGVkREIgYXJlXHJcbiAgICAvLyBmYWlsaW5nIGFuZCB3ZSBuZWVkIHRvIHVzZSB0aGUgd29yc2UtcGVyZm9ybWFuY2UgbG9jYWxzdG9yYWdlIGJhY2stZW5kXHJcbiAgICBsb2NhbGZvcmFnZS5jb25maWcoe1xyXG4gICAgICAgIG5hbWU6ICdMb2Nvbm9taWNzQXBwJyxcclxuICAgICAgICB2ZXJzaW9uOiAwLjEsXHJcbiAgICAgICAgc2l6ZSA6IDQ5ODA3MzYsIC8vIFNpemUgb2YgZGF0YWJhc2UsIGluIGJ5dGVzLiBXZWJTUUwtb25seSBmb3Igbm93LlxyXG4gICAgICAgIHN0b3JlTmFtZSA6ICdrZXl2YWx1ZXBhaXJzJyxcclxuICAgICAgICBkZXNjcmlwdGlvbiA6ICdMb2Nvbm9taWNzIEFwcCcsXHJcbiAgICAgICAgZHJpdmVyOiBsb2NhbGZvcmFnZS5MT0NBTFNUT1JBR0VcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBGaXJzdCwgZ2V0IGFueSBzYXZlZCBsb2NhbCBjb25maWdcclxuICAgIC8vIE5PVEU6IGZvciBub3csIHRoaXMgaXMgb3B0aW9uYWwsIHRvIGdldCBhIHNhdmVkIHNpdGVVcmwgcmF0aGVyIHRoYW4gdGhlXHJcbiAgICAvLyBkZWZhdWx0IG9uZSwgaWYgYW55LlxyXG4gICAgcmV0dXJuIGxvY2FsZm9yYWdlLmdldEl0ZW0oJ2NvbmZpZycpXHJcbiAgICAudGhlbihmdW5jdGlvbihjb25maWcpIHtcclxuICAgICAgICAvLyBPcHRpb25hbCBjb25maWdcclxuICAgICAgICBjb25maWcgPSBjb25maWcgfHwge307XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGNvbmZpZy5zaXRlVXJsKSB7XHJcbiAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgaHRtbCBVUkxcclxuICAgICAgICAgICAgJCgnaHRtbCcpLmF0dHIoJ2RhdGEtc2l0ZS11cmwnLCBjb25maWcuc2l0ZVVybCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBjb25maWcuc2l0ZVVybCA9ICQoJ2h0bWwnKS5hdHRyKCdkYXRhLXNpdGUtdXJsJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMucmVzdCA9IG5ldyBSZXN0KGNvbmZpZy5zaXRlVXJsICsgJy9hcGkvdjEvZW4tVVMvJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gU2V0dXAgUmVzdCBhdXRoZW50aWNhdGlvblxyXG4gICAgICAgIHRoaXMucmVzdC5vbkF1dGhvcml6YXRpb25SZXF1aXJlZCA9IGZ1bmN0aW9uKHJldHJ5KSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRyeUxvZ2luKClcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBMb2dnZWQhIEp1c3QgcmV0cnlcclxuICAgICAgICAgICAgICAgIHJldHJ5KCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBJbml0aWFsaXplOiBjaGVjayB0aGUgdXNlciBoYXMgbG9naW4gZGF0YSBhbmQgbmVlZGVkXHJcbiAgICAgICAgLy8gY2FjaGVkIGRhdGEsIHJldHVybiBpdHMgcHJvbWlzZVxyXG4gICAgICAgIHJldHVybiB0aGlzLmxvYWRMb2NhbENyZWRlbnRpYWxzKCk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59O1xyXG5cclxuQXBwTW9kZWwucHJvdG90eXBlLmdldFVwY29taW5nQm9va2luZ3MgPSBmdW5jdGlvbiBnZXRVcGNvbWluZ0Jvb2tpbmdzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVzdC5nZXQoJ3VwY29taW5nLWJvb2tpbmdzJyk7XHJcbn07XHJcblxyXG5BcHBNb2RlbC5wcm90b3R5cGUuZ2V0Qm9va2luZyA9IGZ1bmN0aW9uIGdldEJvb2tpbmcoaWQpIHtcclxuICAgIHJldHVybiB0aGlzLnJlc3QuZ2V0KCdnZXQtYm9va2luZycsIHsgYm9va2luZ0lEOiBpZCB9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXBwTW9kZWw7XHJcblxyXG4vLyBDbGFzcyBzcGxpdGVkIGluIGRpZmZlcmVudCBmaWxlcyB0byBtaXRpZ2F0ZSBzaXplIGFuZCBvcmdhbml6YXRpb25cclxuLy8gYnV0IGtlZXBpbmcgYWNjZXNzIHRvIHRoZSBjb21tb24gc2V0IG9mIG1ldGhvZHMgYW5kIG9iamVjdHMgZWFzeSB3aXRoXHJcbi8vIHRoZSBzYW1lIGNsYXNzLlxyXG4vLyBMb2FkaW5nIGV4dGVuc2lvbnM6XHJcbnJlcXVpcmUoJy4vQXBwTW9kZWwtZXZlbnRzJykucGx1Z0luKEFwcE1vZGVsKTtcclxucmVxdWlyZSgnLi9BcHBNb2RlbC11c2VySm9iUHJvZmlsZScpLnBsdWdJbihBcHBNb2RlbCk7XHJcbiIsIi8qKiBNYXJrZXRwbGFjZVByb2ZpbGVcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBNYXJrZXRwbGFjZVByb2ZpbGUgPSByZXF1aXJlKCcuLi9tb2RlbHMvTWFya2V0cGxhY2VQcm9maWxlJyk7XHJcblxyXG52YXIgUmVtb3RlTW9kZWwgPSByZXF1aXJlKCcuLi91dGlscy9SZW1vdGVNb2RlbCcpO1xyXG5cclxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoYXBwTW9kZWwpIHtcclxuICAgIHJldHVybiBuZXcgUmVtb3RlTW9kZWwoe1xyXG4gICAgICAgIGRhdGE6IG5ldyBNYXJrZXRwbGFjZVByb2ZpbGUoKSxcclxuICAgICAgICB0dGw6IHsgbWludXRlczogMSB9LFxyXG4gICAgICAgIGxvY2FsU3RvcmFnZU5hbWU6ICdtYXJrZXRwbGFjZVByb2ZpbGUnLFxyXG4gICAgICAgIGZldGNoOiBmdW5jdGlvbiBmZXRjaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QuZ2V0KCdtYXJrZXRwbGFjZS1wcm9maWxlJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXNoOiBmdW5jdGlvbiBwdXNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5wdXQoJ21hcmtldHBsYWNlLXByb2ZpbGUnLCB0aGlzLmRhdGEubW9kZWwudG9QbGFpbk9iamVjdCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqIFByaXZhY3kgU2V0dGluZ3NcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBQcml2YWN5U2V0dGluZ3MgPSByZXF1aXJlKCcuLi9tb2RlbHMvUHJpdmFjeVNldHRpbmdzJyk7XHJcblxyXG52YXIgUmVtb3RlTW9kZWwgPSByZXF1aXJlKCcuLi91dGlscy9SZW1vdGVNb2RlbCcpO1xyXG5cclxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoYXBwTW9kZWwpIHtcclxuICAgIHJldHVybiBuZXcgUmVtb3RlTW9kZWwoe1xyXG4gICAgICAgIGRhdGE6IG5ldyBQcml2YWN5U2V0dGluZ3MoKSxcclxuICAgICAgICB0dGw6IHsgbWludXRlczogMSB9LFxyXG4gICAgICAgIGxvY2FsU3RvcmFnZU5hbWU6ICdwcml2YWN5U2V0dGluZ3MnLFxyXG4gICAgICAgIGZldGNoOiBmdW5jdGlvbiBmZXRjaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QuZ2V0KCdwcml2YWN5LXNldHRpbmdzJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXNoOiBmdW5jdGlvbiBwdXNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5wdXQoJ3ByaXZhY3ktc2V0dGluZ3MnLCB0aGlzLmRhdGEubW9kZWwudG9QbGFpbk9iamVjdCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgU2NoZWR1bGluZ1ByZWZlcmVuY2VzID0gcmVxdWlyZSgnLi4vbW9kZWxzL1NjaGVkdWxpbmdQcmVmZXJlbmNlcycpO1xyXG5cclxudmFyIFJlbW90ZU1vZGVsID0gcmVxdWlyZSgnLi4vdXRpbHMvUmVtb3RlTW9kZWwnKTtcclxuXHJcbmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKGFwcE1vZGVsKSB7XHJcbiAgICByZXR1cm4gbmV3IFJlbW90ZU1vZGVsKHtcclxuICAgICAgICBkYXRhOiBuZXcgU2NoZWR1bGluZ1ByZWZlcmVuY2VzKCksXHJcbiAgICAgICAgdHRsOiB7IG1pbnV0ZXM6IDEgfSxcclxuICAgICAgICBsb2NhbFN0b3JhZ2VOYW1lOiAnc2NoZWR1bGluZ1ByZWZlcmVuY2VzJyxcclxuICAgICAgICBmZXRjaDogZnVuY3Rpb24gZmV0Y2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgnc2NoZWR1bGluZy1wcmVmZXJlbmNlcycpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHVzaDogZnVuY3Rpb24gcHVzaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QucHV0KCdzY2hlZHVsaW5nLXByZWZlcmVuY2VzJywgdGhpcy5kYXRhLm1vZGVsLnRvUGxhaW5PYmplY3QoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSA9IHJlcXVpcmUoJy4uL21vZGVscy9TaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUnKSxcclxuICAgIFJlbW90ZU1vZGVsID0gcmVxdWlyZSgnLi4vdXRpbHMvUmVtb3RlTW9kZWwnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxuLy8gVGhlIHNsb3Qgc2l6ZSBpcyBmaXhlZCB0byAxNSBtaW51dGVzIGJ5IGRlZmF1bHQuXHJcbi8vIE5PVEU6IGN1cnJlbnRseSwgdGhlIEFQSSBvbmx5IGFsbG93cyAxNSBtaW51dGVzIHNsb3RzLFxyXG4vLyBiZWluZyB0aGF0IGltcGxpY2l0LCBidXQgcGFydCBvZiB0aGUgY29kZSBpcyByZWFkeSBmb3IgZXhwbGljaXQgc2xvdFNpemUuXHJcbnZhciBkZWZhdWx0U2xvdFNpemUgPSAxNTtcclxuLy8gQSBsaXN0IG9mIHdlZWsgZGF5IHByb3BlcnRpZXMgbmFtZXMgYWxsb3dlZFxyXG4vLyB0byBiZSBwYXJ0IG9mIHRoZSBvYmplY3RzIGRlc2NyaWJpbmcgd2Vla2x5IHNjaGVkdWxlXHJcbi8vIChzaW1wbGlmaWVkIG9yIGNvbXBsZXRlL3Nsb3QgYmFzZWQpXHJcbi8vIEp1c3QgbG93ZWNhc2VkIGVuZ2xpc2ggbmFtZXNcclxudmFyIHdlZWtEYXlQcm9wZXJ0aWVzID0gWydzdW5kYXknLCAnbW9uZGF5JywgJ3R1ZXNkYXknLCAnd2VkbmVzZGF5JywgJ3RodXJzZGF5JywgJ2ZyaWRheScsICdzYXR1cmRheSddO1xyXG5cclxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoYXBwTW9kZWwpIHtcclxuICAgIHJldHVybiBuZXcgUmVtb3RlTW9kZWwoe1xyXG4gICAgICAgIGRhdGE6IG5ldyBTaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUoKSxcclxuICAgICAgICB0dGw6IHsgbWludXRlczogMSB9LFxyXG4gICAgICAgIGxvY2FsU3RvcmFnZU5hbWU6ICd3ZWVrbHlTY2hlZHVsZScsXHJcbiAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uIGZldGNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5nZXQoJ2F2YWlsYWJpbGl0eS93ZWVrbHktc2NoZWR1bGUnKVxyXG4gICAgICAgICAgICAudGhlbihmcm9tV2Vla2x5U2NoZWR1bGUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHVzaDogZnVuY3Rpb24gcHVzaCgpIHtcclxuICAgICAgICAgICAgdmFyIHBsYWluRGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICdhbGwtdGltZSc6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgJ2pzb24tZGF0YSc6IHt9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmRhdGEuaXNBbGxUaW1lKCkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIHBsYWluRGF0YVsnYWxsLXRpbWUnXSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBwbGFpbkRhdGFbJ2pzb24tZGF0YSddID0gSlNPTi5zdHJpbmdpZnkodG9XZWVrbHlTY2hlZHVsZSh0aGlzLmRhdGEubW9kZWwudG9QbGFpbk9iamVjdCh0cnVlKSkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5wdXQoJ2F2YWlsYWJpbGl0eS93ZWVrbHktc2NoZWR1bGUnLCBwbGFpbkRhdGEpXHJcbiAgICAgICAgICAgIC50aGVuKGZyb21XZWVrbHlTY2hlZHVsZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBmcm9tV2Vla2x5U2NoZWR1bGUod2Vla2x5U2NoZWR1bGUpIHtcclxuICAgIFxyXG4gICAgLy8gTmV3IHNpbXBsaWZpZWQgb2JqZWN0LCBhcyBhIHBsYWluIG9iamVjdCB3aXRoXHJcbiAgICAvLyB3ZWVrZGF5cyBwcm9wZXJ0aWVzIGFuZCBmcm9tLXRvIHByb3BlcnRpZXMgbGlrZTpcclxuICAgIC8vIHsgc3VuZGF5OiB7IGZyb206IDAsIHRvOiA2MCB9IH1cclxuICAgIC8vIFNpbmNlIHRoaXMgaXMgZXhwZWN0ZWQgdG8gYmUgY29uc3VtZWQgYnkgZmV0Y2gtcHVzaFxyXG4gICAgLy8gb3BlcmF0aW9ucywgYW5kIGxhdGVyIGJ5IGFuICdtb2RlbC51cGRhdGVXaXRoJyBvcGVyYXRpb24sXHJcbiAgICAvLyBzbyBwbGFpbiBpcyBzaW1wbGUgYW5kIGJldHRlciBvbiBwZXJmb3JtYW5jZTsgY2FuIGJlXHJcbiAgICAvLyBjb252ZXJ0ZWQgZWFzaWx5IHRvIHRoZSBTaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUgb2JqZWN0LlxyXG4gICAgdmFyIHNpbXBsZVdTID0ge307XHJcbiAgICBcclxuICAgIC8vIE9ubHkgc3VwcG9ydHMgJ2F2YWlsYWJsZScgc3RhdHVzIHdpdGggZGVmYXVsdCAndW5hdmFpbGFibGUnXHJcbiAgICBpZiAod2Vla2x5U2NoZWR1bGUuZGVmYXVsdFN0YXR1cyAhPT0gJ3VuYXZhaWxhYmxlJyB8fFxyXG4gICAgICAgIHdlZWtseVNjaGVkdWxlLnN0YXR1cyAhPT0gJ2F2YWlsYWJsZScpIHtcclxuICAgICAgICB0aHJvdyB7XHJcbiAgICAgICAgICAgIG5hbWU6ICdpbnB1dC1mb3JtYXQnLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiAnV2Vla2x5IHNjaGVkdWxlLCBnaXZlbiBzdGF0dXNlcyBub3Qgc3VwcG9ydGVkLCBzdGF0dXM6ICcgK1xyXG4gICAgICAgICAgICB3ZWVrbHlTY2hlZHVsZS5zdGF0dXMgKyAnLCBkZWZhdWx0U3RhdHVzOiAnICsgXHJcbiAgICAgICAgICAgIHdlZWtseVNjaGVkdWxlLmRlZmF1bHRTdGF0dXNcclxuICAgICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIGdpdmVuIHNsb3RTaXplIG9yIGRlZmF1bHRcclxuICAgIHZhciBzbG90U2l6ZSA9ICh3ZWVrbHlTY2hlZHVsZS5zbG90U2l6ZSB8fCBkZWZhdWx0U2xvdFNpemUpIHwwO1xyXG5cclxuICAgIC8vIFJlYWQgc2xvdHMgcGVyIHdlZWstZGF5ICh7IHNsb3RzOiB7IFwic3VuZGF5XCI6IFtdIH0gfSlcclxuICAgIE9iamVjdC5rZXlzKHdlZWtseVNjaGVkdWxlLnNsb3RzKVxyXG4gICAgLmZvckVhY2goZnVuY3Rpb24od2Vla2RheSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFZlcmlmeSBpcyBhIHdlZWtkYXkgcHJvcGVydHksIG9yIGV4aXQgZWFybHlcclxuICAgICAgICBpZiAod2Vla0RheVByb3BlcnRpZXMuaW5kZXhPZih3ZWVrZGF5KSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB2YXIgZGF5c2xvdHMgPSB3ZWVrbHlTY2hlZHVsZS5zbG90c1t3ZWVrZGF5XTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBXZSBnZXQgdGhlIGZpcnN0IGF2YWlsYWJsZSBzbG90IGFuZCB0aGUgbGFzdCBjb25zZWN1dGl2ZVxyXG4gICAgICAgIC8vIHRvIG1ha2UgdGhlIHJhbmdlXHJcbiAgICAgICAgdmFyIGZyb20gPSBudWxsLFxyXG4gICAgICAgICAgICB0byA9IG51bGwsXHJcbiAgICAgICAgICAgIHByZXZpb3VzID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gdGltZXMgYXJlIG9yZGVyZWQgaW4gYXNjZW5kaW5nXHJcbiAgICAgICAgLy8gYW5kIHdpdGggZm9ybWF0IFwiMDA6MDA6MDBcIiB0aGF0IHdlIGNvbnZlcnQgdG8gbWludXRlc1xyXG4gICAgICAgIC8vIChlbm91Z2ggcHJlY2lzaW9uIGZvciBzaW1wbGlmaWVkIHdlZWtseSBzY2hlZHVsZSlcclxuICAgICAgICAvLyB1c2luZyBtb21lbnQuZHVyYXRpb25cclxuICAgICAgICAvLyBOT1RFOiB1c2luZyAnc29tZScgcmF0aGVyIHRoYW4gJ2ZvckVhY2gnIHRvIGJlIGFibGVcclxuICAgICAgICAvLyB0byBleGl0IGVhcmx5IGZyb20gdGhlIGl0ZXJhdGlvbiBieSByZXR1cm5pbmcgJ3RydWUnXHJcbiAgICAgICAgLy8gd2hlbiB0aGUgZW5kIGlzIHJlYWNoZWQuXHJcbiAgICAgICAgZGF5c2xvdHMuc29tZShmdW5jdGlvbihzbG90KSB7XHJcbiAgICAgICAgICAgIHZhciBtaW51dGVzID0gbW9tZW50LmR1cmF0aW9uKHNsb3QpLmFzTWludXRlcygpIHwwO1xyXG4gICAgICAgICAgICAvLyBXZSBoYXZlIG5vdCBzdGlsbCBhICdmcm9tJyB0aW1lOlxyXG4gICAgICAgICAgICBpZiAoZnJvbSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgZnJvbSA9IG1pbnV0ZXM7XHJcbiAgICAgICAgICAgICAgICBwcmV2aW91cyA9IG1pbnV0ZXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBXZSBoYXZlIGEgYmVnZ2luaW5nLCBjaGVjayBpZiB0aGlzIGlzIGNvbnNlY3V0aXZlXHJcbiAgICAgICAgICAgICAgICAvLyB0byBwcmV2aW91cywgYnkgY2hlY2tpbmcgcHJldmlvdXMgcGx1cyBzbG90U2l6ZVxyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZpb3VzICsgc2xvdFNpemUgPT09IG1pbnV0ZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBOZXcgZW5kXHJcbiAgICAgICAgICAgICAgICAgICAgdG8gPSBtaW51dGVzO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIE5leHQgaXRlcmF0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgcHJldmlvdXMgPSBtaW51dGVzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTm8gY29uc2VjdXRpdmUsIHdlIGFscmVhZHkgaGFzIGEgcmFuZ2UsIGFueVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGFkZGl0aW9uYWwgc2xvdCBpcyBkaXNjYXJkZWQsIG91dCBvZiB0aGVcclxuICAgICAgICAgICAgICAgICAgICAvLyBwcmVjaXNpb24gb2YgdGhlIHNpbXBsaWZpZWQgd2Vla2x5IHNjaGVkdWxlLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHNvIHdlIGNhbiBnbyBvdXQgdGhlIGl0ZXJhdGlvbjpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAvLyBOT1RFOiBJZiBpbiBhIGZ1dHVyZSBhIG1vcmUgY29tcGxldGUgc2NoZWR1bGVcclxuICAgICAgICAgICAgICAgICAgICAvLyBuZWVkIHRvIGJlIHdyb3RlbiB1c2luZyBtdWx0aXBsZSByYW5nZXMgcmF0aGVyXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaW5kaXZpZHVhbCBzbG90cywgdGhpcyBpcyB0aGUgcGxhY2UgdG8gY29udGludWVcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb2RpbmcsIHBvcHVsYXRpbmcgYW4gYXJyYXkgb2YgW3tmcm9tLCB0b31dIDotKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gU2xvdHMgY2hlY2tlZCwgY2hlY2sgdGhlIHJlc3VsdFxyXG4gICAgICAgIGlmIChmcm9tICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgc2ltcGxlRGF5ID0ge1xyXG4gICAgICAgICAgICAgICAgZnJvbTogZnJvbSxcclxuICAgICAgICAgICAgICAgIHRvOiAwXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHNpbXBsZVdTW3dlZWtkYXldID0gc2ltcGxlRGF5O1xyXG5cclxuICAgICAgICAgICAgLy8gV2UgaGF2ZSBhIHJhbmdlIVxyXG4gICAgICAgICAgICBpZiAodG8gIT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIC8vIGFuZCBoYXMgYW4gZW5kIVxyXG4gICAgICAgICAgICAgICAgLy8gYWRkIHRoZSBzbG90IHNpemUgdG8gdGhlIGVuZGluZ1xyXG4gICAgICAgICAgICAgICAgc2ltcGxlRGF5LnRvID0gdG8gKyBzbG90U2l6ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIHNtYWxsZXIgcmFuZ2UsIGp1c3Qgb25lIHNsb3QsXHJcbiAgICAgICAgICAgICAgICAvLyBhZGQgdGhlIHNsb3Qgc2l6ZSB0byB0aGUgYmVnaW5pbmdcclxuICAgICAgICAgICAgICAgIHNpbXBsZURheS50byA9IGZyb20gKyBzbG90U2l6ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIERvbmUhXHJcbiAgICByZXR1cm4gc2ltcGxlV1M7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgUGFzcyBpbiBhIHBsYWluIG9iamVjdCwgbm90IGEgbW9kZWwsXHJcbiAgICBnZXR0aW5nIGFuIG9iamVjdCBzdWl0YWJsZSBmb3IgdGhlIEFQSSBlbmRwb2ludC5cclxuKiovXHJcbmZ1bmN0aW9uIHRvV2Vla2x5U2NoZWR1bGUoc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlKSB7XHJcblxyXG4gICAgdmFyIHNsb3RTaXplID0gZGVmYXVsdFNsb3RTaXplO1xyXG4gICAgXHJcbiAgICAvLyBJdCdzIGJ1aWxkIHdpdGggJ2F2YWlsYWJsZScgYXMgZXhwbGljaXQgc3RhdHVzOlxyXG4gICAgdmFyIHdlZWtseVNjaGVkdWxlID0ge1xyXG4gICAgICAgIHN0YXR1czogJ2F2YWlsYWJsZScsXHJcbiAgICAgICAgZGVmYXVsdEF2YWlsYWJpbGl0eTogJ3VuYXZhaWxhYmxlJyxcclxuICAgICAgICBzbG90czoge30sXHJcbiAgICAgICAgc2xvdFNpemU6IHNsb3RTaXplXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIFBlciB3ZWVrZGF5XHJcbiAgICBPYmplY3Qua2V5cyhzaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUpXHJcbiAgICAuZm9yRWFjaChmdW5jdGlvbih3ZWVrZGF5KSB7XHJcblxyXG4gICAgICAgIC8vIFZlcmlmeSBpcyBhIHdlZWtkYXkgcHJvcGVydHksIG9yIGV4aXQgZWFybHlcclxuICAgICAgICBpZiAod2Vla0RheVByb3BlcnRpZXMuaW5kZXhPZih3ZWVrZGF5KSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHNpbXBsZURheSA9IHNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZVt3ZWVrZGF5XTtcclxuXHJcbiAgICAgICAgLy8gV2UgbmVlZCB0byBleHBhbmQgdGhlIHNpbXBsaWZpZWQgdGltZSByYW5nZXMgXHJcbiAgICAgICAgLy8gaW4gc2xvdHMgb2YgdGhlIHNsb3RTaXplXHJcbiAgICAgICAgLy8gVGhlIGVuZCB0aW1lIHdpbGwgYmUgZXhjbHVkZWQsIHNpbmNlIHNsb3RzXHJcbiAgICAgICAgLy8gZGVmaW5lIG9ubHkgdGhlIHN0YXJ0LCBiZWluZyBpbXBsaWNpdCB0aGUgc2xvdFNpemUuXHJcbiAgICAgICAgdmFyIGZyb20gPSBzaW1wbGVEYXkuZnJvbSB8MCxcclxuICAgICAgICAgICAgdG8gPSBzaW1wbGVEYXkudG8gfDA7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgc2xvdCBhcnJheVxyXG4gICAgICAgIHdlZWtseVNjaGVkdWxlLnNsb3RzW3dlZWtkYXldID0gW107XHJcblxyXG4gICAgICAgIC8vIEludGVncml0eSB2ZXJpZmljYXRpb25cclxuICAgICAgICBpZiAodG8gPiBmcm9tKSB7XHJcbiAgICAgICAgICAgIC8vIEl0ZXJhdGUgYnkgdGhlIHNsb3RTaXplIHVudGlsIHdlIHJlYWNoXHJcbiAgICAgICAgICAgIC8vIHRoZSBlbmQsIG5vdCBpbmNsdWRpbmcgdGhlICd0bycgc2luY2VcclxuICAgICAgICAgICAgLy8gc2xvdHMgaW5kaWNhdGUgb25seSB0aGUgc3RhcnQgb2YgdGhlIHNsb3RcclxuICAgICAgICAgICAgLy8gdGhhdCBpcyBhc3N1bWVkIHRvIGZpbGwgYSBzbG90U2l6ZSBzdGFydGluZ1xyXG4gICAgICAgICAgICAvLyBvbiB0aGF0IHNsb3QtdGltZVxyXG4gICAgICAgICAgICB2YXIgcHJldmlvdXMgPSBmcm9tO1xyXG4gICAgICAgICAgICB3aGlsZSAocHJldmlvdXMgPCB0bykge1xyXG4gICAgICAgICAgICAgICAgd2Vla2x5U2NoZWR1bGUuc2xvdHNbd2Vla2RheV0ucHVzaChtaW51dGVzVG9UaW1lU3RyaW5nKHByZXZpb3VzKSk7XHJcbiAgICAgICAgICAgICAgICBwcmV2aW91cyArPSBzbG90U2l6ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIERvbmUhXHJcbiAgICByZXR1cm4gd2Vla2x5U2NoZWR1bGU7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgaW50ZXJuYWwgdXRpbGl0eSBmdW5jdGlvbiAndG8gc3RyaW5nIHdpdGggdHdvIGRpZ2l0cyBhbG1vc3QnXHJcbioqL1xyXG5mdW5jdGlvbiB0d29EaWdpdHMobikge1xyXG4gICAgcmV0dXJuIE1hdGguZmxvb3IobiAvIDEwKSArICcnICsgbiAlIDEwO1xyXG59XHJcblxyXG4vKipcclxuICAgIENvbnZlcnQgYSBudW1iZXIgb2YgbWludXRlc1xyXG4gICAgaW4gYSBzdHJpbmcgbGlrZTogMDA6MDA6MDAgKGhvdXJzOm1pbnV0ZXM6c2Vjb25kcylcclxuKiovXHJcbmZ1bmN0aW9uIG1pbnV0ZXNUb1RpbWVTdHJpbmcobWludXRlcykge1xyXG4gICAgdmFyIGQgPSBtb21lbnQuZHVyYXRpb24obWludXRlcywgJ21pbnV0ZXMnKSxcclxuICAgICAgICBoID0gZC5ob3VycygpLFxyXG4gICAgICAgIG0gPSBkLm1pbnV0ZXMoKSxcclxuICAgICAgICBzID0gZC5zZWNvbmRzKCk7XHJcbiAgICBcclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgdHdvRGlnaXRzKGgpICsgJzonICtcclxuICAgICAgICB0d29EaWdpdHMobSkgKyAnOicgK1xyXG4gICAgICAgIHR3b0RpZ2l0cyhzKVxyXG4gICAgKTtcclxufVxyXG4iLCIvKiogVXNlclByb2ZpbGVcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBVc2VyID0gcmVxdWlyZSgnLi4vbW9kZWxzL1VzZXInKTtcclxuXHJcbnZhciBSZW1vdGVNb2RlbCA9IHJlcXVpcmUoJy4uL3V0aWxzL1JlbW90ZU1vZGVsJyk7XHJcblxyXG5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShhcHBNb2RlbCkge1xyXG4gICAgcmV0dXJuIG5ldyBSZW1vdGVNb2RlbCh7XHJcbiAgICAgICAgZGF0YTogVXNlci5uZXdBbm9ueW1vdXMoKSxcclxuICAgICAgICB0dGw6IHsgbWludXRlczogMSB9LFxyXG4gICAgICAgIC8vIElNUE9SVEFOVDogS2VlcCB0aGUgbmFtZSBpbiBzeW5jIHdpdGggc2V0LXVwIGF0IEFwcE1vZGVsLWFjY291bnRcclxuICAgICAgICBsb2NhbFN0b3JhZ2VOYW1lOiAncHJvZmlsZScsXHJcbiAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uIGZldGNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5nZXQoJ3Byb2ZpbGUnKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1c2g6IGZ1bmN0aW9uIHB1c2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LnB1dCgncHJvZmlsZScsIHRoaXMuZGF0YS5tb2RlbC50b1BsYWluT2JqZWN0KCkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKipcclxuICAgIFNpbXBsZSBWaWV3IE1vZGVsIHdpdGggbWFpbiBjcmVkZW50aWFscyBmb3JcclxuICAgIHVzZSBpbiBhIGZvcm0sIHdpdGggdmFsaWRhdGlvbi5cclxuICAgIFVzZWQgYnkgTG9naW4gYW5kIFNpZ251cCBhY3Rpdml0aWVzXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG5cclxuZnVuY3Rpb24gRm9ybUNyZWRlbnRpYWxzKCkge1xyXG5cclxuICAgIHRoaXMudXNlcm5hbWUgPSBrby5vYnNlcnZhYmxlKCcnKTtcclxuICAgIHRoaXMucGFzc3dvcmQgPSBrby5vYnNlcnZhYmxlKCcnKTtcclxuICAgIFxyXG4gICAgLy8gdmFsaWRhdGUgdXNlcm5hbWUgYXMgYW4gZW1haWxcclxuICAgIHZhciBlbWFpbFJlZ2V4cCA9IC9eWy0wLTlBLVphLXohIyQlJicqKy89P15fYHt8fX4uXStAWy0wLTlBLVphLXohIyQlJicqKy89P15fYHt8fX4uXSskLztcclxuICAgIHRoaXMudXNlcm5hbWUuZXJyb3IgPSBrby5vYnNlcnZhYmxlKCcnKTtcclxuICAgIHRoaXMudXNlcm5hbWUuc3Vic2NyaWJlKGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICBpZiAodikge1xyXG4gICAgICAgICAgICBpZiAoZW1haWxSZWdleHAudGVzdCh2KSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZS5lcnJvcignJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJuYW1lLmVycm9yKCdJcyBub3QgYSB2YWxpZCBlbWFpbCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnVzZXJuYW1lLmVycm9yKCdSZXF1aXJlZCcpO1xyXG4gICAgICAgIH1cclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICBcclxuICAgIC8vIHJlcXVpcmVkIHBhc3N3b3JkXHJcbiAgICB0aGlzLnBhc3N3b3JkLmVycm9yID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcbiAgICB0aGlzLnBhc3N3b3JkLnN1YnNjcmliZShmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgdmFyIGVyciA9ICcnO1xyXG4gICAgICAgIGlmICghdilcclxuICAgICAgICAgICAgZXJyID0gJ1JlcXVpcmVkJztcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnBhc3N3b3JkLmVycm9yKGVycik7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZvcm1DcmVkZW50aWFscztcclxuIiwiLyoqIE5hdkFjdGlvbiB2aWV3IG1vZGVsLlxyXG4gICAgSXQgYWxsb3dzIHNldC11cCBwZXIgYWN0aXZpdHkgZm9yIHRoZSBBcHBOYXYgYWN0aW9uIGJ1dHRvbi5cclxuKiovXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4uL21vZGVscy9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gTmF2QWN0aW9uKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBsaW5rOiAnJyxcclxuICAgICAgICBpY29uOiAnJyxcclxuICAgICAgICB0ZXh0OiAnJyxcclxuICAgICAgICAvLyAnVGVzdCcgaXMgdGhlIGhlYWRlciB0aXRsZSBidXQgcGxhY2VkIGluIHRoZSBidXR0b24vYWN0aW9uXHJcbiAgICAgICAgaXNUaXRsZTogZmFsc2UsXHJcbiAgICAgICAgLy8gJ0xpbmsnIGlzIHRoZSBlbGVtZW50IElEIG9mIGEgbW9kYWwgKHN0YXJ0cyB3aXRoIGEgIylcclxuICAgICAgICBpc01vZGFsOiBmYWxzZSxcclxuICAgICAgICAvLyAnTGluaycgaXMgYSBTaGVsbCBjb21tYW5kLCBsaWtlICdnb0JhY2sgMidcclxuICAgICAgICBpc1NoZWxsOiBmYWxzZSxcclxuICAgICAgICAvLyBTZXQgaWYgdGhlIGVsZW1lbnQgaXMgYSBtZW51IGJ1dHRvbiwgaW4gdGhhdCBjYXNlICdsaW5rJ1xyXG4gICAgICAgIC8vIHdpbGwgYmUgdGhlIElEIG9mIHRoZSBtZW51IChjb250YWluZWQgaW4gdGhlIHBhZ2U7IHdpdGhvdXQgdGhlIGhhc2gpLCB1c2luZ1xyXG4gICAgICAgIC8vIHRoZSB0ZXh0IGFuZCBpY29uIGJ1dCBzcGVjaWFsIG1lYW5pbmcgZm9yIHRoZSB0ZXh0IHZhbHVlICdtZW51J1xyXG4gICAgICAgIC8vIG9uIGljb24gcHJvcGVydHkgdGhhdCB3aWxsIHVzZSB0aGUgc3RhbmRhcmQgbWVudSBpY29uLlxyXG4gICAgICAgIGlzTWVudTogZmFsc2VcclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTmF2QWN0aW9uO1xyXG5cclxuLy8gU2V0IG9mIHZpZXcgdXRpbGl0aWVzIHRvIGdldCB0aGUgbGluayBmb3IgdGhlIGV4cGVjdGVkIGh0bWwgYXR0cmlidXRlc1xyXG5cclxuTmF2QWN0aW9uLnByb3RvdHlwZS5nZXRIcmVmID0gZnVuY3Rpb24gZ2V0SHJlZigpIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgKHRoaXMuaXNNZW51KCkgfHwgdGhpcy5pc01vZGFsKCkgfHwgdGhpcy5pc1NoZWxsKCkpID9cclxuICAgICAgICAnIycgOlxyXG4gICAgICAgIHRoaXMubGluaygpXHJcbiAgICApO1xyXG59O1xyXG5cclxuTmF2QWN0aW9uLnByb3RvdHlwZS5nZXRNb2RhbFRhcmdldCA9IGZ1bmN0aW9uIGdldE1vZGFsVGFyZ2V0KCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgICAodGhpcy5pc01lbnUoKSB8fCAhdGhpcy5pc01vZGFsKCkgfHwgdGhpcy5pc1NoZWxsKCkpID9cclxuICAgICAgICAnJyA6XHJcbiAgICAgICAgdGhpcy5saW5rKClcclxuICAgICk7XHJcbn07XHJcblxyXG5OYXZBY3Rpb24ucHJvdG90eXBlLmdldFNoZWxsQ29tbWFuZCA9IGZ1bmN0aW9uIGdldFNoZWxsQ29tbWFuZCgpIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgKHRoaXMuaXNNZW51KCkgfHwgIXRoaXMuaXNTaGVsbCgpKSA/XHJcbiAgICAgICAgJycgOlxyXG4gICAgICAgIHRoaXMubGluaygpXHJcbiAgICApO1xyXG59O1xyXG5cclxuTmF2QWN0aW9uLnByb3RvdHlwZS5nZXRNZW51SUQgPSBmdW5jdGlvbiBnZXRNZW51SUQoKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgICghdGhpcy5pc01lbnUoKSkgP1xyXG4gICAgICAgICcnIDpcclxuICAgICAgICB0aGlzLmxpbmsoKVxyXG4gICAgKTtcclxufTtcclxuXHJcbk5hdkFjdGlvbi5wcm90b3R5cGUuZ2V0TWVudUxpbmsgPSBmdW5jdGlvbiBnZXRNZW51TGluaygpIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgKCF0aGlzLmlzTWVudSgpKSA/XHJcbiAgICAgICAgJycgOlxyXG4gICAgICAgICcjJyArIHRoaXMubGluaygpXHJcbiAgICApO1xyXG59O1xyXG5cclxuLyoqIFN0YXRpYywgc2hhcmVkIGFjdGlvbnMgKiovXHJcbk5hdkFjdGlvbi5nb0hvbWUgPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICcvJyxcclxuICAgIGljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLWhvbWUnXHJcbn0pO1xyXG5cclxuTmF2QWN0aW9uLmdvQmFjayA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgbGluazogJ2dvQmFjaycsXHJcbiAgICBpY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1hcnJvdy1sZWZ0JyxcclxuICAgIGlzU2hlbGw6IHRydWVcclxufSk7XHJcblxyXG4vLyBUT0RPIFRPIFJFTU9WRSwgRXhhbXBsZSBvZiBtb2RhbFxyXG5OYXZBY3Rpb24ubmV3SXRlbSA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgbGluazogJyNuZXdJdGVtJyxcclxuICAgIGljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgaXNNb2RhbDogdHJ1ZVxyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5tZW51SW4gPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICdtZW51SW4nLFxyXG4gICAgaWNvbjogJ21lbnUnLFxyXG4gICAgaXNNZW51OiB0cnVlXHJcbn0pO1xyXG5cclxuTmF2QWN0aW9uLm1lbnVPdXQgPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICdtZW51T3V0JyxcclxuICAgIGljb246ICdtZW51JyxcclxuICAgIGlzTWVudTogdHJ1ZVxyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5tZW51TmV3SXRlbSA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgbGluazogJ21lbnVOZXdJdGVtJyxcclxuICAgIGljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgaXNNZW51OiB0cnVlXHJcbn0pO1xyXG5cclxuTmF2QWN0aW9uLmdvSGVscEluZGV4ID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnI2hlbHBJbmRleCcsXHJcbiAgICB0ZXh0OiAnaGVscCcsXHJcbiAgICBpc01vZGFsOiB0cnVlXHJcbn0pO1xyXG5cclxuTmF2QWN0aW9uLmdvTG9naW4gPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICcvbG9naW4nLFxyXG4gICAgdGV4dDogJ2xvZy1pbidcclxufSk7XHJcblxyXG5OYXZBY3Rpb24uZ29Mb2dvdXQgPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICcvbG9nb3V0JyxcclxuICAgIHRleHQ6ICdsb2ctb3V0J1xyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5nb1NpZ251cCA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgbGluazogJy9zaWdudXAnLFxyXG4gICAgdGV4dDogJ3NpZ24tdXAnXHJcbn0pO1xyXG4iLCIvKiogTmF2QmFyIHZpZXcgbW9kZWwuXHJcbiAgICBJdCBhbGxvd3MgY3VzdG9taXplIHRoZSBOYXZCYXIgcGVyIGFjdGl2aXR5LlxyXG4qKi9cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi4vbW9kZWxzL01vZGVsJyksXHJcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuL05hdkFjdGlvbicpO1xyXG5cclxuZnVuY3Rpb24gTmF2QmFyKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICAvLyBUaXRsZSBzaG93ZWQgaW4gdGhlIGNlbnRlclxyXG4gICAgICAgIC8vIFdoZW4gdGhlIHRpdGxlIGlzICdudWxsJywgdGhlIGFwcCBsb2dvIGlzIHNob3dlZCBpbiBwbGFjZSxcclxuICAgICAgICAvLyBvbiBlbXB0eSB0ZXh0LCB0aGUgZW1wdHkgdGV4dCBpcyBzaG93ZWQgYW5kIG5vIGxvZ28uXHJcbiAgICAgICAgdGl0bGU6ICcnLFxyXG4gICAgICAgIC8vIE5hdkFjdGlvbiBpbnN0YW5jZTpcclxuICAgICAgICBsZWZ0QWN0aW9uOiBudWxsLFxyXG4gICAgICAgIC8vIE5hdkFjdGlvbiBpbnN0YW5jZTpcclxuICAgICAgICByaWdodEFjdGlvbjogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBOYXZCYXI7XHJcbiJdfQ==
;