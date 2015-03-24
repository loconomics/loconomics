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

var ko = require('knockout');
    
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

/**
    Take a single CalendarEvent model and single Booking model
    and creates a CalendarSlot, using mainly the event info
    but upgraded with booking info, if there is a booking.
**/
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

/**
    Takes appModel observables for events and bookings for the same date
    and creates an array of CalendarSlots.
**/
function slotsFromEventsBookings(events, bookings) {
    return events().map(function(event) {

        var booking = null;
        bookings().some(function(searchBooking) {
            var found = searchBooking.confirmedDateID() === event.calendarEventID();
            if (found) {
                booking = searchBooking;
                return true;
            }
        });

        return convertEventToSlot(event, booking);
    });
}

/**
    Introduce free slots wherever need in the given
    array of CalendarSlots.
    It sorts the array first and append from 12AM to 12AM
    any gap with a free slot.
**/
function fillFreeSlots(slots) {

    // First, ensure list is sorted
    slots = slots.sort(function(a, b) {
        return a.startTime() > b.startTime();
    });
    
    var filledSlots = [],
        zeroTime = '00:00:00',
        last = zeroTime,
        lastDateTime = null,
        timeFormat = 'HH:mm:ss';

    slots.forEach(function(slot) {
        var start = slot.startTime(),
            s = moment(start),
            end = slot.endTime(),
            e = moment(end);

        if (s.format(timeFormat) > last) {
            
            if (lastDateTime === null) {
                // First slot of the date, 12AM=00:00
                lastDateTime = new Date(
                    start.getFullYear(), start.getMonth(), start.getDate(),
                    0, 0, 0
                );
            }

            // There is a gap, filled it
            filledSlots.push(createFreeSlot({
                start: lastDateTime,
                end: start
            }));
        }

        filledSlots.push(slot);
        lastDateTime = end;
        last = e.format(timeFormat);
    });
    
    // Check latest to see a gap at the end:
    var lastEnd = lastDateTime && moment(lastDateTime).format(timeFormat);
    if (lastEnd !== zeroTime) {
        // There is a gap, filled it
        var nextMidnight = new Date(
            lastDateTime.getFullYear(),
            lastDateTime.getMonth(),
            // Next date!
            lastDateTime.getDate() + 1,
            // At zero hours!
            0, 0, 0
        );

        filledSlots.push(createFreeSlot({
            start: lastDateTime,
            end: nextMidnight
        }));
    }

    return filledSlots;
}

function ViewModel(app) {

    this.currentDate = ko.observable(new Date());
    var fullDayFree = [createFreeSlot({ date: this.currentDate() })];

    // slotsSource save the data as processed by a request of 
    // data because a date change.
    // It's updated by changes on currentDate that performs the remote loading
    this.slotsSource = ko.observable(fullDayFree);
    // slots computed, using slotsSource.
    // As computed in order to allow any other observable change
    // from trigger the creation of a new value
    this.slots = ko.computed(function() {
    
        var slots = this.slotsSource();
        
        return fillFreeSlots(slots);

    }, this);
    
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

        this.isLoading(true);
        
        Promise.all([
            app.model.bookings.getBookingsByDate(date),
            app.model.calendarEvents.getEventsByDate(date)
        ]).then(function(group) {
            
            // IMPORTANT: First, we need to check that we 
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
                // Create the slots and update the source:
                this.slotsSource(slotsFromEventsBookings(events, bookings));

                this.isLoading(false);
            }
            else {
                this.slotsSource(fullDayFree);
                this.isLoading(false);
            }

        }.bind(this))
        .catch(function(err) {
            
            // Show free on error
            this.slotsSource(fullDayFree);
            this.isLoading(false);
            
            var msg = 'Error loading calendar events.';
            app.modals.showError({
                title: msg,
                error: err && err.error || err
            });
            
        }.bind(this));

    }.bind(this));
}

},{"../components/Activity":44,"../components/DatePicker":45,"../models/CalendarSlot":53,"../utils/Time":83,"knockout":false,"moment":false}],7:[function(require,module,exports){
/**
    CalendarSyncing activity
**/
'use strict';

var Activity = require('../components/Activity'),
    $ = require('jquery'),
    ko = require('knockout');

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

},{"../components/Activity":44,"knockout":false}],8:[function(require,module,exports){
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

var ko = require('knockout'),
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

},{"../components/Activity":44,"../testdata/clients":72,"knockout":false}],10:[function(require,module,exports){
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

},{"../components/Activity":44,"../testdata/clients":72,"knockout":false}],11:[function(require,module,exports){
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

},{"../components/Activity":44,"../models/MailFolder":59,"../testdata/messages":74,"knockout":false}],14:[function(require,module,exports){
/**
    datetimePicker activity
**/
'use strict';

var moment = require('moment'),
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
                this.requestData.selectedDatetime = datetime;
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

},{"../components/Activity":44,"../components/DatePicker":45,"../testdata/timeSlots":76,"../utils/Time":83,"knockout":false,"moment":false}],15:[function(require,module,exports){
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

var ko = require('knockout');

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

},{"../components/Activity":44,"../models/GetMore":56,"../models/MailFolder":59,"../models/PerformanceSummary":63,"../models/UpcomingBookingsSummary":69,"../testdata/messages":74,"knockout":false}],19:[function(require,module,exports){
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

},{"../components/Activity":44,"../models/MailFolder":59,"../testdata/messages":74,"knockout":false}],20:[function(require,module,exports){
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

var ko = require('knockout'),
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

},{"../components/Activity":44,"../testdata/locations":73,"knockout":false}],25:[function(require,module,exports){
/**
    Login activity
**/
'use strict';

var ko = require('knockout'),
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
                ).then(function(/*loginData*/) {

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

},{"../components/Activity":44,"../viewmodels/FormCredentials":115,"knockout":false}],26:[function(require,module,exports){
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

var ko = require('knockout'),
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

},{"../components/Activity":44,"knockout":false}],32:[function(require,module,exports){
/**
    Scheduling activity
**/
'use strict';

var Activity = require('../components/Activity');

var A = Activity.extends(function SchedulingActivity() {
    
    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.LoggedUser;
    //this.viewModel = new ViewModel(this.app);
    this.navBar = Activity.createSectionNavBar('Scheduling');
});

exports.init = A.init;

},{"../components/Activity":44}],33:[function(require,module,exports){
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
var ko = require('knockout');
    
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

},{"../components/Activity":44,"../testdata/services":75,"knockout":false}],35:[function(require,module,exports){
/**
    Signup activity
**/
'use strict';

var ko = require('knockout'),
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
                ).then(function(/*signupData*/) {

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

},{"../components/Activity":44,"../viewmodels/FormCredentials":115,"knockout":false}],36:[function(require,module,exports){
/**
    textEditor activity
**/
'use strict';

var ko = require('knockout'),
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

},{"../components/Activity":44,"knockout":false}],38:[function(require,module,exports){
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

},{"./utils/jsPropertiesTools":92,"knockout":false}],39:[function(require,module,exports){
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

},{"./viewmodels/NavAction":116,"./viewmodels/NavBar":117,"knockout":false}],40:[function(require,module,exports){
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
var AppModel = require('./viewmodels/AppModel');

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
    $(document).on('click.bs.collapse.data-api.workaround', '[data-toggle="collapse"]', function() {
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
    var trigLayout = function trigLayout() {
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

},{"./app-components":38,"./app-navbar":39,"./app.activities":40,"./app.modals":42,"./app.shell":43,"./components/SmartNavBar":46,"./locales/en-US-LC":47,"./utils/Function.prototype._delayed":78,"./utils/Function.prototype._inherits":79,"./utils/accessControl":84,"./utils/bootknockBindingHelpers":86,"./utils/bootstrapSwitchBinding":87,"./utils/jquery.multiline":91,"./viewmodels/AppModel":109,"es6-promise":false,"knockout":false}],42:[function(require,module,exports){
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

},{"./utils/shell/hashbangHistory":97,"./utils/shell/index":98}],44:[function(require,module,exports){
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

},{"../utils/Function.prototype._inherits":79,"../viewmodels/NavAction":116,"../viewmodels/NavBar":117,"knockout":false}],45:[function(require,module,exports){
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
    onRender: function(/*date*/) {
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

var Model = require('./Model');

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

},{"./Model":62}],51:[function(require,module,exports){
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
    Model = require('./Model');
   
function CalendarEvent(values) {
    
    Model(this);
    
    // Special values: dates must be converted
    // to a Date object. They come as ISO string
    // TODO: Make this something generic, or even in Model definitions,
    // and use for updated/createdDate around all the project
    if (values) {
        values.startTime = values.startTime && new Date(Date.parse(values.startTime)) || null;
        values.endTime = values.endTime && new Date(Date.parse(values.endTime)) || null;
    }

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
},{"./Model":62,"knockout":false}],53:[function(require,module,exports){
/** CalendarSlot model.

    Describes a time slot in the calendar, for a consecutive
    event, appointment or free time.
 **/
'use strict';

var Model = require('./Model');

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

},{"./Model":62}],54:[function(require,module,exports){
/**
    CalendarSyncing model.
 **/
'use strict';

var Model = require('./Model');

function CalendarSyncing(values) {

    Model(this);

    this.model.defProperties({
        icalExportUrl: '',
        icalImportUrl: ''
    }, values);
}

module.exports = CalendarSyncing;

},{"./Model":62}],55:[function(require,module,exports){
/** Client model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model');

// TODO Double check User, must be the same or extended??

function Client(values) {
    
    Model(this);
    
    this.model.defProperties({
        id: 0,
        firstName: '',
        lastName: '',
        email: '',
        phone: null,
        canReceiveSms: false,
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
    }, values);
    
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

var Model = require('./Model');

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

},{"./Model":62}],58:[function(require,module,exports){
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

},{"./Model":62,"knockout":false,"lodash":false}],60:[function(require,module,exports){
/** MarketplaceProfile model **/
'use strict';

var Model = require('./Model');

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

},{"./Model":62}],61:[function(require,module,exports){
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
                return this[fieldName]();
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

var Model = require('./Model');

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

},{"./Model":62}],65:[function(require,module,exports){
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

var Model = require('./Model');

function SchedulingPreferences(values) {
    
    Model(this);

    this.model.defProperties({
        advanceTime: 24,
        betweenTime: 0,
        incrementsSizeInMinutes: 15
    }, values);
}

module.exports = SchedulingPreferences;

},{"./Model":62}],67:[function(require,module,exports){
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
        write: function(/*val*/) {
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

var //today = moment(),
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

},{"../models/Appointment":49,"./locations":73,"./services":75,"knockout":false,"moment":false}],72:[function(require,module,exports){
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

},{"../models/Client":55}],73:[function(require,module,exports){
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

},{"../models/Location":58}],74:[function(require,module,exports){
/** Inbox test data **/
var Message = require('../models/Message');

var Time = require('../utils/Time');
//var moment = require('moment');

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

},{"../models/Message":61,"../utils/Time":83}],75:[function(require,module,exports){
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

},{"../models/Service":67}],76:[function(require,module,exports){
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

},{"../utils/Time":83,"moment":false}],77:[function(require,module,exports){
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

},{"moment":false}],78:[function(require,module,exports){
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

},{}],79:[function(require,module,exports){
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

},{}],80:[function(require,module,exports){
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

},{"events":false,"knockout":false}],81:[function(require,module,exports){
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

},{"../utils/CacheControl":77,"../utils/ModelVersion":80,"events":false,"knockout":false,"localforage":false}],82:[function(require,module,exports){
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

Rest.prototype.onAuthorizationRequired = function onAuthorizationRequired(/*retry*/) {
    // To be implemented outside, if convenient executing:
    //retry();
    // by default don't wait for retry, just return nothing:
    return;
};

module.exports = Rest;

},{}],83:[function(require,module,exports){
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

},{}],84:[function(require,module,exports){
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
//var UserType = require('../models/User').UserType;

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

},{}],85:[function(require,module,exports){
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
},{}],86:[function(require,module,exports){
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
        update: function(element, valueAccessor) {
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

},{}],87:[function(require,module,exports){
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
        init: function(element, valueAccessor) {
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
        update: function(element, valueAccessor) {
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

},{}],88:[function(require,module,exports){
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

},{}],89:[function(require,module,exports){
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

},{}],90:[function(require,module,exports){
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

},{}],91:[function(require,module,exports){
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

},{}],92:[function(require,module,exports){
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

},{}],93:[function(require,module,exports){
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

},{"../escapeSelector":89}],94:[function(require,module,exports){
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

},{"./dependencies":96}],95:[function(require,module,exports){
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

},{"../escapeRegExp":88,"./sanitizeUrl":101}],96:[function(require,module,exports){
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
    accessControl: function allowAll(/*name*/) {
        // allow access by default
        return null;
    },
    EventEmitter: null
};

},{}],97:[function(require,module,exports){
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
        if (Object.keys(state).length > 0) {
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

},{"../getUrlQuery":90,"./sanitizeUrl":101}],98:[function(require,module,exports){
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

},{"./DomItemsManager":93,"./Shell":94,"./absolutizeUrl":95,"./dependencies":96,"./loader":99,"./parseUrl":100,"events":false}],99:[function(require,module,exports){
/**
    Loader utility to load Shell items on demand with AJAX
**/
'use strict';

var $ = require('jquery');

module.exports = {
    
    baseUrl: '/',
    
    load: function load(route) {
        return new Promise(function(resolve, reject) {
            console.log('Shell loading on demand', route.name, route);
            $.ajax({
                url: module.exports.baseUrl + route.name + '.html',
                cache: false
                // We are loading the program and no loader screen in place,
                // so any in between interaction will be problematic.
                //async: false
            }).then(resolve, reject);
        });
    }
};

},{}],100:[function(require,module,exports){
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
},{"../escapeRegExp":88,"../getUrlQuery":90}],101:[function(require,module,exports){
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
},{}],102:[function(require,module,exports){
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

},{"localforage":false}],103:[function(require,module,exports){
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
},{"../models/CalendarEvent":52,"../utils/apiHelper":85}],104:[function(require,module,exports){
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
        return Promise.resolve(jobTitleID);
    };
};

},{}],105:[function(require,module,exports){
/** Bookings
**/
'use strict';

var Booking = require('../models/Booking'),
//  apiHelper = require('../utils/apiHelper'),
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

},{"../models/Booking":50,"knockout":false,"moment":false}],106:[function(require,module,exports){
/** Events
**/
'use strict';

var CalendarEvent = require('../models/CalendarEvent'),
//  apiHelper = require('../utils/apiHelper'),
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

},{"../models/CalendarEvent":52,"knockout":false,"moment":false}],107:[function(require,module,exports){
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

},{"../models/CalendarSyncing":54,"../utils/RemoteModel":81,"knockout":false}],108:[function(require,module,exports){
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

},{"../models/Address":48,"../utils/RemoteModel":81}],109:[function(require,module,exports){
/** AppModel, centralizes all the data for the app,
    caching and sharing data across activities and performing
    requests
**/
var ko = require('knockout'),
    $ = require('jquery'),
    Model = require('../models/Model'),
    Rest = require('../utils/Rest'),
    localforage = require('localforage');

function AppModel() {

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
    return new Promise(function(resolve) { // Never rejects: , reject) {

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

},{"../models/Model":62,"../utils/Rest":82,"./AppModel-account":102,"./AppModel-events":103,"./AppModel-userJobProfile":104,"./AppModel.bookings":105,"./AppModel.calendarEvents":106,"./AppModel.calendarSyncing":107,"./AppModel.homeAddress":108,"./AppModel.marketplaceProfile":110,"./AppModel.privacySettings":111,"./AppModel.schedulingPreferences":112,"./AppModel.simplifiedWeeklySchedule":113,"./AppModel.userProfile":114,"knockout":false,"localforage":false}],110:[function(require,module,exports){
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

},{"../models/MarketplaceProfile":60,"../utils/RemoteModel":81}],111:[function(require,module,exports){
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

},{"../models/PrivacySettings":65,"../utils/RemoteModel":81}],112:[function(require,module,exports){
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

},{"../models/SchedulingPreferences":66,"../utils/RemoteModel":81}],113:[function(require,module,exports){
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

},{"../models/SimplifiedWeeklySchedule":68,"../utils/RemoteModel":81,"moment":false}],114:[function(require,module,exports){
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

},{"../models/User":70,"../utils/RemoteModel":81}],115:[function(require,module,exports){
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

},{"knockout":false}],116:[function(require,module,exports){
/** NavAction view model.
    It allows set-up per activity for the AppNav action button.
**/
var Model = require('../models/Model');

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

},{"../models/Model":62}],117:[function(require,module,exports){
/** NavBar view model.
    It allows customize the NavBar per activity.
**/
var Model = require('../models/Model');
    //NavAction = require('./NavAction');

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

},{"../models/Model":62}]},{},[41])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvbm9kZV9tb2R1bGVzL251bWVyYWwvbnVtZXJhbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYWNjb3VudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYXBwb2ludG1lbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2Jvb2tNZUJ1dHRvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYm9va2luZ0NvbmZpcm1hdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY2FsZW5kYXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2NhbGVuZGFyU3luY2luZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY2xpZW50RWRpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY2xpZW50cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY21zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9jb250YWN0Rm9ybS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvY29udGFjdEluZm8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2NvbnZlcnNhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvZGF0ZXRpbWVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2ZhcXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2ZlZWRiYWNrLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9mZWVkYmFja0Zvcm0uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2hvbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2luYm94LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9pbmRleC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvam9idGl0bGVzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9sZWFybk1vcmUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2xvY2F0aW9uRWRpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvbG9jYXRpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9sb2dpbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvbG9nb3V0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9vbmJvYXJkaW5nQ29tcGxldGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL29uYm9hcmRpbmdIb21lLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9vbmJvYXJkaW5nUG9zaXRpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9vd25lckluZm8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL3ByaXZhY3lTZXR0aW5ncy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvc2NoZWR1bGluZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvc2NoZWR1bGluZ1ByZWZlcmVuY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9zZXJ2aWNlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvc2lnbnVwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy90ZXh0RWRpdG9yLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy93ZWVrbHlTY2hlZHVsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FwcC1jb21wb25lbnRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYXBwLW5hdmJhci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FwcC5hY3Rpdml0aWVzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYXBwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYXBwLm1vZGFscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FwcC5zaGVsbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2NvbXBvbmVudHMvQWN0aXZpdHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9jb21wb25lbnRzL0RhdGVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9jb21wb25lbnRzL1NtYXJ0TmF2QmFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbG9jYWxlcy9lbi1VUy1MQy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9BZGRyZXNzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0FwcG9pbnRtZW50LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0Jvb2tpbmcuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQm9va2luZ1N1bW1hcnkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQ2FsZW5kYXJFdmVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9DYWxlbmRhclNsb3QuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQ2FsZW5kYXJTeW5jaW5nLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0NsaWVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9HZXRNb3JlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0xpc3RWaWV3SXRlbS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9Mb2NhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9NYWlsRm9sZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL01hcmtldHBsYWNlUHJvZmlsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9NZXNzYWdlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL01vZGVsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1BlcmZvcm1hbmNlU3VtbWFyeS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9Qb3NpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9Qcml2YWN5U2V0dGluZ3MuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvU2NoZWR1bGluZ1ByZWZlcmVuY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1NlcnZpY2UuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvU2ltcGxpZmllZFdlZWtseVNjaGVkdWxlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1VwY29taW5nQm9va2luZ3NTdW1tYXJ5LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1VzZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9jYWxlbmRhckFwcG9pbnRtZW50cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3Rlc3RkYXRhL2NsaWVudHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9sb2NhdGlvbnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9tZXNzYWdlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3Rlc3RkYXRhL3NlcnZpY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdGVzdGRhdGEvdGltZVNsb3RzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvQ2FjaGVDb250cm9sLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvRnVuY3Rpb24ucHJvdG90eXBlLl9kZWxheWVkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvRnVuY3Rpb24ucHJvdG90eXBlLl9pbmhlcml0cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL01vZGVsVmVyc2lvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL1JlbW90ZU1vZGVsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvUmVzdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL1RpbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9hY2Nlc3NDb250cm9sLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvYXBpSGVscGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvYm9vdGtub2NrQmluZGluZ0hlbHBlcnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9ib290c3RyYXBTd2l0Y2hCaW5kaW5nLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvZXNjYXBlUmVnRXhwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvZXNjYXBlU2VsZWN0b3IuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9nZXRVcmxRdWVyeS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL2pxdWVyeS5tdWx0aWxpbmUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9qc1Byb3BlcnRpZXNUb29scy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL0RvbUl0ZW1zTWFuYWdlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL1NoZWxsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvc2hlbGwvYWJzb2x1dGl6ZVVybC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL2RlcGVuZGVuY2llcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL2hhc2hiYW5nSGlzdG9yeS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL2luZGV4LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvc2hlbGwvbG9hZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvc2hlbGwvcGFyc2VVcmwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9zYW5pdGl6ZVVybC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwtYWNjb3VudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwtZXZlbnRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9BcHBNb2RlbC11c2VySm9iUHJvZmlsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwuYm9va2luZ3MuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLmNhbGVuZGFyRXZlbnRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9BcHBNb2RlbC5jYWxlbmRhclN5bmNpbmcuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLmhvbWVBZGRyZXNzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9BcHBNb2RlbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwubWFya2V0cGxhY2VQcm9maWxlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9BcHBNb2RlbC5wcml2YWN5U2V0dGluZ3MuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLnNjaGVkdWxpbmdQcmVmZXJlbmNlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvQXBwTW9kZWwuc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9BcHBNb2RlbC51c2VyUHJvZmlsZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3ZpZXdtb2RlbHMvRm9ybUNyZWRlbnRpYWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9OYXZBY3Rpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL05hdkJhci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2cUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4cEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIG51bWVyYWwuanNcbiAqIHZlcnNpb24gOiAxLjUuM1xuICogYXV0aG9yIDogQWRhbSBEcmFwZXJcbiAqIGxpY2Vuc2UgOiBNSVRcbiAqIGh0dHA6Ly9hZGFtd2RyYXBlci5naXRodWIuY29tL051bWVyYWwtanMvXG4gKi9cblxuKGZ1bmN0aW9uICgpIHtcblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgQ29uc3RhbnRzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgdmFyIG51bWVyYWwsXG4gICAgICAgIFZFUlNJT04gPSAnMS41LjMnLFxuICAgICAgICAvLyBpbnRlcm5hbCBzdG9yYWdlIGZvciBsYW5ndWFnZSBjb25maWcgZmlsZXNcbiAgICAgICAgbGFuZ3VhZ2VzID0ge30sXG4gICAgICAgIGN1cnJlbnRMYW5ndWFnZSA9ICdlbicsXG4gICAgICAgIHplcm9Gb3JtYXQgPSBudWxsLFxuICAgICAgICBkZWZhdWx0Rm9ybWF0ID0gJzAsMCcsXG4gICAgICAgIC8vIGNoZWNrIGZvciBub2RlSlNcbiAgICAgICAgaGFzTW9kdWxlID0gKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKTtcblxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBDb25zdHJ1Y3RvcnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIC8vIE51bWVyYWwgcHJvdG90eXBlIG9iamVjdFxuICAgIGZ1bmN0aW9uIE51bWVyYWwgKG51bWJlcikge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IG51bWJlcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbXBsZW1lbnRhdGlvbiBvZiB0b0ZpeGVkKCkgdGhhdCB0cmVhdHMgZmxvYXRzIG1vcmUgbGlrZSBkZWNpbWFsc1xuICAgICAqXG4gICAgICogRml4ZXMgYmluYXJ5IHJvdW5kaW5nIGlzc3VlcyAoZWcuICgwLjYxNSkudG9GaXhlZCgyKSA9PT0gJzAuNjEnKSB0aGF0IHByZXNlbnRcbiAgICAgKiBwcm9ibGVtcyBmb3IgYWNjb3VudGluZy0gYW5kIGZpbmFuY2UtcmVsYXRlZCBzb2Z0d2FyZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0b0ZpeGVkICh2YWx1ZSwgcHJlY2lzaW9uLCByb3VuZGluZ0Z1bmN0aW9uLCBvcHRpb25hbHMpIHtcbiAgICAgICAgdmFyIHBvd2VyID0gTWF0aC5wb3coMTAsIHByZWNpc2lvbiksXG4gICAgICAgICAgICBvcHRpb25hbHNSZWdFeHAsXG4gICAgICAgICAgICBvdXRwdXQ7XG4gICAgICAgICAgICBcbiAgICAgICAgLy9yb3VuZGluZ0Z1bmN0aW9uID0gKHJvdW5kaW5nRnVuY3Rpb24gIT09IHVuZGVmaW5lZCA/IHJvdW5kaW5nRnVuY3Rpb24gOiBNYXRoLnJvdW5kKTtcbiAgICAgICAgLy8gTXVsdGlwbHkgdXAgYnkgcHJlY2lzaW9uLCByb3VuZCBhY2N1cmF0ZWx5LCB0aGVuIGRpdmlkZSBhbmQgdXNlIG5hdGl2ZSB0b0ZpeGVkKCk6XG4gICAgICAgIG91dHB1dCA9IChyb3VuZGluZ0Z1bmN0aW9uKHZhbHVlICogcG93ZXIpIC8gcG93ZXIpLnRvRml4ZWQocHJlY2lzaW9uKTtcblxuICAgICAgICBpZiAob3B0aW9uYWxzKSB7XG4gICAgICAgICAgICBvcHRpb25hbHNSZWdFeHAgPSBuZXcgUmVnRXhwKCcwezEsJyArIG9wdGlvbmFscyArICd9JCcpO1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2Uob3B0aW9uYWxzUmVnRXhwLCAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRm9ybWF0dGluZ1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIC8vIGRldGVybWluZSB3aGF0IHR5cGUgb2YgZm9ybWF0dGluZyB3ZSBuZWVkIHRvIGRvXG4gICAgZnVuY3Rpb24gZm9ybWF0TnVtZXJhbCAobiwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgIHZhciBvdXRwdXQ7XG5cbiAgICAgICAgLy8gZmlndXJlIG91dCB3aGF0IGtpbmQgb2YgZm9ybWF0IHdlIGFyZSBkZWFsaW5nIHdpdGhcbiAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCckJykgPiAtMSkgeyAvLyBjdXJyZW5jeSEhISEhXG4gICAgICAgICAgICBvdXRwdXQgPSBmb3JtYXRDdXJyZW5jeShuLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdC5pbmRleE9mKCclJykgPiAtMSkgeyAvLyBwZXJjZW50YWdlXG4gICAgICAgICAgICBvdXRwdXQgPSBmb3JtYXRQZXJjZW50YWdlKG4sIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0LmluZGV4T2YoJzonKSA+IC0xKSB7IC8vIHRpbWVcbiAgICAgICAgICAgIG91dHB1dCA9IGZvcm1hdFRpbWUobiwgZm9ybWF0KTtcbiAgICAgICAgfSBlbHNlIHsgLy8gcGxhaW4gb2wnIG51bWJlcnMgb3IgYnl0ZXNcbiAgICAgICAgICAgIG91dHB1dCA9IGZvcm1hdE51bWJlcihuLl92YWx1ZSwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJldHVybiBzdHJpbmdcbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICAvLyByZXZlcnQgdG8gbnVtYmVyXG4gICAgZnVuY3Rpb24gdW5mb3JtYXROdW1lcmFsIChuLCBzdHJpbmcpIHtcbiAgICAgICAgdmFyIHN0cmluZ09yaWdpbmFsID0gc3RyaW5nLFxuICAgICAgICAgICAgdGhvdXNhbmRSZWdFeHAsXG4gICAgICAgICAgICBtaWxsaW9uUmVnRXhwLFxuICAgICAgICAgICAgYmlsbGlvblJlZ0V4cCxcbiAgICAgICAgICAgIHRyaWxsaW9uUmVnRXhwLFxuICAgICAgICAgICAgc3VmZml4ZXMgPSBbJ0tCJywgJ01CJywgJ0dCJywgJ1RCJywgJ1BCJywgJ0VCJywgJ1pCJywgJ1lCJ10sXG4gICAgICAgICAgICBieXRlc011bHRpcGxpZXIgPSBmYWxzZSxcbiAgICAgICAgICAgIHBvd2VyO1xuXG4gICAgICAgIGlmIChzdHJpbmcuaW5kZXhPZignOicpID4gLTEpIHtcbiAgICAgICAgICAgIG4uX3ZhbHVlID0gdW5mb3JtYXRUaW1lKHN0cmluZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoc3RyaW5nID09PSB6ZXJvRm9ybWF0KSB7XG4gICAgICAgICAgICAgICAgbi5fdmFsdWUgPSAwO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uZGVsaW1pdGVycy5kZWNpbWFsICE9PSAnLicpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnJlcGxhY2UoL1xcLi9nLCcnKS5yZXBsYWNlKGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmRlbGltaXRlcnMuZGVjaW1hbCwgJy4nKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBzZWUgaWYgYWJicmV2aWF0aW9ucyBhcmUgdGhlcmUgc28gdGhhdCB3ZSBjYW4gbXVsdGlwbHkgdG8gdGhlIGNvcnJlY3QgbnVtYmVyXG4gICAgICAgICAgICAgICAgdGhvdXNhbmRSZWdFeHAgPSBuZXcgUmVnRXhwKCdbXmEtekEtWl0nICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy50aG91c2FuZCArICcoPzpcXFxcKXwoXFxcXCcgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyAnKT8oPzpcXFxcKSk/KT8kJyk7XG4gICAgICAgICAgICAgICAgbWlsbGlvblJlZ0V4cCA9IG5ldyBSZWdFeHAoJ1teYS16QS1aXScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLm1pbGxpb24gKyAnKD86XFxcXCl8KFxcXFwnICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgJyk/KD86XFxcXCkpPyk/JCcpO1xuICAgICAgICAgICAgICAgIGJpbGxpb25SZWdFeHAgPSBuZXcgUmVnRXhwKCdbXmEtekEtWl0nICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy5iaWxsaW9uICsgJyg/OlxcXFwpfChcXFxcJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCArICcpPyg/OlxcXFwpKT8pPyQnKTtcbiAgICAgICAgICAgICAgICB0cmlsbGlvblJlZ0V4cCA9IG5ldyBSZWdFeHAoJ1teYS16QS1aXScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLnRyaWxsaW9uICsgJyg/OlxcXFwpfChcXFxcJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCArICcpPyg/OlxcXFwpKT8pPyQnKTtcblxuICAgICAgICAgICAgICAgIC8vIHNlZSBpZiBieXRlcyBhcmUgdGhlcmUgc28gdGhhdCB3ZSBjYW4gbXVsdGlwbHkgdG8gdGhlIGNvcnJlY3QgbnVtYmVyXG4gICAgICAgICAgICAgICAgZm9yIChwb3dlciA9IDA7IHBvd2VyIDw9IHN1ZmZpeGVzLmxlbmd0aDsgcG93ZXIrKykge1xuICAgICAgICAgICAgICAgICAgICBieXRlc011bHRpcGxpZXIgPSAoc3RyaW5nLmluZGV4T2Yoc3VmZml4ZXNbcG93ZXJdKSA+IC0xKSA/IE1hdGgucG93KDEwMjQsIHBvd2VyICsgMSkgOiBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYnl0ZXNNdWx0aXBsaWVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGRvIHNvbWUgbWF0aCB0byBjcmVhdGUgb3VyIG51bWJlclxuICAgICAgICAgICAgICAgIG4uX3ZhbHVlID0gKChieXRlc011bHRpcGxpZXIpID8gYnl0ZXNNdWx0aXBsaWVyIDogMSkgKiAoKHN0cmluZ09yaWdpbmFsLm1hdGNoKHRob3VzYW5kUmVnRXhwKSkgPyBNYXRoLnBvdygxMCwgMykgOiAxKSAqICgoc3RyaW5nT3JpZ2luYWwubWF0Y2gobWlsbGlvblJlZ0V4cCkpID8gTWF0aC5wb3coMTAsIDYpIDogMSkgKiAoKHN0cmluZ09yaWdpbmFsLm1hdGNoKGJpbGxpb25SZWdFeHApKSA/IE1hdGgucG93KDEwLCA5KSA6IDEpICogKChzdHJpbmdPcmlnaW5hbC5tYXRjaCh0cmlsbGlvblJlZ0V4cCkpID8gTWF0aC5wb3coMTAsIDEyKSA6IDEpICogKChzdHJpbmcuaW5kZXhPZignJScpID4gLTEpID8gMC4wMSA6IDEpICogKCgoc3RyaW5nLnNwbGl0KCctJykubGVuZ3RoICsgTWF0aC5taW4oc3RyaW5nLnNwbGl0KCcoJykubGVuZ3RoLTEsIHN0cmluZy5zcGxpdCgnKScpLmxlbmd0aC0xKSkgJSAyKT8gMTogLTEpICogTnVtYmVyKHN0cmluZy5yZXBsYWNlKC9bXjAtOVxcLl0rL2csICcnKSk7XG5cbiAgICAgICAgICAgICAgICAvLyByb3VuZCBpZiB3ZSBhcmUgdGFsa2luZyBhYm91dCBieXRlc1xuICAgICAgICAgICAgICAgIG4uX3ZhbHVlID0gKGJ5dGVzTXVsdGlwbGllcikgPyBNYXRoLmNlaWwobi5fdmFsdWUpIDogbi5fdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG4uX3ZhbHVlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZvcm1hdEN1cnJlbmN5IChuLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIHN5bWJvbEluZGV4ID0gZm9ybWF0LmluZGV4T2YoJyQnKSxcbiAgICAgICAgICAgIG9wZW5QYXJlbkluZGV4ID0gZm9ybWF0LmluZGV4T2YoJygnKSxcbiAgICAgICAgICAgIG1pbnVzU2lnbkluZGV4ID0gZm9ybWF0LmluZGV4T2YoJy0nKSxcbiAgICAgICAgICAgIHNwYWNlID0gJycsXG4gICAgICAgICAgICBzcGxpY2VJbmRleCxcbiAgICAgICAgICAgIG91dHB1dDtcblxuICAgICAgICAvLyBjaGVjayBmb3Igc3BhY2UgYmVmb3JlIG9yIGFmdGVyIGN1cnJlbmN5XG4gICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignICQnKSA+IC0xKSB7XG4gICAgICAgICAgICBzcGFjZSA9ICcgJztcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCcgJCcsICcnKTtcbiAgICAgICAgfSBlbHNlIGlmIChmb3JtYXQuaW5kZXhPZignJCAnKSA+IC0xKSB7XG4gICAgICAgICAgICBzcGFjZSA9ICcgJztcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCckICcsICcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCckJywgJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZm9ybWF0IHRoZSBudW1iZXJcbiAgICAgICAgb3V0cHV0ID0gZm9ybWF0TnVtYmVyKG4uX3ZhbHVlLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pO1xuXG4gICAgICAgIC8vIHBvc2l0aW9uIHRoZSBzeW1ib2xcbiAgICAgICAgaWYgKHN5bWJvbEluZGV4IDw9IDEpIHtcbiAgICAgICAgICAgIGlmIChvdXRwdXQuaW5kZXhPZignKCcpID4gLTEgfHwgb3V0cHV0LmluZGV4T2YoJy0nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnNwbGl0KCcnKTtcbiAgICAgICAgICAgICAgICBzcGxpY2VJbmRleCA9IDE7XG4gICAgICAgICAgICAgICAgaWYgKHN5bWJvbEluZGV4IDwgb3BlblBhcmVuSW5kZXggfHwgc3ltYm9sSW5kZXggPCBtaW51c1NpZ25JbmRleCl7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBzeW1ib2wgYXBwZWFycyBiZWZvcmUgdGhlIFwiKFwiIG9yIFwiLVwiXG4gICAgICAgICAgICAgICAgICAgIHNwbGljZUluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb3V0cHV0LnNwbGljZShzcGxpY2VJbmRleCwgMCwgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgc3BhY2UpO1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5qb2luKCcnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgc3BhY2UgKyBvdXRwdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAob3V0cHV0LmluZGV4T2YoJyknKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnNwbGl0KCcnKTtcbiAgICAgICAgICAgICAgICBvdXRwdXQuc3BsaWNlKC0xLCAwLCBzcGFjZSArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCk7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LmpvaW4oJycpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQgKyBzcGFjZSArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0UGVyY2VudGFnZSAobiwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgIHZhciBzcGFjZSA9ICcnLFxuICAgICAgICAgICAgb3V0cHV0LFxuICAgICAgICAgICAgdmFsdWUgPSBuLl92YWx1ZSAqIDEwMDtcblxuICAgICAgICAvLyBjaGVjayBmb3Igc3BhY2UgYmVmb3JlICVcbiAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcgJScpID4gLTEpIHtcbiAgICAgICAgICAgIHNwYWNlID0gJyAnO1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyAlJywgJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyUnLCAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICBvdXRwdXQgPSBmb3JtYXROdW1iZXIodmFsdWUsIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgIFxuICAgICAgICBpZiAob3V0cHV0LmluZGV4T2YoJyknKSA+IC0xICkge1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnNwbGl0KCcnKTtcbiAgICAgICAgICAgIG91dHB1dC5zcGxpY2UoLTEsIDAsIHNwYWNlICsgJyUnKTtcbiAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5qb2luKCcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dCArIHNwYWNlICsgJyUnO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXRUaW1lIChuKSB7XG4gICAgICAgIHZhciBob3VycyA9IE1hdGguZmxvb3Iobi5fdmFsdWUvNjAvNjApLFxuICAgICAgICAgICAgbWludXRlcyA9IE1hdGguZmxvb3IoKG4uX3ZhbHVlIC0gKGhvdXJzICogNjAgKiA2MCkpLzYwKSxcbiAgICAgICAgICAgIHNlY29uZHMgPSBNYXRoLnJvdW5kKG4uX3ZhbHVlIC0gKGhvdXJzICogNjAgKiA2MCkgLSAobWludXRlcyAqIDYwKSk7XG4gICAgICAgIHJldHVybiBob3VycyArICc6JyArICgobWludXRlcyA8IDEwKSA/ICcwJyArIG1pbnV0ZXMgOiBtaW51dGVzKSArICc6JyArICgoc2Vjb25kcyA8IDEwKSA/ICcwJyArIHNlY29uZHMgOiBzZWNvbmRzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bmZvcm1hdFRpbWUgKHN0cmluZykge1xuICAgICAgICB2YXIgdGltZUFycmF5ID0gc3RyaW5nLnNwbGl0KCc6JyksXG4gICAgICAgICAgICBzZWNvbmRzID0gMDtcbiAgICAgICAgLy8gdHVybiBob3VycyBhbmQgbWludXRlcyBpbnRvIHNlY29uZHMgYW5kIGFkZCB0aGVtIGFsbCB1cFxuICAgICAgICBpZiAodGltZUFycmF5Lmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgLy8gaG91cnNcbiAgICAgICAgICAgIHNlY29uZHMgPSBzZWNvbmRzICsgKE51bWJlcih0aW1lQXJyYXlbMF0pICogNjAgKiA2MCk7XG4gICAgICAgICAgICAvLyBtaW51dGVzXG4gICAgICAgICAgICBzZWNvbmRzID0gc2Vjb25kcyArIChOdW1iZXIodGltZUFycmF5WzFdKSAqIDYwKTtcbiAgICAgICAgICAgIC8vIHNlY29uZHNcbiAgICAgICAgICAgIHNlY29uZHMgPSBzZWNvbmRzICsgTnVtYmVyKHRpbWVBcnJheVsyXSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGltZUFycmF5Lmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgLy8gbWludXRlc1xuICAgICAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgKyAoTnVtYmVyKHRpbWVBcnJheVswXSkgKiA2MCk7XG4gICAgICAgICAgICAvLyBzZWNvbmRzXG4gICAgICAgICAgICBzZWNvbmRzID0gc2Vjb25kcyArIE51bWJlcih0aW1lQXJyYXlbMV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBOdW1iZXIoc2Vjb25kcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0TnVtYmVyICh2YWx1ZSwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgIHZhciBuZWdQID0gZmFsc2UsXG4gICAgICAgICAgICBzaWduZWQgPSBmYWxzZSxcbiAgICAgICAgICAgIG9wdERlYyA9IGZhbHNlLFxuICAgICAgICAgICAgYWJiciA9ICcnLFxuICAgICAgICAgICAgYWJicksgPSBmYWxzZSwgLy8gZm9yY2UgYWJicmV2aWF0aW9uIHRvIHRob3VzYW5kc1xuICAgICAgICAgICAgYWJick0gPSBmYWxzZSwgLy8gZm9yY2UgYWJicmV2aWF0aW9uIHRvIG1pbGxpb25zXG4gICAgICAgICAgICBhYmJyQiA9IGZhbHNlLCAvLyBmb3JjZSBhYmJyZXZpYXRpb24gdG8gYmlsbGlvbnNcbiAgICAgICAgICAgIGFiYnJUID0gZmFsc2UsIC8vIGZvcmNlIGFiYnJldmlhdGlvbiB0byB0cmlsbGlvbnNcbiAgICAgICAgICAgIGFiYnJGb3JjZSA9IGZhbHNlLCAvLyBmb3JjZSBhYmJyZXZpYXRpb25cbiAgICAgICAgICAgIGJ5dGVzID0gJycsXG4gICAgICAgICAgICBvcmQgPSAnJyxcbiAgICAgICAgICAgIGFicyA9IE1hdGguYWJzKHZhbHVlKSxcbiAgICAgICAgICAgIHN1ZmZpeGVzID0gWydCJywgJ0tCJywgJ01CJywgJ0dCJywgJ1RCJywgJ1BCJywgJ0VCJywgJ1pCJywgJ1lCJ10sXG4gICAgICAgICAgICBtaW4sXG4gICAgICAgICAgICBtYXgsXG4gICAgICAgICAgICBwb3dlcixcbiAgICAgICAgICAgIHcsXG4gICAgICAgICAgICBwcmVjaXNpb24sXG4gICAgICAgICAgICB0aG91c2FuZHMsXG4gICAgICAgICAgICBkID0gJycsXG4gICAgICAgICAgICBuZWcgPSBmYWxzZTtcblxuICAgICAgICAvLyBjaGVjayBpZiBudW1iZXIgaXMgemVybyBhbmQgYSBjdXN0b20gemVybyBmb3JtYXQgaGFzIGJlZW4gc2V0XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gMCAmJiB6ZXJvRm9ybWF0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gemVyb0Zvcm1hdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHNlZSBpZiB3ZSBzaG91bGQgdXNlIHBhcmVudGhlc2VzIGZvciBuZWdhdGl2ZSBudW1iZXIgb3IgaWYgd2Ugc2hvdWxkIHByZWZpeCB3aXRoIGEgc2lnblxuICAgICAgICAgICAgLy8gaWYgYm90aCBhcmUgcHJlc2VudCB3ZSBkZWZhdWx0IHRvIHBhcmVudGhlc2VzXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJygnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgbmVnUCA9IHRydWU7XG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnNsaWNlKDEsIC0xKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0LmluZGV4T2YoJysnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgc2lnbmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgvXFwrL2csICcnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2VlIGlmIGFiYnJldmlhdGlvbiBpcyB3YW50ZWRcbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignYScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiBhYmJyZXZpYXRpb24gaXMgc3BlY2lmaWVkXG4gICAgICAgICAgICAgICAgYWJicksgPSBmb3JtYXQuaW5kZXhPZignYUsnKSA+PSAwO1xuICAgICAgICAgICAgICAgIGFiYnJNID0gZm9ybWF0LmluZGV4T2YoJ2FNJykgPj0gMDtcbiAgICAgICAgICAgICAgICBhYmJyQiA9IGZvcm1hdC5pbmRleE9mKCdhQicpID49IDA7XG4gICAgICAgICAgICAgICAgYWJiclQgPSBmb3JtYXQuaW5kZXhPZignYVQnKSA+PSAwO1xuICAgICAgICAgICAgICAgIGFiYnJGb3JjZSA9IGFiYnJLIHx8IGFiYnJNIHx8IGFiYnJCIHx8IGFiYnJUO1xuXG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgZm9yIHNwYWNlIGJlZm9yZSBhYmJyZXZpYXRpb25cbiAgICAgICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyBhJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBhYmJyID0gJyAnO1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnIGEnLCAnJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJ2EnLCAnJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGFicyA+PSBNYXRoLnBvdygxMCwgMTIpICYmICFhYmJyRm9yY2UgfHwgYWJiclQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdHJpbGxpb25cbiAgICAgICAgICAgICAgICAgICAgYWJiciA9IGFiYnIgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLnRyaWxsaW9uO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gTWF0aC5wb3coMTAsIDEyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFicyA8IE1hdGgucG93KDEwLCAxMikgJiYgYWJzID49IE1hdGgucG93KDEwLCA5KSAmJiAhYWJickZvcmNlIHx8IGFiYnJCKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGJpbGxpb25cbiAgICAgICAgICAgICAgICAgICAgYWJiciA9IGFiYnIgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLmJpbGxpb247XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgOSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhYnMgPCBNYXRoLnBvdygxMCwgOSkgJiYgYWJzID49IE1hdGgucG93KDEwLCA2KSAmJiAhYWJickZvcmNlIHx8IGFiYnJNKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1pbGxpb25cbiAgICAgICAgICAgICAgICAgICAgYWJiciA9IGFiYnIgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLm1pbGxpb247XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgNik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhYnMgPCBNYXRoLnBvdygxMCwgNikgJiYgYWJzID49IE1hdGgucG93KDEwLCAzKSAmJiAhYWJickZvcmNlIHx8IGFiYnJLKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRob3VzYW5kXG4gICAgICAgICAgICAgICAgICAgIGFiYnIgPSBhYmJyICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy50aG91c2FuZDtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KDEwLCAzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNlZSBpZiB3ZSBhcmUgZm9ybWF0dGluZyBieXRlc1xuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCdiJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGZvciBzcGFjZSBiZWZvcmVcbiAgICAgICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyBiJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBieXRlcyA9ICcgJztcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyBiJywgJycpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCdiJywgJycpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAocG93ZXIgPSAwOyBwb3dlciA8PSBzdWZmaXhlcy5sZW5ndGg7IHBvd2VyKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbWluID0gTWF0aC5wb3coMTAyNCwgcG93ZXIpO1xuICAgICAgICAgICAgICAgICAgICBtYXggPSBNYXRoLnBvdygxMDI0LCBwb3dlcisxKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPj0gbWluICYmIHZhbHVlIDwgbWF4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBieXRlcyA9IGJ5dGVzICsgc3VmZml4ZXNbcG93ZXJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1pbiA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gbWluO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNlZSBpZiBvcmRpbmFsIGlzIHdhbnRlZFxuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCdvJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGZvciBzcGFjZSBiZWZvcmVcbiAgICAgICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyBvJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBvcmQgPSAnICc7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCcgbycsICcnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnbycsICcnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBvcmQgPSBvcmQgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5vcmRpbmFsKHZhbHVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCdbLl0nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgb3B0RGVjID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnWy5dJywgJy4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdyA9IHZhbHVlLnRvU3RyaW5nKCkuc3BsaXQoJy4nKVswXTtcbiAgICAgICAgICAgIHByZWNpc2lvbiA9IGZvcm1hdC5zcGxpdCgnLicpWzFdO1xuICAgICAgICAgICAgdGhvdXNhbmRzID0gZm9ybWF0LmluZGV4T2YoJywnKTtcblxuICAgICAgICAgICAgaWYgKHByZWNpc2lvbikge1xuICAgICAgICAgICAgICAgIGlmIChwcmVjaXNpb24uaW5kZXhPZignWycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJlY2lzaW9uID0gcHJlY2lzaW9uLnJlcGxhY2UoJ10nLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIHByZWNpc2lvbiA9IHByZWNpc2lvbi5zcGxpdCgnWycpO1xuICAgICAgICAgICAgICAgICAgICBkID0gdG9GaXhlZCh2YWx1ZSwgKHByZWNpc2lvblswXS5sZW5ndGggKyBwcmVjaXNpb25bMV0ubGVuZ3RoKSwgcm91bmRpbmdGdW5jdGlvbiwgcHJlY2lzaW9uWzFdLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZCA9IHRvRml4ZWQodmFsdWUsIHByZWNpc2lvbi5sZW5ndGgsIHJvdW5kaW5nRnVuY3Rpb24pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHcgPSBkLnNwbGl0KCcuJylbMF07XG5cbiAgICAgICAgICAgICAgICBpZiAoZC5zcGxpdCgnLicpWzFdLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBkID0gbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uZGVsaW1pdGVycy5kZWNpbWFsICsgZC5zcGxpdCgnLicpWzFdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGQgPSAnJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0RGVjICYmIE51bWJlcihkLnNsaWNlKDEpKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBkID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB3ID0gdG9GaXhlZCh2YWx1ZSwgbnVsbCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGZvcm1hdCBudW1iZXJcbiAgICAgICAgICAgIGlmICh3LmluZGV4T2YoJy0nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgdyA9IHcuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgbmVnID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRob3VzYW5kcyA+IC0xKSB7XG4gICAgICAgICAgICAgICAgdyA9IHcudG9TdHJpbmcoKS5yZXBsYWNlKC8oXFxkKSg/PShcXGR7M30pKyg/IVxcZCkpL2csICckMScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5kZWxpbWl0ZXJzLnRob3VzYW5kcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignLicpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgdyA9ICcnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gKChuZWdQICYmIG5lZykgPyAnKCcgOiAnJykgKyAoKCFuZWdQICYmIG5lZykgPyAnLScgOiAnJykgKyAoKCFuZWcgJiYgc2lnbmVkKSA/ICcrJyA6ICcnKSArIHcgKyBkICsgKChvcmQpID8gb3JkIDogJycpICsgKChhYmJyKSA/IGFiYnIgOiAnJykgKyAoKGJ5dGVzKSA/IGJ5dGVzIDogJycpICsgKChuZWdQICYmIG5lZykgPyAnKScgOiAnJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIFRvcCBMZXZlbCBGdW5jdGlvbnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICBudW1lcmFsID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgIGlmIChudW1lcmFsLmlzTnVtZXJhbChpbnB1dCkpIHtcbiAgICAgICAgICAgIGlucHV0ID0gaW5wdXQudmFsdWUoKTtcbiAgICAgICAgfSBlbHNlIGlmIChpbnB1dCA9PT0gMCB8fCB0eXBlb2YgaW5wdXQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpbnB1dCA9IDA7XG4gICAgICAgIH0gZWxzZSBpZiAoIU51bWJlcihpbnB1dCkpIHtcbiAgICAgICAgICAgIGlucHV0ID0gbnVtZXJhbC5mbi51bmZvcm1hdChpbnB1dCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IE51bWVyYWwoTnVtYmVyKGlucHV0KSk7XG4gICAgfTtcblxuICAgIC8vIHZlcnNpb24gbnVtYmVyXG4gICAgbnVtZXJhbC52ZXJzaW9uID0gVkVSU0lPTjtcblxuICAgIC8vIGNvbXBhcmUgbnVtZXJhbCBvYmplY3RcbiAgICBudW1lcmFsLmlzTnVtZXJhbCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIE51bWVyYWw7XG4gICAgfTtcblxuICAgIC8vIFRoaXMgZnVuY3Rpb24gd2lsbCBsb2FkIGxhbmd1YWdlcyBhbmQgdGhlbiBzZXQgdGhlIGdsb2JhbCBsYW5ndWFnZS4gIElmXG4gICAgLy8gbm8gYXJndW1lbnRzIGFyZSBwYXNzZWQgaW4sIGl0IHdpbGwgc2ltcGx5IHJldHVybiB0aGUgY3VycmVudCBnbG9iYWxcbiAgICAvLyBsYW5ndWFnZSBrZXkuXG4gICAgbnVtZXJhbC5sYW5ndWFnZSA9IGZ1bmN0aW9uIChrZXksIHZhbHVlcykge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRMYW5ndWFnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChrZXkgJiYgIXZhbHVlcykge1xuICAgICAgICAgICAgaWYoIWxhbmd1YWdlc1trZXldKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGxhbmd1YWdlIDogJyArIGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJyZW50TGFuZ3VhZ2UgPSBrZXk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWVzIHx8ICFsYW5ndWFnZXNba2V5XSkge1xuICAgICAgICAgICAgbG9hZExhbmd1YWdlKGtleSwgdmFsdWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudW1lcmFsO1xuICAgIH07XG4gICAgXG4gICAgLy8gVGhpcyBmdW5jdGlvbiBwcm92aWRlcyBhY2Nlc3MgdG8gdGhlIGxvYWRlZCBsYW5ndWFnZSBkYXRhLiAgSWZcbiAgICAvLyBubyBhcmd1bWVudHMgYXJlIHBhc3NlZCBpbiwgaXQgd2lsbCBzaW1wbHkgcmV0dXJuIHRoZSBjdXJyZW50XG4gICAgLy8gZ2xvYmFsIGxhbmd1YWdlIG9iamVjdC5cbiAgICBudW1lcmFsLmxhbmd1YWdlRGF0YSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFsYW5ndWFnZXNba2V5XSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGxhbmd1YWdlIDogJyArIGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBsYW5ndWFnZXNba2V5XTtcbiAgICB9O1xuXG4gICAgbnVtZXJhbC5sYW5ndWFnZSgnZW4nLCB7XG4gICAgICAgIGRlbGltaXRlcnM6IHtcbiAgICAgICAgICAgIHRob3VzYW5kczogJywnLFxuICAgICAgICAgICAgZGVjaW1hbDogJy4nXG4gICAgICAgIH0sXG4gICAgICAgIGFiYnJldmlhdGlvbnM6IHtcbiAgICAgICAgICAgIHRob3VzYW5kOiAnaycsXG4gICAgICAgICAgICBtaWxsaW9uOiAnbScsXG4gICAgICAgICAgICBiaWxsaW9uOiAnYicsXG4gICAgICAgICAgICB0cmlsbGlvbjogJ3QnXG4gICAgICAgIH0sXG4gICAgICAgIG9yZGluYWw6IGZ1bmN0aW9uIChudW1iZXIpIHtcbiAgICAgICAgICAgIHZhciBiID0gbnVtYmVyICUgMTA7XG4gICAgICAgICAgICByZXR1cm4gKH5+IChudW1iZXIgJSAxMDAgLyAxMCkgPT09IDEpID8gJ3RoJyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDEpID8gJ3N0JyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDIpID8gJ25kJyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDMpID8gJ3JkJyA6ICd0aCc7XG4gICAgICAgIH0sXG4gICAgICAgIGN1cnJlbmN5OiB7XG4gICAgICAgICAgICBzeW1ib2w6ICckJ1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBudW1lcmFsLnplcm9Gb3JtYXQgPSBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgIHplcm9Gb3JtYXQgPSB0eXBlb2YoZm9ybWF0KSA9PT0gJ3N0cmluZycgPyBmb3JtYXQgOiBudWxsO1xuICAgIH07XG5cbiAgICBudW1lcmFsLmRlZmF1bHRGb3JtYXQgPSBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgIGRlZmF1bHRGb3JtYXQgPSB0eXBlb2YoZm9ybWF0KSA9PT0gJ3N0cmluZycgPyBmb3JtYXQgOiAnMC4wJztcbiAgICB9O1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBIZWxwZXJzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgZnVuY3Rpb24gbG9hZExhbmd1YWdlKGtleSwgdmFsdWVzKSB7XG4gICAgICAgIGxhbmd1YWdlc1trZXldID0gdmFsdWVzO1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRmxvYXRpbmctcG9pbnQgaGVscGVyc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIC8vIFRoZSBmbG9hdGluZy1wb2ludCBoZWxwZXIgZnVuY3Rpb25zIGFuZCBpbXBsZW1lbnRhdGlvblxuICAgIC8vIGJvcnJvd3MgaGVhdmlseSBmcm9tIHNpbmZ1bC5qczogaHR0cDovL2d1aXBuLmdpdGh1Yi5pby9zaW5mdWwuanMvXG5cbiAgICAvKipcbiAgICAgKiBBcnJheS5wcm90b3R5cGUucmVkdWNlIGZvciBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgaXRcbiAgICAgKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9SZWR1Y2UjQ29tcGF0aWJpbGl0eVxuICAgICAqL1xuICAgIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgQXJyYXkucHJvdG90eXBlLnJlZHVjZSkge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUucmVkdWNlID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBvcHRfaW5pdGlhbFZhbHVlKSB7XG4gICAgICAgICAgICAndXNlIHN0cmljdCc7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChudWxsID09PSB0aGlzIHx8ICd1bmRlZmluZWQnID09PSB0eXBlb2YgdGhpcykge1xuICAgICAgICAgICAgICAgIC8vIEF0IHRoZSBtb21lbnQgYWxsIG1vZGVybiBicm93c2VycywgdGhhdCBzdXBwb3J0IHN0cmljdCBtb2RlLCBoYXZlXG4gICAgICAgICAgICAgICAgLy8gbmF0aXZlIGltcGxlbWVudGF0aW9uIG9mIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UuIEZvciBpbnN0YW5jZSwgSUU4XG4gICAgICAgICAgICAgICAgLy8gZG9lcyBub3Qgc3VwcG9ydCBzdHJpY3QgbW9kZSwgc28gdGhpcyBjaGVjayBpcyBhY3R1YWxseSB1c2VsZXNzLlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FycmF5LnByb3RvdHlwZS5yZWR1Y2UgY2FsbGVkIG9uIG51bGwgb3IgdW5kZWZpbmVkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGNhbGxiYWNrICsgJyBpcyBub3QgYSBmdW5jdGlvbicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgaW5kZXgsXG4gICAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gdGhpcy5sZW5ndGggPj4+IDAsXG4gICAgICAgICAgICAgICAgaXNWYWx1ZVNldCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAoMSA8IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IG9wdF9pbml0aWFsVmFsdWU7XG4gICAgICAgICAgICAgICAgaXNWYWx1ZVNldCA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoaW5kZXggPSAwOyBsZW5ndGggPiBpbmRleDsgKytpbmRleCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc093blByb3BlcnR5KGluZGV4KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNWYWx1ZVNldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBjYWxsYmFjayh2YWx1ZSwgdGhpc1tpbmRleF0sIGluZGV4LCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdGhpc1tpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpc1ZhbHVlU2V0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFpc1ZhbHVlU2V0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUmVkdWNlIG9mIGVtcHR5IGFycmF5IHdpdGggbm8gaW5pdGlhbCB2YWx1ZScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgXG4gICAgLyoqXG4gICAgICogQ29tcHV0ZXMgdGhlIG11bHRpcGxpZXIgbmVjZXNzYXJ5IHRvIG1ha2UgeCA+PSAxLFxuICAgICAqIGVmZmVjdGl2ZWx5IGVsaW1pbmF0aW5nIG1pc2NhbGN1bGF0aW9ucyBjYXVzZWQgYnlcbiAgICAgKiBmaW5pdGUgcHJlY2lzaW9uLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG11bHRpcGxpZXIoeCkge1xuICAgICAgICB2YXIgcGFydHMgPSB4LnRvU3RyaW5nKCkuc3BsaXQoJy4nKTtcbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNYXRoLnBvdygxMCwgcGFydHNbMV0ubGVuZ3RoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHaXZlbiBhIHZhcmlhYmxlIG51bWJlciBvZiBhcmd1bWVudHMsIHJldHVybnMgdGhlIG1heGltdW1cbiAgICAgKiBtdWx0aXBsaWVyIHRoYXQgbXVzdCBiZSB1c2VkIHRvIG5vcm1hbGl6ZSBhbiBvcGVyYXRpb24gaW52b2x2aW5nXG4gICAgICogYWxsIG9mIHRoZW0uXG4gICAgICovXG4gICAgZnVuY3Rpb24gY29ycmVjdGlvbkZhY3RvcigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gYXJncy5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIG5leHQpIHtcbiAgICAgICAgICAgIHZhciBtcCA9IG11bHRpcGxpZXIocHJldiksXG4gICAgICAgICAgICAgICAgbW4gPSBtdWx0aXBsaWVyKG5leHQpO1xuICAgICAgICByZXR1cm4gbXAgPiBtbiA/IG1wIDogbW47XG4gICAgICAgIH0sIC1JbmZpbml0eSk7XG4gICAgfSAgICAgICAgXG5cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgTnVtZXJhbCBQcm90b3R5cGVcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIG51bWVyYWwuZm4gPSBOdW1lcmFsLnByb3RvdHlwZSA9IHtcblxuICAgICAgICBjbG9uZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBudW1lcmFsKHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZvcm1hdCA6IGZ1bmN0aW9uIChpbnB1dFN0cmluZywgcm91bmRpbmdGdW5jdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdE51bWVyYWwodGhpcywgXG4gICAgICAgICAgICAgICAgICBpbnB1dFN0cmluZyA/IGlucHV0U3RyaW5nIDogZGVmYXVsdEZvcm1hdCwgXG4gICAgICAgICAgICAgICAgICAocm91bmRpbmdGdW5jdGlvbiAhPT0gdW5kZWZpbmVkKSA/IHJvdW5kaW5nRnVuY3Rpb24gOiBNYXRoLnJvdW5kXG4gICAgICAgICAgICAgICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdW5mb3JtYXQgOiBmdW5jdGlvbiAoaW5wdXRTdHJpbmcpIHtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXRTdHJpbmcpID09PSAnW29iamVjdCBOdW1iZXJdJykgeyBcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5wdXRTdHJpbmc7IFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHVuZm9ybWF0TnVtZXJhbCh0aGlzLCBpbnB1dFN0cmluZyA/IGlucHV0U3RyaW5nIDogZGVmYXVsdEZvcm1hdCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdmFsdWUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdmFsdWVPZiA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXQgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gTnVtYmVyKHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZCA6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIGNvcnJGYWN0b3IgPSBjb3JyZWN0aW9uRmFjdG9yLmNhbGwobnVsbCwgdGhpcy5fdmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNiYWNrKGFjY3VtLCBjdXJyLCBjdXJySSwgTykge1xuICAgICAgICAgICAgICAgIHJldHVybiBhY2N1bSArIGNvcnJGYWN0b3IgKiBjdXJyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSBbdGhpcy5fdmFsdWUsIHZhbHVlXS5yZWR1Y2UoY2JhY2ssIDApIC8gY29yckZhY3RvcjtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN1YnRyYWN0IDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgY29yckZhY3RvciA9IGNvcnJlY3Rpb25GYWN0b3IuY2FsbChudWxsLCB0aGlzLl92YWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgZnVuY3Rpb24gY2JhY2soYWNjdW0sIGN1cnIsIGN1cnJJLCBPKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjY3VtIC0gY29yckZhY3RvciAqIGN1cnI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IFt2YWx1ZV0ucmVkdWNlKGNiYWNrLCB0aGlzLl92YWx1ZSAqIGNvcnJGYWN0b3IpIC8gY29yckZhY3RvcjsgICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIG11bHRpcGx5IDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBjYmFjayhhY2N1bSwgY3VyciwgY3VyckksIE8pIHtcbiAgICAgICAgICAgICAgICB2YXIgY29yckZhY3RvciA9IGNvcnJlY3Rpb25GYWN0b3IoYWNjdW0sIGN1cnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiAoYWNjdW0gKiBjb3JyRmFjdG9yKSAqIChjdXJyICogY29yckZhY3RvcikgL1xuICAgICAgICAgICAgICAgICAgICAoY29yckZhY3RvciAqIGNvcnJGYWN0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSBbdGhpcy5fdmFsdWUsIHZhbHVlXS5yZWR1Y2UoY2JhY2ssIDEpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGl2aWRlIDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBjYmFjayhhY2N1bSwgY3VyciwgY3VyckksIE8pIHtcbiAgICAgICAgICAgICAgICB2YXIgY29yckZhY3RvciA9IGNvcnJlY3Rpb25GYWN0b3IoYWNjdW0sIGN1cnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiAoYWNjdW0gKiBjb3JyRmFjdG9yKSAvIChjdXJyICogY29yckZhY3Rvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IFt0aGlzLl92YWx1ZSwgdmFsdWVdLnJlZHVjZShjYmFjayk7ICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBkaWZmZXJlbmNlIDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5hYnMobnVtZXJhbCh0aGlzLl92YWx1ZSkuc3VidHJhY3QodmFsdWUpLnZhbHVlKCkpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBFeHBvc2luZyBOdW1lcmFsXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgLy8gQ29tbW9uSlMgbW9kdWxlIGlzIGRlZmluZWRcbiAgICBpZiAoaGFzTW9kdWxlKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gbnVtZXJhbDtcbiAgICB9XG5cbiAgICAvKmdsb2JhbCBlbmRlcjpmYWxzZSAqL1xuICAgIGlmICh0eXBlb2YgZW5kZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8vIGhlcmUsIGB0aGlzYCBtZWFucyBgd2luZG93YCBpbiB0aGUgYnJvd3Nlciwgb3IgYGdsb2JhbGAgb24gdGhlIHNlcnZlclxuICAgICAgICAvLyBhZGQgYG51bWVyYWxgIGFzIGEgZ2xvYmFsIG9iamVjdCB2aWEgYSBzdHJpbmcgaWRlbnRpZmllcixcbiAgICAgICAgLy8gZm9yIENsb3N1cmUgQ29tcGlsZXIgJ2FkdmFuY2VkJyBtb2RlXG4gICAgICAgIHRoaXNbJ251bWVyYWwnXSA9IG51bWVyYWw7XG4gICAgfVxuXG4gICAgLypnbG9iYWwgZGVmaW5lOmZhbHNlICovXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBudW1lcmFsO1xuICAgICAgICB9KTtcbiAgICB9XG59KS5jYWxsKHRoaXMpO1xuIiwiLyoqXG4gICAgQWNjb3VudCBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEFjY291bnRBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKCdBY2NvdW50Jyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuIiwiLyoqIENhbGVuZGFyIGFjdGl2aXR5ICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbnJlcXVpcmUoJy4uL2NvbXBvbmVudHMvRGF0ZVBpY2tlcicpO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEFwcG9pbnRtZW50QWN0aXZpdHkoKSB7XHJcbiAgICBcclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkZyZWVsYW5jZXI7ICAgIFxyXG4gICAgdGhpcy5tZW51SXRlbSA9ICdjYWxlbmRhcic7XHJcbiAgICBcclxuICAgIC8vIENyZWF0ZSBhIHNwZWNpZmljIGJhY2tBY3Rpb24gdGhhdCBzaG93cyBjdXJyZW50IGRhdGVcclxuICAgIC8vIGFuZCByZXR1cm4gdG8gY2FsZW5kYXIgaW4gY3VycmVudCBkYXRlLlxyXG4gICAgLy8gTGF0ZXIgc29tZSBtb3JlIGNoYW5nZXMgYXJlIGFwcGxpZWQsIHdpdGggdmlld21vZGVsIHJlYWR5XHJcbiAgICB2YXIgYmFja0FjdGlvbiA9IG5ldyBBY3Rpdml0eS5OYXZBY3Rpb24oe1xyXG4gICAgICAgIGxpbms6ICdjYWxlbmRhci8nLCAvLyBQcmVzZXJ2ZSBsYXN0IHNsYXNoLCBmb3IgbGF0ZXIgdXNlXHJcbiAgICAgICAgaWNvbjogQWN0aXZpdHkuTmF2QWN0aW9uLmdvQmFjay5pY29uKCksXHJcbiAgICAgICAgaXNUaXRsZTogdHJ1ZSxcclxuICAgICAgICB0ZXh0OiAnQ2FsZW5kYXInXHJcbiAgICB9KTtcclxuICAgIHRoaXMubmF2QmFyID0gbmV3IEFjdGl2aXR5Lk5hdkJhcih7XHJcbiAgICAgICAgdGl0bGU6ICcnLFxyXG4gICAgICAgIGxlZnRBY3Rpb246IGJhY2tBY3Rpb24sXHJcbiAgICAgICAgcmlnaHRBY3Rpb246IEFjdGl2aXR5Lk5hdkFjdGlvbi5nb0hlbHBJbmRleFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMuJGFwcG9pbnRtZW50VmlldyA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNjYWxlbmRhckFwcG9pbnRtZW50VmlldycpO1xyXG4gICAgdGhpcy4kY2hvb3NlTmV3ID0gJCgnI2NhbGVuZGFyQ2hvb3NlTmV3Jyk7XHJcbiAgICBcclxuICAgIHRoaXMuaW5pdEFwcG9pbnRtZW50KCk7XHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IHRoaXMuYXBwb2ludG1lbnRzRGF0YVZpZXc7XHJcbiAgICBcclxuICAgIC8vIFRoaXMgdGl0bGUgdGV4dCBpcyBkeW5hbWljLCB3ZSBuZWVkIHRvIHJlcGxhY2UgaXQgYnkgYSBjb21wdXRlZCBvYnNlcnZhYmxlXHJcbiAgICAvLyBzaG93aW5nIHRoZSBjdXJyZW50IGRhdGVcclxuICAgIHZhciBkZWZCYWNrVGV4dCA9IGJhY2tBY3Rpb24udGV4dC5faW5pdGlhbFZhbHVlO1xyXG4gICAgYmFja0FjdGlvbi50ZXh0ID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHZhciBkID0gdGhpcy5hcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50RGF0ZSgpO1xyXG4gICAgICAgIGlmICghZClcclxuICAgICAgICAgICAgLy8gRmFsbGJhY2sgdG8gdGhlIGRlZmF1bHQgdGl0bGVcclxuICAgICAgICAgICAgcmV0dXJuIGRlZkJhY2tUZXh0O1xyXG5cclxuICAgICAgICB2YXIgbSA9IG1vbWVudChkKTtcclxuICAgICAgICB2YXIgdCA9IG0uZm9ybWF0KCdkZGRkIFsoXU0vRFspXScpO1xyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICAvLyBBbmQgdGhlIGxpbmsgaXMgZHluYW1pYyB0b28sIHRvIGFsbG93IHJldHVybiB0byB0aGUgZGF0ZVxyXG4gICAgLy8gdGhhdCBtYXRjaGVzIGN1cnJlbnQgYXBwb2ludG1lbnRcclxuICAgIHZhciBkZWZMaW5rID0gYmFja0FjdGlvbi5saW5rLl9pbml0aWFsVmFsdWU7XHJcbiAgICBiYWNrQWN0aW9uLmxpbmsgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIGQgPSB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3LmN1cnJlbnREYXRlKCk7XHJcbiAgICAgICAgaWYgKCFkKVxyXG4gICAgICAgICAgICAvLyBGYWxsYmFjayB0byB0aGUgZGVmYXVsdCBsaW5rXHJcbiAgICAgICAgICAgIHJldHVybiBkZWZMaW5rO1xyXG5cclxuICAgICAgICByZXR1cm4gZGVmTGluayArIGQudG9JU09TdHJpbmcoKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3LmN1cnJlbnRBcHBvaW50bWVudC5zdWJzY3JpYmUoZnVuY3Rpb24gKGFwdCkge1xyXG4gICAgICAgIC8vIFVwZGF0ZSBVUkwgdG8gbWF0Y2ggdGhlIGFwcG9pbnRtZW50IElEIGFuZFxyXG4gICAgICAgIC8vIHRyYWNrIGl0IHN0YXRlXHJcbiAgICAgICAgLy8gR2V0IElEIGZyb20gVVJMLCB0byBhdm9pZCBkbyBhbnl0aGluZyBpZiB0aGUgc2FtZS5cclxuICAgICAgICB2YXIgYXB0SWQgPSBhcHQuaWQoKTtcclxuICAgICAgICB2YXIgdXJsSWQgPSAvYXBwb2ludG1lbnRcXC8oXFxkKykvaS50ZXN0KHdpbmRvdy5sb2NhdGlvbik7XHJcbiAgICAgICAgdXJsSWQgPSB1cmxJZCAmJiB1cmxJZFsxXSB8fCAnJztcclxuICAgICAgICBpZiAodXJsSWQgIT09ICcwJyAmJiBhcHRJZCAhPT0gbnVsbCAmJiB1cmxJZCAhPT0gYXB0SWQudG9TdHJpbmcoKSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVE9ETyBzYXZlIGEgdXNlZnVsIHN0YXRlXHJcbiAgICAgICAgICAgIC8vIE5vdCBmb3Igbm93LCBpcyBmYWlsaW5nLCBidXQgc29tZXRoaW5nIGJhc2VkIG9uOlxyXG4gICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICB2YXIgdmlld3N0YXRlID0ge1xyXG4gICAgICAgICAgICAgICAgYXBwb2ludG1lbnQ6IGFwdC5tb2RlbC50b1BsYWluT2JqZWN0KHRydWUpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBJZiB3YXMgYSByb290IFVSTCwgbm8gSUQsIGp1c3QgcmVwbGFjZSBjdXJyZW50IHN0YXRlXHJcbiAgICAgICAgICAgIGlmICh1cmxJZCA9PT0gJycpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5zaGVsbC5oaXN0b3J5LnJlcGxhY2VTdGF0ZShudWxsLCBudWxsLCAnYXBwb2ludG1lbnQvJyArIGFwdElkKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuaGlzdG9yeS5wdXNoU3RhdGUobnVsbCwgbnVsbCwgJ2FwcG9pbnRtZW50LycgKyBhcHRJZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFRyaWdnZXIgYSBsYXlvdXQgdXBkYXRlLCByZXF1aXJlZCBieSB0aGUgZnVsbC1oZWlnaHQgZmVhdHVyZVxyXG4gICAgICAgICQod2luZG93KS50cmlnZ2VyKCdsYXlvdXRVcGRhdGUnKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG4gICAgLyoganNoaW50IG1heGNvbXBsZXhpdHk6MTAgKi9cclxuXHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgXHJcbiAgICB2YXIgYXB0O1xyXG4gICAgaWYgKHRoaXMucmVxdWVzdERhdGEuYXBwb2ludG1lbnQpIHtcclxuICAgICAgICBhcHQgPSB0aGlzLnJlcXVlc3REYXRhLmFwcG9pbnRtZW50O1xyXG4gICAgfSBlbHNlIHtcclxuICAgIC8vIEdldCBJRFxyXG4gICAgICAgIHZhciBhcHRJZCA9IG9wdGlvbnMgJiYgb3B0aW9ucy5yb3V0ZSAmJiBvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdO1xyXG4gICAgICAgIGFwdElkID0gcGFyc2VJbnQoYXB0SWQsIDEwKTtcclxuICAgICAgICBhcHQgPSBhcHRJZCB8fCAwO1xyXG4gICAgfVxyXG4gICAgdGhpcy5zaG93QXBwb2ludG1lbnQoYXB0KTtcclxuICAgIFxyXG4gICAgLy8gSWYgdGhlcmUgYXJlIG9wdGlvbnMgKHRoZXJlICBub3Qgb24gc3RhcnR1cCBvclxyXG4gICAgLy8gb24gY2FuY2VsbGVkIGVkaXRpb24pLlxyXG4gICAgLy8gQW5kIGl0IGNvbWVzIGJhY2sgZnJvbSB0aGUgdGV4dEVkaXRvci5cclxuICAgIGlmIChvcHRpb25zICE9PSBudWxsKSB7XHJcblxyXG4gICAgICAgIHZhciBib29raW5nID0gdGhpcy5hcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50QXBwb2ludG1lbnQoKTtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMucmVxdWVzdCA9PT0gJ3RleHRFZGl0b3InICYmIGJvb2tpbmcpIHtcclxuXHJcbiAgICAgICAgICAgIGJvb2tpbmdbb3B0aW9ucy5maWVsZF0ob3B0aW9ucy50ZXh0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5zZWxlY3RDbGllbnQgPT09IHRydWUgJiYgYm9va2luZykge1xyXG5cclxuICAgICAgICAgICAgYm9va2luZy5jbGllbnQob3B0aW9ucy5zZWxlY3RlZENsaWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZihvcHRpb25zLnNlbGVjdGVkRGF0ZXRpbWUpICE9PSAndW5kZWZpbmVkJyAmJiBib29raW5nKSB7XHJcblxyXG4gICAgICAgICAgICBib29raW5nLnN0YXJ0VGltZShvcHRpb25zLnNlbGVjdGVkRGF0ZXRpbWUpO1xyXG4gICAgICAgICAgICAvLyBUT0RPIENhbGN1bGF0ZSB0aGUgZW5kVGltZSBnaXZlbiBhbiBhcHBvaW50bWVudCBkdXJhdGlvbiwgcmV0cmlldmVkIGZyb20gdGhlXHJcbiAgICAgICAgICAgIC8vIHNlbGVjdGVkIHNlcnZpY2VcclxuICAgICAgICAgICAgLy92YXIgZHVyYXRpb24gPSBib29raW5nLnByaWNpbmcgJiYgYm9va2luZy5wcmljaW5nLmR1cmF0aW9uO1xyXG4gICAgICAgICAgICAvLyBPciBieSBkZWZhdWx0IChpZiBubyBwcmljaW5nIHNlbGVjdGVkIG9yIGFueSkgdGhlIHVzZXIgcHJlZmVycmVkXHJcbiAgICAgICAgICAgIC8vIHRpbWUgZ2FwXHJcbiAgICAgICAgICAgIC8vZHVyYXRpb24gPSBkdXJhdGlvbiB8fCB1c2VyLnByZWZlcmVuY2VzLnRpbWVTbG90c0dhcDtcclxuICAgICAgICAgICAgLy8gUFJPVE9UWVBFOlxyXG4gICAgICAgICAgICB2YXIgZHVyYXRpb24gPSA2MDsgLy8gbWludXRlc1xyXG4gICAgICAgICAgICBib29raW5nLmVuZFRpbWUobW9tZW50KGJvb2tpbmcuc3RhcnRUaW1lKCkpLmFkZChkdXJhdGlvbiwgJ21pbnV0ZXMnKS50b0RhdGUoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKG9wdGlvbnMuc2VsZWN0U2VydmljZXMgPT09IHRydWUgJiYgYm9va2luZykge1xyXG5cclxuICAgICAgICAgICAgYm9va2luZy5zZXJ2aWNlcyhvcHRpb25zLnNlbGVjdGVkU2VydmljZXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChvcHRpb25zLnNlbGVjdExvY2F0aW9uID09PSB0cnVlICYmIGJvb2tpbmcpIHtcclxuXHJcbiAgICAgICAgICAgIGJvb2tpbmcubG9jYXRpb24ob3B0aW9ucy5zZWxlY3RlZExvY2F0aW9uKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgQXBwb2ludG1lbnQgPSByZXF1aXJlKCcuLi9tb2RlbHMvQXBwb2ludG1lbnQnKTtcclxuXHJcbkEucHJvdG90eXBlLnNob3dBcHBvaW50bWVudCA9IGZ1bmN0aW9uIHNob3dBcHBvaW50bWVudChhcHQpIHtcclxuXHJcbiAgICBpZiAodHlwZW9mKGFwdCkgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgaWYgKGFwdCkge1xyXG4gICAgICAgICAgICAvLyBUT0RPOiBzZWxlY3QgYXBwb2ludG1lbnQgYXB0IElEXHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAoYXB0ID09PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwb2ludG1lbnRzRGF0YVZpZXcubmV3QXBwb2ludG1lbnQobmV3IEFwcG9pbnRtZW50KCkpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3LmVkaXRNb2RlKHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIC8vIEFwcG9pbnRtZW50IG9iamVjdFxyXG4gICAgICAgIGlmIChhcHQuaWQpIHtcclxuICAgICAgICAgICAgLy8gVE9ETzogc2VsZWN0IGFwcG9pbnRtZW50IGJ5IGFwdCBpZFxyXG4gICAgICAgICAgICAvLyBUT0RPOiB0aGVuIHVwZGF0ZSB2YWx1ZXMgd2l0aCBpbi1lZGl0aW5nIHZhbHVlcyBmcm9tIGFwdFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gTmV3IGFwb3BpbnRtZW50IHdpdGggdGhlIGluLWVkaXRpbmcgdmFsdWVzXHJcbiAgICAgICAgICAgIHRoaXMuYXBwb2ludG1lbnRzRGF0YVZpZXcubmV3QXBwb2ludG1lbnQobmV3IEFwcG9pbnRtZW50KGFwdCkpO1xyXG4gICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3LmVkaXRNb2RlKHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbkEucHJvdG90eXBlLmluaXRBcHBvaW50bWVudCA9IGZ1bmN0aW9uIGluaXRBcHBvaW50bWVudCgpIHtcclxuICAgIGlmICghdGhpcy5fX2luaXRlZEFwcG9pbnRtZW50KSB7XHJcbiAgICAgICAgdGhpcy5fX2luaXRlZEFwcG9pbnRtZW50ID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdmFyIGFwcCA9IHRoaXMuYXBwO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIERhdGFcclxuICAgICAgICB2YXIgdGVzdERhdGEgPSByZXF1aXJlKCcuLi90ZXN0ZGF0YS9jYWxlbmRhckFwcG9pbnRtZW50cycpLmFwcG9pbnRtZW50cztcclxuICAgICAgICB2YXIgYXBwb2ludG1lbnRzRGF0YVZpZXcgPSB7XHJcbiAgICAgICAgICAgIGFwcG9pbnRtZW50czoga28ub2JzZXJ2YWJsZUFycmF5KHRlc3REYXRhKSxcclxuICAgICAgICAgICAgY3VycmVudEluZGV4OiBrby5vYnNlcnZhYmxlKDApLFxyXG4gICAgICAgICAgICBlZGl0TW9kZToga28ub2JzZXJ2YWJsZShmYWxzZSksXHJcbiAgICAgICAgICAgIG5ld0FwcG9pbnRtZW50OiBrby5vYnNlcnZhYmxlKG51bGwpXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3ID0gYXBwb2ludG1lbnRzRGF0YVZpZXc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuaXNOZXcgPSBrby5jb21wdXRlZChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXdBcHBvaW50bWVudCgpICE9PSBudWxsO1xyXG4gICAgICAgIH0sIGFwcG9pbnRtZW50c0RhdGFWaWV3KTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50QXBwb2ludG1lbnQgPSBrby5jb21wdXRlZCh7XHJcbiAgICAgICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNOZXcoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm5ld0FwcG9pbnRtZW50KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hcHBvaW50bWVudHMoKVt0aGlzLmN1cnJlbnRJbmRleCgpICUgdGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGhdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB3cml0ZTogZnVuY3Rpb24oYXB0KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmN1cnJlbnRJbmRleCgpICUgdGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50cygpW2luZGV4XSA9IGFwdDtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwb2ludG1lbnRzLnZhbHVlSGFzTXV0YXRlZCgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvd25lcjogYXBwb2ludG1lbnRzRGF0YVZpZXdcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5vcmlnaW5hbEVkaXRlZEFwcG9pbnRtZW50ID0ge307XHJcbiBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5nb1ByZXZpb3VzID0gZnVuY3Rpb24gZ29QcmV2aW91cygpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZWRpdE1vZGUoKSkgcmV0dXJuO1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50SW5kZXgoKSA9PT0gMClcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEluZGV4KHRoaXMuYXBwb2ludG1lbnRzKCkubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEluZGV4KCh0aGlzLmN1cnJlbnRJbmRleCgpIC0gMSkgJSB0aGlzLmFwcG9pbnRtZW50cygpLmxlbmd0aCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5nb05leHQgPSBmdW5jdGlvbiBnb05leHQoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmVkaXRNb2RlKCkpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEluZGV4KCh0aGlzLmN1cnJlbnRJbmRleCgpICsgMSkgJSB0aGlzLmFwcG9pbnRtZW50cygpLmxlbmd0aCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuZWRpdCA9IGZ1bmN0aW9uIGVkaXQoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWRpdE1vZGUodHJ1ZSk7XHJcbiAgICAgICAgfS5iaW5kKGFwcG9pbnRtZW50c0RhdGFWaWV3KTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5jYW5jZWwgPSBmdW5jdGlvbiBjYW5jZWwoKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBpZiBpcyBuZXcsIGRpc2NhcmRcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXNOZXcoKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXdBcHBvaW50bWVudChudWxsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIHJldmVydCBjaGFuZ2VzXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRBcHBvaW50bWVudChuZXcgQXBwb2ludG1lbnQodGhpcy5vcmlnaW5hbEVkaXRlZEFwcG9pbnRtZW50KSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuZWRpdE1vZGUoZmFsc2UpO1xyXG4gICAgICAgIH0uYmluZChhcHBvaW50bWVudHNEYXRhVmlldyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICAgICAgICAgIC8vIElmIGlzIGEgbmV3IG9uZSwgYWRkIGl0IHRvIHRoZSBjb2xsZWN0aW9uXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzTmV3KCkpIHtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdmFyIG5ld0FwdCA9IHRoaXMubmV3QXBwb2ludG1lbnQoKTtcclxuICAgICAgICAgICAgICAgIC8vIFRPRE86IHNvbWUgZmllZHMgbmVlZCBzb21lIGtpbmQgb2YgY2FsY3VsYXRpb24gdGhhdCBpcyBwZXJzaXN0ZWRcclxuICAgICAgICAgICAgICAgIC8vIHNvbiBjYW5ub3QgYmUgY29tcHV0ZWQuIFNpbXVsYXRlZDpcclxuICAgICAgICAgICAgICAgIG5ld0FwdC5zdW1tYXJ5KCdNYXNzYWdlIFRoZXJhcGlzdCBCb29raW5nJyk7XHJcbiAgICAgICAgICAgICAgICBuZXdBcHQuaWQoNCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIEFkZCB0byB0aGUgbGlzdDpcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwb2ludG1lbnRzLnB1c2gobmV3QXB0KTtcclxuICAgICAgICAgICAgICAgIC8vIG5vdywgcmVzZXRcclxuICAgICAgICAgICAgICAgIHRoaXMubmV3QXBwb2ludG1lbnQobnVsbCk7XHJcbiAgICAgICAgICAgICAgICAvLyBjdXJyZW50IGluZGV4IG11c3QgYmUgdGhlIGp1c3QtYWRkZWQgYXB0XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCh0aGlzLmFwcG9pbnRtZW50cygpLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBPbiBhZGRpbmcgYSBuZXcgb25lLCB0aGUgY29uZmlybWF0aW9uIHBhZ2UgbXVzdCBiZSBzaG93ZWRcclxuICAgICAgICAgICAgICAgIGFwcC5zaGVsbC5nbygnYm9va2luZ0NvbmZpcm1hdGlvbicsIHtcclxuICAgICAgICAgICAgICAgICAgICBib29raW5nOiBuZXdBcHRcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmVkaXRNb2RlKGZhbHNlKTtcclxuICAgICAgICB9LmJpbmQoYXBwb2ludG1lbnRzRGF0YVZpZXcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmVkaXRNb2RlLnN1YnNjcmliZShmdW5jdGlvbihpc0VkaXQpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuJGFjdGl2aXR5LnRvZ2dsZUNsYXNzKCdpbi1lZGl0JywgaXNFZGl0KTtcclxuICAgICAgICAgICAgdGhpcy4kYXBwb2ludG1lbnRWaWV3LmZpbmQoJy5BcHBvaW50bWVudENhcmQnKS50b2dnbGVDbGFzcygnaW4tZWRpdCcsIGlzRWRpdCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaXNFZGl0KSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgYSBjb3B5IG9mIHRoZSBhcHBvaW50bWVudCBzbyB3ZSByZXZlcnQgb24gJ2NhbmNlbCdcclxuICAgICAgICAgICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3Lm9yaWdpbmFsRWRpdGVkQXBwb2ludG1lbnQgPSBcclxuICAgICAgICAgICAgICAgICAgICBrby50b0pTKGFwcG9pbnRtZW50c0RhdGFWaWV3LmN1cnJlbnRBcHBvaW50bWVudCgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmN1cnJlbnREYXRlID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgYXB0ID0gdGhpcy5jdXJyZW50QXBwb2ludG1lbnQoKSxcclxuICAgICAgICAgICAgICAgIGp1c3REYXRlID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmIChhcHQgJiYgYXB0LnN0YXJ0VGltZSgpKVxyXG4gICAgICAgICAgICAgICAganVzdERhdGUgPSBtb21lbnQoYXB0LnN0YXJ0VGltZSgpKS5ob3VycygwKS5taW51dGVzKDApLnNlY29uZHMoMCkudG9EYXRlKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4ganVzdERhdGU7XHJcbiAgICAgICAgfSwgYXBwb2ludG1lbnRzRGF0YVZpZXcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAgICBFeHRlcm5hbCBhY3Rpb25zXHJcbiAgICAgICAgKiovXHJcbiAgICAgICAgdmFyIGVkaXRGaWVsZE9uID0gZnVuY3Rpb24gZWRpdEZpZWxkT24oYWN0aXZpdHksIGRhdGEpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIEluY2x1ZGUgYXBwb2ludG1lbnQgdG8gcmVjb3ZlciBzdGF0ZSBvbiByZXR1cm46XHJcbiAgICAgICAgICAgIGRhdGEuYXBwb2ludG1lbnQgPSBhcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50QXBwb2ludG1lbnQoKS5tb2RlbC50b1BsYWluT2JqZWN0KHRydWUpO1xyXG5cclxuICAgICAgICAgICAgYXBwLnNoZWxsLmdvKGFjdGl2aXR5LCBkYXRhKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LnBpY2tEYXRlVGltZSA9IGZ1bmN0aW9uIHBpY2tEYXRlVGltZSgpIHtcclxuXHJcbiAgICAgICAgICAgIGVkaXRGaWVsZE9uKCdkYXRldGltZVBpY2tlcicsIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdGVkRGF0ZXRpbWU6IG51bGxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5waWNrQ2xpZW50ID0gZnVuY3Rpb24gcGlja0NsaWVudCgpIHtcclxuXHJcbiAgICAgICAgICAgIGVkaXRGaWVsZE9uKCdjbGllbnRzJywge1xyXG4gICAgICAgICAgICAgICAgc2VsZWN0Q2xpZW50OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRDbGllbnQ6IG51bGxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcucGlja1NlcnZpY2UgPSBmdW5jdGlvbiBwaWNrU2VydmljZSgpIHtcclxuXHJcbiAgICAgICAgICAgIGVkaXRGaWVsZE9uKCdzZXJ2aWNlcycsIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdFNlcnZpY2VzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRTZXJ2aWNlczogYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50KCkuc2VydmljZXMoKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5jaGFuZ2VQcmljZSA9IGZ1bmN0aW9uIGNoYW5nZVByaWNlKCkge1xyXG4gICAgICAgICAgICAvLyBUT0RPXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5waWNrTG9jYXRpb24gPSBmdW5jdGlvbiBwaWNrTG9jYXRpb24oKSB7XHJcblxyXG4gICAgICAgICAgICBlZGl0RmllbGRPbignbG9jYXRpb25zJywge1xyXG4gICAgICAgICAgICAgICAgc2VsZWN0TG9jYXRpb246IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzZWxlY3RlZExvY2F0aW9uOiBhcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50QXBwb2ludG1lbnQoKS5sb2NhdGlvbigpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciB0ZXh0RmllbGRzSGVhZGVycyA9IHtcclxuICAgICAgICAgICAgcHJlTm90ZXNUb0NsaWVudDogJ05vdGVzIHRvIGNsaWVudCcsXHJcbiAgICAgICAgICAgIHBvc3ROb3Rlc1RvQ2xpZW50OiAnTm90ZXMgdG8gY2xpZW50IChhZnRlcndhcmRzKScsXHJcbiAgICAgICAgICAgIHByZU5vdGVzVG9TZWxmOiAnTm90ZXMgdG8gc2VsZicsXHJcbiAgICAgICAgICAgIHBvc3ROb3Rlc1RvU2VsZjogJ0Jvb2tpbmcgc3VtbWFyeSdcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmVkaXRUZXh0RmllbGQgPSBmdW5jdGlvbiBlZGl0VGV4dEZpZWxkKGZpZWxkKSB7XHJcblxyXG4gICAgICAgICAgICBlZGl0RmllbGRPbigndGV4dEVkaXRvcicsIHtcclxuICAgICAgICAgICAgICAgIHJlcXVlc3Q6ICd0ZXh0RWRpdG9yJyxcclxuICAgICAgICAgICAgICAgIGZpZWxkOiBmaWVsZCxcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBhcHBvaW50bWVudHNEYXRhVmlldy5pc05ldygpID8gJ05ldyBib29raW5nJyA6ICdCb29raW5nJyxcclxuICAgICAgICAgICAgICAgIGhlYWRlcjogdGV4dEZpZWxkc0hlYWRlcnNbZmllbGRdLFxyXG4gICAgICAgICAgICAgICAgdGV4dDogYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50KClbZmllbGRdKClcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xyXG4gICAgfVxyXG59O1xyXG4iLCIvKipcclxuICAgIEJvb2tNZUJ1dHRvbiBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEJvb2tNZUJ1dHRvbkFjdGl2aXR5KCkge1xyXG4gICAgXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkZyZWVsYW5jZXI7XHJcblxyXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdTY2hlZHVsaW5nJyk7XHJcbiAgICBcclxuICAgIC8vIEF1dG8gc2VsZWN0IHRleHQgb24gdGV4dGFyZWEsIGZvciBiZXR0ZXIgJ2NvcHknXHJcbiAgICAvLyBOT1RFOiB0aGUgJ3NlbGVjdCcgbXVzdCBoYXBwZW4gb24gY2xpY2ssIG5vdCB0YXAsIG5vdCBmb2N1cyxcclxuICAgIC8vIG9ubHkgJ2NsaWNrJyBpcyByZWxpYWJsZSBhbmQgYnVnLWZyZWUuXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLiRhY3Rpdml0eSxcclxuICAgICAgICBldmVudDogJ2NsaWNrJyxcclxuICAgICAgICBzZWxlY3RvcjogJ3RleHRhcmVhJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgJCh0aGlzKS5zZWxlY3QoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy5hcHAubW9kZWwubWFya2V0cGxhY2VQcm9maWxlLFxyXG4gICAgICAgIGV2ZW50OiAnZXJyb3InLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICBpZiAoZXJyICYmIGVyci50YXNrID09PSAnc2F2ZScpIHJldHVybjtcclxuICAgICAgICAgICAgdmFyIG1zZyA9ICdFcnJvciBsb2FkaW5nIGRhdGEgdG8gYnVpbGQgdGhlIEJ1dHRvbi4nO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5tb2RhbHMuc2hvd0Vycm9yKHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBtc2csXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyICYmIGVyci50YXNrICYmIGVyci5lcnJvciB8fCBlcnJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhzdGF0ZSkge1xyXG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBzdGF0ZSk7XHJcbiAgICBcclxuICAgIC8vIEtlZXAgZGF0YSB1cGRhdGVkOlxyXG4gICAgdGhpcy5hcHAubW9kZWwubWFya2V0cGxhY2VQcm9maWxlLnN5bmMoKTtcclxuICAgIFxyXG4gICAgLy8gU2V0IHRoZSBqb2IgdGl0bGVcclxuICAgIHZhciBqb2JJRCA9IHN0YXRlLnJvdXRlLnNlZ21lbnRzWzBdIHwwO1xyXG4gICAgdGhpcy52aWV3TW9kZWwuam9iVGl0bGVJRChqb2JJRCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoYXBwKSB7XHJcblxyXG4gICAgdmFyIG1hcmtldHBsYWNlUHJvZmlsZSA9IGFwcC5tb2RlbC5tYXJrZXRwbGFjZVByb2ZpbGU7XHJcbiAgICBcclxuICAgIC8vIEFjdHVhbCBkYXRhIGZvciB0aGUgZm9ybTpcclxuICAgIFxyXG4gICAgLy8gUmVhZC1vbmx5IGJvb2tDb2RlXHJcbiAgICB0aGlzLmJvb2tDb2RlID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIG1hcmtldHBsYWNlUHJvZmlsZS5kYXRhLmJvb2tDb2RlKCk7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgdGhpcy5qb2JUaXRsZUlEID0ga28ub2JzZXJ2YWJsZSgwKTtcclxuICAgIFxyXG4gICAgLy8gQnV0dG9uIHR5cGUsIGNhbiBiZTogJ3NtYWxsJywgJ21lZGl1bScsICdsYXJnZScsICdsaW5rJ1xyXG4gICAgdGhpcy50eXBlID0ga28ub2JzZXJ2YWJsZSgnbWVkaXVtJyk7XHJcblxyXG4gICAgdGhpcy5pc0xvY2tlZCA9IG1hcmtldHBsYWNlUHJvZmlsZS5pc0xvY2tlZDtcclxuICAgIFxyXG4gICAgLy8gR2VuZXJhdGlvbiBvZiB0aGUgYnV0dG9uIGNvZGVcclxuICAgIFxyXG4gICAgdmFyIGJ1dHRvblRlbXBsYXRlID1cclxuICAgICAgICAnPCEtLSBiZWdpbiBMb2Nvbm9taWNzIGJvb2stbWUtYnV0dG9uIC0tPicgK1xyXG4gICAgICAgICc8YSBzdHlsZT1cImRpc3BsYXk6aW5saW5lLWJsb2NrXCI+PGltZyBhbHQ9XCJcIiBzdHlsZT1cImJvcmRlcjpub25lXCIgLz48L2E+JyArIFxyXG4gICAgICAgICc8IS0tIGVuZCBMb2Nvbm9taWNzIGJvb2stbWUtYnV0dG9uIC0tPic7XHJcbiAgICBcclxuICAgIHZhciBsaW5rVGVtcGxhdGUgPVxyXG4gICAgICAgICc8IS0tIGJlZ2luIExvY29ub21pY3MgYm9vay1tZS1idXR0b24gLS0+JyArXHJcbiAgICAgICAgJzxhPjxzcGFuPjwvc3Bhbj48L2E+JyArXHJcbiAgICAgICAgJzwhLS0gZW5kIExvY29ub21pY3MgYm9vay1tZS1idXR0b24gLS0+JztcclxuXHJcbiAgICB0aGlzLmJ1dHRvbkh0bWxDb2RlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChtYXJrZXRwbGFjZVByb2ZpbGUuaXNMb2FkaW5nKCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdsb2FkaW5nLi4uJztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciB0eXBlID0gdGhpcy50eXBlKCksXHJcbiAgICAgICAgICAgICAgICB0cGwgPSBidXR0b25UZW1wbGF0ZTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlID09PSAnbGluaycpXHJcbiAgICAgICAgICAgICAgICB0cGwgPSBsaW5rVGVtcGxhdGU7XHJcblxyXG4gICAgICAgICAgICB2YXIgc2l0ZVVybCA9ICQoJ2h0bWwnKS5hdHRyKCdkYXRhLXNpdGUtdXJsJyksXHJcbiAgICAgICAgICAgICAgICBsaW5rVXJsID0gc2l0ZVVybCArICcvYm9vay8nICsgdGhpcy5ib29rQ29kZSgpICsgJy8nICsgdGhpcy5qb2JUaXRsZUlEKCkgKyAnLycsXHJcbiAgICAgICAgICAgICAgICBpbWdVcmwgPSBzaXRlVXJsICsgJy9pbWcvZXh0ZXJuL2Jvb2stbWUtYnV0dG9uLScgKyB0eXBlICsgJy5wbmcnO1xyXG5cclxuICAgICAgICAgICAgdmFyIGNvZGUgPSBnZW5lcmF0ZUJ1dHRvbkNvZGUoe1xyXG4gICAgICAgICAgICAgICAgdHBsOiB0cGwsXHJcbiAgICAgICAgICAgICAgICBsYWJlbDogJ0NsaWNrIGhlcmUgdG8gYm9vayBtZSBub3cgKG9uIGxvY29ub21pY3MuY29tKScsXHJcbiAgICAgICAgICAgICAgICBsaW5rVXJsOiBsaW5rVXJsLFxyXG4gICAgICAgICAgICAgICAgaW1nVXJsOiBpbWdVcmxcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gY29kZTtcclxuICAgICAgICB9XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgLy8gVE9ETyBDb3B5IGZlYXR1cmU7IHdpbGwgbmVlZCBhIG5hdGl2ZSBwbHVnaW5cclxuICAgIHRoaXMuY29weUNvZGUgPSBmdW5jdGlvbigpIHsgfTtcclxuICAgIFxyXG4gICAgdGhpcy5zZW5kQnlFbWFpbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIFRPRE8gU2VuZCBieSBlbWFpbCwgd2l0aCB3aW5kb3cub3BlbignbWFpbHRvOiZib2R5PWNvZGUnKTtcclxuICAgIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdlbmVyYXRlQnV0dG9uQ29kZShvcHRpb25zKSB7XHJcblxyXG4gICAgdmFyICRidG4gPSAkKCQucGFyc2VIVE1MKCc8ZGl2PicgKyBvcHRpb25zLnRwbCArICc8L2Rpdj4nKSk7XHJcblxyXG4gICAgJGJ0blxyXG4gICAgLmZpbmQoJ2EnKVxyXG4gICAgLmF0dHIoJ2hyZWYnLCBvcHRpb25zLmxpbmtVcmwpXHJcbiAgICAuZmluZCgnc3BhbicpXHJcbiAgICAudGV4dChvcHRpb25zLmxhYmVsKTtcclxuICAgICRidG5cclxuICAgIC5maW5kKCdpbWcnKVxyXG4gICAgLmF0dHIoJ3NyYycsIG9wdGlvbnMuaW1nVXJsKVxyXG4gICAgLmF0dHIoJ2FsdCcsIG9wdGlvbnMubGFiZWwpO1xyXG5cclxuICAgIHJldHVybiAkYnRuLmh0bWwoKTtcclxufVxyXG4iLCIvKipcclxuICAgIGJvb2tpbmdDb25maXJtYXRpb24gYWN0aXZpdHlcclxuICAgIFxyXG4gICAgVE9ETzogVG8gcmVwbGFjZWQgYnkgYSBtb2RhbFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxuICAgIFxyXG52YXIgc2luZ2xldG9uID0gbnVsbDtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRDbGllbnRzKCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcclxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgQm9va2luZ0NvbmZpcm1hdGlvbkFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIEJvb2tpbmdDb25maXJtYXRpb25BY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcclxuICAgIFxyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuXHJcbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xyXG4gICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLmRhdGFWaWV3LCAkYWN0aXZpdHkuZ2V0KDApKTtcclxufVxyXG5cclxuQm9va2luZ0NvbmZpcm1hdGlvbkFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5ib29raW5nKVxyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuYm9va2luZyhvcHRpb25zLmJvb2tpbmcpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIC8vIDpBcHBvaW50bWVudFxyXG4gICAgdGhpcy5ib29raW5nID0ga28ub2JzZXJ2YWJsZShudWxsKTtcclxufVxyXG4iLCIvKiogQ2FsZW5kYXIgYWN0aXZpdHkgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIENhbGVuZGFyU2xvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9DYWxlbmRhclNsb3QnKTtcclxuXHJcbnJlcXVpcmUoJy4uL2NvbXBvbmVudHMvRGF0ZVBpY2tlcicpO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIENhbGVuZGFyQWN0aXZpdHkoKSB7XHJcbiAgICBcclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xyXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKCdDYWxlbmRhcicpO1xyXG5cclxuICAgIC8qIEdldHRpbmcgZWxlbWVudHMgKi9cclxuICAgIHRoaXMuJGRhdGVwaWNrZXIgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjY2FsZW5kYXJEYXRlUGlja2VyJyk7XHJcbiAgICB0aGlzLiRkYWlseVZpZXcgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjY2FsZW5kYXJEYWlseVZpZXcnKTtcclxuICAgIHRoaXMuJGRhdGVIZWFkZXIgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjY2FsZW5kYXJEYXRlSGVhZGVyJyk7XHJcbiAgICB0aGlzLiRkYXRlVGl0bGUgPSB0aGlzLiRkYXRlSGVhZGVyLmNoaWxkcmVuKCcuQ2FsZW5kYXJEYXRlSGVhZGVyLWRhdGUnKTtcclxuICAgIHRoaXMuJGNob29zZU5ldyA9ICQoJyNjYWxlbmRhckNob29zZU5ldycpO1xyXG4gICAgXHJcbiAgICAvKiBJbml0IGNvbXBvbmVudHMgKi9cclxuICAgIHRoaXMuJGRhdGVwaWNrZXIuc2hvdygpLmRhdGVwaWNrZXIoKTtcclxuICAgIFxyXG4gICAgLyogRXZlbnQgaGFuZGxlcnMgKi9cclxuICAgIC8vIENoYW5nZXMgb24gY3VycmVudERhdGVcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLmN1cnJlbnREYXRlLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgICAgICAgICAgLy8gVHJpZ2dlciBhIGxheW91dCB1cGRhdGUsIHJlcXVpcmVkIGJ5IHRoZSBmdWxsLWhlaWdodCBmZWF0dXJlXHJcbiAgICAgICAgICAgICQod2luZG93KS50cmlnZ2VyKCdsYXlvdXRVcGRhdGUnKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChkYXRlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbWRhdGUgPSBtb21lbnQoZGF0ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG1kYXRlLmlzVmFsaWQoKSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgaXNvRGF0ZSA9IG1kYXRlLnRvSVNPU3RyaW5nKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBkYXRlcGlja2VyIHNlbGVjdGVkIGRhdGUgb24gZGF0ZSBjaGFuZ2UgKGZyb20gXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYSBkaWZmZXJlbnQgc291cmNlIHRoYW4gdGhlIGRhdGVwaWNrZXIgaXRzZWxmXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5yZW1vdmVDbGFzcygnaXMtdmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENoYW5nZSBub3QgZnJvbSB0aGUgd2lkZ2V0P1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLiRkYXRlcGlja2VyLmRhdGVwaWNrZXIoJ2dldFZhbHVlJykudG9JU09TdHJpbmcoKSAhPT0gaXNvRGF0ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdzZXRWYWx1ZScsIGRhdGUsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBPbiBjdXJyZW50RGF0ZSBjaGFuZ2VzLCB1cGRhdGUgdGhlIFVSTFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHNhdmUgYSB1c2VmdWwgc3RhdGVcclxuICAgICAgICAgICAgICAgICAgICAvLyBET1VCVDogcHVzaCBvciByZXBsYWNlIHN0YXRlPyAobW9yZSBoaXN0b3J5IGVudHJpZXMgb3IgdGhlIHNhbWU/KVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsICdjYWxlbmRhci8nICsgaXNvRGF0ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIERPTkVcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFNvbWV0aGluZyBmYWlsLCBiYWQgZGF0ZSBvciBub3QgZGF0ZSBhdCBhbGxcclxuICAgICAgICAgICAgLy8gU2V0IHRoZSBjdXJyZW50IFxyXG4gICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5jdXJyZW50RGF0ZShuZXcgRGF0ZSgpKTtcclxuXHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTd2lwZSBkYXRlIG9uIGdlc3R1cmVcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMuJGRhaWx5VmlldyxcclxuICAgICAgICBldmVudDogJ3N3aXBlbGVmdCBzd2lwZXJpZ2h0JyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBkaXIgPSBlLnR5cGUgPT09ICdzd2lwZWxlZnQnID8gJ25leHQnIDogJ3ByZXYnO1xyXG5cclxuICAgICAgICAgICAgLy8gSGFjayB0byBzb2x2ZSB0aGUgZnJlZXp5LXN3aXBlIGFuZCB0YXAtYWZ0ZXIgYnVnIG9uIEpRTTpcclxuICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcigndG91Y2hlbmQnKTtcclxuICAgICAgICAgICAgLy8gQ2hhbmdlIGRhdGVcclxuICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCBkaXIsICdkYXRlJyk7XHJcblxyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ2hhbmdpbmcgZGF0ZSB3aXRoIGJ1dHRvbnM6XHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLiRkYXRlSGVhZGVyLFxyXG4gICAgICAgIGV2ZW50OiAndGFwJyxcclxuICAgICAgICBzZWxlY3RvcjogJy5DYWxlbmRhckRhdGVIZWFkZXItc3dpdGNoJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoZS5jdXJyZW50VGFyZ2V0LmdldEF0dHJpYnV0ZSgnaHJlZicpKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICcjcHJldic6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCAncHJldicsICdkYXRlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICcjbmV4dCc6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCAnbmV4dCcsICdkYXRlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIExldHMgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU2hvd2luZyBkYXRlcGlja2VyIHdoZW4gcHJlc3NpbmcgdGhlIHRpdGxlXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLiRkYXRlVGl0bGUsXHJcbiAgICAgICAgZXZlbnQ6ICd0YXAnLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci50b2dnbGVDbGFzcygnaXMtdmlzaWJsZScpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBVcGRhdGluZyB2aWV3IGRhdGUgd2hlbiBwaWNrZWQgYW5vdGhlciBvbmVcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMuJGRhdGVwaWNrZXIsXHJcbiAgICAgICAgZXZlbnQ6ICdjaGFuZ2VEYXRlJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgIGlmIChlLnZpZXdNb2RlID09PSAnZGF5cycpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmN1cnJlbnREYXRlKGUuZGF0ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFNldCBkYXRlIHRvIG1hdGNoIGRhdGVwaWNrZXIgZm9yIGZpcnN0IHVwZGF0ZVxyXG4gICAgdGhpcy52aWV3TW9kZWwuY3VycmVudERhdGUodGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdnZXRWYWx1ZScpKTtcclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIG9wdGlvbnMpO1xyXG5cclxuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMucm91dGUgJiYgb3B0aW9ucy5yb3V0ZS5zZWdtZW50cykge1xyXG4gICAgICAgIHZhciBzZGF0ZSA9IG9wdGlvbnMucm91dGUuc2VnbWVudHNbMF0sXHJcbiAgICAgICAgICAgIG1kYXRlID0gbW9tZW50KHNkYXRlKSxcclxuICAgICAgICAgICAgZGF0ZSA9IG1kYXRlLmlzVmFsaWQoKSA/IG1kYXRlLnRvRGF0ZSgpIDogbnVsbDtcclxuXHJcbiAgICAgICAgaWYgKGRhdGUpXHJcbiAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmN1cnJlbnREYXRlKGRhdGUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIFRpbWUgPSByZXF1aXJlKCcuLi91dGlscy9UaW1lJyk7XHJcbmZ1bmN0aW9uIGNyZWF0ZUZyZWVTbG90KG9wdGlvbnMpIHtcclxuICAgIFxyXG4gICAgdmFyIHN0YXJ0ID0gb3B0aW9ucy5zdGFydCB8fCBuZXcgVGltZShvcHRpb25zLmRhdGUsIDAsIDAsIDApLFxyXG4gICAgICAgIGVuZCA9IG9wdGlvbnMuZW5kIHx8IG5ldyBUaW1lKG9wdGlvbnMuZGF0ZSwgMCwgMCwgMCk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogc3RhcnQsXHJcbiAgICAgICAgZW5kVGltZTogZW5kLFxyXG5cclxuICAgICAgICBzdWJqZWN0OiAnRnJlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyMhYXBwb2ludG1lbnQvMCcsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctc3VjY2VzcydcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICAgIFRha2UgYSBzaW5nbGUgQ2FsZW5kYXJFdmVudCBtb2RlbCBhbmQgc2luZ2xlIEJvb2tpbmcgbW9kZWxcclxuICAgIGFuZCBjcmVhdGVzIGEgQ2FsZW5kYXJTbG90LCB1c2luZyBtYWlubHkgdGhlIGV2ZW50IGluZm9cclxuICAgIGJ1dCB1cGdyYWRlZCB3aXRoIGJvb2tpbmcgaW5mbywgaWYgdGhlcmUgaXMgYSBib29raW5nLlxyXG4qKi9cclxuZnVuY3Rpb24gY29udmVydEV2ZW50VG9TbG90KGV2ZW50LCBib29raW5nKSB7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogZXZlbnQuc3RhcnRUaW1lKCksXHJcbiAgICAgICAgZW5kVGltZTogZXZlbnQuZW5kVGltZSgpLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6IGV2ZW50LnN1bW1hcnkoKSwgLy8gRnVsbE5hbWVcclxuICAgICAgICBkZXNjcmlwdGlvbjogZXZlbnQuZGVzY3JpcHRpb24oKSwgLy8gJ0RlZXAgVGlzc3VlIE1hc3NhZ2UgTG9uZyBOYW1lJyxcclxuICAgICAgICBsaW5rOiAnIyFhcHBvaW50bWVudC8nICsgZXZlbnQuY2FsZW5kYXJFdmVudElEKCksXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IGJvb2tpbmcgPT09IG51bGwgPyAnZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0JyA6IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogYm9va2luZyA9PT0gbnVsbCA/IG51bGwgOiAoYm9va2luZyAmJiBib29raW5nLmJvb2tpbmdSZXF1ZXN0ICYmIGJvb2tpbmcuYm9va2luZ1JlcXVlc3QucHJpY2luZ0VzdGltYXRlLnRvdGFsUHJpY2UgfHwgJyQwLjAwJyksXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICAgIFRha2VzIGFwcE1vZGVsIG9ic2VydmFibGVzIGZvciBldmVudHMgYW5kIGJvb2tpbmdzIGZvciB0aGUgc2FtZSBkYXRlXHJcbiAgICBhbmQgY3JlYXRlcyBhbiBhcnJheSBvZiBDYWxlbmRhclNsb3RzLlxyXG4qKi9cclxuZnVuY3Rpb24gc2xvdHNGcm9tRXZlbnRzQm9va2luZ3MoZXZlbnRzLCBib29raW5ncykge1xyXG4gICAgcmV0dXJuIGV2ZW50cygpLm1hcChmdW5jdGlvbihldmVudCkge1xyXG5cclxuICAgICAgICB2YXIgYm9va2luZyA9IG51bGw7XHJcbiAgICAgICAgYm9va2luZ3MoKS5zb21lKGZ1bmN0aW9uKHNlYXJjaEJvb2tpbmcpIHtcclxuICAgICAgICAgICAgdmFyIGZvdW5kID0gc2VhcmNoQm9va2luZy5jb25maXJtZWREYXRlSUQoKSA9PT0gZXZlbnQuY2FsZW5kYXJFdmVudElEKCk7XHJcbiAgICAgICAgICAgIGlmIChmb3VuZCkge1xyXG4gICAgICAgICAgICAgICAgYm9va2luZyA9IHNlYXJjaEJvb2tpbmc7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gY29udmVydEV2ZW50VG9TbG90KGV2ZW50LCBib29raW5nKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICAgIEludHJvZHVjZSBmcmVlIHNsb3RzIHdoZXJldmVyIG5lZWQgaW4gdGhlIGdpdmVuXHJcbiAgICBhcnJheSBvZiBDYWxlbmRhclNsb3RzLlxyXG4gICAgSXQgc29ydHMgdGhlIGFycmF5IGZpcnN0IGFuZCBhcHBlbmQgZnJvbSAxMkFNIHRvIDEyQU1cclxuICAgIGFueSBnYXAgd2l0aCBhIGZyZWUgc2xvdC5cclxuKiovXHJcbmZ1bmN0aW9uIGZpbGxGcmVlU2xvdHMoc2xvdHMpIHtcclxuXHJcbiAgICAvLyBGaXJzdCwgZW5zdXJlIGxpc3QgaXMgc29ydGVkXHJcbiAgICBzbG90cyA9IHNsb3RzLnNvcnQoZnVuY3Rpb24oYSwgYikge1xyXG4gICAgICAgIHJldHVybiBhLnN0YXJ0VGltZSgpID4gYi5zdGFydFRpbWUoKTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB2YXIgZmlsbGVkU2xvdHMgPSBbXSxcclxuICAgICAgICB6ZXJvVGltZSA9ICcwMDowMDowMCcsXHJcbiAgICAgICAgbGFzdCA9IHplcm9UaW1lLFxyXG4gICAgICAgIGxhc3REYXRlVGltZSA9IG51bGwsXHJcbiAgICAgICAgdGltZUZvcm1hdCA9ICdISDptbTpzcyc7XHJcblxyXG4gICAgc2xvdHMuZm9yRWFjaChmdW5jdGlvbihzbG90KSB7XHJcbiAgICAgICAgdmFyIHN0YXJ0ID0gc2xvdC5zdGFydFRpbWUoKSxcclxuICAgICAgICAgICAgcyA9IG1vbWVudChzdGFydCksXHJcbiAgICAgICAgICAgIGVuZCA9IHNsb3QuZW5kVGltZSgpLFxyXG4gICAgICAgICAgICBlID0gbW9tZW50KGVuZCk7XHJcblxyXG4gICAgICAgIGlmIChzLmZvcm1hdCh0aW1lRm9ybWF0KSA+IGxhc3QpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChsYXN0RGF0ZVRpbWUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIC8vIEZpcnN0IHNsb3Qgb2YgdGhlIGRhdGUsIDEyQU09MDA6MDBcclxuICAgICAgICAgICAgICAgIGxhc3REYXRlVGltZSA9IG5ldyBEYXRlKFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0LmdldEZ1bGxZZWFyKCksIHN0YXJ0LmdldE1vbnRoKCksIHN0YXJ0LmdldERhdGUoKSxcclxuICAgICAgICAgICAgICAgICAgICAwLCAwLCAwXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBhIGdhcCwgZmlsbGVkIGl0XHJcbiAgICAgICAgICAgIGZpbGxlZFNsb3RzLnB1c2goY3JlYXRlRnJlZVNsb3Qoe1xyXG4gICAgICAgICAgICAgICAgc3RhcnQ6IGxhc3REYXRlVGltZSxcclxuICAgICAgICAgICAgICAgIGVuZDogc3RhcnRcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmlsbGVkU2xvdHMucHVzaChzbG90KTtcclxuICAgICAgICBsYXN0RGF0ZVRpbWUgPSBlbmQ7XHJcbiAgICAgICAgbGFzdCA9IGUuZm9ybWF0KHRpbWVGb3JtYXQpO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIENoZWNrIGxhdGVzdCB0byBzZWUgYSBnYXAgYXQgdGhlIGVuZDpcclxuICAgIHZhciBsYXN0RW5kID0gbGFzdERhdGVUaW1lICYmIG1vbWVudChsYXN0RGF0ZVRpbWUpLmZvcm1hdCh0aW1lRm9ybWF0KTtcclxuICAgIGlmIChsYXN0RW5kICE9PSB6ZXJvVGltZSkge1xyXG4gICAgICAgIC8vIFRoZXJlIGlzIGEgZ2FwLCBmaWxsZWQgaXRcclxuICAgICAgICB2YXIgbmV4dE1pZG5pZ2h0ID0gbmV3IERhdGUoXHJcbiAgICAgICAgICAgIGxhc3REYXRlVGltZS5nZXRGdWxsWWVhcigpLFxyXG4gICAgICAgICAgICBsYXN0RGF0ZVRpbWUuZ2V0TW9udGgoKSxcclxuICAgICAgICAgICAgLy8gTmV4dCBkYXRlIVxyXG4gICAgICAgICAgICBsYXN0RGF0ZVRpbWUuZ2V0RGF0ZSgpICsgMSxcclxuICAgICAgICAgICAgLy8gQXQgemVybyBob3VycyFcclxuICAgICAgICAgICAgMCwgMCwgMFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGZpbGxlZFNsb3RzLnB1c2goY3JlYXRlRnJlZVNsb3Qoe1xyXG4gICAgICAgICAgICBzdGFydDogbGFzdERhdGVUaW1lLFxyXG4gICAgICAgICAgICBlbmQ6IG5leHRNaWRuaWdodFxyXG4gICAgICAgIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmlsbGVkU2xvdHM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbChhcHApIHtcclxuXHJcbiAgICB0aGlzLmN1cnJlbnREYXRlID0ga28ub2JzZXJ2YWJsZShuZXcgRGF0ZSgpKTtcclxuICAgIHZhciBmdWxsRGF5RnJlZSA9IFtjcmVhdGVGcmVlU2xvdCh7IGRhdGU6IHRoaXMuY3VycmVudERhdGUoKSB9KV07XHJcblxyXG4gICAgLy8gc2xvdHNTb3VyY2Ugc2F2ZSB0aGUgZGF0YSBhcyBwcm9jZXNzZWQgYnkgYSByZXF1ZXN0IG9mIFxyXG4gICAgLy8gZGF0YSBiZWNhdXNlIGEgZGF0ZSBjaGFuZ2UuXHJcbiAgICAvLyBJdCdzIHVwZGF0ZWQgYnkgY2hhbmdlcyBvbiBjdXJyZW50RGF0ZSB0aGF0IHBlcmZvcm1zIHRoZSByZW1vdGUgbG9hZGluZ1xyXG4gICAgdGhpcy5zbG90c1NvdXJjZSA9IGtvLm9ic2VydmFibGUoZnVsbERheUZyZWUpO1xyXG4gICAgLy8gc2xvdHMgY29tcHV0ZWQsIHVzaW5nIHNsb3RzU291cmNlLlxyXG4gICAgLy8gQXMgY29tcHV0ZWQgaW4gb3JkZXIgdG8gYWxsb3cgYW55IG90aGVyIG9ic2VydmFibGUgY2hhbmdlXHJcbiAgICAvLyBmcm9tIHRyaWdnZXIgdGhlIGNyZWF0aW9uIG9mIGEgbmV3IHZhbHVlXHJcbiAgICB0aGlzLnNsb3RzID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICBcclxuICAgICAgICB2YXIgc2xvdHMgPSB0aGlzLnNsb3RzU291cmNlKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGZpbGxGcmVlU2xvdHMoc2xvdHMpO1xyXG5cclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmlzTG9hZGluZyA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgXHJcbiAgICAvLyBVcGRhdGUgY3VycmVudCBzbG90cyBvbiBkYXRlIGNoYW5nZVxyXG4gICAgdmFyIHByZXZpb3VzRGF0ZSA9IHRoaXMuY3VycmVudERhdGUoKS50b0lTT1N0cmluZygpO1xyXG4gICAgdGhpcy5jdXJyZW50RGF0ZS5zdWJzY3JpYmUoZnVuY3Rpb24gKGRhdGUpIHtcclxuICAgICAgICBcclxuICAgICAgICAvLyBJTVBPUlRBTlQ6IFRoZSBkYXRlIG9iamVjdCBtYXkgYmUgcmV1c2VkIGFuZCBtdXRhdGVkIGJldHdlZW4gY2FsbHNcclxuICAgICAgICAvLyAobW9zdGx5IGJlY2F1c2UgdGhlIHdpZGdldCBJIHRoaW5rKSwgc28gaXMgYmV0dGVyIHRvIGNyZWF0ZVxyXG4gICAgICAgIC8vIGEgY2xvbmUgYW5kIGF2b2lkIGdldHRpbmcgcmFjZS1jb25kaXRpb25zIGluIHRoZSBkYXRhIGRvd25sb2FkaW5nLlxyXG4gICAgICAgIGRhdGUgPSBuZXcgRGF0ZShEYXRlLnBhcnNlKGRhdGUudG9JU09TdHJpbmcoKSkpO1xyXG5cclxuICAgICAgICAvLyBBdm9pZCBkdXBsaWNhdGVkIG5vdGlmaWNhdGlvbiwgdW4tY2hhbmdlZCBkYXRlXHJcbiAgICAgICAgaWYgKGRhdGUudG9JU09TdHJpbmcoKSA9PT0gcHJldmlvdXNEYXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJldmlvdXNEYXRlID0gZGF0ZS50b0lTT1N0cmluZygpO1xyXG5cclxuICAgICAgICB0aGlzLmlzTG9hZGluZyh0cnVlKTtcclxuICAgICAgICBcclxuICAgICAgICBQcm9taXNlLmFsbChbXHJcbiAgICAgICAgICAgIGFwcC5tb2RlbC5ib29raW5ncy5nZXRCb29raW5nc0J5RGF0ZShkYXRlKSxcclxuICAgICAgICAgICAgYXBwLm1vZGVsLmNhbGVuZGFyRXZlbnRzLmdldEV2ZW50c0J5RGF0ZShkYXRlKVxyXG4gICAgICAgIF0pLnRoZW4oZnVuY3Rpb24oZ3JvdXApIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIElNUE9SVEFOVDogRmlyc3QsIHdlIG5lZWQgdG8gY2hlY2sgdGhhdCB3ZSBcclxuICAgICAgICAgICAgLy8gaW4gdGhlIHNhbWUgZGF0ZSBzdGlsbCwgYmVjYXVzZSBzZXZlcmFsIGxvYWRpbmdzXHJcbiAgICAgICAgICAgIC8vIGNhbiBoYXBwZW4gYXQgYSB0aW1lIChjaGFuZ2luZyBxdWlja2x5IGZyb20gZGF0ZSB0byBkYXRlXHJcbiAgICAgICAgICAgIC8vIHdpdGhvdXQgd2FpdCBmb3IgZmluaXNoKSwgYXZvaWRpbmcgYSByYWNlLWNvbmRpdGlvblxyXG4gICAgICAgICAgICAvLyB0aGF0IGNyZWF0ZSBmbGlja2VyaW5nIGVmZmVjdHMgb3IgcmVwbGFjZSB0aGUgZGF0ZSBldmVudHNcclxuICAgICAgICAgICAgLy8gYnkgdGhlIGV2ZW50cyBmcm9tIG90aGVyIGRhdGUsIGJlY2F1c2UgaXQgdG9va3MgbW9yZSBhbiBjaGFuZ2VkLlxyXG4gICAgICAgICAgICAvLyBUT0RPOiBzdGlsbCB0aGlzIGhhcyB0aGUgbWlub3IgYnVnIG9mIGxvc2luZyB0aGUgaXNMb2FkaW5nXHJcbiAgICAgICAgICAgIC8vIGlmIGEgcHJldmlvdXMgdHJpZ2dlcmVkIGxvYWQgc3RpbGwgZGlkbid0IGZpbmlzaGVkOyBpdHMgbWlub3JcclxuICAgICAgICAgICAgLy8gYmVjYXVzZSBpcyB2ZXJ5IHJhcmUgdGhhdCBoYXBwZW5zLCBtb3ZpbmcgdGhpcyBzdHVmZlxyXG4gICAgICAgICAgICAvLyB0byBhIHNwZWNpYWwgYXBwTW9kZWwgZm9yIG1peGVkIGJvb2tpbmdzIGFuZCBldmVudHMgd2l0aCBcclxuICAgICAgICAgICAgLy8gcGVyIGRhdGUgY2FjaGUgdGhhdCBpbmNsdWRlcyBhIHZpZXcgb2JqZWN0IHdpdGggaXNMb2FkaW5nIHdpbGxcclxuICAgICAgICAgICAgLy8gZml4IGl0IGFuZCByZWR1Y2UgdGhpcyBjb21wbGV4aXR5LlxyXG4gICAgICAgICAgICBpZiAoZGF0ZS50b0lTT1N0cmluZygpICE9PSB0aGlzLmN1cnJlbnREYXRlKCkudG9JU09TdHJpbmcoKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gUmFjZSBjb25kaXRpb24sIG5vdCB0aGUgc2FtZSEhIG91dDpcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIGV2ZW50cyA9IGdyb3VwWzFdLFxyXG4gICAgICAgICAgICAgICAgYm9va2luZ3MgPSBncm91cFswXTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChldmVudHMgJiYgZXZlbnRzKCkubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgdGhlIHNsb3RzIGFuZCB1cGRhdGUgdGhlIHNvdXJjZTpcclxuICAgICAgICAgICAgICAgIHRoaXMuc2xvdHNTb3VyY2Uoc2xvdHNGcm9tRXZlbnRzQm9va2luZ3MoZXZlbnRzLCBib29raW5ncykpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2xvdHNTb3VyY2UoZnVsbERheUZyZWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0uYmluZCh0aGlzKSlcclxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBTaG93IGZyZWUgb24gZXJyb3JcclxuICAgICAgICAgICAgdGhpcy5zbG90c1NvdXJjZShmdWxsRGF5RnJlZSk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKGZhbHNlKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBtc2cgPSAnRXJyb3IgbG9hZGluZyBjYWxlbmRhciBldmVudHMuJztcclxuICAgICAgICAgICAgYXBwLm1vZGFscy5zaG93RXJyb3Ioe1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IG1zZyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnIgJiYgZXJyLmVycm9yIHx8IGVyclxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59XHJcbiIsIi8qKlxyXG4gICAgQ2FsZW5kYXJTeW5jaW5nIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5JyksXHJcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcblxyXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQ2FsZW5kYXJTeW5jaW5nQWN0aXZpdHkoKSB7XHJcbiAgICBcclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICBcclxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuRnJlZWxhbmNlcjtcclxuXHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ1NjaGVkdWxpbmcnKTtcclxuICAgIFxyXG4gICAgLy8gQWRkaW5nIGF1dG8tc2VsZWN0IGJlaGF2aW9yIHRvIHRoZSBleHBvcnQgVVJMXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLiRhY3Rpdml0eS5maW5kKCcjY2FsZW5kYXJTeW5jLWljYWxFeHBvcnRVcmwnKSxcclxuICAgICAgICBldmVudDogJ2NsaWNrJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgJCh0aGlzKS5zZWxlY3QoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy5hcHAubW9kZWwuY2FsZW5kYXJTeW5jaW5nLFxyXG4gICAgICAgIGV2ZW50OiAnZXJyb3InLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICB2YXIgbXNnID0gZXJyLnRhc2sgPT09ICdzYXZlJyA/ICdFcnJvciBzYXZpbmcgY2FsZW5kYXIgc3luY2luZyBzZXR0aW5ncy4nIDogJ0Vycm9yIGxvYWRpbmcgY2FsZW5kYXIgc3luY2luZyBzZXR0aW5ncy4nO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5tb2RhbHMuc2hvd0Vycm9yKHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBtc2csXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyICYmIGVyci50YXNrICYmIGVyci5lcnJvciB8fCBlcnJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhzdGF0ZSkge1xyXG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBzdGF0ZSk7XHJcbiAgICBcclxuICAgIC8vIEtlZXAgZGF0YSB1cGRhdGVkOlxyXG4gICAgdGhpcy5hcHAubW9kZWwuY2FsZW5kYXJTeW5jaW5nLnN5bmMoKTtcclxuICAgIC8vIERpc2NhcmQgYW55IHByZXZpb3VzIHVuc2F2ZWQgZWRpdFxyXG4gICAgdGhpcy52aWV3TW9kZWwuZGlzY2FyZCgpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKGFwcCkge1xyXG5cclxuICAgIHZhciBjYWxlbmRhclN5bmNpbmcgPSBhcHAubW9kZWwuY2FsZW5kYXJTeW5jaW5nO1xyXG5cclxuICAgIHZhciBzeW5jVmVyc2lvbiA9IGNhbGVuZGFyU3luY2luZy5uZXdWZXJzaW9uKCk7XHJcbiAgICBzeW5jVmVyc2lvbi5pc09ic29sZXRlLnN1YnNjcmliZShmdW5jdGlvbihpdElzKSB7XHJcbiAgICAgICAgaWYgKGl0SXMpIHtcclxuICAgICAgICAgICAgLy8gbmV3IHZlcnNpb24gZnJvbSBzZXJ2ZXIgd2hpbGUgZWRpdGluZ1xyXG4gICAgICAgICAgICAvLyBGVVRVUkU6IHdhcm4gYWJvdXQgYSBuZXcgcmVtb3RlIHZlcnNpb24gYXNraW5nXHJcbiAgICAgICAgICAgIC8vIGNvbmZpcm1hdGlvbiB0byBsb2FkIHRoZW0gb3IgZGlzY2FyZCBhbmQgb3ZlcndyaXRlIHRoZW07XHJcbiAgICAgICAgICAgIC8vIHRoZSBzYW1lIGlzIG5lZWQgb24gc2F2ZSgpLCBhbmQgb24gc2VydmVyIHJlc3BvbnNlXHJcbiAgICAgICAgICAgIC8vIHdpdGggYSA1MDk6Q29uZmxpY3Qgc3RhdHVzIChpdHMgYm9keSBtdXN0IGNvbnRhaW4gdGhlXHJcbiAgICAgICAgICAgIC8vIHNlcnZlciB2ZXJzaW9uKS5cclxuICAgICAgICAgICAgLy8gUmlnaHQgbm93LCBqdXN0IG92ZXJ3cml0ZSBjdXJyZW50IGNoYW5nZXMgd2l0aFxyXG4gICAgICAgICAgICAvLyByZW1vdGUgb25lczpcclxuICAgICAgICAgICAgc3luY1ZlcnNpb24ucHVsbCh7IGV2ZW5JZk5ld2VyOiB0cnVlIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBBY3R1YWwgZGF0YSBmb3IgdGhlIGZvcm06XHJcbiAgICB0aGlzLnN5bmMgPSBzeW5jVmVyc2lvbi52ZXJzaW9uO1xyXG5cclxuICAgIHRoaXMuaXNMb2NrZWQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNMb2NrZWQoKSB8fCB0aGlzLmlzUmVzZXRpbmcoKTtcclxuICAgIH0sIGNhbGVuZGFyU3luY2luZyk7XHJcblxyXG4gICAgdGhpcy5zdWJtaXRUZXh0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKCkgPyBcclxuICAgICAgICAgICAgICAgICdsb2FkaW5nLi4uJyA6IFxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc1NhdmluZygpID8gXHJcbiAgICAgICAgICAgICAgICAgICAgJ3NhdmluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgICAgICAnU2F2ZSdcclxuICAgICAgICApO1xyXG4gICAgfSwgY2FsZW5kYXJTeW5jaW5nKTtcclxuICAgIFxyXG4gICAgdGhpcy5yZXNldFRleHQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5pc1Jlc2V0aW5nKCkgPyBcclxuICAgICAgICAgICAgICAgICdyZXNldGluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgICdSZXNldCBQcml2YXRlIFVSTCdcclxuICAgICAgICApO1xyXG4gICAgfSwgY2FsZW5kYXJTeW5jaW5nKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNjYXJkID0gZnVuY3Rpb24gZGlzY2FyZCgpIHtcclxuICAgICAgICBzeW5jVmVyc2lvbi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICAgICAgLy8gRm9yY2UgdG8gc2F2ZSwgZXZlbiBpZiB0aGVyZSB3YXMgcmVtb3RlIHVwZGF0ZXNcclxuICAgICAgICBzeW5jVmVyc2lvbi5wdXNoKHsgZXZlbklmT2Jzb2xldGU6IHRydWUgfSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLnJlc2V0ID0gZnVuY3Rpb24gcmVzZXQoKSB7XHJcbiAgICAgICAgY2FsZW5kYXJTeW5jaW5nLnJlc2V0RXhwb3J0VXJsKCk7XHJcbiAgICB9O1xyXG59XHJcbiIsIi8qKlxuICAgIENsaWVudEVkaXRpb24gYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBDbGllbnRFZGl0aW9uQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ2NsaWVudHMnKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG52YXIgQ2xpZW50ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0NsaWVudCcpO1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgXG4gICAgdGhpcy5jbGllbnQgPSBrby5vYnNlcnZhYmxlKG5ldyBDbGllbnQoKSk7XG4gICAgXG4gICAgdGhpcy5oZWFkZXIgPSBrby5vYnNlcnZhYmxlKCdFZGl0IExvY2F0aW9uJyk7XG4gICAgXG4gICAgLy8gVE9ET1xuICAgIHRoaXMuc2F2ZSA9IGZ1bmN0aW9uKCkge307XG4gICAgdGhpcy5jYW5jZWwgPSBmdW5jdGlvbigpIHt9O1xufVxuIiwiLyoqXHJcbiAgICBjbGllbnRzIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XHJcblxyXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gQ2xpZW50c0FjdGl2aXR5KCkge1xyXG4gICAgXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTsgICAgXHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ0NsaWVudHMnKTtcclxuICAgIFxyXG4gICAgLy8gR2V0dGluZyBlbGVtZW50c1xyXG4gICAgdGhpcy4kaW5kZXggPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjY2xpZW50c0luZGV4Jyk7XHJcbiAgICB0aGlzLiRsaXN0VmlldyA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNjbGllbnRzTGlzdFZpZXcnKTtcclxuICAgIFxyXG4gICAgLy8gVGVzdGluZ0RhdGFcclxuICAgIHRoaXMudmlld01vZGVsLmNsaWVudHMocmVxdWlyZSgnLi4vdGVzdGRhdGEvY2xpZW50cycpLmNsaWVudHMpO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyIHRvIHVwZGF0ZSBoZWFkZXIgYmFzZWQgb24gYSBtb2RlIGNoYW5nZTpcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLmlzU2VsZWN0aW9uTW9kZSxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbiAoaXRJcykge1xyXG4gICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5oZWFkZXJUZXh0KGl0SXMgPyAnU2VsZWN0IGEgY2xpZW50JyA6ICcnKTtcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEhhbmRsZXIgdG8gZ28gYmFjayB3aXRoIHRoZSBzZWxlY3RlZCBjbGllbnQgd2hlbiBcclxuICAgIC8vIHRoZXJlIGlzIG9uZSBzZWxlY3RlZCBhbmQgcmVxdWVzdERhdGEgaXMgZm9yXHJcbiAgICAvLyAnc2VsZWN0IG1vZGUnXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZENsaWVudCxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbiAodGhlU2VsZWN0ZWRDbGllbnQpIHtcclxuICAgICAgICAgICAgLy8gV2UgaGF2ZSBhIHJlcXVlc3QgYW5kXHJcbiAgICAgICAgICAgIC8vIGl0IHJlcXVlc3RlZCB0byBzZWxlY3QgYSBjbGllbnQsXHJcbiAgICAgICAgICAgIC8vIGFuZCBhIHNlbGVjdGVkIGNsaWVudFxyXG4gICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0RGF0YSAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RGF0YS5zZWxlY3RDbGllbnQgPT09IHRydWUgJiZcclxuICAgICAgICAgICAgICAgIHRoZVNlbGVjdGVkQ2xpZW50KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUGFzcyB0aGUgc2VsZWN0ZWQgY2xpZW50IGluIHRoZSBpbmZvXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3REYXRhLnNlbGVjdGVkQ2xpZW50ID0gdGhlU2VsZWN0ZWRDbGllbnQ7XHJcbiAgICAgICAgICAgICAgICAvLyBBbmQgZ28gYmFja1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ29CYWNrKHRoaXMucmVxdWVzdERhdGEpO1xyXG4gICAgICAgICAgICAgICAgLy8gTGFzdCwgY2xlYXIgcmVxdWVzdERhdGFcclxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdERhdGEgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gVE9ETzogY2hlY2sgZXJyb3JzIGZyb20gbG9hZGluZywgd2lsbCBiZSBSZW1vdGVNb2RlbD8/XHJcbiAgICAvKnRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMuYXBwLm1vZGVsLmNsaWVudHMsXHJcbiAgICAgICAgZXZlbnQ6ICdlcnJvcicsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgIGlmIChlcnIudGFzayA9PT0gJ3NhdmUnKSByZXR1cm47XHJcbiAgICAgICAgICAgIHZhciBtc2cgPSAnRXJyb3IgbG9hZGluZyBjbGllbnRzLic7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLm1vZGFscy5zaG93RXJyb3Ioe1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IG1zZyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnIgJiYgZXJyLnRhc2sgJiYgZXJyLmVycm9yIHx8IGVyclxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pOyovXHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xyXG4gICAgXHJcbiAgICAvLyBPbiBldmVyeSBzaG93LCBzZWFyY2ggZ2V0cyByZXNldGVkXHJcbiAgICB0aGlzLnZpZXdNb2RlbC5zZWFyY2hUZXh0KCcnKTtcclxuICAgIFxyXG4gICAgLy8gU2V0IHNlbGVjdGlvbjpcclxuICAgIHRoaXMudmlld01vZGVsLmlzU2VsZWN0aW9uTW9kZShzdGF0ZS5zZWxlY3RDbGllbnQgPT09IHRydWUpO1xyXG4gICAgXHJcbiAgICAvLyBLZWVwIGRhdGEgdXBkYXRlZDpcclxuICAgIC8vIFRPRE86IGFzIFJlbW90ZU1vZGVsP1xyXG4gICAgLy90aGlzLmFwcC5tb2RlbC5jbGllbnRzLnN5bmMoKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcclxuXHJcbiAgICB0aGlzLmhlYWRlclRleHQgPSBrby5vYnNlcnZhYmxlKCcnKTtcclxuXHJcbiAgICAvLyBFc3BlY2lhbCBtb2RlIHdoZW4gaW5zdGVhZCBvZiBwaWNrIGFuZCBlZGl0IHdlIGFyZSBqdXN0IHNlbGVjdGluZ1xyXG4gICAgLy8gKHdoZW4gZWRpdGluZyBhbiBhcHBvaW50bWVudClcclxuICAgIHRoaXMuaXNTZWxlY3Rpb25Nb2RlID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcblxyXG4gICAgLy8gRnVsbCBsaXN0IG9mIGNsaWVudHNcclxuICAgIHRoaXMuY2xpZW50cyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcbiAgICBcclxuICAgIC8vIFNlYXJjaCB0ZXh0LCB1c2VkIHRvIGZpbHRlciAnY2xpZW50cydcclxuICAgIHRoaXMuc2VhcmNoVGV4dCA9IGtvLm9ic2VydmFibGUoJycpO1xyXG4gICAgXHJcbiAgICAvLyBVdGlsaXR5IHRvIGdldCBhIGZpbHRlcmVkIGxpc3Qgb2YgY2xpZW50cyBiYXNlZCBvbiBjbGllbnRzXHJcbiAgICB0aGlzLmdldEZpbHRlcmVkTGlzdCA9IGZ1bmN0aW9uIGdldEZpbHRlcmVkTGlzdCgpIHtcclxuICAgICAgICB2YXIgcyA9ICh0aGlzLnNlYXJjaFRleHQoKSB8fCAnJykudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50cygpLmZpbHRlcihmdW5jdGlvbihjbGllbnQpIHtcclxuICAgICAgICAgICAgdmFyIG4gPSBjbGllbnQgJiYgY2xpZW50LmZ1bGxOYW1lKCkgfHwgJyc7XHJcbiAgICAgICAgICAgIG4gPSBuLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIHJldHVybiBuLmluZGV4T2YocykgPiAtMTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gRmlsdGVyZWQgbGlzdCBvZiBjbGllbnRzXHJcbiAgICB0aGlzLmZpbHRlcmVkQ2xpZW50cyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldEZpbHRlcmVkTGlzdCgpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIC8vIEdyb3VwZWQgbGlzdCBvZiBmaWx0ZXJlZCBjbGllbnRzXHJcbiAgICB0aGlzLmdyb3VwZWRDbGllbnRzID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgdmFyIGNsaWVudHMgPSB0aGlzLmZpbHRlcmVkQ2xpZW50cygpLnNvcnQoZnVuY3Rpb24oY2xpZW50QSwgY2xpZW50Qikge1xyXG4gICAgICAgICAgICByZXR1cm4gY2xpZW50QS5maXJzdE5hbWUoKSA+IGNsaWVudEIuZmlyc3ROYW1lKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGdyb3VwcyA9IFtdLFxyXG4gICAgICAgICAgICBsYXRlc3RHcm91cCA9IG51bGwsXHJcbiAgICAgICAgICAgIGxhdGVzdExldHRlciA9IG51bGw7XHJcblxyXG4gICAgICAgIGNsaWVudHMuZm9yRWFjaChmdW5jdGlvbihjbGllbnQpIHtcclxuICAgICAgICAgICAgdmFyIGxldHRlciA9IChjbGllbnQuZmlyc3ROYW1lKClbMF0gfHwgJycpLnRvVXBwZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIGlmIChsZXR0ZXIgIT09IGxhdGVzdExldHRlcikge1xyXG4gICAgICAgICAgICAgICAgbGF0ZXN0R3JvdXAgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0dGVyOiBsZXR0ZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgY2xpZW50czogW2NsaWVudF1cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBncm91cHMucHVzaChsYXRlc3RHcm91cCk7XHJcbiAgICAgICAgICAgICAgICBsYXRlc3RMZXR0ZXIgPSBsZXR0ZXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsYXRlc3RHcm91cC5jbGllbnRzLnB1c2goY2xpZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gZ3JvdXBzO1xyXG5cclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlbGVjdGVkQ2xpZW50ID0ga28ub2JzZXJ2YWJsZShudWxsKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZWxlY3RDbGllbnQgPSBmdW5jdGlvbihzZWxlY3RlZENsaWVudCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRDbGllbnQoc2VsZWN0ZWRDbGllbnQpO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG59XHJcbiIsIi8qKlxuICAgIENNUyBhY3Rpdml0eVxuICAgIChDbGllbnQgTWFuYWdlbWVudCBTeXN0ZW0pXG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIENtc0FjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKCdDbGllbnQgbWFuYWdlbWVudCcpO1xuICAgIFxuICAgIC8vIEtlZXAgY2xpZW50c0NvdW50IHVwZGF0ZWRcbiAgICAvLyBUT0RPIHRoaXMuYXBwLm1vZGVsLmNsaWVudHNcbiAgICB2YXIgY2xpZW50cyA9IGtvLm9ic2VydmFibGVBcnJheShyZXF1aXJlKCcuLi90ZXN0ZGF0YS9jbGllbnRzJykuY2xpZW50cyk7XG4gICAgdGhpcy52aWV3TW9kZWwuY2xpZW50c0NvdW50KGNsaWVudHMoKS5sZW5ndGgpO1xuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcbiAgICAgICAgdGFyZ2V0OiBjbGllbnRzLFxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmNsaWVudHNDb3VudChjbGllbnRzKCkubGVuZ3RoKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgfSk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgXG4gICAgdGhpcy5jbGllbnRzQ291bnQgPSBrby5vYnNlcnZhYmxlKCk7XG59XG4iLCIvKipcbiAgICBDb250YWN0Rm9ybSBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIENvbnRhY3RGb3JtQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ1RhbGsgdG8gdXMnKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgXG4gICAgdGhpcy5tZXNzYWdlID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgdGhpcy53YXNTZW50ID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG5cbiAgICB2YXIgdXBkYXRlV2FzU2VudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLndhc1NlbnQoZmFsc2UpO1xuICAgIH0uYmluZCh0aGlzKTtcbiAgICB0aGlzLm1lc3NhZ2Uuc3Vic2NyaWJlKHVwZGF0ZVdhc1NlbnQpO1xuICAgIFxuICAgIHRoaXMuc2VuZCA9IGZ1bmN0aW9uIHNlbmQoKSB7XG4gICAgICAgIC8vIFRPRE86IFNlbmRcbiAgICAgICAgXG4gICAgICAgIC8vIFJlc2V0IGFmdGVyIGJlaW5nIHNlbnRcbiAgICAgICAgdGhpcy5tZXNzYWdlKCcnKTtcbiAgICAgICAgdGhpcy53YXNTZW50KHRydWUpO1xuXG4gICAgfS5iaW5kKHRoaXMpO1xufVxuIiwiLyoqXHJcbiAgICBDb250YWN0SW5mbyBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIENvbnRhY3RJbmZvQWN0aXZpdHkoKSB7XHJcbiAgICBcclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblxyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xyXG4gICAgXHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ093bmVyIGluZm9ybWF0aW9uJyk7XHJcbiAgICBcclxuICAgIC8vIFVwZGF0ZSBuYXZCYXIgZm9yIG9uYm9hcmRpbmcgbW9kZSB3aGVuIHRoZSBvbmJvYXJkaW5nU3RlcFxyXG4gICAgLy8gaW4gdGhlIGN1cnJlbnQgbW9kZWwgY2hhbmdlczpcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLnByb2ZpbGUub25ib2FyZGluZ1N0ZXAsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24gKHN0ZXApIHtcclxuICAgICAgICAgICAgaWYgKHN0ZXApIHtcclxuICAgICAgICAgICAgICAgIC8vIFRPRE8gU2V0IG5hdmJhciBzdGVwIGluZGV4XHJcbiAgICAgICAgICAgICAgICAvLyBTZXR0aW5nIG5hdmJhciBmb3IgT25ib2FyZGluZy93aXphcmQgbW9kZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5uYXZCYXIubGVmdEFjdGlvbigpLnRleHQoJycpO1xyXG4gICAgICAgICAgICAgICAgLy8gU2V0dGluZyBoZWFkZXJcclxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmhlYWRlclRleHQoJ0hvdyBjYW4gd2UgcmVhY2ggeW91PycpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuYnV0dG9uVGV4dCgnU2F2ZSBhbmQgY29udGludWUnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIFRPRE8gUmVtb3ZlIHN0ZXAgaW5kZXhcclxuICAgICAgICAgICAgICAgIC8vIFNldHRpbmcgbmF2YmFyIHRvIGRlZmF1bHRcclxuICAgICAgICAgICAgICAgIHRoaXMubmF2QmFyLmxlZnRBY3Rpb24oKS50ZXh0KCdBY2NvdW50Jyk7XHJcbiAgICAgICAgICAgICAgICAvLyBTZXR0aW5nIGhlYWRlciB0byBkZWZhdWx0XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5oZWFkZXJUZXh0KCdDb250YWN0IGluZm9ybWF0aW9uJyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5idXR0b25UZXh0KCdTYXZlJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG4gICAgLy90aGlzLnZpZXdNb2RlbC5wcm9maWxlLm9uYm9hcmRpbmdTdGVwLnN1YnNjcmliZSgpO1xyXG4gICAgXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLmFwcC5tb2RlbC51c2VyUHJvZmlsZSxcclxuICAgICAgICBldmVudDogJ2Vycm9yJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgdmFyIG1zZyA9IGVyci50YXNrID09PSAnc2F2ZScgPyAnRXJyb3Igc2F2aW5nIGNvbnRhY3QgZGF0YS4nIDogJ0Vycm9yIGxvYWRpbmcgY29udGFjdCBkYXRhLic7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLm1vZGFscy5zaG93RXJyb3Ioe1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IG1zZyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnIgJiYgZXJyLnRhc2sgJiYgZXJyLmVycm9yIHx8IGVyclxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLmFwcC5tb2RlbC5ob21lQWRkcmVzcyxcclxuICAgICAgICBldmVudDogJ2Vycm9yJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgdmFyIG1zZyA9IGVyci50YXNrID09PSAnc2F2ZScgPyAnRXJyb3Igc2F2aW5nIGFkZHJlc3MgZGV0YWlscy4nIDogJ0Vycm9yIGxvYWRpbmcgYWRkcmVzcyBkZXRhaWxzLic7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLm1vZGFscy5zaG93RXJyb3Ioe1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IG1zZyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnIgJiYgZXJyLnRhc2sgJiYgZXJyLmVycm9yIHx8IGVyclxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG59KTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcclxuXHJcbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KHN0YXRlKSB7XHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcclxuICAgIFxyXG4gICAgLy8gRGlzY2FyZCBhbnkgcHJldmlvdXMgdW5zYXZlZCBlZGl0XHJcbiAgICB0aGlzLnZpZXdNb2RlbC5kaXNjYXJkKCk7XHJcbiAgICBcclxuICAgIC8vIEtlZXAgZGF0YSB1cGRhdGVkOlxyXG4gICAgdGhpcy5hcHAubW9kZWwudXNlclByb2ZpbGUuc3luYygpO1xyXG4gICAgdGhpcy5hcHAubW9kZWwuaG9tZUFkZHJlc3Muc3luYygpO1xyXG59O1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbChhcHApIHtcclxuXHJcbiAgICB0aGlzLmhlYWRlclRleHQgPSBrby5vYnNlcnZhYmxlKCdDb250YWN0IGluZm9ybWF0aW9uJyk7XHJcbiAgICB0aGlzLmJ1dHRvblRleHQgPSBrby5vYnNlcnZhYmxlKCdTYXZlJyk7XHJcbiAgICBcclxuICAgIC8vIFVzZXIgUHJvZmlsZVxyXG4gICAgdmFyIHVzZXJQcm9maWxlID0gYXBwLm1vZGVsLnVzZXJQcm9maWxlO1xyXG4gICAgdmFyIHByb2ZpbGVWZXJzaW9uID0gdXNlclByb2ZpbGUubmV3VmVyc2lvbigpO1xyXG4gICAgcHJvZmlsZVZlcnNpb24uaXNPYnNvbGV0ZS5zdWJzY3JpYmUoZnVuY3Rpb24oaXRJcykge1xyXG4gICAgICAgIGlmIChpdElzKSB7XHJcbiAgICAgICAgICAgIC8vIG5ldyB2ZXJzaW9uIGZyb20gc2VydmVyIHdoaWxlIGVkaXRpbmdcclxuICAgICAgICAgICAgLy8gRlVUVVJFOiB3YXJuIGFib3V0IGEgbmV3IHJlbW90ZSB2ZXJzaW9uIGFza2luZ1xyXG4gICAgICAgICAgICAvLyBjb25maXJtYXRpb24gdG8gbG9hZCB0aGVtIG9yIGRpc2NhcmQgYW5kIG92ZXJ3cml0ZSB0aGVtO1xyXG4gICAgICAgICAgICAvLyB0aGUgc2FtZSBpcyBuZWVkIG9uIHNhdmUoKSwgYW5kIG9uIHNlcnZlciByZXNwb25zZVxyXG4gICAgICAgICAgICAvLyB3aXRoIGEgNTA5OkNvbmZsaWN0IHN0YXR1cyAoaXRzIGJvZHkgbXVzdCBjb250YWluIHRoZVxyXG4gICAgICAgICAgICAvLyBzZXJ2ZXIgdmVyc2lvbikuXHJcbiAgICAgICAgICAgIC8vIFJpZ2h0IG5vdywganVzdCBvdmVyd3JpdGUgY3VycmVudCBjaGFuZ2VzIHdpdGhcclxuICAgICAgICAgICAgLy8gcmVtb3RlIG9uZXM6XHJcbiAgICAgICAgICAgIHByb2ZpbGVWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gQWN0dWFsIGRhdGEgZm9yIHRoZSBmb3JtOlxyXG4gICAgdGhpcy5wcm9maWxlID0gcHJvZmlsZVZlcnNpb24udmVyc2lvbjtcclxuICAgIFxyXG4gICAgLy8gVE9ETyBsMTBuXHJcbiAgICB0aGlzLm1vbnRocyA9IGtvLm9ic2VydmFibGVBcnJheShbXHJcbiAgICAgICAgeyBpZDogMSwgbmFtZTogJ0phbnVhcnknfSxcclxuICAgICAgICB7IGlkOiAyLCBuYW1lOiAnRmVicnVhcnknfSxcclxuICAgICAgICB7IGlkOiAzLCBuYW1lOiAnTWFyY2gnfSxcclxuICAgICAgICB7IGlkOiA0LCBuYW1lOiAnQXByaWwnfSxcclxuICAgICAgICB7IGlkOiA1LCBuYW1lOiAnTWF5J30sXHJcbiAgICAgICAgeyBpZDogNiwgbmFtZTogJ0p1bmUnfSxcclxuICAgICAgICB7IGlkOiA3LCBuYW1lOiAnSnVseSd9LFxyXG4gICAgICAgIHsgaWQ6IDgsIG5hbWU6ICdBdWd1c3QnfSxcclxuICAgICAgICB7IGlkOiA5LCBuYW1lOiAnU2VwdGVtYmVyJ30sXHJcbiAgICAgICAgeyBpZDogMTAsIG5hbWU6ICdPY3RvYmVyJ30sXHJcbiAgICAgICAgeyBpZDogMTEsIG5hbWU6ICdOb3ZlbWJlcid9LFxyXG4gICAgICAgIHsgaWQ6IDEyLCBuYW1lOiAnRGVjZW1iZXInfVxyXG4gICAgXSk7XHJcbiAgICAvLyBXZSBuZWVkIHRvIHVzZSBhIHNwZWNpYWwgb2JzZXJ2YWJsZSBpbiB0aGUgZm9ybSwgdGhhdCB3aWxsXHJcbiAgICAvLyB1cGRhdGUgdGhlIGJhY2stZW5kIHByb2ZpbGUuYmlydGhNb250aFxyXG4gICAgdGhpcy5zZWxlY3RlZEJpcnRoTW9udGggPSBrby5jb21wdXRlZCh7XHJcbiAgICAgICAgcmVhZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBiaXJ0aE1vbnRoID0gdGhpcy5wcm9maWxlLmJpcnRoTW9udGgoKTtcclxuICAgICAgICAgICAgcmV0dXJuIGJpcnRoTW9udGggPyB0aGlzLm1vbnRocygpW2JpcnRoTW9udGggLSAxXSA6IG51bGw7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB3cml0ZTogZnVuY3Rpb24obW9udGgpIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9maWxlLmJpcnRoTW9udGgobW9udGggJiYgbW9udGguaWQgfHwgbnVsbCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvd25lcjogdGhpc1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMubW9udGhEYXlzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcclxuICAgIGZvciAodmFyIGlkYXkgPSAxOyBpZGF5IDw9IDMxOyBpZGF5KyspIHtcclxuICAgICAgICB0aGlzLm1vbnRoRGF5cy5wdXNoKGlkYXkpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBIb21lIEFkZHJlc3NcclxuICAgIHZhciBob21lQWRkcmVzcyA9IGFwcC5tb2RlbC5ob21lQWRkcmVzcztcclxuICAgIHZhciBob21lQWRkcmVzc1ZlcnNpb24gPSBob21lQWRkcmVzcy5uZXdWZXJzaW9uKCk7XHJcbiAgICBob21lQWRkcmVzc1ZlcnNpb24uaXNPYnNvbGV0ZS5zdWJzY3JpYmUoZnVuY3Rpb24oaXRJcykge1xyXG4gICAgICAgIGlmIChpdElzKSB7XHJcbiAgICAgICAgICAgIC8vIG5ldyB2ZXJzaW9uIGZyb20gc2VydmVyIHdoaWxlIGVkaXRpbmdcclxuICAgICAgICAgICAgLy8gRlVUVVJFOiB3YXJuIGFib3V0IGEgbmV3IHJlbW90ZSB2ZXJzaW9uIGFza2luZ1xyXG4gICAgICAgICAgICAvLyBjb25maXJtYXRpb24gdG8gbG9hZCB0aGVtIG9yIGRpc2NhcmQgYW5kIG92ZXJ3cml0ZSB0aGVtO1xyXG4gICAgICAgICAgICAvLyB0aGUgc2FtZSBpcyBuZWVkIG9uIHNhdmUoKSwgYW5kIG9uIHNlcnZlciByZXNwb25zZVxyXG4gICAgICAgICAgICAvLyB3aXRoIGEgNTA5OkNvbmZsaWN0IHN0YXR1cyAoaXRzIGJvZHkgbXVzdCBjb250YWluIHRoZVxyXG4gICAgICAgICAgICAvLyBzZXJ2ZXIgdmVyc2lvbikuXHJcbiAgICAgICAgICAgIC8vIFJpZ2h0IG5vdywganVzdCBvdmVyd3JpdGUgY3VycmVudCBjaGFuZ2VzIHdpdGhcclxuICAgICAgICAgICAgLy8gcmVtb3RlIG9uZXM6XHJcbiAgICAgICAgICAgIGhvbWVBZGRyZXNzVmVyc2lvbi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEFjdHVhbCBkYXRhIGZvciB0aGUgZm9ybTpcclxuICAgIHRoaXMuYWRkcmVzcyA9IGhvbWVBZGRyZXNzVmVyc2lvbi52ZXJzaW9uO1xyXG5cclxuICAgIC8vIENvbnRyb2wgb2JzZXJ2YWJsZXM6IHNwZWNpYWwgYmVjYXVzZSBtdXN0IGEgbWl4XHJcbiAgICAvLyBvZiB0aGUgYm90aCByZW1vdGUgbW9kZWxzIHVzZWQgaW4gdGhpcyB2aWV3bW9kZWxcclxuICAgIHRoaXMuaXNMb2NrZWQgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdXNlclByb2ZpbGUuaXNMb2NrZWQoKSB8fCBob21lQWRkcmVzcy5pc0xvY2tlZCgpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICB0aGlzLmlzTG9hZGluZyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB1c2VyUHJvZmlsZS5pc0xvYWRpbmcoKSB8fCBob21lQWRkcmVzcy5pc0xvYWRpbmcoKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgdGhpcy5pc1NhdmluZyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB1c2VyUHJvZmlsZS5pc1NhdmluZygpIHx8IGhvbWVBZGRyZXNzLmlzU2F2aW5nKCk7XHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLnN1Ym1pdFRleHQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcoKSA/IFxyXG4gICAgICAgICAgICAgICAgJ2xvYWRpbmcuLi4nIDogXHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzU2F2aW5nKCkgPyBcclxuICAgICAgICAgICAgICAgICAgICAnc2F2aW5nLi4uJyA6IFxyXG4gICAgICAgICAgICAgICAgICAgICdTYXZlJ1xyXG4gICAgICAgICk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgLy8gQWN0aW9uc1xyXG5cclxuICAgIHRoaXMuZGlzY2FyZCA9IGZ1bmN0aW9uIGRpc2NhcmQoKSB7XHJcbiAgICAgICAgcHJvZmlsZVZlcnNpb24ucHVsbCh7IGV2ZW5JZk5ld2VyOiB0cnVlIH0pO1xyXG4gICAgICAgIGhvbWVBZGRyZXNzVmVyc2lvbi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcblxyXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgICAgICAvLyBGb3JjZSB0byBzYXZlLCBldmVuIGlmIHRoZXJlIHdhcyByZW1vdGUgdXBkYXRlc1xyXG4gICAgICAgIHByb2ZpbGVWZXJzaW9uLnB1c2goeyBldmVuSWZPYnNvbGV0ZTogdHJ1ZSB9KTtcclxuICAgICAgICBob21lQWRkcmVzc1ZlcnNpb24ucHVzaCh7IGV2ZW5JZk9ic29sZXRlOiB0cnVlIH0pO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG59XHJcbiIsIi8qKlxuICAgIENvbnZlcnNhdGlvbiBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIENvbnZlcnNhdGlvbkFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdJbmJveCcpO1xuICAgIFxuICAgIC8vIFRlc3RpbmdEYXRhXG4gICAgc2V0U29tZVRlc3RpbmdEYXRhKHRoaXMudmlld01vZGVsKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KHN0YXRlKSB7XG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBzdGF0ZSk7XG4gICAgXG4gICAgaWYgKHN0YXRlICYmIHN0YXRlLnJvdXRlICYmIHN0YXRlLnJvdXRlLnNlZ21lbnRzKSB7XG4gICAgICAgIHRoaXMudmlld01vZGVsLmNvbnZlcnNhdGlvbklEKHBhcnNlSW50KHN0YXRlLnJvdXRlLnNlZ21lbnRzWzBdLCAxMCkgfHwgMCk7XG4gICAgfVxufTtcblxudmFyIE1haWxGb2xkZXIgPSByZXF1aXJlKCcuLi9tb2RlbHMvTWFpbEZvbGRlcicpO1xudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG4gICAgdGhpcy5pbmJveCA9IG5ldyBNYWlsRm9sZGVyKHtcbiAgICAgICAgdG9wTnVtYmVyOiAyMFxuICAgIH0pO1xuICAgIFxuICAgIHRoaXMuY29udmVyc2F0aW9uSUQgPSBrby5vYnNlcnZhYmxlKG51bGwpO1xuICAgIFxuICAgIHRoaXMuY29udmVyc2F0aW9uID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29uSUQgPSB0aGlzLmNvbnZlcnNhdGlvbklEKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmluYm94Lm1lc3NhZ2VzKCkuZmlsdGVyKGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICAgIHJldHVybiB2ICYmIHYuaWQoKSA9PT0gY29uSUQ7XG4gICAgICAgIH0pO1xuICAgIH0sIHRoaXMpO1xuICAgIFxuICAgIHRoaXMuc3ViamVjdCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG0gPSB0aGlzLmNvbnZlcnNhdGlvbigpWzBdO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgbSA/XG4gICAgICAgICAgICBtLnN1YmplY3QoKSA6XG4gICAgICAgICAgICAnQ29udmVyc2F0aW9uIHcvbyBzdWJqZWN0J1xuICAgICAgICApO1xuICAgICAgICBcbiAgICB9LCB0aGlzKTtcbn1cblxuLyoqIFRFU1RJTkcgREFUQSAqKi9cbmZ1bmN0aW9uIHNldFNvbWVUZXN0aW5nRGF0YSh2aWV3TW9kZWwpIHtcbiAgICBcbiAgICB2aWV3TW9kZWwuaW5ib3gubWVzc2FnZXMocmVxdWlyZSgnLi4vdGVzdGRhdGEvbWVzc2FnZXMnKS5tZXNzYWdlcyk7XG59XG4iLCIvKipcclxuICAgIGRhdGV0aW1lUGlja2VyIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xyXG5yZXF1aXJlKCcuLi9jb21wb25lbnRzL0RhdGVQaWNrZXInKTtcclxuXHJcbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcclxuXHJcbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBEYXRldGltZVBpY2tlckFjdGl2aXR5KCkge1xyXG4gICAgXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcclxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignJyk7XHJcbiAgICBcclxuICAgIC8vIEdldHRpbmcgZWxlbWVudHNcclxuICAgIHRoaXMuJGRhdGVQaWNrZXIgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjZGF0ZXRpbWVQaWNrZXJEYXRlUGlja2VyJyk7XHJcbiAgICB0aGlzLiR0aW1lUGlja2VyID0gdGhpcy4kYWN0aXZpdHkuZmluZCgnI2RhdGV0aW1lUGlja2VyVGltZVBpY2tlcicpO1xyXG4gICAgXHJcbiAgICAvKiBJbml0IGNvbXBvbmVudHMgKi9cclxuICAgIHRoaXMuJGRhdGVQaWNrZXIuc2hvdygpLmRhdGVwaWNrZXIoKTtcclxuICAgIFxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy4kZGF0ZVBpY2tlcixcclxuICAgICAgICBldmVudDogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgaWYgKGUudmlld01vZGUgPT09ICdkYXlzJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuc2VsZWN0ZWREYXRlKGUuZGF0ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZERhdGUsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oZGF0ZSkge1xyXG4gICAgICAgICAgICB0aGlzLmJpbmREYXRlRGF0YShkYXRlKTtcclxuICAgICAgICB9LmJpbmQodGhpcylcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyIHRvIGdvIGJhY2sgd2l0aCB0aGUgc2VsZWN0ZWQgZGF0ZS10aW1lIHdoZW5cclxuICAgIC8vIHRoYXQgc2VsZWN0aW9uIGlzIGRvbmUgKGNvdWxkIGJlIHRvIG51bGwpXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZERhdGV0aW1lLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uIChkYXRldGltZSkge1xyXG4gICAgICAgICAgICAvLyBXZSBoYXZlIGEgcmVxdWVzdFxyXG4gICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0RGF0YSkge1xyXG4gICAgICAgICAgICAgICAgLy8gUGFzcyB0aGUgc2VsZWN0ZWQgZGF0ZXRpbWUgaW4gdGhlIGluZm9cclxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdERhdGEuc2VsZWN0ZWREYXRldGltZSA9IGRhdGV0aW1lO1xyXG4gICAgICAgICAgICAgICAgLy8gQW5kIGdvIGJhY2tcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvQmFjayh0aGlzLnJlcXVlc3REYXRhKTtcclxuICAgICAgICAgICAgICAgIC8vIExhc3QsIGNsZWFyIHJlcXVlc3REYXRhXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3REYXRhID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIFRlc3RpbmdEYXRhXHJcbiAgICB0aGlzLnZpZXdNb2RlbC5zbG90c0RhdGEgPSByZXF1aXJlKCcuLi90ZXN0ZGF0YS90aW1lU2xvdHMnKS50aW1lU2xvdHM7XHJcbiAgICBcclxuICAgIHRoaXMuYmluZERhdGVEYXRhKG5ldyBEYXRlKCkpO1xyXG59KTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcclxuXHJcbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KHN0YXRlKSB7XHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcclxuXHJcbiAgICAvLyBUT0RPOiB0ZXh0IGZyb20gb3V0c2lkZSBvciBkZXBlbmRpbmcgb24gc3RhdGU/XHJcbiAgICB0aGlzLnZpZXdNb2RlbC5oZWFkZXJUZXh0KCdTZWxlY3QgYSBzdGFydCB0aW1lJyk7XHJcbn07XHJcblxyXG5BLnByb3RvdHlwZS5iaW5kRGF0ZURhdGEgPSBmdW5jdGlvbiBiaW5kRGF0ZURhdGEoZGF0ZSkge1xyXG5cclxuICAgIHZhciBzZGF0ZSA9IG1vbWVudChkYXRlKS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcclxuICAgIHZhciBzbG90c0RhdGEgPSB0aGlzLnZpZXdNb2RlbC5zbG90c0RhdGE7XHJcblxyXG4gICAgaWYgKHNsb3RzRGF0YS5oYXNPd25Qcm9wZXJ0eShzZGF0ZSkpIHtcclxuICAgICAgICB0aGlzLnZpZXdNb2RlbC5zbG90cyhzbG90c0RhdGFbc2RhdGVdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy52aWV3TW9kZWwuc2xvdHMoc2xvdHNEYXRhWydkZWZhdWx0J10pO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJ1NlbGVjdCBhIHRpbWUnKTtcclxuICAgIHRoaXMuc2VsZWN0ZWREYXRlID0ga28ub2JzZXJ2YWJsZShuZXcgRGF0ZSgpKTtcclxuICAgIHRoaXMuc2xvdHNEYXRhID0ge307XHJcbiAgICB0aGlzLnNsb3RzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcclxuICAgIHRoaXMuZ3JvdXBlZFNsb3RzID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuICAgICAgICAvKlxyXG4gICAgICAgICAgYmVmb3JlIDEyOjAwcG0gKG5vb24pID0gbW9ybmluZ1xyXG4gICAgICAgICAgYWZ0ZXJub29uOiAxMjowMHBtIHVudGlsIDU6MDBwbVxyXG4gICAgICAgICAgZXZlbmluZzogNTowMHBtIC0gMTE6NTlwbVxyXG4gICAgICAgICovXHJcbiAgICAgICAgLy8gU2luY2Ugc2xvdHMgbXVzdCBiZSBmb3IgdGhlIHNhbWUgZGF0ZSxcclxuICAgICAgICAvLyB0byBkZWZpbmUgdGhlIGdyb3VwcyByYW5nZXMgdXNlIHRoZSBmaXJzdCBkYXRlXHJcbiAgICAgICAgdmFyIGRhdGVQYXJ0ID0gdGhpcy5zbG90cygpICYmIHRoaXMuc2xvdHMoKVswXSB8fCBuZXcgRGF0ZSgpO1xyXG4gICAgICAgIHZhciBncm91cHMgPSBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGdyb3VwOiAnTW9ybmluZycsXHJcbiAgICAgICAgICAgICAgICBzbG90czogW10sXHJcbiAgICAgICAgICAgICAgICBzdGFydHM6IG5ldyBUaW1lKGRhdGVQYXJ0LCAwLCAwKSxcclxuICAgICAgICAgICAgICAgIGVuZHM6IG5ldyBUaW1lKGRhdGVQYXJ0LCAxMiwgMClcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZ3JvdXA6ICdBZnRlcm5vb24nLFxyXG4gICAgICAgICAgICAgICAgc2xvdHM6IFtdLFxyXG4gICAgICAgICAgICAgICAgc3RhcnRzOiBuZXcgVGltZShkYXRlUGFydCwgMTIsIDApLFxyXG4gICAgICAgICAgICAgICAgZW5kczogbmV3IFRpbWUoZGF0ZVBhcnQsIDE3LCAwKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBncm91cDogJ0V2ZW5pbmcnLFxyXG4gICAgICAgICAgICAgICAgc2xvdHM6IFtdLFxyXG4gICAgICAgICAgICAgICAgc3RhcnRzOiBuZXcgVGltZShkYXRlUGFydCwgMTcsIDApLFxyXG4gICAgICAgICAgICAgICAgZW5kczogbmV3IFRpbWUoZGF0ZVBhcnQsIDI0LCAwKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXTtcclxuICAgICAgICB2YXIgc2xvdHMgPSB0aGlzLnNsb3RzKCkuc29ydCgpO1xyXG4gICAgICAgIHNsb3RzLmZvckVhY2goZnVuY3Rpb24oc2xvdCkge1xyXG4gICAgICAgICAgICBncm91cHMuZm9yRWFjaChmdW5jdGlvbihncm91cCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNsb3QgPj0gZ3JvdXAuc3RhcnRzICYmXHJcbiAgICAgICAgICAgICAgICAgICAgc2xvdCA8IGdyb3VwLmVuZHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBncm91cC5zbG90cy5wdXNoKHNsb3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdyb3VwcztcclxuXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZWxlY3RlZERhdGV0aW1lID0ga28ub2JzZXJ2YWJsZShudWxsKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZWxlY3REYXRldGltZSA9IGZ1bmN0aW9uKHNlbGVjdGVkRGF0ZXRpbWUpIHtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnNlbGVjdGVkRGF0ZXRpbWUoc2VsZWN0ZWREYXRldGltZSk7XHJcblxyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG5cclxufVxyXG4iLCIvKipcbiAgICBGYXFzIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gRmFxc0FjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdUYWxrIHRvIHVzJyk7XG4gICAgXG4gICAgLy8gVGVzdGluZ0RhdGFcbiAgICBzZXRTb21lVGVzdGluZ0RhdGEodGhpcy52aWV3TW9kZWwpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbC5zZWFyY2hUZXh0KCcnKTtcbn07XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcblxuICAgIHRoaXMuZmFxcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XG4gICAgdGhpcy5zZWFyY2hUZXh0ID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgXG4gICAgdGhpcy5maWx0ZXJlZEZhcXMgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzID0gdGhpcy5zZWFyY2hUZXh0KCkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmFxcygpLmZpbHRlcihmdW5jdGlvbih2KSB7XG4gICAgICAgICAgICB2YXIgbiA9IHYgJiYgdi50aXRsZSgpIHx8ICcnO1xuICAgICAgICAgICAgbiArPSB2ICYmIHYuZGVzY3JpcHRpb24oKSB8fCAnJztcbiAgICAgICAgICAgIG4gPSBuLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICByZXR1cm4gbi5pbmRleE9mKHMpID4gLTE7XG4gICAgICAgIH0pO1xuICAgIH0sIHRoaXMpO1xufVxuXG52YXIgTW9kZWwgPSByZXF1aXJlKCcuLi9tb2RlbHMvTW9kZWwnKTtcbmZ1bmN0aW9uIEZhcSh2YWx1ZXMpIHtcbiAgICBcbiAgICBNb2RlbCh0aGlzKTtcblxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XG4gICAgICAgIGlkOiAwLFxuICAgICAgICB0aXRsZTogJycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnJ1xuICAgIH0sIHZhbHVlcyk7XG59XG5cbi8qKiBURVNUSU5HIERBVEEgKiovXG5mdW5jdGlvbiBzZXRTb21lVGVzdGluZ0RhdGEodmlld01vZGVsKSB7XG4gICAgXG4gICAgdmFyIHRlc3RkYXRhID0gW1xuICAgICAgICBuZXcgRmFxKHtcbiAgICAgICAgICAgIGlkOiAxLFxuICAgICAgICAgICAgdGl0bGU6ICdIb3cgZG8gSSBzZXQgdXAgYSBtYXJrZXRwbGFjZSBwcm9maWxlPycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Rlc2NyaXB0aW9uIGFib3V0IGhvdyBJIHNldCB1cCBhIG1hcmtldHBsYWNlIHByb2ZpbGUnXG4gICAgICAgIH0pLFxuICAgICAgICBuZXcgRmFxKHtcbiAgICAgICAgICAgIGlkOiAyLFxuICAgICAgICAgICAgdGl0bGU6ICdBbm90aGVyIGZhcScsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Fub3RoZXIgZGVzY3JpcHRpb24nXG4gICAgICAgIH0pXG4gICAgXTtcbiAgICB2aWV3TW9kZWwuZmFxcyh0ZXN0ZGF0YSk7XG59XG4iLCIvKipcbiAgICBGZWVkYmFjayBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEZlZWRiYWNrQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIFxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU2VjdGlvbk5hdkJhcignVGFsayB0byB1cycpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcbiIsIi8qKlxuICAgIEZlZWRiYWNrRm9ybSBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEZlZWRiYWNrRm9ybUFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdUYWxrIHRvIHVzJyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuICAgIFxuICAgIHRoaXMubWVzc2FnZSA9IGtvLm9ic2VydmFibGUoJycpO1xuICAgIHRoaXMuYmVjb21lQ29sbGFib3JhdG9yID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG4gICAgdGhpcy53YXNTZW50ID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG5cbiAgICB2YXIgdXBkYXRlV2FzU2VudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLndhc1NlbnQoZmFsc2UpO1xuICAgIH0uYmluZCh0aGlzKTtcbiAgICB0aGlzLm1lc3NhZ2Uuc3Vic2NyaWJlKHVwZGF0ZVdhc1NlbnQpO1xuICAgIHRoaXMuYmVjb21lQ29sbGFib3JhdG9yLnN1YnNjcmliZSh1cGRhdGVXYXNTZW50KTtcbiAgICBcbiAgICB0aGlzLnNlbmQgPSBmdW5jdGlvbiBzZW5kKCkge1xuICAgICAgICAvLyBUT0RPOiBTZW5kXG4gICAgICAgIFxuICAgICAgICAvLyBSZXNldCBhZnRlciBiZWluZyBzZW50XG4gICAgICAgIHRoaXMubWVzc2FnZSgnJyk7XG4gICAgICAgIHRoaXMuYmVjb21lQ29sbGFib3JhdG9yKGZhbHNlKTtcbiAgICAgICAgdGhpcy53YXNTZW50KHRydWUpO1xuXG4gICAgfS5iaW5kKHRoaXMpO1xufVxuIiwiLyoqXG4gICAgSG9tZSBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEhvbWVBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcbiAgICAvLyBudWxsIGZvciBsb2dvXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKG51bGwpO1xuICAgIFxuICAgIC8vIEdldHRpbmcgZWxlbWVudHNcbiAgICB0aGlzLiRuZXh0Qm9va2luZyA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNob21lTmV4dEJvb2tpbmcnKTtcbiAgICB0aGlzLiR1cGNvbWluZ0Jvb2tpbmdzID0gdGhpcy4kYWN0aXZpdHkuZmluZCgnI2hvbWVVcGNvbWluZ0Jvb2tpbmdzJyk7XG4gICAgdGhpcy4kaW5ib3ggPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjaG9tZUluYm94Jyk7XG4gICAgdGhpcy4kcGVyZm9ybWFuY2UgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjaG9tZVBlcmZvcm1hbmNlJyk7XG4gICAgdGhpcy4kZ2V0TW9yZSA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJyNob21lR2V0TW9yZScpO1xuICAgIFxuICAgIC8vIFRlc3RpbmdEYXRhXG4gICAgc2V0U29tZVRlc3RpbmdEYXRhKHRoaXMudmlld01vZGVsKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgIFxuICAgIHZhciB2ID0gdGhpcy52aWV3TW9kZWwsXG4gICAgICAgIGFwcE1vZGVsID0gdGhpcy5hcHAubW9kZWw7XG4gICAgXG4gICAgLy8gVXBkYXRlIGRhdGFcbiAgICBhcHBNb2RlbC5nZXRVcGNvbWluZ0Jvb2tpbmdzKCkudGhlbihmdW5jdGlvbih1cGNvbWluZykge1xuXG4gICAgICAgIGlmICh1cGNvbWluZy5uZXh0Qm9va2luZ0lEKVxuICAgICAgICAgICAgYXBwTW9kZWwuZ2V0Qm9va2luZyh1cGNvbWluZy5uZXh0Qm9va2luZ0lEKS50aGVuKHYubmV4dEJvb2tpbmcpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB2Lm5leHRCb29raW5nKG51bGwpO1xuXG4gICAgICAgIHYudXBjb21pbmdCb29raW5ncy50b2RheS5xdWFudGl0eSh1cGNvbWluZy50b2RheS5xdWFudGl0eSk7XG4gICAgICAgIHYudXBjb21pbmdCb29raW5ncy50b2RheS50aW1lKHVwY29taW5nLnRvZGF5LnRpbWUgJiYgbmV3IERhdGUodXBjb21pbmcudG9kYXkudGltZSkpO1xuICAgICAgICB2LnVwY29taW5nQm9va2luZ3MudG9tb3Jyb3cucXVhbnRpdHkodXBjb21pbmcudG9tb3Jyb3cucXVhbnRpdHkpO1xuICAgICAgICB2LnVwY29taW5nQm9va2luZ3MudG9tb3Jyb3cudGltZSh1cGNvbWluZy50b21vcnJvdy50aW1lICYmIG5ldyBEYXRlKHVwY29taW5nLnRvbW9ycm93LnRpbWUpKTtcbiAgICAgICAgdi51cGNvbWluZ0Jvb2tpbmdzLm5leHRXZWVrLnF1YW50aXR5KHVwY29taW5nLm5leHRXZWVrLnF1YW50aXR5KTtcbiAgICAgICAgdi51cGNvbWluZ0Jvb2tpbmdzLm5leHRXZWVrLnRpbWUodXBjb21pbmcubmV4dFdlZWsudGltZSAmJiBuZXcgRGF0ZSh1cGNvbWluZy5uZXh0V2Vlay50aW1lKSk7XG4gICAgfSk7XG59O1xuXG5cbnZhciBVcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeSA9IHJlcXVpcmUoJy4uL21vZGVscy9VcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeScpLFxuICAgIE1haWxGb2xkZXIgPSByZXF1aXJlKCcuLi9tb2RlbHMvTWFpbEZvbGRlcicpLFxuICAgIFBlcmZvcm1hbmNlU3VtbWFyeSA9IHJlcXVpcmUoJy4uL21vZGVscy9QZXJmb3JtYW5jZVN1bW1hcnknKSxcbiAgICBHZXRNb3JlID0gcmVxdWlyZSgnLi4vbW9kZWxzL0dldE1vcmUnKTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG4gICAgdGhpcy51cGNvbWluZ0Jvb2tpbmdzID0gbmV3IFVwY29taW5nQm9va2luZ3NTdW1tYXJ5KCk7XG5cbiAgICAvLyA6QXBwb2ludG1lbnRcbiAgICB0aGlzLm5leHRCb29raW5nID0ga28ub2JzZXJ2YWJsZShudWxsKTtcbiAgICBcbiAgICB0aGlzLmluYm94ID0gbmV3IE1haWxGb2xkZXIoe1xuICAgICAgICB0b3BOdW1iZXI6IDRcbiAgICB9KTtcbiAgICBcbiAgICB0aGlzLnBlcmZvcm1hbmNlID0gbmV3IFBlcmZvcm1hbmNlU3VtbWFyeSgpO1xuICAgIFxuICAgIHRoaXMuZ2V0TW9yZSA9IG5ldyBHZXRNb3JlKCk7XG59XG5cbi8qKiBURVNUSU5HIERBVEEgKiovXG5mdW5jdGlvbiBzZXRTb21lVGVzdGluZ0RhdGEodmlld01vZGVsKSB7XG4gICAgXG4gICAgdmlld01vZGVsLmluYm94Lm1lc3NhZ2VzKHJlcXVpcmUoJy4uL3Rlc3RkYXRhL21lc3NhZ2VzJykubWVzc2FnZXMpO1xuICAgIFxuICAgIHZpZXdNb2RlbC5wZXJmb3JtYW5jZS5lYXJuaW5ncy5jdXJyZW50QW1vdW50KDI0MDApO1xuICAgIHZpZXdNb2RlbC5wZXJmb3JtYW5jZS5lYXJuaW5ncy5uZXh0QW1vdW50KDYyMDAuNTQpO1xuICAgIHZpZXdNb2RlbC5wZXJmb3JtYW5jZS50aW1lQm9va2VkLnBlcmNlbnQoMC45Myk7XG4gICAgXG4gICAgdmlld01vZGVsLmdldE1vcmUubW9kZWwudXBkYXRlV2l0aCh7XG4gICAgICAgIGF2YWlsYWJpbGl0eTogdHJ1ZSxcbiAgICAgICAgcGF5bWVudHM6IHRydWUsXG4gICAgICAgIHByb2ZpbGU6IHRydWUsXG4gICAgICAgIGNvb3A6IHRydWVcbiAgICB9KTtcbn1cbiIsIi8qKlxuICAgIEluYm94IGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEluYm94QWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIoJ0luYm94Jyk7XG4gICAgXG4gICAgLy90aGlzLiRpbmJveCA9ICRhY3Rpdml0eS5maW5kKCcjaW5ib3hMaXN0Jyk7XG4gICAgXG4gICAgLy8gVGVzdGluZ0RhdGFcbiAgICBzZXRTb21lVGVzdGluZ0RhdGEodGhpcy52aWV3TW9kZWwpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxudmFyIE1haWxGb2xkZXIgPSByZXF1aXJlKCcuLi9tb2RlbHMvTWFpbEZvbGRlcicpO1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG5cbiAgICB0aGlzLmluYm94ID0gbmV3IE1haWxGb2xkZXIoe1xuICAgICAgICB0b3BOdW1iZXI6IDIwXG4gICAgfSk7XG4gICAgXG4gICAgdGhpcy5zZWFyY2hUZXh0ID0ga28ub2JzZXJ2YWJsZSgnJyk7XG59XG5cbi8qKiBURVNUSU5HIERBVEEgKiovXG5mdW5jdGlvbiBzZXRTb21lVGVzdGluZ0RhdGEoZGF0YVZpZXcpIHtcbiAgICBcbiAgICBkYXRhVmlldy5pbmJveC5tZXNzYWdlcyhyZXF1aXJlKCcuLi90ZXN0ZGF0YS9tZXNzYWdlcycpLm1lc3NhZ2VzKTtcbn1cbiIsIi8qKlxuICAgIEluZGV4IGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gSW5kZXhBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgLy8gQW55IHVzZXIgY2FuIGFjY2VzcyB0aGlzXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IG51bGw7XG4gICAgXG4gICAgLy8gbnVsbCBmb3IgbG9nb1xuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU2VjdGlvbk5hdkJhcihudWxsKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG5cbkEucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KHN0YXRlKSB7XG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBzdGF0ZSk7XG4gICAgXG4gICAgLy8gSXQgY2hlY2tzIGlmIHRoZSB1c2VyIGlzIGxvZ2dlZCBzbyB0aGVuIFxuICAgIC8vIHRoZWlyICdsb2dnZWQgaW5kZXgnIGlzIHRoZSBkYXNoYm9hcmQgbm90IHRoaXNcbiAgICAvLyBwYWdlIHRoYXQgaXMgZm9jdXNlZCBvbiBhbm9ueW1vdXMgdXNlcnNcbiAgICBpZiAoIXRoaXMuYXBwLm1vZGVsLnVzZXIoKS5pc0Fub255bW91cygpKSB7XG4gICAgICAgIHRoaXMuYXBwLmdvRGFzaGJvYXJkKCk7XG4gICAgfVxufTtcbiIsIi8qKlxuICAgIEpvYnRpdGxlcyBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIEpvYnRpdGxlc0FjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKCk7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdTY2hlZHVsaW5nJyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG59XG4iLCIvKipcbiAgICBMZWFybk1vcmUgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcbiAgICBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIExlYXJuTW9yZUFjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xuICAgIC8vIG51bGwgZm9yIGxvZ29cbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIobnVsbCk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICBcbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnJvdXRlICYmXG4gICAgICAgIG9wdGlvbnMucm91dGUuc2VnbWVudHMgJiZcbiAgICAgICAgb3B0aW9ucy5yb3V0ZS5zZWdtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy52aWV3TW9kZWwucHJvZmlsZShvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdKTtcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgdGhpcy5wcm9maWxlID0ga28ub2JzZXJ2YWJsZSgnY3VzdG9tZXInKTtcbn1cbiIsIi8qKlxuICAgIExvY2F0aW9uRWRpdGlvbiBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxuICAgIExvY2F0aW9uID0gcmVxdWlyZSgnLi4vbW9kZWxzL0xvY2F0aW9uJyksXG4gICAgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBMb2NhdGlvbkVkaXRpb25BY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkZyZWVsYW5jZXI7XG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ0xvY2F0aW9ucycpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuICAgIC8vanNoaW50IG1heGNvbXBsZXhpdHk6MTBcbiAgICBcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgIFxuICAgIHZhciBpZCA9IDAsXG4gICAgICAgIGNyZWF0ZSA9ICcnO1xuXG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMubG9jYXRpb25JRCkge1xuICAgICAgICAgICAgaWQgPSBvcHRpb25zLmxvY2F0aW9uSUQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5yb3V0ZSAmJiBvcHRpb25zLnJvdXRlLnNlZ21lbnRzKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlkID0gcGFyc2VJbnQob3B0aW9ucy5yb3V0ZS5zZWdtZW50c1swXSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5jcmVhdGUpIHtcbiAgICAgICAgICAgIGNyZWF0ZSA9IG9wdGlvbnMuY3JlYXRlO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGlmIChpZCkge1xuICAgICAgICAvLyBUT0RPXG4gICAgICAgIC8vIHZhciBsb2NhdGlvbiA9IHRoaXMuYXBwLm1vZGVsLmdldExvY2F0aW9uKGlkKVxuICAgICAgICAvLyBOT1RFIHRlc3RpbmcgZGF0YVxuICAgICAgICB2YXIgbG9jYXRpb25zID0ge1xuICAgICAgICAgICAgJzEnOiBuZXcgTG9jYXRpb24oe1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uSUQ6IDEsXG4gICAgICAgICAgICAgICAgbmFtZTogJ0hvbWUnLFxuICAgICAgICAgICAgICAgIGFkZHJlc3NMaW5lMTogJ0hlcmUgU3RyZWV0JyxcbiAgICAgICAgICAgICAgICBjaXR5OiAnU2FuIEZyYW5jaXNjbycsXG4gICAgICAgICAgICAgICAgcG9zdGFsQ29kZTogJzkwMDAxJyxcbiAgICAgICAgICAgICAgICBzdGF0ZVByb3ZpbmNlQ29kZTogJ0NBJyxcbiAgICAgICAgICAgICAgICBjb3VudHJ5SUQ6IDEsXG4gICAgICAgICAgICAgICAgaXNTZXJ2aWNlUmFkaXVzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGlzU2VydmljZUxvY2F0aW9uOiBmYWxzZVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAnMic6IG5ldyBMb2NhdGlvbih7XG4gICAgICAgICAgICAgICAgbG9jYXRpb25JRDogMSxcbiAgICAgICAgICAgICAgICBuYW1lOiAnV29ya3Nob3AnLFxuICAgICAgICAgICAgICAgIGFkZHJlc3NMaW5lMTogJ1Vua25vdyBTdHJlZXQnLFxuICAgICAgICAgICAgICAgIGNpdHk6ICdTYW4gRnJhbmNpc2NvJyxcbiAgICAgICAgICAgICAgICBwb3N0YWxDb2RlOiAnOTAwMDEnLFxuICAgICAgICAgICAgICAgIHN0YXRlUHJvdmluY2VDb2RlOiAnQ0EnLFxuICAgICAgICAgICAgICAgIGNvdW50cnlJRDogMSxcbiAgICAgICAgICAgICAgICBpc1NlcnZpY2VSYWRpdXM6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGlzU2VydmljZUxvY2F0aW9uOiB0cnVlXG4gICAgICAgICAgICB9KVxuICAgICAgICB9O1xuICAgICAgICB2YXIgbG9jYXRpb24gPSBsb2NhdGlvbnNbaWRdO1xuICAgICAgICBpZiAobG9jYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmxvY2F0aW9uKGxvY2F0aW9uKTtcblxuICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuaGVhZGVyKCdFZGl0IExvY2F0aW9uJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5sb2NhdGlvbihudWxsKTtcbiAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmhlYWRlcignVW5rbm93IGxvY2F0aW9uIG9yIHdhcyBkZWxldGVkJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIC8vIE5ldyBsb2NhdGlvblxuICAgICAgICB0aGlzLnZpZXdNb2RlbC5sb2NhdGlvbihuZXcgTG9jYXRpb24oKSk7XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggKG9wdGlvbnMuY3JlYXRlKSB7XG4gICAgICAgICAgICBjYXNlICdzZXJ2aWNlUmFkaXVzJzpcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5sb2NhdGlvbigpLmlzU2VydmljZVJhZGl1cyh0cnVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5oZWFkZXIoJ0FkZCBhIHNlcnZpY2UgcmFkaXVzJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdzZXJ2aWNlTG9jYXRpb24nOlxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmxvY2F0aW9uKCkuaXNTZXJ2aWNlTG9jYXRpb24odHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuaGVhZGVyKCdBZGQgYSBzZXJ2aWNlIGxvY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmxvY2F0aW9uKCkuaXNTZXJ2aWNlUmFkaXVzKHRydWUpO1xuICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmxvY2F0aW9uKCkuaXNTZXJ2aWNlTG9jYXRpb24odHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuaGVhZGVyKCdBZGQgYSBsb2NhdGlvbicpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuICAgIFxuICAgIHRoaXMubG9jYXRpb24gPSBrby5vYnNlcnZhYmxlKG5ldyBMb2NhdGlvbigpKTtcbiAgICBcbiAgICB0aGlzLmhlYWRlciA9IGtvLm9ic2VydmFibGUoJ0VkaXQgTG9jYXRpb24nKTtcbiAgICBcbiAgICAvLyBUT0RPXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24oKSB7fTtcbiAgICB0aGlzLmNhbmNlbCA9IGZ1bmN0aW9uKCkge307XG59IiwiLyoqXHJcbiAgICBsb2NhdGlvbnMgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcclxuXHJcbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBMb2NhdGlvbnNBY3Rpdml0eSgpIHtcclxuICAgIFxyXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuRnJlZWxhbmNlcjtcclxuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ1NjaGVkdWxpbmcnKTtcclxuICAgIFxyXG4gICAgLy8gR2V0dGluZyBlbGVtZW50c1xyXG4gICAgdGhpcy4kbGlzdFZpZXcgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCcjbG9jYXRpb25zTGlzdFZpZXcnKTtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciB0byB1cGRhdGUgaGVhZGVyIGJhc2VkIG9uIGEgbW9kZSBjaGFuZ2U6XHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdNb2RlbC5pc1NlbGVjdGlvbk1vZGUsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24gKGl0SXMpIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuaGVhZGVyVGV4dChpdElzID8gJ1NlbGVjdCBvciBhZGQgYSBzZXJ2aWNlIGxvY2F0aW9uJyA6ICdMb2NhdGlvbnMnKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFVwZGF0ZSBuYXZiYXIgdG9vXHJcbiAgICAgICAgICAgIC8vIFRPRE86IENhbiBiZSBvdGhlciB0aGFuICdzY2hlZHVsaW5nJywgbGlrZSBtYXJrZXRwbGFjZSBwcm9maWxlIG9yIHRoZSBqb2ItdGl0bGU/XHJcbiAgICAgICAgICAgIHRoaXMubmF2QmFyLmxlZnRBY3Rpb24oKS50ZXh0KGl0SXMgPyAnQm9va2luZycgOiAnU2NoZWR1bGluZycpO1xyXG4gICAgICAgICAgICAvLyBUaXRsZSBtdXN0IGJlIGVtcHR5XHJcbiAgICAgICAgICAgIHRoaXMubmF2QmFyLnRpdGxlKCcnKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFRPRE8gUmVwbGFjZWQgYnkgYSBwcm9ncmVzcyBiYXIgb24gYm9va2luZyBjcmVhdGlvblxyXG4gICAgICAgICAgICAvLyBUT0RPIE9yIGxlZnRBY3Rpb24oKS50ZXh0KC4uKSBvbiBib29raW5nIGVkaXRpb24gKHJldHVybiB0byBib29raW5nKVxyXG4gICAgICAgICAgICAvLyBvciBjb21pbmcgZnJvbSBKb2J0aXRsZS9zY2hlZHVsZSAocmV0dXJuIHRvIHNjaGVkdWxlL2pvYiB0aXRsZSk/XHJcblxyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEhhbmRsZXIgdG8gZ28gYmFjayB3aXRoIHRoZSBzZWxlY3RlZCBsb2NhdGlvbiB3aGVuIFxyXG4gICAgLy8gc2VsZWN0aW9uIG1vZGUgZ29lcyBvZmYgYW5kIHJlcXVlc3RJbmZvIGlzIGZvclxyXG4gICAgLy8gJ3NlbGVjdCBtb2RlJ1xyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwuaXNTZWxlY3Rpb25Nb2RlLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uIChpdElzKSB7XHJcbiAgICAgICAgICAgIC8vIFdlIGhhdmUgYSByZXF1ZXN0IGFuZFxyXG4gICAgICAgICAgICAvLyBpdCByZXF1ZXN0ZWQgdG8gc2VsZWN0IGEgbG9jYXRpb25cclxuICAgICAgICAgICAgLy8gYW5kIHNlbGVjdGlvbiBtb2RlIGdvZXMgb2ZmXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnJlcXVlc3RJbmZvICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvLnNlbGVjdExvY2F0aW9uID09PSB0cnVlICYmXHJcbiAgICAgICAgICAgICAgICBpdElzID09PSBmYWxzZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFBhc3MgdGhlIHNlbGVjdGVkIGNsaWVudCBpbiB0aGUgaW5mb1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mby5zZWxlY3RlZExvY2F0aW9uID0gdGhpcy52aWV3TW9kZWwuc2VsZWN0ZWRMb2NhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgLy8gQW5kIGdvIGJhY2tcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvQmFjayh0aGlzLnJlcXVlc3RJbmZvKTtcclxuICAgICAgICAgICAgICAgIC8vIExhc3QsIGNsZWFyIHJlcXVlc3RJbmZvXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIFRlc3RpbmdEYXRhXHJcbiAgICB0aGlzLnZpZXdNb2RlbC5sb2NhdGlvbnMocmVxdWlyZSgnLi4vdGVzdGRhdGEvbG9jYXRpb25zJykubG9jYXRpb25zKTtcclxufSk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XHJcblxyXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgXHJcbiAgICBpZiAob3B0aW9ucy5zZWxlY3RMb2NhdGlvbiA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIHRoaXMudmlld01vZGVsLmlzU2VsZWN0aW9uTW9kZSh0cnVlKTtcclxuICAgICAgICAvLyBwcmVzZXQ6XHJcbiAgICAgICAgdGhpcy52aWV3TW9kZWwuc2VsZWN0ZWRMb2NhdGlvbihvcHRpb25zLnNlbGVjdGVkTG9jYXRpb24pO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAob3B0aW9ucy5yb3V0ZSAmJiBvcHRpb25zLnJvdXRlLnNlZ21lbnRzKSB7XHJcbiAgICAgICAgdmFyIGlkID0gb3B0aW9ucy5yb3V0ZS5zZWdtZW50c1swXTtcclxuICAgICAgICBpZiAoaWQpIHtcclxuICAgICAgICAgICAgaWYgKGlkID09PSAnbmV3Jykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ28oJ2xvY2F0aW9uRWRpdGlvbicsIHtcclxuICAgICAgICAgICAgICAgICAgICBjcmVhdGU6IG9wdGlvbnMucm91dGUuc2VnbWVudHNbMV0gLy8gJ3NlcnZpY2VSYWRpdXMnLCAnc2VydmljZUxvY2F0aW9uJ1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5zaGVsbC5nbygnbG9jYXRpb25FZGl0aW9uJywge1xyXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uSUQ6IGlkXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbChhcHApIHtcclxuXHJcbiAgICB0aGlzLmhlYWRlclRleHQgPSBrby5vYnNlcnZhYmxlKCdMb2NhdGlvbnMnKTtcclxuXHJcbiAgICAvLyBGdWxsIGxpc3Qgb2YgbG9jYXRpb25zXHJcbiAgICB0aGlzLmxvY2F0aW9ucyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcblxyXG4gICAgLy8gRXNwZWNpYWwgbW9kZSB3aGVuIGluc3RlYWQgb2YgcGljayBhbmQgZWRpdCB3ZSBhcmUganVzdCBzZWxlY3RpbmdcclxuICAgIC8vICh3aGVuIGVkaXRpbmcgYW4gYXBwb2ludG1lbnQpXHJcbiAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZSA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG5cclxuICAgIHRoaXMuc2VsZWN0ZWRMb2NhdGlvbiA9IGtvLm9ic2VydmFibGUobnVsbCk7XHJcbiAgICBcclxuICAgIHRoaXMuc2VsZWN0TG9jYXRpb24gPSBmdW5jdGlvbihzZWxlY3RlZExvY2F0aW9uKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHRoaXMuaXNTZWxlY3Rpb25Nb2RlKCkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZExvY2F0aW9uKHNlbGVjdGVkTG9jYXRpb24pO1xyXG4gICAgICAgICAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZShmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBhcHAuc2hlbGwuZ28oJ2xvY2F0aW9uRWRpdGlvbicsIHtcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uSUQ6IHNlbGVjdGVkTG9jYXRpb24ubG9jYXRpb25JRCgpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbn1cclxuIiwiLyoqXG4gICAgTG9naW4gYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxuICAgIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gTG9naW5BY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkFub255bW91cztcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU2VjdGlvbk5hdkJhcignTG9nIGluJyk7XG4gICAgXG4gICAgLy8gUGVyZm9ybSBsb2ctaW4gcmVxdWVzdCB3aGVuIGlzIHJlcXVlc3RlZCBieSB0aGUgZm9ybTpcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwuaXNMb2dpbmdJbixcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24odikge1xuICAgICAgICAgICAgaWYgKHYgPT09IHRydWUpIHtcblxuICAgICAgICAgICAgICAgIC8vIFBlcmZvcm0gbG9naW5nXG5cbiAgICAgICAgICAgICAgICAvLyBOb3RpZnkgc3RhdGU6XG4gICAgICAgICAgICAgICAgdmFyICRidG4gPSB0aGlzLiRhY3Rpdml0eS5maW5kKCdbdHlwZT1cInN1Ym1pdFwiXScpO1xuICAgICAgICAgICAgICAgICRidG4uYnV0dG9uKCdsb2FkaW5nJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBDbGVhciBwcmV2aW91cyBlcnJvciBzbyBtYWtlcyBjbGVhciB3ZVxuICAgICAgICAgICAgICAgIC8vIGFyZSBhdHRlbXB0aW5nXG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwubG9naW5FcnJvcignJyk7XG5cbiAgICAgICAgICAgICAgICB2YXIgZW5kZWQgPSBmdW5jdGlvbiBlbmRlZCgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuaXNMb2dpbmdJbihmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICRidG4uYnV0dG9uKCdyZXNldCcpO1xuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAgICAgICAgIC8vIEFmdGVyIGNsZWFuLXVwIGVycm9yICh0byBmb3JjZSBzb21lIHZpZXcgdXBkYXRlcyksXG4gICAgICAgICAgICAgICAgLy8gdmFsaWRhdGUgYW5kIGFib3J0IG9uIGVycm9yXG4gICAgICAgICAgICAgICAgLy8gTWFudWFsbHkgY2hlY2tpbmcgZXJyb3Igb24gZWFjaCBmaWVsZFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnZpZXdNb2RlbC51c2VybmFtZS5lcnJvcigpIHx8XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnBhc3N3b3JkLmVycm9yKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwubG9naW5FcnJvcignUmV2aWV3IHlvdXIgZGF0YScpO1xuICAgICAgICAgICAgICAgICAgICBlbmRlZCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAubW9kZWwubG9naW4oXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnVzZXJuYW1lKCksXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnBhc3N3b3JkKClcbiAgICAgICAgICAgICAgICApLnRoZW4oZnVuY3Rpb24oLypsb2dpbkRhdGEqLykge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLmxvZ2luRXJyb3IoJycpO1xuICAgICAgICAgICAgICAgICAgICBlbmRlZCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBmb3JtIGRhdGFcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwudXNlcm5hbWUoJycpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5wYXNzd29yZCgnJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAuZ29EYXNoYm9hcmQoKTtcblxuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IGVyciAmJiBlcnIucmVzcG9uc2VKU09OICYmIGVyci5yZXNwb25zZUpTT04uZXJyb3JNZXNzYWdlIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnIgJiYgZXJyLnN0YXR1c1RleHQgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICdJbnZhbGlkIHVzZXJuYW1lIG9yIHBhc3N3b3JkJztcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5sb2dpbkVycm9yKG1zZyk7XG4gICAgICAgICAgICAgICAgICAgIGVuZGVkKCk7XG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgfSk7XG4gICAgXG4gICAgLy8gRm9jdXMgZmlyc3QgYmFkIGZpZWxkIG9uIGVycm9yXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLmxvZ2luRXJyb3IsXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgLy8gTG9naW4gaXMgZWFzeSBzaW5jZSB3ZSBtYXJrIGJvdGggdW5pcXVlIGZpZWxkc1xuICAgICAgICAgICAgLy8gYXMgZXJyb3Igb24gbG9naW5FcnJvciAoaXRzIGEgZ2VuZXJhbCBmb3JtIGVycm9yKVxuICAgICAgICAgICAgdmFyIGlucHV0ID0gdGhpcy4kYWN0aXZpdHkuZmluZCgnOmlucHV0JykuZ2V0KDApO1xuICAgICAgICAgICAgaWYgKGVycilcbiAgICAgICAgICAgICAgICBpbnB1dC5mb2N1cygpO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlucHV0LmJsdXIoKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgfSk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG52YXIgRm9ybUNyZWRlbnRpYWxzID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9Gb3JtQ3JlZGVudGlhbHMnKTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuXG4gICAgdmFyIGNyZWRlbnRpYWxzID0gbmV3IEZvcm1DcmVkZW50aWFscygpOyAgICBcbiAgICB0aGlzLnVzZXJuYW1lID0gY3JlZGVudGlhbHMudXNlcm5hbWU7XG4gICAgdGhpcy5wYXNzd29yZCA9IGNyZWRlbnRpYWxzLnBhc3N3b3JkO1xuXG4gICAgdGhpcy5sb2dpbkVycm9yID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgXG4gICAgdGhpcy5pc0xvZ2luZ0luID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG4gICAgXG4gICAgdGhpcy5wZXJmb3JtTG9naW4gPSBmdW5jdGlvbiBwZXJmb3JtTG9naW4oKSB7XG5cbiAgICAgICAgdGhpcy5pc0xvZ2luZ0luKHRydWUpOyAgICAgICAgXG4gICAgfS5iaW5kKHRoaXMpO1xufVxuIiwiLyoqXG4gICAgTG9nb3V0IGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gTG9nb3V0QWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcblxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcbiAgICBBY3Rpdml0eS5wcm90b3R5cGUuc2hvdy5jYWxsKHRoaXMsIHN0YXRlKTtcbiAgICBcbiAgICB0aGlzLmFwcC5tb2RlbC5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBBbm9ueW1vdXMgdXNlciBhZ2FpblxuICAgICAgICB2YXIgbmV3QW5vbiA9IHRoaXMuYXBwLm1vZGVsLnVzZXIoKS5jb25zdHJ1Y3Rvci5uZXdBbm9ueW1vdXMoKTtcbiAgICAgICAgdGhpcy5hcHAubW9kZWwudXNlcigpLm1vZGVsLnVwZGF0ZVdpdGgobmV3QW5vbik7XG5cbiAgICAgICAgLy8gR28gaW5kZXhcbiAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ28oJy8nKTtcbiAgICAgICAgXG4gICAgfS5iaW5kKHRoaXMpKTtcbn07XG4iLCIvKipcbiAgICBPbmJvYXJkaW5nQ29tcGxldGUgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBPbmJvYXJkaW5nQ29tcGxldGVBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKG51bGwpO1xufSk7XG5cbmV4cG9ydHMuaW5pdCA9IEEuaW5pdDtcbiIsIi8qKlxuICAgIE9uYm9hcmRpbmdIb21lIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gT25ib2FyZGluZ0hvbWVBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgLy8gbnVsbCBmb3IgTG9nb1xuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU2VjdGlvbk5hdkJhcihudWxsKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG4iLCIvKipcbiAgICBPbmJvYXJkaW5nIFBvc2l0aW9ucyBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXG4gICAgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBPbmJvYXJkaW5nUG9zaXRpb25zQWN0aXZpdHkoKSB7XG4gICAgXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xuICAgIHRoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKCdKb2IgVGl0bGVzJyk7XG5cbiAgICAvLyBUZXN0aW5nRGF0YVxuICAgIHNldFNvbWVUZXN0aW5nRGF0YSh0aGlzLnZpZXdNb2RlbCk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG5cbiAgICAvLyBGdWxsIGxpc3Qgb2YgcG9zaXRpb25zXG4gICAgdGhpcy5wb3NpdGlvbnMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xufVxuXG52YXIgUG9zaXRpb24gPSByZXF1aXJlKCcuLi9tb2RlbHMvUG9zaXRpb24nKTtcbi8vIFVzZXJQb3NpdGlvbiBtb2RlbFxuZnVuY3Rpb24gc2V0U29tZVRlc3RpbmdEYXRhKHZpZXdNb2RlbCkge1xuICAgIFxuICAgIHZpZXdNb2RlbC5wb3NpdGlvbnMucHVzaChuZXcgUG9zaXRpb24oe1xuICAgICAgICBwb3NpdGlvblNpbmd1bGFyOiAnTWFzc2FnZSBUaGVyYXBpc3QnXG4gICAgfSkpO1xuICAgIHZpZXdNb2RlbC5wb3NpdGlvbnMucHVzaChuZXcgUG9zaXRpb24oe1xuICAgICAgICBwb3NpdGlvblNpbmd1bGFyOiAnSG91c2VrZWVwZXInXG4gICAgfSkpO1xufSIsIi8qKlxuICAgIE93bmVySW5mbyBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcblxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIE93bmVySW5mb0FjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ0FjY291bnQnKTtcbn0pO1xuXG5leHBvcnRzLmluaXQgPSBBLmluaXQ7XG4iLCIvKipcclxuICAgIFByaXZhY3lTZXR0aW5ncyBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIFByaXZhY3lTZXR0aW5nc0FjdGl2aXR5KCkge1xyXG4gICAgXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XHJcblxyXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdBY2NvdW50Jyk7XHJcbiAgICBcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMuYXBwLm1vZGVsLnByaXZhY3lTZXR0aW5ncyxcclxuICAgICAgICBldmVudDogJ2Vycm9yJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgdmFyIG1zZyA9IGVyci50YXNrID09PSAnc2F2ZScgPyAnRXJyb3Igc2F2aW5nIHByaXZhY3kgc2V0dGluZ3MuJyA6ICdFcnJvciBsb2FkaW5nIHByaXZhY3kgc2V0dGluZ3MuJztcclxuICAgICAgICAgICAgdGhpcy5hcHAubW9kYWxzLnNob3dFcnJvcih7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogbXNnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVyciAmJiBlcnIudGFzayAmJiBlcnIuZXJyb3IgfHwgZXJyXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xyXG4gICAgXHJcbiAgICAgICAgLy8gS2VlcCBkYXRhIHVwZGF0ZWQ6XHJcbiAgICB0aGlzLmFwcC5tb2RlbC5wcml2YWN5U2V0dGluZ3Muc3luYygpO1xyXG4gICAgLy8gRGlzY2FyZCBhbnkgcHJldmlvdXMgdW5zYXZlZCBlZGl0XHJcbiAgICB0aGlzLnZpZXdNb2RlbC5kaXNjYXJkKCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoYXBwKSB7XHJcblxyXG4gICAgdmFyIHByaXZhY3lTZXR0aW5ncyA9IGFwcC5tb2RlbC5wcml2YWN5U2V0dGluZ3M7XHJcblxyXG4gICAgdmFyIHNldHRpbmdzVmVyc2lvbiA9IHByaXZhY3lTZXR0aW5ncy5uZXdWZXJzaW9uKCk7XHJcbiAgICBzZXR0aW5nc1ZlcnNpb24uaXNPYnNvbGV0ZS5zdWJzY3JpYmUoZnVuY3Rpb24oaXRJcykge1xyXG4gICAgICAgIGlmIChpdElzKSB7XHJcbiAgICAgICAgICAgIC8vIG5ldyB2ZXJzaW9uIGZyb20gc2VydmVyIHdoaWxlIGVkaXRpbmdcclxuICAgICAgICAgICAgLy8gRlVUVVJFOiB3YXJuIGFib3V0IGEgbmV3IHJlbW90ZSB2ZXJzaW9uIGFza2luZ1xyXG4gICAgICAgICAgICAvLyBjb25maXJtYXRpb24gdG8gbG9hZCB0aGVtIG9yIGRpc2NhcmQgYW5kIG92ZXJ3cml0ZSB0aGVtO1xyXG4gICAgICAgICAgICAvLyB0aGUgc2FtZSBpcyBuZWVkIG9uIHNhdmUoKSwgYW5kIG9uIHNlcnZlciByZXNwb25zZVxyXG4gICAgICAgICAgICAvLyB3aXRoIGEgNTA5OkNvbmZsaWN0IHN0YXR1cyAoaXRzIGJvZHkgbXVzdCBjb250YWluIHRoZVxyXG4gICAgICAgICAgICAvLyBzZXJ2ZXIgdmVyc2lvbikuXHJcbiAgICAgICAgICAgIC8vIFJpZ2h0IG5vdywganVzdCBvdmVyd3JpdGUgY3VycmVudCBjaGFuZ2VzIHdpdGhcclxuICAgICAgICAgICAgLy8gcmVtb3RlIG9uZXM6XHJcbiAgICAgICAgICAgIHNldHRpbmdzVmVyc2lvbi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEFjdHVhbCBkYXRhIGZvciB0aGUgZm9ybTpcclxuICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5nc1ZlcnNpb24udmVyc2lvbjtcclxuXHJcbiAgICB0aGlzLmlzTG9ja2VkID0gcHJpdmFjeVNldHRpbmdzLmlzTG9ja2VkO1xyXG5cclxuICAgIHRoaXMuc3VibWl0VGV4dCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZygpID8gXHJcbiAgICAgICAgICAgICAgICAnbG9hZGluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNTYXZpbmcoKSA/IFxyXG4gICAgICAgICAgICAgICAgICAgICdzYXZpbmcuLi4nIDogXHJcbiAgICAgICAgICAgICAgICAgICAgJ1NhdmUnXHJcbiAgICAgICAgKTtcclxuICAgIH0sIHByaXZhY3lTZXR0aW5ncyk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzY2FyZCA9IGZ1bmN0aW9uIGRpc2NhcmQoKSB7XHJcbiAgICAgICAgc2V0dGluZ3NWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgICAgIC8vIEZvcmNlIHRvIHNhdmUsIGV2ZW4gaWYgdGhlcmUgd2FzIHJlbW90ZSB1cGRhdGVzXHJcbiAgICAgICAgc2V0dGluZ3NWZXJzaW9uLnB1c2goeyBldmVuSWZPYnNvbGV0ZTogdHJ1ZSB9KTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxufVxyXG4iLCIvKipcbiAgICBTY2hlZHVsaW5nIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xuXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gU2NoZWR1bGluZ0FjdGl2aXR5KCkge1xuICAgIFxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gdGhpcy5hcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICAvL3RoaXMudmlld01vZGVsID0gbmV3IFZpZXdNb2RlbCh0aGlzLmFwcCk7XG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyKCdTY2hlZHVsaW5nJyk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuIiwiLyoqXHJcbiAgICBTY2hlZHVsaW5nUHJlZmVyZW5jZXMgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBBY3Rpdml0eSA9IHJlcXVpcmUoJy4uL2NvbXBvbmVudHMvQWN0aXZpdHknKTtcclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxudmFyIEEgPSBBY3Rpdml0eS5leHRlbmRzKGZ1bmN0aW9uIFNjaGVkdWxpbmdQcmVmZXJlbmNlc0FjdGl2aXR5KCkge1xyXG4gICAgXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkZyZWVsYW5jZXI7XHJcblxyXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCdTY2hlZHVsaW5nJyk7XHJcbiAgICBcclxuICAgIHRoaXMucmVnaXN0ZXJIYW5kbGVyKHtcclxuICAgICAgICB0YXJnZXQ6IHRoaXMuYXBwLm1vZGVsLnNjaGVkdWxpbmdQcmVmZXJlbmNlcyxcclxuICAgICAgICBldmVudDogJ2Vycm9yJyxcclxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgdmFyIG1zZyA9IGVyci50YXNrID09PSAnc2F2ZScgPyAnRXJyb3Igc2F2aW5nIHNjaGVkdWxpbmcgcHJlZmVyZW5jZXMuJyA6ICdFcnJvciBsb2FkaW5nIHNjaGVkdWxpbmcgcHJlZmVyZW5jZXMuJztcclxuICAgICAgICAgICAgdGhpcy5hcHAubW9kYWxzLnNob3dFcnJvcih7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogbXNnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVyciAmJiBlcnIudGFzayAmJiBlcnIuZXJyb3IgfHwgZXJyXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xyXG4gICAgXHJcbiAgICAgICAgLy8gS2VlcCBkYXRhIHVwZGF0ZWQ6XHJcbiAgICB0aGlzLmFwcC5tb2RlbC5zY2hlZHVsaW5nUHJlZmVyZW5jZXMuc3luYygpO1xyXG4gICAgLy8gRGlzY2FyZCBhbnkgcHJldmlvdXMgdW5zYXZlZCBlZGl0XHJcbiAgICB0aGlzLnZpZXdNb2RlbC5kaXNjYXJkKCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoYXBwKSB7XHJcblxyXG4gICAgdmFyIHNjaGVkdWxpbmdQcmVmZXJlbmNlcyA9IGFwcC5tb2RlbC5zY2hlZHVsaW5nUHJlZmVyZW5jZXM7XHJcblxyXG4gICAgdmFyIHByZWZzVmVyc2lvbiA9IHNjaGVkdWxpbmdQcmVmZXJlbmNlcy5uZXdWZXJzaW9uKCk7XHJcbiAgICBwcmVmc1ZlcnNpb24uaXNPYnNvbGV0ZS5zdWJzY3JpYmUoZnVuY3Rpb24oaXRJcykge1xyXG4gICAgICAgIGlmIChpdElzKSB7XHJcbiAgICAgICAgICAgIC8vIG5ldyB2ZXJzaW9uIGZyb20gc2VydmVyIHdoaWxlIGVkaXRpbmdcclxuICAgICAgICAgICAgLy8gRlVUVVJFOiB3YXJuIGFib3V0IGEgbmV3IHJlbW90ZSB2ZXJzaW9uIGFza2luZ1xyXG4gICAgICAgICAgICAvLyBjb25maXJtYXRpb24gdG8gbG9hZCB0aGVtIG9yIGRpc2NhcmQgYW5kIG92ZXJ3cml0ZSB0aGVtO1xyXG4gICAgICAgICAgICAvLyB0aGUgc2FtZSBpcyBuZWVkIG9uIHNhdmUoKSwgYW5kIG9uIHNlcnZlciByZXNwb25zZVxyXG4gICAgICAgICAgICAvLyB3aXRoIGEgNTA5OkNvbmZsaWN0IHN0YXR1cyAoaXRzIGJvZHkgbXVzdCBjb250YWluIHRoZVxyXG4gICAgICAgICAgICAvLyBzZXJ2ZXIgdmVyc2lvbikuXHJcbiAgICAgICAgICAgIC8vIFJpZ2h0IG5vdywganVzdCBvdmVyd3JpdGUgY3VycmVudCBjaGFuZ2VzIHdpdGhcclxuICAgICAgICAgICAgLy8gcmVtb3RlIG9uZXM6XHJcbiAgICAgICAgICAgIHByZWZzVmVyc2lvbi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEFjdHVhbCBkYXRhIGZvciB0aGUgZm9ybTpcclxuICAgIHRoaXMucHJlZnMgPSBwcmVmc1ZlcnNpb24udmVyc2lvbjtcclxuXHJcbiAgICB0aGlzLmlzTG9ja2VkID0gc2NoZWR1bGluZ1ByZWZlcmVuY2VzLmlzTG9ja2VkO1xyXG5cclxuICAgIHRoaXMuc3VibWl0VGV4dCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZygpID8gXHJcbiAgICAgICAgICAgICAgICAnbG9hZGluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNTYXZpbmcoKSA/IFxyXG4gICAgICAgICAgICAgICAgICAgICdzYXZpbmcuLi4nIDogXHJcbiAgICAgICAgICAgICAgICAgICAgJ1NhdmUnXHJcbiAgICAgICAgKTtcclxuICAgIH0sIHNjaGVkdWxpbmdQcmVmZXJlbmNlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzY2FyZCA9IGZ1bmN0aW9uIGRpc2NhcmQoKSB7XHJcbiAgICAgICAgcHJlZnNWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgICAgIC8vIEZvcmNlIHRvIHNhdmUsIGV2ZW4gaWYgdGhlcmUgd2FzIHJlbW90ZSB1cGRhdGVzXHJcbiAgICAgICAgcHJlZnNWZXJzaW9uLnB1c2goeyBldmVuSWZPYnNvbGV0ZTogdHJ1ZSB9KTtcclxuICAgIH0uYmluZCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5pbmNyZW1lbnRzRXhhbXBsZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgc3RyID0gJ2UuZy4gJyxcclxuICAgICAgICAgICAgaW5jU2l6ZSA9IHRoaXMuaW5jcmVtZW50c1NpemVJbk1pbnV0ZXMoKSxcclxuICAgICAgICAgICAgbSA9IG1vbWVudCh7IGhvdXI6IDEwLCBtaW51dGU6IDAgfSksXHJcbiAgICAgICAgICAgIGhvdXJzID0gW20uZm9ybWF0KCdISDptbScpXTtcclxuICAgICAgICBcclxuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IDQ7IGkrKykge1xyXG4gICAgICAgICAgICBob3Vycy5wdXNoKFxyXG4gICAgICAgICAgICAgICAgbS5hZGQoaW5jU2l6ZSwgJ21pbnV0ZXMnKVxyXG4gICAgICAgICAgICAgICAgLmZvcm1hdCgnSEg6bW0nKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdHIgKz0gaG91cnMuam9pbignLCAnKTtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gc3RyO1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcy5wcmVmcyk7XHJcbn1cclxuIiwiLyoqXHJcbiAgICBzZXJ2aWNlcyBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEFjdGl2aXR5ID0gcmVxdWlyZSgnLi4vY29tcG9uZW50cy9BY3Rpdml0eScpO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG4gICAgXHJcbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBTZXJ2aWNlc0FjdGl2aXR5KCkge1xyXG5cclxuICAgIEFjdGl2aXR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICBcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5GcmVsYW5jZXI7XHJcbiAgICBcclxuICAgIC8vIFRPRE86IG9uIHNob3csIG5lZWQgdG8gYmUgdXBkYXRlZCB3aXRoIHRoZSBKb2JUaXRsZSBuYW1lXHJcbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIoJ0pvYiB0aXRsZScpO1xyXG4gICAgXHJcbiAgICAvL3RoaXMuJGxpc3RWaWV3ID0gdGhpcy4kYWN0aXZpdHkuZmluZCgnI3NlcnZpY2VzTGlzdFZpZXcnKTtcclxuXHJcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwoKTtcclxuXHJcbiAgICAvLyBUZXN0aW5nRGF0YVxyXG4gICAgdGhpcy52aWV3TW9kZWwuc2VydmljZXMocmVxdWlyZSgnLi4vdGVzdGRhdGEvc2VydmljZXMnKS5zZXJ2aWNlcy5tYXAoU2VsZWN0YWJsZSkpO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyIHRvIGdvIGJhY2sgd2l0aCB0aGUgc2VsZWN0ZWQgc2VydmljZSB3aGVuIFxyXG4gICAgLy8gc2VsZWN0aW9uIG1vZGUgZ29lcyBvZmYgYW5kIHJlcXVlc3REYXRhIGlzIGZvclxyXG4gICAgLy8gJ3NlbGVjdCBtb2RlJ1xyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwuaXNTZWxlY3Rpb25Nb2RlLFxyXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uIChpdElzKSB7XHJcbiAgICAgICAgICAgIC8vIFdlIGhhdmUgYSByZXF1ZXN0IGFuZFxyXG4gICAgICAgICAgICAvLyBpdCByZXF1ZXN0ZWQgdG8gc2VsZWN0IGEgc2VydmljZVxyXG4gICAgICAgICAgICAvLyBhbmQgc2VsZWN0aW9uIG1vZGUgZ29lcyBvZmZcclxuICAgICAgICAgICAgaWYgKHRoaXMucmVxdWVzdERhdGEgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdERhdGEuc2VsZWN0U2VydmljZXMgPT09IHRydWUgJiZcclxuICAgICAgICAgICAgICAgIGl0SXMgPT09IGZhbHNlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUGFzcyB0aGUgc2VsZWN0ZWQgY2xpZW50IGluIHRoZSBpbmZvXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3REYXRhLnNlbGVjdGVkU2VydmljZXMgPSB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZFNlcnZpY2VzKCk7XHJcbiAgICAgICAgICAgICAgICAvLyBBbmQgZ28gYmFja1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ29CYWNrKHRoaXMucmVxdWVzdERhdGEpO1xyXG4gICAgICAgICAgICAgICAgLy8gTGFzdCwgY2xlYXIgcmVxdWVzdERhdGFcclxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdERhdGEgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG5cclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgb3B0aW9ucyk7XHJcbiAgICBcclxuICAgIC8vIEdldCBqb2J0aXRsZUlEIGZvciB0aGUgcmVxdWVzdFxyXG4gICAgdmFyIHJvdXRlID0gdGhpcy5yZXF1ZXN0RGF0YSAmJiB0aGlzLnJlcXVlc3REYXRhLnJvdXRlO1xyXG4gICAgdmFyIGpvYlRpdGxlSUQgPSByb3V0ZSAmJiByb3V0ZS5zZWdtZW50cyAmJiByb3V0ZS5zZWdtZW50c1swXTtcclxuICAgIGpvYlRpdGxlSUQgPSBwYXJzZUludChqb2JUaXRsZUlELCAxMCk7XHJcbiAgICBpZiAoam9iVGl0bGVJRCkge1xyXG4gICAgICAgIC8vIFRPRE86IGdldCBkYXRhIGZvciB0aGUgSm9iIHRpdGxlIElEXHJcbiAgICAgICAgdGhpcy5hcHAubW9kZWwuZ2V0VXNlckpvYlRpdGxlKGpvYlRpdGxlSUQpLnRoZW4oZnVuY3Rpb24odXNlckpvYnRpdGxlKSB7XHJcbiAgICAgICAgICAgIGlmICghdXNlckpvYnRpdGxlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTm8gdXNlciBqb2IgdGl0bGUnKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBMb2FkIHVzZXIgZGF0YSBvbiB0aGlzIGFjdGl2aXR5OlxyXG4gICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5zZXJ2aWNlcyh1c2VySm9idGl0bGUuc2VydmljZXMoKSk7XHJcbiAgICAgICAgICAgIC8vIEZpbGwgaW4gam9iIHRpdGxlIG5hbWVcclxuICAgICAgICAgICAgdGhpcy5hcHAubW9kZWwuZ2V0Sm9iVGl0bGUoam9iVGl0bGVJRCkudGhlbihmdW5jdGlvbihqb2JUaXRsZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFqb2JUaXRsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdObyBqb2IgdGl0bGUnKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5hdkJhci5sZWZ0QWN0aW9uKCkudGV4dChqb2JUaXRsZS5zaW5ndWxhck5hbWUoKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLnJlcXVlc3REYXRhLnNlbGVjdFNlcnZpY2VzID09PSB0cnVlKSB7XHJcbiAgICAgICAgdGhpcy52aWV3TW9kZWwuaXNTZWxlY3Rpb25Nb2RlKHRydWUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8qIFRyaWFscyB0byBwcmVzZXRzIHRoZSBzZWxlY3RlZCBzZXJ2aWNlcywgTk9UIFdPUktJTkdcclxuICAgICAgICB2YXIgc2VydmljZXMgPSAob3B0aW9ucy5zZWxlY3RlZFNlcnZpY2VzIHx8IFtdKTtcclxuICAgICAgICB2YXIgc2VsZWN0ZWRTZXJ2aWNlcyA9IHRoaXMudmlld01vZGVsLnNlbGVjdGVkU2VydmljZXM7XHJcbiAgICAgICAgc2VsZWN0ZWRTZXJ2aWNlcy5yZW1vdmVBbGwoKTtcclxuICAgICAgICB0aGlzLnZpZXdNb2RlbC5zZXJ2aWNlcygpLmZvckVhY2goZnVuY3Rpb24oc2VydmljZSkge1xyXG4gICAgICAgICAgICBzZXJ2aWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHNlbFNlcnZpY2UpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzZWxTZXJ2aWNlID09PSBzZXJ2aWNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VydmljZS5pc1NlbGVjdGVkKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkU2VydmljZXMucHVzaChzZXJ2aWNlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VydmljZS5pc1NlbGVjdGVkKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgKi9cclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIFNlbGVjdGFibGUob2JqKSB7XHJcbiAgICBvYmouaXNTZWxlY3RlZCA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgcmV0dXJuIG9iajtcclxufVxyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIC8vIEZ1bGwgbGlzdCBvZiBzZXJ2aWNlc1xyXG4gICAgdGhpcy5zZXJ2aWNlcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcblxyXG4gICAgLy8gRXNwZWNpYWwgbW9kZSB3aGVuIGluc3RlYWQgb2YgcGljayBhbmQgZWRpdCB3ZSBhcmUganVzdCBzZWxlY3RpbmdcclxuICAgIC8vICh3aGVuIGVkaXRpbmcgYW4gYXBwb2ludG1lbnQpXHJcbiAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZSA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG5cclxuICAgIC8vIEdyb3VwZWQgbGlzdCBvZiBwcmljaW5nczpcclxuICAgIC8vIERlZmluZWQgZ3JvdXBzOiByZWd1bGFyIHNlcnZpY2VzIGFuZCBhZGQtb25zXHJcbiAgICB0aGlzLmdyb3VwZWRTZXJ2aWNlcyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIHZhciBzZXJ2aWNlcyA9IHRoaXMuc2VydmljZXMoKTtcclxuICAgICAgICB2YXIgaXNTZWxlY3Rpb24gPSB0aGlzLmlzU2VsZWN0aW9uTW9kZSgpO1xyXG5cclxuICAgICAgICB2YXIgc2VydmljZXNHcm91cCA9IHtcclxuICAgICAgICAgICAgICAgIGdyb3VwOiBpc1NlbGVjdGlvbiA/ICdTZWxlY3Qgc3RhbmRhbG9uZSBzZXJ2aWNlcycgOiAnU3RhbmRhbG9uZSBzZXJ2aWNlcycsXHJcbiAgICAgICAgICAgICAgICBzZXJ2aWNlczogW11cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYWRkb25zR3JvdXAgPSB7XHJcbiAgICAgICAgICAgICAgICBncm91cDogaXNTZWxlY3Rpb24gPyAnU2VsZWN0IGFkZC1vbiBzZXJ2aWNlcycgOiAnQWRkLW9uIHNlcnZpY2VzJyxcclxuICAgICAgICAgICAgICAgIHNlcnZpY2VzOiBbXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBncm91cHMgPSBbc2VydmljZXNHcm91cCwgYWRkb25zR3JvdXBdO1xyXG5cclxuICAgICAgICBzZXJ2aWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBpc0FkZG9uID0gc2VydmljZS5pc0FkZG9uKCk7XHJcbiAgICAgICAgICAgIGlmIChpc0FkZG9uKSB7XHJcbiAgICAgICAgICAgICAgICBhZGRvbnNHcm91cC5zZXJ2aWNlcy5wdXNoKHNlcnZpY2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2VydmljZXNHcm91cC5zZXJ2aWNlcy5wdXNoKHNlcnZpY2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBncm91cHM7XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2VsZWN0ZWRTZXJ2aWNlcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcbiAgICAvKipcclxuICAgICAgICBUb2dnbGUgdGhlIHNlbGVjdGlvbiBzdGF0dXMgb2YgYSBzZXJ2aWNlLCBhZGRpbmdcclxuICAgICAgICBvciByZW1vdmluZyBpdCBmcm9tIHRoZSAnc2VsZWN0ZWRTZXJ2aWNlcycgYXJyYXkuXHJcbiAgICAqKi9cclxuICAgIHRoaXMudG9nZ2xlU2VydmljZVNlbGVjdGlvbiA9IGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgaW5JbmRleCA9IC0xLFxyXG4gICAgICAgICAgICBpc1NlbGVjdGVkID0gdGhpcy5zZWxlY3RlZFNlcnZpY2VzKCkuc29tZShmdW5jdGlvbihzZWxlY3RlZFNlcnZpY2UsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RlZFNlcnZpY2UgPT09IHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgICAgIGluSW5kZXggPSBpbmRleDtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2VydmljZS5pc1NlbGVjdGVkKCFpc1NlbGVjdGVkKTtcclxuXHJcbiAgICAgICAgaWYgKGlzU2VsZWN0ZWQpXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRTZXJ2aWNlcy5zcGxpY2UoaW5JbmRleCwgMSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkU2VydmljZXMucHVzaChzZXJ2aWNlKTtcclxuXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEVuZHMgdGhlIHNlbGVjdGlvbiBwcm9jZXNzLCByZWFkeSB0byBjb2xsZWN0IHNlbGVjdGlvblxyXG4gICAgICAgIGFuZCBwYXNzaW5nIGl0IHRvIHRoZSByZXF1ZXN0IGFjdGl2aXR5XHJcbiAgICAqKi9cclxuICAgIHRoaXMuZW5kU2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5pc1NlbGVjdGlvbk1vZGUoZmFsc2UpO1xyXG4gICAgICAgIFxyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG59XHJcbiIsIi8qKlxuICAgIFNpZ251cCBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXG4gICAgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XG5cbnZhciBBID0gQWN0aXZpdHkuZXh0ZW5kcyhmdW5jdGlvbiBTaWdudXBBY3Rpdml0eSgpIHtcbiAgICBcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IHRoaXMuYXBwLlVzZXJUeXBlLkFub255bW91cztcbiAgICB0aGlzLnZpZXdNb2RlbCA9IG5ldyBWaWV3TW9kZWwodGhpcy5hcHApO1xuICAgIC8vIG51bGwgZm9yIExvZ29cbiAgICB0aGlzLm5hdkJhciA9IEFjdGl2aXR5LmNyZWF0ZVNlY3Rpb25OYXZCYXIobnVsbCk7XG4gICAgXG4gICAgLy8gUGVyZm9ybSBzaWduLXVwIHJlcXVlc3Qgd2hlbiBpcyByZXF1ZXN0ZWQgYnkgdGhlIGZvcm06XG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xuICAgICAgICB0YXJnZXQ6IHRoaXMudmlld01vZGVsLmlzU2lnbmluZ1VwLFxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgICBpZiAodiA9PT0gdHJ1ZSkge1xuXG4gICAgICAgICAgICAgICAgLy8gUGVyZm9ybSBzaWdudXBcblxuICAgICAgICAgICAgICAgIC8vIE5vdGlmeSBzdGF0ZTpcbiAgICAgICAgICAgICAgICB2YXIgJGJ0biA9IHRoaXMuJGFjdGl2aXR5LmZpbmQoJ1t0eXBlPVwic3VibWl0XCJdJyk7XG4gICAgICAgICAgICAgICAgJGJ0bi5idXR0b24oJ2xvYWRpbmcnKTtcblxuICAgICAgICAgICAgICAgIC8vIENsZWFyIHByZXZpb3VzIGVycm9yIHNvIG1ha2VzIGNsZWFyIHdlXG4gICAgICAgICAgICAgICAgLy8gYXJlIGF0dGVtcHRpbmdcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5zaWdudXBFcnJvcignJyk7XG5cbiAgICAgICAgICAgICAgICB2YXIgZW5kZWQgPSBmdW5jdGlvbiBlbmRlZCgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuaXNTaWduaW5nVXAoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAkYnRuLmJ1dHRvbigncmVzZXQnKTtcbiAgICAgICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgICAgICAvLyBBZnRlciBjbGVhbi11cCBlcnJvciAodG8gZm9yY2Ugc29tZSB2aWV3IHVwZGF0ZXMpLFxuICAgICAgICAgICAgICAgIC8vIHZhbGlkYXRlIGFuZCBhYm9ydCBvbiBlcnJvclxuICAgICAgICAgICAgICAgIC8vIE1hbnVhbGx5IGNoZWNraW5nIGVycm9yIG9uIGVhY2ggZmllbGRcbiAgICAgICAgICAgICAgICBpZiAodGhpcy52aWV3TW9kZWwudXNlcm5hbWUuZXJyb3IoKSB8fFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlbC5wYXNzd29yZC5lcnJvcigpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnNpZ251cEVycm9yKCdSZXZpZXcgeW91ciBkYXRhJyk7XG4gICAgICAgICAgICAgICAgICAgIGVuZGVkKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5tb2RlbC5zaWdudXAoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnVzZXJuYW1lKCksXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnBhc3N3b3JkKCksXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnByb2ZpbGUoKVxuICAgICAgICAgICAgICAgICkudGhlbihmdW5jdGlvbigvKnNpZ251cERhdGEqLykge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnNpZ251cEVycm9yKCcnKTtcbiAgICAgICAgICAgICAgICAgICAgZW5kZWQoKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgZm9ybSBkYXRhXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGVsLnVzZXJuYW1lKCcnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwucGFzc3dvcmQoJycpO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwLmdvRGFzaGJvYXJkKCk7XG5cbiAgICAgICAgICAgICAgICB9LmJpbmQodGhpcykpLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBtc2cgPSBlcnIgJiYgZXJyLnJlc3BvbnNlSlNPTiAmJiBlcnIucmVzcG9uc2VKU09OLmVycm9yTWVzc2FnZSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyICYmIGVyci5zdGF0dXNUZXh0IHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAnSW52YWxpZCB1c2VybmFtZSBvciBwYXNzd29yZCc7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZWwuc2lnbnVwRXJyb3IobXNnKTtcbiAgICAgICAgICAgICAgICAgICAgZW5kZWQoKTtcbiAgICAgICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcylcbiAgICB9KTtcbiAgICBcbiAgICAvLyBGb2N1cyBmaXJzdCBiYWQgZmllbGQgb24gZXJyb3JcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwuc2lnbnVwRXJyb3IsXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgLy8gU2lnbnVwIGlzIGVhc3kgc2luY2Ugd2UgbWFyayBib3RoIHVuaXF1ZSBmaWVsZHNcbiAgICAgICAgICAgIC8vIGFzIGVycm9yIG9uIHNpZ251cEVycm9yIChpdHMgYSBnZW5lcmFsIGZvcm0gZXJyb3IpXG4gICAgICAgICAgICB2YXIgaW5wdXQgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCc6aW5wdXQnKS5nZXQoMCk7XG4gICAgICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgICAgIGlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaW5wdXQuYmx1cigpO1xuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xuXG5BLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICBcbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnJvdXRlICYmXG4gICAgICAgIG9wdGlvbnMucm91dGUuc2VnbWVudHMgJiZcbiAgICAgICAgb3B0aW9ucy5yb3V0ZS5zZWdtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy52aWV3TW9kZWwucHJvZmlsZShvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdKTtcbiAgICB9XG59O1xuXG5cbnZhciBGb3JtQ3JlZGVudGlhbHMgPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL0Zvcm1DcmVkZW50aWFscycpO1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG5cbiAgICB2YXIgY3JlZGVudGlhbHMgPSBuZXcgRm9ybUNyZWRlbnRpYWxzKCk7ICAgIFxuICAgIHRoaXMudXNlcm5hbWUgPSBjcmVkZW50aWFscy51c2VybmFtZTtcbiAgICB0aGlzLnBhc3N3b3JkID0gY3JlZGVudGlhbHMucGFzc3dvcmQ7XG5cbiAgICB0aGlzLnNpZ251cEVycm9yID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgXG4gICAgdGhpcy5pc1NpZ25pbmdVcCA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xuICAgIFxuICAgIHRoaXMucGVyZm9ybVNpZ251cCA9IGZ1bmN0aW9uIHBlcmZvcm1TaWdudXAoKSB7XG5cbiAgICAgICAgdGhpcy5pc1NpZ25pbmdVcCh0cnVlKTtcbiAgICB9LmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLnByb2ZpbGUgPSBrby5vYnNlcnZhYmxlKCdjdXN0b21lcicpO1xufVxuIiwiLyoqXHJcbiAgICB0ZXh0RWRpdG9yIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyLFxyXG4gICAgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XHJcblxyXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gVGV4dEVkaXRvckFjdGl2aXR5KCkge1xyXG4gICAgXHJcbiAgICBBY3Rpdml0eS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcclxuICAgIC8vIFRpdGxlIGlzIGVtcHR5IGV2ZXIsIHNpbmNlIHdlIGFyZSBpbiAnZ28gYmFjaycgbW9kZSBhbGwgdGhlIHRpbWUgaGVyZVxyXG4gICAgdGhpcy5uYXZCYXIgPSBBY3Rpdml0eS5jcmVhdGVTdWJzZWN0aW9uTmF2QmFyKCcnKTtcclxuICAgIFxyXG4gICAgLy8gR2V0dGluZyBlbGVtZW50c1xyXG4gICAgdGhpcy4kdGV4dGFyZWEgPSB0aGlzLiRhY3Rpdml0eS5maW5kKCd0ZXh0YXJlYScpO1xyXG4gICAgdGhpcy50ZXh0YXJlYSA9IHRoaXMuJHRleHRhcmVhLmdldCgwKTtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciBmb3IgdGhlICdzYXZlZCcgZXZlbnQgc28gdGhlIGFjdGl2aXR5XHJcbiAgICAvLyByZXR1cm5zIGJhY2sgdG8gdGhlIHJlcXVlc3RlciBhY3Rpdml0eSBnaXZpbmcgaXRcclxuICAgIC8vIHRoZSBuZXcgdGV4dFxyXG4gICAgdGhpcy5yZWdpc3RlckhhbmRsZXIoe1xyXG4gICAgICAgIHRhcmdldDogdGhpcy52aWV3TW9kZWwsXHJcbiAgICAgICAgZXZlbnQ6ICdzYXZlZCcsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnJlcXVlc3RJbmZvKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGluZm8gd2l0aCB0aGUgbmV3IHRleHRcclxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8udGV4dCA9IHRoaXMudmlld01vZGVsLnRleHQoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gYW5kIHBhc3MgaXQgYmFja1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5zaGVsbC5nb0JhY2sodGhpcy5yZXF1ZXN0SW5mbyk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciB0aGUgY2FuY2VsIGV2ZW50XHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdNb2RlbCxcclxuICAgICAgICBldmVudDogJ2NhbmNlbCcsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIC8vIHJldHVybiwgbm90aGluZyBjaGFuZ2VkXHJcbiAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvQmFjaygpO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG4gICAgQWN0aXZpdHkucHJvdG90eXBlLnNob3cuY2FsbCh0aGlzLCBvcHRpb25zKTtcclxuICAgIFxyXG4gICAgLy8gU2V0IG5hdmlnYXRpb24gdGl0bGUgb3Igbm90aGluZ1xyXG4gICAgdGhpcy5uYXZCYXIubGVmdEFjdGlvbigpLnRleHQob3B0aW9ucy50aXRsZSB8fCAnJyk7XHJcbiAgICBcclxuICAgIC8vIEZpZWxkIGhlYWRlclxyXG4gICAgdGhpcy52aWV3TW9kZWwuaGVhZGVyVGV4dChvcHRpb25zLmhlYWRlcik7XHJcbiAgICB0aGlzLnZpZXdNb2RlbC50ZXh0KG9wdGlvbnMudGV4dCk7XHJcbiAgICBpZiAob3B0aW9ucy5yb3dzTnVtYmVyKVxyXG4gICAgICAgIHRoaXMudmlld01vZGVsLnJvd3NOdW1iZXIob3B0aW9ucy5yb3dzTnVtYmVyKTtcclxuICAgICAgICBcclxuICAgIC8vIElubWVkaWF0ZSBmb2N1cyB0byB0aGUgdGV4dGFyZWEgZm9yIGJldHRlciB1c2FiaWxpdHlcclxuICAgIHRoaXMudGV4dGFyZWEuZm9jdXMoKTtcclxuICAgIHRoaXMuJHRleHRhcmVhLmNsaWNrKCk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XHJcblxyXG4gICAgdGhpcy5oZWFkZXJUZXh0ID0ga28ub2JzZXJ2YWJsZSgnVGV4dCcpO1xyXG5cclxuICAgIC8vIFRleHQgdG8gZWRpdFxyXG4gICAgdGhpcy50ZXh0ID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcbiAgICBcclxuICAgIC8vIE51bWJlciBvZiByb3dzIGZvciB0aGUgdGV4dGFyZWFcclxuICAgIHRoaXMucm93c051bWJlciA9IGtvLm9ic2VydmFibGUoMik7XHJcblxyXG4gICAgdGhpcy5jYW5jZWwgPSBmdW5jdGlvbiBjYW5jZWwoKSB7XHJcbiAgICAgICAgdGhpcy5lbWl0KCdjYW5jZWwnKTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIHRoaXMuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICAgICAgdGhpcy5lbWl0KCdzYXZlZCcpO1xyXG4gICAgfTtcclxufVxyXG5cclxuVmlld01vZGVsLl9pbmhlcml0cyhFdmVudEVtaXR0ZXIpO1xyXG4iLCIvKipcclxuICAgIFdlZWtseVNjaGVkdWxlIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgQWN0aXZpdHkgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0FjdGl2aXR5Jyk7XHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcblxyXG52YXIgQSA9IEFjdGl2aXR5LmV4dGVuZHMoZnVuY3Rpb24gV2Vla2x5U2NoZWR1bGVBY3Rpdml0eSgpIHtcclxuICAgIFxyXG4gICAgQWN0aXZpdHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIFxyXG4gICAgdGhpcy52aWV3TW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMuYXBwKTtcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSB0aGlzLmFwcC5Vc2VyVHlwZS5GcmVlbGFuY2VyO1xyXG5cclxuICAgIHRoaXMubmF2QmFyID0gQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhcignU2NoZWR1bGluZycpO1xyXG4gICAgXHJcbiAgICB0aGlzLnJlZ2lzdGVySGFuZGxlcih7XHJcbiAgICAgICAgdGFyZ2V0OiB0aGlzLmFwcC5tb2RlbC5zaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUsXHJcbiAgICAgICAgZXZlbnQ6ICdlcnJvcicsXHJcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgIHZhciBtc2cgPSBlcnIudGFzayA9PT0gJ3NhdmUnID8gJ0Vycm9yIHNhdmluZyB5b3VyIHdlZWtseSBzY2hlZHVsZS4nIDogJ0Vycm9yIGxvYWRpbmcgeW91ciB3ZWVrbHkgc2NoZWR1bGUuJztcclxuICAgICAgICAgICAgdGhpcy5hcHAubW9kYWxzLnNob3dFcnJvcih7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogbXNnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVyciAmJiBlcnIudGFzayAmJiBlcnIuZXJyb3IgfHwgZXJyXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gQS5pbml0O1xyXG5cclxuQS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3coc3RhdGUpIHtcclxuICAgIEFjdGl2aXR5LnByb3RvdHlwZS5zaG93LmNhbGwodGhpcywgc3RhdGUpO1xyXG4gICAgXHJcbiAgICAvLyBLZWVwIGRhdGEgdXBkYXRlZDpcclxuICAgIHRoaXMuYXBwLm1vZGVsLnNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZS5zeW5jKCk7XHJcbiAgICAvLyBEaXNjYXJkIGFueSBwcmV2aW91cyB1bnNhdmVkIGVkaXRcclxuICAgIHRoaXMudmlld01vZGVsLmRpc2NhcmQoKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbChhcHApIHtcclxuXHJcbiAgICB2YXIgc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlID0gYXBwLm1vZGVsLnNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZTtcclxuXHJcbiAgICB2YXIgc2NoZWR1bGVWZXJzaW9uID0gc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlLm5ld1ZlcnNpb24oKTtcclxuICAgIHNjaGVkdWxlVmVyc2lvbi5pc09ic29sZXRlLnN1YnNjcmliZShmdW5jdGlvbihpdElzKSB7XHJcbiAgICAgICAgaWYgKGl0SXMpIHtcclxuICAgICAgICAgICAgLy8gbmV3IHZlcnNpb24gZnJvbSBzZXJ2ZXIgd2hpbGUgZWRpdGluZ1xyXG4gICAgICAgICAgICAvLyBGVVRVUkU6IHdhcm4gYWJvdXQgYSBuZXcgcmVtb3RlIHZlcnNpb24gYXNraW5nXHJcbiAgICAgICAgICAgIC8vIGNvbmZpcm1hdGlvbiB0byBsb2FkIHRoZW0gb3IgZGlzY2FyZCBhbmQgb3ZlcndyaXRlIHRoZW07XHJcbiAgICAgICAgICAgIC8vIHRoZSBzYW1lIGlzIG5lZWQgb24gc2F2ZSgpLCBhbmQgb24gc2VydmVyIHJlc3BvbnNlXHJcbiAgICAgICAgICAgIC8vIHdpdGggYSA1MDk6Q29uZmxpY3Qgc3RhdHVzIChpdHMgYm9keSBtdXN0IGNvbnRhaW4gdGhlXHJcbiAgICAgICAgICAgIC8vIHNlcnZlciB2ZXJzaW9uKS5cclxuICAgICAgICAgICAgLy8gUmlnaHQgbm93LCBqdXN0IG92ZXJ3cml0ZSBjdXJyZW50IGNoYW5nZXMgd2l0aFxyXG4gICAgICAgICAgICAvLyByZW1vdGUgb25lczpcclxuICAgICAgICAgICAgc2NoZWR1bGVWZXJzaW9uLnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gQWN0dWFsIGRhdGEgZm9yIHRoZSBmb3JtOlxyXG4gICAgdGhpcy5zY2hlZHVsZSA9IHNjaGVkdWxlVmVyc2lvbi52ZXJzaW9uO1xyXG5cclxuICAgIHRoaXMuaXNMb2NrZWQgPSBzaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUuaXNMb2NrZWQ7XHJcblxyXG4gICAgdGhpcy5zdWJtaXRUZXh0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKCkgPyBcclxuICAgICAgICAgICAgICAgICdsb2FkaW5nLi4uJyA6IFxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc1NhdmluZygpID8gXHJcbiAgICAgICAgICAgICAgICAgICAgJ3NhdmluZy4uLicgOiBcclxuICAgICAgICAgICAgICAgICAgICAnU2F2ZSdcclxuICAgICAgICApO1xyXG4gICAgfSwgc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNjYXJkID0gZnVuY3Rpb24gZGlzY2FyZCgpIHtcclxuICAgICAgICBzY2hlZHVsZVZlcnNpb24ucHVsbCh7IGV2ZW5JZk5ld2VyOiB0cnVlIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgICAgIC8vIEZvcmNlIHRvIHNhdmUsIGV2ZW4gaWYgdGhlcmUgd2FzIHJlbW90ZSB1cGRhdGVzXHJcbiAgICAgICAgc2NoZWR1bGVWZXJzaW9uLnB1c2goeyBldmVuSWZPYnNvbGV0ZTogdHJ1ZSB9KTtcclxuICAgIH07XHJcbn1cclxuIiwiLyoqXHJcbiAgICBSZWdpc3RyYXRpb24gb2YgY3VzdG9tIGh0bWwgY29tcG9uZW50cyB1c2VkIGJ5IHRoZSBBcHAuXHJcbiAgICBBbGwgd2l0aCAnYXBwLScgYXMgcHJlZml4LlxyXG4gICAgXHJcbiAgICBTb21lIGRlZmluaXRpb25zIG1heSBiZSBpbmNsdWRlZCBvbi1saW5lIHJhdGhlciB0aGFuIG9uIHNlcGFyYXRlZFxyXG4gICAgZmlsZXMgKHZpZXdtb2RlbHMpLCB0ZW1wbGF0ZXMgYXJlIGxpbmtlZCBzbyBuZWVkIHRvIGJlIFxyXG4gICAgaW5jbHVkZWQgaW4gdGhlIGh0bWwgZmlsZSB3aXRoIHRoZSBzYW1lIElEIHRoYXQgcmVmZXJlbmNlZCBoZXJlLFxyXG4gICAgdXN1YWxseSB1c2luZyBhcyBET00gSUQgdGhlIHNhbWUgbmFtZSBhcyB0aGUgY29tcG9uZW50IHdpdGggc3VmaXggJy10ZW1wbGF0ZScuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG52YXIgcHJvcFRvb2xzID0gcmVxdWlyZSgnLi91dGlscy9qc1Byb3BlcnRpZXNUb29scycpO1xyXG5cclxuZnVuY3Rpb24gZ2V0T2JzZXJ2YWJsZShvYnNPclZhbHVlKSB7XHJcbiAgICBpZiAodHlwZW9mKG9ic09yVmFsdWUpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgIHJldHVybiBvYnNPclZhbHVlO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIHJldHVybiBrby5vYnNlcnZhYmxlKG9ic09yVmFsdWUpO1xyXG59XHJcblxyXG5leHBvcnRzLnJlZ2lzdGVyQWxsID0gZnVuY3Rpb24oKSB7XHJcbiAgICBcclxuICAgIC8vLyBuYXZiYXItYWN0aW9uXHJcbiAgICBrby5jb21wb25lbnRzLnJlZ2lzdGVyKCdhcHAtbmF2YmFyLWFjdGlvbicsIHtcclxuICAgICAgICB0ZW1wbGF0ZTogeyBlbGVtZW50OiAnbmF2YmFyLWFjdGlvbi10ZW1wbGF0ZScgfSxcclxuICAgICAgICB2aWV3TW9kZWw6IGZ1bmN0aW9uKHBhcmFtcykge1xyXG5cclxuICAgICAgICAgICAgcHJvcFRvb2xzLmRlZmluZUdldHRlcih0aGlzLCAnYWN0aW9uJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtcy5hY3Rpb24gJiYgcGFyYW1zLm5hdkJhcigpID9cclxuICAgICAgICAgICAgICAgICAgICBwYXJhbXMubmF2QmFyKClbcGFyYW1zLmFjdGlvbl0oKSA6XHJcbiAgICAgICAgICAgICAgICAgICAgbnVsbFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vLyB1bmxhYmVsZWQtaW5wdXRcclxuICAgIGtvLmNvbXBvbmVudHMucmVnaXN0ZXIoJ2FwcC11bmxhYmVsZWQtaW5wdXQnLCB7XHJcbiAgICAgICAgdGVtcGxhdGU6IHsgZWxlbWVudDogJ3VubGFiZWxlZC1pbnB1dC10ZW1wbGF0ZScgfSxcclxuICAgICAgICB2aWV3TW9kZWw6IGZ1bmN0aW9uKHBhcmFtcykge1xyXG5cclxuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IGdldE9ic2VydmFibGUocGFyYW1zLnZhbHVlKTtcclxuICAgICAgICAgICAgdGhpcy5wbGFjZWhvbGRlciA9IGdldE9ic2VydmFibGUocGFyYW1zLnBsYWNlaG9sZGVyKTtcclxuICAgICAgICAgICAgdGhpcy5kaXNhYmxlID0gZ2V0T2JzZXJ2YWJsZShwYXJhbXMuZGlzYWJsZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vLyBmZWVkYmFjay1lbnRyeVxyXG4gICAga28uY29tcG9uZW50cy5yZWdpc3RlcignYXBwLWZlZWRiYWNrLWVudHJ5Jywge1xyXG4gICAgICAgIHRlbXBsYXRlOiB7IGVsZW1lbnQ6ICdmZWVkYmFjay1lbnRyeS10ZW1wbGF0ZScgfSxcclxuICAgICAgICB2aWV3TW9kZWw6IGZ1bmN0aW9uKHBhcmFtcykge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zZWN0aW9uID0gZ2V0T2JzZXJ2YWJsZShwYXJhbXMuc2VjdGlvbiB8fCAnJyk7XHJcbiAgICAgICAgICAgIHRoaXMudXJsID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICcvZmVlZGJhY2svJyArIHRoaXMuc2VjdGlvbigpO1xyXG4gICAgICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBOYXZiYXIgZXh0ZW5zaW9uIG9mIHRoZSBBcHAsXHJcbiAgICBhZGRzIHRoZSBlbGVtZW50cyB0byBtYW5hZ2UgYSB2aWV3IG1vZGVsXHJcbiAgICBmb3IgdGhlIE5hdkJhciBhbmQgYXV0b21hdGljIGNoYW5nZXNcclxuICAgIHVuZGVyIHNvbWUgbW9kZWwgY2hhbmdlcyBsaWtlIHVzZXIgbG9naW4vbG9nb3V0XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi92aWV3bW9kZWxzL05hdkJhcicpLFxyXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xyXG5cclxuZXhwb3J0cy5leHRlbmRzID0gZnVuY3Rpb24gKGFwcCkge1xyXG4gICAgXHJcbiAgICAvLyBSRVZJRVc6IHN0aWxsIG5lZWRlZD8gTWF5YmUgdGhlIHBlciBhY3Rpdml0eSBuYXZCYXIgbWVhbnNcclxuICAgIC8vIHRoaXMgaXMgbm90IG5lZWRlZC4gU29tZSBwcmV2aW91cyBsb2dpYyB3YXMgYWxyZWFkeSByZW1vdmVkXHJcbiAgICAvLyBiZWNhdXNlIHdhcyB1c2VsZXNzLlxyXG4gICAgLy9cclxuICAgIC8vIEFkanVzdCB0aGUgbmF2YmFyIHNldHVwIGRlcGVuZGluZyBvbiBjdXJyZW50IHVzZXIsXHJcbiAgICAvLyBzaW5jZSBkaWZmZXJlbnQgdGhpbmdzIGFyZSBuZWVkIGZvciBsb2dnZWQtaW4vb3V0LlxyXG4gICAgZnVuY3Rpb24gYWRqdXN0VXNlckJhcigpIHtcclxuXHJcbiAgICAgICAgdmFyIHVzZXIgPSBhcHAubW9kZWwudXNlcigpO1xyXG5cclxuICAgICAgICBpZiAodXNlci5pc0Fub255bW91cygpKSB7XHJcbiAgICAgICAgICAgIGFwcC5uYXZCYXIoKS5yaWdodEFjdGlvbihOYXZBY3Rpb24ubWVudU91dCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gQ29tbWVudGVkIGxpbmVzLCB1c2VkIHByZXZpb3VzbHkgYnV0IHVudXNlZCBub3csIGl0IG11c3QgYmUgZW5vdWdoIHdpdGggdGhlIHVwZGF0ZVxyXG4gICAgLy8gcGVyIGFjdGl2aXR5IGNoYW5nZVxyXG4gICAgLy9hcHAubW9kZWwudXNlcigpLmlzQW5vbnltb3VzLnN1YnNjcmliZSh1cGRhdGVTdGF0ZXNPblVzZXJDaGFuZ2UpO1xyXG4gICAgLy9hcHAubW9kZWwudXNlcigpLm9uYm9hcmRpbmdTdGVwLnN1YnNjcmliZSh1cGRhdGVTdGF0ZXNPblVzZXJDaGFuZ2UpO1xyXG4gICAgXHJcbiAgICBhcHAubmF2QmFyID0ga28ub2JzZXJ2YWJsZShudWxsKTtcclxuICAgIFxyXG4gICAgdmFyIHJlZnJlc2hOYXYgPSBmdW5jdGlvbiByZWZyZXNoTmF2KCkge1xyXG4gICAgICAgIC8vIFRyaWdnZXIgZXZlbnQgdG8gZm9yY2UgYSBjb21wb25lbnQgdXBkYXRlXHJcbiAgICAgICAgJCgnLkFwcE5hdicpLnRyaWdnZXIoJ2NvbnRlbnRDaGFuZ2UnKTtcclxuICAgIH07XHJcbiAgICB2YXIgYXV0b1JlZnJlc2hOYXYgPSBmdW5jdGlvbiBhdXRvUmVmcmVzaE5hdihhY3Rpb24pIHtcclxuICAgICAgICBpZiAoYWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGFjdGlvbi50ZXh0LnN1YnNjcmliZShyZWZyZXNoTmF2KTtcclxuICAgICAgICAgICAgYWN0aW9uLmlzVGl0bGUuc3Vic2NyaWJlKHJlZnJlc2hOYXYpO1xyXG4gICAgICAgICAgICBhY3Rpb24uaWNvbi5zdWJzY3JpYmUocmVmcmVzaE5hdik7XHJcbiAgICAgICAgICAgIGFjdGlvbi5pc01lbnUuc3Vic2NyaWJlKHJlZnJlc2hOYXYpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgICAgVXBkYXRlIHRoZSBuYXYgbW9kZWwgdXNpbmcgdGhlIEFjdGl2aXR5IGRlZmF1bHRzXHJcbiAgICAqKi9cclxuICAgIGFwcC51cGRhdGVBcHBOYXYgPSBmdW5jdGlvbiB1cGRhdGVBcHBOYXYoYWN0aXZpdHkpIHtcclxuXHJcbiAgICAgICAgLy8gaWYgdGhlIGFjdGl2aXR5IGhhcyBpdHMgb3duXHJcbiAgICAgICAgaWYgKCduYXZCYXInIGluIGFjdGl2aXR5KSB7XHJcbiAgICAgICAgICAgIC8vIFVzZSBzcGVjaWFsaXppZWQgYWN0aXZpdHkgYmFyIGRhdGFcclxuICAgICAgICAgICAgYXBwLm5hdkJhcihhY3Rpdml0eS5uYXZCYXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gVXNlIGRlZmF1bHQgb25lXHJcbiAgICAgICAgICAgIGFwcC5uYXZCYXIobmV3IE5hdkJhcigpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFRPRE8gRG91YmxlIGNoZWNrIGlmIG5lZWRlZC5cclxuICAgICAgICAvLyBMYXRlc3QgY2hhbmdlcywgd2hlbiBuZWVkZWRcclxuICAgICAgICBhZGp1c3RVc2VyQmFyKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmVmcmVzaE5hdigpO1xyXG4gICAgICAgIGF1dG9SZWZyZXNoTmF2KGFwcC5uYXZCYXIoKS5sZWZ0QWN0aW9uKCkpO1xyXG4gICAgICAgIGF1dG9SZWZyZXNoTmF2KGFwcC5uYXZCYXIoKS5yaWdodEFjdGlvbigpKTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgVXBkYXRlIHRoZSBhcHAgbWVudSB0byBoaWdobGlnaHQgdGhlXHJcbiAgICAgICAgZ2l2ZW4gbGluayBuYW1lXHJcbiAgICAqKi9cclxuICAgIGFwcC51cGRhdGVNZW51ID0gZnVuY3Rpb24gdXBkYXRlTWVudShuYW1lKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyICRtZW51ID0gJCgnLkFwcC1tZW51cyAubmF2YmFyLWNvbGxhcHNlJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gUmVtb3ZlIGFueSBhY3RpdmVcclxuICAgICAgICAkbWVudVxyXG4gICAgICAgIC5maW5kKCdsaScpXHJcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcclxuICAgICAgICAvLyBBZGQgYWN0aXZlXHJcbiAgICAgICAgJG1lbnVcclxuICAgICAgICAuZmluZCgnLmdvLScgKyBuYW1lKVxyXG4gICAgICAgIC5jbG9zZXN0KCdsaScpXHJcbiAgICAgICAgLmFkZENsYXNzKCdhY3RpdmUnKTtcclxuICAgICAgICAvLyBIaWRlIG1lbnVcclxuICAgICAgICAkbWVudVxyXG4gICAgICAgIC5maWx0ZXIoJzp2aXNpYmxlJylcclxuICAgICAgICAuY29sbGFwc2UoJ2hpZGUnKTtcclxuICAgIH07XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgTGlzdCBvZiBhY3Rpdml0aWVzIGxvYWRlZCBpbiB0aGUgQXBwLFxyXG4gICAgYXMgYW4gb2JqZWN0IHdpdGggdGhlIGFjdGl2aXR5IG5hbWUgYXMgdGhlIGtleVxyXG4gICAgYW5kIHRoZSBjb250cm9sbGVyIGFzIHZhbHVlLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAnY2FsZW5kYXInOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvY2FsZW5kYXInKSxcclxuICAgICdkYXRldGltZVBpY2tlcic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9kYXRldGltZVBpY2tlcicpLFxyXG4gICAgJ2NsaWVudHMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvY2xpZW50cycpLFxyXG4gICAgJ3NlcnZpY2VzJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL3NlcnZpY2VzJyksXHJcbiAgICAnbG9jYXRpb25zJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2xvY2F0aW9ucycpLFxyXG4gICAgJ3RleHRFZGl0b3InOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvdGV4dEVkaXRvcicpLFxyXG4gICAgJ2hvbWUnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvaG9tZScpLFxyXG4gICAgJ2FwcG9pbnRtZW50JzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2FwcG9pbnRtZW50JyksXHJcbiAgICAnYm9va2luZ0NvbmZpcm1hdGlvbic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9ib29raW5nQ29uZmlybWF0aW9uJyksXHJcbiAgICAnaW5kZXgnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvaW5kZXgnKSxcclxuICAgICdsb2dpbic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9sb2dpbicpLFxyXG4gICAgJ2xvZ291dCc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9sb2dvdXQnKSxcclxuICAgICdsZWFybk1vcmUnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvbGVhcm5Nb3JlJyksXHJcbiAgICAnc2lnbnVwJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL3NpZ251cCcpLFxyXG4gICAgJ2NvbnRhY3RJbmZvJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NvbnRhY3RJbmZvJyksXHJcbiAgICAnb25ib2FyZGluZ1Bvc2l0aW9ucyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9vbmJvYXJkaW5nUG9zaXRpb25zJyksXHJcbiAgICAnb25ib2FyZGluZ0hvbWUnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvb25ib2FyZGluZ0hvbWUnKSxcclxuICAgICdsb2NhdGlvbkVkaXRpb24nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvbG9jYXRpb25FZGl0aW9uJyksXHJcbiAgICAnb25ib2FyZGluZ0NvbXBsZXRlJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL29uYm9hcmRpbmdDb21wbGV0ZScpLFxyXG4gICAgJ2FjY291bnQnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvYWNjb3VudCcpLFxyXG4gICAgJ2luYm94JzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2luYm94JyksXHJcbiAgICAnY29udmVyc2F0aW9uJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NvbnZlcnNhdGlvbicpLFxyXG4gICAgJ3NjaGVkdWxpbmcnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvc2NoZWR1bGluZycpLFxyXG4gICAgJ2pvYnRpdGxlcyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9qb2J0aXRsZXMnKSxcclxuICAgICdmZWVkYmFjayc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9mZWVkYmFjaycpLFxyXG4gICAgJ2ZhcXMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvZmFxcycpLFxyXG4gICAgJ2ZlZWRiYWNrRm9ybSc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9mZWVkYmFja0Zvcm0nKSxcclxuICAgICdjb250YWN0Rm9ybSc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jb250YWN0Rm9ybScpLFxyXG4gICAgJ2Ntcyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jbXMnKSxcclxuICAgICdjbGllbnRFZGl0aW9uJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NsaWVudEVkaXRpb24nKSxcclxuICAgICdzY2hlZHVsaW5nUHJlZmVyZW5jZXMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvc2NoZWR1bGluZ1ByZWZlcmVuY2VzJyksXHJcbiAgICAnY2FsZW5kYXJTeW5jaW5nJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2NhbGVuZGFyU3luY2luZycpLFxyXG4gICAgJ3dlZWtseVNjaGVkdWxlJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL3dlZWtseVNjaGVkdWxlJyksXHJcbiAgICAnYm9va01lQnV0dG9uJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2Jvb2tNZUJ1dHRvbicpLFxyXG4gICAgJ293bmVySW5mbyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9vd25lckluZm8nKSxcclxuICAgICdwcml2YWN5U2V0dGluZ3MnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvcHJpdmFjeVNldHRpbmdzJylcclxufTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqIEdsb2JhbCBkZXBlbmRlbmNpZXMgKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS1tb2JpbGUnKTtcclxucmVxdWlyZSgnLi91dGlscy9qcXVlcnkubXVsdGlsaW5lJyk7XHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbmtvLmJpbmRpbmdIYW5kbGVycy5mb3JtYXQgPSByZXF1aXJlKCdrby9mb3JtYXRCaW5kaW5nJykuZm9ybWF0QmluZGluZztcclxudmFyIGJvb3Rrbm9jayA9IHJlcXVpcmUoJy4vdXRpbHMvYm9vdGtub2NrQmluZGluZ0hlbHBlcnMnKTtcclxucmVxdWlyZSgnLi91dGlscy9GdW5jdGlvbi5wcm90b3R5cGUuX2luaGVyaXRzJyk7XHJcbnJlcXVpcmUoJy4vdXRpbHMvRnVuY3Rpb24ucHJvdG90eXBlLl9kZWxheWVkJyk7XHJcbi8vIFByb21pc2UgcG9seWZpbGwsIHNvIGl0cyBub3QgJ3JlcXVpcmUnZCBwZXIgbW9kdWxlOlxyXG5yZXF1aXJlKCdlczYtcHJvbWlzZScpLnBvbHlmaWxsKCk7XHJcblxyXG52YXIgbGF5b3V0VXBkYXRlRXZlbnQgPSByZXF1aXJlKCdsYXlvdXRVcGRhdGVFdmVudCcpO1xyXG52YXIgQXBwTW9kZWwgPSByZXF1aXJlKCcuL3ZpZXdtb2RlbHMvQXBwTW9kZWwnKTtcclxuXHJcbi8vIFJlZ2lzdGVyIHRoZSBzcGVjaWFsIGxvY2FsZVxyXG5yZXF1aXJlKCcuL2xvY2FsZXMvZW4tVVMtTEMnKTtcclxuXHJcbi8qKlxyXG4gICAgQSBzZXQgb2YgZml4ZXMvd29ya2Fyb3VuZHMgZm9yIEJvb3RzdHJhcCBiZWhhdmlvci9wbHVnaW5zXHJcbiAgICB0byBiZSBleGVjdXRlZCBiZWZvcmUgQm9vdHN0cmFwIGlzIGluY2x1ZGVkL2V4ZWN1dGVkLlxyXG4gICAgRm9yIGV4YW1wbGUsIGJlY2F1c2Ugb2YgZGF0YS1iaW5kaW5nIHJlbW92aW5nL2NyZWF0aW5nIGVsZW1lbnRzLFxyXG4gICAgc29tZSBvbGQgcmVmZXJlbmNlcyB0byByZW1vdmVkIGl0ZW1zIG1heSBnZXQgYWxpdmUgYW5kIG5lZWQgdXBkYXRlLFxyXG4gICAgb3IgcmUtZW5hYmxpbmcgc29tZSBiZWhhdmlvcnMuXHJcbioqL1xyXG5mdW5jdGlvbiBwcmVCb290c3RyYXBXb3JrYXJvdW5kcygpIHtcclxuICAgIC8vIEludGVybmFsIEJvb3RzdHJhcCBzb3VyY2UgdXRpbGl0eVxyXG4gICAgZnVuY3Rpb24gZ2V0VGFyZ2V0RnJvbVRyaWdnZXIoJHRyaWdnZXIpIHtcclxuICAgICAgICB2YXIgaHJlZixcclxuICAgICAgICAgICAgdGFyZ2V0ID0gJHRyaWdnZXIuYXR0cignZGF0YS10YXJnZXQnKSB8fFxyXG4gICAgICAgICAgICAoaHJlZiA9ICR0cmlnZ2VyLmF0dHIoJ2hyZWYnKSkgJiYgXHJcbiAgICAgICAgICAgIGhyZWYucmVwbGFjZSgvLiooPz0jW15cXHNdKyQpLywgJycpOyAvLyBzdHJpcCBmb3IgaWU3XHJcblxyXG4gICAgICAgIHJldHVybiAkKHRhcmdldCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEJ1ZzogbmF2YmFyLWNvbGxhcHNlIGVsZW1lbnRzIGhvbGQgYSByZWZlcmVuY2UgdG8gdGhlaXIgb3JpZ2luYWxcclxuICAgIC8vICR0cmlnZ2VyLCBidXQgdGhhdCB0cmlnZ2VyIGNhbiBjaGFuZ2Ugb24gZGlmZmVyZW50ICdjbGlja3MnIG9yXHJcbiAgICAvLyBnZXQgcmVtb3ZlZCB0aGUgb3JpZ2luYWwsIHNvIGl0IG11c3QgcmVmZXJlbmNlIHRoZSBuZXcgb25lXHJcbiAgICAvLyAodGhlIGxhdGVzdHMgY2xpY2tlZCwgYW5kIG5vdCB0aGUgY2FjaGVkIG9uZSB1bmRlciB0aGUgJ2RhdGEnIEFQSSkuICAgIFxyXG4gICAgLy8gTk9URTogaGFuZGxlciBtdXN0IGV4ZWN1dGUgYmVmb3JlIHRoZSBCb290c3RyYXAgaGFuZGxlciBmb3IgdGhlIHNhbWVcclxuICAgIC8vIGV2ZW50IGluIG9yZGVyIHRvIHdvcmsuXHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2suYnMuY29sbGFwc2UuZGF0YS1hcGkud29ya2Fyb3VuZCcsICdbZGF0YS10b2dnbGU9XCJjb2xsYXBzZVwiXScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyksXHJcbiAgICAgICAgICAgICR0YXJnZXQgPSBnZXRUYXJnZXRGcm9tVHJpZ2dlcigkdCksXHJcbiAgICAgICAgICAgIGRhdGEgPSAkdGFyZ2V0ICYmICR0YXJnZXQuZGF0YSgnYnMuY29sbGFwc2UnKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBJZiBhbnlcclxuICAgICAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgICAgICAvLyBSZXBsYWNlIHRoZSB0cmlnZ2VyIGluIHRoZSBkYXRhIHJlZmVyZW5jZTpcclxuICAgICAgICAgICAgZGF0YS4kdHJpZ2dlciA9ICR0O1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBPbiBlbHNlLCBub3RoaW5nIHRvIGRvLCBhIG5ldyBDb2xsYXBzZSBpbnN0YW5jZSB3aWxsIGJlIGNyZWF0ZWRcclxuICAgICAgICAvLyB3aXRoIHRoZSBjb3JyZWN0IHRhcmdldCwgdGhlIGZpcnN0IHRpbWVcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICAgIEFwcCBzdGF0aWMgY2xhc3NcclxuKiovXHJcbnZhciBhcHAgPSB7XHJcbiAgICBzaGVsbDogcmVxdWlyZSgnLi9hcHAuc2hlbGwnKSxcclxuICAgIFxyXG4gICAgLy8gTmV3IGFwcCBtb2RlbCwgdGhhdCBzdGFydHMgd2l0aCBhbm9ueW1vdXMgdXNlclxyXG4gICAgbW9kZWw6IG5ldyBBcHBNb2RlbCgpLFxyXG4gICAgXHJcbiAgICAvKiogTG9hZCBhY3Rpdml0aWVzIGNvbnRyb2xsZXJzIChub3QgaW5pdGlhbGl6ZWQpICoqL1xyXG4gICAgYWN0aXZpdGllczogcmVxdWlyZSgnLi9hcHAuYWN0aXZpdGllcycpLFxyXG4gICAgXHJcbiAgICBtb2RhbHM6IHJlcXVpcmUoJy4vYXBwLm1vZGFscycpLFxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBKdXN0IHJlZGlyZWN0IHRoZSBiZXR0ZXIgcGxhY2UgZm9yIGN1cnJlbnQgdXNlciBhbmQgc3RhdGUuXHJcbiAgICAgICAgTk9URTogSXRzIGEgZGVsYXllZCBmdW5jdGlvbiwgc2luY2Ugb24gbWFueSBjb250ZXh0cyBuZWVkIHRvXHJcbiAgICAgICAgd2FpdCBmb3IgdGhlIGN1cnJlbnQgJ3JvdXRpbmcnIGZyb20gZW5kIGJlZm9yZSBkbyB0aGUgbmV3XHJcbiAgICAgICAgaGlzdG9yeSBjaGFuZ2UuXHJcbiAgICAgICAgVE9ETzogTWF5YmUsIHJhdGhlciB0aGFuIGRlbGF5IGl0LCBjYW4gc3RvcCBjdXJyZW50IHJvdXRpbmdcclxuICAgICAgICAoY2hhbmdlcyBvbiBTaGVsbCByZXF1aXJlZCkgYW5kIHBlcmZvcm0gdGhlIG5ldy5cclxuICAgICAgICBUT0RPOiBNYXliZSBhbHRlcm5hdGl2ZSB0byBwcmV2aW91cywgdG8gcHJvdmlkZSBhICdyZXBsYWNlJ1xyXG4gICAgICAgIGluIHNoZWxsIHJhdGhlciB0aGFuIGEgZ28sIHRvIGF2b2lkIGFwcGVuZCByZWRpcmVjdCBlbnRyaWVzXHJcbiAgICAgICAgaW4gdGhlIGhpc3RvcnksIHRoYXQgY3JlYXRlIHRoZSBwcm9ibGVtIG9mICdicm9rZW4gYmFjayBidXR0b24nXHJcbiAgICAqKi9cclxuICAgIGdvRGFzaGJvYXJkOiBmdW5jdGlvbiBnb0Rhc2hib2FyZCgpIHtcclxuICAgICAgICBcclxuICAgICAgICAvLyBUbyBhdm9pZCBpbmZpbml0ZSBsb29wcyBpZiB3ZSBhbHJlYWR5IGFyZSBwZXJmb3JtaW5nIFxyXG4gICAgICAgIC8vIGEgZ29EYXNoYm9hcmQgdGFzaywgd2UgZmxhZyB0aGUgZXhlY3V0aW9uXHJcbiAgICAgICAgLy8gYmVpbmcgY2FyZSBvZiB0aGUgZGVsYXkgaW50cm9kdWNlZCBpbiB0aGUgZXhlY3V0aW9uXHJcbiAgICAgICAgaWYgKGdvRGFzaGJvYXJkLl9nb2luZyA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBEZWxheWVkIHRvIGF2b2lkIGNvbGxpc2lvbnMgd2l0aCBpbi10aGUtbWlkZGxlXHJcbiAgICAgICAgICAgIC8vIHRhc2tzOiBqdXN0IGFsbG93aW5nIGN1cnJlbnQgcm91dGluZyB0byBmaW5pc2hcclxuICAgICAgICAgICAgLy8gYmVmb3JlIHBlcmZvcm0gdGhlICdyZWRpcmVjdCdcclxuICAgICAgICAgICAgLy8gVE9ETzogY2hhbmdlIGJ5IGEgcmVhbCByZWRpcmVjdCB0aGF0IGlzIGFibGUgdG9cclxuICAgICAgICAgICAgLy8gY2FuY2VsIHRoZSBjdXJyZW50IGFwcC5zaGVsbCByb3V0aW5nIHByb2Nlc3MuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBnb0Rhc2hib2FyZC5fZ29pbmcgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBvbmJvYXJkaW5nID0gdGhpcy5tb2RlbC51c2VyKCkub25ib2FyZGluZ1N0ZXAoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAob25ib2FyZGluZykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hlbGwuZ28oJ29uYm9hcmRpbmdIb21lLycgKyBvbmJvYXJkaW5nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hlbGwuZ28oJ2hvbWUnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBKdXN0IGJlY2F1c2UgaXMgZGVsYXllZCwgbmVlZHNcclxuICAgICAgICAgICAgICAgIC8vIHRvIGJlIHNldCBvZmYgYWZ0ZXIgYW4gaW5tZWRpYXRlIHRvIFxyXG4gICAgICAgICAgICAgICAgLy8gZW5zdXJlIGlzIHNldCBvZmYgYWZ0ZXIgYW55IG90aGVyIGF0dGVtcHRcclxuICAgICAgICAgICAgICAgIC8vIHRvIGFkZCBhIGRlbGF5ZWQgZ29EYXNoYm9hcmQ6XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGdvRGFzaGJvYXJkLl9nb2luZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfSwgMSk7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqIENvbnRpbnVlIGFwcCBjcmVhdGlvbiB3aXRoIHRoaW5ncyB0aGF0IG5lZWQgYSByZWZlcmVuY2UgdG8gdGhlIGFwcCAqKi9cclxuXHJcbnJlcXVpcmUoJy4vYXBwLW5hdmJhcicpLmV4dGVuZHMoYXBwKTtcclxuXHJcbnJlcXVpcmUoJy4vYXBwLWNvbXBvbmVudHMnKS5yZWdpc3RlckFsbCgpO1xyXG5cclxuYXBwLmdldEFjdGl2aXR5ID0gZnVuY3Rpb24gZ2V0QWN0aXZpdHkobmFtZSkge1xyXG4gICAgdmFyIGFjdGl2aXR5ID0gdGhpcy5hY3Rpdml0aWVzW25hbWVdO1xyXG4gICAgaWYgKGFjdGl2aXR5KSB7XHJcbiAgICAgICAgdmFyICRhY3QgPSB0aGlzLnNoZWxsLml0ZW1zLmZpbmQobmFtZSk7XHJcbiAgICAgICAgaWYgKCRhY3QgJiYgJGFjdC5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybiBhY3Rpdml0eS5pbml0KCRhY3QsIHRoaXMpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbn07XHJcblxyXG5hcHAuZ2V0QWN0aXZpdHlDb250cm9sbGVyQnlSb3V0ZSA9IGZ1bmN0aW9uIGdldEFjdGl2aXR5Q29udHJvbGxlckJ5Um91dGUocm91dGUpIHtcclxuICAgIC8vIEZyb20gdGhlIHJvdXRlIG9iamVjdCwgdGhlIGltcG9ydGFudCBwaWVjZSBpcyByb3V0ZS5uYW1lXHJcbiAgICAvLyB0aGF0IGNvbnRhaW5zIHRoZSBhY3Rpdml0eSBuYW1lIGV4Y2VwdCBpZiBpcyB0aGUgcm9vdFxyXG4gICAgdmFyIGFjdE5hbWUgPSByb3V0ZS5uYW1lIHx8IHRoaXMuc2hlbGwuaW5kZXhOYW1lO1xyXG4gICAgXHJcbiAgICByZXR1cm4gdGhpcy5nZXRBY3Rpdml0eShhY3ROYW1lKTtcclxufTtcclxuXHJcbi8vIGFjY2Vzc0NvbnRyb2wgc2V0dXA6IGNhbm5vdCBiZSBzcGVjaWZpZWQgb24gU2hlbGwgY3JlYXRpb24gYmVjYXVzZVxyXG4vLyBkZXBlbmRzIG9uIHRoZSBhcHAgaW5zdGFuY2VcclxuYXBwLnNoZWxsLmFjY2Vzc0NvbnRyb2wgPSByZXF1aXJlKCcuL3V0aWxzL2FjY2Vzc0NvbnRyb2wnKShhcHApO1xyXG5cclxuLy8gU2hvcnRjdXQgdG8gVXNlclR5cGUgZW51bWVyYXRpb24gdXNlZCB0byBzZXQgcGVybWlzc2lvbnNcclxuYXBwLlVzZXJUeXBlID0gYXBwLm1vZGVsLnVzZXIoKS5jb25zdHJ1Y3Rvci5Vc2VyVHlwZTtcclxuXHJcbi8qKiBBcHAgSW5pdCAqKi9cclxudmFyIGFwcEluaXQgPSBmdW5jdGlvbiBhcHBJbml0KCkge1xyXG4gICAgLypqc2hpbnQgbWF4c3RhdGVtZW50czo1MCxtYXhjb21wbGV4aXR5OjE2ICovXHJcbiAgICBcclxuICAgIC8vIEVuYWJsaW5nIHRoZSAnbGF5b3V0VXBkYXRlJyBqUXVlcnkgV2luZG93IGV2ZW50IHRoYXQgaGFwcGVucyBvbiByZXNpemUgYW5kIHRyYW5zaXRpb25lbmQsXHJcbiAgICAvLyBhbmQgY2FuIGJlIHRyaWdnZXJlZCBtYW51YWxseSBieSBhbnkgc2NyaXB0IHRvIG5vdGlmeSBjaGFuZ2VzIG9uIGxheW91dCB0aGF0XHJcbiAgICAvLyBtYXkgcmVxdWlyZSBhZGp1c3RtZW50cyBvbiBvdGhlciBzY3JpcHRzIHRoYXQgbGlzdGVuIHRvIGl0LlxyXG4gICAgLy8gVGhlIGV2ZW50IGlzIHRocm90dGxlLCBndWFyYW50aW5nIHRoYXQgdGhlIG1pbm9yIGhhbmRsZXJzIGFyZSBleGVjdXRlZCByYXRoZXJcclxuICAgIC8vIHRoYW4gYSBsb3Qgb2YgdGhlbSBpbiBzaG9ydCB0aW1lIGZyYW1lcyAoYXMgaGFwcGVuIHdpdGggJ3Jlc2l6ZScgZXZlbnRzKS5cclxuICAgIGxheW91dFVwZGF0ZUV2ZW50LmxheW91dFVwZGF0ZUV2ZW50ICs9ICcgb3JpZW50YXRpb25jaGFuZ2UnO1xyXG4gICAgbGF5b3V0VXBkYXRlRXZlbnQub24oKTtcclxuICAgIFxyXG4gICAgLy8gS2V5Ym9hcmQgcGx1Z2luIGV2ZW50cyBhcmUgbm90IGNvbXBhdGlibGUgd2l0aCBqUXVlcnkgZXZlbnRzLCBidXQgbmVlZGVkIHRvXHJcbiAgICAvLyB0cmlnZ2VyIGEgbGF5b3V0VXBkYXRlLCBzbyBoZXJlIGFyZSBjb25uZWN0ZWQsIG1haW5seSBmaXhpbmcgYnVncyBvbiBpT1Mgd2hlbiB0aGUga2V5Ym9hcmRcclxuICAgIC8vIGlzIGhpZGRpbmcuXHJcbiAgICB2YXIgdHJpZ0xheW91dCA9IGZ1bmN0aW9uIHRyaWdMYXlvdXQoKSB7XHJcbiAgICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ2xheW91dFVwZGF0ZScpO1xyXG4gICAgfTtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCduYXRpdmUua2V5Ym9hcmRzaG93JywgdHJpZ0xheW91dCk7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbmF0aXZlLmtleWJvYXJkaGlkZScsIHRyaWdMYXlvdXQpO1xyXG5cclxuICAgIC8vIGlPUy03KyBzdGF0dXMgYmFyIGZpeC4gQXBwbHkgb24gcGx1Z2luIGxvYWRlZCAoY29yZG92YS9waG9uZWdhcCBlbnZpcm9ubWVudClcclxuICAgIC8vIGFuZCBpbiBhbnkgc3lzdGVtLCBzbyBhbnkgb3RoZXIgc3lzdGVtcyBmaXggaXRzIHNvbHZlZCB0b28gaWYgbmVlZGVkIFxyXG4gICAgLy8ganVzdCB1cGRhdGluZyB0aGUgcGx1Z2luIChmdXR1cmUgcHJvb2YpIGFuZCBlbnN1cmUgaG9tb2dlbmVvdXMgY3Jvc3MgcGxhZnRmb3JtIGJlaGF2aW9yLlxyXG4gICAgaWYgKHdpbmRvdy5TdGF0dXNCYXIpIHtcclxuICAgICAgICAvLyBGaXggaU9TLTcrIG92ZXJsYXkgcHJvYmxlbVxyXG4gICAgICAgIC8vIElzIGluIGNvbmZpZy54bWwgdG9vLCBidXQgc2VlbXMgbm90IHRvIHdvcmsgd2l0aG91dCBuZXh0IGNhbGw6XHJcbiAgICAgICAgd2luZG93LlN0YXR1c0Jhci5vdmVybGF5c1dlYlZpZXcoZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBpT3NXZWJ2aWV3ID0gZmFsc2U7XHJcbiAgICBpZiAod2luZG93LmRldmljZSAmJiBcclxuICAgICAgICAvaU9TfGlQYWR8aVBob25lfGlQb2QvaS50ZXN0KHdpbmRvdy5kZXZpY2UucGxhdGZvcm0pKSB7XHJcbiAgICAgICAgaU9zV2VidmlldyA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIE5PVEU6IFNhZmFyaSBpT1MgYnVnIHdvcmthcm91bmQsIG1pbi1oZWlnaHQvaGVpZ2h0IG9uIGh0bWwgZG9lc24ndCB3b3JrIGFzIGV4cGVjdGVkLFxyXG4gICAgLy8gZ2V0dGluZyBiaWdnZXIgdGhhbiB2aWV3cG9ydC5cclxuICAgIHZhciBpT1MgPSAvKGlQYWR8aVBob25lfGlQb2QpL2cudGVzdCggbmF2aWdhdG9yLnVzZXJBZ2VudCApO1xyXG4gICAgaWYgKGlPUykge1xyXG4gICAgICAgIHZhciBnZXRIZWlnaHQgPSBmdW5jdGlvbiBnZXRIZWlnaHQoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbiAgICAgICAgICAgIC8vIEluIGNhc2Ugb2YgZW5hYmxlIHRyYW5zcGFyZW50L292ZXJsYXkgU3RhdHVzQmFyOlxyXG4gICAgICAgICAgICAvLyAod2luZG93LmlubmVySGVpZ2h0IC0gKGlPc1dlYnZpZXcgPyAyMCA6IDApKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgJCgnaHRtbCcpLmhlaWdodChnZXRIZWlnaHQoKSArICdweCcpOyAgICAgICAgXHJcbiAgICAgICAgJCh3aW5kb3cpLm9uKCdsYXlvdXRVcGRhdGUnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgJCgnaHRtbCcpLmhlaWdodChnZXRIZWlnaHQoKSArICdweCcpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEJlY2F1c2Ugb2YgdGhlIGlPUzcrOCBidWdzIHdpdGggaGVpZ2h0IGNhbGN1bGF0aW9uLFxyXG4gICAgLy8gYSBkaWZmZXJlbnQgd2F5IG9mIGFwcGx5IGNvbnRlbnQgaGVpZ2h0IHRvIGZpbGwgYWxsIHRoZSBhdmFpbGFibGUgaGVpZ2h0IChhcyBtaW5pbXVtKVxyXG4gICAgLy8gaXMgcmVxdWlyZWQuXHJcbiAgICAvLyBGb3IgdGhhdCwgdGhlICdmdWxsLWhlaWdodCcgY2xhc3Mgd2FzIGFkZGVkLCB0byBiZSB1c2VkIGluIGVsZW1lbnRzIGluc2lkZSB0aGUgXHJcbiAgICAvLyBhY3Rpdml0eSB0aGF0IG5lZWRzIGFsbCB0aGUgYXZhaWxhYmxlIGhlaWdodCwgaGVyZSB0aGUgY2FsY3VsYXRpb24gaXMgYXBwbGllZCBmb3JcclxuICAgIC8vIGFsbCBwbGF0Zm9ybXMgZm9yIHRoaXMgaG9tb2dlbmVvdXMgYXBwcm9hY2ggdG8gc29sdmUgdGhlIHByb2JsZW1tLlxyXG4gICAgKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciAkYiA9ICQoJ2JvZHknKTtcclxuICAgICAgICB2YXIgZnVsbEhlaWdodCA9IGZ1bmN0aW9uIGZ1bGxIZWlnaHQoKSB7XHJcbiAgICAgICAgICAgIHZhciBoID0gJGIuaGVpZ2h0KCk7XHJcbiAgICAgICAgICAgICQoJy5mdWxsLWhlaWdodCcpXHJcbiAgICAgICAgICAgIC8vIExldCBicm93c2VyIHRvIGNvbXB1dGVcclxuICAgICAgICAgICAgLmNzcygnaGVpZ2h0JywgJ2F1dG8nKVxyXG4gICAgICAgICAgICAvLyBBcyBtaW5pbXVtXHJcbiAgICAgICAgICAgIC5jc3MoJ21pbi1oZWlnaHQnLCBoKVxyXG4gICAgICAgICAgICAvLyBTZXQgZXhwbGljaXQgdGhlIGF1dG9tYXRpYyBjb21wdXRlZCBoZWlnaHRcclxuICAgICAgICAgICAgLmNzcygnaGVpZ2h0JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAvLyB3ZSB1c2UgYm94LXNpemluZzpib3JkZXItYm94LCBzbyBuZWVkcyB0byBiZSBvdXRlckhlaWdodCB3aXRob3V0IG1hcmdpbjpcclxuICAgICAgICAgICAgICAgIHJldHVybiAkKHRoaXMpLm91dGVySGVpZ2h0KGZhbHNlKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgZnVsbEhlaWdodCgpO1xyXG4gICAgICAgICQod2luZG93KS5vbignbGF5b3V0VXBkYXRlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGZ1bGxIZWlnaHQoKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pKCk7XHJcbiAgICBcclxuICAgIC8vIEZvcmNlIGFuIHVwZGF0ZSBkZWxheWVkIHRvIGVuc3VyZSB1cGRhdGUgYWZ0ZXIgc29tZSB0aGluZ3MgZGlkIGFkZGl0aW9uYWwgd29ya1xyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAkKHdpbmRvdykudHJpZ2dlcignbGF5b3V0VXBkYXRlJyk7XHJcbiAgICB9LCAyMDApO1xyXG4gICAgXHJcbiAgICAvLyBCb290c3RyYXBcclxuICAgIHByZUJvb3RzdHJhcFdvcmthcm91bmRzKCk7XHJcbiAgICByZXF1aXJlKCdib290c3RyYXAnKTtcclxuICAgIFxyXG4gICAgLy8gTG9hZCBLbm9ja291dCBiaW5kaW5nIGhlbHBlcnNcclxuICAgIGJvb3Rrbm9jay5wbHVnSW4oa28pO1xyXG4gICAgcmVxdWlyZSgnLi91dGlscy9ib290c3RyYXBTd2l0Y2hCaW5kaW5nJykucGx1Z0luKGtvKTtcclxuICAgIFxyXG4gICAgLy8gUGx1Z2lucyBzZXR1cFxyXG4gICAgaWYgKHdpbmRvdy5jb3Jkb3ZhICYmIHdpbmRvdy5jb3Jkb3ZhLnBsdWdpbnMgJiYgd2luZG93LmNvcmRvdmEucGx1Z2lucy5LZXlib2FyZCkge1xyXG4gICAgICAgIHdpbmRvdy5jb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQuZGlzYWJsZVNjcm9sbCh0cnVlKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gRWFzeSBsaW5rcyB0byBzaGVsbCBhY3Rpb25zLCBsaWtlIGdvQmFjaywgaW4gaHRtbCBlbGVtZW50c1xyXG4gICAgLy8gRXhhbXBsZTogPGJ1dHRvbiBkYXRhLXNoZWxsPVwiZ29CYWNrIDJcIj5HbyAyIHRpbWVzIGJhY2s8L2J1dHRvbj5cclxuICAgIC8vIE5PVEU6IEltcG9ydGFudCwgcmVnaXN0ZXJlZCBiZWZvcmUgdGhlIHNoZWxsLnJ1biB0byBiZSBleGVjdXRlZFxyXG4gICAgLy8gYmVmb3JlIGl0cyAnY2F0Y2ggYWxsIGxpbmtzJyBoYW5kbGVyXHJcbiAgICAkKGRvY3VtZW50KS5vbigndGFwJywgJ1tkYXRhLXNoZWxsXScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAvLyBVc2luZyBhdHRyIHJhdGhlciB0aGFuIHRoZSAnZGF0YScgQVBJIHRvIGdldCB1cGRhdGVkXHJcbiAgICAgICAgLy8gRE9NIHZhbHVlc1xyXG4gICAgICAgIHZhciBjbWRsaW5lID0gJCh0aGlzKS5hdHRyKCdkYXRhLXNoZWxsJykgfHwgJycsXHJcbiAgICAgICAgICAgIGFyZ3MgPSBjbWRsaW5lLnNwbGl0KCcgJyksXHJcbiAgICAgICAgICAgIGNtZCA9IGFyZ3NbMF07XHJcblxyXG4gICAgICAgIGlmIChjbWQgJiYgdHlwZW9mKGFwcC5zaGVsbFtjbWRdKSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICBhcHAuc2hlbGxbY21kXS5hcHBseShhcHAuc2hlbGwsIGFyZ3Muc2xpY2UoMSkpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gQ2FuY2VsIGFueSBvdGhlciBhY3Rpb24gb24gdGhlIGxpbmssIHRvIGF2b2lkIGRvdWJsZSBsaW5raW5nIHJlc3VsdHNcclxuICAgICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBPbiBDb3Jkb3ZhL1Bob25lZ2FwIGFwcCwgc3BlY2lhbCB0YXJnZXRzIG11c3QgYmUgY2FsbGVkIHVzaW5nIHRoZSB3aW5kb3cub3BlblxyXG4gICAgLy8gQVBJIHRvIGVuc3VyZSBpcyBjb3JyZWN0bHkgb3BlbmVkIG9uIHRoZSBJbkFwcEJyb3dzZXIgKF9ibGFuaykgb3Igc3lzdGVtIGRlZmF1bHRcclxuICAgIC8vIGJyb3dzZXIgKF9zeXN0ZW0pLlxyXG4gICAgaWYgKHdpbmRvdy5jb3Jkb3ZhKSB7XHJcbiAgICAgICAgJChkb2N1bWVudCkub24oJ3RhcCcsICdbdGFyZ2V0PVwiX2JsYW5rXCJdLCBbdGFyZ2V0PVwiX3N5c3RlbVwiXScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgd2luZG93Lm9wZW4odGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSwgdGhpcy5nZXRBdHRyaWJ1dGUoJ3RhcmdldCcpKTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBXaGVuIGFuIGFjdGl2aXR5IGlzIHJlYWR5IGluIHRoZSBTaGVsbDpcclxuICAgIGFwcC5zaGVsbC5vbihhcHAuc2hlbGwuZXZlbnRzLml0ZW1SZWFkeSwgZnVuY3Rpb24oJGFjdCwgc3RhdGUpIHtcclxuICAgICAgICBcclxuICAgICAgICAvLyBDb25uZWN0IHRoZSAnYWN0aXZpdGllcycgY29udHJvbGxlcnMgdG8gdGhlaXIgdmlld3NcclxuICAgICAgICAvLyBHZXQgaW5pdGlhbGl6ZWQgYWN0aXZpdHkgZm9yIHRoZSBET00gZWxlbWVudFxyXG4gICAgICAgIHZhciBhY3ROYW1lID0gJGFjdC5kYXRhKCdhY3Rpdml0eScpO1xyXG4gICAgICAgIHZhciBhY3Rpdml0eSA9IGFwcC5nZXRBY3Rpdml0eShhY3ROYW1lKTtcclxuICAgICAgICAvLyBUcmlnZ2VyIHRoZSAnc2hvdycgbG9naWMgb2YgdGhlIGFjdGl2aXR5IGNvbnRyb2xsZXI6XHJcbiAgICAgICAgYWN0aXZpdHkuc2hvdyhzdGF0ZSk7XHJcblxyXG4gICAgICAgIC8vIFVwZGF0ZSBtZW51XHJcbiAgICAgICAgdmFyIG1lbnVJdGVtID0gYWN0aXZpdHkubWVudUl0ZW0gfHwgYWN0TmFtZTtcclxuICAgICAgICBhcHAudXBkYXRlTWVudShtZW51SXRlbSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVXBkYXRlIGFwcCBuYXZpZ2F0aW9uXHJcbiAgICAgICAgYXBwLnVwZGF0ZUFwcE5hdihhY3Rpdml0eSk7XHJcbiAgICB9KTtcclxuICAgIC8vIFdoZW4gYW4gYWN0aXZpdHkgaXMgaGlkZGVuXHJcbiAgICBhcHAuc2hlbGwub24oYXBwLnNoZWxsLmV2ZW50cy5jbG9zZWQsIGZ1bmN0aW9uKCRhY3QpIHtcclxuICAgICAgICBcclxuICAgICAgICAvLyBDb25uZWN0IHRoZSAnYWN0aXZpdGllcycgY29udHJvbGxlcnMgdG8gdGhlaXIgdmlld3NcclxuICAgICAgICB2YXIgYWN0TmFtZSA9ICRhY3QuZGF0YSgnYWN0aXZpdHknKTtcclxuICAgICAgICB2YXIgYWN0aXZpdHkgPSBhcHAuZ2V0QWN0aXZpdHkoYWN0TmFtZSk7XHJcbiAgICAgICAgLy8gVHJpZ2dlciB0aGUgJ2hpZGUnIGxvZ2ljIG9mIHRoZSBhY3Rpdml0eSBjb250cm9sbGVyOlxyXG4gICAgICAgIGlmIChhY3Rpdml0eS5oaWRlKVxyXG4gICAgICAgICAgICBhY3Rpdml0eS5oaWRlKCk7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gU2V0IG1vZGVsIGZvciB0aGUgQXBwTmF2XHJcbiAgICBrby5hcHBseUJpbmRpbmdzKHtcclxuICAgICAgICBuYXZCYXI6IGFwcC5uYXZCYXJcclxuICAgIH0sICQoJy5BcHBOYXYnKS5nZXQoMCkpO1xyXG4gICAgXHJcbiAgICB2YXIgU21hcnROYXZCYXIgPSByZXF1aXJlKCcuL2NvbXBvbmVudHMvU21hcnROYXZCYXInKTtcclxuICAgIHZhciBuYXZCYXJzID0gU21hcnROYXZCYXIuZ2V0QWxsKCk7XHJcbiAgICAvLyBDcmVhdGVzIGFuIGV2ZW50IGJ5IGxpc3RlbmluZyB0byBpdCwgc28gb3RoZXIgc2NyaXB0cyBjYW4gdHJpZ2dlclxyXG4gICAgLy8gYSAnY29udGVudENoYW5nZScgZXZlbnQgdG8gZm9yY2UgYSByZWZyZXNoIG9mIHRoZSBuYXZiYXIgKHRvIFxyXG4gICAgLy8gY2FsY3VsYXRlIGFuZCBhcHBseSBhIG5ldyBzaXplKTsgZXhwZWN0ZWQgZnJvbSBkeW5hbWljIG5hdmJhcnNcclxuICAgIC8vIHRoYXQgY2hhbmdlIGl0IGNvbnRlbnQgYmFzZWQgb24gb2JzZXJ2YWJsZXMuXHJcbiAgICBuYXZCYXJzLmZvckVhY2goZnVuY3Rpb24obmF2YmFyKSB7XHJcbiAgICAgICAgJChuYXZiYXIuZWwpLm9uKCdjb250ZW50Q2hhbmdlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIG5hdmJhci5yZWZyZXNoKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gTGlzdGVuIGZvciBtZW51IGV2ZW50cyAoY29sbGFwc2UgaW4gU21hcnROYXZCYXIpXHJcbiAgICAvLyB0byBhcHBseSB0aGUgYmFja2Ryb3BcclxuICAgIHZhciB0b2dnbGluZ0JhY2tkcm9wID0gZmFsc2U7XHJcbiAgICAkKGRvY3VtZW50KS5vbignc2hvdy5icy5jb2xsYXBzZSBoaWRlLmJzLmNvbGxhcHNlJywgJy5BcHBOYXYgLm5hdmJhci1jb2xsYXBzZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBpZiAoIXRvZ2dsaW5nQmFja2Ryb3ApIHtcclxuICAgICAgICAgICAgdG9nZ2xpbmdCYWNrZHJvcCA9IHRydWU7XHJcbiAgICAgICAgICAgIHZhciBlbmFibGVkID0gZS50eXBlID09PSAnc2hvdyc7XHJcbiAgICAgICAgICAgICQoJ2JvZHknKS50b2dnbGVDbGFzcygndXNlLWJhY2tkcm9wJywgZW5hYmxlZCk7XHJcbiAgICAgICAgICAgIC8vIEhpZGUgYW55IG90aGVyIG9wZW5lZCBjb2xsYXBzZVxyXG4gICAgICAgICAgICAkKCcuY29sbGFwc2luZywgLmNvbGxhcHNlLmluJykuY29sbGFwc2UoJ2hpZGUnKTtcclxuICAgICAgICAgICAgdG9nZ2xpbmdCYWNrZHJvcCA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEFwcCBpbml0OlxyXG4gICAgdmFyIGFsZXJ0RXJyb3IgPSBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICB3aW5kb3cuYWxlcnQoJ1RoZXJlIHdhcyBhbiBlcnJvciBsb2FkaW5nOiAnICsgZXJyICYmIGVyci5tZXNzYWdlIHx8IGVycik7XHJcbiAgICB9O1xyXG5cclxuICAgIGFwcC5tb2RlbC5pbml0KClcclxuICAgIC50aGVuKGFwcC5zaGVsbC5ydW4uYmluZChhcHAuc2hlbGwpLCBhbGVydEVycm9yKVxyXG4gICAgLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgLy8gTWFyayB0aGUgcGFnZSBhcyByZWFkeVxyXG4gICAgICAgICQoJ2h0bWwnKS5hZGRDbGFzcygnaXMtcmVhZHknKTtcclxuICAgICAgICAvLyBBcyBhcHAsIGhpZGVzIHNwbGFzaCBzY3JlZW5cclxuICAgICAgICBpZiAod2luZG93Lm5hdmlnYXRvciAmJiB3aW5kb3cubmF2aWdhdG9yLnNwbGFzaHNjcmVlbikge1xyXG4gICAgICAgICAgICB3aW5kb3cubmF2aWdhdG9yLnNwbGFzaHNjcmVlbi5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgYWxlcnRFcnJvcik7XHJcblxyXG4gICAgLy8gREVCVUdcclxuICAgIHdpbmRvdy5hcHAgPSBhcHA7XHJcbn07XHJcblxyXG4vLyBBcHAgaW5pdCBvbiBwYWdlIHJlYWR5IGFuZCBwaG9uZWdhcCByZWFkeVxyXG5pZiAod2luZG93LmNvcmRvdmEpIHtcclxuICAgIC8vIE9uIERPTS1SZWFkeSBmaXJzdFxyXG4gICAgJChmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBQYWdlIGlzIHJlYWR5LCBkZXZpY2UgaXMgdG9vP1xyXG4gICAgICAgIC8vIE5vdGU6IENvcmRvdmEgZW5zdXJlcyB0byBjYWxsIHRoZSBoYW5kbGVyIGV2ZW4gaWYgdGhlXHJcbiAgICAgICAgLy8gZXZlbnQgd2FzIGFscmVhZHkgZmlyZWQsIHNvIGlzIGdvb2QgdG8gZG8gaXQgaW5zaWRlXHJcbiAgICAgICAgLy8gdGhlIGRvbS1yZWFkeSBhbmQgd2UgYXJlIGVuc3VyaW5nIHRoYXQgZXZlcnl0aGluZyBpc1xyXG4gICAgICAgIC8vIHJlYWR5LlxyXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdkZXZpY2VyZWFkeScsIGFwcEluaXQpO1xyXG4gICAgfSk7XHJcbn0gZWxzZSB7XHJcbiAgICAvLyBPbmx5IG9uIERPTS1SZWFkeSwgZm9yIGluIGJyb3dzZXIgZGV2ZWxvcG1lbnRcclxuICAgICQoYXBwSW5pdCk7XHJcbn1cclxuIiwiLyoqXHJcbiAgICBBY2Nlc3MgdG8gdXNlIGdsb2JhbCBBcHAgTW9kYWxzXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuLyoqXHJcbiAgICBHZW5lcmF0ZXMgYSB0ZXh0IG1lc3NhZ2UsIHdpdGggbmV3bGluZXMgaWYgbmVlZGVkLCBkZXNjcmliaW5nIHRoZSBlcnJvclxyXG4gICAgb2JqZWN0IHBhc3NlZC5cclxuICAgIEBwYXJhbSBlcnI6YW55IEFzIGEgc3RyaW5nLCBpcyByZXR1cm5lZCAnYXMgaXMnOyBhcyBmYWxzeSwgaXQgcmV0dXJuIGEgZ2VuZXJpY1xyXG4gICAgbWVzc2FnZSBmb3IgJ3Vua25vdyBlcnJvcic7IGFzIG9iamVjdCwgaXQgaW52ZXN0aWdhdGUgd2hhdCB0eXBlIG9mIGVycm9yIGlzIHRvXHJcbiAgICBwcm92aWRlIHRoZSBtb3JlIG1lYW5pbmZ1bCByZXN1bHQsIHdpdGggZmFsbGJhY2sgdG8gSlNPTi5zdHJpbmdpZnkgcHJlZml4ZWRcclxuICAgIHdpdGggJ1RlY2huaWNhbCBkZXRhaWxzOicuXHJcbiAgICBPYmplY3RzIHJlY29nbml6ZWQ6XHJcbiAgICAtIFhIUi9qUXVlcnkgZm9yIEpTT04gcmVzcG9uc2VzOiBqdXN0IG9iamVjdHMgd2l0aCByZXNwb25zZUpTT04gcHJvcGVydHksIGlzXHJcbiAgICAgIHVzZWQgYXMgdGhlICdlcnInIG9iamVjdCBhbmQgcGFzc2VkIHRvIHRoZSBvdGhlciBvYmplY3QgdGVzdHMuXHJcbiAgICAtIE9iamVjdCB3aXRoICdlcnJvck1lc3NhZ2UnIChzZXJ2ZXItc2lkZSBmb3JtYXR0ZWQgZXJyb3IpLlxyXG4gICAgLSBPYmplY3Qgd2l0aCAnbWVzc2FnZScgcHJvcGVydHksIGxpa2UgdGhlIHN0YW5kYXJkIEVycm9yIGNsYXNzIGFuZCBFeGNlcHRpb24gb2JqZWN0cy5cclxuICAgIC0gT2JqZWN0IHdpdGggJ25hbWUnIHByb3BlcnR5LCBsaWtlIHRoZSBzdGFuZGFyZCBFeGNlcHRpb24gb2JqZWN0cy4gVGhlIG5hbWUsIGlmIGFueSxcclxuICAgICAgaXMgc2V0IGFzIHByZWZpeCBmb3IgdGhlICdtZXNzYWdlJyBwcm9wZXJ0eSB2YWx1ZS5cclxuICAgIC0gT2JqZWN0IHdpdGggJ2Vycm9ycycgcHJvcGVydHkuIEVhY2ggZWxlbWVudCBpbiB0aGUgYXJyYXkgb3Igb2JqZWN0IG93biBrZXlzXHJcbiAgICAgIGlzIGFwcGVuZGVkIHRvIHRoZSBlcnJvck1lc3NhZ2Ugb3IgbWVzc2FnZSBzZXBhcmF0ZWQgYnkgbmV3bGluZS5cclxuKiovXHJcbmV4cG9ydHMuZ2V0RXJyb3JNZXNzYWdlRnJvbSA9IGZ1bmN0aW9uIGdldEVycm9yTWVzc2FnZUZyb20oZXJyKSB7XHJcbiAgICAvKmpzaGludCBtYXhjb21wbGV4aXR5OjEwKi9cclxuXHJcbiAgICBpZiAoIWVycikge1xyXG4gICAgICAgIHJldHVybiAnVW5rbm93IGVycm9yJztcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZihlcnIpID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgIHJldHVybiBlcnI7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICAvLyBJZiBpcyBhIFhIUiBvYmplY3QsIHVzZSBpdHMgcmVzcG9uc2UgYXMgdGhlIGVycm9yLlxyXG4gICAgICAgIGVyciA9IGVyci5yZXNwb25zZUpTT04gfHwgZXJyO1xyXG5cclxuICAgICAgICB2YXIgbXNnID0gZXJyLm5hbWUgJiYgKGVyci5uYW1lICsgJzogJykgfHwgJyc7XHJcbiAgICAgICAgbXNnICs9IGVyci5lcnJvck1lc3NhZ2UgfHwgZXJyLm1lc3NhZ2UgfHwgJyc7XHJcblxyXG4gICAgICAgIGlmIChlcnIuZXJyb3JzKSB7XHJcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGVyci5lcnJvcnMpKSB7XHJcbiAgICAgICAgICAgICAgICBtc2cgKz0gJ1xcbicgKyBlcnIuZXJyb3JzLmpvaW4oJ1xcbicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoZXJyLmVycm9ycykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICBtc2cgKz0gJ1xcbicgKyBlcnIuZXJyb3JzW2tleV0uam9pbignXFxuJyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgbXNnICs9ICdcXG5UZWNobmljYWwgZGV0YWlsczogJyArIEpTT04uc3RyaW5naWZ5KGVycik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbXNnO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0cy5zaG93RXJyb3IgPSBmdW5jdGlvbiBzaG93RXJyb3JNb2RhbChvcHRpb25zKSB7XHJcbiAgICBcclxuICAgIHZhciBtb2RhbCA9ICQoJyNlcnJvck1vZGFsJyksXHJcbiAgICAgICAgaGVhZGVyID0gbW9kYWwuZmluZCgnI2Vycm9yTW9kYWwtbGFiZWwnKSxcclxuICAgICAgICBib2R5ID0gbW9kYWwuZmluZCgnI2Vycm9yTW9kYWwtYm9keScpO1xyXG4gICAgXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIFxyXG4gICAgdmFyIG1zZyA9IGJvZHkuZGF0YSgnZGVmYXVsdC10ZXh0Jyk7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuZXJyb3IpXHJcbiAgICAgICAgbXNnID0gZXhwb3J0cy5nZXRFcnJvck1lc3NhZ2VGcm9tKG9wdGlvbnMuZXJyb3IpO1xyXG4gICAgZWxzZSBpZiAob3B0aW9ucy5tZXNzYWdlKVxyXG4gICAgICAgIG1zZyA9IG9wdGlvbnMubWVzc2FnZTtcclxuXHJcbiAgICBib2R5Lm11bHRpbGluZShtc2cpO1xyXG5cclxuICAgIGhlYWRlci50ZXh0KG9wdGlvbnMudGl0bGUgfHwgaGVhZGVyLmRhdGEoJ2RlZmF1bHQtdGV4dCcpKTtcclxuICAgIFxyXG4gICAgbW9kYWwubW9kYWwoJ3Nob3cnKTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBTZXR1cCBvZiB0aGUgc2hlbGwgb2JqZWN0IHVzZWQgYnkgdGhlIGFwcFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGJhc2VVcmwgPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XHJcblxyXG4vL3ZhciBIaXN0b3J5ID0gcmVxdWlyZSgnLi9hcHAtc2hlbGwtaGlzdG9yeScpLmNyZWF0ZShiYXNlVXJsKTtcclxudmFyIEhpc3RvcnkgPSByZXF1aXJlKCcuL3V0aWxzL3NoZWxsL2hhc2hiYW5nSGlzdG9yeScpO1xyXG5cclxuLy8gU2hlbGwgZGVwZW5kZW5jaWVzXHJcbnZhciBzaGVsbCA9IHJlcXVpcmUoJy4vdXRpbHMvc2hlbGwvaW5kZXgnKSxcclxuICAgIFNoZWxsID0gc2hlbGwuU2hlbGwsXHJcbiAgICBEb21JdGVtc01hbmFnZXIgPSBzaGVsbC5Eb21JdGVtc01hbmFnZXI7XHJcblxyXG52YXIgaU9TID0gLyhpUGFkfGlQaG9uZXxpUG9kKS9nLnRlc3QoIG5hdmlnYXRvci51c2VyQWdlbnQgKTtcclxuXHJcbi8vIENyZWF0aW5nIHRoZSBzaGVsbDpcclxudmFyIHNoZWxsID0gbmV3IFNoZWxsKHtcclxuXHJcbiAgICAvLyBTZWxlY3RvciwgRE9NIGVsZW1lbnQgb3IgalF1ZXJ5IG9iamVjdCBwb2ludGluZ1xyXG4gICAgLy8gdGhlIHJvb3Qgb3IgY29udGFpbmVyIGZvciB0aGUgc2hlbGwgaXRlbXNcclxuICAgIHJvb3Q6ICdib2R5JyxcclxuXHJcbiAgICAvLyBJZiBpcyBub3QgaW4gdGhlIHNpdGUgcm9vdCwgdGhlIGJhc2UgVVJMIGlzIHJlcXVpcmVkOlxyXG4gICAgYmFzZVVybDogYmFzZVVybCxcclxuICAgIFxyXG4gICAgZm9yY2VIYXNoYmFuZzogdHJ1ZSxcclxuXHJcbiAgICBpbmRleE5hbWU6ICdpbmRleCcsXHJcblxyXG4gICAgLy8gV09SS0FST1VORDogVXNpbmcgdGhlICd0YXAnIGV2ZW50IGZvciBmYXN0ZXIgbW9iaWxlIGV4cGVyaWVuY2VcclxuICAgIC8vIChmcm9tIGpxdWVyeS1tb2JpbGUgZXZlbnQpIG9uIGlPUyBkZXZpY2VzLCBidXQgbGVmdFxyXG4gICAgLy8gJ2NsaWNrJyBvbiBvdGhlcnMgc2luY2UgdGhleSBoYXMgbm90IHRoZSBzbG93LWNsaWNrIHByb2JsZW1cclxuICAgIC8vIHRoYW5rcyB0byB0aGUgbWV0YS12aWV3cG9ydC5cclxuICAgIC8vIFdPUktBUk9VTkQ6IElNUE9SVEFOVCwgdXNpbmcgJ2NsaWNrJyByYXRoZXIgdGhhbiAndGFwJyBvbiBBbmRyb2lkXHJcbiAgICAvLyBwcmV2ZW50cyBhbiBhcHAgY3Jhc2ggKG9yIGdvIG91dCBhbmQgcGFnZSBub3QgZm91bmQgb24gQ2hyb21lIGZvciBBbmRyb2lkKVxyXG4gICAgLy8gYmVjYXVzZSBvZiBzb21lICdjbGlja3MnIGhhcHBlbmluZyBvblxyXG4gICAgLy8gYSBoYWxmLWxpbmstZWxlbWVudCB0YXAsIHdoZXJlIHRoZSAndGFwJyBldmVudCBkZXRlY3RzIGFzIHRhcmdldCB0aGUgbm9uLWxpbmsgYW5kIHRoZVxyXG4gICAgLy8gbGluayBnZXRzIGV4ZWN1dGVkIGFueXdheSBieSB0aGUgYnJvd3Nlciwgbm90IGNhdGNoZWQgc28gV2VidmlldyBtb3ZlcyB0byBcclxuICAgIC8vIGEgbm9uIGV4aXN0YW50IGZpbGUgKGFuZCB0aGF0cyBtYWtlIFBob25lR2FwIHRvIGNyYXNoKS5cclxuICAgIGxpbmtFdmVudDogaU9TID8gJ3RhcCcgOiAnY2xpY2snLFxyXG5cclxuICAgIC8vIE5vIG5lZWQgZm9yIGxvYWRlciwgZXZlcnl0aGluZyBjb21lcyBidW5kbGVkXHJcbiAgICBsb2FkZXI6IG51bGwsXHJcblxyXG4gICAgLy8gSGlzdG9yeSBQb2x5ZmlsbDpcclxuICAgIGhpc3Rvcnk6IEhpc3RvcnksXHJcblxyXG4gICAgLy8gQSBEb21JdGVtc01hbmFnZXIgb3IgZXF1aXZhbGVudCBvYmplY3QgaW5zdGFuY2UgbmVlZHMgdG9cclxuICAgIC8vIGJlIHByb3ZpZGVkOlxyXG4gICAgZG9tSXRlbXNNYW5hZ2VyOiBuZXcgRG9tSXRlbXNNYW5hZ2VyKHtcclxuICAgICAgICBpZEF0dHJpYnV0ZU5hbWU6ICdkYXRhLWFjdGl2aXR5J1xyXG4gICAgfSlcclxufSk7XHJcblxyXG4vLyBDYXRjaCBlcnJvcnMgb24gaXRlbS9wYWdlIGxvYWRpbmcsIHNob3dpbmcuLlxyXG5zaGVsbC5vbignZXJyb3InLCBmdW5jdGlvbihlcnIpIHtcclxuICAgIFxyXG4gICAgdmFyIHN0ciA9ICdVbmtub3cgZXJyb3InO1xyXG4gICAgaWYgKGVycikge1xyXG4gICAgICAgIGlmICh0eXBlb2YoZXJyKSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgc3RyID0gZXJyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChlcnIubWVzc2FnZSkge1xyXG4gICAgICAgICAgICBzdHIgPSBlcnIubWVzc2FnZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHN0ciA9IEpTT04uc3RyaW5naWZ5KGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFRPRE8gY2hhbmdlIHdpdGggYSBkaWFsb2cgb3Igc29tZXRoaW5nXHJcbiAgICB3aW5kb3cuYWxlcnQoc3RyKTtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNoZWxsO1xyXG4iLCIvKipcclxuICAgIEFjdGl2aXR5IGJhc2UgY2xhc3NcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpLFxyXG4gICAgTmF2QmFyID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZCYXInKTtcclxuXHJcbnJlcXVpcmUoJy4uL3V0aWxzL0Z1bmN0aW9uLnByb3RvdHlwZS5faW5oZXJpdHMnKTtcclxuXHJcbi8qKlxyXG4gICAgQWN0aXZpdHkgY2xhc3MgZGVmaW5pdGlvblxyXG4qKi9cclxuZnVuY3Rpb24gQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcclxuICAgIHRoaXMuYXBwID0gYXBwO1xyXG5cclxuICAgIC8vIERlZmF1bHQgYWNjZXNzIGxldmVsOiBhbnlvbmVcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuTm9uZTtcclxuICAgIFxyXG4gICAgLy8gVE9ETzogRnV0dXJlIHVzZSBvZiBhIHZpZXdTdGF0ZSwgcGxhaW4gb2JqZWN0IHJlcHJlc2VudGF0aW9uXHJcbiAgICAvLyBvZiBwYXJ0IG9mIHRoZSB2aWV3TW9kZWwgdG8gYmUgdXNlZCBhcyB0aGUgc3RhdGUgcGFzc2VkIHRvIHRoZVxyXG4gICAgLy8gaGlzdG9yeSBhbmQgYmV0d2VlbiBhY3Rpdml0aWVzIGNhbGxzLlxyXG4gICAgdGhpcy52aWV3U3RhdGUgPSB7fTtcclxuICAgIFxyXG4gICAgLy8gT2JqZWN0IHRvIGhvbGQgdGhlIG9wdGlvbnMgcGFzc2VkIG9uICdzaG93JyBhcyBhIHJlc3VsdFxyXG4gICAgLy8gb2YgYSByZXF1ZXN0IGZyb20gYW5vdGhlciBhY3Rpdml0eVxyXG4gICAgdGhpcy5yZXF1ZXN0RGF0YSA9IG51bGw7XHJcblxyXG4gICAgLy8gRGVmYXVsdCBuYXZCYXIgb2JqZWN0LlxyXG4gICAgdGhpcy5uYXZCYXIgPSBuZXcgTmF2QmFyKHtcclxuICAgICAgICB0aXRsZTogbnVsbCwgLy8gbnVsbCBmb3IgbG9nb1xyXG4gICAgICAgIGxlZnRBY3Rpb246IG51bGwsXHJcbiAgICAgICAgcmlnaHRBY3Rpb246IG51bGxcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBEZWxheWVkIGJpbmRpbmdzIHRvIGFsbG93IGZvciBmdXJ0aGVyIGNvbnN0cnVjdG9yIHNldC11cCBcclxuICAgIC8vIG9uIHN1YmNsYXNzZXMuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uIEFjdGl2aXR5Q29uc3RydWN0b3JEZWxheWVkKCkge1xyXG4gICAgICAgIC8vIEEgdmlldyBtb2RlbCBhbmQgYmluZGluZ3MgYmVpbmcgYXBwbGllZCBpcyBldmVyIHJlcXVpcmVkXHJcbiAgICAgICAgLy8gZXZlbiBvbiBBY3Rpdml0aWVzIHdpdGhvdXQgbmVlZCBmb3IgYSB2aWV3IG1vZGVsLCBzaW5jZVxyXG4gICAgICAgIC8vIHRoZSB1c2Ugb2YgY29tcG9uZW50cyBhbmQgdGVtcGxhdGVzLCBvciBhbnkgb3RoZXIgZGF0YS1iaW5kXHJcbiAgICAgICAgLy8gc3ludGF4LCByZXF1aXJlcyB0byBiZSBpbiBhIGNvbnRleHQgd2l0aCBiaW5kaW5nIGVuYWJsZWQ6XHJcbiAgICAgICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLnZpZXdNb2RlbCB8fCB7fSwgJGFjdGl2aXR5LmdldCgwKSk7XHJcbiAgICB9LmJpbmQodGhpcyksIDEpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFjdGl2aXR5O1xyXG5cclxuLyoqXHJcbiAgICBTZXQtdXAgdmlzdWFsaXphdGlvbiBvZiB0aGUgdmlldyB3aXRoIHRoZSBnaXZlbiBvcHRpb25zL3N0YXRlLFxyXG4gICAgd2l0aCBhIHJlc2V0IG9mIGN1cnJlbnQgc3RhdGUuXHJcbiAgICBNdXN0IGJlIGV4ZWN1dGVkIGV2ZXJ5IHRpbWUgdGhlIGFjdGl2aXR5IGlzIHB1dCBpbiB0aGUgY3VycmVudCB2aWV3LlxyXG4qKi9cclxuQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcclxuICAgIC8vIFRPRE86IG11c3Qga2VlcCB2aWV3U3RhdGUgdXAgdG8gZGF0ZSB1c2luZyBvcHRpb25zL3N0YXRlLlxyXG4gICAgXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIHRoaXMucmVxdWVzdERhdGEgPSBvcHRpb25zO1xyXG4gICAgXHJcbiAgICAvLyBFbmFibGUgcmVnaXN0ZXJlZCBoYW5kbGVyc1xyXG4gICAgLy8gVmFsaWRhdGlvbiBvZiBlYWNoIHNldHRpbmdzIG9iamVjdCBpcyBwZXJmb3JtZWRcclxuICAgIC8vIG9uIHJlZ2lzdGVyZWQsIGF2b2lkZWQgaGVyZS5cclxuICAgIGlmICh0aGlzLl9oYW5kbGVycyAmJlxyXG4gICAgICAgIHRoaXMuX2hhbmRsZXJzQXJlQ29ubmVjdGVkICE9PSB0cnVlKSB7XHJcbiAgICAgICAgdGhpcy5faGFuZGxlcnMuZm9yRWFjaChmdW5jdGlvbihzZXR0aW5ncykge1xyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiBpcyBhbiBvYnNlcnZhYmxlIHN1YnNjcmlwdGlvblxyXG4gICAgICAgICAgICBpZiAoIXNldHRpbmdzLmV2ZW50ICYmIHNldHRpbmdzLnRhcmdldC5zdWJzY3JpYmUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBzdWJzY3JpcHRpb24gPSBzZXR0aW5ncy50YXJnZXQuc3Vic2NyaWJlKHNldHRpbmdzLmhhbmRsZXIpO1xyXG4gICAgICAgICAgICAgICAgLy8gT2JzZXJ2YWJsZXMgaGFzIG5vdCBhICd1bnN1YnNjcmliZScgZnVuY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAvLyB0aGV5IHJldHVybiBhbiBvYmplY3QgdGhhdCBtdXN0IGJlICdkaXNwb3NlZCcuXHJcbiAgICAgICAgICAgICAgICAvLyBTYXZpbmcgdGhhdCB3aXRoIHNldHRpbmdzIHRvIGFsbG93ICd1bnN1YnNjcmliZScgbGF0ZXIuXHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5fc3Vic2NyaXB0aW9uID0gc3Vic2NyaXB0aW9uO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBJbm1lZGlhdGUgZXhlY3V0aW9uOiBpZiBjdXJyZW50IG9ic2VydmFibGUgdmFsdWUgaXMgZGlmZmVyZW50XHJcbiAgICAgICAgICAgICAgICAvLyB0aGFuIHByZXZpb3VzIG9uZSwgZXhlY3V0ZSB0aGUgaGFuZGxlcjpcclxuICAgICAgICAgICAgICAgIC8vICh0aGlzIGF2b2lkIHRoYXQgYSBjaGFuZ2VkIHN0YXRlIGdldCBvbWl0dGVkIGJlY2F1c2UgaGFwcGVuZWRcclxuICAgICAgICAgICAgICAgIC8vIHdoZW4gc3Vic2NyaXB0aW9uIHdhcyBvZmY7IGl0IG1lYW5zIGEgZmlyc3QgdGltZSBleGVjdXRpb24gdG9vKS5cclxuICAgICAgICAgICAgICAgIC8vIE5PVEU6ICd1bmRlZmluZWQnIHZhbHVlIG9uIG9ic2VydmFibGUgbWF5IGNhdXNlIHRoaXMgdG8gZmFsbFxyXG4gICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzLl9sYXRlc3RTdWJzY3JpYmVkVmFsdWUgIT09IHNldHRpbmdzLnRhcmdldCgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0dGluZ3MuaGFuZGxlci5jYWxsKHNldHRpbmdzLnRhcmdldCwgc2V0dGluZ3MudGFyZ2V0KCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHNldHRpbmdzLnNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy50YXJnZXQub24oc2V0dGluZ3MuZXZlbnQsIHNldHRpbmdzLnNlbGVjdG9yLCBzZXR0aW5ncy5oYW5kbGVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHNldHRpbmdzLnRhcmdldC5vbihzZXR0aW5ncy5ldmVudCwgc2V0dGluZ3MuaGFuZGxlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBUbyBhdm9pZCBkb3VibGUgY29ubmVjdGlvbnM6XHJcbiAgICAgICAgLy8gTk9URTogbWF5IGhhcHBlbiB0aGF0ICdzaG93JyBnZXRzIGNhbGxlZCBzZXZlcmFsIHRpbWVzIHdpdGhvdXQgYSAnaGlkZSdcclxuICAgICAgICAvLyBpbiBiZXR3ZWVuLCBiZWNhdXNlICdzaG93JyBhY3RzIGFzIGEgcmVmcmVzaGVyIHJpZ2h0IG5vdyBldmVuIGZyb20gc2VnbWVudFxyXG4gICAgICAgIC8vIGNoYW5nZXMgZnJvbSB0aGUgc2FtZSBhY3Rpdml0eS5cclxuICAgICAgICB0aGlzLl9oYW5kbGVyc0FyZUNvbm5lY3RlZCA9IHRydWU7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICAgIFBlcmZvcm0gdGFza3MgdG8gc3RvcCBhbnl0aGluZyBydW5uaW5nIG9yIHN0b3AgaGFuZGxlcnMgZnJvbSBsaXN0ZW5pbmcuXHJcbiAgICBNdXN0IGJlIGV4ZWN1dGVkIGV2ZXJ5IHRpbWUgdGhlIGFjdGl2aXR5IGlzIGhpZGRlbi9yZW1vdmVkIFxyXG4gICAgZnJvbSB0aGUgY3VycmVudCB2aWV3LlxyXG4qKi9cclxuQWN0aXZpdHkucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbiBoaWRlKCkge1xyXG4gICAgXHJcbiAgICAvLyBEaXNhYmxlIHJlZ2lzdGVyZWQgaGFuZGxlcnNcclxuICAgIGlmICh0aGlzLl9oYW5kbGVycykge1xyXG4gICAgICAgIHRoaXMuX2hhbmRsZXJzLmZvckVhY2goZnVuY3Rpb24oc2V0dGluZ3MpIHtcclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgaXMgYW4gb2JzZXJ2YWJsZSBzdWJzY3JpcHRpb25cclxuICAgICAgICAgICAgaWYgKHNldHRpbmdzLl9zdWJzY3JpcHRpb24pIHtcclxuICAgICAgICAgICAgICAgIHNldHRpbmdzLl9zdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgLy8gU2F2ZSBsYXRlc3Qgb2JzZXJ2YWJsZSB2YWx1ZSB0byBtYWtlIGEgY29tcGFyaXNpb25cclxuICAgICAgICAgICAgICAgIC8vIG5leHQgdGltZSBpcyBlbmFibGVkIHRvIGVuc3VyZSBpcyBleGVjdXRlZCBpZiB0aGVyZSB3YXNcclxuICAgICAgICAgICAgICAgIC8vIGEgY2hhbmdlIHdoaWxlIGRpc2FibGVkOlxyXG4gICAgICAgICAgICAgICAgc2V0dGluZ3MuX2xhdGVzdFN1YnNjcmliZWRWYWx1ZSA9IHNldHRpbmdzLnRhcmdldCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHNldHRpbmdzLnRhcmdldC5vZmYpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzZXR0aW5ncy5zZWxlY3RvcilcclxuICAgICAgICAgICAgICAgICAgICBzZXR0aW5ncy50YXJnZXQub2ZmKHNldHRpbmdzLmV2ZW50LCBzZXR0aW5ncy5zZWxlY3Rvciwgc2V0dGluZ3MuaGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgc2V0dGluZ3MudGFyZ2V0Lm9mZihzZXR0aW5ncy5ldmVudCwgc2V0dGluZ3MuaGFuZGxlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy50YXJnZXQucmVtb3ZlTGlzdGVuZXIoc2V0dGluZ3MuZXZlbnQsIHNldHRpbmdzLmhhbmRsZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5faGFuZGxlcnNBcmVDb25uZWN0ZWQgPSBmYWxzZTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gICAgUmVnaXN0ZXIgYSBoYW5kbGVyIHRoYXQgYWN0cyBvbiBhbiBldmVudCBvciBzdWJzY3JpcHRpb24gbm90aWZpY2F0aW9uLFxyXG4gICAgdGhhdCB3aWxsIGJlIGVuYWJsZWQgb24gQWN0aXZpdHkuc2hvdyBhbmQgZGlzYWJsZWQgb24gQWN0aXZpdHkuaGlkZS5cclxuXHJcbiAgICBAcGFyYW0gc2V0dGluZ3M6b2JqZWN0IHtcclxuICAgICAgICB0YXJnZXQ6IGpRdWVyeSwgRXZlbnRFbWl0dGVyLCBLbm9ja291dC5vYnNlcnZhYmxlLiBSZXF1aXJlZFxyXG4gICAgICAgIGV2ZW50OiBzdHJpbmcuIEV2ZW50IG5hbWUgKGNhbiBoYXZlIG5hbWVzcGFjZXMsIHNldmVyYWwgZXZlbnRzIGFsbG93ZWQpLiBJdHMgcmVxdWlyZWQgZXhjZXB0IHdoZW4gdGhlIHRhcmdldCBpcyBhbiBvYnNlcnZhYmxlLCB0aGVyZSBtdXN0XHJcbiAgICAgICAgICAgIGJlIG9taXR0ZWQuXHJcbiAgICAgICAgaGFuZGxlcjogRnVuY3Rpb24uIFJlcXVpcmVkLFxyXG4gICAgICAgIHNlbGVjdG9yOiBzdHJpbmcuIE9wdGlvbmFsLiBGb3IgalF1ZXJ5IGV2ZW50cyBvbmx5LCBwYXNzZWQgYXMgdGhlXHJcbiAgICAgICAgICAgIHNlbGVjdG9yIGZvciBkZWxlZ2F0ZWQgaGFuZGxlcnMuXHJcbiAgICB9XHJcbioqL1xyXG5BY3Rpdml0eS5wcm90b3R5cGUucmVnaXN0ZXJIYW5kbGVyID0gZnVuY3Rpb24gcmVnaXN0ZXJIYW5kbGVyKHNldHRpbmdzKSB7XHJcbiAgICAvKmpzaGludCBtYXhjb21wbGV4aXR5OjggKi9cclxuICAgIFxyXG4gICAgaWYgKCFzZXR0aW5ncylcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlZ2lzdGVyIHJlcXVpcmUgYSBzZXR0aW5ncyBvYmplY3QnKTtcclxuICAgIFxyXG4gICAgaWYgKCFzZXR0aW5ncy50YXJnZXQgfHwgKCFzZXR0aW5ncy50YXJnZXQub24gJiYgIXNldHRpbmdzLnRhcmdldC5zdWJzY3JpYmUpKVxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGFyZ2V0IGlzIG51bGwgb3Igbm90IGEgalF1ZXJ5LCBFdmVudEVtbWl0ZXIgb3IgT2JzZXJ2YWJsZSBvYmplY3QnKTtcclxuICAgIFxyXG4gICAgaWYgKHR5cGVvZihzZXR0aW5ncy5oYW5kbGVyKSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSGFuZGxlciBtdXN0IGJlIGEgZnVuY3Rpb24uJyk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGlmICghc2V0dGluZ3MuZXZlbnQgJiYgIXNldHRpbmdzLnRhcmdldC5zdWJzY3JpYmUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V2ZW50IGlzIG51bGw7IGl0XFwncyByZXF1aXJlZCBmb3Igbm9uIG9ic2VydmFibGUgb2JqZWN0cycpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2hhbmRsZXJzID0gdGhpcy5faGFuZGxlcnMgfHwgW107XHJcblxyXG4gICAgdGhpcy5faGFuZGxlcnMucHVzaChzZXR0aW5ncyk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIFN0YXRpYyB1dGlsaXRpZXNcclxuKiovXHJcbi8vIEZvciBjb21tb2RpdHksIGNvbW1vbiBjbGFzc2VzIGFyZSBleHBvc2VkIGFzIHN0YXRpYyBwcm9wZXJ0aWVzXHJcbkFjdGl2aXR5Lk5hdkJhciA9IE5hdkJhcjtcclxuQWN0aXZpdHkuTmF2QWN0aW9uID0gTmF2QWN0aW9uO1xyXG5cclxuLy8gUXVpY2sgY3JlYXRpb24gb2YgY29tbW9uIHR5cGVzIG9mIE5hdkJhclxyXG5BY3Rpdml0eS5jcmVhdGVTZWN0aW9uTmF2QmFyID0gZnVuY3Rpb24gY3JlYXRlU2VjdGlvbk5hdkJhcih0aXRsZSkge1xyXG4gICAgcmV0dXJuIG5ldyBOYXZCYXIoe1xyXG4gICAgICAgIHRpdGxlOiB0aXRsZSxcclxuICAgICAgICBsZWZ0QWN0aW9uOiBOYXZBY3Rpb24ubWVudU5ld0l0ZW0sXHJcbiAgICAgICAgcmlnaHRBY3Rpb246IE5hdkFjdGlvbi5tZW51SW5cclxuICAgIH0pO1xyXG59O1xyXG5cclxuQWN0aXZpdHkuY3JlYXRlU3Vic2VjdGlvbk5hdkJhciA9IGZ1bmN0aW9uIGNyZWF0ZVN1YnNlY3Rpb25OYXZCYXIodGl0bGUsIG9wdGlvbnMpIHtcclxuICAgIFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICBcclxuICAgIHZhciBnb0JhY2tPcHRpb25zID0ge1xyXG4gICAgICAgIHRleHQ6IHRpdGxlLFxyXG4gICAgICAgIGlzVGl0bGU6IHRydWVcclxuICAgIH07XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuYmFja0xpbmspIHtcclxuICAgICAgICBnb0JhY2tPcHRpb25zLmxpbmsgPSBvcHRpb25zLmJhY2tMaW5rO1xyXG4gICAgICAgIGdvQmFja09wdGlvbnMuaXNTaGVsbCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgTmF2QmFyKHtcclxuICAgICAgICB0aXRsZTogJycsIC8vIE5vIHRpdGxlXHJcbiAgICAgICAgbGVmdEFjdGlvbjogTmF2QWN0aW9uLmdvQmFjay5tb2RlbC5jbG9uZShnb0JhY2tPcHRpb25zKSxcclxuICAgICAgICByaWdodEFjdGlvbjogb3B0aW9ucy5oZWxwSWQgP1xyXG4gICAgICAgICAgICBOYXZBY3Rpb24uZ29IZWxwSW5kZXgubW9kZWwuY2xvbmUoe1xyXG4gICAgICAgICAgICAgICAgbGluazogJyMnICsgb3B0aW9ucy5oZWxwSWRcclxuICAgICAgICAgICAgfSkgOlxyXG4gICAgICAgICAgICBOYXZBY3Rpb24uZ29IZWxwSW5kZXhcclxuICAgIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBTaW5nbGV0b24gaGVscGVyXHJcbioqL1xyXG52YXIgY3JlYXRlU2luZ2xldG9uID0gZnVuY3Rpb24gY3JlYXRlU2luZ2xldG9uKEFjdGl2aXR5Q2xhc3MsICRhY3Rpdml0eSwgYXBwKSB7XHJcbiAgICBcclxuICAgIGNyZWF0ZVNpbmdsZXRvbi5pbnN0YW5jZXMgPSBjcmVhdGVTaW5nbGV0b24uaW5zdGFuY2VzIHx8IHt9O1xyXG4gICAgXHJcbiAgICBpZiAoY3JlYXRlU2luZ2xldG9uLmluc3RhbmNlc1tBY3Rpdml0eUNsYXNzLm5hbWVdIGluc3RhbmNlb2YgQWN0aXZpdHlDbGFzcykge1xyXG4gICAgICAgIHJldHVybiBjcmVhdGVTaW5nbGV0b24uaW5zdGFuY2VzW0FjdGl2aXR5Q2xhc3MubmFtZV07XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICB2YXIgcyA9IG5ldyBBY3Rpdml0eUNsYXNzKCRhY3Rpdml0eSwgYXBwKTtcclxuICAgICAgICBjcmVhdGVTaW5nbGV0b24uaW5zdGFuY2VzW0FjdGl2aXR5Q2xhc3MubmFtZV0gPSBzO1xyXG4gICAgICAgIHJldHVybiBzO1xyXG4gICAgfVxyXG59O1xyXG4vLyBFeGFtcGxlIG9mIHVzZVxyXG4vL2V4cG9ydHMuaW5pdCA9IGNyZWF0ZVNpbmdsZXRvbi5iaW5kKG51bGwsIEFjdGl2aXR5Q2xhc3MpO1xyXG5cclxuLyoqXHJcbiAgICBTdGF0aWMgbWV0aG9kIGV4dGVuZHMgdG8gaGVscCBpbmhlcml0YW5jZS5cclxuICAgIEFkZGl0aW9uYWxseSwgaXQgYWRkcyBhIHN0YXRpYyBpbml0IG1ldGhvZCByZWFkeSBmb3IgdGhlIG5ldyBjbGFzc1xyXG4gICAgdGhhdCBnZW5lcmF0ZXMvcmV0cmlldmVzIHRoZSBzaW5nbGV0b24uXHJcbioqL1xyXG5BY3Rpdml0eS5leHRlbmRzID0gZnVuY3Rpb24gZXh0ZW5kc0FjdGl2aXR5KENsYXNzRm4pIHtcclxuICAgIFxyXG4gICAgQ2xhc3NGbi5faW5oZXJpdHMoQWN0aXZpdHkpO1xyXG4gICAgXHJcbiAgICBDbGFzc0ZuLmluaXQgPSBjcmVhdGVTaW5nbGV0b24uYmluZChudWxsLCBDbGFzc0ZuKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIENsYXNzRm47XHJcbn07XHJcbiIsIi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gKiBEYXRlUGlja2VyIEpTIENvbXBvbmVudCwgd2l0aCBzZXZlcmFsXHJcbiAqIG1vZGVzIGFuZCBvcHRpb25hbCBpbmxpbmUtcGVybWFuZW50IHZpc3VhbGl6YXRpb24uXHJcbiAqXHJcbiAqIENvcHlyaWdodCAyMDE0IExvY29ub21pY3MgQ29vcC5cclxuICpcclxuICogQmFzZWQgb246XHJcbiAqIGJvb3RzdHJhcC1kYXRlcGlja2VyLmpzIFxyXG4gKiBodHRwOi8vd3d3LmV5ZWNvbi5yby9ib290c3RyYXAtZGF0ZXBpY2tlclxyXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICogQ29weXJpZ2h0IDIwMTIgU3RlZmFuIFBldHJlXHJcbiAqXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XHJcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cclxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XHJcbiAqXHJcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxyXG4gKlxyXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXHJcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcclxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXHJcbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcclxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXHJcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTsgXHJcblxyXG52YXIgY2xhc3NlcyA9IHtcclxuICAgIGNvbXBvbmVudDogJ0RhdGVQaWNrZXInLFxyXG4gICAgbW9udGhzOiAnRGF0ZVBpY2tlci1tb250aHMnLFxyXG4gICAgZGF5czogJ0RhdGVQaWNrZXItZGF5cycsXHJcbiAgICBtb250aERheTogJ2RheScsXHJcbiAgICBtb250aDogJ21vbnRoJyxcclxuICAgIHllYXI6ICd5ZWFyJyxcclxuICAgIHllYXJzOiAnRGF0ZVBpY2tlci15ZWFycydcclxufTtcclxuXHJcbi8vIFBpY2tlciBvYmplY3RcclxudmFyIERhdGVQaWNrZXIgPSBmdW5jdGlvbihlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAvKmpzaGludCBtYXhzdGF0ZW1lbnRzOjMyLG1heGNvbXBsZXhpdHk6MjQqL1xyXG4gICAgdGhpcy5lbGVtZW50ID0gJChlbGVtZW50KTtcclxuICAgIHRoaXMuZm9ybWF0ID0gRFBHbG9iYWwucGFyc2VGb3JtYXQob3B0aW9ucy5mb3JtYXR8fHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLWZvcm1hdCcpfHwnbW0vZGQveXl5eScpO1xyXG4gICAgXHJcbiAgICB0aGlzLmlzSW5wdXQgPSB0aGlzLmVsZW1lbnQuaXMoJ2lucHV0Jyk7XHJcbiAgICB0aGlzLmNvbXBvbmVudCA9IHRoaXMuZWxlbWVudC5pcygnLmRhdGUnKSA/IHRoaXMuZWxlbWVudC5maW5kKCcuYWRkLW9uJykgOiBmYWxzZTtcclxuICAgIHRoaXMuaXNQbGFjZWhvbGRlciA9IHRoaXMuZWxlbWVudC5pcygnLmNhbGVuZGFyLXBsYWNlaG9sZGVyJyk7XHJcbiAgICBcclxuICAgIHRoaXMucGlja2VyID0gJChEUEdsb2JhbC50ZW1wbGF0ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZFRvKHRoaXMuaXNQbGFjZWhvbGRlciA/IHRoaXMuZWxlbWVudCA6ICdib2R5JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLm9uKCdjbGljayB0YXAnLCAkLnByb3h5KHRoaXMuY2xpY2ssIHRoaXMpKTtcclxuICAgIC8vIFRPRE86IHRvIHJldmlldyBpZiAnY29udGFpbmVyJyBjbGFzcyBjYW4gYmUgYXZvaWRlZCwgc28gaW4gcGxhY2Vob2xkZXIgbW9kZSBnZXRzIG9wdGlvbmFsXHJcbiAgICAvLyBpZiBpcyB3YW50ZWQgY2FuIGJlIHBsYWNlZCBvbiB0aGUgcGxhY2Vob2xkZXIgZWxlbWVudCAob3IgY29udGFpbmVyLWZsdWlkIG9yIG5vdGhpbmcpXHJcbiAgICB0aGlzLnBpY2tlci5hZGRDbGFzcyh0aGlzLmlzUGxhY2Vob2xkZXIgPyAnY29udGFpbmVyJyA6ICdkcm9wZG93bi1tZW51Jyk7XHJcbiAgICBcclxuICAgIGlmICh0aGlzLmlzUGxhY2Vob2xkZXIpIHtcclxuICAgICAgICB0aGlzLnBpY2tlci5zaG93KCk7XHJcbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlJykgPT0gJ3RvZGF5Jykge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdzaG93JyxcclxuICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0aGlzLmlzSW5wdXQpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnQub24oe1xyXG4gICAgICAgICAgICBmb2N1czogJC5wcm94eSh0aGlzLnNob3csIHRoaXMpLFxyXG4gICAgICAgICAgICAvL2JsdXI6ICQucHJveHkodGhpcy5oaWRlLCB0aGlzKSxcclxuICAgICAgICAgICAga2V5dXA6ICQucHJveHkodGhpcy51cGRhdGUsIHRoaXMpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmICh0aGlzLmNvbXBvbmVudCl7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcG9uZW50Lm9uKCdjbGljayB0YXAnLCAkLnByb3h5KHRoaXMuc2hvdywgdGhpcykpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5vbignY2xpY2sgdGFwJywgJC5wcm94eSh0aGlzLnNob3csIHRoaXMpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qIFRvdWNoIGV2ZW50cyB0byBzd2lwZSBkYXRlcyAqL1xyXG4gICAgdGhpcy5lbGVtZW50XHJcbiAgICAub24oJ3N3aXBlbGVmdCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdGhpcy5tb3ZlRGF0ZSgnbmV4dCcpO1xyXG4gICAgfS5iaW5kKHRoaXMpKVxyXG4gICAgLm9uKCdzd2lwZXJpZ2h0JywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB0aGlzLm1vdmVEYXRlKCdwcmV2Jyk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIC8qIFNldC11cCB2aWV3IG1vZGUgKi9cclxuICAgIHRoaXMubWluVmlld01vZGUgPSBvcHRpb25zLm1pblZpZXdNb2RlfHx0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS1taW52aWV3bW9kZScpfHwwO1xyXG4gICAgaWYgKHR5cGVvZiB0aGlzLm1pblZpZXdNb2RlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgIHN3aXRjaCAodGhpcy5taW5WaWV3TW9kZSkge1xyXG4gICAgICAgICAgICBjYXNlICdtb250aHMnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5WaWV3TW9kZSA9IDE7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAneWVhcnMnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5WaWV3TW9kZSA9IDI7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHRoaXMubWluVmlld01vZGUgPSAwO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy52aWV3TW9kZSA9IG9wdGlvbnMudmlld01vZGV8fHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLXZpZXdtb2RlJyl8fDA7XHJcbiAgICBpZiAodHlwZW9mIHRoaXMudmlld01vZGUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgc3dpdGNoICh0aGlzLnZpZXdNb2RlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ21vbnRocyc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlID0gMTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICd5ZWFycyc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlID0gMjtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZSA9IDA7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnN0YXJ0Vmlld01vZGUgPSB0aGlzLnZpZXdNb2RlO1xyXG4gICAgdGhpcy53ZWVrU3RhcnQgPSBvcHRpb25zLndlZWtTdGFydHx8dGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtd2Vla3N0YXJ0Jyl8fDA7XHJcbiAgICB0aGlzLndlZWtFbmQgPSB0aGlzLndlZWtTdGFydCA9PT0gMCA/IDYgOiB0aGlzLndlZWtTdGFydCAtIDE7XHJcbiAgICB0aGlzLm9uUmVuZGVyID0gb3B0aW9ucy5vblJlbmRlcjtcclxuICAgIHRoaXMuZmlsbERvdygpO1xyXG4gICAgdGhpcy5maWxsTW9udGhzKCk7XHJcbiAgICB0aGlzLnVwZGF0ZSgpO1xyXG4gICAgdGhpcy5zaG93TW9kZSgpO1xyXG59O1xyXG5cclxuRGF0ZVBpY2tlci5wcm90b3R5cGUgPSB7XHJcbiAgICBjb25zdHJ1Y3RvcjogRGF0ZVBpY2tlcixcclxuICAgIFxyXG4gICAgc2hvdzogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHRoaXMucGlja2VyLnNob3coKTtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMuY29tcG9uZW50ID8gdGhpcy5jb21wb25lbnQub3V0ZXJIZWlnaHQoKSA6IHRoaXMuZWxlbWVudC5vdXRlckhlaWdodCgpO1xyXG4gICAgICAgIHRoaXMucGxhY2UoKTtcclxuICAgICAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsICQucHJveHkodGhpcy5wbGFjZSwgdGhpcykpO1xyXG4gICAgICAgIGlmIChlICkge1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpcy5pc0lucHV0KSB7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICAkKGRvY3VtZW50KS5vbignbW91c2Vkb3duJywgZnVuY3Rpb24oZXYpe1xyXG4gICAgICAgICAgICBpZiAoJChldi50YXJnZXQpLmNsb3Nlc3QoJy4nICsgY2xhc3Nlcy5jb21wb25lbnQpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5oaWRlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdzaG93JyxcclxuICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBoaWRlOiBmdW5jdGlvbigpe1xyXG4gICAgICAgIHRoaXMucGlja2VyLmhpZGUoKTtcclxuICAgICAgICAkKHdpbmRvdykub2ZmKCdyZXNpemUnLCB0aGlzLnBsYWNlKTtcclxuICAgICAgICB0aGlzLnZpZXdNb2RlID0gdGhpcy5zdGFydFZpZXdNb2RlO1xyXG4gICAgICAgIHRoaXMuc2hvd01vZGUoKTtcclxuICAgICAgICBpZiAoIXRoaXMuaXNJbnB1dCkge1xyXG4gICAgICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ21vdXNlZG93bicsIHRoaXMuaGlkZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vdGhpcy5zZXQoKTtcclxuICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdoaWRlJyxcclxuICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBmb3JtYXRlZCA9IERQR2xvYmFsLmZvcm1hdERhdGUodGhpcy5kYXRlLCB0aGlzLmZvcm1hdCk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzSW5wdXQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY29tcG9uZW50KXtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5maW5kKCdpbnB1dCcpLnByb3AoJ3ZhbHVlJywgZm9ybWF0ZWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlJywgZm9ybWF0ZWQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wcm9wKCd2YWx1ZScsIGZvcm1hdGVkKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBTZXRzIGEgZGF0ZSBhcyB2YWx1ZSBhbmQgbm90aWZ5IHdpdGggYW4gZXZlbnQuXHJcbiAgICAgICAgUGFyYW1ldGVyIGRvbnROb3RpZnkgaXMgb25seSBmb3IgY2FzZXMgd2hlcmUgdGhlIGNhbGVuZGFyIG9yXHJcbiAgICAgICAgc29tZSByZWxhdGVkIGNvbXBvbmVudCBnZXRzIGFscmVhZHkgdXBkYXRlZCBidXQgdGhlIGhpZ2hsaWdodGVkXHJcbiAgICAgICAgZGF0ZSBuZWVkcyB0byBiZSB1cGRhdGVkIHdpdGhvdXQgY3JlYXRlIGluZmluaXRlIHJlY3Vyc2lvbiBcclxuICAgICAgICBiZWNhdXNlIG9mIG5vdGlmaWNhdGlvbi4gSW4gb3RoZXIgY2FzZSwgZG9udCB1c2UuXHJcbiAgICAqKi9cclxuICAgIHNldFZhbHVlOiBmdW5jdGlvbihuZXdEYXRlLCBkb250Tm90aWZ5KSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBuZXdEYXRlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGUgPSBEUEdsb2JhbC5wYXJzZURhdGUobmV3RGF0ZSwgdGhpcy5mb3JtYXQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSA9IG5ldyBEYXRlKG5ld0RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgICAgIHRoaXMudmlld0RhdGUgPSBuZXcgRGF0ZSh0aGlzLmRhdGUuZ2V0RnVsbFllYXIoKSwgdGhpcy5kYXRlLmdldE1vbnRoKCksIDEsIDAsIDAsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChkb250Tm90aWZ5ICE9PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIC8vIE5vdGlmeTpcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICAgICAgdmlld01vZGU6IERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZ2V0VmFsdWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGU7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBtb3ZlVmFsdWU6IGZ1bmN0aW9uKGRpciwgbW9kZSkge1xyXG4gICAgICAgIC8vIGRpciBjYW4gYmU6ICdwcmV2JywgJ25leHQnXHJcbiAgICAgICAgaWYgKFsncHJldicsICduZXh0J10uaW5kZXhPZihkaXIgJiYgZGlyLnRvTG93ZXJDYXNlKCkpID09IC0xKVxyXG4gICAgICAgICAgICAvLyBObyB2YWxpZCBvcHRpb246XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gZGVmYXVsdCBtb2RlIGlzIHRoZSBjdXJyZW50IG9uZVxyXG4gICAgICAgIG1vZGUgPSBtb2RlID9cclxuICAgICAgICAgICAgRFBHbG9iYWwubW9kZXNTZXRbbW9kZV0gOlxyXG4gICAgICAgICAgICBEUEdsb2JhbC5tb2Rlc1t0aGlzLnZpZXdNb2RlXTtcclxuXHJcbiAgICAgICAgdGhpcy5kYXRlWydzZXQnICsgbW9kZS5uYXZGbmNdLmNhbGwoXHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSxcclxuICAgICAgICAgICAgdGhpcy5kYXRlWydnZXQnICsgbW9kZS5uYXZGbmNdLmNhbGwodGhpcy5kYXRlKSArIFxyXG4gICAgICAgICAgICBtb2RlLm5hdlN0ZXAgKiAoZGlyID09PSAncHJldicgPyAtMSA6IDEpXHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLnNldFZhbHVlKHRoaXMuZGF0ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0ZTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIHBsYWNlOiBmdW5jdGlvbigpe1xyXG4gICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLmNvbXBvbmVudCA/IHRoaXMuY29tcG9uZW50Lm9mZnNldCgpIDogdGhpcy5lbGVtZW50Lm9mZnNldCgpO1xyXG4gICAgICAgIHRoaXMucGlja2VyLmNzcyh7XHJcbiAgICAgICAgICAgIHRvcDogb2Zmc2V0LnRvcCArIHRoaXMuaGVpZ2h0LFxyXG4gICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbihuZXdEYXRlKXtcclxuICAgICAgICB0aGlzLmRhdGUgPSBEUEdsb2JhbC5wYXJzZURhdGUoXHJcbiAgICAgICAgICAgIHR5cGVvZiBuZXdEYXRlID09PSAnc3RyaW5nJyA/IG5ld0RhdGUgOiAodGhpcy5pc0lucHV0ID8gdGhpcy5lbGVtZW50LnByb3AoJ3ZhbHVlJykgOiB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZScpKSxcclxuICAgICAgICAgICAgdGhpcy5mb3JtYXRcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMudmlld0RhdGUgPSBuZXcgRGF0ZSh0aGlzLmRhdGUuZ2V0RnVsbFllYXIoKSwgdGhpcy5kYXRlLmdldE1vbnRoKCksIDEsIDAsIDAsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZmlsbERvdzogZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgZG93Q250ID0gdGhpcy53ZWVrU3RhcnQ7XHJcbiAgICAgICAgdmFyIGh0bWwgPSAnPHRyPic7XHJcbiAgICAgICAgd2hpbGUgKGRvd0NudCA8IHRoaXMud2Vla1N0YXJ0ICsgNykge1xyXG4gICAgICAgICAgICBodG1sICs9ICc8dGggY2xhc3M9XCJkb3dcIj4nK0RQR2xvYmFsLmRhdGVzLmRheXNNaW5bKGRvd0NudCsrKSU3XSsnPC90aD4nO1xyXG4gICAgICAgIH1cclxuICAgICAgICBodG1sICs9ICc8L3RyPic7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLmRheXMgKyAnIHRoZWFkJykuYXBwZW5kKGh0bWwpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZmlsbE1vbnRoczogZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgaHRtbCA9ICcnO1xyXG4gICAgICAgIHZhciBpID0gMDtcclxuICAgICAgICB3aGlsZSAoaSA8IDEyKSB7XHJcbiAgICAgICAgICAgIGh0bWwgKz0gJzxzcGFuIGNsYXNzPVwiJyArIGNsYXNzZXMubW9udGggKyAnXCI+JytEUEdsb2JhbC5kYXRlcy5tb250aHNTaG9ydFtpKytdKyc8L3NwYW4+JztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLm1vbnRocyArICcgdGQnKS5hcHBlbmQoaHRtbCk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBmaWxsOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAvKmpzaGludCBtYXhzdGF0ZW1lbnRzOjY2LCBtYXhjb21wbGV4aXR5OjI4Ki9cclxuICAgICAgICB2YXIgZCA9IG5ldyBEYXRlKHRoaXMudmlld0RhdGUpLFxyXG4gICAgICAgICAgICB5ZWFyID0gZC5nZXRGdWxsWWVhcigpLFxyXG4gICAgICAgICAgICBtb250aCA9IGQuZ2V0TW9udGgoKSxcclxuICAgICAgICAgICAgY3VycmVudERhdGUgPSB0aGlzLmRhdGUudmFsdWVPZigpO1xyXG4gICAgICAgIHRoaXMucGlja2VyXHJcbiAgICAgICAgLmZpbmQoJy4nICsgY2xhc3Nlcy5kYXlzICsgJyB0aDplcSgxKScpXHJcbiAgICAgICAgLmh0bWwoRFBHbG9iYWwuZGF0ZXMubW9udGhzW21vbnRoXSArICcgJyArIHllYXIpO1xyXG4gICAgICAgIHZhciBwcmV2TW9udGggPSBuZXcgRGF0ZSh5ZWFyLCBtb250aC0xLCAyOCwwLDAsMCwwKSxcclxuICAgICAgICAgICAgZGF5ID0gRFBHbG9iYWwuZ2V0RGF5c0luTW9udGgocHJldk1vbnRoLmdldEZ1bGxZZWFyKCksIHByZXZNb250aC5nZXRNb250aCgpKTtcclxuICAgICAgICBwcmV2TW9udGguc2V0RGF0ZShkYXkpO1xyXG4gICAgICAgIHByZXZNb250aC5zZXREYXRlKGRheSAtIChwcmV2TW9udGguZ2V0RGF5KCkgLSB0aGlzLndlZWtTdGFydCArIDcpJTcpO1xyXG4gICAgICAgIHZhciBuZXh0TW9udGggPSBuZXcgRGF0ZShwcmV2TW9udGgpO1xyXG4gICAgICAgIG5leHRNb250aC5zZXREYXRlKG5leHRNb250aC5nZXREYXRlKCkgKyA0Mik7XHJcbiAgICAgICAgbmV4dE1vbnRoID0gbmV4dE1vbnRoLnZhbHVlT2YoKTtcclxuICAgICAgICB2YXIgaHRtbCA9IFtdO1xyXG4gICAgICAgIHZhciBjbHNOYW1lLFxyXG4gICAgICAgICAgICBwcmV2WSxcclxuICAgICAgICAgICAgcHJldk07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIGlmICh0aGlzLl9kYXlzQ3JlYXRlZCAhPT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAvLyBDcmVhdGUgaHRtbCAoZmlyc3QgdGltZSBvbmx5KVxyXG4gICAgICAgXHJcbiAgICAgICAgICAgIHdoaWxlKHByZXZNb250aC52YWx1ZU9mKCkgPCBuZXh0TW9udGgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGguZ2V0RGF5KCkgPT09IHRoaXMud2Vla1N0YXJ0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8dHI+Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjbHNOYW1lID0gdGhpcy5vblJlbmRlcihwcmV2TW9udGgpO1xyXG4gICAgICAgICAgICAgICAgcHJldlkgPSBwcmV2TW9udGguZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICAgICAgICAgIHByZXZNID0gcHJldk1vbnRoLmdldE1vbnRoKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoKHByZXZNIDwgbW9udGggJiYgIHByZXZZID09PSB5ZWFyKSB8fCAgcHJldlkgPCB5ZWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIG9sZCc7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKChwcmV2TSA+IG1vbnRoICYmIHByZXZZID09PSB5ZWFyKSB8fCBwcmV2WSA+IHllYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgbmV3JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGgudmFsdWVPZigpID09PSBjdXJyZW50RGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBhY3RpdmUnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8dGQgY2xhc3M9XCInICsgY2xhc3Nlcy5tb250aERheSArICcgJyArIGNsc05hbWUrJ1wiPicrcHJldk1vbnRoLmdldERhdGUoKSArICc8L3RkPicpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZNb250aC5nZXREYXkoKSA9PT0gdGhpcy53ZWVrRW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8L3RyPicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcHJldk1vbnRoLnNldERhdGUocHJldk1vbnRoLmdldERhdGUoKSsxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLmRheXMgKyAnIHRib2R5JykuZW1wdHkoKS5hcHBlbmQoaHRtbC5qb2luKCcnKSk7XHJcbiAgICAgICAgICAgIHRoaXMuX2RheXNDcmVhdGVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFVwZGF0ZSBkYXlzIHZhbHVlc1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHdlZWtUciA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy5kYXlzICsgJyB0Ym9keSB0cjpmaXJzdC1jaGlsZCgpJyk7XHJcbiAgICAgICAgICAgIHZhciBkYXlUZCA9IG51bGw7XHJcbiAgICAgICAgICAgIHdoaWxlKHByZXZNb250aC52YWx1ZU9mKCkgPCBuZXh0TW9udGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50V2Vla0RheUluZGV4ID0gcHJldk1vbnRoLmdldERheSgpIC0gdGhpcy53ZWVrU3RhcnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgY2xzTmFtZSA9IHRoaXMub25SZW5kZXIocHJldk1vbnRoKTtcclxuICAgICAgICAgICAgICAgIHByZXZZID0gcHJldk1vbnRoLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgICAgICAgICBwcmV2TSA9IHByZXZNb250aC5nZXRNb250aCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKChwcmV2TSA8IG1vbnRoICYmICBwcmV2WSA9PT0geWVhcikgfHwgIHByZXZZIDwgeWVhcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBvbGQnO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgocHJldk0gPiBtb250aCAmJiBwcmV2WSA9PT0geWVhcikgfHwgcHJldlkgPiB5ZWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIG5ldyc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAocHJldk1vbnRoLnZhbHVlT2YoKSA9PT0gY3VycmVudERhdGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgYWN0aXZlJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vaHRtbC5wdXNoKCc8dGQgY2xhc3M9XCJkYXkgJytjbHNOYW1lKydcIj4nK3ByZXZNb250aC5nZXREYXRlKCkgKyAnPC90ZD4nKTtcclxuICAgICAgICAgICAgICAgIGRheVRkID0gd2Vla1RyLmZpbmQoJ3RkOmVxKCcgKyBjdXJyZW50V2Vla0RheUluZGV4ICsgJyknKTtcclxuICAgICAgICAgICAgICAgIGRheVRkXHJcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnZGF5ICcgKyBjbHNOYW1lKVxyXG4gICAgICAgICAgICAgICAgLnRleHQocHJldk1vbnRoLmdldERhdGUoKSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIE5leHQgd2Vlaz9cclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGguZ2V0RGF5KCkgPT09IHRoaXMud2Vla0VuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdlZWtUciA9IHdlZWtUci5uZXh0KCd0cicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcHJldk1vbnRoLnNldERhdGUocHJldk1vbnRoLmdldERhdGUoKSsxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGN1cnJlbnRZZWFyID0gdGhpcy5kYXRlLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIG1vbnRocyA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy5tb250aHMpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ3RoOmVxKDEpJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmh0bWwoeWVhcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmVuZCgpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ3NwYW4nKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgaWYgKGN1cnJlbnRZZWFyID09PSB5ZWFyKSB7XHJcbiAgICAgICAgICAgIG1vbnRocy5lcSh0aGlzLmRhdGUuZ2V0TW9udGgoKSkuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBodG1sID0gJyc7XHJcbiAgICAgICAgeWVhciA9IHBhcnNlSW50KHllYXIvMTAsIDEwKSAqIDEwO1xyXG4gICAgICAgIHZhciB5ZWFyQ29udCA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy55ZWFycylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKCd0aDplcSgxKScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRleHQoeWVhciArICctJyArICh5ZWFyICsgOSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmVuZCgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgndGQnKTtcclxuICAgICAgICBcclxuICAgICAgICB5ZWFyIC09IDE7XHJcbiAgICAgICAgdmFyIGk7XHJcbiAgICAgICAgaWYgKHRoaXMuX3llYXJzQ3JlYXRlZCAhPT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgZm9yIChpID0gLTE7IGkgPCAxMTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8c3BhbiBjbGFzcz1cIicgKyBjbGFzc2VzLnllYXIgKyAoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykrKGN1cnJlbnRZZWFyID09PSB5ZWFyID8gJyBhY3RpdmUnIDogJycpKydcIj4nK3llYXIrJzwvc3Bhbj4nO1xyXG4gICAgICAgICAgICAgICAgeWVhciArPSAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB5ZWFyQ29udC5odG1sKGh0bWwpO1xyXG4gICAgICAgICAgICB0aGlzLl95ZWFyc0NyZWF0ZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciB5ZWFyU3BhbiA9IHllYXJDb250LmZpbmQoJ3NwYW46Zmlyc3QtY2hpbGQoKScpO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAtMTsgaSA8IDExOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIC8vaHRtbCArPSAnPHNwYW4gY2xhc3M9XCJ5ZWFyJysoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykrKGN1cnJlbnRZZWFyID09PSB5ZWFyID8gJyBhY3RpdmUnIDogJycpKydcIj4nK3llYXIrJzwvc3Bhbj4nO1xyXG4gICAgICAgICAgICAgICAgeWVhclNwYW5cclxuICAgICAgICAgICAgICAgIC50ZXh0KHllYXIpXHJcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAneWVhcicgKyAoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykgKyAoY3VycmVudFllYXIgPT09IHllYXIgPyAnIGFjdGl2ZScgOiAnJykpO1xyXG4gICAgICAgICAgICAgICAgeWVhciArPSAxO1xyXG4gICAgICAgICAgICAgICAgeWVhclNwYW4gPSB5ZWFyU3Bhbi5uZXh0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBtb3ZlRGF0ZTogZnVuY3Rpb24oZGlyLCBtb2RlKSB7XHJcbiAgICAgICAgLy8gZGlyIGNhbiBiZTogJ3ByZXYnLCAnbmV4dCdcclxuICAgICAgICBpZiAoWydwcmV2JywgJ25leHQnXS5pbmRleE9mKGRpciAmJiBkaXIudG9Mb3dlckNhc2UoKSkgPT0gLTEpXHJcbiAgICAgICAgICAgIC8vIE5vIHZhbGlkIG9wdGlvbjpcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAvLyBkZWZhdWx0IG1vZGUgaXMgdGhlIGN1cnJlbnQgb25lXHJcbiAgICAgICAgbW9kZSA9IG1vZGUgfHwgdGhpcy52aWV3TW9kZTtcclxuXHJcbiAgICAgICAgdGhpcy52aWV3RGF0ZVsnc2V0JytEUEdsb2JhbC5tb2Rlc1ttb2RlXS5uYXZGbmNdLmNhbGwoXHJcbiAgICAgICAgICAgIHRoaXMudmlld0RhdGUsXHJcbiAgICAgICAgICAgIHRoaXMudmlld0RhdGVbJ2dldCcrRFBHbG9iYWwubW9kZXNbbW9kZV0ubmF2Rm5jXS5jYWxsKHRoaXMudmlld0RhdGUpICsgXHJcbiAgICAgICAgICAgIERQR2xvYmFsLm1vZGVzW21vZGVdLm5hdlN0ZXAgKiAoZGlyID09PSAncHJldicgPyAtMSA6IDEpXHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLmZpbGwoKTtcclxuICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGljazogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIC8qanNoaW50IG1heGNvbXBsZXhpdHk6MTYqL1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHZhciB0YXJnZXQgPSAkKGUudGFyZ2V0KS5jbG9zZXN0KCdzcGFuLCB0ZCwgdGgnKTtcclxuICAgICAgICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICB2YXIgbW9udGgsIHllYXI7XHJcbiAgICAgICAgICAgIHN3aXRjaCh0YXJnZXRbMF0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAndGgnOlxyXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCh0YXJnZXRbMF0uY2xhc3NOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N3aXRjaCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dNb2RlKDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3ByZXYnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICduZXh0JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZURhdGUodGFyZ2V0WzBdLmNsYXNzTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdzcGFuJzpcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmlzKCcuJyArIGNsYXNzZXMubW9udGgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vbnRoID0gdGFyZ2V0LnBhcmVudCgpLmZpbmQoJ3NwYW4nKS5pbmRleCh0YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlLnNldE1vbnRoKG1vbnRoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ZWFyID0gcGFyc2VJbnQodGFyZ2V0LnRleHQoKSwgMTApfHwwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlLnNldEZ1bGxZZWFyKHllYXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy52aWV3TW9kZSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSh0aGlzLnZpZXdEYXRlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld01vZGU6IERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd01vZGUoLTEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd0ZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldC5pcygnLmRheScpICYmICF0YXJnZXQuaXMoJy5kaXNhYmxlZCcpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRheSA9IHBhcnNlSW50KHRhcmdldC50ZXh0KCksIDEwKXx8MTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggPSB0aGlzLnZpZXdEYXRlLmdldE1vbnRoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuaXMoJy5vbGQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggLT0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YXJnZXQuaXMoJy5uZXcnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggKz0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ZWFyID0gdGhpcy52aWV3RGF0ZS5nZXRGdWxsWWVhcigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgZGF5LDAsMCwwLDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGgsIE1hdGgubWluKDI4LCBkYXkpLDAsMCwwLDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld01vZGU6IERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgbW91c2Vkb3duOiBmdW5jdGlvbihlKXtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIHNob3dNb2RlOiBmdW5jdGlvbihkaXIpIHtcclxuICAgICAgICBpZiAoZGlyKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlld01vZGUgPSBNYXRoLm1heCh0aGlzLm1pblZpZXdNb2RlLCBNYXRoLm1pbigyLCB0aGlzLnZpZXdNb2RlICsgZGlyKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucGlja2VyLmZpbmQoJz5kaXYnKS5oaWRlKCkuZmlsdGVyKCcuJyArIGNsYXNzZXMuY29tcG9uZW50ICsgJy0nICsgRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZSkuc2hvdygpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuJC5mbi5kYXRlcGlja2VyID0gZnVuY3Rpb24gKCBvcHRpb24gKSB7XHJcbiAgICB2YXIgdmFscyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XHJcbiAgICB2YXIgcmV0dXJuZWQ7XHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXHJcbiAgICAgICAgICAgIGRhdGEgPSAkdGhpcy5kYXRhKCdkYXRlcGlja2VyJyksXHJcbiAgICAgICAgICAgIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09PSAnb2JqZWN0JyAmJiBvcHRpb247XHJcbiAgICAgICAgaWYgKCFkYXRhKSB7XHJcbiAgICAgICAgICAgICR0aGlzLmRhdGEoJ2RhdGVwaWNrZXInLCAoZGF0YSA9IG5ldyBEYXRlUGlja2VyKHRoaXMsICQuZXh0ZW5kKHt9LCAkLmZuLmRhdGVwaWNrZXIuZGVmYXVsdHMsb3B0aW9ucykpKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgcmV0dXJuZWQgPSBkYXRhW29wdGlvbl0uYXBwbHkoZGF0YSwgdmFscyk7XHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgdmFsdWUgcmV0dXJuZWQgYnkgdGhlIG1ldGhvZD9cclxuICAgICAgICAgICAgaWYgKHR5cGVvZihyZXR1cm5lZCAhPT0gJ3VuZGVmaW5lZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBHbyBvdXQgdGhlIGxvb3AgdG8gcmV0dXJuIHRoZSB2YWx1ZSBmcm9tIHRoZSBmaXJzdFxyXG4gICAgICAgICAgICAgICAgLy8gZWxlbWVudC1tZXRob2QgZXhlY3V0aW9uXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gRm9sbG93IG5leHQgbG9vcCBpdGVtXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBpZiAodHlwZW9mKHJldHVybmVkKSAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgcmV0dXJuIHJldHVybmVkO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIC8vIGNoYWluaW5nOlxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuJC5mbi5kYXRlcGlja2VyLmRlZmF1bHRzID0ge1xyXG4gICAgb25SZW5kZXI6IGZ1bmN0aW9uKC8qZGF0ZSovKSB7XHJcbiAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgfVxyXG59O1xyXG4kLmZuLmRhdGVwaWNrZXIuQ29uc3RydWN0b3IgPSBEYXRlUGlja2VyO1xyXG5cclxudmFyIERQR2xvYmFsID0ge1xyXG4gICAgbW9kZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNsc05hbWU6ICdkYXlzJyxcclxuICAgICAgICAgICAgbmF2Rm5jOiAnTW9udGgnLFxyXG4gICAgICAgICAgICBuYXZTdGVwOiAxXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNsc05hbWU6ICdtb250aHMnLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdGdWxsWWVhcicsXHJcbiAgICAgICAgICAgIG5hdlN0ZXA6IDFcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xzTmFtZTogJ3llYXJzJyxcclxuICAgICAgICAgICAgbmF2Rm5jOiAnRnVsbFllYXInLFxyXG4gICAgICAgICAgICBuYXZTdGVwOiAxMFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjbHNOYW1lOiAnZGF5JyxcclxuICAgICAgICAgICAgbmF2Rm5jOiAnRGF0ZScsXHJcbiAgICAgICAgICAgIG5hdlN0ZXA6IDFcclxuICAgICAgICB9XHJcbiAgICBdLFxyXG4gICAgZGF0ZXM6e1xyXG4gICAgICAgIGRheXM6IFtcIlN1bmRheVwiLCBcIk1vbmRheVwiLCBcIlR1ZXNkYXlcIiwgXCJXZWRuZXNkYXlcIiwgXCJUaHVyc2RheVwiLCBcIkZyaWRheVwiLCBcIlNhdHVyZGF5XCIsIFwiU3VuZGF5XCJdLFxyXG4gICAgICAgIGRheXNTaG9ydDogW1wiU3VuXCIsIFwiTW9uXCIsIFwiVHVlXCIsIFwiV2VkXCIsIFwiVGh1XCIsIFwiRnJpXCIsIFwiU2F0XCIsIFwiU3VuXCJdLFxyXG4gICAgICAgIGRheXNNaW46IFtcIlN1XCIsIFwiTW9cIiwgXCJUdVwiLCBcIldlXCIsIFwiVGhcIiwgXCJGclwiLCBcIlNhXCIsIFwiU3VcIl0sXHJcbiAgICAgICAgbW9udGhzOiBbXCJKYW51YXJ5XCIsIFwiRmVicnVhcnlcIiwgXCJNYXJjaFwiLCBcIkFwcmlsXCIsIFwiTWF5XCIsIFwiSnVuZVwiLCBcIkp1bHlcIiwgXCJBdWd1c3RcIiwgXCJTZXB0ZW1iZXJcIiwgXCJPY3RvYmVyXCIsIFwiTm92ZW1iZXJcIiwgXCJEZWNlbWJlclwiXSxcclxuICAgICAgICBtb250aHNTaG9ydDogW1wiSmFuXCIsIFwiRmViXCIsIFwiTWFyXCIsIFwiQXByXCIsIFwiTWF5XCIsIFwiSnVuXCIsIFwiSnVsXCIsIFwiQXVnXCIsIFwiU2VwXCIsIFwiT2N0XCIsIFwiTm92XCIsIFwiRGVjXCJdXHJcbiAgICB9LFxyXG4gICAgaXNMZWFwWWVhcjogZnVuY3Rpb24gKHllYXIpIHtcclxuICAgICAgICByZXR1cm4gKCgoeWVhciAlIDQgPT09IDApICYmICh5ZWFyICUgMTAwICE9PSAwKSkgfHwgKHllYXIgJSA0MDAgPT09IDApKTtcclxuICAgIH0sXHJcbiAgICBnZXREYXlzSW5Nb250aDogZnVuY3Rpb24gKHllYXIsIG1vbnRoKSB7XHJcbiAgICAgICAgcmV0dXJuIFszMSwgKERQR2xvYmFsLmlzTGVhcFllYXIoeWVhcikgPyAyOSA6IDI4KSwgMzEsIDMwLCAzMSwgMzAsIDMxLCAzMSwgMzAsIDMxLCAzMCwgMzFdW21vbnRoXTtcclxuICAgIH0sXHJcbiAgICBwYXJzZUZvcm1hdDogZnVuY3Rpb24oZm9ybWF0KXtcclxuICAgICAgICB2YXIgc2VwYXJhdG9yID0gZm9ybWF0Lm1hdGNoKC9bLlxcL1xcLVxcc10uKj8vKSxcclxuICAgICAgICAgICAgcGFydHMgPSBmb3JtYXQuc3BsaXQoL1xcVysvKTtcclxuICAgICAgICBpZiAoIXNlcGFyYXRvciB8fCAhcGFydHMgfHwgcGFydHMubGVuZ3RoID09PSAwKXtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBkYXRlIGZvcm1hdC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7c2VwYXJhdG9yOiBzZXBhcmF0b3IsIHBhcnRzOiBwYXJ0c307XHJcbiAgICB9LFxyXG4gICAgcGFyc2VEYXRlOiBmdW5jdGlvbihkYXRlLCBmb3JtYXQpIHtcclxuICAgICAgICAvKmpzaGludCBtYXhjb21wbGV4aXR5OjExKi9cclxuICAgICAgICB2YXIgcGFydHMgPSBkYXRlLnNwbGl0KGZvcm1hdC5zZXBhcmF0b3IpLFxyXG4gICAgICAgICAgICB2YWw7XHJcbiAgICAgICAgZGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgZGF0ZS5zZXRIb3VycygwKTtcclxuICAgICAgICBkYXRlLnNldE1pbnV0ZXMoMCk7XHJcbiAgICAgICAgZGF0ZS5zZXRTZWNvbmRzKDApO1xyXG4gICAgICAgIGRhdGUuc2V0TWlsbGlzZWNvbmRzKDApO1xyXG4gICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPT09IGZvcm1hdC5wYXJ0cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIHllYXIgPSBkYXRlLmdldEZ1bGxZZWFyKCksIGRheSA9IGRhdGUuZ2V0RGF0ZSgpLCBtb250aCA9IGRhdGUuZ2V0TW9udGgoKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaT0wLCBjbnQgPSBmb3JtYXQucGFydHMubGVuZ3RoOyBpIDwgY250OyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhbCA9IHBhcnNlSW50KHBhcnRzW2ldLCAxMCl8fDE7XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2goZm9ybWF0LnBhcnRzW2ldKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZGQnOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2QnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXkgPSB2YWw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGUuc2V0RGF0ZSh2YWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdtbSc6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vbnRoID0gdmFsIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZS5zZXRNb250aCh2YWwgLSAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAneXknOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ZWFyID0gMjAwMCArIHZhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZS5zZXRGdWxsWWVhcigyMDAwICsgdmFsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAneXl5eSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHllYXIgPSB2YWw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGUuc2V0RnVsbFllYXIodmFsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZGF0ZSA9IG5ldyBEYXRlKHllYXIsIG1vbnRoLCBkYXksIDAgLDAgLDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0ZTtcclxuICAgIH0sXHJcbiAgICBmb3JtYXREYXRlOiBmdW5jdGlvbihkYXRlLCBmb3JtYXQpe1xyXG4gICAgICAgIHZhciB2YWwgPSB7XHJcbiAgICAgICAgICAgIGQ6IGRhdGUuZ2V0RGF0ZSgpLFxyXG4gICAgICAgICAgICBtOiBkYXRlLmdldE1vbnRoKCkgKyAxLFxyXG4gICAgICAgICAgICB5eTogZGF0ZS5nZXRGdWxsWWVhcigpLnRvU3RyaW5nKCkuc3Vic3RyaW5nKDIpLFxyXG4gICAgICAgICAgICB5eXl5OiBkYXRlLmdldEZ1bGxZZWFyKClcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhbC5kZCA9ICh2YWwuZCA8IDEwID8gJzAnIDogJycpICsgdmFsLmQ7XHJcbiAgICAgICAgdmFsLm1tID0gKHZhbC5tIDwgMTAgPyAnMCcgOiAnJykgKyB2YWwubTtcclxuICAgICAgICBkYXRlID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaT0wLCBjbnQgPSBmb3JtYXQucGFydHMubGVuZ3RoOyBpIDwgY250OyBpKyspIHtcclxuICAgICAgICAgICAgZGF0ZS5wdXNoKHZhbFtmb3JtYXQucGFydHNbaV1dKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGRhdGUuam9pbihmb3JtYXQuc2VwYXJhdG9yKTtcclxuICAgIH0sXHJcbiAgICBoZWFkVGVtcGxhdGU6ICc8dGhlYWQ+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzx0cj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0aCBjbGFzcz1cInByZXZcIj4mbHNhcXVvOzwvdGg+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGggY29sc3Bhbj1cIjVcIiBjbGFzcz1cInN3aXRjaFwiPjwvdGg+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGggY2xhc3M9XCJuZXh0XCI+JnJzYXF1bzs8L3RoPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L3RyPicrXHJcbiAgICAgICAgICAgICAgICAgICAgJzwvdGhlYWQ+JyxcclxuICAgIGNvbnRUZW1wbGF0ZTogJzx0Ym9keT48dHI+PHRkIGNvbHNwYW49XCI3XCI+PC90ZD48L3RyPjwvdGJvZHk+J1xyXG59O1xyXG5EUEdsb2JhbC50ZW1wbGF0ZSA9ICc8ZGl2IGNsYXNzPVwiJyArIGNsYXNzZXMuY29tcG9uZW50ICsgJ1wiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiJyArIGNsYXNzZXMuZGF5cyArICdcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0YWJsZSBjbGFzcz1cIiB0YWJsZS1jb25kZW5zZWRcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERQR2xvYmFsLmhlYWRUZW1wbGF0ZStcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRib2R5PjwvdGJvZHk+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L3RhYmxlPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cIicgKyBjbGFzc2VzLm1vbnRocyArICdcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0YWJsZSBjbGFzcz1cInRhYmxlLWNvbmRlbnNlZFwiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRFBHbG9iYWwuaGVhZFRlbXBsYXRlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERQR2xvYmFsLmNvbnRUZW1wbGF0ZStcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L3RhYmxlPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cIicgKyBjbGFzc2VzLnllYXJzICsgJ1wiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRhYmxlIGNsYXNzPVwidGFibGUtY29uZGVuc2VkXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEUEdsb2JhbC5oZWFkVGVtcGxhdGUrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRFBHbG9iYWwuY29udFRlbXBsYXRlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvdGFibGU+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicrXHJcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2Pic7XHJcbkRQR2xvYmFsLm1vZGVzU2V0ID0ge1xyXG4gICAgJ2RhdGUnOiBEUEdsb2JhbC5tb2Rlc1szXSxcclxuICAgICdtb250aCc6IERQR2xvYmFsLm1vZGVzWzBdLFxyXG4gICAgJ3llYXInOiBEUEdsb2JhbC5tb2Rlc1sxXSxcclxuICAgICdkZWNhZGUnOiBEUEdsb2JhbC5tb2Rlc1syXVxyXG59O1xyXG5cclxuLyoqIFB1YmxpYyBBUEkgKiovXHJcbmV4cG9ydHMuRGF0ZVBpY2tlciA9IERhdGVQaWNrZXI7XHJcbmV4cG9ydHMuZGVmYXVsdHMgPSBEUEdsb2JhbDtcclxuZXhwb3J0cy51dGlscyA9IERQR2xvYmFsO1xyXG4iLCIvKipcclxuICAgIFNtYXJ0TmF2QmFyIGNvbXBvbmVudC5cclxuICAgIFJlcXVpcmVzIGl0cyBDU1MgY291bnRlcnBhcnQuXHJcbiAgICBcclxuICAgIENyZWF0ZWQgYmFzZWQgb24gdGhlIHByb2plY3Q6XHJcbiAgICBcclxuICAgIFByb2plY3QtVHlzb25cclxuICAgIFdlYnNpdGU6IGh0dHBzOi8vZ2l0aHViLmNvbS9jMnByb2RzL1Byb2plY3QtVHlzb25cclxuICAgIEF1dGhvcjogYzJwcm9kc1xyXG4gICAgTGljZW5zZTpcclxuICAgIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxyXG4gICAgQ29weXJpZ2h0IChjKSAyMDEzIGMycHJvZHNcclxuICAgIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2ZcclxuICAgIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW5cclxuICAgIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG9cclxuICAgIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mXHJcbiAgICB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sXHJcbiAgICBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcclxuICAgIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxyXG4gICAgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cclxuICAgIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcclxuICAgIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTXHJcbiAgICBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1JcclxuICAgIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUlxyXG4gICAgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU5cclxuICAgIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuLyoqXHJcbiAgICBJbnRlcm5hbCB1dGlsaXR5LlxyXG4gICAgUmVtb3ZlcyBhbGwgY2hpbGRyZW4gZm9yIGEgRE9NIG5vZGVcclxuKiovXHJcbnZhciBjbGVhck5vZGUgPSBmdW5jdGlvbiAobm9kZSkge1xyXG4gICAgd2hpbGUobm9kZS5maXJzdENoaWxkKXtcclxuICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG5vZGUuZmlyc3RDaGlsZCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICAgIENhbGN1bGF0ZXMgYW5kIGFwcGxpZXMgdGhlIGJlc3Qgc2l6aW5nIGFuZCBkaXN0cmlidXRpb24gZm9yIHRoZSB0aXRsZVxyXG4gICAgZGVwZW5kaW5nIG9uIGNvbnRlbnQgYW5kIGJ1dHRvbnMuXHJcbiAgICBQYXNzIGluIHRoZSB0aXRsZSBlbGVtZW50LCBidXR0b25zIG11c3QgYmUgZm91bmQgYXMgc2libGluZ3Mgb2YgaXQuXHJcbioqL1xyXG52YXIgdGV4dGJveFJlc2l6ZSA9IGZ1bmN0aW9uIHRleHRib3hSZXNpemUoZWwpIHtcclxuICAgIC8qIGpzaGludCBtYXhzdGF0ZW1lbnRzOiAyOCwgbWF4Y29tcGxleGl0eToxMSAqL1xyXG4gICAgXHJcbiAgICB2YXIgbGVmdGJ0biA9IGVsLnBhcmVudE5vZGUucXVlcnlTZWxlY3RvckFsbCgnLlNtYXJ0TmF2QmFyLWVkZ2UubGVmdCcpWzBdO1xyXG4gICAgdmFyIHJpZ2h0YnRuID0gZWwucGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yQWxsKCcuU21hcnROYXZCYXItZWRnZS5yaWdodCcpWzBdO1xyXG4gICAgaWYgKHR5cGVvZiBsZWZ0YnRuID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIGxlZnRidG4gPSB7XHJcbiAgICAgICAgICAgIG9mZnNldFdpZHRoOiAwLFxyXG4gICAgICAgICAgICBjbGFzc05hbWU6ICcnXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgcmlnaHRidG4gPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgcmlnaHRidG4gPSB7XHJcbiAgICAgICAgICAgIG9mZnNldFdpZHRoOiAwLFxyXG4gICAgICAgICAgICBjbGFzc05hbWU6ICcnXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIG1hcmdpbiA9IE1hdGgubWF4KGxlZnRidG4ub2Zmc2V0V2lkdGgsIHJpZ2h0YnRuLm9mZnNldFdpZHRoKTtcclxuICAgIGVsLnN0eWxlLm1hcmdpbkxlZnQgPSBtYXJnaW4gKyAncHgnO1xyXG4gICAgZWwuc3R5bGUubWFyZ2luUmlnaHQgPSBtYXJnaW4gKyAncHgnO1xyXG4gICAgdmFyIHRvb0xvbmcgPSAoZWwub2Zmc2V0V2lkdGggPCBlbC5zY3JvbGxXaWR0aCkgPyB0cnVlIDogZmFsc2U7XHJcbiAgICBpZiAodG9vTG9uZykge1xyXG4gICAgICAgIGlmIChsZWZ0YnRuLm9mZnNldFdpZHRoIDwgcmlnaHRidG4ub2Zmc2V0V2lkdGgpIHtcclxuICAgICAgICAgICAgZWwuc3R5bGUubWFyZ2luTGVmdCA9IGxlZnRidG4ub2Zmc2V0V2lkdGggKyAncHgnO1xyXG4gICAgICAgICAgICBlbC5zdHlsZS50ZXh0QWxpZ24gPSAncmlnaHQnO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGVsLnN0eWxlLm1hcmdpblJpZ2h0ID0gcmlnaHRidG4ub2Zmc2V0V2lkdGggKyAncHgnO1xyXG4gICAgICAgICAgICBlbC5zdHlsZS50ZXh0QWxpZ24gPSAnbGVmdCc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRvb0xvbmcgPSAoZWwub2Zmc2V0V2lkdGg8ZWwuc2Nyb2xsV2lkdGgpID8gdHJ1ZSA6IGZhbHNlO1xyXG4gICAgICAgIGlmICh0b29Mb25nKSB7XHJcbiAgICAgICAgICAgIGlmIChuZXcgUmVnRXhwKCdhcnJvdycpLnRlc3QobGVmdGJ0bi5jbGFzc05hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhck5vZGUobGVmdGJ0bi5jaGlsZE5vZGVzWzFdKTtcclxuICAgICAgICAgICAgICAgIGVsLnN0eWxlLm1hcmdpbkxlZnQgPSAnMjZweCc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG5ldyBSZWdFeHAoJ2Fycm93JykudGVzdChyaWdodGJ0bi5jbGFzc05hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhck5vZGUocmlnaHRidG4uY2hpbGROb2Rlc1sxXSk7XHJcbiAgICAgICAgICAgICAgICBlbC5zdHlsZS5tYXJnaW5SaWdodCA9ICcyNnB4JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydHMudGV4dGJveFJlc2l6ZSA9IHRleHRib3hSZXNpemU7XHJcblxyXG4vKipcclxuICAgIFNtYXJ0TmF2QmFyIGNsYXNzLCBpbnN0YW50aWF0ZSB3aXRoIGEgRE9NIGVsZW1lbnRcclxuICAgIHJlcHJlc2VudGluZyBhIG5hdmJhci5cclxuICAgIEFQSTpcclxuICAgIC0gcmVmcmVzaDogdXBkYXRlcyB0aGUgY29udHJvbCB0YWtpbmcgY2FyZSBvZiB0aGUgbmVlZGVkXHJcbiAgICAgICAgd2lkdGggZm9yIHRpdGxlIGFuZCBidXR0b25zXHJcbioqL1xyXG52YXIgU21hcnROYXZCYXIgPSBmdW5jdGlvbiBTbWFydE5hdkJhcihlbCkge1xyXG4gICAgdGhpcy5lbCA9IGVsO1xyXG4gICAgXHJcbiAgICB0aGlzLnJlZnJlc2ggPSBmdW5jdGlvbiByZWZyZXNoKCkge1xyXG4gICAgICAgIHZhciBoID0gJChlbCkuY2hpbGRyZW4oJ2gxJykuZ2V0KDApO1xyXG4gICAgICAgIGlmIChoKVxyXG4gICAgICAgICAgICB0ZXh0Ym94UmVzaXplKGgpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnJlZnJlc2goKTsgXHJcbn07XHJcblxyXG5leHBvcnRzLlNtYXJ0TmF2QmFyID0gU21hcnROYXZCYXI7XHJcblxyXG4vKipcclxuICAgIEdldCBpbnN0YW5jZXMgZm9yIGFsbCB0aGUgU21hcnROYXZCYXIgZWxlbWVudHMgaW4gdGhlIERPTVxyXG4qKi9cclxuZXhwb3J0cy5nZXRBbGwgPSBmdW5jdGlvbiBnZXRBbGwoKSB7XHJcbiAgICB2YXIgYWxsID0gJCgnLlNtYXJ0TmF2QmFyJyk7XHJcbiAgICByZXR1cm4gJC5tYXAoYWxsLCBmdW5jdGlvbihpdGVtKSB7IHJldHVybiBuZXcgU21hcnROYXZCYXIoaXRlbSk7IH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBSZWZyZXNoIGFsbCBTbWFydE5hdkJhciBmb3VuZCBpbiB0aGUgZG9jdW1lbnQuXHJcbioqL1xyXG5leHBvcnRzLnJlZnJlc2hBbGwgPSBmdW5jdGlvbiByZWZyZXNoQWxsKCkge1xyXG4gICAgJCgnLlNtYXJ0TmF2QmFyID4gaDEnKS5lYWNoKGZ1bmN0aW9uKCkgeyB0ZXh0Ym94UmVzaXplKHRoaXMpOyB9KTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBDdXN0b20gTG9jb25vbWljcyAnbG9jYWxlJyBzdHlsZXMgZm9yIGRhdGUvdGltZXMuXHJcbiAgICBJdHMgYSBiaXQgbW9yZSAnY29vbCcgcmVuZGVyaW5nIGRhdGVzIDstKVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG4vLyBTaW5jZSB0aGUgdGFzayBvZiBkZWZpbmUgYSBsb2NhbGUgY2hhbmdlc1xyXG4vLyB0aGUgY3VycmVudCBnbG9iYWwgbG9jYWxlLCB3ZSBzYXZlIGEgcmVmZXJlbmNlXHJcbi8vIGFuZCByZXN0b3JlIGl0IGxhdGVyIHNvIG5vdGhpbmcgY2hhbmdlZC5cclxudmFyIGN1cnJlbnQgPSBtb21lbnQubG9jYWxlKCk7XHJcblxyXG5tb21lbnQubG9jYWxlKCdlbi1VUy1MQycsIHtcclxuICAgIG1lcmlkaWVtUGFyc2UgOiAvW2FwXVxcLj9cXC4/L2ksXHJcbiAgICBtZXJpZGllbSA6IGZ1bmN0aW9uIChob3VycywgbWludXRlcywgaXNMb3dlcikge1xyXG4gICAgICAgIGlmIChob3VycyA+IDExKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpc0xvd2VyID8gJ3AnIDogJ1AnO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpc0xvd2VyID8gJ2EnIDogJ0EnO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBjYWxlbmRhciA6IHtcclxuICAgICAgICBsYXN0RGF5IDogJ1tZZXN0ZXJkYXldJyxcclxuICAgICAgICBzYW1lRGF5IDogJ1tUb2RheV0nLFxyXG4gICAgICAgIG5leHREYXkgOiAnW1RvbW9ycm93XScsXHJcbiAgICAgICAgbGFzdFdlZWsgOiAnW2xhc3RdIGRkZGQnLFxyXG4gICAgICAgIG5leHRXZWVrIDogJ2RkZGQnLFxyXG4gICAgICAgIHNhbWVFbHNlIDogJ00vRCdcclxuICAgIH0sXHJcbiAgICBsb25nRGF0ZUZvcm1hdCA6IHtcclxuICAgICAgICBMVDogJ2g6bW1hJyxcclxuICAgICAgICBMVFM6ICdoOm1tOnNzYScsXHJcbiAgICAgICAgTDogJ01NL0REL1lZWVknLFxyXG4gICAgICAgIGw6ICdNL0QvWVlZWScsXHJcbiAgICAgICAgTEw6ICdNTU1NIERvIFlZWVknLFxyXG4gICAgICAgIGxsOiAnTU1NIEQgWVlZWScsXHJcbiAgICAgICAgTExMOiAnTU1NTSBEbyBZWVlZIExUJyxcclxuICAgICAgICBsbGw6ICdNTU0gRCBZWVlZIExUJyxcclxuICAgICAgICBMTExMOiAnZGRkZCwgTU1NTSBEbyBZWVlZIExUJyxcclxuICAgICAgICBsbGxsOiAnZGRkLCBNTU0gRCBZWVlZIExUJ1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8vIFJlc3RvcmUgbG9jYWxlXHJcbm1vbWVudC5sb2NhbGUoY3VycmVudCk7XHJcbiIsIi8qKiBBZGRyZXNzIG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBBZGRyZXNzKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGFkZHJlc3NJRDogMCxcclxuICAgICAgICBhZGRyZXNzTmFtZTogJycsXHJcbiAgICAgICAgam9iVGl0bGVJRDogMCxcclxuICAgICAgICB1c2VySUQ6IDAsXHJcbiAgICAgICAgYWRkcmVzc0xpbmUxOiBudWxsLFxyXG4gICAgICAgIGFkZHJlc3NMaW5lMjogbnVsbCxcclxuICAgICAgICBwb3N0YWxDb2RlOiBudWxsLFxyXG4gICAgICAgIGNpdHk6IG51bGwsIC8vIEF1dG9maWxsZWQgYnkgc2VydmVyXHJcbiAgICAgICAgc3RhdGVQcm92aW5jZUNvZGU6IG51bGwsIC8vIEF1dG9maWxsZWQgYnkgc2VydmVyXHJcbiAgICAgICAgc3RhdGVQcm92aWNlTmFtZTogbnVsbCwgLy8gQXV0b2ZpbGxlZCBieSBzZXJ2ZXJcclxuICAgICAgICBjb3VudHJ5Q29kZTogbnVsbCwgLy8gSVNPIEFscGhhLTIgY29kZSwgRXguOiAnVVMnXHJcbiAgICAgICAgbGF0aXR1ZGU6IG51bGwsXHJcbiAgICAgICAgbG9uZ2l0dWRlOiBudWxsLFxyXG4gICAgICAgIHNwZWNpYWxJbnN0cnVjdGlvbnM6IG51bGwsXHJcbiAgICAgICAgaXNTZXJ2aWNlQXJlYTogZmFsc2UsXHJcbiAgICAgICAgaXNTZXJ2aWNlTG9jYXRpb246IGZhbHNlLFxyXG4gICAgICAgIHNlcnZpY2VSYWRpdXM6IDAsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsIC8vIEF1dG9maWxsZWQgYnkgc2VydmVyXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGwsIC8vIEF1dG9maWxsZWQgYnkgc2VydmVyXHJcbiAgICAgICAga2luZDogJycgLy8gQXV0b2ZpbGxlZCBieSBzZXJ2ZXJcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2luZ2xlTGluZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBsaXN0ID0gW1xyXG4gICAgICAgICAgICB0aGlzLmFkZHJlc3NMaW5lMSgpLFxyXG4gICAgICAgICAgICB0aGlzLmNpdHkoKSxcclxuICAgICAgICAgICAgdGhpcy5wb3N0YWxDb2RlKCksXHJcbiAgICAgICAgICAgIHRoaXMuc3RhdGVQcm92aW5jZUNvZGUoKVxyXG4gICAgICAgIF07XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGxpc3QuZmlsdGVyKGZ1bmN0aW9uKHYpIHsgcmV0dXJuICEhdjsgfSkuam9pbignLCAnKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICAvLyBUT0RPOiBuZWVkZWQ/IGwxMG4/IG11c3QgYmUgcHJvdmlkZWQgYnkgc2VydmVyIHNpZGU/XHJcbiAgICB2YXIgY291bnRyaWVzID0ge1xyXG4gICAgICAgICdVUyc6ICdVbml0ZWQgU3RhdGVzJyxcclxuICAgICAgICAnRVMnOiAnU3BhaW4nXHJcbiAgICB9O1xyXG4gICAgdGhpcy5jb3VudHJ5TmFtZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBjb3VudHJpZXNbdGhpcy5jb3VudHJ5Q29kZSgpXSB8fCAndW5rbm93JztcclxuICAgIH0sIHRoaXMpO1xyXG5cclxuICAgIC8vIFVzZWZ1bCBHUFMgb2JqZWN0IHdpdGggdGhlIGZvcm1hdCB1c2VkIGJ5IEdvb2dsZSBNYXBzXHJcbiAgICB0aGlzLmxhdGxuZyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGxhdDogdGhpcy5sYXRpdHVkZSgpLFxyXG4gICAgICAgICAgICBsbmc6IHRoaXMubG9uZ2l0dWRlKClcclxuICAgICAgICB9O1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQWRkcmVzcztcclxuIiwiLyoqIEFwcG9pbnRtZW50IG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBDbGllbnQgPSByZXF1aXJlKCcuL0NsaWVudCcpLFxyXG4gICAgTG9jYXRpb24gPSByZXF1aXJlKCcuL0xvY2F0aW9uJyksXHJcbiAgICBTZXJ2aWNlID0gcmVxdWlyZSgnLi9TZXJ2aWNlJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuICAgXHJcbmZ1bmN0aW9uIEFwcG9pbnRtZW50KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGlkOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN0YXJ0VGltZTogbnVsbCxcclxuICAgICAgICBlbmRUaW1lOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEV2ZW50IHN1bW1hcnk6XHJcbiAgICAgICAgc3VtbWFyeTogJ05ldyBib29raW5nJyxcclxuICAgICAgICBcclxuICAgICAgICBzdWJ0b3RhbFByaWNlOiAwLFxyXG4gICAgICAgIGZlZVByaWNlOiAwLFxyXG4gICAgICAgIHBmZWVQcmljZTogMCxcclxuICAgICAgICB0b3RhbFByaWNlOiAwLFxyXG4gICAgICAgIHB0b3RhbFByaWNlOiAwLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHByZU5vdGVzVG9DbGllbnQ6IG51bGwsXHJcbiAgICAgICAgcG9zdE5vdGVzVG9DbGllbnQ6IG51bGwsXHJcbiAgICAgICAgcHJlTm90ZXNUb1NlbGY6IG51bGwsXHJcbiAgICAgICAgcG9zdE5vdGVzVG9TZWxmOiBudWxsXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB2YWx1ZXMgPSB2YWx1ZXMgfHwge307XHJcblxyXG4gICAgdGhpcy5jbGllbnQgPSBrby5vYnNlcnZhYmxlKHZhbHVlcy5jbGllbnQgPyBuZXcgQ2xpZW50KHZhbHVlcy5jbGllbnQpIDogbnVsbCk7XHJcblxyXG4gICAgdGhpcy5sb2NhdGlvbiA9IGtvLm9ic2VydmFibGUobmV3IExvY2F0aW9uKHZhbHVlcy5sb2NhdGlvbikpO1xyXG4gICAgdGhpcy5sb2NhdGlvblN1bW1hcnkgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sb2NhdGlvbigpLnNpbmdsZUxpbmUoKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlcnZpY2VzID0ga28ub2JzZXJ2YWJsZUFycmF5KCh2YWx1ZXMuc2VydmljZXMgfHwgW10pLm1hcChmdW5jdGlvbihzZXJ2aWNlKSB7XHJcbiAgICAgICAgcmV0dXJuIChzZXJ2aWNlIGluc3RhbmNlb2YgU2VydmljZSkgPyBzZXJ2aWNlIDogbmV3IFNlcnZpY2Uoc2VydmljZSk7XHJcbiAgICB9KSk7XHJcbiAgICB0aGlzLnNlcnZpY2VzU3VtbWFyeSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNlcnZpY2VzKCkubWFwKGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNlcnZpY2UubmFtZSgpO1xyXG4gICAgICAgIH0pLmpvaW4oJywgJyk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgLy8gUHJpY2UgdXBkYXRlIG9uIHNlcnZpY2VzIGNoYW5nZXNcclxuICAgIC8vIFRPRE8gSXMgbm90IGNvbXBsZXRlIGZvciBwcm9kdWN0aW9uXHJcbiAgICB0aGlzLnNlcnZpY2VzLnN1YnNjcmliZShmdW5jdGlvbihzZXJ2aWNlcykge1xyXG4gICAgICAgIHRoaXMucHRvdGFsUHJpY2Uoc2VydmljZXMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xyXG4gICAgICAgICAgICByZXR1cm4gcHJldiArIGN1ci5wcmljZSgpO1xyXG4gICAgICAgIH0sIDApKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICBcclxuICAgIC8vIFNtYXJ0IHZpc3VhbGl6YXRpb24gb2YgZGF0ZSBhbmQgdGltZVxyXG4gICAgdGhpcy5kaXNwbGF5ZWREYXRlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBtb21lbnQodGhpcy5zdGFydFRpbWUoKSkubG9jYWxlKCdlbi1VUy1MQycpLmNhbGVuZGFyKCk7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNwbGF5ZWRTdGFydFRpbWUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzLnN0YXJ0VGltZSgpKS5sb2NhbGUoJ2VuLVVTLUxDJykuZm9ybWF0KCdMVCcpO1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzcGxheWVkRW5kVGltZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbW9tZW50KHRoaXMuZW5kVGltZSgpKS5sb2NhbGUoJ2VuLVVTLUxDJykuZm9ybWF0KCdMVCcpO1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzcGxheWVkVGltZVJhbmdlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLmRpc3BsYXllZFN0YXJ0VGltZSgpICsgJy0nICsgdGhpcy5kaXNwbGF5ZWRFbmRUaW1lKCk7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5pdFN0YXJ0ZWQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnN0YXJ0VGltZSgpICYmIG5ldyBEYXRlKCkgPj0gdGhpcy5zdGFydFRpbWUoKSk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5pdEVuZGVkID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5lbmRUaW1lKCkgJiYgbmV3IERhdGUoKSA+PSB0aGlzLmVuZFRpbWUoKSk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5pc05ldyA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKCF0aGlzLmlkKCkpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc3RhdGVIZWFkZXIgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHRleHQgPSAnJztcclxuICAgICAgICBpZiAoIXRoaXMuaXNOZXcoKSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5pdFN0YXJ0ZWQoKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXRFbmRlZCgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dCA9ICdDb21wbGV0ZWQ6JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQgPSAnTm93Oic7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ID0gJ1VwY29taW5nOic7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0ZXh0O1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXBwb2ludG1lbnQ7XHJcbiIsIi8qKiBCb29raW5nIG1vZGVsLlxyXG5cclxuICAgIERlc2NyaWJlcyBhIGJvb2tpbmcgd2l0aCByZWxhdGVkIEJvb2tpbmdSZXF1ZXN0IFxyXG4gICAgYW5kIFByaWNpbmdFc3RpbWF0ZSBvYmplY3RzLlxyXG4gKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIEJvb2tpbmcodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgYm9va2luZ0lEOiAwLFxyXG4gICAgICAgIGJvb2tpbmdSZXF1ZXN0SUQ6IDAsXHJcbiAgICAgICAgY29uZmlybWVkRGF0ZUlEOiBudWxsLFxyXG4gICAgICAgIHRvdGFsUHJpY2VQYWlkQnlDdXN0b21lcjogbnVsbCxcclxuICAgICAgICB0b3RhbFNlcnZpY2VGZWVzUGFpZEJ5Q3VzdG9tZXI6IG51bGwsXHJcbiAgICAgICAgdG90YWxQYWlkVG9GcmVlbGFuY2VyOiBudWxsLFxyXG4gICAgICAgIHRvdGFsU2VydmljZUZlZXNQYWlkQnlGcmVlbGFuY2VyOiBudWxsLFxyXG4gICAgICAgIGJvb2tpbmdTdGF0dXNJRDogbnVsbCxcclxuICAgICAgICBwcmljaW5nQWRqdXN0bWVudEFwcGxpZWQ6IGZhbHNlLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldmlld2VkQnlGcmVlbGFuY2VyOiBmYWxzZSxcclxuICAgICAgICByZXZpZXdlZEJ5Q3VzdG9tZXI6IGZhbHNlLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBudWxsLFxyXG4gICAgICAgIHVwZGF0ZWREYXRlOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGJvb2tpbmdSZXF1ZXN0OiBudWxsIC8vIEJvb2tpbmdSZXF1ZXN0XHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmJvb2tpbmdSZXF1ZXN0KG5ldyBCb29raW5nUmVxdWVzdCh2YWx1ZXMgJiYgdmFsdWVzLmJvb2tpbmdSZXF1ZXN0KSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQm9va2luZztcclxuXHJcbmZ1bmN0aW9uIEJvb2tpbmdSZXF1ZXN0KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGJvb2tpbmdSZXF1ZXN0SUQ6IDAsXHJcbiAgICAgICAgYm9va2luZ1R5cGVJRDogMCxcclxuICAgICAgICBjdXN0b21lclVzZXJJRDogMCxcclxuICAgICAgICBmcmVlbGFuY2VyVXNlcklEOiAwLFxyXG4gICAgICAgIGpvYlRpdGxlSUQ6IDAsXHJcbiAgICAgICAgcHJpY2luZ0VzdGltYXRlSUQ6IDAsXHJcbiAgICAgICAgYm9va2luZ1JlcXVlc3RTdGF0dXNJRDogMCxcclxuICAgICAgICBcclxuICAgICAgICBzcGVjaWFsUmVxdWVzdHM6IG51bGwsXHJcbiAgICAgICAgcHJlZmVycmVkRGF0ZUlEOiBudWxsLFxyXG4gICAgICAgIGFsdGVybmF0aXZlRGF0ZTFJRDogbnVsbCxcclxuICAgICAgICBhbHRlcm5hdGl2ZURhdGUySUQ6IG51bGwsXHJcbiAgICAgICAgYWRkcmVzc0lEOiBudWxsLFxyXG4gICAgICAgIGNhbmNlbGxhdGlvblBvbGljeUlEOiBudWxsLFxyXG4gICAgICAgIGluc3RhbnRCb29raW5nOiBmYWxzZSxcclxuICAgICAgICBcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBwcmljaW5nRXN0aW1hdGU6IG51bGwgLy8gUHJpY2luZ0VzdGltYXRlXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnByaWNpbmdFc3RpbWF0ZShuZXcgUHJpY2luZ0VzdGltYXRlKHZhbHVlcyAmJiB2YWx1ZXMucHJpY2luZ0VzdGltYXRlKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFByaWNpbmdFc3RpbWF0ZSh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBwcmljaW5nRXN0aW1hdGVJRDogMCxcclxuICAgICAgICBwcmljaW5nRXN0aW1hdGVSZXZpc2lvbjogMCxcclxuICAgICAgICBzZXJ2aWNlRHVyYXRpb25Ib3VyczogbnVsbCxcclxuICAgICAgICBmaXJzdFNlc3Npb25EdXJhdGlvbkhvdXJzOiBudWxsLFxyXG4gICAgICAgIHN1YnRvdGFsUHJpY2U6IG51bGwsXHJcbiAgICAgICAgZmVlUHJpY2U6IG51bGwsXHJcbiAgICAgICAgdG90YWxQcmljZTogbnVsbCxcclxuICAgICAgICBwRmVlUHJpY2U6IG51bGwsXHJcbiAgICAgICAgc3VidG90YWxSZWZ1bmRlZDogbnVsbCxcclxuICAgICAgICBmZWVSZWZ1bmRlZDogbnVsbCxcclxuICAgICAgICB0b3RhbFJlZnVuZGVkOiBudWxsLFxyXG4gICAgICAgIGRhdGVSZWZ1bmRlZDogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBkZXRhaWxzOiBbXVxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWVzLmRldGFpbHMpKSB7XHJcbiAgICAgICAgdGhpcy5kZXRhaWxzKHZhbHVlcy5kZXRhaWxzLm1hcChmdW5jdGlvbihkZXRhaWwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcmljaW5nRXN0aW1hdGVEZXRhaWwoZGV0YWlsKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFByaWNpbmdFc3RpbWF0ZURldGFpbCh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBmcmVlbGFuY2VyUHJpY2luZ0lEOiAwLFxyXG4gICAgICAgIGZyZWVsYW5jZXJQcmljaW5nRGF0YUlucHV0OiBudWxsLFxyXG4gICAgICAgIGN1c3RvbWVyUHJpY2luZ0RhdGFJbnB1dDogbnVsbCxcclxuICAgICAgICBob3VybHlQcmljZTogbnVsbCxcclxuICAgICAgICBzdWJ0b3RhbFByaWNlOiBudWxsLFxyXG4gICAgICAgIGZlZVByaWNlOiBudWxsLFxyXG4gICAgICAgIHRvdGFsUHJpY2U6IG51bGwsXHJcbiAgICAgICAgc2VydmljZUR1cmF0aW9uSG91cnM6IG51bGwsXHJcbiAgICAgICAgZmlyc3RTZXNzaW9uRHVyYXRpb25Ib3VyczogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG4iLCIvKiogQm9va2luZ1N1bW1hcnkgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG4gICAgXHJcbmZ1bmN0aW9uIEJvb2tpbmdTdW1tYXJ5KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHF1YW50aXR5OiAwLFxyXG4gICAgICAgIGNvbmNlcHQ6ICcnLFxyXG4gICAgICAgIHRpbWU6IG51bGwsXHJcbiAgICAgICAgdGltZUZvcm1hdDogJyBbQF0gaDptbWEnXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG5cclxuICAgIHRoaXMucGhyYXNlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdmFyIHQgPSB0aGlzLnRpbWVGb3JtYXQoKSAmJiBcclxuICAgICAgICAgICAgdGhpcy50aW1lKCkgJiYgXHJcbiAgICAgICAgICAgIG1vbWVudCh0aGlzLnRpbWUoKSkuZm9ybWF0KHRoaXMudGltZUZvcm1hdCgpKSB8fFxyXG4gICAgICAgICAgICAnJzsgICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbmNlcHQoKSArIHQ7XHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLnVybCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgdXJsID0gdGhpcy50aW1lKCkgJiZcclxuICAgICAgICAgICAgJy9jYWxlbmRhci8nICsgdGhpcy50aW1lKCkudG9JU09TdHJpbmcoKTtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdXJsO1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQm9va2luZ1N1bW1hcnk7XHJcbiIsIi8qKlxyXG4gICAgRXZlbnQgbW9kZWxcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbi8qIEV4YW1wbGUgSlNPTiAocmV0dXJuZWQgYnkgdGhlIFJFU1QgQVBJKTpcclxue1xyXG4gIFwiRXZlbnRJRFwiOiAzNTMsXHJcbiAgXCJVc2VySURcIjogMTQxLFxyXG4gIFwiRXZlbnRUeXBlSURcIjogMyxcclxuICBcIlN1bW1hcnlcIjogXCJIb3VzZWtlZXBlciBzZXJ2aWNlcyBmb3IgSm9obiBELlwiLFxyXG4gIFwiQXZhaWxhYmlsaXR5VHlwZUlEXCI6IDMsXHJcbiAgXCJTdGFydFRpbWVcIjogXCIyMDE0LTAzLTI1VDA4OjAwOjAwWlwiLFxyXG4gIFwiRW5kVGltZVwiOiBcIjIwMTQtMDMtMjVUMTg6MDA6MDBaXCIsXHJcbiAgXCJLaW5kXCI6IDAsXHJcbiAgXCJJc0FsbERheVwiOiBmYWxzZSxcclxuICBcIlRpbWVab25lXCI6IFwiMDE6MDA6MDBcIixcclxuICBcIkxvY2F0aW9uXCI6IFwibnVsbFwiLFxyXG4gIFwiVXBkYXRlZERhdGVcIjogXCIyMDE0LTEwLTMwVDE1OjQ0OjQ5LjY1M1wiLFxyXG4gIFwiQ3JlYXRlZERhdGVcIjogbnVsbCxcclxuICBcIkRlc2NyaXB0aW9uXCI6IFwidGVzdCBkZXNjcmlwdGlvbiBvZiBhIFJFU1QgZXZlbnRcIixcclxuICBcIlJlY3VycmVuY2VSdWxlXCI6IHtcclxuICAgIFwiRnJlcXVlbmN5VHlwZUlEXCI6IDUwMixcclxuICAgIFwiSW50ZXJ2YWxcIjogMSxcclxuICAgIFwiVW50aWxcIjogXCIyMDE0LTA3LTAxVDAwOjAwOjAwXCIsXHJcbiAgICBcIkNvdW50XCI6IG51bGwsXHJcbiAgICBcIkVuZGluZ1wiOiBcImRhdGVcIixcclxuICAgIFwiU2VsZWN0ZWRXZWVrRGF5c1wiOiBbXHJcbiAgICAgIDEsXHJcbiAgICBdLFxyXG4gICAgXCJNb250aGx5V2Vla0RheVwiOiBmYWxzZSxcclxuICAgIFwiSW5jb21wYXRpYmxlXCI6IGZhbHNlLFxyXG4gICAgXCJUb29NYW55XCI6IGZhbHNlXHJcbiAgfSxcclxuICBcIlJlY3VycmVuY2VPY2N1cnJlbmNlc1wiOiBudWxsLFxyXG4gIFwiUmVhZE9ubHlcIjogZmFsc2VcclxufSovXHJcblxyXG5mdW5jdGlvbiBSZWN1cnJlbmNlUnVsZSh2YWx1ZXMpIHtcclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGZyZXF1ZW5jeVR5cGVJRDogMCxcclxuICAgICAgICBpbnRlcnZhbDogMSwgLy86SW50ZWdlclxyXG4gICAgICAgIHVudGlsOiBudWxsLCAvLzpEYXRlXHJcbiAgICAgICAgY291bnQ6IG51bGwsIC8vOkludGVnZXJcclxuICAgICAgICBlbmRpbmc6IG51bGwsIC8vIDpzdHJpbmcgUG9zc2libGUgdmFsdWVzIGFsbG93ZWQ6ICduZXZlcicsICdkYXRlJywgJ29jdXJyZW5jZXMnXHJcbiAgICAgICAgc2VsZWN0ZWRXZWVrRGF5czogW10sIC8vIDppbnRlZ2VyW10gMDpTdW5kYXlcclxuICAgICAgICBtb250aGx5V2Vla0RheTogZmFsc2UsXHJcbiAgICAgICAgaW5jb21wYXRpYmxlOiBmYWxzZSxcclxuICAgICAgICB0b29NYW55OiBmYWxzZVxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gUmVjdXJyZW5jZU9jY3VycmVuY2UodmFsdWVzKSB7XHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBzdGFydFRpbWU6IG51bGwsIC8vOkRhdGVcclxuICAgICAgICBlbmRUaW1lOiBudWxsIC8vOkRhdGVcclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuICAgXHJcbmZ1bmN0aW9uIENhbGVuZGFyRXZlbnQodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICAvLyBTcGVjaWFsIHZhbHVlczogZGF0ZXMgbXVzdCBiZSBjb252ZXJ0ZWRcclxuICAgIC8vIHRvIGEgRGF0ZSBvYmplY3QuIFRoZXkgY29tZSBhcyBJU08gc3RyaW5nXHJcbiAgICAvLyBUT0RPOiBNYWtlIHRoaXMgc29tZXRoaW5nIGdlbmVyaWMsIG9yIGV2ZW4gaW4gTW9kZWwgZGVmaW5pdGlvbnMsXHJcbiAgICAvLyBhbmQgdXNlIGZvciB1cGRhdGVkL2NyZWF0ZWREYXRlIGFyb3VuZCBhbGwgdGhlIHByb2plY3RcclxuICAgIGlmICh2YWx1ZXMpIHtcclxuICAgICAgICB2YWx1ZXMuc3RhcnRUaW1lID0gdmFsdWVzLnN0YXJ0VGltZSAmJiBuZXcgRGF0ZShEYXRlLnBhcnNlKHZhbHVlcy5zdGFydFRpbWUpKSB8fCBudWxsO1xyXG4gICAgICAgIHZhbHVlcy5lbmRUaW1lID0gdmFsdWVzLmVuZFRpbWUgJiYgbmV3IERhdGUoRGF0ZS5wYXJzZSh2YWx1ZXMuZW5kVGltZSkpIHx8IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBjYWxlbmRhckV2ZW50SUQ6IDAsXHJcbiAgICAgICAgdXNlcklEOiAwLFxyXG4gICAgICAgIGV2ZW50VHlwZUlEOiAzLFxyXG4gICAgICAgIHN1bW1hcnk6ICcnLFxyXG4gICAgICAgIGF2YWlsYWJpbGl0eVR5cGVJRDogMCxcclxuICAgICAgICBzdGFydFRpbWU6IG51bGwsXHJcbiAgICAgICAgZW5kVGltZTogbnVsbCxcclxuICAgICAgICBraW5kOiAwLFxyXG4gICAgICAgIGlzQWxsRGF5OiBmYWxzZSxcclxuICAgICAgICB0aW1lWm9uZTogJ1onLFxyXG4gICAgICAgIGxvY2F0aW9uOiBudWxsLFxyXG4gICAgICAgIHVwZGF0ZWREYXRlOiBudWxsLFxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBudWxsLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnJyxcclxuICAgICAgICByZWFkT25seTogZmFsc2VcclxuICAgIH0sIHZhbHVlcyk7XHJcblxyXG4gICAgdGhpcy5yZWN1cnJlbmNlUnVsZSA9IGtvLm9ic2VydmFibGUoXHJcbiAgICAgICAgdmFsdWVzICYmIFxyXG4gICAgICAgIHZhbHVlcy5yZWN1cnJlbmNlUnVsZSAmJiBcclxuICAgICAgICBuZXcgUmVjdXJyZW5jZVJ1bGUodmFsdWVzLnJlY3VycmVuY2VSdWxlKVxyXG4gICAgKTtcclxuICAgIHRoaXMucmVjdXJyZW5jZU9jY3VycmVuY2VzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTsgLy86UmVjdXJyZW5jZU9jY3VycmVuY2VbXVxyXG4gICAgaWYgKHZhbHVlcyAmJiB2YWx1ZXMucmVjdXJyZW5jZU9jY3VycmVuY2VzKSB7XHJcbiAgICAgICAgdmFsdWVzLnJlY3VycmVuY2VPY2N1cnJlbmNlcy5mb3JFYWNoKGZ1bmN0aW9uKG9jY3VycmVuY2UpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuUmVjdXJyZW5jZU9jY3VycmVuY2VzLnB1c2gobmV3IFJlY3VycmVuY2VPY2N1cnJlbmNlKG9jY3VycmVuY2UpKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDYWxlbmRhckV2ZW50O1xyXG5cclxuQ2FsZW5kYXJFdmVudC5SZWN1cnJlbmNlUnVsZSA9IFJlY3VycmVuY2VSdWxlO1xyXG5DYWxlbmRhckV2ZW50LlJlY3VycmVuY2VPY2N1cnJlbmNlID0gUmVjdXJyZW5jZU9jY3VycmVuY2U7IiwiLyoqIENhbGVuZGFyU2xvdCBtb2RlbC5cclxuXHJcbiAgICBEZXNjcmliZXMgYSB0aW1lIHNsb3QgaW4gdGhlIGNhbGVuZGFyLCBmb3IgYSBjb25zZWN1dGl2ZVxyXG4gICAgZXZlbnQsIGFwcG9pbnRtZW50IG9yIGZyZWUgdGltZS5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBDYWxlbmRhclNsb3QodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBudWxsLFxyXG4gICAgICAgIGVuZFRpbWU6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJycsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyMnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgY2xhc3NOYW1lczogJydcclxuXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENhbGVuZGFyU2xvdDtcclxuIiwiLyoqXHJcbiAgICBDYWxlbmRhclN5bmNpbmcgbW9kZWwuXHJcbiAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gQ2FsZW5kYXJTeW5jaW5nKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgaWNhbEV4cG9ydFVybDogJycsXHJcbiAgICAgICAgaWNhbEltcG9ydFVybDogJydcclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ2FsZW5kYXJTeW5jaW5nO1xyXG4iLCIvKiogQ2xpZW50IG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG4vLyBUT0RPIERvdWJsZSBjaGVjayBVc2VyLCBtdXN0IGJlIHRoZSBzYW1lIG9yIGV4dGVuZGVkPz9cclxuXHJcbmZ1bmN0aW9uIENsaWVudCh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgaWQ6IDAsXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnJyxcclxuICAgICAgICBsYXN0TmFtZTogJycsXHJcbiAgICAgICAgZW1haWw6ICcnLFxyXG4gICAgICAgIHBob25lOiBudWxsLFxyXG4gICAgICAgIGNhblJlY2VpdmVTbXM6IGZhbHNlLFxyXG4gICAgICAgIGJpcnRoTW9udGhEYXk6IG51bGwsXHJcbiAgICAgICAgYmlydGhNb250aDogbnVsbCxcclxuICAgICAgICBub3Rlc0Fib3V0Q2xpZW50OiBudWxsXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG5cclxuICAgIHRoaXMuZnVsbE5hbWUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLmZpcnN0TmFtZSgpICsgJyAnICsgdGhpcy5sYXN0TmFtZSgpKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmJpcnRoRGF5ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmJpcnRoTW9udGhEYXkoKSAmJlxyXG4gICAgICAgICAgICB0aGlzLmJpcnRoTW9udGgoKSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVE9ETyBpMTBuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJpcnRoTW9udGgoKSArICcvJyArIHRoaXMuYmlydGhNb250aERheSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ2xpZW50O1xyXG4iLCIvKiogR2V0TW9yZSBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgTGlzdFZpZXdJdGVtID0gcmVxdWlyZSgnLi9MaXN0Vmlld0l0ZW0nKTtcclxuXHJcbmZ1bmN0aW9uIEdldE1vcmUodmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBhdmFpbGFiaWxpdHk6IGZhbHNlLFxyXG4gICAgICAgIHBheW1lbnRzOiBmYWxzZSxcclxuICAgICAgICBwcm9maWxlOiBmYWxzZSxcclxuICAgICAgICBjb29wOiB0cnVlXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB2YXIgYXZhaWxhYmxlSXRlbXMgPSB7XHJcbiAgICAgICAgYXZhaWxhYmlsaXR5OiBuZXcgTGlzdFZpZXdJdGVtKHtcclxuICAgICAgICAgICAgY29udGVudExpbmUxOiAnQ29tcGxldGUgeW91ciBhdmFpbGFiaWxpdHkgdG8gY3JlYXRlIGEgY2xlYW5lciBjYWxlbmRhcicsXHJcbiAgICAgICAgICAgIG1hcmtlckljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLWNhbGVuZGFyJyxcclxuICAgICAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1yaWdodCdcclxuICAgICAgICB9KSxcclxuICAgICAgICBwYXltZW50czogbmV3IExpc3RWaWV3SXRlbSh7XHJcbiAgICAgICAgICAgIGNvbnRlbnRMaW5lMTogJ1N0YXJ0IGFjY2VwdGluZyBwYXltZW50cyB0aHJvdWdoIExvY29ub21pY3MnLFxyXG4gICAgICAgICAgICBtYXJrZXJJY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi11c2QnLFxyXG4gICAgICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0J1xyXG4gICAgICAgIH0pLFxyXG4gICAgICAgIHByb2ZpbGU6IG5ldyBMaXN0Vmlld0l0ZW0oe1xyXG4gICAgICAgICAgICBjb250ZW50TGluZTE6ICdBY3RpdmF0ZSB5b3VyIHByb2ZpbGUgaW4gdGhlIG1hcmtldHBsYWNlJyxcclxuICAgICAgICAgICAgbWFya2VySWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tdXNlcicsXHJcbiAgICAgICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tcmlnaHQnXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgY29vcDogbmV3IExpc3RWaWV3SXRlbSh7XHJcbiAgICAgICAgICAgIGNvbnRlbnRMaW5lMTogJ0xlYXJuIG1vcmUgYWJvdXQgb3VyIGNvb3BlcmF0aXZlJyxcclxuICAgICAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1yaWdodCdcclxuICAgICAgICB9KVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLml0ZW1zID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBpdGVtcyA9IFtdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIE9iamVjdC5rZXlzKGF2YWlsYWJsZUl0ZW1zKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHRoaXNba2V5XSgpKVxyXG4gICAgICAgICAgICAgICAgaXRlbXMucHVzaChhdmFpbGFibGVJdGVtc1trZXldKTtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICByZXR1cm4gaXRlbXM7XHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBHZXRNb3JlO1xyXG4iLCIvKiogTGlzdFZpZXdJdGVtIG1vZGVsLlxyXG5cclxuICAgIERlc2NyaWJlcyBhIGdlbmVyaWMgaXRlbSBvZiBhXHJcbiAgICBMaXN0VmlldyBjb21wb25lbnQuXHJcbiAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gTGlzdFZpZXdJdGVtKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIG1hcmtlckxpbmUxOiBudWxsLFxyXG4gICAgICAgIG1hcmtlckxpbmUyOiBudWxsLFxyXG4gICAgICAgIG1hcmtlckljb246IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgY29udGVudExpbmUxOiAnJyxcclxuICAgICAgICBjb250ZW50TGluZTI6IG51bGwsXHJcbiAgICAgICAgbGluazogJyMnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgY2xhc3NOYW1lczogJydcclxuXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExpc3RWaWV3SXRlbTtcclxuIiwiLyoqIExvY2F0aW9uIG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBMb2NhdGlvbih2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBsb2NhdGlvbklEOiAwLFxyXG4gICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgIGFkZHJlc3NMaW5lMTogbnVsbCxcclxuICAgICAgICBhZGRyZXNzTGluZTI6IG51bGwsXHJcbiAgICAgICAgY2l0eTogbnVsbCxcclxuICAgICAgICBzdGF0ZVByb3ZpbmNlQ29kZTogbnVsbCxcclxuICAgICAgICBzdGF0ZVByb3ZpY2VJRDogbnVsbCxcclxuICAgICAgICBwb3N0YWxDb2RlOiBudWxsLFxyXG4gICAgICAgIHBvc3RhbENvZGVJRDogbnVsbCxcclxuICAgICAgICBjb3VudHJ5SUQ6IG51bGwsXHJcbiAgICAgICAgbGF0aXR1ZGU6IG51bGwsXHJcbiAgICAgICAgbG9uZ2l0dWRlOiBudWxsLFxyXG4gICAgICAgIHNwZWNpYWxJbnN0cnVjdGlvbnM6IG51bGwsXHJcbiAgICAgICAgaXNTZXJ2aWNlUmFkaXVzOiBmYWxzZSxcclxuICAgICAgICBpc1NlcnZpY2VMb2NhdGlvbjogZmFsc2UsXHJcbiAgICAgICAgc2VydmljZVJhZGl1czogMFxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5zaW5nbGVMaW5lID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGxpc3QgPSBbXHJcbiAgICAgICAgICAgIHRoaXMuYWRkcmVzc0xpbmUxKCksXHJcbiAgICAgICAgICAgIHRoaXMuY2l0eSgpLFxyXG4gICAgICAgICAgICB0aGlzLnBvc3RhbENvZGUoKSxcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZVByb3ZpbmNlQ29kZSgpXHJcbiAgICAgICAgXTtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbGlzdC5maWx0ZXIoZnVuY3Rpb24odikgeyByZXR1cm4gISF2OyB9KS5qb2luKCcsICcpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuY291bnRyeU5hbWUgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmNvdW50cnlJRCgpID09PSAxID9cclxuICAgICAgICAgICAgJ1VuaXRlZCBTdGF0ZXMnIDpcclxuICAgICAgICAgICAgdGhpcy5jb3VudHJ5SUQoKSA9PT0gMiA/XHJcbiAgICAgICAgICAgICdTcGFpbicgOlxyXG4gICAgICAgICAgICAndW5rbm93J1xyXG4gICAgICAgICk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5jb3VudHJ5Q29kZUFscGhhMiA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMuY291bnRyeUlEKCkgPT09IDEgP1xyXG4gICAgICAgICAgICAnVVMnIDpcclxuICAgICAgICAgICAgdGhpcy5jb3VudHJ5SUQoKSA9PT0gMiA/XHJcbiAgICAgICAgICAgICdFUycgOlxyXG4gICAgICAgICAgICAnJ1xyXG4gICAgICAgICk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5sYXRsbmcgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBsYXQ6IHRoaXMubGF0aXR1ZGUoKSxcclxuICAgICAgICAgICAgbG5nOiB0aGlzLmxvbmdpdHVkZSgpXHJcbiAgICAgICAgfTtcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExvY2F0aW9uO1xyXG4iLCIvKiogTWFpbEZvbGRlciBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xyXG5cclxuZnVuY3Rpb24gTWFpbEZvbGRlcih2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIG1lc3NhZ2VzOiBbXSxcclxuICAgICAgICB0b3BOdW1iZXI6IDEwXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnRvcCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbiB0b3AobnVtKSB7XHJcbiAgICAgICAgaWYgKG51bSkgdGhpcy50b3BOdW1iZXIobnVtKTtcclxuICAgICAgICByZXR1cm4gXy5maXJzdCh0aGlzLm1lc3NhZ2VzKCksIHRoaXMudG9wTnVtYmVyKCkpO1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWFpbEZvbGRlcjtcclxuIiwiLyoqIE1hcmtldHBsYWNlUHJvZmlsZSBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gTWFya2V0cGxhY2VQcm9maWxlKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICB1c2VySUQ6IDAsXHJcbiAgICAgICAgXHJcbiAgICAgICAgcHVibGljQmlvOiAnJyxcclxuICAgICAgICBmcmVlbGFuY2VyUHJvZmlsZVVybFNsdWc6ICcnLFxyXG4gICAgICAgIC8vIFRoaXMgaXMgYSBzZXJ2ZXItc2lkZSBjb21wdXRlZCB2YXJpYWJsZSAocmVhZC1vbmx5IGZvciB0aGUgdXNlcikgZm9yIGEgTG9jb25vbWljcyBhZGRyZXNzXHJcbiAgICAgICAgLy8gY3JlYXRlZCB1c2luZyB0aGUgZnJlZWxhbmNlclByb2ZpbGVVcmxTbHVnIGlmIGFueSBvciB0aGUgZmFsbGJhY2sgc3lzdGVtIFVSTC5cclxuICAgICAgICBmcmVlbGFuY2VyUHJvZmlsZVVybDogJycsXHJcbiAgICAgICAgLy8gU3BlY2lmeSBhbiBleHRlcm5hbCB3ZWJzaXRlIG9mIHRoZSBmcmVlbGFuY2VyLlxyXG4gICAgICAgIGZyZWVsYW5jZXJXZWJzaXRlVXJsOiAnJyxcclxuICAgICAgICAvLyBTZXJ2ZXItc2lkZSBnZW5lcmF0ZWQgY29kZSB0aGF0IGFsbG93cyB0byBpZGVudGlmaWNhdGUgc3BlY2lhbCBib29raW5nIHJlcXVlc3RzXHJcbiAgICAgICAgLy8gZnJvbSB0aGUgYm9vay1tZS1ub3cgYnV0dG9uLiBUaGUgc2VydmVyIGVuc3VyZXMgdGhhdCB0aGVyZSBpcyBldmVyIGEgdmFsdWUgb24gdGhpcyBmb3IgZnJlZWxhbmNlcnMuXHJcbiAgICAgICAgYm9va0NvZGU6ICcnLFxyXG5cclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNYXJrZXRwbGFjZVByb2ZpbGU7XHJcbiIsIi8qKiBNZXNzYWdlIG1vZGVsLlxyXG5cclxuICAgIERlc2NyaWJlcyBhIG1lc3NhZ2UgZnJvbSBhIE1haWxGb2xkZXIuXHJcbiAgICBBIG1lc3NhZ2UgY291bGQgYmUgb2YgZGlmZmVyZW50IHR5cGVzLFxyXG4gICAgYXMgaW5xdWlyaWVzLCBib29raW5ncywgYm9va2luZyByZXF1ZXN0cy5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuLy9UT0RPICAgVGhyZWFkID0gcmVxdWlyZSgnLi9UaHJlYWQnKTtcclxuXHJcbmZ1bmN0aW9uIE1lc3NhZ2UodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgaWQ6IDAsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJycsXHJcbiAgICAgICAgY29udGVudDogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBjbGFzc05hbWVzOiAnJ1xyXG5cclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIC8vIFNtYXJ0IHZpc3VhbGl6YXRpb24gb2YgZGF0ZSBhbmQgdGltZVxyXG4gICAgdGhpcy5kaXNwbGF5ZWREYXRlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBtb21lbnQodGhpcy5jcmVhdGVkRGF0ZSgpKS5sb2NhbGUoJ2VuLVVTLUxDJykuY2FsZW5kYXIoKTtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmRpc3BsYXllZFRpbWUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzLmNyZWF0ZWREYXRlKCkpLmxvY2FsZSgnZW4tVVMtTEMnKS5mb3JtYXQoJ0xUJyk7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNZXNzYWdlO1xyXG4iLCIvKipcclxuICAgIE1vZGVsIGNsYXNzIHRvIGhlbHAgYnVpbGQgbW9kZWxzLlxyXG5cclxuICAgIElzIG5vdCBleGFjdGx5IGFuICdPT1AgYmFzZScgY2xhc3MsIGJ1dCBwcm92aWRlc1xyXG4gICAgdXRpbGl0aWVzIHRvIG1vZGVscyBhbmQgYSBtb2RlbCBkZWZpbml0aW9uIG9iamVjdFxyXG4gICAgd2hlbiBleGVjdXRlZCBpbiB0aGVpciBjb25zdHJ1Y3RvcnMgYXM6XHJcbiAgICBcclxuICAgICcnJ1xyXG4gICAgZnVuY3Rpb24gTXlNb2RlbCgpIHtcclxuICAgICAgICBNb2RlbCh0aGlzKTtcclxuICAgICAgICAvLyBOb3csIHRoZXJlIGlzIGEgdGhpcy5tb2RlbCBwcm9wZXJ0eSB3aXRoXHJcbiAgICAgICAgLy8gYW4gaW5zdGFuY2Ugb2YgdGhlIE1vZGVsIGNsYXNzLCB3aXRoIFxyXG4gICAgICAgIC8vIHV0aWxpdGllcyBhbmQgbW9kZWwgc2V0dGluZ3MuXHJcbiAgICB9XHJcbiAgICAnJydcclxuICAgIFxyXG4gICAgVGhhdCBhdXRvIGNyZWF0aW9uIG9mICdtb2RlbCcgcHJvcGVydHkgY2FuIGJlIGF2b2lkZWRcclxuICAgIHdoZW4gdXNpbmcgdGhlIG9iamVjdCBpbnN0YW50aWF0aW9uIHN5bnRheCAoJ25ldycga2V5d29yZCk6XHJcbiAgICBcclxuICAgICcnJ1xyXG4gICAgdmFyIG1vZGVsID0gbmV3IE1vZGVsKG9iaik7XHJcbiAgICAvLyBUaGVyZSBpcyBubyBhICdvYmoubW9kZWwnIHByb3BlcnR5LCBjYW4gYmVcclxuICAgIC8vIGFzc2lnbmVkIHRvIHdoYXRldmVyIHByb3BlcnR5IG9yIG5vdGhpbmcuXHJcbiAgICAnJydcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxua28ubWFwcGluZyA9IHJlcXVpcmUoJ2tub2Nrb3V0Lm1hcHBpbmcnKTtcclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGNsb25lID0gZnVuY3Rpb24ob2JqKSB7IHJldHVybiAkLmV4dGVuZCh0cnVlLCB7fSwgb2JqKTsgfTtcclxuXHJcbmZ1bmN0aW9uIE1vZGVsKG1vZGVsT2JqZWN0KSB7XHJcbiAgICBcclxuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBNb2RlbCkpIHtcclxuICAgICAgICAvLyBFeGVjdXRlZCBhcyBhIGZ1bmN0aW9uLCBpdCBtdXN0IGNyZWF0ZVxyXG4gICAgICAgIC8vIGEgTW9kZWwgaW5zdGFuY2VcclxuICAgICAgICB2YXIgbW9kZWwgPSBuZXcgTW9kZWwobW9kZWxPYmplY3QpO1xyXG4gICAgICAgIC8vIGFuZCByZWdpc3RlciBhdXRvbWF0aWNhbGx5IGFzIHBhcnRcclxuICAgICAgICAvLyBvZiB0aGUgbW9kZWxPYmplY3QgaW4gJ21vZGVsJyBwcm9wZXJ0eVxyXG4gICAgICAgIG1vZGVsT2JqZWN0Lm1vZGVsID0gbW9kZWw7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gUmV0dXJucyB0aGUgaW5zdGFuY2VcclxuICAgICAgICByZXR1cm4gbW9kZWw7XHJcbiAgICB9XHJcbiBcclxuICAgIC8vIEl0IGluY2x1ZGVzIGEgcmVmZXJlbmNlIHRvIHRoZSBvYmplY3RcclxuICAgIHRoaXMubW9kZWxPYmplY3QgPSBtb2RlbE9iamVjdDtcclxuICAgIC8vIEl0IG1haW50YWlucyBhIGxpc3Qgb2YgcHJvcGVydGllcyBhbmQgZmllbGRzXHJcbiAgICB0aGlzLnByb3BlcnRpZXNMaXN0ID0gW107XHJcbiAgICB0aGlzLmZpZWxkc0xpc3QgPSBbXTtcclxuICAgIC8vIEl0IGFsbG93IHNldHRpbmcgdGhlICdrby5tYXBwaW5nLmZyb21KUycgbWFwcGluZyBvcHRpb25zXHJcbiAgICAvLyB0byBjb250cm9sIGNvbnZlcnNpb25zIGZyb20gcGxhaW4gSlMgb2JqZWN0cyB3aGVuIFxyXG4gICAgLy8gJ3VwZGF0ZVdpdGgnLlxyXG4gICAgdGhpcy5tYXBwaW5nT3B0aW9ucyA9IHt9O1xyXG4gICAgXHJcbiAgICAvLyBUaW1lc3RhbXAgd2l0aCB0aGUgZGF0ZSBvZiBsYXN0IGNoYW5nZVxyXG4gICAgLy8gaW4gdGhlIGRhdGEgKGF1dG9tYXRpY2FsbHkgdXBkYXRlZCB3aGVuIGNoYW5nZXNcclxuICAgIC8vIGhhcHBlbnMgb24gcHJvcGVydGllczsgZmllbGRzIG9yIGFueSBvdGhlciBtZW1iZXJcclxuICAgIC8vIGFkZGVkIHRvIHRoZSBtb2RlbCBjYW5ub3QgYmUgb2JzZXJ2ZWQgZm9yIGNoYW5nZXMsXHJcbiAgICAvLyByZXF1aXJpbmcgbWFudWFsIHVwZGF0aW5nIHdpdGggYSAnbmV3IERhdGUoKScsIGJ1dCBpc1xyXG4gICAgLy8gYmV0dGVyIHRvIHVzZSBwcm9wZXJ0aWVzLlxyXG4gICAgLy8gSXRzIHJhdGVkIHRvIHplcm8ganVzdCB0byBhdm9pZCB0aGF0IGNvbnNlY3V0aXZlXHJcbiAgICAvLyBzeW5jaHJvbm91cyBjaGFuZ2VzIGVtaXQgbG90IG9mIG5vdGlmaWNhdGlvbnMsIHNwZWNpYWxseVxyXG4gICAgLy8gd2l0aCBidWxrIHRhc2tzIGxpa2UgJ3VwZGF0ZVdpdGgnLlxyXG4gICAgdGhpcy5kYXRhVGltZXN0YW1wID0ga28ub2JzZXJ2YWJsZShuZXcgRGF0ZSgpKS5leHRlbmQoeyByYXRlTGltaXQ6IDAgfSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTW9kZWw7XHJcblxyXG4vKipcclxuICAgIERlZmluZSBvYnNlcnZhYmxlIHByb3BlcnRpZXMgdXNpbmcgdGhlIGdpdmVuXHJcbiAgICBwcm9wZXJ0aWVzIG9iamVjdCBkZWZpbml0aW9uIHRoYXQgaW5jbHVkZXMgZGUgZGVmYXVsdCB2YWx1ZXMsXHJcbiAgICBhbmQgc29tZSBvcHRpb25hbCBpbml0aWFsVmFsdWVzIChub3JtYWxseSB0aGF0IGlzIHByb3ZpZGVkIGV4dGVybmFsbHlcclxuICAgIGFzIGEgcGFyYW1ldGVyIHRvIHRoZSBtb2RlbCBjb25zdHJ1Y3Rvciwgd2hpbGUgZGVmYXVsdCB2YWx1ZXMgYXJlXHJcbiAgICBzZXQgaW4gdGhlIGNvbnN0cnVjdG9yKS5cclxuICAgIFRoYXQgcHJvcGVydGllcyBiZWNvbWUgbWVtYmVycyBvZiB0aGUgbW9kZWxPYmplY3QsIHNpbXBsaWZ5aW5nIFxyXG4gICAgbW9kZWwgZGVmaW5pdGlvbnMuXHJcbiAgICBcclxuICAgIEl0IHVzZXMgS25vY2tvdXQub2JzZXJ2YWJsZSBhbmQgb2JzZXJ2YWJsZUFycmF5LCBzbyBwcm9wZXJ0aWVzXHJcbiAgICBhcmUgZnVudGlvbnMgdGhhdCByZWFkcyB0aGUgdmFsdWUgd2hlbiBubyBhcmd1bWVudHMgb3Igc2V0cyB3aGVuXHJcbiAgICBvbmUgYXJndW1lbnQgaXMgcGFzc2VkIG9mLlxyXG4qKi9cclxuTW9kZWwucHJvdG90eXBlLmRlZlByb3BlcnRpZXMgPSBmdW5jdGlvbiBkZWZQcm9wZXJ0aWVzKHByb3BlcnRpZXMsIGluaXRpYWxWYWx1ZXMpIHtcclxuXHJcbiAgICBpbml0aWFsVmFsdWVzID0gaW5pdGlhbFZhbHVlcyB8fCB7fTtcclxuXHJcbiAgICB2YXIgbW9kZWxPYmplY3QgPSB0aGlzLm1vZGVsT2JqZWN0LFxyXG4gICAgICAgIHByb3BlcnRpZXNMaXN0ID0gdGhpcy5wcm9wZXJ0aWVzTGlzdCxcclxuICAgICAgICBkYXRhVGltZXN0YW1wID0gdGhpcy5kYXRhVGltZXN0YW1wO1xyXG5cclxuICAgIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRlZlZhbCA9IHByb3BlcnRpZXNba2V5XTtcclxuICAgICAgICAvLyBDcmVhdGUgb2JzZXJ2YWJsZSBwcm9wZXJ0eSB3aXRoIGRlZmF1bHQgdmFsdWVcclxuICAgICAgICBtb2RlbE9iamVjdFtrZXldID0gQXJyYXkuaXNBcnJheShkZWZWYWwpID9cclxuICAgICAgICAgICAga28ub2JzZXJ2YWJsZUFycmF5KGRlZlZhbCkgOlxyXG4gICAgICAgICAgICBrby5vYnNlcnZhYmxlKGRlZlZhbCk7XHJcbiAgICAgICAgLy8gUmVtZW1iZXIgZGVmYXVsdFxyXG4gICAgICAgIG1vZGVsT2JqZWN0W2tleV0uX2RlZmF1bHRWYWx1ZSA9IGRlZlZhbDtcclxuICAgICAgICAvLyByZW1lbWJlciBpbml0aWFsXHJcbiAgICAgICAgbW9kZWxPYmplY3Rba2V5XS5faW5pdGlhbFZhbHVlID0gaW5pdGlhbFZhbHVlc1trZXldO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIGFuIGluaXRpYWxWYWx1ZSwgc2V0IGl0OlxyXG4gICAgICAgIGlmICh0eXBlb2YoaW5pdGlhbFZhbHVlc1trZXldKSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgbW9kZWxPYmplY3Rba2V5XShpbml0aWFsVmFsdWVzW2tleV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBBZGQgc3Vic2NyaWJlciB0byB1cGRhdGUgdGhlIHRpbWVzdGFtcCBvbiBjaGFuZ2VzXHJcbiAgICAgICAgbW9kZWxPYmplY3Rba2V5XS5zdWJzY3JpYmUoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGRhdGFUaW1lc3RhbXAobmV3IERhdGUoKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQWRkIHRvIHRoZSBpbnRlcm5hbCByZWdpc3RyeVxyXG4gICAgICAgIHByb3BlcnRpZXNMaXN0LnB1c2goa2V5KTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBVcGRhdGUgdGltZXN0YW1wIGFmdGVyIHRoZSBidWxrIGNyZWF0aW9uLlxyXG4gICAgZGF0YVRpbWVzdGFtcChuZXcgRGF0ZSgpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgRGVmaW5lIGZpZWxkcyBhcyBwbGFpbiBtZW1iZXJzIG9mIHRoZSBtb2RlbE9iamVjdCB1c2luZ1xyXG4gICAgdGhlIGZpZWxkcyBvYmplY3QgZGVmaW5pdGlvbiB0aGF0IGluY2x1ZGVzIGRlZmF1bHQgdmFsdWVzLFxyXG4gICAgYW5kIHNvbWUgb3B0aW9uYWwgaW5pdGlhbFZhbHVlcy5cclxuICAgIFxyXG4gICAgSXRzIGxpa2UgZGVmUHJvcGVydGllcywgYnV0IGZvciBwbGFpbiBqcyB2YWx1ZXMgcmF0aGVyIHRoYW4gb2JzZXJ2YWJsZXMuXHJcbioqL1xyXG5Nb2RlbC5wcm90b3R5cGUuZGVmRmllbGRzID0gZnVuY3Rpb24gZGVmRmllbGRzKGZpZWxkcywgaW5pdGlhbFZhbHVlcykge1xyXG5cclxuICAgIGluaXRpYWxWYWx1ZXMgPSBpbml0aWFsVmFsdWVzIHx8IHt9O1xyXG5cclxuICAgIHZhciBtb2RlbE9iamVjdCA9IHRoaXMubW9kZWxPYmplY3QsXHJcbiAgICAgICAgZmllbGRzTGlzdCA9IHRoaXMuZmllbGRzTGlzdDtcclxuXHJcbiAgICBPYmplY3Qua2V5cyhmaWVsZHMpLmVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRlZlZhbCA9IGZpZWxkc1trZXldO1xyXG4gICAgICAgIC8vIENyZWF0ZSBmaWVsZCB3aXRoIGRlZmF1bHQgdmFsdWVcclxuICAgICAgICBtb2RlbE9iamVjdFtrZXldID0gZGVmVmFsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIGFuIGluaXRpYWxWYWx1ZSwgc2V0IGl0OlxyXG4gICAgICAgIGlmICh0eXBlb2YoaW5pdGlhbFZhbHVlc1trZXldKSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgbW9kZWxPYmplY3Rba2V5XSA9IGluaXRpYWxWYWx1ZXNba2V5XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQWRkIHRvIHRoZSBpbnRlcm5hbCByZWdpc3RyeVxyXG4gICAgICAgIGZpZWxkc0xpc3QucHVzaChrZXkpO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIFN0b3JlIHRoZSBsaXN0IG9mIGZpZWxkcyB0aGF0IG1ha2UgdGhlIElEL3ByaW1hcnkga2V5XHJcbiAgICBhbmQgY3JlYXRlIGFuIGFsaWFzICdpZCcgcHJvcGVydHkgdGhhdCByZXR1cm5zIHRoZVxyXG4gICAgdmFsdWUgZm9yIHRoZSBJRCBmaWVsZCBvciBhcnJheSBvZiB2YWx1ZXMgd2hlbiBtdWx0aXBsZVxyXG4gICAgZmllbGRzLlxyXG4qKi9cclxuTW9kZWwucHJvdG90eXBlLmRlZklEID0gZnVuY3Rpb24gZGVmSUQoZmllbGRzTmFtZXMpIHtcclxuICAgIFxyXG4gICAgLy8gU3RvcmUgdGhlIGxpc3RcclxuICAgIHRoaXMuaWRGaWVsZHNOYW1lcyA9IGZpZWxkc05hbWVzO1xyXG4gICAgXHJcbiAgICAvLyBEZWZpbmUgSUQgb2JzZXJ2YWJsZVxyXG4gICAgaWYgKGZpZWxkc05hbWVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIC8vIFJldHVybnMgc2luZ2xlIHZhbHVlXHJcbiAgICAgICAgdmFyIGZpZWxkID0gZmllbGRzTmFtZXNbMF07XHJcbiAgICAgICAgdGhpcy5tb2RlbE9iamVjdC5pZCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbZmllbGRdKCk7XHJcbiAgICAgICAgfSwgdGhpcy5tb2RlbE9iamVjdCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICB0aGlzLm1vZGVsT2JqZWN0LmlkID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmllbGRzTmFtZXMubWFwKGZ1bmN0aW9uKGZpZWxkTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbZmllbGROYW1lXSgpO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgICAgIH0sIHRoaXMubW9kZWxPYmplY3QpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAgICBBbGxvd3MgdG8gcmVnaXN0ZXIgYSBwcm9wZXJ0eSAocHJldmlvdXNseSBkZWZpbmVkKSBhcyBcclxuICAgIHRoZSBtb2RlbCB0aW1lc3RhbXAsIHNvIGdldHMgdXBkYXRlZCBvbiBhbnkgZGF0YSBjaGFuZ2VcclxuICAgIChrZWVwIGluIHN5bmMgd2l0aCB0aGUgaW50ZXJuYWwgZGF0YVRpbWVzdGFtcCkuXHJcbioqL1xyXG5Nb2RlbC5wcm90b3R5cGUucmVnVGltZXN0YW1wID0gZnVuY3Rpb24gcmVnVGltZXN0YW1wUHJvcGVydHkocHJvcGVydHlOYW1lKSB7XHJcblxyXG4gICAgdmFyIHByb3AgPSB0aGlzLm1vZGVsT2JqZWN0W3Byb3BlcnR5TmFtZV07XHJcbiAgICBpZiAodHlwZW9mKHByb3ApICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGVyZSBpcyBubyBvYnNlcnZhYmxlIHByb3BlcnR5IHdpdGggbmFtZSBbJyArIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWUgKyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ10gdG8gcmVnaXN0ZXIgYXMgdGltZXN0YW1wLidcclxuICAgICAgICk7XHJcbiAgICB9XHJcbiAgICAvLyBBZGQgc3Vic2NyaWJlciBvbiBpbnRlcm5hbCB0aW1lc3RhbXAgdG8ga2VlcFxyXG4gICAgLy8gdGhlIHByb3BlcnR5IHVwZGF0ZWRcclxuICAgIHRoaXMuZGF0YVRpbWVzdGFtcC5zdWJzY3JpYmUoZnVuY3Rpb24odGltZXN0YW1wKSB7XHJcbiAgICAgICAgcHJvcCh0aW1lc3RhbXApO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIFJldHVybnMgYSBwbGFpbiBvYmplY3Qgd2l0aCB0aGUgcHJvcGVydGllcyBhbmQgZmllbGRzXHJcbiAgICBvZiB0aGUgbW9kZWwgb2JqZWN0LCBqdXN0IHZhbHVlcy5cclxuICAgIFxyXG4gICAgQHBhcmFtIGRlZXBDb3B5OmJvb2wgSWYgbGVmdCB1bmRlZmluZWQsIGRvIG5vdCBjb3B5IG9iamVjdHMgaW5cclxuICAgIHZhbHVlcyBhbmQgbm90IHJlZmVyZW5jZXMuIElmIGZhbHNlLCBkbyBhIHNoYWxsb3cgY29weSwgc2V0dGluZ1xyXG4gICAgdXAgcmVmZXJlbmNlcyBpbiB0aGUgcmVzdWx0LiBJZiB0cnVlLCB0byBhIGRlZXAgY29weSBvZiBhbGwgb2JqZWN0cy5cclxuKiovXHJcbk1vZGVsLnByb3RvdHlwZS50b1BsYWluT2JqZWN0ID0gZnVuY3Rpb24gdG9QbGFpbk9iamVjdChkZWVwQ29weSkge1xyXG5cclxuICAgIHZhciBwbGFpbiA9IHt9LFxyXG4gICAgICAgIG1vZGVsT2JqID0gdGhpcy5tb2RlbE9iamVjdDtcclxuXHJcbiAgICBmdW5jdGlvbiBzZXRWYWx1ZShwcm9wZXJ0eSwgdmFsKSB7XHJcbiAgICAgICAgLypqc2hpbnQgbWF4Y29tcGxleGl0eTogMTAqL1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICh0eXBlb2YodmFsKSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgaWYgKGRlZXBDb3B5ID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgRGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEEgZGF0ZSBjbG9uZVxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IG5ldyBEYXRlKHZhbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh2YWwgJiYgdmFsLm1vZGVsIGluc3RhbmNlb2YgTW9kZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBBIG1vZGVsIGNvcHlcclxuICAgICAgICAgICAgICAgICAgICBwbGFpbltwcm9wZXJ0eV0gPSB2YWwubW9kZWwudG9QbGFpbk9iamVjdChkZWVwQ29weSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh2YWwgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBwbGFpbltwcm9wZXJ0eV0gPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUGxhaW4gJ3N0YW5kYXJkJyBvYmplY3QgY2xvbmVcclxuICAgICAgICAgICAgICAgICAgICBwbGFpbltwcm9wZXJ0eV0gPSBjbG9uZSh2YWwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGRlZXBDb3B5ID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gU2hhbGxvdyBjb3B5XHJcbiAgICAgICAgICAgICAgICBwbGFpbltwcm9wZXJ0eV0gPSB2YWw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gT24gZWxzZSwgZG8gbm90aGluZywgbm8gcmVmZXJlbmNlcywgbm8gY2xvbmVzXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBwbGFpbltwcm9wZXJ0eV0gPSB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMucHJvcGVydGllc0xpc3QuZm9yRWFjaChmdW5jdGlvbihwcm9wZXJ0eSkge1xyXG4gICAgICAgIC8vIFByb3BlcnRpZXMgYXJlIG9ic2VydmFibGVzLCBzbyBmdW5jdGlvbnMgd2l0aG91dCBwYXJhbXM6XHJcbiAgICAgICAgdmFyIHZhbCA9IG1vZGVsT2JqW3Byb3BlcnR5XSgpO1xyXG5cclxuICAgICAgICBzZXRWYWx1ZShwcm9wZXJ0eSwgdmFsKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuZmllbGRzTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKGZpZWxkKSB7XHJcbiAgICAgICAgLy8gRmllbGRzIGFyZSBqdXN0IHBsYWluIG9iamVjdCBtZW1iZXJzIGZvciB2YWx1ZXMsIGp1c3QgY29weTpcclxuICAgICAgICB2YXIgdmFsID0gbW9kZWxPYmpbZmllbGRdO1xyXG5cclxuICAgICAgICBzZXRWYWx1ZShmaWVsZCwgdmFsKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBwbGFpbjtcclxufTtcclxuXHJcbk1vZGVsLnByb3RvdHlwZS51cGRhdGVXaXRoID0gZnVuY3Rpb24gdXBkYXRlV2l0aChkYXRhLCBkZWVwQ29weSkge1xyXG4gICAgXHJcbiAgICAvLyBXZSBuZWVkIGEgcGxhaW4gb2JqZWN0IGZvciAnZnJvbUpTJy5cclxuICAgIC8vIElmIGlzIGEgbW9kZWwsIGV4dHJhY3QgdGhlaXIgcHJvcGVydGllcyBhbmQgZmllbGRzIGZyb21cclxuICAgIC8vIHRoZSBvYnNlcnZhYmxlcyAoZnJvbUpTKSwgc28gd2Ugbm90IGdldCBjb21wdXRlZFxyXG4gICAgLy8gb3IgZnVuY3Rpb25zLCBqdXN0IHJlZ2lzdGVyZWQgcHJvcGVydGllcyBhbmQgZmllbGRzXHJcbiAgICB2YXIgdGltZXN0YW1wID0gbnVsbDtcclxuICAgIGlmIChkYXRhICYmIGRhdGEubW9kZWwgaW5zdGFuY2VvZiBNb2RlbCkge1xyXG5cclxuICAgICAgICAvLyBXZSBuZWVkIHRvIHNldCB0aGUgc2FtZSB0aW1lc3RhbXAsIHNvXHJcbiAgICAgICAgLy8gcmVtZW1iZXIgZm9yIGFmdGVyIHRoZSBmcm9tSlNcclxuICAgICAgICB0aW1lc3RhbXAgPSBkYXRhLm1vZGVsLmRhdGFUaW1lc3RhbXAoKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBSZXBsYWNlIGRhdGEgd2l0aCBhIHBsYWluIGNvcHkgb2YgaXRzZWxmXHJcbiAgICAgICAgZGF0YSA9IGRhdGEubW9kZWwudG9QbGFpbk9iamVjdChkZWVwQ29weSk7XHJcbiAgICB9XHJcblxyXG4gICAga28ubWFwcGluZy5mcm9tSlMoZGF0YSwgdGhpcy5tYXBwaW5nT3B0aW9ucywgdGhpcy5tb2RlbE9iamVjdCk7XHJcbiAgICAvLyBTYW1lIHRpbWVzdGFtcCBpZiBhbnlcclxuICAgIGlmICh0aW1lc3RhbXApXHJcbiAgICAgICAgdGhpcy5tb2RlbE9iamVjdC5tb2RlbC5kYXRhVGltZXN0YW1wKHRpbWVzdGFtcCk7XHJcbn07XHJcblxyXG5Nb2RlbC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZShkYXRhLCBkZWVwQ29weSkge1xyXG4gICAgLy8gR2V0IGEgcGxhaW4gb2JqZWN0IHdpdGggdGhlIG9iamVjdCBkYXRhXHJcbiAgICB2YXIgcGxhaW4gPSB0aGlzLnRvUGxhaW5PYmplY3QoZGVlcENvcHkpO1xyXG4gICAgLy8gQ3JlYXRlIGEgbmV3IG1vZGVsIGluc3RhbmNlLCB1c2luZyB0aGUgc291cmNlIHBsYWluIG9iamVjdFxyXG4gICAgLy8gYXMgaW5pdGlhbCB2YWx1ZXNcclxuICAgIHZhciBjbG9uZWQgPSBuZXcgdGhpcy5tb2RlbE9iamVjdC5jb25zdHJ1Y3RvcihwbGFpbik7XHJcbiAgICBpZiAoZGF0YSkge1xyXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgY2xvbmVkIHdpdGggdGhlIHByb3ZpZGVkIHBsYWluIGRhdGEgdXNlZFxyXG4gICAgICAgIC8vIHRvIHJlcGxhY2UgdmFsdWVzIG9uIHRoZSBjbG9uZWQgb25lLCBmb3IgcXVpY2sgb25lLXN0ZXAgY3JlYXRpb25cclxuICAgICAgICAvLyBvZiBkZXJpdmVkIG9iamVjdHMuXHJcbiAgICAgICAgY2xvbmVkLm1vZGVsLnVwZGF0ZVdpdGgoZGF0YSk7XHJcbiAgICB9XHJcbiAgICAvLyBDbG9uZWQgbW9kZWwgcmVhZHk6XHJcbiAgICByZXR1cm4gY2xvbmVkO1xyXG59O1xyXG4iLCIvKiogUGVyZm9ybWFuY2VTdW1tYXJ5IG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBMaXN0Vmlld0l0ZW0gPSByZXF1aXJlKCcuL0xpc3RWaWV3SXRlbScpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXHJcbiAgICBudW1lcmFsID0gcmVxdWlyZSgnbnVtZXJhbCcpO1xyXG5cclxuZnVuY3Rpb24gUGVyZm9ybWFuY2VTdW1tYXJ5KHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHZhbHVlcyA9IHZhbHVlcyB8fCB7fTtcclxuXHJcbiAgICB0aGlzLmVhcm5pbmdzID0gbmV3IEVhcm5pbmdzKHZhbHVlcy5lYXJuaW5ncyk7XHJcbiAgICBcclxuICAgIHZhciBlYXJuaW5nc0xpbmUgPSBuZXcgTGlzdFZpZXdJdGVtKCk7XHJcbiAgICBlYXJuaW5nc0xpbmUubWFya2VyTGluZTEgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgbnVtID0gbnVtZXJhbCh0aGlzLmN1cnJlbnRBbW91bnQoKSkuZm9ybWF0KCckMCwwJyk7XHJcbiAgICAgICAgcmV0dXJuIG51bTtcclxuICAgIH0sIHRoaXMuZWFybmluZ3MpO1xyXG4gICAgZWFybmluZ3NMaW5lLmNvbnRlbnRMaW5lMSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRDb25jZXB0KCk7XHJcbiAgICB9LCB0aGlzLmVhcm5pbmdzKTtcclxuICAgIGVhcm5pbmdzTGluZS5tYXJrZXJMaW5lMiA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBudW0gPSBudW1lcmFsKHRoaXMubmV4dEFtb3VudCgpKS5mb3JtYXQoJyQwLDAnKTtcclxuICAgICAgICByZXR1cm4gbnVtO1xyXG4gICAgfSwgdGhpcy5lYXJuaW5ncyk7XHJcbiAgICBlYXJuaW5nc0xpbmUuY29udGVudExpbmUyID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dENvbmNlcHQoKTtcclxuICAgIH0sIHRoaXMuZWFybmluZ3MpO1xyXG4gICAgXHJcblxyXG4gICAgdGhpcy50aW1lQm9va2VkID0gbmV3IFRpbWVCb29rZWQodmFsdWVzLnRpbWVCb29rZWQpO1xyXG5cclxuICAgIHZhciB0aW1lQm9va2VkTGluZSA9IG5ldyBMaXN0Vmlld0l0ZW0oKTtcclxuICAgIHRpbWVCb29rZWRMaW5lLm1hcmtlckxpbmUxID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIG51bSA9IG51bWVyYWwodGhpcy5wZXJjZW50KCkpLmZvcm1hdCgnMCUnKTtcclxuICAgICAgICByZXR1cm4gbnVtO1xyXG4gICAgfSwgdGhpcy50aW1lQm9va2VkKTtcclxuICAgIHRpbWVCb29rZWRMaW5lLmNvbnRlbnRMaW5lMSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbmNlcHQoKTtcclxuICAgIH0sIHRoaXMudGltZUJvb2tlZCk7XHJcbiAgICBcclxuICAgIFxyXG4gICAgdGhpcy5pdGVtcyA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcclxuICAgICAgICBcclxuICAgICAgICBpdGVtcy5wdXNoKGVhcm5pbmdzTGluZSk7XHJcbiAgICAgICAgaXRlbXMucHVzaCh0aW1lQm9va2VkTGluZSk7XHJcblxyXG4gICAgICAgIHJldHVybiBpdGVtcztcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBlcmZvcm1hbmNlU3VtbWFyeTtcclxuXHJcbmZ1bmN0aW9uIEVhcm5pbmdzKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgXHJcbiAgICAgICAgIGN1cnJlbnRBbW91bnQ6IDAsXHJcbiAgICAgICAgIGN1cnJlbnRDb25jZXB0VGVtcGxhdGU6ICdhbHJlYWR5IHBhaWQgdGhpcyBtb250aCcsXHJcbiAgICAgICAgIG5leHRBbW91bnQ6IDAsXHJcbiAgICAgICAgIG5leHRDb25jZXB0VGVtcGxhdGU6ICdwcm9qZWN0ZWQge21vbnRofSBlYXJuaW5ncydcclxuXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmN1cnJlbnRDb25jZXB0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgbW9udGggPSBtb21lbnQoKS5mb3JtYXQoJ01NTU0nKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50Q29uY2VwdFRlbXBsYXRlKCkucmVwbGFjZSgvXFx7bW9udGhcXH0vLCBtb250aCk7XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgdGhpcy5uZXh0Q29uY2VwdCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIG1vbnRoID0gbW9tZW50KCkuYWRkKDEsICdtb250aCcpLmZvcm1hdCgnTU1NTScpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5leHRDb25jZXB0VGVtcGxhdGUoKS5yZXBsYWNlKC9cXHttb250aFxcfS8sIG1vbnRoKTtcclxuXHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gVGltZUJvb2tlZCh2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgIFxyXG4gICAgICAgIHBlcmNlbnQ6IDAsXHJcbiAgICAgICAgY29uY2VwdFRlbXBsYXRlOiAnb2YgYXZhaWxhYmxlIHRpbWUgYm9va2VkIGluIHttb250aH0nXHJcbiAgICBcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuY29uY2VwdCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIG1vbnRoID0gbW9tZW50KCkuYWRkKDEsICdtb250aCcpLmZvcm1hdCgnTU1NTScpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbmNlcHRUZW1wbGF0ZSgpLnJlcGxhY2UoL1xce21vbnRoXFx9LywgbW9udGgpO1xyXG5cclxuICAgIH0sIHRoaXMpO1xyXG59XHJcbiIsIi8qKiBQb3NpdGlvbiBtb2RlbC5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBQb3NpdGlvbih2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBwb3NpdGlvbklEOiAwLFxyXG4gICAgICAgIHBvc2l0aW9uU2luZ3VsYXI6ICcnLFxyXG4gICAgICAgIHBvc2l0aW9uUGx1cmFsOiAnJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJycsXHJcbiAgICAgICAgYWN0aXZlOiB0cnVlXHJcblxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQb3NpdGlvbjtcclxuIiwiLyoqXHJcbiAgICBQcml2YWN5U2V0dGluZ3MgbW9kZWxcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIFByaXZhY3lTZXR0aW5ncyh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgdXNlcklEOiAwLFxyXG4gICAgICAgIHNtc0Jvb2tpbmdDb21tdW5pY2F0aW9uOiBmYWxzZSxcclxuICAgICAgICBwaG9uZUJvb2tpbmdDb21tdW5pY2F0aW9uOiBmYWxzZSxcclxuICAgICAgICBsb2Nvbm9taWNzQ29tbXVuaXR5Q29tbXVuaWNhdGlvbjogZmFsc2UsXHJcbiAgICAgICAgbG9jb25vbWljc0RibUNhbXBhaWduczogZmFsc2UsXHJcbiAgICAgICAgcHJvZmlsZVNlb1Blcm1pc3Npb246IGZhbHNlLFxyXG4gICAgICAgIGxvY29ub21pY3NNYXJrZXRpbmdDYW1wYWlnbnM6IGZhbHNlLFxyXG4gICAgICAgIGNvQnJhbmRlZFBhcnRuZXJQZXJtaXNzaW9uczogZmFsc2UsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGxcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmSUQoWyd1c2VySUQnXSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUHJpdmFjeVNldHRpbmdzO1xyXG4iLCIvKipcclxuICAgIFNjaGVkdWxpbmdQcmVmZXJlbmNlcyBtb2RlbC5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBTY2hlZHVsaW5nUHJlZmVyZW5jZXModmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgYWR2YW5jZVRpbWU6IDI0LFxyXG4gICAgICAgIGJldHdlZW5UaW1lOiAwLFxyXG4gICAgICAgIGluY3JlbWVudHNTaXplSW5NaW51dGVzOiAxNVxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTY2hlZHVsaW5nUHJlZmVyZW5jZXM7XHJcbiIsIi8qKiBTZXJ2aWNlIG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBTZXJ2aWNlKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgIHByaWNlOiAwLFxyXG4gICAgICAgIGR1cmF0aW9uOiAwLCAvLyBpbiBtaW51dGVzXHJcbiAgICAgICAgaXNBZGRvbjogZmFsc2VcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuZHVyYXRpb25UZXh0ID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIG1pbnV0ZXMgPSB0aGlzLmR1cmF0aW9uKCkgfHwgMDtcclxuICAgICAgICAvLyBUT0RPOiBGb3JtYXR0aW5nLCBsb2NhbGl6YXRpb25cclxuICAgICAgICByZXR1cm4gbWludXRlcyA/IG1pbnV0ZXMgKyAnIG1pbnV0ZXMnIDogJyc7XHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZXJ2aWNlO1xyXG4iLCIvKipcclxuICAgIFNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSBtb2RlbC5cclxuICAgIFxyXG4gICAgSXRzICdzaW1wbGlmaWVkJyBiZWNhdXNlIGl0IHByb3ZpZGVzIGFuIEFQSVxyXG4gICAgZm9yIHNpbXBsZSB0aW1lIHJhbmdlIHBlciB3ZWVrIGRheSxcclxuICAgIGEgcGFpciBvZiBmcm9tLXRvIHRpbWVzLlxyXG4gICAgR29vZCBmb3IgY3VycmVudCBzaW1wbGUgVUkuXHJcbiAgICBcclxuICAgIFRoZSBvcmlnaW5hbCB3ZWVrbHkgc2NoZWR1bGUgZGVmaW5lcyB0aGUgc2NoZWR1bGVcclxuICAgIGluIDE1IG1pbnV0ZXMgc2xvdHMsIHNvIG11bHRpcGxlIHRpbWUgcmFuZ2VzIGNhblxyXG4gICAgZXhpc3RzIHBlciB3ZWVrIGRheSwganVzdCBtYXJraW5nIGVhY2ggc2xvdFxyXG4gICAgYXMgYXZhaWxhYmxlIG9yIHVuYXZhaWxhYmxlLiBUaGUgQXBwTW9kZWxcclxuICAgIHdpbGwgZmlsbCB0aGlzIG1vZGVsIGluc3RhbmNlcyBwcm9wZXJseSBtYWtpbmdcclxuICAgIGFueSBjb252ZXJzaW9uIGZyb20vdG8gdGhlIHNvdXJjZSBkYXRhLlxyXG4gKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbi8qKlxyXG4gICAgU3VibW9kZWwgdGhhdCBpcyB1c2VkIG9uIHRoZSBTaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGVcclxuICAgIGRlZmluaW5nIGEgc2luZ2xlIHdlZWsgZGF5IGF2YWlsYWJpbGl0eSByYW5nZS5cclxuICAgIEEgZnVsbCBkYXkgbXVzdCBoYXZlIHZhbHVlcyBmcm9tOjAgdG86MTQ0MCwgbmV2ZXJcclxuICAgIGJvdGggYXMgemVybyBiZWNhdXNlIHRoYXRzIGNvbnNpZGVyZWQgYXMgbm90IGF2YWlsYWJsZSxcclxuICAgIHNvIGlzIGJldHRlciB0byB1c2UgdGhlIGlzQWxsRGF5IHByb3BlcnR5LlxyXG4qKi9cclxuZnVuY3Rpb24gV2Vla0RheVNjaGVkdWxlKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICAvLyBOT1RFOiBmcm9tLXRvIHByb3BlcmllcyBhcyBudW1iZXJzXHJcbiAgICAvLyBmb3IgdGhlIG1pbnV0ZSBvZiB0aGUgZGF5LCBmcm9tIDAgKDAwOjAwKSB0byAxNDM5ICgyMzo1OSlcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgZnJvbTogMCxcclxuICAgICAgICB0bzogMFxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgSXQgYWxsb3dzIHRvIGtub3cgaWYgdGhpcyB3ZWVrIGRheSBpcyBcclxuICAgICAgICBlbmFibGVkIGZvciB3ZWVrbHkgc2NoZWR1bGUsIGp1c3QgaXRcclxuICAgICAgICBoYXMgZnJvbS10byB0aW1lcy5cclxuICAgICAgICBJdCBhbGxvd3MgdG8gYmUgc2V0IGFzIHRydWUgcHV0dGluZ1xyXG4gICAgICAgIGEgZGVmYXVsdCByYW5nZSAoOWEtNXApIG9yIGZhbHNlIFxyXG4gICAgICAgIHNldHRpbmcgYm90aCBhcyAwcC5cclxuICAgICAgICBcclxuICAgICAgICBTaW5jZSBvbiB3cml0ZSB0d28gb2JzZXJ2YWJsZXMgYXJlIGJlaW5nIG1vZGlmaWVkLCBhbmRcclxuICAgICAgICBib3RoIGFyZSB1c2VkIGluIHRoZSByZWFkLCBhIHNpbmdsZSBjaGFuZ2UgdG8gdGhlIFxyXG4gICAgICAgIHZhbHVlIHdpbGwgdHJpZ2dlciB0d28gbm90aWZpY2F0aW9uczsgdG8gYXZvaWQgdGhhdCxcclxuICAgICAgICB0aGUgb2JzZXJ2YWJsZSBpcyByYXRlIGxpbWl0ZWQgd2l0aCBhbiBpbm1lZGlhdGUgdmFsdWUsXHJcbiAgICAgICAgc29uIG9ubHkgb25lIG5vdGlmaWNhdGlvbiBpcyByZWNlaXZlZC5cclxuICAgICoqL1xyXG4gICAgdGhpcy5pc0VuYWJsZWQgPSBrby5jb21wdXRlZCh7XHJcbiAgICAgICAgcmVhZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICB0eXBlb2YodGhpcy5mcm9tKCkpID09PSAnbnVtYmVyJyAmJlxyXG4gICAgICAgICAgICAgICAgdHlwZW9mKHRoaXMudG8oKSkgPT09ICdudW1iZXInICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZyb20oKSA8IHRoaXMudG8oKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgICAgICBpZiAodmFsID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBEZWZhdWx0IHJhbmdlIDlhIC0gNXBcclxuICAgICAgICAgICAgICAgIHRoaXMuZnJvbUhvdXIoOSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvSG91cigxNyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvSG91cigwKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZnJvbSgwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3duZXI6IHRoaXNcclxuICAgIH0pLmV4dGVuZCh7IHJhdGVMaW1pdDogMCB9KTtcclxuICAgIFxyXG4gICAgdGhpcy5pc0FsbERheSA9IGtvLmNvbXB1dGVkKHtcclxuICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuICAoXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZyb20oKSA9PT0gMCAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy50bygpID09PSAxNDQwXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB3cml0ZTogZnVuY3Rpb24oLyp2YWwqLykge1xyXG4gICAgICAgICAgICB0aGlzLmZyb20oMCk7XHJcbiAgICAgICAgICAgIHRoaXMudG8oMTQ0MCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvd25lcjogdGhpc1xyXG4gICAgfSkuZXh0ZW5kKHsgcmF0ZUxpbWl0OiAwIH0pO1xyXG4gICAgXHJcbiAgICAvLyBBZGRpdGlvbmFsIGludGVyZmFjZXMgdG8gZ2V0L3NldCB0aGUgZnJvbS90byB0aW1lc1xyXG4gICAgLy8gYnkgdXNpbmcgYSBkaWZmZXJlbnQgZGF0YSB1bml0IG9yIGZvcm1hdC5cclxuICAgIFxyXG4gICAgLy8gSW50ZWdlciwgcm91bmRlZC11cCwgbnVtYmVyIG9mIGhvdXJzXHJcbiAgICB0aGlzLmZyb21Ib3VyID0ga28uY29tcHV0ZWQoe1xyXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcih0aGlzLmZyb20oKSAvIDYwKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHdyaXRlOiBmdW5jdGlvbihob3Vycykge1xyXG4gICAgICAgICAgICB0aGlzLmZyb20oKGhvdXJzICogNjApIHwwKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIG93bmVyOiB0aGlzXHJcbiAgICB9KTtcclxuICAgIHRoaXMudG9Ib3VyID0ga28uY29tcHV0ZWQoe1xyXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5jZWlsKHRoaXMudG8oKSAvIDYwKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHdyaXRlOiBmdW5jdGlvbihob3Vycykge1xyXG4gICAgICAgICAgICB0aGlzLnRvKChob3VycyAqIDYwKSB8MCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvd25lcjogdGhpc1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIFN0cmluZywgdGltZSBmb3JtYXQgKCdoaDptbScpXHJcbiAgICB0aGlzLmZyb21UaW1lID0ga28uY29tcHV0ZWQoe1xyXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbWludXRlc1RvVGltZVN0cmluZyh0aGlzLmZyb20oKSB8MCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB3cml0ZTogZnVuY3Rpb24odGltZSkge1xyXG4gICAgICAgICAgICB0aGlzLmZyb20odGltZVN0cmluZ1RvTWludXRlcyh0aW1lKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvd25lcjogdGhpc1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLnRvVGltZSA9IGtvLmNvbXB1dGVkKHtcclxuICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1pbnV0ZXNUb1RpbWVTdHJpbmcodGhpcy50bygpIHwwKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHdyaXRlOiBmdW5jdGlvbih0aW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMudG8odGltZVN0cmluZ1RvTWludXRlcyh0aW1lKSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvd25lcjogdGhpc1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgTWFpbiBtb2RlbCBkZWZpbmluZyB0aGUgd2VlayBzY2hlZHVsZVxyXG4gICAgcGVyIHdlZWsgZGF0ZSwgb3IganVzdCBzZXQgYWxsIGRheXMgdGltZXNcclxuICAgIGFzIGF2YWlsYWJsZSB3aXRoIGEgc2luZ2xlIGZsYWcuXHJcbioqL1xyXG5mdW5jdGlvbiBTaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgc3VuZGF5OiBuZXcgV2Vla0RheVNjaGVkdWxlKCksXHJcbiAgICAgICAgbW9uZGF5OiBuZXcgV2Vla0RheVNjaGVkdWxlKCksXHJcbiAgICAgICAgdHVlc2RheTogbmV3IFdlZWtEYXlTY2hlZHVsZSgpLFxyXG4gICAgICAgIHdlZG5lc2RheTogbmV3IFdlZWtEYXlTY2hlZHVsZSgpLFxyXG4gICAgICAgIHRodXJzZGF5OiBuZXcgV2Vla0RheVNjaGVkdWxlKCksXHJcbiAgICAgICAgZnJpZGF5OiBuZXcgV2Vla0RheVNjaGVkdWxlKCksXHJcbiAgICAgICAgc2F0dXJkYXk6IG5ldyBXZWVrRGF5U2NoZWR1bGUoKSxcclxuICAgICAgICBpc0FsbFRpbWU6IGZhbHNlXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZTtcclxuXHJcbi8vLy8gVVRJTFMsXHJcbi8vIFRPRE8gT3JnYW5pemUgb3IgZXh0ZXJuYWxpemUuIHNvbWUgY29waWVkIGZvcm0gYXBwbW9kZWwuLlxyXG4vKipcclxuICAgIGludGVybmFsIHV0aWxpdHkgZnVuY3Rpb24gJ3RvIHN0cmluZyB3aXRoIHR3byBkaWdpdHMgYWxtb3N0J1xyXG4qKi9cclxuZnVuY3Rpb24gdHdvRGlnaXRzKG4pIHtcclxuICAgIHJldHVybiBNYXRoLmZsb29yKG4gLyAxMCkgKyAnJyArIG4gJSAxMDtcclxufVxyXG5cclxuLyoqXHJcbiAgICBDb252ZXJ0IGEgbnVtYmVyIG9mIG1pbnV0ZXNcclxuICAgIGluIGEgc3RyaW5nIGxpa2U6IDAwOjAwOjAwIChob3VyczptaW51dGVzOnNlY29uZHMpXHJcbioqL1xyXG5mdW5jdGlvbiBtaW51dGVzVG9UaW1lU3RyaW5nKG1pbnV0ZXMpIHtcclxuICAgIHZhciBkID0gbW9tZW50LmR1cmF0aW9uKG1pbnV0ZXMsICdtaW51dGVzJyksXHJcbiAgICAgICAgaCA9IGQuaG91cnMoKSxcclxuICAgICAgICBtID0gZC5taW51dGVzKCksXHJcbiAgICAgICAgcyA9IGQuc2Vjb25kcygpO1xyXG4gICAgXHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgIHR3b0RpZ2l0cyhoKSArICc6JyArXHJcbiAgICAgICAgdHdvRGlnaXRzKG0pICsgJzonICtcclxuICAgICAgICB0d29EaWdpdHMocylcclxuICAgICk7XHJcbn1cclxuXHJcbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuZnVuY3Rpb24gdGltZVN0cmluZ1RvTWludXRlcyh0aW1lKSB7XHJcbiAgICByZXR1cm4gbW9tZW50LmR1cmF0aW9uKHRpbWUpLmFzTWludXRlcygpIHwwO1xyXG59IiwiLyoqIFVwY29taW5nQm9va2luZ3NTdW1tYXJ5IG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBCb29raW5nU3VtbWFyeSA9IHJlcXVpcmUoJy4vQm9va2luZ1N1bW1hcnknKTtcclxuXHJcbmZ1bmN0aW9uIFVwY29taW5nQm9va2luZ3NTdW1tYXJ5KCkge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMudG9kYXkgPSBuZXcgQm9va2luZ1N1bW1hcnkoe1xyXG4gICAgICAgIGNvbmNlcHQ6ICdtb3JlIHRvZGF5JyxcclxuICAgICAgICB0aW1lRm9ybWF0OiAnIFtlbmRpbmcgQF0gaDptbWEnXHJcbiAgICB9KTtcclxuICAgIHRoaXMudG9tb3Jyb3cgPSBuZXcgQm9va2luZ1N1bW1hcnkoe1xyXG4gICAgICAgIGNvbmNlcHQ6ICd0b21vcnJvdycsXHJcbiAgICAgICAgdGltZUZvcm1hdDogJyBbc3RhcnRpbmcgQF0gaDptbWEnXHJcbiAgICB9KTtcclxuICAgIHRoaXMubmV4dFdlZWsgPSBuZXcgQm9va2luZ1N1bW1hcnkoe1xyXG4gICAgICAgIGNvbmNlcHQ6ICduZXh0IHdlZWsnLFxyXG4gICAgICAgIHRpbWVGb3JtYXQ6IG51bGxcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLml0ZW1zID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBpdGVtcyA9IFtdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vaWYgKHRoaXMudG9kYXkucXVhbnRpdHkoKSlcclxuICAgICAgICBpdGVtcy5wdXNoKHRoaXMudG9kYXkpO1xyXG4gICAgICAgIC8vaWYgKHRoaXMudG9tb3Jyb3cucXVhbnRpdHkoKSlcclxuICAgICAgICBpdGVtcy5wdXNoKHRoaXMudG9tb3Jyb3cpO1xyXG4gICAgICAgIC8vaWYgKHRoaXMubmV4dFdlZWsucXVhbnRpdHkoKSlcclxuICAgICAgICBpdGVtcy5wdXNoKHRoaXMubmV4dFdlZWspO1xyXG5cclxuICAgICAgICByZXR1cm4gaXRlbXM7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFVwY29taW5nQm9va2luZ3NTdW1tYXJ5O1xyXG4iLCIvKiogVXNlciBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuLy8gRW51bSBVc2VyVHlwZVxyXG52YXIgVXNlclR5cGUgPSB7XHJcbiAgICBOb25lOiAwLFxyXG4gICAgQW5vbnltb3VzOiAxLFxyXG4gICAgQ3VzdG9tZXI6IDIsXHJcbiAgICBGcmVlbGFuY2VyOiA0LFxyXG4gICAgQWRtaW46IDgsXHJcbiAgICBMb2dnZWRVc2VyOiAxNCxcclxuICAgIFVzZXI6IDE1LFxyXG4gICAgU3lzdGVtOiAxNlxyXG59O1xyXG5cclxuZnVuY3Rpb24gVXNlcih2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgdXNlcklEOiAwLFxyXG4gICAgICAgIGVtYWlsOiAnJyxcclxuICAgICAgICBcclxuICAgICAgICBmaXJzdE5hbWU6ICcnLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnJyxcclxuICAgICAgICBzZWNvbmRMYXN0TmFtZTogJycsXHJcbiAgICAgICAgYnVzaW5lc3NOYW1lOiAnJyxcclxuICAgICAgICBcclxuICAgICAgICBhbHRlcm5hdGl2ZUVtYWlsOiAnJyxcclxuICAgICAgICBwaG9uZTogJycsXHJcbiAgICAgICAgY2FuUmVjZWl2ZVNtczogJycsXHJcbiAgICAgICAgYmlydGhNb250aERheTogbnVsbCxcclxuICAgICAgICBiaXJ0aE1vbnRoOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGlzRnJlZWxhbmNlcjogZmFsc2UsXHJcbiAgICAgICAgaXNDdXN0b21lcjogZmFsc2UsXHJcbiAgICAgICAgaXNNZW1iZXI6IGZhbHNlLFxyXG4gICAgICAgIGlzQWRtaW46IGZhbHNlLFxyXG5cclxuICAgICAgICBvbmJvYXJkaW5nU3RlcDogbnVsbCxcclxuICAgICAgICBhY2NvdW50U3RhdHVzSUQ6IDAsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGxcclxuICAgIH0sIHZhbHVlcyk7XHJcblxyXG4gICAgdGhpcy5mdWxsTmFtZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgbmFtZVBhcnRzID0gW3RoaXMuZmlyc3ROYW1lKCldO1xyXG4gICAgICAgIGlmICh0aGlzLmxhc3ROYW1lKCkpXHJcbiAgICAgICAgICAgIG5hbWVQYXJ0cy5wdXNoKHRoaXMubGFzdE5hbWUoKSk7XHJcbiAgICAgICAgaWYgKHRoaXMuc2Vjb25kTGFzdE5hbWUoKSlcclxuICAgICAgICAgICAgbmFtZVBhcnRzLnB1c2godGhpcy5zZWNvbmRMYXN0TmFtZSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG5hbWVQYXJ0cy5qb2luKCcgJyk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5iaXJ0aERheSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAodGhpcy5iaXJ0aE1vbnRoRGF5KCkgJiZcclxuICAgICAgICAgICAgdGhpcy5iaXJ0aE1vbnRoKCkpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFRPRE8gaTEwblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5iaXJ0aE1vbnRoKCkgKyAnLycgKyB0aGlzLmJpcnRoTW9udGhEYXkoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnVzZXJUeXBlID0ga28ucHVyZUNvbXB1dGVkKHtcclxuICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIGMgPSB0aGlzLmlzQ3VzdG9tZXIoKSxcclxuICAgICAgICAgICAgICAgIHAgPSB0aGlzLmlzRnJlZWxhbmNlcigpLFxyXG4gICAgICAgICAgICAgICAgYSA9IHRoaXMuaXNBZG1pbigpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHVzZXJUeXBlID0gMDtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQW5vbnltb3VzKCkpXHJcbiAgICAgICAgICAgICAgICB1c2VyVHlwZSA9IHVzZXJUeXBlIHwgVXNlclR5cGUuQW5vbnltb3VzO1xyXG4gICAgICAgICAgICBpZiAoYylcclxuICAgICAgICAgICAgICAgIHVzZXJUeXBlID0gdXNlclR5cGUgfCBVc2VyVHlwZS5DdXN0b21lcjtcclxuICAgICAgICAgICAgaWYgKHApXHJcbiAgICAgICAgICAgICAgICB1c2VyVHlwZSA9IHVzZXJUeXBlIHwgVXNlclR5cGUuRnJlZWxhbmNlcjtcclxuICAgICAgICAgICAgaWYgKGEpXHJcbiAgICAgICAgICAgICAgICB1c2VyVHlwZSA9IHVzZXJUeXBlIHwgVXNlclR5cGUuQWRtaW47XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gdXNlclR5cGU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKiBOT1RFOiBOb3QgcmVxdWlyZWQgZm9yIG5vdzpcclxuICAgICAgICB3cml0ZTogZnVuY3Rpb24odikge1xyXG4gICAgICAgIH0sKi9cclxuICAgICAgICBvd25lcjogdGhpc1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMuaXNBbm9ueW1vdXMgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuICAgICAgICByZXR1cm4gdGhpcy51c2VySUQoKSA8IDE7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgSXQgbWF0Y2hlcyBhIFVzZXJUeXBlIGZyb20gdGhlIGVudW1lcmF0aW9uP1xyXG4gICAgKiovXHJcbiAgICB0aGlzLmlzVXNlclR5cGUgPSBmdW5jdGlvbiBpc1VzZXJUeXBlKHR5cGUpIHtcclxuICAgICAgICByZXR1cm4gKHRoaXMudXNlclR5cGUoKSAmIHR5cGUpO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFVzZXI7XHJcblxyXG5Vc2VyLlVzZXJUeXBlID0gVXNlclR5cGU7XHJcblxyXG4vKiBDcmVhdGludCBhbiBhbm9ueW1vdXMgdXNlciB3aXRoIHNvbWUgcHJlc3NldHMgKi9cclxuVXNlci5uZXdBbm9ueW1vdXMgPSBmdW5jdGlvbiBuZXdBbm9ueW1vdXMoKSB7XHJcbiAgICByZXR1cm4gbmV3IFVzZXIoe1xyXG4gICAgICAgIHVzZXJJRDogMCxcclxuICAgICAgICBlbWFpbDogJycsXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnJyxcclxuICAgICAgICBvbmJvYXJkaW5nU3RlcDogbnVsbFxyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qKiBDYWxlbmRhciBBcHBvaW50bWVudHMgdGVzdCBkYXRhICoqL1xyXG52YXIgQXBwb2ludG1lbnQgPSByZXF1aXJlKCcuLi9tb2RlbHMvQXBwb2ludG1lbnQnKTtcclxudmFyIHRlc3RMb2NhdGlvbnMgPSByZXF1aXJlKCcuL2xvY2F0aW9ucycpLmxvY2F0aW9ucztcclxudmFyIHRlc3RTZXJ2aWNlcyA9IHJlcXVpcmUoJy4vc2VydmljZXMnKS5zZXJ2aWNlcztcclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxudmFyIC8vdG9kYXkgPSBtb21lbnQoKSxcclxuICAgIHRvbW9ycm93ID0gbW9tZW50KCkuYWRkKDEsICdkYXlzJyksXHJcbiAgICB0b21vcnJvdzEwID0gdG9tb3Jyb3cuY2xvbmUoKS5ob3VycygxMCkubWludXRlcygwKS5zZWNvbmRzKDApLFxyXG4gICAgdG9tb3Jyb3cxNiA9IHRvbW9ycm93LmNsb25lKCkuaG91cnMoMTYpLm1pbnV0ZXMoMzApLnNlY29uZHMoMCk7XHJcbiAgICBcclxudmFyIHRlc3REYXRhID0gW1xyXG4gICAgbmV3IEFwcG9pbnRtZW50KHtcclxuICAgICAgICBpZDogMSxcclxuICAgICAgICBzdGFydFRpbWU6IHRvbW9ycm93MTAsXHJcbiAgICAgICAgZW5kVGltZTogdG9tb3Jyb3cxNixcclxuICAgICAgICBzdW1tYXJ5OiAnTWFzc2FnZSBUaGVyYXBpc3QgQm9va2luZycsXHJcbiAgICAgICAgLy9wcmljaW5nU3VtbWFyeTogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UgMTIwbSBwbHVzIDIgbW9yZScsXHJcbiAgICAgICAgc2VydmljZXM6IHRlc3RTZXJ2aWNlcyxcclxuICAgICAgICBwdG90YWxQcmljZTogOTUuMCxcclxuICAgICAgICBsb2NhdGlvbjoga28udG9KUyh0ZXN0TG9jYXRpb25zWzBdKSxcclxuICAgICAgICBwcmVOb3Rlc1RvQ2xpZW50OiAnTG9va2luZyBmb3J3YXJkIHRvIHNlZWluZyB0aGUgbmV3IGNvbG9yJyxcclxuICAgICAgICBwcmVOb3Rlc1RvU2VsZjogJ0FzayBoaW0gYWJvdXQgaGlzIG5ldyBjb2xvcicsXHJcbiAgICAgICAgY2xpZW50OiB7XHJcbiAgICAgICAgICAgIGZpcnN0TmFtZTogJ0pvc2h1YScsXHJcbiAgICAgICAgICAgIGxhc3ROYW1lOiAnRGFuaWVsc29uJ1xyXG4gICAgICAgIH1cclxuICAgIH0pLFxyXG4gICAgbmV3IEFwcG9pbnRtZW50KHtcclxuICAgICAgICBpZDogMixcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxMywgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDEsIDEzLCA1MCwgMCksXHJcbiAgICAgICAgc3VtbWFyeTogJ01hc3NhZ2UgVGhlcmFwaXN0IEJvb2tpbmcnLFxyXG4gICAgICAgIC8vcHJpY2luZ1N1bW1hcnk6ICdBbm90aGVyIE1hc3NhZ2UgNTBtJyxcclxuICAgICAgICBzZXJ2aWNlczogW3Rlc3RTZXJ2aWNlc1swXV0sXHJcbiAgICAgICAgcHRvdGFsUHJpY2U6IDk1LjAsXHJcbiAgICAgICAgbG9jYXRpb246IGtvLnRvSlModGVzdExvY2F0aW9uc1sxXSksXHJcbiAgICAgICAgcHJlTm90ZXNUb0NsaWVudDogJ1NvbWV0aGluZyBlbHNlJyxcclxuICAgICAgICBwcmVOb3Rlc1RvU2VsZjogJ1JlbWVtYmVyIHRoYXQgdGhpbmcnLFxyXG4gICAgICAgIGNsaWVudDoge1xyXG4gICAgICAgICAgICBmaXJzdE5hbWU6ICdKb3NodWEnLFxyXG4gICAgICAgICAgICBsYXN0TmFtZTogJ0RhbmllbHNvbidcclxuICAgICAgICB9XHJcbiAgICB9KSxcclxuICAgIG5ldyBBcHBvaW50bWVudCh7XHJcbiAgICAgICAgaWQ6IDMsXHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMSwgMTYsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxOCwgMCwgMCksXHJcbiAgICAgICAgc3VtbWFyeTogJ01hc3NhZ2UgVGhlcmFwaXN0IEJvb2tpbmcnLFxyXG4gICAgICAgIC8vcHJpY2luZ1N1bW1hcnk6ICdUaXNzdWUgTWFzc2FnZSAxMjBtJyxcclxuICAgICAgICBzZXJ2aWNlczogW3Rlc3RTZXJ2aWNlc1sxXV0sXHJcbiAgICAgICAgcHRvdGFsUHJpY2U6IDk1LjAsXHJcbiAgICAgICAgbG9jYXRpb246IGtvLnRvSlModGVzdExvY2F0aW9uc1syXSksXHJcbiAgICAgICAgcHJlTm90ZXNUb0NsaWVudDogJycsXHJcbiAgICAgICAgcHJlTm90ZXNUb1NlbGY6ICdBc2sgaGltIGFib3V0IHRoZSBmb3Jnb3R0ZW4gbm90ZXMnLFxyXG4gICAgICAgIGNsaWVudDoge1xyXG4gICAgICAgICAgICBmaXJzdE5hbWU6ICdKb3NodWEnLFxyXG4gICAgICAgICAgICBsYXN0TmFtZTogJ0RhbmllbHNvbidcclxuICAgICAgICB9XHJcbiAgICB9KSxcclxuXTtcclxuXHJcbmV4cG9ydHMuYXBwb2ludG1lbnRzID0gdGVzdERhdGE7XHJcbiIsIi8qKiBDbGllbnRzIHRlc3QgZGF0YSAqKi9cclxudmFyIENsaWVudCA9IHJlcXVpcmUoJy4uL21vZGVscy9DbGllbnQnKTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IFtcclxuICAgIG5ldyBDbGllbnQgKHtcclxuICAgICAgICBpZDogMSxcclxuICAgICAgICBmaXJzdE5hbWU6ICdKb3NodWEnLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRGFuaWVsc29uJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBpZDogMixcclxuICAgICAgICBmaXJzdE5hbWU6ICdJYWdvJyxcclxuICAgICAgICBsYXN0TmFtZTogJ0xvcmVuem8nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiAzLFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0Zlcm5hbmRvJyxcclxuICAgICAgICBsYXN0TmFtZTogJ0dhZ28nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiA0LFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FkYW0nLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRmluY2gnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiA1LFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FsYW4nLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRmVyZ3Vzb24nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGlkOiA2LFxyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FsZXgnLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnUGVuYSdcclxuICAgIH0pLFxyXG4gICAgbmV3IENsaWVudCh7XHJcbiAgICAgICAgaWQ6IDcsXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnQWxleGlzJyxcclxuICAgICAgICBsYXN0TmFtZTogJ1BlYWNhJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBpZDogOCxcclxuICAgICAgICBmaXJzdE5hbWU6ICdBcnRodXInLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnTWlsbGVyJ1xyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMuY2xpZW50cyA9IHRlc3REYXRhO1xyXG4iLCIvKiogTG9jYXRpb25zIHRlc3QgZGF0YSAqKi9cclxudmFyIExvY2F0aW9uID0gcmVxdWlyZSgnLi4vbW9kZWxzL0xvY2F0aW9uJyk7XHJcblxyXG52YXIgdGVzdERhdGEgPSBbXHJcbiAgICBuZXcgTG9jYXRpb24gKHtcclxuICAgICAgICBsb2NhdGlvbklEOiAxLFxyXG4gICAgICAgIG5hbWU6ICdBY3R2aVNwYWNlJyxcclxuICAgICAgICBhZGRyZXNzTGluZTE6ICczMTUwIDE4dGggU3RyZWV0JyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwMSxcclxuICAgICAgICBpc1NlcnZpY2VSYWRpdXM6IHRydWUsXHJcbiAgICAgICAgc2VydmljZVJhZGl1czogMlxyXG4gICAgfSksXHJcbiAgICBuZXcgTG9jYXRpb24oe1xyXG4gICAgICAgIGxvY2F0aW9uSUQ6IDIsXHJcbiAgICAgICAgbmFtZTogJ0NvcmV5XFwncyBBcHQnLFxyXG4gICAgICAgIGFkZHJlc3NMaW5lMTogJzE4NyBCb2NhbmEgU3QuJyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwMlxyXG4gICAgfSksXHJcbiAgICBuZXcgTG9jYXRpb24oe1xyXG4gICAgICAgIGxvY2F0aW9uSUQ6IDMsXHJcbiAgICAgICAgbmFtZTogJ0pvc2hcXCdhIEFwdCcsXHJcbiAgICAgICAgYWRkcmVzc0xpbmUxOiAnNDI5IENvcmJldHQgQXZlJyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwM1xyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMubG9jYXRpb25zID0gdGVzdERhdGE7XHJcbiIsIi8qKiBJbmJveCB0ZXN0IGRhdGEgKiovXHJcbnZhciBNZXNzYWdlID0gcmVxdWlyZSgnLi4vbW9kZWxzL01lc3NhZ2UnKTtcclxuXHJcbnZhciBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xyXG4vL3ZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbnZhciB0b2RheSA9IG5ldyBEYXRlKCksXHJcbiAgICB5ZXN0ZXJkYXkgPSBuZXcgRGF0ZSgpLFxyXG4gICAgbGFzdFdlZWsgPSBuZXcgRGF0ZSgpLFxyXG4gICAgb2xkRGF0ZSA9IG5ldyBEYXRlKCk7XHJcbnllc3RlcmRheS5zZXREYXRlKHllc3RlcmRheS5nZXREYXRlKCkgLSAxKTtcclxubGFzdFdlZWsuc2V0RGF0ZShsYXN0V2Vlay5nZXREYXRlKCkgLSAyKTtcclxub2xkRGF0ZS5zZXREYXRlKG9sZERhdGUuZ2V0RGF0ZSgpIC0gMTYpO1xyXG5cclxudmFyIHRlc3REYXRhID0gW1xyXG4gICAgbmV3IE1lc3NhZ2Uoe1xyXG4gICAgICAgIGlkOiAxLFxyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBuZXcgVGltZSh0b2RheSwgMTEsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdDT05GSVJNLVN1c2FuIERlZScsXHJcbiAgICAgICAgY29udGVudDogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UnLFxyXG4gICAgICAgIGxpbms6ICcvY29udmVyc2F0aW9uLzEnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6ICckNzAnLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXdhcm5pbmcnXHJcbiAgICB9KSxcclxuICAgIG5ldyBNZXNzYWdlKHtcclxuICAgICAgICBpZDogMyxcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbmV3IFRpbWUoeWVzdGVyZGF5LCAxMywgMCwgMCksXHJcblxyXG4gICAgICAgIHN1YmplY3Q6ICdEbyB5b3UgZG8gXCJFeG90aWMgTWFzc2FnZVwiPycsXHJcbiAgICAgICAgY29udGVudDogJ0hpLCBJIHdhbnRlZCB0byBrbm93IGlmIHlvdSBwZXJmb3JtIGFzIHBhciBvZiB5b3VyIHNlcnZpY2VzLi4uJyxcclxuICAgICAgICBsaW5rOiAnL2NvbnZlcnNhdGlvbi8zJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tc2hhcmUtYWx0JyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KSxcclxuICAgIG5ldyBNZXNzYWdlKHtcclxuICAgICAgICBpZDogMixcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbmV3IFRpbWUobGFzdFdlZWssIDEyLCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnSm9zaCBEYW5pZWxzb24nLFxyXG4gICAgICAgIGNvbnRlbnQ6ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBsaW5rOiAnL2NvbnZlcnNhdGlvbi8yJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgTWVzc2FnZSh7XHJcbiAgICAgICAgaWQ6IDQsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG5ldyBUaW1lKG9sZERhdGUsIDE1LCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnSW5xdWlyeScsXHJcbiAgICAgICAgY29udGVudDogJ0Fub3RoZXIgcXVlc3Rpb24gZnJvbSBhbm90aGVyIGNsaWVudC4nLFxyXG4gICAgICAgIGxpbms6ICcvY29udmVyc2F0aW9uLzQnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1zaGFyZS1hbHQnLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KVxyXG5dO1xyXG5cclxuZXhwb3J0cy5tZXNzYWdlcyA9IHRlc3REYXRhO1xyXG4iLCIvKiogU2VydmljZXMgdGVzdCBkYXRhICoqL1xyXG52YXIgU2VydmljZSA9IHJlcXVpcmUoJy4uL21vZGVscy9TZXJ2aWNlJyk7XHJcblxyXG52YXIgdGVzdERhdGEgPSBbXHJcbiAgICBuZXcgU2VydmljZSAoe1xyXG4gICAgICAgIG5hbWU6ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBwcmljZTogOTUsXHJcbiAgICAgICAgZHVyYXRpb246IDEyMFxyXG4gICAgfSksXHJcbiAgICBuZXcgU2VydmljZSh7XHJcbiAgICAgICAgbmFtZTogJ1Rpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBwcmljZTogNjAsXHJcbiAgICAgICAgZHVyYXRpb246IDYwXHJcbiAgICB9KSxcclxuICAgIG5ldyBTZXJ2aWNlKHtcclxuICAgICAgICBuYW1lOiAnU3BlY2lhbCBvaWxzJyxcclxuICAgICAgICBwcmljZTogOTUsXHJcbiAgICAgICAgaXNBZGRvbjogdHJ1ZVxyXG4gICAgfSksXHJcbiAgICBuZXcgU2VydmljZSh7XHJcbiAgICAgICAgbmFtZTogJ1NvbWUgc2VydmljZSBleHRyYScsXHJcbiAgICAgICAgcHJpY2U6IDQwLFxyXG4gICAgICAgIGR1cmF0aW9uOiAyMCxcclxuICAgICAgICBpc0FkZG9uOiB0cnVlXHJcbiAgICB9KVxyXG5dO1xyXG5cclxuZXhwb3J0cy5zZXJ2aWNlcyA9IHRlc3REYXRhO1xyXG4iLCIvKiogXHJcbiAgICB0aW1lU2xvdHNcclxuICAgIHRlc3RpbmcgZGF0YVxyXG4qKi9cclxuXHJcbnZhciBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xyXG5cclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxudmFyIHRvZGF5ID0gbmV3IERhdGUoKSxcclxuICAgIHRvbW9ycm93ID0gbmV3IERhdGUoKTtcclxudG9tb3Jyb3cuc2V0RGF0ZSh0b21vcnJvdy5nZXREYXRlKCkgKyAxKTtcclxuXHJcbnZhciBzdG9kYXkgPSBtb21lbnQodG9kYXkpLmZvcm1hdCgnWVlZWS1NTS1ERCcpLFxyXG4gICAgc3RvbW9ycm93ID0gbW9tZW50KHRvbW9ycm93KS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcclxuXHJcbnZhciB0ZXN0RGF0YTEgPSBbXHJcbiAgICBUaW1lKHRvZGF5LCA5LCAxNSksXHJcbiAgICBUaW1lKHRvZGF5LCAxMSwgMzApLFxyXG4gICAgVGltZSh0b2RheSwgMTIsIDApLFxyXG4gICAgVGltZSh0b2RheSwgMTIsIDMwKSxcclxuICAgIFRpbWUodG9kYXksIDE2LCAxNSksXHJcbiAgICBUaW1lKHRvZGF5LCAxOCwgMCksXHJcbiAgICBUaW1lKHRvZGF5LCAxOCwgMzApLFxyXG4gICAgVGltZSh0b2RheSwgMTksIDApLFxyXG4gICAgVGltZSh0b2RheSwgMTksIDMwKSxcclxuICAgIFRpbWUodG9kYXksIDIxLCAzMCksXHJcbiAgICBUaW1lKHRvZGF5LCAyMiwgMClcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YTIgPSBbXHJcbiAgICBUaW1lKHRvbW9ycm93LCA4LCAwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEwLCAzMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMSwgMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMSwgMzApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTIsIDApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTIsIDMwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEzLCAwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEzLCAzMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxNCwgNDUpLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTYsIDApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTYsIDMwKVxyXG5dO1xyXG5cclxudmFyIHRlc3REYXRhQnVzeSA9IFtcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IHtcclxuICAgICdkZWZhdWx0JzogdGVzdERhdGFCdXN5XHJcbn07XHJcbnRlc3REYXRhW3N0b2RheV0gPSB0ZXN0RGF0YTE7XHJcbnRlc3REYXRhW3N0b21vcnJvd10gPSB0ZXN0RGF0YTI7XHJcblxyXG5leHBvcnRzLnRpbWVTbG90cyA9IHRlc3REYXRhO1xyXG4iLCIvKipcclxuICAgIFV0aWxpdHkgdG8gaGVscCB0cmFjayB0aGUgc3RhdGUgb2YgY2FjaGVkIGRhdGFcclxuICAgIG1hbmFnaW5nIHRpbWUsIHByZWZlcmVuY2UgYW5kIGlmIG11c3QgYmUgcmV2YWxpZGF0ZWRcclxuICAgIG9yIG5vdC5cclxuICAgIFxyXG4gICAgSXRzIGp1c3QgbWFuYWdlcyBtZXRhIGRhdGEsIGJ1dCBub3QgdGhlIGRhdGEgdG8gYmUgY2FjaGVkLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxuZnVuY3Rpb24gQ2FjaGVDb250cm9sKG9wdGlvbnMpIHtcclxuICAgIFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcblxyXG4gICAgLy8gQSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIG9yXHJcbiAgICAvLyBBbiBvYmplY3Qgd2l0aCBkZXNpcmVkIHVuaXRzIGFuZCBhbW91bnQsIGFsbCBvcHRpb25hbCxcclxuICAgIC8vIGFueSBjb21iaW5hdGlvbiB3aXRoIGFsbW9zdCBvbmUgc3BlY2lmaWVkLCBzYW1wbGU6XHJcbiAgICAvLyB7IHllYXJzOiAwLCBtb250aHM6IDAsIHdlZWtzOiAwLCBcclxuICAgIC8vICAgZGF5czogMCwgaG91cnM6IDAsIG1pbnV0ZXM6IDAsIHNlY29uZHM6IDAsIG1pbGxpc2Vjb25kczogMCB9XHJcbiAgICB0aGlzLnR0bCA9IG1vbWVudC5kdXJhdGlvbihvcHRpb25zLnR0bCkuYXNNaWxsaXNlY29uZHMoKTtcclxuICAgIHRoaXMubGF0ZXN0ID0gb3B0aW9ucy5sYXRlc3QgfHwgbnVsbDtcclxuXHJcbiAgICB0aGlzLm11c3RSZXZhbGlkYXRlID0gZnVuY3Rpb24gbXVzdFJldmFsaWRhdGUoKSB7XHJcbiAgICAgICAgdmFyIHRkaWZmID0gdGhpcy5sYXRlc3QgJiYgbmV3IERhdGUoKSAtIHRoaXMubGF0ZXN0IHx8IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcclxuICAgICAgICByZXR1cm4gdGRpZmYgPiB0aGlzLnR0bDtcclxuICAgIH07XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ2FjaGVDb250cm9sO1xyXG4iLCIvKipcclxuICAgIE5ldyBGdW5jdGlvbiBtZXRob2Q6ICdfZGVsYXllZCcuXHJcbiAgICBJdCByZXR1cm5zIGEgbmV3IGZ1bmN0aW9uLCB3cmFwcGluZyB0aGUgb3JpZ2luYWwgb25lLFxyXG4gICAgdGhhdCBvbmNlIGl0cyBjYWxsIHdpbGwgZGVsYXkgdGhlIGV4ZWN1dGlvbiB0aGUgZ2l2ZW4gbWlsbGlzZWNvbmRzLFxyXG4gICAgdXNpbmcgYSBzZXRUaW1lb3V0LlxyXG4gICAgVGhlIG5ldyBmdW5jdGlvbiByZXR1cm5zICd1bmRlZmluZWQnIHNpbmNlIGl0IGhhcyBub3QgdGhlIHJlc3VsdCxcclxuICAgIGJlY2F1c2Ugb2YgdGhhdCBpcyBvbmx5IHN1aXRhYmxlIHdpdGggcmV0dXJuLWZyZWUgZnVuY3Rpb25zIFxyXG4gICAgbGlrZSBldmVudCBoYW5kbGVycy5cclxuICAgIFxyXG4gICAgV2h5OiBzb21ldGltZXMsIHRoZSBoYW5kbGVyIGZvciBhbiBldmVudCBuZWVkcyB0byBiZSBleGVjdXRlZFxyXG4gICAgYWZ0ZXIgYSBkZWxheSBpbnN0ZWFkIG9mIGluc3RhbnRseS5cclxuKiovXHJcbkZ1bmN0aW9uLnByb3RvdHlwZS5fZGVsYXllZCA9IGZ1bmN0aW9uIGRlbGF5ZWQobWlsbGlzZWNvbmRzKSB7XHJcbiAgICB2YXIgZm4gPSB0aGlzO1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBjb250ZXh0ID0gdGhpcyxcclxuICAgICAgICAgICAgYXJncyA9IGFyZ3VtZW50cztcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZm4uYXBwbHkoY29udGV4dCwgYXJncyk7XHJcbiAgICAgICAgfSwgbWlsbGlzZWNvbmRzKTtcclxuICAgIH07XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgRXh0ZW5kaW5nIHRoZSBGdW5jdGlvbiBjbGFzcyB3aXRoIGFuIGluaGVyaXRzIG1ldGhvZC5cclxuICAgIFxyXG4gICAgVGhlIGluaXRpYWwgbG93IGRhc2ggaXMgdG8gbWFyayBpdCBhcyBuby1zdGFuZGFyZC5cclxuKiovXHJcbkZ1bmN0aW9uLnByb3RvdHlwZS5faW5oZXJpdHMgPSBmdW5jdGlvbiBfaW5oZXJpdHMoc3VwZXJDdG9yKSB7XHJcbiAgICB0aGlzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yOiB7XHJcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLFxyXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXHJcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKipcclxuICAgIFV0aWxpdHkgdGhhdCBhbGxvd3MgdG8ga2VlcCBhbiBvcmlnaW5hbCBtb2RlbCB1bnRvdWNoZWRcclxuICAgIHdoaWxlIGVkaXRpbmcgYSB2ZXJzaW9uLCBoZWxwaW5nIHN5bmNocm9uaXplIGJvdGhcclxuICAgIHdoZW4gZGVzaXJlZCBieSBwdXNoL3B1bGwvc3luYy1pbmcuXHJcbiAgICBcclxuICAgIEl0cyB0aGUgdXN1YWwgd2F5IHRvIHdvcmsgb24gZm9ybXMsIHdoZXJlIGFuIGluIG1lbW9yeVxyXG4gICAgbW9kZWwgY2FuIGJlIHVzZWQgYnV0IGluIGEgY29weSBzbyBjaGFuZ2VzIGRvZXNuJ3QgYWZmZWN0c1xyXG4gICAgb3RoZXIgdXNlcyBvZiB0aGUgaW4tbWVtb3J5IG1vZGVsIChhbmQgYXZvaWRzIHJlbW90ZSBzeW5jaW5nKVxyXG4gICAgdW50aWwgdGhlIGNvcHkgd2FudCB0byBiZSBwZXJzaXN0ZWQgYnkgcHVzaGluZyBpdCwgb3IgYmVpbmdcclxuICAgIGRpc2NhcmRlZCBvciByZWZyZXNoZWQgd2l0aCBhIHJlbW90ZWx5IHVwZGF0ZWQgb3JpZ2luYWwgbW9kZWwuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xyXG5cclxuZnVuY3Rpb24gTW9kZWxWZXJzaW9uKG9yaWdpbmFsKSB7XHJcbiAgICBcclxuICAgIEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm9yaWdpbmFsID0gb3JpZ2luYWw7XHJcbiAgICBcclxuICAgIC8vIENyZWF0ZSB2ZXJzaW9uXHJcbiAgICAvLyAodXBkYXRlV2l0aCB0YWtlcyBjYXJlIHRvIHNldCB0aGUgc2FtZSBkYXRhVGltZXN0YW1wKVxyXG4gICAgdGhpcy52ZXJzaW9uID0gb3JpZ2luYWwubW9kZWwuY2xvbmUoKTtcclxuICAgIFxyXG4gICAgLy8gQ29tcHV0ZWQgdGhhdCB0ZXN0IGVxdWFsaXR5LCBhbGxvd2luZyBiZWluZyBub3RpZmllZCBvZiBjaGFuZ2VzXHJcbiAgICAvLyBBIHJhdGVMaW1pdCBpcyB1c2VkIG9uIGVhY2ggdG8gYXZvaWQgc2V2ZXJhbCBzeW5jcmhvbm91cyBub3RpZmljYXRpb25zLlxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBSZXR1cm5zIHRydWUgd2hlbiBib3RoIHZlcnNpb25zIGhhcyB0aGUgc2FtZSB0aW1lc3RhbXBcclxuICAgICoqL1xyXG4gICAgdGhpcy5hcmVEaWZmZXJlbnQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24gYXJlRGlmZmVyZW50KCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMub3JpZ2luYWwubW9kZWwuZGF0YVRpbWVzdGFtcCgpICE9PSBcclxuICAgICAgICAgICAgdGhpcy52ZXJzaW9uLm1vZGVsLmRhdGFUaW1lc3RhbXAoKVxyXG4gICAgICAgICk7XHJcbiAgICB9LCB0aGlzKS5leHRlbmQoeyByYXRlTGltaXQ6IDAgfSk7XHJcbiAgICAvKipcclxuICAgICAgICBSZXR1cm5zIHRydWUgd2hlbiB0aGUgdmVyc2lvbiBoYXMgbmV3ZXIgY2hhbmdlcyB0aGFuXHJcbiAgICAgICAgdGhlIG9yaWdpbmFsXHJcbiAgICAqKi9cclxuICAgIHRoaXMuaXNOZXdlciA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbiBpc05ld2VyKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMub3JpZ2luYWwubW9kZWwuZGF0YVRpbWVzdGFtcCgpIDwgXHJcbiAgICAgICAgICAgIHRoaXMudmVyc2lvbi5tb2RlbC5kYXRhVGltZXN0YW1wKClcclxuICAgICAgICApO1xyXG4gICAgfSwgdGhpcykuZXh0ZW5kKHsgcmF0ZUxpbWl0OiAwIH0pO1xyXG4gICAgLyoqXHJcbiAgICAgICAgUmV0dXJucyB0cnVlIHdoZW4gdGhlIHZlcnNpb24gaGFzIG9sZGVyIGNoYW5nZXMgdGhhblxyXG4gICAgICAgIHRoZSBvcmlnaW5hbFxyXG4gICAgKiovXHJcbiAgICB0aGlzLmlzT2Jzb2xldGUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24gaXNDb21wdXRlZCgpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLm9yaWdpbmFsLm1vZGVsLmRhdGFUaW1lc3RhbXAoKSA+IFxyXG4gICAgICAgICAgICB0aGlzLnZlcnNpb24ubW9kZWwuZGF0YVRpbWVzdGFtcCgpXHJcbiAgICAgICAgKTtcclxuICAgIH0sIHRoaXMpLmV4dGVuZCh7IHJhdGVMaW1pdDogMCB9KTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNb2RlbFZlcnNpb247XHJcblxyXG5Nb2RlbFZlcnNpb24uX2luaGVyaXRzKEV2ZW50RW1pdHRlcik7XHJcblxyXG4vKipcclxuICAgIFNlbmRzIHRoZSB2ZXJzaW9uIGNoYW5nZXMgdG8gdGhlIG9yaWdpbmFsXHJcbiAgICBcclxuICAgIG9wdGlvbnM6IHtcclxuICAgICAgICBldmVuSWZOZXdlcjogZmFsc2VcclxuICAgIH1cclxuKiovXHJcbk1vZGVsVmVyc2lvbi5wcm90b3R5cGUucHVsbCA9IGZ1bmN0aW9uIHB1bGwob3B0aW9ucykge1xyXG5cclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgXHJcbiAgICAvLyBCeSBkZWZhdWx0LCBub3RoaW5nIHRvIGRvLCBvciBhdm9pZCBvdmVyd3JpdGUgY2hhbmdlcy5cclxuICAgIHZhciByZXN1bHQgPSBmYWxzZSxcclxuICAgICAgICByb2xsYmFjayA9IG51bGw7XHJcbiAgICBcclxuICAgIGlmIChvcHRpb25zLmV2ZW5JZk5ld2VyIHx8ICF0aGlzLmlzTmV3ZXIoKSkge1xyXG4gICAgICAgIC8vIFVwZGF0ZSB2ZXJzaW9uIHdpdGggdGhlIG9yaWdpbmFsIGRhdGEsXHJcbiAgICAgICAgLy8gY3JlYXRpbmcgZmlyc3QgYSByb2xsYmFjayBmdW5jdGlvbi5cclxuICAgICAgICByb2xsYmFjayA9IGNyZWF0ZVJvbGxiYWNrRnVuY3Rpb24odGhpcy52ZXJzaW9uKTtcclxuICAgICAgICAvLyBFdmVyIGRlZXBDb3B5LCBzaW5jZSBvbmx5IHByb3BlcnRpZXMgYW5kIGZpZWxkcyBmcm9tIG1vZGVsc1xyXG4gICAgICAgIC8vIGFyZSBjb3BpZWQgYW5kIHRoYXQgbXVzdCBhdm9pZCBjaXJjdWxhciByZWZlcmVuY2VzXHJcbiAgICAgICAgLy8gVGhlIG1ldGhvZCB1cGRhdGVXaXRoIHRha2VzIGNhcmUgdG8gc2V0IHRoZSBzYW1lIGRhdGFUaW1lc3RhbXA6ICAgICAgICBcclxuICAgICAgICB0aGlzLnZlcnNpb24ubW9kZWwudXBkYXRlV2l0aCh0aGlzLm9yaWdpbmFsLCB0cnVlKTtcclxuICAgICAgICAvLyBEb25lXHJcbiAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmVtaXQoJ3B1bGwnLCByZXN1bHQsIHJvbGxiYWNrKTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG4vKipcclxuICAgIERpc2NhcmQgdGhlIHZlcnNpb24gY2hhbmdlcyBnZXR0aW5nIHRoZSBvcmlnaW5hbFxyXG4gICAgZGF0YS5cclxuICAgIFxyXG4gICAgb3B0aW9uczoge1xyXG4gICAgICAgIGV2ZW5JZk9ic29sZXRlOiBmYWxzZVxyXG4gICAgfVxyXG4qKi9cclxuTW9kZWxWZXJzaW9uLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gcHVzaChvcHRpb25zKSB7XHJcbiAgICBcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgXHJcbiAgICAvLyBCeSBkZWZhdWx0LCBub3RoaW5nIHRvIGRvLCBvciBhdm9pZCBvdmVyd3JpdGUgY2hhbmdlcy5cclxuICAgIHZhciByZXN1bHQgPSBmYWxzZSxcclxuICAgICAgICByb2xsYmFjayA9IG51bGw7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuZXZlbklmT2Jzb2xldGUgfHwgIXRoaXMuaXNPYnNvbGV0ZSgpKSB7XHJcbiAgICAgICAgLy8gVXBkYXRlIG9yaWdpbmFsLCBjcmVhdGluZyBmaXJzdCBhIHJvbGxiYWNrIGZ1bmN0aW9uLlxyXG4gICAgICAgIHJvbGxiYWNrID0gY3JlYXRlUm9sbGJhY2tGdW5jdGlvbih0aGlzLm9yaWdpbmFsKTtcclxuICAgICAgICAvLyBFdmVyIGRlZXBDb3B5LCBzaW5jZSBvbmx5IHByb3BlcnRpZXMgYW5kIGZpZWxkcyBmcm9tIG1vZGVsc1xyXG4gICAgICAgIC8vIGFyZSBjb3BpZWQgYW5kIHRoYXQgbXVzdCBhdm9pZCBjaXJjdWxhciByZWZlcmVuY2VzXHJcbiAgICAgICAgLy8gVGhlIG1ldGhvZCB1cGRhdGVXaXRoIHRha2VzIGNhcmUgdG8gc2V0IHRoZSBzYW1lIGRhdGFUaW1lc3RhbXAuXHJcbiAgICAgICAgdGhpcy5vcmlnaW5hbC5tb2RlbC51cGRhdGVXaXRoKHRoaXMudmVyc2lvbiwgdHJ1ZSk7XHJcbiAgICAgICAgLy8gRG9uZVxyXG4gICAgICAgIHJlc3VsdCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5lbWl0KCdwdXNoJywgcmVzdWx0LCByb2xsYmFjayk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBTZXRzIG9yaWdpbmFsIGFuZCB2ZXJzaW9uIG9uIHRoZSBzYW1lIHZlcnNpb25cclxuICAgIGJ5IGdldHRpbmcgdGhlIG5ld2VzdCBvbmUuXHJcbioqL1xyXG5Nb2RlbFZlcnNpb24ucHJvdG90eXBlLnN5bmMgPSBmdW5jdGlvbiBzeW5jKCkge1xyXG4gICAgXHJcbiAgICBpZiAodGhpcy5pc05ld2VyKCkpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucHVzaCgpO1xyXG4gICAgZWxzZSBpZiAodGhpcy5pc09ic29sZXRlKCkpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucHVsbCgpO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgVXRpbGl0eSB0aGF0IGNyZWF0ZSBhIGZ1bmN0aW9uIGFibGUgdG8gXHJcbiAgICBwZXJmb3JtIGEgZGF0YSByb2xsYmFjayBvbiBleGVjdXRpb24sIHVzZWZ1bFxyXG4gICAgdG8gcGFzcyBvbiB0aGUgZXZlbnRzIHRvIGFsbG93IHJlYWN0IHVwb24gY2hhbmdlc1xyXG4gICAgb3IgZXh0ZXJuYWwgc3luY2hyb25pemF0aW9uIGZhaWx1cmVzLlxyXG4qKi9cclxuZnVuY3Rpb24gY3JlYXRlUm9sbGJhY2tGdW5jdGlvbihtb2RlbEluc3RhbmNlKSB7XHJcbiAgICAvLyBQcmV2aW91cyBmdW5jdGlvbiBjcmVhdGlvbiwgZ2V0IE5PVyB0aGUgaW5mb3JtYXRpb24gdG9cclxuICAgIC8vIGJlIGJhY2tlZCBmb3IgbGF0ZXIuXHJcbiAgICB2YXIgYmFja2VkRGF0YSA9IG1vZGVsSW5zdGFuY2UubW9kZWwudG9QbGFpbk9iamVjdCh0cnVlKSxcclxuICAgICAgICBiYWNrZWRUaW1lc3RhbXAgPSBtb2RlbEluc3RhbmNlLm1vZGVsLmRhdGFUaW1lc3RhbXAoKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgdGhlIGZ1bmN0aW9uIHRoYXQgKm1heSogZ2V0IGV4ZWN1dGVkIGxhdGVyLCBhZnRlclxyXG4gICAgLy8gY2hhbmdlcyB3ZXJlIGRvbmUgaW4gdGhlIG1vZGVsSW5zdGFuY2UuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gcm9sbGJhY2soKSB7XHJcbiAgICAgICAgLy8gU2V0IHRoZSBiYWNrZWQgZGF0YVxyXG4gICAgICAgIG1vZGVsSW5zdGFuY2UubW9kZWwudXBkYXRlV2l0aChiYWNrZWREYXRhKTtcclxuICAgICAgICAvLyBBbmQgdGhlIHRpbWVzdGFtcFxyXG4gICAgICAgIG1vZGVsSW5zdGFuY2UubW9kZWwuZGF0YVRpbWVzdGFtcChiYWNrZWRUaW1lc3RhbXApO1xyXG4gICAgfTtcclxufVxyXG4iLCIvKipcclxuICAgIFJlbW90ZU1vZGVsIGNsYXNzLlxyXG4gICAgXHJcbiAgICBJdCBoZWxwcyBtYW5hZ2luZyBhIG1vZGVsIGluc3RhbmNlLCBtb2RlbCB2ZXJzaW9uc1xyXG4gICAgZm9yIGluIG1lbW9yeSBtb2RpZmljYXRpb24sIGFuZCB0aGUgcHJvY2VzcyB0byBcclxuICAgIHJlY2VpdmUgb3Igc2VuZCB0aGUgbW9kZWwgZGF0YVxyXG4gICAgdG8gYSByZW1vdGUgc291cmNlcywgd2l0aCBnbHVlIGNvZGUgZm9yIHRoZSB0YXNrc1xyXG4gICAgYW5kIHN0YXRlIHByb3BlcnRpZXMuXHJcbiAgICBcclxuICAgIEV2ZXJ5IGluc3RhbmNlIG9yIHN1YmNsYXNzIG11c3QgaW1wbGVtZW50XHJcbiAgICB0aGUgZmV0Y2ggYW5kIHB1bGwgbWV0aG9kcyB0aGF0IGtub3dzIHRoZSBzcGVjaWZpY3NcclxuICAgIG9mIHRoZSByZW1vdGVzLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIE1vZGVsVmVyc2lvbiA9IHJlcXVpcmUoJy4uL3V0aWxzL01vZGVsVmVyc2lvbicpLFxyXG4gICAgQ2FjaGVDb250cm9sID0gcmVxdWlyZSgnLi4vdXRpbHMvQ2FjaGVDb250cm9sJyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBsb2NhbGZvcmFnZSA9IHJlcXVpcmUoJ2xvY2FsZm9yYWdlJyksXHJcbiAgICBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXI7XHJcblxyXG5mdW5jdGlvbiBSZW1vdGVNb2RlbChvcHRpb25zKSB7XHJcblxyXG4gICAgRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XHJcbiAgICBcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgXHJcbiAgICB2YXIgZmlyc3RUaW1lTG9hZCA9IHRydWU7XHJcbiAgICBcclxuICAgIC8vIE1hcmtzIGEgbG9jayBsb2FkaW5nIGlzIGhhcHBlbmluZywgYW55IHVzZXIgY29kZVxyXG4gICAgLy8gbXVzdCB3YWl0IGZvciBpdFxyXG4gICAgdGhpcy5pc0xvYWRpbmcgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuICAgIC8vIE1hcmtzIGEgbG9jayBzYXZpbmcgaXMgaGFwcGVuaW5nLCBhbnkgdXNlciBjb2RlXHJcbiAgICAvLyBtdXN0IHdhaXQgZm9yIGl0XHJcbiAgICB0aGlzLmlzU2F2aW5nID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcbiAgICAvLyBNYXJrcyBhIGJhY2tncm91bmQgc3luY2hyb25pemF0aW9uOiBsb2FkIG9yIHNhdmUsXHJcbiAgICAvLyB1c2VyIGNvZGUga25vd3MgaXMgaGFwcGVuaW5nIGJ1dCBjYW4gY29udGludWVcclxuICAgIC8vIHVzaW5nIGNhY2hlZCBkYXRhXHJcbiAgICB0aGlzLmlzU3luY2luZyA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG4gICAgLy8gVXRpbGl0eSB0byBrbm93IHdoZXRoZXIgYW55IGxvY2tpbmcgb3BlcmF0aW9uIGlzXHJcbiAgICAvLyBoYXBwZW5pbmcuXHJcbiAgICAvLyBKdXN0IGxvYWRpbmcgb3Igc2F2aW5nXHJcbiAgICB0aGlzLmlzTG9ja2VkID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNMb2FkaW5nKCkgfHwgdGhpcy5pc1NhdmluZygpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIGlmICghb3B0aW9ucy5kYXRhKVxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUmVtb3RlTW9kZWwgZGF0YSBtdXN0IGJlIHNldCBvbiBjb25zdHJ1Y3RvciBhbmQgbm8gY2hhbmdlZCBsYXRlcicpO1xyXG4gICAgdGhpcy5kYXRhID0gb3B0aW9ucy5kYXRhO1xyXG4gICAgXHJcbiAgICB0aGlzLmNhY2hlID0gbmV3IENhY2hlQ29udHJvbCh7XHJcbiAgICAgICAgdHRsOiBvcHRpb25zLnR0bFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIE9wdGlvbmFsIG5hbWUgdXNlZCB0byBwZXJzaXN0IGEgY29weSBvZiB0aGUgZGF0YSBhcyBwbGFpbiBvYmplY3RcclxuICAgIC8vIGluIHRoZSBsb2NhbCBzdG9yYWdlIG9uIGV2ZXJ5IHN1Y2Nlc3NmdWxseSBsb2FkL3NhdmUgb3BlcmF0aW9uLlxyXG4gICAgLy8gV2l0aCBubyBuYW1lLCBubyBzYXZlZCAoZGVmYXVsdCkuXHJcbiAgICAvLyBJdCB1c2VzICdsb2NhbGZvcmFnZScsIHNvIG1heSBiZSBub3Qgc2F2ZWQgdXNpbmcgbG9jYWxTdG9yYWdlIGFjdHVhbGx5LFxyXG4gICAgLy8gYnV0IGFueSBzdXBwb3J0ZWQgYW5kIGluaXRpYWxpemVkIHN0b3JhZ2Ugc3lzdGVtLCBsaWtlIFdlYlNRTCwgSW5kZXhlZERCIG9yIExvY2FsU3RvcmFnZS5cclxuICAgIC8vIGxvY2FsZm9yYWdlIG11c3QgaGF2ZSBhIHNldC11cCBwcmV2aW91cyB1c2Ugb2YgdGhpcyBvcHRpb24uXHJcbiAgICB0aGlzLmxvY2FsU3RvcmFnZU5hbWUgPSBvcHRpb25zLmxvY2FsU3RvcmFnZU5hbWUgfHwgbnVsbDtcclxuICAgIFxyXG4gICAgLy8gUmVjb21tZW5kZWQgd2F5IHRvIGdldCB0aGUgaW5zdGFuY2UgZGF0YVxyXG4gICAgLy8gc2luY2UgaXQgZW5zdXJlcyB0byBsYXVuY2ggYSBsb2FkIG9mIHRoZVxyXG4gICAgLy8gZGF0YSBlYWNoIHRpbWUgaXMgYWNjZXNzZWQgdGhpcyB3YXkuXHJcbiAgICB0aGlzLmdldERhdGEgPSBmdW5jdGlvbiBnZXREYXRhKCkge1xyXG4gICAgICAgIHRoaXMubG9hZCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGE7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMubmV3VmVyc2lvbiA9IGZ1bmN0aW9uIG5ld1ZlcnNpb24oKSB7XHJcbiAgICAgICAgdmFyIHYgPSBuZXcgTW9kZWxWZXJzaW9uKHRoaXMuZGF0YSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVXBkYXRlIHRoZSB2ZXJzaW9uIGRhdGEgd2l0aCB0aGUgb3JpZ2luYWxcclxuICAgICAgICAvLyBhZnRlciBhIGxvY2sgbG9hZCBmaW5pc2gsIGxpa2UgdGhlIGZpcnN0IHRpbWUsXHJcbiAgICAgICAgLy8gc2luY2UgdGhlIFVJIHRvIGVkaXQgdGhlIHZlcnNpb24gd2lsbCBiZSBsb2NrXHJcbiAgICAgICAgLy8gaW4gdGhlIG1pZGRsZS5cclxuICAgICAgICB0aGlzLmlzTG9hZGluZy5zdWJzY3JpYmUoZnVuY3Rpb24gKGlzSXQpIHtcclxuICAgICAgICAgICAgaWYgKCFpc0l0KSB7XHJcbiAgICAgICAgICAgICAgICB2LnB1bGwoeyBldmVuSWZOZXdlcjogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFNhdmUgdGhlIHJlbW90ZSB3aGVuIHN1Y2Nlc3NmdWxseSBwdXNoZWQgdGhlIG5ldyB2ZXJzaW9uXHJcbiAgICAgICAgdi5vbigncHVzaCcsIGZ1bmN0aW9uKHN1Y2Nlc3MsIHJvbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGlmIChzdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNhdmUoKVxyXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSB2ZXJzaW9uIGRhdGEgd2l0aCB0aGUgbmV3IG9uZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGZyb20gdGhlIHJlbW90ZSwgdGhhdCBtYXkgaW5jbHVkZSByZW1vdGUgY29tcHV0ZWRcclxuICAgICAgICAgICAgICAgICAgICAvLyB2YWx1ZXM6XHJcbiAgICAgICAgICAgICAgICAgICAgdi5wdWxsKHsgZXZlbklmTmV3ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRvIGNhdGNoIHRoZSBlcnJvciBpcyBpbXBvcnRhbnQgXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdG8gYXZvaWQgJ3Vua25vdyBlcnJvcidzIGZyb20gYmVpbmdcclxuICAgICAgICAgICAgICAgICAgICAvLyBsb2dnZWQgb24gdGhlIGNvbnNvbGUuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGVycm9yIGNhbiBiZSByZWFkIGJ5IGxpc3RlbmluZyB0aGUgJ2Vycm9yJyBldmVudC5cclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAvLyBQZXJmb3JtcyBhIHJvbGxiYWNrIG9mIHRoZSBvcmlnaW5hbCBtb2RlbFxyXG4gICAgICAgICAgICAgICAgICAgIHJvbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIHZlcnNpb24gZGF0YSBrZWVwcyB1bnRvdWNoZWQsIHVzZXIgbWF5IHdhbnQgdG8gcmV0cnlcclxuICAgICAgICAgICAgICAgICAgICAvLyBvciBtYWRlIGNoYW5nZXMgb24gaXRzIHVuLXNhdmVkIGRhdGEuXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIHJldHVybiB2O1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgdGhpcy5mZXRjaCA9IG9wdGlvbnMuZmV0Y2ggfHwgZnVuY3Rpb24gZmV0Y2goKSB7IHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkJyk7IH07XHJcbiAgICB0aGlzLnB1c2ggPSBvcHRpb25zLnB1c2ggfHwgZnVuY3Rpb24gcHVzaCgpIHsgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZCcpOyB9O1xyXG5cclxuICAgIHZhciBsb2FkRnJvbVJlbW90ZSA9IGZ1bmN0aW9uIGxvYWRGcm9tUmVtb3RlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmZldGNoKClcclxuICAgICAgICAudGhlbihmdW5jdGlvbiAoc2VydmVyRGF0YSkge1xyXG4gICAgICAgICAgICBpZiAoc2VydmVyRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgLy8gRXZlciBkZWVwQ29weSwgc2luY2UgcGxhaW4gZGF0YSBmcm9tIHRoZSBzZXJ2ZXIgKGFuZCBhbnlcclxuICAgICAgICAgICAgICAgIC8vIGluIGJldHdlZW4gY29udmVyc2lvbiBvbiAnZmVjdGgnKSBjYW5ub3QgaGF2ZSBjaXJjdWxhclxyXG4gICAgICAgICAgICAgICAgLy8gcmVmZXJlbmNlczpcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5tb2RlbC51cGRhdGVXaXRoKHNlcnZlckRhdGEsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIHBlcnNpc3RlbnQgbG9jYWwgY29weT9cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxvY2FsU3RvcmFnZU5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhbGZvcmFnZS5zZXRJdGVtKHRoaXMubG9jYWxTdG9yYWdlTmFtZSwgc2VydmVyRGF0YSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlbW90ZSBtb2RlbCBkaWQgbm90IHJldHVybmVkIGRhdGEsIHJlc3BvbnNlIG11c3QgYmUgYSBcIk5vdCBGb3VuZFwiJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEV2ZW50XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzTG9hZGluZygpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2xvYWQnLCBzZXJ2ZXJEYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnc3luY2VkJywgc2VydmVyRGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEZpbmFsbHk6IGNvbW1vbiB0YXNrcyBvbiBzdWNjZXNzIG9yIGVycm9yXHJcbiAgICAgICAgICAgIHRoaXMuaXNMb2FkaW5nKGZhbHNlKTtcclxuICAgICAgICAgICAgdGhpcy5pc1N5bmNpbmcoZmFsc2UpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jYWNoZS5sYXRlc3QgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kYXRhO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSlcclxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgd2FzTG9hZCA9IHRoaXMuaXNMb2FkaW5nKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBGaW5hbGx5OiBjb21tb24gdGFza3Mgb24gc3VjY2VzcyBvciBlcnJvclxyXG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZyhmYWxzZSk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNTeW5jaW5nKGZhbHNlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEV2ZW50XHJcbiAgICAgICAgICAgIHZhciBlcnJQa2cgPSB7XHJcbiAgICAgICAgICAgICAgICB0YXNrOiB3YXNMb2FkID8gJ2xvYWQnIDogJ3N5bmMnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVyclxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvLyBCZSBjYXJlZnVsIHdpdGggJ2Vycm9yJyBldmVudCwgaXMgc3BlY2lhbCBhbmQgc3RvcHMgZXhlY3V0aW9uIG9uIGVtaXRcclxuICAgICAgICAgICAgLy8gaWYgbm8gbGlzdGVuZXJzIGF0dGFjaGVkOiBvdmVyd3JpdHRpbmcgdGhhdCBiZWhhdmlvciBieSBqdXN0XHJcbiAgICAgICAgICAgIC8vIHByaW50IG9uIGNvbnNvbGUgd2hlbiBub3RoaW5nLCBvciBlbWl0IGlmIHNvbWUgbGlzdGVuZXI6XHJcbiAgICAgICAgICAgIGlmIChFdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCh0aGlzLCAnZXJyb3InKSA+IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnZXJyb3InLCBlcnJQa2cpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gTG9nIGl0IHdoZW4gbm90IGhhbmRsZWQgKGV2ZW4gaWYgdGhlIHByb21pc2UgZXJyb3IgaXMgaGFuZGxlZClcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1JlbW90ZU1vZGVsIEVycm9yJywgZXJyUGtnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmV0aHJvdyBlcnJvclxyXG4gICAgICAgICAgICByZXR1cm4gZXJyO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubG9hZCA9IGZ1bmN0aW9uIGxvYWQoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuY2FjaGUubXVzdFJldmFsaWRhdGUoKSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGZpcnN0VGltZUxvYWQpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzTG9hZGluZyh0cnVlKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc1N5bmNpbmcodHJ1ZSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgcHJvbWlzZSA9IG51bGw7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBJZiBsb2NhbCBzdG9yYWdlIGlzIHNldCBmb3IgdGhpcywgbG9hZCBmaXJzdFxyXG4gICAgICAgICAgICAvLyBmcm9tIGxvY2FsLCB0aGVuIGZvbGxvdyB3aXRoIHN5bmNpbmcgZnJvbSByZW1vdGVcclxuICAgICAgICAgICAgaWYgKGZpcnN0VGltZUxvYWQgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMubG9jYWxTdG9yYWdlTmFtZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIHByb21pc2UgPSBsb2NhbGZvcmFnZS5nZXRJdGVtKHRoaXMubG9jYWxTdG9yYWdlTmFtZSlcclxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGxvY2FsRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2NhbERhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhLm1vZGVsLnVwZGF0ZVdpdGgobG9jYWxEYXRhLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIExvYWQgZG9uZTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlzU3luY2luZyhmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBMb2NhbCBsb2FkIGRvbmUsIGRvIGEgYmFja2dyb3VuZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyByZW1vdGUgbG9hZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkRnJvbVJlbW90ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBqdXN0IGRvbid0IHdhaXQsIHJldHVybiBjdXJyZW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRhdGFcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdoZW4gbm8gZGF0YSwgcGVyZm9ybSBhIHJlbW90ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBsb2FkIGFuZCB3YWl0IGZvciBpdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxvYWRGcm9tUmVtb3RlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIFBlcmZvcm0gdGhlIHJlbW90ZSBsb2FkOlxyXG4gICAgICAgICAgICAgICAgcHJvbWlzZSA9IGxvYWRGcm9tUmVtb3RlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIEZpcnN0IHRpbWUsIGJsb2NraW5nIGxvYWQ6XHJcbiAgICAgICAgICAgIC8vIGl0IHJldHVybnMgd2hlbiB0aGUgbG9hZCByZXR1cm5zXHJcbiAgICAgICAgICAgIGlmIChmaXJzdFRpbWVMb2FkKSB7XHJcbiAgICAgICAgICAgICAgICBmaXJzdFRpbWVMb2FkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAvLyBSZXR1cm5zIHRoZSBwcm9taXNlIGFuZCB3aWxsIHdhaXQgZm9yIHRoZSBmaXJzdCBsb2FkOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBCYWNrZ3JvdW5kIGxvYWQ6IGlzIGxvYWRpbmcgc3RpbGxcclxuICAgICAgICAgICAgICAgIC8vIGJ1dCB3ZSBoYXZlIGNhY2hlZCBkYXRhIHNvIHdlIHVzZVxyXG4gICAgICAgICAgICAgICAgLy8gdGhhdCBmb3Igbm93LiBJZiBhbnl0aGluZyBuZXcgZnJvbSBvdXRzaWRlXHJcbiAgICAgICAgICAgICAgICAvLyB2ZXJzaW9ucyB3aWxsIGdldCBub3RpZmllZCB3aXRoIGlzT2Jzb2xldGUoKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLmRhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBSZXR1cm4gY2FjaGVkIGRhdGEsIG5vIG5lZWQgdG8gbG9hZCBhZ2FpbiBmb3Igbm93LlxyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuZGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgICAgIHRoaXMuaXNTYXZpbmcodHJ1ZSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gUHJlc2VydmUgdGhlIHRpbWVzdGFtcCBhZnRlciBiZWluZyBzYXZlZFxyXG4gICAgICAgIC8vIHRvIGF2b2lkIGZhbHNlICdvYnNvbGV0ZScgd2FybmluZ3Mgd2l0aFxyXG4gICAgICAgIC8vIHRoZSB2ZXJzaW9uIHRoYXQgY3JlYXRlZCB0aGUgbmV3IG9yaWdpbmFsXHJcbiAgICAgICAgdmFyIHRzID0gdGhpcy5kYXRhLm1vZGVsLmRhdGFUaW1lc3RhbXAoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucHVzaCgpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHNlcnZlckRhdGEpIHtcclxuICAgICAgICAgICAgLy8gRXZlciBkZWVwQ29weSwgc2luY2UgcGxhaW4gZGF0YSBmcm9tIHRoZSBzZXJ2ZXJcclxuICAgICAgICAgICAgLy8gY2Fubm90IGhhdmUgY2lyY3VsYXIgcmVmZXJlbmNlczpcclxuICAgICAgICAgICAgdGhpcy5kYXRhLm1vZGVsLnVwZGF0ZVdpdGgoc2VydmVyRGF0YSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5tb2RlbC5kYXRhVGltZXN0YW1wKHRzKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIHBlcnNpc3RlbnQgbG9jYWwgY29weT9cclxuICAgICAgICAgICAgaWYgKHRoaXMubG9jYWxTdG9yYWdlTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgbG9jYWxmb3JhZ2Uuc2V0SXRlbSh0aGlzLmxvY2FsU3RvcmFnZU5hbWUsIHNlcnZlckRhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBFdmVudFxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3NhdmVkJywgc2VydmVyRGF0YSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBGaW5hbGx5OiBjb21tb24gdGFza3Mgb24gc3VjY2VzcyBvciBlcnJvclxyXG4gICAgICAgICAgICB0aGlzLmlzU2F2aW5nKGZhbHNlKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuY2FjaGUubGF0ZXN0ID0gbmV3IERhdGUoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF0YTtcclxuICAgICAgICB9LmJpbmQodGhpcykpXHJcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgICAvLyBGaW5hbGx5OiBjb21tb24gdGFza3Mgb24gc3VjY2VzcyBvciBlcnJvclxyXG4gICAgICAgICAgICB0aGlzLmlzU2F2aW5nKGZhbHNlKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIEV2ZW50XHJcbiAgICAgICAgICAgIHZhciBlcnJQa2cgPSB7XHJcbiAgICAgICAgICAgICAgICB0YXNrOiAnc2F2ZScsXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8vIEJlIGNhcmVmdWwgd2l0aCAnZXJyb3InIGV2ZW50LCBpcyBzcGVjaWFsIGFuZCBzdG9wcyBleGVjdXRpb24gb24gZW1pdFxyXG4gICAgICAgICAgICAvLyBpZiBubyBsaXN0ZW5lcnMgYXR0YWNoZWQ6IG92ZXJ3cml0dGluZyB0aGF0IGJlaGF2aW9yIGJ5IGp1c3RcclxuICAgICAgICAgICAgLy8gcHJpbnQgb24gY29uc29sZSB3aGVuIG5vdGhpbmcsIG9yIGVtaXQgaWYgc29tZSBsaXN0ZW5lcjpcclxuICAgICAgICAgICAgaWYgKEV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50KHRoaXMsICdlcnJvcicpID4gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdlcnJvcicsIGVyclBrZyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBMb2cgaXQgd2hlbiBub3QgaGFuZGxlZCAoZXZlbiBpZiB0aGUgcHJvbWlzZSBlcnJvciBpcyBoYW5kbGVkKVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignUmVtb3RlTW9kZWwgRXJyb3InLCBlcnJQa2cpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBSZXRocm93IGVycm9yXHJcbiAgICAgICAgICAgIHJldHVybiBlcnI7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIExhdW5jaCBhIHN5bmNpbmcgcmVxdWVzdC4gUmV0dXJucyBub3RoaW5nLCB0aGVcclxuICAgICAgICB3YXkgdG8gdHJhY2sgYW55IHJlc3VsdCBpcyB3aXRoIGV2ZW50cyBvciBcclxuICAgICAgICB0aGUgaW5zdGFuY2Ugb2JzZXJ2YWJsZXMuXHJcbiAgICAgICAgSU1QT1JUQU5UOiByaWdodCBub3cgaXMganVzdCBhIHJlcXVlc3QgZm9yICdsb2FkJ1xyXG4gICAgICAgIHRoYXQgYXZvaWRzIHByb21pc2UgZXJyb3JzIGZyb20gdGhyb3dpbmcuXHJcbiAgICAqKi9cclxuICAgIHRoaXMuc3luYyA9IGZ1bmN0aW9uIHN5bmMoKSB7XHJcbiAgICAgICAgLy8gQ2FsbCBmb3IgYSBsb2FkLCB0aGF0IHdpbGwgYmUgdHJlYXRlZCBhcyAnc3luY2luZycgYWZ0ZXIgdGhlXHJcbiAgICAgICAgLy8gZmlyc3QgbG9hZFxyXG4gICAgICAgIHRoaXMubG9hZCgpXHJcbiAgICAgICAgLy8gQXZvaWQgZXJyb3JzIGZyb20gdGhyb3dpbmcgaW4gdGhlIGNvbnNvbGUsXHJcbiAgICAgICAgLy8gdGhlICdlcnJvcicgZXZlbnQgaXMgdGhlcmUgdG8gdHJhY2sgYW55b25lLlxyXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbigpIHt9KTtcclxuICAgIH07XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVtb3RlTW9kZWw7XHJcblxyXG5SZW1vdGVNb2RlbC5faW5oZXJpdHMoRXZlbnRFbWl0dGVyKTtcclxuIiwiLyoqXHJcbiAgICBSRVNUIEFQSSBhY2Nlc3NcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmZ1bmN0aW9uIGxvd2VyRmlyc3RMZXR0ZXIobikge1xyXG4gICAgcmV0dXJuIG4gJiYgblswXSAmJiBuWzBdLnRvTG93ZXJDYXNlICYmIChuWzBdLnRvTG93ZXJDYXNlKCkgKyBuLnNsaWNlKDEpKSB8fCBuO1xyXG59XHJcblxyXG5mdW5jdGlvbiBsb3dlckNhbWVsaXplT2JqZWN0KG9iaikge1xyXG4gICAgLy9qc2hpbnQgbWF4Y29tcGxleGl0eTo4XHJcbiAgICBcclxuICAgIGlmICghb2JqIHx8IHR5cGVvZihvYmopICE9PSAnb2JqZWN0JykgcmV0dXJuIG9iajtcclxuXHJcbiAgICB2YXIgcmV0ID0gQXJyYXkuaXNBcnJheShvYmopID8gW10gOiB7fTtcclxuICAgIGZvcih2YXIgayBpbiBvYmopIHtcclxuICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGspKSB7XHJcbiAgICAgICAgICAgIHZhciBuZXdrID0gbG93ZXJGaXJzdExldHRlcihrKTtcclxuICAgICAgICAgICAgcmV0W25ld2tdID0gdHlwZW9mKG9ialtrXSkgPT09ICdvYmplY3QnID9cclxuICAgICAgICAgICAgICAgIGxvd2VyQ2FtZWxpemVPYmplY3Qob2JqW2tdKSA6XHJcbiAgICAgICAgICAgICAgICBvYmpba11cclxuICAgICAgICAgICAgO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZXQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFJlc3Qob3B0aW9uc09yVXJsKSB7XHJcbiAgICBcclxuICAgIHZhciB1cmwgPSB0eXBlb2Yob3B0aW9uc09yVXJsKSA9PT0gJ3N0cmluZycgP1xyXG4gICAgICAgIG9wdGlvbnNPclVybCA6XHJcbiAgICAgICAgb3B0aW9uc09yVXJsICYmIG9wdGlvbnNPclVybC51cmw7XHJcblxyXG4gICAgdGhpcy5iYXNlVXJsID0gdXJsO1xyXG4gICAgLy8gT3B0aW9uYWwgZXh0cmFIZWFkZXJzIGZvciBhbGwgcmVxdWVzdHMsXHJcbiAgICAvLyB1c3VhbGx5IGZvciBhdXRoZW50aWNhdGlvbiB0b2tlbnNcclxuICAgIHRoaXMuZXh0cmFIZWFkZXJzID0gbnVsbDtcclxufVxyXG5cclxuUmVzdC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0KGFwaVVybCwgZGF0YSkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChhcGlVcmwsICdnZXQnLCBkYXRhKTtcclxufTtcclxuXHJcblJlc3QucHJvdG90eXBlLnB1dCA9IGZ1bmN0aW9uIGdldChhcGlVcmwsIGRhdGEpIHtcclxuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoYXBpVXJsLCAncHV0JywgZGF0YSk7XHJcbn07XHJcblxyXG5SZXN0LnByb3RvdHlwZS5wb3N0ID0gZnVuY3Rpb24gZ2V0KGFwaVVybCwgZGF0YSkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChhcGlVcmwsICdwb3N0JywgZGF0YSk7XHJcbn07XHJcblxyXG5SZXN0LnByb3RvdHlwZS5kZWxldGUgPSBmdW5jdGlvbiBnZXQoYXBpVXJsLCBkYXRhKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KGFwaVVybCwgJ2RlbGV0ZScsIGRhdGEpO1xyXG59O1xyXG5cclxuUmVzdC5wcm90b3R5cGUucHV0RmlsZSA9IGZ1bmN0aW9uIHB1dEZpbGUoYXBpVXJsLCBkYXRhKSB7XHJcbiAgICAvLyBOT1RFIGJhc2ljIHB1dEZpbGUgaW1wbGVtZW50YXRpb24sIG9uZSBmaWxlLCB1c2UgZmlsZVVwbG9hZD9cclxuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoYXBpVXJsLCAnZGVsZXRlJywgZGF0YSwgJ211bHRpcGFydC9mb3JtLWRhdGEnKTtcclxufTtcclxuXHJcblJlc3QucHJvdG90eXBlLnJlcXVlc3QgPSBmdW5jdGlvbiByZXF1ZXN0KGFwaVVybCwgaHR0cE1ldGhvZCwgZGF0YSwgY29udGVudFR5cGUpIHtcclxuICAgIFxyXG4gICAgdmFyIHRoaXNSZXN0ID0gdGhpcztcclxuICAgIHZhciB1cmwgPSB0aGlzLmJhc2VVcmwgKyBhcGlVcmw7XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgkLmFqYXgoe1xyXG4gICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgIC8vIEF2b2lkIGNhY2hlIGZvciBkYXRhLlxyXG4gICAgICAgIGNhY2hlOiBmYWxzZSxcclxuICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxyXG4gICAgICAgIG1ldGhvZDogaHR0cE1ldGhvZCxcclxuICAgICAgICBoZWFkZXJzOiB0aGlzLmV4dHJhSGVhZGVycyxcclxuICAgICAgICAvLyBVUkxFTkNPREVEIGlucHV0OlxyXG4gICAgICAgIC8vIENvbnZlcnQgdG8gSlNPTiBhbmQgYmFjayBqdXN0IHRvIGVuc3VyZSB0aGUgdmFsdWVzIGFyZSBjb252ZXJ0ZWQvZW5jb2RlZFxyXG4gICAgICAgIC8vIHByb3Blcmx5IHRvIGJlIHNlbnQsIGxpa2UgRGF0ZXMgYmVpbmcgY29udmVydGVkIHRvIElTTyBmb3JtYXQuXHJcbiAgICAgICAgZGF0YTogZGF0YSAmJiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGRhdGEpKSxcclxuICAgICAgICBjb250ZW50VHlwZTogY29udGVudFR5cGUgfHwgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCdcclxuICAgICAgICAvLyBBbHRlcm5hdGU6IEpTT04gYXMgaW5wdXRcclxuICAgICAgICAvL2RhdGE6IEpTT04uc3RyaW5naWZ5KGRhdGEpLFxyXG4gICAgICAgIC8vY29udGVudFR5cGU6IGNvbnRlbnRUeXBlIHx8ICdhcHBsaWNhdGlvbi9qc29uJ1xyXG4gICAgfSkpXHJcbiAgICAudGhlbihsb3dlckNhbWVsaXplT2JqZWN0KVxyXG4gICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgIC8vIE9uIGF1dGhvcml6YXRpb24gZXJyb3IsIGdpdmUgb3BvcnR1bml0eSB0byByZXRyeSB0aGUgb3BlcmF0aW9uXHJcbiAgICAgICAgaWYgKGVyci5zdGF0dXMgPT09IDQwMSkge1xyXG4gICAgICAgICAgICB2YXIgcmV0cnkgPSByZXF1ZXN0LmJpbmQodGhpcywgYXBpVXJsLCBodHRwTWV0aG9kLCBkYXRhLCBjb250ZW50VHlwZSk7XHJcbiAgICAgICAgICAgIHZhciByZXRyeVByb21pc2UgPSB0aGlzUmVzdC5vbkF1dGhvcml6YXRpb25SZXF1aXJlZChyZXRyeSk7XHJcbiAgICAgICAgICAgIGlmIChyZXRyeVByb21pc2UpIHtcclxuICAgICAgICAgICAgICAgIC8vIEl0IHJldHVybmVkIHNvbWV0aGluZywgZXhwZWN0aW5nIGlzIGEgcHJvbWlzZTpcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmV0cnlQcm9taXNlKVxyXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlcmUgaXMgZXJyb3Igb24gcmV0cnksIGp1c3QgcmV0dXJuIHRoZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIG9yaWdpbmFsIGNhbGwgZXJyb3JcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXJyO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gYnkgZGVmYXVsdCwgY29udGludWUgcHJvcGFnYXRpbmcgdGhlIGVycm9yXHJcbiAgICAgICAgcmV0dXJuIGVycjtcclxuICAgIH0pO1xyXG59O1xyXG5cclxuUmVzdC5wcm90b3R5cGUub25BdXRob3JpemF0aW9uUmVxdWlyZWQgPSBmdW5jdGlvbiBvbkF1dGhvcml6YXRpb25SZXF1aXJlZCgvKnJldHJ5Ki8pIHtcclxuICAgIC8vIFRvIGJlIGltcGxlbWVudGVkIG91dHNpZGUsIGlmIGNvbnZlbmllbnQgZXhlY3V0aW5nOlxyXG4gICAgLy9yZXRyeSgpO1xyXG4gICAgLy8gYnkgZGVmYXVsdCBkb24ndCB3YWl0IGZvciByZXRyeSwganVzdCByZXR1cm4gbm90aGluZzpcclxuICAgIHJldHVybjtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVzdDtcclxuIiwiLyoqXHJcbiAgICBUaW1lIGNsYXNzIHV0aWxpdHkuXHJcbiAgICBTaG9ydGVyIHdheSB0byBjcmVhdGUgYSBEYXRlIGluc3RhbmNlXHJcbiAgICBzcGVjaWZ5aW5nIG9ubHkgdGhlIFRpbWUgcGFydCxcclxuICAgIGRlZmF1bHRpbmcgdG8gY3VycmVudCBkYXRlIG9yIFxyXG4gICAgYW5vdGhlciByZWFkeSBkYXRlIGluc3RhbmNlLlxyXG4qKi9cclxuZnVuY3Rpb24gVGltZShkYXRlLCBob3VyLCBtaW51dGUsIHNlY29uZCkge1xyXG4gICAgaWYgKCEoZGF0ZSBpbnN0YW5jZW9mIERhdGUpKSB7XHJcbiBcclxuICAgICAgICBzZWNvbmQgPSBtaW51dGU7XHJcbiAgICAgICAgbWludXRlID0gaG91cjtcclxuICAgICAgICBob3VyID0gZGF0ZTtcclxuICAgICAgICBcclxuICAgICAgICBkYXRlID0gbmV3IERhdGUoKTsgICBcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IERhdGUoZGF0ZS5nZXRGdWxsWWVhcigpLCBkYXRlLmdldE1vbnRoKCksIGRhdGUuZ2V0RGF0ZSgpLCBob3VyIHx8IDAsIG1pbnV0ZSB8fCAwLCBzZWNvbmQgfHwgMCk7XHJcbn1cclxubW9kdWxlLmV4cG9ydHMgPSBUaW1lO1xyXG4iLCIvKipcclxuICAgIENyZWF0ZSBhbiBBY2Nlc3MgQ29udHJvbCBmb3IgYW4gYXBwIHRoYXQganVzdCBjaGVja3NcclxuICAgIHRoZSBhY3Rpdml0eSBwcm9wZXJ0eSBmb3IgYWxsb3dlZCB1c2VyIGxldmVsLlxyXG4gICAgVG8gYmUgcHJvdmlkZWQgdG8gU2hlbGwuanMgYW5kIHVzZWQgYnkgdGhlIGFwcC5qcyxcclxuICAgIHZlcnkgdGllZCB0byB0aGF0IGJvdGggY2xhc3Nlcy5cclxuICAgIFxyXG4gICAgQWN0aXZpdGllcyBjYW4gZGVmaW5lIG9uIGl0cyBvYmplY3QgYW4gYWNjZXNzTGV2ZWxcclxuICAgIHByb3BlcnR5IGxpa2UgbmV4dCBleGFtcGxlc1xyXG4gICAgXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJ0eXBlLlVzZXI7IC8vIGFueW9uZVxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Bbm9ueW1vdXM7IC8vIGFub255bW91cyB1c2VycyBvbmx5XHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7IC8vIGF1dGhlbnRpY2F0ZWQgdXNlcnMgb25seVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy8gVXNlclR5cGUgZW51bWVyYXRpb24gaXMgYml0IGJhc2VkLCBzbyBzZXZlcmFsXHJcbi8vIHVzZXJzIGNhbiBoYXMgYWNjZXNzIGluIGEgc2luZ2xlIHByb3BlcnR5XHJcbi8vdmFyIFVzZXJUeXBlID0gcmVxdWlyZSgnLi4vbW9kZWxzL1VzZXInKS5Vc2VyVHlwZTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlQWNjZXNzQ29udHJvbChhcHApIHtcclxuICAgIFxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGFjY2Vzc0NvbnRyb2wocm91dGUpIHtcclxuXHJcbiAgICAgICAgdmFyIGFjdGl2aXR5ID0gYXBwLmdldEFjdGl2aXR5Q29udHJvbGxlckJ5Um91dGUocm91dGUpO1xyXG5cclxuICAgICAgICB2YXIgdXNlciA9IGFwcC5tb2RlbC51c2VyKCk7XHJcbiAgICAgICAgdmFyIGN1cnJlbnRUeXBlID0gdXNlciAmJiB1c2VyLnVzZXJUeXBlKCk7XHJcblxyXG4gICAgICAgIGlmIChhY3Rpdml0eSAmJiBhY3Rpdml0eS5hY2Nlc3NMZXZlbCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGNhbiA9IGFjdGl2aXR5LmFjY2Vzc0xldmVsICYgY3VycmVudFR5cGU7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoIWNhbikge1xyXG4gICAgICAgICAgICAgICAgLy8gTm90aWZ5IGVycm9yLCB3aHkgY2Fubm90IGFjY2Vzc1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZExldmVsOiBhY3Rpdml0eS5hY2Nlc3NMZXZlbCxcclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50VHlwZTogY3VycmVudFR5cGVcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEFsbG93XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9O1xyXG59O1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgdW53cmFwID0gZnVuY3Rpb24gdW53cmFwKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gKHR5cGVvZih2YWx1ZSkgPT09ICdmdW5jdGlvbicgPyB2YWx1ZSgpIDogdmFsdWUpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5kZWZpbmVDcnVkQXBpRm9yUmVzdCA9IGZ1bmN0aW9uIGRlZmluZUNydWRBcGlGb3JSZXN0KHNldHRpbmdzKSB7XHJcbiAgICBcclxuICAgIHZhciBleHRlbmRlZE9iamVjdCA9IHNldHRpbmdzLmV4dGVuZGVkT2JqZWN0LFxyXG4gICAgICAgIE1vZGVsID0gc2V0dGluZ3MuTW9kZWwsXHJcbiAgICAgICAgbW9kZWxOYW1lID0gc2V0dGluZ3MubW9kZWxOYW1lLFxyXG4gICAgICAgIG1vZGVsTGlzdE5hbWUgPSBzZXR0aW5ncy5tb2RlbExpc3ROYW1lLFxyXG4gICAgICAgIG1vZGVsVXJsID0gc2V0dGluZ3MubW9kZWxVcmwsXHJcbiAgICAgICAgaWRQcm9wZXJ0eU5hbWUgPSBzZXR0aW5ncy5pZFByb3BlcnR5TmFtZTtcclxuXHJcbiAgICBleHRlbmRlZE9iamVjdFsnZ2V0JyArIG1vZGVsTGlzdE5hbWVdID0gZnVuY3Rpb24gZ2V0TGlzdChmaWx0ZXJzKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5nZXQobW9kZWxVcmwsIGZpbHRlcnMpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmF3SXRlbXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJhd0l0ZW1zICYmIHJhd0l0ZW1zLm1hcChmdW5jdGlvbihyYXdJdGVtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE1vZGVsKHJhd0l0ZW0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIGV4dGVuZGVkT2JqZWN0WydnZXQnICsgbW9kZWxOYW1lXSA9IGZ1bmN0aW9uIGdldEl0ZW0oaXRlbUlEKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5nZXQobW9kZWxVcmwgKyAnLycgKyBpdGVtSUQpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmF3SXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmF3SXRlbSAmJiBuZXcgTW9kZWwocmF3SXRlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGV4dGVuZGVkT2JqZWN0Wydwb3N0JyArIG1vZGVsTmFtZV0gPSBmdW5jdGlvbiBwb3N0SXRlbShhbkl0ZW0pIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpcy5yZXN0LnBvc3QobW9kZWxVcmwsIGFuSXRlbSlcclxuICAgICAgICAudGhlbihmdW5jdGlvbihzZXJ2ZXJJdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgTW9kZWwoc2VydmVySXRlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGV4dGVuZGVkT2JqZWN0WydwdXQnICsgbW9kZWxOYW1lXSA9IGZ1bmN0aW9uIHB1dEl0ZW0oYW5JdGVtKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5wdXQobW9kZWxVcmwgKyAnLycgKyB1bndyYXAoYW5JdGVtW2lkUHJvcGVydHlOYW1lXSksIGFuSXRlbSlcclxuICAgICAgICAudGhlbihmdW5jdGlvbihzZXJ2ZXJJdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgTW9kZWwoc2VydmVySXRlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBleHRlbmRlZE9iamVjdFsnc2V0JyArIG1vZGVsTmFtZV0gPSBmdW5jdGlvbiBzZXRJdGVtKGFuSXRlbSkge1xyXG4gICAgICAgIHZhciBpZCA9IHVud3JhcChhbkl0ZW1baWRQcm9wZXJ0eU5hbWVdKTtcclxuICAgICAgICBpZiAoaWQpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzWydwdXQnICsgbW9kZWxOYW1lXShhbkl0ZW0pO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbJ3Bvc3QnICsgbW9kZWxOYW1lXShhbkl0ZW0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBleHRlbmRlZE9iamVjdFsnZGVsJyArIG1vZGVsTmFtZV0gPSBmdW5jdGlvbiBkZWxJdGVtKGFuSXRlbSkge1xyXG4gICAgICAgIHZhciBpZCA9IGFuSXRlbSAmJiB1bndyYXAoYW5JdGVtW2lkUHJvcGVydHlOYW1lXSkgfHxcclxuICAgICAgICAgICAgICAgIGFuSXRlbTtcclxuICAgICAgICBpZiAoaWQpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc3QuZGVsZXRlKG1vZGVsVXJsICsgJy8nICsgaWQsIGFuSXRlbSlcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oZGVsZXRlZEl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkZWxldGVkSXRlbSAmJiBuZXcgTW9kZWwoZGVsZXRlZEl0ZW0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTmVlZCBhbiBJRCBvciBhbiBvYmplY3Qgd2l0aCB0aGUgSUQgcHJvcGVydHkgdG8gZGVsZXRlJyk7XHJcbiAgICB9O1xyXG59OyIsIi8qKlxyXG4gICAgQm9vdGtub2NrOiBTZXQgb2YgS25vY2tvdXQgQmluZGluZyBIZWxwZXJzIGZvciBCb290c3RyYXAganMgY29tcG9uZW50cyAoanF1ZXJ5IHBsdWdpbnMpXHJcbiAgICBcclxuICAgIERlcGVuZGVuY2llczoganF1ZXJ5XHJcbiAgICBJbmplY3RlZCBkZXBlbmRlbmNpZXM6IGtub2Nrb3V0XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vLyBEZXBlbmRlbmNpZXNcclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuLy8gREkgaTE4biBsaWJyYXJ5XHJcbmV4cG9ydHMuaTE4biA9IG51bGw7XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVIZWxwZXJzKGtvKSB7XHJcbiAgICB2YXIgaGVscGVycyA9IHt9O1xyXG5cclxuICAgIC8qKiBQb3BvdmVyIEJpbmRpbmcgKiovXHJcbiAgICBoZWxwZXJzLnBvcG92ZXIgPSB7XHJcbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZUFjY2Vzc29yKSB7XHJcbiAgICAgICAgICAgIHZhciBzcmNPcHRpb25zID0ga28udW53cmFwKHZhbHVlQWNjZXNzb3IoKSk7XHJcblxyXG4gICAgICAgICAgICAvLyBEdXBsaWNhdGluZyBvcHRpb25zIG9iamVjdCB0byBwYXNzIHRvIHBvcG92ZXIgd2l0aG91dFxyXG4gICAgICAgICAgICAvLyBvdmVyd3JpdHRuZyBzb3VyY2UgY29uZmlndXJhdGlvblxyXG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzcmNPcHRpb25zKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFVud3JhcHBpbmcgY29udGVudCB0ZXh0XHJcbiAgICAgICAgICAgIG9wdGlvbnMuY29udGVudCA9IGtvLnVud3JhcChzcmNPcHRpb25zLmNvbnRlbnQpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY29udGVudCkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIExvY2FsaXplOlxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5jb250ZW50ID0gXHJcbiAgICAgICAgICAgICAgICAgICAgZXhwb3J0cy5pMThuICYmIGV4cG9ydHMuaTE4bi50KG9wdGlvbnMuY29udGVudCkgfHxcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmNvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIFRvIGdldCB0aGUgbmV3IG9wdGlvbnMsIHdlIG5lZWQgZGVzdHJveSBpdCBmaXJzdDpcclxuICAgICAgICAgICAgICAgICQoZWxlbWVudCkucG9wb3ZlcignZGVzdHJveScpLnBvcG92ZXIob3B0aW9ucyk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU2UgbXVlc3RyYSBzaSBlbCBlbGVtZW50byB0aWVuZSBlbCBmb2NvXHJcbiAgICAgICAgICAgICAgICBpZiAoJChlbGVtZW50KS5pcygnOmZvY3VzJykpXHJcbiAgICAgICAgICAgICAgICAgICAgJChlbGVtZW50KS5wb3BvdmVyKCdzaG93Jyk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJChlbGVtZW50KS5wb3BvdmVyKCdkZXN0cm95Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICByZXR1cm4gaGVscGVycztcclxufVxyXG5cclxuLyoqXHJcbiAgICBQbHVnIGhlbHBlcnMgaW4gdGhlIHByb3ZpZGVkIEtub2Nrb3V0IGluc3RhbmNlXHJcbioqL1xyXG5mdW5jdGlvbiBwbHVnSW4oa28sIHByZWZpeCkge1xyXG4gICAgdmFyIG5hbWUsXHJcbiAgICAgICAgaGVscGVycyA9IGNyZWF0ZUhlbHBlcnMoa28pO1xyXG4gICAgXHJcbiAgICBmb3IodmFyIGggaW4gaGVscGVycykge1xyXG4gICAgICAgIGlmIChoZWxwZXJzLmhhc093blByb3BlcnR5ICYmICFoZWxwZXJzLmhhc093blByb3BlcnR5KGgpKVxyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuXHJcbiAgICAgICAgbmFtZSA9IHByZWZpeCA/IHByZWZpeCArIGhbMF0udG9VcHBlckNhc2UoKSArIGguc2xpY2UoMSkgOiBoO1xyXG4gICAgICAgIGtvLmJpbmRpbmdIYW5kbGVyc1tuYW1lXSA9IGhlbHBlcnNbaF07XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydHMucGx1Z0luID0gcGx1Z0luO1xyXG5leHBvcnRzLmNyZWF0ZUJpbmRpbmdIZWxwZXJzID0gY3JlYXRlSGVscGVycztcclxuIiwiLyoqXHJcbiAgICBLbm9ja291dCBCaW5kaW5nIEhlbHBlciBmb3IgdGhlIEJvb3RzdHJhcCBTd2l0Y2ggcGx1Z2luLlxyXG4gICAgXHJcbiAgICBEZXBlbmRlbmNpZXM6IGpxdWVyeSwgYm9vdHN0cmFwLCBib290c3RyYXAtc3dpdGNoXHJcbiAgICBJbmplY3RlZCBkZXBlbmRlbmNpZXM6IGtub2Nrb3V0XHJcbiAgICBcclxuICAgIElNUE9SVEFOVCBOT1RFUzpcclxuICAgIC0gQSBjb25zb2xlIGVycm9yIG9mIHR5cGUgXCJvYmplY3QgaGFzIG5vdCB0aGF0IHByb3BlcnR5XCIgd2lsbCBoYXBwZW4gaWYgc3BlY2lmaWVkXHJcbiAgICAgICAgYSBub24gZXhpc3RhbnQgb3B0aW9uIGluIHRoZSBiaW5kaW5nLiBUaGUgZXJyb3IgbG9va3Mgc3RyYW5nZSB3aGVuIHVzaW5nIHRoZSBtaW5pZmllZCBmaWxlLlxyXG4gICAgLSBUaGUgb3JkZXIgb2Ygb3B0aW9ucyBpbiB0aGUgYmluZGluZyBtYXR0ZXJzIHdoZW4gY29tYmluaW5nIHdpdGggZGlzYWJsZWQgYW5kIHJlYWRvbmx5XHJcbiAgICAgICAgb3B0aW9uczogaWYgdGhlIGVsZW1lbnQgaXMgZGlzYWJsZWQ6dHJ1ZSBvciByZWFkb25seTp0cnVlLCBhbnkgYXR0ZW1wdCB0byBjaGFuZ2UgdGhlXHJcbiAgICAgICAgdmFsdWUgd2lsbCBmYWlsIHNpbGVudGx5LCBzbyBpZiB0aGUgc2FtZSBiaW5kaW5nIHVwZGF0ZSBjaGFuZ2VzIGRpc2FibGVkIHRvIGZhbHNlXHJcbiAgICAgICAgYW5kIHRoZSBzdGF0ZSwgdGhlICdkaXNhYmxlZCcgY2hhbmdlIG11c3QgaGFwcGVucyBiZWZvcmUgdGhlICdzdGF0ZScgY2hhbmdlIHNvIGJvdGhcclxuICAgICAgICBhcmUgc3VjY2Vzc2Z1bGx5IHVwZGF0ZWQuIEZvciB0aGF0LCBqdXN0IHNwZWNpZnkgJ2Rpc2FibGVkJyBiZWZvcmUgJ3N0YXRlJyBpbiB0aGUgYmluZGluZ3NcclxuICAgICAgICBkZWZpbml0aW9uLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy8gRGVwZW5kZW5jaWVzXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2Jvb3RzdHJhcCcpO1xyXG5yZXF1aXJlKCdib290c3RyYXAtc3dpdGNoJyk7XHJcblxyXG4vKipcclxuICAgIENyZWF0ZSBhbmQgcGx1Zy1pbiB0aGUgQmluZGluZyBpbiB0aGUgcHJvdmlkZWQgS25vY2tvdXQgaW5zdGFuY2VcclxuKiovXHJcbmV4cG9ydHMucGx1Z0luID0gZnVuY3Rpb24gcGx1Z0luKGtvLCBwcmVmaXgpIHtcclxuXHJcbiAgICBrby5iaW5kaW5nSGFuZGxlcnNbcHJlZml4ID8gcHJlZml4ICsgJ3N3aXRjaCcgOiAnc3dpdGNoJ10gPSB7XHJcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oZWxlbWVudCwgdmFsdWVBY2Nlc3Nvcikge1xyXG4gICAgICAgICAgICAvLyBDcmVhdGUgcGx1Z2luIGluc3RhbmNlXHJcbiAgICAgICAgICAgICQoZWxlbWVudCkuYm9vdHN0cmFwU3dpdGNoKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzd2l0Y2ggaW5pdCcsIGtvLnRvSlModmFsdWVBY2Nlc3NvcigpKSk7XHJcblxyXG4gICAgICAgICAgICAvLyBVcGRhdGluZyB2YWx1ZSBvbiBwbHVnaW4gY2hhbmdlc1xyXG4gICAgICAgICAgICAkKGVsZW1lbnQpLm9uKCdzd2l0Y2hDaGFuZ2UuYm9vdHN0cmFwU3dpdGNoJywgZnVuY3Rpb24gKGUsIHN0YXRlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHZhbHVlQWNjZXNzb3IoKSB8fCB7fTtcclxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3N3aXRjaENoYW5nZScsIGtvLnRvSlModikpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBjaGFuZ2VkP1xyXG4gICAgICAgICAgICAgICAgdmFyIG9sZFN0YXRlID0gISFrby51bndyYXAodi5zdGF0ZSksXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3U3RhdGUgPSAhIXN0YXRlO1xyXG4gICAgICAgICAgICAgICAgLy8gT25seSB1cGRhdGUgb24gY2hhbmdlXHJcbiAgICAgICAgICAgICAgICBpZiAob2xkU3RhdGUgIT09IG5ld1N0YXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtvLmlzT2JzZXJ2YWJsZSh2LnN0YXRlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoa28uaXNXcml0ZWFibGVPYnNlcnZhYmxlKHYuc3RhdGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2LnN0YXRlKG5ld1N0YXRlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHYuc3RhdGUgPSBuZXdTdGF0ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZUFjY2Vzc29yKSB7XHJcbiAgICAgICAgICAgIC8vIEdldCBvcHRpb25zIHRvIGJlIGFwcGxpZWQgdG8gdGhlIHBsdWdpbiBpbnN0YW5jZVxyXG4gICAgICAgICAgICB2YXIgc3JjT3B0aW9ucyA9IHZhbHVlQWNjZXNzb3IoKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gc3JjT3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgICAgICAgICAgIC8vIFVud3JhcHBpbmcgZXZlcnkgb3B0aW9uIHZhbHVlLCBnZXR0aW5nIGEgZHVwbGljYXRlZFxyXG4gICAgICAgICAgICAvLyBwbGFpbiBvYmplY3RcclxuICAgICAgICAgICAgb3B0aW9ucyA9IGtvLnRvSlMob3B0aW9ucyk7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3N3aXRjaCB1cGRhdGUnLCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgICAgIHZhciAkZWwgPSAkKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICAvLyBVcGRhdGUgZXZlcnkgb3B0aW9uIGluIHRoZSBwbHVnaW5cclxuICAgICAgICAgICAgT2JqZWN0LmtleXMob3B0aW9ucykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgICAgICRlbC5ib290c3RyYXBTd2l0Y2goa2V5LCBvcHRpb25zW2tleV0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG4iLCIvKipcclxuICAgIEVzcGFjZSBhIHN0cmluZyBmb3IgdXNlIG9uIGEgUmVnRXhwLlxyXG4gICAgVXN1YWxseSwgdG8gbG9vayBmb3IgYSBzdHJpbmcgaW4gYSB0ZXh0IG11bHRpcGxlIHRpbWVzXHJcbiAgICBvciB3aXRoIHNvbWUgZXhwcmVzc2lvbnMsIHNvbWUgY29tbW9uIGFyZSBcclxuICAgIGxvb2sgZm9yIGEgdGV4dCAnaW4gdGhlIGJlZ2lubmluZycgKF4pXHJcbiAgICBvciAnYXQgdGhlIGVuZCcgKCQpLlxyXG4gICAgXHJcbiAgICBBdXRob3I6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS91c2Vycy8xNTEzMTIvY29vbGFqODYgYW5kIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS91c2Vycy85NDEwL2FyaXN0b3RsZS1wYWdhbHR6aXNcclxuICAgIExpbms6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzY5Njk0ODZcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbi8vIFJlZmVycmluZyB0byB0aGUgdGFibGUgaGVyZTpcclxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvcmVnZXhwXHJcbi8vIHRoZXNlIGNoYXJhY3RlcnMgc2hvdWxkIGJlIGVzY2FwZWRcclxuLy8gXFwgXiAkICogKyA/IC4gKCApIHwgeyB9IFsgXVxyXG4vLyBUaGVzZSBjaGFyYWN0ZXJzIG9ubHkgaGF2ZSBzcGVjaWFsIG1lYW5pbmcgaW5zaWRlIG9mIGJyYWNrZXRzXHJcbi8vIHRoZXkgZG8gbm90IG5lZWQgdG8gYmUgZXNjYXBlZCwgYnV0IHRoZXkgTUFZIGJlIGVzY2FwZWRcclxuLy8gd2l0aG91dCBhbnkgYWR2ZXJzZSBlZmZlY3RzICh0byB0aGUgYmVzdCBvZiBteSBrbm93bGVkZ2UgYW5kIGNhc3VhbCB0ZXN0aW5nKVxyXG4vLyA6ICEgLCA9IFxyXG4vLyBteSB0ZXN0IFwifiFAIyQlXiYqKCl7fVtdYC89PytcXHwtXzs6J1xcXCIsPC4+XCIubWF0Y2goL1tcXCNdL2cpXHJcblxyXG52YXIgc3BlY2lhbHMgPSBbXHJcbiAgICAvLyBvcmRlciBtYXR0ZXJzIGZvciB0aGVzZVxyXG4gICAgICBcIi1cIlxyXG4gICAgLCBcIltcIlxyXG4gICAgLCBcIl1cIlxyXG4gICAgLy8gb3JkZXIgZG9lc24ndCBtYXR0ZXIgZm9yIGFueSBvZiB0aGVzZVxyXG4gICAgLCBcIi9cIlxyXG4gICAgLCBcIntcIlxyXG4gICAgLCBcIn1cIlxyXG4gICAgLCBcIihcIlxyXG4gICAgLCBcIilcIlxyXG4gICAgLCBcIipcIlxyXG4gICAgLCBcIitcIlxyXG4gICAgLCBcIj9cIlxyXG4gICAgLCBcIi5cIlxyXG4gICAgLCBcIlxcXFxcIlxyXG4gICAgLCBcIl5cIlxyXG4gICAgLCBcIiRcIlxyXG4gICAgLCBcInxcIlxyXG4gIF1cclxuXHJcbiAgLy8gSSBjaG9vc2UgdG8gZXNjYXBlIGV2ZXJ5IGNoYXJhY3RlciB3aXRoICdcXCdcclxuICAvLyBldmVuIHRob3VnaCBvbmx5IHNvbWUgc3RyaWN0bHkgcmVxdWlyZSBpdCB3aGVuIGluc2lkZSBvZiBbXVxyXG4sIHJlZ2V4ID0gUmVnRXhwKCdbJyArIHNwZWNpYWxzLmpvaW4oJ1xcXFwnKSArICddJywgJ2cnKVxyXG47XHJcblxyXG52YXIgZXNjYXBlUmVnRXhwID0gZnVuY3Rpb24gKHN0cikge1xyXG5yZXR1cm4gc3RyLnJlcGxhY2UocmVnZXgsIFwiXFxcXCQmXCIpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBlc2NhcGVSZWdFeHA7XHJcblxyXG4vLyB0ZXN0IGVzY2FwZVJlZ0V4cChcIi9wYXRoL3RvL3Jlcz9zZWFyY2g9dGhpcy50aGF0XCIpXHJcbiIsIi8qKlxyXG4qIGVzY2FwZVNlbGVjdG9yXHJcbipcclxuKiBzb3VyY2U6IGh0dHA6Ly9ranZhcmdhLmJsb2dzcG90LmNvbS5lcy8yMDA5LzA2L2pxdWVyeS1wbHVnaW4tdG8tZXNjYXBlLWNzcy1zZWxlY3Rvci5odG1sXHJcbipcclxuKiBFc2NhcGUgYWxsIHNwZWNpYWwgalF1ZXJ5IENTUyBzZWxlY3RvciBjaGFyYWN0ZXJzIGluICpzZWxlY3RvciouXHJcbiogVXNlZnVsIHdoZW4geW91IGhhdmUgYSBjbGFzcyBvciBpZCB3aGljaCBjb250YWlucyBzcGVjaWFsIGNoYXJhY3RlcnNcclxuKiB3aGljaCB5b3UgbmVlZCB0byBpbmNsdWRlIGluIGEgc2VsZWN0b3IuXHJcbiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBzcGVjaWFscyA9IFtcclxuICAnIycsICcmJywgJ34nLCAnPScsICc+JywgXHJcbiAgXCInXCIsICc6JywgJ1wiJywgJyEnLCAnOycsICcsJ1xyXG5dO1xyXG52YXIgcmVnZXhTcGVjaWFscyA9IFtcclxuICAnLicsICcqJywgJysnLCAnfCcsICdbJywgJ10nLCAnKCcsICcpJywgJy8nLCAnXicsICckJ1xyXG5dO1xyXG52YXIgc1JFID0gbmV3IFJlZ0V4cChcclxuICAnKCcgKyBzcGVjaWFscy5qb2luKCd8JykgKyAnfFxcXFwnICsgcmVnZXhTcGVjaWFscy5qb2luKCd8XFxcXCcpICsgJyknLCAnZydcclxuKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICByZXR1cm4gc2VsZWN0b3IucmVwbGFjZShzUkUsICdcXFxcJDEnKTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBSZWFkIGEgcGFnZSdzIEdFVCBVUkwgdmFyaWFibGVzIGFuZCByZXR1cm4gdGhlbSBhcyBhbiBhc3NvY2lhdGl2ZSBhcnJheS5cclxuKiovXHJcbid1c2VyIHN0cmljdCc7XHJcbi8vZ2xvYmFsIHdpbmRvd1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZXRVcmxRdWVyeSh1cmwpIHtcclxuXHJcbiAgICB1cmwgPSB1cmwgfHwgd2luZG93LmxvY2F0aW9uLmhyZWY7XHJcblxyXG4gICAgdmFyIHZhcnMgPSBbXSwgaGFzaCxcclxuICAgICAgICBxdWVyeUluZGV4ID0gdXJsLmluZGV4T2YoJz8nKTtcclxuICAgIGlmIChxdWVyeUluZGV4ID4gLTEpIHtcclxuICAgICAgICB2YXIgaGFzaGVzID0gdXJsLnNsaWNlKHF1ZXJ5SW5kZXggKyAxKS5zcGxpdCgnJicpO1xyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBoYXNoZXMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBoYXNoID0gaGFzaGVzW2ldLnNwbGl0KCc9Jyk7XHJcbiAgICAgICAgICAgIHZhcnMucHVzaChoYXNoWzBdKTtcclxuICAgICAgICAgICAgdmFyc1toYXNoWzBdXSA9IGhhc2hbMV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhcnM7XHJcbn07XHJcbiIsIi8vIGpRdWVyeSBwbHVnaW4gdG8gc2V0IG11bHRpbGluZSB0ZXh0IGluIGFuIGVsZW1lbnQsXHJcbi8vIGJ5IHJlcGxhY2luZyBcXG4gYnkgPGJyLz4gd2l0aCBjYXJlZnVsIHRvIGF2b2lkIFhTUyBhdHRhY2tzLlxyXG4vLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xMzA4MjAyOFxyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuJC5mbi5tdWx0aWxpbmUgPSBmdW5jdGlvbih0ZXh0KSB7XHJcbiAgICB0aGlzLnRleHQodGV4dCk7XHJcbiAgICB0aGlzLmh0bWwodGhpcy5odG1sKCkucmVwbGFjZSgvXFxuL2csJzxici8+JykpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgU2V0IG9mIHV0aWxpdGllcyB0byBkZWZpbmUgSmF2YXNjcmlwdCBQcm9wZXJ0aWVzXHJcbiAgICBpbmRlcGVuZGVudGx5IG9mIHRoZSBicm93c2VyLlxyXG4gICAgXHJcbiAgICBBbGxvd3MgdG8gZGVmaW5lIGdldHRlcnMgYW5kIHNldHRlcnMuXHJcbiAgICBcclxuICAgIEFkYXB0ZWQgY29kZSBmcm9tIHRoZSBvcmlnaW5hbCBjcmVhdGVkIGJ5IEplZmYgV2FsZGVuXHJcbiAgICBodHRwOi8vd2hlcmVzd2FsZGVuLmNvbS8yMDEwLzA0LzE2L21vcmUtc3BpZGVybW9ua2V5LWNoYW5nZXMtYW5jaWVudC1lc290ZXJpYy12ZXJ5LXJhcmVseS11c2VkLXN5bnRheC1mb3ItY3JlYXRpbmctZ2V0dGVycy1hbmQtc2V0dGVycy1pcy1iZWluZy1yZW1vdmVkL1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gYWNjZXNzb3JEZXNjcmlwdG9yKGZpZWxkLCBmdW4pXHJcbntcclxuICAgIHZhciBkZXNjID0geyBlbnVtZXJhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfTtcclxuICAgIGRlc2NbZmllbGRdID0gZnVuO1xyXG4gICAgcmV0dXJuIGRlc2M7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRlZmluZUdldHRlcihvYmosIHByb3AsIGdldClcclxue1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSlcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgcHJvcCwgYWNjZXNzb3JEZXNjcmlwdG9yKFwiZ2V0XCIsIGdldCkpO1xyXG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuX19kZWZpbmVHZXR0ZXJfXylcclxuICAgICAgICByZXR1cm4gb2JqLl9fZGVmaW5lR2V0dGVyX18ocHJvcCwgZ2V0KTtcclxuXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgZ2V0dGVyc1wiKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZGVmaW5lU2V0dGVyKG9iaiwgcHJvcCwgc2V0KVxyXG57XHJcbiAgICBpZiAoT2JqZWN0LmRlZmluZVByb3BlcnR5KVxyXG4gICAgICAgIHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBwcm9wLCBhY2Nlc3NvckRlc2NyaXB0b3IoXCJzZXRcIiwgc2V0KSk7XHJcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5fX2RlZmluZVNldHRlcl9fKVxyXG4gICAgICAgIHJldHVybiBvYmouX19kZWZpbmVTZXR0ZXJfXyhwcm9wLCBzZXQpO1xyXG5cclxuICAgIHRocm93IG5ldyBFcnJvcihcImJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBzZXR0ZXJzXCIpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGRlZmluZUdldHRlcjogZGVmaW5lR2V0dGVyLFxyXG4gICAgZGVmaW5lU2V0dGVyOiBkZWZpbmVTZXR0ZXJcclxufTtcclxuIiwiLyoqXHJcbiAgICBEb21JdGVtc01hbmFnZXIgY2xhc3MsIHRoYXQgbWFuYWdlIGEgY29sbGVjdGlvbiBcclxuICAgIG9mIEhUTUwvRE9NIGl0ZW1zIHVuZGVyIGEgcm9vdC9jb250YWluZXIsIHdoZXJlXHJcbiAgICBvbmx5IG9uZSBlbGVtZW50IGF0IHRoZSB0aW1lIGlzIHZpc2libGUsIHByb3ZpZGluZ1xyXG4gICAgdG9vbHMgdG8gdW5pcXVlcmx5IGlkZW50aWZ5IHRoZSBpdGVtcyxcclxuICAgIHRvIGNyZWF0ZSBvciB1cGRhdGUgbmV3IGl0ZW1zICh0aHJvdWdoICdpbmplY3QnKSxcclxuICAgIGdldCB0aGUgY3VycmVudCwgZmluZCBieSB0aGUgSUQgYW5kIG1vcmUuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgZXNjYXBlU2VsZWN0b3IgPSByZXF1aXJlKCcuLi9lc2NhcGVTZWxlY3RvcicpO1xyXG5cclxuZnVuY3Rpb24gRG9tSXRlbXNNYW5hZ2VyKHNldHRpbmdzKSB7XHJcblxyXG4gICAgdGhpcy5pZEF0dHJpYnV0ZU5hbWUgPSBzZXR0aW5ncy5pZEF0dHJpYnV0ZU5hbWUgfHwgJ2lkJztcclxuICAgIHRoaXMuYWxsb3dEdXBsaWNhdGVzID0gISFzZXR0aW5ncy5hbGxvd0R1cGxpY2F0ZXMgfHwgZmFsc2U7XHJcbiAgICB0aGlzLiRyb290ID0gbnVsbDtcclxuICAgIC8vIE9uIHBhZ2UgcmVhZHksIGdldCB0aGUgcm9vdCBlbGVtZW50OlxyXG4gICAgJChmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLiRyb290ID0gJChzZXR0aW5ncy5yb290IHx8ICdib2R5Jyk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IERvbUl0ZW1zTWFuYWdlcjtcclxuXHJcbkRvbUl0ZW1zTWFuYWdlci5wcm90b3R5cGUuZmluZCA9IGZ1bmN0aW9uIGZpbmQoY29udGFpbmVyTmFtZSwgcm9vdCkge1xyXG4gICAgdmFyICRyb290ID0gJChyb290IHx8IHRoaXMuJHJvb3QpO1xyXG4gICAgcmV0dXJuICRyb290LmZpbmQoJ1snICsgdGhpcy5pZEF0dHJpYnV0ZU5hbWUgKyAnPVwiJyArIGVzY2FwZVNlbGVjdG9yKGNvbnRhaW5lck5hbWUpICsgJ1wiXScpO1xyXG59O1xyXG5cclxuRG9tSXRlbXNNYW5hZ2VyLnByb3RvdHlwZS5nZXRBY3RpdmUgPSBmdW5jdGlvbiBnZXRBY3RpdmUoKSB7XHJcbiAgICByZXR1cm4gdGhpcy4kcm9vdC5maW5kKCdbJyArIHRoaXMuaWRBdHRyaWJ1dGVOYW1lICsgJ106dmlzaWJsZScpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBJdCBhZGRzIHRoZSBpdGVtIGluIHRoZSBodG1sIHByb3ZpZGVkIChjYW4gYmUgb25seSB0aGUgZWxlbWVudCBvciBcclxuICAgIGNvbnRhaW5lZCBpbiBhbm90aGVyIG9yIGEgZnVsbCBodG1sIHBhZ2UpLlxyXG4gICAgUmVwbGFjZXMgYW55IGV4aXN0YW50IGlmIGR1cGxpY2F0ZXMgYXJlIG5vdCBhbGxvd2VkLlxyXG4qKi9cclxuRG9tSXRlbXNNYW5hZ2VyLnByb3RvdHlwZS5pbmplY3QgPSBmdW5jdGlvbiBpbmplY3QobmFtZSwgaHRtbCkge1xyXG5cclxuICAgIC8vIEZpbHRlcmluZyBpbnB1dCBodG1sIChjYW4gYmUgcGFydGlhbCBvciBmdWxsIHBhZ2VzKVxyXG4gICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTI4NDg3OThcclxuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoL15bXFxzXFxTXSo8Ym9keS4qPz58PFxcL2JvZHk+W1xcc1xcU10qJC9nLCAnJyk7XHJcblxyXG4gICAgLy8gQ3JlYXRpbmcgYSB3cmFwcGVyIGFyb3VuZCB0aGUgaHRtbFxyXG4gICAgLy8gKGNhbiBiZSBwcm92aWRlZCB0aGUgaW5uZXJIdG1sIG9yIG91dGVySHRtbCwgZG9lc24ndCBtYXR0ZXJzIHdpdGggbmV4dCBhcHByb2FjaClcclxuICAgIHZhciAkaHRtbCA9ICQoJzxkaXYvPicsIHsgaHRtbDogaHRtbCB9KSxcclxuICAgICAgICAvLyBXZSBsb29rIGZvciB0aGUgY29udGFpbmVyIGVsZW1lbnQgKHdoZW4gdGhlIG91dGVySHRtbCBpcyBwcm92aWRlZClcclxuICAgICAgICAkYyA9IHRoaXMuZmluZChuYW1lLCAkaHRtbCk7XHJcblxyXG4gICAgaWYgKCRjLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIC8vIEl0cyBpbm5lckh0bWwsIHNvIHRoZSB3cmFwcGVyIGJlY29tZXMgdGhlIGNvbnRhaW5lciBpdHNlbGZcclxuICAgICAgICAkYyA9ICRodG1sLmF0dHIodGhpcy5pZEF0dHJpYnV0ZU5hbWUsIG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5hbGxvd0R1cGxpY2F0ZXMpIHtcclxuICAgICAgICAvLyBObyBtb3JlIHRoYW4gb25lIGNvbnRhaW5lciBpbnN0YW5jZSBjYW4gZXhpc3RzIGF0IHRoZSBzYW1lIHRpbWVcclxuICAgICAgICAvLyBXZSBsb29rIGZvciBhbnkgZXhpc3RlbnQgb25lIGFuZCBpdHMgcmVwbGFjZWQgd2l0aCB0aGUgbmV3XHJcbiAgICAgICAgdmFyICRwcmV2ID0gdGhpcy5maW5kKG5hbWUpO1xyXG4gICAgICAgIGlmICgkcHJldi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICRwcmV2LnJlcGxhY2VXaXRoKCRjKTtcclxuICAgICAgICAgICAgJGMgPSAkcHJldjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWRkIHRvIHRoZSBkb2N1bWVudFxyXG4gICAgLy8gKG9uIHRoZSBjYXNlIG9mIGR1cGxpY2F0ZWQgZm91bmQsIHRoaXMgd2lsbCBkbyBub3RoaW5nLCBubyB3b3JyeSlcclxuICAgICRjLmFwcGVuZFRvKHRoaXMuJHJvb3QpO1xyXG59O1xyXG5cclxuLyoqIFxyXG4gICAgVGhlIHN3aXRjaCBtZXRob2QgcmVjZWl2ZSB0aGUgaXRlbXMgdG8gaW50ZXJjaGFuZ2UgYXMgYWN0aXZlIG9yIGN1cnJlbnQsXHJcbiAgICB0aGUgJ2Zyb20nIGFuZCAndG8nLCBhbmQgdGhlIHNoZWxsIGluc3RhbmNlIHRoYXQgTVVTVCBiZSB1c2VkXHJcbiAgICB0byBub3RpZnkgZWFjaCBldmVudCB0aGF0IGludm9sdmVzIHRoZSBpdGVtOlxyXG4gICAgd2lsbENsb3NlLCB3aWxsT3BlbiwgcmVhZHksIG9wZW5lZCwgY2xvc2VkLlxyXG4gICAgSXQgcmVjZWl2ZXMgYXMgbGF0ZXN0IHBhcmFtZXRlciB0aGUgJ25vdGlmaWNhdGlvbicgb2JqZWN0IHRoYXQgbXVzdCBiZVxyXG4gICAgcGFzc2VkIHdpdGggdGhlIGV2ZW50IHNvIGhhbmRsZXJzIGhhcyBjb250ZXh0IHN0YXRlIGluZm9ybWF0aW9uLlxyXG4gICAgXHJcbiAgICBJdCdzIGRlc2lnbmVkIHRvIGJlIGFibGUgdG8gbWFuYWdlIHRyYW5zaXRpb25zLCBidXQgdGhpcyBkZWZhdWx0XHJcbiAgICBpbXBsZW1lbnRhdGlvbiBpcyBhcyBzaW1wbGUgYXMgJ3Nob3cgdGhlIG5ldyBhbmQgaGlkZSB0aGUgb2xkJy5cclxuKiovXHJcbkRvbUl0ZW1zTWFuYWdlci5wcm90b3R5cGUuc3dpdGNoID0gZnVuY3Rpb24gc3dpdGNoQWN0aXZlSXRlbSgkZnJvbSwgJHRvLCBzaGVsbCwgbm90aWZpY2F0aW9uKSB7XHJcblxyXG4gICAgaWYgKCEkdG8uaXMoJzp2aXNpYmxlJykpIHtcclxuICAgICAgICBzaGVsbC5lbWl0KHNoZWxsLmV2ZW50cy53aWxsT3BlbiwgJHRvLCBub3RpZmljYXRpb24pO1xyXG4gICAgICAgICR0by5zaG93KCk7XHJcbiAgICAgICAgLy8gSXRzIGVub3VnaCB2aXNpYmxlIGFuZCBpbiBET00gdG8gcGVyZm9ybSBpbml0aWFsaXphdGlvbiB0YXNrc1xyXG4gICAgICAgIC8vIHRoYXQgbWF5IGludm9sdmUgbGF5b3V0IGluZm9ybWF0aW9uXHJcbiAgICAgICAgc2hlbGwuZW1pdChzaGVsbC5ldmVudHMuaXRlbVJlYWR5LCAkdG8sIG5vdGlmaWNhdGlvbik7XHJcbiAgICAgICAgLy8gV2hlbiBpdHMgY29tcGxldGVseSBvcGVuZWRcclxuICAgICAgICBzaGVsbC5lbWl0KHNoZWxsLmV2ZW50cy5vcGVuZWQsICR0bywgbm90aWZpY2F0aW9uKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gSXRzIHJlYWR5OyBtYXliZSBpdCB3YXMgYnV0IHN1Yi1sb2NhdGlvblxyXG4gICAgICAgIC8vIG9yIHN0YXRlIGNoYW5nZSBuZWVkIHRvIGJlIGNvbW11bmljYXRlZFxyXG4gICAgICAgIHNoZWxsLmVtaXQoc2hlbGwuZXZlbnRzLml0ZW1SZWFkeSwgJHRvLCBub3RpZmljYXRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICgkZnJvbS5pcygnOnZpc2libGUnKSkge1xyXG4gICAgICAgIHNoZWxsLmVtaXQoc2hlbGwuZXZlbnRzLndpbGxDbG9zZSwgJGZyb20sIG5vdGlmaWNhdGlvbik7XHJcbiAgICAgICAgLy8gRG8gJ3VuZm9jdXMnIG9uIHRoZSBoaWRkZW4gZWxlbWVudCBhZnRlciBub3RpZnkgJ3dpbGxDbG9zZSdcclxuICAgICAgICAvLyBmb3IgYmV0dGVyIFVYOiBoaWRkZW4gZWxlbWVudHMgYXJlIG5vdCByZWFjaGFibGUgYW5kIGhhcyBnb29kXHJcbiAgICAgICAgLy8gc2lkZSBlZmZlY3RzIGxpa2UgaGlkZGluZyB0aGUgb24tc2NyZWVuIGtleWJvYXJkIGlmIGFuIGlucHV0IHdhc1xyXG4gICAgICAgIC8vIGZvY3VzZWRcclxuICAgICAgICAkZnJvbS5maW5kKCc6Zm9jdXMnKS5ibHVyKCk7XHJcbiAgICAgICAgLy8gaGlkZSBhbmQgbm90aWZ5IGl0IGVuZGVkXHJcbiAgICAgICAgJGZyb20uaGlkZSgpO1xyXG4gICAgICAgIHNoZWxsLmVtaXQoc2hlbGwuZXZlbnRzLmNsb3NlZCwgJGZyb20sIG5vdGlmaWNhdGlvbik7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICAgIEluaXRpYWxpemVzIHRoZSBsaXN0IG9mIGl0ZW1zLiBObyBtb3JlIHRoYW4gb25lXHJcbiAgICBtdXN0IGJlIG9wZW5lZC92aXNpYmxlIGF0IHRoZSBzYW1lIHRpbWUsIHNvIGF0IHRoZSBcclxuICAgIGluaXQgYWxsIHRoZSBlbGVtZW50cyBhcmUgY2xvc2VkIHdhaXRpbmcgdG8gc2V0XHJcbiAgICBvbmUgYXMgdGhlIGFjdGl2ZSBvciB0aGUgY3VycmVudCBvbmUuXHJcbioqL1xyXG5Eb21JdGVtc01hbmFnZXIucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiBpbml0KCkge1xyXG4gICAgdGhpcy5nZXRBY3RpdmUoKS5oaWRlKCk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgSmF2YXNjcml0cCBTaGVsbCBmb3IgU1BBcy5cclxuKiovXHJcbi8qZ2xvYmFsIHdpbmRvdywgZG9jdW1lbnQgKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqIERJIGVudHJ5IHBvaW50cyBmb3IgZGVmYXVsdCBidWlsZHMuIE1vc3QgZGVwZW5kZW5jaWVzIGNhbiBiZVxyXG4gICAgc3BlY2lmaWVkIGluIHRoZSBjb25zdHJ1Y3RvciBzZXR0aW5ncyBmb3IgcGVyLWluc3RhbmNlIHNldHVwLlxyXG4qKi9cclxudmFyIGRlcHMgPSByZXF1aXJlKCcuL2RlcGVuZGVuY2llcycpO1xyXG5cclxuLyoqIENvbnN0cnVjdG9yICoqL1xyXG5cclxuZnVuY3Rpb24gU2hlbGwoc2V0dGluZ3MpIHtcclxuICAgIC8vanNoaW50IG1heGNvbXBsZXhpdHk6MTRcclxuICAgIFxyXG4gICAgZGVwcy5FdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLiQgPSBzZXR0aW5ncy5qcXVlcnkgfHwgZGVwcy5qcXVlcnk7XHJcbiAgICB0aGlzLiRyb290ID0gdGhpcy4kKHNldHRpbmdzLnJvb3QpO1xyXG4gICAgdGhpcy5iYXNlVXJsID0gc2V0dGluZ3MuYmFzZVVybCB8fCAnJztcclxuICAgIC8vIFdpdGggZm9yY2VIYXNoYmFuZz10cnVlOlxyXG4gICAgLy8gLSBmcmFnbWVudHMgVVJMcyBjYW5ub3QgYmUgdXNlZCB0byBzY3JvbGwgdG8gYW4gZWxlbWVudCAoZGVmYXVsdCBicm93c2VyIGJlaGF2aW9yKSxcclxuICAgIC8vICAgdGhleSBhcmUgZGVmYXVsdFByZXZlbnRlZCB0byBhdm9pZCBjb25mdXNlIHRoZSByb3V0aW5nIG1lY2hhbmlzbSBhbmQgY3VycmVudCBVUkwuXHJcbiAgICAvLyAtIHByZXNzZWQgbGlua3MgdG8gZnJhZ21lbnRzIFVSTHMgYXJlIG5vdCByb3V0ZWQsIHRoZXkgYXJlIHNraXBwZWQgc2lsZW50bHlcclxuICAgIC8vICAgZXhjZXB0IHdoZW4gdGhleSBhcmUgYSBoYXNoYmFuZyAoIyEpLiBUaGlzIHdheSwgc3BlY2lhbCBsaW5rc1xyXG4gICAgLy8gICB0aGF0IHBlcmZvcm1uIGpzIGFjdGlvbnMgZG9lc24ndCBjb25mbGl0cy5cclxuICAgIC8vIC0gYWxsIFVSTHMgcm91dGVkIHRocm91Z2ggdGhlIHNoZWxsIGluY2x1ZGVzIGEgaGFzaGJhbmcgKCMhKSwgdGhlIHNoZWxsIGVuc3VyZXNcclxuICAgIC8vICAgdGhhdCBoYXBwZW5zIGJ5IGFwcGVuZGluZyB0aGUgaGFzaGJhbmcgdG8gYW55IFVSTCBwYXNzZWQgaW4gKGV4Y2VwdCB0aGUgc3RhbmRhcmQgaGFzaFxyXG4gICAgLy8gICB0aGF0IGFyZSBza2lwdCkuXHJcbiAgICB0aGlzLmZvcmNlSGFzaGJhbmcgPSBzZXR0aW5ncy5mb3JjZUhhc2hiYW5nIHx8IGZhbHNlO1xyXG4gICAgdGhpcy5saW5rRXZlbnQgPSBzZXR0aW5ncy5saW5rRXZlbnQgfHwgJ2NsaWNrJztcclxuICAgIHRoaXMucGFyc2VVcmwgPSAoc2V0dGluZ3MucGFyc2VVcmwgfHwgZGVwcy5wYXJzZVVybCkuYmluZCh0aGlzLCB0aGlzLmJhc2VVcmwpO1xyXG4gICAgdGhpcy5hYnNvbHV0aXplVXJsID0gKHNldHRpbmdzLmFic29sdXRpemVVcmwgfHwgZGVwcy5hYnNvbHV0aXplVXJsKS5iaW5kKHRoaXMsIHRoaXMuYmFzZVVybCk7XHJcblxyXG4gICAgdGhpcy5oaXN0b3J5ID0gc2V0dGluZ3MuaGlzdG9yeSB8fCB3aW5kb3cuaGlzdG9yeTtcclxuXHJcbiAgICB0aGlzLmluZGV4TmFtZSA9IHNldHRpbmdzLmluZGV4TmFtZSB8fCAnaW5kZXgnO1xyXG4gICAgXHJcbiAgICB0aGlzLml0ZW1zID0gc2V0dGluZ3MuZG9tSXRlbXNNYW5hZ2VyO1xyXG5cclxuICAgIC8vIGxvYWRlciBjYW4gYmUgZGlzYWJsZWQgcGFzc2luZyAnbnVsbCcsIHNvIHdlIG11c3RcclxuICAgIC8vIGVuc3VyZSB0byBub3QgdXNlIHRoZSBkZWZhdWx0IG9uIHRoYXQgY2FzZXM6XHJcbiAgICB0aGlzLmxvYWRlciA9IHR5cGVvZihzZXR0aW5ncy5sb2FkZXIpID09PSAndW5kZWZpbmVkJyA/IGRlcHMubG9hZGVyIDogc2V0dGluZ3MubG9hZGVyO1xyXG4gICAgLy8gbG9hZGVyIHNldHVwXHJcbiAgICBpZiAodGhpcy5sb2FkZXIpXHJcbiAgICAgICAgdGhpcy5sb2FkZXIuYmFzZVVybCA9IHRoaXMuYmFzZVVybDtcclxuXHJcbiAgICAvLyBEZWZpbml0aW9uIG9mIGV2ZW50cyB0aGF0IHRoaXMgb2JqZWN0IGNhbiB0cmlnZ2VyLFxyXG4gICAgLy8gaXRzIHZhbHVlIGNhbiBiZSBjdXN0b21pemVkIGJ1dCBhbnkgbGlzdGVuZXIgbmVlZHNcclxuICAgIC8vIHRvIGtlZXAgdXBkYXRlZCB0byB0aGUgY29ycmVjdCBldmVudCBzdHJpbmctbmFtZSB1c2VkLlxyXG4gICAgLy8gVGhlIGl0ZW1zIG1hbmlwdWxhdGlvbiBldmVudHMgTVVTVCBiZSB0cmlnZ2VyZWRcclxuICAgIC8vIGJ5IHRoZSAnaXRlbXMuc3dpdGNoJyBmdW5jdGlvblxyXG4gICAgdGhpcy5ldmVudHMgPSB7XHJcbiAgICAgICAgd2lsbE9wZW46ICdzaGVsbC13aWxsLW9wZW4nLFxyXG4gICAgICAgIHdpbGxDbG9zZTogJ3NoZWxsLXdpbGwtY2xvc2UnLFxyXG4gICAgICAgIGl0ZW1SZWFkeTogJ3NoZWxsLWl0ZW0tcmVhZHknLFxyXG4gICAgICAgIGNsb3NlZDogJ3NoZWxsLWNsb3NlZCcsXHJcbiAgICAgICAgb3BlbmVkOiAnc2hlbGwtb3BlbmVkJ1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgQSBmdW5jdGlvbiB0byBkZWNpZGUgaWYgdGhlXHJcbiAgICAgICAgYWNjZXNzIGlzIGFsbG93ZWQgKHJldHVybnMgJ251bGwnKVxyXG4gICAgICAgIG9yIG5vdCAocmV0dXJuIGEgc3RhdGUgb2JqZWN0IHdpdGggaW5mb3JtYXRpb25cclxuICAgICAgICB0aGF0IHdpbGwgYmUgcGFzc2VkIHRvIHRoZSAnbm9uQWNjZXNzTmFtZScgaXRlbTtcclxuICAgICAgICB0aGUgJ3JvdXRlJyBwcm9wZXJ0eSBvbiB0aGUgc3RhdGUgaXMgYXV0b21hdGljYWxseSBmaWxsZWQpLlxyXG4gICAgICAgIFxyXG4gICAgICAgIFRoZSBkZWZhdWx0IGJ1aXQtaW4ganVzdCBhbGxvdyBldmVyeXRoaW5nIFxyXG4gICAgICAgIGJ5IGp1c3QgcmV0dXJuaW5nICdudWxsJyBhbGwgdGhlIHRpbWUuXHJcbiAgICAgICAgXHJcbiAgICAgICAgSXQgcmVjZWl2ZXMgYXMgcGFyYW1ldGVyIHRoZSBzdGF0ZSBvYmplY3QsXHJcbiAgICAgICAgdGhhdCBhbG1vc3QgY29udGFpbnMgdGhlICdyb3V0ZScgcHJvcGVydHkgd2l0aFxyXG4gICAgICAgIGluZm9ybWF0aW9uIGFib3V0IHRoZSBVUkwuXHJcbiAgICAqKi9cclxuICAgIHRoaXMuYWNjZXNzQ29udHJvbCA9IHNldHRpbmdzLmFjY2Vzc0NvbnRyb2wgfHwgZGVwcy5hY2Nlc3NDb250cm9sO1xyXG4gICAgLy8gV2hhdCBpdGVtIGxvYWQgb24gbm9uIGFjY2Vzc1xyXG4gICAgdGhpcy5ub25BY2Nlc3NOYW1lID0gc2V0dGluZ3Mubm9uQWNjZXNzTmFtZSB8fCAnaW5kZXgnO1xyXG59XHJcblxyXG4vLyBTaGVsbCBpbmhlcml0cyBmcm9tIEV2ZW50RW1pdHRlclxyXG5TaGVsbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGRlcHMuRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwge1xyXG4gICAgY29uc3RydWN0b3I6IHtcclxuICAgICAgICB2YWx1ZTogU2hlbGwsXHJcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXHJcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTaGVsbDtcclxuXHJcblxyXG4vKiogQVBJIGRlZmluaXRpb24gKiovXHJcblxyXG5TaGVsbC5wcm90b3R5cGUuZ28gPSBmdW5jdGlvbiBnbyh1cmwsIHN0YXRlKSB7XHJcblxyXG4gICAgaWYgKHRoaXMuZm9yY2VIYXNoYmFuZykge1xyXG4gICAgICAgIGlmICghL14jIS8udGVzdCh1cmwpKSB7XHJcbiAgICAgICAgICAgIHVybCA9ICcjIScgKyB1cmw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdXJsID0gdGhpcy5hYnNvbHV0aXplVXJsKHVybCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLmhpc3RvcnkucHVzaFN0YXRlKHN0YXRlLCB1bmRlZmluZWQsIHVybCk7XHJcbiAgICAvLyBwdXNoU3RhdGUgZG8gTk9UIHRyaWdnZXIgdGhlIHBvcHN0YXRlIGV2ZW50LCBzb1xyXG4gICAgcmV0dXJuIHRoaXMucmVwbGFjZShzdGF0ZSk7XHJcbn07XHJcblxyXG5TaGVsbC5wcm90b3R5cGUuZ29CYWNrID0gZnVuY3Rpb24gZ29CYWNrKHN0YXRlLCBzdGVwcykge1xyXG4gICAgc3RlcHMgPSAwIC0gKHN0ZXBzIHx8IDEpO1xyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm90aGluZyB0byBnby1iYWNrIG9yIG5vdCBlbm91Z2h0XHJcbiAgICAvLyAnYmFjaycgc3RlcHMsIGdvIHRvIHRoZSBpbmRleFxyXG4gICAgaWYgKHN0ZXBzIDwgMCAmJiBNYXRoLmFicyhzdGVwcykgPj0gdGhpcy5oaXN0b3J5Lmxlbmd0aCkge1xyXG4gICAgICAgIHRoaXMuZ28odGhpcy5pbmRleE5hbWUpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgLy8gT24gcmVwbGFjZSwgdGhlIHBhc3NlZCBzdGF0ZSBpcyBtZXJnZWQgd2l0aFxyXG4gICAgICAgIC8vIHRoZSBvbmUgdGhhdCBjb21lcyBmcm9tIHRoZSBzYXZlZCBoaXN0b3J5XHJcbiAgICAgICAgLy8gZW50cnkgKGl0ICdwb3BzJyB3aGVuIGRvaW5nIHRoZSBoaXN0b3J5LmdvKCkpXHJcbiAgICAgICAgdGhpcy5fcGVuZGluZ1N0YXRlVXBkYXRlID0gc3RhdGU7XHJcbiAgICAgICAgdGhpcy5oaXN0b3J5LmdvKHN0ZXBzKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gICAgUHJvY2VzcyB0aGUgZ2l2ZW4gc3RhdGUgaW4gb3JkZXIgdG8gZ2V0IHRoZSBjdXJyZW50IHN0YXRlXHJcbiAgICBiYXNlZCBvbiB0aGF0IG9yIHRoZSBzYXZlZCBpbiBoaXN0b3J5LCBtZXJnZSBpdCB3aXRoXHJcbiAgICBhbnkgdXBkYXRlZCBzdGF0ZSBwZW5kaW5nIGFuZCBhZGRzIHRoZSByb3V0ZSBpbmZvcm1hdGlvbixcclxuICAgIHJldHVybmluZyBhbiBzdGF0ZSBvYmplY3Qgc3VpdGFibGUgdG8gdXNlLlxyXG4qKi9cclxuU2hlbGwucHJvdG90eXBlLmdldFVwZGF0ZWRTdGF0ZSA9IGZ1bmN0aW9uIGdldFVwZGF0ZWRTdGF0ZShzdGF0ZSkge1xyXG4gICAgLypqc2hpbnQgbWF4Y29tcGxleGl0eTogOCAqL1xyXG4gICAgXHJcbiAgICAvLyBGb3IgY3VycmVudCB1c2VzLCBhbnkgcGVuZGluZ1N0YXRlVXBkYXRlIGlzIHVzZWQgYXNcclxuICAgIC8vIHRoZSBzdGF0ZSwgcmF0aGVyIHRoYW4gdGhlIHByb3ZpZGVkIG9uZVxyXG4gICAgc3RhdGUgPSB0aGlzLl9wZW5kaW5nU3RhdGVVcGRhdGUgfHwgc3RhdGUgfHwgdGhpcy5oaXN0b3J5LnN0YXRlIHx8IHt9O1xyXG4gICAgXHJcbiAgICAvLyBUT0RPOiBtb3JlIGFkdmFuY2VkIHVzZXMgbXVzdCBiZSB0byB1c2UgdGhlICdzdGF0ZScgdG9cclxuICAgIC8vIHJlY292ZXIgdGhlIFVJIHN0YXRlLCB3aXRoIGFueSBtZXNzYWdlIGZyb20gb3RoZXIgVUlcclxuICAgIC8vIHBhc3NpbmcgaW4gYSB3YXkgdGhhdCBhbGxvdyB1cGRhdGUgdGhlIHN0YXRlLCBub3RcclxuICAgIC8vIHJlcGxhY2UgaXQgKGZyb20gcGVuZGluZ1N0YXRlVXBkYXRlKS5cclxuICAgIC8qXHJcbiAgICAvLyBTdGF0ZSBvciBkZWZhdWx0IHN0YXRlXHJcbiAgICBzdGF0ZSA9IHN0YXRlIHx8IHRoaXMuaGlzdG9yeS5zdGF0ZSB8fCB7fTtcclxuICAgIC8vIG1lcmdlIHBlbmRpbmcgdXBkYXRlZCBzdGF0ZVxyXG4gICAgdGhpcy4kLmV4dGVuZChzdGF0ZSwgdGhpcy5fcGVuZGluZ1N0YXRlVXBkYXRlKTtcclxuICAgIC8vIGRpc2NhcmQgdGhlIHVwZGF0ZVxyXG4gICAgKi9cclxuICAgIHRoaXMuX3BlbmRpbmdTdGF0ZVVwZGF0ZSA9IG51bGw7XHJcbiAgICBcclxuICAgIC8vIERvZXNuJ3QgbWF0dGVycyBpZiBzdGF0ZSBpbmNsdWRlcyBhbHJlYWR5IFxyXG4gICAgLy8gJ3JvdXRlJyBpbmZvcm1hdGlvbiwgbmVlZCB0byBiZSBvdmVyd3JpdHRlblxyXG4gICAgLy8gdG8gbWF0Y2ggdGhlIGN1cnJlbnQgb25lLlxyXG4gICAgLy8gTk9URTogcHJldmlvdXNseSwgYSBjaGVjayBwcmV2ZW50ZWQgdGhpcyBpZlxyXG4gICAgLy8gcm91dGUgcHJvcGVydHkgZXhpc3RzLCBjcmVhdGluZyBpbmZpbml0ZSBsb29wc1xyXG4gICAgLy8gb24gcmVkaXJlY3Rpb25zIGZyb20gYWN0aXZpdHkuc2hvdyBzaW5jZSAncm91dGUnIGRvZXNuJ3RcclxuICAgIC8vIG1hdGNoIHRoZSBuZXcgZGVzaXJlZCBsb2NhdGlvblxyXG4gICAgXHJcbiAgICAvLyBEZXRlY3QgaWYgaXMgYSBoYXNoYmFuZyBVUkwgb3IgYW4gc3RhbmRhcmQgb25lLlxyXG4gICAgLy8gRXhjZXB0IGlmIHRoZSBhcHAgaXMgZm9yY2VkIHRvIHVzZSBoYXNoYmFuZy5cclxuICAgIHZhciBpc0hhc2hCYW5nID0gLyMhLy50ZXN0KGxvY2F0aW9uLmhyZWYpIHx8IHRoaXMuZm9yY2VIYXNoYmFuZztcclxuICAgIFxyXG4gICAgdmFyIGxpbmsgPSAoXHJcbiAgICAgICAgaXNIYXNoQmFuZyA/XHJcbiAgICAgICAgbG9jYXRpb24uaGFzaCA6XHJcbiAgICAgICAgbG9jYXRpb24ucGF0aG5hbWVcclxuICAgICkgKyAobG9jYXRpb24uc2VhcmNoIHx8ICcnKTtcclxuICAgIFxyXG4gICAgLy8gU2V0IHRoZSByb3V0ZVxyXG4gICAgc3RhdGUucm91dGUgPSB0aGlzLnBhcnNlVXJsKGxpbmspO1xyXG4gICAgXHJcbiAgICByZXR1cm4gc3RhdGU7XHJcbn07XHJcblxyXG5TaGVsbC5wcm90b3R5cGUucmVwbGFjZSA9IGZ1bmN0aW9uIHJlcGxhY2Uoc3RhdGUpIHtcclxuICAgIFxyXG4gICAgc3RhdGUgPSB0aGlzLmdldFVwZGF0ZWRTdGF0ZShzdGF0ZSk7XHJcblxyXG4gICAgLy8gVXNlIHRoZSBpbmRleCBvbiByb290IGNhbGxzXHJcbiAgICBpZiAoc3RhdGUucm91dGUucm9vdCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIHN0YXRlLnJvdXRlID0gdGhpcy5wYXJzZVVybCh0aGlzLmluZGV4TmFtZSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEFjY2VzcyBjb250cm9sXHJcbiAgICB2YXIgYWNjZXNzRXJyb3IgPSB0aGlzLmFjY2Vzc0NvbnRyb2woc3RhdGUucm91dGUpO1xyXG4gICAgaWYgKGFjY2Vzc0Vycm9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ28odGhpcy5ub25BY2Nlc3NOYW1lLCBhY2Nlc3NFcnJvcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTG9jYXRpbmcgdGhlIGNvbnRhaW5lclxyXG4gICAgdmFyICRjb250ID0gdGhpcy5pdGVtcy5maW5kKHN0YXRlLnJvdXRlLm5hbWUpO1xyXG4gICAgdmFyIHNoZWxsID0gdGhpcztcclxuICAgIHZhciBwcm9taXNlID0gbnVsbDtcclxuXHJcbiAgICBpZiAoJGNvbnQgJiYgJGNvbnQubGVuZ3RoKSB7XHJcbiAgICAgICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciAkb2xkQ29udCA9IHNoZWxsLml0ZW1zLmdldEFjdGl2ZSgpO1xyXG4gICAgICAgICAgICAgICAgJG9sZENvbnQgPSAkb2xkQ29udC5ub3QoJGNvbnQpO1xyXG4gICAgICAgICAgICAgICAgc2hlbGwuaXRlbXMuc3dpdGNoKCRvbGRDb250LCAkY29udCwgc2hlbGwsIHN0YXRlKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7IC8vPyByZXNvbHZlKGFjdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoZXgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBpZiAodGhpcy5sb2FkZXIpIHtcclxuICAgICAgICAgICAgLy8gbG9hZCBhbmQgaW5qZWN0IHRoZSBjb250ZW50IGluIHRoZSBwYWdlXHJcbiAgICAgICAgICAgIC8vIHRoZW4gdHJ5IHRoZSByZXBsYWNlIGFnYWluXHJcbiAgICAgICAgICAgIHByb21pc2UgPSB0aGlzLmxvYWRlci5sb2FkKHN0YXRlLnJvdXRlKS50aGVuKGZ1bmN0aW9uKGh0bWwpIHtcclxuICAgICAgICAgICAgICAgIC8vIEFkZCB0byB0aGUgaXRlbXMgKHRoZSBtYW5hZ2VyIHRha2VzIGNhcmUgeW91XHJcbiAgICAgICAgICAgICAgICAvLyBhZGQgb25seSB0aGUgaXRlbSwgaWYgdGhlcmUgaXMgb25lKVxyXG4gICAgICAgICAgICAgICAgc2hlbGwuaXRlbXMuaW5qZWN0KHN0YXRlLnJvdXRlLm5hbWUsIGh0bWwpO1xyXG4gICAgICAgICAgICAgICAgLy8gRG91YmxlIGNoZWNrIHRoYXQgdGhlIGl0ZW0gd2FzIGFkZGVkIGFuZCBpcyByZWFkeVxyXG4gICAgICAgICAgICAgICAgLy8gdG8gYXZvaWQgYW4gaW5maW5pdGUgbG9vcCBiZWNhdXNlIGEgcmVxdWVzdCBub3QgcmV0dXJuaW5nXHJcbiAgICAgICAgICAgICAgICAvLyB0aGUgaXRlbSBhbmQgdGhlICdyZXBsYWNlJyB0cnlpbmcgdG8gbG9hZCBpdCBhZ2FpbiwgYW5kIGFnYWluLCBhbmQuLlxyXG4gICAgICAgICAgICAgICAgaWYgKHNoZWxsLml0ZW1zLmZpbmQoc3RhdGUucm91dGUubmFtZSkubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzaGVsbC5yZXBsYWNlKHN0YXRlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdQYWdlIG5vdCBmb3VuZCAoJyArIHN0YXRlLnJvdXRlLm5hbWUgKyAnKScpO1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1NoZWxsIFBhZ2Ugbm90IGZvdW5kLCBzdGF0ZTonLCBzdGF0ZSk7XHJcbiAgICAgICAgICAgIHByb21pc2UgPSBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gVG8gYXZvaWQgYmVpbmcgaW4gYW4gaW5leGlzdGFudCBVUkwgKGdlbmVyYXRpbmcgaW5jb25zaXN0ZW5jeSBiZXR3ZWVuXHJcbiAgICAgICAgICAgIC8vIGN1cnJlbnQgdmlldyBhbmQgVVJMLCBjcmVhdGluZyBiYWQgaGlzdG9yeSBlbnRyaWVzKSxcclxuICAgICAgICAgICAgLy8gYSBnb0JhY2sgaXMgZXhlY3V0ZWQsIGp1c3QgYWZ0ZXIgdGhlIGN1cnJlbnQgcGlwZSBlbmRzXHJcbiAgICAgICAgICAgIC8vIFRPRE86IGltcGxlbWVudCByZWRpcmVjdCB0aGF0IGN1dCBjdXJyZW50IHByb2Nlc3NpbmcgcmF0aGVyIHRoYW4gZXhlY3V0ZSBkZWxheWVkXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdvQmFjaygpO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcyksIDEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIHRoaXNTaGVsbCA9IHRoaXM7XHJcbiAgICBwcm9taXNlLmNhdGNoKGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgIGlmICghKGVyciBpbnN0YW5jZW9mIEVycm9yKSlcclxuICAgICAgICAgICAgZXJyID0gbmV3IEVycm9yKGVycik7XHJcblxyXG4gICAgICAgIC8vIExvZyBlcnJvciwgXHJcbiAgICAgICAgY29uc29sZS5lcnJvcignU2hlbGwsIHVuZXhwZWN0ZWQgZXJyb3IuJywgZXJyKTtcclxuICAgICAgICAvLyBub3RpZnkgYXMgYW4gZXZlbnRcclxuICAgICAgICB0aGlzU2hlbGwuZW1pdCgnZXJyb3InLCBlcnIpO1xyXG4gICAgICAgIC8vIGFuZCBjb250aW51ZSBwcm9wYWdhdGluZyB0aGUgZXJyb3JcclxuICAgICAgICByZXR1cm4gZXJyO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHByb21pc2U7XHJcbn07XHJcblxyXG5TaGVsbC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gcnVuKCkge1xyXG5cclxuICAgIHZhciBzaGVsbCA9IHRoaXM7XHJcblxyXG4gICAgLy8gQ2F0Y2ggcG9wc3RhdGUgZXZlbnQgdG8gdXBkYXRlIHNoZWxsIHJlcGxhY2luZyB0aGUgYWN0aXZlIGNvbnRhaW5lci5cclxuICAgIC8vIEFsbG93cyBwb2x5ZmlsbHMgdG8gcHJvdmlkZSBhIGRpZmZlcmVudCBidXQgZXF1aXZhbGVudCBldmVudCBuYW1lXHJcbiAgICB0aGlzLiQod2luZG93KS5vbih0aGlzLmhpc3RvcnkucG9wc3RhdGVFdmVudCB8fCAncG9wc3RhdGUnLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBzdGF0ZSA9IGV2ZW50LnN0YXRlIHx8IFxyXG4gICAgICAgICAgICAoZXZlbnQub3JpZ2luYWxFdmVudCAmJiBldmVudC5vcmlnaW5hbEV2ZW50LnN0YXRlKSB8fCBcclxuICAgICAgICAgICAgc2hlbGwuaGlzdG9yeS5zdGF0ZTtcclxuXHJcbiAgICAgICAgLy8gZ2V0IHN0YXRlIGZvciBjdXJyZW50LiBUbyBzdXBwb3J0IHBvbHlmaWxscywgd2UgdXNlIHRoZSBnZW5lcmFsIGdldHRlclxyXG4gICAgICAgIC8vIGhpc3Rvcnkuc3RhdGUgYXMgZmFsbGJhY2sgKHRoZXkgbXVzdCBiZSB0aGUgc2FtZSBvbiBicm93c2VycyBzdXBwb3J0aW5nIEhpc3RvcnkgQVBJKVxyXG4gICAgICAgIHNoZWxsLnJlcGxhY2Uoc3RhdGUpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ2F0Y2ggYWxsIGxpbmtzIGluIHRoZSBwYWdlIChub3Qgb25seSAkcm9vdCBvbmVzKSBhbmQgbGlrZS1saW5rc1xyXG4gICAgdGhpcy4kKGRvY3VtZW50KS5vbih0aGlzLmxpbmtFdmVudCwgJ1tocmVmXSwgW2RhdGEtaHJlZl0nLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyICR0ID0gc2hlbGwuJCh0aGlzKSxcclxuICAgICAgICAgICAgaHJlZiA9ICR0LmF0dHIoJ2hyZWYnKSB8fCAkdC5kYXRhKCdocmVmJyk7XHJcblxyXG4gICAgICAgIC8vIERvIG5vdGhpbmcgaWYgdGhlIFVSTCBjb250YWlucyB0aGUgcHJvdG9jb2xcclxuICAgICAgICBpZiAoL15bYS16XSs6L2kudGVzdChocmVmKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHNoZWxsLmZvcmNlSGFzaGJhbmcgJiYgL14jKFteIV18JCkvLnRlc3QoaHJlZikpIHtcclxuICAgICAgICAgICAgLy8gU3RhbmRhcmQgaGFzaCwgYnV0IG5vdCBoYXNoYmFuZzogYXZvaWQgcm91dGluZyBhbmQgZGVmYXVsdCBiZWhhdmlvclxyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAvLz8gZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgLy8gRXhlY3V0ZWQgZGVsYXllZCB0byBhdm9pZCBoYW5kbGVyIGNvbGxpc2lvbnMsIGJlY2F1c2VcclxuICAgICAgICAvLyBvZiB0aGUgbmV3IHBhZ2UgbW9kaWZ5aW5nIHRoZSBlbGVtZW50IGFuZCBvdGhlciBoYW5kbGVyc1xyXG4gICAgICAgIC8vIHJlYWRpbmcgaXQgYXR0cmlidXRlcyBhbmQgYXBwbHlpbmcgbG9naWMgb24gdGhlIHVwZGF0ZWQgbGlua1xyXG4gICAgICAgIC8vIGFzIGlmIHdhcyB0aGUgb2xkIG9uZSAoZXhhbXBsZTogc2hhcmVkIGxpbmtzLCBsaWtlIGluIGFcclxuICAgICAgICAvLyBnbG9iYWwgbmF2YmFyLCB0aGF0IG1vZGlmaWVzIHdpdGggdGhlIG5ldyBwYWdlKS5cclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBzaGVsbC5nbyhocmVmKTtcclxuICAgICAgICB9LCAxKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEluaXRpYWxsaXplIHN0YXRlXHJcbiAgICB0aGlzLml0ZW1zLmluaXQoKTtcclxuICAgIC8vIFJvdXRlIHRvIHRoZSBjdXJyZW50IHVybC9zdGF0ZVxyXG4gICAgdGhpcy5yZXBsYWNlKCk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgYWJzb2x1dGl6ZVVybCB1dGlsaXR5IFxyXG4gICAgdGhhdCBlbnN1cmVzIHRoZSB1cmwgcHJvdmlkZWRcclxuICAgIGJlaW5nIGluIHRoZSBwYXRoIG9mIHRoZSBnaXZlbiBiYXNlVXJsXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgc2FuaXRpemVVcmwgPSByZXF1aXJlKCcuL3Nhbml0aXplVXJsJyksXHJcbiAgICBlc2NhcGVSZWdFeHAgPSByZXF1aXJlKCcuLi9lc2NhcGVSZWdFeHAnKTtcclxuXHJcbmZ1bmN0aW9uIGFic29sdXRpemVVcmwoYmFzZVVybCwgdXJsKSB7XHJcblxyXG4gICAgLy8gc2FuaXRpemUgYmVmb3JlIGNoZWNrXHJcbiAgICB1cmwgPSBzYW5pdGl6ZVVybCh1cmwpO1xyXG5cclxuICAgIC8vIENoZWNrIGlmIHVzZSB0aGUgYmFzZSBhbHJlYWR5XHJcbiAgICB2YXIgbWF0Y2hCYXNlID0gbmV3IFJlZ0V4cCgnXicgKyBlc2NhcGVSZWdFeHAoYmFzZVVybCksICdpJyk7XHJcbiAgICBpZiAobWF0Y2hCYXNlLnRlc3QodXJsKSkge1xyXG4gICAgICAgIHJldHVybiB1cmw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gYnVpbGQgYW5kIHNhbml0aXplXHJcbiAgICByZXR1cm4gc2FuaXRpemVVcmwoYmFzZVVybCArIHVybCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYWJzb2x1dGl6ZVVybDtcclxuIiwiLyoqXHJcbiAgICBFeHRlcm5hbCBkZXBlbmRlbmNpZXMgZm9yIFNoZWxsIGluIGEgc2VwYXJhdGUgbW9kdWxlXHJcbiAgICB0byB1c2UgYXMgREksIG5lZWRzIHNldHVwIGJlZm9yZSBjYWxsIHRoZSBTaGVsbC5qc1xyXG4gICAgbW9kdWxlIGNsYXNzXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHBhcnNlVXJsOiBudWxsLFxyXG4gICAgYWJzb2x1dGl6ZVVybDogbnVsbCxcclxuICAgIGpxdWVyeTogbnVsbCxcclxuICAgIGxvYWRlcjogbnVsbCxcclxuICAgIGFjY2Vzc0NvbnRyb2w6IGZ1bmN0aW9uIGFsbG93QWxsKC8qbmFtZSovKSB7XHJcbiAgICAgICAgLy8gYWxsb3cgYWNjZXNzIGJ5IGRlZmF1bHRcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH0sXHJcbiAgICBFdmVudEVtaXR0ZXI6IG51bGxcclxufTtcclxuIiwiLyoqXHJcbiAgICBTaW1wbGUgaW1wbGVtZW50YXRpb24gb2YgdGhlIEhpc3RvcnkgQVBJIHVzaW5nIG9ubHkgaGFzaGJhbmdzIFVSTHMsXHJcbiAgICBkb2Vzbid0IG1hdHRlcnMgdGhlIGJyb3dzZXIgc3VwcG9ydC5cclxuICAgIFVzZWQgdG8gYXZvaWQgZnJvbSBzZXR0aW5nIFVSTHMgdGhhdCBoYXMgbm90IGFuIGVuZC1wb2ludCxcclxuICAgIGxpa2UgaW4gbG9jYWwgZW52aXJvbm1lbnRzIHdpdGhvdXQgYSBzZXJ2ZXIgZG9pbmcgdXJsLXJld3JpdGluZyxcclxuICAgIGluIHBob25lZ2FwIGFwcHMsIG9yIHRvIGNvbXBsZXRlbHkgYnktcGFzcyBicm93c2VyIHN1cHBvcnQgYmVjYXVzZVxyXG4gICAgaXMgYnVnZ3kgKGxpa2UgQW5kcm9pZCA8PSA0LjEpLlxyXG4gICAgXHJcbiAgICBOT1RFUzpcclxuICAgIC0gQnJvd3NlciBtdXN0IHN1cHBvcnQgJ2hhc2hjaGFuZ2UnIGV2ZW50LlxyXG4gICAgLSBCcm93c2VyIG11c3QgaGFzIHN1cHBvcnQgZm9yIHN0YW5kYXJkIEpTT04gY2xhc3MuXHJcbiAgICAtIFJlbGllcyBvbiBzZXNzaW9uc3RvcmFnZSBmb3IgcGVyc2lzdGFuY2UsIHN1cHBvcnRlZCBieSBhbGwgYnJvd3NlcnMgYW5kIHdlYnZpZXdzIFxyXG4gICAgICBmb3IgYSBlbm91Z2ggbG9uZyB0aW1lIG5vdy5cclxuICAgIC0gU2ltaWxhciBhcHByb2FjaCBhcyBIaXN0b3J5LmpzIHBvbHlmaWxsLCBidXQgc2ltcGxpZmllZCwgYXBwZW5kaW5nIGEgZmFrZSBxdWVyeVxyXG4gICAgICBwYXJhbWV0ZXIgJ19zdWlkPTAnIHRvIHRoZSBoYXNoIHZhbHVlIChhY3R1YWwgcXVlcnkgZ29lcyBiZWZvcmUgdGhlIGhhc2gsIGJ1dFxyXG4gICAgICB3ZSBuZWVkIGl0IGluc2lkZSkuXHJcbiAgICAtIEZvciBzaW1wbGlmaWNhdGlvbiwgb25seSB0aGUgc3RhdGUgaXMgcGVyc2lzdGVkLCB0aGUgJ3RpdGxlJyBwYXJhbWV0ZXIgaXMgbm90XHJcbiAgICAgIHVzZWQgYXQgYWxsICh0aGUgc2FtZSBhcyBtYWpvciBicm93c2VycyBkbywgc28gaXMgbm90IGEgcHJvYmxlbSk7IGluIHRoaXMgbGluZSxcclxuICAgICAgb25seSBoaXN0b3J5IGVudHJpZXMgd2l0aCBzdGF0ZSBhcmUgcGVyc2lzdGVkLlxyXG4qKi9cclxuLy9nbG9iYWwgbG9jYXRpb25cclxuJ3VzZSBzdHJpY3QnO1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgc2FuaXRpemVVcmwgPSByZXF1aXJlKCcuL3Nhbml0aXplVXJsJyksXHJcbiAgICBnZXRVcmxRdWVyeSA9IHJlcXVpcmUoJy4uL2dldFVybFF1ZXJ5Jyk7XHJcblxyXG4vLyBJbml0OiBMb2FkIHNhdmVkIGNvcHkgZnJvbSBzZXNzaW9uU3RvcmFnZVxyXG52YXIgc2Vzc2lvbiA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oJ2hhc2hiYW5nSGlzdG9yeS5zdG9yZScpO1xyXG4vLyBPciBjcmVhdGUgYSBuZXcgb25lXHJcbmlmICghc2Vzc2lvbikge1xyXG4gICAgc2Vzc2lvbiA9IHtcclxuICAgICAgICAvLyBTdGF0ZXMgYXJyYXkgd2hlcmUgZWFjaCBpbmRleCBpcyB0aGUgU1VJRCBjb2RlIGFuZCB0aGVcclxuICAgICAgICAvLyB2YWx1ZSBpcyBqdXN0IHRoZSB2YWx1ZSBwYXNzZWQgYXMgc3RhdGUgb24gcHVzaFN0YXRlL3JlcGxhY2VTdGF0ZVxyXG4gICAgICAgIHN0YXRlczogW11cclxuICAgIH07XHJcbn1cclxuZWxzZSB7XHJcbiAgICBzZXNzaW9uID0gSlNPTi5wYXJzZShzZXNzaW9uKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gICAgR2V0IHRoZSBTVUlEIG51bWJlclxyXG4gICAgZnJvbSBhIGhhc2ggc3RyaW5nXHJcbioqL1xyXG5mdW5jdGlvbiBnZXRTdWlkKGhhc2gpIHtcclxuICAgIFxyXG4gICAgdmFyIHN1aWQgPSArZ2V0VXJsUXVlcnkoaGFzaCkuX3N1aWQ7XHJcbiAgICBpZiAoaXNOYU4oc3VpZCkpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuIHN1aWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldFN1aWQoaGFzaCwgc3VpZCkge1xyXG4gICAgXHJcbiAgICAvLyBXZSBuZWVkIHRoZSBxdWVyeSwgc2luY2Ugd2UgbmVlZCBcclxuICAgIC8vIHRvIHJlcGxhY2UgdGhlIF9zdWlkIChtYXkgZXhpc3QpXHJcbiAgICAvLyBhbmQgcmVjcmVhdGUgdGhlIHF1ZXJ5IGluIHRoZVxyXG4gICAgLy8gcmV0dXJuZWQgaGFzaC11cmxcclxuICAgIHZhciBxcyA9IGdldFVybFF1ZXJ5KGhhc2gpO1xyXG4gICAgcXMucHVzaCgnX3N1aWQnKTtcclxuICAgIHFzLl9zdWlkID0gc3VpZDtcclxuXHJcbiAgICB2YXIgcXVlcnkgPSBbXTtcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBxcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHF1ZXJ5LnB1c2gocXNbaV0gKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQocXNbcXNbaV1dKSk7XHJcbiAgICB9XHJcbiAgICBxdWVyeSA9IHF1ZXJ5LmpvaW4oJyYnKTtcclxuICAgIFxyXG4gICAgaWYgKHF1ZXJ5KSB7XHJcbiAgICAgICAgdmFyIGluZGV4ID0gaGFzaC5pbmRleE9mKCc/Jyk7XHJcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpXHJcbiAgICAgICAgICAgIGhhc2ggPSBoYXNoLnN1YnN0cigwLCBpbmRleCk7XHJcbiAgICAgICAgaGFzaCArPSAnPycgKyBxdWVyeTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaGFzaDtcclxufVxyXG5cclxuLyoqXHJcbiAgICBBc2sgdG8gcGVyc2lzdCB0aGUgc2Vzc2lvbiBkYXRhLlxyXG4gICAgSXQgaXMgZG9uZSB3aXRoIGEgdGltZW91dCBpbiBvcmRlciB0byBhdm9pZFxyXG4gICAgZGVsYXkgaW4gdGhlIGN1cnJlbnQgdGFzayBtYWlubHkgYW55IGhhbmRsZXJcclxuICAgIHRoYXQgYWN0cyBhZnRlciBhIEhpc3RvcnkgY2hhbmdlLlxyXG4qKi9cclxuZnVuY3Rpb24gcGVyc2lzdCgpIHtcclxuICAgIC8vIEVub3VnaCB0aW1lIHRvIGFsbG93IHJvdXRpbmcgdGFza3MsXHJcbiAgICAvLyBtb3N0IGFuaW1hdGlvbnMgZnJvbSBmaW5pc2ggYW5kIHRoZSBVSVxyXG4gICAgLy8gYmVpbmcgcmVzcG9uc2l2ZS5cclxuICAgIC8vIEJlY2F1c2Ugc2Vzc2lvblN0b3JhZ2UgaXMgc3luY2hyb25vdXMuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oJ2hhc2hiYW5nSGlzdG9yeS5zdG9yZScsIEpTT04uc3RyaW5naWZ5KHNlc3Npb24pKTtcclxuICAgIH0sIDE1MDApO1xyXG59XHJcblxyXG4vKipcclxuICAgIFJldHVybnMgdGhlIGdpdmVuIHN0YXRlIG9yIG51bGxcclxuICAgIGlmIGlzIGFuIGVtcHR5IG9iamVjdC5cclxuKiovXHJcbmZ1bmN0aW9uIGNoZWNrU3RhdGUoc3RhdGUpIHtcclxuICAgIFxyXG4gICAgaWYgKHN0YXRlKSB7XHJcbiAgICAgICAgLy8gaXMgZW1wdHk/XHJcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKHN0YXRlKS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIC8vIE5vXHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gaXRzIGVtcHR5XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICAvLyBBbnl0aGluZyBlbHNlXHJcbiAgICByZXR1cm4gc3RhdGU7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgR2V0IGEgY2Fub25pY2FsIHJlcHJlc2VudGF0aW9uXHJcbiAgICBvZiB0aGUgVVJMIHNvIGNhbiBiZSBjb21wYXJlZFxyXG4gICAgd2l0aCBzdWNjZXNzLlxyXG4qKi9cclxuZnVuY3Rpb24gY2Fubm9uaWNhbFVybCh1cmwpIHtcclxuICAgIFxyXG4gICAgLy8gQXZvaWQgc29tZSBiYWQgb3IgcHJvYmxlbWF0aWMgc3ludGF4XHJcbiAgICB1cmwgPSBzYW5pdGl6ZVVybCh1cmwgfHwgJycpO1xyXG4gICAgXHJcbiAgICAvLyBHZXQgdGhlIGhhc2ggcGFydFxyXG4gICAgdmFyIGloYXNoID0gdXJsLmluZGV4T2YoJyMnKTtcclxuICAgIGlmIChpaGFzaCA+IC0xKSB7XHJcbiAgICAgICAgdXJsID0gdXJsLnN1YnN0cihpaGFzaCArIDEpO1xyXG4gICAgfVxyXG4gICAgLy8gTWF5YmUgYSBoYXNoYmFuZyBVUkwsIHJlbW92ZSB0aGVcclxuICAgIC8vICdiYW5nJyAodGhlIGhhc2ggd2FzIHJlbW92ZWQgYWxyZWFkeSlcclxuICAgIHVybCA9IHVybC5yZXBsYWNlKC9eIS8sICcnKTtcclxuXHJcbiAgICByZXR1cm4gdXJsO1xyXG59XHJcblxyXG4vKipcclxuICAgIFRyYWNrcyB0aGUgbGF0ZXN0IFVSTFxyXG4gICAgYmVpbmcgcHVzaGVkIG9yIHJlcGxhY2VkIGJ5XHJcbiAgICB0aGUgQVBJLlxyXG4gICAgVGhpcyBhbGxvd3MgbGF0ZXIgdG8gYXZvaWRcclxuICAgIHRyaWdnZXIgdGhlIHBvcHN0YXRlIGV2ZW50LFxyXG4gICAgc2luY2UgbXVzdCBOT1QgYmUgdHJpZ2dlcmVkXHJcbiAgICBhcyBhIHJlc3VsdCBvZiB0aGF0IEFQSSBtZXRob2RzXHJcbioqL1xyXG52YXIgbGF0ZXN0UHVzaGVkUmVwbGFjZWRVcmwgPSBudWxsO1xyXG5cclxuLyoqXHJcbiAgICBIaXN0b3J5IFBvbHlmaWxsXHJcbioqL1xyXG52YXIgaGFzaGJhbmdIaXN0b3J5ID0ge1xyXG4gICAgcHVzaFN0YXRlOiBmdW5jdGlvbiBwdXNoU3RhdGUoc3RhdGUsIHRpdGxlLCB1cmwpIHtcclxuXHJcbiAgICAgICAgLy8gY2xlYW51cCB1cmxcclxuICAgICAgICB1cmwgPSBjYW5ub25pY2FsVXJsKHVybCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gc2F2ZSBuZXcgc3RhdGUgZm9yIHVybFxyXG4gICAgICAgIHN0YXRlID0gY2hlY2tTdGF0ZShzdGF0ZSkgfHwgbnVsbDtcclxuICAgICAgICBpZiAoc3RhdGUgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgLy8gc2F2ZSBzdGF0ZVxyXG4gICAgICAgICAgICBzZXNzaW9uLnN0YXRlcy5wdXNoKHN0YXRlKTtcclxuICAgICAgICAgICAgdmFyIHN1aWQgPSBzZXNzaW9uLnN0YXRlcy5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICAvLyB1cGRhdGUgVVJMIHdpdGggdGhlIHN1aWRcclxuICAgICAgICAgICAgdXJsID0gc2V0U3VpZCh1cmwsIHN1aWQpO1xyXG4gICAgICAgICAgICAvLyBjYWxsIHRvIHBlcnNpc3QgdGhlIHVwZGF0ZWQgc2Vzc2lvblxyXG4gICAgICAgICAgICBwZXJzaXN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxhdGVzdFB1c2hlZFJlcGxhY2VkVXJsID0gdXJsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIHVwZGF0ZSBsb2NhdGlvbiB0byB0cmFjayBoaXN0b3J5OlxyXG4gICAgICAgIGxvY2F0aW9uLmhhc2ggPSAnIyEnICsgdXJsO1xyXG4gICAgfSxcclxuICAgIHJlcGxhY2VTdGF0ZTogZnVuY3Rpb24gcmVwbGFjZVN0YXRlKHN0YXRlLCB0aXRsZSwgdXJsKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gY2xlYW51cCB1cmxcclxuICAgICAgICB1cmwgPSBjYW5ub25pY2FsVXJsKHVybCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gaXQgaGFzIHNhdmVkIHN0YXRlP1xyXG4gICAgICAgIHZhciBzdWlkID0gZ2V0U3VpZCh1cmwpLFxyXG4gICAgICAgICAgICBoYXNPbGRTdGF0ZSA9IHN1aWQgIT09IG51bGw7XHJcblxyXG4gICAgICAgIC8vIHNhdmUgbmV3IHN0YXRlIGZvciB1cmxcclxuICAgICAgICBzdGF0ZSA9IGNoZWNrU3RhdGUoc3RhdGUpIHx8IG51bGw7XHJcbiAgICAgICAgLy8gaXRzIHNhdmVkIGlmIHRoZXJlIGlzIHNvbWV0aGluZyB0byBzYXZlXHJcbiAgICAgICAgLy8gb3Igc29tZXRoaW5nIHRvIGRlc3Ryb3lcclxuICAgICAgICBpZiAoc3RhdGUgIT09IG51bGwgfHwgaGFzT2xkU3RhdGUpIHtcclxuICAgICAgICAgICAgLy8gc2F2ZSBzdGF0ZVxyXG4gICAgICAgICAgICBpZiAoaGFzT2xkU3RhdGUpIHtcclxuICAgICAgICAgICAgICAgIC8vIHJlcGxhY2UgZXhpc3Rpbmcgc3RhdGVcclxuICAgICAgICAgICAgICAgIHNlc3Npb24uc3RhdGVzW3N1aWRdID0gc3RhdGU7XHJcbiAgICAgICAgICAgICAgICAvLyB0aGUgdXJsIHJlbWFpbnMgdGhlIHNhbWVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBzdGF0ZVxyXG4gICAgICAgICAgICAgICAgc2Vzc2lvbi5zdGF0ZXMucHVzaChzdGF0ZSk7XHJcbiAgICAgICAgICAgICAgICBzdWlkID0gc2Vzc2lvbi5zdGF0ZXMubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSBVUkwgd2l0aCB0aGUgc3VpZFxyXG4gICAgICAgICAgICAgICAgdXJsID0gc2V0U3VpZCh1cmwsIHN1aWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGNhbGwgdG8gcGVyc2lzdCB0aGUgdXBkYXRlZCBzZXNzaW9uXHJcbiAgICAgICAgICAgIHBlcnNpc3QoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGF0ZXN0UHVzaGVkUmVwbGFjZWRVcmwgPSB1cmw7XHJcblxyXG4gICAgICAgIC8vIHVwZGF0ZSBsb2NhdGlvbiB0byB0cmFjayBoaXN0b3J5OlxyXG4gICAgICAgIGxvY2F0aW9uLmhhc2ggPSAnIyEnICsgdXJsO1xyXG4gICAgfSxcclxuICAgIGdldCBzdGF0ZSgpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgc3VpZCA9IGdldFN1aWQobG9jYXRpb24uaGFzaCk7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgc3VpZCAhPT0gbnVsbCA/XHJcbiAgICAgICAgICAgIHNlc3Npb24uc3RhdGVzW3N1aWRdIDpcclxuICAgICAgICAgICAgbnVsbFxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG4gICAgZ2V0IGxlbmd0aCgpIHtcclxuICAgICAgICByZXR1cm4gd2luZG93Lmhpc3RvcnkubGVuZ3RoO1xyXG4gICAgfSxcclxuICAgIGdvOiBmdW5jdGlvbiBnbyhvZmZzZXQpIHtcclxuICAgICAgICB3aW5kb3cuaGlzdG9yeS5nbyhvZmZzZXQpO1xyXG4gICAgfSxcclxuICAgIGJhY2s6IGZ1bmN0aW9uIGJhY2soKSB7XHJcbiAgICAgICAgd2luZG93Lmhpc3RvcnkuYmFjaygpO1xyXG4gICAgfSxcclxuICAgIGZvcndhcmQ6IGZ1bmN0aW9uIGZvcndhcmQoKSB7XHJcbiAgICAgICAgd2luZG93Lmhpc3RvcnkuZm9yd2FyZCgpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLy8gQXR0YWNoIGhhc2hjYW5nZSBldmVudCB0byB0cmlnZ2VyIEhpc3RvcnkgQVBJIGV2ZW50ICdwb3BzdGF0ZSdcclxudmFyICR3ID0gJCh3aW5kb3cpO1xyXG4kdy5vbignaGFzaGNoYW5nZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgIFxyXG4gICAgdmFyIHVybCA9IGUub3JpZ2luYWxFdmVudC5uZXdVUkw7XHJcbiAgICB1cmwgPSBjYW5ub25pY2FsVXJsKHVybCk7XHJcbiAgICBcclxuICAgIC8vIEFuIFVSTCBiZWluZyBwdXNoZWQgb3IgcmVwbGFjZWRcclxuICAgIC8vIG11c3QgTk9UIHRyaWdnZXIgcG9wc3RhdGVcclxuICAgIGlmICh1cmwgPT09IGxhdGVzdFB1c2hlZFJlcGxhY2VkVXJsKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIFxyXG4gICAgLy8gZ2V0IHN0YXRlIGZyb20gaGlzdG9yeSBlbnRyeVxyXG4gICAgLy8gZm9yIHRoZSB1cGRhdGVkIFVSTCwgaWYgYW55XHJcbiAgICAvLyAoY2FuIGhhdmUgdmFsdWUgd2hlbiB0cmF2ZXJzaW5nXHJcbiAgICAvLyBoaXN0b3J5KS5cclxuICAgIHZhciBzdWlkID0gZ2V0U3VpZCh1cmwpLFxyXG4gICAgICAgIHN0YXRlID0gbnVsbDtcclxuICAgIFxyXG4gICAgaWYgKHN1aWQgIT09IG51bGwpXHJcbiAgICAgICAgc3RhdGUgPSBzZXNzaW9uLnN0YXRlc1tzdWlkXTtcclxuXHJcbiAgICAkdy50cmlnZ2VyKG5ldyAkLkV2ZW50KCdwb3BzdGF0ZScsIHtcclxuICAgICAgICBzdGF0ZTogc3RhdGVcclxuICAgIH0pLCAnaGFzaGJhbmdIaXN0b3J5Jyk7XHJcbn0pO1xyXG5cclxuLy8gRm9yIEhpc3RvcnlBUEkgY2FwYWJsZSBicm93c2Vycywgd2UgbmVlZFxyXG4vLyB0byBjYXB0dXJlIHRoZSBuYXRpdmUgJ3BvcHN0YXRlJyBldmVudCB0aGF0XHJcbi8vIGdldHMgdHJpZ2dlcmVkIG9uIG91ciBwdXNoL3JlcGxhY2VTdGF0ZSBiZWNhdXNlXHJcbi8vIG9mIHRoZSBsb2NhdGlvbiBjaGFuZ2UsIGJ1dCB0b28gb24gdHJhdmVyc2luZ1xyXG4vLyB0aGUgaGlzdG9yeSAoYmFjay9mb3J3YXJkKS5cclxuLy8gV2Ugd2lsbCBsb2NrIHRoZSBldmVudCBleGNlcHQgd2hlbiBpc1xyXG4vLyB0aGUgb25lIHdlIHRyaWdnZXIuXHJcbi8vXHJcbi8vIE5PVEU6IHRvIHRoaXMgdHJpY2sgdG8gd29yaywgdGhpcyBtdXN0XHJcbi8vIGJlIHRoZSBmaXJzdCBoYW5kbGVyIGF0dGFjaGVkIGZvciB0aGlzXHJcbi8vIGV2ZW50LCBzbyBjYW4gYmxvY2sgYWxsIG90aGVycy5cclxuLy8gQUxURVJOQVRJVkU6IGluc3RlYWQgb2YgdGhpcywgb24gdGhlXHJcbi8vIHB1c2gvcmVwbGFjZVN0YXRlIG1ldGhvZHMgZGV0ZWN0IGlmXHJcbi8vIEhpc3RvcnlBUEkgaXMgbmF0aXZlIHN1cHBvcnRlZCBhbmRcclxuLy8gdXNlIHJlcGxhY2VTdGF0ZSB0aGVyZSByYXRoZXIgdGhhblxyXG4vLyBhIGhhc2ggY2hhbmdlLlxyXG4kdy5vbigncG9wc3RhdGUnLCBmdW5jdGlvbihlLCBzb3VyY2UpIHtcclxuICAgIFxyXG4gICAgLy8gRW5zdXJpbmcgaXMgdGhlIG9uZSB3ZSB0cmlnZ2VyXHJcbiAgICBpZiAoc291cmNlID09PSAnaGFzaGJhbmdIaXN0b3J5JylcclxuICAgICAgICByZXR1cm47XHJcbiAgICBcclxuICAgIC8vIEluIG90aGVyIGNhc2UsIGJsb2NrOlxyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxufSk7XHJcblxyXG4vLyBFeHBvc2UgQVBJXHJcbm1vZHVsZS5leHBvcnRzID0gaGFzaGJhbmdIaXN0b3J5O1xyXG4iLCIvKipcclxuICAgIERlZmF1bHQgYnVpbGQgb2YgdGhlIFNoZWxsIGNvbXBvbmVudC5cclxuICAgIEl0IHJldHVybnMgdGhlIFNoZWxsIGNsYXNzIGFzIGEgbW9kdWxlIHByb3BlcnR5LFxyXG4gICAgc2V0dGluZyB1cCB0aGUgYnVpbHQtaW4gbW9kdWxlcyBhcyBpdHMgZGVwZW5kZW5jaWVzLFxyXG4gICAgYW5kIHRoZSBleHRlcm5hbCAnanF1ZXJ5JyBhbmQgJ2V2ZW50cycgKGZvciB0aGUgRXZlbnRFbWl0dGVyKS5cclxuICAgIEl0IHJldHVybnMgdG9vIHRoZSBidWlsdC1pdCBEb21JdGVtc01hbmFnZXIgY2xhc3MgYXMgYSBwcm9wZXJ0eSBmb3IgY29udmVuaWVuY2UuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgZGVwcyA9IHJlcXVpcmUoJy4vZGVwZW5kZW5jaWVzJyksXHJcbiAgICBEb21JdGVtc01hbmFnZXIgPSByZXF1aXJlKCcuL0RvbUl0ZW1zTWFuYWdlcicpLFxyXG4gICAgcGFyc2VVcmwgPSByZXF1aXJlKCcuL3BhcnNlVXJsJyksXHJcbiAgICBhYnNvbHV0aXplVXJsID0gcmVxdWlyZSgnLi9hYnNvbHV0aXplVXJsJyksXHJcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBsb2FkZXIgPSByZXF1aXJlKCcuL2xvYWRlcicpLFxyXG4gICAgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xyXG5cclxuJC5leHRlbmQoZGVwcywge1xyXG4gICAgcGFyc2VVcmw6IHBhcnNlVXJsLFxyXG4gICAgYWJzb2x1dGl6ZVVybDogYWJzb2x1dGl6ZVVybCxcclxuICAgIGpxdWVyeTogJCxcclxuICAgIGxvYWRlcjogbG9hZGVyLFxyXG4gICAgRXZlbnRFbWl0dGVyOiBFdmVudEVtaXR0ZXJcclxufSk7XHJcblxyXG4vLyBEZXBlbmRlbmNpZXMgYXJlIHJlYWR5LCB3ZSBjYW4gbG9hZCB0aGUgY2xhc3M6XHJcbnZhciBTaGVsbCA9IHJlcXVpcmUoJy4vU2hlbGwnKTtcclxuXHJcbmV4cG9ydHMuU2hlbGwgPSBTaGVsbDtcclxuZXhwb3J0cy5Eb21JdGVtc01hbmFnZXIgPSBEb21JdGVtc01hbmFnZXI7XHJcbiIsIi8qKlxyXG4gICAgTG9hZGVyIHV0aWxpdHkgdG8gbG9hZCBTaGVsbCBpdGVtcyBvbiBkZW1hbmQgd2l0aCBBSkFYXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBcclxuICAgIGJhc2VVcmw6ICcvJyxcclxuICAgIFxyXG4gICAgbG9hZDogZnVuY3Rpb24gbG9hZChyb3V0ZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1NoZWxsIGxvYWRpbmcgb24gZGVtYW5kJywgcm91dGUubmFtZSwgcm91dGUpO1xyXG4gICAgICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiBtb2R1bGUuZXhwb3J0cy5iYXNlVXJsICsgcm91dGUubmFtZSArICcuaHRtbCcsXHJcbiAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2VcclxuICAgICAgICAgICAgICAgIC8vIFdlIGFyZSBsb2FkaW5nIHRoZSBwcm9ncmFtIGFuZCBubyBsb2FkZXIgc2NyZWVuIGluIHBsYWNlLFxyXG4gICAgICAgICAgICAgICAgLy8gc28gYW55IGluIGJldHdlZW4gaW50ZXJhY3Rpb24gd2lsbCBiZSBwcm9ibGVtYXRpYy5cclxuICAgICAgICAgICAgICAgIC8vYXN5bmM6IGZhbHNlXHJcbiAgICAgICAgICAgIH0pLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufTtcclxuIiwiLyoqXHJcbiAgICBwYXJzZVVybCBmdW5jdGlvbiBkZXRlY3RpbmdcclxuICAgIHRoZSBtYWluIHBhcnRzIG9mIHRoZSBVUkwgaW4gYVxyXG4gICAgY29udmVuaWVuY2Ugd2F5IGZvciByb3V0aW5nLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGdldFVybFF1ZXJ5ID0gcmVxdWlyZSgnLi4vZ2V0VXJsUXVlcnknKSxcclxuICAgIGVzY2FwZVJlZ0V4cCA9IHJlcXVpcmUoJy4uL2VzY2FwZVJlZ0V4cCcpO1xyXG5cclxuZnVuY3Rpb24gcGFyc2VVcmwoYmFzZVVybCwgbGluaykge1xyXG5cclxuICAgIGxpbmsgPSBsaW5rIHx8ICcnO1xyXG5cclxuICAgIHZhciByYXdVcmwgPSBsaW5rO1xyXG5cclxuICAgIC8vIGhhc2hiYW5nIHN1cHBvcnQ6IHJlbW92ZSB0aGUgIyEgb3Igc2luZ2xlICMgYW5kIHVzZSB0aGUgcmVzdCBhcyB0aGUgbGlua1xyXG4gICAgbGluayA9IGxpbmsucmVwbGFjZSgvXiMhLywgJycpLnJlcGxhY2UoL14jLywgJycpO1xyXG4gICAgXHJcbiAgICAvLyByZW1vdmUgb3B0aW9uYWwgaW5pdGlhbCBzbGFzaCBvciBkb3Qtc2xhc2hcclxuICAgIGxpbmsgPSBsaW5rLnJlcGxhY2UoL15cXC98XlxcLlxcLy8sICcnKTtcclxuXHJcbiAgICAvLyBVUkwgUXVlcnkgYXMgYW4gb2JqZWN0LCBlbXB0eSBvYmplY3QgaWYgbm8gcXVlcnlcclxuICAgIHZhciBxdWVyeSA9IGdldFVybFF1ZXJ5KGxpbmsgfHwgJz8nKTtcclxuXHJcbiAgICAvLyByZW1vdmUgcXVlcnkgZnJvbSB0aGUgcmVzdCBvZiBVUkwgdG8gcGFyc2VcclxuICAgIGxpbmsgPSBsaW5rLnJlcGxhY2UoL1xcPy4qJC8sICcnKTtcclxuXHJcbiAgICAvLyBSZW1vdmUgdGhlIGJhc2VVcmwgdG8gZ2V0IHRoZSBhcHAgYmFzZS5cclxuICAgIHZhciBwYXRoID0gbGluay5yZXBsYWNlKG5ldyBSZWdFeHAoJ14nICsgZXNjYXBlUmVnRXhwKGJhc2VVcmwpLCAnaScpLCAnJyk7XHJcblxyXG4gICAgLy8gR2V0IGZpcnN0IHNlZ21lbnQgb3IgcGFnZSBuYW1lIChhbnl0aGluZyB1bnRpbCBhIHNsYXNoIG9yIGV4dGVuc2lvbiBiZWdnaW5pbmcpXHJcbiAgICB2YXIgbWF0Y2ggPSAvXlxcLz8oW15cXC9cXC5dKylbXlxcL10qKFxcLy4qKSokLy5leGVjKHBhdGgpO1xyXG5cclxuICAgIHZhciBwYXJzZWQgPSB7XHJcbiAgICAgICAgcm9vdDogdHJ1ZSxcclxuICAgICAgICBuYW1lOiBudWxsLFxyXG4gICAgICAgIHNlZ21lbnRzOiBudWxsLFxyXG4gICAgICAgIHBhdGg6IG51bGwsXHJcbiAgICAgICAgdXJsOiByYXdVcmwsXHJcbiAgICAgICAgcXVlcnk6IHF1ZXJ5XHJcbiAgICB9O1xyXG5cclxuICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgIHBhcnNlZC5yb290ID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKG1hdGNoWzFdKSB7XHJcbiAgICAgICAgICAgIHBhcnNlZC5uYW1lID0gbWF0Y2hbMV07XHJcblxyXG4gICAgICAgICAgICBpZiAobWF0Y2hbMl0pIHtcclxuICAgICAgICAgICAgICAgIHBhcnNlZC5wYXRoID0gbWF0Y2hbMl07XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQuc2VnbWVudHMgPSBtYXRjaFsyXS5yZXBsYWNlKC9eXFwvLywgJycpLnNwbGl0KCcvJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQucGF0aCA9ICcvJztcclxuICAgICAgICAgICAgICAgIHBhcnNlZC5zZWdtZW50cyA9IFtdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBwYXJzZWQ7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gcGFyc2VVcmw7IiwiLyoqXHJcbiAgICBzYW5pdGl6ZVVybCB1dGlsaXR5IHRoYXQgZW5zdXJlc1xyXG4gICAgdGhhdCBwcm9ibGVtYXRpYyBwYXJ0cyBnZXQgcmVtb3ZlZC5cclxuICAgIFxyXG4gICAgQXMgZm9yIG5vdyBpdCBkb2VzOlxyXG4gICAgLSByZW1vdmVzIHBhcmVudCBkaXJlY3Rvcnkgc3ludGF4XHJcbiAgICAtIHJlbW92ZXMgZHVwbGljYXRlZCBzbGFzaGVzXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5mdW5jdGlvbiBzYW5pdGl6ZVVybCh1cmwpIHtcclxuICAgIHJldHVybiB1cmwucmVwbGFjZSgvXFwuezIsfS9nLCAnJykucmVwbGFjZSgvXFwvezIsfS9nLCAnLycpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNhbml0aXplVXJsOyIsIi8qKiBcclxuICAgIEFwcE1vZGVsIGV4dGVuc2lvbixcclxuICAgIGZvY3VzZWQgb24gdGhlIEFjY291bnQgcmVsYXRlZCBBUElzOlxyXG4gICAgLSBsb2dpblxyXG4gICAgLSBsb2dvdXRcclxuICAgIC0gc2lnbnVwXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgbG9jYWxmb3JhZ2UgPSByZXF1aXJlKCdsb2NhbGZvcmFnZScpO1xyXG5cclxuZXhwb3J0cy5wbHVnSW4gPSBmdW5jdGlvbiAoQXBwTW9kZWwpIHtcclxuICAgIC8qKlxyXG4gICAgICAgIFRyeSB0byBwZXJmb3JtIGFuIGF1dG9tYXRpYyBsb2dpbiBpZiB0aGVyZSBpcyBhIGxvY2FsXHJcbiAgICAgICAgY29weSBvZiBjcmVkZW50aWFscyB0byB1c2Ugb24gdGhhdCxcclxuICAgICAgICBjYWxsaW5nIHRoZSBsb2dpbiBtZXRob2QgdGhhdCBzYXZlIHRoZSB1cGRhdGVkXHJcbiAgICAgICAgZGF0YSBhbmQgcHJvZmlsZS5cclxuICAgICoqL1xyXG4gICAgQXBwTW9kZWwucHJvdG90eXBlLnRyeUxvZ2luID0gZnVuY3Rpb24gdHJ5TG9naW4oKSB7XHJcbiAgICAgICAgLy8gR2V0IHNhdmVkIGNyZWRlbnRpYWxzXHJcbiAgICAgICAgcmV0dXJuIGxvY2FsZm9yYWdlLmdldEl0ZW0oJ2NyZWRlbnRpYWxzJylcclxuICAgICAgICAudGhlbihmdW5jdGlvbihjcmVkZW50aWFscykge1xyXG4gICAgICAgICAgICAvLyBJZiB3ZSBoYXZlIG9uZXMsIHRyeSB0byBsb2ctaW5cclxuICAgICAgICAgICAgaWYgKGNyZWRlbnRpYWxzKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBBdHRlbXB0IGxvZ2luIHdpdGggdGhhdFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9naW4oXHJcbiAgICAgICAgICAgICAgICAgICAgY3JlZGVudGlhbHMudXNlcm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgY3JlZGVudGlhbHMucGFzc3dvcmRcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHNhdmVkIGNyZWRlbnRpYWxzJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAgICBQZXJmb3JtcyBhIGxvZ2luIGF0dGVtcHQgd2l0aCB0aGUgQVBJIGJ5IHVzaW5nXHJcbiAgICAgICAgdGhlIHByb3ZpZGVkIGNyZWRlbnRpYWxzLlxyXG4gICAgKiovXHJcbiAgICBBcHBNb2RlbC5wcm90b3R5cGUubG9naW4gPSBmdW5jdGlvbiBsb2dpbih1c2VybmFtZSwgcGFzc3dvcmQpIHtcclxuXHJcbiAgICAgICAgLy8gUmVzZXQgdGhlIGV4dHJhIGhlYWRlcnMgdG8gYXR0ZW1wdCB0aGUgbG9naW5cclxuICAgICAgICB0aGlzLnJlc3QuZXh0cmFIZWFkZXJzID0gbnVsbDtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5wb3N0KCdsb2dpbicsIHtcclxuICAgICAgICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxyXG4gICAgICAgICAgICBwYXNzd29yZDogcGFzc3dvcmQsXHJcbiAgICAgICAgICAgIHJldHVyblByb2ZpbGU6IHRydWVcclxuICAgICAgICB9KS50aGVuKHBlcmZvcm1Mb2NhbExvZ2luKHRoaXMsIHVzZXJuYW1lLCBwYXNzd29yZCkpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAgICBQZXJmb3JtcyBhIGxvZ291dCwgcmVtb3ZpbmcgY2FjaGVkIGNyZWRlbnRpYWxzXHJcbiAgICAgICAgYW5kIHByb2ZpbGUgc28gdGhlIGFwcCBjYW4gYmUgZmlsbGVkIHVwIHdpdGhcclxuICAgICAgICBuZXcgdXNlciBpbmZvcm1hdGlvbi5cclxuICAgICAgICBJdCBjYWxscyB0byB0aGUgQVBJIGxvZ291dCBjYWxsIHRvbywgdG8gcmVtb3ZlXHJcbiAgICAgICAgYW55IHNlcnZlci1zaWRlIHNlc3Npb24gYW5kIG5vdGlmaWNhdGlvblxyXG4gICAgICAgIChyZW1vdmVzIHRoZSBjb29raWUgdG9vLCBmb3IgYnJvd3NlciBlbnZpcm9ubWVudFxyXG4gICAgICAgIHRoYXQgbWF5IHVzZSBpdCkuXHJcbiAgICAqKi9cclxuICAgIC8vIEZVVFVSRTogVE9SRVZJRVcgaWYgdGhlIC9sb2dvdXQgY2FsbCBjYW4gYmUgcmVtb3ZlZC5cclxuICAgIC8vIFRPRE86IG11c3QgcmVtb3ZlIGFsbCB0aGUgbG9jYWxseSBzYXZlZC9jYWNoZWQgZGF0YVxyXG4gICAgLy8gcmVsYXRlZCB0byB0aGUgdXNlcj9cclxuICAgIEFwcE1vZGVsLnByb3RvdHlwZS5sb2dvdXQgPSBmdW5jdGlvbiBsb2dvdXQoKSB7XHJcblxyXG4gICAgICAgIC8vIExvY2FsIGFwcCBjbG9zZSBzZXNzaW9uXHJcbiAgICAgICAgdGhpcy5yZXN0LmV4dHJhSGVhZGVycyA9IG51bGw7XHJcbiAgICAgICAgbG9jYWxmb3JhZ2UucmVtb3ZlSXRlbSgnY3JlZGVudGlhbHMnKTtcclxuICAgICAgICBsb2NhbGZvcmFnZS5yZW1vdmVJdGVtKCdwcm9maWxlJyk7XHJcblxyXG4gICAgICAgIC8vIERvbid0IG5lZWQgdG8gd2FpdCB0aGUgcmVzdWx0IG9mIHRoZSBSRVNUIG9wZXJhdGlvblxyXG4gICAgICAgIHRoaXMucmVzdC5wb3N0KCdsb2dvdXQnKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAgICBBdHRlbXB0cyB0byBjcmVhdGUgYSB1c2VyIGFjY291bnQsIGdldHRpbmcgbG9nZ2VkXHJcbiAgICAgICAgaWYgc3VjY2Vzc2Z1bGx5IGxpa2Ugd2hlbiBkb2luZyBhIGxvZ2luIGNhbGwuXHJcbiAgICAqKi9cclxuICAgIEFwcE1vZGVsLnByb3RvdHlwZS5zaWdudXAgPSBmdW5jdGlvbiBzaWdudXAodXNlcm5hbWUsIHBhc3N3b3JkLCBwcm9maWxlVHlwZSkge1xyXG5cclxuICAgICAgICAvLyBSZXNldCB0aGUgZXh0cmEgaGVhZGVycyB0byBhdHRlbXB0IHRoZSBzaWdudXBcclxuICAgICAgICB0aGlzLnJlc3QuZXh0cmFIZWFkcmVzID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gVGhlIHJlc3VsdCBpcyB0aGUgc2FtZSBhcyBpbiBhIGxvZ2luLCBhbmRcclxuICAgICAgICAvLyB3ZSBkbyB0aGUgc2FtZSBhcyB0aGVyZSB0byBnZXQgdGhlIHVzZXIgbG9nZ2VkXHJcbiAgICAgICAgLy8gb24gdGhlIGFwcCBvbiBzaWduLXVwIHN1Y2Nlc3MuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5wb3N0KCdzaWdudXA/dXRtX3NvdXJjZT1hcHAnLCB7XHJcbiAgICAgICAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcclxuICAgICAgICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkLFxyXG4gICAgICAgICAgICBwcm9maWxlVHlwZTogcHJvZmlsZVR5cGUsXHJcbiAgICAgICAgICAgIHJldHVyblByb2ZpbGU6IHRydWVcclxuICAgICAgICB9KS50aGVuKHBlcmZvcm1Mb2NhbExvZ2luKHRoaXMsIHVzZXJuYW1lLCBwYXNzd29yZCkpO1xyXG4gICAgfTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIHBlcmZvcm1Mb2NhbExvZ2luKHRoaXNBcHBNb2RlbCwgdXNlcm5hbWUsIHBhc3N3b3JkKSB7XHJcbiAgICBcclxuICAgIHJldHVybiBmdW5jdGlvbihsb2dnZWQpIHtcclxuICAgICAgICAvLyB1c2UgYXV0aG9yaXphdGlvbiBrZXkgZm9yIGVhY2hcclxuICAgICAgICAvLyBuZXcgUmVzdCByZXF1ZXN0XHJcbiAgICAgICAgdGhpc0FwcE1vZGVsLnJlc3QuZXh0cmFIZWFkZXJzID0ge1xyXG4gICAgICAgICAgICBhbHU6IGxvZ2dlZC51c2VySUQsXHJcbiAgICAgICAgICAgIGFsazogbG9nZ2VkLmF1dGhLZXlcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBhc3luYyBsb2NhbCBzYXZlLCBkb24ndCB3YWl0XHJcbiAgICAgICAgbG9jYWxmb3JhZ2Uuc2V0SXRlbSgnY3JlZGVudGlhbHMnLCB7XHJcbiAgICAgICAgICAgIHVzZXJJRDogbG9nZ2VkLnVzZXJJRCxcclxuICAgICAgICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxyXG4gICAgICAgICAgICBwYXNzd29yZDogcGFzc3dvcmQsXHJcbiAgICAgICAgICAgIGF1dGhLZXk6IGxvZ2dlZC5hdXRoS2V5XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gSU1QT1JUQU5UOiBMb2NhbCBuYW1lIGtlcHQgaW4gc3luYyB3aXRoIHNldC11cCBhdCBBcHBNb2RlbC51c2VyUHJvZmlsZVxyXG4gICAgICAgIGxvY2FsZm9yYWdlLnNldEl0ZW0oJ3Byb2ZpbGUnLCBsb2dnZWQucHJvZmlsZSk7XHJcblxyXG4gICAgICAgIC8vIFNldCB1c2VyIGRhdGFcclxuICAgICAgICB0aGlzQXBwTW9kZWwudXNlcigpLm1vZGVsLnVwZGF0ZVdpdGgobG9nZ2VkLnByb2ZpbGUpO1xyXG5cclxuICAgICAgICByZXR1cm4gbG9nZ2VkO1xyXG4gICAgfTtcclxufVxyXG4iLCIvKiogQXBwTW9kZWwgZXh0ZW5zaW9uLFxyXG4gICAgZm9jdXNlZCBvbiB0aGUgRXZlbnRzIEFQSVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG52YXIgQ2FsZW5kYXJFdmVudCA9IHJlcXVpcmUoJy4uL21vZGVscy9DYWxlbmRhckV2ZW50JyksXHJcbiAgICBhcGlIZWxwZXIgPSByZXF1aXJlKCcuLi91dGlscy9hcGlIZWxwZXInKTtcclxuXHJcbmV4cG9ydHMucGx1Z0luID0gZnVuY3Rpb24gKEFwcE1vZGVsKSB7XHJcbiAgICBcclxuICAgIGFwaUhlbHBlci5kZWZpbmVDcnVkQXBpRm9yUmVzdCh7XHJcbiAgICAgICAgZXh0ZW5kZWRPYmplY3Q6IEFwcE1vZGVsLnByb3RvdHlwZSxcclxuICAgICAgICBNb2RlbDogQ2FsZW5kYXJFdmVudCxcclxuICAgICAgICBtb2RlbE5hbWU6ICdDYWxlbmRhckV2ZW50JyxcclxuICAgICAgICBtb2RlbExpc3ROYW1lOiAnQ2FsZW5kYXJFdmVudHMnLFxyXG4gICAgICAgIG1vZGVsVXJsOiAnZXZlbnRzJyxcclxuICAgICAgICBpZFByb3BlcnR5TmFtZTogJ2NhbGVuZGFyRXZlbnRJRCdcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvKiogIyBBUElcclxuICAgICAgICBBcHBNb2RlbC5wcm90b3R5cGUuZ2V0RXZlbnRzOjpcclxuICAgICAgICBAcGFyYW0ge29iamVjdH0gZmlsdGVyczoge1xyXG4gICAgICAgICAgICBzdGFydDogRGF0ZSxcclxuICAgICAgICAgICAgZW5kOiBEYXRlLFxyXG4gICAgICAgICAgICB0eXBlczogWzMsIDVdIC8vIFtvcHRpb25hbF0gTGlzdCBFdmVudFR5cGVzSURzXHJcbiAgICAgICAgfVxyXG4gICAgICAgIC0tLVxyXG4gICAgICAgIEFwcE1vZGVsLnByb3RvdHlwZS5nZXRFdmVudFxyXG4gICAgICAgIC0tLVxyXG4gICAgICAgIEFwcE1vZGVsLnByb3RvdHlwZS5wdXRFdmVudFxyXG4gICAgICAgIC0tLVxyXG4gICAgICAgIEFwcE1vZGVsLnByb3RvdHlwZS5wb3N0RXZlbnRcclxuICAgICAgICAtLS1cclxuICAgICAgICBBcHBNb2RlbC5wcm90b3R5cGUuZGVsRXZlbnRcclxuICAgICAgICAtLS1cclxuICAgICAgICBBcHBNb2RlbC5wcm90b3R5cGUuc2V0RXZlbnRcclxuICAgICoqL1xyXG59OyIsIi8qKlxyXG4gICAgTW9kZWwgQVBJIHRvIG1hbmFnZSB0aGUgY29sbGVjdGlvbiBvZiBKb2IgVGl0bGVzIGFzc2lnbmVkXHJcbiAgICB0byB0aGUgY3VycmVudCB1c2VyIGFuZCBpdHMgd29ya2luZyBkYXRhLlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuZXhwb3J0cy5wbHVnSW4gPSBmdW5jdGlvbiAoQXBwTW9kZWwpIHtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgR2V0IHRoZSBjb21wbGV0ZSBsaXN0IG9mIFVzZXJKb2JUaXRsZSBmb3JcclxuICAgICAgICBhbGwgdGhlIEpvYlRpdGxlcyBhc3NpZ25lZCB0byB0aGUgY3VycmVudCB1c2VyXHJcbiAgICAqKi9cclxuICAgIEFwcE1vZGVsLnByb3RvdHlwZS5nZXRVc2VySm9iUHJvZmlsZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBUT0RPXHJcbiAgICAgICAgLy8gVGVzdCBkYXRhXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShcclxuICAgICAgICAgICAgW11cclxuICAgICAgICApO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgR2V0IGEgVXNlckpvYlRpdGxlIHJlY29yZCBmb3IgdGhlIGdpdmVuXHJcbiAgICAgICAgSm9iVGl0bGVJRCBhbmQgdGhlIGN1cnJlbnQgdXNlci5cclxuICAgICoqL1xyXG4gICAgQXBwTW9kZWwucHJvdG90eXBlLmdldFVzZXJKb2JUaXRsZSA9IGZ1bmN0aW9uIChqb2JUaXRsZUlEKSB7XHJcbiAgICAgICAgLy8gVE9ET1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoam9iVGl0bGVJRCk7XHJcbiAgICB9O1xyXG59O1xyXG4iLCIvKiogQm9va2luZ3NcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBCb29raW5nID0gcmVxdWlyZSgnLi4vbW9kZWxzL0Jvb2tpbmcnKSxcclxuLy8gIGFwaUhlbHBlciA9IHJlcXVpcmUoJy4uL3V0aWxzL2FwaUhlbHBlcicpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcblxyXG5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShhcHBNb2RlbCkge1xyXG5cclxuICAgIHZhciBhcGkgPSB7XHJcbiAgICAgICAgcmVtb3RlOiB7XHJcbiAgICAgICAgICAgIHJlc3Q6IGFwcE1vZGVsLnJlc3QsXHJcbiAgICAgICAgICAgIGdldEJvb2tpbmdzOiBmdW5jdGlvbihmaWx0ZXJzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5nZXQoJ2Jvb2tpbmdzJywgZmlsdGVycylcclxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJhd0l0ZW1zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJhd0l0ZW1zICYmIHJhd0l0ZW1zLm1hcChmdW5jdGlvbihyYXdJdGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQm9va2luZyhyYXdJdGVtKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuLypcclxuICAgIGFwaUhlbHBlci5kZWZpbmVDcnVkQXBpRm9yUmVzdCh7XHJcbiAgICAgICAgZXh0ZW5kZWRPYmplY3Q6IGFwaS5yZW1vdGUsXHJcbiAgICAgICAgTW9kZWw6IEJvb2tpbmcsXHJcbiAgICAgICAgbW9kZWxOYW1lOiAnQm9va2luZycsXHJcbiAgICAgICAgbW9kZWxMaXN0TmFtZTogJ0Jvb2tpbmdzJyxcclxuICAgICAgICBtb2RlbFVybDogJ2Jvb2tpbmdzJyxcclxuICAgICAgICBpZFByb3BlcnR5TmFtZTogJ2Jvb2tpbmdJRCdcclxuICAgIH0pOyovXHJcblxyXG4gICAgdmFyIGNhY2hlQnlEYXRlID0ge307XHJcblxyXG4gICAgYXBpLmdldEJvb2tpbmdzQnlEYXRlID0gZnVuY3Rpb24gZ2V0Qm9va2luZ3NCeURhdGUoZGF0ZSkge1xyXG4gICAgICAgIHZhciBkYXRlS2V5ID0gbW9tZW50KGRhdGUpLmZvcm1hdCgnWVlZWU1NREQnKTtcclxuICAgICAgICBpZiAoY2FjaGVCeURhdGUuaGFzT3duUHJvcGVydHkoZGF0ZUtleSkpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2FjaGVCeURhdGVbZGF0ZUtleV0pO1xyXG5cclxuICAgICAgICAgICAgLy8gVE9ETyBsYXp5IGxvYWQsIG9uIGJhY2tncm91bmQsIGZvciBzeW5jaHJvbml6YXRpb25cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFRPRE8gY2hlY2sgbG9jYWxmb3JhZ2UgY29weSBmaXJzdFxyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3RlIGxvYWRpbmcgZGF0YVxyXG4gICAgICAgICAgICByZXR1cm4gYXBpLnJlbW90ZS5nZXRCb29raW5ncyh7XHJcbiAgICAgICAgICAgICAgICBzdGFydDogZGF0ZSxcclxuICAgICAgICAgICAgICAgIGVuZDogbW9tZW50KGRhdGUpLmFkZCgxLCAnZGF5cycpLnRvRGF0ZSgpXHJcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24oYm9va2luZ3MpIHtcclxuICAgICAgICAgICAgICAgIC8vIFRPRE8gbG9jYWxmb3JhZ2UgY29weSBvZiBbZGF0ZUtleV09Ym9va2luZ3NcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBQdXQgaW4gY2FjaGUgKHRoZXkgYXJlIGFscmVhZHkgbW9kZWwgaW5zdGFuY2VzKVxyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IGtvLm9ic2VydmFibGVBcnJheShib29raW5ncyk7XHJcbiAgICAgICAgICAgICAgICBjYWNoZUJ5RGF0ZVtkYXRlS2V5XSA9IGFycjtcclxuICAgICAgICAgICAgICAgIC8vIFJldHVybiB0aGUgb2JzZXJ2YWJsZSBhcnJheVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFycjtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGFwaTtcclxufTtcclxuIiwiLyoqIEV2ZW50c1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIENhbGVuZGFyRXZlbnQgPSByZXF1aXJlKCcuLi9tb2RlbHMvQ2FsZW5kYXJFdmVudCcpLFxyXG4vLyAgYXBpSGVscGVyID0gcmVxdWlyZSgnLi4vdXRpbHMvYXBpSGVscGVyJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxuXHJcbmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKGFwcE1vZGVsKSB7XHJcblxyXG4gICAgdmFyIGFwaSA9IHtcclxuICAgICAgICByZW1vdGU6IHtcclxuICAgICAgICAgICAgcmVzdDogYXBwTW9kZWwucmVzdCxcclxuICAgICAgICAgICAgZ2V0Q2FsZW5kYXJFdmVudHM6IGZ1bmN0aW9uKGZpbHRlcnMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgnZXZlbnRzJywgZmlsdGVycylcclxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJhd0l0ZW1zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJhd0l0ZW1zICYmIHJhd0l0ZW1zLm1hcChmdW5jdGlvbihyYXdJdGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQ2FsZW5kYXJFdmVudChyYXdJdGVtKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvKmFwaUhlbHBlci5kZWZpbmVDcnVkQXBpRm9yUmVzdCh7XHJcbiAgICAgICAgZXh0ZW5kZWRPYmplY3Q6IGFwaS5yZW1vdGUsXHJcbiAgICAgICAgTW9kZWw6IENhbGVuZGFyRXZlbnQsXHJcbiAgICAgICAgbW9kZWxOYW1lOiAnQ2FsZW5kYXJFdmVudCcsXHJcbiAgICAgICAgbW9kZWxMaXN0TmFtZTogJ0NhbGVuZGFyRXZlbnRzJyxcclxuICAgICAgICBtb2RlbFVybDogJ2V2ZW50cycsXHJcbiAgICAgICAgaWRQcm9wZXJ0eU5hbWU6ICdjYWxlbmRhckV2ZW50SUQnXHJcbiAgICB9KTsqL1xyXG5cclxuICAgIHZhciBjYWNoZUJ5RGF0ZSA9IHt9O1xyXG5cclxuICAgIGFwaS5nZXRFdmVudHNCeURhdGUgPSBmdW5jdGlvbiBnZXRFdmVudHNCeURhdGUoZGF0ZSkge1xyXG4gICAgICAgIHZhciBkYXRlS2V5ID0gbW9tZW50KGRhdGUpLmZvcm1hdCgnWVlZWU1NREQnKTtcclxuICAgICAgICBpZiAoY2FjaGVCeURhdGUuaGFzT3duUHJvcGVydHkoZGF0ZUtleSkpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2FjaGVCeURhdGVbZGF0ZUtleV0pO1xyXG5cclxuICAgICAgICAgICAgLy8gVE9ETyBsYXp5IGxvYWQsIG9uIGJhY2tncm91bmQsIGZvciBzeW5jaHJvbml6YXRpb25cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFRPRE8gY2hlY2sgbG9jYWxmb3JhZ2UgY29weSBmaXJzdFxyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3RlIGxvYWRpbmcgZGF0YVxyXG4gICAgICAgICAgICByZXR1cm4gYXBpLnJlbW90ZS5nZXRDYWxlbmRhckV2ZW50cyh7XHJcbiAgICAgICAgICAgICAgICBzdGFydDogZGF0ZSxcclxuICAgICAgICAgICAgICAgIGVuZDogbW9tZW50KGRhdGUpLmFkZCgxLCAnZGF5cycpLnRvRGF0ZSgpXHJcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24oZXZlbnRzKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPIGxvY2FsZm9yYWdlIGNvcHkgb2YgW2RhdGVLZXldPWJvb2tpbmdzXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUHV0IGluIGNhY2hlICh0aGV5IGFyZSBhbHJlYWR5IG1vZGVsIGluc3RhbmNlcylcclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSBrby5vYnNlcnZhYmxlQXJyYXkoZXZlbnRzKTtcclxuICAgICAgICAgICAgICAgIGNhY2hlQnlEYXRlW2RhdGVLZXldID0gYXJyO1xyXG4gICAgICAgICAgICAgICAgLy8gUmV0dXJuIHRoZSBvYnNlcnZhYmxlIGFycmF5XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICByZXR1cm4gYXBpO1xyXG59O1xyXG4iLCIvKiogQ2FsZW5kYXIgU3luY2luZyBhcHAgbW9kZWxcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBDYWxlbmRhclN5bmNpbmcgPSByZXF1aXJlKCcuLi9tb2RlbHMvQ2FsZW5kYXJTeW5jaW5nJyksXHJcbiAgICBSZW1vdGVNb2RlbCA9IHJlcXVpcmUoJy4uL3V0aWxzL1JlbW90ZU1vZGVsJyk7XHJcblxyXG5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShhcHBNb2RlbCkge1xyXG4gICAgdmFyIHJlbSA9IG5ldyBSZW1vdGVNb2RlbCh7XHJcbiAgICAgICAgZGF0YTogbmV3IENhbGVuZGFyU3luY2luZygpLFxyXG4gICAgICAgIHR0bDogeyBtaW51dGVzOiAxIH0sXHJcbiAgICAgICAgbG9jYWxTdG9yYWdlTmFtZTogJ2NhbGVuZGFyU3luY2luZycsXHJcbiAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uIGZldGNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5nZXQoJ2NhbGVuZGFyLXN5bmNpbmcnKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1c2g6IGZ1bmN0aW9uIHB1c2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LnB1dCgnY2FsZW5kYXItc3luY2luZycsIHRoaXMuZGF0YS5tb2RlbC50b1BsYWluT2JqZWN0KCkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBFeHRlbmRpbmcgd2l0aCB0aGUgc3BlY2lhbCBBUEkgbWV0aG9kICdyZXNldEV4cG9ydFVybCdcclxuICAgIHJlbS5pc1Jlc2V0aW5nID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcbiAgICByZW0ucmVzZXRFeHBvcnRVcmwgPSBmdW5jdGlvbiByZXNldEV4cG9ydFVybCgpIHtcclxuICAgICAgICBcclxuICAgICAgICByZW0uaXNSZXNldGluZyh0cnVlKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QucG9zdCgnY2FsZW5kYXItc3luY2luZy9yZXNldC1leHBvcnQtdXJsJylcclxuICAgICAgICAudGhlbihmdW5jdGlvbih1cGRhdGVkU3luY1NldHRpbmdzKSB7XHJcbiAgICAgICAgICAgIC8vIFVwZGF0aW5nIHRoZSBjYWNoZWQgZGF0YVxyXG4gICAgICAgICAgICByZW0uZGF0YS5tb2RlbC51cGRhdGVXaXRoKHVwZGF0ZWRTeW5jU2V0dGluZ3MpO1xyXG4gICAgICAgICAgICByZW0uaXNSZXNldGluZyhmYWxzZSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdXBkYXRlZFN5bmNTZXR0aW5ncztcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHJlbTtcclxufTtcclxuIiwiLyoqIEhvbWUgQWRkcmVzc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIEFkZHJlc3MgPSByZXF1aXJlKCcuLi9tb2RlbHMvQWRkcmVzcycpO1xyXG5cclxudmFyIFJlbW90ZU1vZGVsID0gcmVxdWlyZSgnLi4vdXRpbHMvUmVtb3RlTW9kZWwnKTtcclxuXHJcbmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKGFwcE1vZGVsKSB7XHJcbiAgICByZXR1cm4gbmV3IFJlbW90ZU1vZGVsKHtcclxuICAgICAgICBkYXRhOiBuZXcgQWRkcmVzcygpLFxyXG4gICAgICAgIHR0bDogeyBtaW51dGVzOiAxIH0sXHJcbiAgICAgICAgbG9jYWxTdG9yYWdlTmFtZTogJ2hvbWVBZGRyZXNzJyxcclxuICAgICAgICBmZXRjaDogZnVuY3Rpb24gZmV0Y2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgnYWRkcmVzc2VzL2hvbWUnKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1c2g6IGZ1bmN0aW9uIHB1c2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LnB1dCgnYWRkcmVzc2VzL2hvbWUnLCB0aGlzLmRhdGEubW9kZWwudG9QbGFpbk9iamVjdCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqIEFwcE1vZGVsLCBjZW50cmFsaXplcyBhbGwgdGhlIGRhdGEgZm9yIHRoZSBhcHAsXHJcbiAgICBjYWNoaW5nIGFuZCBzaGFyaW5nIGRhdGEgYWNyb3NzIGFjdGl2aXRpZXMgYW5kIHBlcmZvcm1pbmdcclxuICAgIHJlcXVlc3RzXHJcbioqL1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuLi9tb2RlbHMvTW9kZWwnKSxcclxuICAgIFJlc3QgPSByZXF1aXJlKCcuLi91dGlscy9SZXN0JyksXHJcbiAgICBsb2NhbGZvcmFnZSA9IHJlcXVpcmUoJ2xvY2FsZm9yYWdlJyk7XHJcblxyXG5mdW5jdGlvbiBBcHBNb2RlbCgpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy51c2VyUHJvZmlsZSA9IHJlcXVpcmUoJy4vQXBwTW9kZWwudXNlclByb2ZpbGUnKS5jcmVhdGUodGhpcyk7XHJcbiAgICAvLyBOT1RFOiBBbGlhcyBmb3IgdGhlIHVzZXIgZGF0YVxyXG4gICAgLy8gVE9ETzpUT1JFVklFVyBpZiBjb250aW51ZSB0byBtYWtlcyBzZW5zZSB0byBrZWVwIHRoaXMgJ3VzZXIoKScgYWxpYXMsIGRvY3VtZW50XHJcbiAgICAvLyB3aGVyZSBpcyB1c2VkIGFuZCB3aHkgaXMgcHJlZmVycmVkIHRvIHRoZSBjYW5vbmljYWwgd2F5LlxyXG4gICAgdGhpcy51c2VyID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudXNlclByb2ZpbGUuZGF0YTtcclxuICAgIH0sIHRoaXMpO1xyXG5cclxuICAgIHRoaXMuc2NoZWR1bGluZ1ByZWZlcmVuY2VzID0gcmVxdWlyZSgnLi9BcHBNb2RlbC5zY2hlZHVsaW5nUHJlZmVyZW5jZXMnKS5jcmVhdGUodGhpcyk7XHJcbiAgICB0aGlzLmNhbGVuZGFyU3luY2luZyA9IHJlcXVpcmUoJy4vQXBwTW9kZWwuY2FsZW5kYXJTeW5jaW5nJykuY3JlYXRlKHRoaXMpO1xyXG4gICAgdGhpcy5zaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUgPSByZXF1aXJlKCcuL0FwcE1vZGVsLnNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZScpLmNyZWF0ZSh0aGlzKTtcclxuICAgIHRoaXMubWFya2V0cGxhY2VQcm9maWxlID0gcmVxdWlyZSgnLi9BcHBNb2RlbC5tYXJrZXRwbGFjZVByb2ZpbGUnKS5jcmVhdGUodGhpcyk7XHJcbiAgICB0aGlzLmhvbWVBZGRyZXNzID0gcmVxdWlyZSgnLi9BcHBNb2RlbC5ob21lQWRkcmVzcycpLmNyZWF0ZSh0aGlzKTtcclxuICAgIHRoaXMucHJpdmFjeVNldHRpbmdzID0gcmVxdWlyZSgnLi9BcHBNb2RlbC5wcml2YWN5U2V0dGluZ3MnKS5jcmVhdGUodGhpcyk7XHJcbiAgICB0aGlzLmJvb2tpbmdzID0gcmVxdWlyZSgnLi9BcHBNb2RlbC5ib29raW5ncycpLmNyZWF0ZSh0aGlzKTtcclxuICAgIHRoaXMuY2FsZW5kYXJFdmVudHMgPSByZXF1aXJlKCcuL0FwcE1vZGVsLmNhbGVuZGFyRXZlbnRzJykuY3JlYXRlKHRoaXMpO1xyXG59XHJcblxyXG5yZXF1aXJlKCcuL0FwcE1vZGVsLWFjY291bnQnKS5wbHVnSW4oQXBwTW9kZWwpO1xyXG5cclxuLyoqXHJcbiAgICBMb2FkIGNyZWRlbnRpYWxzIGZyb20gdGhlIGxvY2FsIHN0b3JhZ2UsIHdpdGhvdXQgZXJyb3IgaWYgdGhlcmUgaXMgbm90aGluZ1xyXG4gICAgc2F2ZWQuIElmIGxvYWQgcHJvZmlsZSBkYXRhIHRvbywgcGVyZm9ybWluZyBhbiB0cnlMb2dpbiBpZiBubyBsb2NhbCBkYXRhLlxyXG4qKi9cclxuQXBwTW9kZWwucHJvdG90eXBlLmxvYWRMb2NhbENyZWRlbnRpYWxzID0gZnVuY3Rpb24gbG9hZExvY2FsQ3JlZGVudGlhbHMoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkgeyAvLyBOZXZlciByZWplY3RzOiAsIHJlamVjdCkge1xyXG5cclxuICAgICAgICAvLyBDYWxsYmFjayB0byBqdXN0IHJlc29sdmUgd2l0aG91dCBlcnJvciAocGFzc2luZyBpbiB0aGUgZXJyb3JcclxuICAgICAgICAvLyB0byB0aGUgJ3Jlc29sdmUnIHdpbGwgbWFrZSB0aGUgcHJvY2VzcyB0byBmYWlsKSxcclxuICAgICAgICAvLyBzaW5jZSB3ZSBkb24ndCBuZWVkIHRvIGNyZWF0ZSBhbiBlcnJvciBmb3IgdGhlXHJcbiAgICAgICAgLy8gYXBwIGluaXQsIGlmIHRoZXJlIGlzIG5vdCBlbm91Z2ggc2F2ZWQgaW5mb3JtYXRpb25cclxuICAgICAgICAvLyB0aGUgYXBwIGhhcyBjb2RlIHRvIHJlcXVlc3QgYSBsb2dpbi5cclxuICAgICAgICB2YXIgcmVzb2x2ZUFueXdheSA9IGZ1bmN0aW9uKGRvZXNuTWF0dGVyKXsgICAgICAgIFxyXG4gICAgICAgICAgICBjb25zb2xlLndhcm5pbmcoJ0FwcCBNb2RlbCBJbml0IGVycicsIGRvZXNuTWF0dGVyKTtcclxuICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSWYgdGhlcmUgYXJlIGNyZWRlbnRpYWxzIHNhdmVkXHJcbiAgICAgICAgbG9jYWxmb3JhZ2UuZ2V0SXRlbSgnY3JlZGVudGlhbHMnKS50aGVuKGZ1bmN0aW9uKGNyZWRlbnRpYWxzKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoY3JlZGVudGlhbHMgJiZcclxuICAgICAgICAgICAgICAgIGNyZWRlbnRpYWxzLnVzZXJJRCAmJlxyXG4gICAgICAgICAgICAgICAgY3JlZGVudGlhbHMudXNlcm5hbWUgJiZcclxuICAgICAgICAgICAgICAgIGNyZWRlbnRpYWxzLmF1dGhLZXkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyB1c2UgYXV0aG9yaXphdGlvbiBrZXkgZm9yIGVhY2hcclxuICAgICAgICAgICAgICAgIC8vIG5ldyBSZXN0IHJlcXVlc3RcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzdC5leHRyYUhlYWRlcnMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWx1OiBjcmVkZW50aWFscy51c2VySUQsXHJcbiAgICAgICAgICAgICAgICAgICAgYWxrOiBjcmVkZW50aWFscy5hdXRoS2V5XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBJdCBoYXMgY3JlZGVudGlhbHMhIEhhcyBiYXNpYyBwcm9maWxlIGRhdGE/XHJcbiAgICAgICAgICAgICAgICAvLyBOT1RFOiB0aGUgdXNlclByb2ZpbGUgd2lsbCBsb2FkIGZyb20gbG9jYWwgc3RvcmFnZSBvbiB0aGlzIGZpcnN0XHJcbiAgICAgICAgICAgICAgICAvLyBhdHRlbXB0LCBhbmQgbGF6aWx5IHJlcXVlc3QgdXBkYXRlZCBkYXRhIGZyb20gcmVtb3RlXHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJQcm9maWxlLmxvYWQoKS50aGVuKGZ1bmN0aW9uKHByb2ZpbGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGVyZSBpcyBhIHByb2ZpbGUgY2FjaGVkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVuZCBzdWNjZXNmdWxseVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBObyBwcm9maWxlLCB3ZSBuZWVkIHRvIHJlcXVlc3QgaXQgdG8gYmUgYWJsZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0byB3b3JrIGNvcnJlY3RseSwgc28gd2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXR0ZW1wdCBhIGxvZ2luICh0aGUgdHJ5TG9naW4gcHJvY2VzcyBwZXJmb3Jtc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhIGxvZ2luIHdpdGggdGhlIHNhdmVkIGNyZWRlbnRpYWxzIGFuZCBmZXRjaFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgcHJvZmlsZSB0byBzYXZlIGl0IGluIHRoZSBsb2NhbCBjb3B5KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyeUxvZ2luKCkudGhlbihyZXNvbHZlLCByZXNvbHZlQW55d2F5KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LmJpbmQodGhpcyksIHJlc29sdmVBbnl3YXkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gRW5kIHN1Y2Nlc3NmdWxseS4gTm90IGxvZ2dpbiBpcyBub3QgYW4gZXJyb3IsXHJcbiAgICAgICAgICAgICAgICAvLyBpcyBqdXN0IHRoZSBmaXJzdCBhcHAgc3RhcnQtdXBcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKSwgcmVzb2x2ZUFueXdheSk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59O1xyXG5cclxuLyoqIEluaXRpYWxpemUgYW5kIHdhaXQgZm9yIGFueXRoaW5nIHVwICoqL1xyXG5BcHBNb2RlbC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICBcclxuICAgIC8vIExvY2FsIGRhdGFcclxuICAgIC8vIFRPRE8gSW52ZXN0aWdhdGUgd2h5IGF1dG9tYXRpYyBzZWxlY3Rpb24gYW4gSW5kZXhlZERCIGFyZVxyXG4gICAgLy8gZmFpbGluZyBhbmQgd2UgbmVlZCB0byB1c2UgdGhlIHdvcnNlLXBlcmZvcm1hbmNlIGxvY2Fsc3RvcmFnZSBiYWNrLWVuZFxyXG4gICAgbG9jYWxmb3JhZ2UuY29uZmlnKHtcclxuICAgICAgICBuYW1lOiAnTG9jb25vbWljc0FwcCcsXHJcbiAgICAgICAgdmVyc2lvbjogMC4xLFxyXG4gICAgICAgIHNpemUgOiA0OTgwNzM2LCAvLyBTaXplIG9mIGRhdGFiYXNlLCBpbiBieXRlcy4gV2ViU1FMLW9ubHkgZm9yIG5vdy5cclxuICAgICAgICBzdG9yZU5hbWUgOiAna2V5dmFsdWVwYWlycycsXHJcbiAgICAgICAgZGVzY3JpcHRpb24gOiAnTG9jb25vbWljcyBBcHAnLFxyXG4gICAgICAgIGRyaXZlcjogbG9jYWxmb3JhZ2UuTE9DQUxTVE9SQUdFXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gRmlyc3QsIGdldCBhbnkgc2F2ZWQgbG9jYWwgY29uZmlnXHJcbiAgICAvLyBOT1RFOiBmb3Igbm93LCB0aGlzIGlzIG9wdGlvbmFsLCB0byBnZXQgYSBzYXZlZCBzaXRlVXJsIHJhdGhlciB0aGFuIHRoZVxyXG4gICAgLy8gZGVmYXVsdCBvbmUsIGlmIGFueS5cclxuICAgIHJldHVybiBsb2NhbGZvcmFnZS5nZXRJdGVtKCdjb25maWcnKVxyXG4gICAgLnRoZW4oZnVuY3Rpb24oY29uZmlnKSB7XHJcbiAgICAgICAgLy8gT3B0aW9uYWwgY29uZmlnXHJcbiAgICAgICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChjb25maWcuc2l0ZVVybCkge1xyXG4gICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGh0bWwgVVJMXHJcbiAgICAgICAgICAgICQoJ2h0bWwnKS5hdHRyKCdkYXRhLXNpdGUtdXJsJywgY29uZmlnLnNpdGVVcmwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgY29uZmlnLnNpdGVVcmwgPSAkKCdodG1sJykuYXR0cignZGF0YS1zaXRlLXVybCcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnJlc3QgPSBuZXcgUmVzdChjb25maWcuc2l0ZVVybCArICcvYXBpL3YxL2VuLVVTLycpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFNldHVwIFJlc3QgYXV0aGVudGljYXRpb25cclxuICAgICAgICB0aGlzLnJlc3Qub25BdXRob3JpemF0aW9uUmVxdWlyZWQgPSBmdW5jdGlvbihyZXRyeSkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy50cnlMb2dpbigpXHJcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gTG9nZ2VkISBKdXN0IHJldHJ5XHJcbiAgICAgICAgICAgICAgICByZXRyeSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LmJpbmQodGhpcyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSW5pdGlhbGl6ZTogY2hlY2sgdGhlIHVzZXIgaGFzIGxvZ2luIGRhdGEgYW5kIG5lZWRlZFxyXG4gICAgICAgIC8vIGNhY2hlZCBkYXRhLCByZXR1cm4gaXRzIHByb21pc2VcclxuICAgICAgICByZXR1cm4gdGhpcy5sb2FkTG9jYWxDcmVkZW50aWFscygpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufTtcclxuXHJcbkFwcE1vZGVsLnByb3RvdHlwZS5nZXRVcGNvbWluZ0Jvb2tpbmdzID0gZnVuY3Rpb24gZ2V0VXBjb21pbmdCb29raW5ncygpIHtcclxuICAgIHJldHVybiB0aGlzLnJlc3QuZ2V0KCd1cGNvbWluZy1ib29raW5ncycpO1xyXG59O1xyXG5cclxuQXBwTW9kZWwucHJvdG90eXBlLmdldEJvb2tpbmcgPSBmdW5jdGlvbiBnZXRCb29raW5nKGlkKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yZXN0LmdldCgnZ2V0LWJvb2tpbmcnLCB7IGJvb2tpbmdJRDogaWQgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFwcE1vZGVsO1xyXG5cclxuLy8gQ2xhc3Mgc3BsaXRlZCBpbiBkaWZmZXJlbnQgZmlsZXMgdG8gbWl0aWdhdGUgc2l6ZSBhbmQgb3JnYW5pemF0aW9uXHJcbi8vIGJ1dCBrZWVwaW5nIGFjY2VzcyB0byB0aGUgY29tbW9uIHNldCBvZiBtZXRob2RzIGFuZCBvYmplY3RzIGVhc3kgd2l0aFxyXG4vLyB0aGUgc2FtZSBjbGFzcy5cclxuLy8gTG9hZGluZyBleHRlbnNpb25zOlxyXG5yZXF1aXJlKCcuL0FwcE1vZGVsLWV2ZW50cycpLnBsdWdJbihBcHBNb2RlbCk7XHJcbnJlcXVpcmUoJy4vQXBwTW9kZWwtdXNlckpvYlByb2ZpbGUnKS5wbHVnSW4oQXBwTW9kZWwpO1xyXG4iLCIvKiogTWFya2V0cGxhY2VQcm9maWxlXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgTWFya2V0cGxhY2VQcm9maWxlID0gcmVxdWlyZSgnLi4vbW9kZWxzL01hcmtldHBsYWNlUHJvZmlsZScpO1xyXG5cclxudmFyIFJlbW90ZU1vZGVsID0gcmVxdWlyZSgnLi4vdXRpbHMvUmVtb3RlTW9kZWwnKTtcclxuXHJcbmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKGFwcE1vZGVsKSB7XHJcbiAgICByZXR1cm4gbmV3IFJlbW90ZU1vZGVsKHtcclxuICAgICAgICBkYXRhOiBuZXcgTWFya2V0cGxhY2VQcm9maWxlKCksXHJcbiAgICAgICAgdHRsOiB7IG1pbnV0ZXM6IDEgfSxcclxuICAgICAgICBsb2NhbFN0b3JhZ2VOYW1lOiAnbWFya2V0cGxhY2VQcm9maWxlJyxcclxuICAgICAgICBmZXRjaDogZnVuY3Rpb24gZmV0Y2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgnbWFya2V0cGxhY2UtcHJvZmlsZScpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHVzaDogZnVuY3Rpb24gcHVzaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QucHV0KCdtYXJrZXRwbGFjZS1wcm9maWxlJywgdGhpcy5kYXRhLm1vZGVsLnRvUGxhaW5PYmplY3QoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qKiBQcml2YWN5IFNldHRpbmdzXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgUHJpdmFjeVNldHRpbmdzID0gcmVxdWlyZSgnLi4vbW9kZWxzL1ByaXZhY3lTZXR0aW5ncycpO1xyXG5cclxudmFyIFJlbW90ZU1vZGVsID0gcmVxdWlyZSgnLi4vdXRpbHMvUmVtb3RlTW9kZWwnKTtcclxuXHJcbmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKGFwcE1vZGVsKSB7XHJcbiAgICByZXR1cm4gbmV3IFJlbW90ZU1vZGVsKHtcclxuICAgICAgICBkYXRhOiBuZXcgUHJpdmFjeVNldHRpbmdzKCksXHJcbiAgICAgICAgdHRsOiB7IG1pbnV0ZXM6IDEgfSxcclxuICAgICAgICBsb2NhbFN0b3JhZ2VOYW1lOiAncHJpdmFjeVNldHRpbmdzJyxcclxuICAgICAgICBmZXRjaDogZnVuY3Rpb24gZmV0Y2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LmdldCgncHJpdmFjeS1zZXR0aW5ncycpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHVzaDogZnVuY3Rpb24gcHVzaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QucHV0KCdwcml2YWN5LXNldHRpbmdzJywgdGhpcy5kYXRhLm1vZGVsLnRvUGxhaW5PYmplY3QoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIFNjaGVkdWxpbmdQcmVmZXJlbmNlcyA9IHJlcXVpcmUoJy4uL21vZGVscy9TY2hlZHVsaW5nUHJlZmVyZW5jZXMnKTtcclxuXHJcbnZhciBSZW1vdGVNb2RlbCA9IHJlcXVpcmUoJy4uL3V0aWxzL1JlbW90ZU1vZGVsJyk7XHJcblxyXG5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZShhcHBNb2RlbCkge1xyXG4gICAgcmV0dXJuIG5ldyBSZW1vdGVNb2RlbCh7XHJcbiAgICAgICAgZGF0YTogbmV3IFNjaGVkdWxpbmdQcmVmZXJlbmNlcygpLFxyXG4gICAgICAgIHR0bDogeyBtaW51dGVzOiAxIH0sXHJcbiAgICAgICAgbG9jYWxTdG9yYWdlTmFtZTogJ3NjaGVkdWxpbmdQcmVmZXJlbmNlcycsXHJcbiAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uIGZldGNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5nZXQoJ3NjaGVkdWxpbmctcHJlZmVyZW5jZXMnKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1c2g6IGZ1bmN0aW9uIHB1c2goKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcHBNb2RlbC5yZXN0LnB1dCgnc2NoZWR1bGluZy1wcmVmZXJlbmNlcycsIHRoaXMuZGF0YS5tb2RlbC50b1BsYWluT2JqZWN0KCkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKipcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBTaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGUgPSByZXF1aXJlKCcuLi9tb2RlbHMvU2ltcGxpZmllZFdlZWtseVNjaGVkdWxlJyksXHJcbiAgICBSZW1vdGVNb2RlbCA9IHJlcXVpcmUoJy4uL3V0aWxzL1JlbW90ZU1vZGVsJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbi8vIFRoZSBzbG90IHNpemUgaXMgZml4ZWQgdG8gMTUgbWludXRlcyBieSBkZWZhdWx0LlxyXG4vLyBOT1RFOiBjdXJyZW50bHksIHRoZSBBUEkgb25seSBhbGxvd3MgMTUgbWludXRlcyBzbG90cyxcclxuLy8gYmVpbmcgdGhhdCBpbXBsaWNpdCwgYnV0IHBhcnQgb2YgdGhlIGNvZGUgaXMgcmVhZHkgZm9yIGV4cGxpY2l0IHNsb3RTaXplLlxyXG52YXIgZGVmYXVsdFNsb3RTaXplID0gMTU7XHJcbi8vIEEgbGlzdCBvZiB3ZWVrIGRheSBwcm9wZXJ0aWVzIG5hbWVzIGFsbG93ZWRcclxuLy8gdG8gYmUgcGFydCBvZiB0aGUgb2JqZWN0cyBkZXNjcmliaW5nIHdlZWtseSBzY2hlZHVsZVxyXG4vLyAoc2ltcGxpZmllZCBvciBjb21wbGV0ZS9zbG90IGJhc2VkKVxyXG4vLyBKdXN0IGxvd2VjYXNlZCBlbmdsaXNoIG5hbWVzXHJcbnZhciB3ZWVrRGF5UHJvcGVydGllcyA9IFsnc3VuZGF5JywgJ21vbmRheScsICd0dWVzZGF5JywgJ3dlZG5lc2RheScsICd0aHVyc2RheScsICdmcmlkYXknLCAnc2F0dXJkYXknXTtcclxuXHJcbmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKGFwcE1vZGVsKSB7XHJcbiAgICByZXR1cm4gbmV3IFJlbW90ZU1vZGVsKHtcclxuICAgICAgICBkYXRhOiBuZXcgU2ltcGxpZmllZFdlZWtseVNjaGVkdWxlKCksXHJcbiAgICAgICAgdHRsOiB7IG1pbnV0ZXM6IDEgfSxcclxuICAgICAgICBsb2NhbFN0b3JhZ2VOYW1lOiAnd2Vla2x5U2NoZWR1bGUnLFxyXG4gICAgICAgIGZldGNoOiBmdW5jdGlvbiBmZXRjaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QuZ2V0KCdhdmFpbGFiaWxpdHkvd2Vla2x5LXNjaGVkdWxlJylcclxuICAgICAgICAgICAgLnRoZW4oZnJvbVdlZWtseVNjaGVkdWxlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1c2g6IGZ1bmN0aW9uIHB1c2goKSB7XHJcbiAgICAgICAgICAgIHZhciBwbGFpbkRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAnYWxsLXRpbWUnOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICdqc29uLWRhdGEnOiB7fVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBpZiAodGhpcy5kYXRhLmlzQWxsVGltZSgpID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICBwbGFpbkRhdGFbJ2FsbC10aW1lJ10gPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcGxhaW5EYXRhWydqc29uLWRhdGEnXSA9IEpTT04uc3RyaW5naWZ5KHRvV2Vla2x5U2NoZWR1bGUodGhpcy5kYXRhLm1vZGVsLnRvUGxhaW5PYmplY3QodHJ1ZSkpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QucHV0KCdhdmFpbGFiaWxpdHkvd2Vla2x5LXNjaGVkdWxlJywgcGxhaW5EYXRhKVxyXG4gICAgICAgICAgICAudGhlbihmcm9tV2Vla2x5U2NoZWR1bGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gZnJvbVdlZWtseVNjaGVkdWxlKHdlZWtseVNjaGVkdWxlKSB7XHJcbiAgICBcclxuICAgIC8vIE5ldyBzaW1wbGlmaWVkIG9iamVjdCwgYXMgYSBwbGFpbiBvYmplY3Qgd2l0aFxyXG4gICAgLy8gd2Vla2RheXMgcHJvcGVydGllcyBhbmQgZnJvbS10byBwcm9wZXJ0aWVzIGxpa2U6XHJcbiAgICAvLyB7IHN1bmRheTogeyBmcm9tOiAwLCB0bzogNjAgfSB9XHJcbiAgICAvLyBTaW5jZSB0aGlzIGlzIGV4cGVjdGVkIHRvIGJlIGNvbnN1bWVkIGJ5IGZldGNoLXB1c2hcclxuICAgIC8vIG9wZXJhdGlvbnMsIGFuZCBsYXRlciBieSBhbiAnbW9kZWwudXBkYXRlV2l0aCcgb3BlcmF0aW9uLFxyXG4gICAgLy8gc28gcGxhaW4gaXMgc2ltcGxlIGFuZCBiZXR0ZXIgb24gcGVyZm9ybWFuY2U7IGNhbiBiZVxyXG4gICAgLy8gY29udmVydGVkIGVhc2lseSB0byB0aGUgU2ltcGxpZmllZFdlZWtseVNjaGVkdWxlIG9iamVjdC5cclxuICAgIHZhciBzaW1wbGVXUyA9IHt9O1xyXG4gICAgXHJcbiAgICAvLyBPbmx5IHN1cHBvcnRzICdhdmFpbGFibGUnIHN0YXR1cyB3aXRoIGRlZmF1bHQgJ3VuYXZhaWxhYmxlJ1xyXG4gICAgaWYgKHdlZWtseVNjaGVkdWxlLmRlZmF1bHRTdGF0dXMgIT09ICd1bmF2YWlsYWJsZScgfHxcclxuICAgICAgICB3ZWVrbHlTY2hlZHVsZS5zdGF0dXMgIT09ICdhdmFpbGFibGUnKSB7XHJcbiAgICAgICAgdGhyb3cge1xyXG4gICAgICAgICAgICBuYW1lOiAnaW5wdXQtZm9ybWF0JyxcclxuICAgICAgICAgICAgbWVzc2FnZTogJ1dlZWtseSBzY2hlZHVsZSwgZ2l2ZW4gc3RhdHVzZXMgbm90IHN1cHBvcnRlZCwgc3RhdHVzOiAnICtcclxuICAgICAgICAgICAgd2Vla2x5U2NoZWR1bGUuc3RhdHVzICsgJywgZGVmYXVsdFN0YXR1czogJyArIFxyXG4gICAgICAgICAgICB3ZWVrbHlTY2hlZHVsZS5kZWZhdWx0U3RhdHVzXHJcbiAgICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBnaXZlbiBzbG90U2l6ZSBvciBkZWZhdWx0XHJcbiAgICB2YXIgc2xvdFNpemUgPSAod2Vla2x5U2NoZWR1bGUuc2xvdFNpemUgfHwgZGVmYXVsdFNsb3RTaXplKSB8MDtcclxuXHJcbiAgICAvLyBSZWFkIHNsb3RzIHBlciB3ZWVrLWRheSAoeyBzbG90czogeyBcInN1bmRheVwiOiBbXSB9IH0pXHJcbiAgICBPYmplY3Qua2V5cyh3ZWVrbHlTY2hlZHVsZS5zbG90cylcclxuICAgIC5mb3JFYWNoKGZ1bmN0aW9uKHdlZWtkYXkpIHtcclxuICAgICAgICBcclxuICAgICAgICAvLyBWZXJpZnkgaXMgYSB3ZWVrZGF5IHByb3BlcnR5LCBvciBleGl0IGVhcmx5XHJcbiAgICAgICAgaWYgKHdlZWtEYXlQcm9wZXJ0aWVzLmluZGV4T2Yod2Vla2RheSkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRheXNsb3RzID0gd2Vla2x5U2NoZWR1bGUuc2xvdHNbd2Vla2RheV07XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gV2UgZ2V0IHRoZSBmaXJzdCBhdmFpbGFibGUgc2xvdCBhbmQgdGhlIGxhc3QgY29uc2VjdXRpdmVcclxuICAgICAgICAvLyB0byBtYWtlIHRoZSByYW5nZVxyXG4gICAgICAgIHZhciBmcm9tID0gbnVsbCxcclxuICAgICAgICAgICAgdG8gPSBudWxsLFxyXG4gICAgICAgICAgICBwcmV2aW91cyA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIHRpbWVzIGFyZSBvcmRlcmVkIGluIGFzY2VuZGluZ1xyXG4gICAgICAgIC8vIGFuZCB3aXRoIGZvcm1hdCBcIjAwOjAwOjAwXCIgdGhhdCB3ZSBjb252ZXJ0IHRvIG1pbnV0ZXNcclxuICAgICAgICAvLyAoZW5vdWdoIHByZWNpc2lvbiBmb3Igc2ltcGxpZmllZCB3ZWVrbHkgc2NoZWR1bGUpXHJcbiAgICAgICAgLy8gdXNpbmcgbW9tZW50LmR1cmF0aW9uXHJcbiAgICAgICAgLy8gTk9URTogdXNpbmcgJ3NvbWUnIHJhdGhlciB0aGFuICdmb3JFYWNoJyB0byBiZSBhYmxlXHJcbiAgICAgICAgLy8gdG8gZXhpdCBlYXJseSBmcm9tIHRoZSBpdGVyYXRpb24gYnkgcmV0dXJuaW5nICd0cnVlJ1xyXG4gICAgICAgIC8vIHdoZW4gdGhlIGVuZCBpcyByZWFjaGVkLlxyXG4gICAgICAgIGRheXNsb3RzLnNvbWUoZnVuY3Rpb24oc2xvdCkge1xyXG4gICAgICAgICAgICB2YXIgbWludXRlcyA9IG1vbWVudC5kdXJhdGlvbihzbG90KS5hc01pbnV0ZXMoKSB8MDtcclxuICAgICAgICAgICAgLy8gV2UgaGF2ZSBub3Qgc3RpbGwgYSAnZnJvbScgdGltZTpcclxuICAgICAgICAgICAgaWYgKGZyb20gPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGZyb20gPSBtaW51dGVzO1xyXG4gICAgICAgICAgICAgICAgcHJldmlvdXMgPSBtaW51dGVzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gV2UgaGF2ZSBhIGJlZ2dpbmluZywgY2hlY2sgaWYgdGhpcyBpcyBjb25zZWN1dGl2ZVxyXG4gICAgICAgICAgICAgICAgLy8gdG8gcHJldmlvdXMsIGJ5IGNoZWNraW5nIHByZXZpb3VzIHBsdXMgc2xvdFNpemVcclxuICAgICAgICAgICAgICAgIGlmIChwcmV2aW91cyArIHNsb3RTaXplID09PSBtaW51dGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTmV3IGVuZFxyXG4gICAgICAgICAgICAgICAgICAgIHRvID0gbWludXRlcztcclxuICAgICAgICAgICAgICAgICAgICAvLyBOZXh0IGl0ZXJhdGlvblxyXG4gICAgICAgICAgICAgICAgICAgIHByZXZpb3VzID0gbWludXRlcztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIE5vIGNvbnNlY3V0aXZlLCB3ZSBhbHJlYWR5IGhhcyBhIHJhbmdlLCBhbnlcclxuICAgICAgICAgICAgICAgICAgICAvLyBhZGRpdGlvbmFsIHNsb3QgaXMgZGlzY2FyZGVkLCBvdXQgb2YgdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcHJlY2lzaW9uIG9mIHRoZSBzaW1wbGlmaWVkIHdlZWtseSBzY2hlZHVsZSxcclxuICAgICAgICAgICAgICAgICAgICAvLyBzbyB3ZSBjYW4gZ28gb3V0IHRoZSBpdGVyYXRpb246XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTk9URTogSWYgaW4gYSBmdXR1cmUgYSBtb3JlIGNvbXBsZXRlIHNjaGVkdWxlXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gbmVlZCB0byBiZSB3cm90ZW4gdXNpbmcgbXVsdGlwbGUgcmFuZ2VzIHJhdGhlclxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGluZGl2aWR1YWwgc2xvdHMsIHRoaXMgaXMgdGhlIHBsYWNlIHRvIGNvbnRpbnVlXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29kaW5nLCBwb3B1bGF0aW5nIGFuIGFycmF5IG9mIFt7ZnJvbSwgdG99XSA6LSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFNsb3RzIGNoZWNrZWQsIGNoZWNrIHRoZSByZXN1bHRcclxuICAgICAgICBpZiAoZnJvbSAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHNpbXBsZURheSA9IHtcclxuICAgICAgICAgICAgICAgIGZyb206IGZyb20sXHJcbiAgICAgICAgICAgICAgICB0bzogMFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBzaW1wbGVXU1t3ZWVrZGF5XSA9IHNpbXBsZURheTtcclxuXHJcbiAgICAgICAgICAgIC8vIFdlIGhhdmUgYSByYW5nZSFcclxuICAgICAgICAgICAgaWYgKHRvICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBhbmQgaGFzIGFuIGVuZCFcclxuICAgICAgICAgICAgICAgIC8vIGFkZCB0aGUgc2xvdCBzaXplIHRvIHRoZSBlbmRpbmdcclxuICAgICAgICAgICAgICAgIHNpbXBsZURheS50byA9IHRvICsgc2xvdFNpemU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBzbWFsbGVyIHJhbmdlLCBqdXN0IG9uZSBzbG90LFxyXG4gICAgICAgICAgICAgICAgLy8gYWRkIHRoZSBzbG90IHNpemUgdG8gdGhlIGJlZ2luaW5nXHJcbiAgICAgICAgICAgICAgICBzaW1wbGVEYXkudG8gPSBmcm9tICsgc2xvdFNpemU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEb25lIVxyXG4gICAgcmV0dXJuIHNpbXBsZVdTO1xyXG59XHJcblxyXG4vKipcclxuICAgIFBhc3MgaW4gYSBwbGFpbiBvYmplY3QsIG5vdCBhIG1vZGVsLFxyXG4gICAgZ2V0dGluZyBhbiBvYmplY3Qgc3VpdGFibGUgZm9yIHRoZSBBUEkgZW5kcG9pbnQuXHJcbioqL1xyXG5mdW5jdGlvbiB0b1dlZWtseVNjaGVkdWxlKHNpbXBsaWZpZWRXZWVrbHlTY2hlZHVsZSkge1xyXG5cclxuICAgIHZhciBzbG90U2l6ZSA9IGRlZmF1bHRTbG90U2l6ZTtcclxuICAgIFxyXG4gICAgLy8gSXQncyBidWlsZCB3aXRoICdhdmFpbGFibGUnIGFzIGV4cGxpY2l0IHN0YXR1czpcclxuICAgIHZhciB3ZWVrbHlTY2hlZHVsZSA9IHtcclxuICAgICAgICBzdGF0dXM6ICdhdmFpbGFibGUnLFxyXG4gICAgICAgIGRlZmF1bHRBdmFpbGFiaWxpdHk6ICd1bmF2YWlsYWJsZScsXHJcbiAgICAgICAgc2xvdHM6IHt9LFxyXG4gICAgICAgIHNsb3RTaXplOiBzbG90U2l6ZVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBQZXIgd2Vla2RheVxyXG4gICAgT2JqZWN0LmtleXMoc2ltcGxpZmllZFdlZWtseVNjaGVkdWxlKVxyXG4gICAgLmZvckVhY2goZnVuY3Rpb24od2Vla2RheSkge1xyXG5cclxuICAgICAgICAvLyBWZXJpZnkgaXMgYSB3ZWVrZGF5IHByb3BlcnR5LCBvciBleGl0IGVhcmx5XHJcbiAgICAgICAgaWYgKHdlZWtEYXlQcm9wZXJ0aWVzLmluZGV4T2Yod2Vla2RheSkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzaW1wbGVEYXkgPSBzaW1wbGlmaWVkV2Vla2x5U2NoZWR1bGVbd2Vla2RheV07XHJcblxyXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gZXhwYW5kIHRoZSBzaW1wbGlmaWVkIHRpbWUgcmFuZ2VzIFxyXG4gICAgICAgIC8vIGluIHNsb3RzIG9mIHRoZSBzbG90U2l6ZVxyXG4gICAgICAgIC8vIFRoZSBlbmQgdGltZSB3aWxsIGJlIGV4Y2x1ZGVkLCBzaW5jZSBzbG90c1xyXG4gICAgICAgIC8vIGRlZmluZSBvbmx5IHRoZSBzdGFydCwgYmVpbmcgaW1wbGljaXQgdGhlIHNsb3RTaXplLlxyXG4gICAgICAgIHZhciBmcm9tID0gc2ltcGxlRGF5LmZyb20gfDAsXHJcbiAgICAgICAgICAgIHRvID0gc2ltcGxlRGF5LnRvIHwwO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgdGhlIHNsb3QgYXJyYXlcclxuICAgICAgICB3ZWVrbHlTY2hlZHVsZS5zbG90c1t3ZWVrZGF5XSA9IFtdO1xyXG5cclxuICAgICAgICAvLyBJbnRlZ3JpdHkgdmVyaWZpY2F0aW9uXHJcbiAgICAgICAgaWYgKHRvID4gZnJvbSkge1xyXG4gICAgICAgICAgICAvLyBJdGVyYXRlIGJ5IHRoZSBzbG90U2l6ZSB1bnRpbCB3ZSByZWFjaFxyXG4gICAgICAgICAgICAvLyB0aGUgZW5kLCBub3QgaW5jbHVkaW5nIHRoZSAndG8nIHNpbmNlXHJcbiAgICAgICAgICAgIC8vIHNsb3RzIGluZGljYXRlIG9ubHkgdGhlIHN0YXJ0IG9mIHRoZSBzbG90XHJcbiAgICAgICAgICAgIC8vIHRoYXQgaXMgYXNzdW1lZCB0byBmaWxsIGEgc2xvdFNpemUgc3RhcnRpbmdcclxuICAgICAgICAgICAgLy8gb24gdGhhdCBzbG90LXRpbWVcclxuICAgICAgICAgICAgdmFyIHByZXZpb3VzID0gZnJvbTtcclxuICAgICAgICAgICAgd2hpbGUgKHByZXZpb3VzIDwgdG8pIHtcclxuICAgICAgICAgICAgICAgIHdlZWtseVNjaGVkdWxlLnNsb3RzW3dlZWtkYXldLnB1c2gobWludXRlc1RvVGltZVN0cmluZyhwcmV2aW91cykpO1xyXG4gICAgICAgICAgICAgICAgcHJldmlvdXMgKz0gc2xvdFNpemU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEb25lIVxyXG4gICAgcmV0dXJuIHdlZWtseVNjaGVkdWxlO1xyXG59XHJcblxyXG4vKipcclxuICAgIGludGVybmFsIHV0aWxpdHkgZnVuY3Rpb24gJ3RvIHN0cmluZyB3aXRoIHR3byBkaWdpdHMgYWxtb3N0J1xyXG4qKi9cclxuZnVuY3Rpb24gdHdvRGlnaXRzKG4pIHtcclxuICAgIHJldHVybiBNYXRoLmZsb29yKG4gLyAxMCkgKyAnJyArIG4gJSAxMDtcclxufVxyXG5cclxuLyoqXHJcbiAgICBDb252ZXJ0IGEgbnVtYmVyIG9mIG1pbnV0ZXNcclxuICAgIGluIGEgc3RyaW5nIGxpa2U6IDAwOjAwOjAwIChob3VyczptaW51dGVzOnNlY29uZHMpXHJcbioqL1xyXG5mdW5jdGlvbiBtaW51dGVzVG9UaW1lU3RyaW5nKG1pbnV0ZXMpIHtcclxuICAgIHZhciBkID0gbW9tZW50LmR1cmF0aW9uKG1pbnV0ZXMsICdtaW51dGVzJyksXHJcbiAgICAgICAgaCA9IGQuaG91cnMoKSxcclxuICAgICAgICBtID0gZC5taW51dGVzKCksXHJcbiAgICAgICAgcyA9IGQuc2Vjb25kcygpO1xyXG4gICAgXHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgIHR3b0RpZ2l0cyhoKSArICc6JyArXHJcbiAgICAgICAgdHdvRGlnaXRzKG0pICsgJzonICtcclxuICAgICAgICB0d29EaWdpdHMocylcclxuICAgICk7XHJcbn1cclxuIiwiLyoqIFVzZXJQcm9maWxlXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgVXNlciA9IHJlcXVpcmUoJy4uL21vZGVscy9Vc2VyJyk7XHJcblxyXG52YXIgUmVtb3RlTW9kZWwgPSByZXF1aXJlKCcuLi91dGlscy9SZW1vdGVNb2RlbCcpO1xyXG5cclxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoYXBwTW9kZWwpIHtcclxuICAgIHJldHVybiBuZXcgUmVtb3RlTW9kZWwoe1xyXG4gICAgICAgIGRhdGE6IFVzZXIubmV3QW5vbnltb3VzKCksXHJcbiAgICAgICAgdHRsOiB7IG1pbnV0ZXM6IDEgfSxcclxuICAgICAgICAvLyBJTVBPUlRBTlQ6IEtlZXAgdGhlIG5hbWUgaW4gc3luYyB3aXRoIHNldC11cCBhdCBBcHBNb2RlbC1hY2NvdW50XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlTmFtZTogJ3Byb2ZpbGUnLFxyXG4gICAgICAgIGZldGNoOiBmdW5jdGlvbiBmZXRjaCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFwcE1vZGVsLnJlc3QuZ2V0KCdwcm9maWxlJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXNoOiBmdW5jdGlvbiBwdXNoKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBwTW9kZWwucmVzdC5wdXQoJ3Byb2ZpbGUnLCB0aGlzLmRhdGEubW9kZWwudG9QbGFpbk9iamVjdCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBTaW1wbGUgVmlldyBNb2RlbCB3aXRoIG1haW4gY3JlZGVudGlhbHMgZm9yXHJcbiAgICB1c2UgaW4gYSBmb3JtLCB3aXRoIHZhbGlkYXRpb24uXHJcbiAgICBVc2VkIGJ5IExvZ2luIGFuZCBTaWdudXAgYWN0aXZpdGllc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxuXHJcbmZ1bmN0aW9uIEZvcm1DcmVkZW50aWFscygpIHtcclxuXHJcbiAgICB0aGlzLnVzZXJuYW1lID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcbiAgICB0aGlzLnBhc3N3b3JkID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcbiAgICBcclxuICAgIC8vIHZhbGlkYXRlIHVzZXJuYW1lIGFzIGFuIGVtYWlsXHJcbiAgICB2YXIgZW1haWxSZWdleHAgPSAvXlstMC05QS1aYS16ISMkJSYnKisvPT9eX2B7fH1+Ll0rQFstMC05QS1aYS16ISMkJSYnKisvPT9eX2B7fH1+Ll0rJC87XHJcbiAgICB0aGlzLnVzZXJuYW1lLmVycm9yID0ga28ub2JzZXJ2YWJsZSgnJyk7XHJcbiAgICB0aGlzLnVzZXJuYW1lLnN1YnNjcmliZShmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgaWYgKHYpIHtcclxuICAgICAgICAgICAgaWYgKGVtYWlsUmVnZXhwLnRlc3QodikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWUuZXJyb3IoJycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZS5lcnJvcignSXMgbm90IGEgdmFsaWQgZW1haWwnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy51c2VybmFtZS5lcnJvcignUmVxdWlyZWQnKTtcclxuICAgICAgICB9XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgXHJcbiAgICAvLyByZXF1aXJlZCBwYXNzd29yZFxyXG4gICAgdGhpcy5wYXNzd29yZC5lcnJvciA9IGtvLm9ic2VydmFibGUoJycpO1xyXG4gICAgdGhpcy5wYXNzd29yZC5zdWJzY3JpYmUoZnVuY3Rpb24odikge1xyXG4gICAgICAgIHZhciBlcnIgPSAnJztcclxuICAgICAgICBpZiAoIXYpXHJcbiAgICAgICAgICAgIGVyciA9ICdSZXF1aXJlZCc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5wYXNzd29yZC5lcnJvcihlcnIpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGb3JtQ3JlZGVudGlhbHM7XHJcbiIsIi8qKiBOYXZBY3Rpb24gdmlldyBtb2RlbC5cclxuICAgIEl0IGFsbG93cyBzZXQtdXAgcGVyIGFjdGl2aXR5IGZvciB0aGUgQXBwTmF2IGFjdGlvbiBidXR0b24uXHJcbioqL1xyXG52YXIgTW9kZWwgPSByZXF1aXJlKCcuLi9tb2RlbHMvTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIE5hdkFjdGlvbih2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgbGluazogJycsXHJcbiAgICAgICAgaWNvbjogJycsXHJcbiAgICAgICAgdGV4dDogJycsXHJcbiAgICAgICAgLy8gJ1Rlc3QnIGlzIHRoZSBoZWFkZXIgdGl0bGUgYnV0IHBsYWNlZCBpbiB0aGUgYnV0dG9uL2FjdGlvblxyXG4gICAgICAgIGlzVGl0bGU6IGZhbHNlLFxyXG4gICAgICAgIC8vICdMaW5rJyBpcyB0aGUgZWxlbWVudCBJRCBvZiBhIG1vZGFsIChzdGFydHMgd2l0aCBhICMpXHJcbiAgICAgICAgaXNNb2RhbDogZmFsc2UsXHJcbiAgICAgICAgLy8gJ0xpbmsnIGlzIGEgU2hlbGwgY29tbWFuZCwgbGlrZSAnZ29CYWNrIDInXHJcbiAgICAgICAgaXNTaGVsbDogZmFsc2UsXHJcbiAgICAgICAgLy8gU2V0IGlmIHRoZSBlbGVtZW50IGlzIGEgbWVudSBidXR0b24sIGluIHRoYXQgY2FzZSAnbGluaydcclxuICAgICAgICAvLyB3aWxsIGJlIHRoZSBJRCBvZiB0aGUgbWVudSAoY29udGFpbmVkIGluIHRoZSBwYWdlOyB3aXRob3V0IHRoZSBoYXNoKSwgdXNpbmdcclxuICAgICAgICAvLyB0aGUgdGV4dCBhbmQgaWNvbiBidXQgc3BlY2lhbCBtZWFuaW5nIGZvciB0aGUgdGV4dCB2YWx1ZSAnbWVudSdcclxuICAgICAgICAvLyBvbiBpY29uIHByb3BlcnR5IHRoYXQgd2lsbCB1c2UgdGhlIHN0YW5kYXJkIG1lbnUgaWNvbi5cclxuICAgICAgICBpc01lbnU6IGZhbHNlXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE5hdkFjdGlvbjtcclxuXHJcbi8vIFNldCBvZiB2aWV3IHV0aWxpdGllcyB0byBnZXQgdGhlIGxpbmsgZm9yIHRoZSBleHBlY3RlZCBodG1sIGF0dHJpYnV0ZXNcclxuXHJcbk5hdkFjdGlvbi5wcm90b3R5cGUuZ2V0SHJlZiA9IGZ1bmN0aW9uIGdldEhyZWYoKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgICh0aGlzLmlzTWVudSgpIHx8IHRoaXMuaXNNb2RhbCgpIHx8IHRoaXMuaXNTaGVsbCgpKSA/XHJcbiAgICAgICAgJyMnIDpcclxuICAgICAgICB0aGlzLmxpbmsoKVxyXG4gICAgKTtcclxufTtcclxuXHJcbk5hdkFjdGlvbi5wcm90b3R5cGUuZ2V0TW9kYWxUYXJnZXQgPSBmdW5jdGlvbiBnZXRNb2RhbFRhcmdldCgpIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgKHRoaXMuaXNNZW51KCkgfHwgIXRoaXMuaXNNb2RhbCgpIHx8IHRoaXMuaXNTaGVsbCgpKSA/XHJcbiAgICAgICAgJycgOlxyXG4gICAgICAgIHRoaXMubGluaygpXHJcbiAgICApO1xyXG59O1xyXG5cclxuTmF2QWN0aW9uLnByb3RvdHlwZS5nZXRTaGVsbENvbW1hbmQgPSBmdW5jdGlvbiBnZXRTaGVsbENvbW1hbmQoKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgICh0aGlzLmlzTWVudSgpIHx8ICF0aGlzLmlzU2hlbGwoKSkgP1xyXG4gICAgICAgICcnIDpcclxuICAgICAgICB0aGlzLmxpbmsoKVxyXG4gICAgKTtcclxufTtcclxuXHJcbk5hdkFjdGlvbi5wcm90b3R5cGUuZ2V0TWVudUlEID0gZnVuY3Rpb24gZ2V0TWVudUlEKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgICAoIXRoaXMuaXNNZW51KCkpID9cclxuICAgICAgICAnJyA6XHJcbiAgICAgICAgdGhpcy5saW5rKClcclxuICAgICk7XHJcbn07XHJcblxyXG5OYXZBY3Rpb24ucHJvdG90eXBlLmdldE1lbnVMaW5rID0gZnVuY3Rpb24gZ2V0TWVudUxpbmsoKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgICghdGhpcy5pc01lbnUoKSkgP1xyXG4gICAgICAgICcnIDpcclxuICAgICAgICAnIycgKyB0aGlzLmxpbmsoKVxyXG4gICAgKTtcclxufTtcclxuXHJcbi8qKiBTdGF0aWMsIHNoYXJlZCBhY3Rpb25zICoqL1xyXG5OYXZBY3Rpb24uZ29Ib21lID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnLycsXHJcbiAgICBpY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1ob21lJ1xyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5nb0JhY2sgPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICdnb0JhY2snLFxyXG4gICAgaWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tYXJyb3ctbGVmdCcsXHJcbiAgICBpc1NoZWxsOiB0cnVlXHJcbn0pO1xyXG5cclxuLy8gVE9ETyBUTyBSRU1PVkUsIEV4YW1wbGUgb2YgbW9kYWxcclxuTmF2QWN0aW9uLm5ld0l0ZW0gPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICcjbmV3SXRlbScsXHJcbiAgICBpY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgIGlzTW9kYWw6IHRydWVcclxufSk7XHJcblxyXG5OYXZBY3Rpb24ubWVudUluID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnbWVudUluJyxcclxuICAgIGljb246ICdtZW51JyxcclxuICAgIGlzTWVudTogdHJ1ZVxyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5tZW51T3V0ID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnbWVudU91dCcsXHJcbiAgICBpY29uOiAnbWVudScsXHJcbiAgICBpc01lbnU6IHRydWVcclxufSk7XHJcblxyXG5OYXZBY3Rpb24ubWVudU5ld0l0ZW0gPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICdtZW51TmV3SXRlbScsXHJcbiAgICBpY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgIGlzTWVudTogdHJ1ZVxyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5nb0hlbHBJbmRleCA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgbGluazogJyNoZWxwSW5kZXgnLFxyXG4gICAgdGV4dDogJ2hlbHAnLFxyXG4gICAgaXNNb2RhbDogdHJ1ZVxyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5nb0xvZ2luID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnL2xvZ2luJyxcclxuICAgIHRleHQ6ICdsb2ctaW4nXHJcbn0pO1xyXG5cclxuTmF2QWN0aW9uLmdvTG9nb3V0ID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnL2xvZ291dCcsXHJcbiAgICB0ZXh0OiAnbG9nLW91dCdcclxufSk7XHJcblxyXG5OYXZBY3Rpb24uZ29TaWdudXAgPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICcvc2lnbnVwJyxcclxuICAgIHRleHQ6ICdzaWduLXVwJ1xyXG59KTtcclxuIiwiLyoqIE5hdkJhciB2aWV3IG1vZGVsLlxyXG4gICAgSXQgYWxsb3dzIGN1c3RvbWl6ZSB0aGUgTmF2QmFyIHBlciBhY3Rpdml0eS5cclxuKiovXHJcbnZhciBNb2RlbCA9IHJlcXVpcmUoJy4uL21vZGVscy9Nb2RlbCcpO1xyXG4gICAgLy9OYXZBY3Rpb24gPSByZXF1aXJlKCcuL05hdkFjdGlvbicpO1xyXG5cclxuZnVuY3Rpb24gTmF2QmFyKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICAvLyBUaXRsZSBzaG93ZWQgaW4gdGhlIGNlbnRlclxyXG4gICAgICAgIC8vIFdoZW4gdGhlIHRpdGxlIGlzICdudWxsJywgdGhlIGFwcCBsb2dvIGlzIHNob3dlZCBpbiBwbGFjZSxcclxuICAgICAgICAvLyBvbiBlbXB0eSB0ZXh0LCB0aGUgZW1wdHkgdGV4dCBpcyBzaG93ZWQgYW5kIG5vIGxvZ28uXHJcbiAgICAgICAgdGl0bGU6ICcnLFxyXG4gICAgICAgIC8vIE5hdkFjdGlvbiBpbnN0YW5jZTpcclxuICAgICAgICBsZWZ0QWN0aW9uOiBudWxsLFxyXG4gICAgICAgIC8vIE5hdkFjdGlvbiBpbnN0YW5jZTpcclxuICAgICAgICByaWdodEFjdGlvbjogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBOYXZCYXI7XHJcbiJdfQ==
;