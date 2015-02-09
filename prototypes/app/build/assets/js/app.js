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

    this.accessLevel = app.UserType.Provider;
    
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
    
    this.appointmentsDataView.currentAppointment.subscribe(function (apt) {
        // Update URL to match the appointment ID and
        // track it state
        // Get ID from URL, to avoid do anything if the same.
        var aptId = apt.id();
        var urlId = /appointment\/(\d+)/i.test(window.location);
        urlId = urlId && urlId[1] || '';
        if (urlId !== aptId.toString()) {
            // TODO: save a useful state
            app.shell.history.pushState(null, null, 'appointment/' + aptId.toString());
        }
    });
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
    
    var aptId = options && options.appointmentId;
    if (aptId && options.route.segments[0] !== aptId.toString()) {
        // Update URL to match ID
        delete options.appointmentId;
        this.app.shell.history.replaceState(options, null, 'appointment/' + aptId.toString());
    }
    this.showAppointment(aptId);
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
                
                // Remove the navAction
                app.navAction(null);
            }
            else {
                // Restore the navAction
                app.navAction(this.navAction);
            }
            
        }.bind(this));
        
        appointmentsDataView.pickDateTime = function pickDateTime() {

            app.shell.go('datetimePicker', {
                selectedDatetime: null
            });
        };
        
        appointmentsDataView.pickClient = function pickClient() {

            app.shell.go('clients', {
                selectClient: true,
                selectedClient: null
            });
        };

        appointmentsDataView.pickService = function pickService() {

            app.shell.go('services', {
                selectServices: true,
                selectedServices: appointmentsDataView.currentAppointment().services()
            });
        };

        appointmentsDataView.changePrice = function changePrice() {
            // TODO
        };
        
        appointmentsDataView.pickLocation = function pickLocation() {

            app.shell.go('locations', {
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

            app.shell.go('textEditor', {
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
                this.app.shell.go('calendar', this.requestInfo);
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

},{"../components/DatePicker":24,"../models/Appointment":26,"../testdata/calendarAppointments":42,"../viewmodels/NavAction":70,"knockout":false,"moment":false}],3:[function(require,module,exports){
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

    this.accessLevel = app.UserType.LoggedUser;
    
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
    this.app.shell.go('appointment', {
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

},{"../components/DatePicker":24,"../models/CalendarSlot":29,"../testdata/calendarSlots":43,"../viewmodels/NavAction":70,"knockout":false,"moment":false}],5:[function(require,module,exports){
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

    this.accessLevel = app.UserType.Provider;
    
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

},{"../testdata/clients":44,"knockout":false}],6:[function(require,module,exports){
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

    this.accessLevel = app.UserType.LoggedUser;
    
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

    this.accessLevel = app.UserType.LoggedUser;
    
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

},{"../components/DatePicker":24,"../testdata/timeSlots":48,"../utils/Time":52,"knockout":false,"moment":false}],8:[function(require,module,exports){
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
    
    this.accessLevel = app.UserType.Provider;

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

},{"../models/GetMore":31,"../models/MailFolder":34,"../models/PerformanceSummary":37,"../models/UpcomingBookingsSummary":40,"../testdata/messages":46,"../utils/Time":52,"../viewmodels/NavAction":70,"knockout":false}],9:[function(require,module,exports){
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
    if (!this.app.model.user().isAnonymous()) {
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
},{"../viewmodels/NavAction":70,"knockout":false}],11:[function(require,module,exports){
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
    
    this.accessLevel = app.UserType.Provider;

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
},{"../models/Location":33,"knockout":false}],12:[function(require,module,exports){
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
    
    this.accessLevel = app.UserType.Provider;

    this.app = app;
    this.$activity = $activity;
    this.$listView = $activity.find('#locationsListView');

    var dataView = this.dataView = new ViewModel(app);
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

},{"../testdata/locations":45,"knockout":false}],13:[function(require,module,exports){
/**
    Login activity
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
    
    this.accessLevel = app.UserType.Anonymous;

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

},{"../models/User":41,"../viewmodels/NavAction":70,"knockout":false}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
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
    
    this.navAction = null;
}

OnboardingCompleteActivity.prototype.show = function show(options) {

};

},{}],16:[function(require,module,exports){
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

    this.accessLevel = app.UserType.LoggedUser;
    
    this.$activity = $activity;
    this.app = app;
    
    this.navAction = null;
}

OnboardingHomeActivity.prototype.show = function show(options) {

};

},{}],17:[function(require,module,exports){
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
},{"../models/Position":38,"../viewmodels/NavAction":70,"knockout":false}],18:[function(require,module,exports){
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

    this.accessLevel = app.UserType.Provider;
    
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
            this.app.shell.goBack(this.requestInfo);
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

},{"../testdata/services":47,"knockout":false}],19:[function(require,module,exports){
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

    this.accessLevel = app.UserType.Anonymous;
    
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
                this.app.shell.go('onboardingHome');
            }
            else {
                this.app.shell.go('home');
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
},{"../viewmodels/NavAction":70,"knockout":false}],20:[function(require,module,exports){
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

},{"events":false,"knockout":false}],21:[function(require,module,exports){
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
    'positions': require('./activities/positions'),
    'onboardingHome': require('./activities/onboardingHome'),
    'locationEdition': require('./activities/locationEdition'),
    'onboardingComplete': require('./activities/onboardingComplete')
};

},{"./activities/appointment":2,"./activities/bookingConfirmation":3,"./activities/calendar":4,"./activities/clients":5,"./activities/contactInfo":6,"./activities/datetimePicker":7,"./activities/home":8,"./activities/index":9,"./activities/learnMore":10,"./activities/locationEdition":11,"./activities/locations":12,"./activities/login":13,"./activities/logout":14,"./activities/onboardingComplete":15,"./activities/onboardingHome":16,"./activities/positions":17,"./activities/services":18,"./activities/signup":19,"./activities/textEditor":20}],22:[function(require,module,exports){
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

// Creating the shell:
var shell = new Shell({

    // Selector, DOM element or jQuery object pointing
    // the root or container for the shell items
    root: 'body',

    // If is not in the site root, the base URL is required:
    baseUrl: baseUrl,
    
    forceHashbang: true,

    indexName: 'index',

    // for faster mobile experience (jquery-mobile event):
    linkEvent: 'tap',

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

},{"./utils/shell/hashbangHistory":63,"./utils/shell/index":64}],23:[function(require,module,exports){
'use strict';

/** Global dependencies **/
var $ = require('jquery');
require('bootstrap');
require('jquery-mobile');
var ko = require('knockout');
ko.bindingHandlers.format = require('ko/formatBinding').formatBinding;
var bootknock = require('./utils/bootknockBindingHelpers');
require('./utils/Function.prototype._inherits');
require('./utils/Function.prototype._delayed');
// Promise polyfill, so its not 'require'd per module:
require('es6-promise').polyfill();

var layoutUpdateEvent = require('layoutUpdateEvent');
var NavAction = require('./viewmodels/NavAction'),
    AppModel = require('./viewmodels/AppModel');

// Register the special locale
require('./locales/en-US-LC');

/**
    App static class
**/
var app = {
    shell: require('./app-shell'),
    
    // New app model, that starts with anonymous user
    model: new AppModel(),
    
    // TODO Double check it works
    // 'out', 'login', 'onboarding', 'in'
    status: ko.observable('out'),
    
    /** Load activities controllers (not initialized) **/
    activities: require('./app-activities'),
    
    /**
        Just redirect the better place for current user and state
    **/
    goDashboard: function goDashboard() {
        var onboarding = this.model.user().onboardingStep();
        if (onboarding) {
            this.shell.go('onboardingHome/' + onboarding);
        }
        else {
            this.shell.go('home');
        }
    },
    
    /**
        Update the app menu to highlight the
        given link name
    **/
    updateMenu: function updateMenu(name) {
        
        this.$menu = this.$menu || $('#navbar');
        
        // Remove any active
        this.$menu
        .find('li')
        .removeClass('active');
        // Add active
        this.$menu
        .find('.go-' + name)
        .closest('li')
        .addClass('active');
        // Hide menu
        this.$menu
        .filter(':visible')
        .collapse('hide');
    },
    
    /**
        Observables and methods to manage the shared
        app navigation bar.
        
        TODO: complete for the new design
    **/
    navAction: ko.observable(null),
    defaultNavAction: null,
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
    }
};

/** Continue app creation with things that need a reference to the app **/

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


/** App Init **/
var appInit = function appInit() {
    
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
    
    // Load Knockout binding helpers
    bootknock.plugIn(ko);
    
    // Plugins setup
    if (window && window.plugins && window.plugins.Keyboard) {
        window.plugins.Keyboard.disableScroll(true);
    }
    
    // Easy links to shell actions, like goBack, in html elements
    // Example: <button data-shell="goBack 2">Go 2 times back</button>
    $(document).on('tap', '[data-shell]', function(e) {
        var cmdline = $(this).data('shell') || '',
            args = cmdline.split(' '),
            cmd = args[0];

        if (cmd && typeof(app.shell[cmd]) === 'function') {
            app.shell[cmd].apply(cmd, args.slice(1));
        }
    });
    
    // When an activity is ready in the Shell:
    app.shell.on(app.shell.events.itemReady, function($act, state) {
        
        // Connect the 'activities' controllers to their views
        // Get initialized activity for the DOM element
        var actName = $act.data('activity');
        var activity = app.getActivity(actName);
        // Trigger the 'show' logic of the activity controller:
        activity.show(state);

        // Update menu
        app.updateMenu(actName);
        
        // Update app navigation
        app.updateAppNav(activity);
    });
    
    // Set model for the AppNav
    ko.applyBindings({
        navAction: app.navAction,
        status: app.status
    }, $('.AppNav').get(0));

    // App init:
    app.model.init().then(
        app.shell.run.bind(app.shell)
    ).then(function() {
        // Mark the page as ready
        $('html').addClass('is-ready');
    });

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
},{"./app-activities":21,"./app-shell":22,"./locales/en-US-LC":25,"./utils/Function.prototype._delayed":49,"./utils/Function.prototype._inherits":50,"./utils/accessControl":53,"./utils/bootknockBindingHelpers":55,"./viewmodels/AppModel":69,"./viewmodels/NavAction":70,"es6-promise":false,"knockout":false}],24:[function(require,module,exports){
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

},{}],25:[function(require,module,exports){
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

},{"moment":false}],26:[function(require,module,exports){
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

},{"./Client":30,"./Location":33,"./Model":36,"./Service":39,"knockout":false,"moment":false}],27:[function(require,module,exports){
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

},{"./Model":36,"knockout":false,"moment":false}],28:[function(require,module,exports){
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
},{"./Model":36,"knockout":false,"moment":false}],29:[function(require,module,exports){
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

},{"./Client":30,"./Model":36,"knockout":false}],30:[function(require,module,exports){
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

},{"./Model":36,"knockout":false}],31:[function(require,module,exports){
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

},{"./ListViewItem":32,"./Model":36,"knockout":false}],32:[function(require,module,exports){
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

},{"./Model":36,"knockout":false,"moment":false}],33:[function(require,module,exports){
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

},{"./Model":36,"knockout":false}],34:[function(require,module,exports){
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

},{"./Model":36,"knockout":false,"lodash":false,"moment":false}],35:[function(require,module,exports){
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

},{"./Model":36,"knockout":false,"moment":false}],36:[function(require,module,exports){
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

},{"knockout":false,"knockout.mapping":false}],37:[function(require,module,exports){
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

},{"./ListViewItem":32,"./Model":36,"knockout":false,"moment":false,"numeral":1}],38:[function(require,module,exports){
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

},{"./Model":36,"knockout":false}],39:[function(require,module,exports){
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

},{"./Model":36,"knockout":false}],40:[function(require,module,exports){
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

},{"./BookingSummary":27,"./Model":36,"knockout":false}],41:[function(require,module,exports){
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

},{"./Model":36,"knockout":false}],42:[function(require,module,exports){
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

},{"../models/Appointment":26,"./locations":45,"./services":47,"knockout":false,"moment":false}],43:[function(require,module,exports){
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

},{"../models/CalendarSlot":29,"../utils/Time":52,"moment":false}],44:[function(require,module,exports){
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

},{"../models/Client":30}],45:[function(require,module,exports){
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

},{"../models/Location":33}],46:[function(require,module,exports){
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

},{"../models/Message":35,"../utils/Time":52,"moment":false}],47:[function(require,module,exports){
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

},{"../models/Service":39}],48:[function(require,module,exports){
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

},{"../utils/Time":52,"moment":false}],49:[function(require,module,exports){
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

},{}],50:[function(require,module,exports){
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

},{}],51:[function(require,module,exports){
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
    
    return Promise.resolve($.ajax({
        url: this.baseUrl + apiUrl,
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

},{}],52:[function(require,module,exports){
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

},{}],53:[function(require,module,exports){
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

},{"../models/User":41}],54:[function(require,module,exports){
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
        
        return this.rest.post(modelUrl, anItem).then(function(anItem) {
            return new Model(anItem);
        });
    };

    extendedObject['put' + modelName] = function putItem(anItem) {
        return this.rest.put(modelUrl + '/' + unwrap(anItem[idPropertyName]), anItem);
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
},{}],55:[function(require,module,exports){
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

},{}],56:[function(require,module,exports){
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

},{}],57:[function(require,module,exports){
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

},{}],58:[function(require,module,exports){
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

},{}],59:[function(require,module,exports){
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

},{"../escapeSelector":57}],60:[function(require,module,exports){
/**
    Javascritp Shell for SPAs.
**/
/*global history, History */
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
    
    // For current uses, any pendingStateUpdate is used as
    // the state, rather than the provided one
    state = this._pendingStateUpdate || state || this.history.state;
    
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
    var accessError = this.accessControl(state);
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
    this.$('body').on(this.linkEvent, '[href], [data-href]', function(e) {
        
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

        shell.go(href);
    });

    // Initiallize state
    this.items.init();
    // Route to the current url/state
    this.replace();
};

},{"./dependencies":62}],61:[function(require,module,exports){
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

},{"../escapeRegExp":56,"./sanitizeUrl":67}],62:[function(require,module,exports){
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

},{}],63:[function(require,module,exports){
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
    
        // Get latest saved state, thats the current one
        var last = session.states.length;
        if (last === 0)
            return null;
        else
            return session.states[last - 1];
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

},{"../getUrlQuery":58,"./sanitizeUrl":67}],64:[function(require,module,exports){
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

},{"./DomItemsManager":59,"./Shell":60,"./absolutizeUrl":61,"./dependencies":62,"./loader":65,"./parseUrl":66,"events":false}],65:[function(require,module,exports){
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

},{}],66:[function(require,module,exports){
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
},{"../escapeRegExp":56,"../getUrlQuery":58}],67:[function(require,module,exports){
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
},{}],68:[function(require,module,exports){
/** AppModel extension,
    focused on the Events API
**/
'use strict';
var CalendarEvent = require('../models/CalendarEvent'),
    apiHelper = require('../utils/apiHelper');

exports.extends = function (AppModel) {
    
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
},{"../models/CalendarEvent":28,"../utils/apiHelper":54}],69:[function(require,module,exports){
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
    
    // Get user data from the cached profile if any
    // (will be updated later
    // with a new login attempt)
    localforage.getItem('profile').then(function(profile) {
        if (profile) {
            // Set user data
            this.user().model.updateWith(profile);
        }
    }.bind(this));

    // First attempt to login from saved credentials
    return new Promise(function(resolve, reject) {
        // We just want to check if can get logged.
        // Any result, just return success:
        this.tryLogin().then(resolve, function(doesnMatter){
            // just resolve without error (passing in the error
            // will make the process to fail)
            resolve();
        });
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
            password: password
        });
        localforage.setItem('profile', logged.profile);

        // Set user data
        this.user().model.updateWith(logged.profile);

        return logged;
    }.bind(this));
};

AppModel.prototype.logout = function logout() {
        
    return this.rest.post('logout').then(function() {

        this.rest.extraHeaders = null;
        localforage.removeItem('credentials');
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
// Loading extensions/partials:
require('./AppModel-events').extends(AppModel);

},{"../models/Model":36,"../models/User":41,"../utils/Rest":51,"./AppModel-events":68,"knockout":false,"localforage":false}],70:[function(require,module,exports){
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

},{"../models/Model":36,"knockout":false}]},{},[23])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvbm9kZV9tb2R1bGVzL251bWVyYWwvbnVtZXJhbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvYXBwb2ludG1lbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2Jvb2tpbmdDb25maXJtYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2NhbGVuZGFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9jbGllbnRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9jb250YWN0SW5mby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvZGF0ZXRpbWVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2hvbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2luZGV4LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9sZWFybk1vcmUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL2xvY2F0aW9uRWRpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvbG9jYXRpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9sb2dpbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FjdGl2aXRpZXMvbG9nb3V0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9vbmJvYXJkaW5nQ29tcGxldGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL29uYm9hcmRpbmdIb21lLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9wb3NpdGlvbnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL3NlcnZpY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvYWN0aXZpdGllcy9zaWdudXAuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hY3Rpdml0aWVzL3RleHRFZGl0b3IuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9hcHAtYWN0aXZpdGllcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FwcC1zaGVsbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2FwcC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2NvbXBvbmVudHMvRGF0ZVBpY2tlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL2xvY2FsZXMvZW4tVVMtTEMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQXBwb2ludG1lbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQm9va2luZ1N1bW1hcnkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQ2FsZW5kYXJFdmVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9DYWxlbmRhclNsb3QuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvQ2xpZW50LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0dldE1vcmUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvTGlzdFZpZXdJdGVtLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL0xvY2F0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvbW9kZWxzL01haWxGb2xkZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvTWVzc2FnZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9Nb2RlbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9QZXJmb3JtYW5jZVN1bW1hcnkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvUG9zaXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy9tb2RlbHMvU2VydmljZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9VcGNvbWluZ0Jvb2tpbmdzU3VtbWFyeS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL21vZGVscy9Vc2VyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdGVzdGRhdGEvY2FsZW5kYXJBcHBvaW50bWVudHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS9jYWxlbmRhclNsb3RzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdGVzdGRhdGEvY2xpZW50cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3Rlc3RkYXRhL2xvY2F0aW9ucy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3Rlc3RkYXRhL21lc3NhZ2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdGVzdGRhdGEvc2VydmljZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy90ZXN0ZGF0YS90aW1lU2xvdHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9GdW5jdGlvbi5wcm90b3R5cGUuX2RlbGF5ZWQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9GdW5jdGlvbi5wcm90b3R5cGUuX2luaGVyaXRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvUmVzdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL1RpbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9hY2Nlc3NDb250cm9sLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvYXBpSGVscGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvYm9vdGtub2NrQmluZGluZ0hlbHBlcnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9lc2NhcGVSZWdFeHAuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9lc2NhcGVTZWxlY3Rvci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL2dldFVybFF1ZXJ5LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvc2hlbGwvRG9tSXRlbXNNYW5hZ2VyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvc2hlbGwvU2hlbGwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9hYnNvbHV0aXplVXJsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvc2hlbGwvZGVwZW5kZW5jaWVzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvc2hlbGwvaGFzaGJhbmdIaXN0b3J5LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdXRpbHMvc2hlbGwvaW5kZXguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9sb2FkZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy91dGlscy9zaGVsbC9wYXJzZVVybC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3N0eWxlZ3VpZGUvcHJvdG90eXBlcy9hcHAvc291cmNlL2pzL3V0aWxzL3NoZWxsL3Nhbml0aXplVXJsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9BcHBNb2RlbC1ldmVudHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zdHlsZWd1aWRlL3Byb3RvdHlwZXMvYXBwL3NvdXJjZS9qcy92aWV3bW9kZWxzL0FwcE1vZGVsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc3R5bGVndWlkZS9wcm90b3R5cGVzL2FwcC9zb3VyY2UvanMvdmlld21vZGVscy9OYXZBY3Rpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdnFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeHBCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBudW1lcmFsLmpzXG4gKiB2ZXJzaW9uIDogMS41LjNcbiAqIGF1dGhvciA6IEFkYW0gRHJhcGVyXG4gKiBsaWNlbnNlIDogTUlUXG4gKiBodHRwOi8vYWRhbXdkcmFwZXIuZ2l0aHViLmNvbS9OdW1lcmFsLWpzL1xuICovXG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIENvbnN0YW50c1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIHZhciBudW1lcmFsLFxuICAgICAgICBWRVJTSU9OID0gJzEuNS4zJyxcbiAgICAgICAgLy8gaW50ZXJuYWwgc3RvcmFnZSBmb3IgbGFuZ3VhZ2UgY29uZmlnIGZpbGVzXG4gICAgICAgIGxhbmd1YWdlcyA9IHt9LFxuICAgICAgICBjdXJyZW50TGFuZ3VhZ2UgPSAnZW4nLFxuICAgICAgICB6ZXJvRm9ybWF0ID0gbnVsbCxcbiAgICAgICAgZGVmYXVsdEZvcm1hdCA9ICcwLDAnLFxuICAgICAgICAvLyBjaGVjayBmb3Igbm9kZUpTXG4gICAgICAgIGhhc01vZHVsZSA9ICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cyk7XG5cblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgQ29uc3RydWN0b3JzXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICAvLyBOdW1lcmFsIHByb3RvdHlwZSBvYmplY3RcbiAgICBmdW5jdGlvbiBOdW1lcmFsIChudW1iZXIpIHtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSBudW1iZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW1wbGVtZW50YXRpb24gb2YgdG9GaXhlZCgpIHRoYXQgdHJlYXRzIGZsb2F0cyBtb3JlIGxpa2UgZGVjaW1hbHNcbiAgICAgKlxuICAgICAqIEZpeGVzIGJpbmFyeSByb3VuZGluZyBpc3N1ZXMgKGVnLiAoMC42MTUpLnRvRml4ZWQoMikgPT09ICcwLjYxJykgdGhhdCBwcmVzZW50XG4gICAgICogcHJvYmxlbXMgZm9yIGFjY291bnRpbmctIGFuZCBmaW5hbmNlLXJlbGF0ZWQgc29mdHdhcmUuXG4gICAgICovXG4gICAgZnVuY3Rpb24gdG9GaXhlZCAodmFsdWUsIHByZWNpc2lvbiwgcm91bmRpbmdGdW5jdGlvbiwgb3B0aW9uYWxzKSB7XG4gICAgICAgIHZhciBwb3dlciA9IE1hdGgucG93KDEwLCBwcmVjaXNpb24pLFxuICAgICAgICAgICAgb3B0aW9uYWxzUmVnRXhwLFxuICAgICAgICAgICAgb3V0cHV0O1xuICAgICAgICAgICAgXG4gICAgICAgIC8vcm91bmRpbmdGdW5jdGlvbiA9IChyb3VuZGluZ0Z1bmN0aW9uICE9PSB1bmRlZmluZWQgPyByb3VuZGluZ0Z1bmN0aW9uIDogTWF0aC5yb3VuZCk7XG4gICAgICAgIC8vIE11bHRpcGx5IHVwIGJ5IHByZWNpc2lvbiwgcm91bmQgYWNjdXJhdGVseSwgdGhlbiBkaXZpZGUgYW5kIHVzZSBuYXRpdmUgdG9GaXhlZCgpOlxuICAgICAgICBvdXRwdXQgPSAocm91bmRpbmdGdW5jdGlvbih2YWx1ZSAqIHBvd2VyKSAvIHBvd2VyKS50b0ZpeGVkKHByZWNpc2lvbik7XG5cbiAgICAgICAgaWYgKG9wdGlvbmFscykge1xuICAgICAgICAgICAgb3B0aW9uYWxzUmVnRXhwID0gbmV3IFJlZ0V4cCgnMHsxLCcgKyBvcHRpb25hbHMgKyAnfSQnKTtcbiAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKG9wdGlvbmFsc1JlZ0V4cCwgJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEZvcm1hdHRpbmdcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAvLyBkZXRlcm1pbmUgd2hhdCB0eXBlIG9mIGZvcm1hdHRpbmcgd2UgbmVlZCB0byBkb1xuICAgIGZ1bmN0aW9uIGZvcm1hdE51bWVyYWwgKG4sIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbikge1xuICAgICAgICB2YXIgb3V0cHV0O1xuXG4gICAgICAgIC8vIGZpZ3VyZSBvdXQgd2hhdCBraW5kIG9mIGZvcm1hdCB3ZSBhcmUgZGVhbGluZyB3aXRoXG4gICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignJCcpID4gLTEpIHsgLy8gY3VycmVuY3khISEhIVxuICAgICAgICAgICAgb3V0cHV0ID0gZm9ybWF0Q3VycmVuY3kobiwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgfSBlbHNlIGlmIChmb3JtYXQuaW5kZXhPZignJScpID4gLTEpIHsgLy8gcGVyY2VudGFnZVxuICAgICAgICAgICAgb3V0cHV0ID0gZm9ybWF0UGVyY2VudGFnZShuLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdC5pbmRleE9mKCc6JykgPiAtMSkgeyAvLyB0aW1lXG4gICAgICAgICAgICBvdXRwdXQgPSBmb3JtYXRUaW1lKG4sIGZvcm1hdCk7XG4gICAgICAgIH0gZWxzZSB7IC8vIHBsYWluIG9sJyBudW1iZXJzIG9yIGJ5dGVzXG4gICAgICAgICAgICBvdXRwdXQgPSBmb3JtYXROdW1iZXIobi5fdmFsdWUsIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXR1cm4gc3RyaW5nXG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgLy8gcmV2ZXJ0IHRvIG51bWJlclxuICAgIGZ1bmN0aW9uIHVuZm9ybWF0TnVtZXJhbCAobiwgc3RyaW5nKSB7XG4gICAgICAgIHZhciBzdHJpbmdPcmlnaW5hbCA9IHN0cmluZyxcbiAgICAgICAgICAgIHRob3VzYW5kUmVnRXhwLFxuICAgICAgICAgICAgbWlsbGlvblJlZ0V4cCxcbiAgICAgICAgICAgIGJpbGxpb25SZWdFeHAsXG4gICAgICAgICAgICB0cmlsbGlvblJlZ0V4cCxcbiAgICAgICAgICAgIHN1ZmZpeGVzID0gWydLQicsICdNQicsICdHQicsICdUQicsICdQQicsICdFQicsICdaQicsICdZQiddLFxuICAgICAgICAgICAgYnl0ZXNNdWx0aXBsaWVyID0gZmFsc2UsXG4gICAgICAgICAgICBwb3dlcjtcblxuICAgICAgICBpZiAoc3RyaW5nLmluZGV4T2YoJzonKSA+IC0xKSB7XG4gICAgICAgICAgICBuLl92YWx1ZSA9IHVuZm9ybWF0VGltZShzdHJpbmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHN0cmluZyA9PT0gemVyb0Zvcm1hdCkge1xuICAgICAgICAgICAgICAgIG4uX3ZhbHVlID0gMDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmRlbGltaXRlcnMuZGVjaW1hbCAhPT0gJy4nKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKC9cXC4vZywnJykucmVwbGFjZShsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5kZWxpbWl0ZXJzLmRlY2ltYWwsICcuJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gc2VlIGlmIGFiYnJldmlhdGlvbnMgYXJlIHRoZXJlIHNvIHRoYXQgd2UgY2FuIG11bHRpcGx5IHRvIHRoZSBjb3JyZWN0IG51bWJlclxuICAgICAgICAgICAgICAgIHRob3VzYW5kUmVnRXhwID0gbmV3IFJlZ0V4cCgnW15hLXpBLVpdJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMudGhvdXNhbmQgKyAnKD86XFxcXCl8KFxcXFwnICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uY3VycmVuY3kuc3ltYm9sICsgJyk/KD86XFxcXCkpPyk/JCcpO1xuICAgICAgICAgICAgICAgIG1pbGxpb25SZWdFeHAgPSBuZXcgUmVnRXhwKCdbXmEtekEtWl0nICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy5taWxsaW9uICsgJyg/OlxcXFwpfChcXFxcJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCArICcpPyg/OlxcXFwpKT8pPyQnKTtcbiAgICAgICAgICAgICAgICBiaWxsaW9uUmVnRXhwID0gbmV3IFJlZ0V4cCgnW15hLXpBLVpdJyArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMuYmlsbGlvbiArICcoPzpcXFxcKXwoXFxcXCcgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyAnKT8oPzpcXFxcKSk/KT8kJyk7XG4gICAgICAgICAgICAgICAgdHJpbGxpb25SZWdFeHAgPSBuZXcgUmVnRXhwKCdbXmEtekEtWl0nICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy50cmlsbGlvbiArICcoPzpcXFxcKXwoXFxcXCcgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wgKyAnKT8oPzpcXFxcKSk/KT8kJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBzZWUgaWYgYnl0ZXMgYXJlIHRoZXJlIHNvIHRoYXQgd2UgY2FuIG11bHRpcGx5IHRvIHRoZSBjb3JyZWN0IG51bWJlclxuICAgICAgICAgICAgICAgIGZvciAocG93ZXIgPSAwOyBwb3dlciA8PSBzdWZmaXhlcy5sZW5ndGg7IHBvd2VyKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZXNNdWx0aXBsaWVyID0gKHN0cmluZy5pbmRleE9mKHN1ZmZpeGVzW3Bvd2VyXSkgPiAtMSkgPyBNYXRoLnBvdygxMDI0LCBwb3dlciArIDEpIDogZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGJ5dGVzTXVsdGlwbGllcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBkbyBzb21lIG1hdGggdG8gY3JlYXRlIG91ciBudW1iZXJcbiAgICAgICAgICAgICAgICBuLl92YWx1ZSA9ICgoYnl0ZXNNdWx0aXBsaWVyKSA/IGJ5dGVzTXVsdGlwbGllciA6IDEpICogKChzdHJpbmdPcmlnaW5hbC5tYXRjaCh0aG91c2FuZFJlZ0V4cCkpID8gTWF0aC5wb3coMTAsIDMpIDogMSkgKiAoKHN0cmluZ09yaWdpbmFsLm1hdGNoKG1pbGxpb25SZWdFeHApKSA/IE1hdGgucG93KDEwLCA2KSA6IDEpICogKChzdHJpbmdPcmlnaW5hbC5tYXRjaChiaWxsaW9uUmVnRXhwKSkgPyBNYXRoLnBvdygxMCwgOSkgOiAxKSAqICgoc3RyaW5nT3JpZ2luYWwubWF0Y2godHJpbGxpb25SZWdFeHApKSA/IE1hdGgucG93KDEwLCAxMikgOiAxKSAqICgoc3RyaW5nLmluZGV4T2YoJyUnKSA+IC0xKSA/IDAuMDEgOiAxKSAqICgoKHN0cmluZy5zcGxpdCgnLScpLmxlbmd0aCArIE1hdGgubWluKHN0cmluZy5zcGxpdCgnKCcpLmxlbmd0aC0xLCBzdHJpbmcuc3BsaXQoJyknKS5sZW5ndGgtMSkpICUgMik/IDE6IC0xKSAqIE51bWJlcihzdHJpbmcucmVwbGFjZSgvW14wLTlcXC5dKy9nLCAnJykpO1xuXG4gICAgICAgICAgICAgICAgLy8gcm91bmQgaWYgd2UgYXJlIHRhbGtpbmcgYWJvdXQgYnl0ZXNcbiAgICAgICAgICAgICAgICBuLl92YWx1ZSA9IChieXRlc011bHRpcGxpZXIpID8gTWF0aC5jZWlsKG4uX3ZhbHVlKSA6IG4uX3ZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuLl92YWx1ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXRDdXJyZW5jeSAobiwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgICAgIHZhciBzeW1ib2xJbmRleCA9IGZvcm1hdC5pbmRleE9mKCckJyksXG4gICAgICAgICAgICBvcGVuUGFyZW5JbmRleCA9IGZvcm1hdC5pbmRleE9mKCcoJyksXG4gICAgICAgICAgICBtaW51c1NpZ25JbmRleCA9IGZvcm1hdC5pbmRleE9mKCctJyksXG4gICAgICAgICAgICBzcGFjZSA9ICcnLFxuICAgICAgICAgICAgc3BsaWNlSW5kZXgsXG4gICAgICAgICAgICBvdXRwdXQ7XG5cbiAgICAgICAgLy8gY2hlY2sgZm9yIHNwYWNlIGJlZm9yZSBvciBhZnRlciBjdXJyZW5jeVxuICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJyAkJykgPiAtMSkge1xuICAgICAgICAgICAgc3BhY2UgPSAnICc7XG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnICQnLCAnJyk7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0LmluZGV4T2YoJyQgJykgPiAtMSkge1xuICAgICAgICAgICAgc3BhY2UgPSAnICc7XG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnJCAnLCAnJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnJCcsICcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGZvcm1hdCB0aGUgbnVtYmVyXG4gICAgICAgIG91dHB1dCA9IGZvcm1hdE51bWJlcihuLl92YWx1ZSwgZm9ybWF0LCByb3VuZGluZ0Z1bmN0aW9uKTtcblxuICAgICAgICAvLyBwb3NpdGlvbiB0aGUgc3ltYm9sXG4gICAgICAgIGlmIChzeW1ib2xJbmRleCA8PSAxKSB7XG4gICAgICAgICAgICBpZiAob3V0cHV0LmluZGV4T2YoJygnKSA+IC0xIHx8IG91dHB1dC5pbmRleE9mKCctJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5zcGxpdCgnJyk7XG4gICAgICAgICAgICAgICAgc3BsaWNlSW5kZXggPSAxO1xuICAgICAgICAgICAgICAgIGlmIChzeW1ib2xJbmRleCA8IG9wZW5QYXJlbkluZGV4IHx8IHN5bWJvbEluZGV4IDwgbWludXNTaWduSW5kZXgpe1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgc3ltYm9sIGFwcGVhcnMgYmVmb3JlIHRoZSBcIihcIiBvciBcIi1cIlxuICAgICAgICAgICAgICAgICAgICBzcGxpY2VJbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG91dHB1dC5zcGxpY2Uoc3BsaWNlSW5kZXgsIDAsIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCArIHNwYWNlKTtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQuam9pbignJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmN1cnJlbmN5LnN5bWJvbCArIHNwYWNlICsgb3V0cHV0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKG91dHB1dC5pbmRleE9mKCcpJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5zcGxpdCgnJyk7XG4gICAgICAgICAgICAgICAgb3V0cHV0LnNwbGljZSgtMSwgMCwgc3BhY2UgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2wpO1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5qb2luKCcnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgc3BhY2UgKyBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlXS5jdXJyZW5jeS5zeW1ib2w7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZvcm1hdFBlcmNlbnRhZ2UgKG4sIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbikge1xuICAgICAgICB2YXIgc3BhY2UgPSAnJyxcbiAgICAgICAgICAgIG91dHB1dCxcbiAgICAgICAgICAgIHZhbHVlID0gbi5fdmFsdWUgKiAxMDA7XG5cbiAgICAgICAgLy8gY2hlY2sgZm9yIHNwYWNlIGJlZm9yZSAlXG4gICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignICUnKSA+IC0xKSB7XG4gICAgICAgICAgICBzcGFjZSA9ICcgJztcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCcgJScsICcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCclJywgJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgb3V0cHV0ID0gZm9ybWF0TnVtYmVyKHZhbHVlLCBmb3JtYXQsIHJvdW5kaW5nRnVuY3Rpb24pO1xuICAgICAgICBcbiAgICAgICAgaWYgKG91dHB1dC5pbmRleE9mKCcpJykgPiAtMSApIHtcbiAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5zcGxpdCgnJyk7XG4gICAgICAgICAgICBvdXRwdXQuc3BsaWNlKC0xLCAwLCBzcGFjZSArICclJyk7XG4gICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQuam9pbignJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQgKyBzcGFjZSArICclJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9ybWF0VGltZSAobikge1xuICAgICAgICB2YXIgaG91cnMgPSBNYXRoLmZsb29yKG4uX3ZhbHVlLzYwLzYwKSxcbiAgICAgICAgICAgIG1pbnV0ZXMgPSBNYXRoLmZsb29yKChuLl92YWx1ZSAtIChob3VycyAqIDYwICogNjApKS82MCksXG4gICAgICAgICAgICBzZWNvbmRzID0gTWF0aC5yb3VuZChuLl92YWx1ZSAtIChob3VycyAqIDYwICogNjApIC0gKG1pbnV0ZXMgKiA2MCkpO1xuICAgICAgICByZXR1cm4gaG91cnMgKyAnOicgKyAoKG1pbnV0ZXMgPCAxMCkgPyAnMCcgKyBtaW51dGVzIDogbWludXRlcykgKyAnOicgKyAoKHNlY29uZHMgPCAxMCkgPyAnMCcgKyBzZWNvbmRzIDogc2Vjb25kcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdW5mb3JtYXRUaW1lIChzdHJpbmcpIHtcbiAgICAgICAgdmFyIHRpbWVBcnJheSA9IHN0cmluZy5zcGxpdCgnOicpLFxuICAgICAgICAgICAgc2Vjb25kcyA9IDA7XG4gICAgICAgIC8vIHR1cm4gaG91cnMgYW5kIG1pbnV0ZXMgaW50byBzZWNvbmRzIGFuZCBhZGQgdGhlbSBhbGwgdXBcbiAgICAgICAgaWYgKHRpbWVBcnJheS5sZW5ndGggPT09IDMpIHtcbiAgICAgICAgICAgIC8vIGhvdXJzXG4gICAgICAgICAgICBzZWNvbmRzID0gc2Vjb25kcyArIChOdW1iZXIodGltZUFycmF5WzBdKSAqIDYwICogNjApO1xuICAgICAgICAgICAgLy8gbWludXRlc1xuICAgICAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgKyAoTnVtYmVyKHRpbWVBcnJheVsxXSkgKiA2MCk7XG4gICAgICAgICAgICAvLyBzZWNvbmRzXG4gICAgICAgICAgICBzZWNvbmRzID0gc2Vjb25kcyArIE51bWJlcih0aW1lQXJyYXlbMl0pO1xuICAgICAgICB9IGVsc2UgaWYgKHRpbWVBcnJheS5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgIC8vIG1pbnV0ZXNcbiAgICAgICAgICAgIHNlY29uZHMgPSBzZWNvbmRzICsgKE51bWJlcih0aW1lQXJyYXlbMF0pICogNjApO1xuICAgICAgICAgICAgLy8gc2Vjb25kc1xuICAgICAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgKyBOdW1iZXIodGltZUFycmF5WzFdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTnVtYmVyKHNlY29uZHMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZvcm1hdE51bWJlciAodmFsdWUsIGZvcm1hdCwgcm91bmRpbmdGdW5jdGlvbikge1xuICAgICAgICB2YXIgbmVnUCA9IGZhbHNlLFxuICAgICAgICAgICAgc2lnbmVkID0gZmFsc2UsXG4gICAgICAgICAgICBvcHREZWMgPSBmYWxzZSxcbiAgICAgICAgICAgIGFiYnIgPSAnJyxcbiAgICAgICAgICAgIGFiYnJLID0gZmFsc2UsIC8vIGZvcmNlIGFiYnJldmlhdGlvbiB0byB0aG91c2FuZHNcbiAgICAgICAgICAgIGFiYnJNID0gZmFsc2UsIC8vIGZvcmNlIGFiYnJldmlhdGlvbiB0byBtaWxsaW9uc1xuICAgICAgICAgICAgYWJickIgPSBmYWxzZSwgLy8gZm9yY2UgYWJicmV2aWF0aW9uIHRvIGJpbGxpb25zXG4gICAgICAgICAgICBhYmJyVCA9IGZhbHNlLCAvLyBmb3JjZSBhYmJyZXZpYXRpb24gdG8gdHJpbGxpb25zXG4gICAgICAgICAgICBhYmJyRm9yY2UgPSBmYWxzZSwgLy8gZm9yY2UgYWJicmV2aWF0aW9uXG4gICAgICAgICAgICBieXRlcyA9ICcnLFxuICAgICAgICAgICAgb3JkID0gJycsXG4gICAgICAgICAgICBhYnMgPSBNYXRoLmFicyh2YWx1ZSksXG4gICAgICAgICAgICBzdWZmaXhlcyA9IFsnQicsICdLQicsICdNQicsICdHQicsICdUQicsICdQQicsICdFQicsICdaQicsICdZQiddLFxuICAgICAgICAgICAgbWluLFxuICAgICAgICAgICAgbWF4LFxuICAgICAgICAgICAgcG93ZXIsXG4gICAgICAgICAgICB3LFxuICAgICAgICAgICAgcHJlY2lzaW9uLFxuICAgICAgICAgICAgdGhvdXNhbmRzLFxuICAgICAgICAgICAgZCA9ICcnLFxuICAgICAgICAgICAgbmVnID0gZmFsc2U7XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgbnVtYmVyIGlzIHplcm8gYW5kIGEgY3VzdG9tIHplcm8gZm9ybWF0IGhhcyBiZWVuIHNldFxuICAgICAgICBpZiAodmFsdWUgPT09IDAgJiYgemVyb0Zvcm1hdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHplcm9Gb3JtYXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBzZWUgaWYgd2Ugc2hvdWxkIHVzZSBwYXJlbnRoZXNlcyBmb3IgbmVnYXRpdmUgbnVtYmVyIG9yIGlmIHdlIHNob3VsZCBwcmVmaXggd2l0aCBhIHNpZ25cbiAgICAgICAgICAgIC8vIGlmIGJvdGggYXJlIHByZXNlbnQgd2UgZGVmYXVsdCB0byBwYXJlbnRoZXNlc1xuICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcoJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIG5lZ1AgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5zbGljZSgxLCAtMSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdC5pbmRleE9mKCcrJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIHNpZ25lZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoL1xcKy9nLCAnJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNlZSBpZiBhYmJyZXZpYXRpb24gaXMgd2FudGVkXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJ2EnKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgYWJicmV2aWF0aW9uIGlzIHNwZWNpZmllZFxuICAgICAgICAgICAgICAgIGFiYnJLID0gZm9ybWF0LmluZGV4T2YoJ2FLJykgPj0gMDtcbiAgICAgICAgICAgICAgICBhYmJyTSA9IGZvcm1hdC5pbmRleE9mKCdhTScpID49IDA7XG4gICAgICAgICAgICAgICAgYWJickIgPSBmb3JtYXQuaW5kZXhPZignYUInKSA+PSAwO1xuICAgICAgICAgICAgICAgIGFiYnJUID0gZm9ybWF0LmluZGV4T2YoJ2FUJykgPj0gMDtcbiAgICAgICAgICAgICAgICBhYmJyRm9yY2UgPSBhYmJySyB8fCBhYmJyTSB8fCBhYmJyQiB8fCBhYmJyVDtcblxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGZvciBzcGFjZSBiZWZvcmUgYWJicmV2aWF0aW9uXG4gICAgICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcgYScpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgYWJiciA9ICcgJztcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJyBhJywgJycpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCdhJywgJycpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChhYnMgPj0gTWF0aC5wb3coMTAsIDEyKSAmJiAhYWJickZvcmNlIHx8IGFiYnJUKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRyaWxsaW9uXG4gICAgICAgICAgICAgICAgICAgIGFiYnIgPSBhYmJyICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy50cmlsbGlvbjtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KDEwLCAxMik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhYnMgPCBNYXRoLnBvdygxMCwgMTIpICYmIGFicyA+PSBNYXRoLnBvdygxMCwgOSkgJiYgIWFiYnJGb3JjZSB8fCBhYmJyQikge1xuICAgICAgICAgICAgICAgICAgICAvLyBiaWxsaW9uXG4gICAgICAgICAgICAgICAgICAgIGFiYnIgPSBhYmJyICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy5iaWxsaW9uO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gTWF0aC5wb3coMTAsIDkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYWJzIDwgTWF0aC5wb3coMTAsIDkpICYmIGFicyA+PSBNYXRoLnBvdygxMCwgNikgJiYgIWFiYnJGb3JjZSB8fCBhYmJyTSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBtaWxsaW9uXG4gICAgICAgICAgICAgICAgICAgIGFiYnIgPSBhYmJyICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uYWJicmV2aWF0aW9ucy5taWxsaW9uO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gTWF0aC5wb3coMTAsIDYpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYWJzIDwgTWF0aC5wb3coMTAsIDYpICYmIGFicyA+PSBNYXRoLnBvdygxMCwgMykgJiYgIWFiYnJGb3JjZSB8fCBhYmJySykge1xuICAgICAgICAgICAgICAgICAgICAvLyB0aG91c2FuZFxuICAgICAgICAgICAgICAgICAgICBhYmJyID0gYWJiciArIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmFiYnJldmlhdGlvbnMudGhvdXNhbmQ7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgMyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzZWUgaWYgd2UgYXJlIGZvcm1hdHRpbmcgYnl0ZXNcbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignYicpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBmb3Igc3BhY2UgYmVmb3JlXG4gICAgICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcgYicpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZXMgPSAnICc7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKCcgYicsICcnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnYicsICcnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKHBvd2VyID0gMDsgcG93ZXIgPD0gc3VmZml4ZXMubGVuZ3RoOyBwb3dlcisrKSB7XG4gICAgICAgICAgICAgICAgICAgIG1pbiA9IE1hdGgucG93KDEwMjQsIHBvd2VyKTtcbiAgICAgICAgICAgICAgICAgICAgbWF4ID0gTWF0aC5wb3coMTAyNCwgcG93ZXIrMSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID49IG1pbiAmJiB2YWx1ZSA8IG1heCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnl0ZXMgPSBieXRlcyArIHN1ZmZpeGVzW3Bvd2VyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtaW4gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIG1pbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzZWUgaWYgb3JkaW5hbCBpcyB3YW50ZWRcbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignbycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBmb3Igc3BhY2UgYmVmb3JlXG4gICAgICAgICAgICAgICAgaWYgKGZvcm1hdC5pbmRleE9mKCcgbycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgb3JkID0gJyAnO1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQgPSBmb3JtYXQucmVwbGFjZSgnIG8nLCAnJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJ28nLCAnJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgb3JkID0gb3JkICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0ub3JkaW5hbCh2YWx1ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChmb3JtYXQuaW5kZXhPZignWy5dJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIG9wdERlYyA9IHRydWU7XG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UoJ1suXScsICcuJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHcgPSB2YWx1ZS50b1N0cmluZygpLnNwbGl0KCcuJylbMF07XG4gICAgICAgICAgICBwcmVjaXNpb24gPSBmb3JtYXQuc3BsaXQoJy4nKVsxXTtcbiAgICAgICAgICAgIHRob3VzYW5kcyA9IGZvcm1hdC5pbmRleE9mKCcsJyk7XG5cbiAgICAgICAgICAgIGlmIChwcmVjaXNpb24pIHtcbiAgICAgICAgICAgICAgICBpZiAocHJlY2lzaW9uLmluZGV4T2YoJ1snKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHByZWNpc2lvbiA9IHByZWNpc2lvbi5yZXBsYWNlKCddJywgJycpO1xuICAgICAgICAgICAgICAgICAgICBwcmVjaXNpb24gPSBwcmVjaXNpb24uc3BsaXQoJ1snKTtcbiAgICAgICAgICAgICAgICAgICAgZCA9IHRvRml4ZWQodmFsdWUsIChwcmVjaXNpb25bMF0ubGVuZ3RoICsgcHJlY2lzaW9uWzFdLmxlbmd0aCksIHJvdW5kaW5nRnVuY3Rpb24sIHByZWNpc2lvblsxXS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGQgPSB0b0ZpeGVkKHZhbHVlLCBwcmVjaXNpb24ubGVuZ3RoLCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB3ID0gZC5zcGxpdCgnLicpWzBdO1xuXG4gICAgICAgICAgICAgICAgaWYgKGQuc3BsaXQoJy4nKVsxXS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgZCA9IGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VdLmRlbGltaXRlcnMuZGVjaW1hbCArIGQuc3BsaXQoJy4nKVsxXTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG9wdERlYyAmJiBOdW1iZXIoZC5zbGljZSgxKSkgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZCA9ICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdyA9IHRvRml4ZWQodmFsdWUsIG51bGwsIHJvdW5kaW5nRnVuY3Rpb24pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBmb3JtYXQgbnVtYmVyXG4gICAgICAgICAgICBpZiAody5pbmRleE9mKCctJykgPiAtMSkge1xuICAgICAgICAgICAgICAgIHcgPSB3LnNsaWNlKDEpO1xuICAgICAgICAgICAgICAgIG5lZyA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aG91c2FuZHMgPiAtMSkge1xuICAgICAgICAgICAgICAgIHcgPSB3LnRvU3RyaW5nKCkucmVwbGFjZSgvKFxcZCkoPz0oXFxkezN9KSsoPyFcXGQpKS9nLCAnJDEnICsgbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV0uZGVsaW1pdGVycy50aG91c2FuZHMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJy4nKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHcgPSAnJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICgobmVnUCAmJiBuZWcpID8gJygnIDogJycpICsgKCghbmVnUCAmJiBuZWcpID8gJy0nIDogJycpICsgKCghbmVnICYmIHNpZ25lZCkgPyAnKycgOiAnJykgKyB3ICsgZCArICgob3JkKSA/IG9yZCA6ICcnKSArICgoYWJicikgPyBhYmJyIDogJycpICsgKChieXRlcykgPyBieXRlcyA6ICcnKSArICgobmVnUCAmJiBuZWcpID8gJyknIDogJycpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBUb3AgTGV2ZWwgRnVuY3Rpb25zXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgbnVtZXJhbCA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICBpZiAobnVtZXJhbC5pc051bWVyYWwoaW5wdXQpKSB7XG4gICAgICAgICAgICBpbnB1dCA9IGlucHV0LnZhbHVlKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5wdXQgPT09IDAgfHwgdHlwZW9mIGlucHV0ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaW5wdXQgPSAwO1xuICAgICAgICB9IGVsc2UgaWYgKCFOdW1iZXIoaW5wdXQpKSB7XG4gICAgICAgICAgICBpbnB1dCA9IG51bWVyYWwuZm4udW5mb3JtYXQoaW5wdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmFsKE51bWJlcihpbnB1dCkpO1xuICAgIH07XG5cbiAgICAvLyB2ZXJzaW9uIG51bWJlclxuICAgIG51bWVyYWwudmVyc2lvbiA9IFZFUlNJT047XG5cbiAgICAvLyBjb21wYXJlIG51bWVyYWwgb2JqZWN0XG4gICAgbnVtZXJhbC5pc051bWVyYWwgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBOdW1lcmFsO1xuICAgIH07XG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHdpbGwgbG9hZCBsYW5ndWFnZXMgYW5kIHRoZW4gc2V0IHRoZSBnbG9iYWwgbGFuZ3VhZ2UuICBJZlxuICAgIC8vIG5vIGFyZ3VtZW50cyBhcmUgcGFzc2VkIGluLCBpdCB3aWxsIHNpbXBseSByZXR1cm4gdGhlIGN1cnJlbnQgZ2xvYmFsXG4gICAgLy8gbGFuZ3VhZ2Uga2V5LlxuICAgIG51bWVyYWwubGFuZ3VhZ2UgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZXMpIHtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50TGFuZ3VhZ2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoa2V5ICYmICF2YWx1ZXMpIHtcbiAgICAgICAgICAgIGlmKCFsYW5ndWFnZXNba2V5XSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBsYW5ndWFnZSA6ICcgKyBrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3VycmVudExhbmd1YWdlID0ga2V5O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbHVlcyB8fCAhbGFuZ3VhZ2VzW2tleV0pIHtcbiAgICAgICAgICAgIGxvYWRMYW5ndWFnZShrZXksIHZhbHVlcyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVtZXJhbDtcbiAgICB9O1xuICAgIFxuICAgIC8vIFRoaXMgZnVuY3Rpb24gcHJvdmlkZXMgYWNjZXNzIHRvIHRoZSBsb2FkZWQgbGFuZ3VhZ2UgZGF0YS4gIElmXG4gICAgLy8gbm8gYXJndW1lbnRzIGFyZSBwYXNzZWQgaW4sIGl0IHdpbGwgc2ltcGx5IHJldHVybiB0aGUgY3VycmVudFxuICAgIC8vIGdsb2JhbCBsYW5ndWFnZSBvYmplY3QuXG4gICAgbnVtZXJhbC5sYW5ndWFnZURhdGEgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gbGFuZ3VhZ2VzW2N1cnJlbnRMYW5ndWFnZV07XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghbGFuZ3VhZ2VzW2tleV0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBsYW5ndWFnZSA6ICcgKyBrZXkpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gbGFuZ3VhZ2VzW2tleV07XG4gICAgfTtcblxuICAgIG51bWVyYWwubGFuZ3VhZ2UoJ2VuJywge1xuICAgICAgICBkZWxpbWl0ZXJzOiB7XG4gICAgICAgICAgICB0aG91c2FuZHM6ICcsJyxcbiAgICAgICAgICAgIGRlY2ltYWw6ICcuJ1xuICAgICAgICB9LFxuICAgICAgICBhYmJyZXZpYXRpb25zOiB7XG4gICAgICAgICAgICB0aG91c2FuZDogJ2snLFxuICAgICAgICAgICAgbWlsbGlvbjogJ20nLFxuICAgICAgICAgICAgYmlsbGlvbjogJ2InLFxuICAgICAgICAgICAgdHJpbGxpb246ICd0J1xuICAgICAgICB9LFxuICAgICAgICBvcmRpbmFsOiBmdW5jdGlvbiAobnVtYmVyKSB7XG4gICAgICAgICAgICB2YXIgYiA9IG51bWJlciAlIDEwO1xuICAgICAgICAgICAgcmV0dXJuICh+fiAobnVtYmVyICUgMTAwIC8gMTApID09PSAxKSA/ICd0aCcgOlxuICAgICAgICAgICAgICAgIChiID09PSAxKSA/ICdzdCcgOlxuICAgICAgICAgICAgICAgIChiID09PSAyKSA/ICduZCcgOlxuICAgICAgICAgICAgICAgIChiID09PSAzKSA/ICdyZCcgOiAndGgnO1xuICAgICAgICB9LFxuICAgICAgICBjdXJyZW5jeToge1xuICAgICAgICAgICAgc3ltYm9sOiAnJCdcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgbnVtZXJhbC56ZXJvRm9ybWF0ID0gZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgICAgICB6ZXJvRm9ybWF0ID0gdHlwZW9mKGZvcm1hdCkgPT09ICdzdHJpbmcnID8gZm9ybWF0IDogbnVsbDtcbiAgICB9O1xuXG4gICAgbnVtZXJhbC5kZWZhdWx0Rm9ybWF0ID0gZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgICAgICBkZWZhdWx0Rm9ybWF0ID0gdHlwZW9mKGZvcm1hdCkgPT09ICdzdHJpbmcnID8gZm9ybWF0IDogJzAuMCc7XG4gICAgfTtcblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgSGVscGVyc1xuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIGZ1bmN0aW9uIGxvYWRMYW5ndWFnZShrZXksIHZhbHVlcykge1xuICAgICAgICBsYW5ndWFnZXNba2V5XSA9IHZhbHVlcztcbiAgICB9XG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEZsb2F0aW5nLXBvaW50IGhlbHBlcnNcbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAvLyBUaGUgZmxvYXRpbmctcG9pbnQgaGVscGVyIGZ1bmN0aW9ucyBhbmQgaW1wbGVtZW50YXRpb25cbiAgICAvLyBib3Jyb3dzIGhlYXZpbHkgZnJvbSBzaW5mdWwuanM6IGh0dHA6Ly9ndWlwbi5naXRodWIuaW8vc2luZnVsLmpzL1xuXG4gICAgLyoqXG4gICAgICogQXJyYXkucHJvdG90eXBlLnJlZHVjZSBmb3IgYnJvd3NlcnMgdGhhdCBkb24ndCBzdXBwb3J0IGl0XG4gICAgICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvUmVkdWNlI0NvbXBhdGliaWxpdHlcbiAgICAgKi9cbiAgICBpZiAoJ2Z1bmN0aW9uJyAhPT0gdHlwZW9mIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UpIHtcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnJlZHVjZSA9IGZ1bmN0aW9uIChjYWxsYmFjaywgb3B0X2luaXRpYWxWYWx1ZSkge1xuICAgICAgICAgICAgJ3VzZSBzdHJpY3QnO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAobnVsbCA9PT0gdGhpcyB8fCAndW5kZWZpbmVkJyA9PT0gdHlwZW9mIHRoaXMpIHtcbiAgICAgICAgICAgICAgICAvLyBBdCB0aGUgbW9tZW50IGFsbCBtb2Rlcm4gYnJvd3NlcnMsIHRoYXQgc3VwcG9ydCBzdHJpY3QgbW9kZSwgaGF2ZVxuICAgICAgICAgICAgICAgIC8vIG5hdGl2ZSBpbXBsZW1lbnRhdGlvbiBvZiBBcnJheS5wcm90b3R5cGUucmVkdWNlLiBGb3IgaW5zdGFuY2UsIElFOFxuICAgICAgICAgICAgICAgIC8vIGRvZXMgbm90IHN1cHBvcnQgc3RyaWN0IG1vZGUsIHNvIHRoaXMgY2hlY2sgaXMgYWN0dWFsbHkgdXNlbGVzcy5cbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcnJheS5wcm90b3R5cGUucmVkdWNlIGNhbGxlZCBvbiBudWxsIG9yIHVuZGVmaW5lZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoJ2Z1bmN0aW9uJyAhPT0gdHlwZW9mIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihjYWxsYmFjayArICcgaXMgbm90IGEgZnVuY3Rpb24nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGluZGV4LFxuICAgICAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoID4+PiAwLFxuICAgICAgICAgICAgICAgIGlzVmFsdWVTZXQgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKDEgPCBhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBvcHRfaW5pdGlhbFZhbHVlO1xuICAgICAgICAgICAgICAgIGlzVmFsdWVTZXQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGluZGV4ID0gMDsgbGVuZ3RoID4gaW5kZXg7ICsraW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eShpbmRleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzVmFsdWVTZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gY2FsbGJhY2sodmFsdWUsIHRoaXNbaW5kZXhdLCBpbmRleCwgdGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHRoaXNbaW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNWYWx1ZVNldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghaXNWYWx1ZVNldCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1JlZHVjZSBvZiBlbXB0eSBhcnJheSB3aXRoIG5vIGluaXRpYWwgdmFsdWUnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIFxuICAgIC8qKlxuICAgICAqIENvbXB1dGVzIHRoZSBtdWx0aXBsaWVyIG5lY2Vzc2FyeSB0byBtYWtlIHggPj0gMSxcbiAgICAgKiBlZmZlY3RpdmVseSBlbGltaW5hdGluZyBtaXNjYWxjdWxhdGlvbnMgY2F1c2VkIGJ5XG4gICAgICogZmluaXRlIHByZWNpc2lvbi5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBtdWx0aXBsaWVyKHgpIHtcbiAgICAgICAgdmFyIHBhcnRzID0geC50b1N0cmluZygpLnNwbGl0KCcuJyk7XG4gICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPCAyKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTWF0aC5wb3coMTAsIHBhcnRzWzFdLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2l2ZW4gYSB2YXJpYWJsZSBudW1iZXIgb2YgYXJndW1lbnRzLCByZXR1cm5zIHRoZSBtYXhpbXVtXG4gICAgICogbXVsdGlwbGllciB0aGF0IG11c3QgYmUgdXNlZCB0byBub3JtYWxpemUgYW4gb3BlcmF0aW9uIGludm9sdmluZ1xuICAgICAqIGFsbCBvZiB0aGVtLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNvcnJlY3Rpb25GYWN0b3IoKSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIGFyZ3MucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBuZXh0KSB7XG4gICAgICAgICAgICB2YXIgbXAgPSBtdWx0aXBsaWVyKHByZXYpLFxuICAgICAgICAgICAgICAgIG1uID0gbXVsdGlwbGllcihuZXh0KTtcbiAgICAgICAgcmV0dXJuIG1wID4gbW4gPyBtcCA6IG1uO1xuICAgICAgICB9LCAtSW5maW5pdHkpO1xuICAgIH0gICAgICAgIFxuXG5cbiAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIE51bWVyYWwgUHJvdG90eXBlXG4gICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICBudW1lcmFsLmZuID0gTnVtZXJhbC5wcm90b3R5cGUgPSB7XG5cbiAgICAgICAgY2xvbmUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVtZXJhbCh0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBmb3JtYXQgOiBmdW5jdGlvbiAoaW5wdXRTdHJpbmcsIHJvdW5kaW5nRnVuY3Rpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXROdW1lcmFsKHRoaXMsIFxuICAgICAgICAgICAgICAgICAgaW5wdXRTdHJpbmcgPyBpbnB1dFN0cmluZyA6IGRlZmF1bHRGb3JtYXQsIFxuICAgICAgICAgICAgICAgICAgKHJvdW5kaW5nRnVuY3Rpb24gIT09IHVuZGVmaW5lZCkgPyByb3VuZGluZ0Z1bmN0aW9uIDogTWF0aC5yb3VuZFxuICAgICAgICAgICAgICApO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVuZm9ybWF0IDogZnVuY3Rpb24gKGlucHV0U3RyaW5nKSB7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGlucHV0U3RyaW5nKSA9PT0gJ1tvYmplY3QgTnVtYmVyXScpIHsgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlucHV0U3RyaW5nOyBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB1bmZvcm1hdE51bWVyYWwodGhpcywgaW5wdXRTdHJpbmcgPyBpbnB1dFN0cmluZyA6IGRlZmF1bHRGb3JtYXQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHZhbHVlIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIHZhbHVlT2YgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0IDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IE51bWJlcih2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBhZGQgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBjb3JyRmFjdG9yID0gY29ycmVjdGlvbkZhY3Rvci5jYWxsKG51bGwsIHRoaXMuX3ZhbHVlLCB2YWx1ZSk7XG4gICAgICAgICAgICBmdW5jdGlvbiBjYmFjayhhY2N1bSwgY3VyciwgY3VyckksIE8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWNjdW0gKyBjb3JyRmFjdG9yICogY3VycjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gW3RoaXMuX3ZhbHVlLCB2YWx1ZV0ucmVkdWNlKGNiYWNrLCAwKSAvIGNvcnJGYWN0b3I7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBzdWJ0cmFjdCA6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIGNvcnJGYWN0b3IgPSBjb3JyZWN0aW9uRmFjdG9yLmNhbGwobnVsbCwgdGhpcy5fdmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNiYWNrKGFjY3VtLCBjdXJyLCBjdXJySSwgTykge1xuICAgICAgICAgICAgICAgIHJldHVybiBhY2N1bSAtIGNvcnJGYWN0b3IgKiBjdXJyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSBbdmFsdWVdLnJlZHVjZShjYmFjaywgdGhpcy5fdmFsdWUgKiBjb3JyRmFjdG9yKSAvIGNvcnJGYWN0b3I7ICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBtdWx0aXBseSA6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgZnVuY3Rpb24gY2JhY2soYWNjdW0sIGN1cnIsIGN1cnJJLCBPKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvcnJGYWN0b3IgPSBjb3JyZWN0aW9uRmFjdG9yKGFjY3VtLCBjdXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGFjY3VtICogY29yckZhY3RvcikgKiAoY3VyciAqIGNvcnJGYWN0b3IpIC9cbiAgICAgICAgICAgICAgICAgICAgKGNvcnJGYWN0b3IgKiBjb3JyRmFjdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gW3RoaXMuX3ZhbHVlLCB2YWx1ZV0ucmVkdWNlKGNiYWNrLCAxKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRpdmlkZSA6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgZnVuY3Rpb24gY2JhY2soYWNjdW0sIGN1cnIsIGN1cnJJLCBPKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvcnJGYWN0b3IgPSBjb3JyZWN0aW9uRmFjdG9yKGFjY3VtLCBjdXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGFjY3VtICogY29yckZhY3RvcikgLyAoY3VyciAqIGNvcnJGYWN0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSBbdGhpcy5fdmFsdWUsIHZhbHVlXS5yZWR1Y2UoY2JhY2spOyAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGlmZmVyZW5jZSA6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGguYWJzKG51bWVyYWwodGhpcy5fdmFsdWUpLnN1YnRyYWN0KHZhbHVlKS52YWx1ZSgpKTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRXhwb3NpbmcgTnVtZXJhbFxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIC8vIENvbW1vbkpTIG1vZHVsZSBpcyBkZWZpbmVkXG4gICAgaWYgKGhhc01vZHVsZSkge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IG51bWVyYWw7XG4gICAgfVxuXG4gICAgLypnbG9iYWwgZW5kZXI6ZmFsc2UgKi9cbiAgICBpZiAodHlwZW9mIGVuZGVyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAvLyBoZXJlLCBgdGhpc2AgbWVhbnMgYHdpbmRvd2AgaW4gdGhlIGJyb3dzZXIsIG9yIGBnbG9iYWxgIG9uIHRoZSBzZXJ2ZXJcbiAgICAgICAgLy8gYWRkIGBudW1lcmFsYCBhcyBhIGdsb2JhbCBvYmplY3QgdmlhIGEgc3RyaW5nIGlkZW50aWZpZXIsXG4gICAgICAgIC8vIGZvciBDbG9zdXJlIENvbXBpbGVyICdhZHZhbmNlZCcgbW9kZVxuICAgICAgICB0aGlzWydudW1lcmFsJ10gPSBudW1lcmFsO1xuICAgIH1cblxuICAgIC8qZ2xvYmFsIGRlZmluZTpmYWxzZSAqL1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVtZXJhbDtcbiAgICAgICAgfSk7XG4gICAgfVxufSkuY2FsbCh0aGlzKTtcbiIsIi8qKiBDYWxlbmRhciBhY3Rpdml0eSAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpLFxyXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcclxucmVxdWlyZSgnLi4vY29tcG9uZW50cy9EYXRlUGlja2VyJyk7XHJcblxyXG52YXIgc2luZ2xldG9uID0gbnVsbDtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRBcHBvaW50bWVudCgkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXHJcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IEFwcG9pbnRtZW50QWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xyXG4gICAgXHJcbiAgICByZXR1cm4gc2luZ2xldG9uO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gQXBwb2ludG1lbnRBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuUHJvdmlkZXI7XHJcbiAgICBcclxuICAgIC8qIEdldHRpbmcgZWxlbWVudHMgKi9cclxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xyXG4gICAgdGhpcy4kYXBwb2ludG1lbnRWaWV3ID0gJGFjdGl2aXR5LmZpbmQoJyNjYWxlbmRhckFwcG9pbnRtZW50VmlldycpO1xyXG4gICAgdGhpcy4kY2hvb3NlTmV3ID0gJCgnI2NhbGVuZGFyQ2hvb3NlTmV3Jyk7XHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuICAgIFxyXG4gICAgLy8gT2JqZWN0IHRvIGhvbGQgdGhlIG9wdGlvbnMgcGFzc2VkIG9uICdzaG93JyBhcyBhIHJlc3VsdFxyXG4gICAgLy8gb2YgYSByZXF1ZXN0IGZyb20gYW5vdGhlciBhY3Rpdml0eVxyXG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XHJcbiAgICBcclxuICAgIHRoaXMubmF2QWN0aW9uID0gTmF2QWN0aW9uLm5ld0NhbGVuZGFySXRlbTtcclxuICAgIFxyXG4gICAgdGhpcy5pbml0QXBwb2ludG1lbnQoKTtcclxuICAgIFxyXG4gICAgdGhpcy5hcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50QXBwb2ludG1lbnQuc3Vic2NyaWJlKGZ1bmN0aW9uIChhcHQpIHtcclxuICAgICAgICAvLyBVcGRhdGUgVVJMIHRvIG1hdGNoIHRoZSBhcHBvaW50bWVudCBJRCBhbmRcclxuICAgICAgICAvLyB0cmFjayBpdCBzdGF0ZVxyXG4gICAgICAgIC8vIEdldCBJRCBmcm9tIFVSTCwgdG8gYXZvaWQgZG8gYW55dGhpbmcgaWYgdGhlIHNhbWUuXHJcbiAgICAgICAgdmFyIGFwdElkID0gYXB0LmlkKCk7XHJcbiAgICAgICAgdmFyIHVybElkID0gL2FwcG9pbnRtZW50XFwvKFxcZCspL2kudGVzdCh3aW5kb3cubG9jYXRpb24pO1xyXG4gICAgICAgIHVybElkID0gdXJsSWQgJiYgdXJsSWRbMV0gfHwgJyc7XHJcbiAgICAgICAgaWYgKHVybElkICE9PSBhcHRJZC50b1N0cmluZygpKSB7XHJcbiAgICAgICAgICAgIC8vIFRPRE86IHNhdmUgYSB1c2VmdWwgc3RhdGVcclxuICAgICAgICAgICAgYXBwLnNoZWxsLmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsICdhcHBvaW50bWVudC8nICsgYXB0SWQudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbkFwcG9pbnRtZW50QWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcclxuICAgIC8qIGpzaGludCBtYXhjb21wbGV4aXR5OjEwICovXHJcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIFxyXG4gICAgLy8gSWYgdGhlcmUgYXJlIG9wdGlvbnMgKHRoZXJlIGFyZSBub3Qgb24gc3RhcnR1cCBvclxyXG4gICAgLy8gb24gY2FuY2VsbGVkIGVkaXRpb24pLlxyXG4gICAgLy8gQW5kIGl0IGNvbWVzIGJhY2sgZnJvbSB0aGUgdGV4dEVkaXRvci5cclxuICAgIGlmIChvcHRpb25zICE9PSBudWxsKSB7XHJcblxyXG4gICAgICAgIHZhciBib29raW5nID0gdGhpcy5hcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50QXBwb2ludG1lbnQoKTtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMucmVxdWVzdCA9PT0gJ3RleHRFZGl0b3InICYmIGJvb2tpbmcpIHtcclxuXHJcbiAgICAgICAgICAgIGJvb2tpbmdbb3B0aW9ucy5maWVsZF0ob3B0aW9ucy50ZXh0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAob3B0aW9ucy5zZWxlY3RDbGllbnQgPT09IHRydWUgJiYgYm9va2luZykge1xyXG5cclxuICAgICAgICAgICAgYm9va2luZy5jbGllbnQob3B0aW9ucy5zZWxlY3RlZENsaWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZihvcHRpb25zLnNlbGVjdGVkRGF0ZXRpbWUpICE9PSAndW5kZWZpbmVkJyAmJiBib29raW5nKSB7XHJcblxyXG4gICAgICAgICAgICBib29raW5nLnN0YXJ0VGltZShvcHRpb25zLnNlbGVjdGVkRGF0ZXRpbWUpO1xyXG4gICAgICAgICAgICAvLyBUT0RPIENhbGN1bGF0ZSB0aGUgZW5kVGltZSBnaXZlbiBhbiBhcHBvaW50bWVudCBkdXJhdGlvbiwgcmV0cmlldmVkIGZyb20gdGhlXHJcbiAgICAgICAgICAgIC8vIHNlbGVjdGVkIHNlcnZpY2VcclxuICAgICAgICAgICAgLy92YXIgZHVyYXRpb24gPSBib29raW5nLnByaWNpbmcgJiYgYm9va2luZy5wcmljaW5nLmR1cmF0aW9uO1xyXG4gICAgICAgICAgICAvLyBPciBieSBkZWZhdWx0IChpZiBubyBwcmljaW5nIHNlbGVjdGVkIG9yIGFueSkgdGhlIHVzZXIgcHJlZmVycmVkXHJcbiAgICAgICAgICAgIC8vIHRpbWUgZ2FwXHJcbiAgICAgICAgICAgIC8vZHVyYXRpb24gPSBkdXJhdGlvbiB8fCB1c2VyLnByZWZlcmVuY2VzLnRpbWVTbG90c0dhcDtcclxuICAgICAgICAgICAgLy8gUFJPVE9UWVBFOlxyXG4gICAgICAgICAgICB2YXIgZHVyYXRpb24gPSA2MDsgLy8gbWludXRlc1xyXG4gICAgICAgICAgICBib29raW5nLmVuZFRpbWUobW9tZW50KGJvb2tpbmcuc3RhcnRUaW1lKCkpLmFkZChkdXJhdGlvbiwgJ21pbnV0ZXMnKS50b0RhdGUoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKG9wdGlvbnMuc2VsZWN0U2VydmljZXMgPT09IHRydWUgJiYgYm9va2luZykge1xyXG5cclxuICAgICAgICAgICAgYm9va2luZy5zZXJ2aWNlcyhvcHRpb25zLnNlbGVjdGVkU2VydmljZXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChvcHRpb25zLnNlbGVjdExvY2F0aW9uID09PSB0cnVlICYmIGJvb2tpbmcpIHtcclxuXHJcbiAgICAgICAgICAgIGJvb2tpbmcubG9jYXRpb24ob3B0aW9ucy5zZWxlY3RlZExvY2F0aW9uKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHZhciBhcHRJZCA9IG9wdGlvbnMgJiYgb3B0aW9ucy5hcHBvaW50bWVudElkO1xyXG4gICAgaWYgKGFwdElkICYmIG9wdGlvbnMucm91dGUuc2VnbWVudHNbMF0gIT09IGFwdElkLnRvU3RyaW5nKCkpIHtcclxuICAgICAgICAvLyBVcGRhdGUgVVJMIHRvIG1hdGNoIElEXHJcbiAgICAgICAgZGVsZXRlIG9wdGlvbnMuYXBwb2ludG1lbnRJZDtcclxuICAgICAgICB0aGlzLmFwcC5zaGVsbC5oaXN0b3J5LnJlcGxhY2VTdGF0ZShvcHRpb25zLCBudWxsLCAnYXBwb2ludG1lbnQvJyArIGFwdElkLnRvU3RyaW5nKCkpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5zaG93QXBwb2ludG1lbnQoYXB0SWQpO1xyXG59O1xyXG5cclxudmFyIEFwcG9pbnRtZW50ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0FwcG9pbnRtZW50Jyk7XHJcblxyXG5BcHBvaW50bWVudEFjdGl2aXR5LnByb3RvdHlwZS5zaG93QXBwb2ludG1lbnQgPSBmdW5jdGlvbiBzaG93QXBwb2ludG1lbnQoYXB0SWQpIHtcclxuICAgIC8qanNoaW50IG1heHN0YXRlbWVudHM6MzYqL1xyXG4gICAgXHJcbiAgICBpZiAoYXB0SWQpIHtcclxuICAgICAgICAvLyBUT0RPOiBzZWxlY3QgYXBwb2ludG1lbnQgJ2FwdElkJ1xyXG4gICAgICAgIFxyXG5cclxuICAgIH0gZWxzZSBpZiAoYXB0SWQgPT09IDApIHtcclxuICAgICAgICB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3Lm5ld0FwcG9pbnRtZW50KG5ldyBBcHBvaW50bWVudCgpKTtcclxuICAgICAgICB0aGlzLmFwcG9pbnRtZW50c0RhdGFWaWV3LmVkaXRNb2RlKHRydWUpOyAgICAgICAgXHJcbiAgICB9XHJcbn07XHJcblxyXG5BcHBvaW50bWVudEFjdGl2aXR5LnByb3RvdHlwZS5pbml0QXBwb2ludG1lbnQgPSBmdW5jdGlvbiBpbml0QXBwb2ludG1lbnQoKSB7XHJcbiAgICBpZiAoIXRoaXMuX19pbml0ZWRBcHBvaW50bWVudCkge1xyXG4gICAgICAgIHRoaXMuX19pbml0ZWRBcHBvaW50bWVudCA9IHRydWU7XHJcblxyXG4gICAgICAgIHZhciBhcHAgPSB0aGlzLmFwcDtcclxuICAgICAgICBcclxuICAgICAgICAvLyBEYXRhXHJcbiAgICAgICAgdmFyIHRlc3REYXRhID0gcmVxdWlyZSgnLi4vdGVzdGRhdGEvY2FsZW5kYXJBcHBvaW50bWVudHMnKS5hcHBvaW50bWVudHM7XHJcbiAgICAgICAgdmFyIGFwcG9pbnRtZW50c0RhdGFWaWV3ID0ge1xyXG4gICAgICAgICAgICBhcHBvaW50bWVudHM6IGtvLm9ic2VydmFibGVBcnJheSh0ZXN0RGF0YSksXHJcbiAgICAgICAgICAgIGN1cnJlbnRJbmRleDoga28ub2JzZXJ2YWJsZSgwKSxcclxuICAgICAgICAgICAgZWRpdE1vZGU6IGtvLm9ic2VydmFibGUoZmFsc2UpLFxyXG4gICAgICAgICAgICBuZXdBcHBvaW50bWVudDoga28ub2JzZXJ2YWJsZShudWxsKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5hcHBvaW50bWVudHNEYXRhVmlldyA9IGFwcG9pbnRtZW50c0RhdGFWaWV3O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmlzTmV3ID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV3QXBwb2ludG1lbnQoKSAhPT0gbnVsbDtcclxuICAgICAgICB9LCBhcHBvaW50bWVudHNEYXRhVmlldyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50ID0ga28uY29tcHV0ZWQoe1xyXG4gICAgICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzTmV3KCkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5uZXdBcHBvaW50bWVudCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXBwb2ludG1lbnRzKClbdGhpcy5jdXJyZW50SW5kZXgoKSAlIHRoaXMuYXBwb2ludG1lbnRzKCkubGVuZ3RoXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgd3JpdGU6IGZ1bmN0aW9uKGFwdCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5jdXJyZW50SW5kZXgoKSAlIHRoaXMuYXBwb2ludG1lbnRzKCkubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBvaW50bWVudHMoKVtpbmRleF0gPSBhcHQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50cy52YWx1ZUhhc011dGF0ZWQoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgb3duZXI6IGFwcG9pbnRtZW50c0RhdGFWaWV3XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcub3JpZ2luYWxFZGl0ZWRBcHBvaW50bWVudCA9IHt9O1xyXG4gXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuZ29QcmV2aW91cyA9IGZ1bmN0aW9uIGdvUHJldmlvdXMoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmVkaXRNb2RlKCkpIHJldHVybjtcclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudEluZGV4KCkgPT09IDApXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCh0aGlzLmFwcG9pbnRtZW50cygpLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCgodGhpcy5jdXJyZW50SW5kZXgoKSAtIDEpICUgdGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGgpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuZ29OZXh0ID0gZnVuY3Rpb24gZ29OZXh0KCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5lZGl0TW9kZSgpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRJbmRleCgodGhpcy5jdXJyZW50SW5kZXgoKSArIDEpICUgdGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGgpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LmVkaXQgPSBmdW5jdGlvbiBlZGl0KCkge1xyXG4gICAgICAgICAgICB0aGlzLmVkaXRNb2RlKHRydWUpO1xyXG4gICAgICAgIH0uYmluZChhcHBvaW50bWVudHNEYXRhVmlldyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKCkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gaWYgaXMgbmV3LCBkaXNjYXJkXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzTmV3KCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV3QXBwb2ludG1lbnQobnVsbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyByZXZlcnQgY2hhbmdlc1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50QXBwb2ludG1lbnQobmV3IEFwcG9pbnRtZW50KHRoaXMub3JpZ2luYWxFZGl0ZWRBcHBvaW50bWVudCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmVkaXRNb2RlKGZhbHNlKTtcclxuICAgICAgICB9LmJpbmQoYXBwb2ludG1lbnRzRGF0YVZpZXcpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgICAgICAgICAvLyBJZiBpcyBhIG5ldyBvbmUsIGFkZCBpdCB0byB0aGUgY29sbGVjdGlvblxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc05ldygpKSB7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHZhciBuZXdBcHQgPSB0aGlzLm5ld0FwcG9pbnRtZW50KCk7XHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBzb21lIGZpZWRzIG5lZWQgc29tZSBraW5kIG9mIGNhbGN1bGF0aW9uIHRoYXQgaXMgcGVyc2lzdGVkXHJcbiAgICAgICAgICAgICAgICAvLyBzb24gY2Fubm90IGJlIGNvbXB1dGVkLiBTaW11bGF0ZWQ6XHJcbiAgICAgICAgICAgICAgICBuZXdBcHQuc3VtbWFyeSgnTWFzc2FnZSBUaGVyYXBpc3QgQm9va2luZycpO1xyXG4gICAgICAgICAgICAgICAgbmV3QXB0LmlkKDQpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgdG8gdGhlIGxpc3Q6XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcG9pbnRtZW50cy5wdXNoKG5ld0FwdCk7XHJcbiAgICAgICAgICAgICAgICAvLyBub3csIHJlc2V0XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5ld0FwcG9pbnRtZW50KG51bGwpO1xyXG4gICAgICAgICAgICAgICAgLy8gY3VycmVudCBpbmRleCBtdXN0IGJlIHRoZSBqdXN0LWFkZGVkIGFwdFxyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50SW5kZXgodGhpcy5hcHBvaW50bWVudHMoKS5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gT24gYWRkaW5nIGEgbmV3IG9uZSwgdGhlIGNvbmZpcm1hdGlvbiBwYWdlIG11c3QgYmUgc2hvd2VkXHJcbiAgICAgICAgICAgICAgICBhcHAuc2hlbGwuZ28oJ2Jvb2tpbmdDb25maXJtYXRpb24nLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgYm9va2luZzogbmV3QXB0XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5lZGl0TW9kZShmYWxzZSk7XHJcbiAgICAgICAgfS5iaW5kKGFwcG9pbnRtZW50c0RhdGFWaWV3KTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5lZGl0TW9kZS5zdWJzY3JpYmUoZnVuY3Rpb24oaXNFZGl0KSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLiRhY3Rpdml0eS50b2dnbGVDbGFzcygnaW4tZWRpdCcsIGlzRWRpdCk7XHJcbiAgICAgICAgICAgIHRoaXMuJGFwcG9pbnRtZW50Vmlldy5maW5kKCcuQXBwb2ludG1lbnRDYXJkJykudG9nZ2xlQ2xhc3MoJ2luLWVkaXQnLCBpc0VkaXQpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGlzRWRpdCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGEgY29weSBvZiB0aGUgYXBwb2ludG1lbnQgc28gd2UgcmV2ZXJ0IG9uICdjYW5jZWwnXHJcbiAgICAgICAgICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5vcmlnaW5hbEVkaXRlZEFwcG9pbnRtZW50ID0gXHJcbiAgICAgICAgICAgICAgICAgICAga28udG9KUyhhcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50QXBwb2ludG1lbnQoKSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgbmF2QWN0aW9uXHJcbiAgICAgICAgICAgICAgICBhcHAubmF2QWN0aW9uKG51bGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gUmVzdG9yZSB0aGUgbmF2QWN0aW9uXHJcbiAgICAgICAgICAgICAgICBhcHAubmF2QWN0aW9uKHRoaXMubmF2QWN0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFwcG9pbnRtZW50c0RhdGFWaWV3LnBpY2tEYXRlVGltZSA9IGZ1bmN0aW9uIHBpY2tEYXRlVGltZSgpIHtcclxuXHJcbiAgICAgICAgICAgIGFwcC5zaGVsbC5nbygnZGF0ZXRpbWVQaWNrZXInLCB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RlZERhdGV0aW1lOiBudWxsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcucGlja0NsaWVudCA9IGZ1bmN0aW9uIHBpY2tDbGllbnQoKSB7XHJcblxyXG4gICAgICAgICAgICBhcHAuc2hlbGwuZ28oJ2NsaWVudHMnLCB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RDbGllbnQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzZWxlY3RlZENsaWVudDogbnVsbFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5waWNrU2VydmljZSA9IGZ1bmN0aW9uIHBpY2tTZXJ2aWNlKCkge1xyXG5cclxuICAgICAgICAgICAgYXBwLnNoZWxsLmdvKCdzZXJ2aWNlcycsIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdFNlcnZpY2VzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRTZXJ2aWNlczogYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50KCkuc2VydmljZXMoKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5jaGFuZ2VQcmljZSA9IGZ1bmN0aW9uIGNoYW5nZVByaWNlKCkge1xyXG4gICAgICAgICAgICAvLyBUT0RPXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5waWNrTG9jYXRpb24gPSBmdW5jdGlvbiBwaWNrTG9jYXRpb24oKSB7XHJcblxyXG4gICAgICAgICAgICBhcHAuc2hlbGwuZ28oJ2xvY2F0aW9ucycsIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdExvY2F0aW9uOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRMb2NhdGlvbjogYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudEFwcG9pbnRtZW50KCkubG9jYXRpb24oKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgdGV4dEZpZWxkc0hlYWRlcnMgPSB7XHJcbiAgICAgICAgICAgIHByZU5vdGVzVG9DbGllbnQ6ICdOb3RlcyB0byBjbGllbnQnLFxyXG4gICAgICAgICAgICBwb3N0Tm90ZXNUb0NsaWVudDogJ05vdGVzIHRvIGNsaWVudCAoYWZ0ZXJ3YXJkcyknLFxyXG4gICAgICAgICAgICBwcmVOb3Rlc1RvU2VsZjogJ05vdGVzIHRvIHNlbGYnLFxyXG4gICAgICAgICAgICBwb3N0Tm90ZXNUb1NlbGY6ICdCb29raW5nIHN1bW1hcnknXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBhcHBvaW50bWVudHNEYXRhVmlldy5lZGl0VGV4dEZpZWxkID0gZnVuY3Rpb24gZWRpdFRleHRGaWVsZChmaWVsZCkge1xyXG5cclxuICAgICAgICAgICAgYXBwLnNoZWxsLmdvKCd0ZXh0RWRpdG9yJywge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdDogJ3RleHRFZGl0b3InLFxyXG4gICAgICAgICAgICAgICAgZmllbGQ6IGZpZWxkLFxyXG4gICAgICAgICAgICAgICAgaGVhZGVyOiB0ZXh0RmllbGRzSGVhZGVyc1tmaWVsZF0sXHJcbiAgICAgICAgICAgICAgICB0ZXh0OiBhcHBvaW50bWVudHNEYXRhVmlldy5jdXJyZW50QXBwb2ludG1lbnQoKVtmaWVsZF0oKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LmJpbmQodGhpcyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcucmV0dXJuVG9DYWxlbmRhciA9IGZ1bmN0aW9uIHJldHVyblRvQ2FsZW5kYXIoKSB7XHJcbiAgICAgICAgICAgIC8vIFdlIGhhdmUgYSByZXF1ZXN0XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnJlcXVlc3RJbmZvKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUGFzcyB0aGUgY3VycmVudCBkYXRlXHJcbiAgICAgICAgICAgICAgICB2YXIgZGF0ZSA9IHRoaXMuYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudERhdGUoKTtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRlKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8uZGF0ZSA9IGRhdGU7XHJcbiAgICAgICAgICAgICAgICAvLyBBbmQgZ28gYmFja1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ28oJ2NhbGVuZGFyJywgdGhpcy5yZXF1ZXN0SW5mbyk7XHJcbiAgICAgICAgICAgICAgICAvLyBMYXN0LCBjbGVhciByZXF1ZXN0SW5mb1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LmJpbmQodGhpcyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXBwb2ludG1lbnRzRGF0YVZpZXcuY3VycmVudERhdGUgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBhcHQgPSB0aGlzLmN1cnJlbnRBcHBvaW50bWVudCgpLFxyXG4gICAgICAgICAgICAgICAganVzdERhdGUgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgaWYgKGFwdCAmJiBhcHQuc3RhcnRUaW1lKCkpXHJcbiAgICAgICAgICAgICAgICBqdXN0RGF0ZSA9IG1vbWVudChhcHQuc3RhcnRUaW1lKCkpLmhvdXJzKDApLm1pbnV0ZXMoMCkuc2Vjb25kcygwKS50b0RhdGUoKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiBqdXN0RGF0ZTtcclxuICAgICAgICB9LCBhcHBvaW50bWVudHNEYXRhVmlldyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAga28uYXBwbHlCaW5kaW5ncyhhcHBvaW50bWVudHNEYXRhVmlldywgdGhpcy4kYWN0aXZpdHkuZ2V0KDApKTtcclxuICAgIH1cclxufTtcclxuIiwiLyoqXHJcbiAgICBib29raW5nQ29uZmlybWF0aW9uIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG4gICAgXHJcbnZhciBzaW5nbGV0b24gPSBudWxsO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdENsaWVudHMoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxyXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBCb29raW5nQ29uZmlybWF0aW9uQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xyXG4gICAgXHJcbiAgICByZXR1cm4gc2luZ2xldG9uO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gQm9va2luZ0NvbmZpcm1hdGlvbkFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xyXG4gICAgXHJcbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcclxuICAgIHRoaXMuYXBwID0gYXBwO1xyXG5cclxuICAgIHRoaXMuZGF0YVZpZXcgPSBuZXcgVmlld01vZGVsKCk7XHJcbiAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMuZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xyXG59XHJcblxyXG5Cb29raW5nQ29uZmlybWF0aW9uQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcclxuXHJcbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmJvb2tpbmcpXHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5ib29raW5nKG9wdGlvbnMuYm9va2luZyk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XHJcblxyXG4gICAgLy8gOkFwcG9pbnRtZW50XHJcbiAgICB0aGlzLmJvb2tpbmcgPSBrby5vYnNlcnZhYmxlKG51bGwpO1xyXG59XHJcbiIsIi8qKiBDYWxlbmRhciBhY3Rpdml0eSAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5yZXF1aXJlKCcuLi9jb21wb25lbnRzL0RhdGVQaWNrZXInKTtcclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxudmFyIENhbGVuZGFyU2xvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9DYWxlbmRhclNsb3QnKSxcclxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyk7XHJcblxyXG52YXIgc2luZ2xldG9uID0gbnVsbDtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRDYWxlbmRhcigkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXHJcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IENhbGVuZGFyQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xyXG4gICAgXHJcbiAgICByZXR1cm4gc2luZ2xldG9uO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gQ2FsZW5kYXJBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcclxuICAgIFxyXG4gICAgLyogR2V0dGluZyBlbGVtZW50cyAqL1xyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLiRkYXRlcGlja2VyID0gJGFjdGl2aXR5LmZpbmQoJyNjYWxlbmRhckRhdGVQaWNrZXInKTtcclxuICAgIHRoaXMuJGRhaWx5VmlldyA9ICRhY3Rpdml0eS5maW5kKCcjY2FsZW5kYXJEYWlseVZpZXcnKTtcclxuICAgIHRoaXMuJGRhdGVIZWFkZXIgPSAkYWN0aXZpdHkuZmluZCgnI2NhbGVuZGFyRGF0ZUhlYWRlcicpO1xyXG4gICAgdGhpcy4kZGF0ZVRpdGxlID0gdGhpcy4kZGF0ZUhlYWRlci5jaGlsZHJlbignLkNhbGVuZGFyRGF0ZUhlYWRlci1kYXRlJyk7XHJcbiAgICB0aGlzLiRjaG9vc2VOZXcgPSAkKCcjY2FsZW5kYXJDaG9vc2VOZXcnKTtcclxuICAgIHRoaXMuYXBwID0gYXBwO1xyXG4gICAgXHJcbiAgICAvKiBJbml0IGNvbXBvbmVudHMgKi9cclxuICAgIHRoaXMuJGRhdGVwaWNrZXIuc2hvdygpLmRhdGVwaWNrZXIoKTtcclxuXHJcbiAgICAvLyBEYXRhXHJcbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xyXG4gICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLmRhdGFWaWV3LCAkYWN0aXZpdHkuZ2V0KDApKTtcclxuXHJcbiAgICAvLyBUZXN0aW5nIGRhdGFcclxuICAgIHRoaXMuZGF0YVZpZXcuc2xvdHNEYXRhKHJlcXVpcmUoJy4uL3Rlc3RkYXRhL2NhbGVuZGFyU2xvdHMnKS5jYWxlbmRhcik7XHJcbiAgICBcclxuICAgIC8vIE9iamVjdCB0byBob2xkIHRoZSBvcHRpb25zIHBhc3NlZCBvbiAnc2hvdycgYXMgYSByZXN1bHRcclxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG5cclxuICAgIC8qIEV2ZW50IGhhbmRsZXJzICovXHJcbiAgICAvLyBVcGRhdGUgZGF0ZXBpY2tlciBzZWxlY3RlZCBkYXRlIG9uIGRhdGUgY2hhbmdlIChmcm9tIFxyXG4gICAgLy8gYSBkaWZmZXJlbnQgc291cmNlIHRoYW4gdGhlIGRhdGVwaWNrZXIgaXRzZWxmXHJcbiAgICB0aGlzLmRhdGFWaWV3LmN1cnJlbnREYXRlLnN1YnNjcmliZShmdW5jdGlvbihkYXRlKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIG1kYXRlID0gbW9tZW50KGRhdGUpO1xyXG5cclxuICAgICAgICB0aGlzLiRkYXRlcGlja2VyLnJlbW92ZUNsYXNzKCdpcy12aXNpYmxlJyk7XHJcbiAgICAgICAgLy8gQ2hhbmdlIG5vdCBmcm9tIHRoZSB3aWRnZXQ/XHJcbiAgICAgICAgaWYgKHRoaXMuJGRhdGVwaWNrZXIuZGF0ZXBpY2tlcignZ2V0VmFsdWUnKS50b0lTT1N0cmluZygpICE9PSBtZGF0ZS50b0lTT1N0cmluZygpKVxyXG4gICAgICAgICAgICB0aGlzLiRkYXRlcGlja2VyLmRhdGVwaWNrZXIoJ3NldFZhbHVlJywgZGF0ZSwgdHJ1ZSk7XHJcblxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAvLyBTd2lwZSBkYXRlIG9uIGdlc3R1cmVcclxuICAgIHRoaXMuJGRhaWx5Vmlld1xyXG4gICAgLm9uKCdzd2lwZWxlZnQgc3dpcGVyaWdodCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRpciA9IGUudHlwZSA9PT0gJ3N3aXBlbGVmdCcgPyAnbmV4dCcgOiAncHJldic7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSGFjayB0byBzb2x2ZSB0aGUgZnJlZXp5LXN3aXBlIGFuZCB0YXAtYWZ0ZXIgYnVnIG9uIEpRTTpcclxuICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCd0b3VjaGVuZCcpO1xyXG4gICAgICAgIC8vIENoYW5nZSBkYXRlXHJcbiAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCBkaXIsICdkYXRlJyk7XHJcblxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIFxyXG4gICAgLy8gQ2hhbmdpbmcgZGF0ZSB3aXRoIGJ1dHRvbnM6XHJcbiAgICB0aGlzLiRkYXRlSGVhZGVyLm9uKCd0YXAnLCAnLkNhbGVuZGFyRGF0ZUhlYWRlci1zd2l0Y2gnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgc3dpdGNoIChlLmN1cnJlbnRUYXJnZXQuZ2V0QXR0cmlidXRlKCdocmVmJykpIHtcclxuICAgICAgICAgICAgY2FzZSAnI3ByZXYnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCAncHJldicsICdkYXRlJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnI25leHQnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci5kYXRlcGlja2VyKCdtb3ZlVmFsdWUnLCAnbmV4dCcsICdkYXRlJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIC8vIExldHMgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIC8vIFNob3dpbmcgZGF0ZXBpY2tlciB3aGVuIHByZXNzaW5nIHRoZSB0aXRsZVxyXG4gICAgdGhpcy4kZGF0ZVRpdGxlLm9uKCd0YXAnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdGhpcy4kZGF0ZXBpY2tlci50b2dnbGVDbGFzcygnaXMtdmlzaWJsZScpO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAvLyBVcGRhdGluZyB2aWV3IGRhdGUgd2hlbiBwaWNrZWQgYW5vdGhlciBvbmVcclxuICAgIHRoaXMuJGRhdGVwaWNrZXIub24oJ2NoYW5nZURhdGUnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgaWYgKGUudmlld01vZGUgPT09ICdkYXlzJykge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmN1cnJlbnREYXRlKGUuZGF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIFxyXG4gICAgLy8gU2V0IGRhdGUgdG8gbWF0Y2ggZGF0ZXBpY2tlciBmb3IgZmlyc3QgdXBkYXRlXHJcbiAgICB0aGlzLmRhdGFWaWV3LmN1cnJlbnREYXRlKHRoaXMuJGRhdGVwaWNrZXIuZGF0ZXBpY2tlcignZ2V0VmFsdWUnKSk7XHJcbiAgICBcclxuICAgIHRoaXMubmF2QWN0aW9uID0gTmF2QWN0aW9uLm5ld0NhbGVuZGFySXRlbTtcclxufVxyXG5cclxuQ2FsZW5kYXJBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG4gICAgLyoganNoaW50IG1heGNvbXBsZXhpdHk6OCAqL1xyXG4gICAgXHJcbiAgICBpZiAob3B0aW9ucyAmJiAob3B0aW9ucy5kYXRlIGluc3RhbmNlb2YgRGF0ZSkpXHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5jdXJyZW50RGF0ZShvcHRpb25zLmRhdGUpO1xyXG4gICAgXHJcbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnJvdXRlKSB7XHJcbiAgICAgICAgc3dpdGNoIChvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjYXNlICdhcHBvaW50bWVudCc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRjaG9vc2VOZXcubW9kYWwoJ2hpZGUnKTtcclxuICAgICAgICAgICAgICAgIC8vIFBhc3MgQXBwb2ludG1lbnQgSURcclxuICAgICAgICAgICAgICAgIHZhciBhcHRJZCA9IG9wdGlvbnMucm91dGUuc2VnbWVudHNbMV07XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dBcHBvaW50bWVudChhcHRJZCB8fCAwKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnbmV3JzpcclxuICAgICAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5yb3V0ZS5zZWdtZW50c1sxXSkge1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnYm9va2luZyc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuJGNob29zZU5ldy5tb2RhbCgnaGlkZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dBcHBvaW50bWVudCgwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2V2ZW50JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyBJbXBsZW1lbnQgbmV3LWV2ZW50IGZvcm0gb3BlbmluZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy4kY2hvb3NlTmV3Lm1vZGFsKCdzaG93Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuQ2FsZW5kYXJBY3Rpdml0eS5wcm90b3R5cGUuc2hvd0FwcG9pbnRtZW50ID0gZnVuY3Rpb24gc2hvd0FwcG9pbnRtZW50KGFwdCkge1xyXG4gICAgXHJcbiAgICAvLyBUT0RPOiBpbXBsZW1lbnQgc2hvd2luZyB0aGUgZ2l2ZW4gJ2FwdCdcclxuICAgIHRoaXMuYXBwLnNoZWxsLmdvKCdhcHBvaW50bWVudCcsIHtcclxuICAgICAgICBkYXRlOiB0aGlzLmRhdGFWaWV3LmN1cnJlbnREYXRlKCksXHJcbiAgICAgICAgYXBwb2ludG1lbnRJZDogYXB0XHJcbiAgICB9KTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcclxuXHJcbiAgICB0aGlzLnNsb3RzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTtcclxuICAgIHRoaXMuc2xvdHNEYXRhID0ga28ub2JzZXJ2YWJsZSh7fSk7XHJcbiAgICB0aGlzLmN1cnJlbnREYXRlID0ga28ub2JzZXJ2YWJsZShuZXcgRGF0ZSgpKTtcclxuICAgIFxyXG4gICAgLy8gVXBkYXRlIGN1cnJlbnQgc2xvdHMgb24gZGF0ZSBjaGFuZ2VcclxuICAgIHRoaXMuY3VycmVudERhdGUuc3Vic2NyaWJlKGZ1bmN0aW9uIChkYXRlKSB7XHJcblxyXG4gICAgICAgIHZhciBtZGF0ZSA9IG1vbWVudChkYXRlKSxcclxuICAgICAgICAgICAgc2RhdGUgPSBtZGF0ZS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgc2xvdHMgPSB0aGlzLnNsb3RzRGF0YSgpO1xyXG5cclxuICAgICAgICBpZiAoc2xvdHMuaGFzT3duUHJvcGVydHkoc2RhdGUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2xvdHMoc2xvdHNbc2RhdGVdKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnNsb3RzKHNsb3RzWydkZWZhdWx0J10pO1xyXG4gICAgICAgIH1cclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn1cclxuIiwiLyoqXHJcbiAgICBjbGllbnRzIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG4gICAgXHJcbnZhciBzaW5nbGV0b24gPSBudWxsO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdENsaWVudHMoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxyXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBDbGllbnRzQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xyXG4gICAgXHJcbiAgICByZXR1cm4gc2luZ2xldG9uO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gQ2xpZW50c0FjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Qcm92aWRlcjtcclxuICAgIFxyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuICAgIHRoaXMuJGluZGV4ID0gJGFjdGl2aXR5LmZpbmQoJyNjbGllbnRzSW5kZXgnKTtcclxuICAgIHRoaXMuJGxpc3RWaWV3ID0gJGFjdGl2aXR5LmZpbmQoJyNjbGllbnRzTGlzdFZpZXcnKTtcclxuXHJcbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xyXG4gICAga28uYXBwbHlCaW5kaW5ncyh0aGlzLmRhdGFWaWV3LCAkYWN0aXZpdHkuZ2V0KDApKTtcclxuXHJcbiAgICAvLyBUZXN0aW5nRGF0YVxyXG4gICAgdGhpcy5kYXRhVmlldy5jbGllbnRzKHJlcXVpcmUoJy4uL3Rlc3RkYXRhL2NsaWVudHMnKS5jbGllbnRzKTtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciB0byB1cGRhdGUgaGVhZGVyIGJhc2VkIG9uIGEgbW9kZSBjaGFuZ2U6XHJcbiAgICB0aGlzLmRhdGFWaWV3LmlzU2VsZWN0aW9uTW9kZS5zdWJzY3JpYmUoZnVuY3Rpb24gKGl0SXMpIHtcclxuICAgICAgICB0aGlzLmRhdGFWaWV3LmhlYWRlclRleHQoaXRJcyA/ICdTZWxlY3QgYSBjbGllbnQnIDogJ0NsaWVudHMnKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgLy8gT2JqZWN0IHRvIGhvbGQgdGhlIG9wdGlvbnMgcGFzc2VkIG9uICdzaG93JyBhcyBhIHJlc3VsdFxyXG4gICAgLy8gb2YgYSByZXF1ZXN0IGZyb20gYW5vdGhlciBhY3Rpdml0eVxyXG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XHJcbiAgICBcclxuICAgIC8vIEhhbmRsZXIgdG8gZ28gYmFjayB3aXRoIHRoZSBzZWxlY3RlZCBjbGllbnQgd2hlbiBcclxuICAgIC8vIHNlbGVjdGlvbiBtb2RlIGdvZXMgb2ZmIGFuZCByZXF1ZXN0SW5mbyBpcyBmb3JcclxuICAgIC8vICdzZWxlY3QgbW9kZSdcclxuICAgIHRoaXMuZGF0YVZpZXcuaXNTZWxlY3Rpb25Nb2RlLnN1YnNjcmliZShmdW5jdGlvbiAoaXRJcykge1xyXG4gICAgICAgIC8vIFdlIGhhdmUgYSByZXF1ZXN0IGFuZFxyXG4gICAgICAgIC8vIGl0IHJlcXVlc3RlZCB0byBzZWxlY3QgYSBjbGllbnRcclxuICAgICAgICAvLyBhbmQgc2VsZWN0aW9uIG1vZGUgZ29lcyBvZmZcclxuICAgICAgICBpZiAodGhpcy5yZXF1ZXN0SW5mbyAmJlxyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvLnNlbGVjdENsaWVudCA9PT0gdHJ1ZSAmJlxyXG4gICAgICAgICAgICBpdElzID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gUGFzcyB0aGUgc2VsZWN0ZWQgY2xpZW50IGluIHRoZSBpbmZvXHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8uc2VsZWN0ZWRDbGllbnQgPSB0aGlzLmRhdGFWaWV3LnNlbGVjdGVkQ2xpZW50KCk7XHJcbiAgICAgICAgICAgIC8vIEFuZCBnbyBiYWNrXHJcbiAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvQmFjayh0aGlzLnJlcXVlc3RJbmZvKTtcclxuICAgICAgICAgICAgLy8gTGFzdCwgY2xlYXIgcmVxdWVzdEluZm9cclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufVxyXG5cclxuQ2xpZW50c0FjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcblxyXG4gICAgLy8gT24gZXZlcnkgc2hvdywgc2VhcmNoIGdldHMgcmVzZXRlZFxyXG4gICAgdGhpcy5kYXRhVmlldy5zZWFyY2hUZXh0KCcnKTtcclxuICBcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG9wdGlvbnM7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuc2VsZWN0Q2xpZW50ID09PSB0cnVlKVxyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuaXNTZWxlY3Rpb25Nb2RlKHRydWUpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJ0NsaWVudHMnKTtcclxuXHJcbiAgICAvLyBFc3BlY2lhbCBtb2RlIHdoZW4gaW5zdGVhZCBvZiBwaWNrIGFuZCBlZGl0IHdlIGFyZSBqdXN0IHNlbGVjdGluZ1xyXG4gICAgLy8gKHdoZW4gZWRpdGluZyBhbiBhcHBvaW50bWVudClcclxuICAgIHRoaXMuaXNTZWxlY3Rpb25Nb2RlID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XHJcblxyXG4gICAgLy8gRnVsbCBsaXN0IG9mIGNsaWVudHNcclxuICAgIHRoaXMuY2xpZW50cyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcbiAgICBcclxuICAgIC8vIFNlYXJjaCB0ZXh0LCB1c2VkIHRvIGZpbHRlciAnY2xpZW50cydcclxuICAgIHRoaXMuc2VhcmNoVGV4dCA9IGtvLm9ic2VydmFibGUoJycpO1xyXG4gICAgXHJcbiAgICAvLyBVdGlsaXR5IHRvIGdldCBhIGZpbHRlcmVkIGxpc3Qgb2YgY2xpZW50cyBiYXNlZCBvbiBjbGllbnRzXHJcbiAgICB0aGlzLmdldEZpbHRlcmVkTGlzdCA9IGZ1bmN0aW9uIGdldEZpbHRlcmVkTGlzdCgpIHtcclxuICAgICAgICB2YXIgcyA9ICh0aGlzLnNlYXJjaFRleHQoKSB8fCAnJykudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50cygpLmZpbHRlcihmdW5jdGlvbihjbGllbnQpIHtcclxuICAgICAgICAgICAgdmFyIG4gPSBjbGllbnQgJiYgY2xpZW50LmZ1bGxOYW1lKCkgJiYgY2xpZW50LmZ1bGxOYW1lKCkgfHwgJyc7XHJcbiAgICAgICAgICAgIG4gPSBuLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIHJldHVybiBuLmluZGV4T2YocykgPiAtMTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gRmlsdGVyZWQgbGlzdCBvZiBjbGllbnRzXHJcbiAgICB0aGlzLmZpbHRlcmVkQ2xpZW50cyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldEZpbHRlcmVkTGlzdCgpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIC8vIEdyb3VwZWQgbGlzdCBvZiBmaWx0ZXJlZCBjbGllbnRzXHJcbiAgICB0aGlzLmdyb3VwZWRDbGllbnRzID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgdmFyIGNsaWVudHMgPSB0aGlzLmZpbHRlcmVkQ2xpZW50cygpLnNvcnQoZnVuY3Rpb24oY2xpZW50QSwgY2xpZW50Qikge1xyXG4gICAgICAgICAgICByZXR1cm4gY2xpZW50QS5maXJzdE5hbWUoKSA+IGNsaWVudEIuZmlyc3ROYW1lKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGdyb3VwcyA9IFtdLFxyXG4gICAgICAgICAgICBsYXRlc3RHcm91cCA9IG51bGwsXHJcbiAgICAgICAgICAgIGxhdGVzdExldHRlciA9IG51bGw7XHJcblxyXG4gICAgICAgIGNsaWVudHMuZm9yRWFjaChmdW5jdGlvbihjbGllbnQpIHtcclxuICAgICAgICAgICAgdmFyIGxldHRlciA9IChjbGllbnQuZmlyc3ROYW1lKClbMF0gfHwgJycpLnRvVXBwZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIGlmIChsZXR0ZXIgIT09IGxhdGVzdExldHRlcikge1xyXG4gICAgICAgICAgICAgICAgbGF0ZXN0R3JvdXAgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0dGVyOiBsZXR0ZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgY2xpZW50czogW2NsaWVudF1cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBncm91cHMucHVzaChsYXRlc3RHcm91cCk7XHJcbiAgICAgICAgICAgICAgICBsYXRlc3RMZXR0ZXIgPSBsZXR0ZXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsYXRlc3RHcm91cC5jbGllbnRzLnB1c2goY2xpZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gZ3JvdXBzO1xyXG5cclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlbGVjdGVkQ2xpZW50ID0ga28ub2JzZXJ2YWJsZShudWxsKTtcclxuICAgIFxyXG4gICAgdGhpcy5zZWxlY3RDbGllbnQgPSBmdW5jdGlvbihzZWxlY3RlZENsaWVudCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRDbGllbnQoc2VsZWN0ZWRDbGllbnQpO1xyXG4gICAgICAgIHRoaXMuaXNTZWxlY3Rpb25Nb2RlKGZhbHNlKTtcclxuXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbn1cclxuIiwiLyoqXG4gICAgQ29udGFjdEluZm8gYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2luZ2xldG9uID0gbnVsbDtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdENvbnRhY3RJbmZvKCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgQ29udGFjdEluZm9BY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XG4gICAgXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbn07XG5cbmZ1bmN0aW9uIENvbnRhY3RJbmZvQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjtcbiAgICBcbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICBcbiAgICB0aGlzLm5hdkFjdGlvbiA9IG51bGw7XG59XG5cbkNvbnRhY3RJbmZvQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcblxufTtcbiIsIi8qKlxyXG4gICAgZGF0ZXRpbWVQaWNrZXIgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIFRpbWUgPSByZXF1aXJlKCcuLi91dGlscy9UaW1lJyk7XHJcbnJlcXVpcmUoJy4uL2NvbXBvbmVudHMvRGF0ZVBpY2tlcicpO1xyXG4gICAgXHJcbnZhciBzaW5nbGV0b24gPSBudWxsO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdERhdGV0aW1lUGlja2VyKCRhY3Rpdml0eSwgYXBwKSB7XHJcblxyXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcclxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgRGF0ZXRpbWVQaWNrZXJBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XHJcblxyXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIERhdGV0aW1lUGlja2VyQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XHJcbiAgICBcclxuICAgIHRoaXMuYXBwID0gYXBwO1xyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLiRkYXRlUGlja2VyID0gJGFjdGl2aXR5LmZpbmQoJyNkYXRldGltZVBpY2tlckRhdGVQaWNrZXInKTtcclxuICAgIHRoaXMuJHRpbWVQaWNrZXIgPSAkYWN0aXZpdHkuZmluZCgnI2RhdGV0aW1lUGlja2VyVGltZVBpY2tlcicpO1xyXG5cclxuICAgIC8qIEluaXQgY29tcG9uZW50cyAqL1xyXG4gICAgdGhpcy4kZGF0ZVBpY2tlci5zaG93KCkuZGF0ZXBpY2tlcigpO1xyXG4gICAgXHJcbiAgICB2YXIgZGF0YVZpZXcgPSB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xyXG4gICAgZGF0YVZpZXcuaGVhZGVyVGV4dCA9ICdTZWxlY3QgYSBzdGFydCB0aW1lJztcclxuICAgIGtvLmFwcGx5QmluZGluZ3MoZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xyXG4gICAgXHJcbiAgICAvLyBFdmVudHNcclxuICAgIHRoaXMuJGRhdGVQaWNrZXIub24oJ2NoYW5nZURhdGUnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgaWYgKGUudmlld01vZGUgPT09ICdkYXlzJykge1xyXG4gICAgICAgICAgICBkYXRhVmlldy5zZWxlY3RlZERhdGUoZS5kYXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG4gICAgXHJcbiAgICAvLyBUZXN0aW5nRGF0YVxyXG4gICAgZGF0YVZpZXcuc2xvdHNEYXRhID0gcmVxdWlyZSgnLi4vdGVzdGRhdGEvdGltZVNsb3RzJykudGltZVNsb3RzO1xyXG4gXHJcbiAgICBkYXRhVmlldy5zZWxlY3RlZERhdGUuc3Vic2NyaWJlKGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgICAgICB0aGlzLmJpbmREYXRlRGF0YShkYXRlKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgdGhpcy5iaW5kRGF0ZURhdGEobmV3IERhdGUoKSk7XHJcbiAgICBcclxuICAgIC8vIE9iamVjdCB0byBob2xkIHRoZSBvcHRpb25zIHBhc3NlZCBvbiAnc2hvdycgYXMgYSByZXN1bHRcclxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyIHRvIGdvIGJhY2sgd2l0aCB0aGUgc2VsZWN0ZWQgZGF0ZS10aW1lIHdoZW5cclxuICAgIC8vIHRoYXQgc2VsZWN0aW9uIGlzIGRvbmUgKGNvdWxkIGJlIHRvIG51bGwpXHJcbiAgICB0aGlzLmRhdGFWaWV3LnNlbGVjdGVkRGF0ZXRpbWUuc3Vic2NyaWJlKGZ1bmN0aW9uIChkYXRldGltZSkge1xyXG4gICAgICAgIC8vIFdlIGhhdmUgYSByZXF1ZXN0XHJcbiAgICAgICAgaWYgKHRoaXMucmVxdWVzdEluZm8pIHtcclxuICAgICAgICAgICAgLy8gUGFzcyB0aGUgc2VsZWN0ZWQgZGF0ZXRpbWUgaW4gdGhlIGluZm9cclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mby5zZWxlY3RlZERhdGV0aW1lID0gdGhpcy5kYXRhVmlldy5zZWxlY3RlZERhdGV0aW1lKCk7XHJcbiAgICAgICAgICAgIC8vIEFuZCBnbyBiYWNrXHJcbiAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvQmFjayh0aGlzLnJlcXVlc3RJbmZvKTtcclxuICAgICAgICAgICAgLy8gTGFzdCwgY2xlYXIgcmVxdWVzdEluZm9cclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufVxyXG5cclxuRGF0ZXRpbWVQaWNrZXJBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG4gIFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gb3B0aW9ucztcclxufTtcclxuXHJcbkRhdGV0aW1lUGlja2VyQWN0aXZpdHkucHJvdG90eXBlLmJpbmREYXRlRGF0YSA9IGZ1bmN0aW9uIGJpbmREYXRlRGF0YShkYXRlKSB7XHJcblxyXG4gICAgdmFyIHNkYXRlID0gbW9tZW50KGRhdGUpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xyXG4gICAgdmFyIHNsb3RzRGF0YSA9IHRoaXMuZGF0YVZpZXcuc2xvdHNEYXRhO1xyXG5cclxuICAgIGlmIChzbG90c0RhdGEuaGFzT3duUHJvcGVydHkoc2RhdGUpKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5zbG90cyhzbG90c0RhdGFbc2RhdGVdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5zbG90cyhzbG90c0RhdGFbJ2RlZmF1bHQnXSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XHJcblxyXG4gICAgdGhpcy5oZWFkZXJUZXh0ID0ga28ub2JzZXJ2YWJsZSgnU2VsZWN0IGEgdGltZScpO1xyXG4gICAgdGhpcy5zZWxlY3RlZERhdGUgPSBrby5vYnNlcnZhYmxlKG5ldyBEYXRlKCkpO1xyXG4gICAgdGhpcy5zbG90c0RhdGEgPSB7fTtcclxuICAgIHRoaXMuc2xvdHMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xyXG4gICAgdGhpcy5ncm91cGVkU2xvdHMgPSBrby5jb21wdXRlZChmdW5jdGlvbigpe1xyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICBiZWZvcmUgMTI6MDBwbSAobm9vbikgPSBtb3JuaW5nXHJcbiAgICAgICAgICBhZnRlcm5vb246IDEyOjAwcG0gdW50aWwgNTowMHBtXHJcbiAgICAgICAgICBldmVuaW5nOiA1OjAwcG0gLSAxMTo1OXBtXHJcbiAgICAgICAgKi9cclxuICAgICAgICAvLyBTaW5jZSBzbG90cyBtdXN0IGJlIGZvciB0aGUgc2FtZSBkYXRlLFxyXG4gICAgICAgIC8vIHRvIGRlZmluZSB0aGUgZ3JvdXBzIHJhbmdlcyB1c2UgdGhlIGZpcnN0IGRhdGVcclxuICAgICAgICB2YXIgZGF0ZVBhcnQgPSB0aGlzLnNsb3RzKCkgJiYgdGhpcy5zbG90cygpWzBdIHx8IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgdmFyIGdyb3VwcyA9IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZ3JvdXA6ICdNb3JuaW5nJyxcclxuICAgICAgICAgICAgICAgIHNsb3RzOiBbXSxcclxuICAgICAgICAgICAgICAgIHN0YXJ0czogbmV3IFRpbWUoZGF0ZVBhcnQsIDAsIDApLFxyXG4gICAgICAgICAgICAgICAgZW5kczogbmV3IFRpbWUoZGF0ZVBhcnQsIDEyLCAwKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBncm91cDogJ0FmdGVybm9vbicsXHJcbiAgICAgICAgICAgICAgICBzbG90czogW10sXHJcbiAgICAgICAgICAgICAgICBzdGFydHM6IG5ldyBUaW1lKGRhdGVQYXJ0LCAxMiwgMCksXHJcbiAgICAgICAgICAgICAgICBlbmRzOiBuZXcgVGltZShkYXRlUGFydCwgMTcsIDApXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGdyb3VwOiAnRXZlbmluZycsXHJcbiAgICAgICAgICAgICAgICBzbG90czogW10sXHJcbiAgICAgICAgICAgICAgICBzdGFydHM6IG5ldyBUaW1lKGRhdGVQYXJ0LCAxNywgMCksXHJcbiAgICAgICAgICAgICAgICBlbmRzOiBuZXcgVGltZShkYXRlUGFydCwgMjQsIDApXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdO1xyXG4gICAgICAgIHZhciBzbG90cyA9IHRoaXMuc2xvdHMoKS5zb3J0KCk7XHJcbiAgICAgICAgc2xvdHMuZm9yRWFjaChmdW5jdGlvbihzbG90KSB7XHJcbiAgICAgICAgICAgIGdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uKGdyb3VwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2xvdCA+PSBncm91cC5zdGFydHMgJiZcclxuICAgICAgICAgICAgICAgICAgICBzbG90IDwgZ3JvdXAuZW5kcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwLnNsb3RzLnB1c2goc2xvdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gZ3JvdXBzO1xyXG5cclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlbGVjdGVkRGF0ZXRpbWUgPSBrby5vYnNlcnZhYmxlKG51bGwpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlbGVjdERhdGV0aW1lID0gZnVuY3Rpb24oc2VsZWN0ZWREYXRldGltZSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWREYXRldGltZShzZWxlY3RlZERhdGV0aW1lKTtcclxuXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcblxyXG59XHJcbiIsIi8qKlxuICAgIEhvbWUgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xuXG52YXIgc2luZ2xldG9uID0gbnVsbDtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdEhvbWUoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBIb21lQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xuICAgIFxuICAgIHJldHVybiBzaW5nbGV0b247XG59O1xuXG5mdW5jdGlvbiBIb21lQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLlByb3ZpZGVyO1xuXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy4kbmV4dEJvb2tpbmcgPSAkYWN0aXZpdHkuZmluZCgnI2hvbWVOZXh0Qm9va2luZycpO1xuICAgIHRoaXMuJHVwY29taW5nQm9va2luZ3MgPSAkYWN0aXZpdHkuZmluZCgnI2hvbWVVcGNvbWluZ0Jvb2tpbmdzJyk7XG4gICAgdGhpcy4kaW5ib3ggPSAkYWN0aXZpdHkuZmluZCgnI2hvbWVJbmJveCcpO1xuICAgIHRoaXMuJHBlcmZvcm1hbmNlID0gJGFjdGl2aXR5LmZpbmQoJyNob21lUGVyZm9ybWFuY2UnKTtcbiAgICB0aGlzLiRnZXRNb3JlID0gJGFjdGl2aXR5LmZpbmQoJyNob21lR2V0TW9yZScpO1xuXG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMuZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xuXG4gICAgLy8gVGVzdGluZ0RhdGFcbiAgICBzZXRTb21lVGVzdGluZ0RhdGEodGhpcy5kYXRhVmlldyk7XG5cbiAgICAvLyBPYmplY3QgdG8gaG9sZCB0aGUgb3B0aW9ucyBwYXNzZWQgb24gJ3Nob3cnIGFzIGEgcmVzdWx0XG4gICAgLy8gb2YgYSByZXF1ZXN0IGZyb20gYW5vdGhlciBhY3Rpdml0eVxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xuICAgIFxuICAgIHRoaXMubmF2QWN0aW9uID0gTmF2QWN0aW9uLm5ld0l0ZW07XG59XG5cbkhvbWVBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuIFxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMucmVxdWVzdEluZm8gPSBvcHRpb25zO1xuICAgIHZhciB2ID0gdGhpcy5kYXRhVmlldyxcbiAgICAgICAgYXBwTW9kZWwgPSB0aGlzLmFwcC5tb2RlbDtcbiAgICBcbiAgICAvLyBVcGRhdGUgZGF0YVxuICAgIGFwcE1vZGVsLmdldFVwY29taW5nQm9va2luZ3MoKS50aGVuKGZ1bmN0aW9uKHVwY29taW5nKSB7XG5cbiAgICAgICAgaWYgKHVwY29taW5nLm5leHRCb29raW5nSUQpXG4gICAgICAgICAgICBhcHBNb2RlbC5nZXRCb29raW5nKHVwY29taW5nLm5leHRCb29raW5nSUQpLnRoZW4odi5uZXh0Qm9va2luZyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHYubmV4dEJvb2tpbmcobnVsbCk7XG5cbiAgICAgICAgdi51cGNvbWluZ0Jvb2tpbmdzLnRvZGF5LnF1YW50aXR5KHVwY29taW5nLnRvZGF5LnF1YW50aXR5KTtcbiAgICAgICAgdi51cGNvbWluZ0Jvb2tpbmdzLnRvZGF5LnRpbWUodXBjb21pbmcudG9kYXkudGltZSAmJiBuZXcgRGF0ZSh1cGNvbWluZy50b2RheS50aW1lKSk7XG4gICAgICAgIHYudXBjb21pbmdCb29raW5ncy50b21vcnJvdy5xdWFudGl0eSh1cGNvbWluZy50b21vcnJvdy5xdWFudGl0eSk7XG4gICAgICAgIHYudXBjb21pbmdCb29raW5ncy50b21vcnJvdy50aW1lKHVwY29taW5nLnRvbW9ycm93LnRpbWUgJiYgbmV3IERhdGUodXBjb21pbmcudG9tb3Jyb3cudGltZSkpO1xuICAgICAgICB2LnVwY29taW5nQm9va2luZ3MubmV4dFdlZWsucXVhbnRpdHkodXBjb21pbmcubmV4dFdlZWsucXVhbnRpdHkpO1xuICAgIH0pO1xufTtcblxudmFyIFVwY29taW5nQm9va2luZ3NTdW1tYXJ5ID0gcmVxdWlyZSgnLi4vbW9kZWxzL1VwY29taW5nQm9va2luZ3NTdW1tYXJ5JyksXG4gICAgTWFpbEZvbGRlciA9IHJlcXVpcmUoJy4uL21vZGVscy9NYWlsRm9sZGVyJyksXG4gICAgUGVyZm9ybWFuY2VTdW1tYXJ5ID0gcmVxdWlyZSgnLi4vbW9kZWxzL1BlcmZvcm1hbmNlU3VtbWFyeScpLFxuICAgIEdldE1vcmUgPSByZXF1aXJlKCcuLi9tb2RlbHMvR2V0TW9yZScpO1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG5cbiAgICB0aGlzLnVwY29taW5nQm9va2luZ3MgPSBuZXcgVXBjb21pbmdCb29raW5nc1N1bW1hcnkoKTtcblxuICAgIC8vIDpBcHBvaW50bWVudFxuICAgIHRoaXMubmV4dEJvb2tpbmcgPSBrby5vYnNlcnZhYmxlKG51bGwpO1xuICAgIFxuICAgIHRoaXMuaW5ib3ggPSBuZXcgTWFpbEZvbGRlcih7XG4gICAgICAgIHRvcE51bWJlcjogNFxuICAgIH0pO1xuICAgIFxuICAgIHRoaXMucGVyZm9ybWFuY2UgPSBuZXcgUGVyZm9ybWFuY2VTdW1tYXJ5KCk7XG4gICAgXG4gICAgdGhpcy5nZXRNb3JlID0gbmV3IEdldE1vcmUoKTtcbn1cblxuLyoqIFRFU1RJTkcgREFUQSAqKi9cbnZhciBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xuXG5mdW5jdGlvbiBzZXRTb21lVGVzdGluZ0RhdGEoZGF0YVZpZXcpIHtcbiAgICBcbiAgICBkYXRhVmlldy5pbmJveC5tZXNzYWdlcyhyZXF1aXJlKCcuLi90ZXN0ZGF0YS9tZXNzYWdlcycpLm1lc3NhZ2VzKTtcbiAgICBcbiAgICBkYXRhVmlldy5wZXJmb3JtYW5jZS5lYXJuaW5ncy5jdXJyZW50QW1vdW50KDI0MDApO1xuICAgIGRhdGFWaWV3LnBlcmZvcm1hbmNlLmVhcm5pbmdzLm5leHRBbW91bnQoNjIwMC41NCk7XG4gICAgZGF0YVZpZXcucGVyZm9ybWFuY2UudGltZUJvb2tlZC5wZXJjZW50KDAuOTMpO1xuICAgIFxuICAgIGRhdGFWaWV3LmdldE1vcmUubW9kZWwudXBkYXRlV2l0aCh7XG4gICAgICAgIGF2YWlsYWJpbGl0eTogdHJ1ZSxcbiAgICAgICAgcGF5bWVudHM6IHRydWUsXG4gICAgICAgIHByb2ZpbGU6IHRydWUsXG4gICAgICAgIGNvb3A6IHRydWVcbiAgICB9KTtcbn1cbiIsIi8qKlxuICAgIEluZGV4IGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIHNpbmdsZXRvbiA9IG51bGw7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRJbmRleCgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IEluZGV4QWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xuICAgIFxuICAgIHJldHVybiBzaW5nbGV0b247XG59O1xuXG5mdW5jdGlvbiBJbmRleEFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICBcbiAgICB0aGlzLm5hdkFjdGlvbiA9IG51bGw7XG4gICAgXG4gICAgLy8gQW55IHVzZXIgY2FuIGFjY2VzcyB0aGlzXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IG51bGw7XG59XG5cbkluZGV4QWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcbiAgICAvLyBJdCBjaGVja3MgaWYgdGhlIHVzZXIgaXMgbG9nZ2VkIHNvIHRoZW4gXG4gICAgLy8gdGhlaXIgJ2xvZ2dlZCBpbmRleCcgaXMgdGhlIGRhc2hib2FyZCBub3QgdGhpc1xuICAgIC8vIHBhZ2UgdGhhdCBpcyBmb2N1c2VkIG9uIGFub255bW91cyB1c2Vyc1xuICAgIGlmICghdGhpcy5hcHAubW9kZWwudXNlcigpLmlzQW5vbnltb3VzKCkpIHtcbiAgICAgICAgdGhpcy5hcHAuZ29EYXNoYm9hcmQoKTtcbiAgICB9XG59O1xuIiwiLyoqXG4gICAgTGVhcm5Nb3JlIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKTtcblxudmFyIHNpbmdsZXRvbiA9IG51bGw7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRMZWFybk1vcmUoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIGlmIChzaW5nbGV0b24gPT09IG51bGwpXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBMZWFybk1vcmVBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XG4gICAgXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcbn07XG5cbmZ1bmN0aW9uIExlYXJuTW9yZUFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XG4gICAgXG4gICAgdGhpcy5uYXZBY3Rpb24gPSBOYXZBY3Rpb24uZ29CYWNrO1xufVxuXG5MZWFybk1vcmVBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuXG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5yb3V0ZSAmJlxuICAgICAgICBvcHRpb25zLnJvdXRlLnNlZ21lbnRzICYmXG4gICAgICAgIG9wdGlvbnMucm91dGUuc2VnbWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuZGF0YVZpZXcucHJvZmlsZShvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdKTtcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgdGhpcy5wcm9maWxlID0ga28ub2JzZXJ2YWJsZSgnY3VzdG9tZXInKTtcbn0iLCIvKipcbiAgICBMb2NhdGlvbkVkaXRpb24gYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcbiAgICBMb2NhdGlvbiA9IHJlcXVpcmUoJy4uL21vZGVscy9Mb2NhdGlvbicpO1xuXG52YXIgc2luZ2xldG9uID0gbnVsbDtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdExvY2F0aW9uRWRpdGlvbigkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IExvY2F0aW9uRWRpdGlvbkFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcbiAgICBcbiAgICByZXR1cm4gc2luZ2xldG9uO1xufTtcblxuZnVuY3Rpb24gTG9jYXRpb25FZGl0aW9uQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLlByb3ZpZGVyO1xuXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMuZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xuICAgIFxuICAgIHRoaXMubmF2QWN0aW9uID0gbnVsbDtcbn1cblxuTG9jYXRpb25FZGl0aW9uQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcbiAgICAvL2pzaGludCBtYXhjb21wbGV4aXR5OjEwXG4gICAgXG4gICAgdmFyIGlkID0gMCxcbiAgICAgICAgY3JlYXRlID0gJyc7XG5cbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucy5sb2NhdGlvbklEKSB7XG4gICAgICAgICAgICBpZCA9IG9wdGlvbnMubG9jYXRpb25JRDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvcHRpb25zLnJvdXRlICYmIG9wdGlvbnMucm91dGUuc2VnbWVudHMpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWQgPSBwYXJzZUludChvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzBdKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvcHRpb25zLmNyZWF0ZSkge1xuICAgICAgICAgICAgY3JlYXRlID0gb3B0aW9ucy5jcmVhdGU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaWYgKGlkKSB7XG4gICAgICAgIC8vIFRPRE9cbiAgICAgICAgLy8gdmFyIGxvY2F0aW9uID0gdGhpcy5hcHAubW9kZWwuZ2V0TG9jYXRpb24oaWQpXG4gICAgICAgIC8vIE5PVEUgdGVzdGluZyBkYXRhXG4gICAgICAgIHZhciBsb2NhdGlvbnMgPSB7XG4gICAgICAgICAgICAnMSc6IG5ldyBMb2NhdGlvbih7XG4gICAgICAgICAgICAgICAgbG9jYXRpb25JRDogMSxcbiAgICAgICAgICAgICAgICBuYW1lOiAnSG9tZScsXG4gICAgICAgICAgICAgICAgYWRkcmVzc0xpbmUxOiAnSGVyZSBTdHJlZXQnLFxuICAgICAgICAgICAgICAgIGNpdHk6ICdTYW4gRnJhbmNpc2NvJyxcbiAgICAgICAgICAgICAgICBwb3N0YWxDb2RlOiAnOTAwMDEnLFxuICAgICAgICAgICAgICAgIHN0YXRlUHJvdmluY2VDb2RlOiAnQ0EnLFxuICAgICAgICAgICAgICAgIGNvdW50cnlJRDogMSxcbiAgICAgICAgICAgICAgICBpc1NlcnZpY2VSYWRpdXM6IHRydWUsXG4gICAgICAgICAgICAgICAgaXNTZXJ2aWNlTG9jYXRpb246IGZhbHNlXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICcyJzogbmV3IExvY2F0aW9uKHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbklEOiAxLFxuICAgICAgICAgICAgICAgIG5hbWU6ICdXb3Jrc2hvcCcsXG4gICAgICAgICAgICAgICAgYWRkcmVzc0xpbmUxOiAnVW5rbm93IFN0cmVldCcsXG4gICAgICAgICAgICAgICAgY2l0eTogJ1NhbiBGcmFuY2lzY28nLFxuICAgICAgICAgICAgICAgIHBvc3RhbENvZGU6ICc5MDAwMScsXG4gICAgICAgICAgICAgICAgc3RhdGVQcm92aW5jZUNvZGU6ICdDQScsXG4gICAgICAgICAgICAgICAgY291bnRyeUlEOiAxLFxuICAgICAgICAgICAgICAgIGlzU2VydmljZVJhZGl1czogZmFsc2UsXG4gICAgICAgICAgICAgICAgaXNTZXJ2aWNlTG9jYXRpb246IHRydWVcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH07XG4gICAgICAgIHZhciBsb2NhdGlvbiA9IGxvY2F0aW9uc1tpZF07XG4gICAgICAgIGlmIChsb2NhdGlvbikge1xuICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5sb2NhdGlvbihsb2NhdGlvbik7XG5cbiAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcuaGVhZGVyKCdFZGl0IExvY2F0aW9uJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmxvY2F0aW9uKG51bGwpO1xuICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5oZWFkZXIoJ1Vua25vdyBsb2NhdGlvbiBvciB3YXMgZGVsZXRlZCcpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICAvLyBOZXcgbG9jYXRpb25cbiAgICAgICAgdGhpcy5kYXRhVmlldy5sb2NhdGlvbihuZXcgTG9jYXRpb24oKSk7XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggKG9wdGlvbnMuY3JlYXRlKSB7XG4gICAgICAgICAgICBjYXNlICdzZXJ2aWNlUmFkaXVzJzpcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmxvY2F0aW9uKCkuaXNTZXJ2aWNlUmFkaXVzKHRydWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcuaGVhZGVyKCdBZGQgYSBzZXJ2aWNlIHJhZGl1cycpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnc2VydmljZUxvY2F0aW9uJzpcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmxvY2F0aW9uKCkuaXNTZXJ2aWNlTG9jYXRpb24odHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5oZWFkZXIoJ0FkZCBhIHNlcnZpY2UgbG9jYXRpb24nKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5sb2NhdGlvbigpLmlzU2VydmljZVJhZGl1cyh0cnVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGFWaWV3LmxvY2F0aW9uKCkuaXNTZXJ2aWNlTG9jYXRpb24odHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5oZWFkZXIoJ0FkZCBhIGxvY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG4gICAgXG4gICAgdGhpcy5sb2NhdGlvbiA9IGtvLm9ic2VydmFibGUobmV3IExvY2F0aW9uKCkpO1xuICAgIFxuICAgIHRoaXMuaGVhZGVyID0ga28ub2JzZXJ2YWJsZSgnRWRpdCBMb2NhdGlvbicpO1xuICAgIFxuICAgIC8vIFRPRE9cbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbigpIHt9O1xuICAgIHRoaXMuY2FuY2VsID0gZnVuY3Rpb24oKSB7fTtcbn0iLCIvKipcclxuICAgIGxvY2F0aW9ucyBhY3Rpdml0eVxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKTtcclxuICAgIFxyXG52YXIgc2luZ2xldG9uID0gbnVsbDtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRMb2NhdGlvbnMoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxyXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBMb2NhdGlvbnNBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCk7XHJcbiAgICBcclxuICAgIHJldHVybiBzaW5nbGV0b247XHJcbn07XHJcblxyXG5mdW5jdGlvbiBMb2NhdGlvbnNBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xyXG4gICAgXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLlByb3ZpZGVyO1xyXG5cclxuICAgIHRoaXMuYXBwID0gYXBwO1xyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLiRsaXN0VmlldyA9ICRhY3Rpdml0eS5maW5kKCcjbG9jYXRpb25zTGlzdFZpZXcnKTtcclxuXHJcbiAgICB2YXIgZGF0YVZpZXcgPSB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbChhcHApO1xyXG4gICAga28uYXBwbHlCaW5kaW5ncyhkYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XHJcblxyXG4gICAgLy8gVGVzdGluZ0RhdGFcclxuICAgIGRhdGFWaWV3LmxvY2F0aW9ucyhyZXF1aXJlKCcuLi90ZXN0ZGF0YS9sb2NhdGlvbnMnKS5sb2NhdGlvbnMpO1xyXG5cclxuICAgIC8vIEhhbmRsZXIgdG8gdXBkYXRlIGhlYWRlciBiYXNlZCBvbiBhIG1vZGUgY2hhbmdlOlxyXG4gICAgdGhpcy5kYXRhVmlldy5pc1NlbGVjdGlvbk1vZGUuc3Vic2NyaWJlKGZ1bmN0aW9uIChpdElzKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5oZWFkZXJUZXh0KGl0SXMgPyAnU2VsZWN0L0FkZCBsb2NhdGlvbicgOiAnTG9jYXRpb25zJyk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIC8vIE9iamVjdCB0byBob2xkIHRoZSBvcHRpb25zIHBhc3NlZCBvbiAnc2hvdycgYXMgYSByZXN1bHRcclxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyIHRvIGdvIGJhY2sgd2l0aCB0aGUgc2VsZWN0ZWQgbG9jYXRpb24gd2hlbiBcclxuICAgIC8vIHNlbGVjdGlvbiBtb2RlIGdvZXMgb2ZmIGFuZCByZXF1ZXN0SW5mbyBpcyBmb3JcclxuICAgIC8vICdzZWxlY3QgbW9kZSdcclxuICAgIHRoaXMuZGF0YVZpZXcuaXNTZWxlY3Rpb25Nb2RlLnN1YnNjcmliZShmdW5jdGlvbiAoaXRJcykge1xyXG4gICAgICAgIC8vIFdlIGhhdmUgYSByZXF1ZXN0IGFuZFxyXG4gICAgICAgIC8vIGl0IHJlcXVlc3RlZCB0byBzZWxlY3QgYSBsb2NhdGlvblxyXG4gICAgICAgIC8vIGFuZCBzZWxlY3Rpb24gbW9kZSBnb2VzIG9mZlxyXG4gICAgICAgIGlmICh0aGlzLnJlcXVlc3RJbmZvICYmXHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8uc2VsZWN0TG9jYXRpb24gPT09IHRydWUgJiZcclxuICAgICAgICAgICAgaXRJcyA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFBhc3MgdGhlIHNlbGVjdGVkIGNsaWVudCBpbiB0aGUgaW5mb1xyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvLnNlbGVjdGVkTG9jYXRpb24gPSB0aGlzLmRhdGFWaWV3LnNlbGVjdGVkTG9jYXRpb24oKTtcclxuICAgICAgICAgICAgLy8gQW5kIGdvIGJhY2tcclxuICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ29CYWNrKHRoaXMucmVxdWVzdEluZm8pO1xyXG4gICAgICAgICAgICAvLyBMYXN0LCBjbGVhciByZXF1ZXN0SW5mb1xyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59XHJcblxyXG5Mb2NhdGlvbnNBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG4gIFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gb3B0aW9ucztcclxuXHJcbiAgICBpZiAob3B0aW9ucy5zZWxlY3RMb2NhdGlvbiA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuaXNTZWxlY3Rpb25Nb2RlKHRydWUpO1xyXG4gICAgICAgIC8vIHByZXNldDpcclxuICAgICAgICB0aGlzLmRhdGFWaWV3LnNlbGVjdGVkTG9jYXRpb24ob3B0aW9ucy5zZWxlY3RlZExvY2F0aW9uKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKG9wdGlvbnMucm91dGUgJiYgb3B0aW9ucy5yb3V0ZS5zZWdtZW50cykge1xyXG4gICAgICAgIHZhciBpZCA9IG9wdGlvbnMucm91dGUuc2VnbWVudHNbMF07XHJcbiAgICAgICAgaWYgKGlkKSB7XHJcbiAgICAgICAgICAgIGlmIChpZCA9PT0gJ25ldycpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvKCdsb2NhdGlvbkVkaXRpb24nLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlOiBvcHRpb25zLnJvdXRlLnNlZ21lbnRzWzFdIC8vICdzZXJ2aWNlUmFkaXVzJywgJ3NlcnZpY2VMb2NhdGlvbidcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ28oJ2xvY2F0aW9uRWRpdGlvbicsIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbklEOiBpZFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBWaWV3TW9kZWwoYXBwKSB7XHJcblxyXG4gICAgdGhpcy5oZWFkZXJUZXh0ID0ga28ub2JzZXJ2YWJsZSgnTG9jYXRpb25zJyk7XHJcblxyXG4gICAgLy8gRnVsbCBsaXN0IG9mIGxvY2F0aW9uc1xyXG4gICAgdGhpcy5sb2NhdGlvbnMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xyXG5cclxuICAgIC8vIEVzcGVjaWFsIG1vZGUgd2hlbiBpbnN0ZWFkIG9mIHBpY2sgYW5kIGVkaXQgd2UgYXJlIGp1c3Qgc2VsZWN0aW5nXHJcbiAgICAvLyAod2hlbiBlZGl0aW5nIGFuIGFwcG9pbnRtZW50KVxyXG4gICAgdGhpcy5pc1NlbGVjdGlvbk1vZGUgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuXHJcbiAgICB0aGlzLnNlbGVjdGVkTG9jYXRpb24gPSBrby5vYnNlcnZhYmxlKG51bGwpO1xyXG4gICAgXHJcbiAgICB0aGlzLnNlbGVjdExvY2F0aW9uID0gZnVuY3Rpb24oc2VsZWN0ZWRMb2NhdGlvbikge1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICh0aGlzLmlzU2VsZWN0aW9uTW9kZSgpID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRMb2NhdGlvbihzZWxlY3RlZExvY2F0aW9uKTtcclxuICAgICAgICAgICAgdGhpcy5pc1NlbGVjdGlvbk1vZGUoZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgYXBwLnNoZWxsLmdvKCdsb2NhdGlvbkVkaXRpb24nLCB7XHJcbiAgICAgICAgICAgICAgICBsb2NhdGlvbklEOiBzZWxlY3RlZExvY2F0aW9uLmxvY2F0aW9uSUQoKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG59XHJcbiIsIi8qKlxuICAgIExvZ2luIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXG4gICAgTmF2QWN0aW9uID0gcmVxdWlyZSgnLi4vdmlld21vZGVscy9OYXZBY3Rpb24nKSxcbiAgICBVc2VyID0gcmVxdWlyZSgnLi4vbW9kZWxzL1VzZXInKTtcblxudmFyIHNpbmdsZXRvbiA9IG51bGw7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRMb2dpbigkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IExvZ2luQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xuICAgIFxuICAgIHJldHVybiBzaW5nbGV0b247XG59O1xuXG5mdW5jdGlvbiBMb2dpbkFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XG4gICAgXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Bbm9ueW1vdXM7XG5cbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XG4gICAgXG4gICAgdGhpcy5uYXZBY3Rpb24gPSBOYXZBY3Rpb24uZ29CYWNrO1xuICAgIFxuICAgIC8vIFBlcmZvcm0gbG9nLWluIHJlcXVlc3Qgd2hlbiBpcyByZXF1ZXN0ZWQgYnkgdGhlIGZvcm06XG4gICAgdGhpcy5kYXRhVmlldy5pc0xvZ2luZ0luLnN1YnNjcmliZShmdW5jdGlvbih2KSB7XG4gICAgICAgIGlmICh2ID09PSB0cnVlKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFBlcmZvcm0gbG9naW5nXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIE5vdGlmeSBzdGF0ZTpcbiAgICAgICAgICAgIHZhciAkYnRuID0gJGFjdGl2aXR5LmZpbmQoJ1t0eXBlPVwic3VibWl0XCJdJyk7XG4gICAgICAgICAgICAkYnRuLmJ1dHRvbignbG9hZGluZycpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBDbGVhciBwcmV2aW91cyBlcnJvciBzbyBtYWtlcyBjbGVhciB3ZVxuICAgICAgICAgICAgLy8gYXJlIGF0dGVtcHRpbmdcbiAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9naW5FcnJvcignJyk7XG4gICAgICAgIFxuICAgICAgICAgICAgdmFyIGVuZGVkID0gZnVuY3Rpb24gZW5kZWQoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy5pc0xvZ2luZ0luKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAkYnRuLmJ1dHRvbigncmVzZXQnKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQWZ0ZXIgY2xlYW4tdXAgZXJyb3IgKHRvIGZvcmNlIHNvbWUgdmlldyB1cGRhdGVzKSxcbiAgICAgICAgICAgIC8vIHZhbGlkYXRlIGFuZCBhYm9ydCBvbiBlcnJvclxuICAgICAgICAgICAgLy8gTWFudWFsbHkgY2hlY2tpbmcgZXJyb3Igb24gZWFjaCBmaWVsZFxuICAgICAgICAgICAgaWYgKHRoaXMuZGF0YVZpZXcudXNlcm5hbWUuZXJyb3IoKSB8fFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcucGFzc3dvcmQuZXJyb3IoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9naW5FcnJvcignUmV2aWV3IHlvdXIgZGF0YScpO1xuICAgICAgICAgICAgICAgIGVuZGVkKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBhcHAubW9kZWwubG9naW4oXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhVmlldy51c2VybmFtZSgpLFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcucGFzc3dvcmQoKVxuICAgICAgICAgICAgKS50aGVuKGZ1bmN0aW9uKGxvZ2luRGF0YSkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9naW5FcnJvcignJyk7XG4gICAgICAgICAgICAgICAgZW5kZWQoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5nb0Rhc2hib2FyZCgpO1xuXG4gICAgICAgICAgICB9LmJpbmQodGhpcykpLmNhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YVZpZXcubG9naW5FcnJvcignSW52YWxpZCB1c2VybmFtZSBvciBwYXNzd29yZCcpO1xuICAgICAgICAgICAgICAgIGVuZGVkKCk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgICBcbiAgICAvLyBGb2N1cyBmaXJzdCBiYWQgZmllbGQgb24gZXJyb3JcbiAgICB0aGlzLmRhdGFWaWV3LmxvZ2luRXJyb3Iuc3Vic2NyaWJlKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAvLyBMb2dpbiBpcyBlYXN5IHNpbmNlIHdlIG1hcmsgYm90aCB1bmlxdWUgZmllbGRzXG4gICAgICAgIC8vIGFzIGVycm9yIG9uIGxvZ2luRXJyb3IgKGl0cyBhIGdlbmVyYWwgZm9ybSBlcnJvcilcbiAgICAgICAgdmFyIGlucHV0ID0gJGFjdGl2aXR5LmZpbmQoJzppbnB1dCcpLmdldCgwKTtcbiAgICAgICAgaWYgKGVycilcbiAgICAgICAgICAgIGlucHV0LmZvY3VzKCk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlucHV0LmJsdXIoKTtcbiAgICB9KTtcbn1cblxuTG9naW5BY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xuICAgIFxuICAgIC8vIE5PVEU6IGRpcmVjbHR5IGVkaXRpbmcgdGhlIGFwcCBzdGF0dXMuXG4gICAgdGhpcy5hcHAuc3RhdHVzKCdsb2dpbicpO1xufTtcblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuICAgIFxuICAgIHRoaXMudXNlcm5hbWUgPSBrby5vYnNlcnZhYmxlKCcnKTtcbiAgICB0aGlzLnBhc3N3b3JkID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgdGhpcy5sb2dpbkVycm9yID0ga28ub2JzZXJ2YWJsZSgnJyk7XG4gICAgXG4gICAgdGhpcy5pc0xvZ2luZ0luID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG4gICAgXG4gICAgdGhpcy5wZXJmb3JtTG9naW4gPSBmdW5jdGlvbiBwZXJmb3JtTG9naW4oKSB7XG5cbiAgICAgICAgdGhpcy5pc0xvZ2luZ0luKHRydWUpOyAgICAgICAgXG4gICAgfS5iaW5kKHRoaXMpO1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIHVzZXJuYW1lIGFzIGFuIGVtYWlsXG4gICAgdmFyIGVtYWlsUmVnZXhwID0gL15bLTAtOUEtWmEteiEjJCUmJyorLz0/Xl9ge3x9fi5dK0BbLTAtOUEtWmEteiEjJCUmJyorLz0/Xl9ge3x9fi5dKyQvO1xuICAgIHRoaXMudXNlcm5hbWUuZXJyb3IgPSBrby5vYnNlcnZhYmxlKCcnKTtcbiAgICB0aGlzLnVzZXJuYW1lLnN1YnNjcmliZShmdW5jdGlvbih2KSB7XG4gICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgICBpZiAoZW1haWxSZWdleHAudGVzdCh2KSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWUuZXJyb3IoJycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZS5lcnJvcignSXMgbm90IGEgdmFsaWQgZW1haWwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudXNlcm5hbWUuZXJyb3IoJ1JlcXVpcmVkJyk7XG4gICAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuICAgIFxuICAgIC8vIHJlcXVpcmVkIHBhc3N3b3JkXG4gICAgdGhpcy5wYXNzd29yZC5lcnJvciA9IGtvLm9ic2VydmFibGUoJycpO1xuICAgIHRoaXMucGFzc3dvcmQuc3Vic2NyaWJlKGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgdmFyIGVyciA9ICcnO1xuICAgICAgICBpZiAoIXYpXG4gICAgICAgICAgICBlcnIgPSAnUmVxdWlyZWQnO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5wYXNzd29yZC5lcnJvcihlcnIpO1xuICAgIH0uYmluZCh0aGlzKSk7XG59XG4iLCIvKipcbiAgICBMb2dvdXQgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2luZ2xldG9uID0gbnVsbDtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdExvZ291dCgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IExvZ291dEFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcbiAgICBcbiAgICByZXR1cm4gc2luZ2xldG9uO1xufTtcblxuZnVuY3Rpb24gTG9nb3V0QWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcbiAgICBcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG5cbiAgICB0aGlzLiRhY3Rpdml0eSA9ICRhY3Rpdml0eTtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuTG9nb3V0QWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcblxuICAgIHRoaXMuYXBwLm1vZGVsLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIEFub255bW91cyB1c2VyIGFnYWluXG4gICAgICAgIHZhciBuZXdBbm9uID0gdGhpcy5hcHAubW9kZWwudXNlcigpLmNvbnN0cnVjdG9yLm5ld0Fub255bW91cygpO1xuICAgICAgICB0aGlzLmFwcC5tb2RlbC51c2VyKCkubW9kZWwudXBkYXRlV2l0aChuZXdBbm9uKTtcblxuICAgICAgICAvLyBHbyBpbmRleFxuICAgICAgICB0aGlzLmFwcC5zaGVsbC5nbygnLycpO1xuICAgICAgICBcbiAgICB9LmJpbmQodGhpcykpO1xufTtcbiIsIi8qKlxuICAgIE9uYm9hcmRpbmdDb21wbGV0ZSBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBzaW5nbGV0b24gPSBudWxsO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0T25ib2FyZGluZ0NvbXBsZXRlKCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgT25ib2FyZGluZ0NvbXBsZXRlQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xuICAgIFxuICAgIHJldHVybiBzaW5nbGV0b247XG59O1xuXG5mdW5jdGlvbiBPbmJvYXJkaW5nQ29tcGxldGVBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Mb2dnZWRVc2VyO1xuICAgIFxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIFxuICAgIHRoaXMubmF2QWN0aW9uID0gbnVsbDtcbn1cblxuT25ib2FyZGluZ0NvbXBsZXRlQWN0aXZpdHkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93KG9wdGlvbnMpIHtcblxufTtcbiIsIi8qKlxuICAgIE9uYm9hcmRpbmdIb21lIGFjdGl2aXR5XG4qKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIHNpbmdsZXRvbiA9IG51bGw7XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRPbmJvYXJkaW5nSG9tZSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IE9uYm9hcmRpbmdIb21lQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xuICAgIFxuICAgIHJldHVybiBzaW5nbGV0b247XG59O1xuXG5mdW5jdGlvbiBPbmJvYXJkaW5nSG9tZUFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkxvZ2dlZFVzZXI7XG4gICAgXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgXG4gICAgdGhpcy5uYXZBY3Rpb24gPSBudWxsO1xufVxuXG5PbmJvYXJkaW5nSG9tZUFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG5cbn07XG4iLCIvKipcbiAgICBQb3NpdGlvbnMgYWN0aXZpdHlcbioqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxuICAgIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcbiAgICBOYXZBY3Rpb24gPSByZXF1aXJlKCcuLi92aWV3bW9kZWxzL05hdkFjdGlvbicpO1xuXG52YXIgc2luZ2xldG9uID0gbnVsbDtcblxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFBvc2l0aW9ucygkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcbiAgICAgICAgc2luZ2xldG9uID0gbmV3IFBvc2l0aW9uc0FjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcbiAgICBcbiAgICByZXR1cm4gc2luZ2xldG9uO1xufTtcblxuZnVuY3Rpb24gUG9zaXRpb25zQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcblxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuUHJvdmlkZXI7XG4gICAgXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMuZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xuXG4gICAgLy8gVGVzdGluZ0RhdGFcbiAgICBzZXRTb21lVGVzdGluZ0RhdGEodGhpcy5kYXRhVmlldyk7XG5cbiAgICAvLyBPYmplY3QgdG8gaG9sZCB0aGUgb3B0aW9ucyBwYXNzZWQgb24gJ3Nob3cnIGFzIGEgcmVzdWx0XG4gICAgLy8gb2YgYSByZXF1ZXN0IGZyb20gYW5vdGhlciBhY3Rpdml0eVxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xuICAgIFxuICAgIHRoaXMubmF2QWN0aW9uID0gTmF2QWN0aW9uLm5ld0l0ZW07XG59XG5cblBvc2l0aW9uc0FjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG4gXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG9wdGlvbnM7XG59O1xuXG5mdW5jdGlvbiBWaWV3TW9kZWwoKSB7XG5cbiAgICAvLyBGdWxsIGxpc3Qgb2YgcG9zaXRpb25zXG4gICAgdGhpcy5wb3NpdGlvbnMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pO1xufVxuXG52YXIgUG9zaXRpb24gPSByZXF1aXJlKCcuLi9tb2RlbHMvUG9zaXRpb24nKTtcbi8vIFVzZXJQb3NpdGlvbiBtb2RlbFxuZnVuY3Rpb24gc2V0U29tZVRlc3RpbmdEYXRhKGRhdGF2aWV3KSB7XG4gICAgXG4gICAgZGF0YXZpZXcucG9zaXRpb25zLnB1c2gobmV3IFBvc2l0aW9uKHtcbiAgICAgICAgcG9zaXRpb25TaW5ndWxhcjogJ01hc3NhZ2UgVGhlcmFwaXN0J1xuICAgIH0pKTtcbiAgICBkYXRhdmlldy5wb3NpdGlvbnMucHVzaChuZXcgUG9zaXRpb24oe1xuICAgICAgICBwb3NpdGlvblNpbmd1bGFyOiAnSG91c2VrZWVwZXInXG4gICAgfSkpO1xufSIsIi8qKlxyXG4gICAgc2VydmljZXMgYWN0aXZpdHlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbiAgICBcclxudmFyIHNpbmdsZXRvbiA9IG51bGw7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0U2VydmljZXMoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxyXG4gICAgICAgIHNpbmdsZXRvbiA9IG5ldyBTZXJ2aWNlc0FjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFNlcnZpY2VzQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApIHtcclxuXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLlByb3ZpZGVyO1xyXG4gICAgXHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuICAgIHRoaXMuJGFjdGl2aXR5ID0gJGFjdGl2aXR5O1xyXG4gICAgdGhpcy4kbGlzdFZpZXcgPSAkYWN0aXZpdHkuZmluZCgnI3NlcnZpY2VzTGlzdFZpZXcnKTtcclxuXHJcbiAgICB2YXIgZGF0YVZpZXcgPSB0aGlzLmRhdGFWaWV3ID0gbmV3IFZpZXdNb2RlbCgpO1xyXG4gICAga28uYXBwbHlCaW5kaW5ncyhkYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XHJcblxyXG4gICAgLy8gVGVzdGluZ0RhdGFcclxuICAgIGRhdGFWaWV3LnNlcnZpY2VzKHJlcXVpcmUoJy4uL3Rlc3RkYXRhL3NlcnZpY2VzJykuc2VydmljZXMubWFwKFNlbGVjdGFibGUpKTtcclxuICAgIFxyXG4gICAgLy8gSGFuZGxlciB0byB1cGRhdGUgaGVhZGVyIGJhc2VkIG9uIGEgbW9kZSBjaGFuZ2U6XHJcbiAgICB0aGlzLmRhdGFWaWV3LmlzU2VsZWN0aW9uTW9kZS5zdWJzY3JpYmUoZnVuY3Rpb24gKGl0SXMpIHtcclxuICAgICAgICB0aGlzLmRhdGFWaWV3LmhlYWRlclRleHQoaXRJcyA/ICdTZWxlY3Qgc2VydmljZShzKScgOiAnU2VydmljZXMnKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgLy8gT2JqZWN0IHRvIGhvbGQgdGhlIG9wdGlvbnMgcGFzc2VkIG9uICdzaG93JyBhcyBhIHJlc3VsdFxyXG4gICAgLy8gb2YgYSByZXF1ZXN0IGZyb20gYW5vdGhlciBhY3Rpdml0eVxyXG4gICAgdGhpcy5yZXF1ZXN0SW5mbyA9IG51bGw7XHJcbiAgICBcclxuICAgIC8vIEhhbmRsZXIgdG8gZ28gYmFjayB3aXRoIHRoZSBzZWxlY3RlZCBzZXJ2aWNlIHdoZW4gXHJcbiAgICAvLyBzZWxlY3Rpb24gbW9kZSBnb2VzIG9mZiBhbmQgcmVxdWVzdEluZm8gaXMgZm9yXHJcbiAgICAvLyAnc2VsZWN0IG1vZGUnXHJcbiAgICB0aGlzLmRhdGFWaWV3LmlzU2VsZWN0aW9uTW9kZS5zdWJzY3JpYmUoZnVuY3Rpb24gKGl0SXMpIHtcclxuICAgICAgICAvLyBXZSBoYXZlIGEgcmVxdWVzdCBhbmRcclxuICAgICAgICAvLyBpdCByZXF1ZXN0ZWQgdG8gc2VsZWN0IGEgc2VydmljZVxyXG4gICAgICAgIC8vIGFuZCBzZWxlY3Rpb24gbW9kZSBnb2VzIG9mZlxyXG4gICAgICAgIGlmICh0aGlzLnJlcXVlc3RJbmZvICYmXHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdEluZm8uc2VsZWN0U2VydmljZXMgPT09IHRydWUgJiZcclxuICAgICAgICAgICAgaXRJcyA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFBhc3MgdGhlIHNlbGVjdGVkIGNsaWVudCBpbiB0aGUgaW5mb1xyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvLnNlbGVjdGVkU2VydmljZXMgPSB0aGlzLmRhdGFWaWV3LnNlbGVjdGVkU2VydmljZXMoKTtcclxuICAgICAgICAgICAgLy8gQW5kIGdvIGJhY2tcclxuICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ29CYWNrKHRoaXMucmVxdWVzdEluZm8pO1xyXG4gICAgICAgICAgICAvLyBMYXN0LCBjbGVhciByZXF1ZXN0SW5mb1xyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RJbmZvID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59XHJcblxyXG5TZXJ2aWNlc0FjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XHJcblxyXG4gIFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICB0aGlzLnJlcXVlc3RJbmZvID0gb3B0aW9ucztcclxuXHJcbiAgICBpZiAob3B0aW9ucy5zZWxlY3RTZXJ2aWNlcyA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuaXNTZWxlY3Rpb25Nb2RlKHRydWUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8qIFRyaWFscyB0byBwcmVzZXRzIHRoZSBzZWxlY3RlZCBzZXJ2aWNlcywgTk9UIFdPUktJTkdcclxuICAgICAgICB2YXIgc2VydmljZXMgPSAob3B0aW9ucy5zZWxlY3RlZFNlcnZpY2VzIHx8IFtdKTtcclxuICAgICAgICB2YXIgc2VsZWN0ZWRTZXJ2aWNlcyA9IHRoaXMuZGF0YVZpZXcuc2VsZWN0ZWRTZXJ2aWNlcztcclxuICAgICAgICBzZWxlY3RlZFNlcnZpY2VzLnJlbW92ZUFsbCgpO1xyXG4gICAgICAgIHRoaXMuZGF0YVZpZXcuc2VydmljZXMoKS5mb3JFYWNoKGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgc2VydmljZXMuZm9yRWFjaChmdW5jdGlvbihzZWxTZXJ2aWNlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsU2VydmljZSA9PT0gc2VydmljZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlcnZpY2UuaXNTZWxlY3RlZCh0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZFNlcnZpY2VzLnB1c2goc2VydmljZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlcnZpY2UuaXNTZWxlY3RlZChmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICovXHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBTZWxlY3RhYmxlKG9iaikge1xyXG4gICAgb2JqLmlzU2VsZWN0ZWQgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcclxuICAgIHJldHVybiBvYmo7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFZpZXdNb2RlbCgpIHtcclxuXHJcbiAgICB0aGlzLmhlYWRlclRleHQgPSBrby5vYnNlcnZhYmxlKCdTZXJ2aWNlcycpO1xyXG5cclxuICAgIC8vIEZ1bGwgbGlzdCBvZiBzZXJ2aWNlc1xyXG4gICAgdGhpcy5zZXJ2aWNlcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcblxyXG4gICAgLy8gRXNwZWNpYWwgbW9kZSB3aGVuIGluc3RlYWQgb2YgcGljayBhbmQgZWRpdCB3ZSBhcmUganVzdCBzZWxlY3RpbmdcclxuICAgIC8vICh3aGVuIGVkaXRpbmcgYW4gYXBwb2ludG1lbnQpXHJcbiAgICB0aGlzLmlzU2VsZWN0aW9uTW9kZSA9IGtvLm9ic2VydmFibGUoZmFsc2UpO1xyXG5cclxuICAgIC8vIEdyb3VwZWQgbGlzdCBvZiBwcmljaW5nczpcclxuICAgIC8vIERlZmluZWQgZ3JvdXBzOiByZWd1bGFyIHNlcnZpY2VzIGFuZCBhZGQtb25zXHJcbiAgICB0aGlzLmdyb3VwZWRTZXJ2aWNlcyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIHZhciBzZXJ2aWNlcyA9IHRoaXMuc2VydmljZXMoKTtcclxuXHJcbiAgICAgICAgdmFyIHNlcnZpY2VzR3JvdXAgPSB7XHJcbiAgICAgICAgICAgICAgICBncm91cDogJ1NlcnZpY2VzJyxcclxuICAgICAgICAgICAgICAgIHNlcnZpY2VzOiBbXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBhZGRvbnNHcm91cCA9IHtcclxuICAgICAgICAgICAgICAgIGdyb3VwOiAnQWRkLW9uIHNlcnZpY2VzJyxcclxuICAgICAgICAgICAgICAgIHNlcnZpY2VzOiBbXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBncm91cHMgPSBbc2VydmljZXNHcm91cCwgYWRkb25zR3JvdXBdO1xyXG5cclxuICAgICAgICBzZXJ2aWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBpc0FkZG9uID0gc2VydmljZS5pc0FkZG9uKCk7XHJcbiAgICAgICAgICAgIGlmIChpc0FkZG9uKSB7XHJcbiAgICAgICAgICAgICAgICBhZGRvbnNHcm91cC5zZXJ2aWNlcy5wdXNoKHNlcnZpY2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2VydmljZXNHcm91cC5zZXJ2aWNlcy5wdXNoKHNlcnZpY2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBncm91cHM7XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2VsZWN0ZWRTZXJ2aWNlcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7XHJcbiAgICAvKipcclxuICAgICAgICBUb2dnbGUgdGhlIHNlbGVjdGlvbiBzdGF0dXMgb2YgYSBzZXJ2aWNlLCBhZGRpbmdcclxuICAgICAgICBvciByZW1vdmluZyBpdCBmcm9tIHRoZSAnc2VsZWN0ZWRTZXJ2aWNlcycgYXJyYXkuXHJcbiAgICAqKi9cclxuICAgIHRoaXMudG9nZ2xlU2VydmljZVNlbGVjdGlvbiA9IGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgaW5JbmRleCA9IC0xLFxyXG4gICAgICAgICAgICBpc1NlbGVjdGVkID0gdGhpcy5zZWxlY3RlZFNlcnZpY2VzKCkuc29tZShmdW5jdGlvbihzZWxlY3RlZFNlcnZpY2UsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RlZFNlcnZpY2UgPT09IHNlcnZpY2UpIHtcclxuICAgICAgICAgICAgICAgIGluSW5kZXggPSBpbmRleDtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2VydmljZS5pc1NlbGVjdGVkKCFpc1NlbGVjdGVkKTtcclxuXHJcbiAgICAgICAgaWYgKGlzU2VsZWN0ZWQpXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRTZXJ2aWNlcy5zcGxpY2UoaW5JbmRleCwgMSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkU2VydmljZXMucHVzaChzZXJ2aWNlKTtcclxuXHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIEVuZHMgdGhlIHNlbGVjdGlvbiBwcm9jZXNzLCByZWFkeSB0byBjb2xsZWN0IHNlbGVjdGlvblxyXG4gICAgICAgIGFuZCBwYXNzaW5nIGl0IHRvIHRoZSByZXF1ZXN0IGFjdGl2aXR5XHJcbiAgICAqKi9cclxuICAgIHRoaXMuZW5kU2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5pc1NlbGVjdGlvbk1vZGUoZmFsc2UpO1xyXG4gICAgICAgIFxyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG59XHJcbiIsIi8qKlxuICAgIFNpZ251cCBhY3Rpdml0eVxuKiovXG4ndXNlIHN0cmljdCc7XG5cbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxuICAgIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4uL3ZpZXdtb2RlbHMvTmF2QWN0aW9uJyk7XG5cbnZhciBzaW5nbGV0b24gPSBudWxsO1xuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0U2lnbnVwKCRhY3Rpdml0eSwgYXBwKSB7XG5cbiAgICBpZiAoc2luZ2xldG9uID09PSBudWxsKVxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgU2lnbnVwQWN0aXZpdHkoJGFjdGl2aXR5LCBhcHApO1xuICAgIFxuICAgIHJldHVybiBzaW5nbGV0b247XG59O1xuXG5mdW5jdGlvbiBTaWdudXBBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xuXG4gICAgdGhpcy5hY2Nlc3NMZXZlbCA9IGFwcC5Vc2VyVHlwZS5Bbm9ueW1vdXM7XG4gICAgXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcbiAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMuZGF0YVZpZXcsICRhY3Rpdml0eS5nZXQoMCkpO1xuICAgIFxuICAgIHRoaXMubmF2QWN0aW9uID0gTmF2QWN0aW9uLmdvQmFjaztcbiAgICBcbiAgICAvLyBUT0RPOiBpbXBsZW1lbnQgcmVhbCBsb2dpblxuICAgIC8vIFRFU1RJTkc6IHRoZSBidXR0b24gc3RhdGUgd2l0aCBhIGZha2UgZGVsYXlcbiAgICAkYWN0aXZpdHkuZmluZCgnI2FjY291bnRTaWduVXBCdG4nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgJGJ0biA9ICQoZS50YXJnZXQpLmJ1dHRvbignbG9hZGluZycpO1xuXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIFxuICAgICAgICAgICAgJGJ0bi5idXR0b24oJ3Jlc2V0Jyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIFRFU1RJTkc6IHBvcHVsYXRpbmcgdXNlclxuICAgICAgICAgICAgZmFrZVNpZ251cCh0aGlzLmFwcCk7XG4gICAgICAgICAgXG4gICAgICAgICAgICAvLyBOT1RFOiBvbmJvYXJkaW5nIG9yIG5vdD9cbiAgICAgICAgICAgIHZhciBvbmJvYXJkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAob25ib2FyZGluZykge1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnNoZWxsLmdvKCdvbmJvYXJkaW5nSG9tZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ28oJ2hvbWUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMTAwMCk7XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0uYmluZCh0aGlzKSk7XG59XG5cblNpZ251cEFjdGl2aXR5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gc2hvdyhvcHRpb25zKSB7XG5cbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnJvdXRlICYmXG4gICAgICAgIG9wdGlvbnMucm91dGUuc2VnbWVudHMgJiZcbiAgICAgICAgb3B0aW9ucy5yb3V0ZS5zZWdtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5kYXRhVmlldy5wcm9maWxlKG9wdGlvbnMucm91dGUuc2VnbWVudHNbMF0pO1xuICAgIH1cbn07XG5cbi8vIFRPRE86IHJlbW92ZSBhZnRlciBpbXBsZW1lbnQgcmVhbCBsb2dpblxuZnVuY3Rpb24gZmFrZVNpZ251cChhcHApIHtcbiAgICBhcHAubW9kZWwudXNlcih7IC8vIG5ldyBVc2VyKHt9XG4gICAgICAgIGVtYWlsOiBrby5vYnNlcnZhYmxlKCd0ZXN0QGxvY29ub21pY3MuY29tJyksXG4gICAgICAgIGZpcnN0TmFtZToga28ub2JzZXJ2YWJsZSgnVXNlcm5hbWUnKSxcbiAgICAgICAgb25ib2FyZGluZ1N0ZXA6IGtvLm9ic2VydmFibGUobnVsbCksXG4gICAgICAgIHVzZXJUeXBlOiBrby5vYnNlcnZhYmxlKCdwJylcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xuICAgIHRoaXMucHJvZmlsZSA9IGtvLm9ic2VydmFibGUoJ2N1c3RvbWVyJyk7XG59IiwiLyoqXHJcbiAgICB0ZXh0RWRpdG9yIGFjdGl2aXR5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xyXG4gICAgXHJcbnZhciBzaW5nbGV0b24gPSBudWxsO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFRleHRFZGl0b3IoJGFjdGl2aXR5LCBhcHApIHtcclxuICAgIFxyXG4gICAgaWYgKHNpbmdsZXRvbiA9PT0gbnVsbClcclxuICAgICAgICBzaW5nbGV0b24gPSBuZXcgVGV4dEVkaXRvckFjdGl2aXR5KCRhY3Rpdml0eSwgYXBwKTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHNpbmdsZXRvbjtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFRleHRFZGl0b3JBY3Rpdml0eSgkYWN0aXZpdHksIGFwcCkge1xyXG5cclxuICAgIC8vIEZpZWxkc1xyXG4gICAgdGhpcy4kYWN0aXZpdHkgPSAkYWN0aXZpdHk7XHJcbiAgICB0aGlzLmFwcCA9IGFwcDtcclxuICAgIHRoaXMuJHRleHRhcmVhID0gdGhpcy4kYWN0aXZpdHkuZmluZCgndGV4dGFyZWEnKTtcclxuICAgIHRoaXMudGV4dGFyZWEgPSB0aGlzLiR0ZXh0YXJlYS5nZXQoMCk7XHJcblxyXG4gICAgLy8gRGF0YVxyXG4gICAgdGhpcy5kYXRhVmlldyA9IG5ldyBWaWV3TW9kZWwoKTtcclxuICAgIGtvLmFwcGx5QmluZGluZ3ModGhpcy5kYXRhVmlldywgJGFjdGl2aXR5LmdldCgwKSk7XHJcbiAgICBcclxuICAgIC8vIE9iamVjdCB0byBob2xkIHRoZSBvcHRpb25zIHBhc3NlZCBvbiAnc2hvdycgYXMgYSByZXN1bHRcclxuICAgIC8vIG9mIGEgcmVxdWVzdCBmcm9tIGFub3RoZXIgYWN0aXZpdHlcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBudWxsO1xyXG4gICAgXHJcbiAgICAvLyBIYW5kbGVyc1xyXG4gICAgLy8gSGFuZGxlciBmb3IgdGhlICdzYXZlZCcgZXZlbnQgc28gdGhlIGFjdGl2aXR5XHJcbiAgICAvLyByZXR1cm5zIGJhY2sgdG8gdGhlIHJlcXVlc3RlciBhY3Rpdml0eSBnaXZpbmcgaXRcclxuICAgIC8vIHRoZSBuZXcgdGV4dFxyXG4gICAgdGhpcy5kYXRhVmlldy5vbignc2F2ZWQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAodGhpcy5yZXF1ZXN0SW5mbykge1xyXG4gICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGluZm8gd2l0aCB0aGUgbmV3IHRleHRcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0SW5mby50ZXh0ID0gdGhpcy5kYXRhVmlldy50ZXh0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBhbmQgcGFzcyBpdCBiYWNrXHJcbiAgICAgICAgdGhpcy5hcHAuc2hlbGwuZ29CYWNrKHRoaXMucmVxdWVzdEluZm8pO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuIFxyXG4gICAgLy8gSGFuZGxlciB0aGUgY2FuY2VsIGV2ZW50XHJcbiAgICB0aGlzLmRhdGFWaWV3Lm9uKCdjYW5jZWwnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyByZXR1cm4sIG5vdGhpbmcgY2hhbmdlZFxyXG4gICAgICAgIGFwcC5zaGVsbC5nb0JhY2soKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn1cclxuXHJcblRleHRFZGl0b3JBY3Rpdml0eS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uIHNob3cob3B0aW9ucykge1xyXG4gICAgXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIHRoaXMucmVxdWVzdEluZm8gPSBvcHRpb25zO1xyXG5cclxuICAgIHRoaXMuZGF0YVZpZXcuaGVhZGVyVGV4dChvcHRpb25zLmhlYWRlcik7XHJcbiAgICB0aGlzLmRhdGFWaWV3LnRleHQob3B0aW9ucy50ZXh0KTtcclxuICAgIGlmIChvcHRpb25zLnJvd3NOdW1iZXIpXHJcbiAgICAgICAgdGhpcy5kYXRhVmlldy5yb3dzTnVtYmVyKG9wdGlvbnMucm93c051bWJlcik7XHJcbiAgICAgICAgXHJcbiAgICAvLyBJbm1lZGlhdGUgZm9jdXMgdG8gdGhlIHRleHRhcmVhIGZvciBiZXR0ZXIgdXNhYmlsaXR5XHJcbiAgICB0aGlzLnRleHRhcmVhLmZvY3VzKCk7XHJcbiAgICB0aGlzLiR0ZXh0YXJlYS5jbGljaygpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVmlld01vZGVsKCkge1xyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dCA9IGtvLm9ic2VydmFibGUoJ1RleHQnKTtcclxuXHJcbiAgICAvLyBUZXh0IHRvIGVkaXRcclxuICAgIHRoaXMudGV4dCA9IGtvLm9ic2VydmFibGUoJycpO1xyXG4gICAgXHJcbiAgICAvLyBOdW1iZXIgb2Ygcm93cyBmb3IgdGhlIHRleHRhcmVhXHJcbiAgICB0aGlzLnJvd3NOdW1iZXIgPSBrby5vYnNlcnZhYmxlKDIpO1xyXG5cclxuICAgIHRoaXMuY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKCkge1xyXG4gICAgICAgIHRoaXMuZW1pdCgnY2FuY2VsJyk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLnNhdmUgPSBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgICAgIHRoaXMuZW1pdCgnc2F2ZWQnKTtcclxuICAgIH07XHJcbn1cclxuXHJcblZpZXdNb2RlbC5faW5oZXJpdHMoRXZlbnRFbWl0dGVyKTtcclxuIiwiLyoqXHJcbiAgICBMaXN0IG9mIGFjdGl2aXRpZXMgbG9hZGVkIGluIHRoZSBBcHAsXHJcbiAgICBhcyBhbiBvYmplY3Qgd2l0aCB0aGUgYWN0aXZpdHkgbmFtZSBhcyB0aGUga2V5XHJcbiAgICBhbmQgdGhlIGNvbnRyb2xsZXIgYXMgdmFsdWUuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICdjYWxlbmRhcic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jYWxlbmRhcicpLFxyXG4gICAgJ2RhdGV0aW1lUGlja2VyJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2RhdGV0aW1lUGlja2VyJyksXHJcbiAgICAnY2xpZW50cyc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9jbGllbnRzJyksXHJcbiAgICAnc2VydmljZXMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvc2VydmljZXMnKSxcclxuICAgICdsb2NhdGlvbnMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvbG9jYXRpb25zJyksXHJcbiAgICAndGV4dEVkaXRvcic6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy90ZXh0RWRpdG9yJyksXHJcbiAgICAnaG9tZSc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9ob21lJyksXHJcbiAgICAnYXBwb2ludG1lbnQnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvYXBwb2ludG1lbnQnKSxcclxuICAgICdib29raW5nQ29uZmlybWF0aW9uJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2Jvb2tpbmdDb25maXJtYXRpb24nKSxcclxuICAgICdpbmRleCc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9pbmRleCcpLFxyXG4gICAgJ2xvZ2luJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2xvZ2luJyksXHJcbiAgICAnbG9nb3V0JzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL2xvZ291dCcpLFxyXG4gICAgJ2xlYXJuTW9yZSc6IHJlcXVpcmUoJy4vYWN0aXZpdGllcy9sZWFybk1vcmUnKSxcclxuICAgICdzaWdudXAnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvc2lnbnVwJyksXHJcbiAgICAnY29udGFjdEluZm8nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvY29udGFjdEluZm8nKSxcclxuICAgICdwb3NpdGlvbnMnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvcG9zaXRpb25zJyksXHJcbiAgICAnb25ib2FyZGluZ0hvbWUnOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvb25ib2FyZGluZ0hvbWUnKSxcclxuICAgICdsb2NhdGlvbkVkaXRpb24nOiByZXF1aXJlKCcuL2FjdGl2aXRpZXMvbG9jYXRpb25FZGl0aW9uJyksXHJcbiAgICAnb25ib2FyZGluZ0NvbXBsZXRlJzogcmVxdWlyZSgnLi9hY3Rpdml0aWVzL29uYm9hcmRpbmdDb21wbGV0ZScpXHJcbn07XHJcbiIsIi8qKlxyXG4gICAgU2V0dXAgb2YgdGhlIHNoZWxsIG9iamVjdCB1c2VkIGJ5IHRoZSBhcHBcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBiYXNlVXJsID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xyXG5cclxuLy92YXIgSGlzdG9yeSA9IHJlcXVpcmUoJy4vYXBwLXNoZWxsLWhpc3RvcnknKS5jcmVhdGUoYmFzZVVybCk7XHJcbnZhciBIaXN0b3J5ID0gcmVxdWlyZSgnLi91dGlscy9zaGVsbC9oYXNoYmFuZ0hpc3RvcnknKTtcclxuXHJcbi8vIFNoZWxsIGRlcGVuZGVuY2llc1xyXG52YXIgc2hlbGwgPSByZXF1aXJlKCcuL3V0aWxzL3NoZWxsL2luZGV4JyksXHJcbiAgICBTaGVsbCA9IHNoZWxsLlNoZWxsLFxyXG4gICAgRG9tSXRlbXNNYW5hZ2VyID0gc2hlbGwuRG9tSXRlbXNNYW5hZ2VyO1xyXG5cclxuLy8gQ3JlYXRpbmcgdGhlIHNoZWxsOlxyXG52YXIgc2hlbGwgPSBuZXcgU2hlbGwoe1xyXG5cclxuICAgIC8vIFNlbGVjdG9yLCBET00gZWxlbWVudCBvciBqUXVlcnkgb2JqZWN0IHBvaW50aW5nXHJcbiAgICAvLyB0aGUgcm9vdCBvciBjb250YWluZXIgZm9yIHRoZSBzaGVsbCBpdGVtc1xyXG4gICAgcm9vdDogJ2JvZHknLFxyXG5cclxuICAgIC8vIElmIGlzIG5vdCBpbiB0aGUgc2l0ZSByb290LCB0aGUgYmFzZSBVUkwgaXMgcmVxdWlyZWQ6XHJcbiAgICBiYXNlVXJsOiBiYXNlVXJsLFxyXG4gICAgXHJcbiAgICBmb3JjZUhhc2hiYW5nOiB0cnVlLFxyXG5cclxuICAgIGluZGV4TmFtZTogJ2luZGV4JyxcclxuXHJcbiAgICAvLyBmb3IgZmFzdGVyIG1vYmlsZSBleHBlcmllbmNlIChqcXVlcnktbW9iaWxlIGV2ZW50KTpcclxuICAgIGxpbmtFdmVudDogJ3RhcCcsXHJcblxyXG4gICAgLy8gTm8gbmVlZCBmb3IgbG9hZGVyLCBldmVyeXRoaW5nIGNvbWVzIGJ1bmRsZWRcclxuICAgIGxvYWRlcjogbnVsbCxcclxuXHJcbiAgICAvLyBIaXN0b3J5IFBvbHlmaWxsOlxyXG4gICAgaGlzdG9yeTogSGlzdG9yeSxcclxuXHJcbiAgICAvLyBBIERvbUl0ZW1zTWFuYWdlciBvciBlcXVpdmFsZW50IG9iamVjdCBpbnN0YW5jZSBuZWVkcyB0b1xyXG4gICAgLy8gYmUgcHJvdmlkZWQ6XHJcbiAgICBkb21JdGVtc01hbmFnZXI6IG5ldyBEb21JdGVtc01hbmFnZXIoe1xyXG4gICAgICAgIGlkQXR0cmlidXRlTmFtZTogJ2RhdGEtYWN0aXZpdHknXHJcbiAgICB9KVxyXG59KTtcclxuXHJcbi8vIENhdGNoIGVycm9ycyBvbiBpdGVtL3BhZ2UgbG9hZGluZywgc2hvd2luZy4uXHJcbnNoZWxsLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGVycikge1xyXG4gICAgXHJcbiAgICB2YXIgc3RyID0gJ1Vua25vdyBlcnJvcic7XHJcbiAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZihlcnIpID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICBzdHIgPSBlcnI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGVyci5tZXNzYWdlKSB7XHJcbiAgICAgICAgICAgIHN0ciA9IGVyci5tZXNzYWdlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgc3RyID0gSlNPTi5zdHJpbmdpZnkoZXJyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVE9ETyBjaGFuZ2Ugd2l0aCBhIGRpYWxvZyBvciBzb21ldGhpbmdcclxuICAgIHdpbmRvdy5hbGVydChzdHIpO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2hlbGw7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKiBHbG9iYWwgZGVwZW5kZW5jaWVzICoqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdib290c3RyYXAnKTtcclxucmVxdWlyZSgnanF1ZXJ5LW1vYmlsZScpO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG5rby5iaW5kaW5nSGFuZGxlcnMuZm9ybWF0ID0gcmVxdWlyZSgna28vZm9ybWF0QmluZGluZycpLmZvcm1hdEJpbmRpbmc7XHJcbnZhciBib290a25vY2sgPSByZXF1aXJlKCcuL3V0aWxzL2Jvb3Rrbm9ja0JpbmRpbmdIZWxwZXJzJyk7XHJcbnJlcXVpcmUoJy4vdXRpbHMvRnVuY3Rpb24ucHJvdG90eXBlLl9pbmhlcml0cycpO1xyXG5yZXF1aXJlKCcuL3V0aWxzL0Z1bmN0aW9uLnByb3RvdHlwZS5fZGVsYXllZCcpO1xyXG4vLyBQcm9taXNlIHBvbHlmaWxsLCBzbyBpdHMgbm90ICdyZXF1aXJlJ2QgcGVyIG1vZHVsZTpcclxucmVxdWlyZSgnZXM2LXByb21pc2UnKS5wb2x5ZmlsbCgpO1xyXG5cclxudmFyIGxheW91dFVwZGF0ZUV2ZW50ID0gcmVxdWlyZSgnbGF5b3V0VXBkYXRlRXZlbnQnKTtcclxudmFyIE5hdkFjdGlvbiA9IHJlcXVpcmUoJy4vdmlld21vZGVscy9OYXZBY3Rpb24nKSxcclxuICAgIEFwcE1vZGVsID0gcmVxdWlyZSgnLi92aWV3bW9kZWxzL0FwcE1vZGVsJyk7XHJcblxyXG4vLyBSZWdpc3RlciB0aGUgc3BlY2lhbCBsb2NhbGVcclxucmVxdWlyZSgnLi9sb2NhbGVzL2VuLVVTLUxDJyk7XHJcblxyXG4vKipcclxuICAgIEFwcCBzdGF0aWMgY2xhc3NcclxuKiovXHJcbnZhciBhcHAgPSB7XHJcbiAgICBzaGVsbDogcmVxdWlyZSgnLi9hcHAtc2hlbGwnKSxcclxuICAgIFxyXG4gICAgLy8gTmV3IGFwcCBtb2RlbCwgdGhhdCBzdGFydHMgd2l0aCBhbm9ueW1vdXMgdXNlclxyXG4gICAgbW9kZWw6IG5ldyBBcHBNb2RlbCgpLFxyXG4gICAgXHJcbiAgICAvLyBUT0RPIERvdWJsZSBjaGVjayBpdCB3b3Jrc1xyXG4gICAgLy8gJ291dCcsICdsb2dpbicsICdvbmJvYXJkaW5nJywgJ2luJ1xyXG4gICAgc3RhdHVzOiBrby5vYnNlcnZhYmxlKCdvdXQnKSxcclxuICAgIFxyXG4gICAgLyoqIExvYWQgYWN0aXZpdGllcyBjb250cm9sbGVycyAobm90IGluaXRpYWxpemVkKSAqKi9cclxuICAgIGFjdGl2aXRpZXM6IHJlcXVpcmUoJy4vYXBwLWFjdGl2aXRpZXMnKSxcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgICAgSnVzdCByZWRpcmVjdCB0aGUgYmV0dGVyIHBsYWNlIGZvciBjdXJyZW50IHVzZXIgYW5kIHN0YXRlXHJcbiAgICAqKi9cclxuICAgIGdvRGFzaGJvYXJkOiBmdW5jdGlvbiBnb0Rhc2hib2FyZCgpIHtcclxuICAgICAgICB2YXIgb25ib2FyZGluZyA9IHRoaXMubW9kZWwudXNlcigpLm9uYm9hcmRpbmdTdGVwKCk7XHJcbiAgICAgICAgaWYgKG9uYm9hcmRpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5zaGVsbC5nbygnb25ib2FyZGluZ0hvbWUvJyArIG9uYm9hcmRpbmcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5zaGVsbC5nbygnaG9tZScpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIFVwZGF0ZSB0aGUgYXBwIG1lbnUgdG8gaGlnaGxpZ2h0IHRoZVxyXG4gICAgICAgIGdpdmVuIGxpbmsgbmFtZVxyXG4gICAgKiovXHJcbiAgICB1cGRhdGVNZW51OiBmdW5jdGlvbiB1cGRhdGVNZW51KG5hbWUpIHtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLiRtZW51ID0gdGhpcy4kbWVudSB8fCAkKCcjbmF2YmFyJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gUmVtb3ZlIGFueSBhY3RpdmVcclxuICAgICAgICB0aGlzLiRtZW51XHJcbiAgICAgICAgLmZpbmQoJ2xpJylcclxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xyXG4gICAgICAgIC8vIEFkZCBhY3RpdmVcclxuICAgICAgICB0aGlzLiRtZW51XHJcbiAgICAgICAgLmZpbmQoJy5nby0nICsgbmFtZSlcclxuICAgICAgICAuY2xvc2VzdCgnbGknKVxyXG4gICAgICAgIC5hZGRDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgLy8gSGlkZSBtZW51XHJcbiAgICAgICAgdGhpcy4kbWVudVxyXG4gICAgICAgIC5maWx0ZXIoJzp2aXNpYmxlJylcclxuICAgICAgICAuY29sbGFwc2UoJ2hpZGUnKTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICAgIE9ic2VydmFibGVzIGFuZCBtZXRob2RzIHRvIG1hbmFnZSB0aGUgc2hhcmVkXHJcbiAgICAgICAgYXBwIG5hdmlnYXRpb24gYmFyLlxyXG4gICAgICAgIFxyXG4gICAgICAgIFRPRE86IGNvbXBsZXRlIGZvciB0aGUgbmV3IGRlc2lnblxyXG4gICAgKiovXHJcbiAgICBuYXZBY3Rpb246IGtvLm9ic2VydmFibGUobnVsbCksXHJcbiAgICBkZWZhdWx0TmF2QWN0aW9uOiBudWxsLFxyXG4gICAgdXBkYXRlQXBwTmF2OiBmdW5jdGlvbiB1cGRhdGVBcHBOYXYoYWN0aXZpdHkpIHtcclxuICAgICAgICAvLyBuYXZBY3Rpb24sIGlmIHRoZSBhY3Rpdml0eSBoYXMgaXRzIG93blxyXG4gICAgICAgIGlmICgnbmF2QWN0aW9uJyBpbiBhY3Rpdml0eSkge1xyXG4gICAgICAgICAgICAvLyBVc2Ugc3BlY2lhbGl6aWVkIGFjdGl2aXR5IGFjdGlvblxyXG4gICAgICAgICAgICB0aGlzLm5hdkFjdGlvbihhY3Rpdml0eS5uYXZBY3Rpb24pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gVXNlIGRlZmF1bHQgYWN0aW9uXHJcbiAgICAgICAgICAgIHRoaXMubmF2QWN0aW9uKHRoaXMuZGVmYXVsdE5hdkFjdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqIENvbnRpbnVlIGFwcCBjcmVhdGlvbiB3aXRoIHRoaW5ncyB0aGF0IG5lZWQgYSByZWZlcmVuY2UgdG8gdGhlIGFwcCAqKi9cclxuXHJcbmFwcC5nZXRBY3Rpdml0eSA9IGZ1bmN0aW9uIGdldEFjdGl2aXR5KG5hbWUpIHtcclxuICAgIHZhciBhY3Rpdml0eSA9IHRoaXMuYWN0aXZpdGllc1tuYW1lXTtcclxuICAgIGlmIChhY3Rpdml0eSkge1xyXG4gICAgICAgIHZhciAkYWN0ID0gdGhpcy5zaGVsbC5pdGVtcy5maW5kKG5hbWUpO1xyXG4gICAgICAgIGlmICgkYWN0ICYmICRhY3QubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm4gYWN0aXZpdHkuaW5pdCgkYWN0LCB0aGlzKTtcclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG59O1xyXG5cclxuYXBwLmdldEFjdGl2aXR5Q29udHJvbGxlckJ5Um91dGUgPSBmdW5jdGlvbiBnZXRBY3Rpdml0eUNvbnRyb2xsZXJCeVJvdXRlKHJvdXRlKSB7XHJcbiAgICAvLyBGcm9tIHRoZSByb3V0ZSBvYmplY3QsIHRoZSBpbXBvcnRhbnQgcGllY2UgaXMgcm91dGUubmFtZVxyXG4gICAgLy8gdGhhdCBjb250YWlucyB0aGUgYWN0aXZpdHkgbmFtZSBleGNlcHQgaWYgaXMgdGhlIHJvb3RcclxuICAgIHZhciBhY3ROYW1lID0gcm91dGUubmFtZSB8fCB0aGlzLnNoZWxsLmluZGV4TmFtZTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHRoaXMuZ2V0QWN0aXZpdHkoYWN0TmFtZSk7XHJcbn07XHJcblxyXG4vLyBhY2Nlc3NDb250cm9sIHNldHVwOiBjYW5ub3QgYmUgc3BlY2lmaWVkIG9uIFNoZWxsIGNyZWF0aW9uIGJlY2F1c2VcclxuLy8gZGVwZW5kcyBvbiB0aGUgYXBwIGluc3RhbmNlXHJcbmFwcC5zaGVsbC5hY2Nlc3NDb250cm9sID0gcmVxdWlyZSgnLi91dGlscy9hY2Nlc3NDb250cm9sJykoYXBwKTtcclxuXHJcbi8vIFNob3J0Y3V0IHRvIFVzZXJUeXBlIGVudW1lcmF0aW9uIHVzZWQgdG8gc2V0IHBlcm1pc3Npb25zXHJcbmFwcC5Vc2VyVHlwZSA9IGFwcC5tb2RlbC51c2VyKCkuY29uc3RydWN0b3IuVXNlclR5cGU7XHJcblxyXG4vLyBVcGRhdGluZyBhcHAgc3RhdHVzIG9uIHVzZXIgY2hhbmdlc1xyXG5mdW5jdGlvbiB1cGRhdGVTdGF0ZXNPblVzZXJDaGFuZ2UoKSB7XHJcblxyXG4gICAgdmFyIHVzZXIgPSBhcHAubW9kZWwudXNlcigpO1xyXG5cclxuICAgIGlmICh1c2VyLm9uYm9hcmRpbmdTdGVwKCkpIHtcclxuICAgICAgICBhcHAuc3RhdHVzKCdvbmJvYXJkaW5nJyk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh1c2VyLmlzQW5vbnltb3VzKCkpIHtcclxuICAgICAgICBhcHAuc3RhdHVzKCdvdXQnKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGFwcC5zdGF0dXMoJ2luJyk7XHJcbiAgICB9XHJcbn1cclxuYXBwLm1vZGVsLnVzZXIoKS5pc0Fub255bW91cy5zdWJzY3JpYmUodXBkYXRlU3RhdGVzT25Vc2VyQ2hhbmdlKTtcclxuYXBwLm1vZGVsLnVzZXIoKS5vbmJvYXJkaW5nU3RlcC5zdWJzY3JpYmUodXBkYXRlU3RhdGVzT25Vc2VyQ2hhbmdlKTtcclxuXHJcblxyXG4vKiogQXBwIEluaXQgKiovXHJcbnZhciBhcHBJbml0ID0gZnVuY3Rpb24gYXBwSW5pdCgpIHtcclxuICAgIFxyXG4gICAgLy8gRW5hYmxpbmcgdGhlICdsYXlvdXRVcGRhdGUnIGpRdWVyeSBXaW5kb3cgZXZlbnQgdGhhdCBoYXBwZW5zIG9uIHJlc2l6ZSBhbmQgdHJhbnNpdGlvbmVuZCxcclxuICAgIC8vIGFuZCBjYW4gYmUgdHJpZ2dlcmVkIG1hbnVhbGx5IGJ5IGFueSBzY3JpcHQgdG8gbm90aWZ5IGNoYW5nZXMgb24gbGF5b3V0IHRoYXRcclxuICAgIC8vIG1heSByZXF1aXJlIGFkanVzdG1lbnRzIG9uIG90aGVyIHNjcmlwdHMgdGhhdCBsaXN0ZW4gdG8gaXQuXHJcbiAgICAvLyBUaGUgZXZlbnQgaXMgdGhyb3R0bGUsIGd1YXJhbnRpbmcgdGhhdCB0aGUgbWlub3IgaGFuZGxlcnMgYXJlIGV4ZWN1dGVkIHJhdGhlclxyXG4gICAgLy8gdGhhbiBhIGxvdCBvZiB0aGVtIGluIHNob3J0IHRpbWUgZnJhbWVzIChhcyBoYXBwZW4gd2l0aCAncmVzaXplJyBldmVudHMpLlxyXG4gICAgbGF5b3V0VXBkYXRlRXZlbnQub24oKTtcclxuICAgIFxyXG4gICAgLy8gTk9URTogU2FmYXJpIGlPUyBidWcgd29ya2Fyb3VuZCwgbWluLWhlaWdodC9oZWlnaHQgb24gaHRtbCBkb2Vzbid0IHdvcmsgYXMgZXhwZWN0ZWQsXHJcbiAgICAvLyBnZXR0aW5nIGJpZ2dlciB0aGFuIHZpZXdwb3J0LiBNYXkgYmUgYSBwcm9ibGVtIG9ubHkgb24gU2FmYXJpIGFuZCBub3QgaW4gXHJcbiAgICAvLyB0aGUgV2ViVmlldywgZG91YmxlIGNoZWNrLlxyXG4gICAgdmFyIGlPUyA9IC8oaVBhZHxpUGhvbmV8aVBvZCkvZy50ZXN0KCBuYXZpZ2F0b3IudXNlckFnZW50ICk7XHJcbiAgICBpZiAoaU9TKSB7XHJcbiAgICAgICAgJCgnaHRtbCcpLmhlaWdodCh3aW5kb3cuaW5uZXJIZWlnaHQgKyAncHgnKTtcclxuICAgICAgICAkKHdpbmRvdykub24oJ2xheW91dFVwZGF0ZScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAkKCdodG1sJykuaGVpZ2h0KHdpbmRvdy5pbm5lckhlaWdodCArICdweCcpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBMb2FkIEtub2Nrb3V0IGJpbmRpbmcgaGVscGVyc1xyXG4gICAgYm9vdGtub2NrLnBsdWdJbihrbyk7XHJcbiAgICBcclxuICAgIC8vIFBsdWdpbnMgc2V0dXBcclxuICAgIGlmICh3aW5kb3cgJiYgd2luZG93LnBsdWdpbnMgJiYgd2luZG93LnBsdWdpbnMuS2V5Ym9hcmQpIHtcclxuICAgICAgICB3aW5kb3cucGx1Z2lucy5LZXlib2FyZC5kaXNhYmxlU2Nyb2xsKHRydWUpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBFYXN5IGxpbmtzIHRvIHNoZWxsIGFjdGlvbnMsIGxpa2UgZ29CYWNrLCBpbiBodG1sIGVsZW1lbnRzXHJcbiAgICAvLyBFeGFtcGxlOiA8YnV0dG9uIGRhdGEtc2hlbGw9XCJnb0JhY2sgMlwiPkdvIDIgdGltZXMgYmFjazwvYnV0dG9uPlxyXG4gICAgJChkb2N1bWVudCkub24oJ3RhcCcsICdbZGF0YS1zaGVsbF0nLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdmFyIGNtZGxpbmUgPSAkKHRoaXMpLmRhdGEoJ3NoZWxsJykgfHwgJycsXHJcbiAgICAgICAgICAgIGFyZ3MgPSBjbWRsaW5lLnNwbGl0KCcgJyksXHJcbiAgICAgICAgICAgIGNtZCA9IGFyZ3NbMF07XHJcblxyXG4gICAgICAgIGlmIChjbWQgJiYgdHlwZW9mKGFwcC5zaGVsbFtjbWRdKSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICBhcHAuc2hlbGxbY21kXS5hcHBseShjbWQsIGFyZ3Muc2xpY2UoMSkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICAvLyBXaGVuIGFuIGFjdGl2aXR5IGlzIHJlYWR5IGluIHRoZSBTaGVsbDpcclxuICAgIGFwcC5zaGVsbC5vbihhcHAuc2hlbGwuZXZlbnRzLml0ZW1SZWFkeSwgZnVuY3Rpb24oJGFjdCwgc3RhdGUpIHtcclxuICAgICAgICBcclxuICAgICAgICAvLyBDb25uZWN0IHRoZSAnYWN0aXZpdGllcycgY29udHJvbGxlcnMgdG8gdGhlaXIgdmlld3NcclxuICAgICAgICAvLyBHZXQgaW5pdGlhbGl6ZWQgYWN0aXZpdHkgZm9yIHRoZSBET00gZWxlbWVudFxyXG4gICAgICAgIHZhciBhY3ROYW1lID0gJGFjdC5kYXRhKCdhY3Rpdml0eScpO1xyXG4gICAgICAgIHZhciBhY3Rpdml0eSA9IGFwcC5nZXRBY3Rpdml0eShhY3ROYW1lKTtcclxuICAgICAgICAvLyBUcmlnZ2VyIHRoZSAnc2hvdycgbG9naWMgb2YgdGhlIGFjdGl2aXR5IGNvbnRyb2xsZXI6XHJcbiAgICAgICAgYWN0aXZpdHkuc2hvdyhzdGF0ZSk7XHJcblxyXG4gICAgICAgIC8vIFVwZGF0ZSBtZW51XHJcbiAgICAgICAgYXBwLnVwZGF0ZU1lbnUoYWN0TmFtZSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVXBkYXRlIGFwcCBuYXZpZ2F0aW9uXHJcbiAgICAgICAgYXBwLnVwZGF0ZUFwcE5hdihhY3Rpdml0eSk7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gU2V0IG1vZGVsIGZvciB0aGUgQXBwTmF2XHJcbiAgICBrby5hcHBseUJpbmRpbmdzKHtcclxuICAgICAgICBuYXZBY3Rpb246IGFwcC5uYXZBY3Rpb24sXHJcbiAgICAgICAgc3RhdHVzOiBhcHAuc3RhdHVzXHJcbiAgICB9LCAkKCcuQXBwTmF2JykuZ2V0KDApKTtcclxuXHJcbiAgICAvLyBBcHAgaW5pdDpcclxuICAgIGFwcC5tb2RlbC5pbml0KCkudGhlbihcclxuICAgICAgICBhcHAuc2hlbGwucnVuLmJpbmQoYXBwLnNoZWxsKVxyXG4gICAgKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIE1hcmsgdGhlIHBhZ2UgYXMgcmVhZHlcclxuICAgICAgICAkKCdodG1sJykuYWRkQ2xhc3MoJ2lzLXJlYWR5Jyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBERUJVR1xyXG4gICAgd2luZG93LmFwcCA9IGFwcDtcclxufTtcclxuXHJcbi8vIEFwcCBpbml0IG9uIHBhZ2UgcmVhZHkgYW5kIHBob25lZ2FwIHJlYWR5XHJcbmlmICh3aW5kb3cuY29yZG92YSkge1xyXG4gICAgLy8gT24gRE9NLVJlYWR5IGZpcnN0XHJcbiAgICAkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIFBhZ2UgaXMgcmVhZHksIGRldmljZSBpcyB0b28/XHJcbiAgICAgICAgLy8gTm90ZTogQ29yZG92YSBlbnN1cmVzIHRvIGNhbGwgdGhlIGhhbmRsZXIgZXZlbiBpZiB0aGVcclxuICAgICAgICAvLyBldmVudCB3YXMgYWxyZWFkeSBmaXJlZCwgc28gaXMgZ29vZCB0byBkbyBpdCBpbnNpZGVcclxuICAgICAgICAvLyB0aGUgZG9tLXJlYWR5IGFuZCB3ZSBhcmUgZW5zdXJpbmcgdGhhdCBldmVyeXRoaW5nIGlzXHJcbiAgICAgICAgLy8gcmVhZHkuXHJcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2RldmljZXJlYWR5JywgYXBwSW5pdCk7XHJcbiAgICB9KTtcclxufSBlbHNlIHtcclxuICAgIC8vIE9ubHkgb24gRE9NLVJlYWR5LCBmb3IgaW4gYnJvd3NlciBkZXZlbG9wbWVudFxyXG4gICAgJChhcHBJbml0KTtcclxufSIsIi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gKiBEYXRlUGlja2VyIEpTIENvbXBvbmVudCwgd2l0aCBzZXZlcmFsXHJcbiAqIG1vZGVzIGFuZCBvcHRpb25hbCBpbmxpbmUtcGVybWFuZW50IHZpc3VhbGl6YXRpb24uXHJcbiAqXHJcbiAqIENvcHlyaWdodCAyMDE0IExvY29ub21pY3MgQ29vcC5cclxuICpcclxuICogQmFzZWQgb246XHJcbiAqIGJvb3RzdHJhcC1kYXRlcGlja2VyLmpzIFxyXG4gKiBodHRwOi8vd3d3LmV5ZWNvbi5yby9ib290c3RyYXAtZGF0ZXBpY2tlclxyXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICogQ29weXJpZ2h0IDIwMTIgU3RlZmFuIFBldHJlXHJcbiAqXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XHJcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cclxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XHJcbiAqXHJcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxyXG4gKlxyXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXHJcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcclxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXHJcbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcclxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXHJcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xyXG5cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTsgXHJcblxyXG52YXIgY2xhc3NlcyA9IHtcclxuICAgIGNvbXBvbmVudDogJ0RhdGVQaWNrZXInLFxyXG4gICAgbW9udGhzOiAnRGF0ZVBpY2tlci1tb250aHMnLFxyXG4gICAgZGF5czogJ0RhdGVQaWNrZXItZGF5cycsXHJcbiAgICBtb250aERheTogJ2RheScsXHJcbiAgICBtb250aDogJ21vbnRoJyxcclxuICAgIHllYXI6ICd5ZWFyJyxcclxuICAgIHllYXJzOiAnRGF0ZVBpY2tlci15ZWFycydcclxufTtcclxuXHJcbi8vIFBpY2tlciBvYmplY3RcclxudmFyIERhdGVQaWNrZXIgPSBmdW5jdGlvbihlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAvKmpzaGludCBtYXhzdGF0ZW1lbnRzOjMyLG1heGNvbXBsZXhpdHk6MjQqL1xyXG4gICAgdGhpcy5lbGVtZW50ID0gJChlbGVtZW50KTtcclxuICAgIHRoaXMuZm9ybWF0ID0gRFBHbG9iYWwucGFyc2VGb3JtYXQob3B0aW9ucy5mb3JtYXR8fHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLWZvcm1hdCcpfHwnbW0vZGQveXl5eScpO1xyXG4gICAgXHJcbiAgICB0aGlzLmlzSW5wdXQgPSB0aGlzLmVsZW1lbnQuaXMoJ2lucHV0Jyk7XHJcbiAgICB0aGlzLmNvbXBvbmVudCA9IHRoaXMuZWxlbWVudC5pcygnLmRhdGUnKSA/IHRoaXMuZWxlbWVudC5maW5kKCcuYWRkLW9uJykgOiBmYWxzZTtcclxuICAgIHRoaXMuaXNQbGFjZWhvbGRlciA9IHRoaXMuZWxlbWVudC5pcygnLmNhbGVuZGFyLXBsYWNlaG9sZGVyJyk7XHJcbiAgICBcclxuICAgIHRoaXMucGlja2VyID0gJChEUEdsb2JhbC50ZW1wbGF0ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZFRvKHRoaXMuaXNQbGFjZWhvbGRlciA/IHRoaXMuZWxlbWVudCA6ICdib2R5JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLm9uKCdjbGljayB0YXAnLCAkLnByb3h5KHRoaXMuY2xpY2ssIHRoaXMpKTtcclxuICAgIC8vIFRPRE86IHRvIHJldmlldyBpZiAnY29udGFpbmVyJyBjbGFzcyBjYW4gYmUgYXZvaWRlZCwgc28gaW4gcGxhY2Vob2xkZXIgbW9kZSBnZXRzIG9wdGlvbmFsXHJcbiAgICAvLyBpZiBpcyB3YW50ZWQgY2FuIGJlIHBsYWNlZCBvbiB0aGUgcGxhY2Vob2xkZXIgZWxlbWVudCAob3IgY29udGFpbmVyLWZsdWlkIG9yIG5vdGhpbmcpXHJcbiAgICB0aGlzLnBpY2tlci5hZGRDbGFzcyh0aGlzLmlzUGxhY2Vob2xkZXIgPyAnY29udGFpbmVyJyA6ICdkcm9wZG93bi1tZW51Jyk7XHJcbiAgICBcclxuICAgIGlmICh0aGlzLmlzUGxhY2Vob2xkZXIpIHtcclxuICAgICAgICB0aGlzLnBpY2tlci5zaG93KCk7XHJcbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlJykgPT0gJ3RvZGF5Jykge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdzaG93JyxcclxuICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0aGlzLmlzSW5wdXQpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnQub24oe1xyXG4gICAgICAgICAgICBmb2N1czogJC5wcm94eSh0aGlzLnNob3csIHRoaXMpLFxyXG4gICAgICAgICAgICAvL2JsdXI6ICQucHJveHkodGhpcy5oaWRlLCB0aGlzKSxcclxuICAgICAgICAgICAga2V5dXA6ICQucHJveHkodGhpcy51cGRhdGUsIHRoaXMpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmICh0aGlzLmNvbXBvbmVudCl7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcG9uZW50Lm9uKCdjbGljayB0YXAnLCAkLnByb3h5KHRoaXMuc2hvdywgdGhpcykpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5vbignY2xpY2sgdGFwJywgJC5wcm94eSh0aGlzLnNob3csIHRoaXMpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qIFRvdWNoIGV2ZW50cyB0byBzd2lwZSBkYXRlcyAqL1xyXG4gICAgdGhpcy5lbGVtZW50XHJcbiAgICAub24oJ3N3aXBlbGVmdCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdGhpcy5tb3ZlRGF0ZSgnbmV4dCcpO1xyXG4gICAgfS5iaW5kKHRoaXMpKVxyXG4gICAgLm9uKCdzd2lwZXJpZ2h0JywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB0aGlzLm1vdmVEYXRlKCdwcmV2Jyk7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgIC8qIFNldC11cCB2aWV3IG1vZGUgKi9cclxuICAgIHRoaXMubWluVmlld01vZGUgPSBvcHRpb25zLm1pblZpZXdNb2RlfHx0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS1taW52aWV3bW9kZScpfHwwO1xyXG4gICAgaWYgKHR5cGVvZiB0aGlzLm1pblZpZXdNb2RlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgIHN3aXRjaCAodGhpcy5taW5WaWV3TW9kZSkge1xyXG4gICAgICAgICAgICBjYXNlICdtb250aHMnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5WaWV3TW9kZSA9IDE7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAneWVhcnMnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5WaWV3TW9kZSA9IDI7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHRoaXMubWluVmlld01vZGUgPSAwO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy52aWV3TW9kZSA9IG9wdGlvbnMudmlld01vZGV8fHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLXZpZXdtb2RlJyl8fDA7XHJcbiAgICBpZiAodHlwZW9mIHRoaXMudmlld01vZGUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgc3dpdGNoICh0aGlzLnZpZXdNb2RlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ21vbnRocyc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlID0gMTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICd5ZWFycyc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlID0gMjtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZSA9IDA7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnN0YXJ0Vmlld01vZGUgPSB0aGlzLnZpZXdNb2RlO1xyXG4gICAgdGhpcy53ZWVrU3RhcnQgPSBvcHRpb25zLndlZWtTdGFydHx8dGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtd2Vla3N0YXJ0Jyl8fDA7XHJcbiAgICB0aGlzLndlZWtFbmQgPSB0aGlzLndlZWtTdGFydCA9PT0gMCA/IDYgOiB0aGlzLndlZWtTdGFydCAtIDE7XHJcbiAgICB0aGlzLm9uUmVuZGVyID0gb3B0aW9ucy5vblJlbmRlcjtcclxuICAgIHRoaXMuZmlsbERvdygpO1xyXG4gICAgdGhpcy5maWxsTW9udGhzKCk7XHJcbiAgICB0aGlzLnVwZGF0ZSgpO1xyXG4gICAgdGhpcy5zaG93TW9kZSgpO1xyXG59O1xyXG5cclxuRGF0ZVBpY2tlci5wcm90b3R5cGUgPSB7XHJcbiAgICBjb25zdHJ1Y3RvcjogRGF0ZVBpY2tlcixcclxuICAgIFxyXG4gICAgc2hvdzogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHRoaXMucGlja2VyLnNob3coKTtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMuY29tcG9uZW50ID8gdGhpcy5jb21wb25lbnQub3V0ZXJIZWlnaHQoKSA6IHRoaXMuZWxlbWVudC5vdXRlckhlaWdodCgpO1xyXG4gICAgICAgIHRoaXMucGxhY2UoKTtcclxuICAgICAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsICQucHJveHkodGhpcy5wbGFjZSwgdGhpcykpO1xyXG4gICAgICAgIGlmIChlICkge1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpcy5pc0lucHV0KSB7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICAkKGRvY3VtZW50KS5vbignbW91c2Vkb3duJywgZnVuY3Rpb24oZXYpe1xyXG4gICAgICAgICAgICBpZiAoJChldi50YXJnZXQpLmNsb3Nlc3QoJy4nICsgY2xhc3Nlcy5jb21wb25lbnQpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5oaWRlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdzaG93JyxcclxuICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBoaWRlOiBmdW5jdGlvbigpe1xyXG4gICAgICAgIHRoaXMucGlja2VyLmhpZGUoKTtcclxuICAgICAgICAkKHdpbmRvdykub2ZmKCdyZXNpemUnLCB0aGlzLnBsYWNlKTtcclxuICAgICAgICB0aGlzLnZpZXdNb2RlID0gdGhpcy5zdGFydFZpZXdNb2RlO1xyXG4gICAgICAgIHRoaXMuc2hvd01vZGUoKTtcclxuICAgICAgICBpZiAoIXRoaXMuaXNJbnB1dCkge1xyXG4gICAgICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ21vdXNlZG93bicsIHRoaXMuaGlkZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vdGhpcy5zZXQoKTtcclxuICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdoaWRlJyxcclxuICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBmb3JtYXRlZCA9IERQR2xvYmFsLmZvcm1hdERhdGUodGhpcy5kYXRlLCB0aGlzLmZvcm1hdCk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzSW5wdXQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY29tcG9uZW50KXtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5maW5kKCdpbnB1dCcpLnByb3AoJ3ZhbHVlJywgZm9ybWF0ZWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlJywgZm9ybWF0ZWQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wcm9wKCd2YWx1ZScsIGZvcm1hdGVkKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBTZXRzIGEgZGF0ZSBhcyB2YWx1ZSBhbmQgbm90aWZ5IHdpdGggYW4gZXZlbnQuXHJcbiAgICAgICAgUGFyYW1ldGVyIGRvbnROb3RpZnkgaXMgb25seSBmb3IgY2FzZXMgd2hlcmUgdGhlIGNhbGVuZGFyIG9yXHJcbiAgICAgICAgc29tZSByZWxhdGVkIGNvbXBvbmVudCBnZXRzIGFscmVhZHkgdXBkYXRlZCBidXQgdGhlIGhpZ2hsaWdodGVkXHJcbiAgICAgICAgZGF0ZSBuZWVkcyB0byBiZSB1cGRhdGVkIHdpdGhvdXQgY3JlYXRlIGluZmluaXRlIHJlY3Vyc2lvbiBcclxuICAgICAgICBiZWNhdXNlIG9mIG5vdGlmaWNhdGlvbi4gSW4gb3RoZXIgY2FzZSwgZG9udCB1c2UuXHJcbiAgICAqKi9cclxuICAgIHNldFZhbHVlOiBmdW5jdGlvbihuZXdEYXRlLCBkb250Tm90aWZ5KSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBuZXdEYXRlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGUgPSBEUEdsb2JhbC5wYXJzZURhdGUobmV3RGF0ZSwgdGhpcy5mb3JtYXQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSA9IG5ldyBEYXRlKG5ld0RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgICAgIHRoaXMudmlld0RhdGUgPSBuZXcgRGF0ZSh0aGlzLmRhdGUuZ2V0RnVsbFllYXIoKSwgdGhpcy5kYXRlLmdldE1vbnRoKCksIDEsIDAsIDAsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChkb250Tm90aWZ5ICE9PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIC8vIE5vdGlmeTpcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICAgICAgdmlld01vZGU6IERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZ2V0VmFsdWU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGU7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBtb3ZlVmFsdWU6IGZ1bmN0aW9uKGRpciwgbW9kZSkge1xyXG4gICAgICAgIC8vIGRpciBjYW4gYmU6ICdwcmV2JywgJ25leHQnXHJcbiAgICAgICAgaWYgKFsncHJldicsICduZXh0J10uaW5kZXhPZihkaXIgJiYgZGlyLnRvTG93ZXJDYXNlKCkpID09IC0xKVxyXG4gICAgICAgICAgICAvLyBObyB2YWxpZCBvcHRpb246XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gZGVmYXVsdCBtb2RlIGlzIHRoZSBjdXJyZW50IG9uZVxyXG4gICAgICAgIG1vZGUgPSBtb2RlID9cclxuICAgICAgICAgICAgRFBHbG9iYWwubW9kZXNTZXRbbW9kZV0gOlxyXG4gICAgICAgICAgICBEUEdsb2JhbC5tb2Rlc1t0aGlzLnZpZXdNb2RlXTtcclxuXHJcbiAgICAgICAgdGhpcy5kYXRlWydzZXQnICsgbW9kZS5uYXZGbmNdLmNhbGwoXHJcbiAgICAgICAgICAgIHRoaXMuZGF0ZSxcclxuICAgICAgICAgICAgdGhpcy5kYXRlWydnZXQnICsgbW9kZS5uYXZGbmNdLmNhbGwodGhpcy5kYXRlKSArIFxyXG4gICAgICAgICAgICBtb2RlLm5hdlN0ZXAgKiAoZGlyID09PSAncHJldicgPyAtMSA6IDEpXHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLnNldFZhbHVlKHRoaXMuZGF0ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0ZTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIHBsYWNlOiBmdW5jdGlvbigpe1xyXG4gICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLmNvbXBvbmVudCA/IHRoaXMuY29tcG9uZW50Lm9mZnNldCgpIDogdGhpcy5lbGVtZW50Lm9mZnNldCgpO1xyXG4gICAgICAgIHRoaXMucGlja2VyLmNzcyh7XHJcbiAgICAgICAgICAgIHRvcDogb2Zmc2V0LnRvcCArIHRoaXMuaGVpZ2h0LFxyXG4gICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbihuZXdEYXRlKXtcclxuICAgICAgICB0aGlzLmRhdGUgPSBEUEdsb2JhbC5wYXJzZURhdGUoXHJcbiAgICAgICAgICAgIHR5cGVvZiBuZXdEYXRlID09PSAnc3RyaW5nJyA/IG5ld0RhdGUgOiAodGhpcy5pc0lucHV0ID8gdGhpcy5lbGVtZW50LnByb3AoJ3ZhbHVlJykgOiB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZScpKSxcclxuICAgICAgICAgICAgdGhpcy5mb3JtYXRcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMudmlld0RhdGUgPSBuZXcgRGF0ZSh0aGlzLmRhdGUuZ2V0RnVsbFllYXIoKSwgdGhpcy5kYXRlLmdldE1vbnRoKCksIDEsIDAsIDAsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZmlsbERvdzogZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgZG93Q250ID0gdGhpcy53ZWVrU3RhcnQ7XHJcbiAgICAgICAgdmFyIGh0bWwgPSAnPHRyPic7XHJcbiAgICAgICAgd2hpbGUgKGRvd0NudCA8IHRoaXMud2Vla1N0YXJ0ICsgNykge1xyXG4gICAgICAgICAgICBodG1sICs9ICc8dGggY2xhc3M9XCJkb3dcIj4nK0RQR2xvYmFsLmRhdGVzLmRheXNNaW5bKGRvd0NudCsrKSU3XSsnPC90aD4nO1xyXG4gICAgICAgIH1cclxuICAgICAgICBodG1sICs9ICc8L3RyPic7XHJcbiAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLmRheXMgKyAnIHRoZWFkJykuYXBwZW5kKGh0bWwpO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZmlsbE1vbnRoczogZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgaHRtbCA9ICcnO1xyXG4gICAgICAgIHZhciBpID0gMDtcclxuICAgICAgICB3aGlsZSAoaSA8IDEyKSB7XHJcbiAgICAgICAgICAgIGh0bWwgKz0gJzxzcGFuIGNsYXNzPVwiJyArIGNsYXNzZXMubW9udGggKyAnXCI+JytEUEdsb2JhbC5kYXRlcy5tb250aHNTaG9ydFtpKytdKyc8L3NwYW4+JztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLm1vbnRocyArICcgdGQnKS5hcHBlbmQoaHRtbCk7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBmaWxsOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAvKmpzaGludCBtYXhzdGF0ZW1lbnRzOjY2LCBtYXhjb21wbGV4aXR5OjI4Ki9cclxuICAgICAgICB2YXIgZCA9IG5ldyBEYXRlKHRoaXMudmlld0RhdGUpLFxyXG4gICAgICAgICAgICB5ZWFyID0gZC5nZXRGdWxsWWVhcigpLFxyXG4gICAgICAgICAgICBtb250aCA9IGQuZ2V0TW9udGgoKSxcclxuICAgICAgICAgICAgY3VycmVudERhdGUgPSB0aGlzLmRhdGUudmFsdWVPZigpO1xyXG4gICAgICAgIHRoaXMucGlja2VyXHJcbiAgICAgICAgLmZpbmQoJy4nICsgY2xhc3Nlcy5kYXlzICsgJyB0aDplcSgxKScpXHJcbiAgICAgICAgLmh0bWwoRFBHbG9iYWwuZGF0ZXMubW9udGhzW21vbnRoXSArICcgJyArIHllYXIpO1xyXG4gICAgICAgIHZhciBwcmV2TW9udGggPSBuZXcgRGF0ZSh5ZWFyLCBtb250aC0xLCAyOCwwLDAsMCwwKSxcclxuICAgICAgICAgICAgZGF5ID0gRFBHbG9iYWwuZ2V0RGF5c0luTW9udGgocHJldk1vbnRoLmdldEZ1bGxZZWFyKCksIHByZXZNb250aC5nZXRNb250aCgpKTtcclxuICAgICAgICBwcmV2TW9udGguc2V0RGF0ZShkYXkpO1xyXG4gICAgICAgIHByZXZNb250aC5zZXREYXRlKGRheSAtIChwcmV2TW9udGguZ2V0RGF5KCkgLSB0aGlzLndlZWtTdGFydCArIDcpJTcpO1xyXG4gICAgICAgIHZhciBuZXh0TW9udGggPSBuZXcgRGF0ZShwcmV2TW9udGgpO1xyXG4gICAgICAgIG5leHRNb250aC5zZXREYXRlKG5leHRNb250aC5nZXREYXRlKCkgKyA0Mik7XHJcbiAgICAgICAgbmV4dE1vbnRoID0gbmV4dE1vbnRoLnZhbHVlT2YoKTtcclxuICAgICAgICB2YXIgaHRtbCA9IFtdO1xyXG4gICAgICAgIHZhciBjbHNOYW1lLFxyXG4gICAgICAgICAgICBwcmV2WSxcclxuICAgICAgICAgICAgcHJldk07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIGlmICh0aGlzLl9kYXlzQ3JlYXRlZCAhPT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAvLyBDcmVhdGUgaHRtbCAoZmlyc3QgdGltZSBvbmx5KVxyXG4gICAgICAgXHJcbiAgICAgICAgICAgIHdoaWxlKHByZXZNb250aC52YWx1ZU9mKCkgPCBuZXh0TW9udGgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGguZ2V0RGF5KCkgPT09IHRoaXMud2Vla1N0YXJ0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8dHI+Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjbHNOYW1lID0gdGhpcy5vblJlbmRlcihwcmV2TW9udGgpO1xyXG4gICAgICAgICAgICAgICAgcHJldlkgPSBwcmV2TW9udGguZ2V0RnVsbFllYXIoKTtcclxuICAgICAgICAgICAgICAgIHByZXZNID0gcHJldk1vbnRoLmdldE1vbnRoKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoKHByZXZNIDwgbW9udGggJiYgIHByZXZZID09PSB5ZWFyKSB8fCAgcHJldlkgPCB5ZWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIG9sZCc7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKChwcmV2TSA+IG1vbnRoICYmIHByZXZZID09PSB5ZWFyKSB8fCBwcmV2WSA+IHllYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgbmV3JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGgudmFsdWVPZigpID09PSBjdXJyZW50RGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBhY3RpdmUnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8dGQgY2xhc3M9XCInICsgY2xhc3Nlcy5tb250aERheSArICcgJyArIGNsc05hbWUrJ1wiPicrcHJldk1vbnRoLmdldERhdGUoKSArICc8L3RkPicpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHByZXZNb250aC5nZXREYXkoKSA9PT0gdGhpcy53ZWVrRW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8L3RyPicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcHJldk1vbnRoLnNldERhdGUocHJldk1vbnRoLmdldERhdGUoKSsxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLicgKyBjbGFzc2VzLmRheXMgKyAnIHRib2R5JykuZW1wdHkoKS5hcHBlbmQoaHRtbC5qb2luKCcnKSk7XHJcbiAgICAgICAgICAgIHRoaXMuX2RheXNDcmVhdGVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFVwZGF0ZSBkYXlzIHZhbHVlc1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHdlZWtUciA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy5kYXlzICsgJyB0Ym9keSB0cjpmaXJzdC1jaGlsZCgpJyk7XHJcbiAgICAgICAgICAgIHZhciBkYXlUZCA9IG51bGw7XHJcbiAgICAgICAgICAgIHdoaWxlKHByZXZNb250aC52YWx1ZU9mKCkgPCBuZXh0TW9udGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50V2Vla0RheUluZGV4ID0gcHJldk1vbnRoLmdldERheSgpIC0gdGhpcy53ZWVrU3RhcnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgY2xzTmFtZSA9IHRoaXMub25SZW5kZXIocHJldk1vbnRoKTtcclxuICAgICAgICAgICAgICAgIHByZXZZID0gcHJldk1vbnRoLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgICAgICAgICBwcmV2TSA9IHByZXZNb250aC5nZXRNb250aCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKChwcmV2TSA8IG1vbnRoICYmICBwcmV2WSA9PT0geWVhcikgfHwgIHByZXZZIDwgeWVhcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBvbGQnO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgocHJldk0gPiBtb250aCAmJiBwcmV2WSA9PT0geWVhcikgfHwgcHJldlkgPiB5ZWFyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIG5ldyc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAocHJldk1vbnRoLnZhbHVlT2YoKSA9PT0gY3VycmVudERhdGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgYWN0aXZlJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vaHRtbC5wdXNoKCc8dGQgY2xhc3M9XCJkYXkgJytjbHNOYW1lKydcIj4nK3ByZXZNb250aC5nZXREYXRlKCkgKyAnPC90ZD4nKTtcclxuICAgICAgICAgICAgICAgIGRheVRkID0gd2Vla1RyLmZpbmQoJ3RkOmVxKCcgKyBjdXJyZW50V2Vla0RheUluZGV4ICsgJyknKTtcclxuICAgICAgICAgICAgICAgIGRheVRkXHJcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnZGF5ICcgKyBjbHNOYW1lKVxyXG4gICAgICAgICAgICAgICAgLnRleHQocHJldk1vbnRoLmdldERhdGUoKSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIE5leHQgd2Vlaz9cclxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGguZ2V0RGF5KCkgPT09IHRoaXMud2Vla0VuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdlZWtUciA9IHdlZWtUci5uZXh0KCd0cicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcHJldk1vbnRoLnNldERhdGUocHJldk1vbnRoLmdldERhdGUoKSsxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGN1cnJlbnRZZWFyID0gdGhpcy5kYXRlLmdldEZ1bGxZZWFyKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIG1vbnRocyA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy5tb250aHMpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ3RoOmVxKDEpJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmh0bWwoeWVhcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmVuZCgpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbmQoJ3NwYW4nKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgaWYgKGN1cnJlbnRZZWFyID09PSB5ZWFyKSB7XHJcbiAgICAgICAgICAgIG1vbnRocy5lcSh0aGlzLmRhdGUuZ2V0TW9udGgoKSkuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBodG1sID0gJyc7XHJcbiAgICAgICAgeWVhciA9IHBhcnNlSW50KHllYXIvMTAsIDEwKSAqIDEwO1xyXG4gICAgICAgIHZhciB5ZWFyQ29udCA9IHRoaXMucGlja2VyLmZpbmQoJy4nICsgY2xhc3Nlcy55ZWFycylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKCd0aDplcSgxKScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRleHQoeWVhciArICctJyArICh5ZWFyICsgOSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmVuZCgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgndGQnKTtcclxuICAgICAgICBcclxuICAgICAgICB5ZWFyIC09IDE7XHJcbiAgICAgICAgdmFyIGk7XHJcbiAgICAgICAgaWYgKHRoaXMuX3llYXJzQ3JlYXRlZCAhPT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgZm9yIChpID0gLTE7IGkgPCAxMTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8c3BhbiBjbGFzcz1cIicgKyBjbGFzc2VzLnllYXIgKyAoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykrKGN1cnJlbnRZZWFyID09PSB5ZWFyID8gJyBhY3RpdmUnIDogJycpKydcIj4nK3llYXIrJzwvc3Bhbj4nO1xyXG4gICAgICAgICAgICAgICAgeWVhciArPSAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB5ZWFyQ29udC5odG1sKGh0bWwpO1xyXG4gICAgICAgICAgICB0aGlzLl95ZWFyc0NyZWF0ZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciB5ZWFyU3BhbiA9IHllYXJDb250LmZpbmQoJ3NwYW46Zmlyc3QtY2hpbGQoKScpO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAtMTsgaSA8IDExOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIC8vaHRtbCArPSAnPHNwYW4gY2xhc3M9XCJ5ZWFyJysoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykrKGN1cnJlbnRZZWFyID09PSB5ZWFyID8gJyBhY3RpdmUnIDogJycpKydcIj4nK3llYXIrJzwvc3Bhbj4nO1xyXG4gICAgICAgICAgICAgICAgeWVhclNwYW5cclxuICAgICAgICAgICAgICAgIC50ZXh0KHllYXIpXHJcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAneWVhcicgKyAoaSA9PT0gLTEgfHwgaSA9PT0gMTAgPyAnIG9sZCcgOiAnJykgKyAoY3VycmVudFllYXIgPT09IHllYXIgPyAnIGFjdGl2ZScgOiAnJykpO1xyXG4gICAgICAgICAgICAgICAgeWVhciArPSAxO1xyXG4gICAgICAgICAgICAgICAgeWVhclNwYW4gPSB5ZWFyU3Bhbi5uZXh0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBtb3ZlRGF0ZTogZnVuY3Rpb24oZGlyLCBtb2RlKSB7XHJcbiAgICAgICAgLy8gZGlyIGNhbiBiZTogJ3ByZXYnLCAnbmV4dCdcclxuICAgICAgICBpZiAoWydwcmV2JywgJ25leHQnXS5pbmRleE9mKGRpciAmJiBkaXIudG9Mb3dlckNhc2UoKSkgPT0gLTEpXHJcbiAgICAgICAgICAgIC8vIE5vIHZhbGlkIG9wdGlvbjpcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAvLyBkZWZhdWx0IG1vZGUgaXMgdGhlIGN1cnJlbnQgb25lXHJcbiAgICAgICAgbW9kZSA9IG1vZGUgfHwgdGhpcy52aWV3TW9kZTtcclxuXHJcbiAgICAgICAgdGhpcy52aWV3RGF0ZVsnc2V0JytEUEdsb2JhbC5tb2Rlc1ttb2RlXS5uYXZGbmNdLmNhbGwoXHJcbiAgICAgICAgICAgIHRoaXMudmlld0RhdGUsXHJcbiAgICAgICAgICAgIHRoaXMudmlld0RhdGVbJ2dldCcrRFBHbG9iYWwubW9kZXNbbW9kZV0ubmF2Rm5jXS5jYWxsKHRoaXMudmlld0RhdGUpICsgXHJcbiAgICAgICAgICAgIERQR2xvYmFsLm1vZGVzW21vZGVdLm5hdlN0ZXAgKiAoZGlyID09PSAncHJldicgPyAtMSA6IDEpXHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLmZpbGwoKTtcclxuICAgICAgICB0aGlzLnNldCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGljazogZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIC8qanNoaW50IG1heGNvbXBsZXhpdHk6MTYqL1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHZhciB0YXJnZXQgPSAkKGUudGFyZ2V0KS5jbG9zZXN0KCdzcGFuLCB0ZCwgdGgnKTtcclxuICAgICAgICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICB2YXIgbW9udGgsIHllYXI7XHJcbiAgICAgICAgICAgIHN3aXRjaCh0YXJnZXRbMF0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAndGgnOlxyXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCh0YXJnZXRbMF0uY2xhc3NOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N3aXRjaCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dNb2RlKDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3ByZXYnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICduZXh0JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZURhdGUodGFyZ2V0WzBdLmNsYXNzTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdzcGFuJzpcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmlzKCcuJyArIGNsYXNzZXMubW9udGgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vbnRoID0gdGFyZ2V0LnBhcmVudCgpLmZpbmQoJ3NwYW4nKS5pbmRleCh0YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlLnNldE1vbnRoKG1vbnRoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ZWFyID0gcGFyc2VJbnQodGFyZ2V0LnRleHQoKSwgMTApfHwwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlLnNldEZ1bGxZZWFyKHllYXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy52aWV3TW9kZSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSh0aGlzLnZpZXdEYXRlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld01vZGU6IERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd01vZGUoLTEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd0ZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldC5pcygnLmRheScpICYmICF0YXJnZXQuaXMoJy5kaXNhYmxlZCcpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRheSA9IHBhcnNlSW50KHRhcmdldC50ZXh0KCksIDEwKXx8MTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggPSB0aGlzLnZpZXdEYXRlLmdldE1vbnRoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuaXMoJy5vbGQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggLT0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YXJnZXQuaXMoJy5uZXcnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggKz0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ZWFyID0gdGhpcy52aWV3RGF0ZS5nZXRGdWxsWWVhcigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgZGF5LDAsMCwwLDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGgsIE1hdGgubWluKDI4LCBkYXkpLDAsMCwwLDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGwoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZURhdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld01vZGU6IERQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFxyXG4gICAgbW91c2Vkb3duOiBmdW5jdGlvbihlKXtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIHNob3dNb2RlOiBmdW5jdGlvbihkaXIpIHtcclxuICAgICAgICBpZiAoZGlyKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlld01vZGUgPSBNYXRoLm1heCh0aGlzLm1pblZpZXdNb2RlLCBNYXRoLm1pbigyLCB0aGlzLnZpZXdNb2RlICsgZGlyKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucGlja2VyLmZpbmQoJz5kaXYnKS5oaWRlKCkuZmlsdGVyKCcuJyArIGNsYXNzZXMuY29tcG9uZW50ICsgJy0nICsgRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZSkuc2hvdygpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuJC5mbi5kYXRlcGlja2VyID0gZnVuY3Rpb24gKCBvcHRpb24gKSB7XHJcbiAgICB2YXIgdmFscyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XHJcbiAgICB2YXIgcmV0dXJuZWQ7XHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXHJcbiAgICAgICAgICAgIGRhdGEgPSAkdGhpcy5kYXRhKCdkYXRlcGlja2VyJyksXHJcbiAgICAgICAgICAgIG9wdGlvbnMgPSB0eXBlb2Ygb3B0aW9uID09PSAnb2JqZWN0JyAmJiBvcHRpb247XHJcbiAgICAgICAgaWYgKCFkYXRhKSB7XHJcbiAgICAgICAgICAgICR0aGlzLmRhdGEoJ2RhdGVwaWNrZXInLCAoZGF0YSA9IG5ldyBEYXRlUGlja2VyKHRoaXMsICQuZXh0ZW5kKHt9LCAkLmZuLmRhdGVwaWNrZXIuZGVmYXVsdHMsb3B0aW9ucykpKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgcmV0dXJuZWQgPSBkYXRhW29wdGlvbl0uYXBwbHkoZGF0YSwgdmFscyk7XHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgdmFsdWUgcmV0dXJuZWQgYnkgdGhlIG1ldGhvZD9cclxuICAgICAgICAgICAgaWYgKHR5cGVvZihyZXR1cm5lZCAhPT0gJ3VuZGVmaW5lZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBHbyBvdXQgdGhlIGxvb3AgdG8gcmV0dXJuIHRoZSB2YWx1ZSBmcm9tIHRoZSBmaXJzdFxyXG4gICAgICAgICAgICAgICAgLy8gZWxlbWVudC1tZXRob2QgZXhlY3V0aW9uXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gRm9sbG93IG5leHQgbG9vcCBpdGVtXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBpZiAodHlwZW9mKHJldHVybmVkKSAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgcmV0dXJuIHJldHVybmVkO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIC8vIGNoYWluaW5nOlxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuJC5mbi5kYXRlcGlja2VyLmRlZmF1bHRzID0ge1xyXG4gICAgb25SZW5kZXI6IGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgICAgICByZXR1cm4gJyc7XHJcbiAgICB9XHJcbn07XHJcbiQuZm4uZGF0ZXBpY2tlci5Db25zdHJ1Y3RvciA9IERhdGVQaWNrZXI7XHJcblxyXG52YXIgRFBHbG9iYWwgPSB7XHJcbiAgICBtb2RlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xzTmFtZTogJ2RheXMnLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdNb250aCcsXHJcbiAgICAgICAgICAgIG5hdlN0ZXA6IDFcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xzTmFtZTogJ21vbnRocycsXHJcbiAgICAgICAgICAgIG5hdkZuYzogJ0Z1bGxZZWFyJyxcclxuICAgICAgICAgICAgbmF2U3RlcDogMVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjbHNOYW1lOiAneWVhcnMnLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdGdWxsWWVhcicsXHJcbiAgICAgICAgICAgIG5hdlN0ZXA6IDEwXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNsc05hbWU6ICdkYXknLFxyXG4gICAgICAgICAgICBuYXZGbmM6ICdEYXRlJyxcclxuICAgICAgICAgICAgbmF2U3RlcDogMVxyXG4gICAgICAgIH1cclxuICAgIF0sXHJcbiAgICBkYXRlczp7XHJcbiAgICAgICAgZGF5czogW1wiU3VuZGF5XCIsIFwiTW9uZGF5XCIsIFwiVHVlc2RheVwiLCBcIldlZG5lc2RheVwiLCBcIlRodXJzZGF5XCIsIFwiRnJpZGF5XCIsIFwiU2F0dXJkYXlcIiwgXCJTdW5kYXlcIl0sXHJcbiAgICAgICAgZGF5c1Nob3J0OiBbXCJTdW5cIiwgXCJNb25cIiwgXCJUdWVcIiwgXCJXZWRcIiwgXCJUaHVcIiwgXCJGcmlcIiwgXCJTYXRcIiwgXCJTdW5cIl0sXHJcbiAgICAgICAgZGF5c01pbjogW1wiU3VcIiwgXCJNb1wiLCBcIlR1XCIsIFwiV2VcIiwgXCJUaFwiLCBcIkZyXCIsIFwiU2FcIiwgXCJTdVwiXSxcclxuICAgICAgICBtb250aHM6IFtcIkphbnVhcnlcIiwgXCJGZWJydWFyeVwiLCBcIk1hcmNoXCIsIFwiQXByaWxcIiwgXCJNYXlcIiwgXCJKdW5lXCIsIFwiSnVseVwiLCBcIkF1Z3VzdFwiLCBcIlNlcHRlbWJlclwiLCBcIk9jdG9iZXJcIiwgXCJOb3ZlbWJlclwiLCBcIkRlY2VtYmVyXCJdLFxyXG4gICAgICAgIG1vbnRoc1Nob3J0OiBbXCJKYW5cIiwgXCJGZWJcIiwgXCJNYXJcIiwgXCJBcHJcIiwgXCJNYXlcIiwgXCJKdW5cIiwgXCJKdWxcIiwgXCJBdWdcIiwgXCJTZXBcIiwgXCJPY3RcIiwgXCJOb3ZcIiwgXCJEZWNcIl1cclxuICAgIH0sXHJcbiAgICBpc0xlYXBZZWFyOiBmdW5jdGlvbiAoeWVhcikge1xyXG4gICAgICAgIHJldHVybiAoKCh5ZWFyICUgNCA9PT0gMCkgJiYgKHllYXIgJSAxMDAgIT09IDApKSB8fCAoeWVhciAlIDQwMCA9PT0gMCkpO1xyXG4gICAgfSxcclxuICAgIGdldERheXNJbk1vbnRoOiBmdW5jdGlvbiAoeWVhciwgbW9udGgpIHtcclxuICAgICAgICByZXR1cm4gWzMxLCAoRFBHbG9iYWwuaXNMZWFwWWVhcih5ZWFyKSA/IDI5IDogMjgpLCAzMSwgMzAsIDMxLCAzMCwgMzEsIDMxLCAzMCwgMzEsIDMwLCAzMV1bbW9udGhdO1xyXG4gICAgfSxcclxuICAgIHBhcnNlRm9ybWF0OiBmdW5jdGlvbihmb3JtYXQpe1xyXG4gICAgICAgIHZhciBzZXBhcmF0b3IgPSBmb3JtYXQubWF0Y2goL1suXFwvXFwtXFxzXS4qPy8pLFxyXG4gICAgICAgICAgICBwYXJ0cyA9IGZvcm1hdC5zcGxpdCgvXFxXKy8pO1xyXG4gICAgICAgIGlmICghc2VwYXJhdG9yIHx8ICFwYXJ0cyB8fCBwYXJ0cy5sZW5ndGggPT09IDApe1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGRhdGUgZm9ybWF0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHtzZXBhcmF0b3I6IHNlcGFyYXRvciwgcGFydHM6IHBhcnRzfTtcclxuICAgIH0sXHJcbiAgICBwYXJzZURhdGU6IGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCkge1xyXG4gICAgICAgIC8qanNoaW50IG1heGNvbXBsZXhpdHk6MTEqL1xyXG4gICAgICAgIHZhciBwYXJ0cyA9IGRhdGUuc3BsaXQoZm9ybWF0LnNlcGFyYXRvciksXHJcbiAgICAgICAgICAgIHZhbDtcclxuICAgICAgICBkYXRlID0gbmV3IERhdGUoKTtcclxuICAgICAgICBkYXRlLnNldEhvdXJzKDApO1xyXG4gICAgICAgIGRhdGUuc2V0TWludXRlcygwKTtcclxuICAgICAgICBkYXRlLnNldFNlY29uZHMoMCk7XHJcbiAgICAgICAgZGF0ZS5zZXRNaWxsaXNlY29uZHMoMCk7XHJcbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gZm9ybWF0LnBhcnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgeWVhciA9IGRhdGUuZ2V0RnVsbFllYXIoKSwgZGF5ID0gZGF0ZS5nZXREYXRlKCksIG1vbnRoID0gZGF0ZS5nZXRNb250aCgpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpPTAsIGNudCA9IGZvcm1hdC5wYXJ0cy5sZW5ndGg7IGkgPCBjbnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFsID0gcGFyc2VJbnQocGFydHNbaV0sIDEwKXx8MTtcclxuICAgICAgICAgICAgICAgIHN3aXRjaChmb3JtYXQucGFydHNbaV0pIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdkZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRheSA9IHZhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZS5zZXREYXRlKHZhbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ21tJzpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdtJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggPSB2YWwgLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlLnNldE1vbnRoKHZhbCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd5eSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHllYXIgPSAyMDAwICsgdmFsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlLnNldEZ1bGxZZWFyKDIwMDAgKyB2YWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd5eXl5JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgeWVhciA9IHZhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZS5zZXRGdWxsWWVhcih2YWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGgsIGRheSwgMCAsMCAsMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRlO1xyXG4gICAgfSxcclxuICAgIGZvcm1hdERhdGU6IGZ1bmN0aW9uKGRhdGUsIGZvcm1hdCl7XHJcbiAgICAgICAgdmFyIHZhbCA9IHtcclxuICAgICAgICAgICAgZDogZGF0ZS5nZXREYXRlKCksXHJcbiAgICAgICAgICAgIG06IGRhdGUuZ2V0TW9udGgoKSArIDEsXHJcbiAgICAgICAgICAgIHl5OiBkYXRlLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKS5zdWJzdHJpbmcoMiksXHJcbiAgICAgICAgICAgIHl5eXk6IGRhdGUuZ2V0RnVsbFllYXIoKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFsLmRkID0gKHZhbC5kIDwgMTAgPyAnMCcgOiAnJykgKyB2YWwuZDtcclxuICAgICAgICB2YWwubW0gPSAodmFsLm0gPCAxMCA/ICcwJyA6ICcnKSArIHZhbC5tO1xyXG4gICAgICAgIGRhdGUgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpPTAsIGNudCA9IGZvcm1hdC5wYXJ0cy5sZW5ndGg7IGkgPCBjbnQ7IGkrKykge1xyXG4gICAgICAgICAgICBkYXRlLnB1c2godmFsW2Zvcm1hdC5wYXJ0c1tpXV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0ZS5qb2luKGZvcm1hdC5zZXBhcmF0b3IpO1xyXG4gICAgfSxcclxuICAgIGhlYWRUZW1wbGF0ZTogJzx0aGVhZD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHRyPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRoIGNsYXNzPVwicHJldlwiPiZsc2FxdW87PC90aD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0aCBjb2xzcGFuPVwiNVwiIGNsYXNzPVwic3dpdGNoXCI+PC90aD4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzx0aCBjbGFzcz1cIm5leHRcIj4mcnNhcXVvOzwvdGg+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvdHI+JytcclxuICAgICAgICAgICAgICAgICAgICAnPC90aGVhZD4nLFxyXG4gICAgY29udFRlbXBsYXRlOiAnPHRib2R5Pjx0cj48dGQgY29sc3Bhbj1cIjdcIj48L3RkPjwvdHI+PC90Ym9keT4nXHJcbn07XHJcbkRQR2xvYmFsLnRlbXBsYXRlID0gJzxkaXYgY2xhc3M9XCInICsgY2xhc3Nlcy5jb21wb25lbnQgKyAnXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCInICsgY2xhc3Nlcy5kYXlzICsgJ1wiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRhYmxlIGNsYXNzPVwiIHRhYmxlLWNvbmRlbnNlZFwiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRFBHbG9iYWwuaGVhZFRlbXBsYXRlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGJvZHk+PC90Ym9keT4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvdGFibGU+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiJyArIGNsYXNzZXMubW9udGhzICsgJ1wiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHRhYmxlIGNsYXNzPVwidGFibGUtY29uZGVuc2VkXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEUEdsb2JhbC5oZWFkVGVtcGxhdGUrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRFBHbG9iYWwuY29udFRlbXBsYXRlK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvdGFibGU+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiJyArIGNsYXNzZXMueWVhcnMgKyAnXCI+JytcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8dGFibGUgY2xhc3M9XCJ0YWJsZS1jb25kZW5zZWRcIj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERQR2xvYmFsLmhlYWRUZW1wbGF0ZStcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEUEdsb2JhbC5jb250VGVtcGxhdGUrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC90YWJsZT4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JytcclxuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JztcclxuRFBHbG9iYWwubW9kZXNTZXQgPSB7XHJcbiAgICAnZGF0ZSc6IERQR2xvYmFsLm1vZGVzWzNdLFxyXG4gICAgJ21vbnRoJzogRFBHbG9iYWwubW9kZXNbMF0sXHJcbiAgICAneWVhcic6IERQR2xvYmFsLm1vZGVzWzFdLFxyXG4gICAgJ2RlY2FkZSc6IERQR2xvYmFsLm1vZGVzWzJdXHJcbn07XHJcblxyXG4vKiogUHVibGljIEFQSSAqKi9cclxuZXhwb3J0cy5EYXRlUGlja2VyID0gRGF0ZVBpY2tlcjtcclxuZXhwb3J0cy5kZWZhdWx0cyA9IERQR2xvYmFsO1xyXG5leHBvcnRzLnV0aWxzID0gRFBHbG9iYWw7XHJcbiIsIi8qKlxyXG4gICAgQ3VzdG9tIExvY29ub21pY3MgJ2xvY2FsZScgc3R5bGVzIGZvciBkYXRlL3RpbWVzLlxyXG4gICAgSXRzIGEgYml0IG1vcmUgJ2Nvb2wnIHJlbmRlcmluZyBkYXRlcyA7LSlcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuLy8gU2luY2UgdGhlIHRhc2sgb2YgZGVmaW5lIGEgbG9jYWxlIGNoYW5nZXNcclxuLy8gdGhlIGN1cnJlbnQgZ2xvYmFsIGxvY2FsZSwgd2Ugc2F2ZSBhIHJlZmVyZW5jZVxyXG4vLyBhbmQgcmVzdG9yZSBpdCBsYXRlciBzbyBub3RoaW5nIGNoYW5nZWQuXHJcbnZhciBjdXJyZW50ID0gbW9tZW50LmxvY2FsZSgpO1xyXG5cclxubW9tZW50LmxvY2FsZSgnZW4tVVMtTEMnLCB7XHJcbiAgICBtZXJpZGllbVBhcnNlIDogL1thcF1cXC4/XFwuPy9pLFxyXG4gICAgbWVyaWRpZW0gOiBmdW5jdGlvbiAoaG91cnMsIG1pbnV0ZXMsIGlzTG93ZXIpIHtcclxuICAgICAgICBpZiAoaG91cnMgPiAxMSkge1xyXG4gICAgICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdwJyA6ICdQJztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdhJyA6ICdBJztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgY2FsZW5kYXIgOiB7XHJcbiAgICAgICAgbGFzdERheSA6ICdbWWVzdGVyZGF5XScsXHJcbiAgICAgICAgc2FtZURheSA6ICdbVG9kYXldJyxcclxuICAgICAgICBuZXh0RGF5IDogJ1tUb21vcnJvd10nLFxyXG4gICAgICAgIGxhc3RXZWVrIDogJ1tsYXN0XSBkZGRkJyxcclxuICAgICAgICBuZXh0V2VlayA6ICdkZGRkJyxcclxuICAgICAgICBzYW1lRWxzZSA6ICdNL0QnXHJcbiAgICB9LFxyXG4gICAgbG9uZ0RhdGVGb3JtYXQgOiB7XHJcbiAgICAgICAgTFQ6ICdoOm1tYScsXHJcbiAgICAgICAgTFRTOiAnaDptbTpzc2EnLFxyXG4gICAgICAgIEw6ICdNTS9ERC9ZWVlZJyxcclxuICAgICAgICBsOiAnTS9EL1lZWVknLFxyXG4gICAgICAgIExMOiAnTU1NTSBEbyBZWVlZJyxcclxuICAgICAgICBsbDogJ01NTSBEIFlZWVknLFxyXG4gICAgICAgIExMTDogJ01NTU0gRG8gWVlZWSBMVCcsXHJcbiAgICAgICAgbGxsOiAnTU1NIEQgWVlZWSBMVCcsXHJcbiAgICAgICAgTExMTDogJ2RkZGQsIE1NTU0gRG8gWVlZWSBMVCcsXHJcbiAgICAgICAgbGxsbDogJ2RkZCwgTU1NIEQgWVlZWSBMVCdcclxuICAgIH1cclxufSk7XHJcblxyXG4vLyBSZXN0b3JlIGxvY2FsZVxyXG5tb21lbnQubG9jYWxlKGN1cnJlbnQpO1xyXG4iLCIvKiogQXBwb2ludG1lbnQgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIENsaWVudCA9IHJlcXVpcmUoJy4vQ2xpZW50JyksXHJcbiAgICBMb2NhdGlvbiA9IHJlcXVpcmUoJy4vTG9jYXRpb24nKSxcclxuICAgIFNlcnZpY2UgPSByZXF1aXJlKCcuL1NlcnZpY2UnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG4gICBcclxuZnVuY3Rpb24gQXBwb2ludG1lbnQodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgaWQ6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3RhcnRUaW1lOiBudWxsLFxyXG4gICAgICAgIGVuZFRpbWU6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gRXZlbnQgc3VtbWFyeTpcclxuICAgICAgICBzdW1tYXJ5OiAnTmV3IGJvb2tpbmcnLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YnRvdGFsUHJpY2U6IDAsXHJcbiAgICAgICAgZmVlUHJpY2U6IDAsXHJcbiAgICAgICAgcGZlZVByaWNlOiAwLFxyXG4gICAgICAgIHRvdGFsUHJpY2U6IDAsXHJcbiAgICAgICAgcHRvdGFsUHJpY2U6IDAsXHJcbiAgICAgICAgXHJcbiAgICAgICAgcHJlTm90ZXNUb0NsaWVudDogbnVsbCxcclxuICAgICAgICBwb3N0Tm90ZXNUb0NsaWVudDogbnVsbCxcclxuICAgICAgICBwcmVOb3Rlc1RvU2VsZjogbnVsbCxcclxuICAgICAgICBwb3N0Tm90ZXNUb1NlbGY6IG51bGxcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHZhbHVlcyA9IHZhbHVlcyB8fCB7fTtcclxuXHJcbiAgICB0aGlzLmNsaWVudCA9IGtvLm9ic2VydmFibGUodmFsdWVzLmNsaWVudCA/IG5ldyBDbGllbnQodmFsdWVzLmNsaWVudCkgOiBudWxsKTtcclxuXHJcbiAgICB0aGlzLmxvY2F0aW9uID0ga28ub2JzZXJ2YWJsZShuZXcgTG9jYXRpb24odmFsdWVzLmxvY2F0aW9uKSk7XHJcbiAgICB0aGlzLmxvY2F0aW9uU3VtbWFyeSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxvY2F0aW9uKCkuc2luZ2xlTGluZSgpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuc2VydmljZXMgPSBrby5vYnNlcnZhYmxlQXJyYXkoKHZhbHVlcy5zZXJ2aWNlcyB8fCBbXSkubWFwKGZ1bmN0aW9uKHNlcnZpY2UpIHtcclxuICAgICAgICByZXR1cm4gKHNlcnZpY2UgaW5zdGFuY2VvZiBTZXJ2aWNlKSA/IHNlcnZpY2UgOiBuZXcgU2VydmljZShzZXJ2aWNlKTtcclxuICAgIH0pKTtcclxuICAgIHRoaXMuc2VydmljZXNTdW1tYXJ5ID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VydmljZXMoKS5tYXAoZnVuY3Rpb24oc2VydmljZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc2VydmljZS5uYW1lKCk7XHJcbiAgICAgICAgfSkuam9pbignLCAnKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICAvLyBQcmljZSB1cGRhdGUgb24gc2VydmljZXMgY2hhbmdlc1xyXG4gICAgLy8gVE9ETyBJcyBub3QgY29tcGxldGUgZm9yIHByb2R1Y3Rpb25cclxuICAgIHRoaXMuc2VydmljZXMuc3Vic2NyaWJlKGZ1bmN0aW9uKHNlcnZpY2VzKSB7XHJcbiAgICAgICAgdGhpcy5wdG90YWxQcmljZShzZXJ2aWNlcy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwcmV2ICsgY3VyLnByaWNlKCk7XHJcbiAgICAgICAgfSwgMCkpO1xyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuICAgIFxyXG4gICAgLy8gU21hcnQgdmlzdWFsaXphdGlvbiBvZiBkYXRlIGFuZCB0aW1lXHJcbiAgICB0aGlzLmRpc3BsYXllZERhdGUgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzLnN0YXJ0VGltZSgpKS5sb2NhbGUoJ2VuLVVTLUxDJykuY2FsZW5kYXIoKTtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmRpc3BsYXllZFN0YXJ0VGltZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbW9tZW50KHRoaXMuc3RhcnRUaW1lKCkpLmxvY2FsZSgnZW4tVVMtTEMnKS5mb3JtYXQoJ0xUJyk7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNwbGF5ZWRFbmRUaW1lID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBtb21lbnQodGhpcy5lbmRUaW1lKCkpLmxvY2FsZSgnZW4tVVMtTEMnKS5mb3JtYXQoJ0xUJyk7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNwbGF5ZWRUaW1lUmFuZ2UgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlzcGxheWVkU3RhcnRUaW1lKCkgKyAnLScgKyB0aGlzLmRpc3BsYXllZEVuZFRpbWUoKTtcclxuICAgICAgICBcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLml0U3RhcnRlZCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKHRoaXMuc3RhcnRUaW1lKCkgJiYgbmV3IERhdGUoKSA+PSB0aGlzLnN0YXJ0VGltZSgpKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLml0RW5kZWQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLmVuZFRpbWUoKSAmJiBuZXcgRGF0ZSgpID49IHRoaXMuZW5kVGltZSgpKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmlzTmV3ID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAoIXRoaXMuaWQoKSk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5zdGF0ZUhlYWRlciA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgdGV4dCA9ICcnO1xyXG4gICAgICAgIGlmICghdGhpcy5pc05ldygpKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLml0U3RhcnRlZCgpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pdEVuZGVkKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gJ0NvbXBsZXRlZDonO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dCA9ICdOb3c6JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRleHQgPSAnVXBjb21pbmc6JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRleHQ7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBcHBvaW50bWVudDtcclxuIiwiLyoqIEJvb2tpbmdTdW1tYXJ5IG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyksXHJcbiAgICBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcclxuICAgIFxyXG5mdW5jdGlvbiBCb29raW5nU3VtbWFyeSh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBxdWFudGl0eTogMCxcclxuICAgICAgICBjb25jZXB0OiAnJyxcclxuICAgICAgICB0aW1lOiBudWxsLFxyXG4gICAgICAgIHRpbWVGb3JtYXQ6ICcgW0BdIGg6bW1hJ1xyXG4gICAgfSwgdmFsdWVzKTtcclxuXHJcbiAgICB0aGlzLnBocmFzZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpe1xyXG4gICAgICAgIHZhciB0ID0gdGhpcy50aW1lKCkgJiYgbW9tZW50KHRoaXMudGltZSgpKS5mb3JtYXQodGhpcy50aW1lRm9ybWF0KCkpIHx8ICcnOyAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uY2VwdCgpICsgdDtcclxuICAgIH0sIHRoaXMpO1xyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCb29raW5nU3VtbWFyeTtcclxuIiwiLyoqXHJcbiAgICBFdmVudCBtb2RlbFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyogRXhhbXBsZSBKU09OIChyZXR1cm5lZCBieSB0aGUgUkVTVCBBUEkpOlxyXG57XHJcbiAgXCJFdmVudElEXCI6IDM1MyxcclxuICBcIlVzZXJJRFwiOiAxNDEsXHJcbiAgXCJFdmVudFR5cGVJRFwiOiAzLFxyXG4gIFwiU3VtbWFyeVwiOiBcIkhvdXNla2VlcGVyIHNlcnZpY2VzIGZvciBKb3NodWFQcm92aWRlciBELlwiLFxyXG4gIFwiQXZhaWxhYmlsaXR5VHlwZUlEXCI6IDMsXHJcbiAgXCJTdGFydFRpbWVcIjogXCIyMDE0LTAzLTI1VDA4OjAwOjAwWlwiLFxyXG4gIFwiRW5kVGltZVwiOiBcIjIwMTQtMDMtMjVUMTg6MDA6MDBaXCIsXHJcbiAgXCJLaW5kXCI6IDAsXHJcbiAgXCJJc0FsbERheVwiOiBmYWxzZSxcclxuICBcIlRpbWVab25lXCI6IFwiMDE6MDA6MDBcIixcclxuICBcIkxvY2F0aW9uXCI6IFwibnVsbFwiLFxyXG4gIFwiVXBkYXRlZERhdGVcIjogXCIyMDE0LTEwLTMwVDE1OjQ0OjQ5LjY1M1wiLFxyXG4gIFwiQ3JlYXRlZERhdGVcIjogbnVsbCxcclxuICBcIkRlc2NyaXB0aW9uXCI6IFwidGVzdCBkZXNjcmlwdGlvbiBvZiBhIFJFU1QgZXZlbnRcIixcclxuICBcIlJlY3VycmVuY2VSdWxlXCI6IHtcclxuICAgIFwiRnJlcXVlbmN5VHlwZUlEXCI6IDUwMixcclxuICAgIFwiSW50ZXJ2YWxcIjogMSxcclxuICAgIFwiVW50aWxcIjogXCIyMDE0LTA3LTAxVDAwOjAwOjAwXCIsXHJcbiAgICBcIkNvdW50XCI6IG51bGwsXHJcbiAgICBcIkVuZGluZ1wiOiBcImRhdGVcIixcclxuICAgIFwiU2VsZWN0ZWRXZWVrRGF5c1wiOiBbXHJcbiAgICAgIDEsXHJcbiAgICBdLFxyXG4gICAgXCJNb250aGx5V2Vla0RheVwiOiBmYWxzZSxcclxuICAgIFwiSW5jb21wYXRpYmxlXCI6IGZhbHNlLFxyXG4gICAgXCJUb29NYW55XCI6IGZhbHNlXHJcbiAgfSxcclxuICBcIlJlY3VycmVuY2VPY2N1cnJlbmNlc1wiOiBudWxsLFxyXG4gIFwiUmVhZE9ubHlcIjogZmFsc2VcclxufSovXHJcblxyXG5mdW5jdGlvbiBSZWN1cnJlbmNlUnVsZSh2YWx1ZXMpIHtcclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGZyZXF1ZW5jeVR5cGVJRDogMCxcclxuICAgICAgICBpbnRlcnZhbDogMSwgLy86SW50ZWdlclxyXG4gICAgICAgIHVudGlsOiBudWxsLCAvLzpEYXRlXHJcbiAgICAgICAgY291bnQ6IG51bGwsIC8vOkludGVnZXJcclxuICAgICAgICBlbmRpbmc6IG51bGwsIC8vIDpzdHJpbmcgUG9zc2libGUgdmFsdWVzIGFsbG93ZWQ6ICduZXZlcicsICdkYXRlJywgJ29jdXJyZW5jZXMnXHJcbiAgICAgICAgc2VsZWN0ZWRXZWVrRGF5czogW10sIC8vIDppbnRlZ2VyW10gMDpTdW5kYXlcclxuICAgICAgICBtb250aGx5V2Vla0RheTogZmFsc2UsXHJcbiAgICAgICAgaW5jb21wYXRpYmxlOiBmYWxzZSxcclxuICAgICAgICB0b29NYW55OiBmYWxzZVxyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gUmVjdXJyZW5jZU9jY3VycmVuY2UodmFsdWVzKSB7XHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBzdGFydFRpbWU6IG51bGwsIC8vOkRhdGVcclxuICAgICAgICBlbmRUaW1lOiBudWxsIC8vOkRhdGVcclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG4gICBcclxuZnVuY3Rpb24gQ2FsZW5kYXJFdmVudCh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgY2FsZW5kYXJFdmVudElEOiAwLFxyXG4gICAgICAgIHVzZXJJRDogMCxcclxuICAgICAgICBldmVudFR5cGVJRDogMyxcclxuICAgICAgICBzdW1tYXJ5OiAnJyxcclxuICAgICAgICBhdmFpbGFiaWxpdHlUeXBlSUQ6IDAsXHJcbiAgICAgICAgc3RhcnRUaW1lOiBudWxsLFxyXG4gICAgICAgIGVuZFRpbWU6IG51bGwsXHJcbiAgICAgICAga2luZDogMCxcclxuICAgICAgICBpc0FsbERheTogZmFsc2UsXHJcbiAgICAgICAgdGltZVpvbmU6ICdaJyxcclxuICAgICAgICBsb2NhdGlvbjogbnVsbCxcclxuICAgICAgICB1cGRhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbnVsbCxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJycsXHJcbiAgICAgICAgcmVhZE9ubHk6IGZhbHNlXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG5cclxuICAgIHRoaXMucmVjdXJyZW5jZVJ1bGUgPSBrby5vYnNlcnZhYmxlKFxyXG4gICAgICAgIHZhbHVlcyAmJiBcclxuICAgICAgICB2YWx1ZXMucmVjdXJyZW5jZVJ1bGUgJiYgXHJcbiAgICAgICAgbmV3IFJlY3VycmVuY2VSdWxlKHZhbHVlcy5yZWN1cnJlbmNlUnVsZSlcclxuICAgICk7XHJcbiAgICB0aGlzLnJlY3VycmVuY2VPY2N1cnJlbmNlcyA9IGtvLm9ic2VydmFibGVBcnJheShbXSk7IC8vOlJlY3VycmVuY2VPY2N1cnJlbmNlW11cclxuICAgIGlmICh2YWx1ZXMgJiYgdmFsdWVzLnJlY3VycmVuY2VPY2N1cnJlbmNlcykge1xyXG4gICAgICAgIHZhbHVlcy5yZWN1cnJlbmNlT2NjdXJyZW5jZXMuZm9yRWFjaChmdW5jdGlvbihvY2N1cnJlbmNlKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLlJlY3VycmVuY2VPY2N1cnJlbmNlcy5wdXNoKG5ldyBSZWN1cnJlbmNlT2NjdXJyZW5jZShvY2N1cnJlbmNlKSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ2FsZW5kYXJFdmVudDtcclxuXHJcbkNhbGVuZGFyRXZlbnQuUmVjdXJyZW5jZVJ1bGUgPSBSZWN1cnJlbmNlUnVsZTtcclxuQ2FsZW5kYXJFdmVudC5SZWN1cnJlbmNlT2NjdXJyZW5jZSA9IFJlY3VycmVuY2VPY2N1cnJlbmNlOyIsIi8qKiBDYWxlbmRhclNsb3QgbW9kZWwuXHJcblxyXG4gICAgRGVzY3JpYmVzIGEgdGltZSBzbG90IGluIHRoZSBjYWxlbmRhciwgZm9yIGEgY29uc2VjdXRpdmVcclxuICAgIGV2ZW50LCBhcHBvaW50bWVudCBvciBmcmVlIHRpbWUuXHJcbiAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgQ2xpZW50ID0gcmVxdWlyZSgnLi9DbGllbnQnKTtcclxuXHJcbmZ1bmN0aW9uIENhbGVuZGFyU2xvdCh2YWx1ZXMpIHtcclxuICAgIFxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBzdGFydFRpbWU6IG51bGwsXHJcbiAgICAgICAgZW5kVGltZTogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIycsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuICAgICAgICBcclxuICAgICAgICBjbGFzc05hbWVzOiAnJ1xyXG5cclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ2FsZW5kYXJTbG90O1xyXG4iLCIvKiogQ2xpZW50IG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBDbGllbnQodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGZpcnN0TmFtZTogJycsXHJcbiAgICAgICAgbGFzdE5hbWU6ICcnXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG5cclxuICAgIHRoaXMuZnVsbE5hbWUgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKHRoaXMuZmlyc3ROYW1lKCkgKyAnICcgKyB0aGlzLmxhc3ROYW1lKCkpO1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ2xpZW50O1xyXG4iLCIvKiogR2V0TW9yZSBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgTGlzdFZpZXdJdGVtID0gcmVxdWlyZSgnLi9MaXN0Vmlld0l0ZW0nKTtcclxuXHJcbmZ1bmN0aW9uIEdldE1vcmUodmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBhdmFpbGFiaWxpdHk6IGZhbHNlLFxyXG4gICAgICAgIHBheW1lbnRzOiBmYWxzZSxcclxuICAgICAgICBwcm9maWxlOiBmYWxzZSxcclxuICAgICAgICBjb29wOiB0cnVlXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgdmFyIGF2YWlsYWJsZUl0ZW1zID0ge1xyXG4gICAgICAgIGF2YWlsYWJpbGl0eTogbmV3IExpc3RWaWV3SXRlbSh7XHJcbiAgICAgICAgICAgIGNvbnRlbnRMaW5lMTogJ0NvbXBsZXRlIHlvdXIgYXZhaWxhYmlsaXR5IHRvIGNyZWF0ZSBhIGNsZWFuZXIgY2FsZW5kYXInLFxyXG4gICAgICAgICAgICBtYXJrZXJJY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1jYWxlbmRhcicsXHJcbiAgICAgICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tcmlnaHQnXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgcGF5bWVudHM6IG5ldyBMaXN0Vmlld0l0ZW0oe1xyXG4gICAgICAgICAgICBjb250ZW50TGluZTE6ICdTdGFydCBhY2NlcHRpbmcgcGF5bWVudHMgdGhyb3VnaCBMb2Nvbm9taWNzJyxcclxuICAgICAgICAgICAgbWFya2VySWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tdXNkJyxcclxuICAgICAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1yaWdodCdcclxuICAgICAgICB9KSxcclxuICAgICAgICBwcm9maWxlOiBuZXcgTGlzdFZpZXdJdGVtKHtcclxuICAgICAgICAgICAgY29udGVudExpbmUxOiAnQWN0aXZhdGUgeW91ciBwcm9maWxlIGluIHRoZSBtYXJrZXRwbGFjZScsXHJcbiAgICAgICAgICAgIG1hcmtlckljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXVzZXInLFxyXG4gICAgICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0J1xyXG4gICAgICAgIH0pLFxyXG4gICAgICAgIGNvb3A6IG5ldyBMaXN0Vmlld0l0ZW0oe1xyXG4gICAgICAgICAgICBjb250ZW50TGluZTE6ICdMZWFybiBtb3JlIGFib3V0IG91ciBjb29wZXJhdGl2ZScsXHJcbiAgICAgICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tcmlnaHQnXHJcbiAgICAgICAgfSlcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pdGVtcyA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcclxuICAgICAgICBcclxuICAgICAgICBPYmplY3Qua2V5cyhhdmFpbGFibGVJdGVtcykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICh0aGlzW2tleV0oKSlcclxuICAgICAgICAgICAgICAgIGl0ZW1zLnB1c2goYXZhaWxhYmxlSXRlbXNba2V5XSk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGl0ZW1zO1xyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gR2V0TW9yZTtcclxuIiwiLyoqIExpc3RWaWV3SXRlbSBtb2RlbC5cclxuXHJcbiAgICBEZXNjcmliZXMgYSBnZW5lcmljIGl0ZW0gb2YgYVxyXG4gICAgTGlzdFZpZXcgY29tcG9uZW50LlxyXG4gKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxuZnVuY3Rpb24gTGlzdFZpZXdJdGVtKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIG1hcmtlckxpbmUxOiBudWxsLFxyXG4gICAgICAgIG1hcmtlckxpbmUyOiBudWxsLFxyXG4gICAgICAgIG1hcmtlckljb246IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgY29udGVudExpbmUxOiAnJyxcclxuICAgICAgICBjb250ZW50TGluZTI6IG51bGwsXHJcbiAgICAgICAgbGluazogJyMnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgY2xhc3NOYW1lczogJydcclxuXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExpc3RWaWV3SXRlbTtcclxuIiwiLyoqIExvY2F0aW9uIG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBMb2NhdGlvbih2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBsb2NhdGlvbklEOiAwLFxyXG4gICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgIGFkZHJlc3NMaW5lMTogbnVsbCxcclxuICAgICAgICBhZGRyZXNzTGluZTI6IG51bGwsXHJcbiAgICAgICAgY2l0eTogbnVsbCxcclxuICAgICAgICBzdGF0ZVByb3ZpbmNlQ29kZTogbnVsbCxcclxuICAgICAgICBzdGF0ZVByb3ZpY2VJRDogbnVsbCxcclxuICAgICAgICBwb3N0YWxDb2RlOiBudWxsLFxyXG4gICAgICAgIHBvc3RhbENvZGVJRDogbnVsbCxcclxuICAgICAgICBjb3VudHJ5SUQ6IG51bGwsXHJcbiAgICAgICAgbGF0aXR1ZGU6IG51bGwsXHJcbiAgICAgICAgbG9uZ2l0dWRlOiBudWxsLFxyXG4gICAgICAgIHNwZWNpYWxJbnN0cnVjdGlvbnM6IG51bGwsXHJcbiAgICAgICAgaXNTZXJ2aWNlUmFkaXVzOiBmYWxzZSxcclxuICAgICAgICBpc1NlcnZpY2VMb2NhdGlvbjogZmFsc2UsXHJcbiAgICAgICAgc2VydmljZVJhZGl1czogMFxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5zaW5nbGVMaW5lID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGxpc3QgPSBbXHJcbiAgICAgICAgICAgIHRoaXMuYWRkcmVzc0xpbmUxKCksXHJcbiAgICAgICAgICAgIHRoaXMuY2l0eSgpLFxyXG4gICAgICAgICAgICB0aGlzLnBvc3RhbENvZGUoKSxcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZVByb3ZpbmNlQ29kZSgpXHJcbiAgICAgICAgXTtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbGlzdC5maWx0ZXIoZnVuY3Rpb24odikgeyByZXR1cm4gISF2OyB9KS5qb2luKCcsICcpO1xyXG4gICAgfSwgdGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMuY291bnRyeU5hbWUgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmNvdW50cnlJRCgpID09PSAxID9cclxuICAgICAgICAgICAgJ1VuaXRlZCBTdGF0ZXMnIDpcclxuICAgICAgICAgICAgdGhpcy5jb3VudHJ5SUQoKSA9PT0gMiA/XHJcbiAgICAgICAgICAgICdTcGFpbicgOlxyXG4gICAgICAgICAgICAndW5rbm93J1xyXG4gICAgICAgICk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5jb3VudHJ5Q29kZUFscGhhMiA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMuY291bnRyeUlEKCkgPT09IDEgP1xyXG4gICAgICAgICAgICAnVVMnIDpcclxuICAgICAgICAgICAgdGhpcy5jb3VudHJ5SUQoKSA9PT0gMiA/XHJcbiAgICAgICAgICAgICdFUycgOlxyXG4gICAgICAgICAgICAnJ1xyXG4gICAgICAgICk7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5sYXRsbmcgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBsYXQ6IHRoaXMubGF0aXR1ZGUoKSxcclxuICAgICAgICAgICAgbG5nOiB0aGlzLmxvbmdpdHVkZSgpXHJcbiAgICAgICAgfTtcclxuICAgIH0sIHRoaXMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExvY2F0aW9uO1xyXG4iLCIvKiogTWFpbEZvbGRlciBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JyksXHJcbiAgICBfID0gcmVxdWlyZSgnbG9kYXNoJyk7XHJcblxyXG5mdW5jdGlvbiBNYWlsRm9sZGVyKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgbWVzc2FnZXM6IFtdLFxyXG4gICAgICAgIHRvcE51bWJlcjogMTBcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMudG9wID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uIHRvcChudW0pIHtcclxuICAgICAgICBpZiAobnVtKSB0aGlzLnRvcE51bWJlcihudW0pO1xyXG4gICAgICAgIHJldHVybiBfLmZpcnN0KHRoaXMubWVzc2FnZXMoKSwgdGhpcy50b3BOdW1iZXIoKSk7XHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNYWlsRm9sZGVyO1xyXG4iLCIvKiogTWVzc2FnZSBtb2RlbC5cclxuXHJcbiAgICBEZXNjcmliZXMgYSBtZXNzYWdlIGZyb20gYSBNYWlsRm9sZGVyLlxyXG4gICAgQSBtZXNzYWdlIGNvdWxkIGJlIG9mIGRpZmZlcmVudCB0eXBlcyxcclxuICAgIGFzIGlucXVpcmllcywgYm9va2luZ3MsIGJvb2tpbmcgcmVxdWVzdHMuXHJcbiAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcbi8vVE9ETyAgIFRocmVhZCA9IHJlcXVpcmUoJy4vVGhyZWFkJyk7XHJcblxyXG5mdW5jdGlvbiBNZXNzYWdlKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBudWxsLFxyXG4gICAgICAgIHVwZGF0ZWREYXRlOiBudWxsLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICcnLFxyXG4gICAgICAgIGNvbnRlbnQ6IG51bGwsXHJcbiAgICAgICAgbGluazogJyMnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcbiAgICAgICAgXHJcbiAgICAgICAgY2xhc3NOYW1lczogJydcclxuXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICAvLyBTbWFydCB2aXN1YWxpemF0aW9uIG9mIGRhdGUgYW5kIHRpbWVcclxuICAgIHRoaXMuZGlzcGxheWVkRGF0ZSA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbW9tZW50KHRoaXMuY3JlYXRlZERhdGUoKSkubG9jYWxlKCdlbi1VUy1MQycpLmNhbGVuZGFyKCk7XHJcbiAgICAgICAgXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5kaXNwbGF5ZWRUaW1lID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBtb21lbnQodGhpcy5jcmVhdGVkRGF0ZSgpKS5sb2NhbGUoJ2VuLVVTLUxDJykuZm9ybWF0KCdMVCcpO1xyXG4gICAgICAgIFxyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWVzc2FnZTtcclxuIiwiLyoqXHJcbiAgICBNb2RlbCBjbGFzcyB0byBoZWxwIGJ1aWxkIG1vZGVscy5cclxuXHJcbiAgICBJcyBub3QgZXhhY3RseSBhbiAnT09QIGJhc2UnIGNsYXNzLCBidXQgcHJvdmlkZXNcclxuICAgIHV0aWxpdGllcyB0byBtb2RlbHMgYW5kIGEgbW9kZWwgZGVmaW5pdGlvbiBvYmplY3RcclxuICAgIHdoZW4gZXhlY3V0ZWQgaW4gdGhlaXIgY29uc3RydWN0b3JzIGFzOlxyXG4gICAgXHJcbiAgICAnJydcclxuICAgIGZ1bmN0aW9uIE15TW9kZWwoKSB7XHJcbiAgICAgICAgTW9kZWwodGhpcyk7XHJcbiAgICAgICAgLy8gTm93LCB0aGVyZSBpcyBhIHRoaXMubW9kZWwgcHJvcGVydHkgd2l0aFxyXG4gICAgICAgIC8vIGFuIGluc3RhbmNlIG9mIHRoZSBNb2RlbCBjbGFzcywgd2l0aCBcclxuICAgICAgICAvLyB1dGlsaXRpZXMgYW5kIG1vZGVsIHNldHRpbmdzLlxyXG4gICAgfVxyXG4gICAgJycnXHJcbiAgICBcclxuICAgIFRoYXQgYXV0byBjcmVhdGlvbiBvZiAnbW9kZWwnIHByb3BlcnR5IGNhbiBiZSBhdm9pZGVkXHJcbiAgICB3aGVuIHVzaW5nIHRoZSBvYmplY3QgaW5zdGFudGlhdGlvbiBzeW50YXggKCduZXcnIGtleXdvcmQpOlxyXG4gICAgXHJcbiAgICAnJydcclxuICAgIHZhciBtb2RlbCA9IG5ldyBNb2RlbChvYmopO1xyXG4gICAgLy8gVGhlcmUgaXMgbm8gYSAnb2JqLm1vZGVsJyBwcm9wZXJ0eSwgY2FuIGJlXHJcbiAgICAvLyBhc3NpZ25lZCB0byB3aGF0ZXZlciBwcm9wZXJ0eSBvciBub3RoaW5nLlxyXG4gICAgJycnXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0Jyk7XHJcbmtvLm1hcHBpbmcgPSByZXF1aXJlKCdrbm9ja291dC5tYXBwaW5nJyk7XHJcblxyXG5mdW5jdGlvbiBNb2RlbChtb2RlbE9iamVjdCkge1xyXG4gICAgXHJcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgTW9kZWwpKSB7XHJcbiAgICAgICAgLy8gRXhlY3V0ZWQgYXMgYSBmdW5jdGlvbiwgaXQgbXVzdCBjcmVhdGVcclxuICAgICAgICAvLyBhIE1vZGVsIGluc3RhbmNlXHJcbiAgICAgICAgdmFyIG1vZGVsID0gbmV3IE1vZGVsKG1vZGVsT2JqZWN0KTtcclxuICAgICAgICAvLyBhbmQgcmVnaXN0ZXIgYXV0b21hdGljYWxseSBhcyBwYXJ0XHJcbiAgICAgICAgLy8gb2YgdGhlIG1vZGVsT2JqZWN0IGluICdtb2RlbCcgcHJvcGVydHlcclxuICAgICAgICBtb2RlbE9iamVjdC5tb2RlbCA9IG1vZGVsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFJldHVybnMgdGhlIGluc3RhbmNlXHJcbiAgICAgICAgcmV0dXJuIG1vZGVsO1xyXG4gICAgfVxyXG4gXHJcbiAgICAvLyBJdCBpbmNsdWRlcyBhIHJlZmVyZW5jZSB0byB0aGUgb2JqZWN0XHJcbiAgICB0aGlzLm1vZGVsT2JqZWN0ID0gbW9kZWxPYmplY3Q7XHJcbiAgICAvLyBJdCBtYWludGFpbnMgYSBsaXN0IG9mIHByb3BlcnRpZXMgYW5kIGZpZWxkc1xyXG4gICAgdGhpcy5wcm9wZXJ0aWVzTGlzdCA9IFtdO1xyXG4gICAgdGhpcy5maWVsZHNMaXN0ID0gW107XHJcbiAgICAvLyBJdCBhbGxvdyBzZXR0aW5nIHRoZSAna28ubWFwcGluZy5mcm9tSlMnIG1hcHBpbmcgb3B0aW9uc1xyXG4gICAgLy8gdG8gY29udHJvbCBjb252ZXJzaW9ucyBmcm9tIHBsYWluIEpTIG9iamVjdHMgd2hlbiBcclxuICAgIC8vICd1cGRhdGVXaXRoJy5cclxuICAgIHRoaXMubWFwcGluZ09wdGlvbnMgPSB7fTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNb2RlbDtcclxuXHJcbi8qKlxyXG4gICAgRGVmaW5lIG9ic2VydmFibGUgcHJvcGVydGllcyB1c2luZyB0aGUgZ2l2ZW5cclxuICAgIHByb3BlcnRpZXMgb2JqZWN0IGRlZmluaXRpb24gdGhhdCBpbmNsdWRlcyBkZSBkZWZhdWx0IHZhbHVlcyxcclxuICAgIGFuZCBzb21lIG9wdGlvbmFsIGluaXRpYWxWYWx1ZXMgKG5vcm1hbGx5IHRoYXQgaXMgcHJvdmlkZWQgZXh0ZXJuYWxseVxyXG4gICAgYXMgYSBwYXJhbWV0ZXIgdG8gdGhlIG1vZGVsIGNvbnN0cnVjdG9yLCB3aGlsZSBkZWZhdWx0IHZhbHVlcyBhcmVcclxuICAgIHNldCBpbiB0aGUgY29uc3RydWN0b3IpLlxyXG4gICAgVGhhdCBwcm9wZXJ0aWVzIGJlY29tZSBtZW1iZXJzIG9mIHRoZSBtb2RlbE9iamVjdCwgc2ltcGxpZnlpbmcgXHJcbiAgICBtb2RlbCBkZWZpbml0aW9ucy5cclxuICAgIFxyXG4gICAgSXQgdXNlcyBLbm9ja291dC5vYnNlcnZhYmxlIGFuZCBvYnNlcnZhYmxlQXJyYXksIHNvIHByb3BlcnRpZXNcclxuICAgIGFyZSBmdW50aW9ucyB0aGF0IHJlYWRzIHRoZSB2YWx1ZSB3aGVuIG5vIGFyZ3VtZW50cyBvciBzZXRzIHdoZW5cclxuICAgIG9uZSBhcmd1bWVudCBpcyBwYXNzZWQgb2YuXHJcbioqL1xyXG5Nb2RlbC5wcm90b3R5cGUuZGVmUHJvcGVydGllcyA9IGZ1bmN0aW9uIGRlZlByb3BlcnRpZXMocHJvcGVydGllcywgaW5pdGlhbFZhbHVlcykge1xyXG5cclxuICAgIGluaXRpYWxWYWx1ZXMgPSBpbml0aWFsVmFsdWVzIHx8IHt9O1xyXG5cclxuICAgIHZhciBtb2RlbE9iamVjdCA9IHRoaXMubW9kZWxPYmplY3QsXHJcbiAgICAgICAgcHJvcGVydGllc0xpc3QgPSB0aGlzLnByb3BlcnRpZXNMaXN0O1xyXG5cclxuICAgIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRlZlZhbCA9IHByb3BlcnRpZXNba2V5XTtcclxuICAgICAgICAvLyBDcmVhdGUgb2JzZXJ2YWJsZSBwcm9wZXJ0eSB3aXRoIGRlZmF1bHQgdmFsdWVcclxuICAgICAgICBtb2RlbE9iamVjdFtrZXldID0gQXJyYXkuaXNBcnJheShkZWZWYWwpID9cclxuICAgICAgICAgICAga28ub2JzZXJ2YWJsZUFycmF5KGRlZlZhbCkgOlxyXG4gICAgICAgICAgICBrby5vYnNlcnZhYmxlKGRlZlZhbCk7XHJcbiAgICAgICAgLy8gUmVtZW1iZXIgZGVmYXVsdFxyXG4gICAgICAgIG1vZGVsT2JqZWN0W2tleV0uX2RlZmF1bHRWYWx1ZSA9IGRlZlZhbDtcclxuICAgICAgICBcclxuICAgICAgICAvLyBJZiB0aGVyZSBpcyBhbiBpbml0aWFsVmFsdWUsIHNldCBpdDpcclxuICAgICAgICBpZiAodHlwZW9mKGluaXRpYWxWYWx1ZXNba2V5XSkgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIG1vZGVsT2JqZWN0W2tleV0oaW5pdGlhbFZhbHVlc1trZXldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQWRkIHRvIHRoZSBpbnRlcm5hbCByZWdpc3RyeVxyXG4gICAgICAgIHByb3BlcnRpZXNMaXN0LnB1c2goa2V5KTtcclxuICAgIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBEZWZpbmUgZmllbGRzIGFzIHBsYWluIG1lbWJlcnMgb2YgdGhlIG1vZGVsT2JqZWN0IHVzaW5nXHJcbiAgICB0aGUgZmllbGRzIG9iamVjdCBkZWZpbml0aW9uIHRoYXQgaW5jbHVkZXMgZGVmYXVsdCB2YWx1ZXMsXHJcbiAgICBhbmQgc29tZSBvcHRpb25hbCBpbml0aWFsVmFsdWVzLlxyXG4gICAgXHJcbiAgICBJdHMgbGlrZSBkZWZQcm9wZXJ0aWVzLCBidXQgZm9yIHBsYWluIGpzIHZhbHVlcyByYXRoZXIgdGhhbiBvYnNlcnZhYmxlcy5cclxuKiovXHJcbk1vZGVsLnByb3RvdHlwZS5kZWZGaWVsZHMgPSBmdW5jdGlvbiBkZWZGaWVsZHMoZmllbGRzLCBpbml0aWFsVmFsdWVzKSB7XHJcblxyXG4gICAgaW5pdGlhbFZhbHVlcyA9IGluaXRpYWxWYWx1ZXMgfHwge307XHJcblxyXG4gICAgdmFyIG1vZGVsT2JqZWN0ID0gdGhpcy5tb2RlbE9iamVjdCxcclxuICAgICAgICBmaWVsZHNMaXN0ID0gdGhpcy5maWVsZHNMaXN0O1xyXG5cclxuICAgIE9iamVjdC5rZXlzKGZpZWxkcykuZWFjaChmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgZGVmVmFsID0gZmllbGRzW2tleV07XHJcbiAgICAgICAgLy8gQ3JlYXRlIGZpZWxkIHdpdGggZGVmYXVsdCB2YWx1ZVxyXG4gICAgICAgIG1vZGVsT2JqZWN0W2tleV0gPSBkZWZWYWw7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgYW4gaW5pdGlhbFZhbHVlLCBzZXQgaXQ6XHJcbiAgICAgICAgaWYgKHR5cGVvZihpbml0aWFsVmFsdWVzW2tleV0pICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICBtb2RlbE9iamVjdFtrZXldID0gaW5pdGlhbFZhbHVlc1trZXldO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBBZGQgdG8gdGhlIGludGVybmFsIHJlZ2lzdHJ5XHJcbiAgICAgICAgZmllbGRzTGlzdC5wdXNoKGtleSk7XHJcbiAgICB9KTsgICAgXHJcbn07XHJcblxyXG5Nb2RlbC5wcm90b3R5cGUudXBkYXRlV2l0aCA9IGZ1bmN0aW9uIHVwZGF0ZVdpdGgoZGF0YSkge1xyXG4gICAgXHJcbiAgICAvLyBXZSBuZWVkIGEgcGxhaW4gb2JqZWN0IGZvciAnZnJvbUpTJy5cclxuICAgIC8vIElmIGlzIGEgbW9kZWwsIGV4dHJhY3QgdGhlaXIgcHJvcGVydGllcyBhbmQgZmllbGRzIGZyb21cclxuICAgIC8vIHRoZSBvYnNlcnZhYmxlcyAoZnJvbUpTKSwgc28gd2Ugbm90IGdldCBjb21wdXRlZFxyXG4gICAgLy8gb3IgZnVuY3Rpb25zLCBqdXN0IHJlZ2lzdGVyZWQgcHJvcGVydGllcyBhbmQgZmllbGRzXHJcbiAgICBpZiAoZGF0YSAmJiBkYXRhLm1vZGVsIGluc3RhbmNlb2YgTW9kZWwpIHtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgcGxhaW4gPSB7fTtcclxuXHJcbiAgICAgICAgZGF0YS5tb2RlbC5wcm9wZXJ0aWVzTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgIC8vIFByb3BlcnRpZXMgYXJlIG9ic2VydmFibGVzLCBzbyBmdW5jdGlvbnMgd2l0aG91dCBwYXJhbXM6XHJcbiAgICAgICAgICAgIHBsYWluW3Byb3BlcnR5XSA9IGRhdGFbcHJvcGVydHldKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZGF0YS5tb2RlbC5maWVsZHNMaXN0LmZvckVhY2goZnVuY3Rpb24oZmllbGQpIHtcclxuICAgICAgICAgICAgLy8gRmllbGRzIGFyZSBqdXN0IHBsYWluIG9iamVjdCBtZW1iZXJzIGZvciB2YWx1ZXMsIGp1c3QgY29weTpcclxuICAgICAgICAgICAgcGxhaW5bZmllbGRdID0gZGF0YVtmaWVsZF07XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGRhdGEgPSBwbGFpbjtcclxuICAgIH1cclxuXHJcbiAgICBrby5tYXBwaW5nLmZyb21KUyhkYXRhLCB0aGlzLm1hcHBpbmdPcHRpb25zLCB0aGlzLm1vZGVsT2JqZWN0KTtcclxufTtcclxuIiwiLyoqIFBlcmZvcm1hbmNlU3VtbWFyeSBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpLFxyXG4gICAgTGlzdFZpZXdJdGVtID0gcmVxdWlyZSgnLi9MaXN0Vmlld0l0ZW0nKSxcclxuICAgIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpLFxyXG4gICAgbnVtZXJhbCA9IHJlcXVpcmUoJ251bWVyYWwnKTtcclxuXHJcbmZ1bmN0aW9uIFBlcmZvcm1hbmNlU3VtbWFyeSh2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuXHJcbiAgICB2YWx1ZXMgPSB2YWx1ZXMgfHwge307XHJcblxyXG4gICAgdGhpcy5lYXJuaW5ncyA9IG5ldyBFYXJuaW5ncyh2YWx1ZXMuZWFybmluZ3MpO1xyXG4gICAgXHJcbiAgICB2YXIgZWFybmluZ3NMaW5lID0gbmV3IExpc3RWaWV3SXRlbSgpO1xyXG4gICAgZWFybmluZ3NMaW5lLm1hcmtlckxpbmUxID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIG51bSA9IG51bWVyYWwodGhpcy5jdXJyZW50QW1vdW50KCkpLmZvcm1hdCgnJDAsMCcpO1xyXG4gICAgICAgIHJldHVybiBudW07XHJcbiAgICB9LCB0aGlzLmVhcm5pbmdzKTtcclxuICAgIGVhcm5pbmdzTGluZS5jb250ZW50TGluZTEgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50Q29uY2VwdCgpO1xyXG4gICAgfSwgdGhpcy5lYXJuaW5ncyk7XHJcbiAgICBlYXJuaW5nc0xpbmUubWFya2VyTGluZTIgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgbnVtID0gbnVtZXJhbCh0aGlzLm5leHRBbW91bnQoKSkuZm9ybWF0KCckMCwwJyk7XHJcbiAgICAgICAgcmV0dXJuIG51bTtcclxuICAgIH0sIHRoaXMuZWFybmluZ3MpO1xyXG4gICAgZWFybmluZ3NMaW5lLmNvbnRlbnRMaW5lMiA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5leHRDb25jZXB0KCk7XHJcbiAgICB9LCB0aGlzLmVhcm5pbmdzKTtcclxuICAgIFxyXG5cclxuICAgIHRoaXMudGltZUJvb2tlZCA9IG5ldyBUaW1lQm9va2VkKHZhbHVlcy50aW1lQm9va2VkKTtcclxuXHJcbiAgICB2YXIgdGltZUJvb2tlZExpbmUgPSBuZXcgTGlzdFZpZXdJdGVtKCk7XHJcbiAgICB0aW1lQm9va2VkTGluZS5tYXJrZXJMaW5lMSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBudW0gPSBudW1lcmFsKHRoaXMucGVyY2VudCgpKS5mb3JtYXQoJzAlJyk7XHJcbiAgICAgICAgcmV0dXJuIG51bTtcclxuICAgIH0sIHRoaXMudGltZUJvb2tlZCk7XHJcbiAgICB0aW1lQm9va2VkTGluZS5jb250ZW50TGluZTEgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb25jZXB0KCk7XHJcbiAgICB9LCB0aGlzLnRpbWVCb29rZWQpO1xyXG4gICAgXHJcbiAgICBcclxuICAgIHRoaXMuaXRlbXMgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGl0ZW1zID0gW107XHJcbiAgICAgICAgXHJcbiAgICAgICAgaXRlbXMucHVzaChlYXJuaW5nc0xpbmUpO1xyXG4gICAgICAgIGl0ZW1zLnB1c2godGltZUJvb2tlZExpbmUpO1xyXG5cclxuICAgICAgICByZXR1cm4gaXRlbXM7XHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQZXJmb3JtYW5jZVN1bW1hcnk7XHJcblxyXG5mdW5jdGlvbiBFYXJuaW5ncyh2YWx1ZXMpIHtcclxuXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgIFxyXG4gICAgICAgICBjdXJyZW50QW1vdW50OiAwLFxyXG4gICAgICAgICBjdXJyZW50Q29uY2VwdFRlbXBsYXRlOiAnYWxyZWFkeSBwYWlkIHRoaXMgbW9udGgnLFxyXG4gICAgICAgICBuZXh0QW1vdW50OiAwLFxyXG4gICAgICAgICBuZXh0Q29uY2VwdFRlbXBsYXRlOiAncHJvamVjdGVkIHttb250aH0gZWFybmluZ3MnXHJcblxyXG4gICAgfSwgdmFsdWVzKTtcclxuICAgIFxyXG4gICAgdGhpcy5jdXJyZW50Q29uY2VwdCA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIG1vbnRoID0gbW9tZW50KCkuZm9ybWF0KCdNTU1NJyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudENvbmNlcHRUZW1wbGF0ZSgpLnJlcGxhY2UoL1xce21vbnRoXFx9LywgbW9udGgpO1xyXG5cclxuICAgIH0sIHRoaXMpO1xyXG5cclxuICAgIHRoaXMubmV4dENvbmNlcHQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHZhciBtb250aCA9IG1vbWVudCgpLmFkZCgxLCAnbW9udGgnKS5mb3JtYXQoJ01NTU0nKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5uZXh0Q29uY2VwdFRlbXBsYXRlKCkucmVwbGFjZSgvXFx7bW9udGhcXH0vLCBtb250aCk7XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFRpbWVCb29rZWQodmFsdWVzKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcbiAgICBcclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICBcclxuICAgICAgICBwZXJjZW50OiAwLFxyXG4gICAgICAgIGNvbmNlcHRUZW1wbGF0ZTogJ29mIGF2YWlsYWJsZSB0aW1lIGJvb2tlZCBpbiB7bW9udGh9J1xyXG4gICAgXHJcbiAgICB9LCB2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLmNvbmNlcHQgPSBrby5wdXJlQ29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHZhciBtb250aCA9IG1vbWVudCgpLmFkZCgxLCAnbW9udGgnKS5mb3JtYXQoJ01NTU0nKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb25jZXB0VGVtcGxhdGUoKS5yZXBsYWNlKC9cXHttb250aFxcfS8sIG1vbnRoKTtcclxuXHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG4iLCIvKiogUG9zaXRpb24gbW9kZWwuXHJcbiAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gUG9zaXRpb24odmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMubW9kZWwuZGVmUHJvcGVydGllcyh7XHJcbiAgICAgICAgcG9zaXRpb25JRDogMCxcclxuICAgICAgICBwb3NpdGlvblNpbmd1bGFyOiAnJyxcclxuICAgICAgICBwb3NpdGlvblBsdXJhbDogJycsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICcnLFxyXG4gICAgICAgIGFjdGl2ZTogdHJ1ZVxyXG5cclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUG9zaXRpb247XHJcbiIsIi8qKiBTZXJ2aWNlIG1vZGVsICoqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuL01vZGVsJyk7XHJcblxyXG5mdW5jdGlvbiBTZXJ2aWNlKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgIHByaWNlOiAwLFxyXG4gICAgICAgIGR1cmF0aW9uOiAwLCAvLyBpbiBtaW51dGVzXHJcbiAgICAgICAgaXNBZGRvbjogZmFsc2VcclxuICAgIH0sIHZhbHVlcyk7XHJcbiAgICBcclxuICAgIHRoaXMuZHVyYXRpb25UZXh0ID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIG1pbnV0ZXMgPSB0aGlzLmR1cmF0aW9uKCkgfHwgMDtcclxuICAgICAgICAvLyBUT0RPOiBGb3JtYXR0aW5nLCBsb2NhbGl6YXRpb25cclxuICAgICAgICByZXR1cm4gbWludXRlcyA/IG1pbnV0ZXMgKyAnIG1pbnV0ZXMnIDogJyc7XHJcbiAgICB9LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZXJ2aWNlO1xyXG4iLCIvKiogVXBjb21pbmdCb29raW5nc1N1bW1hcnkgbW9kZWwgKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4vTW9kZWwnKSxcclxuICAgIEJvb2tpbmdTdW1tYXJ5ID0gcmVxdWlyZSgnLi9Cb29raW5nU3VtbWFyeScpO1xyXG5cclxuZnVuY3Rpb24gVXBjb21pbmdCb29raW5nc1N1bW1hcnkoKSB7XHJcblxyXG4gICAgTW9kZWwodGhpcyk7XHJcblxyXG4gICAgdGhpcy50b2RheSA9IG5ldyBCb29raW5nU3VtbWFyeSh7XHJcbiAgICAgICAgY29uY2VwdDogJ2xlZnQgdG9kYXknLFxyXG4gICAgICAgIHRpbWVGb3JtYXQ6ICcgW2VuZGluZyBAXSBoOm1tYSdcclxuICAgIH0pO1xyXG4gICAgdGhpcy50b21vcnJvdyA9IG5ldyBCb29raW5nU3VtbWFyeSh7XHJcbiAgICAgICAgY29uY2VwdDogJ3RvbW9ycm93JyxcclxuICAgICAgICB0aW1lRm9ybWF0OiAnIFtzdGFydGluZyBAXSBoOm1tYSdcclxuICAgIH0pO1xyXG4gICAgdGhpcy5uZXh0V2VlayA9IG5ldyBCb29raW5nU3VtbWFyeSh7XHJcbiAgICAgICAgY29uY2VwdDogJ25leHQgd2VlaydcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB0aGlzLml0ZW1zID0ga28ucHVyZUNvbXB1dGVkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBpdGVtcyA9IFtdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vaWYgKHRoaXMudG9kYXkucXVhbnRpdHkoKSlcclxuICAgICAgICBpdGVtcy5wdXNoKHRoaXMudG9kYXkpO1xyXG4gICAgICAgIC8vaWYgKHRoaXMudG9tb3Jyb3cucXVhbnRpdHkoKSlcclxuICAgICAgICBpdGVtcy5wdXNoKHRoaXMudG9tb3Jyb3cpO1xyXG4gICAgICAgIC8vaWYgKHRoaXMubmV4dFdlZWsucXVhbnRpdHkoKSlcclxuICAgICAgICBpdGVtcy5wdXNoKHRoaXMubmV4dFdlZWspO1xyXG5cclxuICAgICAgICByZXR1cm4gaXRlbXM7XHJcbiAgICB9LCB0aGlzKTtcclxuICAgIFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFVwY29taW5nQm9va2luZ3NTdW1tYXJ5O1xyXG4iLCIvKiogVXNlciBtb2RlbCAqKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIGtvID0gcmVxdWlyZSgna25vY2tvdXQnKSxcclxuICAgIE1vZGVsID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xyXG5cclxuLy8gRW51bSBVc2VyVHlwZVxyXG52YXIgVXNlclR5cGUgPSB7XHJcbiAgICBOb25lOiAwLFxyXG4gICAgQW5vbnltb3VzOiAxLFxyXG4gICAgQ3VzdG9tZXI6IDIsXHJcbiAgICBQcm92aWRlcjogNCxcclxuICAgIEFkbWluOiA4LFxyXG4gICAgTG9nZ2VkVXNlcjogMTQsXHJcbiAgICBVc2VyOiAxNSxcclxuICAgIFN5c3RlbTogMTZcclxufTtcclxuXHJcbmZ1bmN0aW9uIFVzZXIodmFsdWVzKSB7XHJcbiAgICBcclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHVzZXJJRDogMCxcclxuICAgICAgICBlbWFpbDogJycsXHJcbiAgICAgICAgZmlyc3ROYW1lOiAnJyxcclxuICAgICAgICBtaWRkbGVJbjogJycsXHJcbiAgICAgICAgbGFzdE5hbWU6ICcnLFxyXG4gICAgICAgIHNlY29uZExhc3ROYW1lOiAnJyxcclxuICAgICAgICBuaWNrTmFtZTogbnVsbCxcclxuICAgICAgICBwdWJsaWNCaW86IG51bGwsXHJcbiAgICAgICAgZ2VuZGVySUQ6IDAsXHJcbiAgICAgICAgcHJlZmVycmVkTGFuZ3VhZ2VJRDogbnVsbCxcclxuICAgICAgICBwcmVmZXJyZWRDb3VudHJ5SUQ6IG51bGwsXHJcbiAgICAgICAgaXNQcm92aWRlcjogZmFsc2UsXHJcbiAgICAgICAgaXNDdXN0b21lcjogZmFsc2UsXHJcbiAgICAgICAgaXNNZW1iZXI6IGZhbHNlLFxyXG4gICAgICAgIGlzQWRtaW46IGZhbHNlLFxyXG4gICAgICAgIG1vYmlsZVBob25lOiBudWxsLFxyXG4gICAgICAgIGFsdGVybmF0ZVBob25lOiBudWxsLFxyXG4gICAgICAgIHByb3ZpZGVyUHJvZmlsZVVSTDogbnVsbCxcclxuICAgICAgICBwcm92aWRlcldlYnNpdGVVUkw6IG51bGwsXHJcbiAgICAgICAgY3JlYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgdXBkYXRlZERhdGU6IG51bGwsXHJcbiAgICAgICAgbW9kaWZpZWRCeTogbnVsbCxcclxuICAgICAgICBhY3RpdmU6IGZhbHNlLFxyXG4gICAgICAgIGFjY291bnRTdGF0dXNJRDogMCxcclxuICAgICAgICBib29rQ29kZTogbnVsbCxcclxuICAgICAgICBvbmJvYXJkaW5nU3RlcDogbnVsbFxyXG4gICAgfSwgdmFsdWVzKTtcclxuXHJcbiAgICB0aGlzLmZ1bGxOYW1lID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLmZpcnN0TmFtZSgpICsgJyAnICsgdGhpcy5sYXN0TmFtZSgpKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLnVzZXJUeXBlID0ga28ucHVyZUNvbXB1dGVkKHtcclxuICAgICAgICByZWFkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIGMgPSB0aGlzLmlzQ3VzdG9tZXIoKSxcclxuICAgICAgICAgICAgICAgIHAgPSB0aGlzLmlzUHJvdmlkZXIoKSxcclxuICAgICAgICAgICAgICAgIGEgPSB0aGlzLmlzQWRtaW4oKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciB1c2VyVHlwZSA9IDA7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc0Fub255bW91cygpKSB7XHJcbiAgICAgICAgICAgICAgICB1c2VyVHlwZSA9IHVzZXJUeXBlIHwgVXNlclR5cGUuQW5vbnltb3VzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChjKVxyXG4gICAgICAgICAgICAgICAgdXNlclR5cGUgPSB1c2VyVHlwZSB8IFVzZXJUeXBlLkN1c3RvbWVyO1xyXG4gICAgICAgICAgICBpZiAocClcclxuICAgICAgICAgICAgICAgIHVzZXJUeXBlID0gdXNlclR5cGUgfCBVc2VyVHlwZS5Qcm92aWRlcjtcclxuICAgICAgICAgICAgaWYgKGEpXHJcbiAgICAgICAgICAgICAgICB1c2VyVHlwZSA9IHVzZXJUeXBlIHwgVXNlclR5cGUuQWRtaW47XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gdXNlclR5cGU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKiBOT1RFOiBOb3QgcmVxdWlyZSBmb3Igbm93OlxyXG4gICAgICAgIHdyaXRlOiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgfSwqL1xyXG4gICAgICAgIG93bmVyOiB0aGlzXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgdGhpcy5pc0Fub255bW91cyA9IGtvLnB1cmVDb21wdXRlZChmdW5jdGlvbigpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLnVzZXJJRCgpIDwgMTtcclxuICAgIH0sIHRoaXMpO1xyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBJdCBtYXRjaGVzIGEgVXNlclR5cGUgZnJvbSB0aGUgZW51bWVyYXRpb24/XHJcbiAgICAqKi9cclxuICAgIHRoaXMuaXNVc2VyVHlwZSA9IGZ1bmN0aW9uIGlzVXNlclR5cGUodHlwZSkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy51c2VyVHlwZSgpICYgdHlwZSk7XHJcbiAgICB9LmJpbmQodGhpcyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVXNlcjtcclxuXHJcblVzZXIuVXNlclR5cGUgPSBVc2VyVHlwZTtcclxuXHJcbi8qIENyZWF0aW50IGFuIGFub255bW91cyB1c2VyIHdpdGggc29tZSBwcmVzc2V0cyAqL1xyXG5Vc2VyLm5ld0Fub255bW91cyA9IGZ1bmN0aW9uIG5ld0Fub255bW91cygpIHtcclxuICAgIHJldHVybiBuZXcgVXNlcih7XHJcbiAgICAgICAgdXNlcklEOiAwLFxyXG4gICAgICAgIGVtYWlsOiAnJyxcclxuICAgICAgICBmaXJzdE5hbWU6ICcnLFxyXG4gICAgICAgIG9uYm9hcmRpbmdTdGVwOiBudWxsXHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqIENhbGVuZGFyIEFwcG9pbnRtZW50cyB0ZXN0IGRhdGEgKiovXHJcbnZhciBBcHBvaW50bWVudCA9IHJlcXVpcmUoJy4uL21vZGVscy9BcHBvaW50bWVudCcpO1xyXG52YXIgdGVzdExvY2F0aW9ucyA9IHJlcXVpcmUoJy4vbG9jYXRpb25zJykubG9jYXRpb25zO1xyXG52YXIgdGVzdFNlcnZpY2VzID0gcmVxdWlyZSgnLi9zZXJ2aWNlcycpLnNlcnZpY2VzO1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpO1xyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG52YXIgdG9kYXkgPSBtb21lbnQoKSxcclxuICAgIHRvbW9ycm93ID0gbW9tZW50KCkuYWRkKDEsICdkYXlzJyksXHJcbiAgICB0b21vcnJvdzEwID0gdG9tb3Jyb3cuY2xvbmUoKS5ob3VycygxMCkubWludXRlcygwKS5zZWNvbmRzKDApLFxyXG4gICAgdG9tb3Jyb3cxNiA9IHRvbW9ycm93LmNsb25lKCkuaG91cnMoMTYpLm1pbnV0ZXMoMzApLnNlY29uZHMoMCk7XHJcbiAgICBcclxudmFyIHRlc3REYXRhID0gW1xyXG4gICAgbmV3IEFwcG9pbnRtZW50KHtcclxuICAgICAgICBpZDogMSxcclxuICAgICAgICBzdGFydFRpbWU6IHRvbW9ycm93MTAsXHJcbiAgICAgICAgZW5kVGltZTogdG9tb3Jyb3cxNixcclxuICAgICAgICBzdW1tYXJ5OiAnTWFzc2FnZSBUaGVyYXBpc3QgQm9va2luZycsXHJcbiAgICAgICAgLy9wcmljaW5nU3VtbWFyeTogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UgMTIwbSBwbHVzIDIgbW9yZScsXHJcbiAgICAgICAgc2VydmljZXM6IHRlc3RTZXJ2aWNlcyxcclxuICAgICAgICBwdG90YWxQcmljZTogOTUuMCxcclxuICAgICAgICBsb2NhdGlvbjoga28udG9KUyh0ZXN0TG9jYXRpb25zWzBdKSxcclxuICAgICAgICBwcmVOb3Rlc1RvQ2xpZW50OiAnTG9va2luZyBmb3J3YXJkIHRvIHNlZWluZyB0aGUgbmV3IGNvbG9yJyxcclxuICAgICAgICBwcmVOb3Rlc1RvU2VsZjogJ0FzayBoaW0gYWJvdXQgaGlzIG5ldyBjb2xvcicsXHJcbiAgICAgICAgY2xpZW50OiB7XHJcbiAgICAgICAgICAgIGZpcnN0TmFtZTogJ0pvc2h1YScsXHJcbiAgICAgICAgICAgIGxhc3ROYW1lOiAnRGFuaWVsc29uJ1xyXG4gICAgICAgIH1cclxuICAgIH0pLFxyXG4gICAgbmV3IEFwcG9pbnRtZW50KHtcclxuICAgICAgICBpZDogMixcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxMywgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IERhdGUoMjAxNCwgMTEsIDEsIDEzLCA1MCwgMCksXHJcbiAgICAgICAgc3VtbWFyeTogJ01hc3NhZ2UgVGhlcmFwaXN0IEJvb2tpbmcnLFxyXG4gICAgICAgIC8vcHJpY2luZ1N1bW1hcnk6ICdBbm90aGVyIE1hc3NhZ2UgNTBtJyxcclxuICAgICAgICBzZXJ2aWNlczogW3Rlc3RTZXJ2aWNlc1swXV0sXHJcbiAgICAgICAgcHRvdGFsUHJpY2U6IDk1LjAsXHJcbiAgICAgICAgbG9jYXRpb246IGtvLnRvSlModGVzdExvY2F0aW9uc1sxXSksXHJcbiAgICAgICAgcHJlTm90ZXNUb0NsaWVudDogJ1NvbWV0aGluZyBlbHNlJyxcclxuICAgICAgICBwcmVOb3Rlc1RvU2VsZjogJ1JlbWVtYmVyIHRoYXQgdGhpbmcnLFxyXG4gICAgICAgIGNsaWVudDoge1xyXG4gICAgICAgICAgICBmaXJzdE5hbWU6ICdKb3NodWEnLFxyXG4gICAgICAgICAgICBsYXN0TmFtZTogJ0RhbmllbHNvbidcclxuICAgICAgICB9XHJcbiAgICB9KSxcclxuICAgIG5ldyBBcHBvaW50bWVudCh7XHJcbiAgICAgICAgaWQ6IDMsXHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgRGF0ZSgyMDE0LCAxMSwgMSwgMTYsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBEYXRlKDIwMTQsIDExLCAxLCAxOCwgMCwgMCksXHJcbiAgICAgICAgc3VtbWFyeTogJ01hc3NhZ2UgVGhlcmFwaXN0IEJvb2tpbmcnLFxyXG4gICAgICAgIC8vcHJpY2luZ1N1bW1hcnk6ICdUaXNzdWUgTWFzc2FnZSAxMjBtJyxcclxuICAgICAgICBzZXJ2aWNlczogW3Rlc3RTZXJ2aWNlc1sxXV0sXHJcbiAgICAgICAgcHRvdGFsUHJpY2U6IDk1LjAsXHJcbiAgICAgICAgbG9jYXRpb246IGtvLnRvSlModGVzdExvY2F0aW9uc1syXSksXHJcbiAgICAgICAgcHJlTm90ZXNUb0NsaWVudDogJycsXHJcbiAgICAgICAgcHJlTm90ZXNUb1NlbGY6ICdBc2sgaGltIGFib3V0IHRoZSBmb3Jnb3R0ZW4gbm90ZXMnLFxyXG4gICAgICAgIGNsaWVudDoge1xyXG4gICAgICAgICAgICBmaXJzdE5hbWU6ICdKb3NodWEnLFxyXG4gICAgICAgICAgICBsYXN0TmFtZTogJ0RhbmllbHNvbidcclxuICAgICAgICB9XHJcbiAgICB9KSxcclxuXTtcclxuXHJcbmV4cG9ydHMuYXBwb2ludG1lbnRzID0gdGVzdERhdGE7XHJcbiIsIi8qKiBDYWxlbmRhciBTbG90cyB0ZXN0IGRhdGEgKiovXHJcbnZhciBDYWxlbmRhclNsb3QgPSByZXF1aXJlKCcuLi9tb2RlbHMvQ2FsZW5kYXJTbG90Jyk7XHJcblxyXG52YXIgVGltZSA9IHJlcXVpcmUoJy4uL3V0aWxzL1RpbWUnKTtcclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxudmFyIHRvZGF5ID0gbmV3IERhdGUoKSxcclxuICAgIHRvbW9ycm93ID0gbmV3IERhdGUoKTtcclxudG9tb3Jyb3cuc2V0RGF0ZSh0b21vcnJvdy5nZXREYXRlKCkgKyAxKTtcclxuXHJcbnZhciBzdG9kYXkgPSBtb21lbnQodG9kYXkpLmZvcm1hdCgnWVlZWS1NTS1ERCcpLFxyXG4gICAgc3RvbW9ycm93ID0gbW9tZW50KHRvbW9ycm93KS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcclxuXHJcbnZhciB0ZXN0RGF0YTEgPSBbXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAwLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b2RheSwgMTIsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFjYWxlbmRhci9uZXcnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXN1Y2Nlc3MnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9kYXksIDEyLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b2RheSwgMTMsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdKb3NoIERhbmllbHNvbicsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBsaW5rOiAnIyFjYWxlbmRhci9hcHBvaW50bWVudC8zJyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAxMywgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9kYXksIDE1LCAwLCAwKSxcclxuXHJcbiAgICAgICAgc3ViamVjdDogJ0RvIHRoYXQgaW1wb3J0YW50IHRoaW5nJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFjYWxlbmRhci9ldmVudC84JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tbmV3LXdpbmRvdycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogbnVsbFxyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAxNSwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9kYXksIDE2LCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnSWFnbyBMb3JlbnpvJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UgTG9uZyBOYW1lJyxcclxuICAgICAgICBsaW5rOiAnIyFjYWxlbmRhci9hcHBvaW50bWVudC81JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogbnVsbCxcclxuICAgICAgICBhY3Rpb25UZXh0OiAnJDE1OS45MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b2RheSwgMTYsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvZGF5LCAwLCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnRnJlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyMhY2FsZW5kYXIvbmV3JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSlcclxuXTtcclxudmFyIHRlc3REYXRhMiA9IFtcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDAsIDAsIDApLFxyXG4gICAgICAgIGVuZFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCA5LCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnRnJlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyMhY2FsZW5kYXIvbmV3JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCA5LCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTAsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdKYXJlbiBGcmVlbHknLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRGVlcCBUaXNzdWUgTWFzc2FnZSBMb25nIE5hbWUnLFxyXG4gICAgICAgIGxpbms6ICcjIWNhbGVuZGFyL2FwcG9pbnRtZW50LzEnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6ICckNTkuOTAnLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDEwLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTEsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFjYWxlbmRhci9uZXcnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXN1Y2Nlc3MnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDExLCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTIsIDQ1LCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnQ09ORklSTS1TdXNhbiBEZWUnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnRGVlcCBUaXNzdWUgTWFzc2FnZScsXHJcbiAgICAgICAgbGluazogJyMhY2FsZW5kYXIvYXBwb2ludG1lbnQvMicsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogJyQ3MCcsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6ICdMaXN0Vmlldy1pdGVtLS10YWctd2FybmluZydcclxuICAgIH0pLFxyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTIsIDQ1LCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTYsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdGcmVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogbnVsbCxcclxuICAgICAgICBsaW5rOiAnIyFjYWxlbmRhci9uZXcnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXN1Y2Nlc3MnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDE2LCAwLCAwKSxcclxuICAgICAgICBlbmRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMTcsIDE1LCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnU3VzYW4gRGVlJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UnLFxyXG4gICAgICAgIGxpbms6ICcjIWNhbGVuZGFyL2FwcG9pbnRtZW50LzMnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDE3LCAxNSwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDE4LCAzMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0RlbnRpc3QgYXBwb2ludG1lbnQnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgIGxpbms6ICcjIWNhbGVuZGFyL2V2ZW50LzQnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1uZXctd2luZG93JyxcclxuICAgICAgICBhY3Rpb25UZXh0OiBudWxsLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDE4LCAzMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDE5LCAzMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ1N1c2FuIERlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdEZWVwIFRpc3N1ZSBNYXNzYWdlIExvbmcgTmFtZScsXHJcbiAgICAgICAgbGluazogJyMhY2FsZW5kYXIvYXBwb2ludG1lbnQvNScsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246IG51bGwsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogJyQxNTkuOTAnLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KSxcclxuICAgIG5ldyBDYWxlbmRhclNsb3Qoe1xyXG4gICAgICAgIHN0YXJ0VGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDE5LCAzMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDIzLCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnRnJlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyMhY2FsZW5kYXIvbmV3JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2FsZW5kYXJTbG90KHtcclxuICAgICAgICBzdGFydFRpbWU6IG5ldyBUaW1lKHRvbW9ycm93LCAyMywgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDAsIDAsIDApLFxyXG5cclxuICAgICAgICBzdWJqZWN0OiAnSmFyZW4gRnJlZWx5JyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UnLFxyXG4gICAgICAgIGxpbms6ICcjIWNhbGVuZGFyL2FwcG9pbnRtZW50LzYnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6ICckODAnLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KVxyXG5dO1xyXG52YXIgdGVzdERhdGFGcmVlID0gW1xyXG4gICAgbmV3IENhbGVuZGFyU2xvdCh7XHJcbiAgICAgICAgc3RhcnRUaW1lOiBuZXcgVGltZSh0b21vcnJvdywgMCwgMCwgMCksXHJcbiAgICAgICAgZW5kVGltZTogbmV3IFRpbWUodG9tb3Jyb3csIDAsIDAsIDApLFxyXG5cclxuICAgICAgICBzdWJqZWN0OiAnRnJlZScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgbGluazogJyMhY2FsZW5kYXIvbmV3JyxcclxuXHJcbiAgICAgICAgYWN0aW9uSWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24tcGx1cycsXHJcbiAgICAgICAgYWN0aW9uVGV4dDogbnVsbCxcclxuXHJcbiAgICAgICAgY2xhc3NOYW1lczogJ0xpc3RWaWV3LWl0ZW0tLXRhZy1zdWNjZXNzJ1xyXG4gICAgfSlcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IHtcclxuICAgICdkZWZhdWx0JzogdGVzdERhdGFGcmVlXHJcbn07XHJcbnRlc3REYXRhW3N0b2RheV0gPSB0ZXN0RGF0YTE7XHJcbnRlc3REYXRhW3N0b21vcnJvd10gPSB0ZXN0RGF0YTI7XHJcblxyXG5leHBvcnRzLmNhbGVuZGFyID0gdGVzdERhdGE7XHJcbiIsIi8qKiBDbGllbnRzIHRlc3QgZGF0YSAqKi9cclxudmFyIENsaWVudCA9IHJlcXVpcmUoJy4uL21vZGVscy9DbGllbnQnKTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IFtcclxuICAgIG5ldyBDbGllbnQgKHtcclxuICAgICAgICBmaXJzdE5hbWU6ICdKb3NodWEnLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRGFuaWVsc29uJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBmaXJzdE5hbWU6ICdJYWdvJyxcclxuICAgICAgICBsYXN0TmFtZTogJ0xvcmVuem8nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGZpcnN0TmFtZTogJ0Zlcm5hbmRvJyxcclxuICAgICAgICBsYXN0TmFtZTogJ0dhZ28nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FkYW0nLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRmluY2gnXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FsYW4nLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnRmVyZ3Vzb24nXHJcbiAgICB9KSxcclxuICAgIG5ldyBDbGllbnQoe1xyXG4gICAgICAgIGZpcnN0TmFtZTogJ0FsZXgnLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnUGVuYSdcclxuICAgIH0pLFxyXG4gICAgbmV3IENsaWVudCh7XHJcbiAgICAgICAgZmlyc3ROYW1lOiAnQWxleGlzJyxcclxuICAgICAgICBsYXN0TmFtZTogJ1BlYWNhJ1xyXG4gICAgfSksXHJcbiAgICBuZXcgQ2xpZW50KHtcclxuICAgICAgICBmaXJzdE5hbWU6ICdBcnRodXInLFxyXG4gICAgICAgIGxhc3ROYW1lOiAnTWlsbGVyJ1xyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMuY2xpZW50cyA9IHRlc3REYXRhO1xyXG4iLCIvKiogTG9jYXRpb25zIHRlc3QgZGF0YSAqKi9cclxudmFyIExvY2F0aW9uID0gcmVxdWlyZSgnLi4vbW9kZWxzL0xvY2F0aW9uJyk7XHJcblxyXG52YXIgdGVzdERhdGEgPSBbXHJcbiAgICBuZXcgTG9jYXRpb24gKHtcclxuICAgICAgICBsb2NhdGlvbklEOiAxLFxyXG4gICAgICAgIG5hbWU6ICdBY3R2aVNwYWNlJyxcclxuICAgICAgICBhZGRyZXNzTGluZTE6ICczMTUwIDE4dGggU3RyZWV0JyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwMSxcclxuICAgICAgICBpc1NlcnZpY2VSYWRpdXM6IHRydWUsXHJcbiAgICAgICAgc2VydmljZVJhZGl1czogMlxyXG4gICAgfSksXHJcbiAgICBuZXcgTG9jYXRpb24oe1xyXG4gICAgICAgIGxvY2F0aW9uSUQ6IDIsXHJcbiAgICAgICAgbmFtZTogJ0NvcmV5XFwncyBBcHQnLFxyXG4gICAgICAgIGFkZHJlc3NMaW5lMTogJzE4NyBCb2NhbmEgU3QuJyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwMlxyXG4gICAgfSksXHJcbiAgICBuZXcgTG9jYXRpb24oe1xyXG4gICAgICAgIGxvY2F0aW9uSUQ6IDMsXHJcbiAgICAgICAgbmFtZTogJ0pvc2hcXCdhIEFwdCcsXHJcbiAgICAgICAgYWRkcmVzc0xpbmUxOiAnNDI5IENvcmJldHQgQXZlJyxcclxuICAgICAgICBwb3N0YWxDb2RlOiA5MDAwM1xyXG4gICAgfSlcclxuXTtcclxuXHJcbmV4cG9ydHMubG9jYXRpb25zID0gdGVzdERhdGE7XHJcbiIsIi8qKiBJbmJveCB0ZXN0IGRhdGEgKiovXHJcbnZhciBNZXNzYWdlID0gcmVxdWlyZSgnLi4vbW9kZWxzL01lc3NhZ2UnKTtcclxuXHJcbnZhciBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xyXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XHJcblxyXG52YXIgdG9kYXkgPSBuZXcgRGF0ZSgpLFxyXG4gICAgeWVzdGVyZGF5ID0gbmV3IERhdGUoKSxcclxuICAgIGxhc3RXZWVrID0gbmV3IERhdGUoKSxcclxuICAgIG9sZERhdGUgPSBuZXcgRGF0ZSgpO1xyXG55ZXN0ZXJkYXkuc2V0RGF0ZSh5ZXN0ZXJkYXkuZ2V0RGF0ZSgpIC0gMSk7XHJcbmxhc3RXZWVrLnNldERhdGUobGFzdFdlZWsuZ2V0RGF0ZSgpIC0gMik7XHJcbm9sZERhdGUuc2V0RGF0ZShvbGREYXRlLmdldERhdGUoKSAtIDE2KTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IFtcclxuICAgIG5ldyBNZXNzYWdlKHtcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbmV3IFRpbWUodG9kYXksIDExLCAwLCAwKSxcclxuICAgICAgICBcclxuICAgICAgICBzdWJqZWN0OiAnQ09ORklSTS1TdXNhbiBEZWUnLFxyXG4gICAgICAgIGNvbnRlbnQ6ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBsaW5rOiAnI21lc3NhZ2VzL2luYm94LzEnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiBudWxsLFxyXG4gICAgICAgIGFjdGlvblRleHQ6ICckNzAnLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiAnTGlzdFZpZXctaXRlbS0tdGFnLXdhcm5pbmcnXHJcbiAgICB9KSxcclxuICAgIG5ldyBNZXNzYWdlKHtcclxuICAgICAgICBjcmVhdGVkRGF0ZTogbmV3IFRpbWUoeWVzdGVyZGF5LCAxMywgMCwgMCksXHJcblxyXG4gICAgICAgIHN1YmplY3Q6ICdEbyB5b3UgZG8gXCJFeG90aWMgTWFzc2FnZVwiPycsXHJcbiAgICAgICAgY29udGVudDogJ0hpLCBJIHdhbnRlZCB0byBrbm93IGlmIHlvdSBwZXJmb3JtIGFzIHBhciBvZiB5b3VyIHNlcnZpY2VzLi4uJyxcclxuICAgICAgICBsaW5rOiAnI21lc3NhZ2VzL2luYm94LzMnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1zaGFyZS1hbHQnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IE1lc3NhZ2Uoe1xyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBuZXcgVGltZShsYXN0V2VlaywgMTIsIDAsIDApLFxyXG4gICAgICAgIFxyXG4gICAgICAgIHN1YmplY3Q6ICdKb3NoIERhbmllbHNvbicsXHJcbiAgICAgICAgY29udGVudDogJ0RlZXAgVGlzc3VlIE1hc3NhZ2UnLFxyXG4gICAgICAgIGxpbms6ICcjbWVzc2FnZXMvaW5ib3gvMicsXHJcblxyXG4gICAgICAgIGFjdGlvbkljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLXBsdXMnLFxyXG4gICAgICAgIGFjdGlvblRleHQ6IG51bGwsXHJcblxyXG4gICAgICAgIGNsYXNzTmFtZXM6IG51bGxcclxuICAgIH0pLFxyXG4gICAgbmV3IE1lc3NhZ2Uoe1xyXG4gICAgICAgIGNyZWF0ZWREYXRlOiBuZXcgVGltZShvbGREYXRlLCAxNSwgMCwgMCksXHJcbiAgICAgICAgXHJcbiAgICAgICAgc3ViamVjdDogJ0lucXVpcnknLFxyXG4gICAgICAgIGNvbnRlbnQ6ICdBbm90aGVyIHF1ZXN0aW9uIGZyb20gYW5vdGhlciBjbGllbnQuJyxcclxuICAgICAgICBsaW5rOiAnI21lc3NhZ2VzL2luYm94LzQnLFxyXG5cclxuICAgICAgICBhY3Rpb25JY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1zaGFyZS1hbHQnLFxyXG5cclxuICAgICAgICBjbGFzc05hbWVzOiBudWxsXHJcbiAgICB9KVxyXG5dO1xyXG5cclxuZXhwb3J0cy5tZXNzYWdlcyA9IHRlc3REYXRhO1xyXG4iLCIvKiogU2VydmljZXMgdGVzdCBkYXRhICoqL1xyXG52YXIgU2VydmljZSA9IHJlcXVpcmUoJy4uL21vZGVscy9TZXJ2aWNlJyk7XHJcblxyXG52YXIgdGVzdERhdGEgPSBbXHJcbiAgICBuZXcgU2VydmljZSAoe1xyXG4gICAgICAgIG5hbWU6ICdEZWVwIFRpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBwcmljZTogOTUsXHJcbiAgICAgICAgZHVyYXRpb246IDEyMFxyXG4gICAgfSksXHJcbiAgICBuZXcgU2VydmljZSh7XHJcbiAgICAgICAgbmFtZTogJ1Rpc3N1ZSBNYXNzYWdlJyxcclxuICAgICAgICBwcmljZTogNjAsXHJcbiAgICAgICAgZHVyYXRpb246IDYwXHJcbiAgICB9KSxcclxuICAgIG5ldyBTZXJ2aWNlKHtcclxuICAgICAgICBuYW1lOiAnU3BlY2lhbCBvaWxzJyxcclxuICAgICAgICBwcmljZTogOTUsXHJcbiAgICAgICAgaXNBZGRvbjogdHJ1ZVxyXG4gICAgfSksXHJcbiAgICBuZXcgU2VydmljZSh7XHJcbiAgICAgICAgbmFtZTogJ1NvbWUgc2VydmljZSBleHRyYScsXHJcbiAgICAgICAgcHJpY2U6IDQwLFxyXG4gICAgICAgIGR1cmF0aW9uOiAyMCxcclxuICAgICAgICBpc0FkZG9uOiB0cnVlXHJcbiAgICB9KVxyXG5dO1xyXG5cclxuZXhwb3J0cy5zZXJ2aWNlcyA9IHRlc3REYXRhO1xyXG4iLCIvKiogXHJcbiAgICB0aW1lU2xvdHNcclxuICAgIHRlc3RpbmcgZGF0YVxyXG4qKi9cclxuXHJcbnZhciBUaW1lID0gcmVxdWlyZSgnLi4vdXRpbHMvVGltZScpO1xyXG5cclxudmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xyXG5cclxudmFyIHRvZGF5ID0gbmV3IERhdGUoKSxcclxuICAgIHRvbW9ycm93ID0gbmV3IERhdGUoKTtcclxudG9tb3Jyb3cuc2V0RGF0ZSh0b21vcnJvdy5nZXREYXRlKCkgKyAxKTtcclxuXHJcbnZhciBzdG9kYXkgPSBtb21lbnQodG9kYXkpLmZvcm1hdCgnWVlZWS1NTS1ERCcpLFxyXG4gICAgc3RvbW9ycm93ID0gbW9tZW50KHRvbW9ycm93KS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcclxuXHJcbnZhciB0ZXN0RGF0YTEgPSBbXHJcbiAgICBUaW1lKHRvZGF5LCA5LCAxNSksXHJcbiAgICBUaW1lKHRvZGF5LCAxMSwgMzApLFxyXG4gICAgVGltZSh0b2RheSwgMTIsIDApLFxyXG4gICAgVGltZSh0b2RheSwgMTIsIDMwKSxcclxuICAgIFRpbWUodG9kYXksIDE2LCAxNSksXHJcbiAgICBUaW1lKHRvZGF5LCAxOCwgMCksXHJcbiAgICBUaW1lKHRvZGF5LCAxOCwgMzApLFxyXG4gICAgVGltZSh0b2RheSwgMTksIDApLFxyXG4gICAgVGltZSh0b2RheSwgMTksIDMwKSxcclxuICAgIFRpbWUodG9kYXksIDIxLCAzMCksXHJcbiAgICBUaW1lKHRvZGF5LCAyMiwgMClcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YTIgPSBbXHJcbiAgICBUaW1lKHRvbW9ycm93LCA4LCAwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEwLCAzMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMSwgMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxMSwgMzApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTIsIDApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTIsIDMwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEzLCAwKSxcclxuICAgIFRpbWUodG9tb3Jyb3csIDEzLCAzMCksXHJcbiAgICBUaW1lKHRvbW9ycm93LCAxNCwgNDUpLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTYsIDApLFxyXG4gICAgVGltZSh0b21vcnJvdywgMTYsIDMwKVxyXG5dO1xyXG5cclxudmFyIHRlc3REYXRhQnVzeSA9IFtcclxuXTtcclxuXHJcbnZhciB0ZXN0RGF0YSA9IHtcclxuICAgICdkZWZhdWx0JzogdGVzdERhdGFCdXN5XHJcbn07XHJcbnRlc3REYXRhW3N0b2RheV0gPSB0ZXN0RGF0YTE7XHJcbnRlc3REYXRhW3N0b21vcnJvd10gPSB0ZXN0RGF0YTI7XHJcblxyXG5leHBvcnRzLnRpbWVTbG90cyA9IHRlc3REYXRhO1xyXG4iLCIvKipcclxuICAgIE5ldyBGdW5jdGlvbiBtZXRob2Q6ICdfZGVsYXllZCcuXHJcbiAgICBJdCByZXR1cm5zIGEgbmV3IGZ1bmN0aW9uLCB3cmFwcGluZyB0aGUgb3JpZ2luYWwgb25lLFxyXG4gICAgdGhhdCBvbmNlIGl0cyBjYWxsIHdpbGwgZGVsYXkgdGhlIGV4ZWN1dGlvbiB0aGUgZ2l2ZW4gbWlsbGlzZWNvbmRzLFxyXG4gICAgdXNpbmcgYSBzZXRUaW1lb3V0LlxyXG4gICAgVGhlIG5ldyBmdW5jdGlvbiByZXR1cm5zICd1bmRlZmluZWQnIHNpbmNlIGl0IGhhcyBub3QgdGhlIHJlc3VsdCxcclxuICAgIGJlY2F1c2Ugb2YgdGhhdCBpcyBvbmx5IHN1aXRhYmxlIHdpdGggcmV0dXJuLWZyZWUgZnVuY3Rpb25zIFxyXG4gICAgbGlrZSBldmVudCBoYW5kbGVycy5cclxuICAgIFxyXG4gICAgV2h5OiBzb21ldGltZXMsIHRoZSBoYW5kbGVyIGZvciBhbiBldmVudCBuZWVkcyB0byBiZSBleGVjdXRlZFxyXG4gICAgYWZ0ZXIgYSBkZWxheSBpbnN0ZWFkIG9mIGluc3RhbnRseS5cclxuKiovXHJcbkZ1bmN0aW9uLnByb3RvdHlwZS5fZGVsYXllZCA9IGZ1bmN0aW9uIGRlbGF5ZWQobWlsbGlzZWNvbmRzKSB7XHJcbiAgICB2YXIgZm4gPSB0aGlzO1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBjb250ZXh0ID0gdGhpcyxcclxuICAgICAgICAgICAgYXJncyA9IGFyZ3VtZW50cztcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZm4uYXBwbHkoY29udGV4dCwgYXJncyk7XHJcbiAgICAgICAgfSwgbWlsbGlzZWNvbmRzKTtcclxuICAgIH07XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgRXh0ZW5kaW5nIHRoZSBGdW5jdGlvbiBjbGFzcyB3aXRoIGFuIGluaGVyaXRzIG1ldGhvZC5cclxuICAgIFxyXG4gICAgVGhlIGluaXRpYWwgbG93IGRhc2ggaXMgdG8gbWFyayBpdCBhcyBuby1zdGFuZGFyZC5cclxuKiovXHJcbkZ1bmN0aW9uLnByb3RvdHlwZS5faW5oZXJpdHMgPSBmdW5jdGlvbiBfaW5oZXJpdHMoc3VwZXJDdG9yKSB7XHJcbiAgICB0aGlzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yOiB7XHJcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLFxyXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXHJcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKipcclxuICAgIFJFU1QgQVBJIGFjY2Vzc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZnVuY3Rpb24gbG93ZXJGaXJzdExldHRlcihuKSB7XHJcbiAgICByZXR1cm4gbiAmJiBuWzBdICYmIG5bMF0udG9Mb3dlckNhc2UgJiYgKG5bMF0udG9Mb3dlckNhc2UoKSArIG4uc2xpY2UoMSkpIHx8IG47XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGxvd2VyQ2FtZWxpemVPYmplY3Qob2JqKSB7XHJcbiAgICAvL2pzaGludCBtYXhjb21wbGV4aXR5OjhcclxuICAgIFxyXG4gICAgaWYgKCFvYmogfHwgdHlwZW9mKG9iaikgIT09ICdvYmplY3QnKSByZXR1cm4gb2JqO1xyXG5cclxuICAgIHZhciByZXQgPSBBcnJheS5pc0FycmF5KG9iaikgPyBbXSA6IHt9O1xyXG4gICAgZm9yKHZhciBrIGluIG9iaikge1xyXG4gICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoaykpIHtcclxuICAgICAgICAgICAgdmFyIG5ld2sgPSBsb3dlckZpcnN0TGV0dGVyKGspO1xyXG4gICAgICAgICAgICByZXRbbmV3a10gPSB0eXBlb2Yob2JqW2tdKSA9PT0gJ29iamVjdCcgP1xyXG4gICAgICAgICAgICAgICAgbG93ZXJDYW1lbGl6ZU9iamVjdChvYmpba10pIDpcclxuICAgICAgICAgICAgICAgIG9ialtrXVxyXG4gICAgICAgICAgICA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJldDtcclxufVxyXG5cclxuZnVuY3Rpb24gUmVzdChvcHRpb25zT3JVcmwpIHtcclxuICAgIFxyXG4gICAgdmFyIHVybCA9IHR5cGVvZihvcHRpb25zT3JVcmwpID09PSAnc3RyaW5nJyA/XHJcbiAgICAgICAgb3B0aW9uc09yVXJsIDpcclxuICAgICAgICBvcHRpb25zT3JVcmwgJiYgb3B0aW9uc09yVXJsLnVybDtcclxuXHJcbiAgICB0aGlzLmJhc2VVcmwgPSB1cmw7XHJcbiAgICAvLyBPcHRpb25hbCBleHRyYUhlYWRlcnMgZm9yIGFsbCByZXF1ZXN0cyxcclxuICAgIC8vIHVzdWFsbHkgZm9yIGF1dGhlbnRpY2F0aW9uIHRva2Vuc1xyXG4gICAgdGhpcy5leHRyYUhlYWRlcnMgPSBudWxsO1xyXG59XHJcblxyXG5SZXN0LnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiBnZXQoYXBpVXJsLCBkYXRhKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KGFwaVVybCwgJ2dldCcsIGRhdGEpO1xyXG59O1xyXG5cclxuUmVzdC5wcm90b3R5cGUucHV0ID0gZnVuY3Rpb24gZ2V0KGFwaVVybCwgZGF0YSkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChhcGlVcmwsICdwdXQnLCBkYXRhKTtcclxufTtcclxuXHJcblJlc3QucHJvdG90eXBlLnBvc3QgPSBmdW5jdGlvbiBnZXQoYXBpVXJsLCBkYXRhKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KGFwaVVybCwgJ3Bvc3QnLCBkYXRhKTtcclxufTtcclxuXHJcblJlc3QucHJvdG90eXBlLmRlbGV0ZSA9IGZ1bmN0aW9uIGdldChhcGlVcmwsIGRhdGEpIHtcclxuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoYXBpVXJsLCAnZGVsZXRlJywgZGF0YSk7XHJcbn07XHJcblxyXG5SZXN0LnByb3RvdHlwZS5wdXRGaWxlID0gZnVuY3Rpb24gcHV0RmlsZShhcGlVcmwsIGRhdGEpIHtcclxuICAgIC8vIE5PVEUgYmFzaWMgcHV0RmlsZSBpbXBsZW1lbnRhdGlvbiwgb25lIGZpbGUsIHVzZSBmaWxlVXBsb2FkP1xyXG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChhcGlVcmwsICdkZWxldGUnLCBkYXRhLCAnbXVsdGlwYXJ0L2Zvcm0tZGF0YScpO1xyXG59O1xyXG5cclxuUmVzdC5wcm90b3R5cGUucmVxdWVzdCA9IGZ1bmN0aW9uIHJlcXVlc3QoYXBpVXJsLCBodHRwTWV0aG9kLCBkYXRhLCBjb250ZW50VHlwZSkge1xyXG4gICAgXHJcbiAgICB2YXIgdGhpc1Jlc3QgPSB0aGlzO1xyXG4gICAgXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCQuYWpheCh7XHJcbiAgICAgICAgdXJsOiB0aGlzLmJhc2VVcmwgKyBhcGlVcmwsXHJcbiAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuICAgICAgICBtZXRob2Q6IGh0dHBNZXRob2QsXHJcbiAgICAgICAgaGVhZGVyczogdGhpcy5leHRyYUhlYWRlcnMsXHJcbiAgICAgICAgLy8gVVJMRU5DT0RFRCBpbnB1dDpcclxuICAgICAgICAvLyBDb252ZXJ0IHRvIEpTT04gYW5kIGJhY2sganVzdCB0byBlbnN1cmUgdGhlIHZhbHVlcyBhcmUgY29udmVydGVkL2VuY29kZWRcclxuICAgICAgICAvLyBwcm9wZXJseSB0byBiZSBzZW50LCBsaWtlIERhdGVzIGJlaW5nIGNvbnZlcnRlZCB0byBJU08gZm9ybWF0LlxyXG4gICAgICAgIGRhdGE6IGRhdGEgJiYgSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkYXRhKSksXHJcbiAgICAgICAgY29udGVudFR5cGU6IGNvbnRlbnRUeXBlIHx8ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnXHJcbiAgICAgICAgLy8gQWx0ZXJuYXRlOiBKU09OIGFzIGlucHV0XHJcbiAgICAgICAgLy9kYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKSxcclxuICAgICAgICAvL2NvbnRlbnRUeXBlOiBjb250ZW50VHlwZSB8fCAnYXBwbGljYXRpb24vanNvbidcclxuICAgIH0pKVxyXG4gICAgLnRoZW4obG93ZXJDYW1lbGl6ZU9iamVjdClcclxuICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAvLyBPbiBhdXRob3JpemF0aW9uIGVycm9yLCBnaXZlIG9wb3J0dW5pdHkgdG8gcmV0cnkgdGhlIG9wZXJhdGlvblxyXG4gICAgICAgIGlmIChlcnIuc3RhdHVzID09PSA0MDEpIHtcclxuICAgICAgICAgICAgdmFyIHJldHJ5ID0gcmVxdWVzdC5iaW5kKHRoaXMsIGFwaVVybCwgaHR0cE1ldGhvZCwgZGF0YSwgY29udGVudFR5cGUpO1xyXG4gICAgICAgICAgICB2YXIgcmV0cnlQcm9taXNlID0gdGhpc1Jlc3Qub25BdXRob3JpemF0aW9uUmVxdWlyZWQocmV0cnkpO1xyXG4gICAgICAgICAgICBpZiAocmV0cnlQcm9taXNlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJdCByZXR1cm5lZCBzb21ldGhpbmcsIGV4cGVjdGluZyBpcyBhIHByb21pc2U6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJldHJ5UHJvbWlzZSlcclxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZXJlIGlzIGVycm9yIG9uIHJldHJ5LCBqdXN0IHJldHVybiB0aGVcclxuICAgICAgICAgICAgICAgICAgICAvLyBvcmlnaW5hbCBjYWxsIGVycm9yXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVycjtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGJ5IGRlZmF1bHQsIGNvbnRpbnVlIHByb3BhZ2F0aW5nIHRoZSBlcnJvclxyXG4gICAgICAgIHJldHVybiBlcnI7XHJcbiAgICB9KTtcclxufTtcclxuXHJcblJlc3QucHJvdG90eXBlLm9uQXV0aG9yaXphdGlvblJlcXVpcmVkID0gZnVuY3Rpb24gb25BdXRob3JpemF0aW9uUmVxdWlyZWQocmV0cnkpIHtcclxuICAgIC8vIFRvIGJlIGltcGxlbWVudGVkIG91dHNpZGUsIGJ5IGRlZmF1bHQgZG9uJ3Qgd2FpdFxyXG4gICAgLy8gZm9yIHJldHJ5LCBqdXN0IHJldHVybiBub3RoaW5nOlxyXG4gICAgcmV0dXJuO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZXN0O1xyXG4iLCIvKipcclxuICAgIFRpbWUgY2xhc3MgdXRpbGl0eS5cclxuICAgIFNob3J0ZXIgd2F5IHRvIGNyZWF0ZSBhIERhdGUgaW5zdGFuY2VcclxuICAgIHNwZWNpZnlpbmcgb25seSB0aGUgVGltZSBwYXJ0LFxyXG4gICAgZGVmYXVsdGluZyB0byBjdXJyZW50IGRhdGUgb3IgXHJcbiAgICBhbm90aGVyIHJlYWR5IGRhdGUgaW5zdGFuY2UuXHJcbioqL1xyXG5mdW5jdGlvbiBUaW1lKGRhdGUsIGhvdXIsIG1pbnV0ZSwgc2Vjb25kKSB7XHJcbiAgICBpZiAoIShkYXRlIGluc3RhbmNlb2YgRGF0ZSkpIHtcclxuIFxyXG4gICAgICAgIHNlY29uZCA9IG1pbnV0ZTtcclxuICAgICAgICBtaW51dGUgPSBob3VyO1xyXG4gICAgICAgIGhvdXIgPSBkYXRlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGRhdGUgPSBuZXcgRGF0ZSgpOyAgIFxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgRGF0ZShkYXRlLmdldEZ1bGxZZWFyKCksIGRhdGUuZ2V0TW9udGgoKSwgZGF0ZS5nZXREYXRlKCksIGhvdXIgfHwgMCwgbWludXRlIHx8IDAsIHNlY29uZCB8fCAwKTtcclxufVxyXG5tb2R1bGUuZXhwb3J0cyA9IFRpbWU7XHJcbiIsIi8qKlxyXG4gICAgQ3JlYXRlIGFuIEFjY2VzcyBDb250cm9sIGZvciBhbiBhcHAgdGhhdCBqdXN0IGNoZWNrc1xyXG4gICAgdGhlIGFjdGl2aXR5IHByb3BlcnR5IGZvciBhbGxvd2VkIHVzZXIgbGV2ZWwuXHJcbiAgICBUbyBiZSBwcm92aWRlZCB0byBTaGVsbC5qcyBhbmQgdXNlZCBieSB0aGUgYXBwLmpzLFxyXG4gICAgdmVyeSB0aWVkIHRvIHRoYXQgYm90aCBjbGFzc2VzLlxyXG4gICAgXHJcbiAgICBBY3Rpdml0aWVzIGNhbiBkZWZpbmUgb24gaXRzIG9iamVjdCBhbiBhY2Nlc3NMZXZlbFxyXG4gICAgcHJvcGVydHkgbGlrZSBuZXh0IGV4YW1wbGVzXHJcbiAgICBcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlcnR5cGUuVXNlcjsgLy8gYW55b25lXHJcbiAgICB0aGlzLmFjY2Vzc0xldmVsID0gYXBwLlVzZXJUeXBlLkFub255bW91czsgLy8gYW5vbnltb3VzIHVzZXJzIG9ubHlcclxuICAgIHRoaXMuYWNjZXNzTGV2ZWwgPSBhcHAuVXNlclR5cGUuTG9nZ2VkVXNlcjsgLy8gYXV0aGVudGljYXRlZCB1c2VycyBvbmx5XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vLyBVc2VyVHlwZSBlbnVtZXJhdGlvbiBpcyBiaXQgYmFzZWQsIHNvIHNldmVyYWxcclxuLy8gdXNlcnMgY2FuIGhhcyBhY2Nlc3MgaW4gYSBzaW5nbGUgcHJvcGVydHlcclxudmFyIFVzZXJUeXBlID0gcmVxdWlyZSgnLi4vbW9kZWxzL1VzZXInKS5Vc2VyVHlwZTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlQWNjZXNzQ29udHJvbChhcHApIHtcclxuICAgIFxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGFjY2Vzc0NvbnRyb2wocm91dGUpIHtcclxuXHJcbiAgICAgICAgdmFyIGFjdGl2aXR5ID0gYXBwLmdldEFjdGl2aXR5Q29udHJvbGxlckJ5Um91dGUocm91dGUpO1xyXG5cclxuICAgICAgICB2YXIgdXNlciA9IGFwcC5tb2RlbC51c2VyKCk7XHJcbiAgICAgICAgdmFyIGN1cnJlbnRUeXBlID0gdXNlciAmJiB1c2VyLnVzZXJUeXBlKCk7XHJcblxyXG4gICAgICAgIGlmIChhY3Rpdml0eSAmJiBhY3Rpdml0eS5hY2Nlc3NMZXZlbCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGNhbiA9IGFjdGl2aXR5LmFjY2Vzc0xldmVsICYgY3VycmVudFR5cGU7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoIWNhbikge1xyXG4gICAgICAgICAgICAgICAgLy8gTm90aWZ5IGVycm9yLCB3aHkgY2Fubm90IGFjY2Vzc1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZExldmVsOiBhY3Rpdml0eS5hY2Nlc3NMZXZlbCxcclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50VHlwZTogY3VycmVudFR5cGVcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEFsbG93XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9O1xyXG59O1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgdW53cmFwID0gZnVuY3Rpb24gdW53cmFwKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gKHR5cGVvZih2YWx1ZSkgPT09ICdmdW5jdGlvbicgPyB2YWx1ZSgpIDogdmFsdWUpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5kZWZpbmVDcnVkQXBpRm9yUmVzdCA9IGZ1bmN0aW9uIGRlZmluZUNydWRBcGlGb3JSZXN0KHNldHRpbmdzKSB7XHJcbiAgICBcclxuICAgIHZhciBleHRlbmRlZE9iamVjdCA9IHNldHRpbmdzLmV4dGVuZGVkT2JqZWN0LFxyXG4gICAgICAgIE1vZGVsID0gc2V0dGluZ3MuTW9kZWwsXHJcbiAgICAgICAgbW9kZWxOYW1lID0gc2V0dGluZ3MubW9kZWxOYW1lLFxyXG4gICAgICAgIG1vZGVsTGlzdE5hbWUgPSBzZXR0aW5ncy5tb2RlbExpc3ROYW1lLFxyXG4gICAgICAgIG1vZGVsVXJsID0gc2V0dGluZ3MubW9kZWxVcmwsXHJcbiAgICAgICAgaWRQcm9wZXJ0eU5hbWUgPSBzZXR0aW5ncy5pZFByb3BlcnR5TmFtZTtcclxuXHJcbiAgICBleHRlbmRlZE9iamVjdFsnZ2V0JyArIG1vZGVsTGlzdE5hbWVdID0gZnVuY3Rpb24gZ2V0TGlzdChmaWx0ZXJzKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5nZXQobW9kZWxVcmwsIGZpbHRlcnMpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmF3SXRlbXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJhd0l0ZW1zICYmIHJhd0l0ZW1zLm1hcChmdW5jdGlvbihyYXdJdGVtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE1vZGVsKHJhd0l0ZW0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIGV4dGVuZGVkT2JqZWN0WydnZXQnICsgbW9kZWxOYW1lXSA9IGZ1bmN0aW9uIGdldEl0ZW0oaXRlbUlEKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5nZXQobW9kZWxVcmwgKyAnLycgKyBpdGVtSUQpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmF3SXRlbSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIHJhd0l0ZW0gJiYgbmV3IE1vZGVsKHJhd0l0ZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBleHRlbmRlZE9iamVjdFsncG9zdCcgKyBtb2RlbE5hbWVdID0gZnVuY3Rpb24gcG9zdEl0ZW0oYW5JdGVtKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5wb3N0KG1vZGVsVXJsLCBhbkl0ZW0pLnRoZW4oZnVuY3Rpb24oYW5JdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgTW9kZWwoYW5JdGVtKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgZXh0ZW5kZWRPYmplY3RbJ3B1dCcgKyBtb2RlbE5hbWVdID0gZnVuY3Rpb24gcHV0SXRlbShhbkl0ZW0pIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZXN0LnB1dChtb2RlbFVybCArICcvJyArIHVud3JhcChhbkl0ZW1baWRQcm9wZXJ0eU5hbWVdKSwgYW5JdGVtKTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIGV4dGVuZGVkT2JqZWN0WydzZXQnICsgbW9kZWxOYW1lXSA9IGZ1bmN0aW9uIHNldEl0ZW0oYW5JdGVtKSB7XHJcbiAgICAgICAgdmFyIGlkID0gdW53cmFwKGFuSXRlbVtpZFByb3BlcnR5TmFtZV0pO1xyXG4gICAgICAgIGlmIChpZClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbJ3B1dCcgKyBtb2RlbE5hbWVdKGFuSXRlbSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1sncG9zdCcgKyBtb2RlbE5hbWVdKGFuSXRlbSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGV4dGVuZGVkT2JqZWN0WydkZWwnICsgbW9kZWxOYW1lXSA9IGZ1bmN0aW9uIGRlbEl0ZW0oYW5JdGVtKSB7XHJcbiAgICAgICAgdmFyIGlkID0gYW5JdGVtICYmIHVud3JhcChhbkl0ZW1baWRQcm9wZXJ0eU5hbWVdKSB8fFxyXG4gICAgICAgICAgICAgICAgYW5JdGVtO1xyXG4gICAgICAgIGlmIChpZClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVzdC5kZWxldGUobW9kZWxVcmwgKyAnLycgKyBpZCwgYW5JdGVtKVxyXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihkZWxldGVkSXRlbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlbGV0ZWRJdGVtICYmIG5ldyBNb2RlbChkZWxldGVkSXRlbSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOZWVkIGFuIElEIG9yIGFuIG9iamVjdCB3aXRoIHRoZSBJRCBwcm9wZXJ0eSB0byBkZWxldGUnKTtcclxuICAgIH07XHJcbn07IiwiLyoqXHJcbiAgICBCb290a25vY2s6IFNldCBvZiBLbm9ja291dCBCaW5kaW5nIEhlbHBlcnMgZm9yIEJvb3RzdHJhcCBqcyBjb21wb25lbnRzIChqcXVlcnkgcGx1Z2lucylcclxuICAgIFxyXG4gICAgRGVwZW5kZW5jaWVzOiBqcXVlcnlcclxuICAgIEluamVjdGVkIGRlcGVuZGVuY2llczoga25vY2tvdXRcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbi8vIERlcGVuZGVuY2llc1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4vLyBESSBpMThuIGxpYnJhcnlcclxuZXhwb3J0cy5pMThuID0gbnVsbDtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZUhlbHBlcnMoa28pIHtcclxuICAgIHZhciBoZWxwZXJzID0ge307XHJcblxyXG4gICAgLyoqIFBvcG92ZXIgQmluZGluZyAqKi9cclxuICAgIGhlbHBlcnMucG9wb3ZlciA9IHtcclxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IsIGFsbEJpbmRpbmdzKSB7XHJcbiAgICAgICAgICAgIHZhciBzcmNPcHRpb25zID0ga28udW53cmFwKHZhbHVlQWNjZXNzb3IoKSk7XHJcblxyXG4gICAgICAgICAgICAvLyBEdXBsaWNhdGluZyBvcHRpb25zIG9iamVjdCB0byBwYXNzIHRvIHBvcG92ZXIgd2l0aG91dFxyXG4gICAgICAgICAgICAvLyBvdmVyd3JpdHRuZyBzb3VyY2UgY29uZmlndXJhdGlvblxyXG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzcmNPcHRpb25zKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFVud3JhcHBpbmcgY29udGVudCB0ZXh0XHJcbiAgICAgICAgICAgIG9wdGlvbnMuY29udGVudCA9IGtvLnVud3JhcChzcmNPcHRpb25zLmNvbnRlbnQpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY29udGVudCkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIExvY2FsaXplOlxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5jb250ZW50ID0gXHJcbiAgICAgICAgICAgICAgICAgICAgZXhwb3J0cy5pMThuICYmIGV4cG9ydHMuaTE4bi50KG9wdGlvbnMuY29udGVudCkgfHxcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmNvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIFRvIGdldCB0aGUgbmV3IG9wdGlvbnMsIHdlIG5lZWQgZGVzdHJveSBpdCBmaXJzdDpcclxuICAgICAgICAgICAgICAgICQoZWxlbWVudCkucG9wb3ZlcignZGVzdHJveScpLnBvcG92ZXIob3B0aW9ucyk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU2UgbXVlc3RyYSBzaSBlbCBlbGVtZW50byB0aWVuZSBlbCBmb2NvXHJcbiAgICAgICAgICAgICAgICBpZiAoJChlbGVtZW50KS5pcygnOmZvY3VzJykpXHJcbiAgICAgICAgICAgICAgICAgICAgJChlbGVtZW50KS5wb3BvdmVyKCdzaG93Jyk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJChlbGVtZW50KS5wb3BvdmVyKCdkZXN0cm95Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICByZXR1cm4gaGVscGVycztcclxufVxyXG5cclxuLyoqXHJcbiAgICBQbHVnIGhlbHBlcnMgaW4gdGhlIHByb3ZpZGVkIEtub2Nrb3V0IGluc3RhbmNlXHJcbioqL1xyXG5mdW5jdGlvbiBwbHVnSW4oa28sIHByZWZpeCkge1xyXG4gICAgdmFyIG5hbWUsXHJcbiAgICAgICAgaGVscGVycyA9IGNyZWF0ZUhlbHBlcnMoa28pO1xyXG4gICAgXHJcbiAgICBmb3IodmFyIGggaW4gaGVscGVycykge1xyXG4gICAgICAgIGlmIChoZWxwZXJzLmhhc093blByb3BlcnR5ICYmICFoZWxwZXJzLmhhc093blByb3BlcnR5KGgpKVxyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuXHJcbiAgICAgICAgbmFtZSA9IHByZWZpeCA/IHByZWZpeCArIGhbMF0udG9VcHBlckNhc2UoKSArIGguc2xpY2UoMSkgOiBoO1xyXG4gICAgICAgIGtvLmJpbmRpbmdIYW5kbGVyc1tuYW1lXSA9IGhlbHBlcnNbaF07XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydHMucGx1Z0luID0gcGx1Z0luO1xyXG5leHBvcnRzLmNyZWF0ZUJpbmRpbmdIZWxwZXJzID0gY3JlYXRlSGVscGVycztcclxuIiwiLyoqXHJcbiAgICBFc3BhY2UgYSBzdHJpbmcgZm9yIHVzZSBvbiBhIFJlZ0V4cC5cclxuICAgIFVzdWFsbHksIHRvIGxvb2sgZm9yIGEgc3RyaW5nIGluIGEgdGV4dCBtdWx0aXBsZSB0aW1lc1xyXG4gICAgb3Igd2l0aCBzb21lIGV4cHJlc3Npb25zLCBzb21lIGNvbW1vbiBhcmUgXHJcbiAgICBsb29rIGZvciBhIHRleHQgJ2luIHRoZSBiZWdpbm5pbmcnICheKVxyXG4gICAgb3IgJ2F0IHRoZSBlbmQnICgkKS5cclxuICAgIFxyXG4gICAgQXV0aG9yOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vdXNlcnMvMTUxMzEyL2Nvb2xhajg2IGFuZCBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vdXNlcnMvOTQxMC9hcmlzdG90bGUtcGFnYWx0emlzXHJcbiAgICBMaW5rOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS82OTY5NDg2XHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vLyBSZWZlcnJpbmcgdG8gdGhlIHRhYmxlIGhlcmU6XHJcbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL3JlZ2V4cFxyXG4vLyB0aGVzZSBjaGFyYWN0ZXJzIHNob3VsZCBiZSBlc2NhcGVkXHJcbi8vIFxcIF4gJCAqICsgPyAuICggKSB8IHsgfSBbIF1cclxuLy8gVGhlc2UgY2hhcmFjdGVycyBvbmx5IGhhdmUgc3BlY2lhbCBtZWFuaW5nIGluc2lkZSBvZiBicmFja2V0c1xyXG4vLyB0aGV5IGRvIG5vdCBuZWVkIHRvIGJlIGVzY2FwZWQsIGJ1dCB0aGV5IE1BWSBiZSBlc2NhcGVkXHJcbi8vIHdpdGhvdXQgYW55IGFkdmVyc2UgZWZmZWN0cyAodG8gdGhlIGJlc3Qgb2YgbXkga25vd2xlZGdlIGFuZCBjYXN1YWwgdGVzdGluZylcclxuLy8gOiAhICwgPSBcclxuLy8gbXkgdGVzdCBcIn4hQCMkJV4mKigpe31bXWAvPT8rXFx8LV87OidcXFwiLDwuPlwiLm1hdGNoKC9bXFwjXS9nKVxyXG5cclxudmFyIHNwZWNpYWxzID0gW1xyXG4gICAgLy8gb3JkZXIgbWF0dGVycyBmb3IgdGhlc2VcclxuICAgICAgXCItXCJcclxuICAgICwgXCJbXCJcclxuICAgICwgXCJdXCJcclxuICAgIC8vIG9yZGVyIGRvZXNuJ3QgbWF0dGVyIGZvciBhbnkgb2YgdGhlc2VcclxuICAgICwgXCIvXCJcclxuICAgICwgXCJ7XCJcclxuICAgICwgXCJ9XCJcclxuICAgICwgXCIoXCJcclxuICAgICwgXCIpXCJcclxuICAgICwgXCIqXCJcclxuICAgICwgXCIrXCJcclxuICAgICwgXCI/XCJcclxuICAgICwgXCIuXCJcclxuICAgICwgXCJcXFxcXCJcclxuICAgICwgXCJeXCJcclxuICAgICwgXCIkXCJcclxuICAgICwgXCJ8XCJcclxuICBdXHJcblxyXG4gIC8vIEkgY2hvb3NlIHRvIGVzY2FwZSBldmVyeSBjaGFyYWN0ZXIgd2l0aCAnXFwnXHJcbiAgLy8gZXZlbiB0aG91Z2ggb25seSBzb21lIHN0cmljdGx5IHJlcXVpcmUgaXQgd2hlbiBpbnNpZGUgb2YgW11cclxuLCByZWdleCA9IFJlZ0V4cCgnWycgKyBzcGVjaWFscy5qb2luKCdcXFxcJykgKyAnXScsICdnJylcclxuO1xyXG5cclxudmFyIGVzY2FwZVJlZ0V4cCA9IGZ1bmN0aW9uIChzdHIpIHtcclxucmV0dXJuIHN0ci5yZXBsYWNlKHJlZ2V4LCBcIlxcXFwkJlwiKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZXNjYXBlUmVnRXhwO1xyXG5cclxuLy8gdGVzdCBlc2NhcGVSZWdFeHAoXCIvcGF0aC90by9yZXM/c2VhcmNoPXRoaXMudGhhdFwiKVxyXG4iLCIvKipcclxuKiBlc2NhcGVTZWxlY3RvclxyXG4qXHJcbiogc291cmNlOiBodHRwOi8va2p2YXJnYS5ibG9nc3BvdC5jb20uZXMvMjAwOS8wNi9qcXVlcnktcGx1Z2luLXRvLWVzY2FwZS1jc3Mtc2VsZWN0b3IuaHRtbFxyXG4qXHJcbiogRXNjYXBlIGFsbCBzcGVjaWFsIGpRdWVyeSBDU1Mgc2VsZWN0b3IgY2hhcmFjdGVycyBpbiAqc2VsZWN0b3IqLlxyXG4qIFVzZWZ1bCB3aGVuIHlvdSBoYXZlIGEgY2xhc3Mgb3IgaWQgd2hpY2ggY29udGFpbnMgc3BlY2lhbCBjaGFyYWN0ZXJzXHJcbiogd2hpY2ggeW91IG5lZWQgdG8gaW5jbHVkZSBpbiBhIHNlbGVjdG9yLlxyXG4qL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgc3BlY2lhbHMgPSBbXHJcbiAgJyMnLCAnJicsICd+JywgJz0nLCAnPicsIFxyXG4gIFwiJ1wiLCAnOicsICdcIicsICchJywgJzsnLCAnLCdcclxuXTtcclxudmFyIHJlZ2V4U3BlY2lhbHMgPSBbXHJcbiAgJy4nLCAnKicsICcrJywgJ3wnLCAnWycsICddJywgJygnLCAnKScsICcvJywgJ14nLCAnJCdcclxuXTtcclxudmFyIHNSRSA9IG5ldyBSZWdFeHAoXHJcbiAgJygnICsgc3BlY2lhbHMuam9pbignfCcpICsgJ3xcXFxcJyArIHJlZ2V4U3BlY2lhbHMuam9pbignfFxcXFwnKSArICcpJywgJ2cnXHJcbik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgcmV0dXJuIHNlbGVjdG9yLnJlcGxhY2Uoc1JFLCAnXFxcXCQxJyk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgUmVhZCBhIHBhZ2UncyBHRVQgVVJMIHZhcmlhYmxlcyBhbmQgcmV0dXJuIHRoZW0gYXMgYW4gYXNzb2NpYXRpdmUgYXJyYXkuXHJcbioqL1xyXG4ndXNlciBzdHJpY3QnO1xyXG4vL2dsb2JhbCB3aW5kb3dcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0VXJsUXVlcnkodXJsKSB7XHJcblxyXG4gICAgdXJsID0gdXJsIHx8IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xyXG5cclxuICAgIHZhciB2YXJzID0gW10sIGhhc2gsXHJcbiAgICAgICAgcXVlcnlJbmRleCA9IHVybC5pbmRleE9mKCc/Jyk7XHJcbiAgICBpZiAocXVlcnlJbmRleCA+IC0xKSB7XHJcbiAgICAgICAgdmFyIGhhc2hlcyA9IHVybC5zbGljZShxdWVyeUluZGV4ICsgMSkuc3BsaXQoJyYnKTtcclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgaGFzaGVzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaGFzaCA9IGhhc2hlc1tpXS5zcGxpdCgnPScpO1xyXG4gICAgICAgICAgICB2YXJzLnB1c2goaGFzaFswXSk7XHJcbiAgICAgICAgICAgIHZhcnNbaGFzaFswXV0gPSBoYXNoWzFdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB2YXJzO1xyXG59O1xyXG4iLCIvKipcclxuICAgIERvbUl0ZW1zTWFuYWdlciBjbGFzcywgdGhhdCBtYW5hZ2UgYSBjb2xsZWN0aW9uIFxyXG4gICAgb2YgSFRNTC9ET00gaXRlbXMgdW5kZXIgYSByb290L2NvbnRhaW5lciwgd2hlcmVcclxuICAgIG9ubHkgb25lIGVsZW1lbnQgYXQgdGhlIHRpbWUgaXMgdmlzaWJsZSwgcHJvdmlkaW5nXHJcbiAgICB0b29scyB0byB1bmlxdWVybHkgaWRlbnRpZnkgdGhlIGl0ZW1zLFxyXG4gICAgdG8gY3JlYXRlIG9yIHVwZGF0ZSBuZXcgaXRlbXMgKHRocm91Z2ggJ2luamVjdCcpLFxyXG4gICAgZ2V0IHRoZSBjdXJyZW50LCBmaW5kIGJ5IHRoZSBJRCBhbmQgbW9yZS5cclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBlc2NhcGVTZWxlY3RvciA9IHJlcXVpcmUoJy4uL2VzY2FwZVNlbGVjdG9yJyk7XHJcblxyXG5mdW5jdGlvbiBEb21JdGVtc01hbmFnZXIoc2V0dGluZ3MpIHtcclxuXHJcbiAgICB0aGlzLmlkQXR0cmlidXRlTmFtZSA9IHNldHRpbmdzLmlkQXR0cmlidXRlTmFtZSB8fCAnaWQnO1xyXG4gICAgdGhpcy5hbGxvd0R1cGxpY2F0ZXMgPSAhIXNldHRpbmdzLmFsbG93RHVwbGljYXRlcyB8fCBmYWxzZTtcclxuICAgIHRoaXMuJHJvb3QgPSBudWxsO1xyXG4gICAgLy8gT24gcGFnZSByZWFkeSwgZ2V0IHRoZSByb290IGVsZW1lbnQ6XHJcbiAgICAkKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuJHJvb3QgPSAkKHNldHRpbmdzLnJvb3QgfHwgJ2JvZHknKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRG9tSXRlbXNNYW5hZ2VyO1xyXG5cclxuRG9tSXRlbXNNYW5hZ2VyLnByb3RvdHlwZS5maW5kID0gZnVuY3Rpb24gZmluZChjb250YWluZXJOYW1lLCByb290KSB7XHJcbiAgICB2YXIgJHJvb3QgPSAkKHJvb3QgfHwgdGhpcy4kcm9vdCk7XHJcbiAgICByZXR1cm4gJHJvb3QuZmluZCgnWycgKyB0aGlzLmlkQXR0cmlidXRlTmFtZSArICc9XCInICsgZXNjYXBlU2VsZWN0b3IoY29udGFpbmVyTmFtZSkgKyAnXCJdJyk7XHJcbn07XHJcblxyXG5Eb21JdGVtc01hbmFnZXIucHJvdG90eXBlLmdldEFjdGl2ZSA9IGZ1bmN0aW9uIGdldEFjdGl2ZSgpIHtcclxuICAgIHJldHVybiB0aGlzLiRyb290LmZpbmQoJ1snICsgdGhpcy5pZEF0dHJpYnV0ZU5hbWUgKyAnXTp2aXNpYmxlJyk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIEl0IGFkZHMgdGhlIGl0ZW0gaW4gdGhlIGh0bWwgcHJvdmlkZWQgKGNhbiBiZSBvbmx5IHRoZSBlbGVtZW50IG9yIFxyXG4gICAgY29udGFpbmVkIGluIGFub3RoZXIgb3IgYSBmdWxsIGh0bWwgcGFnZSkuXHJcbiAgICBSZXBsYWNlcyBhbnkgZXhpc3RhbnQgaWYgZHVwbGljYXRlcyBhcmUgbm90IGFsbG93ZWQuXHJcbioqL1xyXG5Eb21JdGVtc01hbmFnZXIucHJvdG90eXBlLmluamVjdCA9IGZ1bmN0aW9uIGluamVjdChuYW1lLCBodG1sKSB7XHJcblxyXG4gICAgLy8gRmlsdGVyaW5nIGlucHV0IGh0bWwgKGNhbiBiZSBwYXJ0aWFsIG9yIGZ1bGwgcGFnZXMpXHJcbiAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xMjg0ODc5OFxyXG4gICAgaHRtbCA9IGh0bWwucmVwbGFjZSgvXltcXHNcXFNdKjxib2R5Lio/Pnw8XFwvYm9keT5bXFxzXFxTXSokL2csICcnKTtcclxuXHJcbiAgICAvLyBDcmVhdGluZyBhIHdyYXBwZXIgYXJvdW5kIHRoZSBodG1sXHJcbiAgICAvLyAoY2FuIGJlIHByb3ZpZGVkIHRoZSBpbm5lckh0bWwgb3Igb3V0ZXJIdG1sLCBkb2Vzbid0IG1hdHRlcnMgd2l0aCBuZXh0IGFwcHJvYWNoKVxyXG4gICAgdmFyICRodG1sID0gJCgnPGRpdi8+JywgeyBodG1sOiBodG1sIH0pLFxyXG4gICAgICAgIC8vIFdlIGxvb2sgZm9yIHRoZSBjb250YWluZXIgZWxlbWVudCAod2hlbiB0aGUgb3V0ZXJIdG1sIGlzIHByb3ZpZGVkKVxyXG4gICAgICAgICRjID0gdGhpcy5maW5kKG5hbWUsICRodG1sKTtcclxuXHJcbiAgICBpZiAoJGMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgLy8gSXRzIGlubmVySHRtbCwgc28gdGhlIHdyYXBwZXIgYmVjb21lcyB0aGUgY29udGFpbmVyIGl0c2VsZlxyXG4gICAgICAgICRjID0gJGh0bWwuYXR0cih0aGlzLmlkQXR0cmlidXRlTmFtZSwgbmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0aGlzLmFsbG93RHVwbGljYXRlcykge1xyXG4gICAgICAgIC8vIE5vIG1vcmUgdGhhbiBvbmUgY29udGFpbmVyIGluc3RhbmNlIGNhbiBleGlzdHMgYXQgdGhlIHNhbWUgdGltZVxyXG4gICAgICAgIC8vIFdlIGxvb2sgZm9yIGFueSBleGlzdGVudCBvbmUgYW5kIGl0cyByZXBsYWNlZCB3aXRoIHRoZSBuZXdcclxuICAgICAgICB2YXIgJHByZXYgPSB0aGlzLmZpbmQobmFtZSk7XHJcbiAgICAgICAgaWYgKCRwcmV2Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgJHByZXYucmVwbGFjZVdpdGgoJGMpO1xyXG4gICAgICAgICAgICAkYyA9ICRwcmV2O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBBZGQgdG8gdGhlIGRvY3VtZW50XHJcbiAgICAvLyAob24gdGhlIGNhc2Ugb2YgZHVwbGljYXRlZCBmb3VuZCwgdGhpcyB3aWxsIGRvIG5vdGhpbmcsIG5vIHdvcnJ5KVxyXG4gICAgJGMuYXBwZW5kVG8odGhpcy4kcm9vdCk7XHJcbn07XHJcblxyXG4vKiogXHJcbiAgICBUaGUgc3dpdGNoIG1ldGhvZCByZWNlaXZlIHRoZSBpdGVtcyB0byBpbnRlcmNoYW5nZSBhcyBhY3RpdmUgb3IgY3VycmVudCxcclxuICAgIHRoZSAnZnJvbScgYW5kICd0bycsIGFuZCB0aGUgc2hlbGwgaW5zdGFuY2UgdGhhdCBNVVNUIGJlIHVzZWRcclxuICAgIHRvIG5vdGlmeSBlYWNoIGV2ZW50IHRoYXQgaW52b2x2ZXMgdGhlIGl0ZW06XHJcbiAgICB3aWxsQ2xvc2UsIHdpbGxPcGVuLCByZWFkeSwgb3BlbmVkLCBjbG9zZWQuXHJcbiAgICBJdCByZWNlaXZlcyBhcyBsYXRlc3QgcGFyYW1ldGVyIHRoZSAnbm90aWZpY2F0aW9uJyBvYmplY3QgdGhhdCBtdXN0IGJlXHJcbiAgICBwYXNzZWQgd2l0aCB0aGUgZXZlbnQgc28gaGFuZGxlcnMgaGFzIGNvbnRleHQgc3RhdGUgaW5mb3JtYXRpb24uXHJcbiAgICBcclxuICAgIEl0J3MgZGVzaWduZWQgdG8gYmUgYWJsZSB0byBtYW5hZ2UgdHJhbnNpdGlvbnMsIGJ1dCB0aGlzIGRlZmF1bHRcclxuICAgIGltcGxlbWVudGF0aW9uIGlzIGFzIHNpbXBsZSBhcyAnc2hvdyB0aGUgbmV3IGFuZCBoaWRlIHRoZSBvbGQnLlxyXG4qKi9cclxuRG9tSXRlbXNNYW5hZ2VyLnByb3RvdHlwZS5zd2l0Y2ggPSBmdW5jdGlvbiBzd2l0Y2hBY3RpdmVJdGVtKCRmcm9tLCAkdG8sIHNoZWxsLCBub3RpZmljYXRpb24pIHtcclxuXHJcbiAgICBpZiAoISR0by5pcygnOnZpc2libGUnKSkge1xyXG4gICAgICAgIHNoZWxsLmVtaXQoc2hlbGwuZXZlbnRzLndpbGxPcGVuLCAkdG8sIG5vdGlmaWNhdGlvbik7XHJcbiAgICAgICAgJHRvLnNob3coKTtcclxuICAgICAgICAvLyBJdHMgZW5vdWdoIHZpc2libGUgYW5kIGluIERPTSB0byBwZXJmb3JtIGluaXRpYWxpemF0aW9uIHRhc2tzXHJcbiAgICAgICAgLy8gdGhhdCBtYXkgaW52b2x2ZSBsYXlvdXQgaW5mb3JtYXRpb25cclxuICAgICAgICBzaGVsbC5lbWl0KHNoZWxsLmV2ZW50cy5pdGVtUmVhZHksICR0bywgbm90aWZpY2F0aW9uKTtcclxuICAgICAgICAvLyBXaGVuIGl0cyBjb21wbGV0ZWx5IG9wZW5lZFxyXG4gICAgICAgIHNoZWxsLmVtaXQoc2hlbGwuZXZlbnRzLm9wZW5lZCwgJHRvLCBub3RpZmljYXRpb24pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBJdHMgcmVhZHk7IG1heWJlIGl0IHdhcyBidXQgc3ViLWxvY2F0aW9uXHJcbiAgICAgICAgLy8gb3Igc3RhdGUgY2hhbmdlIG5lZWQgdG8gYmUgY29tbXVuaWNhdGVkXHJcbiAgICAgICAgc2hlbGwuZW1pdChzaGVsbC5ldmVudHMuaXRlbVJlYWR5LCAkdG8sIG5vdGlmaWNhdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCRmcm9tLmlzKCc6dmlzaWJsZScpKSB7XHJcbiAgICAgICAgc2hlbGwuZW1pdChzaGVsbC5ldmVudHMud2lsbENsb3NlLCAkZnJvbSwgbm90aWZpY2F0aW9uKTtcclxuICAgICAgICAvLyBEbyAndW5mb2N1cycgb24gdGhlIGhpZGRlbiBlbGVtZW50IGFmdGVyIG5vdGlmeSAnd2lsbENsb3NlJ1xyXG4gICAgICAgIC8vIGZvciBiZXR0ZXIgVVg6IGhpZGRlbiBlbGVtZW50cyBhcmUgbm90IHJlYWNoYWJsZSBhbmQgaGFzIGdvb2RcclxuICAgICAgICAvLyBzaWRlIGVmZmVjdHMgbGlrZSBoaWRkaW5nIHRoZSBvbi1zY3JlZW4ga2V5Ym9hcmQgaWYgYW4gaW5wdXQgd2FzXHJcbiAgICAgICAgLy8gZm9jdXNlZFxyXG4gICAgICAgICRmcm9tLmZpbmQoJzpmb2N1cycpLmJsdXIoKTtcclxuICAgICAgICAvLyBoaWRlIGFuZCBub3RpZnkgaXQgZW5kZWRcclxuICAgICAgICAkZnJvbS5oaWRlKCk7XHJcbiAgICAgICAgc2hlbGwuZW1pdChzaGVsbC5ldmVudHMuY2xvc2VkLCAkZnJvbSwgbm90aWZpY2F0aW9uKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gICAgSW5pdGlhbGl6ZXMgdGhlIGxpc3Qgb2YgaXRlbXMuIE5vIG1vcmUgdGhhbiBvbmVcclxuICAgIG11c3QgYmUgb3BlbmVkL3Zpc2libGUgYXQgdGhlIHNhbWUgdGltZSwgc28gYXQgdGhlIFxyXG4gICAgaW5pdCBhbGwgdGhlIGVsZW1lbnRzIGFyZSBjbG9zZWQgd2FpdGluZyB0byBzZXRcclxuICAgIG9uZSBhcyB0aGUgYWN0aXZlIG9yIHRoZSBjdXJyZW50IG9uZS5cclxuKiovXHJcbkRvbUl0ZW1zTWFuYWdlci5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICB0aGlzLmdldEFjdGl2ZSgpLmhpZGUoKTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBKYXZhc2NyaXRwIFNoZWxsIGZvciBTUEFzLlxyXG4qKi9cclxuLypnbG9iYWwgaGlzdG9yeSwgSGlzdG9yeSAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vKiogREkgZW50cnkgcG9pbnRzIGZvciBkZWZhdWx0IGJ1aWxkcy4gTW9zdCBkZXBlbmRlbmNpZXMgY2FuIGJlXHJcbiAgICBzcGVjaWZpZWQgaW4gdGhlIGNvbnN0cnVjdG9yIHNldHRpbmdzIGZvciBwZXItaW5zdGFuY2Ugc2V0dXAuXHJcbioqL1xyXG52YXIgZGVwcyA9IHJlcXVpcmUoJy4vZGVwZW5kZW5jaWVzJyk7XHJcblxyXG4vKiogQ29uc3RydWN0b3IgKiovXHJcblxyXG5mdW5jdGlvbiBTaGVsbChzZXR0aW5ncykge1xyXG4gICAgLy9qc2hpbnQgbWF4Y29tcGxleGl0eToxNFxyXG4gICAgXHJcbiAgICBkZXBzLkV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMuJCA9IHNldHRpbmdzLmpxdWVyeSB8fCBkZXBzLmpxdWVyeTtcclxuICAgIHRoaXMuJHJvb3QgPSB0aGlzLiQoc2V0dGluZ3Mucm9vdCk7XHJcbiAgICB0aGlzLmJhc2VVcmwgPSBzZXR0aW5ncy5iYXNlVXJsIHx8ICcnO1xyXG4gICAgLy8gV2l0aCBmb3JjZUhhc2hiYW5nPXRydWU6XHJcbiAgICAvLyAtIGZyYWdtZW50cyBVUkxzIGNhbm5vdCBiZSB1c2VkIHRvIHNjcm9sbCB0byBhbiBlbGVtZW50IChkZWZhdWx0IGJyb3dzZXIgYmVoYXZpb3IpLFxyXG4gICAgLy8gICB0aGV5IGFyZSBkZWZhdWx0UHJldmVudGVkIHRvIGF2b2lkIGNvbmZ1c2UgdGhlIHJvdXRpbmcgbWVjaGFuaXNtIGFuZCBjdXJyZW50IFVSTC5cclxuICAgIC8vIC0gcHJlc3NlZCBsaW5rcyB0byBmcmFnbWVudHMgVVJMcyBhcmUgbm90IHJvdXRlZCwgdGhleSBhcmUgc2tpcHBlZCBzaWxlbnRseVxyXG4gICAgLy8gICBleGNlcHQgd2hlbiB0aGV5IGFyZSBhIGhhc2hiYW5nICgjISkuIFRoaXMgd2F5LCBzcGVjaWFsIGxpbmtzXHJcbiAgICAvLyAgIHRoYXQgcGVyZm9ybW4ganMgYWN0aW9ucyBkb2Vzbid0IGNvbmZsaXRzLlxyXG4gICAgLy8gLSBhbGwgVVJMcyByb3V0ZWQgdGhyb3VnaCB0aGUgc2hlbGwgaW5jbHVkZXMgYSBoYXNoYmFuZyAoIyEpLCB0aGUgc2hlbGwgZW5zdXJlc1xyXG4gICAgLy8gICB0aGF0IGhhcHBlbnMgYnkgYXBwZW5kaW5nIHRoZSBoYXNoYmFuZyB0byBhbnkgVVJMIHBhc3NlZCBpbiAoZXhjZXB0IHRoZSBzdGFuZGFyZCBoYXNoXHJcbiAgICAvLyAgIHRoYXQgYXJlIHNraXB0KS5cclxuICAgIHRoaXMuZm9yY2VIYXNoYmFuZyA9IHNldHRpbmdzLmZvcmNlSGFzaGJhbmcgfHwgZmFsc2U7XHJcbiAgICB0aGlzLmxpbmtFdmVudCA9IHNldHRpbmdzLmxpbmtFdmVudCB8fCAnY2xpY2snO1xyXG4gICAgdGhpcy5wYXJzZVVybCA9IChzZXR0aW5ncy5wYXJzZVVybCB8fCBkZXBzLnBhcnNlVXJsKS5iaW5kKHRoaXMsIHRoaXMuYmFzZVVybCk7XHJcbiAgICB0aGlzLmFic29sdXRpemVVcmwgPSAoc2V0dGluZ3MuYWJzb2x1dGl6ZVVybCB8fCBkZXBzLmFic29sdXRpemVVcmwpLmJpbmQodGhpcywgdGhpcy5iYXNlVXJsKTtcclxuXHJcbiAgICB0aGlzLmhpc3RvcnkgPSBzZXR0aW5ncy5oaXN0b3J5IHx8IHdpbmRvdy5oaXN0b3J5O1xyXG5cclxuICAgIHRoaXMuaW5kZXhOYW1lID0gc2V0dGluZ3MuaW5kZXhOYW1lIHx8ICdpbmRleCc7XHJcbiAgICBcclxuICAgIHRoaXMuaXRlbXMgPSBzZXR0aW5ncy5kb21JdGVtc01hbmFnZXI7XHJcblxyXG4gICAgLy8gbG9hZGVyIGNhbiBiZSBkaXNhYmxlZCBwYXNzaW5nICdudWxsJywgc28gd2UgbXVzdFxyXG4gICAgLy8gZW5zdXJlIHRvIG5vdCB1c2UgdGhlIGRlZmF1bHQgb24gdGhhdCBjYXNlczpcclxuICAgIHRoaXMubG9hZGVyID0gdHlwZW9mKHNldHRpbmdzLmxvYWRlcikgPT09ICd1bmRlZmluZWQnID8gZGVwcy5sb2FkZXIgOiBzZXR0aW5ncy5sb2FkZXI7XHJcbiAgICAvLyBsb2FkZXIgc2V0dXBcclxuICAgIGlmICh0aGlzLmxvYWRlcilcclxuICAgICAgICB0aGlzLmxvYWRlci5iYXNlVXJsID0gdGhpcy5iYXNlVXJsO1xyXG5cclxuICAgIC8vIERlZmluaXRpb24gb2YgZXZlbnRzIHRoYXQgdGhpcyBvYmplY3QgY2FuIHRyaWdnZXIsXHJcbiAgICAvLyBpdHMgdmFsdWUgY2FuIGJlIGN1c3RvbWl6ZWQgYnV0IGFueSBsaXN0ZW5lciBuZWVkc1xyXG4gICAgLy8gdG8ga2VlcCB1cGRhdGVkIHRvIHRoZSBjb3JyZWN0IGV2ZW50IHN0cmluZy1uYW1lIHVzZWQuXHJcbiAgICAvLyBUaGUgaXRlbXMgbWFuaXB1bGF0aW9uIGV2ZW50cyBNVVNUIGJlIHRyaWdnZXJlZFxyXG4gICAgLy8gYnkgdGhlICdpdGVtcy5zd2l0Y2gnIGZ1bmN0aW9uXHJcbiAgICB0aGlzLmV2ZW50cyA9IHtcclxuICAgICAgICB3aWxsT3BlbjogJ3NoZWxsLXdpbGwtb3BlbicsXHJcbiAgICAgICAgd2lsbENsb3NlOiAnc2hlbGwtd2lsbC1jbG9zZScsXHJcbiAgICAgICAgaXRlbVJlYWR5OiAnc2hlbGwtaXRlbS1yZWFkeScsXHJcbiAgICAgICAgY2xvc2VkOiAnc2hlbGwtY2xvc2VkJyxcclxuICAgICAgICBvcGVuZWQ6ICdzaGVsbC1vcGVuZWQnXHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAgICBBIGZ1bmN0aW9uIHRvIGRlY2lkZSBpZiB0aGVcclxuICAgICAgICBhY2Nlc3MgaXMgYWxsb3dlZCAocmV0dXJucyAnbnVsbCcpXHJcbiAgICAgICAgb3Igbm90IChyZXR1cm4gYSBzdGF0ZSBvYmplY3Qgd2l0aCBpbmZvcm1hdGlvblxyXG4gICAgICAgIHRoYXQgd2lsbCBiZSBwYXNzZWQgdG8gdGhlICdub25BY2Nlc3NOYW1lJyBpdGVtO1xyXG4gICAgICAgIHRoZSAncm91dGUnIHByb3BlcnR5IG9uIHRoZSBzdGF0ZSBpcyBhdXRvbWF0aWNhbGx5IGZpbGxlZCkuXHJcbiAgICAgICAgXHJcbiAgICAgICAgVGhlIGRlZmF1bHQgYnVpdC1pbiBqdXN0IGFsbG93IGV2ZXJ5dGhpbmcgXHJcbiAgICAgICAgYnkganVzdCByZXR1cm5pbmcgJ251bGwnIGFsbCB0aGUgdGltZS5cclxuICAgICAgICBcclxuICAgICAgICBJdCByZWNlaXZlcyBhcyBwYXJhbWV0ZXIgdGhlIHN0YXRlIG9iamVjdCxcclxuICAgICAgICB0aGF0IGFsbW9zdCBjb250YWlucyB0aGUgJ3JvdXRlJyBwcm9wZXJ0eSB3aXRoXHJcbiAgICAgICAgaW5mb3JtYXRpb24gYWJvdXQgdGhlIFVSTC5cclxuICAgICoqL1xyXG4gICAgdGhpcy5hY2Nlc3NDb250cm9sID0gc2V0dGluZ3MuYWNjZXNzQ29udHJvbCB8fCBkZXBzLmFjY2Vzc0NvbnRyb2w7XHJcbiAgICAvLyBXaGF0IGl0ZW0gbG9hZCBvbiBub24gYWNjZXNzXHJcbiAgICB0aGlzLm5vbkFjY2Vzc05hbWUgPSBzZXR0aW5ncy5ub25BY2Nlc3NOYW1lIHx8ICdpbmRleCc7XHJcbn1cclxuXHJcbi8vIFNoZWxsIGluaGVyaXRzIGZyb20gRXZlbnRFbWl0dGVyXHJcblNoZWxsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoZGVwcy5FdmVudEVtaXR0ZXIucHJvdG90eXBlLCB7XHJcbiAgICBjb25zdHJ1Y3Rvcjoge1xyXG4gICAgICAgIHZhbHVlOiBTaGVsbCxcclxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcclxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNoZWxsO1xyXG5cclxuXHJcbi8qKiBBUEkgZGVmaW5pdGlvbiAqKi9cclxuXHJcblNoZWxsLnByb3RvdHlwZS5nbyA9IGZ1bmN0aW9uIGdvKHVybCwgc3RhdGUpIHtcclxuXHJcbiAgICBpZiAodGhpcy5mb3JjZUhhc2hiYW5nKSB7XHJcbiAgICAgICAgaWYgKCEvXiMhLy50ZXN0KHVybCkpIHtcclxuICAgICAgICAgICAgdXJsID0gJyMhJyArIHVybDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICB1cmwgPSB0aGlzLmFic29sdXRpemVVcmwodXJsKTtcclxuICAgIH1cclxuICAgIHRoaXMuaGlzdG9yeS5wdXNoU3RhdGUoc3RhdGUsIHVuZGVmaW5lZCwgdXJsKTtcclxuICAgIC8vIHB1c2hTdGF0ZSBkbyBOT1QgdHJpZ2dlciB0aGUgcG9wc3RhdGUgZXZlbnQsIHNvXHJcbiAgICByZXR1cm4gdGhpcy5yZXBsYWNlKHN0YXRlKTtcclxufTtcclxuXHJcblNoZWxsLnByb3RvdHlwZS5nb0JhY2sgPSBmdW5jdGlvbiBnb0JhY2soc3RhdGUsIHN0ZXBzKSB7XHJcbiAgICBzdGVwcyA9IDAgLSAoc3RlcHMgfHwgMSk7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBub3RoaW5nIHRvIGdvLWJhY2sgb3Igbm90IGVub3VnaHRcclxuICAgIC8vICdiYWNrJyBzdGVwcywgZ28gdG8gdGhlIGluZGV4XHJcbiAgICBpZiAoc3RlcHMgPCAwICYmIE1hdGguYWJzKHN0ZXBzKSA+PSB0aGlzLmhpc3RvcnkubGVuZ3RoKSB7XHJcbiAgICAgICAgdGhpcy5nbyh0aGlzLmluZGV4TmFtZSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICAvLyBPbiByZXBsYWNlLCB0aGUgcGFzc2VkIHN0YXRlIGlzIG1lcmdlZCB3aXRoXHJcbiAgICAgICAgLy8gdGhlIG9uZSB0aGF0IGNvbWVzIGZyb20gdGhlIHNhdmVkIGhpc3RvcnlcclxuICAgICAgICAvLyBlbnRyeSAoaXQgJ3BvcHMnIHdoZW4gZG9pbmcgdGhlIGhpc3RvcnkuZ28oKSlcclxuICAgICAgICB0aGlzLl9wZW5kaW5nU3RhdGVVcGRhdGUgPSBzdGF0ZTtcclxuICAgICAgICB0aGlzLmhpc3RvcnkuZ28oc3RlcHMpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAgICBQcm9jZXNzIHRoZSBnaXZlbiBzdGF0ZSBpbiBvcmRlciB0byBnZXQgdGhlIGN1cnJlbnQgc3RhdGVcclxuICAgIGJhc2VkIG9uIHRoYXQgb3IgdGhlIHNhdmVkIGluIGhpc3RvcnksIG1lcmdlIGl0IHdpdGhcclxuICAgIGFueSB1cGRhdGVkIHN0YXRlIHBlbmRpbmcgYW5kIGFkZHMgdGhlIHJvdXRlIGluZm9ybWF0aW9uLFxyXG4gICAgcmV0dXJuaW5nIGFuIHN0YXRlIG9iamVjdCBzdWl0YWJsZSB0byB1c2UuXHJcbioqL1xyXG5TaGVsbC5wcm90b3R5cGUuZ2V0VXBkYXRlZFN0YXRlID0gZnVuY3Rpb24gZ2V0VXBkYXRlZFN0YXRlKHN0YXRlKSB7XHJcbiAgICBcclxuICAgIC8vIEZvciBjdXJyZW50IHVzZXMsIGFueSBwZW5kaW5nU3RhdGVVcGRhdGUgaXMgdXNlZCBhc1xyXG4gICAgLy8gdGhlIHN0YXRlLCByYXRoZXIgdGhhbiB0aGUgcHJvdmlkZWQgb25lXHJcbiAgICBzdGF0ZSA9IHRoaXMuX3BlbmRpbmdTdGF0ZVVwZGF0ZSB8fCBzdGF0ZSB8fCB0aGlzLmhpc3Rvcnkuc3RhdGU7XHJcbiAgICBcclxuICAgIC8vIFRPRE86IG1vcmUgYWR2YW5jZWQgdXNlcyBtdXN0IGJlIHRvIHVzZSB0aGUgJ3N0YXRlJyB0b1xyXG4gICAgLy8gcmVjb3ZlciB0aGUgVUkgc3RhdGUsIHdpdGggYW55IG1lc3NhZ2UgZnJvbSBvdGhlciBVSVxyXG4gICAgLy8gcGFzc2luZyBpbiBhIHdheSB0aGF0IGFsbG93IHVwZGF0ZSB0aGUgc3RhdGUsIG5vdFxyXG4gICAgLy8gcmVwbGFjZSBpdCAoZnJvbSBwZW5kaW5nU3RhdGVVcGRhdGUpLlxyXG4gICAgLypcclxuICAgIC8vIFN0YXRlIG9yIGRlZmF1bHQgc3RhdGVcclxuICAgIHN0YXRlID0gc3RhdGUgfHwgdGhpcy5oaXN0b3J5LnN0YXRlIHx8IHt9O1xyXG4gICAgLy8gbWVyZ2UgcGVuZGluZyB1cGRhdGVkIHN0YXRlXHJcbiAgICB0aGlzLiQuZXh0ZW5kKHN0YXRlLCB0aGlzLl9wZW5kaW5nU3RhdGVVcGRhdGUpO1xyXG4gICAgLy8gZGlzY2FyZCB0aGUgdXBkYXRlXHJcbiAgICAqL1xyXG4gICAgdGhpcy5fcGVuZGluZ1N0YXRlVXBkYXRlID0gbnVsbDtcclxuICAgIFxyXG4gICAgLy8gRG9lc24ndCBtYXR0ZXJzIGlmIHN0YXRlIGluY2x1ZGVzIGFscmVhZHkgXHJcbiAgICAvLyAncm91dGUnIGluZm9ybWF0aW9uLCBuZWVkIHRvIGJlIG92ZXJ3cml0dGVuXHJcbiAgICAvLyB0byBtYXRjaCB0aGUgY3VycmVudCBvbmUuXHJcbiAgICAvLyBOT1RFOiBwcmV2aW91c2x5LCBhIGNoZWNrIHByZXZlbnRlZCB0aGlzIGlmXHJcbiAgICAvLyByb3V0ZSBwcm9wZXJ0eSBleGlzdHMsIGNyZWF0aW5nIGluZmluaXRlIGxvb3BzXHJcbiAgICAvLyBvbiByZWRpcmVjdGlvbnMgZnJvbSBhY3Rpdml0eS5zaG93IHNpbmNlICdyb3V0ZScgZG9lc24ndFxyXG4gICAgLy8gbWF0Y2ggdGhlIG5ldyBkZXNpcmVkIGxvY2F0aW9uXHJcbiAgICBcclxuICAgIC8vIERldGVjdCBpZiBpcyBhIGhhc2hiYW5nIFVSTCBvciBhbiBzdGFuZGFyZCBvbmUuXHJcbiAgICAvLyBFeGNlcHQgaWYgdGhlIGFwcCBpcyBmb3JjZWQgdG8gdXNlIGhhc2hiYW5nLlxyXG4gICAgdmFyIGlzSGFzaEJhbmcgPSAvIyEvLnRlc3QobG9jYXRpb24uaHJlZikgfHwgdGhpcy5mb3JjZUhhc2hiYW5nO1xyXG4gICAgXHJcbiAgICB2YXIgbGluayA9IChcclxuICAgICAgICBpc0hhc2hCYW5nID9cclxuICAgICAgICBsb2NhdGlvbi5oYXNoIDpcclxuICAgICAgICBsb2NhdGlvbi5wYXRobmFtZVxyXG4gICAgKSArIChsb2NhdGlvbi5zZWFyY2ggfHwgJycpO1xyXG4gICAgXHJcbiAgICAvLyBTZXQgdGhlIHJvdXRlXHJcbiAgICBzdGF0ZS5yb3V0ZSA9IHRoaXMucGFyc2VVcmwobGluayk7XHJcbiAgICBcclxuICAgIHJldHVybiBzdGF0ZTtcclxufTtcclxuXHJcblNoZWxsLnByb3RvdHlwZS5yZXBsYWNlID0gZnVuY3Rpb24gcmVwbGFjZShzdGF0ZSkge1xyXG4gICAgXHJcbiAgICBzdGF0ZSA9IHRoaXMuZ2V0VXBkYXRlZFN0YXRlKHN0YXRlKTtcclxuXHJcbiAgICAvLyBVc2UgdGhlIGluZGV4IG9uIHJvb3QgY2FsbHNcclxuICAgIGlmIChzdGF0ZS5yb3V0ZS5yb290ID09PSB0cnVlKSB7XHJcbiAgICAgICAgc3RhdGUucm91dGUgPSB0aGlzLnBhcnNlVXJsKHRoaXMuaW5kZXhOYW1lKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gQWNjZXNzIGNvbnRyb2xcclxuICAgIHZhciBhY2Nlc3NFcnJvciA9IHRoaXMuYWNjZXNzQ29udHJvbChzdGF0ZSk7XHJcbiAgICBpZiAoYWNjZXNzRXJyb3IpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nbyh0aGlzLm5vbkFjY2Vzc05hbWUsIGFjY2Vzc0Vycm9yKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBMb2NhdGluZyB0aGUgY29udGFpbmVyXHJcbiAgICB2YXIgJGNvbnQgPSB0aGlzLml0ZW1zLmZpbmQoc3RhdGUucm91dGUubmFtZSk7XHJcbiAgICB2YXIgc2hlbGwgPSB0aGlzO1xyXG4gICAgdmFyIHByb21pc2UgPSBudWxsO1xyXG5cclxuICAgIGlmICgkY29udCAmJiAkY29udC5sZW5ndGgpIHtcclxuICAgICAgICBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyICRvbGRDb250ID0gc2hlbGwuaXRlbXMuZ2V0QWN0aXZlKCk7XHJcbiAgICAgICAgICAgICAgICAkb2xkQ29udCA9ICRvbGRDb250Lm5vdCgkY29udCk7XHJcbiAgICAgICAgICAgICAgICBzaGVsbC5pdGVtcy5zd2l0Y2goJG9sZENvbnQsICRjb250LCBzaGVsbCwgc3RhdGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTsgLy8/IHJlc29sdmUoYWN0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXRjaCAoZXgpIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChleCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGlmICh0aGlzLmxvYWRlcikge1xyXG4gICAgICAgICAgICAvLyBsb2FkIGFuZCBpbmplY3QgdGhlIGNvbnRlbnQgaW4gdGhlIHBhZ2VcclxuICAgICAgICAgICAgLy8gdGhlbiB0cnkgdGhlIHJlcGxhY2UgYWdhaW5cclxuICAgICAgICAgICAgcHJvbWlzZSA9IHRoaXMubG9hZGVyLmxvYWQoc3RhdGUucm91dGUpLnRoZW4oZnVuY3Rpb24oaHRtbCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQWRkIHRvIHRoZSBpdGVtcyAodGhlIG1hbmFnZXIgdGFrZXMgY2FyZSB5b3VcclxuICAgICAgICAgICAgICAgIC8vIGFkZCBvbmx5IHRoZSBpdGVtLCBpZiB0aGVyZSBpcyBvbmUpXHJcbiAgICAgICAgICAgICAgICBzaGVsbC5pdGVtcy5pbmplY3Qoc3RhdGUucm91dGUubmFtZSwgaHRtbCk7XHJcbiAgICAgICAgICAgICAgICAvLyBEb3VibGUgY2hlY2sgdGhhdCB0aGUgaXRlbSB3YXMgYWRkZWQgYW5kIGlzIHJlYWR5XHJcbiAgICAgICAgICAgICAgICAvLyB0byBhdm9pZCBhbiBpbmZpbml0ZSBsb29wIGJlY2F1c2UgYSByZXF1ZXN0IG5vdCByZXR1cm5pbmdcclxuICAgICAgICAgICAgICAgIC8vIHRoZSBpdGVtIGFuZCB0aGUgJ3JlcGxhY2UnIHRyeWluZyB0byBsb2FkIGl0IGFnYWluLCBhbmQgYWdhaW4sIGFuZC4uXHJcbiAgICAgICAgICAgICAgICBpZiAoc2hlbGwuaXRlbXMuZmluZChzdGF0ZS5yb3V0ZS5uYW1lKS5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNoZWxsLnJlcGxhY2Uoc3RhdGUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ1BhZ2Ugbm90IGZvdW5kICgnICsgc3RhdGUucm91dGUubmFtZSArICcpJyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignU2hlbGwgUGFnZSBub3QgZm91bmQsIHN0YXRlOicsIHN0YXRlKTtcclxuICAgICAgICAgICAgcHJvbWlzZSA9IFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB2YXIgdGhpc1NoZWxsID0gdGhpcztcclxuICAgIHByb21pc2UuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgaWYgKCEoZXJyIGluc3RhbmNlb2YgRXJyb3IpKVxyXG4gICAgICAgICAgICBlcnIgPSBuZXcgRXJyb3IoZXJyKTtcclxuXHJcbiAgICAgICAgLy8gTG9nIGVycm9yLCBcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdTaGVsbCwgdW5leHBlY3RlZCBlcnJvci4nLCBlcnIpO1xyXG4gICAgICAgIC8vIG5vdGlmeSBhcyBhbiBldmVudFxyXG4gICAgICAgIHRoaXNTaGVsbC5lbWl0KCdlcnJvcicsIGVycik7XHJcbiAgICAgICAgLy8gYW5kIGNvbnRpbnVlIHByb3BhZ2F0aW5nIHRoZSBlcnJvclxyXG4gICAgICAgIHJldHVybiBlcnI7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gcHJvbWlzZTtcclxufTtcclxuXHJcblNoZWxsLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiBydW4oKSB7XHJcblxyXG4gICAgdmFyIHNoZWxsID0gdGhpcztcclxuXHJcbiAgICAvLyBDYXRjaCBwb3BzdGF0ZSBldmVudCB0byB1cGRhdGUgc2hlbGwgcmVwbGFjaW5nIHRoZSBhY3RpdmUgY29udGFpbmVyLlxyXG4gICAgLy8gQWxsb3dzIHBvbHlmaWxscyB0byBwcm92aWRlIGEgZGlmZmVyZW50IGJ1dCBlcXVpdmFsZW50IGV2ZW50IG5hbWVcclxuICAgIHRoaXMuJCh3aW5kb3cpLm9uKHRoaXMuaGlzdG9yeS5wb3BzdGF0ZUV2ZW50IHx8ICdwb3BzdGF0ZScsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHN0YXRlID0gZXZlbnQuc3RhdGUgfHwgXHJcbiAgICAgICAgICAgIChldmVudC5vcmlnaW5hbEV2ZW50ICYmIGV2ZW50Lm9yaWdpbmFsRXZlbnQuc3RhdGUpIHx8IFxyXG4gICAgICAgICAgICBzaGVsbC5oaXN0b3J5LnN0YXRlO1xyXG5cclxuICAgICAgICAvLyBnZXQgc3RhdGUgZm9yIGN1cnJlbnQuIFRvIHN1cHBvcnQgcG9seWZpbGxzLCB3ZSB1c2UgdGhlIGdlbmVyYWwgZ2V0dGVyXHJcbiAgICAgICAgLy8gaGlzdG9yeS5zdGF0ZSBhcyBmYWxsYmFjayAodGhleSBtdXN0IGJlIHRoZSBzYW1lIG9uIGJyb3dzZXJzIHN1cHBvcnRpbmcgSGlzdG9yeSBBUEkpXHJcbiAgICAgICAgc2hlbGwucmVwbGFjZShzdGF0ZSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBDYXRjaCBhbGwgbGlua3MgaW4gdGhlIHBhZ2UgKG5vdCBvbmx5ICRyb290IG9uZXMpIGFuZCBsaWtlLWxpbmtzXHJcbiAgICB0aGlzLiQoJ2JvZHknKS5vbih0aGlzLmxpbmtFdmVudCwgJ1tocmVmXSwgW2RhdGEtaHJlZl0nLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyICR0ID0gc2hlbGwuJCh0aGlzKSxcclxuICAgICAgICAgICAgaHJlZiA9ICR0LmF0dHIoJ2hyZWYnKSB8fCAkdC5kYXRhKCdocmVmJyk7XHJcblxyXG4gICAgICAgIC8vIERvIG5vdGhpbmcgaWYgdGhlIFVSTCBjb250YWlucyB0aGUgcHJvdG9jb2xcclxuICAgICAgICBpZiAoL15bYS16XSs6L2kudGVzdChocmVmKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHNoZWxsLmZvcmNlSGFzaGJhbmcgJiYgL14jKFteIV18JCkvLnRlc3QoaHJlZikpIHtcclxuICAgICAgICAgICAgLy8gU3RhbmRhcmQgaGFzaCwgYnV0IG5vdCBoYXNoYmFuZzogYXZvaWQgcm91dGluZyBhbmQgZGVmYXVsdCBiZWhhdmlvclxyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAvLz8gZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgc2hlbGwuZ28oaHJlZik7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBJbml0aWFsbGl6ZSBzdGF0ZVxyXG4gICAgdGhpcy5pdGVtcy5pbml0KCk7XHJcbiAgICAvLyBSb3V0ZSB0byB0aGUgY3VycmVudCB1cmwvc3RhdGVcclxuICAgIHRoaXMucmVwbGFjZSgpO1xyXG59O1xyXG4iLCIvKipcclxuICAgIGFic29sdXRpemVVcmwgdXRpbGl0eSBcclxuICAgIHRoYXQgZW5zdXJlcyB0aGUgdXJsIHByb3ZpZGVkXHJcbiAgICBiZWluZyBpbiB0aGUgcGF0aCBvZiB0aGUgZ2l2ZW4gYmFzZVVybFxyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIHNhbml0aXplVXJsID0gcmVxdWlyZSgnLi9zYW5pdGl6ZVVybCcpLFxyXG4gICAgZXNjYXBlUmVnRXhwID0gcmVxdWlyZSgnLi4vZXNjYXBlUmVnRXhwJyk7XHJcblxyXG5mdW5jdGlvbiBhYnNvbHV0aXplVXJsKGJhc2VVcmwsIHVybCkge1xyXG5cclxuICAgIC8vIHNhbml0aXplIGJlZm9yZSBjaGVja1xyXG4gICAgdXJsID0gc2FuaXRpemVVcmwodXJsKTtcclxuXHJcbiAgICAvLyBDaGVjayBpZiB1c2UgdGhlIGJhc2UgYWxyZWFkeVxyXG4gICAgdmFyIG1hdGNoQmFzZSA9IG5ldyBSZWdFeHAoJ14nICsgZXNjYXBlUmVnRXhwKGJhc2VVcmwpLCAnaScpO1xyXG4gICAgaWYgKG1hdGNoQmFzZS50ZXN0KHVybCkpIHtcclxuICAgICAgICByZXR1cm4gdXJsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGJ1aWxkIGFuZCBzYW5pdGl6ZVxyXG4gICAgcmV0dXJuIHNhbml0aXplVXJsKGJhc2VVcmwgKyB1cmwpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFic29sdXRpemVVcmw7XHJcbiIsIi8qKlxyXG4gICAgRXh0ZXJuYWwgZGVwZW5kZW5jaWVzIGZvciBTaGVsbCBpbiBhIHNlcGFyYXRlIG1vZHVsZVxyXG4gICAgdG8gdXNlIGFzIERJLCBuZWVkcyBzZXR1cCBiZWZvcmUgY2FsbCB0aGUgU2hlbGwuanNcclxuICAgIG1vZHVsZSBjbGFzc1xyXG4qKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBwYXJzZVVybDogbnVsbCxcclxuICAgIGFic29sdXRpemVVcmw6IG51bGwsXHJcbiAgICBqcXVlcnk6IG51bGwsXHJcbiAgICBsb2FkZXI6IG51bGwsXHJcbiAgICBhY2Nlc3NDb250cm9sOiBmdW5jdGlvbiBhbGxvd0FsbChuYW1lKSB7XHJcbiAgICAgICAgLy8gYWxsb3cgYWNjZXNzIGJ5IGRlZmF1bHRcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH0sXHJcbiAgICBFdmVudEVtaXR0ZXI6IG51bGxcclxufTtcclxuIiwiLyoqXHJcbiAgICBTaW1wbGUgaW1wbGVtZW50YXRpb24gb2YgdGhlIEhpc3RvcnkgQVBJIHVzaW5nIG9ubHkgaGFzaGJhbmdzIFVSTHMsXHJcbiAgICBkb2Vzbid0IG1hdHRlcnMgdGhlIGJyb3dzZXIgc3VwcG9ydC5cclxuICAgIFVzZWQgdG8gYXZvaWQgZnJvbSBzZXR0aW5nIFVSTHMgdGhhdCBoYXMgbm90IGFuIGVuZC1wb2ludCxcclxuICAgIGxpa2UgaW4gbG9jYWwgZW52aXJvbm1lbnRzIHdpdGhvdXQgYSBzZXJ2ZXIgZG9pbmcgdXJsLXJld3JpdGluZyxcclxuICAgIGluIHBob25lZ2FwIGFwcHMsIG9yIHRvIGNvbXBsZXRlbHkgYnktcGFzcyBicm93c2VyIHN1cHBvcnQgYmVjYXVzZVxyXG4gICAgaXMgYnVnZ3kgKGxpa2UgQW5kcm9pZCA8PSA0LjEpLlxyXG4gICAgXHJcbiAgICBOT1RFUzpcclxuICAgIC0gQnJvd3NlciBtdXN0IHN1cHBvcnQgJ2hhc2hjaGFuZ2UnIGV2ZW50LlxyXG4gICAgLSBCcm93c2VyIG11c3QgaGFzIHN1cHBvcnQgZm9yIHN0YW5kYXJkIEpTT04gY2xhc3MuXHJcbiAgICAtIFJlbGllcyBvbiBzZXNzaW9uc3RvcmFnZSBmb3IgcGVyc2lzdGFuY2UsIHN1cHBvcnRlZCBieSBhbGwgYnJvd3NlcnMgYW5kIHdlYnZpZXdzIFxyXG4gICAgICBmb3IgYSBlbm91Z2ggbG9uZyB0aW1lIG5vdy5cclxuICAgIC0gU2ltaWxhciBhcHByb2FjaCBhcyBIaXN0b3J5LmpzIHBvbHlmaWxsLCBidXQgc2ltcGxpZmllZCwgYXBwZW5kaW5nIGEgZmFrZSBxdWVyeVxyXG4gICAgICBwYXJhbWV0ZXIgJ19zdWlkPTAnIHRvIHRoZSBoYXNoIHZhbHVlIChhY3R1YWwgcXVlcnkgZ29lcyBiZWZvcmUgdGhlIGhhc2gsIGJ1dFxyXG4gICAgICB3ZSBuZWVkIGl0IGluc2lkZSkuXHJcbiAgICAtIEZvciBzaW1wbGlmaWNhdGlvbiwgb25seSB0aGUgc3RhdGUgaXMgcGVyc2lzdGVkLCB0aGUgJ3RpdGxlJyBwYXJhbWV0ZXIgaXMgbm90XHJcbiAgICAgIHVzZWQgYXQgYWxsICh0aGUgc2FtZSBhcyBtYWpvciBicm93c2VycyBkbywgc28gaXMgbm90IGEgcHJvYmxlbSk7IGluIHRoaXMgbGluZSxcclxuICAgICAgb25seSBoaXN0b3J5IGVudHJpZXMgd2l0aCBzdGF0ZSBhcmUgcGVyc2lzdGVkLlxyXG4qKi9cclxuLy9nbG9iYWwgbG9jYXRpb25cclxuJ3VzZSBzdHJpY3QnO1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgc2FuaXRpemVVcmwgPSByZXF1aXJlKCcuL3Nhbml0aXplVXJsJyksXHJcbiAgICBnZXRVcmxRdWVyeSA9IHJlcXVpcmUoJy4uL2dldFVybFF1ZXJ5Jyk7XHJcblxyXG4vLyBJbml0OiBMb2FkIHNhdmVkIGNvcHkgZnJvbSBzZXNzaW9uU3RvcmFnZVxyXG52YXIgc2Vzc2lvbiA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oJ2hhc2hiYW5nSGlzdG9yeS5zdG9yZScpO1xyXG4vLyBPciBjcmVhdGUgYSBuZXcgb25lXHJcbmlmICghc2Vzc2lvbikge1xyXG4gICAgc2Vzc2lvbiA9IHtcclxuICAgICAgICAvLyBTdGF0ZXMgYXJyYXkgd2hlcmUgZWFjaCBpbmRleCBpcyB0aGUgU1VJRCBjb2RlIGFuZCB0aGVcclxuICAgICAgICAvLyB2YWx1ZSBpcyBqdXN0IHRoZSB2YWx1ZSBwYXNzZWQgYXMgc3RhdGUgb24gcHVzaFN0YXRlL3JlcGxhY2VTdGF0ZVxyXG4gICAgICAgIHN0YXRlczogW11cclxuICAgIH07XHJcbn1cclxuZWxzZSB7XHJcbiAgICBzZXNzaW9uID0gSlNPTi5wYXJzZShzZXNzaW9uKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gICAgR2V0IHRoZSBTVUlEIG51bWJlclxyXG4gICAgZnJvbSBhIGhhc2ggc3RyaW5nXHJcbioqL1xyXG5mdW5jdGlvbiBnZXRTdWlkKGhhc2gpIHtcclxuICAgIFxyXG4gICAgdmFyIHN1aWQgPSArZ2V0VXJsUXVlcnkoaGFzaCkuX3N1aWQ7XHJcbiAgICBpZiAoaXNOYU4oc3VpZCkpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuIHN1aWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldFN1aWQoaGFzaCwgc3VpZCkge1xyXG4gICAgXHJcbiAgICAvLyBXZSBuZWVkIHRoZSBxdWVyeSwgc2luY2Ugd2UgbmVlZCBcclxuICAgIC8vIHRvIHJlcGxhY2UgdGhlIF9zdWlkIChtYXkgZXhpc3QpXHJcbiAgICAvLyBhbmQgcmVjcmVhdGUgdGhlIHF1ZXJ5IGluIHRoZVxyXG4gICAgLy8gcmV0dXJuZWQgaGFzaC11cmxcclxuICAgIHZhciBxcyA9IGdldFVybFF1ZXJ5KGhhc2gpO1xyXG4gICAgcXMucHVzaCgnX3N1aWQnKTtcclxuICAgIHFzLl9zdWlkID0gc3VpZDtcclxuXHJcbiAgICB2YXIgcXVlcnkgPSBbXTtcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBxcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHF1ZXJ5LnB1c2gocXNbaV0gKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQocXNbcXNbaV1dKSk7XHJcbiAgICB9XHJcbiAgICBxdWVyeSA9IHF1ZXJ5LmpvaW4oJyYnKTtcclxuICAgIFxyXG4gICAgaWYgKHF1ZXJ5KSB7XHJcbiAgICAgICAgdmFyIGluZGV4ID0gaGFzaC5pbmRleE9mKCc/Jyk7XHJcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpXHJcbiAgICAgICAgICAgIGhhc2ggPSBoYXNoLnN1YnN0cigwLCBpbmRleCk7XHJcbiAgICAgICAgaGFzaCArPSAnPycgKyBxdWVyeTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaGFzaDtcclxufVxyXG5cclxuLyoqXHJcbiAgICBBc2sgdG8gcGVyc2lzdCB0aGUgc2Vzc2lvbiBkYXRhLlxyXG4gICAgSXQgaXMgZG9uZSB3aXRoIGEgdGltZW91dCBpbiBvcmRlciB0byBhdm9pZFxyXG4gICAgZGVsYXkgaW4gdGhlIGN1cnJlbnQgdGFzayBtYWlubHkgYW55IGhhbmRsZXJcclxuICAgIHRoYXQgYWN0cyBhZnRlciBhIEhpc3RvcnkgY2hhbmdlLlxyXG4qKi9cclxuZnVuY3Rpb24gcGVyc2lzdCgpIHtcclxuICAgIC8vIEVub3VnaCB0aW1lIHRvIGFsbG93IHJvdXRpbmcgdGFza3MsXHJcbiAgICAvLyBtb3N0IGFuaW1hdGlvbnMgZnJvbSBmaW5pc2ggYW5kIHRoZSBVSVxyXG4gICAgLy8gYmVpbmcgcmVzcG9uc2l2ZS5cclxuICAgIC8vIEJlY2F1c2Ugc2Vzc2lvblN0b3JhZ2UgaXMgc3luY2hyb25vdXMuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oJ2hhc2hiYW5nSGlzdG9yeS5zdG9yZScsIEpTT04uc3RyaW5naWZ5KHNlc3Npb24pKTtcclxuICAgIH0sIDE1MDApO1xyXG59XHJcblxyXG4vKipcclxuICAgIFJldHVybnMgdGhlIGdpdmVuIHN0YXRlIG9yIG51bGxcclxuICAgIGlmIGlzIGFuIGVtcHR5IG9iamVjdC5cclxuKiovXHJcbmZ1bmN0aW9uIGNoZWNrU3RhdGUoc3RhdGUpIHtcclxuICAgIFxyXG4gICAgaWYgKHN0YXRlKSB7XHJcbiAgICAgICAgLy8gaXMgZW1wdHk/XHJcbiAgICAgICAgZm9yKHZhciBpIGluIHN0YXRlKSB7XHJcbiAgICAgICAgICAgIC8vIE5vXHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gaXRzIGVtcHR5XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICAvLyBBbnl0aGluZyBlbHNlXHJcbiAgICByZXR1cm4gc3RhdGU7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgR2V0IGEgY2Fub25pY2FsIHJlcHJlc2VudGF0aW9uXHJcbiAgICBvZiB0aGUgVVJMIHNvIGNhbiBiZSBjb21wYXJlZFxyXG4gICAgd2l0aCBzdWNjZXNzLlxyXG4qKi9cclxuZnVuY3Rpb24gY2Fubm9uaWNhbFVybCh1cmwpIHtcclxuICAgIFxyXG4gICAgLy8gQXZvaWQgc29tZSBiYWQgb3IgcHJvYmxlbWF0aWMgc3ludGF4XHJcbiAgICB1cmwgPSBzYW5pdGl6ZVVybCh1cmwgfHwgJycpO1xyXG4gICAgXHJcbiAgICAvLyBHZXQgdGhlIGhhc2ggcGFydFxyXG4gICAgdmFyIGloYXNoID0gdXJsLmluZGV4T2YoJyMnKTtcclxuICAgIGlmIChpaGFzaCA+IC0xKSB7XHJcbiAgICAgICAgdXJsID0gdXJsLnN1YnN0cihpaGFzaCArIDEpO1xyXG4gICAgfVxyXG4gICAgLy8gTWF5YmUgYSBoYXNoYmFuZyBVUkwsIHJlbW92ZSB0aGVcclxuICAgIC8vICdiYW5nJyAodGhlIGhhc2ggd2FzIHJlbW92ZWQgYWxyZWFkeSlcclxuICAgIHVybCA9IHVybC5yZXBsYWNlKC9eIS8sICcnKTtcclxuXHJcbiAgICByZXR1cm4gdXJsO1xyXG59XHJcblxyXG4vKipcclxuICAgIFRyYWNrcyB0aGUgbGF0ZXN0IFVSTFxyXG4gICAgYmVpbmcgcHVzaGVkIG9yIHJlcGxhY2VkIGJ5XHJcbiAgICB0aGUgQVBJLlxyXG4gICAgVGhpcyBhbGxvd3MgbGF0ZXIgdG8gYXZvaWRcclxuICAgIHRyaWdnZXIgdGhlIHBvcHN0YXRlIGV2ZW50LFxyXG4gICAgc2luY2UgbXVzdCBOT1QgYmUgdHJpZ2dlcmVkXHJcbiAgICBhcyBhIHJlc3VsdCBvZiB0aGF0IEFQSSBtZXRob2RzXHJcbioqL1xyXG52YXIgbGF0ZXN0UHVzaGVkUmVwbGFjZWRVcmwgPSBudWxsO1xyXG5cclxuLyoqXHJcbiAgICBIaXN0b3J5IFBvbHlmaWxsXHJcbioqL1xyXG52YXIgaGFzaGJhbmdIaXN0b3J5ID0ge1xyXG4gICAgcHVzaFN0YXRlOiBmdW5jdGlvbiBwdXNoU3RhdGUoc3RhdGUsIHRpdGxlLCB1cmwpIHtcclxuXHJcbiAgICAgICAgLy8gY2xlYW51cCB1cmxcclxuICAgICAgICB1cmwgPSBjYW5ub25pY2FsVXJsKHVybCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gc2F2ZSBuZXcgc3RhdGUgZm9yIHVybFxyXG4gICAgICAgIHN0YXRlID0gY2hlY2tTdGF0ZShzdGF0ZSkgfHwgbnVsbDtcclxuICAgICAgICBpZiAoc3RhdGUgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgLy8gc2F2ZSBzdGF0ZVxyXG4gICAgICAgICAgICBzZXNzaW9uLnN0YXRlcy5wdXNoKHN0YXRlKTtcclxuICAgICAgICAgICAgdmFyIHN1aWQgPSBzZXNzaW9uLnN0YXRlcy5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICAvLyB1cGRhdGUgVVJMIHdpdGggdGhlIHN1aWRcclxuICAgICAgICAgICAgdXJsID0gc2V0U3VpZCh1cmwsIHN1aWQpO1xyXG4gICAgICAgICAgICAvLyBjYWxsIHRvIHBlcnNpc3QgdGhlIHVwZGF0ZWQgc2Vzc2lvblxyXG4gICAgICAgICAgICBwZXJzaXN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxhdGVzdFB1c2hlZFJlcGxhY2VkVXJsID0gdXJsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIHVwZGF0ZSBsb2NhdGlvbiB0byB0cmFjayBoaXN0b3J5OlxyXG4gICAgICAgIGxvY2F0aW9uLmhhc2ggPSAnIyEnICsgdXJsO1xyXG4gICAgfSxcclxuICAgIHJlcGxhY2VTdGF0ZTogZnVuY3Rpb24gcmVwbGFjZVN0YXRlKHN0YXRlLCB0aXRsZSwgdXJsKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gY2xlYW51cCB1cmxcclxuICAgICAgICB1cmwgPSBjYW5ub25pY2FsVXJsKHVybCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gaXQgaGFzIHNhdmVkIHN0YXRlP1xyXG4gICAgICAgIHZhciBzdWlkID0gZ2V0U3VpZCh1cmwpLFxyXG4gICAgICAgICAgICBoYXNPbGRTdGF0ZSA9IHN1aWQgIT09IG51bGw7XHJcblxyXG4gICAgICAgIC8vIHNhdmUgbmV3IHN0YXRlIGZvciB1cmxcclxuICAgICAgICBzdGF0ZSA9IGNoZWNrU3RhdGUoc3RhdGUpIHx8IG51bGw7XHJcbiAgICAgICAgLy8gaXRzIHNhdmVkIGlmIHRoZXJlIGlzIHNvbWV0aGluZyB0byBzYXZlXHJcbiAgICAgICAgLy8gb3Igc29tZXRoaW5nIHRvIGRlc3Ryb3lcclxuICAgICAgICBpZiAoc3RhdGUgIT09IG51bGwgfHwgaGFzT2xkU3RhdGUpIHtcclxuICAgICAgICAgICAgLy8gc2F2ZSBzdGF0ZVxyXG4gICAgICAgICAgICBpZiAoaGFzT2xkU3RhdGUpIHtcclxuICAgICAgICAgICAgICAgIC8vIHJlcGxhY2UgZXhpc3Rpbmcgc3RhdGVcclxuICAgICAgICAgICAgICAgIHNlc3Npb24uc3RhdGVzW3N1aWRdID0gc3RhdGU7XHJcbiAgICAgICAgICAgICAgICAvLyB0aGUgdXJsIHJlbWFpbnMgdGhlIHNhbWVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBzdGF0ZVxyXG4gICAgICAgICAgICAgICAgc2Vzc2lvbi5zdGF0ZXMucHVzaChzdGF0ZSk7XHJcbiAgICAgICAgICAgICAgICBzdWlkID0gc2Vzc2lvbi5zdGF0ZXMubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSBVUkwgd2l0aCB0aGUgc3VpZFxyXG4gICAgICAgICAgICAgICAgdXJsID0gc2V0U3VpZCh1cmwsIHN1aWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGNhbGwgdG8gcGVyc2lzdCB0aGUgdXBkYXRlZCBzZXNzaW9uXHJcbiAgICAgICAgICAgIHBlcnNpc3QoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGF0ZXN0UHVzaGVkUmVwbGFjZWRVcmwgPSB1cmw7XHJcblxyXG4gICAgICAgIC8vIHVwZGF0ZSBsb2NhdGlvbiB0byB0cmFjayBoaXN0b3J5OlxyXG4gICAgICAgIGxvY2F0aW9uLmhhc2ggPSAnIyEnICsgdXJsO1xyXG4gICAgfSxcclxuICAgIGdldCBzdGF0ZSgpIHtcclxuICAgIFxyXG4gICAgICAgIC8vIEdldCBsYXRlc3Qgc2F2ZWQgc3RhdGUsIHRoYXRzIHRoZSBjdXJyZW50IG9uZVxyXG4gICAgICAgIHZhciBsYXN0ID0gc2Vzc2lvbi5zdGF0ZXMubGVuZ3RoO1xyXG4gICAgICAgIGlmIChsYXN0ID09PSAwKVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHJldHVybiBzZXNzaW9uLnN0YXRlc1tsYXN0IC0gMV07XHJcbiAgICB9LFxyXG4gICAgZ2V0IGxlbmd0aCgpIHtcclxuICAgICAgICByZXR1cm4gd2luZG93Lmhpc3RvcnkubGVuZ3RoO1xyXG4gICAgfSxcclxuICAgIGdvOiBmdW5jdGlvbiBnbyhvZmZzZXQpIHtcclxuICAgICAgICB3aW5kb3cuaGlzdG9yeS5nbyhvZmZzZXQpO1xyXG4gICAgfSxcclxuICAgIGJhY2s6IGZ1bmN0aW9uIGJhY2soKSB7XHJcbiAgICAgICAgd2luZG93Lmhpc3RvcnkuYmFjaygpO1xyXG4gICAgfSxcclxuICAgIGZvcndhcmQ6IGZ1bmN0aW9uIGZvcndhcmQoKSB7XHJcbiAgICAgICAgd2luZG93Lmhpc3RvcnkuZm9yd2FyZCgpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLy8gQXR0YWNoIGhhc2hjYW5nZSBldmVudCB0byB0cmlnZ2VyIEhpc3RvcnkgQVBJIGV2ZW50ICdwb3BzdGF0ZSdcclxudmFyICR3ID0gJCh3aW5kb3cpO1xyXG4kdy5vbignaGFzaGNoYW5nZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgIFxyXG4gICAgdmFyIHVybCA9IGUub3JpZ2luYWxFdmVudC5uZXdVUkw7XHJcbiAgICB1cmwgPSBjYW5ub25pY2FsVXJsKHVybCk7XHJcbiAgICBcclxuICAgIC8vIEFuIFVSTCBiZWluZyBwdXNoZWQgb3IgcmVwbGFjZWRcclxuICAgIC8vIG11c3QgTk9UIHRyaWdnZXIgcG9wc3RhdGVcclxuICAgIGlmICh1cmwgPT09IGxhdGVzdFB1c2hlZFJlcGxhY2VkVXJsKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIFxyXG4gICAgLy8gZ2V0IHN0YXRlIGZyb20gaGlzdG9yeSBlbnRyeVxyXG4gICAgLy8gZm9yIHRoZSB1cGRhdGVkIFVSTCwgaWYgYW55XHJcbiAgICAvLyAoY2FuIGhhdmUgdmFsdWUgd2hlbiB0cmF2ZXJzaW5nXHJcbiAgICAvLyBoaXN0b3J5KS5cclxuICAgIHZhciBzdWlkID0gZ2V0U3VpZCh1cmwpLFxyXG4gICAgICAgIHN0YXRlID0gbnVsbDtcclxuICAgIFxyXG4gICAgaWYgKHN1aWQgIT09IG51bGwpXHJcbiAgICAgICAgc3RhdGUgPSBzZXNzaW9uLnN0YXRlc1tzdWlkXTtcclxuXHJcbiAgICAkdy50cmlnZ2VyKG5ldyAkLkV2ZW50KCdwb3BzdGF0ZScsIHtcclxuICAgICAgICBzdGF0ZTogc3RhdGVcclxuICAgIH0pLCAnaGFzaGJhbmdIaXN0b3J5Jyk7XHJcbn0pO1xyXG5cclxuLy8gRm9yIEhpc3RvcnlBUEkgY2FwYWJsZSBicm93c2Vycywgd2UgbmVlZFxyXG4vLyB0byBjYXB0dXJlIHRoZSBuYXRpdmUgJ3BvcHN0YXRlJyBldmVudCB0aGF0XHJcbi8vIGdldHMgdHJpZ2dlcmVkIG9uIG91ciBwdXNoL3JlcGxhY2VTdGF0ZSBiZWNhdXNlXHJcbi8vIG9mIHRoZSBsb2NhdGlvbiBjaGFuZ2UsIGJ1dCB0b28gb24gdHJhdmVyc2luZ1xyXG4vLyB0aGUgaGlzdG9yeSAoYmFjay9mb3J3YXJkKS5cclxuLy8gV2Ugd2lsbCBsb2NrIHRoZSBldmVudCBleGNlcHQgd2hlbiBpc1xyXG4vLyB0aGUgb25lIHdlIHRyaWdnZXIuXHJcbi8vXHJcbi8vIE5PVEU6IHRvIHRoaXMgdHJpY2sgdG8gd29yaywgdGhpcyBtdXN0XHJcbi8vIGJlIHRoZSBmaXJzdCBoYW5kbGVyIGF0dGFjaGVkIGZvciB0aGlzXHJcbi8vIGV2ZW50LCBzbyBjYW4gYmxvY2sgYWxsIG90aGVycy5cclxuLy8gQUxURVJOQVRJVkU6IGluc3RlYWQgb2YgdGhpcywgb24gdGhlXHJcbi8vIHB1c2gvcmVwbGFjZVN0YXRlIG1ldGhvZHMgZGV0ZWN0IGlmXHJcbi8vIEhpc3RvcnlBUEkgaXMgbmF0aXZlIHN1cHBvcnRlZCBhbmRcclxuLy8gdXNlIHJlcGxhY2VTdGF0ZSB0aGVyZSByYXRoZXIgdGhhblxyXG4vLyBhIGhhc2ggY2hhbmdlLlxyXG4kdy5vbigncG9wc3RhdGUnLCBmdW5jdGlvbihlLCBzb3VyY2UpIHtcclxuICAgIFxyXG4gICAgLy8gRW5zdXJpbmcgaXMgdGhlIG9uZSB3ZSB0cmlnZ2VyXHJcbiAgICBpZiAoc291cmNlID09PSAnaGFzaGJhbmdIaXN0b3J5JylcclxuICAgICAgICByZXR1cm47XHJcbiAgICBcclxuICAgIC8vIEluIG90aGVyIGNhc2UsIGJsb2NrOlxyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxufSk7XHJcblxyXG4vLyBFeHBvc2UgQVBJXHJcbm1vZHVsZS5leHBvcnRzID0gaGFzaGJhbmdIaXN0b3J5O1xyXG4iLCIvKipcclxuICAgIERlZmF1bHQgYnVpbGQgb2YgdGhlIFNoZWxsIGNvbXBvbmVudC5cclxuICAgIEl0IHJldHVybnMgdGhlIFNoZWxsIGNsYXNzIGFzIGEgbW9kdWxlIHByb3BlcnR5LFxyXG4gICAgc2V0dGluZyB1cCB0aGUgYnVpbHQtaW4gbW9kdWxlcyBhcyBpdHMgZGVwZW5kZW5jaWVzLFxyXG4gICAgYW5kIHRoZSBleHRlcm5hbCAnanF1ZXJ5JyBhbmQgJ2V2ZW50cycgKGZvciB0aGUgRXZlbnRFbWl0dGVyKS5cclxuICAgIEl0IHJldHVybnMgdG9vIHRoZSBidWlsdC1pdCBEb21JdGVtc01hbmFnZXIgY2xhc3MgYXMgYSBwcm9wZXJ0eSBmb3IgY29udmVuaWVuY2UuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgZGVwcyA9IHJlcXVpcmUoJy4vZGVwZW5kZW5jaWVzJyksXHJcbiAgICBEb21JdGVtc01hbmFnZXIgPSByZXF1aXJlKCcuL0RvbUl0ZW1zTWFuYWdlcicpLFxyXG4gICAgcGFyc2VVcmwgPSByZXF1aXJlKCcuL3BhcnNlVXJsJyksXHJcbiAgICBhYnNvbHV0aXplVXJsID0gcmVxdWlyZSgnLi9hYnNvbHV0aXplVXJsJyksXHJcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBsb2FkZXIgPSByZXF1aXJlKCcuL2xvYWRlcicpLFxyXG4gICAgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xyXG5cclxuJC5leHRlbmQoZGVwcywge1xyXG4gICAgcGFyc2VVcmw6IHBhcnNlVXJsLFxyXG4gICAgYWJzb2x1dGl6ZVVybDogYWJzb2x1dGl6ZVVybCxcclxuICAgIGpxdWVyeTogJCxcclxuICAgIGxvYWRlcjogbG9hZGVyLFxyXG4gICAgRXZlbnRFbWl0dGVyOiBFdmVudEVtaXR0ZXJcclxufSk7XHJcblxyXG4vLyBEZXBlbmRlbmNpZXMgYXJlIHJlYWR5LCB3ZSBjYW4gbG9hZCB0aGUgY2xhc3M6XHJcbnZhciBTaGVsbCA9IHJlcXVpcmUoJy4vU2hlbGwnKTtcclxuXHJcbmV4cG9ydHMuU2hlbGwgPSBTaGVsbDtcclxuZXhwb3J0cy5Eb21JdGVtc01hbmFnZXIgPSBEb21JdGVtc01hbmFnZXI7XHJcbiIsIi8qKlxyXG4gICAgTG9hZGVyIHV0aWxpdHkgdG8gbG9hZCBTaGVsbCBpdGVtcyBvbiBkZW1hbmQgd2l0aCBBSkFYXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBcclxuICAgIGJhc2VVcmw6ICcvJyxcclxuICAgIFxyXG4gICAgbG9hZDogZnVuY3Rpb24gbG9hZChyb3V0ZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0xPQURFUiBQUk9NSVNFJywgcm91dGUsIHJvdXRlLm5hbWUpO1xyXG4gICAgICAgICAgICByZXNvbHZlKCcnKTtcclxuICAgICAgICAgICAgLyokLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiBtb2R1bGUuZXhwb3J0cy5iYXNlVXJsICsgcm91dGUubmFtZSArICcuaHRtbCcsXHJcbiAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2VcclxuICAgICAgICAgICAgICAgIC8vIFdlIGFyZSBsb2FkaW5nIHRoZSBwcm9ncmFtIGFuZCBubyBsb2FkZXIgc2NyZWVuIGluIHBsYWNlLFxyXG4gICAgICAgICAgICAgICAgLy8gc28gYW55IGluIGJldHdlZW4gaW50ZXJhY3Rpb24gd2lsbCBiZSBwcm9ibGVtYXRpYy5cclxuICAgICAgICAgICAgICAgIC8vYXN5bmM6IGZhbHNlXHJcbiAgICAgICAgICAgIH0pLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTsqL1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59O1xyXG4iLCIvKipcclxuICAgIHBhcnNlVXJsIGZ1bmN0aW9uIGRldGVjdGluZ1xyXG4gICAgdGhlIG1haW4gcGFydHMgb2YgdGhlIFVSTCBpbiBhXHJcbiAgICBjb252ZW5pZW5jZSB3YXkgZm9yIHJvdXRpbmcuXHJcbioqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgZ2V0VXJsUXVlcnkgPSByZXF1aXJlKCcuLi9nZXRVcmxRdWVyeScpLFxyXG4gICAgZXNjYXBlUmVnRXhwID0gcmVxdWlyZSgnLi4vZXNjYXBlUmVnRXhwJyk7XHJcblxyXG5mdW5jdGlvbiBwYXJzZVVybChiYXNlVXJsLCBsaW5rKSB7XHJcblxyXG4gICAgbGluayA9IGxpbmsgfHwgJyc7XHJcblxyXG4gICAgdmFyIHJhd1VybCA9IGxpbms7XHJcblxyXG4gICAgLy8gaGFzaGJhbmcgc3VwcG9ydDogcmVtb3ZlIHRoZSAjISBvciBzaW5nbGUgIyBhbmQgdXNlIHRoZSByZXN0IGFzIHRoZSBsaW5rXHJcbiAgICBsaW5rID0gbGluay5yZXBsYWNlKC9eIyEvLCAnJykucmVwbGFjZSgvXiMvLCAnJyk7XHJcbiAgICBcclxuICAgIC8vIHJlbW92ZSBvcHRpb25hbCBpbml0aWFsIHNsYXNoIG9yIGRvdC1zbGFzaFxyXG4gICAgbGluayA9IGxpbmsucmVwbGFjZSgvXlxcL3xeXFwuXFwvLywgJycpO1xyXG5cclxuICAgIC8vIFVSTCBRdWVyeSBhcyBhbiBvYmplY3QsIGVtcHR5IG9iamVjdCBpZiBubyBxdWVyeVxyXG4gICAgdmFyIHF1ZXJ5ID0gZ2V0VXJsUXVlcnkobGluayB8fCAnPycpO1xyXG5cclxuICAgIC8vIHJlbW92ZSBxdWVyeSBmcm9tIHRoZSByZXN0IG9mIFVSTCB0byBwYXJzZVxyXG4gICAgbGluayA9IGxpbmsucmVwbGFjZSgvXFw/LiokLywgJycpO1xyXG5cclxuICAgIC8vIFJlbW92ZSB0aGUgYmFzZVVybCB0byBnZXQgdGhlIGFwcCBiYXNlLlxyXG4gICAgdmFyIHBhdGggPSBsaW5rLnJlcGxhY2UobmV3IFJlZ0V4cCgnXicgKyBlc2NhcGVSZWdFeHAoYmFzZVVybCksICdpJyksICcnKTtcclxuXHJcbiAgICAvLyBHZXQgZmlyc3Qgc2VnbWVudCBvciBwYWdlIG5hbWUgKGFueXRoaW5nIHVudGlsIGEgc2xhc2ggb3IgZXh0ZW5zaW9uIGJlZ2dpbmluZylcclxuICAgIHZhciBtYXRjaCA9IC9eXFwvPyhbXlxcL1xcLl0rKVteXFwvXSooXFwvLiopKiQvLmV4ZWMocGF0aCk7XHJcblxyXG4gICAgdmFyIHBhcnNlZCA9IHtcclxuICAgICAgICByb290OiB0cnVlLFxyXG4gICAgICAgIG5hbWU6IG51bGwsXHJcbiAgICAgICAgc2VnbWVudHM6IG51bGwsXHJcbiAgICAgICAgcGF0aDogbnVsbCxcclxuICAgICAgICB1cmw6IHJhd1VybCxcclxuICAgICAgICBxdWVyeTogcXVlcnlcclxuICAgIH07XHJcblxyXG4gICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgcGFyc2VkLnJvb3QgPSBmYWxzZTtcclxuICAgICAgICBpZiAobWF0Y2hbMV0pIHtcclxuICAgICAgICAgICAgcGFyc2VkLm5hbWUgPSBtYXRjaFsxXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYXRjaFsyXSkge1xyXG4gICAgICAgICAgICAgICAgcGFyc2VkLnBhdGggPSBtYXRjaFsyXTtcclxuICAgICAgICAgICAgICAgIHBhcnNlZC5zZWdtZW50cyA9IG1hdGNoWzJdLnJlcGxhY2UoL15cXC8vLCAnJykuc3BsaXQoJy8nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHBhcnNlZC5wYXRoID0gJy8nO1xyXG4gICAgICAgICAgICAgICAgcGFyc2VkLnNlZ21lbnRzID0gW107XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHBhcnNlZDtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBwYXJzZVVybDsiLCIvKipcclxuICAgIHNhbml0aXplVXJsIHV0aWxpdHkgdGhhdCBlbnN1cmVzXHJcbiAgICB0aGF0IHByb2JsZW1hdGljIHBhcnRzIGdldCByZW1vdmVkLlxyXG4gICAgXHJcbiAgICBBcyBmb3Igbm93IGl0IGRvZXM6XHJcbiAgICAtIHJlbW92ZXMgcGFyZW50IGRpcmVjdG9yeSBzeW50YXhcclxuICAgIC0gcmVtb3ZlcyBkdXBsaWNhdGVkIHNsYXNoZXNcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIHNhbml0aXplVXJsKHVybCkge1xyXG4gICAgcmV0dXJuIHVybC5yZXBsYWNlKC9cXC57Mix9L2csICcnKS5yZXBsYWNlKC9cXC97Mix9L2csICcvJyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2FuaXRpemVVcmw7IiwiLyoqIEFwcE1vZGVsIGV4dGVuc2lvbixcclxuICAgIGZvY3VzZWQgb24gdGhlIEV2ZW50cyBBUElcclxuKiovXHJcbid1c2Ugc3RyaWN0JztcclxudmFyIENhbGVuZGFyRXZlbnQgPSByZXF1aXJlKCcuLi9tb2RlbHMvQ2FsZW5kYXJFdmVudCcpLFxyXG4gICAgYXBpSGVscGVyID0gcmVxdWlyZSgnLi4vdXRpbHMvYXBpSGVscGVyJyk7XHJcblxyXG5leHBvcnRzLmV4dGVuZHMgPSBmdW5jdGlvbiAoQXBwTW9kZWwpIHtcclxuICAgIFxyXG4gICAgYXBpSGVscGVyLmRlZmluZUNydWRBcGlGb3JSZXN0KHtcclxuICAgICAgICBleHRlbmRlZE9iamVjdDogQXBwTW9kZWwucHJvdG90eXBlLFxyXG4gICAgICAgIE1vZGVsOiBDYWxlbmRhckV2ZW50LFxyXG4gICAgICAgIG1vZGVsTmFtZTogJ0NhbGVuZGFyRXZlbnQnLFxyXG4gICAgICAgIG1vZGVsTGlzdE5hbWU6ICdDYWxlbmRhckV2ZW50cycsXHJcbiAgICAgICAgbW9kZWxVcmw6ICdldmVudHMnLFxyXG4gICAgICAgIGlkUHJvcGVydHlOYW1lOiAnY2FsZW5kYXJFdmVudElEJ1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8qKiAjIEFQSVxyXG4gICAgICAgIEFwcE1vZGVsLnByb3RvdHlwZS5nZXRFdmVudHM6OlxyXG4gICAgICAgIEBwYXJhbSB7b2JqZWN0fSBmaWx0ZXJzOiB7XHJcbiAgICAgICAgICAgIHN0YXJ0OiBEYXRlLFxyXG4gICAgICAgICAgICBlbmQ6IERhdGUsXHJcbiAgICAgICAgICAgIHR5cGVzOiBbMywgNV0gLy8gW29wdGlvbmFsXSBMaXN0IEV2ZW50VHlwZXNJRHNcclxuICAgICAgICB9XHJcbiAgICAgICAgLS0tXHJcbiAgICAgICAgQXBwTW9kZWwucHJvdG90eXBlLmdldEV2ZW50XHJcbiAgICAgICAgLS0tXHJcbiAgICAgICAgQXBwTW9kZWwucHJvdG90eXBlLnB1dEV2ZW50XHJcbiAgICAgICAgLS0tXHJcbiAgICAgICAgQXBwTW9kZWwucHJvdG90eXBlLnBvc3RFdmVudFxyXG4gICAgICAgIC0tLVxyXG4gICAgICAgIEFwcE1vZGVsLnByb3RvdHlwZS5kZWxFdmVudFxyXG4gICAgICAgIC0tLVxyXG4gICAgICAgIEFwcE1vZGVsLnByb3RvdHlwZS5zZXRFdmVudFxyXG4gICAgKiovXHJcbn07IiwiLyoqIEFwcE1vZGVsLCBjZW50cmFsaXplcyBhbGwgdGhlIGRhdGEgZm9yIHRoZSBhcHAsXHJcbiAgICBjYWNoaW5nIGFuZCBzaGFyaW5nIGRhdGEgYWNyb3NzIGFjdGl2aXRpZXMgYW5kIHBlcmZvcm1pbmdcclxuICAgIHJlcXVlc3RzXHJcbioqL1xyXG52YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpLFxyXG4gICAgTW9kZWwgPSByZXF1aXJlKCcuLi9tb2RlbHMvTW9kZWwnKSxcclxuICAgIFVzZXIgPSByZXF1aXJlKCcuLi9tb2RlbHMvVXNlcicpLFxyXG4gICAgUmVzdCA9IHJlcXVpcmUoJy4uL3V0aWxzL1Jlc3QnKSxcclxuICAgIGxvY2FsZm9yYWdlID0gcmVxdWlyZSgnbG9jYWxmb3JhZ2UnKTtcclxuXHJcbmZ1bmN0aW9uIEFwcE1vZGVsKHZhbHVlcykge1xyXG5cclxuICAgIE1vZGVsKHRoaXMpO1xyXG4gICAgXHJcbiAgICB0aGlzLm1vZGVsLmRlZlByb3BlcnRpZXMoe1xyXG4gICAgICAgIHVzZXI6IFVzZXIubmV3QW5vbnltb3VzKClcclxuICAgIH0sIHZhbHVlcyk7XHJcbn1cclxuXHJcbi8qKiBJbml0aWFsaXplIGFuZCB3YWl0IGZvciBhbnl0aGluZyB1cCAqKi9cclxuQXBwTW9kZWwucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiBpbml0KCkge1xyXG4gICAgXHJcbiAgICAvLyBOT1RFOiBVUkwgdG8gYmUgdXBkYXRlZFxyXG4gICAgLy90aGlzLnJlc3QgPSBuZXcgUmVzdCgnaHR0cDovL2Rldi5sb2Nvbm9taWNzLmNvbS9lbi1VUy9yZXN0LycpO1xyXG4gICAgdGhpcy5yZXN0ID0gbmV3IFJlc3QoJ2h0dHA6Ly9sb2NhbGhvc3Qvc291cmNlL2VuLVVTL3Jlc3QvJyk7XHJcbiAgICBcclxuICAgIC8vIFNldHVwIFJlc3QgYXV0aGVudGljYXRpb25cclxuICAgIHRoaXMucmVzdC5vbkF1dGhvcml6YXRpb25SZXF1aXJlZCA9IGZ1bmN0aW9uKHJldHJ5KSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy50cnlMb2dpbigpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIC8vIExvZ2dlZCEgSnVzdCByZXRyeVxyXG4gICAgICAgICAgICByZXRyeSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfS5iaW5kKHRoaXMpO1xyXG4gICAgXHJcbiAgICAvLyBMb2NhbCBkYXRhXHJcbiAgICAvLyBUT0RPIEludmVzdGlnYXRlIHdoeSBhdXRvbWF0aWMgc2VsZWN0aW9uIGFuIEluZGV4ZWREQiBhcmVcclxuICAgIC8vIGZhaWxpbmcgYW5kIHdlIG5lZWQgdG8gdXNlIHRoZSB3b3JzZS1wZXJmb3JtYW5jZSBsb2NhbHN0b3JhZ2UgYmFjay1lbmRcclxuICAgIGxvY2FsZm9yYWdlLmNvbmZpZyh7XHJcbiAgICAgICAgbmFtZTogJ0xvY29ub21pY3NBcHAnLFxyXG4gICAgICAgIHZlcnNpb246IDAuMSxcclxuICAgICAgICBzaXplIDogNDk4MDczNiwgLy8gU2l6ZSBvZiBkYXRhYmFzZSwgaW4gYnl0ZXMuIFdlYlNRTC1vbmx5IGZvciBub3cuXHJcbiAgICAgICAgc3RvcmVOYW1lIDogJ2tleXZhbHVlcGFpcnMnLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uIDogJ0xvY29ub21pY3MgQXBwJyxcclxuICAgICAgICBkcml2ZXI6IGxvY2FsZm9yYWdlLkxPQ0FMU1RPUkFHRVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIC8vIEdldCB1c2VyIGRhdGEgZnJvbSB0aGUgY2FjaGVkIHByb2ZpbGUgaWYgYW55XHJcbiAgICAvLyAod2lsbCBiZSB1cGRhdGVkIGxhdGVyXHJcbiAgICAvLyB3aXRoIGEgbmV3IGxvZ2luIGF0dGVtcHQpXHJcbiAgICBsb2NhbGZvcmFnZS5nZXRJdGVtKCdwcm9maWxlJykudGhlbihmdW5jdGlvbihwcm9maWxlKSB7XHJcbiAgICAgICAgaWYgKHByb2ZpbGUpIHtcclxuICAgICAgICAgICAgLy8gU2V0IHVzZXIgZGF0YVxyXG4gICAgICAgICAgICB0aGlzLnVzZXIoKS5tb2RlbC51cGRhdGVXaXRoKHByb2ZpbGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgLy8gRmlyc3QgYXR0ZW1wdCB0byBsb2dpbiBmcm9tIHNhdmVkIGNyZWRlbnRpYWxzXHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgLy8gV2UganVzdCB3YW50IHRvIGNoZWNrIGlmIGNhbiBnZXQgbG9nZ2VkLlxyXG4gICAgICAgIC8vIEFueSByZXN1bHQsIGp1c3QgcmV0dXJuIHN1Y2Nlc3M6XHJcbiAgICAgICAgdGhpcy50cnlMb2dpbigpLnRoZW4ocmVzb2x2ZSwgZnVuY3Rpb24oZG9lc25NYXR0ZXIpe1xyXG4gICAgICAgICAgICAvLyBqdXN0IHJlc29sdmUgd2l0aG91dCBlcnJvciAocGFzc2luZyBpbiB0aGUgZXJyb3JcclxuICAgICAgICAgICAgLy8gd2lsbCBtYWtlIHRoZSBwcm9jZXNzIHRvIGZhaWwpXHJcbiAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICB9KTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIEFjY291bnQgbWV0aG9kc1xyXG4qKi9cclxuQXBwTW9kZWwucHJvdG90eXBlLnRyeUxvZ2luID0gZnVuY3Rpb24gdHJ5TG9naW4oKSB7XHJcbiAgICAvLyBHZXQgc2F2ZWQgY3JlZGVudGlhbHNcclxuICAgIHJldHVybiBsb2NhbGZvcmFnZS5nZXRJdGVtKCdjcmVkZW50aWFscycpXHJcbiAgICAudGhlbihmdW5jdGlvbihjcmVkZW50aWFscykge1xyXG4gICAgICAgIC8vIElmIHdlIGhhdmUgb25lcywgdHJ5IHRvIGxvZy1pblxyXG4gICAgICAgIGlmIChjcmVkZW50aWFscykge1xyXG4gICAgICAgICAgICAvLyBBdHRlbXB0IGxvZ2luIHdpdGggdGhhdFxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sb2dpbihcclxuICAgICAgICAgICAgICAgIGNyZWRlbnRpYWxzLnVzZXJuYW1lLFxyXG4gICAgICAgICAgICAgICAgY3JlZGVudGlhbHMucGFzc3dvcmRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHNhdmVkIGNyZWRlbnRpYWxzJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxufTtcclxuXHJcbkFwcE1vZGVsLnByb3RvdHlwZS5sb2dpbiA9IGZ1bmN0aW9uIGxvZ2luKHVzZXJuYW1lLCBwYXNzd29yZCkge1xyXG4gICAgICAgIFxyXG4gICAgcmV0dXJuIHRoaXMucmVzdC5wb3N0KCdsb2dpbicsIHtcclxuICAgICAgICB1c2VybmFtZTogdXNlcm5hbWUsXHJcbiAgICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkLFxyXG4gICAgICAgIHJldHVyblByb2ZpbGU6IHRydWVcclxuICAgIH0pLnRoZW4oZnVuY3Rpb24obG9nZ2VkKSB7XHJcblxyXG4gICAgICAgIC8vIHVzZSBhdXRob3JpemF0aW9uIGtleSBmb3IgZWFjaFxyXG4gICAgICAgIC8vIG5ldyBSZXN0IHJlcXVlc3RcclxuICAgICAgICB0aGlzLnJlc3QuZXh0cmFIZWFkZXJzID0ge1xyXG4gICAgICAgICAgICBhbHU6IGxvZ2dlZC51c2VySWQsXHJcbiAgICAgICAgICAgIGFsazogbG9nZ2VkLmF1dGhLZXlcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBhc3luYyBsb2NhbCBzYXZlLCBkb24ndCB3YWl0XHJcbiAgICAgICAgbG9jYWxmb3JhZ2Uuc2V0SXRlbSgnY3JlZGVudGlhbHMnLCB7XHJcbiAgICAgICAgICAgIHVzZXJJRDogbG9nZ2VkLnVzZXJJZCxcclxuICAgICAgICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxyXG4gICAgICAgICAgICBwYXNzd29yZDogcGFzc3dvcmRcclxuICAgICAgICB9KTtcclxuICAgICAgICBsb2NhbGZvcmFnZS5zZXRJdGVtKCdwcm9maWxlJywgbG9nZ2VkLnByb2ZpbGUpO1xyXG5cclxuICAgICAgICAvLyBTZXQgdXNlciBkYXRhXHJcbiAgICAgICAgdGhpcy51c2VyKCkubW9kZWwudXBkYXRlV2l0aChsb2dnZWQucHJvZmlsZSk7XHJcblxyXG4gICAgICAgIHJldHVybiBsb2dnZWQ7XHJcbiAgICB9LmJpbmQodGhpcykpO1xyXG59O1xyXG5cclxuQXBwTW9kZWwucHJvdG90eXBlLmxvZ291dCA9IGZ1bmN0aW9uIGxvZ291dCgpIHtcclxuICAgICAgICBcclxuICAgIHJldHVybiB0aGlzLnJlc3QucG9zdCgnbG9nb3V0JykudGhlbihmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdGhpcy5yZXN0LmV4dHJhSGVhZGVycyA9IG51bGw7XHJcbiAgICAgICAgbG9jYWxmb3JhZ2UucmVtb3ZlSXRlbSgnY3JlZGVudGlhbHMnKTtcclxuICAgIH0uYmluZCh0aGlzKSk7XHJcbn07XHJcblxyXG5BcHBNb2RlbC5wcm90b3R5cGUuZ2V0VXBjb21pbmdCb29raW5ncyA9IGZ1bmN0aW9uIGdldFVwY29taW5nQm9va2luZ3MoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yZXN0LmdldCgndXBjb21pbmctYm9va2luZ3MnKTtcclxufTtcclxuXHJcbkFwcE1vZGVsLnByb3RvdHlwZS5nZXRCb29raW5nID0gZnVuY3Rpb24gZ2V0Qm9va2luZyhpZCkge1xyXG4gICAgcmV0dXJuIHRoaXMucmVzdC5nZXQoJ2dldC1ib29raW5nJywgeyBib29raW5nSUQ6IGlkIH0pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBcHBNb2RlbDtcclxuXHJcbi8vIENsYXNzIHNwbGl0ZWQgaW4gZGlmZmVyZW50IGZpbGVzIHRvIG1pdGlnYXRlIHNpemUgYW5kIG9yZ2FuaXphdGlvblxyXG4vLyBidXQga2VlcGluZyBhY2Nlc3MgdG8gdGhlIGNvbW1vbiBzZXQgb2YgbWV0aG9kcyBhbmQgb2JqZWN0cyBlYXN5IHdpdGhcclxuLy8gdGhlIHNhbWUgY2xhc3MuXHJcbi8vIExvYWRpbmcgZXh0ZW5zaW9ucy9wYXJ0aWFsczpcclxucmVxdWlyZSgnLi9BcHBNb2RlbC1ldmVudHMnKS5leHRlbmRzKEFwcE1vZGVsKTtcclxuIiwiLyoqIE5hdkFjdGlvbiB2aWV3IG1vZGVsLlxyXG4gICAgSXQgYWxsb3dzIHNldC11cCBwZXIgYWN0aXZpdHkgZm9yIHRoZSBBcHBOYXYgYWN0aW9uIGJ1dHRvbi5cclxuKiovXHJcbnZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JyksXHJcbiAgICBNb2RlbCA9IHJlcXVpcmUoJy4uL21vZGVscy9Nb2RlbCcpO1xyXG5cclxuZnVuY3Rpb24gTmF2QWN0aW9uKHZhbHVlcykge1xyXG4gICAgXHJcbiAgICBNb2RlbCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5tb2RlbC5kZWZQcm9wZXJ0aWVzKHtcclxuICAgICAgICBsaW5rOiAnJyxcclxuICAgICAgICBpY29uOiAnJ1xyXG4gICAgfSwgdmFsdWVzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBOYXZBY3Rpb247XHJcblxyXG4vKiogU3RhdGljLCBzaGFyZWQgYWN0aW9ucyAqKi9cclxuTmF2QWN0aW9uLmdvSG9tZSA9IG5ldyBOYXZBY3Rpb24oe1xyXG4gICAgbGluazogJy8nLFxyXG4gICAgaWNvbjogJ2dseXBoaWNvbiBnbHlwaGljb24taG9tZSdcclxufSk7XHJcblxyXG5OYXZBY3Rpb24uZ29CYWNrID0gbmV3IE5hdkFjdGlvbih7XHJcbiAgICBsaW5rOiAnIyFnby1iYWNrJyxcclxuICAgIGljb246ICdnbHlwaGljb24gZ2x5cGhpY29uLWFycm93LWxlZnQnXHJcbn0pO1xyXG5cclxuTmF2QWN0aW9uLm5ld0l0ZW0gPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICcjIW5ldycsXHJcbiAgICBpY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJ1xyXG59KTtcclxuXHJcbk5hdkFjdGlvbi5uZXdDYWxlbmRhckl0ZW0gPSBuZXcgTmF2QWN0aW9uKHtcclxuICAgIGxpbms6ICcjIWNhbGVuZGFyL25ldycsXHJcbiAgICBpY29uOiAnZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzJ1xyXG59KTtcclxuIl19
;