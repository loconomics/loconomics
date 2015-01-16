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
/** Calendar activity **/
'use strict';

var $ = require('jquery'),
    moment = require('moment'),
    ko = require('knockout'),
    NavAction = require('../viewmodels/NavAction');
require('../components/DatePicker');

var singleton = null;

exports.init = function initAppointment($activity, app) {

    if (singleton === null)
        singleton = new AppointmentActivity($activity, app);
    
    return singleton;
};

function AppointmentActivity($activity, app) {

    /* Getting elements */
    this.$activity = $activity;
    this.$appointmentView = $activity.find('#calendarAppointmentView');
    this.$chooseNew = $('#calendarChooseNew');
    this.app = app;
    
    // Object to hold the options passed on 'show' as a result
    // of a request from another activity
    this.requestInfo = null;
    
    this.navAction = NavAction.newCalendarItem;
    
    this.initAppointment();
}

AppointmentActivity.prototype.show = function show(options) {
    /* jshint maxcomplexity:10 */
    this.requestInfo = options || {};
    
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
    
    this.showAppointment(options && options.appointmentId);
};

var Appointment = require('../models/Appointment');

AppointmentActivity.prototype.showAppointment = function showAppointment(aptId) {
    /*jshint maxstatements:36*/
    
    if (aptId) {
        // TODO: select appointment 'aptId'

    } else if (aptId === 0) {
        this.appointmentsDataView.newAppointment(new Appointment());
        this.appointmentsDataView.editMode(true);        
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
                app.showActivity('bookingConfirmation', {
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
                appointmentsDataView.originalEditedAppointment = ko.toJS(appointmentsDataView.currentAppointment());
                
                // Remove the navAction
                app.navAction(null);
            }
            else {
                // Restore the navAction
                app.navAction(this.navAction);
            }
            
        }.bind(this));
        
        appointmentsDataView.pickDateTime = function pickDateTime() {

            app.popActivity('datetimePicker', {
                selectedDatetime: null
            });
        };
        
        appointmentsDataView.pickClient = function pickClient() {

            app.popActivity('clients', {
                selectClient: true,
                selectedClient: null
            });
        };

        appointmentsDataView.pickService = function pickService() {

            app.popActivity('services', {
                selectServices: true,
                selectedServices: appointmentsDataView.currentAppointment().services()
            });
        };

        appointmentsDataView.changePrice = function changePrice() {
            // TODO
        };
        
        appointmentsDataView.pickLocation = function pickLocation() {

            app.popActivity('locations', {
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

            app.popActivity('textEditor', {
                request: 'textEditor',
                field: field,
                header: textFieldsHeaders[field],
                text: appointmentsDataView.currentAppointment()[field]()
            });
        }.bind(this);
        
        appointmentsDataView.returnToCalendar = function returnToCalendar() {
            // We have a request
            if (this.requestInfo) {

                // Pass the current date
                var date = this.appointmentsDataView.currentDate();
                if (date)
                    this.requestInfo.date = date;
                // And go back
                this.app.goBack(this.requestInfo);
                // Last, clear requestInfo
                this.requestInfo = null;
            }
        }.bind(this);
        
        appointmentsDataView.currentDate = ko.computed(function() {
            
            var apt = this.currentAppointment(),
                justDate = null;

            if (apt && apt.startTime())
                justDate = moment(apt.startTime()).hours(0).minutes(0).seconds(0).toDate();
            
            return justDate;
        }, appointmentsDataView);
        
        ko.applyBindings(appointmentsDataView, this.$activity.get(0));
    }
};

},{"../components/DatePicker":21,"../models/Appointment":22,"../testdata/calendarAppointments":37,"../viewmodels/NavAction":54,"knockout":false,"moment":false}],3:[function(require,module,exports){
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

},{"knockout":false}],4:[function(require,module,exports){
/** Calendar activity **/
'use strict';

var $ = require('jquery'),
    moment = require('moment');
require('../components/DatePicker');
var ko = require('knockout');
var CalendarSlot = require('../models/CalendarSlot'),
    NavAction = require('../viewmodels/NavAction');

var singleton = null;

exports.init = function initCalendar($activity, app) {

    if (singleton === null)
        singleton = new CalendarActivity($activity, app);
    
    return singleton;
};

function CalendarActivity($activity, app) {

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
    // Update datepicker selected date on date change (from 
    // a different source than the datepicker itself
    this.dataView.currentDate.subscribe(function(date) {
        
        var mdate = moment(date);

        this.$datepicker.removeClass('is-visible');
        // Change not from the widget?
        if (this.$datepicker.datepicker('getValue').toISOString() !== mdate.toISOString())
            this.$datepicker.datepicker('setValue', date, true);

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
    
    this.navAction = NavAction.newCalendarItem;
}

CalendarActivity.prototype.show = function show(options) {
    /* jshint maxcomplexity:8 */
    
    if (options && (options.date instanceof Date))
        this.dataView.currentDate(options.date);
    
    if (options && options.route) {
        switch (options.route.segments[0]) {
            
            case 'appointment':
                this.$chooseNew.modal('hide');
                // Pass Appointment ID
                var aptId = options.route.segments[1];
                this.showAppointment(aptId || 0);
                break;

            case 'new':
                switch (options.route.segments[1]) {
                
                    case 'booking':
                        this.$chooseNew.modal('hide');
                        this.showAppointment(0);
                        break;

                    case 'event':
                        // TODO Implement new-event form opening
                        break;
                        
                    default:
                        this.$chooseNew.modal('show');
                        break;
                }
                break;
        }
    }
};

CalendarActivity.prototype.showAppointment = function showAppointment(apt) {
    
    // TODO: implement showing the given 'apt'
    this.app.showActivity('appointment', {
        date: this.dataView.currentDate(),
        appointmentId: apt
    });
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

},{"../components/DatePicker":21,"../models/CalendarSlot":24,"../testdata/calendarSlots":38,"../viewmodels/NavAction":54,"knockout":false,"moment":false}],5:[function(require,module,exports){
/**
    clients activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout');
    
var singleton = null;

exports.init = function initClients($activity, app) {

    if (singleton === null)
        singleton = new ClientsActivity($activity, app);
    
    return singleton;
};

function ClientsActivity($activity, app) {

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
        this.dataView.headerText(itIs ? 'Select a client' : 'Clients');
    }.bind(this));

    // Object to hold the options passed on 'show' as a result
    // of a request from another activity
    this.requestInfo = null;
    
    // Handler to go back with the selected client when 
    // selection mode goes off and requestInfo is for
    // 'select mode'
    this.dataView.isSelectionMode.subscribe(function (itIs) {
        // We have a request and
        // it requested to select a client
        // and selection mode goes off
        if (this.requestInfo &&
            this.requestInfo.selectClient === true &&
            itIs === false) {
            
            // Pass the selected client in the info
            this.requestInfo.selectedClient = this.dataView.selectedClient();
            // And go back
            this.app.goBack(this.requestInfo);
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

    if (options.selectClient === true)
        this.dataView.isSelectionMode(true);
};

function ViewModel() {

    this.headerText = ko.observable('Clients');

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
            var n = client && client.fullName() && client.fullName() || '';
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
        this.isSelectionMode(false);

    }.bind(this);
}

},{"../testdata/clients":39,"knockout":false}],6:[function(require,module,exports){
/**
    ContactInfo activity
**/
'use strict';

var singleton = null;

exports.init = function initContactInfo($activity, app) {

    if (singleton === null)
        singleton = new ContactInfoActivity($activity, app);
    
    return singleton;
};

function ContactInfoActivity($activity, app) {

    this.$activity = $activity;
    this.app = app;
    
    this.navAction = null;
}

ContactInfoActivity.prototype.show = function show(options) {

};

},{}],7:[function(require,module,exports){
/**
    datetimePicker activity
**/
'use strict';

var $ = require('jquery'),
    moment = require('moment'),
    ko = require('knockout'),
    Time = require('../utils/Time');
require('../components/DatePicker');
    
var singleton = null;

exports.init = function initDatetimePicker($activity, app) {

    if (singleton === null)
        singleton = new DatetimePickerActivity($activity, app);

    return singleton;
};

function DatetimePickerActivity($activity, app) {

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
            this.app.goBack(this.requestInfo);
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

},{"../components/DatePicker":21,"../testdata/timeSlots":43,"../utils/Time":48,"knockout":false,"moment":false}],8:[function(require,module,exports){
/**
    Home activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    NavAction = require('../viewmodels/NavAction');

var singleton = null;

exports.init = function initHome($activity, app) {

    if (singleton === null)
        singleton = new HomeActivity($activity, app);
    
    return singleton;
};

function HomeActivity($activity, app) {

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
    
    this.navAction = NavAction.newItem;
}

HomeActivity.prototype.show = function show(options) {
 
    options = options || {};
    this.requestInfo = options;
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
    dataView.nextBooking(require('../testdata/calendarAppointments').appointments[0]);
    
    dataView.upcomingBookings.today.quantity(8);
    dataView.upcomingBookings.today.time(new Time(5, 15));
    dataView.upcomingBookings.tomorrow.quantity(14);
    dataView.upcomingBookings.tomorrow.time(new Time(8, 30));
    dataView.upcomingBookings.nextWeek.quantity(123);
    
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

},{"../models/GetMore":26,"../models/MailFolder":29,"../models/PerformanceSummary":32,"../models/UpcomingBookingsSummary":35,"../testdata/calendarAppointments":37,"../testdata/messages":41,"../utils/Time":48,"../viewmodels/NavAction":54,"knockout":false}],9:[function(require,module,exports){
/**
    Index activity
**/
'use strict';

var singleton = null;

exports.init = function initIndex($activity, app) {

    if (singleton === null)
        singleton = new IndexActivity($activity, app);
    
    return singleton;
};

function IndexActivity($activity, app) {

    this.$activity = $activity;
    this.app = app;
    
    this.navAction = null;
    
    // Any user can access this
    this.accessLevel = null;
}

IndexActivity.prototype.show = function show(options) {
    // It checks if the user is logged so then 
    // their 'logged index' is the dashboard not this
    // page that is focused on anonymous users
    if (!this.app.user().isAnonymous()) {
        this.app.goDashboard();
    }
};

},{}],10:[function(require,module,exports){
/**
    LearnMore activity
**/
'use strict';
var ko = require('knockout'),
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
    
    this.navAction = NavAction.goBack;
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
},{"../viewmodels/NavAction":54,"knockout":false}],11:[function(require,module,exports){
/**
    LocationEdition activity
**/
'use strict';
var ko = require('knockout'),
    Location = require('../models/Location');

var singleton = null;

exports.init = function initLocationEdition($activity, app) {

    if (singleton === null)
        singleton = new LocationEditionActivity($activity, app);
    
    return singleton;
};

function LocationEditionActivity($activity, app) {

    this.$activity = $activity;
    this.app = app;
    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));
    
    this.navAction = null;
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
},{"../models/Location":28,"knockout":false}],12:[function(require,module,exports){
/**
    locations activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout');
    
var singleton = null;

exports.init = function initLocations($activity, app) {

    if (singleton === null)
        singleton = new LocationsActivity($activity, app);
    
    return singleton;
};

function LocationsActivity($activity, app) {

    this.app = app;
    this.$activity = $activity;
    this.$listView = $activity.find('#locationsListView');

    var dataView = this.dataView = new ViewModel();
    ko.applyBindings(dataView, $activity.get(0));

    // TestingData
    dataView.locations(require('../testdata/locations').locations);

    // Handler to update header based on a mode change:
    this.dataView.isSelectionMode.subscribe(function (itIs) {
        this.dataView.headerText(itIs ? 'Select/Add location' : 'Locations');
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
            this.app.goBack(this.requestInfo);
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
                this.app.shell.showActivity('locationEdition', {
                    create: options.route.segments[1] // 'serviceRadius', 'serviceLocation'
                });
            }
            else {
                this.app.shell.showActivity('locationEdition', {
                    locationID: id
                });
            }
        }
    }
};

function ViewModel() {

    this.headerText = ko.observable('Locations');

    // Full list of locations
    this.locations = ko.observableArray([]);

    // Especial mode when instead of pick and edit we are just selecting
    // (when editing an appointment)
    this.isSelectionMode = ko.observable(false);

    this.selectedLocation = ko.observable(null);
    
    this.selectLocation = function(selectedLocation) {
        
        this.selectedLocation(selectedLocation);
        this.isSelectionMode(false);

    }.bind(this);
}

},{"../testdata/locations":40,"knockout":false}],13:[function(require,module,exports){
/**
    Index activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    NavAction = require('../viewmodels/NavAction'),
    User = require('../models/User');

var singleton = null;

exports.init = function initLogin($activity, app) {

    if (singleton === null)
        singleton = new LoginActivity($activity, app);
    
    return singleton;
};

function LoginActivity($activity, app) {

    this.$activity = $activity;
    this.app = app;
    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));
    
    this.navAction = NavAction.goBack;
    
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
                
                this.app.goDashboard();

            }.bind(this)).catch(function() {
                
                this.dataView.loginError('Invalid username or password');
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
    
    // NOTE: direclty editing the app status.
    this.app.status('login');
};

function ViewModel() {
    
    this.username = ko.observable('');
    this.password = ko.observable('');
    this.loginError = ko.observable('');
    
    this.isLogingIn = ko.observable(false);
    
    this.performLogin = function performLogin() {

        this.isLogingIn(true);        
    }.bind(this);
    
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

},{"../models/User":36,"../viewmodels/NavAction":54,"knockout":false}],14:[function(require,module,exports){
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

    this.$activity = $activity;
    this.app = app;
    
    this.navAction = null;
}

OnboardingCompleteActivity.prototype.show = function show(options) {

};

},{}],15:[function(require,module,exports){
/**
    OnboardingHome activity
**/
'use strict';

var singleton = null;

exports.init = function initOnboardingHome($activity, app) {

    if (singleton === null)
        singleton = new OnboardingHomeActivity($activity, app);
    
    return singleton;
};

function OnboardingHomeActivity($activity, app) {

    this.$activity = $activity;
    this.app = app;
    
    this.navAction = null;
}

OnboardingHomeActivity.prototype.show = function show(options) {

};

},{}],16:[function(require,module,exports){
/**
    Positions activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    NavAction = require('../viewmodels/NavAction');

var singleton = null;

exports.init = function initPositions($activity, app) {

    if (singleton === null)
        singleton = new PositionsActivity($activity, app);
    
    return singleton;
};

function PositionsActivity($activity, app) {

    this.$activity = $activity;
    this.app = app;
    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));

    // TestingData
    setSomeTestingData(this.dataView);

    // Object to hold the options passed on 'show' as a result
    // of a request from another activity
    this.requestInfo = null;
    
    this.navAction = NavAction.newItem;
}

PositionsActivity.prototype.show = function show(options) {
 
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
},{"../models/Position":33,"../viewmodels/NavAction":54,"knockout":false}],17:[function(require,module,exports){
/**
    services activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout');
    
var singleton = null;

exports.init = function initServices($activity, app) {

    if (singleton === null)
        singleton = new ServicesActivity($activity, app);
    
    return singleton;
};

function ServicesActivity($activity, app) {

    this.app = app;
    this.$activity = $activity;
    this.$listView = $activity.find('#servicesListView');

    var dataView = this.dataView = new ViewModel();
    ko.applyBindings(dataView, $activity.get(0));

    // TestingData
    dataView.services(require('../testdata/services').services.map(Selectable));
    
    // Handler to update header based on a mode change:
    this.dataView.isSelectionMode.subscribe(function (itIs) {
        this.dataView.headerText(itIs ? 'Select service(s)' : 'Services');
    }.bind(this));

    // Object to hold the options passed on 'show' as a result
    // of a request from another activity
    this.requestInfo = null;
    
    // Handler to go back with the selected service when 
    // selection mode goes off and requestInfo is for
    // 'select mode'
    this.dataView.isSelectionMode.subscribe(function (itIs) {
        // We have a request and
        // it requested to select a service
        // and selection mode goes off
        if (this.requestInfo &&
            this.requestInfo.selectServices === true &&
            itIs === false) {
            
            // Pass the selected client in the info
            this.requestInfo.selectedServices = this.dataView.selectedServices();
            // And go back
            this.app.goBack(this.requestInfo);
            // Last, clear requestInfo
            this.requestInfo = null;
        }
    }.bind(this));
}

ServicesActivity.prototype.show = function show(options) {

  
    options = options || {};
    this.requestInfo = options;

    if (options.selectServices === true) {
        this.dataView.isSelectionMode(true);
        
        /* Trials to presets the selected services, NOT WORKING
        var services = (options.selectedServices || []);
        var selectedServices = this.dataView.selectedServices;
        selectedServices.removeAll();
        this.dataView.services().forEach(function(service) {
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

    this.headerText = ko.observable('Services');

    // Full list of services
    this.services = ko.observableArray([]);

    // Especial mode when instead of pick and edit we are just selecting
    // (when editing an appointment)
    this.isSelectionMode = ko.observable(false);

    // Grouped list of pricings:
    // Defined groups: regular services and add-ons
    this.groupedServices = ko.computed(function(){

        var services = this.services();

        var servicesGroup = {
                group: 'Services',
                services: []
            },
            addonsGroup = {
                group: 'Add-on services',
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

},{"../testdata/services":42,"knockout":false}],18:[function(require,module,exports){
/**
    Signup activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    NavAction = require('../viewmodels/NavAction');

var singleton = null;

exports.init = function initSignup($activity, app) {

    if (singleton === null)
        singleton = new SignupActivity($activity, app);
    
    return singleton;
};

function SignupActivity($activity, app) {

    this.$activity = $activity;
    this.app = app;
    this.dataView = new ViewModel();
    ko.applyBindings(this.dataView, $activity.get(0));
    
    this.navAction = NavAction.goBack;
    
    // TODO: implement real login
    // TESTING: the button state with a fake delay
    $activity.find('#accountSignUpBtn').on('click', function (e) {
        var $btn = $(e.target).button('loading');

        setTimeout(function() {
        
            $btn.button('reset');
            
            // TESTING: populating user
            fakeSignup(this.app);
          
            // NOTE: onboarding or not?
            var onboarding = false;
            if (onboarding) {
                this.app.go('onboardingHome');
            }
            else {
                this.app.go('home');
            }
        }, 1000);

        return false;
    }.bind(this));
}

SignupActivity.prototype.show = function show(options) {

    if (options && options.route &&
        options.route.segments &&
        options.route.segments.length) {
        this.dataView.profile(options.route.segments[0]);
    }
};

// TODO: remove after implement real login
function fakeSignup(app) {
    app.model.user({ // new User({}
        email: ko.observable('test@loconomics.com'),
        firstName: ko.observable('Username'),
        onboardingStep: ko.observable(null),
        userType: ko.observable('p')
    });
}

function ViewModel() {
    this.profile = ko.observable('customer');
}
},{"../viewmodels/NavAction":54,"knockout":false}],19:[function(require,module,exports){
/**
    textEditor activity
**/
'use strict';

var $ = require('jquery'),
    ko = require('knockout'),
    EventEmitter = require('events').EventEmitter;
    
var singleton = null;

exports.init = function initTextEditor($activity, app) {
    
    if (singleton === null)
        singleton = new TextEditorActivity($activity, app);
    
    return singleton;
};

function TextEditorActivity($activity, app) {

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
        this.app.goBack(this.requestInfo);
    }.bind(this));
 
    // Handler the cancel event
    this.dataView.on('cancel', function() {
        // return, nothing changed
        app.goBack();
    }.bind(this));
}

TextEditorActivity.prototype.show = function show(options) {
    
    options = options || {};
    this.requestInfo = options;

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

},{"events":false,"knockout":false}],20:[function(require,module,exports){
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
var Shell = require('./utils/Shell'),
    NavAction = require('./viewmodels/NavAction'),
    AppModel = require('./viewmodels/AppModel');

/** Custom Loconomics 'locale' styles for date/times **/
var moment = require('moment');
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
// Left normal english as default:
moment.locale('en-US');

/** app static class **/
var app = new Shell();
// TODO app must to be a plain object with shell as property, not a shell instance
app.shell = app;

// New app model, that starts with anonymous user
app.model = new AppModel();

// Shortcut to UserType enumeration used to set permissions
app.UserType = app.model.user().constructor.UserType;

// Updating app status on user changes
function updateStatesOnUserChange() {

    var user = app.model.user();

    if (user.onboardingStep()) {
        app.status('onboarding');
    }
    else if (user.isAnonymous()) {
        app.status('out');
    }
    else {
        app.status('in');
    }
}
app.model.user().isAnonymous.subscribe(updateStatesOnUserChange);
app.model.user().onboardingStep.subscribe(updateStatesOnUserChange);

/** Load activities **/
app.activities = {
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
    'learnMore': require('./activities/learnMore'),
    'signup': require('./activities/signup'),
    'contactInfo': require('./activities/contactInfo'),
    'positions': require('./activities/positions'),
    'onboardingHome': require('./activities/onboardingHome'),
    'locationEdition': require('./activities/locationEdition'),
    'onboardingComplete': require('./activities/onboardingComplete')
};

/** Page ready **/
$(function() {
    
    // Enabling the 'layoutUpdate' jQuery Window event that happens on resize and transitionend,
    // and can be triggered manually by any script to notify changes on layout that
    // may require adjustments on other scripts that listen to it.
    // The event is throttle, guaranting that the minor handlers are executed rather
    // than a lot of them in short time frames (as happen with 'resize' events).
    layoutUpdateEvent.on();
    
    // NOTE: Safari iOS bug workaround, min-height/height on html doesn't work as expected,
    // getting bigger than viewport. May be a problem only on Safari and not in 
    // the WebView, double check.
    var iOS = /(iPad|iPhone|iPod)/g.test( navigator.userAgent );
    if (iOS) {
        $('html').height(window.innerHeight + 'px');
        $(window).on('layoutUpdate', function() {
            $('html').height(window.innerHeight + 'px');
        });
    }
    
    // Account log-out: this doesn't need an activity, so
    // we add manually a route for that
    app.shell.specialRoutes.logout = function(route) {
        
        app.model.logout().then(function() {
            // Anonymous user again
            app.model.user().model.updateWith(
                app.model.user().constructor.newAnonymous()
            );
            
            // Go index
            app.shell.go('#!');
        });
    };
    
    // New app method: goDashboard, just redirect the better
    // place for current user and state
    app.goDashboard = function goDashboard() {
        var onboarding = this.model.user().onboardingStep();
        if (onboarding) {
            this.shell.go('onboardingHome/' + onboarding);
        }
        else {
            this.shell.go('home');
        }
    };
    
    // Set-up access control for the shell
    app.shell.accessControl = require('./utils/accessControl')(app);
    
    // Load Knockout binding helpers
    bootknock.plugIn(ko);

    // App set-up
    app.shell.baseUrl = 'activities/';
    app.shell.defaultNavAction = NavAction.goHome;
    app.model.init().then(
        app.shell.init.bind(app.shell)
    ).then(function() {
        // Mark the page as ready
        $('html').addClass('is-ready');
        
        app.goDashboard();
    });
    
    // DEBUG
    window.app = app;
});

},{"./activities/appointment":2,"./activities/bookingConfirmation":3,"./activities/calendar":4,"./activities/clients":5,"./activities/contactInfo":6,"./activities/datetimePicker":7,"./activities/home":8,"./activities/index":9,"./activities/learnMore":10,"./activities/locationEdition":11,"./activities/locations":12,"./activities/login":13,"./activities/onboardingComplete":14,"./activities/onboardingHome":15,"./activities/positions":16,"./activities/services":17,"./activities/signup":18,"./activities/textEditor":19,"./utils/Function.prototype._delayed":44,"./utils/Function.prototype._inherits":45,"./utils/Shell":47,"./utils/accessControl":49,"./utils/bootknockBindingHelpers":50,"./viewmodels/AppModel":53,"./viewmodels/NavAction":54,"es6-promise":false,"knockout":false,"moment":false}],21:[function(require,module,exports){
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

},{}],22:[function(require,module,exports){
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

},{"./Client":25,"./Location":28,"./Model":31,"./Service":34,"knockout":false,"moment":false}],23:[function(require,module,exports){
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
        var t = this.time() && moment(this.time()).format(this.timeFormat()) || '';        
        return this.concept() + t;
    }, this);

}

module.exports = BookingSummary;

},{"./Model":31,"knockout":false,"moment":false}],24:[function(require,module,exports){
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

},{"./Client":25,"./Model":31,"knockout":false}],25:[function(require,module,exports){
/** Client model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model');

function Client(values) {
    
    Model(this);
    
    this.model.defProperties({
        firstName: '',
        lastName: ''
    }, values);

    this.fullName = ko.computed(function() {
        return (this.firstName() + ' ' + this.lastName());
    }, this);
}

module.exports = Client;

},{"./Model":31,"knockout":false}],26:[function(require,module,exports){
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

},{"./ListViewItem":27,"./Model":31,"knockout":false}],27:[function(require,module,exports){
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

},{"./Model":31,"knockout":false,"moment":false}],28:[function(require,module,exports){
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

},{"./Model":31,"knockout":false}],29:[function(require,module,exports){
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

},{"./Model":31,"knockout":false,"lodash":false,"moment":false}],30:[function(require,module,exports){
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

},{"./Model":31,"knockout":false,"moment":false}],31:[function(require,module,exports){
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

Model.prototype.updateWith = function updateWith(data) {
    
    // We need a plain object for 'fromJS'.
    // If is a model, extract their properties and fields from
    // the observables (fromJS), so we not get computed
    // or functions, just registered properties and fields
    if (data && data.model instanceof Model) {
        
        var plain = {};

        data.model.propertiesList.forEach(function(property) {
            // Properties are observables, so functions without params:
            plain[property] = data[property]();
        });
        
        data.model.fieldsList.forEach(function(field) {
            // Fields are just plain object members for values, just copy:
            plain[field] = data[field];
        });

        data = plain;
    }

    ko.mapping.fromJS(data, this.mappingOptions, this.modelObject);
};

},{"knockout":false,"knockout.mapping":false}],32:[function(require,module,exports){
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

},{"./ListViewItem":27,"./Model":31,"knockout":false,"moment":false,"numeral":1}],33:[function(require,module,exports){
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

},{"./Model":31,"knockout":false}],34:[function(require,module,exports){
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

},{"./Model":31,"knockout":false}],35:[function(require,module,exports){
/** UpcomingBookingsSummary model **/
'use strict';

var ko = require('knockout'),
    Model = require('./Model'),
    BookingSummary = require('./BookingSummary');

function UpcomingBookingsSummary() {

    Model(this);

    this.today = new BookingSummary({
        concept: 'left today',
        timeFormat: ' [ending @] h:mma'
    });
    this.tomorrow = new BookingSummary({
        concept: 'tomorrow',
        timeFormat: ' [starting @] h:mma'
    });
    this.nextWeek = new BookingSummary({
        concept: 'next week'
    });
    
    this.items = ko.pureComputed(function() {
        var items = [];
        
        if (this.today.quantity())
            items.push(this.today);
        if (this.tomorrow.quantity())
            items.push(this.tomorrow);
        if (this.nextWeek.quantity())
            items.push(this.nextWeek);

        return items;
    }, this);
    
}

module.exports = UpcomingBookingsSummary;

},{"./BookingSummary":23,"./Model":31,"knockout":false}],36:[function(require,module,exports){
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
        lastName: '',
        isCustomer: false,
        isProvider: false,
        isAdmin: false,
        onboardingStep: null
    }, values);

    this.fullName = ko.computed(function() {
        return (this.firstName() + ' ' + this.lastName());
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

},{"./Model":31,"knockout":false}],37:[function(require,module,exports){
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

},{"../models/Appointment":22,"./locations":40,"./services":42,"knockout":false,"moment":false}],38:[function(require,module,exports){
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
        link: '#!calendar/new',

        actionIcon: 'glyphicon glyphicon-plus',
        actionText: null,

        classNames: 'ListView-item--tag-success'
    }),
    new CalendarSlot({
        startTime: new Time(today, 12, 0, 0),
        endTime: new Time(today, 13, 0, 0),
        
        subject: 'Josh Danielson',
        description: 'Deep Tissue Massage',
        link: '#!calendar/appointment/3',

        actionIcon: 'glyphicon glyphicon-plus',
        actionText: null,

        classNames: null
    }),
    new CalendarSlot({
        startTime: new Time(today, 13, 0, 0),
        endTime: new Time(today, 15, 0, 0),

        subject: 'Do that important thing',
        description: null,
        link: '#!calendar/event/8',

        actionIcon: 'glyphicon glyphicon-new-window',
        actionText: null,

        classNames: null
    }),
    new CalendarSlot({
        startTime: new Time(today, 15, 0, 0),
        endTime: new Time(today, 16, 0, 0),
        
        subject: 'Iago Lorenzo',
        description: 'Deep Tissue Massage Long Name',
        link: '#!calendar/appointment/5',

        actionIcon: null,
        actionText: '$159.90',

        classNames: null
    }),
    new CalendarSlot({
        startTime: new Time(today, 16, 0, 0),
        endTime: new Time(today, 0, 0, 0),
        
        subject: 'Free',
        description: null,
        link: '#!calendar/new',

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
        link: '#!calendar/new',

        actionIcon: 'glyphicon glyphicon-plus',
        actionText: null,

        classNames: 'ListView-item--tag-success'
    }),
    new CalendarSlot({
        startTime: new Time(tomorrow, 9, 0, 0),
        endTime: new Time(tomorrow, 10, 0, 0),
        
        subject: 'Jaren Freely',
        description: 'Deep Tissue Massage Long Name',
        link: '#!calendar/appointment/1',

        actionIcon: null,
        actionText: '$59.90',

        classNames: null
    }),
    new CalendarSlot({
        startTime: new Time(tomorrow, 10, 0, 0),
        endTime: new Time(tomorrow, 11, 0, 0),
        
        subject: 'Free',
        description: null,
        link: '#!calendar/new',

        actionIcon: 'glyphicon glyphicon-plus',
        actionText: null,

        classNames: 'ListView-item--tag-success'
    }),
    new CalendarSlot({
        startTime: new Time(tomorrow, 11, 0, 0),
        endTime: new Time(tomorrow, 12, 45, 0),
        
        subject: 'CONFIRM-Susan Dee',
        description: 'Deep Tissue Massage',
        link: '#!calendar/appointment/2',

        actionIcon: null,
        actionText: '$70',

        classNames: 'ListView-item--tag-warning'
    }),
    new CalendarSlot({
        startTime: new Time(tomorrow, 12, 45, 0),
        endTime: new Time(tomorrow, 16, 0, 0),
        
        subject: 'Free',
        description: null,
        link: '#!calendar/new',

        actionIcon: 'glyphicon glyphicon-plus',
        actionText: null,

        classNames: 'ListView-item--tag-success'
    }),
    new CalendarSlot({
        startTime: new Time(tomorrow, 16, 0, 0),
        endTime: new Time(tomorrow, 17, 15, 0),
        
        subject: 'Susan Dee',
        description: 'Deep Tissue Massage',
        link: '#!calendar/appointment/3',

        actionIcon: 'glyphicon glyphicon-plus',
        actionText: null,

        classNames: null
    }),
    new CalendarSlot({
        startTime: new Time(tomorrow, 17, 15, 0),
        endTime: new Time(tomorrow, 18, 30, 0),
        
        subject: 'Dentist appointment',
        description: null,
        link: '#!calendar/event/4',

        actionIcon: 'glyphicon glyphicon-new-window',
        actionText: null,

        classNames: null
    }),
    new CalendarSlot({
        startTime: new Time(tomorrow, 18, 30, 0),
        endTime: new Time(tomorrow, 19, 30, 0),
        
        subject: 'Susan Dee',
        description: 'Deep Tissue Massage Long Name',
        link: '#!calendar/appointment/5',

        actionIcon: null,
        actionText: '$159.90',

        classNames: null
    }),
    new CalendarSlot({
        startTime: new Time(tomorrow, 19, 30, 0),
        endTime: new Time(tomorrow, 23, 0, 0),
        
        subject: 'Free',
        description: null,
        link: '#!calendar/new',

        actionIcon: 'glyphicon glyphicon-plus',
        actionText: null,

        classNames: 'ListView-item--tag-success'
    }),
    new CalendarSlot({
        startTime: new Time(tomorrow, 23, 0, 0),
        endTime: new Time(tomorrow, 0, 0, 0),

        subject: 'Jaren Freely',
        description: 'Deep Tissue Massage',
        link: '#!calendar/appointment/6',

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
        link: '#!calendar/new',

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

},{"../models/CalendarSlot":24,"../utils/Time":48,"moment":false}],39:[function(require,module,exports){
/** Clients test data **/
var Client = require('../models/Client');

var testData = [
    new Client ({
        firstName: 'Joshua',
        lastName: 'Danielson'
    }),
    new Client({
        firstName: 'Iago',
        lastName: 'Lorenzo'
    }),
    new Client({
        firstName: 'Fernando',
        lastName: 'Gago'
    }),
    new Client({
        firstName: 'Adam',
        lastName: 'Finch'
    }),
    new Client({
        firstName: 'Alan',
        lastName: 'Ferguson'
    }),
    new Client({
        firstName: 'Alex',
        lastName: 'Pena'
    }),
    new Client({
        firstName: 'Alexis',
        lastName: 'Peaca'
    }),
    new Client({
        firstName: 'Arthur',
        lastName: 'Miller'
    })
];

exports.clients = testData;

},{"../models/Client":25}],40:[function(require,module,exports){
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

},{"../models/Location":28}],41:[function(require,module,exports){
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
        createdDate: new Time(today, 11, 0, 0),
        
        subject: 'CONFIRM-Susan Dee',
        content: 'Deep Tissue Massage',
        link: '#messages/inbox/1',

        actionIcon: null,
        actionText: '$70',

        classNames: 'ListView-item--tag-warning'
    }),
    new Message({
        createdDate: new Time(yesterday, 13, 0, 0),

        subject: 'Do you do "Exotic Massage"?',
        content: 'Hi, I wanted to know if you perform as par of your services...',
        link: '#messages/inbox/3',

        actionIcon: 'glyphicon glyphicon-share-alt',
        actionText: null,

        classNames: null
    }),
    new Message({
        createdDate: new Time(lastWeek, 12, 0, 0),
        
        subject: 'Josh Danielson',
        content: 'Deep Tissue Massage',
        link: '#messages/inbox/2',

        actionIcon: 'glyphicon glyphicon-plus',
        actionText: null,

        classNames: null
    }),
    new Message({
        createdDate: new Time(oldDate, 15, 0, 0),
        
        subject: 'Inquiry',
        content: 'Another question from another client.',
        link: '#messages/inbox/4',

        actionIcon: 'glyphicon glyphicon-share-alt',

        classNames: null
    })
];

exports.messages = testData;

},{"../models/Message":30,"../utils/Time":48,"moment":false}],42:[function(require,module,exports){
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

},{"../models/Service":34}],43:[function(require,module,exports){
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

},{"../utils/Time":48,"moment":false}],44:[function(require,module,exports){
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

},{}],45:[function(require,module,exports){
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

},{}],46:[function(require,module,exports){
/**
    REST API access
**/
'use strict';
var $ = require('jquery');

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
    
    return Promise.resolve($.ajax({
        url: this.baseUrl + apiUrl,
        dataType: 'json',
        method: httpMethod,
        headers: this.extraHeaders,
        // URLENCODED input:
        data: data,
        contentType: contentType || 'application/x-www-form-urlencoded'
        // Alternate: JSON as input
        //data: JSON.stringify(data),
        //contentType: contentType || 'application/json'
    })).catch(function(err) {
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

},{}],47:[function(require,module,exports){
/**
    The Shell that manages activities.
**/
'use strict';
var $ = require('jquery'),
    ko = require('knockout'),
    escapeRegExp = require('./escapeRegExp'),
    NavAction = require('../viewmodels/NavAction'),
    getUrlQuery = require('../utils/getUrlQuery');

var shell = {

    currentZIndex: 1,
    
    history: [],
    
    baseUrl: '',
    
    /**
        A function to decide if the
        access is allowed (return true)
        or not (return false)
    **/
    accessControl: function(activity) {
        // allow access by default
        return true;
    },
    
    nonAccessActivity: 'index',
    
    activities: {},
    
    navAction: ko.observable(null),
    
    status: ko.observable('out'), // 'out', 'login', 'onboarding', 'in'
    
    defaultNavAction: null,

    specialRoutes: {
        'go-back': function (route) {
            // go back in history, almost one
            this.goBack();
            
            // go back x times:
            var num = parseInt(route.segments[0], 10);
            if (num > 0) {
                while(num-->1) {
                    this.goBack();
                }
            }
        }
    },

    unexpectedError: function unexpectedError(error) {
        // TODO: enhance with dialog
        var str = typeof(error) === 'string' ? error : JSON.stringify(error);
        console.error('Unexpected error', error);
        window.alert(str);
    },
    
    updateAppNav: function updateAppNav(activity) {
        // navAction, if the activity has its own
        if ('navAction' in activity) {
            // Use specializied activity action
            this.navAction(activity.navAction);
        }
        else {
            // Use default action
            this.navAction(this.defaultNavAction);
        }
    },

    loadActivity: function loadActivity(activityName) {
        return new Promise(function(resolve, reject) {
            var $act = this.findActivityElement(activityName);
            if ($act.length) {
                resolve($act);
            }
            else {
                $.ajax({
                    url: this.baseUrl + activityName + '.html',
                    cache: false,
                    // We are loading the program, so any in between interaction
                    // will be problematic.
                    async: false
                }).then(function(html) {
                    // http://stackoverflow.com/a/12848798
                    var body = '<div id="body-mock">' + html.replace(/^[\s\S]*<body.*?>|<\/body>[\s\S]*$/g, '') + '</div>';
                    var $h = $($.parseHTML(body));
                    //var $h = $($.parseHTML(html));
                    $act = this.findActivityElement(activityName, $h);
                    if ($act.length) {
                        $('body').append($act);
                        resolve($act);
                    }
                    else {
                        reject(Error('Activity not found in the source file.'));
                    }
                    
                }.bind(this), reject);
            }
        }.bind(this));
    },
    
    findActivityElement: function findActivityElement(activityName, $root) {
        $root = $root || $(document);
        // TODO: secure name parsing for css selector
        return $root.find('[data-activity="' + activityName + '"]');
    },
    
    showActivity: function showActivity(activityName, options) {
        // Ensure its loaded, and do anything later
        return this.loadActivity(activityName).then(function($activity) {
            
            $activity.css('zIndex', ++this.currentZIndex).show();
            var currentActivity = this.history[this.history.length - 1];
            
            if (currentActivity)
                this.unfocus(currentActivity.$activity);
            
            // FUTURE: HistoryAPI.pushState(..)
            
            this.history.push({
                name: activityName,
                $activity: $activity,
                options: options
            });
            
            var act = this.activities[activityName].init($activity, this);
            if (this.accessControl(act)) {
                act.show(options);

                this.updateAppNav(act);

                // Avoid going to the same activity
                if (currentActivity &&
                    currentActivity.name !== activityName) {
                    this.hideActivity(currentActivity.name);
                }
            } else {
                // redirect
                this.go(this.nonAccessActivity);
            }

        }.bind(this)).catch(this.unexpectedError);
    },
    
    popActivity: function popActivity(activityName, options) {
        
        return (
            this.showActivity(activityName, options)
            .then(function() {
                // Poping an activity on top of another means we want
                // to quick go back rather than the activity default navAction:
                this.navAction(NavAction.goBack);
            }.bind(this))
        );
    },

    hideActivity: function hideActivity(activityName) {

        var $activity = this.findActivityElement(activityName);
        $activity.hide();
    },
    
    goBack: function goBack(options) {

        // If there is no a previous activity to navigate to,
        // go to the index
        if (this.history.length < 1) {
            this.showActivity('index', options);
            return;
        }
        
        // TODO: deduplicate code between this and showActivity
        var currentActivity = this.history.pop();
        
        var previousActivity = this.history[this.history.length - 1];
        var activityName = previousActivity.name;
        this.currentZIndex--;
        
        // If there are no explicit options, use the currentActivity options
        // to enable the communication between activities:
        options = options || currentActivity.options;
        
        if (currentActivity)
            this.unfocus(currentActivity.$activity);
        
        // Ensure its loaded, and do anything later
        this.loadActivity(activityName).then(function($activity) {
            
            $activity.show();
            
            // FUTURE: Going to the previous activity with HistoryAPI
            // must replaceState with new 'options'?
            
            var act = this.activities[activityName].init($activity, this);
            if (this.accessControl(act)) {
                act.show(options);

                this.updateAppNav(act);

                // Avoid going to the same activity
                if (currentActivity &&
                    currentActivity.name !== activityName) {
                    this.hideActivity(currentActivity.name);
                }
            } else {
                // redirect
                this.go(this.nonAccessActivity);
            }

        }.bind(this)).catch(this.unexpectedError);
    },
    
    unfocus: function unfocus($el) {
        // blur any focused text box to force to close the on-screen keyboard,
        // or any other unwanted interaction (normally used when closing
        // an activity, hiding an element, so it must not be focused).
        if ($el && $el.find)
            $el.find(':focus').blur();
    },
    
    parseActivityLink: function getActivityFromLink(link) {
        
        link = link || '';
        
        // hashbang support: remove the #! and use the rest as the link
        link = link.replace(/^#!/, '');

        // Remove the baseUrl to get the app base.
        var path = link.replace(new RegExp('^' + escapeRegExp(this.baseUrl), 'i'), '');
        //var activityName = path.split('/')[1] || '';
        // Get first segment or page name (anything until a slash or extension beggining)
        var match = /^\/?([^\/\.]+)[^\/]*(\/.*)*$/.exec(path);
        
        var parsed = {
            root: true,
            activity: null,
            segments: null,
            path: null,
            link: link,
            // URL Query as an object, empty object if no query
            query: getUrlQuery(link || '?')
        };
        
        if (match) {
            parsed.root = false;
            if (match[1]) {
                parsed.activity = match[1];

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
    },
    
    /** Route a link throught activities.
        Returns true if was routed and false if not
    **/
    route: function route(link, mode) {
        
        var parsedLink = this.parseActivityLink(link);
        var modeMethod = mode && mode === 'pop' ? 'popActivity' : 'showActivity';
        
        // Initially, not found:
        parsedLink.found = false;
        
        // Check if is not root
        if (parsedLink.activity) {
            //  and the activity is registered
            if (this.activities.hasOwnProperty(parsedLink.activity)) {
            
                // Show the activity passing the route options
                this[modeMethod](parsedLink.activity, {
                    route: parsedLink
                });

                parsedLink.found = true;
            }
            //  or is a special route
            else if (this.specialRoutes.hasOwnProperty(parsedLink.activity)) {
                
                this.specialRoutes[parsedLink.activity].call(this, parsedLink);
                
                parsedLink.found = true;
            }
        }
        else if (parsedLink.root) {
            // Root page 'index'
            this[modeMethod]('index', {
                route: parsedLink
            });
        }
        
        return parsedLink;
    },
    
    /* Convenient way to navigate to an internal link,
        updating location and routing.
        NOTE: right now is just a location.hash change, with the
        handler on init listening properly */
    go: function go(link) {
        var l = /#!/.test(link) ? link : '#!' + link;
        window.location.hash = l;
    },
    
    updateMenu: function updateMenu(name) {
        
        var $menu = this.$menu;
        
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
    },

    init: function init() {

        // Menu
        this.$menu = $('#navbar');
        
        // Visualize the activity that matches current URL
        // NOTE: using the hash for history management, rather
        // than document.location.pathname
        var currentRoute = this.route(document.location.hash);
        if (currentRoute.found)
            this.updateMenu(currentRoute.activity);
        
        // Flag to mark processing to avoid double execution
        // because of hashchange-event, manual routed links
        // programatic change with route to location
        var latestProcessedLink = null;

        var routeLink = function routeLink(link, e, mode) {
            // Its processed already, do nothing
            if (link === latestProcessedLink) {
                return;
            }
            latestProcessedLink = link;

            // Route it
            var parsedLink = this.route(link, mode);
            if (parsedLink.found) {

                this.updateMenu(parsedLink.activity);
                
                if (!/#!/.test(link)) {
                    e.preventDefault();
                }
                else if (parsedLink.root) {
                    // NOTE: using the hash for history management, going to root
                    window.location.hash = '';
                }
            }
        }.bind(this);
        
        // Route pressed links
        $(document).on('tap', 'a, [data-href]', function(e) {
            // Get Link
            var link = e.currentTarget.getAttribute('href') || e.currentTarget.getAttribute('data-href');
            var mode = e.currentTarget.getAttribute('data-shell');
            routeLink(link, e, mode);
        });

        $(window).on('hashchange', function(e) {
            routeLink(window.location.hash, e);
        });
        
        // NOTE: this view model, in Shell or in app.js?
        // Set model for the AppNav
        ko.applyBindings({
            navAction: this.navAction,
            status: this.status
        }, $('.AppNav').get(0));
    }
};

module.exports = function Shell() {
    return Object.create(shell);
};

},{"../utils/getUrlQuery":52,"../viewmodels/NavAction":54,"./escapeRegExp":51,"knockout":false}],48:[function(require,module,exports){
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

},{}],49:[function(require,module,exports){
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
    
    return function accessControl(activity) {

        var user = app.model.user();
        var currentType = user && user.userType();

        if (activity && typeof(activity.accessLevel) !== 'undefined') {

            return !!(activity.accessLevel & currentType);
        }
        else {
            // On nothing, just allow
            return true;
        }
    };
};

},{"../models/User":36}],50:[function(require,module,exports){
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

},{}],51:[function(require,module,exports){
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

},{}],52:[function(require,module,exports){
/**
    Read a page's GET URL variables and return them as an associative array.
**/
'user strict';
//global window

module.exports = function getUrlQuery(url) {

    url = url || window.location.href;

    var vars = [], hash;
    var hashes = url.slice(url.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
};

},{}],53:[function(require,module,exports){
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
    //this.rest = new Rest('http://dev.loconomics.com/en-US/rest/');
    this.rest = new Rest('http://localhost/source/en-US/rest/');
    
    // Setup Rest authentication
    this.rest.onAuthorizationRequired = function(retry) {
        
        this.tryLogin()
        .then(function() {
            // Logged! Just retry
            retry();
        });
    }.bind(this);
    
    // first time login
    // First attempt to login from saved credentials
    var firstTimeLogin = new Promise(function(resolve, reject) {
        // We just want to check if can get logged.
        // Any result, just return success:
        this.tryLogin().then(resolve, function(doesnMatter){
            // just resolve without error (passing in the error
            // will make the process to fail)
            resolve();
        });
    }.bind(this));
    
    return Promise.all([
        // Local data
        localforage.config({
            name: 'LoconomicsApp',
            version: 0.1,
            size : 4980736, // Size of database, in bytes. WebSQL-only for now.
            storeName : 'keyvaluepairs',
            description : 'Loconomics App',
            driver: localforage.INDEXEDDB
        }),
        firstTimeLogin
    ]);
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
        
    return this.rest.post('login', {
        username: username,
        password: password
    }).then(function(logged) {
        console.log('logged!', logged);
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
            password: password
        });
        
        // Set user data
        // TODO Get User info
        fakeLogin(this.user());
        this.user().userID(logged.userId);
        this.user().email(username);

        return logged;
    }.bind(this));
};

// TODO: remove after implement real login
function fakeLogin(user) {
    user.model.updateWith(
        new User({
            firstName: 'Username',
            onboardingStep: null,
            isProvider: true
        })
    );
}
    
AppModel.prototype.logout = function logout() {
        
    return this.rest.post('logout').then(function() {

        this.rest.extraHeaders = null;
        localforage.removeItem('credentials');
    }.bind(this));
};

module.exports = AppModel;

},{"../models/Model":31,"../models/User":36,"../utils/Rest":46,"knockout":false,"localforage":false}],54:[function(require,module,exports){
/** NavAction view model.
    It allows set-up per activity for the AppNav action button.
**/
var ko = require('knockout'),
    Model = require('../models/Model');

function NavAction(values) {
    
    Model(this);
    
    this.model.defProperties({
        link: '',
        icon: ''
    }, values);
}

module.exports = NavAction;

/** Static, shared actions **/
NavAction.goHome = new NavAction({
    link: '/',
    icon: 'glyphicon glyphicon-home'
});

NavAction.goBack = new NavAction({
    link: '#!go-back',
    icon: 'glyphicon glyphicon-arrow-left'
});

NavAction.newItem = new NavAction({
    link: '#!new',
    icon: 'glyphicon glyphicon-plus'
});

NavAction.newCalendarItem = new NavAction({
    link: '#!calendar/new',
    icon: 'glyphicon glyphicon-plus'
});

},{"../models/Model":31,"knockout":false}]},{},[20])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvbm9kZV9tb2R1bGVzL251bWVyYWwvbnVtZXJhbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYXBwb2ludG1lbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2Jvb2tpbmdDb25maXJtYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2NhbGVuZGFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9jbGllbnRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9jb250YWN0SW5mby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvZGF0ZXRpbWVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2hvbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2luZGV4LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9sZWFybk1vcmUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2xvY2F0aW9uRWRpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvbG9jYXRpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9sb2dpbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvb25ib2FyZGluZ0NvbXBsZXRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9vbmJvYXJkaW5nSG9tZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvcG9zaXRpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9zZXJ2aWNlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvc2lnbnVwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy90ZXh0RWRpdG9yLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYXBwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvY29tcG9uZW50cy9EYXRlUGlja2VyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0FwcG9pbnRtZW50LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0Jvb2tpbmdTdW1tYXJ5LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0NhbGVuZGFyU2xvdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9DbGllbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvR2V0TW9yZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9MaXN0Vmlld0l0ZW0uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvTG9jYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvTWFpbEZvbGRlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9NZXNzYWdlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL01vZGVsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1BlcmZvcm1hbmNlU3VtbWFyeS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9Qb3NpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9TZXJ2aWNlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1VwY29taW5nQm9va2luZ3NTdW1tYXJ5LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL1VzZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9jYWxlbmRhckFwcG9pbnRtZW50cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3Rlc3RkYXRhL2NhbGVuZGFyU2xvdHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9jbGllbnRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdGVzdGRhdGEvbG9jYXRpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdGVzdGRhdGEvbWVzc2FnZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9zZXJ2aWNlcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3Rlc3RkYXRhL3RpbWVTbG90cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL0Z1bmN0aW9uLnByb3RvdHlwZS5fZGVsYXllZC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL0Z1bmN0aW9uLnByb3RvdHlwZS5faW5oZXJpdHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9SZXN0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvU2hlbGwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9UaW1lLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvYWNjZXNzQ29udHJvbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL2Jvb3Rrbm9ja0JpbmRpbmdIZWxwZXJzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvZXNjYXBlUmVnRXhwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvZ2V0VXJsUXVlcnkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9OYXZBY3Rpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdnFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4cEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIG51bWVyYWwuanNcbiAqIHZlcnNpb24gOiAxLjUuM1xuICogYXV0aG9yIDogQWRhbSBEcmFwZXJcbiAqIGxpY2Vuc2UgOiBNSVRcbiAqIGh0dHA6Ly9hZGFtd2RyYXBlci5naXRodWIuY29tL051bWVyYWwtanMvXG4gKi9cblxuKGZ1bmN0aW9uICgpIHtcblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgQ29uc3RhbnRzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgdmFyIG51bWVyYWwsXG4gICAgICAgIFZFUlNJT04gPSAnMS41LjMnLFxuICAgICAgICAvLyBpbnRlcm5hbCBzdG9yYWdlIGZvciBsYW5ndWFnZSBjb25maWcgZmlsZXNcbiAgICAgICAgbGFuZ3VhZ2VzID0ge30sXG4gICAgICAgIGN1cnJlbnRMYW5ndWFnZSA9ICdlbicsXG4gICAgICAgIHplcm9Gb3JtYXQgPSBudWxsLFxuICAgICAgICBkZWZhdWx0Rm9ybWF0ID0gJzAsMCcsXG4gICAgICAgIC8vIGNoZWNrIGZvciBub2RlSlNcbiAgICAgICAgaGFzTW9kdWxlID0gKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKTtcblxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBDb25zdHJ1Y3RvcnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIC8vIE51bWVyYWwgcHJvdG90eXBlIG9iamVjdFxuICAgIGZ1bmN0aW9uIE51bWVyYWwgKG51bWJlcikge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IG51bWJlcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbXBsZW1lbnRhdGlvbiBvZiB0b0ZpeGVkKCkgdGhhdCB0cmVhdHMgZmxvYXRzIG1vcmUgbGlrZSBkZWNpbWFsc1xuICAgICAqXG4gICAgICogRml4ZXMgYmluYXJ5IHJvdW5kaW5nIGlzc3VlcyAoZWcuICgwLjYxNSkudG9GaXhlZCgyKSA9PT0gJzAuNjEnKSB0aGF0IHByZXNlbnRcbiAgICAgKiBwcm9ibGVtcyBmb3IgYWNjb3VudGluZy0gYW5kIGZpbmFuY2UtcmVsYXRlZCBzb2Z0d2FyZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB0b0ZpeGVkICh2YWx1ZSwgcHJlY2lzaW9uLCByb3VuZGluZ0Z1bmN0aW9uLCBvcHRpb25hbHMpIHtcbiAgICAgICAgdmFyIHBvd2VyID0gTWF0aC5wb3coMTAsIHByZWNpc2lvbiksXG4gICAgICAgICAgICBvcHRpb25hbHNSZWdFeHAsXG4gICAgICAgICAgICBvdXRwdXQ7XG4gICAgICAgICAgICBcbiAgICAgICAgLy9yb3VuZGluZ0Z1bmN0aW9uID0gKHJvdW5kaW5nRnVuY3Rpb24gIT09IHVuZGVmaW5lZCA/IHJvdW5kaW5nRnVuY3Rpb24gOiBNYXRoLnJvdW5kKTtcbiAgICAgICAgLy8gTXVsdGlwbHkgdXAgYnkgcHJlY2lzaW9uLCByb3VuZCBhY2N1cmF0ZWx5LCB0aGVuIGRpdmlkZSBhbmQgdXNlIG5hdGl2ZSB0b0ZpeGVkKCk6XG4gICAgICAgIG91dHB1dCA9IChyb3VuZGluZ0Z1bmN0aW9uKHZhbHVlICogcG93ZXIpIC8gcG93ZXIpLnRvRml4ZWQocHJlY2lzaW9uKTtcblxuICAgICAgICBpZiAob3B0aW9uYWxzKSB7XG4gICAgICAgICAgICBvcHRpb25hbHNSZWdFeHAgPSBuZXcgUmVnRXhwKCcwezEsJyArIG9wdGlvbmFscyArICd9JCcpO1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2Uob3B0aW9uYWxzUmVnRXhwLCAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRm9ybWF0dGluZ1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIC8vIGRldGVybWluZSB3aGF0IHR5cGUgb2YgZm9ybWF0dGluZyB3ZSBuZWVkIHRvIGRvXG4gICAgZnVuY3Rpb24gZm9ybWF0TnVtZXJhbCAobiwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgIHZhciBvdXRwdXQ7XG5cbiAgICAgICAgLy8gZmlndXJlIG91dCB3aGF0IGtpbmQgb2YgZm9ybWF0IHdlIGFyZSBkZWFsaW5nIHdpdGhcbiAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCckJykgPiAtMSkgeyAvLyBjdXJyZW5jeSEhISEhXG4gICAgICAgICAgICBvdXRwdXQgPSBmb3JtYXRDdXJyZW5jeShuLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdC5pbmRleE9mKCclJykgPiAtMSkgeyAvLyBwZXJjZW50YWdlXG4gICAgICAgICAgICBvdXRwdXQgPSBmb3JtYXRQZXJjZW50YWdlKG4sIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0LmluZGV4T2YoJzonKSA+IC0xKSB7IC8vIHRpbWVcbiAgICAgICAgICAgIG91dHB1dCA9IGZvcm1hdFRpbWUobiwgZm9ybWF0KTtcbiAgICAgICAgfSBlbHNlIHsgLy8gcGxhaW4gb2wnIG51bWJlcnMgb3IgYnl0ZXNcbiAgICAgICAgICAgIG91dHB1dCA9IGZvcm1hdE51bWJlcihuLl92YWx1ZSwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJldHVybiBzdHJpbmdcbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICAvLyByZXZlcnQgdG8gbnVtYmVyXG4gICAgZnVuY3Rpb24gdW5mb3JtYXROdW1lcmFsIChuLCBzdHJpbmcpIHtcbiAgICAgICAgdmFyIHN0cmluZ09yaWdpbmFsID0gc3RyaW5nLFxuICAgICAgICAgICAgdGhvdXNhbmRSZWdFeHAsXG4gICAgICAgICAgICBtaWxsaW9uUmVnRXhwLFxuICAgICAgICAgICAgYmlsbGlvblJlZ0V4cCxcbiAgICAgICAgICAgIHRyaWxsaW9uUmVnRXhwLFxuICAgICAgICAgICAgc3VmZml4ZXMgPSBbJ0tCJywgJ01CJywgJ0dCJywgJ1RCJywgJ1BCJywgJ0VCJywgJ1pCJywgJ1lCJ10sXG4gICAgICAgICAgICBieXRlc011bHRpcGxpZXIgPSBmYWxzZSxcbiAgICAgICAgICAgIHBvd2VyO1xuXG4gICAgICAgIGlmIChzdHJpbmcuaW5kZXhPZignOicpID4gLTEpIHtcbiAgICAgICAgICAgIG4uX3ZhbHVlID0gdW5mb3JtYXRUaW1lKHN0cmluZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoc3RyaW5nID09PSB6ZXJvRm9ybWF0KSB7XG4gICAgICAgICAgICAgICAgbi5fdmFsdWUgPSAwO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uZGVsaW1pdGVycy5kZWNpbWFsICE9PSAnLicpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnJlcGxhY2UoL1xcLi9nLCcnKS5yZXBsYWNlKGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmRlbGltaXRlcnMuZGVjaW1hbCwgJy4nKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBzZWUgaWYgYWJicmV2aWF0aW9ucyBhcmUgdGhlcmUgc28gdGhhdCB3ZSBjYW4gbXVsdGlwbHkgdG8gdGhlIGNvcnJlY3QgbnVtYmVyXG4gICAgICAgICAgICAgICAgdGhvdXNhbmRSZWdFeHAgPSBuZXcgUmVnRXhwKCdbXmEtekEtWl0nICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy50aG91c2FuZCArICcoPzpcXFxcKXwoXFxcXCcgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyAnKT8oPzpcXFxcKSk/KT8kJyk7XG4gICAgICAgICAgICAgICAgbWlsbGlvblJlZ0V4cCA9IG5ldyBSZWdFeHAoJ1teYS16QS1aXScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLm1pbGxpb24gKyAnKD86XFxcXCl8KFxcXFwnICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgJyk/KD86XFxcXCkpPyk/JCcpO1xuICAgICAgICAgICAgICAgIGJpbGxpb25SZWdFeHAgPSBuZXcgUmVnRXhwKCdbXmEtekEtWl0nICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy5iaWxsaW9uICsgJyg/OlxcXFwpfChcXFxcJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCArICcpPyg/OlxcXFwpKT8pPyQnKTtcbiAgICAgICAgICAgICAgICB0cmlsbGlvblJlZ0V4cCA9IG5ldyBSZWdFeHAoJ1teYS16QS1aXScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLnRyaWxsaW9uICsgJyg/OlxcXFwpfChcXFxcJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCArICcpPyg/OlxcXFwpKT8pPyQnKTtcblxuICAgICAgICAgICAgICAgIC8vIHNlZSBpZiBieXRlcyBhcmUgdGhlcmUgc28gdGhhdCB3ZSBjYW4gbXVsdGlwbHkgdG8gdGhlIGNvcnJlY3QgbnVtYmVyXG4gICAgICAgICAgICAgICAgZm9yIChwb3dlciA9IDA7IHBvd2VyIDw9IHN1ZmZpeGVzLmxlbmd0aDsgcG93ZXIrKykge1xuICAgICAgICAgICAgICAgICAgICBieXRlc011bHRpcGxpZXIgPSAoc3RyaW5nLmluZGV4T2Yoc3VmZml4ZXNbcG93ZXJdKSA+IC0xKSA/IE1hdGgucG93KDEwMjQsIHBvd2VyICsgMSkgOiBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYnl0ZXNNdWx0aXBsaWVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGRvIHNvbWUgbWF0aCB0byBjcmVhdGUgb3VyIG51bWJlclxuICAgICAgICAgICAgICAgIG4uX3ZhbHVlID0gKChieXRlc011bHRpcGxpZXIpID8gYnl0ZXNNdWx0aXBsaWVyIDogMSkgKiAoKHN0cmluZ09yaWdpbmFsLm1hdGNoKHRob3VzYW5kUmVnRXhwKSkgPyBNYXRoLnBvdygxMCwgMykgOiAxKSAqICgoc3RyaW5nT3JpZ2luYWwubWF0Y2gobWlsbGlvblJlZ0V4cCkpID8gTWF0aC5wb3coMTAsIDYpIDogMSkgKiAoKHN0cmluZ09yaWdpbmFsLm1hdGNoKGJpbGxpb25SZWdFeHApKSA/IE1hdGgucG93KDEwLCA5KSA6IDEpICogKChzdHJpbmdPcmlnaW5hbC5tYXRjaCh0cmlsbGlvblJlZ0V4cCkpID8gTWF0aC5wb3coMTAsIDEyKSA6IDEpICogKChzdHJpbmcuaW5kZXhPZignJScpID4gLTEpID8gMC4wMSA6IDEpICogKCgoc3RyaW5nLnNwbGl0KCctJykubGVuZ3RoICsgTWF0aC5taW4oc3RyaW5nLnNwbGl0KCcoJykubGVuZ3RoLTEsIHN0cmluZy5zcGxpdCgnKScpLmxlbmd0aC0xKSkgJSAyKT8gMTogLTEpICogTnVtYmVyKHN0cmluZy5yZXBsYWNlKC9bXjAtOVxcLl0rL2csICcnKSk7XG5cbiAgICAgICAgICAgICAgICAvLyByb3VuZCBpZiB3ZSBhcmUgdGFsa2luZyBhYm91dCBieXRlc1xuICAgICAgICAgICAgICAgIG4uX3ZhbHVlID0gKGJ5dGVzTXVsdGlwbGllcikgPyBNYXRoLmNlaWwobi5fdmFsdWUpIDogbi5fdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG4uX3ZhbHVlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZvcm1hdEN1cnJlbmN5IChuLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIHN5bWJvbEluZGV4ID0gZm9ybWF0LmluZGV4T2YoJyQnKSxcbiAgICAgICAgICAgIG9wZW5QYXJlbkluZGV4ID0gZm9ybWF0LmluZGV4T2YoJygnKSxcbiAgICAgICAgICAgIG1pbnVzU2lnbkluZGV4ID0gZm9ybWF0LmluZGV4T2YoJy0nKSxcbiAgICAgICAgICAgIHNwYWNlID0gJycsXG4gICAgICAgICAgICBzcGxpY2VJbmRleCxcbiAgICAgICAgICAgIG91dHB1dDtcblxuICAgICAgICAvLyBjaGVjayBmb3Igc3BhY2UgYmVmb3JlIG9yIGFmdGVyIGN1cnJlbmN5XG4gICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignICQnKSA+IC0xKSB7XG4gICAgICAgICAgICBzcGFjZSA9ICcgJztcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCcgJCcsICcnKTtcbiAgICAgICAgfSBlbHNlIGlmIChmb3JtYXQuaW5kZXhPZignJCAnKSA+IC0xKSB7XG4gICAgICAgICAgICBzcGFjZSA9ICcgJztcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCckICcsICcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCckJywgJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZm9ybWF0IHRoZSBudW1iZXJcbiAgICAgICAgb3V0cHV0ID0gZm9ybWF0TnVtYmVyKG4uX3ZhbHVlLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pO1xuXG4gICAgICAgIC8vIHBvc2l0aW9uIHRoZSBzeW1ib2xcbiAgICAgICAgaWYgKHN5bWJvbEluZGV4IDw9IDEpIHtcbiAgICAgICAgICAgIGlmIChvdXRwdXQuaW5kZXhPZignKCcpID4gLTEgfHwgb3V0cHV0LmluZGV4T2YoJy0nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnNwbGl0KCcnKTtcbiAgICAgICAgICAgICAgICBzcGxpY2VJbmRleCA9IDE7XG4gICAgICAgICAgICAgICAgaWYgKHN5bWJvbEluZGV4IDwgb3BlblBhcmVuSW5kZXggfHwgc3ltYm9sSW5kZXggPCBtaW51c1NpZ25JbmRleCl7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBzeW1ib2wgYXBwZWFycyBiZWZvcmUgdGhlIFwiKFwiIG9yIFwiLVwiXG4gICAgICAgICAgICAgICAgICAgIHNwbGljZUluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb3V0cHV0LnNwbGljZShzcGxpY2VJbmRleCwgMCwgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgc3BhY2UpO1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5qb2luKCcnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgc3BhY2UgKyBvdXRwdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAob3V0cHV0LmluZGV4T2YoJyknKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnNwbGl0KCcnKTtcbiAgICAgICAgICAgICAgICBvdXRwdXQuc3BsaWNlKC0xLCAwLCBzcGFjZSArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCk7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LmpvaW4oJycpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQgKyBzcGFjZSArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0UGVyY2VudGFnZSAobiwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgIHZhciBzcGFjZSA9ICcnLFxuICAgICAgICAgICAgb3V0cHV0LFxuICAgICAgICAgICAgdmFsdWUgPSBuLl92YWx1ZSAqIDEwMDtcblxuICAgICAgICAvLyBjaGVjayBmb3Igc3BhY2UgYmVmb3JlICVcbiAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcgJScpID4gLTEpIHtcbiAgICAgICAgICAgIHNwYWNlID0gJyAnO1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyAlJywgJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyUnLCAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICBvdXRwdXQgPSBmb3JtYXROdW1iZXIodmFsdWUsIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgIFxuICAgICAgICBpZiAob3V0cHV0LmluZGV4T2YoJyknKSA+IC0xICkge1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnNwbGl0KCcnKTtcbiAgICAgICAgICAgIG91dHB1dC5zcGxpY2UoLTEsIDAsIHNwYWNlICsgJyUnKTtcbiAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5qb2luKCcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dCArIHNwYWNlICsgJyUnO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXRUaW1lIChuKSB7XG4gICAgICAgIHZhciBob3VycyA9IE1hdGguZmxvb3Iobi5fdmFsdWUvNjAvNjApLFxuICAgICAgICAgICAgbWludXRlcyA9IE1hdGguZmxvb3IoKG4uX3ZhbHVlIC0gKGhvdXJzICogNjAgKiA2MCkpLzYwKSxcbiAgICAgICAgICAgIHNlY29uZHMgPSBNYXRoLnJvdW5kKG4uX3ZhbHVlIC0gKGhvdXJzICogNjAgKiA2MCkgLSAobWludXRlcyAqIDYwKSk7XG4gICAgICAgIHJldHVybiBob3VycyArICc6JyArICgobWludXRlcyA8IDEwKSA/ICcwJyArIG1pbnV0ZXMgOiBtaW51dGVzKSArICc6JyArICgoc2Vjb25kcyA8IDEwKSA/ICcwJyArIHNlY29uZHMgOiBzZWNvbmRzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bmZvcm1hdFRpbWUgKHN0cmluZykge1xuICAgICAgICB2YXIgdGltZUFycmF5ID0gc3RyaW5nLnNwbGl0KCc6JyksXG4gICAgICAgICAgICBzZWNvbmRzID0gMDtcbiAgICAgICAgLy8gdHVybiBob3VycyBhbmQgbWludXRlcyBpbnRvIHNlY29uZHMgYW5kIGFkZCB0aGVtIGFsbCB1cFxuICAgICAgICBpZiAodGltZUFycmF5Lmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgLy8gaG91cnNcbiAgICAgICAgICAgIHNlY29uZHMgPSBzZWNvbmRzICsgKE51bWJlcih0aW1lQXJyYXlbMF0pICogNjAgKiA2MCk7XG4gICAgICAgICAgICAvLyBtaW51dGVzXG4gICAgICAgICAgICBzZWNvbmRzID0gc2Vjb25kcyArIChOdW1iZXIodGltZUFycmF5WzFdKSAqIDYwKTtcbiAgICAgICAgICAgIC8vIHNlY29uZHNcbiAgICAgICAgICAgIHNlY29uZHMgPSBzZWNvbmRzICsgTnVtYmVyKHRpbWVBcnJheVsyXSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGltZUFycmF5Lmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgLy8gbWludXRlc1xuICAgICAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgKyAoTnVtYmVyKHRpbWVBcnJheVswXSkgKiA2MCk7XG4gICAgICAgICAgICAvLyBzZWNvbmRzXG4gICAgICAgICAgICBzZWNvbmRzID0gc2Vjb25kcyArIE51bWJlcih0aW1lQXJyYXlbMV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBOdW1iZXIoc2Vjb25kcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0TnVtYmVyICh2YWx1ZSwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgIHZhciBuZWdQID0gZmFsc2UsXG4gICAgICAgICAgICBzaWduZWQgPSBmYWxzZSxcbiAgICAgICAgICAgIG9wdERlYyA9IGZhbHNlLFxuICAgICAgICAgICAgYWJiciA9ICcnLFxuICAgICAgICAgICAgYWJicksgPSBmYWxzZSwgLy8gZm9yY2UgYWJicmV2aWF0aW9uIHRvIHRob3VzYW5kc1xuICAgICAgICAgICAgYWJick0gPSBmYWxzZSwgLy8gZm9yY2UgYWJicmV2aWF0aW9uIHRvIG1pbGxpb25zXG4gICAgICAgICAgICBhYmJyQiA9IGZhbHNlLCAvLyBmb3JjZSBhYmJyZXZpYXRpb24gdG8gYmlsbGlvbnNcbiAgICAgICAgICAgIGFiYnJUID0gZmFsc2UsIC8vIGZvcmNlIGFiYnJldmlhdGlvbiB0byB0cmlsbGlvbnNcbiAgICAgICAgICAgIGFiYnJGb3JjZSA9IGZhbHNlLCAvLyBmb3JjZSBhYmJyZXZpYXRpb25cbiAgICAgICAgICAgIGJ5dGVzID0gJycsXG4gICAgICAgICAgICBvcmQgPSAnJyxcbiAgICAgICAgICAgIGFicyA9IE1hdGguYWJzKHZhbHVlKSxcbiAgICAgICAgICAgIHN1ZmZpeGVzID0gWydCJywgJ0tCJywgJ01CJywgJ0dCJywgJ1RCJywgJ1BCJywgJ0VCJywgJ1pCJywgJ1lCJ10sXG4gICAgICAgICAgICBtaW4sXG4gICAgICAgICAgICBtYXgsXG4gICAgICAgICAgICBwb3dlcixcbiAgICAgICAgICAgIHcsXG4gICAgICAgICAgICBwcmVjaXNpb24sXG4gICAgICAgICAgICB0aG91c2FuZHMsXG4gICAgICAgICAgICBkID0gJycsXG4gICAgICAgICAgICBuZWcgPSBmYWxzZTtcblxuICAgICAgICAvLyBjaGVjayBpZiBudW1iZXIgaXMgemVybyBhbmQgYSBjdXN0b20gemVybyBmb3JtYXQgaGFzIGJlZW4gc2V0XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gMCAmJiB6ZXJvRm9ybWF0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gemVyb0Zvcm1hdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHNlZSBpZiB3ZSBzaG91bGQgdXNlIHBhcmVudGhlc2VzIGZvciBuZWdhdGl2ZSBudW1iZXIgb3IgaWYgd2Ugc2hvdWxkIHByZWZpeCB3aXRoIGEgc2lnblxuICAgICAgICAgICAgLy8gaWYgYm90aCBhcmUgcHJlc2VudCB3ZSBkZWZhdWx0IHRvIHBhcmVudGhlc2VzXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJygnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgbmVnUCA9IHRydWU7XG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnNsaWNlKDEsIC0xKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0LmluZGV4T2YoJysnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgc2lnbmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgvXFwrL2csICcnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2VlIGlmIGFiYnJldmlhdGlvbiBpcyB3YW50ZWRcbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignYScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiBhYmJyZXZpYXRpb24gaXMgc3BlY2lmaWVkXG4gICAgICAgICAgICAgICAgYWJicksgPSBmb3JtYXQuaW5kZXhPZignYUsnKSA+PSAwO1xuICAgICAgICAgICAgICAgIGFiYnJNID0gZm9ybWF0LmluZGV4T2YoJ2FNJykgPj0gMDtcbiAgICAgICAgICAgICAgICBhYmJyQiA9IGZvcm1hdC5pbmRleE9mKCdhQicpID49IDA7XG4gICAgICAgICAgICAgICAgYWJiclQgPSBmb3JtYXQuaW5kZXhPZignYVQnKSA+PSAwO1xuICAgICAgICAgICAgICAgIGFiYnJGb3JjZSA9IGFiYnJLIHx8IGFiYnJNIHx8IGFiYnJCIHx8IGFiYnJUO1xuXG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgZm9yIHNwYWNlIGJlZm9yZSBhYmJyZXZpYXRpb25cbiAgICAgICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyBhJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBhYmJyID0gJyAnO1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnIGEnLCAnJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJ2EnLCAnJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGFicyA+PSBNYXRoLnBvdygxMCwgMTIpICYmICFhYmJyRm9yY2UgfHwgYWJiclQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdHJpbGxpb25cbiAgICAgICAgICAgICAgICAgICAgYWJiciA9IGFiYnIgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLnRyaWxsaW9uO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gTWF0aC5wb3coMTAsIDEyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFicyA8IE1hdGgucG93KDEwLCAxMikgJiYgYWJzID49IE1hdGgucG93KDEwLCA5KSAmJiAhYWJickZvcmNlIHx8IGFiYnJCKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGJpbGxpb25cbiAgICAgICAgICAgICAgICAgICAgYWJiciA9IGFiYnIgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLmJpbGxpb247XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgOSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhYnMgPCBNYXRoLnBvdygxMCwgOSkgJiYgYWJzID49IE1hdGgucG93KDEwLCA2KSAmJiAhYWJickZvcmNlIHx8IGFiYnJNKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1pbGxpb25cbiAgICAgICAgICAgICAgICAgICAgYWJiciA9IGFiYnIgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5hYmJyZXZpYXRpb25zLm1pbGxpb247XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgNik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhYnMgPCBNYXRoLnBvdygxMCwgNikgJiYgYWJzID49IE1hdGgucG93KDEwLCAzKSAmJiAhYWJickZvcmNlIHx8IGFiYnJLKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRob3VzYW5kXG4gICAgICAgICAgICAgICAgICAgIGFiYnIgPSBhYmJyICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy50aG91c2FuZDtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KDEwLCAzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNlZSBpZiB3ZSBhcmUgZm9ybWF0dGluZyBieXRlc1xuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCdiJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGZvciBzcGFjZSBiZWZvcmVcbiAgICAgICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyBiJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBieXRlcyA9ICcgJztcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyBiJywgJycpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCdiJywgJycpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAocG93ZXIgPSAwOyBwb3dlciA8PSBzdWZmaXhlcy5sZW5ndGg7IHBvd2VyKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbWluID0gTWF0aC5wb3coMTAyNCwgcG93ZXIpO1xuICAgICAgICAgICAgICAgICAgICBtYXggPSBNYXRoLnBvdygxMDI0LCBwb3dlcisxKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPj0gbWluICYmIHZhbHVlIDwgbWF4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBieXRlcyA9IGJ5dGVzICsgc3VmZml4ZXNbcG93ZXJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1pbiA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gbWluO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNlZSBpZiBvcmRpbmFsIGlzIHdhbnRlZFxuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCdvJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGZvciBzcGFjZSBiZWZvcmVcbiAgICAgICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyBvJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBvcmQgPSAnICc7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCcgbycsICcnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnbycsICcnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBvcmQgPSBvcmQgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5vcmRpbmFsKHZhbHVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCdbLl0nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgb3B0RGVjID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnWy5dJywgJy4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdyA9IHZhbHVlLnRvU3RyaW5nKCkuc3BsaXQoJy4nKVswXTtcbiAgICAgICAgICAgIHByZWNpc2lvbiA9IGZvcm1hdC5zcGxpdCgnLicpWzFdO1xuICAgICAgICAgICAgdGhvdXNhbmRzID0gZm9ybWF0LmluZGV4T2YoJywnKTtcblxuICAgICAgICAgICAgaWYgKHByZWNpc2lvbikge1xuICAgICAgICAgICAgICAgIGlmIChwcmVjaXNpb24uaW5kZXhPZignWycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJlY2lzaW9uID0gcHJlY2lzaW9uLnJlcGxhY2UoJ10nLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIHByZWNpc2lvbiA9IHByZWNpc2lvbi5zcGxpdCgnWycpO1xuICAgICAgICAgICAgICAgICAgICBkID0gdG9GaXhlZCh2YWx1ZSwgKHByZWNpc2lvblswXS5sZW5ndGggKyBwcmVjaXNpb25bMV0ubGVuZ3RoKSwgcm91bmRpbmdGdW5jdGlvbiwgcHJlY2lzaW9uWzFdLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZCA9IHRvRml4ZWQodmFsdWUsIHByZWNpc2lvbi5sZW5ndGgsIHJvdW5kaW5nRnVuY3Rpb24pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHcgPSBkLnNwbGl0KCcuJylbMF07XG5cbiAgICAgICAgICAgICAgICBpZiAoZC5zcGxpdCgnLicpWzFdLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBkID0gbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uZGVsaW1pdGVycy5kZWNpbWFsICsgZC5zcGxpdCgnLicpWzFdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGQgPSAnJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0RGVjICYmIE51bWJlcihkLnNsaWNlKDEpKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBkID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB3ID0gdG9GaXhlZCh2YWx1ZSwgbnVsbCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGZvcm1hdCBudW1iZXJcbiAgICAgICAgICAgIGlmICh3LmluZGV4T2YoJy0nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgdyA9IHcuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgbmVnID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRob3VzYW5kcyA+IC0xKSB7XG4gICAgICAgICAgICAgICAgdyA9IHcudG9TdHJpbmcoKS5yZXBsYWNlKC8oXFxkKSg/PShcXGR7M30pKyg/IVxcZCkpL2csICckMScgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5kZWxpbWl0ZXJzLnRob3VzYW5kcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignLicpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgdyA9ICcnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gKChuZWdQICYmIG5lZykgPyAnKCcgOiAnJykgKyAoKCFuZWdQICYmIG5lZykgPyAnLScgOiAnJykgKyAoKCFuZWcgJiYgc2lnbmVkKSA/ICcrJyA6ICcnKSArIHcgKyBkICsgKChvcmQpID8gb3JkIDogJycpICsgKChhYmJyKSA/IGFiYnIgOiAnJykgKyAoKGJ5dGVzKSA/IGJ5dGVzIDogJycpICsgKChuZWdQICYmIG5lZykgPyAnKScgOiAnJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIFRvcCBMZXZlbCBGdW5jdGlvbnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICBudW1lcmFsID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgIGlmIChudW1lcmFsLmlzTnVtZXJhbChpbnB1dCkpIHtcbiAgICAgICAgICAgIGlucHV0ID0gaW5wdXQudmFsdWUoKTtcbiAgICAgICAgfSBlbHNlIGlmIChpbnB1dCA9PT0gMCB8fCB0eXBlb2YgaW5wdXQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpbnB1dCA9IDA7XG4gICAgICAgIH0gZWxzZSBpZiAoIU51bWJlcihpbnB1dCkpIHtcbiAgICAgICAgICAgIGlucHV0ID0gbnVtZXJhbC5mbi51bmZvcm1hdChpbnB1dCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IE51bWVyYWwoTnVtYmVyKGlucHV0KSk7XG4gICAgfTtcblxuICAgIC8vIHZlcnNpb24gbnVtYmVyXG4gICAgbnVtZXJhbC52ZXJzaW9uID0gVkVSU0lPTjtcblxuICAgIC8vIGNvbXBhcmUgbnVtZXJhbCBvYmplY3RcbiAgICBudW1lcmFsLmlzTnVtZXJhbCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIE51bWVyYWw7XG4gICAgfTtcblxuICAgIC8vIFRoaXMgZnVuY3Rpb24gd2lsbCBsb2FkIGxhbmd1YWdlcyBhbmQgdGhlbiBzZXQgdGhlIGdsb2JhbCBsYW5ndWFnZS4gIElmXG4gICAgLy8gbm8gYXJndW1lbnRzIGFyZSBwYXNzZWQgaW4sIGl0IHdpbGwgc2ltcGx5IHJldHVybiB0aGUgY3VycmVudCBnbG9iYWxcbiAgICAvLyBsYW5ndWFnZSBrZXkuXG4gICAgbnVtZXJhbC5sYW5ndWFnZSA9IGZ1bmN0aW9uIChrZXksIHZhbHVlcykge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRMYW5ndWFnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChrZXkgJiYgIXZhbHVlcykge1xuICAgICAgICAgICAgaWYoIWxhbmd1YWdlc1trZXldKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGxhbmd1YWdlIDogJyArIGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJyZW50TGFuZ3VhZ2UgPSBrZXk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWVzIHx8ICFsYW5ndWFnZXNba2V5XSkge1xuICAgICAgICAgICAgbG9hZExhbmd1YWdlKGtleSwgdmFsdWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudW1lcmFsO1xuICAgIH07XG4gICAgXG4gICAgLy8gVGhpcyBmdW5jdGlvbiBwcm92aWRlcyBhY2Nlc3MgdG8gdGhlIGxvYWRlZCBsYW5ndWFnZSBkYXRhLiAgSWZcbiAgICAvLyBubyBhcmd1bWVudHMgYXJlIHBhc3NlZCBpbiwgaXQgd2lsbCBzaW1wbHkgcmV0dXJuIHRoZSBjdXJyZW50XG4gICAgLy8gZ2xvYmFsIGxhbmd1YWdlIG9iamVjdC5cbiAgICBudW1lcmFsLmxhbmd1YWdlRGF0YSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFsYW5ndWFnZXNba2V5XSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGxhbmd1YWdlIDogJyArIGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBsYW5ndWFnZXNba2V5XTtcbiAgICB9O1xuXG4gICAgbnVtZXJhbC5sYW5ndWFnZSgnZW4nLCB7XG4gICAgICAgIGRlbGltaXRlcnM6IHtcbiAgICAgICAgICAgIHRob3VzYW5kczogJywnLFxuICAgICAgICAgICAgZGVjaW1hbDogJy4nXG4gICAgICAgIH0sXG4gICAgICAgIGFiYnJldmlhdGlvbnM6IHtcbiAgICAgICAgICAgIHRob3VzYW5kOiAnaycsXG4gICAgICAgICAgICBtaWxsaW9uOiAnbScsXG4gICAgICAgICAgICBiaWxsaW9uOiAnYicsXG4gICAgICAgICAgICB0cmlsbGlvbjogJ3QnXG4gICAgICAgIH0sXG4gICAgICAgIG9yZGluYWw6IGZ1bmN0aW9uIChudW1iZXIpIHtcbiAgICAgICAgICAgIHZhciBiID0gbnVtYmVyICUgMTA7XG4gICAgICAgICAgICByZXR1cm4gKH5+IChudW1iZXIgJSAxMDAgLyAxMCkgPT09IDEpID8gJ3RoJyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDEpID8gJ3N0JyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDIpID8gJ25kJyA6XG4gICAgICAgICAgICAgICAgKGIgPT09IDMpID8gJ3JkJyA6ICd0aCc7XG4gICAgICAgIH0sXG4gICAgICAgIGN1cnJlbmN5OiB7XG4gICAgICAgICAgICBzeW1ib2w6ICckJ1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBudW1lcmFsLnplcm9Gb3JtYXQgPSBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgIHplcm9Gb3JtYXQgPSB0eXBlb2YoZm9ybWF0KSA9PT0gJ3N0cmluZycgPyBmb3JtYXQgOiBudWxsO1xuICAgIH07XG5cbiAgICBudW1lcmFsLmRlZmF1bHRGb3JtYXQgPSBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgIGRlZmF1bHRGb3JtYXQgPSB0eXBlb2YoZm9ybWF0KSA9PT0gJ3N0cmluZycgPyBmb3JtYXQgOiAnMC4wJztcbiAgICB9O1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBIZWxwZXJzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgZnVuY3Rpb24gbG9hZExhbmd1YWdlKGtleSwgdmFsdWVzKSB7XG4gICAgICAgIGxhbmd1YWdlc1trZXldID0gdmFsdWVzO1xuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRmxvYXRpbmctcG9pbnQgaGVscGVyc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIC8vIFRoZSBmbG9hdGluZy1wb2ludCBoZWxwZXIgZnVuY3Rpb25zIGFuZCBpbXBsZW1lbnRhdGlvblxuICAgIC8vIGJvcnJvd3MgaGVhdmlseSBmcm9tIHNpbmZ1bC5qczogaHR0cDovL2d1aXBuLmdpdGh1Yi5pby9zaW5mdWwuanMvXG5cbiAgICAvKipcbiAgICAgKiBBcnJheS5wcm90b3R5cGUucmVkdWNlIGZvciBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgaXRcbiAgICAgKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9SZWR1Y2UjQ29tcGF0aWJpbGl0eVxuICAgICAqL1xuICAgIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgQXJyYXkucHJvdG90eXBlLnJlZHVjZSkge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUucmVkdWNlID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBvcHRfaW5pdGlhbFZhbHVlKSB7XG4gICAgICAgICAgICAndXNlIHN0cmljdCc7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChudWxsID09PSB0aGlzIHx8ICd1bmRlZmluZWQnID09PSB0eXBlb2YgdGhpcykge1xuICAgICAgICAgICAgICAgIC8vIEF0IHRoZSBtb21lbnQgYWxsIG1vZGVybiBicm93c2VycywgdGhhdCBzdXBwb3J0IHN0cmljdCBtb2RlLCBoYXZlXG4gICAgICAgICAgICAgICAgLy8gbmF0aXZlIGltcGxlbWVudGF0aW9uIG9mIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UuIEZvciBpbnN0YW5jZSwgSUU4XG4gICAgICAgICAgICAgICAgLy8gZG9lcyBub3Qgc3VwcG9ydCBzdHJpY3QgbW9kZSwgc28gdGhpcyBjaGVjayBpcyBhY3R1YWxseSB1c2VsZXNzLlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FycmF5LnByb3RvdHlwZS5yZWR1Y2UgY2FsbGVkIG9uIG51bGwgb3IgdW5kZWZpbmVkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGNhbGxiYWNrICsgJyBpcyBub3QgYSBmdW5jdGlvbicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgaW5kZXgsXG4gICAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gdGhpcy5sZW5ndGggPj4+IDAsXG4gICAgICAgICAgICAgICAgaXNWYWx1ZVNldCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAoMSA8IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IG9wdF9pbml0aWFsVmFsdWU7XG4gICAgICAgICAgICAgICAgaXNWYWx1ZVNldCA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoaW5kZXggPSAwOyBsZW5ndGggPiBpbmRleDsgKytpbmRleCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc093blByb3BlcnR5KGluZGV4KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNWYWx1ZVNldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBjYWxsYmFjayh2YWx1ZSwgdGhpc1tpbmRleF0sIGluZGV4LCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdGhpc1tpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpc1ZhbHVlU2V0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFpc1ZhbHVlU2V0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUmVkdWNlIG9mIGVtcHR5IGFycmF5IHdpdGggbm8gaW5pdGlhbCB2YWx1ZScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgXG4gICAgLyoqXG4gICAgICogQ29tcHV0ZXMgdGhlIG11bHRpcGxpZXIgbmVjZXNzYXJ5IHRvIG1ha2UgeCA+PSAxLFxuICAgICAqIGVmZmVjdGl2ZWx5IGVsaW1pbmF0aW5nIG1pc2NhbGN1bGF0aW9ucyBjYXVzZWQgYnlcbiAgICAgKiBmaW5pdGUgcHJlY2lzaW9uLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG11bHRpcGxpZXIoeCkge1xuICAgICAgICB2YXIgcGFydHMgPSB4LnRvU3RyaW5nKCkuc3BsaXQoJy4nKTtcbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNYXRoLnBvdygxMCwgcGFydHNbMV0ubGVuZ3RoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHaXZlbiBhIHZhcmlhYmxlIG51bWJlciBvZiBhcmd1bWVudHMsIHJldHVybnMgdGhlIG1heGltdW1cbiAgICAgKiBtdWx0aXBsaWVyIHRoYXQgbXVzdCBiZSB1c2VkIHRvIG5vcm1hbGl6ZSBhbiBvcGVyYXRpb24gaW52b2x2aW5nXG4gICAgICogYWxsIG9mIHRoZW0uXG4gICAgICovXG4gICAgZnVuY3Rpb24gY29ycmVjdGlvbkZhY3RvcigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gYXJncy5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIG5leHQpIHtcbiAgICAgICAgICAgIHZhciBtcCA9IG11bHRpcGxpZXIocHJldiksXG4gICAgICAgICAgICAgICAgbW4gPSBtdWx0aXBsaWVyKG5leHQpO1xuICAgICAgICByZXR1cm4gbXAgPiBtbiA/IG1wIDogbW47XG4gICAgICAgIH0sIC1JbmZpbml0eSk7XG4gICAgfSAgICAgICAgXG5cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgTnVtZXJhbCBQcm90b3R5cGVcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIG51bWVyYWwuZm4gPSBOdW1lcmFsLnByb3RvdHlwZSA9IHtcblxuICAgICAgICBjbG9uZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBudW1lcmFsKHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZvcm1hdCA6IGZ1bmN0aW9uIChpbnB1dFN0cmluZywgcm91bmRpbmdGdW5jdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdE51bWVyYWwodGhpcywgXG4gICAgICAgICAgICAgICAgICBpbnB1dFN0cmluZyA/IGlucHV0U3RyaW5nIDogZGVmYXVsdEZvcm1hdCwgXG4gICAgICAgICAgICAgICAgICAocm91bmRpbmdGdW5jdGlvbiAhPT0gdW5kZWZpbmVkKSA/IHJvdW5kaW5nRnVuY3Rpb24gOiBNYXRoLnJvdW5kXG4gICAgICAgICAgICAgICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdW5mb3JtYXQgOiBmdW5jdGlvbiAoaW5wdXRTdHJpbmcpIHtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXRTdHJpbmcpID09PSAnW29iamVjdCBOdW1iZXJdJykgeyBcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5wdXRTdHJpbmc7IFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHVuZm9ybWF0TnVtZXJhbCh0aGlzLCBpbnB1dFN0cmluZyA/IGlucHV0U3RyaW5nIDogZGVmYXVsdEZvcm1hdCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdmFsdWUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdmFsdWVPZiA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXQgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gTnVtYmVyKHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZCA6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIGNvcnJGYWN0b3IgPSBjb3JyZWN0aW9uRmFjdG9yLmNhbGwobnVsbCwgdGhpcy5fdmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNiYWNrKGFjY3VtLCBjdXJyLCBjdXJySSwgTykge1xuICAgICAgICAgICAgICAgIHJldHVybiBhY2N1bSArIGNvcnJGYWN0b3IgKiBjdXJyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSBbdGhpcy5fdmFsdWUsIHZhbHVlXS5yZWR1Y2UoY2JhY2ssIDApIC8gY29yckZhY3RvcjtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN1YnRyYWN0IDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgY29yckZhY3RvciA9IGNvcnJlY3Rpb25GYWN0b3IuY2FsbChudWxsLCB0aGlzLl92YWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgZnVuY3Rpb24gY2JhY2soYWNjdW0sIGN1cnIsIGN1cnJJLCBPKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjY3VtIC0gY29yckZhY3RvciAqIGN1cnI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IFt2YWx1ZV0ucmVkdWNlKGNiYWNrLCB0aGlzLl92YWx1ZSAqIGNvcnJGYWN0b3IpIC8gY29yckZhY3RvcjsgICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIG11bHRpcGx5IDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBjYmFjayhhY2N1bSwgY3VyciwgY3VyckksIE8pIHtcbiAgICAgICAgICAgICAgICB2YXIgY29yckZhY3RvciA9IGNvcnJlY3Rpb25GYWN0b3IoYWNjdW0sIGN1cnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiAoYWNjdW0gKiBjb3JyRmFjdG9yKSAqIChjdXJyICogY29yckZhY3RvcikgL1xuICAgICAgICAgICAgICAgICAgICAoY29yckZhY3RvciAqIGNvcnJGYWN0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSBbdGhpcy5fdmFsdWUsIHZhbHVlXS5yZWR1Y2UoY2JhY2ssIDEpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGl2aWRlIDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBjYmFjayhhY2N1bSwgY3VyciwgY3VyckksIE8pIHtcbiAgICAgICAgICAgICAgICB2YXIgY29yckZhY3RvciA9IGNvcnJlY3Rpb25GYWN0b3IoYWNjdW0sIGN1cnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiAoYWNjdW0gKiBjb3JyRmFjdG9yKSAvIChjdXJyICogY29yckZhY3Rvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IFt0aGlzLl92YWx1ZSwgdmFsdWVdLnJlZHVjZShjYmFjayk7ICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBkaWZmZXJlbmNlIDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5hYnMobnVtZXJhbCh0aGlzLl92YWx1ZSkuc3VidHJhY3QodmFsdWUpLnZhbHVlKCkpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBFeHBvc2luZyBOdW1lcmFsXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgLy8gQ29tbW9uSlMgbW9kdWxlIGlzIGRlZmluZWRcbiAgICBpZiAoaGFzTW9kdWxlKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gbnVtZXJhbDtcbiAgICB9XG5cbiAgICAvKmdsb2JhbCBlbmRlcjpmYWxzZSAqL1xuICAgIGlmICh0eXBlb2YgZW5kZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8vIGhlcmUsIGB0aGlzYCBtZWFucyBgd2luZG93YCBpbiB0aGUgYnJvd3Nlciwgb3IgYGdsb2JhbGAgb24gdGhlIHNlcnZlclxuICAgICAgICAvLyBhZGQgYG51bWVyYWxgIGFzIGEgZ2xvYmFsIG9iamVjdCB2aWEgYSBzdHJpbmcgaWRlbnRpZmllcixcbiAgICAgICAgLy8gZm9yIENsb3N1cmUgQ29tcGlsZXIgJ2FkdmFuY2VkJyBtb2RlXG4gICAgICAgIHRoaXNbJ251bWVyYWwnXSA9IG51bWVyYWw7XG4gICAgfVxuXG4gICAgLypnbG9iYWwgZGVmaW5lOmZhbHNlICovXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBudW1lcmFsO1xuICAgICAgICB9KTtcbiAgICB9XG59KS5jYWxsKHRoaXMpO1xuIiwiLyoqIENhbGVuZGFyIGFjdGl2aXR5ICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xyXG5yZXF1aXJlKCcuLi9jb21wb25lbnRzL0RhdGVQaWNrZXInKTtcclxuXHJcbnZhciBzaW5nbGV0b24gPSBudWxsO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdEFwcG9pbnRtZW50KCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcclxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgQXBwb2ludG1lbnRBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XHJcbiAgICBcclxuICAgIHJldHVybiBzaW5nbGV0b247XHJcbn07XHJcblxyXG5mdW5jdGlvbiBBcHBvaW50bWVudEFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgLyogR2V0dGluZyBlbGVtZW50cyAqL1xyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLiRhcHBvaW50bWVudFZpZXcgPSAkYWN0aXZpdHkuZmluZCgnI2NhbGVuZGFyQXBwb2ludG1lbnRWaWV3Jyk7XHJcbiAgICB0aGlzLiRjaG9vc2VOZXcgPSAkKCcjY2FsZW5kYXJDaG9vc2VOZXcnKTtcclxuICAgIHRoaXMuYXBwID0gYXBwO1xyXG4gICAgXHJcbiAgICAvLyBPYmplY3QgdG8gaG9sZCB0aGUgb3B0aW9ucyBwYXNzZWQgb24gJ3Nob3cnIGFzIGEgcmVzdWx0XHJcbiAgICAvLyBvZiBhIHJlcXVlc3QgZnJvbSBhbm90aGVyIGFjdGl2aXR5XHJcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gbnVsbDtcclxuICAgIFxyXG4gICAgdGhpcy5uYXZBY3Rpb24gPSBOYXZBY3Rpb24ubmV3Q2FsZW5kYXJJdGVtO1xyXG4gICAgXHJcbiAgICB0aGlzLmluaXRBcHBvaW50bWVudCgpO1xyXG59XHJcblxyXG5BcHBvaW50bWVudEFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcbiAgICAvKiBqc2hpbnQgbWF4Y29tcGxleGl0eToxMCAqL1xyXG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG9wdGlvbnMgfHwge307XHJcbiAgICBcclxuICAgIC8vIElmIHRoZXJlIGFyZSBvcHRpb25zICh0aGVyZSBhcmUgbm90IG9uIHN0YXJ0dXAgb3JcclxuICAgIC8vIG9uIGNhbmNlbGxlZCBlZGl0aW9uKS5cclxuICAgIC8vIEFuZCBpdCBjb21lcyBiYWNrIGZyb20gdGhlIHRleHRFZGl0b3IuXHJcbiAgICBpZiAob3B0aW9ucyAhPT0gbnVsbCkge1xyXG5cclxuICAgICAgICB2YXIgYm9va2luZyA9IHRoaXMuYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50KCk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLnJlcXVlc3QgPT09ICd0ZXh0RWRpdG9yJyAmJiBib29raW5nKSB7XHJcblxyXG4gICAgICAgICAgICBib29raW5nW29wdGlvbnMuZmllbGRdKG9wdGlvbnMudGV4dCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKG9wdGlvbnMuc2VsZWN0Q2xpZW50ID09PSB0cnVlICYmIGJvb2tpbmcpIHtcclxuXHJcbiAgICAgICAgICAgIGJvb2tpbmcuY2xpZW50KG9wdGlvbnMuc2VsZWN0ZWRDbGllbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0eXBlb2Yob3B0aW9ucy5zZWxlY3RlZERhdGV0aW1lKSAhPT0gJ3VuZGVmaW5lZCcgJiYgYm9va2luZykge1xyXG5cclxuICAgICAgICAgICAgYm9va2luZy5zdGFydFRpbWUob3B0aW9ucy5zZWxlY3RlZERhdGV0aW1lKTtcclxuICAgICAgICAgICAgLy8gVE9ETyBDYWxjdWxhdGUgdGhlIGVuZFRpbWUgZ2l2ZW4gYW4gYXBwb2ludG1lbnQgZHVyYXRpb24sIHJldHJpZXZlZCBmcm9tIHRoZVxyXG4gICAgICAgICAgICAvLyBzZWxlY3RlZCBzZXJ2aWNlXHJcbiAgICAgICAgICAgIC8vdmFyIGR1cmF0aW9uID0gYm9va2luZy5wcmljaW5nICYmIGJvb2tpbmcucHJpY2luZy5kdXJhdGlvbjtcclxuICAgICAgICAgICAgLy8gT3IgYnkgZGVmYXVsdCAoaWYgbm8gcHJpY2luZyBzZWxlY3RlZCBvciBhbnkpIHRoZSB1c2VyIHByZWZlcnJlZFxyXG4gICAgICAgICAgICAvLyB0aW1lIGdhcFxyXG4gICAgICAgICAgICAvL2R1cmF0aW9uID0gZHVyYXRpb24gfHwgdXNlci5wcmVmZXJlbmNlcy50aW1lU2xvdHNHYXA7XHJcbiAgICAgICAgICAgIC8vIFBST1RPVFlQRTpcclxuICAgICAgICAgICAgdmFyIGR1cmF0aW9uID0gNjA7IC8vIG1pbnV0ZXNcclxuICAgICAgICAgICAgYm9va2luZy5lbmRUaW1lKG1vbWVudChib29raW5nLnN0YXJ0VGltZSgpKS5hZGQoZHVyYXRpb24sICdtaW51dGVzJykudG9EYXRlKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChvcHRpb25zLnNlbGVjdFNlcnZpY2VzID09PSB0cnVlICYmIGJvb2tpbmcpIHtcclxuXHJcbiAgICAgICAgICAgIGJvb2tpbmcuc2VydmljZXMob3B0aW9ucy5zZWxlY3RlZFNlcnZpY2VzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5zZWxlY3RMb2NhdGlvbiA9PT0gdHJ1ZSAmJiBib29raW5nKSB7XHJcblxyXG4gICAgICAgICAgICBib29raW5nLmxvY2F0aW9uKG9wdGlvbnMuc2VsZWN0ZWRMb2NhdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB0aGlzLnNob3dBcHBvaW50bWVudChvcHRpb25zICYmIG9wdGlvbnMuYXBwb2ludG1lbnRJZCk7XHJcbn07XHJcblxyXG52YXIgQXBwb2ludG1lbnQgPSByZXF1aXJlKCcuLi9tb2RlbHMvQXBwb2ludG1lbnQnKTtcclxuXHJcbkFwcG9pbnRtZW50QWN0aXZpdHkucHJvdG90eXBlLnNob3dBcHBvaW50bWVudCA9IGZ1bmN0aW9uIHNob3dBcHBvaW50bWVudChhcHRJZCkge1xyXG4gICAgLypqc2hpbnQgbWF4c3RhdGVtZW50czozNiovXHJcbiAgICBcclxuICAgIGlmIChhcHRJZCkge1xyXG4gICAgICAgIC8vIFRPRE86IHNlbGVjdCBhcHBvaW50bWVudCAnYXB0SWQnXHJcblxyXG4gICAgfSBlbHNlIGlmIChhcHRJZCA9PT0gMCkge1xyXG4gICAgICAgIHRoaXMuYXBwb2ludG1lbnRzRGF0YVZpZXcubmV3QXBwb2ludG1lbnQobmV3IEFwcG9pbnRtZW50KCkpO1xyXG4gICAgICAgIHRoaXMuYXBwb2ludG1lbnRzRGF0YVZpZXcuZWRpdE1vZGUodHJ1ZSk7ICAgICAgICBcclxuICAgIH1cclxufTtcclxuXHJcbkFwcG9pbnRtZW50QWN0aXZpdHkucHJvdG90eXBlLmluaXRBcHBvaW50bWVudCA9IGZ1bmN0aW9uIGluaXRBcHBvaW50bWVudCgpIHtcclxuICAgIGlmICghdGhpcy5fX2luaXRlZEFwcG9pbnRtZW50KSB7XHJcbiAgICAgICAgdGhpcy5fX2luaXRlZEFwcG9pbnRtZW50ID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdmFyIGFwcCA9IHRoaXMuYXBwO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIERhdGFcclxuICAgICAgICB2YXIgdGVzdERhdGEgPSByZXF1aXJlKCcuLi90ZXN0ZGF0YS9jYWxlbmRhckFwcG9pbnRtZW50cycpLmFwcG9pbnRtZW50cztcclxuICAgICAgICB2YXIgYXBwb2ludG1lbnRzRGF0YVZpZXcgPSB7XHJcbiAgICAgICAgICAgIGFwcG9pbnRtZW50czoga28ub2JzZXJ2YWJsZUFycmF5KHRlc3REYXRhKSxcclxuICAgICAgICAgICAgY3VycmVudEluZGV4OiBrby5vYnNlcnZhYmxlKDApLFxyXG4gICAgICAgICAgICBlZGl0TW9kZToga28ub2JzZXJ2YWJsZShmYWxzZSksXHJcbiAgICAgICAgICAgIG5ld0FwcG9pbnRtZW50OiBrby5vYnNlcnZhYmxlKG51bGwpXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3ID0gYXBwb2ludG1lbnRzRGF0YVZpZXc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuaXNOZXcgPSBrby5jb21wdXRlZChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXdBcHBvaW50bWVudCgpICE9PSBudWxsO1xyXG4gICAgICAgIH0sIGFwcG9pbnRtZW50c0RhdGFWaWV3KTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50QXBwb2ludG1lbnQgPSBrby5jb21wdXRlZCh7XHJcbiAgICAgICAgICAgIHJlYWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNOZXcoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm5ld0FwcG9pbnRtZW50KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hcHBvaW50bWVudHMoKVt0aGlzLmN1cnJlbnRJbmRleCgpICUgdGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGhdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB3cml0ZTogZnVuY3Rpb24oYXB0KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmN1cnJlbnRJbmRleCgpICUgdGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50cygpW2luZGV4XSA9IGFwdDtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwb2ludG1lbnRzLnZhbHVlSGFzTXV0YXRlZCgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvd25lcjogYXBwb2ludG1lbnRzRGF0YVZpZXdcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5vcmlnaW5hbEVkaXRlZEFwcG9pbnRtZW50ID0ge307XHJcbiBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5nb1ByZXZpb3VzID0gZnVuY3Rpb24gZ29QcmV2aW91cygpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZWRpdE1vZGUoKSkgcmV0dXJuO1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50SW5kZXgoKSA9PT0gMClcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEluZGV4KHRoaXMuYXBwb2ludG1lbnRzKCkubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEluZGV4KCh0aGlzLmN1cnJlbnRJbmRleCgpIC0gMSkgJSB0aGlzLmFwcG9pbnRtZW50cygpLmxlbmd0aCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5nb05leHQgPSBmdW5jdGlvbiBnb05leHQoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmVkaXRNb2RlKCkpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEluZGV4KCh0aGlzLmN1cnJlbnRJbmRleCgpICsgMSkgJSB0aGlzLmFwcG9pbnRtZW50cygpLmxlbmd0aCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuZWRpdCA9IGZ1bmN0aW9uIGVkaXQoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWRpdE1vZGUodHJ1ZSk7XHJcbiAgICAgICAgfS5iaW5kKGFwcG9pbnRtZW50c0RhdGFWaWV3KTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5jYW5jZWwgPSBmdW5jdGlvbiBjYW5jZWwoKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBpZiBpcyBuZXcsIGRpc2NhcmRcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXNOZXcoKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXdBcHBvaW50bWVudChudWxsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIHJldmVydCBjaGFuZ2VzXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRBcHBvaW50bWVudChuZXcgQXBwb2ludG1lbnQodGhpcy5vcmlnaW5hbEVkaXRlZEFwcG9pbnRtZW50KSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuZWRpdE1vZGUoZmFsc2UpO1xyXG4gICAgICAgIH0uYmluZChhcHBvaW50bWVudHNEYXRhVmlldyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuc2F2ZSA9IGZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICAgICAgICAgIC8vIElmIGlzIGEgbmV3IG9uZSwgYWRkIGl0IHRvIHRoZSBjb2xsZWN0aW9uXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzTmV3KCkpIHtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdmFyIG5ld0FwdCA9IHRoaXMubmV3QXBwb2ludG1lbnQoKTtcclxuICAgICAgICAgICAgICAgIC8vIFRPRE86IHNvbWUgZmllZHMgbmVlZCBzb21lIGtpbmQgb2YgY2FsY3VsYXRpb24gdGhhdCBpcyBwZXJzaXN0ZWRcclxuICAgICAgICAgICAgICAgIC8vIHNvbiBjYW5ub3QgYmUgY29tcHV0ZWQuIFNpbXVsYXRlZDpcclxuICAgICAgICAgICAgICAgIG5ld0FwdC5zdW1tYXJ5KCdNYXNzYWdlIFRoZXJhcGlzdCBCb29raW5nJyk7XHJcbiAgICAgICAgICAgICAgICBuZXdBcHQuaWQoNCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIEFkZCB0byB0aGUgbGlzdDpcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwb2ludG1lbnRzLnB1c2gobmV3QXB0KTtcclxuICAgICAgICAgICAgICAgIC8vIG5vdywgcmVzZXRcclxuICAgICAgICAgICAgICAgIHRoaXMubmV3QXBwb2ludG1lbnQobnVsbCk7XHJcbiAgICAgICAgICAgICAgICAvLyBjdXJyZW50IGluZGV4IG11c3QgYmUgdGhlIGp1c3QtYWRkZWQgYXB0XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCh0aGlzLmFwcG9pbnRtZW50cygpLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBPbiBhZGRpbmcgYSBuZXcgb25lLCB0aGUgY29uZmlybWF0aW9uIHBhZ2UgbXVzdCBiZSBzaG93ZWRcclxuICAgICAgICAgICAgICAgIGFwcC5zaG93QWN0aXZpdHkoJ2Jvb2tpbmdDb25maXJtYXRpb24nLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgYm9va2luZzogbmV3QXB0XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5lZGl0TW9kZShmYWxzZSk7XHJcbiAgICAgICAgfS5iaW5kKGFwcG9pbnRtZW50c0RhdGFWaWV3KTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5lZGl0TW9kZS5zdWJzY3JpYmUoZnVuY3Rpb24oaXNFZGl0KSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLiRhY3Rpdml0eS50b2dnbGVDbGFzcygnaW4tZWRpdCcsIGlzRWRpdCk7XHJcbiAgICAgICAgICAgIHRoaXMuJGFwcG9pbnRtZW50Vmlldy5maW5kKCcuQXBwb2ludG1lbnRDYXJkJykudG9nZ2xlQ2xhc3MoJ2luLWVkaXQnLCBpc0VkaXQpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGlzRWRpdCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGEgY29weSBvZiB0aGUgYXBwb2ludG1lbnQgc28gd2UgcmV2ZXJ0IG9uICdjYW5jZWwnXHJcbiAgICAgICAgICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5vcmlnaW5hbEVkaXRlZEFwcG9pbnRtZW50ID0ga28udG9KUyhhcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50QXBwb2ludG1lbnQoKSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgbmF2QWN0aW9uXHJcbiAgICAgICAgICAgICAgICBhcHAubmF2QWN0aW9uKG51bGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gUmVzdG9yZSB0aGUgbmF2QWN0aW9uXHJcbiAgICAgICAgICAgICAgICBhcHAubmF2QWN0aW9uKHRoaXMubmF2QWN0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LnBpY2tEYXRlVGltZSA9IGZ1bmN0aW9uIHBpY2tEYXRlVGltZSgpIHtcclxuXHJcbiAgICAgICAgICAgIGFwcC5wb3BBY3Rpdml0eSgnZGF0ZXRpbWVQaWNrZXInLCB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RlZERhdGV0aW1lOiBudWxsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcucGlja0NsaWVudCA9IGZ1bmN0aW9uIHBpY2tDbGllbnQoKSB7XHJcblxyXG4gICAgICAgICAgICBhcHAucG9wQWN0aXZpdHkoJ2NsaWVudHMnLCB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RDbGllbnQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzZWxlY3RlZENsaWVudDogbnVsbFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5waWNrU2VydmljZSA9IGZ1bmN0aW9uIHBpY2tTZXJ2aWNlKCkge1xyXG5cclxuICAgICAgICAgICAgYXBwLnBvcEFjdGl2aXR5KCdzZXJ2aWNlcycsIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdFNlcnZpY2VzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRTZXJ2aWNlczogYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50KCkuc2VydmljZXMoKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5jaGFuZ2VQcmljZSA9IGZ1bmN0aW9uIGNoYW5nZVByaWNlKCkge1xyXG4gICAgICAgICAgICAvLyBUT0RPXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5waWNrTG9jYXRpb24gPSBmdW5jdGlvbiBwaWNrTG9jYXRpb24oKSB7XHJcblxyXG4gICAgICAgICAgICBhcHAucG9wQWN0aXZpdHkoJ2xvY2F0aW9ucycsIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdExvY2F0aW9uOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRMb2NhdGlvbjogYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50KCkubG9jYXRpb24oKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgdGV4dEZpZWxkc0hlYWRlcnMgPSB7XHJcbiAgICAgICAgICAgIHByZU5vdGVzVG9DbGllbnQ6ICdOb3RlcyB0byBjbGllbnQnLFxyXG4gICAgICAgICAgICBwb3N0Tm90ZXNUb0NsaWVudDogJ05vdGVzIHRvIGNsaWVudCAoYWZ0ZXJ3YXJkcyknLFxyXG4gICAgICAgICAgICBwcmVOb3Rlc1RvU2VsZjogJ05vdGVzIHRvIHNlbGYnLFxyXG4gICAgICAgICAgICBwb3N0Tm90ZXNUb1NlbGY6ICdCb29raW5nIHN1bW1hcnknXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5lZGl0VGV4dEZpZWxkID0gZnVuY3Rpb24gZWRpdFRleHRGaWVsZChmaWVsZCkge1xyXG5cclxuICAgICAgICAgICAgYXBwLnBvcEFjdGl2aXR5KCd0ZXh0RWRpdG9yJywge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdDogJ3RleHRFZGl0b3InLFxyXG4gICAgICAgICAgICAgICAgZmllbGQ6IGZpZWxkLFxyXG4gICAgICAgICAgICAgICAgaGVhZGVyOiB0ZXh0RmllbGRzSGVhZGVyc1tmaWVsZF0sXHJcbiAgICAgICAgICAgICAgICB0ZXh0OiBhcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50QXBwb2ludG1lbnQoKVtmaWVsZF0oKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LmJpbmQodGhpcyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcucmV0dXJuVG9DYWxlbmRhciA9IGZ1bmN0aW9uIHJldHVyblRvQ2FsZW5kYXIoKSB7XHJcbiAgICAgICAgICAgIC8vIFdlIGhhdmUgYSByZXF1ZXN0XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnJlcXVlc3RJbmZvKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUGFzcyB0aGUgY3VycmVudCBkYXRlXHJcbiAgICAgICAgICAgICAgICB2YXIgZGF0ZSA9IHRoaXMuYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudERhdGUoKTtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRlKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8uZGF0ZSA9IGRhdGU7XHJcbiAgICAgICAgICAgICAgICAvLyBBbmQgZ28gYmFja1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuZ29CYWNrKHRoaXMucmVxdWVzdEluZm8pO1xyXG4gICAgICAgICAgICAgICAgLy8gTGFzdCwgY2xlYXIgcmVxdWVzdEluZm9cclxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmN1cnJlbnREYXRlID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgYXB0ID0gdGhpcy5jdXJyZW50QXBwb2ludG1lbnQoKSxcclxuICAgICAgICAgICAgICAgIGp1c3REYXRlID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmIChhcHQgJiYgYXB0LnN0YXJ0VGltZSgpKVxyXG4gICAgICAgICAgICAgICAganVzdERhdGUgPSBtb21lbnQoYXB0LnN0YXJ0VGltZSgpKS5ob3VycygwKS5taW51dGVzKDApLnNlY29uZHMoMCkudG9EYXRlKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4ganVzdERhdGU7XHJcbiAgICAgICAgfSwgYXBwb2ludG1lbnRzRGF0YVZpZXcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGtvLmFwcGx5QmluZGluZ3MoYXBwb2ludG1lbnRzRGF0YVZpZXcsIHRoaXMuJGFjdGl2aXR5LmdldCgwKSk7XHJcbiAgICB9XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgYm9va2luZ0NvbmZpcm1hdGlvbiBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxuICAgIFxyXG52YXIgc2luZ2xldG9uID0gbnVsbDtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRDbGllbnRzKCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcclxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgQm9va2luZ0NvbmZpcm1hdGlvbkFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIEJvb2tpbmdDb25maXJtYXRpb25BY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xyXG4gICAgdGhpcy5hcHAgPSBhcHA7XHJcblxyXG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcclxuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XHJcbn1cclxuXHJcbkJvb2tpbmdDb25maXJtYXRpb25BY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG5cclxuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuYm9va2luZylcclxuICAgICAgICB0aGlzLmRhdGFWaWV3LmJvb2tpbmcob3B0aW9ucy5ib29raW5nKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcclxuXHJcbiAgICAvLyA6QXBwb2ludG1lbnRcclxuICAgIHRoaXMuYm9va2luZyA9IGtvLm9ic2VydmFibGUobnVsbCk7XHJcbn1cclxuIiwiLyoqIENhbGVuZGFyIGFjdGl2aXR5ICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbnJlcXVpcmUoJy4uL2NvbXBvbmVudHMvRGF0ZVBpY2tlcicpO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG52YXIgQ2FsZW5kYXJTbG90ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0NhbGVuZGFyU2xvdCcpLFxyXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcclxuXHJcbnZhciBzaW5nbGV0b24gPSBudWxsO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdENhbGVuZGFyKCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcclxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgQ2FsZW5kYXJBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XHJcbiAgICBcclxuICAgIHJldHVybiBzaW5nbGV0b247XHJcbn07XHJcblxyXG5mdW5jdGlvbiBDYWxlbmRhckFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgLyogR2V0dGluZyBlbGVtZW50cyAqL1xyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLiRkYXRlcGlja2VyID0gJGFjdGl2aXR5LmZpbmQoJyNjYWxlbmRhckRhdGVQaWNrZXInKTtcclxuICAgIHRoaXMuJGRhaWx5VmlldyA9ICRhY3Rpdml0eS5maW5kKCcjY2FsZW5kYXJEYWlseVZpZXcnKTtcclxuICAgIHRoaXMuJGRhdGVIZWFkZXIgPSAkYWN0aXZpdHkuZmluZCgnI2NhbGVuZGFyRGF0ZUhlYWRlcicpO1xyXG4gICAgdGhpcy4kZGF0ZVRpdGxlID0gdGhpcy4kZGF0ZUhlYWRlci5jaGlsZHJlbignLkNhbGVuZGFyRGF0ZUhlYWRlci1kYXRlJyk7XHJcbiAgICB0aGlzLiRjaG9vc2VOZXcgPSAkKCcjY2FsZW5kYXJDaG9vc2VOZXcnKTtcclxuICAgIHRoaXMuYXBwID0gYXBwO1xyXG4gICAgXHJcbiAgICAvKiBJbml0IGNvbXBvbmVudHMgKi9cclxuICAgIHRoaXMuJGRhdGVwaWNrZXIuc2hvdygpLmRhdGVwaWNrZXIoKTtcclxuXHJcbiAgICAvLyBEYXRhXHJcbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xyXG4gICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLmRhdGFWaWV3LCAkYWN0aXZpdHkuZ2V0KDApKTtcclxuXHJcbiAgICAvLyBUZXN0aW5nIGRhdGFcclxuICAgIHRoaXMuZGF0YVZpZXcuc2xvdHNEYXRhKHJlcXVpcmUoJy4uL3Rlc3RkYXRhL2NhbGVuZGFyU2xvdHMnKS5jYWxlbmRhcik7XHJcbiAgICBcclxuICAgIC8vIE9iamVjdCB0byBob2xkIHRoZSBvcHRpb25zIHBhc3NlZCBvbiAnc2hvdycgYXMgYSByZXN1bHRcclxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG5cclxuICAgIC8qIEV2ZW50IGhhbmRsZXJzICovXHJcbiAgICAvLyBVcGRhdGUgZGF0ZXBpY2tlciBzZWxlY3RlZCBkYXRlIG9uIGRhdGUgY2hhbmdlIChmcm9tIFxyXG4gICAgLy8gYSBkaWZmZXJlbnQgc291cmNlIHRoYW4gdGhlIGRhdGVwaWNrZXIgaXRzZWxmXHJcbiAgICB0aGlzLmRhdGFWaWV3LmN1cnJlbnREYXRlLnN1YnNjcmliZShmdW5jdGlvbihkYXRlKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIG1kYXRlID0gbW9tZW50KGRhdGUpO1xyXG5cclxuICAgICAgICB0aGlzLiRkYXRlcGlja2VyLnJlbW92ZUNsYXNzKCdpcy12aXNpYmxlJyk7XHJcbiAgICAgICAgLy8gQ2hhbmdlIG5vdCBmcm9tIHRoZSB3aWRnZXQ/XHJcbiAgICAgICAgaWYgKHRoaXMuJGRhdGVwaWNrZXIuZGF0ZXBpY2tlcignZ2V0VmFsdWUnKS50b0lTT1N0cmluZygpICE9PSBtZGF0ZS50b0lTT1N0cmluZygpKVxyXG4gICAgICAgICAgICB0aGlzLiRkYXRlcGlja2VyLmRhdGVwaWNrZXIoJ3NldFZhbHVlJywgZGF0ZSwgdHJ1ZSk7XHJcblxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAvLyBTd2lwZSBkYXRlIG9uIGdlc3R1cmVcclxuICAgIHRoaXMuJGRhaWx5Vmlld1xyXG4gICAgLm9uKCdzd2lwZWxlZnQgc3dpcGVyaWdodCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRpciA9IGUudHlwZSA9PT0gJ3N3aXBlbGVmdCcgPyAnbmV4dCcgOiAncHJldic7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSGFjayB0byBzb2x2ZSB0aGUgZnJlZXp5LXN3aXBlIGFuZCB0YXAtYWZ0ZXIgYnVnIG9uIEpRTTpcclxuICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCd0b3VjaGVuZCcpO1xyXG4gICAgICAgIC8vIENoYW5nZSBkYXRlXHJcbiAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCBkaXIsICdkYXRlJyk7XHJcblxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIFxyXG4gICAgLy8gQ2hhbmdpbmcgZGF0ZSB3aXRoIGJ1dHRvbnM6XHJcbiAgICB0aGlzLiRkYXRlSGVhZGVyLm9uKCd0YXAnLCAnLkNhbGVuZGFyRGF0ZUhlYWRlci1zd2l0Y2gnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgc3dpdGNoIChlLmN1cnJlbnRUYXJnZXQuZ2V0QXR0cmlidXRlKCdocmVmJykpIHtcclxuICAgICAgICAgICAgY2FzZSAnI3ByZXYnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCAncHJldicsICdkYXRlJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnI25leHQnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCAnbmV4dCcsICdkYXRlJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIC8vIExldHMgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIC8vIFNob3dpbmcgZGF0ZXBpY2tlciB3aGVuIHByZXNzaW5nIHRoZSB0aXRsZVxyXG4gICAgdGhpcy4kZGF0ZVRpdGxlLm9uKCd0YXAnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci50b2dnbGVDbGFzcygnaXMtdmlzaWJsZScpO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAvLyBVcGRhdGluZyB2aWV3IGRhdGUgd2hlbiBwaWNrZWQgYW5vdGhlciBvbmVcclxuICAgIHRoaXMuJGRhdGVwaWNrZXIub24oJ2NoYW5nZURhdGUnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgaWYgKGUudmlld01vZGUgPT09ICdkYXlzJykge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmN1cnJlbnREYXRlKGUuZGF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIFxyXG4gICAgLy8gU2V0IGRhdGUgdG8gbWF0Y2ggZGF0ZXBpY2tlciBmb3IgZmlyc3QgdXBkYXRlXHJcbiAgICB0aGlzLmRhdGFWaWV3LmN1cnJlbnREYXRlKHRoaXMuJGRhdGVwaWNrZXIuZGF0ZXBpY2tlcignZ2V0VmFsdWUnKSk7XHJcbiAgICBcclxuICAgIHRoaXMubmF2QWN0aW9uID0gTmF2QWN0aW9uLm5ld0NhbGVuZGFySXRlbTtcclxufVxyXG5cclxuQ2FsZW5kYXJBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG4gICAgLyoganNoaW50IG1heGNvbXBsZXhpdHk6OCAqL1xyXG4gICAgXHJcbiAgICBpZiAob3B0aW9ucyAmJiAob3B0aW9ucy5kYXRlIGluc3RhbmNlb2YgRGF0ZSkpXHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5jdXJyZW50RGF0ZShvcHRpb25zLmRhdGUpO1xyXG4gICAgXHJcbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnJvdXRlKSB7XHJcbiAgICAgICAgc3dpdGNoIChvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjYXNlICdhcHBvaW50bWVudCc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRjaG9vc2VOZXcubW9kYWwoJ2hpZGUnKTtcclxuICAgICAgICAgICAgICAgIC8vIFBhc3MgQXBwb2ludG1lbnQgSURcclxuICAgICAgICAgICAgICAgIHZhciBhcHRJZCA9IG9wdGlvbnMucm91dGUuc2VnbWVudHNbMV07XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dBcHBvaW50bWVudChhcHRJZCB8fCAwKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnbmV3JzpcclxuICAgICAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5yb3V0ZS5zZWdtZW50c1sxXSkge1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnYm9va2luZyc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuJGNob29zZU5ldy5tb2RhbCgnaGlkZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dBcHBvaW50bWVudCgwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2V2ZW50JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyBJbXBsZW1lbnQgbmV3LWV2ZW50IGZvcm0gb3BlbmluZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy4kY2hvb3NlTmV3Lm1vZGFsKCdzaG93Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuQ2FsZW5kYXJBY3Rpdml0eS5wcm90b3R5cGUuc2hvd0FwcG9pbnRtZW50ID0gZnVuY3Rpb24gc2hvd0FwcG9pbnRtZW50KGFwdCkge1xyXG4gICAgXHJcbiAgICAvLyBUT0RPOiBpbXBsZW1lbnQgc2hvd2luZyB0aGUgZ2l2ZW4gJ2FwdCdcclxuICAgIHRoaXMuYXBwLnNob3dBY3Rpdml0eSgnYXBwb2ludG1lbnQnLCB7XHJcbiAgICAgICAgZGF0ZTogdGhpcy5kYXRhVmlldy5jdXJyZW50RGF0ZSgpLFxyXG4gICAgICAgIGFwcG9pbnRtZW50SWQ6IGFwdFxyXG4gICAgfSk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XHJcblxyXG4gICAgdGhpcy5zbG90cyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcbiAgICB0aGlzLnNsb3RzRGF0YSA9IGtvLm9ic2VydmFibGUoe30pO1xyXG4gICAgdGhpcy5jdXJyZW50RGF0ZSA9IGtvLm9ic2VydmFibGUobmV3IERhdGUoKSk7XHJcbiAgICBcclxuICAgIC8vIFVwZGF0ZSBjdXJyZW50IHNsb3RzIG9uIGRhdGUgY2hhbmdlXHJcbiAgICB0aGlzLmN1cnJlbnREYXRlLnN1YnNjcmliZShmdW5jdGlvbiAoZGF0ZSkge1xyXG5cclxuICAgICAgICB2YXIgbWRhdGUgPSBtb21lbnQoZGF0ZSksXHJcbiAgICAgICAgICAgIHNkYXRlID0gbWRhdGUuZm9ybWF0KCdZWVlZLU1NLUREJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHNsb3RzID0gdGhpcy5zbG90c0RhdGEoKTtcclxuXHJcbiAgICAgICAgaWYgKHNsb3RzLmhhc093blByb3BlcnR5KHNkYXRlKSkge1xyXG4gICAgICAgICAgICB0aGlzLnNsb3RzKHNsb3RzW3NkYXRlXSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5zbG90cyhzbG90c1snZGVmYXVsdCddKTtcclxuICAgICAgICB9XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59XHJcbiIsIi8qKlxyXG4gICAgY2xpZW50cyBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxuICAgIFxyXG52YXIgc2luZ2xldG9uID0gbnVsbDtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRDbGllbnRzKCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcclxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgQ2xpZW50c0FjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIENsaWVudHNBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xyXG4gICAgdGhpcy5hcHAgPSBhcHA7XHJcbiAgICB0aGlzLiRpbmRleCA9ICRhY3Rpdml0eS5maW5kKCcjY2xpZW50c0luZGV4Jyk7XHJcbiAgICB0aGlzLiRsaXN0VmlldyA9ICRhY3Rpdml0eS5maW5kKCcjY2xpZW50c0xpc3RWaWV3Jyk7XHJcblxyXG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcclxuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XHJcblxyXG4gICAgLy8gVGVzdGluZ0RhdGFcclxuICAgIHRoaXMuZGF0YVZpZXcuY2xpZW50cyhyZXF1aXJlKCcuLi90ZXN0ZGF0YS9jbGllbnRzJykuY2xpZW50cyk7XHJcbiAgICBcclxuICAgIC8vIEhhbmRsZXIgdG8gdXBkYXRlIGhlYWRlciBiYXNlZCBvbiBhIG1vZGUgY2hhbmdlOlxyXG4gICAgdGhpcy5kYXRhVmlldy5pc1NlbGVjdGlvbk1vZGUuc3Vic2NyaWJlKGZ1bmN0aW9uIChpdElzKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5oZWFkZXJUZXh0KGl0SXMgPyAnU2VsZWN0IGEgY2xpZW50JyA6ICdDbGllbnRzJyk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIC8vIE9iamVjdCB0byBob2xkIHRoZSBvcHRpb25zIHBhc3NlZCBvbiAnc2hvdycgYXMgYSByZXN1bHRcclxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyIHRvIGdvIGJhY2sgd2l0aCB0aGUgc2VsZWN0ZWQgY2xpZW50IHdoZW4gXHJcbiAgICAvLyBzZWxlY3Rpb24gbW9kZSBnb2VzIG9mZiBhbmQgcmVxdWVzdEluZm8gaXMgZm9yXHJcbiAgICAvLyAnc2VsZWN0IG1vZGUnXHJcbiAgICB0aGlzLmRhdGFWaWV3LmlzU2VsZWN0aW9uTW9kZS5zdWJzY3JpYmUoZnVuY3Rpb24gKGl0SXMpIHtcclxuICAgICAgICAvLyBXZSBoYXZlIGEgcmVxdWVzdCBhbmRcclxuICAgICAgICAvLyBpdCByZXF1ZXN0ZWQgdG8gc2VsZWN0IGEgY2xpZW50XHJcbiAgICAgICAgLy8gYW5kIHNlbGVjdGlvbiBtb2RlIGdvZXMgb2ZmXHJcbiAgICAgICAgaWYgKHRoaXMucmVxdWVzdEluZm8gJiZcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mby5zZWxlY3RDbGllbnQgPT09IHRydWUgJiZcclxuICAgICAgICAgICAgaXRJcyA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFBhc3MgdGhlIHNlbGVjdGVkIGNsaWVudCBpbiB0aGUgaW5mb1xyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvLnNlbGVjdGVkQ2xpZW50ID0gdGhpcy5kYXRhVmlldy5zZWxlY3RlZENsaWVudCgpO1xyXG4gICAgICAgICAgICAvLyBBbmQgZ28gYmFja1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5nb0JhY2sodGhpcy5yZXF1ZXN0SW5mbyk7XHJcbiAgICAgICAgICAgIC8vIExhc3QsIGNsZWFyIHJlcXVlc3RJbmZvXHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn1cclxuXHJcbkNsaWVudHNBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG5cclxuICAgIC8vIE9uIGV2ZXJ5IHNob3csIHNlYXJjaCBnZXRzIHJlc2V0ZWRcclxuICAgIHRoaXMuZGF0YVZpZXcuc2VhcmNoVGV4dCgnJyk7XHJcbiAgXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBvcHRpb25zO1xyXG5cclxuICAgIGlmIChvcHRpb25zLnNlbGVjdENsaWVudCA9PT0gdHJ1ZSlcclxuICAgICAgICB0aGlzLmRhdGFWaWV3LmlzU2VsZWN0aW9uTW9kZSh0cnVlKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcclxuXHJcbiAgICB0aGlzLmhlYWRlclRleHQgPSBrby5vYnNlcnZhYmxlKCdDbGllbnRzJyk7XHJcblxyXG4gICAgLy8gRXNwZWNpYWwgbW9kZSB3aGVuIGluc3RlYWQgb2YgcGljayBhbmQgZWRpdCB3ZSBhcmUganVzdCBzZWxlY3RpbmdcclxuICAgIC8vICh3aGVuIGVkaXRpbmcgYW4gYXBwb2ludG1lbnQpXHJcbiAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZSA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG5cclxuICAgIC8vIEZ1bGwgbGlzdCBvZiBjbGllbnRzXHJcbiAgICB0aGlzLmNsaWVudHMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xyXG4gICAgXHJcbiAgICAvLyBTZWFyY2ggdGV4dCwgdXNlZCB0byBmaWx0ZXIgJ2NsaWVudHMnXHJcbiAgICB0aGlzLnNlYXJjaFRleHQgPSBrby5vYnNlcnZhYmxlKCcnKTtcclxuICAgIFxyXG4gICAgLy8gVXRpbGl0eSB0byBnZXQgYSBmaWx0ZXJlZCBsaXN0IG9mIGNsaWVudHMgYmFzZWQgb24gY2xpZW50c1xyXG4gICAgdGhpcy5nZXRGaWx0ZXJlZExpc3QgPSBmdW5jdGlvbiBnZXRGaWx0ZXJlZExpc3QoKSB7XHJcbiAgICAgICAgdmFyIHMgPSAodGhpcy5zZWFyY2hUZXh0KCkgfHwgJycpLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudHMoKS5maWx0ZXIoZnVuY3Rpb24oY2xpZW50KSB7XHJcbiAgICAgICAgICAgIHZhciBuID0gY2xpZW50ICYmIGNsaWVudC5mdWxsTmFtZSgpICYmIGNsaWVudC5mdWxsTmFtZSgpIHx8ICcnO1xyXG4gICAgICAgICAgICBuID0gbi50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICByZXR1cm4gbi5pbmRleE9mKHMpID4gLTE7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEZpbHRlcmVkIGxpc3Qgb2YgY2xpZW50c1xyXG4gICAgdGhpcy5maWx0ZXJlZENsaWVudHMgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRGaWx0ZXJlZExpc3QoKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICAvLyBHcm91cGVkIGxpc3Qgb2YgZmlsdGVyZWQgY2xpZW50c1xyXG4gICAgdGhpcy5ncm91cGVkQ2xpZW50cyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIHZhciBjbGllbnRzID0gdGhpcy5maWx0ZXJlZENsaWVudHMoKS5zb3J0KGZ1bmN0aW9uKGNsaWVudEEsIGNsaWVudEIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNsaWVudEEuZmlyc3ROYW1lKCkgPiBjbGllbnRCLmZpcnN0TmFtZSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBncm91cHMgPSBbXSxcclxuICAgICAgICAgICAgbGF0ZXN0R3JvdXAgPSBudWxsLFxyXG4gICAgICAgICAgICBsYXRlc3RMZXR0ZXIgPSBudWxsO1xyXG5cclxuICAgICAgICBjbGllbnRzLmZvckVhY2goZnVuY3Rpb24oY2xpZW50KSB7XHJcbiAgICAgICAgICAgIHZhciBsZXR0ZXIgPSAoY2xpZW50LmZpcnN0TmFtZSgpWzBdIHx8ICcnKS50b1VwcGVyQ2FzZSgpO1xyXG4gICAgICAgICAgICBpZiAobGV0dGVyICE9PSBsYXRlc3RMZXR0ZXIpIHtcclxuICAgICAgICAgICAgICAgIGxhdGVzdEdyb3VwID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldHRlcjogbGV0dGVyLFxyXG4gICAgICAgICAgICAgICAgICAgIGNsaWVudHM6IFtjbGllbnRdXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgZ3JvdXBzLnB1c2gobGF0ZXN0R3JvdXApO1xyXG4gICAgICAgICAgICAgICAgbGF0ZXN0TGV0dGVyID0gbGV0dGVyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbGF0ZXN0R3JvdXAuY2xpZW50cy5wdXNoKGNsaWVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdyb3VwcztcclxuXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZWxlY3RlZENsaWVudCA9IGtvLm9ic2VydmFibGUobnVsbCk7XHJcbiAgICBcclxuICAgIHRoaXMuc2VsZWN0Q2xpZW50ID0gZnVuY3Rpb24oc2VsZWN0ZWRDbGllbnQpIHtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnNlbGVjdGVkQ2xpZW50KHNlbGVjdGVkQ2xpZW50KTtcclxuICAgICAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZShmYWxzZSk7XHJcblxyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG59XHJcbiIsIi8qKlxuICAgIENvbnRhY3RJbmZvIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIHNpbmdsZXRvbiA9IG51bGw7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRDb250YWN0SW5mbygkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IENvbnRhY3RJbmZvQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xuICAgIFxuICAgIHJldHVybiBzaW5nbGV0b247XG59O1xuXG5mdW5jdGlvbiBDb250YWN0SW5mb0FjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICBcbiAgICB0aGlzLm5hdkFjdGlvbiA9IG51bGw7XG59XG5cbkNvbnRhY3RJbmZvQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcblxufTtcbiIsIi8qKlxyXG4gICAgZGF0ZXRpbWVQaWNrZXIgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIFRpbWUgPSByZXF1aXJlKCcuLi91dGlscy9UaW1lJyk7XHJcbnJlcXVpcmUoJy4uL2NvbXBvbmVudHMvRGF0ZVBpY2tlcicpO1xyXG4gICAgXHJcbnZhciBzaW5nbGV0b24gPSBudWxsO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdERhdGV0aW1lUGlja2VyKCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcclxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgRGF0ZXRpbWVQaWNrZXJBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XHJcblxyXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIERhdGV0aW1lUGlja2VyQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xyXG4gICAgdGhpcy4kZGF0ZVBpY2tlciA9ICRhY3Rpdml0eS5maW5kKCcjZGF0ZXRpbWVQaWNrZXJEYXRlUGlja2VyJyk7XHJcbiAgICB0aGlzLiR0aW1lUGlja2VyID0gJGFjdGl2aXR5LmZpbmQoJyNkYXRldGltZVBpY2tlclRpbWVQaWNrZXInKTtcclxuXHJcbiAgICAvKiBJbml0IGNvbXBvbmVudHMgKi9cclxuICAgIHRoaXMuJGRhdGVQaWNrZXIuc2hvdygpLmRhdGVwaWNrZXIoKTtcclxuICAgIFxyXG4gICAgdmFyIGRhdGFWaWV3ID0gdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcclxuICAgIGRhdGFWaWV3LmhlYWRlclRleHQgPSAnU2VsZWN0IGEgc3RhcnQgdGltZSc7XHJcbiAgICBrby5hcHBseUJpbmRpbmdzKGRhdGFWaWV3LCAkYWN0aXZpdHkuZ2V0KDApKTtcclxuICAgIFxyXG4gICAgLy8gRXZlbnRzXHJcbiAgICB0aGlzLiRkYXRlUGlja2VyLm9uKCdjaGFuZ2VEYXRlJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGlmIChlLnZpZXdNb2RlID09PSAnZGF5cycpIHtcclxuICAgICAgICAgICAgZGF0YVZpZXcuc2VsZWN0ZWREYXRlKGUuZGF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIFxyXG4gICAgLy8gVGVzdGluZ0RhdGFcclxuICAgIGRhdGFWaWV3LnNsb3RzRGF0YSA9IHJlcXVpcmUoJy4uL3Rlc3RkYXRhL3RpbWVTbG90cycpLnRpbWVTbG90cztcclxuIFxyXG4gICAgZGF0YVZpZXcuc2VsZWN0ZWREYXRlLnN1YnNjcmliZShmdW5jdGlvbihkYXRlKSB7XHJcbiAgICAgICAgdGhpcy5iaW5kRGF0ZURhdGEoZGF0ZSk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIHRoaXMuYmluZERhdGVEYXRhKG5ldyBEYXRlKCkpO1xyXG4gICAgXHJcbiAgICAvLyBPYmplY3QgdG8gaG9sZCB0aGUgb3B0aW9ucyBwYXNzZWQgb24gJ3Nob3cnIGFzIGEgcmVzdWx0XHJcbiAgICAvLyBvZiBhIHJlcXVlc3QgZnJvbSBhbm90aGVyIGFjdGl2aXR5XHJcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gbnVsbDtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciB0byBnbyBiYWNrIHdpdGggdGhlIHNlbGVjdGVkIGRhdGUtdGltZSB3aGVuXHJcbiAgICAvLyB0aGF0IHNlbGVjdGlvbiBpcyBkb25lIChjb3VsZCBiZSB0byBudWxsKVxyXG4gICAgdGhpcy5kYXRhVmlldy5zZWxlY3RlZERhdGV0aW1lLnN1YnNjcmliZShmdW5jdGlvbiAoZGF0ZXRpbWUpIHtcclxuICAgICAgICAvLyBXZSBoYXZlIGEgcmVxdWVzdFxyXG4gICAgICAgIGlmICh0aGlzLnJlcXVlc3RJbmZvKSB7XHJcbiAgICAgICAgICAgIC8vIFBhc3MgdGhlIHNlbGVjdGVkIGRhdGV0aW1lIGluIHRoZSBpbmZvXHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8uc2VsZWN0ZWREYXRldGltZSA9IHRoaXMuZGF0YVZpZXcuc2VsZWN0ZWREYXRldGltZSgpO1xyXG4gICAgICAgICAgICAvLyBBbmQgZ28gYmFja1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5nb0JhY2sodGhpcy5yZXF1ZXN0SW5mbyk7XHJcbiAgICAgICAgICAgIC8vIExhc3QsIGNsZWFyIHJlcXVlc3RJbmZvXHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn1cclxuXHJcbkRhdGV0aW1lUGlja2VyQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcclxuICBcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG9wdGlvbnM7XHJcbn07XHJcblxyXG5EYXRldGltZVBpY2tlckFjdGl2aXR5LnByb3RvdHlwZS5iaW5kRGF0ZURhdGEgPSBmdW5jdGlvbiBiaW5kRGF0ZURhdGEoZGF0ZSkge1xyXG5cclxuICAgIHZhciBzZGF0ZSA9IG1vbWVudChkYXRlKS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcclxuICAgIHZhciBzbG90c0RhdGEgPSB0aGlzLmRhdGFWaWV3LnNsb3RzRGF0YTtcclxuXHJcbiAgICBpZiAoc2xvdHNEYXRhLmhhc093blByb3BlcnR5KHNkYXRlKSkge1xyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuc2xvdHMoc2xvdHNEYXRhW3NkYXRlXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuc2xvdHMoc2xvdHNEYXRhWydkZWZhdWx0J10pO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJ1NlbGVjdCBhIHRpbWUnKTtcclxuICAgIHRoaXMuc2VsZWN0ZWREYXRlID0ga28ub2JzZXJ2YWJsZShuZXcgRGF0ZSgpKTtcclxuICAgIHRoaXMuc2xvdHNEYXRhID0ge307XHJcbiAgICB0aGlzLnNsb3RzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcclxuICAgIHRoaXMuZ3JvdXBlZFNsb3RzID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuICAgICAgICAvKlxyXG4gICAgICAgICAgYmVmb3JlIDEyOjAwcG0gKG5vb24pID0gbW9ybmluZ1xyXG4gICAgICAgICAgYWZ0ZXJub29uOiAxMjowMHBtIHVudGlsIDU6MDBwbVxyXG4gICAgICAgICAgZXZlbmluZzogNTowMHBtIC0gMTE6NTlwbVxyXG4gICAgICAgICovXHJcbiAgICAgICAgLy8gU2luY2Ugc2xvdHMgbXVzdCBiZSBmb3IgdGhlIHNhbWUgZGF0ZSxcclxuICAgICAgICAvLyB0byBkZWZpbmUgdGhlIGdyb3VwcyByYW5nZXMgdXNlIHRoZSBmaXJzdCBkYXRlXHJcbiAgICAgICAgdmFyIGRhdGVQYXJ0ID0gdGhpcy5zbG90cygpICYmIHRoaXMuc2xvdHMoKVswXSB8fCBuZXcgRGF0ZSgpO1xyXG4gICAgICAgIHZhciBncm91cHMgPSBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGdyb3VwOiAnTW9ybmluZycsXHJcbiAgICAgICAgICAgICAgICBzbG90czogW10sXHJcbiAgICAgICAgICAgICAgICBzdGFydHM6IG5ldyBUaW1lKGRhdGVQYXJ0LCAwLCAwKSxcclxuICAgICAgICAgICAgICAgIGVuZHM6IG5ldyBUaW1lKGRhdGVQYXJ0LCAxMiwgMClcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZ3JvdXA6ICdBZnRlcm5vb24nLFxyXG4gICAgICAgICAgICAgICAgc2xvdHM6IFtdLFxyXG4gICAgICAgICAgICAgICAgc3RhcnRzOiBuZXcgVGltZShkYXRlUGFydCwgMTIsIDApLFxyXG4gICAgICAgICAgICAgICAgZW5kczogbmV3IFRpbWUoZGF0ZVBhcnQsIDE3LCAwKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBncm91cDogJ0V2ZW5pbmcnLFxyXG4gICAgICAgICAgICAgICAgc2xvdHM6IFtdLFxyXG4gICAgICAgICAgICAgICAgc3RhcnRzOiBuZXcgVGltZShkYXRlUGFydCwgMTcsIDApLFxyXG4gICAgICAgICAgICAgICAgZW5kczogbmV3IFRpbWUoZGF0ZVBhcnQsIDI0LCAwKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXTtcclxuICAgICAgICB2YXIgc2xvdHMgPSB0aGlzLnNsb3RzKCkuc29ydCgpO1xyXG4gICAgICAgIHNsb3RzLmZvckVhY2goZnVuY3Rpb24oc2xvdCkge1xyXG4gICAgICAgICAgICBncm91cHMuZm9yRWFjaChmdW5jdGlvbihncm91cCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNsb3QgPj0gZ3JvdXAuc3RhcnRzICYmXHJcbiAgICAgICAgICAgICAgICAgICAgc2xvdCA8IGdyb3VwLmVuZHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBncm91cC5zbG90cy5wdXNoKHNsb3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdyb3VwcztcclxuXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZWxlY3RlZERhdGV0aW1lID0ga28ub2JzZXJ2YWJsZShudWxsKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZWxlY3REYXRldGltZSA9IGZ1bmN0aW9uKHNlbGVjdGVkRGF0ZXRpbWUpIHtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnNlbGVjdGVkRGF0ZXRpbWUoc2VsZWN0ZWREYXRldGltZSk7XHJcblxyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG5cclxufVxyXG4iLCIvKipcbiAgICBIb21lIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcblxudmFyIHNpbmdsZXRvbiA9IG51bGw7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRIb21lKCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgSG9tZUFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcbiAgICBcbiAgICByZXR1cm4gc2luZ2xldG9uO1xufTtcblxuZnVuY3Rpb24gSG9tZUFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICB0aGlzLiRuZXh0Qm9va2luZyA9ICRhY3Rpdml0eS5maW5kKCcjaG9tZU5leHRCb29raW5nJyk7XG4gICAgdGhpcy4kdXBjb21pbmdCb29raW5ncyA9ICRhY3Rpdml0eS5maW5kKCcjaG9tZVVwY29taW5nQm9va2luZ3MnKTtcbiAgICB0aGlzLiRpbmJveCA9ICRhY3Rpdml0eS5maW5kKCcjaG9tZUluYm94Jyk7XG4gICAgdGhpcy4kcGVyZm9ybWFuY2UgPSAkYWN0aXZpdHkuZmluZCgnI2hvbWVQZXJmb3JtYW5jZScpO1xuICAgIHRoaXMuJGdldE1vcmUgPSAkYWN0aXZpdHkuZmluZCgnI2hvbWVHZXRNb3JlJyk7XG5cbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XG5cbiAgICAvLyBUZXN0aW5nRGF0YVxuICAgIHNldFNvbWVUZXN0aW5nRGF0YSh0aGlzLmRhdGFWaWV3KTtcblxuICAgIC8vIE9iamVjdCB0byBob2xkIHRoZSBvcHRpb25zIHBhc3NlZCBvbiAnc2hvdycgYXMgYSByZXN1bHRcbiAgICAvLyBvZiBhIHJlcXVlc3QgZnJvbSBhbm90aGVyIGFjdGl2aXR5XG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XG4gICAgXG4gICAgdGhpcy5uYXZBY3Rpb24gPSBOYXZBY3Rpb24ubmV3SXRlbTtcbn1cblxuSG9tZUFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG4gXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG9wdGlvbnM7XG59O1xuXG52YXIgVXBjb21pbmdCb29raW5nc1N1bW1hcnkgPSByZXF1aXJlKCcuLi9tb2RlbHMvVXBjb21pbmdCb29raW5nc1N1bW1hcnknKSxcbiAgICBNYWlsRm9sZGVyID0gcmVxdWlyZSgnLi4vbW9kZWxzL01haWxGb2xkZXInKSxcbiAgICBQZXJmb3JtYW5jZVN1bW1hcnkgPSByZXF1aXJlKCcuLi9tb2RlbHMvUGVyZm9ybWFuY2VTdW1tYXJ5JyksXG4gICAgR2V0TW9yZSA9IHJlcXVpcmUoJy4uL21vZGVscy9HZXRNb3JlJyk7XG5cbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcblxuICAgIHRoaXMudXBjb21pbmdCb29raW5ncyA9IG5ldyBVcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeSgpO1xuXG4gICAgLy8gOkFwcG9pbnRtZW50XG4gICAgdGhpcy5uZXh0Qm9va2luZyA9IGtvLm9ic2VydmFibGUobnVsbCk7XG4gICAgXG4gICAgdGhpcy5pbmJveCA9IG5ldyBNYWlsRm9sZGVyKHtcbiAgICAgICAgdG9wTnVtYmVyOiA0XG4gICAgfSk7XG4gICAgXG4gICAgdGhpcy5wZXJmb3JtYW5jZSA9IG5ldyBQZXJmb3JtYW5jZVN1bW1hcnkoKTtcbiAgICBcbiAgICB0aGlzLmdldE1vcmUgPSBuZXcgR2V0TW9yZSgpO1xufVxuXG4vKiogVEVTVElORyBEQVRBICoqL1xudmFyIFRpbWUgPSByZXF1aXJlKCcuLi91dGlscy9UaW1lJyk7XG5cbmZ1bmN0aW9uIHNldFNvbWVUZXN0aW5nRGF0YShkYXRhVmlldykge1xuICAgIGRhdGFWaWV3Lm5leHRCb29raW5nKHJlcXVpcmUoJy4uL3Rlc3RkYXRhL2NhbGVuZGFyQXBwb2ludG1lbnRzJykuYXBwb2ludG1lbnRzWzBdKTtcbiAgICBcbiAgICBkYXRhVmlldy51cGNvbWluZ0Jvb2tpbmdzLnRvZGF5LnF1YW50aXR5KDgpO1xuICAgIGRhdGFWaWV3LnVwY29taW5nQm9va2luZ3MudG9kYXkudGltZShuZXcgVGltZSg1LCAxNSkpO1xuICAgIGRhdGFWaWV3LnVwY29taW5nQm9va2luZ3MudG9tb3Jyb3cucXVhbnRpdHkoMTQpO1xuICAgIGRhdGFWaWV3LnVwY29taW5nQm9va2luZ3MudG9tb3Jyb3cudGltZShuZXcgVGltZSg4LCAzMCkpO1xuICAgIGRhdGFWaWV3LnVwY29taW5nQm9va2luZ3MubmV4dFdlZWsucXVhbnRpdHkoMTIzKTtcbiAgICBcbiAgICBkYXRhVmlldy5pbmJveC5tZXNzYWdlcyhyZXF1aXJlKCcuLi90ZXN0ZGF0YS9tZXNzYWdlcycpLm1lc3NhZ2VzKTtcbiAgICBcbiAgICBkYXRhVmlldy5wZXJmb3JtYW5jZS5lYXJuaW5ncy5jdXJyZW50QW1vdW50KDI0MDApO1xuICAgIGRhdGFWaWV3LnBlcmZvcm1hbmNlLmVhcm5pbmdzLm5leHRBbW91bnQoNjIwMC41NCk7XG4gICAgZGF0YVZpZXcucGVyZm9ybWFuY2UudGltZUJvb2tlZC5wZXJjZW50KDAuOTMpO1xuICAgIFxuICAgIGRhdGFWaWV3LmdldE1vcmUubW9kZWwudXBkYXRlV2l0aCh7XG4gICAgICAgIGF2YWlsYWJpbGl0eTogdHJ1ZSxcbiAgICAgICAgcGF5bWVudHM6IHRydWUsXG4gICAgICAgIHByb2ZpbGU6IHRydWUsXG4gICAgICAgIGNvb3A6IHRydWVcbiAgICB9KTtcbn1cbiIsIi8qKlxuICAgIEluZGV4IGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIHNpbmdsZXRvbiA9IG51bGw7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRJbmRleCgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IEluZGV4QWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xuICAgIFxuICAgIHJldHVybiBzaW5nbGV0b247XG59O1xuXG5mdW5jdGlvbiBJbmRleEFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICBcbiAgICB0aGlzLm5hdkFjdGlvbiA9IG51bGw7XG4gICAgXG4gICAgLy8gQW55IHVzZXIgY2FuIGFjY2VzcyB0aGlzXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IG51bGw7XG59XG5cbkluZGV4QWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcbiAgICAvLyBJdCBjaGVja3MgaWYgdGhlIHVzZXIgaXMgbG9nZ2VkIHNvIHRoZW4gXG4gICAgLy8gdGhlaXIgJ2xvZ2dlZCBpbmRleCcgaXMgdGhlIGRhc2hib2FyZCBub3QgdGhpc1xuICAgIC8vIHBhZ2UgdGhhdCBpcyBmb2N1c2VkIG9uIGFub255bW91cyB1c2Vyc1xuICAgIGlmICghdGhpcy5hcHAudXNlcigpLmlzQW5vbnltb3VzKCkpIHtcbiAgICAgICAgdGhpcy5hcHAuZ29EYXNoYm9hcmQoKTtcbiAgICB9XG59O1xuIiwiLyoqXG4gICAgTGVhcm5Nb3JlIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcblxudmFyIHNpbmdsZXRvbiA9IG51bGw7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRMZWFybk1vcmUoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBMZWFybk1vcmVBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XG4gICAgXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbn07XG5cbmZ1bmN0aW9uIExlYXJuTW9yZUFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XG4gICAgXG4gICAgdGhpcy5uYXZBY3Rpb24gPSBOYXZBY3Rpb24uZ29CYWNrO1xufVxuXG5MZWFybk1vcmVBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuXG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5yb3V0ZSAmJlxuICAgICAgICBvcHRpb25zLnJvdXRlLnNlZ21lbnRzICYmXG4gICAgICAgIG9wdGlvbnMucm91dGUuc2VnbWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuZGF0YVZpZXcucHJvZmlsZShvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdKTtcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgdGhpcy5wcm9maWxlID0ga28ub2JzZXJ2YWJsZSgnY3VzdG9tZXInKTtcbn0iLCIvKipcbiAgICBMb2NhdGlvbkVkaXRpb24gYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcbiAgICBMb2NhdGlvbiA9IHJlcXVpcmUoJy4uL21vZGVscy9Mb2NhdGlvbicpO1xuXG52YXIgc2luZ2xldG9uID0gbnVsbDtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdExvY2F0aW9uRWRpdGlvbigkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IExvY2F0aW9uRWRpdGlvbkFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcbiAgICBcbiAgICByZXR1cm4gc2luZ2xldG9uO1xufTtcblxuZnVuY3Rpb24gTG9jYXRpb25FZGl0aW9uQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIHRoaXMuZGF0YVZpZXcgPSBuZXcgVmlld01vZGVsKCk7XG4gICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLmRhdGFWaWV3LCAkYWN0aXZpdHkuZ2V0KDApKTtcbiAgICBcbiAgICB0aGlzLm5hdkFjdGlvbiA9IG51bGw7XG59XG5cbkxvY2F0aW9uRWRpdGlvbkFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG4gICAgLy9qc2hpbnQgbWF4Y29tcGxleGl0eToxMFxuICAgIFxuICAgIHZhciBpZCA9IDAsXG4gICAgICAgIGNyZWF0ZSA9ICcnO1xuXG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMubG9jYXRpb25JRCkge1xuICAgICAgICAgICAgaWQgPSBvcHRpb25zLmxvY2F0aW9uSUQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5yb3V0ZSAmJiBvcHRpb25zLnJvdXRlLnNlZ21lbnRzKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlkID0gcGFyc2VJbnQob3B0aW9ucy5yb3V0ZS5zZWdtZW50c1swXSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5jcmVhdGUpIHtcbiAgICAgICAgICAgIGNyZWF0ZSA9IG9wdGlvbnMuY3JlYXRlO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGlmIChpZCkge1xuICAgICAgICAvLyBUT0RPXG4gICAgICAgIC8vIHZhciBsb2NhdGlvbiA9IHRoaXMuYXBwLm1vZGVsLmdldExvY2F0aW9uKGlkKVxuICAgICAgICAvLyBOT1RFIHRlc3RpbmcgZGF0YVxuICAgICAgICB2YXIgbG9jYXRpb25zID0ge1xuICAgICAgICAgICAgJzEnOiBuZXcgTG9jYXRpb24oe1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uSUQ6IDEsXG4gICAgICAgICAgICAgICAgbmFtZTogJ0hvbWUnLFxuICAgICAgICAgICAgICAgIGFkZHJlc3NMaW5lMTogJ0hlcmUgU3RyZWV0JyxcbiAgICAgICAgICAgICAgICBjaXR5OiAnU2FuIEZyYW5jaXNjbycsXG4gICAgICAgICAgICAgICAgcG9zdGFsQ29kZTogJzkwMDAxJyxcbiAgICAgICAgICAgICAgICBzdGF0ZVByb3ZpbmNlQ29kZTogJ0NBJyxcbiAgICAgICAgICAgICAgICBjb3VudHJ5SUQ6IDEsXG4gICAgICAgICAgICAgICAgaXNTZXJ2aWNlUmFkaXVzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGlzU2VydmljZUxvY2F0aW9uOiBmYWxzZVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAnMic6IG5ldyBMb2NhdGlvbih7XG4gICAgICAgICAgICAgICAgbG9jYXRpb25JRDogMSxcbiAgICAgICAgICAgICAgICBuYW1lOiAnV29ya3Nob3AnLFxuICAgICAgICAgICAgICAgIGFkZHJlc3NMaW5lMTogJ1Vua25vdyBTdHJlZXQnLFxuICAgICAgICAgICAgICAgIGNpdHk6ICdTYW4gRnJhbmNpc2NvJyxcbiAgICAgICAgICAgICAgICBwb3N0YWxDb2RlOiAnOTAwMDEnLFxuICAgICAgICAgICAgICAgIHN0YXRlUHJvdmluY2VDb2RlOiAnQ0EnLFxuICAgICAgICAgICAgICAgIGNvdW50cnlJRDogMSxcbiAgICAgICAgICAgICAgICBpc1NlcnZpY2VSYWRpdXM6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGlzU2VydmljZUxvY2F0aW9uOiB0cnVlXG4gICAgICAgICAgICB9KVxuICAgICAgICB9O1xuICAgICAgICB2YXIgbG9jYXRpb24gPSBsb2NhdGlvbnNbaWRdO1xuICAgICAgICBpZiAobG9jYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9jYXRpb24obG9jYXRpb24pO1xuXG4gICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmhlYWRlcignRWRpdCBMb2NhdGlvbicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5sb2NhdGlvbihudWxsKTtcbiAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcuaGVhZGVyKCdVbmtub3cgbG9jYXRpb24gb3Igd2FzIGRlbGV0ZWQnKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgLy8gTmV3IGxvY2F0aW9uXG4gICAgICAgIHRoaXMuZGF0YVZpZXcubG9jYXRpb24obmV3IExvY2F0aW9uKCkpO1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoIChvcHRpb25zLmNyZWF0ZSkge1xuICAgICAgICAgICAgY2FzZSAnc2VydmljZVJhZGl1cyc6XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5sb2NhdGlvbigpLmlzU2VydmljZVJhZGl1cyh0cnVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmhlYWRlcignQWRkIGEgc2VydmljZSByYWRpdXMnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3NlcnZpY2VMb2NhdGlvbic6XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5sb2NhdGlvbigpLmlzU2VydmljZUxvY2F0aW9uKHRydWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcuaGVhZGVyKCdBZGQgYSBzZXJ2aWNlIGxvY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9jYXRpb24oKS5pc1NlcnZpY2VSYWRpdXModHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5sb2NhdGlvbigpLmlzU2VydmljZUxvY2F0aW9uKHRydWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcuaGVhZGVyKCdBZGQgYSBsb2NhdGlvbicpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuICAgIFxuICAgIHRoaXMubG9jYXRpb24gPSBrby5vYnNlcnZhYmxlKG5ldyBMb2NhdGlvbigpKTtcbiAgICBcbiAgICB0aGlzLmhlYWRlciA9IGtvLm9ic2VydmFibGUoJ0VkaXQgTG9jYXRpb24nKTtcbiAgICBcbiAgICAvLyBUT0RPXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24oKSB7fTtcbiAgICB0aGlzLmNhbmNlbCA9IGZ1bmN0aW9uKCkge307XG59IiwiLyoqXHJcbiAgICBsb2NhdGlvbnMgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbiAgICBcclxudmFyIHNpbmdsZXRvbiA9IG51bGw7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0TG9jYXRpb25zKCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcclxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgTG9jYXRpb25zQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xyXG4gICAgXHJcbiAgICByZXR1cm4gc2luZ2xldG9uO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gTG9jYXRpb25zQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xyXG4gICAgdGhpcy4kbGlzdFZpZXcgPSAkYWN0aXZpdHkuZmluZCgnI2xvY2F0aW9uc0xpc3RWaWV3Jyk7XHJcblxyXG4gICAgdmFyIGRhdGFWaWV3ID0gdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcclxuICAgIGtvLmFwcGx5QmluZGluZ3MoZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xyXG5cclxuICAgIC8vIFRlc3RpbmdEYXRhXHJcbiAgICBkYXRhVmlldy5sb2NhdGlvbnMocmVxdWlyZSgnLi4vdGVzdGRhdGEvbG9jYXRpb25zJykubG9jYXRpb25zKTtcclxuXHJcbiAgICAvLyBIYW5kbGVyIHRvIHVwZGF0ZSBoZWFkZXIgYmFzZWQgb24gYSBtb2RlIGNoYW5nZTpcclxuICAgIHRoaXMuZGF0YVZpZXcuaXNTZWxlY3Rpb25Nb2RlLnN1YnNjcmliZShmdW5jdGlvbiAoaXRJcykge1xyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuaGVhZGVyVGV4dChpdElzID8gJ1NlbGVjdC9BZGQgbG9jYXRpb24nIDogJ0xvY2F0aW9ucycpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAvLyBPYmplY3QgdG8gaG9sZCB0aGUgb3B0aW9ucyBwYXNzZWQgb24gJ3Nob3cnIGFzIGEgcmVzdWx0XHJcbiAgICAvLyBvZiBhIHJlcXVlc3QgZnJvbSBhbm90aGVyIGFjdGl2aXR5XHJcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gbnVsbDtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciB0byBnbyBiYWNrIHdpdGggdGhlIHNlbGVjdGVkIGxvY2F0aW9uIHdoZW4gXHJcbiAgICAvLyBzZWxlY3Rpb24gbW9kZSBnb2VzIG9mZiBhbmQgcmVxdWVzdEluZm8gaXMgZm9yXHJcbiAgICAvLyAnc2VsZWN0IG1vZGUnXHJcbiAgICB0aGlzLmRhdGFWaWV3LmlzU2VsZWN0aW9uTW9kZS5zdWJzY3JpYmUoZnVuY3Rpb24gKGl0SXMpIHtcclxuICAgICAgICAvLyBXZSBoYXZlIGEgcmVxdWVzdCBhbmRcclxuICAgICAgICAvLyBpdCByZXF1ZXN0ZWQgdG8gc2VsZWN0IGEgbG9jYXRpb25cclxuICAgICAgICAvLyBhbmQgc2VsZWN0aW9uIG1vZGUgZ29lcyBvZmZcclxuICAgICAgICBpZiAodGhpcy5yZXF1ZXN0SW5mbyAmJlxyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvLnNlbGVjdExvY2F0aW9uID09PSB0cnVlICYmXHJcbiAgICAgICAgICAgIGl0SXMgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBQYXNzIHRoZSBzZWxlY3RlZCBjbGllbnQgaW4gdGhlIGluZm9cclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mby5zZWxlY3RlZExvY2F0aW9uID0gdGhpcy5kYXRhVmlldy5zZWxlY3RlZExvY2F0aW9uKCk7XHJcbiAgICAgICAgICAgIC8vIEFuZCBnbyBiYWNrXHJcbiAgICAgICAgICAgIHRoaXMuYXBwLmdvQmFjayh0aGlzLnJlcXVlc3RJbmZvKTtcclxuICAgICAgICAgICAgLy8gTGFzdCwgY2xlYXIgcmVxdWVzdEluZm9cclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufVxyXG5cclxuTG9jYXRpb25zQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcclxuICBcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG9wdGlvbnM7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuc2VsZWN0TG9jYXRpb24gPT09IHRydWUpIHtcclxuICAgICAgICB0aGlzLmRhdGFWaWV3LmlzU2VsZWN0aW9uTW9kZSh0cnVlKTtcclxuICAgICAgICAvLyBwcmVzZXQ6XHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5zZWxlY3RlZExvY2F0aW9uKG9wdGlvbnMuc2VsZWN0ZWRMb2NhdGlvbik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChvcHRpb25zLnJvdXRlICYmIG9wdGlvbnMucm91dGUuc2VnbWVudHMpIHtcclxuICAgICAgICB2YXIgaWQgPSBvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdO1xyXG4gICAgICAgIGlmIChpZCkge1xyXG4gICAgICAgICAgICBpZiAoaWQgPT09ICduZXcnKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5zaGVsbC5zaG93QWN0aXZpdHkoJ2xvY2F0aW9uRWRpdGlvbicsIHtcclxuICAgICAgICAgICAgICAgICAgICBjcmVhdGU6IG9wdGlvbnMucm91dGUuc2VnbWVudHNbMV0gLy8gJ3NlcnZpY2VSYWRpdXMnLCAnc2VydmljZUxvY2F0aW9uJ1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5zaGVsbC5zaG93QWN0aXZpdHkoJ2xvY2F0aW9uRWRpdGlvbicsIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbklEOiBpZFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XHJcblxyXG4gICAgdGhpcy5oZWFkZXJUZXh0ID0ga28ub2JzZXJ2YWJsZSgnTG9jYXRpb25zJyk7XHJcblxyXG4gICAgLy8gRnVsbCBsaXN0IG9mIGxvY2F0aW9uc1xyXG4gICAgdGhpcy5sb2NhdGlvbnMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xyXG5cclxuICAgIC8vIEVzcGVjaWFsIG1vZGUgd2hlbiBpbnN0ZWFkIG9mIHBpY2sgYW5kIGVkaXQgd2UgYXJlIGp1c3Qgc2VsZWN0aW5nXHJcbiAgICAvLyAod2hlbiBlZGl0aW5nIGFuIGFwcG9pbnRtZW50KVxyXG4gICAgdGhpcy5pc1NlbGVjdGlvbk1vZGUgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuXHJcbiAgICB0aGlzLnNlbGVjdGVkTG9jYXRpb24gPSBrby5vYnNlcnZhYmxlKG51bGwpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlbGVjdExvY2F0aW9uID0gZnVuY3Rpb24oc2VsZWN0ZWRMb2NhdGlvbikge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRMb2NhdGlvbihzZWxlY3RlZExvY2F0aW9uKTtcclxuICAgICAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZShmYWxzZSk7XHJcblxyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG59XHJcbiIsIi8qKlxuICAgIEluZGV4IGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKSxcbiAgICBVc2VyID0gcmVxdWlyZSgnLi4vbW9kZWxzL1VzZXInKTtcblxudmFyIHNpbmdsZXRvbiA9IG51bGw7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRMb2dpbigkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IExvZ2luQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xuICAgIFxuICAgIHJldHVybiBzaW5nbGV0b247XG59O1xuXG5mdW5jdGlvbiBMb2dpbkFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XG4gICAgXG4gICAgdGhpcy5uYXZBY3Rpb24gPSBOYXZBY3Rpb24uZ29CYWNrO1xuICAgIFxuICAgIC8vIFBlcmZvcm0gbG9nLWluIHJlcXVlc3Qgd2hlbiBpcyByZXF1ZXN0ZWQgYnkgdGhlIGZvcm06XG4gICAgdGhpcy5kYXRhVmlldy5pc0xvZ2luZ0luLnN1YnNjcmliZShmdW5jdGlvbih2KSB7XG4gICAgICAgIGlmICh2ID09PSB0cnVlKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFBlcmZvcm0gbG9naW5nXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIE5vdGlmeSBzdGF0ZTpcbiAgICAgICAgICAgIHZhciAkYnRuID0gJGFjdGl2aXR5LmZpbmQoJ1t0eXBlPVwic3VibWl0XCJdJyk7XG4gICAgICAgICAgICAkYnRuLmJ1dHRvbignbG9hZGluZycpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBDbGVhciBwcmV2aW91cyBlcnJvciBzbyBtYWtlcyBjbGVhciB3ZVxuICAgICAgICAgICAgLy8gYXJlIGF0dGVtcHRpbmdcbiAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9naW5FcnJvcignJyk7XG4gICAgICAgIFxuICAgICAgICAgICAgdmFyIGVuZGVkID0gZnVuY3Rpb24gZW5kZWQoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5pc0xvZ2luZ0luKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAkYnRuLmJ1dHRvbigncmVzZXQnKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQWZ0ZXIgY2xlYW4tdXAgZXJyb3IgKHRvIGZvcmNlIHNvbWUgdmlldyB1cGRhdGVzKSxcbiAgICAgICAgICAgIC8vIHZhbGlkYXRlIGFuZCBhYm9ydCBvbiBlcnJvclxuICAgICAgICAgICAgLy8gTWFudWFsbHkgY2hlY2tpbmcgZXJyb3Igb24gZWFjaCBmaWVsZFxuICAgICAgICAgICAgaWYgKHRoaXMuZGF0YVZpZXcudXNlcm5hbWUuZXJyb3IoKSB8fFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcucGFzc3dvcmQuZXJyb3IoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9naW5FcnJvcignUmV2aWV3IHlvdXIgZGF0YScpO1xuICAgICAgICAgICAgICAgIGVuZGVkKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBhcHAubW9kZWwubG9naW4oXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy51c2VybmFtZSgpLFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcucGFzc3dvcmQoKVxuICAgICAgICAgICAgKS50aGVuKGZ1bmN0aW9uKGxvZ2luRGF0YSkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9naW5FcnJvcignJyk7XG4gICAgICAgICAgICAgICAgZW5kZWQoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5nb0Rhc2hib2FyZCgpO1xuXG4gICAgICAgICAgICB9LmJpbmQodGhpcykpLmNhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9naW5FcnJvcignSW52YWxpZCB1c2VybmFtZSBvciBwYXNzd29yZCcpO1xuICAgICAgICAgICAgICAgIGVuZGVkKCk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgICBcbiAgICAvLyBGb2N1cyBmaXJzdCBiYWQgZmllbGQgb24gZXJyb3JcbiAgICB0aGlzLmRhdGFWaWV3LmxvZ2luRXJyb3Iuc3Vic2NyaWJlKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAvLyBMb2dpbiBpcyBlYXN5IHNpbmNlIHdlIG1hcmsgYm90aCB1bmlxdWUgZmllbGRzXG4gICAgICAgIC8vIGFzIGVycm9yIG9uIGxvZ2luRXJyb3IgKGl0cyBhIGdlbmVyYWwgZm9ybSBlcnJvcilcbiAgICAgICAgdmFyIGlucHV0ID0gJGFjdGl2aXR5LmZpbmQoJzppbnB1dCcpLmdldCgwKTtcbiAgICAgICAgaWYgKGVycilcbiAgICAgICAgICAgIGlucHV0LmZvY3VzKCk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlucHV0LmJsdXIoKTtcbiAgICB9KTtcbn1cblxuTG9naW5BY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuICAgIFxuICAgIC8vIE5PVEU6IGRpcmVjbHR5IGVkaXRpbmcgdGhlIGFwcCBzdGF0dXMuXG4gICAgdGhpcy5hcHAuc3RhdHVzKCdsb2dpbicpO1xufTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuICAgIFxuICAgIHRoaXMudXNlcm5hbWUgPSBrby5vYnNlcnZhYmxlKCcnKTtcbiAgICB0aGlzLnBhc3N3b3JkID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgdGhpcy5sb2dpbkVycm9yID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgXG4gICAgdGhpcy5pc0xvZ2luZ0luID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG4gICAgXG4gICAgdGhpcy5wZXJmb3JtTG9naW4gPSBmdW5jdGlvbiBwZXJmb3JtTG9naW4oKSB7XG5cbiAgICAgICAgdGhpcy5pc0xvZ2luZ0luKHRydWUpOyAgICAgICAgXG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIHVzZXJuYW1lIGFzIGFuIGVtYWlsXG4gICAgdmFyIGVtYWlsUmVnZXhwID0gL15bLTAtOUEtWmEteiEjJCUmJyorLz0/Xl9ge3x9fi5dK0BbLTAtOUEtWmEteiEjJCUmJyorLz0/Xl9ge3x9fi5dKyQvO1xuICAgIHRoaXMudXNlcm5hbWUuZXJyb3IgPSBrby5vYnNlcnZhYmxlKCcnKTtcbiAgICB0aGlzLnVzZXJuYW1lLnN1YnNjcmliZShmdW5jdGlvbih2KSB7XG4gICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgICBpZiAoZW1haWxSZWdleHAudGVzdCh2KSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWUuZXJyb3IoJycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZS5lcnJvcignSXMgbm90IGEgdmFsaWQgZW1haWwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudXNlcm5hbWUuZXJyb3IoJ1JlcXVpcmVkJyk7XG4gICAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuICAgIFxuICAgIC8vIHJlcXVpcmVkIHBhc3N3b3JkXG4gICAgdGhpcy5wYXNzd29yZC5lcnJvciA9IGtvLm9ic2VydmFibGUoJycpO1xuICAgIHRoaXMucGFzc3dvcmQuc3Vic2NyaWJlKGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgdmFyIGVyciA9ICcnO1xuICAgICAgICBpZiAoIXYpXG4gICAgICAgICAgICBlcnIgPSAnUmVxdWlyZWQnO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5wYXNzd29yZC5lcnJvcihlcnIpO1xuICAgIH0uYmluZCh0aGlzKSk7XG59XG4iLCIvKipcbiAgICBPbmJvYXJkaW5nQ29tcGxldGUgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2luZ2xldG9uID0gbnVsbDtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdE9uYm9hcmRpbmdDb21wbGV0ZSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IE9uYm9hcmRpbmdDb21wbGV0ZUFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcbiAgICBcbiAgICByZXR1cm4gc2luZ2xldG9uO1xufTtcblxuZnVuY3Rpb24gT25ib2FyZGluZ0NvbXBsZXRlQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIFxuICAgIHRoaXMubmF2QWN0aW9uID0gbnVsbDtcbn1cblxuT25ib2FyZGluZ0NvbXBsZXRlQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcblxufTtcbiIsIi8qKlxuICAgIE9uYm9hcmRpbmdIb21lIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIHNpbmdsZXRvbiA9IG51bGw7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRPbmJvYXJkaW5nSG9tZSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IE9uYm9hcmRpbmdIb21lQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xuICAgIFxuICAgIHJldHVybiBzaW5nbGV0b247XG59O1xuXG5mdW5jdGlvbiBPbmJvYXJkaW5nSG9tZUFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICBcbiAgICB0aGlzLm5hdkFjdGlvbiA9IG51bGw7XG59XG5cbk9uYm9hcmRpbmdIb21lQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcblxufTtcbiIsIi8qKlxuICAgIFBvc2l0aW9ucyBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyk7XG5cbnZhciBzaW5nbGV0b24gPSBudWxsO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0UG9zaXRpb25zKCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgUG9zaXRpb25zQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xuICAgIFxuICAgIHJldHVybiBzaW5nbGV0b247XG59O1xuXG5mdW5jdGlvbiBQb3NpdGlvbnNBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMuZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xuXG4gICAgLy8gVGVzdGluZ0RhdGFcbiAgICBzZXRTb21lVGVzdGluZ0RhdGEodGhpcy5kYXRhVmlldyk7XG5cbiAgICAvLyBPYmplY3QgdG8gaG9sZCB0aGUgb3B0aW9ucyBwYXNzZWQgb24gJ3Nob3cnIGFzIGEgcmVzdWx0XG4gICAgLy8gb2YgYSByZXF1ZXN0IGZyb20gYW5vdGhlciBhY3Rpdml0eVxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xuICAgIFxuICAgIHRoaXMubmF2QWN0aW9uID0gTmF2QWN0aW9uLm5ld0l0ZW07XG59XG5cblBvc2l0aW9uc0FjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG4gXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG9wdGlvbnM7XG59O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG5cbiAgICAvLyBGdWxsIGxpc3Qgb2YgcG9zaXRpb25zXG4gICAgdGhpcy5wb3NpdGlvbnMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xufVxuXG52YXIgUG9zaXRpb24gPSByZXF1aXJlKCcuLi9tb2RlbHMvUG9zaXRpb24nKTtcbi8vIFVzZXJQb3NpdGlvbiBtb2RlbFxuZnVuY3Rpb24gc2V0U29tZVRlc3RpbmdEYXRhKGRhdGF2aWV3KSB7XG4gICAgXG4gICAgZGF0YXZpZXcucG9zaXRpb25zLnB1c2gobmV3IFBvc2l0aW9uKHtcbiAgICAgICAgcG9zaXRpb25TaW5ndWxhcjogJ01hc3NhZ2UgVGhlcmFwaXN0J1xuICAgIH0pKTtcbiAgICBkYXRhdmlldy5wb3NpdGlvbnMucHVzaChuZXcgUG9zaXRpb24oe1xuICAgICAgICBwb3NpdGlvblNpbmd1bGFyOiAnSG91c2VrZWVwZXInXG4gICAgfSkpO1xufSIsIi8qKlxyXG4gICAgc2VydmljZXMgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbiAgICBcclxudmFyIHNpbmdsZXRvbiA9IG51bGw7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0U2VydmljZXMoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxyXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBTZXJ2aWNlc0FjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFNlcnZpY2VzQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xyXG4gICAgdGhpcy4kbGlzdFZpZXcgPSAkYWN0aXZpdHkuZmluZCgnI3NlcnZpY2VzTGlzdFZpZXcnKTtcclxuXHJcbiAgICB2YXIgZGF0YVZpZXcgPSB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xyXG4gICAga28uYXBwbHlCaW5kaW5ncyhkYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XHJcblxyXG4gICAgLy8gVGVzdGluZ0RhdGFcclxuICAgIGRhdGFWaWV3LnNlcnZpY2VzKHJlcXVpcmUoJy4uL3Rlc3RkYXRhL3NlcnZpY2VzJykuc2VydmljZXMubWFwKFNlbGVjdGFibGUpKTtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciB0byB1cGRhdGUgaGVhZGVyIGJhc2VkIG9uIGEgbW9kZSBjaGFuZ2U6XHJcbiAgICB0aGlzLmRhdGFWaWV3LmlzU2VsZWN0aW9uTW9kZS5zdWJzY3JpYmUoZnVuY3Rpb24gKGl0SXMpIHtcclxuICAgICAgICB0aGlzLmRhdGFWaWV3LmhlYWRlclRleHQoaXRJcyA/ICdTZWxlY3Qgc2VydmljZShzKScgOiAnU2VydmljZXMnKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgLy8gT2JqZWN0IHRvIGhvbGQgdGhlIG9wdGlvbnMgcGFzc2VkIG9uICdzaG93JyBhcyBhIHJlc3VsdFxyXG4gICAgLy8gb2YgYSByZXF1ZXN0IGZyb20gYW5vdGhlciBhY3Rpdml0eVxyXG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XHJcbiAgICBcclxuICAgIC8vIEhhbmRsZXIgdG8gZ28gYmFjayB3aXRoIHRoZSBzZWxlY3RlZCBzZXJ2aWNlIHdoZW4gXHJcbiAgICAvLyBzZWxlY3Rpb24gbW9kZSBnb2VzIG9mZiBhbmQgcmVxdWVzdEluZm8gaXMgZm9yXHJcbiAgICAvLyAnc2VsZWN0IG1vZGUnXHJcbiAgICB0aGlzLmRhdGFWaWV3LmlzU2VsZWN0aW9uTW9kZS5zdWJzY3JpYmUoZnVuY3Rpb24gKGl0SXMpIHtcclxuICAgICAgICAvLyBXZSBoYXZlIGEgcmVxdWVzdCBhbmRcclxuICAgICAgICAvLyBpdCByZXF1ZXN0ZWQgdG8gc2VsZWN0IGEgc2VydmljZVxyXG4gICAgICAgIC8vIGFuZCBzZWxlY3Rpb24gbW9kZSBnb2VzIG9mZlxyXG4gICAgICAgIGlmICh0aGlzLnJlcXVlc3RJbmZvICYmXHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8uc2VsZWN0U2VydmljZXMgPT09IHRydWUgJiZcclxuICAgICAgICAgICAgaXRJcyA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFBhc3MgdGhlIHNlbGVjdGVkIGNsaWVudCBpbiB0aGUgaW5mb1xyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvLnNlbGVjdGVkU2VydmljZXMgPSB0aGlzLmRhdGFWaWV3LnNlbGVjdGVkU2VydmljZXMoKTtcclxuICAgICAgICAgICAgLy8gQW5kIGdvIGJhY2tcclxuICAgICAgICAgICAgdGhpcy5hcHAuZ29CYWNrKHRoaXMucmVxdWVzdEluZm8pO1xyXG4gICAgICAgICAgICAvLyBMYXN0LCBjbGVhciByZXF1ZXN0SW5mb1xyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59XHJcblxyXG5TZXJ2aWNlc0FjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcblxyXG4gIFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gb3B0aW9ucztcclxuXHJcbiAgICBpZiAob3B0aW9ucy5zZWxlY3RTZXJ2aWNlcyA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuaXNTZWxlY3Rpb25Nb2RlKHRydWUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8qIFRyaWFscyB0byBwcmVzZXRzIHRoZSBzZWxlY3RlZCBzZXJ2aWNlcywgTk9UIFdPUktJTkdcclxuICAgICAgICB2YXIgc2VydmljZXMgPSAob3B0aW9ucy5zZWxlY3RlZFNlcnZpY2VzIHx8IFtdKTtcclxuICAgICAgICB2YXIgc2VsZWN0ZWRTZXJ2aWNlcyA9IHRoaXMuZGF0YVZpZXcuc2VsZWN0ZWRTZXJ2aWNlcztcclxuICAgICAgICBzZWxlY3RlZFNlcnZpY2VzLnJlbW92ZUFsbCgpO1xyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuc2VydmljZXMoKS5mb3JFYWNoKGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgc2VydmljZXMuZm9yRWFjaChmdW5jdGlvbihzZWxTZXJ2aWNlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsU2VydmljZSA9PT0gc2VydmljZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlcnZpY2UuaXNTZWxlY3RlZCh0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZFNlcnZpY2VzLnB1c2goc2VydmljZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlcnZpY2UuaXNTZWxlY3RlZChmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICovXHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBTZWxlY3RhYmxlKG9iaikge1xyXG4gICAgb2JqLmlzU2VsZWN0ZWQgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuICAgIHJldHVybiBvYmo7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcclxuXHJcbiAgICB0aGlzLmhlYWRlclRleHQgPSBrby5vYnNlcnZhYmxlKCdTZXJ2aWNlcycpO1xyXG5cclxuICAgIC8vIEZ1bGwgbGlzdCBvZiBzZXJ2aWNlc1xyXG4gICAgdGhpcy5zZXJ2aWNlcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcblxyXG4gICAgLy8gRXNwZWNpYWwgbW9kZSB3aGVuIGluc3RlYWQgb2YgcGljayBhbmQgZWRpdCB3ZSBhcmUganVzdCBzZWxlY3RpbmdcclxuICAgIC8vICh3aGVuIGVkaXRpbmcgYW4gYXBwb2ludG1lbnQpXHJcbiAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZSA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG5cclxuICAgIC8vIEdyb3VwZWQgbGlzdCBvZiBwcmljaW5nczpcclxuICAgIC8vIERlZmluZWQgZ3JvdXBzOiByZWd1bGFyIHNlcnZpY2VzIGFuZCBhZGQtb25zXHJcbiAgICB0aGlzLmdyb3VwZWRTZXJ2aWNlcyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIHZhciBzZXJ2aWNlcyA9IHRoaXMuc2VydmljZXMoKTtcclxuXHJcbiAgICAgICAgdmFyIHNlcnZpY2VzR3JvdXAgPSB7XHJcbiAgICAgICAgICAgICAgICBncm91cDogJ1NlcnZpY2VzJyxcclxuICAgICAgICAgICAgICAgIHNlcnZpY2VzOiBbXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBhZGRvbnNHcm91cCA9IHtcclxuICAgICAgICAgICAgICAgIGdyb3VwOiAnQWRkLW9uIHNlcnZpY2VzJyxcclxuICAgICAgICAgICAgICAgIHNlcnZpY2VzOiBbXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBncm91cHMgPSBbc2VydmljZXNHcm91cCwgYWRkb25zR3JvdXBdO1xyXG5cclxuICAgICAgICBzZXJ2aWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBpc0FkZG9uID0gc2VydmljZS5pc0FkZG9uKCk7XHJcbiAgICAgICAgICAgIGlmIChpc0FkZG9uKSB7XHJcbiAgICAgICAgICAgICAgICBhZGRvbnNHcm91cC5zZXJ2aWNlcy5wdXNoKHNlcnZpY2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2VydmljZXNHcm91cC5zZXJ2aWNlcy5wdXNoKHNlcnZpY2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBncm91cHM7XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2VsZWN0ZWRTZXJ2aWNlcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcbiAgICAvKipcclxuICAgICAgICBUb2dnbGUgdGhlIHNlbGVjdGlvbiBzdGF0dXMgb2YgYSBzZXJ2aWNlLCBhZGRpbmdcclxuICAgICAgICBvciByZW1vdmluZyBpdCBmcm9tIHRoZSAnc2VsZWN0ZWRTZXJ2aWNlcycgYXJyYXkuXHJcbiAgICAqKi9cclxuICAgIHRoaXMudG9nZ2xlU2VydmljZVNlbGVjdGlvbiA9IGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgaW5JbmRleCA9IC0xLFxyXG4gICAgICAgICAgICBpc1NlbGVjdGVkID0gdGhpcy5zZWxlY3RlZFNlcnZpY2VzKCkuc29tZShmdW5jdGlvbihzZWxlY3RlZFNlcnZpY2UsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RlZFNlcnZpY2UgPT09IHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgICAgIGluSW5kZXggPSBpbmRleDtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2VydmljZS5pc1NlbGVjdGVkKCFpc1NlbGVjdGVkKTtcclxuXHJcbiAgICAgICAgaWYgKGlzU2VsZWN0ZWQpXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRTZXJ2aWNlcy5zcGxpY2UoaW5JbmRleCwgMSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkU2VydmljZXMucHVzaChzZXJ2aWNlKTtcclxuXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEVuZHMgdGhlIHNlbGVjdGlvbiBwcm9jZXNzLCByZWFkeSB0byBjb2xsZWN0IHNlbGVjdGlvblxyXG4gICAgICAgIGFuZCBwYXNzaW5nIGl0IHRvIHRoZSByZXF1ZXN0IGFjdGl2aXR5XHJcbiAgICAqKi9cclxuICAgIHRoaXMuZW5kU2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5pc1NlbGVjdGlvbk1vZGUoZmFsc2UpO1xyXG4gICAgICAgIFxyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG59XHJcbiIsIi8qKlxuICAgIFNpZ251cCBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyk7XG5cbnZhciBzaW5nbGV0b24gPSBudWxsO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0U2lnbnVwKCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgU2lnbnVwQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xuICAgIFxuICAgIHJldHVybiBzaW5nbGV0b247XG59O1xuXG5mdW5jdGlvbiBTaWdudXBBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMuZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xuICAgIFxuICAgIHRoaXMubmF2QWN0aW9uID0gTmF2QWN0aW9uLmdvQmFjaztcbiAgICBcbiAgICAvLyBUT0RPOiBpbXBsZW1lbnQgcmVhbCBsb2dpblxuICAgIC8vIFRFU1RJTkc6IHRoZSBidXR0b24gc3RhdGUgd2l0aCBhIGZha2UgZGVsYXlcbiAgICAkYWN0aXZpdHkuZmluZCgnI2FjY291bnRTaWduVXBCdG4nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgJGJ0biA9ICQoZS50YXJnZXQpLmJ1dHRvbignbG9hZGluZycpO1xuXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIFxuICAgICAgICAgICAgJGJ0bi5idXR0b24oJ3Jlc2V0Jyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFRFU1RJTkc6IHBvcHVsYXRpbmcgdXNlclxuICAgICAgICAgICAgZmFrZVNpZ251cCh0aGlzLmFwcCk7XG4gICAgICAgICAgXG4gICAgICAgICAgICAvLyBOT1RFOiBvbmJvYXJkaW5nIG9yIG5vdD9cbiAgICAgICAgICAgIHZhciBvbmJvYXJkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAob25ib2FyZGluZykge1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwLmdvKCdvbmJvYXJkaW5nSG9tZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuZ28oJ2hvbWUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMTAwMCk7XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0uYmluZCh0aGlzKSk7XG59XG5cblNpZ251cEFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG5cbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnJvdXRlICYmXG4gICAgICAgIG9wdGlvbnMucm91dGUuc2VnbWVudHMgJiZcbiAgICAgICAgb3B0aW9ucy5yb3V0ZS5zZWdtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5kYXRhVmlldy5wcm9maWxlKG9wdGlvbnMucm91dGUuc2VnbWVudHNbMF0pO1xuICAgIH1cbn07XG5cbi8vIFRPRE86IHJlbW92ZSBhZnRlciBpbXBsZW1lbnQgcmVhbCBsb2dpblxuZnVuY3Rpb24gZmFrZVNpZ251cChhcHApIHtcbiAgICBhcHAubW9kZWwudXNlcih7IC8vIG5ldyBVc2VyKHt9XG4gICAgICAgIGVtYWlsOiBrby5vYnNlcnZhYmxlKCd0ZXN0QGxvY29ub21pY3MuY29tJyksXG4gICAgICAgIGZpcnN0TmFtZToga28ub2JzZXJ2YWJsZSgnVXNlcm5hbWUnKSxcbiAgICAgICAgb25ib2FyZGluZ1N0ZXA6IGtvLm9ic2VydmFibGUobnVsbCksXG4gICAgICAgIHVzZXJUeXBlOiBrby5vYnNlcnZhYmxlKCdwJylcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuICAgIHRoaXMucHJvZmlsZSA9IGtvLm9ic2VydmFibGUoJ2N1c3RvbWVyJyk7XG59IiwiLyoqXHJcbiAgICB0ZXh0RWRpdG9yIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xyXG4gICAgXHJcbnZhciBzaW5nbGV0b24gPSBudWxsO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFRleHRFZGl0b3IoJGFjdGl2aXR5LCBhcHApIHtcclxuICAgIFxyXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcclxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgVGV4dEVkaXRvckFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFRleHRFZGl0b3JBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIC8vIEZpZWxkc1xyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuICAgIHRoaXMuJHRleHRhcmVhID0gdGhpcy4kYWN0aXZpdHkuZmluZCgndGV4dGFyZWEnKTtcclxuICAgIHRoaXMudGV4dGFyZWEgPSB0aGlzLiR0ZXh0YXJlYS5nZXQoMCk7XHJcblxyXG4gICAgLy8gRGF0YVxyXG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcclxuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XHJcbiAgICBcclxuICAgIC8vIE9iamVjdCB0byBob2xkIHRoZSBvcHRpb25zIHBhc3NlZCBvbiAnc2hvdycgYXMgYSByZXN1bHRcclxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyc1xyXG4gICAgLy8gSGFuZGxlciBmb3IgdGhlICdzYXZlZCcgZXZlbnQgc28gdGhlIGFjdGl2aXR5XHJcbiAgICAvLyByZXR1cm5zIGJhY2sgdG8gdGhlIHJlcXVlc3RlciBhY3Rpdml0eSBnaXZpbmcgaXRcclxuICAgIC8vIHRoZSBuZXcgdGV4dFxyXG4gICAgdGhpcy5kYXRhVmlldy5vbignc2F2ZWQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAodGhpcy5yZXF1ZXN0SW5mbykge1xyXG4gICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGluZm8gd2l0aCB0aGUgbmV3IHRleHRcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mby50ZXh0ID0gdGhpcy5kYXRhVmlldy50ZXh0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBhbmQgcGFzcyBpdCBiYWNrXHJcbiAgICAgICAgdGhpcy5hcHAuZ29CYWNrKHRoaXMucmVxdWVzdEluZm8pO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuIFxyXG4gICAgLy8gSGFuZGxlciB0aGUgY2FuY2VsIGV2ZW50XHJcbiAgICB0aGlzLmRhdGFWaWV3Lm9uKCdjYW5jZWwnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyByZXR1cm4sIG5vdGhpbmcgY2hhbmdlZFxyXG4gICAgICAgIGFwcC5nb0JhY2soKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn1cclxuXHJcblRleHRFZGl0b3JBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG4gICAgXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBvcHRpb25zO1xyXG5cclxuICAgIHRoaXMuZGF0YVZpZXcuaGVhZGVyVGV4dChvcHRpb25zLmhlYWRlcik7XHJcbiAgICB0aGlzLmRhdGFWaWV3LnRleHQob3B0aW9ucy50ZXh0KTtcclxuICAgIGlmIChvcHRpb25zLnJvd3NOdW1iZXIpXHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5yb3dzTnVtYmVyKG9wdGlvbnMucm93c051bWJlcik7XHJcbiAgICAgICAgXHJcbiAgICAvLyBJbm1lZGlhdGUgZm9jdXMgdG8gdGhlIHRleHRhcmVhIGZvciBiZXR0ZXIgdXNhYmlsaXR5XHJcbiAgICB0aGlzLnRleHRhcmVhLmZvY3VzKCk7XHJcbiAgICB0aGlzLiR0ZXh0YXJlYS5jbGljaygpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJ1RleHQnKTtcclxuXHJcbiAgICAvLyBUZXh0IHRvIGVkaXRcclxuICAgIHRoaXMudGV4dCA9IGtvLm9ic2VydmFibGUoJycpO1xyXG4gICAgXHJcbiAgICAvLyBOdW1iZXIgb2Ygcm93cyBmb3IgdGhlIHRleHRhcmVhXHJcbiAgICB0aGlzLnJvd3NOdW1iZXIgPSBrby5vYnNlcnZhYmxlKDIpO1xyXG5cclxuICAgIHRoaXMuY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKCkge1xyXG4gICAgICAgIHRoaXMuZW1pdCgnY2FuY2VsJyk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgICAgIHRoaXMuZW1pdCgnc2F2ZWQnKTtcclxuICAgIH07XHJcbn1cclxuXHJcblZpZXdNb2RlbC5faW5oZXJpdHMoRXZlbnRFbWl0dGVyKTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqIEdsb2JhbCBkZXBlbmRlbmNpZXMgKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS1tb2JpbGUnKTtcclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxua28uYmluZGluZ0hhbmRsZXJzLmZvcm1hdCA9IHJlcXVpcmUoJ2tvL2Zvcm1hdEJpbmRpbmcnKS5mb3JtYXRCaW5kaW5nO1xyXG52YXIgYm9vdGtub2NrID0gcmVxdWlyZSgnLi91dGlscy9ib290a25vY2tCaW5kaW5nSGVscGVycycpO1xyXG5yZXF1aXJlKCcuL3V0aWxzL0Z1bmN0aW9uLnByb3RvdHlwZS5faW5oZXJpdHMnKTtcclxucmVxdWlyZSgnLi91dGlscy9GdW5jdGlvbi5wcm90b3R5cGUuX2RlbGF5ZWQnKTtcclxuLy8gUHJvbWlzZSBwb2x5ZmlsbCwgc28gaXRzIG5vdCAncmVxdWlyZSdkIHBlciBtb2R1bGU6XHJcbnJlcXVpcmUoJ2VzNi1wcm9taXNlJykucG9seWZpbGwoKTtcclxuXHJcbnZhciBsYXlvdXRVcGRhdGVFdmVudCA9IHJlcXVpcmUoJ2xheW91dFVwZGF0ZUV2ZW50Jyk7XHJcbnZhciBTaGVsbCA9IHJlcXVpcmUoJy4vdXRpbHMvU2hlbGwnKSxcclxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4vdmlld21vZGVscy9OYXZBY3Rpb24nKSxcclxuICAgIEFwcE1vZGVsID0gcmVxdWlyZSgnLi92aWV3bW9kZWxzL0FwcE1vZGVsJyk7XHJcblxyXG4vKiogQ3VzdG9tIExvY29ub21pY3MgJ2xvY2FsZScgc3R5bGVzIGZvciBkYXRlL3RpbWVzICoqL1xyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbm1vbWVudC5sb2NhbGUoJ2VuLVVTLUxDJywge1xyXG4gICAgbWVyaWRpZW1QYXJzZSA6IC9bYXBdXFwuP1xcLj8vaSxcclxuICAgIG1lcmlkaWVtIDogZnVuY3Rpb24gKGhvdXJzLCBtaW51dGVzLCBpc0xvd2VyKSB7XHJcbiAgICAgICAgaWYgKGhvdXJzID4gMTEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGlzTG93ZXIgPyAncCcgOiAnUCc7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIGlzTG93ZXIgPyAnYScgOiAnQSc7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGNhbGVuZGFyIDoge1xyXG4gICAgICAgIGxhc3REYXkgOiAnW1llc3RlcmRheV0nLFxyXG4gICAgICAgIHNhbWVEYXkgOiAnW1RvZGF5XScsXHJcbiAgICAgICAgbmV4dERheSA6ICdbVG9tb3Jyb3ddJyxcclxuICAgICAgICBsYXN0V2VlayA6ICdbbGFzdF0gZGRkZCcsXHJcbiAgICAgICAgbmV4dFdlZWsgOiAnZGRkZCcsXHJcbiAgICAgICAgc2FtZUVsc2UgOiAnTS9EJ1xyXG4gICAgfSxcclxuICAgIGxvbmdEYXRlRm9ybWF0IDoge1xyXG4gICAgICAgIExUOiAnaDptbWEnLFxyXG4gICAgICAgIExUUzogJ2g6bW06c3NhJyxcclxuICAgICAgICBMOiAnTU0vREQvWVlZWScsXHJcbiAgICAgICAgbDogJ00vRC9ZWVlZJyxcclxuICAgICAgICBMTDogJ01NTU0gRG8gWVlZWScsXHJcbiAgICAgICAgbGw6ICdNTU0gRCBZWVlZJyxcclxuICAgICAgICBMTEw6ICdNTU1NIERvIFlZWVkgTFQnLFxyXG4gICAgICAgIGxsbDogJ01NTSBEIFlZWVkgTFQnLFxyXG4gICAgICAgIExMTEw6ICdkZGRkLCBNTU1NIERvIFlZWVkgTFQnLFxyXG4gICAgICAgIGxsbGw6ICdkZGQsIE1NTSBEIFlZWVkgTFQnXHJcbiAgICB9XHJcbn0pO1xyXG4vLyBMZWZ0IG5vcm1hbCBlbmdsaXNoIGFzIGRlZmF1bHQ6XHJcbm1vbWVudC5sb2NhbGUoJ2VuLVVTJyk7XHJcblxyXG4vKiogYXBwIHN0YXRpYyBjbGFzcyAqKi9cclxudmFyIGFwcCA9IG5ldyBTaGVsbCgpO1xyXG4vLyBUT0RPIGFwcCBtdXN0IHRvIGJlIGEgcGxhaW4gb2JqZWN0IHdpdGggc2hlbGwgYXMgcHJvcGVydHksIG5vdCBhIHNoZWxsIGluc3RhbmNlXHJcbmFwcC5zaGVsbCA9IGFwcDtcclxuXHJcbi8vIE5ldyBhcHAgbW9kZWwsIHRoYXQgc3RhcnRzIHdpdGggYW5vbnltb3VzIHVzZXJcclxuYXBwLm1vZGVsID0gbmV3IEFwcE1vZGVsKCk7XHJcblxyXG4vLyBTaG9ydGN1dCB0byBVc2VyVHlwZSBlbnVtZXJhdGlvbiB1c2VkIHRvIHNldCBwZXJtaXNzaW9uc1xyXG5hcHAuVXNlclR5cGUgPSBhcHAubW9kZWwudXNlcigpLmNvbnN0cnVjdG9yLlVzZXJUeXBlO1xyXG5cclxuLy8gVXBkYXRpbmcgYXBwIHN0YXR1cyBvbiB1c2VyIGNoYW5nZXNcclxuZnVuY3Rpb24gdXBkYXRlU3RhdGVzT25Vc2VyQ2hhbmdlKCkge1xyXG5cclxuICAgIHZhciB1c2VyID0gYXBwLm1vZGVsLnVzZXIoKTtcclxuXHJcbiAgICBpZiAodXNlci5vbmJvYXJkaW5nU3RlcCgpKSB7XHJcbiAgICAgICAgYXBwLnN0YXR1cygnb25ib2FyZGluZycpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodXNlci5pc0Fub255bW91cygpKSB7XHJcbiAgICAgICAgYXBwLnN0YXR1cygnb3V0Jyk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBhcHAuc3RhdHVzKCdpbicpO1xyXG4gICAgfVxyXG59XHJcbmFwcC5tb2RlbC51c2VyKCkuaXNBbm9ueW1vdXMuc3Vic2NyaWJlKHVwZGF0ZVN0YXRlc09uVXNlckNoYW5nZSk7XHJcbmFwcC5tb2RlbC51c2VyKCkub25ib2FyZGluZ1N0ZXAuc3Vic2NyaWJlKHVwZGF0ZVN0YXRlc09uVXNlckNoYW5nZSk7XHJcblxyXG4vKiogTG9hZCBhY3Rpdml0aWVzICoqL1xyXG5hcHAuYWN0aXZpdGllcyA9IHtcclxuICAgICdjYWxlbmRhcic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jYWxlbmRhcicpLFxyXG4gICAgJ2RhdGV0aW1lUGlja2VyJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2RhdGV0aW1lUGlja2VyJyksXHJcbiAgICAnY2xpZW50cyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jbGllbnRzJyksXHJcbiAgICAnc2VydmljZXMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvc2VydmljZXMnKSxcclxuICAgICdsb2NhdGlvbnMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvbG9jYXRpb25zJyksXHJcbiAgICAndGV4dEVkaXRvcic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy90ZXh0RWRpdG9yJyksXHJcbiAgICAnaG9tZSc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9ob21lJyksXHJcbiAgICAnYXBwb2ludG1lbnQnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvYXBwb2ludG1lbnQnKSxcclxuICAgICdib29raW5nQ29uZmlybWF0aW9uJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2Jvb2tpbmdDb25maXJtYXRpb24nKSxcclxuICAgICdpbmRleCc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9pbmRleCcpLFxyXG4gICAgJ2xvZ2luJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2xvZ2luJyksXHJcbiAgICAnbGVhcm5Nb3JlJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2xlYXJuTW9yZScpLFxyXG4gICAgJ3NpZ251cCc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9zaWdudXAnKSxcclxuICAgICdjb250YWN0SW5mbyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jb250YWN0SW5mbycpLFxyXG4gICAgJ3Bvc2l0aW9ucyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9wb3NpdGlvbnMnKSxcclxuICAgICdvbmJvYXJkaW5nSG9tZSc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9vbmJvYXJkaW5nSG9tZScpLFxyXG4gICAgJ2xvY2F0aW9uRWRpdGlvbic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9sb2NhdGlvbkVkaXRpb24nKSxcclxuICAgICdvbmJvYXJkaW5nQ29tcGxldGUnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvb25ib2FyZGluZ0NvbXBsZXRlJylcclxufTtcclxuXHJcbi8qKiBQYWdlIHJlYWR5ICoqL1xyXG4kKGZ1bmN0aW9uKCkge1xyXG4gICAgXHJcbiAgICAvLyBFbmFibGluZyB0aGUgJ2xheW91dFVwZGF0ZScgalF1ZXJ5IFdpbmRvdyBldmVudCB0aGF0IGhhcHBlbnMgb24gcmVzaXplIGFuZCB0cmFuc2l0aW9uZW5kLFxyXG4gICAgLy8gYW5kIGNhbiBiZSB0cmlnZ2VyZWQgbWFudWFsbHkgYnkgYW55IHNjcmlwdCB0byBub3RpZnkgY2hhbmdlcyBvbiBsYXlvdXQgdGhhdFxyXG4gICAgLy8gbWF5IHJlcXVpcmUgYWRqdXN0bWVudHMgb24gb3RoZXIgc2NyaXB0cyB0aGF0IGxpc3RlbiB0byBpdC5cclxuICAgIC8vIFRoZSBldmVudCBpcyB0aHJvdHRsZSwgZ3VhcmFudGluZyB0aGF0IHRoZSBtaW5vciBoYW5kbGVycyBhcmUgZXhlY3V0ZWQgcmF0aGVyXHJcbiAgICAvLyB0aGFuIGEgbG90IG9mIHRoZW0gaW4gc2hvcnQgdGltZSBmcmFtZXMgKGFzIGhhcHBlbiB3aXRoICdyZXNpemUnIGV2ZW50cykuXHJcbiAgICBsYXlvdXRVcGRhdGVFdmVudC5vbigpO1xyXG4gICAgXHJcbiAgICAvLyBOT1RFOiBTYWZhcmkgaU9TIGJ1ZyB3b3JrYXJvdW5kLCBtaW4taGVpZ2h0L2hlaWdodCBvbiBodG1sIGRvZXNuJ3Qgd29yayBhcyBleHBlY3RlZCxcclxuICAgIC8vIGdldHRpbmcgYmlnZ2VyIHRoYW4gdmlld3BvcnQuIE1heSBiZSBhIHByb2JsZW0gb25seSBvbiBTYWZhcmkgYW5kIG5vdCBpbiBcclxuICAgIC8vIHRoZSBXZWJWaWV3LCBkb3VibGUgY2hlY2suXHJcbiAgICB2YXIgaU9TID0gLyhpUGFkfGlQaG9uZXxpUG9kKS9nLnRlc3QoIG5hdmlnYXRvci51c2VyQWdlbnQgKTtcclxuICAgIGlmIChpT1MpIHtcclxuICAgICAgICAkKCdodG1sJykuaGVpZ2h0KHdpbmRvdy5pbm5lckhlaWdodCArICdweCcpO1xyXG4gICAgICAgICQod2luZG93KS5vbignbGF5b3V0VXBkYXRlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICQoJ2h0bWwnKS5oZWlnaHQod2luZG93LmlubmVySGVpZ2h0ICsgJ3B4Jyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEFjY291bnQgbG9nLW91dDogdGhpcyBkb2Vzbid0IG5lZWQgYW4gYWN0aXZpdHksIHNvXHJcbiAgICAvLyB3ZSBhZGQgbWFudWFsbHkgYSByb3V0ZSBmb3IgdGhhdFxyXG4gICAgYXBwLnNoZWxsLnNwZWNpYWxSb3V0ZXMubG9nb3V0ID0gZnVuY3Rpb24ocm91dGUpIHtcclxuICAgICAgICBcclxuICAgICAgICBhcHAubW9kZWwubG9nb3V0KCkudGhlbihmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgLy8gQW5vbnltb3VzIHVzZXIgYWdhaW5cclxuICAgICAgICAgICAgYXBwLm1vZGVsLnVzZXIoKS5tb2RlbC51cGRhdGVXaXRoKFxyXG4gICAgICAgICAgICAgICAgYXBwLm1vZGVsLnVzZXIoKS5jb25zdHJ1Y3Rvci5uZXdBbm9ueW1vdXMoKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gR28gaW5kZXhcclxuICAgICAgICAgICAgYXBwLnNoZWxsLmdvKCcjIScpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLy8gTmV3IGFwcCBtZXRob2Q6IGdvRGFzaGJvYXJkLCBqdXN0IHJlZGlyZWN0IHRoZSBiZXR0ZXJcclxuICAgIC8vIHBsYWNlIGZvciBjdXJyZW50IHVzZXIgYW5kIHN0YXRlXHJcbiAgICBhcHAuZ29EYXNoYm9hcmQgPSBmdW5jdGlvbiBnb0Rhc2hib2FyZCgpIHtcclxuICAgICAgICB2YXIgb25ib2FyZGluZyA9IHRoaXMubW9kZWwudXNlcigpLm9uYm9hcmRpbmdTdGVwKCk7XHJcbiAgICAgICAgaWYgKG9uYm9hcmRpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5zaGVsbC5nbygnb25ib2FyZGluZ0hvbWUvJyArIG9uYm9hcmRpbmcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5zaGVsbC5nbygnaG9tZScpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBcclxuICAgIC8vIFNldC11cCBhY2Nlc3MgY29udHJvbCBmb3IgdGhlIHNoZWxsXHJcbiAgICBhcHAuc2hlbGwuYWNjZXNzQ29udHJvbCA9IHJlcXVpcmUoJy4vdXRpbHMvYWNjZXNzQ29udHJvbCcpKGFwcCk7XHJcbiAgICBcclxuICAgIC8vIExvYWQgS25vY2tvdXQgYmluZGluZyBoZWxwZXJzXHJcbiAgICBib290a25vY2sucGx1Z0luKGtvKTtcclxuXHJcbiAgICAvLyBBcHAgc2V0LXVwXHJcbiAgICBhcHAuc2hlbGwuYmFzZVVybCA9ICdhY3Rpdml0aWVzLyc7XHJcbiAgICBhcHAuc2hlbGwuZGVmYXVsdE5hdkFjdGlvbiA9IE5hdkFjdGlvbi5nb0hvbWU7XHJcbiAgICBhcHAubW9kZWwuaW5pdCgpLnRoZW4oXHJcbiAgICAgICAgYXBwLnNoZWxsLmluaXQuYmluZChhcHAuc2hlbGwpXHJcbiAgICApLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgLy8gTWFyayB0aGUgcGFnZSBhcyByZWFkeVxyXG4gICAgICAgICQoJ2h0bWwnKS5hZGRDbGFzcygnaXMtcmVhZHknKTtcclxuICAgICAgICBcclxuICAgICAgICBhcHAuZ29EYXNoYm9hcmQoKTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBERUJVR1xyXG4gICAgd2luZG93LmFwcCA9IGFwcDtcclxufSk7XHJcbiIsIi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gKiBEYXRlUGlja2VyIEpTIENvbXBvbmVudCwgd2l0aCBzZXZlcmFsXHJcbiAqIG1vZGVzIGFuZCBvcHRpb25hbCBpbmxpbmUtcGVybWFuZW50IHZpc3VhbGl6YXRpb24uXHJcbiAqXHJcbiAqIENvcHlyaWdodCAyMDE0IExvY29ub21pY3MgQ29vcC5cclxuICpcclxuICogQmFzZWQgb246XHJcbiAqIGJvb3RzdHJhcC1kYXRlcGlja2VyLmpzIFxyXG4gKiBodHRwOi8vd3d3LmV5ZWNvbi5yby9ib290c3RyYXAtZGF0ZXBpY2tlclxyXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICogQ29weXJpZ2h0IDIwMTIgU3RlZmFuIFBldHJlXHJcbiAqXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XHJcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cclxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XHJcbiAqXHJcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxyXG4gKlxyXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXHJcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcclxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXHJcbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcclxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXHJcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTsgXHJcblxyXG52YXIgY2xhc3NlcyA9IHtcclxuICAgIGNvbXBvbmVudDogJ0RhdGVQaWNrZXInLFxyXG4gICAgbW9udGhzOiAnRGF0ZVBpY2tlci1tb250aHMnLFxyXG4gICAgZGF5czogJ0RhdGVQaWNrZXItZGF5cycsXHJcbiAgICBtb250aERheTogJ2RheScsXHJcbiAgICBtb250aDogJ21vbnRoJyxcclxuICAgIHllYXI6ICd5ZWFyJyxcclxuICAgIHllYXJzOiAnRGF0ZVBpY2tlci15ZWFycydcclxufTtcclxuXHJcbi8vIFBpY2tlciBvYmplY3RcclxudmFyIERhdGVQaWNrZXIgPSBmdW5jdGlvbihlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAvKmpzaGludCBtYXhzdGF0ZW1lbnRzOjMyLG1heGNvbXBsZXhpdHk6MjQqL1xyXG4gICAgdGhpcy5lbGVtZW50ID0gJChlbGVtZW50KTtcclxuICAgIHRoaXMuZm9ybWF0ID0gRFBHbG9iYWwucGFyc2VGb3JtYXQob3B0aW9ucy5mb3JtYXR8fHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLWZvcm1hdCcpfHwnbW0vZGQveXl5eScpO1xyXG4gICAgXHJcbiAgICB0aGlzLmlzSW5wdXQgPSB0aGlzLmVsZW1lbnQuaXMoJ2lucHV0Jyk7XHJcbiAgICB0aGlzLmNvbXBvbmVudCA9IHRoaXMuZWxlbWVudC5pcygnLmRhdGUnKSA/IHRoaXMuZWxlbWVudC5maW5kKCcuYWRkLW9uJykgOiBmYWxzZTtcclxuICAgIHRoaXMuaXNQbGFjZWhvbGRlciA9IHRoaXMuZWxlbWVudC5pcygnLmNhbGVuZGFyLXBsYWNlaG9sZGVyJyk7XHJcbiAgICBcclxuICAgIHRoaXMucGlja2VyID0gJChEUEdsb2JhbC50ZW1wbGF0ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZFRvKHRoaXMuaXNQbGFjZWhvbGRlciA/IHRoaXMuZWxlbWVudCA6ICdib2R5JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLm9uKCdjbGljayB0YXAnLCAkLnByb3h5KHRoaXMuY2xpY2ssIHRoaXMpKTtcclxuICAgIC8vIFRPRE86IHRvIHJldmlldyBpZiAnY29udGFpbmVyJyBjbGFzcyBjYW4gYmUgYXZvaWRlZCwgc28gaW4gcGxhY2Vob2xkZXIgbW9kZSBnZXRzIG9wdGlvbmFsXHJcbiAgICAvLyBpZiBpcyB3YW50ZWQgY2FuIGJlIHBsYWNlZCBvbiB0aGUgcGxhY2Vob2xkZXIgZWxlbWVudCAob3IgY29udGFpbmVyLWZsdWlkIG9yIG5vdGhpbmcpXHJcbiAgICB0aGlzLnBpY2tlci5hZGRDbGFzcyh0aGlzLmlzUGxhY2Vob2xkZXIgPyAnY29udGFpbmVyJyA6ICdkcm9wZG93bi1tZW51Jyk7XHJcbiAgICBcclxuICAgIGlmICh0aGlzLmlzUGxhY2Vob2xkZXIpIHtcclxuICAgICAgICB0aGlzLnBpY2tlci5zaG93KCk7XHJcbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlJykgPT0gJ3RvZGF5Jykge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdzaG93JyxcclxuICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0aGlzLmlzSW5wdXQpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnQub24oe1xyXG4gICAgICAgICAgICBmb2N1czogJC5wcm94eSh0aGlzLnNob3csIHRoaXMpLFxyXG4gICAgICAgICAgICAvL2JsdXI6ICQucHJveHkodGhpcy5oaWRlLCB0aGlzKSxcclxuICAgICAgICAgICAga2V5dXA6ICQucHJveHkodGhpcy51cGRhdGUsIHRoaXMpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmICh0aGlzLmNvbXBvbmVudCl7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcG9uZW50Lm9uKCdjbGljayB0YXAnLCAkLnByb3h5KHRoaXMuc2hvdywgdGhpcykpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5vbignY2xpY2sgdGFwJywgJC5wcm94eSh0aGlzLnNob3csIHRoaXMpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qIFRvdWNoIGV2ZW50cyB0byBzd2lwZSBkYXRlcyAqL1xyXG4gICAgdGhpcy5lbGVtZW50XHJcbiAgICAub24oJ3N3aXBlbGVmdCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdGhpcy5tb3ZlRGF0ZSgnbmV4dCcpO1xyXG4gICAgfS5iaW5kKHRoaXMpKVxyXG4gICAgLm9uKCdzd2lwZXJpZ2h0JywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB0aGlzLm1vdmVEYXRlKCdwcmV2Jyk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIC8qIFNldC11cCB2aWV3IG1vZGUgKi9cclxuICAgIHRoaXMubWluVmlld01vZGUgPSBvcHRpb25zLm1pblZpZXdNb2RlfHx0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS1taW52aWV3bW9kZScpfHwwO1xyXG4gICAgaWYgKHR5cGVvZiB0aGlzLm1pblZpZXdNb2RlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgIHN3aXRjaCAodGhpcy5taW5WaWV3TW9kZSkge1xyXG4gICAgICAgICAgICBjYXNlICdtb250aHMnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5WaWV3TW9kZSA9IDE7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAneWVhcnMnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5WaWV3TW9kZSA9IDI7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHRoaXMubWluVmlld01vZGUgPSAwO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy52aWV3TW9kZSA9IG9wdGlvbnMudmlld01vZGV8fHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLXZpZXdtb2RlJyl8fDA7XHJcbiAgICBpZiAodHlwZW9mIHRoaXMudmlld01vZGUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgc3dpdGNoICh0aGlzLnZpZXdNb2RlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ21vbnRocyc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlID0gMTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICd5ZWFycyc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlID0gMjtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZSA9IDA7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnN0YXJ0Vmlld01vZGUgPSB0aGlzLnZpZXdNb2RlO1xyXG4gICAgdGhpcy53ZWVrU3RhcnQgPSBvcHRpb25zLndlZWtTdGFydHx8dGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtd2Vla3N0YXJ0Jyl8fDA7XHJcbiAgICB0aGlzLndlZWtFbmQgPSB0aGlzLndlZWtTdGFydCA9PT0gMCA/IDYgOiB0aGlzLndlZWtTdGFydCAtIDE7XHJcbiAgICB0aGlzLm9uUmVuZGVyID0gb3B0aW9ucy5vblJlbmRlcjtcclxuICAgIHRoaXMuZmlsbERvdygpO1xyXG4gICAgdGhpcy5maWxsTW9udGhzKCk7XHJcbiAgICB0aGlzLnVwZGF0ZSgpO1xyXG4gICAgdGhpcy5zaG93TW9kZSgpO1xyXG59O1xyXG5cclxuRGF0ZVBpY2tlci5wcm90b3R5cGUgPSB7XHJcbiAgICBjb25zdHJ1Y3RvcjogRGF0ZVBpY2tlcixcclxuICAgIFxyXG4gICAgc2hvdzogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHRoaXMucGlja2VyLnNob3coKTtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMuY29tcG9uZW50ID8gdGhpcy5jb21wb25lbnQub3V0ZXJIZWlnaHQoKSA6IHRoaXMuZWxlbWVudC5vdXRlckhlaWdodCgpO1xyXG4gICAgICAgIHRoaXMucGxhY2UoKTtcclxuICAgICAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsICQucHJveHkodGhpcy5wbGFjZSwgdGhpcykpO1xyXG4gICAgICAgIGlmIChlICkge1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpcy5pc0lucHV0KSB7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICAkKGRvY3VtZW50KS5vbignbW91c2Vkb3duJywgZnVuY3Rpb24oZXYpe1xyXG4gICAgICAgICAgICBpZiAoJChldi50YXJnZXQpLmNsb3Nlc3QoJy4nICsgY2xhc3Nlcy5jb21wb25lbnQpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5oaWRlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdzaG93JyxcclxuICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBoaWRlOiBmdW5jdGlvbigpe1xyXG4gICAgICAgIHRoaXMucGlja2VyLmhpZGUoKTtcclxuICAgICAgICAkKHdpbmRvdykub2ZmKCdyZXNpemUnLCB0aGlzLnBsYWNlKTtcclxuICAgICAgICB0aGlzLnZpZXdNb2RlID0gdGhpcy5zdGFydFZpZXdNb2RlO1xyXG4gICAgICAgIHRoaXMuc2hvd01vZGUoKTtcclxuICAgICAgICBpZiAoIXRoaXMuaXNJbnB1dCkge1xyXG4gICAgICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ21vdXNlZG93bicsIHRoaXMuaGlkZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vdGhpcy5zZXQoKTtcclxuICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdoaWRlJyxcclxuICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBmb3JtYXRlZCA9IERQR2xvYmFsLmZvcm1hdERhdGUodGhpcy5kYXRlLCB0aGlzLmZvcm1hdCk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzSW5wdXQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY29tcG9uZW50KXtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5maW5kKCdpbnB1dCcpLnByb3AoJ3ZhbHVlJywgZm9ybWF0ZWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlJywgZm9ybWF0ZWQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wcm9wKCd2YWx1ZScsIGZvcm1hdGVkKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBTZXRzIGEgZGF0ZSBhcyB2YWx1ZSBhbmQgbm90aWZ5IHdpdGggYW4gZXZlbnQuXHJcbiAgICAgICAgUGFyYW1ldGVyIGRvbnROb3RpZnkgaXMgb25seSBmb3IgY2FzZXMgd2hlcmUgdGhlIGNhbGVuZGFyIG9yXHJcbiAgICAgICAgc29tZSByZWxhdGVkIGNvbXBvbmVudCBnZXRzIGFscmVhZHkgdXBkYXRlZCBidXQgdGhlIGhpZ2hsaWdodGVkXHJcbiAgICAgICAgZGF0ZSBuZWVkcyB0byBiZSB1cGRhdGVkIHdpdGhvdXQgY3JlYXRlIGluZmluaXRlIHJlY3Vyc2lvbiBcclxuICAgICAgICBiZWNhdXNlIG9mIG5vdGlmaWNhdGlvbi4gSW4gb3RoZXIgY2FzZSwgZG9udCB1c2UuXHJcbiAgICAqKi9cclxuICAgIHNldFZhbHVlOiBmdW5jdGlvbihuZXdEYXRlLCBkb250Tm90aWZ5KSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBuZXdEYXRlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGUgPSBEUEdsb2JhbC5wYXJzZURhdGUobmV3RGF0ZSwgdGhpcy5mb3JtYXQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSA9IG5ldyBEYXRlKG5ld0RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgICAgIHRoaXMudmlld0RhdGUgPSBuZXcgRGF0ZSh0aGlzLmRhdGUuZ2V0RnVsbFllYXIoKSwgdGhpcy5kYXRlLmdldE1vbnRoKCksIDEsIDAsIDAsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChkb250Tm90aWZ5ICE9PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIC8vIE5vdGlmeTpcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICAgICAgdmlld01vZGU6IERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZ2V0VmFsdWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGU7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBtb3ZlVmFsdWU6IGZ1bmN0aW9uKGRpciwgbW9kZSkge1xyXG4gICAgICAgIC8vIGRpciBjYW4gYmU6ICdwcmV2JywgJ25leHQnXHJcbiAgICAgICAgaWYgKFsncHJldicsICduZXh0J10uaW5kZXhPZihkaXIgJiYgZGlyLnRvTG93ZXJDYXNlKCkpID09IC0xKVxyXG4gICAgICAgICAgICAvLyBObyB2YWxpZCBvcHRpb246XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gZGVmYXVsdCBtb2RlIGlzIHRoZSBjdXJyZW50IG9uZVxyXG4gICAgICAgIG1vZGUgPSBtb2RlID9cclxuICAgICAgICAgICAgRFBHbG9iYWwubW9kZXNTZXRbbW9kZV0gOlxyXG4gICAgICAgICAgICBEUEdsb2JhbC5tb2Rlc1t0aGlzLnZpZXdNb2RlXTtcclxuXHJcbiAgICAgICAgdGhpcy5kYXRlWydzZXQnICsgbW9kZS5uYXZGbmNdLmNhbGwoXHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSxcclxuICAgICAgICAgICAgdGhpcy5kYXRlWydnZXQnICsgbW9kZS5uYXZGbmNdLmNhbGwodGhpcy5kYXRlKSArIFxyXG4gICAgICAgICAgICBtb2RlLm5hdlN0ZXAgKiAoZGlyID09PSAncHJldicgPyAtMSA6IDEpXHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLnNldFZhbHVlKHRoaXMuZGF0ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0ZTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIHBsYWNlOiBmdW5jdGlvbigpe1xyXG4gICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLmNvbXBvbmVudCA/IHRoaXMuY29tcG9uZW50Lm9mZnNldCgpIDogdGhpcy5lbGVtZW50Lm9mZnNldCgpO1xyXG4gICAgICAgIHRoaXMucGlja2VyLmNzcyh7XHJcbiAgICAgICAgICAgIHRvcDogb2Zmc2V0LnRvcCArIHRoaXMuaGVpZ2h0LFxyXG4gICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbihuZXdEYXRlKXtcclxuICAgICAgICB0aGlzLmRhdGUgPSBEUEdsb2JhbC5wYXJzZURhdGUoXHJcbiAgICAgICAgICAgIHR5cGVvZiBuZXdEYXRlID09PSAnc3RyaW5nJyA/IG5ld0RhdGUgOiAodGhpcy5pc0lucHV0ID8gdGhpcy5lbGVtZW50LnByb3AoJ3ZhbHVlJykgOiB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZScpKSxcclxuICAgICAgICAgICAgdGhpcy5mb3JtYXRcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMudmlld0RhdGUgPSBuZXcgRGF0ZSh0aGlzLmRhdGUuZ2V0RnVsbFllYXIoKSwgdGhpcy5kYXRlLmdldE1vbnRoKCksIDEsIDAsIDAsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZmlsbERvdzogZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgZG93Q250ID0gdGhpcy53ZWVrU3RhcnQ7XHJcbiAgICAgICAgdmFyIGh0bWwgPSAnPHRyPic7XHJcbiAgICAgICAgd2hpbGUgKGRvd0NudCA8IHRoaXMud2Vla1N0YXJ0ICsgNykge1xyXG4gICAgICAgICAgICBodG1sICs9ICc8dGggY2xhc3M9XCJkb3dcIj4nK0RQR2xvYmFsLmRhdGVzLmRheXNNaW5bKGRvd0NudCsrKSU3XSsnPC90aD4nO1xyXG4gICAgICAgIH1cclxuICAgICAgICBodG1sICs9ICc8L3RyPic7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLmRheXMgKyAnIHRoZWFkJykuYXBwZW5kKGh0bWwpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZmlsbE1vbnRoczogZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgaHRtbCA9ICcnO1xyXG4gICAgICAgIHZhciBpID0gMDtcclxuICAgICAgICB3aGlsZSAoaSA8IDEyKSB7XHJcbiAgICAgICAgICAgIGh0bWwgKz0gJzxzcGFuIGNsYXNzPVwiJyArIGNsYXNzZXMubW9udGggKyAnXCI+JytEUEdsb2JhbC5kYXRlcy5tb250aHNTaG9ydFtpKytdKyc8L3NwYW4+JztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLm1vbnRocyArICcgdGQnKS5hcHBlbmQoaHRtbCk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBmaWxsOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAvKmpzaGludCBtYXhzdGF0ZW1lbnRzOjY2LCBtYXhjb21wbGV4aXR5OjI4Ki9cclxuICAgICAgICB2YXIgZCA9IG5ldyBEYXRlKHRoaXMudmlld0RhdGUpLFxyXG4gICAgICAgICAgICB5ZWFyID0gZC5nZXRGdWxsWWVhcigpLFxyXG4gICAgICAgICAgICBtb250aCA9IGQuZ2V0TW9udGgoKSxcclxuICAgICAgICAgICAgY3VycmVudERhdGUgPSB0aGlzLmRhdGUudmFsdWVPZigpO1xyXG4gICAgICAgIHRoaXMucGlja2VyXHJcbiAgICAgICAgLmZpbmQoJy4nICsgY2xhc3Nlcy5kYXlzICsgJyB0aDplcSgxKScpXHJcbiAgICAgICAgLmh0bWwoRFBHbG9iYWwuZGF0ZXMubW9udGhzW21vbnRoXSArICcgJyArIHllYXIpO1xyXG4gICAgICAgIHZhciBwcmV2TW9udGggPSBuZXcgRGF0ZSh5ZWFyLCBtb250aC0xLCAyOCwwLDAsMCwwKSxcclxuICAgICAgICAgICAgZGF5ID0gRFBHbG9iYWwuZ2V0RGF5c0luTW9udGgocHJldk1vbnRoLmdldEZ1bGxZZWFyKCksIHByZXZNb250aC5nZXRNb250aCgpKTtcclxuICAgICAgICBwcmV2TW9udGguc2V0RGF0ZShkYXkpO1xyXG4gICAgICAgIHByZXZNb250aC5zZXREYXRlKGRheSAtIChwcmV2TW9udGguZ2V0RGF5KCkgLSB0aGlzLndlZWtTdGFydCArIDcpJTcpO1xyXG4gICAgICAgIHZhciBuZXh0TW9udGggPSBuZXcgRGF0ZShwcmV2TW9udGgpO1xyXG4gICAgICAgIG5leHRNb250aC5zZXREYXRlKG5leHRNb250aC5nZXREYXRlKCkgKyA0Mik7XHJcbiAgICAgICAgbmV4dE1vbnRoID0gbmV4dE1vbnRoLnZhbHVlT2YoKTtcclxuICAgICAgICB2YXIgaHRtbCA9IFtdO1xyXG4gICAgICAgIHZhciBjbHNOYW1lLFxyXG4gICAgICAgICAgICBwcmV2WSxcclxuICAgICAgICAgICAgcHJldk07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIGlmICh0aGlzLl9kYXlzQ3JlYXRlZCAhPT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAvLyBDcmVhdGUgaHRtbCAoZmlyc3QgdGltZSBvbmx5KVxyXG4gICAgICAgXHJcbiAgICAgICAgICAgIHdoaWxlKHByZXZNb250aC52YWx1ZU9mKCkgPCBuZXh0TW9udGgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGguZ2V0RGF5KCkgPT09IHRoaXMud2Vla1N0YXJ0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8dHI+Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjbHNOYW1lID0gdGhpcy5vblJlbmRlcihwcmV2TW9udGgpO1xyXG4gICAgICAgICAgICAgICAgcHJldlkgPSBwcmV2TW9udGguZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICAgICAgICAgIHByZXZNID0gcHJldk1vbnRoLmdldE1vbnRoKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoKHByZXZNIDwgbW9udGggJiYgIHByZXZZID09PSB5ZWFyKSB8fCAgcHJldlkgPCB5ZWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIG9sZCc7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKChwcmV2TSA+IG1vbnRoICYmIHByZXZZID09PSB5ZWFyKSB8fCBwcmV2WSA+IHllYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgbmV3JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGgudmFsdWVPZigpID09PSBjdXJyZW50RGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBhY3RpdmUnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8dGQgY2xhc3M9XCInICsgY2xhc3Nlcy5tb250aERheSArICcgJyArIGNsc05hbWUrJ1wiPicrcHJldk1vbnRoLmdldERhdGUoKSArICc8L3RkPicpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZNb250aC5nZXREYXkoKSA9PT0gdGhpcy53ZWVrRW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8L3RyPicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcHJldk1vbnRoLnNldERhdGUocHJldk1vbnRoLmdldERhdGUoKSsxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLmRheXMgKyAnIHRib2R5JykuZW1wdHkoKS5hcHBlbmQoaHRtbC5qb2luKCcnKSk7XHJcbiAgICAgICAgICAgIHRoaXMuX2RheXNDcmVhdGVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFVwZGF0ZSBkYXlzIHZhbHVlc1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHdlZWtUciA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy5kYXlzICsgJyB0Ym9keSB0cjpmaXJzdC1jaGlsZCgpJyk7XHJcbiAgICAgICAgICAgIHZhciBkYXlUZCA9IG51bGw7XHJcbiAgICAgICAgICAgIHdoaWxlKHByZXZNb250aC52YWx1ZU9mKCkgPCBuZXh0TW9udGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50V2Vla0RheUluZGV4ID0gcHJldk1vbnRoLmdldERheSgpIC0gdGhpcy53ZWVrU3RhcnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgY2xzTmFtZSA9IHRoaXMub25SZW5kZXIocHJldk1vbnRoKTtcclxuICAgICAgICAgICAgICAgIHByZXZZID0gcHJldk1vbnRoLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgICAgICAgICBwcmV2TSA9IHByZXZNb250aC5nZXRNb250aCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKChwcmV2TSA8IG1vbnRoICYmICBwcmV2WSA9PT0geWVhcikgfHwgIHByZXZZIDwgeWVhcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBvbGQnO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgocHJldk0gPiBtb250aCAmJiBwcmV2WSA9PT0geWVhcikgfHwgcHJldlkgPiB5ZWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIG5ldyc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAocHJldk1vbnRoLnZhbHVlT2YoKSA9PT0gY3VycmVudERhdGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgYWN0aXZlJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vaHRtbC5wdXNoKCc8dGQgY2xhc3M9XCJkYXkgJytjbHNOYW1lKydcIj4nK3ByZXZNb250aC5nZXREYXRlKCkgKyAnPC90ZD4nKTtcclxuICAgICAgICAgICAgICAgIGRheVRkID0gd2Vla1RyLmZpbmQoJ3RkOmVxKCcgKyBjdXJyZW50V2Vla0RheUluZGV4ICsgJyknKTtcclxuICAgICAgICAgICAgICAgIGRheVRkXHJcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnZGF5ICcgKyBjbHNOYW1lKVxyXG4gICAgICAgICAgICAgICAgLnRleHQocHJldk1vbnRoLmdldERhdGUoKSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIE5leHQgd2Vlaz9cclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGguZ2V0RGF5KCkgPT09IHRoaXMud2Vla0VuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdlZWtUciA9IHdlZWtUci5uZXh0KCd0cicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcHJldk1vbnRoLnNldERhdGUocHJldk1vbnRoLmdldERhdGUoKSsxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGN1cnJlbnRZZWFyID0gdGhpcy5kYXRlLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIG1vbnRocyA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy5tb250aHMpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ3RoOmVxKDEpJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmh0bWwoeWVhcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmVuZCgpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ3NwYW4nKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgaWYgKGN1cnJlbnRZZWFyID09PSB5ZWFyKSB7XHJcbiAgICAgICAgICAgIG1vbnRocy5lcSh0aGlzLmRhdGUuZ2V0TW9udGgoKSkuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBodG1sID0gJyc7XHJcbiAgICAgICAgeWVhciA9IHBhcnNlSW50KHllYXIvMTAsIDEwKSAqIDEwO1xyXG4gICAgICAgIHZhciB5ZWFyQ29udCA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy55ZWFycylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKCd0aDplcSgxKScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRleHQoeWVhciArICctJyArICh5ZWFyICsgOSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmVuZCgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgndGQnKTtcclxuICAgICAgICBcclxuICAgICAgICB5ZWFyIC09IDE7XHJcbiAgICAgICAgdmFyIGk7XHJcbiAgICAgICAgaWYgKHRoaXMuX3llYXJzQ3JlYXRlZCAhPT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgZm9yIChpID0gLTE7IGkgPCAxMTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8c3BhbiBjbGFzcz1cIicgKyBjbGFzc2VzLnllYXIgKyAoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykrKGN1cnJlbnRZZWFyID09PSB5ZWFyID8gJyBhY3RpdmUnIDogJycpKydcIj4nK3llYXIrJzwvc3Bhbj4nO1xyXG4gICAgICAgICAgICAgICAgeWVhciArPSAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB5ZWFyQ29udC5odG1sKGh0bWwpO1xyXG4gICAgICAgICAgICB0aGlzLl95ZWFyc0NyZWF0ZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciB5ZWFyU3BhbiA9IHllYXJDb250LmZpbmQoJ3NwYW46Zmlyc3QtY2hpbGQoKScpO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAtMTsgaSA8IDExOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIC8vaHRtbCArPSAnPHNwYW4gY2xhc3M9XCJ5ZWFyJysoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykrKGN1cnJlbnRZZWFyID09PSB5ZWFyID8gJyBhY3RpdmUnIDogJycpKydcIj4nK3llYXIrJzwvc3Bhbj4nO1xyXG4gICAgICAgICAgICAgICAgeWVhclNwYW5cclxuICAgICAgICAgICAgICAgIC50ZXh0KHllYXIpXHJcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAneWVhcicgKyAoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykgKyAoY3VycmVudFllYXIgPT09IHllYXIgPyAnIGFjdGl2ZScgOiAnJykpO1xyXG4gICAgICAgICAgICAgICAgeWVhciArPSAxO1xyXG4gICAgICAgICAgICAgICAgeWVhclNwYW4gPSB5ZWFyU3Bhbi5uZXh0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBtb3ZlRGF0ZTogZnVuY3Rpb24oZGlyLCBtb2RlKSB7XHJcbiAgICAgICAgLy8gZGlyIGNhbiBiZTogJ3ByZXYnLCAnbmV4dCdcclxuICAgICAgICBpZiAoWydwcmV2JywgJ25leHQnXS5pbmRleE9mKGRpciAmJiBkaXIudG9Mb3dlckNhc2UoKSkgPT0gLTEpXHJcbiAgICAgICAgICAgIC8vIE5vIHZhbGlkIG9wdGlvbjpcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAvLyBkZWZhdWx0IG1vZGUgaXMgdGhlIGN1cnJlbnQgb25lXHJcbiAgICAgICAgbW9kZSA9IG1vZGUgfHwgdGhpcy52aWV3TW9kZTtcclxuXHJcbiAgICAgICAgdGhpcy52aWV3RGF0ZVsnc2V0JytEUEdsb2JhbC5tb2Rlc1ttb2RlXS5uYXZGbmNdLmNhbGwoXHJcbiAgICAgICAgICAgIHRoaXMudmlld0RhdGUsXHJcbiAgICAgICAgICAgIHRoaXMudmlld0RhdGVbJ2dldCcrRFBHbG9iYWwubW9kZXNbbW9kZV0ubmF2Rm5jXS5jYWxsKHRoaXMudmlld0RhdGUpICsgXHJcbiAgICAgICAgICAgIERQR2xvYmFsLm1vZGVzW21vZGVdLm5hdlN0ZXAgKiAoZGlyID09PSAncHJldicgPyAtMSA6IDEpXHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLmZpbGwoKTtcclxuICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGljazogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIC8qanNoaW50IG1heGNvbXBsZXhpdHk6MTYqL1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHZhciB0YXJnZXQgPSAkKGUudGFyZ2V0KS5jbG9zZXN0KCdzcGFuLCB0ZCwgdGgnKTtcclxuICAgICAgICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICB2YXIgbW9udGgsIHllYXI7XHJcbiAgICAgICAgICAgIHN3aXRjaCh0YXJnZXRbMF0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAndGgnOlxyXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCh0YXJnZXRbMF0uY2xhc3NOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N3aXRjaCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dNb2RlKDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3ByZXYnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICduZXh0JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZURhdGUodGFyZ2V0WzBdLmNsYXNzTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdzcGFuJzpcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmlzKCcuJyArIGNsYXNzZXMubW9udGgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vbnRoID0gdGFyZ2V0LnBhcmVudCgpLmZpbmQoJ3NwYW4nKS5pbmRleCh0YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlLnNldE1vbnRoKG1vbnRoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ZWFyID0gcGFyc2VJbnQodGFyZ2V0LnRleHQoKSwgMTApfHwwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlLnNldEZ1bGxZZWFyKHllYXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy52aWV3TW9kZSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSh0aGlzLnZpZXdEYXRlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld01vZGU6IERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd01vZGUoLTEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd0ZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldC5pcygnLmRheScpICYmICF0YXJnZXQuaXMoJy5kaXNhYmxlZCcpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRheSA9IHBhcnNlSW50KHRhcmdldC50ZXh0KCksIDEwKXx8MTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggPSB0aGlzLnZpZXdEYXRlLmdldE1vbnRoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuaXMoJy5vbGQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggLT0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YXJnZXQuaXMoJy5uZXcnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggKz0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ZWFyID0gdGhpcy52aWV3RGF0ZS5nZXRGdWxsWWVhcigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgZGF5LDAsMCwwLDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGgsIE1hdGgubWluKDI4LCBkYXkpLDAsMCwwLDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld01vZGU6IERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgbW91c2Vkb3duOiBmdW5jdGlvbihlKXtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIHNob3dNb2RlOiBmdW5jdGlvbihkaXIpIHtcclxuICAgICAgICBpZiAoZGlyKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlld01vZGUgPSBNYXRoLm1heCh0aGlzLm1pblZpZXdNb2RlLCBNYXRoLm1pbigyLCB0aGlzLnZpZXdNb2RlICsgZGlyKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucGlja2VyLmZpbmQoJz5kaXYnKS5oaWRlKCkuZmlsdGVyKCcuJyArIGNsYXNzZXMuY29tcG9uZW50ICsgJy0nICsgRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZSkuc2hvdygpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuJC5mbi5kYXRlcGlja2VyID0gZnVuY3Rpb24gKCBvcHRpb24gKSB7XHJcbiAgICB2YXIgdmFscyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XHJcbiAgICB2YXIgcmV0dXJuZWQ7XHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXHJcbiAgICAgICAgICAgIGRhdGEgPSAkdGhpcy5kYXRhKCdkYXRlcGlja2VyJyksXHJcbiAgICAgICAgICAgIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09PSAnb2JqZWN0JyAmJiBvcHRpb247XHJcbiAgICAgICAgaWYgKCFkYXRhKSB7XHJcbiAgICAgICAgICAgICR0aGlzLmRhdGEoJ2RhdGVwaWNrZXInLCAoZGF0YSA9IG5ldyBEYXRlUGlja2VyKHRoaXMsICQuZXh0ZW5kKHt9LCAkLmZuLmRhdGVwaWNrZXIuZGVmYXVsdHMsb3B0aW9ucykpKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgcmV0dXJuZWQgPSBkYXRhW29wdGlvbl0uYXBwbHkoZGF0YSwgdmFscyk7XHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgdmFsdWUgcmV0dXJuZWQgYnkgdGhlIG1ldGhvZD9cclxuICAgICAgICAgICAgaWYgKHR5cGVvZihyZXR1cm5lZCAhPT0gJ3VuZGVmaW5lZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBHbyBvdXQgdGhlIGxvb3AgdG8gcmV0dXJuIHRoZSB2YWx1ZSBmcm9tIHRoZSBmaXJzdFxyXG4gICAgICAgICAgICAgICAgLy8gZWxlbWVudC1tZXRob2QgZXhlY3V0aW9uXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gRm9sbG93IG5leHQgbG9vcCBpdGVtXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBpZiAodHlwZW9mKHJldHVybmVkKSAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgcmV0dXJuIHJldHVybmVkO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIC8vIGNoYWluaW5nOlxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuJC5mbi5kYXRlcGlja2VyLmRlZmF1bHRzID0ge1xyXG4gICAgb25SZW5kZXI6IGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgICAgICByZXR1cm4gJyc7XHJcbiAgICB9XHJcbn07XHJcbiQuZm4uZGF0ZXBpY2tlci5Db25zdHJ1Y3RvciA9IERhdGVQaWNrZXI7XHJcblxyXG52YXIgRFBHbG9iYWwgPSB7XHJcbiAgICBtb2RlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xzTmFtZTogJ2RheXMnLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdNb250aCcsXHJcbiAgICAgICAgICAgIG5hdlN0ZXA6IDFcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xzTmFtZTogJ21vbnRocycsXHJcbiAgICAgICAgICAgIG5hdkZuYzogJ0Z1bGxZZWFyJyxcclxuICAgICAgICAgICAgbmF2U3RlcDogMVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjbHNOYW1lOiAneWVhcnMnLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdGdWxsWWVhcicsXHJcbiAgICAgICAgICAgIG5hdlN0ZXA6IDEwXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNsc05hbWU6ICdkYXknLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdEYXRlJyxcclxuICAgICAgICAgICAgbmF2U3RlcDogMVxyXG4gICAgICAgIH1cclxuICAgIF0sXHJcbiAgICBkYXRlczp7XHJcbiAgICAgICAgZGF5czogW1wiU3VuZGF5XCIsIFwiTW9uZGF5XCIsIFwiVHVlc2RheVwiLCBcIldlZG5lc2RheVwiLCBcIlRodXJzZGF5XCIsIFwiRnJpZGF5XCIsIFwiU2F0dXJkYXlcIiwgXCJTdW5kYXlcIl0sXHJcbiAgICAgICAgZGF5c1Nob3J0OiBbXCJTdW5cIiwgXCJNb25cIiwgXCJUdWVcIiwgXCJXZWRcIiwgXCJUaHVcIiwgXCJGcmlcIiwgXCJTYXRcIiwgXCJTdW5cIl0sXHJcbiAgICAgICAgZGF5c01pbjogW1wiU3VcIiwgXCJNb1wiLCBcIlR1XCIsIFwiV2VcIiwgXCJUaFwiLCBcIkZyXCIsIFwiU2FcIiwgXCJTdVwiXSxcclxuICAgICAgICBtb250aHM6IFtcIkphbnVhcnlcIiwgXCJGZWJydWFyeVwiLCBcIk1hcmNoXCIsIFwiQXByaWxcIiwgXCJNYXlcIiwgXCJKdW5lXCIsIFwiSnVseVwiLCBcIkF1Z3VzdFwiLCBcIlNlcHRlbWJlclwiLCBcIk9jdG9iZXJcIiwgXCJOb3ZlbWJlclwiLCBcIkRlY2VtYmVyXCJdLFxyXG4gICAgICAgIG1vbnRoc1Nob3J0OiBbXCJKYW5cIiwgXCJGZWJcIiwgXCJNYXJcIiwgXCJBcHJcIiwgXCJNYXlcIiwgXCJKdW5cIiwgXCJKdWxcIiwgXCJBdWdcIiwgXCJTZXBcIiwgXCJPY3RcIiwgXCJOb3ZcIiwgXCJEZWNcIl1cclxuICAgIH0sXHJcbiAgICBpc0xlYXBZZWFyOiBmdW5jdGlvbiAoeWVhcikge1xyXG4gICAgICAgIHJldHVybiAoKCh5ZWFyICUgNCA9PT0gMCkgJiYgKHllYXIgJSAxMDAgIT09IDApKSB8fCAoeWVhciAlIDQwMCA9PT0gMCkpO1xyXG4gICAgfSxcclxuICAgIGdldERheXNJbk1vbnRoOiBmdW5jdGlvbiAoeWVhciwgbW9udGgpIHtcclxuICAgICAgICByZXR1cm4gWzMxLCAoRFBHbG9iYWwuaXNMZWFwWWVhcih5ZWFyKSA/IDI5IDogMjgpLCAzMSwgMzAsIDMxLCAzMCwgMzEsIDMxLCAzMCwgMzEsIDMwLCAzMV1bbW9udGhdO1xyXG4gICAgfSxcclxuICAgIHBhcnNlRm9ybWF0OiBmdW5jdGlvbihmb3JtYXQpe1xyXG4gICAgICAgIHZhciBzZXBhcmF0b3IgPSBmb3JtYXQubWF0Y2goL1suXFwvXFwtXFxzXS4qPy8pLFxyXG4gICAgICAgICAgICBwYXJ0cyA9IGZvcm1hdC5zcGxpdCgvXFxXKy8pO1xyXG4gICAgICAgIGlmICghc2VwYXJhdG9yIHx8ICFwYXJ0cyB8fCBwYXJ0cy5sZW5ndGggPT09IDApe1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGRhdGUgZm9ybWF0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHtzZXBhcmF0b3I6IHNlcGFyYXRvciwgcGFydHM6IHBhcnRzfTtcclxuICAgIH0sXHJcbiAgICBwYXJzZURhdGU6IGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCkge1xyXG4gICAgICAgIC8qanNoaW50IG1heGNvbXBsZXhpdHk6MTEqL1xyXG4gICAgICAgIHZhciBwYXJ0cyA9IGRhdGUuc3BsaXQoZm9ybWF0LnNlcGFyYXRvciksXHJcbiAgICAgICAgICAgIHZhbDtcclxuICAgICAgICBkYXRlID0gbmV3IERhdGUoKTtcclxuICAgICAgICBkYXRlLnNldEhvdXJzKDApO1xyXG4gICAgICAgIGRhdGUuc2V0TWludXRlcygwKTtcclxuICAgICAgICBkYXRlLnNldFNlY29uZHMoMCk7XHJcbiAgICAgICAgZGF0ZS5zZXRNaWxsaXNlY29uZHMoMCk7XHJcbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gZm9ybWF0LnBhcnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgeWVhciA9IGRhdGUuZ2V0RnVsbFllYXIoKSwgZGF5ID0gZGF0ZS5nZXREYXRlKCksIG1vbnRoID0gZGF0ZS5nZXRNb250aCgpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpPTAsIGNudCA9IGZvcm1hdC5wYXJ0cy5sZW5ndGg7IGkgPCBjbnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFsID0gcGFyc2VJbnQocGFydHNbaV0sIDEwKXx8MTtcclxuICAgICAgICAgICAgICAgIHN3aXRjaChmb3JtYXQucGFydHNbaV0pIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdkZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRheSA9IHZhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZS5zZXREYXRlKHZhbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ21tJzpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdtJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggPSB2YWwgLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlLnNldE1vbnRoKHZhbCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd5eSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHllYXIgPSAyMDAwICsgdmFsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlLnNldEZ1bGxZZWFyKDIwMDAgKyB2YWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd5eXl5JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgeWVhciA9IHZhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZS5zZXRGdWxsWWVhcih2YWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGgsIGRheSwgMCAsMCAsMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRlO1xyXG4gICAgfSxcclxuICAgIGZvcm1hdERhdGU6IGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCl7XHJcbiAgICAgICAgdmFyIHZhbCA9IHtcclxuICAgICAgICAgICAgZDogZGF0ZS5nZXREYXRlKCksXHJcbiAgICAgICAgICAgIG06IGRhdGUuZ2V0TW9udGgoKSArIDEsXHJcbiAgICAgICAgICAgIHl5OiBkYXRlLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKS5zdWJzdHJpbmcoMiksXHJcbiAgICAgICAgICAgIHl5eXk6IGRhdGUuZ2V0RnVsbFllYXIoKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFsLmRkID0gKHZhbC5kIDwgMTAgPyAnMCcgOiAnJykgKyB2YWwuZDtcclxuICAgICAgICB2YWwubW0gPSAodmFsLm0gPCAxMCA/ICcwJyA6ICcnKSArIHZhbC5tO1xyXG4gICAgICAgIGRhdGUgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpPTAsIGNudCA9IGZvcm1hdC5wYXJ0cy5sZW5ndGg7IGkgPCBjbnQ7IGkrKykge1xyXG4gICAgICAgICAgICBkYXRlLnB1c2godmFsW2Zvcm1hdC5wYXJ0c1tpXV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0ZS5qb2luKGZvcm1hdC5zZXBhcmF0b3IpO1xyXG4gICAgfSxcclxuICAgIGhlYWRUZW1wbGF0ZTogJzx0aGVhZD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHRyPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRoIGNsYXNzPVwicHJldlwiPiZsc2FxdW87PC90aD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0aCBjb2xzcGFuPVwiNVwiIGNsYXNzPVwic3dpdGNoXCI+PC90aD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0aCBjbGFzcz1cIm5leHRcIj4mcnNhcXVvOzwvdGg+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvdHI+JytcclxuICAgICAgICAgICAgICAgICAgICAnPC90aGVhZD4nLFxyXG4gICAgY29udFRlbXBsYXRlOiAnPHRib2R5Pjx0cj48dGQgY29sc3Bhbj1cIjdcIj48L3RkPjwvdHI+PC90Ym9keT4nXHJcbn07XHJcbkRQR2xvYmFsLnRlbXBsYXRlID0gJzxkaXYgY2xhc3M9XCInICsgY2xhc3Nlcy5jb21wb25lbnQgKyAnXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCInICsgY2xhc3Nlcy5kYXlzICsgJ1wiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRhYmxlIGNsYXNzPVwiIHRhYmxlLWNvbmRlbnNlZFwiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRFBHbG9iYWwuaGVhZFRlbXBsYXRlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGJvZHk+PC90Ym9keT4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvdGFibGU+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiJyArIGNsYXNzZXMubW9udGhzICsgJ1wiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRhYmxlIGNsYXNzPVwidGFibGUtY29uZGVuc2VkXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEUEdsb2JhbC5oZWFkVGVtcGxhdGUrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRFBHbG9iYWwuY29udFRlbXBsYXRlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvdGFibGU+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiJyArIGNsYXNzZXMueWVhcnMgKyAnXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGFibGUgY2xhc3M9XCJ0YWJsZS1jb25kZW5zZWRcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERQR2xvYmFsLmhlYWRUZW1wbGF0ZStcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEUEdsb2JhbC5jb250VGVtcGxhdGUrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC90YWJsZT4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JytcclxuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JztcclxuRFBHbG9iYWwubW9kZXNTZXQgPSB7XHJcbiAgICAnZGF0ZSc6IERQR2xvYmFsLm1vZGVzWzNdLFxyXG4gICAgJ21vbnRoJzogRFBHbG9iYWwubW9kZXNbMF0sXHJcbiAgICAneWVhcic6IERQR2xvYmFsLm1vZGVzWzFdLFxyXG4gICAgJ2RlY2FkZSc6IERQR2xvYmFsLm1vZGVzWzJdXHJcbn07XHJcblxyXG4vKiogUHVibGljIEFQSSAqKi9cclxuZXhwb3J0cy5EYXRlUGlja2VyID0gRGF0ZVBpY2tlcjtcclxuZXhwb3J0cy5kZWZhdWx0cyA9IERQR2xvYmFsO1xyXG5leHBvcnRzLnV0aWxzID0gRFBHbG9iYWw7XHJcbiIsIi8qKiBBcHBvaW50bWVudCBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgQ2xpZW50ID0gcmVxdWlyZSgnLi9DbGllbnQnKSxcclxuICAgIExvY2F0aW9uID0gcmVxdWlyZSgnLi9Mb2NhdGlvbicpLFxyXG4gICAgU2VydmljZSA9IHJlcXVpcmUoJy4vU2VydmljZScpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbiAgIFxyXG5mdW5jdGlvbiBBcHBvaW50bWVudCh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBpZDogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBzdGFydFRpbWU6IG51bGwsXHJcbiAgICAgICAgZW5kVGltZTogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICAvLyBFdmVudCBzdW1tYXJ5OlxyXG4gICAgICAgIHN1bW1hcnk6ICdOZXcgYm9va2luZycsXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3VidG90YWxQcmljZTogMCxcclxuICAgICAgICBmZWVQcmljZTogMCxcclxuICAgICAgICBwZmVlUHJpY2U6IDAsXHJcbiAgICAgICAgdG90YWxQcmljZTogMCxcclxuICAgICAgICBwdG90YWxQcmljZTogMCxcclxuICAgICAgICBcclxuICAgICAgICBwcmVOb3Rlc1RvQ2xpZW50OiBudWxsLFxyXG4gICAgICAgIHBvc3ROb3Rlc1RvQ2xpZW50OiBudWxsLFxyXG4gICAgICAgIHByZU5vdGVzVG9TZWxmOiBudWxsLFxyXG4gICAgICAgIHBvc3ROb3Rlc1RvU2VsZjogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdmFsdWVzID0gdmFsdWVzIHx8IHt9O1xyXG5cclxuICAgIHRoaXMuY2xpZW50ID0ga28ub2JzZXJ2YWJsZSh2YWx1ZXMuY2xpZW50ID8gbmV3IENsaWVudCh2YWx1ZXMuY2xpZW50KSA6IG51bGwpO1xyXG5cclxuICAgIHRoaXMubG9jYXRpb24gPSBrby5vYnNlcnZhYmxlKG5ldyBMb2NhdGlvbih2YWx1ZXMubG9jYXRpb24pKTtcclxuICAgIHRoaXMubG9jYXRpb25TdW1tYXJ5ID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYXRpb24oKS5zaW5nbGVMaW5lKCk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZXJ2aWNlcyA9IGtvLm9ic2VydmFibGVBcnJheSgodmFsdWVzLnNlcnZpY2VzIHx8IFtdKS5tYXAoZnVuY3Rpb24oc2VydmljZSkge1xyXG4gICAgICAgIHJldHVybiAoc2VydmljZSBpbnN0YW5jZW9mIFNlcnZpY2UpID8gc2VydmljZSA6IG5ldyBTZXJ2aWNlKHNlcnZpY2UpO1xyXG4gICAgfSkpO1xyXG4gICAgdGhpcy5zZXJ2aWNlc1N1bW1hcnkgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zZXJ2aWNlcygpLm1hcChmdW5jdGlvbihzZXJ2aWNlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzZXJ2aWNlLm5hbWUoKTtcclxuICAgICAgICB9KS5qb2luKCcsICcpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIC8vIFByaWNlIHVwZGF0ZSBvbiBzZXJ2aWNlcyBjaGFuZ2VzXHJcbiAgICAvLyBUT0RPIElzIG5vdCBjb21wbGV0ZSBmb3IgcHJvZHVjdGlvblxyXG4gICAgdGhpcy5zZXJ2aWNlcy5zdWJzY3JpYmUoZnVuY3Rpb24oc2VydmljZXMpIHtcclxuICAgICAgICB0aGlzLnB0b3RhbFByaWNlKHNlcnZpY2VzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHByZXYgKyBjdXIucHJpY2UoKTtcclxuICAgICAgICB9LCAwKSk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgXHJcbiAgICAvLyBTbWFydCB2aXN1YWxpemF0aW9uIG9mIGRhdGUgYW5kIHRpbWVcclxuICAgIHRoaXMuZGlzcGxheWVkRGF0ZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbW9tZW50KHRoaXMuc3RhcnRUaW1lKCkpLmxvY2FsZSgnZW4tVVMtTEMnKS5jYWxlbmRhcigpO1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzcGxheWVkU3RhcnRUaW1lID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBtb21lbnQodGhpcy5zdGFydFRpbWUoKSkubG9jYWxlKCdlbi1VUy1MQycpLmZvcm1hdCgnTFQnKTtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmRpc3BsYXllZEVuZFRpbWUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzLmVuZFRpbWUoKSkubG9jYWxlKCdlbi1VUy1MQycpLmZvcm1hdCgnTFQnKTtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmRpc3BsYXllZFRpbWVSYW5nZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpcy5kaXNwbGF5ZWRTdGFydFRpbWUoKSArICctJyArIHRoaXMuZGlzcGxheWVkRW5kVGltZSgpO1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuaXRTdGFydGVkID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5zdGFydFRpbWUoKSAmJiBuZXcgRGF0ZSgpID49IHRoaXMuc3RhcnRUaW1lKCkpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuaXRFbmRlZCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKHRoaXMuZW5kVGltZSgpICYmIG5ldyBEYXRlKCkgPj0gdGhpcy5lbmRUaW1lKCkpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuaXNOZXcgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICghdGhpcy5pZCgpKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnN0YXRlSGVhZGVyID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciB0ZXh0ID0gJyc7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzTmV3KCkpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXRTdGFydGVkKCkpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLml0RW5kZWQoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQgPSAnQ29tcGxldGVkOic7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gJ05vdzonO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGV4dCA9ICdVcGNvbWluZzonO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGV4dDtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFwcG9pbnRtZW50O1xyXG4iLCIvKiogQm9va2luZ1N1bW1hcnkgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG4gICAgXHJcbmZ1bmN0aW9uIEJvb2tpbmdTdW1tYXJ5KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHF1YW50aXR5OiAwLFxyXG4gICAgICAgIGNvbmNlcHQ6ICcnLFxyXG4gICAgICAgIHRpbWU6IG51bGwsXHJcbiAgICAgICAgdGltZUZvcm1hdDogJyBbQF0gaDptbWEnXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG5cclxuICAgIHRoaXMucGhyYXNlID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdmFyIHQgPSB0aGlzLnRpbWUoKSAmJiBtb21lbnQodGhpcy50aW1lKCkpLmZvcm1hdCh0aGlzLnRpbWVGb3JtYXQoKSkgfHwgJyc7ICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpcy5jb25jZXB0KCkgKyB0O1xyXG4gICAgfSwgdGhpcyk7XHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJvb2tpbmdTdW1tYXJ5O1xyXG4iLCIvKiogQ2FsZW5kYXJTbG90IG1vZGVsLlxyXG5cclxuICAgIERlc2NyaWJlcyBhIHRpbWUgc2xvdCBpbiB0aGUgY2FsZW5kYXIsIGZvciBhIGNvbnNlY3V0aXZlXHJcbiAgICBldmVudCwgYXBwb2ludG1lbnQgb3IgZnJlZSB0aW1lLlxyXG4gKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIENsaWVudCA9IHJlcXVpcmUoJy4vQ2xpZW50Jyk7XHJcblxyXG5mdW5jdGlvbiBDYWxlbmRhclNsb3QodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBudWxsLFxyXG4gICAgICAgIGVuZFRpbWU6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJycsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyMnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgY2xhc3NOYW1lczogJydcclxuXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENhbGVuZGFyU2xvdDtcclxuIiwiLyoqIENsaWVudCBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gQ2xpZW50KHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBmaXJzdE5hbWU6ICcnLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnJ1xyXG4gICAgfSwgdmFsdWVzKTtcclxuXHJcbiAgICB0aGlzLmZ1bGxOYW1lID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLmZpcnN0TmFtZSgpICsgJyAnICsgdGhpcy5sYXN0TmFtZSgpKTtcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENsaWVudDtcclxuIiwiLyoqIEdldE1vcmUgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIExpc3RWaWV3SXRlbSA9IHJlcXVpcmUoJy4vTGlzdFZpZXdJdGVtJyk7XHJcblxyXG5mdW5jdGlvbiBHZXRNb3JlKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgYXZhaWxhYmlsaXR5OiBmYWxzZSxcclxuICAgICAgICBwYXltZW50czogZmFsc2UsXHJcbiAgICAgICAgcHJvZmlsZTogZmFsc2UsXHJcbiAgICAgICAgY29vcDogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHZhciBhdmFpbGFibGVJdGVtcyA9IHtcclxuICAgICAgICBhdmFpbGFiaWxpdHk6IG5ldyBMaXN0Vmlld0l0ZW0oe1xyXG4gICAgICAgICAgICBjb250ZW50TGluZTE6ICdDb21wbGV0ZSB5b3VyIGF2YWlsYWJpbGl0eSB0byBjcmVhdGUgYSBjbGVhbmVyIGNhbGVuZGFyJyxcclxuICAgICAgICAgICAgbWFya2VySWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tY2FsZW5kYXInLFxyXG4gICAgICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0J1xyXG4gICAgICAgIH0pLFxyXG4gICAgICAgIHBheW1lbnRzOiBuZXcgTGlzdFZpZXdJdGVtKHtcclxuICAgICAgICAgICAgY29udGVudExpbmUxOiAnU3RhcnQgYWNjZXB0aW5nIHBheW1lbnRzIHRocm91Z2ggTG9jb25vbWljcycsXHJcbiAgICAgICAgICAgIG1hcmtlckljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXVzZCcsXHJcbiAgICAgICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tcmlnaHQnXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgcHJvZmlsZTogbmV3IExpc3RWaWV3SXRlbSh7XHJcbiAgICAgICAgICAgIGNvbnRlbnRMaW5lMTogJ0FjdGl2YXRlIHlvdXIgcHJvZmlsZSBpbiB0aGUgbWFya2V0cGxhY2UnLFxyXG4gICAgICAgICAgICBtYXJrZXJJY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi11c2VyJyxcclxuICAgICAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1yaWdodCdcclxuICAgICAgICB9KSxcclxuICAgICAgICBjb29wOiBuZXcgTGlzdFZpZXdJdGVtKHtcclxuICAgICAgICAgICAgY29udGVudExpbmUxOiAnTGVhcm4gbW9yZSBhYm91dCBvdXIgY29vcGVyYXRpdmUnLFxyXG4gICAgICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0J1xyXG4gICAgICAgIH0pXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXRlbXMgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGl0ZW1zID0gW107XHJcbiAgICAgICAgXHJcbiAgICAgICAgT2JqZWN0LmtleXMoYXZhaWxhYmxlSXRlbXMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAodGhpc1trZXldKCkpXHJcbiAgICAgICAgICAgICAgICBpdGVtcy5wdXNoKGF2YWlsYWJsZUl0ZW1zW2tleV0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBpdGVtcztcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEdldE1vcmU7XHJcbiIsIi8qKiBMaXN0Vmlld0l0ZW0gbW9kZWwuXHJcblxyXG4gICAgRGVzY3JpYmVzIGEgZ2VuZXJpYyBpdGVtIG9mIGFcclxuICAgIExpc3RWaWV3IGNvbXBvbmVudC5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuXHJcbmZ1bmN0aW9uIExpc3RWaWV3SXRlbSh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBtYXJrZXJMaW5lMTogbnVsbCxcclxuICAgICAgICBtYXJrZXJMaW5lMjogbnVsbCxcclxuICAgICAgICBtYXJrZXJJY29uOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnRlbnRMaW5lMTogJycsXHJcbiAgICAgICAgY29udGVudExpbmUyOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICcnXHJcblxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMaXN0Vmlld0l0ZW07XHJcbiIsIi8qKiBMb2NhdGlvbiBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gTG9jYXRpb24odmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgbG9jYXRpb25JRDogMCxcclxuICAgICAgICBuYW1lOiAnJyxcclxuICAgICAgICBhZGRyZXNzTGluZTE6IG51bGwsXHJcbiAgICAgICAgYWRkcmVzc0xpbmUyOiBudWxsLFxyXG4gICAgICAgIGNpdHk6IG51bGwsXHJcbiAgICAgICAgc3RhdGVQcm92aW5jZUNvZGU6IG51bGwsXHJcbiAgICAgICAgc3RhdGVQcm92aWNlSUQ6IG51bGwsXHJcbiAgICAgICAgcG9zdGFsQ29kZTogbnVsbCxcclxuICAgICAgICBwb3N0YWxDb2RlSUQ6IG51bGwsXHJcbiAgICAgICAgY291bnRyeUlEOiBudWxsLFxyXG4gICAgICAgIGxhdGl0dWRlOiBudWxsLFxyXG4gICAgICAgIGxvbmdpdHVkZTogbnVsbCxcclxuICAgICAgICBzcGVjaWFsSW5zdHJ1Y3Rpb25zOiBudWxsLFxyXG4gICAgICAgIGlzU2VydmljZVJhZGl1czogZmFsc2UsXHJcbiAgICAgICAgaXNTZXJ2aWNlTG9jYXRpb246IGZhbHNlLFxyXG4gICAgICAgIHNlcnZpY2VSYWRpdXM6IDBcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2luZ2xlTGluZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBsaXN0ID0gW1xyXG4gICAgICAgICAgICB0aGlzLmFkZHJlc3NMaW5lMSgpLFxyXG4gICAgICAgICAgICB0aGlzLmNpdHkoKSxcclxuICAgICAgICAgICAgdGhpcy5wb3N0YWxDb2RlKCksXHJcbiAgICAgICAgICAgIHRoaXMuc3RhdGVQcm92aW5jZUNvZGUoKVxyXG4gICAgICAgIF07XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGxpc3QuZmlsdGVyKGZ1bmN0aW9uKHYpIHsgcmV0dXJuICEhdjsgfSkuam9pbignLCAnKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmNvdW50cnlOYW1lID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5jb3VudHJ5SUQoKSA9PT0gMSA/XHJcbiAgICAgICAgICAgICdVbml0ZWQgU3RhdGVzJyA6XHJcbiAgICAgICAgICAgIHRoaXMuY291bnRyeUlEKCkgPT09IDIgP1xyXG4gICAgICAgICAgICAnU3BhaW4nIDpcclxuICAgICAgICAgICAgJ3Vua25vdydcclxuICAgICAgICApO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuY291bnRyeUNvZGVBbHBoYTIgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmNvdW50cnlJRCgpID09PSAxID9cclxuICAgICAgICAgICAgJ1VTJyA6XHJcbiAgICAgICAgICAgIHRoaXMuY291bnRyeUlEKCkgPT09IDIgP1xyXG4gICAgICAgICAgICAnRVMnIDpcclxuICAgICAgICAgICAgJydcclxuICAgICAgICApO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubGF0bG5nID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgbGF0OiB0aGlzLmxhdGl0dWRlKCksXHJcbiAgICAgICAgICAgIGxuZzogdGhpcy5sb25naXR1ZGUoKVxyXG4gICAgICAgIH07XHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMb2NhdGlvbjtcclxuIiwiLyoqIE1haWxGb2xkZXIgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpLFxyXG4gICAgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xyXG5cclxuZnVuY3Rpb24gTWFpbEZvbGRlcih2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIG1lc3NhZ2VzOiBbXSxcclxuICAgICAgICB0b3BOdW1iZXI6IDEwXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnRvcCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbiB0b3AobnVtKSB7XHJcbiAgICAgICAgaWYgKG51bSkgdGhpcy50b3BOdW1iZXIobnVtKTtcclxuICAgICAgICByZXR1cm4gXy5maXJzdCh0aGlzLm1lc3NhZ2VzKCksIHRoaXMudG9wTnVtYmVyKCkpO1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWFpbEZvbGRlcjtcclxuIiwiLyoqIE1lc3NhZ2UgbW9kZWwuXHJcblxyXG4gICAgRGVzY3JpYmVzIGEgbWVzc2FnZSBmcm9tIGEgTWFpbEZvbGRlci5cclxuICAgIEEgbWVzc2FnZSBjb3VsZCBiZSBvZiBkaWZmZXJlbnQgdHlwZXMsXHJcbiAgICBhcyBpbnF1aXJpZXMsIGJvb2tpbmdzLCBib29raW5nIHJlcXVlc3RzLlxyXG4gKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG4vL1RPRE8gICBUaHJlYWQgPSByZXF1aXJlKCcuL1RocmVhZCcpO1xyXG5cclxuZnVuY3Rpb24gTWVzc2FnZSh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnJyxcclxuICAgICAgICBjb250ZW50OiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICcnXHJcblxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgLy8gU21hcnQgdmlzdWFsaXphdGlvbiBvZiBkYXRlIGFuZCB0aW1lXHJcbiAgICB0aGlzLmRpc3BsYXllZERhdGUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzLmNyZWF0ZWREYXRlKCkpLmxvY2FsZSgnZW4tVVMtTEMnKS5jYWxlbmRhcigpO1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuZGlzcGxheWVkVGltZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbW9tZW50KHRoaXMuY3JlYXRlZERhdGUoKSkubG9jYWxlKCdlbi1VUy1MQycpLmZvcm1hdCgnTFQnKTtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1lc3NhZ2U7XHJcbiIsIi8qKlxuICAgIE1vZGVsIGNsYXNzIHRvIGhlbHAgYnVpbGQgbW9kZWxzLlxuXG4gICAgSXMgbm90IGV4YWN0bHkgYW4gJ09PUCBiYXNlJyBjbGFzcywgYnV0IHByb3ZpZGVzXG4gICAgdXRpbGl0aWVzIHRvIG1vZGVscyBhbmQgYSBtb2RlbCBkZWZpbml0aW9uIG9iamVjdFxuICAgIHdoZW4gZXhlY3V0ZWQgaW4gdGhlaXIgY29uc3RydWN0b3JzIGFzOlxuICAgIFxuICAgICcnJ1xuICAgIGZ1bmN0aW9uIE15TW9kZWwoKSB7XG4gICAgICAgIE1vZGVsKHRoaXMpO1xuICAgICAgICAvLyBOb3csIHRoZXJlIGlzIGEgdGhpcy5tb2RlbCBwcm9wZXJ0eSB3aXRoXG4gICAgICAgIC8vIGFuIGluc3RhbmNlIG9mIHRoZSBNb2RlbCBjbGFzcywgd2l0aCBcbiAgICAgICAgLy8gdXRpbGl0aWVzIGFuZCBtb2RlbCBzZXR0aW5ncy5cbiAgICB9XG4gICAgJycnXG4gICAgXG4gICAgVGhhdCBhdXRvIGNyZWF0aW9uIG9mICdtb2RlbCcgcHJvcGVydHkgY2FuIGJlIGF2b2lkZWRcbiAgICB3aGVuIHVzaW5nIHRoZSBvYmplY3QgaW5zdGFudGlhdGlvbiBzeW50YXggKCduZXcnIGtleXdvcmQpOlxuICAgIFxuICAgICcnJ1xuICAgIHZhciBtb2RlbCA9IG5ldyBNb2RlbChvYmopO1xuICAgIC8vIFRoZXJlIGlzIG5vIGEgJ29iai5tb2RlbCcgcHJvcGVydHksIGNhbiBiZVxuICAgIC8vIGFzc2lnbmVkIHRvIHdoYXRldmVyIHByb3BlcnR5IG9yIG5vdGhpbmcuXG4gICAgJycnXG4qKi9cbid1c2Ugc3RyaWN0JztcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XG5rby5tYXBwaW5nID0gcmVxdWlyZSgna25vY2tvdXQubWFwcGluZycpO1xuXG5mdW5jdGlvbiBNb2RlbChtb2RlbE9iamVjdCkge1xuICAgIFxuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBNb2RlbCkpIHtcbiAgICAgICAgLy8gRXhlY3V0ZWQgYXMgYSBmdW5jdGlvbiwgaXQgbXVzdCBjcmVhdGVcbiAgICAgICAgLy8gYSBNb2RlbCBpbnN0YW5jZVxuICAgICAgICB2YXIgbW9kZWwgPSBuZXcgTW9kZWwobW9kZWxPYmplY3QpO1xuICAgICAgICAvLyBhbmQgcmVnaXN0ZXIgYXV0b21hdGljYWxseSBhcyBwYXJ0XG4gICAgICAgIC8vIG9mIHRoZSBtb2RlbE9iamVjdCBpbiAnbW9kZWwnIHByb3BlcnR5XG4gICAgICAgIG1vZGVsT2JqZWN0Lm1vZGVsID0gbW9kZWw7XG4gICAgICAgIFxuICAgICAgICAvLyBSZXR1cm5zIHRoZSBpbnN0YW5jZVxuICAgICAgICByZXR1cm4gbW9kZWw7XG4gICAgfVxuIFxuICAgIC8vIEl0IGluY2x1ZGVzIGEgcmVmZXJlbmNlIHRvIHRoZSBvYmplY3RcbiAgICB0aGlzLm1vZGVsT2JqZWN0ID0gbW9kZWxPYmplY3Q7XG4gICAgLy8gSXQgbWFpbnRhaW5zIGEgbGlzdCBvZiBwcm9wZXJ0aWVzIGFuZCBmaWVsZHNcbiAgICB0aGlzLnByb3BlcnRpZXNMaXN0ID0gW107XG4gICAgdGhpcy5maWVsZHNMaXN0ID0gW107XG4gICAgLy8gSXQgYWxsb3cgc2V0dGluZyB0aGUgJ2tvLm1hcHBpbmcuZnJvbUpTJyBtYXBwaW5nIG9wdGlvbnNcbiAgICAvLyB0byBjb250cm9sIGNvbnZlcnNpb25zIGZyb20gcGxhaW4gSlMgb2JqZWN0cyB3aGVuIFxuICAgIC8vICd1cGRhdGVXaXRoJy5cbiAgICB0aGlzLm1hcHBpbmdPcHRpb25zID0ge307XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kZWw7XG5cbi8qKlxuICAgIERlZmluZSBvYnNlcnZhYmxlIHByb3BlcnRpZXMgdXNpbmcgdGhlIGdpdmVuXG4gICAgcHJvcGVydGllcyBvYmplY3QgZGVmaW5pdGlvbiB0aGF0IGluY2x1ZGVzIGRlIGRlZmF1bHQgdmFsdWVzLFxuICAgIGFuZCBzb21lIG9wdGlvbmFsIGluaXRpYWxWYWx1ZXMgKG5vcm1hbGx5IHRoYXQgaXMgcHJvdmlkZWQgZXh0ZXJuYWxseVxuICAgIGFzIGEgcGFyYW1ldGVyIHRvIHRoZSBtb2RlbCBjb25zdHJ1Y3Rvciwgd2hpbGUgZGVmYXVsdCB2YWx1ZXMgYXJlXG4gICAgc2V0IGluIHRoZSBjb25zdHJ1Y3RvcikuXG4gICAgVGhhdCBwcm9wZXJ0aWVzIGJlY29tZSBtZW1iZXJzIG9mIHRoZSBtb2RlbE9iamVjdCwgc2ltcGxpZnlpbmcgXG4gICAgbW9kZWwgZGVmaW5pdGlvbnMuXG4gICAgXG4gICAgSXQgdXNlcyBLbm9ja291dC5vYnNlcnZhYmxlIGFuZCBvYnNlcnZhYmxlQXJyYXksIHNvIHByb3BlcnRpZXNcbiAgICBhcmUgZnVudGlvbnMgdGhhdCByZWFkcyB0aGUgdmFsdWUgd2hlbiBubyBhcmd1bWVudHMgb3Igc2V0cyB3aGVuXG4gICAgb25lIGFyZ3VtZW50IGlzIHBhc3NlZCBvZi5cbioqL1xuTW9kZWwucHJvdG90eXBlLmRlZlByb3BlcnRpZXMgPSBmdW5jdGlvbiBkZWZQcm9wZXJ0aWVzKHByb3BlcnRpZXMsIGluaXRpYWxWYWx1ZXMpIHtcblxuICAgIGluaXRpYWxWYWx1ZXMgPSBpbml0aWFsVmFsdWVzIHx8IHt9O1xuXG4gICAgdmFyIG1vZGVsT2JqZWN0ID0gdGhpcy5tb2RlbE9iamVjdCxcbiAgICAgICAgcHJvcGVydGllc0xpc3QgPSB0aGlzLnByb3BlcnRpZXNMaXN0O1xuXG4gICAgT2JqZWN0LmtleXMocHJvcGVydGllcykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgXG4gICAgICAgIHZhciBkZWZWYWwgPSBwcm9wZXJ0aWVzW2tleV07XG4gICAgICAgIC8vIENyZWF0ZSBvYnNlcnZhYmxlIHByb3BlcnR5IHdpdGggZGVmYXVsdCB2YWx1ZVxuICAgICAgICBtb2RlbE9iamVjdFtrZXldID0gQXJyYXkuaXNBcnJheShkZWZWYWwpID9cbiAgICAgICAgICAgIGtvLm9ic2VydmFibGVBcnJheShkZWZWYWwpIDpcbiAgICAgICAgICAgIGtvLm9ic2VydmFibGUoZGVmVmFsKTtcbiAgICAgICAgLy8gUmVtZW1iZXIgZGVmYXVsdFxuICAgICAgICBtb2RlbE9iamVjdFtrZXldLl9kZWZhdWx0VmFsdWUgPSBkZWZWYWw7XG4gICAgICAgIFxuICAgICAgICAvLyBJZiB0aGVyZSBpcyBhbiBpbml0aWFsVmFsdWUsIHNldCBpdDpcbiAgICAgICAgaWYgKHR5cGVvZihpbml0aWFsVmFsdWVzW2tleV0pICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgbW9kZWxPYmplY3Rba2V5XShpbml0aWFsVmFsdWVzW2tleV0pO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBBZGQgdG8gdGhlIGludGVybmFsIHJlZ2lzdHJ5XG4gICAgICAgIHByb3BlcnRpZXNMaXN0LnB1c2goa2V5KTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICAgIERlZmluZSBmaWVsZHMgYXMgcGxhaW4gbWVtYmVycyBvZiB0aGUgbW9kZWxPYmplY3QgdXNpbmdcbiAgICB0aGUgZmllbGRzIG9iamVjdCBkZWZpbml0aW9uIHRoYXQgaW5jbHVkZXMgZGVmYXVsdCB2YWx1ZXMsXG4gICAgYW5kIHNvbWUgb3B0aW9uYWwgaW5pdGlhbFZhbHVlcy5cbiAgICBcbiAgICBJdHMgbGlrZSBkZWZQcm9wZXJ0aWVzLCBidXQgZm9yIHBsYWluIGpzIHZhbHVlcyByYXRoZXIgdGhhbiBvYnNlcnZhYmxlcy5cbioqL1xuTW9kZWwucHJvdG90eXBlLmRlZkZpZWxkcyA9IGZ1bmN0aW9uIGRlZkZpZWxkcyhmaWVsZHMsIGluaXRpYWxWYWx1ZXMpIHtcblxuICAgIGluaXRpYWxWYWx1ZXMgPSBpbml0aWFsVmFsdWVzIHx8IHt9O1xuXG4gICAgdmFyIG1vZGVsT2JqZWN0ID0gdGhpcy5tb2RlbE9iamVjdCxcbiAgICAgICAgZmllbGRzTGlzdCA9IHRoaXMuZmllbGRzTGlzdDtcblxuICAgIE9iamVjdC5rZXlzKGZpZWxkcykuZWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgXG4gICAgICAgIHZhciBkZWZWYWwgPSBmaWVsZHNba2V5XTtcbiAgICAgICAgLy8gQ3JlYXRlIGZpZWxkIHdpdGggZGVmYXVsdCB2YWx1ZVxuICAgICAgICBtb2RlbE9iamVjdFtrZXldID0gZGVmVmFsO1xuICAgICAgICBcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgYW4gaW5pdGlhbFZhbHVlLCBzZXQgaXQ6XG4gICAgICAgIGlmICh0eXBlb2YoaW5pdGlhbFZhbHVlc1trZXldKSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIG1vZGVsT2JqZWN0W2tleV0gPSBpbml0aWFsVmFsdWVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEFkZCB0byB0aGUgaW50ZXJuYWwgcmVnaXN0cnlcbiAgICAgICAgZmllbGRzTGlzdC5wdXNoKGtleSk7XG4gICAgfSk7ICAgIFxufTtcblxuTW9kZWwucHJvdG90eXBlLnVwZGF0ZVdpdGggPSBmdW5jdGlvbiB1cGRhdGVXaXRoKGRhdGEpIHtcbiAgICBcbiAgICAvLyBXZSBuZWVkIGEgcGxhaW4gb2JqZWN0IGZvciAnZnJvbUpTJy5cbiAgICAvLyBJZiBpcyBhIG1vZGVsLCBleHRyYWN0IHRoZWlyIHByb3BlcnRpZXMgYW5kIGZpZWxkcyBmcm9tXG4gICAgLy8gdGhlIG9ic2VydmFibGVzIChmcm9tSlMpLCBzbyB3ZSBub3QgZ2V0IGNvbXB1dGVkXG4gICAgLy8gb3IgZnVuY3Rpb25zLCBqdXN0IHJlZ2lzdGVyZWQgcHJvcGVydGllcyBhbmQgZmllbGRzXG4gICAgaWYgKGRhdGEgJiYgZGF0YS5tb2RlbCBpbnN0YW5jZW9mIE1vZGVsKSB7XG4gICAgICAgIFxuICAgICAgICB2YXIgcGxhaW4gPSB7fTtcblxuICAgICAgICBkYXRhLm1vZGVsLnByb3BlcnRpZXNMaXN0LmZvckVhY2goZnVuY3Rpb24ocHJvcGVydHkpIHtcbiAgICAgICAgICAgIC8vIFByb3BlcnRpZXMgYXJlIG9ic2VydmFibGVzLCBzbyBmdW5jdGlvbnMgd2l0aG91dCBwYXJhbXM6XG4gICAgICAgICAgICBwbGFpbltwcm9wZXJ0eV0gPSBkYXRhW3Byb3BlcnR5XSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIGRhdGEubW9kZWwuZmllbGRzTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgICAgICAgICAvLyBGaWVsZHMgYXJlIGp1c3QgcGxhaW4gb2JqZWN0IG1lbWJlcnMgZm9yIHZhbHVlcywganVzdCBjb3B5OlxuICAgICAgICAgICAgcGxhaW5bZmllbGRdID0gZGF0YVtmaWVsZF07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRhdGEgPSBwbGFpbjtcbiAgICB9XG5cbiAgICBrby5tYXBwaW5nLmZyb21KUyhkYXRhLCB0aGlzLm1hcHBpbmdPcHRpb25zLCB0aGlzLm1vZGVsT2JqZWN0KTtcbn07XG4iLCIvKiogUGVyZm9ybWFuY2VTdW1tYXJ5IG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBMaXN0Vmlld0l0ZW0gPSByZXF1aXJlKCcuL0xpc3RWaWV3SXRlbScpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXHJcbiAgICBudW1lcmFsID0gcmVxdWlyZSgnbnVtZXJhbCcpO1xyXG5cclxuZnVuY3Rpb24gUGVyZm9ybWFuY2VTdW1tYXJ5KHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHZhbHVlcyA9IHZhbHVlcyB8fCB7fTtcclxuXHJcbiAgICB0aGlzLmVhcm5pbmdzID0gbmV3IEVhcm5pbmdzKHZhbHVlcy5lYXJuaW5ncyk7XHJcbiAgICBcclxuICAgIHZhciBlYXJuaW5nc0xpbmUgPSBuZXcgTGlzdFZpZXdJdGVtKCk7XHJcbiAgICBlYXJuaW5nc0xpbmUubWFya2VyTGluZTEgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgbnVtID0gbnVtZXJhbCh0aGlzLmN1cnJlbnRBbW91bnQoKSkuZm9ybWF0KCckMCwwJyk7XHJcbiAgICAgICAgcmV0dXJuIG51bTtcclxuICAgIH0sIHRoaXMuZWFybmluZ3MpO1xyXG4gICAgZWFybmluZ3NMaW5lLmNvbnRlbnRMaW5lMSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRDb25jZXB0KCk7XHJcbiAgICB9LCB0aGlzLmVhcm5pbmdzKTtcclxuICAgIGVhcm5pbmdzTGluZS5tYXJrZXJMaW5lMiA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBudW0gPSBudW1lcmFsKHRoaXMubmV4dEFtb3VudCgpKS5mb3JtYXQoJyQwLDAnKTtcclxuICAgICAgICByZXR1cm4gbnVtO1xyXG4gICAgfSwgdGhpcy5lYXJuaW5ncyk7XHJcbiAgICBlYXJuaW5nc0xpbmUuY29udGVudExpbmUyID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dENvbmNlcHQoKTtcclxuICAgIH0sIHRoaXMuZWFybmluZ3MpO1xyXG4gICAgXHJcblxyXG4gICAgdGhpcy50aW1lQm9va2VkID0gbmV3IFRpbWVCb29rZWQodmFsdWVzLnRpbWVCb29rZWQpO1xyXG5cclxuICAgIHZhciB0aW1lQm9va2VkTGluZSA9IG5ldyBMaXN0Vmlld0l0ZW0oKTtcclxuICAgIHRpbWVCb29rZWRMaW5lLm1hcmtlckxpbmUxID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIG51bSA9IG51bWVyYWwodGhpcy5wZXJjZW50KCkpLmZvcm1hdCgnMCUnKTtcclxuICAgICAgICByZXR1cm4gbnVtO1xyXG4gICAgfSwgdGhpcy50aW1lQm9va2VkKTtcclxuICAgIHRpbWVCb29rZWRMaW5lLmNvbnRlbnRMaW5lMSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbmNlcHQoKTtcclxuICAgIH0sIHRoaXMudGltZUJvb2tlZCk7XHJcbiAgICBcclxuICAgIFxyXG4gICAgdGhpcy5pdGVtcyA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcclxuICAgICAgICBcclxuICAgICAgICBpdGVtcy5wdXNoKGVhcm5pbmdzTGluZSk7XHJcbiAgICAgICAgaXRlbXMucHVzaCh0aW1lQm9va2VkTGluZSk7XHJcblxyXG4gICAgICAgIHJldHVybiBpdGVtcztcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBlcmZvcm1hbmNlU3VtbWFyeTtcclxuXHJcbmZ1bmN0aW9uIEVhcm5pbmdzKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgXHJcbiAgICAgICAgIGN1cnJlbnRBbW91bnQ6IDAsXHJcbiAgICAgICAgIGN1cnJlbnRDb25jZXB0VGVtcGxhdGU6ICdhbHJlYWR5IHBhaWQgdGhpcyBtb250aCcsXHJcbiAgICAgICAgIG5leHRBbW91bnQ6IDAsXHJcbiAgICAgICAgIG5leHRDb25jZXB0VGVtcGxhdGU6ICdwcm9qZWN0ZWQge21vbnRofSBlYXJuaW5ncydcclxuXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmN1cnJlbnRDb25jZXB0ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgbW9udGggPSBtb21lbnQoKS5mb3JtYXQoJ01NTU0nKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50Q29uY2VwdFRlbXBsYXRlKCkucmVwbGFjZSgvXFx7bW9udGhcXH0vLCBtb250aCk7XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgdGhpcy5uZXh0Q29uY2VwdCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIG1vbnRoID0gbW9tZW50KCkuYWRkKDEsICdtb250aCcpLmZvcm1hdCgnTU1NTScpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5leHRDb25jZXB0VGVtcGxhdGUoKS5yZXBsYWNlKC9cXHttb250aFxcfS8sIG1vbnRoKTtcclxuXHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gVGltZUJvb2tlZCh2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgIFxyXG4gICAgICAgIHBlcmNlbnQ6IDAsXHJcbiAgICAgICAgY29uY2VwdFRlbXBsYXRlOiAnb2YgYXZhaWxhYmxlIHRpbWUgYm9va2VkIGluIHttb250aH0nXHJcbiAgICBcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuY29uY2VwdCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIG1vbnRoID0gbW9tZW50KCkuYWRkKDEsICdtb250aCcpLmZvcm1hdCgnTU1NTScpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbmNlcHRUZW1wbGF0ZSgpLnJlcGxhY2UoL1xce21vbnRoXFx9LywgbW9udGgpO1xyXG5cclxuICAgIH0sIHRoaXMpO1xyXG59XHJcbiIsIi8qKiBQb3NpdGlvbiBtb2RlbC5cclxuICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBQb3NpdGlvbih2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBwb3NpdGlvbklEOiAwLFxyXG4gICAgICAgIHBvc2l0aW9uU2luZ3VsYXI6ICcnLFxyXG4gICAgICAgIHBvc2l0aW9uUGx1cmFsOiAnJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJycsXHJcbiAgICAgICAgYWN0aXZlOiB0cnVlXHJcblxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQb3NpdGlvbjtcclxuIiwiLyoqIFNlcnZpY2UgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKTtcclxuXHJcbmZ1bmN0aW9uIFNlcnZpY2UodmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgbmFtZTogJycsXHJcbiAgICAgICAgcHJpY2U6IDAsXHJcbiAgICAgICAgZHVyYXRpb246IDAsIC8vIGluIG1pbnV0ZXNcclxuICAgICAgICBpc0FkZG9uOiBmYWxzZVxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5kdXJhdGlvblRleHQgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgbWludXRlcyA9IHRoaXMuZHVyYXRpb24oKSB8fCAwO1xyXG4gICAgICAgIC8vIFRPRE86IEZvcm1hdHRpbmcsIGxvY2FsaXphdGlvblxyXG4gICAgICAgIHJldHVybiBtaW51dGVzID8gbWludXRlcyArICcgbWludXRlcycgOiAnJztcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNlcnZpY2U7XHJcbiIsIi8qKiBVcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeSBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgQm9va2luZ1N1bW1hcnkgPSByZXF1aXJlKCcuL0Jvb2tpbmdTdW1tYXJ5Jyk7XHJcblxyXG5mdW5jdGlvbiBVcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeSgpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLnRvZGF5ID0gbmV3IEJvb2tpbmdTdW1tYXJ5KHtcclxuICAgICAgICBjb25jZXB0OiAnbGVmdCB0b2RheScsXHJcbiAgICAgICAgdGltZUZvcm1hdDogJyBbZW5kaW5nIEBdIGg6bW1hJ1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLnRvbW9ycm93ID0gbmV3IEJvb2tpbmdTdW1tYXJ5KHtcclxuICAgICAgICBjb25jZXB0OiAndG9tb3Jyb3cnLFxyXG4gICAgICAgIHRpbWVGb3JtYXQ6ICcgW3N0YXJ0aW5nIEBdIGg6bW1hJ1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLm5leHRXZWVrID0gbmV3IEJvb2tpbmdTdW1tYXJ5KHtcclxuICAgICAgICBjb25jZXB0OiAnbmV4dCB3ZWVrJ1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHRoaXMuaXRlbXMgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGl0ZW1zID0gW107XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHRoaXMudG9kYXkucXVhbnRpdHkoKSlcclxuICAgICAgICAgICAgaXRlbXMucHVzaCh0aGlzLnRvZGF5KTtcclxuICAgICAgICBpZiAodGhpcy50b21vcnJvdy5xdWFudGl0eSgpKVxyXG4gICAgICAgICAgICBpdGVtcy5wdXNoKHRoaXMudG9tb3Jyb3cpO1xyXG4gICAgICAgIGlmICh0aGlzLm5leHRXZWVrLnF1YW50aXR5KCkpXHJcbiAgICAgICAgICAgIGl0ZW1zLnB1c2godGhpcy5uZXh0V2Vlayk7XHJcblxyXG4gICAgICAgIHJldHVybiBpdGVtcztcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVXBjb21pbmdCb29raW5nc1N1bW1hcnk7XHJcbiIsIi8qKiBVc2VyIG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG4vLyBFbnVtIFVzZXJUeXBlXHJcbnZhciBVc2VyVHlwZSA9IHtcclxuICAgIE5vbmU6IDAsXHJcbiAgICBBbm9ueW1vdXM6IDEsXHJcbiAgICBDdXN0b21lcjogMixcclxuICAgIFByb3ZpZGVyOiA0LFxyXG4gICAgQWRtaW46IDgsXHJcbiAgICBMb2dnZWRVc2VyOiAxNCxcclxuICAgIFVzZXI6IDE1LFxyXG4gICAgU3lzdGVtOiAxNlxyXG59O1xyXG5cclxuZnVuY3Rpb24gVXNlcih2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgdXNlcklEOiAwLFxyXG4gICAgICAgIGVtYWlsOiAnJyxcclxuICAgICAgICBmaXJzdE5hbWU6ICcnLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnJyxcclxuICAgICAgICBpc0N1c3RvbWVyOiBmYWxzZSxcclxuICAgICAgICBpc1Byb3ZpZGVyOiBmYWxzZSxcclxuICAgICAgICBpc0FkbWluOiBmYWxzZSxcclxuICAgICAgICBvbmJvYXJkaW5nU3RlcDogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxuXHJcbiAgICB0aGlzLmZ1bGxOYW1lID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLmZpcnN0TmFtZSgpICsgJyAnICsgdGhpcy5sYXN0TmFtZSgpKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnVzZXJUeXBlID0ga28ucHVyZUNvbXB1dGVkKHtcclxuICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIGMgPSB0aGlzLmlzQ3VzdG9tZXIoKSxcclxuICAgICAgICAgICAgICAgIHAgPSB0aGlzLmlzUHJvdmlkZXIoKSxcclxuICAgICAgICAgICAgICAgIGEgPSB0aGlzLmlzQWRtaW4oKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciB1c2VyVHlwZSA9IDA7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc0Fub255bW91cygpKSB7XHJcbiAgICAgICAgICAgICAgICB1c2VyVHlwZSA9IHVzZXJUeXBlIHwgVXNlclR5cGUuQW5vbnltb3VzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChjKVxyXG4gICAgICAgICAgICAgICAgdXNlclR5cGUgPSB1c2VyVHlwZSB8IFVzZXJUeXBlLkN1c3RvbWVyO1xyXG4gICAgICAgICAgICBpZiAocClcclxuICAgICAgICAgICAgICAgIHVzZXJUeXBlID0gdXNlclR5cGUgfCBVc2VyVHlwZS5Qcm92aWRlcjtcclxuICAgICAgICAgICAgaWYgKGEpXHJcbiAgICAgICAgICAgICAgICB1c2VyVHlwZSA9IHVzZXJUeXBlIHwgVXNlclR5cGUuQWRtaW47XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gdXNlclR5cGU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKiBOT1RFOiBOb3QgcmVxdWlyZSBmb3Igbm93OlxyXG4gICAgICAgIHdyaXRlOiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgfSwqL1xyXG4gICAgICAgIG93bmVyOiB0aGlzXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgdGhpcy5pc0Fub255bW91cyA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLnVzZXJJRCgpIDwgMTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBJdCBtYXRjaGVzIGEgVXNlclR5cGUgZnJvbSB0aGUgZW51bWVyYXRpb24/XHJcbiAgICAqKi9cclxuICAgIHRoaXMuaXNVc2VyVHlwZSA9IGZ1bmN0aW9uIGlzVXNlclR5cGUodHlwZSkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy51c2VyVHlwZSgpICYgdHlwZSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVXNlcjtcclxuXHJcblVzZXIuVXNlclR5cGUgPSBVc2VyVHlwZTtcclxuXHJcbi8qIENyZWF0aW50IGFuIGFub255bW91cyB1c2VyIHdpdGggc29tZSBwcmVzc2V0cyAqL1xyXG5Vc2VyLm5ld0Fub255bW91cyA9IGZ1bmN0aW9uIG5ld0Fub255bW91cygpIHtcclxuICAgIHJldHVybiBuZXcgVXNlcih7XHJcbiAgICAgICAgdXNlcklEOiAwLFxyXG4gICAgICAgIGVtYWlsOiAnJyxcclxuICAgICAgICBmaXJzdE5hbWU6ICcnLFxyXG4gICAgICAgIG9uYm9hcmRpbmdTdGVwOiBudWxsXHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqIENhbGVuZGFyIEFwcG9pbnRtZW50cyB0ZXN0IGRhdGEgKiovXHJcbnZhciBBcHBvaW50bWVudCA9IHJlcXVpcmUoJy4uL21vZGVscy9BcHBvaW50bWVudCcpO1xyXG52YXIgdGVzdExvY2F0aW9ucyA9IHJlcXVpcmUoJy4vbG9jYXRpb25zJykubG9jYXRpb25zO1xyXG52YXIgdGVzdFNlcnZpY2VzID0gcmVxdWlyZSgnLi9zZXJ2aWNlcycpLnNlcnZpY2VzO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG52YXIgdG9kYXkgPSBtb21lbnQoKSxcclxuICAgIHRvbW9ycm93ID0gbW9tZW50KCkuYWRkKDEsICdkYXlzJyksXHJcbiAgICB0b21vcnJvdzEwID0gdG9tb3Jyb3cuY2xvbmUoKS5ob3VycygxMCkubWludXRlcygwKS5zZWNvbmRzKDApLFxyXG4gICAgdG9tb3Jyb3cxNiA9IHRvbW9ycm93LmNsb25lKCkuaG91cnMoMTYpLm1pbnV0ZXMoMzApLnNlY29uZHMoMCk7XHJcbiAgICBcclxudmFyIHRlc3REYXRhID0gW1xyXG4gICAgbmV3IEFwcG9pbnRtZW50KHtcclxuICAgICAgICBpZDogMSxcclxuICAgICAgICBzdGFydFRpbWU6IHRvbW9ycm93MTAsXHJcbiAgICAgICAgZW5kVGltZTogdG9tb3Jyb3cxNixcclxuICAgICAgICBzdW1tYXJ5OiAnTWFzc2FnZSBUaGVyYXBpc3QgQm9va2luZycsXHJcbiAgICAgICAgLy9wcmljaW5nU3VtbWFyeTogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UgMTIwbSBwbHVzIDIgbW9yZScsXHJcbiAgICAgICAgc2VydmljZXM6IHRlc3RTZXJ2aWNlcyxcclxuICAgICAgICBwdG90YWxQcmljZTogOTUuMCxcclxuICAgICAgICBsb2NhdGlvbjoga28udG9KUyh0ZXN0TG9jYXRpb25zWzBdKSxcclxuICAgICAgICBwcmVOb3Rlc1RvQ2xpZW50OiAnTG9va2luZyBmb3J3YXJkIHRvIHNlZWluZyB0aGUgbmV3IGNvbG9yJyxcclxuICAgICAgICBwcmVOb3Rlc1RvU2VsZjogJ0FzayBoaW0gYWJvdXQgaGlzIG5ldyBjb2xvcicsXHJcbiAgICAgICAgY2xpZW50OiB7XHJcbiAgICAgICAgICAgIGZpcnN0TmFtZTogJ0pvc2h1YScsXHJcbiAgICAgICAgICAgIGxhc3ROYW1lOiAnRGFuaWVsc29uJ1xyXG4gICAgICAgIH1cclxuICAgIH0pLFxyXG4gICAgbmV3IEFwcG9pbnRtZW50KHtcclxuICAgICAgICBpZDogMixcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxMywgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDEsIDEzLCA1MCwgMCksXHJcbiAgICAgICAgc3VtbWFyeTogJ01hc3NhZ2UgVGhlcmFwaXN0IEJvb2tpbmcnLFxyXG4gICAgICAgIC8vcHJpY2luZ1N1bW1hcnk6ICdBbm90aGVyIE1hc3NhZ2UgNTBtJyxcclxuICAgICAgICBzZXJ2aWNlczogW3Rlc3RTZXJ2aWNlc1swXV0sXHJcbiAgICAgICAgcHRvdGFsUHJpY2U6IDk1LjAsXHJcbiAgICAgICAgbG9jYXRpb246IGtvLnRvSlModGVzdExvY2F0aW9uc1sxXSksXHJcbiAgICAgICAgcHJlTm90ZXNUb0NsaWVudDogJ1NvbWV0aGluZyBlbHNlJyxcclxuICAgICAgICBwcmVOb3Rlc1RvU2VsZjogJ1JlbWVtYmVyIHRoYXQgdGhpbmcnLFxyXG4gICAgICAgIGNsaWVudDoge1xyXG4gICAgICAgICAgICBmaXJzdE5hbWU6ICdKb3NodWEnLFxyXG4gICAgICAgICAgICBsYXN0TmFtZTogJ0RhbmllbHNvbidcclxuICAgICAgICB9XHJcbiAgICB9KSxcclxuICAgIG5ldyBBcHBvaW50bWVudCh7XHJcbiAgICAgICAgaWQ6IDMsXHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMSwgMTYsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxOCwgMCwgMCksXHJcbiAgICAgICAgc3VtbWFyeTogJ01hc3NhZ2UgVGhlcmFwaXN0IEJvb2tpbmcnLFxyXG4gICAgICAgIC8vcHJpY2luZ1N1bW1hcnk6ICdUaXNzdWUgTWFzc2FnZSAxMjBtJyxcclxuICAgICAgICBzZXJ2aWNlczogW3Rlc3RTZXJ2aWNlc1sxXV0sXHJcbiAgICAgICAgcHRvdGFsUHJpY2U6IDk1LjAsXHJcbiAgICAgICAgbG9jYXRpb246IGtvLnRvSlModGVzdExvY2F0aW9uc1syXSksXHJcbiAgICAgICAgcHJlTm90ZXNUb0NsaWVudDogJycsXHJcbiAgICAgICAgcHJlTm90ZXNUb1NlbGY6ICdBc2sgaGltIGFib3V0IHRoZSBmb3Jnb3R0ZW4gbm90ZXMnLFxyXG4gICAgICAgIGNsaWVudDoge1xyXG4gICAgICAgICAgICBmaXJzdE5hbWU6ICdKb3NodWEnLFxyXG4gICAgICAgICAgICBsYXN0TmFtZTogJ0RhbmllbHNvbidcclxuICAgICAgICB9XHJcbiAgICB9KSxcclxuXTtcclxuXHJcbmV4cG9ydHMuYXBwb2ludG1lbnRzID0gdGVzdERhdGE7XHJcbiIsIi8qKiBDYWxlbmRhciBTbG90cyB0ZXN0IGRhdGEgKiovXHJcbnZhciBDYWxlbmRhclNsb3QgPSByZXF1aXJlKCcuLi9tb2RlbHMvQ2FsZW5kYXJTbG90Jyk7XHJcblxyXG52YXIgVGltZSA9IHJlcXVpcmUoJy4uL3V0aWxzL1RpbWUnKTtcclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxudmFyIHRvZGF5ID0gbmV3IERhdGUoKSxcclxuICAgIHRvbW9ycm93ID0gbmV3IERhdGUoKTtcclxudG9tb3Jyb3cuc2V0RGF0ZSh0b21vcnJvdy5nZXREYXRlKCkgKyAxKTtcclxuXHJcbnZhciBzdG9kYXkgPSBtb21lbnQodG9kYXkpLmZvcm1hdCgnWVlZWS1NTS1ERCcpLFxyXG4gICAgc3RvbW9ycm93ID0gbW9tZW50KHRvbW9ycm93KS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcclxuXHJcbnZhciB0ZXN0RGF0YTEgPSBbXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAwLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b2RheSwgMTIsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFjYWxlbmRhci9uZXcnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXN1Y2Nlc3MnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9kYXksIDEyLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b2RheSwgMTMsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdKb3NoIERhbmllbHNvbicsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBsaW5rOiAnIyFjYWxlbmRhci9hcHBvaW50bWVudC8zJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAxMywgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9kYXksIDE1LCAwLCAwKSxcclxuXHJcbiAgICAgICAgc3ViamVjdDogJ0RvIHRoYXQgaW1wb3J0YW50IHRoaW5nJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFjYWxlbmRhci9ldmVudC84JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tbmV3LXdpbmRvdycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAxNSwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9kYXksIDE2LCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnSWFnbyBMb3JlbnpvJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UgTG9uZyBOYW1lJyxcclxuICAgICAgICBsaW5rOiAnIyFjYWxlbmRhci9hcHBvaW50bWVudC81JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiAnJDE1OS45MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b2RheSwgMTYsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAwLCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnRnJlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyMhY2FsZW5kYXIvbmV3JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSlcclxuXTtcclxudmFyIHRlc3REYXRhMiA9IFtcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDAsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCA5LCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnRnJlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyMhY2FsZW5kYXIvbmV3JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCA5LCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTAsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdKYXJlbiBGcmVlbHknLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRGVlcCBUaXNzdWUgTWFzc2FnZSBMb25nIE5hbWUnLFxyXG4gICAgICAgIGxpbms6ICcjIWNhbGVuZGFyL2FwcG9pbnRtZW50LzEnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6ICckNTkuOTAnLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDEwLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTEsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFjYWxlbmRhci9uZXcnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXN1Y2Nlc3MnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDExLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTIsIDQ1LCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnQ09ORklSTS1TdXNhbiBEZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgbGluazogJyMhY2FsZW5kYXIvYXBwb2ludG1lbnQvMicsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogJyQ3MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctd2FybmluZydcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTIsIDQ1LCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTYsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFjYWxlbmRhci9uZXcnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXN1Y2Nlc3MnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDE2LCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTcsIDE1LCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnU3VzYW4gRGVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UnLFxyXG4gICAgICAgIGxpbms6ICcjIWNhbGVuZGFyL2FwcG9pbnRtZW50LzMnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDE3LCAxNSwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDE4LCAzMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0RlbnRpc3QgYXBwb2ludG1lbnQnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjIWNhbGVuZGFyL2V2ZW50LzQnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1uZXctd2luZG93JyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDE4LCAzMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDE5LCAzMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ1N1c2FuIERlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdEZWVwIFRpc3N1ZSBNYXNzYWdlIExvbmcgTmFtZScsXHJcbiAgICAgICAgbGluazogJyMhY2FsZW5kYXIvYXBwb2ludG1lbnQvNScsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogJyQxNTkuOTAnLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDE5LCAzMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDIzLCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnRnJlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyMhY2FsZW5kYXIvbmV3JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAyMywgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDAsIDAsIDApLFxyXG5cclxuICAgICAgICBzdWJqZWN0OiAnSmFyZW4gRnJlZWx5JyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UnLFxyXG4gICAgICAgIGxpbms6ICcjIWNhbGVuZGFyL2FwcG9pbnRtZW50LzYnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6ICckODAnLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KVxyXG5dO1xyXG52YXIgdGVzdERhdGFGcmVlID0gW1xyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMCwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDAsIDAsIDApLFxyXG5cclxuICAgICAgICBzdWJqZWN0OiAnRnJlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyMhY2FsZW5kYXIvbmV3JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSlcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IHtcclxuICAgICdkZWZhdWx0JzogdGVzdERhdGFGcmVlXHJcbn07XHJcbnRlc3REYXRhW3N0b2RheV0gPSB0ZXN0RGF0YTE7XHJcbnRlc3REYXRhW3N0b21vcnJvd10gPSB0ZXN0RGF0YTI7XHJcblxyXG5leHBvcnRzLmNhbGVuZGFyID0gdGVzdERhdGE7XHJcbiIsIi8qKiBDbGllbnRzIHRlc3QgZGF0YSAqKi9cclxudmFyIENsaWVudCA9IHJlcXVpcmUoJy4uL21vZGVscy9DbGllbnQnKTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IFtcclxuICAgIG5ldyBDbGllbnQgKHtcclxuICAgICAgICBmaXJzdE5hbWU6ICdKb3NodWEnLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRGFuaWVsc29uJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBmaXJzdE5hbWU6ICdJYWdvJyxcclxuICAgICAgICBsYXN0TmFtZTogJ0xvcmVuem8nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGZpcnN0TmFtZTogJ0Zlcm5hbmRvJyxcclxuICAgICAgICBsYXN0TmFtZTogJ0dhZ28nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FkYW0nLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRmluY2gnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FsYW4nLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRmVyZ3Vzb24nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FsZXgnLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnUGVuYSdcclxuICAgIH0pLFxyXG4gICAgbmV3IENsaWVudCh7XHJcbiAgICAgICAgZmlyc3ROYW1lOiAnQWxleGlzJyxcclxuICAgICAgICBsYXN0TmFtZTogJ1BlYWNhJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBmaXJzdE5hbWU6ICdBcnRodXInLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnTWlsbGVyJ1xyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMuY2xpZW50cyA9IHRlc3REYXRhO1xyXG4iLCIvKiogTG9jYXRpb25zIHRlc3QgZGF0YSAqKi9cclxudmFyIExvY2F0aW9uID0gcmVxdWlyZSgnLi4vbW9kZWxzL0xvY2F0aW9uJyk7XHJcblxyXG52YXIgdGVzdERhdGEgPSBbXHJcbiAgICBuZXcgTG9jYXRpb24gKHtcclxuICAgICAgICBsb2NhdGlvbklEOiAxLFxyXG4gICAgICAgIG5hbWU6ICdBY3R2aVNwYWNlJyxcclxuICAgICAgICBhZGRyZXNzTGluZTE6ICczMTUwIDE4dGggU3RyZWV0JyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwMSxcclxuICAgICAgICBpc1NlcnZpY2VSYWRpdXM6IHRydWUsXHJcbiAgICAgICAgc2VydmljZVJhZGl1czogMlxyXG4gICAgfSksXHJcbiAgICBuZXcgTG9jYXRpb24oe1xyXG4gICAgICAgIGxvY2F0aW9uSUQ6IDIsXHJcbiAgICAgICAgbmFtZTogJ0NvcmV5XFwncyBBcHQnLFxyXG4gICAgICAgIGFkZHJlc3NMaW5lMTogJzE4NyBCb2NhbmEgU3QuJyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwMlxyXG4gICAgfSksXHJcbiAgICBuZXcgTG9jYXRpb24oe1xyXG4gICAgICAgIGxvY2F0aW9uSUQ6IDMsXHJcbiAgICAgICAgbmFtZTogJ0pvc2hcXCdhIEFwdCcsXHJcbiAgICAgICAgYWRkcmVzc0xpbmUxOiAnNDI5IENvcmJldHQgQXZlJyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwM1xyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMubG9jYXRpb25zID0gdGVzdERhdGE7XHJcbiIsIi8qKiBJbmJveCB0ZXN0IGRhdGEgKiovXHJcbnZhciBNZXNzYWdlID0gcmVxdWlyZSgnLi4vbW9kZWxzL01lc3NhZ2UnKTtcclxuXHJcbnZhciBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG52YXIgdG9kYXkgPSBuZXcgRGF0ZSgpLFxyXG4gICAgeWVzdGVyZGF5ID0gbmV3IERhdGUoKSxcclxuICAgIGxhc3RXZWVrID0gbmV3IERhdGUoKSxcclxuICAgIG9sZERhdGUgPSBuZXcgRGF0ZSgpO1xyXG55ZXN0ZXJkYXkuc2V0RGF0ZSh5ZXN0ZXJkYXkuZ2V0RGF0ZSgpIC0gMSk7XHJcbmxhc3RXZWVrLnNldERhdGUobGFzdFdlZWsuZ2V0RGF0ZSgpIC0gMik7XHJcbm9sZERhdGUuc2V0RGF0ZShvbGREYXRlLmdldERhdGUoKSAtIDE2KTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IFtcclxuICAgIG5ldyBNZXNzYWdlKHtcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbmV3IFRpbWUodG9kYXksIDExLCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnQ09ORklSTS1TdXNhbiBEZWUnLFxyXG4gICAgICAgIGNvbnRlbnQ6ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBsaW5rOiAnI21lc3NhZ2VzL2luYm94LzEnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6ICckNzAnLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXdhcm5pbmcnXHJcbiAgICB9KSxcclxuICAgIG5ldyBNZXNzYWdlKHtcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbmV3IFRpbWUoeWVzdGVyZGF5LCAxMywgMCwgMCksXHJcblxyXG4gICAgICAgIHN1YmplY3Q6ICdEbyB5b3UgZG8gXCJFeG90aWMgTWFzc2FnZVwiPycsXHJcbiAgICAgICAgY29udGVudDogJ0hpLCBJIHdhbnRlZCB0byBrbm93IGlmIHlvdSBwZXJmb3JtIGFzIHBhciBvZiB5b3VyIHNlcnZpY2VzLi4uJyxcclxuICAgICAgICBsaW5rOiAnI21lc3NhZ2VzL2luYm94LzMnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1zaGFyZS1hbHQnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IE1lc3NhZ2Uoe1xyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBuZXcgVGltZShsYXN0V2VlaywgMTIsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdKb3NoIERhbmllbHNvbicsXHJcbiAgICAgICAgY29udGVudDogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UnLFxyXG4gICAgICAgIGxpbms6ICcjbWVzc2FnZXMvaW5ib3gvMicsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IE1lc3NhZ2Uoe1xyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBuZXcgVGltZShvbGREYXRlLCAxNSwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0lucXVpcnknLFxyXG4gICAgICAgIGNvbnRlbnQ6ICdBbm90aGVyIHF1ZXN0aW9uIGZyb20gYW5vdGhlciBjbGllbnQuJyxcclxuICAgICAgICBsaW5rOiAnI21lc3NhZ2VzL2luYm94LzQnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1zaGFyZS1hbHQnLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KVxyXG5dO1xyXG5cclxuZXhwb3J0cy5tZXNzYWdlcyA9IHRlc3REYXRhO1xyXG4iLCIvKiogU2VydmljZXMgdGVzdCBkYXRhICoqL1xyXG52YXIgU2VydmljZSA9IHJlcXVpcmUoJy4uL21vZGVscy9TZXJ2aWNlJyk7XHJcblxyXG52YXIgdGVzdERhdGEgPSBbXHJcbiAgICBuZXcgU2VydmljZSAoe1xyXG4gICAgICAgIG5hbWU6ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBwcmljZTogOTUsXHJcbiAgICAgICAgZHVyYXRpb246IDEyMFxyXG4gICAgfSksXHJcbiAgICBuZXcgU2VydmljZSh7XHJcbiAgICAgICAgbmFtZTogJ1Rpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBwcmljZTogNjAsXHJcbiAgICAgICAgZHVyYXRpb246IDYwXHJcbiAgICB9KSxcclxuICAgIG5ldyBTZXJ2aWNlKHtcclxuICAgICAgICBuYW1lOiAnU3BlY2lhbCBvaWxzJyxcclxuICAgICAgICBwcmljZTogOTUsXHJcbiAgICAgICAgaXNBZGRvbjogdHJ1ZVxyXG4gICAgfSksXHJcbiAgICBuZXcgU2VydmljZSh7XHJcbiAgICAgICAgbmFtZTogJ1NvbWUgc2VydmljZSBleHRyYScsXHJcbiAgICAgICAgcHJpY2U6IDQwLFxyXG4gICAgICAgIGR1cmF0aW9uOiAyMCxcclxuICAgICAgICBpc0FkZG9uOiB0cnVlXHJcbiAgICB9KVxyXG5dO1xyXG5cclxuZXhwb3J0cy5zZXJ2aWNlcyA9IHRlc3REYXRhO1xyXG4iLCIvKiogXHJcbiAgICB0aW1lU2xvdHNcclxuICAgIHRlc3RpbmcgZGF0YVxyXG4qKi9cclxuXHJcbnZhciBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xyXG5cclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxudmFyIHRvZGF5ID0gbmV3IERhdGUoKSxcclxuICAgIHRvbW9ycm93ID0gbmV3IERhdGUoKTtcclxudG9tb3Jyb3cuc2V0RGF0ZSh0b21vcnJvdy5nZXREYXRlKCkgKyAxKTtcclxuXHJcbnZhciBzdG9kYXkgPSBtb21lbnQodG9kYXkpLmZvcm1hdCgnWVlZWS1NTS1ERCcpLFxyXG4gICAgc3RvbW9ycm93ID0gbW9tZW50KHRvbW9ycm93KS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcclxuXHJcbnZhciB0ZXN0RGF0YTEgPSBbXHJcbiAgICBUaW1lKHRvZGF5LCA5LCAxNSksXHJcbiAgICBUaW1lKHRvZGF5LCAxMSwgMzApLFxyXG4gICAgVGltZSh0b2RheSwgMTIsIDApLFxyXG4gICAgVGltZSh0b2RheSwgMTIsIDMwKSxcclxuICAgIFRpbWUodG9kYXksIDE2LCAxNSksXHJcbiAgICBUaW1lKHRvZGF5LCAxOCwgMCksXHJcbiAgICBUaW1lKHRvZGF5LCAxOCwgMzApLFxyXG4gICAgVGltZSh0b2RheSwgMTksIDApLFxyXG4gICAgVGltZSh0b2RheSwgMTksIDMwKSxcclxuICAgIFRpbWUodG9kYXksIDIxLCAzMCksXHJcbiAgICBUaW1lKHRvZGF5LCAyMiwgMClcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YTIgPSBbXHJcbiAgICBUaW1lKHRvbW9ycm93LCA4LCAwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEwLCAzMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMSwgMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMSwgMzApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTIsIDApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTIsIDMwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEzLCAwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEzLCAzMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxNCwgNDUpLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTYsIDApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTYsIDMwKVxyXG5dO1xyXG5cclxudmFyIHRlc3REYXRhQnVzeSA9IFtcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IHtcclxuICAgICdkZWZhdWx0JzogdGVzdERhdGFCdXN5XHJcbn07XHJcbnRlc3REYXRhW3N0b2RheV0gPSB0ZXN0RGF0YTE7XHJcbnRlc3REYXRhW3N0b21vcnJvd10gPSB0ZXN0RGF0YTI7XHJcblxyXG5leHBvcnRzLnRpbWVTbG90cyA9IHRlc3REYXRhO1xyXG4iLCIvKipcclxuICAgIE5ldyBGdW5jdGlvbiBtZXRob2Q6ICdfZGVsYXllZCcuXHJcbiAgICBJdCByZXR1cm5zIGEgbmV3IGZ1bmN0aW9uLCB3cmFwcGluZyB0aGUgb3JpZ2luYWwgb25lLFxyXG4gICAgdGhhdCBvbmNlIGl0cyBjYWxsIHdpbGwgZGVsYXkgdGhlIGV4ZWN1dGlvbiB0aGUgZ2l2ZW4gbWlsbGlzZWNvbmRzLFxyXG4gICAgdXNpbmcgYSBzZXRUaW1lb3V0LlxyXG4gICAgVGhlIG5ldyBmdW5jdGlvbiByZXR1cm5zICd1bmRlZmluZWQnIHNpbmNlIGl0IGhhcyBub3QgdGhlIHJlc3VsdCxcclxuICAgIGJlY2F1c2Ugb2YgdGhhdCBpcyBvbmx5IHN1aXRhYmxlIHdpdGggcmV0dXJuLWZyZWUgZnVuY3Rpb25zIFxyXG4gICAgbGlrZSBldmVudCBoYW5kbGVycy5cclxuICAgIFxyXG4gICAgV2h5OiBzb21ldGltZXMsIHRoZSBoYW5kbGVyIGZvciBhbiBldmVudCBuZWVkcyB0byBiZSBleGVjdXRlZFxyXG4gICAgYWZ0ZXIgYSBkZWxheSBpbnN0ZWFkIG9mIGluc3RhbnRseS5cclxuKiovXHJcbkZ1bmN0aW9uLnByb3RvdHlwZS5fZGVsYXllZCA9IGZ1bmN0aW9uIGRlbGF5ZWQobWlsbGlzZWNvbmRzKSB7XHJcbiAgICB2YXIgZm4gPSB0aGlzO1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBjb250ZXh0ID0gdGhpcyxcclxuICAgICAgICAgICAgYXJncyA9IGFyZ3VtZW50cztcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZm4uYXBwbHkoY29udGV4dCwgYXJncyk7XHJcbiAgICAgICAgfSwgbWlsbGlzZWNvbmRzKTtcclxuICAgIH07XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgRXh0ZW5kaW5nIHRoZSBGdW5jdGlvbiBjbGFzcyB3aXRoIGFuIGluaGVyaXRzIG1ldGhvZC5cclxuICAgIFxyXG4gICAgVGhlIGluaXRpYWwgbG93IGRhc2ggaXMgdG8gbWFyayBpdCBhcyBuby1zdGFuZGFyZC5cclxuKiovXHJcbkZ1bmN0aW9uLnByb3RvdHlwZS5faW5oZXJpdHMgPSBmdW5jdGlvbiBfaW5oZXJpdHMoc3VwZXJDdG9yKSB7XHJcbiAgICB0aGlzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yOiB7XHJcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLFxyXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXHJcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKipcclxuICAgIFJFU1QgQVBJIGFjY2Vzc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZnVuY3Rpb24gUmVzdChvcHRpb25zT3JVcmwpIHtcclxuICAgIFxyXG4gICAgdmFyIHVybCA9IHR5cGVvZihvcHRpb25zT3JVcmwpID09PSAnc3RyaW5nJyA/XHJcbiAgICAgICAgb3B0aW9uc09yVXJsIDpcclxuICAgICAgICBvcHRpb25zT3JVcmwgJiYgb3B0aW9uc09yVXJsLnVybDtcclxuXHJcbiAgICB0aGlzLmJhc2VVcmwgPSB1cmw7XHJcbiAgICAvLyBPcHRpb25hbCBleHRyYUhlYWRlcnMgZm9yIGFsbCByZXF1ZXN0cyxcclxuICAgIC8vIHVzdWFsbHkgZm9yIGF1dGhlbnRpY2F0aW9uIHRva2Vuc1xyXG4gICAgdGhpcy5leHRyYUhlYWRlcnMgPSBudWxsO1xyXG59XHJcblxyXG5SZXN0LnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiBnZXQoYXBpVXJsLCBkYXRhKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KGFwaVVybCwgJ2dldCcsIGRhdGEpO1xyXG59O1xyXG5cclxuUmVzdC5wcm90b3R5cGUucHV0ID0gZnVuY3Rpb24gZ2V0KGFwaVVybCwgZGF0YSkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChhcGlVcmwsICdwdXQnLCBkYXRhKTtcclxufTtcclxuXHJcblJlc3QucHJvdG90eXBlLnBvc3QgPSBmdW5jdGlvbiBnZXQoYXBpVXJsLCBkYXRhKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KGFwaVVybCwgJ3Bvc3QnLCBkYXRhKTtcclxufTtcclxuXHJcblJlc3QucHJvdG90eXBlLmRlbGV0ZSA9IGZ1bmN0aW9uIGdldChhcGlVcmwsIGRhdGEpIHtcclxuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoYXBpVXJsLCAnZGVsZXRlJywgZGF0YSk7XHJcbn07XHJcblxyXG5SZXN0LnByb3RvdHlwZS5wdXRGaWxlID0gZnVuY3Rpb24gcHV0RmlsZShhcGlVcmwsIGRhdGEpIHtcclxuICAgIC8vIE5PVEUgYmFzaWMgcHV0RmlsZSBpbXBsZW1lbnRhdGlvbiwgb25lIGZpbGUsIHVzZSBmaWxlVXBsb2FkP1xyXG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChhcGlVcmwsICdkZWxldGUnLCBkYXRhLCAnbXVsdGlwYXJ0L2Zvcm0tZGF0YScpO1xyXG59O1xyXG5cclxuUmVzdC5wcm90b3R5cGUucmVxdWVzdCA9IGZ1bmN0aW9uIHJlcXVlc3QoYXBpVXJsLCBodHRwTWV0aG9kLCBkYXRhLCBjb250ZW50VHlwZSkge1xyXG4gICAgXHJcbiAgICB2YXIgdGhpc1Jlc3QgPSB0aGlzO1xyXG4gICAgXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCQuYWpheCh7XHJcbiAgICAgICAgdXJsOiB0aGlzLmJhc2VVcmwgKyBhcGlVcmwsXHJcbiAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuICAgICAgICBtZXRob2Q6IGh0dHBNZXRob2QsXHJcbiAgICAgICAgaGVhZGVyczogdGhpcy5leHRyYUhlYWRlcnMsXHJcbiAgICAgICAgLy8gVVJMRU5DT0RFRCBpbnB1dDpcclxuICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiBjb250ZW50VHlwZSB8fCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ1xyXG4gICAgICAgIC8vIEFsdGVybmF0ZTogSlNPTiBhcyBpbnB1dFxyXG4gICAgICAgIC8vZGF0YTogSlNPTi5zdHJpbmdpZnkoZGF0YSksXHJcbiAgICAgICAgLy9jb250ZW50VHlwZTogY29udGVudFR5cGUgfHwgJ2FwcGxpY2F0aW9uL2pzb24nXHJcbiAgICB9KSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgLy8gT24gYXV0aG9yaXphdGlvbiBlcnJvciwgZ2l2ZSBvcG9ydHVuaXR5IHRvIHJldHJ5IHRoZSBvcGVyYXRpb25cclxuICAgICAgICBpZiAoZXJyLnN0YXR1cyA9PT0gNDAxKSB7XHJcbiAgICAgICAgICAgIHZhciByZXRyeSA9IHJlcXVlc3QuYmluZCh0aGlzLCBhcGlVcmwsIGh0dHBNZXRob2QsIGRhdGEsIGNvbnRlbnRUeXBlKTtcclxuICAgICAgICAgICAgdmFyIHJldHJ5UHJvbWlzZSA9IHRoaXNSZXN0Lm9uQXV0aG9yaXphdGlvblJlcXVpcmVkKHJldHJ5KTtcclxuICAgICAgICAgICAgaWYgKHJldHJ5UHJvbWlzZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSXQgcmV0dXJuZWQgc29tZXRoaW5nLCBleHBlY3RpbmcgaXMgYSBwcm9taXNlOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXRyeVByb21pc2UpXHJcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgICAgICAvLyBUaGVyZSBpcyBlcnJvciBvbiByZXRyeSwganVzdCByZXR1cm4gdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gb3JpZ2luYWwgY2FsbCBlcnJvclxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnI7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBieSBkZWZhdWx0LCBjb250aW51ZSBwcm9wYWdhdGluZyB0aGUgZXJyb3JcclxuICAgICAgICByZXR1cm4gZXJyO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG5SZXN0LnByb3RvdHlwZS5vbkF1dGhvcml6YXRpb25SZXF1aXJlZCA9IGZ1bmN0aW9uIG9uQXV0aG9yaXphdGlvblJlcXVpcmVkKHJldHJ5KSB7XHJcbiAgICAvLyBUbyBiZSBpbXBsZW1lbnRlZCBvdXRzaWRlLCBieSBkZWZhdWx0IGRvbid0IHdhaXRcclxuICAgIC8vIGZvciByZXRyeSwganVzdCByZXR1cm4gbm90aGluZzpcclxuICAgIHJldHVybjtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVzdDtcclxuIiwiLyoqXHJcbiAgICBUaGUgU2hlbGwgdGhhdCBtYW5hZ2VzIGFjdGl2aXRpZXMuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBlc2NhcGVSZWdFeHAgPSByZXF1aXJlKCcuL2VzY2FwZVJlZ0V4cCcpLFxyXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKSxcclxuICAgIGdldFVybFF1ZXJ5ID0gcmVxdWlyZSgnLi4vdXRpbHMvZ2V0VXJsUXVlcnknKTtcclxuXHJcbnZhciBzaGVsbCA9IHtcclxuXHJcbiAgICBjdXJyZW50WkluZGV4OiAxLFxyXG4gICAgXHJcbiAgICBoaXN0b3J5OiBbXSxcclxuICAgIFxyXG4gICAgYmFzZVVybDogJycsXHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEEgZnVuY3Rpb24gdG8gZGVjaWRlIGlmIHRoZVxyXG4gICAgICAgIGFjY2VzcyBpcyBhbGxvd2VkIChyZXR1cm4gdHJ1ZSlcclxuICAgICAgICBvciBub3QgKHJldHVybiBmYWxzZSlcclxuICAgICoqL1xyXG4gICAgYWNjZXNzQ29udHJvbDogZnVuY3Rpb24oYWN0aXZpdHkpIHtcclxuICAgICAgICAvLyBhbGxvdyBhY2Nlc3MgYnkgZGVmYXVsdFxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgbm9uQWNjZXNzQWN0aXZpdHk6ICdpbmRleCcsXHJcbiAgICBcclxuICAgIGFjdGl2aXRpZXM6IHt9LFxyXG4gICAgXHJcbiAgICBuYXZBY3Rpb246IGtvLm9ic2VydmFibGUobnVsbCksXHJcbiAgICBcclxuICAgIHN0YXR1czoga28ub2JzZXJ2YWJsZSgnb3V0JyksIC8vICdvdXQnLCAnbG9naW4nLCAnb25ib2FyZGluZycsICdpbidcclxuICAgIFxyXG4gICAgZGVmYXVsdE5hdkFjdGlvbjogbnVsbCxcclxuXHJcbiAgICBzcGVjaWFsUm91dGVzOiB7XHJcbiAgICAgICAgJ2dvLWJhY2snOiBmdW5jdGlvbiAocm91dGUpIHtcclxuICAgICAgICAgICAgLy8gZ28gYmFjayBpbiBoaXN0b3J5LCBhbG1vc3Qgb25lXHJcbiAgICAgICAgICAgIHRoaXMuZ29CYWNrKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBnbyBiYWNrIHggdGltZXM6XHJcbiAgICAgICAgICAgIHZhciBudW0gPSBwYXJzZUludChyb3V0ZS5zZWdtZW50c1swXSwgMTApO1xyXG4gICAgICAgICAgICBpZiAobnVtID4gMCkge1xyXG4gICAgICAgICAgICAgICAgd2hpbGUobnVtLS0+MSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ29CYWNrKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHVuZXhwZWN0ZWRFcnJvcjogZnVuY3Rpb24gdW5leHBlY3RlZEVycm9yKGVycm9yKSB7XHJcbiAgICAgICAgLy8gVE9ETzogZW5oYW5jZSB3aXRoIGRpYWxvZ1xyXG4gICAgICAgIHZhciBzdHIgPSB0eXBlb2YoZXJyb3IpID09PSAnc3RyaW5nJyA/IGVycm9yIDogSlNPTi5zdHJpbmdpZnkoZXJyb3IpO1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1VuZXhwZWN0ZWQgZXJyb3InLCBlcnJvcik7XHJcbiAgICAgICAgd2luZG93LmFsZXJ0KHN0cik7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICB1cGRhdGVBcHBOYXY6IGZ1bmN0aW9uIHVwZGF0ZUFwcE5hdihhY3Rpdml0eSkge1xyXG4gICAgICAgIC8vIG5hdkFjdGlvbiwgaWYgdGhlIGFjdGl2aXR5IGhhcyBpdHMgb3duXHJcbiAgICAgICAgaWYgKCduYXZBY3Rpb24nIGluIGFjdGl2aXR5KSB7XHJcbiAgICAgICAgICAgIC8vIFVzZSBzcGVjaWFsaXppZWQgYWN0aXZpdHkgYWN0aW9uXHJcbiAgICAgICAgICAgIHRoaXMubmF2QWN0aW9uKGFjdGl2aXR5Lm5hdkFjdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBVc2UgZGVmYXVsdCBhY3Rpb25cclxuICAgICAgICAgICAgdGhpcy5uYXZBY3Rpb24odGhpcy5kZWZhdWx0TmF2QWN0aW9uKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWRBY3Rpdml0eTogZnVuY3Rpb24gbG9hZEFjdGl2aXR5KGFjdGl2aXR5TmFtZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgdmFyICRhY3QgPSB0aGlzLmZpbmRBY3Rpdml0eUVsZW1lbnQoYWN0aXZpdHlOYW1lKTtcclxuICAgICAgICAgICAgaWYgKCRhY3QubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCRhY3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgICAgICAgICB1cmw6IHRoaXMuYmFzZVVybCArIGFjdGl2aXR5TmFtZSArICcuaHRtbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGFyZSBsb2FkaW5nIHRoZSBwcm9ncmFtLCBzbyBhbnkgaW4gYmV0d2VlbiBpbnRlcmFjdGlvblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHdpbGwgYmUgcHJvYmxlbWF0aWMuXHJcbiAgICAgICAgICAgICAgICAgICAgYXN5bmM6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKGh0bWwpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xMjg0ODc5OFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBib2R5ID0gJzxkaXYgaWQ9XCJib2R5LW1vY2tcIj4nICsgaHRtbC5yZXBsYWNlKC9eW1xcc1xcU10qPGJvZHkuKj8+fDxcXC9ib2R5PltcXHNcXFNdKiQvZywgJycpICsgJzwvZGl2Pic7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyICRoID0gJCgkLnBhcnNlSFRNTChib2R5KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy92YXIgJGggPSAkKCQucGFyc2VIVE1MKGh0bWwpKTtcclxuICAgICAgICAgICAgICAgICAgICAkYWN0ID0gdGhpcy5maW5kQWN0aXZpdHlFbGVtZW50KGFjdGl2aXR5TmFtZSwgJGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgkYWN0Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCdib2R5JykuYXBwZW5kKCRhY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCRhY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KEVycm9yKCdBY3Rpdml0eSBub3QgZm91bmQgaW4gdGhlIHNvdXJjZSBmaWxlLicpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB9LmJpbmQodGhpcyksIHJlamVjdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZmluZEFjdGl2aXR5RWxlbWVudDogZnVuY3Rpb24gZmluZEFjdGl2aXR5RWxlbWVudChhY3Rpdml0eU5hbWUsICRyb290KSB7XHJcbiAgICAgICAgJHJvb3QgPSAkcm9vdCB8fCAkKGRvY3VtZW50KTtcclxuICAgICAgICAvLyBUT0RPOiBzZWN1cmUgbmFtZSBwYXJzaW5nIGZvciBjc3Mgc2VsZWN0b3JcclxuICAgICAgICByZXR1cm4gJHJvb3QuZmluZCgnW2RhdGEtYWN0aXZpdHk9XCInICsgYWN0aXZpdHlOYW1lICsgJ1wiXScpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgc2hvd0FjdGl2aXR5OiBmdW5jdGlvbiBzaG93QWN0aXZpdHkoYWN0aXZpdHlOYW1lLCBvcHRpb25zKSB7XHJcbiAgICAgICAgLy8gRW5zdXJlIGl0cyBsb2FkZWQsIGFuZCBkbyBhbnl0aGluZyBsYXRlclxyXG4gICAgICAgIHJldHVybiB0aGlzLmxvYWRBY3Rpdml0eShhY3Rpdml0eU5hbWUpLnRoZW4oZnVuY3Rpb24oJGFjdGl2aXR5KSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAkYWN0aXZpdHkuY3NzKCd6SW5kZXgnLCArK3RoaXMuY3VycmVudFpJbmRleCkuc2hvdygpO1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudEFjdGl2aXR5ID0gdGhpcy5oaXN0b3J5W3RoaXMuaGlzdG9yeS5sZW5ndGggLSAxXTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChjdXJyZW50QWN0aXZpdHkpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnVuZm9jdXMoY3VycmVudEFjdGl2aXR5LiRhY3Rpdml0eSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBGVVRVUkU6IEhpc3RvcnlBUEkucHVzaFN0YXRlKC4uKVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5oaXN0b3J5LnB1c2goe1xyXG4gICAgICAgICAgICAgICAgbmFtZTogYWN0aXZpdHlOYW1lLFxyXG4gICAgICAgICAgICAgICAgJGFjdGl2aXR5OiAkYWN0aXZpdHksXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBvcHRpb25zXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIGFjdCA9IHRoaXMuYWN0aXZpdGllc1thY3Rpdml0eU5hbWVdLmluaXQoJGFjdGl2aXR5LCB0aGlzKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuYWNjZXNzQ29udHJvbChhY3QpKSB7XHJcbiAgICAgICAgICAgICAgICBhY3Quc2hvdyhvcHRpb25zKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUFwcE5hdihhY3QpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEF2b2lkIGdvaW5nIHRvIHRoZSBzYW1lIGFjdGl2aXR5XHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudEFjdGl2aXR5ICYmXHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEFjdGl2aXR5Lm5hbWUgIT09IGFjdGl2aXR5TmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGlkZUFjdGl2aXR5KGN1cnJlbnRBY3Rpdml0eS5uYW1lKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIHJlZGlyZWN0XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdvKHRoaXMubm9uQWNjZXNzQWN0aXZpdHkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0uYmluZCh0aGlzKSkuY2F0Y2godGhpcy51bmV4cGVjdGVkRXJyb3IpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgcG9wQWN0aXZpdHk6IGZ1bmN0aW9uIHBvcEFjdGl2aXR5KGFjdGl2aXR5TmFtZSwgb3B0aW9ucykge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0FjdGl2aXR5KGFjdGl2aXR5TmFtZSwgb3B0aW9ucylcclxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBQb3BpbmcgYW4gYWN0aXZpdHkgb24gdG9wIG9mIGFub3RoZXIgbWVhbnMgd2Ugd2FudFxyXG4gICAgICAgICAgICAgICAgLy8gdG8gcXVpY2sgZ28gYmFjayByYXRoZXIgdGhhbiB0aGUgYWN0aXZpdHkgZGVmYXVsdCBuYXZBY3Rpb246XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5hdkFjdGlvbihOYXZBY3Rpb24uZ29CYWNrKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKVxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhpZGVBY3Rpdml0eTogZnVuY3Rpb24gaGlkZUFjdGl2aXR5KGFjdGl2aXR5TmFtZSkge1xyXG5cclxuICAgICAgICB2YXIgJGFjdGl2aXR5ID0gdGhpcy5maW5kQWN0aXZpdHlFbGVtZW50KGFjdGl2aXR5TmFtZSk7XHJcbiAgICAgICAgJGFjdGl2aXR5LmhpZGUoKTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIGdvQmFjazogZnVuY3Rpb24gZ29CYWNrKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gYSBwcmV2aW91cyBhY3Rpdml0eSB0byBuYXZpZ2F0ZSB0byxcclxuICAgICAgICAvLyBnbyB0byB0aGUgaW5kZXhcclxuICAgICAgICBpZiAodGhpcy5oaXN0b3J5Lmxlbmd0aCA8IDEpIHtcclxuICAgICAgICAgICAgdGhpcy5zaG93QWN0aXZpdHkoJ2luZGV4Jywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVE9ETzogZGVkdXBsaWNhdGUgY29kZSBiZXR3ZWVuIHRoaXMgYW5kIHNob3dBY3Rpdml0eVxyXG4gICAgICAgIHZhciBjdXJyZW50QWN0aXZpdHkgPSB0aGlzLmhpc3RvcnkucG9wKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHByZXZpb3VzQWN0aXZpdHkgPSB0aGlzLmhpc3RvcnlbdGhpcy5oaXN0b3J5Lmxlbmd0aCAtIDFdO1xyXG4gICAgICAgIHZhciBhY3Rpdml0eU5hbWUgPSBwcmV2aW91c0FjdGl2aXR5Lm5hbWU7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50WkluZGV4LS07XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIGV4cGxpY2l0IG9wdGlvbnMsIHVzZSB0aGUgY3VycmVudEFjdGl2aXR5IG9wdGlvbnNcclxuICAgICAgICAvLyB0byBlbmFibGUgdGhlIGNvbW11bmljYXRpb24gYmV0d2VlbiBhY3Rpdml0aWVzOlxyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IGN1cnJlbnRBY3Rpdml0eS5vcHRpb25zO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChjdXJyZW50QWN0aXZpdHkpXHJcbiAgICAgICAgICAgIHRoaXMudW5mb2N1cyhjdXJyZW50QWN0aXZpdHkuJGFjdGl2aXR5KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBFbnN1cmUgaXRzIGxvYWRlZCwgYW5kIGRvIGFueXRoaW5nIGxhdGVyXHJcbiAgICAgICAgdGhpcy5sb2FkQWN0aXZpdHkoYWN0aXZpdHlOYW1lKS50aGVuKGZ1bmN0aW9uKCRhY3Rpdml0eSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgJGFjdGl2aXR5LnNob3coKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIEZVVFVSRTogR29pbmcgdG8gdGhlIHByZXZpb3VzIGFjdGl2aXR5IHdpdGggSGlzdG9yeUFQSVxyXG4gICAgICAgICAgICAvLyBtdXN0IHJlcGxhY2VTdGF0ZSB3aXRoIG5ldyAnb3B0aW9ucyc/XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgYWN0ID0gdGhpcy5hY3Rpdml0aWVzW2FjdGl2aXR5TmFtZV0uaW5pdCgkYWN0aXZpdHksIHRoaXMpO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5hY2Nlc3NDb250cm9sKGFjdCkpIHtcclxuICAgICAgICAgICAgICAgIGFjdC5zaG93KG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQXBwTmF2KGFjdCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQXZvaWQgZ29pbmcgdG8gdGhlIHNhbWUgYWN0aXZpdHlcclxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50QWN0aXZpdHkgJiZcclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50QWN0aXZpdHkubmFtZSAhPT0gYWN0aXZpdHlOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWRlQWN0aXZpdHkoY3VycmVudEFjdGl2aXR5Lm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gcmVkaXJlY3RcclxuICAgICAgICAgICAgICAgIHRoaXMuZ28odGhpcy5ub25BY2Nlc3NBY3Rpdml0eSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKS5jYXRjaCh0aGlzLnVuZXhwZWN0ZWRFcnJvcik7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICB1bmZvY3VzOiBmdW5jdGlvbiB1bmZvY3VzKCRlbCkge1xyXG4gICAgICAgIC8vIGJsdXIgYW55IGZvY3VzZWQgdGV4dCBib3ggdG8gZm9yY2UgdG8gY2xvc2UgdGhlIG9uLXNjcmVlbiBrZXlib2FyZCxcclxuICAgICAgICAvLyBvciBhbnkgb3RoZXIgdW53YW50ZWQgaW50ZXJhY3Rpb24gKG5vcm1hbGx5IHVzZWQgd2hlbiBjbG9zaW5nXHJcbiAgICAgICAgLy8gYW4gYWN0aXZpdHksIGhpZGluZyBhbiBlbGVtZW50LCBzbyBpdCBtdXN0IG5vdCBiZSBmb2N1c2VkKS5cclxuICAgICAgICBpZiAoJGVsICYmICRlbC5maW5kKVxyXG4gICAgICAgICAgICAkZWwuZmluZCgnOmZvY3VzJykuYmx1cigpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgcGFyc2VBY3Rpdml0eUxpbms6IGZ1bmN0aW9uIGdldEFjdGl2aXR5RnJvbUxpbmsobGluaykge1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxpbmsgPSBsaW5rIHx8ICcnO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIGhhc2hiYW5nIHN1cHBvcnQ6IHJlbW92ZSB0aGUgIyEgYW5kIHVzZSB0aGUgcmVzdCBhcyB0aGUgbGlua1xyXG4gICAgICAgIGxpbmsgPSBsaW5rLnJlcGxhY2UoL14jIS8sICcnKTtcclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlIHRoZSBiYXNlVXJsIHRvIGdldCB0aGUgYXBwIGJhc2UuXHJcbiAgICAgICAgdmFyIHBhdGggPSBsaW5rLnJlcGxhY2UobmV3IFJlZ0V4cCgnXicgKyBlc2NhcGVSZWdFeHAodGhpcy5iYXNlVXJsKSwgJ2knKSwgJycpO1xyXG4gICAgICAgIC8vdmFyIGFjdGl2aXR5TmFtZSA9IHBhdGguc3BsaXQoJy8nKVsxXSB8fCAnJztcclxuICAgICAgICAvLyBHZXQgZmlyc3Qgc2VnbWVudCBvciBwYWdlIG5hbWUgKGFueXRoaW5nIHVudGlsIGEgc2xhc2ggb3IgZXh0ZW5zaW9uIGJlZ2dpbmluZylcclxuICAgICAgICB2YXIgbWF0Y2ggPSAvXlxcLz8oW15cXC9cXC5dKylbXlxcL10qKFxcLy4qKSokLy5leGVjKHBhdGgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBwYXJzZWQgPSB7XHJcbiAgICAgICAgICAgIHJvb3Q6IHRydWUsXHJcbiAgICAgICAgICAgIGFjdGl2aXR5OiBudWxsLFxyXG4gICAgICAgICAgICBzZWdtZW50czogbnVsbCxcclxuICAgICAgICAgICAgcGF0aDogbnVsbCxcclxuICAgICAgICAgICAgbGluazogbGluayxcclxuICAgICAgICAgICAgLy8gVVJMIFF1ZXJ5IGFzIGFuIG9iamVjdCwgZW1wdHkgb2JqZWN0IGlmIG5vIHF1ZXJ5XHJcbiAgICAgICAgICAgIHF1ZXJ5OiBnZXRVcmxRdWVyeShsaW5rIHx8ICc/JylcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICBwYXJzZWQucm9vdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiAobWF0Y2hbMV0pIHtcclxuICAgICAgICAgICAgICAgIHBhcnNlZC5hY3Rpdml0eSA9IG1hdGNoWzFdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChtYXRjaFsyXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlZC5wYXRoID0gbWF0Y2hbMl07XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VkLnNlZ21lbnRzID0gbWF0Y2hbMl0ucmVwbGFjZSgvXlxcLy8sICcnKS5zcGxpdCgnLycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VkLnBhdGggPSAnLyc7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VkLnNlZ21lbnRzID0gW107XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwYXJzZWQ7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICAvKiogUm91dGUgYSBsaW5rIHRocm91Z2h0IGFjdGl2aXRpZXMuXHJcbiAgICAgICAgUmV0dXJucyB0cnVlIGlmIHdhcyByb3V0ZWQgYW5kIGZhbHNlIGlmIG5vdFxyXG4gICAgKiovXHJcbiAgICByb3V0ZTogZnVuY3Rpb24gcm91dGUobGluaywgbW9kZSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBwYXJzZWRMaW5rID0gdGhpcy5wYXJzZUFjdGl2aXR5TGluayhsaW5rKTtcclxuICAgICAgICB2YXIgbW9kZU1ldGhvZCA9IG1vZGUgJiYgbW9kZSA9PT0gJ3BvcCcgPyAncG9wQWN0aXZpdHknIDogJ3Nob3dBY3Rpdml0eSc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSW5pdGlhbGx5LCBub3QgZm91bmQ6XHJcbiAgICAgICAgcGFyc2VkTGluay5mb3VuZCA9IGZhbHNlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIENoZWNrIGlmIGlzIG5vdCByb290XHJcbiAgICAgICAgaWYgKHBhcnNlZExpbmsuYWN0aXZpdHkpIHtcclxuICAgICAgICAgICAgLy8gIGFuZCB0aGUgYWN0aXZpdHkgaXMgcmVnaXN0ZXJlZFxyXG4gICAgICAgICAgICBpZiAodGhpcy5hY3Rpdml0aWVzLmhhc093blByb3BlcnR5KHBhcnNlZExpbmsuYWN0aXZpdHkpKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gU2hvdyB0aGUgYWN0aXZpdHkgcGFzc2luZyB0aGUgcm91dGUgb3B0aW9uc1xyXG4gICAgICAgICAgICAgICAgdGhpc1ttb2RlTWV0aG9kXShwYXJzZWRMaW5rLmFjdGl2aXR5LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgcm91dGU6IHBhcnNlZExpbmtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHBhcnNlZExpbmsuZm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vICBvciBpcyBhIHNwZWNpYWwgcm91dGVcclxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5zcGVjaWFsUm91dGVzLmhhc093blByb3BlcnR5KHBhcnNlZExpbmsuYWN0aXZpdHkpKSB7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHRoaXMuc3BlY2lhbFJvdXRlc1twYXJzZWRMaW5rLmFjdGl2aXR5XS5jYWxsKHRoaXMsIHBhcnNlZExpbmspO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBwYXJzZWRMaW5rLmZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChwYXJzZWRMaW5rLnJvb3QpIHtcclxuICAgICAgICAgICAgLy8gUm9vdCBwYWdlICdpbmRleCdcclxuICAgICAgICAgICAgdGhpc1ttb2RlTWV0aG9kXSgnaW5kZXgnLCB7XHJcbiAgICAgICAgICAgICAgICByb3V0ZTogcGFyc2VkTGlua1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHBhcnNlZExpbms7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICAvKiBDb252ZW5pZW50IHdheSB0byBuYXZpZ2F0ZSB0byBhbiBpbnRlcm5hbCBsaW5rLFxyXG4gICAgICAgIHVwZGF0aW5nIGxvY2F0aW9uIGFuZCByb3V0aW5nLlxyXG4gICAgICAgIE5PVEU6IHJpZ2h0IG5vdyBpcyBqdXN0IGEgbG9jYXRpb24uaGFzaCBjaGFuZ2UsIHdpdGggdGhlXHJcbiAgICAgICAgaGFuZGxlciBvbiBpbml0IGxpc3RlbmluZyBwcm9wZXJseSAqL1xyXG4gICAgZ286IGZ1bmN0aW9uIGdvKGxpbmspIHtcclxuICAgICAgICB2YXIgbCA9IC8jIS8udGVzdChsaW5rKSA/IGxpbmsgOiAnIyEnICsgbGluaztcclxuICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9IGw7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICB1cGRhdGVNZW51OiBmdW5jdGlvbiB1cGRhdGVNZW51KG5hbWUpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgJG1lbnUgPSB0aGlzLiRtZW51O1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFJlbW92ZSBhbnkgYWN0aXZlXHJcbiAgICAgICAgJG1lbnVcclxuICAgICAgICAuZmluZCgnbGknKVxyXG4gICAgICAgIC5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgLy8gQWRkIGFjdGl2ZVxyXG4gICAgICAgICRtZW51XHJcbiAgICAgICAgLmZpbmQoJy5nby0nICsgbmFtZSlcclxuICAgICAgICAuY2xvc2VzdCgnbGknKVxyXG4gICAgICAgIC5hZGRDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgLy8gSGlkZSBtZW51XHJcbiAgICAgICAgJG1lbnVcclxuICAgICAgICAuZmlsdGVyKCc6dmlzaWJsZScpXHJcbiAgICAgICAgLmNvbGxhcHNlKCdoaWRlJyk7XHJcbiAgICB9LFxyXG5cclxuICAgIGluaXQ6IGZ1bmN0aW9uIGluaXQoKSB7XHJcblxyXG4gICAgICAgIC8vIE1lbnVcclxuICAgICAgICB0aGlzLiRtZW51ID0gJCgnI25hdmJhcicpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFZpc3VhbGl6ZSB0aGUgYWN0aXZpdHkgdGhhdCBtYXRjaGVzIGN1cnJlbnQgVVJMXHJcbiAgICAgICAgLy8gTk9URTogdXNpbmcgdGhlIGhhc2ggZm9yIGhpc3RvcnkgbWFuYWdlbWVudCwgcmF0aGVyXHJcbiAgICAgICAgLy8gdGhhbiBkb2N1bWVudC5sb2NhdGlvbi5wYXRobmFtZVxyXG4gICAgICAgIHZhciBjdXJyZW50Um91dGUgPSB0aGlzLnJvdXRlKGRvY3VtZW50LmxvY2F0aW9uLmhhc2gpO1xyXG4gICAgICAgIGlmIChjdXJyZW50Um91dGUuZm91bmQpXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTWVudShjdXJyZW50Um91dGUuYWN0aXZpdHkpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIEZsYWcgdG8gbWFyayBwcm9jZXNzaW5nIHRvIGF2b2lkIGRvdWJsZSBleGVjdXRpb25cclxuICAgICAgICAvLyBiZWNhdXNlIG9mIGhhc2hjaGFuZ2UtZXZlbnQsIG1hbnVhbCByb3V0ZWQgbGlua3NcclxuICAgICAgICAvLyBwcm9ncmFtYXRpYyBjaGFuZ2Ugd2l0aCByb3V0ZSB0byBsb2NhdGlvblxyXG4gICAgICAgIHZhciBsYXRlc3RQcm9jZXNzZWRMaW5rID0gbnVsbDtcclxuXHJcbiAgICAgICAgdmFyIHJvdXRlTGluayA9IGZ1bmN0aW9uIHJvdXRlTGluayhsaW5rLCBlLCBtb2RlKSB7XHJcbiAgICAgICAgICAgIC8vIEl0cyBwcm9jZXNzZWQgYWxyZWFkeSwgZG8gbm90aGluZ1xyXG4gICAgICAgICAgICBpZiAobGluayA9PT0gbGF0ZXN0UHJvY2Vzc2VkTGluaykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxhdGVzdFByb2Nlc3NlZExpbmsgPSBsaW5rO1xyXG5cclxuICAgICAgICAgICAgLy8gUm91dGUgaXRcclxuICAgICAgICAgICAgdmFyIHBhcnNlZExpbmsgPSB0aGlzLnJvdXRlKGxpbmssIG1vZGUpO1xyXG4gICAgICAgICAgICBpZiAocGFyc2VkTGluay5mb3VuZCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTWVudShwYXJzZWRMaW5rLmFjdGl2aXR5KTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKCEvIyEvLnRlc3QobGluaykpIHtcclxuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChwYXJzZWRMaW5rLnJvb3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBOT1RFOiB1c2luZyB0aGUgaGFzaCBmb3IgaGlzdG9yeSBtYW5hZ2VtZW50LCBnb2luZyB0byByb290XHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSAnJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBSb3V0ZSBwcmVzc2VkIGxpbmtzXHJcbiAgICAgICAgJChkb2N1bWVudCkub24oJ3RhcCcsICdhLCBbZGF0YS1ocmVmXScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgLy8gR2V0IExpbmtcclxuICAgICAgICAgICAgdmFyIGxpbmsgPSBlLmN1cnJlbnRUYXJnZXQuZ2V0QXR0cmlidXRlKCdocmVmJykgfHwgZS5jdXJyZW50VGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1ocmVmJyk7XHJcbiAgICAgICAgICAgIHZhciBtb2RlID0gZS5jdXJyZW50VGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1zaGVsbCcpO1xyXG4gICAgICAgICAgICByb3V0ZUxpbmsobGluaywgZSwgbW9kZSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICQod2luZG93KS5vbignaGFzaGNoYW5nZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgcm91dGVMaW5rKHdpbmRvdy5sb2NhdGlvbi5oYXNoLCBlKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBOT1RFOiB0aGlzIHZpZXcgbW9kZWwsIGluIFNoZWxsIG9yIGluIGFwcC5qcz9cclxuICAgICAgICAvLyBTZXQgbW9kZWwgZm9yIHRoZSBBcHBOYXZcclxuICAgICAgICBrby5hcHBseUJpbmRpbmdzKHtcclxuICAgICAgICAgICAgbmF2QWN0aW9uOiB0aGlzLm5hdkFjdGlvbixcclxuICAgICAgICAgICAgc3RhdHVzOiB0aGlzLnN0YXR1c1xyXG4gICAgICAgIH0sICQoJy5BcHBOYXYnKS5nZXQoMCkpO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBTaGVsbCgpIHtcclxuICAgIHJldHVybiBPYmplY3QuY3JlYXRlKHNoZWxsKTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBUaW1lIGNsYXNzIHV0aWxpdHkuXHJcbiAgICBTaG9ydGVyIHdheSB0byBjcmVhdGUgYSBEYXRlIGluc3RhbmNlXHJcbiAgICBzcGVjaWZ5aW5nIG9ubHkgdGhlIFRpbWUgcGFydCxcclxuICAgIGRlZmF1bHRpbmcgdG8gY3VycmVudCBkYXRlIG9yIFxyXG4gICAgYW5vdGhlciByZWFkeSBkYXRlIGluc3RhbmNlLlxyXG4qKi9cclxuZnVuY3Rpb24gVGltZShkYXRlLCBob3VyLCBtaW51dGUsIHNlY29uZCkge1xyXG4gICAgaWYgKCEoZGF0ZSBpbnN0YW5jZW9mIERhdGUpKSB7XHJcbiBcclxuICAgICAgICBzZWNvbmQgPSBtaW51dGU7XHJcbiAgICAgICAgbWludXRlID0gaG91cjtcclxuICAgICAgICBob3VyID0gZGF0ZTtcclxuICAgICAgICBcclxuICAgICAgICBkYXRlID0gbmV3IERhdGUoKTsgICBcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IERhdGUoZGF0ZS5nZXRGdWxsWWVhcigpLCBkYXRlLmdldE1vbnRoKCksIGRhdGUuZ2V0RGF0ZSgpLCBob3VyIHx8IDAsIG1pbnV0ZSB8fCAwLCBzZWNvbmQgfHwgMCk7XHJcbn1cclxubW9kdWxlLmV4cG9ydHMgPSBUaW1lO1xyXG4iLCIvKipcclxuICAgIENyZWF0ZSBhbiBBY2Nlc3MgQ29udHJvbCBmb3IgYW4gYXBwIHRoYXQganVzdCBjaGVja3NcclxuICAgIHRoZSBhY3Rpdml0eSBwcm9wZXJ0eSBmb3IgYWxsb3dlZCB1c2VyIGxldmVsLlxyXG4gICAgVG8gYmUgcHJvdmlkZWQgdG8gU2hlbGwuanMgYW5kIHVzZWQgYnkgdGhlIGFwcC5qcyxcclxuICAgIHZlcnkgdGllZCB0byB0aGF0IGJvdGggY2xhc3Nlcy5cclxuICAgIFxyXG4gICAgQWN0aXZpdGllcyBjYW4gZGVmaW5lIG9uIGl0cyBvYmplY3QgYW4gYWNjZXNzTGV2ZWxcclxuICAgIHByb3BlcnR5IGxpa2UgbmV4dCBleGFtcGxlc1xyXG4gICAgXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJ0eXBlLlVzZXI7IC8vIGFueW9uZVxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Bbm9ueW1vdXM7IC8vIGFub255bW91cyB1c2VycyBvbmx5XHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7IC8vIGF1dGhlbnRpY2F0ZWQgdXNlcnMgb25seVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy8gVXNlclR5cGUgZW51bWVyYXRpb24gaXMgYml0IGJhc2VkLCBzbyBzZXZlcmFsXHJcbi8vIHVzZXJzIGNhbiBoYXMgYWNjZXNzIGluIGEgc2luZ2xlIHByb3BlcnR5XHJcbnZhciBVc2VyVHlwZSA9IHJlcXVpcmUoJy4uL21vZGVscy9Vc2VyJykuVXNlclR5cGU7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZUFjY2Vzc0NvbnRyb2woYXBwKSB7XHJcbiAgICBcclxuICAgIHJldHVybiBmdW5jdGlvbiBhY2Nlc3NDb250cm9sKGFjdGl2aXR5KSB7XHJcblxyXG4gICAgICAgIHZhciB1c2VyID0gYXBwLm1vZGVsLnVzZXIoKTtcclxuICAgICAgICB2YXIgY3VycmVudFR5cGUgPSB1c2VyICYmIHVzZXIudXNlclR5cGUoKTtcclxuXHJcbiAgICAgICAgaWYgKGFjdGl2aXR5ICYmIHR5cGVvZihhY3Rpdml0eS5hY2Nlc3NMZXZlbCkgIT09ICd1bmRlZmluZWQnKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gISEoYWN0aXZpdHkuYWNjZXNzTGV2ZWwgJiBjdXJyZW50VHlwZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBPbiBub3RoaW5nLCBqdXN0IGFsbG93XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgQm9vdGtub2NrOiBTZXQgb2YgS25vY2tvdXQgQmluZGluZyBIZWxwZXJzIGZvciBCb290c3RyYXAganMgY29tcG9uZW50cyAoanF1ZXJ5IHBsdWdpbnMpXHJcbiAgICBcclxuICAgIERlcGVuZGVuY2llczoganF1ZXJ5XHJcbiAgICBJbmplY3RlZCBkZXBlbmRlbmNpZXM6IGtub2Nrb3V0XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vLyBEZXBlbmRlbmNpZXNcclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuLy8gREkgaTE4biBsaWJyYXJ5XHJcbmV4cG9ydHMuaTE4biA9IG51bGw7XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVIZWxwZXJzKGtvKSB7XHJcbiAgICB2YXIgaGVscGVycyA9IHt9O1xyXG5cclxuICAgIC8qKiBQb3BvdmVyIEJpbmRpbmcgKiovXHJcbiAgICBoZWxwZXJzLnBvcG92ZXIgPSB7XHJcbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZUFjY2Vzc29yLCBhbGxCaW5kaW5ncykge1xyXG4gICAgICAgICAgICB2YXIgc3JjT3B0aW9ucyA9IGtvLnVud3JhcCh2YWx1ZUFjY2Vzc29yKCkpO1xyXG5cclxuICAgICAgICAgICAgLy8gRHVwbGljYXRpbmcgb3B0aW9ucyBvYmplY3QgdG8gcGFzcyB0byBwb3BvdmVyIHdpdGhvdXRcclxuICAgICAgICAgICAgLy8gb3ZlcndyaXR0bmcgc291cmNlIGNvbmZpZ3VyYXRpb25cclxuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc3JjT3B0aW9ucyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBVbndyYXBwaW5nIGNvbnRlbnQgdGV4dFxyXG4gICAgICAgICAgICBvcHRpb25zLmNvbnRlbnQgPSBrby51bndyYXAoc3JjT3B0aW9ucy5jb250ZW50KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmNvbnRlbnQpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBMb2NhbGl6ZTpcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMuY29udGVudCA9IFxyXG4gICAgICAgICAgICAgICAgICAgIGV4cG9ydHMuaTE4biAmJiBleHBvcnRzLmkxOG4udChvcHRpb25zLmNvbnRlbnQpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5jb250ZW50O1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBUbyBnZXQgdGhlIG5ldyBvcHRpb25zLCB3ZSBuZWVkIGRlc3Ryb3kgaXQgZmlyc3Q6XHJcbiAgICAgICAgICAgICAgICAkKGVsZW1lbnQpLnBvcG92ZXIoJ2Rlc3Ryb3knKS5wb3BvdmVyKG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFNlIG11ZXN0cmEgc2kgZWwgZWxlbWVudG8gdGllbmUgZWwgZm9jb1xyXG4gICAgICAgICAgICAgICAgaWYgKCQoZWxlbWVudCkuaXMoJzpmb2N1cycpKVxyXG4gICAgICAgICAgICAgICAgICAgICQoZWxlbWVudCkucG9wb3Zlcignc2hvdycpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICQoZWxlbWVudCkucG9wb3ZlcignZGVzdHJveScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGhlbHBlcnM7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgUGx1ZyBoZWxwZXJzIGluIHRoZSBwcm92aWRlZCBLbm9ja291dCBpbnN0YW5jZVxyXG4qKi9cclxuZnVuY3Rpb24gcGx1Z0luKGtvLCBwcmVmaXgpIHtcclxuICAgIHZhciBuYW1lLFxyXG4gICAgICAgIGhlbHBlcnMgPSBjcmVhdGVIZWxwZXJzKGtvKTtcclxuICAgIFxyXG4gICAgZm9yKHZhciBoIGluIGhlbHBlcnMpIHtcclxuICAgICAgICBpZiAoaGVscGVycy5oYXNPd25Qcm9wZXJ0eSAmJiAhaGVscGVycy5oYXNPd25Qcm9wZXJ0eShoKSlcclxuICAgICAgICAgICAgY29udGludWU7XHJcblxyXG4gICAgICAgIG5hbWUgPSBwcmVmaXggPyBwcmVmaXggKyBoWzBdLnRvVXBwZXJDYXNlKCkgKyBoLnNsaWNlKDEpIDogaDtcclxuICAgICAgICBrby5iaW5kaW5nSGFuZGxlcnNbbmFtZV0gPSBoZWxwZXJzW2hdO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnRzLnBsdWdJbiA9IHBsdWdJbjtcclxuZXhwb3J0cy5jcmVhdGVCaW5kaW5nSGVscGVycyA9IGNyZWF0ZUhlbHBlcnM7XHJcbiIsIi8qKlxyXG4gICAgRXNwYWNlIGEgc3RyaW5nIGZvciB1c2Ugb24gYSBSZWdFeHAuXHJcbiAgICBVc3VhbGx5LCB0byBsb29rIGZvciBhIHN0cmluZyBpbiBhIHRleHQgbXVsdGlwbGUgdGltZXNcclxuICAgIG9yIHdpdGggc29tZSBleHByZXNzaW9ucywgc29tZSBjb21tb24gYXJlIFxyXG4gICAgbG9vayBmb3IgYSB0ZXh0ICdpbiB0aGUgYmVnaW5uaW5nJyAoXilcclxuICAgIG9yICdhdCB0aGUgZW5kJyAoJCkuXHJcbiAgICBcclxuICAgIEF1dGhvcjogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3VzZXJzLzE1MTMxMi9jb29sYWo4NiBhbmQgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3VzZXJzLzk0MTAvYXJpc3RvdGxlLXBhZ2FsdHppc1xyXG4gICAgTGluazogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNjk2OTQ4NlxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLy8gUmVmZXJyaW5nIHRvIHRoZSB0YWJsZSBoZXJlOlxyXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9yZWdleHBcclxuLy8gdGhlc2UgY2hhcmFjdGVycyBzaG91bGQgYmUgZXNjYXBlZFxyXG4vLyBcXCBeICQgKiArID8gLiAoICkgfCB7IH0gWyBdXHJcbi8vIFRoZXNlIGNoYXJhY3RlcnMgb25seSBoYXZlIHNwZWNpYWwgbWVhbmluZyBpbnNpZGUgb2YgYnJhY2tldHNcclxuLy8gdGhleSBkbyBub3QgbmVlZCB0byBiZSBlc2NhcGVkLCBidXQgdGhleSBNQVkgYmUgZXNjYXBlZFxyXG4vLyB3aXRob3V0IGFueSBhZHZlcnNlIGVmZmVjdHMgKHRvIHRoZSBiZXN0IG9mIG15IGtub3dsZWRnZSBhbmQgY2FzdWFsIHRlc3RpbmcpXHJcbi8vIDogISAsID0gXHJcbi8vIG15IHRlc3QgXCJ+IUAjJCVeJiooKXt9W11gLz0/K1xcfC1fOzonXFxcIiw8Lj5cIi5tYXRjaCgvW1xcI10vZylcclxuXHJcbnZhciBzcGVjaWFscyA9IFtcclxuICAgIC8vIG9yZGVyIG1hdHRlcnMgZm9yIHRoZXNlXHJcbiAgICAgIFwiLVwiXHJcbiAgICAsIFwiW1wiXHJcbiAgICAsIFwiXVwiXHJcbiAgICAvLyBvcmRlciBkb2Vzbid0IG1hdHRlciBmb3IgYW55IG9mIHRoZXNlXHJcbiAgICAsIFwiL1wiXHJcbiAgICAsIFwie1wiXHJcbiAgICAsIFwifVwiXHJcbiAgICAsIFwiKFwiXHJcbiAgICAsIFwiKVwiXHJcbiAgICAsIFwiKlwiXHJcbiAgICAsIFwiK1wiXHJcbiAgICAsIFwiP1wiXHJcbiAgICAsIFwiLlwiXHJcbiAgICAsIFwiXFxcXFwiXHJcbiAgICAsIFwiXlwiXHJcbiAgICAsIFwiJFwiXHJcbiAgICAsIFwifFwiXHJcbiAgXVxyXG5cclxuICAvLyBJIGNob29zZSB0byBlc2NhcGUgZXZlcnkgY2hhcmFjdGVyIHdpdGggJ1xcJ1xyXG4gIC8vIGV2ZW4gdGhvdWdoIG9ubHkgc29tZSBzdHJpY3RseSByZXF1aXJlIGl0IHdoZW4gaW5zaWRlIG9mIFtdXHJcbiwgcmVnZXggPSBSZWdFeHAoJ1snICsgc3BlY2lhbHMuam9pbignXFxcXCcpICsgJ10nLCAnZycpXHJcbjtcclxuXHJcbnZhciBlc2NhcGVSZWdFeHAgPSBmdW5jdGlvbiAoc3RyKSB7XHJcbnJldHVybiBzdHIucmVwbGFjZShyZWdleCwgXCJcXFxcJCZcIik7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGVzY2FwZVJlZ0V4cDtcclxuXHJcbi8vIHRlc3QgZXNjYXBlUmVnRXhwKFwiL3BhdGgvdG8vcmVzP3NlYXJjaD10aGlzLnRoYXRcIilcclxuIiwiLyoqXHJcbiAgICBSZWFkIGEgcGFnZSdzIEdFVCBVUkwgdmFyaWFibGVzIGFuZCByZXR1cm4gdGhlbSBhcyBhbiBhc3NvY2lhdGl2ZSBhcnJheS5cclxuKiovXHJcbid1c2VyIHN0cmljdCc7XHJcbi8vZ2xvYmFsIHdpbmRvd1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZXRVcmxRdWVyeSh1cmwpIHtcclxuXHJcbiAgICB1cmwgPSB1cmwgfHwgd2luZG93LmxvY2F0aW9uLmhyZWY7XHJcblxyXG4gICAgdmFyIHZhcnMgPSBbXSwgaGFzaDtcclxuICAgIHZhciBoYXNoZXMgPSB1cmwuc2xpY2UodXJsLmluZGV4T2YoJz8nKSArIDEpLnNwbGl0KCcmJyk7XHJcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgaGFzaGVzLmxlbmd0aDsgaSsrKVxyXG4gICAge1xyXG4gICAgICAgIGhhc2ggPSBoYXNoZXNbaV0uc3BsaXQoJz0nKTtcclxuICAgICAgICB2YXJzLnB1c2goaGFzaFswXSk7XHJcbiAgICAgICAgdmFyc1toYXNoWzBdXSA9IGhhc2hbMV07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFycztcclxufTtcclxuIiwiLyoqIEFwcE1vZGVsLCBjZW50cmFsaXplcyBhbGwgdGhlIGRhdGEgZm9yIHRoZSBhcHAsXHJcbiAgICBjYWNoaW5nIGFuZCBzaGFyaW5nIGRhdGEgYWNyb3NzIGFjdGl2aXRpZXMgYW5kIHBlcmZvcm1pbmdcclxuICAgIHJlcXVlc3RzXHJcbioqL1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuLi9tb2RlbHMvTW9kZWwnKSxcclxuICAgIFVzZXIgPSByZXF1aXJlKCcuLi9tb2RlbHMvVXNlcicpLFxyXG4gICAgUmVzdCA9IHJlcXVpcmUoJy4uL3V0aWxzL1Jlc3QnKSxcclxuICAgIGxvY2FsZm9yYWdlID0gcmVxdWlyZSgnbG9jYWxmb3JhZ2UnKTtcclxuXHJcbmZ1bmN0aW9uIEFwcE1vZGVsKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHVzZXI6IFVzZXIubmV3QW5vbnltb3VzKClcclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbi8qKiBJbml0aWFsaXplIGFuZCB3YWl0IGZvciBhbnl0aGluZyB1cCAqKi9cclxuQXBwTW9kZWwucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiBpbml0KCkge1xyXG4gICAgXHJcbiAgICAvLyBOT1RFOiBVUkwgdG8gYmUgdXBkYXRlZFxyXG4gICAgLy90aGlzLnJlc3QgPSBuZXcgUmVzdCgnaHR0cDovL2Rldi5sb2Nvbm9taWNzLmNvbS9lbi1VUy9yZXN0LycpO1xyXG4gICAgdGhpcy5yZXN0ID0gbmV3IFJlc3QoJ2h0dHA6Ly9sb2NhbGhvc3Qvc291cmNlL2VuLVVTL3Jlc3QvJyk7XHJcbiAgICBcclxuICAgIC8vIFNldHVwIFJlc3QgYXV0aGVudGljYXRpb25cclxuICAgIHRoaXMucmVzdC5vbkF1dGhvcml6YXRpb25SZXF1aXJlZCA9IGZ1bmN0aW9uKHJldHJ5KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy50cnlMb2dpbigpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIC8vIExvZ2dlZCEgSnVzdCByZXRyeVxyXG4gICAgICAgICAgICByZXRyeSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG4gICAgXHJcbiAgICAvLyBmaXJzdCB0aW1lIGxvZ2luXHJcbiAgICAvLyBGaXJzdCBhdHRlbXB0IHRvIGxvZ2luIGZyb20gc2F2ZWQgY3JlZGVudGlhbHNcclxuICAgIHZhciBmaXJzdFRpbWVMb2dpbiA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIC8vIFdlIGp1c3Qgd2FudCB0byBjaGVjayBpZiBjYW4gZ2V0IGxvZ2dlZC5cclxuICAgICAgICAvLyBBbnkgcmVzdWx0LCBqdXN0IHJldHVybiBzdWNjZXNzOlxyXG4gICAgICAgIHRoaXMudHJ5TG9naW4oKS50aGVuKHJlc29sdmUsIGZ1bmN0aW9uKGRvZXNuTWF0dGVyKXtcclxuICAgICAgICAgICAgLy8ganVzdCByZXNvbHZlIHdpdGhvdXQgZXJyb3IgKHBhc3NpbmcgaW4gdGhlIGVycm9yXHJcbiAgICAgICAgICAgIC8vIHdpbGwgbWFrZSB0aGUgcHJvY2VzcyB0byBmYWlsKVxyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgXHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xyXG4gICAgICAgIC8vIExvY2FsIGRhdGFcclxuICAgICAgICBsb2NhbGZvcmFnZS5jb25maWcoe1xyXG4gICAgICAgICAgICBuYW1lOiAnTG9jb25vbWljc0FwcCcsXHJcbiAgICAgICAgICAgIHZlcnNpb246IDAuMSxcclxuICAgICAgICAgICAgc2l6ZSA6IDQ5ODA3MzYsIC8vIFNpemUgb2YgZGF0YWJhc2UsIGluIGJ5dGVzLiBXZWJTUUwtb25seSBmb3Igbm93LlxyXG4gICAgICAgICAgICBzdG9yZU5hbWUgOiAna2V5dmFsdWVwYWlycycsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uIDogJ0xvY29ub21pY3MgQXBwJyxcclxuICAgICAgICAgICAgZHJpdmVyOiBsb2NhbGZvcmFnZS5JTkRFWEVEREJcclxuICAgICAgICB9KSxcclxuICAgICAgICBmaXJzdFRpbWVMb2dpblxyXG4gICAgXSk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIEFjY291bnQgbWV0aG9kc1xyXG4qKi9cclxuQXBwTW9kZWwucHJvdG90eXBlLnRyeUxvZ2luID0gZnVuY3Rpb24gdHJ5TG9naW4oKSB7XHJcbiAgICAvLyBHZXQgc2F2ZWQgY3JlZGVudGlhbHNcclxuICAgIHJldHVybiBsb2NhbGZvcmFnZS5nZXRJdGVtKCdjcmVkZW50aWFscycpXHJcbiAgICAudGhlbihmdW5jdGlvbihjcmVkZW50aWFscykge1xyXG4gICAgICAgIC8vIElmIHdlIGhhdmUgb25lcywgdHJ5IHRvIGxvZy1pblxyXG4gICAgICAgIGlmIChjcmVkZW50aWFscykge1xyXG4gICAgICAgICAgICAvLyBBdHRlbXB0IGxvZ2luIHdpdGggdGhhdFxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sb2dpbihcclxuICAgICAgICAgICAgICAgIGNyZWRlbnRpYWxzLnVzZXJuYW1lLFxyXG4gICAgICAgICAgICAgICAgY3JlZGVudGlhbHMucGFzc3dvcmRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHNhdmVkIGNyZWRlbnRpYWxzJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufTtcclxuXHJcbkFwcE1vZGVsLnByb3RvdHlwZS5sb2dpbiA9IGZ1bmN0aW9uIGxvZ2luKHVzZXJuYW1lLCBwYXNzd29yZCkge1xyXG4gICAgICAgIFxyXG4gICAgcmV0dXJuIHRoaXMucmVzdC5wb3N0KCdsb2dpbicsIHtcclxuICAgICAgICB1c2VybmFtZTogdXNlcm5hbWUsXHJcbiAgICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkXHJcbiAgICB9KS50aGVuKGZ1bmN0aW9uKGxvZ2dlZCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdsb2dnZWQhJywgbG9nZ2VkKTtcclxuICAgICAgICAvLyB1c2UgYXV0aG9yaXphdGlvbiBrZXkgZm9yIGVhY2hcclxuICAgICAgICAvLyBuZXcgUmVzdCByZXF1ZXN0XHJcbiAgICAgICAgdGhpcy5yZXN0LmV4dHJhSGVhZGVycyA9IHtcclxuICAgICAgICAgICAgYWx1OiBsb2dnZWQudXNlcklkLFxyXG4gICAgICAgICAgICBhbGs6IGxvZ2dlZC5hdXRoS2V5XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8gYXN5bmMgbG9jYWwgc2F2ZSwgZG9uJ3Qgd2FpdFxyXG4gICAgICAgIGxvY2FsZm9yYWdlLnNldEl0ZW0oJ2NyZWRlbnRpYWxzJywge1xyXG4gICAgICAgICAgICB1c2VySUQ6IGxvZ2dlZC51c2VySWQsXHJcbiAgICAgICAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcclxuICAgICAgICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gU2V0IHVzZXIgZGF0YVxyXG4gICAgICAgIC8vIFRPRE8gR2V0IFVzZXIgaW5mb1xyXG4gICAgICAgIGZha2VMb2dpbih0aGlzLnVzZXIoKSk7XHJcbiAgICAgICAgdGhpcy51c2VyKCkudXNlcklEKGxvZ2dlZC51c2VySWQpO1xyXG4gICAgICAgIHRoaXMudXNlcigpLmVtYWlsKHVzZXJuYW1lKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGxvZ2dlZDtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn07XHJcblxyXG4vLyBUT0RPOiByZW1vdmUgYWZ0ZXIgaW1wbGVtZW50IHJlYWwgbG9naW5cclxuZnVuY3Rpb24gZmFrZUxvZ2luKHVzZXIpIHtcclxuICAgIHVzZXIubW9kZWwudXBkYXRlV2l0aChcclxuICAgICAgICBuZXcgVXNlcih7XHJcbiAgICAgICAgICAgIGZpcnN0TmFtZTogJ1VzZXJuYW1lJyxcclxuICAgICAgICAgICAgb25ib2FyZGluZ1N0ZXA6IG51bGwsXHJcbiAgICAgICAgICAgIGlzUHJvdmlkZXI6IHRydWVcclxuICAgICAgICB9KVxyXG4gICAgKTtcclxufVxyXG4gICAgXHJcbkFwcE1vZGVsLnByb3RvdHlwZS5sb2dvdXQgPSBmdW5jdGlvbiBsb2dvdXQoKSB7XHJcbiAgICAgICAgXHJcbiAgICByZXR1cm4gdGhpcy5yZXN0LnBvc3QoJ2xvZ291dCcpLnRoZW4oZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHRoaXMucmVzdC5leHRyYUhlYWRlcnMgPSBudWxsO1xyXG4gICAgICAgIGxvY2FsZm9yYWdlLnJlbW92ZUl0ZW0oJ2NyZWRlbnRpYWxzJyk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBcHBNb2RlbDtcclxuIiwiLyoqIE5hdkFjdGlvbiB2aWV3IG1vZGVsLlxyXG4gICAgSXQgYWxsb3dzIHNldC11cCBwZXIgYWN0aXZpdHkgZm9yIHRoZSBBcHBOYXYgYWN0aW9uIGJ1dHRvbi5cclxuKiovXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4uL21vZGVscy9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gTmF2QWN0aW9uKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBsaW5rOiAnJyxcclxuICAgICAgICBpY29uOiAnJ1xyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBOYXZBY3Rpb247XHJcblxyXG4vKiogU3RhdGljLCBzaGFyZWQgYWN0aW9ucyAqKi9cclxuTmF2QWN0aW9uLmdvSG9tZSA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgbGluazogJy8nLFxyXG4gICAgaWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24taG9tZSdcclxufSk7XHJcblxyXG5OYXZBY3Rpb24uZ29CYWNrID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnIyFnby1iYWNrJyxcclxuICAgIGljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLWFycm93LWxlZnQnXHJcbn0pO1xyXG5cclxuTmF2QWN0aW9uLm5ld0l0ZW0gPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICcjIW5ldycsXHJcbiAgICBpY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJ1xyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5uZXdDYWxlbmRhckl0ZW0gPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICcjIWNhbGVuZGFyL25ldycsXHJcbiAgICBpY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJ1xyXG59KTtcclxuIl19
;